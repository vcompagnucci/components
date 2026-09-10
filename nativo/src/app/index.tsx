import { Redirect, type Href } from 'expo-router'

import { PieceList } from '@/components/piece-list'
import { ABRIR } from '@/components/pieces/abrir'
import { SLUGS } from '@/components/pieces/registry'

/* ═══════════════════════════════════════════════════════════════
   EL ÍNDICE DEL TALLER — la ruta. Decide si hay índice; la lista la
   dibuja `components/piece-list.tsx` y las piezas salen del registro,
   derivado de las carpetas de `components/pieces/` (ver su
   `registry.ts`): una lista escrita a mano se desincroniza el día que
   agregás una pieza sin acordarte de anotarla, y entonces el índice
   miente. Acá no puede.
   ═══════════════════════════════════════════════════════════════ */
export default function Indice() {
  /* CON UNA SOLA PIEZA NO HAY ÍNDICE: el taller abre directo en lo que
     estás construyendo. Un menú de un ítem no es una ayuda, es un peaje
     —y encima aparece en la pantalla que después vas a mirar mil veces.

     El índice vuelve solo cuando hay dos o más y recién ahí sirve para
     algo, que es elegir. Sale del MISMO registro que la lista, así que
     no hay ninguna lista ni ningún flag que mantener: agregás una
     carpeta y el taller cambia de modo solo.

     Va antes que cualquier hook a propósito — este componente no tiene
     ninguno, así que el early return no puede desordenarlos. Si algún
     día se le agrega uno, va ARRIBA de esta línea. */
  if (SLUGS.length === 1) return <Redirect href={`/${SLUGS[0]}` as Href} />
  /* Y con la perilla de desarrollo puesta (`components/pieces/abrir.ts`),
     en esa. */
  if (ABRIR && SLUGS.includes(ABRIR)) return <Redirect href={`/${ABRIR}` as Href} />
  return <PieceList />
}
