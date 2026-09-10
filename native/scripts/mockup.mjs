/* MOCKUP: the raw recording from the vault inside an iPhone, with a
 * camera that comes in and goes out, over a neutral background (or an
 * image), ready for X.
 *
 *   pnpm mockup swipeable-tabs                       → neutral background, iPhone 17 Black, camera "start"
 *   pnpm mockup swipeable-tabs --until=2.6 --focus=0.145
 *   pnpm mockup swipeable-tabs ~/background.png      → over an image, no camera (pixel by pixel)
 *   pnpm mockup swipeable-tabs --model="iPhone 17 Pro Max" --color=Silver --camera=still
 *
 * It reads VAULT_DIR/nativo/<slug>.mp4 (what `pnpm record` left there,
 * or a recording from the phone) and writes
 * .context/mockup/output/<slug>.mp4: 2160×2160 at 60 fps, h264, the
 * real ceiling of a post on X (measured: X serves 2160² if you upload
 * it that way; everything else it recompresses to 720²).
 *
 * ─── WHERE EVERY NUMBER COMES FROM ───
 *
 * THE REFERENCE IS THE CLIP BY @nater02 (x.com/nater02/status/
 * 2092952884987957708, 720² at 60 fps, 24.6 s), measured frame by frame
 * on 2026-09-04:
 *
 *   background flat RGB (235, 230, 232). The four corners and the edges
 *              measure the same in every frame; no gradient
 *   phone      body 335×686 in 720²: 95.3 % of the height, centered
 *              (196 px of air on the left, 190 on the right)
 *   shadow     only to the right and below (on the left and above, the
 *              background is intact 6 px from the edge). The profile to
 *              the right of the edge, every 6 px: 106 134 157 172 183
 *              192 198 201 205 210 … 232 at 150 px. It is not a
 *              gaussian: it is one tight and dark plus one wide and
 *              faint. Least-squares fit (error 3.7 of luma over the four
 *              sides): layer 1 = alpha 0.60, σ 8, offset 12; layer 2 =
 *              alpha 0.20, σ 30, offset 70, in px of 720. Here they
 *              scale with the canvas.
 *   camera     it starts on the whole phone and COMES IN to 1.576× over
 *              0.65 s (body width 335 → 528), stays 0.18 s, and GOES OUT
 *              over 0.62 s down to 1.161× (528 → 389), where it stays
 *              until the end. Coming in it points at the action; going
 *              out it leaves the phone centered, with one edge cropped
 *              and the other 52 px from the canvas (7.2 %).
 *   curves     the width of the body frame by frame, normalized, against
 *              a cubic bézier (a search over the four control points):
 *              in (0.30, 0.05, 0.40, 0.90), rms 0.005; out (0.25, 0.25,
 *              0.20, 0.90), rms 0.005. None of the known CSS curves gets
 *              below 0.03.
 *
 * The frame is Apple's OFFICIAL BEZEL (Apple Design Resources,
 * Bezel-iPhone-17.dmg → PNG). The one in the reference is a black phone
 * with a ratio of 2.05 (335×686): the iPhone 17 (body 1310×2706 = 2.066)
 * before the Pro Max (2.095), and in black there is only the 17. Each
 * model carries its own geometry, measured over the alpha of the PNG:
 * the screen slot, the body and the radii. The PNGs DO NOT travel with
 * the repo: the license allows using them for mockups of interfaces on
 * Apple platforms but not redistributing them, so they live in
 * `.context/mockup/`, gitignored, with the license next to them.
 *
 * The recording (1320×2868, Pro Max) goes into the slot of the 17
 * (1206×2622) scaled: the ratio is the same to within 0.1 % (0.4603 vs
 * 0.4600). It is drawn 4 px LARGER than the slot on each side, under the
 * opaque bezel: with the camera, each layer rounds to the pixel on its
 * own, and without that overhang the background would show through as a
 * thin fillet. Its corner mask has a radius of 186 (px of the PNG), LESS
 * than the slot, which is a continuous curve of ~230: the visible corner
 * is the slot's and what is left over stays under the bezel; with more
 * radius the background would show.
 *
 * ─── THE CAMERA, FROM THE INSIDE ───
 * There is no zoom over the composed frame (that would soften
 * everything): each layer (bezel, screen, shadow) is scaled PER FRAME
 * from its source (`scale … eval=frame`) and positioned with ffmpeg
 * expressions in `t`. The camera is (k, C): a zoom and the point of the
 * base canvas that ends up in the center; a layer that at rest sits at P
 * is drawn at (P − C)·k + L/2. The curves of the reference are bézier,
 * which ffmpeg does not evaluate, so each one is approximated with a
 * degree-7 polynomial fitted right here (error < 0.007, monotonic frame
 * by frame).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))

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
const options = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, ...v] = a.slice(2).split('=')
    return [k, v.length ? v.join('=') : 'true']
  }),
)
const [slug, image] = args.filter((a) => !a.startsWith('--'))
if (!slug) {
  console.error(
    'Usage:  pnpm mockup <slug> [image] [--background=#EBE6E8] [--model="iPhone 17"|"iPhone 17 Pro Max"] [--color=Black|Silver|"Deep Blue"|"Cosmic Orange"]\n' +
      '                 [--camera=start|still] [--wait=0.25] [--until=2.6] [--focus=0.145] [--side=center|right]\n' +
      '                 [--canvas=N] [--blur=0] [--light=0] [--test=seconds] [--output=file]',
  )
  process.exit(1)
}

const vault = vaultDir()
if (!vault) {
  console.error('VAULT_DIR is not in .env.local (see .env.example)')
  process.exit(1)
}
/* `--clip=file` skips the vault (to try it with another source). */
const clip =
  options.clip ??
  ['nativo', 'native']
    .map((c) => path.join(vault, c, `${slug}.mp4`))
    .find((p) => fs.existsSync(p))
if (!clip || !fs.existsSync(clip)) {
  console.error(`There is no ${slug}.mp4 in the vault. Record it first: pnpm record ${slug}`)
  process.exit(1)
}
/* `--verify`: instead of the recording, a solid red goes in, the first
   3.6 s are rendered (the whole camera) and it is checked pixel by pixel
   that the WHOLE slot of the bezel, in every state of the camera, shows
   red: no background and no shadow poking out at an edge. */
const verify = options.verify === 'true'

/* ─── THE MODELS, measured over the alpha of each PNG ───
   png: the size of the file · body: the opaque box of the phone and the
   radius of its corner · screen: the transparent slot and the radius the
   recording is masked with (smaller than the slot's, see above). */
const MODELS = {
  'iPhone 17 Pro Max': {
    png: { w: 1470, h: 3000 },
    body: { x: 29, y: 20, w: 1412, h: 2958, r: 200 },
    screen: { x: 75, y: 66, w: 1320, h: 2868, r: 186 },
    colors: ['Silver', 'Deep Blue', 'Cosmic Orange'],
  },
  'iPhone 17': {
    png: { w: 1350, h: 2760 },
    body: { x: 20, y: 27, w: 1310, h: 2706, r: 246 },
    screen: { x: 72, y: 69, w: 1206, h: 2622, r: 186 },
    colors: ['Black', 'White', 'Sage', 'Mist Blue', 'Lavender'],
  },
}
const model = options.model ?? 'iPhone 17'
const M = MODELS[model]
if (!M) {
  console.error(`Unknown model: ${model}. There are: ${Object.keys(MODELS).join(', ')}`)
  process.exit(1)
}
const color = options.color ?? M.colors[0]
const bezel = path.join(ROOT, '.context/mockup', `${model} - ${color} - Portrait.png`)
if (!fs.existsSync(bezel)) {
  console.error(`The bezel ${bezel} is missing\n(Apple Design Resources › Bezel-iPhone-17.dmg → PNG/${model}/)`)
  process.exit(1)
}
if (image && !fs.existsSync(image)) {
  console.error(`The image ${image} does not exist`)
  process.exit(1)
}

const probe = (file, fields) =>
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', `stream=${fields}`, '-of', 'csv=p=0', file])
    .toString()
    .trim()
    .split(',')
const [clipW, clipH, clipDur] = probe(clip, 'width,height,duration').map(Number)
if (!(clipW > 0 && clipH > 0)) {
  console.error(`I could not read the dimensions of ${clip}`)
  process.exit(1)
}

/* ─── THE CANVAS ───
   Without an image: 2160², the ceiling of X, with the neutral background
   of the reference. With an image: it comes out of the image, not the
   other way around. A small image scaled up to 2160 goes soft, so the
   canvas is the largest WHOLE multiple that fits (900 → 1800) and it is
   scaled with nearest neighbor, pixel by pixel. With `--canvas=N` it is
   forced. */
const background = (options.background ?? '#EBE6E8').replace(/^#/, '0x')
let CANVAS = Number(options.canvas ?? 2160)
let imageFlags = 'lanczos'
let imageSize = null
if (image) {
  const [w, h] = probe(image, 'width,height').map(Number)
  imageSize = { w, h }
  const smaller = Math.min(w, h)
  if (!options.canvas) CANVAS = smaller >= 2160 ? 2160 : smaller * Math.max(1, Math.floor(2160 / smaller))
  if (CANVAS % smaller === 0) imageFlags = 'neighbor'
}
const L = CANVAS

/* ─── THE GEOMETRY AT REST (k = 1) ───
   The body of the bezel at 87 % of the height of the canvas (more air;
   override with --height), centered. `s0` is px of the canvas per px of
   the PNG. */
const HEIGHT = Number(options.height ?? 0.75)
const s0 = (HEIGHT * L) / M.body.h
const bw0 = M.body.w * s0
const bh0 = M.body.h * s0
const side = options.side ?? 'center'
const margin = Math.round(L * 0.046)
const bx0 = side === 'center' ? (L - bw0) / 2 : L - margin - bw0 - 8
const by0 = (L - bh0) / 2

/* The recording in the slot, with 4 px of overhang per side (px of the
   PNG); the vertical overhang comes out of keeping the ratio.

   WATCH THE ORIGINS: `screen` and `M.body` are in coordinates of the PNG
   (from its corner), `bx0/by0` is the body on the canvas. The screen
   sits on the canvas at bx0 + (screen.x − body.x)·s0. The first version
   added screen.x without subtracting body.x and the screen ended up
   15×20 px off, down and to the right: in the top left corner the
   background showed through the slot ("look at the edges, they are not
   filling in", the user's screenshot, 2026-09-04). That is why
   `--verify` exists, below. */
const OVERHANG = 4
const f = (M.screen.w + 2 * OVERHANG) / clipW
const screen = {
  w: M.screen.w + 2 * OVERHANG,
  h: clipH * f,
  x: M.screen.x - OVERHANG,
  y: M.screen.y - (clipH * f - M.screen.h) / 2,
}
const maskRadius = Math.round(M.screen.r / f)

/* ─── THE SHADOW, in px of the reference's 720, scaled to the canvas ─── */
const e = L / 720
const SHADOW = [
  /* More marked than the ref: dark contact + wide ambient (right/below). */
  { alpha: 0.82, sigma: 7 * e, offset: 14 * e },
  { alpha: 0.32, sigma: 36 * e, offset: 90 * e },
]
const SHADOW_MARGIN = Math.ceil(Math.max(...SHADOW.map((c) => c.offset + 3 * c.sigma)))

/* ─── THE CAMERA ───
   `start` (the one from the reference): it waits `--wait` s with the
   whole phone, comes in over 0.65 s to 1.576× pointing at `--focus` (the
   fraction of the height of the body where the action is; 0.145 is the
   row of tabs of this piece: status bar + header + half the bar), which
   ends up at 33 % of the height of the canvas; it stays until `--until`
   s; it goes out over 0.62 s to 1.161× with the top edge of the phone at
   7.2 % of the canvas (the reference leaves that air below because its
   action is below; here it is above). With a background image it goes
   `still` unless you ask otherwise: the zoom would take it off the exact
   pixel. */
const camera = options.camera ?? (image ? 'still' : 'start')
const K1 = Number(options.k1 ?? 1.576)
const K2 = Number(options.k2 ?? 1.161)
const T1 = Number(options.wait ?? 0.25)
const T2 = T1 + Number(options.in ?? 0.65)
const T3 = Number(options.until ?? 2.6)
const T4 = T3 + Number(options.out ?? 0.62)
const focus = Number(options.focus ?? 0.145)
if (T3 < T2) {
  console.error(`--until (${T3}) has to be greater than the end of the way in (${T2.toFixed(2)})`)
  process.exit(1)
}
const _cx1 = bx0 + bw0 / 2
const cy1 = by0 + (focus + (0.5 - 0.33) * (L / (bh0 * K1))) * bh0
const _cy2 = by0 + ((0.5 - 0.072) * L) / K2

/* A cubic bézier easing, and its degree-5 polynomial (least squares over
   200 samples) so that ffmpeg can evaluate it. */
const _bezier = (x1, y1, x2, y2) => (x) => {
  let lo = 0
  let hi = 1
  let t = x
  for (let i = 0; i < 40; i++) {
    t = (lo + hi) / 2
    const xt = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
    if (xt < x) lo = t
    else hi = t
  }
  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
}
function polynomial(fn, degree = 5) {
  const n = 200
  const A = []
  const b = []
  for (let i = 0; i <= n; i++) {
    const u = i / n
    A.push(Array.from({ length: degree }, (_, j) => u ** (j + 1)))
    b.push(fn(u))
  }
  const AtA = Array.from({ length: degree }, () => Array(degree).fill(0))
  const Atb = Array(degree).fill(0)
  for (let i = 0; i <= n; i++)
    for (let j = 0; j < degree; j++) {
      Atb[j] += A[i][j] * b[i]
      for (let k = 0; k < degree; k++) AtA[j][k] += A[i][j] * A[i][k]
    }
  for (let c = 0; c < degree; c++) {
    let p = c
    for (let r = c + 1; r < degree; r++) if (Math.abs(AtA[r][c]) > Math.abs(AtA[p][c])) p = r
    ;[AtA[c], AtA[p]] = [AtA[p], AtA[c]]
    ;[Atb[c], Atb[p]] = [Atb[p], Atb[c]]
    for (let r = c + 1; r < degree; r++) {
      const m = AtA[r][c] / AtA[c][c]
      for (let k = c; k < degree; k++) AtA[r][k] -= m * AtA[c][k]
      Atb[r] -= m * Atb[c]
    }
  }
  const x = Array(degree).fill(0)
  for (let r = degree - 1; r >= 0; r--) {
    let s = Atb[r]
    for (let k = r + 1; k < degree; k++) s -= AtA[r][k] * x[k]
    x[r] = s / AtA[r][r]
  }
  let worst = 0
  for (let i = 0; i <= n; i++) {
    const u = i / n
    worst = Math.max(worst, Math.abs(x.reduce((acc, c, j) => acc + c * u ** (j + 1), 0) - fn(u)))
  }
  return { coef: x, worst }
}
/* Pure optical zoom: monotonic smootherstep (the same in and out). The
   bézier of the ref plus a pan in Y read as "up and down". */
const smootherstep = (u) => u * u * u * (u * (u * 6 - 15) + 10)
const ZOOM_IN = polynomial(smootherstep)
const ZOOM_OUT = polynomial(smootherstep)

/* Expressions for ffmpeg. `segment` interpolates from `a` to `b` between
   t0 and t1 with the curve `c`; `curve` builds the whole trajectory of a
   value through the four moments of the camera. Register 1 holds u. */
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(6))
const poly = (c) => `min(max(${c.coef.map((k, i) => `(${num(k)})*pow(ld(1),${i + 1})`).join('+')},0),1)`
const segment = (a, b, c, t0, t1) => `(${num(a)}+(${num(b - a)})*(st(1,(t-${num(t0)})/${num(t1 - t0)})*0+${poly(c)}))`
const curve = (v0, v1, v2) =>
  camera === 'still'
    ? num(v0)
    : `if(lt(t,${num(T1)}),${num(v0)},if(lt(t,${num(T2)}),${segment(v0, v1, ZOOM_IN, T1, T2)},if(lt(t,${num(T3)}),${num(v1)},if(lt(t,${num(T4)}),${segment(v1, v2, ZOOM_OUT, T3, T4)},${num(v2)}))))`
const kExpr = curve(1, K1, K2)
/* Centered at rest (L/2). Coming in, the focus climbs to the tabs; going
   out, it returns to the center, with the same smootherstep as k and no
   bounce. */
const cxExpr = num(L / 2)
const cyExpr = curve(L / 2, cy1, L / 2)
/* Registers: 2 = k, 4 = Cx, 5 = Cy. Every expression recalculates them:
   they are cheap, and this way none of them depends on the order in
   which ffmpeg evaluates them. */
const withCamera = (expr) => `st(2,${kExpr})*0+st(4,${cxExpr})*0+st(5,${cyExpr})*0+(${expr})`
const K = 'ld(2)'
/* A point P of the base canvas, in the frame: (P − C)·k + L/2. */
const atX = (p) => `((${num(p)})-ld(4))*${K}+${num(L / 2)}`
const atY = (p) => `((${num(p)})-ld(5))*${K}+${num(L / 2)}`
const size = (base) => `round(${num(base)}*${K})`

/* A rectangular mask with rounded corners, as a geq expression: alpha 0
   in the four corner sectors that fall outside the arc. */
const outsideCorners = (w, h, r) => {
  const r2 = r * r
  const corner = (cx, cy, condX, condY) => `${condX}*${condY}*gt(pow(X-${cx},2)+pow(Y-${cy},2),${r2})`
  return [
    corner(r, r, `lt(X,${r})`, `lt(Y,${r})`),
    corner(w - 1 - r, r, `gt(X,${w - 1 - r})`, `lt(Y,${r})`),
    corner(r, h - 1 - r, `lt(X,${r})`, `gt(Y,${h - 1 - r})`),
    corner(w - 1 - r, h - 1 - r, `gt(X,${w - 1 - r})`, `gt(Y,${h - 1 - r})`),
  ].join('+')
}

/* ─── THE TWO AUXILIARY IMAGES, cached by their numbers ───
   The mask of the screen (gray, the size of the recording) and the
   shadow (rgba, at the scale of rest) are generated once: making them
   with geq frame by frame cost more than all the rest. */
const cache = path.join(ROOT, '.context/mockup/cache')
fs.mkdirSync(cache, { recursive: true })
const ffmpeg = (...a) => execFileSync('ffmpeg', ['-v', 'error', '-y', '-threads', '2', '-filter_complex_threads', '1', ...a], { stdio: 'inherit' })

const mask = path.join(cache, `mask-${clipW}x${clipH}-r${maskRadius}.png`)
if (!fs.existsSync(mask))
  ffmpeg(
    '-f', 'lavfi', '-i', `color=c=white:s=${clipW}x${clipH}:d=1,format=gray`,
    '-vf', `geq=lum='if(${outsideCorners(clipW, clipH, maskRadius)},0,255)'`,
    '-frames:v', '1', mask,
  )

const sw = Math.round(bw0)
const sh = Math.round(bh0)
const sr = Math.round(M.body.r * s0)
const shadowW = sw + 2 * SHADOW_MARGIN
const shadowH = sh + 2 * SHADOW_MARGIN
const shadow = path.join(cache, `shadow-${sw}x${sh}-${SHADOW.map((c) => `${c.alpha}-${c.sigma.toFixed(1)}-${c.offset.toFixed(1)}`).join('-')}.png`)
if (!fs.existsSync(shadow)) {
  const layer = (c, i) =>
    `color=c=white:s=${sw}x${sh}:d=1,format=gray,geq=lum='if(${outsideCorners(sw, sh, sr)},0,${Math.round(c.alpha * 255)})',` +
    `pad=${shadowW}:${shadowH}:${Math.round(SHADOW_MARGIN + c.offset)}:${Math.round(SHADOW_MARGIN + c.offset)}:color=black,gblur=sigma=${c.sigma.toFixed(2)}[c${i}]`
  ffmpeg(
    '-f', 'lavfi', '-i', `color=c=black:s=${shadowW}x${shadowH}:d=1,format=rgba`,
    '-filter_complex',
    /* screen = 1 − (1−a)(1−b): the two layers add up as shadows, not as
       paint. */
    `${SHADOW.map(layer).join(';')};[c0][c1]blend=all_mode=screen[alpha];[0:v][alpha]alphamerge,format=rgba[out]`,
    '-map', '[out]', '-frames:v', '1', shadow,
  )
}

/* ─── THE GRAPH ───
   Inputs: 0 recording · 1 mask · 2 bezel · 3 shadow · 4 image (if there
   is one). The images loop at 60 fps so that their `t` is the clip's.
   Each layer is scaled per frame and placed with the camera. */
const blur = Number(options.blur ?? 0)
const light = Number(options.light ?? 0)
const inputs = [
  ...(verify ? ['-f', 'lavfi', '-i', `color=c=red:s=${clipW}x${clipH}:r=60:d=3.6`] : ['-i', clip]),
  '-loop', '1', '-framerate', '60', '-i', mask,
  '-loop', '1', '-framerate', '60', '-i', bezel,
  '-loop', '1', '-framerate', '60', '-i', shadow,
]
const backgroundFilter = image
  ? `[4:v]scale=${L}:${L}:force_original_aspect_ratio=increase:flags=${imageFlags},crop=${L}:${L},` +
    (blur > 0 ? `gblur=sigma=${blur},` : '') +
    (light !== 0 ? `eq=brightness=${light},` : '') +
    (camera === 'still' ? '' : `scale=w='${withCamera(size(L))}':h='${withCamera(size(L))}':eval=frame:flags=lanczos,`) +
    `format=rgba[backgroundImage];` +
    `color=c=${background}:s=${L}x${L}:r=60[canvas];` +
    `[canvas][backgroundImage]overlay=x='${withCamera(atX(0))}':y='${withCamera(atY(0))}'[bg]`
  : `color=c=${background}:s=${L}x${L}:r=60[bg]`
if (image) inputs.push('-loop', '1', '-framerate', '60', '-i', image)

const filter = [
  backgroundFilter,
  `[3:v]scale=w='${withCamera(size(shadowW))}':h='${withCamera(size(shadowH))}':eval=frame[shadow]`,
  `[2:v]scale=w='${withCamera(size(M.png.w * s0))}':h='${withCamera(size(M.png.h * s0))}':eval=frame[bezel]`,
  `[0:v]format=rgba[raw];[raw][1:v]alphamerge,scale=w='${withCamera(size(screen.w * s0))}':h='${withCamera(size(screen.h * s0))}':eval=frame[screen]`,
  `[bg][shadow]overlay=x='${withCamera(atX(bx0 - SHADOW_MARGIN))}':y='${withCamera(atY(by0 - SHADOW_MARGIN))}'[a]`,
  `[a][screen]overlay=x='${withCamera(atX(bx0 + (screen.x - M.body.x) * s0))}':y='${withCamera(atY(by0 + (screen.y - M.body.y) * s0))}':eof_action=endall[b]`,
  `[b][bezel]overlay=x='${withCamera(atX(bx0 - M.body.x * s0))}':y='${withCamera(atY(by0 - M.body.y * s0))}',format=yuv420p[out]`,
].join(';')

const outputDir = path.join(ROOT, '.context/mockup/output')
fs.mkdirSync(outputDir, { recursive: true })
const output = verify
  ? path.join(cache, 'verification.mkv')
  : (options.output ?? path.join(outputDir, `${slug}${side === 'center' ? '' : `-${side}`}.mp4`))
const test = verify ? ['-t', '3.6'] : options.test ? ['-t', String(Number(options.test))] : []
/* `medium` and not `slow`: at crf 17 the quality is set by the crf, and
   `slow` doubled the time (13 min for 25 s at 2160²) with no visible
   difference. */
const preset = verify || options.test ? 'ultrafast' : 'medium'

console.log(
  `clip       ${clip} (${clipW}×${clipH}, ${clipDur.toFixed(2)} s)\n` +
    (image ? `image      ${image} (${imageSize.w}×${imageSize.h}, ${imageFlags})\n` : `background ${background}\n`) +
    `canvas     ${L}²\nbezel      ${model} · ${color}\nside       ${side}\n` +
    `camera     ${camera}` +
    (camera === 'still' ? '' : ` · in ${T1}→${T2.toFixed(2)} s to ${K1}× (focus ${focus}) · out ${T3}→${T4.toFixed(2)} s to ${K2}×`) +
    `\ncurves     polynomials with a maximum error of ${ZOOM_IN.worst.toFixed(4)} / ${ZOOM_OUT.worst.toFixed(4)}\noutput     ${output}`,
)
/* The verification is recorded LOSSLESS and in RGB: with yuv420p the
   chroma is averaged 2 px at a time and a red pressed against the bezel
   stops being red without there being any gap at all. */
ffmpeg(
  ...inputs,
  '-filter_complex', verify ? filter.replace(/,format=yuv420p\[out\]$/, ',format=rgb24[out]') : filter,
  '-map', '[out]', '-r', '60', ...test,
  ...(verify
    ? ['-c:v', 'ffv1', '-pix_fmt', 'rgb24']
    : ['-c:v', 'libx264', '-preset', preset, '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']),
  output,
)
if (!verify) {
  console.log('done')
} else {
  /* The same camera that runs inside ffmpeg, evaluated here with the
     SAME polynomials, to know where each layer landed in each frame. */
  const evalPoly = (c, u) => Math.min(Math.max(c.coef.reduce((acc, k, i) => acc + k * u ** (i + 1), 0), 0), 1)
  const value = (t, v0, v1, v2) => {
    if (camera === 'still' || t < T1) return v0
    if (t < T2) return v0 + (v1 - v0) * evalPoly(ZOOM_IN, (t - T1) / (T2 - T1))
    if (t < T3) return v1
    if (t < T4) return v1 + (v2 - v1) * evalPoly(ZOOM_OUT, (t - T3) / (T4 - T3))
    return v2
  }
  const frames = [6, 24, 36, 48, 54, 57, 120, 160, 170, 180, 190, 200]
  const rgb = execFileSync('ffmpeg', [
    '-v', 'error', '-i', output, '-vf', `select='${frames.map((n) => `eq(n,${n})`).join('+')}'`,
    '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
  ], { maxBuffer: 1 << 30 })
  const alphaPng = execFileSync('ffmpeg', ['-v', 'error', '-i', bezel, '-f', 'rawvideo', '-pix_fmt', 'gray', '-vf', 'alphaextract', '-'], { maxBuffer: 1 << 28 })
  const alpha = (x, y) => (x < 0 || y < 0 || x >= M.png.w || y >= M.png.h ? 255 : alphaPng[y * M.png.w + x])
  /* The slot is what is transparent INSIDE the body: in the corners of
     the box of the slot there is alpha 0 that is the outside of the
     phone (the body has its own rounded corners) and there the
     background is supposed to show. It is discarded with the radius of
     the body plus a margin. */
  const rc = M.body.r + 8
  const insideBody = (x, y) => {
    const ex = x < M.body.x + rc ? M.body.x + rc : x > M.body.x + M.body.w - 1 - rc ? M.body.x + M.body.w - 1 - rc : x
    const ey = y < M.body.y + rc ? M.body.y + rc : y > M.body.y + M.body.h - 1 - rc ? M.body.y + M.body.h - 1 - rc : y
    return (x - ex) ** 2 + (y - ey) ** 2 <= rc * rc
  }
  let failures = 0
  console.log('\nframe    t      k      pixels in the slot   not red    where')
  frames.forEach((n, i) => {
    const t = n / 60
    const k = value(t, 1, K1, K2)
    const cx = L / 2
    const cy = value(t, L / 2, cy1, L / 2)
    const S = s0 * k
    const pngX = (bx0 - M.body.x * s0 - cx) * k + L / 2
    const pngY = (by0 - M.body.y * s0 - cy) * k + L / 2
    const base = i * L * L * 3
    let total = 0
    let bad = 0
    let minX = L, minY = L, maxX = -1, maxY = -1
    for (let py = M.screen.y; py < M.screen.y + M.screen.h; py++)
      for (let px = M.screen.x; px < M.screen.x + M.screen.w; px++) {
        if (alpha(px, py) !== 0 || !insideBody(px, py)) continue
        /* Within 2 px of the edge of the slot the bezel is antialiased:
           nothing is judged there. */
        let near = false
        for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) if (alpha(px + dx, py + dy)) { near = true; break }
        if (near) continue
        const X = Math.round(pngX + px * S)
        const Y = Math.round(pngY + py * S)
        if (X < 0 || Y < 0 || X >= L || Y >= L) continue
        total++
        const o = base + (Y * L + X) * 3
        if (!(rgb[o] > 150 && rgb[o + 1] < 110 && rgb[o + 2] < 110)) {
          if (bad < 6) console.log(`   · frame ${n}: png (${px},${py}) → canvas (${X},${Y}) rgb ${rgb[o]},${rgb[o + 1]},${rgb[o + 2]}`)
          bad++
          if (X < minX) minX = X
          if (Y < minY) minY = Y
          if (X > maxX) maxX = X
          if (Y > maxY) maxY = Y
        }
      }
    if (bad) failures++
    console.log(
      `${String(n).padStart(6)}   ${t.toFixed(2)}   ${k.toFixed(3)}   ${String(total).padStart(16)}   ${String(bad).padStart(8)}   ${bad ? `x ${minX}..${maxX}  y ${minY}..${maxY}` : 'ok'}`,
    )
  })
  console.log(failures ? `\nFAILED: ${failures} frames with the slot not filled` : '\nOK: the slot is filled in every frame')
  process.exit(failures ? 1 : 0)
}
