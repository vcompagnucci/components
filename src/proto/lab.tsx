import { useEffect, useState } from 'react'
import css from './lab.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · LA SELECCIÓN DE TEXTO

   Medido del CSS servido de las tres referencias. Las tres tienen
   una regla global, y no dicen lo mismo:

     benji  ::selection{color:var(--selection-color);
                        background:var(--selection-bg)}
            --selection-bg:#ededed  --selection-color:#111
            FUERZA el color del texto.

     josh   ::selection{color:#fff;background:#000}
            Inversión total. También fuerza.

     emil   ::selection{background:var(--color-gray-500)}
            #e2e1de, y NO toca el color del texto.

   LO QUE NOS DIFERENCIA DE EMIL: él puede no forzar porque su
   secundario de prosa está en 99. El nuestro está en 160, y un
   160 sobre su #e2e1de da 2.00:1 — el subtítulo del masthead se
   volvería ilegible justo mientras lo seleccionás. Forzando a ink
   da 16:1.

   Y hay una coincidencia que acá NO es coincidencia: su
   --color-gray-100 es #fdfdfc, nuestro canvas exacto. El de benji
   también. Por eso su #ededed se puede copiar literal sin el
   problema de siempre: mismo fondo, mismo delta. Es la primera
   vez en todo el sistema que copiar un hex copia un contraste.

   PARA PROBARLO: seleccioná arrastrando sobre el masthead, de
   "Library" hasta el final del subtítulo. Ése es el caso: un
   renglón en ink pegado a uno en gris. Ahí se ve si la selección
   promueve todo a ink o deja el gris donde está.
   ───────────────────────────────────────────────────────────── */

type Sel = {
  nombre: string
  bg: string
  /* undefined = no toca el color del texto */
  color?: string
  nota: string
  /* el texto secundario mientras está seleccionado */
  contraste: string
}

const SELECCIONES: Sel[] = [
  {
    nombre: 'benji',
    bg: '#ededed',
    color: '#111111',
    nota: 'resalte suave,\ntodo pasa a ink',
    contraste: '16.13:1',
  },
  {
    nombre: 'josh',
    bg: '#000000',
    color: '#ffffff',
    nota: 'inversión total',
    contraste: '21.00:1',
  },
  {
    nombre: 'emil',
    bg: '#e2e1de',
    nota: 'no fuerza el color:\nel gris queda gris',
    contraste: '2.00:1',
  },
  {
    /* Mismo delta que benji pero compuesto, así la selección sobre
       la card se ve igual que sobre la página. Él usa sólido, y con
       una card a −5 la diferencia es de 5 unidades. */
    nombre: 'benji · alfa',
    bg: 'color-mix(in srgb, #000 6.3%, transparent)',
    color: '#111111',
    nota: 'igual sobre la card\nque sobre la página',
    contraste: '16.13:1',
  },
]

export function Lab() {
  const [i, setI] = useState(0)
  const s = SELECCIONES[i]

  /* En documentElement: los tokens se declaran en :root y la regla
     ::selection los lee desde ahí. */
  useEffect(() => {
    const d = document.documentElement
    d.style.setProperty('--selection-bg', s.bg)
    /* Sin color forzado, `inherit` deja el texto como está — que es
       exactamente lo que hace emil al no declarar la propiedad. */
    d.style.setProperty('--selection-color', s.color ?? 'inherit')
    return () => {
      d.style.removeProperty('--selection-bg')
      d.style.removeProperty('--selection-color')
    }
  }, [s])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= SELECCIONES.length) setI(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={css.barra}>
      {SELECCIONES.map((o, k) => (
        <button
          className={css.opcion}
          key={o.nombre}
          data-on={k === i ? '' : undefined}
          onClick={() => setI(k)}
        >
          {o.nombre}
          <sub>{o.contraste}</sub>
        </button>
      ))}
      <div className={css.sep} />
      <span className={css.pista}>seleccioná el masthead</span>
    </div>
  )
}
