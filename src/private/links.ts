/* ═══════════════════════════════════════════════════════════════
   LOS LINKS DE UNA NOTA — encontrarlos, y saber cómo llamarlos.

   ACÁ NO HAY REACT NI RED A PROPÓSITO. Es la parte de la función que
   se puede mirar sola: entra un string, salen tramos. El componente
   dibuja y el servidor busca el título; las reglas de qué ES un link y
   de cómo se lo nombra viven en un archivo que no depende de ninguno de
   los dos.

   LA NOTA SIGUE SIENDO TEXTO PLANO. En el disco, en la ficha y en el
   textarea: un link no es un dato distinto, es un pedazo de la nota que
   resulta ser una URL. Guardar tramos habría creado un segundo modelo
   —el texto y su versión parseada— que se desincroniza el día que
   alguien edite el .lima-vault.json a mano. Acá el parseo se rehace en
   cada render y no puede quedar viejo.
   ═══════════════════════════════════════════════════════════════ */

/* Un tramo es un pedazo de la nota. `desde` es su posición en el texto
   CRUDO, y existe para una sola cosa: cuando tocás la vista de lectura
   para editar, hay que devolver el cursor al carácter que tocaste. Sin
   esa cuenta el cursor cae al final y editar una nota larga se vuelve
   un ejercicio de paciencia. */
export type Tramo =
  | { tipo: 'texto'; texto: string; desde: number }
  | { tipo: 'link'; texto: string; desde: number; url: string }

/* ─── DÓNDE TERMINA UNA URL ───
   El problema no es encontrar dónde empieza —`https://` no es
   ambiguo— sino dónde CORTA, porque el espacio no siempre está: casi
   nadie escribe un punto después de pegar un link, pero sí escribe
   "(ver https://a.com/x)" y "mirá https://a.com/x, está bueno".

   Dos reglas y en este orden, en bucle hasta que ninguna muerda:

   1 · La puntuación final no es parte de la URL. Un punto, una coma,
       dos puntos, un cierre de comillas.

   2 · UN PARÉNTESIS DE CIERRE SÍ PUEDE SERLO. Wikipedia y MDN los
       tienen adentro de la ruta —/wiki/Foo_(bar)— así que no se puede
       tirar a ciegas. Se cuenta: sólo se recorta si hay más cierres
       que aperturas, o sea si ese paréntesis no tiene con quién.

   El bucle importa porque las dos se encadenan: "…/Foo_(bar))." pide
   punto, después paréntesis, y recién ahí queda quieto. */
const PARES: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
const COLA = /[.,;:!?'"“”‘’«»]+$/

const recortar = (crudo: string): string => {
  let s = crudo
  for (;;) {
    const antes = s
    s = s.replace(COLA, '')
    const fin = s.at(-1)
    const abre = fin ? PARES[fin] : undefined
    if (fin && abre) {
      const cierres = s.split(fin).length - 1
      const aperturas = s.split(abre).length - 1
      if (cierres > aperturas) s = s.slice(0, -1)
    }
    if (s === antes) return s
  }
}

/* Que parsee no alcanza: `https://` solo también parsea. Se pide un
   host con punto —o localhost, que es lo que uno pega cuando anota algo
   de su propio servidor— así que "https://" suelto o "http://algo"
   quedan como texto y no como un link roto que promete abrirse. */
const valida = (url: string): boolean => {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    return u.hostname.includes('.') || u.hostname === 'localhost'
  } catch {
    return false
  }
}

export function partir(nota: string): Tramo[] {
  const tramos: Tramo[] = []
  let ultimo = 0
  for (const m of nota.matchAll(/https?:\/\/\S+/gi)) {
    const i = m.index
    const url = recortar(m[0])
    if (!valida(url)) continue
    if (i > ultimo) tramos.push({ tipo: 'texto', texto: nota.slice(ultimo, i), desde: ultimo })
    tramos.push({ tipo: 'link', texto: url, desde: i, url })
    ultimo = i + url.length
  }
  /* La cola —y la nota entera, cuando no hay ningún link— sale por acá.
     Una nota vacía no devuelve ningún tramo, que es lo que deja al
     placeholder hacer su trabajo. */
  if (ultimo < nota.length) tramos.push({ tipo: 'texto', texto: nota.slice(ultimo), desde: ultimo })
  return tramos
}

export const hayLink = (nota: string): boolean =>
  partir(nota).some((t) => t.tipo === 'link')

/* El host sin el www., que no dice nada y ocupa cuatro caracteres de
   una línea que está justa. */
export function hostDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
}

/* ═══════════════════════════════════════════════════════════════
   CÓMO SE LLAMA UN LINK.

   Tres candidatos y este orden, y el primero es el que sorprende:

   1 · EL NOMBRE DE ARCHIVO DE LA URL, cuando la URL termina en uno.
       Gana sobre el título fetcheado, y no es una preferencia: es lo
       que sale de medir el caso real. El título que devuelve GitHub
       para un archivo es

         expo-ui-examples/src/examples/mini-player/tab-layout.tsx at
         main · SchroederNathan/expo-ui-examples

       o sea 101 caracteres, y en la columna de la ficha —230px, 14px—
       entran unos 28. El título "informativo" se lee
       "expo-ui-examples/src/exampl…" y no dice nada; `tab-layout.tsx`
       entra entero y dice exactamente qué es.

       La regla es angosta a propósito: el último tramo de la ruta Y
       que tenga extensión de 1 a 5 caracteres. No es "adiviná qué
       parte es linda", es "esto es un archivo".

   2 · EL TÍTULO DE LA PÁGINA, si el servidor lo consiguió. Es lo que
       hace Notion, y es lo correcto para todo lo que no sea un
       archivo: un tweet, un artículo, un repo.

   3 · EL HOST. Cuando no hay título —no hay red, el sitio está caído,
       pide login— se cae acá y NO a un pedazo inventado de la URL.
       `dribbble.com` es corto, es cierto y nunca se lee mal; adivinar
       a partir de la ruta produce cosas como `x.com/status` o
       `2090416149670281378`, que es peor que no decir nada.

       Es también el estado en el que se dibuja el link mientras la
       tarjeta viaja, así que nunca hay un hueco: la etiqueta arranca
       en el host y se reemplaza por el título si llega.

   La URL completa nunca se pierde: va en el `title` del ancla, o sea
   en el tooltip del sistema.
   ═══════════════════════════════════════════════════════════════ */
export function archivoDe(url: string): string | null {
  try {
    const tramos = new URL(url).pathname.split('/').filter(Boolean)
    const fin = tramos.at(-1)
    if (!fin) return null
    const nombre = decodeURIComponent(fin)
    return /\.[a-z0-9]{1,5}$/i.test(nombre) ? nombre : null
  } catch {
    return null
  }
}

/* ─── EL SUFIJO DE MARCA ───
   "… · GitHub", "… | Vercel", "… – Figma". Es ruido: el sitio ya lo
   dice el favicon que está tres píxeles a la izquierda.

   Se saca sólo cuando lo que viene después del separador COINCIDE con
   la marca del host —github.com → "github"— y no cualquier cosa que
   siga a un separador. Sin esa condición, un título que de verdad
   termina en " — el final" perdería su final. */
/* ─── UN TÍTULO NO MUESTRA URLS ───
   X mete el t.co del tweet adentro del título —"…Code below 👇
   https://t.co/hP1ThYW5Bs"— y eso es exactamente lo que esta función
   vino a sacar de la pantalla: una URL acortada no dice nada, no se
   puede leer y no se puede recordar. Que aparezca DENTRO de la
   etiqueta de un link sería el defecto original disfrazado.

   La regla se escribe genérica —cualquier http(s) adentro de un
   título— y no como un caso especial de t.co: un título que muestra
   una URL está mostrando plomería en los dos casos, y una lista de
   acortadores es algo que hay que mantener para siempre.

   SE LLEVA EL ESPACIO DE ADELANTE Y DEVUELVE LA PUNTUACIÓN DE ATRÁS,
   y las dos mitades importan. X cierra el título con comillas, así que
   el pedazo a sacar es ` https://t.co/xxx"`: sin llevarse el espacio
   queda un hueco antes de la comilla, y llevándose todo lo que no es
   espacio se lleva también la comilla y el título queda sin cerrar.

   Dónde termina la URL lo decide `recortar`, el mismo de arriba — el
   que ya sabe que un punto final no es parte del link y un paréntesis
   con pareja sí. Escribirlo de nuevo acá habría sido tener dos
   respuestas para la misma pregunta. */
const sinUrls = (s: string) =>
  s
    .replace(/\s*https?:\/\/\S+/gi, (trozo) => {
      const pegado = trozo.trimStart()
      return pegado.slice(recortar(pegado).length)
    })
    .replace(/\s{2,}/g, ' ')
    .trim()

export function limpiarTitulo(titulo: string, url: string): string {
  /* Si el título ERA una URL y nada más, sacarla lo deja vacío. Ahí se
     devuelve lo que había: mejor un título feo que ninguno. */
  const t = sinUrls(titulo.replace(/\s+/g, ' ').trim()) || titulo.trim()
  const host = hostDe(url)
  const marca = host.split('.').at(-2) ?? host
  /* La barra está en la lista por X, que cierra sus títulos con " / X"
     —medido—. Es segura de agregar porque el separador no alcanza: lo
     que queda después tiene que SER la marca. */
  const m = t.match(/^(.*\S)\s*[·|—–\-:/]\s*([^·|—–\-:/]{1,30})$/)
  if (m && m[2].replace(/\s+/g, '').toLowerCase() === marca.toLowerCase()) return m[1]
  return t
}

/* ─── CUÁNTO SE MUESTRA ───
   Un título tampoco puede correr sin freno: el de X para este mismo
   tweet mide 150 caracteres, y la columna de la ficha son 280px a
   14px, o sea unos 40 por renglón. Sin tope, cambiar cuatro renglones
   de URL por cuatro de título no arregla nada.

   80 = dos renglones. Es el techo, no el objetivo: `tab-layout.tsx`
   son 14 y no lo toca. El corte busca el último espacio para no
   partir una palabra al medio, salvo que eso deje la etiqueta a menos
   del 60% —un título sin espacios— donde corta duro y listo.

   NO SE HACE CON overflow:hidden Y text-overflow:ellipsis, que sería
   lo obvio y sería un bug: un elemento en línea con overflow oculto
   deja de tener línea base de texto —pasa a sintetizarla desde su
   borde de abajo— y el chip se sube unos 5px respecto del renglón que
   lo rodea. Cortando el string, los dos <span> quedan en línea normal
   y se alinean solos. */
export const LARGO_ETIQUETA = 80

/* ─── QUÉ PUEDE QUEDAR JUSTO ANTES DE LOS PUNTOS SUSPENSIVOS ───
   Nada que sea puntuación. El corte cae donde cae, y en un título real
   eso deja cosas como

     zuriks on X: "got curious about the intro sequence here -…

   donde ese guion separaba dos frases y ahora cuelga de la nada. Se lee
   como si la etiqueta se hubiera roto. Los puntos suspensivos YA dicen
   que sigue; no necesitan que un signo se los repita.

   Y LA COMILLA QUE ABRE Y NO CIERRA. X titula sus tweets como
   'fulano on X: "texto"', así que cortar por el medio deja la de
   apertura sola — se ve en el mismo ejemplo. Es el mismo defecto que el
   guion colgado: un signo sin su pareja. Si quedaron impares, se saca
   la que abrió.

   LAS DOS SÓLO CORREN AL TRUNCAR. Un título que de verdad termina en
   punto —o que trae sus comillas completas— se devuelve intacto: acá no
   se está limpiando el título, se está cerrando un corte.

   LA COMILLA NO ESTÁ EN ESTA LISTA, Y ES EL DETALLE QUE COSTÓ. Estuvo,
   y con eso una frase entrecomillada que entraba justa perdía las DOS:
   se le sacaba la de cierre por estar al final, y eso volvía impares
   las que quedaban, así que la regla de abajo también borraba la de
   apertura. `"uno dos"` terminaba en `uno dos`.

   Una comilla al final puede ser la que CIERRA —legítima, se queda— o
   la que abrió y quedó sola —cuelga, se va—. La posición no las
   distingue; la PARIDAD sí. Por eso van por caminos separados. */
const COLGADO = /[\s\-–—,;:.·|/\\([{«]+$/

const cerrar = (s: string): string => {
  let t = s.replace(COLGADO, '')
  /* Impares = la que abrió se quedó sin pareja. Se saca la primera, que
     es justamente ésa. */
  if ((t.split('"').length - 1) % 2 === 1) t = t.replace(/\s*"\s*/, ' ')
  /* Otra vez, porque sacar la comilla puede destapar un signo que
     estaba detrás: 'dijo: "uno' cortado deja 'dijo:'. */
  return t.replace(COLGADO, '').trim()
}

export function acortar(s: string, max = LARGO_ETIQUETA): string {
  if (s.length <= max) return s
  const duro = s.slice(0, max)
  const espacio = duro.lastIndexOf(' ')
  return cerrar(espacio > max * 0.6 ? duro.slice(0, espacio) : duro) + '…'
}

export function etiquetaDe(url: string, titulo?: string): string {
  const t = titulo?.trim()
  /* ─── UN TÍTULO QUE ES SÓLO UNA URL NO ES UN TÍTULO: ES EL DESTINO ───
     Y es exactamente lo que devuelve t.co. Medido: su página no
     redirige por HTTP —lo hace por JavaScript, así que el fetch se
     queda ahí— y lo único que trae es un <title> que dice
     "https://twitter.com/nater02/status/…". Sin esta rama, un link
     copiado de X se etiquetaría con esa URL entera: el defecto
     original, reaparecido por la puerta de atrás.

     Se la asciende a URL y se rehace la cuenta con ella. La recursión
     termina siempre porque la segunda vuelta va sin título. */
  if (t && /^https?:\/\/\S+$/i.test(t)) return etiquetaDe(t)
  return acortar(archivoDe(url) ?? (t ? limpiarTitulo(t, url) : hostDe(url)))
}
