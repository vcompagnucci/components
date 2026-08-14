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
  { w: 1440, note: 'con índice' },
  { w: 1024, note: 'sin índice' },
  { w: 900, note: 'margen 34' },
  { w: 768, note: 'riel = ancho' },
  { w: 390, note: 'teléfono' },
]

const KEY = 'viewport'

export function Viewports() {
  const [i, setI] = useState(() => {
    const saved = Number(localStorage.getItem(KEY))
    return saved >= 0 && saved < VIEWPORTS.length ? saved : 0
  })
  const [scale, setScale] = useState(1)
  const shellRef = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(900)

  const vw = VIEWPORTS[i].w

  useEffect(() => {
    localStorage.setItem(KEY, String(i))
  }, [i])

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
      if (n >= 1 && n <= VIEWPORTS.length) setI(n - 1)
      else if (e.key === 'ArrowRight') setI((v) => Math.min(VIEWPORTS.length - 1, v + 1))
      else if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1))
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
        {scale < 1 && <span className={css.headNote}>· escalado a {Math.round(scale * 100)}%</span>}
      </div>

      <div className={css.stage} style={{ transform: `scale(${scale})` }}>
        <iframe
          className={css.frame}
          title={`Vista a ${vw}px`}
          src="/"
          style={{ width: vw, height: frameH }}
        />
      </div>

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
    </div>
  )
}
