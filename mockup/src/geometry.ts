/* THE GEOMETRY OF THE MOCKUP, without React: the measured bezel, the
   camera and the rectangles of each layer at each instant. It is pure
   on purpose: the composition uses it to draw and `scripts/verify.mjs`
   uses it to check, with the same numbers, that the slot of the bezel
   stays filled.

   ─── THE BEZEL, measured over the alpha of Apple's PNG ───
   iPhone 17 - Black - Portrait.png (Apple Design Resources, 1350×2760):
   opaque body (20,27) to (1329,2732) = 1310×2706, corner ≈ 246
   (circular fit, error 4.4 px); transparent slot (72,69) to (1277,2690)
   = 1206×2622, continuous corner of ~230 nominal. The screen is masked
   with radius 186, LESS than the slot, and is drawn 4 px larger per
   side, under the opaque bezel: the visible corner is the slot's, and
   if the layers round differently the background does not peek out. The
   recording (1320×2868, Pro Max) goes in scaled: the same ratio to
   within 0.1 % (0.4603 vs 0.4600). Full receipts in
   .context/recon/swipeable-tabs/MEDICIONES.md.

   ─── THE CAMERA ───
   Three moments, measured in the clip by @nater02 (720² at 60 fps): it
   comes in from 1× to 1.576× over 0.65 s, it stays, it goes out to
   1.161× over 0.62 s and it does not move again. The two curves are
   cubic béziers fitted to the width of the body frame by frame (rms
   0.005): in (0.30, 0.05, 0.40, 0.90), out (0.25, 0.25, 0.20, 0.90).

   What gets interpolated is (k, X, Y): the zoom and WHERE the body of
   the phone ends up, not the zoom and a point to aim at. With zoom and
   aim interpolated at the same time the top edge of the phone,
   measured, climbed 7 px before dropping 190: the zoom pushed it up and
   the aim pulled it down. With the position of the body interpolated,
   each edge moves in a single direction, which is what an animated
   framing does as a rectangle. */

export const IPHONE_17 = {
  png: { w: 1350, h: 2760 },
  body: { x: 20, y: 27, w: 1310, h: 2706, r: 246 },
  screen: { x: 72, y: 69, w: 1206, h: 2622, r: 186 },
} as const

/* How much larger than the slot the screen is drawn, in px of the PNG. */
export const OVERHANG = 4

export type Curve = { x1: number; y1: number; x2: number; y2: number }

export type Camera = {
  /* seconds with the whole phone before coming in */
  wait: number
  /* how long the way in takes, and where it gets to */
  in: number
  k1: number
  /* the moment the way out starts (the end of the slow gesture) */
  until: number
  /* how long the way out takes, and where it gets to */
  out: number
  k2: number
  /* what the way in aims at: fraction of the height of the body (0.145
     is the row of tabs: status bar + header + half the bar) */
  focus: number
  /* and where that ends up on the canvas, as a fraction of the height */
  focusOnCanvas: number
  /* air above the phone at the end, as a fraction of the canvas */
  airAbove: number
  curveIn: Curve
  curveOut: Curve
}

export type Framing = {
  /* zoom, and top left corner of the BODY on the canvas */
  k: number
  x: number
  y: number
  /* px of the canvas per px of the PNG, zoom included */
  s: number
}

/* A cubic bézier easing, y(x), by bisection. */
export function bezier({ x1, y1, x2, y2 }: Curve) {
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    let t = x
    for (let i = 0; i < 40; i++) {
      t = (lo + hi) / 2
      const xt = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
      if (xt < x) lo = t
      else hi = t
    }
    return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
  }
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p

/* The body at rest: at `height` of the canvas, centered. */
export function rest(L: number, height: number) {
  const s0 = (height * L) / IPHONE_17.body.h
  const bw0 = IPHONE_17.body.w * s0
  const bh0 = IPHONE_17.body.h * s0
  return { s0, bw0, bh0, bx0: (L - bw0) / 2, by0: (L - bh0) / 2 }
}

/* Where the body is and how much zoom there is at second `t`. */
export function framing(t: number, L: number, height: number, cam: Camera): Framing {
  const { s0, bw0, bh0, bx0, by0 } = rest(L, height)
  const T1 = cam.wait
  const T2 = T1 + cam.in
  const T3 = Math.max(cam.until, T2)
  const T4 = T3 + cam.out

  /* From (zoom, aim) to (zoom, position): the aim of the way in is the
     point of the body that has to end up at `focusOnCanvas` of the
     height; the one of the way out leaves `airAbove` over the phone. */
  const cy1 = by0 + (cam.focus + (0.5 - cam.focusOnCanvas) * (L / (bh0 * cam.k1))) * bh0
  const states = {
    rest: { k: 1, x: bx0, y: by0 },
    in: { k: cam.k1, x: L / 2 - (bw0 * cam.k1) / 2, y: (by0 - cy1) * cam.k1 + L / 2 },
    out: { k: cam.k2, x: L / 2 - (bw0 * cam.k2) / 2, y: cam.airAbove * L },
  }
  const between = (a: { k: number; x: number; y: number }, b: typeof a, p: number) => ({
    k: lerp(a.k, b.k, p),
    x: lerp(a.x, b.x, p),
    y: lerp(a.y, b.y, p),
  })
  let e
  if (t < T1) e = states.rest
  else if (t < T2) e = between(states.rest, states.in, bezier(cam.curveIn)((t - T1) / (T2 - T1)))
  else if (t < T3) e = states.in
  else if (t < T4) e = between(states.in, states.out, bezier(cam.curveOut)((t - T3) / (T4 - T3)))
  else e = states.out
  return { ...e, s: s0 * e.k }
}

export type Rect = { x: number; y: number; w: number; h: number; r: number }

/* The rectangles of each layer on the canvas for a framing. `clip` is
   the size of the recording, which decides the vertical overhang. */
export function layers(e: Framing, clip: { w: number; h: number }) {
  const { body, screen, png } = IPHONE_17
  const f = (screen.w + 2 * OVERHANG) / clip.w
  const screenH = clip.h * f
  return {
    body: { x: e.x, y: e.y, w: body.w * e.s, h: body.h * e.s, r: body.r * e.s } as Rect,
    bezel: { x: e.x - body.x * e.s, y: e.y - body.y * e.s, w: png.w * e.s, h: png.h * e.s, r: 0 } as Rect,
    screen: {
      x: e.x + (screen.x - OVERHANG - body.x) * e.s,
      y: e.y + (screen.y - (screenH - screen.h) / 2 - body.y) * e.s,
      w: (screen.w + 2 * OVERHANG) * e.s,
      h: screenH * e.s,
      r: screen.r * e.s,
    } as Rect,
  }
}
