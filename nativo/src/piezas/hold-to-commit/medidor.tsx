import { useEffect } from 'react'
import { makeMutable, useFrameCallback, useSharedValue } from 'react-native-reanimated'

/* ═══════════════════════════════════════════════════════════════
   EL MEDIDOR — cuánto le cuesta la pieza a cada hilo, en números.

   Pedido de Vito (2026-09-07): "mejorá muchísimo la performance de este
   botón [...] simulá la carga de una app real para testear su
   performance". Un botón que "se ve fluido" en el simulador con la app
   vacía no dice nada: la pregunta es qué pasa cuando el hilo de JS está
   ocupado con lo que una app real hace (parsear respuestas, re-renderizar
   listas) y el hilo de UI tiene que sostener el gesto igual. Eso pide
   dos cosas: una carga (`carga.tsx`) y ESTE medidor, que cuenta.

   Mide tres cosas, en una ventana fija desde que se monta:

   1. LOS CUADROS DEL HILO DE UI, con `useFrameCallback` de Reanimated:
      el intervalo entre cuadro y cuadro, recortado a lo que dura la
      secuencia (del press al reinicio, si hay marcas). De ahí salen la
      cadencia nominal (la mediana: 8.3 ms a 120 Hz, 16.7 a 60), el p95,
      el peor hueco y cuántos cuadros se PERDIERON (cada intervalo que
      vale n cadencias perdió n − 1). Es lo que ve el ojo.

   2. LA DEMORA DEL HILO DE JS: un timer de 50 ms que mide cuánto tarde
      llega. Es lo que sufre todo lo que va por JS: la háptica, el
      sonido, cualquier setState. Un `bloqueo` es una demora de más de
      100 ms.

   3. LAS MARCAS: `marcarUI(nombre)` (en worklets) y `marcarJS(nombre)`
      (en JS) estampan la hora (Date.now, el mismo reloj en los dos
      hilos) la PRIMERA vez que se las llama con ese nombre desde
      `empezar()`. El botón marca en UI cuándo apretó, cuándo cruzó el
      primer detente, cuándo pidió el sonido, cuándo completó y cuándo
      reinició; y en JS cuándo le llegó cada pedido. La resta es la
      latencia real de la háptica y del sonido bajo carga — el número
      que importa, porque el relleno no puede atrasarse (corre en UI)
      pero el tic sí.

   DOS DEPÓSITOS, UNO POR HILO, a propósito. Las marcas de UI viven en
   un `makeMutable` que sólo escribe UI; las de JS, en un objeto de JS.
   La primera versión usaba un solo mutable con `modify` desde los dos
   lados, y desde JS `modify` manda el modificador a UI como worklet:
   el closure de un `marcar` corrido en JS no lo es, y UI tiraba
   "[Worklets] Tried to synchronously call a Remote Function" en la
   cola de animaciones (RUNTIME, 2026-09-07). El mutable se lee desde
   JS al final, que es sincrónico (`getSync`).

   Reporta por `console.log` con el prefijo `[medidor]` (Metro lo
   imprime; el del simulador va a `/tmp/metro-manama.log`) y, si se le
   da una URL, también con un POST, para leerlo desde el teléfono.

   Es andamiaje: sin `MEDIR` no se monta y las marcas no hacen nada.
   ═══════════════════════════════════════════════════════════════ */

const activoUI = makeMutable(false)
const marcasUI = makeMutable<Record<string, number>>({})
let activoJS = false
let marcasJS: Record<string, number> = {}

/** Estampa la hora bajo `nombre`, una sola vez por tanda. SÓLO desde worklets. */
export const marcarUI = (nombre: string) => {
  'worklet'
  if (!activoUI.get()) return
  const m = marcasUI.get()
  if (m[nombre] === undefined) {
    m[nombre] = Date.now()
    marcasUI.set(m)
  }
}
/** Lo mismo, desde el hilo de JS. */
export const marcarJS = (nombre: string) => {
  if (!activoJS) return
  if (marcasJS[nombre] === undefined) marcasJS[nombre] = Date.now()
}

function empezar() {
  marcasJS = {}
  activoJS = true
  marcasUI.set({})
  activoUI.set(true)
}
function terminar(): Record<string, number> {
  activoJS = false
  activoUI.set(false)
  return { ...marcasUI.get(), ...marcasJS }
}

const percentil = (ordenados: number[], p: number) => ordenados[Math.min(ordenados.length - 1, Math.floor(ordenados.length * p))] ?? 0
const redondear = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d

type Cuadros = { cuadros: number; nominal: number; media: number; p95: number; peor: number; perdidos: number; huecos: number }
export type Informe = {
  contexto: string
  ventana: number
  ui: Cuadros & { desde: string }
  /* Los mismos números por tramo de la secuencia: el hold (press → commit),
     la ráfaga (700 ms desde el commit), la espera quieta y el fundido del
     reinicio. Para saber DÓNDE se pierden cuadros, no sólo cuántos. */
  fases: Record<string, Cuadros>
  js: { muestras: number; demoraMedia: number; demoraP95: number; demoraPeor: number; bloqueos: number }
  marcas: Record<string, number>
  latencias: Record<string, number>
}

/* Cuánto dura lo que sigue al reinicio (el fundido) y cuánto antes del press se cuenta. */
const COLA_MS = 800
const ANTES_MS = 100

const RAFAGA_MS = 700

function contar(intervalos: number[], nominalFijo?: number): Cuadros {
  const ord = [...intervalos].sort((a, b) => a - b)
  const nominal = nominalFijo ?? percentil(ord, 0.5)
  let perdidos = 0, huecos = 0
  for (const i of intervalos) {
    const n = Math.round(i / nominal)
    if (n > 1) {
      perdidos += n - 1
      huecos++
    }
  }
  return {
    cuadros: intervalos.length,
    nominal: redondear(nominal, 2),
    media: redondear(intervalos.reduce((a, b) => a + b, 0) / Math.max(1, intervalos.length), 2),
    p95: redondear(percentil(ord, 0.95), 2),
    peor: redondear(ord[ord.length - 1] ?? 0, 1),
    perdidos,
    huecos,
  }
}

function resumir(contexto: string, ventana: number, cuadros: number[][], demoras: number[], m: Record<string, number>): Informe {
  /* La secuencia: del press al reinicio si están marcados; si no, todo. */
  const desde = m['press-ui'] !== undefined ? m['press-ui'] - ANTES_MS : -Infinity
  const hasta = m['reinicio-ui'] !== undefined ? m['reinicio-ui'] + COLA_MS : Infinity
  const entre = (a: number, b: number) => cuadros.filter(([t]) => t! >= a && t! <= b).map(([, dt]) => dt!)
  const total = contar(entre(desde, hasta))
  const fases: Record<string, Cuadros> = {}
  const press = m['press-ui'], commit = m['commit-ui'], reinicio = m['reinicio-ui']
  if (press !== undefined && commit !== undefined) fases['hold'] = contar(entre(press, commit), total.nominal)
  if (commit !== undefined) fases['ráfaga'] = contar(entre(commit, commit + RAFAGA_MS), total.nominal)
  if (commit !== undefined && reinicio !== undefined) fases['quieto'] = contar(entre(commit + RAFAGA_MS, reinicio), total.nominal)
  if (reinicio !== undefined) fases['reinicio'] = contar(entre(reinicio, reinicio + COLA_MS), total.nominal)
  const dOrd = [...demoras].sort((a, b) => a - b)
  const resta = (a: string, b: string) => (m[a] !== undefined && m[b] !== undefined ? m[a]! - m[b]! : NaN)
  const latencias: Record<string, number> = {
    /* cuánto tardó JS en enterarse de cada cosa que UI ya hizo */
    'tic: js − ui': resta('tic-js', 'tic-ui'),
    'commit: js − ui': resta('commit-js', 'commit-ui'),
    'sonido: js − ui': resta('sonido-js', 'sonido-ui'),
    /* el reinicio, medido desde el commit: tiene que dar REINICIO.espera */
    'reinicio − commit': resta('reinicio-ui', 'commit-ui'),
    'hold (commit − press)': resta('commit-ui', 'press-ui'),
  }
  for (const k of Object.keys(latencias)) if (Number.isNaN(latencias[k])) delete latencias[k]
  return {
    contexto,
    ventana,
    ui: { ...total, desde: Number.isFinite(desde) ? 'press→reinicio' : 'ventana entera' },
    fases,
    js: {
      muestras: demoras.length,
      demoraMedia: redondear(demoras.reduce((a, b) => a + b, 0) / Math.max(1, demoras.length)),
      demoraP95: redondear(percentil(dOrd, 0.95)),
      demoraPeor: redondear(dOrd[dOrd.length - 1] ?? 0),
      bloqueos: demoras.filter((d) => d > 100).length,
    },
    marcas: m,
    latencias,
  }
}

type Props = {
  /** Qué se está midiendo (carga, receta, material...): va en el informe. */
  contexto: string
  /** Cuánto medir desde el montaje, en ms. */
  ventana: number
  /** A dónde mandar el informe además de la consola (opcional). */
  receptor?: string
}

const PASO_JS = 50

export function Medidor({ contexto, ventana, receptor }: Props) {
  /* Cada cuadro: [Date.now(), intervalo desde el anterior]. */
  const cuadros = useSharedValue<number[][]>([])
  const cuadro = useFrameCallback((info) => {
    if (info.timeSincePreviousFrame === null) return
    const par = [Date.now(), info.timeSincePreviousFrame]
    cuadros.modify((a) => {
      a.push(par)
      return a
    })
  }, false)

  useEffect(() => {
    empezar()
    cuadros.set([])
    cuadro.setActive(true)
    const demoras: number[] = []
    let esperado = Date.now() + PASO_JS
    const reloj = setInterval(() => {
      const ahora = Date.now()
      demoras.push(Math.max(0, ahora - esperado))
      esperado = ahora + PASO_JS
    }, PASO_JS)
    const fin = setTimeout(() => {
      clearInterval(reloj)
      cuadro.setActive(false)
      const m = terminar()
      const informe = resumir(contexto, ventana, cuadros.get(), demoras, m)
      const texto = JSON.stringify(informe)
      console.log('[medidor] ' + texto)
      if (receptor) fetch(receptor, { method: 'POST', headers: { 'content-type': 'application/json' }, body: texto }).catch(() => {})
    }, ventana)
    return () => {
      clearInterval(reloj)
      clearTimeout(fin)
      cuadro.setActive(false)
      activoJS = false
      activoUI.set(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contexto, ventana, receptor])

  return null
}
