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
     de benji   el toggle de velocidad — dos estados (1x y 0.5x), NO un
                menú, con los dos textos cruzándose por opacidad para
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

export type Controles = 'esquinas' | 'barra'
export type Pista = 'fina' | 'media' | 'oculta'

export function Reproductor({
  clip,
  controles = 'barra',
  pista = 'media',
}: {
  clip: Clip
  controles?: Controles
  pista?: Pista
}) {
  const video = useRef<HTMLVideoElement | null>(null)
  const marco = useRef<HTMLDivElement | null>(null)
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

  /* El teclado sólo actúa cuando el foco está adentro del reproductor:
     un listener global se comería las flechas de toda la página. */
  useEffect(() => {
    const el = marco.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        mover(e.shiftKey ? 10 : 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        mover(e.shiftKey ? -10 : -1)
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        alternar()
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [mover, alternar])

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
    /* tabIndex para que el marco pueda recibir el foco y con él las
       flechas. El outline lo da el sistema. */
    <div
      className={css.marco}
      data-controles={controles}
      data-pista={pista}
      data-corriendo={corriendo ? '' : undefined}
      ref={marco}
      tabIndex={0}
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
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
      />

      <div className={css.controles}>
        {/* El transporte va junto —flechas y play— y no suelto: son una
            sola cosa, y agrupados se pueden mandar de una a un rincón sin
            que cada uno tenga que saber dónde caer. Sin esto, en la
            variante de esquinas se pisaban entre ellos. */}
        <div className={css.transporte}>
          {/* Las flechas de cuadro. Se deshabilitan cuando el contenedor
              no dio el dato, en vez de moverse "más o menos un cuadro" —
              que es justamente lo que este reproductor existe para no
              hacer. */}
          <button
            className={css.paso}
            onClick={() => mover(-1)}
            disabled={!cuadro}
            aria-label="Un cuadro atrás"
          >
            ◀
          </button>
          <button
            className={css.paso}
            onClick={() => mover(1)}
            disabled={!cuadro}
            aria-label="Un cuadro adelante"
          >
            ▶
          </button>
          <button
            className={css.play}
            onClick={alternar}
            aria-label={corriendo ? 'Pausar' : 'Reproducir'}
          >
            <Glifo pausa={corriendo} />
          </button>
        </div>

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
          aria-label="Tiempo"
          aria-valuemin={0}
          aria-valuemax={Math.round(dur * 1000)}
          aria-valuenow={Math.round(t * 1000)}
        >
          <span className={css.riel} />
          <span className={css.lleno} style={{ transform: `scaleX(${avance})` }} />
          <span className={css.perilla} style={{ left: `${avance * 100}%` }} />
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

        {/* El toggle de benji: dos estados, y los dos textos superpuestos
            con inset:0 cruzándose por opacidad. Sin eso el botón cambia
            de ancho entre "1x" y "0.5x" y la barra salta. */}
        <button
          className={css.velocidad}
          onClick={() => setVel((v) => (v === 1 ? 0.5 : 1))}
          aria-label={`Velocidad ${vel}x`}
        >
          {VELOCIDADES.map((v) => (
            <span key={v} data-activo={v === vel ? '' : undefined}>
              {v}x
            </span>
          ))}
        </button>
      </div>
    </div>
  )
}
