import { Seccion } from '../../../notes'

/* Las notas de Swipeable tabs. Todo lo de acá está en el registro: el
   README (§ La primera pieza App), medidas.ts de la pieza y la planilla
   .context/recon/swipeable-tabs/MEDICIONES.md. Si una frase de acá deja
   de ser cierta, se corrige acá Y allá — el texto público no es un
   resumen libre, es la misma evidencia contada para alguien que llega
   de afuera.

   VA EN PRIMERA PERSONA DEL SINGULAR. Acá adentro hay una sola persona,
   y el plural sonaba a equipo que no existe. Es además lo que hace josh
   cuando cuenta lo suyo —"I've applied an SVG filter", "I'll never
   forget"— y deja el "we" sólo para llevar al lector de la mano por un
   método. El "you" para el lector se queda: es suyo también.

   EL TONO ES EL DE JOSH PUCKETT, medido en sus páginas (Bloom, Pasito,
   Melt Effect, 2026-09-05): una línea bajo el título que dice qué es
   ("An iOS inspired pull down menu for the web"), secciones cortas con
   títulos llanos ("Anatomy", "A note on performance"), dos o tres
   oraciones por párrafo, verbos directos, "you" cuando te habla. Benji
   escribe ensayos largos por principios; de él se toma el pie de un
   renglón bajo cada demo y la forma de su "How it works" en /liveline:
   prosa corrida de oraciones cortas que conecta lo que se siente con el
   mecanismo ("When a new value arrives, nothing jumps. […] That's why
   it feels like one thing breathing"). La versión anterior de estas
   notas era un ensayo: el usuario pidió "bien simple y conciso, tal
   cual el tono de josh".

   TRES SECCIONES, NO MÁS: "Anatomy", "Performance" y, cuando la pieza
   lo pide, "Use cases". Es la regla para todas las notas (pedido del
   usuario, 2026-09-05: "mucho menos secciones"); las seis de la
   versión anterior eran demasiadas.

   ANATOMY ES PARA QUIEN ACABA DE VER EL VIDEO: qué está mirando y con
   qué está hecho. Habla sólo de la animación que da nombre a la pieza
   —los tabs—; el header que colapsa, las listas y el avatar están en la
   grabación pero no acá ("que se hable solo de la animación de los
   tabs", 2026-09-07). Se escribe desde lo que se ve —el subrayado que
   va con el contenido, el tab que se ensancha, el contenido que cruza
   una sola página— y de ahí al cómo, no al revés: la versión que
   contaba la implementación (un valor derivado, el pager que le pasa un
   tramo a la barra) fue rechazada por inútil ("no siento que sea
   útil", mismo día). Es prosa, sin subtítulos: se probó un h3 por
   parte, la forma de josh en /bloom, y el usuario lo rechazó en la
   página ("no me gusta esta estructura"). Y ACÁ SE NOMBRA LA
   REFERENCIA: que salió de X se cuenta donde se cuenta cómo se midió.
   NO SE DICE DE DÓNDE SON LOS SÍMBOLOS ni la háptica (pedido del
   usuario, 2026-09-07). LA PIEZA NO TIENE LÍNEA DE DESCRIPCIÓN: la tuvo
   ("Top tabs for React Native & Expo.") y el usuario la borró el mismo
   día —"ya está la de arriba que dice swipeable tabs"—; el título es la
   entrada y estas notas lo que sigue.

   SE DICE "REACT NATIVE", NO EL NOMBRE DE UNA LIBRERÍA. Ni Reanimated
   ni worklets: "no se suele decir eso" (usuario, 2026-09-07), y quien
   lee no tiene por qué conocerlos. Lo que esas palabras querían decir
   se dice en llano: la animación corre en el hilo de UI, no en
   JavaScript. Las únicas marcas que quedan son las que el lector
   reconoce: React Native, Expo, iOS.

   LAS REGLAS QUE ENUMERAN EL TERCER Y EL CUARTO PÁRRAFO —partidas en
   dos el 2026-09-07 porque un solo párrafo tenía siete oraciones y la
   forma pide de dos a cuatro: lo que se anima y cómo, y lo que lo
   acompaña— son las de los skills
   `animate-expo`, `interface-craft` y `better-ui`, y entran SÓLO las
   que el código cumple, verificadas el 2026-09-07 (pedido del usuario:
   "aclará reglas que sigan a /animate-expo y /interface-craft y
   /better-ui si cumplen con el código"). Sin frase que las anuncie:
   el párrafo arranca por la primera regla, como el "How it works" de
   benji ("It follows the library's rules for motion" se rechazó: "no
   me gusta esta frase", mismo día). Cada una con su recibo:
   · Transform, opacity y EL COLOR DEL LABEL; el único `width` animado
     es el subrayado, hijo absoluto sin hijos — la excepción que la
     regla permite (animate-expo § 4; barra.tsx, `estiloSubrayado`).
     El inventario de los trece estilos animados de la pieza, contado
     el 2026-09-08 recorriendo cada `useAnimatedStyle`: transform ×6,
     opacity ×5, width ×1 (el subrayado), color ×1 (`estiloLabel`,
     barra.tsx, aplicado al label). Hasta ese día el texto decía "Only
     transform and opacity animate", que era FALSO, y falso justo
     sobre el hallazgo de la pieza: el label activo no es más grueso,
     es más blanco (142 → 255, interpolado en sRGB crudo; el asta de
     la misma letra mide 5.03 px en los dos estados).
     EL CÓDIGO NO CAMBIA, y la pregunta la hizo el usuario en serio
     ("¿pero es una buena práctica el color?", 2026-09-08):
     · `animate-expo` NO pide "sólo transform y opacity". Su § 4 y la
       tabla *Never Ship* enumeran propiedades de LAYOUT —width,
       height, margin, padding, flex, top, gap, las que re-corren
       Yoga—, y `color` no está en ninguna de las dos. Está, en
       cambio, como caso de uso en § 3 ("press, toggle, color, a value
       flipping") y en § 9 como lo que hay que CONSERVAR bajo reduced
       motion ("keep opacity and color changes that explain a state
       change").
     · El color igual no es gratis: transform y opacity son
       composición y el color es pintura —el nodo se redibuja, y con
       texto se re-rasterizan los glifos—. Un escalón más caro que
       transform, varios más barato que layout.
     · La salida estándar para una propiedad de pintura cara es la que
       el propio skill receta para las sombras de Android y el blur:
       apilar dos capas estáticas y cruzar opacidades — acá, un label
       gris y uno blanco. NO SE HACE: dos textos antialiaseados
       superpuestos suman cobertura en el borde de cada glifo y se
       leen más gruesos en el medio del cruce, que es exactamente lo
       que la medición dice que X no hace. Cambiaría un costo que no
       se nota por un artefacto que sí.
     · Y el costo está acotado: seis labels cortos, sólo mientras dura
       una transición, con 60 fps medidos en el teléfono y la traza de
       492 cuadros sin titileo.
   · El gesto interrumpe la animación, también un toque lejano:
     `onBeginDrag` cancela el toque en vuelo y, si hay página prestada,
     el préstamo sigue vivo hasta que no se ve (animate-expo,
     "interruptibility is the baseline"; tabs-deslizables.tsx,
     `alScrollear`, `asentarPrestamo`). Hasta el 2026-09-07 el toque
     lejano bloqueaba el pager; se retiró para cumplir la regla sin
     tocar la animación ni el video. SIN RECIBO en pantalla todavía.
   · Ease-out, nunca ease-in: `Easing.out(Easing.cubic)`, 300 ms
     medidos (animate-expo § 5; tabs-deslizables.tsx, `EASE_SETTLE`).
   · Una háptica por acción, en el cuadro del cambio, nunca la única
     señal: `useAnimatedReaction` en el umbral y `scheduleOnRN` sólo
     ahí (animate-expo § 8; tabs-deslizables.tsx).
   · Reduced motion en la propia animación: `ReduceMotion.System` en
     la config del toque (animate-expo § 9; tabs-deslizables.tsx, `CFG`).
   · 120 fps habilitado en ProMotion: `CADisableMinimumFrameDurationOnPhone`
     (animate-expo § 120fps; nativo/app.json). SOURCE, no medido en
     pantalla: la grabación es a 60.
   · Cada valor es una constante con nombre y con su fuente al lado
     (interface-craft, "tunable by default"; medidas.ts), y un solo
     valor guía toda la transición (interface-craft, "stage-driven";
     `Tramo` en tabs-deslizables.tsx).
   · El movimiento nunca es la única señal: label blanco, subrayado,
     símbolo (better-ui, "motion restraint"; barra.tsx).
   LA QUE NO CUMPLE, A PROPÓSITO, y por eso no está en el texto: la
   puerta de animate-expo "tab switches never slide". Acá el contenido
   se desliza porque la referencia lo hace y está medido cuadro a
   cuadro; la regla apunta a los tabs de abajo con `animation: 'none'`.

   PERFORMANCE SIGUE EL MISMO MÉTODO (pedido del usuario, 2026-09-07:
   "como mejoramos tanto anatomy, hay que mejorar performance, con las
   mismas reglas"): por dónde corre y qué se midió, desde lo que se
   nota —nunca se traba— hacia el cómo, sin nombres de librerías. Cada
   afirmación con su recibo:
   · Todo en el hilo de UI y ninguna vuelta a JavaScript por cuadro:
     el scroll escribe shared values, los estilos derivan de ahí;
     `scheduleOnRN` sólo en la reacción del umbral (háptica), y el
     pager no tiene estado de React desde el 2026-09-07 (antes,
     `setQuieto` dos veces por toque lejano) (animate-expo § 6;
     tabs-deslizables.tsx, `alScrollear`, `alTocar`).
   · Cero layout por cuadro: la fila no es un flex row; `plano`
     precalcula x y ancho de cada tab para cada estado de reposo una
     vez, después de medir los labels con `onLayout`, y `entre`
     interpola entre dos estados por cuadro; cada tab es absoluto con
     `translateX` (animate-expo § 4; barra.tsx, `plano`, `entre`,
     `css.tab`).
   · Las páginas memoizadas, con la medición del tirón: primer cuadro
     quieto y el segundo saltando 0.195 donde el ease pedía 0.128 y
     0.252 (tabs-deslizables.tsx, "LAS PÁGINAS SE MEMOIZAN").
   · Un solo valor, `Tramo`, del que derivan subrayado, labels y
     símbolos en el mismo cuadro (interface-craft, "stage-driven";
     better-ui, "cohesion / single entity": "moves as one object").
     RUNTIME: traza del propio mapper del estilo, barrido de seis
     páginas, 492 cuadros, cero cambios de dirección espurios
     (pantalla.tsx, "No tocar sin volver a medir").
   · 60 fps sostenidos: en el teléfono, medición del usuario ("lo medí
     en el teléfono real y está en 60 fps siempre", 2026-09-07); la
     completitud de cuadros de la grabación del simulador —100.7 %,
     101.1 % y 100.2 % dentro de cada gesto en tres tomas (README § El
     video para X)— es el recibo de la toma, no del teléfono.
   · Revisión "como un buen ingeniero" (2026-09-07): "not in
     JavaScript" → "not the JavaScript thread" (los worklets también son
     JavaScript, corren en el runtime de UI); el scroll es nativo y se
     dice; las seis páginas van montadas desde el principio (`hojas`,
     todas en el ScrollView) y memoizadas por el costo de reconstruir
     seis listas de doce filas (`RENGLONES` en pagina.tsx); y el
     mecanismo del "one derived value": ningún estilo puede leer parte
     de la transición del cuadro anterior.

   VERIFICACIÓN DE VERACIDAD (2026-09-07, pedido del usuario: "chequeá
   que toda esa información sea verdadera y correcta"). Se releyó cada
   afirmación contra el código, y tres eran imprecisas y se corrigieron:
   · "A drag cancels a tap animation in progress" → en ese momento sólo
     un toque al tab vecino se interrumpía; el lejano bloqueaba el
     pager. Esa misma tarde el bloqueo se retiró (ver arriba) y la frase
     volvió a ser cierta para cualquier toque: "at any point, however
     far the tab is".
   · "React does not render during a gesture" → valía para el ARRASTRE;
     el toque lejano renderizaba dos veces. Sin el bloqueo ya no hay
     estado de React en el pager: "during a gesture or a tap".
   · "the second one catching up in a single jump" → el segundo cuadro
     saltó 0.195 donde el ease pedía 0.252: no alcanzó. Lo medido es un
     cuadro entero perdido, y eso dice el texto.
   · "No layout runs while the content moves" → "for the tabs": el
     ancho del subrayado es layout de su propio nodo, fuera de flujo.
   Confirmado sin cambios: la fila se corre con `scrollTo` desde un
   worklet (barra.tsx); `plano` depende de [labels, tabs, viewport];
   las páginas son `hojas = useMemo(..., [tabs, pagina])`; el único
   `width` animado entre 13 estilos animados es el del subrayado.
   Segunda relectura (misma tarde, después del cambio del toque
   lejano), tres precisiones más:
   · "It is never animated on its own" → en un toque el subrayado SÍ
     lleva su propia animación (`avanceToque`, misma config que el
     contenido): ahora "a tap moves both with the same timing".
   · "One haptic per action" → es una por CRUCE: ir y volver sobre el
     mismo límite en un gesto vibra cada vez, como cambia el label. Un
     arrastre no llega a cruzar dos tabs (el segundo cruce queda a una
     pantalla y media de recorrido del dedo; con paging el momentum
     sólo alcanza la página vecina): "un arrastre de tres tabs vibra
     tres veces" fue un ejemplo mal dado, corregido por el usuario.
     Ahora "once per change".
   · "JavaScript takes part only twice" → se leía como una cuenta:
     ahora "at two moments only".

   USE CASES DICE CUÁNDO SÍ Y CUÁNDO NO, Y LO DICE CON LAS PALABRAS DE
   APPLE (pedido del usuario, 2026-09-08: "en use cases usá lo que
   pondría Apple resources"). Tres párrafos: cuándo sí, los ejemplos,
   cuándo no.

   LA HIG ENTRA COMO EXPLICACIÓN, NUNCA COMO AUTORIDAD, y NO SE LA
   NOMBRA. Regla del usuario, el mismo día, después de leer el cierre
   que sí la nombraba: "no menciones Apple guidelines […] usalas pero
   para explicar algo mejor, no para decir algo que no es". O sea que
   de la guía se toman los conceptos y los números —"closely related",
   la regla de los paneles autocontenidos, "about five", "top-level
   sections", los labels cortos— y se dicen en llano como propios, con
   la cita en este comentario. La palabra "Apple" no aparece en el
   texto público.

   SOURCE — las tres páginas de la HIG, servidas el 2026-09-08 y leídas
   por la API de documentación de Apple, `developer.apple.com/tutorials/
   data/design/human-interface-guidelines/<slug>.json` (la página HTML
   se arma con JavaScript y no se puede leer con `curl`; WebFetch
   devuelve sólo el título). Cada frase del texto con su cita:
   · "closely related lists" ← segmented controls › iOS, iPadOS:
     "Consider a segmented control to switch between closely related
     subviews"; tab views: "Use a tab view to present closely related
     areas of content".
   · "what happens in one does not change what the others show" ←
     tab views: "Make sure the controls within a pane affect content
     only in the same pane. Panes are mutually exclusive, so ensure
     they're fully self-contained."
   · "more lists than a segmented control should hold" y "About five
     lists or fewer belong in a segmented control" ← segmented
     controls: "Limit the number of segments in a control. […] Aim for
     no more than about five to seven segments in a wide interface and
     no more than about five segments on iPhone." El "about" es de
     Apple y se conserva: no es un tope duro.
   · "a hierarchy" ← es la palabra de Apple para esto (aparece cuatro
     veces en tab bars, ninguna vez "drill" ni "back button" en las
     tres páginas): "As a representation of your app's hierarchy".
   · "the top-level sections of an app belong in the tab bar at the
     bottom" ← tab bars: "A tab bar lets people navigate between
     top-level sections of your app" + iOS: "A tab bar floats above
     content at the bottom of the screen".
   · "Both of those ask for short labels" ← tab bars: "Include tab
     labels to help with navigation. […] Use single words whenever
     possible"; segmented controls: "Use nouns or noun phrases for
     segment labels" y "As much as possible, use content with a similar
     size in each segment".
   EL CUARTO PÁRRAFO SE BORRÓ, Y ESTABA MAL DE DOS FORMAS. Decía: "On
   the Mac, Apple's guidelines call this a tab view: mutually exclusive
   panes of content in one area, switched with a row of tabs. There is
   no tab view on iPhone; for the same job the guidelines point to a
   segmented control." Vivió unas horas el 2026-09-08 y lo bajó el
   usuario ("está mal esa parte"). Tenía razón:
   · "There is no tab view on iPhone" es FALSO para quien programa. El
     "Not supported in iOS" de la HIG habla del componente de DISEÑO de
     macOS, la caja con solapas arriba; pero `TabView` existe en
     SwiftUI en iOS, es el contenedor del tab bar, y con
     `.tabViewStyle(.page)` es literalmente un pager que se desliza,
     o sea lo más parecido del sistema a esta pieza. Escribir que no
     existe es exactamente "decir algo que no es".
   · "For the same job the guidelines point to a segmented control"
     CONTRADICE al párrafo de arriba, que dice que un segmented control
     es para cinco listas o menos. Los dos juntos afirmaban que esta
     pieza tendría que ser un segmented control, que es lo contrario de
     todo lo que argumenta la sección.
   Lo que el párrafo quería aportar —que el patrón vive entre un
   segmented control y un tab bar— ya lo dice el tercer párrafo sin
   nombrar a nadie y sin afirmar de más. La lección para las próximas
   piezas: una guía sirve para afilar una explicación, no para pedirle
   permiso; en el momento en que el texto necesita el nombre de quien
   la escribió para sostenerse, la afirmación no se sostiene sola.
   TAMPOCO se cita "Avoid providing more than six tabs in a tab view"
   (tab views), aunque X tenga seis: es guía de macOS y usarla para
   iPhone sería estirarla.
   LO QUE NO SALE DE APPLE, y es de la pieza, verificado en el código:
   el tab activo se ensancha para su símbolo y la fila sólo se corre
   cuando un tab no entra (`BARRA.fila = 'visible'`, barra.tsx); y
   "two feeds and four topics in one row" son los seis de `TABS` en
   pantalla.tsx (For you, Following · Stocks, Tech, AI, Design).
   VA A LLEVAR VIDEO: un video por caso con un pie de un renglón como
   los de benji en /liveline ("Resting heart rate. Custom formatter,
   exaggerated Y-axis.": qué es y qué cambia). Hasta que existan, la
   sección es prosa (pedido del usuario, 2026-09-07: "pienso incluir
   más videos y demás").
   LO QUE NO SE HIZO, y espera decisión: la sección "Resources" con la
   que Apple cierra cada página de la HIG (Related · Developer
   documentation · Videos). "Apple resources" también se puede leer
   así, pero meter un bloque de links cambia la forma de las notas de
   TODAS las piezas, y eso es otra mini-decisión.

   NÚMERO Y UNIDAD VAN CON ESPACIO INDIVISIBLE (U+00A0): "300 ms",
   "60 fps", "120 fps", "492 frames". Es la regla de better-typography
   (`&nbsp;` para que "16 px" no se parta en un corte de línea); hoy
   ninguno caía en un corte, pero cualquier cambio de texto o de ancho
   los podía partir (2026-09-07).

   LOS NOMBRES SON LOS TÉRMINOS TÉCNICOS —tab, underline, label,
   symbol, page; "select", no "jump"—, por la regla de nombres del repo
   (AGENTS.md › Método de trabajo): la palabra que iría en una
   especificación, no la graciosa.

   Y LA REDACCIÓN PASA POR `better-writing` (2026-09-07, pedido del
   usuario: que todo respete la regla de vocabulario y mejorar la
   redacción como benji o josh): palabras que un lector cansado entiende
   a la primera, sin modismos, y cada palabra que no trabaja se borra.
   Lo que salió en esa pasada: "mid-flight" → "in progress"; "tied to"
   → "bound to"; "never runs ahead or lags behind" → "It is never
   animated on its own"; "cue" → "feedback"; "in step" →
   "synchronized"; "absolute element" → "absolutely positioned";
   "ProMotion screens" → "ProMotion displays" (el nombre de Apple);
   "first-level filters" → "top-level sections"; "React never renders a
   frame" → "React does not render" (React no renderiza cuadros); y la
   frase "one value drives the whole transition", que estaba dos veces,
   quedó sólo en Performance.

   SEGUNDA PASADA DE `better-writing`, sobre las TRES secciones (pedido
   del usuario, 2026-09-08: "fijate que todo cumpla /better-writing").
   La regla que las encontró es "one voice, flexible tone": un solo
   nombre por cosa en toda la página. Tres cambios, y todos son de
   consistencia, no de gusto:
   · "the bar" → "the row" (Performance, dos veces). La fila se llamaba
     "row" en Anatomy y en Use cases, y "bar" sólo acá — era el nombre
     interno del archivo (`barra.tsx`) filtrándose al texto público.
   · "the chosen tab doesn't fit" → "the active tab does not fit"
     (Anatomy). Dos cosas: "chosen" y "active" eran la misma cosa con
     dos nombres en el mismo párrafo ("it becomes the active one"), y
     "doesn't" era la ÚNICA contracción de la página, contra "does not
     render", "is not a flex row", "must not rebuild".
   · "its offset is read" → "the scroll offset is read" (Performance).
     El "its" más cercano apuntaba a "deceleration", no al scroll view.
   REVISADO Y NO CAMBIADO: "however far away the tab is" (Anatomy § 2) y
   "however far the tab is" (§ 3) se repiten a dos párrafos. El eco es
   real, pero las dos cláusulas dicen cosas distintas —el contenido
   cruza UNA página cualquiera sea la distancia; y el arrastre
   interrumpe el toque también cuando el tab está lejos, que es lo que
   se ganó al sacar el bloqueo del pager— y borrar cualquiera de las
   dos pierde una afirmación que costó un cambio de código.
   Y EN USE CASES: "people" para quien usa la app del lector (es lo que
   usa la HIG, y acá el lector es quien construye) y "you" sólo cuando
   se le habla a él ("Use them when…"); la primera oración esquiva las
   dos ("what happens in one"). Anatomy sigue con "you" porque ahí el
   lector ES quien toca la pieza del video.

   PASADA DE CONCISIÓN, 2026-09-08 ("ya teniendo todo, usando buenas
   prácticas, dejá todo mucho más conciso"). 703 → 583 palabras, 17 %
   menos, MISMAS doce párrafos y MISMAS afirmaciones: es la regla de
   `better-writing` "delete every word that does no work", aplicada
   palabra por palabra, no recorte de contenido. Lo que se cortó, por
   tipo:
   · REDUNDANCIA INTERNA. "one value that describes the whole
     transition […] It is one derived value" decía lo mismo dos veces:
     ahora "one derived value" y basta. "not the JavaScript thread […]
     is involved at two moments only […] Never per frame" eran tres
     formas de una idea: quedó una. "always agree, and the row moves as
     one object" también: quedó "move as one object", que es la frase
     de better-ui que el usuario aprobó.
   · REDUNDANCIA ENTRE SECCIONES. "the row scrolls only when a tab does
     not fit" estaba en Anatomy Y en Use cases; queda en Anatomy. Y
     "however far the tab is" estaba en dos párrafos de Anatomy; queda
     en el que lo necesita, el del contenido que cruza una sola página.
     El otro era el del arrastre que interrumpe, y "at any point" ya lo
     dice sin la distancia.
   · PERÍFRASIS POR EL VERBO. "Tap a tab and it becomes the active one"
     → "A tap makes a tab active". "When one did, the recording showed
     the first frame after a tap standing still" → "Unmemoized, the
     first frame after a tap stood still". "several lists of equal
     standing" → "several peer lists" ("peers, not a hierarchy" es el
     término de animate-expo, y engancha con la jerarquía del párrafo
     siguiente). "so the drag and its deceleration run natively" → "the
     system runs the drag and its deceleration", que además dice QUIÉN.
   · LO QUE SE PERDIÓ A PROPÓSITO, y hay que saberlo: el cierre de
     Anatomy decía "from four recordings at 60 fps" y ahora dice sólo
     "at 60 fps". El número se fue con el recorte y está bien que se
     haya ido: el registro dice el clip del vault Y DESPUÉS cuatro
     grabaciones del usuario, o sea cinco, así que "four" contaba de
     menos (hallazgo del 2026-09-08, ver README).
   LO QUE SIGUE SIENDO CANDIDATO A CORTE, si algún día se pide otra
   vuelta: "Every value is a named constant with its source" es la
   única oración de Anatomy que habla del código fuente y no de lo que
   se ve. Está porque el usuario pidió las reglas de interface-craft en
   el texto; sale el día que eso cambie.

   SIN RAYA, NI EM DASH NI EN DASH, EN EL TEXTO PÚBLICO. Pedido del
   usuario, 2026-09-08: "no uses –". La pasada de concisión había
   metido dos, las dos en Performance, y las dos salieron sin perder
   nada: "React does not render during a gesture or a tap — the
   JavaScript thread…" se partió en dos oraciones, que es más llano y
   más corto; y "stood still — a whole frame lost" pasa a dos puntos,
   que es el signo que ya hace ese trabajo en los otros once párrafos.
   Los guiones de palabra compuesta se quedan: ease-out, ease-in,
   six-page, top-level. La regla vale para el texto público, no para
   estos comentarios, donde la raya es puntuación normal del español.
   Está en AGENTS.md › Cómo se escriben la línea y las notas. */
export default function Notas() {
  return (
    <>
      <Seccion titulo="Anatomy">
        <p>
          React Native, with Expo. The content is a paged scroll view, one page per tab; above it,
          a row of labels with an underline. The underline is bound to the content: it follows a
          drag and its deceleration, and a tap moves both on one timing.
        </p>
        <p>
          A tap makes a tab active in 300 ms: it widens for its symbol, the other labels move
          aside, and the content crosses one page, however far the tab is. The row moves on its own
          only when the active tab does not fit. A light haptic marks each change.
        </p>
        <p>
          Only transform, opacity and the label color animate. The one animated width, the
          underline, is absolutely positioned with no children, so no other layout runs. A drag
          interrupts a tap at any point. The curve is an ease-out, never an ease-in.
        </p>
        <p>
          The haptic fires in the frame the tab changes, once per change, never as the only
          feedback. Reduced motion is respected, and 120 fps is enabled on ProMotion displays.
          Every value is a named constant with its source.
        </p>
        <p>
          The reference is the home tabs of X on iOS, measured frame by frame at 60 fps.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Everything that moves is computed on the UI thread. The content is a native scroll view:
          the system runs the drag and its deceleration, and the scroll offset and every style
          derived from it are computed frame by frame. React does not render during a gesture or a
          tap. The JavaScript thread takes part only at the tap and at the haptic.
        </p>
        <p>
          No layout runs for the tabs while the content moves. The row is not a flex row: every
          tab’s position and width in each resting state are computed once, after the labels are
          measured, and each frame interpolates between two of them with a transform. All six
          pages are mounted and memoized, so a swipe never mounts a list and no render rebuilds
          six lists of twelve rows. Unmemoized, the first frame after a tap stood still: a whole
          frame lost.
        </p>
        <p>
          The row reads one derived value: where the transition starts, where it ends and how far
          along it is. No style can read part of it from the previous frame, so the underline, the
          labels and the symbols move as one object. Measured on the phone: 60 fps through every
          gesture. A trace of the symbols across a six-page sweep, 492 frames, shows no flicker.
        </p>
      </Seccion>

      <Seccion titulo="Use cases">
        <p>
          Swipeable tabs fit one screen whose content splits into closely related lists that do
          not affect each other. Use them when there are more lists than a segmented control
          should hold and people switch often enough that a swipe must work as well as a tap. X’s
          home is the model: two feeds and four topics in one row.
        </p>
        <p>
          The same shape fits any section of an app that holds several peer lists: a profile with
          posts, replies and media; a chat list with folders; a catalog by category; scores by
          league; an agenda by day.
        </p>
        <p>
          A hierarchy needs a back button, not a row of tabs. About five lists or fewer belong in
          a segmented control; the top-level sections of an app belong in the tab bar at the
          bottom. Both ask for short labels, and so do these: the active tab widens for its
          symbol.
        </p>
      </Seccion>
    </>
  )
}
