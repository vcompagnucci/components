import { useEffect, useState } from 'react'
import css from './private.module.css'
import { clicDeLink } from '../parts'
import type { Privada } from '../app'
import { Vault } from './vault'
import { Playground } from './playground'

/* Acá vivió una barra de solapas para la portada —los links de entrada
   a Vault y Playground sobre la home de dev— y se quitó por pedido: al
   área privada se entra por URL, sin puerta visible. La portada es la
   página del producto y no lleva chrome de desarrollo. */

/* ═══════════════════════════════════════════════════════════════
   EL ÁREA PRIVADA — el vault y el playground.

   TODO LO QUE CUELGA DE ESTA CARPETA EXISTE SÓLO EN DESARROLLO. La
   puerta está en app.tsx, en una sola línea:

     const Privado = import.meta.env.DEV ? lazy(() => import(...)) : null

   En el build Vite reemplaza import.meta.env.DEV por `false`, el
   ternario se pliega a `null` y Rollup borra el import dinámico entero.
   No es que la ruta dé 404: es que el código NO ESTÁ. Verificado
   contando ocurrencias en dist/ — ver el README.

   Por eso el borde es una carpeta y no un flag repartido: cualquier
   archivo que se agregue acá adentro hereda la puerta sin que nadie
   tenga que acordarse.

   LA DEPENDENCIA VA EN UN SOLO SENTIDO. Esto puede importar del
   producto (tokens, clicDeLink); el producto no puede importar de acá,
   porque eso lo arrastraría al bundle.

   SON DOS COSAS EN UN MISMO LUGAR. El vault es lo que mirás; el
   playground es donde construís. Comparten marco y nada más.
   ═══════════════════════════════════════════════════════════════ */

/* La lista de rutas llega POR PROP y no se declara acá. Vive en app.tsx
   —el router ya es el que sabe qué rutas existen, igual que con las
   piezas— y además tiene que quedar de ese lado para poder plegarse a []
   en el build. Acá sólo se dibuja. */
export default function Privado({
  vistas,
  actual,
  resto,
  ir,
}: {
  vistas: Privada[]
  actual: string
  resto: string
  ir: (ruta: string) => void
}) {
  /* ⌘Z DESHACE LA ÚLTIMA NAVEGACIÓN — Y ES EL ÚLTIMO ESLABÓN, NO EL
     ÚNICO.

     Es lo mismo que el gesto de atrás del trackpad, pero con el teclado
     — y en un lugar donde vas a estar con las dos manos en él, saltando
     de cuadro en cuadro con las flechas. Sacar la mano para hacer un
     gesto de dos dedos rompe eso.

     ESE DÍA LLEGÓ: el playground ya tiene acciones de verdad —mover un
     frame, agregar un clip, borrar una vista— y su ⌘Z deshace ESO. Su
     manejador escucha en CAPTURA, así que corre antes que éste sin
     depender del orden en que montaron los efectos, y marca el evento
     con preventDefault. Acá alcanza con apartarse al verlo marcado.

     O sea que en el vault ⌘Z sigue siendo "volver", y en el playground
     es "deshacer". El que no tiene nada que deshacer cede.

     ⇧⌘Z ya no queda libre: es rehacer, y lo atiende el playground. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* Ya lo tomó alguien con más derecho — ver arriba. */
      if (e.defaultPrevented) return
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      if (e.shiftKey) return
      const t = e.target as HTMLElement | null
      /* En un campo de texto ⌘Z es deshacer LO QUE ESCRIBISTE, y eso lo
         hace el navegador mejor que nosotros. */
      if (t instanceof HTMLElement && (t.closest('input, textarea') || t.isContentEditable)) return
      e.preventDefault()
      history.back()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  /* Con algo ABIERTO —un clip o una vista— el marco tiene que CLAVARSE a
     la ventana y no sólo llenarla como mínimo: es lo que le da un techo
     del cual colgar a la cadena de flex que hace entrar el clip, y lo
     mismo necesita el lienzo del playground para medirse contra lo que
     queda de pantalla.

     Las dos LISTAS —la grilla y las vistas— no lo llevan, porque tienen
     que poder crecer y scrollear. Por eso la condición mira `resto` y no
     en qué vista estás: lo que decide es si hay algo abierto. */
  const enDetalle = resto !== ''

  /* ─── ADENTRO DE ALGO NO HAY SOLAPAS ───
     Abierto un clip o un lienzo, la barra de solapas NO se dibuja.

     Antes esto valía sólo para el lienzo, con este argumento: "el
     detalle de un clip sigue llevando su barra, porque ahí seguís
     mirando el vault". Se revirtió por pedido, y el argumento se cae
     solo cuando se mira la pantalla: en el detalle NO se puede ir a
     Playground sin volver primero, así que las dos palabras no son
     navegación —son un rótulo de dónde estás—, y eso ya lo dice el
     título del clip, que está justo debajo.

     La salida tampoco depende de ellas: la flecha de volver, el gesto
     de atrás y ⌘Z hacen los tres history.back().

     Y ADEMÁS PAGA. El detalle está atado al alto de la ventana
     —height:100dvh, overflow:hidden— y el reproductor reparte lo que
     sobra: sacar la fila de chrome no deja un hueco, se lo lleva el
     clip, que es lo único que se vino a mirar.

     EL HUECO DE ACCIONES SE VA CON ELLA, y no se pierde nada: el único
     que lo usa es el filtro del vault, que sólo existe en la grilla. El
     detalle nunca portaleó nada ahí. */
  const sinSolapas = enDetalle

  /* El lienzo además ENTREGA EL AIRE VERTICAL del marco: es a sangre en
     los cuatro lados y lo único que lo acota es su propia sidebar. Sin
     esto quedaban 80px de canvas arriba y otros 80 abajo de una tela
     que tiene que llegar al borde de la ventana. El detalle de un clip
     no: ahí el aire sigue siendo parte de la composición. */
  const enLienzo = actual === '/playground' && enDetalle

  /* EL HUECO DE ACCIONES de la barra. La vista que esté abierta pone
     acá su propio control —el vault pone su filtro— y queda en la MISMA
     FILA que las solapas, contra la otra punta.

     Va por portal y no por coordenadas. La primera versión ponía el
     filtro en position:absolute contra el marco, y eso funcionaba pero
     ataba la posición del filtro al padding del marco y a la altura de
     la barra: cualquiera de los dos que se moviera lo dejaba corrido, y
     en una ventana angosta no había forma de que bajara solo. Estando
     ADENTRO de la barra, flexbox lo acomoda y el ancho chico se resuelve
     con la misma regla que todo lo demás.

     El ref se guarda en estado y no en un useRef porque el hijo tiene
     que RE-RENDERIZAR cuando el nodo existe; un ref no avisa. */
  const [acciones, setAcciones] = useState<HTMLElement | null>(null)

  return (
    <div
      className={css.marco}
      data-detalle={enDetalle ? '' : undefined}
      data-lienzo={enLienzo ? '' : undefined}
    >
      {/* Las solapas son links de verdad, con el mismo interceptor que la
          pieza de la lista: cmd-click abre pestaña nueva. */}
      {!sinSolapas && (
        <nav className={css.barra} aria-label="Private">
          {vistas.map((v) => (
            <a
              className={css.solapa}
              key={v.ruta}
              href={v.ruta}
              data-activa={actual === v.ruta ? '' : undefined}
              aria-current={actual === v.ruta ? 'page' : undefined}
              onClick={clicDeLink(() => ir(v.ruta))}
            >
              {v.nombre}
            </a>
          ))}
          <div className={css.acciones} ref={setAcciones} />
        </nav>
      )}
      {actual === '/vault' ? (
        <Vault abierto={resto} ir={ir} acciones={acciones} />
      ) : (
        <Playground abierta={resto} ir={ir} acciones={acciones} />
      )}
    </div>
  )
}
