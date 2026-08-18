import { useEffect, useRef, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — dos cosas separadas, a propósito.

   1 · USO: igualar CÓMO usa el color, no qué colores usa. Es todo lo que
       hoy divergimos de él, medido en .context/recon/COLOR.md.
   2 · el gris secundario, que es lo único que falta ELEGIR.

   Van en toggles distintos porque son decisiones distintas: la primera
   se copia, la segunda se elige.

   Lo que cambia el toggle de USO, y por qué:

   a) La descripción del detalle pasa a ink. Su regla 1 es que TODO lo
      que se lee va en #111 — párrafos, encabezados de los tres niveles,
      strong, ítems de lista. El gris lo reserva para lo que ANOTA: la
      fecha, el epígrafe de un demo, las notas al pie. Nuestra descripción
      es prosa, así que le toca ink. El subtítulo del masthead y la
      plataforma del detalle se quedan grises: ésos sí son anotación, y
      su <time> bajo el h1 es exactamente ese rol.

   b) El activo y el hover del índice pasan de #111 a rgba(18,18,18,.8),
      que compone en 65. Su CSS es explícito:
        nav ul li a:hover, nav ul li[data-active=true] a
          { color: hsla(0,0%,7%,.8) }
      O sea que NO llega al ink: se queda a 48 unidades de distancia.

   c) El foco pasa a su receta: outline de 2px sólido en
      rgba(0,122,255,.5), sin transición —aparece instantáneo aunque todo
      lo demás tenga 200ms— en vez de nuestro anillo de dos capas con
      color-mix, que vino del design.md de Carousels sin contrastar.

   Lo que NO entra porque todavía no existe en la página: sus links de
   prosa, que no llevan color propio (a{color:inherit}) y se marcan con
   un subrayado de 1px #d9d9d9 como pseudo-elemento. */

const COMO_EL: Record<string, string> = {
  '--detalle-desc-c': 'var(--ink)',
  '--index-activo-c': 'rgba(18, 18, 18, 0.8)',
  '--focus-ring': 'none',
  '--focus-outline': '2px solid rgba(0, 122, 255, 0.5)',
  '--focus-transition': 'none',
}

const MIN = 130
const MAX = 186
export const HOY = 138
export const BENJI = 152
const MARCAS = [
  { v: HOY, nombre: 'hoy' },
  { v: BENJI, nombre: 'benji' },
]

const lum = (c: number) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const contraste = (a: number, b: number) => {
  const [h, l] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)]
  return (h + 0.05) / (l + 0.05)
}
const hex = (v: number) => '#' + v.toString(16).padStart(2, '0').repeat(3)
const alfa = (v: number) => (1 - v / 253).toFixed(3)

export function useLab() {
  const par = new URLSearchParams(location.search)
  const [uso, setUso] = useState(() => par.get('uso') === '1')
  const [v, setV] = useState(() => {
    const n = Number(par.get('gris'))
    return Number.isFinite(n) && n >= MIN && n <= MAX ? n : HOY
  })

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('uso', uso ? '1' : '0')
    url.searchParams.set('gris', String(v))
    history.replaceState(history.state, '', url)
  }, [uso, v])

  useEffect(() => {
    const raiz = document.documentElement
    raiz.style.setProperty('--text-secondary', hex(v))
    return () => {
      raiz.style.removeProperty('--text-secondary')
    }
  }, [v])

  useEffect(() => {
    const raiz = document.documentElement
    if (uso) for (const [k, val] of Object.entries(COMO_EL)) raiz.style.setProperty(k, val)
    return () => {
      for (const k of Object.keys(COMO_EL)) raiz.style.removeProperty(k)
    }
  }, [uso])

  return { uso, setUso, v, setV }
}

export function LabPanel({
  uso,
  setUso,
  v,
  setV,
}: {
  uso: boolean
  setUso: (b: boolean) => void
  v: number
  setV: (n: number) => void
}) {
  const barra = useRef<HTMLDivElement>(null)
  const pct = (n: number) => ((n - MIN) / (MAX - MIN)) * 100

  const desde = (clientX: number) => {
    const r = barra.current?.getBoundingClientRect()
    if (!r) return
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    setV(Math.round(MIN + t * (MAX - MIN)))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.toLowerCase() === 'u') return setUso(!uso)
      if (e.key === 'ArrowLeft') setV(Math.max(MIN, v - 1))
      if (e.key === 'ArrowRight') setV(Math.min(MAX, v + 1))
      if (e.key === '1') setV(HOY)
      if (e.key === '2') setV(BENJI)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [uso, setUso, v, setV])

  const c = contraste(v, 253)
  const marca = MARCAS.find((m) => m.v === v)

  return (
    <div className={css.panel}>
      <div className={css.fila}>
        <button className={css.sw} data-on={uso ? '' : undefined} onClick={() => setUso(!uso)}>
          <span className={css.tecla}>U</span>
          <span>Uso · {uso ? 'como él' : 'como hoy'}</span>
        </button>
        <span className={css.detalle}>
          {uso
            ? 'descripción del detalle en ink · índice activo y hover en 65 · foco con su outline'
            : 'descripción en gris · índice activo y hover en ink 17 · foco con el anillo heredado'}
        </span>
      </div>

      <div className={css.pista}>
        <div
          ref={barra}
          className={css.scrubber}
          role="slider"
          aria-label="Gris del texto secundario"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={v}
          tabIndex={0}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            desde(e.clientX)
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) desde(e.clientX)
          }}
        >
          <div className={css.relleno} style={{ width: `${pct(v)}%` }} />
          {MARCAS.map((m) => (
            <span key={m.v} className={css.marca} style={{ left: `${pct(m.v)}%` }} />
          ))}
          <span className={css.etiqueta}>Secundario</span>
          <span className={css.muestraCaja}>
            <span className={css.muestra} style={{ background: hex(v) }} />
          </span>
          <span className={css.valor}>{hex(v)}</span>
        </div>
        <div className={css.regla}>
          {MARCAS.map((m) => (
            <button
              key={m.v}
              className={css.numero}
              data-on={m.v === v ? '' : undefined}
              style={{ left: `${pct(m.v)}%` }}
              onClick={() => setV(m.v)}
            >
              {m.nombre} · {m.v}
            </button>
          ))}
        </div>
      </div>

      <p className={css.leyenda}>
        <b>{c.toFixed(2)}:1</b> · alfa equivalente <b>rgba(0,0,0,{alfa(v)})</b>
        {marca ? ` · estás exactamente en ${marca.nombre}` : ''} · ← → de a 1 · <b>1</b> hoy ·{' '}
        <b>2</b> benji · <b>U</b> alterna el uso
      </p>
      {uso && (
        <p className={css.leyenda}>
          Con el uso como él, el secundario deja de sostener un párrafo: queda sólo en el subtítulo
          del masthead y en la plataforma del detalle, que son dos líneas de anotación. Un gris flojo
          se defiende mucho mejor ahí
        </p>
      )}
    </div>
  )
}
