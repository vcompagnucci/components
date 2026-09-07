import { Seccion } from '../notas'

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
   · Sólo transform y opacity; el único `width` animado es el
     subrayado, hijo absoluto sin hijos — la excepción que la regla
     permite (animate-expo § 4; barra.tsx, `estiloSubrayado`).
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
   · 60 fps sostenidos: completitud de cuadros 100.7 %, 101.1 % y
     100.2 % dentro de cada gesto en tres tomas (README § El video para
     X, tabla de mediciones).

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
   quedó sólo en Performance. */
export default function Notas() {
  return (
    <>
      <Seccion titulo="Anatomy">
        <p>
          React Native, with Expo. The content is a paged scroll view, one page per tab, and the
          tabs are a row of labels with an underline. The underline is bound to the content: it
          moves with it while you drag and settles with the same deceleration, and a tap moves
          both with the same timing.
        </p>
        <p>
          Tap a tab and it becomes the active one in 300 ms. It widens to make room for its symbol,
          the other labels move aside, and the content moves one page, however far away the tab
          is. The row scrolls only when the chosen tab doesn’t fit on screen. A light haptic marks
          each change of tab.
        </p>
        <p>
          Only transform and opacity animate. The one animated width, the underline, is absolutely
          positioned and has no children, so no other layout runs. A drag interrupts a tap at any
          point, however far the tab is. The curve is an ease-out, never an ease-in.
        </p>
        <p>
          The haptic fires in the frame the tab changes, once per change, and never as the only
          feedback. Reduced motion is respected, and 120 fps is enabled on ProMotion displays.
          Every value is a named constant with its source next to it.
        </p>
        <p>
          The reference is the home tabs of X on iOS, measured frame by frame from four recordings
          at 60 fps.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Everything that moves is computed on the UI thread, not in JavaScript. The scroll
          position is read there, and every style that depends on it is computed there, frame by
          frame, so React does not render during a gesture or a tap. JavaScript takes part at two
          moments only: the tap itself, and the haptic when the tab changes. Never per frame.
        </p>
        <p>
          No layout runs for the tabs while the content moves. The row is not a flex row: the
          position and width of every tab in every resting state are computed once, after the
          labels are measured, and each frame interpolates between two of those states. Each tab
          is absolutely positioned and moves with a transform. The pages are memoized, so a render
          elsewhere never rebuilds them: when a tap used to trigger one, the recording showed the
          first frame after it standing still, a whole frame lost.
        </p>
        <p>
          The bar reads one value that describes the whole transition: where it starts, where it
          ends and how far along it is. The underline, the labels and the symbols derive from it in
          the same frame, so they are always consistent with each other and the bar moves as one
          object. Measured: the recording holds 60 fps through every gesture, and a trace of the
          symbols across a six-page sweep, 492 frames, shows no flicker.
        </p>
      </Seccion>

      <Seccion titulo="Use cases">
        <p>
          Any list with more top-level sections than a segmented control can hold: a profile with
          posts, replies and media; a feed with its filters; chat folders; a catalog by category;
          scores by league; an agenda by day.
        </p>
      </Seccion>
    </>
  )
}
