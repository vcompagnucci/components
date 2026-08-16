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
| `--type-nav-*` — índice lateral | 13 | 16 | 500 label / 460 link | `--ink` / `rgba(18,18,18,.4)` |

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
2. La palabra **"Web" queda en 600 en el separador y 500 en el índice**.
   Abierto como decisión aparte.

### La fuente

`InterVariable`, oficial, desde `rsms.me`. Eje `wght` **100–900
continuo** y `opsz` 14–32 — verificado abriendo el `.woff2`, así que
**460 y 560 son pesos reales**, no interpolaciones falsas.

> ⚠ **Riesgo abierto.** El `font-family` es
> `'InterVariable', 'Inter', -apple-system…`. Si InterVariable no carga,
> cae a `Inter` estático, que sólo tiene pesos de 100 en 100. Por el
> algoritmo de matching de CSS **460 → 500** y **560 → 600**: el cuerpo
> pasaría a pesar igual que el nombre de pieza. Hoy eso depende de que
> un CDN ajeno responda. Self-hostear está pendiente.

---

## Color — HEREDADO

Los ocho vienen del `DESIGN.md` de Carousels. Se respetan como están.

| token | valor |
|---|---|
| `--canvas` | `#fdfdfc` |
| `--surface` | `#ffffff` |
| `--ink` | `#111111` |
| `--text-secondary` | `#8a8a8a` |
| `--hairline` | `rgba(0,0,0,.051)` — **MEDIDO**: su `#f2f2f2` → `(255−242)/255` |
| `--card-ring` | `rgba(0,0,0,.11)` |
| `--a1` / `--a4` | `rgba(0,0,0,.04)` / `.16` |

La hairline va en alpha y no en sólido para que **componga sobre
`--canvas`** en vez de asumir blanco puro.

> `--text-secondary` no coincide con ninguna referencia: benji usa
> `rgba(0,0,0,.4)`, emil `rgb(99,99,94)`, josh `rgb(163,163,163)`. El
> nuestro es `rgb(138,138,138)` y no es de nadie. Se dejó porque los
> colores eran una decisión ya tomada, no una abierta.

---

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
| `--index-offset-left` / `-top` | **80** / **80** | MEDIDO |
| `--index-item-gap` | **8** | MEDIDO — los dos referentes coinciden |
| `--index-group-gap` | **24** | ELEGIDO |

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

## Motion — HEREDADO

| token | valor | uso |
|---|---|---|
| `--ease-out` | `cubic-bezier(.23,1,.32,1)` | entradas |
| `--dur-fill` | `150ms` | hover de color y de anillo |
| `--dur-enter` | `220ms` | entrada de vista |
| `--dur-lead` / `--dur-trail` | `260ms` / `440ms` | **sin uso** |

Reduced-motion contemplado: se saca el movimiento, se conservan color y
opacidad.

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
