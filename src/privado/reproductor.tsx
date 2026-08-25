import { useCallback, useEffect, useRef, useState } from 'react'
import css from './reproductor.module.css'
import type { Clip } from './clips'

/* ═══════════════════════════════════════════════════════════════
   EL REPRODUCTOR

   Existe para UNA cosa: llegar al cuadro exacto donde arranca un gesto,
   contar hasta donde termina, y sacar la duración en milisegundos. Todo
   lo demás está al servicio de eso.

   LO MEDIDO está en .context/recon/vault/REPRODUCTOR.md:

     de apple   el botón de play/pausa — 38×38, icono de 20, y sus
                colores exactos en claro y en oscuro. 28 videos suyos
                lo usan, así que renderiza de verdad
     de benji   el toggle de velocidad — dos estados (1.0x y 0.5x), NO
                un menú, con los dos textos cruzándose por opacidad para
                que el botón no cambie de ancho. 45 elementos

   LO QUE NO TIENE REFERENCIA es la barra de tiempo. Los controles
   nativos de Safari tienen el shadow root cerrado, el reproductor
   completo de apple-events no monta sus controles fuera de una sesión
   real, y Podcasts y x.com piden login. Así que la pista es NUESTRA y
   se dice así, en vez de atribuírsela a alguien.

   EL PASO DE CUADRO no se estima: sale de leer el contenedor del
   archivo (scripts/cuadros.mjs), y está validado contra el navegador en
   9 de 9 clips.
   ═══════════════════════════════════════════════════════════════ */

/* Los dos de benji, y en ese orden: su botón arranca en 1x. */
export const VELOCIDADES = [1, 0.5] as const

/* SIEMPRE UN DECIMAL: "1.0x", no "1x".
   No es cosmética, es lo que hace que los dos estados midan lo mismo.
   Con cifras tabulares —las que ya usa la lectura de al lado— "1.0x" y
   "0.5x" dan 25.06px las dos, medido, así que el botón puede tomar el
   ancho de su contenido sin que la fila salte ni cambie el aire al
   alternar. La explicación larga está en .velocidad, en el CSS.
   Y de paso es como escribe un instrumento que mide: 0:00, 0/255,
   1.0x, todos con la misma cantidad de dígitos siempre. */
const etiqueta = (v: number) => `${v.toFixed(1)}x`

/* Los iconos son nuestros —dos formas triviales— y no los de Apple: se
   copian sus medidas, no su dibujo. Van con `currentColor` en vez de la
   máscara que usa él; el efecto es el mismo (el color del icono es una
   propiedad CSS, tematizable y animable) con una pieza menos. */
function Glifo({ pausa }: { pausa: boolean }) {
  return (
    <svg className={css.glifo} viewBox="0 0 20 20" aria-hidden focusable="false">
      {pausa ? (
        <>
          <rect x="5.5" y="4" width="3.5" height="12" rx="1.25" />
          <rect x="11" y="4" width="3.5" height="12" rx="1.25" />
        </>
      ) : (
        <path d="M6 4.4a1 1 0 0 1 1.5-.87l8.2 4.74a1 1 0 0 1 0 1.73l-8.2 4.74A1 1 0 0 1 6 13.87Z" />
      )}
    </svg>
  )
}

const reloj = (s: number) => {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${String(r).padStart(2, '0')}`
}

export function Reproductor({ clip }: { clip: Clip }) {
  const video = useRef<HTMLVideoElement | null>(null)
  /* La proporción del clip. El CSS la necesita para que el elemento SEA
     la imagen en vez de una caja con la imagen adentro y una franja al
     costado; ver .video en reproductor.module.css. Sale de los
     metadatos, que es el único lugar donde está: el índice no la trae. */
  const [ratio, setRatio] = useState<number | null>(null)
  const [corriendo, setCorriendo] = useState(false)
  const [t, setT] = useState(0)
  const [dur, setDur] = useState(0)
  const [vel, setVel] = useState<number>(1)
  const [arrastrando, setArrastrando] = useState(false)

  const cuadro = clip.cuadro
  const totalCuadros = clip.cuadros

  /* El tiempo se lee en cada cuadro de pantalla y no con `timeupdate`,
     que dispara unas 4 veces por segundo: con eso la pista avanza a
     saltos visibles y el número de cuadro miente casi siempre. */
  useEffect(() => {
    let pedido = 0
    const leer = () => {
      const v = video.current
      if (v && !arrastrando) setT(v.currentTime)
      pedido = requestAnimationFrame(leer)
    }
    pedido = requestAnimationFrame(leer)
    return () => cancelAnimationFrame(pedido)
  }, [arrastrando])

  const alternar = useCallback(() => {
    const v = video.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }, [])

  /* UN CUADRO EXACTO. Se calcula el índice del cuadro actual, se suma la
     dirección, y se busca el MEDIO del cuadro destino en vez de su
     borde: pedir exactamente N·cuadro cae justo en la frontera entre dos
     cuadros y el navegador puede resolver para cualquiera de los dos.
     Con el medio no hay ambigüedad. */
  const mover = useCallback(
    (dir: number) => {
      const v = video.current
      if (!v || !cuadro) return
      v.pause()
      const i = Math.floor(v.currentTime / cuadro)
      const destino = Math.min(Math.max(i + dir, 0), (totalCuadros ?? Infinity) - 1)
      v.currentTime = (destino + 0.5) * cuadro
    },
    [cuadro, totalCuadros],
  )

  /* A LOS BORDES. Mismo criterio que `mover`: se cae en el MEDIO del
     primer o del último cuadro, no en el borde del clip. Pedir
     exactamente `duration` deja el video en estado terminado y qué
     cuadro muestra ahí depende del navegador; pedir 0 sí es seguro
     —no hay frontera por debajo— pero se usa el medio igual para que
     el número de cuadro salga por el mismo camino en los dos extremos.

     Sin metadatos de cuadro se cae a la duración menos un pelo, que es
     lo mejor que se puede decir sin saber cuánto dura un cuadro. */
  const extremo = useCallback(
    (dir: number) => {
      const v = video.current
      if (!v) return
      v.pause()
      if (dir < 0) {
        v.currentTime = cuadro ? cuadro * 0.5 : 0
        return
      }
      const fin = Number.isFinite(v.duration) ? Math.max(v.duration - 0.001, 0) : 0
      /* Se acota contra la duración: `cuadros` sale de redondear y puede
         quedar medio cuadro más allá del final real del archivo. */
      v.currentTime =
        cuadro && totalCuadros ? Math.min((totalCuadros - 0.5) * cuadro, fin) : fin
    },
    [cuadro, totalCuadros],
  )

  /* EL TECLADO ESCUCHA EN EL DOCUMENTO, no en el marco.

     Estaba atado al foco del reproductor, y así fallaba justo en el caso
     que más se usa: clickeás el video para pausarlo —lo que NO le da el
     foco al marco, porque el clic cae en el <video>— y a partir de ahí
     las flechas no hacen nada. Quedabas pausado y sin teclado.

     Ahora que las flechas visibles se fueron, el teclado es el ÚNICO
     camino al cuadro a cuadro, así que no puede depender de dónde quedó
     el foco. Y el listener sólo existe mientras hay un clip abierto.

     LAS FLECHAS SON CUATRO GESTOS:

       sola      un cuadro
       option    diez cuadros — el salto grueso para cruzar un gesto
                 entero sin soltar la tecla. shift hace lo mismo y se
                 queda: ya estaba y no cuesta nada
       command   al principio o al final del clip

     command+flecha es back/forward del navegador, así que el
     `preventDefault` de esa rama no es cosmético: sin él te vas de la
     página en vez de saltar al final del video.

     Y JUSTO POR ESO EL FOCO SÍ IMPORTA PARA LAS FLECHAS. La ficha de al
     lado tiene el título, la fuente y las notas: campos de texto donde
     option+flecha salta de palabra y command+flecha va al principio o
     al final de la línea. Robárselas mientras escribís rompe lo que en
     mac hace todo el mundo sin pensarlo, así que en un campo el
     reproductor no toca las flechas. En un BOTÓN sí las toca —los
     botones no usan flechas— para que después de apretar play sigas
     yendo cuadro a cuadro.

     El espacio se saltea en cualquier control, botones incluidos: si
     estás sobre el de play, el espacio ya lo activa el navegador y
     hacerlo dos veces sería volver al estado anterior. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey) return
      const t = e.target as HTMLElement | null
      const foco = (sel: string) =>
        t instanceof HTMLElement && (!!t.closest(sel) || t.isContentEditable)

      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (dir) {
        if (foco('input, textarea, select')) return
        e.preventDefault()
        if (e.metaKey) extremo(dir)
        else mover(dir * (e.altKey || e.shiftKey ? 10 : 1))
        return
      }

      if (e.metaKey || e.altKey) return
      if ((e.key === ' ' || e.key === 'k') && !foco('button, input, textarea, select')) {
        e.preventDefault()
        alternar()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mover, extremo, alternar])

  useEffect(() => {
    const v = video.current
    if (v) v.playbackRate = vel
  }, [vel])

  const indice = cuadro ? Math.floor(t / cuadro) : null
  const avance = dur > 0 ? t / dur : 0

  const buscar = (e: React.PointerEvent<HTMLDivElement>) => {
    const v = video.current
    const caja = e.currentTarget.getBoundingClientRect()
    if (!v || !caja.width) return
    const p = Math.min(Math.max((e.clientX - caja.left) / caja.width, 0), 1)
    v.currentTime = p * (v.duration || 0)
    setT(v.currentTime)
  }

  return (
    /* Sin tabIndex: el marco ya no necesita el foco porque el teclado
       escucha en el documento. Los controles que sí son interactivos
       —play y velocidad— son botones y entran solos al orden de
       tabulación. */
    <div
      className={css.marco}
      data-corriendo={corriendo ? '' : undefined}
      style={ratio ? ({ '--rep-ratio': String(ratio) } as React.CSSProperties) : undefined}
    >
      <video
        className={css.video}
        ref={video}
        src={clip.url}
        muted
        playsInline
        preload="metadata"
        onClick={alternar}
        onPlay={() => setCorriendo(true)}
        onPause={() => setCorriendo(false)}
        onLoadedMetadata={(e) => {
          setDur(e.currentTarget.duration)
          const { videoWidth: w, videoHeight: h } = e.currentTarget
          if (w && h) setRatio(w / h)
        }}
      />

      <div className={css.controles}>
        {/* NO HAY BOTONES DE CUADRO. El paso vive sólo en las flechas del
            teclado: son más precisas —podés mantenerlas apretadas, con
            option saltás de a diez y con command a los bordes— y no hay
            que apuntarle a un botón de 24px mientras mirás otra cosa.
            Estuvieron y se sacaron. */}
        <button
          className={css.play}
          onClick={alternar}
          aria-label={corriendo ? 'Pause' : 'Play'}
        >
          <Glifo pausa={corriendo} />
        </button>

        <div
          className={css.pista}
          onPointerDown={(e) => {
            setArrastrando(true)
            e.currentTarget.setPointerCapture(e.pointerId)
            buscar(e)
          }}
          onPointerMove={(e) => arrastrando && buscar(e)}
          onPointerUp={(e) => {
            setArrastrando(false)
            e.currentTarget.releasePointerCapture(e.pointerId)
          }}
          role="slider"
          aria-label="Time"
          aria-valuemin={0}
          aria-valuemax={Math.round(dur * 1000)}
          aria-valuenow={Math.round(t * 1000)}
        >
          {/* Sin perilla: con el riel en 2px la posición la dice el
              llenado, y un círculo encima de una línea así de fina pesa
              más que la línea entera. */}
          <span className={css.riel} />
          <span className={css.lleno} style={{ transform: `scaleX(${avance})` }} />
        </div>

        {/* El número de cuadro es el dato que se viene a buscar: con él
            contás de dónde a dónde dura un gesto. El tiempo va al lado
            porque es lo que después escribís en el CSS. */}
        <div className={css.lectura}>
          <span className={css.tiempo}>{reloj(t)}</span>
          {indice !== null && (
            <span className={css.cuadro}>
              {indice}
              {totalCuadros ? `/${totalCuadros - 1}` : ''}
            </span>
          )}
        </div>

        {/* El toggle de benji: dos estados, y los dos textos apilados en
            la misma celda cruzándose por opacidad. Las etiquetas van con
            un decimal para que los dos estados midan igual — ver
            `etiqueta` arriba. */}
        <button
          className={css.velocidad}
          onClick={() => setVel((v) => (v === 1 ? 0.5 : 1))}
          aria-label={`Speed ${etiqueta(vel)}`}
        >
          {VELOCIDADES.map((v) => (
            <span key={v} data-activo={v === vel ? '' : undefined}>
              {etiqueta(v)}
            </span>
          ))}
        </button>
      </div>
    </div>
  )
}
