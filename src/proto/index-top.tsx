import { useEffect, useState } from 'react'
import css from './index-top.module.css'
import { Scrubber, ScrubberBar, useUrlNumber } from './scrubber'

/* ⚠ EN ESTUDIO — dónde arranca el índice lateral. Se borra con
   src/proto/.

   Hoy está a 80, alineado con el título de la página. La idea es
   bajarlo hasta donde arranca la primera pieza, para que el índice y la
   lista empiecen juntos.

   Benji lo tiene a 80 también, pero adentro de su aside hay un botón
   "← Index" de 28 y después 30 de padding, así que su nav real arranca
   a ~138 — 58 por debajo de su título de página. Nosotros no tenemos
   ese botón, así que el número tiene que salir de mirar la página. */

const MIN = 80
const MAX = 320
const STEP = 4
const HOY = 80

export function useIndexTop() {
  const [top, setTop] = useUrlNumber('itop', HOY, STEP, MIN, MAX)

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('itop', String(top))
    history.replaceState(history.state, '', url)
  }, [top])

  return { top, setTop }
}

/* Dónde está de verdad el primer título de pieza y el primer borde de
   card, medidos del DOM. Son los dos candidatos razonables de
   alineación, y verlos en vivo evita elegir el número a ciegas. */
function medir() {
  const t = document.querySelector<HTMLElement>('[data-primera-pieza]')
  const c = t?.nextElementSibling as HTMLElement | null
  const y = (el: HTMLElement | null | undefined) =>
    el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 0
  return { titulo: y(t), card: y(c) }
}

export function IndexTopScrubber({ top, setTop }: { top: number; setTop: (v: number) => void }) {
  const [m, setM] = useState(medir)

  useEffect(() => {
    const leer = () => setM(medir())
    const raf = requestAnimationFrame(leer)
    window.addEventListener('resize', leer)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', leer)
    }
  }, [top])

  return (
    <ScrubberBar>
      <Scrubber
        label="Índice · top"
        value={top}
        onChange={setTop}
        min={MIN}
        max={MAX}
        step={STEP}
        tickEvery={40}
        marks={[m.titulo, m.card].filter((v) => v >= MIN && v <= MAX)}
        width={300}
      />
      <span className={css.read}>
        <span className={css.cell}>
          <span className={css.cellLabel}>1er título</span>
          {m.titulo}
        </span>
        <span className={css.cell}>
          <span className={css.cellLabel}>1er card</span>
          {m.card}
        </span>
        <span className={`${css.cell} ${top === m.titulo || top === m.card ? css.hit : css.miss}`}>
          <span className={css.cellLabel}>alineado</span>
          {top === m.titulo ? 'título' : top === m.card ? 'card' : '—'}
        </span>
      </span>
    </ScrubberBar>
  )
}
