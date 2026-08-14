import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import app from '../app.module.css'
import css from './rulers.module.css'

/* Reglas de medición. No hay ningún número escrito acá: todo sale de
   getBoundingClientRect sobre el DOM real, así que lo que se lee en
   pantalla es lo que la página mide de verdad. Si un valor cambia por
   CSS, por el picker o por el ancho de la ventana, la regla lo sigue.

   Una por espaciado que se repite, no una por instancia: de las 18
   filas se mide el hueco de las dos primeras y alcanza, porque el resto
   es la misma regla CSS. */

type Gap = { name: string; top: number; height: number }

const q = (cls: string) => document.querySelector<HTMLElement>('.' + cls)
const qa = (cls: string) => [...document.querySelectorAll<HTMLElement>('.' + cls)]

/* Coordenadas del documento, no del viewport: así las reglas quedan
   pegadas al contenido y no flotan cuando scrolleás. */
const box = (el: Element) => {
  const r = el.getBoundingClientRect()
  return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, left: r.left }
}

function measure(): { gaps: Gap[]; x: number } {
  const gaps: Gap[] = []
  const add = (name: string, from: number, to: number) => {
    const height = to - from
    if (height > 0.5) gaps.push({ name, top: from, height })
  }

  const title = q(app.mastTitle)
  const sub = q(app.mastSub)
  const heads = qa(app.groupHead)
  const items = qa(app.streamItem)
  const sections = qa(app.group)
  const content = q(app.content)

  if (title) add('aire superior', 0, box(title).top)
  if (sub && heads[0]) add('masthead → sección', box(sub).bottom, box(heads[0]).top)
  if (heads[0] && items[0]) add('rótulo → pieza', box(heads[0]).bottom, box(items[0]).top)

  const t = q(app.streamTitle)
  const p = q(app.streamPreview)
  if (t && p) add('título → preview', box(t).bottom, box(p).top)

  if (items[0] && items[1]) add('entre piezas', box(items[0]).bottom, box(items[1]).top)

  /* Entre secciones: de la última pieza de la primera al rótulo de la
     segunda. Se busca dentro de la sección y no en la lista global,
     porque "la última de la primera" no es "la anterior a la segunda"
     si alguna sección quedara vacía. */
  if (sections[1]) {
    const lastOfFirst = sections[0].querySelectorAll<HTMLElement>('.' + app.streamItem)
    const head2 = sections[1].querySelector('.' + app.groupHead)
    const last = lastOfFirst[lastOfFirst.length - 1]
    if (last && head2) add('entre secciones', box(last).bottom, box(head2).top)
  }

  /* A la izquierda del riel si hay lugar; si no, adentro pegado al
     borde. Nunca encima del índice. */
  const left = content ? box(content).left : 24
  const index = q(app.index)
  const indexRight = index ? index.getBoundingClientRect().right : 0
  const outside = left - 36
  const x = outside > indexRight + 12 ? outside : left + 12

  return { gaps, x }
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

export function Rulers({ deps }: { deps: unknown }) {
  const [on, setOn] = useState(() => localStorage.getItem('rulers') === '1')
  const [state, setState] = useState<{ gaps: Gap[]; x: number }>({ gaps: [], x: 0 })

  const read = useCallback(() => setState(measure()), [])

  useLayoutEffect(() => {
    if (!on) return
    read()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, deps, read])

  useEffect(() => {
    if (!on) return
    /* El body cambia de alto cuando cambia cualquier espaciado: es la
       señal más barata para re-medir sin sondear en cada frame. */
    const ro = new ResizeObserver(read)
    ro.observe(document.body)
    window.addEventListener('resize', read)
    /* Las webfonts entran después del primer pintado y mueven todo. */
    document.fonts?.ready.then(read)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', read)
    }
  }, [on, read])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'g' || e.key === 'G') setOn((v) => !v)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    localStorage.setItem('rulers', on ? '1' : '0')
  }, [on])

  return (
    <>
      {on && (
        <div className={css.layer} aria-hidden>
          {state.gaps.map((g) => (
            <div
              key={g.name}
              className={css.ruler}
              style={{ top: g.top, height: g.height, left: state.x }}
            >
              <span className={css.label}>
                {fmt(g.height)}
                <span className={css.name}>{g.name}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      <button
        className={css.toggle}
        data-on={on ? '' : undefined}
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
      >
        <span className={css.dot} aria-hidden />
        Rulers
      </button>
    </>
  )
}
