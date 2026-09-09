/* LOS VIDEOS DE UNA PIEZA PARA X.
 *
 *     node scripts/render.mjs HoldToCommit hold-to-commit --modos=oscuro,claro
 *     node scripts/render.mjs SwipeableTabs swipeable-tabs
 *
 * CADA VIDEO SALE DOS VECES, sobre fondo claro y sobre fondo oscuro
 * (regla del usuario, 2026-09-04: "a cada video hay que hacerle dos
 * fondos, uno para light mode y uno para dark mode").
 *
 * Y DESDE HOLD TO COMMIT, ADEMÁS, UNA VEZ POR APARIENCIA DE LA APP.
 * Swipeable tabs se grabó en una sola; esta pieza cambia de verdad con
 * el modo del sistema —en claro la píldora pierde el brillo teal que
 * tiene en oscuro— así que hay dos grabaciones y el producto son cuatro
 * archivos: <slug>-<apariencia de la app>-<fondo>.mp4. Los nombres
 * dicen las dos cosas porque las dos se eligen por separado: una app en
 * claro sobre fondo oscuro es una combinación legítima y hay que poder
 * pedirla.
 *
 * El fondo oscuro no está medido (ninguna referencia del vault está
 * sobre fondo oscuro): es el neutro medido bajado al 11 % con el mismo
 * tinte. El recibo está en `parametros.ts`, FONDO_OSCURO. */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = fileURLToPath(new URL('../', import.meta.url))
const OUT = path.join(AQUI, 'out')
fs.mkdirSync(OUT, { recursive: true })

const [composicion, slug] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!composicion || !slug) {
  console.error('Uso: node scripts/render.mjs <Composicion> <slug> [--modos=oscuro,claro]')
  process.exit(1)
}
const opciones = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, ...v] = a.slice(2).split('=')
    return [k, v.length ? v.join('=') : 'true']
  }),
)
/* Sin `--modos`, la pieza tiene una sola grabación y el clip es el que
   trae la composición por defecto. */
const modos = opciones.modos ? opciones.modos.split(',') : [null]

/* Los dos fondos. El claro es el medido en la referencia; el oscuro, el
   mismo neutro al 11 % (FONDO_OSCURO en parametros.ts, que no se puede
   importar desde acá sin compilar TypeScript: si cambia allá, cambia
   acá, y por eso el valor va con su nombre al lado). */
const FONDOS = [
  { nombre: 'claro', color: '#EBE6E8' },
  { nombre: 'oscuro', color: '#1C181A' },
]

for (const modo of modos) {
  for (const fondo of FONDOS) {
    const partes = [slug, modo, fondo.nombre].filter(Boolean)
    const archivo = `out/${partes.join('-')}.mp4`
    const props = { fondo: fondo.color }
    if (modo) props.clip = `${slug}-${modo}.mp4`
    const etiqueta = modo ? `app ${modo} sobre fondo ${fondo.nombre}` : `fondo ${fondo.nombre}`
    console.log(`→ ${archivo}   (${etiqueta})`)
    execFileSync('npx', ['remotion', 'render', composicion, archivo, '--crf=17', `--props=${JSON.stringify(props)}`, '--log=error'], {
      cwd: AQUI,
      stdio: 'inherit',
    })
  }
}

for (const f of fs.readdirSync(OUT).filter((f) => f.startsWith(slug) && f.endsWith('.mp4')).sort()) {
  const mb = (fs.statSync(path.join(OUT, f)).size / 1024 / 1024).toFixed(1)
  console.log(`   ${f}  ${mb} MB`)
}
console.log('listo')
