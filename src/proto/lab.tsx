import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './lab.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · TOGGLE DE TEMA

   Andamio de pruebas, no diseño del producto. Sirve para mirar
   claro y oscuro sin ir a cambiar el tema del sistema.

   NO COPIA NINGÚN VALOR: lee del CSS servido las declaraciones de
   `:root` —las de arriba de todo para claro, las del media query
   `prefers-color-scheme: dark` para oscuro— y las aplica inline.
   Así muestra exactamente lo horneado y no se puede desincronizar
   de tokens.css.

   `sistema` las saca y devuelve el control al sistema operativo.
   ───────────────────────────────────────────────────────────── */

const TEMAS = ['sistema', 'claro', 'oscuro'] as const

const GUARDADO = 'lab-tema'

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
  const [t, setT] = useState(0)

  const picker = useRef<HTMLElement | null>(null)
  const highlight = useRef<HTMLSpanElement | null>(null)
  const items = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    const crudo = sessionStorage.getItem(GUARDADO)
    if (!crudo) return
    try {
      const v = JSON.parse(crudo)
      if (typeof v.t === 'number') setT(v.t)
    } catch {
      /* si está roto, arrancamos del default */
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem(GUARDADO, JSON.stringify({ t }))
  }, [t])

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
    const item = items.current[t]
    if (!item) return
    highlight.current.style.width = `${item.offsetWidth}px`
    highlight.current.style.transform = `translateX(${item.offsetLeft}px)`
  }, [t])

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

  return (
    <nav className="proto-picker" aria-label="Tema" ref={picker}>
      <span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />
      {TEMAS.map((nombre, indice) => (
        <button
          className="proto-picker-item"
          data-active={indice === t ? '' : undefined}
          aria-current={indice === t ? 'true' : undefined}
          key={nombre}
          onClick={() => setT(indice)}
          ref={(el) => {
            items.current[indice] = el
          }}
        >
          {nombre}
        </button>
      ))}
    </nav>
  )
}
