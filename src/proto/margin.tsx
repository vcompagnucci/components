import { useEffect, useState } from 'react'
import css from './margin.module.css'

/* ⚠ EN ESTUDIO — el marco: riel y margen, que son la misma decisión
   porque la columna es riel − 2×margen. Se borra con src/proto/. */

const OPCIONES = [
  { id: 'actual', label: 'Actual', note: '832 · 24', cls: css.actual },
  { id: 'josh', label: 'Josh', note: '740 · 96→48', cls: css.josh },
]

export function useMargin() {
  const [id, setId] = useState(() => new URLSearchParams(location.search).get('m') ?? 'actual')

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('m', id)
    history.replaceState(history.state, '', url)
  }, [id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= OPCIONES.length) setId(OPCIONES[n - 1].id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const actual = OPCIONES.find((o) => o.id === id) ?? OPCIONES[0]
  return { id: actual.id, cls: actual.cls, setId }
}

/* Los números se leen del DOM y no de una tabla: así lo que muestra el
   lector es lo que la página mide de verdad, incluso si el CSS cambia. */
function medir() {
  const el = document.querySelector<HTMLElement>('[data-rail]')
  const w = window.innerWidth
  if (!el) return { w, riel: 0, margen: 0, columna: 0, alBorde: 0 }
  const r = el.getBoundingClientRect()
  const margen = parseFloat(getComputedStyle(el).paddingLeft) || 0
  return {
    w,
    riel: Math.round(r.width),
    margen: Math.round(margen),
    columna: Math.round(r.width - margen * 2),
    alBorde: Math.round(r.left + margen),
  }
}

export function MarginToggle({ id, setId }: { id: string; setId: (v: string) => void }) {
  const [m, setM] = useState(medir)

  useEffect(() => {
    const leer = () => setM(medir())
    leer()
    window.addEventListener('resize', leer)
    /* El cambio de opción no dispara resize, así que se re-mide cuando
       el layout ya está pintado. */
    const raf = requestAnimationFrame(leer)
    return () => {
      window.removeEventListener('resize', leer)
      cancelAnimationFrame(raf)
    }
  }, [id])

  return (
    <nav className={css.bar} aria-label="Marco">
      {OPCIONES.map((o) => (
        <button
          key={o.id}
          className={css.item}
          data-on={o.id === id ? '' : undefined}
          aria-current={o.id === id ? 'true' : undefined}
          onClick={() => setId(o.id)}
        >
          <span>{o.label}</span>
          <span className={css.note}>{o.note}</span>
        </button>
      ))}
      <span className={css.read}>
        <span className={css.cell}>
          <span className={css.cellLabel}>ancho</span>
          {m.w}
        </span>
        <span className={css.cell}>
          <span className={css.cellLabel}>riel</span>
          {m.riel}
        </span>
        <span className={css.cell}>
          <span className={css.cellLabel}>margen</span>
          {m.margen}
        </span>
        <span className={`${css.cell} ${css.col}`}>
          <span className={css.cellLabel}>columna</span>
          {m.columna}
        </span>
        <span className={css.cell}>
          <span className={css.cellLabel}>al borde</span>
          {m.alBorde}
        </span>
      </span>
    </nav>
  )
}
