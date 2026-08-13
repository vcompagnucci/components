# Library — guía para agentes

Exposición de componentes: piezas web e iOS, cada una perteneciente a UNA
plataforma, mostradas en una página única. No es una librería instalable.
No se muestra código. El detalle **es** el producto.

## Referencias máximas

**[benji.org](https://benji.org/) (Benji Taylor) y
[joshpuckett.me](https://joshpuckett.me/) (Josh Puckett) son las referencias
más altas de este proyecto.** Ante cualquier duda de tipografía, espaciado,
jerarquía, copy o densidad, la respuesta se busca primero ahí — midiendo sus
páginas de verdad, nunca de memoria.

Referencias secundarias: [emilkowal.ski](https://emilkowal.ski/) (Emil
Kowalski) para motion y calma vertical, [rauno.me/craft](https://rauno.me/craft)
para el formato de exposición.

### Regla de evidencia

Nunca se afirma un valor de estos sitios sin medirlo. Dos grados:

- **SOURCE** — leído del CSS servido (`curl` al `.css` que sirve el sitio).
- **RUNTIME** — `getComputedStyle` en el navegador.

El CSS servido gana sobre el computed cuando difieren. El análisis acumulado
vive en `.context/recon/TYPE-SYSTEMS.md`, con los archivos CSS descargados al
lado como cita. Si vas a agregar una conclusión, agregá también la medición.

### Cómo resuelve cada uno la jerarquía

| | mueve | clava | tracking |
| --- | --- | --- | --- |
| **Benji** | el **peso**: 460 cuerpo · 500 énfasis · 560 sección · 600 título | el tamaño (14px en todo) | rampa en `rem`, negativa arriba de 13px, **positiva** por debajo de 12 |
| **Josh** | el **tamaño**: 24px título · 16px cuerpo | el peso (400 siempre) | proporcional en `em`, cambia de signo con el tamaño |
| Emil | peso + color; cuerpo liviano 400, secciones 550 | el tamaño (16px) | **cero** en todo el sitio |

### Título + subtítulo — el patrón medido

**Benji** (su `<header>`): `display: flex; flex-direction: column; gap: 4px`.

- Título `h1` — 14px / **500** / `rgb(17,17,17)`
- Subtítulo `time` — 14px / **460** / `rgba(0,0,0,.4)` ← **alpha, no un gris sólido**
- Mismo tamaño; sólo cambian peso y opacidad. Header completo: 52px de alto.
- Su subtítulo es un **hecho** ("Updated Jul 29, 2026"), no una autodescripción.

**Josh** no tiene subtítulo bajo su nombre: del handle pasa directo a prosa.
Pero su patrón de **proyecto** es exactamente nuestro masthead:

- Nombre — 16px / 400 / `rgb(10,10,10)`
- Descripción — 16px / 400 / `rgb(82,82,82)`, una línea, sin separación extra
- Ejemplo real: *Interface Craft* — "A working library for those committed to
  designing with uncommon care."

Los dos comparten la regla: **el subtítulo no cambia de tamaño, sólo baja de
peso y/o de color.** Y ninguno de los dos se autoelogia: describen qué es la
cosa o para quién es, nunca lo bien hecha que está.

## Método de trabajo

- **Una mini-decisión por vez.** No se avanzan tres cosas juntas.
- Las decisiones se exploran con el skill `prototype`: variantes reales detrás
  del picker, en la página real, y el usuario elige mirando. Todo lo que no
  está bajo estudio se mantiene congelado, para que la comparación sea limpia.
- El taller vive en `.context/prototypes/` (gitignoreado). El repo Vite es
  canónico: cuando algo se decide, se hornea acá y el harness se saca.
- **Nada se afirma sin medir.** Ni valores propios ni ajenos. Los reportes
  citan números tomados del navegador, no estimaciones.

## Estado

Lo decidido y su fundamento está en `README.md`. Los pendientes están marcados
como tales en `src/tokens.css`.
