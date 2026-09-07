import { Parte, Seccion } from '../notas'

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
   oraciones por sección, verbos directos, "you" cuando te habla. Benji
   escribe ensayos largos por principios; de él se toma sólo el pie de
   un renglón bajo cada demo. La versión anterior de estas notas era
   un ensayo: el usuario pidió "bien simple y conciso, tal cual el tono
   de josh".

   TRES SECCIONES, NO MÁS: "Anatomy" (con qué está hecha y de qué
   partes), "Performance" (por dónde corre y qué se midió) y, cuando la
   pieza lo pide, "Use cases". Es la regla para todas las notas (pedido
   del usuario, 2026-09-05: "mucho menos secciones"); las seis de la
   versión anterior eran demasiadas.

   LA ANATOMÍA VA EN PARTES CON NOMBRE, como josh desarma Bloom
   (/bloom › API Reference, medido 2026-09-07): el nombre de la parte y
   debajo qué es y qué hace, en dos o tres oraciones —"The morphing
   element. Automatically sizes to fit the trigger content, then
   animates to the menu dimensions". Benji hace lo mismo en prosa en
   /drawesome: nombra las herramientas y después cuenta qué hace cada
   una. El párrafo único anterior mezclaba las cuatro partes en seis
   oraciones y el usuario pidió explicarlo "como lo haría benji o josh,
   bien simple" (2026-09-07). Las partes van de arriba a abajo en la
   pantalla, y cada una dice primero qué es y después qué hace.

   LOS NOMBRES SON LOS TÉRMINOS TÉCNICOS —Header, Tab bar, Pager, Page;
   "collapses", no "folds away"—, por la regla de nombres del repo
   (AGENTS.md › Método de trabajo): la palabra que iría en una
   especificación, no la graciosa. */
export default function Notas() {
  return (
    <>
      <Seccion titulo="Anatomy">
        <p>Expo and Reanimated, nothing else. Four parts, top to bottom.</p>

        <Parte nombre="Header">
          The strip above the tabs, with the avatar. It forms one block with the status bar, the
          tab bar and the divider, and the block moves as a unit.
        </Parte>

        <Parte nombre="Tab bar">
          The labels, the underline and a fade at each end. It keeps no state: everything it draws
          comes from one value the pager hands it, where the transition starts, where it ends and
          how far along it is. The active tab grows to make room for a symbol, a chevron on the
          feeds and an icon on the topics. The row itself scrolls only when the tab you’re going to
          doesn’t fit.
        </Parte>

        <Parte nombre="Pager">
          A paged ScrollView, one page per tab. A drag is the native scroll, so the underline
          decelerates on iOS’s own curve. A tap animates the same value in 300 ms, and the content
          travels one page even when the tab you tapped is at the other end. A light haptic marks
          each change of tab.
        </Parte>

        <Parte nombre="Page">
          One list per tab, and each reports its scroll. That’s what collapses the header: the
          block moves up exactly as far as the content did, until its divider meets the status
          bar, and what’s drawn on it fades on the way. Scroll back and it returns the same way.
        </Parte>

        <p>
          Every value is measured from X: four recordings at 60 fps, read frame by frame, each
          number next to its receipt in the code.
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
