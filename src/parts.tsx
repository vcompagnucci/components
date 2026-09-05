import type { MouseEvent } from 'react'
import css from './app.module.css'
import { slug, type Piece } from './pieces'
import { DemoVivo } from './demos'
import { Notas } from './notas'

/* Piezas de la página, cada una con una sola responsabilidad. Viven
   acá y no en app.tsx para que app quede sólo con la composición. */

/* El slug vive en pieces.ts —lo comparten la página, rutas.mjs y el
   puente que publica— y de acá sólo se re-exporta para los lectores
   que ya lo importaban de este lado. */
export { slug }

/* EL INTERCEPTOR DE UN LINK DE CLIENTE. Medido en benji: su ítem de
   lista es un <a href="/drawesome"> y el clic normal navega del lado del
   cliente —cero pedidos de documento— pero cmd-click abre pestaña nueva.

   Deja pasar todo lo que el navegador hace mejor: cualquier tecla
   modificadora, y cualquier botón que no sea el principal. Sólo el clic
   pelado se convierte en navegación de cliente. Sin esto no hay
   cmd-click, ni clic del medio, ni "abrir en pestaña nueva" o "copiar
   dirección" en el menú contextual.

   Vive acá y no adentro de un componente porque lo usan dos: la pieza de
   la lista y las solapas del área privada. Es la regla, no un detalle de
   ninguno de los dos. */
export function clicDeLink(accion: () => void) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (e.button !== 0) return
    e.preventDefault()
    accion()
  }
}

/* La BASE de un renglón: la línea sobre la que se apoyan las letras.
   Es por donde se alinean dos textos, y no por el medio de sus cajas:
   los renglones del índice son 13/16 y los de la página 14/20, así que
   centrarlos deja las letras apoyadas en dos alturas distintas.

   No hay API que la dé, así que se mide con una sonda: un inline-block
   de alto cero con vertical-align:baseline se apoya exactamente ahí, y
   como no tiene alto, su borde superior ES la base. Entra y sale en el
   mismo tick, así que React nunca la ve. */
export function baseDeTexto(el: HTMLElement) {
  const sonda = document.createElement('span')
  sonda.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
  el.appendChild(sonda)
  const y = sonda.getBoundingClientRect().top
  sonda.remove()
  return y
}

export function Masthead() {
  return (
    <header className={css.mast}>
      <h1 className={css.mastTitle}>Library</h1>
      <div className={css.mastSub}>Components for web and native apps that feel right.</div>
    </header>
  )
}

/* La pieza entera es el botón: el título también es clickeable y entra
   por teclado, no sólo el rectángulo. El id lo usa el índice para
   saltar hasta acá. */
export function Item({
  piece,
  onOpen,
  primera,
}: {
  piece: Piece
  onOpen: (p: Piece) => void
  /* La primera pieza lleva la marca contra la que se alinea el índice:
     "Web" se apoya en la misma línea que este título. */
  primera?: boolean
}) {
  /* ES UN <a href> DE VERDAD, no un botón. Era un <button> con pushState
     y por eso un lector de pantalla anunciaba "botón" y no había ninguna
     de las affordances de un link. El porqué del interceptor está arriba,
     en clicDeLink. */
  return (
    <a
      className={css.streamItem}
      id={slug(piece.name)}
      href={`/${slug(piece.name)}`}
      onClick={clicDeLink(() => onOpen(piece))}
    >
      <div className={css.streamTitle} data-primera-pieza={primera ? '' : undefined}>
        {piece.name}
      </div>
      <div className={css.streamPreview}>
        <Muestra piece={piece} />
      </div>
    </a>
  )
}

/* ─── CÓMO SE MUESTRA UNA PIEZA ───
   Lo decide `platform`, que es la regla de pieces.ts: App es su
   grabación, Web es el componente CORRIENDO — el mapa nombre → archivo
   vive en demos.tsx. La misma muestra sirve a la lista y al detalle,
   porque la decisión del producto es que el preview vivo esté en las
   dos.

   La grabación autoreproduce, muda y en loop: acá el movimiento ES el
   contenido, y es lo que hacen los demos de benji en family-values —45
   videos girando a la vez—. La regla contraria del playground (arranca
   quieto, lo despierta un clic) es de un tablero de estudio donde ocho
   loops pelean por tu atención; una exposición existe para mostrarse
   sola.

   El video ocupa el hueco del teléfono que la caja ya reservaba —el
   mismo ancho por token— y la altura sale de la proporción del archivo,
   que en una grabación de iPhone es la del teléfono. El ::before que
   reservaba ese hueco en vacío se apaga solo (ver :has en
   app.module.css). */
function Muestra({ piece }: { piece: Piece }) {
  if (piece.video) {
    /* Con alfa, el video es transparente y el fondo lo pone la card:
       el .mov (HEVC con alfa) va PRIMERO para Safari, que es el único
       que lo abre; Chrome y Firefox lo saltan por el type y toman el
       WebM VP9 con alfa. Al revés, Safari tomaría el WebM y lo
       dibujaría sobre negro. */
    if (piece.videoHevc)
      return (
        <video className={css.demo} autoPlay muted loop playsInline>
          <source src={piece.videoHevc} type='video/quicktime; codecs="hvc1"' />
          <source src={piece.video} type="video/webm" />
        </video>
      )
    return <video className={css.demo} src={piece.video} autoPlay muted loop playsInline />
  }
  if (piece.platform === 'Web') return <DemoVivo name={piece.name} />
  return null
}

/* La flecha de volver. Vive acá y no adentro de Detail porque la usan
   dos: el detalle de una pieza y el de un clip del vault. El hover
   pinta SÓLO el glifo y no el cuadrado de 34×34 —que es el área de
   click y queda invisible—; es unánime en las dos referencias y está
   explicado en app.module.css. */
/* `extra` existe para UN caso y conviene decir cuál: .back trae un
   margin-bottom de 24 porque nació encima de un título, en su propia
   fila. Desde que la cabecera del detalle del vault es UNA fila —la
   flecha, el título y el toggle juntos, ver detalleCabeza— ese margen
   ahí abajo empuja el alto de la fila y descentra la flecha. El
   llamador que lo necesita lo apaga; los demás no se enteran. */
/* ─── ES UN CHEVRON, NO UNA FLECHA ───
   Era "←", el carácter. Lo cambia Toolbars › Navigation, que pide el
   Back ESTÁNDAR y su símbolo: "Use the standard Back and Close buttons.
   People know that the standard Back button lets them retrace their
   steps… Prefer the standard symbols for each, and don't use a text
   label that says Back". El estándar de Apple es un chevron.

   La flecha no venía de ningún lado medido, y vale decirlo porque el
   README llegó a citar a benji y josh: los dos usan PALABRAS —"Index",
   "Home"—, así que ninguno respaldaba el "←". Era nuestro y sin recibo.

   Y VA DIBUJADO, no escrito, por lo mismo que el + de la grilla: un
   glifo se apoya en la línea de base, así que dentro de una caja nunca
   queda centrado. 16×16 y trazo 1.5, las medidas del resto de los
   glifos; la punta en x=6 y los brazos en 10 lo dejan centrado exacto. */
export function Volver({ onClick, extra }: { onClick: () => void; extra?: string }) {
  return (
    <button
      className={extra ? `${css.back} ${extra}` : css.back}
      aria-label="Back"
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M10 4 6 8l4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export function Detail({ piece, onBack }: { piece: Piece; onBack: () => void }) {
  return (
    <div className={css.content}>
      <div className={css.detail}>
        <Volver onClick={onBack} />
        {/* LA DESCRIPCIÓN VA DEBAJO DE LA PIEZA, no arriba. Primero se
            ve la cosa y después se lee qué es: la lista muestra y el
            detalle explica, así que la prosa entra cuando el preview ya
            contestó. Arriba queda el par que SÍ está medido en benji —
            título y una línea secundaria a 4px, su <h1> con su <time>. */}
        <div className={css.detailHead}>
          <h1 className={css.detailTitle}>{piece.name}</h1>
          <div className={css.detailMeta}>{piece.platform}</div>
        </div>
        <div className={css.detailPreview} data-plataforma={piece.platform}>
          <Muestra piece={piece} />
        </div>
        {/* La línea de PIECES es la entrada, y las notas lo que sigue.
            Son dos cosas distintas: ésta se escribe al publicar y cabe
            en un renglón; aquéllas viven en src/notas/<slug>.tsx y una
            pieza puede no tenerlas. */}
        <p className={css.detailDesc}>{piece.desc}</p>
        <Notas name={piece.name} />
      </div>
    </div>
  )
}
