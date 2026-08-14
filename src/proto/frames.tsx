import { useEffect, useState } from 'react'
import css from './frames.module.css'

/* ⚠ EN ESTUDIO — el marco: riel, márgenes y cómo cambian con el ancho.
   Tres variantes sobre la página real. El viewport se cambia con las
   DevTools; acá sólo se elige el marco. Se borra con src/proto/. */

export const FRAMES = [
  { id: '', label: 'Actual', note: '784 · 88 car.', cls: '' },
  { id: 'benji', label: 'Benji', note: '550 · 61 car.', cls: css.benji },
  { id: 'josh', label: 'Josh', note: '548 · 54 car.', cls: css.josh },
]

const idFromUrl = () => new URLSearchParams(location.search).get('frame') ?? ''

export function useFrame() {
  const [id, setId] = useState(idFromUrl)

  /* En la URL para que puedas compartir o recargar en la misma
     variante. replaceState, así el historial sigue siendo el de las
     piezas y no el de los tanteos. */
  useEffect(() => {
    const url = new URL(location.href)
    if (id) url.searchParams.set('frame', id)
    else url.searchParams.delete('frame')
    history.replaceState(history.state, '', url)
  }, [id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= FRAMES.length) setId(FRAMES[n - 1].id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const current = FRAMES.find((f) => f.id === id) ?? FRAMES[0]
  return { id: current.id, cls: current.cls, setId }
}

export function FrameToggle({ id, setId }: { id: string; setId: (v: string) => void }) {
  return (
    <nav className={css.bar} aria-label="Marco">
      {FRAMES.map((f) => (
        <button
          key={f.label}
          className={css.item}
          data-on={f.id === id ? '' : undefined}
          aria-current={f.id === id ? 'true' : undefined}
          onClick={() => setId(f.id)}
        >
          <span>{f.label}</span>
          <span className={css.note}>{f.note}</span>
        </button>
      ))}
    </nav>
  )
}
