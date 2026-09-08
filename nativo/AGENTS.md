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
pnpm telefono                 # Metro para Expo Go, con QR — ver "en tu iPhone"
pnpm nueva "Swipe to pay"     # crea src/app/swipe-to-pay/index.tsx
pnpm grabar swipe-to-pay      # graba al vault y cierra el circuito
pnpm mockup swipe-to-pay --verificar   # primero: ¿el hueco del bisel queda lleno en toda la cámara?
pnpm mockup swipe-to-pay               # la grabación en un iPhone negro, fondo neutro, cámara: para X
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
└── <slug>/index.tsx     UNA pieza = UNA carpeta = UNA ruta — un puntero
src/piezas/<slug>/
├── index.tsx            exporta la pantalla, y nada más
├── pantalla.tsx         la pieza montada: datos, paleta, composición y
│                        el bloque "No tocar sin volver a medir" al pie
├── <mecanismo>.tsx      lo que se mueve, en archivos por responsabilidad
├── medidas.ts           cada valor con su recibo, y las paletas
├── tema.ts              el contexto de la paleta
└── <datos>.ts, media/   contenido del mock, si lo hay
```

**El slug es el mismo string en los tres lados**: la carpeta acá, el
nombre del archivo de la grabación, y la URL de la pieza publicada. Por
eso `pnpm nueva` usa la misma cuenta que `slug()` en `src/pieces.ts` del
repo web. Si divergieran, la pieza publicada no apuntaría a su taller.

**La ruta es un puntero y la pieza vive en `src/piezas/<slug>/`.** No
es gusto: Expo Router convierte en ruta **todo** `.tsx` que cuelgue de
`src/app/` (su doc: *"Non-navigation components live outside the src/app
directory"*), así que un `barra.tsx` al lado de la ruta sería
`/swipeable-tabs/barra`. La carpeta tiene la forma de un componente de
[react-native-motion](https://github.com/SchroederNathan/react-native-motion/tree/main/apps/expo/components/animations)
—una pantalla que se monta sola, un `index.tsx` que la exporta, el
mecanismo, el tema y los datos al lado— menos su registry a mano: acá
el índice sigue saliendo de las carpetas de `src/app/`.

**Verificado de punta a punta** el 2026-08-27: `pnpm nueva` creó una
pieza, el dev build la dibujó con **Skia** en el simulador, `pnpm grabar`
escribió el clip en el vault, y `scripts/cuadros.mjs` del repo web lo
parseó (tasa fija, 40 unidades por cuadro) — o sea que el reproductor
puede ir cuadro a cuadro sobre lo que sale de acá.

**Con dos piezas o más hay índice, y para medir eso estorba.** Las
sondas de una pieza y `pnpm grabar` necesitan que la app arranque en la
pieza; `simctl openurl` con el esquema del dev client pide confirmación
en iOS 26. `src/piezas/abrir.ts` es la perilla: el slug ahí y el índice
redirige. Queda `undefined` en el repo (el otro worktree tiene su pieza).

**Sin header, y se graba así.** Una pieza ocupa la pantalla entera: todo
lo que no sea la pieza terminaría adentro del video. Para volver al
índice, **swipe desde el borde izquierdo** — el gesto nativo del stack,
que no dibuja nada. Si tu pieza necesita ese borde, apagalo en su propia
pantalla con `<Stack.Screen options={{ gestureEnabled: false }} />`.

### Al pie de la pieza va lo que es de la pieza

Cuando termines, cerrá `pantalla.tsx` con un bloque de invariantes: los
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

Treinta cosas que no son obvias y cuestan una tarde cada una. Las
ocho primeras salieron de leer `SchroederNathan/react-native-motion` el
2026-08-28 — allá están escritas como reglas de una pieza puntual, pero
ninguna lo es. La novena salió de medirla acá, en swipeable-tabs, y la
décima la escribieron las dos piezas por separado, cada una con su
recibo; las demás las dejaron hold-to-commit, Android y la medición de
rendimiento.

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

**Consistencia entre shared values**

9. **Si dos valores tienen que ser ciertos AL MISMO TIEMPO, son un valor,
   no dos.** Reanimated ordena sus mappers topológicamente, pero arma las
   aristas con las **salidas declaradas** — y `useAnimatedReaction` llama
   a `startMapper(fun, inputs)` sin ninguna (SOURCE: reanimated 4.5.1,
   `src/hook/useAnimatedReaction.ts:68`, contra `useDerivedValue.ts:71`
   que sí la pasa). O sea que **nada garantiza que una reacción corra
   antes de quien lee lo que escribe**, y su propio `mappers.ts` lo
   advierte: *"the updated value can be read by mappers that run later in
   the same frame but previous mappers would access the old value"*.

   Cómo se ve cuando muerde: un par de valores que se cruzan queda
   inconsistente por un cuadro y la propiedad que dependa de los dos
   pega un salto. En swipeable-tabs eran `desde`/`hasta` (de una
   reacción) más `avance` (derivado): cada cruce de página dejaba a los
   estilos con los extremos nuevos y el avance viejo —saturado en 1— y
   **cada ícono prendía del todo un cuadro antes de hacer su fundido**.
   Medido: los seis tabs de un barrido hacían `0.000 → 1.000 → 0.008`.

   El arreglo no es reordenar nada: es un solo `useDerivedValue` que
   devuelve el objeto entero. Ahí no queda orden que equivocar, y como es
   un derived value declara su salida y el sort lo pone antes de todos
   sus lectores.

   **Y el instrumento importa tanto como la regla.** Esto es invisible
   para una grabación mirada de a un cuadro: se ve anotando, desde
   adentro del propio mapper del estilo, el valor que se pinta cada
   cuadro. Ojo también con `simctl recordVideo`, que escribe a **tasa
   variable**: pasarlo por `fps=60` antes de mirarlo cuadro a cuadro
   inventa cuadros y fabrica glitches que no existen.

**Símbolos**

10. **El `size` de `SymbolView` no es el tamaño del glifo.** Las dos
    piezas chocaron con esto por su cuenta, así que va con los dos
    recibos. SOURCE: `expo-symbols/ios/SymbolView.swift:127` arma la
    configuración con `pointSize: UIFont.systemFontSize` (14) SIEMPRE, y
    el `contentMode` escala la imagen a la CAJA de la vista; con
    `resizeMode: 'center'` todos los símbolos salen a 14 pt, sea cual
    sea `size`. O sea que el número que le pasás no es el que usarías en
    una fuente y no hay forma de acertarle de memoria.

    Dos maneras de dimensionarlo bien, y las dos son medir. En
    hold-to-commit: caja = la caja natural del símbolo al tamaño que
    querés (`NSImage(systemSymbolName:).size` en un script Swift la
    imprime), `scaleAspectFit` (el default) y `scale: 'large'` para que
    el escalado sea hacia abajo. En swipeable-tabs: medir la TINTA
    contra la referencia — `size: 17` pinta 13.0 pt de tinta, que es
    exactamente lo que mide el `+` del original (`BORDE.simboloMas` en
    su `medidas.ts`). Nunca por el tamaño del label que tiene al lado.

    Y `SymbolView` es una **vista nativa**: iOS la reconfigura cuando le
    cambian las props, así que reservale su caja con un ancho fijo y
    animá la caja, no el símbolo (`css.ranuraChevron` y `estiloSimbolo`
    en el `barra.tsx` de swipeable-tabs). Un símbolo que aparece y
    desaparece cambiando el layout de la fila es el camino corto al
    titileo.

### Lo que dejó hold-to-commit (2026-09-02)

11. **La grabación de `simctl` no sirve para medir puntos chicos ni
    tiempos.** Comprime los detalles de 1–4 pt hasta volverlos polvo gris,
    y pone pts a 60 fps a cuadros que captura a ~33: el tiempo sale
    comprimido ~1.8×. Para medir, captura sin pérdida con una sonda de
    estado fijo (`sonda.ts` de la pieza), y la grabación sólo para ver
    el orden de las cosas.

12. **`CI=1` apaga el watch mode de Metro.** `CI=1 pnpm ios` arranca, pero
    "reloads are disabled": ningún cambio llega a la app. Sin la variable.

13. **Dos worktrees, dos simuladores.** El dev client está clavado a
    `localhost:8081` (trampa 8 de la memoria del proyecto). Si el otro
    worktree tiene el simulador, no se le saca: se crea otro iPhone del
    mismo tipo y se le instala el mismo `Taller.app`:
    ```bash
    APP=$(xcrun simctl get_app_container <udid-del-otro> com.anonymous.nativo)
    UDID=$(xcrun simctl create "Pro Max B" com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max com.apple.CoreSimulator.SimRuntime.iOS-26-2)
    xcrun simctl boot $UDID && xcrun simctl install $UDID "$APP"
    ```
    Y al terminar, `shutdown` + `delete`: `pnpm grabar` habla con
    `booted` y con dos prendidos elige uno cualquiera.

14. **Un worklet no captura un namespace de módulo.** Dos SIGABRT en
    `worklets::toOptimizedObject` mientras un worklet llamaba
    `scheduleOnRN(haptica.tic)` con `import * as haptica`. Se pasó a
    imports con nombre y las funciones se declaran ANTES del worklet que
    las usa. SIN RECIBO exacto (no se reprodujo aislado); queda como
    sospecha fundada.

15. **Una sonda que parquea dos valores con un parámetro miente.** Con
    `cruce=q` (Hold a 1−q, Keep a q) las capturas mostraban los dos
    labels superpuestos en estados que la animación nunca produce: el
    saliente se va en 48 ms y el entrante tarda 360. La sonda va en
    MILISEGUNDOS y pone cada shared value donde lo tendría la animación
    a ese instante, con las mismas curvas y retardos, para compararla con
    el cuadro del clip del mismo instante.

16. **La captura espera a que la pantalla se asiente.** Un `sleep 4`
    después de escribir `sonda.ts` sacaba la primera foto vieja tras una
    recarga. `sondas.sh` compara el hash del tercio de abajo de la
    pantalla (el reloj de la barra cambia solo) hasta que dos capturas
    seguidas coincidan y difieran de la sonda anterior. Y si Metro tiró
    un error a mitad de una edición (un `medidas.ts` a medio escribir),
    Fast Refresh puede quedar sirviendo módulos viejos sin avisar:
    `simctl terminate` + `launch` y a comprobar en el bundle
    (`curl localhost:8081/...entry.bundle | grep valor`).

17. **Los montajes se miran a resolución completa.** Dieciséis filas de
    texto a 3× se muestran achicadas a la mitad y un blur de σ 1 pt
    desaparece: se corrigió un "entrante demasiado borroso" que no
    existía. Ocho filas por imagen, a 2×, y recién ahí se compara.

18. **El simulador B se apaga solo.** Tres veces en una sesión apareció
    `(Shutdown)` entre dos capturas (probablemente al cerrarse su
    ventana). Antes de capturar, `simctl list devices | grep <udid>`, y
    si hace falta `boot` + `launch` + 10 s.

19. **Reanimated apaga las animaciones con Reduce Motion, y el progreso
    también.** `withTiming`, `withDelay` y `withSequence` traen
    `reduceMotion: System` por defecto: con Reduce Motion prendido en
    iOS saltan al valor final en el primer cuadro (SOURCE:
    `react-native-reanimated/src/animation/util.ts:506`), y las
    modificadoras se lo contagian a sus hijas. Un `withTiming` que ES
    el gesto (el relleno de 2 s del hold) o que cuenta un estado con
    opacidad lleva `reduceMotion: ReduceMotion.Never`, y reduce motion
    se aplica a mano: queda opacidad y color, se va escala y traslación
    (animate-expo § 9). RUNTIME: el pill pasaba de 64 a 182 de
    luminancia en un cuadro y se quedaba ahí los 2 s. Para probarlo en
    el simulador: `xcrun simctl spawn <udid> defaults write
    com.apple.Accessibility ReduceMotionEnabled -bool true` y relanzar
    la app (`useReducedMotion` lee el valor al arrancar). Dynamic Type:
    `xcrun simctl ui <udid> content_size
    accessibility-extra-extra-extra-large`, y `large` para volver.

20. **Una sonda deja la pieza parqueada hasta que algo la desparquee.**
    `sonda.ts` vuelto a `undefined` no hacía nada, así que la pieza se
    quedaba en el último estado: un `commit` dejaba `terminado` en true
    y un `auto` posterior no apretaba (la ráfaga de capturas dio 221.5
    plano y parecía que la receta `skill` no andaba). Ahora la sonda
    `undefined` devuelve al reposo. Igual, una tanda de `auto` se hace
    después de relanzar.

21. **Un cambio de Dynamic Type en vivo no re-mide el `Text`.** Con la
    app abierta, pasar a AX5 agrandó los glifos pero la caja del label
    quedó la de 17 pt: texto recortado. El label se remonta con
    `key={factor}` cuando cambia `useWindowDimensions().fontScale`.

### Lo que dejó Android y la medición de rendimiento (2026-09-07)

22. **`PlatformColor` con nombres de UIKit es TRANSPARENTE en Android,
    sin error.** `PlatformColor('systemFillColor')` es un `resource_paths`
    en Android, que sólo resuelve `@android:color/…` y `?attr/…`; si
    nada resuelve, `FabricUIManager.getColor` devuelve 0 (SOURCE:
    react-native 0.86, `FabricUIManager.java:573`). El fondo `accion`
    salía sin fondo y sin barras. Los colores de sistema se escriben con
    sus valores (los de la tabla de UIKit) y `useColorScheme` los cambia.

23. **`SymbolView` con un nombre string no dibuja NADA en Android.**
    SOURCE: `expo-symbols/src/SymbolView.tsx:32` — sin `props.name.android`
    devuelve `props.fallback`. Con el nombre como objeto (`{ ios:
    'checkmark', android: 'check' }`) dibuja el glifo de Material Symbols
    con la fuente de `@expo-google-fonts/material-symbols`, y el peso
    para Android es un objeto `{ name, font }` que hay que armar (los
    de `expo-symbols/src/android/weights` no se exportan). En Android
    `size` sí es el tamaño (es un `Text` con `fontSize`), al revés que
    en iOS (trampa 10).

24. **El blur de `filter` existe en Android desde la API 31, y en iOS
    no.** SOURCE: `BaseViewManager.java:558` (`RenderEffect`, sólo con
    `SDK_INT >= S`). Las copias borrosas del label son PNG de SF Pro en
    iOS y el mismo `Text` con `filter: [{ blur: σ }]` en Android: una
    mancha de SF sobre un nítido de Roboto se ve doble.

25. **Un worklet que llama a una `const` declarada más abajo la captura
    como `undefined`.** El callback del `withTiming` del reinicio llamaba
    a `reiniciar`, definida después de `completar`: "undefined is not a
    function" recién a los 5 s, en producción y en dev. Las funciones que
    un worklet llama van ANTES del worklet (ya lo decía la 14 para el
    caso de los namespaces).

26. **`modify` de un shared value desde JS manda el modificador a UI como
    worklet.** Un closure creado en JS no lo es: "[Worklets] Tried to
    synchronously call a Remote Function" en la cola de animaciones, y
    de paso rompía lo que venía después en esa cola. Si un dato se
    escribe desde los dos hilos, un depósito por hilo: un `makeMutable`
    que sólo toca UI (y JS lee al final con `.get()`, que es sincrónico)
    y un objeto de JS para lo de JS.

27. **En el emulador de Android el bundle de DESARROLLO pierde cuadros
    que el de producción no.** RUNTIME (Pixel 9 / Android 16, Expo Go
    57.0.9, `medidor.tsx`): en dev, 47 cuadros perdidos de 372 en la
    secuencia sin ninguna carga (17 de 44 durante el hold); en
    producción (`expo start --no-dev --minify`), 0–2. Antes de optimizar
    una animación por lo que muestra un emulador en dev, medirla en
    producción. Y con `--no-dev` el `console.log` de la app NO llega a
    Metro: el medidor manda el informe por POST a `RECEPTOR`
    (`sonda.ts`).

28. **Android compone los hijos de una vista con opacidad uno por uno.**
    Durante el fundido del reinicio, el solape de 1 px entre las dos
    texturas del relleno se veía como una línea clara. La vista que se
    funde lleva `needsOffscreenAlphaCompositing` (Android; iOS lo hace
    solo con `allowsGroupOpacity`).

29. **Una función que un worklet llama lleva `'worklet'` aunque sólo
    construya un objeto.** `tiempo()` y `spring()` (`receta.ts`) armaban
    el `Movimiento` que `mover()` consume; llamadas desde `apretar` o
    `completar`, "[Worklets] Tried to synchronously call a Remote
    Function. Called 'tiempo' on the UI Runtime". El typecheck no lo ve
    y en el hilo de JS anda: se ve en el log de Metro, no en pantalla.

30. **La tinta medida no es la opacidad si la cosa además escala.** Para
    comparar si dos elementos entran juntos se mide la TINTA —Σ (255 −
    luminancia) sobre el fondo claro, que el blur conserva porque sólo
    la desparrama—, pero un elemento que crece aporta tinta proporcional
    a su ÁREA: el factor es escala², no escala. El tilde contextual de
    hold-to-commit, con la misma opacidad que el texto, mide 34 % contra
    74 % a q = .30 sólo por estar al 63 % de su tamaño (0.63² = 0.40).
    Antes de leer un retraso en la diferencia, dividir por escala². Y la
    banda que se integra tiene que sobrar 3σ del blur más ancho por cada
    lado: con menos, la tinta desparramada cae afuera y todos los
    estados intermedios miden de menos. `tilde.py` de la pieza hace las
    dos cosas.

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

**Hoy sí, con Expo Go de la App Store**, y sin build: el 2026-09-02 la
tienda publicó Expo Go 57.0.9 y el taller es SDK 57. Antes de mandar a
nadie a firmar nada, medir qué versión hay, porque la tienda atrasa
(estuvo en SDK 54 desde septiembre de 2025 hasta ese día):

```bash
curl -s "https://itunes.apple.com/lookup?id=982107779" | grep -o '"version":"[^"]*"'
```

### Cuando la tienda atrasa: sign.expo.dev

Pasó desde septiembre de 2025 hasta el 2026-09-02, y puede volver a
pasar. **El Expo Go de la App Store era la versión 54.0.2, publicada el
2025-09-23** — verificado el 2026-08-27 en la ficha de la App Store y en
cuatro tiendas — con este taller en **SDK 57** y el manifiesto que sirve
Metro pidiendo `runtimeVersion: exposdk:57.0.0`. Expo Go en iOS
implementa **un solo SDK a la vez**, así que el de SDK 54 no abre un
proyecto de SDK 57, y actualizar no era cuestión de apretar un botón.

Lo que pasó: **Apple no aprobó Expo Go de SDK 55 en adelante** durante
meses, y la tienda quedó clavada en 54. Está contado por Expo en
`expo.dev/changelog/expo-go-and-app-store-may-2026`. El teléfono decía
*"necesitás una versión más nueva"* y tenía razón — pero el botón de
actualizar no existía, porque no había nada más nuevo publicado ahí.

**La salida es <https://sign.expo.dev>**, que es de Expo: firma el Expo
Go de la versión que le pidas con **tu Apple ID gratis** y lo instala en
el teléfono. La doc de Expo lo dice con todas las letras, en
`troubleshooting/expo-go-version-mismatch`:

> "This installer uses your Apple ID's free developer provisioning, so it
> does not require a paid Apple Developer Program membership. The
> certificate is valid for about seven days."

El binario existe y es público: la API de Expo
(`api.expo.dev/v2/versions/latest`) da para SDK 57 el cliente **57.0.9**,
en `github.com/expo/expo-go-releases`.

**El procedimiento, una vez:**

1. En <https://sign.expo.dev>: elegís SDK **57**, entrás con tu cuenta de
   Expo, elegís el dispositivo y ponés tu Apple ID. (Expo dice que esas
   credenciales las usa como proxy de sesión y no las guarda.)
2. En el iPhone: **Ajustes › Privacidad y seguridad › Modo de
   desarrollador**, encender y reiniciar. Sin eso, iOS no corre una app
   firmada para desarrollo.
3. Acá: `pnpm telefono` —que es `expo start --go`— y escaneás el QR. La
   misma red Wi-Fi que la Mac. Si la red no coopera (Wi-Fi de invitados,
   VPN), `pnpm telefono --tunnel`.

**A los 7 días vence** —cuando iOS dice «"Expo Go" ya no está
disponible», es eso— y hay que volver al paso 1. No hay que rehacer
nada del proyecto: se re-firma la app y listo.

**Y ojo con lo que Expo Go no trae.** Es el runtime de Expo, no el dev
client de este taller: si una pieza usa `@shopify/react-native-skia` no
va a andar ahí, y va a fallar en el teléfono aunque ande en el
simulador. Todo lo demás —reanimated, gesture-handler, expo-symbols,
expo-haptics— sí está.

**Las alternativas sin vencimiento cuestan plata.** `eas go` compila tu
propio Expo Go y lo sube a TU TestFlight, y EAS Build hace lo mismo con
la app: los dos necesitan el **Apple Developer Program pago**, porque la
distribución ad hoc de iOS exige un perfil que liste el UDID de cada
teléfono. Está en `build/internal-distribution` de la doc de Expo. Y un
detalle que muerde: un teléfono recién registrado con `eas device:create`
tarda **24 a 72 horas** en procesarse del lado de Apple.

Con cualquiera de los dos Expo Go: la misma Wi-Fi que la Mac,
`pnpm telefono` (`expo start --go`) con `EXPO_TOKEN` de la MISMA cuenta que el Expo Go del teléfono —un Expo
Go logueado no abre proyectos anónimos— y escanear el QR. Antes de
arrancar, `REACT_NATIVE_PACKAGER_HOSTNAME=<ip de en0>`: si la Mac tiene
VPN o cambió de IP (cuatro veces en una semana), el manifest apunta mal.
El nombre Bonjour de la Mac no sirvió desde el iPhone; la IP sí. Un
`EXPO_TOKEN` inválido no falla al arrancar: el manifest devuelve 500
(`The bearer token is invalid`); comprobarlo antes con `curl -H
"Authorization: Bearer $T" https://api.expo.dev/v2/auth/userInfo`. El
`--tunnel` (`@expo/ngrok` está en el proyecto) sirve en una red normal,
pero NO en la de la facultad: intercepta TLS y el agente ngrok lo
rechaza (`x509: certificate signed by unknown authority`); esa red no
aísla clientes, así que el LAN por IP alcanza. Vale lo mismo que en el
simulador: todo menos Skia.

Vale la pena aunque el simulador ande: **el simulador no tiene háptica
ni pantalla de 120Hz**, que son justo dos de las cosas que este vault
estudia. Un gesto que se siente bien en el simulador puede sentirse mal
en la mano.

**Grabar desde el teléfono es distinto** de grabar del simulador (ver
"Grabar la pieza", más abajo). `pnpm grabar` usa `simctl`, que
sólo habla con simuladores: contra un iPhone real no sirve. Ahí se graba
con la grabación de pantalla de iOS (Centro de Control) y el archivo se
pasa a `VAULT_DIR/native/` a mano — AirDrop, o cable con QuickTime. El
resto del recorrido no cambia: la grilla lo levanta igual.

Queda dicho para cuando moleste: si grabar desde el teléfono se vuelve
frecuente, el paso a automatizar es ese traslado, no la grabación.

## Probar en Android

**Lo que hay en esta Mac desde el 2026-09-07** (instalado con Homebrew,
sin Android Studio): `openjdk@21` (keg-only: `JAVA_HOME=$(brew --prefix
openjdk@21)/libexec/openjdk.jdk/Contents/Home`), el cask
`android-commandlinetools`, y con `sdkmanager --sdk_root=$HOME/Library/
Android/sdk` los paquetes `platform-tools`, `emulator`,
`platforms;android-36` y `system-images;android-36;google_apis;arm64-v8a`.
Un AVD `taller` (Pixel 9). Nada de esto viaja con el repo.

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
$ANDROID_HOME/emulator/emulator -avd taller -no-snapshot-load -no-boot-anim -gpu auto &
adb() { $ANDROID_HOME/platform-tools/adb "$@"; }
adb shell getprop sys.boot_completed        # 1 cuando arrancó (~35 s)
```

**Expo Go, no el dev client**: el dev client es iOS. La versión de Expo
Go para el SDK sale de la API de versiones, con la URL del APK:

```bash
curl -s https://exp.host/--/api/v2/versions/latest | python3 -c \
  "import sys,json; s=json.load(sys.stdin)['data']['sdkVersions']['57.0.0']; print(s['androidClientVersion'], s['androidClientUrl'])"
adb install -r Expo-Go-57.0.9.apk
adb shell am start -a android.intent.action.VIEW -d "exp://<ip de en0>:8083"
```

El server es el mismo `pnpm telefono` del iPhone (con `EXPO_TOKEN` y
`REACT_NATIVE_PACKAGER_HOSTNAME`); el emulador llega a la Mac por la IP
de la LAN. Un Expo Go sin sesión abre el proyecto igual: la CLI sólo
firma el manifest cuando la app lo pide. La primera vez aparece la hoja
del dev menu encima de la pieza: se cierra con su ✕ (y ojo con tocar a
ciegas: un tap que cae en el menú apaga Fast Refresh).

```bash
adb shell input swipe 540 2271 540 2271 1400   # un hold de 1.4 s en el botón
adb exec-out screencap -p > captura.png
adb shell cmd uimode night yes                 # modo oscuro (no: claro)
adb shell am force-stop host.exp.exponent      # relanzar limpio
```

Vale lo de siempre: todo menos Skia. Y lo que dice la trampa 27: los
cuadros se miden con `--no-dev --minify`, no con el bundle de dev.

## Grabar la pieza, y el mockup para X

Lo que se aprendió grabando la primera pieza (2026-09-03), en orden de
lo que muerde:

**`simctl` graba a tasa variable.** Mientras algo se mueve escribe 60
cuadros por segundo (deltas de 17 ms, medido); con la pantalla quieta no
escribe ninguno. El `<video>` lo reproduce bien, pero **normalizá con
`fps=60` ANTES de recortar**: un `-ss` sobre el archivo crudo cae en el
primer cuadro escrito después del punto de corte y el reposo inicial
desaparece entero. Orden correcto: `fps=60,trim=start=…,setpts=PTS-STARTPTS`,
y `tpad` para sostener el último cuadro, que tampoco se grabó.

**La tuerca azul es Expo Go**, el botón flotante de su menú de
desarrollo; en el teléfono no aparece y el dev client no lo tiene. En el
simulador se apaga con la preferencia de Expo Go, sin matar nada:

```bash
xcrun simctl spawn booted defaults write host.exp.Exponent EXDevMenuShowFloatingActionButton -bool false
```

y relanzar Expo Go. Queda apagada para ese simulador.

**La sonda de grabación (`?demo=1`), para copiar.** Es lo que grabó
el video de swipeable-tabs y no viaja con la pieza; queda acá para la
próxima. Tres reglas que salieron de tres tomas fallidas:

1. **Nacer en el tab inicial de verdad:** `contentOffset={{ x: width, y: 0 }}`
   en el pager y `scrollX` naciendo en `width`. Un `scrollTo` en el
   primer efecto no llega al pager y deja la barra en un tab con el
   contenido de otro.
2. **Los arrastres van por el puente que ya existe** (`destino`, cuya
   reacción hace `scrollTo` por cuadro y cuyo `onScroll` alimenta
   `scrollX`), con `movimiento` en `arrastre` y `destino` de vuelta a
   `NADIE` al terminar. Una reacción propia sobre otro shared value
   saltaba en vez de arrastrar.
3. **Los toques son `alTocar`.** Y la barra tiene que tomar "hay un
   toque" de `movimiento === toque`, no de `destino !== NADIE`, o lee
   el tramo del toque durante un arrastre sintético.

```tsx
const arrastre = (a: number, b: number, lento: boolean) =>
  scheduleOnUI((a: number, b: number, ancho: number, lento: boolean) => {
    'worklet'
    movimiento.set(MOVIMIENTO.arrastre)
    destino.set(a * ancho)
    const fin = (t?: boolean) => { 'worklet'; if (t) { destino.set(NADIE); movimiento.set(MOVIMIENTO.quieto) } }
    destino.set(lento
      ? withTiming(b * ancho, { duration: 1700, easing: Easing.inOut(Easing.sin) }, fin)
      : withSequence(
          withTiming((a + (b - a) * 0.15) * ancho, { duration: 110, easing: Easing.in(Easing.quad) }),
          withTiming(b * ancho, { duration: 430, easing: Easing.out(Easing.cubic) }, fin)))
  }, a, b, width, lento)
// espera 1500 · arrastre(1, 2, true) · espera 2600 · alTocar(0) · espera 1000
// · flicks 0→5 cada 1000 · dos de vuelta cada 1000
```

La toma: `status_bar override --time 9:41 … --batteryState discharging
--batteryLevel 100`, `terminate host.exp.Exponent`, `recordVideo --codec
h264`, `openurl exp://127.0.0.1:8082/--/<slug>?demo=1`, 25–30 s; medir
los gestos con la diferencia entre cuadros a 60 fps y cortar 1.2 s antes
del primero. El máster va a `.context/mockup/master/`.

**El agente puede grabar solo.** No hay forma de mandarle un dedo al
simulador, pero la pieza se maneja desde adentro con una sonda temporal:
los toques son `alTocar(i)`, el camino real; los arrastres se sintetizan
moviendo el offset del pager cuadro a cuadro con
`withSequence(withTiming(15 % del viaje, 110 ms, easeInQuad), withTiming(destino, 430 ms, easeOutCubic))`
—un dedo que acelera y suelta, ajustado a ojo contra los arrastres
medidos de X— con `movimiento` puesto a mano en `arrastre`/`quieto`. La
sonda se borra antes de cerrar, como todas.

**El máster de una pieza no tiene por qué estar en el vault.** El vault
es lo ajeno; `swipeable-tabs` se sacó de ahí a pedido y su máster vive
en `.context/mockup/master/<slug>.mp4` (gitignoreado). Al mockup se le
pasa con `--clip=…`. Y el video que va a la library entra con
`pnpm pieza:video <slug> <archivo>` desde la raíz, no con Add to Library
(ver el AGENTS.md de la raíz, camino B).

**El video se arma en `mockup/` (Remotion), no acá.** Los mismos
números —bisel medido, fondo, sombra, cámara y curvas— viven en
`mockup/src/parametros.ts` como controles de Remotion Studio: se
iteran en vivo y se renderiza una vez (2160² · 60 fps en un par de
minutos). El script de ffmpeg de abajo queda como referencia de cómo se
midió cada número y como camino sin Chrome; pedirle iteraciones a él es
re-encodear por cada ajuste. Ver `mockup/AGENTS.md`.

**`pnpm mockup <slug>`** mete la grabación del vault en el bisel
oficial de Apple, sobre un fondo neutro, con una cámara que entra y
sale, a 2160² y 60 fps. **La referencia es el clip de @nater02**
(x.com/nater02/status/2092952884987957708) y está medida cuadro a
cuadro: fondo RGB (235, 230, 232) plano; teléfono negro al 95.3 % del
alto, centrado; sombra sólo a la derecha y abajo, dos capas (una
apretada y una ancha) ajustadas contra el perfil de luma; la cámara
entra a 1.576× en 0.65 s, se queda, y sale a 1.161× en 0.62 s, con las
dos curvas ajustadas a una bézier cúbica (rms 0.005). El teléfono es el
**iPhone 17 en Black** —el de la referencia por proporción y color; el
Pro Max no viene en negro— y la grabación del Pro Max entra en su hueco
escalada (misma proporción al 0.1 %). Los recibos, uno por número,
están arriba de `scripts/mockup.mjs`.

Perillas: `--espera` (segundos con el teléfono entero antes de entrar),
`--hasta` (cuándo salir: el final del primer gesto), `--foco` (dónde
apunta la entrada, como fracción del alto del cuerpo; 0.145 es la fila
de tabs de esta pieza), `--camara=quieta`, `--modelo`, `--color`,
`--fondo`, `--lado`. Con una imagen (`pnpm mockup <slug> <imagen>`) el
lienzo sale de la imagen —el múltiplo entero más grande que entra, con
vecino más cercano, píxel por píxel— y la cámara va quieta salvo que se
pida (`--blur`, `--luz`, `--lienzo` siguen ahí).

**Antes de mirar el resultado, `pnpm mockup <slug> --verificar`.** Mete
un rojo pleno en vez de la grabación, renderiza la cámara entera sin
pérdida y comprueba píxel por píxel que el hueco del bisel está lleno
en doce estados de la cámara. Existe porque la primera versión de la
cámara apoyaba la pantalla 15×20 px corrida y en la esquina de arriba
a la izquierda asomaba el fondo; en el cuadro entero no se veía, en el
zoom del usuario sí ("mirá los bordes, no se fillean", 2026-09-04).
Cada capa se posiciona por su cuenta y se redondea a píxel por cuadro:
un origen mal tomado no falla, se ve. Los PNG del bisel viven en
`.context/mockup/`, gitignoreados: la licencia de Apple permite usarlos
para mockups de interfaces de sus plataformas y no redistribuirlos. Se
bajan de <https://developer.apple.com/design/resources/>
(Bezel-iPhone-17.dmg).

**Lo que este pipeline no da, y qué lo daría.** Los gestos son
sintéticos (la sonda mueve el pager con curvas medidas), no un dedo. Si
se quiere el feel de un dedo real, la grabación se hace en el teléfono
con Expo Go y una herramienta que grabe por USB con marco: Screen
Studio lo hace pero sin auto-zoom en iOS (no ve los toques); Matte
graba simulador o iPhone con marco y zoom. Lo demás —fondo, cámara,
sombra— ya está acá, medido, y es gratis.

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

## Un worktree por vez contra el simulador

Pero **de a uno**: dos worktrees no pueden usar el simulador al mismo
tiempo, y la forma en que falla es traicionera.

El dev client se compila con `expo run:ios`, y ese build **no incluye
`expo-dev-client`** — no está en `package.json`, y está verificado:
adentro de `Taller.app` no hay `EXDevLauncher` ni nada del launcher. Sin
launcher no hay pantalla para elegir servidor, así que la app pide el
bundle **siempre a `localhost:8081`**, el puerto que `expo run:ios` le
horneó.

Entonces el segundo `pnpm ios` encuentra el 8081 ocupado, ofrece el 8082
—y en modo no interactivo ni eso: corta— y si lo levantás igual, la app
sigue leyendo del primero. Nadie avisa, porque del lado tuyo compila
todo bien. **El síntoma es el peor posible: el índice del taller aparece
sin tu pieza**, como si `require.context` no la hubiera encontrado.

Se descarta en diez segundos:

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN     # ¿de quién es el puerto?
```

Si ese pid no es tu Metro, es el de otro worktree, y la única salida es
cortarlo y levantar el tuyo en 8081. No hay atajo — se probaron los dos
que parecían obvios y ninguno anda: `simctl openurl` con el esquema del
dev client (la app no entiende ese URL, no tiene launcher) y forzar
`RCT_jsLocation` en el plist de la app (Expo lo pisa con el puerto del
build en cada arranque).

Si esto empieza a molestar seguido, lo que hay que agregar es
`expo-dev-client`. Es una dependencia nativa: obliga a `pnpm ios:build`
de nuevo, y por eso es una decisión y no un arreglo al pasar.
