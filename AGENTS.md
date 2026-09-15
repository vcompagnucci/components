# Interface exhibition: guide for agents

An exhibition of components: web and iOS pieces, each one belonging to
ONE platform, shown on a single page. It is not an installable library.
No code is shown. The detail **is** the product.

Behind it there is a private area that only exists in development: the
**vault** (the wall of references) and the **playground** (the
workshop). The three of them are one single journey, and it is told
below.

> **Are you here to build a piece?** Go straight to
> [**The process, step by step**](#the-process-step-by-step): there is
> one path for **Web** and another one for **App**, both numbered. The
> rest of this file explains WHY each step is the way it is. Read it
> when something does not add up, or before changing something that is
> already decided.

## Starting in a new worktree

```bash
pnpm install
cp .env.example .env.local   # and put your VAULT_DIR in it
pnpm dev                     # http://localhost:3000
pnpm typecheck
pnpm build                   # runs prebuild → regenerates vercel.json
```

Node ≥24, pnpm. Exact versions in `package.json`, no `^` and no `~`.

**The native workshop installs separately**, and only when you are going
to touch an App piece. It has its own `package.json`:

```bash
cd native && pnpm install && pnpm ios:build   # the build is once per machine
```

**What does NOT travel to the worktree.** `node_modules/`, `dist/`,
`.env.local` and **the whole of `.context/`** are gitignored. That last
one matters more than it looks: the log cites `.context/recon/*.md`
as the source of almost every measurement (`TYPE-SYSTEMS.md`,
`RESPONSIVE.md`, `NAVIGATION.md`, `CARDS.md`, `vault/GRILLA.md`,
`vault/REPRODUCTOR.md`) and **none of those files exists here**: they
were written in another worktree and they are not versioned. The
conclusions did survive, because they are in `LOG.md` and in
`DESIGN.md`. If you need the raw number, measure it again. Citing the
file without having opened it does not count.

**The vault does not travel either**: the clips live in a folder of
yours outside the repo. Without `VAULT_DIR`, `/vault` and `/playground`
load all the same and say *"Vault not connected"*; the rest of the app
runs without noticing.

## The journey of a piece

Three stations and one boundary. Each one says what is wired up, what is
done by hand and what does not exist yet.

```
   your folder              /vault                /playground                 /
  (VAULT_DIR)   ───▶   what is EXTERNAL   ───▶   what is YOURS   ───▶   the exhibition
  you drop clips       you watch and note        you iterate your piece   Add to Exhibition

                                                 web: live sketch  →  Web piece (runs)
                                                 app: recording    →  App piece (video)
                              ↑
                      native/ + pnpm record
                      (the App workshop writes
                       its recording in here)
```

The vault publishes nothing. It is the wall of references. Publishing is
the end of the workshop and it lives where your work is: **you choose a
frame on the board and the action appears in the sidebar** (right click:
shortcut).

---

## The process, step by step

What is above is the map; this is the procedure. **Two paths, and the
first thing to decide is which one**, because they do not cross: a Web
piece is built in the browser and published running; an App piece is
built against the simulator and published on video. `platform` decides
it, and one single question decides `platform`: **where does the thing
you are showing run?** Browser → Web. Installed app → App.

The three rules that hold for both paths, before you start:

1. **One mini-decision at a time.** Whatever is not under study stays
   frozen, so that the comparison is clean.
2. **Nothing is claimed without measuring it**, neither your own value
   nor someone else's. See *The evidence rule*, further down.
3. **The why is written at the top of the file and in the log.** A value
   with no receipt is a value someone is going to change without knowing
   what it breaks.

### Path A: a **Web** piece

| # | Step | How |
| --- | --- | --- |
| 0 | Bring the repo up | `pnpm install && pnpm dev` → `localhost:3000` |
| 1 | **Collect the reference** *(optional)* | Drop the clip into `VAULT_DIR/web/`. It shows up in `/vault` on its own |
| 2 | **Study it** *(optional)* | Open the clip: arrows to go frame by frame, `option` for 10, `command` to the edges. Write down `Source` and `Notes` in the details |
| 3 | **Take it to the board** *(optional)* | Right click on the grid → `Open in Playground`, or the ↗ in the detail |
| 4 | **Create the sketch** | On the canvas: `+` → **New sketch**. It writes `src/private/sketches/<slug>.tsx` and puts it on the canvas |
| 5 | **Write** | Edit that file. Vite reloads it inside the frame **without reloading the page**. A broken sketch turns off only its own frame, and it comes back when you save |
| 6 | **Try it** | Click to choose the frame → there the sketch receives the clicks and you can press its buttons. `Escape` to go back to moving it |
| 7 | **Publish** | With the frame chosen, `Add to Exhibition` in the sidebar → name + one line of description (optional: leave it empty and it is not written) → **Add** |
| 8 | **Verify** | It leaves you at `/<slug>` with the component **running**. Look at the home too: the live preview goes in both views |
| 9 | **Write the why** | A comment at the top of the file + an entry in the log (`LOG.md`) |

What happened behind the scenes in step 7: the file was **copied** from
`src/private/sketches/` to `src/components/pieces/<slug>/<slug>.tsx`,
with an `index.tsx` next to it that exports it (it crossed the boundary,
see below) and the entry went into `PIECES`, with its `slug`. **From
there on the canonical one is the published file**; the sketch stays on
your board.

> A published piece **cannot import anything from `src/private/`**. The
> sketch is born self-contained and it has to stay that way.

### Path B: an **App** piece (Expo / React Native)

| # | Step | How |
| --- | --- | --- |
| 0 | Bring the workshop up | `cd native && pnpm install`. **The first time on the machine**, also `pnpm ios:build` (it compiles the dev client). After that `pnpm ios` is enough |
| 1 | **Collect the reference** *(optional)* | Drop someone else's recording into `VAULT_DIR/native/`, study it in `/vault` the way you do in path A |
| 2 | **Create the piece** | `pnpm new "Swipe to pay"` → `native/src/components/pieces/swipe-to-pay/swipe-to-pay-screen.tsx`, with its `index.tsx`. The workshop's index picks it up on its own |
| 3 | **Write** | Edit that file. Metro hot reloads. Available: Reanimated, Gesture Handler, Skia, expo-haptics |
| 4 | **Watch it run** | In the simulator. To go back to the index, **swipe from the left edge** |
| 5 | **Try it on the phone** | It is worth it: the simulator **has no haptics and no 120Hz**. Expo Go + the same Wi-Fi, or `pnpm start --tunnel` |
| 6 | **Record** | `pnpm record swipe-to-pay`. Stop it with Enter. Status bar at 9:41, `--codec h264`, it writes **straight into `VAULT_DIR/native/`** |
| 7 | **Take it to the board** | The recording is already in `/vault`: right click → `Open in Playground` |
| 8 | **Publish** | With the frame chosen, `Add to Exhibition` → name + description → **Add** |
| 9 | **Verify** | It leaves you at `/<slug>` with the video autoplaying in the phone slot |
| 10 | **Write the why** | The same as path A |

What happened behind the scenes in step 8: the video was copied to
`public/pieces/<slug>.<ext>` (the vault does not travel to the deploy)
and the entry went into `PIECES` with `platform: 'App'` and its `video`.
**And the clip got the slug written into its details**, which is what
leaves the door open both ways afterwards: from that clip, `Open in
Exhibition`; from the piece, the line back to the reference. If the
piece got published but the link did not, the answer says so with
`linked: false` instead of staying quiet, and the details panel still
lets you pick the piece by hand.

**If the video arrives LATER** (it gets made separately, someone else
makes it, or the one there was is not the good one), the piece can be
published all the same: with no `video` the card shows the phone slot
empty. When the file is there:

```bash
pnpm piece:video swipeable-tabs mockup/out/exhibition --alpha     # the pair with alpha from `pnpm render:exhibition` (webm + mov), as is, and it fills in `video` and `videoHevc`
pnpm piece:video swipeable-tabs ~/Downloads/final.mp4             # any opaque video: it re-encodes for the web and fills in `video`
```

An App piece is shown **transparent and with no shadow** on the surface
of the card, like the Family videos on benji.org: the exhibition puts
the background there, in whatever theme it is in. The why is in
`mockup/AGENTS.md`.

**That is the BACKGROUND. The RECORDING can be two**, and they are two
different things worth not mixing up. The background of the card is one
single one and no theme is baked inside the video; what can change with
the reader's theme is what you see INSIDE the phone, when the piece
itself draws differently in light and in dark. `hold-to-commit` is the
first case: in light the pill loses the teal sheen it has in dark, and
the card behind it changes color. There you need **two takes and two
pairs with alpha**, and the card serves the one that fits (`videoDark`
and `videoHevcDark` in `PIECES`, chosen with `prefers-color-scheme` in
`parts.tsx`, which also remounts the `<video>` with `key` when the theme
changes). If the piece looks the same in both, one single take and done.
That is what swipeable-tabs does.

```bash
pnpm piece:video hold-to-commit mockup/out/hold-to-commit-light --alpha           # the pair a reader in LIGHT sees → video / videoHevc
pnpm piece:video hold-to-commit mockup/out/hold-to-commit-dark --alpha --dark     # the pair a reader in DARK sees → videoDark / videoHevcDark
```

Watch out for which is which: the pair **without** a suffix is the app
in light, which is what someone with the system in light sees. The name
of the file says the appearance of the APP, not the reader's theme, and
they are the same thing only because the card pairs them that way.

It does not go through the vault, and there is no reason it should: the
vault is what is external. The why and the guards are at the top of
`scripts/piece-video.mjs`.

**The video for X** (the phone in its bezel on a neutral background,
with the camera coming in and going out) is made in `mockup/`
(Remotion): `pnpm assets` → `pnpm verify` → `pnpm studio` →
`pnpm render:both`. **Each video comes out twice**, on a light
background and on a dark background. The whole process and every
mini-decision are in `mockup/AGENTS.md`.

### What applies to both

**The slug is the same string everywhere.** The folder in the native
workshop, the name of the recording's file, the folder of the web demo,
and the public URL. It is the `slug` field of the entry in
`src/pieces.ts`: whoever publishes assigns it **once** (Add to
Exhibition, with `slug()` over the name of that day; `pnpm new` uses the
same calculation) and it is never touched again. The title can change
later (on 2026-09-10 all four changed) and the URL does not: it is the
shape of `data/animations.ts` in react-native-motion (`title: 'Stack
Toast', slug: 'spring-toast'`). If two of them diverge, the piece cannot
find its own material.

**How a piece is named.** The title says **WHAT the gesture is**;
`Source` says **where it came from**. The model is `Swipe to pay`: 12
characters, it does not name the app, and it says exactly what you are
going to see. **The length is decided by the place in the index** (the
user's request of 2026-09-10): read from top to bottom, without touching
the order (which is editorial), the names draw a mountain, short at the
ends and the longest ones in the middle. Today: Buttons spread (14) ·
Selection summary (17) · Swipe between tabs (18) · Hold to buy (11).
Measured as ink and not as characters, which is what the eye reads:
93.2 · 117.9 · 124.7 · 70.6 px (see `pieces.ts`). The cap of 15
characters (Toolbars › Titles in the HIG) holds for the ends; in the
middle you go over it on purpose. A new piece comes in with a name of
the length its place gives it, and it should be a phrase that is already
in its notes, so that the title and the page name the thing the same
way. The title and the line of description follow the naming rule
(Working method): the technical term and the specification verb, no
funny words: "tap to select one", not "tap to jump". **The line of
description is optional, and the first rule is not to have one**: if the
title already says what it is, there is no line (Swipeable tabs had "Top
tabs for React Native & Expo." and the user deleted it: "the one above
already says swipeable tabs", 2026-09-07; `desc?` in `pieces.ts`, and
the detail does not draw the paragraph). If there is a line: **it does
not name the app** (where the piece came from is told in the notes, in
Anatomy, which is where how it was measured is told), and it IS SHORT:
what it is and for which platform, nothing else; the details go in
Anatomy ("this one much, much shorter"). The name of the platform is
"React Native", not the name of a library, and the two of them go with
"&", the way the ecosystem writes them ("React Native & Expo").

**How the line and the notes are written** (it is the "Write the why"
step of both paths; fixed with Swipeable tabs on 2026-09-07, and the log
has every round and every rejection):

1. **Who it is for.** Whoever just watched the video or the demo: what
   they are looking at and what it is made with. You write from what
   you see towards the how, never from the implementation (the version
   that told you "a derived value, the pager passes a segment to the
   tab bar" was rejected as useless).
2. **The shape.** The line, first, if it is needed: if the title
   already says what it is, there is no line (Swipeable tabs does not
   have one). If there is one: what it is and for which platform, one
   sentence, without naming the reference app. The notes: three
   sections at most (`Anatomy`, `Performance` and, only if the piece
   asks for it, `Use cases`), in prose, two to four sentences per
   paragraph, no subheadings inside a section (an h3 per part was
   tried, like josh on /bloom, and rejected on screen). `Anatomy`
   speaks only about the animation the piece is named after, not about
   what surrounds it in the recording, **and it does not name the
   reference**: that attribution lives in the `Source` field of the
   clip in the vault, which is private, and the public text never
   carries it. Until 2026-09-14 the closing sentence of `Anatomy` was
   required to name it, which contradicted the line right above, where
   the description was already forbidden from doing the same thing.
   `Performance`: where it runs and what was measured. No paragraph
   that announces what comes next: the paragraph starts on the first
   fact.
3. **The tone.** Josh Puckett (joshpuckett.me: /bloom, /pasito,
   /melt-effect) for the line and the sections; benji (benji.org: "How
   it works" on /liveline, "The tools" on /drawesome) for the prose
   that connects what you feel to the mechanism. Their pages are read
   served that same day (WebFetch or Chrome DevTools), not from memory,
   and the citation goes in the comment at the top of the file.
4. **The vocabulary.** The naming rule from *Working method*: the
   technical term and the specification verb. "React Native", never the
   name of a library (Reanimated, worklets, Yoga) nor where the symbols
   come from; what those words say gets said plainly ("on the UI
   thread, not in JavaScript"). **In `Use cases`, the vocabulary is
   Apple's HIG**, with the citation served that same day and not from
   memory (the user's request, 2026-09-08: "use what Apple resources
   would put"): its names for the neighboring controls, its numbers
   (with the "about" when Apple puts it there) and its rules. The HIG's
   HTML page is assembled with JavaScript, so `curl` and WebFetch
   return only the title; the text comes out of the documentation API,
   `developer.apple.com/tutorials/data/design/
   human-interface-guidelines/<slug>.json`. **But the guide comes in as
   an explanation, never as an authority, and it is not named** (the
   user's request, 2026-09-08: "do not mention Apple guidelines… use
   them to explain something better, not to say something that is not
   true"). You take its concepts and its numbers and say them plainly
   as your own, with the citation in the comment at the top of the
   file. If a sentence needs the name of whoever wrote the guide in
   order to stand up, the claim does not stand on its own: in Swipeable
   tabs, the paragraph that cited it also claimed two false things and
   it was deleted whole.
5. **The motion rules.** Before writing that the piece meets
   something, audit the code against the skills `animate-expo`,
   `interface-craft` and `better-ui`. Only the rules it meets go in,
   each one with its receipt (file and symbol) in the comment of
   `src/components/pieces/<slug>/notes.tsx`; the ones it breaks on
   purpose, because of the reference, stay in the comment and not in
   the text. If one breaks for no reason, you fix the code first (that
   is how the interruption of the far tap got in).
6. **The writing.** Run the text through `better-writing`: words a
   tired reader gets on the first pass, no idioms ("mid-flight", "in
   step", "cue"), and every word that is not working gets deleted. And
   through `animation-vocabulary`: the glossary's terms where they do
   not clash with the naming rule (`ease-out`, "reduced motion";
   "widens" before "morph"). **No dash in the public text**, neither em
   dash nor en dash (the user's request, 2026-09-08: "do not use the en
   dash"): wherever one shows up, it is either two sentences or a
   colon, and both exits are plainer than the dash. Compound-word
   hyphens stay (`ease-out`, `top-level`). Since 2026-09-10 the rule
   covers the source too: the comments went from 197 dashes to 15, and
   every one that stays is the character itself and not punctuation (the
   placeholder for an empty value, the dash an empty list draws, the
   entity table in `scripts/link-card.mjs`, the separator class in the
   title parser).

   **One single name per thing, across the WHOLE page, not per
   section.** It is the `better-writing` rule that finds the most
   around here, and none of its failures shows up if you read one
   section alone: in Swipeable tabs the row was "row" in two sections
   and "bar" in the third (the file's internal name, `tab-bar.tsx`,
   leaking into the public text), the same tab was "chosen" and
   "active" in one same paragraph, and there was one single contraction
   in eleven paragraphs. Look for synonyms of the same object, stray
   contractions, pronouns whose nearest antecedent is the wrong noun,
   and names of files from the repo that slipped in. And decide who
   "you" is: if the reader is the one who touches the piece, "you"; if
   the reader builds for others, "people" is whoever uses their app.

   **And a concision pass at the end**, when the content is already
   closed and verified (the user's request, 2026-09-08: "now that you
   have it all… leave it much more concise"). It gives between 15 and
   20 % without touching a single claim, and it always finds the same
   things, in this order: internal redundancy (the same idea two or
   three times in one paragraph), redundancy BETWEEN sections (it only
   shows up if you read the whole page) and periphrasis where a verb
   goes ("Tap a tab and it becomes the active one" → "A tap makes a tab
   active"). Measure in words before and after, and say the number.
   After this pass you run step 8 again, because the wrap changed.
7. **The truthfulness.** Reread every claim against the code and the
   measurement tables, before and after writing. What is not measured
   is not claimed; what is SOURCE (a configuration) is marked that way
   in the comment; every correction gets recorded.

   **`Performance` also gets reread "like a senior engineer"** before
   closing, and that reading finds another class of error that literal
   truthfulness lets through: technical imprecision. The four from
   Swipeable tabs work as a template. Say "not the JavaScript thread",
   never "not in JavaScript" (worklets are JavaScript too, they run in
   the UI runtime). Say what the system does and what we do: if the
   scroll is native, that is the main reason the gesture costs nothing,
   and keeping quiet about it hides the mechanism. Tell an optimization
   by its COST (how many lists, how many rows, mounted since when) and
   not as an anecdote. And say WHERE it was measured: `animate-expo`
   only counts a release build on the slowest device, and a recording
   of the simulator is a receipt for the take, not for the phone.
8. **The verification on screen.** Chrome DevTools over the served
   page: the exact text of every paragraph, the number of paragraphs,
   that no library names and no old sentences are left; light and dark
   if the CSS was touched. And after the merge, the same reading in
   production.
9. **The record.** Every decision and every rejection in `LOG.md`
   and in the comment at the top of
   `src/components/pieces/<slug>/notes.tsx`, with the user's quotation
   and the date. `pnpm typecheck && pnpm build`, one commit per
   mini-decision that says what and why, push, PR with squash.

**Publishing overwrites nothing.** A repeated name → 409. And the server
does both writes or neither: if the entry in `PIECES` fails, the copied
file is withdrawn.

**Before calling something finished**, on both paths:

```bash
pnpm typecheck && pnpm lint && pnpm build && pnpm references
pnpm --dir native typecheck           # the workshop, if you touched it
```

Four commands and not two, because they see four different things.
`tsc` says this does not close; oxlint says this compiles and is wrong;
the build is the only place the production fold gets verified; and
`pnpm references` reads the comments, which is the one thing the other
three cannot (`scripts/references.mjs`). None of them gets weakened to
pass: see *The code*.

### What NOT to do

- **Do not publish someone else's material.** The vault's clips are
  references from other apps; the inventory carries only pieces that
  were really built. If you publish something to try it out, revert it:
  delete the entry from `PIECES` and the file from `public/pieces/` or
  the folder from `src/components/pieces/`.
- **Do not import from `src/private/` in the product.** The dependency
  goes in one direction only, or the private area ends up in the bundle.
- **Do not add placeholders.** Around here 18 scaffolding pieces were
  deleted before the first real one, so that nothing generic gets
  mistaken for a decision.
- **No `npm install` inside `native/`.** `expo install` picks the
  versions, and it respects what the SDK verified.
- **Do not leave test sketches** in `src/private/sketches/` or test
  recordings in the vault.

---

## The three stations, on the inside

Up to here, what to do. From here on, **why each step is the way it is**
and what sits underneath each one. This is what to read before changing
something that is already decided.

### 1 · The vault: what you look at

**A file comes in, not a record.** You drop a video or an image into
`VAULT_DIR` and it shows up in the grid. The folder **is** the manifest:
the name comes from the name of the file, `native`/`web` from the
subfolder you dropped it into, the date from the file system
(`src/private/clips.ts`). There is no JSON to maintain, and that is why
the vault cannot lie. A manifest kept by hand goes out of sync the day
you drag something in without editing it.

**The bridge is a Vite plugin**, `scripts/vault-media.mjs`, with
`apply: 'serve'`: in `vite build` it is not even instantiated. It serves
the media at `/vault-media/` plus nine endpoints (`__index`,
`__details`, `__views`, `__rename`, `__trash`, `__upload`, `__link`,
`__sketch`, `__publish`) and **three guards**, because this may be
pointing at your Obsidian: an allowlist of extensions, nothing that
starts with a dot, `realpath` on both sides.

**What you write down yourself** (`notes`, `source`, `device`) lives in
`.lima-vault.json`, at the root of the vault and next to the clips.
They are the same ones the server validates: adding one here without
adding it there discards it on save, silently.

**And a fourth, `piece`**, which is not free text: the slug of the piece
this clip produced. It is what makes the vault a two-way door. The
server checks it against the slugs in `pieces.ts` and answers 400 for
one that names nothing, instead of dropping it like an unknown field,
because a link you cannot follow is worse than no link. It gets written
on its own when you publish an App piece from the clip, which is the
moment the fact comes into being, and by hand in the details panel for
the clips whose piece was published before the field existed.

**The detail exists for measuring.** The player goes frame by
frame with the arrows (on its own 1 · option 10 · command to the edges)
and it reads the step from the mp4's container instead of estimating it
(`scripts/frames.mjs`).

**The way out to the workshop**: in the grid, right click → `Open in
Playground`. Inside a clip, the ↗ icon in the header. Both call the same
thing, `toPlayground(path)` in `views.ts`.

**The way out to the exhibition**, when the clip has a `piece`: right
click → `Open in Exhibition`, and its own icon beside the ↗. It needs no
helper, because the slug IS the URL. The icon goes FIRST in that row and
not last: the group is pushed against the rail with `margin-left: auto`,
so it grows leftward and a button added at the head leaves the arrow and
the details toggle where they were. Measured in the served detail, with
and without it: both stay at the same x.

**The loop goes one way only.** A clip in the vault offers the piece it
produced; a piece does NOT offer the clip it came from. A line at the
foot of the detail used to do that, dev-only, and it was deleted on
2026-09-14 because it put the name of the reference on the page. The
attribution is the vault's `Source` field and it stays there.

### 2 · The playground: where things get built

**Views = canvases**, like going into different Figma files. Unlike the
clips, this is **not** derived from the disk: a view exists because you
created it, so there is something to maintain and it lives in
`.lima-playground.json`, also at the root of the vault. Not in
`localStorage`, on purpose: a view references clips by their path, so it
belongs in the same place they do.

**A frame is a thing placed on the canvas**, and it has three kinds:
`clip` (`ref` = the path of the file in the vault), `sketch` (`ref` =
the name of its file in `src/private/sketches/`) and `piece` (`ref` =
the name of the piece; not drawn yet). It is always a **reference and
not a copy**: if you change a clip's details or write in a sketch, the
frame showing it is already up to date; if the clip leaves the vault,
the frame stays there saying what it pointed at, instead of disappearing
without anyone noticing.

**`toPlayground` does not open a picker.** The clip lands in the most
recent view (the one with the highest `created`) and if there is none,
it creates one: sending something to the playground has to work the
first time you press it. It is born at 480×270 and the canvas corrects
its proportion when the media finishes loading.

**⌘Z and ⇧⌘Z undo in here**, by snapshots of the whole document: 100
steps, in memory, emptied on reload. In the vault ⌘Z is still *back*.
The playground listens in the capture phase and the one in `private.tsx`
steps aside when it sees the event marked, so who wins does not depend
on the mount order.

**Writing a component from scratch: the sketches.** A `sketch` frame is
**a real file** in `src/private/sketches/`, which exports a component by
default. `New sketch`, in the `+` dialog, creates the file and puts it
on the canvas; then you open it in your editor (or hand it to an agent)
and write. Vite reloads it inside the frame **without reloading the
page**: nothing loses its position.

That is, on purpose, the shortest path for both ways of working: an
agent writes files, it does not type into a textarea, so if the sketch
IS a file the two are the same and neither one needs an interface. That
is also why there is no editor inside the browser.

Three things worth knowing before you touch it:

- **A broken sketch does not take the board down.** Each one goes inside
  an error boundary, so the only thing that turns off is its frame, and
  it comes back on its own at the next save, without reloading.
- **The pointer is shared out by selection.** Without choosing, the
  frame drags; chosen, the sketch receives the clicks and you can try
  out what you are building. To go back to moving it, Escape.
- **It is web only.** An App piece does not get built here: it gets
  built against the simulator, with the agent alongside, and it reaches
  the exhibition as a video (see below).

**And publishing happens here.** With a frame chosen, `Add to
Exhibition` appears in the sidebar (below the index, the pattern of
Figma's selection panel collapsed into the panel that already exists)
and the right click offers it as a shortcut. A sketch comes out as a
live Web piece, a recording as an App piece. The detail is in section 3.

**What is still missing** is `kind: 'piece'`: it is in the model and
nothing creates it: if a frame arrived with that kind, a slot with the
word `Piece` gets drawn. The scaffolding is in place and written down;
what is missing is the piece that opens it.

### 3 · The exhibition: the public part

`src/pieces.ts` is the inventory, and **it is empty on purpose**: the 18
placeholders were deleted whole before the first real piece, so that
nothing generic gets mistaken for a decision. The first one defines the
mold.

**Publishing is a gesture of the board.** You choose the frame and `Add
to Exhibition` appears in the sidebar (the right click repeats it as a
shortcut): a name (it arrives filled in) and one line of description,
optional (empty, and the field is not written). They are the two lines
of the public detail; with no line, the detail goes from the preview
straight to the notes (Swipeable tabs, since 2026-09-07). **The frame
says the platform**, not a selector:

- a **sketch** frame publishes a **Web** piece: its file gets copied
  from `src/private/sketches/` to
  `src/components/pieces/<slug>/<slug>.tsx`, with its `index.tsx` (the
  public side of the boundary) and the demo runs **live** in the list
  and in the detail.
- a **clip** frame (a recording of yours that came in through the vault)
  publishes an **App** piece: the video gets copied to
  `public/pieces/<slug>.<ext>` and autoplays in the phone slot.

The server does both writes or neither (the demo's file and the entry in
`PIECES`) and it never overwrites anything: repeating a name is a 409.
When it finishes it leaves you standing on the new page, which is the
confirmation.

**How a Web piece lives**: `src/components/pieces/<slug>/<slug>.tsx`
exports the component by default, `index.tsx` re-exports it and
`demos.tsx` resolves it **by slug**. The folder is the map, there is no
registry to maintain. It is the shape of `components/animations/<slug>/`
in react-native-motion, and the same folder carries the detail's notes
(`notes.tsx`, see `src/notes.tsx`). Publishing is a COPY, not a move:
the sketch stays on the board; from then on the piece is edited in its
published file. And because it is product, **it cannot import anything
from `src/private/`**.

Around it:

1. The entry in `PIECES`: `name`, `platform`, `desc`, and `video` only
   for App. The `slug` of the name is its URL: `Photo picker` →
   `/photo-picker`. You can also write it by hand; publishing is the
   short way.
2. `prebuild` runs `scripts/routes.mjs`, which **regenerates
   `vercel.json`** with the rewrite for those routes. It imports
   `PIECES` and `slug` for real (Node ≥24 runs TypeScript), so if
   `pieces.ts` does not compile, the build stops right there.

The `slug` is **one single one** and it lives in `pieces.ts`: the page,
the route generator and the bridge that publishes all share it. Two
different calculations used to live here and they matched by luck; one
was left.

**`platform` decides how a piece is demonstrated, and nothing else**:
Web goes live in the browser, App goes on video. It is not decided per
piece, and publishing does not ask for it either, it reads it off the
frame.

**And it also decides where a piece gets built.** A **Web** piece is
sketched on the playground's canvas. An **App** piece is not: it is
written with the agent while you watch it run in the iOS simulator, and
it enters the exhibition as a **screen recording**. The playground does
not try to simulate a phone, and that is a decision and not a gap.
`react-native-web` would draw the shape and would lie about exactly what
this vault studies, which is the gesture and the haptics.

### The native workshop: `native/`

An **Expo app inside this same repo**, with its own toolchain. Its full
guide is in [`native/AGENTS.md`](native/AGENTS.md), which is also where
the conventions that hold for every piece and the traps we already know
about are, and the glass material has its own reference in
[`native/GLASS.md`](native/GLASS.md). The recon the workshop is founded
on is in `.context/recon/TALLER-NATIVO.md` (gitignored, which is why
what matters lives here). In three commands:

```bash
cd native && pnpm install && pnpm ios:build   # the build is once per machine
pnpm new "Swipe to pay"       # creates src/components/pieces/swipe-to-pay/
pnpm record swipe-to-pay      # records into the vault and closes the loop
```

- **One single workshop app, one folder per piece.** Measured against
  what the references do: **nobody builds a repo per demo**. Mangano
  holds 127 animations in one Expo app, Candillon one folder per
  episode, Gitter one `.swift` per interface. A repo of its own is the
  prize for the piece that turned into a library (Wave, Motion), never
  the starting point.
- **Inside the repo and not next to it**, and here we depart from the
  recon on purpose: the unit of work is a **worktree**, and everything
  left outside does not travel. That already happened with the vault and
  with `.context/`. The workshop is code. The folder makes the boundary,
  the same as with `src/private/`: `native/` has its own `package.json`
  and its own `tsconfig`, the root's `tsc` only looks at `src`, and Vite
  only follows what hangs off `index.html`. Verified: with `native/`
  present, the root's `pnpm typecheck` and `pnpm build` do not touch it.
- **The workshop's index is derived from the folders**
  (`require.context` in `native/src/components/pieces/registry.ts`), the
  same way the vault is derived from the disk: there is no list to
  maintain and it cannot lie.
- **The slug is the same string in three places**: the workshop's
  folder, the recording's file, and the URL of the published piece.
- **The closing step is `pnpm record`**: it pins the status bar at 9:41,
  records with `--codec h264` (the default of `simctl` is **HEVC** and
  it may not play in the exhibition's `<video>`, which is the most
  expensive trap on the way because it does not fail while recording,
  it fails in the piece that is already published) and writes **straight
  into `VAULT_DIR/native/`**. You stop and the clip is already in the
  grid → Open in Playground → Add to Exhibition.
- **`expo install` picks the versions, not npm.** An RN dependency
  brings native code compiled against the SDK's runtime: the latest one
  on npm against SDK 57 is a combination nobody tested, and it breaks
  the native build. The repo's rule is kept where it means something
  here: **the SDK is the latest**, 57. The table with the four versions
  and their why is in `native/AGENTS.md`.
- **The dev build works, with a two-line patch.** Xcode 26.2 rejects an
  annotation that `expo-modules-jsi` 57.0.5 put on a constructor;
  `patches/expo-modules-jsi@57.0.5.patch` takes it out and leaves the
  header identical to 57.0.4's, which Expo published and which compiles.
  The full why is in `native/AGENTS.md`.
- **SwiftUI has no workshop yet**: it is waiting for the first piece
  that asks for one. That is where a View per piece + `#Preview` and the
  iOS 17 springs go.

**The stage knows how to show both.** `Showcase`, in `parts.tsx`,
serves the recording when there is one, in the phone slot the box was
already reserving; with no recording, `platform` decides, and a Web
piece gets its component running live, resolved by slug in `demos.tsx`.
That order is what lets an App piece be published before its video
exists: it draws the empty slot instead of falling into the Web
branch.

### The boundary

Everything hanging off `src/private/` exists **only in development**,
and not because the host blocks it: the code **does not reach the
build**. It is two folds over `import.meta.env.DEV` in `app.tsx` (the
list of routes to `[]`, the component to `null`) and Rollup deletes the
whole dynamic import. Verified by counting occurrences in `dist/`: zero.
In production `/vault` falls into the same branch as any made-up URL.

The edge is a **folder** and not a flag scattered across files: a flag
gets forgotten, a directory does not. Any new file in there inherits the
gate without anyone having to remember.

**The dependency goes in one direction only.** The private side can
import from the product (tokens, `linkClick`, `Back`); the product
**cannot** import from the private side, because that would drag it into
the bundle. When the canvas has to draw a real piece, the import goes in
that direction (private → product), and that is why the model stores the
**name** of the piece and not its component.

**A Web piece's stylesheet is called `STYLESHEET`, and that name is load
bearing.** The CSS travels in a template literal, which a minifier does
not go inside: the comments used to get published verbatim, 38 % and
71 % of the two piece chunks, and what they carry is the method behind
each value. `scripts/remove-stylesheet-comments.mjs` removes them on a
build and leaves them whole in development, where the comment in devtools
is the documentation. Naming it something else does not leak in silence:
the plugin reads the chunks it is about to write and **fails the build**
if a CSS comment survived, whichever string it was hiding in. Why the
code itself is not hidden, and what the four references actually serve,
is in `LOG.md` › *The comments of a piece do not get published*.

## The map of the repo

| where | what |
| --- | --- |
| `src/app.tsx` | the router (no library: `pushState` and two views), the scrollspy, the gate to the private side |
| `src/pieces.ts` | the public inventory: name, `slug` and platform of every piece, in editorial order |
| `src/demos.tsx` | the slug → component map of the Web pieces |
| `src/components/pieces/<slug>/` | **one folder per piece**, with the shape of react-native-motion's `components/animations/<slug>/`: `index.tsx` + `<slug>.tsx` (a Web's demo; this is where a published sketch lands) and `notes.tsx` (the detail's notes, for both platforms) |
| `src/notes.tsx` | the slug → notes map |
| `native/` | **the native workshop**: an Expo app with its own toolchain. See its `AGENTS.md` |
| `native/GLASS.md` | the reference for the glass material: why a `GlassView` cannot be animated by opacity |
| `native/src/components/pieces/<slug>/` | an App piece: `index.tsx`, `<slug>-screen.tsx`, `<slug>.tsx` and its own things next to them. The route is one for all of them (`native/src/app/[slug].tsx`) and the registry is derived from the folders (`registry.ts`) |
| `native/scripts/new-piece.mjs` | creates a piece. The `New sketch` of this side |
| `native/scripts/record.mjs` | records the simulator **straight into the vault**: clean status bar + h264 |
| `mockup/` | **the video of an App piece for X**, in Remotion: the official bezel, a neutral background, a measured camera; you iterate it in Studio. See its `AGENTS.md` |
| `src/parts.tsx` | masthead, list item, detail, the showcase (video/live), back arrow, `linkClick` |
| `src/tokens.css` | every token, each one with its evidence grade and its four branches (light · dark · high contrast ×2) |
| `src/not-found.tsx` | the 404 with physics |
| `src/private/private.tsx` | the frame of the private area: tabs, slot for actions, ⌘Z for navigation |
| `src/private/vault.tsx` | the grid and the detail of a clip |
| `src/private/clips.ts` | the vault's index and the derivation from the file |
| `src/private/player.tsx` | frame by frame, a 2px track, speed 1x/0.5x |
| `src/private/details.tsx` | the four pieces of data beside the clip |
| `src/private/links.ts` · `link.tsx` | finding the links in a note and drawing them |
| `src/private/playground.tsx` | the list of views and the canvas |
| `src/private/views.ts` | the model of views, persistence, undo/redo, `toPlayground` |
| `src/private/sketches.tsx` | the registry of sketches: it finds them, draws them and puts up with them being broken |
| `src/private/sketches/` | **this is where you write.** One file per sketch, component by default |
| `src/private/actions.tsx` | right click menu, dialogs, buttons in the chrome |
| `scripts/vault-media.mjs` | the bridge to the vault |
| `scripts/frames.mjs` | `mdhd` + `stts` from the mp4/mov, without ffprobe |
| `scripts/routes.mjs` | `vercel.json` from `pieces.ts`, in prebuild |
| `scripts/remove-stylesheet-comments.mjs` | the comments of a piece's CSS do not get published, and the build fails if one survives |
| `scripts/link-card.mjs` | the title and favicon of a link, on the server side |

## Where each thing is written

- **`LOG.md`**: the log. Every decision, its value and where it came
  from. It is the first thing to read before touching something that is
  already decided: almost everything that looks arbitrary has a
  measurement behind it.
- **`DESIGN.md`**: the reference. The tokens, their values at each
  viewport, the evidence grades and the system's four rules.
- **`AGENTS.md`** (this): how the product works and how the work is
  done.
- **The files themselves.** Every `.tsx` and every `.module.css` carries
  the why at the top, and that is where you understand something
  fastest. When something new is decided, it gets written there **and**
  in the log.

## The highest references

**[benji.org](https://benji.org/) (Benji Taylor) and
[joshpuckett.me](https://joshpuckett.me/) (Josh Puckett) are the highest
references of this project.** For any doubt about typography, spacing,
hierarchy, copy or density, the answer is looked for there first, by
measuring their pages for real, never from memory.

Secondary references: [emilkowal.ski](https://emilkowal.ski/) (Emil
Kowalski) for motion and vertical calm, [rauno.me/craft](https://rauno.me/craft)
for the exhibition format. For the private area, `linear.app/now`, the
Figma file and Apple's HIG were also measured.

### The evidence rule

A value from these sites is never claimed without measuring it. Two
grades:

- **SOURCE**: read from the served CSS (`curl` to the `.css` the site
  serves).
- **RUNTIME**: `getComputedStyle` in the browser.

The served CSS wins over the computed one when they differ. And a rule
that exists in the sheet is **not** a rule on the screen: if the
conclusion depends on what gets rendered, you have to look at the served
HTML. That has already failed three times here (benji's zoom, josh's
`active:scale` utilities, linear's asymmetric card): all three rules
existed and rendered **zero** elements.

Apple's HIG cannot be read with `WebFetch`, because its pages are
assembled with JS, but it can in JSON:
`https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`.

### How each one solves hierarchy

| | moves | pins | tracking |
| --- | --- | --- | --- |
| **Benji** | the **weight**: 460 body · 500 emphasis · 560 section · 600 title | the size (14px throughout) | a ramp in `rem`, negative above 13px, **positive** below 12 |
| **Josh** | the **size**: 24px title · 16px body | the weight (400 always) | proportional in `em`, it changes sign with the size |
| Emil | weight + color; light body 400, sections 550 | the size (16px) | **zero** across the whole site |

### Title + subtitle: the measured pattern

**Benji** (his `<header>`): `display: flex; flex-direction: column; gap: 4px`.

- Title `h1`: 14px / **500** / `rgb(17,17,17)`
- Subtitle `time`: 14px / **460** / `rgba(0,0,0,.4)` ← **alpha, not a solid gray**
- Same size; only the weight and the opacity change. Full header: 52px tall.
- His subtitle is a **fact** ("Updated Jul 29, 2026"), not a self-description.

**Josh** has no subtitle under his name: he goes from the handle straight
into prose. But his **project** pattern is exactly our masthead:

- Name: 16px / 400 / `rgb(10,10,10)`
- Description: 16px / 400 / `rgb(82,82,82)`, one line, no extra separation
- A real example: *Interface Craft*, "A working library for those committed
  to designing with uncommon care."

Both of them share the rule: **the subtitle does not change size, it only
drops in weight and/or in color.** And neither of them praises himself: they
describe what the thing is or who it is for, never how well made it is.

## Working method

- **One mini-decision at a time.** Three things do not move forward together.
- Decisions are explored with the `prototype` skill: real variants behind
  the picker, on the real page, and the user chooses by looking. Everything
  that is not under study stays frozen, so that the comparison is clean.
- That workshop lives outside the build (`proto/`, `.context/prototypes/`).
  The Vite repo is canonical: when something is decided, it gets baked in
  here and the harness is taken out.
- **Nothing is claimed without measuring it.** Neither your own values nor
  anyone else's. The reports cite numbers taken from the browser, not
  estimates.
- **You do not reason over invented data.** Counting over placeholders and
  presenting the result as a fact is a mistake. It already happened with the
  18 scaffolding pieces that were in `pieces.ts`.
- **An attribution gets verified too.** The `←` of the back arrow was
  attributed to benji and josh in the log, and both of them use words
  (`Index`, `Home`): it was a decision of ours with a borrowed citation on
  top of it.
- **Every name uses precise professional vocabulary.** Files, scripts,
  folders, functions, variables, classes, commits, branches, whatever it
  is: the word an IBM engineer would have written in a specification in
  1972. No jargon, no casual abbreviations, no funny or clever names, no
  words borrowed from chat. It holds for everything, not only for the
  example that follows: a script that deploys dashboards is
  `deploy_dashboards.sh`, not `push_dashboards.sh`, and that is an
  illustration of the principle, not its scope. It holds for the public
  text too (the piece's title, its line of description and the notes):
  the parts are named with the technical term (header, tab bar, pager,
  list) and the actions with the specification verb ("select", not
  "jump"; "collapses", not "folds away"). A rule brought in by the user
  on 2026-09-07.

## The code

Nobody recognizes generated code by one bad line. What gives it away is
the accumulation: a comment narrating the statement below it, a `catch`
around something that cannot fail, a fallback to an empty list, a helper
that already exists two files over. Each one is defensible on its own,
and together they are a watermark. **The fix is almost always deletion
and not rewriting.** This pass was run over the whole repo on
2026-09-11 and every count below is from that day.

**A comment says what the code cannot.** This repo comments a lot, on
purpose (the rule above: the why goes at the top of the file), and the
density is not permission to narrate. One test decides it: does the
comment state something the code cannot? The measurement, the
alternative that was tried and rejected, the user's request with its
date, the trap that cost a day. Three kinds never come in:

- **Narration**, which restates the line below it. It doubles the file
  and adds nothing.
- **The diff talked out loud**: "Updated to…", "Now handles null",
  "NEW:", "Fixed:". The moment the change merges nobody has seen the
  old version, so those sentences describe nothing. That belongs in the
  commit message. Zero of them here, and it is worth keeping the
  number.
- **A comment that lies**, which is worse than no comment, because a
  reader trusts it over the code. When you edit a region, reread every
  comment in it: `pnpm references` only catches the class where a
  backticked name died, and a comment that describes badly something
  that does exist is found by reading, which that script says about
  itself.

No commented-out code, because git has it, and no stub of the "TODO:"
kind: something pending goes into the Pending list of `LOG.md`, which
is where this repo keeps them. Zero of both today. **A divider that
heads an argument stays**, which is why the ones here read in capitals
and carry a claim; one that only labels a region, "Helpers", is a
heading for code that wanted to be a function with that name.

**Failure is loud.** No `catch` that logs and carries on, no
`catch { return [] }`, no fallback that leaves the screen looking right
while the real path is broken. That last one is the most expensive
pattern on this list, because it keeps the checks green over something
that is already dead and after it you cannot tell what you are running.
The repo already works this way and the receipts are in the sections
above: the `piece` field answers 400 for a slug that names nothing
instead of dropping it as an unknown field, publishing does both writes
or neither and a repeated name is a 409, and with no `VAULT_DIR` the
vault says "Vault not connected" instead of drawing an empty grid. A
`catch` survives when it names the failure it is absorbing and why
carrying on is the right thing: the pointer capture a system gesture
already took (`src/not-found.tsx`), the autoplay the browser refuses
(`src/parts.tsx`), the broken sketch that turns off its own frame and
no other.

And nothing is defended twice. A null check over what the type, the
constructor or the three lines above already guarantee is noise, and if
it turns out it is not guaranteed, the type gets fixed once instead of
checked at every call site. Input that is not ours gets validated at
the boundary, which here is the bridge and its three guards, and
travels trusted from there on.

**Nothing silences the compiler or the linter without the invariant
written next to it.** Today: zero `as any`, zero `as unknown as` and
zero `@ts-ignore` in the repo, and that is the number to hold. The
error was information; the cast deletes it and moves the failure to
somebody's screen. A linter disable is a cast in disguise: it goes on
the line the rule fires on (over the declaration above it, it does
nothing, measured with `react/static-components` in `src/app.tsx`) and
it states its reason after the `--`. Sixteen of them in `src/` and
`native/src`, thirteen with their reason; the three left are
`exhaustive-deps` in `native/` and they are in the Pending list.

**The old implementation goes away and the new one takes its name.** No
"V2", no "New", no "Enhanced", no file with `-new` in it, no alias kept
just in case: every caller lives in this repo, which is what makes it
one repo. Zero such names today. Two calculations of the slug lived
here and matched by luck; one was left. The front page's mirror of the
private bar lasted a few hours on 2026-09-11 and it was removed, not
hidden behind a flag. And the naming rule above covers the other half
of this: `data`, `result`, `item`, `handler` and `processData` name
what a value is shaped like, and the name is for what it means.

**Build for the caller that exists.** An options object with one caller
passing one value, an interface with one implementation, a flag for a
case nobody has: every unused degree of freedom is something the next
reader has to rule out before they understand the line. Eighteen
placeholder pieces were deleted whole before the first real one. The
one piece of scaffolding that survives on purpose, `kind: 'piece'` in
the playground's model, is written down as missing in the section
above: an exception that is written is not slop, a silent one is. And
before adding a utility, look for whoever already owns that job; a
helper that only forwards its arguments gets inlined.

**The patch touches only what the task asked for.** It is one
mini-decision at a time applied to the diff: no reformatting, no rename
and no refactor riding along, because they bury the real change and
make the reading slower. When the approach changes halfway, a
minimum-patch pass at the end: whatever is not load bearing for the
answer that shipped gets deleted.

**And the gate does not get weakened to be passed.** The four commands
are in *Before calling something finished*. A finding is not made to
disappear with a disable, and a backticked name does not lose its
backtick to quiet the checker while the sentence keeps the claim:
either the thing exists, or the sentence is wrong and gets fixed.
Naming something that is gone is done in prose, which is the convention
that script imposes.

**The last read before calling it finished**: what in here would make
somebody think a model wrote it? That question finds what the list does
not.

## Status

What has been decided and its grounding is in `LOG.md`, and the list of
**Pending** items is right there too. The pending token items are marked as
such in `src/tokens.css`.
