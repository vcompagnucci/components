/* EL RENDER PARA LA LIBRARY: un solo video, transparente y sin sombra,
   en los dos formatos que hacen falta para que el alfa llegue a todos
   los navegadores.

     pnpm render:library            → out/library.webm  (VP9 con alfa, Chrome y Firefox)
                                    → out/library.mov   (HEVC con alfa, Safari)

   Remotion rinde el WebM con alfa directo (vp9 + yuva420p) y un máster
   ProRes 4444; el .mov para Safari sale del máster con el encoder de
   VideoToolbox de macOS, que es el único que escribe HEVC con alfa. El
   tamaño es 1280², el doble largo del hueco de 448 (la card) y el
   triple del de 628… no: el hueco mide 440 en las dos cajas (medido),
   así que 1280 es casi 3×, sobra nitidez. Sin sombra y con fondo
   transparente: el fondo lo pone la card, en el tema que sea; el
   teléfono al 86 %; la cámara termina a 1× (ver parametros.ts). */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = fileURLToPath(new URL('../', import.meta.url))
const OUT = path.join(AQUI, 'out')
fs.mkdirSync(OUT, { recursive: true })

const props = JSON.stringify({
  fondo: 'transparent',
  sombra: [],
  altura: 0.86,
  camara: {
    espera: 0.25, entra: 0.65, k1: 1.576, hasta: 3.0, sale: 0.62, k2: 1.0,
    foco: 0.145, focoEnLienzo: 0.33, aireArriba: 0.07,
    curvaEntra: { x1: 0.3, y1: 0.05, x2: 0.4, y2: 0.9 },
    curvaSale: { x1: 0.25, y1: 0.25, x2: 0.2, y2: 0.9 },
  },
})
const remotion = (...a) => execFileSync('npx', ['remotion', ...a], { cwd: AQUI, stdio: 'inherit' })
const ESCALA = String(1280 / 2160)

console.log('1/3  WebM VP9 con alfa (1280²)')
remotion('render', 'SwipeableTabs', 'out/library.webm', '--codec=vp9', '--pixel-format=yuva420p', `--scale=${ESCALA}`, `--props=${props}`, '--log=error')

console.log('2/3  máster ProRes 4444 con alfa (1280²)')
remotion('render', 'SwipeableTabs', 'out/library-master.mov', '--codec=prores', '--prores-profile=4444', `--scale=${ESCALA}`, `--props=${props}`, '--log=error')

console.log('3/3  HEVC con alfa para Safari (VideoToolbox)')
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-y', '-i', path.join(OUT, 'library-master.mov'), '-vf', 'format=bgra',
    '-c:v', 'hevc_videotoolbox', '-alpha_quality', '0.9', '-q:v', '70', '-tag:v', 'hvc1', '-an', '-movflags', '+faststart',
    path.join(OUT, 'library.mov')],
  { stdio: 'inherit' },
)
for (const f of ['library.webm', 'library.mov']) {
  const mb = (fs.statSync(path.join(OUT, f)).size / 1024 / 1024).toFixed(1)
  console.log(`   ${f}  ${mb} MB`)
}
console.log('listo')
