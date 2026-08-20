import { useEffect, useState } from 'react'
import css from './vault.module.css'
import { Volver, clicDeLink } from '../parts'
import { Picker, Pila } from '../proto/picker'
import { Reproductor, type Controles, type Pista } from './reproductor'
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

/* Los dos ejes del reproductor que todavía no están decididos. Ver
   reproductor.module.css: uno existe porque apple y benji no coinciden
   en dónde ponen sus controles, y el otro porque para la barra de
   tiempo no hay NINGUNA referencia medible. */
const CONTROLES: readonly Controles[] = ['barra', 'esquinas']
const PISTAS: readonly Pista[] = ['fina', 'media', 'oculta']

function Tarjeta({ clip, onAbrir }: { clip: Clip; onAbrir: (c: Clip) => void }) {
  return (
    /* Es un <a href> de verdad, igual que la pieza del producto: el clic
       pelado abre el detalle acá adentro, pero cmd-click te abre el
       archivo crudo en una pestaña, que para un clip es exactamente lo
       que querés a veces. Mismo interceptor. */
    <a
      className={css.card}
      href={clip.url}
      data-fuente={clip.fuente ?? undefined}
      onClick={clicDeLink(() => onAbrir(clip))}
    >
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
  const [abierto, setAbierto] = useState<Clip | null>(null)
  const [controles, setControles] = useState<Controles>('barra')
  const [pista, setPista] = useState<Pista>('media')

  /* Escape cierra el detalle, igual que en el producto. */
  useEffect(() => {
    if (!abierto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto])

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

  /* Los dos toggles sólo tienen sentido con un clip abierto: son del
     reproductor, no de la grilla. Arriba, para no chocar con el tema. */
  if (abierto) {
    return (
      <div className={css.detalle}>
        <Volver onClick={() => setAbierto(null)} />
        <h1 className={css.detalleTitulo}>{abierto.nombre}</h1>
        <div className={css.escenario}>
          {abierto.clase === 'video' ? (
            <Reproductor clip={abierto} controles={controles} pista={pista} />
          ) : (
            <img src={abierto.url} alt="" />
          )}
        </div>
        {abierto.clase === 'video' && (
          <Pila posicion="arriba">
            <Picker
              etiqueta="controles"
              opciones={CONTROLES}
              valor={controles}
              onCambio={setControles}
            />
            <Picker etiqueta="pista" opciones={PISTAS} valor={pista} onCambio={setPista} />
          </Pila>
        )}
      </div>
    )
  }

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
            <Tarjeta clip={c} onAbrir={setAbierto} key={c.ruta} />
          ))}
        </div>
      )}
    </div>
  )
}
