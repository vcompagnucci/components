import { useCallback, useEffect, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   THE PLAYGROUND VIEWS. Each one is a canvas.

   Unlike the clips, this is NOT derived from disk: a clip exists
   because you dropped a file in a folder, and a view exists because
   you created it. So there is something to maintain, and it lives in
   .lima-playground.json at the root of the vault, next to the details.

   WHY IN THE VAULT AND NOT IN localStorage: a view references clips by
   their path, so it belongs in the same place they do. In localStorage
   it would be lost when you clear the browser and it could not be seen
   from another one, and both would be strange for something that is as
   much yours as the clips are.

   THE SERVER DOES NOT TRUST THIS. Everything sent gets sanitized on
   the other side, known fields, bounded numbers, frame kinds from a
   list, so this file gets to keep the comfortable half.
   ═══════════════════════════════════════════════════════════════ */

export type FrameKind = 'piece' | 'clip' | 'sketch'

/* A frame is ONE thing placed on the canvas, and there are three:

     clip     a reference from the vault. `ref` is its path
     sketch   a component you are writing. `ref` is the name of its
              file in src/private/sketches/, without the extension
     piece    a published piece. `ref` is its name. It is not drawn
              yet: see the gap in playground.tsx

   All three store a REFERENCE and not a copy, on purpose: if you
   change a clip's details or write in a sketch, the frame showing it
   is already up to date. None of the content lives in here. */
export type Frame = {
  id: string
  kind: FrameKind
  ref: string
  x: number
  y: number
  width: number
  height: number
}

export type View = {
  id: string
  name: string
  created: number
  frames: Frame[]
}

export type ViewsStatus =
  | { loading: true }
  | { loading: false; connected: false; reason: string }
  | { loading: false; connected: true; views: View[] }

/* randomUUID asks for a secure context. localhost counts as secure, so
   in development it is always there. The fallback keeps opening this
   from the machine's IP on a phone from throwing an exception instead
   of creating the view. */
export const newId = () =>
  typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

/* HOW LONG WE WAIT BEFORE SAVING.

   Dragging a frame fires an event per frame: at 60fps, a two-second
   drag is 120 writes to disk. With this it is one.

   400 and no more: it is short for a hand, you let go of the frame and
   by the time you look back it is already saved, and it is long next
   to the 16ms of a frame, which is what has to be absorbed. */
const SAVE_DELAY = 400

/* No name and no dialog. The view is born with a name on it and gets
   renamed later, which is what Figma does: a modal before you see
   anything forces you to decide what to call something that does not
   exist yet.

   IT LIVES HERE AND NOT IN playground.tsx because TWO paths use it:
   the "New view" button and the helper below, which creates a view
   with no interface mounted at all. Two constants with the same text
   in two files come apart on their own the day one changes. */
export const UNNAMED = 'Untitled'

/* ═══════════════════════════════════════════════════════════════
   UNDO AND REDO. ⌘Z and ⇧⌘Z.

   ─── WHY SNAPSHOTS AND NOT A COMMAND PATTERN ───
   Each step stores a WHOLE COPY of the array of views. It sounds
   expensive and it is not: a few views with a few flat frames, seven
   numbers and two strings each, so a step weighs what the JSON weighs,
   which is nothing.

   And in exchange it gets the property that actually matters here: IT
   CANNOT GO OUT OF SYNC. A command pattern forces you to write the
   inverse of every action, and the day somebody adds a new action and
   forgets the inverse, or writes it wrong, undo leaves the document in
   a state that never existed, in silence. With snapshots that is
   impossible by construction: undoing is going back to a state that
   WAS true.

   ─── THE HISTORY BELONGS TO THE SESSION ───
   It lives in memory and is not persisted. Reloading the page empties
   it, and that is fine: undo is for fixing what you just did, not for
   archaeology. Keeping it in the vault would turn a data file into a
   data file PLUS a record of everything you tried.

   ─── UNDO SAVES IMMEDIATELY ───
   No debounce. It is the only write that goes out at once, and for a
   concrete reason: if you undo and reload within 400ms, the disk still
   has what you undid and the app gives it back to you. Undoing
   something and having it come back is one of the few things that
   really breaks trust.

   ─── THE SELECTION IS NOT UNDOABLE ───
   Neither the selected frame nor the open view: that is where you are
   looking, not what you did. It is what every editor does, and putting
   it on the stack would force you to press ⌘Z three times to undo one
   move.
   ═══════════════════════════════════════════════════════════════ */

/* HOW MANY STEPS ARE REMEMBERED. 100 is generous for a session at the
   board and it bounds the memory: a hundred copies of a document this
   size do not reach a megabyte. */
const STACK_LIMIT = 100

/* HOW LONG "THE SAME ACTION" LASTS so it can be merged into one step.

   Without this the stack fills with garbage: typing six letters into a
   view's name would be six undo steps, and five arrow presses would be
   five. With this, consecutive events carrying the SAME label, the
   same field, the same frame, inside this window do not open a new
   step: the first one already stored the state from before, which is
   the only one needed to go back.

   800ms: longer than the pause between two keys while typing straight
   through (about 150) and shorter than a pause to think. It is also
   twice the 400 of the save debounce, so a step never gets split
   across two writes to disk. */
const MERGE_WINDOW = 800

/* A step on the stack: how EVERYTHING was before, and what changed it.
   The label is not shown anywhere. It is only there to decide whether
   the event coming in is "the same thing" and has to be merged. */
type Step = { views: View[]; label: string }

/* ─── THE SEED FOR "OPEN IN PLAYGROUND" ───
   That path runs OUTSIDE React (see toPlayground, below) and ends in a
   navigation: the vault unmounts and the canvas mounts from scratch,
   so there is no React state anywhere to leave the previous step in.
   The module does survive, since the navigation is client-side and
   reloads nothing, so the snapshot from before is left here and the
   hook picks it up on load.

   With that, the first ⌘Z on the canvas you just arrived at undoes the
   clip that brought you there, which is exactly what you expect. */
let seed: View[] | null = null

export function useViews() {
  const [status, setStatus] = useState<ViewsStatus>({ loading: true })

  /* The timer and the last thing there is to send, outside of state:
     them changing does not have to redraw anything. */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<View[] | null>(null)

  /* THE PRESENT, ALSO IN A REF. The history has to read "how it is
     now" to stack it BEFORE changing it, and reading it from `status`
     would force doing it inside the setState updater, which React can
     call twice, and would push the stack twice per action. With the
     ref, stacking happens once and outside of any render. */
  const present = useRef<View[]>([])

  /* The two stacks and the mark of the last action, for merging. None
     of this redraws: that is why they are refs and not state. */
  const back = useRef<Step[]>([])
  const forward = useRef<View[][]>([])
  const last = useRef<{ label: string; time: number } | null>(null)

  const send = useCallback(() => {
    const v = pending.current
    pending.current = null
    timer.current = null
    if (!v) return
    /* THE FAILURE IS NOT ABSORBED. It used to end in `.catch(() => {})`
       and that is the one thing this write cannot do: the screen is
       optimistic (see `apply`), so a rejected PUT left the board looking
       saved over a document on disk that is not. It goes out as an
       unhandled rejection until the canvas has somewhere to say it,
       which is the same debt the details panel has. */
    void fetch('/vault-media/__views', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ views: v }),
    })
  }, [])

  useEffect(() => {
    let alive = true
    fetch('/vault-media/__views')
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        if (!d.connected) {
          setStatus({ loading: false, connected: false, reason: d.reason })
          return
        }
        present.current = d.views
        /* If you got here from "Open in playground", the previous step
           is waiting in the module. It is picked up once. */
        if (seed) {
          back.current = [{ views: seed, label: '' }]
          seed = null
        }
        setStatus({ loading: false, connected: true, views: d.views })
      })
      .catch((e) => {
        if (alive) setStatus({ loading: false, connected: false, reason: String(e) })
      })
    return () => {
      alive = false
    }
  }, [])

  /* ON UNMOUNT, WHATEVER IS LEFT GETS SENT. Without this, moving a
     frame and leaving the playground before the 400ms loses the move,
     and it would feel like the app forgets things at random. */
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current)
        send()
      }
    },
    [send],
  )

  /* The write is OPTIMISTIC: the screen updates now and the disk
     later. A frame being dragged has to follow the pointer without
     waiting for anybody.
     `now` skips the debounce, and undo and redo use it. */
  const apply = useCallback(
    (views: View[], now = false) => {
      present.current = views
      pending.current = views
      setStatus((s) => (s.loading || !s.connected ? s : { ...s, views }))
      if (timer.current) clearTimeout(timer.current)
      if (now) send()
      else timer.current = setTimeout(send, SAVE_DELAY)
    },
    [send],
  )

  /* EVERY mutation goes through here, and that is why the history
     cannot forget any of them: there is no way to change the document
     without stacking the state from before.

     The label has THREE values and each one is a class of change:

       undefined   a discrete action: add, delete, bring to front.
                   Every call is one step
       a string    a continuous action: typing a name, moving with the
                   arrow keys. Two calls in a row with the same label,
                   inside MERGE_WINDOW, are a single step
       null        NOT AN ACTION OF YOURS. It is saved to disk but it
                   does not enter the history and it does not cut the
                   redo branch

     The third one exists because of the AUTOMATIC CORRECTIONS: the
     frame born with the provisional aspect ratio that gets fixed when
     the video finishes loading, and the one that was stored outside a
     smaller canvas and gets moved in on mount. Both are the app
     fixing itself, and putting them on the stack made the first ⌘Z
     after adding a clip undo the correction instead of the clip.
     Measured, and it was exactly what felt broken. Undo has to undo
     what YOU did.
     If a ⌘Z reverts them anyway, they reapply on their own: they are
     idempotent and their trigger runs again. */
  const save = useCallback(
    (next: (v: View[]) => View[], label?: string | null) => {
      const before = present.current
      const after = next(before)
      /* A change that changes nothing is not a step. It is what keeps
         a click on the frame that is already at the front from
         dirtying the stack. */
      if (after === before) return

      if (label !== null) {
        const merges =
          label !== undefined &&
          last.current?.label === label &&
          Date.now() - last.current.time < MERGE_WINDOW
        if (!merges) {
          back.current.push({ views: before, label: label ?? '' })
          if (back.current.length > STACK_LIMIT) back.current.shift()
        }
        last.current = label === undefined ? null : { label, time: Date.now() }

        /* A NEW ACTION CUTS THE REDO BRANCH. It is what every editor
           does: if you undo three steps and do something different,
           the future you had discarded stops existing. Keeping it
           would call for a tree and an interface to navigate it.
           An automatic correction CUTS NOTHING: it is not a decision
           of yours, so it cannot throw away the one that was. */
        forward.current = []
      }
      apply(after)
    },
    [apply],
  )

  const undo = useCallback(() => {
    const step = back.current.pop()
    if (!step) return false
    forward.current.push(present.current)
    /* The merge is cut off: the next thing you type opens a new step,
       even on the same field. */
    last.current = null
    apply(step.views, true)
    return true
  }, [apply])

  const redo = useCallback(() => {
    const v = forward.current.pop()
    if (!v) return false
    back.current.push({ views: present.current, label: '' })
    last.current = null
    apply(v, true)
    return true
  }, [apply])

  const create = useCallback(
    (name: string) => {
      const view: View = { id: newId(), name, created: Date.now(), frames: [] }
      /* The new one goes FIRST, same as the most recent clip in the
         vault: you just created it, it is what you are about to open. */
      save((v) => [view, ...v])
      return view
    },
    [save],
  )

  const remove = useCallback(
    (id: string) => save((v) => v.filter((x) => x.id !== id)),
    [save],
  )

  const update = useCallback(
    (id: string, f: (v: View) => View, label?: string | null) =>
      save((v) => {
        const i = v.findIndex((x) => x.id === id)
        if (i < 0) return v
        const next = f(v[i])
        /* The VIEW is compared and not the array: that way a change
           returning the same view, the tidy-up that had nothing to
           tidy, never gets as far as stacking a step. */
        if (next === v[i]) return v
        return v.map((x, k) => (k === i ? next : x))
      }, label),
    [save],
  )

  return { status, create, remove, update, undo, redo }
}

/* ═══════════════════════════════════════════════════════════════
   SEND A CLIP TO THE PLAYGROUND FROM THE VAULT.

   IT IS A HELPER AND NOT A HOOK on purpose: it is fired by an item in
   the right-click menu, that is, a place where the playground is NOT
   mounted and there is no state of its own to hang off. A hook would
   force the vault to subscribe to the views, and to ask for them on
   every render, to use them once in a while.

   IT GOES TO THE MOST RECENT VIEW, the one with the highest `created`,
   and not to the first in the array: the array is ordered by `create`
   putting the new one in front, but that is a presentation decision
   and not a fact about the data. If there is none, one gets created,
   because "send this to the playground" has to work the first time you
   press it, without making you go create a view first.

   The document is read and written back WHOLE, which is the same
   contract useViews has with the server. It returns the view's id so
   the caller can navigate, or null if the vault is not there or the
   write did not land.
   ═══════════════════════════════════════════════════════════════ */

/* The starting size when there is NOWHERE to measure the clip's aspect
   ratio from. From the vault there is no element loaded, since the
   menu lives over the card and not over the canvas, so the frame is
   born at 16/9 and the canvas corrects it when the media finishes
   loading. See PROVISIONAL in playground.tsx: same pair of numbers and
   same deal. */
const PROVISIONAL = { width: 480, height: 270 }

/* AND IT STARTS AT THE TOP LEFT, not centered like the one added from
   the canvas. It is not a preference: from the vault there is no way
   to know how big the canvas is, it is not mounted, and centering
   against an invented size leaves the frame anywhere. 24, and the same
   cascade of 24 the canvas uses, so two clips in a row do not cover
   each other. */
const CORNER = 24
const CASCADE = 24
const CASCADE_STEPS = 8

export async function toPlayground(path: string): Promise<string | null> {
  const r = await fetch('/vault-media/__views')
  const d = await r.json().catch(() => null)
  if (!d?.connected) return null

  const views: View[] = d.views
  const latest = views.reduce<View | null>((a, b) => (a && a.created >= b.created ? a : b), null)
  const target: View = latest ?? {
    id: newId(),
    name: UNNAMED,
    created: Date.now(),
    frames: [],
  }

  const n = target.frames.length
  const offset = CORNER + (n % CASCADE_STEPS) * CASCADE
  const frame: Frame = {
    id: newId(),
    kind: 'clip',
    ref: path,
    x: offset,
    y: offset,
    ...PROVISIONAL,
  }
  const withFrame: View = { ...target, frames: [...target.frames, frame] }

  /* How EVERYTHING was before this, so the ⌘Z on the canvas you are
     about to reach can undo it. See `seed`, above. */
  seed = views

  /* If the view already existed it gets replaced in place; if it is
     new it goes first, same as in `create`. */
  const next = latest
    ? views.map((v) => (v.id === withFrame.id ? withFrame : v))
    : [withFrame, ...views]

  const saved = await fetch('/vault-media/__views', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ views: next }),
  })
  /* If the write did not land there is nowhere to send you: the canvas
     would open without the clip the gesture was about. */
  if (!saved.ok) return null

  return withFrame.id
}
