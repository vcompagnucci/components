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

   Sin primera persona, la voz sale de la frase que corrige: "They do not
   fade in", "The first button never moves", "React sees none of it",
   "Hover cannot be the only way in". Es la misma que usa Hold to commit
   ("the fill is the progress, not a bar beside it").

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

   LOS GLIFOS TIENEN PÁRRAFO PROPIO, y no una frase colgada del de los
   resortes. Es el único punto de la pieza donde lo que se mueve no es
   una posición, y decirlo en una subordinada lo escondía. La frase que
   carga el peso es "They do not fade in": el lector ya vio cien cosas
   aparecer con opacidad y hay que sacarle esa lectura de encima antes de
   contarle cuál es.

   LA FORMA es la de Hold to commit y Swipeable tabs: Anatomy en tres
   párrafos más el de la referencia, Performance en dos, Use cases en
   dos. Acortar es CORTAR HECHOS, no apretar frases, y los números no se
   tocan: un texto más corto que además redondea es un texto menos
   cierto.

   LO QUE SE CORTÓ, para que no vuelva a entrar sin decidirlo:
     · LA SALIDA ("The way back is shorter…"). Falta a propósito: se ve
       al sacar el puntero y no hace falta anunciarla. Su porqué está en
       la pieza, arriba de CAMPO_SALIDA.
     · MOVIMIENTO REDUCIDO y el camino del teclado no tienen párrafo
       propio: son dos oraciones adentro del de los glifos, que es lo
       que hace Hold to commit con lo mismo.
     · Del vidrio, la segunda mitad —el umbral, la tira—: es cómo está
       hecha la máscara, no algo que se vea.

   DOS DOS-PUNTOS EN MEDIO DE ORACIÓN, y no más. Hubo cinco, cuatro de
   ellos como conector, y cinco juntos son una marca de agua aunque cada
   uno se defienda solo. Los que quedan hacen trabajo: presentar el
   mecanismo que reemplaza al fundido y presentar los resultados de la
   medición.

   "THIS AREA" para el rectángulo donde vive la pieza. Es el nombre que
   ya usa Swipeable tabs ("panes of content in one area"). No es "card":
   la pieza corre en dos cajas distintas y "card" es vocabulario del
   sitio, no de la pieza.

   LOS NÚMEROS, verificados contra el código y contra la medición:
     · 365 ms y 532 ms son las duraciones de los dos resortes en la
       parametrización de Apple (ω = 2π/duración), ajustadas por mínimos
       cuadrados sobre la grabación con 1.57 y 1.42 pt de error en 64
       cuadros. Están en `CAMPO` y `ABANICO`.
     · 42 ms es el retraso entre los dos, medido. Está en `RETRASO`.
     · 20 px es el recorrido del puntero que abre la barra, y no sale de
       la grabación: la eligió Vito el 2026-09-09 sobre un picker de tres
       disparos. Por eso el texto NO dice que sea lo que hace la
       referencia — la grabación no muestra qué la dispara.
     · 290 ms y 640 son el principio y el final del desenfoque de los
       glifos: el tramo medido arranca a los 290 y dura 350. La opacidad
       es otro tramo, más corto (270 y 260), y NO se nombra: que sean dos
       resortes es una decisión de implementación, y el lector ve un solo
       hecho, que el glifo se enfoca en vez de fundirse.
     · Los cuadros, remedidos el 2026-09-10 en un Chrome de verdad, con
       GPU, y sobre CINCO corridas: a 20× y con ocho copias montadas,
       scrolleando no se pierde ninguno, y con una abriéndose y las otras
       siete en reposo se pierde 1 de 55 en el peor caso (0 en tres de
       las cinco). El texto dice "at most", que es lo único honesto con
       una cifra que varía entre corridas, y por eso son cinco y no una.
       NO VOLVER a 1 de 59 y 2 de 54: era la misma medición de una sola
       corrida, y exageraba el costo. Y NO PUBLICAR el peor caso
       sintético —las ocho copias animando a la vez, que cae a 30
       cuadros—: no puede pasar, hay un solo puntero. A 4× no se pierde
       ninguno.

   LA SALIDA NO ES LA ENTRADA AL REVÉS, y el texto lo dice porque se
   ve. Los tres arreglos, con su porqué, están arriba de CAMPO_SALIDA en
   la pieza: los iconos se iban en 300 ms y quedaban cuatro fantasmas
   apilados encima del campo; el campo se pasaba 14 px de su largo de
   reposo; y duraba lo mismo que la entrada. La entrada sigue exacta
   como la referencia: esto es sólo el cierre, que la grabación no
   muestra.

   LO QUE NO SE AFIRMA. No se dice cuánto tarda todo en asentarse:
   el conjunto se queda quieto alrededor de los 730 ms, pero ese número
   sale de mirar dónde la traza deja de moverse y no de un umbral
   definido, así que no entra al texto. Tampoco se dice que la pieza
   siga la grabación con tal error: la comparación dio 3.5 px de error
   cuadrático medio y 13.4 px de máximo sobre el primer segundo, y un
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
          A search field, and beside it a single shape of glass. Move the pointer anywhere over this
          area and the shape opens into four round buttons; take the pointer away and they close
          back into one. Twenty pixels of travel are enough. The pointer never has to reach the
          group. The field takes text and does nothing with it.
        </p>
        <p>
          The field carries the opening. It shortens from the full width of the group to its own,
          and the four buttons fan out from where the first one sits. The first button never moves;
          what opens is the spacing. Two springs run it. The field settles in 365 ms. The spacing
          starts 42 ms later and settles in 532. While the shapes are still close the glass joins
          them with a neck that thins and snaps.
        </p>
        <p>
          The icons arrive last and out of focus. They do not fade in: a blur opens over them at
          290 ms and closes to nothing by 640. With reduced motion they come in sharp and the four
          separate in one short step. Where the pointer cannot hover, the buttons stay out, and
          keyboard focus opens them.
        </p>
        <p>
          The reference is Spotlight in macOS Tahoe, measured frame by frame at 60 fps. Both springs
          come from a least squares fit to that recording, and the piece was measured back against
          it.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Nothing re-renders while it moves. The springs write the shapes and their opacity straight
          into the document, and React sees none of it. The glass is not a live blur of the page
          behind it. It is a second copy of the same backdrop, blurred once, and what moves each
          frame is the mask that cuts it to shape.
        </p>
        <p>
          Measured in Chrome with the processor slowed twenty times and eight copies of the piece on
          the page, over five runs: scrolling drops no frames, and one copy opening while the other
          seven rest drops at most 1 in 55.
        </p>
      </Seccion>

      <Seccion titulo="Use cases">
        <p>
          A group of controls can rest as one shape and open when the pointer arrives. Nothing is
          hidden. What opens is the same glass, in the same place, at the same size.
        </p>
        <p>
          Hover cannot be the only way in. A pointer that cannot hover never gets the opening, so
          the buttons have to be out from the start, and keyboard focus has to open them too.
        </p>
      </Seccion>
    </>
  )
}
