/* THE VIDEO OF AN APP PIECE: from any file to the exhibition, in one
   command.

     pnpm piece:video swipeable-tabs ~/Downloads/final.mp4
     pnpm piece:video swipeable-tabs ~/Downloads/final-dark.mp4 --dark
     pnpm piece:video swipeable-tabs ~/Downloads/final.mov --width=720 --crf=23 --overwrite

     pnpm piece:video swipeable-tabs mockup/out/exhibition --alpha

   `--alpha` is the exhibition's path: it takes the BASE of a pair that
   already comes ready from `pnpm render:exhibition` (<base>.webm with
   VP9 and alpha, <base>.mov with HEVC and alpha), copies them as they
   are to public/pieces/ and fills in `video` and `videoHevc`. It does
   not re-encode: alpha does not survive an h264, and the pair already
   comes out at 1280². `--dark` stayed for pieces with a background
   baked per theme; today's exhibition does not use it.

   It does three things, in order: (1) it looks the piece up in PIECES
   by its `slug`, the field of the entry, which is also the URL, so the
   file and the URL cannot drift apart; (2) it re-encodes the file for
   the web: h264, yuv420p, faststart, no audio, at the requested width
   (720 by default: twice the detail's slot, which measures 319),
   keeping the file's aspect ratio, and at 60 fps if the source brings
   them; (3) it writes public/pieces/<slug>.mp4 and puts
   `video: '/pieces/<slug>.mp4'` in the entry. The card picks it up on
   its own: `Showcase` in parts.tsx.

   ─── WHY IT EXISTS ───
   Publishing (Add to Exhibition) copies a vault clip AS IT IS, and the
   vault is the wall of other people's work: a piece of our own has no
   reason to pass through there, and its master even less (what the
   simulator records weighs 20-25 MB at 1320×2868). The video of a piece
   can arrive after publishing it, made separately, by another person or
   in another session, and while it is not there the card shows the
   empty phone slot (the ::before of .streamPreview). This command is
   the step that was missing between "here is the file" and "it is in
   the exhibition".

   ─── GUARDS ───
   · The slug has to exist in PIECES: publishing is a separate gesture.
   · If the piece already has a video, it does not overwrite it unless
     `--overwrite`.
   · It writes the mp4 to a temporary file and renames it at the end;
     pieces.ts the same (temporary + rename), the way the function that
     adds a piece does in vault-media.
   · It does not decide the aspect ratio: it keeps it. The card's slot
     takes the file's (an iPhone recording is the silhouette of the
     phone; a square mockup looks square). */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PIECES } from '../src/pieces.ts'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const PIECES_TS = path.join(ROOT, 'src/pieces.ts')
const PIECES_DIR = path.join(ROOT, 'public/pieces')

const args = process.argv.slice(2)
const options = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, ...v] = a.slice(2).split('=')
    return [k, v.length ? v.join('=') : 'true']
  }),
)
const [slug, file] = args.filter((a) => !a.startsWith('--'))
if (!slug || !file) {
  console.error('Usage:  pnpm piece:video <slug> <file> [--width=720] [--crf=23] [--overwrite]')
  process.exit(1)
}
if (!fs.existsSync(file) && options.alpha !== 'true') {
  console.error(`${file} does not exist`)
  process.exit(1)
}
const piece = PIECES.find((p) => p.slug === slug)
if (!piece) {
  console.error(`There is no piece with slug "${slug}" in PIECES. Publish it first (Add to Exhibition) or add the entry by hand.`)
  process.exit(1)
}
if (piece.platform !== 'App') {
  console.error(`"${piece.name}" is a Web piece: it is demonstrated running, not in video.`)
  process.exit(1)
}
const dark = options.dark === 'true'
const alpha = options.alpha === 'true'
const field = dark ? 'videoDark' : 'video'
const suffix = dark ? '-dark' : ''
if (!alpha && piece[field] && options.overwrite !== 'true') {
  console.error(`"${piece.name}" already has ${field} (${piece[field]}). To replace it: --overwrite`)
  process.exit(1)
}

/* ─── THE PAIR WITH ALPHA, as it is. It replaces whatever is there: it
   is THE version of the exhibition, and `pnpm render:exhibition` is its
   only source. ─── */
function setField(src, fieldName, value) {
  const start = src.indexOf(`slug: '${slug}'`)
  const end = src.indexOf('\n  },', start)
  if (start < 0 || end < 0) throw new Error('Could not find the entry in pieces.ts with the expected shape')
  const block = src.slice(start, end)
  const line = `${fieldName}: '${value}',`
  const alreadyPresent = new RegExp(`${fieldName}: '[^']*',`)
  const updated = alreadyPresent.test(block) ? block.replace(alreadyPresent, line) : `${block}\n    ${line}`
  return src.slice(0, start) + updated + src.slice(end)
}
if (alpha) {
  const base = file.replace(/\.(webm|mov)$/i, '')
  const pair = { webm: `${base}.webm`, mov: `${base}.mov` }
  for (const f of Object.values(pair)) {
    if (!fs.existsSync(f)) {
      console.error(`${f} is missing: the pair is made by \`pnpm render:exhibition\` in mockup/`)
      process.exit(1)
    }
  }
  /* `--dark` writes the pair for the piece's dark appearance, into
     `videoDark` and `videoHevcDark`: the card serves the one that
     matches the reader's theme (see Piece in pieces.ts). Without the
     flag the usual pair goes in, which is the one a reader in light
     sees. */
  fs.mkdirSync(PIECES_DIR, { recursive: true })
  fs.copyFileSync(pair.webm, path.join(PIECES_DIR, `${slug}${suffix}.webm`))
  fs.copyFileSync(pair.mov, path.join(PIECES_DIR, `${slug}${suffix}.mov`))
  let src = fs.readFileSync(PIECES_TS, 'utf8')
  src = setField(src, dark ? 'videoDark' : 'video', `/pieces/${slug}${suffix}.webm`)
  src = setField(src, dark ? 'videoHevcDark' : 'videoHevc', `/pieces/${slug}${suffix}.mov`)
  const temporaryTs = PIECES_TS + '.tmp'
  fs.writeFileSync(temporaryTs, src)
  fs.renameSync(temporaryTs, PIECES_TS)
  const mb = (f) => (fs.statSync(f).size / 1024 / 1024).toFixed(1)
  console.log(`done · ${slug}${suffix}.webm ${mb(pair.webm)} MB and ${slug}${suffix}.mov ${mb(pair.mov)} MB. pieces.ts has ${dark ? 'videoDark and videoHevcDark' : 'video and videoHevc'}. See it at /${slug}`)
  process.exit(0)
}

/* What the file brings, so that nothing gets invented: the aspect ratio
   and the frame rate come out of it. */
const probe = execFileSync('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0',
  '-show_entries', 'stream=width,height,avg_frame_rate,duration',
  '-of', 'csv=p=0', file,
]).toString().trim().split(',')
const [w, h] = probe.slice(0, 2).map(Number)
const [fn, fd] = probe[2].split('/').map(Number)
const fps = fd ? fn / fd : fn
const duration = Number(probe[3])
if (!(w > 0 && h > 0)) {
  console.error(`Could not read the dimensions of ${file}`)
  process.exit(1)
}
const even = (n) => Math.round(n / 2) * 2
const width = even(Math.min(Number(options.width ?? 720), w))
const height = even((width * h) / w)
const frameRate = fps > 45 ? 60 : 30
const crf = Number(options.crf ?? 23)

fs.mkdirSync(PIECES_DIR, { recursive: true })
const destination = path.join(PIECES_DIR, `${slug}${suffix}.mp4`)
const temporary = path.join(PIECES_DIR, `.${slug}${suffix}.tmp.mp4`)
console.log(`input    ${file} (${w}×${h}, ${fps.toFixed(2)} fps, ${duration.toFixed(2)} s)\noutput   ${destination} (${width}×${height}, ${frameRate} fps, crf ${crf})`)
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-y', '-i', file,
    '-vf', `fps=${frameRate},scale=${width}:${height}:flags=lanczos`,
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', temporary],
  { stdio: 'inherit' },
)
fs.renameSync(temporary, destination)

/* The entry in pieces.ts: it is located by its `slug`, the field, which
   does not change when the title changes, and only that piece's block
   is touched, up to the `},` that closes it. */
const src = fs.readFileSync(PIECES_TS, 'utf8')
const start = src.indexOf(`slug: '${slug}'`)
const end = src.indexOf('\n  },', start)
if (start < 0 || end < 0) {
  console.error('Could not find the entry in pieces.ts with the expected shape; the mp4 was written, add `video` by hand.')
  process.exit(1)
}
const block = src.slice(start, end)
const line = `${field}: '/pieces/${slug}${suffix}.mp4',`
const alreadyPresent = new RegExp(`${field}: '[^']*',`)
const updatedBlock = alreadyPresent.test(block) ? block.replace(alreadyPresent, line) : `${block}\n    ${line}`
const temporaryTs = PIECES_TS + '.tmp'
fs.writeFileSync(temporaryTs, src.slice(0, start) + updatedBlock + src.slice(end))
fs.renameSync(temporaryTs, PIECES_TS)

const mb = (fs.statSync(destination).size / 1024 / 1024).toFixed(1)
console.log(`done · ${mb} MB. pieces.ts has ${field}: '/pieces/${slug}${suffix}.mp4'. See it at /${slug}`)
