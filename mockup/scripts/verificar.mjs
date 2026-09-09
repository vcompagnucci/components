/* ¿EL HUECO DEL BISEL QUEDA LLENO EN TODA LA CÁMARA? Renderiza doce
   cuadros con un rojo pleno en vez de la grabación y comprueba píxel
   por píxel, con la misma geometría que dibuja la composición, que
   todo el hueco muestra rojo: ni fondo ni sombra asomando por un
   borde. Existe porque en el pipeline anterior la pantalla quedó
   15×20 px corrida y en la esquina asomaba el fondo; en el cuadro
   entero no se veía, en un zoom sí ("mirá los bordes, no se fillean",
   2026-09-04). Cada capa se posiciona por su cuenta: un origen mal
   tomado no falla, se ve.

     pnpm verificar

   Sale con 1 si algún cuadro tiene el hueco sin llenar. */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

import { IPHONE_17, capas, encuadre } from '../src/geometria.ts'

const AQUI = fileURLToPath(new URL('../', import.meta.url))
const SALIDA = path.join(AQUI, 'out/verificacion')
fs.mkdirSync(SALIDA, { recursive: true })

const serveUrl = await bundle({ entryPoint: path.join(AQUI, 'src/index.ts') })
/* La composición se pasa por argumento desde la segunda pieza: cada una
   tiene su cámara, y la guarda de los bordes sólo vale si comprueba la
   cámara que se va a renderizar.  node scripts/verificar.mjs HoldToCommit */
const id = process.argv[2] ?? 'SwipeableTabs'
const inputProps = { pantalla: 'roja' }
const composicion = await selectComposition({ serveUrl, id, inputProps })
console.log(`composición: ${id}`)
const props = composicion.props
const L = composicion.width

/* Los cuadros: reposo, cuatro de la entrada, la meseta, cuatro de la
   salida y el reposo final, en segundos del clip. */
const cam = props.camara
const tiempos = [0.1, cam.espera + 0.15, cam.espera + 0.35, cam.espera + 0.55, cam.espera + cam.entra, cam.hasta - 0.5, cam.hasta + 0.07, cam.hasta + 0.23, cam.hasta + 0.4, cam.hasta + cam.sale, cam.hasta + cam.sale + 0.2, composicion.durationInFrames / composicion.fps - 0.05]
const cuadros = tiempos.map((t) => Math.min(composicion.durationInFrames - 1, Math.round(t * composicion.fps)))

/* El alfa del bisel, para saber qué es hueco. */
const bisel = path.join(AQUI, 'public', props.bisel)
const alfaPng = execFileSync('ffmpeg', ['-v', 'error', '-i', bisel, '-vf', 'alphaextract', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 28 })
const { png, cuerpo, pantalla } = IPHONE_17
const alfa = (x, y) => (x < 0 || y < 0 || x >= png.w || y >= png.h ? 255 : alfaPng[y * png.w + x])
/* Lo transparente ADENTRO del cuerpo: en las esquinas de la caja del
   hueco hay alfa 0 que es el exterior del teléfono, y ahí el fondo
   tiene que verse. */
const rc = cuerpo.r + 8
const dentroDelCuerpo = (x, y) => {
  const ex = x < cuerpo.x + rc ? cuerpo.x + rc : x > cuerpo.x + cuerpo.w - 1 - rc ? cuerpo.x + cuerpo.w - 1 - rc : x
  const ey = y < cuerpo.y + rc ? cuerpo.y + rc : y > cuerpo.y + cuerpo.h - 1 - rc ? cuerpo.y + cuerpo.h - 1 - rc : y
  return (x - ex) ** 2 + (y - ey) ** 2 <= rc * rc
}

let fallas = 0
console.log('\ncuadro   t      k      píxeles del hueco   sin rojo   dónde')
for (const n of cuadros) {
  const archivo = path.join(SALIDA, `f${n}.png`)
  await renderStill({ composition: composicion, serveUrl, frame: n, output: archivo, inputProps, imageFormat: 'png' })
  const rgb = execFileSync('ffmpeg', ['-v', 'error', '-i', archivo, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 })
  const t = n / composicion.fps
  const e = encuadre(t, L, props.altura, cam)
  const r = capas(e, { w: props.clipAncho, h: props.clipAlto })
  let total = 0
  let malos = 0
  let minX = L, minY = L, maxX = -1, maxY = -1
  for (let py = pantalla.y; py < pantalla.y + pantalla.h; py++)
    for (let px = pantalla.x; px < pantalla.x + pantalla.w; px++) {
      if (alfa(px, py) !== 0 || !dentroDelCuerpo(px, py)) continue
      let cerca = false
      for (let dy = -3; dy <= 3 && !cerca; dy++) for (let dx = -3; dx <= 3; dx++) if (alfa(px + dx, py + dy)) { cerca = true; break }
      if (cerca) continue
      const X = Math.round(r.bisel.x + px * e.s)
      const Y = Math.round(r.bisel.y + py * e.s)
      if (X < 0 || Y < 0 || X >= L || Y >= L) continue
      total++
      const o = (Y * L + X) * 3
      if (!(rgb[o] > 150 && rgb[o + 1] < 110 && rgb[o + 2] < 110)) {
        if (malos < 4) console.log(`   · cuadro ${n}: png (${px},${py}) → lienzo (${X},${Y}) rgb ${rgb[o]},${rgb[o + 1]},${rgb[o + 2]}`)
        malos++
        if (X < minX) minX = X
        if (Y < minY) minY = Y
        if (X > maxX) maxX = X
        if (Y > maxY) maxY = Y
      }
    }
  if (malos) fallas++
  console.log(`${String(n).padStart(6)}   ${t.toFixed(2)}   ${e.k.toFixed(3)}   ${String(total).padStart(16)}   ${String(malos).padStart(8)}   ${malos ? `x ${minX}..${maxX}  y ${minY}..${maxY}` : 'ok'}`)
}
console.log(fallas ? `\nFALLA: ${fallas} cuadros con el hueco sin llenar` : '\nOK: el hueco está lleno en todos los cuadros')
process.exit(fallas ? 1 : 0)
