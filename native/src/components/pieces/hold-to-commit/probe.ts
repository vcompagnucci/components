import type { Load } from './load'

/* THE DEVELOPMENT PROBE: one fixed state per reload.
 *
 * `xcrun simctl openurl` with `?park=` asks for confirmation ("Open in
 * Workshop?") on iOS 26 and there is no way to tap it from the terminal;
 * and a probe with timers races the bundle. So the state is written
 * HERE, Fast Refresh reloads the piece, and the capture is
 * deterministic: `sed` the value + reload + screenshot.
 *
 *   undefined                 the real piece, no probe (and back to rest)
 *   '0.5'                     parked halfway through the hold (number = progress)
 *   'commit'                  finished
 *   'burst=0.2'               the burst held at that fraction of its life
 *   'crossfade=120'           the press, 120 ms after the touch (real curves)
 *   'crossfade-commit=300'    300 ms after the burst: label, whitening and particles
 *   'crossfade-release=150'   150 ms after releasing a third of the way in
 *   'auto'                    presses on its own at 700 ms and holds to the end
 *   'auto-release'            presses on its own and releases at 400 ms
 *   'demo'                    the RECORDING choreography: rest, one abandoned
 *                             hold, one full hold and the reset pulled
 *                             forward to 2 s (the timeline is above its
 *                             branch in `hold-to-commit.tsx`)
 *   'checkmark=0.5'           the commit with "✓ Order Placed" halfway through
 *                             its presence
 *
 * They reproduce the curves and timings of the 'clip' recipe
 * (`recipe.ts`): with 'skill' on they measure nothing.
 *
 * It has to stay `undefined` in the repo.
 *
 * Next to it, the other two development knobs, with the same rule (by
 * URL: `?load=all`, `?measure=1`):
 *   LOAD    'js' | 'render' | 'all': the load of a real app (`load.tsx`)
 *   MEASURE true: the frame and latency meter (`meter.tsx`), which
 *           reports through `console.log` at 9 s. Combine it with
 *           PROBE='auto' to measure the whole sequence without touching
 *           anything.
 *   RECEIVER  a URL the meter also POSTs the report to. You need it with
 *           a production bundle (`--no-dev`): there the app's
 *           `console.log` never reaches Metro. A one-line receiver:
 *           `node -e "require('http').createServer((q,r)=>{let b='';
 *           q.on('data',c=>b+=c);q.on('end',()=>{require('fs').appendFileSync(
 *           '/tmp/meter.jsonl',b+'\n');r.end()})}).listen(8090)"`.
 */
export const PROBE: string | undefined = undefined
export const LOAD: Load | undefined = undefined
export const MEASURE = false
export const RECEIVER: string | undefined = undefined
