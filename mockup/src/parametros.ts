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
  /* cuerpo del teléfono como fracción del alto del lienzo. La
     referencia mide 0.953; el brief pide más aire: 0.75 */
  altura: z.number().min(0.3).max(1),
  /* dos capas, en px de un lienzo de 720 (se escalan con el lienzo y
     con el zoom): una de contacto y una ambiente, sólo a la derecha y
     abajo. Medido en la referencia: α .60 σ 8 corrida 12 + α .20 σ 30
     corrida 70. El brief pide una sombra más marcada: α .82 σ 7 y
     α .32 σ 36; las corridas quedan las medidas, que son las únicas
     que hay */
  sombra: z.array(z.object({ alfa: z.number(), sigma: z.number(), corrida: z.number() })),
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

export const PARAMETROS: Parametros = {
  fondo: '#EBE6E8',
  altura: 0.75,
  sombra: [
    { alfa: 0.82, sigma: 7, corrida: 12 },
    { alfa: 0.32, sigma: 36, corrida: 70 },
  ],
  camara: {
    /* referencia: entra desde el cuadro 0; acá un respiro de 0.25 s */
    espera: 0.25,
    /* 0.65 s a 1.576× (ancho del cuerpo 335 → 528 en 720) */
    entra: 0.65,
    k1: 1.576,
    /* hasta que termina la parte lenta del clip. Medido sobre la toma
       del 2026-09-04 (diferencia entre cuadros a 60 fps): el arrastre
       lento Following → Stocks va de 1.18 a 2.83 s, el toque a For you
       a 3.80, y los cinco flicks cada 1.0 s desde 4.80. La salida
       arranca a 3.0 y termina a 3.62, antes del toque: la entrada
       cubre el arrastre lento entero y lo demás se ve desde el
       encuadre final */
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
