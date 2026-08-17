import { useEffect, useState } from 'react'
import css from './lab.module.css'

/* ⚠ EN ESTUDIO — el laboratorio del índice. Se borra con src/proto/.
   Tres interruptores independientes; los valores están en el CSS. */

type Estado = { rotulos: boolean; pesoPropio: boolean; pintado: boolean }

const INICIAL: Estado = { rotulos: true, pesoPropio: true, pintado: true }

const SWITCHES = [
  {
    k: 'rotulos' as const,
    label: 'Rótulos',
    on: 'aparecen al scrollear',
    off: 'siempre visibles',
  },
  {
    k: 'pesoPropio' as const,
    label: 'Peso',
    on: 'encabezado · 500 ink',
    off: 'igual a links · 460 40%',
  },
  {
    k: 'pintado' as const,
    label: 'Pintado',
    on: 'se pinta al pasar',
    off: 'sin pintar',
  },
]

export function useLab() {
  const [e, setE] = useState<Estado>(() => {
    const q = new URLSearchParams(location.search).get('lab')
    if (!q || q.length !== 3) return INICIAL
    return { rotulos: q[0] === '1', pesoPropio: q[1] === '1', pintado: q[2] === '1' }
  })

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('lab', `${+e.rotulos}${+e.pesoPropio}${+e.pintado}`)
    history.replaceState(history.state, '', url)
  }, [e])

  const cls = [
    e.rotulos ? '' : css.rotulosSiempre,
    e.pesoPropio ? '' : css.pesoIgual,
    e.pintado ? '' : css.sinPintado,
  ]
    .filter(Boolean)
    .join(' ')

  return { e, setE, cls }
}

export function LabPanel({ e, setE }: { e: Estado; setE: (v: Estado) => void }) {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return
      const n = Number.parseInt(ev.key, 10)
      if (n >= 1 && n <= SWITCHES.length) {
        const k = SWITCHES[n - 1].k
        setE({ ...e, [k]: !e[k] })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [e, setE])

  return (
    <nav className={css.panel} aria-label="Laboratorio del índice">
      {SWITCHES.map((s) => (
        <button
          key={s.k}
          className={css.sw}
          data-on={e[s.k] ? '' : undefined}
          aria-pressed={e[s.k]}
          onClick={() => setE({ ...e, [s.k]: !e[s.k] })}
        >
          <span>{s.label}</span>
          <span className={css.estado}>{e[s.k] ? s.on : s.off}</span>
        </button>
      ))}
      <span className={css.combo}>
        {`${+e.rotulos}${+e.pesoPropio}${+e.pintado}`}
      </span>
    </nav>
  )
}
