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
| Formato | Exposición de página única; detalle por pieza como estado, sin rutas | prototipos en `.context/prototypes/` |
| Display | Segmented: una pieza por fila, título arriba, preview grande | ídem |
| Nav | **Índice fijo a la izquierda** con todas las piezas agrupadas. Sin tabs. Fixed a 80/80, links 13px/460 al 40%, 8px de separación, ancho ajustado al label más largo. **Sin scrollspy** (benji lo tiene; acá se eligió no ponerlo) | recorridas 13 páginas de las dos referencias: **ninguna usa tabs**, las dos navegan con índice fijo. Medido en `.context/recon/NAVIGATION.md` |
| Separador de sección | Rótulo 14px/600/#111 + hairline hasta el borde del riel; hueco de 8px, 64px arriba, 56px abajo | el separador de benji en /liveline y /drawesome, medido en vivo — su `<hr>` está vacío, lo que pinta es el div que React le envuelve |
| Categorías | **Web** y **App**, las dos siempre visibles (no hay filtro). El corte es navegador vs app instalada, que es la línea que de verdad cuesta cruzar. Bajo App conviven SwiftUI y Expo/React Native (los dos renderizan vistas nativas reales) | el runtime es la propiedad honesta: "iOS" subdeclaraba las piezas de Expo, que también corren en Android |
| ↳ App, no Mobile | **App** corta en el mismo eje que Web (¿dónde corre?); **Mobile** contesta otra pregunta (¿en qué pantalla?), y mezclar dos ejes es lo que ya rompió `Web / Web Mobile / Native`. Decisivo: un sheet web pensado para teléfono es *web y mobile* a la vez — con Mobile el corte se rompe y hay que inventar una regla; con App esa pieza es Web y listo. Mobile se entiende medio segundo más rápido, pero al lado de "Web" el contraste desambigua sola | la colisión no es hipotética: Vaul (Emil Kowalski, referencia del proyecto) es exactamente un drawer mobile-first que corre en el navegador |
| Demos nativos | **Se decide por pieza, no por categoría.** Expo puede ir vivo vía react-native-web, salvo que dependa de hardware: `expo-haptics` mapea a la Web Vibration API, que **Safari no soporta** (MDN browser-compat-data), así que un Haptic Button en web no haría nada. SwiftUI siempre video | docs.expo.dev + MDN |
| Tipografía | Familia Benji: un solo tamaño (14px), jerarquía por peso 460/500/600, tracking en rem −0.004 (−0.006 en títulos), lh 1.43 | CSS servido de benji.org — cita en `.context/recon/TYPE-SYSTEMS.md` |
| Aire superior | 80px (32 bajo 640px) | CSS de benji.org (`padding: 5rem`; su escalón está en 768 — 640 acá es herencia del DESIGN.md, divergencia consciente) |
| Masthead | "Library" (600) + una línea gris debajo. El subtítulo no cambia de tamaño: sólo peso y color | benji (`h1` 500 ink / `time` 460 al 40%) y josh (nombre y descripción al mismo tamaño, sólo cambia color) |
| Copy del subtítulo | *Components for web and native apps that feel right.* "Feel right" es el estándar de calidad que usan Emil (h1 de animations.dev: *"How do you craft animations that feel right?"*) y Josh (*"Software that feels right"*). Ninguno de los dos usa "crafted" como adjetivo: *craft* les es verbo o sustantivo, y la calidad la nombran con *feel right*, *care* o *taste*. Afirma el resultado, no el esfuerzo | copy medido de animations.dev e interfacecraft.dev |
| Riel | 52rem compartido por nav y contenido | DESIGN.md de Carousels |
| Colores/espaciado | Tokens heredados del DESIGN.md de Carousels (solo tipografía, colores y tamaños) | `src/tokens.css` |
| Stack | Vite + React 19, versiones exactas, CSS plano + CSS Modules | — |

## Pendiente (marcado como tal en `src/tokens.css`)

- **Navegación bajo 1200px** — el índice lateral no tiene margen donde vivir
  y se esconde, así que en esos anchos la página se queda sin navegación.
  Es lo que sigue. La nav de tabs con la línea que se estira, que era la
  solución anterior, está en el historial (`git show 887545f^:src/parts.tsx`)
  por si sirve de base
- Radios, elevación, z-index — se definen desde la primera pieza construida
- Primera pieza a construir dentro del stage
- Footer / firma: el nombre "Vito Compagnucci" todavía no está en ninguna parte
