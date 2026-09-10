import type { Carga } from './load'

/* LA SONDA DE DESARROLLO — un estado fijo por recarga.
 *
 * `xcrun simctl openurl` con `?parcar=` pide confirmación ("Open in
 * Taller?") en iOS 26 y no se puede tocar desde la terminal; y una sonda
 * con timers corre una carrera contra el bundle. Así que el estado se
 * escribe ACÁ, Fast Refresh recarga la pieza, y la captura es
 * determinista: `sed` del valor + recarga + screenshot.
 *
 *   undefined             la pieza real, sin sonda (y vuelve al reposo)
 *   '0.5'                 quieto a mitad del hold (número = progreso)
 *   'commit'              terminado
 *   'rafaga=0.2'          la ráfaga quieta a esa fracción de su vida
 *   'cruce=120'           el press, 120 ms después del touch (curvas reales)
 *   'cruce-commit=300'    300 ms después de la ráfaga: label, blanqueo y partículas
 *   'cruce-suelta=150'    150 ms después de soltar a un tercio del hold
 *   'auto'                aprieta solo a los 700 ms y sostiene hasta el final
 *   'auto-suelta'         aprieta solo y suelta a los 400 ms
 *   'demo'                la coreografía de la GRABACIÓN: reposo, un hold
 *                         abandonado, un hold completo y el reinicio
 *                         adelantado a los 2 s (la timeline está arriba
 *                         de su rama en `hold-to-commit.tsx`)
 *   'tilde=0.5'           el commit con "✓ Order Placed" a mitad de su presencia
 *
 * Reproducen las curvas y los tiempos de la receta 'clip' (`receta.ts`):
 * con 'skill' puesta no miden nada.
 *
 * Tiene que quedar en `undefined` en el repo.
 *
 * Al lado, las otras dos perillas de desarrollo, con la misma regla
 * (por URL: `?carga=todo`, `?medir=1`):
 *   CARGA   'js' | 'render' | 'todo': la carga de una app real (`carga.tsx`)
 *   MEDIR   true: el medidor de cuadros y latencias (`medidor.tsx`), que
 *           reporta por `console.log` a los 9 s. Se combina con
 *           SONDA='auto' para medir la secuencia entera sin tocar.
 *   RECEPTOR  una URL a la que el medidor además hace POST del informe.
 *           Hace falta con un bundle de producción (`--no-dev`): ahí el
 *           `console.log` de la app no llega a Metro. Un receptor de una
 *           línea: `node -e "require('http').createServer((q,r)=>{let b='';
 *           q.on('data',c=>b+=c);q.on('end',()=>{require('fs').appendFileSync(
 *           '/tmp/medidor.jsonl',b+'\n');r.end()})}).listen(8090)"`.
 */
export const SONDA: string | undefined = undefined
export const CARGA: Carga | undefined = undefined
export const MEDIR = false
export const RECEPTOR: string | undefined = undefined
