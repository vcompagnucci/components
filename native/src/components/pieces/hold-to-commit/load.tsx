import { useEffect, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   THE LOAD: what a real app does to both threads while the button has
   to answer just the same.

   Vito asked for it (2026-09-07): "simulate the load of a real app to
   test its performance". A real app is not sitting still behind a
   button: it parses responses, updates stores, re-renders lists. That
   hits in two different places, and that is why there are two loads:

     'js'      THE JS THREAD BUSY: a loop that, every `step` ms, works
               `busy` of that time parsing and serializing a ~40 KB JSON
               (400 assets with history), the way a store taking in
               quotes would. With 0.6, JS is busy 60 % of the time: any
               timer, haptic or setState waits. What runs on UI has no
               reason to find out.

     'render'  RE-RENDER AT 10 Hz: the background detail page
               (`backgrounds/stock.tsx`, `live`) changes its values ten
               times a second, like a live price list. It is React
               reconciling and Fabric mounting ~200 views, with the
               button on top.

     'all'     both at once: the worst plausible case.

     'heavy'   JS BLOCKED IN LONG BATCHES: 150 ms of work in a row every
               250 (also 60 %, but in blocks), like a big setState or a
               JSON of several MB. It is the one that really shows what
               happens to anything that crosses to JS: the haptics and
               the sound wait up to 150 ms, and the visuals do not.

   The numbers (0.6, 20 ms, 150 ms, 40 KB, 10 Hz) are reasonable
   ASSUMPTIONS about a data app; the knob is here so you can move it.

   It is scaffolding: with no `LOAD` nothing gets mounted.
   ═══════════════════════════════════════════════════════════════ */

export type Load = 'js' | 'render' | 'all' | 'heavy'
export const LOADS: readonly Load[] = ['js', 'render', 'all', 'heavy']

const BUSY = 0.6
const STEP = 20
const HEAVY_STEP = 250

/* The JSON that gets parsed and serialized: 400 assets with history, ~40 KB. */
const BODY = JSON.stringify({
  assets: Array.from({ length: 400 }, (_, i) => ({
    id: i,
    symbol: 'AST' + i,
    price: 100 + i * 1.01,
    change: (i % 7) * 0.13,
    history: Array.from({ length: 8 }, (_, k) => 100 + ((i * 7 + k * 3) % 50)),
  })),
})

function occupyJS(busy: number, step: number) {
  let running = true
  const work = () => {
    if (!running) return
    const end = Date.now() + step * busy
    let sum = 0
    while (Date.now() < end) {
      const o = JSON.parse(BODY) as { assets: { price: number }[] }
      o.assets[0]!.price += 1
      sum += JSON.stringify(o).length
    }
    if (sum < 0) console.log(sum) // so the optimizer does not throw it away
    setTimeout(work, step * (1 - busy))
  }
  setTimeout(work, 0)
  return () => {
    running = false
  }
}

/** A counter that goes up every `ms` (0 = still). For the live re-render. */
export function useTick(ms: number): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!ms) return
    const id = setInterval(() => setTick((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])
  return ms ? tick : 0
}

/** Mounts the JS load while it is mounted. Draws nothing. */
export function LoadJS({ heavy = false }: { heavy?: boolean }) {
  useEffect(() => occupyJS(BUSY, heavy ? HEAVY_STEP : STEP), [heavy])
  return null
}

export const hasJSLoad = (l: Load | undefined) => l === 'js' || l === 'all' || l === 'heavy'
export const isHeavyLoad = (l: Load | undefined) => l === 'heavy'
export const hasRenderLoad = (l: Load | undefined) => l === 'render' || l === 'all'
