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
  desc: string
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
     Family en benji.org: el fondo lo pone la library en el tema que
     sea, así que no hacen falta versiones por tema. Lo escribe
     `pnpm pieza:video … --alfa`; sin esto, `video` va solo. */
  videoHevc?: string
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
    name: 'Swipeable tabs',
    platform: 'App',
    desc: 'X’s home tabs for Expo. Swipe between tabs, tap to select one, and the header collapses as you scroll.',
    video: '/piezas/swipeable-tabs.webm',
    videoHevc: '/piezas/swipeable-tabs.mov',
  },
]
