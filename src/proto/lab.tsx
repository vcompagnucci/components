import { useEffect, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — la piel de la card: canvas, superficie y anillo. Se
   borra entero con src/proto/.

   Un picker y no interruptores sueltos, porque las tres cosas están
   ACOPLADAS. Josh no lleva anillo porque su card ya es 5 unidades más
   oscura que la página; benji sí lo lleva porque la suya es 1 unidad y
   lo que la define es la línea. Poder mezclarlas sólo produciría más
   versiones de lo que tenemos hoy, que es card más CLARA que el fondo
   más un anillo fuerte: las dos señales tirando para lados opuestos.

   Todo medido, SOURCE + RUNTIME, a 1440. Detalle en
   .context/recon/COLOR.md */

export type Piel = {
  id: string
  nombre: string
  fuente: string
  medido: boolean
  vars: Record<string, string>
}

export const PIELES: Piel[] = [
  {
    id: 'josh',
    nombre: 'josh',
    fuente:
      'canvas #ffffff · card #fafaf9 (stone-50) · sin anillo y sin sombra. El contraste solo alcanza. Su --background:#fafafa está tapado por un <main class="bg-white">: el píxel real del fondo es 255,255,255',
    medido: true,
    vars: {
      '--canvas': '#ffffff',
      '--surface': '#fafaf9',
      '--card-sombra': 'none',
      '--card-sombra-hover': '0 0 0 1px rgba(0,0,0,.06)',
    },
  },
  {
    id: 'benji',
    nombre: 'benji',
    fuente:
      'canvas #fdfdfc · card #fcfcfc · anillo 0 0 0 1px #f2f2f2, hacia afuera. La card es 1 unidad más oscura, o sea casi nada: lo que la define es la línea. De family-values, 45 cajas iguales',
    medido: true,
    vars: {
      '--canvas': '#fdfdfc',
      '--surface': '#fcfcfc',
      '--card-sombra': '0 0 0 1px #f2f2f2',
      '--card-sombra-hover': '0 0 0 1px #e6e6e6',
    },
  },
  {
    id: 'elevada',
    nombre: 'elevada',
    fuente:
      'canvas #fdfdfc · card #ffffff · sin anillo propio: la levanta una RAMPA de 7 capas — 1px al .04 y seis sombras cada vez más chicas y más tenues. Es la que benji declara como --overlay-shadow; está en su CSS pero con 0 usos en las páginas medidas, la tiene reservada para overlays',
    medido: true,
    vars: {
      '--canvas': '#fdfdfc',
      '--surface': '#ffffff',
      '--card-sombra':
        '0 0 0 1px rgba(0,0,0,.04), 0 1.625rem 3.375rem rgba(0,0,0,.04), 0 1rem 2rem rgba(0,0,0,.03), 0 0.625rem 1rem rgba(0,0,0,.024), 0 0.3125rem 0.5rem rgba(0,0,0,.02), 0 0.125rem 0.25rem rgba(0,0,0,.016), 0 0 0.125rem rgba(0,0,0,.01)',
      '--card-sombra-hover':
        '0 0 0 1px rgba(0,0,0,.06), 0 2.25rem 4.5rem rgba(0,0,0,.055), 0 1.375rem 2.75rem rgba(0,0,0,.04), 0 0.875rem 1.375rem rgba(0,0,0,.032), 0 0.4375rem 0.6875rem rgba(0,0,0,.026), 0 0.1875rem 0.375rem rgba(0,0,0,.02), 0 0 0.125rem rgba(0,0,0,.012)',
    },
  },
  {
    id: 'hero',
    nombre: 'benji hero',
    fuente:
      'canvas #fdfdfc · card #fdfcf8 cálida · borde 1px rgba(0,0,0,.08) y CUATRO sombras: luz arriba, viñeta cálida, contacto y elevación. Su frame de /drawesome, el trato que le da a un demo que es toda la página',
    medido: true,
    vars: {
      '--canvas': '#fdfdfc',
      '--surface': '#fdfcf8',
      '--card-sombra':
        'inset 0 0 0 1px rgba(0,0,0,.08), inset 0 1px 0 hsla(0,0%,100%,.9), inset 0 0 60px rgba(120,104,72,.04), 0 1px 2px rgba(0,0,0,.035), 0 14px 36px rgba(0,0,0,.05)',
      '--card-sombra-hover':
        'inset 0 0 0 1px rgba(0,0,0,.12), inset 0 1px 0 hsla(0,0%,100%,.9), inset 0 0 60px rgba(120,104,72,.04), 0 2px 4px rgba(0,0,0,.04), 0 18px 44px rgba(0,0,0,.07)',
    },
  },
  {
    id: 'hoy',
    nombre: 'hoy',
    fuente:
      'canvas #fdfdfc · card #ffffff · anillo inset 1px rgba(0,0,0,.11). La card es más CLARA que el fondo, al revés que los dos, y el anillo es casi el doble de fuerte que el de benji. No salió de ninguno: viene heredado sin verificar',
    medido: false,
    vars: {
      '--canvas': '#fdfdfc',
      '--surface': '#ffffff',
      '--card-sombra': 'inset 0 0 0 1px rgba(0,0,0,.11)',
      '--card-sombra-hover': 'inset 0 0 0 1px rgba(0,0,0,.16)',
    },
  },
]

export function useLab() {
  const [id, setId] = useState(() => {
    const q = new URLSearchParams(location.search).get('piel')
    return PIELES.some((p) => p.id === q) ? (q as string) : 'hoy'
  })

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('piel', id)
    history.replaceState(history.state, '', url)
  }, [id])

  const piel = PIELES.find((p) => p.id === id) ?? PIELES[0]
  return { piel, setId, vars: piel.vars as React.CSSProperties }
}

export function LabPanel({ piel, setId }: { piel: Piel; setId: (v: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= PIELES.length) setId(PIELES[n - 1].id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setId])

  return (
    <div className={css.panel}>
      <div className={css.fila}>
        {PIELES.map((p, i) => (
          <button
            key={p.id}
            className={css.sw}
            data-on={p.id === piel.id ? '' : undefined}
            data-sinfuente={p.medido ? undefined : ''}
            onClick={() => setId(p.id)}
          >
            <span className={css.tecla}>{i + 1}</span>
            <span>{p.nombre}</span>
            <span
              className={css.muestra}
              style={{ background: p.vars['--surface'], boxShadow: p.vars['--card-sombra'] }}
            />
          </button>
        ))}
      </div>
      <p className={css.leyenda}>{piel.fuente}</p>
    </div>
  )
}
