# Library — guía para agentes

Exposición de componentes: piezas web e iOS, cada una perteneciente a UNA
plataforma, mostradas en una página única. No es una librería instalable.
No se muestra código. El detalle **es** el producto.

Detrás hay un área privada que sólo existe en desarrollo: el **vault**
—la pared de referencias— y el **playground** —el taller—. Las tres
cosas son un solo recorrido, y está contado abajo.

> **¿Venís a construir una pieza?** Andá directo a
> [**El proceso, paso a paso**](#el-proceso-paso-a-paso): hay un camino
> para **Web** y otro para **App**, numerados. El resto de este archivo
> explica POR QUÉ cada paso es así — leelo cuando algo no cierre, o
> antes de cambiar algo que ya está decidido.

## Arrancar en un worktree nuevo

```bash
pnpm install
cp .env.example .env.local   # y poné tu VAULT_DIR
pnpm dev                     # http://localhost:3000
pnpm typecheck
pnpm build                   # corre prebuild → regenera vercel.json
```

Node ≥24, pnpm. Versiones exactas en `package.json`, sin `^` ni `~`.

**El taller nativo se instala aparte**, y sólo cuando vas a tocar una
pieza App — tiene su propio `package.json`:

```bash
cd nativo && pnpm install && pnpm ios:build   # el build es una vez por máquina
```

**Lo que NO viaja al worktree.** Están gitignoreados `node_modules/`,
`dist/`, `.env.local` y **`.context/` entero**. Lo último importa más de
lo que parece: el README cita `.context/recon/*.md` como la fuente de
casi todas las mediciones —`TYPE-SYSTEMS.md`, `RESPONSIVE.md`,
`NAVIGATION.md`, `CARDS.md`, `vault/GRILLA.md`, `vault/REPRODUCTOR.md`—
y **ninguno de esos archivos existe acá**: se escribieron en otro
worktree y no se versionan. Las conclusiones sí sobrevivieron, porque
están en `README.md` y en `DESIGN.md`. Si hace falta el número crudo, se
vuelve a medir; citar el archivo sin haberlo abierto no vale.

**El vault tampoco viaja**: los clips viven en una carpeta tuya fuera del
repo. Sin `VAULT_DIR`, `/vault` y `/playground` cargan igual y dicen
*"Vault not connected"*; el resto de la app anda sin enterarse.

## El recorrido de una pieza

Tres estaciones y una frontera. Va dicho en cada una qué está cableado,
qué es a mano y qué todavía no existe.

```
   tu carpeta            /vault                /playground              /
  (VAULT_DIR)   ───▶   lo EXTERNO      ───▶   lo TUYO         ───▶   la exposición
  soltás clips         mirás y anotás         iterás tu pieza        Add to Library

                                              web: boceto vivo   →  pieza Web (corre)
                                              app: grabación     →  pieza App (video)
                            ↑
                    nativo/ + pnpm grabar
                    (el taller de App escribe
                     su grabación acá adentro)
```

El vault no publica nada — es la pared de referencias. Publicar es el
final del taller y vive donde está tu trabajo: **elegís un frame del
tablero y la acción aparece en la sidebar** (clic derecho: atajo).

---

## El proceso, paso a paso

Lo de arriba es el mapa; esto es el procedimiento. **Dos caminos, y lo
primero que hay que decidir es cuál** — porque no se cruzan: una pieza
Web se construye en el navegador y se publica corriendo; una pieza App
se construye contra el simulador y se publica en video. Lo decide
`platform`, que a su vez lo decide una sola pregunta: **¿dónde corre la
cosa que estás mostrando?** Navegador → Web. App instalada → App.

Las tres reglas que valen para los dos caminos, antes de empezar:

1. **Una mini-decisión por vez.** Lo que no está bajo estudio se queda
   congelado, para que la comparación sea limpia.
2. **Nada se afirma sin medir** — ni un valor propio ni uno ajeno. Ver
   *Regla de evidencia*, más abajo.
3. **El porqué se escribe arriba del archivo y en la bitácora.** Un
   valor sin recibo es un valor que alguien va a cambiar sin saber qué
   rompe.

### Camino A · una pieza **Web**

| # | Paso | Cómo |
| --- | --- | --- |
| 0 | Levantá el repo | `pnpm install && pnpm dev` → `localhost:3000` |
| 1 | **Juntá la referencia** *(opcional)* | Soltá el clip en `VAULT_DIR/web/`. Aparece solo en `/vault` |
| 2 | **Estudiala** *(opcional)* | Abrí el clip: flechas para ir cuadro a cuadro, `option` 10, `command` a los bordes. Anotá `Source` y `Notes` en la ficha |
| 3 | **Llevala al tablero** *(opcional)* | Clic derecho en la grilla → `Open in Playground`, o el ↗ del detalle |
| 4 | **Creá el boceto** | En el lienzo: `+` → **New sketch**. Escribe `src/privado/bocetos/<slug>.tsx` y lo pone en la tela |
| 5 | **Escribí** | Editá ese archivo. Vite lo recarga en el frame **sin recargar la página**. Un boceto roto apaga sólo su frame y se recupera al guardar |
| 6 | **Probalo** | Clic para elegir el frame → ahí el boceto recibe los clics y podés apretarle los botones. `Escape` para volver a moverlo |
| 7 | **Publicá** | Con el frame elegido, `Add to Library` en la sidebar → nombre + una línea de descripción → **Add** |
| 8 | **Verificá** | Te deja en `/<slug>` con el componente **corriendo**. Mirá también la home: el preview vivo va en las dos vistas |
| 9 | **Escribí el porqué** | Comentario arriba del archivo + entrada en la bitácora (`README.md`) |

Qué pasó por detrás en el paso 7: el archivo se **copió** de
`src/privado/bocetos/` a `src/piezas/<slug>.tsx` —cruzó la frontera, ver
abajo— y entró la entrada en `PIECES`. **A partir de ahí el canónico es
el archivo publicado**; el boceto se queda en tu tablero.

> Una pieza publicada **no puede importar nada de `src/privado/`**. El
> boceto nace autocontenido y tiene que seguir siéndolo.

### Camino B · una pieza **App** (Expo / React Native)

| # | Paso | Cómo |
| --- | --- | --- |
| 0 | Levantá el taller | `cd nativo && pnpm install`. **La primera vez en la máquina**, además `pnpm ios:build` (compila el dev client). Después alcanza `pnpm ios` |
| 1 | **Juntá la referencia** *(opcional)* | Soltá la grabación ajena en `VAULT_DIR/native/`, estudiala en `/vault` como en el camino A |
| 2 | **Creá la pieza** | `pnpm nueva "Swipe to pay"` → `nativo/src/app/swipe-to-pay/index.tsx`. El índice del taller la levanta solo |
| 3 | **Escribí** | Editá ese archivo. Metro recarga en caliente. Disponibles: Reanimated, Gesture Handler, Skia, expo-haptics |
| 4 | **Miralo correr** | En el simulador. Para volver al índice, **swipe desde el borde izquierdo** |
| 5 | **Probalo en el teléfono** | Vale la pena: el simulador **no tiene háptica ni 120Hz**. Expo Go + misma Wi-Fi, o `pnpm start --tunnel` |
| 6 | **Grabá** | `pnpm grabar swipe-to-pay`. Corta con Enter. Barra en 9:41, `--codec h264`, escribe **directo a `VAULT_DIR/native/`** |
| 7 | **Llevala al tablero** | La grabación ya está en `/vault`: clic derecho → `Open in Playground` |
| 8 | **Publicá** | Con el frame elegido, `Add to Library` → nombre + descripción → **Add** |
| 9 | **Verificá** | Te deja en `/<slug>` con el video autoreproduciendo en el hueco del teléfono |
| 10 | **Escribí el porqué** | Igual que el camino A |

Qué pasó por detrás en el paso 8: el video se copió a
`public/piezas/<slug>.<ext>` —el vault no viaja al deploy— y entró la
entrada en `PIECES` con `platform: 'App'` y su `video`.

**Si el video llega DESPUÉS** —se hace aparte, lo hace otro, o el que
había no era el bueno— la pieza igual puede estar publicada: sin `video`
la card muestra el hueco del teléfono vacío. Cuando el archivo esté:

```bash
pnpm pieza:video swipeable-tabs mockup/out/library --alfa        # el par con alfa de `pnpm render:library` (webm + mov), tal cual, y completa `video` y `videoHevc`
pnpm pieza:video swipeable-tabs ~/Downloads/final.mp4            # un video opaco cualquiera: re-encodea para la web y completa `video`
```

Una pieza App se muestra **transparente y sin sombra** sobre la
superficie de la card, como los videos de Family en benji.org: el fondo
lo pone la library en el tema que sea, así que no hay versiones por
tema. El porqué está en `mockup/AGENTS.md`.

No pasa por el vault, y no tiene por qué: el vault es lo ajeno. El
porqué y las guardas están arriba de `scripts/pieza-video.mjs`.

**El video para X** —el teléfono en su bisel sobre fondo neutro, con la
cámara que entra y sale— se hace en `mockup/` (Remotion): `pnpm assets`
→ `pnpm verificar` → `pnpm studio` → `pnpm render:ambos`. **Cada video
sale dos veces**, sobre fondo claro y sobre fondo oscuro. El proceso
entero y cada mini-decisión están en `mockup/AGENTS.md`.

### Lo que vale para los dos

**El slug es el mismo string en todos lados.** La carpeta del taller
nativo, el nombre del archivo de la grabación, el archivo del demo web,
y la URL pública. Sale de `slug()` en `src/pieces.ts`, que es la única
cuenta que existe. Si dos divergen, la pieza no encuentra su propio
material.

**Cómo se nombra.** Menos de 15 caracteres (Toolbars › Titles de la
HIG). El título dice **QUÉ es el gesto**; `Source` dice **de dónde
salió**. El modelo es `Swipe to pay`: 12 caracteres, no nombra la app, y
dice exactamente qué vas a ver. El título y la línea de descripción
siguen la regla de nombres (Método de trabajo): el término técnico y el
verbo de especificación, sin palabras graciosas — "tap to select one",
no "tap to jump". **La línea de descripción tampoco nombra la app**: de
dónde salió la pieza se cuenta en las notas, en Anatomy, donde se
cuenta cómo se midió (pedido del usuario, 2026-09-07). Y ES CORTA: qué
es y para qué plataforma, nada más —"Top tabs for React Native and
Expo."—; los detalles van en Anatomy ("muchísimo más corto esto" y
"que sea tabs, React Native, Expo", mismo día). El nombre de la
plataforma es "React Native", no el de una librería.

**Publicar no pisa nada.** Nombre repetido → 409. Y el servidor hace las
dos escrituras o ninguna: si la entrada en `PIECES` falla, el archivo
copiado se retira.

**Antes de dar algo por terminado**, en los dos caminos:

```bash
pnpm typecheck && pnpm build          # el repo web
pnpm --dir nativo typecheck           # el taller, si lo tocaste
```

### Qué NO hacer

- **No publicar material ajeno.** Los clips del vault son referencias de
  otras apps; el inventario lleva sólo piezas construidas de verdad. Si
  publicás algo para probar, revertilo: borrá la entrada de `PIECES` y
  el archivo de `public/piezas/` o `src/piezas/`.
- **No importar de `src/privado/` desde el producto.** La dependencia va
  en un solo sentido o el área privada termina en el bundle.
- **No agregar placeholders.** Acá se borraron 18 piezas de scaffolding
  antes de la primera real, para que nada genérico se confunda con una
  decisión.
- **No `npm install` en `nativo/`.** Las versiones las elige
  `expo install`, que respeta lo que el SDK verificó.
- **No dejar bocetos de prueba** en `src/privado/bocetos/` ni
  grabaciones de prueba en el vault.

---

## Las tres estaciones, por dentro

Hasta acá, qué hacer. De acá en adelante, **por qué cada paso es así** y
qué hay debajo de cada uno — lo que hay que leer antes de cambiar algo
que ya está decidido.

### 1 · El vault — lo que mirás

**Entra un archivo, no un registro.** Soltás un video o una imagen en
`VAULT_DIR` y aparece en la grilla. La carpeta **es** el manifiesto: el
nombre sale del nombre del archivo, `native`/`web` de la subcarpeta donde
lo soltaste, la fecha del sistema de archivos (`src/privado/clips.ts`).
No hay JSON que mantener, y por eso el vault no puede mentir — un
manifiesto a mano se desincroniza el día que arrastrás algo sin editarlo.

**El puente es un plugin de Vite**, `scripts/vault-media.mjs`, con
`apply: 'serve'`: en `vite build` ni se instancia. Sirve los medios en
`/vault-media/` más siete endpoints —`__indice`, `__ficha`, `__vistas`,
`__renombrar`, `__papelera`, `__subir`, `__link`— y **tres guardas**,
porque esto puede estar apuntando a tu Obsidian: lista blanca de
extensiones, nada que empiece con punto, `realpath` de los dos lados.

**Lo que anotás vos** —`notes`, `source`, `device`— vive en
`.lima-vault.json`, en la raíz del vault y al lado de los clips. Tres
campos, y son los mismos que valida el servidor: agregar uno acá sin
agregarlo allá lo descarta al guardar, en silencio.

**El detalle existe para medir.** El reproductor va cuadro a cuadro con
las flechas (sola 1 · option 10 · command a los bordes) y el paso lo lee
del contenedor del mp4, no lo estima (`scripts/cuadros.mjs`).

**La salida al taller**: en la grilla, clic derecho → `Open in
Playground`. Adentro de un clip, el ícono ↗ de la cabecera. Los dos
llaman a lo mismo, `alPlayground(ruta)` en `vistas.ts`.

### 2 · El playground — donde se construye

**Vistas = lienzos**, como entrar a distintos archivos de Figma. Al revés
que los clips, esto **no** se deriva del disco: una vista existe porque
la creaste, así que sí hay algo que mantener y vive en
`.lima-playground.json`, también en la raíz del vault. No en
`localStorage` a propósito: una vista referencia clips por su ruta, así
que pertenece al mismo lugar que ellos.

**Un frame es una cosa puesta en la tela**, y tiene tres tipos: `clip`
(`ref` = la ruta del archivo en el vault), `boceto` (`ref` = el nombre de
su archivo en `src/privado/bocetos/`) y `pieza` (`ref` = el nombre de la
pieza; todavía sin dibujo). Siempre es una **referencia y no una copia**:
si le cambiás la ficha a un clip o escribís en un boceto, el frame que lo
muestra ya está actualizado; si el clip se va del vault, el frame se
queda diciendo a qué apuntaba, en vez de desaparecer sin que nadie lo
note.

**`alPlayground` no abre un selector.** El clip cae en la vista más
reciente —la de `creada` más alta— y si no hay ninguna, la crea: mandar
algo al playground tiene que funcionar la primera vez que lo apretás.
Nace a 480×270 y el lienzo le corrige la proporción cuando el medio
termina de cargar.

**⌘Z y ⇧⌘Z deshacen acá**, por snapshots del documento entero: 100 pasos,
en memoria, se vacían al recargar. En el vault ⌘Z sigue siendo *volver* —
el playground escucha en captura y el de `privado.tsx` se aparta al ver
el evento marcado, así que quién gana no depende del orden de montaje.

**Escribir un componente desde cero: los bocetos.** Un frame `boceto` es
**un archivo de verdad** en `src/privado/bocetos/`, que exporta un
componente por defecto. `New sketch`, en el diálogo del `+`, crea el
archivo y lo pone en la tela; después lo abrís en tu editor —o se lo
pasás a un agente— y escribís. Vite lo recarga en el frame **sin recargar
la página**: no se pierde la posición de nada.

Eso es a propósito el camino más corto para las dos formas de trabajar:
un agente escribe archivos, no tipea en un textarea, así que si el boceto
ES un archivo las dos son la misma y ninguna necesita interfaz. Por eso
tampoco hay un editor adentro del navegador.

Tres cosas que conviene saber antes de tocarlo:

- **Un boceto roto no tira el tablero.** Cada uno va adentro de un límite
  de error, así que lo único que se apaga es su frame — y se recupera
  solo en el siguiente guardado, sin recargar.
- **El puntero se reparte por selección.** Sin elegir, el frame se
  arrastra; elegido, el boceto recibe los clics y podés probar lo que
  estás construyendo. Para volver a moverlo, Escape.
- **Es sólo web.** Una pieza de App no se construye acá: se construye
  contra el simulador, con el agente al lado, y llega a la exposición
  como video (ver abajo).

**Y acá se publica.** Con un frame elegido, `Add to Library` aparece en
la sidebar —debajo del índice, el patrón del panel de selección de Figma
colapsado en el panel que ya existe— y el clic derecho lo ofrece como
atajo. Un boceto sale como pieza Web viva, una grabación como pieza App.
El detalle está en la sección 3.

**Lo que sigue faltando** es `tipo: 'pieza'`: está en el modelo y nada lo
crea: si un frame llegara con ese tipo se dibuja un hueco con la palabra
`Piece`. El andamio está puesto y dicho; falta la pieza que lo estrene.

### 3 · La library — lo público

`src/pieces.ts` es el inventario, y **está vacío a propósito**: los 18
placeholders se borraron enteros antes de la primera pieza real, para que
nada genérico se confunda con una decisión. La primera define el molde.

**Publicar es un gesto del tablero.** Elegís el frame y `Add to Library`
aparece en la sidebar (el clic derecho lo repite como atajo): nombre
(llega puesto) y una línea de descripción, que
son literalmente los dos renglones del detalle público. **La plataforma
la dice el frame**, no un selector:

- un frame **boceto** publica una pieza **Web**: su archivo se copia de
  `src/privado/bocetos/` a `src/piezas/<slug>.tsx` — el lado público de
  la frontera — y el demo corre **vivo** en la lista y el detalle.
- un frame **clip** (una grabación tuya que entró por el vault) publica
  una pieza **App**: el video se copia a `public/piezas/<slug>.<ext>` y
  autoreproduce en el hueco del teléfono.

El servidor hace las dos escrituras o ninguna —el archivo del demo y la
entrada en `PIECES`— y no pisa nada nunca: repetir un nombre es un 409.
Al terminar te deja parado en la página nueva, que es la confirmación.

**Cómo vive una pieza Web**: `src/piezas/<slug>.tsx` exporta el
componente por defecto y `demos.tsx` lo resuelve **por nombre** — el
slug es el mapa, no hay registro que mantener. Publicar es COPIA, no
mudanza: el boceto queda en el tablero; desde ahí la pieza se edita en
su archivo publicado. Y como es producto, **no puede importar nada de
`src/privado/`**.

Alrededor:

1. La entrada en `PIECES` — `name`, `platform`, `desc`, y `video` sólo
   para App. El `slug` del nombre es su URL: `Photo picker` →
   `/photo-picker`. También se puede escribir a mano; publicar es el
   camino corto.
2. `prebuild` corre `scripts/rutas.mjs`, que **regenera `vercel.json`**
   con el rewrite de esas rutas — importa `PIECES` y `slug` de verdad
   (Node ≥24 corre TypeScript), así que si `pieces.ts` no compila, el
   build frena ahí.

El `slug` es **uno solo** y vive en `pieces.ts`: lo comparten la página,
el generador de rutas y el puente que publica. Acá vivían dos cuentas
distintas que coincidían de casualidad; quedó una.

**`platform` decide cómo se demuestra, y nada más**: Web va viva en el
navegador, App va en video. No se decide por pieza — y publicar tampoco
lo pregunta, lo lee del frame.

**Y decide también dónde se construye.** Una pieza **Web** se boceta en
el lienzo del playground. Una pieza **App** no: se escribe con el agente
mientras la mirás correr en el simulador de iOS, y entra a la exposición
como **grabación de pantalla**. El playground no intenta simular un
teléfono, y eso es una decisión y no una carencia — `react-native-web`
dibujaría la forma y mentiría justo en lo que este vault estudia, que es
el gesto y el háptico.

### El taller nativo — `nativo/`

Una app de **Expo adentro de este mismo repo**, con su propio toolchain.
Su guía completa está en [`nativo/AGENTS.md`](nativo/AGENTS.md) —ahí
están también las convenciones que valen para toda pieza y las trampas
que ya conocemos— y el material de vidrio tiene su propia referencia en
[`nativo/VIDRIO.md`](nativo/VIDRIO.md). La recon que fundamenta el taller
está en `.context/recon/TALLER-NATIVO.md` (gitignoreada, por eso lo
importante vive acá). En tres comandos:

```bash
cd nativo && pnpm install && pnpm ios:build   # el build es una vez por máquina
pnpm nueva "Swipe to pay"     # crea src/app/swipe-to-pay/index.tsx
pnpm grabar swipe-to-pay      # graba al vault y cierra el circuito
```

- **Una sola app-taller, una carpeta por pieza.** Medido contra lo que
  hacen los referentes: **nadie arma un repo por demo** — Mangano
  sostiene 127 animaciones en una app Expo, Candillon una carpeta por
  episodio, Gitter un `.swift` por interfaz. El repo propio es el premio
  de la pieza que se volvió librería (Wave, Motion), nunca el punto de
  partida.
- **Adentro del repo y no al lado**, y acá nos apartamos de la recon a
  propósito: la unidad de trabajo es un **worktree**, y todo lo que
  queda afuera no viaja — ya pasó con el vault y con `.context/`. El
  taller es código. La frontera la hace la carpeta, como con
  `src/privado/`: `nativo/` tiene su `package.json` y su `tsconfig`, el
  `tsc` de la raíz sólo mira `src`, y Vite sólo sigue lo que cuelga de
  `index.html`. Verificado: con `nativo/` presente, `pnpm typecheck` y
  `pnpm build` de la raíz no lo tocan.
- **El índice del taller se deriva de las carpetas** (`require.context`
  en `nativo/src/app/index.tsx`), igual que el vault se deriva del
  disco: no hay lista que mantener y no puede mentir.
- **El slug es el mismo string en tres lados** — la carpeta del taller,
  el archivo de la grabación, y la URL de la pieza publicada.
- **El cierre es `pnpm grabar`**: clava la barra de estado en 9:41,
  graba con `--codec h264` —el default de `simctl` es **HEVC** y puede
  no reproducirse en el `<video>` de la exposición, que es la trampa más
  cara del camino porque no falla al grabar sino en la pieza ya
  publicada— y escribe **directo a `VAULT_DIR/native/`**. Parás y el
  clip ya está en la grilla → Open in Playground → Add to Library.
- **Las versiones las elige `expo install`, no npm.** Una dependencia de
  RN trae código nativo compilado contra el runtime del SDK: la última
  de npm contra SDK 57 es una combinación que nadie probó, y rompe el
  build nativo. La regla del repo se cumple donde acá significa algo —
  **el SDK es el último**, 57. La tabla con las cuatro versiones y su
  porqué está en `nativo/AGENTS.md`.
- **El dev build anda, con un parche de dos líneas.** Xcode 26.2 rechaza
  una anotación que `expo-modules-jsi` 57.0.5 le puso a un constructor;
  `patches/expo-modules-jsi@57.0.5.patch` la saca y deja el header
  idéntico al de 57.0.4, que Expo publicó y compila. El porqué completo
  está en `nativo/AGENTS.md`.
- **SwiftUI todavía no tiene taller**: espera a la primera pieza que lo
  pida. Ahí van View por pieza + `#Preview` y los springs de iOS 17.

**El stage sabe mostrar las dos.** `Muestra`, en `parts.tsx`, decide por
`platform`: la grabación de una App en el hueco de teléfono que la caja
ya reservaba, o el componente de una Web corriendo vivo — resuelto por
slug en `demos.tsx`. Lo que falta ahora no es mecanismo: es la primera
pieza real.

### La frontera

Todo lo que cuelga de `src/privado/` existe **sólo en desarrollo**, y no
porque el host lo bloquee: el código **no llega al build**. Son dos
pliegues sobre `import.meta.env.DEV` en `app.tsx` —la lista de rutas a
`[]`, el componente a `null`— y Rollup borra el import dinámico entero.
Verificado contando ocurrencias en `dist/`: cero. En producción `/vault`
cae en la misma rama que cualquier URL inventada.

El borde es una **carpeta** y no un flag repartido por archivos: un flag
se olvida, un directorio no. Cualquier archivo nuevo ahí adentro hereda
la puerta sin que nadie tenga que acordarse.

**La dependencia va en un solo sentido.** Lo privado puede importar del
producto (tokens, `clicDeLink`, `Volver`); el producto **no** puede
importar de lo privado, porque eso lo arrastraría al bundle. Cuando el
lienzo tenga que dibujar una pieza de verdad, el import va en esa
dirección —privado → producto— y por eso el modelo guarda el **nombre**
de la pieza y no su componente.

## El mapa del repo

| dónde | qué |
| --- | --- |
| `src/app.tsx` | el router (sin librería: `pushState` y dos vistas), el scrollspy, la puerta de lo privado |
| `src/pieces.ts` | el inventario público y el `slug` canónico. Hoy vacío |
| `src/demos.tsx` | el mapa nombre → componente de las piezas Web |
| `src/piezas/` | **el demo de cada pieza Web**, un archivo por slug. Acá aterriza un boceto publicado |
| `nativo/` | **el taller nativo**: app Expo con su propio toolchain. Ver su `AGENTS.md` |
| `nativo/VIDRIO.md` | referencia del material de vidrio: por qué un `GlassView` no se anima por opacidad |
| `nativo/src/app/<slug>/` | una pieza App en construcción, una carpeta = una ruta |
| `nativo/scripts/nueva.mjs` | crea una pieza. El `New sketch` de este lado |
| `nativo/scripts/grabar.mjs` | graba el simulador **directo al vault**: barra limpia + h264 |
| `mockup/` | **el video para X de una pieza App**, en Remotion: bisel oficial, fondo neutro, cámara medida; se itera en Studio. Ver su `AGENTS.md` |
| `src/parts.tsx` | masthead, ítem de lista, detalle, la muestra (video/vivo), flecha de volver, `clicDeLink` |
| `src/tokens.css` | todos los tokens, cada uno con su grado de evidencia y sus cuatro ramas (claro · oscuro · alto contraste ×2) |
| `src/not-found.tsx` | el 404 con física |
| `src/privado/privado.tsx` | el marco del área privada: solapas, hueco de acciones, ⌘Z de navegación |
| `src/privado/vault.tsx` | la grilla y el detalle de un clip |
| `src/privado/clips.ts` | el índice del vault y la derivación desde el archivo |
| `src/privado/reproductor.tsx` | cuadro a cuadro, pista de 2px, velocidad 1x/0.5x |
| `src/privado/ficha.tsx` | los cuatro datos al costado del clip |
| `src/privado/enlaces.ts` · `enlace.tsx` | encontrar los links de una nota y dibujarlos |
| `src/privado/playground.tsx` | la lista de vistas y el lienzo |
| `src/privado/vistas.ts` | modelo de vistas, persistencia, deshacer/rehacer, `alPlayground` |
| `src/privado/bocetos.tsx` | el registro de bocetos: los encuentra, los dibuja y aguanta que estén rotos |
| `src/privado/bocetos/` | **acá se escribe.** Un archivo por boceto, componente por defecto |
| `src/privado/acciones.tsx` | menú del clic derecho, diálogos, botones del chrome |
| `scripts/vault-media.mjs` | el puente al vault |
| `scripts/cuadros.mjs` | `mdhd` + `stts` del mp4/mov, sin ffprobe |
| `scripts/rutas.mjs` | `vercel.json` desde `pieces.ts`, en prebuild |
| `scripts/tarjeta-link.mjs` | título y favicon de un link, del lado del servidor |

## Dónde está escrita cada cosa

- **`README.md`** — la bitácora. Cada decisión, su valor y de dónde
  salió. Es lo primero que hay que leer antes de tocar algo que ya está
  decidido: casi todo lo que parece arbitrario tiene una medición atrás.
- **`DESIGN.md`** — la referencia. Los tokens, sus valores en cada
  viewport, los grados de evidencia y las cuatro reglas del sistema.
- **`AGENTS.md`** (esto) — cómo funciona el producto y cómo se trabaja.
- **Los archivos mismos.** Cada `.tsx` y cada `.module.css` lleva el
  porqué arriba, y es donde más rápido se entiende algo. Cuando se decide
  algo nuevo, se escribe ahí **y** en la bitácora.

## Referencias máximas

**[benji.org](https://benji.org/) (Benji Taylor) y
[joshpuckett.me](https://joshpuckett.me/) (Josh Puckett) son las referencias
más altas de este proyecto.** Ante cualquier duda de tipografía, espaciado,
jerarquía, copy o densidad, la respuesta se busca primero ahí — midiendo sus
páginas de verdad, nunca de memoria.

Referencias secundarias: [emilkowal.ski](https://emilkowal.ski/) (Emil
Kowalski) para motion y calma vertical, [rauno.me/craft](https://rauno.me/craft)
para el formato de exposición. Para el área privada se midieron además
`linear.app/now`, el archivo de Figma y la HIG de Apple.

### Regla de evidencia

Nunca se afirma un valor de estos sitios sin medirlo. Dos grados:

- **SOURCE** — leído del CSS servido (`curl` al `.css` que sirve el sitio).
- **RUNTIME** — `getComputedStyle` en el navegador.

El CSS servido gana sobre el computed cuando difieren. Y una regla que
existe en la hoja **no** es una regla en la pantalla: si la conclusión
depende de lo que se renderiza, hay que mirar el HTML servido. Eso ya
falló tres veces acá —el zoom de benji, las utilidades `active:scale` de
josh, la card asimétrica de linear—: las tres reglas existían y
renderizaban **cero** elementos.

La HIG de Apple no se puede leer con `WebFetch` —sus páginas se arman con
JS— pero sí en JSON:
`https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<pagina>.json`.

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
- El taller vive fuera del build (`proto/`, `.context/prototypes/`). El repo
  Vite es canónico: cuando algo se decide, se hornea acá y el harness se saca.
- **Nada se afirma sin medir.** Ni valores propios ni ajenos. Los reportes
  citan números tomados del navegador, no estimaciones.
- **No se razona sobre datos inventados.** Contar sobre placeholders y
  presentar el resultado como dato es un error — ya pasó con las 18 piezas
  de scaffolding que hubo en `pieces.ts`.
- **Una atribución también se verifica.** El `←` de la flecha de volver
  estuvo atribuido a benji y josh en la bitácora, y los dos usan palabras
  (`Index`, `Home`): era una decisión nuestra con una cita prestada encima.
- **Todo nombre usa vocabulario profesional preciso.** Archivos,
  scripts, carpetas, funciones, variables, clases, commits, ramas, lo que
  sea: la palabra que un ingeniero de IBM habría escrito en una
  especificación en 1972. Sin jerga, sin abreviaturas casuales, sin
  nombres graciosos ni ingeniosos, sin palabras prestadas del chat. Vale
  para todo, no sólo para el ejemplo que sigue: un script que despliega
  dashboards es `deploy_dashboards.sh`, no `push_dashboards.sh` — y eso
  es una ilustración del principio, no su alcance. Vale también para el
  texto público —el título de la pieza, su línea de descripción y las
  notas—: las partes se nombran con el término técnico (header, tab bar,
  pager, list) y las acciones con el verbo de especificación ("select",
  no "jump"; "collapses", no "folds away"). Regla traída por el usuario
  el 2026-09-07.

## Estado

Lo decidido y su fundamento está en `README.md`, y ahí mismo está la lista
de **Pendiente**. Los pendientes de tokens están marcados como tales en
`src/tokens.css`.
