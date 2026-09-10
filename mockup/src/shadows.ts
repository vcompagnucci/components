/* SIXTEEN SHADOWS FOR THE SAME PHONE, with a receipt. It is the
   material of the `Shadows` grid (pnpm still Shadows): you look at it,
   you choose, and the chosen one goes into `PARAMETERS.shadow`.
   Everything in px of a 720 canvas.

   ─── WHAT WAS MEASURED (2026-09-04, luma around the edge of the phone,
   fit of two gaussians with an offset) ───
   The references of the vault split into three families:
   · NO SHADOW, or almost none: Floating bar and Photo picker (light
     phone over a light background, 0 levels of luma outside the edge)
     and the clip by solarn (8 levels, ~40 px of 2160).
   · ONE WIDE AND FAINT LAYER, barely offset: Swipe to pay (α .20,
     σ 60, offset 10/0), Pill to button (α .15, σ 75, offset 30/10),
     Shelf to card (below: α ~.15, σ ~60).
   · TWO LAYERS, contact + ambient, offset to the right and below: the
     clip by @nater02, the reference of the video (α .60 σ 8 (12,12) +
     α .20 σ 30 (70,70)).
   · APPLE DOES NOT USE A SHADOW. The PSD of the bezel (Apple Design
     Resources, iPhone 17 - Black - Portrait.psd) has four layers,
     Hardware, Screen, Status Bar and a White Fill for Dark Mode that is
     turned off, and no layer effect. Their press renders (newsroom,
     iPhone 17, 2025-09) measure background 250 at 4 px from the edge of
     the phone on all four sides, both in the portrait alone and in the
     lineup. And their Marketing Guidelines forbid it for their product
     images: "Use Apple product images 'as is' and without modification.
     Modifications include adding reflections, shadows, highlights…".
     That holds for Apple's images; the bezel from Design Resources is
     for mockups of your own and there the shadow is our decision.
   The rest are design systems and well-known styles, not measured. */
import type { Parameters } from './parameters'

type Layer = Parameters['shadow'][number]
const layer = (alpha: number, sigma: number, dx: number, dy: number, extra: Partial<Layer> = {}): Layer => ({
  alpha,
  sigma,
  dx,
  dy,
  color: '#000000',
  spread: 0,
  ...extra,
})

export type Variant = { name: string; note: string; shadow: Layer[] }

export const SHADOWS: Variant[] = [
  { name: '@nater02, measured', note: 'contact α.60 σ8 (12,12) + ambient α.20 σ30 (70,70)', shadow: [layer(0.6, 8, 12, 12), layer(0.2, 30, 70, 70)] },
  { name: 'current brief (more marked)', note: 'α.82 σ7 (12,12) + α.32 σ36 (70,70)', shadow: [layer(0.82, 7, 12, 12), layer(0.32, 36, 70, 70)] },
  { name: 'Swipe to pay, measured', note: 'one wide and faint layer: α.20 σ60 (10,0)', shadow: [layer(0.2, 60, 10, 0)] },
  { name: 'Pill to button, measured', note: 'α.10 σ3 + α.15 σ75 (30,10)', shadow: [layer(0.1, 3, 0, 0), layer(0.15, 75, 30, 10)] },
  { name: 'Shelf to card, measured below', note: 'α.15 σ60 (0,20)', shadow: [layer(0.15, 60, 0, 20)] },
  { name: 'solarn, measured: barely there', note: 'α.08 σ13 (0,4)', shadow: [layer(0.08, 13, 0, 4)] },
  { name: 'no shadow', note: 'Floating bar, Photo picker, and Apple: their bezels and their renders carry none', shadow: [] },
  { name: 'pure ambient', note: 'no offset: α.30 σ40 (0,0)', shadow: [layer(0.3, 40, 0, 0)] },
  {
    name: 'Material, elevation 24',
    note: 'umbra + penumbra + ambient, downward only',
    shadow: [layer(0.2, 7.5, 0, 11, { spread: -7 }), layer(0.14, 19, 0, 24, { spread: 3 }), layer(0.12, 23, 0, 9, { spread: 8 })],
  },
  { name: 'long and hard', note: 'no blur: α.18 (36,36)', shadow: [layer(0.18, 0, 36, 36)] },
  { name: 'floating', note: 'far from the floor: α.35 σ32 (0,55)', shadow: [layer(0.35, 32, 0, 55)] },
  { name: 'contact', note: 'resting on the surface: α.55 σ5 (0,5)', shadow: [layer(0.55, 5, 0, 5)] },
  { name: 'light halo', note: 'white: α.90 σ40, +12 of edge', shadow: [layer(0.9, 40, 0, 0, { color: '#ffffff', spread: 12 })] },
  {
    name: 'layers (Comeau)',
    note: 'four layers α.12: σ2 σ6 σ14 σ30, offsets 1 4 10 24',
    shadow: [layer(0.12, 2, 1, 1), layer(0.12, 6, 4, 4), layer(0.12, 14, 10, 10), layer(0.12, 30, 24, 24)],
  },
  { name: 'front light', note: 'short, below: α.25 σ18 (0,14)', shadow: [layer(0.25, 18, 0, 14)] },
  { name: 'dramatic', note: 'strong light from the top left: α.50 σ22 (55,55)', shadow: [layer(0.5, 22, 55, 55)] },
]

/* SIXTEEN MORE, SYMMETRIC: no direction of light from the side. All of
   them centered in x; the "overhead" ones drop a little (dy) and are
   still symmetric from left to right. The user's request, 2026-09-04:
   "more options, maybe more symmetric shadows". None of them is
   measured: they are the vault's "one wide and faint layer" family
   walked through in width, opacity and spread, plus a few
   combinations. */
export const SYMMETRIC_SHADOWS: Variant[] = [
  { name: 'thin ambient', note: 'α.25 σ12, centered', shadow: [layer(0.25, 12, 0, 0)] },
  { name: 'medium ambient', note: 'α.25 σ25, centered', shadow: [layer(0.25, 25, 0, 0)] },
  { name: 'wide ambient', note: 'α.25 σ45, centered', shadow: [layer(0.25, 45, 0, 0)] },
  { name: 'very wide ambient', note: 'α.20 σ70, centered', shadow: [layer(0.2, 70, 0, 0)] },
  { name: 'contact + ambient', note: 'α.45 σ4 + α.18 σ35, both centered', shadow: [layer(0.45, 4, 0, 0), layer(0.18, 35, 0, 0)] },
  { name: 'three centered layers', note: 'α.15 at σ3, σ12 and σ40', shadow: [layer(0.15, 3, 0, 0), layer(0.15, 12, 0, 0), layer(0.15, 40, 0, 0)] },
  { name: 'expanded ambient', note: 'α.20 σ30, +16 of edge', shadow: [layer(0.2, 30, 0, 0, { spread: 16 })] },
  { name: 'contracted ambient', note: 'α.35 σ30, −16 of edge: light from the front', shadow: [layer(0.35, 30, 0, 0, { spread: -16 })] },
  { name: 'almost nothing', note: 'α.08 σ13 (0,4): the one from solarn', shadow: [layer(0.08, 13, 0, 4)] },
  { name: 'short overhead', note: 'α.30 σ16 (0,8)', shadow: [layer(0.3, 16, 0, 8)] },
  { name: 'long overhead', note: 'α.30 σ40 (0,24)', shadow: [layer(0.3, 40, 0, 24)] },
  { name: 'symmetric floating', note: 'α.30 σ50 (0,40)', shadow: [layer(0.3, 50, 0, 40)] },
  { name: 'tint of the background', note: 'shadow in the darkened color of the background: #4a3f44 α.35 σ35', shadow: [layer(0.35, 35, 0, 0, { color: '#4a3f44' })] },
  { name: 'light + shadow', note: 'white halo α.80 σ30 +10 and ambient α.20 σ35', shadow: [layer(0.8, 30, 0, 0, { color: '#ffffff', spread: 10 }), layer(0.2, 35, 0, 0)] },
  { name: 'hard edge', note: 'no blur, +3 of edge, α.30', shadow: [layer(0.3, 0, 0, 0, { spread: 3 })] },
  { name: 'fog', note: 'α.15 σ110, +40 of edge', shadow: [layer(0.15, 110, 0, 0, { spread: 40 })] },
]
