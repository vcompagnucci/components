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
  name: string
  platform: Platform
  /* La línea bajo la pieza en el detalle. OPCIONAL desde el 2026-09-07:
     cuando el título ya dice qué es, no hay línea (Swipeable tabs la
     tuvo —"Top tabs for React Native & Expo."— y el usuario la borró:
     "ya está la de arriba que dice swipeable tabs"). Si existe, es una
     oración: qué es y para qué plataforma, sin nombrar la app de
     referencia (ver AGENTS.md › Cómo se nombra). */
  desc?: string
  /* La grabación que la demuestra, en /piezas/ dentro de public/. Lo
     escribe Add to Library —el clic derecho sobre un frame del
     playground—, que copia el archivo y agrega la entrada: ver
     __publicar en scripts/vault-media.mjs. Es de las piezas App; una
     Web va viva —su archivo está en src/piezas/, resuelto por slug en
     demos.tsx— y no lo lleva. */
  video?: string
  /* El mismo video con alfa en HEVC (.mov) para Safari, que no
     reproduce el alfa del WebM. Una pieza App se muestra transparente
     y sin sombra sobre la superficie de la card, como los videos de
     Family en benji.org: el FONDO lo pone la library en el tema que
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

/* LA URL DE UNA PIEZA, y hay UNA sola cuenta. Vivían dos que coincidían
   de casualidad —parts.tsx cambiaba espacios por guiones, rutas.mjs
   tiraba todo lo que no fuera [a-z0-9]— y con el primer nombre que
   llevara un signo (`Toggle & switch`) el cliente iba a navegar a una
   URL que el rewrite de vercel no cubría. Vive acá porque la leen los
   tres: la página, el generador de rutas y el puente que publica. */
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
export const PIECES: Piece[] = [
  {
    name: 'Select summary',
    platform: 'Web',
    /* Sin `desc`: el título ya dice qué es, que es la primera regla de
       AGENTS.md › Cómo se nombra, y es lo que hacen las otras tres
       piezas. La tuvo un día y se borró por lo mismo que la de Swipeable
       tabs. */
  },
  {
    name: 'Swipeable tabs',
    platform: 'App',
    video: '/piezas/swipeable-tabs.webm',
    videoHevc: '/piezas/swipeable-tabs.mov',
  },
  /* Sin `desc`: el título ya dice qué es el gesto, que es la primera
     regla de AGENTS.md › Cómo se nombra. Catorce caracteres. */
  {
    name: 'Hold to commit',
    platform: 'App',
    video: '/piezas/hold-to-commit.webm',
    videoHevc: '/piezas/hold-to-commit.mov',
    videoOscuro: '/piezas/hold-to-commit-oscuro.webm',
    videoHevcOscuro: '/piezas/hold-to-commit-oscuro.mov',
  },
  /* La primera pieza Web, y por eso la primera sin `video`: corre viva
     en la lista y en el detalle, resuelta por slug en demos.tsx. Sin
     `desc` por la misma regla que Swipeable tabs — el título ya dice
     cuál es el gesto. */
  {
    name: 'Buttons separate',
    platform: 'Web',
  },
]
