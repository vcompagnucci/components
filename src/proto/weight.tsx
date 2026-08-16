import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import css from './weight.module.css'

/* ⚠ EN ESTUDIO — la escalera de pesos: título, rótulo de sección y
   nombre de pieza, los tres a la vez. Se borra con src/proto/. Los
   valores y su procedencia están en el CSS de al lado; acá va sólo el
   picker. */

/* Los pesos se muestran en el orden en que bajan por la página:
   título · rótulo de sección · nombre de pieza. */
const VARIANTES = [
  { id: 'benji', label: 'Benji', pesos: '500·600·500', cls: css.benji },
  { id: 'escalera', label: 'Escalera', pesos: '600·560·500', cls: css.escalera },
  { id: 'escaneo', label: 'Escaneo', pesos: '500·500·600', cls: css.escaneo },
  { id: 'invertida', label: 'Invertida', pesos: '500·560·600', cls: css.invertida },
  { id: 'benjiMas', label: 'Benji+', pesos: '500·600·560', cls: css.benjiMas },
]

export function useWeight() {
  const [i, setI] = useState(() => {
    const n = Number.parseInt(new URLSearchParams(location.search).get('w') ?? '', 10)
    /* Arranca en Escalera, que es lo que la página tiene hoy: así el
       primer render no cambia nada y el cambio es lo que se compara. */
    return n >= 1 && n <= VARIANTES.length ? n - 1 : 1
  })

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('w', String(i + 1))
    history.replaceState(history.state, '', url)
  }, [i])

  return { i, setI, cls: VARIANTES[i].cls }
}

export function WeightPicker({ i, setI }: { i: number; setI: (v: number) => void }) {
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const [listo, setListo] = useState(false)
  const [caja, setCaja] = useState({ w: 0, x: 0 })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= VARIANTES.length) setI(n - 1)
      else if (e.key === 'ArrowRight') setI((i + 1) % VARIANTES.length)
      else if (e.key === 'ArrowLeft') setI((i - 1 + VARIANTES.length) % VARIANTES.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [i, setI])

  useLayoutEffect(() => {
    const el = items.current[i]
    if (el) setCaja({ w: el.offsetWidth, x: el.offsetLeft })
  }, [i])

  useEffect(() => {
    const medir = () => {
      const el = items.current[i]
      if (el) setCaja({ w: el.offsetWidth, x: el.offsetLeft })
    }
    window.addEventListener('resize', medir)
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setListo(true)))
    return () => {
      window.removeEventListener('resize', medir)
      cancelAnimationFrame(raf)
    }
  }, [i])

  return (
    <nav
      className={css.picker}
      data-ready={listo ? '' : undefined}
      aria-label="Escalera de pesos"
    >
      <span
        className={css.highlight}
        style={{ width: caja.w, transform: `translateX(${caja.x}px)` }}
        aria-hidden
      />
      {VARIANTES.map((v, j) => (
        <button
          key={v.id}
          ref={(el) => {
            items.current[j] = el
          }}
          className={css.item}
          data-active={j === i ? '' : undefined}
          aria-current={j === i ? 'true' : undefined}
          onClick={() => setI(j)}
        >
          <span>{v.label}</span>
          <span className={css.pesos}>{v.pesos}</span>
        </button>
      ))}
    </nav>
  )
}
