/* THE TWO FILES THE COMPOSITION NEEDS IN public/, which is gitignored:
   Apple's bezel (the license allows using it for mockups of their
   platforms, not redistributing it) and the recording, normalized to a
   constant 60 fps.

     pnpm assets                                   # the master of swipeable-tabs
     pnpm assets --clip=/path/to/another-recording.mp4
     pnpm assets --clip=… --output=hold-to-commit-dark.mp4
     pnpm assets --clip=… --output=… --duration=4.10

   `--output` exists since the second piece: a piece that is shown in
   light and in dark has TWO recordings, and both have to be in public/
   at the same time for a single render to reach them through props.
   Without it, the second one overwrote the first.

   `--duration` CUTS WHAT IS DELIVERED, NOT THE MASTER. The master of a
   take is kept whole because it is the record of what happened; what
   gets delivered can end earlier. Hold to commit cuts at 4.10 s, when
   the animation has already finished and the reset has not started yet
   (the receipt, with the measurement, is in `parameters.ts`). Cutting
   HERE and not later is what makes the two formats of the exhibition
   last exactly the same: cutting an already rendered WebM with `-c copy`
   can only cut on a key frame, and it left the WebM at 4.121 against
   4.100 of the .mov. On top of that, 25 % fewer frames get rendered.

   AND IT IS CALLED `--duration` AND NOT `--until`, which was its first
   name. On this same path `until` already names another thing: in
   `parameters.ts` it is the instant the camera STARTS ITS WAY OUT (3.00
   for hold to commit, and 9999 to say "it does not go out"), and `pnpm
   mockup --until` in the workshop names a third one. Three different
   instants with one word is exactly what the repo's naming rule
   forbids. This is a duration, it goes straight into ffmpeg's `-t`, so
   that is what it is called.

   WHY IT IS NORMALIZED: simctl records at a variable rate, 60 frames
   per second while something moves and none at all with the screen
   still, and a video like that, sampled by time, can fall on the frame
   before or after the one it belongs to. With `fps=60` every instant
   has its frame and the render is deterministic. crf 12: this is an
   intermediate, not a delivery. */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const MOCKUP = fileURLToPath(new URL('../', import.meta.url))
const ROOT = path.join(MOCKUP, '..')
const PUBLIC = path.join(MOCKUP, 'public')

const options = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, ...v] = a.slice(2).split('=')
    return [k, v.length ? v.join('=') : 'true']
  }),
)
const clip = path.resolve(options.clip ?? path.join(ROOT, '.context/mockup/master/swipeable-tabs.mp4'))
const bezel = path.join(ROOT, '.context/mockup/iPhone 17 - Black - Portrait.png')
for (const [what, file] of [['The recording', clip], ['The bezel', bezel]]) {
  if (!fs.existsSync(file)) {
    console.error(`${what} is missing: ${file}`)
    process.exit(1)
  }
}

fs.mkdirSync(PUBLIC, { recursive: true })
fs.copyFileSync(bezel, path.join(PUBLIC, 'bezel.png'))
console.log(`bezel   → public/bezel.png`)
const destination = path.join(PUBLIC, options.output ?? 'clip.mp4')
/* `-t` goes as an OUTPUT option, after the filter: it cuts by the time of
   the normalized clip, so the number you pass is the same one you read in
   a measurement at 60 fps. */
const trim = options.duration ? ['-t', String(Number(options.duration))] : []
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-y', '-i', clip, '-vf', 'fps=60', ...trim, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', destination],
  { stdio: 'inherit' },
)
const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,duration', '-of', 'csv=p=0', destination]).toString().trim()
console.log(`clip    → public/${path.basename(destination)} (${probe.replace(/,/g, ' × ').replace(' × ', '×')})\ndone`)
