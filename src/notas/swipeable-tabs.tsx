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
   prosa corrida de oraciones cortas que nombra cada parte al pasar
   ("One <canvas>, one requestAnimationFrame loop. When a new value
   arrives, nothing jumps."). La versión anterior de estas notas era un
   ensayo: el usuario pidió "bien simple y conciso, tal cual el tono de
   josh".

   TRES SECCIONES, NO MÁS: "Anatomy" (de qué está hecha la animación y
   de qué partes), "Performance" (por dónde corre y qué se midió) y,
   cuando la pieza lo pide, "Use cases". Es la regla para todas las
   notas (pedido del usuario, 2026-09-05: "mucho menos secciones"); las
   seis de la versión anterior eran demasiadas.

   ANATOMY HABLA SÓLO DE LA ANIMACIÓN QUE DA NOMBRE A LA PIEZA: los
   tabs. El header que colapsa, las listas y el avatar están en la
   grabación y en la línea de descripción, pero no acá ("en anatomy que
   se hable solo de la animación de los tabs, no de las otras cosas",
   2026-09-07). Y ACÁ SE NOMBRA LA REFERENCIA, no en la línea de
   descripción: la línea dice qué es la pieza sin nombrar la app, como
   el título; que salió de X se cuenta donde se cuenta el proceso, en
   el cierre sobre la medición ("en la descripción principal no pongas
   X's tabs, mencionalo explicando el proceso o en anatomy", mismo
   día). Es prosa, sin subtítulos: se probó un h3 por parte, la
   forma de josh en /bloom, y el usuario lo rechazó en la página ("no me
   gusta esta estructura", mismo día). Cada parte se nombra al pasar,
   y se dice primero qué es y después qué hace.

   LOS NOMBRES SON LOS TÉRMINOS TÉCNICOS —tab bar, underline, pager,
   label, symbol; "select", no "jump"—, por la regla de nombres del repo
   (AGENTS.md › Método de trabajo): la palabra que iría en una
   especificación, no la graciosa. */
export default function Notas() {
  return (
    <>
      <Seccion titulo="Anatomy">
        <p>
          Expo and Reanimated, nothing else. The tabs are a row of labels with an underline, over
          a paged ScrollView with one page per tab. The bar keeps no state: it draws the underline,
          the label colors and the symbols from one value the pager hands it, where the transition
          starts, where it ends and how far along it is.
        </p>
        <p>
          A drag is the native scroll, so the underline moves with the content and decelerates on
          iOS’s own curve. A tap animates the same value in 300 ms, and the content travels one
          page even when the tab you tapped is at the other end. As the underline travels, the tab
          it lands on grows to make room for a symbol, a chevron on the feeds and an icon on the
          topics, and the labels around it shift away. The row scrolls only when the next tab
          doesn’t fit, and a light haptic marks each change of tab.
        </p>
        <p>
          The reference is the home tabs of X on iOS. Every value is measured from there: four
          recordings at 60 fps, read frame by frame, each number next to its receipt in the code.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Everything runs on the UI thread: the underline, the labels and the header read the
          scroll in worklets, so React never renders a frame. The bar’s state is a single derived
          value that returns the whole thing at once, which is what keeps every frame in step.
          Measured: the recording keeps all its frames inside every gesture.
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
