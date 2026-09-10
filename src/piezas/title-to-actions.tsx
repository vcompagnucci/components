/* ═══════════════════════════════════════════════════════════════
   TITLE TO ACTIONS — una barra que nombra lo que estás mirando y, al
   apretar el botón de la derecha, cambia el título y el autor por las
   tres acciones del ítem.

   ─── ESTA PIEZA SE REESCRIBIÓ CONTRA EL DESIGN SYSTEM ───
   La primera versión era una cápsula de vidrio: filtros SVG, dos capas
   de refracción, un velo medido de `.glassEffect()`, cuellos de goo,
   sombras de contacto, anillos, y un integrador de resortes de Apple
   corriendo en un lazo de cuadro. Nada de eso es de este sistema, y el
   usuario lo frenó (2026-09-10: "no hagas este componente en liquid
   glass, hacelo más con nuestro design system, siguiendo DESIGN.md").

   Lo que el vidrio rompía, regla por regla, con la sección de DESIGN.md
   que lo dice:

     · Elevación — NO HAY. "Cero box-shadow en todo el producto. La card
       se define por contraste contra el canvas." La cápsula tenía halo,
       anillo y una sombra más profunda para la tarjeta.
     · Tipografía. Un tamaño, 14/20, y tres pesos: 460 · 500 · 600. La
       cápsula escribía a 21 y 17 px con peso 560.
     · Color. Todo sale de `--ink` y `--text-secondary`; el vidrio traía
       una tinta propia (#22303f) y un realce azulado que no era de
       ningún token.
     · Motion. Dos familias y sus curvas: `--ease-surface` para la
       superficie, `--ease-text` para el color, `--ease-dialogo` para lo
       que entra y sale. El vidrio corría resortes con rebote 0.40.

   Lo que sobrevivió es la IDEA, que no dependía del material: el
   título se va, las acciones llegan del botón que las abrió, el pin es
   un interruptor y compartir abre una tarjeta.

   ─── LA ESCALERA DE SUPERFICIES ───
   El sistema define la card como −5 desde el canvas y no le pone ni
   anillo ni sombra: "el contraste hace todo el trabajo". Acá abajo hay
   dos niveles más, con el mismo paso y la misma rampa:

     canvas    0     la página
     card     −5     donde vive el demo (`--surface`)
     barra   −10     la superficie de esta pieza
     tarjeta        el canvas otra vez, y la sombra del menú

   La tarjeta va al revés a propósito, y no es una excepción inventada:
   es lo que ya hace el menú del clic derecho en `acciones.module.css`.
   Una superficie APOYADA se define por contraste; una que FLOTA sobre
   contenido lleva fondo `--canvas` y la única sombra del sistema,
   porque "un menú flotante sin separación del fondo se lee como parte
   de lo que tapa".

   La cuenta de cada valor está en HOJA, arriba de cada uno.
   ═══════════════════════════════════════════════════════════════ */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
} from 'react'

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Se lee de arriba abajo. Cada ms es desde el clic, y ninguno es
 * inventado: los cuatro salen de duraciones que este repo ya usa.
 *
 *   TÍTULO → ACCIONES  (el botón de la derecha)
 *      0ms   el rótulo se apaga y se corre 8 px a la izquierda
 *      0ms   el botón de cerrar cruza en la ranura del de puntos
 *     40ms   entra el de compartir, desde esa misma ranura
 *     80ms   entra el pin
 *    240ms   todo quieto
 *
 *   ACCIONES → TÍTULO
 *   El mismo camino al revés, y más corto: al cerrar ya decidiste.
 *   El escalonado se invierte, así que los tres botones vuelven a
 *   meterse en la ranura de la que salieron.
 *
 *   LA TARJETA DE COMPARTIR
 *      0ms   crece desde el botón: opacidad 0 → 1, escala 0.92 → 1
 *    160ms   quieta
 *   Al cerrar, 120 ms. Es el menú de `acciones.module.css`, con su
 *   origen puesto en el botón que la abrió.
 *
 * NO HAY TEMPORIZADORES NI ESCENAS. Todo cuelga de tres estados y de
 * transiciones de CSS, así que una transición interrumpida a la mitad
 * se retoma desde donde está — que es lo que un `setTimeout` rompe.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  entra: 160, //     lo que aparece. El menú del área privada
  sale: 120, //      y su salida, más corta
  escalon: 40, //    entre un botón y el siguiente
  press: 100, //     el hundido de un control, como `.glifo:active`
  copiado: 1500, //  cuánto se queda la marca de que el link se copió
}

/* ─────────────────────────────────────────────────────────
 * LA GEOMETRÍA
 *
 * Todo sale de dos números del sistema: el texto es 14/20 y los radios
 * son 8 para una caja y 4 para un control.
 *
 *   alto 48      dos renglones de 20 más 4 de aire arriba y abajo
 *   control 40   48 − 2×4. Y es el mínimo de área de toque en escritorio
 *   radio 8      `--card-radio`, el de la card
 *   radio 4      8 − 4 de padding: el radio concéntrico exacto, y uno de
 *                los dos que las referencias usan en controles chicos
 *
 * El ancho NO está acá porque no es un número: la barra es fluida y
 * termina donde termina la card. El rótulo se lleva lo que sobra.
 * ───────────────────────────────────────────────────────── */
const ALTO = 48
const PADDING = 4
const CONTROL = ALTO - 2 * PADDING //  40
const RADIO_CONTROL = 4
/* El aire entre dos controles vecinos. Adentro de un componente la
   regla de ×4 no rige (DESIGN.md § 2), y 4 es lo que deja los glifos de
   20 a 24 px uno de otro: se leen como tres botones y no como una fila
   continua. */
const AIRE = 4
const PASO = CONTROL + AIRE //  44

/* ─────────────────────────────────────────────────────────
 * LOS GLIFOS, sobre una caja de 20 y con trazo 1.5 — las medidas del
 * chevron de volver, que es el glifo que el producto ya dibuja
 * (`Volver`, en parts.tsx). El par del pin es el MISMO trazado con y
 * sin relleno, así que al cruzarse no cambia la silueta: se llena.
 * ───────────────────────────────────────────────────────── */
const PIN =
  'M7.5 3h5M8.6 3v3.8c0 .4-.2.8-.5 1.1L6.2 9.5a.8.8 0 0 0 .5 1.5h6.6a.8.8 0 0 0 .5-1.5l-1.9-1.6a1.4 1.4 0 0 1-.5-1.1V3M10 11v6'
const COMPARTIR = 'M10 12.9V3M10 3 7.2 5.8M10 3l2.8 2.8M4.6 10.7v5a1.3 1.3 0 0 0 1.3 1.3h8.2a1.3 1.3 0 0 0 1.3-1.3v-5'
const CERRAR = 'M5.2 5.2l9.6 9.6M14.8 5.2l-9.6 9.6'
const ENLACE =
  'M8.5 11.5a3 3 0 0 0 4.5.3l2.2-2.2a3 3 0 0 0-4.3-4.3L9.7 6.6M11.5 8.5a3 3 0 0 0-4.5-.3L4.8 10.4a3 3 0 0 0 4.3 4.3l1.2-1.2'
const MARCA = 'M4.6 10.3 8.3 14l7.1-8.2'
const CHEVRON = 'M12 4.5 6.5 10l5.5 5.5'
const PUNTOS = 'M4.6 10h.01M10 10h.01M15.4 10h.01'

/* LAS TRES ACCIONES, en el orden de la fila. El de cerrar va último
   porque comparte lugar con el de puntos suspensivos: se aprieta dos
   veces en el mismo punto de la pantalla, que es lo que hace que abrir
   y cerrar sean el mismo gesto. */
const ACCIONES = [
  { id: 'pin', nombre: 'Pin', trazo: PIN },
  { id: 'share', nombre: 'Share', trazo: COMPARTIR },
  { id: 'close', nombre: 'Close', trazo: CERRAR },
] as const
const ULTIMO = ACCIONES.length - 1
/* Quién abre la tarjeta. Sale del arreglo y no de un número escrito a
   mano: si mañana entra una acción antes, el que la abre sigue siendo
   éste. */
const COMPARTIR_I = ACCIONES.findIndex((a) => a.id === 'share')

/* EL ÍTEM. Es el mismo que nombraría la página de atrás: la barra dice
   qué estás mirando, que es la mitad de para qué existe. */
const ITEM = { titulo: 'The Dark Side of the Moon', autor: 'Pink Floyd' }

/* LA TAPA. El arte oficial, servido por la API de artwork de Apple para
   el álbum de 1973 (collectionId 1065973699), a 600 px de lado. Cuadrado
   y sin recortar, que es lo que pidió el usuario el 2026-09-10 ("usá la
   real y oficial y que no pierda calidad y que no se recorte"): la
   fuente es cuadrada, la caja es cuadrada y el `object-fit` es
   `contain`, así que no hay recorte posible. Queda dicho que la tapa es
   del sello y no nuestra. */
const TAPA = '/piezas/title-to-actions-cover.jpg'

/* Lo que se LEE en la tarjeta. No es el link que se copia —ése se arma
   con el origen real en el momento de copiar— sino la parte que dice a
   dónde va. */
const ENLACE_VISIBLE = 'components / title-to-actions'

/* ─────────────────────────────────────────────────────────
 * EL CONTROL
 *
 * Seis lugares lo usan —volver, los tres de la fila, los puntos
 * suspensivos y el de copiar—, así que es una parte y no JSX repetido.
 * Los glifos van como children: un control con dos estados lleva dos, y
 * el que quiera otra cosa la pone. Los nombres de las props son los de
 * la plataforma —`pressed` sale como `aria-pressed`, `expanded` como
 * `aria-expanded`— y lo que no se consume se pasa tal cual al <button>,
 * así que un `data-` o un `aria-` de afuera llega.
 * ───────────────────────────────────────────────────────── */
type ControlProps = ComponentProps<'button'> & {
  label: string
  pressed?: boolean
  expanded?: boolean
}

function Control({ label, pressed, expanded, className, children, ...props }: ControlProps) {
  return (
    <button
      type="button"
      className={className ? `control ${className}` : 'control'}
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      {...props}
    >
      {children}
    </button>
  )
}

/* Un glifo. `relleno` dibuja el MISMO trazado también relleno, que es
   cómo se enciende el pin: la silueta no cambia, se llena. */
function Glifo({ d, relleno, className }: { d: string; relleno?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d={d}
        fill={relleno ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function TitleToActions() {
  /* TRES ESTADOS, y cada uno es una cosa que el que mira puede hacer:
     cambiar el rótulo por las acciones, fijar el ítem, y abrir la
     tarjeta de compartir. Ninguno es un modo del otro. */
  const [acciones, setAcciones] = useState(false)
  const [fijado, setFijado] = useState(false)
  const [compartir, setCompartir] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const puntosBoton = useRef<HTMLButtonElement>(null)
  const botones = useRef<(HTMLButtonElement | null)[]>([])
  const tarjeta = useRef<HTMLDivElement>(null)
  const copiarBoton = useRef<HTMLButtonElement>(null)
  const conTeclado = useRef(false)
  const conTecladoTarjeta = useRef(false)

  /* SE CIERRA CON ESCAPE Y TOCANDO AFUERA, que es lo que hace cualquier
     cosa que flota sobre lo demás. Los dos escuchas se ponen SÓLO
     mientras está abierta: una pieza en reposo no deja nada colgado del
     documento. */
  useEffect(() => {
    if (!compartir) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      /* EN CAPTURA Y FRENANDO LA PROPAGACIÓN, y no por prolijidad: la
         página del detalle también cierra con Escape, así que sin esto
         descartar la tarjeta se lleva puesta la pieza entera y el que
         miraba termina en la lista sin haberlo pedido. Lo tiene que
         consumir el de más adentro, y para ganarle a un escucha que ya
         estaba puesto en el documento hay que llegar antes: la fase de
         captura corre antes que la de burbujeo. */
      e.stopPropagation()
      conTecladoTarjeta.current = true
      setCompartir(false)
    }
    const alApuntar = (e: PointerEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (tarjeta.current?.contains(t)) return
      if (botones.current[COMPARTIR_I]?.contains(t)) return
      setCompartir(false)
    }
    document.addEventListener('keydown', alTeclear, true)
    document.addEventListener('pointerdown', alApuntar)
    return () => {
      document.removeEventListener('keydown', alTeclear, true)
      document.removeEventListener('pointerdown', alApuntar)
    }
  }, [compartir])

  /* EL FOCO ENTRA A LA TARJETA Y VUELVE AL BOTÓN QUE LA ABRIÓ, y sólo
     si el que la abrió fue el teclado. Con el puntero no se toca nada:
     mover el foco ahí sólo dibujaría un anillo que nadie pidió.

     Y ESTO ES LO QUE OBLIGÓ A SACAR `visibility` DE LA TARJETA. La
     primera versión la escondía como el menú del área privada, con
     `visibility: hidden`, y un elemento así NO SE PUEDE ENFOCAR:
     `focus()` no hace nada y no avisa. Al abrir con Enter el foco se
     perdía en silencio y el que miraba se quedaba en el botón de
     compartir. Un `requestAnimationFrame` tampoco alcanza —su callback
     corre antes de que el navegador recalcule el estilo—, y está
     medido: con el efecto instrumentado, el ref estaba poblado, el
     `focus()` corría, y el elemento activo seguía siendo el botón de
     compartir (sonda/teclado.mjs).

     La tarjeta no lo necesitaba: `inert` ya la saca del orden de
     tabulación, de los lectores de pantalla y del puntero, que son las
     tres cosas por las que aquel menú usa `visibility`. */
  useEffect(() => {
    if (!conTecladoTarjeta.current) return
    conTecladoTarjeta.current = false
    const destino = compartir ? copiarBoton.current : botones.current[COMPARTIR_I]
    destino?.focus({ preventScroll: true })
  }, [compartir])

  /* EL FOCO NO SE CAE AL CUERPO. El botón que se apaga queda `inert`, y
     un elemento inert pierde el foco: si el cambio lo pidió el teclado,
     el foco tiene que ir al botón que lo reemplaza en la MISMA ranura
     —de puntos suspensivos a cerrar y al revés—, que además es el mismo
     lugar de la pantalla. */
  useEffect(() => {
    if (!conTeclado.current) return
    conTeclado.current = false
    const destino = acciones ? botones.current[ULTIMO] : puntosBoton.current
    destino?.focus({ preventScroll: true })
  }, [acciones])

  /* LA MARCA DE COPIADO SE APAGA SOLA. Un botón de copiar sin
     confirmación se aprieta tres veces para ver si anduvo. */
  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), TIMING.copiado)
    return () => clearTimeout(t)
  }, [copiado])

  /* EL LINK QUE SE COPIA es el de la pieza, no el de la página: en la
     lista la URL es la portada y ahí el link correcto sigue siendo éste.
     Se arma en el momento porque el origen cambia entre el servidor de
     desarrollo y el publicado. */
  const copiar = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/title-to-actions`)
    } catch {
      /* Si el navegador no dejó copiar —sin permiso, o sin contexto
         seguro— NO se dibuja la marca: confirmar algo que no pasó es
         peor que no confirmar nada. */
      return
    }
    setCopiado(true)
  }, [])

  return (
    <div data-pieza="title-to-actions" data-abierto={acciones ? '' : undefined}>
      <style href="pieza-title-to-actions" precedence="medium">
        {HOJA}
      </style>

      <div className="escena">
        <div className="barra">
          <Control label="Back" inert={acciones} onClick={frenar}>
            <Glifo d={CHEVRON} />
          </Control>

          {/* aria-hidden: el título y el autor están al lado, y un alt
              que los repita hace que un lector de pantalla los diga dos
              veces. */}
          <img
            className="tapa"
            src={TAPA}
            alt=""
            width={CONTROL}
            height={CONTROL}
            /* Con `width` y `height` la caja está reservada antes de que
               la imagen llegue, así que la barra no salta. El
               decodificado va fuera del hilo principal: son 600 px de
               lado para una caja de 40. */
            decoding="async"
            aria-hidden="true"
          />

          <div className="rotulo" inert={acciones}>
            <p className="titulo">{ITEM.titulo}</p>
            <p className="autor">{ITEM.autor}</p>
          </div>

          {/* LA RANURA DE LA DERECHA. Los cuatro botones que viven acá
              —los tres de acción y el de puntos suspensivos— se apilan
              en el mismo lugar, y el escalonado los saca de a uno. */}
          <div className="ranura">
            {ACCIONES.map((a, i) => (
              <Control
                key={a.id}
                ref={(el) => {
                  botones.current[i] = el
                }}
                className="accion"
                /* DE DÓNDE SALE Y CUÁNDO. Los dos números los lee el
                   CSS: `--x` es la ranura de la que sale, y `--turno`
                   el lugar en el escalonado. El de cerrar tiene los dos
                   en cero, así que cruza en el lugar. */
                style={
                  {
                    '--x': `${(ULTIMO - i) * PASO}px`,
                    '--turno': ULTIMO - i,
                  } as CSSProperties
                }
                /* El que VIAJA aparece a mitad de camino; el que ocupa
                   la ranura del botón de puntos cruza en el lugar y
                   aparece enseguida. La diferencia la lee el CSS. */
                data-viaja={i < ULTIMO ? '' : undefined}
                /* Un botón transparente y con los clics apagados sigue
                   estando en el orden de tabulación y sigue
                   anunciándose: `inert` lo saca de los dos. */
                inert={!acciones}
                label={a.nombre}
                pressed={a.id === 'pin' ? fijado : undefined}
                expanded={a.id === 'share' ? compartir : undefined}
                aria-haspopup={a.id === 'share' ? 'dialog' : undefined}
                onClick={(e) => {
                  frenar(e)
                  if (a.id === 'pin') {
                    setFijado((v) => !v)
                    return
                  }
                  if (a.id === 'share') {
                    conTecladoTarjeta.current = e.detail === 0
                    setCompartir((v) => !v)
                    return
                  }
                  conTeclado.current = e.detail === 0
                  /* Cerrar la fila cierra también lo que la fila abrió:
                     si la tarjeta quedara flotando sin su botón, no
                     habría con qué cerrarla salvo Escape. */
                  setCompartir(false)
                  setAcciones(false)
                }}
              >
                {/* El pin lleva DOS glifos: el de trazo que se va y el
                    relleno que llega. Es el mismo trazado, así que
                    comparten silueta y lo único que se ve cambiar es el
                    relleno. */}
                {a.id === 'pin' ? (
                  <span className="pinIcono">
                    <Glifo d={a.trazo} />
                    <Glifo d={a.trazo} relleno className="encendido" />
                  </span>
                ) : (
                  <Glifo d={a.trazo} />
                )}
              </Control>
            ))}

            <Control
              ref={puntosBoton}
              className="puntos"
              label="More actions"
              expanded={acciones}
              inert={acciones}
              onClick={(e) => {
                frenar(e)
                /* Un clic disparado con Enter o con la barra llega con
                   detail 0; uno del puntero, con 1. Sirve para devolver
                   el foco sólo a quien lo estaba usando. */
                conTeclado.current = e.detail === 0
                setAcciones(true)
              }}
            >
              <Glifo d={PUNTOS} />
            </Control>
          </div>

          {/* LA TARJETA DE COMPARTIR. Está siempre en el documento —así
              la salida se puede animar sin desmontarla— y lo que la
              apaga es la opacidad más `inert`, que la saca del orden de
              tabulación, de los lectores y del puntero. */}
          <div
            className="tarjeta"
            ref={tarjeta}
            role="dialog"
            aria-label="Share"
            data-abierta={compartir ? '' : undefined}
            inert={!compartir}
          >
            <img
              className="tapa"
              src={TAPA}
              alt=""
              width={CONTROL}
              height={CONTROL}
              decoding="async"
              aria-hidden="true"
            />
            <div className="rotuloTarjeta">
              <p className="titulo">{ITEM.titulo}</p>
              <p className="enlace">{ENLACE_VISIBLE}</p>
            </div>
            <Control
              ref={copiarBoton}
              /* El nombre cambia con el resultado, que es lo que un
                 lector de pantalla necesita para saber que el copiado
                 ocurrió. */
              label={copiado ? 'Link copied' : 'Copy link'}
              data-copiado={copiado ? '' : undefined}
              onClick={(e) => {
                frenar(e)
                copiar()
              }}
            >
              <Glifo d={ENLACE} className="cambia" />
              <Glifo d={MARCA} className="encendido" />
            </Control>
          </div>
        </div>
      </div>
    </div>
  )
}

/* En la lista el preview vive adentro del <a> de la card: sin esto un
   clic acá navega. Es el mismo freno que el botón de velocidad del
   reproductor. */
function frenar(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
}

/* La hoja va adentro del archivo porque una pieza publicada es UN
   archivo en src/piezas/: no puede traerse un .module.css al lado. El
   href la deduplica —React 19 la iza una sola vez aunque la lista y el
   detalle monten dos— y el data-pieza la encierra, así que los nombres
   cortos de adentro no chocan con nadie. */
const HOJA = `
/* Los DOS: en la card el alto lo pone un min-height heredado y el 100 %
   no resuelve; en el lienzo del playground el frame tiene alto fijo y
   entonces el que no resuelve es el min-height. */
[data-pieza='title-to-actions'] {
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: grid;
}

/* ─── LA ESCENA ───
   No pinta nada: el fondo es el de la card, y por eso la pieza sigue al
   tema del producto sin traer una paleta propia. Lo único suyo es el
   aire a los costados, que es el padding lateral de la página — el
   mismo número que ya separa el riel del borde. */
[data-pieza='title-to-actions'] .escena {
  min-height: inherit;
  display: grid;
  place-items: center;
  padding: 0 var(--page-padding-inline, 16px);
  /* Lo que sale de la barra —la tarjeta— tiene que poder salirse de
     ella sin que nadie lo recorte, y a la vez no puede pasarse de la
     card. 'isolation' deja el apilado adentro de la pieza: dos de éstas
     en la misma página no compiten. */
  isolation: isolate;
}

/* ─── LA BARRA ───
   Un escalón más profunda que la card, con la rampa del sistema y sin
   anillo ni sombra: es la regla de la card contra la página, un nivel
   más adentro.

   LA CUENTA, para poder repetirla. La rampa baja el azul 6/5 de lo que
   bajan rojo y verde —es la relación de canal de josh, y sin eso el
   gris se enfría al profundizar—. Desde --canvas (253,253,252):

     −5   (248,248,246)  #f8f8f6   la card, que ya está en tokens.css
     −10  (243,243,240)  #f3f3f0   ésta

   En oscuro la rampa es plana —los tres canales suben lo mismo, como en
   tokens.css— así que desde (9,9,8): +5 da #0e0e0d y +10 da #131312.

   Y EN ALTO CONTRASTE EL PASO SE DUPLICA, que es la regla del sistema
   para todas las distancias que no son texto: −20 y +20.

   Va escrito con respaldo —'var(--card-radio, 8px)'— porque una pieza
   no importa nada del producto: si el token está, manda. */
[data-pieza='title-to-actions'] .barra {
  --barra: #f3f3f0;
  --glifo: var(--activo-c, rgba(18, 18, 18, 0.8));
  --glifo-activo: var(--ink, #111111);

  position: relative;
  width: 100%;
  max-width: 420px;
  height: ${ALTO}px;
  padding: ${PADDING}px;
  border-radius: var(--card-radio, 8px);
  background: var(--barra);
  display: flex;
  align-items: center;
  gap: 8px;
}
@media (prefers-color-scheme: dark) {
  [data-pieza='title-to-actions'] .barra { --barra: #131312; }
}
@media (prefers-contrast: more) and (prefers-color-scheme: light) {
  [data-pieza='title-to-actions'] .barra { --barra: #e9e9e4; }
}
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  [data-pieza='title-to-actions'] .barra { --barra: #1d1d1c; }
}

/* ─── EL CONTROL ───
   40×40 con un glifo de 20: es el mínimo de área de toque en escritorio
   y sale sin inventarlo, de restarle el padding al alto de la barra.

   NO TIENE FONDO, ni en reposo ni al pasar el puntero. El hover pinta
   SÓLO el glifo, que es lo que hacen las dos referencias y lo que ya
   hace la flecha de volver del producto: un cuadrado que se enciende
   debajo del ícono agrega una caja que en reposo no existía.

   EL COLOR NO ES EL GRIS DE ANOTACIÓN, y es una decisión nuestra. El
   sistema manda todo lo secundario a --text-secondary, pero eso es para
   lo que ANOTA; un ícono es un control y tiene que poder leerse. Va en
   --activo-c —el token que en este sistema significa "ésta"— y sube a
   --ink al tocarlo. Son 65 → 17, un salto de 48, más que los 40 que el
   sistema pide entre dos niveles de la misma jerarquía. */
[data-pieza='title-to-actions'] .control {
  width: ${CONTROL}px;
  height: ${CONTROL}px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: ${RADIO_CONTROL}px;
  background: transparent;
  color: var(--glifo);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    color var(--dur-text, 100ms) var(--ease-text, ease),
    transform ${TIMING.press}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1));
}
[data-pieza='title-to-actions'] .control svg {
  width: 20px;
  height: 20px;
  display: block;
}
@media (hover: hover) and (pointer: fine) {
  /* Un dedo dispara :hover al tocar y lo deja pegado. */
  [data-pieza='title-to-actions'] .control:hover { color: var(--glifo-activo); }
}
/* CON SU TARJETA ABIERTA EL BOTÓN SE QUEDA ENCENDIDO. Sin esto, al
   sacar el puntero para ir a la tarjeta el glifo se apaga y la tarjeta
   queda colgando de nada. Es la misma regla que el disparador de menú
   del área privada. */
[data-pieza='title-to-actions'] .control[aria-expanded='true'] { color: var(--glifo-activo); }
/* El press: 0.97, que es el que este repo ya usa en sus botones. La
   card no tiene press y eso no cambia —tokens.css tiene contado por
   qué—: esto ES un botón. */
[data-pieza='title-to-actions'] .control:active { transform: scale(0.97); }
[data-pieza='title-to-actions'] .control:focus-visible {
  outline: var(--focus-outline, 2px solid #005fcc);
  outline-offset: var(--focus-outline-offset, 2px);
  /* El foco no anima: es lo único de la página que aparece instantáneo. */
  transition: none;
}

/* ─── LA TAPA ───
   Cuadrada, del mismo lado que un control y con su mismo radio, así que
   la fila entera se apoya en una sola altura. 'contain' y no 'cover':
   los dos dan lo mismo con una fuente cuadrada en una caja cuadrada,
   pero contain no puede recortar nunca. */
[data-pieza='title-to-actions'] .tapa {
  width: ${CONTROL}px;
  height: ${CONTROL}px;
  flex: none;
  border-radius: ${RADIO_CONTROL}px;
  object-fit: contain;
  background: #000;
  display: block;
}

/* ─── EL RÓTULO ───
   Los dos renglones del sistema, sin una sola medida propia: 14/20 con
   los pesos 500 y 460 y el par --ink / --text-secondary. Es el mismo
   par que el masthead —título y subtítulo—, que es lo que esto es.

   'min-width: 0' no es prolijidad: sin él un título largo empuja los
   botones fuera de la barra en vez de cortarse. */
[data-pieza='title-to-actions'] .rotulo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  user-select: none;
  transition:
    opacity ${TIMING.sale}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1)),
    transform ${TIMING.sale}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1));
}
/* SE VA HACIA LA IZQUIERDA, o sea hacia donde no está el botón que lo
   reemplazó: el título se aparta y las acciones ocupan su lugar. Los
   8 px son el desplazamiento de entrada que el área privada ya usa. */
[data-pieza='title-to-actions'][data-abierto] .rotulo {
  opacity: 0;
  transform: translateX(-8px);
  transition-duration: ${TIMING.entra}ms;
}
[data-pieza='title-to-actions'] .rotulo p,
[data-pieza='title-to-actions'] .rotuloTarjeta p {
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
[data-pieza='title-to-actions'] .titulo {
  font-size: var(--type-h3-fs, 14px);
  line-height: var(--type-h3-lh, 20px);
  font-weight: var(--type-h3-fw, 500);
  letter-spacing: var(--type-h3-ls, -0.00563rem);
  color: var(--type-h3-c, #111111);
}
[data-pieza='title-to-actions'] .autor,
[data-pieza='title-to-actions'] .enlace {
  font-size: var(--type-body-fs, 14px);
  line-height: var(--type-body-lh, 20px);
  font-weight: var(--type-body-fw, 460);
  letter-spacing: var(--type-body-ls, -0.00563rem);
  color: var(--type-body-c, rgba(0, 0, 0, 0.37));
}

/* ─── LA RANURA DE LA DERECHA ───
   Los cuatro botones apilados en el mismo punto: el de puntos
   suspensivos y el de cerrar comparten lugar —por eso la fila se puede
   apretar dos veces sin mover el dedo— y los otros dos salen de ahí.

   MIDE UN BOTÓN, NO LA FILA ABIERTA. Reservando los tres, en reposo
   quedaban 88 px de hueco entre el título y los puntos suspensivos: la
   barra se leía rota por la mitad. Los dos que salen se dibujan FUERA
   de la ranura, encima del rótulo, y pueden hacerlo porque para cuando
   llegan el rótulo ya se está yendo. */
[data-pieza='title-to-actions'] .ranura {
  position: relative;
  flex: none;
  width: ${CONTROL}px;
  height: ${CONTROL}px;
}
[data-pieza='title-to-actions'] .ranura .control {
  position: absolute;
  top: 0;
  right: 0;
}
/* ─── EL ESCALONADO ───
   Cada botón sale de la ranura del de puntos suspensivos y llega a la
   suya. El que ocupa esa misma ranura —el de cerrar— tiene --x en cero,
   así que cruza en el lugar en vez de viajar.

   Los turnos se invierten al cerrar: abriendo salen de adentro hacia
   afuera, cerrando vuelven a meterse. Sin eso, al cerrar el de más
   lejos esperaría a los otros dos y se leería como que se olvidó.

   LA OPACIDAD NO ARRANCA CON EL VIAJE, y esto es lo que la primera
   versión tenía mal. Los tres salen del mismo punto, así que mientras
   viajan se superponen: en los cuadros 131 y 164 de sonda/estados se
   veía el pin dibujado encima del de compartir, y dos glifos apilados
   se leen como un error de dibujo. En la versión de vidrio no pasaba
   porque el goo los fundía en una sola forma con cuello; sin material
   que los funda, el que viaja tiene que viajar sin verse.

   Entonces la opacidad entra a mitad de camino y en la mitad del
   tiempo: el botón arranca de la ranura —se ve de dónde sale— y se
   materializa llegando a la suya. */
[data-pieza='title-to-actions'] .accion {
  opacity: 0;
  transform: translateX(0);
  transition:
    opacity ${TIMING.sale / 2}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1)),
    transform ${TIMING.sale}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1)),
    color var(--dur-text, 100ms) var(--ease-text, ease);
  transition-delay: calc((${ULTIMO} - var(--turno)) * ${TIMING.escalon}ms);
}
[data-pieza='title-to-actions'][data-abierto] .accion {
  opacity: 1;
  transform: translateX(calc(-1 * var(--x)));
  transition-duration: ${TIMING.entra}ms;
  transition-delay: calc(var(--turno) * ${TIMING.escalon}ms);
}
/* El retraso de la opacidad, aparte del de la fila: la mitad del viaje.
   El de cerrar no viaja, así que no espera — su --x es cero y aparecer
   tarde ahí sería un parpadeo en el lugar. Lo dice un atributo y no el
   valor de --x: un selector que lea el style depende de cómo se
   serialice, y eso no es un contrato de nadie. */
[data-pieza='title-to-actions'] .accion[data-viaja] {
  transition-delay:
    calc((${ULTIMO} - var(--turno)) * ${TIMING.escalon}ms),
    calc((${ULTIMO} - var(--turno)) * ${TIMING.escalon}ms),
    0ms;
}
[data-pieza='title-to-actions'][data-abierto] .accion[data-viaja] {
  transition-duration: ${TIMING.entra / 2}ms, ${TIMING.entra}ms, var(--dur-text, 100ms);
  transition-delay:
    calc(var(--turno) * ${TIMING.escalon}ms + ${TIMING.entra / 2}ms),
    calc(var(--turno) * ${TIMING.escalon}ms),
    0ms;
}
/* El de puntos suspensivos cruza con el de cerrar, en el mismo lugar y
   sin retraso: los dos son la misma ranura. */
[data-pieza='title-to-actions'] .puntos {
  transition:
    opacity ${TIMING.entra}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1)),
    color var(--dur-text, 100ms) var(--ease-text, ease);
}
[data-pieza='title-to-actions'][data-abierto] .puntos {
  opacity: 0;
  transition-duration: ${TIMING.sale}ms;
}
/* Un control transparente sigue recibiendo clics: el que está apagado
   deja de estorbar al que ocupa su lugar. 'inert' ya lo saca del
   teclado y de los lectores; esto es para el puntero. */
[data-pieza='title-to-actions'] .accion { pointer-events: none; }
[data-pieza='title-to-actions'][data-abierto] .accion { pointer-events: auto; }
[data-pieza='title-to-actions'][data-abierto] .puntos { pointer-events: none; }

/* ─── EL PIN SE CLAVA ───
   Un pin se levanta antes de clavarse y queda torcido después, así que
   el glifo hace las dos cosas y el botón no se mueve de lugar: lo que
   anima es el HIJO. Si se moviera el botón, su propia área de hover se
   correría bajo el puntero y el estado titilaría.

     pasar el puntero   sube 2
     apretar            vuelve a cero: el pin entra
     fijado             baja 1 y queda torcido 12°, y el glifo se llena

   La inclinación es lo que separa "apretado" de "clavado" sin agregar
   una caja ni un color: la silueta no cambia de tamaño, cambia de
   ángulo. Ninguno de los tres números sale de una guía; se eligieron
   mirando, y quedan anotados como nuestros. */
[data-pieza='title-to-actions'] .pinIcono {
  position: relative;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  transition: transform ${TIMING.entra}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1));
}
[data-pieza='title-to-actions'] .pinIcono svg { grid-area: 1 / 1; }
@media (hover: hover) and (pointer: fine) {
  [data-pieza='title-to-actions'] .control:hover .pinIcono { transform: translateY(-2px); }
}
[data-pieza='title-to-actions'] .control:active .pinIcono { transform: none; }
[data-pieza='title-to-actions'] .control[aria-pressed='true'] .pinIcono,
[data-pieza='title-to-actions'] .control[aria-pressed='true']:hover .pinIcono {
  transform: translateY(1px) rotate(12deg);
}
/* EL PIN FIJADO SE LLENA, no cambia de color ni gana un fondo. Es el
   mismo trazado con relleno cruzándose con el de trazo, así que
   comparten silueta y lo único que se ve es que se llena. */
[data-pieza='title-to-actions'] .control .encendido {
  position: absolute;
  opacity: 0;
}
[data-pieza='title-to-actions'] .control .encendido,
[data-pieza='title-to-actions'] .control .cambia {
  transition: opacity var(--dur-text, 100ms) var(--ease-text, ease);
}
[data-pieza='title-to-actions'] .control[aria-pressed='true'] {
  color: var(--glifo-activo);
}
[data-pieza='title-to-actions'] .control[aria-pressed='true'] .encendido,
[data-pieza='title-to-actions'] .control[data-copiado] .encendido {
  opacity: 1;
}
[data-pieza='title-to-actions'] .control[data-copiado] .cambia { opacity: 0; }

/* ─── LA TARJETA DE COMPARTIR ───
   Es la única cosa de la pieza que FLOTA, y por eso es la única que
   lleva fondo propio y sombra. El resto se define por contraste, que es
   la regla del sistema; ésta no puede, porque tapa a la barra y a lo
   que haya debajo. Es exactamente el caso —y exactamente los valores—
   del menú del clic derecho: fondo --canvas, radio de la card, y la
   sombra que ahí está anotada como "la única sombra del sistema".

   CRECE DESDE EL BOTÓN QUE LA ABRIÓ, con el origen corrido hasta él:
   una tarjeta que crece desde su centro se despega del gesto que la
   abrió. Y no arranca en cero, que es la regla del área privada: nada
   aparece de la nada.

   SE ESCONDE CON OPACIDAD Y 'inert', NO CON 'visibility'. Aquel menú
   usa visibility porque no tiene inert y necesita salir del teclado, de
   los lectores y del puntero; acá inert hace las tres. Y visibility
   además rompía el foco, medido: un elemento con visibility hidden no
   se puede enfocar, así que abrir con Enter dejaba el foco donde
   estaba. El recibo está arriba del efecto que mueve el foco. */
[data-pieza='title-to-actions'] .tarjeta {
  position: absolute;
  right: ${PADDING}px;
  bottom: calc(100% + 8px);
  width: 320px;
  max-width: 100%;
  padding: ${PADDING}px;
  border-radius: var(--card-radio, 8px);
  background: var(--canvas, #fdfdfc);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.06),
    0 8px 24px rgb(0 0 0 / 0.12),
    0 2px 6px rgb(0 0 0 / 0.06);
  display: flex;
  align-items: center;
  gap: 8px;
  /* EL ORIGEN ESTÁ EN EL BOTÓN DE COMPARTIR, no en la esquina. La
     tarjeta termina donde termina la barra, y ese botón es el segundo
     de la fila: PASO + medio control lo separan del borde. Sin esto la
     tarjeta crecía desde el de cerrar, que es el vecino, y la que se
     abría no era la que apretaste. */
  transform-origin: calc(100% - ${PASO + CONTROL / 2}px) 100%;
  opacity: 0;
  /* 0.92 Y NO EL 0.96 DEL MENÚ, y la diferencia es de tamaño y no de
     gusto. Una escala es relativa: 0.96 sobre los 168 px del menú del
     área privada son 7 px de recorrido, y sobre los 320 de esta tarjeta
     serían 13 — pero repartidos en una caja el doble de grande, así que
     se leen como la mitad. Con 0.92 el recorrido vuelve a ser el que se
     ve allá. Sigue sin aparecer de la nada, que es la regla. */
  transform: scale(0.92);
  transition:
    opacity ${TIMING.sale}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1)),
    transform ${TIMING.sale}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1));
}
[data-pieza='title-to-actions'] .tarjeta[data-abierta] {
  opacity: 1;
  transform: scale(1);
  /* La entrada es más larga que la salida: al cerrar ya decidiste. */
  transition-duration: ${TIMING.entra}ms;
}
@media (prefers-color-scheme: dark) {
  [data-pieza='title-to-actions'] .tarjeta {
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 0.08),
      0 8px 24px rgb(0 0 0 / 0.4),
      0 2px 6px rgb(0 0 0 / 0.24);
  }
}
[data-pieza='title-to-actions'] .rotuloTarjeta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  user-select: none;
}

/* ─── MOVIMIENTO REDUCIDO ───
   No se apaga el cambio: eso es la pieza, no un adorno. Lo que se saca
   es el VIAJE —el rótulo que se corre, los botones que salen de la
   ranura, la tarjeta que crece— y queda el cruce de opacidad, que es lo
   que la guía pide en lugar del movimiento. Y el escalonado se va: sin
   desplazamiento, tres opacidades desfasadas se leen como un error. */
@media (prefers-reduced-motion: reduce) {
  [data-pieza='title-to-actions'] .rotulo,
  [data-pieza='title-to-actions'] .accion,
  [data-pieza='title-to-actions'] .tarjeta,
  [data-pieza='title-to-actions'] .control,
  [data-pieza='title-to-actions'] .pinIcono {
    transform: none !important;
    transition-property: opacity, color;
    /* CON !important, y hace falta: el escalonado vive en una regla con
       tres atributos y le gana a ésta por especificidad. Sin esto los
       tres botones seguían apareciendo desfasados 40 ms sin moverse,
       que es justamente lo que hay que sacar — medido con la consulta
       emulada, no leído de la hoja (sonda/preferencias.mjs). */
    transition-delay: 0ms !important;
  }
}
`
