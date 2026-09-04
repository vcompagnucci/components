/* MOCKUP — la grabación cruda del vault adentro de un iPhone, con una
 * cámara que entra y sale, sobre un fondo neutro (o una imagen), lista
 * para X.
 *
 *   pnpm mockup swipeable-tabs                       → fondo neutro, iPhone 17 Black, cámara "arranque"
 *   pnpm mockup swipeable-tabs --hasta=2.6 --foco=0.145
 *   pnpm mockup swipeable-tabs ~/fondo.png           → sobre una imagen, sin cámara (píxel por píxel)
 *   pnpm mockup swipeable-tabs --modelo="iPhone 17 Pro Max" --color=Silver --camara=quieta
 *
 * Lee VAULT_DIR/nativo/<slug>.mp4 (lo que dejó `pnpm grabar` o una
 * grabación del teléfono) y escribe .context/mockup/salida/<slug>.mp4:
 * 2160×2160 a 60 fps, h264, el techo real de un post de X (medido: X
 * sirve 2160² si se lo subís así; a 720² recomprime lo demás).
 *
 * ─── DE DÓNDE SALE CADA NÚMERO ───
 *
 * LA REFERENCIA ES EL CLIP DE @nater02 (x.com/nater02/status/
 * 2092952884987957708, 720² a 60 fps, 24.6 s), medido cuadro a cuadro
 * el 2026-09-04:
 *
 *   fondo      RGB (235, 230, 232) plano — las cuatro esquinas y los
 *              bordes miden lo mismo en todos los cuadros; sin gradiente
 *   teléfono   cuerpo 335×686 en 720²: el 95.3 % del alto, centrado
 *              (196 px de aire a la izquierda, 190 a la derecha)
 *   sombra     sólo a la derecha y abajo (a la izquierda y arriba el
 *              fondo está intacto a 6 px del borde). El perfil a la
 *              derecha del borde, cada 6 px: 106 134 157 172 183 192 198
 *              201 205 210 … 232 a 150 px. No es una gaussiana: es una
 *              apretada y oscura más una ancha y tenue. Ajuste por
 *              mínimos cuadrados (error 3.7 de luma sobre los cuatro
 *              lados): capa 1 = alfa 0.60, σ 8, corrida 12; capa 2 =
 *              alfa 0.20, σ 30, corrida 70 — en px de 720; acá se
 *              escalan con el lienzo.
 *   cámara     arranca en el teléfono entero y ENTRA hasta 1.576× en
 *              0.65 s (ancho del cuerpo 335 → 528), se queda 0.18 s, y
 *              SALE en 0.62 s hasta 1.161× (528 → 389), donde se queda
 *              hasta el final. Al entrar apunta a la acción; al salir
 *              deja el teléfono centrado con un borde cortado y el otro
 *              a 52 px del lienzo (el 7.2 %).
 *   curvas     el ancho del cuerpo cuadro a cuadro, normalizado, contra
 *              una bézier cúbica (búsqueda sobre los cuatro puntos de
 *              control): entrada (0.30, 0.05, 0.40, 0.90), rms 0.005;
 *              salida (0.25, 0.25, 0.20, 0.90), rms 0.005. Ninguna curva
 *              CSS de las conocidas baja de 0.03.
 *
 * El marco es el BISEL OFICIAL de Apple (Apple Design Resources,
 * Bezel-iPhone-17.dmg → PNG). El de la referencia es un teléfono negro
 * de proporción 2.05 (335×686): el iPhone 17 (cuerpo 1310×2706 = 2.066)
 * antes que el Pro Max (2.095), y en negro sólo lo hay del 17. Cada
 * modelo lleva su geometría medida sobre el alfa del PNG: el hueco de
 * pantalla, el cuerpo y los radios. Los PNG NO viajan en el repo: la
 * licencia permite usarlos para mockups de interfaces de plataformas
 * Apple pero no redistribuirlos, así que viven en `.context/mockup/`,
 * gitignoreado, con la licencia al lado.
 *
 * La grabación (1320×2868, Pro Max) entra en el hueco del 17
 * (1206×2622) escalada: la proporción es la misma al 0.1 % (0.4603 vs
 * 0.4600). Se dibuja 4 px MÁS GRANDE que el hueco por cada lado, debajo
 * del bisel opaco: con la cámara cada capa se redondea a píxel por su
 * cuenta y sin ese sobrante asomaría el fondo en un filete. Su máscara
 * de esquinas tiene radio 186 (px del PNG), MENOS que el hueco, que es
 * una curva continua de ~230: la esquina visible es la del hueco y lo
 * que sobra queda abajo del bisel; con más radio asomaría el fondo.
 *
 * ─── LA CÁMARA, POR DENTRO ───
 * No se hace zoom sobre el cuadro compuesto (ablandaría todo): cada
 * capa —bisel, pantalla, sombra— se escala POR CUADRO desde su fuente
 * (`scale … eval=frame`) y se posiciona con expresiones de ffmpeg en
 * `t`. La cámara es (k, C): un zoom y el punto del lienzo base que
 * queda en el centro; una capa que en reposo está en P se dibuja en
 * (P − C)·k + L/2. Las curvas de la referencia son bézier, que ffmpeg
 * no evalúa, así que cada una se aproxima con un polinomio de grado 7
 * ajustado acá mismo (error < 0.007, monótono cuadro a cuadro).
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
    const [k, ...v] = a.slice(2).split('=')
    return [k, v.length ? v.join('=') : 'true']
  }),
)
const [slug, imagen] = args.filter((a) => !a.startsWith('--'))
if (!slug) {
  console.error(
    'Uso:  pnpm mockup <slug> [imagen] [--fondo=#EBE6E8] [--modelo="iPhone 17"|"iPhone 17 Pro Max"] [--color=Black|Silver|"Deep Blue"|"Cosmic Orange"]\n' +
      '                 [--camara=arranque|quieta] [--espera=0.25] [--hasta=2.6] [--foco=0.145] [--lado=centro|derecha]\n' +
      '                 [--lienzo=N] [--blur=0] [--luz=0] [--prueba=segundos] [--salida=archivo]',
  )
  process.exit(1)
}

const vault = vaultDir()
if (!vault) {
  console.error('VAULT_DIR no está en .env.local (ver .env.example)')
  process.exit(1)
}
/* `--clip=archivo` salta el vault (para probar con otra fuente). */
const clip =
  opciones.clip ??
  ['nativo', 'native']
    .map((c) => path.join(vault, c, `${slug}.mp4`))
    .find((p) => fs.existsSync(p))
if (!clip || !fs.existsSync(clip)) {
  console.error(`No hay ${slug}.mp4 en el vault. Grabá primero: pnpm grabar ${slug}`)
  process.exit(1)
}
/* `--verificar`: en vez de la grabación entra un rojo pleno, se
   renderizan los primeros 3.6 s (la cámara entera) y se comprueba
   píxel por píxel que TODO el hueco del bisel, en cada estado de la
   cámara, muestra rojo: ni fondo ni sombra asomando por un borde. */
const verificar = opciones.verificar === 'true'

/* ─── LOS MODELOS, medidos sobre el alfa de cada PNG ───
   png: tamaño del archivo · cuerpo: caja opaca del teléfono y el radio
   de su esquina · pantalla: el hueco transparente y el radio con que se
   enmascara la grabación (menor que el del hueco, ver arriba). */
const MODELOS = {
  'iPhone 17 Pro Max': {
    png: { w: 1470, h: 3000 },
    cuerpo: { x: 29, y: 20, w: 1412, h: 2958, r: 200 },
    pantalla: { x: 75, y: 66, w: 1320, h: 2868, r: 186 },
    colores: ['Silver', 'Deep Blue', 'Cosmic Orange'],
  },
  'iPhone 17': {
    png: { w: 1350, h: 2760 },
    cuerpo: { x: 20, y: 27, w: 1310, h: 2706, r: 246 },
    pantalla: { x: 72, y: 69, w: 1206, h: 2622, r: 186 },
    colores: ['Black', 'White', 'Sage', 'Mist Blue', 'Lavender'],
  },
}
const modelo = opciones.modelo ?? 'iPhone 17'
const M = MODELOS[modelo]
if (!M) {
  console.error(`Modelo desconocido: ${modelo}. Hay: ${Object.keys(MODELOS).join(', ')}`)
  process.exit(1)
}
const color = opciones.color ?? M.colores[0]
const bisel = path.join(RAIZ, '.context/mockup', `${modelo} - ${color} - Portrait.png`)
if (!fs.existsSync(bisel)) {
  console.error(`Falta el bisel ${bisel}\n(Apple Design Resources › Bezel-iPhone-17.dmg → PNG/${modelo}/)`)
  process.exit(1)
}
if (imagen && !fs.existsSync(imagen)) {
  console.error(`No existe la imagen ${imagen}`)
  process.exit(1)
}

const sonda = (archivo, campos) =>
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', `stream=${campos}`, '-of', 'csv=p=0', archivo])
    .toString()
    .trim()
    .split(',')
const [clipW, clipH, clipDur] = sonda(clip, 'width,height,duration').map(Number)
if (!(clipW > 0 && clipH > 0)) {
  console.error(`No pude leer las dimensiones de ${clip}`)
  process.exit(1)
}

/* ─── EL LIENZO ───
   Sin imagen: 2160², el techo de X, con el fondo neutro de la
   referencia. Con imagen: sale de la imagen, no al revés —una imagen
   chica escalada a 2160 se ablanda, así que el lienzo es el múltiplo
   ENTERO más grande que entra (900 → 1800) y se escala con vecino más
   cercano, píxel por píxel. Con `--lienzo=N` se fuerza. */
const fondo = (opciones.fondo ?? '#EBE6E8').replace(/^#/, '0x')
let LIENZO = Number(opciones.lienzo ?? 2160)
let flagsImagen = 'lanczos'
let dimImagen = null
if (imagen) {
  const [w, h] = sonda(imagen, 'width,height').map(Number)
  dimImagen = { w, h }
  const menor = Math.min(w, h)
  if (!opciones.lienzo) LIENZO = menor >= 2160 ? 2160 : menor * Math.max(1, Math.floor(2160 / menor))
  if (LIENZO % menor === 0) flagsImagen = 'neighbor'
}
const L = LIENZO

/* ─── LA GEOMETRÍA EN REPOSO (k = 1) ───
   El cuerpo del bisel al 95.3 % del alto del lienzo, centrado. `s0` es
   px del lienzo por px del PNG. */
const ALTURA = Number(opciones.altura ?? 0.953)
const s0 = (ALTURA * L) / M.cuerpo.h
const bw0 = M.cuerpo.w * s0
const bh0 = M.cuerpo.h * s0
const lado = opciones.lado ?? 'centro'
const margen = Math.round(L * 0.046)
const bx0 = lado === 'centro' ? (L - bw0) / 2 : L - margen - bw0 - 8
const by0 = (L - bh0) / 2

/* La grabación en el hueco, con 4 px de sobrante por lado (px del
   PNG); el sobrante vertical sale de conservar la proporción.

   OJO CON LOS ORÍGENES: `pant` y `M.cuerpo` están en coordenadas del
   PNG (desde su esquina), `bx0/by0` es el cuerpo en el lienzo. La
   pantalla se apoya en el lienzo en bx0 + (pant.x − cuerpo.x)·s0. La
   primera versión sumaba pant.x sin restar cuerpo.x y la pantalla
   quedaba 15×20 px corrida hacia abajo y a la derecha: en la esquina
   de arriba a la izquierda asomaba el fondo a través del hueco
   ("mirá los bordes, no se fillean", captura del usuario, 2026-09-04).
   Por eso existe `--verificar`, abajo. */
const SOBRANTE = 4
const f = (M.pantalla.w + 2 * SOBRANTE) / clipW
const pant = {
  w: M.pantalla.w + 2 * SOBRANTE,
  h: clipH * f,
  x: M.pantalla.x - SOBRANTE,
  y: M.pantalla.y - (clipH * f - M.pantalla.h) / 2,
}
const radioMascara = Math.round(M.pantalla.r / f)

/* ─── LA SOMBRA, en px de 720 de la referencia, escalada al lienzo ─── */
const e = L / 720
const SOMBRA = [
  { alfa: 0.6, sigma: 8 * e, corrida: 12 * e },
  { alfa: 0.2, sigma: 30 * e, corrida: 70 * e },
]
const MARGEN_SOMBRA = Math.ceil(Math.max(...SOMBRA.map((c) => c.corrida + 3 * c.sigma)))

/* ─── LA CÁMARA ───
   `arranque` (la de la referencia): espera `--espera` s con el
   teléfono entero, entra en 0.65 s a 1.576× apuntando a `--foco` (la
   fracción del alto del cuerpo donde está la acción; 0.145 es la fila
   de tabs de esta pieza: barra de estado + cabecera + media barra),
   que queda al 33 % del alto del lienzo; se queda hasta `--hasta` s;
   sale en 0.62 s a 1.161× con el borde de arriba del teléfono al 7.2 %
   del lienzo (la referencia deja ese aire abajo porque su acción está
   abajo; acá está arriba). Con una imagen de fondo va `quieta` salvo
   que se pida: el zoom la sacaría del píxel exacto. */
const camara = opciones.camara ?? (imagen ? 'quieta' : 'arranque')
const K1 = 1.576
const K2 = 1.161
const T1 = Number(opciones.espera ?? 0.25)
const T2 = T1 + 0.65
const T3 = Number(opciones.hasta ?? 2.6)
const T4 = T3 + 0.62
const foco = Number(opciones.foco ?? 0.145)
if (T3 < T2) {
  console.error(`--hasta (${T3}) tiene que ser mayor que el final de la entrada (${T2.toFixed(2)})`)
  process.exit(1)
}
const cx1 = bx0 + bw0 / 2
const cy1 = by0 + (foco + (0.5 - 0.33) * (L / (bh0 * K1))) * bh0
const cy2 = by0 + ((0.5 - 0.072) * L) / K2

/* Una bézier cúbica de easing, y su polinomio de grado 5 (mínimos
   cuadrados sobre 200 muestras) para que ffmpeg lo evalúe. */
const bezier = (x1, y1, x2, y2) => (x) => {
  let lo = 0
  let hi = 1
  let t = x
  for (let i = 0; i < 40; i++) {
    t = (lo + hi) / 2
    const xt = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
    if (xt < x) lo = t
    else hi = t
  }
  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
}
/* GRADO 7, NO 5: con grado 5 la curva de salida quedaba con dos
   cuadros de retroceso al final (el polinomio sobrepasa y vuelve:
   P(1) = 0.987, paso −0.007 por cuadro = 6 px de rebote a 2160). Con 7
   las dos son monótonas cuadro a cuadro y el error baja a 0.0006 /
   0.0063. Verificado en /tmp/nater/mono.mjs, 2026-09-04. */
function polinomio(fn, grado = 7) {
  const n = 200
  const A = []
  const b = []
  for (let i = 0; i <= n; i++) {
    const u = i / n
    A.push(Array.from({ length: grado }, (_, j) => u ** (j + 1)))
    b.push(fn(u))
  }
  const AtA = Array.from({ length: grado }, () => Array(grado).fill(0))
  const Atb = Array(grado).fill(0)
  for (let i = 0; i <= n; i++)
    for (let j = 0; j < grado; j++) {
      Atb[j] += A[i][j] * b[i]
      for (let k = 0; k < grado; k++) AtA[j][k] += A[i][j] * A[i][k]
    }
  for (let c = 0; c < grado; c++) {
    let p = c
    for (let r = c + 1; r < grado; r++) if (Math.abs(AtA[r][c]) > Math.abs(AtA[p][c])) p = r
    ;[AtA[c], AtA[p]] = [AtA[p], AtA[c]]
    ;[Atb[c], Atb[p]] = [Atb[p], Atb[c]]
    for (let r = c + 1; r < grado; r++) {
      const m = AtA[r][c] / AtA[c][c]
      for (let k = c; k < grado; k++) AtA[r][k] -= m * AtA[c][k]
      Atb[r] -= m * Atb[c]
    }
  }
  const x = Array(grado).fill(0)
  for (let r = grado - 1; r >= 0; r--) {
    let s = Atb[r]
    for (let k = r + 1; k < grado; k++) s -= AtA[r][k] * x[k]
    x[r] = s / AtA[r][r]
  }
  let peor = 0
  for (let i = 0; i <= n; i++) {
    const u = i / n
    peor = Math.max(peor, Math.abs(x.reduce((acc, c, j) => acc + c * u ** (j + 1), 0) - fn(u)))
  }
  return { coef: x, peor }
}
const ENTRA = polinomio(bezier(0.3, 0.05, 0.4, 0.9))
const SALE = polinomio(bezier(0.25, 0.25, 0.2, 0.9))

/* Expresiones de ffmpeg. `tramo` interpola de `a` a `b` entre t0 y t1
   con la curva `c`; `curva` arma la trayectoria completa de un valor
   por los cuatro momentos de la cámara. El registro 1 guarda u. */
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(6))
const poli = (c) => `min(max(${c.coef.map((k, i) => `(${num(k)})*pow(ld(1),${i + 1})`).join('+')},0),1)`
const tramo = (a, b, c, t0, t1) => `(${num(a)}+(${num(b - a)})*(st(1,(t-${num(t0)})/${num(t1 - t0)})*0+${poli(c)}))`
const curva = (v0, v1, v2) =>
  camara === 'quieta'
    ? num(v0)
    : `if(lt(t,${num(T1)}),${num(v0)},if(lt(t,${num(T2)}),${tramo(v0, v1, ENTRA, T1, T2)},if(lt(t,${num(T3)}),${num(v1)},if(lt(t,${num(T4)}),${tramo(v1, v2, SALE, T3, T4)},${num(v2)}))))`
const kExpr = curva(1, K1, K2)
const cxExpr = curva(L / 2, cx1, cx1)
const cyExpr = curva(L / 2, cy1, cy2)
/* Registros: 2 = k, 4 = Cx, 5 = Cy. Cada expresión los recalcula: son
   baratas y así ninguna depende del orden en que ffmpeg las evalúe. */
const conCamara = (expr) => `st(2,${kExpr})*0+st(4,${cxExpr})*0+st(5,${cyExpr})*0+(${expr})`
const K = 'ld(2)'
/* Un punto P del lienzo base, en el cuadro: (P − C)·k + L/2. */
const enX = (p) => `((${num(p)})-ld(4))*${K}+${num(L / 2)}`
const enY = (p) => `((${num(p)})-ld(5))*${K}+${num(L / 2)}`
const tam = (base) => `round(${num(base)}*${K})`

/* Una máscara rectangular con esquinas redondeadas, en expresión de geq:
   alfa 0 en los cuatro sectores de esquina que quedan fuera del arco. */
const fueraDeEsquinas = (w, h, r) => {
  const r2 = r * r
  const esquina = (cx, cy, condX, condY) => `${condX}*${condY}*gt(pow(X-${cx},2)+pow(Y-${cy},2),${r2})`
  return [
    esquina(r, r, `lt(X,${r})`, `lt(Y,${r})`),
    esquina(w - 1 - r, r, `gt(X,${w - 1 - r})`, `lt(Y,${r})`),
    esquina(r, h - 1 - r, `lt(X,${r})`, `gt(Y,${h - 1 - r})`),
    esquina(w - 1 - r, h - 1 - r, `gt(X,${w - 1 - r})`, `gt(Y,${h - 1 - r})`),
  ].join('+')
}

/* ─── LAS DOS IMÁGENES AUXILIARES, cacheadas por sus números ───
   La máscara de la pantalla (gris, tamaño de la grabación) y la sombra
   (rgba, escala de reposo) se generan una vez: hacerlas con geq cuadro
   a cuadro costaba más que todo el resto. */
const cache = path.join(RAIZ, '.context/mockup/cache')
fs.mkdirSync(cache, { recursive: true })
const ffmpeg = (...a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' })

const mascara = path.join(cache, `mascara-${clipW}x${clipH}-r${radioMascara}.png`)
if (!fs.existsSync(mascara))
  ffmpeg(
    '-f', 'lavfi', '-i', `color=c=white:s=${clipW}x${clipH}:d=1,format=gray`,
    '-vf', `geq=lum='if(${fueraDeEsquinas(clipW, clipH, radioMascara)},0,255)'`,
    '-frames:v', '1', mascara,
  )

const sw = Math.round(bw0)
const sh = Math.round(bh0)
const sr = Math.round(M.cuerpo.r * s0)
const sombraW = sw + 2 * MARGEN_SOMBRA
const sombraH = sh + 2 * MARGEN_SOMBRA
const sombra = path.join(cache, `sombra-${sw}x${sh}-${SOMBRA.map((c) => `${c.alfa}-${c.sigma.toFixed(1)}-${c.corrida.toFixed(1)}`).join('-')}.png`)
if (!fs.existsSync(sombra)) {
  const capa = (c, i) =>
    `color=c=white:s=${sw}x${sh}:d=1,format=gray,geq=lum='if(${fueraDeEsquinas(sw, sh, sr)},0,${Math.round(c.alfa * 255)})',` +
    `pad=${sombraW}:${sombraH}:${Math.round(MARGEN_SOMBRA + c.corrida)}:${Math.round(MARGEN_SOMBRA + c.corrida)}:color=black,gblur=sigma=${c.sigma.toFixed(2)}[c${i}]`
  ffmpeg(
    '-f', 'lavfi', '-i', `color=c=black:s=${sombraW}x${sombraH}:d=1,format=rgba`,
    '-filter_complex',
    /* screen = 1 − (1−a)(1−b): las dos capas se suman como sombras,
       no como pinturas. */
    `${SOMBRA.map(capa).join(';')};[c0][c1]blend=all_mode=screen[alfa];[0:v][alfa]alphamerge,format=rgba[out]`,
    '-map', '[out]', '-frames:v', '1', sombra,
  )
}

/* ─── EL GRAFO ───
   Entradas: 0 grabación · 1 máscara · 2 bisel · 3 sombra · 4 imagen
   (si hay). Las imágenes van en loop a 60 fps para que su `t` sea el
   del clip. Cada capa se escala por cuadro y se apoya con la cámara. */
const blur = Number(opciones.blur ?? 0)
const luz = Number(opciones.luz ?? 0)
const entradas = [
  ...(verificar ? ['-f', 'lavfi', '-i', `color=c=red:s=${clipW}x${clipH}:r=60:d=3.6`] : ['-i', clip]),
  '-loop', '1', '-framerate', '60', '-i', mascara,
  '-loop', '1', '-framerate', '60', '-i', bisel,
  '-loop', '1', '-framerate', '60', '-i', sombra,
]
const fondoFiltro = imagen
  ? `[4:v]scale=${L}:${L}:force_original_aspect_ratio=increase:flags=${flagsImagen},crop=${L}:${L},` +
    (blur > 0 ? `gblur=sigma=${blur},` : '') +
    (luz !== 0 ? `eq=brightness=${luz},` : '') +
    (camara === 'quieta' ? '' : `scale=w='${conCamara(tam(L))}':h='${conCamara(tam(L))}':eval=frame:flags=lanczos,`) +
    `format=rgba[fondoImg];` +
    `color=c=${fondo}:s=${L}x${L}:r=60[lienzo];` +
    `[lienzo][fondoImg]overlay=x='${conCamara(enX(0))}':y='${conCamara(enY(0))}'[bg]`
  : `color=c=${fondo}:s=${L}x${L}:r=60[bg]`
if (imagen) entradas.push('-loop', '1', '-framerate', '60', '-i', imagen)

const filtro = [
  fondoFiltro,
  `[3:v]scale=w='${conCamara(tam(sombraW))}':h='${conCamara(tam(sombraH))}':eval=frame[sombra]`,
  `[2:v]scale=w='${conCamara(tam(M.png.w * s0))}':h='${conCamara(tam(M.png.h * s0))}':eval=frame[bisel]`,
  `[0:v]format=rgba[cruda];[cruda][1:v]alphamerge,scale=w='${conCamara(tam(pant.w * s0))}':h='${conCamara(tam(pant.h * s0))}':eval=frame[pantalla]`,
  `[bg][sombra]overlay=x='${conCamara(enX(bx0 - MARGEN_SOMBRA))}':y='${conCamara(enY(by0 - MARGEN_SOMBRA))}'[a]`,
  `[a][pantalla]overlay=x='${conCamara(enX(bx0 + (pant.x - M.cuerpo.x) * s0))}':y='${conCamara(enY(by0 + (pant.y - M.cuerpo.y) * s0))}':eof_action=endall[b]`,
  `[b][bisel]overlay=x='${conCamara(enX(bx0 - M.cuerpo.x * s0))}':y='${conCamara(enY(by0 - M.cuerpo.y * s0))}',format=yuv420p[out]`,
].join(';')

const salidaDir = path.join(RAIZ, '.context/mockup/salida')
fs.mkdirSync(salidaDir, { recursive: true })
const salida = verificar
  ? path.join(cache, 'verificacion.mkv')
  : (opciones.salida ?? path.join(salidaDir, `${slug}${lado === 'centro' ? '' : `-${lado}`}.mp4`))
const prueba = verificar ? ['-t', '3.6'] : opciones.prueba ? ['-t', String(Number(opciones.prueba))] : []
const preset = verificar || opciones.prueba ? 'ultrafast' : 'medium'

console.log(
  `clip     ${clip} (${clipW}×${clipH}, ${clipDur.toFixed(2)} s)\n` +
    (imagen ? `imagen   ${imagen} (${dimImagen.w}×${dimImagen.h}, ${flagsImagen})\n` : `fondo    ${fondo}\n`) +
    `lienzo   ${L}²\nbisel    ${modelo} · ${color}\nlado     ${lado}\n` +
    `cámara   ${camara}` +
    (camara === 'quieta' ? '' : ` · entra ${T1}→${T2.toFixed(2)} s a ${K1}× (foco ${foco}) · sale ${T3}→${T4.toFixed(2)} s a ${K2}×`) +
    `\ncurvas   polinomios con error máximo ${ENTRA.peor.toFixed(4)} / ${SALE.peor.toFixed(4)}\nsalida   ${salida}`,
)
/* La verificación se graba SIN pérdida y en RGB: con yuv420p el croma
   se promedia de a 2 px y un rojo pegado al bisel deja de ser rojo sin
   que haya ningún hueco. */
ffmpeg(
  ...entradas,
  '-filter_complex', verificar ? filtro.replace(/,format=yuv420p\[out\]$/, ',format=rgb24[out]') : filtro,
  '-map', '[out]', '-r', '60', ...prueba,
  ...(verificar
    ? ['-c:v', 'ffv1', '-pix_fmt', 'rgb24']
    : ['-c:v', 'libx264', '-preset', preset, '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']),
  salida,
)
if (!verificar) {
  console.log('listo')
} else {
  /* La misma cámara que corre en ffmpeg, evaluada acá con los MISMOS
     polinomios, para saber dónde cayó cada capa en cada cuadro. */
  const evalPoli = (c, u) => Math.min(Math.max(c.coef.reduce((acc, k, i) => acc + k * u ** (i + 1), 0), 0), 1)
  const valor = (t, v0, v1, v2) => {
    if (camara === 'quieta' || t < T1) return v0
    if (t < T2) return v0 + (v1 - v0) * evalPoli(ENTRA, (t - T1) / (T2 - T1))
    if (t < T3) return v1
    if (t < T4) return v1 + (v2 - v1) * evalPoli(SALE, (t - T3) / (T4 - T3))
    return v2
  }
  const cuadros = [6, 24, 36, 48, 54, 57, 120, 160, 170, 180, 190, 200]
  const rgb = execFileSync('ffmpeg', [
    '-v', 'error', '-i', salida, '-vf', `select='${cuadros.map((n) => `eq(n\,${n})`).join('+')}'`,
    '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
  ], { maxBuffer: 1 << 30 })
  const alfaPng = execFileSync('ffmpeg', ['-v', 'error', '-i', bisel, '-f', 'rawvideo', '-pix_fmt', 'gray', '-vf', 'alphaextract', '-'], { maxBuffer: 1 << 28 })
  const alfa = (x, y) => (x < 0 || y < 0 || x >= M.png.w || y >= M.png.h ? 255 : alfaPng[y * M.png.w + x])
  /* El hueco es lo transparente ADENTRO del cuerpo: en las esquinas de
     la caja del hueco hay alfa 0 que es el exterior del teléfono (el
     cuerpo tiene sus propias esquinas redondas) y ahí el fondo tiene
     que verse. Se descarta con el radio del cuerpo más un margen. */
  const rc = M.cuerpo.r + 8
  const dentroDelCuerpo = (x, y) => {
    const ex = x < M.cuerpo.x + rc ? M.cuerpo.x + rc : x > M.cuerpo.x + M.cuerpo.w - 1 - rc ? M.cuerpo.x + M.cuerpo.w - 1 - rc : x
    const ey = y < M.cuerpo.y + rc ? M.cuerpo.y + rc : y > M.cuerpo.y + M.cuerpo.h - 1 - rc ? M.cuerpo.y + M.cuerpo.h - 1 - rc : y
    return (x - ex) ** 2 + (y - ey) ** 2 <= rc * rc
  }
  let fallas = 0
  console.log('\ncuadro   t      k      píxeles del hueco   sin rojo   dónde')
  cuadros.forEach((n, i) => {
    const t = n / 60
    const k = valor(t, 1, K1, K2)
    const cx = valor(t, L / 2, cx1, cx1)
    const cy = valor(t, L / 2, cy1, cy2)
    const S = s0 * k
    const pngX = (bx0 - M.cuerpo.x * s0 - cx) * k + L / 2
    const pngY = (by0 - M.cuerpo.y * s0 - cy) * k + L / 2
    const base = i * L * L * 3
    let total = 0
    let malos = 0
    let minX = L, minY = L, maxX = -1, maxY = -1
    for (let py = M.pantalla.y; py < M.pantalla.y + M.pantalla.h; py++)
      for (let px = M.pantalla.x; px < M.pantalla.x + M.pantalla.w; px++) {
        if (alfa(px, py) !== 0 || !dentroDelCuerpo(px, py)) continue
        /* A 2 px del borde del hueco el bisel está antialiasado: ahí no
           se juzga. */
        let cerca = false
        for (let dy = -3; dy <= 3 && !cerca; dy++) for (let dx = -3; dx <= 3; dx++) if (alfa(px + dx, py + dy)) { cerca = true; break }
        if (cerca) continue
        const X = Math.round(pngX + px * S)
        const Y = Math.round(pngY + py * S)
        if (X < 0 || Y < 0 || X >= L || Y >= L) continue
        total++
        const o = base + (Y * L + X) * 3
        if (!(rgb[o] > 150 && rgb[o + 1] < 110 && rgb[o + 2] < 110)) {
          if (malos < 6) console.log(`   · cuadro ${n}: png (${px},${py}) → lienzo (${X},${Y}) rgb ${rgb[o]},${rgb[o + 1]},${rgb[o + 2]}`)
          malos++
          if (X < minX) minX = X
          if (Y < minY) minY = Y
          if (X > maxX) maxX = X
          if (Y > maxY) maxY = Y
        }
      }
    if (malos) fallas++
    console.log(
      `${String(n).padStart(6)}   ${t.toFixed(2)}   ${k.toFixed(3)}   ${String(total).padStart(16)}   ${String(malos).padStart(8)}   ${malos ? `x ${minX}..${maxX}  y ${minY}..${maxY}` : 'ok'}`,
    )
  })
  console.log(fallas ? `\nFALLA: ${fallas} cuadros con el hueco sin llenar` : '\nOK: el hueco está lleno en todos los cuadros')
  process.exit(fallas ? 1 : 0)
}
