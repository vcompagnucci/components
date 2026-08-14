import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import css from './viewports.module.css'

/* Marco para ver la página a distintos anchos sin tocar la ventana.

   Va en un <iframe> y no en un div angosto porque las media queries
   responden al viewport, no al contenedor: un div de 390px mostraría la
   página angosta pero con los estilos de escritorio, o sea una mentira.
   El iframe tiene su propio viewport y dispara los breakpoints de
   verdad.

   Los cinco anchos no son números redondos: cada uno es un estado
   distinto de NUESTRA página, medido. Si cambian los breakpoints, esta
   lista hay que rehacerla. */
const VIEWPORTS = [
  { w: 1920, note: 'monitor grande' },
  { w: 1440, note: 'con índice' },
  { w: 1024, note: 'sin índice' },
  { w: 900, note: 'margen 34' },
  { w: 768, note: 'riel = ancho' },
  { w: 390, note: 'teléfono' },
]

/* Las dos técnicas medidas, más la página como está hoy para tener
   contra qué comparar. El detalle de cada una en frames.module.css. */
const FRAMES = [
  { id: '', label: 'Actual', note: 'riel 832' },
  { id: 'benji', label: 'Benji', note: '582 · desktop-first' },
  { id: 'josh', label: 'Josh', note: '740 · mobile-first' },
]

const KEY = 'viewport'
const FRAME_KEY = 'frame'

export function Viewports() {
  /* Se guarda el ancho y no el índice: agregar un viewport al principio
     correría todos los índices y te dejaría mirando otro sin avisar. */
  const [i, setI] = useState(() => {
    const saved = Number(localStorage.getItem(KEY))
    const n = VIEWPORTS.findIndex((v) => v.w === saved)
    return n >= 0 ? n : 0
  })
  const [f, setF] = useState(() => {
    const saved = localStorage.getItem(FRAME_KEY) ?? ''
    const n = FRAMES.findIndex((x) => x.id === saved)
    return n >= 0 ? n : 0
  })
  const [scale, setScale] = useState(1)
  const shellRef = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(900)

  const vw = VIEWPORTS[i].w
  const frame = FRAMES[f]

  useEffect(() => {
    localStorage.setItem(KEY, String(vw))
  }, [vw])

  useEffect(() => {
    localStorage.setItem(FRAME_KEY, frame.id)
  }, [frame.id])

  /* Si no entra en la ventana se escala; nunca se achica el iframe,
     porque eso cambiaría el ancho que ven las media queries. */
  useLayoutEffect(() => {
    const fit = () => {
      const avail = window.innerWidth - 48
      setScale(Math.min(1, avail / vw))
      setH(window.innerHeight - 100)
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [vw])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number.parseInt(e.key, 10)
      /* Números y ←→ mueven el viewport; ↑↓ el marco. Son dos ejes, así
         que se cruzan sin soltar el teclado. */
      if (n >= 1 && n <= VIEWPORTS.length) setI(n - 1)
      else if (e.key === 'ArrowRight') setI((v) => Math.min(VIEWPORTS.length - 1, v + 1))
      else if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1))
      else if (e.key === 'ArrowDown') setF((v) => (v + 1) % FRAMES.length)
      else if (e.key === 'ArrowUp') setF((v) => (v - 1 + FRAMES.length) % FRAMES.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  /* El alto se divide por la escala para que el iframe siga cubriendo
     la ventana después de encogerse. */
  const frameH = Math.round(h / scale)

  return (
    <div className={css.shell} ref={shellRef}>
      <div className={css.head}>
        <span className={css.headW}>{vw}px</span>
        <span>{VIEWPORTS[i].note}</span>
        <span className={css.headNote}>
          · marco {frame.label} ({frame.note})
        </span>
        {scale < 1 && <span className={css.headNote}>· escalado a {Math.round(scale * 100)}%</span>}
      </div>

      <div className={css.stage} style={{ transform: `scale(${scale})` }}>
        {/* key: el iframe se re-monta al cambiar de marco, porque la
            variante se lee del querystring al arrancar la app. */}
        <iframe
          key={frame.id}
          className={css.frame}
          title={`Vista a ${vw}px, marco ${frame.label}`}
          src={frame.id ? `/?frame=${frame.id}` : '/'}
          style={{ width: vw, height: frameH }}
        />
      </div>

      <div className={css.bars}>
        <nav className={css.bar} aria-label="Viewports">
          {VIEWPORTS.map((v, n) => (
            <button
              key={v.w}
              className={css.item}
              data-on={n === i ? '' : undefined}
              aria-current={n === i ? 'true' : undefined}
              onClick={() => setI(n)}
            >
              <span className={css.itemW}>{v.w}</span>
              <span className={css.itemNote}>{v.note}</span>
            </button>
          ))}
        </nav>
        <nav className={css.bar} aria-label="Marco">
          {FRAMES.map((x, n) => (
            <button
              key={x.label}
              className={css.item}
              data-on={n === f ? '' : undefined}
              aria-current={n === f ? 'true' : undefined}
              onClick={() => setF(n)}
            >
              <span className={css.itemW}>{x.label}</span>
              <span className={css.itemNote}>{x.note}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
