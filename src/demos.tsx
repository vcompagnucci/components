import { Suspense, lazy, type ComponentType } from 'react'
import css from './app.module.css'

/* ═══════════════════════════════════════════════════════════════
   EL DEMO VIVO DE UNA PIEZA WEB — el mapa slug → componente.

   Una pieza Web se demuestra corriendo, no en video: es la regla de
   `platform` en pieces.ts. Este archivo es el mecanismo: cada pieza es
   UNA CARPETA en src/components/pieces/, nombrada por su slug, cuyo
   index.tsx exporta el componente por defecto. `Photo grid` vive en
   src/components/pieces/photo-grid/ y no hay ningún registro que
   mantener a mano — la carpeta ES el mapa, la misma decisión que hace
   que la carpeta del vault sea el manifiesto.

   LA CARPETA TIENE LA FORMA DE components/animations/<slug>/ DE
   react-native-motion (desde el 2026-09-10): `index.tsx` que exporta,
   `<slug>.tsx` con la pieza, y al lado lo que la pieza necesite —las
   notas del detalle en `notes.tsx` (ver notas.tsx), datos, sub-partes.
   Una pieza App tiene la carpeta igual, sin index: su demo es el video.

   AHÍ LLEGA UN BOCETO CUANDO SE PUBLICA. Add to Exhibition, sobre el frame
   del tablero, copia el archivo desde src/privado/bocetos/ hasta acá y
   escribe el index al lado. Se copia y no se importa: src/privado/ no
   llega al build, así que una pieza publicada tiene que tener su archivo
   de este lado de la frontera. Por lo mismo, una pieza NO PUEDE importar
   nada de src/privado/ — era cierto para el boceto (nace autocontenido)
   y tiene que seguir siéndolo.

   Es el mismo trío que bocetos.tsx —glob perezoso, cache por ref,
   Suspense sin fallback— y no se comparte código a propósito: aquel
   archivo es del área privada y éste viaja al bundle. */
/* LA ÚNICA PROP QUE RECIBE UNA PIEZA: dónde está montada. En la lista
   es un PREVIEW adentro de una card que promete abrir el detalle, y eso
   cambia lo que puede hacer —un campo que se escribe ahí pelea con el
   clic de la card, y cuatro botones más por card ensucian el tabulador—.
   Es opcional: una pieza que no la mire no cambia en nada.

   Antes lo resolvía la pieza sola, mirando si tenía un <a> arriba. Dejó
   de servir el día que la card dejó de ser un ancla, que es exactamente
   por qué no era el camino: la pieza pasaba a depender del MARKUP del
   producto, que no es suyo. */
export type Montaje = 'lista' | 'detalle'

const MODULOS = import.meta.glob<{ default: ComponentType<{ modo?: Montaje }> }>(
  './components/pieces/*/index.tsx',
)

/* Uno por pieza y no uno por render: `lazy` guarda adentro la promesa
   del módulo, y crear otro remontaría el demo —con su estado— en cada
   render de la lista. */
const cache = new Map<string, ComponentType<{ modo?: Montaje }>>()

function componenteDe(slug: string): ComponentType<{ modo?: Montaje }> | null {
  const clave = `./components/pieces/${slug}/index.tsx`
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
   detalle, que es la misma con otro piso. Si la carpeta no tiene index
   —una entrada escrita a mano sin su pieza— no se dibuja nada, que es
   la caja vacía que ya había. */
export function DemoVivo({ slug, modo }: { slug: string; modo: Montaje }) {
  const C = componenteDe(slug)
  if (!C) return null
  return (
    <div className={css.demoVivo}>
      <Suspense fallback={null}>
        {/* oxlint-disable-next-line react/static-components -- `C` no se
            crea en cada render: `componenteDe` cachea el `lazy()` en un Map
            de nivel de módulo y devuelve la misma referencia por clave. El
            bug que la regla busca —perder el estado en cada render— acá no
            puede pasar. */}
        <C modo={modo} />
      </Suspense>
    </div>
  )
}
