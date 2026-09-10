import { Seccion } from '../notas'

/* Las notas de Select summary. Todo lo de acá está en el registro: los
   comentarios de `src/piezas/select-summary.tsx` y las mediciones de
   `.context/select-summary/`. Si una frase deja de ser cierta, se
   corrige acá Y allá: el texto público no es un resumen libre, es la
   misma evidencia contada para alguien que llega de afuera.

   EL PROCEDIMIENTO ES EL DE AGENTS.md › Cómo se escriben la línea y las
   notas, el que fijó Swipeable tabs. Lo que sigue son los recibos de
   ESTA página, uno por decisión.

   SIN LÍNEA, como las otras tres. La tuvo un día —"The button shows who
   you selected: a name for one person, a count for more"— y se borró el
   2026-09-10: el título ya dice qué es, que es la primera regla de
   AGENTS.md › Cómo se nombra.

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
   decidió con los tabs y con el botón.

   Y NO CIERRA CON LA REFERENCIA, al revés que las otras dos (pedido del
   usuario, 2026-09-10: "saca lo de la referencia"). Es una diferencia
   con AGENTS.md › Cómo se escriben la línea y las notas, que la pide en
   el cierre junto con cómo se midió, y hay que decir qué cuesta: la
   atribución sale de la página. Sigue en dos lados —la ficha del vault
   (x.com/abjt14/status/2097316524436627688) y el encabezado de
   `select-summary.tsx`—, así que no se pierde, pero deja de leerse.

   LA VOZ. El texto tiene por primera vez una opinión y una admisión:
   "deciding what not to move took longer than building what does" y "a
   control you use all day should sit still". Es la mitad de
   `emil-unslop-writing` que hasta acá no se aplicaba —«voiceless but
   correct is exactly what a model on its best behavior produces»— y que
   entra por pedido explícito ("mucho más humana"). Sigue sin "I" ni
   "we", que es la decisión que fijó Hold to commit.

   Y LA PRIMERA DE LAS DOS ES CIERTA, que es lo que la hace decible: el
   ancho animado (370 ms ajustados sobre 18 muestras), el fundido del
   rótulo token por token, el scale del press afinado en píxeles y el
   guion de la lista se construyeron los cuatro, se midieron, y los
   cuatro se sacaron después.

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

   LO QUE EL TEXTO DICE SOBRE NO ANIMAR sale del curso de animations.dev
   (`animate`) y de `emil-animations`, y son sus dos pruebas, dichas en
   llano y como propias:

   · EL PROPÓSITO. «Every animation needs one of: explanation, feedback,
     spatial consistency, state indication, preventing a jarring change,
     or delight. "It looks cool" on a frequently-seen element is not a
     purpose», y «you can answer "why does this animate?" in one
     sentence». De ahí sale "it is the only thing that answers a
     question": el racimo contesta quién está adentro del resumen, y las
     otras tres candidatas no contestaban nada.
   · LA FRECUENCIA. Su tabla es explícita: 100+ veces por día, «no
     animation, ever»; decenas de veces por día, «remove or drastically
     reduce». Un filtro se toca todo el día, y de ahí sale "a control you
     use all day should sit still".

   Y la frase que gobierna las dos: «If everything animates, nothing
   stands out. Motion is a spice, not the meal». Está el curso entero
   atrás de que la pieza tenga UNA animación y no cuatro.

   MÁS TÉCNICO, Y COMO LO CUENTA ÉL (pedido del usuario, 2026-09-10). Su
   forma es nombrar la propiedad y el número en la misma frase que la
   razón, no hablar de sensaciones: «only animate transform and opacity»,
   «start entrances from scale(0.9–0.95)», «press feedback is felt, not
   seen». Así que el texto dice la curva y los milisegundos —370 ms sobre
   cubic-bezier(.19, 1, .22, 1)—, dice el mecanismo —transición y no
   keyframe, y por eso dos toques seguidos retoman en vez de reiniciar— y
   dice qué hace el press en vez de escalar.

   LA CURVA ES DE LAS SUYAS, y por casualidad: el mejor ajuste de 14
   curvas × 39 duraciones sobre 18 muestras de la referencia dio
   cubic-bezier(.19, 1, .22, 1), que es exactamente el --ease-out-expo de
   su catálogo, «strong ease-out». Salió de medir un video, no de copiar
   su lista.

   LO QUE NO ENTRA AL TEXTO AUNQUE SEA TÉCNICO: que el chip que entra
   nace en scale 0, que es lo que él prohíbe. La excepción tiene número
   —a 11.8 px, arrancar en 0.95 son 0.6 px de recorrido— pero explicarla
   pide una tercera oración y la sección tiene cuatro líneas. Queda acá,
   donde ya estaba.

   Lo que la pieza NO anima está respaldado por ese mismo skill:
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
          Select someone and the cluster rearranges. Each photo scales from its top left corner,
          370ms on cubic-bezier(.19, 1, .22, 1).
        </p>
        <p>
          It is the only animation here, because it is the only one that answers a question. The
          label swaps in a frame, the width holds, and the press paints instead of scaling.
        </p>
      </Seccion>

      <Seccion titulo="Performance">
        <p>
          Transform and opacity only, plus the color of a row. Each one is a CSS transition and not a
          keyframe, so two fast selections retarget instead of restarting.
        </p>
        <p>
          In every state, nothing drifts by a pixel. A control you use all day should sit still.
        </p>
      </Seccion>

      <Seccion titulo="Use cases">
        <p>
          A summary in the button fits a filter that holds several things at once. It answers what is
          on before you open it.
        </p>
        <p>
          The last row is a checkbox and not a command, because it reports a state. Selecting nobody
          and selecting everybody are the same state, and neither one filters.
        </p>
      </Seccion>
    </>
  )
}
