import { createContext, useContext } from 'react'

import { COLOR, type Paleta } from './measurements'

/* ═══════════════════════════════════════════════════════════════
   EL TEMA — un contexto con la paleta vigente, y nada más.

   La pieza se midió entera en oscuro, así que `COLOR` (la paleta
   oscura, con recibo por valor) es el default: sin provider, todo se ve
   exactamente como antes de que existiera el modo claro. La ruta decide
   la paleta con `useColorScheme()` — el tema del SISTEMA, no un toggle
   propio: la referencia es la app de X, que sigue al sistema.

   Contexto y no props: la paleta atraviesa cinco componentes y varios
   `memo`. Un cambio de esquema re-renderiza a los consumidores aunque
   el `memo` corte las props — que es exactamente la semántica que un
   tema necesita. Las dos paletas son constantes de módulo, así que la
   identidad es estable y ningún render se dispara de más.
   ═══════════════════════════════════════════════════════════════ */
export const Tema = createContext<Paleta>(COLOR)

export const usePaleta = () => useContext(Tema)
