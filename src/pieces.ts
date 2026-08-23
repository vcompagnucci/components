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
}


/* VACÍO A PROPÓSITO. Acá vivieron 18 placeholders que existían sólo
   para que el esqueleto renderizara algo; se borraron enteros antes de
   la primera pieza real para que nada genérico se confunda con una
   decisión. La lista se llena SÓLO con piezas construidas de verdad —
   la primera define el molde. La página, el índice y vercel.json ya
   saben vivir con cero. */
export const PIECES: Piece[] = []
