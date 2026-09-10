/* ═══════════════════════════════════════════════════════════════
   THE CARD OF A LINK. The title and the favicon of a page.

   It exists for ONE thing: so that a link pasted into a note reads as
   "🐙 tab-layout.tsx" and not as four lines of URL. It is what Notion
   does with a link mention, and it has to go out and look for it
   because neither the title nor the icon is in the URL.

   ─── WHY ON THE SERVER AND NOT ON THE CLIENT ───
   A fetch from the browser to github.com cannot read the response:
   there is no CORS and there is not going to be. Node has no such
   restriction. And it avoids the ugly alternative, which is asking a
   third party service like google.com/s2/favicons for the favicon and
   telling Google about every link you write down.

   ─── THE THREE GUARDS ───
   The same criterion as the media bridge, because this also goes out
   to touch something we do not control:

   1 · http AND https ONLY. A file:// from here would read the disk of
       whoever is running the server.

   2 · NOTHING POINTING INSIDE THE NETWORK. localhost, 127.x, 10.x,
       192.168.x, 172.16-31.x, 169.254.x, ::1 and the .local names stay
       out: without this a note holding http://192.168.1.1/reboot turns
       this endpoint into a remote button against the network of
       whoever runs the vault.
       What gets checked is the LITERAL HOST, not what DNS resolves. A
       public name pointed at a private IP would get through. It is a
       guard proportionate to the real threat here (a URL you pasted
       into your own note), not a complete SSRF filter, and it is said
       out loud so nobody mistakes it for one.

   3 · THE RESPONSE GETS CUT OFF. A six second timeout and 1MB of body,
       read as a stream. A server that dribbles forever cannot hang the
       person who is watching a clip.

       THE CEILING WAS AT 256KB AND IT WAS FAR TOO LOW, with the excuse
       that "the <head> of any page fits with room to spare". Measured
       against a real note from the vault, that is false:

         youtube.com/watch   <title> at byte 697,911
                             </head> at 707,807
                             whole page 1,300,994

       Which means YouTube puts 700KB of inline configuration BEFORE
       saying what the video is called. With 256KB the fetch came back
       fine (ok:true) and with no title, and the link got labeled
       "youtube.com": a silent failure, which is the worst kind. 1MB
       leaves it 300KB of air and is still bounded; the one that really
       cuts is the timeout.

   ─── THE CACHE BELONGS TO THE SESSION ───
   In memory, like the one for frames, and with no TTL: it empties when
   Vite restarts. A title does not change while you are looking at a
   vault, and persisting it would put a cache file inside a folder that
   is yours, the same reason the details live in ONE single hidden
   file. Failures get cached too: if dribbble blocked you, retrying on
   every render is six seconds of waiting per render.
   ═══════════════════════════════════════════════════════════════ */

const TIMEOUT = 6000
const CEILING = 1024 * 1024

/* A real browser. This is not evasion: several sites return a different
   body, or none at all, to an agent they do not recognize, and what we
   want is exactly what the browser you have open next to this would
   see. */
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

const PRIVATE_HOST =
  /^(localhost|127\.|0\.0\.0\.0$|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)|\.local$/i

const cache = new Map()

/* ─── ENTITIES ───
   Measured on the real title from X: `&quot;` and `&#x27;`. Without
   this the label shows "Ever wanted to build Apple Music&#x27;s mini
   player", which is worse than the raw URL. */
const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  middot: '·',
}

const decodeEntities = (s) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body) => {
    if (body[0] === '#') {
      const n =
        body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole
  })

/* ─── THE ICON ───
   Order MEASURED, not assumed (2026-08-23):

     <link rel="icon">        github ✓ (favicon.svg)   x ✓ (/favicon.ico)
     <link rel="apple-touch-icon">
                              github ✗ (does not declare it)
                              x ✓ but /apple-touch-icon.png returns the
                                HTML of the app, 276KB of text/html
     <origin>/favicon.ico     5 of 6 origins tried; dribbble gives 404

   Which means none of the three is enough on its own and the order
   matters: the declared one wins because it is the one the site chose,
   and /favicon.ico is left as the net underneath. It is a convention,
   not a promise.

   The apple-touch-icon ended up in the middle and not first, which was
   the initial idea: Apple's specification asks for it to be opaque, so
   it would be the only one that does not disappear on a dark
   background. It was dropped as the first option because the case of X
   shows that being declared does not mean it can be downloaded. */
const RANK = { icon: 0, 'shortcut icon': 1, 'apple-touch-icon': 2 }

function iconOf(head, base) {
  let best = null
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0]
    const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1]?.trim().toLowerCase()
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]
    if (!rel || !href) continue
    /* "alternate icon" falls in here because of the endsWith: it is the
       PNG github puts next to its SVG, and it works just as well. */
    const rank = RANK[rel] ?? (rel.endsWith('icon') ? 3 : null)
    if (rank === null) continue
    if (best && best.rank <= rank) continue
    try {
      best = { rank, url: new URL(decodeEntities(href), base).toString() }
    } catch {}
  }
  return best?.url ?? new URL('/favicon.ico', base).toString()
}

export async function linkCardOf(rawUrl) {
  if (cache.has(rawUrl)) return cache.get(rawUrl)

  let u
  try {
    u = new URL(rawUrl)
  } catch {
    return { ok: false, reason: 'invalid url' }
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:')
    return { ok: false, reason: 'http and https only' }
  if (PRIVATE_HOST.test(u.hostname)) return { ok: false, reason: 'internal host' }

  let card
  try {
    const r = await fetch(u, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' },
    })
    /* A 404 brings HTML all the same, and its title is "Page not
       found". Saying nothing is better than labeling the link with
       that. */
    if (!r.ok) throw new Error(`http ${r.status}`)

    /* Streamed and with a ceiling: it cuts as soon as the closing of
       the head shows up, which is where everything we are after lives.

       THE SEARCH LOOKS ONLY AT WHAT IS NEW, not at everything piled
       up. With the ceiling at 1MB that stopped being a detail:
       searching </head> over the whole string on every chunk is
       quadratic, and over YouTube's megabyte that is hundreds of full
       passes. The search runs over the chunk that just arrived plus 6
       characters of overlap (the length of "</head>" minus one) so the
       cut is not missed exactly when it falls split between two
       chunks. */
    let html = ''
    let seen = 0
    for await (const chunk of r.body.pipeThrough(new TextDecoderStream('utf-8', { fatal: false }))) {
      html += chunk
      if (/<\/head>/i.test(html.slice(Math.max(0, seen - 6)))) break
      seen = html.length
      if (seen > CEILING) break
    }

    const head = html.split(/<\/head>/i)[0]
    const raw =
      head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ??
      head.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
      ''
    const title = decodeEntities(raw).replace(/\s+/g, ' ').trim()

    card = {
      ok: true,
      /* With no title it returns ok anyway: the icon on its own already
         improves the link, and the client knows to fall back to the
         host for the label. */
      title: title || null,
      icon: iconOf(head, r.url || u.toString()),
      /* ─── WHERE IT ACTUALLY LANDED ───
         After the redirects. It exists because of SHORTENERS: a link
         copied from X is a t.co, and `t.co` as a label says nothing,
         neither what it is nor what site it is from. With the final
         URL, a t.co that leads to GitHub gets labeled GitHub.
         The href of the anchor does NOT change: it is still what you
         wrote. This is for naming, not for navigating. */
      final: r.url || null,
    }
  } catch (e) {
    /* A FAILURE IS NOT AN ERROR OF THE VAULT, and that is why it does
       not travel as one: a site that is down, no network, one behind a
       login or one that cuts off an agent it does not recognize are all
       normal cases for a note that lives for years. It returns the icon
       that can be assembled without reading anything (the /favicon.ico
       convention, which is right in 5 of the 6 origins measured) and
       the client puts the host as the label. The link is never left
       useless: it is still clickable. */
    card = {
      ok: false,
      reason: String(e?.message ?? e),
      title: null,
      icon: new URL('/favicon.ico', u.origin).toString(),
      /* Without having arrived there is no destination to report: the
         client falls back to the host of what you wrote, which is all
         that is known. */
      final: null,
    }
  }

  cache.set(rawUrl, card)
  return card
}
