import { useEffect, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — la piel de la card: superficie y anillo. Se borra
   entero con src/proto/.

   EL CANVAS NO SE TOCA. Queda en #fdfdfc, el que vino del design.md de
   Carousels, y todo lo demás se adapta a él. Eso tiene consecuencias
   reales y están escritas en cada opción: la de josh pasa a ser una
   ADAPTACIÓN —se le conserva el delta, no el valor— y la del tweet
   pierde justamente lo que la hacía funcionar, porque su fondo crema le
   deja a la card 11 unidades de contraste y el nuestro sólo 2.

   Es un picker y no interruptores sueltos, porque superficie y anillo
   están ACOPLADOS. Josh no lleva anillo porque su contraste alcanza;
   benji sí lo lleva porque el suyo es de 1 unidad y lo que define la
   card es la línea. Mezclarlos sólo produce más versiones de lo de hoy,
   que es card más clara que el fondo MÁS un anillo fuerte: las dos
   señales tirando para lados opuestos.

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
      'card más oscura que el fondo, sin anillo y sin sombra: el contraste solo hace todo el trabajo. ADAPTADO — su #fafaf9 se apoya en blanco puro, así que lo que se traslada es su delta (−5,−5,−6) y no el valor. Sobre nuestro #fdfdfc da #f8f8f6',
    medido: false,
    vars: {
      '--surface': '#f8f8f6',
      '--card-sombra': 'none',
      '--card-sombra-hover': '0 0 0 1px rgba(0,0,0,.06)',
    },
  },
  {
    id: 'benji',
    nombre: 'benji',
    fuente:
      'card #fcfcfc · anillo 0 0 0 1px #f2f2f2, hacia afuera. Cae tal cual: su canvas ES nuestro #fdfdfc. La card queda 1 unidad más oscura, o sea nada — lo que la define es la línea. De family-values, 45 cajas iguales',
    medido: true,
    vars: {
      '--surface': '#fcfcfc',
      '--card-sombra': '0 0 0 1px #f2f2f2',
      '--card-sombra-hover': '0 0 0 1px #e6e6e6',
    },
  },
  {
    id: 'tweet',
    nombre: 'tweet',
    fuente:
      'card #ffffff · sin anillo, sólo sombra. SUAVIZADA respecto del original: medida sobre nuestro fondo, el pico baja de 44 a 29 y el alcance sube de 10 a 14px. Se descartaron dos aún más suaves porque perdían el contacto y la caída quedaba plana — dejaba de leerse como que la card está levantada',
    medido: false,
    vars: {
      '--surface': '#ffffff',
      '--card-sombra': '0 1px 3px rgba(0,0,0,.08), 0 3px 6px rgba(0,0,0,.05), 0 6px 14px rgba(0,0,0,.035)',
      '--card-sombra-hover': '0 2px 4px rgba(0,0,0,.10), 0 4px 10px rgba(0,0,0,.06), 0 10px 22px rgba(0,0,0,.045)',
    },
  },
  {
    id: 'jbt',
    nombre: 'j + b + t',
    fuente:
      'las tres señales juntas: card #f8f8f6 más oscura (josh) · anillo 0 0 0 1px #f2f2f2 (benji) · sombra suavizada (tweet). Es la más marcada de las cinco, y la única donde el contraste, la línea y la elevación empujan para el mismo lado',
    medido: false,
    vars: {
      '--surface': '#f8f8f6',
      '--card-sombra': '0 0 0 1px #f2f2f2, 0 1px 3px rgba(0,0,0,.08), 0 3px 6px rgba(0,0,0,.05), 0 6px 14px rgba(0,0,0,.035)',
      '--card-sombra-hover': '0 0 0 1px #e6e6e6, 0 2px 4px rgba(0,0,0,.10), 0 4px 10px rgba(0,0,0,.06), 0 10px 22px rgba(0,0,0,.045)',
    },
  },
  {
    id: 'bt',
    nombre: 'b + t',
    fuente:
      'card #fcfcfc y anillo 0 0 0 1px #f2f2f2, los dos de benji, más la sombra suavizada del tweet. La línea sigue definiendo el borde y la sombra sólo la despega del fondo',
    medido: false,
    vars: {
      '--surface': '#fcfcfc',
      '--card-sombra': '0 0 0 1px #f2f2f2, 0 1px 3px rgba(0,0,0,.08), 0 3px 6px rgba(0,0,0,.05), 0 6px 14px rgba(0,0,0,.035)',
      '--card-sombra-hover': '0 0 0 1px #e6e6e6, 0 2px 4px rgba(0,0,0,.10), 0 4px 10px rgba(0,0,0,.06), 0 10px 22px rgba(0,0,0,.045)',
    },
  },
]

export function useLab() {
  const [id, setId] = useState(() => {
    const q = new URLSearchParams(location.search).get('piel')
    return PIELES.some((p) => p.id === q) ? (q as string) : 'benji'
  })

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('piel', id)
    history.replaceState(history.state, '', url)
  }, [id])

  const piel = PIELES.find((p) => p.id === id) ?? PIELES[0]

  /* Las variables van en el ROOT y no en .page. Quien pinta el canvas es
     `html`, o sea un ancestro: escribiendo --canvas más abajo el fondo no
     cambiaba nunca y las dos opciones que lo mueven —josh y tweet— se
     estaban viendo con el fondo viejo. */
  useEffect(() => {
    const raiz = document.documentElement
    for (const [k, v] of Object.entries(piel.vars)) raiz.style.setProperty(k, v)
    return () => {
      for (const k of Object.keys(piel.vars)) raiz.style.removeProperty(k)
    }
  }, [piel])

  return { piel, setId }
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
