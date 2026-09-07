import { MaterialSymbols_700Bold } from '@expo-google-fonts/material-symbols/700Bold'
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import { type ReactNode } from 'react'
import { Image, Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

import { COLOR, COMMIT, LABEL, SIMBOLO, TEXTO } from './medidas'

/* ═══════════════════════════════════════════════════════════════
   EL LABEL — tres textos, cada uno con su PRESENCIA, y el `.blurReplace`
   de iOS hecho con una escalera de copias desenfocadas.

   En la referencia el texto que se va se DESENFOCA mientras se apaga y
   el que llega se enfoca mientras se prende, centrados, sin escala ni
   desplazamiento (tiras ampliadas en `.context/hold-to-commit/cruces`).
   React Native no desenfoca vistas en el Taller.app instalado (el
   `filter: blur` de RN 0.86 está detrás de una bandera nativa apagada —
   ver `media/generar.swift`), así que cada label tiene TRES copias: el
   `Text` nítido y dos imágenes del mismo texto ya desenfocadas con la
   misma SF Pro, una ancha (σ 2.5 pt) y una angosta (σ 1.0), teñidas con
   `tintColor`. El cruce es puro opacidad sobre el hilo de UI.

   LA ESCALERA. Cada label tiene una presencia q (0..1) que el botón anima
   con `withTiming`; las tres capas leen q. Una opacidad total o(q) sube
   rápido (q ∈ [0, .4]) y se reparte entre las capas como PARTICIÓN —los
   tres pesos suman 1—: de la ancha a la angosta en q ∈ [.1, .35], y de
   la angosta a la nítida en [.2, 1], con el 80 % del pase en [.2, .45]
   y el 20 % restante como cola hasta 1. Las ventanas salieron de
   comparar capturas con sonda en ms contra el cuadro del clip del mismo
   instante (`cmp-press-t.png`): con el pase en [.45, .75] el entrante
   seguía borroso a los 140 ms donde el clip ya está nítido. Así en
   ningún momento hay más
   tinta que la del texto nítido: un blur de verdad conserva la masa y
   sólo la desparrama, y con dos copias borrosas prendidas a la vez el
   label se veía más gordo y más brillante que en el clip (probado en
   captura: cruce=0.35 daba un texto blanco engordado donde el clip pierde
   tinta). Entrando (q sube) aparece como mancha ancha, se aprieta en la
   angosta, emerge el nítido y queda una cola tenue de halo: un ENFOQUE
   continuo, no un salto. Saliendo (q baja) es el mismo camino al revés,
   más rápido. Por qué presencia y no un solo "mezcla" de A a B: un cruce
   interrumpido —soltar mientras todavía aparece "Keep Holding..."—
   retoma cada label desde donde está, sin necesitar que las curvas de
   ida y vuelta sean espejo.

   "✓ Committed" además ENTRA CRECIENDO desde `escalaEntrada` (pedido del
   2026-09-03; el clip no escala) — la escala sigue a su presencia por un
   ease-out: rápido al principio, se asienta despacio. Con reduce motion
   no hay copias borrosas ni escala: los nítidos se cruzan solos por
   opacidad (animate-expo § 9: queda la opacidad, se va la escala).

   El color del texto viaja en `tinta`, que el botón deriva del progreso
   (blanco → gris verdoso al 55 % → negro al 96.5 %; recibo en HOLD).
   "Committed" es negro siempre.

   EL LABEL SIGUE A DYNAMIC TYPE hasta `TEXTO.escalaMaxima` (×1.786, la
   primera talla de accesibilidad; recibo en medidas.ts): más grande no
   entra en un pill de 52 pt que no crece. `maxFontSizeMultiplier` pone
   ese techo en los tres textos, y las copias borrosas, el tilde y su
   hueco se escalan con el mismo factor (`useWindowDimensions().fontScale`,
   acotado) para que el cruce siga calzando. Con el tamaño de texto por
   defecto el factor es 1 y nada cambia: las capturas contra el clip se
   hacen con el simulador en `content_size large`, que es el default.
   Antes (2026-09-02) era `allowFontScaling={false}` por la
   comparabilidad de las tomas; animate-expo § 9 lo prohíbe y el techo
   resuelve lo mismo.

   EN ANDROID (2026-09-07, "que funcione tal cual en Android e iOS") las
   copias borrosas NO son las PNG: están hechas con SF Pro, que en
   Android no existe —el sistema dibuja el `Text` en Roboto— y un cruce
   entre una mancha de SF y un nítido de Roboto se ve doble. Ahí las
   copias son el MISMO `Text` con `filter: [{ blur }]`, que React Native
   aplica en Android con `RenderEffect` desde la API 31 (SOURCE:
   react-native 0.86, `BaseViewManager.java:558`; en iOS el `filter`
   con blur no está). Las σ son las mismas de `generar.swift` (2.5 y
   1.0 pt), la escalera es la misma, y el texto es el de la plataforma.
   Antes de la API 31 no hay blur: se cruzan los nítidos, como con
   reduce motion. El tilde tampoco es SF: `expo-symbols` dibuja en
   Android el `check` de Material Symbols en 700 (recibo en `SIMBOLO`).
   `includeFontPadding: false` saca el relleno vertical que Android
   agrega a la caja del texto (iOS lo ignora): centrado igual.
   ═══════════════════════════════════════════════════════════════ */

export const HOLD = 0, KEEP = 1, LISTO = 2

/* Las dos σ de las copias borrosas, en pt: las de `generar.swift`. */
const SIGMA = { ancha: 2.5, angosta: 1.0 }
/* Android dibuja las copias con `filter: blur` desde la API 31; iOS, con las PNG. */
const BLUR_NATIVO = Platform.OS === 'android' && Number(Platform.Version) >= 31
const PNG = Platform.OS === 'ios'
/* El peso del tilde en Android: Material Symbols 700, la misma fuente
   que `expo-symbols` trae para sus pesos. */
type PesoAndroid = Extract<NonNullable<SymbolViewProps['weight']>, { android: unknown }>['android']
const PESO_ANDROID: PesoAndroid = { name: 'MaterialSymbols_700Bold', font: MaterialSymbols_700Bold }

const BORROSO = {
  hold: { a: require('./media/hold-borroso-a.png'), b: require('./media/hold-borroso-b.png') },
  keep: { a: require('./media/keep-borroso-a.png'), b: require('./media/keep-borroso-b.png') },
  listo: { a: require('./media/committed-borroso-a.png'), b: require('./media/committed-borroso-b.png') },
}
const tam = (src: number) => {
  const { width, height } = Image.resolveAssetSource(src)
  return { width, height }
}
/* Los dos niveles de un label miden lo mismo (generar.swift usa el margen
   del σ mayor para todos), así que una caja por label alcanza. */
const TAM = { hold: tam(BORROSO.hold.a), keep: tam(BORROSO.keep.a), listo: tam(BORROSO.listo.a) }

/* smoothstep entre a y b: suaviza los bordes de cada tramo. */
const suave = (v: number, a: number, b: number) => {
  'worklet'
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/* La escalera: opacidad de cada capa según la presencia q del label.
   Partición de la opacidad total: ancho + angosto + nítido = o(q). */
const capas = (q: number, sinBlur: boolean) => {
  'worklet'
  if (sinBlur) return { nitido: q, ancho: 0, angosto: 0 }
  const o = suave(q, 0, 0.4)
  const aAngosto = suave(q, 0.1, 0.35)
  const aNitido = 0.8 * suave(q, 0.2, 0.45) + 0.2 * suave(q, 0.45, 1)
  return { ancho: o * (1 - aAngosto), angosto: o * (aAngosto - aNitido * aAngosto), nitido: o * aNitido * aAngosto }
}

export type Presencia = readonly [SharedValue<number>, SharedValue<number>, SharedValue<number>]

type Props = {
  tinta: SharedValue<string>
  /** La presencia de cada label, indexada por HOLD / KEEP / LISTO. */
  presencia: Presencia
  /** Con reduce motion no hay copias borrosas ni escala: sólo se cruzan los nítidos. */
  sinBlur: boolean
  /** Desde qué escala entra "✓ Committed" (viene de la receta). */
  escalaEntrada?: number
}

export function Etiqueta({ tinta, presencia, sinBlur: pedidoSinBlur, escalaEntrada = COMMIT.escalaEntrada }: Props) {
  const [pHold, pKeep, pListo] = presencia
  /* Sin blur si lo pide reduce motion, o si la plataforma no puede hacerlo. */
  const sinBlur = pedidoSinBlur || (!PNG && !BLUR_NATIVO)
  /* El factor de Dynamic Type, acotado: el mismo techo que
     `maxFontSizeMultiplier` le pone al texto nítido. */
  const tipo = Math.min(useWindowDimensions().fontScale, TEXTO.escalaMaxima)
  const caja = (t: { width: number; height: number }) => ({ width: t.width * tipo, height: t.height * tipo })
  const tilde = { width: SIMBOLO.tilde.caja.ancho * tipo, height: SIMBOLO.tilde.caja.alto * tipo }
  const hueco = { gap: LABEL.tildeATexto * tipo }

  const color = useAnimatedStyle(() => ({ color: tinta.get() }))
  const tinte = useAnimatedStyle(() => ({ tintColor: tinta.get() }))

  const holdNitido = useAnimatedStyle(() => ({ opacity: capas(pHold.get(), sinBlur).nitido }))
  const holdAncho = useAnimatedStyle(() => ({ opacity: capas(pHold.get(), sinBlur).ancho }))
  const holdAngosto = useAnimatedStyle(() => ({ opacity: capas(pHold.get(), sinBlur).angosto }))
  const keepNitido = useAnimatedStyle(() => ({ opacity: capas(pKeep.get(), sinBlur).nitido }))
  const keepAncho = useAnimatedStyle(() => ({ opacity: capas(pKeep.get(), sinBlur).ancho }))
  const keepAngosto = useAnimatedStyle(() => ({ opacity: capas(pKeep.get(), sinBlur).angosto }))
  const listoNitido = useAnimatedStyle(() => ({ opacity: capas(pListo.get(), sinBlur).nitido }))
  const listoAncho = useAnimatedStyle(() => ({ opacity: capas(pListo.get(), sinBlur).ancho }))
  const listoAngosto = useAnimatedStyle(() => ({ opacity: capas(pListo.get(), sinBlur).angosto }))
  /* La escala de "✓ Committed" sigue a su presencia con un ease-out (la
     presencia del commit entra lineal en la receta del clip): crece
     rápido y se asienta despacio. Con reduce motion, ninguna. */
  const listoEscala = useAnimatedStyle(() => {
    const q = pListo.get()
    const eo = 1 - (1 - q) * (1 - q)
    return { transform: [{ scale: sinBlur ? 1 : escalaEntrada + (1 - escalaEntrada) * eo }] }
  })

  /* Los tres textos nítidos; en Android también son las copias borrosas. */
  const holdTexto = (
    <Animated.Text maxFontSizeMultiplier={TEXTO.escalaMaxima} style={[css.texto, color]}>
      {LABEL.reposo}
    </Animated.Text>
  )
  const keepTexto = (
    <Animated.Text maxFontSizeMultiplier={TEXTO.escalaMaxima} style={[css.texto, color]}>
      {LABEL.sosteniendo}
    </Animated.Text>
  )
  const listoFila = (
    <View style={[css.fila, hueco]}>
      <SymbolView
        name={{ ios: SIMBOLO.tilde.nombre, android: SIMBOLO.tilde.android }}
        scale="large"
        weight={{ ios: SIMBOLO.tilde.peso, android: PESO_ANDROID }}
        tintColor={COLOR.tintaNegra}
        size={PNG ? undefined : tilde.height}
        style={tilde}
      />
      <Animated.Text maxFontSizeMultiplier={TEXTO.escalaMaxima} style={[css.texto, css.listo]}>
        {LABEL.listo}
      </Animated.Text>
    </View>
  )
  /* Una copia borrosa: en iOS la PNG teñida; en Android el contenido con `filter`. */
  const borrosa = (png: number, tam: { width: number; height: number }, negra: boolean, sigma: number, contenido: ReactNode) =>
    PNG ? <Animated.Image source={png} style={[caja(tam), negra ? css.negro : tinte]} /> : <View style={{ filter: [{ blur: sigma }] }}>{contenido}</View>

  return (
    /* `key={tipo}`: un cambio de Dynamic Type en vivo agranda los glifos
       pero no re-mide la caja del `Text` (RUNTIME: a AX5 el label quedó
       recortado en la caja de 17 pt); remontar el label lo mide de nuevo. */
    <View key={tipo} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Hold to Commit */}
      {!sinBlur && <Animated.View style={[css.capa, holdAncho]}>{borrosa(BORROSO.hold.a, TAM.hold, false, SIGMA.ancha, holdTexto)}</Animated.View>}
      {!sinBlur && <Animated.View style={[css.capa, holdAngosto]}>{borrosa(BORROSO.hold.b, TAM.hold, false, SIGMA.angosta, holdTexto)}</Animated.View>}
      <Animated.View style={[css.capa, holdNitido]}>{holdTexto}</Animated.View>

      {/* Keep Holding... */}
      {!sinBlur && <Animated.View style={[css.capa, keepAncho]}>{borrosa(BORROSO.keep.a, TAM.keep, false, SIGMA.ancha, keepTexto)}</Animated.View>}
      {!sinBlur && <Animated.View style={[css.capa, keepAngosto]}>{borrosa(BORROSO.keep.b, TAM.keep, false, SIGMA.angosta, keepTexto)}</Animated.View>}
      <Animated.View style={[css.capa, keepNitido]}>{keepTexto}</Animated.View>

      {/* ✓ Committed — las tres capas adentro de la vista que escala */}
      <Animated.View style={[css.capa, listoEscala]}>
        {!sinBlur && <Animated.View style={[css.capa, listoAncho]}>{borrosa(BORROSO.listo.a, TAM.listo, true, SIGMA.ancha, listoFila)}</Animated.View>}
        {!sinBlur && <Animated.View style={[css.capa, listoAngosto]}>{borrosa(BORROSO.listo.b, TAM.listo, true, SIGMA.angosta, listoFila)}</Animated.View>}
        <Animated.View style={[css.capa, listoNitido]}>{listoFila}</Animated.View>
      </Animated.View>
    </View>
  )
}

const css = StyleSheet.create({
  capa: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  texto: { fontSize: TEXTO.cuerpo, fontWeight: TEXTO.pesoBoton, color: COLOR.texto, includeFontPadding: false },
  listo: { fontWeight: TEXTO.pesoCommitted, color: COLOR.tintaNegra },
  negro: { tintColor: COLOR.tintaNegra },
  fila: { flexDirection: 'row', alignItems: 'center' },
})
