/* ═══════════════════════════════════════════════════════════════
   TITLE TO ACTIONS — una barra que nombra lo que estás mirando y, al
   apretar el botón de la derecha, cambia el título y el autor por las
   tres acciones del ítem. Los tres SALEN de ese botón: arrancan
   apilados en su lugar y se abren hacia la izquierda.

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

   Esta versión es la suma: el material de DESIGN.md, la coreografía de
   la grabación de referencia, y resortes en vez de curvas.

   ─── POR QUÉ RESORTES Y NO CURVAS ───
   La regla de motion es explícita: un resorte donde el movimiento se
   puede interrumpir, porque conserva la velocidad al cambiar de
   destino, y una curva sólo donde no. Acá el botón se puede apretar dos
   veces seguidas, y con una transición de CSS la segunda arranca de
   cero. Con un resorte, sólo cambia el destino.

   Los tres de la pieza, y de dónde sale cada uno:

     geometría   0.45 s · rebote 0.30   la fila, el rótulo, la tapa
     tarjeta     0.50 s · rebote 0      crece del botón que la abrió
     glifo       0.30 s · rebote 0      el corazón que se cruza
     like        0.35 s · rebote 0.30   y el pop de encenderlo

   La DURACIÓN de la primera está medida sobre la grabación; el REBOTE
   no es el medido. El ajuste libre da 0.385 y la referencia usa 0.40,
   pero la regla de motion pone el techo en 0.30 y "nunca más", así que
   va 0.30. Es la única cifra de la pieza que se aparta a propósito de
   lo medido, y queda dicho.

   El de la tarjeta no rebota, y no es una excepción: el rebote se
   reserva para lo que se siente físico, y una superficie que crece de
   40 a 320 px con rebote se lee como una goma, no como un resorte.

   ─── LO QUE CUESTA LA LIBRERÍA, MEDIDO ───
   Los resortes los corre Motion, que ya estaba declarado en
   `package.json` y no lo usaba nadie. Cuesta peso, y el chunk de esta
   pieza lo dice:

     sin resortes, con transiciones de CSS      22 kB   8 kB comprimido
     con `motion` entero                       140 kB  46 kB
     con `m` + LazyMotion(domAnimation)         94 kB  33 kB

   O sea que la física cuesta 25 kB comprimidos sobre esta pieza. Se
   pagan: la regla de motion pide un resorte donde el movimiento se
   interrumpe, y escribir uno a mano cuando la librería ya está en el
   proyecto es la clase de código propio que después nadie mantiene.

   La pieza se carga sola —`demos.tsx` la resuelve con `lazy`— así que
   el chunk baja recién cuando la card entra en pantalla, y las piezas
   App no lo bajan nunca.

   Y QUEDA LA SALIDA ESCRITA, por si algún día el peso importa más que
   esto: la versión de vidrio traía su propio integrador de resortes,
   son cuarenta líneas, y está verificado contra la documentación de
   Apple hasta el sexto decimal. Vive en
   `.context/title-to-actions/version-vidrio.tsx`.
   ═══════════════════════════════════════════════════════════════ */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
} from 'react'
/* `m` Y NO `motion`, CON LazyMotion, y es por peso. El componente
   `motion` trae adentro TODAS las capacidades de la librería —gestos,
   layout, scroll, SVG— aunque uses tres. Medido sobre el build de esta
   pieza: con `motion` el chunk pesa 140 kB (46 comprimido), o sea que
   una barra con tres botones pesaba casi tanto como la aplicación
   entera. `m` sólo trae el componente, y `domAnimation` carga el juego
   de capacidades mínimo que esto necesita: animar valores con resortes.
   El número de después está abajo. */
import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Se lee de arriba abajo. Los ms son desde el clic, y los tramos no
 * terminan todos juntos a propósito: son resortes, y cada uno se
 * asienta cuando se asienta.
 *
 *   TÍTULO → ACCIONES  (el botón de puntos suspensivos)
 *      0ms   la tapa y el rótulo salen juntos hacia la izquierda
 *      0ms   los tres botones se abren desde la ranura del que apretaste
 *      0ms   el rótulo y el chevron empiezan a irse
 *    130ms   el rótulo terminó de irse; los tres glifos ya están
 *    270ms   la tapa pasa por su punto más lejano y vuelve
 *    450ms   todo quieto
 *
 *   ACCIONES → TÍTULO
 *   El mismo resorte al revés. El rótulo vuelve más rápido de lo que se
 *   fue —100 ms contra 130— porque el que vuelve ya decidió volver, y
 *   el título es justamente lo que quiere ver otra vez.
 *
 *   LA TARJETA DE COMPARTIR
 *      0ms   nace siendo el círculo del botón y crece hasta la píldora
 *      0ms   el contenido ya está adentro; lo revela la forma al crecer
 *    500ms   quieta
 *
 * NADA ESPERA A NADA. No hay escenas ni temporizadores: los tres
 * estados son booleanos y lo que mueve la pieza es física. Apretar dos
 * veces seguidas cambia el destino y conserva la velocidad.
 * ───────────────────────────────────────────────────────── */

/* EL RESORTE DE LA GEOMETRÍA. La duración es la medida sobre la
   grabación; el rebote es el techo que fija la regla de motion. */
const RESORTE = { type: 'spring', duration: 0.45, bounce: 0.3 } as const
/* EL DE LA TARJETA. Sin rebote y un poco más lento: es la superficie
   más grande de la pieza y la que más viaja, y la regla de motion pide
   más tiempo para lo más grande. Es además el valor por omisión que esa
   misma regla propone cuando no hay nada medido. */
const MORFEO = { type: 'spring', duration: 0.5, bounce: 0 } as const
/* EL DEL GLIFO. Corto, porque es un dibujo de 16 px y no una geometría
   de 420. */
const GLIFO = { type: 'spring', duration: 0.3, bounce: 0 } as const
/* EL POP DEL LIKE. Es el único sobrepaso de la pieza, y el único tramo
   que NO es un resorte — por eso está escrito con sus cuadros a la
   vista.

   La regla de motion parte los dos casos: estado interactivo va con
   transición o resorte, porque tiene que poder retomarse a mitad de
   camino; un disparo va con cuadros clave, porque siempre corre entero.
   Encender un like es un disparo.

   Y ADEMÁS UN RESORTE NO ALCANZABA, medido. Con `spring 0.35 / rebote
   0.30` de 0.6 a 1 el pico da 1.018 a los 224 ms: un 1.8 % de la escala
   final, que sobre un glifo de 16 px son 0.29 px. No se ve. La razón es
   que un resorte sobrepasa sobre el RECORRIDO —0.4 acá— y no sobre el
   destino, así que para que se note habría que empezar mucho más chico
   y ahí el corazón aparecería de la nada.

   Con cuadros clave el pico es el que uno elige: 1.18 son 2.9 px sobre
   16, y eso sí se lee como un latido. */
const POP = { duration: 0.35, times: [0, 0.45, 1], ease: 'easeOut' as const }
const POP_ESCALA = [0.6, 1.18, 1]
/* CON MOVIMIENTO REDUCIDO no queda un resorte más corto: no queda
   ninguno. La regla es que el cambio se siga entendiendo, y lo que lo
   cuenta es el cruce de contenido, no el viaje. */
const QUIETO = { duration: 0 } as const

const TIMING = {
  rotuloSale: 130, //   el rótulo se va
  rotuloVuelve: 100, // y vuelve, más rápido
  color: 100, //        un cambio de color, como el resto del producto
  press: 100, //        el hundido de un control, como `.glifo:active`
  copiado: 1500, //     cuánto se queda la marca de que el link se copió
}

/* ─────────────────────────────────────────────────────────
 * LA GEOMETRÍA
 *
 * Todo sale de dos números del sistema: el texto es 14/20 y el área de
 * toque mínima en escritorio es 40.
 *
 *   alto 56      dos renglones de 20 más 8 de aire arriba y abajo
 *   control 40   56 − 2×8, y el mínimo de área de toque
 *
 * EL AIRE SUBIÓ DE 4 A 8 y el alto con él, a pedido (2026-09-10: "dale
 * más espacio en general al componente"). Los dos renglones de texto no
 * se mueven —son los 40 del sistema— así que lo que crece es lo que los
 * rodea, y el control se queda en 40 porque es el mínimo de área de
 * toque en escritorio y bajarlo no es una opción.
 *
 * ─── EL RADIO: LA BARRA ES UNA PÍLDORA, LOS CONTROLES CÍRCULOS ───
 * Primero fue `--card-radio`, 8, que es el de la card. Está mal por lo
 * mismo que lo hace correcto ahí: DESIGN.md lo eligió del censo de las
 * siete páginas para CAJAS GRANDES, y una barra de 48 de alto no lo es.
 * Para controles chicos ese mismo censo da 4 y 6, que tampoco es esto.
 *
 * El repo sí tiene el precedente: el reproductor del vault declara
 * `--rep-radio-pildora: 38px` con el comentario "benji, medido" —su
 * propio alto, o sea una píldora— y hay tres `999px` más en el producto
 * y en el área privada.
 *
 * Y con la píldora la regla del radio concéntrico cierra EXACTA, que es
 * la prueba de que el número es el correcto y no una preferencia:
 *
 *     radio de la barra    56 / 2 = 28
 *     menos el padding          − 8
 *     radio del control        = 20 = 40 / 2, o sea un círculo
 * ───────────────────────────────────────────────────────── */
const ALTO = 56
const PADDING = 8
const CONTROL = ALTO - 2 * PADDING //  40
const RADIO_BARRA = ALTO / 2 //        28, la píldora
const RADIO_CONTROL = CONTROL / 2 //   20 = 28 − 8, concéntrico
/* La tapa NO es concéntrica, y es la única que se aparta: una portada es
   contenido y no un control, así que se queda cuadrada con el radio que
   las dos referencias usan en cosas chicas. Un disco redondo sería otra
   cosa. */
const RADIO_TAPA = 6
/* El aire entre dos controles vecinos. Adentro de un componente la regla
   de ×4 no rige (DESIGN.md § 2). Subió de 4 a 6 con el resto del aire:
   con los rellenos puestos, cuatro píxeles entre dos círculos los dejan
   casi tocándose. */
const AIRE = 6
const PASO = CONTROL + AIRE //  46

/* CUÁNTO VIAJAN LA TAPA Y EL RÓTULO. En la grabación la portada viaja
   55.5 pt mientras el abanico abre su paso de 64, o sea 0.867 del paso.
   Acá el paso es 44, así que el viaje es 38. Es una razón medida y no un
   número elegido: lo que empuja a la tapa es el lugar que piden las
   acciones, así que los dos tienen que salir de la misma cuenta. */
const VIAJE = Math.round(0.867 * PASO) //  38

/* ─────────────────────────────────────────────────────────
 * LOS GLIFOS
 *
 * ─── LA CAJA ES 16 Y EL TRAZO 1.5, QUE ES EL DEL PRODUCTO ───
 * Estuvieron en una caja de 20 con el mismo trazo 1.5, y eso los dejaba
 * un 25 % más finos de lo que este repo dibuja: el peso de un ícono no
 * es el grosor absoluto sino el grosor CONTRA SU CAJA. Censo de todos
 * los glifos del repo: `strokeWidth` 1.5 en los nueve, y `viewBox 0 0
 * 16 16` en siete de nueve —los dos que faltaban eran los de esta
 * pieza—. O sea 1.5 sobre 16, que es 0.094; los de acá daban 0.075.
 *
 * Los trazados se escalaron por 16/20 en vez de redibujarse, así que
 * las proporciones medidas de abajo se conservan exactas.
 *
 * ─── DIBUJADOS CONTRA LOS DEL SISTEMA, MEDIDOS ───
 * Antes eran a mano alzada. Ahora cada uno sale de medir el símbolo que
 * macOS dibuja para lo mismo: `apple/simbolos.swift` los renderiza a
 * 512 px con el peso regular —el que le toca a un ícono al lado de un
 * texto de peso 460— y de ahí salen su proporción y su grosor:
 *
 *            ancho×alto   ancho/alto   trazo/alto
 *   heart      310×286      1.084        0.091
 *   share      277×351      0.789        0.071
 *   link       331×332      0.997        0.081
 *   xmark      249×248      1.004         —  (diagonal)
 *   checkmark  269×267      1.008         —  (diagonal)
 *   chevron    152×271      0.561         —  (diagonal)
 *   ellipsis   292× 59      4.949        (el punto ES el trazo)
 *
 * El grosor sale de la moda de las corridas de tinta, así que vale para
 * los trazos rectos y NO para los diagonales: sobre una diagonal la
 * corrida horizontal mide el largo del corte y no el ancho del trazo.
 * Los tres sin número toman el de los otros, que coinciden en 0.07–0.08
 * del alto. Sobre un glifo de 16 eso da 1.2, y acá va 1.5 porque es el
 * peso del producto: la pieza prefiere parecerse a la página que tiene
 * alrededor antes que al símbolo del que copió la forma. Es la misma
 * decisión que arriba, mirada desde el otro lado.
 *
 * SE DIBUJAN, NO SE INCRUSTAN, que es lo mismo que ya hizo el chevron
 * de `Volver`: se toma la forma estándar y se traza acá, con las
 * medidas al lado. El arte de Apple no viaja en el bundle.
 *
 * ─── Y VAN CENTRADOS POR CAJA, SIN CORRECCIÓN ÓPTICA ───
 * Estuvieron corridos: el centroide de la tinta del corazón cae 6.5 %
 * del alto por encima del centro de su caja —la masa está en los
 * lóbulos y la punta de abajo es fina— y el de compartir 5.3 % por
 * debajo, así que se les aplicó ese desplazamiento para "equilibrar el
 * peso". En pantalla se ve peor, y el usuario lo marcó dos veces: el
 * corazón se leía saliéndose de su casillero.
 *
 * La razón es que el ojo no centra el centro de masa de un ícono, centra
 * su silueta; y la silueta de un corazón es simétrica arriba y abajo
 * aunque su tinta no lo sea. Los 0.7 px que sobraban se sacaron y quedan
 * anotados para que no vuelvan.
 * ───────────────────────────────────────────────────────── */
/* EL CORAZÓN, en dos lóbulos y una punta. Medido del sistema: 310×286,
   o sea 1.084 de ancho sobre alto. Éste da 12.2 × 11.2 = 1.089. */
const CORAZON =
  'M8 13.6C8 13.6 1.9 9.5 1.9 5.8 1.9 3.6 3.6 2.4 5.3 2.4 6.6 2.4 7.6 3.1 8 4.1 8.4 3.1 9.4 2.4 10.7 2.4 12.4 2.4 14.1 3.6 14.1 5.8 14.1 9.5 8 13.6 8 13.6Z'
const COMPARTIR =
  'M8 10.08V2.4M8 2.4 5.52 4.88M8 2.4l2.48 2.48M5.28 6.88H4.32a1.52 1.52 0 0 0-1.52 1.52v4.48a1.52 1.52 0 0 0 1.52 1.52h7.36a1.52 1.52 0 0 0 1.52-1.52v-4.48a1.52 1.52 0 0 0-1.52-1.52h-0.96'
const CERRAR = 'M3.92 3.92 12.08 12.08M12.08 3.92 3.92 12.08'
const ENLACE =
  'M6.88 9.12a2.64 2.64 0 0 0 3.76 0l1.68-1.68a2.64 2.64 0 0 0-3.76-3.76l-0.96 0.96M9.12 6.88a2.64 2.64 0 0 0-3.76 0l-1.68 1.68a2.64 2.64 0 0 0 3.76 3.76l0.96-0.96'
const MARCA = 'M3.52 8.48 6.64 11.68 12.48 3.84'
const CHEVRON = 'M10 3.2 5.2 8l4.8 4.8'
const PUNTOS = 'M3.79 8h0.01M8 8h0.01M12.21 8h0.01'
/* EL TRAZO. 1.5 sobre la caja de 16 es el peso del producto, contado en
   los nueve glifos que ya dibuja. */
const TRAZO = 1.5
/* SALVO EN LOS PUNTOS SUSPENSIVOS, donde el punto ES el trazo y por eso
   1.5 los dejaba diminutos al lado de los demás. Medido del sistema:
   `ellipsis` da 292×59, o sea 4.949 de ancho sobre alto — el ancho
   entero son cinco diámetros. Con los otros glifos ocupando unos 12 de
   ancho, el punto es 12 / 4.949 = 2.42. */
const TRAZO_PUNTO = 2.4

/* LAS TRES ACCIONES, en el orden de la fila. El de cerrar va último
   porque comparte lugar con el de puntos suspensivos: se aprieta dos
   veces en el mismo punto de la pantalla, que es lo que hace que abrir y
   cerrar sean el mismo gesto. */
const ACCIONES = [
  { id: 'like', nombre: 'Like', trazo: CORAZON },
  { id: 'share', nombre: 'Share', trazo: COMPARTIR },
  { id: 'close', nombre: 'Close', trazo: CERRAR },
] as const
const ULTIMO = ACCIONES.length - 1
/* Quién abre la tarjeta. Sale del arreglo y no de un número escrito a
   mano: si mañana entra una acción antes, el que la abre sigue siendo
   éste. */
const COMPARTIR_I = ACCIONES.findIndex((a) => a.id === 'share')
/* EL ANCHO DE LA BARRA NO CAMBIA NUNCA, y eso es una decisión y no una
   omisión. Estuvo encogiéndose al abrir —anclada a la derecha, para no
   mover la ranura— y el usuario lo frenó (2026-09-10: "cambiaste mucho
   que cambia el tamaño del componente en general al clickear los
   puntos, revertí eso"). Una barra que cambia de tamaño al apretarla
   mueve todo lo que tiene alrededor; el hueco que queda adentro cuando
   el rótulo se va es el precio, y es el que la referencia medida también
   paga. */
const ANCHO = 460

/* ─────────────────────────────────────────────────────────
 * LA TARJETA DE COMPARTIR
 *
 * NACE SIENDO EL CÍRCULO DEL BOTÓN y crece hasta la píldora. Es la
 * misma idea del morfeo de vidrio, sin vidrio: allá una forma de SVG
 * interpolaba su rectángulo, acá lo interpola el resorte sobre la caja
 * del elemento. Y por eso el radio arranca en 20 —el del control— y
 * termina en 24 —el de la píldora—: entre esos dos la forma nunca deja
 * de ser una píldora, así que no hay nada que se deforme.
 *
 * EL CONTENIDO NO SE ESTIRA. Está en su lugar final desde el primer
 * cuadro y lo revela el `overflow: hidden` de la forma que crece, que
 * es lo mismo que allá hacía el recorte. Un contenido escalado sería
 * tipografía deformada, que es lo que una tarjeta que crece no hace.
 * ───────────────────────────────────────────────────────── */
const TARJETA_ANCHO = 320
/* Dónde nace: el centro del botón de compartir, que es el segundo de la
   fila contando desde la derecha. */
const TARJETA_DESDE = { ancho: CONTROL, alto: CONTROL, radio: RADIO_CONTROL }
const TARJETA_HASTA = { ancho: TARJETA_ANCHO, alto: ALTO, radio: RADIO_BARRA }
/* Lo que hay que correr la caja para que su borde derecho quede donde
   está el del botón mientras crece. El botón vive a PASO del borde. */
const TARJETA_DERECHA = PADDING + PASO

/* EL ÍTEM. Es el mismo que nombraría la página de atrás: la barra dice
   qué estás mirando, que es la mitad de para qué existe. */
const ITEM = { titulo: 'The Dark Side of the Moon', autor: 'Pink Floyd' }

/* LA TAPA. El arte oficial, servido por la API de artwork de Apple para
   el álbum de 1973 (collectionId 1065973699), a 600 px de lado. Cuadrado
   y sin recortar, que es lo que pidió el usuario el 2026-09-10 ("usá la
   real y oficial y que no pierda calidad y que no se recorte"). Queda
   dicho que la tapa es del sello y no nuestra. */
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
 *
 * ─── LLEVA RELLENO, Y ESO NO ES DECORACIÓN ───
 * La versión anterior no tenía: el hover pintaba sólo el glifo, que es
 * lo que hacen las dos referencias con sus botones sueltos. Con eso, los
 * tres botones saliendo de uno NO SE LEÍAN — tres glifos apilados no son
 * una forma, son un error de dibujo, y hubo que taparlo haciendo que
 * aparecieran tarde, lo que mataba justamente el gesto.
 *
 * Lo que el vidrio ponía ahí era un círculo. El equivalente del sistema
 * es un relleno un escalón más profundo que la barra, y con él los tres
 * apilados se leen como UN botón que se abre en tres. La forma es la que
 * cuenta el movimiento; el glifo sólo dice cuál es cuál.
 * ───────────────────────────────────────────────────────── */
type ControlProps = ComponentProps<'button'> & {
  label: string
  pressed?: boolean
  expanded?: boolean
}

function Control({
  label,
  pressed,
  expanded,
  className,
  children,
  ...props
}: ControlProps) {
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
   cómo se enciende el like: la silueta no cambia, se llena. */
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
     cambiar el rótulo por las acciones, marcar el ítem, y abrir la
     tarjeta de compartir. Ninguno es un modo del otro. */
  const [acciones, setAcciones] = useState(false)
  const [gustado, setGustado] = useState(false)
  const [compartir, setCompartir] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const reducido = useReducedMotion()

  const puntosBoton = useRef<HTMLButtonElement>(null)
  const botones = useRef<(HTMLButtonElement | null)[]>([])
  const tarjeta = useRef<HTMLDivElement>(null)
  const copiarBoton = useRef<HTMLButtonElement>(null)
  const conTeclado = useRef(false)
  const conTecladoTarjeta = useRef(false)

  /* Los tres resortes, ya resueltos contra la preferencia del sistema:
     así el JSX de abajo lee una constante y no repite el condicional en
     cada elemento. */
  const resorte = reducido ? QUIETO : RESORTE
  const morfeo = reducido ? QUIETO : MORFEO
  const glifo = reducido ? QUIETO : GLIFO
  const pop = reducido ? QUIETO : POP

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

     Y ESTO ES LO QUE OBLIGÓ A NO ESCONDERLA CON `visibility`. La
     primera versión la escondía como el menú del área privada, y un
     elemento con `visibility: hidden` NO SE PUEDE ENFOCAR: `focus()` no
     hace nada y no avisa. Al abrir con Enter el foco se perdía en
     silencio. Un `requestAnimationFrame` tampoco alcanza —su callback
     corre antes de que el navegador recalcule el estilo—, y está medido:
     con el efecto instrumentado, el ref estaba poblado, el `focus()`
     corría, y el elemento activo seguía siendo el botón de compartir
     (sonda/teclado.mjs). `inert` sola hace las tres cosas por las que
     aquel menú usa `visibility`. */
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

  /* El tramo del rótulo NO es el resorte, y tiene dos duraciones: se va
     más lento de lo que vuelve. Es lo medido en la referencia, y la
     razón es de lectura y no de física — el que cierra ya decidió, y el
     título es justamente lo que quiere ver otra vez. */
  const fundido = {
    duration: reducido ? 0 : (acciones ? TIMING.rotuloSale : TIMING.rotuloVuelve) / 1000,
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
          {/* EL RIEL da el ancho máximo y no se mueve. La barra vive
              pegada a su borde derecho, así que puede encogerse sin que
              ese borde —el de la ranura, el punto que apretás dos
              veces— se corra un píxel. */}
          <div className="riel">
            <div className="barra">
              {/* EL CHEVRON NO VIAJA, SÓLO SE APAGA, y eso está medido: yendo
              adentro del grupo terminaba en x 206 con la barra
              empezando en 240, o sea 34 px AFUERA de la píldora. Con
              opacidad cero no se ve, pero durante el fundido sí — en los
              cuadros del medio asomaba medio chevron por el borde
              izquierdo. Quieto no puede salirse, y la tapa le pasa por
              encima cuando él ya casi no está. */}
              <m.div
                className="chevronCaja"
                animate={{ opacity: acciones ? 0 : 1 }}
                transition={fundido}
              >
                <Control label="Back" inert={acciones} onClick={frenar}>
                  <Glifo d={CHEVRON} />
                </Control>
              </m.div>

              {/* LA TAPA Y EL RÓTULO VIAJAN JUNTOS, que es lo medido: en la
              grabación las dos partes arrancan en el mismo cuadro y con
              el mismo resorte. Por eso van en un solo grupo y no en dos
              elementos con la misma animación repetida. */}
              <m.div
                className="grupo"
                animate={{ x: acciones ? -VIAJE : 0 }}
                transition={resorte}
              >
                {/* aria-hidden: el título y el autor están al lado, y un alt
                que los repita hace que un lector de pantalla los diga
                dos veces. */}
                <img
                  className="tapa"
                  src={TAPA}
                  alt=""
                  width={CONTROL}
                  height={CONTROL}
                  /* Con `width` y `height` la caja está reservada antes de
                 que la imagen llegue, así que la barra no salta. El
                 decodificado va fuera del hilo principal: son 600 px de
                 lado para una caja de 40. */
                  decoding="async"
                  aria-hidden="true"
                />

                <m.div
                  className="rotulo"
                  inert={acciones}
                  animate={{ opacity: acciones ? 0 : 1 }}
                  transition={fundido}
                >
                  <p className="titulo">{ITEM.titulo}</p>
                  <p className="autor">{ITEM.autor}</p>
                </m.div>
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
                   cerrar no viaja: comparte esa ranura, y por eso la
                   fila se puede abrir y cerrar apretando dos veces en el
                   mismo punto de la pantalla. */
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
                      expanded={a.id === 'share' ? compartir : undefined}
                      aria-haspopup={a.id === 'share' ? 'dialog' : undefined}
                      onClick={(e) => {
                        frenar(e)
                        if (a.id === 'like') {
                          setGustado((v) => !v)
                          return
                        }
                        if (a.id === 'share') {
                          conTecladoTarjeta.current = e.detail === 0
                          setCompartir((v) => !v)
                          return
                        }
                        conTeclado.current = e.detail === 0
                        /* Cerrar la fila cierra también lo que la fila
                       abrió: si la tarjeta quedara flotando sin su
                       botón, no habría con qué cerrarla salvo Escape. */
                        setCompartir(false)
                        setAcciones(false)
                      }}
                    >
                      {/* EL LIKE HACE UN POP, y es el único sobrepaso de
                      la pieza. Antes acá había un pin que se clavaba
                      —bajaba y quedaba torcido 12°— y el sobrepaso se
                      había sacado porque no se veía: medido cuadro a
                      cuadro daba 0.63° sobre 12, o sea un 5.3 %.

                      Un corazón es otra cosa: el recorrido es una
                      ESCALA y no un ángulo, y encenderlo es un disparo
                      y no un estado que se pueda retomar a mitad de
                      camino. Por eso va con cuadros clave y no con un
                      resorte — el porqué, con el número que lo decidió,
                      está arriba de POP.

                      Lo que anima es el GLIFO y no el botón: si se
                      moviera el botón, su propia área de hover se
                      correría bajo el puntero y el estado titilaría. */}
                      {a.id === 'like' ? (
                        <m.span
                          className="likeIcono"
                          animate={{ scale: gustado ? 1 : 1 }}
                          transition={glifo}
                        >
                          {/* EL PAR ES EL MISMO TRAZADO con y sin
                            relleno, así que al cruzarse no cambia la
                            silueta: se llena. Y el que llega entra con
                            el pop —de 0.6 a 1 con rebote—, que es la
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
                        </m.span>
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
                    expanded={acciones}
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

            {/* LA TARJETA VIVE AFUERA DE LA BARRA, y tiene que ser así:
                la barra recorta lo que le sobra cuando se encoge, y una
                tarjeta adentro se recortaría con el resto. Afuera se
                ancla al riel, cuyo borde derecho es el mismo que el de
                la barra y tampoco se mueve.

                Está siempre en el documento —así la salida se puede
                animar sin desmontarla— y lo que la apaga es el tamaño
                del botón más `inert`, que la saca del orden de
                tabulación, de los lectores y del puntero. */}
            <m.div
              className="tarjeta"
              ref={tarjeta}
              role="dialog"
              aria-label="Share"
              inert={!compartir}
              initial={false}
              animate={{
                width: compartir ? TARJETA_HASTA.ancho : TARJETA_DESDE.ancho,
                height: compartir ? TARJETA_HASTA.alto : TARJETA_DESDE.alto,
                borderRadius: compartir ? TARJETA_HASTA.radio : TARJETA_DESDE.radio,
                opacity: compartir ? 1 : 0,
              }}
              transition={{
                ...morfeo,
                opacity: { duration: reducido ? 0 : 0.12 },
              }}
            >
              <div className="dentro">
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
            </m.div>
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
  /* La tarjeta se sale de la barra, y esto deja el apilado adentro de
     la pieza: dos de éstas en la misma página no compiten. */
  isolation: isolate;
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
   —el menú del clic derecho— y cómo benji define sus cajas. Va del
   token, así que sigue al tema y al alto contraste sin escribir nada. */
[data-pieza='title-to-actions'] .barra {
  --barra: #e9e9e4;
  /* El relleno del control, un escalón más allá de la barra y en la
     misma dirección: −7 en claro, +7 en oscuro. Es la diferencia que
     'MEDICION.md' midió entre el botón y la cápsula de la referencia,
     traída al material del sistema. */
  --control: #e2e2dc;
  --control-hover: #dbdbd4;
  --glifo: var(--activo-c, rgba(18, 18, 18, 0.8));
  --glifo-activo: var(--ink, #111111);

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
  /* El aire entre las partes de la fila, del mismo tamaño que el que
     las separa del borde: así el padding y el gap son un solo número y
     la barra no tiene dos ritmos. */
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
   Da el ancho máximo y no se mueve nunca. La barra se ancla a su borde
   derecho, con margin-left auto, así que puede encogerse sin correr ese
   borde, que es el de la ranura: el punto de la pantalla que se aprieta
   dos veces. La tarjeta se ancla al mismo borde y por eso tampoco se
   entera de que la barra cambia de ancho. */
[data-pieza='title-to-actions'] .riel {
  position: relative;
  width: 100%;
  max-width: ${ANCHO}px;
}

/* La tapa y el rótulo viajan juntos, así que son un grupo y no dos
   elementos con la misma animación repetida. */
[data-pieza='title-to-actions'] .grupo {
  flex: 1;
  /* Lo que sobra hasta la ranura, que está absoluta contra el borde
     derecho: sin esto el rótulo se le metería debajo. */
  margin-right: ${CONTROL + PADDING}px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: ${PADDING}px;
}
/* El chevron se apaga en su lugar y su caja se queda en el flujo: si
   saliera, la tapa daría un salto de 48 px justo cuando empieza a
   viajar, y el viaje dejaría de ser el que se midió. */
[data-pieza='title-to-actions'] .chevronCaja {
  flex: none;
  display: flex;
}

/* ─── EL CONTROL ───
   40×40 con un glifo de 20: es el mínimo de área de toque en escritorio
   y sale sin inventarlo, de restarle el padding al alto de la barra.

   EL RELLENO ES LO QUE HACE QUE LOS TRES SALGAN DE UNO. Ver el
   comentario de 'Control' arriba: sin él, tres glifos apilados no se
   leen como una forma que se abre.

   EL COLOR DEL GLIFO NO ES EL GRIS DE ANOTACIÓN, y es una decisión
   nuestra. El sistema manda todo lo secundario a --text-secondary, pero
   eso es para lo que ANOTA; un ícono es un control y tiene que poder
   leerse. Va en --activo-c —el token que en este sistema significa
   "ésta"— y sube a --ink al tocarlo: son 65 → 17, un salto de 48, más
   que los 40 que el sistema pide entre dos niveles de la misma
   jerarquía. */
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
    color ${TIMING.color}ms var(--ease-text, ease),
    background-color ${TIMING.color}ms var(--ease-text, ease),
    transform ${TIMING.press}ms var(--ease-dialogo, cubic-bezier(0.19, 1, 0.22, 1));
}
[data-pieza='title-to-actions'] .control svg {
  width: 16px;
  height: 16px;
  display: block;
}
@media (hover: hover) and (pointer: fine) {
  /* Un dedo dispara :hover al tocar y lo deja pegado. El hover oscurece
     el relleno y sube el glifo: es la regla de josh —un paso de la
     rampa y nada más— aplicada al control. */
  [data-pieza='title-to-actions'] .control:hover {
    background: var(--control-hover);
    color: var(--glifo-activo);
  }
}
/* CON SU TARJETA ABIERTA EL BOTÓN SE QUEDA ENCENDIDO. Sin esto, al
   sacar el puntero para ir a la tarjeta el glifo se apaga y la tarjeta
   queda colgando de nada. Es la misma regla que el disparador de menú
   del área privada. */
[data-pieza='title-to-actions'] .control[aria-expanded='true'] {
  color: var(--glifo-activo);
  background: var(--control-hover);
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
  [data-pieza='title-to-actions'] .control { transition-property: color, background-color; }
  [data-pieza='title-to-actions'] .control:active { transform: none; }
}

/* ─── LA TAPA ───
   Cuadrada, del mismo lado que un control, así que la fila entera se
   apoya en una sola altura. 'contain' y no 'cover': los dos dan lo mismo
   con una fuente cuadrada en una caja cuadrada, pero contain no puede
   recortar nunca. */
[data-pieza='title-to-actions'] .tapa {
  width: ${CONTROL}px;
  height: ${CONTROL}px;
  flex: none;
  border-radius: ${RADIO_TAPA}px;
  object-fit: contain;
  background: #000;
  display: block;
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
   Los cuatro botones apilados en el mismo punto. Mide UN control: los
   dos que viajan se dibujan FUERA de ella, encima del rótulo, y pueden
   hacerlo porque para cuando llegan el rótulo ya se está yendo.
   Reservando los tres quedaban 88 px de hueco en reposo y la barra se
   leía rota por la mitad. */
[data-pieza='title-to-actions'] .ranura {
  /* ABSOLUTA Y PEGADA AL BORDE DERECHO, y no en el flujo: la barra se
     encoge desde la izquierda, así que su borde izquierdo se mueve y el
     derecho no. En el flujo, la ranura arrancaba desde el borde que se
     mueve y quedaba fuera del recorte apenas la barra se cerraba — los
     tres botones desaparecían. Anclada al borde que no se mueve, se
     queda donde está. */
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

/* ─── EL LIKE, ENCENDIDO ───
   Un control elegido se llena, no cambia de color ni gana otra caja: es
   el mismo trazado con relleno cruzándose con el de trazo, así que
   comparten silueta y lo único que se ve es que se llena.

   NO SE PONE ROJO, y vale decir por qué: el sistema no tiene un color
   de acento, y el único que existe, --destructivo, significa
   exactamente eso, destructivo. Un like en rojo tomaría prestado un
   token que dice otra cosa. Lo que marca el estado es el relleno más el
   pop, y el nombre accesible lo dice para quien no lo ve. */
[data-pieza='title-to-actions'] .likeIcono {
  position: relative;
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
}
[data-pieza='title-to-actions'] .likeIcono svg { display: block; }
/* Las dos capas del cruce, apiladas en la misma celda: cada una lleva
   su propia escala, así que no pueden compartir el transform. */
[data-pieza='title-to-actions'] .likeIcono .capa {
  grid-area: 1 / 1;
  display: grid;
  place-items: center;
}
[data-pieza='title-to-actions'] .control .encendido {
  position: absolute;
  opacity: 0;
}
[data-pieza='title-to-actions'] .control .encendido,
[data-pieza='title-to-actions'] .control .cambia {
  transition: opacity ${TIMING.color}ms var(--ease-text, ease);
}
[data-pieza='title-to-actions'] .control[aria-pressed='true'] {
  color: var(--glifo-activo);
  background: var(--control-hover);
}
[data-pieza='title-to-actions'] .control[aria-pressed='true'] .encendido,
[data-pieza='title-to-actions'] .control[data-copiado] .encendido {
  opacity: 1;
}
[data-pieza='title-to-actions'] .control[data-copiado] .cambia { opacity: 0; }

/* ─── LA TARJETA DE COMPARTIR ───
   Es la única cosa de la pieza que FLOTA, y por eso la única con fondo
   propio y sombra. El resto se define por contraste, que es la regla del
   sistema; ésta no puede, porque tapa a la barra y a lo que haya debajo.
   Es exactamente el caso —y exactamente los valores— del menú del clic
   derecho: fondo --canvas, y la sombra que ahí está anotada como "la
   única sombra del sistema".

   CRECE DESDE EL BOTÓN QUE LA ABRIÓ, y no con una escala: su caja va
   del círculo del control a la píldora, así que lo que cambia es la
   FORMA y el contenido nunca se deforma. Su borde derecho se queda
   clavado donde está el botón, que es lo que hace que se lea saliendo
   de él y no apareciendo al lado.

   'overflow: hidden' es lo que revela el contenido: está en su lugar
   final desde el primer cuadro y la forma lo va destapando. Es lo mismo
   que en la versión de vidrio hacía el recorte que seguía al
   rectángulo. */
[data-pieza='title-to-actions'] .tarjeta {
  position: absolute;
  right: ${TARJETA_DERECHA}px;
  bottom: calc(100% + ${PADDING + 4}px);
  padding: ${PADDING}px;
  background: var(--canvas, #fdfdfc);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.06),
    0 8px 24px rgb(0 0 0 / 0.12),
    0 2px 6px rgb(0 0 0 / 0.06);
  overflow: hidden;
  /* El contenido se dibuja alineado a la derecha, que es el borde que
     no se mueve: así el botón de copiar queda quieto mientras la forma
     crece hacia la izquierda. */
  display: flex;
  justify-content: flex-end;
}
@media (prefers-color-scheme: dark) {
  [data-pieza='title-to-actions'] .tarjeta {
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 0.08),
      0 8px 24px rgb(0 0 0 / 0.4),
      0 2px 6px rgb(0 0 0 / 0.24);
  }
}
/* El contenido va a su ancho final desde el primer cuadro: si se
   encogiera con la forma, el texto se reacomodaría en cada uno. */
[data-pieza='title-to-actions'] .dentro {
  width: ${TARJETA_ANCHO - 2 * PADDING}px;
  flex: none;
  display: flex;
  align-items: center;
  gap: ${PADDING}px;
}
[data-pieza='title-to-actions'] .rotuloTarjeta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  user-select: none;
}
`
