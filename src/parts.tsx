import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import css from './app.module.css'
import type { Piece } from './pieces'
import { SITE } from './site'

/* ─── THE WAY BACK TO THE REFERENCE, AND IT IS NOT PUBLISHED ───
   The same two folds as the private area in app.tsx: with
   import.meta.env.DEV replaced by `false` on a build, the ternary folds
   to null, Rollup does not generate the chunk, and neither the
   component nor the string "/vault" reaches dist/.

   It is a lazy import and not a plain one for that exact reason: a
   static import would tie src/private/ to the bundle, which is the one
   direction the dependency is not allowed to go. */
const ReferenceLink = import.meta.env.DEV
  ? lazy(() => import('./private/reference-link'))
  : null
import { LiveDemo } from './demos'
import { Notes } from './notes'

/* Parts of the page, each one with a single responsibility. They live
   here and not in app.tsx so that app is left with the composition and
   nothing else. */

/* THE INTERCEPTOR OF A CLIENT-SIDE LINK. MEASURED: the list item of a
   served page is an <a href="/a-piece"> and a normal click navigates on
   the client, zero document requests, but cmd-click opens a new tab.

   It lets through everything the browser does better: any modifier key,
   and any button that is not the primary one. Only the plain click
   becomes client navigation. Without this there is no cmd-click, no
   middle click, and no "open in new tab" or "copy address" in the
   context menu.

   It lives here and not inside a component because two of them use it:
   the piece in the list and the tabs of the private area. It is the
   rule, not a detail of either one. */
function isPlainClick(e: MouseEvent<HTMLElement>) {
  if (e.defaultPrevented) return false
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false
  return e.button === 0
}

export function linkClick(action: () => void) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    action()
  }
}

/* THE SAME CLICK, BUT ON THE CARD AND NOT ON THE ANCHOR. The anchor
   covers the card with an ::after, but the preview goes ON TOP of that
   layer so the demo stays alive (the speed button of the video, the
   hover of a Web piece), so a click there does not land on the anchor.
   It bubbles up anyway, and here it turns into the same client
   navigation.

   There is no preventDefault because there is nothing to prevent: it is
   an <article>. And `defaultPrevented` filters two cases at once: the
   click the anchor already handled, and the demo's controls, which call
   preventDefault and stopPropagation on their own.

   ON THE PREVIEW THERE IS NO CMD-CLICK AND NO CONTEXT MENU, and that is
   a decision, not a debt: the anchor is not under the pointer there. On
   the title and on the rest of the card it is.

   Both ways out were tried and both are worse. Putting the anchor ON
   TOP of the preview gives cmd-click back and kills what the preview
   has inside: the four buttons of Buttons separate, the five rows of
   Select summary and the speed button of the video, which are exactly
   what you come to try. And redoing cmd-click by hand with window.open
   contradicts the rule of linkClick, let through everything the browser
   does better, and even then it does not bring the context menu back. */
export function cardClick(action: () => void) {
  return (e: MouseEvent<HTMLElement>) => {
    if (!isPlainClick(e)) return
    action()
  }
}

/* The BASELINE of a line of text: the line the letters sit on. It is
   what two texts get aligned by, and not the middle of their boxes: the
   index's lines are 13/16 and the page's are 14/20, so centering them
   leaves the letters sitting at two different heights.

   There is no API that gives it, so it gets measured with a probe: an
   inline-block of zero height with vertical-align:baseline sits exactly
   there, and since it has no height, its top edge IS the baseline. It
   goes in and comes out in the same tick, so React never sees it. */
export function textBaseline(el: HTMLElement) {
  const probe = document.createElement('span')
  probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
  el.appendChild(probe)
  const y = probe.getBoundingClientRect().top
  probe.remove()
  return y
}

export function Masthead() {
  return (
    <header className={css.mast}>
      <h1 className={css.mastTitle}>{SITE.name}</h1>
      <div className={css.mastSub}>{SITE.description}</div>
    </header>
  )
}

/* ONE CARD OF THE LIST: the title on top and the live preview below.
   The index uses the id to jump here.

   THE ANCHOR NO LONGER WRAPS THE WHOLE CARD. It was an <a> with
   everything inside, and an <a> cannot contain interactive content:
   inside the preview live the four <button> of a Web piece and the
   speed button of the video, a screen reader announced "button" inside
   "link", and tabbing through the list stopped on every one of them.
   Now the card is an <article>, the anchor wraps ONLY the title and
   stretches over the card with an ::after, which gives the clickable
   area back without putting anything inside again. The <article> picks
   up the click on the preview, and why that second path exists is
   written above cardClick.

   AND IT IS A REAL <a href>, not a button with pushState: with a
   button, a screen reader announces "button" and none of the
   affordances of a link are there. The interceptor that turns it into
   client navigation is above, in linkClick. */
export function Item({
  piece,
  onOpen,
  first,
}: {
  piece: Piece
  onOpen: (p: Piece) => void
  /* The first piece carries the mark the index aligns against: "Web"
     sits on the same line as this title. */
  first?: boolean
}) {
  /* IN THE LIST THE VIDEO STARTS WITH THE POINTER, as in the vault: the
     whole card is the trigger (aiming only at the video would leave
     half the card dead), it comes in with the mouse or with keyboard
     focus, it pauses on the way out and RESUMES where it was, without
     rewinding. What you come to look at is how it moves, and in a long
     list ten videos looping at once are noise and CPU. */
  const [active, setActive] = useState(false)
  const enter = () => setActive(true)
  const leave = () => setActive(false)
  return (
    /* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions --
       the keyboard path is NOT missing, it is in the `<a href>` inside:
       that link carries the same `onOpen` plus the `onFocus`/`onBlur`
       that turn the video on and off. The `onClick` on the article is
       only the convenience of the whole card being clickable with the
       mouse, and duplicating the handler up here with `onKeyDown` would
       give TWO activations per Enter on the link. */
    <article
      className={css.streamItem}
      id={piece.slug}
      onClick={cardClick(() => onOpen(piece))}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <div className={css.streamTitle} data-first-piece={first ? '' : undefined}>
        <a
          className={css.streamLink}
          href={`/${piece.slug}`}
          onClick={linkClick(() => onOpen(piece))}
          onFocus={enter}
          onBlur={leave}
        >
          {piece.name}
        </a>
      </div>
      <div className={css.streamPreview}>
        <Showcase piece={piece} mode="list" active={active} />
      </div>
    </article>
  )
}

/* ─── HOW A PIECE IS SHOWN ───
   `platform` decides it, which is the rule in pieces.ts: App is its
   recording, Web is the component RUNNING. The name → file map lives in
   demos.tsx. The same showcase serves the list and the detail, because
   the product decision is that the live preview is in both.

   The recording autoplays, muted and looping: here the movement IS the
   content, and it is what the measured demos do, 45 videos looping at
   once. The opposite rule in the playground (it starts
   still, a click wakes it) belongs to a study board where eight loops
   fight for your attention; an exhibition exists to show itself without
   being asked.

   The video takes the phone slot the box already reserved, the same
   width by token, and the height comes out of the file's aspect ratio,
   which in an iPhone recording is the phone's. The ::before that
   reserved that slot while it was empty turns itself off (see :has in
   app.module.css). */
/* ─── THE SPEED OF THE VIDEO ───
   MEASURED, read off served code: a button at the top right of the
   demo that toggles 1x ↔ 0.5x and writes
   `playbackRate`; the two labels sit on top of each other and cross by
   opacity, and the button changes width (1.75rem ↔ 2.5rem) with the
   same transition. Here it shows when the mouse passes over the video
   (the user's request); there it is always visible. The numbers are
   in app.module.css. The speed is written again on `loadedmetadata`
   because a change of source returns it to 1. */
const SPEEDS = [1, 0.5] as const
type Speed = (typeof SPEEDS)[number]

type Mode = 'list' | 'detail'

/* The first frame and nothing else, as in the vault: with
   preload="metadata" the browser decodes no image and the box stays
   black; the #t= fragment forces it to seek there and paint THAT frame.
   0.1 and not 0 because at 0 some containers do not have a key frame
   yet. */
const firstFrame = (url: string) => `${url}#t=0.1`

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/* THE READER'S THEME, for the pieces that have one recording per
   appearance. The whole site follows `prefers-color-scheme` from the
   CSS (tokens.css) and has no switch of its own, so the source of truth
   is that same query, listened to so that a change in the system shows
   without reloading. */
function useDarkScheme() {
  const [dark, setDark] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return dark
}

function Player({ piece, mode, active = false }: { piece: Piece; mode: Mode; active?: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const [speed, setSpeed] = useState<Speed>(1)
  const inList = mode === 'list'
  /* List: it plays while the card is active (pointer or focus) and
     pauses on the way out, without rewinding. With reduced-motion it
     does not start: the same as the vault, verified over there. */
  useEffect(() => {
    const v = video.current
    if (!v || !inList) return
    if (active && !prefersReducedMotion()) void v.play().catch(() => {})
    else v.pause()
  }, [inList, active])
  useEffect(() => {
    const v = video.current
    if (!v) return
    v.playbackRate = speed
    const apply = () => {
      v.playbackRate = speed
    }
    v.addEventListener('loadedmetadata', apply)
    return () => v.removeEventListener('loadedmetadata', apply)
  }, [speed])
  /* IT ONLY PLAYS WHAT YOU CAN SEE. A VP9 with alpha decodes in
     software (Chrome has no hardware path for alpha), and at 1120² and
     60 fps that is two decodes per frame; with the list growing, ten
     videos looping off screen are ten times that, fighting for the CPU
     with the one that is actually being watched. What the measured page
     does: its player mounts only when it enters the screen. Here it pauses and
     resumes with IntersectionObserver, and `preload="auto"` so that
     what is visible has the whole file before it starts. */
  useEffect(() => {
    const v = video.current
    if (!v || inList || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.1 },
    )
    observer.observe(v)
    return () => observer.disconnect()
  }, [inList])
  const other: Speed = speed === 1 ? 0.5 : 1
  /* THE RECORDING FOR THE READER'S THEME, if the piece has two. The
     `key` on the <video> is what makes the change: moving the `src` of
     a <source> that is already mounted does not reload anything without
     a `load()`, and remounting the element starts clean and asks for
     the speed again on `loadedmetadata`. A piece with a single
     recording has no `videoDark` and this does nothing. */
  const dark = useDarkScheme()
  const byTheme = dark && piece.videoDark
  const webm = (byTheme ? piece.videoDark : piece.video) ?? ''
  const hevc = byTheme ? piece.videoHevcDark : piece.videoHevc
  /* With alpha, the corners of the frame are transparent: rounding them
     is a mask over a 1120² layer per frame that changes nothing. It is
     turned off. */
  const videoClass = hevc ? `${css.demo} ${css.demoAlpha}` : css.demo
  /* In the list: no autoplay, the first frame and the metadata; the
     whole file only once it starts. In the detail: autoplay and full
     preload, this is the piece you came to see. */
  const source = inList ? firstFrame : (url: string) => url
  const common = {
    ref: video,
    muted: true,
    loop: true,
    playsInline: true,
    autoPlay: !inList,
    preload: inList ? ('metadata' as const) : ('auto' as const),
    disablePictureInPicture: true,
  }
  return (
    <div className={css.player}>
      {hevc ? (
        <video key={hevc} {...common} className={videoClass}>
          <source src={source(hevc)} type='video/quicktime; codecs="hvc1"' />
          <source src={source(webm)} type="video/webm" />
        </video>
      ) : (
        <video key={webm} {...common} className={css.demo} src={source(webm)} />
      )}
      <button
        type="button"
        className={css.speed}
        data-speed={speed}
        /* In the list the player lives inside the card's link: the click
           cannot bubble up, or it changes the speed AND navigates to the
           detail. */
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setSpeed(other)
        }}
        aria-label={`Speed ${speed}x. Change to ${other}x`}
      >
        {SPEEDS.map((v) => (
          <span key={v} data-active={v === speed}>
            {v}x
          </span>
        ))}
      </button>
    </div>
  )
}

function Showcase({ piece, mode, active }: { piece: Piece; mode: Mode; active?: boolean }) {
  /* With alpha, the video is transparent and the card puts the
     background: the .mov (HEVC with alpha) goes FIRST for Safari, which
     is the only one that opens it; Chrome and Firefox skip it by the
     type and take the WebM VP9 with alpha. The other way around, Safari
     would take the WebM and draw it over black. See Player. */
  if (piece.video) return <Player piece={piece} mode={mode} active={active} />
  if (piece.platform === 'Web') return <LiveDemo slug={piece.slug} mode={mode} />
  return null
}

/* The back arrow. It lives here and not inside Detail because two of
   them use it: the detail of a piece and the detail of a vault clip.
   The hover paints ONLY the glyph and not the 34×34 square, which is
   the click area and stays invisible. It is unanimous in both
   references and it is explained in app.module.css. */
/* `extraClass` exists for ONE case and it is worth saying which: .back
   carries a margin-bottom of 24 because it was born above a title, on
   its own row. Since the header of the vault's detail is ONE row (the
   arrow, the title and the toggle together, see the detail header in
   vault.module.css), that margin down there pushes the height of the
   row and knocks the arrow off center. The caller that needs it turns
   it off; the others never find out. */
/* ─── IT IS A CHEVRON, NOT AN ARROW ───
   It was "←", the character. Toolbars › Navigation changes that: it
   asks for the STANDARD Back and its symbol. "Use the standard Back and
   Close buttons. People know that the standard Back button lets them
   retrace their steps… Prefer the standard symbols for each, and don't
   use a text label that says Back". Apple's standard is a chevron.

   The arrow did not come from anywhere measured, and that is worth
   saying because the log went as far as citing two sites that use
   WORDS, "Index" and "Home", so neither one backed the "←". It was ours
   and it had no receipt.

   AND IT IS DRAWN, not written, for the same reason as the + in the
   grid: a glyph sits on the baseline, so inside a box it is never
   centered. 16×16 and a 1.5 stroke, the measurements of the rest of the
   glyphs; the tip at x=6 and the arms at 10 leave it exactly centered. */
export function Back({ onClick, extraClass }: { onClick: () => void; extraClass?: string }) {
  return (
    <button
      className={extraClass ? `${css.back} ${extraClass}` : css.back}
      aria-label="Back"
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M10 4 6 8l4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export function Detail({ piece, onBack }: { piece: Piece; onBack: () => void }) {
  return (
    <div className={css.content}>
      <div className={css.detail}>
        <Back onClick={onBack} />
        {/* THE DESCRIPTION GOES BELOW THE PIECE, not above. First you
            see the thing and then you read what it is: the list shows
            and the detail explains, so the prose comes in once the
            preview has already answered. Up top stays the pair that IS
            measured: a title and a secondary line 4px away, an <h1>
            with a <time>. */}
        <div className={css.detailHead}>
          <h1 className={css.detailTitle}>{piece.name}</h1>
          <div className={css.detailMeta}>{piece.platform}</div>
        </div>
        <div className={css.detailPreview} data-platform={piece.platform}>
          <Showcase piece={piece} mode="detail" />
        </div>
        {/* The line from PIECES is the way in, and the notes are what
            follows. They are two different things: this one is written
            when the piece is published and fits on one line; those live
            in src/components/pieces/<slug>/notes.tsx. A piece may have
            neither of the two: with no line the paragraph is not drawn,
            or it would leave its 24 px of margin empty (Swipeable tabs,
            2026-09-07: the title already says what it is). */}
        {piece.desc ? <p className={css.detailDesc}>{piece.desc}</p> : null}
        <Notes slug={piece.slug} />
        {/* LAST, AND AFTER THE NOTES, because it is the only thing on
            this page that is not the piece: it is where the piece came
            from. Reading order is the piece, what it is, how it works,
            and only then the reference behind it.

            No Suspense fallback: this draws nothing until it knows
            there is a clip, so a placeholder would reserve room for
            something that most of the time is not there. */}
        {ReferenceLink && (
          <Suspense fallback={null}>
            <ReferenceLink slug={piece.slug} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
