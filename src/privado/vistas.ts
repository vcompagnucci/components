import { useCallback, useEffect, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   LAS VISTAS DEL PLAYGROUND — cada una es un lienzo.

   Al revés que los clips, esto NO se deriva del disco: un clip existe
   porque soltaste un archivo en una carpeta, y una vista existe porque
   la creaste. Así que sí hay algo que mantener, y vive en
   .lima-playground.json en la raíz del vault, al lado de las fichas.

   POR QUÉ EN EL VAULT Y NO EN localStorage: una vista referencia clips
   por su ruta, así que pertenece al mismo lugar que ellos. En
   localStorage se perdería al limpiar el navegador y no se podría mirar
   desde otro, y las dos cosas serían raras para algo que es tan tuyo
   como los clips.

   EL SERVIDOR NO CONFÍA EN ESTO. Todo lo que se manda se sanea del otro
   lado —campos conocidos, números acotados, tipos de frame de una
   lista— así que este archivo puede quedarse con la parte cómoda.
   ═══════════════════════════════════════════════════════════════ */

export type TipoFrame = 'pieza' | 'clip'

/* Un frame es UNA cosa puesta en el lienzo: o una pieza nuestra, o un
   clip del vault. `ref` dice cuál — el nombre de la pieza, o la ruta del
   clip— y es una referencia y no una copia a propósito: si le cambiás la
   ficha a un clip, el frame que lo muestra ya está actualizado. */
export type Frame = {
  id: string
  tipo: TipoFrame
  ref: string
  x: number
  y: number
  ancho: number
  alto: number
}

export type Vista = {
  id: string
  nombre: string
  creada: number
  frames: Frame[]
}

export type EstadoVistas =
  | { cargando: true }
  | { cargando: false; conectado: false; motivo: string }
  | { cargando: false; conectado: true; vistas: Vista[] }

/* randomUUID pide un contexto seguro. localhost cuenta como seguro, así
   que en desarrollo siempre está — pero el respaldo evita que abrir esto
   desde la IP de la máquina en el teléfono tire una excepción en vez de
   crear la vista. */
const nuevoId = () =>
  typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

/* CUÁNTO SE ESPERA ANTES DE GUARDAR.

   Arrastrar un frame dispara un evento por cuadro: a 60fps, un arrastre
   de dos segundos son 120 escrituras al disco. Con esto son una.

   400 y no más: es cortito para una mano —soltás el frame y para cuando
   volvés a mirar ya está guardado— y largo comparado con los 16ms de un
   cuadro, que es lo que hay que absorber. */
const ESPERA = 400

export function useVistas() {
  const [estado, setEstado] = useState<EstadoVistas>({ cargando: true })

  /* El temporizador y lo último que hay para mandar, fuera del estado:
     que cambien no tiene que redibujar nada. */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendiente = useRef<Vista[] | null>(null)

  const mandar = useCallback(() => {
    const v = pendiente.current
    pendiente.current = null
    timer.current = null
    if (!v) return
    fetch('/vault-media/__vistas', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vistas: v }),
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let vivo = true
    fetch('/vault-media/__vistas')
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return
        if (!d.conectado) {
          setEstado({ cargando: false, conectado: false, motivo: d.motivo })
          return
        }
        setEstado({ cargando: false, conectado: true, vistas: d.vistas })
      })
      .catch((e) => {
        if (vivo) setEstado({ cargando: false, conectado: false, motivo: String(e) })
      })
    return () => {
      vivo = false
    }
  }, [])

  /* AL DESMONTAR SE MANDA LO QUE HAYA QUEDADO. Sin esto, mover un frame
     y salir del playground antes de los 400ms pierde el movimiento — y
     se sentiría como que la app olvida cosas al azar. */
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current)
        mandar()
      }
    },
    [mandar]
  )

  /* La escritura es OPTIMISTA: la pantalla se actualiza ya y el disco
     después. Un frame que se arrastra tiene que seguir al puntero sin
     esperar a nadie. */
  const guardar = useCallback(
    (siguiente: (v: Vista[]) => Vista[]) => {
      setEstado((e) => {
        if (e.cargando || !e.conectado) return e
        const vistas = siguiente(e.vistas)
        pendiente.current = vistas
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(mandar, ESPERA)
        return { ...e, vistas }
      })
    },
    [mandar]
  )

  const crear = useCallback(
    (nombre: string) => {
      const vista: Vista = { id: nuevoId(), nombre, creada: Date.now(), frames: [] }
      /* La nueva va PRIMERA, igual que el clip más reciente en el vault:
         acabás de crearla, es lo que estás por abrir. */
      guardar((v) => [vista, ...v])
      return vista
    },
    [guardar]
  )

  const borrar = useCallback((id: string) => guardar((v) => v.filter((x) => x.id !== id)), [guardar])

  const cambiar = useCallback(
    (id: string, f: (v: Vista) => Vista) => guardar((v) => v.map((x) => (x.id === id ? f(x) : x))),
    [guardar]
  )

  return { estado, crear, borrar, cambiar }
}
