import { useEffect, useLayoutEffect, useRef } from 'react'
import css from './app.module.css'
import type { Piece } from './pieces'

/* Piezas compartidas de la página. Viven acá y no en app.tsx porque las
   variantes de layout en estudio también las usan, y un import circular
   entre app y el taller sería peor que este archivo. */

export const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

export function Tabs({
  labels,
  filterIdx,
  onChange,
}: {
  labels: readonly string[]
  filterIdx: number
  onChange: (i: number) => void
}) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const indRef = useRef<HTMLSpanElement>(null)
  const first = useRef(true)

  /* Coloca la línea. Sin transición en el primer pintado (la carga no
     anima). Después, cada borde recibe su propia duración según la
     dirección: adelante 260ms, atrás 440 — ese desfasaje es el estirón.
     Como la línea no se re-monta, clickear rápido redirige en vuelo. */
  const place = (animate: boolean) => {
    const tabs = tabsRef.current
    const ind = indRef.current
    if (!tabs || !ind) return
    const btn = tabs.querySelectorAll<HTMLButtonElement>('[role="tab"]')[filterIdx]
    if (!btn) return
    const wrap = tabs.getBoundingClientRect()
    const box = btn.getBoundingClientRect()
    const l = box.left - wrap.left
    const r = box.right - wrap.left
    const prevL = parseFloat(getComputedStyle(ind).getPropertyValue('--ind-l')) || 0
    const goingRight = l >= prevL
    ind.style.transition = animate
      ? `--ind-l ${goingRight ? 'var(--dur-trail)' : 'var(--dur-lead)'} var(--ease-out),` +
        `--ind-r ${goingRight ? 'var(--dur-lead)' : 'var(--dur-trail)'} var(--ease-out)`
      : 'none'
    ind.style.setProperty('--ind-l', String(l))
    ind.style.setProperty('--ind-r', String(r))
  }

  useLayoutEffect(() => {
    place(!first.current)
    first.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIdx, labels])

  useEffect(() => {
    const onResize = () => place(false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIdx, labels])

  return (
    <div className={css.tabs} role="tablist" aria-label="Platform" ref={tabsRef}>
      {labels.map((label, i) => (
        <button
          key={label}
          role="tab"
          className={css.tab}
          aria-selected={i === filterIdx}
          data-on={i === filterIdx ? '' : undefined}
          onClick={() => onChange(i)}
        >
          {label}
        </button>
      ))}
      <span className={css.ind} aria-hidden ref={indRef} />
    </div>
  )
}

export function Item({ piece, onOpen }: { piece: Piece; onOpen: (p: Piece) => void }) {
  return (
    <button className={css.streamItem} id={slug(piece.name)} onClick={() => onOpen(piece)}>
      <div className={css.streamTitle}>{piece.name}</div>
      <div className={css.streamPreview} />
    </button>
  )
}

export function Detail({ piece, onBack }: { piece: Piece; onBack: () => void }) {
  return (
    <div className={css.content}>
      <div className={css.detail}>
        <button className={css.back} aria-label="Back" onClick={onBack}>
          ←
        </button>
        <div className={css.detailHead}>
          <h1 className={css.detailTitle}>{piece.name}</h1>
          <div className={css.detailMeta}>{piece.platform}</div>
          <p className={css.detailDesc}>{piece.desc}</p>
        </div>
        <div className={css.detailPreview} />
      </div>
    </div>
  )
}

export function Masthead() {
  return (
    <header className={css.mast}>
      <h1 className={css.mastTitle}>Library</h1>
      <div className={css.mastSub}>Components for web and native apps that feel right.</div>
    </header>
  )
}
