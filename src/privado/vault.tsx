import { useEffect, useState } from 'react'
import css from './vault.module.css'
import { Volver, clicDeLink } from '../parts'
import { Picker, Pila } from '../proto/picker'
import { Reproductor } from './reproductor'
import { useClips, type Clip, type Fuente } from './clips'

/* ═══════════════════════════════════════════════════════════════
   EL VAULT — la pared de referencias.

   La card es la de benji en family-values, medida y horneada. El
   porqué de cada número está en vault.module.css y lo medido en
   .context/recon/vault/GRILLA.md.

   EL CLIP ABIERTO VIVE EN LA URL, no en un useState. Estaba en estado
   local y eso producía un bug que se sentía como un error del
   navegador: abrías un clip, hacías el gesto de atrás en el trackpad, y
   en vez de cerrarlo te sacaba del vault entero. Ahora /vault/<ruta> es
   una entrada de historial de verdad, así que atrás cierra el clip —
   y de paso cada referencia queda linkeable.
   ═══════════════════════════════════════════════════════════════ */

/* El valor es DATO —"native" y "web" son las carpetas del vault— y la
   etiqueta es lo que se lee. Separados porque no tienen por qué
   coincidir, y de hecho no coinciden: el filtro "all" no es una
   carpeta. */
const FILTROS = [
  { valor: 'all', etiqueta: 'All' },
  { valor: 'native', etiqueta: 'Native' },
  { valor: 'web', etiqueta: 'Web' },
] as const
type Filtro = (typeof FILTROS)[number]['valor']

/* ─── LA JERARQUÍA DE LA CABECERA ───
   Hoy la barra de vistas y el filtro se leen como lo mismo dos veces:
   los dos son texto suelto, del mismo peso, con el mismo par
   gris → activo, y a 13 contra 14 la diferencia de tamaño no se ve.

   Y la causa es estructural: en las dos referencias hay un TÍTULO DE
   PÁGINA entre las dos filas —linear pone "Now" y figma "Articles", los
   dos a 55px— y nosotros no. Sin ese padre, las dos filas quedan de
   hermanas.

   SE FUE A BUSCAR CÓMO LO RESUELVEN ELLOS Y LA RESPUESTA FUE QUE NO LO
   TIENEN. Medido en 7 páginas: benji nunca tiene más de UNA nav por
   página, y josh tampoco. Ninguno de los dos usa tabs ni pills como
   navegación —los 25 tabs y 21 pills que aparecen en /pasito son de un
   demo embebido, no de su chrome—. Evitan el problema en vez de
   resolverlo.

   EL ÚNICO QUE LO TIENE ES LINEAR, en /now, y su mecanismo es doble:

     su nav es una BANDA      fixed, 73px de alto, backdrop blur(20px)
                              y border-bottom de 1px. No es texto
                              flotando: está separada físicamente
     su título mide 48px      contra los 16 del filtro. TRES VECES
     sus filtros son TEXTO    radio 0, sin fondo, sin padding — o sea
                              que las pills no salen de él tampoco

   Y ahí está la causa de fondo: las dos referencias que resuelven esto
   lo hacen con un TAMAÑO, y nuestro sistema tiene uno solo. Por eso las
   dos filas se parecen tanto.

   Cuatro salidas. Las tres primeras no tocan la escala; la cuarta la
   abre a propósito, porque es lo que ellos hacen de verdad: */
const JERARQUIAS = ['banda', 'extremos', 'pills', 'titulo'] as const
type Jerarquia = (typeof JERARQUIAS)[number]

/* El primer cuadro y nada más. Un <video> con preload="metadata" no
   decodifica ninguna imagen y la caja queda negra; el fragmento #t=
   obliga al navegador a buscar ahí y pintar ESE cuadro. 0.1 y no 0
   porque en 0 algunos contenedores todavía no tienen un cuadro clave. */
const primerCuadro = (url: string) => `${url}#t=0.1`

/* La ruta de un clip, codificada segmento por segmento: encodeURI
   entero dejaría pasar un "#" o un "?" en el nombre del archivo y
   partiría la URL. */
export const rutaDeClip = (ruta: string) =>
  '/vault/' + ruta.split('/').map(encodeURIComponent).join('/')

function Tarjeta({ clip, onAbrir }: { clip: Clip; onAbrir: (c: Clip) => void }) {
  return (
    /* Es un <a href> de verdad, igual que la pieza del producto: el clic
       pelado abre el detalle, y cmd-click abre el clip en una pestaña
       nueva. Mismo interceptor. */
    <a
      className={css.card}
      href={rutaDeClip(clip.ruta)}
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

export function Vault({ abierto, ir }: { abierto: string; ir: (ruta: string) => void }) {
  const estado = useClips()
  const [filtro, setFiltro] = useState<Filtro>('all')
  const [jerarquia, setJerarquia] = useState<Jerarquia>('titulo')

  /* Va en <html> y no en el nodo del vault porque las dos filas que hay
     que separar viven en componentes distintos: la barra de vistas la
     dibuja Privado y el filtro lo dibuja esto. Es andamio — cuando la
     opción esté elegida, el atributo y el picker se van juntos. */
  useEffect(() => {
    document.documentElement.dataset.jerarquia = jerarquia
    return () => {
      delete document.documentElement.dataset.jerarquia
    }
  }, [jerarquia])

  if (estado.cargando) return null

  if (!estado.conectado) {
    return (
      <div className={css.vault}>
        <p className={css.aviso}>
          Vault not connected: {estado.motivo}. Set the folder in <code>.env.local</code> as{' '}
          <code>VAULT_DIR=/path/to/your/folder</code> and restart the server.
        </p>
      </div>
    )
  }

  /* El clip abierto sale de la URL. Si la ruta no existe —un link viejo,
     un archivo que borraste— se vuelve a la grilla en vez de dejar la
     pantalla en blanco. */
  const clip = abierto ? estado.clips.find((c) => c.ruta === abierto) : null

  if (clip) {
    return (
      <div className={css.detalle}>
        <div className={css.detalleCabeza}>
          {/* Atrás y ⌘Z hacen lo mismo que esta flecha porque los tres
              son history.back(): una sola forma de cerrar. */}
          <Volver onClick={() => history.back()} />
          <h1 className={css.detalleTitulo}>{clip.nombre}</h1>
        </div>
        <div className={css.escenario}>
          {clip.clase === 'video' ? (
            <Reproductor clip={clip} />
          ) : (
            <img className={css.foto} src={clip.url} alt="" />
          )}
        </div>
      </div>
    )
  }

  const visibles = estado.clips.filter((c) => filtro === 'all' || c.fuente === (filtro as Fuente))

  const filtros = (
    <div className={css.filtros}>
      {FILTROS.map((f) => (
        <button
          className={css.filtro}
          key={f.valor}
          data-activo={filtro === f.valor ? '' : undefined}
          aria-pressed={filtro === f.valor}
          onClick={() => setFiltro(f.valor)}
        >
          {f.etiqueta}
        </button>
      ))}
    </div>
  )

  return (
    <div className={css.vault} data-jerarquia={jerarquia}>
      {/* El título de página existe en las dos referencias y acá no
          estaba: es el padre que le faltaba a las dos filas para dejar
          de leerse como hermanas. En la variante "una-fila" se esconde,
          porque ahí lo que separa es la posición. */}
      <h1 className={css.encabezado}>Vault</h1>
      {filtros}
      {visibles.length === 0 ? (
        <p className={css.aviso}>Nothing here.</p>
      ) : (
        <div className={css.grilla}>
          {visibles.map((c) => (
            <Tarjeta clip={c} onAbrir={(x) => ir(rutaDeClip(x.ruta))} key={c.ruta} />
          ))}
        </div>
      )}
      <Pila posicion="arriba">
        <Picker
          etiqueta="hierarchy"
          opciones={JERARQUIAS}
          valor={jerarquia}
          onCambio={setJerarquia}
        />
      </Pila>
    </div>
  )
}
