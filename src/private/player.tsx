import { useCallback, useEffect, useRef, useState } from 'react'
import css from './player.module.css'
import type { Clip } from './clips'

/* ═══════════════════════════════════════════════════════════════
   THE PLAYER

   It exists for ONE thing: reaching the exact frame where a gesture
   starts, counting up to where it ends, and getting the duration in
   milliseconds. Everything else is in service of that.

   WHAT WAS MEASURED is in .context/recon/vault/REPRODUCTOR.md:

     from apple   the play/pause button: 38×38, a 20 icon, and its exact
                  colors in light and in dark. 28 videos of theirs use
                  it, so it renders for real
     from benji   the speed toggle: two states (1.0x and 0.5x), NOT a
                  menu, with the two texts crossing over by opacity so
                  the button does not change width. 45 elements

   WHAT HAS NO REFERENCE is the time track. Safari's native controls
   have the shadow root closed, apple-events' full player does not mount
   its controls outside a real session, and Podcasts and x.com ask for a
   login. So the track is OURS and it gets said that way, instead of
   being attributed to somebody.

   THE FRAME STEP is not estimated: it comes from reading the file's
   container (scripts/frames.mjs), and it is validated against the
   browser in 9 out of 9 clips.
   ═══════════════════════════════════════════════════════════════ */

/* benji's two, and in that order: his button starts at 1x. */
export const SPEEDS = [1, 0.5] as const

/* ALWAYS ONE DECIMAL: "1.0x", not "1x".
   It is not cosmetic, it is what makes the two states measure the same.
   With tabular figures (the ones the readout next to it already uses)
   "1.0x" and "0.5x" both give 25.06px, measured, so the button can take
   the width of its content without the row jumping or the air changing
   when it toggles. The long explanation is in .speed, in the CSS.
   And along the way it is how an instrument that measures writes: 0:00,
   0/255, 1.0x, all with the same number of digits every time. */
const label = (v: number) => `${v.toFixed(1)}x`

/* The icons are ours (two trivial shapes) and not apple's: we copy
   their measurements, not their drawing. They go with `currentColor`
   instead of the mask he uses; the effect is the same (the icon's color
   is a CSS property, themeable and animatable) with one piece less. */
function Glyph({ pause }: { pause: boolean }) {
  return (
    <svg className={css.glyph} viewBox="0 0 20 20" aria-hidden focusable="false">
      {pause ? (
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

const clock = (s: number) => {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${String(r).padStart(2, '0')}`
}

export function Player({ clip }: { clip: Clip }) {
  const video = useRef<HTMLVideoElement | null>(null)
  /* The clip's ratio. The CSS needs it so the element IS the image
     instead of a box with the image inside and a strip at the side; see
     .video in player.module.css. It comes from the metadata, which is
     the only place it exists: the index does not bring it. */
  const [ratio, setRatio] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState<number>(1)
  const [dragging, setDragging] = useState(false)

  const frameStep = clip.frameStep
  const frameCount = clip.frameCount

  /* The time is read on every screen frame and not with `timeupdate`,
     which fires about 4 times per second: with that the track advances
     in visible jumps and the frame number lies almost always. */
  useEffect(() => {
    let request = 0
    const read = () => {
      const v = video.current
      if (v && !dragging) setTime(v.currentTime)
      request = requestAnimationFrame(read)
    }
    request = requestAnimationFrame(read)
    return () => cancelAnimationFrame(request)
  }, [dragging])

  const toggle = useCallback(() => {
    const v = video.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }, [])

  /* ONE EXACT FRAME. It computes the index of the current frame, adds
     the direction, and looks for the MIDDLE of the target frame instead
     of its edge: asking for exactly N·step lands right on the border
     between two frames and the browser can resolve to either of them.
     With the middle there is no ambiguity. */
  const step = useCallback(
    (dir: number) => {
      const v = video.current
      if (!v || !frameStep) return
      v.pause()
      const i = Math.floor(v.currentTime / frameStep)
      const target = Math.min(Math.max(i + dir, 0), (frameCount ?? Infinity) - 1)
      v.currentTime = (target + 0.5) * frameStep
    },
    [frameStep, frameCount],
  )

  /* TO THE EDGES. Same criterion as `step`: it lands in the MIDDLE of
     the first or the last frame, not on the clip's edge. Asking for
     exactly `duration` leaves the video in the ended state and which
     frame it shows there depends on the browser; asking for 0 is safe
     (there is no border below it) but the middle is used anyway so the
     frame number comes out by the same path at both ends.

     With no frame metadata it falls back to the duration minus a hair,
     which is the best that can be said without knowing how long a frame
     lasts. */
  const toEdge = useCallback(
    (dir: number) => {
      const v = video.current
      if (!v) return
      v.pause()
      if (dir < 0) {
        v.currentTime = frameStep ? frameStep * 0.5 : 0
        return
      }
      const end = Number.isFinite(v.duration) ? Math.max(v.duration - 0.001, 0) : 0
      /* It is bounded against the duration: `frameCount` comes from
         rounding and can end up half a frame past the file's real
         end. */
      v.currentTime =
        frameStep && frameCount ? Math.min((frameCount - 0.5) * frameStep, end) : end
    },
    [frameStep, frameCount],
  )

  /* THE KEYBOARD LISTENS ON THE DOCUMENT, not on the player.

     It was tied to the player's focus, and that way it failed exactly
     in the case that gets used most: you click the video to pause it
     (which does NOT give focus to the player, because the click lands
     on the <video>) and from then on the arrows do nothing. You were
     left paused and with no keyboard.

     Now that the visible arrows are gone, the keyboard is the ONLY way
     to frame-by-frame, so it cannot depend on where the focus ended up.
     And the listener only exists while a clip is open.

     THE ARROWS ARE FOUR GESTURES:

       alone     one frame
       option    ten frames, the coarse jump to cross a whole gesture
                 without letting go of the key. shift does the same and
                 it stays: it was already there and it costs nothing
       command   to the beginning or the end of the clip

     command+arrow is the browser's back/forward, so the
     `preventDefault` in that branch is not cosmetic: without it you
     leave the page instead of jumping to the end of the video.

     AND THAT IS EXACTLY WHY FOCUS DOES MATTER FOR THE ARROWS. The
     details panel next to it has the title, the source and the notes:
     text fields where option+arrow jumps by word and command+arrow goes
     to the beginning or the end of the line. Stealing them while you
     type breaks what everyone on a mac does without thinking, so in a
     field the player does not touch the arrows. In a BUTTON it does
     touch them (buttons do not use arrows) so that after pressing play
     you go on stepping frame by frame.

     The space bar is skipped in any control, buttons included: if you
     are on the play one, the browser already activates it with the
     space and doing it twice would go back to the previous state. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey) return
      const target = e.target as HTMLElement | null
      const focusIn = (sel: string) =>
        target instanceof HTMLElement && (!!target.closest(sel) || target.isContentEditable)

      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (dir) {
        if (focusIn('input, textarea, select')) return
        e.preventDefault()
        if (e.metaKey) toEdge(dir)
        else step(dir * (e.altKey || e.shiftKey ? 10 : 1))
        return
      }

      if (e.metaKey || e.altKey) return
      if ((e.key === ' ' || e.key === 'k') && !focusIn('button, input, textarea, select')) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [step, toEdge, toggle])

  useEffect(() => {
    const v = video.current
    if (v) v.playbackRate = speed
  }, [speed])

  const index = frameStep ? Math.floor(time / frameStep) : null
  const progress = duration > 0 ? time / duration : 0

  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const v = video.current
    const box = e.currentTarget.getBoundingClientRect()
    if (!v || !box.width) return
    const p = Math.min(Math.max((e.clientX - box.left) / box.width, 0), 1)
    v.currentTime = p * (v.duration || 0)
    setTime(v.currentTime)
  }

  return (
    /* No tabIndex: the player no longer needs focus because the keyboard
       listens on the document. The controls that are interactive (play
       and speed) are buttons and they enter the tab order on their
       own. */
    <div
      className={css.player}
      data-playing={playing ? '' : undefined}
      style={ratio ? ({ '--player-ratio': String(ratio) } as React.CSSProperties) : undefined}
    >
      <video
        className={css.video}
        ref={video}
        src={clip.url}
        muted
        playsInline
        preload="metadata"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
          const { videoWidth: w, videoHeight: h } = e.currentTarget
          if (w && h) setRatio(w / h)
        }}
      />

      <div className={css.controls}>
        {/* THERE ARE NO FRAME BUTTONS. Stepping lives only in the
            keyboard arrows: they are more precise (you can hold them
            down, with option you jump by ten and with command to the
            edges) and you do not have to aim at a 24px button while
            looking at something else. They were there and they were
            taken out. */}
        <button
          className={css.play}
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          <Glyph pause={playing} />
        </button>

        <div
          className={css.track}
          onPointerDown={(e) => {
            setDragging(true)
            e.currentTarget.setPointerCapture(e.pointerId)
            seek(e)
          }}
          onPointerMove={(e) => dragging && seek(e)}
          onPointerUp={(e) => {
            setDragging(false)
            e.currentTarget.releasePointerCapture(e.pointerId)
          }}
          role="slider"
          aria-label="Time"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration * 1000)}
          aria-valuenow={Math.round(time * 1000)}
        >
          {/* No knob: with the rail at 2px the position is said by the
              fill, and a circle on top of a line that thin weighs more
              than the whole line. */}
          <span className={css.rail} />
          <span className={css.fill} style={{ transform: `scaleX(${progress})` }} />
        </div>

        {/* The frame number is the value you come here for: with it you
            count from where to where a gesture lasts. The time goes next
            to it because it is what you write into the CSS
            afterwards. */}
        <div className={css.readout}>
          <span className={css.time}>{clock(time)}</span>
          {index !== null && (
            <span className={css.frameNumber}>
              {index}
              {frameCount ? `/${frameCount - 1}` : ''}
            </span>
          )}
        </div>

        {/* benji's toggle: two states, and the two texts stacked in the
            same cell crossing over by opacity. The labels go with one
            decimal so the two states measure the same, see `label`
            above. */}
        <button
          className={css.speed}
          onClick={() => setSpeed((v) => (v === 1 ? 0.5 : 1))}
          aria-label={`Speed ${label(speed)}`}
        >
          {SPEEDS.map((v) => (
            <span key={v} data-active={v === speed ? '' : undefined}>
              {label(v)}
            </span>
          ))}
        </button>
      </div>
    </div>
  )
}
