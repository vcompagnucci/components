import { useEffect, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — dos cosas sueltas de la card: cuánto oscurece el hover
   y cuánto radio lleva. Se borra entero con src/proto/.

   Son DOS toggles y no un picker porque son independientes: cualquier
   hover funciona con cualquier radio, así que se buscan combinaciones.

   Medido en las 7 páginas de las dos referencias. Detalle en
   .context/recon/COLOR.md */

type Op = { id: string; nombre: string; valor: string; fuente: string; medido: boolean }

/* ── HOVER ──
   El paso desde el reposo (#f8f8f6, −5 del canvas). El azul baja 6/5 de
   lo que bajan rojo y verde, la relación de canal de josh.

   Su regla es UN ESCALÓN de su rampa, verificado en los dos únicos
   hovers que tiene: sus cards de la home van de #fafafa a #f5f5f5
   (neutral-50 → neutral-100) y su botón de /bloom va de #44403c a
   #57534e (stone-700 → stone-600). Los dos, un escalón. */
export const HOVERS: Op[] = [
  { id: 'h3', nombre: '−3', valor: '#f5f5f2', medido: false,
    fuente: 'paso de 3 desde el reposo, −8 del canvas. Es lo que da copiar su hex literal (#f5f5f5) sobre nuestro fondo — la misma trampa que con la superficie: su página arranca en 250 y la nuestra en 253' },
  { id: 'h5', nombre: '−5 · su escalón', valor: '#f3f3f0', medido: true,
    fuente: 'paso de 5, −10 del canvas. EL ACTUAL. Es su escalón real: sus cards van de #fafafa a #f5f5f5, o sea −5 desde el reposo, no −10 como decía antes acá (ese número salía de medir el delta contra el blanco de /pasito, que es otra página)' },
  { id: 'h8', nombre: '−8', valor: '#f0f0ec', medido: false,
    fuente: 'paso de 8, −13 del canvas. Más marcado que el suyo: la card se despega claramente al pasar por encima' },
  { id: 'h12', nombre: '−12', valor: '#ecece8', medido: false,
    fuente: 'paso de 12, −17 del canvas. El tope: acá el hover es un cambio de estado evidente y no un matiz' },
]

/* ── RADIO ──
   Censo de las 7 páginas. Para cajas grandes benji usa 8 (50 usos en
   family-values, 4 en liveline) y josh usa 12 (11 en su home, 5 en
   pasito, 2 en bloom). En controles chicos los dos coinciden en 4 y 6. */
export const RADIOS: Op[] = [
  { id: 'r8', nombre: '8', valor: '8px', medido: true,
    fuente: 'el de benji para cajas: 50 usos en family-values y 4 en liveline. Es el radio más repetido de las dos referencias juntas' },
  { id: 'r12', nombre: '12', valor: '12px', medido: true,
    fuente: 'el de josh para cajas: 11 usos en su home, 5 en pasito, 2 en bloom. EL ACTUAL, y coherente con haber tomado su regla de superficie' },
  { id: 'r14', nombre: '14', valor: '14px', medido: true,
    fuente: 'el frame de /drawesome de benji, 550×400. Un one-off: es el único 14 de las 7 páginas, y no es múltiplo de 4' },
  { id: 'r16', nombre: '16', valor: '16px', medido: true,
    fuente: 'las cajas de media de josh en pasito, 624×468, las que llevan <img>. Su radio grande de uso normal' },
  { id: 'r32', nombre: '32', valor: '32px', medido: true,
    fuente: 'el demo de /bloom de josh, 624×480. Un solo uso en las 7 páginas: es su trato de portada, no su radio de sistema' },
]

export function useLab() {
  const par = new URLSearchParams(location.search)
  const [hover, setHover] = useState(() => (HOVERS.some(h => h.id === par.get('h')) ? par.get('h')! : 'h5'))
  const [radio, setRadio] = useState(() => (RADIOS.some(r => r.id === par.get('r')) ? par.get('r')! : 'r12'))

  const h = HOVERS.find(x => x.id === hover) ?? HOVERS[1]
  const r = RADIOS.find(x => x.id === radio) ?? RADIOS[1]

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('h', hover)
    url.searchParams.set('r', radio)
    history.replaceState(history.state, '', url)
  }, [hover, radio])

  /* En el ROOT: quien pinta el canvas es `html`, y además así una sola
     escritura alcanza para la lista y para el detalle. */
  useEffect(() => {
    const raiz = document.documentElement
    raiz.style.setProperty('--surface-hover', h.valor)
    raiz.style.setProperty('--radius-tbd', r.valor)
    return () => {
      raiz.style.removeProperty('--surface-hover')
      raiz.style.removeProperty('--radius-tbd')
    }
  }, [h, r])

  return { h, setHover, r, setRadio }
}

function Fila({ titulo, ops, activo, set, teclas }: {
  titulo: string; ops: Op[]; activo: string; set: (v: string) => void; teclas: string
}) {
  return (
    <div className={css.fila}>
      <span className={css.rubro}>{titulo}</span>
      {ops.map((o, i) => (
        <button
          key={o.id}
          className={css.sw}
          data-on={o.id === activo ? '' : undefined}
          data-sinfuente={o.medido ? undefined : ''}
          onClick={() => set(o.id)}
        >
          <span className={css.tecla}>{teclas[i]}</span>
          <span>{o.nombre}</span>
        </button>
      ))}
    </div>
  )
}

export function LabPanel({ h, setHover, r, setRadio }: {
  h: Op; setHover: (v: string) => void; r: Op; setRadio: (v: string) => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = '1234'.indexOf(e.key)
      if (n >= 0 && n < HOVERS.length) return setHover(HOVERS[n].id)
      const m = 'qwert'.indexOf(e.key.toLowerCase())
      if (m >= 0 && m < RADIOS.length) return setRadio(RADIOS[m].id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setHover, setRadio])

  return (
    <div className={css.panel}>
      <Fila titulo="Hover" ops={HOVERS} activo={h.id} set={setHover} teclas="1234" />
      <Fila titulo="Radio" ops={RADIOS} activo={r.id} set={setRadio} teclas="QWERT" />
      <p className={css.leyenda}>
        <b>Hover</b> {h.fuente}
      </p>
      <p className={css.leyenda}>
        <b>Radio</b> {r.fuente}
      </p>
    </div>
  )
}
