/* ═══════════════════════════════════════════════════════════════
   THE BRIDGE TO THE VAULT. It serves a folder that lives OUTSIDE the
   repo.

   The clips do not go into git. Not one. They live in a folder of
   yours, which can be your Obsidian, and this plugin serves it at
   /vault-media/ while the development server is running.

   apply:'serve' is the gate: vite build does not even instantiate the
   plugin, so in production /vault-media/ does not exist. It is the
   same mechanism as the gate on src/private/, on the server side.

   THE FOLDER COMES FROM .env.local, in VAULT_DIR. Without the VITE_
   prefix on purpose: with that prefix Vite would bake it into the
   client bundle, and the path on your disk has no business traveling
   anywhere. Here only Node reads it.

   ─── THE THREE GUARDS ───

   1 · AN ALLOWLIST OF EXTENSIONS, not a blocklist. Only what is in
       MEDIA_TYPES gets served: video and image. This matters for real
       if VAULT_DIR points at your Obsidian, because all your notes are
       in there: a .md is never served, and not because a rule blocks
       it but because it is not on the list of what does get served.

   2 · NOTHING HIDDEN. Anything starting with a dot is out, both in the
       listing and when serving: .obsidian/, .trash/, .git/, .DS_Store.

   3 · THE REAL PATH HAS TO STAY INSIDE. It is resolved with
       realpathSync, not with plain resolve, so a symlink pointing out
       of the folder does not get through either. The cost is that a
       legitimate symlink pointing inward does not work either; failing
       visibly was preferred over exposing silently.

   ─── WHY THERE IS RANGE SUPPORT ───

   Without it the player is useless for what it is meant for. A <video>
   asks for loose bytes to seek; if the server always answers with the
   whole file from byte zero, Chrome cannot jump to a moment and Safari
   does not play at all. And the whole point of the vault is being able
   to reach the exact frame where a gesture starts. That is why the
   range is implemented here and not in phase 4: it is a condition of
   the transport, not of the player.
   ═══════════════════════════════════════════════════════════════ */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { frameStepOf } from './frames.mjs'
import { linkCardOf } from './link-card.mjs'
/* The SAME count the page and routes.mjs use. Publishing names the
   video file with the piece's slug, so if a copy lived here the URL
   and the file could drift apart in silence. */
import { slug } from '../src/pieces.ts'

/* The frames are read out of the container ONCE per file. The key
   carries size and mtime, so replacing a clip re-reads it by itself
   and there is no way to keep the stale value. */
const frameStepCache = new Map()
function readFrameStep(abs, stats) {
  const key = `${abs}:${stats.size}:${stats.mtimeMs}`
  if (frameStepCache.has(key)) return frameStepCache.get(key)
  const r = frameStepOf(abs)
  frameStepCache.set(key, r)
  return r
}

/* The allowlist. What is not here does not get served. */
const MEDIA_TYPES = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/x-m4v',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
}

const VIDEO = new Set(['.mp4', '.m4v', '.mov', '.webm'])

/* This is as far down as the walk goes. It is a stop against a
   pathological tree, a big Obsidian, a circular symlink, and not a
   design decision: four levels are plenty for
   nativo/2026/something.mp4. */
const MAX_DEPTH = 4

const isHidden = (name) => name.startsWith('.')

/* ═══════════ THE DETAILS ═══════════
   What you write about a clip: what it is, where it came from, on
   which device. It goes in ONE file at the root of the vault, and not
   in a sidecar per clip, for two reasons:

     1. if the vault is your Obsidian, a .json next to every video
        doubles your folder and shows up in your searches
     2. it starts with a dot, so it is already outside everything that
        gets served, the same guard that shuts out .obsidian and .trash

   The key is the clip's relative path. If you move a file to another
   folder, its details are orphaned: that is the price of not putting
   metadata inside the file, and it is preferred over touching your
   originals. */
const DETAILS_FILE = '.lima-vault.json'

const DETAILS_FIELDS = ['notes', 'source', 'device']

/* ─── AND A FOURTH THAT IS NOT FREE TEXT: `piece` ───
   The slug of the piece this clip produced. It is what turns the clip
   into a two-way door: from the vault you open the piece it became,
   and from the piece you come back to the reference you studied.

   It is kept OUT of DETAILS_FIELDS because those three are whatever
   you typed and this one has to name a piece that exists. A slug that
   names nothing is a link that 404s, and the whole point of the field
   is being able to follow it. So it gets checked against the slugs
   written in pieces.ts, which is the same list `addPiece` reads to
   refuse a duplicate.

   It is written by hand in the details panel, and on its own when you
   publish an App piece from a clip: that is the moment the fact comes
   into being, and asking you to write down again what the server just
   did is asking you to keep two copies in step. */
const PIECE_FIELD = 'piece'

function publishedSlugs() {
  try {
    const src = fs.readFileSync(PIECES_TS, 'utf8')
    return new Set([...src.matchAll(/slug: '([^']*)'/g)].map((m) => m[1]))
  } catch {
    return new Set()
  }
}

/* The clip's own details, with the link to its piece written in. It
   returns what went wrong instead of throwing, because the caller is
   publishing and a piece that got published is not undone by a link
   that did not. */
function linkClipToPiece(root, clipPath, pieceSlug) {
  try {
    const all = readJson(root, DETAILS_FILE)
    all[clipPath] = { ...all[clipPath], [PIECE_FIELD]: pieceSlug }
    writeJson(root, DETAILS_FILE, all)
    return null
  } catch (e) {
    return String(e?.message ?? e)
  }
}

/* ═══════════ THE PLAYGROUND VIEWS ═══════════
   A separate file from the details, and not one more field inside
   them: the details describe ONE clip and live tied to its path, while
   a view is a canvas with several things on it. Putting them together
   would tie deleting a clip to deleting a canvas.

   It goes right next to it, at the root of the vault and starting with
   a dot, for the same two reasons as the details: it does not litter
   your folder and it is already outside everything that gets served.

   THE CLIENT SENDS THE WHOLE DOCUMENT and the server sanitizes it. It
   is the simplest thing that works for a single-user tool in
   development; with two tabs open, the last one to save wins. Written
   down here for the day it starts to hurt. */
const VIEWS_FILE = '.lima-playground.json'
const FRAME_KINDS = new Set(['piece', 'clip', 'sketch'])
const MAX_VIEWS = 200
const MAX_FRAMES = 60
const MAX_REF_LENGTH = 600

/* ─── ON DISK THE KEYS ARE STILL IN SPANISH ───
   The file is yours and it was written before the repo was translated.
   Renaming its keys would rewrite a document nobody asked to have
   rewritten, and the only thing it would buy is two names matching.
   So the translation happens here, at the edge: what leaves this file
   is English, and what lands on disk is what was already there. */
const KIND_FROM_DISK = { pieza: 'piece', clip: 'clip', boceto: 'sketch' }
const KIND_TO_DISK = { piece: 'pieza', clip: 'clip', sketch: 'boceto' }

const viewFromDisk = (v) => ({
  id: v?.id,
  name: v?.nombre,
  created: v?.creada,
  frames: (Array.isArray(v?.frames) ? v.frames : []).map((f) => ({
    id: f?.id,
    kind: KIND_FROM_DISK[f?.tipo],
    ref: f?.ref,
    x: f?.x,
    y: f?.y,
    width: f?.ancho,
    height: f?.alto,
  })),
})

const viewsFromDisk = (d) => (Array.isArray(d) ? d.map(viewFromDisk) : [])

const viewToDisk = (v) => ({
  id: v.id,
  nombre: v.name,
  creada: v.created,
  frames: v.frames.map((f) => ({
    id: f.id,
    tipo: KIND_TO_DISK[f.kind],
    ref: f.ref,
    x: f.x,
    y: f.y,
    ancho: f.width,
    alto: f.height,
  })),
})

/* Everything coming in goes through here. What is not recognized does
   NOT get stored: it is the same rule as the details, which drop the
   extra fields instead of writing them. */
const clampNumber = (v, min, max, fallback) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(v, min), max) : fallback
const clampText = (v, length) => (typeof v === 'string' ? v.slice(0, length) : '')

function sanitizeViews(d) {
  if (!Array.isArray(d)) return []
  return d.slice(0, MAX_VIEWS).map((v) => ({
    id: clampText(v?.id, 64),
    name: clampText(v?.name, 200),
    created: clampNumber(v?.created, 0, Number.MAX_SAFE_INTEGER, 0),
    frames: (Array.isArray(v?.frames) ? v.frames : []).slice(0, MAX_FRAMES).map((f) => ({
      id: clampText(f?.id, 64),
      kind: FRAME_KINDS.has(f?.kind) ? f.kind : 'clip',
      ref: clampText(f?.ref, MAX_REF_LENGTH),
      /* The canvas is infinite but not that infinite: an absurd value
         sent by hand would leave a frame impossible to find. */
      x: clampNumber(f?.x, -100000, 100000, 0),
      y: clampNumber(f?.y, -100000, 100000, 0),
      width: clampNumber(f?.width, 40, 8000, 400),
      height: clampNumber(f?.height, 40, 8000, 300),
    })),
  })).filter((v) => v.id)
}
const MAX_FIELD_LENGTH = 4000

/* ═══════════ UPLOAD A CLIP ═══════════
   The only path in the bridge that creates NEW files in your folder,
   so the guards all go BEFORE touching the disk, and in this order:

     1. the source comes from a list of two, not from the client
     2. the name goes through basename, which strips any separator
     3. nothing starting with a dot, the same rule that already hides
        .obsidian and .trash, now on the writing side
     4. the extension has to be on the SAME allowlist used to serve. If
        it cannot be served, it cannot be uploaded
     5. the size is cut while it comes in, not once it is in memory
     6. nothing is ever overwritten: if the name is taken, it gets
        numbered
     7. atomic write, same as the .json files

   `inside()` is NO good for the target: it uses realpathSync and the
   file does not exist yet. What gets validated is the FOLDER, that it
   exists or gets created, and that the name cannot escape it.

   THE SOURCE IS ONE OF TWO and the server translates it to the folder
   you ALREADY have: if your vault says "nativo" it writes there, and
   you do not get a "native" created next to it. The app adapts to your
   disk and not the other way around, the same reason the index accepts
   both spellings. */
const SOURCE_FOLDERS = {
  native: ['native', 'nativo'],
  web: ['web'],
}
const MAX_UPLOAD_BYTES = 512 * 1024 * 1024

/* The folder it is going to land in, created if needed. Returns null
   if the source is not one of the two. */
function folderOfSource(root, source) {
  const options = SOURCE_FOLDERS[source]
  if (!options) return null
  for (const name of options) {
    const abs = path.join(root, name)
    if (inside(root, abs) && fs.statSync(abs).isDirectory()) return abs
  }
  /* None of them exists yet: the canonical one gets created, the first
     on the list. */
  const abs = path.join(root, options[0])
  fs.mkdirSync(abs, { recursive: true })
  return inside(root, abs)
}

/* The name, sanitized. Returns null if nothing usable is left.

   basename takes any separator with it, so "../../x.mp4" ends up as
   "x.mp4" and "/etc/passwd.mp4" as "passwd.mp4". Then anything
   starting with a dot is rejected, which covers "..", ".env" and the
   "..\\..\\x" that posix basename leaves alone because the backslash
   is not a separator here. */
function safeFileName(raw) {
  if (typeof raw !== 'string') return null
  const base = path.basename(raw.replace(/\0/g, '')).trim()
  if (!base || base.startsWith('.')) return null
  if (base.includes('/') || base.includes('\\')) return null
  if (base.length > 200) return null
  if (!MEDIA_TYPES[path.extname(base).toLowerCase()]) return null
  return base
}

/* A free name in that folder. Nothing is EVER overwritten: uploading
   the same thing twice leaves you both, and the one already there is
   not touched. */
/* THE NAME YOU TYPE WHEN RENAMING.
   Different from safeFileName: that one validates an incoming file and
   demands an extension from the allowlist. What arrives here is a NAME
   TO READ, without an extension, and the extension is put on by the
   server, copied from the original file. That way renaming cannot
   change the type of a file, which is exactly the hole that letting
   the client's extension through would open. */
function safeBaseName(raw) {
  if (typeof raw !== 'string') return null
  const clean = raw.replace(/\0/g, '').trim()
  /* The separator is rejected BEFORE normalizing, not after. With
     basename first, "../outside" turned into "outside" and got
     through: the file did not escape, normalization prevents that, but
     silently accepting a name with traversal inside it surprises the
     person who typed it. If it brings separators, it is a no. */
  if (clean.includes('/') || clean.includes('\\')) return null
  let base = path.basename(clean).trim()
  if (!base || base.startsWith('.')) return null
  /* If you typed the extension too, it comes off: otherwise
     "sheet.mov" would end up as "sheet.mov.mov". */
  const ext = path.extname(base).toLowerCase()
  if (MEDIA_TYPES[ext]) base = base.slice(0, -ext.length).trim()
  if (!base || base.startsWith('.')) return null
  if (base.length > 180) return null
  return base
}

function freeName(folder, base) {
  const ext = path.extname(base)
  const stem = path.basename(base, ext)
  for (let i = 0; i < 1000; i++) {
    const name = i === 0 ? base : `${stem} ${i + 1}${ext}`
    if (!fs.existsSync(path.join(folder, name))) return name
  }
  return null
}

function readJson(root, file) {
  try {
    const t = fs.readFileSync(path.join(root, file), 'utf8')
    const d = JSON.parse(t)
    return d && typeof d === 'object' ? d : {}
  } catch {
    /* It does not exist yet, or somebody left it broken by hand. In
       both cases we start from zero instead of taking down the whole
       index. */
    return {}
  }
}

/* ATOMIC write: to a temporary file and then rename. A direct write
   that gets cut in half, because the server is closed or the disk runs
   out, leaves the file truncated and you lose all your details. rename
   is atomic within the same file system, so you get either the whole
   old version or the whole new one. */
function writeJson(root, file, data) {
  const target = path.join(root, file)
  const temp = target + '.tmp'
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n')
  fs.renameSync(temp, target)
}

/* THE GUARD, written ONCE. It returns the real path if it falls inside
   the vault, and null if it does not.

   It goes with realpathSync and not with resolve: resolve normalizes
   the ".." but does not follow symlinks, so a link inside the folder
   pointing outward would sail past it.

   The trailing separator in the startsWith matters: without it
   "/vault-malicious" would pass the test for "/vault".

   BOTH paths use it, listing and serving, and that is not tidiness. At
   first only serving had it, and the index went as far as listing a
   symlink to /etc/hosts as if it were a 213-byte mp4: it could not be
   downloaded, but the size and date from the far side of the link were
   already published. A guard that does not cover every exit is not a
   guard. */
function inside(root, abs) {
  try {
    const r = fs.realpathSync(abs)
    return r === root || r.startsWith(root + path.sep) ? r : null
  } catch {
    return null
  }
}

/* Walks the folder and returns a map of what is there. Only facts from
   the file system: what it is, how big it is and when it arrived. What
   each clip MEANS, the name you read, whether it is native or web,
   where it came from, belongs to phase 3 and does not get invented
   here. */
function walk(root, rel = '', depth = 0) {
  if (depth > MAX_DEPTH) return []
  let entries
  try {
    entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true })
  } catch {
    return []
  }
  const found = []
  for (const e of entries) {
    if (isHidden(e.name)) continue
    const r = rel ? `${rel}/${e.name}` : e.name
    /* The same guard as when serving, and BEFORE looking at anything
       else: if the name is a link that leaves the vault, it ends
       here. */
    const abs = inside(root, path.join(root, r))
    if (!abs) continue
    if (e.isDirectory()) {
      found.push(...walk(root, r, depth + 1))
      continue
    }
    const ext = path.extname(e.name).toLowerCase()
    if (!MEDIA_TYPES[ext]) continue
    let stats
    try {
      stats = fs.statSync(abs)
    } catch {
      continue
    }
    /* The frames come out of the container and not out of an estimate:
       that is what makes it possible for the arrow keys to move ONE
       exact frame. It is resolved here, on the server, because the
       browser does not expose the data.
       requestVideoFrameCallback would only give it while playing, and
       by then it would be too late. Validated against 9 files: frames
       × frame step reproduces the duration the browser reports. */
    const c = VIDEO.has(ext) ? readFrameStep(abs, stats) : null

    found.push({
      path: r,
      /* null when it is an image or when the container could not be
         read. Whoever uses it has to handle it being absent, instead of
         getting an invented number. */
      frameStep: c?.step ?? null,
      fps: c?.fps ?? null,
      frameCount: c?.samples ?? null,
      variableFrameRate: c?.variable ?? null,
      /* The file name without the extension. It is raw material for
         phase 3, not the final name that gets shown. */
      file: path.basename(e.name, ext),
      /* The folder holding it, which is how we will know whether it is
         native or web: where you dropped it is what classifies it. */
      folder: path.dirname(r) === '.' ? '' : path.dirname(r),
      ext,
      medium: VIDEO.has(ext) ? 'video' : 'image',
      bytes: stats.size,
      /* Both dates, without choosing. "Most recent" can mean when it
         entered the vault (birthtime) or when it was last touched
         (mtime); on macOS both exist. Which one wins is decided by
         phase 3, looking at real data. */
      created: (stats.birthtime?.getTime() ? stats.birthtime : stats.mtime).toISOString(),
      modified: stats.mtime.toISOString(),
    })
  }
  return found
}

/* bytes=0-499 · bytes=500- · bytes=-500 (the suffix means the last N).
   Returns null if no range was asked for, 'unsatisfiable' if what was
   asked for falls outside the file, which in HTTP is a 416 and not a
   404. */
function parseRange(header, total) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((header ?? '').trim())
  if (!m) return null
  const [, a, b] = m
  if (a === '' && b === '') return null
  let start, end
  if (a === '') {
    const length = Number(b)
    if (!length) return 'unsatisfiable'
    start = Math.max(0, total - length)
    end = total - 1
  } else {
    start = Number(a)
    end = b === '' ? total - 1 : Math.min(Number(b), total - 1)
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'unsatisfiable'
  if (start > end || start >= total) return 'unsatisfiable'
  return { start, end }
}

const json = (res, code, body) => {
  res.statusCode = code
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

/* ═══════════ THE SKETCHES ═══════════
   The only endpoint in this file that does NOT touch the vault: it
   writes inside the repo, in src/private/sketches/. This is said out
   loud because it breaks the symmetry of everything else, and the
   reason is that a sketch is code. It has to be where Vite compiles it
   and where your editor and an agent can open it, and it is not a
   medium.

   THE FOLDER IS FIXED AND COMES FROM THIS FILE, not from anything the
   client sends: it is derived from import.meta.url, so it does not
   even depend on the cwd. The only thing arriving from outside is the
   name, and only letters, numbers and hyphens survive from it. With
   that alphabet there is no ".." to build: path traversal is not
   blocked, it cannot be written.

   IT OVERWRITES NOTHING. If the file exists it returns 409 and the
   caller finds out: a button that silently replaces what you wrote is
   not a button, it is a trap. */
const SKETCHES_DIR = fileURLToPath(new URL('../src/private/sketches/', import.meta.url))

const sketchRefOf = (raw) => {
  if (typeof raw !== 'string') return null
  const s = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s && s.length <= 60 ? s : null
}

/* "sheet-that-stretches" → "SheetThatStretches". A React component has
   to start with a capital letter or JSX treats it as an HTML tag. And
   if the name starts with a number, "3-dots", a letter is put in front
   of it, because an identifier cannot. */
const identifierOf = (ref) => {
  const id = ref
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
  return /^[0-9]/.test(id) ? 'S' + id : id
}

/* THE TEMPLATE IS ALMOST NOTHING, and that is on purpose: what opens
   has to be a blank sheet with the minimum for it to draw something,
   not an example you then have to delete. The div at 100% is there
   because the frame already has the size; without it the first sketch
   is born 0 tall and looks like it did not work. */
/* ═══════════ PUBLISH: from the playground to the exhibition ═══════════
   The second endpoint that writes inside the repo, with the same
   permission as __sketch: what it produces is product, not a medium
   from the vault. You publish FROM THE BOARD, the right click on a
   frame, because that is where your work is; the vault is the outside
   and it publishes nothing.

   It does TWO things and either both land or neither does:

     1. it copies the demo's file to the public side of the boundary:
          a recording  →  public/pieces/<slug><ext>                      (App piece)
          a sketch     →  src/components/pieces/<slug>/<slug>.tsx        (Web piece)
                          + src/components/pieces/<slug>/index.tsx, which
                          exports it: the folder has the shape of
                          components/animations/<slug>/ from
                          react-native-motion, and demos.tsx looks for
                          the index
        The vault and src/private/ do not travel to the deploy; that is
        why the copy exists. And it is a COPY, not a move: the frame on
        the board still points at its own thing, and from here on the
        piece is edited in its published file.
     2. it adds the entry to src/pieces.ts, which is the real
        inventory: the page, the index and the prebuild's vercel.json
        all come out of there. With its `slug`, computed from the name
        HERE and once: since 2026-09-10 a piece's title can change and
        its URL cannot (see `Piece` in pieces.ts).

   If the second step fails, the first one is undone. Nothing is ever
   overwritten: publishing twice is a 409, not a silent replacement.

   THE PLATFORM IS TOLD BY THE FRAME, not by a selector: a recording IS
   an App piece and a sketch IS a Web piece. It is the rule of
   `platform` (App goes in video, Web goes live) read backwards. */
const PIECES_PUBLIC_DIR = fileURLToPath(new URL('../public/pieces/', import.meta.url))
const PIECES_SRC_DIR = fileURLToPath(new URL('../src/components/pieces/', import.meta.url))
const PIECES_TS = fileURLToPath(new URL('../src/pieces.ts', import.meta.url))

/* The texts travel to a .ts file between single quotes: the backslash
   and the quote get escaped, and line breaks become a space, since a
   name or a description do not have lines. */
const toLiteral = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\s+/g, ' ').trim()

function addPiece(name, pieceSlug, desc, platform, video) {
  const src = fs.readFileSync(PIECES_TS, 'utf8')

  /* The duplicate is checked by SLUG and not by name: two different
     names landing on the same URL would break the rewrite. The file is
     read fresh on every request, since the import at the top froze
     when the server started and would not see what was just published.
     And the written `slug` fields are read, not the names: a renamed
     title no longer matches its URL, and the URL is the one that
     cannot repeat. */
  const taken = [...src.matchAll(/slug: '([^']*)'/g)].map((m) => m[1])
  if (taken.includes(pieceSlug)) return { error: 'there is already a piece at that URL' }

  const entry = [
    '  {',
    `    name: '${toLiteral(name)}',`,
    `    slug: '${pieceSlug}',`,
    `    platform: '${platform}',`,
    /* The line is optional (2026-09-07): empty, the field is not
       written, and the detail does not draw the paragraph. */
    ...(desc ? [`    desc: '${toLiteral(desc)}',`] : []),
    /* A Web piece carries no video: its demo is the folder in
       src/components/pieces/, resolved by slug. See demos.tsx. */
    ...(video ? [`    video: '${video}',`] : []),
    '  },',
  ].join('\n')

  /* The empty list gets replaced whole; with pieces in it, the new one
     goes in before the `]` closing the array, which is the last thing
     in the file, so the last bracket in the text is that one. */
  let next
  if (/PIECES: Piece\[\] = \[\]/.test(src)) {
    next = src.replace('PIECES: Piece[] = []', `PIECES: Piece[] = [\n${entry}\n]`)
  } else {
    const close = src.lastIndexOf(']')
    if (close < 0) return { error: 'pieces.ts does not have the expected shape' }
    next = src.slice(0, close) + entry + '\n' + src.slice(close)
  }

  const temp = PIECES_TS + '.tmp'
  fs.writeFileSync(temp, next)
  fs.renameSync(temp, PIECES_TS)
  return { ok: true }
}

const sketchTemplate = (ref) => `/* ${identifierOf(ref)}, a sketch on the canvas.

   Write whatever you want here and save. Vite reloads it in the frame
   without touching the page. The system tokens (--ink, --surface,
   --canvas, the durations and the curves) are available as CSS
   variables. */
export default function ${identifierOf(ref)}() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--ink)',
      }}
    >
      ${identifierOf(ref)}
    </div>
  )
}
`

export function vaultMedia(rawDir) {
  /* It is resolved ONCE, at startup, and with realpath: the comparison
     that comes later is between real paths, so a symlink cannot skip
     it. */
  let root = null
  let reason = null
  if (!rawDir) {
    reason = 'VAULT_DIR is not set in .env.local'
  } else {
    try {
      const abs = fs.realpathSync(path.resolve(rawDir))
      if (!fs.statSync(abs).isDirectory()) reason = `VAULT_DIR is not a folder: ${abs}`
      else root = abs
    } catch {
      reason = `VAULT_DIR points at something that does not exist: ${rawDir}`
    }
  }

  return {
    name: 'vault-media',
    apply: 'serve',
    configureServer(server) {
      /* It is said at server startup, which is where you look when
         something does not show up. */
      const log = server.config.logger
      if (root) log.info(`  vault    ${root}`, { timestamp: false })
      else log.warn(`  vault    not connected: ${reason}`, { timestamp: false })

      server.middlewares.use('/vault-media', (req, res, next) => {
        /* ─── WRITE THE DETAILS ───
           The only write path in the whole bridge, and it is as narrow
           as it gets: one possible destination, the details file at
           the root, and one shape of key, the path of a clip THAT
           ALREADY EXISTS in the index.

           That validation is the guard: no path is resolved from what
           arrives from the client, so traversal is impossible by
           construction, not because there is a filter catching it. */
        /* ─── UPLOAD A CLIP ───
           The bytes go RAW in the body and the metadata in the query,
           not in a multipart. A multipart would have to be parsed, or a
           dependency brought in to parse it, and the only thing
           uploaded here is one file at a time: the envelope adds
           nothing and does add surface.

           It is written streaming to a temporary file. The whole file
           is never gathered in memory: a 400MB video has no reason to
           pass through the heap to get to the disk. */
        if (req.method === 'POST' && (req.url || '').split('?')[0] === '/__upload') {
          if (!root) return json(res, 409, { error: reason })

          const q = new URLSearchParams((req.url || '').split('?')[1] ?? '')
          const base = safeFileName(q.get('name'))
          if (!base) return json(res, 400, { error: 'name not allowed' })

          let folder
          try {
            folder = folderOfSource(root, q.get('source'))
          } catch (e) {
            return json(res, 500, { error: String(e?.message ?? e) })
          }
          if (!folder) return json(res, 400, { error: 'source not allowed' })

          const name = freeName(folder, base)
          if (!name) return json(res, 409, { error: 'too many with that name' })

          /* The temporary file goes in the SAME folder as the target:
             rename is only atomic within the same file system, and
             /tmp can be on another one. It starts with a dot, so if
             something goes wrong whatever is left lying around is
             already outside everything that gets served and everything
             that gets listed. */
          const temp = path.join(folder, `.uploading-${process.pid}-${Date.now()}`)
          const target = path.join(folder, name)
          const stream = fs.createWriteStream(temp)
          let bytes = 0
          let aborted = false

          const removeTemp = () => {
            try {
              fs.unlinkSync(temp)
            } catch {}
          }

          req.on('data', (c) => {
            bytes += c.length
            if (bytes > MAX_UPLOAD_BYTES && !aborted) {
              aborted = true
              stream.destroy()
              req.destroy()
              removeTemp()
            }
          })
          req.on('error', () => {
            if (!aborted) {
              aborted = true
              stream.destroy()
              removeTemp()
            }
          })
          stream.on('error', () => {
            if (!aborted) {
              aborted = true
              removeTemp()
              json(res, 500, { error: 'could not write' })
            }
          })
          req.pipe(stream)

          stream.on('finish', () => {
            if (aborted) return
            /* An empty body leaves a 0-byte file that later shows up
               in the grid as a broken clip. Better not to create it. */
            if (!bytes) {
              removeTemp()
              return json(res, 400, { error: 'empty body' })
            }
            try {
              fs.renameSync(temp, target)
            } catch (e) {
              removeTemp()
              return json(res, 500, { error: String(e?.message ?? e) })
            }
            const rel = path.relative(root, target).split(path.sep).join('/')
            return json(res, 200, { ok: true, path: rel, bytes })
          })
          return
        }

        /* The playground views. Same skeleton as the details, bounded
           body, JSON or 400, sanitized before touching the disk,
           atomic write, and that is why reading the body is shared. */
        if (req.method === 'PUT' && (req.url || '').split('?')[0] === '/__views') {
          if (!root) return json(res, 409, { error: reason })
          let body = ''
          req.setEncoding('utf8')
          req.on('data', (c) => {
            body += c
            if (body.length > 512 * 1024) req.destroy()
          })
          req.on('end', () => {
            let d
            try {
              d = JSON.parse(body)
            } catch {
              return json(res, 400, { error: 'invalid json' })
            }
            const views = sanitizeViews(d?.views)
            try {
              writeJson(root, VIEWS_FILE, { vistas: views.map(viewToDisk) })
            } catch (e) {
              return json(res, 500, { error: String(e?.message ?? e) })
            }
            return json(res, 200, { ok: true, views })
          })
          return
        }

        if (req.method === 'PUT' && (req.url || '').split('?')[0] === '/__details') {
          if (!root) return json(res, 409, { error: reason })
          let body = ''
          req.setEncoding('utf8')
          req.on('data', (c) => {
            body += c
            /* An outsized body is cut here and not once it is already
               in memory. */
            if (body.length > 64 * 1024) req.destroy()
          })
          req.on('end', () => {
            let d
            try {
              d = JSON.parse(body)
            } catch {
              return json(res, 400, { error: 'invalid json' })
            }
            const clipPath = typeof d?.path === 'string' ? d.path : ''
            const exists = walk(root).some((c) => c.path === clipPath)
            if (!exists) return json(res, 404, { error: 'that clip is not in the vault' })

            /* Only the known fields, trimmed. Anything extra gets
               dropped instead of stored. */
            const clean = {}
            for (const k of DETAILS_FIELDS) {
              const v = d?.details?.[k]
              if (typeof v === 'string' && v.trim()) clean[k] = v.slice(0, MAX_FIELD_LENGTH)
            }

            /* The piece does not go through that loop: the other three
               are whatever you typed and this one has to name a piece
               that exists. Dropping a bad slug in silence is what the
               loop above does with an unknown field, and it is exactly
               the failure this field cannot afford: you would save,
               see nothing, and have no link. So it answers 400. */
            const linked = d?.details?.[PIECE_FIELD]
            if (typeof linked === 'string' && linked.trim()) {
              if (!publishedSlugs().has(linked)) {
                return json(res, 400, { error: 'no piece has that slug' })
              }
              clean[PIECE_FIELD] = linked
            }

            const all = readJson(root, DETAILS_FILE)
            /* Empty details get DELETED instead of staying as an
               object with nothing in it: if you empty the fields, the
               file ends up as if you had never written them. */
            if (Object.keys(clean).length) all[clipPath] = clean
            else delete all[clipPath]

            try {
              writeJson(root, DETAILS_FILE, all)
            } catch (e) {
              return json(res, 500, { error: String(e?.message ?? e) })
            }
            return json(res, 200, { ok: true, details: all[clipPath] ?? null })
          })
          return
        }

        /* ─── RENAME ───
           The path NEVER comes from the client: the clip is looked up
           in the index and the one the server already knows is used.
           The client only brings a name, and that name cannot carry
           separators, or start with a dot, or change the extension.

           It does not overwrite: if one like that already exists, it
           returns 409 instead of writing over it. A rename that eats
           another file is exactly the class of error there is no
           coming back from. */
        if (req.method === 'PUT' && (req.url || '').split('?')[0] === '/__rename') {
          if (!root) return json(res, 409, { error: reason })
          let body = ''
          req.setEncoding('utf8')
          req.on('data', (c) => {
            body += c
            if (body.length > 8 * 1024) req.destroy()
          })
          req.on('end', () => {
            let d
            try {
              d = JSON.parse(body)
            } catch {
              return json(res, 400, { error: 'invalid json' })
            }
            const clipPath = typeof d?.path === 'string' ? d.path : ''
            const clip = walk(root).find((c) => c.path === clipPath)
            if (!clip) return json(res, 404, { error: 'that clip is not in the vault' })

            const base = safeBaseName(d?.name)
            if (!base) return json(res, 400, { error: 'name not allowed' })

            const from = inside(root, path.join(root, clipPath))
            if (!from) return json(res, 404, { error: 'that clip is not in the vault' })
            const folder = path.dirname(from)
            const to = path.join(folder, base + path.extname(clipPath))
            if (path.dirname(to) !== folder) return json(res, 400, { error: 'name not allowed' })
            if (to === from) return json(res, 200, { ok: true, path: clipPath })
            if (fs.existsSync(to)) return json(res, 409, { error: 'there is already one with that name' })

            try {
              fs.renameSync(from, to)
            } catch (e) {
              return json(res, 500, { error: String(e?.message ?? e) })
            }

            /* THE DETAILS TRAVEL WITH THE FILE. They are indexed by
               path, so without this renaming deleted what you had
               written. */
            const newPath = path.relative(root, to).split(path.sep).join('/')
            const all = readJson(root, DETAILS_FILE)
            if (all[clipPath]) {
              all[newPath] = all[clipPath]
              delete all[clipPath]
              try {
                writeJson(root, DETAILS_FILE, all)
              } catch {
                /* the file is already renamed; the details come back on
                   their own the next time you write them */
              }
            }
            return json(res, 200, { ok: true, path: newPath })
          })
          return
        }

        /* ─── TO THE TRASH ───
           It MOVES, it does not delete. An unlink from a studio app is
           irreversible and there is no undo to save it; the trash is
           what Finder does and it lets you get it back. It costs more
           code and it is worth it.

           If the trash is not where it is expected, another system, or
           the vault on another volume, which makes the rename fail
           with EXDEV, the error is returned instead of falling back to
           deleting for real. Failing beats deleting something you
           cannot get back. */
        /* CREATE A SKETCH. It does not need `root`: a sketch is code
           from the repo and has nothing to do with your folder of
           clips, so one can be written with the vault disconnected.
           See SKETCHES_DIR. */
        if (req.method === 'POST' && (req.url || '').split('?')[0] === '/__sketch') {
          const q = new URLSearchParams((req.url || '').split('?')[1] ?? '')
          const ref = sketchRefOf(q.get('name'))
          if (!ref) return json(res, 400, { error: 'name not allowed' })

          const target = path.join(SKETCHES_DIR, ref + '.tsx')
          try {
            fs.mkdirSync(SKETCHES_DIR, { recursive: true })
            /* 'wx' fails if it exists, and that is the whole guard: the
               check and the write are the same operation, so there is
               no window between "it is not there" and "I write it". */
            fs.writeFileSync(target, sketchTemplate(ref), { flag: 'wx' })
          } catch (e) {
            if (e?.code === 'EEXIST') return json(res, 409, { error: 'already exists', ref })
            return json(res, 500, { error: String(e?.message ?? e) })
          }
          return json(res, 200, { ok: true, ref })
        }

        /* PUBLISH A FRAME AS A PIECE. The reason and the two writes are
           above, in the PIECES_PUBLIC_DIR block. Two branches by the
           frame's kind: `sketch` publishes Web, anything else is a clip
           from the vault and publishes App. */
        if (req.method === 'POST' && (req.url || '').split('?')[0] === '/__publish') {
          let body = ''
          req.setEncoding('utf8')
          req.on('data', (c) => {
            body += c
            if (body.length > 8 * 1024) req.destroy()
          })
          req.on('end', () => {
            let d
            try {
              d = JSON.parse(body)
            } catch {
              return json(res, 400, { error: 'invalid json' })
            }

            const name = String(d?.name ?? '').trim()
            const desc = String(d?.desc ?? '').trim()
            if (!name || name.length > 80) return json(res, 400, { error: 'name not allowed' })
            if (desc.length > 200) return json(res, 400, { error: 'description too long' })
            const pieceSlug = slug(name)
            if (!pieceSlug) return json(res, 400, { error: 'that name cannot make a URL' })

            /* With the origin resolved, the two branches end the same
               way: copy with EXCL, write it down in pieces.ts, and
               undo the copy if the entry did not go in. The Web piece
               also carries its `index.tsx`, the `companion`, and
               undoing means deleting both and the folder created for
               them. */
            const publish = (sourcePath, target, platform, video, companion, linkFrom) => {
              try {
                fs.mkdirSync(path.dirname(target), { recursive: true })
                /* COPYFILE_EXCL: check and copy in a single operation,
                   same as the 'wx' of the sketches. */
                fs.copyFileSync(sourcePath, target, fs.constants.COPYFILE_EXCL)
              } catch (e) {
                if (e?.code === 'EEXIST')
                  return json(res, 409, { error: 'a piece is already published at that URL' })
                return json(res, 500, { error: String(e?.message ?? e) })
              }
              const undo = () => {
                try {
                  fs.unlinkSync(target)
                } catch {}
                if (!companion) return
                try {
                  fs.unlinkSync(companion.path)
                } catch {}
                try {
                  fs.rmdirSync(path.dirname(target))
                } catch {}
              }
              if (companion) {
                try {
                  fs.writeFileSync(companion.path, companion.content, { flag: 'wx' })
                } catch (e) {
                  undo()
                  return json(res, 500, { error: String(e?.message ?? e) })
                }
              }
              try {
                const r = addPiece(name, pieceSlug, desc, platform, video)
                if (r.error) {
                  undo()
                  return json(res, 409, { error: r.error })
                }
              } catch (e) {
                undo()
                return json(res, 500, { error: String(e?.message ?? e) })
              }
              /* THE LINK BACK, WRITTEN HERE AND NOT ASKED FOR LATER.
                 The piece is already published, so a link that could
                 not be written does not undo any of it: it comes back
                 as `linked: false` with its reason, and the details
                 panel still lets you pick the piece by hand. What it
                 does not do is fail quietly. */
              const failed = linkFrom ? linkClipToPiece(root, linkFrom, pieceSlug) : null
              return json(res, 200, {
                ok: true,
                slug: pieceSlug,
                ...(linkFrom ? { linked: !failed, ...(failed ? { linkError: failed } : {}) } : {}),
              })
            }

            /* ─── A SKETCH → WEB PIECE ───
               It does not need the vault: the file lives in the repo.
               The ref goes through the same alphabet it was created
               with, so there is no path to build out of the folder. */
            if (d?.kind === 'sketch') {
              const ref = sketchRefOf(d?.ref)
              if (!ref) return json(res, 400, { error: 'ref not allowed' })
              const sourcePath = path.join(SKETCHES_DIR, ref + '.tsx')
              if (!fs.existsSync(sourcePath)) return json(res, 404, { error: 'does not exist' })
              const folder = path.join(PIECES_SRC_DIR, pieceSlug)
              return publish(sourcePath, path.join(folder, pieceSlug + '.tsx'), 'Web', null, {
                path: path.join(folder, 'index.tsx'),
                content: `export { default } from './${pieceSlug}'\n`,
              })
            }

            /* ─── A CLIP → APP PIECE ─── */
            if (!root) return json(res, 409, { error: reason })
            const sourcePath = inside(root, path.join(root, String(d?.path ?? '')))
            if (!sourcePath) return json(res, 404, { error: 'does not exist' })
            const ext = path.extname(sourcePath).toLowerCase()
            if (!VIDEO.has(ext))
              return json(res, 400, { error: 'an App piece is shown with a recording' })
            /* The clip's path is the key of its details, so the last
               argument is what ties the two ends together. A sketch
               does not pass it: it was written in the repo and there is
               no reference behind it. */
            return publish(
              sourcePath,
              path.join(PIECES_PUBLIC_DIR, pieceSlug + ext),
              'App',
              `/pieces/${pieceSlug}${ext}`,
              null,
              String(d?.path ?? ''),
            )
          })
          return
        }

        if (req.method === 'POST' && (req.url || '').split('?')[0] === '/__trash') {
          if (!root) return json(res, 409, { error: reason })
          let body = ''
          req.setEncoding('utf8')
          req.on('data', (c) => {
            body += c
            if (body.length > 8 * 1024) req.destroy()
          })
          req.on('end', () => {
            let d
            try {
              d = JSON.parse(body)
            } catch {
              return json(res, 400, { error: 'invalid json' })
            }
            const clipPath = typeof d?.path === 'string' ? d.path : ''
            if (!walk(root).some((c) => c.path === clipPath)) {
              return json(res, 404, { error: 'that clip is not in the vault' })
            }
            const from = inside(root, path.join(root, clipPath))
            if (!from) return json(res, 404, { error: 'that clip is not in the vault' })

            const trash = path.join(os.homedir(), '.Trash')
            let stat
            try {
              stat = fs.statSync(trash)
            } catch {
              return json(res, 501, { error: 'there is no trash on this system' })
            }
            if (!stat.isDirectory()) return json(res, 501, { error: 'there is no trash on this system' })

            const name = freeName(trash, path.basename(from))
            if (!name) return json(res, 409, { error: 'too many with that name in the trash' })
            try {
              fs.renameSync(from, path.join(trash, name))
            } catch (e) {
              return json(res, 500, { error: String(e?.message ?? e) })
            }

            const all = readJson(root, DETAILS_FILE)
            if (all[clipPath]) {
              delete all[clipPath]
              try {
                writeJson(root, DETAILS_FILE, all)
              } catch {}
            }
            return json(res, 200, { ok: true, to: name })
          })
          return
        }

        if (req.method !== 'GET' && req.method !== 'HEAD') return next()

        let requested
        try {
          requested = decodeURIComponent((req.url || '/').split('?')[0])
        } catch {
          return json(res, 400, { error: 'badly encoded path' })
        }

        /* The index: what is in the vault, and whether the vault
           exists. */
        /* It is sanitized ON READ as well and not only on write: the
           file can be edited by hand, and a broken value in there must
           not be able to break the canvas. */
        if (requested === '/__views') {
          if (!root) return json(res, 200, { connected: false, reason, views: [] })
          const stored = viewsFromDisk(readJson(root, VIEWS_FILE)?.vistas)
          return json(res, 200, { connected: true, views: sanitizeViews(stored) })
        }

        if (requested === '/__index') {
          if (!root) return json(res, 200, { connected: false, reason, clips: [] })
          const allDetails = readJson(root, DETAILS_FILE)
          const clips = walk(root).map((c) => ({ ...c, details: allDetails[c.path] ?? null }))
          return json(res, 200, { connected: true, folder: root, clips })
        }

        /* ─── THE TITLE AND THE ICON OF A LINK ───
           The whole reason is in link-card.mjs. There are only two
           routing decisions here:

           IT GOES BEFORE THE `root` CUTOFF because it is the only path
           in the bridge that does NOT touch the vault. A note with a
           link has to be readable with VAULT_DIR disconnected: the
           link is not a file of yours.

           AND IT DOES NOT VALIDATE THE URL HERE. linkCardOf validates
           it, since it is the one that goes out to fetch it. Two
           validations of the same thing in two files come apart on
           their own. */
        if (requested === '/__link') {
          const url = new URLSearchParams((req.url || '').split('?')[1] ?? '').get('url')
          if (!url) return json(res, 400, { error: 'url missing' })
          linkCardOf(url).then(
            (card) => json(res, 200, card),
            (e) => json(res, 500, { error: String(e?.message ?? e) }),
          )
          return
        }

        if (!root) return json(res, 404, { error: reason })

        const rel = requested.replace(/^\/+/, '')
        if (!rel) return json(res, 404, { error: 'no path' })
        if (rel.split('/').some(isHidden)) return json(res, 404, { error: 'no' })

        const ext = path.extname(rel).toLowerCase()
        const contentType = MEDIA_TYPES[ext]
        /* The allowlist decides BEFORE touching the disk. A .md never
           even gets to exist for this server. */
        if (!contentType) return json(res, 404, { error: 'extension not served' })

        const abs = inside(root, path.resolve(root, rel))
        if (!abs) return json(res, 404, { error: 'outside the vault, or it does not exist' })

        let stats
        try {
          stats = fs.statSync(abs)
        } catch {
          return json(res, 404, { error: 'does not exist' })
        }
        if (!stats.isFile()) return json(res, 404, { error: 'not a file' })

        res.setHeader('content-type', contentType)
        res.setHeader('accept-ranges', 'bytes')
        res.setHeader('last-modified', stats.mtime.toUTCString())
        /* no-store and not an ETag: in this vault the files get
           REPLACED, you re-record the clip and you want to see the new
           one, and on localhost asking for it again costs nothing. A
           cache here could only make you look at the old version
           without noticing. */
        res.setHeader('cache-control', 'no-store')

        const r = parseRange(req.headers.range, stats.size)
        if (r === 'unsatisfiable') {
          res.statusCode = 416
          res.setHeader('content-range', `bytes */${stats.size}`)
          return res.end()
        }

        if (r) {
          res.statusCode = 206
          res.setHeader('content-range', `bytes ${r.start}-${r.end}/${stats.size}`)
          res.setHeader('content-length', r.end - r.start + 1)
        } else {
          res.statusCode = 200
          res.setHeader('content-length', stats.size)
        }

        if (req.method === 'HEAD') return res.end()
        const stream = r
          ? fs.createReadStream(abs, { start: r.start, end: r.end })
          : fs.createReadStream(abs)
        stream.on('error', () => res.destroy())
        res.on('close', () => stream.destroy())
        stream.pipe(res)
      })
    },
  }
}
