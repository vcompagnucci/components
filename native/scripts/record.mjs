/* RECORD: the last step of the native workshop, and the first of the
 * vault.
 *
 *   pnpm record swipe-to-pay          → the clip lands in VAULT_DIR/native/
 *   pnpm record swipe-to-pay --as-is  → without touching the status bar
 *
 * Stop it with ⌃C or Enter, and that is when it writes the file.
 *
 * ─── WHY IT WRITES STRAIGHT TO THE VAULT ───
 * The bridge in the web repo derives EVERYTHING from the file: the name
 * from the name, native/web from the subfolder, the date from the
 * filesystem. Recording in there, there is no import step: you stop the
 * recording and the clip is already in the grid of /vault. That is the
 * whole integration, and it is what makes the workshop and the
 * exhibition one single route.
 *
 * VAULT_DIR comes from the .env.local AT THE ROOT, the same one Vite
 * reads. A second copy of that path would be a second truth about where
 * your clips live.
 *
 * ─── THE TWO FLAGS THAT MATTER ───
 *
 * --codec h264 · the default of simctl is HEVC, and an HEVC .mov may
 *   not play in the <video> of the exhibition. It is the most expensive
 *   trap on this whole path because it does not fail while recording:
 *   it fails later, in the published piece.
 *
 * status_bar override · the bar of a simulator shows the real time and
 *   whatever signal it happens to have. It gets pinned to 9:41 (Apple's
 *   time in every screenshot of theirs since 2007) with a full battery
 *   and full signal, so two recordings made on different days look the
 *   same. It is reverted on the way out.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))

/* The .env.local at the root, read by hand: it is two lines, and
   bringing in a dotenv parser for this would be a dependency for
   nothing. */
function vaultDir() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return null
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*VAULT_DIR\s*=\s*(.*)\s*$/)
    if (m) return m[1].replace(/^["']|["']$/g, '').trim()
  }
  return null
}

const args = process.argv.slice(2)
const cleanStatusBar = !args.includes('--as-is')
const name = args.filter((a) => !a.startsWith('--')).join(' ').trim()

if (!name) {
  console.error('The name is missing.  pnpm record swipe-to-pay')
  process.exit(1)
}

const vault = vaultDir()
if (!vault) {
  console.error('There is no VAULT_DIR in the .env.local at the root.')
  process.exit(1)
}

/* native/ and not web/: what comes out of here is, by definition, a
   piece that runs on a phone. The bridge accepts both spellings, so the
   folder you ALREADY have is the one that gets used. */
const folder = ['native', 'nativo']
  .map((c) => path.join(vault, c))
  .find((c) => fs.existsSync(c)) ?? path.join(vault, 'native')
fs.mkdirSync(folder, { recursive: true })

const target = path.join(folder, name.replace(/\.(mov|mp4)$/i, '') + '.mp4')
if (fs.existsSync(target)) {
  console.error(`${target} already exists. The vault overwrites nothing, so pick another name.`)
  process.exit(1)
}

const simctl = (...a) => execFileSync('xcrun', ['simctl', ...a], { stdio: 'pipe' })

/* A booted simulator is a precondition, not something this script
   should solve: which one to boot is your decision. */
try {
  const booted = simctl('list', 'devices', 'booted').toString()
  if (!/\(Booted\)/.test(booted)) {
    console.error('No simulator is booted.  xcrun simctl boot "iPhone 17 Pro"')
    process.exit(1)
  }
} catch (e) {
  console.error('Could not talk to simctl:', e.message)
  process.exit(1)
}

if (cleanStatusBar) {
  try {
    simctl('status_bar', 'booted', 'override',
      '--time', '9:41',
      '--batteryState', 'charged', '--batteryLevel', '100',
      '--cellularMode', 'active', '--cellularBars', '4',
      '--wifiMode', 'active', '--wifiBars', '3')
  } catch (e) {
    console.error('Could not clean the status bar (going on anyway):', e.message)
  }
}

const restore = () => {
  if (!cleanStatusBar) return
  try {
    simctl('status_bar', 'booted', 'clear')
  } catch {}
}

console.log(`Recording → ${target}`)
console.log('Enter or ⌃C to stop.')

const recording = spawn(
  'xcrun',
  ['simctl', 'io', 'booted', 'recordVideo', '--codec', 'h264', '--force', target],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)

/* STOPPING IS A SIGINT TO THE simctl PROCESS, not killing it:
   recordVideo writes the index of the container only when it gets one.
   With SIGKILL the file is left written and CORRUPT: it weighs what it
   weighs and it does not open. */
let stopping = false
const stop = () => {
  if (stopping) return
  stopping = true
  recording.kill('SIGINT')
}

process.stdin.resume()
process.stdin.once('data', stop)
process.on('SIGINT', stop)

recording.on('close', () => {
  restore()
  process.stdin.pause()
  if (fs.existsSync(target)) {
    const mb = (fs.statSync(target).size / 1024 / 1024).toFixed(1)
    console.log(`\nDone, ${mb} MB.  It is already in the grid of /vault.`)
  } else {
    console.log('\nNo file was left behind.')
  }
})
