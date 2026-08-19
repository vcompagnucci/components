import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './lab.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · SELECCIÓN OSCURA

   Este laboratorio congela todo salvo UNA pregunta: cuánto se
   despega la selección del canvas oscuro. Las dos reglas se prueban
   en las dos paletas que siguen en carrera:

   DERIVADA
     Conserva el ΔL de la selección clara de benji (#ededed sobre
     #fdfdfc). Es lo que había: #1c1c1b sobre emil, #141414 sobre
     josh. En oscuro queda demasiado cerca del canvas.

   VISIBLE
     Usa la respuesta que Geist da para el mismo rol: gray-500 oscuro
     (#31312e) sobre gray-100 (#111110). El salto de OKLab L pasa de
     .049 a .135. En josh no se copia el hex: se conserva ese mismo
     salto perceptual desde #0a0a0a, que da #292929.

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
  emil: {
    canvas: '#111110',
    ink: '#eeeeec',
    surface: '#141413',
    hover: '#171716',
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
    surface: '#0d0d0d',
    hover: '#101010',
    underline: '#222222',
    underlineHover: '#868686',
  },
  josh: {
    canvas: '#0a0a0a',
    ink: '#fafafa',
    surface: '#0d0d0d',
    hover: '#101010',
    underline: '#222222',
    underlineHover: '#868686',
  },
} satisfies Record<string, Paleta>

type Variante = {
  nombre: string
  paleta: keyof typeof PALETAS
  selection: string
  regla: 'visible' | 'derivada'
}

const VARIANTES: Variante[] = [
  { nombre: 'emil', paleta: 'emil', selection: '#31312e', regla: 'visible' },
  { nombre: 'profundo', paleta: 'profundo', selection: '#292929', regla: 'visible' },
  { nombre: 'josh', paleta: 'josh', selection: '#292929', regla: 'visible' },
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

    /* La selección real del masthead queda visible después de cada
       cambio. Así se compara el estado, no sólo un chip inventado. */
    const frame = requestAnimationFrame(() => {
      const masthead = document.querySelector('h1')?.parentElement
      if (!masthead) return
      const range = document.createRange()
      range.selectNodeContents(masthead)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    })

    return () => {
      cancelAnimationFrame(frame)
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
