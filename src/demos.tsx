import { Suspense, lazy, type ComponentType } from 'react'
import css from './app.module.css'
import { slug } from './pieces'

/* ═══════════════════════════════════════════════════════════════
   EL DEMO VIVO DE UNA PIEZA WEB — el mapa nombre → componente.

   Una pieza Web se demuestra corriendo, no en video: es la regla de
   `platform` en pieces.ts. Este archivo es el mecanismo: cada pieza es
   UN archivo en src/piezas/, nombrado por su slug, que exporta el
   componente por defecto. `Photo grid` vive en src/piezas/photo-grid.tsx
   y no hay ningún registro que mantener a mano — el nombre ES el mapa,
   la misma decisión que hace que la carpeta del vault sea el manifiesto.

   AHÍ LLEGA UN BOCETO CUANDO SE PUBLICA. Add to Exhibition, sobre el frame
   del tablero, copia el archivo desde src/privado/bocetos/ hasta acá.
   Se copia y no se importa: src/privado/ no llega al build, así que una
   pieza publicada tiene que tener su archivo de este lado de la
   frontera. Por lo mismo, una pieza NO PUEDE importar nada de
   src/privado/ — era cierto para el boceto (nace autocontenido) y tiene
   que seguir siéndolo.

   Es el mismo trío que bocetos.tsx —glob perezoso, cache por ref,
   Suspense sin fallback— y no se comparte código a propósito: aquel
   archivo es del área privada y éste viaja al bundle. */
const MODULOS = import.meta.glob<{ default: ComponentType }>('./piezas/*.tsx')

/* Uno por pieza y no uno por render: `lazy` guarda adentro la promesa
   del módulo, y crear otro remontaría el demo —con su estado— en cada
   render de la lista. */
const cache = new Map<string, ComponentType>()

function componenteDe(name: string): ComponentType | null {
  const clave = './piezas/' + slug(name) + '.tsx'
  const cargar = MODULOS[clave]
  if (!cargar) return null
  let c = cache.get(clave)
  if (!c) {
    c = lazy(cargar)
    cache.set(clave, c)
  }
  return c
}

/* El demo dentro de la caja de la card — la de la lista y la del
   detalle, que es la misma con otro piso. Si el archivo no está —una
   entrada escrita a mano sin su pieza— no se dibuja nada, que es la
   caja vacía que ya había. */
export function DemoVivo({ name }: { name: string }) {
  const C = componenteDe(name)
  if (!C) return null
  return (
    <div className={css.demoVivo}>
      <Suspense fallback={null}>
        <C />
      </Suspense>
    </div>
  )
}
