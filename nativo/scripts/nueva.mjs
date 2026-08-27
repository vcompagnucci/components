/* NUEVA PIEZA — el equivalente nativo de "New sketch" del playground.
 *
 *   pnpm nueva "Swipe to pay"
 *
 * Crea src/app/<slug>/index.tsx y nada más. El índice del taller la
 * levanta sola porque se deriva de las carpetas (ver src/app/index.tsx),
 * así que no hay ninguna lista que tocar.
 *
 * EL SLUG ES LA MISMA CUENTA QUE EL REPO WEB —minúsculas, todo lo que
 * no es alfanumérico a guión— y eso importa de verdad: la carpeta acá,
 * la URL de la pieza publicada y el nombre del archivo de la grabación
 * son EL MISMO string. Si divergieran, la pieza en la library no
 * apuntaría a su propio taller.
 *
 * No pide confirmación y no pisa nada: si la carpeta existe, avisa y
 * corta.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = fileURLToPath(new URL('../src/app/', import.meta.url))

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

const carpeta = path.join(APP, s)
if (fs.existsSync(carpeta)) {
  console.error(`Ya existe src/app/${s}/ — elegí otro nombre o editá esa.`)
  process.exit(1)
}

const Id = aIdentificador(s)

/* LA PLANTILLA ES CASI NADA, igual que la del boceto web: lo que se
   abre tiene que ser una hoja en blanco con el mínimo para que corra,
   no un ejemplo que después hay que borrar.
   `flex: 1` porque la pieza ocupa la pantalla entera — no hay header,
   se va a grabar así. */
const plantilla = `import { StyleSheet, View } from 'react-native'

/* ${aIdentificador(s)} — una pieza del taller.
 *
 * Ocupa la pantalla entera y sin header, porque así se graba. Para
 * volver al índice, swipe desde el borde izquierdo.
 *
 * A mano: reanimated, gesture-handler, skia y expo-haptics ya están
 * instalados. Cuando esté lista:
 *
 *   pnpm grabar ${s}
 */
export default function ${Id}() {
  return <View style={css.pieza} />
}

const css = StyleSheet.create({
  pieza: { flex: 1, backgroundColor: '#fff' },
})
`

fs.mkdirSync(carpeta, { recursive: true })
fs.writeFileSync(path.join(carpeta, 'index.tsx'), plantilla)

console.log(`src/app/${s}/index.tsx`)
console.log(`Abrila en el simulador: la ruta es /${s}`)
