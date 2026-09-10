/* DOES ANY COMMENT NAME SOMETHING THAT NO LONGER EXISTS?
 *
 *     pnpm references          # report; exits with 1 if something is dead
 *     pnpm references --all    # also what was never from here
 *
 * ─── WHY IT EXISTS ───
 * This repo writes the why at the top of every file and in the log, and
 * those texts NAME things: `measurements.ts`, `HOLD.duration`,
 * `css.shadow`. When something is deleted or renamed the code stops
 * compiling and the comment does NOT: it stays there explaining
 * something that no longer happens. It is the way this repo breaks, and
 * no other tool sees it: the typecheck does not read comments and the
 * linter does not either. On 2026-09-09 there were nine in one day, two
 * receipts left behind by a rename and seven that survived the deletion
 * of the ring.
 *
 * ─── WHY "IT IS NOT DEFINED" IS NOT ENOUGH ───
 * Done that way, the first attempt flagged 426 references and almost all
 * of them were legitimate: the repo names placeholders
 * (`src/notes/<slug>.tsx`), browser APIs (`getComputedStyle`), keys
 * (`Escape`) and CSS classes of the sites it MEASURES (`Toolbar_chip`
 * belongs to someone else's reference). "It is not here" does not tell
 * the dead apart from what was never ours.
 *
 * ─── THE TWO DISCRIMINATORS, AND NO LIST OF EXCEPTIONS ───
 * 1. HISTORY. What gets flagged is what this repo HAD: a file, if it
 *    shows up among the deletions of `git log --diff-filter=D`; a name,
 *    if there was ever a definition of it. The index of names comes out
 *    of a single `git log -p` over the whole history (~11 s, 2,600
 *    names); asking git name by name with `-G` took 31 s EACH.
 * 2. RESEMBLANCE. A name that never existed but that, lowercased and
 *    stripped of underscores, matches one that does exist today, is a
 *    misspelled reference and not something foreign: it said WHITE_VEIL
 *    where the live name is `COMMIT.whiteVeil`. Without this rule, a
 *    name that was ALWAYS wrong is found by nobody.
 *
 *    (And that example goes without backticks on purpose: the convention
 *    this script imposes is that a backtick PROMISES the thing exists.
 *    Naming something dead is done in prose. Without that, the script
 *    flagged itself for quoting the mistake it had found.)
 *
 * ─── WHAT IT CATCHES, TESTED ───
 * With three dead references injected on purpose it finds two: a deleted
 * file and a name that existed. It does NOT find the third,
 * `HOLD_DURATION` for `HOLD.duration`, a dotted path written with
 * underscores, and the rule was not added because catching it would mean
 * accepting as suspect any NAME_LIKE_THIS whose two halves exist
 * separately, and in this repo there are many of those.
 *
 * And it does not see, by definition, a comment that describes BADLY
 * something that does exist. For that you have to read. */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const ALL = process.argv.includes('--all')
const git = (...a) => execFileSync('git', a, { cwd: ROOT, maxBuffer: 1 << 28 }).toString()

const tracked = git('ls-files').trim().split('\n')
/* To read: text only. To RESOLVE a reference: all of them, or a
   `media/purchase.wav` does not find itself. */
const files = tracked.filter((f) => /\.(ts|tsx|mjs|js|md|css|swift|py|sh)$/.test(f))
const contents = new Map(files.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]))

/* The measurement files live in `.context/`, which is gitignored: the
   log names them all the same and they do exist on the machine. */
const inContext = new Set()
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.git')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else inContext.add(e.name)
  }
}
if (fs.existsSync(path.join(ROOT, '.context'))) walk(path.join(ROOT, '.context'))

const deleted = git('log', '--all', '--diff-filter=D', '--name-only', '--format=').split('\n').filter(Boolean)

/* ── THE TWO INDEXES OF NAMES ── */
const DEFINITION = '((export[[:space:]]+)?(const|let|var|function|type|interface|class)[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*)|(^[-+]?[[:space:]]*[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*:)'
const NAME_ONLY = "grep -oE '[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*:?$' | tr -d ' :' | sort -u"
const sh = (cmd) => execSync(cmd, { cwd: ROOT, maxBuffer: 1 << 28, shell: '/bin/bash' }).toString().trim().split('\n').filter(Boolean)

const definedToday = new Set(sh(`git ls-files -z | xargs -0 grep -hoE '${DEFINITION}' 2>/dev/null | ${NAME_ONLY}`))

/* One single pass over the history, CACHED by commit: it is the
   expensive step (~11 s) and without a cache the fix-and-run-again loop
   costs two minutes per round. */
const CACHE = path.join(ROOT, '.context/references-history.txt')
/* The stamp is HEAD and NOTHING ELSE. The first version added
   `git rev-list --all --count`, and with several worktrees in parallel
   that changes every time another branch commits: the cache was never
   used. The index is built from `--all`, so a branch that is not yours
   can add names to it; the price of not seeing them until HEAD moves is
   that a reference that just died ON ANOTHER BRANCH is not detected
   here, which is exactly where it does not matter. */
const stamp = git('rev-parse', 'HEAD').trim()
let definedEver
if (fs.existsSync(CACHE) && fs.readFileSync(CACHE, 'utf8').split('\n')[0] === stamp) {
  definedEver = new Set(fs.readFileSync(CACHE, 'utf8').split('\n').slice(1).filter(Boolean))
} else {
  definedEver = new Set(sh(
    `git log --all --format= -U0 -p -- '*.ts' '*.tsx' '*.mjs' '*.js' '*.md' '*.css' '*.swift' 2>/dev/null` +
    ` | grep -E '^[-+]' | grep -oE '${DEFINITION}' | ${NAME_ONLY}`,
  ))
  fs.mkdirSync(path.dirname(CACHE), { recursive: true })
  fs.writeFileSync(CACHE, stamp + '\n' + [...definedEver].join('\n'))
}
/* For the second discriminator: the normalized form of what exists today. */
const normalizedToday = new Set([...definedToday].map((n) => n.toLowerCase().replace(/_/g, '')))

/* Does the name appear IN CODE, outside a backtick? A live name gets
   used; a dead one only gets mentioned. The `.md` files do not count:
   they are prose. */
const code = [...contents].filter(([f]) => /\.(ts|tsx|mjs|js|css|swift)$/.test(f))
  .map(([, s]) => s.replace(/`[^`\n]*`/g, ' ')).join('\n')
const isUsed = (n) => new RegExp(`\\b${n}\\b`).test(code)

const EXT = /\.(ts|tsx|mjs|js|md|css|swift|py|sh|json|png|wav|caf|mp4|mov|webm)$/
/* Neither a bare extension (`.tsx`) nor a mold (`src/notes/<slug>.tsx`)
   is a reference to a file. */
const isPlaceholder = (r) => /[<>*{}]/.test(r) || r.startsWith('.') && !r.includes('/')
const fileExists = (ref, fromDir) => {
  const clean = ref.replace(/^\.\//, '')
  const base = path.basename(clean)
  if (fs.existsSync(path.join(ROOT, clean)) || fs.existsSync(path.join(ROOT, fromDir, clean))) return true
  if (tracked.some((f) => f === clean || f.endsWith('/' + base))) return true
  return inContext.has(base)
}
/* WHAT IS LOOKED AT AND WHAT IS NOT, after reading the first 23
   findings. Our names are CONSTANTS IN CAPITALS, alone or heading a
   field (`HOLD.duration`, `COMMIT.whiteVeil`). That leaves out, without
   naming a single one, everything that gave a false positive: library
   APIs (`ReduceMotion.Never`, `props.fallback`), browser ones
   (`history.pushState`, `console.log`), DOM values (`BODY`), bundles
   (`Workshop.app`) and prose (`undefined.map`). Of a name with a dot
   only the first part is looked at: the second one almost always
   belongs to someone else. */
const firstSegment = (r) => r.replace(/\(\)$/, '').split('.')[0]
const isOurName = (r) =>
  !r.endsWith('()') && /^[A-Z][A-Z0-9_]{2,}$/.test(firstSegment(r)) && !firstSegment(r).endsWith('_')

const dead = []
const foreign = []
const unverified = []
for (const [f, src] of contents) {
  const dir = path.dirname(f)
  src.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/`([^`\n]{2,80})`/g)) {
      const ref = m[1].trim()
      const where = { file: f, line: i + 1, ref, text: l.trim().slice(0, 120) }
      if (EXT.test(ref) && !/\s/.test(ref) && !isPlaceholder(ref)) {
        if (fileExists(ref, dir)) continue
        const base = path.basename(ref)
        /* `.context/` is scratch on each machine and it is gitignored: a
           file from there not being here says nothing about the repo. */
        if (ref.startsWith('.context/')) { unverified.push({ ...where, kind: 'file' }); continue }
        const wasDeleted = deleted.some((b) => b === ref || b.endsWith('/' + base))
        ;(wasDeleted ? dead : foreign).push({ ...where, kind: 'file', reason: wasDeleted ? 'a commit deleted it' : 'never was here' })
      } else if (isOurName(ref)) {
        const n = firstSegment(ref)
        if (definedToday.has(n) || isUsed(n)) continue
        const existed = definedEver.has(n)
        /* The resemblance only counts with an underscore: it is the
           pattern of our constants, and without that condition `BODY`
           catches `body`. */
        const resembles = n.includes('_') && normalizedToday.has(n.toLowerCase().replace(/_/g, ''))
        if (existed) dead.push({ ...where, kind: 'name', reason: `${n} existed in this repo and does not any more` })
        else if (resembles) dead.push({ ...where, kind: 'name', reason: `${n} does not exist; something written another way does` })
        else foreign.push({ ...where, kind: 'name', reason: 'never was from here' })
      }
    }
  })
}

if (dead.length) {
  console.log(`DEAD (${dead.length}). The repo had these and does not any more:\n`)
  for (const hit of dead) console.log(`  ${hit.file}:${hit.line}  \`${hit.ref}\` · ${hit.reason}\n      ${hit.text}\n`)
} else {
  console.log('OK: no reference names something this repo has lost.')
}
if (ALL && foreign.length) {
  console.log(`\nFROM OUTSIDE (${foreign.length}). They never were here; almost always APIs, keys or measured code that belongs to someone else:\n`)
  for (const hit of foreign) console.log(`  ${hit.file}:${hit.line}  \`${hit.ref}\``)
}
if (unverified.length) {
  console.log(`\nUNVERIFIED (${unverified.length}). They point at \`.context/\`, which is scratch on each machine and does not travel: it can be on yours and not on another.`)
  if (ALL) for (const hit of unverified) console.log(`  ${hit.file}:${hit.line}  \`${hit.ref}\``)
}
console.log(`\n${files.length} files · ${definedToday.size} names today · ${definedEver.size} in the history · ${dead.length} dead · ${foreign.length} from outside · ${unverified.length} unverified${ALL ? '' : ' (--all)'}`)
process.exit(dead.length ? 1 : 0)
