# El mockup — el video de una pieza App para X, en Remotion

Una composición de [Remotion](https://www.remotion.dev) que mete la
grabación de una pieza en el bisel oficial de Apple sobre un fondo
neutro, con una cámara que entra a la acción y sale, a 2160² y 60 fps.
Es la versión en React del pipeline de ffmpeg de `nativo/scripts/
mockup.mjs`, que queda como referencia de los números; acá se itera
**en Remotion Studio, en vivo**, y se renderiza una vez cerrado el look.

```bash
cd mockup && pnpm install
pnpm assets            # bisel + grabación normalizada a 60 fps → public/ (gitignoreado)
pnpm verificar         # ¿el hueco del bisel queda lleno en toda la cámara? (rojo pleno, 12 cuadros)
pnpm studio            # el look, con cada número como control
pnpm render:ambos      # out/swipeable-tabs.mp4 (claro) y out/swipeable-tabs-oscuro.mp4: cada video sale dos veces, para X
pnpm render:library    # out/library.webm + out/library.mov: UN video transparente y sin sombra para la library (el fondo lo pone la card)
pnpm still Sombras out/sombras.png   # la grilla: el reposo con dieciséis sombras, cada una con su recibo
pnpm still SombrasSimetricas out/sombras-simetricas.png   # dieciséis más, sin luz de costado
pnpm still Fondos out/fondos.png   # dieciséis fondos: planos, degradados, foco, malla, grano, trama, piso, imagen, la app desenfocada
```

`pnpm assets --clip=/ruta/otra.mp4` para otra grabación. El máster de
swipeable-tabs vive en `.context/mockup/master/` (no en el vault: el
vault es lo ajeno).

## El proceso, de punta a punta

Es la línea que se siguió con `swipeable-tabs` (2026-09-04) y la que se
repite con cada pieza App. Cada paso tiene su recibo en el archivo que
se nombra.

| # | paso | dónde |
| --- | --- | --- |
| 1 | **La pieza corre en el simulador** (Pro Max, Expo Go por Metro 8082), sin la tuerca de Expo Go (`EXDevMenuShowFloatingActionButton` en false) | `nativo/AGENTS.md` |
| 2 | **La coreografía es una sonda** en la pieza, `?demo=1`: gestos sintéticos por los caminos reales (`alTocar` para toques, el pager por `destino` con `movimiento` en arrastre para arrastres y flicks). Nace en el tab inicial con `contentOffset`. Se borra antes de cerrar | `nativo/AGENTS.md` › La sonda de grabación |
| 3 | **Se graba con simctl**, barra de estado en 9:41 y batería en `discharging` (sin rayo), Expo Go terminado y relanzado con el deep link, 25–30 s de toma | `nativo/AGENTS.md` |
| 4 | **Se mide la toma** (diferencia entre cuadros a 60 fps): montaje, primer gesto, último gesto. Se corta 1.2 s antes del primer gesto —nada de Expo Go queda, verificado en los primeros 60 cuadros—, se normaliza a 60 fps y se clona 1.5 s de cola | `.context/recon/<pieza>/MEDICIONES.md` |
| 5 | **El máster va a `.context/mockup/master/<slug>.mp4`**, no al vault: el vault es lo ajeno | raíz `AGENTS.md` |
| 6 | **`pnpm assets`** copia el bisel y normaliza el clip a `public/` | `scripts/assets.mjs` |
| 7 | **`pnpm verificar`** antes de mirar: el hueco del bisel lleno en doce estados de la cámara | `scripts/verificar.mjs` |
| 8 | **La cámara se ajusta a la toma**: `hasta` = fin del gesto lento medido; entrada y salida son las de la referencia | `src/parametros.ts` |
| 9 | **Se mira en Studio**, se toca lo que haga falta, y **se renderiza dos veces**: `pnpm render:ambos` → claro y oscuro | abajo |
| 10 | **La library lleva UN solo render, transparente y sin sombra**, como los videos de Family en benji.org: `pnpm render:library` saca `out/library.webm` (VP9 con alfa, Chrome y Firefox) y `out/library.mov` (HEVC con alfa por VideoToolbox, Safari), 1280², teléfono al 86 %, cámara terminando a 1×. El fondo lo pone la card en el tema que sea. Entra por `pnpm pieza:video <slug> mockup/out/library --alfa` desde la raíz. El de X es el par con fondo | raíz `AGENTS.md`, camino B |

## Las mini-decisiones, y por qué

- **Bisel: iPhone 17 Black.** La referencia es un teléfono negro de proporción 2.05; el 17 mide 2.066 y el Pro Max 2.095, y en negro sólo hay 17. La grabación del Pro Max entra escalada (misma proporción al 0.1 %), 4 px más grande que el hueco por lado, máscara de radio 186 menor que el hueco.
- **Tamaño: 75 % del alto.** La referencia mide 95.3 %; el brief pidió más aire. Es una perilla (`altura`).
- **Fondo: plano, #EBE6E8**, medido en la referencia. En X el fondo es plano (todo el vault menos solarn, que usa una foto desenfocada); Rotato aconseja no animar sobre fotos. Dieciséis alternativas en `fondos.ts` (`pnpm still Fondos`).
- **Sombra: la de la referencia, medida**, contacto α .60 σ 8 (12,12) más ambiente α .20 σ 30 (70,70). Se probó más marcada (brief), sin sombra (Apple: su PSD tiene cuatro capas y ningún efecto, sus renders miden 250 a 4 px del borde, y sus guidelines prohíben agregarla a sus imágenes), y treinta y dos variantes más (`pnpm still Sombras`, `SombrasSimetricas`). El usuario eligió la medida.
- **Cámara: tres momentos**, entra a 1.576× en 0.65 s apuntando a la fila de tabs, se queda hasta que termina el gesto lento, sale a 1.161× en 0.62 s. Bézier medidas: entrada (0.30, 0.05, 0.40, 0.90), salida (0.25, 0.25, 0.20, 0.90). Se interpola (zoom, posición del cuerpo): con (zoom, mira) el borde del teléfono dudaba siete píxeles.
- **Cada capa a su tamaño en cada cuadro**, sin `transform: scale`; PNG entre el cuadro y el encoder; 2160² a 60 fps, h264 crf 17.
- **La grabación: nace en el tab inicial de verdad** (`contentOffset`), arrastre lento de 1.65 s con seno in-out, toques por `alTocar`, flicks con el perfil de dedo medido en X (15 % en 110 ms, el resto en 430) cada 1.0 s, y al llegar al último tab dos de vuelta.
- **Un bug de la pieza que la sonda destapó:** la barra tomaba "hay un toque" de `destino !== NADIE`; la condición es `movimiento === toque`. Está commiteado en la pieza.
- **Dos fondos por video:** claro (#EBE6E8) y oscuro (#1C181A, el neutro bajado al 11 % con el mismo tinte; sin referencia medida en el vault). La sombra no cambia.
- **En la library, ningún fondo y ninguna sombra:** el video va transparente sobre la superficie de la card, como Family en benji.org. Se probó hornear el color de la card por tema (claro exacto, oscuro a un nivel de azul) y se rechazó: "que haya solo un fondo, el del lugar que da la library". El alfa viaja en dos archivos, WebM VP9 y HEVC .mov, porque ningún códec lo lleva a todos los navegadores.

## Dónde está cada cosa

| archivo | qué es |
| --- | --- |
| `src/parametros.ts` | **todos los números, uno por línea y con recibo**: fondo, altura del teléfono, sombra, cámara, curvas. Son las props de la composición y en Studio aparecen como controles |
| `src/geometria.ts` | el bisel medido, la cámara (k, X, Y) y los rectángulos de cada capa. Puro, sin React: lo usan la composición y la verificación |
| `src/Mockup.tsx` | las cuatro capas: fondo, sombra, pantalla, bisel. Cada una al tamaño que le toca en cada cuadro, sin `transform: scale` |
| `src/sombras.ts` · `src/Grilla.tsx` | dieciséis sombras con recibo (las medidas en el vault y en @nater02, y los sistemas de diseño) y la grilla que las muestra lado a lado. La elegida pasa a `PARAMETROS.sombra` |
| `src/Root.tsx` | la composición: 2160² · 60 fps, duración leída del clip |
| `scripts/assets.mjs` | copia el bisel y normaliza la grabación a 60 fps constantes |
| `scripts/verificar.mjs` | la guarda de los bordes |
| `remotion.config.ts` | PNG entre el cuadro y el encoder, crf 17, yuv420p |

## Las tres cosas que no se negocian

1. **Nada se afirma sin medir.** La referencia es el clip de @nater02
   (x.com/nater02/status/2092952884987957708), medido cuadro a cuadro:
   fondo, tamaño y posición del teléfono, sombra, zoom y curvas. La
   planilla está en `.context/recon/swipeable-tabs/MEDICIONES.md` y
   cada número lleva su recibo en `parametros.ts`. Donde el brief se
   aparta de la referencia a propósito (más aire, sombra más marcada),
   está dicho al lado del número.
2. **Cada capa se dibuja a su tamaño en cada cuadro.** Sin zoom al
   cuadro compuesto: Chrome muestrea el PNG del bisel y el video a la
   resolución final. Y se interpola (zoom, posición del cuerpo), no
   (zoom, punto de mira): con la mira, el borde del teléfono dudaba
   siete píxeles antes de moverse (medido, ver MEDICIONES).
3. **`pnpm verificar` antes de mirar.** Mete un rojo pleno en vez de la
   grabación y comprueba, con la misma geometría que dibuja, que el
   hueco del bisel está lleno en doce estados de la cámara. Existe
   porque un origen mal tomado no falla: se ve, y sólo en un zoom.

## Lo que no viaja

`public/` (el bisel de Apple —la licencia permite usarlo para mockups
de sus plataformas, no redistribuirlo— y la grabación) y `out/` (los
renders). Los PNG del bisel se bajan de
<https://developer.apple.com/design/resources/> (Bezel-iPhone-17.dmg)
a `.context/mockup/`, y `pnpm assets` los copia.
