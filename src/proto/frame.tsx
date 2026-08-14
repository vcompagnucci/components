import { useEffect, useState } from 'react'
import css from './frame.module.css'
import { Scrubber, ScrubberBar, useUrlNumber } from './scrubber'

/* ⚠ EN ESTUDIO — las dos medidas del marco que quedan abiertas. Se
   borra con src/proto/.

   Los escalones ya se decidieron (los de benji) y están horneados en
   tokens.css y app.module.css: 768 mueve aire arriba y margen juntos,
   1080 se lleva el índice. Acá no hay nada de eso.

   RIEL — cuánto mide, entre las dos referencias. El margen no se toca:
   es 16 arriba de 768 y 24 abajo, ya horneado, así que la columna es
   riel − 32 en escritorio y va de 552 a 640.

   AIRE ↓ — cuánto queda después de la última pieza. Es el único número
   del marco que NO sale de las referencias: los dos cierran corto
   (benji 40, josh 64) porque abajo tienen footer, y nosotros no vamos a
   tener. Las marcas del control muestran dónde caen ellos igual, para
   tener con qué comparar, pero acá su número no es un argumento. */

/* 582 es el número exacto de benji (36.375rem) y no es múltiplo de 4.
   La escala del taller manda, así que se usa 584 — 2px de diferencia,
   invisible, y la escala queda entera. El de josh (42rem) ya cae justo. */
const RIEL = { benji: 584, josh: 672 }
/* El recorrido del aire de abajo llega más allá de los dos referentes en
   las dos direcciones: sin footer que lo cierre, el rango honesto no es
   el de ellos. Arranca en lo que tenemos hoy. */
const AIRE = { min: 40, max: 160, inicio: 128 }
const STEP = 4

export function useFrame() {
  const [riel, setRiel] = useUrlNumber('riel', RIEL.benji, STEP)
  const [aire, setAire] = useUrlNumber('aire', AIRE.inicio, STEP)

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('riel', String(riel))
    url.searchParams.set('aire', String(aire))
    history.replaceState(history.state, '', url)
  }, [riel, aire])

  return { riel, setRiel, aire, setAire }
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

export function FrameScrubbers({
  riel,
  setRiel,
  aire,
  setAire,
}: {
  riel: number
  setRiel: (v: number) => void
  aire: number
  setAire: (v: number) => void
}) {
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

  const ref = riel === RIEL.benji ? 'benji' : riel === RIEL.josh ? 'josh' : '—'

  return (
    <ScrubberBar>
      <Scrubber
        label="Riel"
        value={riel}
        onChange={setRiel}
        min={RIEL.benji}
        max={RIEL.josh}
        step={STEP}
        tickEvery={16}
        width={228}
      />
      <Scrubber
        label="Aire ↓"
        value={aire}
        onChange={setAire}
        min={AIRE.min}
        max={AIRE.max}
        step={STEP}
        tickEvery={32}
        marks={[40, 64]} /* benji y josh */
        width={228}
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
          <span className={css.cellLabel}>ref riel</span>
          {ref}
        </span>
      </span>
    </ScrubberBar>
  )
}
