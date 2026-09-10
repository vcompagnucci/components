import type { AudioPlayer } from 'expo-audio'

/* ═══════════════════════════════════════════════════════════════
   THE COMMIT SOUND — on completion, if the iPhone is not on silent,
   Apple Pay's success sound: the one that plays when you pay and when
   you confirm a purchase or an install in the App Store. Vito asked for
   it (2026-09-07, "use Apple's one from downloading an app, timed
   right"), after trying an arpeggio, a bell, the videogame coin, Berry's
   little bird and a voice.

   THE FILE IS APPLE'S: `media/purchase.wav` is `payment_success.caf`
   from the iOS 26.2 runtime (`/System/Library/Audio/UISounds/`),
   converted to WAV 44.1 kHz mono 16 bit and raised from −11 to −1 dBFS
   peak, because the original comes in quiet. IT IS AN APPLE ASSET and
   it is not redistributed: if this repo goes public, that file does not
   travel. RUNTIME
   (`.context/hold-to-commit/audio/medir-sonido.py`): D6 (1176 Hz) for
   120 ms and D7 (2352 Hz, an octave up) decaying ~1.1 dB every 20 ms
   until it dies out at 700 ms; 1.41 s of file with the tail.

   TIMED RIGHT. The sound fires `LEAD_MS` before the end of the hold,
   from the same clock as the fill (the progress crossing
   1 − lead/duration, on the UI thread), not from the gesture: that
   absorbs however long iOS audio takes to come out of the speaker, and
   the first note lands in the same frame as the burst and the haptics,
   and the second one, the one you hear as a "ding", 120 ms later, while
   the pill whitens. It is the same choreography Apple uses: the sound
   starts with the success animation. If you release in those last few
   milliseconds, it played anyway: that is the price.

   A PREHEATED PLAYER. Reusing one with `seekTo(0)` + `play()` dropped
   hits (the seek is asynchronous and the play beat it), and creating
   one on the spot took tens of ms. The NEXT one is created and loaded
   as soon as the previous one is used: the hit finds one ready, plays
   it and releases it when it finishes.

   `playsInSilentMode: false` (the silent switch wins) and
   `mixWithOthers` (a UI effect does not pause what the user is
   listening to). `expo-audio` is a native module: Expo Go ships it, the
   simulator's dev client does not until it gets rebuilt; it is asked for
   with a `require` inside a try, like the glass, and with no module
   there is no sound and nothing else happens.
   ═══════════════════════════════════════════════════════════════ */

/* NO RECEIPT · the file is already at −1 dBFS; the player, all the way up. */
const VOLUME = 1.0
/* NO RECEIPT · how many ms before the end of the hold it fires: the
   output latency of iOS audio plus one frame. */
export const LEAD_MS = 60
const SOURCE = require('./media/purchase.wav') as number

type Audio = {
  createAudioPlayer: (source: number) => AudioPlayer
  preload: (source: number) => Promise<void>
  setAudioModeAsync: (mode: { playsInSilentMode: boolean; interruptionMode: 'mixWithOthers' }) => Promise<void>
  setIsAudioActiveAsync: (active: boolean) => Promise<void>
}
const audio: Audio | null = (() => {
  try {
    /* `require` on purpose: a static `import` loads the native module at startup and cannot be wrapped in a try. */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-audio') as Audio
  } catch {
    return null
  }
})()

let prepared = false
let ready: AudioPlayer | null = null

/* Builds the next player, file and all, so that the hit does not have to
   wait for anything. */
function createNextPlayer() {
  if (!audio) return
  try {
    ready = audio.createAudioPlayer(SOURCE)
    ready.volume = VOLUME
  } catch {
    ready = null
  }
}

/* Called once when the button mounts: audio session active, file cached
   and one player ready. */
export function prepareSound() {
  if (!audio || prepared) return
  prepared = true
  audio.setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {})
  audio.setIsAudioActiveAsync(true).catch(() => {})
  audio.preload(SOURCE).catch(() => {})
  createNextPlayer()
}

export function playSound() {
  if (!audio) return
  prepareSound()
  const player = ready
  ready = null
  if (!player) {
    createNextPlayer()
    return
  }
  player.play()
  /* the next one, right now: the next hit finds it loaded */
  createNextPlayer()
  let released = false
  const release = () => {
    if (released) return
    released = true
    try {
      player.remove()
    } catch {
      /* already released */
    }
  }
  const listener = player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) {
      listener.remove()
      release()
    }
  })
  /* In case the finish event never arrives: the file lasts 1.4 s. */
  setTimeout(release, 4000)
}
