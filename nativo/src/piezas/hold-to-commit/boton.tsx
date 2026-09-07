import type { GlassViewProps } from 'expo-glass-effect'
import { type ComponentType, type ReactNode, useEffect, useMemo } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets'

import { Chispas } from './chispas'
import { Etiqueta, HOLD as L_HOLD, KEEP as L_KEEP, LISTO as L_LISTO } from './etiqueta'
import { alCompletar, DETENTES, tic } from './haptica'
import type { Material } from './material'
import { CLARO, COLOR, COMMIT, CRUCE, DERRAME, FRENTE, frenteEn, HOLD, LABEL, PARTICULAS, PILL, PRESS, REINICIO, VELO } from './medidas'
import { marcarJS, marcarUI } from './medidor'
import { Particulas } from './particulas'
import { CINEMATICA, type Curva, type Receta, type Tiempos } from './receta'
import { ADELANTO_MS, prepararSonido, sonar } from './sonido'

/* ═══════════════════════════════════════════════════════════════
   HOLD TO COMMIT — el botón. Apretás, se llena de izquierda a derecha en
   `HOLD.duracion` (1 s a pedido; el clip mide 2), y si lo sostenés
   hasta el final queda blanco con un
   "✓ Committed". Si soltás antes, el brillo retrocede y vuelve a decir
   "Hold to Commit". No hay barra de progreso: el brillo ES el progreso.

   TODO CORRE EN EL HILO DE UI. El gesto es un LongPress de Gesture
   Handler cuyo `minDuration` es el MISMO número que la duración del
   relleno (`HOLD.duracion`): el reloj nativo del reconocedor decide
   cuándo se completó, y el `withTiming` lineal del progreso llega a 1 en
   el mismo instante. Es la regla 3 del AGENTS del taller —dos gestos que
   tienen que coincidir salen de una sola constante—. Al hilo de JS sólo
   se le pide la háptica (`scheduleOnRN`), y nunca por cuadro: en los
   detentes del progreso (`useAnimatedReaction`) y al completar.

   LAS CURVAS Y LOS TIEMPOS VIENEN DE LA RECETA (`receta.ts`): la fiel al
   clip o la de las tablas del skill animate-expo. El botón no sabe cuál
   está puesta: recibe `receta`, lee `R`, y lo demás es geometría medida.

   EL RELLENO SON CUATRO TEXTURAS, no vistas con degradé (que en RN
   necesitarían un módulo nativo — ver `media/generar.swift`):

     brillo   el teal→verde de reposo, pegado al borde inferior, fijo
     cuerpo   una columna de 1 px estirada a lo ancho, blanco con el
              rim verde pálido arriba y abajo
     frente   el borde de ataque: una cápsula con caída erfc de σ=19 pt
              centrada en el borde geométrico (140 pt de textura)
     velo     la punta izquierda del blob (una cápsula desenfocada que
              arranca 6 pt adentro del pill), hecha como un velo del
              color del pill sobre el cuerpo, prendido junto con él

   `cuerpo` y `frente` viajan juntos en UN translateX: el borde
   geométrico del relleno —donde el frente está al 50 %— va del 3 % al
   94 % del ancho en los 2 s (`frenteEn`; el clip no llega a la punta
   derecha, el blanqueo la cubre). Además el frente se ensancha un 25 %
   a lo largo del hold y la punta izquierda se oscurece y se ensancha a
   medida que el frente se aleja: las dos cosas son un `scaleX` sobre la
   textura, con el pivote donde corresponde. Todo transforms por cuadro,
   lo más barato que el compositor puede hacer. Delante del frente
   viajan las CHISPAS (`chispas.tsx`), función del mismo progreso.

   CON REDUCE MOTION (animate-expo § 9: queda lo que cuenta el estado
   —opacidad y color— y se va lo que se mueve) no hay barrido ni escala:
   el relleno entero se prende con el progreso como opacidad, el label
   cruza por opacidad sin copias borrosas ni escala, y no hay chispas ni
   ráfaga. El color del label por progreso queda.

   EL LABEL tiene tres textos con una PRESENCIA cada uno (0..1); cruzar
   es llevar la del que llega a 1 y la del que se va a 0, cada una con
   su duración y su retardo (`R.cruce`): el saliente se va rápido, el
   entrante enfoca con cola. La escalera de blur está en `etiqueta.tsx`.

   El pill se ACHICA al apretar (escala .953 en la receta del clip) y
   vuelve al soltar o al completar — está medido y es la mitad del feel.

   EN MODO CLARO (`esquema`, lo decide la pantalla; recibo en `CLARO`)
   el pill sigue oscuro pero sin nada pintado en su fondo: ni brillo de
   reposo ni punta velada; el anillo es negro al 10 % y la ráfaga, del
   color del pill. Pedido del 2026-09-07, mirando el simulador en claro.

   RENDIMIENTO (2026-09-07, medido con `medidor.tsx` bajo `carga.tsx`):
   nada de lo que se ve depende del hilo de JS. El gesto, el relleno,
   las chispas, el label, la ráfaga y el REINICIO corren en UI; el
   reinicio antes era un `setTimeout` de JS y con JS ocupado llegaba
   tarde, ahora es un `withDelay` sobre un shared value. Lo único que
   cruza a JS —la háptica y el sonido— cruza en el instante justo y JS
   lo atiende cuando puede: `marcarUI()`/`marcarJS()` dejan estampas
   en los dos hilos para medir cuánto tarda.
   ═══════════════════════════════════════════════════════════════ */

const TEXTURA = {
  brillo: require('./media/brillo.png'),
  cuerpo: require('./media/cuerpo.png'),
  frente: require('./media/frente.png'),
  velo: require('./media/velo.png'),
}
const FRENTE_ANCHO = FRENTE.antes + FRENTE.despues
const VELO_ANCHO = Image.resolveAssetSource(TEXTURA.velo).width

/* EL VIDRIO, si está. `expo-glass-effect` es un módulo nativo: si el
   binario no lo linkea (un Expo Go de otra versión, un dev client viejo)
   el import tira abajo la pieza entera, así que se pide con cuidado y,
   si no está o iOS es anterior a 26, la opción `vidrio` cae a una cápsula
   translúcida plana.

   CÓMO LO LANZARÍA UNA APP SERIA (Vito, 2026-09-04: "el liquid glass
   nativo de Apple, bien hecho, no que sólo se vea así"). Lo que hace que
   el material se VEA y se SIENTA, según la guía de Apple para Liquid
   Glass (HIG › Materials, WWDC25 "Meet Liquid Glass"):
     1. `regular` sin tinte: el vidrio de los controles, el que refracta.
        Un tinte prominente lo vuelve casi opaco y esconde el material.
     2. `isInteractive`: el material responde al dedo con su propio
        abultado y su brillo. Por eso el pill de vidrio NO usa la escala
        del press medida en Opal: sería feedback doble.
     3. Contenido que pasa por DEBAJO: el vidrio sólo se lee cuando hay
        algo detrás que refractar. El fondo `accion` scrollea debajo del
        botón, que flota (ver pantalla.tsx).
     4. Nada encima que no sea contenido: el brillo de reposo de Opal, la
        punta velada y el anillo son del pill opaco y acá no van. El
        relleno blanco del hold barre encima como siempre: es el gesto.
     5. El label sigue al esquema como todo control de vidrio: negro en
        claro, blanco en oscuro.
   Las trampas del material están en `nativo/VIDRIO.md`: no va bajo una
   opacidad animada (la escala es un transform: no molesta) y NADIE lo
   recorta, ni él ni sus ancestros. Acá el vidrio es el CONTENEDOR y el
   recorte de las texturas es su hijo: el hijo se recorta a sí mismo, el
   vidrio queda libre y con su `borderRadius` circular. */
type Vidrio = ComponentType<GlassViewProps>
const VIDRIO: { GlassView: Vidrio; disponible: boolean } | null = (() => {
  try {
    /* `require` a propósito: un `import` estático ejecuta `requireNativeViewManager` al cargar el módulo y no se puede envolver en un try. */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('expo-glass-effect') as { GlassView: Vidrio; isLiquidGlassAvailable: () => boolean }
    return { GlassView: m.GlassView, disponible: m.isLiquidGlassAvailable() }
  } catch {
    return null
  }
})()

/* TODO `withTiming` DEL BOTÓN PASA POR ACÁ, con `ReduceMotion.Never`.
   Reanimated 4.5 trae `reduceMotion: System` por defecto, y con Reduce
   Motion prendido en iOS eso SALTA AL FINAL en el primer cuadro (SOURCE:
   `react-native-reanimated/src/animation/util.ts:506`, `current =
   toValue` y `onFrame = () => true`); `withDelay` y `withSequence` se lo
   contagian a sus hijas y el delay se saltea. RUNTIME (simulador B con
   `com.apple.Accessibility ReduceMotionEnabled`, 2026-09-04, `lum.py`
   sobre 24 capturas de `auto`): el interior del pill pasaba de 64.2 a
   182.0 de luminancia media —el relleno ENTERO— en el cuadro del press
   y se quedaba clavado ahí los 2 s del hold; y los doce detentes
   hápticos disparaban juntos en ese cuadro. El progreso es el gesto, no
   un adorno: tiene que correr siempre. Reduce motion se aplica a mano,
   más abajo, sobre lo que sí es movimiento. */
const animar = (hasta: number, duracion: number, curva: Curva) => {
  'worklet'
  return withTiming(hasta, { duration: duracion, easing: curva, reduceMotion: ReduceMotion.Never })
}

/* Lo que cruza a JS, con su estampa para el medidor (no-op si no mide).
   Declaradas antes de los worklets que las llaman (trampa 13). */
const ticJS = () => {
  marcarJS('tic-js')
  void tic()
}
const alCompletarJS = () => {
  marcarJS('commit-js')
  void alCompletar()
}
const sonarJS = () => {
  marcarJS('sonido-js')
  sonar()
}

/* La forma del primer oscurecimiento del label, medida cuadro a cuadro
   (HOLD.tintaDesde..tintaHasta): mitad del camino a los 5 de 18 cuadros
   → ease-out cuadrático sobre el progreso. */
const easeOutQuad = (t: number) => {
  'worklet'
  const u = Math.min(1, Math.max(0, t))
  return 1 - (1 - u) * (1 - u)
}
const easeInOutQuad = (t: number) => {
  'worklet'
  const u = Math.min(1, Math.max(0, t))
  return u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)
}

export type Esquema = 'light' | 'dark'

type Props = {
  /** El ancho del pill, en pt. Lo calcula la pantalla: 440 − 2×29. */
  ancho: number
  /** Claro u oscuro: lo decide la pantalla (los fondos de Opal son oscuros siempre). */
  esquema?: Esquema
  /** Qué curvas y tiempos: los del clip o los de las tablas del skill (`receta.ts`). */
  receta: Receta
  /** La luz que se escapa por debajo del pill, medida en la pantalla de
      Opal. La pantalla decide si va: sólo con el fondo `opal`. */
  derrame?: boolean
  /** De qué está hecho el pill: la cápsula opaca medida, o Liquid Glass (`material.ts`). */
  material?: Material
  /** Sonda de desarrollo: `parcar=0.5` deja el botón quieto a mitad del
      hold; `parcar=commit`, terminado; `parcar=auto`, apreta solo;
      `parcar=cruce=120`, el press a los 120 ms; `parcar=cruce-commit=300`,
      300 ms después de la ráfaga; `parcar=cruce-suelta=150`, 150 ms
      después de soltar. Reproducen las curvas de la receta `clip`. */
  sonda?: string
}

export function BotonHold({ ancho, receta, sonda, derrame = false, material = 'opaco', esquema = 'dark' }: Props) {
  const reducido = useReducedMotion()
  /* El label de reposo es blanco sobre el pill opaco (RUNTIME, moda 255)
     en cualquier modo: el pill es oscuro siempre. Sobre vidrio sigue al
     esquema: en modo claro el vidrio es claro y el label arranca negro. */
  const claro = esquema === 'light'
  const esVidrio = material !== 'opaco'
  const tintaReposo = esVidrio && claro ? COLOR.tintaNegra : COLOR.texto
  /* Lo pintado en el fondo del pill (brillo de reposo, punta velada) es
     del pill opaco de Opal, oscuro sobre oscuro; en claro no va. */
  const conBrillo = material === 'opaco' && !claro
  /* La escala del press es del pill opaco: el vidrio interactivo trae su
     propia respuesta al dedo, y con reduce motion no hay escala. */
  const escalaPropia = !reducido && !esVidrio
  const R = CINEMATICA[receta]

  const progreso = useSharedValue(0)     // 0..1, el frente geométrico del relleno
  const blob = useSharedValue(0)         // opacidad del relleno (nace apagado)
  const escala = useSharedValue(1)
  const blanco = useSharedValue(0)       // el velo blanco del commit
  const pHold = useSharedValue(1)        // presencia de cada label (ver etiqueta.tsx)
  const pKeep = useSharedValue(0)
  const pListo = useSharedValue(0)
  const estallido = useSharedValue(0)    // la ráfaga, 0→1
  const terminado = useSharedValue(false)
  const sono = useSharedValue(false)     // el sonido ya salió en este hold
  const espera = useSharedValue(0)       // el reloj del reinicio, en UI

  /* El color del label sale del PROGRESO y no de un evento: así soltar a
     mitad del oscurecimiento lo revierte por la misma curva, sin estados. */
  const tinta = useDerivedValue(() => {
    const p = progreso.get()
    const t1 = easeOutQuad((p - HOLD.tintaDesde) / (HOLD.tintaHasta - HOLD.tintaDesde))
    const oscuro = interpolateColor(t1, [0, 1], [tintaReposo, COLOR.tintaOscura])
    const t2 = Math.min(1, Math.max(0, (p - HOLD.negroEn) / 0.012))
    return t2 <= 0 ? oscuro : interpolateColor(t2, [0, 1], [oscuro, COLOR.tintaNegra])
  })

  /* El sonido del commit se precalienta al montar, para salir en el cuadro. */
  useEffect(prepararSonido, [])

  /* Cruza el label hacia `destino`: su presencia sube a 1 y la de los
     otros baja a 0, cada una desde donde esté y con la duración
     proporcional a lo que le falta — un cruce interrumpido (soltar
     mientras todavía aparece "Keep Holding...") sigue sin saltos. */
  const cruzar = (destino: number, t: Tiempos) => {
    'worklet'
    const todas = [pHold, pKeep, pListo]
    for (let k = 0; k < todas.length; k++) {
      const q = todas[k]!
      cancelAnimation(q)
      const v = q.get()
      if (k === destino) {
        if (v < 1) q.set(withDelay(t.retardoEntrada, animar(1, t.entrada * (1 - v), t.entradaLineal ? Easing.linear : R.easeOut), ReduceMotion.Never))
      } else if (v > 0) {
        q.set(withDelay(t.retardoSalida, animar(0, t.salida * v, R.easeOut), ReduceMotion.Never))
      }
    }
  }

  /* `reiniciar` va ANTES de `completar`, que lo llama desde el callback
     de su `withTiming`: un worklet captura su closure al crearse, y una
     `const` de más abajo todavía no existe en ese momento (RUNTIME,
     2026-09-07: "undefined is not a function" en el reinicio, con el
     bloque en el orden inverso). */
  /* EL REINICIO ES UN FUNDIDO, NO UN BARRIDO (Vito, 2026-09-04: "que
     cuando vuelve al estado inicial la transición sea clean, hoy es
     malísima"). Antes el progreso volvía a 0 en 300 ms: el relleno se
     veía retroceder entero mientras el velo blanco se apagaba y el label
     cruzaba, todo junto. Ahora, como con reduce motion, sólo cambia la
     opacidad, en dos fases: (1) el velo blanco y el relleno se apagan y
     "✓ Order Placed" se va; (2) con el relleno ya invisible, la
     geometría vuelve al reposo de golpe (no se ve) y "Hold to Buy"
     entra blanco, porque el color del label sale del progreso y el
     progreso ya está en 0. `terminado` se suelta recién en la fase 2:
     un toque durante el fundido no hace nada. */
  const reiniciar = () => {
    'worklet'
    marcarUI('reinicio-ui')
    cancelAnimation(progreso)
    cancelAnimation(blob)
    cancelAnimation(blanco)
    cancelAnimation(pListo)
    escala.set(1)
    estallido.set(0)
    pListo.set(animar(0, R.cruce.reinicio.salida, R.easeOut))
    blanco.set(animar(0, R.reinicio, R.easeOut))
    blob.set(
      withTiming(0, { duration: R.reinicio, easing: R.easeOut, reduceMotion: ReduceMotion.Never }, (termino) => {
        'worklet'
        if (!termino) return
        progreso.set(0)
        terminado.set(false)
        cruzar(L_HOLD, R.cruce.reinicio)
      }),
    )
  }
  const apretar = () => {
    'worklet'
    if (terminado.get()) return
    cancelAnimation(progreso)
    cancelAnimation(blob)
    cancelAnimation(escala)
    /* Desde donde esté: si se vuelve a apretar durante la retirada, el
       relleno sigue desde ahí y llega a 1 justo cuando el LongPress
       cumple su `minDuration` — un solo reloj para las dos cosas. */
    sono.set(false)
    marcarUI('press-ui')
    progreso.set(animar(1, HOLD.duracion, Easing.linear))
    blob.set(animar(1, R.encendido.duracion, R.encendido.curva))
    /* Con reduce motion el pill no se achica: la escala es movimiento. */
    if (escalaPropia) escala.set(animar(R.press.escala, R.press.duracion, R.easeOut))
    cruzar(L_KEEP, R.cruce.press)
  }

  const soltar = () => {
    'worklet'
    if (terminado.get()) return
    cancelAnimation(progreso)
    cancelAnimation(blob)
    cancelAnimation(escala)
    progreso.set(animar(0, R.retirada.duracion, R.easeOut))
    blob.set(animar(0, R.retirada.fundido, R.retirada.curvaFundido))
    if (escalaPropia) escala.set(animar(1, R.press.duracion, R.easeOut))
    /* El label vuelve DESPUÉS de que el brillo empezó a retirarse: los
       retardos están medidos (release en f13, saliente desde f17–18,
       entrante desde f22). */
    cruzar(L_HOLD, R.cruce.suelta)
  }

  const completar = () => {
    'worklet'
    if (terminado.get()) return
    terminado.set(true)
    cancelAnimation(progreso)
    cancelAnimation(escala)
    progreso.set(1)
    blob.set(1)
    if (!reducido) {
      /* El frente termina de llegar a la punta derecha mientras blanquea
         (COMMIT.desliz): el progreso pasa de 1 y `frenteEn` lo lleva al 101 %. */
      progreso.set(withDelay(R.desliz.retardo, animar(1 + COMMIT.desliz, R.desliz.duracion, R.easeOut), ReduceMotion.Never))
      /* Un salto (`saltoCommit`) en un cuadro y el resto con ease-out. */
      if (escalaPropia)
        escala.set(
          R.press.saltoCommit > 0
            ? withSequence(
                ReduceMotion.Never,
                animar(R.press.escala + (1 - R.press.escala) * R.press.saltoCommit, 16, Easing.linear),
                animar(1, R.press.duracionCommit, R.easeOut),
              )
            : animar(1, R.press.duracionCommit, R.easeOut),
        )
      estallido.set(0)
      estallido.set(animar(1, PARTICULAS.duracionVida, Easing.linear))
    }
    blanco.set(animar(COMMIT.veloBlanco, R.blanqueo, R.easeOut))
    cruzar(L_LISTO, R.cruce.commit)
    marcarUI('commit-ui')
    scheduleOnRN(alCompletarJS)
    /* EL REINICIO ES DEL TALLER, no de la referencia: el clip termina en
       "✓ Committed" y no muestra qué pasa después. Acá, a los 5 s de
       completar, el botón vuelve al reposo con el mismo cruce, para poder
       probarlo seguido sin salir y volver a entrar a la pieza. El reloj
       corre en UI: un `withDelay` sobre `espera`. Antes era un
       `setTimeout` en JS ("5 s no piden precisión de cuadro"), y no la
       piden, pero un timer de JS espera a que JS esté libre: con el hilo
       ocupado (carga.tsx) el reinicio llegaba tarde. Acá llega a los
       5000 ms con JS haciendo lo que sea. */
    espera.set(0)
    espera.set(
      withDelay(
        REINICIO.espera,
        withTiming(1, { duration: 1, reduceMotion: ReduceMotion.Never }, (fin) => {
          'worklet'
          if (fin) reiniciar()
        }),
        ReduceMotion.Never,
      ),
    )
  }

  /* Los detentes hápticos: la comparación corre en UI cada cuadro y la
     llamada a JS ocurre doce veces por hold, sólo cuando el progreso
     SUBE y cruza un umbral. Soltar no hace tic. */
  useAnimatedReaction(
    () => progreso.get(),
    (p, anterior) => {
      if (anterior === null || p <= anterior) return
      for (let i = 0; i < DETENTES.length; i++) {
        const d = DETENTES[i]!
        if (anterior < d && p >= d) {
          marcarUI('tic-ui')
          scheduleOnRN(ticJS)
        }
      }
      /* El sonido, ADELANTO_MS antes del final: sale del mismo reloj que
         el relleno, una sola vez por hold (ver sonido.ts). */
      if (!sono.get() && p >= 1 - ADELANTO_MS / HOLD.duracion) {
        sono.set(true)
        marcarUI('sonido-ui')
        scheduleOnRN(sonarJS)
      }
    },
  )

  const gesto = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(HOLD.duracion)
        .maxDistance(HOLD.maxDistancia)
        .onBegin(apretar)
        .onStart(completar)
        .onFinalize((_e, exito) => {
          if (!exito) soltar()
        }),
    /* Los tres worklets se recrean en cada render (son closures del
       componente), así que el gesto se rearma con ellos. Renders hay
       uno por receta elegida. */
    [apretar, completar, soltar],
  )

  /* La sonda: un estado fijo por recarga, deterministico. Reproduce las
     curvas de la receta `clip` (las constantes de medidas.ts). */
  useEffect(() => {
    const parquear = (hold: number, keep: number, listo: number) => {
      'worklet'
      pHold.set(hold)
      pKeep.set(keep)
      pListo.set(listo)
    }
    if (!sonda) {
      /* Sin sonda, el reposo: así `sonda.ts` vuelto a `undefined` al final
         de una tanda de capturas deja la pieza limpia sin relanzar. Antes
         quedaba parqueada en la última sonda: un `commit` dejaba
         `terminado` en true y un `auto` posterior no apretaba. */
      scheduleOnUI(() => {
        'worklet'
        const todos = [progreso, blob, escala, blanco, estallido, pHold, pKeep, pListo, espera]
        for (let k = 0; k < todos.length; k++) cancelAnimation(todos[k]!)
        terminado.set(false)
        progreso.set(0)
        blob.set(0)
        escala.set(1)
        blanco.set(0)
        estallido.set(0)
        parquear(1, 0, 0)
      })
      return
    }
    if (sonda === 'commit' || sonda.startsWith('rafaga')) {
      /* `rafaga=0.12` deja la ráfaga quieta a esa fracción de su vida. */
      const t = sonda === 'commit' ? 1 : Number(sonda.split('=')[1] ?? 0.1)
      scheduleOnUI(() => {
        'worklet'
        terminado.set(true)
        progreso.set(sonda === 'commit' ? 1 + COMMIT.desliz : 1)
        blob.set(1)
        escala.set(1)
        parquear(0, sonda === 'commit' ? 0 : 1, sonda === 'commit' ? 1 : 0)
        blanco.set(sonda === 'commit' ? COMMIT.veloBlanco : COMMIT.veloBlanco * t * 3)
        estallido.set(t)
      })
      return
    }
    if (sonda.startsWith('cruce')) {
      /* `cruce=120`: el press, 120 ms después del touch — cada valor donde
         lo tendría la animación real (mismas curvas y retardos que
         `apretar`); `cruce-commit=300`: 300 ms después de la ráfaga, con
         el label, el blanqueo y las partículas donde les toca. Sirve para
         comparar con el cuadro del clip del mismo instante. */
      const ms = Number(sonda.split('=')[1] ?? 0)
      const alCommit = sonda.startsWith('cruce-commit')
      const alSoltar = sonda.startsWith('cruce-suelta')
      const tramo = (t: number, retardo: number, duracion: number, lineal?: boolean) => {
        'worklet'
        const u = Math.min(1, Math.max(0, (t - retardo) / duracion))
        return lineal ? u : easeOutQuad(u)
      }
      scheduleOnUI(() => {
        'worklet'
        terminado.set(alCommit)
        if (alCommit) {
          const c = CRUCE.commit
          progreso.set(1 + COMMIT.desliz * tramo(ms, COMMIT.deslizRetardo, COMMIT.deslizDuracion))
          blob.set(1)
          escala.set(PRESS.escala + (1 - PRESS.escala) * (ms < 16 ? 0 : PRESS.saltoCommit + (1 - PRESS.saltoCommit) * tramo(ms, 16, PRESS.duracionCommit)))
          blanco.set(COMMIT.veloBlanco * tramo(ms, 0, COMMIT.blanqueo))
          estallido.set(Math.min(0.999, ms / PARTICULAS.duracionVida))
          parquear(0, 1 - tramo(ms, c.retardoSalida, c.salida), tramo(ms, c.retardoEntrada, c.entrada, c.entradaLineal))
        } else if (alSoltar) {
          /* `cruce-suelta=150`: 150 ms después de soltar con el frente al
             10 % (donde lo suelta el clip: en f13 el 50 % del frente está
             al 13.5 %), con las mismas curvas que `soltar`. */
          const c = CRUCE.suelta
          const desde = 0.1
          /* el clip suelta con el encendido a medio camino: el pico en f13
             es 172, que es el 65 % del relleno prendido */
          const blobAlSoltar = 0.68
          progreso.set(desde * (1 - tramo(ms, 0, HOLD.retirada)))
          blob.set(blobAlSoltar * Math.pow(2, (-10 * Math.min(1, ms / HOLD.fundidoRetirada))))
          escala.set(PRESS.escala + (1 - PRESS.escala) * tramo(ms, 0, PRESS.duracion))
          blanco.set(0)
          estallido.set(0)
          parquear(tramo(ms, c.retardoEntrada, c.entrada, c.entradaLineal), 1 - tramo(ms, c.retardoSalida, c.salida), 0)
        } else {
          const c = CRUCE.press
          progreso.set(ms / HOLD.duracion)
          blob.set(easeInOutQuad(ms / HOLD.encendido))
          escala.set(1 - (1 - PRESS.escala) * tramo(ms, 0, PRESS.duracion))
          blanco.set(0)
          estallido.set(0)
          parquear(1 - tramo(ms, c.retardoSalida, c.salida), tramo(ms, c.retardoEntrada, c.entrada), 0)
        }
      })
      return
    }
    if (sonda === 'auto' || sonda === 'auto-suelta') {
      const t1 = setTimeout(() => scheduleOnUI(apretar), 700)
      const t2 = setTimeout(
        () => scheduleOnUI(sonda === 'auto' ? completar : soltar),
        700 + (sonda === 'auto' ? HOLD.duracion : 400),
      )
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
    const p = Number(sonda)
    if (Number.isFinite(p)) {
      scheduleOnUI(() => {
        'worklet'
        terminado.set(false)
        blanco.set(0)
        estallido.set(0)
        progreso.set(p)
        blob.set(p > 0 ? 1 : 0)
        escala.set(p > 0 ? PRESS.escala : 1)
        parquear(p > 0 ? 0 : 1, p > 0 ? 1 : 0, 0)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sonda])

  const estiloEscala = useAnimatedStyle(() => ({ transform: [{ scale: escalaPropia ? escala.get() : 1 }] }))
  /* El contenedor del relleno lleva el borde geométrico a `frenteEn(p)`:
     su borde está `ancho` pt adentro del contenedor (cuerpo + 83 del
     frente), así que translateX = frenteEn(p) − ancho.

     CON REDUCE MOTION NO HAY BARRIDO: el relleno queda entero (el borde
     geométrico donde termina al completar, 101 %) y su OPACIDAD es el
     progreso — el mismo reloj, contado con luz en vez de con posición. */
  const estiloRelleno = useAnimatedStyle(() => {
    const p = progreso.get()
    return reducido
      ? { opacity: blob.get() * Math.min(1, p), transform: [{ translateX: frenteEn(1 + COMMIT.desliz, ancho) - ancho }] }
      : { opacity: blob.get(), transform: [{ translateX: frenteEn(p, ancho) - ancho }] }
  })
  /* El frente se ensancha con el progreso: escala en x alrededor del
     borde geométrico (a FRENTE.antes de su borde izquierdo). RN escala
     alrededor del centro de la vista, así que el pivote se corre con un
     translate previo de (pivote − centro)·(1 − s). */
  const estiloFrente = useAnimatedStyle(() => {
    const p = reducido ? 1 : progreso.get()
    const s = FRENTE.escala.desde + (FRENTE.escala.hasta - FRENTE.escala.desde) * p
    return { transform: [{ translateX: (FRENTE.antes - FRENTE_ANCHO / 2) * (1 - s) }, { scaleX: s }] }
  })
  /* Y el cuerpo se corre para seguir pegado al frente escalado: su borde
     derecho tiene que quedar donde el frente arranca (a 83·s del borde). */
  const estiloCuerpo = useAnimatedStyle(() => {
    const p = reducido ? 1 : progreso.get()
    const s = FRENTE.escala.desde + (FRENTE.escala.hasta - FRENTE.escala.desde) * p
    return { transform: [{ translateX: FRENTE.antes * (1 - s) }] }
  })
  /* El velo de la punta se ensancha desde la punta del pill (pivote en su
     borde izquierdo) y se prende con el blob (con reduce motion, con el
     relleno entero: la misma opacidad que él). */
  const estiloVelo = useAnimatedStyle(() => {
    const p = reducido ? 1 : progreso.get()
    const s = VELO.escala.desde + (VELO.escala.hasta - VELO.escala.desde) * p
    const opacity = reducido ? blob.get() * Math.min(1, progreso.get()) : blob.get()
    return { opacity, transform: [{ translateX: -(VELO_ANCHO / 2) * (1 - s) }, { scaleX: s }] }
  })
  const estiloBlanco = useAnimatedStyle(() => ({ opacity: blanco.get() }))

  return (
    <View style={{ width: ancho, height: PILL.alto }}>
      <GestureDetector gesture={gesto}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={LABEL.reposo}
          accessibilityHint="Hold for two seconds to place the order"
          style={[css.pill, estiloEscala]}
        >
          {/* El derrame: la luz que se escapa por DEBAJO del pill en la
              pantalla de Opal, una franja que asoma 18 pt con su sombra
              (recibo en DERRAME). Sobre un fondo neutro se lee como una
              caja detrás del botón, así que sólo va con el fondo `opal`
              (Vito, 2026-09-04, mirándolo en el teléfono: "hay algo
              detrás del botón, sacalo"). */}
          {derrame && <View style={css.derrame} />}
          <Capsula material={material}>
            {conBrillo && <Image source={TEXTURA.brillo} resizeMode="stretch" style={css.lleno} />}
            {/* `needsOffscreenAlphaCompositing`: Android compone los hijos de
                una vista con opacidad UNO POR UNO, así que durante el
                fundido del reinicio el punto de solape entre cuerpo y
                frente se veía como una línea más clara (RUNTIME, emulador,
                `cmp/android-prod-tira.png`); con la bandera, el grupo se
                dibuja aparte y se funde entero. iOS ya lo hace solo
                (`allowsGroupOpacity`). Sólo cuesta mientras hay opacidad. */}
            <Animated.View needsOffscreenAlphaCompositing style={[css.relleno, { width: ancho + FRENTE.despues }, estiloRelleno]}>
              <Animated.Image source={TEXTURA.cuerpo} resizeMode="stretch" style={[{ width: ancho - FRENTE.antes + 1, height: PILL.alto }, estiloCuerpo]} />
              {/* Un punto de solape: dos imágenes pegadas borde con borde
                  dejan una costura de 1 px cuando el translate cae entre
                  píxeles (se vio en la ampliación). El frente arranca
                  opaco, así que el solape no se ve. */}
              <Animated.Image source={TEXTURA.frente} style={[{ width: FRENTE_ANCHO, height: PILL.alto, marginLeft: -1 }, estiloFrente]} />
            </Animated.View>
            {conBrillo && <Animated.Image source={TEXTURA.velo} style={[css.velo, estiloVelo]} />}
            {/* Las chispas van sobre el relleno y bajo el velo blanco: al
                completar, el blanco las tapa. */}
            {!reducido && <Chispas ancho={ancho} progreso={progreso} blob={blob} />}
            <Animated.View style={[css.lleno, css.blanco, estiloBlanco]} />
            {material === 'opaco' && <View pointerEvents="none" style={[css.lleno, css.anillo, claro && css.anilloClaro]} />}
          </Capsula>
          <Etiqueta tinta={tinta} presencia={[pHold, pKeep, pListo]} sinBlur={reducido} escalaEntrada={R.escalaEntrada} />
        </Animated.View>
      </GestureDetector>
      {!reducido && <Particulas ancho={ancho} estallido={estallido} color={claro ? CLARO.particula : undefined} />}
    </View>
  )
}

/* La cápsula: opaca, es la vista que recorta las texturas con el color
   del pill medido. De vidrio, es el `GlassView` (libre, interactivo, con
   su radio circular) y ADENTRO la vista que recorta, transparente. */
function Capsula({ material, children }: { material: Material; children: ReactNode }) {
  if (material === 'opaco') return <View style={css.recorte}>{children}</View>
  const recorte = <View style={[css.recorte, css.recorteVidrio]}>{children}</View>
  if (VIDRIO && VIDRIO.disponible) {
    return (
      <VIDRIO.GlassView glassEffectStyle="regular" isInteractive style={css.vidrio}>
        {recorte}
      </VIDRIO.GlassView>
    )
  }
  return <View style={[css.vidrio, css.vidrioCaida]}>{recorte}</View>
}

const css = StyleSheet.create({
  pill: { width: '100%', height: PILL.alto },
  recorte: {
    ...StyleSheet.absoluteFill,
    borderRadius: PILL.alto / 2,
    backgroundColor: COLOR.pill,
    overflow: 'hidden',
  },
  recorteVidrio: { backgroundColor: 'transparent' },
  /* La cápsula de vidrio: mismo radio circular que el pill medido (no
     `continuous`: la cápsula del clip es circular), sin `overflow`. */
  vidrio: { ...StyleSheet.absoluteFill, borderRadius: PILL.alto / 2 },
  /* SUPUESTO · la caída sin Liquid Glass: una cápsula translúcida plana. */
  vidrioCaida: { backgroundColor: 'rgba(128,128,128,0.25)' },
  lleno: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  relleno: { position: 'absolute', top: 0, left: 0, height: PILL.alto, flexDirection: 'row' },
  velo: { position: 'absolute', top: 0, left: 0, width: VELO_ANCHO, height: PILL.alto },
  blanco: { backgroundColor: COLOR.committed },
  anillo: { borderRadius: PILL.alto / 2, borderWidth: PILL.anillo, borderColor: COLOR.anillo },
  anilloClaro: { borderColor: CLARO.anillo },
  derrame: {
    position: 'absolute',
    left: '50%',
    marginLeft: -DERRAME.ancho / 2,
    width: DERRAME.ancho,
    top: PILL.alto - 8,
    height: 8 + DERRAME.asoma,
    borderRadius: 12,
    backgroundColor: DERRAME.color,
    boxShadow: DERRAME.sombra,
  },
})
