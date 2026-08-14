import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import './picker.css'

/* Picker del skill `prototype`, expresado en React. El contrato de
   comportamiento (teclas, ?v=N, re-montaje, data-ready) es el de
   PICKER.md; sólo cambia la forma de escribirlo, como el propio spec
   autoriza para frameworks. Su CSS sí va verbatim en picker.css. */
export function Picker({
  names,
  replay = false,
  children,
}: {
  names: string[]
  replay?: boolean
  children: (index: number, mountKey: number) => ReactNode
}) {
  const [current, setCurrent] = useState(() => {
    const v = Number.parseInt(new URLSearchParams(location.search).get('v') ?? '', 10)
    return v >= 1 && v <= names.length ? v - 1 : 0
  })
  const [mountKey, setMountKey] = useState(0)

  const navRef = useRef<HTMLElement>(null)
  const hlRef = useRef<HTMLSpanElement>(null)
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([])

  const moveHighlight = () => {
    const el = itemsRef.current[current]
    const hl = hlRef.current
    if (!el || !hl) return
    hl.style.width = `${el.offsetWidth}px`
    hl.style.transform = `translateX(${el.offsetLeft}px)`
  }

  /* La posición inicial se toma antes de pintar y sin transición; el
     data-ready que la habilita entra recién dos frames después, así la
     carga no anima. */
  useLayoutEffect(moveHighlight, [current, names.length])

  useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => navRef.current?.setAttribute('data-ready', ''))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [])

  useEffect(() => {
    const onResize = () => moveHighlight()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  })

  const select = (i: number) => {
    if (i < 0 || i >= names.length) return
    setCurrent(i)
    setMountKey((k) => k + 1)
    const url = new URL(location.href)
    url.searchParams.set('v', String(i + 1))
    history.replaceState(null, '', url)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const num = Number.parseInt(e.key, 10)
      if (num >= 1 && num <= names.length) select(num - 1)
      else if (e.key === 'ArrowRight') select((current + 1) % names.length)
      else if (e.key === 'ArrowLeft') select((current - 1 + names.length) % names.length)
      else if (e.key === 'r' || e.key === 'R') setMountKey((k) => k + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  return (
    <>
      {children(current, mountKey)}
      <nav className="proto-picker" aria-label="Prototype variants" ref={navRef}>
        <span className="proto-picker-highlight" aria-hidden="true" ref={hlRef} />
        {names.map((name, i) => (
          <button
            key={name}
            className="proto-picker-item"
            ref={(el) => {
              itemsRef.current[i] = el
            }}
            data-active={i === current ? '' : undefined}
            aria-current={i === current ? 'true' : undefined}
            onClick={() => select(i)}
          >
            {name}
          </button>
        ))}
        {replay && (
          <>
            <span className="proto-picker-divider" aria-hidden="true" />
            <button
              className="proto-picker-item proto-picker-replay"
              aria-label="Replay animation (R)"
              onClick={() => setMountKey((k) => k + 1)}
            >
              ↻
            </button>
          </>
        )}
      </nav>
    </>
  )
}
