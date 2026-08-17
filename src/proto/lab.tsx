import { useEffect, useRef, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — lo único que queda abierto de la card: cuánto mide de
   alto en Web. Se borra entero con src/proto/.

   Un solo control, porque es una sola pregunta. Las proporciones y el
   "por contenido" estuvieron acá y salieron: los seis casos medidos en
   .context/recon/CARDS.md dicen que lo vivo lleva altura fija, y App ya
   quedó resuelta con el hueco del teléfono.

   Cada marca del scrubber es un valor real de una de las dos
   referencias, así que la barra no es un rango abstracto: es el mapa de
   lo que ellos hacen. */

const ALTURAS = [
  { alto: 180, fuente: 'benji · liveline — el más bajo de la página, ×1' },
  { alto: 200, fuente: 'benji · liveline — el más usado, ×9 de 21' },
  { alto: 220, fuente: 'benji · liveline — ×4, uno con caja #111 y radio 8' },
  { alto: 240, fuente: 'benji · liveline — ×1' },
  { alto: 260, fuente: 'benji · liveline — el segundo más usado, ×4' },
  { alto: 280, fuente: 'benji · liveline ×1 — y el nuestro de hoy, que nadie decidió' },
  { alto: 300, fuente: 'benji · liveline — el más alto de la página, ×1' },
  { alto: 400, fuente: 'benji · drawesome — .styles_frame{height:400px}, radio 14 sobre #fdfcf8' },
  { alto: 480, fuente: 'josh · bloom (624×480, radio 32) — y benji abajo de 680, height:30rem' },
]

const MIN = ALTURAS[0].alto
const MAX = ALTURAS[ALTURAS.length - 1].alto
const PASO = 4

export function useLab() {
  const [alto, setAlto] = useState(() => {
    const n = Number(new URLSearchParams(location.search).get('card'))
    return Number.isFinite(n) && n >= MIN && n <= MAX ? n : 280
  })

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('card', String(alto))
    history.replaceState(history.state, '', url)
  }, [alto])

  return { alto, setAlto, vars: { '--card-alto': `${alto}px` } as React.CSSProperties }
}

export function LabPanel({ alto, setAlto }: { alto: number; setAlto: (v: number) => void }) {
  const barra = useRef<HTMLDivElement>(null)
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100

  const desde = (clientX: number) => {
    const r = barra.current?.getBoundingClientRect()
    if (!r) return
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    setAlto(Math.round((MIN + t * (MAX - MIN)) / PASO) * PASO)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft') setAlto(Math.max(MIN, alto - PASO))
      if (e.key === 'ArrowRight') setAlto(Math.min(MAX, alto + PASO))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [alto, setAlto])

  const exacta = ALTURAS.find((m) => m.alto === alto)

  return (
    <div className={css.panel}>
      <div
        ref={barra}
        className={css.scrubber}
        role="slider"
        aria-label="Altura de la card en Web"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={alto}
        tabIndex={0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          desde(e.clientX)
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) desde(e.clientX)
        }}
      >
        <div className={css.relleno} style={{ width: `${pct(alto)}%` }} />
        {ALTURAS.map((m) => (
          <span key={m.alto} className={css.marca} style={{ left: `${pct(m.alto)}%` }} />
        ))}
        <span className={css.etiqueta}>Altura Web</span>
        <span className={css.valor}>{alto}</span>
      </div>
      <div className={css.regla}>
        {ALTURAS.map((m) => (
          <button
            key={m.alto}
            className={css.numero}
            data-on={m.alto === alto ? '' : undefined}
            style={{ left: `${pct(m.alto)}%` }}
            onClick={() => setAlto(m.alto)}
          >
            {m.alto}
          </button>
        ))}
      </div>
      <p className={css.leyenda}>
        {exacta?.fuente ?? `${alto} — entre medidas. No es de ninguno de los dos`}
      </p>
    </div>
  )
}
