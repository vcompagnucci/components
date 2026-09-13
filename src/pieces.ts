/* The split is browser vs installed app, which is the line that really
   costs something to cross. Under App live both SwiftUI and Expo/React
   Native: the two of them render real native views, only what you write
   them with changes.

   `platform` DECIDES HOW EACH PIECE IS DEMONSTRATED, and nothing else:
   Web runs live in the browser, App goes in video. This used to be
   decided per piece because Expo COULD run live through
   react-native-web; when Expo moved to video too, the rule collapsed
   into the category and the `runtime` field that held it up stopped
   making sense. */

export type Platform = 'Web' | 'App'

export type Piece = {
  /* THE TITLE: what you read in the index, on the card, in the <h1> of
     the detail and in the browser tab. It is a name and nothing but a
     name (the URL, the folder and the files all come out of `slug`), so
     renaming a piece is changing this line. How it gets chosen is in
     AGENTS.md › How a piece is named, and its length is decided by its
     place in the index (see above PIECES). */
  name: string
  /* THE IDENTIFIER: the public URL (`/hold-to-commit`), the folder its
     code lives in (`src/components/pieces/<slug>/` here and in
     `native/`), the name of its recordings in `public/pieces/`, the name
     of its reference clip in the vault and the name of its sheets in
     `.context/`. It is assigned ONCE, when the piece is published
     (`slug()` over that day's name, which is what Add to Exhibition
     writes) and never touched again: a title can change (on 2026-09-10
     all four changed) and a published URL cannot, because the one
     somebody shared has to keep opening, and everything that carries
     this string in its name would still be called the old thing. It is
     the shape of `data/animations.ts` in react-native-motion:
     `title: 'Stack Toast', slug: 'spring-toast'`. Until that day the
     slug was computed from the name on every read, and that is why the
     computation is still down below: publishing uses it. */
  slug: string
  platform: Platform
  /* The line under the piece in the detail. OPTIONAL since 2026-09-07:
     when the title already says what it is, there is no line (Swipeable
     tabs had one, "Top tabs for React Native & Expo.", and the user
     deleted it: "the one above already says swipeable tabs"). If it
     exists, it is one sentence: what it is and for which platform,
     without naming the reference app (see AGENTS.md › How a piece is
     named). */
  desc?: string
  /* The recording that demonstrates it, in /pieces/ inside public/. Add
     to Exhibition writes it, the right click over a frame of the
     playground, which copies the file and adds the entry: see the
     publish handler in scripts/vault-media.mjs. It belongs to App
     pieces; a Web one runs live (its folder is in
     src/components/pieces/, resolved by slug in demos.tsx) and does not
     carry it. */
  video?: string
  /* The same video with alpha in HEVC (.mov) for Safari, which does not
     play WebM's alpha. An App piece shows transparent and without a
     shadow over the surface of the card, like the Family videos on
     benji.org: the exhibition puts the BACKGROUND there in whatever
     theme is in use, so the background is not baked per theme.
     `pnpm piece:video … --alpha` writes it; without this, `video` goes
     alone. */
  videoHevc?: string
  /* THE SAME PIECE RECORDED IN DARK MODE, for the pieces whose CONTENT
     changes with the system appearance. It does not contradict what is
     above: that one is about the background of the card, which is still
     a single one; this is about what you see inside the phone. Hold to
     commit is the first one like this, and the difference is not
     cosmetic: in light the pill loses the sheen that fills it in dark,
     which is exactly what the piece shows. With these fields, the card
     serves the recording that matches the reader's theme and changes it
     if the system changes; without them, `video` goes for both
     (swipeable-tabs was recorded in a single appearance). */
  videoDark?: string
  videoHevcDark?: string
}

/* THE SLUG COMPUTATION, and there is ONE. Two of them used to live here
   and matched by accident: parts.tsx turned spaces into hyphens,
   routes.mjs threw away anything that was not [a-z0-9]. With the first
   name that carried a sign (`Toggle & switch`) the client was going to
   navigate to a URL that vercel's rewrite did not cover. Since
   2026-09-10 the page does not call it: it reads `slug` from each entry.
   The ones that call it are the ones that ASSIGN a slug, the bridge that
   publishes and `pnpm new` in the workshop with the same computation,
   and that is why it lives here, next to the field it writes. */
export const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/* THE ORDER OF THIS ARRAY IS THE ORDER OF THE EXHIBITION, and it is
   editorial: not chronological, not alphabetical, and it does not sort
   itself. It rules inside each platform (app.tsx groups by `platform`,
   Web and then App) and it is read by the index, the sections of the
   body and the scrollspy.

   The first of the list is the one that opens the exhibition, so Vito
   picks it. Today it is Fan out (Buttons separate back then), asked for
   on 2026-09-10; before that Select summary held the spot, by the
   accident of having been merged first (PR #26 against PR #27) and not
   by a decision. */
/* THE NAMES DRAW A MOUNTAIN IN THE INDEX, and it is on purpose (asked
   for on 2026-09-10: "the longest one in the middle and the short names
   at the ends"). Read from top to bottom, without touching the order
   (which is editorial, see above), the ones at the ends are short and
   the ones in the middle are the longest:

       Fan out               7     45.7 px
       Selection summary    17    117.9 px
       Swipe between tabs   18    124.7 px
       Hold to buy          11     70.6 px

   (RUNTIME · the ink width of each index link, Inter 13 px weight 460,
   measured on 2026-09-10 with headless Chrome over CDP on the served
   page, with the font already loaded.) A new piece comes in with a name
   of the length its place calls for: short if it opens or closes the
   list, long if it lands in the middle.
   All four went through the naming rule (AGENTS.md › How a piece is
   named): the technical term of the part and the specification verb,
   and each one is a phrase that is already in its piece's notes, so the
   title and the page name the thing the same way.

   · Fan out             was Buttons separate. "The four buttons fan out
                         from where the first one sits" (Anatomy).
   · Selection summary   was Select summary. What the button sums up is
                         the selection: the noun where there was a verb.
   · Swipe between tabs  was Swipeable tabs. It is the line the user
                         approved on 2026-09-07 ("Swipe between tabs, tap
                         to select one"), with the HIG's term.
   · Hold to buy         was Hold to commit, the name from the
                         60fps.design catalog. The label of the button
                         at rest says "Hold to Buy" since Vito asked for
                         it as a buy button (2026-09-04); the title says
                         the same.

   Each one's slug stayed the one from its day: see `slug` in `Piece`. */
export const PIECES: Piece[] = [
  /* The first Web piece that was built, and for that reason the first
     one without `video`: it runs live in the list and in the detail,
     resolved by slug in demos.tsx. No `desc` by the same rule as Swipe
     between tabs: the title already says what the gesture is. */
  {
    name: 'Fan out',
    slug: 'buttons-separate',
    platform: 'Web',
  },
  {
    name: 'Selection summary',
    slug: 'select-summary',
    platform: 'Web',
    /* No `desc`: the title already says what it is, which is the first
       rule of AGENTS.md › How a piece is named, and it is what the other
       three pieces do. It had one for a day and it was deleted for the
       same reason as the one on Swipe between tabs. */
  },
  {
    name: 'Swipe between tabs',
    slug: 'swipeable-tabs',
    platform: 'App',
    video: '/pieces/swipeable-tabs.webm',
    videoHevc: '/pieces/swipeable-tabs.mov',
  },
  /* No `desc`: the title already says what the gesture is, which is the
     first rule of AGENTS.md › How a piece is named. Eleven characters. */
  {
    name: 'Hold to buy',
    slug: 'hold-to-commit',
    platform: 'App',
    video: '/pieces/hold-to-commit.webm',
    videoHevc: '/pieces/hold-to-commit.mov',
    videoDark: '/pieces/hold-to-commit-dark.webm',
    videoHevcDark: '/pieces/hold-to-commit-dark.mov',
  },
]
