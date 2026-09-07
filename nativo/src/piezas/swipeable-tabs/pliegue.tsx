import { createContext, useContext } from 'react'
import { useAnimatedScrollHandler, useSharedValue, type SharedValue } from 'react-native-reanimated'

import { PLIEGUE } from './medidas'

/* ═══════════════════════════════════════════════════════════════
   EL PLIEGUE — la cabecera entera sube con el scroll del contenido.

   Es lo que hace X: al scrollear el feed hacia abajo, el bloque de
   arriba (barra de estado incluida, cabecera, tabs y divisor) se
   traslada hacia arriba EXACTAMENTE lo que se movió el contenido, y
   mientras sube su contenido se desvanece; al scrollear hacia arriba
   vuelve por el mismo camino, también 1:1, desde donde haya quedado.
   No hay umbral, no hay snap al soltar, no hay animación propia: la
   cabecera es una función del delta del scroll.

   DOS CAPAS, Y NO ES UN DETALLE: el FONDO del bloque es opaco y no se
   desvanece; lo que se desvanece es lo que va dibujado encima (avatar,
   labels, subrayado, símbolos). El bloque viaja hasta que su borde de
   abajo —el divisor— queda pegado al borde de abajo de la barra de
   estado: ahí frena, con su fondo tapando la barra de estado y el
   divisor como única línea, y el contenido pasa por debajo. Por eso el
   recorrido es `alto − barra de estado` y no `alto`.

   RUNTIME · la primera versión desvanecía el bloque ENTERO y la tapa
   tenía un filete: el filete asomaba a través del bloque mientras se
   desvanecía ("al bajar hay una línea", captura del usuario,
   2026-09-02). En X esa línea no existe durante el pliegue: en la
   grabación, con el bloque a mitad de camino (D = 38..55), la fila de
   62 pt es blanco puro (255, sin un píxel). Y la línea que se ve viajar
   con los tabs son DOS filas: el borde de abajo del bloque, que se
   apaga (208 → 233), y el separador superior del contenido, pegado
   debajo, que no (205 constante). Acá el fondo es opaco y el divisor
   queda opaco con él: es la línea que viaja con los tabs y frena bajo
   la barra de estado, como la de X.

   ─── LO QUE SE PROBÓ Y NO VA ───
   Con el recorrido corto los labels se prenden y apagan en 88 pt de
   scroll, y la vuelta se sintió abrupta en el teléfono ("aparece muy
   abrupto", 2026-09-02). Se probó el recorrido ENTERO (150: los labels
   saliendo por arriba de la pantalla y volviendo desde ahí como los de
   X, con una tapa sin filete bajo la barra de estado y el divisor
   apagándose): el usuario lo rechazó en el teléfono — "lo arruinaste,
   volvé a lo de antes". Queda ESTA versión. Si la vuelta se vuelve a
   sentir brusca, lo que hay para tocar es el fundido (`desvanece` en
   medidas.ts), no la geometría.

   RUNTIME · grabación de X del usuario (2026-09-02, modo claro,
   1320×2868 = 440 pt, 60 fps), dos bajadas y dos vueltas. El divisor
   de la barra (en reposo a 150.0 pt) contra el borde de una tarjeta
   del contenido, cuadro a cuadro:

     bajada 1   contenido −8.7 −15.3 −21.7 −27.3 −33.0 −39.0 −44.3 −49.7
                divisor   141.3 134.7 128.3 122.7 117.0 111.0 105.7 100.3
                → traslación = scroll, al décimo, desde el primer cuadro

     vuelta 1   D + Δcontenido = 151.6 151.3 151.3 151.7 151.6 (5 cuadros)
     vuelta 2   D + Δcontenido = 151.7 151.7 152.0 151.4 151.7 151.7 151.7
                → recorrido máximo 151.6 = el borde de abajo del bloque
                  de X (213.7 pt: tiene una fila más, el pill de Spaces)
                  menos la barra de estado (62.0). El bloque frena con
                  su borde de abajo pegado a la barra de estado.

   La línea que queda a 62.0 pt cuando el bloque se fue (luma 204 en
   cada cuadro, f70–104) es ese borde: viaja desde 213.7 en reposo,
   1:1 con el scroll (205.0, 198.3, 192.0, … , 62.3, 62.0) y ahí se
   queda. Acá el borde de abajo del bloque es el divisor de la barra, y
   hace lo mismo: 150.3 → 62.0.

   El desvanecido de lo de arriba está medido con el subrayado (una
   barra de 2 pt, tinta plena) como sonda: su luma L sube LINEAL con la
   traslación D — L ≈ 1.8·D en las cuatro fases — o sea α = 1 − D/142
   con un recorrido de 151.6: se apaga al 94 % del viaje. Es una
   fracción del recorrido y no un número de puntos porque el bloque de
   X es más alto que el nuestro (el recibo está arriba de
   `PLIEGUE.desvanece` en medidas.ts).

   El scroll de cada página lo reporta la página misma (`useScrollPlegable`);
   con seis páginas hay seis scrolls y una sola cabecera: cambiando de
   tab, la cabecera no puede quedar más plegada que lo que esa página
   scrolleó (si no, quedaría un hueco arriba del contenido). Eso es
   DECISIÓN NUESTRA, SIN RECIBO: la grabación no cambia de tab con la
   cabecera plegada.
   ═══════════════════════════════════════════════════════════════ */
export type Pliegue = {
  /* Altura del bloque que se pliega: barra de estado + cabecera + tabs
     + divisor. Lo que cada página deja libre arriba. */
  alto: number
  /* Cuánto puede subir el bloque: `alto` menos la barra de estado — el
     bloque frena con su divisor pegado al borde de la barra de estado. */
  recorrido: number
  /* Cuánto subió el bloque, 0..recorrido. */
  subida: SharedValue<number>
  /* El scroll vertical de cada página, por índice. */
  posiciones: SharedValue<number[]>
}

export const PliegueContext = createContext<Pliegue | null>(null)
export const usePliegue = () => useContext(PliegueContext)

/* Opacidad de LO QUE VA ENCIMA del bloque (no de su fondo) para una
   subida dada. Worklet: la lee el estilo. */
export function opacidadPlegada(subida: number, recorrido: number) {
  'worklet'
  return Math.max(0, 1 - subida / (recorrido * PLIEGUE.desvanece))
}

/* EL SCROLL DE UNA PÁGINA MUEVE EL PLIEGUE. Devuelve el handler para el
   ScrollView vertical de la página y el alto que la página tiene que
   dejar libre arriba (el contenido arranca debajo del bloque en reposo).

   La subida se mueve con el DELTA del scroll y se clampea dos veces:
   a [0, recorrido], y a no más que el scroll mismo — con el contenido
   en el tope, la cabecera está entera aunque el rebote la haya
   empujado. */
export function useScrollPlegable(indice: number) {
  const pliegue = usePliegue()
  const previo = useSharedValue(0)
  const handler = useAnimatedScrollHandler({
    onScroll: (e) => {
      if (!pliegue) return
      const y = e.contentOffset.y
      const delta = y - previo.get()
      previo.set(y)
      pliegue.posiciones.modify((p) => {
        'worklet'
        p[indice] = y
        return p
      })
      const techo = Math.min(pliegue.recorrido, Math.max(0, y))
      pliegue.subida.set(Math.min(Math.max(pliegue.subida.get() + delta, 0), techo))
    },
  })
  return { handler, alto: pliegue?.alto ?? 0 }
}
