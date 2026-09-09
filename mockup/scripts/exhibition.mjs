/* EL RENDER PARA LA EXHIBITION: un solo video, transparente y sin sombra,
   en los dos formatos que hacen falta para que el alfa llegue a todos
   los navegadores.

     pnpm render:exhibition                                 → swipeable-tabs
     node scripts/exhibition.mjs HoldToCommit hold-to-commit-oscuro

   → out/<salida>.webm  (VP9 con alfa, Chrome y Firefox)
   → out/<salida>.mov   (HEVC con alfa, Safari)

   Con dos piezas hay que decir cuál: la composición trae la cámara de
   su pieza y el segundo argumento nombra el clip y la salida. Sin
   argumentos sigue siendo swipeable-tabs, que es como se llamó hasta
   la segunda pieza.

   Remotion rinde el WebM con alfa directo (vp9 + yuva420p) y un máster
   ProRes 4444; el .mov para Safari sale del máster con el encoder de
   VideoToolbox de macOS, que es el único que escribe HEVC con alfa. El
   tamaño es 1280², el doble largo del hueco de 448 (la card) y el
   triple del de 628… no: el hueco mide 440 en las dos cajas (medido),
   así que 1280 es casi 3×, sobra nitidez. Sin sombra y con fondo
   transparente: el fondo lo pone la card, en el tema que sea; el
   teléfono al 92 % (la caja de la card es el video entero); la
   cámara entra a los tabs y se queda (ver parametros.ts). */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = fileURLToPath(new URL('../', import.meta.url))
const OUT = path.join(AQUI, 'out')
fs.mkdirSync(OUT, { recursive: true })

const [composicion = 'SwipeableTabsExhibition', salida = 'exhibition'] = process.argv.slice(2)
/* El clip: cada composición trae el suyo; una pieza con dos apariencias
   nombra cuál por argumento (hold-to-commit-oscuro, -claro). */
const clip = salida === 'exhibition' ? null : `${salida}.mp4`

/* TODO LO DEMÁS —transparente, sin sombra, teléfono al 92 %, la cámara
   que entra y se queda— vive en la composición `…Exhibition` de cada pieza
   (`paraExhibition` en parametros.ts). Acá sólo se pisa el clip, que es de
   primer nivel: Remotion mezcla las input props con las defaultProps
   sólo en el primer nivel, así que un `camara` parcial borraría el foco
   y las curvas de la pieza. */
const props = JSON.stringify(clip ? { clip } : {})
const remotion = (...a) => execFileSync('npx', ['remotion', ...a], { cwd: AQUI, stdio: 'inherit' })
/* 1120², no 1280: la caja de la card mide 560 y en una pantalla retina
   son 1120 píxeles de dispositivo, así que 1120 es 1:1 —cada píxel del
   video cae en uno de la pantalla, sin re-muestreo— y decodifica un 23 %
   menos que 1280. Medido en Chrome antes del cambio: 0 cuadros caídos a
   1× y a 0.5×; lo que se ve "con lag" a 0.5× son los 30 cuadros únicos
   por segundo que da una grabación de 60, y eso no lo arregla ningún
   códec (se probó interpolar a 120 con minterpolate: fantasmas en el
   texto en los flicks; descartado). */
const ESCALA = String(1120 / 2160)

console.log('1/3  WebM VP9 con alfa (1280²)')
remotion('render', composicion, `out/${salida}.webm`, '--codec=vp9', '--pixel-format=yuva420p', '--crf=18', `--scale=${ESCALA}`, `--props=${props}`, '--log=error')

console.log('2/3  máster ProRes 4444 con alfa (1280²)')
/* --pixel-format=yuva444p10le, y no es opcional: sin él Remotion escribe
   el ProRes 4444 SIN alfa (medido: esquina 255) y el .mov de Safari
   sale con fondo negro. */
remotion('render', composicion, `out/${salida}-master.mov`, '--codec=prores', '--prores-profile=4444', '--pixel-format=yuva444p10le', `--scale=${ESCALA}`, `--props=${props}`, '--log=error')

console.log('3/3  HEVC con alfa para Safari (VideoToolbox)')
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-y', '-i', path.join(OUT, `${salida}-master.mov`), '-vf', 'format=bgra',
    /* calidad 85 de 100, sin priorizar velocidad: Safari es la mitad de los
       que miran, y a 0.5× cada cuadro se mira el doble de tiempo */
    '-c:v', 'hevc_videotoolbox', '-alpha_quality', '0.95', '-q:v', '85', '-realtime', 'false', '-prio_speed', 'false', '-tag:v', 'hvc1', '-an', '-movflags', '+faststart',
    path.join(OUT, `${salida}.mov`)],
  { stdio: 'inherit' },
)
/* El máster tiene que tener alfa de verdad antes de dar nada por hecho. */
const rgba = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(OUT, `${salida}-master.mov`), '-frames:v', '1', '-pix_fmt', 'rgba', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 })
const alfaEsquina = rgba[3]
if (alfaEsquina !== 0) {
  console.error(`El máster no es transparente: alfa ${alfaEsquina} en la esquina. Revisá --pixel-format.`)
  process.exit(1)
}
console.log('   alfa del máster en la esquina: 0 ✓')
for (const f of [`${salida}.webm`, `${salida}.mov`]) {
  const mb = (fs.statSync(path.join(OUT, f)).size / 1024 / 1024).toFixed(1)
  console.log(`   ${f}  ${mb} MB`)
}
console.log('listo')
