import { useEffect, useState } from 'react'
import css from './app.module.css'
import { Detail } from './parts'
import type { Piece } from './pieces'
import { Picker } from './proto/picker'
import { LAYOUTS } from './proto/layouts'
import sep from './proto/separators.module.css'

/* ⚠ EN ESTUDIO — navegación y agrupación.
   Las cuatro direcciones viven en src/proto/layouts.tsx, detrás del
   picker, sobre la página real. Cuando se elija una se hornea acá y se
   borra src/proto/ entero. Todo medido de benji.org y joshpuckett.me;
   las mediciones están en .context/recon/NAVIGATION.md. */
export function App() {
  const [selected, setSelected] = useState<Piece | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Picker names={LAYOUTS.map((l) => l.name)} replay>
      {(i, mountKey) => {
        const { Comp } = LAYOUTS[i]
        return (
          <div className={`${css.page} ${sep.stage}`} key={`${i}-${mountKey}`}>
            {selected ? (
              <Detail piece={selected} onBack={() => setSelected(null)} />
            ) : (
              <Comp onOpen={setSelected} />
            )}
          </div>
        )
      }}
    </Picker>
  )
}
