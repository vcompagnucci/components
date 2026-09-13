/* NEW PIECE: the native equivalent of the playground's "New sketch".
 *
 *   pnpm new "Swipe to pay"
 *
 * Creates src/components/pieces/<slug>/ with two files and nothing
 * else: `<slug>-screen.tsx`, the screen, and `index.tsx`, which exports
 * it by default. It is the shape of components/animations/<slug>/ in
 * react-native-motion. The registry
 * (`src/components/pieces/registry.ts`) picks it up on its own because
 * it is derived from the folders, so there is no list and no route to
 * touch: the route is one for all of them (`src/app/[slug].tsx`).
 *
 * THE SLUG IS THE SAME ARITHMETIC AS THE WEB REPO (lowercase,
 * everything that is not alphanumeric turned into a hyphen) and that
 * matters for real: the folder here, the URL of the published piece and
 * the name of the recording's file are THE SAME string. If they
 * diverged, the piece in the exhibition would not point at its own
 * workshop. It is assigned here ONCE: if the title changes later in the
 * exhibition, the folder is not renamed (see `slug` in `src/pieces.ts`
 * of the web repo).
 *
 * It asks for no confirmation and overwrites nothing: if the folder
 * exists, it says so and stops.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PIECES_DIR = fileURLToPath(new URL('../src/components/pieces/', import.meta.url))

/* The same three operations as `slug()` in `src/pieces.ts`, and nothing
   else: a `.mjs` script cannot import that module, so the computation is
   duplicated and has to stay identical. An accent-folding
   `.normalize('NFD')` lived here and the canonical one does not have
   one, so `Café menu` came out `cafe-menu` here and `caf-menu` there. */
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const toIdentifier = (s) =>
  s
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

const raw = process.argv.slice(2).join(' ').trim()
if (!raw) {
  console.error('The name is missing.  pnpm new "Swipe to pay"')
  process.exit(1)
}

const s = slug(raw)
if (!s) {
  console.error(`"${raw}" cannot be turned into a slug.`)
  process.exit(1)
}

const folder = path.join(PIECES_DIR, s)
if (fs.existsSync(folder)) {
  console.error(`src/components/pieces/${s}/ already exists. Pick another name, or edit that one.`)
  process.exit(1)
}

const Id = toIdentifier(s)

/* THE TEMPLATE IS ALMOST NOTHING, the same as the one for a web sketch:
   what opens has to be a blank sheet with the minimum for it to run,
   not an example you then have to delete.
   `flex: 1` because the piece takes the whole screen. There is no
   header, it is going to be recorded like that. */
const screen = `import { StyleSheet, View } from 'react-native'

/* ${Id}: a piece of the workshop.
 *
 * It takes the whole screen and has no header, because that is how it
 * gets recorded. To go back to the index, swipe from the left edge.
 *
 * The folder has the shape of components/animations/<slug>/ in
 * react-native-motion: \`index.tsx\` exports this screen by default and
 * the registry (\`../registry.ts\`) picks it up on its own. The
 * mechanism goes in \`${s}.tsx\` next to it when there is one, and
 * the rest (the values with their receipts, the theme, the data) in
 * files by responsibility.
 *
 * On hand: reanimated, gesture-handler, skia and expo-haptics are
 * already installed. When it is ready:
 *
 *   pnpm record ${s}
 */
export function ${Id}Screen() {
  return <View style={css.piece} />
}

const css = StyleSheet.create({
  piece: { flex: 1, backgroundColor: '#fff' },
})
`

const index = `export { ${Id}Screen as default } from './${s}-screen'\n`

fs.mkdirSync(folder, { recursive: true })
fs.writeFileSync(path.join(folder, `${s}-screen.tsx`), screen)
fs.writeFileSync(path.join(folder, 'index.tsx'), index)

console.log(`src/components/pieces/${s}/${s}-screen.tsx`)
console.log(`Open it in the simulator: the route is /${s}`)
