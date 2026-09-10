import { SymbolView } from 'expo-symbols'
import { memo, useCallback, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  interpolateColor,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import type { SFSymbol } from 'sf-symbols-typescript'

import { BARRA, BORDE, CHIP, ICONO, LABEL, SUBRAYADO, extraDelTab } from './medidas'
import { usePaleta } from './theme'

/* ═══════════════════════════════════════════════════════════════
   LA BARRA — la fila de tabs, el subrayado, el degradé y el `+`.

   No tiene estado de selección y no sabe qué tab está elegido: recibe
   un `Tramo` —`d`, `h` y `t` (0..1)— y TODO lo que dibuja sale de ahí.
   Ese es el hallazgo de la referencia y la razón de que la pieza se
   sienta bien: en el clip, el subrayado y el contenido van juntos cuadro
   a cuadro —0.233/0.262, 0.589/0.604, 0.794/0.800— así que el subrayado
   no anima por su cuenta, es una función del arrastre.

   `t` y no la posición del pager, porque las dos dejaron de ser lo
   mismo: un toque lejano mueve el CONTENIDO una sola página aunque el
   salto sea de cuatro tabs (la referencia hace eso, está medido en el
   pager). El pager sabe cuál es cuál; la barra sólo quiere el 0..1.

   ────────────────────────────────────────────────────────────────
   EL TAB ACTIVO ES MÁS ANCHO, Y ESO ES TODO EL PROBLEMA.

   Cuando un tab se activa le aparece un símbolo —chevron a la derecha
   en los feeds, ícono a la izquierda en los temas— y el tab crece 18 pt
   (medido). Si eso fuera un flex row, cada cuadro del arrastre sería un
   pase de layout de Yoga sobre los siete tabs.

   Así que la fila NO es un flex row. Se calcula el layout entero —una
   `x` y un ancho por tab— para cada uno de los n estados de reposo, y
   se interpola **entre dos de ellos**: el de donde sale la transición y
   el de a dónde va (la `d` y la `h` del `Tramo`). Cada tab es un hijo
   absoluto con un `translateX`, o sea puro transform: cero layout por
   cuadro.

   Interpolar entre DOS y no sobre los n importa sólo cuando esos dos no
   son vecinos, o sea al TOCAR un tab lejano. La primera versión
   interpolaba sobre todos los estados y un toque del 2 al 6 pasaba por
   el 3, el 4 y el 5: cada uno abría su ícono y se ponía blanco al pasar,
   y volvía atrás. Con dos extremos, el layout va del 2 al 6 derecho y
   los del medio ni se enteran.

   Dos consecuencias que valen la pena:

   · La caja de cada tab tiene su ancho MÁXIMO fijo (con símbolo), y los
     tabs se dibujan en orden. El que viene después tapa al anterior
     justo en lo que le sobra, así que el área tocable de cada tab
     termina siendo exactamente [x_i, x_i+1] — su ancho real en ese
     estado, sin animar ni un `width`.

   · Adentro del tab, el label también está absoluto y colocado como si
     el símbolo estuviera. Cuando no está, el label se corre con un
     `translateX` negativo — la ranura entera si el símbolo va a la
     izquierda, y además TODO label inactivo lleva la inclinación
     (`apartado`), alejándose del tab activo. Por eso "For you" también
     se mueve al perder el chevron, como en la referencia.

   LAS MEDIDAS DEL TEXTO SE MIDEN, NO SE CALCULAN: cada label reporta su
   ancho con `onLayout`, porque depende de la fuente del sistema y del
   largo de la palabra. Una tabla escrita a mano se desincroniza con el
   primer label que cambie, y miente en otro idioma o con Dynamic Type.

   Y ESAS MEDIDAS VIVEN EN ESTADO DE REACT, no en un shared value. La
   primera versión guardaba el array en un `useSharedValue` y no
   funcionaba: con una sonda en el `onLayout` se vio que los tabs
   reportaban su caja bien, pero `medidas.get().length` leído justo
   después de asignar daba **0**. Estado de React además es lo correcto
   acá: una medida cambia una vez al montar y después nunca más.
   ═══════════════════════════════════════════════════════════════ */

export type Tab = {
  id: string
  label: string
  /** El símbolo que aparece cuando el tab está activo. */
  simbolo?: SFSymbol
  /** De qué lado del label va. `derecha` es el chevron de los feeds. */
  lado?: 'izquierda' | 'derecha'
  /** El símbolo va adentro de un contorno redondeado, como el chip de
   *  Stocks de la referencia. El recibo está arriba de `CHIP`. */
  chip?: boolean
}

/* ═══ EL TRAMO: LOS TRES NÚMEROS VAN JUNTOS, Y ESO ES EL ARREGLO ═══

   De dónde sale la transición en curso (`d`), a dónde va (`h`) y cuánto
   se avanzó (`t`, 0..1). UN SOLO valor compartido, no tres.

   ESTO ERA EL TITILEO DE LOS ÍCONOS, y está medido. Antes eran tres
   shared values: `desde` y `hasta` los escribía un `useAnimatedReaction`
   y `avance` era un `useDerivedValue`. Cada cruce de página dejaba a los
   estilos leyendo un trío que nunca existió —los extremos NUEVOS con el
   avance VIEJO, que en ese momento vale 1 porque está saturado— y el
   ícono que entraba prendía del todo por un cuadro antes de empezar su
   fundido. La traza de un barrido de seis páginas, sacada del propio
   mapper del estilo:

     ms       d h   avance   ícono del tab 2
     1350.0   0 1   0.6485   0.00
     1366.7   1 2   1.0000   1.00   ← el destello
     1383.2   1 2   0.0076   0.01   ← y vuelve

   Los seis tabs del barrido hicieron lo mismo: 0.000 → 1.000 → 0.008.

   POR QUÉ PASABA, en una línea: `useAnimatedReaction` llama a
   `startMapper(fun, inputs)` SIN lista de salidas (SOURCE:
   `react-native-reanimated@4.5.1`, `src/hook/useAnimatedReaction.ts:68`;
   compará con `useDerivedValue.ts:71`, que sí la pasa). El orden
   topológico de Reanimated arma sus aristas con esas salidas, así que
   una reacción es invisible para el orden: nadie garantiza que corra
   antes de quien lee lo que escribe.

   Con un solo valor no queda ningún orden que equivocar: los tres
   números nacen en el mismo worklet, y como sale de un `useDerivedValue`
   sí declara su salida y el sort lo pone antes de todos sus lectores.

   La regla, para la próxima: si dos números tienen que ser ciertos AL
   MISMO TIEMPO, son un valor, no dos. */
export type Tramo = { d: number; h: number; t: number }

/* Lo que hay que interpolar: por cada tab, dónde está y cuánto mide en
   cada uno de los n estados de reposo. `subX`/`subAncho` son los del
   subrayado, que es el tab activo de cada estado. */
type Plano = {
  equis: number[][]
  anchos: number[][]
  subX: number[]
  subAncho: number[]
  destinos: number[]
  minimos: number[]
  maximos: number[]
  topes: number[]
  contenido: number
}

/* LA LÍNEA DEL CHIP, hecha de barras rotadas: una por segmento del
   esqueleto medido (el recibo está arriba de `CHIP` en `medidas.ts`).
   Se calculan una sola vez; los hijos de un View con borde se
   posicionan DESPUÉS del borde, por eso se resta `CHIP.trazo`. Los
   extremos se alargan medio trazo por punta —capas redondas— para que
   las uniones no muestren costura y las puntas se fundan con el borde
   del chip, como en la referencia. El color no va acá: lo pone la
   paleta en el render. */
const ZIGZAG = CHIP.vertices.slice(0, -1).map((v, i) => {
  const [x1, y1] = v
  const [x2, y2] = CHIP.vertices[i + 1]
  const largo = Math.hypot(x2 - x1, y2 - y1) + CHIP.linea
  return {
    position: 'absolute' as const,
    width: largo,
    height: CHIP.linea,
    borderRadius: CHIP.linea / 2,
    left: (x1 + x2) / 2 - largo / 2 - CHIP.trazo,
    top: (y1 + y2) / 2 - CHIP.linea / 2 - CHIP.trazo,
    transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
  }
})

/* Qué está moviendo el contenido ahora mismo. La fila necesita saberlo
   porque hace tres cosas distintas según el caso. */
export const MOVIMIENTO = { quieto: 0, arrastre: 1, toque: 2 } as const

/* El fundido del ícono de tema: r^1.5 (medido) arrancando en `piso`
   (perilla). El chevron no pasa por acá — es lineal puro. */
function fundidoTema(r: number) {
  'worklet'
  const rr = Math.max(0, (r - ICONO.piso) / (1 - ICONO.piso))
  return rr * Math.sqrt(rr)
}

/* Interpola entre los dos estados de la transición en curso, y no sobre
   los n. `t` es cuánto se avanzó de `d` a `h`. */
function entre(valores: number[], d: number, h: number, t: number) {
  'worklet'
  const a = valores[d] ?? 0
  const b = valores[h] ?? a
  return a + (b - a) * t
}

/* LA INCLINACIÓN DEL LABEL: toda palabra que no es la activa se aparta
   `BARRA.apartar` del tab activo (a la izquierda si el activo está a la
   derecha, y al revés), interpolando entre los dos extremos del tramo.
   Es SOLO del label y de lo que viaja con él —velo y símbolo—: las
   cajas y el subrayado no la llevan. El recibo, con la tabla de las
   seis palabras en los seis reposos de X, está arriba de `apartar` en
   `medidas.ts`. Es lo que hace que "For you" también se corra cuando
   pierde el chevron (antes acá no se movía nunca) y que la palabra que
   se apaga viaje un poco más que su ranura, como en la referencia. */
function apartado(indice: number, d: number, h: number, t: number) {
  'worklet'
  const c = (a: number) => (indice === a ? 0 : indice < a ? -BARRA.apartar : BARRA.apartar)
  return c(d) + (c(h) - c(d)) * t
}

type Props = {
  tabs: Tab[]
  /** La transición en curso, entera. Lo calcula el pager: arrastrando `t`
   *  sale de la posición del scroll, y tocando de su propia animación
   *  —que no es lo mismo, porque un toque lejano mueve el contenido UNA
   *  página aunque el salto sea de cuatro. */
  tramo: SharedValue<Tramo>
  /** Uno de `MOVIMIENTO`. Con el contenido quieto la fila es del dedo del
   *  usuario y nadie la toca. */
  movimiento: SharedValue<number>
  /** El ancho visible de la fila — la pantalla. */
  viewport: number
  alTocar: (indice: number) => void
}

/* ═══ `memo`: NO ERA EL PARPADEO, PERO SE QUEDA ═══

   ACLARACIÓN, PORQUE ACÁ ANTES DECÍA OTRA COSA. Este bloque afirmaba que
   el `memo` era lo que arreglaba el titileo de los íconos. Era falso: el
   titileo estaba en el hilo de UI —ver el recibo arriba de `Tramo`— y
   sobrevivió intacto a esta memoización. La medición que lo probó está
   en `MEDICIONES.md`.

   Lo que sí es cierto, y por eso se queda: `SymbolView` es una vista
   NATIVA, y cada render de este componente le da props nuevas a los
   siete símbolos para que iOS los reconfigure. Quien disparaba el render
   era el pager, que hasta el 2026-09-07 bloqueaba su propio scroll
   mientras duraba un toque lejano con un `useState` que cambiaba dos
   veces por toque; hoy el pager no tiene estado de React, pero
   cualquier render del padre haría lo mismo, y la barra no depende de
   él para nada. Es trabajo que no hay razón para hacer.

   Para que `memo` corte de verdad, las props tienen que ser estables:
   `tabs` es constante del módulo, los shared values no cambian de
   identidad, y `alTocar` va con `useCallback` del otro lado. Es la
   regla 4 del AGENTS de la carpeta. */
export const Barra = memo(function Barra({ tabs, tramo, movimiento, viewport, alTocar }: Props) {
  const [labels, setLabels] = useState<number[]>([])
  const filaRef = useAnimatedRef<Animated.ScrollView>()
  const paleta = usePaleta()

  /* Los colores de la barra, separados de la geometría: cambian sólo
     con el tema. Los degradés van acá y no en `StyleSheet` porque
     llevan `paleta.fondo` adentro del string. */
  const tinte = useMemo(
    () => ({
      subrayado: { backgroundColor: paleta.subrayado },
      rampaIzq: {
        experimental_backgroundImage: `linear-gradient(to right, ${paleta.fondo} 0%, ${paleta.fondo}00 100%)`,
      },
      rampa: {
        experimental_backgroundImage: `linear-gradient(to right, ${paleta.fondo}00 0%, ${paleta.fondo} 100%)`,
      },
      mas: { backgroundColor: paleta.fondo },
    }),
    [paleta],
  )

  /* Dónde está la fila de verdad, leído del scroll. Lo usa el degradé
     para saber cuánto queda por recorrer. */
  const fila = useSharedValue(0)

  /* Dónde estaba la fila cuando el contenido empezó a moverse (`origen`)
     y cuánto se había apartado de su destino natural (`desvio`, cero si
     el usuario no la descentró a mano). Los dos se capturan UNA vez al
     arrancar el movimiento, y no leyendo la posición mientras uno mismo
     la comanda: eso es una realimentación, y oscila. La regla 'visible'
     usa el origen; 'centrar', el desvío (ver `objetivo`). */
  const origen = useSharedValue(0)
  const desvio = useSharedValue(0)

  /* `useCallback` para que `memo` de `Etiqueta` corte: una función nueva
     en cada render hace que la comparación dé distinto siempre. */
  const medir = useCallback((indice: number, ancho: number) => {
    setLabels((previos) => {
      if (previos[indice] === ancho) return previos
      const proximos = previos.slice()
      proximos[indice] = ancho
      return proximos
    })
  }, [])

  /* `useMemo` explícito y no confiando en el React Compiler: de la
     identidad de este objeto dependen las dependencias que el plugin de
     worklets le calcula a los estilos animados. Si cambiara en cada
     render, los estilos se reconstruirían en cada render. */
  const plano = useMemo<Plano | null>(() => {
    /* Con un solo tab no hay nada que interpolar, y `interpolate` pide
       dos puntos como mínimo. */
    if (tabs.length < 2) return null
    for (let i = 0; i < tabs.length; i++) if (labels[i] === undefined) return null

    const n = tabs.length
    const base = tabs.map((_, i) => labels[i] + BARRA.padding * 2)
    const extra = tabs.map((tab) => extraDelTab(tab.lado))

    /* El layout completo de un estado: el tab `activo` lleva su símbolo
       y los demás no. */
    const estado = (activo: number) => {
      const anchos = base.map((b, i) => b + (i === activo ? extra[i] : 0))
      const equis: number[] = []
      let x = BARRA.inset
      for (let i = 0; i < n; i++) {
        equis.push(x)
        x += anchos[i] + BARRA.separacion
      }
      x -= BARRA.separacion // la separación va ENTRE cajas, no después de la última
      /* El cierre lleva `respiro` y no `inset`: la fila NO es simétrica.
         A la izquierda el inset separa del borde de la pantalla; a la
         derecha ya está el `+` haciendo de tope, y en la referencia el
         último tab le queda a 3.6 pt. */
      return { equis, anchos, total: x + BORDE.respiro }
    }

    const estados = Array.from({ length: n }, (_, a) => estado(a))
    const indices = estados.map((_, a) => a)

    /* EL VIEWPORT ÚTIL TERMINA DONDE EMPIEZA EL `+`, no antes.

       Esto pasó por dos versiones equivocadas. Primero el tope se
       calculaba contra el ancho de la pantalla, y la fila se frenaba con
       el último tab abajo del `+`. Después se corrigió contra el borde
       del degradé, y quedó 84 pt corta — el último tab entraba, pero con
       un hueco enorme al lado.

       Lo que hace la referencia está medido: con el scroll al tope, la
       caja del último tab termina en 391.7 pt de una pantalla de 440, y
       el `+` arranca en 396. O sea que la fila corre hasta pegarse al
       `+`, y el degradé no es problema porque en ese estado está
       apagado (ver `restantes`). */
    const util = viewport - BORDE.mas
    const topes = estados.map(({ total }) => Math.max(0, total - util))

    /* LA FILA CENTRA EL TAB ACTIVO EN LA PANTALLA ENTERA, Y DESPUÉS SE
       CHOCA CONTRA EL TOPE. Ahí está todo el comportamiento que la
       referencia tiene y esto no tenía: con los primeros tabs el centrado
       pide un número negativo, el clamp lo deja en 0 y la fila NO SE
       MUEVE; del cuarto en adelante pide más de lo que hay, el clamp lo
       deja en el tope y la fila SE VA ENTERA hasta el final. Eso es el
       "o se queda quieta o se mueve bastante".

       Los cinco estados en reposo del clip, medidos: la posición de la
       caja activa sale del subrayado (blanco puro, sin sesgo de umbral) y
       el desplazamiento de la fila sale de comparar tabs que están
       apagados en los DOS estados —ahí el ancho extra del activo se
       cancela y queda sólo el scroll:

         activo      fila medida   centrado en 440   centrado en 396
         For you          0            −161 → 0         −140 → 0
         Following        0             −76 → 0          −58 → 0
         Stocks           0            −0.3 → 0        **21.7**  ✗
         Tech          45.4             63 → tope        85 → tope
         AI            45.4            118 → tope       139 → tope

       Stocks es el único estado que distingue los dos modelos, y cae del
       lado del centrado en la pantalla ENTERA por tres décimas. No es
       casualidad numérica: el `+` no achica la fila, la tapa. La fila
       ocupa los 440 y lo que reserva para el botón es un inset al final
       —por eso el tope sí se calcula contra `util`.

       Y el tope está verificado por su lado: con Tech activo, la caja del
       último tab termina en 396.0 pt, o sea EXACTAMENTE donde arranca el
       `+`. La fila corre hasta pegarse al botón y ni un punto más.

       ─── Y SÓLO AL TOCAR ───
       La fila se mueve cuando TOCÁS un tab. Arrastrando se queda quieta,
       y eso también está medido: el clip del vault tiene cuatro
       transiciones, todas entre vecinos, y la fila no se corre en
       ninguna —ni con Tech activo, donde el centrado pediría 45 pt—. Que
       son arrastres y no toques se ve normalizando las cuatro curvas al
       mismo tiempo: en el paso 4/24 dan 0.071, 0.120, 0.053 y 0.110. Un
       `withTiming` daría el mismo número las cuatro veces. Eso es un
       dedo.

       ─── Y TAMBIÉN AL ARRASTRAR, QUE ES LO QUE ESTABA MAL ───
       La primera versión dejaba la fila QUIETA durante el arrastre (el
       clip del vault no la movía en sus cuatro transiciones — todas
       entre tabs cuyo destino es el mismo 0). Las grabaciones nuevas
       (2026-09-01) muestran el caso que el vault no mostraba: en el
       arrastre Tech→AI de X la fila se corre ~6 pt DURANTE el gesto,
       siguiendo la diferencia entre los reposos de los dos estados
       (45.6 → 39.6 medidos). O sea: la fila sigue `destinos`
       interpolado con el MISMO avance del contenido, se arrastre o se
       toque. Lo que el usuario haya descentrado a mano se respeta como
       desvío (ver `desvio`), y el clamp a [minimo, maximo] garantiza
       que el activo entre entero igual.

       ─── STOCKS→TECH, EL CASO GRANDE (v1, cuadros 203–221) ───
       Es la única transición entre vecinos donde el centrado pide un
       salto entero (0 → 45.6), y X lo da: arrastrando con el dedo, la
       palabra "AI" —inactiva y del mismo lado en los dos estados, o sea
       testigo limpio de la fila— va 342.3 → 296.7 mientras el contenido
       avanza, y la razón fila/avance da 44.5 en los trece cuadros
       intermedios (0.15 → 6.6, 0.54 → 24.0, 0.90 → 39.6). Lineal, en
       sincronía, sin esperar a que el dedo suelte. "For you" sale por
       la izquierda y "Design" entra por la derecha.

       Las siete transiciones de las tres grabaciones (tres toques, cuatro
       arrastres, ida y vuelta) caen en el centrado; el modelo "sólo si
       no entra" falla en cinco. Y sin embargo la pieza HOY no usa esto
       por defecto: `BARRA.fila` elige entre 'centrar' (esto) y
       'visible' (pedido del usuario, 2026-09-02) — el recibo del pedido
       está en medidas.ts. `destinos` se calcula igual, para que volver
       sea cambiar una palabra. */
    const destinos = indices.map((a) => {
      const { equis, anchos } = estados[a]
      const centro = equis[a] + anchos[a] / 2
      return Math.min(Math.max(0, centro - viewport / 2), topes[a])
    })

    /* EL RANGO EN EL QUE EL TAB `a` SE VE ENTERO. Con 'centrar' es el
       clamp del arrastre: la fila no se mueve mientras el tab entre, y
       si no entra, se corre lo justo — sin esto, arrastrar hasta el
       último tab deja el subrayado fuera de pantalla. Con 'visible' es
       LA regla entera: la fila se queda en su origen y estos dos números
       son lo único que la empuja. */
    /* "Entrar entero" incluye el aire propio de la fila: `respiro` del
       lado del `+` y el `inset` del otro. Sin el inset, volver al primer
       tab arrastrando dejaba la fila corrida 12 pt y "For you" pegado al
       borde de la pantalla — medido, la caja arrancaba en 0.0 en vez de
       en 12.0. */
    const minimos = indices.map((a) =>
      Math.max(0, estados[a].equis[a] + estados[a].anchos[a] + BORDE.respiro - util),
    )
    const maximos = indices.map((a) =>
      Math.max(minimos[a], Math.min(estados[a].equis[a] - BARRA.inset, topes[a])),
    )

    /* EL ANCHO DEL CONTENIDO NO CAMBIA CON EL TAB ACTIVO, a propósito.
       El total real varía 3 pt entre estados —es la diferencia entre el
       extra del chevron (18) y el del ícono (21)— y un `contentSize` que
       se mueve hace saltar el offset de un UIScrollView cada vez que se
       encoge estando al final. Se usa el máximo y listo: los 3 pt de más
       quedan pasando el último tab, abajo del `+`, donde no se ven.

       Y LLEVA EL ANCHO DEL `+` DE COLA. El ScrollView ocupa los 440 —el
       botón lo tapa, no lo achica— así que su tope natural es
       `contenido − 440`, y eso deja al último tab 44 pt corto: medido, el
       subrayado de Design frenaba en 272.3 en vez de 223.3. Con la cola,
       el tope pasa a ser `contenido − 396`, que es exactamente `topes`.
       Es el mismo modelo que la referencia: una fila de 440 con 44 de
       inset al final. */
    const contenido = Math.max(...estados.map((e) => e.total)) + BORDE.mas

    return {
      equis: tabs.map((_, i) => estados.map((e) => e.equis[i])),
      anchos: tabs.map((_, i) => estados.map((e) => e.anchos[i])),
      subX: indices.map((a) => estados[a].equis[a]),
      subAncho: indices.map((a) => estados[a].anchos[a]),
      destinos,
      minimos,
      maximos,
      topes,
      contenido,
    }
  }, [labels, tabs, viewport])

  /* ───────────────────────────────────────────────────────────────
     A DÓNDE QUIERE IR LA FILA, cuadro a cuadro. La regla la elige
     `BARRA.fila` (el recibo de cada una está en medidas.ts):

     · 'visible'  — se queda donde estaba cuando el contenido arrancó
                    (`origen`), clampeada al rango en que el tab activo
                    entra entero, interpolado con el mismo avance que
                    todo lo demás. Sólo se corre cuando hace falta, y lo
                    justo. Tocando y arrastrando por igual.
     · 'centrar'  — sigue `destinos` (lo que hace X, medido) con el mismo
                    avance; arrastrando suma el DESVÍO que el usuario
                    haya dejado a mano y clampea a que el activo entre.
     · QUIETO     — no existe: con el contenido quieto la fila es del
                    dedo del usuario y esto no la toca (ver la reacción).
     ─────────────────────────────────────────────────────────────── */
  const objetivo = useDerivedValue(() => {
    if (!plano) return 0
    const { d, h, t } = tramo.get()
    const minimo = entre(plano.minimos, d, h, t)
    const maximo = entre(plano.maximos, d, h, t)
    if (BARRA.fila === 'visible') return Math.min(Math.max(origen.get(), minimo), maximo)
    if (movimiento.get() === MOVIMIENTO.toque) return entre(plano.destinos, d, h, t)
    const sigue = entre(plano.destinos, d, h, t) + desvio.get()
    return Math.min(Math.max(sigue, minimo), maximo)
  })

  /* El origen y el desvío se toman en el cuadro en que el contenido
     arranca. El tab "actual" es la punta más cercana del tramo:
     arrancando hacia adelante `t` nace cerca de 0 y es `d`; hacia atrás
     nace cerca de 1 y es `h`. */
  useAnimatedReaction(
    () => movimiento.get(),
    (m, anterior) => {
      if (m !== MOVIMIENTO.quieto && anterior === MOVIMIENTO.quieto) {
        const { d, h, t } = tramo.get()
        const actual = t < 0.5 ? d : h
        origen.set(fila.get())
        desvio.set(fila.get() - (plano ? (plano.destinos[actual] ?? 0) : 0))
      }
    },
  )

  /* Y ACÁ ESTÁ TODO EL REPARTO: mientras el contenido se mueve, la fila
     la comanda la pieza; con el contenido quieto, no se la toca y el
     ScrollView queda enteramente del usuario —con el rebote y la
     deceleración de iOS, que son gratis y no hay forma de igualarlos a
     mano. */
  useAnimatedReaction(
    () => (movimiento.get() === MOVIMIENTO.quieto ? Number.NaN : objetivo.get()),
    (x) => {
      if (!Number.isNaN(x)) scrollTo(filaRef, x, 0, false)
    },
  )

  /* El degradé mide lo que le QUEDA a la fila por recorrer, y por eso
     compara el tope del estado actual contra dónde está parada de
     verdad. Con el último tab activo da 0 y el degradé desaparece: un
     degradé que promete contenido que no existe es una mentira, y en la
     referencia efectivamente no está. */
  /* LA RAMPA IZQUIERDA — el espejo de la del `+`, y con la misma
     semántica: dice "hay contenido escondido para este lado". Aparece
     recién cuando la fila está scrolleada (`fila > 0`) y entra sobre la
     misma ventana `desvanece` que la derecha. Sin esto, la palabra que
     sale de pantalla se corta seca contra el borde — medido en la
     referencia del usuario: las letras se apagan en una rampa de ~21 pt
     conservando las astas nítidas, o sea un degradé multiplicativo como
     el del otro lado, no un blur de verdad. */
  const estiloRampaIzq = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, fila.get() / BORDE.desvanece)),
  }))

  const estiloDegradado = useAnimatedStyle(() => {
    if (!plano) return { opacity: 0 }
    const { d, h, t } = tramo.get()
    const restante = entre(plano.topes, d, h, t) - fila.get()
    return { opacity: Math.min(1, Math.max(0, restante / BORDE.desvanece)) }
  })

  /* El subrayado es el único `width` animado de la pieza, y está
     permitido: es un hijo absoluto sin hijos propios, así que no
     re-acomoda a nadie, y animar el ancho le conserva las puntas que un
     `scaleX` le aplastaría. */
  const estiloSubrayado = useAnimatedStyle(() => {
    if (!plano) return { opacity: 0, width: 0, transform: [{ translateX: 0 }] }
    const { d, h, t } = tramo.get()
    return {
      opacity: 1,
      width: entre(plano.subAncho, d, h, t),
      transform: [{ translateX: entre(plano.subX, d, h, t) }],
    }
  })

  const alScrollearFila = useAnimatedScrollHandler({
    onScroll: (e) => {
      fila.set(e.contentOffset.x)
    },
    /* El dedo en la fila siempre gana: corta cualquier corrección en
       curso y devuelve el scroll al usuario. */
    onBeginDrag: () => {
      movimiento.set(MOVIMIENTO.quieto)
    },
  })

  return (
    <View style={css.barra}>
      <Animated.ScrollView
        ref={filaRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={alScrollearFila}
        scrollEventThrottle={16}
        /* El alto va EXPLÍCITO: los tabs son hijos absolutos con
           `top/bottom: 0`, y un contenedor de contenido que colapsa a
           cero los dejaría sin caja donde apoyarse. */
        contentContainerStyle={{ width: plano?.contenido, height: BARRA.alto }}
        style={css.pista}
      >
        {tabs.map((tab, indice) => (
          <Etiqueta
            key={tab.id}
            tab={tab}
            indice={indice}
            tramo={tramo}
            equis={plano?.equis[indice]}
            medir={medir}
            alTocar={alTocar}
          />
        ))}
        <Animated.View style={[css.subrayado, tinte.subrayado, estiloSubrayado]} />
      </Animated.ScrollView>

      {/* El degradé va después de la fila para quedar encima, y no
          intercepta toques: los tabs que tape siguen siendo tocables.
          Se apaga cuando no queda nada para scrollear — un degradé que
          promete contenido que no existe es una mentira, y en la
          referencia efectivamente no está. */}
      <Animated.View style={[css.rampa, tinte.rampa, estiloDegradado]} pointerEvents="none" />
      <Animated.View style={[css.rampaIzq, tinte.rampaIzq, estiloRampaIzq]} pointerEvents="none" />

      <Pressable style={[css.mas, tinte.mas]} onPress={() => {}} accessibilityLabel="Agregar tab">
        <SymbolView name="plus" size={BORDE.simboloMas} tintColor={paleta.mas} />
      </Pressable>
    </View>
  )
})

/* Cada label es su propio componente y no una llamada a hook adentro
   del `.map`: así el orden de hooks no depende de cuántos tabs haya. */
const Etiqueta = memo(function Etiqueta({
  tab,
  indice,
  tramo,
  equis,
  medir,
  alTocar,
}: {
  tab: Tab
  indice: number
  tramo: SharedValue<Tramo>
  equis: number[] | undefined
  medir: (indice: number, ancho: number) => void
  alTocar: (indice: number) => void
}) {
  const extra = extraDelTab(tab.lado)
  const izquierda = tab.lado === 'izquierda'
  const desliz = izquierda ? ICONO.desliz.izquierda : ICONO.desliz.derecha
  const paleta = usePaleta()

  /* Los colores de la etiqueta, separados de la geometría. `useMemo`
     por la misma razón de siempre: `SymbolView` y los velos son vistas
     nativas y un objeto nuevo por render las reconfigura — esto cambia
     sólo con el tema. Los degradés llevan `paleta.fondo` en el string y
     por eso no pueden vivir en `StyleSheet`. */
  const tinte = useMemo(
    () => ({
      label: { backgroundColor: paleta.fondo },
      veloTema: {
        experimental_backgroundImage: `linear-gradient(to right, ${paleta.fondo}00 0%, ${paleta.fondo} 100%)`,
      },
      veloChevron: {
        experimental_backgroundImage: `linear-gradient(to right, ${paleta.fondo} 0%, ${paleta.fondo}00 100%)`,
      },
      chip: { borderColor: paleta.icono },
      zigzag: { backgroundColor: paleta.icono },
    }),
    [paleta],
  )

  /* CUÁNTO DE "ACTIVO" TIENE ESTE TAB AHORA MISMO, y sale de los dos
     extremos de la transición, no de la distancia a `progreso`.

     Sólo participan el tab del que se sale y el tab al que se va. Un
     tab que no es ninguno de los dos vale 0 aunque el pager le pase por
     encima — que es justo lo que arreglaba esto: tocando del 2 al 6,
     los del medio abrían su ícono y se ponían blancos al pasar.

     Arrastrando, `desde` y `hasta` son vecinos y los dos suman 1 en el
     medio del gesto, que es lo que hace el clip: durante el arrastre se
     ven los dos chevrons a la vez. */
  const revelado = (d: number, h: number, t: number) => {
    'worklet'
    /* SIN TRANSICIÓN EN CURSO —los dos extremos son el mismo tab— el
       activo está revelado del todo. Sin esta línea, `t` vale 0 cuando
       `d === h` y el tab activo se quedaba en 0: gris y sin ícono. Pasa
       en el ÚLTIMO tab en reposo, porque ahí `h` no puede avanzar y
       queda igual a `d`. */
    if (d === h) return indice === d ? 1 : 0
    if (indice === h) return t
    if (indice === d) return 1 - t
    return 0
  }

  const estiloCaja = useAnimatedStyle(() => {
    if (!equis) return { opacity: 0, transform: [{ translateX: 0 }] }
    const { d, h, t } = tramo.get()
    return {
      opacity: 1,
      transform: [{ translateX: entre(equis, d, h, t) }],
    }
  })

  /* El label está colocado como si el símbolo estuviera siempre. Cuando
     no está, se corre a la izquierda lo que el símbolo ocupaba — y sólo
     si el símbolo va de ese lado. */
  const estiloLabel = useAnimatedStyle(() => {
    const { d, h, t } = tramo.get()
    const r = revelado(d, h, t)
    return {
      /* Lo ÚNICO que cambia entre activo e inactivo es el color. Está
         verificado contra la referencia a nivel sub-píxel: el asta de la
         misma letra mide 5.03 px en los dos estados (ver `medidas.ts`).
         Y sale del MISMO `revelado` que el ícono, así que un tab que no
         es punta de la transición no se aclara ni un poco. */
      /* `gamma: 1` NO es un descuido: X interpola el color del label en
         sRGB crudo y está medido — a r=0.348 su label da 181, que es la
         lerp cruda (142+113·0.348=181.3); la lerp en espacio lineal
         —el default de Reanimated— daría 191. Verificado en tres
         cuadros más: 222@0.734, 241@0.876 contra 224.9 y 241. */
      color: interpolateColor(r, [0, 1], [paleta.inactivo, paleta.activo], 'RGB', { gamma: 1 }),
      transform: [
        { translateX: (izquierda ? -extra * (1 - r) : 0) + apartado(indice, d, h, t) },
      ],
    }
  })

  /* EL SÍMBOLO SALE DE ATRÁS DE LA PALABRA, no se enciende en su lugar.
     Arranca `desliz` a la izquierda —eso lo mete abajo de la última
     letra si es chevron, y lo saca de las primeras si es ícono— y se
     corre a su lugar mientras se enciende. El recibo de las distancias y
     del signo está en `medidas.ts`, Y TAMBIÉN el de por qué esto es así
     y no de otra forma: la ventana con recorte y la pluma ya se probaron
     y se volvieron atrás (2026-09-01) — el spec final es una captura de
     X con el glifo ENTERO, apenas apagado, pegado a la palabra.

     La escala desde 0.9 se queda: nada en el mundo real aparece de
     tamaño cero. */
  const estiloSimbolo = useAnimatedStyle(() => {
    const { d, h, t } = tramo.get()
    const r = revelado(d, h, t)
    return {
      /* DOS CURVAS DISTINTAS, y las dos medidas del clip (el recibo con
         la tabla está en `medidas.ts`): el ícono blanco funde con r^1.5
         y el chevron gris funde lineal. Sin escala: el ancho de la
         tinta de la referencia es constante durante toda la transición.

         El ícono además tiene un PISO (`ICONO.piso`): por debajo no
         existe, y la curva se re-mapea al tramo restante — es el
         "disolverse un poquito antes" pedido a mano, para que cerca de
         la palabra nunca quede ni el fantasma.

         Y viaja con la inclinación del label (`apartado`): en la
         referencia el ícono que muere acompaña a su palabra, no se
         queda clavado en la ranura (el cpu de Tech se corre con la
         palabra mientras se funde — medido en la grabación nueva). */
      opacity: izquierda ? fundidoTema(r) : r,
      transform: [{ translateX: -desliz * (1 - r) + apartado(indice, d, h, t) }],
    }
  })

  /* La pluma del borde de oclusión viaja CON el fondo del label: del
     lado del ícono el label se mueve, así que el velo comparte su
     translateX; del lado del chevron todo es quieto y el velo es un
     View estático anclado desde la derecha (no necesita el ancho del
     label). En reposo los dos velos pintan degradé sobre negro puro —
     invisibles: el techo de `pluma` garantiza que nunca alcanzan la
     tinta del símbolo en reposo (recibo en `medidas.ts`). */
  const estiloVelo = useAnimatedStyle(() => {
    const { d, h, t } = tramo.get()
    const r = revelado(d, h, t)
    return {
      transform: [
        { translateX: (izquierda ? -extra * (1 - r) : 0) + apartado(indice, d, h, t) },
      ],
    }
  })

  /* EL GLIFO SE DESBORDA DE SU RANURA, y es a propósito: la referencia
     pinta 16 pt de ícono en un lugar que ocupa 11. La ranura es lo que
     el layout reserva —y por lo tanto lo que engorda el tab— y el glifo
     es lo que se ve. Centrado, sobra por los dos lados por igual.

     LA CAJA ES DEL GLIFO Y EL MARGEN NEGATIVO HACE LA RANURA, y no al
     revés. La primera versión ponía una caja del tamaño de la ranura y
     dejaba al glifo asomar por `overflow: visible`: geométricamente da
     lo mismo, pero deja una vista NATIVA dibujando fuera de los límites
     de su padre, y ese padre tiene la opacidad animada. Con la caja del
     tamaño del glifo no hay nada afuera de nada, y el layout es idéntico
     —20 de caja menos 4.5 de margen a cada lado son los 11 de ranura.

     TODOS LOS ESTILOS SALEN DE `StyleSheet`, incluso los dos que
     dependen del lado. Un objeto nuevo en cada render le da props nuevas
     a `SymbolView`, que es una vista nativa: iOS la reconfigura y en
     medio de una animación de opacidad eso se ve como un parpadeo. */
  const simbolo = (tab.simbolo || tab.chip) && (
    <Animated.View style={[izquierda ? css.ranuraTema : css.ranuraChevron, estiloSimbolo]}>
      {tab.chip ? (
        <View style={[css.chip, tinte.chip]}>
          {ZIGZAG.map((tramoChip, i) => (
            <View key={i} style={[tramoChip, tinte.zigzag]} />
          ))}
        </View>
      ) : (
        <SymbolView
          name={tab.simbolo!}
          size={izquierda ? ICONO.glifo.tema : ICONO.glifo.chevron}
          tintColor={izquierda ? paleta.icono : paleta.chevron}
          weight="semibold"
          resizeMode="scaleAspectFit"
          style={izquierda ? css.glifoTema : css.glifoChevron}
        />
      )}
    </Animated.View>
  )

  /* El símbolo va EN FLUJO, no absoluto, y por eso el tab mide solo lo
     que tiene que medir: padding + hueco + aire + label. Su lugar queda
     reservado aunque esté transparente, así que apagarlo no re-acomoda
     nada — lo único que se mueve es el label, y se mueve con un
     transform. */
  return (
    <Animated.View style={[css.tab, estiloCaja]}>
      <Pressable
        style={css.golpe}
        /* Sin `onPressIn`: la háptica vive en `alTocar` (el toque
           consumado). Acá vivía un tick al apretar, y tenía un costo
           que no se vio hasta el teléfono: empezar a ARRASTRAR la fila
           apoya el dedo sobre un tab y el tick sonaba en cada arrastre
           ("saca el haptic", 2026-09-01). El scroll cancela el press,
           así que `onPress` no dispara al arrastrar — el tick queda
           solo en los toques de verdad. */
        onPress={() => alTocar(indice)}
        /* Un dedo que se corre unos píxeles no tendría que cancelar un
           toque que quisiste dar. */
        pressRetentionOffset={12}
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
      >
        {izquierda && simbolo}
        {/* Los dos velos son animados: viajan con el label — el de tema
            por el corrimiento de la ranura, y los dos por la
            inclinación (`apartado`). */}
        {!!simbolo && (
          <Animated.View
            style={[
              izquierda ? css.veloTema : css.veloChevron,
              izquierda ? tinte.veloTema : tinte.veloChevron,
              estiloVelo,
            ]}
          />
        )}
        {/* `allowFontScaling={false}` — ver la nota en `medidas.ts`. La
            referencia no escala sus tabs con Dynamic Type y la pieza
            tampoco, o la comparación cuadro a cuadro deja de valer. */}
        <Animated.Text
          style={[css.label, tinte.label, estiloLabel]}
          onLayout={(e) => medir(indice, e.nativeEvent.layout.width - 2 * ICONO.brecha)}
          numberOfLines={1}
          allowFontScaling={LABEL.escala}
        >
          {tab.label}
        </Animated.Text>
        {!izquierda && simbolo}
      </Pressable>
    </Animated.View>
  )
})

const css = StyleSheet.create({
  /* `overflow: hidden` para que los tabs que quedan afuera no se vean
     al costado cuando la fila se corre. */
  barra: { height: BARRA.alto, overflow: 'hidden' },
  /* La pista es un ScrollView horizontal de verdad, así que el rebote y
     la deceleración son los de iOS. Ocupa la barra entera y les presta a
     los tabs su borde izquierdo como cero. */
  pista: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },


  /* Sin `width`: absoluto con top/bottom/left fijados y el ancho libre,
     Yoga lo hace medir su contenido. Y su contenido incluye el hueco del
     símbolo esté visible o no, así que la caja SIEMPRE tiene el ancho
     del estado activo. El tab que viene después se dibuja encima y le
     recorta lo que le sobra, con lo cual el área tocable queda exacta
     —[x_i, x_i+1]— sin animar ni un `width`. */
  tab: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  golpe: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BARRA.padding,
    /* El subrayado se come 2 pt abajo: sin esto el texto quedaría
       centrado en la barra entera y apoyado sobre la línea. */
    paddingBottom: SUBRAYADO.alto,
    gap: ICONO.aire,
  },
  /* `zIndex` y no el orden de los hijos: el símbolo va a un lado o al
     otro según el tab, así que el orden en el árbol no puede garantizar
     que la palabra quede arriba. Y tiene que quedar arriba SIEMPRE,
     porque el símbolo arranca metido atrás de ella.

     EL FONDO DEL COLOR DE LA PIEZA ES LA OCLUSIÓN. La palabra viaja con
     su propio fondo (`tinte.label`, del color del fondo de la paleta) y
     eso es lo que hace verdad el "se esconde atrás": el símbolo tapado
     no se mezcla entre las letras — desaparece abajo de un borde
     limpio. El padding infla la caja del fondo (`brecha` a los
     costados, 3 pt arriba y abajo para cubrir el glifo entero) y el
     margen negativo la desinfla para el layout, así ni la fila ni el
     centrado se enteran; `medir` descuenta la brecha del onLayout. */
  label: {
    fontSize: LABEL.tamano,
    fontWeight: LABEL.peso,
    zIndex: 1,
    paddingHorizontal: ICONO.brecha,
    marginHorizontal: -ICONO.brecha,
    paddingVertical: 3,
    marginVertical: -3,
  },

  /* La caja mide lo que mide el GLIFO, y el margen negativo la encoge a
     la RANURA a los ojos del layout. Ver la nota arriba del símbolo. */
  ranuraTema: {
    width: ICONO.glifo.tema,
    height: ICONO.glifo.tema,
    marginHorizontal: (ICONO.ranura.tema - ICONO.glifo.tema) / 2,
  },
  ranuraChevron: {
    width: ICONO.glifo.chevron,
    height: ICONO.glifo.chevron,
    marginHorizontal: (ICONO.ranura.chevron - ICONO.glifo.chevron) / 2,
  },
  glifoTema: { width: ICONO.glifo.tema, height: ICONO.glifo.tema },
  glifoChevron: { width: ICONO.glifo.chevron, height: ICONO.glifo.chevron },

  /* LOS VELOS: la pluma del borde de oclusión. Cada uno arranca donde
     termina el fondo del label (a `brecha` de la tinta) y desvanece
     hacia el lado por el que el símbolo emerge. zIndex 1 para quedar
     sobre el símbolo, igual que el label; el label, que viene después
     en el árbol, queda encima de los dos. */
  /* OJO CON YOGA: los hijos ABSOLUTOS se posicionan desde el border
     box — el padding del `golpe` no les corre el cero como a los hijos
     en flujo. Por eso el padding se suma acá a mano; sin él, el velo
     cae 12 pt a la izquierda (medido con un velo rojo de sonda). */
  veloTema: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: BARRA.padding + ICONO.ranura.tema + ICONO.aire - ICONO.brecha - ICONO.pluma,
    width: ICONO.pluma,
    zIndex: 1,
  },
  veloChevron: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: BARRA.padding + ICONO.ranura.chevron + ICONO.aire - ICONO.brecha - ICONO.pluma,
    width: ICONO.pluma,
    zIndex: 1,
  },

  /* El chip de Stocks: contorno medido del clip (ver `CHIP`), centrado
     en el marco de 20 del glifo — el margen es la diferencia. */
  chip: {
    width: CHIP.lado,
    height: CHIP.lado,
    margin: (ICONO.glifo.tema - CHIP.lado) / 2,
    borderWidth: CHIP.trazo,
    borderRadius: CHIP.radio,
  },

  /* Pegado abajo, que es donde el clip lo tiene: el subrayado ocupa las
     últimas 6 filas de píxeles de la barra y el divisor viene justo
     después. Las puntas son CÁPSULA (radio = alto/2), medidas en cuatro
     reposos de la referencia — el recibo está arriba de `radio`. Animar
     el `width` en vez de escalar conserva el radio en las puntas. */
  subrayado: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: SUBRAYADO.alto,
    borderRadius: SUBRAYADO.radio,
  },

  /* LA RAMPA TERMINA DONDE EMPIEZA EL `+`, no en el borde de la
     pantalla: por eso el `right` es `BORDE.mas` y no 0. Lo que va abajo
     del botón es negro macizo, y eso lo pone el propio botón con su
     `backgroundColor`.

     `experimental_backgroundImage` es de React Native 0.86 y toma la
     misma sintaxis que CSS. Vale la pena decir por qué no hay una
     dependencia acá: `expo-linear-gradient` es un módulo NATIVO, y
     agregarlo obligaría a reconstruir el dev client de todos los
     worktrees por un degradé. */
  /* El ancho es EL MISMO de la rampa derecha a propósito: la referencia
     del usuario mide ~21 pt y la derecha, reconstruida del clip, 23 —
     dentro del error de una contra la otra. Un solo número para las dos
     puntas de la misma idea. */
  rampaIzq: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: BORDE.rampa,
  },
  rampa: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: BORDE.mas,
    width: BORDE.rampa,
  },
  /* Fondo opaco, no transparente (lo pone `tinte.mas`): en el clip, de
     396 a 408 pt no aparece tinta en ningún cuadro. Abajo del `+` no se
     ve nada, nunca. Ocupa todo el alto de la barra —subrayado
     incluido— porque tampoco pasa ningún subrayado por atrás. */
  mas: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: BORDE.mas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SUBRAYADO.alto,
  },
})
