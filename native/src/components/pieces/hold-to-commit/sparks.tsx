import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

import { CHISPAS, FRENTE, frenteEn, HOLD } from './measurements'

/* ═══════════════════════════════════════════════════════════════
   LAS CHISPAS — los puntos de luz que viajan ADENTRO del pill durante el
   hold, delante del frente del relleno (ampliaciones en
   `.context/hold-to-commit/dentro`, pistas en `chispas2.py`).

   SON FUNCIÓN DEL PROGRESO, no de un reloj: cada chispa tiene un
   progreso de nacimiento p₀ y vive `largo` ms de progreso; su posición
   es la del frente al nacer, más lo que se adelantó, más lo que viajó
   desde entonces a una fracción de la velocidad del frente. Así con el
   botón parqueado a un progreso (sonda) las chispas están donde tienen
   que estar, y al soltar se van con el relleno (`blob`) en vez de
   quedar flotando sobre un pill apagado.

   POCAS VISTAS, VARIAS VIDAS: 12 imágenes, cada una con 3 vidas
   repartidas en el tiempo (sin solaparse), son 36 chispas por hold con
   12 estilos animados por cuadro. La textura es una gaussiana blanca
   (`media/spark@3x.png`); cada vida la escala y la atenúa a lo suyo.
   Viven debajo del velo blanco del commit y del label: al completar,
   el velo las tapa; sobre el relleno ya blanco, un blanco al 30 % no
   se ve — la misma absorción que en el clip.

   Todo el recibo está en `CHISPAS`.
   ═══════════════════════════════════════════════════════════════ */

type Vida = {
  p0: number         // progreso de nacimiento
  adelante: number   // pt por delante del frente al nacer
  y: number          // pt desde arriba del pill
  velocidad: number  // fracción de la velocidad del frente
  largo: number      // ms de vida
  deriva: number     // pt/s en y (negativo = sube)
  escala: number     // de la caja de la textura
  alfa: number
}

const azar = (() => {
  let s = 20260903
  return () => {
    s = (s * 48271) % 2147483647
    return (s - 1) / 2147483646
  }
})()
const entre = (min: number, max: number) => min + (max - min) * azar()

const TOTAL = CHISPAS.vistas * CHISPAS.vidasPorVista
const VIDAS: Vida[] = Array.from({ length: TOTAL }, (_, i) => ({
  p0: CHISPAS.desde + (CHISPAS.hasta - CHISPAS.desde) * ((i + 0.5) / TOTAL) + entre(-0.008, 0.008),
  adelante: CHISPAS.adelante.min + (CHISPAS.adelante.max - CHISPAS.adelante.min) * Math.pow(azar(), CHISPAS.adelante.sesgo),
  y: entre(CHISPAS.y.min, CHISPAS.y.max),
  velocidad: entre(CHISPAS.velocidad.min, CHISPAS.velocidad.max),
  largo: entre(CHISPAS.vida.min, CHISPAS.vida.max),
  deriva: entre(CHISPAS.derivaY.min, CHISPAS.derivaY.max),
  escala: entre(CHISPAS.escala.min, CHISPAS.escala.max),
  alfa: entre(CHISPAS.alfa.min, CHISPAS.alfa.max),
}))
/* La vista j toma las vidas j, j + vistas, j + 2·vistas: separadas
   (hasta − desde) / vidasPorVista ≈ 0.31 de progreso = 620 ms. */
const POR_VISTA: Vida[][] = Array.from({ length: CHISPAS.vistas }, (_, j) =>
  VIDAS.filter((_, i) => i % CHISPAS.vistas === j),
)

const TEXTURA = require('./media/spark.png')

const suave = (v: number, a: number, b: number) => {
  'worklet'
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

type Props = { ancho: number; progreso: SharedValue<number>; blob: SharedValue<number> }

function Chispa({ vidas, ancho, progreso, blob }: { vidas: Vida[] } & Props) {
  const estilo = useAnimatedStyle(() => {
    const p = progreso.get()
    let opacity = 0, tx = 0, ty = 0, sc = 1
    for (let i = 0; i < vidas.length; i++) {
      const v = vidas[i]!
      const dt = (p - v.p0) * HOLD.duracion // ms de vida
      if (dt < 0 || dt > v.largo) continue
      const f = dt / v.largo
      const envolvente = suave(f, 0, CHISPAS.entrada) * (1 - suave(f, 1 - CHISPAS.salida, 1))
      opacity = v.alfa * envolvente * blob.get()
      /* nace delante del borde geométrico de su nacimiento y avanza a una
         fracción de la velocidad del frente (recorrido·ancho en HOLD.duracion) */
      tx = frenteEn(v.p0, ancho) + v.adelante + v.velocidad * (dt / HOLD.duracion) * FRENTE.recorrido * ancho
      ty = v.y + (v.deriva * dt) / 1000
      sc = v.escala
      break
    }
    return { opacity, transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }] }
  })
  return <Animated.Image source={TEXTURA} style={[css.chispa, estilo]} />
}

export const Chispas = memo(function Chispas({ ancho, progreso, blob }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {POR_VISTA.map((vidas, j) => (
        <Chispa key={j} vidas={vidas} ancho={ancho} progreso={progreso} blob={blob} />
      ))}
    </View>
  )
})

const css = StyleSheet.create({
  /* La caja centrada en el origen: el translate pone el centro donde va. */
  chispa: {
    position: 'absolute',
    left: -CHISPAS.caja / 2,
    top: -CHISPAS.caja / 2,
    width: CHISPAS.caja,
    height: CHISPAS.caja,
    opacity: 0,
  },
})
