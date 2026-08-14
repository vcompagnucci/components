import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import css from './type.module.css'

/* ⚠ EN ESTUDIO — el sistema tipográfico entero. Se borra con src/proto/.

   Dos sistemas completos sobre la página real, montados encima de todo
   lo ya horneado. Los valores y su procedencia están en el CSS de al
   lado; acá va sólo el picker. */

const VARIANTES = [
  { id: 'benji', label: 'Benji', cls: css.benji },
  { id: 'josh', label: 'Josh', cls: css.josh },
]

export function useType() {
  const [i, setI] = useState(() => {
    const n = Number.parseInt(new URLSearchParams(location.search).get('v') ?? '', 10)
    return n >= 1 && n <= VARIANTES.length ? n - 1 : 0
  })

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('v', String(i + 1))
    history.replaceState(history.state, '', url)
  }, [i])

  return { i, setI, cls: VARIANTES[i].cls }
}

export function TypePicker({ i, setI }: { i: number; setI: (v: number) => void }) {
  const barra = useRef<HTMLElement>(null)
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

  /* El highlight se mide del botón activo. En layout para que la
     posición inicial ya esté puesta antes de pintar. */
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
    /* data-ready recién después del primer pintado: así la carga no
       anima y el deslizamiento queda sólo para los cambios de verdad. */
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setListo(true)))
    return () => {
      window.removeEventListener('resize', medir)
      cancelAnimationFrame(raf)
    }
  }, [i])

  return (
    <nav ref={barra} className={css.picker} data-ready={listo ? '' : undefined} aria-label="Sistema tipográfico">
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
          {v.label}
        </button>
      ))}
    </nav>
  )
}
