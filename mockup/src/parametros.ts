/* LOS NÚMEROS DEL VIDEO, uno por línea y con recibo. Son las props de
   la composición: en Remotion Studio aparecen como controles y se
   tocan en vivo, sin re-encodear nada.

   La referencia es el clip de @nater02 (x.com/nater02/status/
   2092952884987957708, 720² a 60 fps, medido cuadro a cuadro el
   2026-09-04; planilla en .context/recon/swipeable-tabs/MEDICIONES.md).
   Donde el brief se aparta de la referencia a propósito, está dicho. */
import { z } from 'zod'

const curva = z.object({ x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() })

export const esquema = z.object({
  /* medido: RGB (235, 230, 232) plano, sin gradiente */
  fondo: z.string(),
  /* qué hay detrás del teléfono además del color plano. `color` es la
     referencia; lo demás es la exploración de fondos (ver fondos.ts):
     degradados, foco, malla, grano, trama, piso, una imagen, o la
     app misma desenfocada. Los campos que un tipo no usa se ignoran */
  fondoEstilo: z.object({
    tipo: z.enum(['color', 'degradado', 'foco', 'malla', 'grano', 'puntos', 'piso', 'imagen', 'app']),
    colores: z.array(z.string()),
    angulo: z.number(),
    imagen: z.string(),
    desenfoque: z.number(),
    luz: z.number(),
    escala: z.number(),
    grano: z.number(),
  }),
  /* cuerpo del teléfono como fracción del alto del lienzo. La
     referencia mide 0.953; el brief pide más aire: 0.75 */
  altura: z.number().min(0.3).max(1),
  /* capas de sombra, en px de un lienzo de 720 (se escalan con el
     lienzo y con el zoom). Cada capa: opacidad, desenfoque (σ), corrida
     en x y en y, color y cuánto crece el rectángulo antes de
     desenfocarse (`expandir`; negativo lo achica). Medido en la
     referencia de @nater02: α .60 σ 8 (12, 12) + α .20 σ 30 (70, 70).
     El brief pide una sombra más marcada: α .82 σ 7 y α .32 σ 36; las
     corridas quedan las medidas. Otras variantes, medidas sobre los
     clips del vault o tomadas de los sistemas de diseño, en
     `sombras.ts` */
  sombra: z.array(
    z.object({
      alfa: z.number(),
      sigma: z.number(),
      dx: z.number(),
      dy: z.number(),
      color: z.string(),
      expandir: z.number(),
    }),
  ),
  camara: z.object({
    espera: z.number(),
    entra: z.number(),
    k1: z.number(),
    hasta: z.number(),
    sale: z.number(),
    k2: z.number(),
    foco: z.number(),
    focoEnLienzo: z.number(),
    aireArriba: z.number(),
    curvaEntra: curva,
    curvaSale: curva,
  }),
  /* qué va en el hueco: la grabación, o un rojo pleno para verificar */
  pantalla: z.enum(['clip', 'roja']),
  /* archivos en public/ (los escribe `pnpm assets`) */
  clip: z.string(),
  bisel: z.string(),
  /* tamaño de la grabación; lo completa calculateMetadata */
  clipAncho: z.number(),
  clipAlto: z.number(),
})

export type Parametros = z.infer<typeof esquema>

/* CADA VIDEO SALE DOS VECES: sobre el fondo claro (la referencia) y
   sobre uno oscuro. Regla del usuario, 2026-09-04: "a cada video hay
   que hacerle dos fondos, uno para light mode y uno para dark mode".
   El oscuro NO está medido —el vault no tiene ninguna referencia sobre
   fondo oscuro: Mini player y Hold to commit, que parecían oscuros,
   miden 253–255 en las esquinas— así que es el neutro medido bajado a
   ~11 % de luminancia con el mismo tinte: (235,230,232) → (28,24,26).
   La sombra queda la misma: negra sobre casi negro no se ve, y el
   teléfono se separa por el canto metálico del bisel, como en Apple. */
export const FONDO_OSCURO = '#1C181A'

/* LA LIBRARY LLEVA UN SOLO RENDER, TRANSPARENTE Y SIN SOMBRA
   (pnpm render:library → scripts/library.mjs): el fondo lo pone la
   card de la library en el tema que sea, y el teléfono va sin sombra,
   como los videos de Family en benji.org. Teléfono al 92 % del cuadro —el
   video es la caja entera de la card y el usuario lo quiso más cerca;
   benji va al 85 %— y la cámara que entra a los tabs y se queda hasta el
   final (`hasta` fuera del clip): lo que se muestra son los tabs. Antes se rendía un par claro/oscuro con el color
   de la card horneado y el usuario lo rechazó: "que haya solo un
   fondo, el del lugar que da la library, y sin sombra, como Family"
   (2026-09-05). El alfa viaja en dos archivos porque ningún códec lo
   lleva a todos los navegadores: WebM VP9 para Chrome y Firefox, HEVC
   con alfa en .mov para Safari. */

export const PARAMETROS: Parametros = {
  fondo: '#EBE6E8',
  fondoEstilo: { tipo: 'color', colores: [], angulo: 180, imagen: '', desenfoque: 0, luz: 0, escala: 1, grano: 0 },
  altura: 0.75,
  /* La sombra del video de referencia, tal cual se midió (ver la
     variante 1 de sombras.ts). El brief había pedido una más marcada
     (α .82 σ 7 + α .32 σ 36); se miró la grilla y el usuario eligió
     la medida, 2026-09-04. */
  sombra: [
    { alfa: 0.6, sigma: 8, dx: 12, dy: 12, color: '#000000', expandir: 0 },
    { alfa: 0.2, sigma: 30, dx: 70, dy: 70, color: '#000000', expandir: 0 },
  ],
  camara: {
    /* referencia: entra desde el cuadro 0; acá un respiro de 0.25 s */
    espera: 0.25,
    /* 0.65 s a 1.576× (ancho del cuerpo 335 → 528 en 720) */
    entra: 0.65,
    k1: 1.576,
    /* hasta que termina la parte lenta del clip. Medido sobre la toma
       del 2026-09-04 (diferencia entre cuadros a 60 fps): el arrastre
       lento Following → Stocks va de 1.20 a 2.85 s, el toque a For you
       a 3.80, y los siete flicks cada 1.0 s desde 4.81 (cinco hasta
       Design, dos de vuelta hasta Tech). La salida arranca a 3.0 y
       termina a 3.62, antes del toque: la entrada cubre el arrastre
       lento entero y lo demás se ve desde el encuadre final */
    hasta: 3.0,
    /* 0.62 s a 1.161× (528 → 389) */
    sale: 0.62,
    k2: 1.161,
    /* la fila de tabs: barra de estado + cabecera + media barra, como
       fracción del alto del cuerpo */
    foco: 0.145,
    focoEnLienzo: 0.33,
    /* referencia: 52 px de aire en 720 = 7.2 % */
    aireArriba: 0.072,
    curvaEntra: { x1: 0.3, y1: 0.05, x2: 0.4, y2: 0.9 },
    curvaSale: { x1: 0.25, y1: 0.25, x2: 0.2, y2: 0.9 },
  },
  pantalla: 'clip',
  clip: 'clip.mp4',
  bisel: 'bisel.png',
  clipAncho: 1320,
  clipAlto: 2868,
}

/* ─────────────────────────────────────────────────────────────────
   HOLD TO COMMIT — la segunda pieza App, y la primera que obliga a que
   este mockup deje de ser de una sola. Lo único que cambia es la
   CÁMARA: la acción de swipeable-tabs es una fila de tabs arriba, y la
   de acá es una píldora al pie. Todo lo demás —bisel, tamaño, sombra,
   fondos, curvas, zooms— es lo medido en la referencia y no se toca.

   `foco` es la fracción del alto del CUERPO donde mira la entrada. El
   centro de la píldora está a 2650 de 2868 px en la captura, o sea al
   92.40 % de la PANTALLA; con el hueco del bisel medido en
   `geometria.ts` (cuerpo y 27 alto 2706, pantalla y 69 alto 2621), eso
   es el 91.05 % del cuerpo.

   `focoEnLienzo` baja de 0.33 a 0.58, y el número está MEDIDO, no
   elegido a ojo. La píldora vive abajo, así que el encuadre se corre
   para abajo hasta donde se pueda sin perder el canto del teléfono ni
   su sombra: el criterio es dejar abajo el mismo aire que la referencia
   deja arriba en la salida (`aireArriba`, 7.2 %). Medido sobre el
   cuadro del commit, la sombra termina al 84.4 / 89.4 / 92.5 / 96.4 /
   99.9 % del lienzo con focoEnLienzo 0.50 / 0.55 / 0.58 / 0.62 / 0.67:
   0.58 deja 7.5 % de aire y es el que más ficha muestra encima de la
   píldora, que es el contexto que hace entender qué se está comprando.

   `hasta` es el final de la historia, y EL VIDEO TERMINA CUANDO TERMINA
   LA ANIMACIÓN. En el máster (cortado 1.2 s antes del gesto) el hold
   arranca a 1.47 s y la ráfaga cae a 2.20. RUNTIME: midiendo la
   diferencia entre cuadros consecutivos en la banda del pill y su
   entorno, las dos apariencias se quedan quietas a los 3.00 s, cuando
   "✓ Order Placed" terminó de enfocar y la ráfaga se apagó, y siguen
   quietas hasta los 4.33, que es cuando el reinicio empieza a moverse.
   El clip se corta a 4.10: 1.10 s con el resultado en pantalla, y 0.23
   de margen contra el reinicio. La salida de la cámara arranca a 3.00,
   o sea en el cuadro en que la animación termina, y llega abierta a
   3.62: el final se ve con el teléfono entero.

   EL AIRE DEL FINAL ES UN PEDIDO, no una medida. Primero se cortó a
   3.25, con 0.25 s, y Vito (2026-09-08): "que haya más tiempo luego que
   termine". Lo que la medición fija es el techo, no el gusto: más de
   4.33 y entra el reinicio.

   NO SE ESPERA AL REINICIO. Vito, 2026-09-08: "hacé que el video se
   corte antes, o sea cuando termina la animación y listo, bien natural,
   que no se espere a volver". El fundido de vuelta al reposo sigue en la
   pieza; en el video, dos segundos y medio esperando que el botón se
   destrabe no son la pieza. Antes eran 6.35 con un hold abandonado
   abriendo la toma, y 4.65 sin él. */
export const HOLD_TO_COMMIT: Parametros = {
  ...PARAMETROS,
  clip: 'hold-to-commit-oscuro.mp4',
  camara: {
    ...PARAMETROS.camara,
    foco: 0.9105,
    focoEnLienzo: 0.58,
    hasta: 3.0,
  },
}

/* LOS PARÁMETROS DE LA LIBRARY, derivados de los de cada pieza.
   Existen como composición propia y no como props del render porque
   Remotion mezcla las input props con las defaultProps SÓLO en el
   primer nivel: pasarle un `camara` parcial borra el resto del objeto
   —el foco, el zoom, las curvas— y el esquema de zod lo rechaza. Con
   una composición por pieza, el script de render sólo pisa el clip,
   que es de primer nivel. */
export const paraLibrary = (p: Parametros, focoEnLienzo = p.camara.focoEnLienzo): Parametros => ({
  ...p,
  fondo: 'transparent',
  sombra: [],
  /* 92 %: el video es la caja entera de la card y el usuario lo pidió
     más cerca; benji va al 85 % */
  altura: 0.92,
  camara: {
    ...p.camara,
    /* `hasta` fuera del clip: la cámara entra al gesto y SE QUEDA ahí
       hasta el final. "Así se ve lo que estoy mostrando" (usuario,
       2026-09-05). El video de X sí sale. */
    hasta: 9999,
    k2: 1.0,
    aireArriba: 0.04,
    /* EN LA LIBRARY EL VIDEO ES LA CAJA ENTERA de la card, así que el
       teléfono tiene que LLENARLA: el corte cae en el borde de la caja,
       que es donde tiene que caer. Una pieza cuyo gesto vive abajo
       necesita su propio valor, porque el que sirve para el video de X
       —pensado para que no se pierdan el canto ni la sombra— acá deja un
       tercio de card vacío. Medido sobre el cuadro del commit de
       hold-to-commit: con 0.58 el cuerpo llega al 70.9 % de la caja y
       queda 29.1 % de vacío; con 0.70 al 82.9 %; con 0.78 al 90.9 %;
       con 0.85 al 97.9 % y con 0.92 al 99.9 %. Va 0.85: llena la caja y
       deja la píldora entera adentro. */
    focoEnLienzo,
  },
})
