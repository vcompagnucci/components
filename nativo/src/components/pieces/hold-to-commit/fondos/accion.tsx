import { type ColorValue, ScrollView, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'

import { useTick } from '../carga'

/* ═══════════════════════════════════════════════════════════════
   EL FONDO "ACCIÓN" — la ficha de un activo de una app financiera, como
   esqueleto. Pedido de Vito (2026-09-04): "hacé como que sea de una app
   financiera tipo Robinhood y que el botón de abajo sea para comprar";
   después "sin mucho detalle igual, todo skeletons"; y después "no
   agregues colores al fondo y hacelo mucho más skeleton".

   LA REFERENCIA ES MEDIDA, no recordada: la captura oficial de Robinhood
   en la App Store (2026.35.0, "Trade crypto at the lowest cost on
   average", `.context/hold-to-commit/robinhood/rh-03-grande.png`, 1242 ×
   2208), medida con `robinhood/medir.py`. El mockup tiene 971 px de
   pantalla; asumiendo un iPhone 16 Pro (402 pt) da 2.415 px/pt, y la
   "C" del título mide 24 pt de mayúscula = 34 pt de fuente, el Large
   Title de iOS: la escala cierra. Todo lo de abajo del selector de
   rango (donde termina la captura) es SUPUESTO y está marcado.

   UN SOLO GRIS Y NINGÚN COLOR. Cada texto es una barra (alto 0.82 × el
   tamaño de fuente que reemplaza, centrada en su caja de línea), el
   gráfico es una curva suave del mismo gris, sin ruido, y el rango
   elegido es una píldora del mismo gris con una barra del color del
   fondo adentro. La referencia tiene la línea y la píldora en lima
   (204,255,0): quedó medido y NO se usa, a pedido. Nada compite con el
   botón.

   MODO CLARO Y OSCURO (pedido del 2026-09-04): los tres colores son los
   COLORES DE SISTEMA de iOS —`systemBackground` (blanco / negro),
   `systemFill` (la barra) y `separator` (la hairline)— escritos con sus
   valores. SOURCE: la tabla de colores de sistema de UIKit (HIG ›
   Color): systemFill es (120,120,128) al 20 % en claro y al 36 % en
   oscuro; separator, (60,60,67) al 29 % y (84,84,88) al 60 %. Sobre
   negro, systemFill da (43,43,46): el mismo gris medido de `bloques`
   (#2A2A2A, 42) a un nivel de diferencia, así que el modo oscuro no
   cambió. RUNTIME en las capturas de `sim/modo-*`.

   Hasta el 2026-09-07 se pedían con `PlatformColor('systemFillColor')`,
   dinámicos y sin `if`. Se cambió por Android: esos nombres son de
   UIKit, y en Android `PlatformColor` sólo resuelve rutas de recursos
   (`@android:color/…`, `?attr/…`); con un nombre que no resuelve,
   `FabricUIManager.getColor` devuelve 0 (SOURCE: react-native 0.86,
   `FabricUIManager.java:573`), o sea TRANSPARENTE: fondo y barras
   invisibles, sin error. Los valores escritos son los mismos píxeles en
   los dos sistemas, y `useColorScheme` los cambia en vivo.

   EN VIVO (`enVivo`, para la carga simulada de `carga.tsx`): las barras
   de valor de las grillas cambian de ancho diez veces por segundo, como
   una lista de cotizaciones que se actualiza. Es un re-render de toda
   la ficha a 10 Hz: la carga de render de una app real, con la pieza
   encima. Sin `enVivo` nada corre.

   EL FONDO SCROLLEA POR DEBAJO DEL BOTÓN, que flota (2026-09-04, para el
   botón de vidrio: el material sólo se lee cuando hay algo detrás que
   refractar, y así flota un botón primario en iOS 26). Por eso es un
   `ScrollView` a pantalla completa, más largo que la pantalla, con un
   `paddingBottom` del alto de la zona del botón para que la última fila
   pueda subir por encima de él. Lo de abajo del rango son SUPUESTOS que
   llenan la ficha: dos cabeceras con sus grillas y un párrafo. Terminan
   ARRIBA del botón, no por debajo (ver el comentario del `ScrollView`).

   EL GRÁFICO SON SEGMENTOS: React Native no dibuja líneas y el taller no
   agrega Skia ni SVG (Expo Go). Una Catmull-Rom por ocho puntos de
   control con la forma del clip —plano, y la subida en el último tercio
   hasta el máximo— muestreada en 43 puntos; cada tramo es una vista de
   3 pt de alto rotada desde su extremo izquierdo. Vistas quietas: nada
   corre por cuadro.
   ═══════════════════════════════════════════════════════════════ */

/* Los tres colores de sistema, por esquema. */
export type Paleta = { fondo: ColorValue; barra: ColorValue; hairline: ColorValue }
export const PALETA: Record<'dark' | 'light', Paleta> = {
  dark: {
    /* RUNTIME · el fondo de la referencia: (0,0,0) en todo hueco: `systemBackground` en oscuro. */
    fondo: '#000000',
    /* SOURCE · `systemFill` en oscuro: (120,120,128) al 36 % = (43,43,46) sobre negro. */
    barra: 'rgba(120,120,128,0.36)',
    /* SOURCE · `separator` en oscuro: (84,84,88) al 60 %. */
    hairline: 'rgba(84,84,88,0.6)',
  },
  light: {
    /* SOURCE · `systemGroupedBackground` en claro, (242,242,247), y NO
       `systemBackground` (blanco puro), que es lo que había.
       Vito, 2026-09-08: "no me gusta cómo resolviste lo del color, de
       última cambiá un poco el color del fondo, ya que no es lo
       principal acá". Tenía razón en las dos mitades. La primera
       versión atenuaba el RELLENO del botón para que no desapareciera
       contra una página blanca: ensuciaba al protagonista para arreglar
       el escenario. Y el escenario acá es esqueleto, no es la pieza.
       Es además el color que iOS usa justamente para esto: la página
       sobre la que se apoyan superficies claras. El botón vuelve a
       llegar a blanco pleno, como en la referencia. */
    fondo: '#F2F2F7',
    /* SOURCE · `systemFill` en claro: (120,120,128) al 20 % = (228,228,230) sobre blanco (RUNTIME: igual). */
    barra: 'rgba(120,120,128,0.2)',
    /* SOURCE · `separator` en claro: (60,60,67) al 29 %. */
    hairline: 'rgba(60,60,67,0.29)',
  },
}
export const paleta = (esquema: string | null | undefined): Paleta => (esquema === 'light' ? PALETA.light : PALETA.dark)

export const ACCION = {
  /* RUNTIME · título, precio y variación arrancan a 33.5–34 pt del borde
     izquierdo de la pantalla. */
  margen: 34,
  /* DERIVADO · el título arranca a 113.5 pt del borde superior del
     mockup; con los 62 de safe area del 16 Pro quedan 51.5. */
  arriba: 52,
  /* La caja de línea de SF 34: el precio arranca 39.7 pt debajo del
     título (RUNTIME), que es una línea de 34. */
  linea34: 41,
  linea17: 20.3,
  /* RUNTIME · "Crypto": 96.9 pt de tinta. */
  titulo: { ancho: 97, alto: 28, radio: 9 },
  /* RUNTIME · "$1,500.00": 152 pt de tinta; la (i): 20.7 pt de diámetro,
     12 pt después del precio. */
  precio: { ancho: 152, alto: 28, radio: 9, info: 20, aInfo: 12 },
  /* RUNTIME · la variación arranca 8 pt debajo de la caja del precio:
     "▲ $0.2800 (26.47%)" 147 pt y "Today" 40 pt, 6 pt después. Fuente
     de 17 → barra de 14. */
  cambio: { antes: 8, principal: 147, secundaria: 40, hueco: 6, alto: 14 },
  /* RUNTIME · la línea va de 8.3 pt del borde al 72.6 % del ancho (el
     marcador, en el máximo), y ocupa 76.6 pt de alto: su punto más alto
     queda 68 pt debajo de la línea de la variación y el más bajo 42 pt
     encima del selector de rango; en total 186 pt entre los dos. La
     referencia la dibuja a ~2 pt; en esqueleto va a 3, y el marcador a 8. */
  grafico: { alto: 186, desde: 68, banda: 76, x0: 8, x1: 0.726, grosor: 3, punto: 8 },
  /* RUNTIME · el selector: siete ítems entre 47 pt y 363 pt del ancho de
     402 (repartidos parejo); la píldora "1D" mide 30.6 × 21.5 con radio
     ~7; las mayúsculas de los otros miden 8.3 pt (fuente ~12) → barra 9.
     Anchos de tinta: LIVE 25, 1D 14, 1W 17, 1M 16, 3M 18, YTD 24, 1Y 14. */
  rango: { alto: 23, izquierda: 47, derecha: 39, pildora: { ancho: 31, alto: 22, radio: 7 }, barra: 9, anchos: [25, 14, 17, 16, 18, 24, 14] },

  /* SUPUESTO · debajo del rango la captura termina. Una app de este tipo
     sigue con una cabecera de sección y una grilla de datos en dos
     columnas (etiqueta y valor por celda, filas de 44 con hairline al
     margen), y otra sección de texto corrido; es lo que llena el hueco
     hasta el botón sin competir con él. */
  seccion: { antes: 28, ancho: 84, alto: 14 },
  datos: { antes: 12, filas: 3, fila: 44, etiqueta: 58, valor: 46, alto: 12, columna: 28 },
  /* SUPUESTO · tres líneas de texto corrido, como fracción del ancho útil. */
  parrafo: [1, 0.94, 0.58],
} as const

/* La curva del gráfico: ocho puntos de control (u = 0..1 a lo largo,
   v = 0..1 de abajo hacia arriba) con la forma de la referencia, unidos
   con Catmull-Rom y muestreados seis veces por tramo. */
const CONTROL: readonly (readonly [number, number])[] = [
  [0, 0.25], [0.15, 0.3], [0.25, 0.15], [0.45, 0.22], [0.6, 0.35], [0.75, 0.42], [0.9, 0.75], [1, 1],
]
const POR_TRAMO = 6
const PUNTOS: readonly (readonly [number, number])[] = (() => {
  const salida: [number, number][] = []
  const en = (i: number) => CONTROL[Math.min(CONTROL.length - 1, Math.max(0, i))]!
  for (let i = 0; i < CONTROL.length - 1; i++) {
    const p0 = en(i - 1), p1 = en(i), p2 = en(i + 1), p3 = en(i + 2)
    for (let k = 0; k < POR_TRAMO; k++) {
      const t = k / POR_TRAMO, t2 = t * t, t3 = t2 * t
      const cr = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      salida.push([cr(p0[0], p1[0], p2[0], p3[0]), Math.min(1, Math.max(0, cr(p0[1], p1[1], p2[1], p3[1])))])
    }
  }
  salida.push([1, 1])
  return salida
})()

function Barra({ ancho, alto = ACCION.cambio.alto, color, radio }: { ancho: number; alto?: number; color?: ColorValue; radio?: number }) {
  const p = paleta(useColorScheme())
  return <View style={{ width: ancho, height: alto, borderRadius: radio ?? alto / 2, backgroundColor: color ?? p.barra }} />
}

function Grafico({ ancho }: { ancho: number }) {
  const p = paleta(useColorScheme())
  const { x0, x1, desde, banda, grosor, punto } = ACCION.grafico
  const w = ancho * x1 - x0
  const pts = PUNTOS.map(([u, v]) => [x0 + u * w, desde + (1 - v) * banda] as const)
  const fin = pts[pts.length - 1]!
  return (
    <View style={css.grafico}>
      {pts.slice(1).map(([x, y], i) => {
        const [xa, ya] = pts[i]!
        const dx = x - xa, dy = y - ya
        return (
          <View
            key={i}
            style={[
              css.segmento,
              { left: xa, top: ya - grosor / 2, width: Math.hypot(dx, dy) + grosor / 2, backgroundColor: p.barra, transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }] },
            ]}
          />
        )
      })}
      <View style={[css.punto, { left: fin[0] - punto / 2, top: fin[1] - punto / 2, backgroundColor: p.barra }]} />
    </View>
  )
}

/* Los bloques de la lista, como componentes de módulo (el compilador de
   React no deja crear componentes adentro de un render). */
function Cabecera() {
  return (
    <>
      <View style={{ height: ACCION.seccion.antes }} />
      <View style={[css.linea17, css.margen]}>
        <Barra ancho={ACCION.seccion.ancho} alto={ACCION.seccion.alto} />
      </View>
      <View style={{ height: ACCION.datos.antes }} />
    </>
  )
}
/* `tick` cambia diez veces por segundo con la carga en vivo; el ancho
   de cada valor sale de él, determinista, entre el 60 % y el 100 %. */
const vaiven = (tick: number, i: number) => 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(tick * 0.9 + i * 2.1))
function Grilla({ tick = 0, hairline }: { tick?: number; hairline: ColorValue }) {
  return Array.from({ length: ACCION.datos.filas }, (_, f) => (
    <View key={f} style={css.margen}>
      <View style={[css.datosFila, { borderBottomColor: hairline }]}>
        {[0, 1].map((c) => (
          <View key={c} style={[css.celda, c === 0 && { marginRight: ACCION.datos.columna }]}>
            <Barra ancho={ACCION.datos.etiqueta} alto={ACCION.datos.alto} />
            <Barra ancho={ACCION.datos.valor * (tick ? vaiven(tick, f * 2 + c) : 1)} alto={ACCION.datos.alto} />
          </View>
        ))}
      </View>
    </View>
  ))
}
function Parrafo({ util }: { util: number }) {
  return ACCION.parrafo.map((fraccion, i) => (
    <View key={i} style={[css.linea17, css.margen]}>
      <Barra ancho={util * fraccion} alto={ACCION.datos.alto} />
    </View>
  ))
}

export function FondoAccion({ paddingTop, paddingBottom, enVivo = false }: { paddingTop: number; paddingBottom: number; enVivo?: boolean }) {
  const { width } = useWindowDimensions()
  const p = paleta(useColorScheme())
  const util = width - 2 * ACCION.margen
  const tick = useTick(enVivo ? 100 : 0)
  return (
    /* EL FONDO TERMINA ARRIBA DEL BOTÓN, no por debajo. `paddingBottom`
       estaba puesto en el contenido, que sólo agrega aire AL FINAL: con
       la lista en el tope del scroll, las filas se seguían dibujando
       detrás del pill, y la miniatura de una de ellas asomaba por abajo
       pegada a su borde. Vito, 2026-09-08: "justo la parte de abajo del
       botón coincide con algo de abajo, aparentando que es más grande el
       botón". Acotando el VIEWPORT, la banda del botón queda vacía y el
       pill se lee de su tamaño. Es además lo que ya hacía el fondo
       `bloques`, con la misma distancia medida del clip entre la última
       card y el pill (`SECCION.alPill`).

       Y EL CONTENIDO TERMINA ANTES DE ESE BORDE, en vez de quedar
       cortado por él. Un scroll cortado a media fila se lee como un
       error de layout, no como una lista que sigue. Salieron la lista
       con miniaturas y la última grilla con su cabecera: RUNTIME, el
       contenido terminaba en 830.7 pt con el borde en 831, o sea
       exactamente encima; sin ellas termina en 742 y sobran 89 pt. Son
       bloques SUPUESTOS —la captura de referencia termina en el selector
       de rango— así que sacarlos no pierde nada medido.

       Queda un respiro grande entre el último párrafo y el pill, 121 pt.
       Es a propósito: la alternativa medida era una fila cortada al ras
       del borde, y una fila entera no entra. */
    <ScrollView
      style={[StyleSheet.absoluteFill, { bottom: paddingBottom }]}
      contentContainerStyle={{ paddingTop: paddingTop + ACCION.arriba }}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
    >
      {/* Título y precio: dos líneas de 34. */}
      <View style={[css.linea34, css.margen]}>
        <Barra ancho={ACCION.titulo.ancho} alto={ACCION.titulo.alto} radio={ACCION.titulo.radio} />
      </View>
      <View style={[css.fila34, css.margen, { gap: ACCION.precio.aInfo }]}>
        <Barra ancho={ACCION.precio.ancho} alto={ACCION.precio.alto} radio={ACCION.precio.radio} />
        <View style={[css.info, { backgroundColor: p.barra }]} />
      </View>
      {/* La variación del día y "Today". */}
      <View style={{ height: ACCION.cambio.antes }} />
      <View style={[css.fila17, css.margen, { gap: ACCION.cambio.hueco }]}>
        <Barra ancho={ACCION.cambio.principal} />
        <Barra ancho={ACCION.cambio.secundaria} />
      </View>

      <Grafico ancho={width} />

      {/* El selector de rango: siete ítems, el segundo elegido. */}
      <View style={css.rango}>
        {ACCION.rango.anchos.map((ancho, i) =>
          i === 1 ? (
            <View key={i} style={[css.pildora, { backgroundColor: p.barra }]}>
              <Barra ancho={ancho} alto={ACCION.rango.barra} color={p.fondo} />
            </View>
          ) : (
            <Barra key={i} ancho={ancho} alto={ACCION.rango.barra} />
          ),
        )}
      </View>

      {/* SUPUESTO: lo que sigue llena la ficha hasta el borde de arriba del botón. */}
      <Cabecera />
      <Grilla tick={tick} hairline={p.hairline} />
      <Cabecera />
      <Parrafo util={util} />
    </ScrollView>
  )
}

const css = StyleSheet.create({
  margen: { paddingHorizontal: ACCION.margen },
  linea34: { height: ACCION.linea34, justifyContent: 'center' },
  linea17: { height: ACCION.linea17, justifyContent: 'center' },
  /* Las filas: el eje principal es horizontal, así que el centrado
     vertical va en `alignItems` (un `justifyContent: center` acá las
     centraba a lo ancho: se vio en la primera captura). */
  fila34: { height: ACCION.linea34, flexDirection: 'row', alignItems: 'center' },
  fila17: { height: ACCION.linea17, flexDirection: 'row', alignItems: 'center' },
  info: { width: ACCION.precio.info, height: ACCION.precio.info, borderRadius: ACCION.precio.info / 2 },
  grafico: { height: ACCION.grafico.alto },
  segmento: {
    position: 'absolute',
    height: ACCION.grafico.grosor,
    borderRadius: ACCION.grafico.grosor / 2,
    transformOrigin: '0% 50%',
  },
  punto: { position: 'absolute', width: ACCION.grafico.punto, height: ACCION.grafico.punto, borderRadius: ACCION.grafico.punto / 2 },
  rango: {
    height: ACCION.rango.alto,
    paddingLeft: ACCION.rango.izquierda,
    paddingRight: ACCION.rango.derecha,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pildora: {
    width: ACCION.rango.pildora.ancho,
    height: ACCION.rango.pildora.alto,
    borderRadius: ACCION.rango.pildora.radio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datosFila: { height: ACCION.datos.fila, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  celda: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
