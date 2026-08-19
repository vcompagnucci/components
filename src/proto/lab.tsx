import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './lab.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · LA PALETA OSCURA

   Queda UNA pregunta: de dónde sale el par canvas/ink. Todo lo
   demás está cerrado y va constante en las tres.

   Las tres, por profundidad de canvas:

     emil       17 · cálido   Geist gray-100, verificado pintando en
                              animations.dev
     profundo   10 · neutro   el canvas de josh, que es el
                              --ds-background-100 de vercel
     linear      9 · cálido   su bg-level-0, el más hondo, con nuestro
                              tono y su paso de superficie de +20

   LAS TRES COMPARTEN EL INK EN 238, y no por gusto. La regla deriva
   la anotación del blanco y la nav del --ink, así que el ink tiene
   que entrar lo suficiente desde el blanco o las dos bases se
   aplastan:

     238 (emil)               entra 17   par en 5.2 Lc
     247 (linear text-primary) entra  8   par en 2.6 Lc
     250 (josh)                entra  5   par en 1.6 Lc
     255 (animations.dev)      entra  0   la regla no puede correr

   Por eso 'profundo' y 'linear' llevan sus canvas pero no sus inks:
   las dos son la corrección de una referencia que en esto no nos
   sirve. Las variantes descartadas —benji, josh crudo y
   animations.dev literal— están en el historial de git.

   EL PASO DE LA CARD va igual en las tres, y no preserva el ΔL
   claro: lo multiplica por 3.00. NADIE preserva — cerca del negro
   un ΔL igual no compra la misma separación, y las dos referencias
   con escala propia agrandan su primer paso, emil ×3.00 y linear
   ×4.48. Se toma el de emil por ser el más suave de los dos, que es
   lo que pide un sistema claro tan callado como el nuestro.

     canvas 17 → card 27 · canvas 10 → card 20 · canvas 9 → card 19

   LA SELECCIÓN YA ESTÁ DECIDIDA (regla visible): toma la respuesta
   de Geist para el mismo rol —gray-500 oscuro sobre gray-100— y el
   salto pasa de .049 a .135, 2.8× el del claro. Donde el canvas no
   es el de emil no se copia el hex sino ese salto perceptual.

   DOS PENDIENTES YA CERRADOS, constantes en las cuatro variantes:

   1 · ALFAS: ×1.6, de benji. Estos tokens pertenecen al sistema de
       nivel secundario que copiamos de él, no a la escala de Geist.
       Además, 37% × 1.6 = 59.2% conserva casi exacto el contraste del
       secundario claro (Lc 49.8 → 49.3). Hairline y a1 siguen el mismo
       par medido: .051 → .082 y .04 → .064.

   2 · FOCO: el par de benji. El claro ya horneado es
       rgba(0,122,255,.5); su contraparte oscura es
       rgba(61,155,255,.5). Geist no ofrece un par: emilkowal.ski usa
       gris y animations.dev ámbar, dos acentos de producto distintos.

   También queda constante el activo del índice en 93%, ya decidido:
   conserva su posición relativa entre nav e ink en ambos modos.
   ───────────────────────────────────────────────────────────── */

type Paleta = {
  canvas: string
  ink: string
  surface: string
  hover: string
  underline: string
  underlineHover: string
}

const PALETAS = {
  /* LINEAR ADAPTADO · su método, nuestro tono. Todo SOURCE, de sus
     hojas servidas (--color-bg-level-0, --color-text-primary,
     --color-bg-secondary/tertiary/quaternary, --color-border-primary).

     Lo que define su modo oscuro, y que acá se copia:

       1 · EL CANVAS MÁS HONDO DE TODOS. Su bg-level-0 es #08090a = 8,
           dos unidades abajo del 10 de josh y de vercel.
       2 · UN SOLO TONO EN LOS DOS MODOS. Sus grises son azules tanto
           en claro como en oscuro; el tinte vive en la rampa de texto,
           no en el fondo. Acá se conserva NUESTRO tono cálido (H 106)
           con la misma lógica.
       3 · (NO se copia su paso de superficie.) El suyo va de 8 a 28,
           +20, que sobre nuestro claro sería 5.94× — y nuestra card
           clara es deliberadamente callada. Su paso claro ya arranca
           más grande que el nuestro (ΔL .0198 contra .0152) y encima
           multiplica más. Su profundidad no obliga a su separación:
           son dos diales distintos.

     Lo que NO se copia: su ink. Su text-primary oscuro es 247 y deja
     sólo 8 unidades hasta el blanco, así que la regla de las dos bases
     colapsa a 2.6 Lc — el mismo bug de josh. Va corregido a 238, igual
     que en 'profundo', y el par vuelve a 5.2. */
  linear: {
    canvas: '#090908',
    ink: '#eeeeec',
    surface: '#131312',
    hover: '#1b1b1a',
    underline: '#252522',
    underlineHover: '#82827d',
  },
  emil: {
    canvas: '#111110',
    ink: '#eeeeec',
    surface: '#1b1b1a',
    hover: '#242423',
    underline: '#2a2a29',
    underlineHover: '#858584',
  },
  /* La profundidad de josh con un ink que no colapsa el par. Su
     #fafafa deja sólo 5 unidades entre las dos bases de la regla
     —blanco para lo que anota, --ink para la nav— y las aplasta a
     Δ 1.6 Lc. Con 238 la separación vuelve a 5.1, como con emil,
     y el canvas sigue siendo el suyo. El resto de la paleta es la
     de josh sin tocar. */
  profundo: {
    canvas: '#0a0a0a',
    ink: '#eeeeee',
    surface: '#141414',
    hover: '#1c1c1c',
    underline: '#222222',
    underlineHover: '#868686',
  },} satisfies Record<string, Paleta>

type Variante = {
  nombre: string
  paleta: keyof typeof PALETAS
  selection: string
  regla: 'visible' | 'derivada'
}

const VARIANTES: Variante[] = [
  { nombre: 'emil', paleta: 'emil', selection: '#31312e', regla: 'visible' },
  { nombre: 'profundo', paleta: 'profundo', selection: '#292929', regla: 'visible' },
  { nombre: 'linear', paleta: 'linear', selection: '#292926', regla: 'visible' },
]

const ALFA_OSCURO = '59.2%'
const ACTIVO_ALFA_OSCURO = '93%'
const FOCUS_OSCURO = 'rgba(61, 155, 255, 0.5)'

const TOKENS = [
  'color-scheme',
  '--canvas',
  '--ink',
  '--surface',
  '--surface-hover',
  '--secundario-alfa',
  '--text-secondary',
  '--type-nav-c',
  '--hairline',
  '--a1',
  '--index-activo-c',
  '--selection-bg',
  '--selection-color',
  '--link-underline',
  '--link-underline-hover',
  '--focus-outline',
] as const

const inicial = () => {
  const v = Number(new URLSearchParams(location.search).get('v'))
  return Number.isInteger(v) && v >= 1 && v <= VARIANTES.length ? v - 1 : 0
}

export function Lab() {
  const [actual, setActual] = useState(inicial)
  const picker = useRef<HTMLElement>(null)
  const highlight = useRef<HTMLSpanElement>(null)
  const items = useRef<Array<HTMLButtonElement | null>>([])
  const variante = VARIANTES[actual]
  const paleta = PALETAS[variante.paleta]

  useEffect(() => {
    const d = document.documentElement
    const set = (token: string, value: string) => d.style.setProperty(token, value)

    set('color-scheme', 'dark')
    set('--canvas', paleta.canvas)
    set('--ink', paleta.ink)
    set('--surface', paleta.surface)
    set('--surface-hover', paleta.hover)
    set('--secundario-alfa', ALFA_OSCURO)
    set('--text-secondary', `color-mix(in srgb, #fff ${ALFA_OSCURO}, transparent)`)
    set('--type-nav-c', `color-mix(in srgb, var(--ink) ${ALFA_OSCURO}, transparent)`)
    set('--hairline', 'rgba(255, 255, 255, 0.082)')
    set('--a1', 'rgba(255, 255, 255, 0.064)')
    set(
      '--index-activo-c',
      `color-mix(in srgb, var(--ink) ${ACTIVO_ALFA_OSCURO}, transparent)`,
    )
    set('--selection-bg', variante.selection)
    set('--selection-color', 'var(--ink)')
    set('--link-underline', paleta.underline)
    set('--link-underline-hover', paleta.underlineHover)
    set('--focus-outline', `2px solid ${FOCUS_OSCURO}`)

    /* Acá había una selección automática del masthead en cada cambio,
       para poder comparar ese estado sin arrastrar. Se fue con la
       decisión: la selección oscura ya está cerrada en la regla
       visible, y ahora la única pregunta abierta es la paleta —
       dejar el subtítulo resaltado sólo tapaba lo que hay que mirar. */
    return () => {
      TOKENS.forEach((token) => d.style.removeProperty(token))
    }
  }, [paleta, variante.selection])

  const moverHighlight = useCallback(() => {
    const item = items.current[actual]
    if (!item || !highlight.current) return
    highlight.current.style.width = `${item.offsetWidth}px`
    highlight.current.style.transform = `translateX(${item.offsetLeft}px)`
  }, [actual])

  useLayoutEffect(moverHighlight, [moverHighlight])

  useEffect(() => {
    let segundoFrame = 0
    const primerFrame = requestAnimationFrame(() => {
      segundoFrame = requestAnimationFrame(() => {
        picker.current?.setAttribute('data-ready', '')
      })
    })
    return () => {
      cancelAnimationFrame(primerFrame)
      cancelAnimationFrame(segundoFrame)
    }
  }, [])

  useEffect(() => {
    const onResize = () => moverHighlight()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [moverHighlight])

  const elegir = (indice: number) => {
    if (indice < 0 || indice >= VARIANTES.length) return
    setActual(indice)
    const url = new URL(location.href)
    url.searchParams.set('v', String(indice + 1))
    history.replaceState(null, '', url)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const numero = Number.parseInt(event.key, 10)
      if (numero >= 1 && numero <= VARIANTES.length) elegir(numero - 1)
      else if (event.key === 'ArrowRight') elegir((actual + 1) % VARIANTES.length)
      else if (event.key === 'ArrowLeft') {
        elegir((actual - 1 + VARIANTES.length) % VARIANTES.length)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [actual])

  return (
    <nav className="proto-picker" aria-label="Prototype variants" ref={picker}>
      <span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />
      {VARIANTES.map((opcion, indice) => (
        <button
          className="proto-picker-item"
          data-active={indice === actual ? '' : undefined}
          aria-current={indice === actual ? 'true' : undefined}
          key={`${opcion.paleta}-${opcion.regla}`}
          onClick={() => elegir(indice)}
          ref={(elemento) => {
            items.current[indice] = elemento
          }}
        >
          {opcion.nombre}
        </button>
      ))}
    </nav>
  )
}
