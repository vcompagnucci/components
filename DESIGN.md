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

### Los grises de texto — UN ALFA, DOS BASES

```css
--ink:              #111111;                                          /* 18.55:1 */
--secundario-alfa:  37%;
--text-secondary:   color-mix(in srgb, #000        var(--secundario-alfa), transparent);  /* → 160 */
--type-nav-c:       color-mix(in srgb, var(--ink)  var(--secundario-alfa), transparent);  /* → 166 */
```

**El sistema tiene UN nivel secundario, no dos grises.** Es la
estructura de benji, verificada en su CSS servido: declara un solo token
de color de texto (`--body-color:#111`) y **ningún** token de gris. Todo
lo gris es su negro o su ink a un alfa, y el alfa manda —`.4` aparece en
40 declaraciones, el siguiente (`.5`) en 8. Sus dos valores salen de ese
mismo 40% escrito desde dos bases:

| | base | alfa | compone | dónde |
|---|---|---|---|---|
| benji · anotación | negro puro | .4 | 152 | fecha, "Index", epígrafes, notas |
| benji · nav | su ink (7%) | .4 | 159 | su índice de página |
| **nuestra · anotación** | **negro puro** | **.37** | **160** | subtítulo del masthead, plataforma del detalle |
| **nuestra · nav** | **`--ink`** | **.37** | **166** | rótulos y links del índice |

Acá se toma su regla y se le cambia el número. El 37% se eligió en **dos
pasos**, y los dos importan porque miran cosas distintas.

**Primero el barrio**, con un slider sobre la anotación sola, contra
cuatro marcas medidas y compuestas sobre nuestro fondo:

| | | contraste |
|---|---|---|
| emil · secundario de prosa | 99 | 5.91:1 |
| emil · epígrafes de 12px | 130 | 3.78:1 |
| lo que había, de Carousels | 138 | 3.39:1 |
| benji · fecha, epígrafes, notas | 152 | 2.84:1 |
| **el del slider** | **163** | **2.48:1** |

Ese slider movía **un renglón** de la página —el subtítulo del masthead—
porque en ese momento la nav todavía era un número aparte. Sirvió para
ubicar la zona, no para fijar el número.

**Después el número**, sobre un barrido de seis alfas donde las dos se
mueven juntas, mirado de tres formas: la rampa de corrido, los dos
derivados **en contacto** —donde el escalón se ve como costura o no se
ve— y el texto real a 13/16 contra 14/20.

| α | anotación | nav | gap | Lc |
|---|---|---|---|---|
| 30% | 176 | 181 | 5 | 41 / 39 |
| 32.5% | 170 | 176 | 6 | 45 / 41 |
| 35.5% | 163 | 169 | 6 | 48 / 45 |
| **37%** | **160** | **166** | **6** | **50 / 47** |
| 40% · benji clavado | 152 | 159 | 7 | 54 / 50 |
| 45% | 139 | 147 | 8 | 60 / 56 |

Todo medido por píxel, no calculado — y el barrido valida el modelo
solo: con `α=.4` las dos bases reproducen sus 152 y 159 clavados. La
anotación termina 3 más oscura que el 163 del slider (ΔL .006, adentro
del ruido): el barrio se respetó, el número lo puso el barrido.

**Dos consecuencias, las dos buscadas.** La nav **se mueve** de 159 a
166: venía copiada de su `hsla(0,0%,7%,.4)` desde que se horneó la
tipografía del índice y nunca se eligió — bajo esta regla no se elige,
se deriva. Y el orden **se arregla solo**: antes la anotación quedaba
más clara que la nav (163 contra 159), al revés que él; ahora la nav es
la más clara de las dos, y no por decisión sino porque `--ink` es más
claro que negro puro. El gap queda en 6; el suyo es 7.

El alfa vive en su propio token para que la regla sea **una sola cosa** y
no dos números que hay que mantener sincronizados — que es exactamente
cómo se desincronizaron los anteriores. Y va en alfa y no en sólido
porque así compone sobre cualquier fondo: el día que haya texto
secundario sobre la card sale bien sin tocar nada.

> Todo contraste acá está calculado **componiendo el alfa sobre el
> fondo**. Sin eso `rgba(0,0,0,.4)` puntúa como negro puro y da 20:1 en
> vez de 2.84:1.
>
> Bajo APCA los dos quedan **debajo del piso** (Lc 50 y 47 contra los 60
> que pide para texto que no es cuerpo). Benji también: 54 y 50. Es una
> decisión tomada a conciencia, no un descuido — lo que va en gris acá
> anota, no se lee. Cruzar el piso pedía `α=45%`, que en el barrido se
> vio demasiado oscuro para el rol.

**Emil parte el gris en dos donde benji tiene uno solo**: 99 para prosa
secundaria y 130 para epígrafes. Su canvas es `(253,253,252)` al píxel,
el mismo que el de benji y el nuestro.

> `raphaelsalaja.com` no se pudo medir: la red devuelve una página de
> bloqueo de FortiGate en lugar del sitio.

### Cómo se USA el color — MEDIDO, la forma de benji

El mapa completo está en `.context/recon/COLOR.md`. Lo que rige acá:

**1 · Todo lo que se LEE va en ink.** Párrafos, encabezados de los tres
niveles, `strong`, ítems de lista. Nunca se agrisa contenido de lectura;
la jerarquía la hace el peso y el color no participa.

**2 · El gris es para lo que ANOTA.** Le quedan el subtítulo del masthead
y la plataforma del detalle. **La descripción del detalle pasó a ink** al
tomar esta regla: es prosa.

**3 · El activo del índice no llega al ink.** Se queda en 65
(`rgba(18,18,18,.8)`), igual que su hover. Es una sola declaración suya
para los dos estados. La pieza que estás mirando se destaca sin ser lo
más oscuro de la pantalla: eso queda para los títulos.

**4 · Los links no tienen color propio.**

```css
a { color: inherit; text-decoration: underline;
    text-decoration-color: #d9d9d9; text-decoration-thickness: 1px }
a:hover { text-decoration-color: #666 }
```

Heredan el color de su bloque; lo que los marca es un subrayado en un
tono aparte. **Dos de las tres referencias hacen exactamente esto** —
benji con un pseudo-elemento de 1px `#d9d9d9`, emil con
`text-decoration-color: #bcbbb5` a 1.5px. Acá se usa el mecanismo de
emil, que no necesita `position:relative` ni `::before`, con los valores
de benji, porque nuestro texto es de 14px y no de 16.

**El hover mueve el subrayado, no el texto.** La transición corre sobre
`text-decoration-color` y nada más.

> Hoy la página no tiene ningún `<a>`. Es la regla lista para cuando el
> detalle lleve texto; los links del índice y el botón de volver son
> `<button>` y no la tocan.

**5 · El foco no anima.**

```css
:focus-visible { outline: 2px solid #005fcc; outline-offset: 2px; transition: none }
```

`transition:none` es de benji: es lo único de su página que aparece
instantáneo, contra los 200ms que tiene todo lo demás.

**El color es el anillo de foco por defecto de Chromium, medido del
motor.** Los tres motores dan tres azules distintos, leídos enfocando un
botón sin estilos y muestreando el píxel pintado:

| motor | `-webkit-focus-ring-color` | cómo lo pinta |
|---|---|---|
| **Chromium** | `#005fcc` | sólido |
| WebKit | `#0067f4` | a **50% de alfa** — el glow de Aqua |
| Firefox | no soporta la keyword | `#007aff` sólido |

Se eligió el de Chromium: el más grave de los tres y el de más contraste
—**|Lc| 77.8 claro, 34.8 oscuro**, sobre el piso de 30 que APCA pide para
componentes. Su contraparte oscura `#347ee5` sale de subirle la L con el
ΔL que aplican benji y josh a sus acentos; el mismo cálculo sobre el azul
de Firefox da `#3f9aff` contra el `#3d9bff` medido de benji — una unidad.

> Dos cosas que salieron de medirlos: el azul que había antes,
> `rgba(0,122,255,.5)` heredado de benji, **es exactamente el de
> Firefox**; y WebKit pinta el suyo a 50% clavado, o sea que el mecanismo
> del anillo viejo de Safari era el que ya teníamos.

**El `outline-offset: 2px` es de josh, y no es adorno.** Sin él el
anillo *corta* las letras de los links del índice, que son texto sin
padding. Reemplaza el `padding:0 2px / margin:0 -2px` con el que benji
despega el suyo: hace lo mismo sin tocar el layout. En la card el outline
sigue el radio 8 solo.

Y pidió un arreglo de layout que sólo se ve enfocando: el flex estiraba
cada link del índice a los **89px** del más largo mientras las palabras
miden 31–62, así que el anillo dibujaba hasta **58px de vacío**. Con
`align-items: flex-start` cada uno mide su palabra — que es lo que benji
tiene por naturaleza, porque sus links son `<a>` inline.

**6 · La selección promueve a ink.**

```css
--selection-bg:    #ededed;
--selection-color: var(--ink);
::selection { background: var(--selection-bg); color: var(--selection-color) }
```

Las tres referencias tienen regla global y no dicen lo mismo:

| | regla | fondo | color del texto | secundario seleccionado |
|---|---|---|---|---|
| **benji** | `color` + `background`, por tokens | `#ededed` | **forzado a `#111`** | 16.13:1 |
| josh | `color:#fff; background:#000` | negro | forzado a blanco | 21.00:1 |
| emil | **sólo** `background` | `#e2e1de` | **no lo toca** | **2.00:1** |

Se toma la de benji, y **lo que la decide es forzar el color**. Emil
puede no hacerlo porque su secundario de prosa está en 99; el nuestro
está en 160, y 160 sobre su `#e2e1de` da **2.00:1** — el subtítulo del
masthead se volvería ilegible justo mientras lo seleccionás.

Y no es una regla nueva: es la **regla 1** aplicada a un estado. Todo lo
que se lee va en ink, y seleccionar un texto es el acto de leerlo.

> Su `#ededed` se copia **literal**, cosa que no pasó nunca en este
> sistema. Su canvas es `#fdfdfc` y el nuestro también — el de emil
> igual, su `--color-gray-100` es `#fdfdfc`. En la card, en el hover y
> en los grises hubo que trasladar el *delta* porque los fondos no
> coincidían. Acá sí coinciden, así que copiar el hex copia el
> contraste.
>
> Sin `::-moz-selection`: benji y emil lo mandan los dos, pero es su
> autoprefixer — Firefox soporta `::selection` sin prefijo desde la 62.

### Modo oscuro — CUATRO NÚMEROS Y DOS REGLAS

```css
html { color-scheme: light dark }

@media (prefers-color-scheme: dark) {
  :root {
    --canvas: #090908;  --surface: #0e0e0d;  --surface-hover: #121211;
    --ink: #fafaf9;
    --secundario-alfa: 59.2%;  --nav-alfa: 55%;
    --hairline: rgba(255,255,255,.051);  --a1: rgba(255,255,255,.04);
    --selection-bg: #191918;
    --link-underline: #2d2d2b;  --link-underline-hover: #a0a09e;
    --focus-outline: 2px solid #347ee5;
  }
}
```

Se dispara con el sistema y nada más, **como josh** — sin toggle. De las
cinco referencias medidas sólo él tiene tema oscuro de página: benji y
emil tienen paletas oscuras en su CSS pero sólo para componentes
embebidos, y linear fuerza `data-theme="dark"` e ignora el sistema.

**No hay una paleta escrita a mano.** Hay un punto elegido en un espacio
y el resto cae de dos reglas.

| | | |
|---|---|---|
| profundidad | **9** | el gris del canvas. linear 9 · vercel 10 · emil 17 · benji 19 |
| calidez | **.003** | croma OKLCH sobre H 106.4, el tono medido del `--canvas` claro |
| ink | **250** | el de josh (`--foreground:#fafafa`) |
| tono | **106.4** | el mismo en los dos modos |

**Regla 1 · el texto conserva el contraste.** Tiene un piso de
legibilidad que las superficies no tienen, así que lo que se sostiene es
el Lc y no el número.

| | claro | oscuro | cómo |
|---|---|---|---|
| ink | 104.1 | **104.4** | ink 250 |
| anotación | 50.3 | **48.1** | blanco @ 59.2% |
| nav | 46.7 | **42.5** | blanco @ 55% |
| activo | 92.9 | **93.4** | ink @ 93% |

El 59.2% sale del **×1.6** que benji aplica en sus dos tokens con alfa
(`.28→.45` y `.10→.16`, el mismo factor dos veces). El 93% no conserva el
alfa sino la **posición** del activo entre la nav y el ink: en claro el
80% lo deja al 80.4% de ese recorrido, y en oscuro hace falta 93% para
caer en el mismo punto, porque arriba de la nav queda menos lugar.

**Regla 2 · todo lo demás conserva la distancia e invierte la
dirección.**

```
claro    card −5 · hover −9 · selección −16 · subrayado −36 · su hover −151
oscuro   card +5 · hover +9 · selección +16 · subrayado +36 · su hover +151
alfas    .051 y .04 → el mismo número, base dada vuelta
```

Lo de los alfas es de **linear**: su `--color-border-translucent` es
`#0000000d` en claro y `#ffffff0d` en oscuro, ×1.00 — y ese `#0000000d`
es 5.098%, nuestra `--hairline` a tres decimales.

> **Por qué la distancia y no el ΔL.** Es un compromiso, no una ley.
> OKLab dice que ΔL igual se ve igual, y conservar la distancia de 8 bits
> da ~1.5× de ΔL: la card **es** algo más notoria en oscuro. Pero
> conservar el ΔL exacto la dejaría en +3 y desaparece, y las dos
> referencias con escala propia agrandan mucho más —emil ×3.00, linear
> ×4.48— por robustez entre pantallas y no por apariencia: cerca del
> negro OLED e IPS divergen, hay luz ambiente y hay bandeo de 8 bits.
>
> **APCA no puede arbitrarlo**: devuelve 0.0 para todas las opciones de
> superficie. Está hecho para texto.

La rampa se genera en **OKLCH con croma y tono constantes**, que es el
método de linear: un solo tono en los dos modos, con el tinte viviendo
en toda la escala y no sólo en el fondo.

**Lo que hizo posible el ink de 250** fue reescribir el nivel secundario
como *una base y dos alfas* en lugar de *un alfa y dos bases*. Derivando
la nav del `--ink`, el ink quedaba atrapado: tenía que entrar ~17
unidades desde el extremo o las dos bases se aplastaban. Con dos alfas
queda libre. El valor en claro no se movió — `negro@34.4%` da los mismos
166 que daba `ink@37%` — y es la estructura que benji usa para su nav en
reposo y activa (`hsla(0,0%,7%,.4)` y `.8`).

> Ninguna de las cinco referencias declara `color-scheme`. Sin eso el
> navegador auto-oscurece controles nativos y barras de scroll y la
> página queda mitad y mitad.
>
### Alto contraste — LA PRIMERA SIN NINGUNA REFERENCIA

```css
@media (prefers-contrast: more) and (prefers-color-scheme: light) {
  :root { --secundario-alfa: 57.4%;  --nav-alfa: 57.4%;
          --surface: #f3f3f0;  --surface-hover: #ebebe6;
          --selection-bg: #dddddd;  --link-underline: #b5b5b5;
          --link-underline-hover: var(--ink);
          --hairline: rgba(0,0,0,.102);  --a1: rgba(0,0,0,.08);
          --focus-outline: 2px solid #0042ad; }
}
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  :root { --secundario-alfa: 78.8%;  --nav-alfa: 78.8%;
          --surface: #131312;  --surface-hover: #1b1b1a;
          --selection-bg: #292927;  --link-underline: #51514f;
          --link-underline-hover: var(--ink);
          --hairline: rgba(255,255,255,.102);  --a1: rgba(255,255,255,.08);
          --focus-outline: 2px solid #589cfe; }
}
```

`prefers-contrast: more` es cuando alguien prendió **"Aumentar
contraste"** en su sistema. No es estético como el modo oscuro: es
accesibilidad, y quien la prende pide explícitamente que los grises
tenues dejen de ser tenues.

**Cero ocurrencias de `prefers-contrast` en los cinco bundles medidos.**
Lo único vecino es un `@media (forced-colors:active)` en animations.dev,
que es una utilidad de Tailwind y no una decisión de paleta. Así que acá
la regla la pone `/better-colors`: ensanchar el gap de L **≥0.15** y
verificar contra los umbrales **preferidos** de APCA — Lc 90 cuerpo, 75
no-cuerpo.

| | claro | oscuro | pide | |
|---|---|---|---|---|
| ink | 104.1 | 104.4 | 90 | **pasa** — no se toca |
| anotación | 50.3 | 48.1 | 75 | **no** |
| nav | 46.7 | 42.5 | 75 | **no** |

**Y hay una convergencia que decide sola:** el alfa que hace falta para
llegar a Lc 75 sale **el mismo** para la anotación y para la nav —57.4%
claro, 78.8% oscuro—, porque las dos apuntan al mismo número. O sea que
en alto contraste **los dos grises se colapsan en uno.**

No es una pérdida, es la respuesta correcta: esa distinción era de 3.6 Lc
en su mejor momento, y es exactamente el tipo de sutileza que alguien
pidiendo más contraste quiere que desaparezca. La jerarquía que sobrevive
—ink contra secundario— es la que carga significado.

Llegar a Lc 75 ensancha el gap entre **0.153 y 0.194** en los cuatro
casos, o sea más que el 0.15 del skill: el umbral manda y no hace falta
un segundo cálculo.

**Lo demás no lo pide el skill, es criterio nuestro.** Bajo alto
contraste la estructura también tiene que leerse, así que **todas las
distancias que no son texto se duplican** — una regla y no cuatro
números sueltos:

```
card −5→−10 · hover −9→−18 · selección −16→−32 · subrayado −36→−72
alfas de línea al doble: .051→.102 y .04→.08
```

El hover del subrayado va directo a `--ink`: duplicar sus 151 se sale del
rango. Y el anillo de foco corre un escalón de acento más en cada
dirección, con el mismo ΔL con el que se derivó su par — claro |Lc| 77.8
→ **87.9**, oscuro 34.8 → **48.7**.

> Los dos bloques llevan `(prefers-color-scheme)` explícito en vez de
> depender del orden en la cascada. `light` matchea también cuando no hay
> preferencia declarada, así que no queda ningún hueco.

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

### El radio — MEDIDO

```css
--card-radio: 8px;
```

Censo de las 7 páginas. Para cajas grandes hay **dos números y no hay un
tercero**:

| | radio | usos |
|---|---|---|
| benji | **8** | 50 en family-values, 4 en liveline |
| benji | 14 | 3 — sólo el frame hero de `/drawesome`, y no es ×4 |
| josh | **12** | 11 en su home, 5 en pasito, 2 en bloom |
| josh | 16 | 6 — sus cajas de `<img>` |
| josh | 32 | **1** — el demo portada de `/bloom` |

Elegido el **8**: el más repetido de las dos juntas, el único que **las
dos** usan en cajas grandes, y múltiplo de 4. Lo demás son one-offs de
una sola página.

En controles chicos las dos referencias coinciden en **4 y 6**, así que
cuando haya una pieza real ahí no va a haber nada que decidir.

### El hover — ELEGIDO sobre una regla MEDIDA

```css
--surface-hover: #f4f4f1;   /* paso de −4 desde el reposo */
```

Oscurece el relleno **y nada más**: ni sombra, ni escala, ni movimiento,
ni opacidad. Eso es de josh, y la transición de 150ms también — el mismo
`--dur-fill` que ya teníamos.

**Sus cajas de demo no sirven de referencia acá: no reaccionan al hover
porque no son clickeables.** Los únicos dos hovers que tiene en las 7
páginas medidas son:

```
cards de la home    #fafafa → #f5f5f5    neutral-50 → neutral-100
botón de /bloom     #44403c → #57534e    stone-700  → stone-600
```

Los dos, **un escalón** de su rampa — y el del botón **aclara**, así que
su regla es un paso, no una dirección.

El paso de acá es de **4**, elegido a ojo entre tres: −3 (lo que da
copiar su hex literal, porque su página arranca en 250 y la nuestra en
253), −4, y −5 (su escalón de verdad). O sea medio escalón. Con el radio
en 8 la card se lee más contenida que con 12 y pide menos hover.

> Antes acá decía que su hover cae −10 respecto de su página. Ese delta
> salía de medir contra el blanco de `/pasito`, y el hover ocurre en su
> home, que es `#fafafa`.

### El press — NO HAY, y es un resultado de contar

```css
.streamItem:hover .streamPreview { background: var(--surface-hover); }
/* y nada más: no existe una regla :active */
```

Se recorrieron **23 páginas** de las dos referencias más altas —9 de
benji, 14 de josh— buscando `:active`. Hay **uno solo vivo**, y no es lo
que uno esperaría:

```
benji.org/honkish · botón 40×40
  reposo   box-shadow spread 0px
  hover    box-shadow spread 1px      ← gana un anillo de su propio color
  press    box-shadow spread 0px  ·  transition-duration 0.02s
```

Su press **no agrega un estado: retira el hover**, rápido. Y sus dos
listas —que es el mismo objeto que esta card— no tienen press: medido en
vivo, el `:active` pinta **idéntico** al `:hover` en las dos.

Las utilidades `active:scale-[0.94]`, `[0.96]` y `[0.98]` están en el
bundle de josh y **las usa cero elementos**. Lo que sí usa es
`hover:scale`, y ahí está la curva que decide:

```
 44×44   ( 1.936 px²)  →  1.03
 48×48   ( 2.304 px²)  →  1.03
 60×60   ( 3.600 px²)  →  1.03
420×124  (52.080 px²)  →  1.01      ← la bajó él
```

Nuestra card mide 560×292 = **163.520 px²**, 3× su elemento más grande.
`/better-ui` pide `scale(0.96)` siempre —"nunca menos de 0.95"— pero su
regla habla de **botones**; se miró en el prototipo y se descartó.

Se retiraron `--surface-press: #f0f0ec` (con sus ramas de oscuro y de
alto contraste) y `--dur-press: 20ms`. Eran el `--color-bg-level-3` de
linear, que cae justo en nuestro paso siguiente, y la asimetría de
benji. Los 20ms estaban bien medidos y **aplicados al revés**: en su
botón sirven para *quitar* el hover, no para profundizarlo.

### Por qué no el mecanismo de benji — CUESTIÓN DE ESCALA

Su lista hace lo contrario que la de josh: no rellena nada nunca —el
fondo del `<a>` es `rgba(0,0,0,0)` en todos los estados— y lo que pasa
en hover es que **las hermanas se atenúan**.

```css
@media screen and (min-width: 520px) {
  .styles_postList__HT8dk > ul:hover > li > ul > li > a h2,
  .styles_postList__HT8dk > ul:hover > li > ul > li > a time span { opacity: .3 }
  .styles_postList__HT8dk > ul:hover > li > ul > li > a time span:last-child { opacity: 1 }
}
```

Dos cosas de esa regla. Atenúa **texto** —el `h2` y los `span` del
`time`— nunca una superficie, porque no tiene ninguna. Y el
`span:last-child` exento es **el año**: la lista pierde el contenido y
conserva el esqueleto.

No se adopta, y el motivo es geométrico:

```
              ítems  tamaño     hueco   lista entera   visibles a 1440×900
benji            7   550×41       0px   286px = 0.3 pantallas          7
nuestro         18   560×292     48px   7.211px = 8.0 pantallas        2
```

Sus filas **se tocan** y la lista **te entra en un tercio de pantalla**:
el atenuado es un gesto sobre un objeto que ves completo, se apagan 7 y
queda 1. La nuestra no se puede ver entera nunca, así que "se apaga el
resto" sería literalmente *la otra*. El gesto no sobrevive al cambio de
escala.

> El hueco de 0px también explica por qué él pudo escribir `ul:hover` sin
> `:has()`: en su geometría no hay zona muerta posible. En la nuestra sí
> — el prototipo con su regla literal daba `0.3 / 0.3 / 0.3` con el
> puntero entre dos cards.

### Y benji, para contrastar — MEDIDO

Su CSS tiene **65 reglas de `:hover`**. Lo que tocan, por frecuencia:
`color` 26 · `background` 16 · **`transform` 15** · `opacity` 8.

**Sí usa `transform`, pero nunca en una caja.** Los 15 son controles:
`Toolbar_tool` sube `translateY(-1px)`, `Toolbar_chip` escala 1.1,
`Toolbar_custom` 1.14, el knob del slider 1.14, un link 1.05.

**Y su caja clickeable canjea, no suma:**

```css
.styles_container__joqXD             { --border:#ebebeb; --color:#111 }
.styles_container__joqXD[href]:hover { --background:#f6f6f6; --border:transparent }
```

Sólo reacciona cuando tiene `href` — el mismo caso que el nuestro, que la
card es un botón. En reposo la define una **línea**; en hover la línea se
apaga y aparece el **relleno**.

Sus tres profundidades de relleno, contra nuestro canvas:

| | | dónde |
|---|---|---|
| `#f6f6f6` | −7 | superficies: su callout clickeable, su nav trigger |
| `#f2f2f2` | −11 | controles: botón secundario, `.styles_controls` |
| `#e5e5e5` | −24 | botón terciario |

Se probaron las cinco mecánicas sobre nuestra página —su superficie
(paso −2), su control (−6), su canje (que cambia también el reposo), y
relleno más lift— y se quedó lo que ya había. Dos razones: su `#f6f6f6`
da un paso de sólo −2 porque él parte de cero y nosotros ya partimos de
−5 (otra vez su valor ≠ su contraste), y el lift él nunca lo mezcla con
relleno: uno es de controles y el otro de cajas.

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
anima nada. Y no hay una sola transición de posición: los cuatro lugares
donde hay `transition` **cruzan un color**.

| token | valor | quién lo lee |
|---|---|---|
| `--dur-fill` | `150ms` | los cuatro |
| `--ease-out` | `cubic-bezier(.23,1,.32,1)` | índice · flecha del detalle · subrayado de los links |
| `--ease-fill` | `cubic-bezier(.4,0,.2,1)` | el relleno de la card, y nada más |

```
.indexLink      color                        --ease-out
.streamPreview  background-color             --ease-fill
.back           background-color, color      --ease-out
a               text-decoration-color        --ease-out
```

`--ease-fill` es de josh —su `transition-colors` de Tailwind— y entró con
su sistema de estados. La duración no hubo que importarla: su `0.15s` ya
era nuestro `--dur-fill`.

> **Decisión chica abierta.** Los cuatro lectores hacen exactamente el
> mismo trabajo —cruzar un color sin mover nada— así que tener dos curvas
> para un solo trabajo es una incoherencia. Se cierra con una línea el
> día que se decida cuál gana; no se cerró antes porque lo que se miró en
> el prototipo fue la curva **sobre la card**, y cambiar de paso el
> índice, la flecha y los subrayados hubiera sido decidir tres cosas que
> nadie miró.

**No hay bloque de `prefers-reduced-motion`** y no hace falta: no queda
movimiento que reducir. Verificado con `reduced-motion: reduce` — la card
declara `transition-property: background-color` y nada más. El scroll
suave del índice sí lo consulta, en `app.tsx`.

Deja de ser cierto el día que entre una escala o un desplazamiento, y ahí
hay que escribirlo.

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

- focus visible en la card, active, estado vacío, loading
- la escala fina de espaciado interno de componentes — aunque ahí las dos
  referencias ya coinciden: radios de 4 y 6 para controles chicos

**Decidible ya:**

- si el sistema suma un tamaño más grande y uno más chico

**Recién cerrado:** la proporción de la card, su superficie, su hover y
su radio. `--radius-tbd` ya no existe: es `--card-radio: 8px`.

**Otra etapa:** el detalle entero — layout, la flecha `←` que hoy es un
carácter crudo, copy-URL. Sus valores (34, 24, 10, 8, 4) están marcados
**ANDAMIO** en el CSS.
