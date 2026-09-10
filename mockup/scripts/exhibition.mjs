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

/* CRF 32, Y ANTES ERA 18. El 18 es calidad de máster y acá el archivo
   se sirve por red en cada carga: `swipeable-tabs.webm` pesaba 8.89 MB
   y la página de detalle bajaba 9.07 MB, medido en Chrome sin caché.

   El 32 salió de un barrido con la referencia al lado, no de un gusto.
   Recortando el peor bloque de 80×80 —el de mayor diferencia contra el
   original, buscado y no elegido a dedo— y mirándolo al 200 %, el grano
   del papel de la ilustración sigue entero en 32; recién a 40 se
   empieza a perder. Queda margen a propósito: la pieza es la vitrina.

   Una trampa de ffmpeg que costó una vuelta: para volver a codificar un
   WebM con alfa hay que pedir `-c:v libvpx-vp9` EN LA ENTRADA. El
   decodificador VP9 por defecto descarta la capa alfa sin avisar y el
   resultado sale opaco —esquina 255 en vez de 0— aunque la salida diga
   yuva420p. */
console.log('1/3  WebM VP9 con alfa (1280²)')
remotion('render', composicion, `out/${salida}.webm`, '--codec=vp9', '--pixel-format=yuva420p', '--crf=32', `--scale=${ESCALA}`, `--props=${props}`, '--log=error')

console.log('2/3  máster ProRes 4444 con alfa (1280²)')
/* --pixel-format=yuva444p10le, y no es opcional: sin él Remotion escribe
   el ProRes 4444 SIN alfa (medido: esquina 255) y el .mov de Safari
   sale con fondo negro. */
remotion('render', composicion, `out/${salida}-master.mov`, '--codec=prores', '--prores-profile=4444', '--pixel-format=yuva444p10le', `--scale=${ESCALA}`, `--props=${props}`, '--log=error')

console.log('3/3  HEVC con alfa para Safari (VideoToolbox)')
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-y', '-i', path.join(OUT, `${salida}-master.mov`), '-vf', 'format=bgra',
    /* BITRATE FIJO Y NO `-q:v`, sin priorizar velocidad: Safari es la
       mitad de los que miran, y a 0.5× cada cuadro se mira el doble de
       tiempo. Antes decía `-q:v 85` y `swipeable-tabs.mov` salía de
       20.60 MB — el archivo más pesado del sitio por lejos.

       El control por bitrate rinde mucho más que la escala de calidad
       en este encoder: medido sobre los mismos 4 s, `-q:v 65` da
       2.71 MB con SSIM 0.9948 y `-b:v 3000k` da 1.65 MB con 0.9937.
       Casi la misma calidad por el 60 % del tamaño. Se eligió 4000k y
       no 3000k para dejar margen: a 2000k el grano del papel se
       borronea y se ve al 200 %. */
    '-c:v', 'hevc_videotoolbox', '-alpha_quality', '0.95', '-b:v', '4000k', '-realtime', 'false', '-prio_speed', 'false', '-tag:v', 'hvc1', '-an', '-movflags', '+faststart',
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
