# The log

Every decision of this repo, its value and where it came from. What the product
is and how to run it is in [README.md](README.md); how the work gets done, in
[AGENTS.md](AGENTS.md); every token with its value per viewport, in
[DESIGN.md](DESIGN.md).

## How to read this

Nothing here is claimed without measuring it. A value carries where it came
from, and when it came from nowhere that is written too. The grades:

- **MEASURED** off a reference's served page, not its stylesheet. A rule that
  exists in a sheet is not a rule on the screen, and this log has three
  retractions that came from forgetting that.
- **CHOSEN** by looking, with a scrubber on the real page.
- **NO RECEIPT** when it is ours and nobody backed it.

The references are benji.org, joshpuckett.me, emil kowalski, linear and apple's
HIG. Where I departed from them on purpose, the departure is the entry.

## The shape of the page

| | value | why |
| --- | --- | --- |
| Format | One page, one URL per piece (`/fan-out`), no router. `history.pushState` over two views | the detail carries notes. Not being able to link to them was a real loss |
| The item | `<a href>`, not a button | benji's list item is an anchor, and a plain click makes zero document requests. As a button it cost cmd-click, middle click, "open in new tab" and a screen reader saying "button" |
| Back | returns to the list at the scroll you left | benji returns at scrollY 0. This one hands the position back, verified at 1500 |
| The piece's box | fixed height, never a ratio | six cases measured across the two references: what runs carries a height picked by hand, what sits still lets the content decide. Neither uses `aspect-ratio` for anything alive |
| ↳ Web | 260 in the list, 400 open, as `min-height` | both benji's. His 20 demos do not change height at 1440, 768, 500, 390 or 320 |
| ↳ App | no height. The phone slot is 228×448 in the list and 319 open, plus 40/60 of padding: 528 and 707 | from benji's family-values, which declares no height and has no media query there. Ours and his give way at exactly 395, without copying a breakpoint |
| Rail | 592, which is 37rem. With the 16 margin the column is 560, 35rem | chosen with the scrubber between benji's 582 and josh's 672. Both land on whole rems, which neither extreme did |
| Top air | 80, and 32 below 768 | benji's `padding: 5rem`. At 769 it is 80 and at 768 it is 32 |
| Bottom air | 80, and it does not step | neither reference backs it: both close short because they have a footer and this page will not. The top air gets trimmed on a phone because it is dead screen before you read; the bottom one is only seen if you scrolled all the way |
| Response | it steps, it does not interpolate. One step at 768 that moves the top air and the margin together. Zero `clamp()`, zero `vw` | benji's, measured across four of his stylesheets. Josh is the opposite, 142 classes on /bloom and not one responsive prefix |
| The index | fixed on the left, 80/80, every piece grouped, no tabs. It leaves below 1080 | thirteen pages of the two references: neither uses tabs, both navigate with a fixed index. The 1080 is benji's |
| ↳ where it starts | "Web" sits on the same line as the first piece's title. 237 at 1440 | chosen against four other pairings. It aligns on the text baseline and it gets measured, not calculated: as a `calc` it would be a formula nobody updates |
| ↳ scrollspy | the piece you are looking at gets painted, at 65 | benji's rule, out of his bundle. This used to say "no scrollspy" and it was reversed |
| Spacing | 80/32 above · masthead→section 60 · label→piece 40 · name→card 12 · between pieces 48 · between sections 64 · label↔hairline 8 · subtitle 4. All multiples of 4 | chosen with the scrubber. The 40, 48 and 64 are benji's |
| ↳ the token's name is its role | `--page-padding-top`, `--index-group-gap`. The whole `--space-*` scale was deleted | 1.3 MB of served CSS from apple, linear and openai: not one token named after its value, not one `--space-4` in the three bundles |
| ↳ ×4 in layout, free inside a component | benji uses 2, 3, 5, 6 and 10, and 6px appears 28 times, all of it inside components and never in page layout |
| ↳ the number is the gap you can see | `--section-content-gap` runs from the line to the first text | the margin said 32 when the real gap was 41.5. Two numbers for one distance, and the one that decides is the one you see |

## Type

benji's system: one size, hierarchy by weight.

| | value |
| --- | --- |
| Body | 14px, weight 460, tracking −0.00563rem, line height 20px |
| Index | 13px, 460, −0.0025rem, 16px |
| The ladder | 460 body · 500 title and piece · 600 section |

Every value off benji.org's served CSS, where his 14px text carries that line
height and that tracking in all of his rules without exception.

**The page title is not the heaviest thing, the section labels are.** His
reason is functional and I kept it: a title is read once and its rank comes
from position, alone at the top with air around it. Section headings get
searched for many times in the middle of content, and there the weight is what
makes them findable. The weight goes where the work is, and the work is
scanning.

**Three weights and not four.** The 560 was left out. Three is where the
consensus among design systems sits, and the 460 cannot go because it is the
body. Two levels of the same hierarchy never sit closer than 40 apart, which is
what killed 520 and 540.

**Why not josh.** He uses five sizes, two weights and five grays on his
subpages. His cost was competing with the pieces, and he would have forced a
redo of every vertical distance.

**The accepted cost.** "Interface exhibition" and a piece's name tie at 500,
and the word "Web" comes out twice, 600 in the separator and 460 in the index.
That is the price of three weights. Those pairs are told apart by position.

**What was corrected while baking it in.** The tracking was −0.004rem, which is
nobody's. There were three line heights, two of them written by hand. The
section label sat at 600 when benji's `h2` is 560. The page was a hybrid nobody
had decided.

**The font is InterVariable, self-hosted**, the official file from rsms.me
subset to latin: 102 KB for an English page against 343 for the original, and
it keeps both axes, `opsz` 14 to 32 and `wght` 100 to 900. It is not the Google
Fonts one, and the difference is concrete: asking Google for that axis range
returns CSS with zero mentions of `opsz`. Benji uses the Google one through
`next/font`, so he does not have optical sizing and this page does. It costs 36
KB and I pay it on purpose.

It stopped coming from a CDN because it was a blocking `<link>` to the author's
personal site. If it failed, CSS matching turned 460 into 500 and 560 into 600
and the hierarchy fell apart. From our own origin, a font that fails means
everything already failed.

## Color

| | value | why |
| --- | --- | --- |
| Canvas and ink | `#fdfdfc` and `#111111` | they arrived from another project with no way to verify them. They are literally benji's declared variables |
| The card | `--surface: #f8f8f6`, five below the canvas, no ring and no shadow | josh's rule, measured, chosen over benji's, which is the opposite: card flush with the background defined by a 1px line |
| ↳ the delta transfers, not the hex | copying his `#fafaf9` onto this canvas gives −3, not −5 | his page is pure white and this one starts two units below. Copying a color and copying a contrast are different decisions |
| ↳ radius | 8 | census of seven pages: benji 8, josh 12, and 8 is the one both use on large boxes and a multiple of 4, which 14 is not |
| ↳ hover | −4, to `#f4f4f1` | his rule is one step of his ramp, and the only two hovers he has show it. His button's hover lightens, so the rule is a step and not a direction |
| ↳ press | there is none | across 23 pages of the two references there is one live `:active`, a 40×40 button that takes away the ring the hover put on. His press removes the hover, it does not add a state. And `active:scale-*` exists in josh's bundle with zero elements using it |
| Text grays | one secondary level: one base and two alphas. Annotation 160 from black at 37%, nav 166 from black at 34.4% | benji declares one text color token and no gray token. Everything gray is his black or his ink at an alpha, and .4 dominates with 40 declarations against 8 for the next. With α=.4 his two bases reproduce his 152 and 159 dead on, which is what validates the model. The nav's alpha was fitted to hold the pair when it stopped being derived from the ink, so dark mode could take the ink to 250 |
| ↳ they fail APCA and it is accepted | Lc 50 and 47 against the 60 it asks for | benji too, 54 and 50. What goes in gray here annotates, it is not read |
| ↳ contrast gets measured composited | `rgba(0,0,0,.4)` is 2.84:1, not 20:1 | without compositing the alpha over the background it scores as pure black and every number comes out wrong |
| How color is used | everything that gets read goes in ink. Gray is only for what annotates | benji's rule, measured on four of his pages. That is why the detail's description is in ink: it is prose |
| Selection | `#ededed` background, text forced to ink | the forcing is what decides it: the secondary at 160 on that background gives 2.00:1, unreadable exactly while you select it. Forced to ink, 16.13:1 |
| Focus | `2px solid #005fcc`, offset 2, no transition | Chromium's own ring, read off the painted pixel in three engines. Chromium `#005fcc` solid, WebKit `#0067f4` at 50%, Firefox `#007aff` solid. Chromium wins for depth. The blue that was here was Firefox's |
| Destructive | `#c81e14` light, `#ff6b60` dark | Apple's `#ff3b30` family, decided in a previous project and verified over these backgrounds: Lc 75.5, which is APCA's preferred threshold |

**Dark mode is four numbers.** Depth 9, warmth .003, ink 250, hue 106.4, and
everything else falls out of two rules: text keeps its **contrast** and
everything else keeps its **distance** with the direction flipped. Of the five
references only josh has a page-level dark theme.

The compromise is written down: keeping the distance gives about 1.5× of ΔL, so
the card is somewhat more noticeable in dark. Keeping the exact ΔL left it at +3
and invisible, and emil (×3.00) and linear (×4.48) enlarge it much more for how
they hold up across screens. APCA cannot arbitrate it, it returns 0.0 for every
surface.

**High contrast is the first color decision with no reference at all.** Zero
occurrences of `prefers-contrast` in the five bundles. The two grays collapse
into one, because the alpha that reaches Lc 75 comes out the same for both
roles, and every distance that is not text doubles. That second half the skill
does not ask for: under high contrast the structure has to read too.

## Motion

The page has no entrance animation. Opening a piece and going back animates
nothing. What moves is the hover, and those are changes of color.

| | value | why |
| --- | --- | --- |
| Surface | `cubic-bezier(.23,1,.32,1)`, 150ms | linear does not pick a curve, it picks by what is animated: its three cards with hover use ease-out without exception |
| Text | `ease`, 100ms | four sources agree: benji's whole bundle, josh by hand, 25 of linear's 46 color transitions, and the skills |
| ↳ the split is mine | no reference splits the duration | benji uses 100 for both families and josh 150 for both. I take his number for text and josh's for surface |
| ↳ and the hover is symmetric | 150 in, 150 out | a reversal. I had written that three sources called for asymmetry and it was false: the asymmetric rule in linear renders zero elements, benji's 20ms are from an `:active`, and Apple's is about the press. Live sweep over five of linear's pages: 21 hoverable elements with a transition, zero asymmetric |
| The back arrow | it paints the glyph, not the square, reaching 65 in 100ms | unanimous across both references: they do not paint a background, they change the color, they do not move |
| No reduced-motion block | there is no movement left to reduce | the four places with a transition cross a color and none displaces. It stops being true the day a scale comes in |

**Elevation: there is none, and it is a decision.** Zero `box-shadow` in the
product. Measured on four reference pages: benji's home zero, josh's home zero,
interface-craft zero, and the 52 in family-values are all `0 0 0 1px`, borders
drawn with a shadow. Across the four there is not a single shadow with blur.
`/better-ui` asks for the opposite and benji does exactly that backwards. I
followed the references, which is where everything else came from.

**z-index: zero, and it is not decidable yet.** Nothing overlaps today. Five of
the pieces on the list are layers, and the scale gets decided with the first
one.

## The private area

Two things in one place with different jobs. The **vault** is the wall of
references you look at; the **playground** is where you build. Neither is
published, and not because a host blocks them: the code never reaches the
build. Two folds over `import.meta.env.DEV`, the route list folding to `[]` and
the component to `null`. Verified after every build, zero occurrences of
`vault` or `playground` in `dist/`.

The edge is a folder. Everything under `src/private/` inherits the gate,
because a flag spread across files gets forgotten and a directory does not. The
dependency goes one way: the private side imports from the product, never the
other way round.

**The clips live in a folder of yours, outside the repo**, and it can be your
Obsidian. `VAULT_DIR` in `.env.local`, with no `VITE_` prefix on purpose:
with it, Vite would bake the path on your disk into the client bundle. A Vite
plugin with `apply: 'serve'` serves that folder, and on a build it is not even
instantiated.

Three guards: an allow list of video and image extensions, nothing that starts
with a dot, and `realpath` on both sides. The allow list matters if you point
this at your Obsidian: an `.md` is never served, and not because a rule blocks
it but because it is not on the list of what is. A fourth one was missing and
the test vault caught it: `realpath` ran only on serving, and the index got as
far as listing a symlink to `/etc/hosts` as a 213-byte mp4. You could not
download it, but its size and its date were already out.

**The folder is the manifest.** Name, source and date are derived from the file
and from where you dropped it. A hand-written manifest falls out of sync the
day you drag a file in without editing it, and then the vault lies.

### The grid

Three columns, gutter 32, rows 64, title to caption 8, rail 80 each side. Rows
and the caption gap are where linear.app/now and figma's archive match exactly,
so I took them without argument. At 1440 the rail leaves the grid at 1280,
which is linear's container: convergence, not a search.

The gutter goes clean, figma's, against linear's 64-with-a-line. Their line
exists because their cards have no background. Ours is a painted surface with
its own edge and a line would compete with it.

**All the cards are the same height, 574, and that is against benji.** He lets
the content command, which is why his 45 cards have five heights, and he can
because he has one column. In three columns a variable height leaves rows
uneven by up to 209px and that reads as a mistake, not as variety. The 574 is
the point where a vertical clip reaches the exact 228 he gives his. Below 768
there is one column again and the height is released.

**A card is three layers**: the component, its own background which comes from
the file, and `--surface` around it, always present. Vito, looking at the grid:
*"that size of component, plus its background that comes from the video, and
then our background always present."* Getting there took a detour. With two
rules the third layer was missing on web (measured at 1440, a clip painted
442.64×424.94 in a card of 442.66×424.94, air of one hundredth of a pixel), it
got unified, it got reverted because nobody had asked for it, and it came back
when it was asked for.

The slot's width dropped to two thirds. At benji's 78.18% six of eight native
clips came out at the same ceiling, 346.06, because that percentage only binds
when the file is wider than it is tall and most of them are square. There is no
reference behind the 2/3 and it gets said: it is the round number that shrinks
what is square and does not touch what is shaped like a phone.

**The trays only measure the same because the files are 1:1.** The rule alone
was not enough, since `contain` sizes by the file's ratio, so the clips with a
tray were filled with their own background up to square. The fill is their own
edge rows extended and not a painted color: painting one landed two levels off
because of the RGB to YUV conversion and the seam showed. Seven trays at
exactly 295.11 square.

An ffmpeg trap worth keeping: `scale` preserves the display aspect and
`vstack`/`hstack` inherit the SAR of the first input. Stretching a two-row strip
to 36 put SAR 18:1 on the whole file and the browser drew it 16px tall.
`setsar=1` after stacking, always.

**No caption and no hover arrow.** Both references carry a caption and it goes
anyway: in a vault neither the category nor the date annotates anything, since
every clip arrives the day you drag it. The arrow was linear's, and their card
needs it because nothing else changes on it. Ours darkens the whole surface, so
the arrow was a second signal saying the same thing.

**A correction about method.** A probe returned "zero `:hover` rules on the
whole page" and it was false, the real number is 68. His sheets come from
another origin, `sheet.cssRules` throws, and the probe was skipping them in
silence. Against CSS from another origin you capture the text of the response,
not the CSSOM.

### The player

It exists to reach the exact frame where a gesture starts, count to where it
ends, and get the duration in milliseconds.

| | value | source |
| --- | --- | --- |
| Play | 38×38 with a 20×20 glyph, `opacity 100ms linear` + `transform .2s ease`, disabled at .32 | apple's `inline-media-ui`, rendering on 28 videos of /apple-vision-pro |
| Speed | 28×20, 12px/460, radius 38, two states and not a menu | benji, rendering on 45 elements of family-values |
| ↳ the crossfade | two overlaid spans crossing by opacity | "1x" and "0.5x" do not measure the same, so without it the button changes width and everything next to it jumps |
| The controls | a row below the video | chosen by looking, and it belongs to neither: apple anchors bottom right over the video, benji top right. Below, nothing covers the clip and it needs no scrim |
| The track | 2px, no knob | no measurable reference, and it gets said. Safari's shadow root is closed in both engines. Thin, medium and hidden were tried and thin won |
| Stepping | only the arrows. One frame · option 10 · command to the edges | aiming at a small button while you are looking at something else is the work this player saves you. Verified on a 256-frame clip, and it clamps at both ends |
| ↳ and command+arrow calls `preventDefault` | without it the browser's back/forward takes you off the page | verified, the URL does not change in either direction |
| ↳ the listener is on the document | it was tied to focus and failed in the most common case | you click the video to pause, the click lands on the `<video>`, and from there the arrows did nothing. But in a text field the player keeps its hands off: option and command arrow are word and line on a mac, and stealing them breaks what you do without thinking |
| The frame step | read from the container, not estimated | `scripts/frames.mjs` reads `mdhd` and `stts` out of the mp4. No ffprobe, no dependencies, validated 9 of 9 |
| ↳ it seeks the middle of the frame | `(target + 0.5) · frame` | asking for exactly `N·frame` lands on the boundary and the browser can resolve either way |

### Sketches

A third kind of frame since 2026-08-26: a real `.tsx` in
`src/private/sketches/` that exports a default component.

**There is no editor in the browser.** Monaco plus a transformer on the client
would be a big dependency to give you an editor worse than the one already open
next to it. And an agent writes files, it does not type into a textarea. If the
sketch is a file, you in your editor and an agent in the terminal are the same
way of working.

**A broken sketch does not take the board down.** Each one sits in an error
boundary and only its own frame goes dark. Writing freely means the file is half
done half the time, and without this a `null.map()` unmounts the canvas and you
lose the other frames, the selection and the gesture you were half through. It
clears on the next hot update, and only if there was an error: overwriting the
state on every save would remount every sketch every time you touch any file.

**The pointer splits by selection.** Unchosen the frame drags; chosen, the
sketch receives the clicks. You have to be able to press the buttons of what you
are building, and the frame's gesture calls `preventDefault`. The price is said
out loud: a chosen sketch does not move by dragging it from the middle.

The endpoint writes inside the repo, the bridge's only exception, because a
sketch is code and has to be where Vite compiles it. The folder comes from
`import.meta.url` and only letters, numbers and hyphens survive of the name.
Verified: `?name=../../etc/passwd` wrote `etc-passwd.tsx` inside the folder.

### Publishing

`Add to Exhibition` is the right click on a frame of the playground, and it
spent a day in the vault before moving. The correction is about the model: the
vault is what is external, and what gets published is yours. Publishing is the
end of the workshop, so the gesture lives where the work is.

The action is visible and not only a right click: you choose the frame and it
shows up in the sidebar, at 16 from the index, because the lines above are
nouns and this is a verb. One action does not pay for a new surface, so it was
born inside the sidebar that already exists.

**The frame says the platform**, with no selector: a sketch publishes Web, a
recording publishes App. That is the rule that already existed read backwards,
and a selector would offer combinations the system declared invalid.

Both writes or neither: the file gets copied and the entry goes into
`pieces.ts`, and if the second fails the first is undone. Nothing is ever
overwritten, a repeated slug returns 409. Publishing is a copy and not a move,
so the frames that reference the sketch keep working, and the cost gets said:
from that moment the canonical one is the published file.

**The confirmation is the page.** You navigate to `/<slug>` and see the demo
running. This system has no toast, and the real exhibition is a better
confirmation than any sign.

## How a clip is named

Under 15 characters, which is the ceiling in Apple's HIG, and the reason it
gives is functional: room for the bar's other controls. Since the detail's
header is one row, that room is literal.

**The title says what the gesture is. `Source` says where it came from.** Those
two fields do different things, and taking the repetition out is what makes 15
enough: you do not compress anything, you stop saying the same thing twice.

| before | | after | |
|---|---:|---|---:|
| Bottom accessory like Apple Music mini player | 45 | Mini player | 11 |
| Copy text animation from Apple Passwords | 40 | Copy text | 9 |
| Berry Floating Bar Bug | 22 | Floating bar | 12 |
| ChatGPT photo selector | 22 | Photo picker | 12 |
| X App's Swipeable Tabs | 22 | Swipeable tabs | 14 |

Median 22 to 12. It is not enforced by code, on purpose: the name is the name
of the file on your disk, and an app that stops you from calling your files what
you want has the dependency backwards.

## The detail's header

`← · Photo picker ⌄ ·········· ↗ · ▮▯`

**The title is the document menu.** Tapping the name opens `Rename` and `Move
to Trash`. That is what the HIG describes for the leading edge, commands that
affect the whole document.

Renaming in place was withdrawn, and not for the ceremony. That click was not
enough for everything you had to be able to do, so renaming, the trash and the
playground lived only in the right click, which is to say invisible.

**Only one action rises to an icon.** The playground is the only one that is
not about the file's identity or its existence, and the only one with no
consequence. A permanent icon is for what you press without thinking, which is
also why it is not in the menu: repeating it ten pixels away would offer the
same thing twice.

Deleting does not ask. The HIG says to avoid the alert for destructive actions
that are common and reversible, and its example is deleting a file. Verified end
to end: the clip leaves the vault and turns up in the macOS trash, so the
premise really holds. The warning did not disappear, it changed moment: it
arrives before the click now, with the item in red.

What is missing for the complete pattern is the undo. Apple's literal test is
*"can they undo it?"*, and here you undo it in the Finder. The medium decided on
is [Sonner](https://sonner.emilkowal.ski/), and it is postponed on purpose,
because it would be the project's first UI dependency and it brings a surface
the system says it does not have.

**The back arrow is a chevron**, and what is worth keeping is what changing it
uncovered: the `←` that was there did not come from the recon. This log
attributed it to benji and josh, and both of them use words. It was ours with no
receipt, and a borrowed citation on top. An attribution gets verified too.

## The pieces

Four, and the order is the one that draws a mountain in the index: the longest
titles in the middle and short at the ends. The names went through the naming
rule on 2026-09-10, measured in the served index at Inter 13px, weight 460.

| | slug | platform | ink |
| --- | --- | --- | ---: |
| Fan out | `buttons-separate` | Web | 45.7 px |
| Selection summary | `select-summary` | Web | 117.9 px |
| Swipe between tabs | `swipeable-tabs` | App | 124.7 px |
| Hold to buy | `hold-to-commit` | App | 70.6 px |

The slugs do not follow the titles, and that is the point: `slug` became a
field of `Piece`, assigned once when the piece is published, so a title can
change without moving URLs, folders, videos or clips. It is the shape
`data/animations.ts` has in react-native-motion.

The 15-character cap from the HIG holds at the ends and is exceeded on purpose
in the middle. A new piece comes in with whatever length its place gives it.

**Hold to buy** is the Opal button (Apple Design Award 2025), built against a
vault clip on 2026-09-02 and the first piece to come out of the native
workshop. **Swipe between tabs** is X's tab bar measured against the real app.
Both are App pieces, so they enter the exhibition on video.

**Fan out** is macOS Tahoe's Spotlight and the first piece that runs live in
the browser, which is the whole difference between the two platforms here: a
Web piece is shown running, an App piece is shown on video. **Selection
summary** followed it the next day.

What each piece measures, rule by rule, lives in its own
`src/components/pieces/<slug>/notes.tsx` and in the comments at the top of its
file. This log does not repeat them: a number has one home, and for a piece
that home is the piece.

### What the notes are for

The detail existed for the notes and it was empty. The lines are benji's and
the tone is josh's, written in the first person singular, and the rule that
governs them is in `AGENTS.md`. Three sections, always the same three: Anatomy,
Performance, Use cases.

Anatomy talks only about the animation the piece is named after. The
description line does not name the app it came from; the reference is told in
the notes, where there is room to say what was measured.

**Every name uses precise professional vocabulary**, a rule Vito set on
2026-09-07 and it covers the public text too: "tap to select", not "tap to
jump". The word an IBM engineer would write in a specification in 1972.

## The video for X

A recording of an App piece, put inside Apple's official bezel over a neutral
background, with a camera that comes in and goes out.

The reference is @nater02's clip, measured frame by frame: flat RGB (235, 230,
232) background, black phone at 95.3% of the height and centered, shadow only
to the right and below in two layers fitted against the luma profile, camera in
to 1.576× over 0.65s and out to 1.161× over 0.62s, both curves fitted to a cubic
bézier with an rms of 0.005. The phone is the iPhone 17 in Black, which is the
reference's by proportion and color, since the Pro Max does not come in black.

**It gets built in `mockup/` with Remotion and not with ffmpeg.** The pipeline
made the video correctly, but every adjustment was a re-encode of several
minutes, and the brief asked for the opposite: watch it live and render once.
The same measured numbers live in `mockup/src/parameters.ts` as Studio
controls. The ffmpeg script stays as the receipt for how each number was
measured and as a path with no Chrome.

**`--verify` exists because of one bug.** The first camera sat the screen 15×20
px off and the background showed through at the top left corner. In the whole
frame you could not see it; in Vito's zoom you could: *"look at the edges,
they are not filled"* (2026-09-04). Now a solid red goes in instead of the
recording and it checks pixel by pixel that the bezel's slot is full in twelve
states of the camera.

**A bug in the piece that the recording probe uncovered.** Moving the pager by
`target` with `motion` set to drag, the tab bar read the tap's segment and the
underline stayed nailed to For you while the content traveled. The right
condition is `motion === tap`. For a real tap it is the same thing, and for
anything else that uses `target` the bar follows the content.

**Every video comes out twice**, over the measured light background and over a
dark one, `#1C181A`, which is the neutral taken down to 11% with the same tint.
The dark one has no reference in the vault: the clips that looked dark measure
white in the corners, because that was the phone filling the frame.

The exhibition gets its own pair of renders with the background equal to the
card's `--surface` and the phone at 86%, against benji's 85% measured on his
card. In light the video decodes to (248, 248, 246), the exact surface; in dark
it lands one level of blue off, which h264's 4:2:0 cannot give. It cannot be
seen, and a token does not get touched for a codec.

## Error 404

A single ring with `ERROR 404 · PAGE NOT FOUND` repeated, no controls and no
extra text. A rigid circular body with gravity, spin, drag and throw, and a
restitution of 0.90 on the sides and the ceiling against 0.86 on the floor. One
soft voice, fired only when the whole ring bounces.

It used to deform, explode into particles and reassemble, with a sound per
press and three voice variants. All of it went: the scene has to read as one
rigid object. Under reduced motion the ring stays still and the drag stays
direct, because the movement that runs on its own is the decorative part.

## Oxlint, and the config is half the work

A linter that shouts at everything gets ignored, and there it stops working.
Two rules drown out the rest in a modern React project and both are off:
`react/react-in-jsx-scope`, obsolete since React 17's JSX transform and always
a false positive here, and the whole `react-perf` plugin, which flags every
inline arrow in JSX. That is an opinion about performance, not a
bug.

What stays on is what catches real bugs: `rules-of-hooks` as an error, which is
the one that finds a hook after a conditional return, and `exhaustive-deps` as
a warning. It does not replace `tsc`. They are different layers and they live
together: `tsc` says this does not close, oxlint says this compiles and is
wrong.

## Two things that were slower than they looked

**What was slow to load was the cache, not the weight.** Vercel answered
`public, max-age=0, must-revalidate` for everything, including JS with a content
hash, measured with curl against production. Every reload downloaded the whole
site again. The rule is one: if the name of the file changes when the file
changes, it can be cached forever. `vercel.json` is generated from `pieces.ts`
in prebuild, so it cannot be published out of sync.

**Every view change painted one degraded frame, and one of them was fully
white.** Measured with a screencast at 60 fps over the journey from the vault to
a piece and back. The DOM was not empty in that frame, the layout was right and
the scroll was already at zero, probed rAF by rAF. It was the browser needing a
frame to rasterize a viewport-sized subtree that React swaps in a single
commit, and it happened on every navigation, inside the private area and out.

The instrument got calibrated before I believed it: a navigation with nothing to
load drops 3%, and a render of identical content drops 0.

`startViewTransition` holds a snapshot of the old frame until the new one is
rastered, with `flushSync` so React does the swap inside the callback. The
crossfade is the system's surface pair, because it exists to remove a frame and
not to add an animation, and reduced motion falls through to the plain swap.

With that gone the exhibition still arrived with its two Web boxes empty:
`React.lazy` needs a tick even when the module is in memory, and the transition
photographs it. Warming the modules was not enough. What was missing is a map
from slug to the component already resolved, so a demo that arrived renders with
no Suspense in between.

| step | before | after |
| --- | ---: | ---: |
| grid to clip | 9.6k | 21.8k |
| clip to piece | 8.5k | 16.0k |
| piece to clip | 7.2k, white | 18.7k |
| the Exhibition tab | 13.7k, boxes empty | 18.6k |

Bytes of the same jpeg, where lower means emptier. The first bundle did not
grow, 210 kB: the demos are still separate chunks asked for in idle time.

## The vault is a two-way door

A clip knows which piece came out of it, in a fourth field of
`.lima-vault.json` with the slug. From the clip, `Open in Exhibition` in the
menu and an icon beside the arrow; from the piece, a line at the foot back to
the reference.

The field goes in on both sides in the same change, which is the trap
`AGENTS.md` wrote down before it bit: the server validates the fields it knows
and drops the rest in silence. But it does not go in the same way on each side.
The other three fields are whatever you typed and this one has to name a piece
that exists, so it gets checked against `pieces.ts` and answered with a 400.
Dropping a bad slug quietly is the one thing this field cannot afford: you would
save, see nothing, and have no link.

Publishing an App piece from a clip writes it on its own, since that is the
moment the fact comes into being. If the write fails the piece stays published
and the answer says so, because a piece that got published is not undone by a
link that did not.

**The way back is dev-only and that is the whole constraint.** The exhibition is
published and the vault is not, so a link from the product to a clip on your
disk would 404 for everyone and would carry the path of a file of yours into the
bundle. `src/private/reference-link.tsx` is lazily loaded behind
`import.meta.env.DEV`, the same two folds as the rest. Verified by grepping the
build.

And it asks the vault, not the piece. `pieces.ts` is product code and a
reference is a private note, so the search runs the other way, over the vault's
index, with the same hook the vault itself uses.

**The front page has no door into the private area**, which is where it started.
A mirror of the private bar lived at the bottom left for a few hours on
2026-09-11 and came out again the same day: a door in one direction was enough,
and the front page is the page of the product.

The door that stayed is the private bar's `Exhibition`, and **it opens a new
tab**. The two are things you look at at the same time, building on one side and
checking the result on the other, so navigating in place would make you come
back by hand every time.

**And the transition only worked in one direction.** Leaving the vault
crossfaded and entering it did not, which is the same `React.lazy` tick as the
demos: measured with a screencast, the exhibition faded out to a blank page,
held there for seven frames, and the vault appeared all at once. The resolved
component now gets handed out directly.

My first attempt at that did nothing and the screencast said so, byte for byte
identical. The choice was being locked on the app's first render, which happens
at `/` and always before the warm-up lands, so it froze on the lazy one forever.
It gets locked now only when the private area is about to be drawn.

## Everything in English

2026-09-10. Comments, identifiers, string literals, console messages, the six
docs and the commit messages. About forty thousand lines.

Half of it is mechanical: `git mv` and the compiler catches every import you
forget. The other half is the content, and there is no compiler for prose.

**What the token limit taught, which was not about translating.** Three sessions
ran out. The first two lost every in-flight file, because an agent handed a
whole file builds the translation in its head and writes it once at the end. One
sentence in the brief, write in chunks and apply each as it is ready, meant the
third cutoff left 40 to 60% of each file on disk.

**And the check I was using was blind to it.** A file cut in half reads zero
Spanish words, because what is missing is not there to count. Three truncations
went through that filter, the worst one at 130 lines of 554. What catches it is
coverage against the original, the same number of headings and a last line that
matches. An audit of all 118 tracked files that way found no others.

What stays in Spanish on purpose, because it is not this repo's to rename: the
vault's own subfolders and the keys of the JSON on disk, `com.anonymous.nativo`
and the Expo `scheme`, and the AVD called `taller`.

The em dashes went from 197 to 15 in the source, and each survivor is the
character itself and not punctuation: the placeholder for an empty value, the
dash the empty list draws, the entity table in `link-card.mjs`.

## The rules for the code

The repo said how to work and what to call things, and nothing about the shape
of the code. That gap has a direction: an agent reading a file here copies the
comment density, which is high on purpose, and what it copies is the form
without the test. `AGENTS.md` now has *The code*, and its test is one question:
does the comment state something the code cannot?

Everything in it was measured over the 88 tracked source files before it was
written, so no rule went in as an opinion. Zero `as any`, zero `as unknown as`
and zero `@ts-ignore`. Zero comments that talk about the diff ("Updated to…",
"NEW:"), zero stubs of the "TODO:" kind and zero blocks of commented-out code.
Zero names with "V2", "New" or "Enhanced". Sixteen linter disables in `src/`
and `native/src`, of which eleven stated their reason.

Those five were the only finding, and two of them are fixed: the unmount flush
and the focus on entering edit in `src/private/details.tsx` now say why their
dependency list is short. The other three are `exhaustive-deps` in `native/`
and they stay in Pending, because writing the reason means reading each effect
whole and an invented reason is worse than none.

The one rule that changed and is not about form: **the gate is four commands
and it used to be two.** `pnpm typecheck && pnpm lint && pnpm build && pnpm
references`. They see four different things, and the two that were missing are
the ones that see what `tsc` cannot: oxlint reads code that compiles and is
wrong, and `pnpm references` reads the comments, which is the way this repo
breaks.

What did not change: the density. A divider that heads an argument stays, and
that is why the ones here read in capitals and carry a claim.

## The comments of a piece do not get published

The question was whether somebody landing on the exhibition can be stopped from
seeing how a Web piece is made. They cannot, and pretending otherwise is the
mistake: the piece runs in their browser, so it is already on their machine, and
devtools is not a door that closes. Blocking the right click, a `debugger` loop
or measuring the window to guess the panel is open gets past in seconds, breaks
the keyboard and the screen reader, and is a tell.

**What was worth fixing is something else, and it was found by reading the
served file instead of the source.** A piece keeps its CSS in a template
literal, `const STYLESHEET`, and a minifier does not go inside a string. The JS
came out with its identifiers mangled and its comments gone; the CSS came out
verbatim. Measured on production on 2026-09-13:

| chunk | comments | bytes | of the chunk |
| --- | --- | --- | --- |
| `buttons-separate-Ntzj-RDl.js` | 27 | 8 755 | 38 % |
| `select-summary-ClzGkoHY.js` | 62 | 27 212 | 71 % |

And what is in them is not implementation, it is the method: the SwiftUI probe,
the least-squares fit with its rms, the levels read off the reference, the path
to `.context/`. A minified bundle says the veil sits at 0.675, which is on the
screen anyway. The comment beside it says where the 0.675 came from, and that is
the part nobody can read off a screenshot.

So `scripts/remove-stylesheet-comments.mjs` removes them on a build and not in
development, `apply: 'build'` against the `apply: 'serve'` of the vault: while
you work, the comment in devtools IS the documentation. 89 comments, 36 127
bytes. `select-summary` went from 37.99 to 10.68 kB.

**Three things it had to get right, and each one is in the file.** A `/*` inside
a CSS string is not a comment and cutting from there would eat the rules after
it. An unclosed comment is not removed, because in a real parser it comments out
the rest of the stylesheet and removing it would change what renders. And the
line a comment lived on goes with it only when the comment WAS the line, so a
blank line the author wrote stays where they put it: that is what makes the
result checkable, and it was checked. Normalized, what is published is character
for character the source without its comments, 3 769 and 4 803 characters.

**The gate is on the artifact, not on the source.** The transform knows one
name, so a piece calling its stylesheet something else would sail past it in
silence, which is exactly how this got published in the first place: nobody was
reading the emitted file. `generateBundle` now fails the build if a CSS comment
survives anywhere in any chunk, and it names the chunk, the count and the first
one. Verified by renaming `STYLESHEET` in a piece: the build stops. The one
shape it lets through is `/*!`, the legal comment a dependency ships its license
in, which is not ours to strip.

What the four references do, measured the same day: `emilkowal.ski`,
`joshpuckett.me`, `linear.app` and `rauno.me` all serve zero
`sourceMappingURL` and answer 404 for the `.map`. So does this site, and that is
the whole of what is actually controllable. None of them blocks devtools. They
separate the artifact, which is readable, from the reasoning, which they publish
when they choose to and not by accident.

## What is pending

- The `--space-*` scale does not cover what the page uses. It stops at 64 and
  56, 60 and 80 are in use as semantic tokens. Nobody decided whether the scale
  grows or those stay semantic.
- **No undo inside the app**, and it is the most concrete hole. `Move to Trash`
  does not ask, following the HIG, but Apple's test is *"can they undo it?"* and
  today you undo it in the Finder. Sonner is the medium decided on and it is
  postponed: it would be the first UI dependency and it brings a surface this
  system says it does not have.
- **Three of the four clips have no piece linked.** The field exists and the
  picker is in the details panel; only `hold-to-commit` is filled in.
- **The unslop audit of 2026-09-12 left 148 findings and nothing fixed.** Every
  source file read in full, 24,332 lines plus the CSS. The reports are in
  `.context/unslop/`, which does not travel, so what matters is here: about 60
  of the 148 are comments whose lead describes a state that changed, with the
  correction appended below or in another file, and the placeholder era
  survives inside receipts that are quoted as measurements (`--piece-card-gap`
  was chosen over 19 pieces; the index's ceiling in `DESIGN.md` is computed
  over 19). One finding changes what is on screen: the sparks of
  `hold-to-commit` overlap, because their spacing is 0.31 of a hold that went
  from 2000 ms to 1000, and the comment that says they never overlap is doing
  the arithmetic with the old number.
- **The secondary grey fails 4.5:1 in light, and it stays.** Measured on the
  served page: the index at 2.39 and the line under the title at 2.59, against
  the 4.5 the standard asks for text that is read. Dark passes (7.13) and high
  contrast passes (5.18), so it is the default view alone. Four answers were
  built behind a picker and looked at; the value did not move. Black at 53.6%
  over this canvas is the alpha that lands exactly on 4.5, and it is there for
  whoever reopens this.
- **Three linter disables in `native/` with no reason written.** All three are
  `exhaustive-deps`, in `hold-to-commit.tsx`, `meter.tsx` and
  `swipeable-tabs.tsx`. The rule is in `AGENTS.md`; what is missing is reading
  each effect whole, because the reason has to be the true one.
- The canvas's selection inspector, for when there is more than one action to
  put in it. Today `Add to Exhibition` lives in the sidebar. Opening a surface
  now would be chrome for one word.
- The bar is still three mechanisms for four screens: the anonymous portal of
  `.actions`, the detail's row and the canvas's sidebar.
- **Record to verify, not only to publish.** `pnpm record` makes the final clip.
  What is missing is a short recording during the iteration, so the agent sees
  what it did. It is the one thing react-native-motion has and this does not,
  and it only pays off once the agent has eyes.
- The MCPs that give the agent eyes are surveyed and not connected.
- The `expo-modules-jsi` patch is temporary: it exists because this machine has
  Xcode 26.2 and SDK 57 asks for 26.4.
- The SwiftUI workshop, waiting for the first piece that asks for it.
- Footer and signature: the name "Vito Compagnucci" is nowhere yet.
