import type { AudioPlayer } from 'expo-audio'

/* ═══════════════════════════════════════════════════════════════
   EL SONIDO DEL COMMIT — al completar, si el iPhone no está en
   silencio, el sonido de éxito de Apple Pay: el que suena al pagar y al
   confirmar una compra o instalación en el App Store. Pedido de Vito
   (2026-09-07, "dejá el de Apple al descargar una app, bien timeado"),
   después de probar un arpegio, una campana, la moneda de los
   videojuegos, el pajarito de Berry y una voz.

   EL ARCHIVO ES DE APPLE: `media/purchase.wav` es `payment_success.caf`
   del runtime de iOS 26.2 (`/System/Library/Audio/UISounds/`), pasado a
   WAV 44.1 kHz mono 16 bit y subido de −11 a −1 dBFS de pico, porque el
   original viene bajo. ES UN ASSET DE APPLE y no se redistribuye: si
   este repo se hace público, ese archivo no viaja. RUNTIME
   (`.context/hold-to-commit/audio/medir-sonido.py`): re 6 (1176 Hz)
   durante 120 ms y re 7 (2352 Hz, una octava arriba) que decae ~1.1 dB
   cada 20 ms hasta apagarse a los 700 ms; 1.41 s de archivo con cola.

   BIEN TIMEADO. El sonido se dispara `ADELANTO_MS` antes del final del
   hold, desde el mismo reloj que el relleno (el progreso cruzando
   1 − adelanto/duración, en el hilo de UI), no desde el gesto: así
   absorbe lo que tarda el audio de iOS en salir por el parlante y la
   primera nota cae en el mismo cuadro que la ráfaga y la háptica, y la
   segunda, la que se oye como "ding", 120 ms después, mientras el pill
   blanquea. Es la misma coreografía que usa Apple: el sonido arranca
   con la animación de éxito. Si se suelta en esos últimos milisegundos,
   sonó igual: es el precio.

   UN REPRODUCTOR PRECALENTADO. Reusar uno con `seekTo(0)` + `play()`
   perdía golpes (el seek es asincrónico y el play le ganaba), y crear
   uno en el momento tardaba decenas de ms. El SIGUIENTE se crea y carga
   apenas se usa el anterior: al golpe llega uno listo, se toca y se
   suelta cuando termina.

   `playsInSilentMode: false` (el switch de silencio manda) y
   `mixWithOthers` (un efecto de UI no pausa lo que el usuario escucha).
   `expo-audio` es un módulo nativo: Expo Go lo trae, el dev client del
   simulador no hasta que se reconstruya; se pide con un `require` en un
   try, como el vidrio, y sin módulo no hay sonido y no pasa nada más.
   ═══════════════════════════════════════════════════════════════ */

/* SIN RECIBO · el archivo ya está a −1 dBFS; el reproductor, entero. */
const VOLUMEN = 1.0
/* SIN RECIBO · cuántos ms antes del final del hold se dispara: la
   latencia de salida del audio de iOS más un cuadro. */
export const ADELANTO_MS = 60
const FUENTE = require('./media/purchase.wav') as number

type Audio = {
  createAudioPlayer: (fuente: number) => AudioPlayer
  preload: (fuente: number) => Promise<void>
  setAudioModeAsync: (modo: { playsInSilentMode: boolean; interruptionMode: 'mixWithOthers' }) => Promise<void>
  setIsAudioActiveAsync: (activo: boolean) => Promise<void>
}
const audio: Audio | null = (() => {
  try {
    /* `require` a propósito: un `import` estático carga el módulo nativo al arrancar y no se puede envolver en un try. */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-audio') as Audio
  } catch {
    return null
  }
})()

let preparado = false
let listo: AudioPlayer | null = null

/* Arma el próximo reproductor, ya con el archivo, para que el golpe no
   tenga que esperar nada. */
function precalentar() {
  if (!audio) return
  try {
    listo = audio.createAudioPlayer(FUENTE)
    listo.volume = VOLUMEN
  } catch {
    listo = null
  }
}

/* Se llama una vez al montar el botón: sesión de audio activa, archivo
   en caché y un reproductor listo. */
export function prepararSonido() {
  if (!audio || preparado) return
  preparado = true
  audio.setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {})
  audio.setIsAudioActiveAsync(true).catch(() => {})
  audio.preload(FUENTE).catch(() => {})
  precalentar()
}

export function sonar() {
  if (!audio) return
  prepararSonido()
  const jugador = listo
  listo = null
  if (!jugador) {
    precalentar()
    return
  }
  jugador.play()
  /* el siguiente, ya mismo: el próximo golpe lo encuentra cargado */
  precalentar()
  let suelto = false
  const soltar = () => {
    if (suelto) return
    suelto = true
    try {
      jugador.remove()
    } catch {
      /* ya liberado */
    }
  }
  const escucha = jugador.addListener('playbackStatusUpdate', (estado) => {
    if (estado.didJustFinish) {
      escucha.remove()
      soltar()
    }
  })
  /* Por si el evento de fin no llega: el archivo dura 1.4 s. */
  setTimeout(soltar, 4000)
}
