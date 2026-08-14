import { useEffect, useState } from 'react'
import app from '../app.module.css'
import { Item, Masthead, slug } from '../parts'
import { PIECES, type Piece, type Platform } from '../pieces'
import sep from './separators.module.css'
import css from './layouts.module.css'

type Props = { onOpen: (p: Piece) => void }

const PLATFORMS = ['Web', 'App'] as const
const by = (pl: Platform) => PIECES.filter((p) => p.platform === pl)
/* Referencia estable: si se recalculara en cada render, el efecto del
   scrollspy se re-suscribiría en cada uno. */
const ALL_NAMES = PIECES.map((p) => p.name)

const goTo = (name: string) => {
  const el = document.getElementById(slug(name))
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - 80,
    behavior: reduce ? 'auto' : 'smooth',
  })
}

/* Cuál pieza está en vista. La última cuyo tope ya pasó los 120px: es
   la regla que hace que el índice cambie cuando el título cruza la
   parte de arriba, no cuando la pieza aparece por abajo. */
function useActivePiece(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let raf = 0
    const read = () => {
      let found: string | null = null
      for (const name of ALL_NAMES) {
        const el = document.getElementById(slug(name))
        if (el && el.getBoundingClientRect().top <= 120) found = name
      }
      setActive(found)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [enabled])

  return active
}

type Head = 'plain' | 'rule' | 'underline' | 'none'

function GroupHead({ label, kind }: { label: string; kind: Head }) {
  if (kind === 'none') return null
  if (kind === 'rule')
    return (
      <div className={css.idxRuleHead}>
        <div className={css.indexLabel}>{label}</div>
        <span className={css.idxRuleLine} aria-hidden />
      </div>
    )
  if (kind === 'underline')
    return <div className={`${css.indexLabel} ${css.idxUnderline}`}>{label}</div>
  return <div className={css.indexLabel}>{label}</div>
}

/* El índice fijo, con dos ejes en estudio: si marca la pieza en vista
   y cómo rotula los grupos. Todo lo demás —posición, tamaños, la línea
   de sección del contenido— queda congelado. */
function IndexLayout({ spy, head }: { spy: boolean; head: Head }) {
  return function Layout({ onOpen }: Props) {
    const active = useActivePiece(spy)

    return (
      <>
        <nav className={css.index} aria-label="Pieces">
          {PLATFORMS.map((pl) => (
            <div className={css.indexGroup} key={pl}>
              <GroupHead label={pl} kind={head} />
              {by(pl).map((p) => (
                <button
                  className={css.indexLink}
                  key={p.name}
                  data-on={spy && active === p.name ? '' : undefined}
                  aria-current={spy && active === p.name ? 'true' : undefined}
                  onClick={() => goTo(p.name)}
                >
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
}

export const LAYOUTS = [
  { name: 'Actual', Comp: IndexLayout({ spy: false, head: 'plain' }) },
  { name: 'Live', Comp: IndexLayout({ spy: true, head: 'plain' }) },
  { name: 'Rule', Comp: IndexLayout({ spy: true, head: 'rule' }) },
  { name: 'Underline', Comp: IndexLayout({ spy: true, head: 'underline' }) },
  { name: 'Quiet', Comp: IndexLayout({ spy: true, head: 'none' }) },
]
