/* LA GEOMETRÍA DEL MOCKUP, sin React: el bisel medido, la cámara y los
   rectángulos de cada capa en cada instante. Es puro a propósito: lo
   usa la composición para dibujar y `scripts/verificar.mjs` para
   comprobar, con los mismos números, que el hueco del bisel queda lleno.

   ─── EL BISEL, medido sobre el alfa del PNG de Apple ───
   iPhone 17 - Black - Portrait.png (Apple Design Resources, 1350×2760):
   cuerpo opaco (20,27)–(1329,2732) = 1310×2706, esquina ≈ 246 (ajuste
   circular, error 4.4 px); hueco transparente (72,69)–(1277,2690) =
   1206×2622, esquina continua de ~230 nominal. La pantalla se
   enmascara con radio 186 —MENOS que el hueco— y se dibuja 4 px más
   grande por lado, debajo del bisel opaco: la esquina visible es la
   del hueco, y si las capas se redondean distinto no asoma el fondo.
   La grabación (1320×2868, Pro Max) entra escalada: misma proporción
   al 0.1 % (0.4603 vs 0.4600). Recibos completos en
   .context/recon/swipeable-tabs/MEDICIONES.md.

   ─── LA CÁMARA ───
   Tres momentos, medidos en el clip de @nater02 (720² a 60 fps): entra
   de 1× a 1.576× en 0.65 s, se queda, sale a 1.161× en 0.62 s y no se
   mueve más. Las dos curvas son bézier cúbicas ajustadas al ancho del
   cuerpo cuadro a cuadro (rms 0.005): entrada (0.30, 0.05, 0.40,
   0.90), salida (0.25, 0.25, 0.20, 0.90).

   Se interpola (k, X, Y): el zoom y DÓNDE queda el cuerpo del teléfono,
   no el zoom y un punto de mira. Con zoom + mira interpolados a la vez
   el borde de arriba del teléfono, medido, subía 7 px antes de bajar
   190: el zoom lo empujaba para arriba y la mira lo traía para abajo.
   Con la posición del cuerpo interpolada, cada borde va en una sola
   dirección, que es lo que hace un encuadre animado como rectángulo. */

export const IPHONE_17 = {
  png: { w: 1350, h: 2760 },
  cuerpo: { x: 20, y: 27, w: 1310, h: 2706, r: 246 },
  pantalla: { x: 72, y: 69, w: 1206, h: 2622, r: 186 },
} as const

/* Cuánto más grande que el hueco se dibuja la pantalla, en px del PNG. */
export const SOBRANTE = 4

export type Curva = { x1: number; y1: number; x2: number; y2: number }

export type Camara = {
  /* segundos con el teléfono entero antes de entrar */
  espera: number
  /* duración de la entrada, y a cuánto llega */
  entra: number
  k1: number
  /* momento en que empieza la salida (el final del gesto lento) */
  hasta: number
  /* duración de la salida, y a cuánto llega */
  sale: number
  k2: number
  /* a qué apunta la entrada: fracción del alto del cuerpo (0.145 es la
     fila de tabs: barra de estado + cabecera + media barra) */
  foco: number
  /* y dónde queda eso en el lienzo, como fracción del alto */
  focoEnLienzo: number
  /* aire arriba del teléfono al final, como fracción del lienzo */
  aireArriba: number
  curvaEntra: Curva
  curvaSale: Curva
}

export type Encuadre = {
  /* zoom, y esquina de arriba a la izquierda del CUERPO en el lienzo */
  k: number
  x: number
  y: number
  /* px del lienzo por px del PNG, ya con el zoom */
  s: number
}

/* Una bézier cúbica de easing, y(x), por bisección. */
export function bezier({ x1, y1, x2, y2 }: Curva) {
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    let t = x
    for (let i = 0; i < 40; i++) {
      t = (lo + hi) / 2
      const xt = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
      if (xt < x) lo = t
      else hi = t
    }
    return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
  }
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p

/* El cuerpo en reposo: al `altura` del lienzo, centrado. */
export function reposo(L: number, altura: number) {
  const s0 = (altura * L) / IPHONE_17.cuerpo.h
  const bw0 = IPHONE_17.cuerpo.w * s0
  const bh0 = IPHONE_17.cuerpo.h * s0
  return { s0, bw0, bh0, bx0: (L - bw0) / 2, by0: (L - bh0) / 2 }
}

/* Dónde está el cuerpo y cuánto zoom hay en el segundo `t`. */
export function encuadre(t: number, L: number, altura: number, cam: Camara): Encuadre {
  const { s0, bw0, bh0, bx0, by0 } = reposo(L, altura)
  const T1 = cam.espera
  const T2 = T1 + cam.entra
  const T3 = Math.max(cam.hasta, T2)
  const T4 = T3 + cam.sale

  /* De (zoom, mira) a (zoom, posición): la mira de la entrada es el
     punto del cuerpo que tiene que quedar al `focoEnLienzo` del alto;
     la de la salida deja `aireArriba` sobre el teléfono. */
  const cy1 = by0 + (cam.foco + (0.5 - cam.focoEnLienzo) * (L / (bh0 * cam.k1))) * bh0
  const estados = {
    reposo: { k: 1, x: bx0, y: by0 },
    entrada: { k: cam.k1, x: L / 2 - (bw0 * cam.k1) / 2, y: (by0 - cy1) * cam.k1 + L / 2 },
    salida: { k: cam.k2, x: L / 2 - (bw0 * cam.k2) / 2, y: cam.aireArriba * L },
  }
  const entre = (a: { k: number; x: number; y: number }, b: typeof a, p: number) => ({
    k: lerp(a.k, b.k, p),
    x: lerp(a.x, b.x, p),
    y: lerp(a.y, b.y, p),
  })
  let e
  if (t < T1) e = estados.reposo
  else if (t < T2) e = entre(estados.reposo, estados.entrada, bezier(cam.curvaEntra)((t - T1) / (T2 - T1)))
  else if (t < T3) e = estados.entrada
  else if (t < T4) e = entre(estados.entrada, estados.salida, bezier(cam.curvaSale)((t - T3) / (T4 - T3)))
  else e = estados.salida
  return { ...e, s: s0 * e.k }
}

export type Rect = { x: number; y: number; w: number; h: number; r: number }

/* Los rectángulos de cada capa en el lienzo para un encuadre. `clip` es
   el tamaño de la grabación, que decide el sobrante vertical. */
export function capas(e: Encuadre, clip: { w: number; h: number }) {
  const { cuerpo, pantalla, png } = IPHONE_17
  const f = (pantalla.w + 2 * SOBRANTE) / clip.w
  const pantH = clip.h * f
  return {
    cuerpo: { x: e.x, y: e.y, w: cuerpo.w * e.s, h: cuerpo.h * e.s, r: cuerpo.r * e.s } as Rect,
    bisel: { x: e.x - cuerpo.x * e.s, y: e.y - cuerpo.y * e.s, w: png.w * e.s, h: png.h * e.s, r: 0 } as Rect,
    pantalla: {
      x: e.x + (pantalla.x - SOBRANTE - cuerpo.x) * e.s,
      y: e.y + (pantalla.y - (pantH - pantalla.h) / 2 - cuerpo.y) * e.s,
      w: (pantalla.w + 2 * SOBRANTE) * e.s,
      h: pantH * e.s,
      r: pantalla.r * e.s,
    } as Rect,
  }
}
