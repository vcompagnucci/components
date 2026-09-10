/* THE NUMBERS OF THE VIDEO, one per line and each with its receipt.
   They are the props of the composition: in Remotion Studio they show
   up as controls and you move them live, without re-encoding anything.

   The reference is the clip by @nater02 (x.com/nater02/status/
   2092952884987957708, 720² at 60 fps, measured frame by frame on
   2026-09-04; the spreadsheet is in
   .context/recon/swipeable-tabs/MEDICIONES.md). Where the brief departs
   from the reference on purpose, it says so. */
import { z } from 'zod'

const curve = z.object({ x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() })

export const schema = z.object({
  /* measured: flat RGB (235, 230, 232), no gradient */
  background: z.string(),
  /* what is behind the phone besides the flat color. `color` is the
     reference; the rest is the exploration of backgrounds (see
     backgrounds.ts): gradients, spotlight, mesh, grain, dots, floor, an
     image, or the app itself blurred. The fields a type does not use
     are ignored */
  backgroundStyle: z.object({
    type: z.enum(['color', 'gradient', 'spotlight', 'mesh', 'grain', 'dots', 'floor', 'image', 'app']),
    colors: z.array(z.string()),
    angle: z.number(),
    image: z.string(),
    blur: z.number(),
    light: z.number(),
    scale: z.number(),
    grain: z.number(),
  }),
  /* body of the phone as a fraction of the height of the canvas. The
     reference measures 0.953; the brief asks for more air: 0.75 */
  height: z.number().min(0.3).max(1),
  /* shadow layers, in px of a 720 canvas (they scale with the canvas
     and with the zoom). Each layer: alpha, blur (σ), offset in x and in
     y, color, and how much the rectangle grows before it is blurred
     (`spread`; negative shrinks it). Measured on the reference by
     @nater02: α .60 σ 8 (12, 12) + α .20 σ 30 (70, 70). The brief asks
     for a more marked shadow: α .82 σ 7 and α .32 σ 36; the offsets
     stay the measured ones. Other variants, measured over the clips of
     the vault or taken from design systems, are in `shadows.ts` */
  shadow: z.array(
    z.object({
      alpha: z.number(),
      sigma: z.number(),
      dx: z.number(),
      dy: z.number(),
      color: z.string(),
      spread: z.number(),
    }),
  ),
  camera: z.object({
    wait: z.number(),
    in: z.number(),
    k1: z.number(),
    until: z.number(),
    out: z.number(),
    k2: z.number(),
    focus: z.number(),
    focusOnCanvas: z.number(),
    airAbove: z.number(),
    curveIn: curve,
    curveOut: curve,
  }),
  /* what goes in the slot: the recording, or a solid red to verify */
  screen: z.enum(['clip', 'red']),
  /* files in public/ (`pnpm assets` writes them) */
  clip: z.string(),
  bezel: z.string(),
  /* size of the recording; calculateMetadata fills it in */
  clipWidth: z.number(),
  clipHeight: z.number(),
})

export type Parameters = z.infer<typeof schema>

/* EVERY VIDEO COMES OUT TWICE: over the light background (the
   reference) and over a dark one. The user's rule, 2026-09-04: "every
   video needs two backgrounds, one for light mode and one for dark
   mode". The dark one is NOT measured. The vault has no reference over
   a dark background: Mini player and Hold to commit, which looked dark,
   measure 253 to 255 in the corners. So it is the measured neutral
   taken down to ~11 % luminance with the same tint: (235,230,232) →
   (28,24,26). The shadow stays the same: black over nearly black is not
   visible, and what separates the phone is the metal edge of the bezel,
   the way Apple does it. */
export const DARK_BACKGROUND = '#1C181A'

/* THE EXHIBITION TAKES A SINGLE RENDER, TRANSPARENT AND WITHOUT SHADOW
   (pnpm render:exhibition → scripts/exhibition.mjs): the exhibition
   card supplies the background, in whatever theme it is in, and the
   phone goes with no shadow, like the Family videos on benji.org. Phone
   at 92 % of the frame (the video is the whole box of the card and the
   user wanted it closer; benji goes to 85 %) and the camera comes in to
   the tabs and stays there until the end (`until` outside the clip):
   what is being shown are the tabs. Before, a light/dark pair was
   rendered with the color of the card baked in and the user rejected
   it: "let there be only one background, the one the library gives, and
   no shadow, like Family" (2026-09-05). The alpha travels in two files
   because no codec carries it to every browser: WebM VP9 for Chrome and
   Firefox, HEVC with alpha in .mov for Safari. */

export const PARAMETERS: Parameters = {
  background: '#EBE6E8',
  backgroundStyle: { type: 'color', colors: [], angle: 180, image: '', blur: 0, light: 0, scale: 1, grain: 0 },
  height: 0.75,
  /* The shadow of the reference video, exactly as it was measured (see
     variant 1 of shadows.ts). The brief had asked for a more marked one
     (α .82 σ 7 + α .32 σ 36); we looked at the grid and the user chose
     the measured one, 2026-09-04. */
  shadow: [
    { alpha: 0.6, sigma: 8, dx: 12, dy: 12, color: '#000000', spread: 0 },
    { alpha: 0.2, sigma: 30, dx: 70, dy: 70, color: '#000000', spread: 0 },
  ],
  camera: {
    /* reference: it comes in from frame 0; here a 0.25 s breath */
    wait: 0.25,
    /* 0.65 s to 1.576× (body width 335 → 528 in 720) */
    in: 0.65,
    k1: 1.576,
    /* until the slow part of the clip ends. Measured over the take of
       2026-09-04 (difference between frames at 60 fps): the slow drag
       Following → Stocks runs from 1.20 to 2.85 s, the tap on For you
       at 3.80, and the seven flicks every 1.0 s from 4.81 (five up to
       Design, two back to Tech). The way out starts at 3.0 and ends at
       3.62, before the tap: the way in covers the whole slow drag and
       the rest is seen from the final framing */
    until: 3.0,
    /* 0.62 s to 1.161× (528 → 389) */
    out: 0.62,
    k2: 1.161,
    /* the row of tabs: status bar + header + half the bar, as a
       fraction of the height of the body */
    focus: 0.145,
    focusOnCanvas: 0.33,
    /* reference: 52 px of air in 720 = 7.2 % */
    airAbove: 0.072,
    curveIn: { x1: 0.3, y1: 0.05, x2: 0.4, y2: 0.9 },
    curveOut: { x1: 0.25, y1: 0.25, x2: 0.2, y2: 0.9 },
  },
  screen: 'clip',
  clip: 'clip.mp4',
  bezel: 'bezel.png',
  clipWidth: 1320,
  clipHeight: 2868,
}

/* ─────────────────────────────────────────────────────────────────
   HOLD TO COMMIT: the second App piece, and the first one that forces
   this mockup to stop being the mockup of a single piece. The only
   thing that changes is the CAMERA: the action of swipeable-tabs is a
   row of tabs at the top, and the action here is a pill at the foot.
   Everything else, bezel, size, shadow, backgrounds, curves, zooms, is
   what was measured on the reference and does not get touched.

   `focus` is the fraction of the height of the BODY the way in looks
   at. The center of the pill sits at 2650 of 2868 px in the capture,
   that is at 92.40 % of the SCREEN; with the slot of the bezel measured
   in `geometry.ts` (body y 27 height 2706, screen y 69 height 2621),
   that is 91.05 % of the body.

   `focusOnCanvas` drops from 0.33 to 0.58, and the number is MEASURED,
   not picked by eye. The pill lives at the bottom, so the framing moves
   down as far as it can without losing the edge of the phone or its
   shadow: the criterion is to leave the same air below that the
   reference leaves above on the way out (`airAbove`, 7.2 %). Measured
   over the frame of the commit, the shadow ends at 84.4 / 89.4 / 92.5 /
   96.4 / 99.9 % of the canvas with focusOnCanvas 0.50 / 0.55 / 0.58 /
   0.62 / 0.67: 0.58 leaves 7.5 % of air and is the one that shows the
   most of the card above the pill, which is the context that makes you
   understand what is being bought.

   `until` is the end of the story, and THE VIDEO ENDS WHEN THE
   ANIMATION ENDS. In the master (cut 1.2 s before the gesture) the hold
   starts at 1.47 s and the burst lands at 2.20. RUNTIME: measuring the
   difference between consecutive frames in the band of the pill and its
   surroundings, the two appearances go still at 3.00 s, when "✓ Order
   Placed" has finished coming into focus and the burst has gone out,
   and they stay still until 4.33, which is when the reset starts to
   move. The clip is cut at 4.10: 1.10 s with the result on screen, and
   0.23 of margin against the reset. The camera starts its way out at
   3.00, that is on the frame where the animation ends, and gets there
   open at 3.62: the ending is seen with the whole phone.

   THE AIR AT THE END IS A REQUEST, not a measurement. It was cut at
   3.25 first, with 0.25 s, and Vito (2026-09-08): "give it more time
   after it ends". What the measurement fixes is the ceiling, not the
   taste: past 4.33 the reset comes in.

   IT DOES NOT WAIT FOR THE RESET. Vito, 2026-09-08: "make the video cut
   earlier, that is, when the animation ends and that is it, nice and
   natural, do not wait for it to go back". The fade back to rest is
   still in the piece; in the video, two and a half seconds waiting for
   the button to unlock are not the piece. Before it was 6.35 with an
   abandoned hold opening the take, and 4.65 without it. */
export const HOLD_TO_COMMIT: Parameters = {
  ...PARAMETERS,
  clip: 'hold-to-commit-dark.mp4',
  camera: {
    ...PARAMETERS.camera,
    focus: 0.9105,
    focusOnCanvas: 0.58,
    until: 3.0,
  },
}

/* THE PARAMETERS OF THE EXHIBITION, derived from the ones of each
   piece. They exist as their own composition and not as props of the
   render because Remotion merges the input props with the defaultProps
   ONLY at the first level: passing it a partial `camera` erases the
   rest of the object, the focus, the zoom, the curves, and the zod
   schema rejects it. With one composition per piece, the render script
   only overrides the clip, which is at the first level. */
export const forExhibition = (p: Parameters, focusOnCanvas = p.camera.focusOnCanvas): Parameters => ({
  ...p,
  background: 'transparent',
  shadow: [],
  /* 92 %: the video is the whole box of the card and the user asked for
     it closer; benji goes to 85 % */
  height: 0.92,
  camera: {
    ...p.camera,
    /* `until` outside the clip: the camera comes in to the gesture and
       STAYS there until the end. "That way you see what I am showing"
       (the user, 2026-09-05). The video for X does go out. */
    until: 9999,
    k2: 1.0,
    airAbove: 0.04,
    /* IN THE EXHIBITION THE VIDEO IS THE WHOLE BOX of the card, so the
       phone has to FILL IT: the crop falls on the edge of the box,
       which is where it has to fall. A piece whose gesture lives at the
       bottom needs its own value, because the one that works for the
       video on X, thought out so that neither the edge nor the shadow
       gets lost, leaves a third of the card empty here. Measured over
       the frame of the commit of hold-to-commit: with 0.58 the body
       reaches 70.9 % of the box and 29.1 % is left empty; with 0.70,
       82.9 %; with 0.78, 90.9 %; with 0.85, 97.9 %; and with 0.92,
       99.9 %. It goes 0.85: it fills the box and leaves the whole pill
       inside. */
    focusOnCanvas,
  },
})
