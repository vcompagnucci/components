import { useEffect, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — lo único que queda abierto de la card: cuánto oscurece
   el hover. Se borra entero con src/proto/.

   El radio ya se decidió: 8, el de benji, el más repetido de las dos
   referencias juntas. Ese toggle se fue.

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
  { id: 'h4', nombre: '−4', valor: '#f4f4f1', medido: false,
    fuente: 'paso de 4, −9 del canvas. El intermedio: no sale de ninguna referencia, está para ver si medio escalón alcanza' },
  { id: 'h5', nombre: '−5 · su escalón', valor: '#f3f3f0', medido: true,
    fuente: 'paso de 5, −10 del canvas. EL ACTUAL, y su escalón real: sus cards van de #fafafa a #f5f5f5 (neutral-50 → neutral-100) y su botón de /bloom de #44403c a #57534e (stone-700 → stone-600). Los dos, un escalón' },
]



export function useLab() {
  const par = new URLSearchParams(location.search)
  const [hover, setHover] = useState(() => (HOVERS.some(h => h.id === par.get('h')) ? par.get('h')! : 'h5'))
  const h = HOVERS.find(x => x.id === hover) ?? HOVERS[2]

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('h', hover)
    history.replaceState(history.state, '', url)
  }, [hover])

  /* En el ROOT: quien pinta el canvas es `html`, y además así una sola
     escritura alcanza para la lista y para el detalle. */
  useEffect(() => {
    const raiz = document.documentElement
    raiz.style.setProperty('--surface-hover', h.valor)
    return () => {
      raiz.style.removeProperty('--surface-hover')
    }
  }, [h])

  return { h, setHover }
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

export function LabPanel({ h, setHover }: { h: Op; setHover: (v: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = '123'.indexOf(e.key)
      if (n >= 0 && n < HOVERS.length) setHover(HOVERS[n].id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setHover])

  return (
    <div className={css.panel}>
      <Fila titulo="Hover" ops={HOVERS} activo={h.id} set={setHover} teclas="123" />
      <p className={css.leyenda}>{h.fuente}</p>
    </div>
  )
}
