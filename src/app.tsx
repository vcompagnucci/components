import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import css from './app.module.css'
import { Detail, Item, Masthead, slug } from './parts'
import { PIECES, type Piece, type Platform } from './pieces'
import { Scrubber, ScrubberBar, useUrlNumber } from './proto/scrubber'
import { Rulers } from './proto/rulers'

const PLATFORMS = ['Web', 'App'] as const
const by = (pl: Platform) => PIECES.filter((p) => p.platform === pl)

/* masthead → sección: 60, elegido con el scrubber. Venía de 112, que
   nadie había decidido —eran 8 del margin del masthead + 40 del padding
   de .content + 64 del de .group, apilados por tres reglas que nunca se
   miraron juntas—. Referencias medidas: benji usa 48 al arrancar una
   sección en su home y 64 entre secciones en sus subpáginas; 60 cae
   entre las dos. Falta hornearlo. */
const GAP_DEFAULT = 60
const GAP_STEP = 4

/* ⚠ EN ESTUDIO — rótulo → pieza. Los 56 son los de benji en /liveline
   (24 del bloque del separador + 32 del margin del bloque siguiente),
   que es el análogo real: nuestras piezas son bloques de 280px, no
   filas de texto. Ver la tabla en .context/recon/NAVIGATION.md. */
const BELOW_DEFAULT = 56
const BELOW_MIN = 8

/* INVARIANTE — el hueco bajo el rótulo siempre menor que el de encima.
   Si no, el rótulo se despega de sus piezas y se pega al masthead:
   quedaría rotulando lo de arriba en vez de lo de abajo.

   Los dos valores se mueven por separado, pero la invariante no vive en
   la buena voluntad de quien arrastra: vive en el tope del segundo
   control, que es siempre el primero menos un paso. Y si bajás el de
   arriba por debajo del de abajo, el de abajo lo sigue. No hay orden de
   movimientos que la rompa. */
const belowCap = (above: number) => Math.max(BELOW_MIN, above - GAP_STEP)

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
  const [gap, setGap] = useUrlNumber('gap', GAP_DEFAULT, GAP_STEP)
  const [below, setBelow] = useUrlNumber('below', BELOW_DEFAULT, GAP_STEP)
  const listScroll = useRef(0)
  const first = useRef(true)

  /* Bajar el de arriba arrastra al de abajo con él. Es el otro lado de
     la invariante: el tope del segundo control la cuida cuando movés
     abajo, y esto la cuida cuando movés arriba. */
  const changeGap = (v: number) => {
    setGap(v)
    setBelow((b) => Math.min(b, belowCap(v)))
  }

  /* Los valores viven en la URL: recargás o los compartís y estás
     mirando lo mismo. replaceState y no push, para no ensuciar el
     historial con un paso por cada tirón del arrastre. */
  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('gap', String(gap))
    url.searchParams.set('below', String(below))
    history.replaceState(history.state, '', url)
  }, [gap, below])

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
    <div className={css.page} style={{ '--group-below': `${below}px` } as React.CSSProperties}>
      {/* deps: re-mide cada vez que el valor cambia, que es en cada
          paso del arrastre. */}
      <Rulers deps={gap} />
      <Index />
      <Masthead />
      {/* El padding de .content se anula y el primer grupo toma el valor
          menos los 8 del margin del masthead, para que el número del
          slider sea exactamente el que mide la regla en pantalla. */}
      <div className={css.content} data-dir="fwd" style={{ paddingTop: 0 }}>
        {PLATFORMS.map((pl, i) => (
          <section
            className={css.group}
            key={pl}
            style={i === 0 ? { paddingTop: gap - 8 } : undefined}
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
      <ScrubberBar>
        <Scrubber
          label="masthead → sección"
          value={gap}
          onChange={changeGap}
          min={16}
          max={160}
          step={GAP_STEP}
        />
        {/* Más corto, y su tope se mueve con el de arriba: lo rayado es
            la invariante, no un slider que se quedó chico. */}
        <Scrubber
          label="rótulo → pieza"
          value={below}
          onChange={setBelow}
          min={BELOW_MIN}
          max={belowCap(gap)}
          hardMax={160}
          step={GAP_STEP}
          width={260}
        />
      </ScrubberBar>
    </div>
  )
}
