import { useEffect, useState } from 'react'
import css from './slider.module.css'

/* Slider del taller para tantear un espaciado en vivo.

   El step es la escala del design system: nunca deja elegir un valor
   que no esté en ella, así que no se puede salir de sistema tanteando.
   El valor vive en la URL (?gap=64), así que compartís o recargás y
   estás mirando lo mismo. */
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 160,
  step = 4,
  param = 'gap',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  param?: string
}) {
  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set(param, String(value))
    history.replaceState(history.state, '', url)
  }, [value, param])

  return (
    <div className={css.bar}>
      <span className={css.label}>{label}</span>
      <input
        className={css.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className={css.value}>
        {value}
        <span className={css.unit}>px</span>
      </span>
    </div>
  )
}

/* Lee el valor inicial de la URL, redondeado al step para que nunca
   entre algo fuera de escala escribiéndolo a mano. */
export function useUrlNumber(param: string, fallback: number, step = 4) {
  return useState(() => {
    const raw = Number(new URLSearchParams(location.search).get(param))
    if (!Number.isFinite(raw) || raw <= 0) return fallback
    return Math.round(raw / step) * step
  })
}
