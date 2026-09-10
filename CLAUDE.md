# Interface exhibition

**Leé [`AGENTS.md`](AGENTS.md) antes de tocar nada.** Ahí está cómo
funciona todo: el recorrido de una pieza (vault → playground → exhibition),
el mapa del repo, la frontera dev/producción y el método de trabajo.

**Si venís a construir una pieza**, el procedimiento numerado está en
[AGENTS.md › El proceso, paso a paso](AGENTS.md#el-proceso-paso-a-paso)
— un camino para **Web** (boceto en el playground, se publica corriendo)
y otro para **App** (Expo en `nativo/`, se publica en video). Lo primero
que hay que decidir es cuál: ¿dónde corre la cosa que estás mostrando?

Este archivo es un puntero a propósito — no repite contenido, para que no
pueda quedar viejo.

| archivo | qué es |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | cómo funciona el producto y cómo se trabaja acá |
| [`README.md`](README.md) | la bitácora: cada decisión, su valor y de dónde salió |
| [`DESIGN.md`](DESIGN.md) | la referencia: tokens, valores por viewport, las cuatro reglas |

Lo que no se negocia, y está desarrollado en `AGENTS.md`:

1. **Nada se afirma sin medir**, ni valores propios ni ajenos. Una regla
   que existe en una hoja de estilos no es una regla en la pantalla.
2. **Una mini-decisión por vez**, explorada con el skill `prototype` en la
   página real. Lo que no está bajo estudio se queda congelado.
3. **`src/privado/` no se importa desde el producto.** La dependencia va
   en un solo sentido o el área privada termina en el bundle.
4. **El porqué se escribe arriba del archivo** y en la bitácora. Un valor
   sin recibo es un valor que alguien va a cambiar sin saber qué rompe.
5. **Todo nombre usa vocabulario profesional preciso** —archivos,
   funciones, variables, commits, ramas, lo que sea—: la palabra que un
   ingeniero de IBM escribiría en una especificación en 1972. Sin jerga,
   sin nombres graciosos ni ingeniosos. `deploy_dashboards.sh`, no
   `push_dashboards.sh`; y en el texto público —título, descripción,
   notas—, "tap to select", no "tap to jump".
