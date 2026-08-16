import { useEffect } from 'react'
import { Scrubber, ScrubberBar, useUrlNumber } from './scrubber'

/* ⚠ EN ESTUDIO — el hueco del nombre de la pieza a su card. Se borra
   con src/proto/.

   Es una decisión de ojo y no de copia, y eso está verificado: ninguna
   de las dos referencias tiene nuestra estructura —una lista de pares
   [nombre corto + card grande] repetida 19 veces.

   Lo que sí tienen, medido del código servido:
     benji /liveline  cada sección ES un bloque. Encabezado con regla,
                      párrafo, y el bloque a 32 (margin-top:2rem inline)
     benji home       filas de texto, título y fecha en una línea, sin
                      bloque ninguno
     josh /dialkit    h3 de 16/500 + tabla a 16 (mt-4), dos o tres veces

   Por eso el recorrido va de 8 a 32: cubre lo que teníamos (12), lo de
   josh (16) y lo de benji (32), con las marcas puestas en esos tres.

   La FORMA ya está decidida y no se toca acá: el margen lo reclama el
   bloque de abajo, no lo empuja el título. Eso sí está verificado en la
   página real de benji, donde su gráfico lleva margin-top:2rem. */

const MIN = 8
const MAX = 32
const STEP = 4
const HORNEADO = 12

export function useGap() {
  const [gap, setGap] = useUrlNumber('gap', HORNEADO, STEP, MIN, MAX)

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('gap', String(gap))
    history.replaceState(history.state, '', url)
  }, [gap])

  return { gap, setGap }
}

export function GapScrubber({ gap, setGap }: { gap: number; setGap: (v: number) => void }) {
  return (
    <ScrubberBar>
      <Scrubber
        label="Nombre → card"
        value={gap}
        onChange={setGap}
        min={MIN}
        max={MAX}
        step={STEP}
        tickEvery={8}
        marks={[12, 16, 32]} /* lo que teníamos · josh · benji */
        width={300}
      />
    </ScrubberBar>
  )
}
