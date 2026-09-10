import { useEffect } from 'react'
import { makeMutable, useFrameCallback, useSharedValue } from 'react-native-reanimated'

/* ═══════════════════════════════════════════════════════════════
   THE METER — what the piece costs each thread, in numbers.

   Vito asked for it (2026-09-07): "improve this button's performance a
   lot [...] simulate the load of a real app to test its performance". A
   button that "looks fluid" in the simulator with an empty app says
   nothing: the question is what happens when the JS thread is busy with
   what a real app does (parsing responses, re-rendering lists) and the
   UI thread has to hold up the gesture anyway. That asks for two things:
   a load (`load.tsx`) and THIS meter, which counts.

   It measures three things, in a fixed window from the moment it mounts:

   1. THE UI THREAD'S FRAMES, with Reanimated's `useFrameCallback`: the
      interval between one frame and the next, trimmed to how long the
      sequence lasts (from the press to the reset, if there are marks).
      Out of that come the nominal cadence (the median: 8.3 ms at
      120 Hz, 16.7 at 60), the p95, the worst gap and how many frames
      were DROPPED (every interval worth n cadences dropped n − 1). It is
      what the eye sees.

   2. THE JS THREAD'S DELAY: a 50 ms timer that measures how late it
      arrives. It is what everything going through JS suffers: the
      haptics, the sound, any setState. A `block` is a delay of more than
      100 ms.

   3. THE MARKS: `markUI(name)` (in worklets) and `markJS(name)` (in JS)
      stamp the time (Date.now, the same clock on both threads) the FIRST
      time they are called with that name since `start()`. The button
      marks on UI when it pressed, when it crossed the first detent, when
      it asked for the sound, when it completed and when it reset; and on
      JS when each request reached it. The subtraction is the real
      latency of the haptics and the sound under load, the number that
      matters, because the fill cannot fall behind (it runs on UI) but
      the tick can.

   TWO STORES, ONE PER THREAD, on purpose. The UI marks live in a
   `makeMutable` that only UI writes to; the JS ones, in a JS object. The
   first version used a single mutable with `modify` from both sides, and
   from JS `modify` sends the modifier to UI as a worklet: the closure of
   a `mark` run in JS is not one, and UI threw "[Worklets] Tried to
   synchronously call a Remote Function" in the animation queue (RUNTIME,
   2026-09-07). The mutable is read from JS at the end, which is
   synchronous (`getSync`).

   It reports through `console.log` with the prefix `[meter]` (Metro
   prints it; the simulator's goes to `/tmp/metro-manama.log`) and, if
   you give it a URL, with a POST too, so you can read it from the phone.

   It is scaffolding: with no `MEASURE` it does not mount and the marks
   do nothing.
   ═══════════════════════════════════════════════════════════════ */

const activeUI = makeMutable(false)
const marksUI = makeMutable<Record<string, number>>({})
let activeJS = false
let marksJS: Record<string, number> = {}

/** Stamps the time under `name`, once per run. ONLY from worklets. */
export const markUI = (name: string) => {
  'worklet'
  if (!activeUI.get()) return
  const m = marksUI.get()
  if (m[name] === undefined) {
    m[name] = Date.now()
    marksUI.set(m)
  }
}
/** The same thing, from the JS thread. */
export const markJS = (name: string) => {
  if (!activeJS) return
  if (marksJS[name] === undefined) marksJS[name] = Date.now()
}

function start() {
  marksJS = {}
  activeJS = true
  marksUI.set({})
  activeUI.set(true)
}
function finish(): Record<string, number> {
  activeJS = false
  activeUI.set(false)
  return { ...marksUI.get(), ...marksJS }
}

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d

type Frames = { frames: number; nominal: number; mean: number; p95: number; worst: number; dropped: number; gaps: number }
export type Report = {
  context: string
  windowMs: number
  ui: Frames & { from: string }
  /* The same numbers per stretch of the sequence: the hold (press →
     commit), the burst (700 ms from the commit), the still wait and the
     reset's fade. To know WHERE frames get dropped, not just how many. */
  phases: Record<string, Frames>
  js: { samples: number; meanDelay: number; p95Delay: number; worstDelay: number; blocks: number }
  marks: Record<string, number>
  latencies: Record<string, number>
}

/* How long what follows the reset lasts (the fade) and how much before the press counts. */
const TAIL_MS = 800
const BEFORE_MS = 100

const BURST_MS = 700

function count(intervals: number[], fixedNominal?: number): Frames {
  const sorted = [...intervals].sort((a, b) => a - b)
  const nominal = fixedNominal ?? percentile(sorted, 0.5)
  let dropped = 0, gaps = 0
  for (const i of intervals) {
    const n = Math.round(i / nominal)
    if (n > 1) {
      dropped += n - 1
      gaps++
    }
  }
  return {
    frames: intervals.length,
    nominal: round(nominal, 2),
    mean: round(intervals.reduce((a, b) => a + b, 0) / Math.max(1, intervals.length), 2),
    p95: round(percentile(sorted, 0.95), 2),
    worst: round(sorted[sorted.length - 1] ?? 0, 1),
    dropped,
    gaps,
  }
}

function summarize(context: string, windowMs: number, frames: number[][], delays: number[], m: Record<string, number>): Report {
  /* The sequence: from the press to the reset if they are marked; if not, everything. */
  const from = m['press-ui'] !== undefined ? m['press-ui'] - BEFORE_MS : -Infinity
  const to = m['reset-ui'] !== undefined ? m['reset-ui'] + TAIL_MS : Infinity
  const between = (a: number, b: number) => frames.filter(([t]) => t! >= a && t! <= b).map(([, dt]) => dt!)
  const total = count(between(from, to))
  const phases: Record<string, Frames> = {}
  const press = m['press-ui'], commit = m['commit-ui'], reset = m['reset-ui']
  if (press !== undefined && commit !== undefined) phases['hold'] = count(between(press, commit), total.nominal)
  if (commit !== undefined) phases['burst'] = count(between(commit, commit + BURST_MS), total.nominal)
  if (commit !== undefined && reset !== undefined) phases['still'] = count(between(commit + BURST_MS, reset), total.nominal)
  if (reset !== undefined) phases['reset'] = count(between(reset, reset + TAIL_MS), total.nominal)
  const sortedDelays = [...delays].sort((a, b) => a - b)
  const diff = (a: string, b: string) => (m[a] !== undefined && m[b] !== undefined ? m[a]! - m[b]! : NaN)
  const latencies: Record<string, number> = {
    /* how long JS took to find out about each thing UI already did */
    'tick: js − ui': diff('tick-js', 'tick-ui'),
    'commit: js − ui': diff('commit-js', 'commit-ui'),
    'sound: js − ui': diff('sound-js', 'sound-ui'),
    /* the reset, measured from the commit: it has to give RESET.wait */
    'reset − commit': diff('reset-ui', 'commit-ui'),
    'hold (commit − press)': diff('commit-ui', 'press-ui'),
  }
  for (const k of Object.keys(latencies)) if (Number.isNaN(latencies[k])) delete latencies[k]
  return {
    context,
    windowMs,
    ui: { ...total, from: Number.isFinite(from) ? 'press→reset' : 'whole window' },
    phases,
    js: {
      samples: delays.length,
      meanDelay: round(delays.reduce((a, b) => a + b, 0) / Math.max(1, delays.length)),
      p95Delay: round(percentile(sortedDelays, 0.95)),
      worstDelay: round(sortedDelays[sortedDelays.length - 1] ?? 0),
      blocks: delays.filter((d) => d > 100).length,
    },
    marks: m,
    latencies,
  }
}

type Props = {
  /** What is being measured (load, recipe, material...): it goes into the report. */
  context: string
  /** How long to measure from the mount, in ms. */
  windowMs: number
  /** Where to send the report besides the console (optional). */
  receiver?: string
}

const JS_STEP = 50

export function Meter({ context, windowMs, receiver }: Props) {
  /* Each frame: [Date.now(), interval since the previous one]. */
  const frames = useSharedValue<number[][]>([])
  const frameCallback = useFrameCallback((info) => {
    if (info.timeSincePreviousFrame === null) return
    const pair = [Date.now(), info.timeSincePreviousFrame]
    frames.modify((a) => {
      a.push(pair)
      return a
    })
  }, false)

  useEffect(() => {
    start()
    frames.set([])
    frameCallback.setActive(true)
    const delays: number[] = []
    let expected = Date.now() + JS_STEP
    const clock = setInterval(() => {
      const now = Date.now()
      delays.push(Math.max(0, now - expected))
      expected = now + JS_STEP
    }, JS_STEP)
    const end = setTimeout(() => {
      clearInterval(clock)
      frameCallback.setActive(false)
      const m = finish()
      const report = summarize(context, windowMs, frames.get(), delays, m)
      const text = JSON.stringify(report)
      console.log('[meter] ' + text)
      if (receiver) fetch(receiver, { method: 'POST', headers: { 'content-type': 'application/json' }, body: text }).catch(() => {})
    }, windowMs)
    return () => {
      clearInterval(clock)
      clearTimeout(end)
      frameCallback.setActive(false)
      activeJS = false
      activeUI.set(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, windowMs, receiver])

  return null
}
