import { useLayoutEffect, useRef } from 'react'
import app from '../app.module.css'
import { PIECES, TABS, type Piece } from '../pieces'
import css from './separators.module.css'
import { Picker } from './picker'

/* Dos piezas por grupo: alcanza para que la fila tenga su peso real y
   permite ver el corte Web→App sin scrollear medio kilómetro, que es
   justamente lo que hay que juzgar. Los nombres son los del inventario
   placeholder — están acá por la FORMA del texto, no como plan. */
const GROUPS = (['Web', 'App'] as const).map((label) => ({
  label,
  items: PIECES.filter((p) => p.platform === label).slice(0, 2),
}))

function Row({ piece }: { piece: Piece }) {
  return (
    <button className={app.streamItem}>
      <div className={app.streamTitle}>{piece.name}</div>
      <div className={app.streamPreview} />
    </button>
  )
}

/* Contexto congelado: masthead y nav salen tal cual de app.module.css.
   El indicador se coloca una vez sobre "All", que es la única vista
   donde existen separadores. */
function Chrome() {
  const tabsRef = useRef<HTMLDivElement>(null)
  const indRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const tabs = tabsRef.current
    const ind = indRef.current
    if (!tabs || !ind) return
    const btn = tabs.querySelector<HTMLButtonElement>('[role="tab"]')
    if (!btn) return
    const wrap = tabs.getBoundingClientRect()
    const box = btn.getBoundingClientRect()
    ind.style.transition = 'none'
    ind.style.setProperty('--ind-l', String(box.left - wrap.left))
    ind.style.setProperty('--ind-r', String(box.right - wrap.left))
  }, [])

  return (
    <>
      <header className={app.mast}>
        <h1 className={app.mastTitle}>Library</h1>
        <div className={app.mastSub}>Components for web and native apps that feel right.</div>
      </header>
      <div className={app.barInner}>
        <div className={app.tabs} role="tablist" aria-label="Platform" ref={tabsRef}>
          {TABS.map((label, i) => (
            <button
              key={label}
              role="tab"
              className={app.tab}
              aria-selected={i === 0}
              data-on={i === 0 ? '' : undefined}
            >
              {label}
            </button>
          ))}
          <span className={app.ind} aria-hidden ref={indRef} />
        </div>
      </div>
    </>
  )
}

/* ─── 1 · Benji: la línea subraya el rótulo ─── */
function Benji() {
  return (
    <>
      {GROUPS.map((g) => (
        <section className={css.benji} key={g.label}>
          <div className={`${css.label} ${css.benjiLabel}`}>{g.label}</div>
          {g.items.map((p) => (
            <Row piece={p} key={p.name} />
          ))}
        </section>
      ))}
    </>
  )
}

/* ─── 2 · Josh: la línea es una marca corta bajo el rótulo ─── */
function Josh() {
  return (
    <>
      {GROUPS.map((g) => (
        <section className={css.josh} key={g.label}>
          <div className={`${css.label} ${css.joshLabel}`}>{g.label}</div>
          <div className={css.joshRule} aria-hidden />
          {g.items.map((p) => (
            <Row piece={p} key={p.name} />
          ))}
        </section>
      ))}
    </>
  )
}

/* ─── 3 · Rule: el rótulo interrumpe la línea ─── */
function Rule() {
  return (
    <>
      {GROUPS.map((g) => (
        <section className={css.rule} key={g.label}>
          <div className={css.ruleHead}>
            <div className={`${css.label} ${css.ruleLabel}`}>{g.label}</div>
            <span className={css.ruleLine} aria-hidden />
          </div>
          {g.items.map((p) => (
            <Row piece={p} key={p.name} />
          ))}
        </section>
      ))}
    </>
  )
}

const VARIANTS = [Benji, Josh, Rule]

export function Separators() {
  return (
    <Picker names={['Benji', 'Josh', 'Rule']} replay>
      {(i, mountKey) => {
        const Variant = VARIANTS[i]
        return (
          <div className={`${app.page} ${css.stage}`}>
            <Chrome />
            {/* key re-monta el contenedor: la entrada del contenido
                vuelve a correr al cambiar de variante y con R. */}
            <div className={app.content} data-dir="fwd" key={`${i}-${mountKey}`}>
              <Variant />
            </div>
          </div>
        )
      }}
    </Picker>
  )
}
