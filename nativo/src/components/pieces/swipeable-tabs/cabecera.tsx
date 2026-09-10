import { Image, StyleSheet, View } from 'react-native'

import { CABECERA } from './medidas'
import { usePaleta } from './theme'

/* La foto de perfil del usuario (pedido del 2026-09-02): 400×400 de
   origen, guardada a 192 px = el círculo de 32 pt a 3x, con margen. */
const PERFIL = require('./media/perfil.jpg')

/* ═══════════════════════════════════════════════════════════════
   LA CABECERA — la franja que va arriba de los tabs.

   En la referencia tiene la foto de perfil a la izquierda y el logo de
   X en el medio. Acá va sólo la foto: el logo es de ellos, y una pieza
   de estudio que lo copia deja de ser una pieza de estudio.

   Pero la franja SÍ tiene que estar, y no es decoración. Sin ella los
   tabs quedan pegados a la barra de estado y el subrayado arranca
   contra el borde de la pantalla — que no es lo que se está
   estudiando. El alto está medido: el avatar y el logo comparten
   centro vertical en 83.8 pt, el tab bar arranca en 106, y de ahí sale
   una franja de 44, el mismo alto que la barra de tabs.

   La foto es la del usuario, fija, recortada al mismo círculo de 32 pt
   que mide el avatar de la referencia. Debajo va el gris del divisor
   mientras carga, que es el mismo bloque que usan los avatares del feed.
   ═══════════════════════════════════════════════════════════════ */
export function Cabecera() {
  const paleta = usePaleta()
  return (
    <View style={css.cabecera}>
      <Image source={PERFIL} style={[css.avatar, { backgroundColor: paleta.divisor }]} />
    </View>
  )
}

const css = StyleSheet.create({
  cabecera: {
    height: CABECERA.alto,
    justifyContent: 'center',
    paddingHorizontal: CABECERA.inset,
  },
  avatar: {
    width: CABECERA.avatar,
    height: CABECERA.avatar,
    borderRadius: CABECERA.avatar / 2,
  },
})
