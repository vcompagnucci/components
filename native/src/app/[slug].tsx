import { Redirect, useLocalSearchParams } from 'expo-router'

import { PIECES } from '@/components/pieces/registry'

/* ═══════════════════════════════════════════════════════════════
   THE ROUTE OF A PIECE — one route for all of them, like
   `app/animations/[slug].tsx` in react-native-motion: it looks the
   screen up in the registry and mounts it. Nothing else.

   THIN ON PURPOSE, and now the only one: Expo Router turns every `.tsx`
   hanging off `src/app/` into a route (their doc: "Non-navigation
   components live outside the src/app directory"), so the code of a
   piece lives in `src/components/pieces/<slug>/` and there is no folder
   per piece to maintain here. Until 2026-09-10 there was one pointer
   per piece, `src/app/<slug>/index.tsx`, which only re-exported the
   screen, and the index was derived from those folders; now it is
   derived from the folders of the pieces, which is where it had to come
   from (see `registry.ts`).

   The knobs of a piece (`?park=`, `?background=`, `?demo=1`) are read by
   its own screen with `useLocalSearchParams`: the route does not know
   which piece this is, and it has no reason to.

   A slug that does not exist goes back to the index: in the workshop
   there is no 404 worth drawing.
   ═══════════════════════════════════════════════════════════════ */
export default function Piece() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const Screen = slug ? PIECES[slug] : undefined
  if (!Screen) return <Redirect href="/" />
  return <Screen />
}
