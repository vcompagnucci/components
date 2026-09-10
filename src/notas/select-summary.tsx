import { Seccion } from '../notas'

/* Las notas de Select summary. Todo lo de acá está en el registro: los
   comentarios de `src/piezas/select-summary.tsx` y las mediciones de
   `.context/select-summary/`. Si una frase deja de ser cierta, se
   corrige acá Y allá: el texto público no es un resumen libre, es la
   misma evidencia contada para alguien que llega de afuera.

   EL PROCEDIMIENTO ES EL DE AGENTS.md › Cómo se escriben la línea y las
   notas, el que fijó Swipeable tabs. Lo que sigue son los recibos de
   ESTA página, uno por decisión.

   CON LÍNEA, al revés que Hold to commit. "Select summary" nombra el
   control pero no dice qué hace el botón con lo elegido, que es lo único
   que hay que mirar; la línea gasta sus palabras ahí. Está en
   `pieces.ts`, con su porqué.

   EL TONO, medido servido el 2026-09-10, no de memoria. Tres páginas,
   leídas con el navegador y contadas:

     joshpuckett.me/bloom      5 párrafos · mediana 12 palabras · 2
                               oraciones · 7.9 palabras por oración
     joshpuckett.me/pasito     7 párrafos · mediana 17 · 2 · 10.0
     benji.org/liveline       32 párrafos · mediana 24 · 2 · 9.7

   O sea: párrafos de dos oraciones, oraciones de ocho a diez palabras.
   Esta página se escribió contra esos números y no contra una
   impresión. De benji sale además la prosa que va de lo que se siente
   al mecanismo; de josh, abrir el párrafo por el sujeto del hecho y
   nunca por un anuncio de lo que sigue.

   PERSONA. Cero "I" y cero "we": josh no usa ninguno en las dos páginas
   medidas. "You" es quien opera el control.

   UN SOLO NOMBRE POR COSA, en toda la página y no por sección, que es la
   falla que `better-writing` más encuentra acá. Las decisiones: "the
   button" para el disparador (nunca "trigger" ni "pill"), "the panel"
   para lo que se abre (nunca "menu" ni "dropdown", aunque su rol ARIA
   sea menu), "the cluster" para el racimo, "a row" para cada fila, "the
   label" SÓLO para el texto del botón, y "select" como único verbo.

   Y "photo", nunca "face". El texto decía "faces" y era falso en una de
   las cuatro: el avatar de Elon Musk es un lanzamiento de Starship.

   ANATOMY HABLA SÓLO DEL RESUMEN, que es lo que da nombre a la pieza: el
   racimo y el rótulo del botón. Cómo se elige —las filas, las casillas,
   el hover— es el mecanismo alrededor y no entra, que es lo mismo que se
   decidió con los tabs y con el botón. La referencia se nombra en el
   cierre, junto con cómo se midió: x.com/abjt14/status/2097316524436627688,
   la ficha del vault.

   LO QUE SE MENCIONA DE LOS SKILLS, Y LO QUE NO. Entra sólo lo que un
   lector puede VER, con su recibo. `animate-expo` no aplica: es de
   React Native y esto corre en el navegador.
     · `better-ui` y `emil-surfaces` › image outlines: cada foto lleva
       una línea de 1 px al 10 %, negro puro en claro y blanco puro en
       oscuro, nunca un neutro teñido (`--pieza-contorno`, y el círculo
       de `Chip`). Es la regla textual de los dos, y el valor no se
       elige: se mira sobre la foto de fondo blanco, que es la que lo
       necesita.
     · `emil-surfaces` › depth without borders: el disparador y el panel
       no llevan `border` sino un anillo `inset 0 0 0 1px`. Además de
       componer sobre lo que tenga debajo, saca de la cuenta del ancho
       el único término que estaba en píxeles.
     · `better-ui` › shadows for elevation, borders for structure: cero
       sombras. Las dos líneas que hay separan cosas —el panel de la
       card, la foto de la superficie— y ninguna finge profundidad.
     · `better-ui` › interruptible animations: todo es `transition` de
       CSS y no hay un solo keyframe, así que tocar dos filas seguidas no
       reinicia nada.
     · `better-ui` › skip animation on page load: el racimo no anima en
       el primer pintado (`Racimo`, el estado `montado` con su rAF).
     · `better-ui` › transition only what changes: las cinco
       transiciones nombran su propiedad; medido, ninguna es `all`.
     · `interface-craft` › la lente de crítica, en "do outlines add
       structure or noise?" y en color: después de sacar el violeta, los
       únicos colores de la pieza son las cuatro fotos.

   LO QUE LA PIEZA ROMPE A PROPÓSITO, y por eso NO está en el texto:
     · `better-ui` pide `scale(0.96)` al apretar. Acá el botón no se
       mueve —decisión del 2026-09-10, con el respaldo de DESIGN.md › El
       press— y el acuse es relleno.
     · El alfa del contorno es 5.1 % y el skill pide 10 %. Manda el
       `--hairline` del sistema, que es el que usan las otras líneas de
       la pieza.
     · Los chips viajan 370 ms, arriba de los 150 que el skill reserva
       para lo de alta frecuencia. Es el sumario, que es la pieza.

   USE CASES SIN CITAR A NADIE. Los conceptos salen de la guía de
   interfaz de Apple, leída el 2026-09-10 por su API de documentación
   (developer.apple.com/tutorials/data/design/human-interface-guidelines/
   <slug>.json; la página HTML se arma con JavaScript y devuelve sólo el
   título). Entran como explicación y dichos en llano como propios, nunca
   como autoridad y sin nombrarla, que es la regla de AGENTS.md:
     · «After people choose an item from a pop-up button's menu, the menu
       closes, and the button can update its content to indicate the
       current selection» y «Use a pop-up button to present a flat list
       of mutually exclusive options […] Use a [pull-down button] instead
       if you need to […] Let people select multiple items»
       (pop-up-buttons.json) → el primer párrafo.
     · «If you want to avoid listing a separate menu item for each state,
       it can be efficient to create a single, toggled menu item that
       communicates the current state and lets people change it» y
       «people might not know whether the changeable labels HDR On and
       HDR Off describe actions or states» (menus.json) → el segundo.

   LOS NÚMEROS, verificados en la página el 2026-09-10: el botón mide un
   solo ancho en los siete estados y ninguno recorta; el layout no se
   mueve en ningún estado, ni al abrir, ni al cerrar; 421 cuadros en 7 s
   de la card de la home dan 0.00 px; el chip que entra crece en 90 ms;
   la casilla cruza en 150; el paso del guión es 1500 ms.

   SIN RAYA en el texto público, ni em dash ni en dash: donde salía una,
   son dos oraciones o son dos puntos. Los guiones de palabra compuesta
   se quedan. La regla es del texto público; en estos comentarios en
   castellano la raya es puntuación normal.

   MUCHO MÁS CORTA (2026-09-10, "hacela muchísima más concisa, máximo 2
   párrafos y 4 líneas"). De 293 palabras a 150, y las tres secciones
   quedaron iguales de largas: dos párrafos y cuatro líneas renderizadas
   cada una, contadas en la página y no a ojo. Lo que se fue son los
   hechos que el lector ve solo —el racimo de una, de dos, de tres y de
   cuatro; el contorno de las fotos; el panel sin sombra— y lo que quedó
   es lo que hay que decirle.

   Y LA PIEZA APOYA LO QUE DICE `emil-animations`, así que el texto lo
   dice en una frase: "an animation that answers no question is not
   here". Es su regla, en llano: «Animate when it adds information […]
   If the animation answers no question, cut it». Lo que la pieza NO
   anima está respaldado por ese mismo skill:
     · el acuse del apretar, que no escala: «Not every button needs it;
       skip it on high-frequency controls».
     · el primer pintado, que no anima: «Don't animate initial page load
       state».
     · el guion de la lista, que se fue del todo (2026-09-10): una pieza
       Web que reproduce una secuencia se lee como un video, y lo que
       tiene que hacer es contestarle al puntero.
   Lo que la pieza rompe de ese skill queda acá y no en el texto: el chip
   que entra nace en scale 0 —«Never enter from scale(0)»— porque a 11.8
   px arrancar en 0.95 son 0.6 px de recorrido, y el racimo viaja 370 ms,
   arriba de los 300 que pide, porque es la curva medida de la
   referencia.

   LA PASADA DE `emil-unslop-writing`, medida sobre la página servida:
   cero palabras de las que el skill lista, cero rayas, cero comillas
   curvas y ninguna pasiva sin actor. Lo que sí encontró fueron DOS
   PUNTOS: cuatro en 26 oraciones, tres de ellos uniendo una frase que se
   sostenía sola. Quedó uno, el de la línea de descripción, que sí abre
   una enumeración. Después del recorte quedan 13 oraciones, media 11.5
   palabras y desvío 3.9. También se fueron un "lives in" que era metáfora, un
   "carries" que era "has", un "without being opened" que escondía al
   actor y un "land in the same place" que no decía nada.

   Y LO QUE EL SKILL PIDE Y ESTA PÁGINA NO HACE: tener una reacción y
   escribir en primera persona. No entra porque el tono está medido y
   josh no usa ninguna de las dos en las dos páginas contadas. La
   variación de ritmo, que es la otra mitad de ese pedido, sí está:
   oraciones de 3 a 20 palabras, media 11.5 y desvío 4.5. */
export default function Notas() {
  return (
    <>
      <Seccion titulo="Anatomy">
        <p>
          The summary is in the button. Select someone and the cluster of photos rearranges, and
          nothing else does. An animation that answers no question is not here.
        </p>
        <p>
          The reference is a select posted on X by @abjt14, measured frame by frame at 60 fps.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          CSS transitions, no animation library. Only transform, opacity and color animate, so
          nothing forces the page to lay out again.
        </p>
        <p>
          The label changes in one frame, the button holds one width, and the press moves nothing. In
          every state, nothing drifts by a pixel.
        </p>
      </Seccion>

      <Seccion titulo="Use cases">
        <p>
          A summary in the button fits a filter that holds several things at once. It answers what is
          on before you open it.
        </p>
        <p>
          The last row is a checkbox and not a command, because it reports a state. Selecting nobody
          and selecting everybody are the same state.
        </p>
      </Seccion>
    </>
  )
}
