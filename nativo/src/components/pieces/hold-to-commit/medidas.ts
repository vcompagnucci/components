/* ═══════════════════════════════════════════════════════════════
   LOS VALORES DE LA PIEZA, CON SU RECIBO.

   Todos salen de medir el clip de referencia (`VAULT_DIR/nativo/Hold to
   commit.mp4`: el botón de Opal, publicado por @60fpsdesign en X;
   1350×1406, 60 fps, recorte de un 2160×2160) leyendo
   píxeles crudos: ffmpeg escribe rgb24 y Python cuenta. Las planillas y
   los scripts están en `.context/hold-to-commit/` del repo web — que no
   viaja entre worktrees, y por eso el recibo de cada número está acá.

   LA ESCALA: la pantalla del teléfono del clip va de x=80 a x=1272, o
   sea 1192 px. El simulador del taller es un iPhone 17 Pro Max (440 pt)
   y las cuentas cierran con él: 1192 / 440 = 2.709 px/pt. Un 430 pt
   (15 Pro Max) daría 2.77 y las mismas proporciones; lo que cambia es
   un 2 % en los valores absolutos, que igual se compararon después en
   pantalla contra el clip.

   Tres grados, como en el resto del repo:
   · RUNTIME   — leído del píxel del clip.
   · DERIVADO  — una cuenta sobre un RUNTIME, con la cuenta escrita.
   · SUPUESTO  — lo que el clip NO muestra (la parte de arriba de la
                 pantalla, la háptica). Va dicho como tal.
   ═══════════════════════════════════════════════════════════════ */

/** px del clip → pt. RUNTIME: 1192 px de pantalla / 440 pt. */
export const PX = 2.709

export const COLOR = {
  /* RUNTIME · el fondo de la pantalla: (20,20,20) en todo hueco libre. */
  fondo: '#141414',

  /* RUNTIME · las cards: (27,27,27) y (28,28,28) según la card. */
  card: '#1C1C1C',

  /* RUNTIME · el pill en reposo, en las dos puntas donde el brillo no
     llega: (30,30,30). */
  pill: '#1E1E1E',

  /* EL ANILLO NO SE DIBUJA, y por eso acá no hay constante. Se midió
     (RUNTIME · un anillo de ~1 pt más claro alrededor del pill: 48–54 de
     luminancia sobre 30 de interior; blanco al 8 % lo reproducía) y
     después se midió otra vez, mejor: nuestro anillo se despegaba +54.5
     de lo que tiene a 2 pt afuera y el de Opal +4, o sea que en el clip
     el borde es una rampa y el nuestro era un contorno dibujado. Lo
     reemplaza la sombra de `css.sombra` en `hold-to-commit.tsx`. El recibo entero
     está en el README, § Hold to commit. */

  /* RUNTIME · texto primario: moda 255. */
  texto: '#FFFFFF',

  /* RUNTIME · texto secundario, íconos y chevrones: la tinta pico da
     156–165 en cuatro textos distintos y 150–161 en los símbolos. Un
     texto fino comprimido en video nunca llega a su color real; 158 es
     la lectura, y es NEUTRO (nada del azul de secondaryLabel). */
  secundario: '#9E9E9E',

  /* RUNTIME · el track del toggle: (73,73,73). La perilla: (254,254,254). */
  toggleTrack: '#494949',
  toggleKnob: '#FFFFFF',

  /* RUNTIME · los círculos de los días son blanco puro y la letra llega a
     (0,0,0): negro, no el gris del fondo. */
  circulo: '#FFFFFF',
  circuloLetra: '#000000',

  /* RUNTIME · el verde del badge PRO: el centro del asta de la P da
     (203,251,209)/(183,252,189). Un trazo de 1.2 pt en video se lee más
     apagado de lo que es; el color va apenas por encima de la lectura. */
  pro: '#BDF7C5',
  /* RUNTIME · el interior del badge no es el color de la card: (20,29,25)
     contra (27,27,27) — un tinte verde de ~5 %. */
  proFondo: 'rgba(180,255,190,0.06)',

  /* RUNTIME · "Keep Holding..." sobre el relleno blanco, en la meseta
     (f146–f177): el píxel más oscuro da (29,36,32) y el 10 % más oscuro
     (30–51, 36–64, 32–54). Es un gris VERDOSO, no negro: G va 8 arriba. */
  tintaOscura: '#202B24',

  /* RUNTIME · "✓ Committed" llega a (0,0,0) en decenas de píxeles. */
  tintaNegra: '#000000',

  /* RUNTIME · el pill terminado: 254 en el centro. Con el rim verde del
     blob asomando al 25 % arriba (ver `COMMIT.veloBlanco`). */
  committed: '#FFFFFF',
  /* Los chips del selector (andamiaje): blanco al 6 % y al 18 % sobre el
     fondo oscuro. SIN RECIBO: no son de la pieza. */
  chip: 'rgba(255,255,255,0.06)',
  chipActivo: 'rgba(255,255,255,0.18)',
} as const

/* MODO CLARO — no está en el clip: Opal es oscuro. Lo que cambia cuando
   la pantalla es clara (pedido del 2026-09-07, mirando el simulador en
   claro: "adaptalo bien a light mode, lo veo horrible todo, hasta el
   picker, y todo lo del botón", y "sacá las cosas del fondo del botón").
   SUPUESTOS derivados de los colores de sistema de iOS, no medidos de
   una referencia:
     · el pill sigue oscuro (#1E1E1E): un botón primario negro sobre
       blanco es el botón estándar de iOS y de Robinhood en claro, y el
       relleno blanco del hold contrasta igual. Lo que se va es lo
       pintado en su fondo: el brillo teal→verde de reposo, que sobre
       una pantalla blanca era el único color de la pantalla.
     · lo que separa al pill de la página en claro es la SOMBRA
       (`css.sombra` en `hold-to-commit.tsx`), no un anillo. Hubo uno —blanco al
       8 % en oscuro, negro al 10 % en claro— y salió: ver el bloque del
       anillo arriba, en COLOR. Que el pill blanco del commit no se
       perdiera contra la página no se arregló en el botón sino
       moviéndola a `systemGroupedBackground` (`fondos/accion.tsx`).
     · la ráfaga es del color del pill: puntos blancos sobre fondo
       blanco no existen.
     · los chips del selector: `systemFill` y `secondaryLabel` de iOS
       en claro. */
export const CLARO = {
  particula: '#1E1E1E',
  chip: 'rgba(120,120,128,0.2)',
  chipActivo: 'rgba(120,120,128,0.4)',
  chipTexto: 'rgba(60,60,67,0.6)',
  chipTextoActivo: '#000000',
} as const

export const PANTALLA = {
  /* RUNTIME · borde de card a borde de pantalla: (134.5−80)/2.709 = 20.1
     a la izquierda y (1272−1218)/2.709 = 19.9 a la derecha. */
  margen: 20,
  /* RUNTIME · el pill va MÁS adentro que las cards: 159 y 1193 → 29.2 y
     28.8 pt. No es el margen de las cards más nada: es 29. */
  margenPill: 29,
} as const

export const CARD = {
  /* DERIVADO · el padding interior. Los 7 círculos de 44 con 6 huecos de
     8 miden 356; el borde del primero cae a (192−135)/2.709 = 21.0 del
     borde de la card y el del último a 21.4. El texto ("On these days",
     "Hard Mode") tiene la tinta a 21.8–22.1, que es 21 más el side
     bearing de una mayúscula. */
  padding: 21,
  /* RUNTIME · el lado derecho va más adentro que el izquierdo: la y de
     "Everyday" termina en 396.8 desde el borde de pantalla, la tinta del
     chevron en 397.4 y la del stepper en 396.8 → cajas en ~397 → 23 del
     borde de la card (el izquierdo da 21 + el bearing de la H). */
  paddingDerecho: 23,

  /* DERIVADO · el padding vertical. La card de una línea mide 151 px =
     55.7 pt; con una línea de SF 17 (20.3 pt de alto natural) quedan
     17.7 por lado. La de dos líneas (224 px = 82.7) cierra con 18 +
     20.3 + 4 + 20.3 + 18 = 80.6, y "To" tiene 17.7 de baseline al borde. */
  paddingVertical: 18,
  /* RUNTIME · la card de DOS líneas mide 82.7 y con 18 de padding cierra
     en 80.6 (medido en pantalla: 80.7). Un punto más por lado. */
  paddingVerticalDosLineas: 19,

  /* RUNTIME · entre "Hard Mode" y "No unblocks allowed" hay 66.5 px de
     baseline a baseline = 24.5 pt: 20.3 de línea + 4 de aire. */
  entreLineas: 4,

  /* RUNTIME · entre cards: 871→902 y 202→233, las dos veces 31 px = 11.4. */
  separacion: 12,

  /* LAS ESQUINAS SON CONTINUAS, y grandes. El perfil de la esquina
     inferior derecha de la card de los días (borde a distintas
     profundidades desde el fondo) se aparta sistemáticamente de un
     círculo: a 30–70 px de profundidad el borde está 4–6 px MÁS adentro
     que el círculo que ajusta las puntas (R=90 px). Esa firma —la curva
     sigue después de donde un círculo ya se enderezó— es la del
     `cornerCurve: continuous` de iOS.
       RUNTIME (Days, bottom=538): prof 6→57  10→49  22→30  30→24  42→16  54→8  66→5  74→3
     RUNTIME · un círculo de 33 pt ajusta el perfil del clip a ±1 px en
     todas las profundidades (2.2→21.2, 8.1→11.4, 14→6, 19.9→2.7) y se
     queda corto sólo en la cola (25.8→0.8 contra 1.5), que es lo que
     agrega la curva continua. Con 26 continuo, en pantalla la esquina
     daba la mitad de inset a cada profundidad (8→6.3 contra 11.1); con
     30 continuo mide como un círculo de 30 (8.7→8.7, 20.7→1.7). */
  radio: 33,
} as const

export const TEXTO = {
  /* RUNTIME · cap height de las H de "Hold to Commit" y "Hard Mode":
     33 y 32 px = 12.2 y 11.8 pt → 17.3 y 16.8 → 17. La S de "Selected"
     y la O de "On these days" dan lo mismo. */
  cuerpo: 17,

  /* LOS VALORES GRISES SON 17 SALVO LA HORA. Medido en pantalla contra
     el clip con el mismo umbral: "Everyday" a 15 daba 58.0 contra 65.0
     del clip (×17/15 = 65.7 ✓), "5 Apps" 45.0 contra 50.2 (×17/15 = 51),
     "No unblocks allowed" a 17 da 153.7 contra 151. Pero "10:00 PM" a 15
     daba 60.3 contra 63.1: ×16/15 = 64.3 ✓ y ×17/15 = 68.3 ✗. La hora es
     de 16, el resto de 17. Las alturas de cap de los grises (31 px) son
     un píxel menos que las de los blancos por el umbral sobre tinta más
     apagada, no por el tamaño. */
  valor: 17,
  hora: 16,

  /* RUNTIME · "PRO": cap 970..990 = 21 px = 7.75 pt → 11 pt. Y mide
     22.5 pt de ancho, ~1 pt más que "PRO" en 11 bold pelado: hay medio
     punto de tracking. */
  badge: 11,
  badgeTracking: 0.5,

  /* PESOS, por el ancho del asta normalizado (suma de tinta / 2.709):
       "No unblocks allowed" N   1.35 pt   regular   (0.078 × 17 = 1.33)
       "10:00 PM" '1'           1.30 pt   regular
       "Hard Mode" H            1.91 pt   semibold  (0.111 × 17 = 1.89)
       "To" T                   1.89 pt   semibold
       "Selected Apps" l        1.9–2.0   semibold
       "Keep Holding..." K      ~2.0 pt   semibold
       "Hold to Commit" H       2.16 pt   ?
       "Apps are blocked" b, l  2.2–2.5   bold
       "Committed" C, t         2.0–2.1   bold (se ve más pesado que
                                          "Keep Holding..." en las tiras)
     El H del botón cae entre semibold y bold; se decidió por la tira
     ampliada, donde "Hold to Commit" y "Keep Holding..." pesan igual. */
  pesoLabel: '600',
  pesoSeccion: '700',
  pesoBoton: '600',
  /* RUNTIME · "Committed" mide 86.7 pt de tinta en el clip; SF a 17 da
     ~87.2 en semibold y ~89.7 en bold (medido con el mismo SF en
     `media/generar.swift`). Es SEMIBOLD: se veía más pesado en las tiras
     porque "Keep Holding..." está achicado por el press y "Committed"
     ya volvió a escala 1. */
  pesoCommitted: '600',
  pesoValor: '400',
  /* SOURCE · el techo de Dynamic Type del label del botón
     (`maxFontSizeMultiplier`, y la escala de las copias borrosas y del
     tilde). El pill mide 52 pt y no crece —sus texturas son de 52— así
     que el texto sigue al ajuste del sistema hasta donde entra. La caja
     de línea de SF 17 semibold es 20.3 pt: a ×1.786 —AccessibilityMedium,
     la primera talla de accesibilidad, el multiplicador que RN le asigna
     en `RCTAccessibilityManager.mm:267`— da 36.3 pt y quedan 7.9 pt de
     aire arriba y abajo; a ×2.143 (AccessibilityLarge) quedan 4.2 y el
     texto toca el borde de la cápsula. "Keep Holding..." a ×1.786 son 212 pt de
     tinta en un pill de 382. Pedido del 2026-09-04 (animate-expo § 9:
     el texto escala). */
  escalaMaxima: 1.786,
} as const

export const SIMBOLO = {
  /* RUNTIME · el ícono del header es `lock.shield.fill` (un escudo con el
     candado calado), no un candado: se ve en la ampliación. Tinta 39×45
     px = 14.4×16.6 pt → a 18: caja 19×21, tinta 14×17.75 desde x=2.25. */
  candado: { nombre: 'lock.shield.fill', caja: { ancho: 19, alto: 21 } },
  /* SUPUESTO · el header de arriba, que el clip no muestra: `clock.fill`
     a 18 (caja 22×22). */
  reloj: { nombre: 'clock.fill', caja: { ancho: 22, alto: 22 } },
  /* SUPUESTO · la flecha de volver: `chevron.left` a 20 (caja 16×21). */
  volver: { nombre: 'chevron.left', caja: { ancho: 16, alto: 21 } },
  /* EL `size` DE SymbolView NO ES EL TAMAÑO DEL GLIFO. SOURCE: en
     `expo-symbols@57.0.2`, `ios/SymbolView.swift:127` arma la
     configuración con `pointSize: UIFont.systemFontSize` (14 en iOS),
     siempre; el glifo se rasteriza a 14 pt y después el `contentMode`
     lo escala a la CAJA de la vista. Con `resizeMode: 'center'` no se
     escala nada: todos los símbolos salían a 14 pt (escudo 11.3×13.3 en
     vez de 14×17.75; chevron 7×12 en vez de 8.75×15; medido en pantalla
     el 2026-09-02 antes de leer el Swift).

     Así que acá cada símbolo lleva su CAJA NATURAL al tamaño que se
     quiere —la que `NSImage(systemSymbolName:)` da para ese pointSize,
     impresa por `media/generar.swift`— y el `scaleAspectFit` por defecto
     lo lleva ahí. La tinta queda proporcional a la caja: `tinta` y
     `desdeX` dicen dónde cae dentro, para posicionarla al píxel. Y
     `scale: 'large'` rasteriza más grande, así el escalado es hacia
     abajo y no se ve blando. */
  /* RUNTIME · `chevron.right` de "5 Apps": tinta 22×37 px = 8×13.7 pt →
     el chevron de 17 semibold: caja 13×18, tinta 8.75×15 desde x=3.25. */
  chevron: { nombre: 'chevron.right', caja: { ancho: 13, alto: 18 }, desdeDerecha: 1.7 },
  /* RUNTIME · el stepper de la hora es `chevron.up.chevron.down`: tinta
     30×42 px = 11×15.5 pt → a 17: caja 16×21, tinta 12×17.25 desde x=2. */
  stepper: { nombre: 'chevron.up.chevron.down', caja: { ancho: 16, alto: 21 }, desdeDerecha: 2 },
  /* RUNTIME · el rayo del badge: 16×24 px = 6×9 pt de tinta. A 11 bold
     la tinta natural es 8.25×12.75 — grande; a 8 da 6×9.3 en una caja
     de 8.7×11.6, desde x=1.1. */
  rayo: { nombre: 'bolt.fill', caja: { ancho: 8.7, alto: 11.6 } },
  /* RUNTIME · la tilde de "Committed": 38×39 px = 14×14.4 pt de tinta,
     trazo de 9 px = 3.3 pt (el video engorda ~0.7) — más grueso que las
     astas del texto (2.1). `checkmark` heavy a 15 pt tinta 14.1×13.2 con
     trazo ~2.6: caja 18×17 (la imprime generar.swift), tinta desde x≈2. A 17 heavy la tinta
     era 16×15, un 14 % grande. */
  tilde: { nombre: 'checkmark', peso: 'heavy', tamano: 15, caja: { ancho: 18, alto: 17 },
    /* SUPUESTO · en Android no hay SF Symbols: `expo-symbols` dibuja
       Material Symbols (fuente `@expo-google-fonts/material-symbols`)
       si el nombre viene como objeto; sin objeto no dibuja NADA
       (SOURCE: `expo-symbols/src/SymbolView.tsx:32`, `props.fallback`).
       El equivalente del checkmark pesado es `check` en 700. */
    android: 'check' },
} as const

export const HUECO = {
  /* RUNTIME · de la tinta de "5 Apps" a la del chevron: 44 px = 16 pt;
     de "10:00 PM" al stepper 33 px = 12.2. Con un hueco de layout de 12
     los textos terminaban 5 pt antes que en el clip (372 y 369.3 contra
     377 y 374.3, medido en pantalla): la caja del Text de RN cierra ~2 pt
     después de la tinta y la del símbolo abre 2–3 antes. Queda 7. */
  valorAIcono: 7,
  /* RUNTIME · "Everyday", que no tiene ícono, terminaba en 393 contra
     396.8 del clip con el mismo padding: la caja del Text lleva ~4 pt de
     cola después de la y. Se compensa en el valor suelto. */
  colaValor: 4,
  /* RUNTIME · de la tinta del escudo a la de "Apps are blocked": 36 px =
     13.3 pt; con los bearings queda un hueco de 10 (11 daba 67.5 de
     posición de la A contra 66 del clip). */
  iconoATexto: 10,
  /* RUNTIME · la tinta del escudo arranca a 38.8 pt del borde de la
     pantalla: 2 pt MÁS AFUERA que la línea del texto de las cards (41).
     El header no comparte el padding de las cards. */
  insetCabecera: 16,
  /* RUNTIME · de "Hard Mode" al badge: 24 px = 8.9 pt → 8 + bearing. */
  labelABadge: 8,
  /* RUNTIME · el texto de "On these days" termina 34.5 px = 12.7 pt
     arriba de los círculos (línea de 20.3 con descent 4.1). */
  textoACirculos: 13,
} as const

export const SECCION = {
  /* DERIVADO · la card de los días termina en 538 y "Apps are blocked"
     tiene su cap en 641..673: la caja de línea (20.3) arranca 91.5 px =
     33.8 pt después de la card y termina 35.5 px = 13.1 pt antes de la
     siguiente. */
  arriba: 34,
  abajo: 13,
  /* RUNTIME · de la última card al pill: 1126→1213 = 87 px = 32.1 pt. */
  alPill: 32,
} as const

export const DIAS = {
  /* RUNTIME · cada círculo mide 118 px = 43.6 pt, en las dos direcciones. */
  diametro: 44,
  /* RUNTIME · el paso entre centros es 141.7 px = 52.3 pt → hueco de 8. */
  hueco: 8,
  letras: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
} as const

export const TOGGLE = {
  /* RUNTIME · NO es un UISwitch (51×31): el track mide 174×72 px =
     64×26.6 pt y la perilla es una CÁPSULA apaisada de 102×66 px =
     37.6×24.4 pt, metida 1.5–2 pt. Umbral 50 sobre un track de 73. */
  ancho: 64,
  alto: 27,
  knobAncho: 38,
  knobAlto: 24,
  inset: 1.5,
  /* RUNTIME · el borde derecho del track queda a (1218−1166)/2.709 =
     19.2 pt del borde de la card, 4 pt más afuera que los valores (23). */
  correccionDerecha: -4,
} as const

export const BADGE = {
  /* RUNTIME · cápsula de 121×55 px = 44.7×20.3 pt; borde de 3–4 px. El
     ancho no se fija: sale de 1.5 + 4 + 6 + 5 + 22.1 ("PRO") + 4 + 1.5 =
     44.1. Con un minWidth de 45 y padding 6 medía 52.3 en pantalla. */
  alto: 20,
  borde: 1.5,
  /* RUNTIME · la tinta del rayo arranca a 143.2 con el borde en 137.7:
     5.5 = 1.5 de borde + 3 + 1.1 de aire propio del glifo. "PRO" termina
     en 176.1 con el borde en 182: 5.9 = 1.5 + 2.2 + ~2 de bearing de la
     O (en pantalla, con 3.5 el borde caía en 183.3). Entre
     el rayo (149) y la P (154) hay 5 de tinta a tinta: 1.6 de aire del
     glifo + 3 + ~1 de bearing. */
  paddingIzquierdo: 3,
  paddingDerecho: 2.2,
  entreRayoYTexto: 3,
} as const

export const LINEA_TIEMPO = {
  /* RUNTIME · el círculo hueco de "To": 22 px = 8 pt de diámetro, anillo
     de ~4 px = 1.5 pt, centro a (201.5−135)/2.709 = 24.5 pt del borde de
     la card. La tinta de "To" arranca a 45.8 pt. */
  circulo: 8,
  anillo: 1.5,
  columna: 8,
  /* DERIVADO · 45.8 − 24.5 − 4 (radio) − 1.3 (bearing de la T) ≈ 16. */
  aTexto: 16,
  /* RUNTIME · la línea punteada: 3 px = 1 pt de ancho; rayas de 12–14 px
     (5 pt) con huecos de 6–8 px (2.5 pt). */
  grosor: 1,
  raya: 5,
  huecoRaya: 2.5,
  /* SUPUESTO · el paso entre "From" y "To": el clip sólo muestra ≥40 pt
     de línea por encima del círculo de "To". 56 deja un conector de
     ~48 pt, que da los seis tramos y medio que se ven. La fila MIDE el
     paso entero y la card no agrega padding: 2×56 = 112, con la línea
     centrada quedan los 17.8 pt de "To" al borde que están medidos. */
  pasoFila: 56,
} as const

export const DERRAME = {
  /* RUNTIME · debajo del pill hay una luz tenue, y SÓLO debajo (a los
     costados y arriba el fondo sigue en 20): +7 de luminancia parejos
     hasta ~12 pt, +4 a 18, +3 a 21. Y no ocupa todo el ancho: en la fila
     6.6 pt bajo el borde va de ~118 a ~340 pt del pill (x 400..1000 del
     clip), o sea ~220 pt centrados. Es el resto del brillo que se escapa
     por abajo, y sigue ahí con el pill terminado (28,28,28: neutro).
     Se hace con una franja blanca al 3.3 % (7/215) que asoma bajo el pill
     y una sombra corta que la desvanece. */
  ancho: 220,
  asoma: 18,
  color: 'rgba(255,255,255,0.033)',
  sombra: '0 0 10px 0 rgba(255,255,255,0.033)',
} as const

export const FRENTE = {
  /* RUNTIME · la caída del frente: σ = 19 pt (51 pt del 90 % al 10 % en
     f151), centrada en el borde geométrico. La textura arranca 83 pt
     antes de ese borde (3σ más el radio de la punta) y termina 57
     después. El cuerpo se acorta esos 83 pt: el recibo completo está
     arriba de `frente.png` en `media/generar.swift`. */
  antes: 83,
  despues: 57,
  /* EL FRENTE NO VA DE PUNTA A PUNTA. RUNTIME (2026-09-03, `evolucion.py`,
     el 50 % del frente en la fila a 10 pt del borde, cada 100 ms): 55 →
     69 → 88 → 105 → 122 → 141 → 158 → 176 → 195 → 212 → 229 → 244 → 263 →
     281 → 298 → 317 → 330 → 349 → 357 pt (f76…f181): 174 pt/s, no los
     191 de punta a punta en 2 s, y en f181 (el último cuadro antes de la
     ráfaga) queda en 357 = 93.5 % del ancho, con la punta derecha todavía
     a 124 de luminancia. Extrapolado al press, arranca 11 pt adentro.
     Así que el borde geométrico va del 4.5 % al 95.5 % del ancho:
     arranque .045 (con .03 el 50 % salía 1.5 % atrás del clip en los
     seis progresos medidos), recorrido .91. Lo que falta lo cubre el
     blanqueo del commit. */
  arranque: 0.045,
  recorrido: 0.91,
  /* RUNTIME · el frente es más angosto al principio y se ensancha: del
     90 % al 10 % mide 51–53 pt entre p .17 y .42, 55 a .52, 58–60 a
     .72–.82 y 62–64 de .87 en adelante (misma fila y umbral que en
     captura; el umbral del 10 % cae sobre el brillo de reposo, así que
     los dos anchos vienen inflados igual, ~12 pt). Una escala en x de la
     textura alrededor del borde geométrico. Con .8 + .22·p la captura
     seguía 10 pt más ancha a p .5; medido que el ancho sigue a la escala
     linealmente (65.5 pt a .91, 45.5 a .66), queda .66 + .36·p: 50 pt a
     p .23 (clip 51), 60 a .5 (55), 62 a .74 (59), 56 a .99 (55–62). */
  escala: { desde: 0.66, hasta: 1.02 },
} as const

/* Dónde está el borde geométrico del relleno para un progreso p, en pt
   desde la punta izquierda. Lo usan el relleno y las chispas, que nacen
   delante de él. Es un worklet: corre en el hilo de UI. */
export const frenteEn = (p: number, ancho: number) => {
  'worklet'
  return ancho * (FRENTE.arranque + FRENTE.recorrido * p)
}

export const VELO = {
  /* RUNTIME · la punta izquierda del blob se oscurece y se ensancha a
     medida que el frente se aleja (recibo completo arriba de `velo.png`
     en generar.swift): la textura es la del final del hold, y se escala
     en x desde la punta con s(p) = .25 + .75·p. */
  escala: { desde: 0.25, hasta: 1 },
} as const

export const PILL = {
  /* RUNTIME · 1035 px de ancho = 382 pt (= 440 − 2×29); 140 px de alto
     (1213..1352) = 51.7 pt. El borde izquierdo a distintas alturas cae
     EXACTO en un círculo de radio = alto/2: es una cápsula circular, no
     continua. */
  alto: 52,
  /* DERIVADO · el borde inferior del pill queda 112 px = 41.4 pt arriba
     del borde de la pantalla, que se ubicó por la esquina del bisel
     (cae en y≈1465 del recorte con la esquina de 62 pt del 17 Pro Max).
     Con 34 de safe area quedan 7.4; en pantalla, 8 da 42.7 y 7 da 41.7. */
  sobreSafeArea: 7,
} as const

export const LABEL = {
  /* Los textos de Opal eran 'Hold to Commit' / 'Keep Holding...' /
     'Committed' (semibold 17, medido por ancho de tinta). El 2026-09-04
     Vito pidió que el botón sea para comprar, con un fondo de app
     financiera: cambian las palabras, no la fuente ni el peso. Las copias
     borrosas se regeneran con `media/generar.swift`. */
  reposo: 'Hold to Buy',
  sosteniendo: 'Keep Holding...',
  listo: 'Order Placed',
  /* RUNTIME · de la tinta de la tilde a la C: 33 px = 12 pt. La caja de
     la tilde deja 1.7 de aire a la derecha de su tinta y la C tiene ~1
     de bearing: 12 − 1.7 − 1 ≈ 9. `media/generar.swift` usa el MISMO
     hueco para la copia borrosa. */
  tildeATexto: 9,
  /* RUNTIME · CUÁNTO SE CORRE "✓ Order Placed" PARA QUE EL OJO LO VEA
     CENTRADO, en pt. Con la fila centrada como caja, medido sobre el
     cuadro del commit (tinta por columna sobre el pill blanco, Δ contra
     el centro del pill): la caja cae en +0.83, pero el TEXTO queda en
     +13.67 y el centroide de tinta en +6.60. La corrección es ese Δ del
     centroide anulado, y con ella el centro de masa cae en el centro
     (verificado: Δ −0.06). Se probó también centrar el texto (−13.7,
     Δ 0.00) y se descartó: el tilde queda colgando al margen.

     Lo pide better-ui ("when geometric centering looks off, align
     optically; buttons with icons need a manual nudge"), y NO lo hace la
     referencia: en el clip los mismos tres números dan +0.74 / +13.84 /
     +8.35, o sea que Opal tampoco lo corrige y lo reprodujimos con 0.2
     pt de diferencia. Sólo mueve al label que tiene tilde: los otros dos
     no tienen ícono y ya están centrados. `optico.py`. */
  correccionOptica: -6.6,
} as const

/* ═══ EL GESTO Y EL RELLENO — el corazón de la pieza ═══ */
export const HOLD = {
  /* RUNTIME · el frente del blob avanza LINEAL: 7.75 px/cuadro de f75 a
     f181 (8.15 → 7.7 → 7.5 en tres tramos: una deceleración del 5 %, del
     orden del ruido del umbral sobre un degradé). Del press (f62) a la
     ráfaga de partículas (f183) van 121 cuadros = 2.02 s. Y la posición
     del frente al 50 % cierra con un borde geométrico que va de punta a
     punta en 2.0 s más un blur de σ=13 pt que lo atrasa.
     PEDIDO (2026-09-07): primero "que tarde 1500 ms en total" y después
     "reducí el tiempo a 1 s". Lo medido son 2000; con 1000 el frente va
     a 348 pt/s en vez de 174 y todo lo que es función del progreso
     —chispas, detentes hápticos, color del label— se comprime solo,
     porque lee este número. Para volver a lo fiel: 2000. */
  duracion: 1000,

  /* SUPUESTO · cuánto puede correrse el dedo sin cancelar. 10 es el
     default de LongPress y se siente estricto en un botón de 52 pt. */
  maxDistancia: 24,

  /* AL SOLTAR EL RELLENO SE APAGA MÁS DE LO QUE RETROCEDE. RUNTIME
     (release en f13, fila a 10 pt del borde, `perfil.py`): el pico cae
     172 → 145 → 117 → 93 → 76 → 66 → 54 → 48 en f13–f20 (una exponencial
     de τ ≈ 80 ms, con cola hasta ~200 ms) mientras el 50 % del frente
     apenas retrocede: 13.5 → 12.5 → 12 → 11.5 → 11 → 9.5 → 9.5 → 9.5 %
     del ancho. Con 180 ms y el bezier fuerte, en captura el frente ya
     estaba al 3.5 % a los 83 ms donde el clip lo tiene al 9.5: era 2.5×
     más rápido. Un ease-out cuadrático de 400 ms da 12.4 / 10.4 / 8.5 %
     a 17 / 50 / 83 ms. El fundido ES una exponencial: sobre el fondo,
     el pico queda en .81 / .61 / .44 / .32 / .25 / .17 / .13 a 17 / 33 /
     50 / 67 / 83 / 100 / 125 ms → τ = 60 ms (con ease-out cuadrático de
     220 la captura daba .72 / .59 / .49 / .43 / .36 / .27: cola larga).
     `Easing.out(Easing.exp)` es 1 − 2^(−10t): con 420 ms es exactamente
     e^(−t/60) — .75 / .58 / .43 / .33 / .25 / .19 / .12. La lectura
     vieja ("30 px/cuadro, 4× la ida") seguía un umbral fijo de
     luminancia, que corre rápido cuando lo que cae es el pico. */
  retirada: 400,
  fundidoRetirada: 420,

  /* RUNTIME · el blob nace apagado: el pico sube 45→217 entre f63 y
     f83 (20 cuadros = 333 ms) mientras el frente ya avanza. */
  encendido: 330,
  /* RUNTIME · y arranca LENTO: el pico a 10 pt del borde, sobre el fondo
     de 45, va 0 → 2 → 15 → 31 → 48 → 118 → 182 en 42 / 58 / 75 / 108 /
     142 / 208 / 308 ms (f64…f80) — 8 / 17 / 26 / 65 / 100 % a 75 / 108 /
     142 / 208 / 308 ms. Un ease-out sobre 300 daba 44 / 60 / 73 / 91 /
     100 y en captura el pico salía 50 % más fuerte a los 75 ms y 25 %
     más débil a los 300; un ease-in-out cuadrático sobre 330 da 10 / 21 /
     37 / 73 / 99 y en captura el pico queda a ±7 del clip en los ocho
     instantes (`perfil.py`, p25…p308). La curva es EASE_IN_OUT en el
     botón. */

  /* RUNTIME · el label cambia de color en dos escalones, medidos con el
     mínimo de luminancia en la zona "Ke" (ya blanca desde f118):
       f128 253 → f133 134 → f138 79 → f146 47 → meseta en 45 hasta f177
       f178 26 → f181 23 (un salto de un cuadro)
     En progreso (t = (f−62)/120): el primero va de .55 a .70 con forma
     ease-out (la mitad del camino a los 5 cuadros); el segundo es un
     escalón en .965. */
  tintaDesde: 0.55,
  tintaHasta: 0.7,
  negroEn: 0.965,
} as const

export const PRESS = {
  /* RUNTIME · el pill se ACHICA al apretar: el borde izquierdo va de 157
     a 182–183 y el derecho de 1194 a 1169 → 986/1035 = 0.953, uniforme
     (arriba baja 3 px, lo que da escalar sobre el centro). */
  escala: 0.953,
  /* RUNTIME · la escala baja en 14 cuadros (f62→f76: 158, 162, 164, 168,
     171, 173, 175, 177, 178, 179, 180, 181, 181, 182): ease-out, ~233 ms.
     Al soltar vuelve en 15 (f13→f28), la misma curva. */
  duracion: 250,
  /* RUNTIME · al completar la escala vuelve en ~13 cuadros, no en 6: el
     ancho del pill (2026-09-03, `pill_clip` cuadro a cuadro) va 364 →
     369.1 → 369.5 → 371 → 373.9 → 376.2 → 378 → … → 378.7 → 380.2 →
     381 → 381.7 de f182 a f195: 29 % en el primer cuadro, 55 % a los 67
     ms, 78 % a los 100, 90 % a los 183, 98 % a los 217. Un salto del 25 %
     en un cuadro y de ahí un ease-out cuadrático de 220 ms: 56 / 71 / 90
     / 98 % a 67 / 100 / 150 / 217 ms. Sin rebote (381.7 en f195, nunca
     pasa de 382). La lectura vieja ("52 % en el primero, 96 % en el
     sexto") era de un umbral de borde que la ráfaga contamina. */
  duracionCommit: 220,
  saltoCommit: 0.25,
} as const

export const CRUCE = {
  /* EL CRUCE NO ES SIMÉTRICO: el label que se va desaparece rápido y el
     que llega enfoca con cola larga. Cada label tiene su PRESENCIA (0..1);
     cruzar es llevar la del entrante a 1 y la del saliente a 0, cada una
     con su duración y su retardo (ms). Las opacidades de las capas
     nítida/borrosas salen de la presencia (la escalera está en
     `etiqueta.tsx`), así un cruce interrumpido a mitad de camino sigue
     desde donde está, sin espejo ni salto.

     RUNTIME · press (f62): la integral del asta de la "i" de Commit (el
     saliente) cae 2255 → 1503 → 818 → 370 → 66 → 0 de f61 a f66: se va
     en 4 cuadros (67 ms), 67 / 36 / 16 / 3 % — un ease-out. La "i" de
     Holding (el entrante) ya está a los 33 ms, borrosa; legible a los
     67; al 90 % a los 133; y su pico sigue subiendo hasta ~f85 (380 ms):
     el enfoque tiene cola. Los 48 de salida (contra 67 medidos) son
     porque la escalera sólo desenfoca en la última mitad de la
     presencia: con 70, a los 25 ms el saliente seguía casi nítido y al
     84 % donde el clip (f63) ya lo tiene desparramado al 50 % (captura
     `cruce=25` contra f63); con 48 llega a ese punto en q = .23. */
  press: { entrada: 360, salida: 48, retardoEntrada: 0, retardoSalida: 0 },
  /* RUNTIME · suelta (release en f13): el saliente empieza en f17–18
     (80 ms) y cae rápido hasta el 48 % en f22 (158 ms), y de ahí se
     queda: 45 / 44 / 44 % en f23–f25, y en la tira de f26 (217 ms)
     todavía se ve, desparramado, debajo del Hold que entra. Un ease-out
     de 250 ms desde los 80 hace las dos cosas: 48 % a los 158 y 20 % a
     los 217 (con 130 ya no quedaba nada a los 210, y el label tenía un
     hueco vacío entre los dos textos). El entrante arranca en f22 (150 ms
     después del release) y sube DESPACIO: la integral del asta de la "i"
     de Hold da 46 % en f29, 64 % en f32, 76 % en f34, 91 % en f38 (130 /
     180 / 220 / 270 ms de entrada). Con la escalera, que prende la
     opacidad en el primer 40 % de la presencia, eso es una presencia
     LINEAL de 600 ms: 60 % a los 130, 98 % a los 220, nítido al 80 % a
     los 270, y la cola del halo hasta los 600 (captura `cruce-suelta`
     contra f22–f38; con 300 ease-out el Hold ya estaba nítido a los
     217 ms donde el clip lo tiene desparramado). */
  suelta: { entrada: 600, salida: 250, retardoEntrada: 150, retardoSalida: 80, entradaLineal: true },
  /* RUNTIME · commit (ráfaga en f183): el píxel más oscuro de la banda se
     aclara de f186 a f194 (el saliente: desde 50 ms, 133 ms) y vuelve a
     oscurecer de f195 a f211 (el entrante: desde 200 ms, 270 ms, 50 % en
     f201); la nitidez (gradiente medio) toca fondo en f197 y sube hasta
     f213. En captura contra f186–f197, el saliente con 150 ms desde los
     50 ya no estaba a los 190 ms donde el clip todavía lo muestra al
     50 %, y a los 242 el clip lo tiene al 35 %: queda 280 desde los 40.
     La ENTRADA ES LINEAL, no ease-out: el "✓ Committed" del clip está
     todavía borroso a los 308 ms (f201) y casi nítido a los 392 (f206);
     con ease-out sobre 450 ya estaba nítido a los 308. Lineal, la
     escalera enfoca entre los 100 y los 200 ms de la entrada (310–410
     después de la ráfaga) y la cola cierra a los 660. */
  commit: { entrada: 450, salida: 280, retardoEntrada: 210, retardoSalida: 40, entradaLineal: true },
  /* SUPUESTO · el reinicio del taller: el clip no lo muestra. La salida
     de "✓ Order Placed" va junto con el fundido del pill (fase 1) y la
     entrada de "Hold to Buy" después, sola (fase 2): ver `reiniciar`. */
  reinicio: { entrada: 300, salida: 250, retardoEntrada: 0, retardoSalida: 0 },
  /* RUNTIME · en las tiras ampliadas los dos textos se DESENFOCAN y se
     cruzan por opacidad, centrados, sin escala ni desplazamiento: es el
     `.blurReplace` de SwiftUI. El desenfoque pico deja las astas de
     ~2 pt en ~3.5 y las letras apenas legibles: σ ≈ 2.5 pt. El nivel
     angosto (1.0) es el escalón intermedio del enfoque: no se lee como
     valor en el clip, se lee como continuidad (con un solo nivel el
     cruce era nítido → fantasma → nítido, un salto de foco). */
  blur: { ancho: 2.5, angosto: 1.0 },
} as const

export const COMMIT = {
  /* RUNTIME · la punta izquierda pasa de 90 a 233 de luminancia entre
     f183 y f205: 22 cuadros = 366 ms — parte es la escala volviendo, el
     resto es el pill terminando de blanquear. */
  blanqueo: 330,
  /* RUNTIME · el pill terminado NO es blanco parejo: las filas de arriba
     dan (245,250,248) y el centro 254. Con el velo blanco al 75 % sobre
     el blob (que tiene un rim verde pálido), el centro queda 255 y el
     rim (218×.25 + 255×.75) = 246 — las dos lecturas a la vez. */
  veloBlanco: 0.75,
  /* RUNTIME · después de la ráfaga el frente SIGUE hasta la punta
     derecha mientras el pill blanquea: el 50 % del frente (fila a 10 pt)
     va 93.5 (f181) → 95.5 (f186) → 98.5 % (f190), y la punta derecha
     termina en 246 (f230) contra 239 en captura con el frente clavado en
     95.5 %. Un deslizamiento del progreso a 1.06 (el borde geométrico
     al 101 %), con 250 ms de retardo y 400 de ease-out, deja el final
     igual sin adelantar la punta derecha antes de tiempo (a 58 ms ya
     salía 24 más clara que el clip; con el deslizamiento temprano era
     peor). */
  desliz: 0.06,
  deslizRetardo: 250,
  deslizDuracion: 400,
  /* SUPUESTO · pedido de Vito (2026-09-03): "✓ Committed" aparece más
     chico, desde el fondo, y crece hasta su tamaño mientras enfoca — el
     `.blurReplace(.downUp)` de SwiftUI, lo que haría una marca seria. El
     clip NO lo hace (medido: centrado, sin escala); con 1 acá vuelve lo
     fiel. La escala sigue a la presencia del label, que entra con
     ease-out: crece rápido y se asienta despacio. */
  escalaEntrada: 0.9,
} as const

/* SUPUESTO · el reinicio del taller: el clip no muestra qué pasa después
   de "✓ Committed". A los 5 s el botón vuelve al reposo (pedido del
   2026-09-02, para probar seguido). Desde el 2026-09-04 es un FUNDIDO de
   opacidad, sin barrido: el velo blanco y el relleno se apagan en
   `fundido` ms con ease-out y recién después entra el label de reposo. */
export const REINICIO = {
  espera: 5000,
  fundido: 400,
} as const

export const PARTICULAS = {
  /* RUNTIME · 21 arriba + 22 abajo en f183–f187, todas de golpe (no hay
     escalonado: en f183 ya están las 43), y salen de TODO el perímetro:
     hay pistas que nacen en x = −0.9 y 383.7 pt, o sea en los arcos de
     las puntas (`rastro.py`, 58 pistas de ≥4 cuadros). 23 por lado. */
  cantidad: 46,
  /* RUNTIME · el centro de cada punto nace a 2.0–2.6 pt del borde de la
     cápsula (d0 de las pistas, mediana 2.2). */
  desdeElBorde: 2.2,
  /* RUNTIME · el viaje hacia afuera (Δdist al final de cada pista): p10
     1.5–2.3 pt, mediana 7.6–8.7, p90 14–17. No es parejo: la mayoría se
     queda cerca y unas pocas llegan lejos — un uniforme elevado a 1.5
     entre 2 y 17 da mediana 7.3, p10 2.5, p90 14.8. */
  viaje: { min: 2, max: 17, sesgo: 1.5 },
  /* RUNTIME · LA NUBE SE INFLA DESDE EL CENTRO, no tiembla: el
     desplazamiento lateral final de cada partícula es proporcional a su
     distancia al centro del pill, dx ≈ 0.075 × (x₀ − 191): −18.7 y −17.5
     en la punta izquierda, +14.3 en la derecha, ~0 en el medio, con ±5
     de ruido. Es lo que hace "limpia" la ráfaga de la referencia: todas
     se abren en la misma dirección. Antes había ±3 al azar sin
     correlación con la posición. */
  expansion: 0.075,
  ruidoLateral: 4,
  /* RUNTIME · el viaje mediano avanza 22 / 40 / 54 / 66 / 71 / 81 / 95 %
     a 67 / 100 / 133 / 167 / 200 / 233 / 300 ms, y el desplazamiento
     lateral satura junto con él (~5 pt a los 220–300 ms): un ease-out
     cuadrático de ~400 ms para las dos componentes, con algo de
     dispersión por partícula. */
  duracionViaje: { min: 350, max: 550 },
  /* RUNTIME · el pico mediano sobre el fondo cae 154 → 114 → 84 → 79 →
     68 → 60 → 50 → 45 entre k=4 y k=40 cuadros (67 ms → 667 ms): τ ≈ 330
     ms al principio y más lento después; en el clip viven ~1.2 s.
     SUPUESTO · Vito (2026-09-03): "que desaparezcan un toque antes" que
     el "✓ Committed" — viven 700 ms con τ 260 y un apagado suave desde
     el 40 % de la vida (280 ms), así cuando emerge el texto nítido
     (~370 ms después de la ráfaga) están al 30 % y a los 500 ms al 10 %. */
  duracionVida: 700,
  tau: 330,
  apagadoDesde: 0.4,
  /* RUNTIME · en captura a los 120 ms (rafaga=0.17) los puntos salían
     grises donde el clip (f190) los tiene blancos: el brillo propio no
     baja de .75, y el τ es el del primer tramo del clip (330), no el de
     la cola. */
  brillo: { min: 0.75, max: 1 },
  brilloMaximo: 1,
  /* RUNTIME · el área sobre umbral pasa de 31 a 9 px² entre k=4 y k=35,
     pero eso es el umbral sobre un punto que se apaga, no un punto que se
     achica: apenas un 20 % de escala para que no parezcan pegados. */
  escalaFinal: 0.8,
  /* RUNTIME · diámetros de 1.6 a 10.7 px = 0.6–4 pt, mediana 2.6. Con
     1.5–4 parejo, una captura sin pérdida del taller da mediana 2.8 y
     máximo 4.0 medidos con el mismo umbral que el clip (2.7 / 4.0).
     OJO: la grabación de simctl los mostraba como polvo gris y llevó a
     agrandarlos a 2–4.5 con sesgo a los grandes — eso daba mediana 4.2 y
     cuatro veces más píxeles blancos que el clip. El video comprime los
     puntos chicos; la medida vale sólo sobre captura. */
  diametro: { min: 1.5, max: 4, sesgo: 1.4 },
  /* RUNTIME · los colores más brillantes: blanco puro, (239,251,247),
     (244,244,244), (225,230,212), (217,227,197) verde pálido, (187,225,214)
     teal. La luminancia media de los puntos en el clip es 153 en el
     primer cuadro: no son todos blancos. */
  colores: ['#FFFFFF', '#FFFFFF', '#EFFBF7', '#F2F2F2', '#E1E6D4', '#D9E3C5', '#BBE1D6'],
  /* RUNTIME · a lo largo del perímetro, de punta a punta (x₀ de −0.9 a
     383.7 pt), a paso parejo de 10–17 pt con ruido. */
  desde: 0,
  hasta: 1,
} as const

/* LAS CHISPAS — los puntos de luz que viajan ADENTRO del pill durante el
   hold, delante del frente. RUNTIME (clip f64–f182, `chispas.py` y
   `chispas2.py`: 24 pistas de ≥3 cuadros, con el texto excluido de la
   detección, así que son menos de las que hay): */
export const CHISPAS = {
  /* RUNTIME · 3 vivas a la vez (mediana), máximo 7; 0.2 nacimientos por
     cuadro detectados. 12 vistas con 3 vidas cada una son 36 nacimientos
     en los 2 s — con las que la detección se pierde detrás del texto. Las
     vidas de una misma vista van separadas 620 ms de progreso, más que la
     vida más larga: nunca se pisan. */
  vistas: 12,
  vidasPorVista: 3,
  /* RUNTIME · nacen delante del frente geométrico: mediana +21 pt, p90
     +64, y hay dos que nacen a +96 y +126 (se ven en f122 como puntos
     sueltos en la zona oscura). Un uniforme elevado a 2.5 entre 8 y 100
     da mediana 24, p90 79. Unas pocas aparecen detrás (+22..+29 de
     luminancia sobre un fondo de 190: casi invisibles). */
  adelante: { min: 8, max: 100, sesgo: 2.5 },
  /* RUNTIME · en y están repartidas por todo el alto: 5.4 a 45.9 pt. */
  y: { min: 5, max: 47 },
  /* RUNTIME · viajan hacia la derecha, en el sentido del frente pero más
     lento: 1.65–2.5 pt/cuadro las brillantes (mediana 1.86) contra 3.18
     del frente → 0.5–0.75 de su velocidad. El frente las alcanza y las
     absorbe: un blanco al 30 % sobre blanco no se ve. */
  velocidad: { min: 0.5, max: 0.75 },
  /* RUNTIME · vida mediana 12 cuadros, p90 19; las brillantes 13–28
     (220–470 ms). */
  vida: { min: 250, max: 450 },
  /* RUNTIME · deriva en y: mediana −0.03 pt/cuadro, p10 −0.56 → de 0 a
     unos −30 pt/s, siempre hacia arriba o quietas. */
  derivaY: { min: -25, max: 0 },
  /* RUNTIME · tinta de 1.5–2 pt (área 8–24 px², mediana 16 = 4.5 px de
     diámetro a 2.709 px/pt) y sin borde duro. La textura `chispa` es
     una gaussiana de σ 1.4 pt en una caja de 8 pt; escalada a 0.5–0.7
     deja la tinta visible en ~1.5–2.2 pt. */
  caja: 8,
  escala: { min: 0.5, max: 0.7 },
  /* RUNTIME · +18..+59 de luminancia (mediana +34) sobre fondos de
     60–110: blanco al 20–40 % (en captura, .25–.45 se veía un poco más
     que el clip en f122). */
  alfa: { min: 0.2, max: 0.38 },
  /* SUPUESTO · las curvas de prendido y apagado, como fracción de la vida:
     el brillo de una chispa sube en 2–3 cuadros y baja en 4–6 antes de
     perderse bajo el umbral. */
  entrada: 0.2,
  salida: 0.35,
  /* Progreso del primer y del último nacimiento. */
  desde: 0.02,
  hasta: 0.95,
} as const

/* SUPUESTO · lo que el clip corta arriba. Un título grande y una línea de
   descripción, en el mismo lenguaje que lo medido, para que la grabación
   de la pantalla entera tenga cabeza. No hay recibo posible. */
export const ARRIBA = {
  titulo: 'Wind Down',
  descripcion: 'Your apps go quiet so you can sleep.',
  tituloTamano: 34,
  horaDesde: '9:00 PM',
  horaHasta: '10:00 PM',
} as const
