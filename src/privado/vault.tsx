import { useState, type CSSProperties } from 'react'
import base from './privado.module.css'
import css from './vault.module.css'
import { Picker, Pila } from '../proto/picker'
import { enFecha, useClips, type Clip, type Fuente } from './clips'

/* ═══════════════════════════════════════════════════════════════
   EL VAULT — la pared de referencias.

   Lo que está DECIDIDO sale de que las dos referencias coinciden:
   media en 16:9, 64 entre filas, 8 del título al caption. Lo medido
   está en .context/recon/vault/GRILLA.md.

   Lo que está ABIERTO son las tres cosas que ninguna de las dos
   resuelve para nuestro material, y por eso van a un toggle de
   /prototype en vez de decidirse solas:

     forma      nuestros clips van de 0.46 a 1.60 y los de ellos son
                todos apaisados
     canaleta   figma usa 32 sin línea, linear 64 con línea
     columnas   "agrandar la grilla" puede ser más ancha o más columnas

   El toggle es andamio: cuando estén elegidas, las tres se hornean y
   el picker se va.
   ═══════════════════════════════════════════════════════════════ */

const FORMAS = ['contenida', 'recortada', 'libre'] as const
const CANALETAS = ['limpia', 'linea'] as const
const COLUMNAS = ['2', '3', '4'] as const
const FILTROS = ['todo', 'nativo', 'web'] as const

type Forma = (typeof FORMAS)[number]
type Canaleta = (typeof CANALETAS)[number]
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
  const [forma, setForma] = useState<Forma>('contenida')
  const [canaleta, setCanaleta] = useState<Canaleta>('limpia')
  const [columnas, setColumnas] = useState<(typeof COLUMNAS)[number]>('3')

  /* Arriba, para no chocar con el toggle de tema, que vive abajo y vale
     para toda la página. */
  const opciones = (
    <Pila posicion="arriba">
      <Picker etiqueta="forma" opciones={FORMAS} valor={forma} onCambio={setForma} />
      <Picker etiqueta="canaleta" opciones={CANALETAS} valor={canaleta} onCambio={setCanaleta} />
      <Picker etiqueta="columnas" opciones={COLUMNAS} valor={columnas} onCambio={setColumnas} />
    </Pila>
  )

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
        <p className={base.vacio} style={{ marginTop: 40, paddingInline: 0 }}>
          Sin clips acá.
        </p>
      ) : (
        <div
          className={css.grilla}
          data-forma={forma}
          data-canaleta={canaleta}
          data-columnas={columnas}
          style={{ '--vault-columnas': columnas } as CSSProperties}
        >
          {visibles.map((c) => (
            <Tarjeta clip={c} key={c.ruta} />
          ))}
        </div>
      )}
      {opciones}
    </div>
  )
}
