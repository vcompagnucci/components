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
   de josh". */
export default function Notas() {
  return (
    <>
      <Seccion titulo="What it does">
        <p>
          Swipe between feeds and the underline moves with your finger, not after it. Tap a tab and
          the content slides one page, never four. Scroll down and the whole header folds up with
          you, then comes back the same way.
        </p>
      </Seccion>

      <Seccion titulo="Anatomy">
        <p>
          The bar: six tabs in a row that scrolls only when it has to. The underline: a 2 pt line
          that stretches between two tabs while the page is in between them. The header: avatar and
          logo above the bar, folding with the scroll. The pages: one paged list per tab.
        </p>
      </Seccion>

      <Seccion titulo="Where the numbers come from">
        <p>
          From X, not from memory. Four screen recordings at 60 fps, read frame by frame: the six
          rest positions of the bar, the 300 ms ease-out of a tap, the fold that travels exactly as
          far as you scroll. Every number sits next to its receipt in the code.
        </p>
      </Seccion>

      <Seccion titulo="Two things I changed on purpose">
        <p>
          The row only moves when the tab you’re going to doesn’t fit on screen. X re-centers on
          every change; this one stays put when it can. And the header stops with its divider under
          the status bar instead of leaving the screen. Both are one word away from faithful.
        </p>
      </Seccion>

      <Seccion titulo="A note on the recording">
        <p>
          The simulator only writes frames while something moves. Normalize to a fixed rate before
          you step through it, or you’ll spend an afternoon on a stutter that was never on screen.
        </p>
      </Seccion>

      <Seccion titulo="Try it in the hand">
        <p>
          The simulator can’t tap, and it has no haptics and no 120 Hz. The tap, the tick when the
          tab changes and the feel of the drag are proven on a phone.
        </p>
      </Seccion>
    </>
  )
}
