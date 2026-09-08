/* ═══════════════════════════════════════════════════════════════
   EL PUENTE AL VAULT — sirve una carpeta que vive FUERA del repo.

   Los clips no entran a git. Ni uno. Viven en una carpeta tuya —puede
   ser tu Obsidian— y este plugin la sirve en /vault-media/ mientras
   corre el servidor de desarrollo.

   apply:'serve' es la puerta: vite build ni siquiera instancia el
   plugin, así que en producción /vault-media/ no existe. Es el mismo
   mecanismo que la puerta de src/privado/, del lado del servidor.

   LA CARPETA SALE DE .env.local, en VAULT_DIR. Sin prefijo VITE_ a
   propósito: con ese prefijo Vite la hornearía en el bundle del
   cliente, y la ruta de tu disco no tiene por qué viajar a ningún
   lado. Acá sólo la lee Node.

   ─── LAS TRES GUARDAS ───

   1 · LISTA BLANCA DE EXTENSIONES, no lista negra. Sólo se sirve lo
       que está en TIPOS: video e imagen. Esto importa de verdad si
       VAULT_DIR apunta a tu Obsidian, porque ahí adentro están todas
       tus notas: un .md no se sirve nunca, y no porque lo bloquee una
       regla sino porque no está en la lista de lo que sí.

   2 · NADA OCULTO. Cualquier cosa que empiece con punto queda afuera,
       en la lista y al servir: .obsidian/, .trash/, .git/, .DS_Store.

   3 · LA RUTA REAL TIENE QUE SEGUIR ADENTRO. Se resuelve con
       realpathSync —no con resolve a secas— así que un symlink que
       apunte afuera de la carpeta tampoco pasa. El costo es que un
       symlink legítimo hacia adentro tampoco funciona; se prefirió
       que falle de forma visible antes que exponer de forma
       silenciosa.

   ─── POR QUÉ HAY SOPORTE DE RANGE ───

   Sin él el reproductor no sirve para lo que se lo quiere usar. Un
   <video> pide bytes sueltos para buscar; si el servidor contesta
   siempre el archivo entero desde el byte cero, Chrome no puede
   saltar a un momento y Safari directamente no reproduce. Y todo el
   punto del vault es poder ir al cuadro exacto donde arranca un
   gesto. Por eso el rango se implementa acá y no en la fase 4: es
   condición del transporte, no del reproductor.
   ═══════════════════════════════════════════════════════════════ */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { cuadroDe } from './cuadros.mjs'
import { tarjetaDe } from './tarjeta-link.mjs'
/* La MISMA cuenta que usan la página y rutas.mjs. Publicar nombra el
   archivo del video con el slug de la pieza, así que si acá viviera
   una copia, la URL y el archivo podrían divergir en silencio. */
import { slug as slugDePieza } from '../src/pieces.ts'

/* Los cuadros se leen del contenedor UNA vez por archivo. La clave lleva
   tamaño y mtime, así que reemplazar un clip lo vuelve a leer solo y no
   hay forma de quedarse con el dato viejo. */
const cacheCuadros = new Map()
function cuadrosDe(abs, s) {
  const clave = `${abs}:${s.size}:${s.mtimeMs}`
  if (cacheCuadros.has(clave)) return cacheCuadros.get(clave)
  const r = cuadroDe(abs)
  cacheCuadros.set(clave, r)
  return r
}

/* La lista blanca. Lo que no está acá no se sirve. */
const TIPOS = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/x-m4v',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
}

const VIDEO = new Set(['.mp4', '.m4v', '.mov', '.webm'])

/* Hasta acá baja el recorrido. Es un tope contra un árbol
   patológico —un Obsidian grande, un symlink circular— no una
   decisión de diseño: cuatro niveles alcanzan de sobra para
   nativo/2026/algo.mp4. */
const HONDO = 4

const oculto = (nombre) => nombre.startsWith('.')

/* ═══════════ LAS FICHAS ═══════════
   Lo que escribís vos sobre un clip: qué es, de dónde salió, en qué
   dispositivo. Va en UN SOLO archivo en la raíz del vault, y no en un
   sidecar por clip, por dos razones:

     1. si el vault es tu Obsidian, un .json al lado de cada video te
        duplica la carpeta y te aparece en las búsquedas
     2. empieza con punto, así que ya está afuera de todo lo que se
        sirve — la misma guarda que cierra .obsidian y .trash

   La clave es la ruta relativa del clip. Si movés un archivo de
   carpeta, su ficha queda huérfana: es el costo de no meter metadatos
   adentro del archivo, y se prefiere a tocar tus originales. */
const FICHAS = '.lima-vault.json'

const FICHA_CAMPOS = ['notes', 'source', 'device']

/* ═══════════ LAS VISTAS DEL PLAYGROUND ═══════════
   Un archivo aparte de las fichas, y no un campo más adentro de ellas:
   una ficha describe UN clip y vive atada a su ruta, mientras que una
   vista es un lienzo con varias cosas encima. Meterlas juntas ataría el
   borrado de un clip al borrado de un lienzo.

   Va al lado, en la raíz del vault y empezando con punto, por las mismas
   dos razones que las fichas: no ensucia tu carpeta y ya queda afuera de
   todo lo que se sirve.

   EL CLIENTE MANDA EL DOCUMENTO ENTERO y el servidor lo sanea. Es la
   forma más simple que funciona para una herramienta de un solo usuario
   en desarrollo; con dos pestañas abiertas, la última que guarda gana.
   Queda dicho para el día que moleste. */
const VISTAS = '.lima-playground.json'
const TIPOS_FRAME = new Set(['pieza', 'clip', 'boceto'])
const MAX_VISTAS = 200
const MAX_FRAMES = 60
const LARGO_REF = 600

/* Todo lo que entra pasa por acá. Lo que no se reconoce NO se guarda: es
   la misma regla que la ficha, que descarta los campos de más en vez de
   escribirlos. */
const num = (v, min, max, porDefecto) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(v, min), max) : porDefecto
const texto = (v, largo) => (typeof v === 'string' ? v.slice(0, largo) : '')

function sanearVistas(d) {
  if (!Array.isArray(d)) return []
  return d.slice(0, MAX_VISTAS).map((v) => ({
    id: texto(v?.id, 64),
    nombre: texto(v?.nombre, 200),
    creada: num(v?.creada, 0, Number.MAX_SAFE_INTEGER, 0),
    frames: (Array.isArray(v?.frames) ? v.frames : []).slice(0, MAX_FRAMES).map((f) => ({
      id: texto(f?.id, 64),
      tipo: TIPOS_FRAME.has(f?.tipo) ? f.tipo : 'clip',
      ref: texto(f?.ref, LARGO_REF),
      /* El lienzo es infinito pero no tanto: un valor absurdo mandado a
         mano dejaría un frame imposible de encontrar. */
      x: num(f?.x, -100000, 100000, 0),
      y: num(f?.y, -100000, 100000, 0),
      ancho: num(f?.ancho, 40, 8000, 400),
      alto: num(f?.alto, 40, 8000, 300),
    })),
  })).filter((v) => v.id)
}
const LARGO_MAX = 4000

/* ═══════════ SUBIR UN CLIP ═══════════
   El único camino del puente que crea archivos NUEVOS en tu carpeta, así
   que las guardas van todas ANTES de tocar el disco y en este orden:

     1. la fuente sale de una lista de dos, no del cliente
     2. el nombre pasa por basename, que le arranca cualquier separador
     3. nada que empiece con punto — la misma regla que ya esconde
        .obsidian y .trash, ahora del lado de la escritura
     4. la extensión tiene que estar en la MISMA lista blanca con la que
        se sirve. Si no se puede servir, no se puede subir
     5. el tamaño se corta mientras entra, no cuando ya está en memoria
     6. no se pisa nada nunca: si el nombre está tomado, se numera
     7. escritura atómica, igual que los .json

   `dentro()` NO sirve para el destino: usa realpathSync y el archivo
   todavía no existe. Lo que se valida es la CARPETA —que existe, o se
   crea— y que el nombre no pueda salirse de ella.

   LA FUENTE ES UNA DE DOS y el servidor la traduce a la carpeta que YA
   tengas: si tu vault dice "nativo" se escribe ahí, y no se te crea una
   "native" al lado. La app se adapta a tu disco y no al revés — la misma
   razón por la que el índice acepta las dos ortografías. */
const FUENTES = {
  native: ['native', 'nativo'],
  web: ['web'],
}
const PESO_MAX = 512 * 1024 * 1024

/* La carpeta donde va a caer, creándola si hace falta. Devuelve null si
   la fuente no es una de las dos. */
function carpetaDe(raiz, fuente) {
  const opciones = FUENTES[fuente]
  if (!opciones) return null
  for (const nombre of opciones) {
    const abs = path.join(raiz, nombre)
    if (dentro(raiz, abs) && fs.statSync(abs).isDirectory()) return abs
  }
  /* Ninguna existe todavía: se crea la canónica, la primera de la lista. */
  const abs = path.join(raiz, opciones[0])
  fs.mkdirSync(abs, { recursive: true })
  return dentro(raiz, abs)
}

/* El nombre, saneado. Devuelve null si no queda nada usable.

   basename se lleva puesto cualquier separador, así que "../../x.mp4"
   queda en "x.mp4" y "/etc/passwd.mp4" en "passwd.mp4". Después se
   rechaza lo que empiece con punto, que cubre "..", ".env" y el
   "..\\..\\x" que en posix basename no toca porque la barra invertida
   no es separador acá. */
function nombreSano(crudo) {
  if (typeof crudo !== 'string') return null
  const base = path.basename(crudo.replace(/\0/g, '')).trim()
  if (!base || base.startsWith('.')) return null
  if (base.includes('/') || base.includes('\\')) return null
  if (base.length > 200) return null
  if (!TIPOS[path.extname(base).toLowerCase()]) return null
  return base
}

/* Un nombre libre en esa carpeta. No se pisa NUNCA: subir dos veces algo
   que se llama igual te deja los dos, y el que ya estaba no se toca. */
/* EL NOMBRE QUE ESCRIBÍS AL RENOMBRAR.
   Distinto de nombreSano: eso valida un archivo entrante y exige una
   extensión de la lista blanca. Acá lo que llega es un NOMBRE PARA
   LEER, sin extensión, y la extensión la pone el servidor copiándola
   del archivo original. Así renombrar no puede cambiar el tipo de un
   archivo — que es exactamente el agujero que abriría dejar pasar la
   extensión del cliente. */
function baseSana(crudo) {
  if (typeof crudo !== 'string') return null
  const crudoLimpio = crudo.replace(/\0/g, '').trim()
  /* El separador se rechaza ANTES de normalizar, no después. Con
     basename primero, "../fuera" se convertía en "fuera" y pasaba: el
     archivo no escapaba —la normalización lo impide— pero aceptar en
     silencio un nombre con traversal adentro es sorprender al que lo
     escribió. Si trae separadores, es un no. */
  if (crudoLimpio.includes('/') || crudoLimpio.includes('\\')) return null
  let base = path.basename(crudoLimpio).trim()
  if (!base || base.startsWith('.')) return null
  /* Si escribiste la extensión igual, se saca: si no, "sheet.mov"
     terminaría siendo "sheet.mov.mov". */
  const ext = path.extname(base).toLowerCase()
  if (TIPOS[ext]) base = base.slice(0, -ext.length).trim()
  if (!base || base.startsWith('.')) return null
  if (base.length > 180) return null
  return base
}

function libre(carpeta, base) {
  const ext = path.extname(base)
  const raiz = path.basename(base, ext)
  for (let i = 0; i < 1000; i++) {
    const nombre = i === 0 ? base : `${raiz} ${i + 1}${ext}`
    if (!fs.existsSync(path.join(carpeta, nombre))) return nombre
  }
  return null
}

function leerJson(raiz, archivo) {
  try {
    const t = fs.readFileSync(path.join(raiz, archivo), 'utf8')
    const d = JSON.parse(t)
    return d && typeof d === 'object' ? d : {}
  } catch {
    /* No existe todavía, o alguien lo dejó roto a mano. En los dos
       casos se arranca de cero en vez de tumbar el índice entero. */
    return {}
  }
}

/* Escritura ATÓMICA: a un temporal y después rename. Un write directo
   que se corta a la mitad —se cierra el servidor, se queda sin disco—
   deja el archivo truncado y te comés todas las fichas. rename es
   atómico en el mismo sistema de archivos, así que o está la versión
   vieja entera o la nueva entera. */
function escribirJson(raiz, archivo, datos) {
  const destino = path.join(raiz, archivo)
  const temp = destino + '.tmp'
  fs.writeFileSync(temp, JSON.stringify(datos, null, 2) + '\n')
  fs.renameSync(temp, destino)
}

/* LA GUARDA, escrita UNA vez. Devuelve la ruta real si cae adentro del
   vault, y null si no.

   Va con realpathSync y no con resolve: resolve normaliza los ".." pero
   no sigue los symlinks, así que un enlace adentro de la carpeta
   apuntando afuera lo pasaría de largo.

   El separador final del startsWith importa: sin él "/vault-malicioso"
   pasaría la prueba de "/vault".

   La usan LOS DOS caminos —listar y servir— y eso no es prolijidad. Al
   principio sólo la tenía el de servir, y el índice llegó a listar un
   symlink a /etc/hosts como si fuera un mp4 de 213 bytes: no se podía
   descargar, pero el tamaño y la fecha del otro lado del enlace ya
   estaban publicados. Una guarda que no cubre todas las salidas no es
   una guarda. */
function dentro(raiz, abs) {
  try {
    const r = fs.realpathSync(abs)
    return r === raiz || r.startsWith(raiz + path.sep) ? r : null
  } catch {
    return null
  }
}

/* Recorre la carpeta y devuelve un plano de lo que hay. Sólo hechos
   del sistema de archivos: qué es, cuánto pesa y cuándo entró. Lo que
   significa cada clip —el nombre que se lee, si es nativo o web, de
   dónde salió— es de la fase 3 y no se inventa acá. */
function recorrer(raiz, rel = '', nivel = 0) {
  if (nivel > HONDO) return []
  let entradas
  try {
    entradas = fs.readdirSync(path.join(raiz, rel), { withFileTypes: true })
  } catch {
    return []
  }
  const salida = []
  for (const e of entradas) {
    if (oculto(e.name)) continue
    const r = rel ? `${rel}/${e.name}` : e.name
    /* La misma guarda que al servir, y ANTES de mirar nada más: si el
       nombre es un enlace que sale del vault, acá se termina. */
    const abs = dentro(raiz, path.join(raiz, r))
    if (!abs) continue
    if (e.isDirectory()) {
      salida.push(...recorrer(raiz, r, nivel + 1))
      continue
    }
    const ext = path.extname(e.name).toLowerCase()
    if (!TIPOS[ext]) continue
    let s
    try {
      s = fs.statSync(abs)
    } catch {
      continue
    }
    /* Los cuadros salen del contenedor y no de una estimación: es lo que
       hace posible que las flechas muevan UN cuadro exacto. Se resuelve
       acá, en el servidor, porque el navegador no expone el dato —
       requestVideoFrameCallback lo daría sólo reproduciendo, y para eso
       ya sería tarde. Validado contra 9 archivos: cuadros × duración de
       cuadro reproduce la duración que reporta el navegador. */
    const c = VIDEO.has(ext) ? cuadrosDe(abs, s) : null

    salida.push({
      ruta: r,
      /* null cuando es una imagen o cuando el contenedor no se pudo
         leer. Quien lo use tiene que contemplar que no esté, en vez de
         recibir un número inventado. */
      cuadro: c?.cuadro ?? null,
      fps: c?.fps ?? null,
      cuadros: c?.cuadros ?? null,
      cuadroVariable: c?.variable ?? null,
      /* El nombre del archivo sin extensión. Es materia prima para la
         fase 3, no el nombre final que se muestra. */
      archivo: path.basename(e.name, ext),
      /* La carpeta que lo contiene, que es como se va a saber si es
         nativo o web: lo clasifica dónde lo soltaste. */
      carpeta: path.dirname(r) === '.' ? '' : path.dirname(r),
      ext,
      clase: VIDEO.has(ext) ? 'video' : 'imagen',
      bytes: s.size,
      /* Las dos fechas, sin elegir. "Más reciente" puede querer decir
         cuándo entró al vault (birthtime) o cuándo se tocó por última
         vez (mtime); en macOS las dos existen. Cuál manda lo decide la
         fase 3, mirando datos de verdad. */
      creado: (s.birthtime?.getTime() ? s.birthtime : s.mtime).toISOString(),
      modificado: s.mtime.toISOString(),
    })
  }
  return salida
}

/* bytes=0-499 · bytes=500- · bytes=-500 (el sufijo son los últimos N).
   Devuelve null si no hay rango pedido, 'imposible' si lo pedido cae
   fuera del archivo —que en HTTP es un 416 y no un 404. */
function pedirRango(cabecera, total) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((cabecera ?? '').trim())
  if (!m) return null
  const [, a, b] = m
  if (a === '' && b === '') return null
  let inicio, fin
  if (a === '') {
    const largo = Number(b)
    if (!largo) return 'imposible'
    inicio = Math.max(0, total - largo)
    fin = total - 1
  } else {
    inicio = Number(a)
    fin = b === '' ? total - 1 : Math.min(Number(b), total - 1)
  }
  if (!Number.isFinite(inicio) || !Number.isFinite(fin)) return 'imposible'
  if (inicio > fin || inicio >= total) return 'imposible'
  return { inicio, fin }
}

const json = (res, codigo, cuerpo) => {
  res.statusCode = codigo
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(cuerpo))
}

/* ═══════════ LOS BOCETOS ═══════════
   El único endpoint de este archivo que NO toca el vault: escribe
   adentro del repo, en src/privado/bocetos/. Va dicho fuerte porque
   rompe la simetría de todo lo demás, y la razón es que un boceto es
   código —tiene que estar donde Vite lo compile y donde tu editor y un
   agente lo puedan abrir— y no un medio.

   LA CARPETA ES FIJA Y SALE DE ESTE ARCHIVO, no de nada que mande el
   cliente: se deriva de import.meta.url, así que no depende ni del
   cwd. Lo único que llega de afuera es el nombre, y de él sólo
   sobreviven letras, números y guiones. Con ese alfabeto no hay ".."
   que construir: el path traversal no se bloquea, no se puede escribir.

   NO PISA NADA. Si el archivo existe se devuelve 409 y el que llama se
   entera: un botón que silenciosamente reemplaza lo que escribiste no
   es un botón, es una trampa. */
const BOCETOS_DIR = fileURLToPath(new URL('../src/privado/bocetos/', import.meta.url))

const refDeBoceto = (crudo) => {
  if (typeof crudo !== 'string') return null
  const s = crudo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s && s.length <= 60 ? s : null
}

/* "sheet-que-se-estira" → "SheetQueSeEstira". Un componente de React
   tiene que empezar en mayúscula o JSX lo trata como una etiqueta HTML.
   Y si el nombre arranca con número —"3-puntos"— se le antepone una
   letra, porque un identificador no puede. */
const identificadorDe = (ref) => {
  const id = ref
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
  return /^[0-9]/.test(id) ? 'B' + id : id
}

/* LA PLANTILLA ES CASI NADA, y es a propósito: lo que se abre tiene que
   ser una hoja en blanco con el mínimo para que dibuje algo, no un
   ejemplo que después hay que borrar. El div al 100% existe porque el
   frame ya tiene el tamaño; sin eso el primer boceto nace de 0 de alto y
   parece que no funcionó. */
/* ═══════════ PUBLICAR — del playground a la library ═══════════
   El segundo endpoint que escribe adentro del repo, con el mismo
   permiso que __boceto: lo que produce es producto, no un medio del
   vault. Se publica DESDE EL TABLERO —el clic derecho sobre un frame—
   porque ahí es donde está tu trabajo; el vault es lo externo y no
   publica nada.

   Hace DOS cosas y las dos tienen que quedar o ninguna:

     1. copia el archivo del demo al lado público de la frontera:
          una grabación  →  public/piezas/<slug><ext>   (pieza App)
          un boceto      →  src/piezas/<slug>.tsx       (pieza Web)
        El vault y src/privado/ no viajan al deploy; por eso el copiado
        existe. Y es COPIA, no mudanza: el frame del tablero sigue
        apuntando a lo suyo — desde acá, la pieza se edita en su archivo
        publicado.
     2. agrega la entrada a src/pieces.ts, que es el inventario real:
        de ahí salen la página, el índice y el vercel.json del prebuild.

   Si el segundo paso falla, el primero se deshace. No se pisa nada
   nunca: publicar dos veces es un 409, no un reemplazo silencioso.

   LA PLATAFORMA LA DICE EL FRAME, no un selector: una grabación ES una
   pieza App y un boceto ES una pieza Web — es la regla de `platform`
   (App va en video, Web va viva) leída al revés. */
const PIEZAS_DIR = fileURLToPath(new URL('../public/piezas/', import.meta.url))
const PIEZAS_SRC = fileURLToPath(new URL('../src/piezas/', import.meta.url))
const PIEZAS_TS = fileURLToPath(new URL('../src/pieces.ts', import.meta.url))

/* Los textos viajan a un archivo .ts entre comillas simples: se escapan
   la barra y la comilla, y los saltos de línea se vuelven espacio — un
   nombre o una descripción no tienen renglones. */
const aLiteral = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\s+/g, ' ').trim()

function agregarPieza(nombre, desc, plataforma, video) {
  const src = fs.readFileSync(PIEZAS_TS, 'utf8')

  /* El duplicado se chequea por SLUG y no por nombre: dos nombres
     distintos que cayeran en la misma URL romperían el rewrite. Se lee
     el archivo fresco en cada pedido — el import de arriba quedó
     congelado al arrancar el servidor y no vería lo recién publicado. */
  const tomados = [...src.matchAll(/name: '((?:[^'\\]|\\.)*)'/g)].map((m) =>
    slugDePieza(m[1].replace(/\\(.)/g, '$1')),
  )
  if (tomados.includes(slugDePieza(nombre))) return { error: 'ya hay una pieza con esa URL' }

  const entrada = [
    '  {',
    `    name: '${aLiteral(nombre)}',`,
    `    platform: '${plataforma}',`,
    /* La línea es opcional (2026-09-07): vacía, no se escribe el campo,
       y el detalle no dibuja el párrafo. */
    ...(desc ? [`    desc: '${aLiteral(desc)}',`] : []),
    /* Una pieza Web no lleva video: su demo es el archivo en
       src/piezas/, que se resuelve por slug — ver demos.tsx. */
    ...(video ? [`    video: '${video}',`] : []),
    '  },',
  ].join('\n')

  /* La lista vacía se reemplaza entera; con piezas, la nueva entra antes
     del `]` que cierra el array — que es lo último del archivo, así que
     el último corchete del texto es el suyo. */
  let siguiente
  if (/PIECES: Piece\[\] = \[\]/.test(src)) {
    siguiente = src.replace('PIECES: Piece[] = []', `PIECES: Piece[] = [\n${entrada}\n]`)
  } else {
    const cierre = src.lastIndexOf(']')
    if (cierre < 0) return { error: 'pieces.ts no tiene la forma esperada' }
    siguiente = src.slice(0, cierre) + entrada + '\n' + src.slice(cierre)
  }

  const temp = PIEZAS_TS + '.tmp'
  fs.writeFileSync(temp, siguiente)
  fs.renameSync(temp, PIEZAS_TS)
  return { ok: true }
}

const plantillaDeBoceto = (ref) => `/* ${identificadorDe(ref)} — un boceto del lienzo.

   Escribí lo que quieras acá y guardá: Vite lo recarga en el frame sin
   tocar la página. Los tokens del sistema (--ink, --surface, --canvas,
   las duraciones y las curvas) están disponibles como variables CSS. */
export default function ${identificadorDe(ref)}() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--ink)',
      }}
    >
      ${identificadorDe(ref)}
    </div>
  )
}
`

export function vaultMedia(dirCrudo) {
  /* Se resuelve UNA vez, al arrancar, y con realpath: la comparación
     de después es entre rutas reales, así que un symlink no la
     puede saltear. */
  let raiz = null
  let motivo = null
  if (!dirCrudo) {
    motivo = 'VAULT_DIR no está definida en .env.local'
  } else {
    try {
      const abs = fs.realpathSync(path.resolve(dirCrudo))
      if (!fs.statSync(abs).isDirectory()) motivo = `VAULT_DIR no es una carpeta: ${abs}`
      else raiz = abs
    } catch {
      motivo = `VAULT_DIR apunta a algo que no existe: ${dirCrudo}`
    }
  }

  return {
    name: 'vault-media',
    apply: 'serve',
    configureServer(server) {
      /* Se dice en el arranque del servidor, que es donde se mira
         cuando algo no aparece. */
      const log = server.config.logger
      if (raiz) log.info(`  vault    ${raiz}`, { timestamp: false })
      else log.warn(`  vault    sin conectar — ${motivo}`, { timestamp: false })

      server.middlewares.use('/vault-media', (req, res, next) => {
        /* ─── ESCRIBIR UNA FICHA ───
           El único camino de escritura de todo el puente, y está
           acotado a más no poder: un solo destino posible —el archivo
           de fichas en la raíz— y una sola forma de clave, la ruta de
           un clip QUE YA EXISTE en el índice.

           Esa validación es la guarda: no se resuelve ninguna ruta con
           lo que llega del cliente, así que no hay traversal posible
           por construcción, no porque haya un filtro que lo atrape. */
        /* ─── SUBIR UN CLIP ───
           Los bytes van CRUDOS en el cuerpo y los metadatos en la query,
           no en un multipart. Un multipart habría que parsearlo —o traer
           una dependencia para hacerlo— y lo único que se sube acá es un
           archivo por vez: el sobre no aporta nada y sí agrega superficie.

           Se escribe en streaming a un temporal. Nunca se junta el
           archivo entero en memoria: un video de 400MB no tiene por qué
           pasar por el heap para llegar al disco. */
        if (req.method === 'POST' && (req.url || '').split('?')[0] === '/__subir') {
          if (!raiz) return json(res, 409, { error: motivo })

          const q = new URLSearchParams((req.url || '').split('?')[1] ?? '')
          const base = nombreSano(q.get('nombre'))
          if (!base) return json(res, 400, { error: 'nombre no admitido' })

          let carpeta
          try {
            carpeta = carpetaDe(raiz, q.get('fuente'))
          } catch (e) {
            return json(res, 500, { error: String(e?.message ?? e) })
          }
          if (!carpeta) return json(res, 400, { error: 'fuente no admitida' })

          const nombre = libre(carpeta, base)
          if (!nombre) return json(res, 409, { error: 'demasiados con ese nombre' })

          /* El temporal va en la MISMA carpeta que el destino: rename
             sólo es atómico dentro del mismo sistema de archivos, y
             /tmp puede estar en otro. Empieza con punto, así que si algo
             sale mal lo que queda tirado ya está afuera de todo lo que
             se sirve y de todo lo que se lista. */
          const temp = path.join(carpeta, `.subiendo-${process.pid}-${Date.now()}`)
          const destino = path.join(carpeta, nombre)
          const flujo = fs.createWriteStream(temp)
          let bytes = 0
          let cortado = false

          const limpiar = () => {
            try {
              fs.unlinkSync(temp)
            } catch {}
          }

          req.on('data', (c) => {
            bytes += c.length
            if (bytes > PESO_MAX && !cortado) {
              cortado = true
              flujo.destroy()
              req.destroy()
              limpiar()
            }
          })
          req.on('error', () => {
            if (!cortado) {
              cortado = true
              flujo.destroy()
              limpiar()
            }
          })
          flujo.on('error', () => {
            if (!cortado) {
              cortado = true
              limpiar()
              json(res, 500, { error: 'no se pudo escribir' })
            }
          })
          req.pipe(flujo)

          flujo.on('finish', () => {
            if (cortado) return
            /* Un cuerpo vacío deja un archivo de 0 bytes que después
               aparece en la grilla como un clip roto. Mejor no crearlo. */
            if (!bytes) {
              limpiar()
              return json(res, 400, { error: 'cuerpo vacío' })
            }
            try {
              fs.renameSync(temp, destino)
            } catch (e) {
              limpiar()
              return json(res, 500, { error: String(e?.message ?? e) })
            }
            const rel = path.relative(raiz, destino).split(path.sep).join('/')
            return json(res, 200, { ok: true, ruta: rel, bytes })
          })
          return
        }

        /* Las vistas del playground. Mismo esqueleto que la ficha —cuerpo
           acotado, JSON o 400, saneado antes de tocar el disco, escritura
           atómica— y por eso la lectura del cuerpo se comparte. */
        if (req.method === 'PUT' && (req.url || '').split('?')[0] === '/__vistas') {
          if (!raiz) return json(res, 409, { error: motivo })
          let cuerpo = ''
          req.setEncoding('utf8')
          req.on('data', (c) => {
            cuerpo += c
            if (cuerpo.length > 512 * 1024) req.destroy()
          })
          req.on('end', () => {
            let d
            try {
              d = JSON.parse(cuerpo)
            } catch {
              return json(res, 400, { error: 'json inválido' })
            }
            const vistas = sanearVistas(d?.vistas)
            try {
              escribirJson(raiz, VISTAS, { vistas })
            } catch (e) {
              return json(res, 500, { error: String(e?.message ?? e) })
            }
            return json(res, 200, { ok: true, vistas })
          })
          return
        }

        if (req.method === 'PUT' && (req.url || '').split('?')[0] === '/__ficha') {
          if (!raiz) return json(res, 409, { error: motivo })
          let cuerpo = ''
          req.setEncoding('utf8')
          req.on('data', (c) => {
            cuerpo += c
            /* Un cuerpo desmedido se corta acá y no cuando ya está en
               memoria. */
            if (cuerpo.length > 64 * 1024) req.destroy()
          })
          req.on('end', () => {
            let d
            try {
              d = JSON.parse(cuerpo)
            } catch {
              return json(res, 400, { error: 'json inválido' })
            }
            const ruta = typeof d?.ruta === 'string' ? d.ruta : ''
            const existe = recorrer(raiz).some((c) => c.ruta === ruta)
            if (!existe) return json(res, 404, { error: 'ese clip no está en el vault' })

            /* Sólo los campos conocidos, recortados. Lo que venga de más
               se descarta en vez de guardarse. */
            const limpia = {}
            for (const k of FICHA_CAMPOS) {
              const v = d?.ficha?.[k]
              if (typeof v === 'string' && v.trim()) limpia[k] = v.slice(0, LARGO_MAX)
            }

            const todas = leerJson(raiz, FICHAS)
            /* Una ficha vacía se BORRA en vez de quedar como un objeto
               sin nada: si vaciás los campos, el archivo queda como si
               nunca la hubieras escrito. */
            if (Object.keys(limpia).length) todas[ruta] = limpia
            else delete todas[ruta]

            try {
              escribirJson(raiz, FICHAS, todas)
            } catch (e) {
              return json(res, 500, { error: String(e?.message ?? e) })
            }
            return json(res, 200, { ok: true, ficha: todas[ruta] ?? null })
          })
          return
        }

        /* ─── RENOMBRAR ───
           La ruta NUNCA sale del cliente: se busca el clip en el índice
           y se usa la que el servidor ya conoce. El cliente sólo aporta
           un nombre, y ese nombre no puede traer separadores, ni
           empezar con punto, ni cambiar la extensión.

           No pisa: si ya existe uno así, devuelve 409 en vez de
           sobreescribir. Un renombre que se come otro archivo es
           exactamente la clase de error que no tiene vuelta. */
        if (req.method === 'PUT' && (req.url || '').split('?')[0] === '/__renombrar') {
          if (!raiz) return json(res, 409, { error: motivo })
          let cuerpo = ''
          req.setEncoding('utf8')
          req.on('data', (c) => {
            cuerpo += c
            if (cuerpo.length > 8 * 1024) req.destroy()
          })
          req.on('end', () => {
            let d
            try {
              d = JSON.parse(cuerpo)
            } catch {
              return json(res, 400, { error: 'json inválido' })
            }
            const ruta = typeof d?.ruta === 'string' ? d.ruta : ''
            const clip = recorrer(raiz).find((c) => c.ruta === ruta)
            if (!clip) return json(res, 404, { error: 'ese clip no está en el vault' })

            const base = baseSana(d?.nombre)
            if (!base) return json(res, 400, { error: 'nombre no admitido' })

            const desde = dentro(raiz, path.join(raiz, ruta))
            if (!desde) return json(res, 404, { error: 'ese clip no está en el vault' })
            const carpeta = path.dirname(desde)
            const destino = path.join(carpeta, base + path.extname(ruta))
            if (path.dirname(destino) !== carpeta) return json(res, 400, { error: 'nombre no admitido' })
            if (destino === desde) return json(res, 200, { ok: true, ruta })
            if (fs.existsSync(destino)) return json(res, 409, { error: 'ya hay uno con ese nombre' })

            try {
              fs.renameSync(desde, destino)
            } catch (e) {
              return json(res, 500, { error: String(e?.message ?? e) })
            }

            /* LA FICHA VIAJA CON EL ARCHIVO. Está indexada por ruta, así
               que sin esto renombrar te borraba lo que habías escrito. */
            const nuevaRuta = path.relative(raiz, destino).split(path.sep).join('/')
            const todas = leerJson(raiz, FICHAS)
            if (todas[ruta]) {
              todas[nuevaRuta] = todas[ruta]
              delete todas[ruta]
              try {
                escribirJson(raiz, FICHAS, todas)
              } catch {
                /* el archivo ya se renombró; la ficha se recupera sola
                   la próxima vez que la escribas */
              }
            }
            return json(res, 200, { ok: true, ruta: nuevaRuta })
          })
          return
        }

        /* ─── A LA PAPELERA ───
           MUEVE, no borra. Un unlink desde una app de estudio es
           irreversible y no hay undo que lo salve; la papelera es lo que
           hace Finder y te deja recuperarlo. Cuesta más código y vale la
           pena.

           Si la papelera no está donde se espera —otro sistema, o el
           vault en otro volumen, que hace fallar el rename con EXDEV—
           se responde con el error en vez de caer a borrar de verdad.
           Fallar es mejor que borrar algo que no se puede recuperar. */
        /* CREAR UN BOCETO. No pide `raiz`: un boceto es código del repo y
           no tiene nada que ver con tu carpeta de clips, así que se puede
           escribir uno con el vault desconectado. Ver BOCETOS_DIR. */
        if (req.method === 'POST' && (req.url || '').split('?')[0] === '/__boceto') {
          const q = new URLSearchParams((req.url || '').split('?')[1] ?? '')
          const ref = refDeBoceto(q.get('nombre'))
          if (!ref) return json(res, 400, { error: 'nombre no admitido' })

          const destino = path.join(BOCETOS_DIR, ref + '.tsx')
          try {
            fs.mkdirSync(BOCETOS_DIR, { recursive: true })
            /* 'wx' falla si existe, y esa es toda la guarda: el chequeo y
               la escritura son la misma operación, así que no hay ventana
               entre "no está" y "lo escribo". */
            fs.writeFileSync(destino, plantillaDeBoceto(ref), { flag: 'wx' })
          } catch (e) {
            if (e?.code === 'EEXIST') return json(res, 409, { error: 'ya existe', ref })
            return json(res, 500, { error: String(e?.message ?? e) })
          }
          return json(res, 200, { ok: true, ref })
        }

        /* PUBLICAR UN FRAME COMO PIEZA. El porqué y las dos escrituras
           están arriba, en el bloque de PIEZAS_DIR. Dos ramas por el
           tipo del frame: `boceto` publica Web, lo demás es un clip del
           vault y publica App. */
        if (req.method === 'POST' && (req.url || '').split('?')[0] === '/__publicar') {
          let cuerpo = ''
          req.setEncoding('utf8')
          req.on('data', (c) => {
            cuerpo += c
            if (cuerpo.length > 8 * 1024) req.destroy()
          })
          req.on('end', () => {
            let d
            try {
              d = JSON.parse(cuerpo)
            } catch {
              return json(res, 400, { error: 'json inválido' })
            }

            const nombre = String(d?.nombre ?? '').trim()
            const desc = String(d?.desc ?? '').trim()
            if (!nombre || nombre.length > 80) return json(res, 400, { error: 'nombre no admitido' })
            if (desc.length > 200) return json(res, 400, { error: 'descripción demasiado larga' })
            const s = slugDePieza(nombre)
            if (!s) return json(res, 400, { error: 'con ese nombre no se puede armar una URL' })

            /* Resuelto el origen, las dos ramas terminan igual: copiar
               con EXCL, anotar en pieces.ts, y deshacer la copia si la
               anotación no entró. */
            const publicar = (origen, destino, plataforma, video) => {
              try {
                fs.mkdirSync(path.dirname(destino), { recursive: true })
                /* COPYFILE_EXCL: chequeo y copia en una sola operación,
                   igual que el 'wx' de los bocetos. */
                fs.copyFileSync(origen, destino, fs.constants.COPYFILE_EXCL)
              } catch (e) {
                if (e?.code === 'EEXIST')
                  return json(res, 409, { error: 'ya hay una pieza publicada con esa URL' })
                return json(res, 500, { error: String(e?.message ?? e) })
              }
              try {
                const r = agregarPieza(nombre, desc, plataforma, video)
                if (r.error) {
                  fs.unlinkSync(destino)
                  return json(res, 409, { error: r.error })
                }
              } catch (e) {
                try {
                  fs.unlinkSync(destino)
                } catch {}
                return json(res, 500, { error: String(e?.message ?? e) })
              }
              return json(res, 200, { ok: true, slug: s })
            }

            /* ─── UN BOCETO → PIEZA WEB ───
               No pide el vault: el archivo vive en el repo. El ref pasa
               por el mismo alfabeto con el que se creó, así que no hay
               ruta que armar hacia afuera de la carpeta. */
            if (d?.tipo === 'boceto') {
              const ref = refDeBoceto(d?.ref)
              if (!ref) return json(res, 400, { error: 'ref no admitido' })
              const origen = path.join(BOCETOS_DIR, ref + '.tsx')
              if (!fs.existsSync(origen)) return json(res, 404, { error: 'no existe' })
              return publicar(origen, path.join(PIEZAS_SRC, s + '.tsx'), 'Web', null)
            }

            /* ─── UN CLIP → PIEZA APP ─── */
            if (!raiz) return json(res, 409, { error: motivo })
            const origen = dentro(raiz, path.join(raiz, String(d?.ruta ?? '')))
            if (!origen) return json(res, 404, { error: 'no existe' })
            const ext = path.extname(origen).toLowerCase()
            if (!VIDEO.has(ext))
              return json(res, 400, { error: 'una pieza App se demuestra con una grabación' })
            return publicar(origen, path.join(PIEZAS_DIR, s + ext), 'App', `/piezas/${s}${ext}`)
          })
          return
        }

        if (req.method === 'POST' && (req.url || '').split('?')[0] === '/__papelera') {
          if (!raiz) return json(res, 409, { error: motivo })
          let cuerpo = ''
          req.setEncoding('utf8')
          req.on('data', (c) => {
            cuerpo += c
            if (cuerpo.length > 8 * 1024) req.destroy()
          })
          req.on('end', () => {
            let d
            try {
              d = JSON.parse(cuerpo)
            } catch {
              return json(res, 400, { error: 'json inválido' })
            }
            const ruta = typeof d?.ruta === 'string' ? d.ruta : ''
            if (!recorrer(raiz).some((c) => c.ruta === ruta)) {
              return json(res, 404, { error: 'ese clip no está en el vault' })
            }
            const desde = dentro(raiz, path.join(raiz, ruta))
            if (!desde) return json(res, 404, { error: 'ese clip no está en el vault' })

            const papelera = path.join(os.homedir(), '.Trash')
            let stat
            try {
              stat = fs.statSync(papelera)
            } catch {
              return json(res, 501, { error: 'no hay papelera en este sistema' })
            }
            if (!stat.isDirectory()) return json(res, 501, { error: 'no hay papelera en este sistema' })

            const nombre = libre(papelera, path.basename(desde))
            if (!nombre) return json(res, 409, { error: 'demasiados con ese nombre en la papelera' })
            try {
              fs.renameSync(desde, path.join(papelera, nombre))
            } catch (e) {
              return json(res, 500, { error: String(e?.message ?? e) })
            }

            const todas = leerJson(raiz, FICHAS)
            if (todas[ruta]) {
              delete todas[ruta]
              try {
                escribirJson(raiz, FICHAS, todas)
              } catch {}
            }
            return json(res, 200, { ok: true, a: nombre })
          })
          return
        }

        if (req.method !== 'GET' && req.method !== 'HEAD') return next()

        let pedido
        try {
          pedido = decodeURIComponent((req.url || '/').split('?')[0])
        } catch {
          return json(res, 400, { error: 'ruta mal codificada' })
        }

        /* El índice: qué hay en el vault, y si el vault existe. */
        /* Se sanea también AL LEER y no sólo al escribir: el archivo se
           puede editar a mano, y un valor roto ahí no tiene que poder
           romper el lienzo. */
        if (pedido === '/__vistas') {
          if (!raiz) return json(res, 200, { conectado: false, motivo, vistas: [] })
          return json(res, 200, { conectado: true, vistas: sanearVistas(leerJson(raiz, VISTAS)?.vistas) })
        }

        if (pedido === '/__indice') {
          if (!raiz) return json(res, 200, { conectado: false, motivo, clips: [] })
          const fichas = leerJson(raiz, FICHAS)
          const clips = recorrer(raiz).map((c) => ({ ...c, ficha: fichas[c.ruta] ?? null }))
          return json(res, 200, { conectado: true, carpeta: raiz, clips })
        }

        /* ─── EL TÍTULO Y EL ÍCONO DE UN LINK ───
           El porqué entero está en tarjeta-link.mjs. Acá sólo hay dos
           decisiones de ruteo:

           VA ANTES DEL CORTE DE `raiz` porque es el único camino del
           puente que NO toca el vault. Una nota con un link se tiene
           que poder leer igual con VAULT_DIR desconectada: el link no
           es un archivo tuyo.

           Y NO VALIDA LA URL ACÁ. La valida tarjetaDe, que es la que
           sale a buscarla — dos validaciones de lo mismo en dos
           archivos se separan solas. */
        if (pedido === '/__link') {
          const url = new URLSearchParams((req.url || '').split('?')[1] ?? '').get('url')
          if (!url) return json(res, 400, { error: 'falta url' })
          tarjetaDe(url).then(
            (t) => json(res, 200, t),
            (e) => json(res, 500, { error: String(e?.message ?? e) }),
          )
          return
        }

        if (!raiz) return json(res, 404, { error: motivo })

        const rel = pedido.replace(/^\/+/, '')
        if (!rel) return json(res, 404, { error: 'sin ruta' })
        if (rel.split('/').some(oculto)) return json(res, 404, { error: 'no' })

        const ext = path.extname(rel).toLowerCase()
        const tipo = TIPOS[ext]
        /* La lista blanca decide ANTES de tocar el disco. Un .md no
           llega ni a existir para este servidor. */
        if (!tipo) return json(res, 404, { error: 'extensión no servida' })

        const abs = dentro(raiz, path.resolve(raiz, rel))
        if (!abs) return json(res, 404, { error: 'fuera del vault o no existe' })

        let s
        try {
          s = fs.statSync(abs)
        } catch {
          return json(res, 404, { error: 'no existe' })
        }
        if (!s.isFile()) return json(res, 404, { error: 'no es un archivo' })

        res.setHeader('content-type', tipo)
        res.setHeader('accept-ranges', 'bytes')
        res.setHeader('last-modified', s.mtime.toUTCString())
        /* no-store y no un ETag: en este vault los archivos se
           REEMPLAZAN —regrabás el clip y querés ver el nuevo—, y en
           localhost volver a pedirlo no cuesta nada. Un caché acá sólo
           podría hacer que mires la versión vieja sin enterarte. */
        res.setHeader('cache-control', 'no-store')

        const r = pedirRango(req.headers.range, s.size)
        if (r === 'imposible') {
          res.statusCode = 416
          res.setHeader('content-range', `bytes */${s.size}`)
          return res.end()
        }

        if (r) {
          res.statusCode = 206
          res.setHeader('content-range', `bytes ${r.inicio}-${r.fin}/${s.size}`)
          res.setHeader('content-length', r.fin - r.inicio + 1)
        } else {
          res.statusCode = 200
          res.setHeader('content-length', s.size)
        }

        if (req.method === 'HEAD') return res.end()
        const flujo = r
          ? fs.createReadStream(abs, { start: r.inicio, end: r.fin })
          : fs.createReadStream(abs)
        flujo.on('error', () => res.destroy())
        res.on('close', () => flujo.destroy())
        flujo.pipe(res)
      })
    },
  }
}
