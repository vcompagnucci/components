/* ═══════════════════════════════════════════════════════════════
   TITLE TO ACTIONS — una barra que nombra lo que estás mirando y, al
   apretar el botón de la derecha, cambia el rótulo por los controles de
   eso. Los controles SALEN de ese botón: arrancan apilados en su lugar y
   se abren hacia la izquierda.

   ─── QUÉ CONTROLA, Y POR QUÉ DEJÓ DE SER UN ÁLBUM ───
   Hasta el 2026-09-10 la barra nombraba un disco —tapa, título, autor— y
   sus tres acciones eran `like`, `share` y `close`. Dos de las tres no
   hacían nada: `share` abría una tarjeta que ya se había borrado, y
   `like` marcaba un ítem que no existe. El usuario lo frenó: "que no sea
   algo de música, que sea un centro de control de verdad usable".

   Así que la barra ahora nombra el DISPLAY, y sus controles son tres
   interruptores que de verdad hacen lo que dicen: apretás y la pieza se
   redibuja delante tuyo. No hay ningún botón muerto.

   ─── DE DÓNDE SALE CADA UNO, MEDIDO ───
   El catálogo de controles de esta Mac (macOS 26.6.1), leído de sus
   propias preferencias:

     defaults export com.apple.controlcenter -
       → ControlCenterDisplayableChronoControlsProviderConfiguration

   devuelve tres, con su tipo: `ControlType 2` es un botón y `1` es un
   interruptor.

     Capture Screen   "Button to take a screenshot"          tipo 2
     Dark Mode        "Toggle whether Dark Mode is enabled"  tipo 1
     Stage Manager    "Enable Stage Manager"                 tipo 1

   Y el módulo que los agrupa —ControlCenter.app/Contents/PlugIns/
   DisplayControls.appex, bundle `com.apple.controls.display`— declara
   seis:

     com.apple.controls.display.dark-mode     interruptor
     com.apple.controls.display.night-shift   interruptor
     com.apple.controls.display.true-tone     interruptor
     com.apple.controls.display.lock          botón
     com.apple.controls.display.screen-saver  botón
     com.apple.controls.display.sleep         botón

   De esa lista, en un navegador sólo `dark-mode` puede ser verdad: Night
   Shift y True Tone son la temperatura del panel y no las toca nadie
   desde una página. Los otros dos interruptores de la pieza salen de
   Accesibilidad, que es donde el sistema pone las mismas dos preferencias
   que esta pieza ya escuchaba: aumentar contraste y reducir movimiento
   (`com.apple.universalaccess`, clave `reduceMotion` presente en esta
   máquina).

   Los tres tienen el mismo privilegio acá: son las TRES RAMAS que
   DESIGN.md ya midió y que la pieza ya dibujaba sin que nadie pudiera
   verlas sin ir a cambiar los ajustes del sistema. Ahora se ven.

   ─── QUÉ DICE UN CONTROL, SEGÚN LA GUÍA ───
   La definición, servida el 2026-09-10:

     "A control is a button or toggle that provides quick access to your
      app's features from other areas of the system. […] Control toggles
      switch between two states, such as on and off."

   Y las dos reglas que cambian el dibujo de esta pieza:

     "For control toggles, provide a symbol for both the on and off
      states. For example, use the SF Symbols `door.garage.open` and
      `door.garage.closed`."

     "Use symbol animations to highlight state changes. For control
      toggles, animate the transition between both on and off states."

   Por eso cada interruptor lleva DOS glifos y no uno relleno: sol/luna,
   círculo/círculo-media-cara, onda/línea. El corazón de la versión
   anterior era el mismo trazado con y sin relleno, que es la otra
   variante y no ésta.

   Y de Toggles, la misma guía, sobre cómo se ve un estado:

     "Make sure the visual differences in a toggle's state are obvious.
      […] add or remove a color fill, show or hide the background shape,
      or change the inner details […] Avoid relying solely on different
      colors to communicate state."

   Acá cambian las tres cosas a la vez: el dibujo, el relleno del control
   y el color del glifo. Ninguna sola carga el estado.

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
   la grabación de referencia, resortes en vez de curvas, y contenido que
   funciona.

   ─── POR QUÉ RESORTES Y NO CURVAS ───
   La regla de motion es explícita: un resorte donde el movimiento se
   puede interrumpir, porque conserva la velocidad al cambiar de
   destino, y una curva sólo donde no. Acá el botón se puede apretar dos
   veces seguidas, y con una transición de CSS la segunda arranca de
   cero. Con un resorte, sólo cambia el destino.

   Los de la pieza, y de dónde sale cada uno:

     geometría   0.45 s · rebote 0.30   la fila, el rótulo, la tapa
     glifo       0.30 s · rebote 0      el par que se cruza
     pop         0.35 s · cuadros clave el interruptor que se enciende

   La DURACIÓN de la primera está medida sobre la grabación; el REBOTE
   no es el medido. El ajuste libre da 0.385 y la referencia usa 0.40,
   pero la regla de motion pone el techo en 0.30 y "nunca más", así que
   va 0.30. Es la única cifra de la pieza que se aparta a propósito de
   lo medido, y queda dicho.

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

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent } from 'react'
/* `m` Y NO `motion`, CON LazyMotion, y es por peso. El componente
   `motion` trae adentro TODAS las capacidades de la librería —gestos,
   layout, scroll, SVG— aunque uses tres. Medido sobre el build de esta
   pieza: con `motion` el chunk pesa 140 kB (46 comprimido), o sea que
   una barra con tres botones pesaba casi tanto como la aplicación
   entera. `m` sólo trae el componente, y `domAnimation` carga el juego
   de capacidades mínimo que esto necesita: animar valores con resortes. */
import { LazyMotion, domAnimation, m } from 'motion/react'

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Se lee de arriba abajo. Los ms son desde el clic, y los tramos no
 * terminan todos juntos a propósito: son resortes, y cada uno se
 * asienta cuando se asienta.
 *
 *   RÓTULO → CONTROLES  (el botón de puntos suspensivos)
 *      0ms   la placa del módulo empieza a irse
 *      0ms   el rótulo arranca hacia la izquierda, a su lugar
 *      0ms   los cuatro controles se abren desde la ranura del que apretaste
 *    130ms   la placa terminó de irse; los cuatro glifos ya están
 *    270ms   el rótulo pasa por su punto más lejano y vuelve
 *    450ms   todo quieto
 *
 *   CONTROLES → RÓTULO
 *   El mismo resorte al revés. La placa vuelve más rápido de lo que se
 *   fue —100 ms contra 130— porque el que cierra ya decidió cerrar.
 *
 *   UN INTERRUPTOR QUE CAMBIA DE ESTADO
 *      0ms   el glifo que se va se achica a 0.6 y se apaga
 *      0ms   el que llega crece desde 0.6
 *    158ms   pasa por 1.18, que es el pico elegido
 *    350ms   queda en 1
 *
 * NADA ESPERA A NADA. No hay escenas ni temporizadores: los estados son
 * booleanos y lo que mueve la pieza es física. Apretar dos veces
 * seguidas cambia el destino y conserva la velocidad.
 * ───────────────────────────────────────────────────────── */

/* EL RESORTE DE LA GEOMETRÍA. La duración es la medida sobre la
   grabación; el rebote es el techo que fija la regla de motion. */
const RESORTE = { type: 'spring', duration: 0.45, bounce: 0.3 } as const
/* EL DEL GLIFO. Corto, porque es un dibujo de 16 px y no una geometría
   de 420. */
const GLIFO = { type: 'spring', duration: 0.3, bounce: 0 } as const
/* EL POP DE ENCENDER UN INTERRUPTOR. Es el único sobrepaso de la pieza,
   y el único tramo que NO es un resorte — por eso está escrito con sus
   cuadros a la vista.

   La regla de motion parte los dos casos: estado interactivo va con
   transición o resorte, porque tiene que poder retomarse a mitad de
   camino; un disparo va con cuadros clave, porque siempre corre entero.
   Encender un interruptor es un disparo.

   Y ADEMÁS UN RESORTE NO ALCANZABA, medido. Con `spring 0.35 / rebote
   0.30` de 0.6 a 1 el pico da 1.018 a los 224 ms: un 1.8 % de la escala
   final, que sobre un glifo de 16 px son 0.29 px. No se ve. La razón es
   que un resorte sobrepasa sobre el RECORRIDO —0.4 acá— y no sobre el
   destino, así que para que se note habría que empezar mucho más chico
   y ahí el glifo aparecería de la nada.

   Con cuadros clave el pico es el que uno elige: 1.18 son 2.9 px sobre
   16, y eso sí se lee como un click. */
const POP = { duration: 0.35, times: [0, 0.45, 1], ease: 'easeOut' as const }
const POP_ESCALA = [0.6, 1.18, 1]
/* CON MOVIMIENTO REDUCIDO no queda un resorte más corto: no queda
   ninguno. La regla es que el cambio se siga entendiendo, y lo que lo
   cuenta es el cruce de contenido, no el viaje. */
const QUIETO = { duration: 0 } as const

const TIMING = {
  placaSale: 130, //   la placa del módulo se va
  placaVuelve: 100, // y vuelve, más rápido
  color: 100, //       un cambio de color, como el resto del producto
  press: 100, //       el hundido de un control, como `.control:active`
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
 * siete páginas para CAJAS GRANDES, y una barra de 56 de alto no lo es.
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
/* El aire entre dos controles vecinos. Adentro de un componente la regla
   de ×4 no rige (DESIGN.md § 2). Subió de 4 a 6 con el resto del aire:
   con los rellenos puestos, cuatro píxeles entre dos círculos los dejan
   casi tocándose. */
const AIRE = 6
const PASO = CONTROL + AIRE //  46

/* CUÁNTO VIAJA EL RÓTULO. En la grabación la portada viaja 55.5 pt
   mientras el abanico abre su paso de 64, o sea 0.867 del paso. Acá el
   paso es 46, así que el viaje es 40. Es una razón medida y no un número
   elegido: lo que empuja al rótulo es el lugar que piden los controles,
   así que los dos tienen que salir de la misma cuenta.

   Y HAY LUGAR PARA ESE VIAJE porque la placa del módulo se va: son
   40 + 8 = 48 de ranura vacía, contra 40 de viaje. En la grabación el
   que libera el lugar es el chevron de volver, y es la misma cuenta.
   Sin algo que se vaya adelante, el rótulo se saldría de la píldora. */
const VIAJE = Math.round(0.867 * PASO) //  40

/* ─────────────────────────────────────────────────────────
 * LOS GLIFOS
 *
 * ─── LA CAJA ES 16 Y EL TRAZO 1.5, QUE ES EL DEL PRODUCTO ───
 * Censo de todos los glifos del repo: `strokeWidth` 1.5 en los nueve, y
 * `viewBox 0 0 16 16` en siete de nueve —los dos que faltaban eran los
 * de esta pieza—. O sea 1.5 sobre 16, que es 0.094 del alto.
 *
 * ─── DIBUJADOS CONTRA LOS DEL SISTEMA, MEDIDOS ───
 * Cada uno sale de medir el símbolo que macOS dibuja para lo mismo:
 * `apple/simbolos.swift` los renderiza a 512 px con el peso regular —el
 * que le toca a un ícono al lado de un texto de peso 460— y de ahí salen
 * su proporción y su grosor. La corrida de hoy, 2026-09-10:
 *
 *                           tinta    ancho/alto   trazo/alto
 *   sun.max                338×338     1.000        0.080
 *   moon.fill              314×315     0.997         —  (relleno)
 *   circle                 318×318     1.000        0.085
 *   circle.lefthalf.filled 318×318     1.000        0.085
 *   waveform.path          383×356     1.076        0.053
 *   minus                  258× 28     9.214         —  (es el trazo)
 *   display                373×314     1.188        0.083
 *   ellipsis               292× 59     4.949        (el punto ES el trazo)
 *   xmark                  249×248     1.004         —  (diagonal)
 *
 * El grosor sale de la moda de las corridas de tinta, así que vale para
 * los trazos rectos y NO para los diagonales: sobre una diagonal la
 * corrida horizontal mide el largo del corte y no el ancho del trazo.
 * Los que no tienen número toman el de los otros, que coinciden en
 * 0.08–0.085 del alto. Sobre un glifo de 16 eso da 1.3, y acá va 1.5
 * porque es el peso del producto: la pieza prefiere parecerse a la
 * página que tiene alrededor antes que al símbolo del que copió la
 * forma.
 *
 * ESO TIENE UN COSTO Y SE PAGA A OJOS ABIERTOS: nuestro trazo es 1.76×
 * el del sistema, así que donde el símbolo deja un hueco entre dos
 * partes —el sol entre su disco y sus rayos, 1.0 de radio contra un
 * trazo de 0.85, o sea 1.18 trazos— acá el hueco mide menos. Se
 * conservan los RADIOS medidos y se acepta el hueco más angosto, que es
 * la misma decisión que arriba mirada desde el otro lado.
 *
 * SE DIBUJAN, NO SE INCRUSTAN, que es lo mismo que ya hizo el chevron
 * de `Volver` en parts.tsx: se toma la forma estándar y se traza acá,
 * con las medidas al lado. El arte de Apple no viaja en el bundle.
 *
 * ─── Y VAN CENTRADOS POR CAJA, SIN CORRECCIÓN ÓPTICA ───
 * Estuvieron corridos: el centroide de la tinta de un corazón cae 6.5 %
 * del alto por encima del centro de su caja, así que se le aplicó ese
 * desplazamiento para "equilibrar el peso". En pantalla se ve peor, y el
 * usuario lo marcó dos veces. El ojo no centra el centro de masa de un
 * ícono, centra su silueta. Queda anotado para que no vuelva.
 * ───────────────────────────────────────────────────────── */

/* LA PLACA DEL MÓDULO — `display`. Es la identidad de lo que la barra
   controla, y no la elegí yo: el módulo del sistema declara su ícono en
   `DisplayControls.appex/Contents/Info.plist`, con
   `ISTypeIdentifier = com.apple.graphic-icon.display`.

   Medido 373×314, o sea 1.188 de ancho sobre alto, con la pantalla
   ocupando los 0.745 de arriba y el pie el resto. Acá la caja de tinta
   es 12 × 10.1 = 1.188 exacto: pantalla de 12 × 7.5 y pie debajo. */
const PANTALLA =
  'M4 3.75h8a1.25 1.25 0 0 1 1.25 1.25v3.5a1.25 1.25 0 0 1-1.25 1.25h-8a1.25 1.25 0 0 1-1.25-1.25V5A1.25 1.25 0 0 1 4 3.75ZM8 10.25v2.1M5.6 12.35h4.8'

/* EL PAR DEL MODO OSCURO — `sun.max` apagado, `moon.fill` encendido. Es
   el par que el propio sistema lleva para la apariencia: los dos nombres
   están adentro del binario de AccessibilitySettingsExtension.appex,
   `sun.max.fill` y `moon.fill`.

   EL SOL, medido 1.000 de ancho sobre alto y simétrico en los dos ejes.
   Sobre la caja de tinta de 12: el disco tiene su línea media en 2.3 de
   radio y los ocho rayos van de 4.6 a 5.3, que con la tapa redonda del
   trazo llegan a 6, o sea al borde. */
const SOL =
  'M5.7 8A2.3 2.3 0 1 0 10.3 8A2.3 2.3 0 1 0 5.7 8M12.6 8h0.7M11.25 11.25l0.5 0.5M8 12.6v0.7M4.75 11.25l-0.5 0.5M3.4 8h-0.7M4.75 4.75l-0.5-0.5M8 3.4v-0.7M11.25 4.75l0.5-0.5'
/* LA LUNA, un creciente relleno de 0.997 de ancho sobre alto. Sale de
   restarle a un círculo de radio 6 en (8,8) otro de radio 6.2 en
   (11.5, 4.5): los dos se cortan en (13.515, 10.364) y (5.637, 2.485),
   que son los dos extremos del arco. La caja que queda mide 11.5 × 11.5,
   o sea 1.000 — el símbolo da 0.997.

   VA RELLENA Y SIN TRAZO. Un creciente relleno Y trazado con 1.5 se
   engorda hasta cerrarse; el símbolo del sistema es una silueta sólida y
   acá también. */
const LUNA = 'M13.515 10.364A6 6 0 1 1 5.637 2.485A6.2 6.2 0 0 0 13.515 10.364Z'

/* EL PAR DEL CONTRASTE — `circle` apagado, `circle.lefthalf.filled`
   encendido. Los dos miden 318×318 de tinta, o sea que son EL MISMO
   círculo y lo único que cambia es la media cara: en la fila del medio
   del segundo, la tinta va de 0.0 a 0.5 —el relleno, macizo hasta el
   borde— y después sólo el trazo de la derecha, de 0.918 a 1.0.

   Con la tinta en 12, el radio exterior es 6 y la línea media 5.25. */
const CIRCULO = 'M13.25 8A5.25 5.25 0 1 0 2.75 8A5.25 5.25 0 1 0 13.25 8'
const MEDIA_CARA = 'M8 2A6 6 0 0 0 8 14Z'

/* EL PAR DEL MOVIMIENTO — la onda apagado, la línea encendido. Los dos
   extremos son símbolos del sistema, `waveform.path` (1.076 de ancho
   sobre alto) y `minus`, pero EL DIBUJO DE LA ONDA ES NUESTRO y eso hay
   que decirlo: la de Apple tiene siete picos de alturas distintas —los
   medí, la fila del medio la cruza en ocho corridas— y a 16 px eso es
   una mancha. Acá van tres medios períodos de 4 de ancho y 2.2 de
   amplitud, que es la onda más simple que todavía se lee como onda.

   Que el estado ENCENDIDO sea la línea y no la onda no es un descuido:
   el interruptor se llama "reducir movimiento", así que prendido tiene
   que mostrar el movimiento reducido. Es la regla del `door.garage.open`
   / `door.garage.closed` de la guía — cada estado dibuja lo que ES, no
   lo que hace el botón. */
const ONDA = 'M2 8Q4 3.6 6 8T10 8T14 8'
const LINEA = 'M2 8h12'

const CERRAR = 'M3.92 3.92 12.08 12.08M12.08 3.92 3.92 12.08'
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

/* ─────────────────────────────────────────────────────────
 * LOS CONTROLES, en el orden de la fila
 *
 * Tres interruptores y un botón, que son los dos tipos que existen
 * —`ControlType` 1 y 2 en el catálogo del sistema, y "a button or
 * toggle" en la guía—. Cada interruptor trae sus dos glifos.
 *
 * El de cerrar va último porque comparte lugar con el de puntos
 * suspensivos: se aprieta dos veces en el mismo punto de la pantalla, y
 * eso es lo que hace que abrir y cerrar sean el mismo gesto.
 *
 * LOS NOMBRES SON LOS DEL SISTEMA y no una traducción libre: "Dark Mode"
 * es literalmente el `DisplayName` del control en el catálogo, y los
 * otros dos son como se llaman los ajustes en Accesibilidad.
 * ───────────────────────────────────────────────────────── */
type Glifos = { d?: string; relleno?: string }
type Interruptor = {
  id: 'dark' | 'contrast' | 'motion'
  nombre: string
  apagado: Glifos
  encendido: Glifos
}
const INTERRUPTORES: Interruptor[] = [
  {
    id: 'dark',
    nombre: 'Dark Mode',
    apagado: { d: SOL },
    encendido: { relleno: LUNA },
  },
  {
    id: 'contrast',
    nombre: 'Increase Contrast',
    apagado: { d: CIRCULO },
    encendido: { d: CIRCULO, relleno: MEDIA_CARA },
  },
  {
    id: 'motion',
    nombre: 'Reduce Motion',
    apagado: { d: ONDA },
    encendido: { d: LINEA },
  },
]
/* Cuántas ranuras abre el abanico: los tres interruptores más cerrar. */
const RANURAS = INTERRUPTORES.length + 1
const ULTIMO = RANURAS - 1

/* EL ANCHO DE LA BARRA NO CAMBIA NUNCA, y eso es una decisión y no una
   omisión. Estuvo encogiéndose al abrir —anclada a la derecha, para no
   mover la ranura— y el usuario lo frenó (2026-09-10: "cambiaste mucho
   que cambia el tamaño del componente en general al clickear los
   puntos, revertí eso"). Una barra que cambia de tamaño al apretarla
   mueve todo lo que tiene alrededor. */
const ANCHO = 460

/* QUÉ NOMBRA LA BARRA. El módulo, con el nombre que le da el sistema
   —`com.apple.controls.display`— y debajo su valor.

   EL SEGUNDO RENGLÓN ES UN HECHO Y NO UNA DESCRIPCIÓN, que es la regla
   que sale de medir a benji: su subtítulo dice "Updated Jul 29, 2026",
   no dice qué es su sitio. Acá dice qué apariencia está puesta, y cambia
   cuando la cambiás — que es además lo que pide la guía: "Update
   controls when someone interacts with them […] to accurately reflect
   the state".

   Y DICE SÓLO LA APARIENCIA, no los tres valores. Con los tres el
   renglón daba "Dark · Increased contrast · Reduced motion", 42
   caracteres sobre 210 px de rótulo, o sea cortado con puntos
   suspensivos justo cuando más tiene para decir. El valor de cada
   interruptor lo lleva el interruptor —encendido se ve, y para quien no
   lo ve está `aria-pressed`—, así que el renglón no lo repite. */
const MODULO = 'Display'

/* ─────────────────────────────────────────────────────────
 * EL CONTROL
 *
 * Cinco lugares lo usan —los tres interruptores, cerrar y los puntos
 * suspensivos—, así que es una parte y no JSX repetido. Los glifos van
 * como children: un control con dos estados lleva dos, y el que quiera
 * otra cosa la pone. Los nombres de las props son los de la plataforma
 * —`pressed` sale como `aria-pressed`, `expanded` como `aria-expanded`—
 * y lo que no se consume se pasa tal cual al <button>, así que un
 * `data-` o un `aria-` de afuera llega.
 *
 * ─── LLEVA RELLENO, Y ESO NO ES DECORACIÓN ───
 * La versión anterior no tenía: el hover pintaba sólo el glifo, que es
 * lo que hacen las dos referencias con sus botones sueltos. Con eso, los
 * botones saliendo de uno NO SE LEÍAN — cuatro glifos apilados no son
 * una forma, son un error de dibujo, y hubo que taparlo haciendo que
 * aparecieran tarde, lo que mataba justamente el gesto.
 *
 * Lo que el vidrio ponía ahí era un círculo. El equivalente del sistema
 * es un relleno un escalón más profundo que la barra, y con él los
 * apilados se leen como UN botón que se abre en cuatro. La forma es la
 * que cuenta el movimiento; el glifo sólo dice cuál es cuál.
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

/* Un glifo. Los dos trazados son opcionales y se dibujan en este orden:
   `relleno` es una silueta maciza sin trazo —la luna, la media cara— y
   `d` es la línea. Un símbolo puede tener uno, el otro, o los dos: el
   círculo de contraste encendido es el mismo aro de siempre con la
   media cara adentro. */
function Glifo({
  d,
  relleno,
  trazo = TRAZO,
  className,
}: {
  d?: string
  relleno?: string
  trazo?: number
  className?: string
}) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {relleno ? <path d={relleno} fill="currentColor" /> : null}
      {d ? (
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={trazo}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  )
}

/* LO QUE EL SISTEMA YA PREFIERE. Se lee una vez, sincrónico, para que el
   primer cuadro salga con la apariencia correcta: si esto viviera en un
   efecto, la pieza pintaría en claro y saltaría a oscuro. */
function prefiere(consulta: string) {
  return typeof window !== 'undefined' && window.matchMedia(consulta).matches
}

const CONSULTAS = {
  dark: '(prefers-color-scheme: dark)',
  contrast: '(prefers-contrast: more)',
  motion: '(prefers-reduced-motion: reduce)',
} as const

export default function TitleToActions() {
  const [abierto, setAbierto] = useState(false)

  /* LOS TRES VALORES QUE LA PIEZA CONTROLA. Arrancan en lo que ya
     prefiere el sistema, así que el control no miente al aparecer: si
     tenés el Mac en oscuro, el interruptor está encendido desde el
     primer cuadro. */
  const [oscuro, setOscuro] = useState(() => prefiere(CONSULTAS.dark))
  const [contraste, setContraste] = useState(() => prefiere(CONSULTAS.contrast))
  const [reducido, setReducido] = useState(() => prefiere(CONSULTAS.motion))

  /* Y SIGUEN AL SISTEMA HASTA QUE LOS TOCÁS. Cambiar el tema del Mac con
     la pieza en pantalla la cambia con él; después de apretar un
     interruptor, ese queda tuyo y deja de escuchar. Es lo que hace
     cualquier control que se puede sobreescribir a mano, y sin esto la
     pieza se pelearía con el sistema en el peor momento. */
  const propio = useRef({ dark: false, contrast: false, motion: false })
  useEffect(() => {
    const setters = { dark: setOscuro, contrast: setContraste, motion: setReducido }
    const bajas = (Object.keys(CONSULTAS) as (keyof typeof CONSULTAS)[]).map((k) => {
      const mq = window.matchMedia(CONSULTAS[k])
      const alCambiar = (e: MediaQueryListEvent) => {
        if (!propio.current[k]) setters[k](e.matches)
      }
      mq.addEventListener('change', alCambiar)
      return () => mq.removeEventListener('change', alCambiar)
    })
    return () => bajas.forEach((baja) => baja())
  }, [])

  const valor = { dark: oscuro, contrast: contraste, motion: reducido }
  const cambiar = {
    dark: () => setOscuro((v) => !v),
    contrast: () => setContraste((v) => !v),
    motion: () => setReducido((v) => !v),
  }

  const puntosBoton = useRef<HTMLButtonElement>(null)
  const botones = useRef<(HTMLButtonElement | null)[]>([])
  const conTeclado = useRef(false)

  /* Los resortes, ya resueltos contra el valor del interruptor: así el
     JSX de abajo lee una constante y no repite el condicional en cada
     elemento. */
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
    const destino = abierto ? botones.current[ULTIMO] : puntosBoton.current
    destino?.focus({ preventScroll: true })
  }, [abierto])

  /* El tramo de la placa NO es el resorte, y tiene dos duraciones: se va
     más lento de lo que vuelve. Es lo medido en la referencia, y la
     razón es de lectura y no de física — el que cierra ya decidió. */
  const fundido = {
    duration: reducido ? 0 : (abierto ? TIMING.placaSale : TIMING.placaVuelve) / 1000,
    ease: 'easeOut' as const,
  }

  return (
    /* `strict` no deja usar `motion.*` por error en toda la pieza: si
       alguien lo escribe, tira en vez de traer la librería entera de
       vuelta y volver a duplicar el peso sin que nadie lo note. */
    <LazyMotion features={domAnimation} strict>
      <div
        data-pieza="title-to-actions"
        /* LOS TRES VALORES SALEN AL DOM, y de acá los toma la hoja. La
           paleta NO está en media queries: si lo estuviera, el sistema y
           el interruptor se contradirían y ganaría el que tenga más
           especificidad. La consulta se lee UNA vez, en JavaScript, y
           desde ahí el atributo es la única fuente. */
        data-tema={oscuro ? 'oscuro' : 'claro'}
        data-contraste={contraste ? '' : undefined}
        data-movimiento={reducido ? 'reducido' : undefined}
        data-abierto={abierto ? '' : undefined}
      >
        <style href="pieza-title-to-actions" precedence="medium">
          {HOJA}
        </style>

        <div className="escena">
          {/* EL RIEL da el ancho máximo y no se mueve. */}
          <div className="riel">
            <div className="barra">
              {/* LA PLACA DEL MÓDULO NO VIAJA, SÓLO SE APAGA, y eso está
              medido: yendo adentro del grupo terminaba 34 px AFUERA de
              la píldora. Con opacidad cero no se ve, pero durante el
              fundido sí — en los cuadros del medio asomaba media placa
              por el borde izquierdo. Quieta no puede salirse, y el
              rótulo le pasa por encima cuando ella ya casi no está. */}
              <m.div
                className="placa"
                animate={{ opacity: abierto ? 0 : 1 }}
                transition={fundido}
                aria-hidden="true"
              >
                <Glifo d={PANTALLA} />
              </m.div>

              {/* EL RÓTULO VIAJA, y viaja a la ranura que dejó la placa.
              Antes acá viajaban dos cosas juntas —la tapa del disco y el
              texto— porque en la grabación arrancan en el mismo cuadro;
              sin tapa queda el texto solo, con el mismo resorte y el
              mismo recorrido. */}
              <m.div
                className="grupo"
                animate={{ x: abierto ? -VIAJE : 0 }}
                transition={resorte}
              >
                {/* EL RÓTULO NO SE VA, y eso cambió lo que la pieza hace:
                    antes se apagaba y los controles ocupaban su lugar, y
                    quedaba media barra vacía (2026-09-10: "que al
                    clickear siga apareciendo el título").

                    Por eso el grupo reserva el ancho del caso ABIERTO y
                    no el del cerrado: si midiera lo que sobra con la
                    fila cerrada, al abrir los controles se le vendrían
                    encima. */}
                <div className="rotulo">
                  <p className="titulo">{MODULO}</p>
                  <p className="valor">{oscuro ? 'Dark' : 'Light'}</p>
                </div>
              </m.div>

              {/* LA RANURA DE LA DERECHA. Los cinco botones viven acá:
              los cuatro del abanico arrancan apilados en el lugar del de
              puntos suspensivos y se abren hacia la izquierda, que es de
              dónde sale el nombre de la pieza. */}
              <div className="ranura">
                {INTERRUPTORES.map((s, i) => (
                  <m.div
                    key={s.id}
                    className="accion"
                    /* DE DÓNDE SALE. Cerrado todos están APILADOS en la
                   ranura del botón de puntos, o sea en cero; abierto,
                   cada uno se corre a la izquierda lo que le toca. */
                    animate={{
                      x: abierto ? -(ULTIMO - i) * PASO : 0,
                      opacity: abierto ? 1 : 0,
                    }}
                    transition={{ ...resorte, opacity: fundido }}
                  >
                    <Control
                      ref={(el) => {
                        botones.current[i] = el
                      }}
                      /* Un botón transparente y con los clics apagados
                     sigue estando en el orden de tabulación y sigue
                     anunciándose: `inert` lo saca de los dos. */
                      inert={!abierto}
                      label={s.nombre}
                      pressed={valor[s.id]}
                      onClick={(e) => {
                        frenar(e)
                        propio.current[s.id] = true
                        cambiar[s.id]()
                      }}
                    >
                      {/* EL PAR DE GLIFOS, CRUZÁNDOSE. La guía pide un
                      símbolo por estado y que la transición entre los
                      dos se anime; esto es las dos cosas: el que sale se
                      achica a 0.6 y se apaga, el que entra crece desde
                      0.6 con el pop.

                      Lo que anima es el GLIFO y no el botón: si se
                      moviera el botón, su propia área de hover se
                      correría bajo el puntero y el estado titilaría. */}
                      <span className="par">
                        <m.span
                          className="capa"
                          animate={{
                            scale: valor[s.id] ? 0.6 : 1,
                            opacity: valor[s.id] ? 0 : 1,
                          }}
                          transition={glifo}
                        >
                          <Glifo {...s.apagado} />
                        </m.span>
                        <m.span
                          className="capa"
                          animate={{
                            scale: valor[s.id] ? (reducido ? 1 : POP_ESCALA) : 0.6,
                            opacity: valor[s.id] ? 1 : 0,
                          }}
                          transition={{
                            scale: pop,
                            opacity: { duration: reducido ? 0 : 0.12 },
                          }}
                        >
                          <Glifo {...s.encendido} />
                        </m.span>
                      </span>
                    </Control>
                  </m.div>
                ))}

                {/* CERRAR. Es un botón y no un interruptor —`ControlType`
                2 en el catálogo del sistema— así que no lleva
                `aria-pressed` ni par de glifos. */}
                <m.div
                  className="accion"
                  animate={{ x: 0, opacity: abierto ? 1 : 0 }}
                  transition={{ ...resorte, opacity: fundido }}
                >
                  <Control
                    ref={(el) => {
                      botones.current[ULTIMO] = el
                    }}
                    inert={!abierto}
                    label="Close"
                    onClick={(e) => {
                      frenar(e)
                      conTeclado.current = e.detail === 0
                      setAbierto(false)
                    }}
                  >
                    <Glifo d={CERRAR} />
                  </Control>
                </m.div>

                <m.div
                  className="puntos"
                  animate={{ opacity: abierto ? 0 : 1 }}
                  transition={fundido}
                >
                  <Control
                    ref={puntosBoton}
                    label="Show controls"
                    expanded={abierto}
                    inert={abierto}
                    onClick={(e) => {
                      frenar(e)
                      /* Un clic disparado con Enter o con la barra llega
                     con detail 0; uno del puntero, con 1. Sirve para
                     devolver el foco sólo a quien lo estaba usando. */
                      conTeclado.current = e.detail === 0
                      setAbierto(true)
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
   No pinta nada: el fondo es el de la card. Lo único suyo es el aire a
   los costados, que es el padding lateral de la página.

   Y ESO SIGUE VALIENDO CON LOS INTERRUPTORES PUESTOS, que es la parte
   que importa: todo lo que la pieza cambia vive adentro de la píldora
   —su relleno, su texto, sus controles—, así que el modo oscuro de acá
   no le pinta un rectángulo negro a la card. DESIGN.md § Elevación dice
   que la pieza no trae fondo propio, y no lo trae. */
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

   ─── POR QUÉ LOS COLORES ESTÁN ACÁ Y NO EN MEDIA QUERIES ───
   Porque los tres son un CONTROL de la pieza y no sólo una preferencia
   del sistema. Con la paleta en @media, apretar el interruptor no podría
   ganarle a la consulta salvo subiendo especificidad, y esa pelea la
   pierde siempre alguien. La consulta se lee una vez en JavaScript —al
   montar, sincrónico, así que el primer cuadro ya sale bien— y desde ahí
   el atributo del DOM es la única fuente. Los valores son exactamente
   los mismos que estaban en las cuatro @media. */
[data-pieza='title-to-actions'] .barra {
  --barra: #e9e9e4;
  /* El relleno del control, un escalón más allá de la barra y en la
     misma dirección: −7 en claro, +7 en oscuro. Es la diferencia que
     'MEDICION.md' midió entre el botón y la cápsula de la referencia,
     traída al material del sistema. */
  --control: #e2e2dc;
  --control-hover: #dbdbd4;
  /* La tinta y el gris de anotación de tokens.css, escritos acá porque
     la pieza puede darse vuelta sola: si el texto siguiera al --ink de
     la página, el modo oscuro del interruptor dejaría letras negras
     sobre una píldora negra. Los alfas son los del sistema —37 % en
     claro, 59.2 % en oscuro, y 57.4 / 78.8 en alto contraste, que es
     donde los dos grises se colapsan en uno—. */
  --tinta: #111111;
  --anotacion: rgba(0, 0, 0, 0.37);
  --glifo: rgba(18, 18, 18, 0.8);
  --glifo-activo: var(--tinta);
  --linea: rgba(0, 0, 0, 0.051);
  --foco: #005fcc;

  position: relative;
  width: 100%;
  height: ${ALTO}px;
  padding: ${PADDING}px;
  border-radius: ${RADIO_BARRA}px;
  background: var(--barra);
  /* La hairline del sistema, por dentro para no ocupar layout. */
  box-shadow: inset 0 0 0 1px var(--linea);
  display: flex;
  align-items: center;
  /* El aire entre las partes de la fila, del mismo tamaño que el que
     las separa del borde: así el padding y el gap son un solo número y
     la barra no tiene dos ritmos. */
  gap: ${PADDING}px;
}
[data-pieza='title-to-actions'][data-tema='oscuro'] .barra {
  --barra: #1d1d1c;
  --control: #262625;
  --control-hover: #2f2f2d;
  --tinta: #fafaf9;
  --anotacion: rgba(255, 255, 255, 0.592);
  --glifo: rgba(250, 250, 249, 0.8);
  --linea: rgba(255, 255, 255, 0.051);
  --foco: #347ee5;
}
[data-pieza='title-to-actions'][data-tema='claro'][data-contraste] .barra {
  --barra: #d5d5cc;
  --control: #c7c7bd;
  --control-hover: #b9b9ae;
  --anotacion: rgba(0, 0, 0, 0.574);
  --linea: rgba(0, 0, 0, 0.102);
  --foco: #0042ad;
}
[data-pieza='title-to-actions'][data-tema='oscuro'][data-contraste] .barra {
  --barra: #31312f;
  --control: #434341;
  --control-hover: #4f4f4d;
  --anotacion: rgba(255, 255, 255, 0.788);
  --linea: rgba(255, 255, 255, 0.102);
  --foco: #589cfe;
}

/* ─── EL RIEL ───
   Da el ancho máximo y no se mueve nunca. */
[data-pieza='title-to-actions'] .riel {
  position: relative;
  width: 100%;
  max-width: ${ANCHO}px;
}

/* ─── LA PLACA DEL MÓDULO ───
   Del mismo lado y el mismo radio que un control, así que la fila entera
   se apoya en una sola altura y en una sola forma. NO es un botón —no
   hace nada, dice qué es esto— así que va en un div y no en un <button>,
   y sale del árbol de accesibilidad: el nombre ya está al lado, en
   texto, y un lector que lo diga dos veces molesta. */
[data-pieza='title-to-actions'] .placa {
  flex: none;
  width: ${CONTROL}px;
  height: ${CONTROL}px;
  border-radius: ${RADIO_CONTROL}px;
  background: var(--control);
  color: var(--glifo);
  display: grid;
  place-items: center;
}
[data-pieza='title-to-actions'] .placa svg {
  width: 16px;
  height: 16px;
  display: block;
}

/* El rótulo viaja solo, y su caja se queda en el flujo. */
[data-pieza='title-to-actions'] .grupo {
  flex: 1;
  /* Lo que ocupan los CUATRO botones abiertos, no el que se ve cerrado:
     el rótulo tiene que caber al lado de la fila desplegada, o al abrir
     se lo comen. */
  margin-right: ${CONTROL + ULTIMO * PASO + PADDING}px;
  min-width: 0;
  display: flex;
  align-items: center;
}

/* ─── EL CONTROL ───
   40×40 con un glifo de 16: es el mínimo de área de toque en escritorio
   y sale sin inventarlo, de restarle el padding al alto de la barra.

   EL RELLENO ES LO QUE HACE QUE LOS CUATRO SALGAN DE UNO. Ver el
   comentario de 'Control' arriba: sin él, glifos apilados no se leen
   como una forma que se abre.

   EL COLOR DEL GLIFO NO ES EL GRIS DE ANOTACIÓN, y es una decisión
   nuestra. El sistema manda todo lo secundario a --text-secondary, pero
   eso es para lo que ANOTA; un ícono es un control y tiene que poder
   leerse. Va al 80 % de la tinta —el token que en este sistema significa
   "ésta"— y sube al 100 % al tocarlo: son 65 → 17, un salto de 48, más
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
/* El press: 0.97, que es el que este repo ya usa en sus botones. La card
   no tiene press y eso no cambia —tokens.css tiene contado por qué—:
   esto ES un botón. */
[data-pieza='title-to-actions'] .control:active { transform: scale(0.97); }
[data-pieza='title-to-actions'] .control:focus-visible {
  outline: 2px solid var(--foco);
  outline-offset: var(--focus-outline-offset, 2px);
  /* El foco no anima: es lo único de la página que aparece instantáneo. */
  transition: none;
}
/* Con movimiento reducido no queda una transición más corta: no queda
   ninguna, y el press deja de hundir. Va por atributo y no por @media
   porque acá lo decide el interruptor. */
[data-pieza='title-to-actions'][data-movimiento='reducido'] .control {
  transition-property: color, background-color;
}
[data-pieza='title-to-actions'][data-movimiento='reducido'] .control:active {
  transform: none;
}

/* ─── UN INTERRUPTOR ENCENDIDO ───
   Cambian las tres cosas que la guía nombra —el dibujo, el relleno de la
   caja y el color del glifo— y ninguna sola carga el estado. El nombre
   accesible lo dice para quien no lo ve, por aria-pressed.

   NO HAY COLOR DE ACENTO, y vale decir por qué: la guía pide teñir el
   símbolo encendido con el color de la marca, y este sistema no tiene
   uno. El único color que existe, --destructivo, significa exactamente
   eso, destructivo. Un interruptor teñido de rojo tomaría prestado un
   token que dice otra cosa. */
[data-pieza='title-to-actions'] .control[aria-pressed='true'] {
  color: var(--glifo-activo);
  background: var(--control-hover);
}
/* Las dos capas del cruce, apiladas en la misma celda: cada una lleva
   su propia escala, así que no pueden compartir el transform. */
[data-pieza='title-to-actions'] .par {
  position: relative;
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
}
[data-pieza='title-to-actions'] .par .capa {
  grid-area: 1 / 1;
  display: grid;
  place-items: center;
}
[data-pieza='title-to-actions'] .par svg { display: block; }

/* ─── EL RÓTULO ───
   Los dos renglones del sistema, sin una sola medida propia: 14/20 con
   los pesos 500 y 460. Es el mismo par que el masthead —título y
   subtítulo—, que es lo que esto es.

   'min-width: 0' no es prolijidad: sin él un rótulo largo empuja los
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
  color: var(--tinta);
}
[data-pieza='title-to-actions'] .valor {
  font-size: var(--type-body-fs, 14px);
  line-height: var(--type-body-lh, 20px);
  font-weight: var(--type-body-fw, 460);
  letter-spacing: var(--type-body-ls, -0.00563rem);
  color: var(--anotacion);
}

/* ─── LA RANURA DE LA DERECHA ───
   Los cinco botones apilados en el mismo punto. Mide UN control: los que
   viajan se dibujan FUERA de ella, encima del rótulo, y pueden hacerlo
   porque para cuando llegan el rótulo ya se corrió. Reservando los
   cuatro quedaban 138 px de hueco en reposo y la barra se leía rota por
   la mitad. */
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
