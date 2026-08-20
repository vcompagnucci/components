import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './lab.module.css'
import css from '../app.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · EASE  o  EASE-OUT   +   TOGGLE DE TEMA

   Dos botones, porque la pregunta es una. Los dos valores salen
   de linear.app medido y de las skills, no de ningún gusto.

   ease       la palabra clave de CSS, cubic-bezier(.25,.1,.25,1).
              Es lo horneado hoy. La respaldan:
                benji   CADA transición de su bundle, sin una sola
                        curva custom
                josh    todo su CSS escrito a mano — .company-link
                        color 0.15s ease ×18, .role-text ×3
                linear  25 de sus 46 transiciones de color, el 54%
                        (21 sin declarar curva, que en CSS es ease,
                        más 4 explícitas)
                /web-animation-design y /animate: "¿hover o cambio
                de color? → ease"

   ease-out   cubic-bezier(.25,.46,.45,.94), el --ease-out-quad de
              linear. Es su caballo de batalla con 60 usos, seis
              veces más que la siguiente. La respaldan:
                linear  sus TRES cards con hover usan ease-out, sin
                        excepción: customerCard quad .16s, card
                        ease-out .2s, card all cubic .15s
                /review-animations: "built-in CSS easings are too
                weak; expect custom cubic-beziers"

   Por qué quad y no el quint que teníamos: quint es
   cubic-bezier(.23,1,.32,1) y linear lo declara pero lo usa UNA
   vez en todo el sitio. Quad es la más suave de la familia, que
   es lo que pide un cruce de color, y sigue siendo un bezier
   propio — así que contenta también a /review-animations.

   POR ROL es el sistema que linear tiene de verdad: no elige una
   curva, elige por lo que se anima.
     superficie  ease-out   sus 3 cards con hover, sin excepción
                            (customerCard quad .16s · card ease-out
                            .2s · card all cubic .15s)
     texto       ease       25 de sus 46 transiciones de color
   El corte va por PROPIEDAD y no por componente, que es lo que se
   lee en su CSS: `filter` y `all` en ease-out, `color` en ease. Así
   la flecha de volver —que anima fondo Y color— se parte sola, sin
   tener que decidir si "es una card".

   ENTRA es el otro hallazgo, y es aparte de la curva. Nuestro
   hover es simétrico, 150 y 150. El de la card de linear entra en
   0s y sale en .15s; el press de benji entra en 20ms contra .2s;
   Apple pide responder en pointer-down. /review-animations lo
   marca como finding: "symmetric timing es un finding".

   LENTO estira la duración sin tocar la curva — lo que pide
   /better-ui para mirar el motion al 10%.
   ───────────────────────────────────────────────────────────── */

const S = {
  item: `.${css.streamItem}`,
  index: `.${css.indexLink}`,
  card: `.${css.streamPreview}`,
  back: `.${css.back}`,
}

const QUAD = 'cubic-bezier(0.25,0.46,0.45,0.94)'

/* Tres opciones: una curva para todo, la otra para todo, o el reparto
   que hace linear. Y el corte del reparto es por PROPIEDAD, no por
   componente, que es lo que se lee en su CSS: sus cards animan `filter`
   y `all` —superficie— en ease-out, y su texto anima `color` en ease.
   Así la flecha de volver, que anima las dos cosas, queda bien partida
   sin tener que decidir si "es una card". */
const CURVAS = [
  { n: 'ease', sup: 'ease', txt: 'ease' },
  { n: 'ease-out', sup: QUAD, txt: QUAD },
  { n: 'por rol', sup: QUAD, txt: 'ease' },
]
const DUR = 150
/* La entrada, aparte de la salida. `=sale` es lo que tenemos hoy
   (simétrico); `0` es lo de linear en su card; `100` es lo de Apple. */
const ENTRA = [-1, 0, 100, 20]
const LENTO = [1, 5, 10]
const TEMAS = ['sistema', 'claro', 'oscuro'] as const

const GUARDADO = 'lab-ease'

function hoja(c: number, e: number, l: number) {
  const { sup, txt } = CURVAS[c]
  const sale = DUR * LENTO[l]
  const entra = (ENTRA[e] < 0 ? DUR : ENTRA[e]) * LENTO[l]
  return [
    `:root ${S.index}{transition:color ${sale}ms ${txt}}`,
    `:root ${S.card}{transition:background-color ${sale}ms ${sup}}`,
    `:root ${S.back}{transition:background-color ${sale}ms ${sup},color ${sale}ms ${txt}}`,
    `:root a{transition:text-decoration-color ${sale}ms ${txt}}`,
    /* La asimetría: sólo la ENTRADA cambia de duración, la salida se
       recupera sola cuando el :hover deja de matchear. Es la forma de
       linear —transition-duration en el :hover, nada más— y la misma
       que usa benji para su press. */
    `:root ${S.item}:hover ${S.card}{transition-duration:${entra}ms}`,
    `:root ${S.index}:hover{transition-duration:${entra}ms}`,
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
  const [c, setC] = useState(0)
  const [e, setE] = useState(0)
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
      if (typeof v.c === 'number') setC(v.c)
      if (typeof v.e === 'number') setE(v.e)
      if (typeof v.l === 'number') setL(v.l)
      if (typeof v.t === 'number') setT(v.t)
    } catch {
      /* si está roto, arrancamos del default */
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem(GUARDADO, JSON.stringify({ c, e, l, t }))
    const tag = document.createElement('style')
    tag.setAttribute('data-lab', 'ease')
    tag.textContent = hoja(c, e, l)
    document.head.appendChild(tag)
    return () => {
      tag.remove()
    }
  }, [c, e, l, t])

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
    const item = items.current[c]
    if (!item) return
    highlight.current.style.width = `${item.offsetWidth}px`
    highlight.current.style.transform = `translateX(${item.offsetLeft}px)`
  }, [c])

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
      {CURVAS.map((opcion, indice) => (
        <button
          className="proto-picker-item"
          data-active={indice === c ? '' : undefined}
          aria-current={indice === c ? 'true' : undefined}
          key={opcion.n}
          onClick={() => setC(indice)}
          ref={(el) => {
            items.current[indice] = el
          }}
        >
          {opcion.n}
        </button>
      ))}
      {dial(e, setE, ENTRA.length, 'entra', ENTRA[e] < 0 ? '150ms' : `${ENTRA[e]}ms`)}
      {dial(l, setL, LENTO.length, 'lento', `×${LENTO[l]}`)}
      {dial(t, setT, TEMAS.length, 'tema', TEMAS[t])}
      <span className="proto-picker-divider" aria-hidden="true" />
      <span className="proto-picker-readout">
        real{' '}
        <b>
          {(ENTRA[e] < 0 ? DUR : ENTRA[e]) * LENTO[l]} → {DUR * LENTO[l]}ms
        </b>
      </span>
    </nav>
  )
}
