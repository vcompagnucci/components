/* LOS DOS ARCHIVOS QUE LA COMPOSICIÓN NECESITA EN public/, que está
   gitignoreado: el bisel de Apple (la licencia permite usarlo para
   mockups de sus plataformas, no redistribuirlo) y la grabación,
   normalizada a 60 fps constantes.

     pnpm assets                                   # el máster de swipeable-tabs
     pnpm assets --clip=/ruta/a/otra-grabacion.mp4
     pnpm assets --clip=… --salida=hold-to-commit-oscuro.mp4
     pnpm assets --clip=… --salida=… --hasta=4.10

   `--salida` existe desde la segunda pieza: una pieza que se muestra en
   claro y en oscuro tiene DOS grabaciones, y las dos tienen que estar en
   public/ al mismo tiempo para que un solo render las alcance por props.
   Sin él, la segunda pisaba a la primera.

   `--hasta` CORTA LA ENTREGA, NO EL MÁSTER. El máster de una toma se
   guarda entero porque es el registro de lo que pasó; lo que se entrega
   puede terminar antes. Hold to commit corta a los 4.10 s, cuando la
   animación ya terminó y el reinicio todavía no empezó (el recibo, con
   la medición, está en `parametros.ts`). Cortar ACÁ y no después es lo
   que hace que los dos formatos de la library duren exactamente lo
   mismo: cortar un WebM ya rendido con `-c copy` sólo puede cortar en un
   cuadro clave, y dejaba el WebM en 4.121 contra 4.100 del .mov. De paso
   se rinde un 25 % menos de cuadros.

   POR QUÉ SE NORMALIZA: simctl graba a tasa variable —60 cuadros por
   segundo mientras algo se mueve y ninguno con la pantalla quieta— y
   un video así, muestreado por tiempo, puede caer en el cuadro
   anterior o el siguiente al que corresponde. Con `fps=60` cada
   instante tiene su cuadro y el render es determinista. crf 12: es un
   intermedio, no una entrega. */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = fileURLToPath(new URL('../', import.meta.url))
const RAIZ = path.join(AQUI, '..')
const PUBLIC = path.join(AQUI, 'public')

const opciones = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, ...v] = a.slice(2).split('=')
    return [k, v.length ? v.join('=') : 'true']
  }),
)
const clip = path.resolve(opciones.clip ?? path.join(RAIZ, '.context/mockup/master/swipeable-tabs.mp4'))
const bisel = path.join(RAIZ, '.context/mockup/iPhone 17 - Black - Portrait.png')
for (const [que, archivo] of [['la grabación', clip], ['el bisel', bisel]]) {
  if (!fs.existsSync(archivo)) {
    console.error(`Falta ${que}: ${archivo}`)
    process.exit(1)
  }
}

fs.mkdirSync(PUBLIC, { recursive: true })
fs.copyFileSync(bisel, path.join(PUBLIC, 'bisel.png'))
console.log(`bisel   → public/bisel.png`)
const destino = path.join(PUBLIC, opciones.salida ?? 'clip.mp4')
/* `-t` va como opción de SALIDA, después del filtro: corta por tiempo del
   clip normalizado, así el número que se pasa es el mismo que se lee en
   una medición a 60 fps. */
const recorte = opciones.hasta ? ['-t', String(Number(opciones.hasta))] : []
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-y', '-i', clip, '-vf', 'fps=60', ...recorte, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', destino],
  { stdio: 'inherit' },
)
const datos = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,duration', '-of', 'csv=p=0', destino]).toString().trim()
console.log(`clip    → public/${path.basename(destino)} (${datos.replace(/,/g, ' × ').replace(' × ', '×')})\nlisto`)
