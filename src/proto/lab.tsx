import { useEffect, useState } from 'react'
import { Picker, Pila } from './picker'

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

   El picker en sí vive en ./picker: lo comparte con las opciones
   del vault, y tener el mecanismo del highlight escrito dos veces
   era garantizar que se separaran.
   ───────────────────────────────────────────────────────────── */

const TEMAS = ['sistema', 'claro', 'oscuro'] as const
type Tema = (typeof TEMAS)[number]

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
  const [tema, setTema] = useState<Tema>('sistema')

  useEffect(() => {
    const crudo = sessionStorage.getItem(GUARDADO)
    if (crudo && (TEMAS as readonly string[]).includes(crudo)) setTema(crudo as Tema)
  }, [])

  useEffect(() => {
    sessionStorage.setItem(GUARDADO, tema)
  }, [tema])

  useEffect(() => {
    const el = document.documentElement
    if (tema === 'sistema') return
    const tokens = rama(tema === 'oscuro')
    for (const [k, v] of Object.entries(tokens)) el.style.setProperty(k, v)
    el.style.colorScheme = tema === 'oscuro' ? 'dark' : 'light'
    return () => {
      for (const k of Object.keys(tokens)) el.style.removeProperty(k)
      el.style.removeProperty('color-scheme')
    }
  }, [tema])

  return (
    <Pila>
      <Picker etiqueta="tema" opciones={TEMAS} valor={tema} onCambio={setTema} />
    </Pila>
  )
}
