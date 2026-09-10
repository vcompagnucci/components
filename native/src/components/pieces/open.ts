/* ABRIR DIRECTO EN UNA PIEZA — perilla de desarrollo del taller.
 *
 * Con una sola pieza el índice no existe: el taller abre en ella. Con dos
 * o más aparece la lista, y eso es lo correcto para elegir, pero no para
 * medir: las sondas (`sonda.ts` de cada pieza) y `pnpm grabar` necesitan
 * que la app arranque en la pieza sin tocar nada, y `simctl openurl`
 * con el esquema del dev client pide confirmación en iOS 26 (no se puede
 * tocar desde la terminal). Así que el slug se escribe ACÁ, Fast Refresh
 * lo aplica, y el índice redirige. Tiene que quedar en `undefined` en el
 * repo: el otro worktree tiene su propia pieza.
 *
 * Vive fuera de `src/app/` a propósito: Expo Router convierte en ruta
 * todo archivo que cuelgue de ahí.
 */
export const ABRIR: string | undefined = undefined
