import { useState } from 'react'
import css from './vault.module.css'
import { enFecha, useClips, type Clip, type Fuente } from './clips'

/* ═══════════════════════════════════════════════════════════════
   EL VAULT — la pared de referencias.

   La forma de la card es la de benji en family-values, medida y
   horneada; el porqué de cada número está en vault.module.css y lo
   medido en .context/recon/vault/GRILLA.md. Se probaron con /prototype
   las tres respuestas obvias —16:9 conteniendo, 16:9 recortando, y la
   caja siguiendo al clip— y las tres fallaban con nuestro material.

   Ya no hay toggle: está decidido.
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
      <div className={css.cuerpo}>
        <div className={css.titulo}>
          {clip.nombre}
          <span className={css.flecha} aria-hidden>
            →
          </span>
        </div>
        <div className={css.caption}>
          {clip.fuente ? (
            <span className={css.fuente}>{clip.fuente}</span>
          ) : (
            <span className={css.suelto}>sin carpeta</span>
          )}
          <span>{enFecha(clip.fecha)}</span>
        </div>
      </div>
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
