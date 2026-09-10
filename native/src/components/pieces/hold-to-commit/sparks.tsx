import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

import { FRONT, frontAt, HOLD, SPARKS } from './measurements'

/* ═══════════════════════════════════════════════════════════════
   THE SPARKS: the dots of light that travel INSIDE the pill during the
   hold, ahead of the fill's front (magnifications in
   `.context/hold-to-commit/dentro`, tracks in `chispas2.py`).

   THEY ARE A FUNCTION OF THE PROGRESS, not of a clock: each spark has a
   birth progress p₀ and lives `length` ms of progress; its position is
   where the front was when it was born, plus how far ahead it started,
   plus how far it has traveled since, at a fraction of the front's
   speed. That way, with the button parked at a progress (probe) the
   sparks are where they should be, and on release they leave with the
   fill (`blob`) instead of floating over a dark pill.

   FEW VIEWS, SEVERAL LIVES: 12 images, each with 3 lives spread out over
   time (never overlapping), are 36 sparks per hold with 12 animated
   styles per frame. The texture is a white gaussian
   (`media/spark@3x.png`); each life scales it and dims it to its own
   values. They live below the commit's white veil and below the label:
   on completion, the veil covers them; over an already white fill, white
   at 30 % is invisible, the same absorption as in the clip.

   The whole receipt is in `SPARKS`.
   ═══════════════════════════════════════════════════════════════ */

type Life = {
  p0: number       // birth progress
  ahead: number    // pt ahead of the front at birth
  y: number        // pt from the top of the pill
  speed: number    // fraction of the front's speed
  length: number   // ms of life
  drift: number    // pt/s in y (negative = upwards)
  scale: number    // of the texture's box
  alpha: number
}

const random = (() => {
  let s = 20260903
  return () => {
    s = (s * 48271) % 2147483647
    return (s - 1) / 2147483646
  }
})()
const between = (min: number, max: number) => min + (max - min) * random()

const TOTAL = SPARKS.views * SPARKS.livesPerView
const LIVES: Life[] = Array.from({ length: TOTAL }, (_, i) => ({
  p0: SPARKS.from + (SPARKS.to - SPARKS.from) * ((i + 0.5) / TOTAL) + between(-0.008, 0.008),
  ahead: SPARKS.ahead.min + (SPARKS.ahead.max - SPARKS.ahead.min) * Math.pow(random(), SPARKS.ahead.bias),
  y: between(SPARKS.y.min, SPARKS.y.max),
  speed: between(SPARKS.speed.min, SPARKS.speed.max),
  length: between(SPARKS.life.min, SPARKS.life.max),
  drift: between(SPARKS.driftY.min, SPARKS.driftY.max),
  scale: between(SPARKS.scale.min, SPARKS.scale.max),
  alpha: between(SPARKS.alpha.min, SPARKS.alpha.max),
}))
/* View j takes lives j, j + views, j + 2·views: (to − from) / livesPerView
   ≈ 0.31 of progress apart = 620 ms. */
const PER_VIEW: Life[][] = Array.from({ length: SPARKS.views }, (_, j) =>
  LIVES.filter((_, i) => i % SPARKS.views === j),
)

const TEXTURE = require('./media/spark.png')

const smoothstep = (v: number, a: number, b: number) => {
  'worklet'
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

type Props = { width: number; progress: SharedValue<number>; blob: SharedValue<number> }

function Spark({ lives, width, progress, blob }: { lives: Life[] } & Props) {
  const style = useAnimatedStyle(() => {
    const p = progress.get()
    let opacity = 0, tx = 0, ty = 0, sc = 1
    for (let i = 0; i < lives.length; i++) {
      const v = lives[i]!
      const dt = (p - v.p0) * HOLD.duration // ms of life
      if (dt < 0 || dt > v.length) continue
      const f = dt / v.length
      const envelope = smoothstep(f, 0, SPARKS.fadeIn) * (1 - smoothstep(f, 1 - SPARKS.fadeOut, 1))
      opacity = v.alpha * envelope * blob.get()
      /* it is born ahead of the geometric edge it was born at, and moves
         at a fraction of the front's speed (travel·width in HOLD.duration) */
      tx = frontAt(v.p0, width) + v.ahead + v.speed * (dt / HOLD.duration) * FRONT.travel * width
      ty = v.y + (v.drift * dt) / 1000
      sc = v.scale
      break
    }
    return { opacity, transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }] }
  })
  return <Animated.Image source={TEXTURE} style={[css.spark, style]} />
}

export const Sparks = memo(function Sparks({ width, progress, blob }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PER_VIEW.map((lives, j) => (
        <Spark key={j} lives={lives} width={width} progress={progress} blob={blob} />
      ))}
    </View>
  )
})

const css = StyleSheet.create({
  /* The box centered on the origin: the translate puts the center where it goes. */
  spark: {
    position: 'absolute',
    left: -SPARKS.box / 2,
    top: -SPARKS.box / 2,
    width: SPARKS.box,
    height: SPARKS.box,
    opacity: 0,
  },
})
