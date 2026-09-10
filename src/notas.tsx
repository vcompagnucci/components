import { Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import css from './app.module.css'
import { slug } from './pieces'

/* ═══════════════════════════════════════════════════════════════
   LAS NOTAS DE UNA PIEZA — el texto largo del detalle.

   Es para lo que existe el detalle: "la lista muestra, el detalle
   explica" (README). La descripción de PIECES es una línea y sigue
   siéndolo —es la que se escribe al publicar, y la que se lee de
   corrido bajo la pieza—; esto es lo otro: de dónde salió, cómo se
   midió, qué peleó.

   EL MECANISMO ES EL DE demos.tsx, a propósito: un archivo por slug en
   src/notas/, glob perezoso, cache por ref y Suspense sin fallback. El
   nombre ES el mapa y no hay registro que mantener — la misma decisión
   que hace que la carpeta del vault sea el manifiesto. Una pieza sin
   notas no dibuja nada y no rompe nada.

   Y son .tsx y no datos: una nota puede querer un link. Lo que NO puede
   es traerse tipografía propia — el estilo vive todo acá abajo, así que
   un archivo de notas es prosa y nada más.

   LA FORMA DE UNA NOTA: tres secciones como máximo, en el tono de josh
   (joshpuckett.me): "Anatomy" —para quien acaba de ver el video: qué
   está mirando y con qué está hecho, sólo LA ANIMACIÓN que da nombre a
   la pieza; lo que la rodea en la grabación no va ahí, y se escribe
   desde lo que se ve hacia el cómo, no desde la implementación (pedido
   del usuario, 2026-09-07)—, "Performance" —por dónde corre y qué se
   midió— y, sólo cuando la pieza lo pide, "Use cases". Dos o tres
   oraciones por párrafo, y ningún nombre de librería que el lector no
   reconozca: "React Native", no "Reanimated" (mismo pedido).
   Decidido con la primera pieza (2026-09-05). Y ES PROSA: se probó un
   subtítulo por parte adentro de "Anatomy" —un h3 con el nombre y su
   párrafo debajo, la forma de josh en /bloom— y el usuario lo rechazó
   en la página ("no me gusta esta estructura", 2026-09-07). Las partes
   se nombran al pasar, en el párrafo, con su término técnico (regla de
   nombres del repo, AGENTS.md › Método de trabajo). */
const MODULOS = import.meta.glob<{ default: ComponentType }>('./notas/*.tsx')

const cache = new Map<string, ComponentType>()

function componenteDe(name: string): ComponentType | null {
  const clave = './notas/' + slug(name) + '.tsx'
  const cargar = MODULOS[clave]
  if (!cargar) return null
  let c = cache.get(clave)
  if (!c) {
    c = lazy(cargar)
    cache.set(clave, c)
  }
  return c
}

/* UNA SECCIÓN DE LA NOTA, y su línea. El separador es EL MISMO que parte
   la lista en Web y App —.groupHead, rótulo 14/600 + hairline hasta el
   borde del riel, hueco de 8—, medido en su día del separador de benji
   en /liveline y /drawesome. Se reusa entero en vez de escribir otro:
   una sola línea en la página quiere decir una sola regla.

   Ojo con de quién es cada mitad: las LÍNEAS son de benji —josh no tiene
   una sola, cero <hr> en /melt-effect (SOURCE, 2026-09-04)— y el TONO de
   los rótulos es de josh, que titula corto y en sentence case ("The
   filter", "Apply it", "1. What's a displacement map?"). La mezcla es
   nuestra y por eso queda dicha. */
export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className={css.notaSeccion}>
      <div className={css.groupHead}>
        <h2 className={css.groupLabel}>{titulo}</h2>
        <span className={css.groupLine} aria-hidden />
      </div>
      {children}
    </section>
  )
}

export function Notas({ name }: { name: string }) {
  const C = componenteDe(name)
  if (!C) return null
  return (
    <div className={css.notas}>
      <Suspense fallback={null}>
        {/* oxlint-disable-next-line react/static-components -- `C` no se
            crea en cada render: `componenteDe` cachea el `lazy()` en un Map
            de nivel de módulo y devuelve la misma referencia por clave. El
            bug que la regla busca —perder el estado en cada render— acá no
            puede pasar. */}
        <C />
      </Suspense>
    </div>
  )
}
