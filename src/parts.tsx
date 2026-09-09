import { useEffect, useRef, useState } from 'react'
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
      <h1 className={css.mastTitle}>Interface exhibition</h1>
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
  /* EN LA LISTA EL VIDEO ARRANCA CON EL PUNTERO, como en el vault: la
     card entera es el disparador (apuntarle sólo al video dejaría
     media card muerta), entra con el mouse o con el foco del teclado,
     se pausa al salir y RETOMA donde estaba, sin rebobinar. Lo que se
     viene a mirar es cómo se mueve, y en una lista larga diez videos
     girando a la vez son ruido y CPU. */
  const [activo, setActivo] = useState(false)
  const entrar = () => setActivo(true)
  const salir = () => setActivo(false)
  return (
    <a
      className={css.streamItem}
      id={slug(piece.name)}
      href={`/${slug(piece.name)}`}
      onClick={clicDeLink(() => onOpen(piece))}
      onMouseEnter={entrar}
      onMouseLeave={salir}
      onFocus={entrar}
      onBlur={salir}
    >
      <div className={css.streamTitle} data-primera-pieza={primera ? '' : undefined}>
        {piece.name}
      </div>
      <div className={css.streamPreview}>
        <Muestra piece={piece} modo="lista" activo={activo} />
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
/* ─── LA VELOCIDAD DEL VIDEO ───
   Lo que hace benji.org en Family Values, medido en su código: un botón
   arriba a la derecha del demo que alterna 1x ↔ 0.5x y escribe
   `playbackRate`; los dos rótulos viven superpuestos y se cruzan por
   opacidad, y el botón cambia de ancho (1.75rem ↔ 2.5rem) con la misma
   transición. Acá se muestra al pasar el mouse por el video (pedido del
   usuario); en benji está siempre visible. Los números están en
   app.module.css. La velocidad se vuelve a escribir en `loadedmetadata`
   porque un cambio de fuente la devuelve a 1. */
const VELOCIDADES = [1, 0.5] as const
type Velocidad = (typeof VELOCIDADES)[number]

type Modo = 'lista' | 'detalle'

/* El primer cuadro y nada más, como en el vault: con preload="metadata"
   el navegador no decodifica ninguna imagen y la caja queda negra; el
   fragmento #t= lo obliga a buscar ahí y pintar ESE cuadro. 0.1 y no 0
   porque en 0 algunos contenedores todavía no tienen un cuadro clave. */
const primerCuadro = (url: string) => `${url}#t=0.1`

const reduceMovimiento = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/* EL TEMA DEL LECTOR, para las piezas que tienen una grabación por
   apariencia. El sitio entero sigue a `prefers-color-scheme` desde el
   CSS (tokens.css) y no tiene interruptor propio, así que la fuente de
   verdad es la misma consulta, escuchada para que un cambio del sistema
   se vea sin recargar. */
function useEsquemaOscuro() {
  const [oscuro, setOscuro] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const consulta = matchMedia('(prefers-color-scheme: dark)')
    const alCambiar = (e: MediaQueryListEvent) => setOscuro(e.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])
  return oscuro
}

function Reproductor({ piece, modo, activo = false }: { piece: Piece; modo: Modo; activo?: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const [velocidad, setVelocidad] = useState<Velocidad>(1)
  const enLista = modo === 'lista'
  /* Lista: reproduce mientras la card está activa (puntero o foco) y
     pausa al salir, sin rebobinar. Con reduced-motion, no arranca:
     igual que el vault, verificado allá. */
  useEffect(() => {
    const v = video.current
    if (!v || !enLista) return
    if (activo && !reduceMovimiento()) void v.play().catch(() => {})
    else v.pause()
  }, [enLista, activo])
  useEffect(() => {
    const v = video.current
    if (!v) return
    v.playbackRate = velocidad
    const aplicar = () => {
      v.playbackRate = velocidad
    }
    v.addEventListener('loadedmetadata', aplicar)
    return () => v.removeEventListener('loadedmetadata', aplicar)
  }, [velocidad])
  /* SÓLO REPRODUCE LO QUE SE VE. Un VP9 con alfa se decodifica por
     software (Chrome no tiene camino de hardware para el alfa), y a
     1120² y 60 fps son dos decodificaciones por cuadro; con la lista
     creciendo, diez videos girando fuera de pantalla son diez veces
     eso, peleando por la CPU con el que sí se mira. Lo que hace benji:
     su player se monta recién cuando entra en pantalla. Acá se pausa
     y se retoma con IntersectionObserver, y `preload="auto"` para que
     lo visible tenga todo el archivo antes de arrancar. */
  useEffect(() => {
    const v = video.current
    if (!v || enLista || typeof IntersectionObserver === 'undefined') return
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) void v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.1 },
    )
    observador.observe(v)
    return () => observador.disconnect()
  }, [enLista])
  const otra: Velocidad = velocidad === 1 ? 0.5 : 1
  /* LA GRABACIÓN DEL TEMA DEL LECTOR, si la pieza tiene dos. El `key`
     sobre el <video> es lo que hace el cambio: mover el `src` de un
     <source> ya montado no vuelve a cargar nada sin un `load()`, y
     remontar el elemento arranca limpio y vuelve a pedir la velocidad
     en `loadedmetadata`. Una pieza con una sola grabación no tiene
     `videoOscuro` y esto no hace nada. */
  const oscuro = useEsquemaOscuro()
  const porTema = oscuro && piece.videoOscuro
  const webm = (porTema ? piece.videoOscuro : piece.video) ?? ''
  const hevc = porTema ? piece.videoHevcOscuro : piece.videoHevc
  /* Con alfa, las esquinas del cuadro son transparentes: redondearlas
     es una máscara sobre una capa de 1120² por cuadro para no cambiar
     nada. Se apaga. */
  const claseVideo = hevc ? `${css.demo} ${css.demoAlfa}` : css.demo
  /* En la lista: sin autoplay, el primer cuadro y los metadatos; el
     archivo entero recién cuando arranca. En el detalle: autoplay y
     precarga entera, es la pieza que viniste a ver. */
  const fuente = enLista ? primerCuadro : (url: string) => url
  const comunes = {
    ref: video,
    muted: true,
    loop: true,
    playsInline: true,
    autoPlay: !enLista,
    preload: enLista ? ('metadata' as const) : ('auto' as const),
    disablePictureInPicture: true,
  }
  return (
    <div className={css.reproductor}>
      {hevc ? (
        <video key={hevc} {...comunes} className={claseVideo}>
          <source src={fuente(hevc)} type='video/quicktime; codecs="hvc1"' />
          <source src={fuente(webm)} type="video/webm" />
        </video>
      ) : (
        <video key={webm} {...comunes} className={css.demo} src={fuente(webm)} />
      )}
      <button
        type="button"
        className={css.velocidad}
        data-velocidad={velocidad}
        /* En la lista el reproductor vive adentro del link de la card: el
           clic no puede subir, o cambia la velocidad Y navega al detalle. */
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setVelocidad(otra)
        }}
        aria-label={`Velocidad ${velocidad}x. Cambiar a ${otra}x`}
      >
        {VELOCIDADES.map((v) => (
          <span key={v} data-activa={v === velocidad}>
            {v}x
          </span>
        ))}
      </button>
    </div>
  )
}

function Muestra({ piece, modo, activo }: { piece: Piece; modo: Modo; activo?: boolean }) {
  /* Con alfa, el video es transparente y el fondo lo pone la card: el
     .mov (HEVC con alfa) va PRIMERO para Safari, que es el único que lo
     abre; Chrome y Firefox lo saltan por el type y toman el WebM VP9
     con alfa. Al revés, Safari tomaría el WebM y lo dibujaría sobre
     negro. Ver Reproductor. */
  if (piece.video) return <Reproductor piece={piece} modo={modo} activo={activo} />
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
          <Muestra piece={piece} modo="detalle" />
        </div>
        {/* La línea de PIECES es la entrada, y las notas lo que sigue.
            Son dos cosas distintas: ésta se escribe al publicar y cabe
            en un renglón; aquéllas viven en src/notas/<slug>.tsx. Una
            pieza puede no tener ninguna de las dos: sin línea no se
            dibuja el párrafo, o dejaría sus 24 px de margen vacíos
            (Swipeable tabs, 2026-09-07: el título ya dice qué es). */}
        {piece.desc ? <p className={css.detailDesc}>{piece.desc}</p> : null}
        <Notas name={piece.name} />
      </div>
    </div>
  )
}
