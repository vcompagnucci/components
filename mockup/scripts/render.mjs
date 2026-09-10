/* THE VIDEOS OF A PIECE FOR X.
 *
 *     node scripts/render.mjs HoldToCommit hold-to-commit --modes=dark,light
 *     node scripts/render.mjs SwipeableTabs swipeable-tabs
 *
 * EVERY VIDEO COMES OUT TWICE, over a light background and over a dark
 * one (the user's rule, 2026-09-04: "every video needs two backgrounds,
 * one for light mode and one for dark mode").
 *
 * AND SINCE HOLD TO COMMIT, ALSO ONCE PER APPEARANCE OF THE APP.
 * Swipeable tabs was recorded in a single one; this piece really does
 * change with the mode of the system. In light the pill loses the teal
 * sheen it has in dark, so there are two recordings and the product is
 * four files: <slug>-<appearance of the app>-<background>.mp4. The names
 * say both things because both are chosen separately: an app in light
 * over a dark background is a legitimate combination and you have to be
 * able to ask for it.
 *
 * The dark background is not measured (no reference in the vault sits on
 * a dark background): it is the measured neutral taken down to 11 % with
 * the same tint. The receipt is in `parameters.ts`, DARK_BACKGROUND. */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const MOCKUP = fileURLToPath(new URL('../', import.meta.url))
const OUT = path.join(MOCKUP, 'out')
fs.mkdirSync(OUT, { recursive: true })

const [composition, slug] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!composition || !slug) {
  console.error('Usage: node scripts/render.mjs <Composition> <slug> [--modes=dark,light]')
  process.exit(1)
}
const options = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, ...v] = a.slice(2).split('=')
    return [k, v.length ? v.join('=') : 'true']
  }),
)
/* Without `--modes`, the piece has a single recording and the clip is
   the one the composition brings by default. */
const modes = options.modes ? options.modes.split(',') : [null]

/* The two backgrounds. The light one is the one measured on the
   reference; the dark one, the same neutral at 11 % (DARK_BACKGROUND in
   parameters.ts, which cannot be imported from here without compiling
   TypeScript: if it changes there, it changes here, and that is why the
   value travels with its name next to it). */
const BACKGROUNDS = [
  { name: 'light', color: '#EBE6E8' },
  { name: 'dark', color: '#1C181A' },
]

for (const mode of modes) {
  for (const background of BACKGROUNDS) {
    const parts = [slug, mode, background.name].filter(Boolean)
    const file = `out/${parts.join('-')}.mp4`
    const props = { background: background.color }
    if (mode) props.clip = `${slug}-${mode}.mp4`
    const label = mode ? `app in ${mode} over a ${background.name} background` : `${background.name} background`
    console.log(`→ ${file}   (${label})`)
    execFileSync('npx', ['remotion', 'render', composition, file, '--crf=17', `--props=${JSON.stringify(props)}`, '--log=error'], {
      cwd: MOCKUP,
      stdio: 'inherit',
    })
  }
}

for (const f of fs.readdirSync(OUT).filter((f) => f.startsWith(slug) && f.endsWith('.mp4')).sort()) {
  const mb = (fs.statSync(path.join(OUT, f)).size / 1024 / 1024).toFixed(1)
  console.log(`   ${f}  ${mb} MB`)
}
console.log('done')
