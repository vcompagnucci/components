import { useEffect, useState } from 'react'
import css from './app.module.css'
import { Detail, Item, Masthead, slug } from './parts'
import { PIECES, type Piece, type Platform } from './pieces'

const PLATFORMS = ['Web', 'App'] as const
const by = (pl: Platform) => PIECES.filter((p) => p.platform === pl)

/* 80px de descuento: el mismo aire superior de la página, así el título
   de la pieza no queda pegado al borde al llegar. */
const goTo = (name: string) => {
  const el = document.getElementById(slug(name))
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - 80,
    behavior: reduce ? 'auto' : 'smooth',
  })
}

function Index() {
  return (
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
  )
}

export function App() {
  const [selected, setSelected] = useState<Piece | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (selected) {
    return (
      <div className={css.page}>
        <Detail piece={selected} onBack={() => setSelected(null)} />
      </div>
    )
  }

  return (
    <div className={css.page}>
      <Index />
      <Masthead />
      <div className={css.content} data-dir="fwd">
        {PLATFORMS.map((pl) => (
          <section className={css.group} key={pl}>
            <div className={css.groupHead}>
              <div className={css.groupLabel}>{pl}</div>
              <span className={css.groupLine} aria-hidden />
            </div>
            {by(pl).map((p) => (
              <Item piece={p} onOpen={setSelected} key={p.name} />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
