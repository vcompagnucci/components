/* ═══════════════════════════════════════════════════════════════
   LA TARJETA DE UN LINK — el título y el favicon de una página.

   Existe para UNA cosa: que un link pegado en una nota se lea como
   "🐙 tab-layout.tsx" y no como cuatro renglones de URL. Es lo que hace
   Notion con una mención de link, y hace falta salir a buscarlo porque
   ni el título ni el ícono están en la URL.

   ─── POR QUÉ EN EL SERVIDOR Y NO EN EL CLIENTE ───
   Un fetch desde el navegador a github.com no puede leer la respuesta:
   no hay CORS y no lo va a haber. Node no tiene esa restricción. Y de
   paso evita la alternativa fea —pedirle el favicon a un servicio de
   terceros tipo google.com/s2/favicons, que le cuenta a Google cada
   link que anotás.

   ─── LAS TRES GUARDAS ───
   Mismo criterio que el puente de medios, porque esto también sale a
   tocar algo que no controlamos:

   1 · SÓLO http Y https. Un file:// desde acá leería el disco del que
       corre el servidor.

   2 · NADA HACIA ADENTRO DE LA RED. localhost, 127.x, 10.x, 192.168.x,
       172.16–31.x, 169.254.x, ::1 y los .local quedan afuera: sin esto
       una nota con http://192.168.1.1/reboot convierte a este endpoint
       en un pulsador remoto contra la red de quien corre el vault.
       Se chequea el HOST LITERAL, no lo que resuelve el DNS — un
       nombre público apuntado a una IP privada pasaría. Es una guarda
       proporcionada a la amenaza real acá (una URL que vos mismo
       pegaste en tu nota), no un filtro de SSRF completo, y queda
       dicho para que nadie lo confunda con uno.

   3 · LA RESPUESTA SE CORTA. Seis segundos de reloj y 1MB de cuerpo,
       leídos en streaming. Un servidor que chorrea para siempre no
       puede colgar al que está mirando un clip.

       EL TECHO ESTUVO EN 256KB Y ERA MUY BAJO, con la excusa de que
       "el <head> de cualquier página entra de sobra". Medido sobre
       una nota real del vault, es falso:

         youtube.com/watch   <title> en el byte 697.911
                             </head> en el 707.807
                             página entera 1.300.994

       O sea que YouTube mete 700KB de configuración inline ANTES de
       decir cómo se llama el video. Con 256KB el fetch salía bien
       —ok:true— y sin título, y el link se etiquetaba "youtube.com":
       un fracaso silencioso, que es la peor clase. 1MB le deja 300KB
       de aire y sigue acotado; el que corta de verdad es el reloj.

   ─── EL CACHÉ ES DE LA SESIÓN ───
   En memoria, como el de los cuadros, y sin TTL: se vacía al reiniciar
   Vite. Un título no cambia mientras mirás un vault, y persistirlo
   metería un archivo de caché adentro de una carpeta que es tuya —el
   mismo motivo por el que las fichas van en UN solo archivo oculto.
   Los fracasos también se cachean: si dribbble te bloqueó, reintentar
   en cada render son seis segundos de espera por cada render.
   ═══════════════════════════════════════════════════════════════ */

const RELOJ = 6000
const TECHO = 1024 * 1024

/* Un navegador de verdad. No es evasión: varios sitios devuelven un
   cuerpo distinto —o ninguno— a un agente que no reconocen, y lo que
   se quiere es exactamente lo que vería el navegador que tenés
   abierto al lado. */
const AGENTE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

const PRIVADO =
  /^(localhost|127\.|0\.0\.0\.0$|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)|\.local$/i

const cache = new Map()

/* ─── ENTIDADES ───
   Medido en el título real de X: `&quot;` y `&#x27;`. Sin esto la
   etiqueta muestra "Ever wanted to build Apple Music&#x27;s mini
   player", que es peor que la URL cruda. */
const NOMBRADAS = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  middot: '·',
}

const desentidad = (s) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (todo, cuerpo) => {
    if (cuerpo[0] === '#') {
      const n =
        cuerpo[1] === 'x' || cuerpo[1] === 'X'
          ? parseInt(cuerpo.slice(2), 16)
          : parseInt(cuerpo.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : todo
    }
    return NOMBRADAS[cuerpo.toLowerCase()] ?? todo
  })

/* ─── EL ÍCONO ───
   Orden MEDIDO, no supuesto (2026-08-23):

     <link rel="icon">        github ✓ (favicon.svg)   x ✓ (/favicon.ico)
     <link rel="apple-touch-icon">
                              github ✗ (no lo declara)
                              x ✓ pero /apple-touch-icon.png devuelve
                                el HTML de la app, 276KB de text/html
     <origen>/favicon.ico     5 de 6 orígenes probados; dribbble da 404

   O sea que ninguno de los tres alcanza solo y el orden importa: el
   declarado gana porque es el que el sitio eligió, y /favicon.ico
   queda de red — es una convención, no una promesa.

   El apple-touch-icon quedó en el medio y no primero, que era la idea
   inicial: la especificación de Apple pide que sea opaco, así que
   sería el único que no desaparece sobre fondo oscuro. Se descartó
   como primera opción porque el caso de X muestra que estar declarado
   no significa que se pueda bajar. */
const RANGO = { icon: 0, 'shortcut icon': 1, 'apple-touch-icon': 2 }

function iconoDe(cabeza, base) {
  let mejor = null
  for (const m of cabeza.matchAll(/<link\b[^>]*>/gi)) {
    const etiqueta = m[0]
    const rel = etiqueta.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1]?.trim().toLowerCase()
    const href = etiqueta.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]
    if (!rel || !href) continue
    /* "alternate icon" cae acá por el endsWith: es el PNG que github
       pone al lado de su SVG, y sirve igual. */
    const puesto = RANGO[rel] ?? (rel.endsWith('icon') ? 3 : null)
    if (puesto === null) continue
    if (mejor && mejor.puesto <= puesto) continue
    try {
      mejor = { puesto, url: new URL(desentidad(href), base).toString() }
    } catch {}
  }
  return mejor?.url ?? new URL('/favicon.ico', base).toString()
}

export async function tarjetaDe(crudo) {
  if (cache.has(crudo)) return cache.get(crudo)

  let u
  try {
    u = new URL(crudo)
  } catch {
    return { ok: false, motivo: 'url inválida' }
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:')
    return { ok: false, motivo: 'sólo http y https' }
  if (PRIVADO.test(u.hostname)) return { ok: false, motivo: 'host interno' }

  let salida
  try {
    const r = await fetch(u, {
      redirect: 'follow',
      signal: AbortSignal.timeout(RELOJ),
      headers: { 'user-agent': AGENTE, accept: 'text/html,application/xhtml+xml' },
    })
    /* Un 404 igual trae HTML, y su título es "Page not found". Se
       prefiere no decir nada antes que etiquetar el link con eso. */
    if (!r.ok) throw new Error(`http ${r.status}`)

    /* En streaming y con techo: se corta apenas apareció el cierre del
       head, que es donde está todo lo que se busca.

       LA BÚSQUEDA MIRA SÓLO LO NUEVO, no todo lo acumulado. Con el
       techo en 1MB eso dejó de ser un detalle: buscar </head> sobre el
       string entero en cada trozo es cuadrático, y sobre el megabyte
       de YouTube son cientos de pasadas completas. Se busca en el
       trozo recién llegado más 6 caracteres de solapamiento —el largo
       de "</head>" menos uno— para no perder el corte justo cuando cae
       partido entre dos trozos. */
    let html = ''
    let visto = 0
    for await (const trozo of r.body.pipeThrough(new TextDecoderStream('utf-8', { fatal: false }))) {
      html += trozo
      if (/<\/head>/i.test(html.slice(Math.max(0, visto - 6)))) break
      visto = html.length
      if (visto > TECHO) break
    }

    const cabeza = html.split(/<\/head>/i)[0]
    const bruto =
      cabeza.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ??
      cabeza.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
      ''
    const titulo = desentidad(bruto).replace(/\s+/g, ' ').trim()

    salida = {
      ok: true,
      /* Sin título se devuelve ok igual: el ícono solo ya mejora el
         link, y el cliente sabe caer al host para la etiqueta. */
      titulo: titulo || null,
      icono: iconoDe(cabeza, r.url || u.toString()),
      /* ─── A DÓNDE LLEGÓ DE VERDAD ───
         Después de los redirects. Existe por los ACORTADORES: un link
         copiado de X es un t.co, y `t.co` como etiqueta no dice nada
         —ni qué es, ni de qué sitio—. Con la URL final, un t.co que
         lleva a GitHub se etiqueta como GitHub.
         El href del ancla NO cambia: sigue siendo lo que escribiste.
         Esto es para nombrar, no para navegar. */
      final: r.url || null,
    }
  } catch (e) {
    /* EL FRACASO NO ES UN ERROR DEL VAULT y por eso no viaja como uno:
       un sitio caído, sin red, detrás de un login o que corta a un
       agente que no reconoce son todos casos normales de una nota que
       vive años. Se devuelve el ícono que se puede armar sin leer nada
       —la convención de /favicon.ico, que acierta en 5 de los 6
       orígenes medidos— y el cliente pone el host como etiqueta. El
       link nunca queda inservible: sigue siendo clickeable. */
    salida = {
      ok: false,
      motivo: String(e?.message ?? e),
      titulo: null,
      icono: new URL('/favicon.ico', u.origin).toString(),
      /* Sin haber llegado no hay destino que reportar: el cliente cae
         al host de lo que escribiste, que es todo lo que se sabe. */
      final: null,
    }
  }

  cache.set(crudo, salida)
  return salida
}
