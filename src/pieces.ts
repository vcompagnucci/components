/* El corte es navegador vs app instalada, que es la línea que de verdad
   cuesta cruzar. Bajo App conviven SwiftUI y Expo/React Native: los dos
   renderizan vistas nativas de verdad, sólo cambia con qué se escriben.

   CÓMO SE DEMUESTRA CADA PIEZA LO DECIDE `platform`, y nada más:
   Web va viva en el navegador, App va en video. Antes esto se decidía
   por pieza porque Expo PODÍA ir vivo vía react-native-web; al pasar
   Expo también a video, la regla colapsó en la categoría y el campo
   `runtime` que la sostenía dejó de tener sentido. */

export type Platform = 'Web' | 'App'

export type Piece = {
  /* EL TÍTULO: lo que se lee en el índice, en la card, en el <h1> del
     detalle y en la pestaña. Es un nombre y nada más que un nombre —la
     URL, la carpeta y los archivos salen de `slug`—, así que renombrar
     una pieza es cambiar esta línea. Cómo se elige está en AGENTS.md ›
     Cómo se nombra, y el largo lo decide su lugar en el índice (ver
     arriba de PIECES). */
  name: string
  /* EL IDENTIFICADOR: la URL pública (`/hold-to-commit`), la carpeta de
     su código —`src/components/pieces/<slug>/` acá y en `nativo/`—, el
     nombre de sus grabaciones en `public/piezas/`, el del clip de
     referencia en el vault y el de sus planillas en `.context/`. Se
     asigna UNA vez, al publicar —`slug()` sobre el nombre de ese día, es
     lo que escribe Add to Exhibition— y no se vuelve a tocar: un título
     puede cambiar (el 2026-09-10 cambiaron los cuatro) y una URL
     publicada no, porque la que alguien compartió tiene que seguir
     abriendo, y todo lo que lleva este string en el nombre seguiría
     llamándose como antes. Es la forma de `data/animations.ts` en
     react-native-motion: `title: 'Stack Toast', slug: 'spring-toast'`.
     Hasta ese día el slug se calculaba del nombre en cada lectura, y
     por eso la cuenta sigue acá abajo: la usa la publicación. */
  slug: string
  platform: Platform
  /* La línea bajo la pieza en el detalle. OPCIONAL desde el 2026-09-07:
     cuando el título ya dice qué es, no hay línea (Swipeable tabs la
     tuvo —"Top tabs for React Native & Expo."— y el usuario la borró:
     "ya está la de arriba que dice swipeable tabs"). Si existe, es una
     oración: qué es y para qué plataforma, sin nombrar la app de
     referencia (ver AGENTS.md › Cómo se nombra). */
  desc?: string
  /* La grabación que la demuestra, en /piezas/ dentro de public/. Lo
     escribe Add to Exhibition —el clic derecho sobre un frame del
     playground—, que copia el archivo y agrega la entrada: ver
     __publicar en scripts/vault-media.mjs. Es de las piezas App; una
     Web va viva —su carpeta está en src/components/pieces/, resuelta
     por slug en demos.tsx— y no lo lleva. */
  video?: string
  /* El mismo video con alfa en HEVC (.mov) para Safari, que no
     reproduce el alfa del WebM. Una pieza App se muestra transparente
     y sin sombra sobre la superficie de la card, como los videos de
     Family en benji.org: el FONDO lo pone la exhibition en el tema que
     sea, así que el fondo no se hornea por tema. Lo escribe
     `pnpm pieza:video … --alfa`; sin esto, `video` va solo. */
  videoHevc?: string
  /* LA MISMA PIEZA GRABADA EN MODO OSCURO, para las piezas cuyo
     CONTENIDO cambia con la apariencia del sistema. No contradice lo de
     arriba: aquello es sobre el fondo de la card, que sigue siendo uno
     solo; esto es sobre lo que se ve adentro del teléfono. Hold to
     commit es la primera así, y la diferencia no es cosmética: en claro
     la píldora pierde el brillo que la llena en oscuro, que es
     justamente lo que la pieza muestra. Con estos campos, la card sirve
     la grabación que corresponde al tema del lector y la cambia si el
     sistema cambia; sin ellos, `video` va para los dos (swipeable-tabs
     se grabó en una sola apariencia). */
  videoOscuro?: string
  videoHevcOscuro?: string
}

/* LA CUENTA DEL SLUG, y hay UNA sola. Vivían dos que coincidían de
   casualidad —parts.tsx cambiaba espacios por guiones, rutas.mjs tiraba
   todo lo que no fuera [a-z0-9]— y con el primer nombre que llevara un
   signo (`Toggle & switch`) el cliente iba a navegar a una URL que el
   rewrite de vercel no cubría. Desde el 2026-09-10 la página no la
   llama: lee `slug` de cada entrada. La llaman los que ASIGNAN un slug
   —el puente que publica, y `pnpm nueva` del taller con la misma
   cuenta— y por eso vive acá, al lado del campo que escribe. */
export const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/* VACÍO A PROPÓSITO. Acá vivieron 18 placeholders que existían sólo
   para que el esqueleto renderizara algo; se borraron enteros antes de
   la primera pieza real para que nada genérico se confunda con una
   decisión. La lista se llena SÓLO con piezas construidas de verdad —
   la primera define el molde. La página, el índice y vercel.json ya
   saben vivir con cero. */
/* EL ORDEN DE ESTE ARREGLO ES EL ORDEN DE LA EXHIBICIÓN, y es editorial:
   no es cronológico, no es alfabético y no se ordena solo. Manda dentro
   de cada plataforma —app.tsx agrupa por `platform`, Web y después App—
   y lo leen el índice, las secciones del cuerpo y el scrollspy.

   La primera de la lista es la que abre la muestra, así que la elige
   Vito. Hoy es Fan out (entonces Buttons separate), por pedido del
   2026-09-10; antes ocupaba ese lugar Select summary, por el accidente
   de haberse mergeado primero (PR #26 contra PR #27) y no por una
   decisión. */
/* LOS NOMBRES DIBUJAN UNA MONTAÑA EN EL ÍNDICE, y es a propósito (pedido
   del 2026-09-10: "lo más largo en el medio y en las puntas los nombres
   cortos"). Leídos de arriba abajo, sin tocar el orden —que es editorial,
   ver arriba—, los de las puntas son cortos y los del medio son los más
   largos:

       Fan out               7     45.7 px
       Selection summary    17    117.9 px
       Swipe between tabs   18    124.7 px
       Hold to buy          11     70.6 px

   (RUNTIME · el ancho de la tinta de cada link del índice, Inter 13 px
   peso 460, medido el 2026-09-10 con Chrome headless por CDP sobre la
   página servida, con la fuente ya cargada.) Una pieza nueva entra con
   un nombre del largo que le toca por su lugar: corto si abre o cierra
   la lista, largo si queda en el medio.
   Los cuatro pasaron por la regla de nombres (AGENTS.md › Cómo se
   nombra): el término técnico de la parte y el verbo de especificación,
   y cada uno es una frase que ya está en las notas de su pieza, así el
   título y la página nombran la cosa igual.

   · Fan out             era Buttons separate. "The four buttons fan out
                         from where the first one sits" (Anatomy).
   · Selection summary   era Select summary. Lo que el botón resume es la
                         selección: el sustantivo donde había un verbo.
   · Swipe between tabs  era Swipeable tabs. Es la línea que el usuario
                         aprobó el 2026-09-07 ("Swipe between tabs, tap to
                         select one"), con el término de la HIG.
   · Hold to buy         era Hold to commit, el nombre del catálogo de
                         60fps.design. El label del botón en reposo dice
                         "Hold to Buy" desde que Vito lo pidió como botón
                         de compra (2026-09-04); el título dice lo mismo.

   El slug de cada una quedó el de su día: ver `slug` en `Piece`. */
export const PIECES: Piece[] = [
  /* La primera pieza Web que se construyó, y por eso la primera sin
     `video`: corre viva en la lista y en el detalle, resuelta por slug
     en demos.tsx. Sin `desc` por la misma regla que Swipe between tabs —
     el título ya dice cuál es el gesto. */
  {
    name: 'Fan out',
    slug: 'buttons-separate',
    platform: 'Web',
  },
  {
    name: 'Selection summary',
    slug: 'select-summary',
    platform: 'Web',
    /* Sin `desc`: el título ya dice qué es, que es la primera regla de
       AGENTS.md › Cómo se nombra, y es lo que hacen las otras tres
       piezas. La tuvo un día y se borró por lo mismo que la de Swipe
       between tabs. */
  },
  {
    name: 'Swipe between tabs',
    slug: 'swipeable-tabs',
    platform: 'App',
    video: '/pieces/swipeable-tabs.webm',
    videoHevc: '/pieces/swipeable-tabs.mov',
  },
  /* Sin `desc`: el título ya dice qué es el gesto, que es la primera
     regla de AGENTS.md › Cómo se nombra. Once caracteres. */
  {
    name: 'Hold to buy',
    slug: 'hold-to-commit',
    platform: 'App',
    video: '/pieces/hold-to-commit.webm',
    videoHevc: '/pieces/hold-to-commit.mov',
    videoOscuro: '/pieces/hold-to-commit-dark.webm',
    videoHevcOscuro: '/pieces/hold-to-commit-dark.mov',
  },
]
