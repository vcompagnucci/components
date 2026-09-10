/* ═══════════════════════════════════════════════════════════════
   THE LINKS IN A NOTE. Finding them, and knowing what to call them.

   THERE IS NO REACT AND NO NETWORK HERE, ON PURPOSE. This is the part
   of the feature you can look at on its own: a string goes in,
   segments come out. The component draws and the server looks up the
   title; the rules for what IS a link and for how one gets named live
   in a file that depends on neither of them.

   THE NOTE IS STILL PLAIN TEXT. On disk, in the details and in the
   textarea. A link is not a different kind of data, it is a stretch of
   the note that happens to be a URL. Storing segments would have
   created a second model, the text and its parsed version, and the two
   go out of sync the day somebody edits .lima-vault.json by hand. Here
   the parse is redone on every render and it cannot go stale.
   ═══════════════════════════════════════════════════════════════ */

/* A segment is a stretch of the note. `offset` is its position in the
   RAW text, and it exists for one thing. When you tap the reading view
   to edit, the cursor has to go back to the character you tapped.
   Without that count the cursor lands at the end, and editing a long
   note turns into an exercise in patience. */
export type Segment =
  | { kind: 'text'; text: string; offset: number }
  | { kind: 'link'; text: string; offset: number; url: string }

/* ─── WHERE A URL ENDS ───
   The problem is not finding where it starts, since `https://` is not
   ambiguous. The problem is where it CUTS, because the space is not
   always there: almost nobody writes a period after pasting a link,
   but everybody writes "(see https://a.com/x)" and "look at
   https://a.com/x, it is good".

   Two rules, in this order, in a loop until neither one bites:

   1 · Trailing punctuation is not part of the URL. A period, a comma,
       a colon, a closing quote.

   2 · A CLOSING PARENTHESIS CAN BE PART OF IT. Wikipedia and MDN have
       them inside the path, /wiki/Foo_(bar), so you cannot drop one
       blind. They get counted: it is trimmed only if there are more
       closers than openers, that is, if that parenthesis has nobody to
       pair with.

   The loop matters because the two rules chain. "…/Foo_(bar))." asks
   for the period, then the parenthesis, and only then does it sit
   still. */
const PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
const TRAILING_PUNCTUATION = /[.,;:!?'"“”‘’«»]+$/

const trimUrlEnd = (raw: string): string => {
  let s = raw
  for (;;) {
    const before = s
    s = s.replace(TRAILING_PUNCTUATION, '')
    const end = s.at(-1)
    const open = end ? PAIRS[end] : undefined
    if (end && open) {
      const closers = s.split(end).length - 1
      const openers = s.split(open).length - 1
      if (closers > openers) s = s.slice(0, -1)
    }
    if (s === before) return s
  }
}

/* Parsing is not enough: `https://` on its own parses too. A host with
   a dot is required, or localhost, which is what you paste when you
   write down something from your own server. So a bare "https://" or
   an "http://something" stays text instead of becoming a broken link
   that promises to open. */
const isValidUrl = (url: string): boolean => {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    return u.hostname.includes('.') || u.hostname === 'localhost'
  } catch {
    return false
  }
}

export function split(note: string): Segment[] {
  const segments: Segment[] = []
  let start = 0
  for (const m of note.matchAll(/https?:\/\/\S+/gi)) {
    const i = m.index
    const url = trimUrlEnd(m[0])
    if (!isValidUrl(url)) continue
    if (i > start) segments.push({ kind: 'text', text: note.slice(start, i), offset: start })
    segments.push({ kind: 'link', text: url, offset: i, url })
    start = i + url.length
  }
  /* The tail, and the whole note when there is no link at all, comes
     out here. An empty note returns no segments, which is what lets the
     placeholder do its job. */
  if (start < note.length) segments.push({ kind: 'text', text: note.slice(start), offset: start })
  return segments
}

export const hasLink = (note: string): boolean =>
  split(note).some((s) => s.kind === 'link')

/* The host without the www., which says nothing and takes four
   characters off a line that is already tight. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
}

/* ═══════════════════════════════════════════════════════════════
   WHAT A LINK IS CALLED.

   Three candidates in this order, and the first one is the surprise:

   1 · THE FILE NAME IN THE URL, when the URL ends in one. It wins over
       the fetched title, and that is not a preference: it is what
       comes out of measuring the real case. The title GitHub returns
       for a file is

         expo-ui-examples/src/examples/mini-player/tab-layout.tsx at
         main · SchroederNathan/expo-ui-examples

       which is 101 characters, and about 28 fit in the details column
       (230px, 14px). The "informative" title reads
       "expo-ui-examples/src/exampl…" and says nothing; `tab-layout.tsx`
       fits whole and says exactly what it is.

       The rule is narrow on purpose: the last piece of the path AND an
       extension of 1 to 5 characters. It is not "guess which part is
       pretty", it is "this is a file".

   2 · THE PAGE TITLE, if the server got one. It is what Notion does,
       and it is right for everything that is not a file: a tweet, an
       article, a repo.

   3 · THE HOST. When there is no title, because there is no network,
       or the site is down, or it asks for a login, it falls through to
       here and NOT to some invented piece of the URL. `dribbble.com`
       is short, is true and never reads wrong; guessing from the path
       produces things like `x.com/status` or `2090416149670281378`,
       which is worse than saying nothing.

       It is also the state the link is drawn in while the card is in
       flight, so there is never a hole: the label starts at the host
       and gets replaced by the title if one arrives.

   The full URL is never lost. It goes in the anchor's `title`, which
   is the system tooltip.
   ═══════════════════════════════════════════════════════════════ */
export function fileOf(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    const last = parts.at(-1)
    if (!last) return null
    const name = decodeURIComponent(last)
    return /\.[a-z0-9]{1,5}$/i.test(name) ? name : null
  } catch {
    return null
  }
}

/* ─── THE BRAND SUFFIX ───
   "… · GitHub", "… | Vercel", "… – Figma". It is noise: the site is
   already said by the favicon three pixels to the left.

   It comes off only when what follows the separator MATCHES the brand
   in the host, github.com → "github", and not for anything that
   happens to follow a separator. Without that condition, a title that
   really ends in " — the ending" would lose its ending. */
/* ─── A TITLE DOES NOT SHOW URLS ───
   X puts the tweet's t.co inside the title, "…Code below 👇
   https://t.co/hP1ThYW5Bs", and that is exactly what this function
   came to take off the screen: a shortened URL says nothing, cannot be
   read and cannot be remembered. Having it show up INSIDE a link's
   label would be the original defect in a costume.

   The rule is written generically, any http(s) inside a title, and not
   as a special case for t.co: a title showing a URL is showing
   plumbing either way, and a list of shorteners is something you have
   to maintain forever.

   IT TAKES THE SPACE IN FRONT AND GIVES BACK THE PUNCTUATION BEHIND,
   and both halves matter. X closes the title with a quote, so the
   piece to remove is ` https://t.co/xxx"`: without taking the space
   you get a gap before the quote, and taking everything that is not a
   space takes the quote with it and leaves the title unclosed.

   Where the URL ends is decided by `trimUrlEnd`, the same one from
   above, which already knows that a final period is not part of the
   link and that a parenthesis with a partner is. Writing it again here
   would have meant two answers to the same question. */
const withoutUrls = (s: string) =>
  s
    .replace(/\s*https?:\/\/\S+/gi, (chunk) => {
      const tight = chunk.trimStart()
      return tight.slice(trimUrlEnd(tight).length)
    })
    .replace(/\s{2,}/g, ' ')
    .trim()

export function cleanTitle(title: string, url: string): string {
  /* If the title WAS a URL and nothing else, taking it out leaves
     nothing. There we give back what was there: an ugly title beats no
     title. */
  const t = withoutUrls(title.replace(/\s+/g, ' ').trim()) || title.trim()
  const host = hostOf(url)
  const brand = host.split('.').at(-2) ?? host
  /* The slash is on the list because of X, which closes its titles
     with " / X" (measured). It is safe to add because the separator
     alone is not enough: what is left after it has to BE the brand. */
  const m = t.match(/^(.*\S)\s*[·|—–\-:/]\s*([^·|—–\-:/]{1,30})$/)
  if (m && m[2].replace(/\s+/g, '').toLowerCase() === brand.toLowerCase()) return m[1]
  return t
}

/* ─── HOW MUCH GETS SHOWN ───
   A title cannot run loose either: X's title for this same tweet is
   150 characters, and the details column is 280px at 14px, about 40
   per line. Without a ceiling, trading four lines of URL for four
   lines of title fixes nothing.

   80 = two lines. It is the ceiling, not the target: `tab-layout.tsx`
   is 14 and never touches it. The cut looks for the last space so it
   does not break a word in half, unless that leaves the label under
   60% (a title with no spaces), where it cuts hard and moves on.

   IT IS NOT DONE WITH overflow:hidden AND text-overflow:ellipsis,
   which would be the obvious way and would be a bug: an inline element
   with hidden overflow stops having a text baseline (it synthesizes
   one from its bottom edge instead) and the chip rides about 5px above
   the line around it. By cutting the string, the two <span>s stay
   inline and line up on their own. */
export const LABEL_LENGTH = 80

/* ─── WHAT CAN SIT RIGHT BEFORE THE ELLIPSIS ───
   Nothing that is punctuation. The cut lands where it lands, and in a
   real title that leaves things like

     zuriks on X: "got curious about the intro sequence here -…

   where that hyphen separated two sentences and now hangs off nothing.
   It reads as if the label had broken. The ellipsis ALREADY says there
   is more; it does not need a mark to repeat it.

   AND THE QUOTE THAT OPENS AND NEVER CLOSES. X titles its tweets as
   'so-and-so on X: "text"', so cutting through the middle leaves the
   opening one alone, visible in that same example. It is the same
   defect as the dangling hyphen: a mark without its partner. If they
   came out odd, the one that opened comes off.

   BOTH ONLY RUN WHEN TRUNCATING. A title that really ends in a period,
   or that brings its quotes complete, is returned untouched: this is
   not cleaning the title, it is closing a cut.

   THE QUOTE IS NOT ON THIS LIST, AND IT IS THE DETAIL THAT COST. It
   was, and with it a quoted phrase that fit exactly lost BOTH: the
   closing one came off for being at the end, that made the remaining
   ones odd, so the rule below deleted the opening one as well.
   `"one two"` ended up as `one two`.

   A quote at the end can be the one that CLOSES, legitimate, it stays,
   or the one that opened and was left alone, it dangles, it goes.
   Position does not tell them apart; PARITY does. That is why they go
   down separate paths. */
const DANGLING = /[\s\-–—,;:.·|/\\([{«]+$/

const closeCut = (s: string): string => {
  let t = s.replace(DANGLING, '')
  /* Odd = the one that opened was left without a partner. The first
     one comes off, which is precisely that one. */
  if ((t.split('"').length - 1) % 2 === 1) t = t.replace(/\s*"\s*/, ' ')
  /* Again, because taking the quote out can uncover a mark that was
     hiding behind it: 'said: "one' cut leaves 'said:'. */
  return t.replace(DANGLING, '').trim()
}

export function shorten(s: string, max = LABEL_LENGTH): string {
  if (s.length <= max) return s
  const hard = s.slice(0, max)
  const space = hard.lastIndexOf(' ')
  return closeCut(space > max * 0.6 ? hard.slice(0, space) : hard) + '…'
}

export function labelOf(url: string, title?: string): string {
  const t = title?.trim()
  /* ─── A TITLE THAT IS ONLY A URL IS NOT A TITLE: IT IS THE DESTINATION ───
     And it is exactly what t.co returns. Measured: its page does not
     redirect over HTTP, it does it with JavaScript, so the fetch stops
     there, and the only thing it brings back is a <title> that says
     "https://twitter.com/nater02/status/…". Without this branch, a
     link copied from X would be labeled with that whole URL: the
     original defect, back through the side door.

     It gets promoted to URL and the count is redone with it. The
     recursion always ends because the second pass goes without a
     title. */
  if (t && /^https?:\/\/\S+$/i.test(t)) return labelOf(t)
  return shorten(fileOf(url) ?? (t ? cleanTitle(t, url) : hostOf(url)))
}
