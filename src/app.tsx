import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import css from './app.module.css'
import { Detail, Item, Masthead, slug } from './parts'
import { PIECES, type Piece, type Platform } from './pieces'
/* ⚠ EN ESTUDIO — dónde arranca el índice. Se va con src/proto/. */
import { IndexTopScrubber, useIndexTop } from './proto/index-top'

const PLATFORMS = ['Web', 'App'] as const
const by = (pl: Platform) => PIECES.filter((p) => p.platform === pl)

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

/* El id del separador de una sección. Lo usa el observador que decide
   cuándo el índice puede mostrar sus rótulos. */
const secId = (pl: Platform) => `sec-${pl.toLowerCase()}`

/* Cuál pieza está activa: la ÚLTIMA cuyo borde superior ya pasó una
   línea a --index-spy-line del tope del viewport.

   Es la regla de benji, que en su bundle minificado parece más compleja
   de lo que es:

     punto     = scrollY + 128 + 0.5·altoVentana
     condición = punto > topAbsoluto + 0.5·altoVentana

   El medio viewport está de los dos lados y se cancela, así que queda
   `topAbsoluto < scrollY + 128`, o sea `rect.top < 128`. */
const LINEA_SPY = 128

function piezaActiva(): string | null {
  let activa: string | null = null
  for (const p of PIECES) {
    const el = document.getElementById(slug(p.name))
    if (el && el.getBoundingClientRect().top < LINEA_SPY) activa = slug(p.name)
  }
  /* Al final del documento gana la última sí o sí: la que queda abajo de
     todo puede ser demasiado corta para llegar nunca a la línea. También
     es de él. */
  const d = document.documentElement
  if (d.scrollHeight - window.scrollY - window.innerHeight < 24) {
    activa = slug(PIECES[PIECES.length - 1].name)
  }
  return activa
}

function Index({ activa, rotulos }: { activa: string | null; rotulos: boolean }) {
  return (
    /* data-rotulos gobierna la opacidad de "Web" y "App" acá adentro:
       arrancan invisibles y aparecen recién cuando el separador de la
       primera sección salió de pantalla, así la misma palabra nunca está
       dos veces al mismo tiempo. Es lo que hace benji con el título de
       su página; el disparador es nuestro, porque el suyo es un umbral
       de 100px de scroll y a nosotros eso nos mostraría "Web" con el
       separador "Web" todavía a la vista. */
    <nav className={css.index} aria-label="Pieces" data-rotulos={rotulos ? '' : undefined}>
      {PLATFORMS.map((pl) => (
        <div className={css.indexGroup} key={pl}>
          <div className={css.indexLabel}>{pl}</div>
          {by(pl).map((p) => (
            <button
              className={css.indexLink}
              key={p.name}
              data-active={activa === slug(p.name) ? '' : undefined}
              onClick={() => goTo(p.name)}
            >
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
  const itop = useIndexTop() /* ⚠ EN ESTUDIO */
  const [activa, setActiva] = useState<string | null>(null)
  const [rotulos, setRotulos] = useState(false)
  const listScroll = useRef(0)
  const first = useRef(true)

  /* Los rótulos del índice aparecen cuando el separador de la primera
     sección deja de verse. Con IntersectionObserver y no con un listener
     de scroll: el navegador ya sabe cuándo un elemento entra y sale, y
     no hace falta preguntárselo en cada cuadro. */
  useEffect(() => {
    if (selected) return
    const el = document.getElementById(secId(PLATFORMS[0]))
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => setRotulos(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [selected])

  /* La pieza activa sí necesita el scroll, porque la respuesta cambia de
     forma continua y no en un borde. Se calcula en rAF para no hacer
     layout más de una vez por cuadro. */
  useEffect(() => {
    if (selected) return
    let pedido = 0
    const leer = () => {
      pedido = 0
      setActiva(piezaActiva())
    }
    const onScroll = () => {
      if (!pedido) pedido = requestAnimationFrame(leer)
    }
    leer()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (pedido) cancelAnimationFrame(pedido)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [selected])

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
    <div
      className={css.page}
      style={{ '--index-offset-top': `${itop.top}px` } as React.CSSProperties}
    >
      <Index activa={activa} rotulos={rotulos} />
      <Masthead />
      <div className={css.content}>
        {PLATFORMS.map((pl) => (
          <section className={css.group} key={pl}>
            <div className={css.groupHead} id={secId(pl)}>
              <div className={css.groupLabel}>{pl}</div>
              <span className={css.groupLine} aria-hidden />
            </div>
            {by(pl).map((p, i) => (
              <Item piece={p} onOpen={open} primera={pl === PLATFORMS[0] && i === 0} key={p.name} />
            ))}
          </section>
        ))}
      </div>
      {/* ⚠ EN ESTUDIO */}
      <IndexTopScrubber top={itop.top} setTop={itop.setTop} />
    </div>
  )
}
