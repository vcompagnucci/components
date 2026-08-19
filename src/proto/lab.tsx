import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './lab.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · LA PALETA OSCURA

   Queda UNA pregunta: de dónde sale el par canvas/ink. Todo lo
   demás está cerrado y va constante en las tres.

     emil       17 · cálido   Geist gray-100, verificado pintando en
                              animations.dev
     profundo   10 · neutro   el canvas de josh, que es el
                              --ds-background-100 de vercel
     linear      9 · cálido   su bg-level-0, el más hondo, con nuestro
                              tono

   DOS REGLAS, Y SÓLO DOS. Antes había cuatro ratios distintos
   conviviendo —1.54 la card, 2.83 la selección, 1.60 los alfas,
   0.99 el subrayado— y cada uno tenía su excusa, pero juntos no
   eran un sistema.

   1 · EL TEXTO CONSERVA EL CONTRASTE.
       Tiene un piso de legibilidad que las superficies no tienen,
       así que lo que se sostiene es el Lc, no el número.
         secundario  37% → 59.2%   Lc 49.8 → 49.3
         activo      80% → 93%     misma posición relativa entre
                                   la nav y el ink
       El 59.2% sale del ×1.6 que benji aplica en sus dos tokens
       con alfa, y cae justo donde hay que caer.

   2 · TODO LO DEMÁS CONSERVA LA DISTANCIA E INVIERTE LA DIRECCIÓN.
       En claro la card está a −5 del canvas, el hover a −9, la
       selección a −16, el subrayado a −36 y su hover a −151. En
       oscuro están a +5, +9, +16, +36 y +151.
       Los alfas hacen lo mismo: mismo número, base dada vuelta.
         --hairline  .051 negro → .051 blanco
         --a1        .04  negro → .04  blanco
       Que es exactamente lo que hace linear —#0000000d → #ffffff0d,
       ×1.00— y su valor claro es nuestro mismo 5.1% a tres
       decimales.

   LO QUE SE RESIGNA AL UNIFICAR: la selección baja de 49 a 33. El
   49 era el gray-500 de Geist, 2.83× el paso claro, y se veía más;
   pero era el único token del sistema con su propia regla. A +16
   sigue siendo más marcada que el 28 que quedaba antes.

   Y ES UN COMPROMISO, NO UNA LEY. OKLab dice que ΔL igual se ve
   igual, y conservar la distancia de 8 bits da ~1.5× de ΔL: la
   card ES algo más notoria en oscuro. Preservar el ΔL exacto la
   dejaría en +3, invisible. Las dos referencias con escala propia
   agrandan mucho más (emil ×3.00, linear ×4.48) por robustez
   —cerca del negro las pantallas divergen: OLED contra IPS, luz
   ambiente, bandeo de 8 bits— no para igualar apariencia. Esto
   queda en el medio y se enuncia en una frase.

   APCA no puede arbitrar esto: devuelve 0.0 para todas las
   opciones de superficie. Está hecho para texto. El instrumento
   es ΔL.

   EL FOCO usa el par de benji: rgba(0,122,255,.5) claro,
   rgba(61,155,255,.5) oscuro. Geist no ofrece un par —gris en
   emilkowal.ski, ámbar en animations.dev.
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
    surface: '#0e0e0d',
    hover: '#121211',
    underline: '#2d2d2c',
    underlineHover: '#a0a09f',
  },
  emil: {
    canvas: '#111110',
    ink: '#eeeeec',
    surface: '#161615',
    hover: '#1a1a19',
    underline: '#353534',
    underlineHover: '#a8a8a7',
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
    surface: '#0f0f0f',
    hover: '#131313',
    underline: '#2e2e2e',
    underlineHover: '#a1a1a1',
  },
} satisfies Record<string, Paleta>

type Variante = {
  nombre: string
  /* null = el modo claro tal como está horneado en tokens.css. No
     escribe nada: saca todos los overrides y deja ver el original.
     Está primero a propósito — es contra esto que se comparan las
     tres, y es lo único acá que no es una propuesta. */
  paleta: keyof typeof PALETAS | null
  selection?: string
}

const VARIANTES: Variante[] = [
  { nombre: 'claro · horneado', paleta: null },
  { nombre: 'emil', paleta: 'emil', selection: '#212120' },
  { nombre: 'profundo', paleta: 'profundo', selection: '#1a1a1a' },
  { nombre: 'linear', paleta: 'linear', selection: '#191918' },
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
  const paleta = variante.paleta ? PALETAS[variante.paleta] : null

  useEffect(() => {
    const d = document.documentElement
    const set = (token: string, value: string) => d.style.setProperty(token, value)

    /* Sin paleta no se escribe nada: el modo claro es el que ya está
       en tokens.css, y la comparación honesta es contra él sin tocar. */
    if (!paleta) return () => {}

    set('color-scheme', 'dark')
    set('--canvas', paleta.canvas)
    set('--ink', paleta.ink)
    set('--surface', paleta.surface)
    set('--surface-hover', paleta.hover)
    set('--secundario-alfa', ALFA_OSCURO)
    set('--text-secondary', `color-mix(in srgb, #fff ${ALFA_OSCURO}, transparent)`)
    set('--type-nav-c', `color-mix(in srgb, var(--ink) ${ALFA_OSCURO}, transparent)`)
    set('--hairline', 'rgba(255, 255, 255, 0.051)')
    set('--a1', 'rgba(255, 255, 255, 0.04)')
    set(
      '--index-activo-c',
      `color-mix(in srgb, var(--ink) ${ACTIVO_ALFA_OSCURO}, transparent)`,
    )
    if (variante.selection) set('--selection-bg', variante.selection)
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
          key={opcion.nombre}
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
