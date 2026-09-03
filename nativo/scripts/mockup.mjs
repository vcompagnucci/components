/* MOCKUP — la grabación cruda del vault adentro de un iPhone, sobre una
 * imagen, lista para X.
 *
 *   pnpm mockup swipeable-tabs ~/fondo.png
 *   pnpm mockup swipeable-tabs ~/fondo.png --lado=centro --color="Deep Blue" --blur=4
 *
 * Lee VAULT_DIR/nativo/<slug>.mp4 (lo que dejó `pnpm grabar` o una
 * grabación del teléfono) y escribe .context/mockup/salida/<slug>.mp4:
 * 2160×2160 a 60 fps, h264, el techo real de un post de X (medido: X
 * sirve 2160² si se lo subís así; a 720² recomprime lo demás).
 *
 * ─── DE DÓNDE SALE CADA NÚMERO ───
 *
 * La composición está MEDIDA sobre el clip de solarn (2160², 60 fps):
 * el teléfono ocupa el 92 % del alto y el 43 % del ancho, centrado;
 * el fondo llega desenfocado hasta ser color (gradiente 0.02 por px) y
 * a un 30 % de luminosidad; la sombra apenas se ve (8 niveles de luma,
 * ~40 px). Acá el desenfoque y la luz del fondo son perillas
 * (`--blur`, `--luz`) porque no toda imagen quiere lo mismo: una
 * ilustración se pierde si se la funde; una foto compite si no.
 *
 * El marco es el BISEL OFICIAL de Apple (Apple Design Resources,
 * Bezel-iPhone-17.dmg → PNG, 1470×3000). Su hueco de pantalla mide
 * EXACTAMENTE 1320×2868 en (75, 66) —lo mismo que graba el simulador—
 * así que la grabación entra 1:1 antes de escalar; el cuerpo va de
 * (29, 20) a (1441, 2978); la esquina del hueco tiene ~190 px de radio
 * (ajustado contra las filas 70..220 del alfa). Los PNG NO viajan en
 * el repo: la licencia permite usarlos para mockups de interfaces de
 * plataformas Apple pero no redistribuirlos, así que viven en
 * `.context/mockup/`, gitignoreado, con la licencia al lado.
 *
 * La pantalla se enmascara con radio 186 (un poco MENOS que el hueco):
 * lo que sobra queda abajo del bisel opaco; con más radio asomaría el
 * fondo en la esquina.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))

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
const opciones = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=')
    return [k, v ?? 'true']
  }),
)
const [slug, imagen] = args.filter((a) => !a.startsWith('--'))
if (!slug || !imagen) {
  console.error('Uso:  pnpm mockup <slug> <imagen> [--lado=derecha|centro] [--color=Silver|"Deep Blue"|"Cosmic Orange"] [--blur=4] [--luz=0]')
  process.exit(1)
}

const vault = vaultDir()
if (!vault) {
  console.error('VAULT_DIR no está en .env.local (ver .env.example)')
  process.exit(1)
}
const clip = ['nativo', 'native']
  .map((c) => path.join(vault, c, `${slug}.mp4`))
  .find((p) => fs.existsSync(p))
if (!clip) {
  console.error(`No hay ${slug}.mp4 en el vault. Grabá primero: pnpm grabar ${slug}`)
  process.exit(1)
}
const color = opciones.color ?? 'Silver'
const bisel = path.join(RAIZ, '.context/mockup', `iPhone 17 Pro Max - ${color} - Portrait.png`)
if (!fs.existsSync(bisel)) {
  console.error(`Falta el bisel ${bisel}\n(Apple Design Resources › Bezel-iPhone-17.dmg → PNG/iPhone 17 Pro Max/)`)
  process.exit(1)
}
if (!fs.existsSync(imagen)) {
  console.error(`No existe la imagen ${imagen}`)
  process.exit(1)
}

/* ─── LA GEOMETRÍA, en un lienzo de 2160² ───
   El cuerpo del bisel (1412×2958 en el PNG) se escala a 1987 de alto:
   el 92 % del lienzo, como en la referencia. */
const LIENZO = 2160
const s = 1987 / 2958
const png = { w: Math.round(1470 * s), h: Math.round(3000 * s) } // 987 × 2014
const cuerpo = { w: Math.round(1412 * s), h: 1987, dx: Math.round(29 * s), dy: Math.round(20 * s) } // 959×1987, offset 20,13
const pantalla = { w: Math.round(1320 * s), h: Math.round(2868 * s), dx: Math.round(75 * s), dy: Math.round(66 * s) } // 886×1926, offset 50,44
const radio = Math.round(186 * s) // 125
const radioCuerpo = Math.round(200 * s) // 134

const lado = opciones.lado ?? 'derecha'
const margen = 100
const pngX = lado === 'centro' ? Math.round((LIENZO - png.w) / 2) : LIENZO - margen - cuerpo.dx - cuerpo.w - 8
const pngY = Math.round((LIENZO - png.h) / 2)

const blur = Number(opciones.blur ?? 4)
const luz = Number(opciones.luz ?? 0)

/* Una máscara rectangular con esquinas redondeadas, en expresión de geq:
   alfa 0 en los cuatro sectores de esquina que quedan fuera del arco. */
const mascara = (w, h, r, alfa) => {
  const r2 = r * r
  const esquina = (cx, cy, condX, condY) => `${condX}*${condY}*gt(pow(X-${cx},2)+pow(Y-${cy},2),${r2})`
  const fuera = [
    esquina(r, r, `lt(X,${r})`, `lt(Y,${r})`),
    esquina(w - 1 - r, r, `gt(X,${w - 1 - r})`, `lt(Y,${r})`),
    esquina(r, h - 1 - r, `lt(X,${r})`, `gt(Y,${h - 1 - r})`),
    esquina(w - 1 - r, h - 1 - r, `gt(X,${w - 1 - r})`, `gt(Y,${h - 1 - r})`),
  ].join('+')
  return `if(${fuera},0,${alfa})`
}

const sombraPad = 200
const filtro = [
  `[1:v]scale=${LIENZO}:${LIENZO}:force_original_aspect_ratio=increase:flags=lanczos,crop=${LIENZO}:${LIENZO},` +
    (blur > 0 ? `gblur=sigma=${blur},` : '') +
    `eq=brightness=${luz},format=rgba[bg]`,
  `color=c=black:s=${cuerpo.w}x${cuerpo.h}:d=1,format=rgba,geq=r=0:g=0:b=0:a='${mascara(cuerpo.w, cuerpo.h, radioCuerpo, 95)}',` +
    `pad=${cuerpo.w + 2 * sombraPad}:${cuerpo.h + 2 * sombraPad}:${sombraPad}:${sombraPad}:color=black@0,gblur=sigma=55[sombra]`,
  `[2:v]scale=${png.w}:${png.h}[bisel]`,
  `[0:v]scale=${pantalla.w}:${pantalla.h},format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='${mascara(pantalla.w, pantalla.h, radio, 255)}'[pantalla]`,
  `[bg][sombra]overlay=x=${pngX + cuerpo.dx - sombraPad}:y=${pngY + cuerpo.dy - sombraPad + 24}:shortest=1[a]`,
  `[a][pantalla]overlay=x=${pngX + pantalla.dx}:y=${pngY + pantalla.dy}[b]`,
  `[b][bisel]overlay=x=${pngX}:y=${pngY},format=yuv420p[out]`,
].join(';')

const salidaDir = path.join(RAIZ, '.context/mockup/salida')
fs.mkdirSync(salidaDir, { recursive: true })
const salida = opciones.salida ?? path.join(salidaDir, `${slug}${lado === 'centro' ? '-centro' : ''}.mp4`)

console.log(`clip     ${clip}\nimagen   ${imagen}\nbisel    ${color}\nlado     ${lado}  blur ${blur}  luz ${luz}\nsalida   ${salida}`)
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-y', '-i', clip, '-loop', '1', '-i', imagen, '-i', bisel,
    '-filter_complex', filtro, '-map', '[out]', '-r', '60',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', salida],
  { stdio: 'inherit' },
)
console.log('listo')
