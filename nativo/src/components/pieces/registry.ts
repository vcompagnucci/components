import type { ComponentType } from 'react'

/* ═══════════════════════════════════════════════════════════════
   EL REGISTRO DE PIEZAS — slug → pantalla, derivado de las carpetas.

   Es el `registry.tsx` de react-native-motion (components/animations/),
   con una diferencia que acá importa: allá el mapa se escribe a mano
   —un import y una línea por animación— y acá se DERIVA. Una lista
   escrita a mano se desincroniza el día que agregás una carpeta sin
   acordarte de anotarla, y entonces el índice miente; es la misma
   decisión que hace que el vault no pueda mentir y que los bocetos del
   playground salgan del disco. Y con varios worktrees construyendo
   piezas en paralelo, un archivo central que todos editan es un
   conflicto por pieza nueva; una carpeta por pieza no choca con nadie.

   `require.context` es de Metro y Expo lo habilita por defecto — es el
   mismo mecanismo sobre el que está construido Expo Router. El patrón
   sólo matchea `<slug>/index.tsx` en minúsculas y guiones, que es
   exactamente la forma que tiene que tener una pieza: su carpeta se
   llama como su slug, y ese slug es el que lleva en la exhibition
   (`slug` de su entrada en `src/pieces.ts` del repo web) y en la URL
   del taller.

   Cada `index.tsx` exporta su pantalla POR DEFECTO, y nada más: es lo
   único que el registro necesita saber de una pieza. La ruta
   (`src/app/[slug].tsx`) busca acá, y el índice (`piece-list.tsx`)
   lista las claves. Las piezas se cargan al arrancar, como los imports
   del registry de la referencia: son pocas y el taller no tiene
   pantalla de carga que ahorrar.
   ═══════════════════════════════════════════════════════════════ */
const CONTEXTO = require.context('./', true, /^\.\/[a-z0-9-]+\/index\.tsx$/)

const slugDe = (clave: string) => clave.slice('./'.length, -'/index.tsx'.length)

export const PIEZAS: Readonly<Record<string, ComponentType>> = Object.fromEntries(
  CONTEXTO.keys()
    .sort()
    .map((clave) => [slugDe(clave), CONTEXTO(clave).default]),
)

/* Los slugs en orden alfabético: el índice no tiene orden editorial —
   es una herramienta, no la exhibition. */
export const SLUGS: readonly string[] = Object.keys(PIEZAS)

/* Sin esto TypeScript no conoce `require.context`: es una extensión de
   Metro, no del runtime. Va acá abajo y no en un .d.ts suelto para que
   viva al lado de su único uso. */
declare const require: {
  context(
    dir: string,
    hondo: boolean,
    patron: RegExp,
  ): { keys(): string[]; (clave: string): { default: ComponentType } }
}
