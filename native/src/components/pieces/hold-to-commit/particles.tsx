import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

import { PARTICLES, PILL } from './measurements'

/* ═══════════════════════════════════════════════════════════════
   THE BURST — 46 dots that come out of the pill's perimeter on
   completion.

   EVERY PARTICLE IS MOUNTED FROM THE START, invisible, and they all move
   off ONE shared value (`burst`, 0→1) that each of them reads in its
   `useAnimatedStyle`. That way the moment of the commit does no React
   render at all: the JS thread can be busy with the haptics and the
   burst still comes out on the exact frame. 46 animated styles per frame
   for 700 ms is UI thread work and Reanimated dispatches it in a single
   commit.

   THE CLOUD INFLATES FROM THE CENTER. Each dot is born on the capsule's
   normal (at the tips, radial to the arc) 2.2 pt from the edge and
   travels its `travel` along that normal; and on top of that it moves in
   x proportionally to its distance from the center of the pill
   (`expansion`), which is what was measured in the clip's tracks: the
   burst OPENS, it does not shake. Both components share the same
   ease-out.

   THE TABLE IS DETERMINISTIC: a congruential generator with a fixed
   seed, so that two recordings of the piece have the same burst and can
   be compared frame by frame — the same reason the labels do not scale
   with Dynamic Type.

   The values (count, travel, sizes, colors, timings) are measured frame
   by frame off the clip; the receipt is in `PARTICLES`.
   ═══════════════════════════════════════════════════════════════ */

type Particle = {
  u: number             // position along the pill, 0..1
  side: -1 | 1          // above (-1) or below (+1)
  travel: number        // pt, along the normal
  travelFraction: number // the part of the life the travel lasts
  diameter: number      // pt
  noise: number         // pt of lateral noise at the end of the travel
  color: string
  brightness: number    // 0.6..1, each dot's own
}

/* Park–Miller: plenty for 46 numbers that only have to look unordered
   and be the same every time. */
const random = (() => {
  let s = 20260902
  return () => {
    s = (s * 48271) % 2147483647
    return (s - 1) / 2147483646
  }
})()

const between = (min: number, max: number) => min + (max - min) * random()
const PER_SIDE = PARTICLES.count / 2

const TABLE: Particle[] = Array.from({ length: PARTICLES.count }, (_, i) => ({
  u: PARTICLES.from + (PARTICLES.to - PARTICLES.from) * (((i % PER_SIDE) + 0.5) / PER_SIDE) + between(-0.018, 0.018),
  side: i < PER_SIDE ? -1 : 1,
  travel: PARTICLES.travel.min + (PARTICLES.travel.max - PARTICLES.travel.min) * Math.pow(random(), PARTICLES.travel.bias),
  travelFraction: between(PARTICLES.travelDuration.min, PARTICLES.travelDuration.max) / PARTICLES.lifetime,
  diameter: PARTICLES.diameter.min + (PARTICLES.diameter.max - PARTICLES.diameter.min) * Math.pow(random(), PARTICLES.diameter.bias),
  noise: between(-PARTICLES.lateralNoise, PARTICLES.lateralNoise),
  color: PARTICLES.colors[Math.floor(random() * PARTICLES.colors.length)]!,
  brightness: between(PARTICLES.brightness.min, PARTICLES.brightness.max),
}))

/* The point on the capsule's edge for a given x, and its outward normal
   (unscaled). On the straight stretch the normal is vertical; on the arcs
   at the tips, radial to the center of the arc. */
const R = PILL.height / 2
function edge(x: number, width: number, side: -1 | 1) {
  const cx = x < R ? R : x > width - R ? width - R : x
  const dx = x - cx
  const dy = side * Math.sqrt(Math.max(0, R * R - dx * dx))
  return { x: cx + dx, y: R + dy, nx: dx / R, ny: dy / R }
}

/* The exponential of the fade, in units of t (0..1 of the life). */
const K_FADE = PARTICLES.lifetime / PARTICLES.tau

const smoothstep = (v: number, a: number, b: number) => {
  'worklet'
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

type Props = {
  width: number
  burst: SharedValue<number>
  /** One single color for every dot (light mode: the pill's). Without it, the measured table. */
  color?: string
}

function Dot({ p, width, burst, color }: { p: Particle } & Props) {
  const b = edge(p.u * width, width, p.side)
  /* The total displacement, worked out once: the normal times the travel,
     plus the expansion from the center and the noise, in x. */
  const endX = b.nx * p.travel + PARTICLES.expansion * (b.x - width / 2) + p.noise
  const endY = b.ny * p.travel
  const style = useAnimatedStyle(() => {
    const t = burst.get()
    if (t <= 0 || t >= 1) return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] }
    const v = Math.min(1, t / p.travelFraction)
    const eo = 1 - (1 - v) * (1 - v) // quadratic ease-out, measured
    /* Exponential fade from the dot's own brightness, and a soft close
       from `fadeFrom` so that the life ends at zero. */
    const fade = Math.exp(-K_FADE * t) * (1 - smoothstep(t, PARTICLES.fadeFrom, 1))
    return {
      opacity: PARTICLES.maxBrightness * p.brightness * fade,
      transform: [
        { translateX: endX * eo },
        { translateY: endY * eo },
        { scale: 1 - (1 - PARTICLES.finalScale) * t },
      ],
    }
  })
  /* The dot's center is born `fromEdge` outside, along the normal. */
  const cx = b.x + b.nx * PARTICLES.fromEdge
  const cy = b.y + b.ny * PARTICLES.fromEdge
  return (
    <Animated.View
      style={[
        css.dot,
        {
          left: cx - p.diameter / 2,
          top: cy - p.diameter / 2,
          width: p.diameter,
          height: p.diameter,
          borderRadius: p.diameter / 2,
          backgroundColor: color ?? p.color,
        },
        style,
      ]}
    />
  )
}

/* `memo` with primitive props and a shared value with a stable identity:
   this tree of 46 views has no reason to ever render again. */
export const Particles = memo(function Particles({ width, burst, color }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {TABLE.map((p, i) => (
        <Dot key={i} p={p} width={width} burst={burst} color={color} />
      ))}
    </View>
  )
})

const css = StyleSheet.create({
  dot: { position: 'absolute', opacity: 0 },
})
