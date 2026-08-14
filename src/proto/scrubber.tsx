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

/* La barra se puede plegar. Hace falta porque la herramienta vive
   encima de la página que está midiendo: para juzgar de verdad hay que
   poder sacarla del medio y volver a traerla sin perder los valores.
   Plegada deja sólo un punto, y la tecla H hace lo mismo sin apuntar. */
export function ScrubberBar({ children }: { children: ReactNode }) {
  const [plegada, setPlegada] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'h' || e.key === 'H') setPlegada((v) => !v)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={css.bar}>
      {!plegada && children}
      <button
        className={plegada ? css.dot : css.fold}
        onClick={() => setPlegada((v) => !v)}
        aria-label={plegada ? 'Mostrar controles (H)' : 'Ocultar controles (H)'}
        aria-expanded={!plegada}
        title={plegada ? 'Mostrar (H)' : 'Ocultar (H)'}
      >
        {plegada ? <i className={css.dotMark} aria-hidden /> : '×'}
      </button>
    </div>
  )
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
  marks,
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
  /* Valores de referencia: se dibujan como marcas altas y claras, para
     ver dónde caen los dos referentes sin tener que acordarse. Sólo
     valen la pena si están adentro del recorrido y no en las puntas. */
  marks?: number[]
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
        {marks?.map((v) => (
          <i
            className={css.mark}
            style={{
              left: `clamp(0px, calc(${((v - min) / span) * 100}% - 0.5px), calc(100% - 1px))`,
            }}
            key={`m${v}`}
          />
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
   escribe ?gap=113 a mano. Además lo mete adentro del recorrido: sin
   eso, un ?aire=1000 heredado de una escala vieja dibuja el thumb
   afuera de la pista y el relleno desbordado, y parece roto el control
   cuando lo que está mal es el valor. */
export function useUrlNumber(
  param: string,
  fallback: number,
  step: number,
  min?: number,
  max?: number,
) {
  return useState(() => {
    const raw = Number(new URLSearchParams(location.search).get(param))
    if (!Number.isFinite(raw) || raw <= 0) return fallback
    const v = Math.round(raw / step) * step
    return snap(v, step, min ?? v, max ?? v)
  })
}
