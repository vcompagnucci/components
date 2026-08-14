import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import css from './app.module.css'
import { Detail, Item, Masthead, slug } from './parts'
import { PIECES, type Piece, type Platform } from './pieces'
import { Picker } from './proto/picker'

const PLATFORMS = ['Web', 'App'] as const
const by = (pl: Platform) => PIECES.filter((p) => p.platform === pl)

/* ⚠ EN ESTUDIO — el aire entre el masthead y la primera rule.
   Hoy son 121.5px medidos, que salen de apilar tres cosas sin que nadie
   lo decidiera: 8 del margin del masthead + 40 del padding de .content
   + 64 del de .group. Cada opción es el total desde el subtítulo, y
   cada una tiene un motivo. El segundo grupo no se toca: sigue en los
   64 medidos de benji. Se hornea al elegir y esto se borra. */
const GAPS = [
  { name: '112', total: 112, why: 'actual — nadie lo decidió, es la suma de tres cosas' },
  { name: '80', total: 80, why: 'el aire superior de la página, repetido' },
  { name: '64', total: 64, why: 'lo que usa benji entre secciones — el mismo de abajo' },
  { name: '48', total: 48, why: 'lo que usa benji cuando arranca una sección en su home' },
  { name: '32', total: 32, why: 'el mínimo, para ver dónde se rompe' },
]

/* Rutas sin router: son dos vistas. `/` es la lista, `/button` la pieza.
   Vite sirve index.html para rutas desconocidas (appType spa por
   defecto), así que entrar directo a /button funciona en dev y en
   preview; al desplegar, el host necesita el mismo fallback a
   index.html — es la única condición que impone esto. */
const fromUrl = () => {
  const s = decodeURIComponent(location.pathname.slice(1))
  return PIECES.find((p) => slug(p.name) === s) ?? null
}

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
  const [selected, setSelected] = useState<Piece | null>(fromUrl)
  const listScroll = useRef(0)
  const first = useRef(true)

  useEffect(() => {
    const onPop = () => setSelected(fromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    document.title = selected ? `${selected.name} — Library` : 'Library'
  }, [selected])

  /* Volver a la lista devuelve el scroll donde estabas. Sin esto la
     lista reaparece arriba de todo y perdés el lugar, que con 18 piezas
     es media pantalla de scroll. El primer render se saltea para no
     pisar la restauración del navegador al recargar. */
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo(0, selected ? 0 : listScroll.current)
  }, [selected])

  const open = (p: Piece) => {
    listScroll.current = window.scrollY
    history.pushState({ fromList: true }, '', `/${slug(p.name)}`)
    setSelected(p)
  }

  /* Si llegaste desde la lista, volvés por el historial y la pila no
     crece. Si entraste directo por link no hay a dónde volver, así que
     se empuja la lista. */
  const back = () => {
    if (history.state?.fromList) {
      history.back()
      return
    }
    history.pushState({}, '', '/')
    setSelected(null)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected) back()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  if (selected) {
    return (
      <div className={css.page}>
        <Detail piece={selected} onBack={back} />
      </div>
    )
  }

  return (
    <Picker names={GAPS.map((g) => g.name)}>
      {(gi) => (
        <div className={css.page}>
          <Index />
          <Masthead />
          {/* El padding de .content se anula y el primer grupo toma el
              total menos los 8 del margin del masthead, para que el
              número elegido sea exactamente el que se mide en pantalla. */}
          <div className={css.content} data-dir="fwd" style={{ paddingTop: 0 }}>
            {PLATFORMS.map((pl, i) => (
              <section
                className={css.group}
                key={pl}
                style={i === 0 ? { paddingTop: GAPS[gi].total - 8 } : undefined}
              >
                <div className={css.groupHead}>
                  <div className={css.groupLabel}>{pl}</div>
                  <span className={css.groupLine} aria-hidden />
                </div>
                {by(pl).map((p) => (
                  <Item piece={p} onOpen={open} key={p.name} />
                ))}
              </section>
            ))}
          </div>
        </div>
      )}
    </Picker>
  )
}
