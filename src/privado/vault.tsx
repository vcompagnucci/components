import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import css from './vault.module.css'
import { Volver, clicDeLink } from '../parts'
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

/* ─── POR QUÉ EL FILTRO VIVE EN LA BARRA ───
   Antes había DOS FILAS —las solapas arriba, el filtro abajo— y se
   leían como lo mismo dos veces: los dos eran texto suelto, del mismo
   peso, con el mismo par gris → activo, y a 13 contra 14 la diferencia
   de tamaño no se ve.

   Se fue a buscar cómo lo resuelven las referencias y la respuesta fue
   que NO LO TIENEN: en 7 páginas, benji nunca tiene más de una nav por
   página y josh tampoco, y ninguno usa tabs ni pills como navegación
   (los 25 tabs y 21 pills de /pasito son de un demo embebido, no de su
   chrome). Lo evitan en vez de resolverlo.

   El único que lo tiene es linear en /now, y su mecanismo es doble: su
   nav es una BANDA física —fixed, 73px, backdrop blur(20), border-bottom
   de 1px— y su título mide 48 contra los 16 del filtro. Tres veces. Sus
   filtros, para que quede dicho, son TEXTO PELADO: radio 0, sin fondo,
   sin padding, así que las pills tampoco salen de ahí.

   Y eso nombra la causa de fondo: las dos referencias que resuelven
   esto lo resuelven con un TAMAÑO, y nuestro sistema tiene uno solo.

   LA SALIDA ELEGIDA, mirando cuatro: una sola fila con uno en cada
   punta. Deja de haber dos filas parecidas porque deja de haber dos
   filas, y la POSICIÓN hace todo el trabajo — a la izquierda dónde
   estás, a la derecha qué estás filtrando. Sin tocar la escala.

   Se descartaron: la banda de linear, el título grande (que habría
   abierto la escala tipográfica), y las pills. */

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
  const video = useRef<HTMLVideoElement | null>(null)

  /* EL CLIP SE REPRODUCE AL PASAR EL PUNTERO. Medido en linear.app/now,
     que es lo mismo que hace benji con sus 53 videos de family-values —
     él los arranca al entrar en pantalla, linear al hover.

     Su comportamiento exacto, los cuatro puntos:

       en reposo       paused, mostrando el primer cuadro
       al hover        play(), y loop
       AL SALIR        pause() y SE QUEDA donde estaba: medido en t=2.18
                       después de salir, y al volver a entrar siguió en
                       3.09. No rebobina
       reduced-motion  NO reproduce. Verificado: con la preferencia
                       puesta, su video se queda en paused t=0

     Que retome en vez de volver a cero es el detalle que vale: en una
     pared de referencias el puntero se te va todo el tiempo, y rebobinar
     te haría empezar de nuevo cada vez.

     Es también lo que convierte esto en un vault de MOVIMIENTO: sin
     esto es un álbum de primeros cuadros congelados, y lo que se viene a
     mirar acá es cómo se mueven las cosas. */
  const reduce = () =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  const entrar = () => {
    if (reduce()) return
    video.current?.play().catch(() => {})
  }
  const salir = () => video.current?.pause()

  return (
    /* Es un <a href> de verdad, igual que la pieza del producto: el clic
       pelado abre el detalle, y cmd-click abre el clip en una pestaña
       nueva. Mismo interceptor.

       El disparador es la CARD entera y no el video: el hueco es de 405
       de ancho y el clip puede medir 228, así que apuntarle sólo al
       video dejaría media card muerta. */
    <a
      className={css.card}
      href={rutaDeClip(clip.ruta)}
      data-fuente={clip.fuente ?? undefined}
      onClick={clicDeLink(() => onAbrir(clip))}
      onMouseEnter={entrar}
      onMouseLeave={salir}
      /* Y también con el teclado: si podés llegar tabulando, tenés que
         poder ver lo mismo que con el puntero. */
      onFocus={entrar}
      onBlur={salir}
    >
      <div className={css.media}>
        {clip.clase === 'video' ? (
          <video
            ref={video}
            src={primerCuadro(clip.url)}
            preload="metadata"
            muted
            loop
            playsInline
          />
        ) : (
          <img src={clip.url} alt="" loading="lazy" />
        )}
      </div>
      <div className={css.titulo}>{clip.nombre}</div>
    </a>
  )
}

export function Vault({
  abierto,
  ir,
  acciones,
}: {
  abierto: string
  ir: (ruta: string) => void
  /* El hueco que la barra deja para el control de la vista. Llega en
     null en el primer render, antes de que el nodo exista. */
  acciones: HTMLElement | null
}) {
  const estado = useClips()
  const [filtro, setFiltro] = useState<Filtro>('all')

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
    <div className={css.vault}>
      {/* El filtro se dibuja DENTRO de la barra, en la otra punta de su
          fila. Por portal y no por coordenadas: adentro, flexbox lo
          acomoda y el ancho chico se resuelve solo. */}
      {acciones && createPortal(filtros, acciones)}
      {visibles.length === 0 ? (
        <p className={css.aviso}>Nothing here.</p>
      ) : (
        <div className={css.grilla}>
          {visibles.map((c) => (
            <Tarjeta clip={c} onAbrir={(x) => ir(rutaDeClip(x.ruta))} key={c.ruta} />
          ))}
        </div>
      )}
    </div>
  )
}
