/* ═══════════════════════════════════════════════════════════════
   LOS VALORES DE LA PIEZA, CON SU RECIBO.

   Todos salen de medir el clip de referencia (`Swipeable tabs.mov`, X
   en iOS) leyendo píxeles crudos: ffmpeg escribe rgb24 y Node cuenta.
   El clip son 1320 px de ancho = 440 pt × 3, así que **cada medición
   en píxeles se divide por 3** para dar puntos. La planilla completa
   está en `.context/recon/swipeable-tabs/MEDICIONES.md` — que no viaja
   entre worktrees, y por eso el recibo de cada número está también acá.

   Dos grados, como en el repo web:
   · RUNTIME  — leído del píxel del clip.
   · DERIVADO — una cuenta sobre un RUNTIME, con la cuenta escrita.

   Un valor sin recibo es un valor que alguien va a cambiar sin saber
   qué rompe. Si agregás uno, agregá también de dónde salió.
   ═══════════════════════════════════════════════════════════════ */

export const COLOR = {
  /* RUNTIME · el fondo del clip es negro puro. */
  fondo: '#000000',

  /* RUNTIME · moda de luminancia del label activo: 255 sobre 492 px.
     Blanco puro, no un blanco roto. */
  activo: '#FFFFFF',

  /* RUNTIME · moda del label inactivo: 142. Y no es un promedio de
     cosas distintas — "Following", "Stocks", "Tech" y "AI" dieron
     141, 142, 142 y 142 por separado. */
  inactivo: '#8E8E8E',

  /* RUNTIME · el subrayado es blanco puro, igual que el label activo. */
  subrayado: '#FFFFFF',

  /* RUNTIME · el divisor bajo la barra: 47,47,47 sobre negro. */
  divisor: '#2F2F2F',

  /* RUNTIME · el chevron del tab activo NO es blanco: 140 de luminancia
     contra 255 del label que tiene pegado al lado. Es jerarquía adentro
     del propio tab activo, y es de las cosas que más se notan si se
     copian mal. */
  chevron: '#8C8C8C',

  /* RUNTIME · los íconos que llevan los tabs de tema sí son blancos:
     moda 255 tanto en el de Stocks como en el de Tech. O sea que el
     chevron y el ícono, que parecen la misma clase de cosa, están
     pintados distinto a propósito. */
  icono: '#FFFFFF',

  /* RUNTIME · el `+` da 105 de moda (129 px), más apagado que un label
     inactivo. Puede ser que en la referencia sea gris normal y lo esté
     apagando la máscara del borde; acá se dibuja ARRIBA de la máscara,
     así que para que el resultado dé lo mismo que el clip el valor
     tiene que ser el medido y no el "verdadero". */
  mas: '#696969',
} as const

export type Paleta = Record<keyof typeof COLOR, string>

/* ═══ LA PALETA CLARA — medida en la grabación clara del 2026-09-02 ═══

   Hasta ese día no había un solo cuadro claro y la paleta se armaba
   con los tokens públicos de x.com (#0F1419 / #536471 / #EFF3F4) más
   las relaciones medidas en oscuro. La grabación del pliegue vino en
   modo claro, y se muestreó con el MISMO método que la oscura: moda de
   los píxeles del núcleo de la tinta, valor crudo del video, sin
   corrección de rango (1320×2868, cuadro 0 en reposo).

     fondo       #FFFFFF  255 en toda superficie
     activo      #000000  moda de 361 px en "For you". NO es el #0F1419
                          de la web: la moda es neutra, y un azulado
                          quedaría en ~#00050A aun aplastado
     inactivo    #5C5C5C  moda en Following y en Stocks, iguales
     subrayado   #000000  = activo, como en oscuro (255 = 255)
     divisor     #C9CBCB  la fila 450 entera, 957 px del mismo valor —
                          bastante más oscuro que el #EFF3F4 de la web
     chevron     #5C5C5C  su núcleo da #5E..#5F: la clase del inactivo,
                          como en oscuro (140 ≈ 142)
     icono       #000000  = activo; en el cuadro no hay ícono de tema
                          activo — relación heredada del oscuro
     mas         #4B5761  moda; lo único azulado de la barra

   El video es H.264: negros y blancos puros pueden venir aplastados y
   una línea de 1 px llega algo más clara de lo que es. Es el mismo
   sesgo que tiene la paleta oscura, y se acepta igual. */
export const CLARO: Paleta = {
  fondo: '#FFFFFF',
  activo: '#000000',
  inactivo: '#5C5C5C',
  subrayado: '#000000',
  divisor: '#C9CBCB',
  chevron: '#5C5C5C',
  icono: '#000000',
  mas: '#4B5761',
}

export const BARRA = {
  /* DERIVADO · el centro del texto está a 67 px (22.3 pt) del divisor
     (RUNTIME). Con el label centrado en la barra, eso da 44.6 pt de
     alto; 44 pone el divisor donde el clip lo tiene. */
  alto: 44,

  /* RUNTIME · el borde izquierdo del subrayado del primer tab cae en
     x=36 px = 12 pt. Ese es el inset de la fila. */
  inset: 12,

  /* DERIVADO · del borde del subrayado al ink del label hay 40 px a la
     izquierda y 33 a la derecha (RUNTIME). La asimetría son los side
     bearings de la `F` y del chevron, no un padding asimétrico: 12 pt
     a cada lado deja el ink donde el clip lo tiene. */
  padding: 12,

  /* SEPARACIÓN ENTRE CAJAS, y existe por una razón tipográfica.

     Con las cajas pegadas, el subrayado del tab 0 sale exacto pero los
     labels derivan a la izquierda: Chirp y SF Pro no reparten igual el
     ancho entre tinta y side bearings, y la diferencia se acumula tab a
     tab. Esta constante la compensa en promedio.

     EL VALOR DIO UNA VUELTA ENTERA, y el recibo viejo hay que contarlo
     para que nadie lo restaure: el 1.8 original salió de comparar
     huecos de tinta contra el clip del vault (26.3 nuestro vs 28.1 de
     X, promedio de cuatro huecos). Pero uno de esos cuatro —el de
     chevrón→Following— es un hueco ACTIVO→inactivo, y el 28.1 traía
     adentro la INCLINACIÓN de X (`apartar`, +4.7 en ese hueco = +1.2
     de promedio), que en ese momento no estaba descubierta. El fit
     compensó tipografía Y una regla de layout que después se
     implementó aparte — o sea que la corrección quedó doble.

     RUNTIME · re-derivado con los seis reposos de las grabaciones
     nuevas (2026-09-01), corrigiendo la inclinación antes de comparar:

       huecos base de X (sin lean)     24.7  27.0  26.0  29.4  Σ 107.1
       nuestros con las cajas pegadas  25.8* 26.9  26.2  26.5  Σ 105.4
                                       (* la F pega distinto que en Chirp)

     Σ nuestra con sep 0.6: ~107.5 ≈ X. Con el 1.8 viejo la tira
     quedaba 5.7 pt más larga que la de X (tope 51.3 contra 45.6
     medido), y en los estados lejanos la fila scrolleaba ese extra: se
     tragaba la cola de "you" que en X queda asomando en 17..28 pt. El
     residuo por hueco (±2, la 'A' de AI sobre todo) es de pares de
     letras y no se corrige con una constante.

     Se agrega acá y no en el padding a propósito: subiendo el padding
     también engordaría la caja, y el subrayado —que coincide al
     decimal— dejaría de coincidir. */
  separacion: 0.6,

  /* LA PALABRA INACTIVA SE INCLINA, ALEJÁNDOSE DEL TAB ACTIVO. Es la
     regla que faltaba y explica tres síntomas de una vez: que en X el
     label de "For you" también se corre cuando pierde el chevron, que
     la palabra que se apaga viaja un poco MÁS que su ranura, y que la
     cola de la tira se corre menos que acá al entrar a un tab de tema.

     RUNTIME · seis palabras medidas en los seis reposos de las
     grabaciones nuevas de X (2026-09-01, la cuenta del usuario, misma
     pantalla de 440 pt). Anclando cada palabra en su posición de tab
     activo, la posición inactiva se aparta del activo un extra que las
     cajas no explican:

       For you    −4.0 con Following activo, −5.4 con activos lejanos
       Following  +4.0 con For you activo,   −5.4 hacia el otro lado
       Stocks     +1.7 → −4.7 según el lado (las cajas ya ponían ±3)
       Tech       +4.4 / −5.0      AI  +4.4..6  (su tinta de 11.6 pt
                                       es la lectura más ruidosa)

     O sea: c(i, activo) = 0 si i es el activo, −apartar si el activo
     está a la derecha, +apartar si está a la izquierda — SOLO en el
     label (y en lo que viaja con él: velo y símbolo); las cajas y el
     subrayado no se tocan, que ya coincidían al decimal. El valor es
     la media de la tabla (±1 pt de ruido de bearings entre estados). */
  apartar: 4.7,

  /* CUÁNDO SE MUEVE LA FILA. Dos reglas, y las dos quedan porque cada
     una tiene un recibo que contradice a la otra:

     · 'centrar' — LO QUE HACE X, MEDIDO: la fila centra el tab activo
       en la pantalla entera (440) y choca contra el tope, interpolado
       con el avance del contenido, tocando y arrastrando. Siete
       transiciones en las grabaciones del usuario (2026-09-01) y las
       siete caen en ese modelo; la tabla está arriba de `destinos` en
       barra.tsx. Consecuencia visible: Stocks→Tech corre la fila
       45.6 pt con el dedo — "For you" sale y "Design" entra (v1,
       cuadros 203–221, fila = 44.5·t, lineal con el contenido).

     · 'visible' — LO QUE PIDIÓ EL USUARIO (2026-09-02): "solo cambia
       una vez que voy a una tab que no es visible en el viewport". La
       fila se queda donde estaba cuando el contenido arrancó y sólo se
       corre lo justo para que el tab activo entre entero (los rangos
       `minimos`/`maximos`, interpolados con el mismo avance). Con seis
       tabs eso mueve la tira en AI↔Design y Following↔For you —y en
       cualquier toque a un tab tapado—; en Stocks↔Tech no se mueve.

     PEDIDO, NO MEDIDO: la grabación del propio usuario muestra a X
     haciendo lo otro, y quedó dicho. Es una decisión consciente sobre
     la referencia, y 'centrar' está a una palabra de distancia. */
  fila: 'visible' as 'visible' | 'centrar',
} as const

export const ICONO = {
  /* EL GLIFO Y SU RANURA SON DOS COSAS DISTINTAS, y confundirlas era el
     error: el símbolo se DIBUJA de un tamaño y OCUPA otro. En la
     referencia el ícono se desborda de su ranura —pinta 16 pt de tinta
     en un lugar que mide 11— y por eso el tab activo no engorda tanto.

     Se veía en el subrayado, que es la caja del tab activo medida
     directamente. Con `tema` de 20 haciendo de ranura, los tres tabs de
     tema salían ~5 pt anchos:

                  referencia   antes   ahora
       Stocks        90.7       96.3    91.3
       Tech          77.7       82.3    77.3
       AI            58.7       64.0    59.0
       For you       92.7       92.7    92.7   (el chevron ya estaba bien)

     RUNTIME · las dos lecturas que fijan la ranura del tema, promediando
     tres tabs del clip: la tinta del ícono arranca **9.2 pt** después
     del borde de la caja, y entre esa tinta y la de la palabra quedan
     **9.0 pt**. Con ranura 11 y aire 10 dan 9.5 y 8.8.

     RUNTIME · el lado del chevron se confirmó en DOS estados del clip
     —"For you" y "Following" activos— y dieron los mismos dos números al
     décimo: **11.0 pt** entre el fin de la palabra y la tinta del
     chevron, y **11.4 pt** desde ahí hasta el borde de la caja. Con
     ranura 8 y aire 10 dan 10.9 y 11.5.

     El `extra` del chevron no cambia —8 + 10 = 18, el mismo que había—
     así que el subrayado de los feeds, que ya coincidía al decimal, se
     queda donde estaba. */
  /* El 21 del tema sale de MEDIR el único ícono de tema no-chip que la
     referencia muestra en reposo: el de Tech pinta 17.3 × 17.3 pt
     (cuadro 152 del clip, umbral 60). Nuestro `cpu` a 20 pintaba 16.3 —
     un punto corto—; a 21 pinta ~17.1. El chip de Stocks queda en sus
     16 exactos, que también están medidos: X no usa un solo tamaño. */
  glifo: { chevron: 12, tema: 21 },
  ranura: { chevron: 8, tema: 11 },
  aire: 10,

  /* EL SÍMBOLO NO APARECE QUIETO: SALE DE ATRÁS DE LA PALABRA.

     RUNTIME · en el clip, con la fila quieta, el chevron de "For you"
     entra deslizándose: su tinta arranca en 72.1 pt y termina en 84.0.
     Y el ícono de "Stocks" hace lo mismo del otro lado: 197.7 → 184.3
     en pantalla, que en coordenadas de su caja son +13.0. Los dos
     recorren **12 pt** (11.9 y 13.0), y los dos ARRANCAN unos 2 pt
     detrás del filo de la palabra:

       chevron  tinta izquierda 72.1  vs  fin de la palabra   73.3
       ícono    tinta derecha  213.4  vs  inicio de la palabra 210.7

     O sea: el símbolo nace tapado por la palabra y se aleja de ella
     mientras se enciende. Escondiéndose hace lo inverso — se mete atrás
     y se apaga. Por eso NUNCA se ve encima del texto: para cuando tiene
     opacidad suficiente para leerse, ya salió.

     EL VIAJE ES EL DE X, MEDIDO DOS VECES. Acá hubo una CUNA PROFUNDA
     (desliz 4/7: el símbolo nacía con más de la mitad metido bajo la
     palabra y recorría 17 pt) — fue un pedido del 2026-09-01 a la
     mañana, y el mismo día a la tarde llegaron tres grabaciones de la
     cuenta real de X con el veredicto: "nosotros lo hacemos diferente,
     hacelo como ellos". En esas grabaciones el sparkles de AI recorre
     ~9–13 pt de pantalla naciendo pegado al filo de la palabra
     (bbox 279→270.7 mientras la luma sube 62→255, y el bbox a opacidad
     baja subestima el glifo), o sea el mismo 13.0/11.9 que ya estaba
     medido en el clip del vault. La cuna profunda queda anotada por si
     se vuelve: desliz { izquierda: 4, derecha: 7 }.

     La cuenta, relativa a la palabra (vale en las dos transiciones):
     hueco(r) = hueco_reposo − (1−r)·(extra − desliz). Con 8 el ícono
     nace ~1–2 pt tapado por la palabra y recorre 13 pt relativos; con
     6 el chevron recorre los 12.0 medidos (tinta 72.1 → 84.0).

     Lo que hace la oclusión de verdad es el fondo del label (ver
     `brecha`): el símbolo tapado no se mezcla entre las letras —
     desaparece bajo un borde limpio.

     Y LA OPACIDAD NO ES LINEAL PARA EL ÍCONO — es r^1.5, medida cuadro
     a cuadro contra el reloj del subrayado en las transiciones de
     Stocks y de Tech del clip (abre y cierra sobre la misma curva):

       r        0.35   0.58   0.73   0.84   0.91
       medido   0.22   0.41   0.60   0.76   0.87
       r^1.5    0.21   0.44   0.62   0.77   0.87

     El CHEVRON en cambio es LINEAL, también medido (110/142 a r=0.775,
     60/142 a r=0.423, 31/142 a r=0.21): dos elementos, dos curvas.

     Y EL SÍMBOLO NO ESCALA: el ancho de la tinta del ícono es constante
     durante toda la transición (el aparente crecimiento 11→16 pt de los
     primeros cuadros es el umbral de medición comiéndose los bordes
     antialiased con opacidad baja). La escala 0.9 que había acá era
     inventada y se retiró.

     ⚠ ESTO YA SE INTENTÓ "MEJORAR" Y SE VOLVIÓ (2026-09-01). Se probó
     una ventana con `overflow: hidden` que garantizaba cero overlap por
     construcción, y encima una pluma de degradé para ablandar el borde
     del recorte. Las dos versiones medían perfecto y se veían PEOR: un
     fragmento de ícono materializándose lejos de la palabra, en vez de
     un ícono entero saliendo de atrás de ella. El pedido final vino con
     una captura de X de spec: glifo ENTERO, apenas apagado, pegado a la
     palabra. Si esto vuelve a molestar, el problema es de materiales
     —los íconos de X son chips llenos y los SF Symbols son trazos— y la
     salida es un asset propio, no otra coreografía. El recorrido entero
     está en MEDICIONES.md. */
  desliz: { izquierda: 8, derecha: 6 },

  /* LA BRECHA: el label lleva su propio fondo negro, inflado este aire
     hacia los costados (padding compensado con margen negativo, así el
     layout no se entera). Es lo que convierte "abajo de la palabra" en
     una OCLUSIÓN de verdad: los SF Symbols son trazos y entre las
     letras se veía la mezcla; con el fondo, el símbolo emerge por un
     borde limpio pegado a la palabra — una carta saliendo de abajo de
     otra. El valor es el canal negro SÓLIDO entre las dos tintas
     mientras el símbolo está pinchado en el borde (después viene la
     pluma). Arrancó en 2 (X muestra 3–4 en sus momentos visibles) y
     subió a 4 a pedido: "el espacio entre el borde y el contenido es
     muy poco" (2026-09-01, con captura marcada). */
  brecha: 4,

  /* LA PLUMA DEL BORDE DE OCLUSIÓN: el fondo del label no termina en un
     filo — termina en un degradé de este ancho, así el símbolo no se
     corta en seco al meterse atrás ("la separación es muy abrupta,
     debería ser más un gradient/fade" — pedido con captura marcada,
     2026-09-01). El techo del valor NO es gusto: la pluma arranca en
     `brecha` antes de la tinta de la palabra y NO puede alcanzar al
     símbolo en reposo, o el reposo deja de ser idéntico al píxel. El
     hueco de reposo más chico es el del ícono de tema de 17 pt: 7.5 pt
     de tinta a tinta → brecha (4) + pluma (2.5) + side bearing (0.5) =
     7.0 ≤ 7.5, con medio punto de margen. */
  pluma: 2.5,

  /* EL PISO DEL FUNDIDO del ícono de tema: por debajo de este r el
     ícono directamente no existe, y el resto de la curva se re-mapea.
     SIN RECIBO de referencia — es el "comenzar a disolver un poquito
     antes" pedido a mano (2026-09-01) para matar la sensación de
     overlap: con el piso, cerca de la palabra (r<0.15) la tinta queda
     en luma ≤ 8, que no se percibe. Costo asumido: en el instante del
     cuadro-spec (r=0.348) la luma baja de 52 a ~43 contra los 55 de X.
     Es la perilla de esta sección. */
  piso: 0.06,
} as const

/* EL CHIP DE STOCKS — el único símbolo que no es un SF Symbol pelado.

   La referencia no usa un glifo de líneas para Stocks: usa un CONTORNO
   de cuadrado redondeado con el zigzag del gráfico adentro. Está medido
   del cuadro 107 del clip (Stocks activo, en reposo), leyendo el perfil
   de tinta fila por fila y columna por columna:

     lado    48×48 px = 16 pt exactos (cuadrado, no rectángulo)
     trazo   5 px = 1.67 pt (el borde: filas 0-4 y 43-47 llenas,
             y en el medio 10 px por fila = 5 de cada lado)
     radio   la curva del vértice arranca ~11 px del borde → ~4 pt
     zigzag  cruza las filas 14..42 → 9.7 pt de alto

   Y LA LÍNEA NO ES NINGÚN SF SYMBOL — se probó `waveform.path.ecg` y
   su perfil no es el de X: el ecg tiene una línea de base plana que en
   el chip se veía como una raya horizontal, y le falta la montaña. Así
   que la línea se dibuja con BARRAS ROTADAS siguiendo el esqueleto
   MEDIDO del clip (y media de la tinta por columna, bordes excluidos):

     col   6    9.5   18.5   28    36    41     (px, chip de 48)
     y    25.5  30.5  18.0   28.0  22.5  24.5

   O sea: arranca al medio pegada al borde izquierdo, baja a un valle,
   sube al PICO máximo, baja a un segundo valle, sube a un pico chico y
   muere en el borde derecho. Seis vértices, cinco segmentos. El trazo
   de la línea da ~4.3 px de huella vertical en pendientes de ~50°, o
   sea ~1.5 pt.

   El chip mide los 16 pt de tinta que el marco de 20 ya reservaba, así
   que el layout del tab no se mueve ni un punto. */
export const CHIP = {
  lado: 16,
  trazo: 1.67,
  radio: 4.5,
  linea: 1.5,
  /* Los vértices del zigzag, en pt y en coordenadas del chip ENTERO
     (el borde incluido): la tabla de arriba dividida por 3. */
  vertices: [
    [2.0, 8.5],
    [3.2, 10.2],
    [6.2, 6.0],
    [9.3, 9.3],
    [12.0, 7.5],
    [13.7, 8.2],
  ],
} as const

/* Lo que crece un tab cuando se vuelve activo: la ranura del símbolo más
   el aire que lo separa de la palabra. El GLIFO no entra en la cuenta —
   se desborda de la ranura, como en la referencia. */
export const extraDelTab = (lado: 'izquierda' | 'derecha' | undefined) =>
  lado === undefined ? 0 : (lado === 'derecha' ? ICONO.ranura.chevron : ICONO.ranura.tema) + ICONO.aire

export const BORDE = {
  /* El `+` vive en un cuadrado de 44 —el mínimo táctil de la HIG—
     pegado al borde derecho. No es una elección cómoda: con 44 pt
     alineados a la derecha, el centro del glifo cae a 22 pt del borde,
     y en la referencia el `+` está a 22.3 pt medidos. Sale solo. */
  mas: 44,

  /* El tamaño del símbolo `plus`, y va suelto del tamaño del label a
     propósito: a 17 pinta 13.0 pt de tinta, que es EXACTAMENTE lo que
     mide el `+` de la referencia. Atarlo al label lo movería cada vez
     que se toca la tipografía, y no hay ninguna razón para que el botón
     siga al texto. */
  simboloMas: 17,

  /* LA RAMPA, y esto NO es un degradé largo que llega hasta el borde —
     que fue el primer modelo y estaba mal.

     RUNTIME · el perfil se reconstruyó barriendo el clip entero: un
     label inactivo sin máscara pinta 142, así que en cada columna de
     píxeles el pico de tinta más alto de todo el clip dice cuánta
     máscara hay ahí. Como los labels se mueven, por cada columna pasan
     letras distintas y el máximo llega a la cobertura entera del glifo.

       381 pt → 0.69    390 pt → 0.30
       384 pt → 0.60    393 pt → 0.18
       387 pt → 0.46

     Ajustando la recta: opacidad 0 en 373.8 pt y opacidad 1 en 396.9.
     O sea **23 pt de rampa**, y ese 396.9 es justo donde arranca la
     caja del `+` (395.3). Y de 396 a 408 no aparece tinta en NINGÚN
     cuadro del clip: ese pedazo es negro sólido, no degradé.

     El primer modelo era un degradé suave de 84 pt hasta el borde de la
     pantalla. Coincidía en 381 y después se quedaba largo: en 390 daba
     0.60 contra los 0.30 medidos, y en 393 daba 0.56 contra 0.18. Por
     eso el tab siguiente se veía demasiado y llegaba pegado al `+`. */
  rampa: 23,

  /* EL AIRE ENTRE EL ÚLTIMO TAB Y EL `+`, con la fila al tope.

     RUNTIME · en la referencia, con el scroll al máximo, la caja del
     último tab termina en 391.7 pt y la caja del `+` arranca en 395.3
     (44 pt pegados al borde de una pantalla de 440). O sea que la fila
     corre hasta quedar prácticamente contra el botón: 3.6 pt de aire,
     no los 12 del inset con que arranca del otro lado. La fila no es
     simétrica, y tiene sentido — del lado izquierdo el inset separa del
     borde de la pantalla, del derecho ya hay un botón haciendo de tope. */
  respiro: 4,

  /* CUÁNTO SCROLL RESTANTE HACE FALTA para que el degradé esté entero.
     Porque el degradé NO está siempre: se apaga cuando la fila llegó al
     final. Está medido en la referencia, en el estado con "Design"
     activo y el scroll al tope — ahí Following, Stocks, Tech y AI dan
     los CUATRO la misma luminancia (153), o sea que no hay ninguna
     máscara encima. Y el tab activo llega blanco puro hasta 391.7 pt,
     bien adentro de la zona donde el degradé taparía.

     Tiene sentido: el degradé dice "sigue habiendo cosas para allá". Si
     no queda nada, mentiría. 24 pt es la distancia sobre la que entra;
     no está medida, es la única perilla de esta sección que no lo
     está. */
  desvanece: 24,
} as const

export const CABECERA = {
  /* DERIVADO · en la referencia, el avatar y el logo de X tienen su
     centro vertical en el MISMO punto: 83.8 pt los dos, medidos por
     separado. El borde superior del tab bar cae en 106 pt. Si el
     contenido va centrado, la cabecera mide 106 − 2×(106 − 83.8) =
     44 pt — el mismo alto que la barra de tabs. */
  alto: BARRA.alto,

  /* RUNTIME · el avatar mide 96 px de alto = 32 pt. Horizontalmente la
     lectura da 29.3, pero eso es el contenido: la foto es oscura contra
     el fondo negro y los bordes del círculo no llegan al umbral. Nada
     estira la lectura vertical, así que 32 es el diámetro. */
  avatar: 32,

  /* El avatar arranca a 22.7 pt medidos. Acá va a 24, que es
     `inset + padding` — o sea el borde de la caja del primer label. Se
     elige la regla y no el número: 24 es una alineación que la pieza
     puede sostener cuando cambien los tabs, y 22.7 es un valor suelto
     que no quiere decir nada. La diferencia es 1.3 pt. */
  inset: BARRA.inset + BARRA.padding,
} as const

export const PLIEGUE = {
  /* EL DESVANECIDO DE LO QUE VA ENCIMA DEL BLOQUE mientras sube con el
     scroll: opacidad = 1 − subida / (recorrido · desvanece). O sea: se
     apaga del todo al 94 % del recorrido. Es una FRACCIÓN del recorrido
     y no un número de puntos porque el bloque de X es más alto que el
     nuestro (tiene el pill de Spaces) y lo que se copia es la regla,
     no el tamaño: acá el recorrido es 88.3 y el fundido dura 83 pt de
     scroll. El fondo del bloque y el divisor no se desvanecen; el
     mecanismo entero está arriba de `pliegue.tsx`.

     RUNTIME · sonda: el subrayado (2 pt de tinta plena, #000 sobre #FFF
     en la grabación clara del 2026-09-02). Su luma L contra la
     traslación D del bloque, bajada 1:

       D    8.0  14.7  21.0  26.7  32.3  38.3  44.0  49.3  55.0  61.0  66.7  72.7
       L     18    28    38    48    58    68    77    88    97   109   120   133

     y en las otras tres fases lo mismo (bajada 2: 15→28, 33→58, 53→94,
     72→133; vuelta 1: 71→129, 44→79, 27→47, 20→35, 3→8; vuelta 2:
     65→117, 49→87, 35→60, 13→26). L = 1.8·D en todo el rango (±3), o
     sea α = 1 − L/255 = 1 − D/142, con un recorrido medido de 151.6:
     142 / 151.6 = 0.94. Los labels dan la misma pendiente.

     No es 1 − D/recorrido ("transparente justo al frenar"): esa recta
     queda 5 % por encima de la tabla entera. Por encima de D≈80 la
     tabla se aparta un poco más rápido todavía (una línea fina y tenue
     la comprime el códec), así que el valor sale de D < 75. */
  desvanece: 0.94,
} as const

export const SUBRAYADO = {
  /* RUNTIME · el subrayado ocupa las filas y=444..449, o sea 6 px
     exactos. La 450 ya es el divisor. */
  alto: 2,

  /* LAS PUNTAS SON REDONDAS — cápsula, no rectángulo.

     RUNTIME · masa de tinta por fila del run, en CUATRO reposos de las
     grabaciones del usuario (For you, Tech, AI y Design activos): las
     filas de borde pierden −3.1 px por punta doble, las siguientes
     −0.85, las del medio 0 — y una cápsula de radio 3 px (= alto/2)
     predice −2.7 / −0.8 / 0; la diferencia es el antialiasing
     diluyendo la esquina. Los cuatro estados dan la MISMA firma, o sea
     que el radio es el máximo posible: la mitad del alto. */
  radio: 1,
} as const

export const LABEL = {
  /* MEDIDO CONTRA EL RESULTADO, no calculado desde el cap.

     La primera versión hacía la cuenta al revés: cap medido 10.33 pt ÷
     0.7046 (el cap ratio de SF Pro) = 14.66, redondeado a 15. Y 15
     RENDERIZA de más — con la pantalla en la mano, "Following" salía
     65.7 pt de ancho y 10.67 de cap contra los 62.3 y 10.00 de la
     referencia. Un 5% grande.

     Así que el número sale de la proporción entre lo que pinta la
     pantalla y lo que pinta el clip, que es una medición contra otra:
     15 × 62.3 ÷ 65.7 = **14.2**. A ese tamaño el ancho da 62.2 (contra
     62.3) y el cap 10.1 (contra 10.0–10.33, que es el rango que dieron
     dos capturas distintas de la referencia).

     Es fraccionario a propósito. 14 sería más prolijo y cae dentro del
     error de la referencia —daría 61.3 de ancho— pero acá el número
     redondo es el que hay que justificar, no el medido. */
  tamano: 14.2,

  /* DERIVADO · el asta vertical de la `l` de "Following" mide 5 px =
     1.67 pt (RUNTIME). 1.67 ÷ 15 = 0.111, que es el ratio de asta del
     Semibold de SF Pro (Regular ≈ 0.078, Medium ≈ 0.092, Bold ≈ 0.13).

     Y va UN SOLO peso, para los dos estados: se comparó "Following"
     activo contra inactivo letra por letra y los desplazamientos son
     idénticos (0, 23, 49, 60, 71, 94, 129, 141, 165 px). El label
     activo no es más grueso — es más blanco. */
  peso: '600',

  /* ESTE TAMAÑO NO ESCALA CON DYNAMIC TYPE, y es una decisión con costo.

     React Native trae `allowFontScaling` prendido, así que un teléfono
     con el texto del sistema en chico achica también estos labels. Se
     comprobó con el simulador, cambiando `simctl ui content_size`:

       large (default)   Following 65.7 pt de ancho, cap 10.67
       small             Following 59.0 pt,          cap  9.33
       extra-small       Following 55.7 pt,          cap  8.67

     Y el teléfono de prueba, en extra-small, daba exactamente 55.7 y
     8.67 — mientras que X, EN ESE MISMO TELÉFONO Y ESE MISMO MOMENTO,
     medía 62.3 y 10.00. O sea que **X no escala sus tabs**, y por eso
     acá tampoco.

     El costo está dicho: alguien que agranda el texto del sistema no ve
     estos tabs más grandes. Se acepta por dos razones. La primera es que
     copiar el comportamiento de la referencia es el punto de la pieza.
     La segunda pesa más: esto se GRABA y se compara con el clip cuadro a
     cuadro, y una medida que cambia con un ajuste del sistema hace que
     dos tomas de la misma pieza no sean comparables.

     El layout no depende de esto: los anchos se miden con `onLayout`,
     así que si algún día se vuelve a prender, todo se re-acomoda solo —
     lo único que se pierde es el parecido con la referencia. */
  escala: false,
} as const
