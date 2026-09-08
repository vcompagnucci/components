import { Easing, type EasingFunction, type EasingFunctionFactory, ReduceMotion, withSpring, withTiming } from 'react-native-reanimated'

import { COMMIT, CRUCE, HOLD, PRESS, REINICIO } from './medidas'

/* LA RECETA — las curvas y los tiempos del botón, en dos versiones.
 *
 * Vito pidió (2026-09-04) probar el botón siguiendo las tablas del skill
 * `animate-expo` SIN perder lo medido. Así que, como el fondo, la
 * cinemática es una VARIANTE: con `'elegir'` la pieza muestra un
 * selector para pasar de una a otra en vivo, en el simulador y en el
 * teléfono.
 *
 *   'clip'   lo medido cuadro a cuadro en el clip de Opal; cada valor
 *            con su recibo en `medidas.ts`. Es la versión fiel. Todo por
 *            tiempo y curva: Opal no rebota.
 *   'skill'  las tablas de animate-expo a la letra, y desde el 2026-09-07
 *            SPRINGS donde hubo un dedo (§ 5: "If a finger was involved,
 *            use a spring"), con los DOS PARÁMETROS DE APPLE —duración
 *            perceptual y rebote— que son los de `Spring(duration:bounce:)`
 *            de SwiftUI (WWDC23 "Animate with springs") y los que
 *            Reanimated toma como `duration` + `dampingRatio`
 *            (dampingRatio = 1 − rebote). Rebote 0 en todas: es el
 *            `.smooth` de Apple, y el skill lo dice igual, "bounce only
 *            when the gesture carried momentum"; un hold no lo tiene.
 *            Lo que no tiene dedo (un label que cruza, el velo que
 *            blanquea, el fundido del reinicio) sigue por tiempo con los
 *            beziers de la tabla. Y el tilde de "Order Placed" entra
 *            con sus propias capas, con la técnica de ícono contextual
 *            de better-ui, sobre el mismo reloj y la misma escalera de
 *            opacidad que el texto: van de la mano en cada cuadro.
 *
 * Lo que NO cambia entre recetas: el relleno lineal (es el gesto, no una
 * animación: "constant motion → linear" en las dos), el color del label
 * por progreso, la geometría del frente, la háptica, y las chispas y la
 * ráfaga (son el presupuesto de deleite del skill y están medidas del
 * clip).
 *
 * Las sondas de estado fijo (`sonda.ts`) reproducen las curvas de 'clip';
 * `auto` anda con cualquiera.
 *
 * `RECETA` volvió a 'clip' el 2026-09-07, el mismo día en que pasó a
 * 'skill' ("cumplir todo lo que está en amarillo"): con los springs
 * puesta, Vito la vio distinta "sobre todo el final" —el pill vuelve con
 * un spring de 400 ms en vez del salto medido y el tilde entra solo— y
 * pidió dejarla como antes. RUNTIME: con 'clip' activa, las cuatro sondas
 * de estado (reposo, 0.5, commit, cruce-commit=150) dan PSNR infinito
 * contra las capturas de esa mañana, anteriores a la reescritura:
 * píxel por píxel lo mismo. La 'skill' queda entera a un `?receta=skill`;
 * el selector sigue apagado desde el 2026-09-04.
 */
export type Curva = EasingFunction | EasingFunctionFactory

/* UN MOVIMIENTO es por tiempo con curva, o un spring con duración y rebote. */
export type Movimiento =
  | { tipo: 'tiempo'; duracion: number; curva: Curva }
  | { tipo: 'spring'; duracion: number; rebote: number; sinSobrepaso?: boolean }

/* Los dos constructores llevan 'worklet': el botón los llama desde el hilo
   de UI (RUNTIME, 2026-09-07: "Tried to synchronously call a Remote
   Function. Called 'tiempo' on the UI Runtime" sin la directiva). */
export const tiempo = (duracion: number, curva: Curva): Movimiento => {
  'worklet'
  return { tipo: 'tiempo', duracion, curva }
}
export const spring = (duracion: number, rebote: number, sinSobrepaso = false): Movimiento => {
  'worklet'
  return { tipo: 'spring', duracion, rebote, sinSobrepaso }
}

type AlTerminar = (terminado?: boolean) => void

/* TODO MOVIMIENTO DEL BOTÓN PASA POR ACÁ, con `ReduceMotion.Never`:
   Reanimated 4.5 trae `reduceMotion: System` por defecto y con Reduce
   Motion prendido salta al final en el primer cuadro (trampa 19 del
   AGENTS); reduce motion se aplica a mano en el botón. */
export const mover = (hasta: number, m: Movimiento, alTerminar?: AlTerminar) => {
  'worklet'
  if (m.tipo === 'spring') {
    return withSpring(
      hasta,
      { duration: m.duracion, dampingRatio: 1 - m.rebote, overshootClamping: m.sinSobrepaso, reduceMotion: ReduceMotion.Never },
      alTerminar,
    )
  }
  return withTiming(hasta, { duration: m.duracion, easing: m.curva, reduceMotion: ReduceMotion.Never }, alTerminar)
}

export type Tiempos = {
  entrada: number
  salida: number
  retardoEntrada: number
  retardoSalida: number
  /** la presencia del entrante sube lineal (la escalera de blur pone la curva) */
  entradaLineal?: boolean
}

export type Cinematica = {
  /** la curva de los cruces del label (siempre por tiempo: no hay dedo en un texto) */
  easeOut: Curva
  press: {
    escala: number
    /** el pill achicándose bajo el dedo */
    entrada: Movimiento
    /** volviendo al soltar */
    salida: Movimiento
    /** volviendo al completar */
    commit: Movimiento
    /** cuánto de la vuelta al completar pasa en el primer cuadro (lectura del clip) */
    saltoCommit: number
  }
  /** el relleno prendiéndose al apretar */
  encendido: Movimiento
  /** al soltar: el frente retrocede (`progreso`) y el relleno se apaga (`fundido`) */
  retirada: { progreso: Movimiento; fundido: Movimiento }
  cruce: { press: Tiempos; suelta: Tiempos; commit: Tiempos; reinicio: Tiempos }
  /** el frente terminando de llegar a la punta derecha después de la ráfaga */
  desliz: { retardo: number; movimiento: Movimiento }
  /** el velo blanco del commit */
  blanqueo: Movimiento
  /** el fundido del reinicio del taller */
  reinicio: Movimiento
  /** desde qué escala entra "✓ Order Placed" */
  escalaEntrada: number
  /** el tilde: 'medido' entra pegado al texto (blur-replace, como en el clip);
      'contextual' entra con sus capas, opacidad, escala y blur (better-ui),
      sobre la misma presencia y la misma escalera que el texto */
  tilde: 'medido' | 'contextual'
}

export type Receta = 'clip' | 'skill'
export const RECETAS: readonly Receta[] = ['skill', 'clip']
export const RECETA: Receta | 'elegir' = 'clip'

/* RUNTIME · LA CURVA DE LA ESCALA ES UN EASE-OUT CUADRÁTICO, no el bezier
   fuerte del skill (clip, borde izquierdo del pill al apretar): 16 % a
   1 cuadro, 52 % a 4, 80 % a 8, 96 % a 13 de 14 — easeOutQuad sobre
   250 ms da 47 / 78 / 98 en esos puntos. Con bezier(.23,1,.32,1) la
   grabación del taller cerraba el 92 % en 100 ms, el doble de rápido. */
const OUT_QUAD = Easing.out(Easing.quad)
const CLIP: Cinematica = {
  easeOut: OUT_QUAD,
  press: {
    escala: PRESS.escala,
    entrada: tiempo(PRESS.duracion, OUT_QUAD),
    salida: tiempo(PRESS.duracion, OUT_QUAD),
    commit: tiempo(PRESS.duracionCommit, OUT_QUAD),
    saltoCommit: PRESS.saltoCommit,
  },
  /* RUNTIME · el encendido arranca lento (recibo en HOLD.encendido). */
  encendido: tiempo(HOLD.encendido, Easing.inOut(Easing.quad)),
  /* RUNTIME · 1 − 2^(−10t): el apagado exponencial de la retirada, τ = duración/6.93 (recibo en HOLD). */
  retirada: { progreso: tiempo(HOLD.retirada, OUT_QUAD), fundido: tiempo(HOLD.fundidoRetirada, Easing.out(Easing.exp)) },
  cruce: CRUCE,
  desliz: { retardo: COMMIT.deslizRetardo, movimiento: tiempo(COMMIT.deslizDuracion, OUT_QUAD) },
  blanqueo: tiempo(COMMIT.blanqueo, OUT_QUAD),
  reinicio: tiempo(REINICIO.fundido, OUT_QUAD),
  escalaEntrada: COMMIT.escalaEntrada,
  tilde: 'medido',
}

/* LOS TIEMPOS DEL TEXTO Y DEL FINAL SON LOS MEDIDOS, no los de la tabla.
   La primera versión de esta receta (2026-09-04) tomaba § 5 a la letra:
   cruces de 200/150 ms sin retardos, blanqueo 250, desliz 200, fundido
   200. Puesta como receta activa, Vito (2026-09-07): "el texto cambia
   muy abrupto y la animación del final es muy rápida". La referencia es
   piso: los cruces del label, el velo blanco, el deslizamiento del
   frente y el fundido del reinicio vuelven a los valores del clip
   (`CRUCE`, `COMMIT`, `REINICIO`), que son los que se habían aprobado.
   Lo que esta receta agrega es lo que sí pidió: springs donde hay dedo y
   el tilde contextual. Los de § 5 quedan acá por si vuelven a probarse:
   { entrada: 200, salida: 150, retardoEntrada: 0, retardoSalida: 0 }. */

/* SOURCE · § 5, tabla de springs: "Default settle, no overshoot:
   { duration: 400, dampingRatio: 1 }"; "Press feedback: 100–150ms" (§ 5,
   duraciones) con "`scale: 0.97`" (§ 7). Rebote 0 = dampingRatio 1 = el
   `.smooth` de Apple. `sinSobrepaso` donde el valor no puede pasarse de
   un borde (§ 5: "Must not pass a hard edge → overshootClamping"): el
   progreso del relleno no puede bajar de 0. */
const SKILL: Cinematica = {
  /* la curva de los cruces del label: la medida (con el bezier fuerte del
     skill el entrante cerraba el doble de rápido) */
  easeOut: OUT_QUAD,
  press: {
    escala: 0.97,
    entrada: spring(150, 0),
    salida: spring(400, 0),
    /* Al completar vuelve igual y sin salto: el salto del 25 % es una
       lectura del clip, no está en ninguna tabla. */
    commit: spring(400, 0),
    saltoCommit: 0,
  },
  /* El relleno prendiéndose es una opacidad, no un dedo: por tiempo, con
     el encendido medido (recibo en HOLD.encendido). */
  encendido: tiempo(HOLD.encendido, Easing.inOut(Easing.quad)),
  /* Al soltar, el frente vuelve con el spring de "snap back" (§ 5), clavado
     en 0; el relleno se apaga por tiempo con la exponencial medida. */
  retirada: { progreso: spring(400, 0, true), fundido: tiempo(HOLD.fundidoRetirada, Easing.out(Easing.exp)) },
  cruce: CRUCE,
  desliz: { retardo: COMMIT.deslizRetardo, movimiento: tiempo(COMMIT.deslizDuracion, OUT_QUAD) },
  blanqueo: tiempo(COMMIT.blanqueo, OUT_QUAD),
  reinicio: tiempo(REINICIO.fundido, OUT_QUAD),
  escalaEntrada: COMMIT.escalaEntrada,
  /* SOURCE · better-ui "Contextual icon animations": "scale 0.25 to 1,
     opacity 0 to 1, blur 4px to 0px". Las tres cosas en `etiqueta.tsx`,
     sobre la presencia del texto y su misma escalera de opacidad, no
     sobre un spring propio de 300 ms ni sobre una rampa distinta: el
     tilde y "Order Placed" van de la mano (Vito, 2026-09-07). */
  tilde: 'contextual',
}

export const CINEMATICA: Record<Receta, Cinematica> = { clip: CLIP, skill: SKILL }
