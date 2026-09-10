import { Link, type Href } from 'expo-router'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { SLUGS } from './pieces/registry'

/* ═══════════════════════════════════════════════════════════════
   LA LISTA DE PIEZAS — el índice del taller, dibujado.

   Es el `animation-list.tsx` de react-native-motion: la ruta del índice
   (`src/app/index.tsx`) decide si hay lista y esto la dibuja. Las
   piezas salen del registro, derivado de las carpetas de
   `components/pieces/` (ver `pieces/registry.ts`), así que no hay
   ninguna lista que mantener: agregás una carpeta y aparece.

   Lo que se lee es el SLUG en frase, no el título de la exhibition:
   el taller no lee `pieces.ts` del repo web, y el slug es lo que los
   dos comparten.
   ═══════════════════════════════════════════════════════════════ */

/* "sheet-que-se-estira" → "Sheet que se estira". La MISMA cuenta que
   `aFrase` en src/privado/clips.ts del repo web: sólo la primera en
   mayúscula, porque el nombre de una pieza es una frase y no un
   título. */
const aFrase = (s: string) => {
  const limpio = s.replace(/-+/g, ' ').trim()
  return limpio ? limpio[0].toUpperCase() + limpio.slice(1) : s
}

export function PieceList() {
  return (
    <SafeAreaView style={css.pantalla}>
      <ScrollView contentContainerStyle={css.columna}>
        <Text style={css.titulo}>Piezas</Text>
        {SLUGS.length === 0 ? (
          /* El guion, no una frase — la respuesta que esta casa ya dio
             para un dato ausente (ver .sinClips en el playground). */
          <Text style={css.vacio}>—</Text>
        ) : (
          SLUGS.map((slug) => (
            /* EL ÚNICO `as` DEL TALLER, y va acotado a esta línea.
               `typedRoutes` genera la unión de rutas que existen y
               atrapa cualquier link mal escrito — vale tenerlo prendido.
               Pero ESTE link es dinámico por diseño: su destino sale del
               mismo registro que dibujó la lista, así que la pantalla
               existe por construcción. Apagar la comprobación de todo
               el proyecto por el único lugar donde no aplica sería
               pagar mucho por poco. */
            <Link key={slug} href={`/${slug}` as Href} style={css.fila}>
              {aFrase(slug)}
            </Link>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

/* El taller es una HERRAMIENTA, no el producto: no hereda los tokens de
   la exposición ni intenta parecerse a ella. Tipografía del sistema y
   el mínimo para que se lea — todo el diseño va adentro de las piezas,
   que es lo único que se va a grabar. */
const css = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#fff' },
  columna: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, gap: 16 },
  titulo: { fontSize: 28, fontWeight: '600', color: '#111', marginBottom: 8 },
  fila: { fontSize: 17, color: '#111' },
  vacio: { fontSize: 17, color: '#999' },
})
