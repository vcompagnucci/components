import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './lab.module.css'
import css from '../app.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · LA DURACIÓN DEL HOVER

   Lo que YA está decidido y por eso salió del picker:

     las curvas    --ease-surface cubic-bezier(.23,1,.32,1) para
                   background-color, y --ease-text `ease` para color
                   y text-decoration-color. Partidas por PROPIEDAD,
                   como hace linear.
     la simetría   entrada = salida. Los dos referentes tienen cero
                   overrides de duración en :hover, y el barrido en
                   vivo sobre 5 páginas de linear dio 21 elementos
                   hovereables con transición y CERO asimétricos.

   Queda abierto sólo el NÚMERO, y las tres opciones están medidas
   en runtime sobre 3 páginas de cada uno:

     100ms   benji. Su duración de hover, la misma para las dos
             familias: background-color ×10 y color ×23, todo a
             100ms `ease`. Es lo que más repite.
     150ms   josh, y lo que tenemos hoy. Su CSS a mano usa color
             150ms `ease` ×21, y sus utilidades de Tailwind ponen
             background-color y border-color en 150ms ×11 cada una.
             Coincide con el ejemplo de animations.dev.
     250ms   la otra de josh: filter 250ms ease-out ×38 y color
             250ms ease-out ×17.

   NINGUNO DE LOS DOS PARTE LA DURACIÓN POR PROPIEDAD: benji usa
   100 para superficie y para texto, josh usa 150 para las dos. El
   reparto de curvas viene de linear, pero un reparto de duración
   no existe en ninguna referencia — así que acá va un solo número
   para los cuatro lectores.

   LENTO estira sin tocar la curva, que es lo que pide /better-ui
   para mirar el motion al 10%. TEMA queda fijo como andamio.
   ───────────────────────────────────────────────────────────── */

const S = {
  index: `.${css.indexLink}`,
  card: `.${css.streamPreview}`,
  back: `.${css.back}`,
}

/* Las dos curvas ya decididas, sólo para poder variar la duración
   sin que el prototipo cambie nada más. */
const SUP = 'cubic-bezier(0.23,1,0.32,1)'
const TXT = 'ease'

const DURS = [100, 150, 250]
const DE_QUIEN = ['benji', 'josh · hoy', 'josh, la otra']
const LENTO = [1, 5, 10]
const TEMAS = ['sistema', 'claro', 'oscuro'] as const

const GUARDADO = 'lab-dur'

function hoja(d: number, l: number) {
  const ms = DURS[d] * LENTO[l]
  return [
    `:root ${S.index}{transition:color ${ms}ms ${TXT}}`,
    `:root ${S.card}{transition:background-color ${ms}ms ${SUP}}`,
    `:root ${S.back}{transition:background-color ${ms}ms ${SUP},color ${ms}ms ${TXT}}`,
    `:root a{transition:text-decoration-color ${ms}ms ${TXT}}`,
  ].join('\n')
}

/* Lee del CSS servido; no copia ningún valor. */
function rama(oscura: boolean): Record<string, string> {
  const out: Record<string, string> = {}
  for (const h of Array.from(document.styleSheets)) {
    let reglas: CSSRuleList
    try {
      reglas = h.cssRules
    } catch {
      continue
    }
    for (const regla of Array.from(reglas)) {
      if (oscura) {
        if (!(regla instanceof CSSMediaRule)) continue
        const cond = regla.conditionText || ''
        if (!/prefers-color-scheme:\s*dark/.test(cond) || /contrast/.test(cond)) continue
        for (const sub of Array.from(regla.cssRules)) {
          if (!(sub instanceof CSSStyleRule) || sub.selectorText !== ':root') continue
          for (const prop of Array.from(sub.style)) out[prop] = sub.style.getPropertyValue(prop)
        }
      } else {
        if (!(regla instanceof CSSStyleRule) || regla.selectorText !== ':root') continue
        for (const prop of Array.from(regla.style)) out[prop] = regla.style.getPropertyValue(prop)
      }
    }
  }
  return out
}

export function Lab() {
  const [d, setD] = useState(1)
  const [l, setL] = useState(0)
  const [t, setT] = useState(0)

  const picker = useRef<HTMLElement | null>(null)
  const highlight = useRef<HTMLSpanElement | null>(null)
  const items = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    const crudo = sessionStorage.getItem(GUARDADO)
    if (!crudo) return
    try {
      const v = JSON.parse(crudo)
      if (typeof v.d === 'number') setD(v.d)
      if (typeof v.l === 'number') setL(v.l)
      if (typeof v.t === 'number') setT(v.t)
    } catch {
      /* si está roto, arrancamos del default */
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem(GUARDADO, JSON.stringify({ d, l, t }))
    const tag = document.createElement('style')
    tag.setAttribute('data-lab', 'dur')
    tag.textContent = hoja(d, l)
    document.head.appendChild(tag)
    return () => {
      tag.remove()
    }
  }, [d, l, t])

  useEffect(() => {
    const el = document.documentElement
    if (t === 0) return
    const tokens = rama(t === 2)
    for (const [k, v] of Object.entries(tokens)) el.style.setProperty(k, v)
    el.style.colorScheme = t === 2 ? 'dark' : 'light'
    return () => {
      for (const k of Object.keys(tokens)) el.style.removeProperty(k)
      el.style.removeProperty('color-scheme')
    }
  }, [t])

  const moverHighlight = useCallback(() => {
    if (!highlight.current) return
    const item = items.current[d]
    if (!item) return
    highlight.current.style.width = `${item.offsetWidth}px`
    highlight.current.style.transform = `translateX(${item.offsetLeft}px)`
  }, [d])

  useLayoutEffect(moverHighlight, [moverHighlight])

  useEffect(() => {
    let segundo = 0
    const primero = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => picker.current?.setAttribute('data-ready', ''))
    })
    return () => {
      cancelAnimationFrame(primero)
      cancelAnimationFrame(segundo)
    }
  }, [])

  const dial = (
    valor: number,
    set: (n: number) => void,
    largo: number,
    etiqueta: string,
    muestra: string,
  ) => (
    <>
      <span className="proto-picker-divider" aria-hidden="true" />
      <button
        className="proto-picker-item proto-picker-step"
        aria-label={`${etiqueta} anterior`}
        onClick={() => set((valor - 1 + largo) % largo)}
      >
        ‹
      </button>
      <span className="proto-picker-readout">
        {etiqueta} <b>{muestra}</b>
      </span>
      <button
        className="proto-picker-item proto-picker-step"
        aria-label={`${etiqueta} siguiente`}
        onClick={() => set((valor + 1) % largo)}
      >
        ›
      </button>
    </>
  )

  return (
    <nav className="proto-picker" aria-label="Prototype variants" ref={picker}>
      <span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />
      {DURS.map((valor, indice) => (
        <button
          className="proto-picker-item"
          data-active={indice === d ? '' : undefined}
          aria-current={indice === d ? 'true' : undefined}
          key={valor}
          onClick={() => setD(indice)}
          ref={(el) => {
            items.current[indice] = el
          }}
        >
          {valor}ms
        </button>
      ))}
      {dial(l, setL, LENTO.length, 'lento', `×${LENTO[l]}`)}
      {dial(t, setT, TEMAS.length, 'tema', TEMAS[t])}
      <span className="proto-picker-divider" aria-hidden="true" />
      <span className="proto-picker-readout">
        <b>{DE_QUIEN[d]}</b>
      </span>
    </nav>
  )
}
