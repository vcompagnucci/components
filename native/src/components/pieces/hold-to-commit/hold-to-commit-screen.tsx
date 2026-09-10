import { useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { type Carga, CargaJS, cargaJS, cargaPesada, cargaRender } from './load'
import { FONDO, FONDOS, type Fondo } from './background'
import { FondoAccion, paleta } from './backgrounds/stock'
import { FondoBloques } from './backgrounds/blocks'
import { FondoOpal } from './backgrounds/opal'
import { HoldToCommit, type Esquema } from './hold-to-commit'
import { MATERIAL, MATERIALES, type Material } from './material'
import { Medidor } from './meter'
import { CLARO, COLOR, PANTALLA, PILL, SECCION } from './measurements'
import { RECETA, RECETAS, type Receta } from './recipe'
import { CARGA, MEDIR, RECEPTOR, SONDA } from './probe'

/* ═══════════════════════════════════════════════════════════════
   HOLD TO COMMIT — la pantalla, autocontenida: el botón, y detrás lo
   que diga `fondo`. La ruta (`src/app/[slug].tsx`) la encuentra en el
   registro por su slug y la monta; acá se leen las perillas y se
   compone todo. En la exhibition la pieza se llama `Hold to buy`: el
   slug quedó el del día en que se publicó (ver `Piece` en
   `src/pieces.ts` del repo web).

   La referencia es `VAULT_DIR/nativo/Hold to commit.mp4`: el botón de
   **Opal** (Screen Time Control, Apple Design Award 2025), publicado por
   @60fpsdesign en X y catalogado en 60fps.design como "Opal Hold to
   Commit Button Interaction"; 60 fps. Medida cuadro a cuadro: el recibo
   de cada valor está en `medidas.ts` y los scripts de medición en
   `.context/hold-to-commit/`.

   LA CARPETA TIENE LA FORMA DE components/animations/<slug>/ DE
   react-native-motion, con sus mismos nombres: `index.tsx` exporta esta
   pantalla por defecto, `hold-to-commit.tsx` es el botón —el
   mecanismo—, y al lado sus partes (`etiqueta`, `chispas`,
   `particulas`), sus valores con recibo (`medidas.ts`, `receta.ts`), la
   háptica y el sonido, las variantes (`fondo.ts`, `material.ts`; los
   fondos dibujados, en `fondos/`) y el andamiaje de medición
   (`sonda.ts`, `carga.tsx`, `medidor.tsx`).

   El botón es el mismo en todas las variantes y no sabe cuál está
   puesta: recibe su ancho, su receta, su sonda y el ESQUEMA de la
   pantalla, nada más. Lo que cambia es lo de atrás y dónde queda el
   pill (al pie, como en el clip, o centrado). Las variantes están
   descritas en `fondo.ts`; la pantalla de Opal, medida, vive en
   `fondos/opal.tsx`.

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

   LAS PERILLAS, por URL o escritas en un archivo. La sonda
   (`?parcar=0.5`, `commit`, `rafaga=0.2`, `cruce=25`,
   `cruce-commit=308`, `cruce-suelta=217`, `auto`, `auto-suelta`) deja la
   pieza en un estado fijo por recarga para medirla contra el clip; no
   hace nada si no se pasa. Por URL o, más cómodo desde la terminal,
   escribiéndola en `sonda.ts` (ver ahí por qué). El fondo
   (`?fondo=liso`, o `FONDO` en `fondo.ts`) elige qué hay detrás del
   botón, y la receta (`?receta=skill`, o `RECETA` en `receta.ts`) qué
   curvas y tiempos lleva: los medidos del clip o los de las tablas de
   animate-expo. Con `'elegir'` la pieza muestra un selector para
   cambiarlos en vivo. Las lee `HoldToCommitScreen`, que es lo que el
   registro monta; `Pantalla` recibe todo ya decidido.

   Cuando esté lista:  pnpm grabar hold-to-commit
   ═══════════════════════════════════════════════════════════════ */

/* Lo que el registro monta. Las perillas del archivo mandan sobre la
   URL en la sonda, la carga, el medidor y el receptor —son las que
   escribe un script y no puede pisar un link viejo—; en el fondo, la
   receta y el material manda la URL, que son las que se cambian
   mirando. Es la misma precedencia que tenía la ruta cuando era una
   por pieza. */
export function HoldToCommitScreen() {
  const { parcar, fondo, receta, material, carga, medir } = useLocalSearchParams<{
    parcar?: string
    fondo?: Fondo
    receta?: Receta
    material?: Material
    carga?: Carga
    medir?: string
  }>()
  return (
    <Pantalla
      sonda={SONDA ?? parcar}
      fondo={fondo ?? FONDO}
      receta={receta ?? RECETA}
      material={material ?? MATERIAL}
      carga={CARGA ?? carga}
      medir={MEDIR || medir === '1'}
      receptor={RECEPTOR}
    />
  )
}

type Props = {
  sonda?: string
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

function Pantalla({ sonda, fondo: pedido, receta: pedida, material: pedidoMaterial, carga, medir = false, receptor }: Props) {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const sistema = useColorScheme()
  const [elegido, setElegido] = useState<Fondo>(pedido === 'elegir' ? FONDOS[0]! : pedido)
  const [elegida, setElegida] = useState<Receta>(pedida === 'elegir' ? RECETAS[0]! : pedida)
  const [elegidoMaterial, setElegidoMaterial] = useState<Material>(pedidoMaterial === 'elegir' ? MATERIALES[0]! : pedidoMaterial)
  const fondo = pedido === 'elegir' ? elegido : pedido
  const receta = pedida === 'elegir' ? elegida : pedida
  const material = pedidoMaterial === 'elegir' ? elegidoMaterial : pedidoMaterial
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
        <HoldToCommit ancho={anchoPill} receta={receta} sonda={sonda} derrame={fondo === 'opal'} material={material} esquema={esquema} />
      </View>
      {fondo === 'centrado' && <View style={css.estirar} />}

      {(pedido === 'elegir' || pedida === 'elegir' || pedidoMaterial === 'elegir') && (
        <View pointerEvents="box-none" style={[css.selector, { top: insets.top + 8 }]}>
          {pedido === 'elegir' && <Selector opciones={FONDOS} activa={fondo} elegir={setElegido} esquema={esquema} />}
          {pedida === 'elegir' && <Selector opciones={RECETAS} activa={receta} elegir={setElegida} esquema={esquema} />}
          {pedidoMaterial === 'elegir' && <Selector opciones={MATERIALES} activa={material} elegir={setElegidoMaterial} esquema={esquema} />}
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

/*
 * No tocar sin volver a medir
 *
 * — El hold dura `HOLD.duracion` y el LongPress activa en el MISMO
 *   número a propósito. Si se separan, el relleno llega antes o después
 *   de que el gesto complete. Son 1000 ms desde el 2026-09-07 (pedido,
 *   primero 1500 y después 1000); lo medido en el clip son 2000, y todo
 *   lo que es función del progreso se comprime solo.
 *   RUNTIME: 121 cuadros del press a la ráfaga; frente lineal a 7.75
 *   px/cuadro. SOURCE: los dos leen HOLD.duracion.
 *
 * — El frente es una erfc de σ = 19 pt CENTRADA en el borde geométrico y
 *   con forma de cápsula, ESCALADA en x alrededor de ese borde (.66 +
 *   .36·p: más angosto al principio). Y el borde geométrico va del 4.5
 *   al 95.5 % del ancho en los 2 s, no de punta a punta; al completar se
 *   desliza al 101 % mientras blanquea.
 *   RUNTIME: 50 % del frente cada 100 ms f76…f181 (174 pt/s, 93.5 % en
 *   f181); ancho 90→10 % 51→64 pt a lo largo del hold; verificado en
 *   captura a ±5 en p .23 / .5 / .74 / .99.
 *
 * — La punta izquierda del blob se OSCURECE y se ENSANCHA a medida que el
 *   frente se aleja: la textura del velo es la del final (f181) y se
 *   escala en x desde la punta, s = .25 + .75·p; se invierte POR CANAL
 *   contra el color objetivo (verde pálido). Un velo gris no puede dar
 *   (150,172,156), y uno fijo no puede dar 249 → 183 a 38 pt.
 *   RUNTIME: f88…f181 cada 6 cuadros; verificado exacto en cuatro progresos.
 *
 * — El relleno se ENCIENDE en 330 ms con ease-in-out (arranca lento), y
 *   al soltar se apaga con una exponencial de τ = 60 ms mientras el
 *   frente retrocede despacio (400 ms ease-out).
 *   RUNTIME: pico a 10 pt del borde f63…f80 y f13…f20; captura a ±7.
 *
 * — El pill escala a .953 al apretar, con ease-out CUADRÁTICO de 250 ms.
 *   Con bezier(.23,1,.32,1) cierra el doble de rápido. Al completar
 *   vuelve con un salto del 25 % en un cuadro y 220 ms de ease-out.
 *   RUNTIME: bordes 157→182 / 1194→1169; 16/52/80/96 % a 1/4/8/13 cuadros;
 *   ancho 364→369→374→378→380→382 en f182…f195, captura a ±1.3 pt.
 *
 * — El label es semibold 17 en los tres estados. "Committed" parece bold
 *   sólo porque "Keep Holding..." está achicado por el press.
 *   RUNTIME: anchos de tinta 121.1 / 118.9 / 86.7 pt contra SF medido en
 *   macOS: medium y bold quedan a 2–4 %. Los textos son "Hold to Buy" /
 *   "Keep Holding..." / "✓ Order Placed" desde el 2026-09-04 (pedido:
 *   un botón para comprar); la medida de peso es de los de Opal y vale
 *   igual. Las copias borrosas se regeneran con `media/generate.swift`.
 *
 * — El color del label sale del PROGRESO: blanco → gris verdoso (#202B24)
 *   entre .55 y .70 con ease-out, y escalón a negro en .965.
 *   RUNTIME: mínimo de luminancia en "Ke": 253 en f128 → 47 en f146 →
 *   meseta hasta f177 → 26 en f178.
 *
 * — Los cruces del label son blur-replace con DOS copias desenfocadas
 *   por texto (σ 2.5 y 1.0, rasterizadas en Swift, teñidas con tintColor)
 *   y una escalera que es partición de la opacidad; cada label tiene su
 *   presencia. Son asimétricos: press 360 ease-out / 48; suelta 600
 *   lineal desde 150 / 250 desde 80; commit 450 lineal desde 210 / 280
 *   desde 40. "✓ Committed" entra creciendo desde .9 (SUPUESTO, pedido).
 *   RUNTIME: asta de la "i" de Commit y de Holding cuadro a cuadro
 *   (f61–f95, f10–f44, f184–f220); verificado con sondas en ms contra el
 *   cuadro del clip del mismo instante.
 *
 * — Las chispas de adentro del pill son función del progreso: nacen
 *   8–100 pt delante del frente, viajan a la derecha al 50–75 % de su
 *   velocidad y viven 250–450 ms. 12 vistas × 3 vidas.
 *   RUNTIME: 24 pistas enlazadas en f64–f182 (chispas2.py).
 *
 * — La ráfaga se ABRE desde el centro: dx final = 0.075 × (x₀ − centro),
 *   más el viaje por la normal (2–17 pt, mediana 7), puntas incluidas.
 *   Sin esa correlación la nube tiembla y se ve sucia.
 *   RUNTIME: 58 pistas enlazadas (rastro.py), −18.7 / +14.3 en las puntas.
 *
 * — Las partículas se miden en CAPTURA, nunca en la grabación de simctl:
 *   el video las comprime hasta volverlas polvo y engañó dos veces.
 *   RUNTIME: pico mediano 175/125/81 a 36/204/516 ms contra 189/127/84
 *   del clip; diámetro mediano 2.7 contra 2.7.
 *
 * — Los SF Symbols llevan su caja natural y scaleAspectFit: el `size` de
 *   SymbolView no es el pointSize (rasteriza a 14 siempre).
 *   SOURCE: expo-symbols/ios/SymbolView.swift:127.
 *
 * — Al completar suena el éxito de Apple Pay (`sonido.ts`,
 *   `media/purchase.wav` = `payment_success.caf` de iOS; ASSET DE APPLE,
 *   no se redistribuye), disparado 60 ms antes del final del hold desde
 *   el mismo reloj que el relleno, sólo si el iPhone no está en
 *   silencio y sin pausar otras apps. Reproductor precalentado: reusar
 *   uno con `seekTo` + `play` perdía golpes, y crearlo en el momento
 *   tardaba. Expo Go trae `expo-audio`; el dev client, no.
 *
 * — La háptica sigue la tabla de animate-expo § 8: `selectionAsync` en
 *   cada uno de los doce detentes (acelerando de 300 a 60 ms) y Success
 *   al completar; apretar y soltar no vibran. No tiene recibo: el clip
 *   es video. Se ajusta con el teléfono en la mano, en `haptica.ts` y en
 *   ningún otro lado.
 *
 * — TODO `withTiming` del botón lleva `reduceMotion: Never`, y reduce
 *   motion se aplica a mano: sin escala, sin barrido (el relleno entero
 *   con el progreso como opacidad), sin chispas, ráfaga ni copias
 *   borrosas; quedan opacidad y color. Con el default de Reanimated
 *   (`System`) el relleno saltaba entero en el cuadro del press.
 *   RUNTIME: luminancia media del pill 64.2 → 182.0 en un cuadro y
 *   clavada los 2 s, simulador B con Reduce Motion (2026-09-04).
 *
 * — El label sigue a Dynamic Type hasta ×1.786 (`TEXTO.escalaMaxima`,
 *   la primera talla de accesibilidad); copias borrosas y tilde escalan
 *   con el mismo factor. Más grande no entra en un pill de 52 pt.
 *   SOURCE: RCTAccessibilityManager.mm:267; caja de línea 20.3 × 1.786.
 *
 * — Las curvas y los tiempos son una RECETA (`receta.ts`): `clip` es lo
 *   medido; `skill` son las tablas de animate-expo a la letra, para
 *   compararlas en vivo sin perder lo fiel. Las sondas miden `clip`.
 *
 * — El reinicio a los 5 s es un SUPUESTO del taller (el clip no lo
 *   muestra) y es un FUNDIDO en dos fases, nunca un barrido: primero se
 *   apagan el velo blanco y el relleno con el label saliente, y recién
 *   con el relleno invisible el progreso vuelve a 0 y entra el label de
 *   reposo. Si el progreso se anima a 0 con el relleno visible, se ve
 *   retroceder el frente y la transición se ensucia.
 *   RUNTIME: interior del pill 217 → 177 → 141 → 104 → 74 → 58, parejo.
 *
 * — Los fondos son variantes (`fondo.ts`): `accion`, el elegido, es la
 *   ficha de un activo medida de la captura oficial de Robinhood, en un
 *   solo gris; `opal` es la pantalla del clip y la única con derrame.
 *   `accion` sigue al modo claro/oscuro con colores de sistema
 *   (`PlatformColor`): nada que mantener. RUNTIME: barra (43,43,46) en
 *   oscuro y (228,228,230) en claro.
 *
 * — El material del botón es una variante (`material.ts`): `opaco` es
 *   el pill medido; `vidrio` es Liquid Glass nativo, `regular` sin tinte
 *   e interactivo, como CONTENEDOR del pill (VIDRIO.md: no se recorta ni
 *   va bajo opacidad animada; el hijo se recorta a sí mismo), sin
 *   brillo, velo ni escala del press. El fondo `accion` scrollea
 *   por debajo del botón, que flota: sin contenido detrás, el vidrio no
 *   se lee.
 *
 * — El ESQUEMA lo decide la pantalla (`esquema` del botón): sólo con
 *   `accion` sigue al sistema; los fondos de Opal son oscuros siempre.
 *   En claro el pill opaco sigue oscuro pero sin brillo ni velo, y la
 *   ráfaga es del color del pill; los chips usan
 *   los grises de sistema (`CLARO`, SUPUESTO). RUNTIME:
 *   `cmp/claro-tablero.png`.
 *
 * — Android dibuja lo mismo que iOS: colores de sistema escritos
 *   (`PALETA`, no `PlatformColor`: en Android da transparente), copias
 *   borrosas con `filter: blur` desde la API 31 en vez de las PNG de SF,
 *   tilde `check` de Material Symbols en 700, `includeFontPadding:
 *   false`. RUNTIME: `cmp/android-tablero.png` (emulador Pixel 9).
 *
 * — El reinicio corre en UI (`withDelay` sobre `espera`), no en un
 *   `setTimeout`: llega a los 5030 ms del commit con JS bloqueado.
 *   `reiniciar` va declarada ANTES de `completar`, que la llama desde
 *   un callback (un worklet captura `undefined` si la const viene
 *   después). RUNTIME: `medidor.tsx` bajo `carga.tsx` (`pesada`).
 *
 * — Sólo transform y opacity: el color del label son tres tandas del
 *   texto en sus tres tintas con la partición del progreso como
 *   opacidad (`tinta`); ninguna vista anima `color` ni `tintColor`.
 *
 * — La receta activa es `clip` (`RECETA`), la medida: Vito la pidió de
 *   vuelta el 2026-09-07 al ver la `skill` ("diferente, sobre todo el
 *   final"). RUNTIME: reposo, 0.5, commit y cruce-commit=150 dan PSNR
 *   infinito contra las capturas anteriores a la reescritura. La `skill`
 *   —springs con duración y rebote 0 donde hubo dedo, `overshootClamping`
 *   en la retirada, tilde contextual— sigue entera con `?receta=skill`.
 *
 * — El tilde de "Order Placed" entra con opacidad 0 → 1, escala .25 → 1
 *   y blur 4 → 0 (better-ui, ícono contextual); en `clip`, pegado al
 *   texto. NO TIENE RELOJ PROPIO: lee `pListo`, la presencia del texto,
 *   y sus dos capas llevan la misma partición de la escalera que el
 *   texto (nítida `nitido`, borrosa `ancho + angosto`), así el ícono y
 *   "Order Placed" no pueden separarse en ninguna receta (pedido del
 *   2026-09-07). Lo único que los distingue es la escala prescripta.
 *   RUNTIME: `cmp/tilde-de-la-mano.png` y `tilde.py` — en `clip` las dos
 *   tintas van a ±1.5 puntos porcentuales en cada q; en `skill` la
 *   diferencia que queda es exactamente el área del tilde a esa escala.
 *
 * — Un solo estado, `etapa` (entero): reposo, hold, sonando, commit,
 *   reinicio. El storyboard arriba de `hold-to-commit.tsx` lee como la secuencia
 *   y no tiene números propios: todos viven en `receta.ts` y `medidas.ts`.
 *
 * — Nada visible depende de JS: 0 cuadros perdidos en la secuencia
 *   bajo `todo` y `pesada` (iOS dev, Android producción). Lo que cruza
 *   a JS —háptica y sonido— espera lo que JS tarde: hasta ~90 ms bajo
 *   `pesada`, ≤ 12 ms bajo `todo`. Sin módulo nativo no hay más que
 *   eso en Expo Go. Perillas: `CARGA`, `MEDIR`, `RECEPTOR` en
 *   `sonda.ts` (o `?carga=`, `?medir=1`).
 *
 * — EL BOTÓN NO ES LA COPIA LITERAL DEL CLIP, y en tres cosas se aparta
 *   a propósito: el anillo de 1 pt no se dibuja y en su lugar va una
 *   sombra de dos capas; "✓ Order Placed" se corre 6.6 pt a la
 *   izquierda; y en claro la página es el gris agrupado de iOS y no
 *   blanco puro. RUNTIME: el anillo se despegaba +54.5 de lo que tenía a
 *   2 pt afuera contra +4 del clip; el texto del label caía +13.67 pt a
 *   la derecha del centro y el centroide +6.60, y la corrección es ese Δ
 *   anulado (verificado en −0.06).
 *
 *   Hubo un rato en que las dos versiones convivían detrás de un chip
 *   (el archivo acabado.ts, con los valores referencia y revisado). El
 *   chip se sacó
 *   cuando la exploración terminó y el archivo entero se borró después:
 *   una perilla con una sola posición no es una perilla, y el registro
 *   de lo que hace el clip no vive en una rama muerta del código sino en
 *   el README y en los recibos de `medidas.ts`.
 *
 * — La sombra lleva `borderRadius` y no es decoración: `boxShadow` sigue
 *   la forma de la VISTA, y sin el radio dibuja una caja de esquinas
 *   vivas alrededor de la cápsula.
 *
 * — El botón llega a BLANCO PLENO en los dos temas, como la referencia.
 *   Que en claro no se perdiera contra la página no se arregló
 *   atenuando el relleno —se probó y se descartó— sino moviendo el
 *   fondo. El protagonista no se ensucia para arreglar el escenario.
 *
 * — El fondo `accion` termina ARRIBA del botón: el `paddingBottom` acota
 *   el viewport del `ScrollView`, no el contenido. Un `paddingBottom` en
 *   el contenido sólo agrega aire al final y las filas se siguen
 *   dibujando detrás del pill. Y el contenido termina antes de ese
 *   borde: cortado al ras se lee como un error de layout.
 *   RUNTIME: 742 pt de contenido contra un borde en 831.
 */
