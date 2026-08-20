import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import './lab.module.css'

/* ═════════════════════════════════════════════════════════════
   EL PICKER CANÓNICO DE /prototype. Andamio, no diseño del
   producto — por eso tiene su propia tipografía de sistema y su
   propio fondo oscuro: tiene que leerse COMO herramienta y no
   confundirse con lo que estás mirando.

   Estaba adentro de lab.tsx cuando el único que lo usaba era el
   toggle de tema. Ahora lo usan dos —el tema y las opciones del
   vault— así que vive acá y cada uno le pasa sus opciones.

   El highlight se mueve MIDIENDO el botón activo (offsetLeft y
   offsetWidth) en vez de calcular posiciones: así funciona con
   cualquier cantidad de opciones y con palabras de cualquier
   largo, sin que nadie tenga que mantener una tabla.

   data-ready llega recién en el segundo cuadro. Sin eso el
   highlight se vería VOLAR desde la izquierda hasta su lugar la
   primera vez que aparece, porque la transición ya estaría activa
   cuando se le pone la posición inicial.
   ═════════════════════════════════════════════════════════════ */
export function Picker<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambio,
}: {
  etiqueta?: string
  opciones: readonly T[]
  valor: T
  onCambio: (v: T) => void
}) {
  const picker = useRef<HTMLElement | null>(null)
  const highlight = useRef<HTMLSpanElement | null>(null)
  const items = useRef<Array<HTMLButtonElement | null>>([])
  const i = opciones.indexOf(valor)

  const mover = useCallback(() => {
    const item = items.current[i]
    if (!highlight.current || !item) return
    highlight.current.style.width = `${item.offsetWidth}px`
    highlight.current.style.transform = `translateX(${item.offsetLeft}px)`
  }, [i])

  useLayoutEffect(mover, [mover])

  useEffect(() => {
    let segundo = 0
    const primero = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => picker.current?.setAttribute('data-ready', ''))
    })
    return () => {
      cancelAnimationFrame(primero)
      cancelAnimationFrame(segundo)
    }
  }, [])

  return (
    <nav className="proto-picker" aria-label={etiqueta ?? 'Options'} ref={picker}>
      {etiqueta && <span className="proto-picker-etiqueta">{etiqueta}</span>}
      <span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />
      {opciones.map((nombre, indice) => (
        <button
          className="proto-picker-item"
          data-active={indice === i ? '' : undefined}
          aria-current={indice === i ? 'true' : undefined}
          key={nombre}
          onClick={() => onCambio(nombre)}
          ref={(el) => {
            items.current[indice] = el
          }}
        >
          {nombre}
        </button>
      ))}
    </nav>
  )
}

/* Varios pickers apilados. El fijo es la PILA y no cada picker, así
   se acomodan solos cuando se agrega o se saca uno.

   La posición existe porque hay DOS andamios a la vez: el tema, que
   vale en toda la página y se queda abajo, y las opciones de la vista
   que estés mirando. Sin separarlos se pisan. */
export function Pila({
  children,
  posicion = 'abajo',
}: {
  children: React.ReactNode
  posicion?: 'abajo' | 'arriba'
}) {
  return (
    <div className="proto-pila" data-position={posicion === 'arriba' ? 'top' : undefined}>
      {children}
    </div>
  )
}
