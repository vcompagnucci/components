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

   ANATOMY TIENE QUE DAR CUENTA DE TODO LO QUE LA PIEZA HACE. Antes
   hablaba SÓLO de la separación —"el campo, la lupa y el fondo están
   para que la separación tenga dónde pasar"— y con esa regla se quedaron
   afuera cosas que se ven a la primera: el realce del hover, el hundido
   del press, que el foco en el campo la mantiene abierta, y que el fondo
   sigue al tema. Ninguna es un detalle de implementación; las cuatro se
   miran. La regla nueva es la del pedido de Vito del 2026-09-10: lo que
   se ve, se dice. Lo que sólo se lee en el código sigue afuera (§ LO QUE
   SE CORTÓ).

   DE LOS GLIFOS, LA FRASE QUE CARGA EL PESO ES "They do not fade in":
   el lector ya vio cien cosas aparecer con opacidad y hay que sacarle
   esa lectura de encima antes de contarle cuál es. Sus números NO van en
   el texto —están en la pieza, arriba de ICONO—: lo que se ve es que el
   glifo se enfoca, no cuántos milisegundos tarda.

   LA FORMA: Anatomy en TRES párrafos y uno por asunto —el gesto y lo
   que se puede hacer, la apertura que SÍ está medida contra la
   grabación, y el cierre que no lo está—, Performance en dos y Use cases
   en dos. El corte entre el segundo y el tercero es el que importa: la
   grabación termina donde termina la apertura, y un lector tiene derecho
   a saber qué parte de esto salió de medir y qué parte se decidió acá.
   Acortar es CORTAR HECHOS, no apretar frases, y los números no se
   tocan: un texto más corto que además redondea es un texto menos
   cierto.

   LO QUE SE CORTÓ, para que no vuelva a entrar sin decidirlo:
     · EL CAMINO DEL TECLADO no está en Anatomy: la regla vive en Use
       cases ("keyboard focus has to open them too") y decirla dos veces
       era decirla una de más.
     · Del vidrio, la segunda mitad —el umbral, la tira—: es cómo está
       hecha la máscara, no algo que se vea.
     · QUE LA OPACIDAD Y EL DESENFOQUE SEAN DOS RESORTES. Se ve un solo
       hecho —el glifo se enfoca— y los dos tramos están arriba de ICONO.
     · EL VELO DEL VIDRIO, que NO sigue al tema aunque el fondo sí: está
       medido contra el material nativo y se queda fijo. El porqué está
       en la hoja de la pieza, y es una decisión sobre el material, no
       algo que el lector pueda ver pasar.
     · QUE EN LA LISTA EL CAMPO NO SE ESCRIBA Y LOS BOTONES NO SE TOQUEN.
       Eso es la card del sitio, no la pieza.

   UN SOLO DOS-PUNTOS EN MEDIO DE ORACIÓN EN TODA LA PÁGINA. Hubo cinco,
   cuatro de ellos como conector, y cinco juntos son una marca de agua
   aunque cada uno se defienda solo. El que queda hace trabajo: presenta
   los resultados de la medición de cuadros. Los párrafos que se
   agregaron el 2026-09-10 no trajeron ninguno, a propósito.

   EL LARGO DE LAS ORACIONES SE MIRA, y no es una manía. Una página
   entera de oraciones de quince palabras es de las cosas que más
   delatan un texto generado, así que la página va de 3 a 40: "Nothing
   is hidden" al lado del párrafo de la medición. La pasada de
   `emil-unslop-writing` del 2026-09-10 arregló tres cosas de forma:

     · TRES AMONTONAMIENTOS DE SUBORDINADAS, uno por párrafo nuevo. El
       peor abría Anatomy con 34 palabras y tres cláusulas colgadas de
       dos "and" y un punto y coma. Se partieron en oraciones cortas, que
       de paso siguen el orden de la interacción: "Move the pointer over
       this area." y recién después qué pasa.
     · "The background under all of it is mixed from…" era pasiva con el
       actor escondido, y "all of it" un sinónimo suelto de algo que ya
       tiene nombre. Ahora es "The background of this area mixes…".
     · "come out of the end it leaves behind" pedía reconstruir una
       geometría para entender una frase. Salen del campo, y eso es lo
       que dice.

   Lo que NO se tocó, aunque una lectura rápida lo marque: la oración de
   40 palabras de Performance —lleva la medición entera y su dos-puntos
   trabaja—, la de 27 de Use cases, y el "same glass, same place, same
   size", que es un tres de verdad y no un relleno rítmico: son tres
   hechos distintos y cada uno se puede negar por separado.

   "THIS AREA" para el rectángulo donde vive la pieza. Es el nombre que
   ya usa Swipeable tabs ("panes of content in one area"). No es "card":
   la pieza corre en dos cajas distintas y "card" es vocabulario del
   sitio, no de la pieza.

   LOS NÚMEROS, verificados contra el código y contra la medición:
     · 365 ms y 532 ms son las duraciones de los dos resortes en la
       parametrización de Apple (ω = 2π/duración), ajustadas por mínimos
       cuadrados sobre la grabación con 1.57 y 1.42 pt de error en 64
       cuadros. Están en `CAMPO` y `ABANICO`.

       ACÁ DECÍA "The field settles in 365 ms" Y ERA FALSO. `duración`
       fija la frecuencia, no el momento en que la cosa se queda quieta:
       integrando el resorte de la pieza, el campo llega al 90 % de su
       viaje a los 138 ms, se pasa un 7.6 % a los 229 y recién queda por
       debajo de medio píxel a los 537. El abanico, 217 / 625. El texto
       dice ahora "365 ms for the field", que es lo que el número es.
     · 42 ms es el retraso entre los dos, medido. Está en `RETRASO`.
     · 38 y 44 px son el botón dibujado y su área de toque, con 1 px
       libre contra la del vecino (`.boton` y su ::before). El texto NO
       promete 44 px de pantalla: por debajo de 544 px de ancho el
       conjunto se achica en bloque y el área se achica con él —a 372 px
       de escena la escala es 0.623 y quedan 27.4 px, que pasa el mínimo
       de la WCAG 2.5.8 (24) y no llega a los 44 de Apple—. Por eso la
       última oración de Use cases existe: sin ella el 44 se leería como
       una garantía.
     · 544 px es el ancho de LA ESCENA, no el de la ventana: la escala es
       min(1, (ancho − 2·44) / 456) y con 456 + 88 da exactamente 1.
     · 20 px es el recorrido del puntero que abre la barra, y no sale de
       la grabación: la eligió Vito el 2026-09-09 sobre un picker de tres
       disparos. Por eso el texto NO dice que sea lo que hace la
       referencia — la grabación no muestra qué la dispara.
     · Del desenfoque de los glifos no va ningún número al texto. Los dos
       tramos —290 y 350 el desenfoque, 270 y 260 la opacidad— están
       arriba de ICONO. Que sean dos resortes es implementación, y el
       lector ve un solo hecho: que el glifo se enfoca en vez de fundirse.
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

   LA SALIDA NO ES LA ENTRADA AL REVÉS, y ahora el texto lo dice —tercer
   párrafo— porque se ve y porque el segundo párrafo afirma que la
   apertura está medida contra la grabación. Sin la aclaración, esa
   afirmación se derramaba sobre el cierre, que la grabación NO muestra.
   Los tres arreglos, con su porqué, están arriba de CAMPO_SALIDA en la
   pieza. Medido con la pieza corriendo (`sonda/salida.cjs`): el abanico
   arranca en el primer cuadro y el campo recién a los 49 ms —el retraso
   cambió de lado—, el campo vuelve a 456 sin pasarse ni una vez, y los
   glifos están en 0.02 de opacidad a los 115 ms.

   NO DECIR "the icons are gone before the shapes touch". Las formas se
   vuelven a tocar a los 49 ms y ahí los glifos todavía valen 0.25. Lo
   cierto es lo otro: se van ANTES que todo lo demás, y por eso no quedan
   cuatro apilados sobre el campo, que es lo que pasaba con el tramo de
   300 ms (0.28 a los 120). El comentario de la pieza afirmaba lo
   primero; se corrigió el 2026-09-10 con la sonda.

   LO QUE NO SE AFIRMA. No se dice cuánto tarda todo en asentarse:
   el conjunto se queda quieto alrededor de los 730 ms, pero ese número
   sale de mirar dónde la traza deja de moverse y no de un umbral
   definido, así que no entra al texto. Tampoco se dice que la pieza
   siga la grabación con tal error: la comparación dio 3.5 px de error
   cuadrático medio y 13.4 px de máximo sobre el primer segundo, y un
   solo número de esos leído solo miente en una dirección o en la otra.
   Lo que sí se afirma es que se midió contra ella.

   UNA SONDA POR ORACIÓN: `.context/buttons-separate/sonda/texto.cjs`.
   Cada `ok` de ese archivo es una afirmación de esta página y falla si
   la pieza deja de cumplirla. Existe porque hasta el 2026-09-10 estas
   notas se escribían contra el código LEÍDO, y leer no es medir: la
   primera corrida encontró dos oraciones que no se sostenían.

     · "A search field, and beside it a single shape of glass" describía
       DOS formas y en reposo hay UNA. Los cuatro círculos están en la
       misma ranura (cx 302, medido) y esa ranura cae adentro del campo,
       que mide 456: lo que se ve es una píldora sola, y los botones
       salen de adentro cuando el campo se acorta a 276. El texto dice
       ahora "one long search field of glass" y "come out of the end it
       leaves behind", que es lo que pasa.
     · "The field settles in 365 ms" (ver LOS NÚMEROS).

   Y las que sí se sostienen quedaron con su medición al lado: el primer
   botón no se mueve (302 → 302), el paso es parejo (45.0), el press
   achica el círculo del vidrio de 19 a 18.24 y lo devuelve, el foco en
   el campo aguanta la barra abierta con el puntero afuera, el fondo se
   mezcla con los tokens de la página en los dos temas (#111111 sobre
   #fdfdfc en claro, #fafaf9 sobre #090908 en oscuro), con movimiento
   reducido no hay un solo cuadro con desenfoque (0 de 32) y la
   separación NO se apaga, y sin hover la barra arranca abierta.

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
          At rest this is one long search field of glass. Move the pointer over this area. The field
          shortens and four round buttons come out of it. Take the pointer away and they go back in.
          Twenty pixels of travel are enough, so the pointer never has to reach them. Hover one
          button and only that button's glass takes a tint. Press it and the whole button sinks,
          glass and icon together. The field takes text and does nothing with it, and while it has
          focus the group stays open. The background of this area mixes the page's own canvas and
          ink, so the piece follows the theme.
        </p>
        <p>
          The field carries the opening. It shortens from the group's full width to its own, and the
          four buttons fan out from where the first one sits. The first button never moves; what
          opens is the spacing. Two springs run it, 365 ms for the field and 532 for the spacing,
          which starts 42 ms later. While the shapes are still close the glass joins them with a neck
          that thins and snaps. The icons arrive last and out of focus, and they do not fade in. The
          reference is Spotlight in macOS Tahoe, measured frame by frame at 60 fps, and the piece was
          measured back against it.
        </p>
        <p>
          Closing is not the opening reversed, and the recording does not show it. It runs a quarter
          shorter, and the field returns without the overshoot it takes on the way out. The order
          flips too, so the buttons meet before the field covers them. The icons leave fastest, so
          four of them never end up stacked over the field. With reduced motion the separation stays,
          because the separation is the piece. It drops the delays and the overshoot, and the icons
          are sharp from the first frame.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Nothing re-renders while it moves. The springs write the shapes and their opacity straight
          into the document, and React sees none of it. At rest there is no frame loop at all, so a
          page of these costs nothing until a pointer arrives. The glass is not a live blur of the
          page behind it. It is a second copy of the same backdrop, blurred once, and what moves
          each frame is the mask that cuts it to shape.
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
          Hover cannot be the only way in. A pointer that cannot hover never gets the opening, so the
          buttons have to be out from the start, and keyboard focus has to open them too. Each button
          is 38 pixels wide and its hit area is 44. That leaves one pixel between neighbours. Once
          this area drops below 544 pixels the whole group scales down, and the hit areas shrink with
          it.
        </p>
      </Seccion>
    </>
  )
}
