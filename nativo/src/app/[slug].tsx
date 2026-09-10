import { Redirect, useLocalSearchParams } from 'expo-router'

import { PIEZAS } from '@/components/pieces/registry'

/* ═══════════════════════════════════════════════════════════════
   LA RUTA DE UNA PIEZA — una sola para todas, como
   `app/animations/[slug].tsx` en react-native-motion: busca la pantalla
   en el registro y la monta. Nada más.

   FLACA A PROPÓSITO, y ahora única: Expo Router convierte en ruta todo
   `.tsx` que cuelgue de `src/app/` (su doc: "Non-navigation components
   live outside the src/app directory"), así que el código de una pieza
   vive en `src/components/pieces/<slug>/` y acá no hay una carpeta por
   pieza que mantener. Hasta el 2026-09-10 había un puntero por pieza
   —`src/app/<slug>/index.tsx`, que sólo re-exportaba la pantalla— y el
   índice se derivaba de esas carpetas; ahora se deriva de las carpetas
   de las piezas, que es de donde tenía que salir (ver `registry.ts`).

   Las perillas de una pieza (`?parcar=`, `?fondo=`, `?demo=1`) las lee
   su propia pantalla con `useLocalSearchParams`: la ruta no sabe qué
   pieza es, y no tiene por qué.

   Un slug que no existe vuelve al índice: en el taller no hay 404 que
   valga la pena dibujar.
   ═══════════════════════════════════════════════════════════════ */
export default function Pieza() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const Pantalla = slug ? PIEZAS[slug] : undefined
  if (!Pantalla) return <Redirect href="/" />
  return <Pantalla />
}
