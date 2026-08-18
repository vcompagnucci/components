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
      'card 5 unidades más oscura que el fondo, sin anillo y sin sombra: el contraste solo alcanza. ADAPTADO — su card es #fafaf9 sobre un canvas blanco puro, así que lo que se conserva es su delta (−5,−5,−6), no el valor. Sobre nuestro #fdfdfc da #f8f8f6',
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
      'card #fcfcfc · anillo 0 0 0 1px #f2f2f2, hacia afuera. Cae tal cual: su canvas ES nuestro #fdfdfc. La card queda 1 unidad más oscura, o sea casi nada — lo que la define es la línea. De family-values, 45 cajas iguales',
    medido: true,
    vars: {
      '--surface': '#fcfcfc',
      '--card-sombra': '0 0 0 1px #f2f2f2',
      '--card-sombra-hover': '0 0 0 1px #e6e6e6',
    },
  },
  {
    id: 'elevada',
    nombre: 'elevada',
    fuente:
      'card #ffffff · sin anillo: la levanta la RAMPA de 7 capas que benji declara como --overlay-shadow (en su CSS con 0 usos, la reserva para overlays). Es la sombra difusa: 26px de alcance',
    medido: true,
    vars: {
      '--surface': '#ffffff',
      '--card-sombra':
        '0 0 0 1px rgba(0,0,0,.04), 0 1.625rem 3.375rem rgba(0,0,0,.04), 0 1rem 2rem rgba(0,0,0,.03), 0 0.625rem 1rem rgba(0,0,0,.024), 0 0.3125rem 0.5rem rgba(0,0,0,.02), 0 0.125rem 0.25rem rgba(0,0,0,.016), 0 0 0.125rem rgba(0,0,0,.01)',
      '--card-sombra-hover':
        '0 0 0 1px rgba(0,0,0,.06), 0 2.25rem 4.5rem rgba(0,0,0,.055), 0 1.375rem 2.75rem rgba(0,0,0,.04), 0 0.875rem 1.375rem rgba(0,0,0,.032), 0 0.4375rem 0.6875rem rgba(0,0,0,.026), 0 0.1875rem 0.375rem rgba(0,0,0,.02), 0 0 0.125rem rgba(0,0,0,.012)',
    },
  },
  {
    id: 'tweet',
    nombre: 'tweet',
    fuente:
      'card #ffffff · sin anillo, sólo sombra CERRADA: 10px de alcance contra los 26 de la anterior. Ajustada contra el perfil del PNG (43·21·14·9·5·4·4·3·2·1·0) con error 0.74 sobre un pico de 43, y verificada renderizando y volviendo a medir. ⚠ En el tweet el fondo es crema y la card le saca 11 unidades; nuestro canvas sólo deja +2, así que acá la misma sombra tiene mucho menos donde apoyarse',
    medido: true,
    vars: {
      '--surface': '#ffffff',
      '--card-sombra':
        '0 1px 2px rgba(0,0,0,.15), 0 2px 4px rgba(0,0,0,.06), 0 4px 8px rgba(0,0,0,.04)',
      '--card-sombra-hover':
        '0 2px 4px rgba(0,0,0,.16), 0 4px 8px rgba(0,0,0,.07), 0 8px 16px rgba(0,0,0,.05)',
    },
  },
  {
    id: 'hero',
    nombre: 'benji hero',
    fuente:
      'card #fdfcf8 cálida · borde 1px rgba(0,0,0,.08) y CUATRO sombras: luz arriba, viñeta cálida, contacto y elevación. Su frame de /drawesome, el trato que le da a un demo que es toda la página. También cae tal cual: su canvas es el nuestro',
    medido: true,
    vars: {
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
      'card #ffffff · anillo inset 1px rgba(0,0,0,.11). La card es más CLARA que el fondo, al revés que los dos, y el anillo es casi el doble de fuerte que el de benji. No salió de ninguno: viene heredado sin verificar',
    medido: false,
    vars: {
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
