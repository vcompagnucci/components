/* THE RENDER FOR THE EXHIBITION: one single video, transparent and with
   no shadow, in the two formats it takes for the alpha to reach every
   browser.

     pnpm render:exhibition                                 → swipeable-tabs
     node scripts/exhibition.mjs HoldToCommit hold-to-commit-dark

   → out/<output>.webm  (VP9 with alpha, Chrome and Firefox)
   → out/<output>.mov   (HEVC with alpha, Safari)

   With two pieces you have to say which one: the composition brings the
   camera of its piece and the second argument names the clip and the
   output. With no arguments it is still swipeable-tabs, which is what
   it was called until the second piece.

   Remotion renders the WebM with alpha directly (vp9 + yuva420p) and a
   ProRes 4444 master; the .mov for Safari comes out of the master with
   the VideoToolbox encoder of macOS, which is the only one that writes
   HEVC with alpha. The size is 1280², twice as long as the 448 slot
   (the card) and three times the 628 one… no: the slot measures 440 in
   both boxes (measured), so 1280 is almost 3×, sharpness to spare. No
   shadow and a transparent background: the card supplies the
   background, in whatever theme; the phone at 92 % (the box of the card
   is the whole video); the camera comes in to the tabs and stays (see
   parameters.ts). */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const MOCKUP = fileURLToPath(new URL('../', import.meta.url))
const OUT = path.join(MOCKUP, 'out')
fs.mkdirSync(OUT, { recursive: true })

const [composition = 'SwipeableTabsExhibition', output = 'exhibition'] = process.argv.slice(2)
/* The clip: each composition brings its own; a piece with two
   appearances names which one by argument (hold-to-commit-dark, -light). */
const clip = output === 'exhibition' ? null : `${output}.mp4`

/* EVERYTHING ELSE, transparent, no shadow, phone at 92 %, the camera
   that comes in and stays, lives in the `…Exhibition` composition of each
   piece (`forExhibition` in parameters.ts). Here only the clip is
   overridden, which is at the first level: Remotion merges the input
   props with the defaultProps only at the first level, so a partial
   `camera` would erase the focus and the curves of the piece. */
const props = JSON.stringify(clip ? { clip } : {})
const remotion = (...a) => execFileSync('npx', ['remotion', ...a], { cwd: MOCKUP, stdio: 'inherit' })
/* 1120², not 1280: the box of the card measures 560 and on a retina
   screen that is 1120 device pixels, so 1120 is 1:1, each pixel of the
   video falls on one of the screen with no resampling, and it decodes
   23 % less than 1280. Measured in Chrome before the change: 0 dropped
   frames at 1× and at 0.5×; what looks "laggy" at 0.5× are the 30 unique
   frames per second that a 60 fps recording gives, and no codec fixes
   that (interpolating to 120 with minterpolate was tried: ghosts on the
   text during the flicks; discarded). */
const SCALE = String(1120 / 2160)

/* CRF 32, AND IT USED TO BE 18. The 18 is master quality, and here the
   file is served over the network on every load: `swipeable-tabs.webm`
   weighed 8.89 MB and the detail page downloaded 9.07 MB, measured in
   Chrome with no cache.

   The 32 came out of a sweep with the reference next to it, not out of a
   preference. Cropping the worst 80×80 block, the one with the biggest
   difference against the original, searched for and not picked by hand,
   and looking at it at 200 %, the grain of the paper in the illustration
   is still whole at 32; only at 40 does it start to be lost. There is
   margin left on purpose: the piece is the shop window.

   A trap of ffmpeg that cost a round: to re-encode a WebM with alpha you
   have to ask for `-c:v libvpx-vp9` ON THE INPUT. The default VP9
   decoder throws away the alpha layer without warning and the result
   comes out opaque, corner 255 instead of 0, even though the output says
   yuva420p. */
console.log('1/3  WebM VP9 with alpha (1280²)')
remotion('render', composition, `out/${output}.webm`, '--codec=vp9', '--pixel-format=yuva420p', '--crf=32', `--scale=${SCALE}`, `--props=${props}`, '--log=error')

console.log('2/3  ProRes 4444 master with alpha (1280²)')
/* --pixel-format=yuva444p10le, and it is not optional: without it
   Remotion writes the ProRes 4444 WITH NO alpha (measured: corner 255)
   and the .mov for Safari comes out with a black background. */
remotion('render', composition, `out/${output}-master.mov`, '--codec=prores', '--prores-profile=4444', '--pixel-format=yuva444p10le', `--scale=${SCALE}`, `--props=${props}`, '--log=error')

console.log('3/3  HEVC with alpha for Safari (VideoToolbox)')
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-y', '-i', path.join(OUT, `${output}-master.mov`), '-vf', 'format=bgra',
    /* A FIXED BITRATE AND NOT `-q:v`, without prioritizing speed: Safari
       is half of the people watching, and at 0.5× each frame is looked
       at for twice as long. It used to say `-q:v 85` and
       `swipeable-tabs.mov` came out at 20.60 MB, the heaviest file on
       the site by far.

       Control by bitrate does far better than the quality scale in this
       encoder: measured over the same 4 s, `-q:v 65` gives 2.71 MB with
       SSIM 0.9948 and `-b:v 3000k` gives 1.65 MB with 0.9937. Almost the
       same quality for 60 % of the size. 4000k was chosen and not 3000k
       to leave margin: at 2000k the grain of the paper smudges and you
       see it at 200 %. */
    '-c:v', 'hevc_videotoolbox', '-alpha_quality', '0.95', '-b:v', '4000k', '-realtime', 'false', '-prio_speed', 'false', '-tag:v', 'hvc1', '-an', '-movflags', '+faststart',
    path.join(OUT, `${output}.mov`)],
  { stdio: 'inherit' },
)
/* The master has to carry real alpha before anything is taken for
   granted. */
const rgba = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(OUT, `${output}-master.mov`), '-frames:v', '1', '-pix_fmt', 'rgba', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 })
const cornerAlpha = rgba[3]
if (cornerAlpha !== 0) {
  console.error(`The master is not transparent: alpha ${cornerAlpha} in the corner. Check --pixel-format.`)
  process.exit(1)
}
console.log('   alpha of the master in the corner: 0 ✓')
for (const f of [`${output}.webm`, `${output}.mov`]) {
  const mb = (fs.statSync(path.join(OUT, f)).size / 1024 / 1024).toFixed(1)
  console.log(`   ${f}  ${mb} MB`)
}
console.log('done')
