import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import css from './scrubber.module.css'

/* El control estándar del taller para tantear un tamaño.

   El drag va a mano en vez de con un <input type=range> por una razón
   concreta: el thumb nativo tiene ancho, así que su centro recorre de
   thumb/2 a ancho-thumb/2 y el mapeo posición→valor no es lineal contra
   el dibujo. Acá el recorrido es el ancho completo y lo que ves debajo
   del cursor es el valor. El teclado y ARIA se cablean a mano por eso.

   El step no se puede esquivar: todo valor pasa por snap(), así que no
   existe manera de dejar un número fuera de la escala. */

const snap = (v: number, step: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(v / step) * step))

/* Detente. En una Mac no hay háptica accesible desde la web —
   navigator.vibrate maneja el motor de un teléfono y Safari ni siquiera
   lo implementa (MDN browser-compat-data)—, así que el click se da
   donde se puede: vibración real si hay motor, y el pulso del thumb
   siempre, que es lo que se ve en escritorio. */
const buzz = () => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(1)
  }
}

export function ScrubberBar({ children }: { children: ReactNode }) {
  return <div className={css.bar}>{children}</div>
}

export function Scrubber({
  label,
  value,
  onChange,
  min,
  max,
  hardMax,
  step = 4,
  tickEvery = 32,
  width = 420,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  /* El tope real de la escala dibujada. Si max es menor, la diferencia
     se raya: el control no se quedó corto, es la invariante frenando. */
  hardMax?: number
  step?: number
  tickEvery?: number
  width?: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [ticking, setTicking] = useState(0)
  const last = useRef(value)

  const scaleMax = hardMax ?? max

  /* Un cambio de paso es el detente, venga de arrastre o de teclado. */
  useEffect(() => {
    if (value === last.current) return
    last.current = value
    buzz()
    setTicking((n) => n + 1)
  }, [value])

  const fromX = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const t = (clientX - r.left) / r.width
      onChange(snap(min + t * (scaleMax - min), step, min, max))
    },
    [min, max, scaleMax, step, onChange],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    trackRef.current?.focus()
    fromX(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) fromX(e.clientX)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const big = step * 4
    const map: Record<string, number> = {
      ArrowLeft: -step,
      ArrowDown: -step,
      ArrowRight: step,
      ArrowUp: step,
      PageDown: -big,
      PageUp: big,
    }
    if (e.key in map) {
      e.preventDefault()
      onChange(snap(value + map[e.key], step, min, max))
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(min)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(max)
    }
  }

  const span = scaleMax - min
  const pct = ((value - min) / span) * 100
  const capPct = 100 - ((max - min) / span) * 100

  const ticks: number[] = []
  for (let v = Math.ceil(min / tickEvery) * tickEvery; v <= scaleMax; v += tickEvery) {
    ticks.push(((v - min) / span) * 100)
  }

  return (
    <div
      ref={trackRef}
      className={css.track}
      style={{ width }}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} píxeles`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
    >
      <span className={css.fill} style={{ width: `${pct}%` }} aria-hidden />
      <span className={css.ticks} aria-hidden>
        {ticks.map((t) => (
          <i className={css.tick} style={{ left: `${t}%` }} key={t} />
        ))}
      </span>
      {capPct > 0 && <span className={css.cap} style={{ width: `${capPct}%` }} aria-hidden />}
      <span className={css.thumb} style={{ left: `${pct}%` }} data-tick={ticking} aria-hidden />
      <span className={css.label}>{label}</span>
      <span className={css.value}>
        {value}
        <span className={css.unit}>px</span>
      </span>
    </div>
  )
}

/* Lee el valor inicial de la URL y lo pega a la escala, por si alguien
   escribe ?gap=113 a mano. */
export function useUrlNumber(param: string, fallback: number, step: number) {
  return useState(() => {
    const raw = Number(new URLSearchParams(location.search).get(param))
    if (!Number.isFinite(raw) || raw <= 0) return fallback
    return Math.round(raw / step) * step
  })
}
