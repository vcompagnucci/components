import { useEffect, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   LA CARGA — lo que una app real le hace a los dos hilos mientras el
   botón tiene que responder igual.

   Pedido de Vito (2026-09-07): "simulá la carga de una app real para
   testear su performance". Una app de verdad no está quieta detrás de
   un botón: parsea respuestas, actualiza stores, re-renderiza listas.
   Eso pega en dos lugares distintos, y por eso son dos cargas:

     'js'      EL HILO DE JS OCUPADO: un bucle que, cada `paso` ms,
               trabaja `ocupado` de ese tiempo parseando y serializando
               un JSON de ~40 KB (400 activos con historial), como lo
               haría un store que recibe cotizaciones. Con 0.6, JS está
               ocupado el 60 % del tiempo: cualquier timer, háptica o
               setState espera. Lo que corre en UI no tiene por qué
               enterarse.

     'render'  RE-RENDER A 10 Hz: la ficha de fondo (`fondo-accion.tsx`,
               `enVivo`) cambia sus valores diez veces por segundo, como
               una lista de precios en vivo. Es React reconciliando y
               Fabric montando ~200 vistas, con el botón encima.

     'todo'    las dos a la vez: el peor caso plausible.

     'pesada'  JS BLOQUEADO EN TANDAS LARGAS: 150 ms de trabajo seguidos
               cada 250 (también un 60 %, pero en bloques), como un
               setState grande o un JSON de varios MB. Es la que muestra
               de verdad qué pasa con lo que cruza a JS: la háptica y el
               sonido esperan hasta 150 ms, y lo visual no.

   Los números (0.6, 20 ms, 150 ms, 40 KB, 10 Hz) son SUPUESTOS
   razonables de una app de datos; la perilla está acá para moverla.

   Es andamiaje: sin `CARGA` no se monta nada.
   ═══════════════════════════════════════════════════════════════ */

export type Carga = 'js' | 'render' | 'todo' | 'pesada'
export const CARGAS: readonly Carga[] = ['js', 'render', 'todo', 'pesada']

const OCUPADO = 0.6
const PASO = 20
const PASO_PESADO = 250

/* El JSON que se parsea y serializa: 400 activos con historial, ~40 KB. */
const CUERPO = JSON.stringify({
  activos: Array.from({ length: 400 }, (_, i) => ({
    id: i,
    simbolo: 'ACT' + i,
    precio: 100 + i * 1.01,
    cambio: (i % 7) * 0.13,
    historial: Array.from({ length: 8 }, (_, k) => 100 + ((i * 7 + k * 3) % 50)),
  })),
})

function ocuparJS(ocupado: number, paso: number) {
  let vivo = true
  const trabajar = () => {
    if (!vivo) return
    const fin = Date.now() + paso * ocupado
    let suma = 0
    while (Date.now() < fin) {
      const o = JSON.parse(CUERPO) as { activos: { precio: number }[] }
      o.activos[0]!.precio += 1
      suma += JSON.stringify(o).length
    }
    if (suma < 0) console.log(suma) // que el optimizador no lo tire
    setTimeout(trabajar, paso * (1 - ocupado))
  }
  setTimeout(trabajar, 0)
  return () => {
    vivo = false
  }
}

/** Un contador que sube cada `ms` (0 = quieto). Para el re-render en vivo. */
export function useTick(ms: number): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!ms) return
    const id = setInterval(() => setTick((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])
  return ms ? tick : 0
}

/** Monta la carga de JS mientras está montado. No dibuja nada. */
export function CargaJS({ pesada = false }: { pesada?: boolean }) {
  useEffect(() => ocuparJS(OCUPADO, pesada ? PASO_PESADO : PASO), [pesada])
  return null
}

export const cargaJS = (c: Carga | undefined) => c === 'js' || c === 'todo' || c === 'pesada'
export const cargaPesada = (c: Carga | undefined) => c === 'pesada'
export const cargaRender = (c: Carga | undefined) => c === 'render' || c === 'todo'
