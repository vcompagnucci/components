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
pnpm render            # out/swipeable-tabs.mp4, 2160² · 60 fps · h264 crf 17
pnpm still Sombras out/sombras.png   # la grilla: el reposo con dieciséis sombras, cada una con su recibo
pnpm still SombrasSimetricas out/sombras-simetricas.png   # dieciséis más, sin luz de costado
pnpm still Fondos out/fondos.png   # dieciséis fondos: planos, degradados, foco, malla, grano, trama, piso, imagen, la app desenfocada
```

`pnpm assets --clip=/ruta/otra.mp4` para otra grabación. El máster de
swipeable-tabs vive en `.context/mockup/master/` (no en el vault: el
vault es lo ajeno).

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
