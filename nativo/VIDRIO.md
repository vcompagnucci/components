# El vidrio

Cómo se usa `expo-glass-effect` sin chocarse. Es una referencia, no un
procedimiento: el orden de trabajo está en el
[`AGENTS.md` de la raíz](../AGENTS.md#el-proceso-paso-a-paso).

**De dónde salió.** Leído el 2026-08-28 de la implementación de
`chatgpt-attachments` en
[SchroederNathan/react-native-motion](https://github.com/SchroederNathan/react-native-motion),
y contrastado contra los tipos del paquete que tenemos instalado. Su repo
no tiene licencia, así que acá no hay código suyo: hay lo que aprendí
leyéndolo, escrito de nuevo.

Es una implementación seria — el ChatGPT attachments son 2913 líneas con
cada color sacado de mirar la referencia cuadro a cuadro y el porqué
escrito arriba. Lo que sigue son sus conclusiones, no mis hipótesis.

---

## La trampa central: no se puede animar por opacidad

Poné un `GlassView` abajo de una opacidad animada y **no dibuja nada, ni
siquiera en `1`**. No se ve tenue: desaparece.

Tiene su propia transición nativa justamente para esto. El patrón es
montar la superficie a opacidad fija y **cambiarle el estilo** —`regular`
⇄ `none`— con su `animationDuration`, en vez de fundirla.

Un detalle que hay que saber de antemano: **el primer render tiene que
arrancar en `none`** aunque quieras `regular`, para que la transición
tenga de dónde salir. Si montás directo en `regular`, no hay transición,
hay un salto.

Cuando lo que necesitás fundir es algo *encima* del vidrio, eso sí se
funde normal: una vista común apoyada arriba, cargando el radio del
vidrio.

## No lo recortes

Nada de `overflow: 'hidden'` sobre un `GlassView` **ni sobre ninguno de
sus ancestros**. La vista nativa se redondea sola con su `borderRadius`,
y recortarla es exactamente lo que mata el bulto que hace el material
bajo un dedo. Lo que va encima lleva su propio radio.

Corolario: el `borderCurve: 'continuous'` va en la vista de vidrio, no en
un contenedor que la recorte.

**Y al revés con la caída:** un `BlurView` sí hay que recortarlo. Es un
desenfoque, no un material nativo — no se redondea solo. Las dos ramas
del mismo componente llevan reglas opuestas, y ésa es la que se olvida.

## `isInteractive`: control sí, contenedor no

| | |
| --- | --- |
| **Control** — un botón, una píldora | prendido: el material reacciona al dedo como todo control de iOS 26 |
| **Contenedor** — un panel con cosas adentro | apagado, o el panel se abulta cuando el dedo iba a algo de adentro |

Con una consecuencia que conviene tener presente: un panel interactivo
**queda en el camino del toque**, así que un tap en su propio padding
deja de caer al backdrop de atrás. Si tu panel se cierra al tocar afuera,
eso es lo que querés y no un efecto lateral.

## La escalera de caída

`isLiquidGlassAvailable()` dice si el material está disponible. Abajo de
iOS 26 hay que poner otra cosa.

La caída es un `BlurView` de `expo-blur` con un tinte medido encima para
llegar al mismo color; y en Android —donde el blur no ve nada, ver el
punto 8 de [`AGENTS.md`](AGENTS.md#lo-que-ya-sabemos-que-muerde)— un
color plano.

**`expo-blur` 57.0.2 está instalado** desde el 2026-08-28, y el dev
client se reconstruyó para incorporarlo. Es la única dependencia del
taller que entró sin que una pieza la pidiera: sin ella la escalera no
tiene último escalón, y descubrirlo el día que haga falta cuesta un
`pnpm ios:build` en el peor momento.

## Dos banderas más

**1. `isLiquidGlassAvailable()` no mira la accesibilidad.** Devuelve
`true` igual si el usuario tiene *Reducir transparencia* prendido. SOURCE:
la doc del propio paquete, `build/isLiquidGlassAvailable.d.ts` —

> *"The value may also be `true` if the user has enabled accessibility
> settings that limit the Liquid Glass effect."*

y manda a chequear `AccessibilityInfo.isReduceTransparencyEnabled()`
aparte. Si una pieza depende del vidrio para que algo se lea, esto no es
opcional.

**2. `isGlassEffectAPIAvailable()`** también está exportada (SOURCE:
`expo-glass-effect@57.0.1`, `build/index.d.ts:6`). Vale mirarla antes de
asumir que una sola bandera alcanza.

## El color no se elige, se mide

Lo más copiable de todo esto no es el código, es el método: cada color
del material salió de mirar la referencia cuadro a cuadro. Su panel
medido sobre negro da `rgb(30,30,30)`; el blur solo llega a 19, así que
el tinte de encima existe **para cerrar los 11 que faltan**. No es un
`rgba` que quedó lindo — es una resta.

Es la primera de nuestras cuatro reglas, encontrada en otro repo sin
habernos puesto de acuerdo. Buena señal para las dos partes.

## Cómo lo usa el botón de hold-to-commit (2026-09-04)

La variante `vidrio` (`piezas/hold-to-commit/material.ts`) es el mismo
botón con la cápsula en `GlassView` estilo `regular`. Tres decisiones que
salen de las trampas de arriba:

- **El vidrio es el contenedor, y el hijo se recorta a sí mismo.** Las
  texturas del relleno se recortan a la cápsula con `overflow: 'hidden'`,
  y eso no puede envolver al vidrio. Entonces el `GlassView` es el padre,
  `absoluteFill`, con su `borderRadius` circular (como el pill medido;
  sin `continuous`) e `isInteractive`, y ADENTRO va la vista que recorta,
  con fondo transparente. Un `overflow: hidden` en un hijo no toca al
  vidrio. Primero se probó al revés —vidrio hermano detrás del recorte—
  y funcionaba, pero el dedo caía en las texturas y no en el material,
  que no reaccionaba.
- **Interactivo, y sin la escala del press.** Un control de vidrio
  responde al dedo con su propio abultado; sumarle la escala medida de
  Opal era feedback doble. Con `vidrio`, `escalaPropia` es false.
- **Contenido que pase por debajo.** Sobre un fondo plano el vidrio es
  indistinguible de una cápsula pintada: el fondo scrollea debajo del
  botón, que flota.
- **Nada suyo se funde por opacidad.** El único ancestro animado es la
  escala del press, que es un transform. Lo que sí se funde —el relleno,
  el velo blanco, los labels— está encima, en vistas comunes.
- **El módulo se pide con un `require` dentro de un `try`.** Un `import`
  estático ejecuta `requireNativeViewManager` al cargar y, si el binario
  no lo linkea, tira abajo la pieza entera. Sin módulo o sin iOS 26 la
  opción cae a una cápsula translúcida plana.

Y una que no está arriba: **nada de Opal encima del vidrio**. El brillo
de reposo tiñe el material (la textura tiene alfa, 0..153, media 42) y
en la primera versión se dejó; pero un vidrio bien lanzado no lleva
adornos: ni brillo, ni anillo (trae su borde), ni la punta velada (es del
color del pill opaco). Sólo el relleno blanco del hold, que es el gesto.
En modo claro el label de reposo arranca negro (`useColorScheme`), como
el label de todo control de vidrio.
