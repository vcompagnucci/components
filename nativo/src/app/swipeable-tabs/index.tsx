/* ═══════════════════════════════════════════════════════════════
   SWIPEABLE TABS — la ruta. Es un puntero, y es flaca a propósito: Expo
   Router convierte en ruta **todo** `.tsx` que cuelgue de `src/app/`
   (está en su doc: "Non-navigation components live outside the src/app
   directory"). Un `barra.tsx` al lado sería la ruta
   `/swipeable-tabs/barra`. Por eso la pieza entera —pantalla,
   mecanismo, tema, datos y sus recibos— vive en `src/piezas/<slug>/`,
   con la forma de `components/animations/<slug>/` de
   react-native-motion, y acá sólo se exporta la pantalla.

   El bloque "No tocar sin volver a medir" está al pie de `pantalla.tsx`.
   ═══════════════════════════════════════════════════════════════ */
export { PantallaSwipeableTabs as default } from '@/piezas/swipeable-tabs'
