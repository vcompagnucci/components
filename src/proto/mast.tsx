import { useEffect } from 'react'
import { Scrubber, ScrubberBar, useUrlNumber } from './scrubber'

/* ⚠ EN ESTUDIO — el hueco del título del masthead a su subtítulo.
   Se borra con src/proto/.

   Acá SÍ hay análogo exacto, y es de benji. Su header es el mismo par
   que el nuestro —un h1 y una línea secundaria, los dos de 14px con
   interlínea 20— y está en el HTML servido de su home, no sólo en la
   hoja de estilos:

     <header><h1>Benji Taylor</h1><time>Updated Jul 29, 2026</time></header>

     .article > header { display:flex; flex-direction:column;
                         gap:.25rem; padding:0 0 .5rem }
     h1   14/20/500/#111
     time 14/20/460/rgba(0,0,0,.4)

   → gap 4, y 8 abajo del header entero. Los 8 ya los tenemos: el
   margin-bottom de .mast.

   Josh usa 16 (mt-4) en 4 de sus 5 subpáginas, pero su h1 es de 30px
   contra un párrafo de 16 — otra escala.

   Hoy no hay hueco: el h1 lleva margin 0 y lo único que separa es la
   interlínea. */

const MIN = 0
const MAX = 16
const STEP = 4
const HOY = 0

export function useMast() {
  const [gap, setGap] = useUrlNumber('mast', HOY, STEP, MIN, MAX)

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('mast', String(gap))
    history.replaceState(history.state, '', url)
  }, [gap])

  return { gap, setGap }
}

export function MastScrubber({ gap, setGap }: { gap: number; setGap: (v: number) => void }) {
  return (
    <ScrubberBar>
      <Scrubber
        label="Título → subtítulo"
        value={gap}
        onChange={setGap}
        min={MIN}
        max={MAX}
        step={STEP}
        tickEvery={4}
        marks={[4, 16]} /* benji · josh */
        width={300}
      />
    </ScrubberBar>
  )
}
