import { Easing, type EasingFunction, type EasingFunctionFactory, ReduceMotion, withSpring, withTiming } from 'react-native-reanimated'

import { COMMIT, CROSSFADE, HOLD, PRESS, RESET } from './measurements'

/* THE RECIPE: the button's curves and timings, in two versions.
 *
 * Vito asked (2026-09-04) to try the button following the tables in the
 * `animate-expo` skill WITHOUT losing what was measured. So, like the
 * background, the kinematics is a VARIANT: with `'choose'` the piece
 * shows a selector to go from one to the other live, in the simulator
 * and on the phone.
 *
 *   'clip'   what was measured frame by frame in the Opal clip; every
 *            value with its receipt in `measurements.ts`. It is the
 *            faithful version. All by time and curve: Opal does not
 *            bounce.
 *   'skill'  the animate-expo tables to the letter, and since 2026-09-07
 *            SPRINGS where there was a finger (§ 5: "If a finger was
 *            involved, use a spring"), with APPLE'S TWO PARAMETERS,
 *            perceptual duration and bounce, which are the ones in
 *            SwiftUI's `Spring(duration:bounce:)` (WWDC23 "Animate with
 *            springs") and the ones Reanimated takes as `duration` +
 *            `dampingRatio` (dampingRatio = 1 − bounce). Bounce 0 in all
 *            of them: it is Apple's `.smooth`, and the skill says the
 *            same, "bounce only when the gesture carried momentum"; a
 *            hold has none. What has no finger (a label crossing, the
 *            veil whitening, the reset's fade) still runs by time with
 *            the beziers from the table. And the checkmark in "Order
 *            Placed" comes in with its own layers, with better-ui's
 *            contextual icon technique, over the same clock and the same
 *            opacity staircase as the text: they move together in every
 *            frame.
 *
 * What does NOT change between recipes: the linear fill (it is the
 * gesture, not an animation: "constant motion → linear" in both), the
 * label color by progress, the geometry of the front, the haptics, and
 * the sparks and the burst (they are the skill's delight budget and they
 * are measured from the clip).
 *
 * The fixed-state probes (`probe.ts`) reproduce the 'clip' curves;
 * `auto` works with either.
 *
 * `RECIPE` went back to 'clip' on 2026-09-07, the same day it switched
 * to 'skill' ("do everything that is in yellow"): with the springs on,
 * Vito saw it as different "especially the ending" (the pill comes back
 * with a 400 ms spring instead of the measured jump, and the checkmark
 * comes in on its own) and asked to leave it the way it was. RUNTIME:
 * with 'clip' active, the four state probes (rest, 0.5, commit,
 * crossfade-commit=150) give infinite PSNR against that morning's
 * captures, taken before the rewrite: pixel for pixel the same. The
 * 'skill' one is still there in full, one `?recipe=skill` away; the
 * selector has been off since 2026-09-04.
 */
export type Curve = EasingFunction | EasingFunctionFactory

/* A MOVEMENT is either by time with a curve, or a spring with a duration and a bounce. */
export type Movement =
  | { kind: 'timing'; duration: number; curve: Curve }
  | { kind: 'spring'; duration: number; bounce: number; overshootClamping?: boolean }

/* Both constructors carry 'worklet': the button calls them from the UI
   thread (RUNTIME, 2026-09-07: "Tried to synchronously call a Remote
   Function. Called 'tiempo' on the UI Runtime" without the directive). */
export const timing = (duration: number, curve: Curve): Movement => {
  'worklet'
  return { kind: 'timing', duration, curve }
}
export const spring = (duration: number, bounce: number, overshootClamping = false): Movement => {
  'worklet'
  return { kind: 'spring', duration, bounce, overshootClamping }
}

type OnFinish = (finished?: boolean) => void

/* EVERY MOVEMENT OF THE BUTTON GOES THROUGH HERE, with
   `ReduceMotion.Never`: Reanimated 4.5 ships `reduceMotion: System` by
   default and with Reduce Motion on it jumps to the end on the first
   frame (trap 19 in the AGENTS); reduce motion is applied by hand in the
   button. */
export const move = (to: number, m: Movement, onFinish?: OnFinish) => {
  'worklet'
  if (m.kind === 'spring') {
    return withSpring(
      to,
      { duration: m.duration, dampingRatio: 1 - m.bounce, overshootClamping: m.overshootClamping, reduceMotion: ReduceMotion.Never },
      onFinish,
    )
  }
  return withTiming(to, { duration: m.duration, easing: m.curve, reduceMotion: ReduceMotion.Never }, onFinish)
}

export type Timings = {
  enter: number
  exit: number
  enterDelay: number
  exitDelay: number
  /** the incoming label's presence rises linearly (the blur staircase supplies the curve) */
  linearEnter?: boolean
}

export type Kinematics = {
  /** the curve of the label crossfades (always by time: there is no finger in a text) */
  easeOut: Curve
  press: {
    scale: number
    /** the pill shrinking under the finger */
    enter: Movement
    /** coming back on release */
    exit: Movement
    /** coming back on completion */
    commit: Movement
    /** how much of the return on completion happens in the first frame (read from the clip) */
    commitJump: number
  }
  /** the fill turning on when you press */
  turnOn: Movement
  /** on release: the front retreats (`progress`) and the fill goes out (`fade`) */
  retreat: { progress: Movement; fade: Movement }
  crossfade: { press: Timings; release: Timings; commit: Timings; reset: Timings }
  /** the front finishing its trip to the right tip after the burst */
  slide: { delay: number; motion: Movement }
  /** the commit's white veil */
  whitening: Movement
  /** the fade of the workshop's reset */
  reset: Movement
  /** what scale "✓ Order Placed" comes in from */
  enterScale: number
  /** the checkmark: 'measured' comes in glued to the text (blur-replace, like in the clip);
      'contextual' comes in with its own layers, opacity, scale and blur (better-ui),
      over the same presence and the same staircase as the text */
  checkmark: 'measured' | 'contextual'
}

export type Recipe = 'clip' | 'skill'
export const RECIPES: readonly Recipe[] = ['skill', 'clip']
export const RECIPE: Recipe | 'choose' = 'clip'

/* RUNTIME · THE SCALE CURVE IS A QUADRATIC EASE-OUT, not the skill's
   strong bezier (clip, left edge of the pill on press): 16 % at 1 frame,
   52 % at 4, 80 % at 8, 96 % at 13 out of 14. easeOutQuad over 250 ms
   gives 47 / 78 / 98 at those points. With bezier(.23,1,.32,1) the
   workshop recording closed 92 % in 100 ms, twice as fast. */
const OUT_QUAD = Easing.out(Easing.quad)
const CLIP: Kinematics = {
  easeOut: OUT_QUAD,
  press: {
    scale: PRESS.scale,
    enter: timing(PRESS.duration, OUT_QUAD),
    exit: timing(PRESS.duration, OUT_QUAD),
    commit: timing(PRESS.commitDuration, OUT_QUAD),
    commitJump: PRESS.commitJump,
  },
  /* RUNTIME · the turn-on starts slow (receipt in HOLD.turnOn). */
  turnOn: timing(HOLD.turnOn, Easing.inOut(Easing.quad)),
  /* RUNTIME · 1 − 2^(−10t): the exponential fade of the retreat, τ = duration/6.93 (receipt in HOLD). */
  retreat: { progress: timing(HOLD.retreat, OUT_QUAD), fade: timing(HOLD.retreatFade, Easing.out(Easing.exp)) },
  crossfade: CROSSFADE,
  slide: { delay: COMMIT.slideDelay, motion: timing(COMMIT.slideDuration, OUT_QUAD) },
  whitening: timing(COMMIT.whitening, OUT_QUAD),
  reset: timing(RESET.fade, OUT_QUAD),
  enterScale: COMMIT.enterScale,
  checkmark: 'measured',
}

/* THE TEXT AND ENDING TIMINGS ARE THE MEASURED ONES, not the table's.
   The first version of this recipe (2026-09-04) took § 5 to the letter:
   crossfades of 200/150 ms with no delays, whitening 250, slide 200,
   fade 200. With it set as the active recipe, Vito (2026-09-07): "the
   text changes very abruptly and the animation at the end is very fast".
   The reference is a floor: the label crossfades, the white veil, the
   front's slide and the reset's fade go back to the clip's values
   (`CROSSFADE`, `COMMIT`, `RESET`), which are the ones that had been
   approved. What this recipe adds is what he did ask for: springs where
   there is a finger, and the contextual checkmark. The § 5 ones stay
   here in case they get tried again:
   { enter: 200, exit: 150, enterDelay: 0, exitDelay: 0 }. */

/* SOURCE · § 5, spring table: "Default settle, no overshoot:
   { duration: 400, dampingRatio: 1 }"; "Press feedback: 100–150ms" (§ 5,
   durations) with "`scale: 0.97`" (§ 7). Bounce 0 = dampingRatio 1 =
   Apple's `.smooth`. `overshootClamping` where the value cannot go past
   a hard edge (§ 5: "Must not pass a hard edge → overshootClamping"):
   the fill's progress cannot go below 0. */
const SKILL: Kinematics = {
  /* the curve of the label crossfades: the measured one (with the
     skill's strong bezier the incoming label closed twice as fast) */
  easeOut: OUT_QUAD,
  press: {
    scale: 0.97,
    enter: spring(150, 0),
    exit: spring(400, 0),
    /* On completion it comes back the same way and with no jump: the
       25 % jump is a reading from the clip, it is not in any table. */
    commit: spring(400, 0),
    commitJump: 0,
  },
  /* The fill turning on is an opacity, not a finger: by time, with the
     measured turn-on (receipt in HOLD.turnOn). */
  turnOn: timing(HOLD.turnOn, Easing.inOut(Easing.quad)),
  /* On release, the front comes back with the "snap back" spring (§ 5),
     clamped at 0; the fill goes out by time with the measured exponential. */
  retreat: { progress: spring(400, 0, true), fade: timing(HOLD.retreatFade, Easing.out(Easing.exp)) },
  crossfade: CROSSFADE,
  slide: { delay: COMMIT.slideDelay, motion: timing(COMMIT.slideDuration, OUT_QUAD) },
  whitening: timing(COMMIT.whitening, OUT_QUAD),
  reset: timing(RESET.fade, OUT_QUAD),
  enterScale: COMMIT.enterScale,
  /* SOURCE · better-ui "Contextual icon animations": "scale 0.25 to 1,
     opacity 0 to 1, blur 4px to 0px". All three things in `label.tsx`,
     over the text's presence and its same opacity staircase, not over a
     300 ms spring of its own nor over a different ramp: the checkmark
     and "Order Placed" move together (Vito, 2026-09-07). */
  checkmark: 'contextual',
}

export const KINEMATICS: Record<Recipe, Kinematics> = { clip: CLIP, skill: SKILL }
