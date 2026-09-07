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
   donde se cuenta cómo se midió.

   SE DICE "REACT NATIVE", NO EL NOMBRE DE UNA LIBRERÍA. Ni Reanimated
   ni worklets: "no se suele decir eso" (usuario, 2026-09-07), y quien
   lee no tiene por qué conocerlos. Lo que esas palabras querían decir
   se dice en llano: la animación corre en el hilo de UI, no en
   JavaScript. Las únicas marcas que quedan son las que el lector
   reconoce: React Native, Expo, SF Symbols, iOS.

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
          The symbols are SF Symbols, all but the Stocks chip, and the haptic is Expo’s. The
          reference is the home tabs of X on iOS, measured from four recordings at 60 fps, frame by
          frame; every number in the code sits next to where it came from.
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
