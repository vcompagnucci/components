/* ═══════════════════════════════════════════════════════════════
   TITLE TO ACTIONS — una barra que nombra lo que estás mirando y, al
   apretar el botón de la derecha, saca las acciones sobre eso. Las tres
   SALEN de ese botón: arrancan apiladas en su lugar y se abren hacia la
   izquierda.

   ─── ESTÁ TERMINADA Y NO ESTÁ PUBLICADA, Y ES A PROPÓSITO ───
   Vive del lado PRIVADO de la frontera —es un boceto del playground, no
   una pieza de `src/piezas/`— porque el usuario la retiró de la
   exposición el 2026-09-17: "que no llegue a exhibition pero que quede
   bien completa en el repo". Entonces no hay entrada en `PIECES`, no
   hay card, no hay detalle y `/title-to-actions` es el 404 del host.

   No es un boceto a medio hacer: es la pieza entera, con sus medidas,
   sus pruebas y su registro en README.md › Title to actions. La única
   diferencia con una publicada es de qué lado del build vive. Para
   publicarla: copiar este archivo a `src/piezas/title-to-actions.tsx` y
   reponer la entrada en `PIECES` — el mismo par de escrituras que hace
   Add to Library. Se abre en el playground, en un frame de tipo boceto.

   Y POR ESO NO PUEDE IMPORTAR NADA DE `src/privado/`, igual que antes:
   la copia al lado público tiene que seguir compilando tal cual. Hoy
   importa React y `motion/react`, y nada más.

   ─── LAS TRES ACCIONES SON LAS DE LA REFERENCIA ───
   La grabación del vault (`web/Title to actions.mp4`) es una cápsula
   flotante para lo que estás LEYENDO: chevron de volver, tapa, título y
   autor, y un botón de más a la derecha que cambia el rótulo por tres
   acciones —pin, compartir y cerrar— adentro de la misma cápsula.

   Acá van esas tres, con una sustitución pedida (2026-09-10: "poné las
   opciones como en la referencia, tal cual" · "en vez de pin poné
   corazón"). Y NO ES UN DISCO, que fue el otro pedido de ese día ("que
   no sea algo de música"): la barra nombra la exposición, que es lo que
   la página tiene alrededor. Un ítem que se puede marcar, cuyo enlace se
   puede copiar, y una fila que se cierra.

   ─── Y LAS TRES HACEN ALGO DE VERDAD ───
   Es el pedido de fondo de esa vuelta: "un centro de control de verdad
   usable". Un botón que no hace nada es lo que había —compartir abría
   una tarjeta ya borrada— y no queda ninguno:

     el corazón   marca el ítem, y el glifo se llena
     compartir    COPIA EL ENLACE de la pieza al portapapeles, y el
                  segundo renglón lo dice
     cerrar       cierra la fila

   Compartir copia y avisa, y no abre nada. Es lo único honesto en un
   navegador: Mensajes, Mail y Notas no existen acá, así que una hoja con
   cuatro destinos serían cuatro botones muertos. Y si el portapapeles
   falla, el rótulo NO dice que copió.

   ─── LAS PROPORCIONES DE LAS OPCIONES, MEDIDAS DE LA GRABACIÓN ───
   "Tal cual" es una instrucción con números atrás. Del cuadro 0080, con
   la fila abierta y asentada, sobre una cápsula de 782×138:

                                  referencia          antes      ahora
     botón / alto de la barra     120/138  0.87       0.71       0.86
     paso / botón               127.5/120  1.0625     1.15       1.0625
     padding / alto de la barra     9/138  0.065      0.143      0.071
     caja del glifo / botón                ~0.625     0.40       0.625
     trazo / alto del glifo        7.4/39  0.19       0.125      0.19
     tinta                            0.0  negro      80 %       tinta

   Los centros de los tres botones caen en 546, 673.5 y 801: un paso de
   127.5 exacto. Y el tamaño del glifo sale de que TRES mediciones
   independientes convergen en la misma caja — las cajas de tinta son
   pin 35×53, share 44×55 y xmark 39×39, y cada una despejada contra la
   proporción del trazado que dibujamos acá da S = 29.3, 30.6 y 30.2. Va
   30.

   EL TRAZO DE 0.19 ES EL PESO EN NEGRITA, y se aparta del censo del
   repo —1.5 sobre una caja de 16, o sea 0.125— a propósito y por pedido.
   El grosor de la diagonal del xmark se midió corrigiendo por el corte:
   la corrida horizontal da 10.5 px y el trazo real es 10.5/√2 = 7.4.

   ─── LO QUE NO SE COPIA, Y POR QUÉ ───
   En la grabación la cápsula y los botones son los dos blanco puro
   —255— y lo que los separa es el vidrio: un anillo y una sombra. Acá no
   hay elevación (DESIGN.md § Elevación: cero box-shadow en todo el
   producto), así que la separación la sigue haciendo la rampa, con el
   control un escalón más profundo que la barra. Es la misma decisión de
   siempre, y es la que no se negocia.

   Y EL RÓTULO NO SE VA. En la referencia el título y el autor
   desaparecen y queda la tapa sola con un hueco de 200 px. Acá se queda
   (2026-09-10: "que al clickear siga apareciendo el título").

   ─── DOS VUELTAS ATRÁS, Y LO QUE QUEDÓ DE CADA UNA ───
   La primera versión era una cápsula de Liquid Glass: filtros SVG, dos
   capas de refracción, un velo medido con una sonda de SwiftUI, cuellos
   de goo y un integrador de resortes propio. El usuario la frenó
   (2026-09-10: "no hagas este componente en liquid glass, hacelo más
   con nuestro design system, siguiendo DESIGN.md"), y con razón: rompía
   cuatro reglas escritas —elevación, tipografía, color y motion—.

   La segunda la reconstruyó entera con el material del sistema y
   transiciones de CSS. El material quedó bien y el MOVIMIENTO se perdió
   (2026-09-10: "la sensación debe ser igual a lo que había con liquid
   glass, pero sin hacerlo con liquid glass, siguiendo reglas de spring
   que dice emil-animations").

   Esta versión es la suma: el material de DESIGN.md, la coreografía y
   las proporciones de la grabación, y resortes en vez de curvas.

   ─── POR QUÉ RESORTES Y NO CURVAS ───
   La regla de motion es explícita: un resorte donde el movimiento se
   puede interrumpir, porque conserva la velocidad al cambiar de
   destino, y una curva sólo donde no. Acá el botón se puede apretar dos
   veces seguidas, y con una transición de CSS la segunda arranca de
   cero. Con un resorte, sólo cambia el destino.

     geometría   0.45 s · rebote 0.30   la fila, el rótulo, la tapa
     glifo       0.30 s · rebote 0      el par que se cruza
     pop         0.35 s · cuadros clave el corazón que se enciende

   La DURACIÓN de la primera está medida sobre la grabación; el REBOTE
   no es el medido. El ajuste libre da 0.385 y la referencia usa 0.40,
   pero la regla de motion pone el techo en 0.30 y "nunca más", así que
   va 0.30. Es la única cifra de la pieza que se aparta a propósito de
   lo medido, y queda dicho.

   ─── LO QUE CUESTA LA LIBRERÍA, MEDIDO ───
   Los resortes los corre Motion, que ya estaba declarado en
   `package.json` y no lo usaba nadie:

     sin resortes, con transiciones de CSS      22 kB   8 kB comprimido
     con `motion` entero                       140 kB  46 kB
     con `m` + LazyMotion(domAnimation)         94 kB  33 kB

   Esos números son del build público, de cuando la pieza vivía en
   `src/piezas/`. Hoy no pesan nada en producción: del lado privado el
   glob de `bocetos.tsx` no toca el bundle, así que `motion` volvió a
   quedar declarado y sin usar del lado público. Quedan escritos porque
   son el costo que volvería el día que se publique. La salida escrita,
   por si el peso importa más:
   la versión de vidrio traía su propio integrador de resortes, cuarenta
   líneas verificadas contra la documentación de Apple hasta el sexto
   decimal, en `.context/title-to-actions/version-vidrio.tsx`.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent } from 'react'
/* `m` Y NO `motion`, CON LazyMotion, y es por peso. El componente
   `motion` trae adentro TODAS las capacidades de la librería —gestos,
   layout, scroll, SVG— aunque uses tres. Medido sobre el build de esta
   pieza: con `motion` el chunk pesa 140 kB (46 comprimido). `m` sólo
   trae el componente, y `domAnimation` carga el juego de capacidades
   mínimo que esto necesita: animar valores con resortes. */
import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 *   RÓTULO → ACCIONES  (el botón de puntos suspensivos)
 *      0ms   la tapa del ítem empieza a irse
 *      0ms   el rótulo arranca hacia la izquierda, a su lugar
 *      0ms   las tres acciones se abren desde la ranura del que apretaste
 *    130ms   la tapa terminó de irse; los tres glifos ya están
 *    270ms   el rótulo pasa por su punto más lejano y vuelve
 *    450ms   todo quieto
 *
 *   ACCIONES → RÓTULO
 *   El mismo resorte al revés. La tapa vuelve más rápido de lo que se
 *   fue —100 ms contra 130— porque el que cierra ya decidió cerrar.
 *
 *   EL CORAZÓN QUE SE ENCIENDE
 *      0ms   el trazado sin relleno se achica a 0.6 y se apaga
 *      0ms   el relleno crece desde 0.6
 *    158ms   pasa por 1.18, que es el pico elegido
 *    350ms   queda en 1
 *
 * NADA ESPERA A NADA. No hay escenas ni temporizadores: los estados son
 * booleanos y lo que mueve la pieza es física. Apretar dos veces
 * seguidas cambia el destino y conserva la velocidad.
 * ───────────────────────────────────────────────────────── */

const RESORTE = { type: 'spring', duration: 0.45, bounce: 0.3 } as const
const GLIFO = { type: 'spring', duration: 0.3, bounce: 0 } as const
/* EL POP DEL CORAZÓN. Es el único sobrepaso de la pieza, y el único
   tramo que NO es un resorte — por eso está escrito con sus cuadros a la
   vista.

   La regla de motion parte los dos casos: estado interactivo va con
   transición o resorte, porque tiene que poder retomarse a mitad de
   camino; un disparo va con cuadros clave, porque siempre corre entero.
   Marcar un ítem es un disparo.

   Y ADEMÁS UN RESORTE NO ALCANZABA, medido. Con `spring 0.35 / rebote
   0.30` de 0.6 a 1 el pico da 1.018 a los 224 ms: un 1.8 % de la escala
   final, que sobre el glifo son fracciones de píxel. La razón es que un
   resorte sobrepasa sobre el RECORRIDO —0.4 acá— y no sobre el destino,
   así que para que se note habría que empezar mucho más chico y ahí el
   corazón aparecería de la nada.

   Con cuadros clave el pico es el que uno elige: 1.18 sobre un glifo de
   30 son 5.4 px, y eso se lee como un latido. */
const POP = { duration: 0.35, times: [0, 0.45, 1], ease: 'easeOut' as const }
const POP_ESCALA = [0.6, 1.18, 1]
/* CON MOVIMIENTO REDUCIDO no queda un resorte más corto: no queda
   ninguno. La regla es que el cambio se siga entendiendo, y lo que lo
   cuenta es el cruce de contenido, no el viaje. */
const QUIETO = { duration: 0 } as const

const TIMING = {
  tapaSale: 130, //   la tapa del ítem se va
  tapaVuelve: 100, // y vuelve, más rápido
  color: 100, //       un cambio de color, como el resto del producto
  press: 100, //       el hundido de un control
  copiado: 2000, //    cuánto se queda el aviso de copiado
}

/* ─────────────────────────────────────────────────────────
 * LA GEOMETRÍA
 *
 * El alto sale del sistema: el texto es 14/20, dos renglones son 40, y
 * con 8 de aire arriba y abajo la barra mide 56. Ese número no se toca —
 * subió de 48 a 56 a pedido (2026-09-10: "dale más espacio en general al
 * componente").
 *
 * LO QUE HAY ADENTRO SÍ CAMBIÓ, y sale de la grabación. Medido sobre la
 * cápsula de 782×138 del cuadro 0080:
 *
 *   botón / alto de la cápsula   120/138  = 0.87    → 48 sobre 56 (0.857)
 *   padding                        9/138  = 0.065   → 4 sobre 56 (0.071)
 *   paso / botón               127.5/120  = 1.0625  → 51, o sea 3 de aire
 *
 * Los botones ocupan casi todo el alto de la barra, y por eso la fila se
 * lee como una fila de controles y no como tres glifos flotando en un
 * campo de aire. Antes eran 40 sobre 56 —0.71— con 8 de padding, y ésa
 * era la diferencia más visible contra la referencia puesta al lado.
 *
 * EL RADIO CONCÉNTRICO SIGUE CERRANDO EXACTO, que es la prueba de que el
 * número entra en el sistema y no lo rompe:
 *
 *     radio de la barra    56 / 2 = 28
 *     menos el padding          − 4
 *     radio del control        = 24 = 48 / 2, o sea un círculo
 *
 * Y 48 sigue por encima del mínimo de área de toque en escritorio, que
 * es 40: el botón creció, no se achicó.
 * ───────────────────────────────────────────────────────── */
const ALTO = 56
const PADDING = 4
const CONTROL = ALTO - 2 * PADDING //  48
const RADIO_BARRA = ALTO / 2 //        28, la píldora
const RADIO_CONTROL = CONTROL / 2 //   24 = 28 − 4, concéntrico
/* El aire entre dos controles vecinos: el paso de la referencia es
   1.0625 del botón, o sea 51 acá, y lo que sobra son 3. Adentro de un
   componente la regla de ×4 no rige (DESIGN.md § 2). */
/* El paso de la referencia es 1.0625 del botón, así que entre dos
   círculos vecinos quedan 3 px. */
const PASO = Math.round(1.0625 * CONTROL) //  51

/* LA TAPA, también medida de la grabación, y NO es el control. Su lado
   es 0.710 del alto de la cápsula —98 sobre 138— contra 0.87 del botón,
   y su radio es 0.394 del lado —39 sobre 99—, o sea un cuadrado muy
   redondeado y no un círculo. */
const TAPA = Math.round(0.71 * ALTO) //        40
const RADIO_TAPA = Math.round(0.394 * TAPA) // 16

/* CUÁNTO VIAJA EL RÓTULO. En la grabación la portada viaja 55.5 pt
   mientras el abanico abre su paso de 64, o sea 0.867 del paso. Acá el
   paso es 51, así que el viaje es 44. Es una razón medida y no un número
   elegido: lo que empuja al rótulo es el lugar que piden las acciones,
   así que los dos tienen que salir de la misma cuenta.

   Y HAY LUGAR PARA ESE VIAJE porque la tapa se va, y la cuenta CIERRA
   EXACTA: la tapa ocupa 40 y el aire que la separa del rótulo 4, o sea
   44 de ranura vacía contra 44 de viaje. El rótulo termina apoyado en el
   borde interno de la píldora, ni un píxel antes ni uno después. En la
   grabación el que libera el lugar es el chevron de volver, y es la
   misma cuenta. Sin algo que se vaya adelante, el rótulo se saldría. */
const VIAJE = Math.round(0.867 * PASO) //  44

/* ─────────────────────────────────────────────────────────
 * LOS GLIFOS
 *
 * ─── LA CAJA ES 16, Y SE DIBUJA A 30 ADENTRO DEL BOTÓN ───
 * El `viewBox` sigue siendo 16, que es el del repo; lo que cambió es a
 * qué tamaño se dibuja. Sale de medir las tres cajas de tinta de la
 * grabación y despejar contra la proporción del trazado que dibujamos
 * acá — y las tres convergen:
 *
 *   share  ink 44×55 → 55/120 = 0.458 ·  0.75·S/48 = 0.458 → S = 29.3
 *   xmark  ink 39×39 → 39/120 = 0.325 ·  0.51·S/48 = 0.325 → S = 30.6
 *   pin    ink 35×53 → 53/120 = 0.440 ·  0.70·S/48 = 0.440 → S = 30.2
 *
 * Tres mediciones independientes en 30 no es un promedio, es un
 * acuerdo. Antes era 16 sobre un botón de 40, o sea 0.40 contra 0.625.
 *
 * ─── EL TRAZO ES 2.3, Y SE APARTA DEL CENSO A PROPÓSITO ───
 * El censo del repo da 1.5 sobre una caja de 16 en los nueve glifos que
 * dibuja, o sea 0.125 del alto de la tinta. La referencia usa el peso en
 * negrita: la diagonal del xmark mide 10.5 px de corrida horizontal, que
 * sobre una diagonal a 45° es un trazo real de 10.5/√2 = 7.4, y sobre
 * sus 39 de alto da 0.19. Llevado a nuestra tinta de 12 en la caja de
 * 16, son 2.3.
 *
 * Es el pedido de "tal cual", y es la clase de número que conviene tener
 * escrito: si algún día la pieza vuelve al peso del producto, se cambia
 * acá y se sabe qué se pierde.
 *
 * ─── DIBUJADOS CONTRA LOS DEL SISTEMA, MEDIDOS ───
 * Cada trazado sale de medir el símbolo que macOS dibuja para lo mismo
 * con `apple/simbolos.swift` —512 px, peso regular—:
 *
 *              tinta      ancho/alto   trazo/alto
 *   heart     310×286       1.084        0.091
 *   share     277×351       0.789        0.071
 *   xmark     249×248       1.004         —  (diagonal)
 *   ellipsis  292× 59       4.949        (el punto ES el trazo)
 *   doc.text  263×335       0.785        0.078
 *
 * SE DIBUJAN, NO SE INCRUSTAN, que es lo mismo que ya hizo el chevron de
 * `Volver` en parts.tsx. El arte de Apple no viaja en el bundle.
 *
 * ─── Y VAN CENTRADOS POR CAJA, SIN CORRECCIÓN ÓPTICA ───
 * Estuvieron corridos: el centroide de la tinta del corazón cae 6.5 %
 * del alto por encima del centro de su caja —la masa está en los lóbulos
 * y la punta de abajo es fina— así que se le aplicó ese desplazamiento
 * para "equilibrar el peso". En pantalla se ve peor, y el usuario lo
 * marcó dos veces: el corazón se leía saliéndose de su casillero. El ojo
 * no centra el centro de masa de un ícono, centra su silueta. Queda
 * anotado para que no vuelva.
 * ───────────────────────────────────────────────────────── */
/* EL CORAZÓN, en dos lóbulos y una punta. Medido del sistema: 310×286,
   o sea 1.084 de ancho sobre alto. Éste da 12.2 × 11.2 = 1.089. */
const CORAZON =
  'M8 13.6C8 13.6 1.9 9.5 1.9 5.8 1.9 3.6 3.6 2.4 5.3 2.4 6.6 2.4 7.6 3.1 8 4.1 8.4 3.1 9.4 2.4 10.7 2.4 12.4 2.4 14.1 3.6 14.1 5.8 14.1 9.5 8 13.6 8 13.6Z'
const COMPARTIR =
  'M8 10.08V2.4M8 2.4 5.52 4.88M8 2.4l2.48 2.48M5.28 6.88H4.32a1.52 1.52 0 0 0-1.52 1.52v4.48a1.52 1.52 0 0 0 1.52 1.52h7.36a1.52 1.52 0 0 0 1.52-1.52v-4.48a1.52 1.52 0 0 0-1.52-1.52h-0.96'
const CERRAR = 'M3.92 3.92 12.08 12.08M12.08 3.92 3.92 12.08'
const PUNTOS = 'M3.79 8h0.01M8 8h0.01M12.21 8h0.01'
/* EL TRAZO. 2.3 sobre la tinta de 12 es el 0.19 de la referencia. */
const TRAZO = 2.3
/* EL PUNTO DE LOS PUNTOS SUSPENSIVOS. El punto ES el trazo, así que su
   número sale de otra cuenta: en la grabación los tres puntos miden 10
   de diámetro con un paso de 18, o sea 1.8 de paso sobre diámetro.
   Nuestro trazado los separa 4.21, así que el punto es 4.21/1.8 = 2.34. */
const TRAZO_PUNTO = 2.34

/* LAS TRES ACCIONES, en el orden de la fila — las de la referencia, con
   el corazón en el lugar del pin. El de cerrar va último porque comparte
   lugar con el de puntos suspensivos: se aprieta dos veces en el mismo
   punto de la pantalla, y eso es lo que hace que abrir y cerrar sean el
   mismo gesto. */
const ACCIONES = [
  { id: 'like', nombre: 'Like', trazo: CORAZON },
  { id: 'share', nombre: 'Copy link', trazo: COMPARTIR },
  { id: 'close', nombre: 'Close', trazo: CERRAR },
] as const
const ULTIMO = ACCIONES.length - 1

/* EL ANCHO DE LA BARRA NO CAMBIA NUNCA, y eso es una decisión y no una
   omisión. Estuvo encogiéndose al abrir —anclada a la derecha, para no
   mover la ranura— y el usuario lo frenó (2026-09-10: "cambiaste mucho
   que cambia el tamaño del componente en general al clickear los
   puntos, revertí eso"). Una barra que cambia de tamaño al apretarla
   mueve todo lo que tiene alrededor. */
const ANCHO = 460

/* EL ÍTEM. Es la exposición misma, que es lo que la página tiene
   alrededor: un ítem real, sin arte de terceros y sin música. Y hace que
   compartir sea verdad — lo que copia es el enlace del ítem que nombra.

   EL ENLACE ES `/` Y NO `/title-to-actions`. Apuntaba a la página de la
   pieza, y esa página dejó de existir al retirarla de `PIECES`
   (2026-09-17): copiar una URL que da 404 es exactamente el botón que
   no hace nada que esta vuelta vino a sacar. `/` es la exposición, que
   es el ítem que el rótulo nombra, así que el enlace vuelve a ser
   verdad — y lo sigue siendo el día que la pieza se publique. */
const ITEM = { titulo: 'Interface exhibition', autor: 'Vito Compagnucci' }
const ENLACE = '/'

/* ─────────────────────────────────────────────────────────
 * EL CONTROL
 *
 * Cuatro lugares lo usan —las tres acciones y los puntos suspensivos—,
 * así que es una parte y no JSX repetido. Los glifos van como children:
 * un control con dos estados lleva dos, y el que quiera otra cosa la
 * pone. Los nombres de las props son los de la plataforma —`pressed`
 * sale como `aria-pressed`— y lo que no se consume se pasa tal cual al
 * <button>, así que un `data-` o un `aria-` de afuera llega.
 *
 * ─── LLEVA RELLENO, Y ESO NO ES DECORACIÓN ───
 * La versión anterior no tenía: el hover pintaba sólo el glifo, que es
 * lo que hacen las dos referencias con sus botones sueltos. Con eso, las
 * tres saliendo de una NO SE LEÍAN — tres glifos apilados no son una
 * forma, son un error de dibujo, y hubo que taparlo haciendo que
 * aparecieran tarde, lo que mataba justamente el gesto.
 *
 * Lo que el vidrio ponía ahí era un círculo. El equivalente del sistema
 * es un relleno un escalón más profundo que la barra, y con él las tres
 * apiladas se leen como UN botón que se abre en tres.
 * ───────────────────────────────────────────────────────── */
type ControlProps = ComponentProps<'button'> & {
  label: string
  pressed?: boolean
}

function Control({ label, pressed, className, children, ...props }: ControlProps) {
  return (
    <button
      type="button"
      className={className ? `control ${className}` : 'control'}
      aria-label={label}
      aria-pressed={pressed}
      {...props}
    >
      {children}
    </button>
  )
}

/* Un glifo. `relleno` dibuja el MISMO trazado también relleno, que es
   cómo se enciende el corazón: la silueta no cambia, se llena. */
function Glifo({
  d,
  relleno,
  trazo = TRAZO,
  className,
}: {
  d: string
  relleno?: boolean
  trazo?: number
  className?: string
}) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={d}
        fill={relleno ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function TitleToActions() {
  /* TRES ESTADOS, y cada uno es una cosa que el que mira puede hacer:
     sacar las acciones, marcar el ítem, y copiar su enlace. */
  const [acciones, setAcciones] = useState(false)
  const [gustado, setGustado] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const reducido = useReducedMotion()

  const puntosBoton = useRef<HTMLButtonElement>(null)
  const botones = useRef<(HTMLButtonElement | null)[]>([])
  const conTeclado = useRef(false)
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined)

  /* El aviso de copiado se borra solo, y el temporizador se cancela al
     desmontar: sin esto, salir de la página mientras el aviso está
     puesto llama a setState sobre un componente que ya no está. */
  useEffect(() => () => clearTimeout(reloj.current), [])

  /* COPIAR ES LO ÚNICO ASINCRÓNICO DE LA PIEZA, y el estado sólo se
     enciende si el portapapeles contestó que sí. El navegador lo niega
     sin gesto del usuario o sin permiso, y un rótulo que dice "Link
     copied" cuando no copió nada es peor que no tener el botón. */
  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(new URL(ENLACE, location.origin).href)
    } catch {
      return
    }
    setCopiado(true)
    clearTimeout(reloj.current)
    reloj.current = setTimeout(() => setCopiado(false), TIMING.copiado)
  }

  const resorte = reducido ? QUIETO : RESORTE
  const glifo = reducido ? QUIETO : GLIFO
  const pop = reducido ? QUIETO : POP

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

  /* El tramo de la placa NO es el resorte, y tiene dos duraciones: se va
     más lento de lo que vuelve. Es lo medido en la referencia, y la
     razón es de lectura y no de física — el que cierra ya decidió. */
  const fundido = {
    duration: reducido ? 0 : (acciones ? TIMING.tapaSale : TIMING.tapaVuelve) / 1000,
    ease: 'easeOut' as const,
  }

  return (
    /* `strict` no deja usar `motion.*` por error en toda la pieza: si
       alguien lo escribe, tira en vez de traer la librería entera de
       vuelta y volver a duplicar el peso sin que nadie lo note. */
    <LazyMotion features={domAnimation} strict>
      <div data-pieza="title-to-actions" data-abierto={acciones ? '' : undefined}>
        <style href="pieza-title-to-actions" precedence="medium">
          {HOJA}
        </style>

        <div className="escena">
          {/* EL RIEL da el ancho máximo y no se mueve. */}
          <div className="riel">
            <div className="barra">
              {/* LA TAPA NO VIAJA, SÓLO SE APAGA, y eso está medido: yendo
              adentro del grupo terminaba 34 px AFUERA de la píldora. Con
              opacidad cero no se ve, pero durante el fundido sí — en los
              cuadros del medio asomaba media tapa por el borde
              izquierdo. Quieta no puede salirse, y el rótulo le pasa por
              encima cuando ella ya casi no está. */}
              <m.div
                className="tapa"
                animate={{ opacity: acciones ? 0 : 1 }}
                transition={fundido}
                aria-hidden="true"
              >
              </m.div>

              {/* EL RÓTULO VIAJA, y viaja a la ranura que dejó la tapa. */}
              <m.div
                className="grupo"
                animate={{ x: acciones ? -VIAJE : 0 }}
                transition={resorte}
              >
                {/* EL RÓTULO NO SE VA. En la referencia el título y el
                    autor desaparecen y la cápsula queda con un hueco de
                    200 px; acá se queda (2026-09-10: "que al clickear
                    siga apareciendo el título").

                    Por eso el grupo reserva el ancho del caso ABIERTO y
                    no el del cerrado: si midiera lo que sobra con la
                    fila cerrada, al abrir las tres acciones se le
                    vendrían encima.

                    EL SEGUNDO RENGLÓN ES EL ACUSE DE COPIAR. No hay
                    ninguna superficie nueva —ni hoja, ni tarjeta, ni
                    velo—: el renglón que dice el autor dice por dos
                    segundos que copió, y vuelve. `aria-live` hace que un
                    lector de pantalla lo anuncie sin mover el foco. */}
                <div className="rotulo">
                  <p className="titulo">{ITEM.titulo}</p>
                  <p className="autor" aria-live="polite">
                    {copiado ? 'Link copied' : ITEM.autor}
                  </p>
                </div>
              </m.div>

              {/* LA RANURA DE LA DERECHA. Los cuatro botones viven acá: los
              tres de acción arrancan apilados en el lugar del de puntos
              suspensivos y se abren hacia la izquierda, que es de dónde
              sale el nombre de la pieza. */}
              <div className="ranura">
                {ACCIONES.map((a, i) => (
                  <m.div
                    key={a.id}
                    className="accion"
                    /* DE DÓNDE SALE. Cerrado los tres están APILADOS en la
                   ranura del botón de puntos, o sea en cero; abierto,
                   cada uno se corre a la izquierda lo que le toca. El de
                   cerrar no viaja: comparte esa ranura. */
                    animate={{
                      x: acciones ? -(ULTIMO - i) * PASO : 0,
                      opacity: acciones ? 1 : 0,
                    }}
                    transition={{ ...resorte, opacity: fundido }}
                  >
                    <Control
                      ref={(el) => {
                        botones.current[i] = el
                      }}
                      /* Un botón transparente y con los clics apagados sigue
                     estando en el orden de tabulación y sigue
                     anunciándose: `inert` lo saca de los dos. */
                      inert={!acciones}
                      label={a.nombre}
                      pressed={a.id === 'like' ? gustado : undefined}
                      onClick={(e) => {
                        frenar(e)
                        if (a.id === 'like') {
                          setGustado((v) => !v)
                          return
                        }
                        if (a.id === 'share') {
                          void copiarEnlace()
                          return
                        }
                        conTeclado.current = e.detail === 0
                        setAcciones(false)
                      }}
                    >
                      {/* EL CORAZÓN HACE UN POP, y es el único sobrepaso
                      de la pieza. Lo que anima es el GLIFO y no el
                      botón: si se moviera el botón, su propia área de
                      hover se correría bajo el puntero y el estado
                      titilaría. */}
                      {a.id === 'like' ? (
                        <span className="par">
                          {/* EL PAR ES EL MISMO TRAZADO con y sin
                            relleno, así que al cruzarse no cambia la
                            silueta: se llena. Y el que llega entra con
                            el pop —de 0.6 a 1 con sobrepaso—, que es la
                            variante Down-Up del reemplazo de símbolos:
                            el que sale se achica, el que entra crece. */}
                          <m.span
                            className="capa"
                            animate={{
                              scale: gustado ? 0.6 : 1,
                              opacity: gustado ? 0 : 1,
                            }}
                            transition={glifo}
                          >
                            <Glifo d={a.trazo} />
                          </m.span>
                          <m.span
                            className="capa"
                            animate={{
                              scale: gustado ? (reducido ? 1 : POP_ESCALA) : 0.6,
                              opacity: gustado ? 1 : 0,
                            }}
                            transition={{
                              scale: pop,
                              opacity: { duration: reducido ? 0 : 0.12 },
                            }}
                          >
                            <Glifo d={a.trazo} relleno />
                          </m.span>
                        </span>
                      ) : (
                        <Glifo d={a.trazo} />
                      )}
                    </Control>
                  </m.div>
                ))}

                <m.div
                  className="puntos"
                  animate={{ opacity: acciones ? 0 : 1 }}
                  transition={fundido}
                >
                  <Control
                    ref={puntosBoton}
                    label="More actions"
                    aria-expanded={acciones}
                    inert={acciones}
                    onClick={(e) => {
                      frenar(e)
                      /* Un clic disparado con Enter o con la barra llega con
                     detail 0; uno del puntero, con 1. Sirve para
                     devolver el foco sólo a quien lo estaba usando. */
                      conTeclado.current = e.detail === 0
                      setAcciones(true)
                    }}
                  >
                    <Glifo d={PUNTOS} trazo={TRAZO_PUNTO} />
                  </Control>
                </m.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
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
   aire a los costados, que es el padding lateral de la página. */
[data-pieza='title-to-actions'] .escena {
  min-height: inherit;
  display: grid;
  place-items: center;
  padding: 0 var(--page-padding-inline, 16px);
}

/* ─── LA BARRA ───
   Un escalón más profunda que la card, con la rampa del sistema: es la
   regla de la card contra la página, un nivel más adentro.

   EL PASO NO ES −5, Y LA RAZÓN ESTÁ MEDIDA. Con −5 —el mismo escalón
   que la card contra el canvas— la barra desaparecía en dos casos que
   son justo los que importan (sonda/fondo.mjs, distancia perceptual y
   no de 8 bits, porque cerca del negro cinco unidades no valen lo mismo
   que cerca del blanco):

     claro,  card en reposo    ΔY 0.045
     claro,  CON EL PUNTERO    ΔY 0.009   ← la card se oscurece al hover
     oscuro, card en reposo    ΔY 0.001
     oscuro, CON EL PUNTERO    ΔY 0.0002  ← invisible

   El culpable en claro es el hover de la card: la lleva de −5 a −9, o
   sea a UNA unidad de la barra, y la pieza se apaga exactamente cuando
   la estás señalando. En oscuro no hace falta ni el hover.

   Así que el paso se toma desde el hover y no desde el reposo: −10 más
   allá de −9 da −20. La rampa es la del sistema, que baja el azul 6/5
   de lo que bajan rojo y verde —la relación de canal de josh, y sin eso
   el gris se enfría al profundizar—. Desde --canvas (253,253,252):

     −5   (248,248,246)  #f8f8f6   la card
     −9   (244,244,241)  #f4f4f1   su hover
     −20  (233,233,228)  #e9e9e4   ésta

   En oscuro la rampa es plana —los tres canales suben lo mismo, como en
   tokens.css— así que desde (9,9,8) el +20 da #1d1d1c. Y en alto
   contraste el paso se duplica, que es la regla del sistema para toda
   distancia que no sea texto: −40 y +40.

   MÁS LA HAIRLINE, Y SÓLO POR EL OSCURO. El relleno solo no alcanza
   ahí: la rampa oscura conserva la distancia en 8 bits, no el ΔL, y el
   propio DESIGN.md declara ese compromiso. Una línea de 1 px no depende
   del relleno, y es cómo el repo ya separa su única superficie flotante
   —el menú del clic derecho— y cómo benji define sus cajas.

   LO QUE LA REFERENCIA HACE Y ACÁ NO: allá la cápsula y los botones son
   los dos blanco puro, 255, y lo que los separa es el vidrio —un anillo
   y una sombra—. Sin elevación eso no se puede copiar, así que la
   separación la hace la rampa. */
[data-pieza='title-to-actions'] .barra {
  --barra: #e9e9e4;
  /* El relleno del control, un escalón más allá de la barra y en la
     misma dirección: −7 en claro, +7 en oscuro. Es la diferencia que
     'MEDICION.md' midió entre el botón y la cápsula de la referencia,
     traída al material del sistema. */
  --control: #e2e2dc;
  --control-hover: #dbdbd4;
  /* EL GLIFO VA EN TINTA PLENA, que es lo medido en la grabación: su
     píxel más oscuro da 0.0, negro puro. Estuvo en --activo-c, el 80 %
     que este sistema usa para "ésta", y al lado de la referencia se leía
     lavado. Lo que se mueve con el hover es el relleno del botón. */
  --glifo: var(--ink, #111111);
  /* LA TAPA VA EN TINTA, no en el relleno del control: en la grabación
     es una fotografía densa —negro de borde a borde— y lo que se lee es
     su silueta contra la cápsula. Un cuadrado del color del botón no
     sería una tapa, sería otro botón sin glifo. */
  --tapa: var(--ink, #111111);

  position: relative;
  width: 100%;
  height: ${ALTO}px;
  padding: ${PADDING}px;
  border-radius: ${RADIO_BARRA}px;
  background: var(--barra);
  /* La hairline del sistema, por dentro para no ocupar layout. */
  box-shadow: inset 0 0 0 1px var(--hairline, rgba(0, 0, 0, 0.051));
  display: flex;
  align-items: center;
  /* El aire entre la tapa y el rótulo. Es el mismo padding: así la
     barra no tiene dos ritmos. */
  gap: ${PADDING}px;
}
@media (prefers-color-scheme: dark) {
  [data-pieza='title-to-actions'] .barra {
    --barra: #1d1d1c;
    --control: #262625;
    --control-hover: #2f2f2d;
  }
}
@media (prefers-contrast: more) and (prefers-color-scheme: light) {
  [data-pieza='title-to-actions'] .barra {
    --barra: #d5d5cc;
    --control: #c7c7bd;
    --control-hover: #b9b9ae;
  }
}
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  [data-pieza='title-to-actions'] .barra {
    --barra: #31312f;
    --control: #434341;
    --control-hover: #4f4f4d;
  }
}

/* ─── EL RIEL ───
   Da el ancho máximo y no se mueve nunca. */
[data-pieza='title-to-actions'] .riel {
  position: relative;
  width: 100%;
  max-width: ${ANCHO}px;
}

/* ─── LA TAPA ───
   Es el lugar del ítem, y su forma y su tamaño salen de medir la tapa de
   la grabación, no de copiar el control de al lado:

     tapa / alto de la cápsula    98/138  = 0.710  → 40 sobre 56
     radio / lado                  39/99  = 0.394  → 16 sobre 40

   O sea que la tapa es MÁS CHICA que los botones —0.71 contra 0.87— y no
   es un círculo: es un cuadrado muy redondeado. Las dos cosas se leían
   mal cuando la tapa era un círculo del tamaño del botón, porque
   entonces la fila entera era una sola forma repetida y la tapa dejaba
   de ser lo que se nombra para ser un control más.

   Y VA MACIZA, SIN GLIFO ADENTRO. En la grabación ahí hay una fotografía
   —una tapa de libro, tinta densa de borde a borde— y lo que se lee a
   40 px no es su dibujo sino su silueta. Un símbolo de documento en su
   lugar se cierra en una mancha: sus dos renglones caen a 2.8 uno del
   otro y a este tamaño se tocan, probado a 20 y a 26 px. La silueta es
   lo que la grabación aporta, y es lo que se toma.

   NO es un botón —no hace nada, dice qué es esto— así que va en un div y
   sale del árbol de accesibilidad: el nombre ya está al lado, en texto. */
[data-pieza='title-to-actions'] .tapa {
  flex: none;
  width: ${TAPA}px;
  height: ${TAPA}px;
  border-radius: ${RADIO_TAPA}px;
  background: var(--tapa);
}

/* El rótulo viaja solo, y su caja se queda en el flujo. */
[data-pieza='title-to-actions'] .grupo {
  flex: 1;
  /* Lo que ocupan las TRES acciones abiertas, no la que se ve cerrada:
     el rótulo tiene que caber al lado de la fila desplegada, o al abrir
     se lo comen. */
  margin-right: ${CONTROL + ULTIMO * PASO + PADDING}px;
  min-width: 0;
  display: flex;
  align-items: center;
}

/* ─── EL CONTROL ───
   48×48 con un glifo de 30, que son las dos razones medidas de la
   grabación: 0.86 del alto de la barra y 0.625 del botón. El radio es
   24, concéntrico exacto contra los 28 de la píldora menos 4 de padding.

   EL RELLENO ES LO QUE HACE QUE LAS TRES SALGAN DE UNA. Ver el
   comentario de 'Control' arriba: sin él, tres glifos apilados no se
   leen como una forma que se abre. */
[data-pieza='title-to-actions'] .control {
  width: ${CONTROL}px;
  height: ${CONTROL}px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: ${RADIO_CONTROL}px;
  background: var(--control);
  color: var(--glifo);
  display: grid;
  place-items: center;
  cursor: pointer;
  /* Sólo color: el hundido del press lo pone el transform de abajo, y
     una lista nombrada es más barata que 'all'. */
  transition:
    background-color ${TIMING.color}ms var(--ease-text, ease),
    transform ${TIMING.press}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1));
}
/* El glifo se dibuja a 30 y no a 16: es la caja en la que convergen las
   tres mediciones de la grabación, 0.625 del botón. */
[data-pieza='title-to-actions'] .control svg {
  width: 30px;
  height: 30px;
  display: block;
}
@media (hover: hover) and (pointer: fine) {
  /* Un dedo dispara :hover al tocar y lo deja pegado. El hover oscurece
     el relleno un paso de la rampa y nada más, que es la regla de josh:
     el glifo ya está en tinta plena y no tiene a dónde subir. */
  [data-pieza='title-to-actions'] .control:hover {
    background: var(--control-hover);
  }
}
/* El press: 0.97, que es el que este repo ya usa en sus botones. La card
   no tiene press y eso no cambia —tokens.css tiene contado por qué—:
   esto ES un botón. */
[data-pieza='title-to-actions'] .control:active { transform: scale(0.97); }
[data-pieza='title-to-actions'] .control:focus-visible {
  outline: var(--focus-outline, 2px solid #005fcc);
  outline-offset: var(--focus-outline-offset, 2px);
  /* El foco no anima: es lo único de la página que aparece instantáneo. */
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  [data-pieza='title-to-actions'] .control { transition-property: background-color; }
  [data-pieza='title-to-actions'] .control:active { transform: none; }
}

/* ─── EL ÍTEM MARCADO ───
   Un control elegido se llena, no cambia de color ni gana otra caja: es
   el mismo trazado con relleno cruzándose con el de trazo, así que
   comparten silueta y lo único que se ve es que se llena.

   NO SE PONE ROJO, y vale decir por qué: el sistema no tiene un color de
   acento, y el único que existe, --destructivo, significa exactamente
   eso, destructivo. Un corazón en rojo tomaría prestado un token que
   dice otra cosa. Lo que marca el estado es el relleno más el pop, y el
   nombre accesible lo dice para quien no lo ve. */
[data-pieza='title-to-actions'] .control[aria-pressed='true'] {
  background: var(--control-hover);
}
/* Las dos capas del cruce, apiladas en la misma celda: cada una lleva
   su propia escala, así que no pueden compartir el transform. */
[data-pieza='title-to-actions'] .par {
  position: relative;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
}
[data-pieza='title-to-actions'] .par .capa {
  grid-area: 1 / 1;
  display: grid;
  place-items: center;
}

/* ─── EL RÓTULO ───
   Los dos renglones del sistema, sin una sola medida propia: 14/20 con
   los pesos 500 y 460 y el par --ink / --text-secondary. Es el mismo par
   que el masthead —título y subtítulo—, que es lo que esto es.

   'min-width: 0' no es prolijidad: sin él un título largo empuja los
   botones fuera de la barra en vez de cortarse. */
[data-pieza='title-to-actions'] .rotulo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  user-select: none;
}
[data-pieza='title-to-actions'] .rotulo p {
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
[data-pieza='title-to-actions'] .autor {
  font-size: var(--type-body-fs, 14px);
  line-height: var(--type-body-lh, 20px);
  font-weight: var(--type-body-fw, 460);
  letter-spacing: var(--type-body-ls, -0.00563rem);
  color: var(--type-body-c, rgba(0, 0, 0, 0.37));
}

/* ─── LA RANURA DE LA DERECHA ───
   Los cuatro botones apilados en el mismo punto. Mide UN control: los
   dos que viajan se dibujan FUERA de ella, encima del rótulo, y pueden
   hacerlo porque para cuando llegan el rótulo ya se corrió. Reservando
   los tres quedaban 102 px de hueco en reposo y la barra se leía rota
   por la mitad. */
[data-pieza='title-to-actions'] .ranura {
  position: absolute;
  top: ${PADDING}px;
  right: ${PADDING}px;
  width: ${CONTROL}px;
  height: ${CONTROL}px;
}
[data-pieza='title-to-actions'] .accion,
[data-pieza='title-to-actions'] .puntos {
  position: absolute;
  top: 0;
  right: 0;
}
/* Un control transparente sigue recibiendo clics: el que está apagado
   deja de estorbar al que ocupa su lugar. 'inert' ya lo saca del teclado
   y de los lectores; esto es para el puntero. */
[data-pieza='title-to-actions'] .accion { pointer-events: none; }
[data-pieza='title-to-actions'][data-abierto] .accion { pointer-events: auto; }
[data-pieza='title-to-actions'][data-abierto] .puntos { pointer-events: none; }
`
