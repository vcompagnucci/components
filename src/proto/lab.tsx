import { useEffect, useRef, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — el laboratorio de la PROPORCIÓN de la card. Se borra
   entero con src/proto/; lo que sobrevive es la regla elegida, escrita
   en tokens.css.

   Dos controles porque son dos preguntas: qué REGLA gobierna la caja
   (una altura, o una proporción) y, si es una altura, CUÁL. El segundo
   es un tamaño, así que va con scrubber. */

export type Regla = { id: string; titulo: string; ratio: string | null; nota: string }

export const REGLAS: Regla[] = [
  { id: 'fija', titulo: 'altura fija', ratio: null, nota: 'la de benji' },
  { id: '16:9', titulo: '16:9', ratio: '16 / 9', nota: 'la de video' },
  { id: '3:2', titulo: '3:2', ratio: '3 / 2', nota: 'la de foto' },
  { id: '4:3', titulo: '4:3', ratio: '4 / 3', nota: 'la de josh' },
]

/* Múltiplos de 4: el alto de la card es espaciado de página, no interior
   de componente. La proporción no puede cumplirlo y ese es justamente
   uno de los puntos de la decisión. */
const MIN = 200
const MAX = 400
const PASO = 4

export function useLab() {
  const [id, setId] = useState(() => {
    const q = new URLSearchParams(location.search).get('card')?.split('-')[0]
    return REGLAS.some((r) => r.id === q) ? (q as string) : 'fija'
  })
  const [alto, setAlto] = useState(() => {
    const n = Number(new URLSearchParams(location.search).get('card')?.split('-')[1])
    return Number.isFinite(n) && n >= MIN && n <= MAX ? n : 280
  })

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('card', `${id}-${alto}`)
    history.replaceState(history.state, '', url)
  }, [id, alto])

  const regla = REGLAS.find((r) => r.id === id) ?? REGLAS[0]
  const vars = regla.ratio
    ? { '--card-alto': 'auto', '--card-ratio': regla.ratio }
    : { '--card-alto': `${alto}px`, '--card-ratio': 'auto' }

  return { regla, setId, alto, setAlto, vars: vars as React.CSSProperties }
}

/* El scrubber. Arrastrás en cualquier parte de la barra y el relleno va
   hasta el valor; las marcas son cada 25 para tener referencia sin
   contar. En modo proporción no se toca y muestra, en gris, el alto que
   la proporción está dando de verdad — medido del DOM y no calculado,
   porque el ancho de la columna cambia con el viewport. */
function Scrubber({
  alto,
  setAlto,
  bloqueado,
  medido,
}: {
  alto: number
  setAlto: (v: number) => void
  bloqueado: boolean
  medido: number | null
}) {
  const barra = useRef<HTMLDivElement>(null)

  const desde = (clientX: number) => {
    const r = barra.current?.getBoundingClientRect()
    if (!r) return
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    setAlto(Math.round((MIN + t * (MAX - MIN)) / PASO) * PASO)
  }

  const valor = bloqueado ? (medido ?? 0) : alto
  const pct = ((valor - MIN) / (MAX - MIN)) * 100

  return (
    <div
      ref={barra}
      className={css.scrubber}
      data-bloqueado={bloqueado ? '' : undefined}
      role="slider"
      aria-label="Altura de la card"
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={valor}
      tabIndex={bloqueado ? -1 : 0}
      onPointerDown={(e) => {
        if (bloqueado) return
        e.currentTarget.setPointerCapture(e.pointerId)
        desde(e.clientX)
      }}
      onPointerMove={(e) => {
        if (bloqueado || !e.currentTarget.hasPointerCapture(e.pointerId)) return
        desde(e.clientX)
      }}
      onKeyDown={(e) => {
        if (bloqueado) return
        if (e.key === 'ArrowLeft') setAlto(Math.max(MIN, alto - PASO))
        if (e.key === 'ArrowRight') setAlto(Math.min(MAX, alto + PASO))
      }}
    >
      <div className={css.relleno} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      <div className={css.marcas} aria-hidden />
      <span className={css.etiqueta}>Altura</span>
      <span className={css.valor}>{valor ? Math.round(valor) : '—'}</span>
    </div>
  )
}

export function LabPanel({
  regla,
  setId,
  alto,
  setAlto,
}: {
  regla: Regla
  setId: (v: string) => void
  alto: number
  setAlto: (v: number) => void
}) {
  const [medido, setMedido] = useState<number | null>(null)

  /* Lo que la proporción está dando en pantalla ahora mismo. Se relee en
     resize porque abajo de 768 la columna deja de ser fija. */
  useEffect(() => {
    const leer = () => {
      const el = document.querySelector('[data-card]')
      setMedido(el ? el.getBoundingClientRect().height : null)
    }
    leer()
    window.addEventListener('resize', leer)
    return () => window.removeEventListener('resize', leer)
  }, [regla])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return
      const n = Number.parseInt(ev.key, 10)
      if (n >= 1 && n <= REGLAS.length) return setId(REGLAS[n - 1].id)
      if (!regla.ratio && ev.key === 'ArrowLeft') setAlto(Math.max(MIN, alto - PASO))
      if (!regla.ratio && ev.key === 'ArrowRight') setAlto(Math.min(MAX, alto + PASO))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [regla, setId, alto, setAlto])

  return (
    <nav className={css.panel} aria-label="Laboratorio de la card">
      {REGLAS.map((r, i) => (
        <button
          key={r.id}
          className={css.sw}
          data-on={r.id === regla.id ? '' : undefined}
          aria-pressed={r.id === regla.id}
          onClick={() => setId(r.id)}
        >
          <span>
            <span className={css.tecla}>{i + 1}</span> {r.titulo}
          </span>
          <span className={css.estado}>{r.nota}</span>
        </button>
      ))}
      <Scrubber alto={alto} setAlto={setAlto} bloqueado={!!regla.ratio} medido={medido} />
    </nav>
  )
}
