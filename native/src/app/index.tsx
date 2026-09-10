import { Redirect, type Href } from 'expo-router'

import { PieceList } from '@/components/piece-list'
import { OPEN_IN } from '@/components/pieces/open'
import { SLUGS } from '@/components/pieces/registry'

/* ═══════════════════════════════════════════════════════════════
   THE INDEX OF THE WORKSHOP: the route. It decides whether there is
   an index; `components/piece-list.tsx` draws the list, and the pieces
   come out of the registry, derived from the folders of
   `components/pieces/` (see its `registry.ts`): a list written by hand
   falls out of sync the day you add a piece and forget to write it
   down, and then the index lies. Here it cannot.
   ═══════════════════════════════════════════════════════════════ */
export default function Index() {
  /* WITH A SINGLE PIECE THERE IS NO INDEX: the workshop opens straight
     into whatever you are building. A one-item menu is not help, it is
     a toll, and on top of that it shows up on the screen you are going
     to look at a thousand times.

     The index comes back on its own when there are two or more, and
     only then is it good for something, which is choosing. It comes out
     of the SAME registry as the list, so there is no list and no flag
     to maintain: you add a folder and the workshop changes mode by
     itself.

     It goes before any hook on purpose. This component has none, so the
     early return cannot put them out of order. If one is ever added, it
     goes ABOVE this line. */
  if (SLUGS.length === 1) return <Redirect href={`/${SLUGS[0]}` as Href} />
  /* And with the development knob set (`components/pieces/open.ts`),
     into that one. */
  if (OPEN_IN && SLUGS.includes(OPEN_IN)) return <Redirect href={`/${OPEN_IN}` as Href} />
  return <PieceList />
}
