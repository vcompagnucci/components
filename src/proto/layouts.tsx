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

/* El separador Rule ya medido, reutilizado donde una variante lo pide.
   Así lo que se juzga acá es la navegación, no otra vez la línea. */
function RuleHead({ label }: { label: string }) {
  return (
    <div className={sep.ruleHead}>
      <div className={`${sep.label} ${sep.ruleLabel}`}>{label}</div>
      <span className={sep.ruleLine} aria-hidden />
    </div>
  )
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
            <RuleHead label={pl} />
            {by(pl).map((p) => (
              <Item piece={p} onOpen={onOpen} key={p.name} />
            ))}
          </section>
        ))}
      </div>
    </>
  )
}

/* ─── 2 · COLUMN ────────────────────────────────────────────────────
   Los tabs quedan, pero desaparece el encabezado de sección: en All
   el rótulo baja a la sangría izquierda y sólo aparece en la primera
   pieza de cada grupo. Es el patrón del año en la home de benji. */
function ColumnLayout({ onOpen }: Props) {
  const [f, setF] = useState(0)
  const labels = ['All', 'Web', 'App'] as const

  return (
    <>
      <Masthead />
      <div className={app.barInner}>
        <Tabs labels={labels} filterIdx={f} onChange={setF} />
      </div>
      <div className={app.content} data-dir="fwd" key={f}>
        {f === 0
          ? PLATFORMS.map((pl) => (
              <section className={css.colGroup} key={pl}>
                {by(pl).map((p, i) => (
                  <div className={css.colRow} key={p.name}>
                    {i === 0 && <div className={css.colLabel}>{pl}</div>}
                    <Item piece={p} onOpen={onOpen} />
                  </div>
                ))}
              </section>
            ))
          : by(labels[f] as Platform).map((p) => (
              <div className={css.colRow} key={p.name}>
                <Item piece={p} onOpen={onOpen} />
              </div>
            ))}
      </div>
    </>
  )
}

/* ─── 3 · TWO TABS ──────────────────────────────────────────────────
   Tu idea: se va All, se va el rótulo y se va la línea. Los tabs son
   la única navegación y la única marca de grupo. */
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

/* ─── 4 · STACKED ───────────────────────────────────────────────────
   La home de josh: sin ningún control. Todo apilado, siempre. */
function StackedLayout({ onOpen }: Props) {
  return (
    <>
      <Masthead />
      <div className={app.content} data-dir="fwd">
        {PLATFORMS.map((pl) => (
          <section className={css.stackGroup} key={pl}>
            <RuleHead label={pl} />
            {by(pl).map((p) => (
              <Item piece={p} onOpen={onOpen} key={p.name} />
            ))}
          </section>
        ))}
      </div>
    </>
  )
}

export const LAYOUTS = [
  { name: 'Index', Comp: IndexLayout },
  { name: 'Column', Comp: ColumnLayout },
  { name: 'Two tabs', Comp: TwoTabsLayout },
  { name: 'Stacked', Comp: StackedLayout },
]
