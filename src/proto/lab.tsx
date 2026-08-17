import { useEffect, useRef, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — el laboratorio de la caja de la pieza. Se borra entero
   con src/proto/; lo que sobrevive es la regla elegida, en tokens.css.

   Todo lo de acá está MEDIDO en las dos referencias, SOURCE (el CSS que
   sirven) + RUNTIME (Playwright a 1440·768·680·390). El detalle completo
   está en .context/recon/CARDS.md. Nada de esto es inventado, y lo que
   sí lo es está marcado como tal. */

export type Medida = {
  alto: number
  nombre: string
  fuente: string
}

/* ── ALTURAS FIJAS ──
   Es lo que hacen los dos cuando adentro hay algo que corre. Seis casos
   medidos y ninguno usa proporción para contenido vivo. */
export const ALTURAS: Medida[] = [
  { alto: 180, nombre: '180', fuente: 'benji · liveline — el más bajo de la página, ×1' },
  { alto: 200, nombre: '200', fuente: 'benji · liveline — el más usado, ×9 de 21' },
  { alto: 220, nombre: '220', fuente: 'benji · liveline — ×4, uno de ellos con caja #111 y radio 8' },
  { alto: 240, nombre: '240', fuente: 'benji · liveline — ×1' },
  { alto: 260, nombre: '260', fuente: 'benji · liveline — el segundo más usado, ×4' },
  { alto: 280, nombre: '280', fuente: 'benji · liveline ×1 — y es el nuestro de hoy, que nadie decidió' },
  { alto: 300, nombre: '300', fuente: 'benji · liveline — el más alto de la página, ×1' },
  { alto: 400, nombre: '400', fuente: 'benji · drawesome — .styles_frame{height:400px}, radio 14 sobre #fdfcf8' },
  { alto: 480, nombre: '480', fuente: 'josh · bloom (624×480, radio 32) — y benji abajo de 680: height:30rem' },
]

/* ── PROPORCIONES ──
   Ninguna de las dos las usa para algo vivo. Aparecen sólo donde el
   contenido es una imagen quieta. */
export type Ratio = { id: string; ratio: string; nombre: string; fuente: string; medido: boolean }

export const RATIOS: Ratio[] = [
  {
    id: '4:3',
    ratio: '4 / 3',
    nombre: '4:3',
    fuente: 'josh · pasito — ×3, siempre con un <img object-cover> adentro. Radio 16',
    medido: true,
  },
  {
    id: '1:1',
    ratio: '1 / 1',
    nombre: '1:1',
    fuente: 'benji — su ÚNICO aspect-ratio en todo el sitio, y es una miniatura de imagen',
    medido: true,
  },
  {
    id: '16:9',
    ratio: '16 / 9',
    nombre: '16:9',
    fuente: 'nuestro detalle de hoy. No sale de ninguno de los dos',
    medido: false,
  },
  {
    id: '3:2',
    ratio: '3 / 2',
    nombre: '3:2',
    fuente: 'la de foto. No sale de ninguno de los dos',
    medido: false,
  },
]

/* ── POR CONTENIDO ──
   La caja no declara alto: lo pone lo que hay adentro más el padding. */
export const CONTENIDO = {
  fuente:
    'benji · family-values — 45 cajas con padding 40/60, radio 8, #fcfcfc y anillo 1px #f2f2f2. Sin height y sin aspect-ratio: salen 5 altos (346.3 · 367.8 · 442.7 · 475.3 · 532.4), ninguno múltiplo de 4',
}

const MIN = ALTURAS[0].alto
const MAX = ALTURAS[ALTURAS.length - 1].alto
const PASO = 4

type Modo = 'alto' | 'ratio' | 'contenido'

export function useLab() {
  const [modo, setModo] = useState<Modo>(() => {
    const q = new URLSearchParams(location.search).get('card')?.split('-')[0]
    return q === 'ratio' || q === 'contenido' ? q : 'alto'
  })
  const [alto, setAlto] = useState(() => {
    const n = Number(new URLSearchParams(location.search).get('card')?.split('-')[1])
    return Number.isFinite(n) && n >= MIN && n <= MAX ? n : 280
  })
  const [ratioId, setRatioId] = useState(() => {
    const v = new URLSearchParams(location.search).get('card')?.split('-')[1]
    return RATIOS.some((r) => r.id === v) ? (v as string) : '4:3'
  })

  useEffect(() => {
    const url = new URL(location.href)
    const cola = modo === 'alto' ? `-${alto}` : modo === 'ratio' ? `-${ratioId}` : ''
    url.searchParams.set('card', `${modo}${cola}`)
    history.replaceState(history.state, '', url)
  }, [modo, alto, ratioId])

  const ratio = RATIOS.find((r) => r.id === ratioId) ?? RATIOS[0]
  const vars =
    modo === 'alto'
      ? { '--card-alto': `${alto}px`, '--card-ratio': 'auto' }
      : modo === 'ratio'
        ? { '--card-alto': 'auto', '--card-ratio': ratio.ratio }
        : { '--card-alto': 'auto', '--card-ratio': 'auto' }

  return {
    modo,
    setModo,
    alto,
    setAlto,
    ratio,
    setRatioId,
    vars: vars as React.CSSProperties,
  }
}

/* El scrubber, con las medidas marcadas encima. Cada marca es un valor
   real de una de las dos referencias, así que la barra no es un rango
   abstracto: es el mapa de lo que ellos hacen. Se puede arrastrar entre
   marcas, y ahí la leyenda avisa que ese valor no es de nadie. */
function Scrubber({ alto, setAlto }: { alto: number; setAlto: (v: number) => void }) {
  const barra = useRef<HTMLDivElement>(null)
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100

  const desde = (clientX: number) => {
    const r = barra.current?.getBoundingClientRect()
    if (!r) return
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    setAlto(Math.round((MIN + t * (MAX - MIN)) / PASO) * PASO)
  }

  return (
    <div className={css.pista}>
      <div
        ref={barra}
        className={css.scrubber}
        role="slider"
        aria-label="Altura de la card"
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
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setAlto(Math.max(MIN, alto - PASO))
          if (e.key === 'ArrowRight') setAlto(Math.min(MAX, alto + PASO))
        }}
      >
        <div className={css.relleno} style={{ width: `${pct(alto)}%` }} />
        {ALTURAS.map((m) => (
          <span key={m.alto} className={css.marca} style={{ left: `${pct(m.alto)}%` }} />
        ))}
        <span className={css.etiqueta}>Altura</span>
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
            {m.nombre}
          </button>
        ))}
      </div>
    </div>
  )
}

export function LabPanel({
  modo,
  setModo,
  alto,
  setAlto,
  ratio,
  setRatioId,
}: {
  modo: Modo
  setModo: (v: Modo) => void
  alto: number
  setAlto: (v: number) => void
  ratio: Ratio
  setRatioId: (v: string) => void
}) {
  const [medido, setMedido] = useState<number | null>(null)

  useEffect(() => {
    const leer = () => {
      const el = document.querySelector('[data-card]')
      setMedido(el ? Math.round(el.getBoundingClientRect().height * 10) / 10 : null)
    }
    leer()
    const t = setTimeout(leer, 60)
    window.addEventListener('resize', leer)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', leer)
      }
  }, [modo, alto, ratio])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return
      if (ev.key === 'a') return setModo('alto')
      if (ev.key === 'c') return setModo('contenido')
      const n = Number.parseInt(ev.key, 10)
      if (n >= 1 && n <= RATIOS.length) {
        setModo('ratio')
        return setRatioId(RATIOS[n - 1].id)
      }
      if (modo === 'alto' && ev.key === 'ArrowLeft') setAlto(Math.max(MIN, alto - PASO))
      if (modo === 'alto' && ev.key === 'ArrowRight') setAlto(Math.min(MAX, alto + PASO))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [modo, setModo, alto, setAlto, setRatioId])

  const exacta = ALTURAS.find((m) => m.alto === alto)
  const leyenda =
    modo === 'alto'
      ? (exacta?.fuente ?? `${alto} — entre medidas. No es de ninguno de los dos`)
      : modo === 'ratio'
        ? ratio.fuente
        : CONTENIDO.fuente

  return (
    <div className={css.panel} role="group" aria-label="Laboratorio de la caja">
      <div className={css.fila}>
        <button
          className={css.sw}
          data-on={modo === 'alto' ? '' : undefined}
          onClick={() => setModo('alto')}
        >
          <span>
            <span className={css.tecla}>A</span> Altura fija
          </span>
          <span className={css.estado}>vivo · lo que hacen los dos</span>
        </button>
        <span className={css.rubro}>Proporción</span>
        {RATIOS.map((r, i) => (
          <button
            key={r.id}
            className={css.sw}
            data-on={modo === 'ratio' && r.id === ratio.id ? '' : undefined}
            data-inventado={r.medido ? undefined : ''}
            onClick={() => {
              setModo('ratio')
              setRatioId(r.id)
            }}
          >
            <span>
              <span className={css.tecla}>{i + 1}</span> {r.nombre}
            </span>
            <span className={css.estado}>{r.medido ? 'medido' : 'de nadie'}</span>
          </button>
        ))}
        <button
          className={css.sw}
          data-on={modo === 'contenido' ? '' : undefined}
          onClick={() => setModo('contenido')}
        >
          <span>
            <span className={css.tecla}>C</span> Por contenido
          </span>
          <span className={css.estado}>quieto · family-values</span>
        </button>
        <span className={css.medido}>
          en pantalla <b>{medido ?? '—'}</b>
        </span>
      </div>

      <Scrubber alto={alto} setAlto={setAlto} />

      <p className={css.leyenda}>
        <b>Web</b> {leyenda}
      </p>
      {/* App ya está decidida y no la toca el scrubber: la sección la fija
          en app.module.css. Se muestra igual, para que no parezca que el
          control no responde. */}
      <p className={css.leyenda} data-cerrado>
        <b>App</b> sin altura — reserva el hueco del teléfono (228 × 448, padding 40/60) y la altura
        sale de ahí: 528 mientras entre, y se achica sola abajo de 395. Igual que benji ·
        family-values, que tampoco declara altura ni tiene una sola media query
      </p>
    </div>
  )
}
