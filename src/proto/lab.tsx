import { useEffect, useState } from 'react'
import css from './lab.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · EL MODO OSCURO

   Cuatro referencias medidas, y todas dicen lo mismo en lo
   estructural. Nada de esto es preferencia: sale del CSS servido
   (SOURCE) y del render con el sistema en oscuro (RUNTIME).

   1 · NADIE INVIERTE LA PALETA. El par ink/canvas sí queda casi
       simétrico —josh 102.9→104.4, jakub 101.5→96.3, emil
       102.0→96.2, benji 93.6→99.4, los cuatro dentro de 6 Lc—
       pero el secundario NO:
         josh    claro Lc 84.2  →  oscuro Lc 52.3   (−32)
         jakub   claro Lc 73.0  →  oscuro Lc 61.9   (−11)
       Los dos AFLOJAN. Invertir el 82 de josh daría 173 y él
       usa 163; las tres sumas L* de jakub dan >100 y no 100.
       Es lo que dice /better-colors: el modo oscuro no se hace
       dando vuelta la paleta clara.

   2 · EL CANVAS OSCURO NO ES NEGRO. josh 10 · jakub 16 · emil 17
       · benji 19. Ninguno usa #000.

   3 · EL INK OSCURO NO ES BLANCO. josh 250 · jakub 238 · emil 238
       · benji 244. Ninguno usa #fff.

   4 · LAS SUPERFICIES INVIERTEN LA DIRECCIÓN, no el orden. La
       escala de emil baja en claro (253·249·241·233·226) y sube
       en oscuro (17·25·34·42·49). El nuestro dice "la card se
       separa un paso del canvas"; el paso sigue, el signo cambia.

   5 · LOS ALFAS SUBEN AL DAR VUELTA LA BASE. Benji, con las dos
       que tiene:
         --ink-faint  rgba(0,0,0,.28) → hsla(0,0%,100%,.45)  ×1.607
         --hairline   rgba(0,0,0,.10) → hsla(0,0%,100%,.16)  ×1.600
       El mismo factor dos veces. Nuestro 37% × 1.6 = 59.2%.

   6 · EL ACENTO SE ACLARA. benji #08f → #3d9bff, josh #6366f1 →
       #818cf8. Los dos.

   NUESTRO CASO TIENE UNA VUELTA: el secundario claro ya está en
   Lc 49.8, muy por debajo del 84 de josh y del 73 de jakub. No
   hay margen para aflojar. Y el ×1.6 de benji cae justo:
   59.2% da Lc 49.3 — sostiene el contraste en vez de perderlo,
   que es lo que este sistema necesita.

   LO QUE QUEDA A ELECCIÓN es de dónde sale el par canvas/ink.
   Quedan DOS en carrera: emil y josh. Benji y jakub se
   descartaron —benji era el único que invertía la temperatura
   (canvas frío, ink cálido) y jakub caía a un paso de emil en
   todo salvo el tinte.

   Todos los pasos (surface, hover, selección, subrayado) se
   derivan preservando el ΔL PERCEPTUAL del modo claro, no el
   delta de 8 bits — que es lo que pide /better-colors. Y cada
   uno se tiñe con la relación de canal del canvas, para que la
   temperatura no se pierda al alejarse del fondo.
   ───────────────────────────────────────────────────────────── */

type Paleta = {
  nombre: string
  fuente: string
  canvas: string
  ink: string
  surface: string
  hover: string
  /* el mismo par, con el paso agrandado como hace emil */
  surfaceAncho: string
  hoverAncho: string
  selection: string
  underline: string
  underlineHover: string
  activo: string
  /* el acento del foco, aclarado */
  focus: string
  nota: string
}

const PALETAS: Paleta[] = [
  {
    nombre: 'emil',
    fuente: 'su escala .dark, 12 pasos',
    canvas: '#111110',
    ink: '#eeeeec',
    surface: '#141413',
    hover: '#171716',
    surfaceAncho: '#181817',
    hoverAncho: '#1d1d1c',
    selection: '#1c1c1b',
    underline: '#2a2a29',
    underlineHover: '#858584',
    activo: '#c2c2c0',
    focus: 'rgba(61, 155, 255, 0.5)',
    nota: 'su gray-100 CLARO es\nnuestro canvas exacto.\nCálido en los dos modos.',
  },
  {
    nombre: 'josh',
    fuente: 'su :root de modo oscuro',
    canvas: '#0a0a0a',
    ink: '#fafafa',
    surface: '#0d0d0d',
    hover: '#101010',
    surfaceAncho: '#101010',
    hoverAncho: '#161616',
    selection: '#141414',
    underline: '#222222',
    underlineHover: '#868686',
    activo: '#cacaca',
    focus: 'rgba(129, 140, 248, 0.5)', // su #818cf8 oscuro
    nota: 'el más profundo y el más\ncontrastado. Su par ink es\nel único arriba de Lc 100.',
  },
]

/* El alfa del secundario en oscuro. Sale del ×1.6 de benji sobre
   nuestro 37%. La base se da vuelta: negro → blanco para lo que
   anota, --ink para la nav. */
const ALFA_OSCURO = '59.2%'

/* Los alfas que no son de texto, con el mismo ×1.6 y la base dada
   vuelta: --hairline .051 → 8.2%, --a1 .04 → 6.4%. */
const HAIRLINE_OSCURO = 'rgba(255, 255, 255, 0.082)'
const A1_OSCURO = 'rgba(255, 255, 255, 0.064)'

/* SEGUNDO EJE · el tamaño del paso de la card.

   Los pasos de arriba preservan el ΔL perceptual del modo claro
   (ratio 1.00×). Pero emil NO preserva: agranda sus pasos en
   oscuro, y el factor baja a medida que el paso crece —

     100→200   ΔL .0119 → .0358   ×3.00
     100→300   ΔL .0381 → .0744   ×1.95
     100→400   ΔL .0603 → .1071   ×1.78
     100→500   ΔL .0841 → .1349   ×1.60

   O sea: cerca del negro un ΔL chico no sobrevive, y hay que
   agrandarlo. Nuestra card es un paso del tamaño de su primero,
   el que él más agranda.

   Sus factores por-paso no se pueden copiar tal cual: nuestros
   dos pasos (card y hover) están cerca —5 y 9 en claro— y aplicar
   3.00× a uno y 1.95× al otro los deja a 1 unidad, o sea mata el
   hover. Así que el "ancho" usa un factor UNIFORME de 2.0×, que
   cae en su rango medido y conserva la proporción entre los dos.
   Es una elección adentro de su evidencia, no un número suyo. */
export function Lab() {
  const [oscuro, setOscuro] = useState(true)
  const [ancho, setAncho] = useState(false)
  const [i, setI] = useState(0)
  const p = PALETAS[i]

  useEffect(() => {
    const d = document.documentElement
    const set = (k: string, v: string) => d.style.setProperty(k, v)
    if (!oscuro) {
      d.style.cssText = ''
      return
    }
    /* color-scheme primero: sin esto los controles nativos y la
       barra de scroll siguen claros y la página queda partida. */
    set('color-scheme', 'dark')
    set('--canvas', p.canvas)
    set('--ink', p.ink)
    set('--surface', ancho ? p.surfaceAncho : p.surface)
    set('--surface-hover', ancho ? p.hoverAncho : p.hover)
    set('--secundario-alfa', ALFA_OSCURO)
    /* Las dos bases dadas vuelta. La regla es la misma que en
       claro: un alfa, dos bases — sólo que las bases ahora son
       blanco y --ink en vez de negro y --ink. */
    set('--text-secondary', `color-mix(in srgb, #fff ${ALFA_OSCURO}, transparent)`)
    set('--type-nav-c', `color-mix(in srgb, var(--ink) ${ALFA_OSCURO}, transparent)`)
    set('--hairline', HAIRLINE_OSCURO)
    set('--a1', A1_OSCURO)
    set('--index-activo-c', p.activo)
    set('--selection-bg', p.selection)
    set('--selection-color', 'var(--ink)')
    set('--link-underline', p.underline)
    set('--link-underline-hover', p.underlineHover)
    set('--focus-outline', `2px solid ${p.focus}`)
    return () => {
      d.style.cssText = ''
    }
  }, [oscuro, ancho, p])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') setOscuro((v) => !v)
      if (e.key === 's' || e.key === 'S') setAncho((v) => !v)
      const n = Number(e.key)
      if (n >= 1 && n <= PALETAS.length) {
        setI(n - 1)
        setOscuro(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={css.barra}>
      <button
        className={css.opcion}
        data-on={!oscuro ? '' : undefined}
        onClick={() => setOscuro(false)}
      >
        claro
        <sub>horneado</sub>
      </button>
      <div className={css.sep} />
      {PALETAS.map((o, k) => (
        <button
          className={css.opcion}
          key={o.nombre}
          data-on={oscuro && k === i ? '' : undefined}
          onClick={() => {
            setI(k)
            setOscuro(true)
          }}
        >
          {o.nombre}
          <sub>{o.canvas}</sub>
        </button>
      ))}
      <div className={css.sep} />
      <button
        className={css.opcion}
        data-on={ancho ? '' : undefined}
        onClick={() => setAncho((v) => !v)}
      >
        paso ×2
        <sub>{ancho ? 'emil' : 'ΔL igual'}</sub>
      </button>
      <div className={css.sep} />
      <span className={css.pista}>D alterna · 1–4 paletas · S paso</span>
    </div>
  )
}
