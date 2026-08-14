import { useEffect, useState } from 'react'
import css from './rail.module.css'
import { Scrubber, ScrubberBar, useUrlNumber } from './scrubber'

/* ⚠ EN ESTUDIO — el ancho del riel, y nada más. Se borra con src/proto/.

   Los escalones ya se decidieron (los de benji) y están horneados en
   tokens.css y app.module.css. Lo único abierto es cuánto mide el riel,
   entre las dos referencias.

   El margen NO se mueve acá: es 16 arriba de 768 y 24 abajo, que es lo
   que se horneó. Por eso la columna es riel − 32 en escritorio, y
   arrastrar de punta a punta la lleva de 552 a 640. */

/* 582 es el número exacto de benji (36.375rem) y no es múltiplo de 4.
   La escala del taller manda, así que se usa 584 — 2px de diferencia,
   invisible, y la escala queda entera. El de josh (42rem) ya cae justo. */
const BENJI = 584
const JOSH = 672
const STEP = 4

export function useRail() {
  const [riel, setRiel] = useUrlNumber('riel', BENJI, STEP)

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('riel', String(riel))
    history.replaceState(history.state, '', url)
  }, [riel])

  return { riel, setRiel }
}

/* Los números se leen del DOM y no de una tabla: lo que muestra el
   lector es lo que la página mide de verdad. La columna no la dice el
   scrubber —ese muestra el riel— y es la que importa. */
function medir() {
  const el = document.querySelector<HTMLElement>('[data-rail]')
  const w = window.innerWidth
  if (!el) return { w, columna: 0, alBorde: 0 }
  const r = el.getBoundingClientRect()
  const margen = parseFloat(getComputedStyle(el).paddingLeft) || 0
  return {
    w,
    columna: Math.round(r.width - margen * 2),
    alBorde: Math.round(r.left + margen),
  }
}

export function RailScrubber({ riel, setRiel }: { riel: number; setRiel: (v: number) => void }) {
  const [m, setM] = useState(medir)

  useEffect(() => {
    const leer = () => setM(medir())
    leer()
    window.addEventListener('resize', leer)
    /* Mover el scrubber no dispara resize, así que se re-mide cuando el
       layout ya está pintado. */
    const raf = requestAnimationFrame(leer)
    return () => {
      window.removeEventListener('resize', leer)
      cancelAnimationFrame(raf)
    }
  }, [riel])

  const ref = riel === BENJI ? 'benji' : riel === JOSH ? 'josh' : '—'

  return (
    <ScrubberBar>
      <Scrubber
        label="Riel"
        value={riel}
        onChange={setRiel}
        min={BENJI}
        max={JOSH}
        step={STEP}
        tickEvery={16}
        width={300}
      />
      <span className={css.read}>
        <span className={css.cell}>
          <span className={css.cellLabel}>ancho</span>
          {m.w}
        </span>
        <span className={`${css.cell} ${css.col}`}>
          <span className={css.cellLabel}>columna</span>
          {m.columna}
        </span>
        <span className={css.cell}>
          <span className={css.cellLabel}>al borde</span>
          {m.alBorde}
        </span>
        <span className={`${css.cell} ${ref === '—' ? css.refNone : css.ref}`}>
          <span className={css.cellLabel}>ref</span>
          {ref}
        </span>
      </span>
    </ScrubberBar>
  )
}
