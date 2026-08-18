import { useEffect, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — los grises de texto. Se borra entero con src/proto/.

   Dos roles en juego:
     --text-secondary   subtítulo del masthead, descripción y meta del detalle
     --type-nav-c       rótulos y links del índice

   Medido SOURCE + RUNTIME, con el alfa COMPUESTO sobre el fondo antes de
   calcular contraste — sin eso rgba(0,0,0,.4) se mide como negro puro y
   da 20:1 en vez de 2.84:1.

   El hallazgo: los dos se separan muchísimo acá.
     benji  prosa secundaria  rgba(0,0,0,.4) → (152,152,151)   2.84:1
     josh   prosa secundaria  #525252                          7.49:1
   2.6× de diferencia. AA pide 4.5:1 para texto normal: josh pasa, benji
   no. Nuestro #8a8a8a da 3.39:1, o sea que estamos del lado de benji.

   Y nuestro --type-nav-c ya ES el de benji, verificado: rgba(18,18,18,.4). */

export type Op = {
  id: string
  nombre: string
  fuente: string
  medido: boolean
  sec: string
  nav: string
  ratios: string
}

export const OPS: Op[] = [
  {
    id: 'hoy',
    nombre: 'hoy',
    medido: false,
    sec: '#8a8a8a',
    nav: 'rgba(18, 18, 18, 0.4)',
    ratios: 'sec 3.39:1 · nav 2.60:1',
    fuente:
      'el #8a8a8a viene del design.md de Carousels y nunca se verificó. Queda entre los dos pero mucho más cerca de benji. El nav sí está verificado: es literalmente el suyo',
  },
  {
    id: 'joshLit',
    nombre: 'josh literal',
    medido: true,
    sec: '#525252',
    nav: '#a3a3a3',
    ratios: 'sec 7.68:1 · nav 2.48:1',
    fuente:
      'sus hex tal cual: #525252 para prosa (20 usos en pasito, 15 en su home) y #a3a3a3 para links de nav. Su escala es de TRES niveles donde benji tiene dos. El secundario pasa AA con holgura',
  },
  {
    id: 'joshAdap',
    nombre: 'josh adaptado',
    medido: false,
    sec: '#545454',
    nav: '#a5a5a5',
    ratios: 'sec 7.44:1 · nav 2.42:1',
    fuente:
      'sus mismos CONTRASTES re-derivados sobre nuestro fondo: 7.49:1 y 2.42:1. Da #545454 y #a5a5a5. La diferencia con lo literal es de 2 unidades, porque su fondo (250) y el nuestro (253) están muy cerca — acá copiar el valor y copiar el contraste casi coinciden, al revés que en la superficie',
  },
  {
    id: 'benji',
    nombre: 'benji',
    medido: true,
    sec: 'rgba(0, 0, 0, 0.4)',
    nav: 'rgba(18, 18, 18, 0.4)',
    ratios: 'sec 2.84:1 · nav 2.60:1',
    fuente:
      'sus dos grises, y NO hay versión adaptada: su canvas ES el nuestro, #fdfdfc, así que literal y adaptado son el mismo color. El .4 de prosa lo usa en su <time>, que es el equivalente de nuestro subtítulo — 68 usos en liveline, 18 en family-values',
  },
  {
    id: 'benjiUno',
    nombre: 'benji · un gris',
    medido: false,
    sec: 'rgba(18, 18, 18, 0.4)',
    nav: 'rgba(18, 18, 18, 0.4)',
    ratios: 'los dos 2.60:1',
    fuente:
      'un solo gris para todo lo secundario, prosa e índice. Él tiene dos que difieren en 7 unidades (152 contra 159) y nunca se ven juntos; unificarlos deja el sistema en dos niveles de texto en vez de tres',
  },
]

export function useLab() {
  const [id, setId] = useState(() => {
    const q = new URLSearchParams(location.search).get('gris')
    return OPS.some((o) => o.id === q) ? (q as string) : 'hoy'
  })
  const o = OPS.find((x) => x.id === id) ?? OPS[0]

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('gris', id)
    history.replaceState(history.state, '', url)
  }, [id])

  useEffect(() => {
    const raiz = document.documentElement
    raiz.style.setProperty('--text-secondary', o.sec)
    raiz.style.setProperty('--type-nav-c', o.nav)
    return () => {
      raiz.style.removeProperty('--text-secondary')
      raiz.style.removeProperty('--type-nav-c')
    }
  }, [o])

  return { o, setId }
}

export function LabPanel({ o, setId }: { o: Op; setId: (v: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= OPS.length) setId(OPS[n - 1].id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setId])

  return (
    <div className={css.panel}>
      <div className={css.fila}>
        {OPS.map((x, i) => (
          <button
            key={x.id}
            className={css.sw}
            data-on={x.id === o.id ? '' : undefined}
            data-sinfuente={x.medido ? undefined : ''}
            onClick={() => setId(x.id)}
          >
            <span className={css.tecla}>{i + 1}</span>
            <span>{x.nombre}</span>
            <span className={css.muestras}>
              <span className={css.muestra} style={{ background: x.sec }} />
              <span className={css.muestra} style={{ background: x.nav }} />
            </span>
          </button>
        ))}
      </div>
      <p className={css.leyenda}>
        <b>{o.ratios}</b> — AA pide 4.5:1 para texto normal
      </p>
      <p className={css.leyenda}>{o.fuente}</p>
    </div>
  )
}
