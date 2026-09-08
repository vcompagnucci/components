import { Seccion } from '../notas'

/* Las notas de Hold to commit. Todo lo de acá está en el registro: el
   README (§ Hold to commit), `medidas.ts` y `receta.ts` de la pieza, y
   las mediciones de `.context/hold-to-commit/`. Si una frase deja de ser
   cierta, se corrige acá Y allá: el texto público no es un resumen
   libre, es la misma evidencia contada para alguien que llega de afuera.

   EL PROCEDIMIENTO ES EL DE AGENTS.md › Cómo se escriben la línea y las
   notas, el que fijó Swipeable tabs. Lo que sigue son los recibos de
   ESTA página, uno por decisión.

   SIN LÍNEA DE DESCRIPCIÓN. Es la primera regla: el título ya dice qué
   es el gesto. "Hold to commit" son catorce caracteres y nombra la
   acción; una línea abajo sólo la repetiría.

   EL TONO, leído servido el 2026-09-08, no de memoria. De josh puckett
   (joshpuckett.me /bloom, /pasito, /melt-effect) se toma la medida: 19
   párrafos de prosa suya dan mediana de 25 palabras y 2 oraciones, con
   oraciones de 12 palabras de promedio. Y la forma de abrir: la primera
   palabra del párrafo es el sujeto del hecho, nunca un anuncio de lo
   que sigue. La secuencia se escribe con "then", en orden, en una sola
   oración ("Automatically sizes to fit the trigger content, then
   animates to the menu dimensions"). De benji (benji.org, "How it
   works" de /liveline) se toma la prosa que va de lo que se siente al
   mecanismo sin volverse un changelog.

   PERSONA. Cero "I" y cero "we": en las dos páginas de referencia de
   josh (/pasito, /bloom) no hay ninguno, y el "we" aparece sólo en el
   tutorial. "You" es quien mantiene apretado el botón.

   UN SOLO NOMBRE POR COSA, en toda la página y no por sección, que es
   la falla que `better-writing` más encuentra acá. Las decisiones:
   "the fill" para el brillo que cruza (nunca "sweep" ni "glow"), "the
   label" para el texto, "haptic tick" para la háptica y "tap" SÓLO para
   el dedo. La primera versión decía "taps" para la háptica en Anatomy y
   "tick" en Performance, con "tap" ya ocupado en Use cases.

   ANATOMY HABLA SÓLO DEL BOTÓN. La ficha financiera que se ve detrás en
   el video (el gráfico, el selector de rango, las filas) es esqueleto y
   no entra: es lo mismo que se decidió con los tabs. La referencia se
   nombra en el cierre, junto con cómo se midió.

   LA RETIRADA SE CUENTA AUNQUE EL VIDEO NO LA MUESTRE. La grabación es
   un solo gesto de punta a punta desde el 2026-09-08 (Vito: "que en la
   grabación se ejecute todo de una, sacá esa parte del principio que se
   aprieta el botón y se corta en la mitad"), así que soltar antes ya no
   se ve. Sigue en el texto porque es la mitad del mecanismo: un botón
   que se puede abandonar es lo que hace que mantener apretado sea una
   confirmación y no una traba. Va escrita como propiedad del botón
   ("Let go early and…"), no como algo que el lector esté viendo.

   EL REINICIO NO LLEVA NÚMERO. En la pieza el botón vuelve solo al
   reposo a los 5 s, y eso es del taller, para poder probarlo seguido
   sin salir; en la grabación se adelanta a los 2 s porque tres segundos
   quietos en un video son tres segundos de nada. El mecanismo es el
   mismo y es lo único que se cuenta; el número está en el README, donde
   sí importa cuál es.

   LO QUE NO SE AFIRMA, Y POR QUÉ. No se dice que el hold mida un
   segundo con 4 ms de error, aunque la tabla del README lo tenga: esa
   medición sale de la sonda `auto`, que dispara `apretar` y `completar`
   con dos `setTimeout` de JavaScript (`boton.tsx`), así que mide la
   puntería de esos timers y no el reloj del reconocedor de gestos. Lo
   que sí se afirma es lo que la medición sí prueba: que el reconocedor
   y el relleno leen la misma constante (`HOLD.duracion`), y los cuadros
   perdidos. Y no se afirma NADA sobre un teléfono: la pieza nunca se
   midió en uno, y la sección lo dice con todas las letras.

   EL RELLENO NO LLEVA NÚMERO DE CAPAS. Son cuatro texturas en modo
   oscuro (`boton.tsx`: brillo, cuerpo, frente y velo) y dos en claro,
   donde el brillo de reposo y la punta velada no se dibujan. Un número
   que cambia con el tema del lector no puede ir en una oración sola, y
   lo que importa es el mecanismo: son imágenes hechas de antemano y
   avanzar es moverlas y escalarlas.

   LOS NÚMEROS, verificados contra el código el 2026-09-08: 46 puntos en
   la ráfaga (`medidas.ts`, PARTICULAS.cantidad); 36 chispas en 12
   vistas (CHISPAS.vistas 12 × vidasPorVista 3); 12 detentes hápticos
   (`haptica.ts`, DETENTES); el label empieza a oscurecerse al 55 % del
   recorrido (HOLD.tintaDesde); la retirada al soltar dura 400 ms
   (HOLD.retirada); el hold dura 1000 ms (HOLD.duracion). Los cuadros
   bajo carga y las latencias con el hilo bloqueado están en el README.

   USE CASES SIN CITAR A NADIE. Los conceptos y los números salen de la
   guía de interfaz de Apple, leída el 2026-09-08 por su API de
   documentación (developer.apple.com/tutorials/data/design/human-
   interface-guidelines/<slug>.json; la página HTML se arma con
   JavaScript y devuelve sólo el título). Entran como explicación y
   dichos en llano como propios, nunca como autoridad y sin nombrarla,
   que es la regla de AGENTS.md. Los tres que se usaron:
     · «Avoid displaying alerts for common, undoable actions, even when
       they're destructive. […] when people take an uncommon destructive
       action that they can't undo, it's important to display an alert»
       (feedback.json) → el primer párrafo y el tercero.
     · «Avoid displaying more than four buttons in an action sheet,
       including the Cancel button. […] aim to provide no more than
       three additional choices» (action-sheets.json) → "about three".
     · «Offer alternatives to gestures. […] offer onscreen ways to
       achieve the same outcome» (accessibility.json) → el cierre.

   SIN RAYA en el texto público, ni em dash ni en dash: donde salía una,
   son dos oraciones o son dos puntos. Los guiones de palabra compuesta
   se quedan. La regla es del texto público; en estos comentarios en
   castellano la raya es puntuación normal. */
export default function Notas() {
  return (
    <>
      <Seccion titulo="Anatomy">
        <p>
          React Native, with Expo. The button is a capsule with a label at its center. Touch and
          hold, and a white fill crosses it from left to right at a constant rate: the fill is the
          progress, not a bar beside it. The hold lasts one second.
        </p>
        <p>
          The press shrinks the button, the label blurs across to “Keep Holding...”, and the fill
          lights up as it starts to move. The label darkens with the fill and not on a clock of its
          own: white, then a greenish gray from 55% of the way, then black near the end. Sparks run
          ahead of the fill, and the fill absorbs them.
        </p>
        <p>
          At one second the button commits: it turns white, “✓ Order Placed” grows into place, and
          46 points burst from the perimeter. They open outward from the center rather than
          scattering, and fade as the label sharpens. Under the white, the fill finishes its run to
          the right end.
        </p>
        <p>
          Let go early and the fill retreats over 400 ms, dimming faster than it moves, and “Hold to
          Buy” comes back. Twelve haptic ticks mark the hold, closer together as it advances, and a
          success pattern lands with the burst. Only transform and opacity animate, the label color
          included. With reduced motion nothing sweeps, blurs or bursts and the button does not
          shrink: the fill arrives as opacity and the color stays.
        </p>
        <p>
          The reference is the hold button in Opal, the screen time app on iOS, measured frame by
          frame at 60 fps.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Everything that moves is computed on the UI thread, not the JavaScript thread. A native
          recognizer times the touch and hold, and it reads the same duration as the fill, so the
          two cannot drift apart. React renders nothing in the button during the hold, at the commit
          or at the reset. The JavaScript thread is asked for two things only: the haptic and the
          sound.
        </p>
        <p>
          The fill is built from images generated ahead of time: advancing it is a translate and a
          scale on them, never a redraw. The label crossfades between copies of the same words at
          a fixed blur, so no blur radius animates, only opacity. Its color change is the opacity of
          stacked copies, each in a fixed tint. The 46 points of the burst and the twelve views that
          carry the 36 sparks are mounted from the start and invisible, so the commit frame mounts
          nothing.
        </p>
        <p>
          Measured under a load that stands in for a real app: the JavaScript thread busy parsing
          JSON, the screen behind the button re-rendering ten times a second, the two together, and
          the thread blocked in 150 ms bursts. With both loads running, neither system drops a frame
          across the sequence; with the thread blocked, iOS still drops none and Android drops one
          of 416. The numbers come from the iOS Simulator on a development bundle and an Android
          emulator on a production build, not from a phone: in development that emulator drops 47
          frames of 372 with no load.
        </p>
        <p>
          What waits is what crosses to the JavaScript thread. With the thread blocked, the first
          haptic tick arrives 66 to 92 ms late and the sound 50 ms, while the fill keeps its timing.
          No plausible load delays either by more than 12 ms, and moving them off that thread would
          take a native module. The reset was a JavaScript timer too and arrived late whenever the
          thread was busy; on the same clock as the fill it now arrives on time with the thread
          blocked.
        </p>
      </Seccion>

      <Seccion titulo="Use cases">
        <p>
          A hold fits an uncommon action that cannot be undone and would be too easy to start by
          accident. The confirmation happens inside the button: no separate surface and no extra
          tap. One second of holding is the whole cost, and the fill shows how much is left. Letting
          go before the end places no order.
        </p>
        <p>
          The same shape fits any action that a single tap should not finish: sending a payment;
          closing an account; deleting a project and everything in it; wiping a device.
        </p>
        <p>
          A common action that can be undone needs no confirmation at all: a plain button, a single
          tap, and a way to undo it. A choice among several actions belongs in an action sheet,
          which holds about three of them and a way out. Holding a control usually reveals more
          controls, so the label names the hold. And a hold cannot be the only path: someone who
          cannot press and wait needs another way to the same outcome.
        </p>
      </Seccion>
    </>
  )
}
