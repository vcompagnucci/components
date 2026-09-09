/* EL MATERIAL DEL BOTÓN — de qué está hecho el pill.
 *
 * Vito pidió (2026-09-04) "ver una opción de cómo sería esto con botón
 * liquid glass". Como el fondo y la receta, es una VARIANTE detrás de un
 * selector: se mira en vivo, en el simulador y en el teléfono, y cuando
 * haya decisión se escribe acá y el selector se va.
 *
 *   'opaco'   el pill medido del clip de Opal: cápsula #1E1E1E con el
 *             brillo de reposo y la punta velada, y una sombra de dos
 *             capas que lo levanta sobre las páginas claras. (El clip
 *             tiene además un anillo de 1 pt y nosotros no lo dibujamos:
 *             el recibo está donde estaba `COLOR.anillo`, en
 *             `medidas.ts`.)
 *   'vidrio'  la misma cápsula en Liquid Glass nativo (`expo-glass-effect`
 *             sobre `UIGlassEffect`), lanzado como lo haría una app
 *             seria: `regular` sin tinte (el vidrio de los controles, el
 *             que refracta), INTERACTIVO (responde al dedo con su propio
 *             abultado, así que no lleva la escala del press de Opal),
 *             flotando sobre el contenido, que scrollea por debajo, y sin
 *             nada de Opal encima: ni brillo de reposo ni punta velada.
 *             El relleno blanco del hold barre encima igual:
 *             es el gesto. El label sigue al esquema, como todo control
 *             de vidrio: negro en claro, blanco en oscuro.
 *
 * Hubo un tercero, 'claro' (el mismo vidrio con el estilo `clear` de
 * Apple, más transparente), agregado y sacado el 2026-09-07: entró al
 * preguntar si el vidrio tenía intensidad (no la tiene: dos estilos y un
 * tinte) y salió por pedido ("sacá la opción de claro"). Si vuelve a
 * hacer falta, es `glassEffectStyle="clear"` en la cápsula de `boton.tsx`.
 *
 * Lo que NO cambia entre materiales: el gesto, las curvas, el relleno, el
 * label, las chispas, la ráfaga y la háptica. Las trampas del vidrio
 * están en `nativo/VIDRIO.md`; la que importa acá: nadie lo recorta, ni
 * él ni sus ancestros, así que el vidrio es el CONTENEDOR del pill y la
 * vista que recorta las texturas va adentro, transparente.
 */
export type Material = 'opaco' | 'vidrio'
export const MATERIALES: readonly Material[] = ['opaco', 'vidrio']
export const MATERIAL: Material | 'elegir' = 'opaco'
