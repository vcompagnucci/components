/* ═══════════════════════════════════════════════════════════════
   BUTTONS SEPARATE: one single shape of glass that opens into four
   round buttons when the pointer moves over it, and closes again when
   the pointer leaves.

   The reference is Spotlight in macOS 26 Tahoe. Every number in this
   file is MEASURED off the 3420×2214 original (2 physical pixels per
   point) and each one carries its receipt beside it. The whole table
   and the scripts that reproduce it are in
   .context/buttons-separate/MEDICION.md.

   FUSED IT IS A PILL, not four circles stuck together: the height
   profile reads 56.0 pt from one end to the other, with no dip. That is
   why the five shapes go under ONE goo and are not drawn touching.

   THE PIECE AGAINST THE RECORDING, with the piece running: 4.95 pt of
   root mean square error on the edge of the group over the first
   second, and 0.039 / 0.228 pt on the opacity and the blur of the
   glyphs. This used to say 2.35 pt: that number came out of a probe
   that modelled the edge of the button at r = 19.58, and what is drawn
   measures 19. Do not go back to 2.35.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { Mount } from '../../../demos'

/* ─────────────────────────────────────────────────────────
 * STORYBOARD: every time is ms from the moment the pointer covers its
 * first 20 px inside the card
 *
 *     0ms   the field starts to shorten, 456 → 276
 *    42ms   the buttons start to fan out, step 0 → 45
 *   ~90ms   the field passes its final width and keeps going
 *   ~140ms  the fourth button shows up past the right end
 *   ~270ms  the glyphs start to gain opacity
 *   ~290ms  and to sharpen, from 2.14 px of blur
 *   ~400ms  the step passes 45 and bounces 6%
 *   ~530ms  the glyphs are there, opaque and sharp
 *   ~730ms  everything still
 *
 * When the pointer leaves the card, the same in reverse and with the
 * delay on the other side: first the buttons come together, then the
 * field covers them.
 * ───────────────────────────────────────────────────────── */

/* THE GEOMETRY, in screen px. It is the reference times 5/7: the field
   at 56 pt tall would go into the 544 card raw, but 640 long would not,
   and shrinking it across only would break the proportion that makes
   this read as a control and not as a bar. Every value carries the
   point it came from beside it. */
const GEOMETRY = {
  height: 40, //          56 pt · 5/7 = 40.0
  field: 276, //         384 pt        = 274.3, rounded to close at 456
  button: 38, //          54 pt        = 38.6
  gap: 7, //              10 pt        =  7.1
  /* THE BOX of the magnifier, not the glyph. The glyph takes 14.5 of
     the 16 units of the viewBox, that is 0.906 of the box: 18 × 0.906 =
     16.3 px, which are the 23 pt measured in the reference times 5/7
     (16.4). It was at 16 with a glyph that filled 0.71 and came out of
     11.35 px, half of the one to copy. */
  magnifier: 18, //       23 pt of glyph = 16.4 px; the box, 18
  magnifierInset: 14, //  20.5 pt = 14.6 from the edge of the field to
  //                      the glyph, and the glyph sits 0.86 in its box
  magnifierToText: 12, // 18 pt = 12.9 from the glyph to the first letter
  text: 18, //            26 pt        = 18.6, taken from the x-height (13.5 pt)
  icon: 22, //            22 pt of 54 = 0.407 of the diameter; here 15.1 of 38 = 0.398
  //                       (the four glyphs take 11 of the 16 box, that is 0.6875)
}
const STEP = GEOMETRY.button + GEOMETRY.gap // 45. 64 pt · 5/7 = 45.7
const TOTAL_WIDTH =
  GEOMETRY.field + GEOMETRY.gap + 4 * GEOMETRY.button + 3 * GEOMETRY.gap // 456. 640 pt
/* The first slot: the centre of the first button, and the point the
   other three come out of. It never moves (note 2 above). */
const FIRST_SLOT = GEOMETRY.field + GEOMETRY.gap + GEOMETRY.button / 2

/* How far the gradient runs past the scene on each side. The glass is a
   blurred copy of that gradient, and a blur eats the edge of its own
   layer: if the two layers end where the scene ends, the left half of
   the glass shows the fade instead of the background. Both are drawn
   over the same enlarged box, so they still line up pixel for pixel. */
const BLEED = 96

/* THE BACKGROUND COMES FROM THE SYSTEM: every stop is the page's canvas
   with ink mixed in, so it follows the theme. It used to be a blue-grey
   gradient with a palette of its own.

   THE PERCENTAGES MATCH THE LUMINANCE of the stops that were there, not
   the colour. The glass is a blurred copy of this background and its
   veil is measured against the native material: if the background
   changes lightness, the glass changes.

   IN LIGHT IT CANNOT BE `--surface` ON ITS OWN: the glass is light and
   over #f8f8f6 it would not show. The gradient goes down to L* 58,
   which is where it lifts off. */
const RAMP = {
  light: { canvas: '#fdfdfc', ink: '#111111', radial: [3.5, 16.8, 36.8, 45.7], linear: [7.0, 47.8] },
  dark: { canvas: '#090908', ink: '#fafaf9', radial: [44.2, 26.2, 10.9, 7.2], linear: [29.4, 3.6] },
} as const

function gradient({ canvas, ink, radial, linear }: (typeof RAMP)[keyof typeof RAMP]) {
  const mix = (p: number) => `color-mix(in srgb, var(--ink, ${ink}) ${p}%, var(--canvas, ${canvas}))`
  const stops = [0, 38, 76, 100]
  return `radial-gradient(118% 150% at 20% 8%, ${radial
    .map((p, i) => `${mix(p)} ${stops[i]}%`)
    .join(', ')}), linear-gradient(160deg, ${mix(linear[0])} 0%, ${mix(linear[1])} 100%)`
}

/* The least room on each side of the bar. Below 456 + 2·44 the bar
   shrinks as a block, with a single factor that goes into the transform
   of the shapes and into the one of the content. */
const SIDE_MARGIN = 44

/* THE MOVEMENT, in Apple's parametrization: `duration` sets the
   frequency (ω = 2π/duration) and `bounce` the damping (1 - bounce).
   Both pairs are MEASURED off the recording by least squares, and they
   were fitted with THIS model in place: the field starting at its
   resting width and the fan at the first slot, with no free phase. With
   the phase loose the fit gives 395 ms for the field and 0.58 pt of
   error, but a t0 of -8 ms eats them, and that t0 does not exist here:
   the spring starts when the pointer comes in. 1.57 and 1.42 pt of
   error over 64 frames. */
const FIELD = { duration: 0.365, bounce: 0.38 } // 365 ms, rms 1.57 pt
const FAN = { duration: 0.532, bounce: 0.32 } //   532 ms, rms 1.42 pt
const DELAY = 0.042 //                             s, measured

/* THE GLYPHS DO NOT FADE IN: THEY COME IN OUT OF FOCUS AND SHARPEN.
   Measured over two cycles and the four buttons
   (.context/…/desenfoque.py):

     α  →  270 ms of delay, 260 ms, bounce 0.14   (rms 0.043)
     σ  →  290 ms of delay, 350 ms, no bounce     (rms 0.122 pt)

   THEY ARE TWO SEGMENTS, not one with two readings: with α already
   pinned to 1 (0.93 at 417) σ keeps coming down from 1.02 to 0.30, so σ
   is not a function of α. And the 20 ms between the two delays do not
   join: joined, the opacity runs a frame behind and the blur a frame
   ahead.

   IT USED TO BE A FADE of 200 ms of delay and 300 of duration. At 300
   ms the glyphs were worth 0.62 and in the reference they are worth
   0.14: they showed up while the buttons were still flying, and sharp
   from the first frame. That reads as "they are loading". */
const ICON = { duration: 0.26, bounce: 0.14 }
const ICON_DELAY = 0.228 //                        270 - 42 ms
const SHARPEN = { duration: 0.35, bounce: 0 }
const SHARPEN_DELAY = 0.248 //                     290 - 42 ms
/* 3.0 pt of the reference times 5/7. Verified in Chrome with a ramp of
   values over a hard edge: on a Retina screen `blur(Npx)` gives a
   gaussian of σ = N px with 8% of error, and below 0.5 px it rounds it
   to zero (they are three boxes, not a gaussian), so the tail is not
   written. */
const BLUR = 2.14 // px

/* CLOSING IS NOT THE OPENING REVERSED, and for three reasons you can
   see by stepping through the close frame by frame (Vito, 2026-09-09:
   "the exit above all, it does not convince me"):

   1. THE ICONS STAYED ON AS GHOSTS. With the segment of 300 the glyphs
      were still worth 0.28 at 120 ms: four icons stacked over the
      field. With 110 they leave BEFORE EVERYTHING ELSE, which is what
      was needed.

      THIS USED TO SAY "before the shapes overlap" AND IT IS NOT TRUE.
      Measured with the piece running (`sonda/salida.cjs`): the shapes
      touch again, step below 38, the diameter, at 49 ms, and there the
      glyphs are worth 0.25. Only at 115 do they get to 0.02. What was
      fixed is the order, not that they reach zero first.
   2. THE FIELD WENT 14 px past its resting length at 300 ms. That
      bounce is MEASURED, but in the contraction of the opening: on the
      way closed there is nothing to justify it and it reads as a
      tremor. Closing, no bounce.
   3. IT WAS AS LONG AS THE OPENING. Whoever is leaving has already
      decided to leave. A quarter shorter, which is the rule.

   The opening stays EXACTLY as the reference: what is here is only the
   close, which the recording does not show. */
const FIELD_CLOSE = { duration: 0.28, bounce: 0 }
const FAN_CLOSE = { duration: 0.4, bounce: 0.1 }
const ICON_CLOSE = { duration: 0.11, bounce: 0 }

/* THE PRESS. It shrinks the circle of the glass, not the glyph: before
   it scaled the <svg> only and it read as "the icon got smaller", not
   as "the button sank". 0.96 and no less, because under 0.95 it looks
   exaggerated. */
const PRESS = { duration: 0.16, bounce: 0 }
const PRESS_SCALE = 0.96

/* With reduced motion the separation does not turn off, it is the
   content of the piece and not an ornament, but the bounce and the
   delay do: one short segment and no overshoot. */
const NO_BOUNCE = { duration: 0.15, bounce: 0 }

/* THE INTEGRATOR. Two second order springs, mass 1, in a single frame
   loop. It is the whole part `motion` was brought in for: fourteen
   compressed kilobytes of library to move two numbers, and in
   production this piece was its only reader.

   Semi-implicit Euler with a fixed substep of 1/240 s: at 60 Hz a step
   of 16.7 ms with ω = 16 rad/s already overshoots, and with the tab in
   the background the browser hands over jumps of hundreds of ms. The
   substep splits them; the cap of 50 ms throws away what was left
   behind.

   Interruption comes for free and it is half the point: coming in and
   out fast with the pointer only changes the target, and the position
   and the velocity go on being the ones that were there. */
const SUBSTEP = 1 / 240
const MAXIMUM_INTERVAL = 0.05

type Spring = {
  x: number //         position, 0 closed and 1 open
  v: number //         velocity, per second
  target: number
  startTime: number // when it starts to move, in clock seconds
  k: number //         stiffness
  c: number //         damping
}

type Tuning = { duration: number; bounce: number }

function tune(s: Spring, { duration, bounce }: Tuning) {
  const w = (2 * Math.PI) / duration
  s.k = w * w
  s.c = 2 * (1 - bounce) * w
}

function createSpring(x: number, tuning: Tuning): Spring {
  const s: Spring = { x, v: 0, target: x, startTime: 0, k: 0, c: 0 }
  tune(s, tuning)
  return s
}

/* Returns true while the spring still has something left to do. Rest is
   taken at 1/2000 of the travel (0.09 px over the 180 the field covers)
   and at 1/200 per second. */
function advance(s: Spring, now: number, dt: number) {
  if (now < s.startTime) return true
  let remaining = Math.min(dt, MAXIMUM_INTERVAL)
  while (remaining > 0) {
    const h = Math.min(SUBSTEP, remaining)
    s.v += (-s.k * (s.x - s.target) - s.c * s.v) * h
    s.x += s.v * h
    remaining -= h
  }
  if (Math.abs(s.x - s.target) < 0.0005 && Math.abs(s.v) < 0.005) {
    s.x = s.target
    s.v = 0
    return false
  }
  return true
}

/* THE GOO. σ = 6.6 pt measured · 5/7 = 4.7 px. The threshold of the
   feColorMatrix sits at alpha 0.5, which is where the sum for the neck
   holds.

   THE GOO ONLY PUTS IN THE NECKS. The edge of each shape is put there
   by the shape itself, drawn again on top and with no filter. It is not
   belt and braces: the SVG specification allows feGaussianBlur to be
   implemented as THREE box blurs, and Chrome does it; with a hard
   threshold behind, the level curves of that approximation show, and a
   circle of 38 comes out as a rounded polygon. It showed at 4× (Vito,
   2026-09-09: "make them come out properly round, at 100").

   The threshold shrinks what is curved by σ²/2R, 0.58 px on a circle of
   19, so the goo layer stays INSIDE the sharp one and no facet shows.
   That is why the radius is no longer compensated.

   σ IS CONSTANT HERE AND IN THE REFERENCE IT IS NOT, and even so it
   stays constant. Measured: the recording is FUSED with 12.9 pt of gap
   (at 360 ms) and SEPARATE with 9.9 (at 700), which means its σ grows
   while the shapes move; the equivalent value would be adding ~3.0
   proportional to the speed of the fan. It was implemented, a staircase
   of five values was tried in images and Vito chose this, with no
   necks, twice. Here the four buttons come apart loose because that is
   how it was preferred when looking at it. The measurement and the
   staircase are in the README. */
const SIGMA = 4.7

/* THE FOUR BUTTONS. Stroke icons, 16×16: they are search scopes, which
   is what the four in the reference are. */
const BUTTONS = [
  {
    name: 'Files',
    path: 'M9.5 2.5H5.1A1.6 1.6 0 0 0 3.5 4.1v7.8a1.6 1.6 0 0 0 1.6 1.6h5.8a1.6 1.6 0 0 0 1.6-1.6V5.5zM9.5 2.5v2.2a.8.8 0 0 0 .8.8h2.2',
  },
  {
    name: 'Images',
    path: 'M2.5 5.3a1.8 1.8 0 0 1 1.8-1.8h7.4a1.8 1.8 0 0 1 1.8 1.8v5.4a1.8 1.8 0 0 1-1.8 1.8H4.3a1.8 1.8 0 0 1-1.8-1.8zM2.9 11.5 5.7 8.9a1.3 1.3 0 0 1 1.8 0l2.3 2.4M9.6 10l.8-.9a1.3 1.3 0 0 1 1.8 0l1.3 1.2M6.4 6.5a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0',
  },
  {
    name: 'People',
    path: 'M10.7 5.7a2.7 2.7 0 1 1-5.4 0 2.7 2.7 0 0 1 5.4 0M3.3 13.4a4.9 4.9 0 0 1 9.4 0',
  },
  {
    name: 'Messages',
    path: 'M12.9 8.05c0 2.6-2.2 4.75-4.9 4.75a5.4 5.4 0 0 1-1.6-.24l-3.1 1.24.8-2.42A4.55 4.55 0 0 1 3.1 8.05c0-2.6 2.2-4.75 4.9-4.75s4.9 2.15 4.9 4.75',
  },
] as const

/* WHAT OPENS THE BAR: the pointer moving 20 px inside the card, not
   hover over the bar. Chosen with a picker of three triggers; the table
   with what each one costs is in the README.

   THE RECORDING DOES NOT SAY WHICH ONE GOES: there the pointer never
   comes up to the bar and the three waits are different. It is the only
   thing in the piece that did not come out of measuring.

   DO NOT PUT ZERO: it fires with a one pixel tremor and with the first
   event the browser sends on entering. */
const MOVEMENT_THRESHOLD = 20 // px

/* THE FIELD TAKES TYPING AND DOES NOTHING ELSE: no suggestions, no
   dropdown and no change of size.

   24 IS WHAT FITS. The box of the text measures 218 px (276 - 44 - 14)
   and an average character in the site's typeface at 18 px measures
   8.69: 25 fit.

   IT DOES NOT SURVIVE A RELOAD, on purpose: it is state of the
   component, with no localStorage, so there is nothing to restore and
   no jump on load. `autoComplete="off"` turns off the restoring of
   forms, which is the other path a value comes back on its own by. */
const MAXIMUM_LENGTH = 24

/* A fine pointer that cannot hover, a finger, has no way to ask for the
   separation, so the piece starts open and stays open. It is the same
   thing the player's speed button does. */
const cannotHover = () => typeof matchMedia === 'function' && !matchMedia('(hover: hover)').matches

/* The same query as the rest of the site, listened to so that a change
   in the system shows up without a reload. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = (e: MediaQueryListEvent) => setReduced(e.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

type Placement = { x: number; y: number; scale: number; width: number; height: number }

export default function ButtonsSeparate({ mode = 'detail' }: { mode?: Mount } = {}) {
  /* Without the colons: `useId` returned them in earlier versions of
     React and an id with `:` cannot be written into a `url(#…)`. */
  const id = useId().replace(/:/g, '')
  const scene = useRef<HTMLDivElement>(null)
  const fieldRect = useRef<SVGRectElement>(null)
  const circles = useRef<(SVGCircleElement | null)[]>([])
  const content = useRef<HTMLDivElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  /* The blur goes on the GLYPH and not on the button: the button also
     carries the veil of the hover, and that one does not sharpen. */
  const glyphs = useRef<(SVGSVGElement | null)[]>([])

  /* It is decided BEFORE the first render and not in an effect: with an
     effect, a phone would paint one frame with the shape closed and
     open it afterwards. */
  const [open, setOpen] = useState(cannotHover)
  const reduced = useReducedMotion()
  const [text, setText] = useState('')

  /* IN THE LIST THE FIELD IS NOT TYPED INTO AND THE BUTTONS ARE NOT
     TOUCHED. There the demo is a PREVIEW inside a card that promises to
     open the detail: a text field fights that click, and four more
     buttons per card make a mess of the tab order. In the detail the
     piece is the thing and it is used whole.

     THE PROP DECIDES IT, not the tree: `mode` is the only prop a piece
     gets, and why it is a prop and not a query to the DOM is above
     Mount, in demos.tsx. */
  const isPreview = mode === 'list'

  /* THE TRIGGER LISTENS TO THE WHOLE SCENE, not to the bar. It goes in
     an effect and not in React props because the one that has to listen
     is the <div> of the scene, which is also the one that masks:
     hanging handlers on it in the JSX would force a re-render of the
     piece to change them. `pointermove` is passive: it does not call
     preventDefault. */
  useEffect(() => {
    const el = scene.current
    if (!el) return
    let origin: { x: number; y: number } | null = null
    const move = (e: PointerEvent) => {
      if (!origin) {
        origin = { x: e.clientX, y: e.clientY }
        return
      }
      if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) >= MOVEMENT_THRESHOLD) {
        setOpen(true)
      }
    }
    const leave = () => {
      origin = null
      /* IF FOCUS IS INSIDE, IT DOES NOT CLOSE. Typing in the field and
         taking the mouse out of the card, the bar closed and the field
         grew over the buttons with the caret still in it. Closing is
         the blur's business, which is further down. */
      if (el.contains(document.activeElement)) return
      setOpen(cannotHover())
    }
    el.addEventListener('pointermove', move, { passive: true })
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])

  /* THE SPRINGS LIVE IN A REF and not in state: the frame loop touches
     them, and one state per frame would re-render the piece sixty times
     a second to move a handful of numbers. */
  const springs = useRef({
    field: createSpring(open ? 1 : 0, FIELD),
    fan: createSpring(open ? 1 : 0, FAN),
    icon: createSpring(open ? 1 : 0, ICON),
    sharpen: createSpring(open ? 1 : 0, SHARPEN),
    press: BUTTONS.map(() => createSpring(0, PRESS)),
  })
  const allSprings = (s: typeof springs.current) => [s.field, s.fan, s.icon, s.sharpen, ...s.press]

  /* WHERE THE BAR LANDS INSIDE THE SCENE. The masks are drawn in the
     space of the scene, so the origin and the scale have to be ONE
     single pair of numbers: the same transform applies them to the
     shapes and to the layer of the content. They are recalculated when
     the scene changes size, not per frame. */
  const [box, setBox] = useState<Placement>({ x: 0, y: 0, scale: 1, width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = scene.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      const scale = Math.min(1, (width - 2 * SIDE_MARGIN) / TOTAL_WIDTH)
      setBox({
        x: Math.round(width - TOTAL_WIDTH * scale) / 2,
        y: Math.round(height - GEOMETRY.height * scale) / 2,
        scale,
        width: Math.ceil(width),
        height: Math.ceil(height),
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /* THE FRAME LOOP, OUTSIDE REACT. It writes attributes and styles
     straight into the DOM. The opacity goes on each button and not in a
     CSS variable on the parent: a variable forces the browser to
     recompute the style of the whole subtree per frame, and this is
     four writes. */
  const paint = useCallback(() => {
    const { field, fan, icon, sharpen, press } = springs.current
    const width = TOTAL_WIDTH + (GEOMETRY.field - TOTAL_WIDTH) * field.x
    fieldRect.current?.setAttribute('width', String(width))
    const step = STEP * fan.x
    const opaque = Math.max(0, Math.min(1, icon.x))
    const visible = String(opaque)
    /* The empty string is written and not `blur(0px)`: a filter, even
       when it does nothing, forces the browser to rasterize the glyph
       on a surface of its own, and at rest that is four for free. The
       cut at 0.4 px does not show: below 0.5 Chrome already rounds to
       zero. */
    const radius = BLUR * (1 - sharpen.x)
    const blurFilter = opaque > 0.001 && radius > 0.4 ? `blur(${radius.toFixed(2)}px)` : ''
    for (let i = 0; i < BUTTONS.length; i++) {
      const shrunk = 1 - (1 - PRESS_SCALE) * press[i].x
      circles.current[i]?.setAttribute('cx', String(FIRST_SLOT + step * i))
      circles.current[i]?.setAttribute('r', String((GEOMETRY.button / 2) * shrunk))
      const button = buttons.current[i]
      if (button) {
        button.style.transform = `translateX(${step * i}px) scale(${shrunk})`
        button.style.opacity = visible
      }
      const glyph = glyphs.current[i]
      if (glyph) glyph.style.filter = blurFilter
    }
  }, [])
  useLayoutEffect(() => {
    paint()
  }, [paint, box])

  /* ONE SINGLE LOOP FOR EVERYTHING, and only while something moves: at
     rest there is no frame asked for, which is what makes eight of
     these pieces in a list cost nothing (measured: eight mounted,
     scrolling at 20× of CPU, zero frames dropped). */
  const frame = useRef(0)
  const clock = useRef(0)
  const animate = useCallback(() => {
    if (frame.current) return
    clock.current = performance.now() / 1000
    const advanceFrame = (ms: number) => {
      const t = ms / 1000
      const dt = t - clock.current
      clock.current = t
      let alive = false
      for (const s of allSprings(springs.current)) alive = advance(s, t, dt) || alive
      paint()
      frame.current = alive ? requestAnimationFrame(advanceFrame) : 0
    }
    frame.current = requestAnimationFrame(advanceFrame)
  }, [paint])
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  /* THE DELAY CHANGES SIDES. On opening, the field goes first and the
     buttons follow it; on closing, the buttons come together first and
     then the field covers them. Otherwise the field would grow over
     four buttons that are still open and they would come out from
     inside it.

     It goes in a LAYOUT effect and not in a normal one: with useEffect
     the first frame of the spring lands after painting, and that is 16
     ms over a separation of 730. */
  useLayoutEffect(() => {
    const { field, fan, icon, sharpen } = springs.current
    const closing = !open
    tune(field, reduced ? NO_BOUNCE : closing ? FIELD_CLOSE : FIELD)
    tune(fan, reduced ? NO_BOUNCE : closing ? FAN_CLOSE : FAN)
    tune(icon, reduced ? NO_BOUNCE : closing ? ICON_CLOSE : ICON)
    tune(sharpen, closing ? ICON_CLOSE : SHARPEN)

    /* WITH REDUCED MOTION THERE IS NO BLUR. The rest gets shorter; this
       turns off whole, because a glyph out of focus is not a softer
       version of a sharp glyph: it is text you cannot read. */
    if (reduced) {
      sharpen.x = 1
      sharpen.v = 0
    }

    /* On mount the target is already the one in place: there is nothing
       to integrate and asking for frames would be leaving them spinning
       through the delay. */
    const target = open ? 1 : 0
    const sharpTarget = reduced ? 1 : target
    const settled =
      field.x === target && fan.x === target && icon.x === target && sharpen.x === sharpTarget
    if (settled) return

    const now = performance.now() / 1000
    field.target = fan.target = icon.target = target
    sharpen.target = sharpTarget
    /* On opening the fan follows; on closing, the field. The glyphs
       come in late and go away at once: on closing there is nothing to
       wait for, and the focus goes with them. */
    field.startTime = fan.startTime = icon.startTime = sharpen.startTime = now
    ;(open ? fan : field).startTime = now + (reduced ? 0 : DELAY)
    if (open && !reduced) {
      icon.startTime = now + DELAY + ICON_DELAY
      sharpen.startTime = now + DELAY + SHARPEN_DELAY
    }
    animate()
  }, [open, reduced, animate])

  const setPressed = (i: number, down: boolean) => {
    const s = springs.current.press[i]
    tune(s, reduced ? NO_BOUNCE : PRESS)
    s.target = down ? 1 : 0
    /* oxlint-disable-next-line react/purity -- `performance.now()` does
       not run in render: `setPressed` is an event handler and its body
       only runs when the user presses. The rule flags it for being
       lexically inside the component. */
    s.startTime = performance.now() / 1000
    animate()
  }

  const groupTransform = `translate(${box.x}px, ${box.y}px) scale(${box.scale})`
  const mask = (which: 'fill' | 'halo' | 'ring') => {
    const url = `url(#mask-${which}-${id})`
    return { maskImage: url, WebkitMaskImage: url }
  }
  /* The region of a mask is the box of the element it masks, and the
     three layers cover the whole scene. Without this, the default value
     resolves against the <svg> of the definitions, which measures zero,
     and the mask comes out empty. */
  const maskBox = {
    maskUnits: 'userSpaceOnUse' as const,
    x: 0,
    y: 0,
    width: box.width,
    height: box.height,
  }

  return (
    <div className="piece" data-piece="buttons-separate">
      {/* See THE STYLESHEET, below: hoisted and deduplicated in
          production, inline in development so that a change of CSS
          shows up without a reload. */}
      {import.meta.env.DEV ? (
        <style>{STYLESHEET}</style>
      ) : (
        <style href="piece-buttons-separate" precedence="medium">
          {STYLESHEET}
        </style>
      )}

      <div className="scene" ref={scene}>
        <div className="background" aria-hidden="true" />

        <svg className="definitions" aria-hidden="true" focusable="false">
          <defs>
            {/* THE GOO: blur and harden the alpha again. The threshold
                stays at 0.5 with 24/-12, which is where the sum for the
                neck holds. Explicit sRGB: by default an SVG filter
                works in linearRGB and the threshold shifts. */}
            <filter id={`goo-${id}`} {...REGION} colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={SIGMA * box.scale} result="blurred" />
              <feColorMatrix in="blurred" type="matrix" values={ALPHA_THRESHOLD} />
            </filter>
            {/* THE CONTACT SHADOW: the softened silhouette MINUS the
                silhouette. Only the halo on the outside is left, so the
                black does not leak in under the glass, which is
                translucent. Measured in the reference: symmetric around
                the shape and out at 3 pt. */}
            <filter id={`halo-${id}`} {...REGION} colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={1.4 * box.scale} result="soft" />
              <feComposite in="soft" in2="SourceGraphic" operator="out" />
            </filter>
            {/* THE BORDER: the silhouette minus the silhouette eaten in
                by one point. It gives the ring of 1 pt measured in the
                reference, and it follows the neck of the goo the same
                as the fill. */}
            <filter id={`ring-${id}`} {...REGION} colorInterpolationFilters="sRGB">
              <feMorphology operator="erode" radius={box.scale} result="eaten" />
              <feComposite in="SourceGraphic" in2="eaten" operator="out" />
            </filter>

            {/* ONE single set of shapes and ONE single pass of goo. The
                three masks start from the same silhouette: the shadow
                and the border get it already fused, so their necks are
                exactly the ones of the fill. */}
            <g id={`shapes-${id}`} transform={`translate(${box.x} ${box.y}) scale(${box.scale})`}>
              <rect
                ref={fieldRect}
                x="0"
                y="0"
                width={TOTAL_WIDTH}
                height={GEOMETRY.height}
                rx={GEOMETRY.height / 2}
                fill="#fff"
              />
              {BUTTONS.map((b, i) => (
                <circle
                  key={b.name}
                  ref={(el) => {
                    circles.current[i] = el
                  }}
                  cx={FIRST_SLOT}
                  cy={GEOMETRY.height / 2}
                  r={GEOMETRY.button / 2}
                  fill="#fff"
                />
              ))}
            </g>
            <g id={`silhouette-${id}`}>
              <g filter={`url(#goo-${id})`}>
                <use href={`#shapes-${id}`} />
              </g>
              <use href={`#shapes-${id}`} />
            </g>

            {/* The prefix on the masks is NOT decorative: a <mask> and a
                <filter> with the same id are a duplicate id, and
                url(#…) resolves to the first of the two, which leaves
                the whole layer blank without saying anything. */}
            <mask id={`mask-fill-${id}`} {...maskBox}>
              <use href={`#silhouette-${id}`} />
            </mask>
            <mask id={`mask-halo-${id}`} {...maskBox}>
              <g filter={`url(#halo-${id})`}>
                <use href={`#silhouette-${id}`} />
              </g>
            </mask>
            <mask id={`mask-ring-${id}`} {...maskBox}>
              <g filter={`url(#ring-${id})`}>
                <use href={`#silhouette-${id}`} />
              </g>
            </mask>
          </defs>
        </svg>

        <div className="shadow" style={mask('halo')} aria-hidden="true" />
        <div className="glass" style={mask('fill')} aria-hidden="true">
          <div className="refraction" />
          <div className="veil" />
        </div>
        <div className="border" style={mask('ring')} aria-hidden="true" />

        {/* THE SCENE LISTENS FOR THE POINTER, in the effect above. What
            is left here is only the focus and the blur of focus, which
            are the path of the keyboard: without them the separation
            would not exist for anyone who does not use a pointer. */}
        <div
          className="content"
          ref={content}
          data-open={open ? '' : undefined}
          style={{ transform: groupTransform }}
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setOpen(cannotHover)
          }}
        >
          <div className="field" aria-hidden={isPreview || undefined}>
            {/* The glyph fills the box from 0.75 to 15.25; the stroke of
                1.27 gives the 2 pt measured in the reference (1.43
                px). */}
            <svg className="magnifier" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="6.4" cy="6.4" r="5" stroke="currentColor" strokeWidth="1.27" />
              <path
                d="M9.95 9.95 14.8 14.8"
                stroke="currentColor"
                strokeWidth="1.27"
                strokeLinecap="round"
              />
            </svg>
            {isPreview ? (
              <span className="field-text">Search</span>
            ) : (
              <input
                className="field-text input"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search"
                aria-label="Search"
                maxLength={MAXIMUM_LENGTH}
                /* Not one of the four is decorative: `off` turns off the
                   browser's restoring on reload, which is the way an
                   old value would come back, and the other three take
                   away the correction, the red underline and the
                   dictation bar, which are things of a form and here
                   there is no form. */
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            )}
          </div>
          {BUTTONS.map((b, i) => (
            <button
              key={b.name}
              type="button"
              ref={(el) => {
                buttons.current[i] = el
              }}
              className="button"
              style={{ left: FIRST_SLOT - GEOMETRY.button / 2 }}
              aria-label={b.name}
              /* IN THE LIST IT IS NOT TABBED TO AND NOT TOUCHED, for the
                 same reason the field is not typed into: there the demo
                 is a preview inside a card that promises to open the
                 piece. Without this, tabbing through the list stops at
                 four buttons per card that do nothing. With
                 pointer-events none the click lands on the card and
                 navigates, which is what the reader expects. */
              tabIndex={isPreview ? -1 : undefined}
              data-inert={isPreview ? '' : undefined}
              onPointerDown={() => setPressed(i, true)}
              onPointerUp={() => setPressed(i, false)}
              onPointerCancel={() => setPressed(i, false)}
              onPointerLeave={() => setPressed(i, false)}
              onClick={(e) => {
                /* The same brake as the speed button of the player: in
                   the list this demo lives inside the <a> of the card,
                   and without this a click here navigates. */
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                ref={(el) => {
                  glyphs.current[i] = el
                }}
              >
                <path
                  d={b.path}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* The region of the three filters. By default a filter paints barely
   10% outside the box of the shape, and over a bar of 456×40 that is 4
   px above and below: the blur and the shadow would come out cut. */
const REGION = { x: '-10%', y: '-80%', width: '120%', height: '260%' } as const
/* Alpha times 24 minus 12: a step with the threshold at 0.5. */
const ALPHA_THRESHOLD = '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12'

/* The stylesheet goes inside the file because a published piece is ONE
   file in src/components/pieces/: it cannot bring a .module.css along
   beside it. The href deduplicates it, React 19 hoists it once even if
   the list and the detail mount two, and the data-piece fences it in,
   so the short names inside do not collide with anyone. */
const STYLESHEET = `
/* BOTH of them: in the card the height comes from an inherited
   min-height and the 100% does not resolve; on the canvas of the
   playground the frame has a fixed height and then the one that does
   not resolve is the min-height. */
[data-piece='buttons-separate'] {
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: grid;
}
[data-piece='buttons-separate'] .scene {
  position: relative;
  min-height: inherit;
  isolation: isolate;
  overflow: hidden;
  /* The same radius as the card. It is written with a fallback because
     a piece imports nothing from the product: if the token is there, it
     wins. */
  border-radius: var(--card-radius, 8px);
  /* See RAMP: every stop is the canvas of the page with ink mixed in,
     at the percentage that matches the luminance the hand-written
     gradient had. */
  --piece-background: ${gradient(RAMP.light)};
  /* THE VEIL AND THE BLUR COME OUT OF THE NATIVE MATERIAL, measured on
     this same Mac with a SwiftUI probe: .glassEffect() over three ramps
     of known value, captured with screencapture and fitted by least
     squares. The law is LINEAR in sRGB:

       light  output = 0.325 · background + 159   (rms 4.5 levels)
       dark   output = 0.444 · background +  31   (rms 10.4)

     And that is exactly a veil: 1 - gain is the alpha, and the offset
     divided by the alpha is the colour. No saturate and no brightness:
     the fit with a free saturate does not improve. See
     .context/buttons-separate/vidrio/. */
  --piece-veil: rgba(235, 235, 235, 0.675);
  /* THE RING, measured in the reference: it lifts the fill 40 levels
     and no more, from rgb(178,197,230) to rgb(218,241,255), and it is a
     COLD white, not pure white. With the fill here, 40 levels are 0.42
     of alpha. */
  --piece-ring: rgba(255, 255, 255, 0.85);
  --piece-shadow: 0.16;
  /* The highlight of the hover TINTS, it does not lighten: in light the
     glass is already almost white and a white veil on top does not
     show. */
  --piece-highlight: rgba(46, 68, 97, 0.1);
  /* ONE SINGLE INK. In the reference the placeholder, the magnifier and
     the four glyphs measure the same, rgb(47,69,99), rgb(48,69,97) and
     rgb(44,65,95): there is no separate placeholder grey.

     AND IT COMES OUT OF THE SYSTEM, the same as the background and by
     the same method: the mix that matches the LUMINANCE of the measured
     ink. #2e4461 sits at L* 28.32 and 78.9% of ink over the canvas
     gives L* 28.32. The cold hue is lost and the weight is kept, which
     is what decides the reading: the contrast against the glass stays
     at the same 7.88:1. With the background already neutral, a cold ink
     was the only seam left. */
  --piece-ink: color-mix(in srgb, var(--ink, #111111) 78.9%, var(--canvas, #fdfdfc));
}
@media (prefers-color-scheme: dark) {
  [data-piece='buttons-separate'] .scene {
    --piece-background: ${gradient(RAMP.dark)};
    /* More veil than in light: the glass of the reference lifts the
       background some 120 levels in the three channels, and over a dark
       background that asks for more white to get to the same place. */
    /* THE VEIL DOES NOT CHANGE WITH THE THEME. The dark law of the
       native material is measured too, output = 0.444 · background + 31,
       that is a veil of rgb(55,55,55) at 55.6%, and it gives glass
       DARKER than the background, which is what macOS does in dark.
       Here it is not used: the reference is the light appearance, light
       glass over a dark sky, and that is exactly what happens in the
       dark theme of the piece when the scene goes down and the veil
       stays. Putting the dark law in leaves a dark shape over a dark
       background and the ink unreadable; tried. */
    --piece-ring: rgba(226, 246, 255, 0.42);
    --piece-shadow: 0.42;
    --piece-highlight: rgba(255, 255, 255, 0.2);
    /* The same sum with the tokens of the theme: 22.4% of ink over the
       dark canvas gives L* 26.6, which is the ink that was there. */
    --piece-ink: color-mix(in srgb, var(--ink, #fafaf9) 22.4%, var(--canvas, #090908));
  }
}
[data-piece='buttons-separate'] .background,
[data-piece='buttons-separate'] .refraction {
  position: absolute;
  inset: -${BLEED}px;
  background: var(--piece-background);
}
[data-piece='buttons-separate'] .definitions {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

/* THE GLASS IS A SECOND COPY OF THE BACKGROUND, blurred and lightened,
   not a backdrop-filter. Two reasons and both matter: the blur of the
   reference is enormous, over the light cloud the glass comes out
   almost neutral, which means it averages a neighbourhood the width of
   the cloud, and a backdrop-filter clipped by an SVG mask is not
   guaranteed in every engine. Here the background is ours, so copying
   it is exact, and it also comes out cheaper: the blurred layer never
   changes, the only thing that moves is the mask.

   The blur goes on the child and the mask on the parent because the
   order in CSS is filter and THEN mask: with both on the same layer,
   the white veil would go into the saturate and the brightness too. */
[data-piece='buttons-separate'] .glass,
[data-piece='buttons-separate'] .shadow,
[data-piece='buttons-separate'] .border {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
/* σ = 4.0 pt, measured over a hard black to white edge under the native
   glass: the 10 to 90% crosses in 10.2 pt, and for a gaussian that is
   2.563 σ. Times 5/7 it is 2.9 px. It was at 20, seven times too much:
   the error came from reading the blur off the video, where the glass
   over the cloud comes out almost neutral. But that is not blur, it is
   the law of the material compressing the range. */
[data-piece='buttons-separate'] .refraction {
  filter: blur(2.9px);
}
[data-piece='buttons-separate'] .veil {
  position: absolute;
  inset: 0;
  background: var(--piece-veil);
}
/* The measured contact shadow: the background times ~0.65 right against
   the edge and out at 3 pt. It goes black and short, not a drop shadow:
   in the reference it is the same above as below. */
[data-piece='buttons-separate'] .shadow {
  background: #000;
  opacity: var(--piece-shadow);
}
[data-piece='buttons-separate'] .border {
  background: var(--piece-ring);
}

[data-piece='buttons-separate'] .content {
  position: absolute;
  top: 0;
  left: 0;
  width: ${TOTAL_WIDTH}px;
  height: ${GEOMETRY.height}px;
  transform-origin: 0 0;
  z-index: 1;
  color: var(--piece-ink);
}
/* THE FIELD IS THE WHOLE PILL and not a row that grows with its
   content. It used to be a flex of two, glyph and text, and the width
   came from the word; with an input inside, that is a field that grows
   as you type. Now the box measures what the open field measures and
   the two parts lean on top of it, each in its measured place, so the
   click lands anywhere on the pill, the magnifier included. */
[data-piece='buttons-separate'] .field {
  position: absolute;
  inset: 0 auto 0 0;
  width: ${GEOMETRY.field}px;
  pointer-events: none;
  user-select: none;
}
[data-piece='buttons-separate'] .magnifier {
  position: absolute;
  left: ${GEOMETRY.magnifierInset}px;
  top: ${(GEOMETRY.height - GEOMETRY.magnifier) / 2}px;
  width: ${GEOMETRY.magnifier}px;
  height: ${GEOMETRY.magnifier}px;
  color: var(--piece-ink);
}
/* THE SAME BOX FOR BOTH, the <span> of the list and the <input> of the
   detail, so that the text does not move a pixel between one and the
   other: the whole pill, with the inset on the left as padding and the
   line at the height of the bar. With the line height equal to the
   height, the half leading centres the glyph exactly where line height
   1 left it before, same metric, same baseline, and it also leaves room
   for the tails of the g and the y, which an input does clip against
   its box. */
[data-piece='buttons-separate'] .field-text {
  position: absolute;
  inset: 0;
  padding: 0 ${GEOMETRY.magnifierInset}px 0
    ${GEOMETRY.magnifierInset + GEOMETRY.magnifier + GEOMETRY.magnifierToText}px;
  font-size: ${GEOMETRY.text}px;
  line-height: ${GEOMETRY.height}px;
  letter-spacing: -0.01em;
  color: var(--piece-ink);
}
[data-piece='buttons-separate'] .input {
  width: 100%;
  margin: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-weight: inherit;
  appearance: none;
  pointer-events: auto;
  user-select: text;
  /* THE HIT AREA REACHES 44 even though the bar measures 40. The 2 px
     on each side stick out of the pill and land on the scene, which
     does not listen for the click, so they take hit area away from
     nobody. The line height goes up with the box, 40 to 44, and that is
     why the text does not move: the half leading recentres it and the
     baseline stays where it was. The four buttons already reached 44
     through their ::before. */
  top: -2px;
  bottom: -2px;
  line-height: 44px;
  /* Without this, a double tap on the field zooms instead of typing. */
  touch-action: manipulation;
  /* The caret IS the focus indicator of this field (note below), so the
     ink of the piece is set on it and it is not left to the browser. */
  caret-color: var(--piece-ink);
  /* On touch, Android and iOS paint a grey rectangle on top. It is the
     same family of problem as the ring: chrome of the browser drawn
     over the glass. */
  -webkit-tap-highlight-color: transparent;
}
/* In the reference the placeholder, the magnifier and the typed text
   measure the same: there is no separate placeholder grey. Firefox
   gives it 0.54 of opacity on its own. */
[data-piece='buttons-separate'] .input::placeholder {
  color: var(--piece-ink);
  opacity: 1;
}
/* THE FIELD CARRIES NO FOCUS RING, AND IT IS NOT AN OVERSIGHT. In a
   text field Chrome matches :focus-visible ALWAYS, the element takes
   keys, so a normal click to type draws the ring: it is not a focus
   indicator, it is a permanent border. And it came out rectangular over
   a pill, because the radius is drawn by the mask and not by this
   element.

   The indicator is THE CARET, which is there whenever the field has the
   focus, with the mouse and with the tab key. The four buttons do carry
   a ring: a button has no caret. */
[data-piece='buttons-separate'] .input:focus,
[data-piece='buttons-separate'] .input:focus-visible {
  outline: none;
}
[data-piece='buttons-separate'] .button {
  position: absolute;
  top: ${(GEOMETRY.height - GEOMETRY.button) / 2}px;
  width: ${GEOMETRY.button}px;
  height: ${GEOMETRY.button}px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--piece-ink);
  /* The frame loop writes it. The starting value goes here so that the
     first paint does not show the four stacked. */
  opacity: 0;
  transform-origin: 50% 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  isolation: isolate;
  touch-action: manipulation;
  /* Closed, the four are stacked and transparent: without this, a click
     there hits the last one of the stack. */
  pointer-events: none;
}
[data-piece='buttons-separate'] .content[data-open] .button {
  pointer-events: auto;
}
[data-piece='buttons-separate'] .button[data-inert] {
  pointer-events: none;
  cursor: inherit;
}
/* The touch area reaches 44 without touching the neighbour's: the gap
   is 7, and 3 on each side leave 1 between the two.

   WITH THE BAR CLOSED, THESE BUTTONS ARE FOCUSABLE AND WORTH ZERO
   OPACITY. An audit flags it, tabbing towards something invisible is a
   defect, and here it is not: the focus OPENS the bar, because the
   onFocus lives on the content and focusin bubbles. Verified by tabbing
   for real: the focus reaches the field first, which already opens it,
   so none of the four gets the invisible focus; and coming in from
   behind, the one that gets it opens the bar in the same frame. It is
   the pattern of a disclosure: hiding them with visibility hidden would
   close the only way the keyboard has to open it. */
[data-piece='buttons-separate'] .button::before {
  content: '';
  position: absolute;
  inset: -3px;
}
/* The frame loop writes the filter while the glyph sharpens, and puts
   it back to the empty string when it gets there. The smear is bigger
   than the glyph, so it needs room to spill: overflow visible is the
   default value of an inline svg, but it is written down because the
   smear not coming out clipped depends on it. */
[data-piece='buttons-separate'] .button svg {
  position: relative;
  width: ${GEOMETRY.icon}px;
  height: ${GEOMETRY.icon}px;
  overflow: visible;
}
/* THE HOVER LIGHTS UP THE GLASS, not the glyph. The fill of the button
   is drawn by the masked layer, which is one single layer for the five
   shapes: a round veil the exact size of the circle, on top, is the
   only way to lighten ONE. The press no longer lives here: it shrinks
   the CIRCLE of the mask, in the frame loop, so the whole button sinks
   and not the glyph alone. */
[data-piece='buttons-separate'] .button::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--piece-highlight);
  opacity: 0;
  transition-property: opacity;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
/* A finger fires :hover on touch and leaves it stuck. */
@media (hover: hover) and (pointer: fine) {
  [data-piece='buttons-separate'] .button:hover::after {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  [data-piece='buttons-separate'] .button::after {
    transition-duration: 0s;
  }
}
[data-piece='buttons-separate'] .button:focus-visible {
  outline: var(--focus-outline, 2px solid #005fcc);
  outline-offset: var(--focus-outline-offset, 2px);
}
`

/* THE STYLESHEET is hoisted in production and goes inline in
   development. React 19 hoists a <style href> ONCE per href: that
   deduplicates the list and the detail, and with HMR it leaves the OLD
   sheet in place until you reload by hand. With no href there is no
   hoisting and the change of CSS shows up right away, undoing it
   included.

   DO NOT PUT THE FINGERPRINT OF THE SHEET IN THE href: it fixes the way
   out and breaks the way back, because on returning to an earlier CSS
   the last one in wins. Measured. In development two identical <style>
   tags are left; it is harmless and the branch never reaches the
   bundle. */
