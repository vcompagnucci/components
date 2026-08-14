# Exposición

Playground/exposición de componentes estilo design-engineer: piezas web,
web-mobile y nativas, cada una perteneciente a UNA plataforma, mostradas
en una página única. Sin código a la vista, sin instalación — es una
exposición, no una librería instalable.

```bash
pnpm install
pnpm dev        # http://localhost:3002
pnpm build
pnpm typecheck
```

## Decisiones tomadas (y de dónde salen)

| Decisión | Valor | Fuente |
| --- | --- | --- |
| Formato | Exposición de una página; cada pieza tiene **URL propia** (`/button`). **Sin router**: son dos vistas, `history.pushState` alcanza. El atrás del navegador vuelve a la lista **y al scroll donde estabas**; entrar directo por link también funciona | la decisión original era "estado, sin rutas", tomada cuando el detalle era un rectángulo vacío. Al confirmarse que lleva notas, no poder linkearlas pasó a ser una pérdida real |
| ↳ condición de deploy | El host tiene que servir `index.html` para rutas desconocidas (fallback SPA). Vite ya lo hace en dev y en preview | es lo único que impone tener rutas de verdad en vez de hash |
| Display | Segmented: una pieza por fila, título arriba, preview grande | ídem |
| Nav | **Índice fijo a la izquierda** con todas las piezas agrupadas. Sin tabs. Fixed a 80/80, links 13px/460 al 40%, 8px de separación, ancho ajustado al label más largo. **Sin scrollspy** (benji lo tiene; acá se eligió no ponerlo) | recorridas 13 páginas de las dos referencias: **ninguna usa tabs**, las dos navegan con índice fijo. Medido en `.context/recon/NAVIGATION.md` |
| Separador de sección | Rótulo 14px/600/#111 + hairline hasta el borde del riel; hueco de 8px, 64px arriba, 56px abajo | el separador de benji en /liveline y /drawesome, medido en vivo — su `<hr>` está vacío, lo que pinta es el div que React le envuelve |
| Para qué existe el detalle | Para **las notas y el aire**: el porqué, las decisiones y los números, más la pieza sola en pantalla y más grande. La lista muestra, el detalle explica. No es sólo una pieza agrandada | con preview vivo en la lista, el detalle no aporta la pieza (ya la tenías): aporta lo que la rodea |
| Espaciado de la lista | Aire superior **80** · masthead→sección **60** · rótulo→pieza **40** · título→preview **12** · entre piezas **48** · entre secciones **64**. Todos múltiplos de 4 | elegidos con un scrubber sobre la página real, con reglas midiendo en vivo. Los 40 son los de benji en /liveline, medidos en 13 de sus 15 secciones; los 64 y 48 también son suyos. Detalle en `.context/recon/NAVIGATION.md` |
| ↳ el número es el hueco visible | `--gap-label` es de la línea al primer texto, no el `margin-bottom`. La línea va centrada en la caja del rótulo, así que el CSS descuenta esa media caja calculándola desde `--fs` y `--lh` | el margen decía 32 cuando el hueco real era 41.5: dos números para la misma distancia. El que manda es el que se ve |
| ↳ agrupación | rótulo→pieza (40) tiene que ser menor que entre piezas (48), o el rótulo se despega de su grupo y lee como flotando entre los dos | venía de 56, que era mayor: la agrupación estaba invertida |
| Nav bajo 1200px | **Ninguna.** El índice se esconde y no se reemplaza: en esos anchos se scrollea | medido a 390px: ninguna de las dos referencias da navegación dentro de la página en mobile. Benji esconde los links de sección y deja sólo el "← Index" hacia su home; Josh esconde el índice entero. Los dos aceptan el scroll |
| Categorías | **Web** y **App**, las dos siempre visibles (no hay filtro). El corte es navegador vs app instalada, que es la línea que de verdad cuesta cruzar. Bajo App conviven SwiftUI y Expo/React Native (los dos renderizan vistas nativas reales) | el runtime es la propiedad honesta: "iOS" subdeclaraba las piezas de Expo, que también corren en Android |
| ↳ App, no Mobile | **App** corta en el mismo eje que Web (¿dónde corre?); **Mobile** contesta otra pregunta (¿en qué pantalla?), y mezclar dos ejes es lo que ya rompió `Web / Web Mobile / Native`. Decisivo: un sheet web pensado para teléfono es *web y mobile* a la vez — con Mobile el corte se rompe y hay que inventar una regla; con App esa pieza es Web y listo. Mobile se entiende medio segundo más rápido, pero al lado de "Web" el contraste desambigua sola | la colisión no es hipotética: Vaul (Emil Kowalski, referencia del proyecto) es exactamente un drawer mobile-first que corre en el navegador |
| Demos nativos | **Se decide por pieza, no por categoría.** Expo puede ir vivo vía react-native-web, salvo que dependa de hardware: `expo-haptics` mapea a la Web Vibration API, que **Safari no soporta** (MDN browser-compat-data), así que un Haptic Button en web no haría nada. SwiftUI siempre video | docs.expo.dev + MDN |
| Tipografía | Familia Benji: un solo tamaño (14px), jerarquía por peso 460/500/600, tracking en rem −0.004 (−0.006 en títulos), lh 1.43 | CSS servido de benji.org — cita en `.context/recon/TYPE-SYSTEMS.md` |
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

## Pendiente (marcado como tal en `src/tokens.css`)

- **La escala `--space-*` no cubre lo que la página usa.** Va 4·8·12·16·20·
  24·32·40·48·64, pero 56, 60 y 80 están en uso y no están en ella; hoy
  viven como tokens semánticos (`--gap-masthead`, `--index-top`). Falta
  decidir si la escala crece arriba o si esos valores se quedan como
  semánticos. También sobran `--space-2`, `--space-6` y `--space-10`, que
  rompen la regla de múltiplos de 4 — los dos primeros sin uso
- Radios, elevación, z-index — se definen desde la primera pieza construida
- Primera pieza a construir dentro del stage
- Footer / firma: el nombre "Vito Compagnucci" todavía no está en ninguna parte
