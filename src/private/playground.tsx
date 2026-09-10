import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import css from './playground.module.css'
import dlg from './vault.module.css'
import { Back, linkClick } from '../parts'
import { nameOfPath, publishClip, useClips, type Clip } from './clips'
import { Dialog, PublishDialog, Menu, useLast, type Where } from './actions'
import acc from './actions.module.css'
import { UNNAMED, newId, useViews, type Frame, type View } from './views'
import {
  SKETCHES,
  Sketch,
  createSketch,
  sketchName,
  publishSketch,
  freeRef,
} from './sketches'

/* ═══════════════════════════════════════════════════════════════
   THE PLAYGROUND: where things get built.

   IT IS SEVERAL VIEWS, like walking into different designs in Figma.
   This one here is the list of all of them; each one is a canvas.

   It lives in the URL the same as the vault's open clip, and for the
   same reason: without that, the trackpad's back gesture takes you out
   of the whole playground instead of closing the view. /playground/<id>.
   ═══════════════════════════════════════════════════════════════ */

export function Playground({
  open,
  go,
  actionsSlot,
}: {
  open: string
  go: (path: string) => void
  actionsSlot: HTMLElement | null
}) {
  const { status, create, remove, update, undo, redo } = useViews()
  /* The vault's index is asked for UP HERE, before any conditional
     return, and both views use it: the list for drawing the previews
     and the canvas for resolving each frame. It is also the only way
     for no hook to end up behind an `if`. That already broke this page
     once. */
  const clips = useClips()
  /* The right-click menu and its two dialogs, UP HERE and before the
     first conditional return. Putting them below already broke the
     sibling page once (five hooks on load and six after is "Rendered
     more hooks than during the previous render") and the grid stopped
     drawing. */
  const [menu, setMenu] = useState<{ view: View; where: Where } | null>(null)
  const [renaming, setRenaming] = useState<View | null>(null)
  const [deleting, setDeleting] = useState<View | null>(null)

  /* ONE single layer for the menu and its two dialogs. The subject
     comes out of the state (the view the menu was opened over, or the
     one in a dialog) the same as in the vault.

     And with useLast for the same reason as over there: this value
     falls to null on the same frame the exit would have to start, so
     without it the layer unmounts and there is nothing to animate. It
     goes up here for the same reason as the three useState above: it is
     a hook, and below there are three conditional returns. */
  const subject = useLast(menu?.view ?? renaming ?? deleting)

  /* ─── ⌘Z AND ⇧⌘Z, ACROSS THE WHOLE PLAYGROUND ───
     Up here and not inside the canvas: undo counts the same in the grid
     (where views get created, renamed and deleted) as inside one. It is
     the same document.

     IN CAPTURE, and that is the only delicate part of this effect. The
     private area already had a ⌘Z that did `history.back()` (see
     private.tsx, which wrote it down for the day the playground had
     real actions: that day is today). Both listen on `document`, so who
     wins would depend on the order they mounted in, and the order of
     React's effects is not something you can build on. In capture this
     one ALWAYS runs first, marks the event with preventDefault, and the
     one over there steps aside when it sees the mark.

     And IT KEEPS THE KEY even when there is nothing to undo: inside the
     playground ⌘Z means "undo what I did", and having it throw you out
     of the page with an empty stack would be the worst possible
     surprise. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      /* IN A TEXT FIELD THE BROWSER RULES. There ⌘Z is undo what you are
         typing, letter by letter, and it does it better than we do,
         besides which overriding it would leave a view's name with no
         way at all to fix a typo. Our undo of the rename acts when the
         focus is outside. */
      const t = e.target as HTMLElement | null
      if (t?.closest?.('input, textarea') || t?.isContentEditable) return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [undo, redo])

  if (status.loading) return null

  if (!status.connected) {
    return (
      <div className={css.playground}>
        <p className={css.notice}>
          Vault not connected: {status.reason}. Views are stored next to your clips.
        </p>
      </div>
    )
  }

  const view = open ? status.views.find((v) => v.id === open) : null

  if (view)
    return (
      <Canvas
        /* THE KEY IS THE VIEW. Switching canvases has to throw away the
           selection, the dialog and any half-finished gesture: they are
           THAT canvas's state and not the playground's. With the key,
           React unmounts it and mounts it again, so there is not one
           cleanup `useEffect` to maintain. */
        key={view.id}
        view={view}
        update={update}
        deleteView={remove}
        go={go}
        clips={clips.status.loading || !clips.status.connected ? null : clips.status.clips}
      />
    )

  const newView = () => {
    const v = create(UNNAMED)
    go('/playground/' + v.id)
  }

  /* ─── THE + AND NOT THE WORD ───
     It was a text button saying "New view". Now it is THE SAME + the
     vault uses to upload clips: the 32 circle with the 16 glyph and a
     1.5 stroke, its two fills and its hover, all copied from .plus (see
     vault.module.css, and down here in the CSS with the citation).

     It is ONE action, so it is ONE control: having the word and the
     circle for the same thing would be saying it twice. And the + here
     already means "add content" (it is the only glyph in the chrome,
     and it is accepted because it needs no translation and no context)
     so in the view that lists creatable things it means exactly what it
     has to mean. The aria-label is a word, for whoever hears it instead
     of seeing it. */
  const addButton = (
    <button className={css.plus} aria-label="New view" onClick={newView}>
      <Plus />
    </button>
  )

  const layer = subject ? (
    <>
      <Menu
        where={menu?.where ?? null}
        label={subject.name}
        onClose={() => setMenu(null)}
        /* Title capitalization, which is what Menus › Labels asks for:
           "use title-style capitalization... capitalizes every word
           except articles, coordinating conjunctions, and short
           prepositions". No ellipsis, the same as the clip's menu and
           for the same reason. See ClipMenu in actions.tsx. */
        items={[
          { text: 'Rename View', action: () => setRenaming(subject) },
          /* Deleting a view is the same as sending a clip to the trash,
             so it is marked the same: red and with the hairline in
             front. The rule lives in the Menu, not here. */
          { text: 'Delete View', action: () => setDeleting(subject), destructive: true },
        ]}
      />
      <RenameViewDialog
        view={subject}
        open={renaming?.id === subject.id}
        onClose={() => setRenaming(null)}
        onRename={(n) => update(subject.id, (v) => ({ ...v, name: n }))}
      />
      <DeleteViewDialog
        view={subject}
        open={deleting?.id === subject.id}
        onClose={() => setDeleting(null)}
        onDelete={() => remove(subject.id)}
      />
    </>
  ) : null

  return (
    <div className={css.playground}>
      {layer}
      {actionsSlot && createPortal(addButton, actionsSlot)}
      {status.views.length === 0 ? (
        <p className={css.notice}>No views yet.</p>
      ) : (
        <div className={css.viewGrid}>
          {status.views.map((v) => (
            <Card
              key={v.id}
              view={v}
              clips={clips.status.loading || !clips.status.connected ? null : clips.status.clips}
              go={go}
              onMenu={(x, w) => setMenu({ view: x, where: w })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   THE BOARD: THE RULES OF THE CANVAS

   It is a STUDY BOARD and not a document: things are where you left
   them, and moving them is grabbing them. From that come the three
   decisions that govern everything below.

   ─── 1. INSTANT RESPONSE, AND 1:1 ───
   During a gesture NOTHING GOES THROUGH REACT STATE. The pointer moves,
   and what gets written is the node's `style`, directly. One `setState`
   per frame is two renders and a tree diff inside a 16ms budget, and it
   is exactly the mistake the performance rule names: animating with
   React instead of animating with the compositor. On release, once,
   the commit to the model happens.

   And the displacement goes in `transform`, which is the only property
   the browser can composite without doing layout again. `left`/`top`
   per frame reflow the whole board.

   ─── 2. NO MOMENTUM ───
   Letting go leaves the frame WHERE IT IS. Inertia is for lists that
   scroll, where the content keeps existing past the edge; here the
   frame is an object on a table and a table has no inertia.

   ─── 3. NO ANIMATING THE LAYOUT ───
   There is no transition on `left`, `top`, `width` or `height`. Moving
   a frame with the arrow keys has to land on the pixel you asked for,
   not slide toward it: if the movement takes time, you stop being able
   to count how many times you pressed.
   ═══════════════════════════════════════════════════════════════ */

/* ─── THE WHOLE FRAME FITS ON THE BOARD, ALWAYS ───
   All four edges, at every moment: while you drag it, while you resize
   it, when you add it, and when mounting stored coordinates that ended
   up outside (it corrects them and stores them corrected).

   There was a soft margin here, "leave 48px visible", with iOS rubber
   banding and a spring that gathered it back on release. IT LEFT, and
   for a reason you can see in a capture: the board clips (`overflow:
   hidden`), so the part that went out did not stretch, it DISAPPEARED
   under the sidebar, and the handles of that corner ended up painting
   over the chrome. Rubber banding needs the excess to be visible; on a
   clipped canvas there is nowhere to show it.

   The hard limit also means that letting go corrects NOTHING: the
   position is already clamped on every frame of the drag, so there is
   no jump to cushion at the end. That is the reason this gesture does
   not have a single spring: there is no correction to smooth.

   HOW MUCH YOU HAVE TO MOVE FOR IT TO BE A DRAG. Below this the gesture
   was a CLICK, which selects, and not a movement. Without a threshold,
   the hand's tremor while clicking shifts the frame a pixel or two and
   the selection stops being free. */
const DRAG_THRESHOLD = 6

/* THE LONGER SIDE DOES NOT GO BELOW THIS. Smaller than this a clip
   stops being lookable and becomes a stamp, and since the aspect ratio
   is preserved, clamping the longer side clamps both. */
const MIN_LONG_SIDE = 80

/* AND THE SERVER CLAMPS EACH SIDE between 40 and 8000 (see
   sanitizeViews). It is respected on this side too: a frame stored
   differently from how it looks comes back moved when you reload. */
const SERVER_LIMITS = { min: 40, max: 8000 }

/* WHAT SIZE A FRAME IS BORN AT. 480 on the longer side, preserving the
   clip's aspect ratio: it is the size at which a recording still reads
   next to two others and several still fit on the board. */
const INITIAL_LONG_SIDE = 480

/* THE PROVISIONAL SIZE, for when the clip could not be measured yet
   (the element did not load, or the frame was added by the vault, which
   has none mounted). It is 16/9, the most common aspect ratio of what
   is in the vault, and it corrects itself: see `measured`. It has to
   match the one in views.ts, which is the other path a frame is born
   by. */
const PROVISIONAL = { width: 480, height: 270 }

/* THE CASCADE. A new frame goes to the center of the board, and each
   one that was already there shifts it 24 down and to the right so they
   do not cover each other. It starts over every 8 (24×8 = 192, half a
   screen) because without the modulo frame number 40 is born off the
   board. */
const CASCADE = 24
const CASCADE_STEPS = 8

/* HOW LONG A FRAME'S EXIT LASTS, in milliseconds, for the JavaScript
   side. The real value is --dur-text (100ms) and the CSS applies it;
   the same number is here because the frame has to stay mounted while
   it lasts. If one changes the other has to change. It is said on both
   sides. */
const EXIT_DURATION = 100

/* THE KEYBOARD STEP. 1 to place and 10 with Shift to travel, which is
   the scale every editor uses. */
const STEP = 1
const LONG_STEP = 10

const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

/* The four corners, in the order they are drawn. The letter says which
   EDGE you grab: 'n' top, 's' bottom, 'w' left, 'e' right. The anchor
   is always the opposite corner. */
const CORNERS = ['nw', 'ne', 'sw', 'se'] as const
type Corner = (typeof CORNERS)[number]

/* For whoever hears them. In English, like all the interface text. */
const CORNER_NAME: Record<Corner, string> = {
  nw: 'Top left',
  ne: 'Top right',
  sw: 'Bottom left',
  se: 'Bottom right',
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/* WHERE THE TOP LEFT CORNER CAN BE so the whole box stays inside. The
   `max(0, …)` covers the degenerate case of a frame bigger than the
   board: there the range closes at 0 and the frame sticks to the corner
   instead of inverting. */
function clampPosition(x: number, y: number, width: number, height: number, board: DOMRect) {
  return {
    x: Math.round(clamp(x, 0, Math.max(0, board.width - width))),
    y: Math.round(clamp(y, 0, Math.max(0, board.height - height))),
  }
}

/* AND THE BIGGEST SIZE THAT FITS, with the aspect ratio intact. It is
   needed at two moments: when adding a clip in a small window, and when
   mounting a stored view in a window smaller than the one you put it
   together in. Shrinking is the only honest way out. Cropping would
   hide half the clip without saying so. */
function fitSize(width: number, height: number, board: DOMRect) {
  const k = Math.min(board.width / width, board.height / height, 1)
  return k >= 1
    ? { width, height }
    : sizeFrom(width, height, Math.floor(Math.max(width, height) * k))
}

/* A FRAME FITTED TO THE BOARD: first it fits, then it is placed. It
   returns the SAME object if there was nothing to correct, and on that
   depends the effect that calls it not scheduling a write to disk on
   every render. */
function fitFrame(f: Frame, board: DOMRect): Frame {
  const s = fitSize(f.width, f.height, board)
  const p = clampPosition(f.x, f.y, s.width, s.height, board)
  const same = s.width === f.width && s.height === f.height && p.x === f.x && p.y === f.y
  return same ? f : { ...f, ...s, ...p }
}

/* THE SIZE COMES OUT OF THE LONGER SIDE AND THE ASPECT RATIO, always.
   Deforming a clip is lying about what you recorded, so the width and
   the height are never two independent values: there is one, and the
   other is derived. */
function sizeFrom(w: number, h: number, side = INITIAL_LONG_SIDE) {
  if (!w || !h) return PROVISIONAL
  return w >= h
    ? { width: side, height: Math.round((side * h) / w) }
    : { width: Math.round((side * w) / h), height: side }
}

/* HOW FAR IT CAN SHRINK AND GROW, all expressed in width because the
   height derives from it. The two bounds below are the translation of
   the two rules:

     the LONGER side does not go below 80  →  r ≥ 1: width ≥ 80
                                              r < 1: height ≥ 80, that
                                              is, width ≥ 80r
     no side leaves the server's range (40 … 8000)

   With the aspect ratio tied, both are solved in a single pair. */
function clampWidth(width: number, r: number, ceiling = Infinity) {
  const min = Math.max(MIN_LONG_SIDE * Math.min(1, r), SERVER_LIMITS.min * Math.max(1, r))
  const max = Math.min(SERVER_LIMITS.max, SERVER_LIMITS.max * r, ceiling)
  /* The minimum wins if the two cross: on a board smaller than 80px we
     prefer a frame that sticks out to one of 3px. It is a case that
     only exists by shrinking the window down to almost nothing. */
  return clamp(width, min, Math.max(min, max))
}

/* What a gesture has to remember while it lasts. It lives in a ref and
   not in state: none of this redraws anything. */
type Gesture = {
  pointer: number
  /* null is dragging; a corner is resizing. */
  corner: Corner | null
  /* Where the pointer started and how the frame was at that moment.
     Everything is computed against THIS and not against the previous
     frame: accumulating deltas frame by frame drags the rounding error
     along and the frame ends up shifted from where the hand is. */
  px: number
  py: number
  x: number
  y: number
  width: number
  height: number
  board: DOMRect
  moved: boolean
  /* The last thing drawn, which is what gets stored on release. */
  last: { x: number; y: number; width: number; height: number }
}

/* RESIZE WITH THE ASPECT RATIO TIED.

   The anchor is the corner OPPOSITE the one you grabbed, and it does
   not move: that is what makes resizing feel like stretching a photo on
   the table and not like the frame running away.

   Since the aspect ratio rules, the pointer almost never lands exactly
   on the corner: you have to pick which of the two axes wins. THE ONE
   THAT ASKS FOR MORE wins, the maximum of the two, so the frame always
   reaches the pointer on at least one axis, and is never short on
   both. */
function resized(g: Gesture, cx: number, cy: number) {
  const r = g.width / g.height
  const west = g.corner === 'nw' || g.corner === 'sw'
  const north = g.corner === 'nw' || g.corner === 'ne'
  const ax = west ? g.x + g.width : g.x
  const ay = north ? g.y + g.height : g.y
  /* The pointer in the board's coordinates, which is the system x/y
     live in. */
  const px = cx - g.board.left
  const py = cy - g.board.top
  /* HOW FAR IT CAN GROW WITHOUT CROSSING A WALL. The anchor does not
     move, so whatever board there is on its side is all the ceiling
     that exists, and since the aspect ratio is tied, the height's
     ceiling translates into width by multiplying it by r. The smaller
     of the two wins.

     Without this, stretching from a bottom corner pushed the frame off
     the board and the clamp ended up correcting its position: the
     corner you were holding ran away on its own. */
  const limitX = west ? ax : g.board.width - ax
  const limitY = north ? ay : g.board.height - ay

  /* ─── THE PROJECTION CARRIES A SIGN, NOT AN ABSOLUTE VALUE ───
     There was a `Math.abs(px - ax)` here and it was a bug you could
     see: taking the handle PAST the anchor made the distance grow again
     and the frame got bigger in mirror image. Measured by the critique
     dragging the `se` handle to the left: at −395 the frame reached its
     floor of 80×45, and at −600 it already measured 200×113 and at
     −900, 500×281. Pushing further away MADE IT BIGGER.

     The sign fixes it at the root. Each axis is projected in the
     direction that anchor lets it grow (to the right if the anchor is
     the left edge, to the left if it is the right one) so crossing it
     gives a negative. The `max(0, …)` takes it to zero and the floor of
     80 does the rest: past the anchor the frame stays at its minimum,
     which is the only thing "smaller than nothing" can mean. */
  const towardX = west ? -1 : 1
  const towardY = north ? -1 : 1
  const requested = Math.max(0, (px - ax) * towardX, (py - ay) * towardY * r)
  const width = Math.round(clampWidth(requested, r, Math.min(limitX, limitY * r)))
  const height = Math.round(width / r)
  /* The rounding can leave the box a pixel outside the ceiling, so the
     position goes through the clamp anyway: the guarantee that nothing
     leaves the board cannot depend on a `round`. */
  return {
    ...clampPosition(west ? ax - width : ax, north ? ay - height : ay, width, height, g.board),
    width,
    height,
  }
}

/* ─── THE MEDIA OF A FRAME ───
   The clip fills the whole frame, with the system's radius. There is no
   box, no air and no caption: on a board what you study is the movement
   and everything else would be a frame around it.

   ─── THE VIDEO STARTS STILL, AND A CLICK WAKES IT ───
   It does not autoplay. A board gets put together with six or eight
   clips at a time and eight looping videos at a time are not a wall of
   references: they are eight things fighting for your attention while
   you try to look at ONE. Playing becomes a decision, and the decision
   is the click you were already making to select.

   NO BUTTON, NO CONTROLS, NO OVERLAY. What you look at is the clip; a
   play triangle on top would be the first thing on the board that is
   not content. The frame IS the control.

   And THE PLAYBACK STATE IS EPHEMERAL: it does not enter the model, it
   is not stored in the vault and ⌘Z never touches it. It is where you
   are looking, not what you did, the same reason the selection is not
   undoable either. Reloading leaves everything still again, which is
   the state you enter to look at things in. */
function Media({
  frame,
  clip,
  known,
  onMeasure,
}: {
  frame: Frame
  clip: Clip | null
  /* If the vault's index has not arrived yet, whether the clip exists
     is not known: "it is not there" is not the same as "I do not know
     yet". */
  known: boolean
  onMeasure: (w: number, h: number) => void
}) {
  /* A SKETCH IS YOUR CODE AND IT DRAWS ITSELF. It goes before
     everything else because it has no clip and would fall into the
     placeholder below. Everything about it (loading it, reloading it on
     save, and not taking the board down when it is half finished) lives
     in sketches.tsx. */
  if (frame.kind === 'sketch') return <Sketch sketchRef={frame.ref} />

  /* THE PLACEHOLDER. A piece of ours, which is not drawn yet, or a clip
     that is no longer in the vault, because you renamed it or sent it
     to the trash. In both cases the frame STAYS and says what it
     pointed at: disappearing without warning would break the board
     without anybody noticing, and with the `ref` in sight you can put
     it back. Still: there is nothing to play. */
  if (frame.kind === 'piece' || (!clip && known)) {
    /* THE NAME IS SHOWN, NOT THE PATH. A frame stores
       "web/sheet-that-stretches.png" and that is a fact about a disk:
       what you have to read is "Sheet that stretches", which is what
       the clip was called when it was there. It is resolved by the same
       function that names the vault's cards (nameOfPath, in clips.ts),
       so both views say the same name.

       NO GUESSING at a new path. If the file was renamed, the reference
       broke and that is that: looking for "something similar" in the
       index can get it right and can put another clip there, and a
       board that rewrites itself is worse than one that says so.

       And underneath, ONE WORD that says why it is empty. Without it
       the frame reads as a clip that is still loading. */
    const isPiece = frame.kind === 'piece'
    return (
      <div className={css.placeholder}>
        <span className={css.placeholderName}>
          {isPiece ? frame.ref : nameOfPath(frame.ref)}
        </span>
        {/* "Piece" and not "Missing" when it is a piece of ours:
            nothing is missing, it is that the canvas does not draw them
            yet. Today nothing creates frames of that kind (the model
            allows for them and the interface does not yet) so this
            branch is the scaffolding for that feature and it is said
            here. */}
        <span className={css.placeholderReason}>{isPiece ? 'Piece' : 'Missing'}</span>
      </div>
    )
  }

  /* Not known yet: the surface alone, with no text. Putting the "it is
     not there" up too early would make the file name flicker on every
     reload. */
  if (!clip) return <div className={css.placeholder} />

  if (clip.medium === 'video') {
    return (
      <video
        className={css.media}
        /* THE FIRST FRAME, STILL. `preload="metadata"` decodes no image
           and the box stays black; the #t= fragment forces the browser
           to seek there and paint THAT frame. 0.1 and not 0 because at
           0 some containers do not have a key frame yet. It is the same
           trick the vault's card and the thumbnails of the view grid
           use. */
        src={firstFrame(clip.url)}
        preload="metadata"
        /* The three of them stay for when it DOES play: without `muted`
           a play() fired by a click can bounce off the autoplay policy,
           and `loop` is what makes a two-second gesture watchable twenty
           times without touching anything. */
        muted
        loop
        playsInline
        /* The real size arrives with the metadata, and it is what
           corrects a frame born with the provisional aspect ratio. */
        onLoadedMetadata={(e) => onMeasure(e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
      />
    )
  }
  return (
    <img
      className={css.media}
      src={clip.url}
      alt=""
      /* An image's NATIVE drag steals the gesture from ours: the browser
         raises a ghost and stops sending pointermove. */
      draggable={false}
      onLoad={(e) => onMeasure(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
    />
  )
}

/* ─── A FRAME ON THE BOARD ───
   It is drawn where the model says and it moves by writing the node.
   The whole gesture (down, move, release) lives in here: it is the only
   thing that knows where its own node is.

   WHAT GETS ANIMATED AND WHAT DOES NOT, said once because it is the
   decision that governs this whole component:

     the drag and the resize   NO, not one millisecond. They are direct
       manipulation: the frame is glued to the pointer and any curve
       there is latency dressed up as smoothness. And since the limit is
       hard, releasing corrects nothing either: there is not one snap to
       cushion
     appearing, leaving, and the selection    YES, and in CSS, because
       they are state changes and not gestures. They live in the frame's
       child (.media) and in the handles, that is, in nodes the gesture
       never writes: that is why the two things cannot fight over the
       same `transform`
   */
function FrameBox({
  frame,
  clip,
  label,
  known,
  selected,
  isNew,
  leaving,
  layer,
  measureBoard,
  onSelect,
  onMove,
  onMeasure,
  onMenu,
}: {
  frame: Frame
  clip: Clip | null
  /* What this is called for whoever hears it instead of seeing it. */
  label: string
  known: boolean
  selected: boolean
  isNew: boolean
  leaving: boolean
  layer: number
  measureBoard: () => DOMRect | null
  onSelect: (id: string) => void
  onMove: (id: string, to: { x: number; y: number; width: number; height: number }) => void
  onMeasure: (id: string, w: number, h: number) => void
  /* The right click: what you can do with THIS frame. The menu and its
     dialogs live in the Canvas (there is one for the whole board, like
     the vault's layer) and here we only say where it was opened. */
  onMenu: (id: string, x: number, y: number) => void
}) {
  const box = useRef<HTMLDivElement | null>(null)
  const gesture = useRef<Gesture | null>(null)
  const startGesture = (e: ReactPointerEvent<HTMLElement>, corner: Corner | null) => {
    /* Only the primary button. The right one opens menus and the middle
       one pastes: neither of the two drags. */
    if (e.button !== 0) return

    /* ─── INSIDE A SELECTED SKETCH THE SKETCH RULES ───
       A sketch is YOUR component and you have to be able to press its
       buttons. But this handler calls `preventDefault` and takes the
       pointer, so if the gesture started here the click would never get
       inside.

       The split is by SELECTION, which is what board editors do:
       unselected, the sketch does not receive the pointer (the CSS
       turns it off) and the frame drags like any other; selected, the
       pointer passes through and the board steps aside. To move it
       again, Escape, which deselects, and drag.

       The handles stay out of the exception on purpose: they belong to
       the frame, not to the sketch, and resizing has to work always. */
    if (!corner && (e.target as HTMLElement).closest?.('[data-sketch]')) return

    const el = box.current
    const board = measureBoard()
    if (!el || !board) return
    /* So the board does not read it as "a click in the void", which
       deselects. */
    e.stopPropagation()
    /* And so the browser does not start a text selection or a native
       drag with whatever is inside. */
    e.preventDefault()

    /* NOTHING IS EVER "BUSY". A gesture has to be able to start at any
       instant, and here that comes free: nobody animates the frame's
       position (the limit is hard, so releasing corrects nothing and
       there is no spring to interrupt) so the model's value IS the
       presentation value. What does animate on entering and leaving is
       the frame's CHILD, and the child takes no part in the gesture. */

    /* THE CAPTURE GOES ON THE FRAME, including when the gesture started
       on a handle: from here on every event for this pointer arrives
       here even if the hand leaves the node, or the window, and the
       gesture does not get cut halfway. */
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* It throws NotFoundError if the pointer no longer exists (it was
         lifted between the event being dispatched and this frame).
         Without capture the gesture keeps working as long as the hand
         does not leave the node, so it carries on instead of breaking
         the whole drag. */
    }
    /* THE CLICK ALSO FOCUSES. The `preventDefault` above turns off the
       focus the browser would give on its own, so it is given back by
       hand: without this, touching a frame would select it without
       focusing it and the screen reader would be left talking about
       something else.
       `preventScroll` because the focus has no reason to move the
       page. */
    el.focus({ preventScroll: true })

    gesture.current = {
      pointer: e.pointerId,
      corner,
      px: e.clientX,
      py: e.clientY,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      board,
      moved: false,
      last: { x: frame.x, y: frame.y, width: frame.width, height: frame.height },
    }

    /* IT SELECTS ON POINTER DOWN and not on release: if you wait for
       the click, starting to drag a frame that was not selected moves
       it without selecting it, and you let go with no handles. A click
       with no movement goes through here anyway, so a bare click also
       selects. */
    onSelect(frame.id)
  }

  const moveGesture = (e: ReactPointerEvent<HTMLElement>) => {
    const g = gesture.current
    const el = box.current
    if (!g || !el || g.pointer !== e.pointerId) return
    const dx = e.clientX - g.px
    const dy = e.clientY - g.py
    /* THE THRESHOLD. Below this nothing has been decided yet: it can be
       a click with a pulse. Once it is past, the drag commits and never
       asks again. */
    if (!g.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    g.moved = true

    if (!g.corner) {
      /* 1:1 AGAINST THE POINT YOU GRABBED, not against the frame's
         center: the delta is measured from px/py, so the point of the
         clip you had under your finger stays under your finger for the
         whole drag. */
      const p = clampPosition(g.x + dx, g.y + dy, g.width, g.height, g.board)
      g.last = { ...g.last, ...p }
      /* TRANSFORM, not left/top: it is the only one of the four the
         browser composites without doing layout on the board again. And
         the node is written directly, without going through React.
         Against the wall the transform stops growing and the frame
         stays: inside the limits the tracking is exactly 1:1, and
         outside there is nothing to track. */
      el.style.transform = `translate3d(${p.x - g.x}px, ${p.y - g.y}px, 0)`
      return
    }

    /* Resizing DOES change the box, so no transform will do: scaling
       the node would scale the video with it and what you see would
       stop having the file's pixels. The four properties get written,
       just as directly. */
    const s = resized(g, e.clientX, e.clientY)
    g.last = s
    el.style.left = `${s.x}px`
    el.style.top = `${s.y}px`
    el.style.width = `${s.width}px`
    el.style.height = `${s.height}px`
  }

  const endGesture = (e: ReactPointerEvent<HTMLElement>) => {
    const g = gesture.current
    const el = box.current
    if (!g || !el || g.pointer !== e.pointerId) return
    gesture.current = null
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    /* ─── A CLEAN CLICK TOGGLES PLAYBACK ───
       There is nothing to store (the selection already happened on
       pointerdown) but there is something to do: if the gesture never
       reached the 6px threshold, it was a click, and a click on a video
       wakes it or puts it to sleep.

       THAT IT LIVES HERE AND NOT IN AN onClick is the reason it works:
       `moved` is the same bit that decides whether there was a drag, so
       releasing after moving CANNOT toggle anything. A separate onClick
       would fire at the end of a drag too (the browser emits click
       after a pointerup on the same element) and every time you placed
       a clip it would turn on or off.

       None of this touches the model: play/pause is not stored and not
       undone. See the block in Media. */
    if (!g.moved) {
      const video = el.querySelector('video')
      if (video) {
        /* play() returns a promise WebKit REJECTS if the element
           unmounts or is paused before it starts, deleting the frame on
           the same tick, for example. Without the catch that reaches
           the console as an uncaught error. */
        if (video.paused) video.play().catch(() => {})
        else video.pause()
      }
      return
    }

    /* THE NODE IS LEFT AT THE FINAL VALUE, it is not cleaned up. It is
       subtle and it is the difference between working and flickering:
       React only writes a `style` property when its value CHANGED from
       the previous render, so clearing `left` by hand leaves the node
       with no `left` in every case where the commit did not move it. By
       writing the final value, the node is already where the model is
       going to say and the render that follows writes the same thing or
       writes nothing. Both branches end the same. */
    const f = g.last
    /* The transform does get cleared: React never writes it, so
       removing it cannot leave anything dangling. */
    el.style.transform = ''
    el.style.left = `${f.x}px`
    el.style.top = `${f.y}px`
    el.style.width = `${f.width}px`
    el.style.height = `${f.height}px`
    onMove(frame.id, f)
  }

  return (
    <div
      ref={box}
      className={css.frame}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        /* THE STACKING COMES OUT OF THE ARRAY'S ORDER, but by z-index
           and not by reordering the DOM. See `drawOrder` in the
           Canvas. */
        zIndex: layer,
      }}
      /* ─── IT CAN BE REACHED WITHOUT A POINTER ───
         Before this the board was literally inoperable with a keyboard:
         the frames were bare <div>s with no role, no name and no
         tabIndex, so tabbing on the canvas jumped from the sidebar to
         the body and back. Measured by the critique: `frameFocusable:
         false`.

         `option` inside a `listbox` is the only pair of roles in the
         standard where `aria-selected` means something, and selecting
         is exactly what you do here. A departure from the canonical
         pattern is accepted (it wants ONE single tab stop and moving
         between options with the arrow keys) because on a canvas the
         arrow keys already have a more important job: MOVING the frame,
         which is the reason the screen exists. With one stop per frame
         you reach all of them with Tab and the arrows stay free for
         that.

         The name is the clip's, not its path: it is the same thing you
         read on the vault's card and in the placeholder of a missing
         clip. */
      role="option"
      tabIndex={0}
      aria-selected={selected}
      aria-label={label}
      data-selected={selected ? '' : undefined}
      data-new={isNew ? '' : undefined}
      data-leaving={leaving ? '' : undefined}
      /* THE FOCUS IS THE SELECTION. They are not two states to keep in
         sync: reaching a frame with Tab selects it, and that is why
         `startGesture` also focuses it on a click. A system ring over
         an unselected frame would be two things pointing at different
         places. */
      onFocus={() => onSelect(frame.id)}
      onPointerDown={(e) => startGesture(e, null)}
      onPointerMove={moveGesture}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      /* The right click belongs to the frame, not to the browser and
         not to the board. It works the same inside a selected sketch:
         the event bubbles up from the content to here. */
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onMenu(frame.id, e.clientX, e.clientY)
      }}
    >
      <Media
        frame={frame}
        clip={clip}
        known={known}
        onMeasure={(w, h) => onMeasure(frame.id, w, h)}
      />
      {/* THE HANDLES ARE ALWAYS IN THE DOM and what changes is whether
          they are visible. Mounting and unmounting them with the
          selection would force animating the entrance with
          @starting-style and the exit would not exist, the node leaves
          first; with a transition on an attribute, selecting and
          deselecting quickly crosses in mid-air instead of restarting.
          Switched off they receive no pointer, so they do not steal a
          pixel of hit area from the frame. */}
      {CORNERS.map((q) => (
        <span
          key={q}
          className={css.handle}
          data-corner={q}
          /* Named, but OUT of the tab order: four more stops per frame
             would turn Tab into a maze, and resizing with the keyboard
             does not exist yet. Written down as a debt: the day it
             exists, this becomes tabIndex 0. */
          role="button"
          tabIndex={-1}
          aria-label={`${CORNER_NAME[q]} resize handle`}
          onPointerDown={(e) => startGesture(e, q)}
        />
      ))}
    </div>
  )
}

/* THE HOUSE'S +. The same glyph the vault uses to upload clips: two
   strokes, currentColor, and a 1.5 stroke because the icon carries the
   optical weight of the text next to it.

   IT IS SVG AND NOT THE "+" CHARACTER: a glyph rests on the baseline,
   so inside a circle it is never centered. It is measured in vault.tsx,
   and this way the stroke falls 0.00px from the center of the box.
   `linecap: round` because the rest of the system does not have a
   single sharp corner. */
function Plus() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WHAT YOU CAN DO WITH A VIEW: the right click on its card.

   It is the same menu and the same dialogs as the vault's, and that is
   NOT a resemblance: they are literally Menu and Dialog from
   actions.tsx, with the surface, the entrance that scales from the
   cursor's corner, the flip against the edges and the three ways to
   close. Here we only put in what they say.

   That it is the same menu is the reason it exists: the right click
   already meant "what can I do with this" over a clip, and a view is
   the other thing there is in this app.
   ═══════════════════════════════════════════════════════════════ */
function RenameViewDialog({
  view,
  open,
  onClose,
  onRename,
}: {
  view: View
  open: boolean
  onClose: () => void
  onRename: (n: string) => void
}) {
  const [name, setName] = useState(view.name)
  /* The draft starts from zero every time it opens: if you cancelled
     and come back in, what you see is the name there is, not what you
     had typed last time. */
  useEffect(() => {
    if (open) setName(view.name)
  }, [open, view.name])

  const save = () => {
    const n = name.trim()
    if (!n) return
    onRename(n)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className={acc.title}>Rename view</h2>
      {/* The field LOOKS like a field here and not in the sidebar, and
          the difference is not a whim: in the sidebar you write over a
          title that is already in place; here the dialog exists ONLY
          for you to write, so the cursor has to know where to land
          before you start. It is the note on .field in
          actions.module.css. */}
      <input
        className={acc.field}
        value={name}
        autoFocus
        aria-label="View name"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
      <div className={acc.footer}>
        <button className={acc.action} onClick={onClose}>
          Cancel
        </button>
        <button
          className={acc.action}
          data-primary=""
          disabled={!name.trim() || name === view.name}
          onClick={save}
        >
          Rename
        </button>
      </div>
    </Dialog>
  )
}

function DeleteViewDialog({
  view,
  open,
  onClose,
  onDelete,
}: {
  view: View
  open: boolean
  onClose: () => void
  onDelete: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className={acc.title}>Delete “{view.name}”?</h2>
      {/* THERE IS NO TRASH HERE, BUT THERE IS ⌘Z, and the text says both
          things. This comment used to say that deleting a view was
          final. That was true when it was written and stopped being
          true the day the playground got history. The critique measured
          it: ⌘Z brings it back whole, with its frames and its
          positions.

          And it says until when. The history lives in memory, so the
          resurrection lasts as long as the session: promising "it can
          be undone" flat out would have somebody reload with a clear
          conscience and lose the work. The limit is part of the
          promise.

          The other thing it makes clear is what is actually scary: the
          clips are not touched. What you lose is the arrangement. */}
      <p className={acc.message}>
        This deletes the view and its arrangement. The clips stay in your vault. Cmd+Z brings it
        back until you reload.
      </p>
      <div className={acc.footer}>
        <button className={acc.action} onClick={onClose}>
          Cancel
        </button>
        <button
          className={acc.action}
          data-primary=""
          onClick={() => {
            onDelete()
            onClose()
          }}
        >
          Delete view
        </button>
      </div>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════════
   A VIEW'S CARD: the playground's list.

   THE GRID IS THE VAULT'S, which is openai.com/news's measured whole
   with /web-clone: 1440 max and a 32 rail (the frame sets those), a 24
   gutter, and the cuts from 3 → 2 → 1 column at 767 and 560. The
   numbers, their receipts and the why of each one are in
   vault.module.css, in .grid and in .vault; here they get reused
   without arguing them again, because it is the same class of content
   (a wall of lookable things) in the same app.

   And THE CARD IS THE VAULT'S CARD: benji's aspect ratio
   (--vault-aspect-ratio), the system's radius, the --surface
   background, and the name underneath with its same gap. The only
   different thing is what is inside the box.

   ─── THE PREVIEW IS THE COMPOSITION, NOT A CLIP ───
   The whole view is drawn small, like the thumbnail of a Figma file:
   the bounding box of all the frames is fitted into the card's box, and
   each frame is drawn scaled in its relative place. That way the card
   says HOW THE VIEW IS PUT TOGETHER and not which clip you put in it
   last.

   NOTHING PLAYS HERE. The videos go with the first frame still
   (preload="metadata" and the #t=0.1 fragment, the same trick the
   vault's card and the upload dialog use). Five views of six clips
   would be thirty videos decoding in a loop just to pick which one to
   walk into: the movement is what you come to look at INSIDE the
   canvas, not in the hallway.
   ═══════════════════════════════════════════════════════════════ */

/* The first frame and nothing else. A <video> with preload="metadata"
   decodes no image and the box stays black; the #t= fragment forces the
   browser to seek there and paint THAT frame. 0.1 and not 0 because at
   0 some containers do not have a key frame yet. It is the same one as
   in vault.tsx, and it is repeated and not imported because it is four
   characters: bringing it over would tie this file to the whole module
   of the vault's grid. */
const firstFrame = (url: string) => `${url}#t=0.1`

/* The box that contains ALL the frames, in the board's coordinates. It
   is what gets fitted into the card: without it you would have to
   assume a board size, which changes with the window, and the thumbnail
   would lie about where things ended up. */
function boundingBox(frames: Frame[]) {
  const x0 = Math.min(...frames.map((f) => f.x))
  const y0 = Math.min(...frames.map((f) => f.y))
  const x1 = Math.max(...frames.map((f) => f.x + f.width))
  const y1 = Math.max(...frames.map((f) => f.y + f.height))
  return { x: x0, y: y0, width: Math.max(x1 - x0, 1), height: Math.max(y1 - y0, 1) }
}

function Preview({ view, clips }: { view: View; clips: Clip[] | null }) {
  /* An empty view leaves the surface bare. A still card is fine: it
     says "there is nothing here" without writing it, which is what the
     empty box of a clip that did not load already does. */
  if (view.frames.length === 0) return null

  const box = boundingBox(view.frames)
  return (
    /* IT IS FITTED WITH `contain`, done by hand and not with object-fit:
       what gets scaled is not an image but a group of nodes, so the
       layout does the scaling. The trick is to draw the bounding box as
       a block with the SAME aspect ratio it has on the board and let the
       browser center it, so a landscape board and a vertical one use
       the same code and both end up centered on both axes. */
    <div className={css.preview}>
      <div
        className={css.previewBox}
        /* The bounding box's ratio travels as a CUSTOM PROPERTY and not
           as a direct `aspect-ratio` because the CSS needs it twice: for
           the box's aspect ratio and inside the calc() that decides
           which of the two sides rules. An inline `aspect-ratio` only
           serves the first one. */
        style={{ ['--preview-ratio' as string]: box.width / box.height }}
      >
        {view.frames.map((f) => {
          const clip = clips?.find((c) => c.path === f.ref) ?? null
          /* The percentages are against the bounding box, so the
             thumbnail does not need to know how many pixels it
             measures: the same preview works in a 443 card and in a 240
             one. */
          const pos = {
            left: `${((f.x - box.x) / box.width) * 100}%`,
            top: `${((f.y - box.y) / box.height) * 100}%`,
            width: `${(f.width / box.width) * 100}%`,
            height: `${(f.height / box.height) * 100}%`,
          }
          /* With no clip, a rectangle and nothing else. At this scale a
             name would be three pixels tall: noise shaped like text.
             The tone is --surface-hover, one step above the card's
             background, which is the minimum for seeing that there IS a
             frame there without saying anything else. */
          if (!clip) return <span className={css.previewPlaceholder} key={f.id} style={pos} />
          return (
            <div className={css.previewFrame} key={f.id} style={pos}>
              {clip.medium === 'video' ? (
                <video src={firstFrame(clip.url)} preload="metadata" muted playsInline />
              ) : (
                <img src={clip.url} alt="" loading="lazy" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Card({
  view,
  clips,
  go,
  onMenu,
}: {
  view: View
  clips: Clip[] | null
  go: (path: string) => void
  onMenu: (v: View, w: { x: number; y: number }) => void
}) {
  return (
    /* It is a real <a href>, with the same interceptor as the vault's
       card and as the product's piece: a bare click navigates on the
       client side and cmd-click opens the view in a new tab. Without
       this there is no cmd-click, no middle click, and no "copy
       address" in the context menu. See linkClick in parts.tsx. */
    <a
      className={css.card}
      href={'/playground/' + view.id}
      onClick={linkClick(() => go('/playground/' + view.id))}
      /* The right click opens what you can DO with the view. It goes on
         the whole card and not on the preview's box, for the same
         reason as the normal click: the name underneath is the view
         too, and leaving it dead would force you to aim at the
         image. */
      onContextMenu={(e) => {
        e.preventDefault()
        onMenu(view, { x: e.clientX, y: e.clientY })
      }}
    >
      <div className={css.cardMedia}>
        <Preview view={view} clips={clips} />
      </div>
      <div className={css.cardName}>{view.name}</div>
    </a>
  )
}

/* ═══════════════════════════════════════════════════════════════
   A VIEW'S CANVAS: the sidebar and the board.

   IT IS THE ONLY FULL-BLEED SCREEN IN THE WHOLE APP. It does not carry
   the 1440 rail, or the tab bar, or the 80 of air on top: a canvas is
   all there is, and every pixel you take from it is one pixel less of
   board. That is why private.tsx turns off its bar on this route (see
   `inCanvas` over there) and why there is no max-width here.

   ALL THE CHROME LIVES IN THE SIDEBAR, not one word floats over the
   board. It is the same reason the handles are the only thing drawn on
   top of a frame: what is over the board is content, and what belongs
   to the application is off to the side. Floating, on top of that, no
   word could guarantee contrast. Underneath there can be a clip of any
   color.

   This component owns the selection, the keyboard and what gets added:
   the three things that count for the whole board and not for one
   frame. */
function Canvas({
  view,
  update,
  deleteView,
  go,
  clips,
}: {
  view: View
  /* The label is the history's: two calls in a row with the same one
     merge into a single undo step. See MERGE in views.ts. */
  update: (id: string, f: (v: View) => View, label?: string | null) => void
  deleteView: (id: string) => void
  go: (path: string) => void
  /* The clips come out of the same index as the vault's: a frame stores
     the PATH and nothing else, so what gets drawn is always the file as
     it is now and not an old copy. It arrives by prop and not by a hook
     of its own because the Playground already asked for it for the
     list's previews: two `useClips()` would be the same request twice.
     `null` is "I do not know yet", which is not the same as "it is not
     there". */
  clips: Clip[] | null
}) {
  const board = useRef<HTMLDivElement | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  /* ─── WHICH FRAMES HAVE JUST APPEARED ───
     The set of ids from this render is compared against the previous
     one's. Everything that was not there BEFORE comes in fading,
     wherever it comes from: a clip you added, and also one ⌘Z has just
     brought back.

     This used to be a single id that `place` set, and that is why
     undoing a delete had no arrival: deleting said goodbye in 100ms and
     the frame came back all at once. Now both halves of the gesture are
     complete and there is no list of paths to maintain. Any future way
     of making a frame appear inherits it on its own.

     IT IS READ IN THE RENDER AND UPDATED IN AN EFFECT, which is the
     "previous value" pattern. It has to be that way: `@starting-style`
     only looks at the node's FIRST render, so marking it a render later
     (from state) would arrive too late and nothing would animate.
     StrictMode's double render does not break it: the comparison is
     against the same ref and gives the same answer both times.
     `null` the first time means "I have not seen anything yet", and
     with that the frames that were already there when you opened the
     view do NOT fade in. */
  const seen = useRef<Set<string> | null>(null)
  /* THE FRAME THAT IS LEAVING. It stays in the model and in the DOM
     while its exit lasts: without this, deleting takes it out on the
     same frame and there is nothing to animate. An unmounted element
     cannot say goodbye. The real removal is done by `removeFrame`, when
     the transition has finished. */
  const [leaving, setLeaving] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  /* The confirmation for deleting THIS view. It is the same dialog the
     grid uses from its right click: there were two levels of protection
     for the same label (over there it asked you, here it deleted and
     navigated) and nobody decided that difference. */
  const [deleting, setDeleting] = useState(false)
  /* ─── THE RIGHT CLICK ON A FRAME: PUBLISH ───
     Add to Exhibition lives here, and not in the vault, because YOUR
     work is here: the vault is what is external. Which piece comes out
     is said by the frame (a sketch publishes a live Web one, a
     recording publishes an App one) so the dialog does not ask for a
     platform. One layer for the whole board, with useLast so the exit
     has something to animate, the same as the vault's. */
  const [frameMenu, setFrameMenu] = useState<{ frame: Frame; where: Where } | null>(null)
  const [publishing, setPublishing] = useState<Frame | null>(null)
  const subjectFrame = useLast(frameMenu?.frame ?? publishing)
  /* ─── THE SIDEBAR COLLAPSES, AND ONLY BY KEYBOARD ───
     There is no visible control and that is on purpose: an explicit
     request that the canvas's chrome not change. The panel is drawn the
     same as always; the only new thing is that it can leave.

     IT STARTS VISIBLE AND IT IS NOT REMEMBERED. The first is Apple's
     (Sidebars says not to hide it by default, so it stays discoverable)
     and the second falls out on its own: `key={view.id}` remounts the
     Canvas when you switch views, so every canvas opens whole. With no
     persistence there is no way to end up locked out with no panel and
     no idea why. */
  const [panelOpen, setPanelOpen] = useState(true)

  const measureBoard = () => board.current?.getBoundingClientRect() ?? null
  /* The ancestor that moves the board when it collapses. It is needed
     to listen for the END of its transition. See the fitting effect,
     further down. */
  const canvas = useRef<HTMLDivElement | null>(null)

  const ids = view.frames.map((f) => f.id)
  const appeared = seen.current === null ? [] : ids.filter((id) => !seen.current!.has(id))
  useEffect(() => {
    seen.current = new Set(ids)
  })

  /* A frame is ALWAYS drawn in the same place in the DOM. The array's
     order is the stacking order, but translating it by moving nodes has
     two costs: reordering a node is taking it out and putting it back
     (which drops the pointer capture in the middle of a drag) and it
     forces the browser to repaint everything that moved. With the DOM
     still and the stacking by z-index neither of the two happens.
     The draw order is by id: it is arbitrary, but it is STABLE, which
     is the only thing asked of it. */
  const layers = new Map(view.frames.map((f, i) => [f.id, i]))
  const drawOrder = [...view.frames].sort((a, b) => (a.id < b.id ? -1 : 1))
  /* The selected frame as DATA, not as an id: it is read by the
     sidebar's publish action and nothing else. Derived on every render.
     The source of truth is still `selected`. */
  const selectedFrame = view.frames.find((f) => f.id === selected) ?? null

  /* SELECTING BRINGS TO THE FRONT. It is what makes "touch what you
     want to look at" enough to unstack two overlapping frames, with no
     ordering menu. It goes to the end of the array, which is what draws
     on top. */
  const select = (id: string | null) => {
    /* ─── TOUCHING THE BOARD TAKES THE FOCUS OFF THE NAME ───
       A <div> is not focusable, so clicking a frame does NOT take the
       focus off the sidebar's field: it stays there, invisible, and
       then the board's keyboard stops working in silence (Backspace
       deletes a letter of the name instead of the selected frame, and
       the arrow keys move the text cursor). Measured: it happens every
       time you rename a view and then touch a clip.

       The keyboard's guard does the right thing and is not touched;
       what was missing was this, which is what any canvas does: looking
       at something on the table is stopping writing. */
    const focused = document.activeElement
    if (focused instanceof HTMLElement && focused.closest('input, textarea')) focused.blur()

    setSelected(id)
    if (!id) return
    /* If it is already on top nothing is touched: without this guard,
       every click would schedule a write to disk identical to the
       previous one. */
    if (view.frames[view.frames.length - 1]?.id === id) return
    update(
      view.id,
      (v) => {
        const i = v.frames.findIndex((f) => f.id === id)
        if (i < 0) return v
        return { ...v, frames: [...v.frames.slice(0, i), ...v.frames.slice(i + 1), v.frames[i]] }
      },
      /* IT IS STORED BUT IT DOES NOT SPEND AN UNDO STEP. Bringing to
         the front is a consequence of looking, not an action you did
         something with: the critique measured that three selection
         clicks left three ⌘Z that changed nothing on screen, and a
         stack full of invisible steps is worse than having no stack.
         It still persists (the stacking is part of the document) and it
         is still the same one you see when you reload. See the third
         value of `label` in views.ts. */
      null,
    )
  }

  /* DELETING IN TWO BEATS. First it is marked (the frame fades and
     shrinks with the same curve and the same path it came in with, only
     shorter: on the way out you have already decided) and only then is
     it taken out of the model.

     THE WAIT IS THE DURATION OF THE EXIT AND IT IS WRITTEN TWICE, here
     and in the CSS. It is the file's only duplication and it is
     accepted in exchange for not having to listen for `transitionend`
     on an element that can have the pointer over it or the tab in the
     background, the two cases where that event does not arrive and the
     frame would stay half gone forever.

     AND THE WAIT ALSO RUNS WITH REDUCED MOTION. There was a shortcut
     here that unmounted at once, and it was exactly the opposite of
     what the rule says: reduced means SOFTER, not zero. Measured by the
     critique: the frame disappeared at 2ms while the comment next to it
     promised a fade. What the preference turns off is the MOVEMENT (the
     scale, and the CSS does that); the fade stays, because it is what
     keeps something from disappearing at once from the middle of the
     screen. */
  const removeFrame = (id: string) => {
    setSelected((s) => (s === id ? null : s))
    setLeaving(id)
    window.setTimeout(() => {
      setLeaving((l) => (l === id ? null : l))
      update(view.id, (v) => ({ ...v, frames: v.frames.filter((f) => f.id !== id) }))
    }, EXIT_DURATION)
  }

  const move = (id: string, to: { x: number; y: number; width: number; height: number }) =>
    update(view.id, (v) => ({
      ...v,
      frames: v.frames.map((f) => (f.id === id ? { ...f, ...to } : f)),
    }))

  /* THE ASPECT RATIO CORRECTS ITSELF when the media finishes loading,
     and ONLY if the frame is still at the provisional size. That is the
     whole condition: there is no need to remember whether you resized
     it, because resizing it takes it off those two exact numbers. The
     price is that a frame left by hand at exactly 480×270 gets
     recomputed on reload, and ends up at the right aspect ratio, which
     is what you wanted anyway. */
  const measured = (id: string, w: number, h: number) => {
    if (!w || !h) return
    update(
      view.id,
      (v) => {
        const i = v.frames.findIndex((f) => f.id === id)
        if (i < 0) return v
        const f = v.frames[i]
        if (f.width !== PROVISIONAL.width || f.height !== PROVISIONAL.height) return v
        const m = sizeFrom(w, h)
        if (m.width === f.width && m.height === f.height) return v
        return { ...v, frames: v.frames.map((x, k) => (k === i ? { ...x, ...m } : x)) }
      },
      /* NO HISTORY. You did not do this: it is the frame settling into
         the clip's real shape when it finishes loading. With a step,
         the first ⌘Z after adding a clip undid the correction instead
         of the clip. See the three values of `label` in views.ts. */
      null,
    )
  }

  /* PUTTING SOMETHING ON THE BOARD. It is the same job for the three
     things that go in (a clip, a sketch, and one day a piece) so the
     position, the fitting and the cascade are written ONCE and the only
     thing that changes is what gets put there.

     The size arrives from the element you were looking at in the dialog
     (already loaded, so its aspect ratio is a fact and not an estimate)
     and if it could not be measured it falls back to the provisional
     one. A sketch has no natural aspect ratio: it is always born
     provisional, and what defines it is the size you give it by
     dragging. */
  const place = (
    kind: Frame['kind'],
    ref: string,
    m: { width: number; height: number } | null,
  ) => {
    const r = measureBoard()
    /* If it does not fit on the board at its starting size (a small
       window, a very vertical clip) it is born smaller instead of being
       born cropped. */
    const requested = m ?? PROVISIONAL
    const { width, height } = r ? fitSize(requested.width, requested.height, r) : requested
    const offset = (view.frames.length % CASCADE_STEPS) * CASCADE
    const center = r
      ? { x: (r.width - width) / 2 + offset, y: (r.height - height) / 2 + offset }
      : { x: CASCADE + offset, y: CASCADE + offset }
    const p = r
      ? clampPosition(center.x, center.y, width, height, r)
      : { x: Math.round(center.x), y: Math.round(center.y) }
    const id = newId()
    update(view.id, (v) => ({
      ...v,
      frames: [...v.frames, { id, kind, ref, ...p, width, height }],
    }))
    setSelected(id)
    setAdding(false)
  }

  const addClip = (clip: Clip, m: { width: number; height: number } | null) =>
    place('clip', clip.path, m)

  /* THE FILE FIRST, THE FRAME AFTER. If the server could not write it,
     nothing is put down: a frame pointing at a file that does not exist
     would be a placeholder you cannot fix from here.

     The frame is put down WITHOUT WAITING for Vite to say the file
     exists. There is no need: while the glob does not have it, the
     frame draws its placeholder with the name, and when the hot update
     arrives (a couple of frames) it draws itself. Waiting would mean
     staring at an open dialog for nothing. */
  const newSketch = async () => {
    const ref = await createSketch(freeRef())
    if (ref) place('sketch', ref, null)
  }

  /* ─── WHAT IS STORED FITS THE BOARD THERE IS TODAY ───
     A view is put together in one window and opened in another. Without
     this, a frame stored at x=1100 on a big screen shows up half tucked
     under the sidebar on a laptop, or straight off screen, and there is
     no way to reach it. A drag cannot start on something you cannot
     see.

     THE CORRECTION IS STORED, not just drawn: if it were only drawn
     fitted, the model would still say 1100 and the problem would come
     back on the next render that does not go through here.

     With no dependency list, the same as the keyboard below and the
     Escape in app.tsx: it runs after every render and it is a no-op
     unless something is outside. `fitFrame` returns THE SAME object
     when there is nothing to correct, and on that depends its not
     scheduling a write to disk per render. */
  useEffect(() => {
    const check = () => {
      const r = measureBoard()
      if (!r) return
      const frames = view.frames.map((f) => fitFrame(f, r))
      if (frames.every((f, i) => f === view.frames[i])) return
      update(
        view.id,
        (v) => {
          const fixed = v.frames.map((f) => fitFrame(f, r))
          /* THE SAME view is returned if there was nothing to correct:
             a new object with the same content would still count as a
             change and would schedule a write to disk per render. */
          return fixed.every((f, i) => f === v.frames[i]) ? v : { ...v, frames: fixed }
        },
        /* No history, for the same reason as the aspect ratio
           correction: it is the app settling into the window there is,
           not you. */
        null,
      )
    }
    check()
    /* And when the window is resized, which is the other moment the
       board shrinks underneath the frames. */
    window.addEventListener('resize', check)

    /* ─── AND WHEN THE SIDEBAR COMES BACK, which is the third ───
       Collapsing it makes the board bigger and breaks nothing;
       UNcollapsing it takes 240px back, and a frame you left in that
       strip ends up outside. Without this it would not show until the
       next window `resize`, which would move it all at once much later
       and with no apparent connection to what you did.

       THE END OF THE TRANSITION IS LISTENED FOR, NOT THE STATE CHANGE.
       This effect already runs after every render (that is, it also
       runs when you press ⌥⌘S) but at that point the board STILL
       MEASURES WHAT IT DID BEFORE: the padding is only just starting
       its transition. Measuring at that moment is measuring the old
       window.

       It is filtered by property and by target because `transitionend`
       bubbles: the panel's transform also reaches here. */
    const canvasEl = canvas.current
    const onCollapseEnd = (e: TransitionEvent) => {
      if (e.target === canvasEl && e.propertyName === 'padding-left') check()
    }
    canvasEl?.addEventListener('transitionend', onCollapseEnd)
    return () => {
      window.removeEventListener('resize', check)
      canvasEl?.removeEventListener('transitionend', onCollapseEnd)
    }
  })

  /* ─── THE KEYBOARD ───
     It goes on the document and not on the board: for a keydown to
     reach a div you have to make it focusable, and a tabIndex on the
     board adds a tab stop that leads nowhere. What governs is the
     SELECTION, which is already the subject of all of this. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* ─── ⌥⌘S COLLAPSES THE SIDEBAR, AND IT GOES BEFORE THE GUARD ───
         THE SHORTCUT IS APPLE'S, NOT ONE OF OURS. SOURCE:
         support.apple.com/en-us/102650 (Mac keyboard shortcuts),
         "Option-Command-S: Hide or show the Sidebar in Finder windows".
         It is the same one in Mail, Notes and Xcode. With no visible
         control, the shortcut has to be THE one you already know, not
         one you have to discover.

         `code` IS WHAT IS CHECKED AND NOT `key`, and this is the trap
         of the whole thing: on a Mac keyboard ⌥+S does not produce "s"
         but "ß", so `e.key === 's'` never matches. `code` names the
         PHYSICAL KEY and does not depend on the layout.

         IT GOES ABOVE THE GUARD on purpose. The guard below turns away
         everything arriving from a text field or a dialog because it
         does not belong to the board, and it is right about the arrow
         keys and Backspace. But this is not a board key: it is a window
         command, and in Finder it works wherever the focus is. It has
         to work while you are typing the view's name too.

         And ctrl as well as cmd, like the ⌘Z in private.tsx: the same
         courtesy for a keyboard that is not a Mac one. */
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.code === 'KeyS') {
        e.preventDefault()
        setPanelOpen((v) => !v)
        return
      }

      /* ─── THE GUARD GOES FIRST, BEFORE ANY KEY ───
         It used to be after resolving Escape, and that made Escape do
         TWO things at once: with the "Add clip" dialog open, it closed
         the dialog (the native <dialog> does that) and on the way it
         killed the board's selection, which had nothing to do with it.
         Measured by the critique: `selectionSurvives: false`.

         A key arriving from a text field or from inside a dialog DOES
         NOT BELONG TO THE BOARD, and that holds for all of them
         equally, Escape included. Typing cannot delete a frame, and
         closing a dialog cannot deselect. */
      const t = e.target as HTMLElement | null
      if (t?.closest?.('input, textarea, select, dialog') || t?.isContentEditable) return

      if (e.key === 'Escape') {
        /* It deselects AND drops the focus. If the frame stayed
           focused, `aria-selected` would say false while the system
           ring keeps pointing at it: two answers to the same
           question. */
        const f = document.activeElement
        if (f instanceof HTMLElement && f.closest('[role="option"]')) f.blur()
        setSelected(null)
        return
      }
      if (!selected) return

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        removeFrame(selected)
        return
      }

      const d = ARROWS[e.key]
      if (!d) return
      /* Without this the page scrolls under the frame you are moving. */
      e.preventDefault()
      const step = e.shiftKey ? LONG_STEP : STEP
      const r = measureBoard()
      update(
        view.id,
        (v) => ({
          ...v,
          frames: v.frames.map((f) => {
            if (f.id !== selected) return f
            const x = f.x + d.x * step
            const y = f.y + d.y * step
            return { ...f, ...(r ? clampPosition(x, y, f.width, f.height, r) : { x, y }) }
          }),
        }),
        /* Five arrow presses in a row on the same frame are ONE undo
           step: the label merges them. On another frame, or after a
           pause, a new one starts. */
        'arrows:' + selected,
      )
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  /* THE COUNT IN WORDS IS ONLY FOR WHOEVER LISTENS. It appears once in
     the whole canvas (the footer's aria-live, clipped) since the
     list's empty state says it with a dash (see further below). A dash
     cannot be announced: "—" read out loud is nothing, so the sentence
     has to keep existing for the other channel.

     Singular and plural, and "No clips" instead of "0 clips": a zero
     reads like broken data and the word says the same thing better. */
  const n = view.frames.length
  const count = n === 0 ? 'No clips' : n === 1 ? '1 clip' : `${n} clips`

  return (
    <div
      className={css.canvas}
      ref={canvas}
      /* Collapsed, the attribute says so and the CSS does the rest: the
         panel leaves in transform and the board keeps the room. The
         sidebar goes on being drawn the same way. Not one value of its
         own changes. */
      data-no-panel={panelOpen ? undefined : ''}
    >
      {/* ─── THE SIDEBAR ───
          Everything the application has to say about this view, in one
          column: where you came back from, what it is called, and what
          you can do. It reads top to bottom in that order, which is the
          order in which it is needed. */}
      {/* `inert` when collapsed, the same recipe as the vault's details:
          a panel that has left cannot go on receiving the tab key or the
          pointer. Without this, tabbing from the board landed inside a
          column that is not on screen and the focus disappeared. */}
      <aside className={css.panel} inert={!panelOpen}>
        <div className={css.panelTitle}>
          {/* With the tab bar off on this route, THIS IS THE ONLY WAY
              OUT. You go back through history, the same thing the
              trackpad's back gesture and ⌘Z do, so there is a single way
              to close, and if there is no history of your own, because
              you came in straight from a link, the list gets pushed: the
              arrow cannot take you out of the app. */}
          <Back onClick={() => (history.length > 1 ? history.back() : go('/playground'))} />
          {/* The name is edited in place. There is no "rename" mode: it
              is the title, and you write over it. */}
          <input
            className={css.name}
            value={view.name}
            aria-label="View name"
            /* THE COLUMN CUTS LONG NAMES AND DOES NOT HIDE IT. A
               one-line input clips with no ellipsis, since no
               `text-overflow` counts in an editable field, so the only
               honest signal is the native tooltip, which shows the whole
               name without taking you out of where you are.
               Measured: the column is 176px, that is about 24 characters
               at 14px. A name of 40 hides some 245px. It stands as an
               accepted limit: a canvas gets a short name, and the whole
               name is seen and edited right here by moving the cursor. */
            title={view.name}
            /* Typing the name is ONE undo step, not one per letter: the
               label merges consecutive keystrokes on this same view. See
               MERGE in views.ts. */
            onChange={(e) =>
              update(view.id, (v) => ({ ...v, name: e.target.value }), 'name:' + view.id)
            }
          />
        </div>
        {/* ─── THE BOARD'S INDEX ───
            The sidebar said "Add clip" and "1 clip" and nothing else:
            the canvas had content and its chrome did not know how to
            NAME it. This is the list of what is there, with the same
            anatomy as the product's index (a label that weighs the same
            as its rows, 16 of air, 8 between lines) because it is the
            same job.

            Touching a row is `select`: exactly what touching the frame
            on the board does. It selects, brings to the front, and takes
            the focus off the name if you were writing. One single verb
            for the same fact, whether it comes from the index or from
            the board, and that is why both sides stay in sync with no
            extra state.

            The + goes BARE, without the vault's circle, and it is not a
            whim: in a section heading the naked glyph is what both
            measured references do, "Pages +" in Paper (SOURCE: official
            capture of the app at paper.design) and "Pages"/"Layers" in
            Figma's new sidebar (SOURCE: help.figma.com, art. 360039831974).
            The circle stays for the BARS (the vault and the grid of
            views), which is another context: over there the + lives
            among nav words and needs a body of its own; here it hangs
            off a label that already anchors it. It replaces "Add clip",
            which was a gray word that weighed LESS than the view's name
            while being the board's most frequent action. Chosen in a
            prototype (round 2, "Edge") against the references' line of
            zones and against the heading-menu. */}
        <div className={css.clips}>
          <div className={css.clipsHeader}>
            <span className={css.clipsLabel}>Clips</span>
            <button
              className={css.barePlus}
              aria-label="Add clip"
              onClick={() => setAdding(true)}
            >
              <Plus />
            </button>
          </div>
          {n > 0 ? (
            <ul className={css.rows} aria-label="Clips in this view">
              {drawOrder.map((f) => {
                /* The same name the frame already shows on the board
                   (`label`, further down): a piece is called by its ref
                   and a clip by its file name with no folder. */
                const name = f.kind === 'piece' ? f.ref : nameOfPath(f.ref)
                return (
                  <li key={f.id} className={css.rowItem}>
                    <button
                      className={css.row}
                      /* `aria-current` and not `aria-selected`: the
                         listbox's options are the board's frames. This
                         is their index, and the selected one's row is
                         "the current one". */
                      aria-current={selected === f.id || undefined}
                      data-selected={selected === f.id ? '' : undefined}
                      data-new={appeared.includes(f.id) ? '' : undefined}
                      data-leaving={leaving === f.id ? '' : undefined}
                      /* The column cuts with an ellipsis; the native
                         tooltip shows the whole name. The same signal
                         the view's name above already gives. */
                      title={name}
                      onClick={() => select(f.id)}
                    >
                      {name}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            /* ─── THE EMPTY STATE IS A DASH, NOT A SENTENCE ───
               This used to say "No clips", and that was two problems in
               one line. The first is that the sentence is already said:
               the footer's aria-live announces that same count, so the
               emptiness was told twice. The second is where it was said.
               A gray label in the exact place of the rows reads as one
               more row, which means the empty list showed an item to
               warn that there is none.

               THE DASH IS THE ANSWER THIS HOUSE ALREADY GAVE FOR AN
               ABSENT VALUE, and not a new decision: it is the
               placeholder of Source and of Notes in a clip's details
               (see details.tsx, and its color in `.field::placeholder`).
               It comes with that same typographic pair, `--type-meta-c`
               at `--text-secondary`, which is what `.noClips` already
               used, so there is no value to choose. It does not compete
               with the label above, it asks for no translation, and it
               takes one row: when the first clip comes in the list does
               not jump.

               `aria-hidden` because for whoever listens it says nothing:
               a dash is typography, not information. The count in words
               is still alive in the footer's aria-live, which is where
               it has to be. See the note on `count`. */
            <p className={css.noClips} aria-hidden="true">
              —
            </p>
          )}
          {/* ─── THE SELECTION'S ACTION, VISIBLE ───
              Publishing was only in the right click, and it is the
              lesson already learned in the vault: a context menu
              announces nothing. The reference pattern is Figma's right
              panel, an area that shows the actions of what is selected,
              but ONE action does not pay for a new surface, so the area
              is born inside the sidebar that already exists: it appears
              with the selection, under the index that names it. The day
              the selection's actions pile up, this block is the one that
              moves to the inspector (it is in the README as pending).

              At 16 from the index, the system's GROUP air, double the 8
              between rows, so that it does not read as one more frame:
              the rows are nouns and this is a verb. The right click goes
              on offering it, as a shortcut. */}
          {selectedFrame && selectedFrame.kind !== 'piece' && (
            <button className={css.publish} onClick={() => setPublishing(selectedFrame)}>
              Add to Exhibition
            </button>
          )}
        </div>

        {/* ─── THE FOOTER: WHAT TAKES EVERYTHING AWAY ───
            "Delete view" lives alone, at the bottom. In this house there
            are no state colors, not one red in the whole product, so the
            protection of the only destructive action is put in the
            SPACE: the whole column of distance between it and what gets
            used all the time. With the confirmation it asks for
            afterwards, that is two layers: getting down here, and saying
            yes. */}
        <div className={css.panelFooter}>
          <button className={css.action} onClick={() => setDeleting(true)}>
            Delete view
          </button>
          {/* THE COUNT IS NO LONGER SEEN: the index above IS the count
              for whoever looks. But it stays in the DOM, clipped with
              the vault's `.hidden` recipe, because `aria-live` is the
              ONLY confirmation that a Backspace deleted something
              without a pointer. It used to be visible and got turned off
              with display:none at ≤560, which meant that at that width
              deleting was not announced. That was written down as debt.
              Clipped instead of turned off, it announces at every width.
              `polite` so as not to interrupt. */}
          <p className={css.count} aria-live="polite">
            {count}
          </p>
        </div>
      </aside>

      <div
        className={css.board}
        ref={board}
        /* The container of each frame's `option` role. Without it the
           frames would be options with no list and `aria-selected` would
           mean nothing. */
        role="listbox"
        aria-label="Canvas"
        aria-multiselectable={false}
        /* THE EMPTY SPACE DESELECTS. It goes on pointerdown and not on
           click because that is the same phase in which a frame gets
           selected: with both in the same phase, starting a drag and
           ending it over the board cannot deselect what you have just
           moved. */
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) select(null)
        }}
      >
        {drawOrder.map((f) => (
          <FrameBox
            key={f.id}
            frame={f}
            clip={clips?.find((c) => c.path === f.ref) ?? null}
            /* The same name that is seen: the clip's if it is there, and
               the one it had if it is gone. Never the raw path. */
            label={f.kind === 'piece' ? f.ref : nameOfPath(f.ref)}
            known={clips !== null}
            selected={selected === f.id}
            isNew={appeared.includes(f.id)}
            leaving={leaving === f.id}
            layer={layers.get(f.id) ?? 0}
            measureBoard={measureBoard}
            onSelect={select}
            onMove={move}
            onMeasure={measured}
            onMenu={(id, x, y) => {
              const frame = view.frames.find((f) => f.id === id)
              if (frame) setFrameMenu({ frame, where: { x, y } })
            }}
          />
        ))}
      </div>

      {/* The frame's menu and the publish dialog. subjectFrame is the
          last frame something was opened over. It survives the close so
          the exit has something to animate. */}
      {subjectFrame && (
        <>
          <Menu
            where={frameMenu?.where ?? null}
            label={subjectFrame.kind === 'piece' ? subjectFrame.ref : nameOfPath(subjectFrame.ref)}
            onClose={() => setFrameMenu(null)}
            /* Only what can be published: a sketch or a clip. A piece
               frame is already published, so its menu offers nothing
               yet. */
            items={
              subjectFrame.kind === 'piece'
                ? []
                : [{ text: 'Add to Exhibition', action: () => setPublishing(subjectFrame) }]
            }
          />
          <PublishDialog
            open={publishing?.id === subjectFrame.id}
            initialName={
              subjectFrame.kind === 'sketch'
                ? sketchName(subjectFrame.ref)
                : nameOfPath(subjectFrame.ref)
            }
            /* The sentence says where the file goes, which is the only
               thing that changes between the two branches. */
            message={
              subjectFrame.kind === 'sketch'
                ? 'The sketch joins the product and the piece goes live as Web.'
                : 'The recording joins the repo and the piece goes live as App.'
            }
            publish={(name, desc) =>
              subjectFrame.kind === 'sketch'
                ? publishSketch(subjectFrame.ref, name, desc)
                : publishClip(subjectFrame.ref, name, desc)
            }
            onClose={() => setPublishing(null)}
          />
        </>
      )}

      <AddDialog
        open={adding}
        clips={clips ?? []}
        onAdd={addClip}
        onSketch={(ref) => place('sketch', ref, null)}
        onNewSketch={newSketch}
        onClose={() => setAdding(false)}
      />

      <DeleteViewDialog
        view={view}
        open={deleting}
        onClose={() => setDeleting(false)}
        onDelete={() => {
          deleteView(view.id)
          if (history.length > 1) history.back()
          else go('/playground')
        }}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WHICH CLIP TO ADD: the dialog.

   It is the vault's <dialog>, the same class and therefore the same
   recipe: showModal, trapped focus, Escape, ::backdrop, and the exit
   with `overlay`/`display` in allow-discrete plus @starting-style. The
   only thing of its own is the width and the grid inside.

   YOU CHOOSE BY LOOKING, not by reading a list of file names: it is the
   same decision that makes the upload dialog show the two cards instead
   of asking "native or web?" flat out.
   ═══════════════════════════════════════════════════════════════ */

/* THE PROPORTION IS MEASURED OFF THE ELEMENT YOU ARE LOOKING AT. The
   thumbnail has already loaded, it is on screen, so its natural size is
   a fact available in the click's own event, with no network request and
   with no waiting for the frame to mount. If it has not loaded yet it
   returns null and the frame is born provisional. */
function measureOption(el: HTMLElement) {
  const m = el.querySelector('video, img')
  if (m instanceof HTMLVideoElement) return sizeFrom(m.videoWidth, m.videoHeight)
  if (m instanceof HTMLImageElement) return sizeFrom(m.naturalWidth, m.naturalHeight)
  return null
}

function AddDialog({
  open,
  clips,
  onAdd,
  onSketch,
  onNewSketch,
  onClose,
}: {
  open: boolean
  clips: Clip[]
  onAdd: (c: Clip, m: { width: number; height: number } | null) => void
  onSketch: (ref: string) => void
  onNewSketch: () => void
  onClose: () => void
}) {
  const box = useRef<HTMLDialogElement | null>(null)
  /* The grid mounts the FIRST time it opens and never unmounts again.
     The two reasons are opposite and both matter: mounted from the
     start, thirteen videos would ask for their metadata every time you
     open a canvas even if you never touch "Add clip"; unmounted on
     close, the dialog empties on the exit's first frame and what you see
     leaving is a blank box. */
  const [mounted, setMounted] = useState(false)

  /* BOTH EFFECTS ARE LAYOUT EFFECTS, and on that depends not seeing the
     system's blue ring. `showModal()` focuses the <dialog> ITSELF when
     nothing inside asks for the focus, and a focused <dialog> draws the
     ring around its 936px. The critique caught it in two themes. With
     layout effects, mounting the grid and moving the focus to the first
     option both happen before the browser paints, so the ring never gets
     to exist. With `useEffect` there would be one frame with the whole
     dialog framed.
     It is the same solution as the vault's dialogs, which focus their
     text field: in a dialog, the focus starts INSIDE. */
  useLayoutEffect(() => {
    const d = box.current
    if (!d) return
    if (open) setMounted(true)
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  useLayoutEffect(() => {
    if (!open || !mounted) return
    box.current?.querySelector<HTMLElement>('button')?.focus()
  }, [open, mounted])

  return (
    <dialog
      className={`${dlg.dialog} ${css.addDialog}`}
      ref={box}
      /* Clicking outside closes. Choosing a clip is the app's lightest
         decision, it deletes nothing and writes nothing, so getting out
         has to cost the same as getting in. The browser does it with
         `closedby="any"`, which fires `close` and leaves through the
         same onClose as Escape. */
      closedby="any"
      onClose={onClose}
    >
      {/* "Add" and not "Add clip": since sketches get added too, the
          title named one of the two things inside. */}
      <h2 className={css.addTitle}>Add</h2>
      {mounted && (
        <>
          <div className={css.grid}>
            {/* ─── STARTING A COMPONENT FROM SCRATCH ───
                It goes FIRST and with the same box as everything else:
                it is one more option of the grid, not a button apart, so
                there is no second geometry to decide. The + inside the
                middle slot takes the place of the thumbnail, which is
                exactly what this option does not have yet.

                It creates the file and puts it on the board. It does not
                ask for the name: it is the rule "New view" already uses,
                since a modal before you see anything forces you to
                christen something that does not exist yet. */}
            <button className={`${dlg.card} ${css.option}`} onClick={onNewSketch}>
              <div className={css.optionBox}>
                <Plus />
              </div>
              <div className={dlg.title}>New sketch</div>
            </button>
            {/* The ones you have already written. With no thumbnail:
                drawing the sketch in here would mount it thirteen times
                per opening of the dialog, and a half-finished component
                can do anything. The word says what it is. */}
            {SKETCHES.map((ref) => (
              <button
                className={`${dlg.card} ${css.option}`}
                key={ref}
                onClick={() => onSketch(ref)}
              >
                <div className={css.optionBox}>Sketch</div>
                <div className={dlg.title}>{sketchName(ref)}</div>
              </button>
            ))}
            {clips.map((c) => (
              /* ─── IT IS THE VAULT'S CARD, NOT A THUMBNAIL OF ITS OWN ───
                 The same classes: its proportion (550/528, benji's), its
                 radius, its background, its hover and its label. And
                 above all its `data-source`, which is what makes a phone
                 clip come in WHOLE with proportional air and a screen
                 recording fill the box.

                 There used to be a 16/9 box here with `cover`, and it
                 cropped: of the vault's 13 clips, 5 are vertical and in
                 the dialog they came out as nearly empty rectangles. The
                 critique measured that it hid 74% of the image. Choosing
                 a clip by looking at it stops working when what you show
                 is not the clip.

                 The problem was already solved on the other side, and
                 with a measured decision: benji's card is almost square
                 EXACTLY because it takes both orientations. Reusing it
                 is inheriting that decision instead of taking a worse
                 one. */
              <button
                className={`${dlg.card} ${css.option}`}
                key={c.path}
                data-source={c.source ?? undefined}
                onClick={(e) => onAdd(c, measureOption(e.currentTarget))}
              >
                <div className={dlg.media}>
                  {c.medium === 'video' ? (
                    <video src={firstFrame(c.url)} preload="metadata" muted playsInline />
                  ) : (
                    <img src={c.url} alt="" loading="lazy" />
                  )}
                </div>
                <div className={dlg.title}>{c.name}</div>
              </button>
            ))}
          </div>
          {/* The notice stays BELOW the grid and no longer replaces it:
              with an empty vault you can still start a sketch, so
              swapping the whole grid for a line of text would hide the
              only action available. */}
          {clips.length === 0 && <p className={css.notice}>Nothing in the vault yet.</p>}
        </>
      )}
    </dialog>
  )
}
