import { useEffect, useState } from 'react'
import { baseDeTexto } from '../parts'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — el laboratorio de la ALINEACIÓN del índice. Se borra
   entero con src/proto/; lo único que sobrevive es el par elegido, que
   pasa a estar escrito a mano en app.tsx.

   Un picker y no interruptores: las cinco opciones son excluyentes, no
   se combinan. Sí es independiente el switch de reglas, porque es una
   ayuda para mirar y no parte de la decisión. */

export type Par = { desde: string; hasta: string }

export type Opcion = {
  id: string
  titulo: string
  detalle: string
  par: Par
}

export const OPCIONES: Opcion[] = [
  {
    id: 'A',
    titulo: 'link ↔ pieza',
    detalle: '"Button" con "Button"',
    par: { desde: '[data-primer-link]', hasta: '[data-primera-pieza]' },
  },
  {
    id: 'B',
    titulo: 'rótulo ↔ separador',
    detalle: '"Web" con "Web"',
    par: { desde: '[data-primer-rotulo]', hasta: '[data-primer-separador]' },
  },
  {
    id: 'C',
    titulo: 'rótulo ↔ pieza',
    detalle: '"Web" con "Button"',
    par: { desde: '[data-primer-rotulo]', hasta: '[data-primera-pieza]' },
  },
]

export function useLab() {
  const [id, setId] = useState(() => {
    const q = new URLSearchParams(location.search).get('al')
    return OPCIONES.some((o) => o.id === q) ? (q as string) : 'A'
  })
  const [reglas, setReglas] = useState(
    () => new URLSearchParams(location.search).get('reglas') === '1',
  )

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('al', id)
    url.searchParams.set('reglas', reglas ? '1' : '0')
    history.replaceState(history.state, '', url)
  }, [id, reglas])

  const opcion = OPCIONES.find((o) => o.id === id) ?? OPCIONES[0]
  return { id, setId, reglas, setReglas, opcion, par: opcion.par }
}

/* Las reglas: una línea roja de lado a lado apoyada en la BASE de cada
   uno de los dos participantes, más un recuadro sobre cada uno para que
   se vea CUÁLES dos son. Si la alineación está bien, las dos líneas son
   una sola.

   La base y no el medio: es por donde se alinean dos textos de tamaños
   distintos, y es lo mismo que mide la alineación — si la regla midiera
   otra cosa que el cálculo, estaría mintiendo.

   El recuadro encierra el renglón y no la caja de borde: si encerrara
   la caja, el rótulo del índice aparecería con sus 16px de aire adentro
   y la regla parecería mal puesta estando bien.

   Se recalcula en scroll y resize porque uno de los dos elementos se
   mueve con la página y el otro está fijo. */
function Reglas({ par }: { par: Par }) {
  /* y = la base, donde va la línea. top/h = el renglón, donde va el marco. */
  const [cajas, setCajas] = useState<
    { y: number; top: number; x: number; w: number; h: number }[]
  >([])

  useEffect(() => {
    let pedido = 0
    const leer = () => {
      pedido = 0
      const els = [par.desde, par.hasta].map((s) => document.querySelector<HTMLElement>(s))
      if (els.some((e) => !e)) return setCajas([])
      setCajas(
        els.map((n) => {
          const el = n as HTMLElement
          const r = el.getBoundingClientRect()
          const s = getComputedStyle(el)
          const h = Number.parseFloat(s.lineHeight) || r.height
          const base = baseDeTexto(el)
          const arriba = Number.parseFloat(s.paddingTop) || 0
          return { y: base, x: r.left, w: r.width, h, top: r.top + arriba }
        }),
      )
    }
    const pedir = () => {
      if (!pedido) pedido = requestAnimationFrame(leer)
    }
    leer()
    window.addEventListener('scroll', pedir, { passive: true })
    window.addEventListener('resize', pedir)
    return () => {
      if (pedido) cancelAnimationFrame(pedido)
      window.removeEventListener('scroll', pedir)
      window.removeEventListener('resize', pedir)
    }
  }, [par])

  return (
    <div className={css.reglas} aria-hidden>
      {cajas.map((c, i) => (
        <div key={i}>
          <div className={css.linea} style={{ top: c.y }} />
          <div
            className={css.marco}
            style={{ top: c.top, left: c.x, width: c.w, height: c.h }}
          />
        </div>
      ))}
    </div>
  )
}

export function LabPanel({
  id,
  setId,
  reglas,
  setReglas,
  par,
}: {
  id: string
  setId: (v: string) => void
  reglas: boolean
  setReglas: (v: boolean) => void
  par: Par
}) {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return
      if (ev.key.toLowerCase() === 'r') return setReglas(!reglas)
      const n = Number.parseInt(ev.key, 10)
      if (n >= 1 && n <= OPCIONES.length) setId(OPCIONES[n - 1].id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [id, setId, reglas, setReglas])

  return (
    <>
      {reglas && <Reglas par={par} />}
      <nav className={css.panel} aria-label="Laboratorio de alineación">
        {OPCIONES.map((o, i) => (
          <button
            key={o.id}
            className={css.sw}
            data-on={o.id === id ? '' : undefined}
            aria-pressed={o.id === id}
            onClick={() => setId(o.id)}
          >
            <span>
              <span className={css.tecla}>{i + 1}</span> {o.titulo}
            </span>
            <span className={css.estado}>{o.detalle}</span>
          </button>
        ))}
        <button
          className={css.sw}
          data-on={reglas ? '' : undefined}
          aria-pressed={reglas}
          onClick={() => setReglas(!reglas)}
        >
          <span>
            <span className={css.tecla}>R</span> Reglas
          </span>
          <span className={css.estado}>{reglas ? 'a la vista' : 'ocultas'}</span>
        </button>
      </nav>
    </>
  )
}
