import { useMemo } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { MEDIA } from './media'
import { LABEL } from './measurements'
import { useScrollPlegable } from './collapse'
import { usePaleta } from './theme'

/* ═══════════════════════════════════════════════════════════════
   EL CONTENIDO DE CADA PÁGINA.

   Lorem ipsum de texto — se mira sin leerse, que es lo que hace falta
   cuando lo que se estudia es la barra — y MEDIA REAL: las imágenes
   las asignó el usuario tab por tab (2026-09-01, ver `media.ts`), como
   mockup de tweets de verdad. Las seis páginas tienen fotos; una
   página sin lista (si se agrega un tab) conserva los bloques grises
   del mock original.

   Las fotos van en las filas IMPARES (1, 3, 5…), en el orden de la
   lista: cada página abre con un tweet de texto y después alterna,
   determinístico como todo lo demás — dos tomas del mismo gesto tienen
   que ser comparables.

   La página ocupa la pantalla entera y deja libre arriba el alto del
   bloque plegable; su scroll vertical es lo que pliega la cabecera
   (`useScrollPlegable`, recibo en `pliegue.tsx`). Sin separador
   superior propio, a propósito: X tiene uno pegado al borde de abajo de
   su bloque (dos filas: el borde, que se apaga, y el separador, que
   no), pero su borde está 64 pt abajo del divisor de los tabs y acá
   el borde ES el divisor — un separador debajo haría el divisor de
   2 px en reposo, y el reposo está medido en 1. Se probó y se sacó.

   DE DÓNDE SALE CADA MEDIDA:
   · avatar 40 pt — MEDIDO en el clip: 123 px a 3x = 41 pt, el punto de
     más los bordes suavizados. 40 es el valor limpio.
   · el ratio de cada foto viaja medido en `media.ts` y acá se CLAMPEA
     a [3:4, 16:9] — decisión nuestra, SIN RECIBO: el recorte real de
     X cambió entre versiones; 3:4 mantiene hojeable el feed con las
     capturas verticales (la más alta es 9:16).
   · el resto de los espaciados y el radio de los bloques son DECISIÓN
     NUESTRA, no medición. Quedan dichos como lo que son.
   ═══════════════════════════════════════════════════════════════ */

const LOREM =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(
    ' ',
  )

/* Un corte determinístico del lorem. Determinístico y no al azar para
   que la página se vea igual en cada render y en cada grabación: si el
   texto cambiara solo, dos tomas del mismo gesto no serían comparables. */
const palabras = (semilla: number, cuantas: number) => {
  const desde = (semilla * 7) % (LOREM.length - cuantas)
  return LOREM.slice(desde, desde + cuantas).join(' ')
}

const enMayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const RENGLONES = 12

export function Pagina({ id, indice }: { id: string; indice: number }) {
  const paleta = usePaleta()
  const fotos = MEDIA[id]
  const { handler, alto } = useScrollPlegable(indice)
  /* Los colores van aparte de la geometría: la paleta cambia con el
     tema del sistema y esto es lo único que se recalcula. */
  const tinte = useMemo(
    () => ({
      fila: { borderBottomColor: paleta.divisor },
      bloque: { backgroundColor: paleta.divisor },
      nombre: { color: paleta.activo },
      secundario: { color: paleta.inactivo },
      texto: { color: paleta.activo },
    }),
    [paleta],
  )
  return (
    <Animated.ScrollView
      style={css.pagina}
      contentContainerStyle={[css.columna, { paddingTop: alto }]}
      showsVerticalScrollIndicator={false}
      onScroll={handler}
      scrollEventThrottle={16}
    >
      {Array.from({ length: RENGLONES }, (_, fila) => {
        const semilla = indice * 31 + fila
        /* Las fotos ocupan las filas impares en orden; pasada la lista,
           filas de texto solo. Sin fotos asignadas, el bloque gris del
           mock original con su ritmo de siempre. */
        const foto = fotos && fila % 2 === 1 ? fotos[(fila - 1) / 2] : undefined
        return (
          <View key={fila} style={[css.fila, tinte.fila]}>
            <View style={[css.avatar, tinte.bloque]} />
            <View style={css.cuerpo}>
              <View style={css.encabezado}>
                <Text style={[css.nombre, tinte.nombre]} allowFontScaling={LABEL.escala}>{enMayuscula(palabras(semilla, 2))}</Text>
                <Text style={[css.secundario, tinte.secundario]} allowFontScaling={LABEL.escala}>@{palabras(semilla + 3, 1)}</Text>
              </View>
              <Text style={[css.texto, tinte.texto]} allowFontScaling={LABEL.escala}>{palabras(semilla, 12 + (semilla % 14))}</Text>
              {foto ? (
                <View style={[css.media, { aspectRatio: Math.min(Math.max(foto.ratio, 3 / 4), 16 / 9) }]}>
                  <Image source={foto.fuente} style={css.fotografia} resizeMode="cover" />
                </View>
              ) : (
                !fotos && semilla % 3 === 0 && <View style={[css.media, tinte.bloque]} />
              )}
            </View>
          </View>
        )
      })}
    </Animated.ScrollView>
  )
}

const css = StyleSheet.create({
  pagina: { flex: 1 },
  columna: { paddingBottom: 48 },
  fila: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cuerpo: { flex: 1, gap: 4 },
  encabezado: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },

  /* Los dos bloques grises usan el ÚNICO gris de superficie que la
     referencia dejó medido —el divisor— porque agregar un gris nuevo
     sería inventar un valor para algo que ni siquiera es el tema de la
     pieza. El color concreto lo pone `tinte` según la paleta. */
  avatar: { width: 40, height: 40, borderRadius: 20 },

  /* `borderCurve: 'continuous'` es el detalle que hace que un rectángulo
     redondeado se vea de iOS y no de la web: iOS no dibuja un arco de
     círculo en la esquina, dibuja una squircle, y RN expone eso desde
     0.76. Sin esto el radio "correcto" igual se ve ajeno.
     `overflow: hidden` porque adentro va la foto de verdad y el clip al
     squircle lo hace la caja, no la imagen. El 16/9 es el fallback del
     bloque gris; con foto, el ratio clampeado lo pisa. */
  media: {
    marginTop: 8,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  fotografia: { width: '100%', height: '100%' },

  nombre: { fontSize: LABEL.tamano, fontWeight: LABEL.peso },
  secundario: { fontSize: LABEL.tamano },
  texto: { fontSize: LABEL.tamano, lineHeight: 20 },
})
