import { useEffect } from 'react'
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

  /* Con un clip abierto el marco tiene que CLAVARSE a la ventana, no
     sólo llenarla como mínimo: es lo que le da un techo del cual colgar
     a la cadena de flex que hace entrar el clip. La grilla no lo lleva
     porque tiene que poder crecer y scrollear. */
  const enDetalle = actual === '/vault' && resto !== ''

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
      </nav>
      {actual === '/vault' ? <Vault abierto={resto} ir={ir} /> : <Playground />}
    </div>
  )
}
