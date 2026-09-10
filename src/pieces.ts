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
     Cómo se nombra. */
  name: string
  /* EL IDENTIFICADOR: la URL pública (`/hold-to-commit`), la carpeta de
     su código —`src/components/pieces/<slug>/` acá y en `nativo/`—, el
     nombre de sus grabaciones en `public/piezas/`, el del clip de
     referencia en el vault y el de sus planillas en `.context/`. Se
     asigna UNA vez, al publicar —`slug()` sobre el nombre de ese día, es
     lo que escribe Add to Exhibition— y no se vuelve a tocar: un título
     puede cambiar y una URL publicada no, porque la que alguien compartió tiene que seguir
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
   Vito. Hoy es Buttons separate, por pedido del 2026-09-10; antes ocupaba ese lugar Select summary, por el accidente
   de haberse mergeado primero (PR #26 contra PR #27) y no por una
   decisión. */
export const PIECES: Piece[] = [
  /* La primera pieza Web que se construyó, y por eso la primera sin
     `video`: corre viva en la lista y en el detalle, resuelta por slug
     en demos.tsx. Sin `desc` por la misma regla que Swipeable tabs — el
     título ya dice cuál es el gesto. */
  {
    name: 'Buttons separate',
    slug: 'buttons-separate',
    platform: 'Web',
  },
  {
    name: 'Select summary',
    slug: 'select-summary',
    platform: 'Web',
    /* Sin `desc`: el título ya dice qué es, que es la primera regla de
       AGENTS.md › Cómo se nombra, y es lo que hacen las otras tres
       piezas. La tuvo un día y se borró por lo mismo que la de Swipeable
       tabs. */
  },
  {
    name: 'Swipeable tabs',
    slug: 'swipeable-tabs',
    platform: 'App',
    video: '/piezas/swipeable-tabs.webm',
    videoHevc: '/piezas/swipeable-tabs.mov',
  },
  /* Sin `desc`: el título ya dice qué es el gesto, que es la primera
     regla de AGENTS.md › Cómo se nombra. Catorce caracteres. */
  {
    name: 'Hold to commit',
    slug: 'hold-to-commit',
    platform: 'App',
    video: '/piezas/hold-to-commit.webm',
    videoHevc: '/piezas/hold-to-commit.mov',
    videoOscuro: '/piezas/hold-to-commit-oscuro.webm',
    videoHevcOscuro: '/piezas/hold-to-commit-oscuro.mov',
  },
]
