# The mockup: the video of an App piece for X, in Remotion

A [Remotion](https://www.remotion.dev) composition that puts the
recording of a piece inside Apple's official bezel over a neutral
background, with a camera that comes in to the action and goes out, at
2160² and 60 fps. It is the React version of the ffmpeg pipeline in
`native/scripts/mockup.mjs`, which stays as the reference for the
numbers; here you iterate **in Remotion Studio, live**, and you render
once the look is settled.

```bash
cd mockup && pnpm install
pnpm assets            # bezel + recording normalized to 60 fps → public/ (gitignored)
pnpm verify            # does the slot of the bezel stay filled through the whole camera? (solid red, 12 frames)
pnpm studio            # the look, with every number as a control
pnpm render:both       # out/swipeable-tabs.mp4 (light) and out/swipeable-tabs-dark.mp4: every video comes out twice, for X
pnpm render:exhibition    # out/exhibition.webm + out/exhibition.mov: ONE transparent video with no shadow for the exhibition (the card supplies the background)
pnpm still Shadows out/shadows.png   # the grid: the phone at rest with sixteen shadows, each one with its receipt
pnpm still SymmetricShadows out/symmetric-shadows.png   # sixteen more, with no light from the side
pnpm still Backgrounds out/backgrounds.png   # sixteen backgrounds: flat, gradients, spotlight, mesh, grain, dots, floor, image, the app blurred
```

`pnpm assets --clip=/path/to/another.mp4` for another recording, and
`--output=` for the name in `public/` when there is more than one at a
time. The masters live in `.context/mockup/master/` (not in the vault:
the vault is what is external).

**`--duration=4.10` cuts WHAT IS DELIVERED, and it is cut ONE single
time.** The master is kept whole because it is the record of the take;
what gets delivered can end earlier. The cut goes here, in the clip, and
every render of that piece comes out of it, the ones for X and the ones
for the exhibition. Before, it was rendered whole and each output was
trimmed with `-c copy`, which can only cut on a key frame: it left the
WebM at 4.121 against 4.100 of the `.mov`, that is, two formats of the
same video with different lengths. Cutting the clip, the two of them
give exactly 246 frames and 25 % less gets rendered.

And watch the word: `--duration` is how long the delivered video lasts,
and it has nothing to do with the `until` of `parameters.ts`, which is
the instant the camera STARTS ITS WAY OUT (and `9999` means "it does not
go out"). It was called `--until` for a while and it was renamed for
that reason.

## With more than one piece (2026-09-08)

Hold to commit forced this to stop being the mockup of a single piece.
What changed, and what did NOT:

- **One composition per piece, and one more for its exhibition
  version.** `HoldToCommit` and `HoldToCommitExhibition` next to
  `SwipeableTabs` and `SwipeableTabsExhibition`. The only thing that
  separates them is the CAMERA: where the gesture of each one lives.
  They are compositions and not props because **Remotion merges the
  input props with the defaultProps only at the first level**: passing
  it a partial `camera` erases the focus and the curves, and the zod
  schema rejects it (which is what you want: you find out right away).
- **The renders are asked for by script, not by `pnpm render`.**
  `node scripts/render.mjs <Composition> <slug> [--modes=dark,light]`
  produces the videos for X, and `node scripts/exhibition.mjs
  <Composition>Exhibition <clip>` the pair with alpha. `--modes` exists
  because a piece can have one recording PER APPEARANCE of the app: then
  there are four files, `<slug>-<appearance>-<background>.mp4`, because
  appearance and background are chosen separately.
- **The framing of the exhibition is not the one for X.** The video for
  X leaves the edge and the shadow inside the frame; the one for the
  exhibition IS the box of the card and the phone has to fill it. For a
  gesture that lives at the bottom, the same `focusOnCanvas` leaves a
  third of the card empty: each piece passes its own to `forExhibition`.
- **What did not change:** bezel, size, shadow, backgrounds, zooms and
  curves. All of that is measured on the reference by @nater02 and does
  not get touched per piece.

## The process, end to end

It is the line that was followed with `swipeable-tabs` (2026-09-04) and
the one that gets repeated with every App piece. Each step has its
receipt in the file that is named.

| # | step | where |
| --- | --- | --- |
| 1 | **The piece runs in the simulator** (Pro Max, Expo Go through Metro 8082), without Expo Go's floating button (`EXDevMenuShowFloatingActionButton` set to false) | `native/AGENTS.md` |
| 2 | **The choreography is a probe** in the piece, `?demo=1`: synthetic gestures through the real paths (`onTap` for taps, the pager through `target` with `motion` in drag for drags and flicks). It is born in the initial tab with `contentOffset`. It gets deleted before closing | `native/AGENTS.md` › The recording probe |
| 3 | **It is recorded with simctl**, status bar at 9:41 and battery on `discharging` (no lightning bolt), Expo Go terminated and relaunched with the deep link, 25 to 30 s of take | `native/AGENTS.md` |
| 4 | **The take is measured** (difference between frames at 60 fps): mount, first gesture, last gesture. It is cut 1.2 s before the first gesture (nothing of Expo Go is left, verified in the first 60 frames), it is normalized to 60 fps and 1.5 s of tail is cloned | `.context/recon/<piece>/MEDICIONES.md` |
| 5 | **The master goes to `.context/mockup/master/<slug>.mp4`**, not to the vault: the vault is what is external | root `AGENTS.md` |
| 6 | **`pnpm assets`** copies the bezel and normalizes the clip into `public/` | `scripts/assets.mjs` |
| 7 | **`pnpm verify`** before looking: the slot of the bezel filled in twelve states of the camera | `scripts/verify.mjs` |
| 8 | **The camera is fitted to the take**: `until` = the end of the measured slow gesture; the way in and the way out are the ones from the reference | `src/parameters.ts` |
| 9 | **You look at it in Studio**, you touch whatever needs touching, and **you render twice**: `pnpm render:both` → light and dark | below |
| 10 | **The exhibition takes ONE single render, transparent and with no shadow**, like the Family videos on benji.org: `pnpm render:exhibition` produces `out/exhibition.webm` (VP9 with alpha, Chrome and Firefox) and `out/exhibition.mov` (HEVC with alpha through VideoToolbox, Safari), 1120² (1:1 with the box of 560 on retina), phone at 92 %, and the camera comes in to the tabs and STAYS there until the end: what is being shown are the tabs. The video is the whole box of the card, so the crop of the zoom falls on its edge; the card supplies the background, in whatever theme it is in. It goes in through `pnpm piece:video <slug> mockup/out/exhibition --alpha` from the root. The one for X is the pair with a background | root `AGENTS.md`, path B |
| 10b | **And if the piece draws itself differently in light and in dark, there are TWO pairs**, one per appearance of the app: `node scripts/exhibition.mjs <Composition>Exhibition <slug>-light` and the same with `-dark`, and they go in with `pnpm piece:video <slug> mockup/out/<slug>-light --alpha` and `… <slug>-dark --alpha --dark`. The pair WITHOUT a suffix is the app in light, which is what a reader with the system in light sees. This does not contradict what is above: the BACKGROUND of the card is still one single one, what changes is what you see inside the phone | root `AGENTS.md`, path B |

## The mini-decisions, and why

- **Bezel: iPhone 17 Black.** The reference is a black phone with a
  ratio of 2.05; the 17 measures 2.066 and the Pro Max 2.095, and in
  black there is only the 17. The Pro Max recording goes in scaled (the
  same ratio to within 0.1 %), 4 px larger than the slot per side, with
  a mask of radius 186, smaller than the slot.
- **Size: 75 % of the height.** The reference measures 95.3 %; the brief
  asked for more air. It is a knob (`height`).
- **Background: flat, #EBE6E8**, measured on the reference. On X the
  background is flat (the whole vault except solarn, which uses a
  blurred photo); Rotato advises against animating over photos. Sixteen
  alternatives in `backgrounds.ts` (`pnpm still Backgrounds`).
- **Shadow: the one from the reference, measured**, contact α .60 σ 8
  (12,12) plus ambient α .20 σ 30 (70,70). A more marked one was tried
  (the brief), no shadow at all (Apple: their PSD has four layers and no
  effect, their renders measure 250 at 4 px from the edge, and their
  guidelines forbid adding one to their images), and thirty-two more
  variants (`pnpm still Shadows`, `SymmetricShadows`). The user chose the
  measured one.
- **Camera: three moments.** It comes in to 1.576× over 0.65 s aiming at
  the row of tabs, it stays until the slow gesture ends, it goes out to
  1.161× over 0.62 s. Measured béziers: in (0.30, 0.05, 0.40, 0.90), out
  (0.25, 0.25, 0.20, 0.90). What gets interpolated is (zoom, position of
  the body): with (zoom, aim) the edge of the phone hesitated by seven
  pixels.
- **Each layer at its own size on every frame**, no `transform: scale`;
  PNG between the frame and the encoder; 2160² at 60 fps, h264 crf 17.
- **The recording: it is born in the real initial tab**
  (`contentOffset`), a slow 1.65 s drag with a sine in-out, taps through
  `onTap`, flicks with the finger profile measured on X (15 % in 110 ms,
  the rest in 430) every 1.0 s, and on reaching the last tab, two back.
- **A bug in the piece that the probe uncovered:** the tab bar took
  "there is a tap" from `target !== NONE`; the condition is
  `motion === tap`. It is committed in the piece.
- **Two backgrounds per video:** light (#EBE6E8) and dark (#1C181A, the
  neutral taken down to 11 % with the same tint; no measured reference
  in the vault). The shadow does not change.
- **In the exhibition, no background and no shadow:** the video goes
  transparent over the surface of the card, like Family on benji.org,
  and it IS the whole box (560 on a side, phone at 92 %): the crop when
  the camera comes in falls on the edge of the box, not on an invisible
  square further in. And in the exhibition the camera does not go out:
  it comes in to the tabs and it stays. The ProRes with alpha needs
  `--pixel-format=yuva444p10le`; without that it comes out opaque
  (measured) and the script detects it and stops. Baking the color of
  the card per theme was tried (light exact, dark at one level of blue)
  and it was rejected: "let there be only one background, the one from
  the place the exhibition gives". The alpha travels in two files, WebM
  VP9 and HEVC .mov, because no codec carries it to every browser.

## Where each thing is

| file | what it is |
| --- | --- |
| `src/parameters.ts` | **all the numbers, one per line and with a receipt**: background, height of the phone, shadow, camera, curves. They are the props of the composition and in Studio they show up as controls |
| `src/geometry.ts` | the measured bezel, the camera (k, X, Y) and the rectangles of each layer. Pure, without React: the composition and the verification both use it |
| `src/Mockup.tsx` | the four layers: background, shadow, screen, bezel. Each one at the size it should have on every frame, no `transform: scale` |
| `src/shadows.ts` · `src/Grid.tsx` | sixteen shadows with a receipt (the ones measured in the vault and on @nater02, and the design systems) and the grid that shows them side by side. The chosen one goes into `PARAMETERS.shadow` |
| `src/Root.tsx` | the composition: 2160² · 60 fps, duration read from the clip |
| `scripts/assets.mjs` | copies the bezel and normalizes the recording to a constant 60 fps |
| `scripts/verify.mjs` | the guard on the edges |
| `remotion.config.ts` | PNG between the frame and the encoder, crf 17, yuv420p |

## The three things that are not negotiable

1. **Nothing is asserted without measuring.** The reference is the clip
   by @nater02 (x.com/nater02/status/2092952884987957708), measured
   frame by frame: background, size and position of the phone, shadow,
   zoom and curves. The spreadsheet is in
   `.context/recon/swipeable-tabs/MEDICIONES.md` and each number carries
   its receipt in `parameters.ts`. Where the brief departs from the
   reference on purpose (more air, a more marked shadow), it says so
   next to the number.
2. **Each layer is drawn at its own size on every frame.** No zoom on
   the composited frame: Chrome samples the PNG of the bezel and the
   video at the final resolution. And what gets interpolated is (zoom,
   position of the body), not (zoom, point of aim): with the aim, the
   edge of the phone hesitated by seven pixels before moving (measured,
   see MEDICIONES).
3. **`pnpm verify` before looking.** It puts a solid red in place of the
   recording and checks, with the same geometry it draws with, that the
   slot of the bezel is filled in twelve states of the camera. It exists
   because an origin taken wrong does not fail: it shows, and only in a
   zoom.

## What does not travel

`public/` (Apple's bezel, whose license allows using it for mockups of
their platforms but not redistributing it, and the recording) and `out/`
(the renders). The PNGs of the bezel are downloaded from
<https://developer.apple.com/design/resources/> (Bezel-iPhone-17.dmg)
into `.context/mockup/`, and `pnpm assets` copies them.
