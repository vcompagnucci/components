import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import css from './app.module.css'
import { PIECES, TABS, type Piece, type Platform } from './pieces'

type Dir = 'fwd' | 'back'

function Tabs({
  filterIdx,
  onChange,
}: {
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
  }, [filterIdx])

  useEffect(() => {
    const onResize = () => place(false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIdx])

  return (
    <div className={css.tabs} role="tablist" aria-label="Platform" ref={tabsRef}>
      {TABS.map((label, i) => (
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

function Item({ piece, onOpen }: { piece: Piece; onOpen: (p: Piece) => void }) {
  return (
    <button className={css.streamItem} onClick={() => onOpen(piece)}>
      <div className={css.streamTitle}>{piece.name}</div>
      <div className={css.streamPreview} />
    </button>
  )
}

function List({
  filterIdx,
  dir,
  onOpen,
}: {
  filterIdx: number
  dir: Dir
  onOpen: (p: Piece) => void
}) {
  const byPlatform = (pl: Platform) => PIECES.filter((p) => p.platform === pl)

  return (
    /* key={filterIdx} re-monta el contenedor para re-disparar su entrada:
       una entrada por contenedor, no 18 items escalonados. */
    <div className={css.content} data-dir={dir} key={filterIdx}>
      {filterIdx === 0
        ? (['Web', 'App'] as const).map((pl) => (
            <section className={css.listGroup} key={pl}>
              <div className={css.groupLabel}>{pl}</div>
              {byPlatform(pl).map((p) => (
                <Item piece={p} onOpen={onOpen} key={p.name} />
              ))}
            </section>
          ))
        : byPlatform(TABS[filterIdx] as Platform).map((p) => (
            <Item piece={p} onOpen={onOpen} key={p.name} />
          ))}
    </div>
  )
}

function Detail({ piece, onBack }: { piece: Piece; onBack: () => void }) {
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

export function App() {
  const [filterIdx, setFilterIdx] = useState(0)
  const [dir, setDir] = useState<Dir>('fwd')
  const [selected, setSelected] = useState<Piece | null>(null)

  const changeFilter = (i: number) => {
    if (i === filterIdx) return
    setDir(i >= filterIdx ? 'fwd' : 'back')
    setFilterIdx(i)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={css.page}>
      {selected ? (
        <Detail piece={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          <header className={css.mast}>
            <h1 className={css.mastTitle}>Library</h1>
            <div className={css.mastSub}>Components for web and iOS that feel right.</div>
          </header>
          <div className={css.barInner}>
            <Tabs filterIdx={filterIdx} onChange={changeFilter} />
          </div>
          <List filterIdx={filterIdx} dir={dir} onOpen={setSelected} />
        </>
      )}
    </div>
  )
}
