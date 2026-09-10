import { Seccion } from '../../../notas'

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
   label" para el texto, "haptic detents" para la háptica, "checkmark"
   para el glifo y "tap" SÓLO para el dedo. La primera versión decía
   "taps" para la háptica en Anatomy y "tick" en Performance, con "tap"
   ya ocupado en Use cases. Y "tick" tuvo que salir del todo cuando
   entró el tilde al texto: en inglés un tilde ES un tick, así que la
   misma palabra nombraba el glifo y el pulso háptico. "Detent" —un tope
   mecánico que se siente— es además el nombre que el código ya usaba
   (`DETENTES` en `haptica.ts`).

   ANATOMY HABLA SÓLO DEL BOTÓN. La ficha financiera que se ve detrás en
   el video (el gráfico, el selector de rango, las filas) es esqueleto y
   no entra: es lo mismo que se decidió con los tabs. La referencia se
   nombra en el cierre, junto con cómo se midió.

   MUCHO MÁS CORTA (2026-09-08, "hacela muchísima más corta, y fiel al
   código"). De 750 palabras y 12 párrafos a 396 y 9: un 47 %, en dos
   pasadas y sumando tres hechos nuevos en el medio (el borde, el
   centrado óptico y el teléfono). Lo que se fue: el párrafo del reinicio (es del taller, no de la pieza), el que
   contaba cómo está hecho el relleno y el label (implementación, y la
   regla del repo es escribir desde lo que se ve), el de la latencia de
   la háptica desmenuzada, y la lista de acciones de ejemplo de Use
   cases. Ninguna afirmación se tocó: se borraron enteras las que
   sobraban.

   LO QUE SE MENCIONA DE LOS SKILLS, Y LO QUE NO. Entra sólo lo que un
   lector puede VER o sentir en la pieza, con su recibo:
     · `animate-expo`: corre en el hilo de UI y no en el de JavaScript
       (`boton.tsx`, todo el gesto en worklets); sólo transform y opacity
       (el color del label es opacidad de tandas apiladas,
       `etiqueta.tsx`); reduce motion (`useReducedMotion`); la háptica
       nunca es el único feedback (`haptica.ts` + el relleno); el texto
       sigue a Dynamic Type (`TEXTO.escalaMaxima`); el reconocedor y el
       relleno leen la MISMA constante (`HOLD.duracion`).
     · `better-ui`: interrumpible (volver a apretar durante la retirada
       retoma desde donde está, `boton.tsx:apretar`); alineación óptica
       ("the checkmark and the words are centered by eye, not by box",
       la corrección medida de −6.6 pt, `LABEL.correccionOptica` en
       `medidas.ts`); y sombras para
       elevación en vez de un borde que sólo daba profundidad, que es
       también lo que contesta la lente de crítica de `interface-craft`
       ("do outlines add structure or noise?").
   LA FRASE DE LA SOMBRA ES CONDICIONAL a propósito: "lifted by a shadow
   on light backgrounds". Una sombra negra sobre el fondo negro del modo
   oscuro no se ve, así que decir que la sombra lleva el borde sería
   falso en la mitad de los casos.
   NO entra lo que es craft del código y el lector no puede comprobar:
   el storyboard, la etapa única, los tiempos con nombre en un solo
   lugar y el data-driven de `interface-craft` son sobre la fuente, no
   sobre la pieza.

   LA RETIRADA SE CUENTA AUNQUE EL VIDEO NO LA MUESTRE. La grabación es
   un solo gesto de punta a punta desde el 2026-09-08 (Vito: "que en la
   grabación se ejecute todo de una, sacá esa parte del principio que se
   aprieta el botón y se corta en la mitad"), así que soltar antes ya no
   se ve. Sigue en el texto porque es la mitad del mecanismo: un botón
   que se puede abandonar es lo que hace que mantener apretado sea una
   confirmación y no una traba. Va escrita como propiedad del botón
   ("Let go early and…"), no como algo que el lector esté viendo.

   LO QUE NO SE AFIRMA, Y POR QUÉ. No se dice que el hold mida un
   segundo con 4 ms de error, aunque la tabla del README lo tenga: esa
   medición sale de la sonda `auto`, que dispara `apretar` y `completar`
   con dos `setTimeout` de JavaScript (`boton.tsx`), así que mide la
   puntería de esos timers y no el reloj del reconocedor de gestos. Lo
   que sí se afirma es lo que la medición sí prueba: que el reconocedor
   y el relleno leen la misma constante (`HOLD.duracion`), y los cuadros
   perdidos.

   EL TELÉFONO ENTRA COMO PRUEBA, NO COMO MEDICIÓN (2026-09-09, Vito:
   "ya testeado en celular real"). La frase es "Measured on the iOS
   Simulator and an Android emulator, and tested on a phone, where the
   haptic can be felt", y los dos verbos son distintos a propósito: los
   NÚMEROS de esa sección siguen saliendo del simulador y del emulador,
   que es de donde salieron, y del teléfono sale lo único que sólo se
   puede saber ahí. El simulador no vibra —lo dice el encabezado de
   `haptica.ts`, y por eso toda esa pista está marcada SIN RECIBO—, así
   que la háptica es la parte de la pieza que no se puede juzgar de otra
   manera. Lo que NO se escribe es un cuadro por segundo ni una latencia
   medidos en un teléfono: esos no existen.

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
   que es la regla de AGENTS.md. Los dos que quedaron en el texto corto:
     · «Avoid displaying alerts for common, undoable actions, even when
       they're destructive. […] when people take an uncommon destructive
       action that they can't undo, it's important to display an alert»
       (feedback.json) → el primer párrafo y el tercero.
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
          hold, and a white fill crosses it at a constant rate: the fill is the progress, not a bar
          beside it. The hold lasts one second.
        </p>
        <p>
          The press shrinks the button and the label blurs across to “Keep Holding...”. The label
          darkens as the fill passes under it. Let go early and the fill retreats and
          “Hold to Buy” returns; press again and it continues from where it stopped.
        </p>
        <p>
          At one second the button commits: it turns white, “✓ Order Placed” grows into place, and 46
          points burst from the perimeter. The checkmark and the words are centered by eye, not by box. Twelve haptic detents mark the hold, closer together as it
          advances; a success pattern lands with the burst.
        </p>
        <p>
          The capsule has no outline: its edge is its own shape, lifted by a shadow on light
          backgrounds. Only transform and opacity animate, the label color included, and the label
          follows the system text size. With reduced motion the fill arrives as opacity and nothing
          crosses or bursts. The haptic is never the only feedback: the fill says the same thing.
        </p>
        <p>
          The reference is the hold button in Opal, the screen time app on iOS, measured frame by
          frame at 60 fps.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Everything that moves is computed on the UI thread, not the JavaScript thread. A native
          recognizer times the hold and reads the same duration as the fill, so they cannot drift
          apart. React renders nothing while it runs.
        </p>
        <p>
          Under a load that stands in for a real app, the fill keeps its timing whether the
          JavaScript thread is busy, re-rendering, or blocked. What waits is what has to reach that
          thread, the haptic and the sound. Measured on the iOS Simulator and an Android emulator,
          and tested on a phone, where the haptic can be felt.
        </p>
      </Seccion>

      <Seccion titulo="Use cases">
        <p>
          A hold fits an uncommon action that cannot be undone and would be too easy to start by
          accident. The confirmation happens inside the button: no separate surface and no extra
          tap. Letting go before the end places no order.
        </p>
        <p>
          A common action that can be undone needs no confirmation: a plain button and a way to undo
          it. And a hold cannot be the only path: someone who cannot press and wait needs another
          way to the same outcome.
        </p>
      </Seccion>
    </>
  )
}
