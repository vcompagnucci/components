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
  ir,
}: {
  vistas: Privada[]
  actual: string
  ir: (ruta: string) => void
}) {
  return (
    <div className={css.marco}>
      {/* Las solapas son links de verdad, con el mismo interceptor que la
          pieza de la lista: cmd-click abre pestaña nueva. */}
      <nav className={css.barra} aria-label="Privado">
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
      {actual === '/vault' ? <Vault /> : <Playground />}
    </div>
  )
}
