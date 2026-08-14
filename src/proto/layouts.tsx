import { useState } from 'react'
import app from '../app.module.css'
import { Item, Masthead, Tabs, slug } from '../parts'
import { PIECES, type Piece, type Platform } from '../pieces'
import sep from './separators.module.css'
import css from './layouts.module.css'

type Props = { onOpen: (p: Piece) => void }

const PLATFORMS = ['Web', 'App'] as const
const by = (pl: Platform) => PIECES.filter((p) => p.platform === pl)

const goTo = (name: string) => {
  const el = document.getElementById(slug(name))
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - 80,
    behavior: reduce ? 'auto' : 'smooth',
  })
}

/* ─── 1 · INDEX ─────────────────────────────────────────────────────
   El sistema completo de benji: índice fijo a la izquierda para
   navegar, y la línea de sección adentro del contenido. Sin tabs. */
function IndexLayout({ onOpen }: Props) {
  return (
    <>
      <nav className={css.index} aria-label="Pieces">
        {PLATFORMS.map((pl) => (
          <div className={css.indexGroup} key={pl}>
            <div className={css.indexLabel}>{pl}</div>
            {by(pl).map((p) => (
              <button className={css.indexLink} key={p.name} onClick={() => goTo(p.name)}>
                {p.name}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <Masthead />
      <div className={app.content} data-dir="fwd">
        {PLATFORMS.map((pl) => (
          <section className={sep.rule} key={pl}>
            <div className={sep.ruleHead}>
              <div className={`${sep.label} ${sep.ruleLabel}`}>{pl}</div>
              <span className={sep.ruleLine} aria-hidden />
            </div>
            {by(pl).map((p) => (
              <Item piece={p} onOpen={onOpen} key={p.name} />
            ))}
          </section>
        ))}
      </div>
    </>
  )
}

/* ─── 2 · TWO TABS ──────────────────────────────────────────────────
   Se va All, se va el rótulo y se va la línea. Los tabs son la única
   navegación y la única marca de grupo. */
function TwoTabsLayout({ onOpen }: Props) {
  const [f, setF] = useState(0)

  return (
    <>
      <Masthead />
      <div className={app.barInner}>
        <Tabs labels={PLATFORMS} filterIdx={f} onChange={setF} />
      </div>
      <div className={app.content} data-dir="fwd" key={f}>
        {by(PLATFORMS[f]).map((p) => (
          <Item piece={p} onOpen={onOpen} key={p.name} />
        ))}
      </div>
    </>
  )
}

export const LAYOUTS = [
  { name: 'Index', Comp: IndexLayout },
  { name: 'Two tabs', Comp: TwoTabsLayout },
]
