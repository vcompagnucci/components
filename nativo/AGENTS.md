# El taller nativo

**Leé primero el [`AGENTS.md` de la raíz](../AGENTS.md)** — el recorrido
completo (vault → playground → library), la regla de evidencia y el
método de trabajo están ahí. Esto es sólo el taller donde se construyen
las piezas **App**.

> **El procedimiento numerado es el
> [Camino B](../AGENTS.md#camino-b-una-pieza-app-expo-react-native)**,
> en el AGENTS de la raíz: del `pnpm nueva` hasta la pieza publicada.
> Este archivo explica cómo funciona el taller por dentro y qué hacer
> cuando algo falla.

> **Expo cambió.** Antes de escribir código, leé la doc de la versión
> exacta: <https://docs.expo.dev/versions/v57.0.0/>

## Qué es esto

Una app de Expo que vive adentro del repo pero con su propio toolchain.
Es el equivalente nativo del lienzo del playground: acá se itera una
pieza contra el simulador, y cuando está lista se **graba** — y esa
grabación es lo que entra al vault y se publica.

**Una sola app-taller, una carpeta por pieza.** No un repo por pieza:
está medido contra lo que hacen los referentes (Mangano sostiene 127
animaciones en una app; Candillon una carpeta por episodio; Gitter un
archivo por interfaz), y el repo propio es el premio de la pieza que se
volvió librería, nunca el punto de partida. La recon está en
`.context/recon/TALLER-NATIVO.md` de la raíz — gitignoreada, así que sus
conclusiones viven acá y en el AGENTS de arriba.

## Los comandos

```bash
pnpm install                  # una vez por worktree
pnpm ios:build                # UNA vez por máquina: compila el dev client
pnpm ios                      # el día a día: Metro + la app en el simulador
pnpm nueva "Swipe to pay"     # crea src/app/swipe-to-pay/index.tsx
pnpm grabar swipe-to-pay      # graba al vault y cierra el circuito
```

`pnpm ios:build` compila el **dev client** —la app `Taller` que queda
instalada en el simulador— y sólo hace falta repetirlo cuando entra una
dependencia NATIVA nueva. El resto del tiempo alcanza `pnpm ios`, que
levanta Metro y abre la app ya instalada. Todo lo que sea TypeScript
recarga en caliente.

**No es Expo Go.** Expo Go sirve para arrancar, pero no trae
`@shopify/react-native-skia` —es un módulo nativo de terceros— y Skia es
justamente una de las razones de este taller.

### El parche de `expo-modules-jsi`, y por qué existe

`pnpm ios:build` falla de fábrica con **Xcode 26.2**: `expo-modules-jsi`
57.0.5 anota dos constructores de `RuntimeScheduler` con
`SWIFT_RETURNS_RETAINED`, pero la clase recién se declara
`SWIFT_SHARED_REFERENCE` en su llave de cierre. Clang lee el header en
orden, así que en el constructor el tipo todavía no es shared reference
y rechaza la anotación. El issue
[expo/expo#49426](https://github.com/expo/expo/issues/49426) lo cerró un
mantenedor de Expo el 2026-08-27 con *"Upgrade Xcode to 26.4 or newer
which is required for SDK 57"*.

**No hizo falta actualizar Xcode.** Las dos anotaciones **entraron en
57.0.5**: 57.0.0 a 57.0.4 no las tienen, y el diff de ese header entre
57.0.4 y 57.0.5 son exactamente esas dos líneas y nada más (verificado
leyendo los dos archivos de unpkg, sin instalarlos). Así que
`patches/expo-modules-jsi@57.0.5.patch` las saca, y el header queda
**idéntico byte a byte al de 57.0.4** — una versión que Expo publicó y
que compila. No es un parche inventado: es volver a lo último que
funcionaba.

Bajar el paquete a 57.0.4 no era opción: `expo-modules-core` pide
`~57.0.5`.

**Cuándo sacarlo:** cuando esta máquina tenga Xcode 26.4+. Ahí se borra
el patch, se saca `patchedDependencies` de `pnpm-workspace.yaml`, y a
reconstruir. El parche viaja con el repo, así que cualquier worktree
compila igual mientras tanto.

### El otro paso que no es obvio

Skia necesita bajar sus binarios **antes** de que corra `pod install`:

```bash
npx install-skia
```

Con pnpm el postinstall no lo hace solo. Si `pnpm ios:build` se queja de
*"Skia prebuilt binaries not found"*, es esto.

`pnpm nueva` es el `New sketch` de este lado: crea la carpeta y nada
más. **El índice se deriva de las carpetas** (`require.context` en
`src/app/index.tsx`), así que no hay ninguna lista que mantener — la
misma decisión que hace que el vault no pueda mentir.

`pnpm grabar` hace las tres cosas del cierre: clava la barra de estado
en 9:41 con batería y señal llenas, graba con `--codec h264` (el default
de `simctl` es **HEVC**, y un HEVC puede no reproducirse en el `<video>`
de la exposición — es la trampa más cara del camino porque no falla al
grabar, falla en la pieza ya publicada), y escribe **directo a
`VAULT_DIR/native/`**. Parás la grabación y el clip ya está en la grilla
de `/vault`: de ahí, Open in Playground → Add to Library.

## La forma de una pieza

```
src/app/
├── _layout.tsx          el Stack, sin header en ninguna pantalla
├── index.tsx            el índice, derivado de las carpetas
└── <slug>/index.tsx     UNA pieza = UNA carpeta = UNA ruta
```

**El slug es el mismo string en los tres lados**: la carpeta acá, el
nombre del archivo de la grabación, y la URL de la pieza publicada. Por
eso `pnpm nueva` usa la misma cuenta que `slug()` en `src/pieces.ts` del
repo web. Si divergieran, la pieza publicada no apuntaría a su taller.

**Verificado de punta a punta** el 2026-08-27: `pnpm nueva` creó una
pieza, el dev build la dibujó con **Skia** en el simulador, `pnpm grabar`
escribió el clip en el vault, y `scripts/cuadros.mjs` del repo web lo
parseó (tasa fija, 40 unidades por cuadro) — o sea que el reproductor
puede ir cuadro a cuadro sobre lo que sale de acá.

**Sin header, y se graba así.** Una pieza ocupa la pantalla entera: todo
lo que no sea la pieza terminaría adentro del video. Para volver al
índice, **swipe desde el borde izquierdo** — el gesto nativo del stack,
que no dibuja nada. Si tu pieza necesita ese borde, apagalo en su propia
pantalla con `<Stack.Screen options={{ gestureEnabled: false }} />`.

### Al pie de la pieza va lo que es de la pieza

Cuando termines, cerrá el archivo con un bloque de invariantes: los
valores que alguien tendría que volver a medir antes de tocarlos, y por
qué. Uno por línea, con su grado de evidencia.

```
/*
 * No tocar sin volver a medir
 *
 * — El long press dura 500 ms, y el pan arranca con
 *   activateAfterLongPress(500). Es el mismo número a propósito: si se
 *   separan, el menú abre pero el dedo no llega a arrastrar.
 *   SOURCE: los dos gestos leen LONG_PRESS_MS.
 *
 * — El overlay entra en 210 ms y sale en 170 ms, ease-in-out.
 *   RUNTIME: medido cuadro a cuadro sobre la grabación de referencia.
 *
 * — El release se sigue con un contador que incrementa, no con un
 *   booleano.  SIN RECIBO: falta anotar qué se rompe con el booleano.
 */
```

Esa última línea es la más importante del bloque. **Un valor sin recibo
por lo menos avisa que le falta**; una razón inventada que suena bien no
avisa nada.

Y ojo con qué entra acá: sólo lo de esta pieza. Lo que valga para
cualquier otra va en la sección de abajo, una sola vez.

## Lo que vale para toda pieza

Estas reglas no son de ninguna pieza en particular — son cómo se usa el
stack acá. Van escritas **una sola vez, en este archivo**.

No es manía de orden. En `SchroederNathan/react-native-motion` la misma
regla está copiada a mano en cuatro briefs, y en el cuarto quedó vieja:
el del radial menu manda usar `runOnJS`, pero su propio código usa
`scheduleOnRN` trece veces y `runOnJS` ninguna. Se copió a cuatro
lugares y se actualizaron tres.

### Llamar a JS desde un worklet: `scheduleOnRN`

```ts
import { scheduleOnRN } from 'react-native-worklets'
```

`runOnJS` **está deprecada**. SOURCE: `react-native-worklets@0.10.1`,
`lib/typescript/threads.native.d.ts:103` — *"@deprecated Use
`scheduleOnRN` instead."* Sigue funcionando y sigue exportada desde
`react-native-reanimated`, así que nada se rompe; simplemente no se
escribe más.

**No es un reemplazo textual** — cambia la forma de llamarla:

| | |
| --- | --- |
| vieja | `runOnJS(fn)(a, b)` — devuelve una función, y esa se llama |
| nueva | `scheduleOnRN(fn, a, b)` — los argumentos van directo |

### Shared values: `.get()` / `.set()`

`.value` **no** está deprecada: los tres conviven en `SharedValue` y
ninguno está marcado (SOURCE: `react-native-reanimated@4.5.1`,
`lib/typescript/commonTypes.d.ts:129-136`). Elegimos `.get()`/`.set()`
para que el taller sea uno solo, no porque el otro esté mal. Si algún
día la doc de Reanimated dice otra cosa, esto se cambia en un lugar.

## Lo que ya sabemos que muerde

Ocho cosas que no son obvias y cuestan una tarde cada una. Salieron de
leer `SchroederNathan/react-native-motion` el 2026-08-28 — allá están
escritas como reglas de una pieza puntual, pero ninguna lo es.

Vienen de un repo donde las constantes se sacan cuadro a cuadro de la
referencia y cada decisión tiene su comentario arriba. **Tratalas como
reglas, no como sugerencias**: si una te parece mal, medí antes de
cambiarla.

**Gestos y animación**

1. **Cancelá lo que está corriendo antes de arrancar otra animación**
   sobre el mismo shared value. Dos springs encimados sobre el mismo
   valor pelean. Se nota sobre todo en press y en efectos que siguen al
   dedo, donde los disparos se pisan.

2. **Al soltar un pan, proyectá la velocidad antes de redondear.** Si
   decidís a qué ítem cae un carrusel sólo por la posición, un flick
   corto y rápido se queda donde estaba y se siente pegajoso. Se redondea
   `posición + velocidad × factor`, no la posición sola.

3. **Dos gestos que tienen que coincidir salen de una sola constante.**
   Un long-press de 500 ms con un pan que activa a 500 ms tiene que leer
   la misma variable: si se separan, alguien toca uno y el gesto abre
   pero no arrastra.

**Render**

4. **Props primitivas si querés que `memo` corte de verdad.** Un objeto o
   una función nueva en cada render hace que la comparación dé distinto
   siempre y `memo` no ahorre nada. Misma regla que del lado web, pero
   acá se paga en cuadros.

**Skia**

5. **El layout de texto sale de los avances de glifo, no de los bounds.**
   Los bounds miden la tinta dibujada, así que una `o` y una `l` dan
   anchos distintos y el texto baila. El avance es cuánto corre el
   cursor: es lo que usa la tipografía para maquetar.

6. **Poné el `origin` si querés que un glifo escale desde su centro.**
   Por defecto escala desde la baseline y la letra se va para abajo.

**Composición de vistas**

7. **El `BlurView` va afuera del `MaskedView`, no adentro.** Sale de su
   carrusel, que tiene un fondo desenfocado atrás de una máscara — o sea
   de haberlo armado al derecho y al revés. El brief no dice qué se
   rompe; lo que sí sabemos es de dónde muestrea un blur (punto 8), y
   adentro de la máscara lo que encuentra no es la pantalla.

8. **Un `BlurView` sólo ve lo que hay en su propia ventana.** En Android,
   una hoja hospedada sobre el teclado vive en otra ventana: el blur no
   encuentra nada detrás y sale el tinte solo. Si tu pieza depende del
   desenfoque, en Android hay que caer a un color plano — y ese color
   también se mide, no se elige.

## El vidrio

`expo-glass-effect` ya está instalado (57.0.1) y tiene trampas que no se
ven venir — la principal es que **un `GlassView` bajo una opacidad
animada no dibuja nada**. Está todo en [`VIDRIO.md`](VIDRIO.md).

## El stack, y por qué NO son las últimas versiones

| | instalado | último en npm |
| --- | --- | --- |
| react-native-reanimated | 4.5.1 | 4.6.0 |
| react-native-gesture-handler | 2.32.0 | 3.2.1 |
| @shopify/react-native-skia | 2.6.2 | 2.11.1 |
| expo-haptics | 57.0.1 | 57.0.2 |

**Las tres primeras las elige `expo install`, y es lo correcto acá.** En
React Native una dependencia trae código nativo que se compila contra el
runtime del SDK: instalar la última de npm contra SDK 57 es instalar una
combinación que nadie probó, y rompe el build nativo — no el typecheck,
el build. La regla del repo (*siempre la última estable*) se cumple
igual, en el único lugar donde acá significa algo: **el SDK es el
último**, 57. Dentro de un SDK, "la última" es la que él verificó.

`expo-haptics` es otro caso: 57.0.2 salió el 2026-08-26 y el cooldown de
24h del sistema lo bloqueó a propósito. Se instaló 57.0.1. Cuando pase
la ventana, `npx expo install --fix` lo sube.

Las versiones van **exactas**, sin `~`, como en el repo web.

## Probar en tu iPhone de verdad

**Hoy sí, con Expo Go**, y sin build: instalás Expo Go de la App Store,
la misma red Wi-Fi que la Mac, `pnpm start` y escaneás el QR. Si la red
no coopera (Wi-Fi de invitados, VPN), `pnpm start --tunnel`. Vale lo
mismo que en el simulador: todo menos Skia.

Y vale la pena hacerlo aunque el simulador ande: **el simulador no tiene
háptica ni pantalla de 120Hz**, que son justo dos de las cosas que este
vault estudia. Un gesto que se siente bien en el simulador puede sentirse
mal en la mano.

**Con dev build propio en el teléfono** hay que firmar la app: con una
cuenta gratis de Apple alcanza, pero el perfil vence a los 7 días y hay
que reinstalar. La salida limpia es EAS Build, que compila en la nube —
disponible y todavía no probado acá.

**Grabar desde el teléfono es distinto.** `pnpm grabar` usa `simctl`, que
sólo habla con simuladores: contra un iPhone real no sirve. Ahí se graba
con la grabación de pantalla de iOS (Centro de Control) y el archivo se
pasa a `VAULT_DIR/native/` a mano — AirDrop, o cable con QuickTime. El
resto del recorrido no cambia: la grilla lo levanta igual.

Queda dicho para cuando moleste: si grabar desde el teléfono se vuelve
frecuente, el paso a automatizar es ese traslado, no la grabación.

## El agente al lado del simulador

Los MCP que le dan ojos —`expo-mcp` para screenshots y automation del
simulador, XcodeBuildMCP para el lado Xcode— están relevados en la recon
y **todavía no están conectados acá**. Mientras tanto el agente escribe
los archivos y vos mirás el simulador, que es el modo que ya funciona:
Metro recarga en caliente y la pieza se actualiza sin perder el estado.

## Lo que no viaja

`node_modules/`, `.expo/`, `/ios` y `/android` están gitignoreados. Lo
que viaja es **el código de las piezas**, que es el punto de tenerlo
adentro del repo: un worktree nuevo hace `pnpm install` y tiene todo el
taller.

**El dev client se construye una vez por máquina, no por worktree.** Las
dependencias nativas viven en la app instalada en el simulador, así que
mientras una pieza sea sólo TypeScript —el caso normal— cualquier
worktree la alimenta con su propio Metro. Recién si entra una
dependencia nativa nueva hay que reconstruir.
