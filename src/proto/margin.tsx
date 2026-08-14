import { useEffect, useState } from 'react'
import css from './margin.module.css'

/* ⚠ EN ESTUDIO — el margen lateral. Sólo cambia --margin; el riel, el
   aire y todo lo demás quedan congelados. Se borra con src/proto/. */

const OPCIONES = [
  { id: '24', label: '24', note: 'actual · benji', cls: css.m24 },
  { id: '32', label: '32', note: 'intermedio', cls: css.m32 },
  { id: '48', label: '48', note: 'josh', cls: css.m48 },
]

/* El riel: arriba de este ancho el contenido está centrado y el margen
   no hace nada. Sale del token para no quedar desactualizado. */
const rielPx = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--grid-max').trim()
  if (v.endsWith('rem')) return parseFloat(v) * 16
  return parseFloat(v) || 832
}

export function useMargin() {
  const [id, setId] = useState(() => new URLSearchParams(location.search).get('m') ?? '24')

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

export function MarginToggle({ id, setId }: { id: string; setId: (v: string) => void }) {
  const [w, setW] = useState(() => window.innerWidth)
  const [riel, setRiel] = useState(832)

  useEffect(() => {
    setRiel(rielPx())
    const onResize = () => setW(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const activo = w <= riel

  return (
    <nav className={css.bar} aria-label="Margen lateral">
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
      {/* El margen va DENTRO del riel y el max-width lo incluye
          (border-box), así que siempre le come ancho a la columna. Lo
          que cambia bajo el riel es que además pasa a ser el aire hasta
          el borde de la pantalla. */}
      <span className={css.state} data-active={activo ? '' : undefined}>
        <span className={css.dot} aria-hidden />
        {w}px · {activo ? 'columna + aire al borde' : 'sólo achica la columna'}
      </span>
    </nav>
  )
}
