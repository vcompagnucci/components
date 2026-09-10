import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

import { PARTICULAS, PILL } from './measurements'

/* ═══════════════════════════════════════════════════════════════
   LA RÁFAGA — 46 puntos que salen del perímetro del pill al completar.

   TODAS LAS PARTÍCULAS ESTÁN MONTADAS DESDE EL PRINCIPIO, invisibles, y
   se mueven con UN solo shared value (`estallido`, 0→1) que cada una lee
   en su `useAnimatedStyle`. Así el momento del commit no hace ningún
   render de React: el hilo de JS puede estar ocupado con la háptica y
   la ráfaga sale igual en el cuadro exacto. 46 estilos animados por
   cuadro durante 700 ms es trabajo del hilo de UI y Reanimated lo
   despacha en un solo commit.

   LA NUBE SE INFLA DESDE EL CENTRO. Cada punto nace sobre la normal de
   la cápsula (en las puntas, radial al arco) a 2.2 pt del borde y viaja
   por esa normal su `viaje`; y además se corre en x proporcional a su
   distancia al centro del pill (`expansion`), que es lo que se midió en
   las pistas del clip: la ráfaga se ABRE, no tiembla. Las dos
   componentes comparten el mismo ease-out.

   LA TABLA ES DETERMINISTA: un generador congruencial con semilla fija,
   así dos grabaciones de la pieza tienen la misma ráfaga y se pueden
   comparar cuadro a cuadro — la misma razón por la que los labels no
   escalan con Dynamic Type.

   Los valores (cantidad, viaje, tamaños, colores, tiempos) están
   medidos cuadro a cuadro del clip; el recibo está en `PARTICULAS`.
   ═══════════════════════════════════════════════════════════════ */

type Particula = {
  u: number        // posición a lo largo del pill, 0..1
  lado: -1 | 1     // arriba (-1) o abajo (+1)
  viaje: number    // pt, por la normal
  fraccionViaje: number // parte de la vida que dura el viaje
  diametro: number // pt
  ruido: number    // pt de ruido lateral al final del viaje
  color: string
  brillo: number   // 0.6..1, propio de cada punto
}

/* Park–Miller: bastante para 46 números que sólo tienen que parecer
   desordenados y ser los mismos cada vez. */
const azar = (() => {
  let s = 20260902
  return () => {
    s = (s * 48271) % 2147483647
    return (s - 1) / 2147483646
  }
})()

const entre = (min: number, max: number) => min + (max - min) * azar()
const POR_LADO = PARTICULAS.cantidad / 2

const TABLA: Particula[] = Array.from({ length: PARTICULAS.cantidad }, (_, i) => ({
  u: PARTICULAS.desde + (PARTICULAS.hasta - PARTICULAS.desde) * (((i % POR_LADO) + 0.5) / POR_LADO) + entre(-0.018, 0.018),
  lado: i < POR_LADO ? -1 : 1,
  viaje: PARTICULAS.viaje.min + (PARTICULAS.viaje.max - PARTICULAS.viaje.min) * Math.pow(azar(), PARTICULAS.viaje.sesgo),
  fraccionViaje: entre(PARTICULAS.duracionViaje.min, PARTICULAS.duracionViaje.max) / PARTICULAS.duracionVida,
  diametro: PARTICULAS.diametro.min + (PARTICULAS.diametro.max - PARTICULAS.diametro.min) * Math.pow(azar(), PARTICULAS.diametro.sesgo),
  ruido: entre(-PARTICULAS.ruidoLateral, PARTICULAS.ruidoLateral),
  color: PARTICULAS.colores[Math.floor(azar() * PARTICULAS.colores.length)]!,
  brillo: entre(PARTICULAS.brillo.min, PARTICULAS.brillo.max),
}))

/* El punto del borde de la cápsula para una x, y su normal exterior (sin
   escala). En el tramo recto la normal es vertical; en los arcos de las
   puntas, radial al centro del arco. */
const R = PILL.alto / 2
function borde(x: number, ancho: number, lado: -1 | 1) {
  const cx = x < R ? R : x > ancho - R ? ancho - R : x
  const dx = x - cx
  const dy = lado * Math.sqrt(Math.max(0, R * R - dx * dx))
  return { x: cx + dx, y: R + dy, nx: dx / R, ny: dy / R }
}

/* La exponencial del apagado, en unidades de t (0..1 de la vida). */
const K_APAGADO = PARTICULAS.duracionVida / PARTICULAS.tau

const suave = (v: number, a: number, b: number) => {
  'worklet'
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

type Props = {
  ancho: number
  estallido: SharedValue<number>
  /** Un solo color para todos los puntos (modo claro: el del pill). Sin él, la tabla medida. */
  color?: string
}

function Punto({ p, ancho, estallido, color }: { p: Particula } & Props) {
  const b = borde(p.u * ancho, ancho, p.lado)
  /* El desplazamiento total, calculado una vez: la normal por el viaje,
     más la expansión desde el centro y el ruido, en x. */
  const finX = b.nx * p.viaje + PARTICULAS.expansion * (b.x - ancho / 2) + p.ruido
  const finY = b.ny * p.viaje
  const estilo = useAnimatedStyle(() => {
    const t = estallido.get()
    if (t <= 0 || t >= 1) return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] }
    const v = Math.min(1, t / p.fraccionViaje)
    const eo = 1 - (1 - v) * (1 - v) // ease-out cuadrático, medido
    /* Apagado exponencial desde el brillo propio del punto, y un cierre
       suave desde `apagadoDesde` para que la vida termine en cero. */
    const apagado = Math.exp(-K_APAGADO * t) * (1 - suave(t, PARTICULAS.apagadoDesde, 1))
    return {
      opacity: PARTICULAS.brilloMaximo * p.brillo * apagado,
      transform: [
        { translateX: finX * eo },
        { translateY: finY * eo },
        { scale: 1 - (1 - PARTICULAS.escalaFinal) * t },
      ],
    }
  })
  /* El centro del punto nace `desdeElBorde` afuera, por la normal. */
  const cx = b.x + b.nx * PARTICULAS.desdeElBorde
  const cy = b.y + b.ny * PARTICULAS.desdeElBorde
  return (
    <Animated.View
      style={[
        css.punto,
        {
          left: cx - p.diametro / 2,
          top: cy - p.diametro / 2,
          width: p.diametro,
          height: p.diametro,
          borderRadius: p.diametro / 2,
          backgroundColor: color ?? p.color,
        },
        estilo,
      ]}
    />
  )
}

/* `memo` con props primitivas y un shared value de identidad estable:
   este árbol de 46 vistas no tiene por qué volver a renderizar nunca. */
export const Particulas = memo(function Particulas({ ancho, estallido, color }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {TABLA.map((p, i) => (
        <Punto key={i} p={p} ancho={ancho} estallido={estallido} color={color} />
      ))}
    </View>
  )
})

const css = StyleSheet.create({
  punto: { position: 'absolute', opacity: 0 },
})
