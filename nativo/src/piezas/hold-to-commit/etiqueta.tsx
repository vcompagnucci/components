import { MaterialSymbols_700Bold } from '@expo-google-fonts/material-symbols/700Bold'
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import { type ReactNode } from 'react'
import { Image, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
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
   ningún momento hay más tinta que la del texto nítido: un blur de
   verdad conserva la masa y sólo la desparrama, y con dos copias
   borrosas prendidas a la vez el label se veía más gordo y más brillante
   que en el clip (probado en captura: cruce=0.35 daba un texto blanco
   engordado donde el clip pierde tinta). Entrando (q sube) aparece como
   mancha ancha, se aprieta en la angosta, emerge el nítido y queda una
   cola tenue de halo: un ENFOQUE continuo, no un salto. Saliendo (q
   baja) es el mismo camino al revés, más rápido. Por qué presencia y no
   un solo "mezcla" de A a B: un cruce interrumpido —soltar mientras
   todavía aparece "Keep Holding..."— retoma cada label desde donde
   está, sin necesitar que las curvas de ida y vuelta sean espejo.

   EL COLOR TAMBIÉN ES OPACIDAD (2026-09-07, "¿hay chance de lograr lo
   mismo animando sólo transform y opacity?"). Antes el botón animaba
   `color` en el `Text` y `tintColor` en las copias: un prop que no es
   transform ni opacity, que la plataforma re-rasteriza. Ahora "Hold to
   Buy" y "Keep Holding..." existen TRES VECES, en las tres tintas
   medidas —la de reposo (blanco; negro sobre vidrio en claro), el gris
   verdoso (#202B24) y el negro—, cada tanda con su color FIJO y adentro
   de una capa cuya opacidad es la partición que el botón deriva del
   progreso (blanco 1−t₁, oscuro t₁(1−t₂), negro t₂; recibo en HOLD). Dos
   textos idénticos apilados y cruzados por opacidad dan exactamente la
   interpolación del color: en los píxeles cubiertos el resultado es
   blanco·(1−t) + oscuro·t. Cada tanda lleva `needsOffscreenAlphaCompositing`
   porque Android compone los hijos uno por uno y una tanda a media
   opacidad con sus tres capas superpuestas saldría más clara que la
   mezcla (trampa 28). "Order Placed" es negro siempre: una sola tanda.

   "✓ Order Placed" además ENTRA CRECIENDO desde `escalaEntrada` (pedido
   del 2026-09-03; el clip no escala) — la escala sigue a su presencia
   por un ease-out: rápido al principio, se asienta despacio. Con reduce
   motion no hay copias borrosas ni escala: los nítidos se cruzan solos
   por opacidad (animate-expo § 9: queda la opacidad, se va la escala).

   EL TILDE, según la receta (`tildeContextual`). Con la del clip entra
   pegado al texto: las PNG borrosas son de la fila entera. Con la receta
   `skill` (2026-09-07, "usá la técnica de ícono contextual de better-ui")
   entra con sus propias capas y las tres cosas que better-ui prescribe
   —"scale 0.25 to 1, opacity 0 to 1, blur 4px to 0px"— pero SOBRE EL
   MISMO RELOJ Y LA MISMA ESCALERA QUE EL TEXTO. Vito (2026-09-07): "¿el
   ícono y el Order Placed van de la mano al mismo tiempo? Aseguralo".
   Hubo dos formas de separarse y las dos están cerradas: (1) el tilde
   tenía un spring propio de 300 ms mientras el texto tardaba 450 desde
   los 210 de retardo, así que llegaba primero — ahora su reloj es
   `pListo`, la presencia del texto; (2) con el mismo reloj pero opacidad
   q, el texto llegaba a plena tinta en q = .4 (la escalera sube rápido)
   y el tilde recién en q = 1 — ahora su capa nítida lleva `nitido` y su
   copia borrosa `ancho + angosto`, o sea la MISMA partición: la tinta
   total y la fracción enfocada son las del texto en cada cuadro, y la
   escala .25 → 1 sigue el mismo ease-out. El blur 4 → 0 son esas dos
   capas, la PNG a σ 4 pt (o el `filter` en Android) y la nítida. Para
   que el tilde caiga exactamente donde lo pone la fila nítida, su capa
   es la MISMA fila con el texto invisible, y las filas del texto llevan
   una caja vacía del tamaño del tilde. Las PNG traen un margen (3σ, lo
   imprime `generar.swift`) que se descuenta con márgenes negativos para
   que su caja de layout sea la del contenido.

   EL LABEL SIGUE A DYNAMIC TYPE hasta `TEXTO.escalaMaxima` (×1.786, la
   primera talla de accesibilidad; recibo en medidas.ts): más grande no
   entra en un pill de 52 pt que no crece. `maxFontSizeMultiplier` pone
   ese techo en los textos, y las copias borrosas, el tilde y su hueco se
   escalan con el mismo factor (`useWindowDimensions().fontScale`,
   acotado) para que el cruce siga calzando. Con el tamaño de texto por
   defecto el factor es 1 y nada cambia. Antes (2026-09-02) era
   `allowFontScaling={false}`; animate-expo § 9 lo prohíbe y el techo
   resuelve lo mismo.

   EN ANDROID (2026-09-07, "que funcione tal cual en Android e iOS") las
   copias borrosas NO son las PNG: están hechas con SF Pro, que en
   Android no existe —el sistema dibuja el `Text` en Roboto— y un cruce
   entre una mancha de SF y un nítido de Roboto se ve doble. Ahí las
   copias son el MISMO `Text` con `filter: [{ blur }]`, que React Native
   aplica en Android con `RenderEffect` desde la API 31 (SOURCE:
   react-native 0.86, `BaseViewManager.java:558`; en iOS el `filter`
   con blur no está). Las σ son las mismas, la escalera es la misma, y
   el texto es el de la plataforma. Antes de la API 31 no hay blur: se
   cruzan los nítidos, como con reduce motion. El tilde tampoco es SF:
   `expo-symbols` dibuja en Android el `check` de Material Symbols en 700
   (recibo en `SIMBOLO`). `includeFontPadding: false` saca el relleno
   vertical que Android agrega a la caja del texto (iOS lo ignora).
   ═══════════════════════════════════════════════════════════════ */

export const HOLD = 0, KEEP = 1, LISTO = 2

/* Las dos σ de las copias borrosas, en pt: las de `generar.swift`. */
const SIGMA = { ancha: 2.5, angosta: 1.0 }
/* SOURCE · better-ui "Contextual icon animations": scale 0.25 → 1, blur 4px → 0. */
const TILDE_CONTEXTUAL = { escalaDesde: 0.25, sigma: 4 }
/* El margen de cada PNG en pt: 3σ del σ mayor de su tanda, a 3x (23 px
   para los textos, 36 para el tilde; lo imprime `generar.swift`). */
const MARGEN_PNG = { texto: 23 / 3, tilde: 36 / 3 }
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
  /* la fila entera, tilde incluido: la receta del clip */
  listo: { a: require('./media/committed-borroso-a.png'), b: require('./media/committed-borroso-b.png') },
  /* el texto solo y el tilde solo: la receta con el tilde contextual */
  placed: { a: require('./media/placed-borroso-a.png'), b: require('./media/placed-borroso-b.png') },
  tilde: require('./media/tilde-borroso.png'),
}
type Tam = { width: number; height: number }
const tam = (src: number): Tam => {
  const { width, height } = Image.resolveAssetSource(src)
  return { width, height }
}
/* Los dos niveles de un label miden lo mismo (generar.swift usa el margen
   del σ mayor para todos), así que una caja por label alcanza. */
const TAM = { hold: tam(BORROSO.hold.a), keep: tam(BORROSO.keep.a), listo: tam(BORROSO.listo.a), placed: tam(BORROSO.placed.a), tilde: tam(BORROSO.tilde) }

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
/** La partición del color del label entre sus tres tintas: suma 1. */
export type Tinta = { blanco: number; oscuro: number; negro: number }

type Props = {
  tinta: SharedValue<Tinta>
  /** El color de reposo: blanco sobre el pill opaco, negro sobre vidrio en claro. */
  colorReposo: string
  /** La presencia de cada label, indexada por HOLD / KEEP / LISTO. */
  presencia: Presencia
  /** Con reduce motion no hay copias borrosas ni escala: sólo se cruzan los nítidos. */
  sinBlur: boolean
  /** Desde qué escala entra "✓ Order Placed" (viene de la receta). */
  escalaEntrada?: number
  /** Si el tilde entra con sus capas contextuales (better-ui) o pegado al texto (clip). */
  tildeContextual: boolean
}

export function Etiqueta({ tinta, colorReposo, presencia, sinBlur: pedidoSinBlur, escalaEntrada = COMMIT.escalaEntrada, tildeContextual }: Props) {
  const [pHold, pKeep, pListo] = presencia
  /* Sin blur si lo pide reduce motion, o si la plataforma no puede hacerlo. */
  const sinBlur = pedidoSinBlur || (!PNG && !BLUR_NATIVO)
  /* El factor de Dynamic Type, acotado: el mismo techo que
     `maxFontSizeMultiplier` le pone al texto nítido. */
  const tipo = Math.min(useWindowDimensions().fontScale, TEXTO.escalaMaxima)
  const caja = (t: Tam) => ({ width: t.width * tipo, height: t.height * tipo })
  /* Una PNG con su margen descontado: su caja de layout es la del contenido. */
  const cajaRecortada = (t: Tam, margenPt: number) => ({ ...caja(t), margin: -margenPt * tipo })
  const tildeCaja = { width: SIMBOLO.tilde.caja.ancho * tipo, height: SIMBOLO.tilde.caja.alto * tipo }
  const hueco = { gap: LABEL.tildeATexto * tipo }

  /* Las tres tintas: una capa por color, con la partición como opacidad. */
  const tBlanco = useAnimatedStyle(() => ({ opacity: tinta.get().blanco }))
  const tOscuro = useAnimatedStyle(() => ({ opacity: tinta.get().oscuro }))
  const tNegro = useAnimatedStyle(() => ({ opacity: tinta.get().negro }))

  /* La escalera de cada label; un mismo estilo animado sirve a las tres tintas. */
  const holdNitido = useAnimatedStyle(() => ({ opacity: capas(pHold.get(), sinBlur).nitido }))
  const holdAncho = useAnimatedStyle(() => ({ opacity: capas(pHold.get(), sinBlur).ancho }))
  const holdAngosto = useAnimatedStyle(() => ({ opacity: capas(pHold.get(), sinBlur).angosto }))
  const keepNitido = useAnimatedStyle(() => ({ opacity: capas(pKeep.get(), sinBlur).nitido }))
  const keepAncho = useAnimatedStyle(() => ({ opacity: capas(pKeep.get(), sinBlur).ancho }))
  const keepAngosto = useAnimatedStyle(() => ({ opacity: capas(pKeep.get(), sinBlur).angosto }))
  const listoNitido = useAnimatedStyle(() => ({ opacity: capas(pListo.get(), sinBlur).nitido }))
  const listoAncho = useAnimatedStyle(() => ({ opacity: capas(pListo.get(), sinBlur).ancho }))
  const listoAngosto = useAnimatedStyle(() => ({ opacity: capas(pListo.get(), sinBlur).angosto }))
  /* La escala de "✓ Order Placed" sigue a su presencia con un ease-out (la
     presencia del commit entra lineal en la receta del clip): crece
     rápido y se asienta despacio. Con reduce motion, ninguna. */
  const listoEscala = useAnimatedStyle(() => {
    const q = pListo.get()
    const eo = 1 - (1 - q) * (1 - q)
    /* La corrección óptica va PRIMERO y en pt fijos: es una corrección de
       posición, no parte del movimiento, así que no escala con la
       entrada (translate antes que scale, que además es la regla del
       taller para el orden del array). Sí sigue a Dynamic Type: es una
       distancia en pt del label, y el label crece. El recibo —los tres
       números medidos y por qué la referencia no lo hace— está arriba de
       `LABEL.correccionOptica` en `medidas.ts`. */
    return {
      transform: [
        { translateX: LABEL.correccionOptica * tipo },
        { scale: sinBlur ? 1 : escalaEntrada + (1 - escalaEntrada) * eo },
      ],
    }
  })
  /* El tilde contextual, sobre la MISMA presencia y la MISMA escalera que
     el texto: su capa nítida lleva la opacidad del nítido del texto y su
     copia borrosa, la suma de las dos borrosas. Así la tinta total y la
     fracción enfocada son las del texto en todo instante, y la escala
     .25 → 1 sigue el mismo ease-out. Con reduce motion, sólo opacidad. */
  const tildeMarco = useAnimatedStyle(() => {
    const q = pListo.get()
    const eo = 1 - (1 - q) * (1 - q)
    return { transform: [{ scale: sinBlur ? 1 : TILDE_CONTEXTUAL.escalaDesde + (1 - TILDE_CONTEXTUAL.escalaDesde) * eo }] }
  })
  const tildeNitido = useAnimatedStyle(() => ({ opacity: capas(pListo.get(), sinBlur).nitido }))
  const tildeBorroso = useAnimatedStyle(() => {
    const c = capas(pListo.get(), sinBlur)
    return { opacity: c.ancho + c.angosto }
  })

  const texto = (s: string, color: string) => (
    <Text maxFontSizeMultiplier={TEXTO.escalaMaxima} style={[css.texto, { color }]}>
      {s}
    </Text>
  )
  /* Una copia borrosa: en iOS la PNG teñida; en Android el contenido con `filter`. */
  const borrosa = (png: number, t: Tam, color: string, sigma: number, contenido: ReactNode, margenPt?: number) =>
    PNG ? (
      <Image source={png} style={[margenPt === undefined ? caja(t) : cajaRecortada(t, margenPt), { tintColor: color }]} />
    ) : (
      <View style={{ filter: [{ blur: sigma }] }}>{contenido}</View>
    )
  /* "Hold to Buy" y "Keep Holding..." en una tinta: las seis capas. */
  const escalera = (color: string) => (
    <>
      {!sinBlur && <Animated.View style={[css.capa, holdAncho]}>{borrosa(BORROSO.hold.a, TAM.hold, color, SIGMA.ancha, texto(LABEL.reposo, color))}</Animated.View>}
      {!sinBlur && <Animated.View style={[css.capa, holdAngosto]}>{borrosa(BORROSO.hold.b, TAM.hold, color, SIGMA.angosta, texto(LABEL.reposo, color))}</Animated.View>}
      <Animated.View style={[css.capa, holdNitido]}>{texto(LABEL.reposo, color)}</Animated.View>
      {!sinBlur && <Animated.View style={[css.capa, keepAncho]}>{borrosa(BORROSO.keep.a, TAM.keep, color, SIGMA.ancha, texto(LABEL.sosteniendo, color))}</Animated.View>}
      {!sinBlur && <Animated.View style={[css.capa, keepAngosto]}>{borrosa(BORROSO.keep.b, TAM.keep, color, SIGMA.angosta, texto(LABEL.sosteniendo, color))}</Animated.View>}
      <Animated.View style={[css.capa, keepNitido]}>{texto(LABEL.sosteniendo, color)}</Animated.View>
    </>
  )

  const simbolo = (
    <SymbolView
      name={{ ios: SIMBOLO.tilde.nombre, android: SIMBOLO.tilde.android }}
      scale="large"
      weight={{ ios: SIMBOLO.tilde.peso, android: PESO_ANDROID }}
      tintColor={COLOR.tintaNegra}
      size={PNG ? undefined : tildeCaja.height}
      style={tildeCaja}
    />
  )
  /* "Order Placed" con su peso medido (semibold, como los otros dos; el recibo está en TEXTO). */
  const textoListo = (
    <Text maxFontSizeMultiplier={TEXTO.escalaMaxima} style={[css.texto, { fontWeight: TEXTO.pesoCommitted, color: COLOR.tintaNegra }]}>
      {LABEL.listo}
    </Text>
  )
  /* La fila medida: tilde y texto juntos, y las PNG de la fila entera. */
  const filaMedida = (
    <View style={[css.fila, hueco]}>
      {simbolo}
      {textoListo}
    </View>
  )
  /* La fila con el tilde contextual: el texto con una caja vacía donde va
     el tilde, y el tilde en su propia capa con el texto invisible. */
  const filaTexto = (contenido: ReactNode) => (
    <View style={[css.fila, hueco]}>
      <View style={tildeCaja} />
      {contenido}
    </View>
  )
  const filaTilde = (
    <View style={[css.fila, hueco]}>
      <Animated.View style={[tildeCaja, tildeMarco]}>
        {!sinBlur && (
          <Animated.View style={[StyleSheet.absoluteFill, tildeBorroso]}>
            {borrosa(BORROSO.tilde, TAM.tilde, COLOR.tintaNegra, TILDE_CONTEXTUAL.sigma, simbolo, MARGEN_PNG.tilde)}
          </Animated.View>
        )}
        <Animated.View style={[StyleSheet.absoluteFill, tildeNitido]}>{simbolo}</Animated.View>
      </Animated.View>
      <Text maxFontSizeMultiplier={TEXTO.escalaMaxima} style={[css.texto, { fontWeight: TEXTO.pesoCommitted }, css.invisible]}>
        {LABEL.listo}
      </Text>
    </View>
  )

  return (
    /* `key={tipo}`: un cambio de Dynamic Type en vivo agranda los glifos
       pero no re-mide la caja del `Text` (RUNTIME: a AX5 el label quedó
       recortado en la caja de 17 pt); remontar el label lo mide de nuevo. */
    <View key={tipo} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Hold to Buy y Keep Holding..., en sus tres tintas */}
      <Animated.View needsOffscreenAlphaCompositing style={[css.capa, tBlanco]}>
        {escalera(colorReposo)}
      </Animated.View>
      <Animated.View needsOffscreenAlphaCompositing style={[css.capa, tOscuro]}>
        {escalera(COLOR.tintaOscura)}
      </Animated.View>
      <Animated.View needsOffscreenAlphaCompositing style={[css.capa, tNegro]}>
        {escalera(COLOR.tintaNegra)}
      </Animated.View>

      {/* ✓ Order Placed — las capas adentro de la vista que escala */}
      <Animated.View style={[css.capa, listoEscala]}>
        {tildeContextual ? (
          <>
            {!sinBlur && (
              <Animated.View style={[css.capa, listoAncho]}>
                {filaTexto(borrosa(BORROSO.placed.a, TAM.placed, COLOR.tintaNegra, SIGMA.ancha, textoListo, MARGEN_PNG.texto))}
              </Animated.View>
            )}
            {!sinBlur && (
              <Animated.View style={[css.capa, listoAngosto]}>
                {filaTexto(borrosa(BORROSO.placed.b, TAM.placed, COLOR.tintaNegra, SIGMA.angosta, textoListo, MARGEN_PNG.texto))}
              </Animated.View>
            )}
            <Animated.View style={[css.capa, listoNitido]}>{filaTexto(textoListo)}</Animated.View>
            <View style={css.capa}>{filaTilde}</View>
          </>
        ) : (
          <>
            {!sinBlur && <Animated.View style={[css.capa, listoAncho]}>{borrosa(BORROSO.listo.a, TAM.listo, COLOR.tintaNegra, SIGMA.ancha, filaMedida)}</Animated.View>}
            {!sinBlur && <Animated.View style={[css.capa, listoAngosto]}>{borrosa(BORROSO.listo.b, TAM.listo, COLOR.tintaNegra, SIGMA.angosta, filaMedida)}</Animated.View>}
            <Animated.View style={[css.capa, listoNitido]}>{filaMedida}</Animated.View>
          </>
        )}
      </Animated.View>
    </View>
  )
}

const css = StyleSheet.create({
  capa: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  texto: { fontSize: TEXTO.cuerpo, fontWeight: TEXTO.pesoBoton, includeFontPadding: false },
  invisible: { opacity: 0 },
  fila: { flexDirection: 'row', alignItems: 'center' },
})
