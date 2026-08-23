import { createPortal } from 'react-dom'
import css from './playground.module.css'
import { Volver, clicDeLink } from '../parts'
import { useVistas, type Vista } from './vistas'

/* ═══════════════════════════════════════════════════════════════
   EL PLAYGROUND — donde se construye.

   SON VARIAS VISTAS, como entrar a distintos diseños en Figma. Ésta de
   acá es la lista de todas; cada una es un lienzo.

   Vive en la URL igual que el clip abierto del vault, y por la misma
   razón: sin eso, el gesto de atrás del trackpad te saca del playground
   entero en vez de cerrar la vista. /playground/<id>.
   ═══════════════════════════════════════════════════════════════ */

/* Sin nombre y sin diálogo. La vista nace con un nombre puesto y se
   renombra después, que es lo que hace Figma: un modal antes de ver nada
   te obliga a decidir cómo se llama algo que todavía no existe. */
const SIN_NOMBRE = 'Untitled'

export function Playground({
  abierta,
  ir,
  acciones,
}: {
  abierta: string
  ir: (ruta: string) => void
  acciones: HTMLElement | null
}) {
  const { estado, crear, borrar, cambiar } = useVistas()

  if (estado.cargando) return null

  if (!estado.conectado) {
    return (
      <div className={css.playground}>
        <p className={css.aviso}>
          Vault not connected: {estado.motivo}. Views are stored next to your clips.
        </p>
      </div>
    )
  }

  const vista = abierta ? estado.vistas.find((v) => v.id === abierta) : null

  if (vista) return <Lienzo vista={vista} cambiar={cambiar} borrar={borrar} />

  const nueva = () => {
    const v = crear(SIN_NOMBRE)
    ir('/playground/' + v.id)
  }

  /* Mismo hueco que usa el filtro del vault, en la otra punta de la
     barra. El playground pone acá lo suyo. */
  const accion = (
    <button className={css.accion} onClick={nueva}>
      New view
    </button>
  )

  return (
    <div className={css.playground}>
      {acciones && createPortal(accion, acciones)}
      {estado.vistas.length === 0 ? (
        <p className={css.aviso}>No views yet.</p>
      ) : (
        <ul className={css.lista}>
          {estado.vistas.map((v) => (
            <li key={v.id}>
              <a
                className={css.vista}
                href={'/playground/' + v.id}
                onClick={clicDeLink(() => ir('/playground/' + v.id))}
              >
                {v.nombre}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* EL LIENZO de una vista. Por ahora sólo la cabecera: los frames
   arrastrables son el paso que sigue. */
function Lienzo({
  vista,
  cambiar,
  borrar,
}: {
  vista: Vista
  cambiar: (id: string, f: (v: Vista) => Vista) => void
  borrar: (id: string) => void
}) {
  return (
    <div className={css.lienzo}>
      <div className={css.cabeza}>
        {/* history.back() y no ir('/playground'): es lo mismo que hacen
            el gesto de atrás y ⌘Z, así que hay UNA sola forma de cerrar.
            Igual que la flecha del clip abierto. */}
        <Volver onClick={() => history.back()} />
        {/* El nombre se edita en el lugar. No hay un modo "renombrar":
            es el título, y escribís encima. */}
        <input
          className={css.nombre}
          value={vista.nombre}
          aria-label="View name"
          onChange={(e) => cambiar(vista.id, (v) => ({ ...v, nombre: e.target.value }))}
        />
        <button
          className={css.accion}
          onClick={() => {
            borrar(vista.id)
            history.back()
          }}
        >
          Delete
        </button>
      </div>
      <div className={css.tela} />
    </div>
  )
}
