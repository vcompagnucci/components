/* DOES THE SLOT OF THE BEZEL STAY FILLED THROUGH THE WHOLE CAMERA? It
   renders twelve frames with a solid red instead of the recording and
   checks pixel by pixel, with the same geometry the composition draws
   with, that the whole slot shows red: no background and no shadow
   poking out at an edge. It exists because in the previous pipeline the
   screen ended up 15×20 px off and the background showed at the corner;
   in the whole frame you could not see it, zoomed in you could ("look at
   the edges, they are not filling in", 2026-09-04). Each layer positions
   itself on its own: an origin taken wrong does not fail, it shows.

     pnpm verify

   It exits with 1 if any frame has the slot unfilled. */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

import { IPHONE_17, layers, framing } from '../src/geometry.ts'

const MOCKUP = fileURLToPath(new URL('../', import.meta.url))
const OUTPUT = path.join(MOCKUP, 'out/verification')
fs.mkdirSync(OUTPUT, { recursive: true })

const serveUrl = await bundle({ entryPoint: path.join(MOCKUP, 'src/index.ts') })
/* The composition is passed by argument since the second piece: each one
   has its own camera, and the guard on the edges is only worth something
   if it checks the camera that is going to be rendered.
   node scripts/verify.mjs HoldToCommit */
const id = process.argv[2] ?? 'SwipeableTabs'
const inputProps = { screen: 'red' }
const composition = await selectComposition({ serveUrl, id, inputProps })
console.log(`composition: ${id}`)
const props = composition.props
const L = composition.width

/* The frames: at rest, four of the way in, the plateau, four of the way
   out and the final rest, in seconds of the clip. */
const cam = props.camera
const times = [0.1, cam.wait + 0.15, cam.wait + 0.35, cam.wait + 0.55, cam.wait + cam.in, cam.until - 0.5, cam.until + 0.07, cam.until + 0.23, cam.until + 0.4, cam.until + cam.out, cam.until + cam.out + 0.2, composition.durationInFrames / composition.fps - 0.05]
const frames = times.map((t) => Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps)))

/* The alpha of the bezel, to know what is slot. */
const bezel = path.join(MOCKUP, 'public', props.bezel)
const alphaPng = execFileSync('ffmpeg', ['-v', 'error', '-i', bezel, '-vf', 'alphaextract', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 28 })
const { png, body, screen } = IPHONE_17
const alpha = (x, y) => (x < 0 || y < 0 || x >= png.w || y >= png.h ? 255 : alphaPng[y * png.w + x])
/* What is transparent INSIDE the body: at the corners of the box of the
   slot there is alpha 0 that is the outside of the phone, and there the
   background does have to show. */
const rc = body.r + 8
const insideBody = (x, y) => {
  const ex = x < body.x + rc ? body.x + rc : x > body.x + body.w - 1 - rc ? body.x + body.w - 1 - rc : x
  const ey = y < body.y + rc ? body.y + rc : y > body.y + body.h - 1 - rc ? body.y + body.h - 1 - rc : y
  return (x - ex) ** 2 + (y - ey) ** 2 <= rc * rc
}

let failures = 0
console.log('\n frame   t      k      pixels in the slot   not red   where')
for (const n of frames) {
  const file = path.join(OUTPUT, `f${n}.png`)
  await renderStill({ composition, serveUrl, frame: n, output: file, inputProps, imageFormat: 'png' })
  const rgb = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 })
  const t = n / composition.fps
  const e = framing(t, L, props.height, cam)
  const r = layers(e, { w: props.clipWidth, h: props.clipHeight })
  let total = 0
  let notRed = 0
  let minX = L, minY = L, maxX = -1, maxY = -1
  for (let py = screen.y; py < screen.y + screen.h; py++)
    for (let px = screen.x; px < screen.x + screen.w; px++) {
      if (alpha(px, py) !== 0 || !insideBody(px, py)) continue
      let near = false
      for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) if (alpha(px + dx, py + dy)) { near = true; break }
      if (near) continue
      const X = Math.round(r.bezel.x + px * e.s)
      const Y = Math.round(r.bezel.y + py * e.s)
      if (X < 0 || Y < 0 || X >= L || Y >= L) continue
      total++
      const o = (Y * L + X) * 3
      if (!(rgb[o] > 150 && rgb[o + 1] < 110 && rgb[o + 2] < 110)) {
        if (notRed < 4) console.log(`   · frame ${n}: png (${px},${py}) → canvas (${X},${Y}) rgb ${rgb[o]},${rgb[o + 1]},${rgb[o + 2]}`)
        notRed++
        if (X < minX) minX = X
        if (Y < minY) minY = Y
        if (X > maxX) maxX = X
        if (Y > maxY) maxY = Y
      }
    }
  if (notRed) failures++
  console.log(`${String(n).padStart(6)}   ${t.toFixed(2)}   ${e.k.toFixed(3)}   ${String(total).padStart(16)}   ${String(notRed).padStart(8)}   ${notRed ? `x ${minX}..${maxX}  y ${minY}..${maxY}` : 'ok'}`)
}
console.log(failures ? `\nFAILED: ${failures} frames with the slot unfilled` : '\nOK: the slot is filled in every frame')
process.exit(failures ? 1 : 0)
