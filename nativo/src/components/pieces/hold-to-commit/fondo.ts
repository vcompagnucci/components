/* EL FONDO — qué hay detrás del botón.
 *
 * El botón es la pieza; lo de atrás es contexto. Vito pidió el
 * 2026-09-03 sacar la pantalla de Opal y dejar un fondo liso y neutro,
 * sin decidir todavía cuál. Así que el fondo es una VARIANTE, no un
 * valor, y se elige mirándolo: con `'elegir'` la pieza muestra un
 * selector arriba para pasar de una a otra en vivo (en el teléfono
 * también). Cuando haya ganador, se escribe acá y el selector
 * desaparece; las variantes que pierdan se borran, salvo `'opal'`, que
 * es la pantalla medida del clip y queda recuperable.
 *
 *   'liso'      nada más que el botón, donde el clip lo tiene (al pie)
 *   'centrado'  nada más que el botón, en el centro de la pantalla
 *   'bloques'   la pantalla de Opal como esqueleto: misma grilla y
 *               alturas, barras grises por texto, siluetas por
 *               controles — el contexto sin el contenido. ELEGIDO el
 *               2026-09-03 sobre el tablero de las cuatro.
 *   'opal'      la pantalla medida del clip, con sus manchas
 *   'accion'    la ficha de un activo de una app financiera, como
 *               esqueleto: título, precio, variación, gráfico y rango,
 *               medidos de la captura oficial de Robinhood; el botón
 *               pasa a "Hold to Buy". ELEGIDO el 2026-09-04 ("tipo
 *               Robinhood, todo skeletons").
 *
 * Cada una es una dirección distinta, no un matiz de la misma: vacío
 * al pie / vacío centrado / contexto mudo / la copia fiel.
 *
 * El DERRAME —la luz que se escapa por debajo del pill, medida en la
 * pantalla de Opal— sólo se dibuja con `'opal'`: sobre un fondo neutro
 * se lee como una caja detrás del botón (Vito, 2026-09-04, en el
 * teléfono).
 */
export type Fondo = 'liso' | 'centrado' | 'bloques' | 'opal' | 'accion'
export const FONDOS: readonly Fondo[] = ['liso', 'centrado', 'bloques', 'opal', 'accion']
export const FONDO: Fondo | 'elegir' = 'accion'
