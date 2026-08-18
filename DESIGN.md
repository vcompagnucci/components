# Design system

Todo lo decidido, con su valor, dónde vive y de dónde salió.

El README cuenta **qué** se decidió y por qué. Este documento es la
referencia: los tokens, sus valores en cada viewport, y las reglas que
gobiernan cómo se agregan los que falten.

---

## Cómo leer esto

Cada valor lleva su grado de evidencia. No son adornos: el grado dice
cuánto podés confiar en el número y qué haría falta para cambiarlo.

| | qué significa |
|---|---|
| **MEDIDO** | leído del código servido de una referencia y verificado contra su HTML renderizado, no sólo contra su hoja de estilos |
| **ELEGIDO** | decidido a ojo sobre la página real con un scrubber o un picker, porque no había nada que copiar |
| **HEREDADO** | viene del `DESIGN.md` de Carousels. **No se puede verificar** — ese archivo no está en el repo ni en el disco. Son decisiones tomadas y se respetan, pero su fuente es una cita ciega |
| **ANDAMIO** | valor del scaffolding inicial que nadie decidió todavía |

Las mediciones completas están en `.context/recon/`:
`TYPE-SYSTEMS.md`, `RESPONSIVE.md`, `NAVIGATION.md`.

---

## Las cuatro reglas del sistema

Salieron de medir a las referencias y valen para todo lo que se agregue
de acá en adelante.

### 1 · Se encodea lo que no se puede ver; se comenta lo que sí

El `calc` de `--section-content-gap` existe porque corrige media caja de
línea, un artefacto **invisible**: sin él elegís 32 y en pantalla hay
41.5. En cambio la invariante de agrupación no lleva `calc` porque si se
rompe **se ve en el acto**.

Es la práctica de benji, verificada en sus 130 KB de CSS: escribe
literal lo que elige, usa variable sólo lo que repite en dos lugares, y
reserva `calc` para geometría — centrar un círculo de 9px contra una
caja de 20. **Cero espaciados derivados de otro por proporción.**

Derivar además pelea con la regla de ×4: cualquier razón sobre una base
arbitraria da números sucios.

### 2 · ×4 en layout, libre adentro de componentes

Todo espaciado de layout es múltiplo de 4. Adentro de un componente no
rige.

Es su separación: usa 2, 3, 5, 6 y 10 —el 6px aparece **28 veces**— pero
sólo en `.Toolbar_*`, `.BarSlider_field`, `.submitButton` y variantes
`[data-size=sm]`. Ni uno solo en layout de página.

> Hoy no tenemos nada interno: la card está vacía y el único componente
> es la flecha del detalle, que es andamio. La escala fina se va a
> definir con la primera pieza real, no antes.

### 3 · Nunca un salto menor a 40 entre dos niveles de la misma jerarquía

Vale para los pesos. El conteo completo de sus `font-weight` da
`100·200·400·430·450·460·500·560·600·620·700·800`, o sea que sí tiene
saltos chicos — pero **430** es para cursivas (la itálica se ve más
pesada y la compensa bajando 30) y **450** para internos de componente.
Compensación óptica y one-offs, nunca escalones.

### 4 · El nombre es el rol; el valor es contextual

Un token no se nombra por su valor sino por a qué pertenece, y el mismo
nombre puede valer distinto según el contexto.

Medido en 1.3 MB de CSS servido de apple, linear y openai: **ninguno de
los tres tiene un token nombrado por su valor.** No hay un solo
`--space-4` en los tres bundles.

```
linear   --button-gap · --kbd-gap · --button-icon-size
openai   --page-top-gap · --tabs-sticky-gap · --bottom-content-padding
apple    --buystrip-content-padding
         --media-gallery-bottom-content-padding-left
```

El `--button-gap` de linear vale 4, 6 u 8 según el tamaño del botón; los
paddings de apple cambian con el breakpoint. Los nuestros se mueven
en 768.

**Forma de los nombres: dueño → parte → propiedad → lado**, al modo de
apple. La tipografía usa `--type-<rol>-<propiedad>`, que es la de openai
(`--type-caption-size`, `--type-meta-size`).

---

## Tipografía

**El sistema de benji: un tamaño, jerarquía por peso, un gris.**
Elegido con un picker contra el de josh sobre la página real. Josh hace
lo contrario en sus subpáginas —cinco tamaños (30·20·16·14·12), dos
pesos, cinco grises— y su costo era competir con las piezas.

### Base — MEDIDO

| token | valor | de dónde |
|---|---|---|
| `--fs` | `14px` | su `0.875rem`, el único tamaño de su sitio |
| `--lh` | `1.428571` | su `1.25rem` sobre 14px = **20px** |
| `--tracking` | `-0.00563rem` | en **todas** sus reglas de 14px, sin excepción |
| `--fw-body` | `460` | su caballo de batalla, 38 apariciones |

La interlínea va en **px** en los roles, no como razón: es su forma
(`1.25rem` absoluto, no escala si cambia el tamaño) y deja que el
cálculo del hueco del rótulo la consuma directo.

### Roles — MEDIDO

| token | fs | lh | fw | color |
|---|---|---|---|---|
| `--type-h1-*` — título de página y del detalle | 14 | 20 | **500** | `--ink` |
| `--type-h2-*` — rótulo de sección `Web`/`App` | 14 | 20 | **600** | `--ink` |
| `--type-h3-*` — nombre de pieza | 14 | 20 | **500** | `--ink` |
| `--type-body-*` — subtítulo, descripción | 14 | 20 | 460 | `--text-secondary` |
| `--type-meta-*` — la plataforma, en el detalle | 14 | 20 | 460 | `--text-secondary` |
| `--type-nav-*` — índice lateral, rótulo y links | 13 | 16 | 460 | `rgba(18,18,18,.4)` |

Todos llevan `ls: -0.00563rem`, salvo el índice que usa `-0.0025rem`.

### La escalera de pesos: 460 · 500 · 600 — MEDIDO

**Tres pesos, no cuatro.** El 560 quedó fuera.

Lo que afirma: **el título de la página no es lo más pesado; los rótulos
de sección sí.** Es lo que él hace, verificado end-to-end —
`.article > header h1` es 500, y el separador de `/liveline` es un `h1`
**dentro** de `<article class="article">`, así que cae en
`.article h1{font-weight:600}` (confirmado por posición en el HTML
servido, no supuesto).

Su razón es funcional: un título se lee una vez y su rango ya se lo da
la posición, solo arriba y rodeado de aire. Los encabezados de sección
se buscan muchas veces, en medio de contenido, mientras el ojo salta.
**El peso va donde está el trabajo, que es escanear.**

Tres es donde está el consenso de sistemas de diseño
([EightShapes](https://medium.com/eightshapes-llc/typography-in-design-systems-6ed771432f1e):
*"some systems can get away with as few as two or three weights"*), y el
460 no se puede sacar porque es el cuerpo.

**Dos costos aceptados, escritos y no escondidos:**

1. `--type-h1-fw` y `--type-h3-fw` **empatan en 500**. A "Library" y al
   nombre de pieza los distingue la posición y el contexto, no el peso.
2. La palabra **"Web" aparece dos veces**: 600 en el separador y 460 al
   40% en el índice. Estuvo abierto y se cerró aceptándolo. No son dos
   pesos que casi empatan: son un encabezado y un renglón de lista, y se
   ven distintos porque son cosas distintas. El índice entero usa un
   solo juego de tokens, rótulo y links idénticos, que es lo de benji —
   su `nav h2` y su `nav ul li a` comparten cada propiedad y sólo los
   separa el aire.

### La fuente — self-hosteada

`InterVariable`, **el archivo oficial de rsms.me**, subseteado y servido
desde nuestro origen. Cuatro archivos partidos por `unicode-range` como
hacen benji y Google, así el navegador baja sólo el alfabeto que
necesita. Con la página en inglés eso es **un archivo de 102 KB** contra
los 343 KB del original.

| | | |
|---|---|---|
| `InterVariable-latin` | 102 KB | siempre — va con `preload` |
| `InterVariable-latin-ext` | 137 KB | sólo si aparece un carácter que lo pida |
| `InterVariable-Italic-latin` | 112 KB | sólo si aparece texto en cursiva |
| `InterVariable-Italic-latin-ext` | 151 KB | ídem |

Los dos ejes sobreviven al subset —verificado leyendo `fvar` de cada
archivo: **`opsz` 14–32, `wght` 100–900**— que es lo que hace que 460 y
560 sean pesos reales y no interpolaciones falsas. Mantener `opsz`
cuesta **36 KB** (102 contra 66 si se pinnea en 14); se paga a propósito
porque el `body` usa `font-optical-sizing: auto`.

**No es la de Google Fonts, y la diferencia es concreta.** Pidiéndole
explícitamente `family=Inter:opsz,wght@14..32,100..900` devuelve CSS con
**cero** menciones de `opsz`: ignora el eje y manda sólo pesos. Benji usa
la de Google vía `next/font` —sus 8 subsets coinciden exactamente con
los `unicode-range` de Google Fonts— así que **él no tiene `opsz` y
nosotros sí**.

La cursiva va aunque hoy no se use: el `body` lleva
`font-synthesis: none`, así que sin una itálica de verdad un `<em>`
renderizaría derecho y nadie se enteraría. Por `unicode-range` no se
baja hasta que aparezca.

> **El riesgo que esto cerró.** Antes era un `<link>` bloqueante a
> `rsms.me` — el sitio personal del autor, no un CDN de producción. Si
> no cargaba, el matching de CSS convertía 460→500 y 560→600 y la
> jerarquía se derrumbaba. Servida desde nuestro origen, si falla la
> fuente es porque ya falló todo lo demás.

**Regenerar:** bajar de `rsms.me/inter/font-files/` y correr `fontTools
subset` con `--flavor=woff2 --layout-features='*' --no-hinting`.

---

## Color

### Canvas y texto — VERIFICADO

```css
--canvas: #fdfdfc;
--ink:    #111111;
```

Vinieron heredados del `DESIGN.md` de Carousels sin poder verificarse.
**Ahora sí están verificados**: son literalmente los de benji, leídos de
sus variables declaradas —`--body-bg: #fdfdfc` y `--body-color: #111`—
y confirmados en el píxel pintado.

### La superficie — la regla de josh

```css
--surface:       #f8f8f6;   /* −5 respecto del canvas */
--surface-hover: #f3f3f0;   /* −10 */
```

**La card es más OSCURA que la página, y no lleva ni anillo ni sombra:
el contraste hace todo el trabajo.**

Las dos referencias resuelven esto de dos maneras enteras y acopladas, y
medirlas fue lo que dejó ver que lo nuestro no era ninguna de las dos:

| | canvas | card | diferencia | anillo |
|---|---|---|---|---|
| josh | `#ffffff` | `#fafaf9` | **−5** | **ninguno** |
| benji | `#fdfdfc` | `#fcfcfc` | −1 | `0 0 0 1px #f2f2f2` |
| lo que había | `#fdfdfc` | `#ffffff` | **+2** | `inset 1px rgba(0,0,0,.11)` |

Josh no lleva anillo porque sus 5 unidades alcanzan. Benji sí lo lleva
porque su diferencia es de 1 unidad —o sea nada— y a su card la define
la línea, no el relleno. Lo que había era card más **clara** que el fondo
**más** un anillo casi al doble del suyo: las dos señales tirando para
lados opuestos.

> ⚠ El `--background: #fafafa` que josh declara es letra muerta: su
> `<main class="bg-white">` lo tapa. El píxel real de su fondo es
> `(255,255,255)`.

**Se traslada su DELTA, no su valor.** Su card es `#fafaf9` sobre blanco
puro; nuestro canvas ya arranca 2 unidades abajo, así que copiarle el hex
daría sólo −3. Copiarle el color y copiarle el contraste son dos
decisiones distintas.

Se eligió −5 de una rampa de cinco: **−3 · −5 · −8 · −12 · −16**. En toda
la rampa el azul baja 6/5 de lo que bajan rojo y verde, que es su propia
relación de canal — sin eso el gris se enfría al profundizar.

### El hover — MEDIDO

Oscurece el relleno **y nada más**: ni sombra, ni escala, ni movimiento,
ni opacidad.

Sus cajas de demo no sirven de referencia acá: no reaccionan al hover
porque **no son clickeables**. Las que sí lo son están en su home —6
cards de 580×76, radio 12— y ahí el único cambio es el fondo, de
transparente sobre su página blanca a `#f5f5f5`, o sea **−10**. Nuestro
mismo −10 da `#f3f3f0`. Su transición es de 150ms, el mismo `--dur-fill`
que ya teníamos.

Verificado en la página: reposo `(−5,−5,−6)`, hover `(−10,−10,−12)`.

### Lo que se fue

`--card-ring` y `--a4` existían sólo para el anillo de la card. Elegida
esta regla no hay ninguna línea que pintar, así que se borraron en vez de
quedar como tokens sin dueño.

## Espaciado

### Los huecos verticales

Cada uno nombrado por **el bloque que lo reclama**, porque el aire lo
reclama el de abajo y no lo empuja el de arriba — la forma de benji,
verificada en su página real donde el contenedor de su gráfico lleva
`style="margin-top:2rem"`.

| token | valor | qué separa | |
|---|---|---|---|
| `--masthead-subtitle-gap` | **4** | el subtítulo, de su título | MEDIDO |
| `--section-rule-gap` | **8** | el rótulo de sección, de su hairline | MEDIDO |
| `--piece-card-gap` | **12** | la card, de su nombre | ELEGIDO |
| `--section-content-gap` | **40** | la primera pieza, del rótulo | MEDIDO |
| `--piece-gap` | **48** | una pieza, de la anterior | MEDIDO |
| `--section-first-gap` | **60** | la primera sección, del masthead | ELEGIDO |
| `--section-gap` | **64** | una sección, de la anterior | MEDIDO |

Ordenados por tamaño leen su propia escala: **4 · 8 · 12 · 40 · 48 · 60 · 64.**
Todos ×4.

**Invariantes** — comentadas, no encodeadas, porque si se rompen se ven:

- `--section-content-gap` (40) < `--piece-gap` (48), o el rótulo se
  despega de su grupo y lee flotando entre dos secciones. Ya pasó: venía
  de 56.
- `--piece-card-gap` (12) ≪ `--section-content-gap` (40), o el nombre se
  despega de su card y lee como parte de la sección.

### El marco

| token | valor | |
|---|---|---|
| `--page-padding-top` | **80 → 32** en 768 | MEDIDO |
| `--page-padding-bottom` | **80 → 32** en 768 | ELEGIDO |
| `--page-padding-inline` | **16 → 24** en 768 | MEDIDO |
| `--page-content-max-width` | **592** = 37rem | ELEGIDO |

El padding lateral de 16 arriba de 768 y 24 abajo no es una
inconsistencia: **arriba de 768 el riel está centrado con aire de sobra
y el padding es vestigial** —sólo angosta la columna—; **abajo de 592 el
riel ES el viewport** y ese mismo padding pasa a ser la única distancia
al borde de la pantalla. Un número que hace dos trabajos según el ancho.

### El índice

| token | valor | |
|---|---|---|
| `--index-offset-left` | **80** | MEDIDO |
| `--index-offset-top` | **80** de base, después medido → 237 | ver abajo |
| `--index-item-gap` | **8** | MEDIDO — los dos referentes coinciden |
| `--index-label-gap` | **16** | MEDIDO |
| `--index-group-gap` | **32** | ELEGIDO |

**El rótulo pide el doble que un link.** De benji, SOURCE y RUNTIME:

```css
.styles_container__MZ8RH nav h2 { padding: 0 0 1rem }   /* 16 */
.styles_container__MZ8RH nav ul { gap: .5rem }          /* 8  */
```

Su índice llega vacío en el HTML (`<h2></h2><ul></ul>`) y lo llena JS, así
que el CSS solo no prueba nada: medido en su página, la caja del `h2` da
31.59 con un texto de 15.60 → **16.00** de hueco, y **8.00** clavado entre
link y link, cinco veces seguidas.

**El aire lo carga el rótulo, no la lista.** El grupo es un bloque plano;
si tuviera `gap` se sumaría al `padding` del rótulo y el número escrito
dejaría de ser el número que se ve (8 + 16 = 24, y ningún token diría 24).
Cada hueco tiene un solo dueño. Es su estructura, `nav > h2 + ul`.

**El salto entre grupos no sale de él.** Su índice es plano — un título y
una lista — así que para "grupo → grupo" no hay evidencia. Es el mismo
doble una vez más: **8 · 16 · 32**.

### Dónde arranca el índice

**"Web" se apoya en la misma línea que "Button".** El primer rótulo del
índice contra el título de la primera pieza. Da un `top` de **237** a
1440 de ancho.

Se eligió mirando, con reglas rojas encima, contra otros dos pares:

| | qué con qué | arranca en | |
|---|---|---|---|
| | primer link ↔ primera pieza | 205 | descartada |
| | rótulo ↔ separador de sección | 186 | descartada |
| **✓** | **rótulo ↔ primera pieza** | **237** | **elegida** |

Se probaron y se descartaron dos más: rótulo ↔ masthead (82) y el 80
crudo sin medir, que es lo que hace benji — su `aside` está en
`top:5rem` y su `<article>` también, o sea que **alinea contenedores y
no textos**: su "Liveline" del índice cae en 138 y el del artículo en
80, y no le molesta. Las dos quedaban a 2px una de otra.

**Se alinea por la BASE del texto**, la línea donde se apoyan las
letras, no por el medio de las cajas: los renglones del índice son 13/16
y los de la página 14/20. Se mide con una sonda —un `inline-block` de
alto cero con `vertical-align:baseline`— porque no hay API que la dé.

> Base y centro difieren en `(ascendente − descendente) / 2` por em, que
> entre 13px y 14px da **0.60px**: acá el redondeo a entero se la come y
> el resultado es idéntico. Está así igual porque deja de dar idéntico
> apenas los dos tamaños se separen más.

**Y el `top` se mide, no se calcula.** El número correcto sería la suma
de todo el apilado vertical de la página, y escribirlo como `calc`
duplicaría la estructura entera en una fórmula que nadie actualizaría si
mañana entra un elemento en el medio: quedaría mal y nada lo diría.
Midiendo se corrige sola, y ya pasó — al darle al rótulo sus 16px de
aire, el índice se recolocó solo.

En `useLayoutEffect`, antes de pintar, para que no se vea el salto. Y
redondeado a entero: medio píxel de desalineación es menos visible que
un texto en posición fraccionaria.

**El costo, anotado:** es el arranque más bajo de los tres, así que es el
primero que se queda sin lugar. El índice mide 512 con las 19 piezas de
hoy y su techo es `100vh − top − 32`; en una ventana de 800 de alto eso
son 531, o sea **19px de sobra**. Pasado eso scrollea por dentro, sin
barra, que es para lo que está el `overflow`.

---

## La caja de la pieza

### La regla, de seis casos medidos

Las dos referencias contestan lo mismo, y no depende del gusto sino de
**qué hay adentro**. Detalle en `.context/recon/CARDS.md`.

| | página | contenido | qué manda el alto |
|---|---|---|---|
| benji | /liveline | canvas vivo | altura fija elegida, 180–300 |
| benji | /drawesome | SVG vivo | altura fija elegida, 400 |
| benji | /family-values | captura quieta | **el contenido** |
| josh | /bloom | demo vivo | altura fija elegida, 480 |
| josh | /pasito · media | `<img>` | **el contenido**, vía `4/3` |
| josh | /pasito · código | texto | **el contenido** |

**Vivo → altura fija, a mano. Quieto → manda el contenido.** Nunca al
revés. Ninguno de los dos usa `aspect-ratio` para algo que corre.

Nuestras dos plataformas caen una de cada lado: **Web corre vivo, App es
un video que ya trae su proporción.**

### App — MEDIDO

```css
--card-app-padding: 40px 60px;
--card-app-slot-ancho: 228px;
--card-app-slot-ratio: 228 / 448;
```

De benji · family-values, la variante que más usa (17 de 45): caja
550×532.42, radio 8, `#fcfcfc`, `box-shadow: 0 0 0 1px #f2f2f2`,
padding 40/60, teléfono 228×448 (natural 762×1502).

**No lleva altura.** Reserva el hueco del teléfono y la altura sale de
ahí más el padding: da **528** mientras el hueco entre. Su 532.42 es
`40 + 448 + 4.42 + 40`, donde el 4.42 es el hueco de línea que deja el
`display:inline-block` del teléfono — basura de layout, no un número
elegido.

Fijarlo en 528 estuvo mal y se corrigió. Barrido de 13 anchos sobre su
página: **532.42 clavado de 1920 hasta 430**, y ahí empieza a bajar —
521.6 en 390, 462.5 en 360, 383.6 en 320. Con altura fija nuestra card
se quedaba plantada y a 320 le sobraban **144px de vacío**.

**Y lo hace sin una sola media query**: sus clases no tienen ninguna. Lo
que pasa es que el ancho útil (caja − 120 de padding) cae abajo de los
228 del teléfono, el teléfono se achica solo y arrastra la caja.

El umbral sale de la misma cuenta en las dos páginas — la caja mide
`viewport − 48`, así que cede cuando `viewport − 48 − 120 < 228`:

| viewport | 396 | **395** | 394 | 392 |
|---|---|---|---|---|
| benji | 532.4 | 531.4 | 529.5 | 525.5 |
| nuestra | 528 | 526 | 524.1 | 520.1 |

**Los dos ceden en 395 exacto**, sin haber copiado ningún breakpoint. La
diferencia constante de 4.4–5.4 en todo el rango es su hueco de
inline-block, que nosotros no arrastramos.

### Web — MEDIDO

```css
--card-alto: 260px;           /* en la lista */
--card-alto-detalle: 400px;   /* al abrir la pieza */
```

Los dos son de benji, y la relación entre ellos también: adentro de una
página larga sus demos de `/liveline` miden **260** —su segundo valor más
usado, ×4 de 21— y cuando el demo **es** la página, el frame de
`/drawesome` mide **400**. Tenemos esas mismas dos situaciones.

**No cambian con el viewport, y eso también es suyo.** Sus 20 demos miden
180–300 idénticos a 1440, 768, 500, 390 y 320. Lo único que se mueve es
el ancho, así que la card pasa sola de 2.12:1 a 1.05:1.

### Los dos van como `min-height`, no como `height`

Son un **piso**. Si una pieza necesita más, empuja y la card la sigue.
Con la card vacía las dos formas dan lo mismo; la diferencia es toda a
futuro, y es la que evita volver a discutir el número la primera vez que
un componente no entre.

### Lo que da, medido en seis anchos

| | 1920 · 1440 | 768 | 500 | 390 | 320 |
|---|---|---|---|---|---|
| lista · Web | 260 | 260 | 260 | 260 | 260 |
| lista · App | 528 | 528 | 528 | 516.2 | 378.7 |
| detalle · Web | 400 | 400 | 400 | 400 | 400 |
| detalle · App | 706.8 | 706.8 | 706.8 | 516.2 | 378.7 |

**Abajo de 396 el detalle de App deja de ser más grande que la lista.**
Ahí el ancho disponible ya está debajo de los 228 del teléfono chico, así
que los dos huecos topean contra el mismo ancho y dan el mismo alto. No
es un bug: es la misma razón por la que su card cede en 395.

Y una parte de esto es composición nuestra, no suya: el **319** es su
teléfono grande, pero él lo muestra desnudo (`phoneContainer`, sin fondo
ni radio) o recortado dentro de una caja más baja, gracias a su
`overflow: hidden`. Meterlo en una card que lo contiene entero —707 de
alto— es decisión de acá.

---

## Los cinco viewports

Todo lo que la página mide, resuelto. Sólo cambian las cinco filas
marcadas; **los siete huecos verticales son constantes en todo ancho**,
igual que los de benji.

| | **1920** | **1280** | **1080** | **768** | **390** |
|---|---|---|---|---|---|
| riel | 592 | 592 | 592 | 592 | **390** |
| **columna** | **560** | **560** | **560** | **544** | **342** |
| al borde | 680 | 360 | 260 | 112 | 24 |
| padding lateral | 16 | 16 | 16 | **24** | **24** |
| aire arriba / abajo | 80 | 80 | 80 | **32** | **32** |
| índice | **sí** | **sí** | no | no | no |
| — | | | | | |
| subtítulo | 4 | 4 | 4 | 4 | 4 |
| rótulo ↔ hairline | 8 | 8 | 8 | 8 | 8 |
| nombre → card | 12 | 12 | 12 | 12 | 12 |
| rótulo → pieza | 40 | 40 | 40 | 40 | 40 |
| entre piezas | 48 | 48 | 48 | 48 | 48 |
| masthead → sección | 60 | 60 | 60 | 60 | 60 |
| entre secciones | 64 | 64 | 64 | 64 | 64 |

**Dos escalones y nada más.** No hay `clamp()` ni `vw` en ninguna parte:
escalona o no escalona, nunca interpola. Es lo de benji; josh no
escalona nada (672·24·64 desde 320 hasta 2560, cero clases responsive en
su marco).

- **1080** — se va el índice. Es su número.
- **768** — el marco y el aire. Verificado al píxel en su página: a 769
  el aire son 80, a 768 son 32.

> **Observación, no decisión.** A 1080 todavía hay 260px de aire al
> costado y el índice ocupa ~200 desde el borde: geométricamente
> aguantaría hasta ~960. El 1080 es de benji, y su riel es distinto al
> nuestro. Es conservador por unos 120px.

> ⚠ **La proporción de la card no está decidida.** Alto fijo `280px` y
> ancho fluido: 560×280 = **2.00:1** en escritorio, 544×280 = 1.94 en
> 768, y 342×280 = **1.22:1** en teléfono. A 320px sería más alta que
> ancha. Y el detalle usa **otro mecanismo** — `aspect-ratio: 16/9` en
> vez de alto fijo. Dos partes de la misma página dimensionan el mismo
> rectángulo de dos maneras distintas.

---

## Motion

**La página no tiene animación de entrada.** Abrir una pieza y volver no
anima nada. Lo único que se mueve es el hover, y son cambios de color y
de anillo, no de posición.

| token | valor | uso |
|---|---|---|
| `--ease-out` | `cubic-bezier(.23,1,.32,1)` | las tres transiciones |
| `--dur-fill` | `150ms` | las tres transiciones |

Las tres: color del link del índice, anillo de la card en hover, y fondo
y color de la flecha del detalle.

**No hay bloque de `prefers-reduced-motion`** y no hace falta: no queda
movimiento que reducir. El scroll suave del índice sí lo consulta, en
`app.tsx`.

> Antes había `enterFwd` / `enterBack` en la lista y una entrada del
> detalle. `enterBack` **nunca se disparaba**: `data-dir` estaba escrito
> a mano en `"fwd"`, así que entrar a una pieza y volver se veían
> idénticos. Se sacaron las tres en vez de arreglar la que faltaba.

---

## Render — MEDIDO

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

**Las dos, no una.** Acá la jerarquía *es* el trazo —460 · 500 · 600,
todo a 14px— así que si Firefox en macOS dibuja los tres escalones más
pesados y más juntos, no se ve "un poco distinto": se ve **menos
jerarquía**. Benji tiene las dos seguidas en su `body`.

Su `body` además lleva tres cosas que nosotros no tenemos:
`-webkit-tap-highlight-color: rgba(0,0,0,0)` (el flash azul al tocar en
iOS), `text-size-adjust: none` y `text-rendering: optimizeLegibility`.
Sin decidir.

---

## Lo que falta

**Sin decidir, y no se puede decidir mirando referencias — necesita la
primera pieza real adentro del rectángulo:**

- la proporción de la card, y unificar `height` vs `aspect-ratio`
- `--radius-tbd: 12px` — provisional
- el anillo en hover (`--card-ring` → `--a4`), sin decidir
- focus visible en la card, active, estado vacío, loading
- la escala fina de espaciado interno de componentes

**Decidible ya:**

- self-hostear InterVariable (ver el riesgo arriba)
- `"Web"` con dos pesos distintos
- si el sistema suma un tamaño más grande y uno más chico
- modo oscuro — no existe ni como pregunta

**Otra etapa:** el detalle entero — layout, la flecha `←` que hoy es un
carácter crudo, copy-URL. Sus valores (34, 24, 10, 8, 4) están marcados
**ANDAMIO** en el CSS.
