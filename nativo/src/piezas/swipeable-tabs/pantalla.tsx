import { useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { Tab } from './barra'
import { Cabecera } from './cabecera'
import { CLARO, COLOR } from './medidas'
import { Pagina } from './pagina'
import { TabsDeslizables } from './tabs-deslizables'
import { Tema } from './tema'

/* ═══════════════════════════════════════════════════════════════
   SWIPEABLE TABS — la pantalla, autocontenida. Arma los datos, elige la
   paleta y monta la pieza. La ruta (`src/app/swipeable-tabs/index.tsx`)
   sólo la exporta.

   La referencia es X en iOS: el clip del vault (`Swipeable tabs.mov`) y
   las grabaciones de la cuenta del usuario, medidas cuadro a cuadro. El
   recibo de cada valor está arriba de él en `medidas.ts`, y la planilla
   entera en `.context/recon/swipeable-tabs/MEDICIONES.md`.

   LA CARPETA TIENE LA FORMA DE UN COMPONENTE DE react-native-motion
   (`apps/expo/components/animations/<slug>/`): una pantalla que se
   monta sola, un `index.tsx` que la exporta, el mecanismo al lado
   (`tabs-deslizables`, `barra`, `pliegue`, `pagina`, `cabecera`), el
   tema (`tema.ts`, paletas en `medidas.ts`) y los datos (`media.ts`)
   en la misma carpeta. Lo único que no se copió es su registry a mano:
   acá el índice del taller se deriva de las carpetas de `src/app/`.

   Los labels son los de la referencia a propósito: así la comparación
   contra el clip es directa, cuadro contra cuadro, sin que un texto
   más corto o más largo mueva el subrayado y ensucie la lectura.
   ═══════════════════════════════════════════════════════════════ */

/* Los símbolos siguen la regla de la referencia, que no es decorativa:
   los dos feeds propios llevan un CHEVRON a la derecha —son menús, se
   despliegan— y los tabs de tema llevan un ÍCONO a la izquierda, que
   los nombra. Por eso también están pintados distinto: el chevron
   gris, el ícono blanco. Los dos valores están medidos del clip.

   Son SF Symbols, o sea la tipografía de íconos del sistema: mismo
   peso óptico que el texto al lado y sin un asset que mantener. */
/* SEIS tabs, no siete: la cuenta de X del usuario tiene exactamente
   estos, y con seis la tira entera casi entra en la pantalla — el tope
   de scroll queda en ~30 pt y ningún subrayado termina abajo del
   degradé después de un arrastre. Con un séptimo tab (se probó con
   Sports) el tab activo podía quedar con el subrayado metido bajo la
   rampa derecha, que era el reclamo: "la barra de abajo del último
   elemento se ve blureada". RUNTIME: en las grabaciones nuevas de X
   (2026-09-01) el estado con Design activo deja la fila en su tope y
   el degradé apagado. */
const TABS: Tab[] = [
  { id: 'for-you', label: 'For you', simbolo: 'chevron.down', lado: 'derecha' },
  { id: 'following', label: 'Following', simbolo: 'chevron.down', lado: 'derecha' },
  { id: 'stocks', label: 'Stocks', lado: 'izquierda', chip: true },
  { id: 'tech', label: 'Tech', simbolo: 'cpu', lado: 'izquierda' },
  { id: 'ai', label: 'AI', simbolo: 'sparkles', lado: 'izquierda' },
  { id: 'design', label: 'Design', simbolo: 'paintbrush', lado: 'izquierda' },
]

export function PantallaSwipeableTabs() {
  const insets = useSafeAreaInsets()
  /* El tema lo decide el SISTEMA, como en la app de X: no hay toggle
     propio. La paleta oscura es la medida; la clara lleva su recibo (y
     su falta de recibo) arriba de `CLARO` en `medidas.ts`. */
  const paleta = useColorScheme() === 'light' ? CLARO : COLOR
  const params = useLocalSearchParams<{ demo?: string }>()
  const demo = params.demo === '1' || params.demo === 'true'

  return (
    <Tema.Provider value={paleta}>
      {/* Sin `paddingTop`: la pieza llega hasta el borde de la pantalla y
          es el bloque plegable el que incluye la barra de estado — cuando
          sube, el contenido pasa por debajo de ella (ver `pliegue.tsx`). */}
      <View style={[css.pieza, { backgroundColor: paleta.fondo }]}>
        {/* `auto` sigue al esquema del sistema, igual que la paleta. */}
        <StatusBar style="auto" />
        <TabsDeslizables
          tabs={TABS}
          arriba={insets.top}
          cabecera={<Cabecera />}
          pagina={(tab, indice) => <Pagina id={tab.id} indice={indice} />}
          demo={demo}
        />
      </View>
    </Tema.Provider>
  )
}

const css = StyleSheet.create({
  pieza: { flex: 1 },
})

/*
 * No tocar sin volver a medir
 *
 * Los valores sueltos —colores, tamaños, paddings— tienen su recibo
 * arriba de cada uno en `piezas/swipeable-tabs/medidas.ts`. Acá van sólo
 * los que no son un número: las reglas de las que depende que la pieza
 * se sienta como la referencia.
 *
 * — `d`, `h` y `t` son UN shared value (`Tramo`), no tres. Separarlos
 *   devuelve el titileo de los íconos: los estilos leen un trío que no
 *   existió y el ícono que entra prende del todo por un cuadro.
 *   RUNTIME: traza sacada del propio mapper del estilo, un barrido de
 *   seis páginas. Los seis tabs hacían 0.000 → 1.000 → 0.008 al cruzar.
 *   Con un valor: cero cambios de dirección espurios en 492 cuadros.
 *   SOURCE de por qué: `useAnimatedReaction` llama a `startMapper` sin
 *   lista de salidas, así que el orden topológico de Reanimated no puede
 *   ordenarla antes de quien lee lo que escribe.
 *
 * — La fila se mueve con el mismo avance del contenido, tocando Y
 *   arrastrando, y la regla la elige `BARRA.fila` (medidas.ts):
 *   'visible' —la de hoy— se queda donde estaba y sólo se corre lo
 *   justo para que el activo entre entero; 'centrar' centra el activo
 *   en la pantalla ENTERA (440) clampeado al tope.
 *   RUNTIME: X hace 'centrar' — las siete transiciones de las tres
 *   grabaciones del usuario (2026-09-01) caen en ese modelo, incluido
 *   Stocks→Tech con el dedo (fila 0 → 45.6, lineal con el contenido,
 *   v1 cuadros 203–221). PEDIDO (2026-09-02): "solo cambia una vez que
 *   voy a una tab que no es visible" — 'visible' es eso, y con seis
 *   tabs mueve la tira sólo en AI↔Design, Following↔For you y en los
 *   toques a un tab tapado. Decisión consciente sobre la referencia;
 *   volver es una palabra.
 *
 * — Un toque lejano mueve el contenido UNA sola página, no cuatro.
 *   RUNTIME: en el toque For you → Tech del video de X hay un solo
 *   empalme; ni Following ni Stocks aparecen. Acá se consigue prestando
 *   la página de origen al lugar de al lado del destino.
 *
 * — La curva del toque es easeOutCubic a 300 ms, y NO es la del
 *   arrastre. Son dos animaciones distintas: la del arrastre es la
 *   deceleración del UIScrollView y no la elige nadie.
 *   RUNTIME: ajustada contra los TRES toques de las grabaciones nuevas
 *   del usuario (RMS 0.0081/0.0123/0.0179; el bezier(.4,.9,.72,1)
 *   anterior daba 0.0153/0.0068/0.0250 y se sentía abrupto — la
 *   historia entera está arriba de `EASE_SETTLE`).
 *
 * — El glifo del símbolo se DESBORDA de su ranura: dibuja 16 pt en un
 *   lugar que ocupa 11. Igualarlos engorda el tab activo ~5 pt y se ve
 *   en el ancho del subrayado.
 *   RUNTIME: el subrayado de la referencia mide 90.7 / 77.7 / 58.7 en
 *   Stocks / Tech / AI.
 *
 * — El símbolo se esconde ATRÁS de la palabra, como X: nace ~1–2 pt
 *   tapado, viaja ENTERO (nunca recortado) los 13/12 pt medidos, y el
 *   zIndex del label existe para eso.
 *   RUNTIME: el recibo de `desliz` está en `medidas.ts` — con DOS
 *   vueltas encima: la ventana con recorte y la pluma se probaron y se
 *   volvieron (2026-09-01 a la mañana), y la CUNA PROFUNDA (desliz 4/7,
 *   viaje de 17) también (mismo día a la tarde, "hacelo como ellos" con
 *   las grabaciones de la cuenta real de recibo). No lo vuelvas a tocar
 *   sin leer esa historia en `medidas.ts` y MEDICIONES.md.
 *
 * — El fade del símbolo tiene DOS curvas: el ícono blanco va con r^1.5
 *   ARRANCANDO en `ICONO.piso` y el chevron gris va lineal. Y el label
 *   interpola color con `gamma: 1` (sRGB crudo), no en espacio lineal.
 *   Emparejar las curvas vuelve el "aparece de golpe"; sacar el piso
 *   vuelve el fantasma pegado a la palabra.
 *   RUNTIME: curvas extraídas cuadro a cuadro del clip con el subrayado
 *   de reloj; la tabla está arriba de `desliz` en `medidas.ts`. El piso
 *   es la única desviación deliberada (SIN RECIBO, pedido perceptual):
 *   en el cuadro-spec (r=0.348) da 43/181/91 contra 55/180/93 de X, y a
 *   cambio en r<0.15 no queda ni el fantasma (luma ≤ 8).
 *
 * — La oclusión es DE VERDAD: el label lleva su propio fondo del color
 *   de la paleta (brecha 4 pt compensada con margen negativo, y `medir`
 *   la descuenta del onLayout), y el símbolo emerge por un borde limpio
 *   pegado a la palabra. Dos cosas se rompen si se toca de a una: sin
 *   el fondo, el símbolo tapado se ve entre las letras (la mancha); sin
 *   la brecha, las dos tintas se rozan.
 *   RUNTIME: reposos intactos al décimo con el fondo puesto; el canal
 *   sólido de 4 pt está medido en r=0.5.
 *
 * — TODA palabra inactiva se INCLINA `BARRA.apartar` = 4.7 pt
 *   alejándose del tab activo — labels, velos y símbolos, NUNCA las
 *   cajas ni el subrayado. Es lo que hace que "For you" se corra al
 *   perder el chevron y que la palabra que muere viaje ranura+lean
 *   (~26 pt, como X). Sacarla vuelve tres síntomas de una vez.
 *   RUNTIME: la tabla de las seis palabras en los seis reposos de X
 *   está arriba de `apartar` en `medidas.ts`; verificado en pantalla
 *   con parques (For you −2.4 en t=0.5, mitad exacta de −4.7).
 *
 * — El borde de oclusión NO es un filo: lleva un velo de `pluma` =
 *   2.5 pt de degradé. Su techo es una desigualdad, no un gusto:
 *   brecha + pluma + bearing ≤ 7.5 (el hueco de reposo del ícono de
 *   17 pt), o el velo tocaría al símbolo en reposo.
 *   RUNTIME: perfil del corte con velo: 82→68→56→45→33→21→10→0 en
 *   2.5 pt (sin velo era un escalón de una columna); reposo del caso
 *   justo: 255→245→48→0, sin rastro. Y OJO CON YOGA: los hijos
 *   absolutos se posicionan desde el border box — el padding del golpe
 *   se suma a mano o el velo cae 12 pt corrido.
 *
 * — El símbolo de Stocks es un CHIP compuesto (contorno + cinco barras
 *   rotadas), no un SF Symbol. Los vértices del zigzag están medidos
 *   del píxel; el recibo entero arriba de `CHIP` en `medidas.ts`.
 *   RUNTIME: perfil fila por fila contra el cuadro 107 del clip — caja
 *   idéntica y montaña a ±2 px.
 *
 * — El contenido de la fila lleva el ancho del `+` de cola. Sin eso el
 *   ScrollView no llega al tope y el último tab queda 44 pt corto.
 *   RUNTIME: el subrayado de Design frenaba en 272.3 en vez de 223.3.
 *
 * — La fila tiene DOS rampas, y son la misma idea en las dos puntas: la
 *   derecha entra cuando queda scroll por delante, la izquierda cuando
 *   hay contenido escondido atrás (`fila > 0`). Mismo ancho
 *   (`BORDE.rampa`) a propósito. No es un blur: en la referencia las
 *   letras conservan las astas nítidas mientras pierden luminancia.
 *   RUNTIME: la referencia apaga las letras en ~21 pt (6→153); la
 *   nuestra da 20→125 y tinta plena en 23. Apagada en reposo sin
 *   scroll: la F de For you arranca en 255 pleno.
 *
 * — Los labels NO escalan con Dynamic Type (`allowFontScaling: false`).
 *   RUNTIME: en el mismo teléfono y el mismo momento, X medía 62.3 pt de
 *   ancho y 10.00 de cap mientras el sistema estaba en extra-small.
 *
 * — La háptica es `impactAsync(Light)` en `alTocar` (onPress), NUNCA en
 *   onPressIn: ahí sonaba al empezar a arrastrar la fila, porque el
 *   dedo apoya sobre un tab ("saca el haptic", 2026-09-01). El scroll
 *   cancela el press, así que el arrastre queda mudo solo.
 *   SIN RECIBO la intensidad: el clip es video y no tiene pista
 *   háptica. Se ajustó a mano con el teléfono.
 *
 * — El modo CLARO sale de `useColorScheme` (la app de X sigue al
 *   sistema) y la paleta viaja por el contexto `Tema`. Las DOS paletas
 *   están medidas con el mismo método: la oscura en el clip del vault y
 *   la clara en la grabación del pliegue (2026-09-02). El activo claro
 *   es #000000 neutro, no el #0F1419 de la web; el divisor claro es
 *   #C9CBCB, no #EFF3F4. Recibo arriba de `CLARO` en `medidas.ts`.
 *
 * — EL BLOQUE DE ARRIBA SE PLIEGA con el scroll del contenido: barra de
 *   estado + cabecera + tabs + divisor se trasladan 1:1 con el delta
 *   del scroll (sin umbral, sin snap, sin animación propia) hasta que
 *   el divisor queda pegado al borde de la barra de estado. El FONDO
 *   del bloque es opaco y no se desvanece —cuando frena, es lo que tapa
 *   la barra de estado—; lo que se desvanece es lo de encima, con
 *   α = 1 − subida/(0.94·recorrido). Al scrollear hacia arriba vuelve
 *   por el mismo camino, desde donde quedó. NO hay tapa aparte.
 *   RUNTIME: grabación clara de X (2026-09-02): traslación = scroll al
 *   décimo; recorrido 151.6 = su borde de abajo (213.7) menos la barra
 *   de estado (62); la fila de 62 pt es blanco puro a mitad de pliegue
 *   (el fondo no se desvanece); L = 1.8·D. Dos vueltas dadas y anotadas
 *   en `pliegue.tsx`: el bloque entero desvanecido (asomaba el filete
 *   de la tapa) y el recorrido entero con los labels saliendo por
 *   arriba (rechazado en el teléfono: "volvé a lo de antes"). Sin
 *   recibo: al cambiar de tab el bloque no queda más plegado que el
 *   scroll de la página que llega.
 *
 * — `BORDE.respiro` vale 4 y tiene DOS lecturas que no coinciden: 3.6 pt
 *   en el clip del vault y 0.0 en la grabación nueva.
 *   SIN RECIBO ÚNICO: se dejó el valor viejo porque tiene el suyo, pero
 *   una de las dos mediciones está mal y no se sabe cuál.
 */
