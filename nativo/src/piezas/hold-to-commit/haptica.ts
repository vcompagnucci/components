import * as Haptics from 'expo-haptics'

/* ═══════════════════════════════════════════════════════════════
   LA PISTA HÁPTICA — en un solo lugar, porque es lo único de la pieza
   que NO se puede medir: el clip es video y no tiene pista háptica.
   Todo lo de acá es SIN RECIBO y se ajusta con el teléfono en la mano
   (el simulador no vibra).

   SIGUE LA TABLA DE `animate-expo` § 8 (pedido del 2026-09-04):

     un valor pasa un detente     →  selectionAsync()
     la operación terminó bien    →  notificationAsync(Success)

   y nada más. Apretar y soltar no están en la tabla —un botón de iOS
   no vibra al tocarlo, y soltar antes no es un error: el usuario
   decidió— así que no tienen háptica. Lo que había antes (2026-09-02:
   Light al apretar, Soft al soltar, doce impactos crecientes de Soft a
   Medium en los detentes) queda en la bitácora por si el teléfono pide
   volver.

   Las tres reglas absolutas del skill: cada tic va en el mismo cuadro
   que lo visual (el progreso cruzando un umbral, en
   `useAnimatedReaction` sobre el MISMO shared value que mueve el
   frente), nunca hay un tic por cuadro (doce por hold, como un picker
   pasando doce filas: la excepción de la tabla), y nada de esto es el
   único feedback — el relleno se ve con la háptica apagada.
   ═══════════════════════════════════════════════════════════════ */

/* SIN RECIBO · completar: el patrón de éxito del sistema, el "da-dum"
   que iOS usa cuando algo se confirmó. Va en el mismo cuadro que la
   ráfaga de partículas, que es el evento causal. */
export const alCompletar = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

/* LOS DETENTES, en progreso 0..1 (o sea en fracción de `HOLD.duracion`).
   Con el hold de 2 s los intervalos iban 300, 300, 240, 220, 180, 160,
   140, 120, 100, 80, 70, 60 ms; con 1 s, la mitad de eso. La
   aceleración es lo que cuenta "falta poco": con un solo tipo de tic,
   la cadencia es la única perilla que queda.

   DÓNDE CAEN LOS DOS ÚLTIMOS. El anteúltimo (0.955) cae justo antes del
   salto a negro del label, que arranca en `HOLD.negroEn` 0.965 y
   termina en 0.977 (`boton.tsx`, sobre el MISMO `progreso` lineal). El
   último (0.985) cae en el último cuadro del hold, pegado al patrón de
   éxito del commit. Acá decía que el último caía antes del salto a
   negro: el que cae ahí es el anteúltimo. SIN RECIBO. */
export const DETENTES = [0.15, 0.3, 0.42, 0.53, 0.62, 0.7, 0.77, 0.83, 0.88, 0.92, 0.955, 0.985] as const

/* Un detente: `selectionAsync`, el de "a value ticks past a step". */
export const tic = () => Haptics.selectionAsync()
