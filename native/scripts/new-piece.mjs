/* NUEVA PIEZA — el equivalente nativo de "New sketch" del playground.
 *
 *   pnpm nueva "Swipe to pay"
 *
 * Crea src/components/pieces/<slug>/ con dos archivos y nada más:
 * `<slug>-screen.tsx`, la pantalla, e `index.tsx`, que la exporta por
 * defecto. Es la forma de components/animations/<slug>/ en
 * react-native-motion. El registro (`src/components/pieces/registry.ts`)
 * la levanta solo porque se deriva de las carpetas, así que no hay
 * ninguna lista ni ninguna ruta que tocar: la ruta es una para todas
 * (`src/app/[slug].tsx`).
 *
 * EL SLUG ES LA MISMA CUENTA QUE EL REPO WEB —minúsculas, todo lo que
 * no es alfanumérico a guión— y eso importa de verdad: la carpeta acá,
 * la URL de la pieza publicada y el nombre del archivo de la grabación
 * son EL MISMO string. Si divergieran, la pieza en la exhibition no
 * apuntaría a su propio taller. Se asigna acá UNA vez: si el título
 * cambia después en la exhibition, la carpeta no se renombra (ver
 * `slug` en `src/pieces.ts` del repo web).
 *
 * No pide confirmación y no pisa nada: si la carpeta existe, avisa y
 * corta.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PIEZAS = fileURLToPath(new URL('../src/components/pieces/', import.meta.url))

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const aIdentificador = (s) =>
  s
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

const crudo = process.argv.slice(2).join(' ').trim()
if (!crudo) {
  console.error('Falta el nombre.  pnpm nueva "Swipe to pay"')
  process.exit(1)
}

const s = slug(crudo)
if (!s) {
  console.error(`Con "${crudo}" no se puede armar un slug.`)
  process.exit(1)
}

const carpeta = path.join(PIEZAS, s)
if (fs.existsSync(carpeta)) {
  console.error(`Ya existe src/components/pieces/${s}/ — elegí otro nombre o editá esa.`)
  process.exit(1)
}

const Id = aIdentificador(s)

/* LA PLANTILLA ES CASI NADA, igual que la del boceto web: lo que se
   abre tiene que ser una hoja en blanco con el mínimo para que corra,
   no un ejemplo que después hay que borrar.
   `flex: 1` porque la pieza ocupa la pantalla entera — no hay header,
   se va a grabar así. */
const pantalla = `import { StyleSheet, View } from 'react-native'

/* ${Id} — una pieza del taller.
 *
 * Ocupa la pantalla entera y sin header, porque así se graba. Para
 * volver al índice, swipe desde el borde izquierdo.
 *
 * La carpeta tiene la forma de components/animations/<slug>/ de
 * react-native-motion: \`index.tsx\` exporta esta pantalla por defecto
 * y el registro (\`../registry.ts\`) la levanta solo. El mecanismo va en
 * \`${s}.tsx\` al lado cuando lo haya, y lo demás —los valores con su
 * recibo, el tema, los datos— en archivos por responsabilidad.
 *
 * A mano: reanimated, gesture-handler, skia y expo-haptics ya están
 * instalados. Cuando esté lista:
 *
 *   pnpm grabar ${s}
 */
export function ${Id}Screen() {
  return <View style={css.pieza} />
}

const css = StyleSheet.create({
  pieza: { flex: 1, backgroundColor: '#fff' },
})
`

const indice = `export { ${Id}Screen as default } from './${s}-screen'\n`

fs.mkdirSync(carpeta, { recursive: true })
fs.writeFileSync(path.join(carpeta, `${s}-screen.tsx`), pantalla)
fs.writeFileSync(path.join(carpeta, 'index.tsx'), indice)

console.log(`src/components/pieces/${s}/${s}-screen.tsx`)
console.log(`Abrila en el simulador: la ruta es /${s}`)
