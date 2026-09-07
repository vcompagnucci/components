# Exposición

Playground/exposición de componentes estilo design-engineer: piezas web,
web-mobile y nativas, cada una perteneciente a UNA plataforma, mostradas
en una página única. Sin código a la vista, sin instalación — es una
exposición, no una librería instalable.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build
pnpm typecheck
```

**Cómo funciona todo** —el recorrido de un clip del vault al playground y
de ahí a la exposición pública, el mapa del repo, la frontera entre lo
privado y lo que se publica, y qué hace falta para arrancar en un
worktree nuevo— está en **[AGENTS.md](AGENTS.md)**. Es lo primero que
hay que leer.

El sistema completo —cada token, su valor en los cinco viewports, su
grado de evidencia y las reglas que gobiernan lo que falta— está en
**[DESIGN.md](DESIGN.md)**. Acá va el registro de cada decisión y por
qué se tomó así.

## Decisiones tomadas (y de dónde salen)

| Decisión | Valor | Fuente |
| --- | --- | --- |
| Formato | Exposición de una página; cada pieza tiene **URL propia** (`/button`). **Sin router**: son dos vistas, `history.pushState` alcanza. El atrás del navegador vuelve a la lista **y al scroll donde estabas**; entrar directo por link también funciona | la decisión original era "estado, sin rutas", tomada cuando el detalle era un rectángulo vacío. Al confirmarse que lleva notas, no poder linkearlas pasó a ser una pérdida real |
| ↳ condición de deploy | El host tiene que servir `index.html` para rutas desconocidas (fallback SPA). Vite ya lo hace en dev y en preview | es lo único que impone tener rutas de verdad en vez de hash |
| ↳ el ítem es un `<a href>`, no un botón | Clic normal navega del lado del cliente; cmd-click y clic del medio abren pestaña nueva | **medido en benji:** su ítem de lista es `<a href="/drawesome">`, el clic da **0 pedidos de documento** y cmd-click abre pestaña. Era un `<button>` con `pushState`, y eso costaba cmd-click, clic del medio, *"abrir en pestaña nueva"* y *"copiar dirección"* del menú contextual, más que un lector de pantalla anunciara **"botón"**. El interceptor deja pasar toda tecla modificadora y todo botón que no sea el principal; sólo el clic pelado se vuelve navegación de cliente |
| ↳ y conservamos lo que él no hace | **restaura el scroll al volver** | benji vuelve a la lista en scrollY 0, medido. Nosotros guardamos la posición y la devolvemos — verificado en 1500 → 1500 |
| ↳ lo que queda por chequear | el Tab en un Safari real | en Chromium el foco llega al ancla con su anillo de 2px y radio 8, y Enter navega. En el WebKit de Playwright el Tab no llega **ni al ancla ni a un `<button>`** —lo medí en los dos— así que el entorno no puede responderlo. Safari tiene una preferencia (*"Press Tab to highlight each item on a webpage"*) que gobierna si los links entran al orden de tabulación, y eso sí hay que verlo en el navegador de verdad |
| Display | Segmented: una pieza por fila, título arriba, preview grande | ídem |
| La caja de la pieza | **Altura fija, nunca proporción** | seis casos medidos entre los dos (`.context/recon/CARDS.md`): lo que corre lleva altura elegida a mano, lo quieto deja mandar al contenido. Ninguno usa `aspect-ratio` para algo vivo |
| ↳ Web | **260** en la lista, **400** al abrir. Como `min-height`, o sea un piso | los dos de benji, y la relación entre ellos también: dentro de una página larga sus demos miden 260 (×4 de 21), y cuando el demo **es** la página el frame de /drawesome mide 400. Sus 20 demos no cambian de alto en ningún viewport — medido a 1440, 768, 500, 390, 320 |
| ↳ App | **Sin altura**: reserva el hueco del teléfono (**228**×448 en la lista, **319** al abrir) y la altura sale de ahí más 40/60 de padding. Da 528 y 707 | de benji · family-values, que tampoco declara altura ni tiene una sola media query en esas clases. Barrido de 13 anchos: la suya y la nuestra ceden en **395 exacto**, sin copiar ningún breakpoint |
| ↳ el costo | Abajo de 396 el detalle de App deja de ser más grande que la lista | ahí el ancho útil ya está debajo de los 228, los dos huecos topean contra el mismo número y dan el mismo alto |
| La piel de la card | **Más oscura que la página, sin anillo y sin sombra**: el contraste hace todo. `--surface: #f8f8f6`, −5 respecto del canvas | es la regla de josh, medida (`#fafaf9` sobre blanco puro, −5) y elegida contra la de benji, que es la opuesta: card al ras del fondo (−1) definida por una línea de 1px. Lo que había era card más **clara** que el fondo **más** un anillo al doble del suyo — las dos señales en contra |
| ↳ se traslada el delta, no el valor | Copiar su hex `#fafaf9` sobre nuestro canvas daría **−3**, no −5 | su página es blanco puro y la nuestra arranca 2 unidades abajo. Copiarle el color y copiarle el contraste son decisiones distintas y caen en escalones distintos |
| ↳ radio | **8** | censo de las 7 páginas: para cajas grandes hay dos números y no hay un tercero — benji **8** (50 usos en family-values, 4 en liveline) y josh **12** (11 en su home). El resto son one-offs de una sola página: su 14 hero, el 16 de las cajas de `<img>`, el único 32 de bloom. El 8 es el más repetido de las dos juntas, el único que **las dos** usan en cajas grandes, y múltiplo de 4 — que el 14 no es. En controles chicos los dos coinciden en 4 y 6 |
| ↳ hover | Oscurece el relleno y nada más: ni sombra, ni escala, ni movimiento. Paso de **−4** desde el reposo, a `#f4f4f1` — elegido entre −3, −4 y −5, o sea medio escalón suyo | sus cajas de demo no reaccionan porque **no son clickeables**. Su regla es **un escalón** de su rampa, y se ve en los únicos dos hovers que tiene: cards de la home `neutral-50 → neutral-100`, botón de bloom `stone-700 → stone-600`. El del botón **aclara**, así que la regla es un paso y no una dirección. Antes acá decía −10 contra su página: ese delta salía de medir contra el blanco de /pasito, y el hover ocurre en su home, que es `#fafafa` |
| ↳ press | **No hay.** El `:active` pinta idéntico al `:hover`, en los cuatro modos | en las **23 páginas** de las dos referencias más altas (9 de benji, 14 de josh) hay **un solo `:active` vivo**: un botón de 40×40 en `/honkish` que ni baja ni escala — le quita el anillo de 1px que le puso el hover (`box-shadow` spread 1px→0px, `transition-duration .02s` leída en runtime). Su press no agrega un estado, **retira** el hover. Las listas de los dos —el mismo objeto que esta card— no tienen press. Y `active:scale-[0.94/0.96/0.98]` existe en el bundle de josh y lo usa **cero** elementos |
| ↳ lo que se retiró al decidirlo | `--surface-press: #f0f0ec` con sus tres ramas, y `--dur-press: 20ms` | eran el `--color-bg-level-3` de linear —que cae justo en nuestro paso siguiente— y la asimetría de benji. Los 20ms estaban bien medidos pero aplicados **al revés**: en su botón sirven para quitar el hover, no para profundizarlo. Cuando la pieza Button necesite un press se mide para un botón, que es donde esa evidencia sí aplica |
| ↳ y se descartó el mecanismo de benji | atenuar las hermanas a `opacity .3` | **es cuestión de escala, no de gusto.** Su lista son 7 filas de 41px que **se tocan** (hueco 0px), 286px en total = 0.3 pantallas: se ve entera de una y el gesto es sobre *la lista*. La nuestra son **8 pantallas** y a 1440×900 se ven **2 cards**, así que "se apaga el resto" sería literalmente *la otra*. Nuestra card es 7.3× el área de una fila suya. Aparte él atenúa **texto** —el `h2` y los `span` del `time`, con `span:last-child` exento para que la columna de años quede encendida— y nunca una superficie: no tiene ninguna |
| ↳ curva y duración | **Todo partido por propiedad.** Superficie: `--ease-surface: cubic-bezier(.23,1,.32,1)` + `--dur-surface: 150ms`. Texto: `--ease-text: ease` + `--dur-text: 100ms` | **linear no elige una curva, elige por lo que se anima.** Sus tres cards con hover usan ease-out sin excepción y 25 de sus 46 transiciones de color terminan en `ease` (54%). El valor de ease-out es el de `/review-animations`, catálogo línea 32, *"strong ease-out for UI"*; el de texto lo respaldan cuatro fuentes: benji (cada transición de su bundle), josh a mano (`.company-link` ×18), linear (54%) y las tres skills |
| ↳ la duración partida es composición nuestra | 100 para texto, 150 para superficie | **ninguna referencia parte la duración**: benji usa 100ms para las dos familias (`background-color` ×10, `color` ×23) y josh 150 para las dos (`background-color` ×11, `color` ×21 a mano). Se toma el número de benji para el texto y el de josh para la superficie. Elegido mirando: a 100ms el hover de la card son 6 cuadros en vez de 9 y con Δ4 queda casi como un encendido seco; en el texto, con Δ101, los 100ms se leen justos |
| ↳ y la flecha de volver es la excepción | Va con el par de **superficie** en sus dos propiedades | anima fondo **y** color, así que con el corte por propiedad terminarían en momentos distintos —150 el fondo, 100 el color— y se leería como dos cosas. Es la regla de elementos apareados de animations.dev: *"lo que se mueve junto tiene que sentirse como una unidad"*. **La regla completa: manda la propiedad, salvo cuando un elemento anima las dos familias — ahí manda el elemento** |
| ↳ divergencia consciente en el valor | La familia sale de linear; el número sale de la skill, y **no coinciden** | linear usa ease-out en sus cards pero nunca este valor: sus tres usan quad, la palabra clave y cubic. Declara el quint entre sus 18 curvas de Penner y lo usa **una** vez en todo el sitio. Si mañana se prefiere lo que ellos ship-ean, quad es `cubic-bezier(.25,.46,.45,.94)`, su caballo de batalla con 60 usos |
| ↳ y el hover queda **simétrico** | 150 entrando y 150 saliendo | **vuelta atrás:** había escrito que tres fuentes pedían asimetría y era falso. La regla asimétrica de linear existe (`.rWdRxW_card` con `:hover{transition-duration:var(--speed-highlightFadeIn)}`, FadeIn `0s`) pero vive en `ContactLink.css` y renderiza **cero** elementos — mismo error que las utilidades `active:scale` de josh. La card que sí renderiza, `.Dc5tqa_customerCard` ×24, es simétrica. Barrido en vivo sobre 5 páginas de linear: **21 elementos hovereables con transición, 0 asimétricos**; la lista de benji y la fila de josh también. Y los otros dos acuerdos no eran de hover: los 20ms de benji son de un `:active` y el *pointer-down* de Apple es del press — el estándar 9 nombra textualmente *"press-and-release or hold"*. Un press es deliberado y merece acuse instantáneo; un hover es incidental, y 150ms funciona de amortiguador. La asimetría queda anotada para el press, con la pieza Button |
| ↳ y las dos que había estaban mal | se fueron `--ease-fill` y `--ease-out` | `--ease-fill` se horneó como *"la curva de josh"* y **no lo era**: las **21** apariciones de `cubic-bezier(.4,0,.2,1)` en sus tres páginas salen todas de una utilidad de Tailwind —`transition-colors`, `-all`, `-transform`, `-opacity`— y **ninguna** de su CSS. Es el default del framework. Y `--ease-out` era un quint-out heredado de Carousels, que es la curva de **entrar y salir**, cosa que en esta página no pasa nunca. El quint no se guarda por si acaso —un token sin lector es código muerto— pero su valor queda escrito en DESIGN.md para el día que una pieza entre o salga |
| ↳ y los dos cambiaron de nombre | `--dur-fill` → `--dur-color`, y la curva a `--ease-color` | lo pide la **regla 4** del propio sistema, el nombre es el rol. `fill` era el rol cuando el único lector era el relleno de la card; hoy son cuatro y tres no rellenan nada |
| ↳ el título NO entra en el relleno | Se pinta sólo el rectángulo; el título queda afuera, sobre el canvas | **una sola referencia lo hacía, no tres.** La de josh vale: su `<a class="block rounded-xl px-4 py-3">` de 580×76 lleva el título adentro y el hover pinta el bloque entero. Las otras dos que había citado no aplican y se retiran: la `.demo-card` de agentation tiene **cero reglas `:hover`**, `transition: all 0s`, `cursor: auto` y no está dentro de ningún link —es un dibujo estático, que sea una caja rellena con un título adentro no dice nada sobre el hover— y benji **nunca rellena nada**, el fondo de su fila es `rgba(0,0,0,0)` en todos los estados. Y el bloque de josh contiene **sólo texto**: título más descripción. El nuestro contendría un marco vacío de 260px, que no es el mismo objeto |
| ↳ lo que se probó y se descartó | Un bloque que sangra 16px hacia afuera (592×292, radio concéntrico 24) con título y card fundidos en una superficie sola | se armó en el prototipo y anda: el título no se mueve un píxel, la card sigue en 560 y el ritmo vertical se conserva con las tres sangrías. No se descartó por no funcionar, se descartó por falta de respaldo |
| ↳ hover pegado en touch | El hover del índice va detrás de `@media (hover: hover)`. **Es el único gate por puntero del sistema** | el artefacto aparece donde el toque **deja el elemento en pantalla**: tocar un link del índice sólo scrollea, así que el `:hover` se le pega, y como hover y activo pintan el mismo color el pegado es indistinguible del verdadero. Medido en un iPad Pro horizontal: tocar "Switch" y scrollear lejos dejaba **dos** links pintados. La card no lo necesita porque tocarla la desmonta, la flecha de volver tampoco, y en WebKit un solo toque alcanza en las dos. El corte cae justo: el índice se ve arriba de 1080px y el único dispositivo medido que llega ahí sin mouse es el iPad Pro horizontal (1194px, `(hover:hover)` false). Ninguna de las dos referencias gatea nada por puntero — cero `(hover:`, `(pointer:` y `(any-hover:` en los dos bundles |
| ↳ canvas y tinta, ahora verificados | `#fdfdfc` y `#111111` | venían del design.md de Carousels sin poder verificarse. Son literalmente los de benji: sus variables declaradas dicen `--body-bg:#fdfdfc` y `--body-color:#111` |
| Grises de texto | **UN nivel secundario: un alfa, dos bases.** `--secundario-alfa: 37%`, aplicado desde negro puro (anotación → **160**) y desde `--ink` (nav → **166**) | es la estructura de benji, verificada en su CSS servido: declara **un solo** token de color de texto (`--body-color:#111`) y **ningún** token de gris. Todo lo gris es su negro o su ink a un alfa, y `.4` domina con 40 declaraciones contra 8 del siguiente. Sus "dos grises" (152 y 159) son ese mismo 40% desde dos bases — no es un escalón, es la fuga de escribir la regla en dos archivos. Con `α=.4` nuestras dos bases reproducen sus 152 y 159 clavados: eso valida el modelo |
| ↳ el alfa se eligió en dos pasos | **el barrio** con slider sobre la anotación sola (163), **el número** con un barrido de seis alfas donde las dos se mueven juntas (37%) | el slider movía **un renglón** de la página, porque ahí la nav todavía era un número aparte: sirvió para ubicar la zona. El barrido se miró de tres formas —rampa de corrido, los dos derivados **en contacto**, y el texto real a 13/16 contra 14/20— porque un salto de 6 unidades en 13px es invisible si los mirás separados. La anotación terminó 3 más oscura que el 163 del slider: ΔL .006, adentro del ruido |
| ↳ la nav se movió de 159 a 166 | consecuencia buscada de la regla | venía copiada de su `hsla(0,0%,7%,.4)` al hornear la tipografía del índice y **nunca se eligió**. Bajo esta regla no se elige: se deriva |
| ↳ y el orden se arregló solo | la nav queda **más clara** que la anotación, como en su página | antes era al revés (163 anotación contra 159 nav). Ahora no es una decisión: cae de que `--ink` es más claro que negro puro. Gap 6; el suyo 7 |
| ↳ los dos quedan bajo APCA | Lc **50** y **47**, contra los 60 que pide para texto que no es cuerpo | benji también: 54 y 50. Se acepta a conciencia — lo que va en gris acá **anota**, no se lee. Cruzar el piso pedía `α=45%`, que en el barrido se vio demasiado oscuro para el rol |
| ↳ el contraste se mide componiendo | `rgba(0,0,0,.4)` da **2.84:1**, no 20:1 | hay que componer el alfa sobre el fondo antes de calcular. Sin eso se puntúa como negro puro y todos los números salen mal |
| Cómo se usa el color | **Todo lo que se LEE va en ink**; el gris es sólo para lo que **anota** | regla de benji, medida en cuatro de sus páginas. Por eso **la descripción del detalle pasó a ink**: es prosa. Le quedan al gris el subtítulo del masthead y la plataforma del detalle, que es el rol de su `<time>` bajo el `h1` |
| ↳ activo del índice | No llega al ink: se queda en **65** | su CSS pone hover y activo en la misma declaración, `hsla(0,0%,7%,.8)`. La pieza que mirás se destaca sin ser lo más oscuro de la pantalla |
| Selección de texto | La de benji: `#ededed` de fondo y el texto **forzado a ink** | las tres tienen regla global y no dicen lo mismo — josh invierte (`#fff` sobre `#000`), emil pone **sólo fondo** (`#e2e1de`) y no toca el color. Lo que decide es forzar: emil puede no hacerlo porque su secundario está en 99; el nuestro está en 160 y sobre su fondo da **2.00:1**, ilegible justo mientras lo seleccionás. Forzado a ink, 16.13:1. Y no es regla nueva: es "todo lo que se lee va en ink" aplicada a un estado |
| ↳ acá el hex sí se copia literal | `#ededed` tal cual, sin trasladar delta | primera vez en todo el sistema. Su canvas es `#fdfdfc` y el nuestro también — el de emil igual (`--color-gray-100:#fdfdfc`). En card, hover y grises hubo que trasladar el delta porque los fondos no coincidían; acá coinciden |
| Modo oscuro | **Sí, disparado por el sistema como josh.** Y no es una paleta escrita a mano: son **cuatro números** —profundidad 9 · calidez .003 · ink 250 · tono 106.4— y todo lo demás cae de dos reglas | de las cinco referencias medidas sólo josh tiene tema oscuro **de página**: benji y emil tienen paletas oscuras en su CSS pero para componentes embebidos, y linear fuerza `data-theme="dark"` e ignora el sistema. El canvas 9 es el de linear (`--color-bg-level-0:#08090a`), el ink 250 es el de josh (`--foreground:#fafafa`) |
| ↳ regla 1 · el texto conserva el **contraste** | ink 104.1→**104.4** · anotación 50.3→48.1 · nav 46.7→42.5 · activo 92.9→**93.4** | tiene un piso de legibilidad que las superficies no tienen, así que se sostiene el Lc y no el número. El 59.2% del secundario sale del **×1.6** que benji aplica en sus dos tokens con alfa (`.28→.45` y `.10→.16`, el mismo factor dos veces). El 93% del activo no conserva el alfa sino su **posición** entre la nav y el ink: en claro el 80% cae al 80.4% de ese recorrido, y en oscuro hace falta 93% para caer igual |
| ↳ regla 2 · todo lo demás conserva la **distancia** e invierte la dirección | claro `−5 −9 −16 −36 −151` → oscuro `+5 +9 +16 +36 +151`; los alfas, mismo número y base dada vuelta | lo de los alfas es de **linear**: su `--color-border-translucent` es `#0000000d` claro y `#ffffff0d` oscuro, ×1.00 — y `#0000000d` es 5.098%, nuestra `--hairline` a tres decimales. Es un compromiso y no una ley: conservar la distancia da ~1.5× de ΔL, así que la card **es** algo más notoria en oscuro; conservar el ΔL exacto la dejaba en +3 e invisible, y emil (×3.00) y linear (×4.48) agrandan mucho más por robustez entre pantallas. **APCA no puede arbitrarlo**: devuelve 0.0 para todas las superficies |
| ↳ lo que hizo posible el ink de 250 | reescribir el secundario como **una base y dos alfas** en vez de un alfa y dos bases | derivando la nav del `--ink`, el ink quedaba atrapado: tenía que entrar ~17 unidades desde el extremo o las dos bases se aplastaban. Eso forzaba un ink de 238 y dejaba el texto 7.5 Lc bajo el claro. El valor claro no se movió —`negro@34.4%` da los mismos 166 que `ink@37%`— y es la estructura que benji usa para su nav en reposo y activa |
| ↳ `color-scheme: light dark` | ninguna de las cinco referencias lo declara | sin eso el navegador auto-oscurece controles nativos y scrollbars y la página queda mitad y mitad |
| Alto contraste | `prefers-contrast: more` cubierto en los dos modos. **Los dos grises se colapsan en uno** — alfa 57.4% claro, 78.8% oscuro — y todas las distancias que no son texto se duplican | **primera decisión de color sin ninguna referencia**: cero ocurrencias de `prefers-contrast` en los cinco bundles. La regla la pone `/better-colors` — ensanchar el gap de L ≥0.15 y verificar contra los umbrales **preferidos** de APCA (90 cuerpo, 75 no-cuerpo). El ink ya pasaba con 104; la anotación (50) y la nav (47) no |
| ↳ el colapso lo decide la aritmética | el alfa para llegar a Lc 75 sale **el mismo** para los dos roles | las dos apuntan al mismo número, así que convergen. Y está bien: esa distinción era de 3.6 Lc en su mejor momento, justo el tipo de sutileza que alguien pidiendo más contraste quiere que desaparezca. Sobrevive la jerarquía que carga significado, ink contra secundario |
| ↳ el gap se ensancha más de lo pedido | **0.153 a 0.194** contra el 0.15 mínimo | llegar al umbral de APCA ya lo cubre en los cuatro casos, así que manda el umbral y no hace falta un segundo cálculo |
| ↳ y lo no-textual se duplica | card −5→−10 · hover −9→−18 · selección −16→−32 · subrayado −36→−72 · alfas de línea al doble | esto **no** lo pide el skill, es criterio nuestro: bajo alto contraste la estructura también tiene que leerse. Una regla en vez de cuatro números. El hover del subrayado va a `--ink` porque duplicar sus 151 se sale del rango, y el anillo corre un escalón de acento (\|Lc\| 77.8→87.9 claro, 34.8→48.7 oscuro) |
| ↳ links | **Sin color propio**: heredan el del bloque y los marca un subrayado de 1px `#d9d9d9`, que en hover pasa a `#666`. El texto no se mueve | **dos de las tres referencias hacen esto** — benji con un pseudo-elemento, emil con `text-decoration-color #bcbbb5` a 1.5px. Se usó el mecanismo de emil con los valores de benji: nuestro texto es 14px, no 16 |
| Foco | `2px solid #005fcc`, **offset 2px**, sin transición | el color es el anillo por defecto de **Chromium, medido del motor**: enfoqué un botón sin estilos en los tres y leí el píxel pintado — Chromium `#005fcc` sólido, WebKit `#0067f4` **al 50%** (el glow de Aqua), Firefox `#007aff` sólido. Gana Chromium por ser el más grave y el de más contraste, \|Lc\| **77.8** claro y **34.8** oscuro sobre el piso de 30 de APCA. Su par oscuro `#347ee5` sale de subirle la L con el ΔL que aplican benji y josh a sus acentos; el mismo cálculo sobre el azul de Firefox da `#3f9aff` contra el `#3d9bff` medido de benji, **una unidad**. El `transition:none` es de benji |
| ↳ dos cosas que salieron de medirlos | el azul que teníamos **era el de Firefox**; y WebKit pinta el suyo **al 50% clavado** | `rgba(0,122,255,.5)` heredado de benji es `#007aff`, el que pinta Firefox. Y el compuesto de WebKit da `(127,179,249)` a la unidad, o sea que el mecanismo del anillo viejo de Safari era el que ya teníamos |
| ↳ `outline-offset: 2px`, de josh | y no es adorno | sin él el anillo **corta las letras** de los links del índice, que son texto sin padding. Reemplaza el `padding:0 2px / margin:0 -2px` con el que benji despega el suyo, sin tocar el layout. En la card el outline sigue el radio 8 solo |
| ↳ y destapó un bug de layout | el flex estiraba cada link del índice a los **89px** del más largo | las palabras miden 31–62, así que el anillo dibujaba hasta **58px de vacío**. Con `align-items: flex-start` cada uno mide su palabra — que es lo que benji tiene por naturaleza, porque sus links son `<a>` inline |
| Nav | **Índice fijo a la izquierda** con todas las piezas agrupadas. Sin tabs. A 80 del borde, 13px/460 al 40%, 8px entre links, ancho ajustado al label más largo | recorridas 13 páginas de las dos referencias: **ninguna usa tabs**, las dos navegan con índice fijo. Medido en `.context/recon/NAVIGATION.md` |
| ↳ los rótulos `Web`/`App` | **Siempre visibles**, y pesan **lo mismo que sus links** — no son encabezados, son la primera línea de su grupo. Lo que los separa es sólo el aire: **16px**, el doble de los 8 que hay entre links | es lo de benji, `nav h2` y `nav ul li a` idénticos propiedad por propiedad, con `padding:0 0 1rem` en el rótulo y `gap:.5rem` en la lista. Medido en su página, no sólo en su CSS: su índice llega vacío en el HTML y lo llena JS |
| ↳ dónde arranca | **"Web" se apoya en la misma línea que "Button"**, el título de la primera pieza. Da 237 a 1440 de ancho. Se alinea por la **base** del texto y **se mide**, no se calcula | elegido mirando con reglas rojas encima, contra otros cuatro pares (link↔pieza 205 · rótulo↔separador 186 · rótulo↔masthead 82 · los 80 crudos de benji). Se mide porque el número es la suma de todo el apilado de la página: como `calc` sería una fórmula que nadie actualizaría |
| ↳ **con** scrollspy | La pieza que estás mirando se pinta (en **65**, ver arriba). Activa es la última cuyo borde superior ya pasó una línea a **128px** del tope, más un guarda al final del documento | es la regla de benji, sacada de su bundle: su fórmula lleva medio viewport de los dos lados y se cancela. Antes acá decía "sin scrollspy" — se revirtió |
| Separador de sección | Rótulo 14px/600/#111 + hairline hasta el borde del riel; hueco de 8px, 64px arriba, 56px abajo | el separador de benji en /liveline y /drawesome, medido en vivo — su `<hr>` está vacío, lo que pinta es el div que React le envuelve |
| Para qué existe el detalle | Para **las notas y el aire**: el porqué, las decisiones y los números, más la pieza sola en pantalla y más grande. La lista muestra, el detalle explica. No es sólo una pieza agrandada | con preview vivo en la lista, el detalle no aporta la pieza (ya la tenías): aporta lo que la rodea |
| ↳ y la descripción va **debajo** de la pieza | Arriba queda `título + plataforma`; la prosa entra después del preview, a **24** | pedido de Vito el 2026-09-04, y es orden de lectura y no un valor: primero se ve la cosa, después se lee qué es. Lo que gana de paso es que arriba queda **exactamente** el par medido de benji —su `h1` con su `time` a 4px— sin un tercer renglón que él no tiene. El 24 no se eligió mirando: se reusa el `margin-bottom` del bloque de arriba para no tener dos números para la misma relación (texto contra la pieza). Queda para pasarle el scrubber |
| Espaciado de la lista | Aire arriba/abajo **80 → 32** · masthead→sección **60** · rótulo→pieza **40** · nombre→card **12** · entre piezas **48** · entre secciones **64** · rótulo↔hairline **8** · subtítulo **4**. **Todos múltiplos de 4** | elegidos con scrubber sobre la página real. Los 40, 48 y 64 son de benji, medidos; el resto se decidió acá. Detalle en `.context/recon/NAVIGATION.md` |
| ↳ nombres de los tokens | **Dueño → parte → propiedad**, al modo de apple: `--page-padding-top`, `--section-content-gap`, `--piece-card-gap`, `--index-group-gap`. **La escala `--space-*` se borró entera** | medido en 1.3 MB de CSS servido de apple, linear y openai. Apple: `--buystrip-content-padding`, `--media-gallery-bottom-content-padding-left`. Linear más corto: `--button-gap`, `--kbd-gap`. OpenAI intermedio: `--page-top-gap`, `--tabs-sticky-gap`. **Ninguno de los tres tiene un token nombrado por su valor** — no hay un solo `--space-4` en los tres bundles. Y los tres comparten que el nombre es el ROL y el valor es contextual: el `--button-gap` de linear vale 4, 6 u 8 según el tamaño |
| ↳ ×4 en layout, libre en componentes | Todo espaciado de **layout** es múltiplo de 4. **Adentro de un componente no rige** | es lo que hace benji: usa 2, 3, 5, 6 y 10 —el 6px aparece 28 veces— pero **sólo** en `.Toolbar_*`, `.BarSlider_field`, `.submitButton` y variantes `[data-size=sm]`. Ni uno solo en layout de página. Misma forma que su regla de pesos: los valores sucios existen para compensación e internos, nunca para la estructura. Hoy no tenemos nada interno — la card está vacía y el único componente es la flecha del detalle, que es andamio |
| ↳ el número es el hueco visible | `--gap-label` es de la línea al primer texto, no el `margin-bottom`. La línea va centrada en la caja del rótulo, así que el CSS descuenta esa media caja calculándola desde `--fs` y `--lh` | el margen decía 32 cuando el hueco real era 41.5: dos números para la misma distancia. El que manda es el que se ve |
| ↳ agrupación | rótulo→pieza (40) tiene que ser menor que entre piezas (48), o el rótulo se despega de su grupo y lee como flotando entre los dos | venía de 56, que era mayor: la agrupación estaba invertida |
| ↳ masthead título → subtítulo | **4**, y 8 de aire abajo del masthead entero | es el de benji y acá el análogo es **exacto**: su `<header>` es el mismo par que el nuestro —un `h1` y una línea secundaria, los dos de 14px con interlínea 20— con `display:flex; flex-direction:column; gap:.25rem; padding:0 0 .5rem`. Verificado en el HTML servido de su home, no sólo en la hoja. Como los dos textos son del mismo tamaño la interlínea ya los separa: los 4 son un empujón. Los 8 de abajo ya los teníamos. Josh usa 16, pero su `h1` es de 30px contra un párrafo de 16 |
| ↳ título de pieza → card | **12**, constante en todo ancho. El nombre va **arriba** de la card. El aire lo **reclama el bloque de abajo** (`margin-top`), no lo empuja el título. **Elegido a ojo con scrubber sobre la página real, no copiado** | ninguna referencia tiene nuestra estructura —una lista de pares [nombre corto + card grande] repetida 19 veces. Benji en /liveline hace de cada sección UN bloque; su home es una lista de filas de texto sin bloque. Lo más cercano es josh en /pasito: `h2` de 20px/500 seguido **directo** de una card de código, a **16** (`mt-4`), en "Usage" y "Autoplay Usage" — los dos casos donde va del título al bloque sin nada en el medio. Donde muestra el componente **visualmente** mete una descripción entre los dos, que no es nuestro caso. Se probaron 12 y 16 con las 19 piezas apiladas y ganó 12; su `h2` además es de 20px y el nuestro de 14, así que sus 16 cuelgan de un título más grande. La **forma** sí está copiada y verificada en su página real: el contenedor de su gráfico lleva `style="margin-top:2rem"`, o sea que el bloque reclama su margen en vez de que el título lo empuje |
| ↳ una retractación que vale la pena guardar | El 12 se había justificado con la timeline de benji (`h2` 14/500 + bloque a `.75rem`). **Era falso**: `timeline` no aparece ni una vez en el HTML de /liveline — es CSS de otra página. Con eso también se cayó un supuesto caveat sobre una línea vertical con círculos que nunca existió | leí reglas que existen y di por hecho que se veían. Mismo error que con el `<hr>`. Una regla en el CSS no es una regla en la pantalla: si la conclusión depende de lo que se renderiza, hay que mirar el HTML servido, no sólo la hoja de estilos |
| Categorías | **Web** y **App**, las dos siempre visibles (no hay filtro). El corte es navegador vs app instalada, que es la línea que de verdad cuesta cruzar. Bajo App conviven SwiftUI y Expo/React Native (los dos renderizan vistas nativas reales) | el runtime es la propiedad honesta: "iOS" subdeclaraba las piezas de Expo, que también corren en Android |
| ↳ App, no Mobile | **App** corta en el mismo eje que Web (¿dónde corre?); **Mobile** contesta otra pregunta (¿en qué pantalla?), y mezclar dos ejes es lo que ya rompió `Web / Web Mobile / Native`. Decisivo: un sheet web pensado para teléfono es *web y mobile* a la vez — con Mobile el corte se rompe y hay que inventar una regla; con App esa pieza es Web y listo. Mobile se entiende medio segundo más rápido, pero al lado de "Web" el contraste desambigua sola | la colisión no es hipotética: Vaul (Emil Kowalski, referencia del proyecto) es exactamente un drawer mobile-first que corre en el navegador |
| Demos nativos | **Lo decide `platform`, y nada más.** Web va viva en el navegador, App va en video — **Expo incluido** | antes se decidía pieza por pieza porque Expo *podía* ir vivo vía react-native-web. Al pasar Expo también a video, la regla **colapsó en la categoría** y el campo `runtime` que la sostenía dejó de tener sentido: se borró el tipo. El dato original sigue siendo cierto —`expo-haptics` mapea a la Web Vibration API, que Safari no soporta— pero ya no hay nada que decidir por pieza |
| Elevación | **No hay, y es una decisión.** Cero `box-shadow` en todo el producto: la card se define por contraste contra el canvas | medido en cuatro páginas de referencia. benji home **0** sombras, josh home **0**, josh interface-craft **0**, y las **52** de benji/family-values son *todas* `0px 0px 0px 1px` — cero blur, cero offset: bordes dibujados con `box-shadow`, no elevación. **En las cuatro no hay una sola sombra con blur.** `/better-ui` pide lo contrario ("sombras para elevación, bordes para estructura") y benji hace justo eso al revés; se sigue a las referencias, que es de dónde salió todo el resto |
| z-index | **Cero, y todavía no es decidible** | hoy nada se superpone — el índice es `fixed` pero vive en el margen. josh no tiene ninguno en sus dos páginas; benji sólo en `family-values`, su única página con demos interactivos. Es nuestro mismo reparto: el chrome no necesita apilado, las piezas sí. Cinco de las 18 son capas (Dialog, Sheet, Tooltip, Context Menu, Action Sheet) y la escala se decide con la primera, no antes |
| La flecha de volver | **Pinta el glifo, no el cuadrado**, y llega a `--activo-c` (65 claro / 233 oscuro) en 100ms `ease`. El cuadrado de 34×34 se queda invisible como área de click, y el radio de 8 porque el `outline` del foco sigue el `border-radius` | **unánime en las dos referencias**, medido en vivo: benji `.styles_backButton` 122×28, radio 0, `transition: color 0.1s`, `rgba(0,0,0,.4)` → `rgba(0,0,0,.8)`; josh `"Home"` en /melt-effect 62×20, neutral-400 → neutral-900. Los dos: **no pintan fondo, cambian el color, no se mueven**. Y los 0.1s de benji son exactamente el `--dur-text` que ya teníamos |
| ↳ el destino es el 80%, no la tinta | 65, no 17 | es lo de benji, que **no llega a su tinta**: para en 51 sobre su canvas. Nosotros paramos en 65 porque el 80% se escribe desde nuestra base de ink y no desde negro puro — la misma estructura de *un alfa, dos bases* que rige los grises de texto. Se descartó la tinta (17, lo que hace josh) y el nivel del hover de texto (102, `--link-underline-hover`): el segundo unificaría todo lo que reacciona al puntero en un color, pero en oscuro cae en 160 contra un reposo de 155 — **cinco unidades, invisible** |
| ↳ y el token perdió el nombre del componente | `--index-activo-c` → **`--activo-c`** | tenía el índice como único lector; hoy son **tres** —el activo del índice, su hover y el hover de la flecha— en dos componentes. Por la **regla 4**, el nombre es el rol, y el rol es el nivel que marca *"ésta"*: porque la señalás con el puntero o porque es donde estás. Que las dos cosas compartan color es de él: escribe `nav ul li a:hover` y `nav ul li[data-active=true] a` en **una sola declaración** |
| ↳ y se cayó la excepción del par | ya no existe | la flecha era el único elemento que animaba superficie **y** texto, y por eso tomaba el par de superficie en las dos propiedades. Ahora anima una sola familia: la regla vuelve a ser **manda la propiedad, y punto**. De paso murió `--a1`, cuyo único lector era ese fondo — se fue de las cuatro ramas, y el comentario que decía *"lo usa el foco"* nunca fue cierto |
| Motion | **La página no tiene animación de entrada.** Abrir una pieza y volver no anima nada. Lo único que se mueve es el hover, y son cambios de color y de anillo, no de posición | había `enterFwd`/`enterBack` y una entrada del detalle. `enterBack` además **nunca se disparaba**: `data-dir` estaba escrito a mano en `"fwd"`. Se sacaron las tres en vez de arreglar la que faltaba |
| ↳ sin bloque de reduced-motion | No hace falta: **no queda movimiento que reducir**. El scroll suave del índice sí lo consulta, en `app.tsx` | los cuatro lugares con transición cruzan un color —índice, relleno de la card, botón de volver, subrayado de los links— y ninguno desplaza, escala ni rota. Verificado con `reduced-motion: reduce`: la card sólo declara `transition-property: background-color`. Deja de ser cierto el día que entre una escala, y ahí hay que escribirlo |
| ↳ la fuente | **InterVariable self-hosteada**, el archivo oficial de rsms.me subseteado a latin. Cuatro archivos por `unicode-range`: **102 KB** es lo único que carga una página en inglés, contra 343 del original. Conserva los dos ejes, `opsz` 14–32 y `wght` 100–900 | **no es la de Google Fonts**, y la diferencia es concreta: pidiéndole `family=Inter:opsz,wght@14..32,100..900` devuelve CSS con **cero** menciones de `opsz` — ignora el eje. Nuestro `body` usa `font-optical-sizing:auto`, que sin ese eje no hace nada. Benji usa la de Google vía `next/font`, así que **él no tiene `opsz` y nosotros sí**. Mantenerlo cuesta 36 KB y se paga a propósito |
| ↳ por qué dejó de venir del CDN | Era un `<link>` bloqueante a `rsms.me`, el sitio personal del autor, no un CDN de producción | si no cargaba, el matching de CSS convertía **460→500 y 560→600** y la jerarquía se derrumbaba. Desde nuestro origen, si falla la fuente ya falló todo. Y los dos referentes self-hostean: ninguno carga de un CDN |
| ↳ suavizado de fuente | `-webkit-font-smoothing: antialiased` **y** `-moz-osx-font-smoothing: grayscale`, las dos | acá la jerarquía **es** el trazo —460 · 500 · 600, todo a 14px— así que si Firefox dibuja los tres escalones más pesados no se ve "un poco distinto": se ve **menos jerarquía**. Benji tiene las dos en su `body` (SOURCE) |
| Tipografía | **El sistema de benji**: un solo tamaño (14px), jerarquía por peso **460 · 500 · 600** — tres, no cuatro. Tracking **−0.00563rem**, interlínea **20px** (su `1.25rem`, absoluta y no razón). Índice 13px/460, tracking −0.0025rem, lh 16 | elegido con un picker contra el sistema de josh sobre la página real. Todos los valores del CSS servido de benji.org: su texto de 14px lleva `line-height:1.25rem` y `letter-spacing:-.00563rem` en **todas** sus reglas, sin excepción. Los dos sistemas medidos en `.context/recon/TYPE-SYSTEMS.md` |
| ↳ por qué no josh | Josh usa lo opuesto en sus subpáginas: **cinco tamaños** (30·20·16·14·12), **dos pesos** (400/500) y una escalera de **cinco grises** (23·64·82·115·163). Su costo era competir con las piezas — y obligaba a rehacer todos los espaciados verticales, afinados para texto de 14 | medido del markup servido de `/bloom`, `/dialkit`, `/melt-effect`, `/on-being-an-elder` y `/pasito`: su `h1` es el mismo string en las cinco |
| ↳ la escalera de pesos | **Library 500 · sección 600 · pieza 500**, cuerpo 460. El título de página **no** es lo más pesado: lo son los rótulos de sección | es lo que hace benji, verificado end-to-end — `.article > header h1` es 500 y el separador de /liveline es un `h1` **dentro** de `<article class="article">`, así que cae en `.article h1{font-weight:600}` (confirmado por posición en el HTML servido). Su razón es funcional: el título se lee una vez y su rango ya se lo da la posición, solo arriba y rodeado de aire; los encabezados de sección se buscan muchas veces en medio de contenido, y ahí el peso es el que los hace encontrables. **El peso va donde está el trabajo, que es escanear** |
| ↳ tres pesos, no cuatro | El **560 quedó fuera**. La escala en uso es 460 · 500 · 600 | tres es donde está el consenso de sistemas de diseño ([EightShapes](https://medium.com/eightshapes-llc/typography-in-design-systems-6ed771432f1e): *"some systems can get away with as few as two or three weights"*). El 460 no se puede sacar porque es el cuerpo. Y el 560 que teníamos salía de `.article h2` —un sub-encabezado dentro del artículo— y no del separador que copiamos, que es el `h1` a 600 |
| ↳ nunca un salto menor a 40 | Dos niveles de la misma jerarquía se separan por **40 o más**. Se descartaron pesos intermedios (520, 540) por esto | el conteo completo de sus `font-weight` da 100·200·400·430·450·460·500·560·600·620·700·800, o sea que sí tiene saltos chicos — pero **430** es para cursivas (`\.article em`: la itálica se ve más pesada y la compensa bajando 30) y **450** para internos de componente. Son compensación óptica y one-offs, nunca escalones de jerarquía |
| ↳ el costo aceptado | "Library" y el nombre de pieza **empatan en 500**. Y la palabra "Web" sale dos veces: 600 en el separador, 460 al 40% en el índice | el empate es el precio de bajar a tres pesos: a esos dos los distingue la posición y el contexto. Lo de "Web" estuvo abierto y se cerró aceptándolo: no son dos pesos que casi empatan, son un encabezado y un renglón de lista |
| ↳ lo que se corrigió al hornear | El tracking era **−0.004rem**, que no es de nadie. Había **tres interlíneas**, dos escritas a mano (`1.3` en los títulos, que no existe en el CSS de benji; `1.2` en el índice, que sí es suyo). El rótulo de sección estaba en **600** cuando el `h2` de benji es **560** | la página era un híbrido que nadie había decidido |
| ↳ tokens por rol | La tipografía dejó de vivir hardcodeada por clase: cada rol (`--type-h1-*`, `--type-h2-*`, `--type-h3-*`, `--type-body-*`, `--type-meta-*`, `--type-nav-*`) es un juego de tokens. Las interlíneas van en **px**, no como razón | hizo falta para poder montar los dos sistemas candidatos, porque no son variantes del mismo: benji comparte un tamaño entre todos los roles y josh le da uno a cada uno. Se queda porque es donde vive el peso de cada rol, que si no vuelve a esconderse en su clase |
| Cómo responde al viewport | **Escalona, no interpola** — la manera de benji. Un solo escalón en **768** que mueve dos cosas juntas: aire superior 80→32 y margen 16→24. El índice se va en **1080**. Cero `clamp()`, cero `vw` | medido de los cuatro CSS servidos de benji y del markup de cinco subpáginas de josh (`.context/recon/RESPONSIVE.md`). Josh es lo contrario: **cero escalones en el marco** — 142 clases en `/bloom`, ninguna con prefijo responsive, 672·24·64 desde 320 hasta 2560. Se prefirió que la página responda y no que se quede igual en todo ancho |
| ↳ el margen hace dos trabajos | **16** arriba de 768, **24** abajo. Arriba de 768 el riel está centrado con aire de sobra y el padding es vestigial: sólo angosta la columna. Abajo de 582 el riel *es* el viewport y ese mismo padding pasa a ser la única distancia al borde de la pantalla | es exactamente lo que hace benji (`padding: 5rem 1rem 2.5rem` → `2rem 1.5rem 2.5rem`), y explica por qué el número no es constante sin ser incoherente |
| ↳ el índice en 1080 | Se esconde bajo **1080**, no bajo 1200 | 1080 es el de benji (`@media(max-width:1080px){…{display:none}}`), y su índice está fijo a 80/80, que es de donde salió el nuestro. El 1200 anterior no salía de ninguna de las dos referencias: era nuestro y nadie lo había decidido |
| Aire superior | 80px, y **32 bajo 768px** | CSS de benji.org (`padding: 5rem`). Medido al píxel: a 769 son 80, a 768 son 32. Antes estaba en 640, heredado del DESIGN.md de Carousels |
| Masthead | "Library" (600) + una línea gris debajo. El subtítulo no cambia de tamaño: sólo peso y color | benji (`h1` 500 ink / `time` 460 al 40%) y josh (nombre y descripción al mismo tamaño, sólo cambia color) |
| Copy del subtítulo | *Components for web and native apps that feel right.* "Feel right" es el estándar de calidad que usan Emil (h1 de animations.dev: *"How do you craft animations that feel right?"*) y Josh (*"Software that feels right"*). Ninguno de los dos usa "crafted" como adjetivo: *craft* les es verbo o sustantivo, y la calidad la nombran con *feel right*, *care* o *taste*. Afirma el resultado, no el esfuerzo | copy medido de animations.dev e interfacecraft.dev |
| Riel | **592** = 37rem justos. Con el margen de 16, la columna queda en **560** = 35rem | elegido con el scrubber sobre la página real, entre el de benji (582, su 36.375rem) y el de josh (672, 42rem). Los dos números caen en rem enteros, cosa que no pasaba con ninguno de los dos extremos. El anterior era 832, del DESIGN.md de Carousels, y nunca se había mirado contra esta página |
| Aire inferior | **80**, el mismo número que arriba. **No escalona** en 768 como el de arriba | no sale de las referencias: las dos cierran corto (benji 40, josh 64) porque abajo tienen footer y nosotros no vamos a tener, así que ese aire es el final de la página y no una separación. No escalona a propósito: los 80 de arriba se recortan porque en un teléfono son pantalla muerta antes de leer nada, y los de abajo sólo se ven si scrolleaste hasta el fondo. Benji hace lo mismo — escalona el de arriba y deja el de abajo quieto |
| Colores/espaciado | Tokens heredados del DESIGN.md de Carousels (solo tipografía, colores y tamaños) | `src/tokens.css` |
| Stack | Vite + React 19, versiones exactas, CSS plano + CSS Modules | — |

## El área privada — vault y playground

Dos cosas en un mismo lugar y con distinta responsabilidad: el **vault**
es la pared de referencias que mirás, el **playground** es donde
construís. Ninguna de las dos se publica.

Lo medido de las referencias está en `.context/recon/vault/GRILLA.md`.

| Decisión | Valor | Fuente |
| --- | --- | --- |
| No se publica | `/vault` y `/playground` existen **sólo en dev**, y no porque el host las bloquee sino porque **el código no llega al build** | dos pliegues sobre `import.meta.env.DEV`: la lista de rutas se pliega a `[]` y el componente a `null`. Verificado: **0** ocurrencias de `vault`, `playground` y `privado`-como-ruta en `dist/`, **0** imports dinámicos, un solo chunk. En producción `/vault` cae en la misma rama que cualquier URL inventada — 404, sin regla especial |
| ↳ el borde es una carpeta | todo lo que cuelga de `src/privado/` hereda la puerta | un flag repartido por archivos se olvida; un directorio no. La dependencia va en **un solo sentido**: lo privado puede importar del producto, nunca al revés |
| Dónde viven los clips | En una carpeta **tuya, fuera del repo** — puede ser tu Obsidian. `VAULT_DIR` en `.env.local`, gitignoreado | ni un clip entra a git. Sin prefijo `VITE_` a propósito: con él, Vite hornearía la ruta de tu disco en el bundle del cliente |
| ↳ el puente | plugin de Vite `apply:'serve'` que sirve esa carpeta en `/vault-media/` | en `vite build` ni se instancia. **38 chequeos HTTP** en verde |
| ↳ tres guardas | lista **blanca** de extensiones de video e imagen · nada que empiece con punto · `realpath` de los dos lados | la blanca importa de verdad si apuntás esto a tu Obsidian: un `.md` no se sirve nunca, y no porque una regla lo bloquee sino porque no está en la lista de lo que sí. La de punto cierra `.obsidian/` y `.trash/`. La de realpath impide que un symlink camine para afuera |
| ↳ una guarda que faltaba | la de realpath estaba **sólo al servir**, y el índice llegó a listar un symlink a `/etc/hosts` como un mp4 de 213 bytes | no se podía descargar, pero su tamaño y su fecha ya estaban publicados. Ahora está escrita una vez y la usan los dos caminos. La agarró el vault de prueba, que tiene casos hostiles a propósito |
| ↳ Range requests | implementadas en el puente, no en el reproductor | son propiedad del **transporte**: sin ellas Chrome no puede buscar dentro del video y Safari directamente no reproduce, y llegar al cuadro exacto es todo el punto. Chrome real y WebKit cargan, buscan al medio exacto y saltan 1/60s |
| ↳ nota de entorno | las pruebas de video van con **WebKit o `channel:'chrome'`** | el Chromium que trae Playwright se compila sin H.264 y falla con código 4 sobre bytes que los otros dos reproducen bien |
| La carpeta es el manifiesto | nombre, fuente y fecha se **derivan** del archivo y de dónde lo soltaste. No hay JSON que mantener | un manifiesto a mano se desincroniza el día que arrastrás un archivo sin editarlo, y entonces el vault miente. Así no puede |
| La grilla | 3 columnas · canaleta **32** · filas **64** · título→caption **8** | filas y título→caption son donde **linear.app/now y el archivo de figma coinciden exacto**, así que se toman sin discutir |
| ↳ el riel | **80** a cada lado, cayendo a `--page-padding-inline` abajo de 768 | no es un número nuevo: es el mismo 80 del aire superior y del índice lateral. A 1440 deja la grilla en **1280**, que da exacto el contenedor de linear — convergencia, no búsqueda |
| ↳ la canaleta va limpia | 32 sin línea, la de figma, contra los 64-con-línea de linear | su línea de 1px existe **porque sus cards no tienen fondo**: sin ella nada separaría una columna de otra. La nuestra es una superficie pintada con su propio borde, y una línea encima competiría con él |
| **La forma de la caja** | la card de **benji** en family-values: `padding 40/60`, radio 8, flex centrado, el clip adentro con ancho explícito y la **altura mandada por el contenido** | sus clips y los de figma son **todos apaisados**; los nuestros van de **0.46** (grabación de teléfono) a **1.60** (captura de escritorio). No hay referencia que copiar, así que se probaron las tres respuestas obvias con `/prototype` y las tres fallan: 16:9 conteniendo deja al vertical como una tira entre dos campos vacíos, 16:9 recortando le corta arriba y abajo —donde viven el sheet y la tab bar— y dejar que la caja siga al clip da 881px contra 253 |
| ↳ qué hace él, medido | 45 cards **en una sola columna**, 550 de ancho fijo y **cinco alturas**: 532 ×17 · 475 ×12 · 443 ×8 · 346 ×7 · 368 ×1 | su respuesta a las formas distintas es **no imponer ninguna**. `532.42 = 40 + 448.42 + 40 + 4` — la altura la manda el contenido. Se lo permite tener una columna |
| ↳ y ya eran tokens nuestros | `--card-app-padding` y `--card-app-slot-ancho` salieron de medir **esta misma card** para la página de piezas | no se agrega nada al sistema, se reusa |
| ↳ **todas la misma altura**, y es **contra** él | **574px** | él deja mandar al contenido —por eso sus 45 cards tienen **cinco alturas**— y puede porque tiene **una columna**. En tres, la altura variable deja filas desparejas de hasta **209px** y eso se lee como error, no como variedad. El 574 es el punto donde **nuestro** clip vertical llega a los **228** exactos que él le da al suyo: abajo de eso el teléfono se achica por falta de alto. Elegido contra 418 (su proporción sobre nuestra columna) y 532 (su altura literal); lo que los separa es cuánto del hueco llena la imagen — **574: vertical 100%, apaisado 36%** · 532: 91/39 · 418: 68/53 |
| ↳ abajo de 768 vuelve a mandar el contenido | la altura fija se suelta | con una columna no hay vecina con la que emparejarse, así que clavarla sólo agregaría aire — y con una columna, ése es el caso de benji exacto |
| **Sin epígrafe** | debajo de la card va **sólo el nombre**: ni fecha ni categoría | las dos referencias lo llevan (linear autor y fecha, figma categoría y fecha) y se va igual: en un vault ninguna de las dos anota nada. La categoría ya la dice el filtro, que es donde la usás, y la fecha no distingue nada porque **todos los clips entran el día que los arrastrás**. En sus páginas son artículos con autor y fecha de publicación, y ahí sí dicen algo. La fecha **sigue ordenando** la grilla; lo que se fue es mostrarla |
| **Sin flecha en el hover** | la superficie oscurece y nada más | la flecha era la de linear, medida — pero **su** tarjeta la necesita porque nada más le cambia al pasar el puntero: sin ella no habría señal de que es clickeable. La nuestra oscurece la superficie entera (regla de josh, ya en el sistema), así que la flecha era una segunda señal diciendo lo mismo |
| ↳ el borde no se copia | sin anillo ni sombra | la regla de josh ya está decidida en `tokens.css`: la card se define por contraste. Se copia la geometría, se respeta lo decidido |
| ↳ ancho explícito, siempre | el teléfono a **228**, el resto al 100% de la caja | ninguna de sus 45 cards deja que el archivo decida su tamaño. Sin esto un clip más chico que la caja se dibuja a su tamaño natural: una imagen de 1×1 daba una caja de **81px** de alto |
| **Una card son tres capas** | el componente · **su** fondo, que viene del archivo · y `--surface` alrededor, **siempre presente** — y el hueco es **uno solo para todas las fuentes** | Vito, mirando la grilla: *"el tamaño ese de componente, más su fondo que viene del video, y después nuestro fondo siempre presente"*. Con dos reglas —web llenando la card, native con aire— la tercera capa faltaba en web (RUNTIME a 1440: `Shelf to card` pintado 442.64×424.94 en una card de 442.66×424.94, **aire 0.01 × 0**) y las bandejas no podían medir lo mismo. Hubo ida y vuelta: se unificó, se revirtió porque nadie lo había pedido y achicaba los clips de web, y volvió cuando sí se pidió |
| ↳ **el ancho baja a 2/3** | de **78.1818%** (430/550, benji) a **66.6667%**. El alto no se toca: **84.8485%** = 448/528, suyo | el 78.18% sólo ataba cuando el archivo es más ancho que alto, y **6 de 8** clips de `nativo/` son cuadrados o casi: salían todos al mismo tope, **346.06**, con 48.3 de aire al costado contra 39.4 arriba. A 2/3 el tope es **295.11** y el aire lateral **73.78**. No hay referencia detrás del número y queda dicho: es el redondo que achica lo cuadrado y no toca lo que tiene forma de teléfono, porque a eso lo ata el alto (`Floating bar` 1320×2868 → 165.85, intacto). Verificado a 1440, 900, 700, 500 y 390 |
| ↳ **las bandejas miden lo mismo porque los archivos son 1:1** | la regla sola no alcanza: con `contain` el tamaño lo decide la **proporción del archivo** | los clips con bandeja que no eran cuadrados se rellenaron con **su propio fondo** hasta 1:1 — `Shelf to card` 1800×1728 → 1800×1800, `Floating bar` 1320×2868 → 2868×2868. El relleno no es un color pintado sino sus propias filas/columnas de borde extendidas: pintar un color caía **2 niveles** distinto por la conversión RGB→YUV y se veía la costura. Resultado: **siete bandejas a 295.11×295.11** exactos. El precio: en `Floating bar` el teléfono pasa de 166 a 136px de ancho, y `Copy text` deja de llenar la card (295×283 con superficie alrededor) |
| ↳ una trampa de ffmpeg, anotada | `scale` **preserva el aspecto de display** y `vstack`/`hstack` heredan el SAR del primer input | estirar una tira de 2 filas a 36 (1800×2 → 1800×36) le pone **SAR 18:1**, y el archivo entero sale marcado así: el navegador lo veía como 32400×1800 y lo dibujaba de 16px de alto. `setsar=1` después del apilado, siempre |
| ↳ lo que rompe, anotado | el diálogo de subir muestra **Native** y **Web** con las mismas clases para que elijas *cuál se ve mejor* — y ahora **se ven iguales** | `fuente` sigue decidiendo la carpeta y la solapa del filtro; lo que dejó de decidir es el encuadre, que era lo que ese diálogo ponía a la vista. Queda sin resolver a propósito: volver a diferenciar el marco, o pasar el diálogo a preguntar por la carpeta con palabras, es una decisión aparte |
| ↳ el orden de la grilla se toca en el disco | `birthtime`, con `SetFile -d` | la grilla ordena por `creado` y la carpeta es el manifiesto, así que no hay campo de orden que agregar: se cambia la fecha del archivo. Las originales quedan anotadas en `.context/marco-vault/originales/fechas.txt`, con los archivos originales al lado de cada re-encode |
| El hover | **la superficie oscurece y nada más**: la imagen no se mueve, no escala y no se oscurece aparte | medido en linear: en toda su tarjeta lo único que cambia es `opacity 0→1` y `translateX(−2→0)` en 100ms — una flecha. Acá esa flecha se sacó, ver arriba |
| **Corrección: el zoom de benji no existe** | `react-medium-image-zoom` está en su CSS servido pero renderiza **0 elementos** en `/`, `/family-values`, `/liveline`, `/drawesome`, `/honkish` y `/pixelmelt` | mismo caso que las utilidades `active:scale` de josh. Tampoco hay hover con escala: el único `scale` que toca una card es **estático** (`1.06`, para que la captura sangre bajo el bisel del teléfono) |
| ↳ lo que sí hace en cada card | un toggle de velocidad **1x / 0.5x** arriba a la derecha — 45 en family-values, 34 en honkish | 28×20, 12px/460, radio 38, `#989897`, dos `<span>` que se cruzan por opacidad, `all .2s ease`. Es evidencia directa para el reproductor |
| ↳ nota de método | una sonda dio *"0 reglas `:hover` en toda la página"* y era **falso**: el número real es 68 | sus hojas son de otro origen, `sheet.cssRules` tira excepción y la sonda las salteaba en silencio. Contra CSS de otro origen hay que capturar el **texto** de la respuesta, no leer el CSSOM |
| **La sidebar del lienzo se pliega con `⌥⌘S`** | y **no hay control a la vista**: el chrome del lienzo no cambia en nada | el atajo es el de Apple, no uno nuestro — [Mac keyboard shortcuts](https://support.apple.com/en-us/102650): *Option-Command-S* oculta o muestra la sidebar en Finder, y es el mismo en Mail, Notes y Xcode. Se mira `e.code === 'KeyS'` y no `e.key`, porque en un teclado Mac ⌥+S produce `ß`. Arranca **visible** y no se recuerda entre vistas ([Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars): no ocultarla por defecto). **Verificado**: abierta, la geometría es idéntica al píxel a la de antes — panel `0..240`, chevron `31..47`, nombre `26..201`; plegada, la tela pasa a `0..1440` |
| ↳ quién paga el layout | un `padding-left` en `.lienzo`; el panel sale del flujo y viaja en `transform`, con transición de **CSS** | es la arquitectura de GitLab. De cuatro sidebars de producción medidas bajo carga —la ingenua, Notion, Linear y ésta— es la única que sigue a 60fps con la CPU **6× frenada**. Notion anima `transform` y Linear anima `left` y **pierden cuadros a la par**: las dos usan `requestAnimationFrame`. Lo que decide es el **driver**, no la propiedad — y plegar un panel pasa justo cuando el hilo principal está ocupado |
| ↳ y los frames se re-acomodan al **volver** | se escucha `transitionend` de `padding-left`, no el cambio de estado | desplegar le come 240px a la tela, y un frame dejado en esa franja queda afuera. Al apretar la tecla la tela **todavía mide lo de antes**, así que medir ahí no ve nada. Se filtra por propiedad **y por target** porque `transitionend` burbujea: verificado, al lienzo le llegan también el `color` de un `input` y el `transform` del `aside` |

### El reproductor

Existe para una cosa: llegar al cuadro exacto donde arranca un gesto,
contar hasta donde termina, y sacar la duración en milisegundos. Lo
medido está en `.context/recon/vault/REPRODUCTOR.md`.

| Decisión | Valor | Fuente |
| --- | --- | --- |
| Botón de play | **38×38**, glifo de **20×20**, `opacity 100ms linear` + `transform .2s ease`, deshabilitado en **.32** | **apple**, de su `inline-media-ui`. Renderiza en **28 videos** de `/apple-vision-pro`, no es una regla muerta. El color del icono **no** lleva transición en su reproductor —cambia de golpe— y acá tampoco |
| ↳ los iconos son nuestros | dos formas triviales con `currentColor` | de él se copian las **medidas**, no el arte. `currentColor` hace lo mismo que su `mask` + `background-color` —el color del icono es una propiedad CSS— con una pieza menos |
| Velocidad | **28×20**, 12px/460, radio 38, `all .2s ease`. **Dos estados (1x · 0.5x), no un menú** | **benji**, y renderiza en **45** elementos de family-values y 34 de honkish |
| ↳ el cross-fade | dos `<span>` superpuestos con `inset:0` que se cruzan por opacidad | suyo, y no es adorno: *"1x"* y *"0.5x"* no miden lo mismo, así que sin esto el botón cambia de ancho y salta todo lo que tiene al lado |
| **Dónde van los controles** | una **fila debajo del video** | elegido mirando, y **no es de ninguno de los dos**: apple ancla abajo a la derecha *encima* del video, benji arriba a la derecha, y los dos medidos no pueden tener razón a la vez. Debajo nada tapa el clip, y al estar sobre el canvas no necesita scrim ni blur — usa los colores del sistema tal cual. Se probó la variante "esquinas" con el scrim exacto de apple y perdió |
| **La pista** | riel de **2px**, sin perilla | **sin referencia medible**, y se dice así: Safari tiene el shadow root **cerrado** en los dos motores, `apple-events` no monta sus controles headless, y Podcasts y x.com piden login. Es nuestra. Se probaron fina/media/oculta y ganó fina: a ese grosor deja de ser un control que compite y pasa a ser una lectura. Usa `--hairline` y `--ink`, sin ningún color nuevo |
| **Sin botones de cuadro** | el paso vive **sólo en las flechas del teclado** | estuvieron —dos flechas de 24px al lado del play— y se sacaron. El teclado es más preciso y se puede mantener apretado. Apuntarle a un botón chico mientras mirás otra cosa es el trabajo que este reproductor tiene que ahorrar |
| ↳ los modificadores | sola **1 cuadro** · **option 10** · **command a los bordes** (inicio / final). `shift` sigue haciendo lo mismo que `option` | son las tres distancias que se piden de verdad: el cuadro exacto, cruzar un gesto entero, y volver al principio para contarlo otra vez. **Verificado en `Reminders App.mov` (256 cuadros)**: 0→1→2, option 2→12→22→12, command→255, command→0, y clampea en los dos extremos sin pasarse |
| ↳ y command+flecha lleva `preventDefault` de verdad | sin él, back/forward del navegador | es el atajo nativo de historial: sin cortarlo, "ir al final del clip" te saca de la página. **Verificado: la URL no cambia en ninguno de los dos sentidos** |
| ↳ y eso destapó un bug real | el listener escucha en el **documento**, no en el foco del reproductor | estaba atado al foco y fallaba en el caso más común: clickeás el video para pausarlo, el clic cae en el `<video>` y el marco nunca toma el foco, así que desde ahí las flechas no hacen nada. **Verificado: tras clickear para pausar, `activeElement` es `BODY`.** Ahora sólo existe mientras hay un clip abierto |
| ↳ pero el foco **sí** importa para las flechas | en un **campo de texto** el reproductor no las toca; en un **botón** sí | la ficha de al lado tiene título, fuente y notas, y ahí `option+flecha` es saltar de palabra y `command+flecha` ir al borde de la línea: robárselas rompe lo que en mac se hace sin pensar. Los botones no usan flechas, así que después de apretar play seguís yendo cuadro a cuadro. **Verificado con el caret adentro del título: la flecha mueve el cursor y el cuadro no se mueve.** El espacio sí se saltea en cualquier control, botones incluidos — ahí ya lo activa el navegador |
| El paso de cuadro | del **contenedor**, no estimado | `scripts/cuadros.mjs` lee `mdhd` (timescale) y `stts` (deltas) del mp4/mov. Sin `ffprobe` y sin dependencias. **Validado 9/9**: cuadros × duración-de-cuadro reproduce la duración que reporta el navegador |
| ↳ busca el **medio** del cuadro | `(destino + 0.5) · cuadro` | pedir exactamente `N·cuadro` cae en la frontera entre dos cuadros y el navegador puede resolver para cualquiera de los dos |
| ↳ tasa variable | se devuelve el delta más frecuente **con `variable: true`** | para que quien lo use sepa que el paso es aproximado, en vez de creer que es exacto |
| El tiempo se lee por cuadro de pantalla | `requestAnimationFrame`, no `timeupdate` | `timeupdate` dispara unas **4 veces por segundo**: con eso la pista avanza a saltos y el número de cuadro miente casi siempre |
| Lo que no se pudo medir | controles nativos de Safari · reproductor completo de apple-events · Apple Podcasts · x.com | shadow root cerrado en los dos motores · `.controls-container` renderiza 0×0 headless · las dos últimas piden login |

## Error 404

| Decisión | Valor | Fuente |
| --- | --- | --- |
| Composición | Un único anillo con `ERROR 404 · PAGE NOT FOUND` repetido; sin controles ni texto visible adicional | simplificación elegida por Vito después del taller de sonido |
| Física | Cuerpo circular rígido, con gravedad, giro, drag y arrojar. Restitución de **0.90** en laterales/techo y **0.86** en el piso | recupera la respuesta seca anterior sin deformación al presionar el borde |
| Sonido | Una sola voz suave, disparada exclusivamente cuando el anillo completo rebota | se eliminaron las variantes `Letra`, `Palabra` y `Doble` y todo sonido por presión |
| Gestos descartados | Sin deformación, presión, explosión, partículas ni rearmado | la escena debe leerse como un único objeto rígido |
| Reduced motion | El anillo queda quieto; el drag sigue siendo directo y no genera inercia | el movimiento autónomo es decorativo |

## Pendiente (marcado como tal en `src/tokens.css`)

- **La escala `--space-*` no cubre lo que la página usa.** Va 4·8·12·16·20·
  24·32·40·48·64, pero 56, 60 y 80 están en uso y no están en ella; hoy
  viven como tokens semánticos (`--gap-masthead`, `--index-top`). Falta
  decidir si la escala crece arriba o si esos valores se quedan como
  semánticos. También sobran `--space-2`, `--space-6` y `--space-10`, que
  rompen la regla de múltiplos de 4 — los dos primeros sin uso
- Radios, elevación, z-index — se definen desde la primera pieza construida
- **`Swipeable tabs` está publicada sin video.** El clip final se está
  haciendo en otra sesión; cuando esté, entra con
  `pnpm pieza:video swipeable-tabs <archivo>`. Falta decidir QUÉ va en el
  hueco: la grabación cruda (la silueta del teléfono, que es lo que el
  hueco reserva) o el mockup para X (cuadrado, con bisel y fondo: en el
  hueco se vería un teléfono chico adentro de un cuadrado)
- **`pnpm grabar` escribe al vault por diseño**, pero la primera pieza
  se sacó del vault a pedido: el vault es lo ajeno. Si esa regla se
  generaliza, `grabar` debería escribir a `.context/mockup/master/` y el
  mockup leer de ahí (hoy se le pasa con `--clip=`)
- Primera pieza a construir dentro del stage
- Footer / firma: el nombre "Vito Compagnucci" todavía no está en ninguna parte
- **`Reminders App`** es el único clip que dice DÓNDE en vez de QUÉ, y repite
  su `Source` (`Apple Reminders App`) palabra por palabra. Entra en 15, así
  que no urge; falta saber qué gesto muestra para poder nombrarlo.
- **El lienzo del playground no entró al modelo de la barra.** Tiene `←` y
  nombre en su sidebar, que es leading + título con otra ropa. Queda como
  excepción documentada hasta que se decida si se une.
- **El taller nativo de SwiftUI.** El de Expo ya existe (`nativo/`, ver
  su `AGENTS.md`); el proyecto Xcode espera a la primera pieza que lo
  pida — View por pieza + `#Preview`, springs de iOS 17, Inject para
  recarga en caliente.
- **El parche de `expo-modules-jsi` es temporal.** Existe porque esta
  máquina tiene Xcode 26.2 y SDK 57 pide 26.4+. Cuando Xcode se
  actualice: borrar `nativo/patches/`, sacar `patchedDependencies` de
  `nativo/pnpm-workspace.yaml`, reconstruir.
- **Los MCP que le dan ojos al agente no están conectados.** Están
  relevados en la recon (`expo-mcp` del lado RN, XcodeBuildMCP del lado
  Xcode, y Xcode 26.3+ expone MCP nativo — esta máquina tiene 26.2).
  Mientras tanto el agente escribe archivos y vos mirás el simulador,
  que es el modo que ya funciona.
- **Grabar para verificar, no sólo para publicar.** `pnpm grabar` hace el
  clip final —barra en 9:41, h264, derecho al vault—. Falta lo otro: una
  grabación corta durante la iteración, para que el agente vea lo que
  hizo. Es lo único que `react-native-motion` tiene y nosotros no (ver
  [Lo que trajimos de leer otro repo](#lo-que-trajimos-de-leer-otro-repo)).
  Va junto con el punto de arriba: sin ojos, grabar no le sirve a nadie
  más que a vos.
- **`expo-haptics` quedó una versión atrás** (57.0.1 contra 57.0.2), y
  no por accidente: la 57.0.2 salió el 2026-08-26 y el cooldown de 24h
  la bloqueó. `npx expo install --fix` la sube cuando pase la ventana.
- **El inspector de selección del lienzo, cuando haya con qué.** Hoy la
  única acción de un frame elegido (`Add to Library`) vive en la sidebar,
  debajo del índice. El día que se acumulen más —duplicar, medidas,
  orden— ese bloque es el que se muda a un panel derecho estilo Figma,
  decidido con `/prototype`. Abrir la superficie ahora sería chrome para
  una sola palabra.
- **La barra sigue siendo tres mecanismos para cuatro pantallas** — el portal
  anónimo de `.acciones`, la fila del detalle y la sidebar del lienzo. Falta
  decidir si pasa a ser un componente con zonas (`leading` / `trailing`).
- **No hay undo adentro de la app, y ése es el hueco más concreto que queda.**
  Desde el 2026-08-25 `Move to Trash` no pregunta, siguiendo
  [Alerts › Best practices](https://developer.apple.com/design/human-interface-guidelines/alerts#Best-practices):
  no se alerta por una acción destructiva común y **reversible**. Pero el
  criterio literal de Apple es *"¿lo pueden deshacer?"*, y hoy se deshace en el
  **Finder**, no acá. El patrón completo es borrar sin preguntar **y** ofrecer
  el undo en el acto.

  **El medio decidido es [Sonner](https://sonner.emilkowal.ski/)**, de Emil
  Kowalski — que además es una de las referencias medidas de este sistema. Es
  también lo que elige `/pick-ui-library` para toasts en vez de escribirlo a
  mano, y el repo ya tiene la skill `ask-sonner` para el cableado.

  **Lo que abre, dicho antes de abrirlo:** sería la **primera dependencia de
  UI** del proyecto — hoy no hay ninguna, todo está construido desde
  referencias medidas. Y traería una superficie que el sistema declara no
  tener: `playground.module.css` dice "cero rojos en todo el producto" y no hay
  toast ni barra de estado en ninguna parte. O sea que hay que decidir dos
  cosas, no una: si entra la librería, y qué lugar ocupa un toast en un
  chrome que hasta hoy son sólo palabras sobre el canvas.

  Pospuesto a propósito. Cuando exista, `aLaPapelera` en `vault.tsx` es su
  primer cliente y `AvisoPapelera` probablemente se va con él.

- **La flecha de volver ya es el chevron estándar** (resuelto el 2026-08-25).
  Lo que queda anotado es lo que se descubrió al cambiarla: el `←` que había
  **no venía de la recon**. El README lo atribuía a benji y josh, y los dos
  usan palabras (`Index`, `Home`). Era una decisión nuestra sin recibo, con una
  cita prestada encima. Vale como recordatorio de que una atribución también se
  verifica.

## El aire de arriba es 80, en todas las pantallas

**Una sola distancia, no una por vista.** Es la regla de benji y se volvió a
medir en vivo para esto, a 1728×900: su `.styles_container__YJPlC` lleva
`padding: 80px 16px 40px` y es **el mismo contenedor en todas sus páginas** —
verificado en su home y en `/liveline`, `/drawesome` y `/honkish`. Lo primero
que hay cae en **top 80** en las cuatro: en la home su `<h1>`, en un detalle su
link `Index`. No tiene un aire de lista y otro de detalle.

Del lado nuestro tres de cuatro ya lo cumplían:

| pantalla | primer elemento | top |
|---|---|---:|
| Library | `<h1>` Library | 80 |
| Detalle de una pieza | la flecha | 80 |
| Vault, la grilla | la solapa `Vault` | 80 |
| **Vault, un clip abierto** | la flecha | ~~120~~ → **80** |

El detalle del clip llevaba `margin-top: 40` para separarse de la barra de
solapas — pero **en el detalle la barra no se renderiza** (`sinSolapas`, en
`privado.tsx`), así que separaba de nada. Se retiró.

**El clip no cambió de tamaño**, y eso fue deliberado. Al liberar los 40 de
arriba el clip se los quedaba: medido, 536×536 → 576×576. Se devolvieron abajo
—`.escenario` pasó de `padding-bottom: 56` a `96`— porque ese valor **no es un
margen inferior sino el control del tamaño del clip**: su trabajo es sostener
el tamaño que se eligió mirando. El aire total de la página no se movió un
píxel; sólo cambió de punta.

## La cabecera del detalle

`← · Photo picker ⌄ ·········· ↗ · ▮▯`

**El título ES el menú del documento.** Tocar el nombre —o su chevron, que son
un solo botón— abre `Rename` y `Move to Trash`. Es el *document menu* que
describe [Toolbars › Item groupings](https://developer.apple.com/design/human-interface-guidelines/toolbars#Item-groupings)
para el borde inicial: comandos que afectan al documento entero. Nuestras
acciones caen todas ahí; ninguna es un sobrante de la barra, que es para lo
que existe el menú *More* del otro borde.

**Se retiró el renombre en el lugar.** El título se editaba al tocarlo y era
menos ceremonia que un diálogo. Lo que lo tira abajo no es la ceremonia: es
que ese clic no alcanzaba para todo lo que había que poder hacer, así que
renombrar, la papelera y el playground vivían sólo en el clic derecho —o sea,
invisibles—. Un título que se edita al tocarlo se queda con el gesto.

**Sólo una acción sube a ícono: el playground.** Es la única que no es sobre
la identidad ni la existencia del archivo, y la única sin consecuencia —
mandarla mil veces no rompe nada. Un ícono permanente es para lo que se
aprieta sin pensar. Por eso **no está en el menú**: repetirla a diez píxeles
sería ofrecer dos veces lo mismo. En la grilla sí está en el clic derecho,
porque ahí no hay barra.

**El toggle del inspector va último, contra el riel.** La misma página ancla
el de sidebar al *far leading edge*; éste es su espejo. Y es el que se aprieta
repetido, así que es el que no puede moverse de lugar. El hueco entre los dos
íconos es **8** — el de controles del sistema (esta fila, el `--rep-gap` del
reproductor, el `--index-item-gap`). Hubo una versión con 16 y estaba mal
leída: 16 es el hueco entre **palabras** del chrome, no entre controles.

**El nombre nunca se recorta.** Acá el título ES el nombre del archivo en tu
disco, y un nombre a medias no sirve para lo único que se hace con él. Si no
entra, empuja — y ahí la convención de los 15 caracteres deja de ser una nota
y se ve.

Se descartaron: **`Expuesto`** (cada acción un glifo — el de playground no se
lee sin tooltip y la papelera queda a un clic permanente), **`Panel`** (las
acciones dentro del inspector, que arranca cerrado), **`Borde`** (el menú
`···` en el borde final; se implementó y se revirtió: su menú cae encima del
inspector cuando está abierto), **`Popover`** (el título abre una superficie
con el campo del nombre adentro) y **`Limpio`** (el detalle no puede borrar).

### Auditoría contra la HIG

**Sin íconos en los ítems, y no es una omisión.**
[Menus › Icons](https://developer.apple.com/design/human-interface-guidelines/menus#Icons)
pide usarlos con moderación y cierra la puerta al caso mixto: los ítems de un
mismo grupo llevan ícono **todos o ninguno**. Hoy ninguno. Ponerle uno sólo a
`Move to Trash` —que es lo que hace la bitácora de Carousels, con `#e5352b`—
obligaría a dárselo también a `Rename…`, al menú de la grilla y al del
playground. Es una decisión de lenguaje entera, no un detalle de una fila.

**Mayúsculas de título** en todas las etiquetas: `Open in Playground`,
`Rename View`, `Delete View`. Lo pide la misma sección.

**Borrar no pregunta.**
[Alerts › Best practices](https://developer.apple.com/design/human-interface-guidelines/alerts#Best-practices)
dice evitar el alert para acciones destructivas **comunes y reversibles**, y su
ejemplo es borrar un archivo. Se retiró `DialogoPapelera` entero. Verificado
end-to-end con un archivo de prueba: el clip sale del vault y aparece en la
papelera de macOS, o sea que la premisa se cumple de verdad y no por
suposición. Lo que queda es `AvisoPapelera`, que **no** es el mismo diálogo con
otro texto: tiene un solo botón, no hay nada que decidir, y existe porque la
misma página dice que un alert sí sirve para contar un problema — sin él, un
fallo del servidor sería silencioso.

**La advertencia no desapareció, cambió de momento:** antes llegaba después
del clic; ahora llega antes, con el ítem en rojo.

**La flecha de volver es un chevron**, el símbolo estándar que pide
[Toolbars › Navigation](https://developer.apple.com/design/human-interface-guidelines/toolbars#Navigation).
Era `←`, y el README llegó a atribuirlo a la recon de benji y josh — pero los
dos usan **palabras** (`Index`, `Home`), así que ninguno lo respaldaba. Era
nuestro y sin recibo. Va dibujado y no escrito, por lo mismo que el `+` de la
grilla: un glifo se apoya en la línea de base y nunca queda centrado.

**Lo único que se aparta a propósito:** `Rename` no lleva elipsis. *Menus ›
Labels* la pide cuando la acción necesita más información antes de completarse,
y ésta abre un diálogo que pide el nombre. Retirada por decisión del dueño
(2026-08-25): el menú tiene dos ítems y los dos son evidentes, así que el signo
agrega ruido sin resolver ninguna duda.

**Lo que nos falta para el patrón completo:** el criterio de Apple es *"¿lo
pueden deshacer?"*, y acá se deshace en el **Finder**, no en la app. La versión
completa sería borrar sin preguntar **y** ofrecer un undo adentro — que hoy no
tiene dónde vivir, porque este sistema no tiene toast ni barra de estado.
Cuando exista esa superficie, éste es su primer cliente.

**Un detalle que sí coincide con el ejemplo textual de Apple:** el rojo va en
el **ítem del menú** y no en el botón del diálogo. Alerts dice que cuando la
persona ya eligió deliberadamente la acción destructiva —su ejemplo es
`Empty Trash`— el botón que la confirma **no** lleva el estilo destructivo.
El nuestro va en `--ink`.

## El rojo destructivo

`Move to Trash` se pinta en `--destructivo`, con una hairline delante.
**Acá había escrita la decisión contraria** en `acciones.module.css` — *"no hay
ni un color de estado, y meter el primero sería inventar un nivel entero"*. La
premisa era falsa: el nivel estaba decidido desde antes que este repo, en la
bitácora de Carousels (`docs/design-research/design-decisions.md`, línea 374),
y su caso es literalmente éste. La familia es Apple `#ff3b30`, elegida ahí
contra el `#ff0052` de benji.

Medido sobre **nuestros** fondos, que es lo que había que comprobar:

| | valor | sobre `--canvas` | WCAG |
|---|---|---:|---:|
| claro | `#c81e14` | Lc 75.5 | 5.65 |
| oscuro | `#ff6b60` | Lc −48.8 | 7.14 |

El claro transfiere clavado y no por suerte: el canvas de Carousels es este
mismo `#fdfdfc`, los dos salieron de agentation. Y 75.5 cae justo en el umbral
**preferido** de APCA para texto que no es cuerpo.

**Dónde se dobla la regla.** El modo oscuro de este sistema exige que el texto
conserve su contraste, y éste no lo hace. Se calculó qué haría falta:
manteniendo tono y croma, el rojo que da Lc −75.5 sobre `#090908` es `#ffbcb1`
— croma 0.204 → 0.080, un rosa pálido. Ahí el token deja de hacer su único
trabajo. **La palabra ya se lee**, en ink, a Lc 104; el rojo no carga la
lectura, carga el aviso. Es el primer token de texto que no cumple la regla y
va dicho, no escondido.

## Los bocetos — escribir un componente desde cero en el lienzo

El playground tenía las referencias y no tenía dónde construir: sus frames
sólo podían apuntar a un clip del vault. Desde el 2026-08-26 hay un tercer
tipo de frame, `boceto`, y es **un archivo de verdad** en
`src/privado/bocetos/` que exporta un componente por defecto.

| Decisión | Valor | Fuente |
| --- | --- | --- |
| Qué es un boceto | Un `.tsx` en `src/privado/bocetos/`, resuelto con `import.meta.glob`. `New sketch` crea el archivo y lo pone en la tela | el frame ya guardaba una **referencia** y no una copia para los clips; un boceto usa exactamente el mismo trato, con el `ref` apuntando al nombre del archivo |
| **No hay editor en el navegador** | escribís en tu editor y Vite recarga el frame | Monaco o CodeMirror más un transformador en el cliente sería una dependencia grande para darte un editor **peor** que el que ya tenés abierto al lado. Y sobre todo: **un agente escribe archivos, no tipea en un textarea**. Si el boceto es un archivo, las dos formas de trabajar —vos en el editor, un agente en la terminal— son la MISMA y ninguna necesita interfaz |
| ↳ verificado en vivo | editar el archivo cambia el frame **sin recargar la página** | medido: `performance.getEntriesByType('navigation')[0].type` sigue en `navigate` después de tres ediciones, y el contenido del frame cambió las tres veces |
| **Un boceto roto no tira el tablero** | cada uno adentro de un límite de error; se apaga sólo su frame, con el nombre y la palabra `Error` | escribir libremente significa que la mitad del tiempo el archivo está a medias. Sin esto un `null.map()` desmonta el lienzo entero y perdés los otros frames, la selección y el gesto a medio hacer. **Verificado**: con el boceto roto el tablero siguió montado y el frame dijo `Error` |
| ↳ y se recupera solo | el límite se limpia en el siguiente hot update, que es cuando arreglaste el archivo | si no, el frame quedaría en rojo para siempre y habría que recargar — o sea perder justo lo que este componente vino a salvar. Se limpia **sólo si hay error**: pisar el estado en cada guardado remontaría todos los bocetos del tablero cada vez que tocás cualquier archivo |
| **El puntero se reparte por selección** | sin elegir el frame se arrastra; elegido, el boceto recibe los clics | hay que poder apretarle los botones a lo que estás construyendo, pero el gesto del frame hace `preventDefault` y toma el puntero: si empezara ahí, el clic nunca llegaría adentro. Es lo que hacen los editores de tablero. **Verificado**: elegido, tres clics dieron tres incrementos; deseleccionado, `pointer-events` computa `none` |
| ↳ el precio, dicho | un boceto elegido no se mueve arrastrándolo del medio: Escape y vuelve a ser un frame | queda anotado como candidato a mirarse con `/prototype` si molesta |
| El diálogo pasó a llamarse `Add` | y `New sketch` es la primera opción de la grilla, con la misma caja que las demás | era `Add clip`, y desde que también se agregan bocetos nombraba una de las dos cosas que hay adentro. La opción nueva es una card más y no un botón aparte, así que no hay una segunda geometría que decidir |
| ↳ no pregunta el nombre | nace `sketch`, `sketch-2`… y se renombra renombrando el archivo | es la regla que ya usa `New view`: un modal antes de ver nada te obliga a bautizar algo que todavía no existe |
| El endpoint escribe **adentro del repo** | `POST /vault-media/__boceto`, única excepción del puente | un boceto es código: tiene que estar donde Vite lo compile y donde tu editor y un agente lo puedan abrir. La carpeta es fija y sale de `import.meta.url`, y del nombre sólo sobreviven letras, números y guiones — con ese alfabeto no hay `..` que construir. **Verificado**: `?nombre=../../etc/passwd` escribió `etc-passwd.tsx` adentro de la carpeta, y nada afuera |
| ↳ no pisa nada | se escribe con `wx`, y si existe devuelve 409 | el chequeo y la escritura son la misma operación, así que no hay ventana entre "no está" y "lo escribo". **Verificado**: el segundo POST con el mismo nombre da 409 |
| **Y sigue sin llegar a producción** | `dist/` no menciona `boceto` ni una vez | el borde es la carpeta: todo esto cuelga de `src/privado/` y hereda la puerta. Verificado después de `pnpm build` |

**El playground es sólo web, y es una decisión.** Una pieza de App no se
construye acá: se escribe con el agente al lado mientras la mirás correr
en el **simulador de iOS**, y entra a la exposición como **grabación de
pantalla** — que es lo que `platform` ya decía sobre cómo se demuestra,
ahora también sobre dónde se construye. Se evaluó meter el teléfono
adentro del lienzo y se descartó: `react-native-web` dibujaría la forma y
mentiría justo en lo que este vault estudia, que es el gesto y el háptico
—el mismo argumento por el que Expo pasó a video—, y un simulador
streameado (`simctl io booted screenshot` más `idb ui tap`) da la imagen
pero no el *feel*, que es lo único que no se puede juzgar de otra manera.

## Publicar — del playground a la library

El recorrido cierra desde el 2026-08-26, y cierra **en el tablero**:
`Add to Library` es el clic derecho sobre un frame del playground. Un
boceto sale como pieza **Web viva**; una grabación, como pieza **App**
en video.

**Estuvo un día en el vault y se movió**, y la corrección es de modelo,
no de lugar: el vault es lo EXTERNO —la pared de referencias que mirás—
y lo que se publica es lo TUYO, que vive en el playground. El flujo
entero quedó: vault (externo) → playground (iterás tu pieza, con las
referencias al lado) → library. Publicar es el final del taller, así que
el gesto vive donde está el trabajo.

| Decisión | Valor | Fuente |
| --- | --- | --- |
| **La acción es visible, no sólo clic derecho** | elegís el frame y `Add to Library` aparece en la sidebar, debajo del índice, a **16** —el aire de grupo, medido— para que no se lea como un renglón más: los renglones son sustantivos y esto es un verbo | la lección ya aprendida en el vault: *un menú contextual no anuncia nada*. El patrón de referencia es el panel derecho de Figma —las acciones de lo elegido— pero UNA acción no paga una superficie nueva: la zona nace adentro de la sidebar que ya existe. El clic derecho queda como atajo |
| **La plataforma la dice el frame**, sin selector | un frame `boceto` publica Web; un frame `clip` publica App | es la regla que ya existía —*App se demuestra en video, Web va viva*— leída al revés. Un selector ofrecería combinaciones que el sistema ya declaró inválidas |
| El formulario es el molde de la pieza | dos campos: nombre y una línea de descripción — exactamente los dos renglones del detalle público. El nombre llega puesto; la descripción arranca vacía porque es el único dato que el archivo no sabe de sí mismo | la carpeta-es-el-manifiesto del vault, aplicada al publicar: no se pide nada que ya se sepa |
| **Cómo vive una pieza Web** | su archivo en `src/piezas/<slug>.tsx`, resuelto **por nombre** en `demos.tsx` — glob perezoso, cache por ref, mismo trío que los bocetos | el slug es el mapa, así que no hay registro que mantener a mano — la decisión de la carpeta-manifiesto, ahora del lado público. En el build cada pieza sale como su propio chunk (**verificado**: `press-counter-….js`, 0.44 kB) |
| ↳ publicar es COPIA, no mudanza | el boceto queda en el tablero; la pieza se edita en su archivo publicado | mover el archivo rompería los frames que lo referencian. El costo —dos archivos que pueden divergir— queda dicho: desde la publicación, el canónico es `src/piezas/` |
| ↳ y cruza la frontera de verdad | de `src/privado/bocetos/` a `src/piezas/` | `src/privado/` no llega al build, así que una pieza publicada necesita su archivo del lado público. Por lo mismo, una pieza no puede importar nada de `src/privado/` — era cierto para el boceto (nace autocontenido) y tiene que seguir siéndolo |
| Las dos escrituras o ninguna | el archivo del demo se copia y la entrada entra a `pieces.ts`; si la segunda falla, la primera se deshace | el vault y `src/privado/` viven fuera del deploy; sin el copiado la pieza apuntaría a algo que producción no tiene |
| No se pisa nada nunca | nombre o archivo repetidos → **409**, no un reemplazo | la misma regla que subir un clip y crear un boceto: `COPYFILE_EXCL`, chequeo y copia en una sola operación. **Verificado**: mismo slug con otro nombre devuelve 409 |
| La confirmación es la página | al publicar navegás a `/​<slug>` y ves el demo andando | este sistema no tiene toast (el undo de Sonner sigue pospuesto); la library real es mejor confirmación que cualquier cartel. Navegación dura a propósito: `pieces.ts` acaba de cambiar en disco y recargar garantiza que todos los módulos la vean |
| El demo Web corre vivo en las DOS vistas | lista y detalle, el mismo componente, centrado en la caja con el piso heredado (`min-height: inherit`) | la decisión ya estaba tomada: *"con preview vivo en la lista, el detalle no aporta la pieza — aporta lo que la rodea"*. **Verificado**: el botón de prueba contó 3 clics en `/press-counter` |
| La grabación toma el hueco del teléfono | el `::before` que reservaba la silueta se apaga (`:has`) y el video usa el mismo ancho por el mismo token — 228 en la lista, 319 en el detalle | el hueco existía para esto: era la reserva de un contenido que ahora llegó. **Verificado**: 228 y 319 medidos |
| ↳ autoreproduce, muda, en loop | `autoplay muted loop playsinline` | el movimiento ES el contenido, y es lo que hacen los demos de benji en family-values — 45 videos girando a la vez. La regla contraria del playground (arranca quieto) es de un tablero de estudio; una exposición existe para mostrarse sola |
| **El slug quedó UNO** | vive en `pieces.ts` y lo comparten la página, `rutas.mjs` y el puente | vivían dos cuentas que coincidían de casualidad —espacios→guión en `parts.tsx`, todo-lo-no-alfanumérico→guión en `rutas.mjs`— y con el primer nombre con signo divergían. Publicar nombra el archivo del demo con el slug, así que una tercera copia era inaceptable |
| ↳ y `rutas.mjs` dejó el regex | importa `PIECES` y `slug` de `pieces.ts` de verdad | Node ≥24 —que `engines` ya exigía— corre TypeScript sin tipos ejecutables. El guard de "vacío a propósito" murió con el regex que protegía: si `pieces.ts` no compila, el build frena ahí — el mismo freno, sin heurística |
| Verificado de punta a punta, dos veces | **Web**: New sketch → escribir el archivo → clic derecho → `/press-counter` con el botón contando clics. **App**: la rama clip publica, el video reproduce en su hueco, `vercel.json` regenerado | hecho con material de prueba y **revertido**: el inventario sólo lleva piezas construidas de verdad |

## Cómo se nombra un clip

**Menos de 15 caracteres.** Es el tope de la HIG de Apple en
[Toolbars › Titles](https://developer.apple.com/design/human-interface-guidelines/toolbars#Titles),
y el motivo que ella misma da es funcional: que quede lugar para los demás
controles de la barra. Desde que la cabecera del detalle es UNA fila
—flecha · título · inspector— ese lugar es literal.

**El título dice QUÉ es el gesto. `Source` dice DE DÓNDE salió.** Los dos
campos existen y hacen cosas distintas, y sacar esa repetición es lo que
hace que 15 caracteres alcancen: no hay que comprimir nada, hay que dejar
de decir dos veces lo mismo.

El modelo ya existía en el vault: **`Swipe to pay`** son 12 caracteres, no
nombra la app, y dice exactamente qué vas a ver. Contra ése se escribieron
los demás.

**Aplicado el 2026-08-24.** Cinco de siete clips se pasaban; en tres de
ellos lo único que sobraba era el nombre de la app, que su propio `Source`
ya decía:

| antes | | después | |
|---|---:|---|---:|
| Bottom accessory like Apple Music mini player | 45 | Mini player | 11 |
| Copy text animation from Apple Passwords | 40 | Copy text | 9 |
| ~~Berry~~ Floating Bar ~~Bug~~ | 22 | Floating bar | 12 |
| ~~ChatGPT~~ photo selector | 22 | Photo picker | 12 |
| ~~X App's~~ Swipeable Tabs | 22 | Swipeable tabs | 14 |

Mediana 22 → **12**. Las fichas viajan con el archivo en el mismo paso que
lo renombra, así que ninguna quedó huérfana.

No está forzado por código a propósito: el nombre es el nombre del archivo
en tu disco, y una app que te impide llamar a tus archivos como querés
tiene la dependencia al revés.

## Lo que trajimos de leer otro repo

**El 2026-08-28** leímos entero
[SchroederNathan/react-native-motion](https://github.com/SchroederNathan/react-native-motion)
—siete animaciones Expo/RN, sitio de docs aparte— buscando qué del método
ajeno servía acá. No tiene licencia: el único `LICENSE` es el MIT de Expo
que deja `create-expo-app`. Así que **no viajó código**, viajaron
conclusiones.

**Lo que sí trajimos.** Cierran cada animación con una lista de
invariantes —`Do not change these behaviors`— y eso es nuestra regla del
recibo en un formato que otro agente puede ejecutar. Clasifiqué las 28
líneas de sus cuatro listas:

| | cuántas | qué se hizo |
|---|---:|---|
| Propias de su implementación | 13 | nada, no aplican |
| Trampas generales disfrazadas de regla de pieza | 8 | → `nativo/AGENTS.md` › *Lo que ya sabemos que muerde* |
| Convención de API del stack | 7 | → `nativo/AGENTS.md` › *Lo que vale para toda pieza* |

Las 8 entraron **como reglas, no como sugerencias**. Vienen de un repo
donde las constantes se sacan cuadro a cuadro de la referencia y cada
decisión lleva su comentario arriba: el que no esté de acuerdo con una,
que mida antes de tocarla.

**Y el formato del bloque**, con un agregado nuestro: cada línea lleva su
grado de evidencia — `SOURCE` si lo dice el código, `RUNTIME` si se midió
corriendo. Sin eso, "500 ms" y "210 ms" parecen la misma clase de número
y no lo son: uno es una decisión, el otro es una lectura de la
referencia.

**Por qué las convenciones van en un solo lugar.** Copiaron la misma regla
a mano en sus cuatro briefs, y en el cuarto quedó vieja: el del radial
menu manda usar `runOnJS`, pero su propio código usa `scheduleOnRN` trece
veces y `runOnJS` ninguna. Se actualizaron tres de cuatro. Verificado
contra nuestro propio `node_modules`: `runOnJS` está
`@deprecated` en `react-native-worklets@0.10.1`
(`lib/typescript/threads.native.d.ts:103`).

**`nativo/VIDRIO.md`** salió de la misma lectura: `expo-glass-effect` ya
estaba instalado y tiene trampas que no se ven venir —un `GlassView` bajo
una opacidad animada **no dibuja nada**, y recortarlo mata el bulto del
material bajo el dedo—. Y una regla que se olvida: el `BlurView` de la
caída sí hay que recortarlo, o sea las dos ramas del mismo componente
llevan reglas opuestas.

**Con `expo-blur` 57.0.2 instalado el mismo día**, aunque todavía no haya
pieza que lo use. Es la escalera completa o no es escalera: abajo de iOS
26 el material no existe, y descubrirlo cuando la pieza ya está a medias
cuesta un `pnpm ios:build` en el peor momento. Se reconstruyó el dev
client en el mismo paso.

**Lo que no trajimos**, y por qué:

| | |
|---|---|
| Su skill `make-interfaces-feel-better` | es CSS puro para su sitio Next.js — cero menciones a React Native en sus 959 líneas. Y `~/.claude/skills/better-ui` es la misma familia con cuatro archivos más |
| Su registry escrito a mano | el nuestro se deriva de las carpetas. El de ellos ya se desincronizó: `linear-tab-bar` está cargado en `data/animations.ts` y no tiene ni carpeta ni entrada en el registry |
| El monorepo con sitio de docs aparte | resuelve un problema que no tenemos. Ellos hacen una vidriera para que otros copien; acá el producto es la exposición |

**Lo único que nos falta y ellos tienen:** graban el simulador *durante*
la iteración, no sólo al publicar. Diez `.mp4` se les colaron al repo en
`.argent/recordings/` —no está en su `.gitignore`— y entraron en los
mismos commits que las animaciones. Medidos con `ffprobe`: h264, 30 fps,
1206×2622 y 1320×2868, o sea dos simuladores distintos por UDID en el
nombre. Nuestro `pnpm grabar` graba para **publicar**; esto sería para
**verificar**, y es otra cosa. Queda en Pendiente, junto con los MCP que
le dan ojos al agente.

## Las notas del detalle — líneas de benji, tono de josh

**El detalle existía para esto** y estaba vacío: *"la lista muestra, el
detalle explica"*. Desde el 2026-09-04 una pieza puede traer un texto
largo bajo su preview, partido en secciones: de dónde salió, qué se
midió, qué peleó. Vive en `src/notas/<slug>.tsx`, con el mismo mecanismo
que los demos —glob perezoso por slug, sin registro que mantener— y una
pieza sin notas no dibuja nada.

**La línea de `PIECES` no se tocó, y son dos cosas distintas.** Esa es la
que se escribe al publicar y la que se lee de corrido bajo la pieza;
las notas son lo que sigue. Meter la prosa en el inventario habría
hinchado el archivo que leen la página, `rutas.mjs` y el puente que
publica.

**Las líneas son de benji y el tono es de josh, y conviene decir de quién
es cada mitad** porque la mezcla es nuestra:

- El separador **es el mismo objeto** que parte la lista en Web y App
  (`.groupHead`: rótulo 14/600 + hairline hasta el borde del riel, hueco
  de 8), que ya estaba medido de `/liveline` y `/drawesome`. No se
  escribió una segunda línea: una sola línea en la página es una sola
  regla.
- **Josh no tiene ninguna**: cero `<hr>` en `/melt-effect` (SOURCE,
  2026-09-04, sobre el HTML servido). Lo suyo son los **rótulos** —
  cortos, en sentence case, a veces una pregunta: *"1. What's a
  displacement map?"*, *"Shaping with frequencies"*, *"The filter"*,
  *"Apply it"*— y la **prosa**: primera persona del plural para el
  método, frases cortas, el mecanismo nombrado con precisión, la
  advertencia dicha sin dramatismo (*"A note on performance. Animating
  filter attributes re-evaluates the entire filter graph every
  frame"*) y los errores propios admitidos. Nada de autoelogio: eso ya
  era la regla del copy acá.

**Se escribe en primera persona del singular.** *"I didn't start from a
memory of how X feels. I started from X."* Acá adentro hay una sola
persona y el plural sonaba a un equipo que no existe. Es además lo que
hace josh cuando cuenta lo suyo —*"I've applied an SVG filter to it"*,
*"I'll never forget"*— y deja el `we` para llevar al lector por un
método. El `you` para el lector se queda, que también es suyo.

**Los dos huecos son tokens que ya existían** —64 arriba de cada rótulo
(`--section-gap`) y 40 de la línea al primer renglón
(`--section-content-gap`)— y **no se volvieron a elegir**: se reusan para
tener un número por relación. Que sean los correctos *para prosa* está
**sin medir**, igual que la línea de aire entre párrafos (hoy la
interlínea del cuerpo). Las tres se deciden con el scrubber sobre esta
página, y están marcadas como pendientes en el CSS.

## La primera pieza App: los tabs de X, medidos contra la app real

**Swipeable tabs** (`nativo/src/piezas/swipeable-tabs/`) es la primera
pieza que sale del taller nativo, y fija cómo se construye una: **nada se
afirma sin medir**. La referencia no fue una idea de cómo se mueve X sino
X mismo — el clip del vault y después cuatro grabaciones de la cuenta del
usuario, en su teléfono (1320×2868, 60 fps), leídas cuadro a cuadro con
scripts de ffmpeg y no a ojo. De ahí salieron los seis reposos de la
barra al décimo de punto, la regla de la inclinación (`BARRA.apartar`),
la curva del toque (easeOutCubic, 300 ms, ajustada contra tres toques),
el pliegue de la cabecera con el scroll (traslación = scroll al décimo,
fundido lineal) y **las dos paletas**, la oscura y la clara, con el mismo
método. Cada número lleva su recibo arriba en `medidas.ts`, y la planilla
entera vive en `.context/recon/swipeable-tabs/MEDICIONES.md`.

**Lo que se decidió contra la referencia también quedó escrito**, con la
prueba de que la referencia hace otra cosa: la fila de tabs sólo se corre
cuando el tab destino no entra en pantalla (`BARRA.fila = 'visible'`),
aunque la grabación muestra a X centrando siempre; el bloque de arriba
frena con su divisor pegado a la barra de estado en vez de salir entero.
Las dos son pedidos del usuario probados en el teléfono, y las variantes
fieles están a una palabra de distancia. Y las que se probaron y se
rechazaron —el bloque desvaneciéndose entero, el recorrido completo del
pliegue— quedaron anotadas arriba del código para que nadie las repita.

**La forma de la carpeta** es la de un componente de
[react-native-motion](https://github.com/SchroederNathan/react-native-motion/tree/main/apps/expo/components/animations):
una pantalla autocontenida, un `index.tsx` que la exporta, el mecanismo
en archivos por responsabilidad, el tema y los datos al lado. La ruta en
`src/app/` es un puntero. Su registry a mano no viajó, por lo mismo de
siempre: el índice del taller se deriva de las carpetas.

**Lo que aprendimos del método**, más que de la pieza: una sonda
determinista es UN estado por recarga, no una línea de tiempo de timers;
el simulador no puede recibir un tap, así que el camino del toque se
prueba en el teléfono; y cuando el usuario dice "se siente abrupto", se
toca una perilla o se pregunta cuál, no la geometría — la vuelta grande
se rechazó en el acto.

## El video para X, medido contra el clip de @nater02

La pieza ya corría y estaba grabada; faltaba el video que se publica. El
usuario trajo la referencia exacta —un clip de @nater02 en X: 720² a 60
fps, 24.6 s— y cuatro palabras: el zoom al inicio, el fondo neutro, el
teléfono tal cual ese en el medio, la fluidez. Se midió cuadro a cuadro
antes de tocar nada, como con la pieza:

| qué | medido | de dónde |
| --- | --- | --- |
| fondo | RGB (235, 230, 232), plano | las cuatro esquinas y los bordes, iguales en todos los cuadros |
| teléfono | negro, cuerpo 335×686 en 720² → 95.3 % del alto, centrado | el borde del cuerpo por fila y columna en el cuadro 0 |
| sombra | sólo a la derecha y abajo; dos capas, una apretada (α .60, σ 8, corrida 12) y una ancha (α .20, σ 30, corrida 70) | ajuste por mínimos cuadrados sobre el perfil de luma a cada 6 px, con los lados sin sombra como restricción |
| cámara | entra a 1.576× en 0.65 s, se queda 0.18 s, sale a 1.161× en 0.62 s y no se mueve más | el ancho del cuerpo cuadro a cuadro (335 → 528 → 389) |
| curvas | entrada bézier (0.30, 0.05, 0.40, 0.90), salida (0.25, 0.25, 0.20, 0.90) | búsqueda sobre los cuatro puntos de control, rms 0.005; ninguna curva CSS conocida baja de 0.03 |

**El teléfono es el iPhone 17 en Black.** La proporción del cuerpo de la
referencia (2.05) está más cerca del 17 (2.066) que del Pro Max (2.095),
y el Pro Max no viene en negro. La grabación del Pro Max entra en el
hueco del 17 escalada: la proporción es la misma al 0.1 %. Ahora hay dos
modelos medidos en el script y la cámara mueve cada capa por cuadro desde
su fuente, sin re-escalar el cuadro compuesto: al 1.58× el bisel se
agranda un 20 % sobre el PNG y la grabación entra casi 1:1.

**La cámara apunta a la acción de ESTA pieza, no a la de la referencia.**
Ahí la acción está abajo (un menú que se despliega desde el teclado) y el
zoom deja el borde de arriba cortado; acá está arriba (la fila de tabs),
así que la entrada apunta a la fila —al 33 % del alto— y la salida deja
el borde de arriba a 7.2 % del lienzo con el de abajo cortado. Es el
espejo, con los mismos números.

**Los bordes, y por qué ahora hay `--verificar`.** La primera versión
tenía la pantalla 15×20 px corrida —`pant.x` estaba en coordenadas del
PNG y se sumaba a un origen que era el cuerpo— y en la esquina de arriba
a la izquierda asomaba el fondo por el hueco. En el cuadro entero no se
veía; el usuario lo vio en un zoom: "tenés que ser mucho más detallista,
mirá los bordes, no se fillean". Con capas que se posicionan por su
cuenta y se redondean a píxel en cada cuadro, un origen mal tomado no
falla: se ve. Así que `pnpm mockup <slug> --verificar` mete un rojo pleno
en vez de la grabación, renderiza la cámara entera sin pérdida (RGB,
ffv1: en yuv420p el croma se promedia de a 2 px y un rojo pegado al bisel
deja de ser rojo sin que haya ningún hueco) y comprueba píxel por píxel
que el hueco del bisel está lleno en doce estados de la cámara. Corre
antes de mirar nada.

**La primera pieza App entró a la library por su propio camino**: el clip
en el vault, `Add to Library` (su endpoint, el mismo que usa la sidebar),
la entrada en `PIECES` y `vercel.json` regenerado por el build. El vault
guarda el máster (1320×2868, 25 MB: es lo que graba el simulador) y eso
es lo que publicar copia tal cual; para la exposición se re-encodeó a
720×1564 (5.6 MB), el doble del hueco de 319 del detalle. **Pendiente:**
publicar debería transcodificar solo —el máster es para el mockup, la
web no lo necesita— y el tiempo de la barra de estado sale "09:41" porque
el simulador está en formato de 24 horas; la próxima grabación lo cambia
con `AppleICUForce12HourTime` antes de grabar.

**Herramientas, para la próxima.** Lo que hace este pipeline —bisel
oficial, fondo, sombra, cámara— lo hacen también Screen Studio (graba el
iPhone por USB con marco, pero no ve los toques: sin auto-zoom en iOS) y
Matte (graba simulador o iPhone con marco y zoom). Lo que ninguna
herramienta arregla es la fuente: los gestos de esta grabación son
sintéticos, la sonda mueve el pager con curvas medidas. Un dedo real en
el teléfono con Expo Go es la otra mitad de "la fluidez", y es una
grabación distinta, no un ajuste del mockup.

**Addendum, el mismo día.** El video que estaba en la library era el
interino —la grabación del simulador re-encodeada— y el clip final se
está haciendo en otra sesión. Se decidió dejar la pieza **publicada con
el hueco vacío** (la card lo reserva sola: es el `::before` de
`.streamPreview`) y que el video entre después con un comando,
`pnpm pieza:video <slug> <archivo>`: re-encodea para la web al ancho
del hueco, conserva la proporción del archivo, escribe
`public/piezas/<slug>.mp4` y completa `video` en `PIECES`. Y la pieza
**salió del vault**: el vault es la pared de lo ajeno, y una pieza
propia no tiene por qué pasar por ahí para llegar a la exposición. Su
máster quedó en `.context/mockup/master/` (gitignoreado), que es de
donde el mockup lo toma con `--clip=`.

## El mockup en Remotion: los mismos números, iterados en vivo

El pipeline de ffmpeg hacía el video bien pero cada ajuste era un
re-encode de minutos, y el brief del video pidió lo contrario: mirar el
look en vivo y renderizar una vez. Se armó `mockup/`, una composición de
Remotion (React) con **exactamente los números medidos** —el bisel sobre
el alfa del PNG, el fondo, la sombra en dos capas, la cámara de tres
momentos y sus dos bézier— como props con esquema, que Remotion Studio
muestra como controles. Lo que cambió respecto del pipeline, y por qué:

| qué | ffmpeg | Remotion |
| --- | --- | --- |
| las curvas | polinomio de grado 7 ajustado a la bézier (ffmpeg no evalúa bézier) | la bézier misma, por bisección |
| la cámara | (zoom, punto de mira) | (zoom, posición del cuerpo): el borde del teléfono va en una sola dirección |
| cada capa | escalada por cuadro con `scale … eval=frame` | dibujada a su tamaño en cada cuadro, sin `transform: scale` |
| el intermedio | — | PNG entre el cuadro y el encoder, no JPEG: es lo que se sube |
| la guarda | `--verificar` | `pnpm verificar`, con la misma geometría que dibuja |
| iterar | re-encode por ajuste | Studio, en vivo; `pnpm render` al final |

Lo que el brief se apartó de la referencia, a propósito y anotado al
lado del número: el teléfono al 75 % del alto en vez del 95.3 % (más
aire) y la sombra más marcada (α .82 σ 7 + α .32 σ 36 en px de 720; las
corridas quedan las medidas, que son las únicas que hay). Y una
decisión medida sobre la grabación nueva: la cámara se queda cerrada
hasta los 3.9 s, no los 2.6 del brief, porque el arrastre a Stocks
termina a los 3.80 y la ráfaga de tabs empieza a los 5.37: la entrada
cubre los dos gestos lentos y la ráfaga se ve entera desde el encuadre
final.

**Verificado antes de mirar:** los doce estados de la cámara con el
hueco lleno (0 píxeles sin rojo), y las esquinas a 3× en los cuadros
del zoom y del encuadre final.

**Segunda toma, con lo que el usuario vio.** Sobre el primer video dijo
tres cosas: que de For you a Following "se traba", que la parte rápida
pasa demasiado rápido, y que entre Following y Stocks tiene que ir
lento. Medido sobre la grabación: la entrada a Following era un salto
instantáneo (un solo cuadro), Following → Stocks era un toque de 0.27 s
y la ráfaga eran toques cada 600 ms. La toma nueva arranca en Following,
arrastra a Stocks en 1.65 s con un seno in-out (X, medido: 1.73), toca
For you y hace cinco flicks de un tab cada 1.0 s con el perfil de dedo
ajustado contra X (15 % en 110 ms, el resto en 430). Los gestos van
por los caminos reales de la pieza, con una sonda `?demo=1` que vive en
el árbol de trabajo y no viaja.

**Y un bug de la pieza que la sonda destapó.** Al mover el pager por
`destino` con `movimiento` en arrastre, la barra leía el tramo del
toque —`destino !== NADIE` era su condición— y el subrayado quedaba
clavado en For you mientras el contenido viajaba ("está bugueada toda
la animación de las tabs… nunca está la animación a medias"). La
condición correcta es `movimiento === toque`: para un toque real es lo
mismo, y para cualquier otra cosa que use `destino` la barra sigue al
contenido. Verificado en la tira de cuadros del arrastre lento: el
subrayado viaja continuo de Following a Stocks y las tintas se cruzan.

**Tercera toma: dos atrás al final, y nacer en Following de verdad.**
Dos pedidos más sobre el video: que al llegar al último tab vuelva dos
atrás y termine ahí, y que el primer cuadro muestre Following con el
contenido de Following —mostraba el tab de Following con el contenido
de For you. Lo segundo era la sonda: un `scrollTo` en el primer efecto
no movía el pager (el contenido todavía no estaba) y sólo `scrollX`
cambiaba, así que la barra y el contenido nacían desacordados. Ahora el
pager nace con `contentOffset` en Following y `scrollX` nace ahí
también. El clip queda en 12.9 s: arrastre lento a 1.20, toque a For
you a 3.80, cinco flicks hasta Design y dos de vuelta hasta Tech, cada
uno a 1.0 s del anterior.

**Dieciséis sombras, lado a lado.** Antes de elegir la sombra del
mockup se midió qué hacen las referencias, con el mismo método que con
@nater02 (luma alrededor del borde del teléfono, dos gaussianas con
corrida). Los clips del vault se parten en tres familias: **sin sombra
o casi** (Floating bar y Photo picker: cero niveles fuera del borde;
solarn: ocho), **una sola capa ancha y tenue apenas corrida** (Swipe to
pay α .20 σ 60; Pill to button α .15 σ 75; Shelf to card, abajo), y
**dos capas, contacto más ambiente, corridas a la derecha y abajo**,
que es sólo el video de referencia. Con eso, más los sistemas de diseño
(Material elevación 24, las capas de Comeau) y los estilos conocidos
(larga y dura, flotante, contacto, halo, dramática), la grilla `Sombras`
del mockup muestra dieciséis variantes del mismo cuadro con su recibo
abajo. El modelo de sombra creció para poder dibujarlas: cada capa
tiene corrida en x y en y, color y expansión, y la corrida diagonal
única de antes es el caso particular.

**Dos fondos por video, y el proceso escrito entero.** Regla nueva: cada
video sale dos veces, sobre el fondo claro medido y sobre uno oscuro
(`pnpm render:ambos`). El oscuro no tiene referencia en el vault —los
clips que parecían oscuros, Mini player y Hold to commit, miden blanco
en las esquinas: era el teléfono ocupando el cuadro— así que es el
neutro bajado al 11 % con el mismo tinte, #1C181A, y la sombra queda
igual porque negra sobre casi negro no se ve; el teléfono se separa por
el canto del bisel. Y la línea completa —de la sonda en la pieza al
render doble— quedó en `mockup/AGENTS.md`, con cada mini-decisión y su
porqué, y la sonda de grabación para copiar en `nativo/AGENTS.md`.

**Los dos videos entran a la library, y la card elige.** `Swipeable
tabs` ya no tiene el hueco vacío: lleva el mockup claro en `video` y el
oscuro en `videoOscuro`, los dos a 1080² (el doble del hueco del detalle
y algo más) por `pnpm pieza:video … --oscuro`. La card los elige con
`prefers-color-scheme`, que es lo único que la library sigue —no hay
switch de tema—, con un `useSyncExternalStore` sobre el `matchMedia` y
un `key` por src para que el `<video>` arranque de cero al cambiar. Sin
`videoOscuro`, el claro va en los dos modos.

**El mockup en la library, grande y del color de la card.** Dos quejas
sobre la primera puesta: el teléfono se veía chico adentro del cuadrado
y el fondo del mockup no era el de la library. Se probó dibujar el
teléfono con CSS alrededor de la grabación cruda, como hace benji.org
(su video es la pantalla sola y la página pone un phone.png; medido:
marco del 4.3 % del ancho, esquina del hueco al 14.4 %) y se rechazó:
"el mockup del iPhone debe estar como antes". Lo que quedó: la library
lleva **su propio par de renders** del mismo mockup, con el fondo igual
a `--surface` de la card en cada tema, el teléfono al 86 % del cuadro
(benji: 85 %, medido en su card) y la salida de la cámara a 1× para que
el teléfono termine entero y centrado. Y la muestra se dimensiona por
el ALTO del hueco: una grabación cruda sigue cayendo en 228×448, y el
cuadrado llena lo que la caja deja, 440. Medido en el navegador: en
claro el video decodifica (248, 248, 246), la superficie exacta; en
oscuro decodifica (14, 14, 14) contra (14, 14, 13) de la superficie —un
nivel de azul que el 4:2:0 del h264 no puede dar (probados 10 a 14 de
azul: ninguno cae en 13). No se ve, y no se toca el token por un códec.

**Un solo fondo: el de la library.** El par con el color de la card
horneado tampoco gustó: "que haya solo un fondo, que sea el del lugar
que da la library, y sin sombra, como hace Family". Así que la library
lleva **un video transparente y sin sombra** —el teléfono al 86 % del
cuadro y la cámara terminando a 1×— y el fondo lo pone la card en el
tema que sea; los tokens mandan, el video no trae color. Es lo que hace
Family en benji.org: la página pone el fondo y el teléfono va limpio. El
alfa viaja en dos archivos porque ningún códec lo lleva a todos los
navegadores: WebM VP9 con alfa para Chrome y Firefox, y HEVC con alfa en
.mov para Safari, que sale del máster ProRes 4444 con el encoder de
VideoToolbox de macOS. La card los ofrece con dos `<source>`, el .mov
primero: Safari es el único que lo abre, y al revés tomaría el WebM y lo
dibujaría sobre negro. Con esto `videoOscuro` y el hook del esquema de
color se fueron: no hay nada que elegir por tema.

**Más cerca, y el corte del zoom en el borde de la caja.** Con el video
transparente, el cuadrado del mockup vivía centrado en la caja de la
card con el padding de 40/60 alrededor, y cuando la cámara entraba el
teléfono se cortaba contra ese cuadrado invisible, 60 px adentro del
borde de la caja: un corte que no venía de nada. Ahora el video ES la
caja —560 de lado, sin padding— y el corte cae en el borde del espacio
que da la library, que es donde un ojo espera un límite. Y el teléfono
va al 92 % del cuadro, 515 px en vez de 378, porque el usuario lo pidió
más cerca. El hueco de 228×448 sigue vivo para la card sin video.

**En la library la cámara se queda.** "Que sea todo exactamente igual
salvo que una vez que se hace zoom, se quede ahí hasta el final, así
se ve lo que estoy mostrando, que son los tabs." Así que el render de
la library entra a la fila de tabs y no sale: `hasta` fuera del clip.
El video de X sigue con la salida medida en la referencia. Y un bug
que casi viaja: el máster ProRes 4444 salía sin alfa —esquina 255,
medido— porque Remotion necesita `--pixel-format=yuva444p10le` además
del perfil; el .mov de Safari habría tenido fondo negro. El script lo
mide ahora antes de seguir y corta si el alfa no es cero.

**La velocidad, como en Family Values.** Al pasar el mouse por el video
aparece arriba a la derecha un botón que alterna 1x y 0.5x y escribe
`playbackRate`. Está medido en el código de benji.org: 1rem de padding
desde la esquina, 0.75rem/460, alto 1.25rem, radio píldora, color
#989897, ancho 1.75rem en 1x y 2.5rem en 0.5x, los dos rótulos
superpuestos y cruzados por opacidad, hover con fondo #f2f2f2, todo con
`transition: all .2s ease`. Acá los colores son los tokens que ya dicen
lo mismo —`--text-secondary` y `--surface-hover`—, la tipografía la de
nav (13/460, la más chica del sistema) y el movimiento `--dur-surface`
con `--ease-surface`. Una diferencia a propósito: en benji el botón
está siempre; acá se revela con el mouse sobre el video —lo pidió el
usuario— y queda siempre visible donde no hay hover. La velocidad se
vuelve a escribir en `loadedmetadata`, porque un cambio de fuente la
devuelve a 1. Verificado en Chrome: 1 → 0.5 → 1 en `playbackRate`, el
ancho 28 → 40, el rótulo cruzado, opacidad 0 sin el mouse y 1 con él.

**Ajuste al botón de velocidad.** Siempre visible en el detalle, como en
benji; en el hub de la library sólo con el mouse sobre el video, porque
ahí es una lista y un control por card es ruido. Sin fondo ni cambio de
color al pasar por encima: el rótulo alcanza. Y el rótulo es "1x", no
"1.0x".

**La calidad a 0.5×, medida antes de tocar.** "A 0.5 se ve en mala
calidad, medio lag." En Chrome, con `getVideoPlaybackQuality`: 240
cuadros presentados en 4 s a 1× y 119 a 0.5×, cero caídos en los dos
casos. Es decir, el navegador no pierde nada: a 0.5× muestra 30 cuadros
únicos por segundo porque la grabación tiene 60, y eso es un techo de
la fuente, no del códec. Se probó levantarlo interpolando a 120 con
`minterpolate` y se descartó con evidencia: en el arrastre lento deja
fantasmas en los bordes del texto, y en los flicks duplica las letras
enteras. Lo que sí mejora la calidad se hizo: el video pasa de 1280² a
**1120², que es 1:1 con la caja de 560 en retina** —cada píxel del video
cae en uno de la pantalla, sin re-muestreo— y decodifica un 23 % menos;
el VP9 va a crf 18 explícito y el HEVC de Safari sube de calidad 70 a
85 sin priorizar velocidad. Un 120 real pediría grabar a 120 Hz, y el
simulador rinde a 60.

**Los 60 fps, de punta a punta, medidos.** Tres lugares donde se
podrían perder cuadros, y qué dio cada uno:

| dónde | medida | resultado |
| --- | --- | --- |
| la grabación | cuadros escritos dentro de cada gesto contra la duración del gesto × 60, en tres tomas | 100.7 %, 101.1 % y 100.2 %: no falta ninguno. Los deltas de 20–30 ms entre marcas de tiempo son jitter del grabador, no cuadros perdidos (si faltaran, la completitud bajaría) |
| el render | Remotion dibuja cada cuadro por número, no por reloj | por construcción, 776 de 776 |
| el navegador | `getVideoPlaybackQuality` en Chrome, 4 s a 1× y 4 s a 0.5× | 240 y 119 presentados, 0 caídos |

Lo que quedaba por hacer no era arreglar una pérdida sino cuidar que no
aparezca cuando la lista crezca: un VP9 con alfa se decodifica por
software en Chrome (no hay camino de hardware para el alfa), y son dos
decodificaciones por cuadro. Así que **el reproductor sólo reproduce lo
que se ve** —pausa y retoma con IntersectionObserver, como benji, que
monta su player recién en pantalla—, precarga entero lo visible, y no
redondea las esquinas del video transparente: era una máscara sobre una
capa de 1120² por cuadro para no cambiar nada. Si algún día un equipo
flojo cae cuadros, el siguiente escalón es un h264 opaco con el color
de la card horneado, que decodifica en hardware en todos lados; se
descartó por ahora porque el oscuro queda a un nivel de azul de la
superficie.

**Las notas de la pieza, en el tono de Josh Puckett.** Se leyeron sus
páginas —Bloom, Pasito, Melt Effect— y las secciones de Family Values
de benji. Josh: una línea bajo el título que dice qué es, secciones
cortas con títulos llanos ("Anatomy", "A note on performance"), dos o
tres oraciones cada una, "you" cuando te habla, y una parte por oración
cuando desarma el componente. Benji escribe ensayos largos por
principios y sólo se le toma el pie de un renglón bajo cada demo. Las
notas de Swipeable tabs pasan de un ensayo de cinco secciones largas a
seis secciones de 252 palabras en total: qué hace, anatomía, de dónde
salen los números, lo que cambié a propósito, una nota sobre la
grabación y probarlo en la mano. La línea del detalle: "X’s home tabs
for Expo. Swipe between feeds, tap to jump, and the header folds away
as you scroll."

**En la lista, el video arranca con el puntero, como en el vault.** La
card entera es el disparador —apuntarle sólo al video dejaría media
card muerta—, entra con el mouse o con el foco del teclado, se pausa al
salir y retoma donde estaba, sin rebobinar; con reduced-motion no
arranca. Sin autoplay y con `preload="metadata"` más el fragmento
`#t=0.1`, que obliga a pintar el primer cuadro (el truco del vault: en
0 algunos contenedores todavía no tienen cuadro clave). El detalle sigue
con autoplay y precarga entera: es la pieza que viniste a ver.
Verificado en Chrome: pausado en 0.1 al cargar, reproduce con la card
bajo el puntero, pausa al salir conservando el tiempo.

**Todo nombre usa vocabulario profesional preciso.** Regla traída por
el usuario el 2026-09-07 (de otro `CLAUDE.md`, en captura), y vale para
el repo entero: archivos, scripts, carpetas, funciones, variables,
clases, commits, ramas, lo que sea, con la palabra que un ingeniero de
IBM habría escrito en una especificación en 1972 — sin jerga, sin
abreviaturas casuales, sin nombres graciosos ni ingeniosos, sin palabras
del chat. `deploy_dashboards.sh`, no `push_dashboards.sh`, y eso es una
ilustración, no el alcance. Vive en `AGENTS.md › Método de trabajo` y
como quinto punto de `CLAUDE.md`. Se aplicó primero al texto público: la
descripción de Swipeable tabs dice "collapses" donde decía "folds away",
y las partes de la anatomía se llaman `Header`, `Tab bar`, `Pager` y
`Page`, no "the fold".

**La anatomía, en partes con nombre, como josh en /bloom.** El párrafo
único de "Anatomy" mezclaba cuatro cosas en seis oraciones y el usuario
pidió explicarlo "como lo haría benji taylor o josh puckett, bien
simple" (2026-09-07). Medido en /bloom (API Reference, sobre la página
servida): cada parte es un `h3` con el nombre —16/500/24, la tinta del
título— y, a 8 px, un párrafo de una o dos oraciones —16/400/24, gris—;
las partes van a 64 una de otra ("Container — The morphing element.
Automatically sizes to fit the trigger content, then animates to the
menu dimensions"). En /drawesome benji hace lo mismo en prosa: lista las
herramientas y después cuenta qué hace cada una ("Each pen behaves like
the thing it's named after"). Acá es un componente `Parte` en
`notas.tsx`: el nombre en `--type-h3` (14/500, el título de pieza: mismo
rol, un nombre corto que encabeza algo), el párrafo en cuerpo y en tinta
como toda la prosa, 8 de nombre a párrafo (`--note-part-gap`) y entre
partes el hueco de párrafos (20; el 64 de josh es su hueco de sección y
ese acá ya es `--section-gap`), elegido mirando. Cuatro partes de arriba
a abajo —Header, Tab bar, Pager, Page—, cada una con qué es y después
qué hace, en dos a cuatro oraciones y sin adjetivos; la frase de la fila
que sólo se corre cuando el tab no entra pasó de Performance a Tab bar,
porque es comportamiento y no rendimiento. Cada afirmación sale del
código de la pieza y de sus recibos: el bloque que se mueve entero, la
barra sin estado que dibuja desde un solo valor, el toque que mueve el
contenido una sola página, la háptica por cambio de tab, el pliegue
1:1 hasta que el divisor toca la barra de estado.

**La anatomía vuelve a ser prosa: el subtítulo por parte se rechazó.**
Con la página servida el usuario dijo "no me gusta esta estructura"
(2026-09-07) sobre los cuatro h3 (Header, Tab bar, Pager, Page). Se
retiraron el componente `Parte`, sus reglas de CSS y el token
`--note-part-gap`; el contenido de esa vuelta se quedó, en tres
párrafos que nombran cada parte al pasar —qué partes hay y cómo forman
un bloque; cómo la barra y el pager comparten un solo valor; cómo el
scroll de la lista colapsa el header— con el "How it works" de benji en
/liveline como modelo de forma: prosa corrida de oraciones cortas ("One
<canvas>, one requestAnimationFrame loop. When a new value arrives,
nothing jumps."). Queda anotado en `notas.tsx` para que nadie vuelva a
proponer el h3.

**La línea de descripción y el título, bajo la regla de nombres.** El
usuario pidió usar la misma regla "para la descripción y para los
títulos" (2026-09-07). La línea pasa de "Swipe between feeds, tap to
jump" a "Swipe between tabs, tap to select one": las páginas son tabs
(dos feeds y cuatro temas), y "select" es el verbo de especificación
donde "jump" era el coloquial. Auditados contra la regla y sin cambio:
el título `Swipeable tabs` (el término de los SDK: `Swipeable` en
gesture-handler, "swipe" en la HIG), el masthead `Library`, los rótulos
`Web` y `App`, y los títulos de las notas `Anatomy`, `Performance` y
`Use cases`. `AGENTS.md › Cómo se nombra` lo deja escrito para las
piezas que vengan.

**Anatomy habla sólo de la animación que da nombre a la pieza.** El
usuario, con la prosa en pantalla: "en anatomy que se hable solo de la
animación de los tabs, no de las otras cosas" (2026-09-07). Salieron de
la sección el header que colapsa, las listas y el avatar —siguen en la
grabación y en la línea de descripción— y quedaron dos párrafos sobre
los tabs y el cierre de la medición: la fila de labels con su subrayado
sobre un ScrollView paginado, la barra sin estado que dibuja subrayado,
colores de label y símbolos desde un solo valor; el arrastre como scroll
nativo con la curva de iOS, el toque en 300 ms que mueve el contenido
una sola página, el tab que crece para su símbolo mientras los labels
vecinos se apartan, la fila que sólo se corre cuando el próximo tab no
entra, y la háptica por cambio. Es la regla para las notas que vengan y
está escrita en `notas.tsx`: la sección desarma la animación, no la
pantalla.

**La línea de descripción no nombra la app; la referencia se cuenta en
Anatomy.** "En la descripción principal no pongas X's tabs, mencionalo
explicando el proceso o en anatomy, que la referencia fue sacada de
ahí" (2026-09-07). La línea queda "A tab bar with paged content, for
Expo. Swipe between tabs, tap to select one, and the header collapses
as you scroll." —qué es y qué hace, como el título, que tampoco nombra
la app— y el cierre de Anatomy dice de dónde salió y cómo se midió:
"The reference is the home tabs of X on iOS. Every value is measured
from there: four recordings at 60 fps, read frame by frame, each number
next to its receipt in the code." Escrito en `AGENTS.md › Cómo se
nombra` para las piezas que vengan.

**Anatomy y la línea, escritas para quien acaba de ver el video.** El
usuario, con la versión anterior en pantalla: "decí React Native, no
Reanimated, no se suele decir eso, y no me gusta tanto anatomy y
descripción, no siento que sea útil" (2026-09-07). Lo inútil era el
punto de vista: contaban la implementación —un valor derivado, el pager
que le pasa un tramo a la barra, worklets— a alguien que vio doce
segundos de video y quiere saber qué miró y con qué está hecho. Ahora
la línea dice qué es y los tres detalles que hay que mirar ("Top tabs
for React Native. The underline follows the drag, the active tab widens
to show its symbol, and a tap moves the content one page, however far
the tab is."), y dejó de mencionar el header que colapsa, que la
grabación no muestra. Anatomy va de lo que se ve al cómo: el subrayado
atado al scroll, que va con el contenido y frena con él; el toque que
activa el tab en 300 ms, lo ensancha para su símbolo, aparta los otros
labels y cruza una sola página; la fila que sólo se corre cuando el tab
no entra; la háptica por cambio; con qué está hecho (SF Symbols, la
háptica de Expo) y de dónde salió (X en iOS, cuatro grabaciones a
60 fps). Performance dice lo mismo que antes en llano: "on the UI
thread, not in JavaScript", sin nombrar la librería. Las tres reglas
—desde lo que se ve, sólo la animación que da nombre, sin nombres de
librerías— están en `notas.tsx` y en `AGENTS.md › Cómo se nombra`.

**La línea, muchísimo más corta.** "Muchísimo más corto esto" (usuario,
2026-09-07) sobre la línea de tres detalles. Queda "Top tabs for React
Native. The underline follows the drag.": qué es y el detalle que se
ve primero; los otros dos —el tab que se ensancha, el toque que cruza
una sola página— ya están en Anatomy y ahí se quedan. Es la medida de
josh: una línea bajo el título ("A tiny, fully-themeable, and
dependency-free fluid stepper component"). Regla en `AGENTS.md › Cómo
se nombra`: qué es y un detalle, una línea.

**La línea, sólo qué es y para qué plataforma.** "Que sea tabs, React
Native, Expo, bien escrito" (usuario, 2026-09-07). Queda "Top tabs for
React Native and Expo.": el término de React Navigation para esta
barra, y las dos plataformas como las nombra el ecosistema ("React
Native & Expo"). El detalle del subrayado que llevaba la versión
anterior está en la primera oración de Anatomy y no hacía falta dos
veces. Regla en `AGENTS.md › Cómo se nombra`.

**"&" en la línea, no "and".** Pedido del usuario (2026-09-07). Queda
"Top tabs for React Native & Expo.", que es como el ecosistema escribe
el par. El "for" se quedó: es la preposición de las dos referencias en
su línea bajo el título —"a drawing toolbar for React" (benji,
/drawesome), "a real-time animated line chart component for React"
(benji, /liveline), "An iOS inspired pull down menu for the web" (josh,
/bloom)—, leída en sus páginas servidas el mismo día.

**Anatomy enumera las reglas de motion que la pieza cumple, y sólo
esas.** Pedido del usuario (2026-09-07): "aclará reglas que sigan a
/animate-expo y /interface-craft y /better-ui si cumplen con el
código", y que no se diga de dónde son los símbolos. Se auditó el
código contra los tres skills antes de escribir una palabra; entraron
ocho reglas con recibo en archivo y línea (el detalle está arriba de
`src/notas/swipeable-tabs.tsx`): sólo transform y opacity, con el
subrayado como el único ancho animado y dentro de la excepción (hijo
absoluto sin hijos); el gesto interrumpe la animación; ease-out, nunca
ease-in; una háptica por acción, en el cuadro del cambio y nunca como
única señal; reduced motion en la propia animación; 120 fps habilitado
en ProMotion (SOURCE, `app.json`); cada valor una constante con su
fuente y un solo valor guiando la transición; el movimiento nunca como
única señal. Quedó afuera, a propósito, la puerta "tab switches never
slide" de animate-expo: la pieza desliza porque la referencia desliza,
medido cuadro a cuadro, y la regla apunta a los tabs de abajo. En el
texto público las reglas no llevan el nombre de los skills —son
archivos locales que el lector no conoce— sino "the library's rules
for motion"; la atribución vive en el comentario del archivo.

**Las reglas, sin frase que las anuncie.** "It follows the library's
rules for motion" se rechazó ("no me gusta esta frase", 2026-09-07).
El párrafo arranca por la primera regla —"Only transform and opacity
animate"— como el "How it works" de benji, que tampoco anuncia: dice.

**Una pasada de redacción sobre el texto público, con `better-writing`
y la regla de vocabulario.** Pedido del usuario (2026-09-07): "fijate
que todo respete la regla del vocabulario tipo ingeniero de IBM del 73,
y mejorá un poco la redacción como la haría benji o josh; revisá
better-writing". Lo que cayó: los modismos ("mid-flight", "tied to",
"runs ahead or lags behind", "in step", "cue") pasan a la palabra de
especificación ("in progress", "bound to", "synchronized", "feedback");
"absolute element" a "absolutely positioned"; "ProMotion screens" a
"ProMotion displays", como lo llama Apple; "first-level filters" a
"top-level sections"; "React never renders a frame" a "React does not
render"; la medición dicha en llano ("the recording holds 60 fps
through every gesture"); y una frase que estaba en Anatomy y en
Performance quedó sólo donde explica algo. La lista completa de cambios
está arriba de `src/notas/swipeable-tabs.tsx`.

**Performance, con el método de Anatomy.** Pedido del usuario
(2026-09-07): mejorarla "siguiendo todas las mismas reglas de
better-ui, animate-expo, interface-craft, la regla de hoy y
better-writing". Se verificó cada afirmación en el código antes de
escribirla y salió en tres párrafos, desde lo que se nota hacia el
cómo: (1) todo en el hilo de UI y ninguna vuelta a JavaScript por
cuadro —sólo al empezar o terminar una acción: bloquear y soltar el
pager en un toque lejano, y la háptica—; (2) cero layout mientras el
contenido se mueve —la fila no es un flex row, las posiciones y anchos
de cada estado de reposo se calculan una vez y cada cuadro interpola
entre dos—, más las páginas memoizadas con la medición del tirón que
evitan; (3) un solo valor del que derivan subrayado, labels y símbolos
en el mismo cuadro, y lo medido: 60 fps en cada gesto y una traza de
492 cuadros sin titileo. Ningún nombre de librería; "moves as one
object" es la regla de cohesión de better-ui dicha en llano. Los
recibos, archivo y símbolo, están arriba de `src/notas/swipeable-tabs.tsx`.

**Chequeo de veracidad de Performance y Anatomy.** Pedido del usuario
(2026-09-07): "chequeá que toda esa información sea verdadera y
correcta". Se releyó cada afirmación contra el código y las tablas de
medición; tres eran imprecisas y se corrigieron en el texto público:
un arrastre sólo interrumpe un toque al tab vecino, porque el toque
lejano bloquea el pager mientras dura; React no renderiza durante el
ARRASTRE, pero un toque lejano renderiza dos veces y la háptica del
arrastre cae en medio del gesto, así que la frase dice "during a drag"
y "discrete moments"; y el tirón medido es un cuadro entero perdido,
no un segundo cuadro que "alcanza" (saltó 0.195 donde el ease pedía
0.252). Una cuarta se ajustó de alcance: "no layout runs" es para los
tabs, porque el ancho del subrayado sí es layout de su propio nodo.
Todo lo demás se confirmó con su recibo: la fila se corre desde un
worklet, el layout precalculado depende sólo de los labels medidos, las
páginas están memoizadas, la completitud fue 100.7 %, 101.1 % y
100.2 %, y la traza de 492 cuadros es la que está en `pantalla.tsx`.

**El dedo interrumpe también un toque lejano.** De la auditoría contra
los skills (2026-09-07) quedó una sola regla en contra: `animate-expo`
pone la interrupción como piso, y el pager rechazaba el dedo durante
los 300 ms de un toque a dos o más tabs (`scrollEnabled={!quieto}`),
por la página prestada. El usuario eligió cumplirla sin tocar la
animación del toque, para no regrabar: la grabación tiene un solo toque
lejano (Stocks → For you a los 4.1 s) y el gesto siguiente arranca a
los 5.1 s, así que ningún cuadro cambia. Cómo: el préstamo sigue vivo
mientras el dedo arrastra —la barra sigue de `desde` a `hasta` con el
avance leído del scroll— y se devuelve sólo cuando no se ve: al llegar
al destino, o al frenar sobre la página prestada, saltando en el mismo
cuadro a su lugar real con la háptica de ese salto silenciada. Un toque
nuevo sobre un préstamo sin asentar lo asienta primero. Se fue el
estado `quieto`: el pager ya no tiene estado de React, y las páginas
siguen memoizadas por cualquier render del padre. La esquina que queda:
arrastrar hacia atrás más allá de la página prestada dentro de esos
300 ms muestra el lugar vacío de donde salió; se arregla al soltar. SIN
RECIBO en pantalla: se prueba en el teléfono tocando lejos y arrastrando
enseguida, en las dos direcciones. Las notas públicas se actualizaron:
"A drag interrupts a tap at any point, however far the tab is" y "React
does not render during a gesture or a tap".
