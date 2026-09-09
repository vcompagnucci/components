/* EL ACABADO DEL BOTÓN — dos, y una sola fila de chips.
 *
 * Se llamó `look.ts` con valores `pulido` y `fiel` hasta que la regla de
 * nombres del repo lo corrigió (2026-09-08): "look" es jerga de diseño y
 * "pulido" nombra una sensación, no un tratamiento. `acabado` es el
 * término de especificación, y los dos valores dicen de dónde sale cada
 * uno: `referencia` es lo medido del clip, `revisado` es lo mismo con
 * las correcciones de las guías de interfaz aplicadas.
 *
 * Vito, 2026-09-08: "hacé mucho más fácil el toggler". Antes esto eran
 * dos filas de tres chips, seis combinaciones, y para juzgarlas había
 * que tener en la cabeza qué hacía cada eje. Ahora son DOS looks
 * completos: cada uno es una respuesta entera y defendible, que es lo
 * que pide el skill `prototype` ("cada variante es una dirección que
 * podrías defender sola, no tres tintas de la misma idea").
 *
 *   'referencia'  el botón medido cuadro a cuadro contra el clip de Opal.
 *              Anillo de 1 pt, la fila del label centrada como caja, y
 *              el velo blanco pleno al completar
 *   'revisado'    el mismo botón con las tres reglas de better-ui que la
 *              referencia no cumple, y con el modo claro resuelto
 *
 * QUÉ CAMBIA EN 'revisado', y por qué cada cosa:
 *
 * 1. SIN ANILLO, CON SOMBRA. better-ui: "Shadows for elevation, borders
 *    for structure. Where a border exists only to create depth, prefer
 *    layered transparent box-shadow values". Y la prueba de
 *    interface-craft ("do outlines add structure or noise?") la contesta
 *    la medición: nuestro anillo se despega +54.5 de lo que tiene a 2 pt
 *    afuera, el de Opal +4. Es un contorno dibujado que la referencia no
 *    tiene. RUNTIME en `.context/hold-to-commit/optico.py`.
 *
 * 2. EL LABEL CON EMPUJÓN ÓPTICO. better-ui: "When geometric centering
 *    looks off, align optically. Buttons with icons need a manual
 *    nudge". Medido sobre el commit: con la caja centrada, el TEXTO
 *    queda +13.67 pt a la derecha del centro del pill y el centroide de
 *    tinta +6.60. La corrección es ese −6.60, o sea el Δ anulado: el centro
 *    de masa cae en el centro (verificado: Δ −0.06).
 *
 * LO QUE EL LOOK NO ARREGLA, Y SE ARREGLÓ EN OTRO LADO. En claro, al
 * completar, el pill medía 229.9 contra una ficha de 245.5: 15.6 de
 * contraste, o sea que dejaba de existir como superficie. Eso no se
 * corrige en el botón sino en la página, que pasó de blanco puro al gris
 * agrupado de iOS (recibo en `fondo-accion.tsx`). El botón es el mismo
 * en los dos temas. */
export type Acabado = 'referencia' | 'revisado'

/* El primero es el estado inicial de la fila de chips. */
export const ACABADOS: readonly Acabado[] = ['revisado', 'referencia']

/* RUNTIME · la corrección óptica del label con tilde, en pt: el Δ medido
   del centroide de tinta, anulado. Sólo mueve a "✓ Order Placed": los
   otros dos labels no tienen ícono y ya están centrados. */
export const CORRECCION_OPTICA = -6.6

export type Tratamiento = {
  /** el anillo de 1 pt medido del clip */
  anillo: boolean
  /** dos capas de sombra transparente, la receta de better-ui */
  sombra: boolean
  /** cuánto se corre "✓ Order Placed", en pt, para centrarlo ópticamente */
  correccionOptica: number
}

/* EL BOTÓN NO SE ATENÚA. La primera versión de esto le ponía un velo
   oscuro al relleno en claro, para que al completar no se perdiera
   contra una página blanca. Vito, 2026-09-08: "no me gusta cómo
   resolviste lo del color, de última cambiá un poco el color del fondo,
   ya que no es lo principal acá". Es la corrección correcta y vale como
   regla: cuando el protagonista y el escenario no se separan, se mueve
   el escenario. La página pasó de blanco puro al gris agrupado de iOS
   (`fondo-accion.tsx`) y el botón vuelve a llegar a blanco pleno, como
   la referencia. */
export const TRATAMIENTOS: Record<Acabado, Tratamiento> = {
  revisado: { anillo: false, sombra: true, correccionOptica: CORRECCION_OPTICA },
  referencia: { anillo: true, sombra: false, correccionOptica: 0 },
}

/* ELEGIDO: 'revisado' (Vito, 2026-09-08). La fila de chips desaparece.

   'referencia' NO SE BORRA, y es la misma decisión que se tomó con el
   fondo `opal`: es la copia medida del clip, o sea el registro de qué
   dice la referencia, y son cuatro líneas. Se vuelve a ver con
   `?acabado=referencia` o escribiendo el nombre acá. Lo que sí
   desaparece es el chip: la exploración terminó. */
export const ACABADO: Acabado | 'elegir' = 'revisado'
