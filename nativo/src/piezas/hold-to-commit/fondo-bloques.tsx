import { StyleSheet, View, type ViewStyle } from 'react-native'

import { CARD, COLOR, DIAS, HUECO, PANTALLA, SECCION, TOGGLE } from './medidas'

/* ═══════════════════════════════════════════════════════════════
   EL FONDO "BLOQUES" — la pantalla de Opal como esqueleto: la misma
   grilla, las mismas alturas y paddings medidos, sin texto, sin color y
   sin manchas. Cada texto es una barra gris, cada control es su
   silueta. Así el botón tiene contexto (está al pie de un formulario)
   sin que nada compita con él.

   TRES GRISES, todos neutros: el fondo (COLOR.fondo), las cards
   (COLOR.card) y las barras (`BARRA`, un escalón más claro). Nada tiene
   tinte.

   EL BOTÓN NO SE TOCA NI SE PISA: el último bloque termina
   `SECCION.alPill` (32 pt, medido en el clip) por encima del pill, que
   es la misma distancia que la última card de Opal. Pedido del
   2026-09-03: "mucho mejor y ordenado, que no se overlapeen con el
   botón".
   ═══════════════════════════════════════════════════════════════ */

/* RUNTIME · las barras hacen de texto: una línea de SF 17 ocupa 20.3 pt
   de caja; la barra mide 14 (la altura de la x más la panza) y queda
   centrada en esos 20.3 → 3 pt de aire arriba y abajo. */
const BARRA = { alto: 14, radio: 7, color: '#2A2A2A', aire: 3 } as const
const TITULO = { ancho: 168, alto: 30, radio: 9, color: '#2E2E2E' } as const

function Barra({ ancho, alto = BARRA.alto, style }: { ancho: number; alto?: number; style?: ViewStyle }) {
  return <View style={[{ width: ancho, height: alto, borderRadius: alto / 2, backgroundColor: BARRA.color }, style]} />
}

/* Una fila de card: barra a la izquierda, barra a la derecha, con la
   misma caja de línea (20.3) que el texto que reemplaza. */
function Fila({ izquierda, derecha }: { izquierda: number; derecha: number }) {
  return (
    <View style={css.fila}>
      <Barra ancho={izquierda} />
      <Barra ancho={derecha} />
    </View>
  )
}

export function FondoBloques({ paddingTop }: { paddingTop: number }) {
  return (
    <>
      {/* La cabeza: el título y su descripción, como barras. */}
      <View style={[css.cabeza, { paddingTop }]}>
        <View style={css.tituloBarra} />
        <Barra ancho={236} />
      </View>

      <View style={css.estirar} />

      <View style={css.bloque}>
        <View style={css.cabecera}>
          <Barra ancho={112} />
        </View>
        <View style={{ height: SECCION.abajo }} />
        {/* From / To: dos filas con el paso medido de la línea de tiempo. */}
        <View style={[css.card, { paddingVertical: CARD.paddingVertical + 2 }]}>
          <Fila izquierda={58} derecha={86} />
          <View style={{ height: 15.4 }} />
          <Fila izquierda={30} derecha={92} />
        </View>
        <View style={{ height: CARD.separacion }} />
        {/* Los días: la fila de texto y los siete círculos, en gris. */}
        <View style={css.card}>
          <Fila izquierda={128} derecha={66} />
          <View style={{ height: HUECO.textoACirculos }} />
          <View style={css.circulos}>
            {Array.from({ length: 7 }, (_, i) => (
              <View key={i} style={css.circulo} />
            ))}
          </View>
        </View>
        <View style={{ height: SECCION.arriba }} />
        <View style={css.cabecera}>
          <Barra ancho={148} />
        </View>
        <View style={{ height: SECCION.abajo }} />
        <View style={css.card}>
          <Fila izquierda={118} derecha={58} />
        </View>
        <View style={{ height: CARD.separacion }} />
        {/* Hard Mode: dos líneas a la izquierda y la silueta del toggle. */}
        <View style={[css.card, css.filaCentrada, { paddingVertical: CARD.paddingVerticalDosLineas }]}>
          <View style={{ gap: CARD.entreLineas }}>
            <View style={css.linea}>
              <Barra ancho={92} />
            </View>
            <View style={css.linea}>
              <Barra ancho={150} />
            </View>
          </View>
          <View style={css.toggle}>
            <View style={css.knob} />
          </View>
        </View>
      </View>
    </>
  )
}

/* La caja de una línea de SF 17: 20.3 pt. Las barras se centran en ella
   para que las cards midan lo mismo que las de Opal. */
const LINEA = 20.3

const css = StyleSheet.create({
  cabeza: { paddingHorizontal: PANTALLA.margen, gap: 10 },
  tituloBarra: { width: TITULO.ancho, height: TITULO.alto, borderRadius: TITULO.radio, backgroundColor: TITULO.color, marginTop: 52 },
  estirar: { flex: 1 },
  bloque: { paddingHorizontal: PANTALLA.margen },
  /* La cabecera de sección va HUECO.insetCabecera desde el borde de la
     pantalla, 4 pt más afuera que el texto de las cards, como en Opal. */
  cabecera: { height: LINEA, justifyContent: 'center', marginLeft: HUECO.insetCabecera - PANTALLA.margen },
  card: {
    backgroundColor: COLOR.card,
    borderRadius: CARD.radio,
    borderCurve: 'continuous',
    paddingLeft: CARD.padding,
    paddingRight: CARD.paddingDerecho,
    paddingVertical: CARD.paddingVertical,
  },
  fila: { height: LINEA, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filaCentrada: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linea: { height: LINEA, justifyContent: 'center' },
  circulos: { flexDirection: 'row', justifyContent: 'space-between' },
  circulo: { width: DIAS.diametro, height: DIAS.diametro, borderRadius: DIAS.diametro / 2, backgroundColor: BARRA.color },
  toggle: {
    width: TOGGLE.ancho,
    height: TOGGLE.alto,
    borderRadius: TOGGLE.alto / 2,
    backgroundColor: BARRA.color,
    justifyContent: 'center',
    paddingLeft: TOGGLE.inset,
    marginRight: TOGGLE.correccionDerecha,
  },
  knob: { width: TOGGLE.knobAncho, height: TOGGLE.knobAlto, borderRadius: TOGGLE.knobAlto / 2, backgroundColor: '#3A3A3A' },
})
