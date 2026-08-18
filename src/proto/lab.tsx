import { useEffect, useState, type CSSProperties } from 'react'
import css from './lab.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · LA ESTRUCTURA DE LOS GRISES DE TEXTO

   No se decide un valor acá, se decide una ESTRUCTURA: cuántos
   grises tiene el sistema y, si son dos, cuál va más claro.

   Los dos roles en juego, los dos visibles en la lista al mismo
   tiempo:
     ANOTACIÓN  --text-secondary   el subtítulo del masthead
     NAV        --type-nav-c       los 21 renglones del índice

   El tercero, --index-activo-c (65), no se toca: es el estado
   que resuelve la nav.

   LO QUE HACE BENJI, medido de su CSS servido:
   declara UN solo token de color de texto, --body-color:#111. No
   tiene ningún token de gris. Todo lo gris es su negro o su ink a
   un alfa, y el alfa dominante es .4 — 40 declaraciones contra 8
   del siguiente. Sus "dos grises" (152 y 159) son ESE MISMO 40%
   escrito desde dos bases distintas, rgba(0,0,0,.4) y
   hsla(0,0%,7%,.4). No es un escalón, es una fuga. Su respuesta a
   "cuántos grises" es UNO.

   Medido sobre el canvas real #fdfdfc. Lc es APCA; su piso para
   texto que no es cuerpo es 60, y para cuerpo 75.
   ───────────────────────────────────────────────────────────── */

type Opcion = {
  nombre: string
  /* los dos compuestos sobre #fdfdfc, para rotular y para pintar */
  nav: number
  anot: number
  /* ΔL perceptual (oklch) entre los dos, y el Lc de la anotación */
  cifras: string
  /* fila de referencia: se muestra en la hoja, no se aplica a la página */
  ref?: boolean
  /* Las que salen de una REGLA se pintan con la regla y no con su
     resultado: si el alfa se escribe mal, tiene que verse acá. */
  alfa?: string
}

const OPCIONES: Opcion[] = [
  /* Lo que se ve en SU página. No es una opción nuestra: está para
     mirar los 7 de su "escalón" y comprobar que no se ven. */
  {
    nombre: 'benji',
    nav: 159,
    anot: 152,
    cifras: 'negro/ink @ 40%\nΔL .022',
    alfa: '40%',
    ref: true,
  },

  /* SU REGLA CON NUESTRO NÚMERO — lo horneado. El alfa lo fija la
     anotación (163, el valor elegido con slider), y la nav cae sola. */
  {
    nombre: 'Nuestra',
    nav: 169,
    anot: 163,
    cifras: 'negro/ink @ 35.5%\nΔL .020\nLc 48 / 44',
    alfa: '35.5%',
  },

  /* Dos números que el ojo lee como uno: 0.013 L es un orden de
     magnitud menos que un escalón visible. */
  { nombre: 'Hoy', nav: 159, anot: 163, cifras: 'ΔL .013\nLc 48' },

  /* Un solo gris. Y no es una opción neutra: 159 ES el ink a 40%
     sobre nuestro canvas, o sea benji literal. */
  { nombre: 'Uno', nav: 159, anot: 159, cifras: 'ink @ 40%\nΔL .000\nLc 50' },

  /* Apartarse de él: dos niveles, la anotación más oscura porque
     es lo único de los dos que se lee en reposo. Escalón mínimo
     que se ve. */
  { nombre: 'Escalón', nav: 159, anot: 145, cifras: 'ΔL .046\nLc 57' },

  /* El mismo orden, más separado. 138 es el gris heredado de
     Carousels — y el único candidato que cruza el piso de APCA. */
  { nombre: 'Escalón +', nav: 159, anot: 138, cifras: 'ΔL .069\nLc 61' },

  /* El orden de hoy pero con un escalón de verdad, para ver si la
     dirección se sostiene sola o sólo funcionaba porque no se
     notaba. Mismo salto que 'Escalón', al revés. */
  { nombre: 'Invertido', nav: 145, anot: 159, cifras: 'ΔL .046\nLc 50' },
]

const APLICABLES = OPCIONES.filter((o) => !o.ref)

const gris = (n: number) => `rgb(${n}, ${n}, ${n})`
const mix = (base: string, a: string) => `color-mix(in srgb, ${base} ${a}, transparent)`

/* Las opciones con regla se pintan con la regla —negro para lo que
   anota, --ink para la nav, el mismo alfa— y las sueltas con su valor
   sólido. Es la diferencia que se está juzgando, así que tiene que
   estar en el código y no sólo en el rótulo. */
const valores = (o: Opcion) =>
  o.alfa
    ? { nav: mix('var(--ink)', o.alfa), anot: mix('#000', o.alfa) }
    : { nav: gris(o.nav), anot: gris(o.anot) }

const vars = (o: Opcion) => {
  const v = valores(o)
  return { '--type-nav-c': v.nav, '--text-secondary': v.anot } as CSSProperties
}

/* La muestra: el par real, a los tamaños reales. La columna del
   índice a 13/16 contra el masthead a 14/20 — que es exactamente la
   distancia a la que los dos grises se ven en la página. */
function Muestra() {
  return (
    <>
      <div className={css.nav}>
        <div className={css.navRotulo}>Web</div>
        <div>Button</div>
        <div className={css.navActivo}>Input</div>
        <div>Select</div>
      </div>
      <div className={css.mast}>
        <div className={css.mastTitulo}>Library</div>
        <div className={css.mastSub}>
          Components for web and native apps that feel right.
        </div>
      </div>
    </>
  )
}

export function Lab() {
  const [i, setI] = useState(0)
  const [hoja, setHoja] = useState(false)
  const o = APLICABLES[i]

  /* En documentElement y no en un contenedor: los dos tokens se
     declaran en :root y se leen desde ahí. Escribirlos en un
     descendiente de quien los lee no los alcanza. (En la hoja sí van
     inline, porque ahí la fila SÍ es ancestro de quien los lee.) */
  useEffect(() => {
    const d = document.documentElement
    const v = valores(o)
    d.style.setProperty('--text-secondary', v.anot)
    d.style.setProperty('--type-nav-c', v.nav)
    return () => {
      d.style.removeProperty('--text-secondary')
      d.style.removeProperty('--type-nav-c')
    }
  }, [o])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') setHoja((v) => !v)
      const n = Number(e.key)
      if (n >= 1 && n <= APLICABLES.length) {
        setI(n - 1)
        setHoja(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {hoja && (
        <div className={css.hoja}>
          <div className={css.filas}>
            {OPCIONES.map((op) => (
              <div
                className={css.fila}
                key={op.nombre}
                data-ref={op.ref ? '' : undefined}
                style={vars(op)}
              >
                <div>
                  <div className={css.rotulo}>{op.nombre}</div>
                  <div className={css.cifras}>
                    {`nav ${op.nav} · anot ${op.anot}\n${op.cifras}`}
                  </div>
                </div>
                <Muestra />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={css.barra}>
        {APLICABLES.map((op, k) => (
          <button
            className={css.opcion}
            key={op.nombre}
            data-on={!hoja && k === i ? '' : undefined}
            onClick={() => {
              setI(k)
              setHoja(false)
            }}
          >
            {op.nombre}
          </button>
        ))}
        <div className={css.sep} />
        <button
          className={css.opcion}
          data-on={hoja ? '' : undefined}
          onClick={() => setHoja((v) => !v)}
        >
          Hoja
        </button>
        <span className={css.dato}>
          nav {o.nav} · anot {o.anot}
        </span>
      </div>
    </>
  )
}
