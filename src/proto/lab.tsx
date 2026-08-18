import { useEffect, useRef, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — el gris del texto secundario. Se borra entero con
   src/proto/.

   Sólo se mueve --text-secondary. --type-nav-c queda fijo en
   rgba(18,18,18,.4), que es el de benji verificado y es idéntico en las
   dos posiciones de referencia: así hay una sola variable en juego.

   El slider corre sobre el gris COMPUESTO sobre el canvas, no sobre el
   alfa: es el número que se ve y del que sale el contraste. Más alto es
   más claro. Abajo se muestra el alfa equivalente, porque benji lo
   escribe así y compone bien sobre cualquier superficie.

   Las dos marcas son las dos referencias reales:
     138  lo de hoy, #8a8a8a, heredado del design.md de Carousels
     152  benji, rgba(0,0,0,.4) compuesto — su <time>, 68 usos en liveline

   AA pide 4.5:1 para texto normal, o sea 115 o menos. Ninguna de las dos
   llega, y todo lo que está a la derecha se aleja más. */

const MIN = 130
const MAX = 186
export const HOY = 138
export const BENJI = 152

const MARCAS = [
  { v: HOY, nombre: 'hoy' },
  { v: BENJI, nombre: 'benji' },
]

const lum = (c: number) => {
  const v = c / 255
  const f = v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  return f
}
const contraste = (a: number, b: number) => {
  const [h, l] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)]
  return (h + 0.05) / (l + 0.05)
}
const hex = (v: number) => '#' + v.toString(16).padStart(2, '0').repeat(3)
/* El alfa de negro que, sobre el canvas 253, compone en este gris. */
const alfa = (v: number) => (1 - v / 253).toFixed(3)

export function useLab() {
  const [v, setV] = useState(() => {
    const n = Number(new URLSearchParams(location.search).get('gris'))
    return Number.isFinite(n) && n >= MIN && n <= MAX ? n : HOY
  })

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('gris', String(v))
    history.replaceState(history.state, '', url)
  }, [v])

  useEffect(() => {
    const raiz = document.documentElement
    raiz.style.setProperty('--text-secondary', hex(v))
    return () => {
      raiz.style.removeProperty('--text-secondary')
    }
  }, [v])

  return { v, setV }
}

export function LabPanel({ v, setV }: { v: number; setV: (n: number) => void }) {
  const barra = useRef<HTMLDivElement>(null)
  const pct = (n: number) => ((n - MIN) / (MAX - MIN)) * 100

  const desde = (clientX: number) => {
    const r = barra.current?.getBoundingClientRect()
    if (!r) return
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    setV(Math.round(MIN + t * (MAX - MIN)))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft') setV(Math.max(MIN, v - 1))
      if (e.key === 'ArrowRight') setV(Math.min(MAX, v + 1))
      if (e.key === '1') setV(HOY)
      if (e.key === '2') setV(BENJI)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [v, setV])

  const c = contraste(v, 253)
  const marca = MARCAS.find((m) => m.v === v)

  return (
    <div className={css.panel}>
      <div className={css.pista}>
        <div
          ref={barra}
          className={css.scrubber}
          role="slider"
          aria-label="Gris del texto secundario"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={v}
          tabIndex={0}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            desde(e.clientX)
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) desde(e.clientX)
          }}
        >
          <div className={css.relleno} style={{ width: `${pct(v)}%` }} />
          {MARCAS.map((m) => (
            <span key={m.v} className={css.marca} style={{ left: `${pct(m.v)}%` }} />
          ))}
          <span className={css.etiqueta}>Secundario</span>
          <span className={css.muestraCaja}>
            <span className={css.muestra} style={{ background: hex(v) }} />
          </span>
          <span className={css.valor}>{hex(v)}</span>
        </div>
        <div className={css.regla}>
          {MARCAS.map((m) => (
            <button
              key={m.v}
              className={css.numero}
              data-on={m.v === v ? '' : undefined}
              style={{ left: `${pct(m.v)}%` }}
              onClick={() => setV(m.v)}
            >
              {m.nombre} · {m.v}
            </button>
          ))}
        </div>
      </div>
      <p className={css.leyenda}>
        <b>{c.toFixed(2)}:1</b> · alfa equivalente <b>rgba(0,0,0,{alfa(v)})</b> ·{' '}
        {c >= 4.5 ? 'pasa AA' : `AA pediría ${115} o menos`}
        {marca ? ` · estás exactamente en ${marca.nombre}` : ''}
      </p>
      <p className={css.leyenda}>
        ← → mueve de a 1 · <b>1</b> salta a hoy · <b>2</b> salta a benji. A la derecha de la marca
        de benji queda más claro que él; el nav no se mueve, sigue en rgba(18,18,18,.4)
      </p>
    </div>
  )
}
