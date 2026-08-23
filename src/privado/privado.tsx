import { useEffect, useState } from 'react'
import css from './privado.module.css'
import { clicDeLink } from '../parts'
import type { Privada } from '../app'
import { Vault } from './vault'
import { Playground } from './playground'

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
  /* ⌘Z DESHACE LA ÚLTIMA NAVEGACIÓN.

     Es lo mismo que el gesto de atrás del trackpad, pero con el teclado
     — y en un lugar donde vas a estar con las dos manos en él, saltando
     de cuadro en cuadro con las flechas. Sacar la mano para hacer un
     gesto de dos dedos rompe eso.

     Hoy lo único que hay para deshacer es haber navegado. Cuando el
     playground tenga acciones de verdad —mover un frame, cambiar un
     valor— ⌘Z va a tener que deshacer ESO y no la navegación, y esta
     regla se vuelve el último eslabón de la pila y no el único.
     Anotado acá para que ese día no se descubra de casualidad.

     ⇧⌘Z queda libre a propósito: es rehacer, y no hay nada que rehacer
     todavía. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
    <div className={css.marco} data-detalle={enDetalle ? '' : undefined}>
      {/* Las solapas son links de verdad, con el mismo interceptor que la
          pieza de la lista: cmd-click abre pestaña nueva. */}
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
      {actual === '/vault' ? (
        <Vault abierto={resto} ir={ir} acciones={acciones} />
      ) : (
        <Playground abierta={resto} ir={ir} acciones={acciones} />
      )}
    </div>
  )
}
