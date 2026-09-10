import type { GlassViewProps } from 'expo-glass-effect'
import { type ComponentType, type ReactNode, useEffect, useMemo } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
} from 'react-native-reanimated'
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets'

import { Sparks } from './sparks'
import { Label, HOLD as L_HOLD, KEEP as L_KEEP, PLACED as L_PLACED, type Ink } from './label'
import { onComplete, DETENTS, tick } from './haptics'
import type { Material } from './material'
import { LIGHT, COLOR, COMMIT, CROSSFADE, SPILL, FRONT, frontAt, HOLD, LABEL, PARTICLES, PILL, PRESS, RESET, VEIL } from './measurements'
import { markJS, markUI } from './meter'
import { Particles } from './particles'
import { KINEMATICS, move, type Recipe, timing, type Timings } from './recipe'
import { LEAD_MS, prepareSound, playSound } from './sound'

/* ─────────────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD: hold to commit
 *
 * Read it top to bottom. The ms are counted from each block's event, in
 * the active recipe, `clip` (Opal's measured timings); in brackets, what
 * changes with `skill` (springs where there is a finger, contextual
 * checkmark). Every number lives in `recipe.ts` or in `measurements.ts`,
 * with its receipt; here they are only read.
 *
 * PRESS: the finger comes down
 *      0ms   pill scale 1 → .953, 250 ease-out              [.97, spring 150 bounce 0]
 *      0ms   fill opacity 0 → 1, 330 ease-in-out
 *      0ms   front translateX 4.5 % → 95.5 % of the width, linear 1000: it is the gesture
 *      0ms   "Hold to Buy" exits 48 · "Keep Holding..." enters 360, blur-replace
 *    150ms   first haptic tick (twelve in all, closer and closer together)
 *    550ms   label white → greenish gray, by progress, until 700
 *    940ms   Apple Pay sound, 60 ms before the end
 *    965ms   label → black
 * RELEASE before the end: the finger comes up
 *      0ms   front back to 0, 400 ease-out                  [spring 400 bounce 0, clamped at 0]
 *      0ms   fill opacity → 0, 420 exponential
 *      0ms   pill scale → 1, 250 ease-out                   [spring 400 bounce 0]
 *     80ms   "Keep Holding..." exits 250
 *    150ms   "Hold to Buy" enters 600, linear
 * COMMIT: 1000 ms of hold
 *      0ms   success haptic · burst of 46 dots, 700 linear
 *      0ms   pill scale → 1, 25 % jump + 220 ease-out       [spring 400 bounce 0]
 *      0ms   white veil opacity 0 → .75, 330 ease-out
 *      0ms   checkmark glued to the text                    [with its own layers: opacity 0 → 1, scale .25 → 1, blur 4 → 0, over the same presence and staircase]
 *     40ms   "Keep Holding..." exits 280
 *    210ms   "Order Placed" enters 450, linear, scale .9 → 1
 *    250ms   front 95.5 % → 101 %, 400 ease-out
 *   5000ms   RESET: veil and fill opacity → 0, 400 ease-out · "Order Placed" exits 250
 *   5400ms   geometry back to rest, invisible · "Hold to Buy" enters 300
 * ───────────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════
   HOLD TO COMMIT: the button. You press, it fills from left to right in
   `HOLD.duration` (1 s on request; the clip measures 2), and if you hold
   it to the end it stays white with a "✓ Order Placed". If you let go
   earlier, the light retreats and it goes back to saying "Hold to Buy".
   There is no progress bar: the light IS the progress.

   ONE SINGLE STAGE IS IN CHARGE (interface-craft: "a single integer state
   drives the entire sequence; no scattered boolean flags"). `stage` is an
   integer (rest, hold, sounding, commit, reset) and every worklet reads
   it to know whether it is its turn: press only at rest or while
   releasing, release only with the finger down, complete once, the sound
   once per hold. There used to be two flags (`terminado`, `sono`).

   EVERYTHING RUNS ON THE UI THREAD. The gesture is a Gesture Handler
   LongPress whose `minDuration` is the SAME number as the fill's duration
   (`HOLD.duration`): the recognizer's native clock decides when it
   completed, and the progress's linear `withTiming` reaches 1 at the same
   instant. It is rule 3 of the workshop's AGENTS: two gestures that have
   to match come out of a single constant. The JS thread is only asked for
   the haptics and the sound (`scheduleOnRN`), and never per frame: at the
   progress's detents (`useAnimatedReaction`) and on completion.

   ONLY TRANSFORM AND OPACITY (2026-09-07). Everything that moves is a
   translate, a scale or an opacity; the label's color is opacity too:
   three sets of the text in its three inks and a partition derived from
   the progress (`ink`, see label.tsx).

   THE CURVES AND TIMINGS COME FROM THE RECIPE (`recipe.ts`): the one
   faithful to the clip, by time, or the one from the skill's tables, with
   springs where there was a finger. The button does not know which one is
   set: it takes `recipe`, reads `R`, and every movement goes through
   `move(to, R.x)`.

   THE FILL IS FOUR TEXTURES, not views with a gradient (which in RN would
   need a native module, see `media/generate.swift`):

     sheen  the resting teal→green, hugging the bottom edge, fixed
     body   a 1 px column stretched across the width, white with the pale
            green rim above and below
     front  the leading edge: a capsule with an erfc falloff of σ=19 pt
            centered on the geometric edge (140 pt of texture)
     veil   the blob's left tip (a blurred capsule that starts 6 pt inside
            the pill), made as a veil the color of the pill over the body,
            turned on along with it

   `body` and `front` travel together in ONE translateX: the fill's
   geometric edge, where the front is at 50 %, goes from 4.5 % to 95.5 %
   of the width during the hold (`frontAt`, that is, `start` .045 plus
   `travel` .91 from `measurements.ts`; the clip does not reach the right
   tip, the whitening covers it). On top of that the front widens by 25 %
   over the course of the hold and the left tip darkens and widens as the
   front moves away: both things are a `scaleX` on the texture, with the
   pivot where it belongs. Ahead of the front travel the SPARKS
   (`sparks.tsx`), a function of the same progress.

   WITH REDUCE MOTION (animate-expo § 9: what counts the state stays,
   opacity and color, and what moves goes) there is no sweep and no scale:
   the whole fill turns on with the progress as its opacity, the label
   crossfades by opacity with no blurred copies and no scale, and there
   are no sparks and no burst. The label's color by progress stays.

   THE LABEL has three texts with a PRESENCE each (0..1); crossfading is
   taking the arriving one's to 1 and the leaving one's to 0, each with
   its own duration and delay (`R.crossfade`): the outgoing one leaves
   fast, the incoming one focuses with a tail. The blur staircase is in
   `label.tsx`.

   The pill SHRINKS on press and comes back on release or on completion.
   It is measured and it is half the feel.

   IN LIGHT MODE (`scheme`, the screen decides it; receipt in `LIGHT`) the
   pill stays dark but with nothing painted on its background: no resting
   sheen and no veiled tip, and the burst is the color of the pill. Asked
   for on 2026-09-07, looking at the simulator in light mode. What
   separates it from the page is the shadow in `css.shadow`, in both
   themes.

   PERFORMANCE (2026-09-07, measured with `meter.tsx` under `load.tsx`):
   nothing you can see depends on the JS thread. The gesture, the fill,
   the sparks, the label, the burst and the RESET run on UI; the reset used
   to be a JS `setTimeout` and with JS busy it arrived late, now it is a
   `withDelay` over a shared value. The only things that cross to JS, the
   haptics and the sound, cross at the exact instant and JS attends to
   them when it can: `markUI()`/`markJS()` leave stamps on both threads so
   you can measure how long that takes.
   ═══════════════════════════════════════════════════════════════ */

const TEXTURE = {
  sheen: require('./media/sheen.png'),
  body: require('./media/body.png'),
  front: require('./media/front.png'),
  veil: require('./media/veil.png'),
}
const FRONT_WIDTH = FRONT.before + FRONT.after
const VEIL_WIDTH = Image.resolveAssetSource(TEXTURE.veil).width

/* THE STAGE: the button's only state, an integer. */
const STAGE = { rest: 0, hold: 1, sounding: 2, commit: 3, reset: 4 } as const

/* THE GLASS, if it is there. `expo-glass-effect` is a native module: if
   the binary does not link it (an Expo Go of another version, an old dev
   client) the import brings the whole piece down, so it is asked for
   carefully and, if it is missing or iOS is older than 26, the `glass`
   option falls back to a flat translucent capsule.

   HOW A SERIOUS APP WOULD SHIP IT (Vito, 2026-09-04: "Apple's native
   liquid glass, done properly, not something that just looks like it").
   What makes the material LOOK and FEEL right, according to Apple's guide
   for Liquid Glass (HIG › Materials, WWDC25 "Meet Liquid Glass"):
     1. `regular` with no tint: the glass of controls, the one that
        refracts. A prominent tint turns it almost opaque and hides the
        material.
     2. `isInteractive`: the material answers the finger with its own
        bulge and its own shine. That is why the glass pill does NOT use
        the press scale measured in Opal: it would be double feedback.
     3. Content passing UNDERNEATH: glass only reads when there is
        something behind it to refract. The `stock` background scrolls
        under the button, which floats (see hold-to-commit-screen.tsx).
     4. Nothing on top that is not content: Opal's resting sheen and its
        veiled tip belong to the opaque pill and do not go here. The white
        fill of the hold sweeps over it as always: it is the gesture.
     5. The label follows the color scheme, like every glass control:
        black in light, white in dark.
   The material's traps are in `native/GLASS.md`: it does not go under an
   animated opacity (the scale is a transform: that is fine) and NOBODY
   clips it, neither it nor its ancestors. Here the glass is the CONTAINER
   and the texture clipping is its child: the child clips itself, the
   glass stays free and keeps its circular `borderRadius`. */
type Glass = ComponentType<GlassViewProps>
const GLASS: { GlassView: Glass; available: boolean } | null = (() => {
  try {
    /* `require` on purpose: a static `import` runs `requireNativeViewManager` when the module loads and cannot be wrapped in a try. */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('expo-glass-effect') as { GlassView: Glass; isLiquidGlassAvailable: () => boolean }
    return { GlassView: m.GlassView, available: m.isLiquidGlassAvailable() }
  } catch {
    return null
  }
})()

/* What crosses to JS, with its stamp for the meter (a no-op if it is not
   measuring). Declared before the worklets that call them (trap 14). */
const tickJS = () => {
  markJS('tick-js')
  void tick()
}
const onCompleteJS = () => {
  markJS('commit-js')
  void onComplete()
}
const playSoundJS = () => {
  markJS('sound-js')
  playSound()
}

/* The shape of the label's first darkening, measured frame by frame
   (HOLD.inkFrom..inkTo): half the way in 5 of 18 frames → quadratic
   ease-out over the progress. */
const easeOutQuad = (t: number) => {
  'worklet'
  const u = Math.min(1, Math.max(0, t))
  return 1 - (1 - u) * (1 - u)
}
const easeInOutQuad = (t: number) => {
  'worklet'
  const u = Math.min(1, Math.max(0, t))
  return u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)
}
/* The reset's clock: a 1 ms timing at the end of the `withDelay`. */
const ONE_FRAME = timing(1, Easing.linear)

export type ColorScheme = 'light' | 'dark'

type Props = {
  /** The pill's width, in pt. The screen works it out: 440 − 2×29. */
  width: number
  /** Light or dark: the screen decides it (the Opal backgrounds are always dark). */
  scheme?: ColorScheme
  /** Which curves and timings: the clip's or the skill's tables (`recipe.ts`). */
  recipe: Recipe
  /** The light that escapes under the pill, measured on the Opal screen.
      The screen decides whether it goes: only with the `opal` background. */
  spill?: boolean
  /** What the pill is made of: the measured opaque capsule, or Liquid Glass (`material.ts`). */
  material?: Material
  /** Development probe: `park=0.5` leaves the button parked halfway
      through the hold; `park=commit`, finished; `park=auto`, presses on
      its own; `park=crossfade=120`, the press at 120 ms;
      `park=crossfade-commit=300`, 300 ms after the burst;
      `park=crossfade-release=150`, 150 ms after releasing;
      `park=checkmark=0.5`, "✓ Order Placed" halfway through its
      presence. They reproduce the curves of the `clip` recipe. */
  probe?: string
}

export function HoldToCommit({ width, recipe, probe, spill = false, material = 'opaque', scheme = 'dark' }: Props) {
  const reduced = useReducedMotion()
  /* The resting label is white over the opaque pill (RUNTIME, mode 255)
     in any mode: the pill is always dark. Over glass it follows the color
     scheme: in light mode the glass is light and the label starts black. */
  const light = scheme === 'light'
  const isGlass = material !== 'opaque'
  const restInk = isGlass && light ? COLOR.blackInk : COLOR.text
  /* What is painted on the pill's background (resting sheen, veiled tip)
     belongs to Opal's opaque pill, dark on dark; in light mode it does not
     go. */
  const withSheen = material === 'opaque' && !light
  /* The press scale belongs to the opaque pill: interactive glass brings
     its own answer to the finger, and with reduce motion there is no
     scale. */
  const ownScale = !reduced && !isGlass
  const R = KINEMATICS[recipe]

  const stage = useSharedValue<number>(STAGE.rest)
  const progress = useSharedValue(0)   // 0..1, the fill's geometric front
  const blob = useSharedValue(0)       // the fill's opacity (born dark)
  const scale = useSharedValue(1)
  const white = useSharedValue(0)      // the commit's white veil
  const pHold = useSharedValue(1)      // each label's presence (see label.tsx)
  const pKeep = useSharedValue(0)
  const pPlaced = useSharedValue(0)
  const burst = useSharedValue(0)      // the burst, 0→1
  const wait = useSharedValue(0)       // the reset's clock, on UI

  /* The label's color comes out of the PROGRESS and not out of an event:
     that way releasing halfway through the darkening reverses it along
     the same curve, with no states. It is a PARTITION among the three
     inks (adding up to 1), which the label uses as the opacity of each
     set: the color is opacity too. */
  const ink = useDerivedValue<Ink>(() => {
    const p = progress.get()
    const t1 = easeOutQuad((p - HOLD.inkFrom) / (HOLD.inkTo - HOLD.inkFrom))
    const t2 = Math.min(1, Math.max(0, (p - HOLD.blackAt) / 0.012))
    return { white: 1 - t1, dark: t1 * (1 - t2), black: t2 }
  })

  /* The commit's sound is preheated on mount, so it comes out on the frame. */
  useEffect(prepareSound, [])

  /* Crossfades the label towards `target`: its presence rises to 1 and
     the others' fall to 0, each from wherever it is and with a duration
     proportional to how far it has left. An interrupted crossfade
     (releasing while "Keep Holding..." is still appearing) carries on
     without jumps. A text has no finger: always by time. */
  const crossfade = (target: number, t: Timings) => {
    'worklet'
    const all = [pHold, pKeep, pPlaced]
    for (let k = 0; k < all.length; k++) {
      const q = all[k]!
      cancelAnimation(q)
      const v = q.get()
      if (k === target) {
        if (v < 1) q.set(withDelay(t.enterDelay, move(1, timing(t.enter * (1 - v), t.linearEnter ? Easing.linear : R.easeOut)), ReduceMotion.Never))
      } else if (v > 0) {
        q.set(withDelay(t.exitDelay, move(0, timing(t.exit * v, R.easeOut)), ReduceMotion.Never))
      }
    }
  }

  /* `reset` goes BEFORE `complete`, which calls it from its movement's
     callback: a worklet captures its closure when it is created, and a
     `const` further down does not exist yet at that moment (trap 25).

     THE RESET IS A FADE, NOT A SWEEP (Vito, 2026-09-04: "make the
     transition back to the initial state clean, today it is terrible").
     Only the opacity changes, in two phases: (1) the white veil and the
     fill go out and "✓ Order Placed" leaves with its checkmark; (2) with
     the fill already invisible, the geometry snaps back to rest (nobody
     sees it) and "Hold to Buy" comes in white, because the label's color
     comes from the progress and the progress is already at 0. The stage
     goes back to rest only in phase 2: a touch during the fade does
     nothing. */
  const reset = () => {
    'worklet'
    markUI('reset-ui')
    stage.set(STAGE.reset)
    cancelAnimation(progress)
    cancelAnimation(blob)
    cancelAnimation(white)
    cancelAnimation(pPlaced)
    /* And the 5 s clock, which is normally the one calling in here: if the
       reset fires earlier (the `demo` probe pulls it forward for the
       video), without this the `withDelay` that `complete` left behind
       calls `reset` again on a button that is already at rest. */
    cancelAnimation(wait)
    scale.set(1)
    burst.set(0)
    pPlaced.set(move(0, timing(R.crossfade.reset.exit, R.easeOut)))
    white.set(move(0, R.reset))
    blob.set(
      move(0, R.reset, (finished) => {
        'worklet'
        if (!finished) return
        progress.set(0)
        stage.set(STAGE.rest)
        crossfade(L_HOLD, R.crossfade.reset)
      }),
    )
  }
  const press = () => {
    'worklet'
    if (stage.get() >= STAGE.commit) return
    stage.set(STAGE.hold)
    cancelAnimation(progress)
    cancelAnimation(blob)
    cancelAnimation(scale)
    /* From wherever it is: if you press again during the retreat, the fill
       carries on from there and reaches 1 exactly when the LongPress
       fulfills its `minDuration`, one single clock for both things. */
    markUI('press-ui')
    progress.set(move(1, timing(HOLD.duration, Easing.linear)))
    blob.set(move(1, R.turnOn))
    /* With reduce motion the pill does not shrink: the scale is movement. */
    if (ownScale) scale.set(move(R.press.scale, R.press.enter))
    crossfade(L_KEEP, R.crossfade.press)
  }

  const release = () => {
    'worklet'
    if (stage.get() >= STAGE.commit) return
    stage.set(STAGE.rest)
    cancelAnimation(progress)
    cancelAnimation(blob)
    cancelAnimation(scale)
    progress.set(move(0, R.retreat.progress))
    blob.set(move(0, R.retreat.fade))
    if (ownScale) scale.set(move(1, R.press.exit))
    /* The label comes back AFTER the light has started retreating: the
       delays are measured (release at f13, outgoing from f17–18, incoming
       from f22). */
    crossfade(L_HOLD, R.crossfade.release)
  }

  const complete = () => {
    'worklet'
    if (stage.get() >= STAGE.commit) return
    stage.set(STAGE.commit)
    cancelAnimation(progress)
    cancelAnimation(scale)
    progress.set(1)
    blob.set(1)
    if (!reduced) {
      /* The front finishes its trip to the right tip while it whitens
         (COMMIT.slide): the progress goes past 1 and `frontAt` takes it to
         101 %. */
      progress.set(withDelay(R.slide.delay, move(1 + COMMIT.slide, R.slide.motion), ReduceMotion.Never))
      /* A jump (`commitJump`) in one frame and the rest with the curve. */
      if (ownScale)
        scale.set(
          R.press.commitJump > 0
            ? withSequence(
                ReduceMotion.Never,
                move(R.press.scale + (1 - R.press.scale) * R.press.commitJump, timing(16, Easing.linear)),
                move(1, R.press.commit),
              )
            : move(1, R.press.commit),
        )
      burst.set(0)
      burst.set(move(1, timing(PARTICLES.lifetime, Easing.linear)))
    }
    white.set(move(COMMIT.whiteVeil, R.whitening))
    crossfade(L_PLACED, R.crossfade.commit)
    markUI('commit-ui')
    scheduleOnRN(onCompleteJS)
    /* THE RESET BELONGS TO THE WORKSHOP, not to the reference: the clip
       ends at "✓ Committed" and does not show what happens next. Here, 5 s
       after completing, the button goes back to rest with the same
       crossfade, so you can try it over and over without leaving the piece
       and coming back. The clock runs on UI: a `withDelay` over `wait`. It
       used to be a `setTimeout` in JS ("5 s do not ask for frame
       precision"), and they do not, but a JS timer waits for JS to be
       free: with the thread busy (load.tsx) the reset arrived late. Here it
       arrives at 5000 ms with JS doing whatever it likes. */
    wait.set(0)
    wait.set(
      withDelay(
        RESET.wait,
        move(1, ONE_FRAME, (finished) => {
          'worklet'
          if (finished) reset()
        }),
        ReduceMotion.Never,
      ),
    )
  }

  /* The haptic detents: the comparison runs on UI every frame and the call
     to JS happens twelve times per hold, only when the progress RISES and
     crosses a threshold. Releasing does not tick. */
  useAnimatedReaction(
    () => progress.get(),
    (p, previous) => {
      if (previous === null || p <= previous) return
      for (let i = 0; i < DETENTS.length; i++) {
        const d = DETENTS[i]!
        if (previous < d && p >= d) {
          markUI('tick-ui')
          scheduleOnRN(tickJS)
        }
      }
      /* The sound, LEAD_MS before the end: it comes off the same clock as
         the fill, once per hold (the stage moves to `sounding`). */
      if (stage.get() === STAGE.hold && p >= 1 - LEAD_MS / HOLD.duration) {
        stage.set(STAGE.sounding)
        markUI('sound-ui')
        scheduleOnRN(playSoundJS)
      }
    },
  )

  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(HOLD.duration)
        .maxDistance(HOLD.maxDistance)
        .onBegin(press)
        .onStart(complete)
        .onFinalize((_e, success) => {
          if (!success) release()
        }),
    /* The three worklets are recreated on every render (they are closures
       of the component), so the gesture gets rebuilt with them. There is
       one render per chosen recipe. */
    [press, complete, release],
  )

  /* The probe: one fixed state per reload, deterministic. It reproduces
     the curves of the `clip` recipe (the constants in measurements.ts). */
  useEffect(() => {
    const park = (hold: number, keep: number, placed: number) => {
      'worklet'
      pHold.set(hold)
      pKeep.set(keep)
      pPlaced.set(placed)
    }
    if (!probe) {
      /* With no probe, rest: that way `probe.ts` set back to `undefined` at
         the end of a run of captures leaves the piece clean without
         relaunching (trap 20). */
      scheduleOnUI(() => {
        'worklet'
        const all = [progress, blob, scale, white, burst, pHold, pKeep, pPlaced, wait]
        for (let k = 0; k < all.length; k++) cancelAnimation(all[k]!)
        stage.set(STAGE.rest)
        progress.set(0)
        blob.set(0)
        scale.set(1)
        white.set(0)
        burst.set(0)
        park(1, 0, 0)
      })
      return
    }
    if (probe === 'commit' || probe.startsWith('burst')) {
      /* `burst=0.12` holds the burst still at that fraction of its life. */
      const t = probe === 'commit' ? 1 : Number(probe.split('=')[1] ?? 0.1)
      scheduleOnUI(() => {
        'worklet'
        stage.set(STAGE.commit)
        progress.set(probe === 'commit' ? 1 + COMMIT.slide : 1)
        blob.set(1)
        scale.set(1)
        park(0, probe === 'commit' ? 0 : 1, probe === 'commit' ? 1 : 0)
        white.set(probe === 'commit' ? COMMIT.whiteVeil : COMMIT.whiteVeil * t * 3)
        burst.set(t)
      })
      return
    }
    if (probe.startsWith('crossfade')) {
      /* `crossfade=120`: the press, 120 ms after the touch, every value
         where the real animation would have it (same curves and delays as
         `press`); `crossfade-commit=300`: 300 ms after the burst, with the
         label, the whitening and the particles where they belong. It is
         for comparing against the clip frame from the same instant. */
      const ms = Number(probe.split('=')[1] ?? 0)
      const atCommit = probe.startsWith('crossfade-commit')
      const atRelease = probe.startsWith('crossfade-release')
      const segment = (t: number, delay: number, duration: number, linear?: boolean) => {
        'worklet'
        const u = Math.min(1, Math.max(0, (t - delay) / duration))
        return linear ? u : easeOutQuad(u)
      }
      scheduleOnUI(() => {
        'worklet'
        stage.set(atCommit ? STAGE.commit : STAGE.hold)
        if (atCommit) {
          const c = CROSSFADE.commit
          progress.set(1 + COMMIT.slide * segment(ms, COMMIT.slideDelay, COMMIT.slideDuration))
          blob.set(1)
          scale.set(PRESS.scale + (1 - PRESS.scale) * (ms < 16 ? 0 : PRESS.commitJump + (1 - PRESS.commitJump) * segment(ms, 16, PRESS.commitDuration)))
          white.set(COMMIT.whiteVeil * segment(ms, 0, COMMIT.whitening))
          burst.set(Math.min(0.999, ms / PARTICLES.lifetime))
          park(0, 1 - segment(ms, c.exitDelay, c.exit), segment(ms, c.enterDelay, c.enter, c.linearEnter))
        } else if (atRelease) {
          /* `crossfade-release=150`: 150 ms after releasing with the front
             at 10 % (where the clip releases it: in f13 the front's 50 %
             point is at 13.5 %), with the same curves as `release`. */
          const c = CROSSFADE.release
          const from = 0.1
          /* the clip releases with the turn-on halfway there: the peak in
             f13 is 172, which is 65 % of the fill lit up */
          const blobAtRelease = 0.68
          progress.set(from * (1 - segment(ms, 0, HOLD.retreat)))
          blob.set(blobAtRelease * Math.pow(2, (-10 * Math.min(1, ms / HOLD.retreatFade))))
          scale.set(PRESS.scale + (1 - PRESS.scale) * segment(ms, 0, PRESS.duration))
          white.set(0)
          burst.set(0)
          park(segment(ms, c.enterDelay, c.enter, c.linearEnter), 1 - segment(ms, c.exitDelay, c.exit), 0)
        } else {
          const c = CROSSFADE.press
          progress.set(ms / HOLD.duration)
          blob.set(easeInOutQuad(ms / HOLD.turnOn))
          scale.set(1 - (1 - PRESS.scale) * segment(ms, 0, PRESS.duration))
          white.set(0)
          burst.set(0)
          park(1 - segment(ms, c.exitDelay, c.exit), segment(ms, c.enterDelay, c.enter), 0)
        }
      })
      return
    }
    if (probe.startsWith('checkmark')) {
      /* `checkmark=0.5`: the commit already settled with "✓ Order Placed"
         at that fraction of its presence: the text on its staircase and
         the contextual checkmark with its opacity, scale and blur halfway,
         together. */
      const q = Number(probe.split('=')[1] ?? 0.5)
      scheduleOnUI(() => {
        'worklet'
        stage.set(STAGE.commit)
        progress.set(1 + COMMIT.slide)
        blob.set(1)
        scale.set(1)
        white.set(COMMIT.whiteVeil)
        burst.set(0)
        park(0, 0, q)
      })
      return
    }
    if (probe === 'auto' || probe === 'auto-release') {
      const t1 = setTimeout(() => scheduleOnUI(press), 700)
      const t2 = setTimeout(
        () => scheduleOnUI(probe === 'auto' ? complete : release),
        700 + (probe === 'auto' ? HOLD.duration : 400),
      )
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
    if (probe === 'demo') {
      /* THE RECORDING CHOREOGRAPHY. There is no way to send a finger to
         the simulator, so the take is driven from inside by calling the
         SAME worklets the gesture calls (`press`, `release`, `complete`):
         the curves, the timings, the haptics and the sound are the ones on
         the real path, not an imitation.

         ONE SINGLE GESTURE, END TO END. The first version opened with an
         abandoned hold: press, release at 700 ms, show the retreat, and
         only then the one that completes. Vito, 2026-09-08: "make the
         recording run it all in one go, drop that bit at the start where
         the button gets pressed and cut off halfway". The retreat still
         exists in the piece and it is described in the notes; in the
         video, cutting off halfway before ever having shown what happens
         at the end reads as an error, not as an option.

             3000   press            a long rest before the gesture, to cut
                                     1.2 s before it (the workshop's
                                     AGENTS) with room to spare: the app's
                                     startup takes a different amount of
                                     time each run, and in the light take
                                     the 1800 ms of the first version left
                                     the cut 0.2 s BEFORE the piece had
                                     finished mounting
             4000   (on its own)     the LongPress fulfils: burst, "✓ Order
                                     Placed", success haptic and sound
             6000   reset            the fade back to rest

         THE RESET ARRIVES AT 2 s AND NOT AT 5. The 5 s belong to the
         workshop, so you can try the button over and over without leaving
         the piece, and in a video they are three seconds of nothing. The
         fade you see is the same code and the same curve; only the trigger
         is pulled forward. `reset` cancels `wait`, so the 5 s clock
         `complete` left behind does not fire again over the rest. */
      const at = (ms: number, w: () => void) => setTimeout(() => scheduleOnUI(w), ms)
      const t = [
        at(3000, press),
        at(3000 + HOLD.duration, complete),
        at(3000 + HOLD.duration + 2000, reset),
      ]
      return () => t.forEach(clearTimeout)
    }
    const p = Number(probe)
    if (Number.isFinite(p)) {
      scheduleOnUI(() => {
        'worklet'
        stage.set(p > 0 ? STAGE.hold : STAGE.rest)
        white.set(0)
        burst.set(0)
        progress.set(p)
        blob.set(p > 0 ? 1 : 0)
        scale.set(p > 0 ? PRESS.scale : 1)
        park(p > 0 ? 0 : 1, p > 0 ? 1 : 0, 0)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probe])

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: ownScale ? scale.get() : 1 }] }))
  /* The fill's container carries the geometric edge to `frontAt(p)`: its
     edge is `width` pt inside the container (body + 83 of the front), so
     translateX = frontAt(p) − width.

     WITH REDUCE MOTION THERE IS NO SWEEP: the fill stays whole (the
     geometric edge where it ends on completion, 101 %) and its OPACITY is
     the progress. The same clock, counted with light instead of with
     position. */
  const fillStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return reduced
      ? { opacity: blob.get() * Math.min(1, p), transform: [{ translateX: frontAt(1 + COMMIT.slide, width) - width }] }
      : { opacity: blob.get(), transform: [{ translateX: frontAt(p, width) - width }] }
  })
  /* The front widens with the progress: a scale in x around the geometric
     edge (at FRONT.before from its left edge). RN scales around the
     center of the view, so the pivot is moved with a previous translate of
     (pivot − center)·(1 − s). */
  const frontStyle = useAnimatedStyle(() => {
    const p = reduced ? 1 : progress.get()
    const s = FRONT.scale.from + (FRONT.scale.to - FRONT.scale.from) * p
    return { transform: [{ translateX: (FRONT.before - FRONT_WIDTH / 2) * (1 - s) }, { scaleX: s }] }
  })
  /* And the body moves to stay glued to the scaled front: its right edge
     has to end up where the front starts (at 83·s from the edge). */
  const bodyStyle = useAnimatedStyle(() => {
    const p = reduced ? 1 : progress.get()
    const s = FRONT.scale.from + (FRONT.scale.to - FRONT.scale.from) * p
    return { transform: [{ translateX: FRONT.before * (1 - s) }] }
  })
  /* The tip's veil widens from the pill's tip (pivot at its left edge) and
     turns on with the blob (with reduce motion, with the whole fill: the
     same opacity as it). */
  const veilStyle = useAnimatedStyle(() => {
    const p = reduced ? 1 : progress.get()
    const s = VEIL.scale.from + (VEIL.scale.to - VEIL.scale.from) * p
    const opacity = reduced ? blob.get() * Math.min(1, progress.get()) : blob.get()
    return { opacity, transform: [{ translateX: -(VEIL_WIDTH / 2) * (1 - s) }, { scaleX: s }] }
  })
  const whiteStyle = useAnimatedStyle(() => ({ opacity: white.get() }))

  return (
    <View style={{ width, height: PILL.height }}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={LABEL.rest}
          accessibilityHint={`Hold for ${HOLD.duration === 1000 ? 'one second' : `${HOLD.duration / 1000} seconds`} to place the order`}
          /* The shadow goes HERE, on the outer view: the capsule clips with
             `overflow: hidden` and a shadow drawn inside would not come
             out. */
          style={[css.pill, css.shadow, scaleStyle]}
        >
          {/* The spill: the light that escapes UNDER the pill on the Opal
              screen, a strip that peeks out 18 pt with its shadow (receipt
              in SPILL). Over a neutral background it reads as a box behind
              the button, so it only goes with the `opal` background (Vito,
              2026-09-04, looking at it on the phone: "there is something
              behind the button, take it out"). */}
          {spill && <View style={css.spill} />}
          <Capsule material={material}>
            {withSheen && <Image source={TEXTURE.sheen} resizeMode="stretch" style={css.full} />}
            {/* `needsOffscreenAlphaCompositing`: Android composes the
                children of a view with opacity ONE BY ONE, so during the
                reset's fade the overlap point between body and front showed
                up as a lighter line (RUNTIME, emulator,
                `cmp/android-prod-tira.png`); with the flag, the group is
                drawn apart and fades as a whole. iOS already does it on its
                own (`allowsGroupOpacity`). It only costs while there is
                opacity. */}
            <Animated.View needsOffscreenAlphaCompositing style={[css.fill, { width: width + FRONT.after }, fillStyle]}>
              <Animated.Image source={TEXTURE.body} resizeMode="stretch" style={[{ width: width - FRONT.before + 1, height: PILL.height }, bodyStyle]} />
              {/* One point of overlap: two images butted edge to edge leave
                  a 1 px seam when the translate falls between pixels (it
                  showed up in the magnification). The front starts out
                  opaque, so the overlap is invisible. */}
              <Animated.Image source={TEXTURE.front} style={[{ width: FRONT_WIDTH, height: PILL.height, marginLeft: -1 }, frontStyle]} />
            </Animated.View>
            {withSheen && <Animated.Image source={TEXTURE.veil} style={[css.veil, veilStyle]} />}
            {/* The sparks go over the fill and under the white veil: on
                completion, the white covers them. */}
            {!reduced && <Sparks width={width} progress={progress} blob={blob} />}
            <Animated.View style={[css.full, css.white, whiteStyle]} />
          </Capsule>
          <Label
            ink={ink}
            restColor={restInk}
            presence={[pHold, pKeep, pPlaced]}
            noBlur={reduced}
            enterScale={R.enterScale}
            contextualCheckmark={R.checkmark === 'contextual'}
          />
        </Animated.View>
      </GestureDetector>
      {!reduced && <Particles width={width} burst={burst} color={light ? LIGHT.particle : undefined} />}
    </View>
  )
}

/* The capsule: opaque, it is the view that clips the textures, with the
   measured pill color. In glass, it is the `GlassView` (free, interactive,
   with its circular radius) and INSIDE it the view that clips,
   transparent. */
function Capsule({ material, children }: { material: Material; children: ReactNode }) {
  if (material === 'opaque') return <View style={css.clip}>{children}</View>
  const clip = <View style={[css.clip, css.clipGlass]}>{children}</View>
  if (GLASS && GLASS.available) {
    return (
      <GLASS.GlassView glassEffectStyle="regular" isInteractive style={css.glass}>
        {clip}
      </GLASS.GlassView>
    )
  }
  return <View style={[css.glass, css.glassFallback]}>{clip}</View>
}

const css = StyleSheet.create({
  pill: { width: '100%', height: PILL.height },
  clip: {
    ...StyleSheet.absoluteFill,
    borderRadius: PILL.height / 2,
    backgroundColor: COLOR.pill,
    overflow: 'hidden',
  },
  clipGlass: { backgroundColor: 'transparent' },
  /* The glass capsule: the same circular radius as the measured pill (not
     `continuous`: the clip's capsule is circular), with no `overflow`. */
  glass: { ...StyleSheet.absoluteFill, borderRadius: PILL.height / 2 },
  /* ASSUMED · the fallback with no Liquid Glass: a flat translucent capsule. */
  glassFallback: { backgroundColor: 'rgba(128,128,128,0.25)' },
  full: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  fill: { position: 'absolute', top: 0, left: 0, height: PILL.height, flexDirection: 'row' },
  veil: { position: 'absolute', top: 0, left: 0, width: VEIL_WIDTH, height: PILL.height },
  white: { backgroundColor: COLOR.committed },
  /* ASSUMED · it is not measured in any reference: it is better-ui's
     recipe ("layered transparent box-shadow values"), two layers, one of
     contact and one of ambience. Over the black background of dark mode it
     is invisible, and that is fine: there is no depth to communicate
     there.

     THE RADIUS IS NOT DECORATION HERE. `boxShadow` follows the shape of
     the view, and this view is a rectangle: without the radius, the shadow
     drew a BOX with sharp corners around the capsule (Vito, 2026-09-08:
     "you can see the whole box of the component, really ugly"). With the
     capsule's radius, the shadow traces it. */
  shadow: {
    borderRadius: PILL.height / 2,
    boxShadow: '0 1px 2px rgba(0,0,0,0.14), 0 6px 16px rgba(0,0,0,0.18)',
  },
  spill: {
    position: 'absolute',
    left: '50%',
    marginLeft: -SPILL.width / 2,
    width: SPILL.width,
    top: PILL.height - 8,
    height: 8 + SPILL.peek,
    borderRadius: 12,
    backgroundColor: SPILL.color,
    boxShadow: SPILL.shadow,
  },
})
