/* GRABAR — el último paso del taller nativo, y el primero del vault.
 *
 *   pnpm grabar swipe-to-pay        → el clip cae en VAULT_DIR/native/
 *   pnpm grabar swipe-to-pay --sucia  → sin tocar la barra de estado
 *
 * Corta con ⌃C o Enter, y ahí escribe el archivo.
 *
 * ─── POR QUÉ ESCRIBE DIRECTO AL VAULT ───
 * El puente del repo web deriva TODO del archivo: el nombre sale del
 * nombre, native/web de la subcarpeta, la fecha del filesystem. Grabando
 * ahí adentro no hay ningún paso de importar: parás la grabación y el
 * clip ya está en la grilla de /vault. Esa es toda la integración, y es
 * la que hace que el taller y la exposición sean un solo recorrido.
 *
 * VAULT_DIR sale del .env.local DE LA RAÍZ, el mismo que lee Vite. Una
 * segunda copia de esa ruta sería una segunda verdad sobre dónde viven
 * tus clips.
 *
 * ─── LOS DOS FLAGS QUE IMPORTAN ───
 *
 * --codec h264 · el default de simctl es HEVC, y un .mov HEVC puede no
 *   reproducirse en el <video> de la exposición. Es la trampa más cara
 *   de todo este camino porque no falla al grabar: falla después, en la
 *   pieza publicada.
 *
 * status_bar override · la barra de un simulador muestra la hora real y
 *   una señal cualquiera. Se la clava en 9:41 —la hora de Apple en todas
 *   sus capturas desde 2007— con batería llena y señal completa, así dos
 *   grabaciones de días distintos se ven iguales. Se revierte al salir.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))

/* El .env.local de la raíz, leído a mano: son dos líneas y traer un
   parser de dotenv para esto sería una dependencia por nada. */
function vaultDir() {
  const archivo = path.join(RAIZ, '.env.local')
  if (!fs.existsSync(archivo)) return null
  for (const linea of fs.readFileSync(archivo, 'utf8').split('\n')) {
    const m = linea.match(/^\s*VAULT_DIR\s*=\s*(.*)\s*$/)
    if (m) return m[1].replace(/^["']|["']$/g, '').trim()
  }
  return null
}

const args = process.argv.slice(2)
const limpiar = !args.includes('--sucia')
const nombre = args.filter((a) => !a.startsWith('--')).join(' ').trim()

if (!nombre) {
  console.error('Falta el nombre.  pnpm grabar swipe-to-pay')
  process.exit(1)
}

const vault = vaultDir()
if (!vault) {
  console.error('No hay VAULT_DIR en el .env.local de la raíz.')
  process.exit(1)
}

/* native/ y no web/: lo que sale de acá es, por definición, una pieza
   que corre en un teléfono. El puente acepta las dos ortografías, así
   que se usa la carpeta que YA tengas. */
const carpeta = ['native', 'nativo']
  .map((c) => path.join(vault, c))
  .find((c) => fs.existsSync(c)) ?? path.join(vault, 'native')
fs.mkdirSync(carpeta, { recursive: true })

const destino = path.join(carpeta, nombre.replace(/\.(mov|mp4)$/i, '') + '.mp4')
if (fs.existsSync(destino)) {
  console.error(`Ya existe ${destino} — el vault no pisa nada, elegí otro nombre.`)
  process.exit(1)
}

const simctl = (...a) => execFileSync('xcrun', ['simctl', ...a], { stdio: 'pipe' })

/* Que haya un simulador prendido es condición, no algo que este script
   deba resolver: cuál arrancar es una decisión tuya. */
try {
  const prendidos = simctl('list', 'devices', 'booted').toString()
  if (!/\(Booted\)/.test(prendidos)) {
    console.error('No hay ningún simulador prendido.  xcrun simctl boot "iPhone 17 Pro"')
    process.exit(1)
  }
} catch (e) {
  console.error('No se pudo hablar con simctl:', e.message)
  process.exit(1)
}

if (limpiar) {
  try {
    simctl('status_bar', 'booted', 'override',
      '--time', '9:41',
      '--batteryState', 'charged', '--batteryLevel', '100',
      '--cellularMode', 'active', '--cellularBars', '4',
      '--wifiMode', 'active', '--wifiBars', '3')
  } catch (e) {
    console.error('No se pudo limpiar la barra (sigo igual):', e.message)
  }
}

const restaurar = () => {
  if (!limpiar) return
  try {
    simctl('status_bar', 'booted', 'clear')
  } catch {}
}

console.log(`Grabando → ${destino}`)
console.log('Enter o ⌃C para cortar.')

const grabacion = spawn(
  'xcrun',
  ['simctl', 'io', 'booted', 'recordVideo', '--codec', 'h264', '--force', destino],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)

/* CORTAR ES UN SIGINT AL PROCESO DE simctl, no matarlo: recordVideo
   escribe el índice del contenedor recién al recibirlo. Con SIGKILL el
   archivo queda escrito y CORRUPTO — pesa lo que pesa y no abre. */
let cortando = false
const cortar = () => {
  if (cortando) return
  cortando = true
  grabacion.kill('SIGINT')
}

process.stdin.resume()
process.stdin.once('data', cortar)
process.on('SIGINT', cortar)

grabacion.on('close', () => {
  restaurar()
  process.stdin.pause()
  if (fs.existsSync(destino)) {
    const mb = (fs.statSync(destino).size / 1024 / 1024).toFixed(1)
    console.log(`\nListo — ${mb} MB.  Ya está en la grilla de /vault.`)
  } else {
    console.log('\nNo quedó ningún archivo.')
  }
})
