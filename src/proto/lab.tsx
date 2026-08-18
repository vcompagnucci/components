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

   Elegida la estrategia de josh: la card es más OSCURA que el fondo y
   no lleva ni anillo ni sombra — el contraste hace todo el trabajo. Lo
   único que queda por decidir es CUÁNTO, así que las cinco variantes
   son una rampa de profundidad, y el azul baja 6/5 de lo que bajan rojo
   y verde para conservar su tinte cálido.

   Queda benji al final, sin tocar, como la otra estrategia entera por
   si hay que volver.

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
    id: 'd3',
    nombre: '−3',
    fuente:
      '#fafaf8 · su estrategia con el contraste MÁS FLOJO de la rampa. Ojo con el número: copiar su hex literal (#fafaf9) sobre nuestro canvas da justo −3, porque su fondo es blanco puro y el nuestro ya arranca 2 unidades abajo. O sea que copiarle el color, en vez del contraste, aterriza acá',
    medido: false,
    vars: { '--surface': '#fafaf8', '--card-sombra': 'none', '--card-sombra-hover': '0 0 0 1px rgba(0,0,0,.05)' },
  },
  {
    id: 'd5',
    nombre: '−5 · original',
    fuente:
      '#f8f8f6 · LA ORIGINAL. Conserva su delta medido (−5,−5,−6): su card es #fafaf9 sobre blanco puro, y lo que se traslada es cuánto contraste tiene, no qué color es. Sin anillo y sin sombra — el contraste hace todo el trabajo, que es su regla',
    medido: false,
    vars: { '--surface': '#f8f8f6', '--card-sombra': 'none', '--card-sombra-hover': '0 0 0 1px rgba(0,0,0,.05)' },
  },
  {
    id: 'd8',
    nombre: '−8',
    fuente:
      '#f5f5f2 · un paso más. A partir de acá el contraste ya no es el suyo: es su estrategia empujada más lejos, que es lo que hay que mirar si sobre nuestro fondo −5 se queda corto',
    medido: false,
    vars: { '--surface': '#f5f5f2', '--card-sombra': 'none', '--card-sombra-hover': '0 0 0 1px rgba(0,0,0,.05)' },
  },
  {
    id: 'd12',
    nombre: '−12',
    fuente:
      '#f1f1ee · más del doble de su contraste. La card empieza a leerse como un bloque propio y no como una zona apenas distinta del fondo',
    medido: false,
    vars: { '--surface': '#f1f1ee', '--card-sombra': 'none', '--card-sombra-hover': '0 0 0 1px rgba(0,0,0,.05)' },
  },
  {
    id: 'd16',
    nombre: '−16',
    fuente:
      '#edede9 · el tope de la rampa, más de tres veces su contraste. Acá la card ya no es una superficie clara sobre un fondo claro: es un hueco gris',
    medido: false,
    vars: { '--surface': '#edede9', '--card-sombra': 'none', '--card-sombra-hover': '0 0 0 1px rgba(0,0,0,.05)' },
  },
  {
    id: 'benji',
    nombre: 'benji',
    fuente:
      'POR LAS DUDAS, la otra estrategia entera: card #fcfcfc y anillo 0 0 0 1px #f2f2f2. Cae tal cual porque su canvas ES nuestro #fdfdfc. Acá la card es 1 unidad más oscura, o sea nada — lo que la define es la línea, no el contraste. De family-values, 45 cajas iguales',
    medido: true,
    vars: { '--surface': '#fcfcfc', '--card-sombra': '0 0 0 1px #f2f2f2', '--card-sombra-hover': '0 0 0 1px #e6e6e6' },
  },
]

export function useLab() {
  const [id, setId] = useState(() => {
    const q = new URLSearchParams(location.search).get('piel')
    return PIELES.some((p) => p.id === q) ? (q as string) : 'd5'
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
