import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BotonHold, type Esquema } from './boton'
import { type Carga, CargaJS, cargaJS, cargaPesada, cargaRender } from './carga'
import { FONDOS, type Fondo } from './fondo'
import { FondoAccion, paleta } from './fondo-accion'
import { FondoBloques } from './fondo-bloques'
import { FondoOpal } from './fondo-opal'
import { ACABADOS, type Acabado } from './acabado'
import { MATERIALES, type Material } from './material'
import { Medidor } from './medidor'
import { CLARO, COLOR, PANTALLA, PILL, SECCION } from './medidas'
import { RECETAS, type Receta } from './receta'

/* ═══════════════════════════════════════════════════════════════
   LA PANTALLA — el botón, y detrás lo que diga `fondo`.

   El botón es el mismo en todas las variantes y no sabe cuál está
   puesta: recibe su ancho, su receta, su sonda y el ESQUEMA de la
   pantalla, nada más. Lo que cambia es lo de atrás y dónde queda el
   pill (al pie, como en el clip, o centrado). Las variantes están
   descritas en `fondo.ts`; la pantalla de Opal, medida, vive en
   `fondo-opal.tsx`.

   EL ESQUEMA LO DECIDE LA PANTALLA, no el sistema: los fondos de Opal
   y sus esqueletos son oscuros siempre (el clip es oscuro), así que
   sólo `accion` sigue al modo claro/oscuro del sistema. El botón, los
   chips y la barra de estado reciben ese esquema y no consultan nada.

   Con `fondo = 'elegir'` o `receta = 'elegir'` aparece un selector
   arriba para pasar de una variante a otra en vivo. Es andamiaje de la
   exploración: se va cuando haya ganador.

   LA CARGA Y EL MEDIDOR son andamiaje de rendimiento (`carga.tsx`,
   `medidor.tsx`): con `carga` se ocupa el hilo de JS y/o se
   re-renderiza la ficha a 10 Hz debajo del botón; con `medir` se
   cuentan cuadros y latencias durante 9 s y se reportan por consola.
   ═══════════════════════════════════════════════════════════════ */

type Props = {
  sonda?: string
  acabado: Acabado | 'elegir'
  fondo: Fondo | 'elegir'
  receta: Receta | 'elegir'
  material: Material | 'elegir'
  carga?: Carga
  medir?: boolean
  /** A dónde manda el informe el medidor, además de la consola. */
  receptor?: string
}

/* Lo que dura la secuencia entera con la sonda `auto`: 700 ms de espera,
   1 s de hold, la ráfaga, 5 s hasta el reinicio y el fundido. */
const VENTANA_MEDIDOR = 9000

export function Pantalla({ sonda, fondo: pedido, receta: pedida, material: pedidoMaterial, acabado: pedidoAcabado, carga, medir = false, receptor }: Props) {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const sistema = useColorScheme()
  const [elegido, setElegido] = useState<Fondo>(pedido === 'elegir' ? FONDOS[0]! : pedido)
  const [elegida, setElegida] = useState<Receta>(pedida === 'elegir' ? RECETAS[0]! : pedida)
  const [elegidoMaterial, setElegidoMaterial] = useState<Material>(pedidoMaterial === 'elegir' ? MATERIALES[0]! : pedidoMaterial)
  const [elegidoAcabado, setElegidoAcabado] = useState<Acabado>(pedidoAcabado === 'elegir' ? ACABADOS[0]! : pedidoAcabado)
  const fondo = pedido === 'elegir' ? elegido : pedido
  const receta = pedida === 'elegir' ? elegida : pedida
  const material = pedidoMaterial === 'elegir' ? elegidoMaterial : pedidoMaterial
  const acabado = pedidoAcabado === 'elegir' ? elegidoAcabado : pedidoAcabado
  const esquema: Esquema = fondo === 'accion' && sistema === 'light' ? 'light' : 'dark'
  const anchoPill = width - 2 * PANTALLA.margenPill
  const pillArriba = insets.bottom + PILL.sobreSafeArea + PILL.alto

  return (
    <View style={[css.pantalla, fondo === 'accion' && { backgroundColor: paleta(esquema).fondo }]}>
      <StatusBar style={esquema === 'light' ? 'dark' : 'light'} />
      {fondo === 'opal' && <FondoOpal pillArriba={pillArriba} paddingTop={insets.top} />}
      {fondo === 'bloques' && <FondoBloques paddingTop={insets.top} />}
      {/* `accion` scrollea por DEBAJO del botón, que flota: es lo que hace
          que el vidrio se lea (refracta lo que pasa detrás) y es cómo
          flota un botón primario en iOS 26. */}
      {fondo === 'accion' && (
        <FondoAccion paddingTop={insets.top} paddingBottom={insets.bottom + PILL.sobreSafeArea + PILL.alto + SECCION.alPill} enVivo={cargaRender(carga)} />
      )}
      {(fondo === 'liso' || fondo === 'centrado') && <View style={css.estirar} />}

      <View
        pointerEvents="box-none"
        style={[
          css.pie,
          (fondo === 'opal' || fondo === 'bloques') && css.pieOpal,
          fondo === 'accion' ? [css.flotante, { bottom: insets.bottom + PILL.sobreSafeArea }] : { marginBottom: fondo === 'centrado' ? 0 : insets.bottom + PILL.sobreSafeArea },
        ]}
      >
        <BotonHold ancho={anchoPill} receta={receta} sonda={sonda} derrame={fondo === 'opal'} material={material} esquema={esquema} acabado={acabado} />
      </View>
      {fondo === 'centrado' && <View style={css.estirar} />}

      {(pedido === 'elegir' || pedida === 'elegir' || pedidoMaterial === 'elegir' || pedidoAcabado === 'elegir') && (
        <View pointerEvents="box-none" style={[css.selector, { top: insets.top + 8 }]}>
          {pedido === 'elegir' && <Selector opciones={FONDOS} activa={fondo} elegir={setElegido} esquema={esquema} />}
          {pedida === 'elegir' && <Selector opciones={RECETAS} activa={receta} elegir={setElegida} esquema={esquema} />}
          {pedidoMaterial === 'elegir' && <Selector opciones={MATERIALES} activa={material} elegir={setElegidoMaterial} esquema={esquema} />}
          {pedidoAcabado === 'elegir' && <Selector opciones={ACABADOS} activa={acabado} elegir={setElegidoAcabado} esquema={esquema} />}
        </View>
      )}

      {cargaJS(carga) && <CargaJS pesada={cargaPesada(carga)} />}
      {medir && <Medidor contexto={`${carga ?? 'sin carga'} · ${receta} · ${material} · ${esquema}`} ventana={VENTANA_MEDIDOR} receptor={receptor} />}
    </View>
  )
}

/* Una fila de chips: chrome de la exploración, no candidato. Sigue al
   esquema de la pantalla: en claro, los grises de sistema de iOS. */
function Selector<T extends string>({ opciones, activa, elegir, esquema }: { opciones: readonly T[]; activa: T; elegir: (o: T) => void; esquema: Esquema }) {
  const claro = esquema === 'light'
  return (
    <View style={css.fila}>
      {opciones.map((o) => {
        const activo = o === activa
        return (
          <Pressable
            key={o}
            onPress={() => elegir(o)}
            hitSlop={6}
            style={[css.opcion, { backgroundColor: claro ? (activo ? CLARO.chipActivo : CLARO.chip) : activo ? COLOR.chipActivo : COLOR.chip }]}
          >
            <Text allowFontScaling={false} style={[css.opcionTexto, { color: claro ? (activo ? CLARO.chipTextoActivo : CLARO.chipTexto) : activo ? COLOR.texto : COLOR.secundario }]}>
              {o}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const css = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLOR.fondo },
  estirar: { flex: 1 },
  pie: { alignItems: 'center' },
  /* Con cards arriba (Opal o su esqueleto) el pill va a la distancia
     medida de la última card: nada lo toca. */
  pieOpal: { marginTop: SECCION.alPill },
  /* El botón flotando sobre el contenido, a la misma distancia del borde. */
  flotante: { position: 'absolute', left: 0, right: 0 },
  selector: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 6 },
  fila: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  opcion: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  opcionTexto: { fontSize: 12, fontWeight: '600' },
})
