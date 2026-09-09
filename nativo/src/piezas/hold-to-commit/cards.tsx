import { SymbolView } from 'expo-symbols'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View, type ViewStyle } from 'react-native'

import { BADGE, CARD, COLOR, DIAS, HUECO, LINEA_TIEMPO, SIMBOLO, TEXTO, TOGGLE } from './medidas'

/* ═══════════════════════════════════════════════════════════════
   LAS PIEZAS DE LA PANTALLA — todo lo que rodea al botón.

   Nada de esto anima ni responde: en el clip el único gesto es el del
   botón, y estas cards existen para que el botón esté en su lugar. Los
   valores están medidos (ver `medidas.ts`); lo que NO se pudo medir es
   lo que el clip corta arriba, y está marcado SUPUESTO donde aparece.
   ═══════════════════════════════════════════════════════════════ */

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[css.card, style]}>{children}</View>
}

export const Label = ({ children }: { children: ReactNode }) => (
  <Text allowFontScaling={false} style={css.label}>
    {children}
  </Text>
)
export const Valor = ({ children, hora, suelto }: { children: ReactNode; hora?: boolean; suelto?: boolean }) => (
  <Text allowFontScaling={false} style={[css.valor, hora && css.hora, suelto && css.valorSuelto]}>
    {children}
  </Text>
)
export const Secundario = ({ children }: { children: ReactNode }) => (
  <Text allowFontScaling={false} style={css.secundario}>
    {children}
  </Text>
)

/* "Selected Apps · 5 Apps ›" y "To · 10:00 PM ⌃⌄": label a la izquierda,
   valor y símbolo a la derecha, con el hueco de 12 medido. */
export function Derecha({ valor, simbolo }: { valor: string; simbolo: 'chevron' | 'stepper' }) {
  const s = SIMBOLO[simbolo]
  return (
    <View style={css.derecha}>
      <Valor hora={simbolo === 'stepper'}>{valor}</Valor>
      <SymbolView
        name={s.nombre}
        scale="large"
        weight="semibold"
        tintColor={COLOR.secundario}
        style={{ width: s.caja.ancho, height: s.caja.alto, marginRight: -s.desdeDerecha }}
      />
    </View>
  )
}

/* El header de sección: un SF Symbol gris y el texto en bold. */
export function CabeceraSeccion({ simbolo, texto }: { simbolo: 'candado' | 'reloj'; texto: string }) {
  const s = SIMBOLO[simbolo]
  return (
    <View style={css.cabecera}>
      <SymbolView
        name={s.nombre}
        scale="large"
        weight="semibold"
        tintColor={COLOR.secundario}
        style={{ width: s.caja.ancho, height: s.caja.alto }}
      />
      <Text allowFontScaling={false} style={css.seccion}>
        {texto}
      </Text>
    </View>
  )
}

/* Los siete círculos: 44 con 8 de hueco, letra negra en bold. */
export function Circulos() {
  return (
    <View style={css.circulos}>
      {DIAS.letras.map((l, i) => (
        <View key={i} style={css.circulo}>
          <Text allowFontScaling={false} style={css.letra}>
            {l}
          </Text>
        </View>
      ))}
    </View>
  )
}

/* El toggle custom de la referencia: NO es un UISwitch (ver TOGGLE). */
export function Toggle() {
  return (
    <View style={css.track}>
      <View style={css.knob} />
    </View>
  )
}

/* [⚡ PRO]: cápsula con borde verde, rayo y texto de 11 con tracking. */
export function BadgePro() {
  return (
    <View style={css.badge}>
      <SymbolView name={SIMBOLO.rayo.nombre} scale="large" weight="bold" tintColor={COLOR.pro} style={css.rayo} />
      <Text allowFontScaling={false} style={css.pro}>
        PRO
      </Text>
    </View>
  )
}

/* Una fila de la línea de tiempo: el nodo (círculo lleno para "From",
   hueco para "To"), el conector punteado hacia arriba si corresponde, y
   el label. El conector se dibuja con rayas de verdad (5 pt, hueco 2.5)
   porque `borderStyle: 'dashed'` no deja elegir el paso. */
export function FilaHora({ texto, hora, lleno, conector }: { texto: string; hora: string; lleno: boolean; conector: boolean }) {
  const rayas = Math.floor((LINEA_TIEMPO.pasoFila - LINEA_TIEMPO.circulo) / (LINEA_TIEMPO.raya + LINEA_TIEMPO.huecoRaya))
  return (
    <View style={css.filaHora}>
      <View style={css.columnaTiempo}>
        {conector && (
          <View style={css.conector}>
            {Array.from({ length: rayas }, (_, i) => (
              <View key={i} style={css.raya} />
            ))}
          </View>
        )}
        <View style={[css.nodo, lleno ? css.nodoLleno : css.nodoHueco]} />
      </View>
      <Label>{texto}</Label>
      <View style={css.estirar} />
      <Derecha valor={hora} simbolo="stepper" />
    </View>
  )
}

/* Una mancha de color desenfocada del fondo. El clip muestra cuatro,
   sólo por el margen izquierdo, entre las cards y el borde: son lo que
   queda de un fondo con imagen. Se hacen con la sombra difusa de un
   punto, que es lo único en RN que desenfoca sin módulo nativo. */
export function Mancha({ x, y, radio, color }: { x: number; y: number; radio: number; color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - 4,
        bottom: y - 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        boxShadow: `0 0 ${radio}px ${radio * 0.6}px ${color}`,
      }}
    />
  )
}

const css = StyleSheet.create({
  card: {
    backgroundColor: COLOR.card,
    borderRadius: CARD.radio,
    borderCurve: 'continuous',
    paddingLeft: CARD.padding,
    paddingRight: CARD.paddingDerecho,
    paddingVertical: CARD.paddingVertical,
  },
  label: { fontSize: TEXTO.cuerpo, fontWeight: TEXTO.pesoLabel, color: COLOR.texto },
  valor: { fontSize: TEXTO.valor, fontWeight: TEXTO.pesoValor, color: COLOR.secundario },
  hora: { fontSize: TEXTO.hora },
  valorSuelto: { marginRight: -HUECO.colaValor },
  secundario: { fontSize: TEXTO.cuerpo, fontWeight: TEXTO.pesoValor, color: COLOR.secundario },
  seccion: { fontSize: TEXTO.cuerpo, fontWeight: TEXTO.pesoSeccion, color: COLOR.texto },
  derecha: { flexDirection: 'row', alignItems: 'center', gap: HUECO.valorAIcono },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: HUECO.iconoATexto, paddingHorizontal: HUECO.insetCabecera },
  circulos: { flexDirection: 'row', justifyContent: 'space-between', marginTop: HUECO.textoACirculos },
  circulo: {
    width: DIAS.diametro,
    height: DIAS.diametro,
    borderRadius: DIAS.diametro / 2,
    backgroundColor: COLOR.circulo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letra: { fontSize: TEXTO.cuerpo, fontWeight: '700', color: COLOR.circuloLetra },
  track: {
    width: TOGGLE.ancho,
    height: TOGGLE.alto,
    borderRadius: TOGGLE.alto / 2,
    backgroundColor: COLOR.toggleTrack,
    justifyContent: 'center',
    paddingLeft: TOGGLE.inset,
    marginRight: TOGGLE.correccionDerecha,
  },
  knob: {
    width: TOGGLE.knobAncho,
    height: TOGGLE.knobAlto,
    borderRadius: TOGGLE.knobAlto / 2,
    backgroundColor: COLOR.toggleKnob,
  },
  badge: {
    height: BADGE.alto,
    borderRadius: BADGE.alto / 2,
    borderWidth: BADGE.borde,
    borderColor: COLOR.pro,
    backgroundColor: COLOR.proFondo,
    paddingLeft: BADGE.paddingIzquierdo,
    paddingRight: BADGE.paddingDerecho,
    flexDirection: 'row',
    alignItems: 'center',
    gap: BADGE.entreRayoYTexto,
  },
  rayo: { width: SIMBOLO.rayo.caja.ancho, height: SIMBOLO.rayo.caja.alto },
  pro: { fontSize: TEXTO.badge, fontWeight: '700', color: COLOR.pro, letterSpacing: TEXTO.badgeTracking },
  filaHora: { flexDirection: 'row', alignItems: 'center', height: LINEA_TIEMPO.pasoFila },
  columnaTiempo: { width: LINEA_TIEMPO.columna, marginRight: LINEA_TIEMPO.aTexto, alignItems: 'center', justifyContent: 'center' },
  conector: {
    position: 'absolute',
    bottom: LINEA_TIEMPO.circulo / 2 + LINEA_TIEMPO.huecoRaya,
    alignItems: 'center',
    gap: LINEA_TIEMPO.huecoRaya,
  },
  raya: { width: LINEA_TIEMPO.grosor, height: LINEA_TIEMPO.raya, backgroundColor: COLOR.secundario, borderRadius: 0.5 },
  nodo: { width: LINEA_TIEMPO.circulo, height: LINEA_TIEMPO.circulo, borderRadius: LINEA_TIEMPO.circulo / 2 },
  nodoLleno: { backgroundColor: COLOR.secundario },
  nodoHueco: { borderWidth: LINEA_TIEMPO.anillo, borderColor: COLOR.secundario },
  estirar: { flex: 1 },
})
