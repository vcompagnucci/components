import { SymbolView } from 'expo-symbols'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { BadgePro, CabeceraSeccion, Card, Circulos, Derecha, FilaHora, Label, Mancha, Secundario, Toggle, Valor } from './cards'
import { ARRIBA, CARD, COLOR, HUECO, PANTALLA, SECCION, SIMBOLO } from './medidas'

/* ═══════════════════════════════════════════════════════════════
   EL FONDO "OPAL" — la pantalla del clip, medida, con el botón al pie.

   EL BLOQUE MEDIDO VA ANCLADO ABAJO. El clip muestra la mitad inferior
   de la pantalla (desde la fila "To" hasta el botón) y cada distancia
   entre esas cosas está medida; la parte de arriba no existe en el
   clip. Así que lo medido se apila desde el pill hacia arriba con sus
   separaciones exactas, y lo SUPUESTO (título y descripción) va arriba
   con un espacio flexible en el medio. Si hubiera que elegir qué
   sacrificar, se sacrifica lo inventado.

   Las manchas del fondo están en el clip: cuatro restos de color por el
   margen izquierdo (rojo, marrón, gris, gris azulado), medidos en
   posición y color. No decoran: sin ellas el fondo es más limpio que el
   de la referencia, y la pieza deja de ser una copia.

   Es una variante de `fondo.ts`: el botón no sabe de ella.
   ═══════════════════════════════════════════════════════════════ */

type Props = {
  /** Altura del borde superior del pill desde el borde inferior de la pantalla. */
  pillArriba: number
  paddingTop: number
}

export function FondoOpal({ pillArriba, paddingTop }: Props) {
  const router = useRouter()
  return (
    <>
      {/* Las manchas se ubican desde el borde superior del pill, que es el
          punto fijo del bloque medido (RUNTIME: centros a 383, 311, 235 y
          444 pt por encima; a 18.5, 11, 13 y 11 pt del borde izquierdo). */}
      <Mancha x={11} y={pillArriba + 444} radio={11} color="rgba(220,70,0,0.13)" />
      <Mancha x={18.5} y={pillArriba + 383} radio={15} color="rgba(180,0,50,0.30)" />
      <Mancha x={11} y={pillArriba + 311} radio={11} color="rgba(255,255,255,0.04)" />
      <Mancha x={13} y={pillArriba + 235} radio={22} color="rgba(80,120,140,0.14)" />

      {/* SUPUESTO: la cabeza de la pantalla. */}
      <View style={[css.arriba, { paddingTop }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={css.volver} accessibilityRole="button" accessibilityLabel="Back">
          <SymbolView name={SIMBOLO.volver.nombre} scale="large" weight="semibold" tintColor={COLOR.texto} style={css.chevronVolver} />
        </Pressable>
        <Text allowFontScaling={false} style={css.titulo}>
          {ARRIBA.titulo}
        </Text>
        <Secundario>{ARRIBA.descripcion}</Secundario>
      </View>

      <View style={css.estirar} />

      <View style={css.bloque}>
        <CabeceraSeccion simbolo="reloj" texto="Schedule" />
        <View style={{ height: SECCION.abajo }} />
        <Card style={{ paddingVertical: 0 }}>
          <FilaHora texto="From" hora={ARRIBA.horaDesde} lleno conector={false} />
          <FilaHora texto="To" hora={ARRIBA.horaHasta} lleno={false} conector />
        </Card>
        <View style={{ height: CARD.separacion }} />
        <Card>
          <View style={css.fila}>
            <Label>On these days:</Label>
            <Valor suelto>Everyday</Valor>
          </View>
          <Circulos />
        </Card>
        <View style={{ height: SECCION.arriba }} />
        <CabeceraSeccion simbolo="candado" texto="Apps are blocked" />
        <View style={{ height: SECCION.abajo }} />
        <Card>
          <View style={css.fila}>
            <Label>Selected Apps</Label>
            <Derecha valor="5 Apps" simbolo="chevron" />
          </View>
        </Card>
        <View style={{ height: CARD.separacion }} />
        <Card style={{ paddingVertical: CARD.paddingVerticalDosLineas }}>
          <View style={css.fila}>
            <View style={css.dosLineas}>
              <View style={css.filaBadge}>
                <Label>Hard Mode</Label>
                <BadgePro />
              </View>
              <Secundario>No unblocks allowed</Secundario>
            </View>
            <Toggle />
          </View>
        </Card>
      </View>
    </>
  )
}

const css = StyleSheet.create({
  arriba: { paddingHorizontal: PANTALLA.margen, gap: 6 },
  volver: { width: 44, height: 44, justifyContent: 'center', marginLeft: -12, marginBottom: 2 },
  chevronVolver: { width: SIMBOLO.volver.caja.ancho, height: SIMBOLO.volver.caja.alto },
  titulo: { fontSize: ARRIBA.tituloTamano, fontWeight: '700', color: COLOR.texto, letterSpacing: 0.4 },
  estirar: { flex: 1 },
  bloque: { paddingHorizontal: PANTALLA.margen },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dosLineas: { gap: CARD.entreLineas },
  filaBadge: { flexDirection: 'row', alignItems: 'center', gap: HUECO.labelABadge },
})
