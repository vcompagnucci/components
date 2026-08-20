import { useState } from 'react'
import css from './vault.module.css'
import { useClips, type Clip, type Fuente } from './clips'

/* ═══════════════════════════════════════════════════════════════
   EL VAULT — la pared de referencias.

   La card es la de benji en family-values, medida y horneada: caja con
   padding, el clip centrado adentro, el teléfono topado a 228. El
   porqué de cada número está en vault.module.css y lo medido en
   .context/recon/vault/GRILLA.md.

   Debajo de la card va SÓLO EL NOMBRE. Ni fecha ni categoría, aunque
   las dos referencias las llevan: acá la categoría ya la dice el filtro
   y la fecha no distingue nada, porque todos los clips entran el día
   que los arrastrás. La fecha sigue ordenando la grilla; lo que se fue
   es mostrarla.

   Ya no hay toggle: la forma y la altura están decididas.
   ═══════════════════════════════════════════════════════════════ */

const FILTROS = ['todo', 'nativo', 'web'] as const
type Filtro = (typeof FILTROS)[number]

/* El primer cuadro y nada más. Un <video> con preload="metadata" no
   decodifica ninguna imagen y la caja queda negra; el fragmento #t=
   obliga al navegador a buscar ahí y pintar ESE cuadro. 0.1 y no 0
   porque en 0 algunos contenedores todavía no tienen un cuadro clave. */
const primerCuadro = (url: string) => `${url}#t=0.1`

function Tarjeta({ clip }: { clip: Clip }) {
  return (
    <a className={css.card} href={clip.url} data-fuente={clip.fuente ?? undefined}>
      <div className={css.media}>
        {clip.clase === 'video' ? (
          <video src={primerCuadro(clip.url)} preload="metadata" muted playsInline />
        ) : (
          <img src={clip.url} alt="" loading="lazy" />
        )}
      </div>
      <div className={css.titulo}>{clip.nombre}</div>
    </a>
  )
}

export function Vault() {
  const estado = useClips()
  const [filtro, setFiltro] = useState<Filtro>('todo')

  if (estado.cargando) return null

  if (!estado.conectado) {
    return (
      <div className={css.vault}>
        <p className={css.aviso}>
          El vault no está conectado: {estado.motivo}. Poné la carpeta en{' '}
          <code>.env.local</code> como <code>VAULT_DIR=/ruta/a/tu/carpeta</code> y reiniciá el
          servidor.
        </p>
      </div>
    )
  }

  const visibles = estado.clips.filter((c) => filtro === 'todo' || c.fuente === (filtro as Fuente))

  return (
    <div className={css.vault}>
      <div className={css.filtros}>
        {FILTROS.map((f) => (
          <button
            className={css.filtro}
            key={f}
            data-activo={filtro === f ? '' : undefined}
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
          >
            {f}
          </button>
        ))}
        <span className={css.cuenta}>
          {visibles.length} de {estado.clips.length}
        </span>
      </div>

      {visibles.length === 0 ? (
        <p className={css.aviso}>Sin clips acá.</p>
      ) : (
        <div className={css.grilla}>
          {visibles.map((c) => (
            <Tarjeta clip={c} key={c.ruta} />
          ))}
        </div>
      )}
    </div>
  )
}
