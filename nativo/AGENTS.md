# El taller nativo

**Leé primero el [`AGENTS.md` de la raíz](../AGENTS.md)** — el recorrido
completo (vault → playground → library), la regla de evidencia y el
método de trabajo están ahí. Esto es sólo el taller donde se construyen
las piezas **App**.

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

## Los tres comandos

```bash
pnpm install                  # una vez por worktree
pnpm ios                      # levanta Metro y abre el simulador
pnpm nueva "Swipe to pay"     # crea src/app/swipe-to-pay/index.tsx
pnpm grabar swipe-to-pay      # graba al vault y cierra el circuito
```

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

**Sin header, y se graba así.** Una pieza ocupa la pantalla entera: todo
lo que no sea la pieza terminaría adentro del video. Para volver al
índice, **swipe desde el borde izquierdo** — el gesto nativo del stack,
que no dibuja nada. Si tu pieza necesita ese borde, apagalo en su propia
pantalla con `<Stack.Screen options={{ gestureEnabled: false }} />`.

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
