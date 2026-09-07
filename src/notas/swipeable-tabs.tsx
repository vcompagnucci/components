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
   REFERENCIA, no en la línea de descripción: que salió de X se cuenta
   donde se cuenta cómo se midió. NO SE DICE DE DÓNDE SON LOS SÍMBOLOS
   ni la háptica (pedido del usuario, 2026-09-07).

   SE DICE "REACT NATIVE", NO EL NOMBRE DE UNA LIBRERÍA. Ni Reanimated
   ni worklets: "no se suele decir eso" (usuario, 2026-09-07), y quien
   lee no tiene por qué conocerlos. Lo que esas palabras querían decir
   se dice en llano: la animación corre en el hilo de UI, no en
   JavaScript. Las únicas marcas que quedan son las que el lector
   reconoce: React Native, Expo, iOS.

   LAS REGLAS QUE ENUMERA EL TERCER PÁRRAFO son las de los skills
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
   · El gesto interrumpe la animación: `onBeginDrag` cancela el toque
     en vuelo (animate-expo, "interruptibility is the baseline";
     tabs-deslizables.tsx, `alScrollear`).
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

   LOS NOMBRES SON LOS TÉRMINOS TÉCNICOS —tab, underline, label,
   symbol, page; "select", no "jump"—, por la regla de nombres del repo
   (AGENTS.md › Método de trabajo): la palabra que iría en una
   especificación, no la graciosa. */
export default function Notas() {
  return (
    <>
      <Seccion titulo="Anatomy">
        <p>
          React Native, with Expo. The content is a paged scroll view, one page per tab, and the
          tabs are a row of labels with an underline. The underline is tied to the scroll: it moves
          with the content while you drag and settles with the same deceleration, so it never runs
          ahead or lags behind.
        </p>
        <p>
          Tap a tab and it becomes the active one in 300 ms. It widens to make room for its symbol,
          the other labels shift away, and the content crosses one page even if the tab was four
          away. The row itself scrolls only when the tab you chose doesn’t fit on screen. A light
          haptic marks each change of tab.
        </p>
        <p>
          Only transform and opacity animate; the one animated width, the underline, is an
          absolute element with no children, so nothing else is laid out. A drag interrupts a tap
          mid-flight. The curve is an ease-out, never an ease-in. One haptic per action, in the
          frame the active tab changes, and never the only cue. Reduced motion is respected, and
          120 fps is enabled on ProMotion screens. Every value is a named constant with its source
          beside it, and one value drives the whole transition.
        </p>
        <p>
          The reference is the home tabs of X on iOS, measured from four recordings at 60 fps,
          frame by frame.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Everything that moves is computed on the UI thread, not in JavaScript, so React never
          renders a frame during a gesture. The bar reads one value that describes the whole
          transition at once, which is what keeps the underline, the labels and the symbols in step.
          Measured: the recording keeps every frame inside every gesture.
        </p>
      </Seccion>

      <Seccion titulo="Use cases">
        <p>
          Any list with more first-level filters than a segmented control can hold: a profile with
          posts, replies and media; a feed with its filters; chat folders; a catalog by category;
          scores by league; an agenda by day.
        </p>
      </Seccion>
    </>
  )
}
