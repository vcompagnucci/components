/* EL VIDEO DE UNA PIEZA APP — de un archivo cualquiera a la library, en
   un comando.

     pnpm pieza:video swipeable-tabs ~/Downloads/final.mp4
     pnpm pieza:video swipeable-tabs ~/Downloads/final-oscuro.mp4 --oscuro
     pnpm pieza:video swipeable-tabs ~/Downloads/final.mov --ancho=720 --crf=23 --pisar

     pnpm pieza:video swipeable-tabs mockup/out/library --alfa

   `--alfa` es el camino de la library: recibe la BASE de un par que ya
   viene listo de `pnpm render:library` (<base>.webm con VP9 y alfa,
   <base>.mov con HEVC y alfa), los copia tal cual a public/piezas/ y
   completa `video` y `videoHevc`. No re-encodea: el alfa no sobrevive a
   un h264, y el par ya sale a 1280². `--oscuro` quedó para piezas con
   un fondo horneado por tema; la library de hoy no lo usa.

   Hace tres cosas, en orden: (1) busca la pieza en PIECES por su slug
   —la MISMA cuenta `slug()` de pieces.ts, así el archivo y la URL no
   pueden divergir—; (2) re-encodea el archivo para la web: h264,
   yuv420p, faststart, sin audio, al ancho pedido (720 por default: el
   doble del hueco del detalle, que mide 319) conservando la proporción
   del archivo, y a 60 fps si el origen los trae; (3) escribe
   public/piezas/<slug>.mp4 y pone `video: '/piezas/<slug>.mp4'` en la
   entrada. La card lo levanta sola: `Muestra` en parts.tsx.

   ─── POR QUÉ EXISTE ───
   Publicar (Add to Library) copia un clip del vault TAL CUAL, y el
   vault es la pared de lo ajeno: una pieza propia no tiene por qué
   pasar por ahí, y menos su máster (lo que graba el simulador pesa
   20–25 MB a 1320×2868). El video de una pieza puede llegar después de
   publicarla —hecho aparte, por otra persona o en otra sesión— y
   mientras no está, la card muestra el hueco del teléfono vacío
   (el ::before de .streamPreview). Este comando es el paso que faltaba
   entre "acá está el archivo" y "está en la library".

   ─── GUARDAS ───
   · El slug tiene que existir en PIECES: publicar es otro gesto.
   · Si la pieza ya tiene video, no lo pisa salvo `--pisar`.
   · Escribe el mp4 en un temporal y lo renombra al final; pieces.ts
     igual (temporal + rename), como hace agregarPieza en vault-media.
   · No decide la proporción: la conserva. El hueco de la card toma la
     del archivo (una grabación de iPhone es la silueta del teléfono;
     un mockup cuadrado se ve cuadrado). */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PIECES, slug as slugDePieza } from '../src/pieces.ts'

const RAIZ = fileURLToPath(new URL('../', import.meta.url))
const PIEZAS_TS = path.join(RAIZ, 'src/pieces.ts')
const PIEZAS_DIR = path.join(RAIZ, 'public/piezas')

const args = process.argv.slice(2)
const opciones = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, ...v] = a.slice(2).split('=')
    return [k, v.length ? v.join('=') : 'true']
  }),
)
const [slug, archivo] = args.filter((a) => !a.startsWith('--'))
if (!slug || !archivo) {
  console.error('Uso:  pnpm pieza:video <slug> <archivo> [--ancho=720] [--crf=23] [--pisar]')
  process.exit(1)
}
if (!fs.existsSync(archivo) && opciones.alfa !== 'true') {
  console.error(`No existe ${archivo}`)
  process.exit(1)
}
const pieza = PIECES.find((p) => slugDePieza(p.name) === slug)
if (!pieza) {
  console.error(`No hay ninguna pieza con slug "${slug}" en PIECES. Publicala primero (Add to Library) o agregá la entrada a mano.`)
  process.exit(1)
}
if (pieza.platform !== 'App') {
  console.error(`"${pieza.name}" es una pieza Web: se demuestra corriendo, no en video.`)
  process.exit(1)
}
const aLiteral = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const oscuro = opciones.oscuro === 'true'
const alfa = opciones.alfa === 'true'
const campo = oscuro ? 'videoOscuro' : 'video'
const sufijo = oscuro ? '-oscuro' : ''
if (!alfa && pieza[campo] && opciones.pisar !== 'true') {
  console.error(`"${pieza.name}" ya tiene ${campo} (${pieza[campo]}). Para reemplazarlo: --pisar`)
  process.exit(1)
}

/* ─── EL PAR CON ALFA, tal cual. Reemplaza lo que haya: es LA versión
   de la library, y `pnpm render:library` es su único origen. ─── */
function ponerCampo(src, nombreCampo, valor) {
  const inicio = src.indexOf(`name: '${aLiteral(pieza.name)}'`)
  const cierre = src.indexOf('\n  },', inicio)
  if (inicio < 0 || cierre < 0) throw new Error('No encontré la entrada en pieces.ts con la forma esperada')
  const bloque = src.slice(inicio, cierre)
  const linea = `${nombreCampo}: '${valor}',`
  const yaEsta = new RegExp(`${nombreCampo}: '[^']*',`)
  const nuevo = yaEsta.test(bloque) ? bloque.replace(yaEsta, linea) : `${bloque}\n    ${linea}`
  return src.slice(0, inicio) + nuevo + src.slice(cierre)
}
if (alfa) {
  const base = archivo.replace(/\.(webm|mov)$/i, '')
  const par = { webm: `${base}.webm`, mov: `${base}.mov` }
  for (const f of Object.values(par)) {
    if (!fs.existsSync(f)) {
      console.error(`Falta ${f}: el par lo hace \`pnpm render:library\` en mockup/`)
      process.exit(1)
    }
  }
  fs.mkdirSync(PIEZAS_DIR, { recursive: true })
  fs.copyFileSync(par.webm, path.join(PIEZAS_DIR, `${slug}.webm`))
  fs.copyFileSync(par.mov, path.join(PIEZAS_DIR, `${slug}.mov`))
  let src = fs.readFileSync(PIEZAS_TS, 'utf8')
  src = ponerCampo(src, 'video', `/piezas/${slug}.webm`)
  src = ponerCampo(src, 'videoHevc', `/piezas/${slug}.mov`)
  const temporalTs = PIEZAS_TS + '.tmp'
  fs.writeFileSync(temporalTs, src)
  fs.renameSync(temporalTs, PIEZAS_TS)
  const mb = (f) => (fs.statSync(f).size / 1024 / 1024).toFixed(1)
  console.log(`listo — ${slug}.webm ${mb(par.webm)} MB y ${slug}.mov ${mb(par.mov)} MB. pieces.ts tiene video y videoHevc. Mirala en /${slug}`)
  process.exit(0)
}

/* Lo que trae el archivo, para no inventar nada: proporción y cadencia
   salen de él. */
const sonda = execFileSync('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0',
  '-show_entries', 'stream=width,height,avg_frame_rate,duration',
  '-of', 'csv=p=0', archivo,
]).toString().trim().split(',')
const [w, h] = sonda.slice(0, 2).map(Number)
const [fn, fd] = sonda[2].split('/').map(Number)
const fps = fd ? fn / fd : fn
const duracion = Number(sonda[3])
if (!(w > 0 && h > 0)) {
  console.error(`No pude leer las dimensiones de ${archivo}`)
  process.exit(1)
}
const par = (n) => Math.round(n / 2) * 2
const ancho = par(Math.min(Number(opciones.ancho ?? 720), w))
const alto = par((ancho * h) / w)
const cadencia = fps > 45 ? 60 : 30
const crf = Number(opciones.crf ?? 23)

fs.mkdirSync(PIEZAS_DIR, { recursive: true })
const destino = path.join(PIEZAS_DIR, `${slug}${sufijo}.mp4`)
const temporal = path.join(PIEZAS_DIR, `.${slug}${sufijo}.tmp.mp4`)
console.log(`origen   ${archivo} (${w}×${h}, ${fps.toFixed(2)} fps, ${duracion.toFixed(2)} s)\nsalida   ${destino} (${ancho}×${alto}, ${cadencia} fps, crf ${crf})`)
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-y', '-i', archivo,
    '-vf', `fps=${cadencia},scale=${ancho}:${alto}:flags=lanczos`,
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', temporal],
  { stdio: 'inherit' },
)
fs.renameSync(temporal, destino)

/* La entrada en pieces.ts: se localiza por su `name` y se toca sólo el
   bloque de esa pieza, hasta el `},` que lo cierra. */
const src = fs.readFileSync(PIEZAS_TS, 'utf8')
const inicio = src.indexOf(`name: '${aLiteral(pieza.name)}'`)
const cierre = src.indexOf('\n  },', inicio)
if (inicio < 0 || cierre < 0) {
  console.error('No encontré la entrada en pieces.ts con la forma esperada; el mp4 quedó escrito, agregá `video` a mano.')
  process.exit(1)
}
const bloque = src.slice(inicio, cierre)
const linea = `${campo}: '/piezas/${slug}${sufijo}.mp4',`
const yaEsta = new RegExp(`${campo}: '[^']*',`)
const nuevoBloque = yaEsta.test(bloque) ? bloque.replace(yaEsta, linea) : `${bloque}\n    ${linea}`
const temporalTs = PIEZAS_TS + '.tmp'
fs.writeFileSync(temporalTs, src.slice(0, inicio) + nuevoBloque + src.slice(cierre))
fs.renameSync(temporalTs, PIEZAS_TS)

const mb = (fs.statSync(destino).size / 1024 / 1024).toFixed(1)
console.log(`listo — ${mb} MB. pieces.ts tiene ${campo}: '/piezas/${slug}${sufijo}.mp4'. Mirala en /${slug}`)
