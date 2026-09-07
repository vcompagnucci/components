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
   (joshpuckett.me): "Anatomy" —con qué está hecha y de qué partes—,
   "Performance" —por dónde corre y qué se midió— y, sólo cuando la
   pieza lo pide, "Use cases". Dos o tres oraciones por sección.
   Decidido con la primera pieza (2026-09-05). Adentro de "Anatomy", una
   `Parte` por pieza del mecanismo —el nombre y, debajo, qué es y qué
   hace—, que es como josh desarma Bloom (2026-09-07, ver `Parte`). Los
   nombres de las partes son los términos técnicos, por la regla de
   nombres del repo (AGENTS.md › Método de trabajo). */
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

/* UNA PARTE DE LA ANATOMÍA: el nombre y lo que hace. Es la forma en que
   josh desarma un componente en /bloom (API Reference, medido el
   2026-09-07 sobre la página servida): un h3 con el nombre —16/500/24,
   la tinta del título— y debajo, a 8 px, un párrafo de una o dos
   oraciones —16/400/24, gris—; cada parte a 64 de la anterior. Acá el
   nombre toma --type-h3 (14/500/20, el título de pieza: el mismo rol,
   un nombre corto que encabeza algo) y el párrafo sigue siendo el
   cuerpo en tinta, como toda la prosa de las notas; los 8 son
   --note-part-gap y entre partes va el hueco de párrafos (el 64 de josh
   es también su hueco de sección, y ese acá ya es --section-gap). Es
   un <h3> y no un <strong> porque está debajo del <h2> de la sección:
   el outline de la página dice lo mismo que la vista. */
export function Parte({ nombre, children }: { nombre: string; children: ReactNode }) {
  return (
    <div className={css.notaParte}>
      <h3 className={css.notaParteNombre}>{nombre}</h3>
      <p>{children}</p>
    </div>
  )
}

export function Notas({ name }: { name: string }) {
  const C = componenteDe(name)
  if (!C) return null
  return (
    <div className={css.notas}>
      <Suspense fallback={null}>
        <C />
      </Suspense>
    </div>
  )
}
