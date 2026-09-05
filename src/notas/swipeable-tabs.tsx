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
   oraciones por sección, verbos directos, "you" cuando te habla, y
   una parte por oración cuando desarma el componente ("The morphing
   element. Automatically sizes to fit the trigger content"). Benji
   escribe ensayos largos por principios; de él se toma sólo el pie de
   un renglón bajo cada demo. La versión anterior de estas notas era
   un ensayo: el usuario pidió "bien simple y conciso, tal cual el tono
   de josh".

   TRES SECCIONES, NO MÁS: "Anatomy" (con qué está hecha y de qué
   partes), "Performance" (por dónde corre y qué se midió) y, cuando la
   pieza lo pide, "Use cases". Es la regla para todas las notas (pedido
   del usuario, 2026-09-05: "mucho menos secciones"); las seis de la
   versión anterior eran demasiadas. */
export default function Notas() {
  return (
    <>
      <Seccion titulo="Anatomy">
        <p>
          Expo and Reanimated, nothing else. The pager is a paged ScrollView, one list per tab. The
          bar reads the pager’s offset in a worklet and draws the underline and the label weights
          from it; a tap moves the content one page, never four. The header is one block that
          translates with the scroll and fades on the way up. Every value is measured from X: four
          recordings at 60 fps, read frame by frame, each number next to its receipt in the code.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Everything runs on the UI thread: the underline, the labels and the fold read the scroll
          in worklets, so React never renders a frame. The bar’s state is a single derived value
          that returns the whole thing at once, which is what keeps every frame in step. Measured:
          the recording keeps all its frames inside every gesture, and the row only moves when the
          tab you’re going to doesn’t fit on screen.
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
