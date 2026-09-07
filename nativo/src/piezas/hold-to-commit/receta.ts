import { Easing, type EasingFunction, type EasingFunctionFactory } from 'react-native-reanimated'

import { COMMIT, CRUCE, HOLD, PRESS, REINICIO } from './medidas'

/* LA RECETA — las curvas y los tiempos del botón, en dos versiones.
 *
 * Vito pidió (2026-09-04) probar el botón siguiendo las tablas del skill
 * `animate-expo` SIN perder lo medido. Así que, como el fondo, la
 * cinemática es una VARIANTE: con `'elegir'` la pieza muestra un
 * selector para pasar de una a otra en vivo, en el simulador y en el
 * teléfono. Cuando haya ganadora se escribe acá y el selector se va.
 *
 *   'clip'   lo medido cuadro a cuadro en el clip de Opal; cada valor
 *            con su recibo en `medidas.ts`. Es la versión fiel.
 *   'skill'  las tablas de animate-expo a la letra: los dos beziers,
 *            press de .97 en 120 ms, todo bajo 300 ms, entradas y
 *            salidas con ease-out, sin retardos ni saltos. Cada valor
 *            cita la sección del skill de la que sale.
 *
 * Lo que NO cambia entre recetas: el relleno lineal de 2 s (es el
 * gesto, no una animación: "constant motion → linear" en las dos), el
 * color del label por progreso, la geometría del frente, la háptica, y
 * las chispas y la ráfaga (son el presupuesto de deleite del skill y
 * están medidas del clip).
 *
 * Las sondas (`sonda.ts`) reproducen las curvas de 'clip': con 'skill'
 * puesta no miden nada.
 *
 * El selector está APAGADO desde el 2026-09-04 (`'clip'`): Vito lo sacó
 * de la pantalla al verla en el teléfono. Para probar `skill`, poner
 * `'elegir'` acá, o abrir la pieza con `?receta=skill`.
 */
export type Curva = EasingFunction | EasingFunctionFactory

export type Tiempos = {
  entrada: number
  salida: number
  retardoEntrada: number
  retardoSalida: number
  /** la presencia del entrante sube lineal (la escalera de blur pone la curva) */
  entradaLineal?: boolean
}

export type Cinematica = {
  /** la curva de todo lo que entra o sale */
  easeOut: Curva
  /** la curva de lo que cambia estando en pantalla */
  easeInOut: Curva
  press: { escala: number; duracion: number; duracionCommit: number; saltoCommit: number }
  /** el relleno prendiéndose al apretar */
  encendido: { duracion: number; curva: Curva }
  /** al soltar: el frente retrocede (`duracion`) y el relleno se apaga (`fundido`) */
  retirada: { duracion: number; fundido: number; curvaFundido: Curva }
  cruce: { press: Tiempos; suelta: Tiempos; commit: Tiempos; reinicio: Tiempos }
  /** el frente terminando de llegar a la punta derecha después de la ráfaga */
  desliz: { retardo: number; duracion: number }
  /** el velo blanco del commit */
  blanqueo: number
  /** el fundido del reinicio del taller */
  reinicio: number
  /** desde qué escala entra "✓ Committed" */
  escalaEntrada: number
}

export type Receta = 'clip' | 'skill'
export const RECETAS: readonly Receta[] = ['clip', 'skill']
export const RECETA: Receta | 'elegir' = 'clip'

/* RUNTIME · LA CURVA DE LA ESCALA ES UN EASE-OUT CUADRÁTICO, no el bezier
   fuerte del skill (clip, borde izquierdo del pill al apretar): 16 % a
   1 cuadro, 52 % a 4, 80 % a 8, 96 % a 13 de 14 — easeOutQuad sobre
   250 ms da 47 / 78 / 98 en esos puntos. Con bezier(.23,1,.32,1) la
   grabación del taller cerraba el 92 % en 100 ms, el doble de rápido. */
const CLIP: Cinematica = {
  easeOut: Easing.out(Easing.quad),
  easeInOut: Easing.inOut(Easing.quad),
  press: PRESS,
  /* RUNTIME · el encendido arranca lento (recibo en HOLD.encendido). */
  encendido: { duracion: HOLD.encendido, curva: Easing.inOut(Easing.quad) },
  /* RUNTIME · 1 − 2^(−10t): el apagado exponencial de la retirada, τ = duración/6.93 (recibo en HOLD). */
  retirada: { duracion: HOLD.retirada, fundido: HOLD.fundidoRetirada, curvaFundido: Easing.out(Easing.exp) },
  cruce: CRUCE,
  desliz: { retardo: COMMIT.deslizRetardo, duracion: COMMIT.deslizDuracion },
  blanqueo: COMMIT.blanqueo,
  reinicio: REINICIO.fundido,
  escalaEntrada: COMMIT.escalaEntrada,
}

/* SOURCE · animate-expo § 5 "Timing or spring": `Easing.bezier(0.23, 1,
   0.32, 1)` es el "strong ease-out for UI" y `bezier(0.77, 0, 0.175, 1)`
   el de "on-screen movement". */
const SKILL_OUT = Easing.bezier(0.23, 1, 0.32, 1)
const SKILL_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1)
/* SOURCE · § 5, tabla de duración: "Toggle, chip, small state change:
   150–200ms". Un cambio de label o el relleno prendiéndose son eso: la
   entrada al techo (200) y la salida al piso (150), para que los dos
   textos se pisen lo menos posible. Sin retardos: el skill no los tiene. */
const SKILL_CRUCE: Tiempos = { entrada: 200, salida: 150, retardoEntrada: 0, retardoSalida: 0 }

const SKILL: Cinematica = {
  easeOut: SKILL_OUT,
  easeInOut: SKILL_IN_OUT,
  /* SOURCE · § 7 "Press, not hover": "`scale: 0.97` in 100–150ms";
     RECIPES § Press feedback: "120ms and a 3% scale is the ceiling".
     Al completar vuelve igual y sin salto: el salto del 25 % es una
     lectura del clip, no está en ninguna tabla. */
  press: { escala: 0.97, duracion: 120, duracionCommit: 120, saltoCommit: 0 },
  /* SOURCE · § 5: "Entering or exiting → ease-out". */
  encendido: { duracion: 200, curva: SKILL_OUT },
  retirada: { duracion: 200, fundido: 200, curvaFundido: SKILL_OUT },
  cruce: { press: SKILL_CRUCE, suelta: SKILL_CRUCE, commit: SKILL_CRUCE, reinicio: SKILL_CRUCE },
  /* SOURCE · § 5: "Mobile UI animations stay under 300ms" — el
     deslizamiento del frente y el blanqueo, sin retardo. */
  desliz: { retardo: 0, duracion: 200 },
  blanqueo: 250,
  reinicio: 200,
  /* SOURCE · § 4 y "Never Ship": "`scale(0.95)` + `opacity: 0`". */
  escalaEntrada: 0.95,
}

export const CINEMATICA: Record<Receta, Cinematica> = { clip: CLIP, skill: SKILL }
