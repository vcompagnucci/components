import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './lab.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · LA PALETA OSCURA

   Ya no hay paletas cerradas: hay DOS NÚMEROS y todo lo demás se
   deriva de ellos en vivo.

     PROFUNDIDAD  el gris del canvas, en 8 bits.
                  linear 9 · vercel 10 · emil 17 · benji 19
     CALIDEZ      el croma en OKLCH, sobre nuestro tono H 106.4 —
                  el mismo de --canvas claro (#fdfdfc). Sube el
                  croma y toda la rampa se entibia junta.

   Los dos presets del picker son puntos de ese espacio, no cosas
   aparte: emil es (17, .002) y linear es (9, .003).

   DE ESOS DOS NÚMEROS SALEN LOS DEMÁS, con las dos reglas que ya
   están decididas:

   1 · EL TEXTO CONSERVA EL CONTRASTE, porque tiene un piso de
       legibilidad que las superficies no tienen.
         secundario  37% → 59.2%   Lc 49.8 → 49.3
         activo      80% → 93%     misma posición relativa entre
                                   la nav y el ink
       El ink queda anclado en el gris 238: la regla deriva la
       anotación del BLANCO y la nav del --ink, así que el ink
       tiene que entrar 17 unidades desde el blanco —lo mismo que
       entra el #111 desde el negro en claro— o el par se aplasta.
       Por eso el ink NO se mueve con la profundidad: sube de
       calidez y nada más.

   2 · TODO LO DEMÁS CONSERVA LA DISTANCIA E INVIERTE LA
       DIRECCIÓN. En claro la card está a −5 del canvas, el hover
       a −9, la selección a −16, el subrayado a −36 y su hover a
       −151. Acá están a +5, +9, +16, +36 y +151, sea cual sea la
       profundidad. Los alfas hacen lo mismo: mismo número, base
       dada vuelta (.051 y .04), que es lo que hace linear
       —#0000000d → #ffffff0d— y su valor claro es nuestro mismo
       5.1% a tres decimales.

   La rampa se genera en OKLCH con croma CONSTANTE y tono
   constante, que es el método de linear: un solo tono en los dos
   modos, y el tinte viviendo en toda la escala en vez de sólo en
   el fondo.

   Es un compromiso y no una ley: conservar la distancia de 8 bits
   da ~1.5× de ΔL, así que la card es algo más notoria en oscuro.
   Conservar el ΔL exacto la dejaría en +3, invisible; las dos
   referencias con escala propia agrandan mucho más (emil ×3.00,
   linear ×4.48) por robustez entre pantallas, no por apariencia.
   APCA no puede arbitrarlo: devuelve 0.0 para todas las opciones
   de superficie. El instrumento es ΔL.

   EL FOCO usa el par de benji: rgba(0,122,255,.5) claro,
   rgba(61,155,255,.5) oscuro. Geist no ofrece un par —gris en
   emilkowal.ski, ámbar en animations.dev.
   ───────────────────────────────────────────────────────────── */

/* Nuestro tono, el de --canvas claro medido en OKLCH. */
const TONO = 106.4

/* Las distancias del modo claro desde el canvas, en 8 bits. */
const PASOS = { surface: 5, hover: 9, selection: 16, underline: 36, underlineHover: 151 }

/* El ink no se mueve con la profundidad: 255 − 238 = 17, la misma
   distancia que hay del negro al #111 en claro. */
const INK_GRIS = 238

const ALFA_OSCURO = '59.2%'
const ACTIVO_ALFA_OSCURO = '93%'
const FOCUS_OSCURO = 'rgba(61, 155, 255, 0.5)'
const HAIRLINE_OSCURO = 'rgba(255, 255, 255, 0.051)'
const A1_OSCURO = 'rgba(255, 255, 255, 0.04)'

function oklchARgb(L: number, C: number, H: number) {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const canal = (v: number) => {
    const c = Math.max(0, Math.min(1, v))
    return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055))
  }
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  const r = canal(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = canal(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const bl = canal(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return `#${hex(r)}${hex(g)}${hex(bl)}`
}

/* La L de OKLab de un gris neutro de 8 bits. En un gris los tres
   canales lineales son iguales, así que las tres sumas de la matriz
   colapsan a la misma raíz cúbica y los pesos suman 1. */
function lDeGris(v: number) {
  const x = Math.max(0, Math.min(255, v)) / 255
  const lineal = x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  return Math.cbrt(lineal)
}

/* Toda la paleta desde los dos números. Croma y tono constantes en
   toda la rampa; lo único que cambia por token es la L, y sale de
   la distancia de 8 bits del modo claro. */
function paletaDe(profundidad: number, calidez: number) {
  const paso = (offset: number) => oklchARgb(lDeGris(profundidad + offset), calidez, TONO)
  return {
    canvas: paso(0),
    surface: paso(PASOS.surface),
    hover: paso(PASOS.hover),
    selection: paso(PASOS.selection),
    underline: paso(PASOS.underline),
    underlineHover: paso(PASOS.underlineHover),
    /* el ink lleva menos croma: cerca del blanco el mismo croma se
       ve mucho más, y el tinte tiene que vivir en la rampa media */
    ink: oklchARgb(lDeGris(INK_GRIS), calidez * 0.4, TONO),
  }
}

const PRESETS = [
  { nombre: 'claro', profundidad: null as number | null, calidez: 0 },
  { nombre: 'emil', profundidad: 17, calidez: 0.002 },
  { nombre: 'linear', profundidad: 9, calidez: 0.003 },
]

const LIMITES = { profundidad: [5, 26], calidez: [0, 0.02] } as const
const PASO_CALIDEZ = 0.001

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

/* El estado sobrevive a la navegación. Abrir una pieza desmonta este
   componente y monta otro, así que sin esto el detalle volvía siempre
   al modo claro y no se podía evaluar. */
const GUARDADO = 'lab-oscuro'
type Estado = { claro: boolean; profundidad: number; calidez: number }
const POR_DEFECTO: Estado = { claro: true, profundidad: 12, calidez: 0.006 }

function leerEstado(): Estado {
  try {
    const crudo = sessionStorage.getItem(GUARDADO)
    return crudo ? { ...POR_DEFECTO, ...JSON.parse(crudo) } : POR_DEFECTO
  } catch {
    return POR_DEFECTO
  }
}

export function Lab() {
  const inicial = useRef(leerEstado()).current
  const [claro, setClaro] = useState(inicial.claro)
  const [profundidad, setProfundidad] = useState(inicial.profundidad)
  const [calidez, setCalidez] = useState(inicial.calidez)
  const picker = useRef<HTMLElement>(null)
  const highlight = useRef<HTMLSpanElement>(null)
  const items = useRef<Array<HTMLButtonElement | null>>([])

  /* Cuál preset está exactamente donde están los diales. Si ninguno,
     el highlight se esconde: estás en un punto propio del espacio. */
  const activo = claro
    ? 0
    : PRESETS.findIndex(
        (p) => p.profundidad === profundidad && Math.abs(p.calidez - calidez) < 1e-9,
      )

  useEffect(() => {
    try {
      sessionStorage.setItem(GUARDADO, JSON.stringify({ claro, profundidad, calidez }))
    } catch {
      /* modo incógnito con storage bloqueado: no es motivo para romper */
    }
  }, [claro, profundidad, calidez])

  useEffect(() => {
    const d = document.documentElement
    /* Sin nada escrito, el claro es el que ya está en tokens.css. La
       comparación honesta es contra él sin tocarlo. */
    if (claro) return
    const set = (token: string, value: string) => d.style.setProperty(token, value)
    const p = paletaDe(profundidad, calidez)
    set('color-scheme', 'dark')
    set('--canvas', p.canvas)
    set('--ink', p.ink)
    set('--surface', p.surface)
    set('--surface-hover', p.hover)
    set('--secundario-alfa', ALFA_OSCURO)
    set('--text-secondary', `color-mix(in srgb, #fff ${ALFA_OSCURO}, transparent)`)
    set('--type-nav-c', `color-mix(in srgb, var(--ink) ${ALFA_OSCURO}, transparent)`)
    set('--hairline', HAIRLINE_OSCURO)
    set('--a1', A1_OSCURO)
    set('--index-activo-c', `color-mix(in srgb, var(--ink) ${ACTIVO_ALFA_OSCURO}, transparent)`)
    set('--selection-bg', p.selection)
    set('--selection-color', 'var(--ink)')
    set('--link-underline', p.underline)
    set('--link-underline-hover', p.underlineHover)
    set('--focus-outline', `2px solid ${FOCUS_OSCURO}`)
    return () => {
      TOKENS.forEach((token) => d.style.removeProperty(token))
    }
  }, [claro, profundidad, calidez])

  const moverHighlight = useCallback(() => {
    if (!highlight.current) return
    const item = activo >= 0 ? items.current[activo] : null
    if (!item) {
      highlight.current.style.width = '0px'
      return
    }
    highlight.current.style.width = `${item.offsetWidth}px`
    highlight.current.style.transform = `translateX(${item.offsetLeft}px)`
  }, [activo])

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
    return () => window.removeEventListener('resize', onResize)
  }, [moverHighlight])

  const elegirPreset = (indice: number) => {
    const p = PRESETS[indice]
    if (p.profundidad === null) {
      setClaro(true)
      return
    }
    setClaro(false)
    setProfundidad(p.profundidad)
    setCalidez(p.calidez)
  }

  const mover = (dial: 'profundidad' | 'calidez', signo: number) => {
    setClaro(false)
    if (dial === 'profundidad') {
      const [min, max] = LIMITES.profundidad
      setProfundidad((v) => Math.max(min, Math.min(max, v + signo)))
    } else {
      const [min, max] = LIMITES.calidez
      setCalidez(
        (v) => Math.round(Math.max(min, Math.min(max, v + signo * PASO_CALIDEZ)) * 1000) / 1000,
      )
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const numero = Number.parseInt(event.key, 10)
      if (numero >= 1 && numero <= PRESETS.length) elegirPreset(numero - 1)
      else if (event.key === 'ArrowRight') mover('profundidad', 1)
      else if (event.key === 'ArrowLeft') mover('profundidad', -1)
      else if (event.key === 'ArrowUp') mover('calidez', 1)
      else if (event.key === 'ArrowDown') mover('calidez', -1)
      else return
      event.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const p = paletaDe(profundidad, calidez)
  const chips = claro
    ? ['#fdfdfc', '#f8f8f6', '#111111']
    : [p.canvas, p.surface, p.ink]

  return (
    <nav className="proto-picker" aria-label="Prototype variants" ref={picker}>
      <span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />
      {PRESETS.map((opcion, indice) => (
        <button
          className="proto-picker-item"
          data-active={indice === activo ? '' : undefined}
          aria-current={indice === activo ? 'true' : undefined}
          key={opcion.nombre}
          onClick={() => elegirPreset(indice)}
          ref={(elemento) => {
            items.current[indice] = elemento
          }}
        >
          {opcion.nombre}
        </button>
      ))}

      <span className="proto-picker-divider" aria-hidden="true" />
      <button
        className="proto-picker-item proto-picker-step"
        aria-label="Menos profundidad"
        onClick={() => mover('profundidad', -1)}
      >
        −
      </button>
      <span className="proto-picker-readout">
        profundidad <b>{claro ? '—' : profundidad}</b>
      </span>
      <button
        className="proto-picker-item proto-picker-step"
        aria-label="Más profundidad"
        onClick={() => mover('profundidad', 1)}
      >
        +
      </button>

      <span className="proto-picker-divider" aria-hidden="true" />
      <button
        className="proto-picker-item proto-picker-step"
        aria-label="Menos calidez"
        onClick={() => mover('calidez', -1)}
      >
        −
      </button>
      <span className="proto-picker-readout">
        calidez <b>{claro ? '—' : calidez.toFixed(3)}</b>
      </span>
      <button
        className="proto-picker-item proto-picker-step"
        aria-label="Más calidez"
        onClick={() => mover('calidez', 1)}
      >
        +
      </button>

      <span className="proto-picker-divider" aria-hidden="true" />
      <span className="proto-picker-readout">
        {chips.map((c) => (
          <span className="proto-picker-chip" key={c} style={{ background: c }} />
        ))}
        <b>{chips[0]}</b>
      </span>
    </nav>
  )
}
