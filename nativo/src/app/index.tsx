import { Link, type Href } from 'expo-router'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

/* ═══════════════════════════════════════════════════════════════
   EL ÍNDICE DEL TALLER — se deriva de las carpetas, no se mantiene.

   Es la misma decisión que el vault ("la carpeta ES el manifiesto") y
   que los bocetos del playground: una lista escrita a mano se
   desincroniza el día que agregás una pieza sin acordarte de anotarla,
   y entonces el índice miente. Acá no puede.

   `require.context` es de Metro y lo habilita Expo por defecto — es el
   mismo mecanismo sobre el que está construido Expo Router. El patrón
   sólo matchea `<slug>/index.tsx` en minúsculas y guiones, que es
   exactamente la forma que tiene que tener una pieza: su carpeta se
   llama como su slug, y ese slug es el que va a llevar en la library.
   ═══════════════════════════════════════════════════════════════ */
const CONTEXTO = require.context('./', true, /^\.\/[a-z0-9-]+\/index\.tsx$/)

const PIEZAS = CONTEXTO.keys()
  .map((k) => k.slice(2).replace('/index.tsx', ''))
  .sort()

/* "sheet-que-se-estira" → "Sheet que se estira". La MISMA cuenta que
   `aFrase` en src/privado/clips.ts del repo web: sólo la primera en
   mayúscula, porque el nombre de una pieza es una frase y no un
   título. */
const aFrase = (s: string) => {
  const limpio = s.replace(/-+/g, ' ').trim()
  return limpio ? limpio[0].toUpperCase() + limpio.slice(1) : s
}

export default function Indice() {
  return (
    <SafeAreaView style={css.pantalla}>
      <ScrollView contentContainerStyle={css.columna}>
        <Text style={css.titulo}>Piezas</Text>
        {PIEZAS.length === 0 ? (
          /* El guion, no una frase — la respuesta que esta casa ya dio
             para un dato ausente (ver .sinClips en el playground). */
          <Text style={css.vacio}>—</Text>
        ) : (
          PIEZAS.map((slug) => (
            /* EL ÚNICO `as` DEL TALLER, y va acotado a esta línea.
               `typedRoutes` genera la unión de rutas que existen y
               atrapa cualquier link mal escrito — vale tenerlo prendido.
               Pero ESTE link es dinámico por diseño: su destino sale del
               mismo `require.context` que dibujó la lista, así que la
               ruta existe por construcción. Apagar la comprobación de
               todo el proyecto por el único lugar donde no aplica sería
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

/* Sin esto TypeScript no conoce `require.context`: es una extensión de
   Metro, no del runtime. Va acá abajo y no en un .d.ts suelto para que
   viva al lado de su único uso. */
declare const require: {
  context(dir: string, hondo: boolean, patron: RegExp): { keys(): string[] }
}
