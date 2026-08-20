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
import { cuadroDe } from './cuadros.mjs'

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
        if (req.method !== 'GET' && req.method !== 'HEAD') return next()

        let pedido
        try {
          pedido = decodeURIComponent((req.url || '/').split('?')[0])
        } catch {
          return json(res, 400, { error: 'ruta mal codificada' })
        }

        /* El índice: qué hay en el vault, y si el vault existe. */
        if (pedido === '/__indice') {
          if (!raiz) return json(res, 200, { conectado: false, motivo, clips: [] })
          return json(res, 200, { conectado: true, carpeta: raiz, clips: recorrer(raiz) })
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
