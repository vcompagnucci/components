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
   método. El "you" para el lector se queda: es suyo también. */
export default function Notas() {
  return (
    <>
      <Seccion titulo="Where the numbers came from">
        <p>
          I didn’t start from a memory of how X feels. I started from X: one clip in the vault, and
          then four screen recordings taken on a real phone, at 1320×2868 and 60 fps, read frame by
          frame with ffmpeg instead of by eye.
        </p>
        <p>
          That’s where the values live. Six rest positions for the bar, each to a tenth of a point.
          The rule that leans the row as your finger drags it. The tap: an ease-out cubic over 300
          milliseconds, fit against three separate taps rather than picked because it looked close.
          The header fold, where the block travels with the scroll to the tenth and the fade runs
          linear. Both palettes, dark and light, measured the same way.
        </p>
        <p>
          Every one of those carries its receipt in the piece, next to the number. A value without a
          source is a value the next person will change without knowing what it breaks.
        </p>
      </Seccion>

      <Seccion titulo="Where I left the reference">
        <p>Twice, on purpose — and both are one word away from being faithful again.</p>
        <p>
          The row of tabs only shifts when the tab you’re heading for doesn’t fit on screen. X
          re-centers on every change, which means the row moves even when your destination is
          already sitting in front of you. I kept the quieter one.
        </p>
        <p>
          And the block above the tabs stops with its divider resting against the status bar,
          instead of clearing the screen entirely. I tried both on the phone before keeping them.
          The two I rejected — fading the block out as a whole, and letting the fold run its full
          travel — are written down above the code, so nobody spends an evening rediscovering them.
        </p>
      </Seccion>

      <Seccion titulo="The frame that lied">
        <p>
          Every icon lit up completely one frame before it started to fade. Six tabs, every swipe,
          the same tell: 0.000 to 1.000, then back to 0.008.
        </p>
        <p>
          Reanimated sorts its mappers topologically, but it builds the graph from the outputs a
          mapper declares — and an animated reaction declares none. So nothing guarantees that a
          reaction runs before whoever reads what it writes. Two values that had to be true at the
          same instant — the endpoints of the crossing, and the progress between them — went out of
          step for exactly one frame: new endpoints, old progress, saturated at 1.
        </p>
        <p>
          The fix isn’t to reorder anything. It’s a single derived value that returns the whole
          object at once. If two numbers have to be true at the same time, they aren’t two numbers.
        </p>
      </Seccion>

      <Seccion titulo="What the recording couldn’t show">
        <p>
          None of that is visible in a screen recording, no matter how slowly you step through it. I
          found it by printing, from inside the mapper that paints the style, the value being
          painted on each frame.
        </p>
        <p>
          The recording will also lie to you if you let it. The simulator writes video at a variable
          frame rate — sixty a second while something moves, none at all while the screen sits
          still. Normalize it to a fixed rate before you start stepping and you’ve invented frames,
          then you spend the afternoon chasing a stutter that was never on the screen.
        </p>
      </Seccion>

      <Seccion titulo="Testing it in the hand">
        <p>
          The simulator can’t receive a tap, so I prove the tap path on the phone — which is also
          the only place with haptics and a 120 Hz screen, and those are two of the three things
          this piece is about.
        </p>
        <p>
          My probes are one state per reload, never a timeline of timers: a timer that fires while
          you’re still reading the last one tells you nothing. And when something feels abrupt,
          that’s a knob, not a rebuild. I changed the geometry once, early. It was worse.
        </p>
      </Seccion>
    </>
  )
}
