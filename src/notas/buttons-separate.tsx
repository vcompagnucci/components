import { Seccion } from '../notas'

/* Las notas de Buttons separate. Todo lo de acá está en el registro: el
   README (§ Buttons separate), el encabezado de `src/piezas/buttons-
   separate.tsx` y la tabla de `.context/buttons-separate/MEDICION.md`
   con los scripts que la reproducen. Si una frase deja de ser cierta se
   corrige acá Y allá: el texto público no es un resumen libre, es la
   misma evidencia contada para alguien que llega de afuera.

   EL PROCEDIMIENTO ES EL DE AGENTS.md › Cómo se escriben la línea y las
   notas, el que fijó Swipeable tabs. Lo que sigue son los recibos de
   ESTA página, uno por decisión.

   SIN LÍNEA DE DESCRIPCIÓN. Es la primera regla: el título ya dice cuál
   es el gesto. Una línea abajo sólo lo repetiría.

   EL TONO, leído servido el 2026-09-09 y no de memoria. De josh puckett
   (joshpuckett.me/bloom) se toma la forma de abrir: la primera palabra
   del párrafo es el sujeto del hecho, y una secuencia se escribe con
   "then", en orden, en una sola oración ("Automatically sizes to fit the
   trigger content, then animates to the menu dimensions"). De benji
   (benji.org/liveline) se toma la prosa que va de lo que se siente al
   mecanismo sin volverse un changelog ("It updates at 60fps through
   direct DOM manipulation, not React re-renders").

   PERSONA. Cero "I" y cero "we", como las dos páginas de referencia.
   "You" es quien mueve el puntero. Y cero contracciones en toda la
   página: la falla que `better-writing` encontró en Swipeable tabs fue
   justamente una contracción suelta en once párrafos.

   UN SOLO NOMBRE POR COSA, en toda la página y no por sección: "the
   field" para el campo (nunca "bar", "input" ni "search box"), "the
   buttons" para los cuatro (nunca "circles" ni "pills"), "one shape"
   para el estado cerrado, "the spacing" para lo que se abre, "the
   glass" para el material y "the pointer" para el puntero. "The group"
   es el conjunto de los cinco, y se usa igual en Anatomy y en Use
   cases.

   ANATOMY HABLA SÓLO DE LA SEPARACIÓN. El campo, la lupa y el fondo
   están para que la separación tenga dónde pasar; el que se describe es
   el gesto que da nombre a la pieza. La referencia se nombra en el
   cierre, junto con cómo se midió.

   LOS NÚMEROS, verificados contra el código y contra la medición:
     · 365 ms y 532 ms son las duraciones de los dos resortes en la
       parametrización de Apple (ω = 2π/duración), ajustadas por mínimos
       cuadrados sobre la grabación con 1.57 y 1.42 pt de error en 64
       cuadros. Están en `CAMPO` y `ABANICO`.
     · 42 ms es el retraso entre los dos, medido. Está en `RETRASO`.
     · 62 cuadros, mediana 16.7 ms, ninguno arriba de 20: medido en
       Chrome con el procesador cuatro veces más lento y dos copias de
       la pieza en la página, el 2026-09-09.

   LO QUE NO SE AFIRMA. No se dice cuánto tarda todo en asentarse:
   el conjunto se queda quieto alrededor de los 730 ms, pero ese número
   sale de mirar dónde la traza deja de moverse y no de un umbral
   definido, así que no entra al texto. Tampoco se dice que la pieza
   siga la grabación con tal error: la comparación dio 1.7 px de error
   cuadrático medio y 7.7 px de máximo sobre el primer segundo, y un
   solo número de esos leído solo miente en una dirección o en la otra.
   Lo que sí se afirma es que se midió contra ella.

   NO SE NOMBRA NINGUNA GUÍA. Los conceptos del material —una capa de
   controles que flota sobre el contenido y lo deja pasar desenfocado—
   salen de la guía de interfaz de Apple, leída el 2026-09-09 por su API
   de documentación (developer.apple.com/tutorials/data/design/human-
   interface-guidelines/materials.json). Entran como explicación y
   dichos en llano como propios, que es la regla de AGENTS.md. Sí se
   nombra la REFERENCIA, que es otra cosa: Spotlight de macOS Tahoe, como
   Hold to commit nombra a Opal.

   SIN RAYA en el texto público, ni em dash ni en dash. Los guiones de
   palabra compuesta se quedan. La regla es del texto público; en estos
   comentarios en castellano la raya es puntuación normal. */
export default function Notas() {
  return (
    <>
      <Seccion titulo="Anatomy">
        <p>
          A search field, and beside it a single shape of glass. Bring the pointer over the group
          and the shape opens into four round buttons; take the pointer away and the four close
          back into one.
        </p>
        <p>
          The field carries the opening. It shortens from the full width of the group down to its
          own, then the four buttons fan out from where the first one sits. The first button never
          moves: what opens is the spacing.
        </p>
        <p>
          Two springs run it, not one. The field settles in 365 ms and the spacing in 532, and the
          spacing starts 42 ms later, so the field is already pulling back before the first button
          shows. While the shapes are still close the glass joins them with a neck that thins and
          snaps. The icons arrive last, once the buttons are nearly in place.
        </p>
        <p>
          With reduced motion the four still separate, in one short step and without the overshoot.
          Where the pointer cannot hover, on a phone, the buttons stay out; moving keyboard focus
          into the group opens them.
        </p>
        <p>
          The reference is Spotlight in macOS Tahoe, measured frame by frame at 60 fps. Both springs
          come from a least squares fit to the moving edge of that recording, and the piece running
          here was measured back against it.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Nothing re-renders while it moves. The two springs write the field width, the three button
          positions and one opacity straight into the document, and React sees none of it.
        </p>
        <p>
          The glass is not a live blur of the page behind it. It is a second copy of the same
          backdrop, blurred once and never again, and what moves each frame is the mask that cuts it
          to shape. That mask is one blur and one threshold over the strip the group occupies, which
          is also what fuses the shapes while they are close.
        </p>
        <p>
          Measured in Chrome with the processor slowed four times and two copies of the piece on the
          page: 62 frames, median 16.7 ms, none over 20.
        </p>
      </Seccion>

      <Seccion titulo="Use cases">
        <p>
          A group of controls can rest as one shape and open when the pointer arrives. The resting
          state is quieter, and nothing is hidden from view: what opens is the same glass, in the
          same place, at the same size.
        </p>
        <p>
          Hover cannot be the only way in. A pointer that cannot hover never gets the opening, so
          the buttons have to be out from the start, and keyboard focus has to open them too.
        </p>
      </Seccion>
    </>
  )
}
