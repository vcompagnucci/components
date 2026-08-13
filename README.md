# Exposición

Playground/exposición de componentes estilo design-engineer: piezas web,
web-mobile y nativas, cada una perteneciente a UNA plataforma, mostradas
en una página única. Sin código a la vista, sin instalación — es una
exposición, no una librería instalable.

```bash
pnpm install
pnpm dev        # Vite en http://localhost:5173
pnpm build
pnpm typecheck
```

## Decisiones tomadas (y de dónde salen)

| Decisión | Valor | Fuente |
| --- | --- | --- |
| Formato | Exposición de página única; detalle por pieza como estado, sin rutas | prototipos en `.context/prototypes/` |
| Display | Segmented: una pieza por fila, título arriba, preview grande | ídem |
| Nav | Texto con línea abajo que se estira al viajar (patrón `.dind` del nav de monrovia); gap 20, línea 2px a 6 | `nav.module.css` de monrovia + picker de opciones |
| Categorías | All · Web · iOS — la plataforma es propiedad de la pieza; en All la lista se parte con encabezados grises | convención Apple/Material (se nombra la plataforma, nunca "Native") |
| Demos nativos | Expo demuestra VIVO vía react-native-web cuando la pieza lo banca (como gluestack/RNR/tamagui); SwiftUI siempre video | verificado en esos sitios |
| Tipografía | Familia Benji: un solo tamaño (14px), jerarquía por peso 460/500/600, tracking en rem −0.004 (−0.006 en títulos), lh 1.43 | CSS servido de benji.org — cita en `.context/recon/TYPE-SYSTEMS.md` |
| Aire superior | 80px (32 bajo 640px) | CSS de benji.org (`padding: 5rem`; su escalón está en 768 — 640 acá es herencia del DESIGN.md, divergencia consciente) |
| Masthead | "Library" (600) + una línea gris debajo. El subtítulo no cambia de tamaño: sólo peso y color | benji (`h1` 500 ink / `time` 460 al 40%) y josh (nombre y descripción al mismo tamaño, sólo cambia color) |
| Copy del subtítulo | *Crafted components for web and iOS.* Sin artículo (paralelo con "iOS"), y "and" en vez de "&" porque es prosa — josh reserva el "&" para títulos | copy medido de interfacecraft.dev y benji.org |
| Riel | 52rem compartido por nav y contenido | DESIGN.md de Carousels |
| Colores/espaciado | Tokens heredados del DESIGN.md de Carousels (solo tipografía, colores y tamaños) | `src/tokens.css` |
| Stack | Vite + React 19, versiones exactas, CSS plano + CSS Modules | — |

## Pendiente (marcado como tal en `src/tokens.css`)

- Radios, elevación, z-index — se definen desde la primera pieza construida
- Primera pieza a construir dentro del stage
- Footer / firma: el nombre "Vito Compagnucci" todavía no está en ninguna parte
