import { useEffect, useRef, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — lo único que falta ELEGIR del color: el gris del texto
   secundario. El USO ya quedó horneado como el de benji.

   Cuatro marcas, las cuatro medidas y compuestas sobre el fondo:
      99   emil · su secundario de prosa            5.91:1
     130   emil · sus epígrafes de 12px             3.78:1
     138   lo de hoy, heredado de Carousels         3.39:1
     152   benji · fecha, epígrafes, notas al pie   2.84:1

   Emil parte el gris en DOS donde benji tiene uno solo. Y su fondo es
   (253,253,252) al píxel, el mismo que el de benji y el nuestro.

   raphaelsalaja.com no se pudo medir: la red devuelve una página de
   bloqueo de FortiGate en vez del sitio. */



const MIN = 95
const MAX = 186
export const HOY = 138
export const BENJI = 152
export const EMIL_PROSA = 99
export const EMIL_EPIGRAFE = 130
const MARCAS = [
  { v: EMIL_PROSA, nombre: 'emil prosa' },
  { v: EMIL_EPIGRAFE, nombre: 'emil epígrafe' },
  { v: HOY, nombre: 'hoy' },
  { v: BENJI, nombre: 'benji' },
]

const lum = (c: number) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const contraste = (a: number, b: number) => {
  const [h, l] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)]
  return (h + 0.05) / (l + 0.05)
}
const hex = (v: number) => '#' + v.toString(16).padStart(2, '0').repeat(3)
const alfa = (v: number) => (1 - v / 253).toFixed(3)

export function useLab() {
  const par = new URLSearchParams(location.search)
  const [v, setV] = useState(() => {
    const n = Number(par.get('gris'))
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
      if (e.key === '3') setV(EMIL_PROSA)
      if (e.key === '4') setV(EMIL_EPIGRAFE)
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
        <b>{c.toFixed(2)}:1</b> · alfa equivalente <b>rgba(0,0,0,{alfa(v)})</b>
        {marca ? ` · estás exactamente en ${marca.nombre}` : ''} · ← → de a 1 · <b>1</b> hoy ·{' '}
        <b>2</b> benji · <b>3</b> emil prosa · <b>4</b> emil epígrafe
      </p>
    </div>
  )
}
