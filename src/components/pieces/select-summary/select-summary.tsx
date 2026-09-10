/* ═══════════════════════════════════════════════════════════════
   SELECT SUMMARY: the summary of a multiple selection.

   A WEB PIECE, and it runs live: the file on this side of the boundary
   is the canonical one (see AGENTS.md › The exhibition). It is
   SELF-CONTAINED on purpose (it imports nothing from src/private/ and
   nothing from any other piece), and that is why the four people and
   their chip live in here and not in a module of their own.
   ═══════════════════════════════════════════════════════════════ */

/* ─── WHERE EVERY VALUE COMES FROM ───
   The reference, rebuilt from the measurement.

   Reference: VAULT_DIR/web/Select summary.mp4 (X, @abjt14). Everything
   that follows was measured
   frame by frame off the 1322×1058 master at 60 fps, not by eye.

   THE UNIT IS THE HEIGHT OF THE TRIGGER. The recording zooms in and
   out, so a width in video pixels is not a width in CSS pixels: the
   only thing that survives is the RATIO against the height of the
   button. Every number below carries its measured ratio beside it. The
   height, 40 px, is THE ONLY DECISION of ours: the measurement bounds
   it between 38 and 44 (the 1 px ring measures 4.8 px of video) and
   inside that band there is nothing to measure.

   WHAT MOVES AND WHAT DOES NOT. The reference spends its whole motion
   budget on the summary and nothing on the rest: the checkbox and the
   fill of the row change in ONE frame (≤17 ms, measured). That is not
   carelessness, it is the piece: it is called Selection summary because
   the summary is what animates.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import type { Mount } from '../../../demos'

/* The four people of the piece, and the chip that holds them.

   ─── WHERE EVERY PHOTO COMES FROM ───
   They are X profile photos of four known people, downloaded on
   2026-09-10 and kept in public/pieces/select-summary/. Each one was
   looked at before it came in: a photo nobody checked is the wrong
   photo.

     karri      @karrisaarinen   Karri Saarinen, CEO of Linear
     john       @johnternus      John Ternus, CEO of Apple since
                                 2026-09-01
     elon       @elonmusk        Elon Musk
     guillermo  @rauchg          Guillermo Rauch, CEO of Vercel

   ELON'S IS NOT A FACE, and it is said here: his avatar today is a
   Starship launch. It is his real profile photo. If it has to be a
   face, either the photo changes or the person does.

   WHOLE AND UNTOUCHED. The four files are the bytes X serves, copied as
   they are: 400 × 400, between 20 and 33 KB, sha256 identical to the
   download. No crop, no resample and no second JPEG on top of another
   JPEG. Each of those three costs quality and none of them is needed.

   400 is the most X publishes and it is plenty: the largest chip
   measures 21 px of CSS, so not even on a 3× screen (63 px) does it ask
   for a sixth of what is there. The one that scales down is the
   browser, which does it better than a re-encode of ours and without
   writing the result into the file.

   And they are not cropped even though they have room to spare:
   Guillermo's has an owl sitting on his shoulder, and framing his face
   cuts the owl's head off. The circle of the chip already crops what is
   left over.

   THERE WERE TWO VERSIONS HERE BEFORE, and both of them asked for
   framing by hand. Brand logos (simple-icons, CC0) cost three rounds
   (box, ink and centroid: all three measured right and none of them
   looked right), and initials on colored discs cost measuring where the
   letter falls in a variable typeface. A face asks for none of that,
   and at 10 px it is still a person when a letter is already nobody. */

type Person = {
  id: string
  name: string
  /* The photo, served from public/. A Web piece is self-contained as
     far as CODE goes (it imports nothing from another piece and nothing
     from the private area) and this is not an import: it is a URL, the
     same as the video of an App piece. */
  photo: string
}

const PEOPLE: Person[] = [
  { id: 'karri', name: 'Karri', photo: '/pieces/select-summary/karri.jpg' },
  { id: 'john', name: 'John', photo: '/pieces/select-summary/john.jpg' },
  { id: 'elon', name: 'Elon', photo: '/pieces/select-summary/elon.jpg' },
  { id: 'guillermo', name: 'Guillermo', photo: '/pieces/select-summary/guillermo.jpg' },
]

/* A chip: the photo cropped into a circle, at whatever size it gets.

   The circle is the border-radius of the <svg> itself and not a
   clip-path: the SVG already crops whatever leaves its box, so with a
   round box the photo comes out round. That same rounded corner draws
   the outer ring with box-shadow. */
function Chip({
  person,
  size,
  ring,
}: {
  person: Person
  /* in rem, like everything that has to grow with the text */
  size: number
  /* The ring in the color of the SURFACE that separates one chip from
     the one underneath when they overlap; the reference uses it with
     two chosen. It goes outside and not inside, which is where the
     outline of the photo lives. In rem, already divided by the scale of
     the chip so that it measures one screen pixel and not one chip
     pixel. */
  ring?: number
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      style={{
        width: `${size}rem`,
        height: `${size}rem`,
        flex: 'none',
        borderRadius: '50%',
        boxShadow: ring ? `0 0 0 ${ring}rem var(--piece-surface)` : undefined,
      }}
      aria-hidden
    >
      <image href={person.photo} width="40" height="40" preserveAspectRatio="xMidYMid slice" />
      {/* The outline, 1 px inside the 40. The one that needs it is the
          light photo on a light surface (Karri's has a white
          background): without this line the chip does not end
          anywhere. */}
      <circle cx="20" cy="20" r="19.5" fill="none" stroke="var(--piece-outline)" />
    </svg>
  )
}

/* ─── THE MODEL: "ALL" IS THE ABSENCE OF A FILTER ───
   The reference does something else: there "All Chains" is a fifth row
   that gets checked and turns the other four off (measured in the
   frame: with the mode on, the rows of each chain have an empty ring).
   That is a radio button dressed up as a checkbox, and an "all" state
   you have to choose.

   Not here. "all" is ZERO checkmarks, and the top row stops being a
   state to become the action that clears. The receipts, read from
   Apple's documentation API on 2026-09-09:

   · The toggles page tells how their own phone solves this: the
     Recents filter alternates between all the calls and the filter
     options, and the button is drawn with a background behind the
     symbol when a filter is on and with NOTHING behind it when you go
     back to the main view. "All" is the state with no mark.
   · The menus one recommends offering an item that removes every
     toggled attribute at once (its example is "Plain"), and asking for
     a verb in the label when an action cannot be told apart from a
     state (its example: "Turn HDR On", not "HDR On"). That is where
     "Show all people" comes from, and not "All people".
   · The contextual menus one summarizes a multiple selection with the
     count of what is chosen, which is what the trigger does with
     "3 people".

   These guidelines explain, they do not authorize: they belong to
   Apple's platforms and this runs on the web. What they add is that the
   model is not an invention of ours, and that the reference departed
   from it. */
type Selection = 'all' | string[]

function toggle(s: Selection, id: string): Selection {
  if (s === 'all') return [id]
  const next = s.includes(id) ? s.filter((other) => other !== id) : [...s, id]
  /* BOTH ENDS GO BACK TO "all", and for the same reason: a filter that
     does not filter. With nothing chosen it is obvious; with all four
     on it is too, and there there is also a checkbox that says so (the
     "All" one), so leaving it off while the filter does not filter
     would be lying about the state. It is Carbon's parent checkbox.

     There was a version without the collapse at the top, with the
     argument that making the four checkmarks disappear at once reads as
     an error. It fell when "All" went from being a command to being a
     state: a command reflects nothing, a checkbox does. */
  if (next.length === 0 || next.length === PEOPLE.length) return 'all'
  return next
}

const selectedPeople = (s: Selection): Person[] =>
  s === 'all' ? PEOPLE : PEOPLE.filter((p) => s.includes(p.id))

/* ─── THE LABEL IS ONE STRING, AND IT CHANGES IN ONE FRAME ───
   No fade and no splitting into words, which are the two things the
   reference does and the two that were dropped after watching them run.

   The reference animates it BY TOKEN: going from "3 Chains" to "All
   Chains" the word "Chains" does not fade (its count of light pixels
   does not drop in any frame) and only the one in front changes.
   Reproducing that asks for the token that leaves to be out of flow,
   and there, when it is wider than the one coming in, it lands on top
   of the word next to it for the 200 ms of the crossing. The two ways
   out (clip the word that leaves, or move the one next to it and bring
   it back) are worse than the defect.

   And the whole fade is out too: the change of state is already told by
   THREE things (the checkbox that gets marked, the color of the row and
   the cluster), so fading only delays the reading and leaves one or two
   frames where the label says nothing.

   What is lost is said, and it is measured: the reference fades the
   label out in ~110 ms and in in ~133, in sequence and with no overlap.
   It is a deliberate difference, not an oversight. */
function label(s: Selection): string {
  if (s === 'all') return 'All people'
  if (s.length === 1) return selectedPeople(s)[0].name
  return `${s.length} people`
}


/* ─── THE CLUSTER ───
   Measured: the square of the cluster ALWAYS measures 0.523 of the
   height of the button, with 1, 2, 3 or 4 people inside, and the
   circles anchor to its corners.

   It is drawn with transform and nothing else: every chip is born the
   size of the whole square and is taken to its place with translate +
   scale from its top left corner, which is where it scales from in the
   reference (measured: the top left edge of the chip that stays does
   not move a pixel while the chip goes from 100 to 64). */
/* The side of the cluster, in rem: 21 px over a root of 16. It is the
   SAME 21 as --ss-cluster, and they have to stay that way: the width of
   the trigger is added up with the variable and the cluster is drawn
   with this constant, so if one moves without the other the button ends
   up with its spacing changed. */
const CLUSTER = 21 / 16

/* ─── HOW MUCH THE CHIPS OVERLAP ───
   With two, measured: diameter 0.643 of the square and centers at 0.357
   on each axis. The distance between centers is 0.357·√2 = 0.505 and
   the sum of the radii is 0.643, so they OVERLAP 0.138 of the square,
   which is 21.5 % of a diameter.

   With three THAT PROPORTION is kept, not the diameter. They are not
   the same thing: in a pyramid inside the same square, three circles of
   0.643 eat 44 % of their neighbor, twice as much, and the chip at the
   bottom covers the two on top. With the pyramid the neighbors sit at
   (1−k) and overlap (2k−1), so (2k−1)/k = 0.215 gives k = 0.56. */
const STACK_DIAMETER_2 = 0.643
const STACK_DIAMETER_3 = 0.56

function place(n: number, i: number): { x: number; y: number; k: number } {
  if (n <= 1) return { x: 0, y: 0, k: 1 }
  if (n === 2) {
    const k = STACK_DIAMETER_2
    return i === 0 ? { x: 0, y: 0, k } : { x: 1 - k, y: 1 - k, k }
  }
  /* ─── WITH THREE, A PYRAMID AND THEY OVERLAP ───
     Two on top and one centered below, stacked like the state of two
     and with the same 1 px ring in the color of the surface.

     Here the reference does something else: it leaves the three small
     ones in the grid of four and draws the fourth cell empty, a circle
     in the color of the hover. It was dropped after watching it. A hole
     is not a person, and put next to three that are it reads as a
     fourth photo that did not load. And with the diameter of the grid,
     0.47, the pyramid came out loose: three small dots separated by a
     gutter, which is the same reading of "something is missing here".
     Stacked they read as a group.

     The square is not touched: it still measures 0.523 H in the four
     states, which is the measured invariant of the reference. */
  if (n === 3) {
    const k = STACK_DIAMETER_3
    return i < 2 ? { x: i * (1 - k), y: 0, k } : { x: (1 - k) / 2, y: 1 - k, k }
  }
  const k = 0.47 /* measured: 47.5 over 101, with a 1 px gutter */
  return { x: i % 2 === 0 ? 0 : 1 - k, y: i < 2 ? 0 : 1 - k, k }
}

/* `side` goes in REM, not in pixels: the cluster grows with the
   system's text size just like the rest of the piece. */
function Cluster({ people, side }: { people: Person[]; side: number }) {
  const n = people.length
  /* The first paint does not animate: the chips that are already there
     when the piece appears are at rest, they have not just come in. The
     attribute is set after the first frame and from there on
     @starting-style finds the selector. */
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <span
      className="ss-cluster"
      data-mounted={mounted ? '' : undefined}
      style={{ width: `${side}rem`, height: `${side}rem` }}
    >
      {people.map((person, i) => {
        const cell = place(n, i)
        return (
          <span
            key={person.id}
            className="ss-chip"
            style={{
              width: `${side}rem`,
              height: `${side}rem`,
              transform: `translate(${cell.x * side}rem, ${cell.y * side}rem) scale(${cell.k})`,
              zIndex: i,
            }}
          >
            {/* the ring goes where the chips overlap: with two and with three */}
            <Chip person={person} size={side} ring={n === 2 || n === 3 ? 1 / 16 / cell.k : undefined} />
          </span>
        )
      })}
    </span>
  )
}

/* ─── IT IS USED IN THE LIST TOO ───
   The piece plays nothing: there is no script, no loop and no state
   that moves on its own. In the list it is the same control as in the
   detail and it answers the pointer, which is how the other Web piece
   of the exhibition behaves.

   A script of four states used to live here, running every 1500 ms as
   long as the pointer was over the card. It read like a recording,
   which is exactly what a Web piece is not. */
export default function SelectSummary({ mode = 'detail' }: { mode?: Mount } = {}) {
  /* IN THE LIST THERE IS NO TABBING, BUT THERE IS TOUCHING. There the
     demo is a preview inside a card that promises to open the detail:
     six more tab stops per card make a mess of it, so the controls come
     out of the tab order and the click of each one is stopped so that
     it does not navigate. With the pointer the piece works whole, which
     is what a live preview has to do. */
  const isPreview = mode === 'list'
  const [selection, setSelection] = useState<Selection>('all')
  /* STOPPING THE CLICK. In the list the whole card navigates to the
     detail, and the click of a control of the piece goes up to it.
     `preventDefault` is enough: the card's handler bails out if the
     event was already handled (cardClick, in parts.tsx). In the detail
     there is no card and preventDefault takes nothing away from a
     <button type="button">, so it is the same code for both. */
  const stopClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  /* IT STARTS OPEN, and that belongs to the piece and not to the
     control: what has to be seen is where the summary comes from, and
     with the panel closed the card shows a lone pill with nothing to
     explain it. In a product the initial state would be the opposite. */
  const [open, setOpen] = useState(true)
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()

  /* Close on touching outside, which is what any menu does and what the
     reference does at the end of the clip. */
  useEffect(() => {
    if (!open) return
    const closeIfOutside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeIfOutside)
    return () => document.removeEventListener('pointerdown', closeIfOutside)
  }, [open])

  /* ─── ESCAPE IS CONSUMED BY THE PANEL, NOT BY THE PAGE ───
     It closes and GIVES THE FOCUS BACK to the trigger: without that the
     focus stays on a row that goes to visibility hidden and the tab key
     starts over from the beginning of the document.

     IT GOES ON THE ROOT OF THE PIECE AND NOT ON THE DOCUMENT, and that
     is what fixes a measured collision. The page also closes with
     Escape (the detail goes back to the list, app.tsx) and its listener
     lives on `document`. With both of them listening there, a single
     key did both things: measured, the focus reached the trigger and
     300 ms later you were on the home with the piece remounted.
     Listening on the root, the stopPropagation cuts the event BEFORE it
     leaves the piece (React's listener lives on the app's container,
     which is below document) and the page never finds out.

     It only consumes the key if the panel is open and the focus is
     inside. With the panel closed, or with the focus somewhere else,
     Escape belongs to the page again: it is its key, and a menu that
     does not have the focus has no reason to keep it. */
  const onRootKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Escape' || !open) return
    e.stopPropagation()
    setOpen(false)
    root.current?.querySelector<HTMLElement>('.ss-trigger')?.focus()
  }

  const people = selectedPeople(selection)
  const text = label(selection)

  /* ─── "All" IS ONE MORE CHECKBOX, AND IT GOES AT THE BOTTOM ───
     The position comes from shadcn/ui: first the content, then what
     talks about the content, and the people stay stuck to the trigger
     you come from. The form, a checkbox that marks itself when there is
     no filter, is Carbon's (IBM) parent checkbox.

     Two others were tried and dropped, watching them run. One was a
     COMMAND at the top, with no checkbox, dimmed when there was nothing
     to clear: that is what Apple's menus guideline asks for, and
     measured, none of the products I looked at does it (Apple and
     shadcn hide that control instead of dimming it). The other was not
     having the row: the model does not need it, because zero checkmarks
     is already "all", but you lose going back there in one tap.

     With "All" being a state and not an action, ALL the rows are
     checkboxes and the panel has a single role. */
  const allRow = {
    id: 'all',
    name: 'All',
    people: PEOPLE,
    checked: selection === 'all',
    all: true,
  }
  const rows = [
    ...PEOPLE.map((p) => ({
      id: p.id,
      name: p.name,
      people: [p],
      checked: selection !== 'all' && selection.includes(p.id),
      all: false,
    })),
    allRow,
  ]

  /* The row says which row it is; the id is only its key. */
  const selectRow = (row: (typeof rows)[number]) => {
    setSelection((s) => (row.all ? 'all' : toggle(s, row.id)))
  }

  const rowElements = () =>
    Array.from(panel.current?.querySelectorAll<HTMLElement>('.ss-row') ?? [])

  /* A negative i counts from the end, like a slice. */
  const focusRow = (i: number) => {
    const elements = rowElements()
    elements[i < 0 ? elements.length + i : i]?.focus()
  }

  /* Arrows inside the list, which is what a listbox expects. */
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const elements = rowElements()
    const i = elements.indexOf(document.activeElement as HTMLElement)
    const j = e.key === 'ArrowDown' ? i + 1 : i - 1
    elements[(j + elements.length) % elements.length]?.focus()
  }

  /* ─── FROM THE TRIGGER TO THE PANEL, WITH THE ARROWS ───
     WAI-ARIA's menu pattern asks that a button with aria-haspopup open
     AND leave the focus on the first item when the down arrow is
     pressed. Measured before this: six ArrowDown in a row and the focus
     did not move off the button. You got there with Tab anyway, so it
     was not an unreachable control, but it was a menu that is not
     driven like a menu.

     The focus cannot be asked for in the same frame: the rows are at
     visibility hidden while the panel is closed, and an invisible
     element does not take focus. That is why the intent is stored and
     the effect below collects it, with the panel already open. */
  const focusOnOpen = useRef<number | null>(null)

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const index = e.key === 'ArrowDown' ? 0 : -1
    if (open) return focusRow(index)
    focusOnOpen.current = index
    setOpen(true)
  }

  useEffect(() => {
    if (!open || focusOnOpen.current === null) return
    focusRow(focusOnOpen.current)
    focusOnOpen.current = null
  })

  return (
    /* oxlint-disable-next-line jsx-a11y/no-static-element-interactions --
       this root is not a control: it only DELEGATES the keyboard
       (Escape and the arrows) to the controls inside, which do have
       their role. Giving it a `role` here would announce a widget that
       does not exist. */
    <div
      className="ss"
      ref={root}
      data-list={isPreview ? '' : undefined}
      onKeyDown={onRootKeyDown}
    >
      <style href="select-summary" precedence="default">
        {CSS}
      </style>

      <button
        className="ss-trigger"
        type="button"
        tabIndex={isPreview ? -1 : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={(e) => {
          stopClick(e)
          setOpen((v) => !v)
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="ss-content">
          <Cluster people={people} side={CLUSTER} />
          <span className="ss-label">
            <span className="ss-label-text">{text}</span>
          </span>
          <svg className="ss-chevron" viewBox="0 0 8 13" aria-hidden>
            <path
              d="M1 5.2 4 2l3 3.2M1 7.8 4 11l3-3.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* oxlint-disable-next-line jsx-a11y/interactive-supports-focus --
          in a menu the focus lives on the ITEMS, not on the container
          (ARIA APG), and here the items are native `<button>`s, already
          focusable. Giving the container a `tabIndex={-1}` would make a
          click focus it and steal the focus from the button. */}
      <div
          className="ss-popover"
          data-open={open ? '' : undefined}
          id={`${id}-panel`}
          /* A MENU, not a listbox: four toggles and an action are not a
             list of options. It is the ARIA mapping of Apple's pull-down
             button, which is the component that allows choosing
             several. */
          role="menu"
          aria-label="People"
          ref={panel}
          onKeyDown={onPanelKeyDown}
        >
          {rows.map((row) => (
            <button
              key={row.id}
              className="ss-row"
              type="button"
              tabIndex={isPreview ? -1 : undefined}
              role="menuitemcheckbox"
              aria-checked={row.checked}
              data-checked={row.checked ? '' : undefined}
              data-footer={row.all ? '' : undefined}
              onClick={(e) => {
                stopClick(e)
                selectRow(row)
              }}
            >
              {/* Measured: the five rows line up their checkbox, their
                  cluster and their name on a single x, 0.00 px of
                  difference. */}
              <span className="ss-checkbox" data-checked={row.checked ? '' : undefined}>
                <svg className="ss-checkmark" viewBox="0 0 20 20" aria-hidden>
                  <path
                    d="m5.4 10.4 3.1 3.1 6.1-6.6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <Cluster people={row.people} side={CLUSTER} />
              <span className="ss-name">{row.name}</span>
            </button>
          ))}
        </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   The measured reasons are beside every number. H = 40 px.
   ═══════════════════════════════════════════════════════════════ */
const CSS = `
/* The piece is self-contained: it does not inherit the page's
   box-sizing. */
.ss, .ss *, .ss *::before, .ss *::after {
  box-sizing: border-box;
}

.ss {
  /* ─── EVERYTHING IN REM, EXCEPT THE LINES ───
     If somebody raises the browser's text size, the piece has to grow
     whole and not only the letters: that is why every measure goes in
     rem against the root of 16 px. The only thing that stays in pixels
     are the 1 px lines (the ring of the button, the ring of the
     popover, the separator and the ring that lifts a chip off the one
     underneath): a line exists to look thin, and multiplying it turns
     it into a bar. The comments carry the value in pixels at 100 % and
     its measured ratio against the height. */
  --ss-h: 2.5rem;                 /* 40 px · THE DECISION. Everything falls from here. */
  --ss-pad: 0.875rem;             /* 14 · 0.342 H = 13.7 */
  --ss-cluster: 1.3125rem;        /* 21 · 0.523 H = 20.9 · the same 21 as CLUSTER */
  --ss-gap: 0.5625rem;            /* 9 · 0.233 H = 9.3 */
  --ss-checkbox-gap: 0.625rem;    /* 10 · 0.241 H = 9.6 */
  --ss-font-size: 0.9375rem;      /* 15 · cap height 0.269 H = 10.8 */
  --ss-chevron-gap: 1rem;         /* 16 · 0.41 H, minimum: the chevron goes on the right */
  --ss-popover-gap: 1rem;         /* 16 · 0.389 H = 15.6 */
  --ss-radius: 0.8125rem;         /* 13 · 0.332 H = 13.3 */
  --ss-checkbox: 1.25rem;         /* 20 · 0.491 H = 19.6 */
  --ss-ring: 0.09375rem;          /* 1.5 · 0.041 H = 1.6 */
  --ss-chevron-width: 0.5rem;     /* 8 · 0.197 H */
  --ss-chevron-height: 0.8125rem; /* 13 · 0.332 H */
  --ss-outer-padding: 2.5rem;     /* 40 · ONE BUTTON HEIGHT of space above and below */
  /* A spring sampled to linear() and its duration of 355 ms used to
     live here, both of them only for the fill of the checkbox. They
     went with the choreography: see THE CHECKBOX, further down. */
  /* ─── THE WIDTH OF THE TRIGGER: THE SUM OF ITS PARTS ───
     It is fixed (it does not animate and it is not measured at run
     time) and it is not written as a loose number: it is ADDED UP, with
     the same variables that draw the button. The only thing chosen is
     the SLOT OF THE LABEL. That way the width cannot end up incoherent
     with what it holds: if tomorrow the padding, the cluster or the
     chevron changes, the width follows them instead of clipping the
     text.

        28  padding         --ss-pad × 2
        21  cluster         --ss-cluster
         9  gap             --ss-gap
        76  SLOT            --ss-label-width
        16  to the chevron  --ss-chevron-gap
         8  chevron         --ss-chevron-width
       ───
       158  plus the ring, which takes up no room

     And it is 160 with the rounding to 4 H, the unit of the whole
     piece: the slot of the label takes the 2 px left over. Everything
     is in rem, so at a root of 20 px the button measures exactly 200.

     THE SLOT FITS THE WIDEST OF THE SEVEN POSSIBLE LABELS. Measured on
     the page, InterVariable at 15 px: "All people" 69.59 · "Guillermo"
     67.25 · "2 people" and "3 people" 61.61 · "John" 35.06 · "Karri"
     33.61 · "Elon" 30.28. With 76 the widest one has 6.4 px of room,
     and the longest name 8.75. The label does not carry that width
     written down: it is flex and it keeps whatever is left over, which
     by the sum above is exactly the slot.

     NEITHER THINNER NOR FATTER, and this was looked at across four
     widths, not reasoned: at 148 the button cuts the "e" of "All
     people" (the exact floor is 153.59); at 176 the label floats and
     reads like a button half filled. 160 is the round value inside that
     band.

     AND SINCE THE WIDTH DOES NOT FOLLOW THE LABEL, with a short name
     there is room to spare up to the chevron: 46 px with "Elon" against
     22 with "All people". It is the price of the fixed width and it is
     what any select does: the text stays anchored on the left and the
     chevron on the right, and what never moves is the control.

     Being fixed costs the measured transition of the reference, and the
     why of that is written whole below, in .ss-trigger. */
  --ss-label-width: 4.875rem;   /* 78 · the widest label + 8.4 */
  --ss-trigger-width: calc(
    var(--ss-pad) * 2 + var(--ss-cluster) + var(--ss-gap) +
    var(--ss-label-width) + var(--ss-chevron-gap) + var(--ss-chevron-width)
  );                            /* 160 · 4 H */
  --ss-row: 2.5rem;             /* 40 · 1.013 H */

  /* ─── THE SURFACES: THE SYSTEM SETS THEM ───
     This used to carry over the STEP of the reference. The reference is
     dark and its three levels are #0f0f0f the page, #191919 the control
     and #232323 the row with the pointer: +5.2, +6.3 and +4.5 of ΔL*.
     Copying the hex did not work, because fifteen units of gray near
     white do not look like fifteen near black, so each level was
     computed to reproduce those same ΔL* against the card of each
     theme. Twelve percentages written by hand across four branches.

     That was swapped for the staircase the system already has.
     Measured, with the card at --surface as zero:

       token             light    dark  light+C   dark+C
       --canvas           +1.8    -1.5     +3.5     -3.5
       --surface           0.0     0.0      0.0      0.0
       --surface-hover    -1.4    +1.5     -2.9     +3.8
       --hairline         -4.5    +5.3     -8.8    +11.6
       what was here      -5.2    +4.3     -5.3     +4.8   (the control)

     Either of those two steps changes sign on its own with the theme
     and grows on its own in high contrast, which is exactly what the
     twelve percentages did by hand. --hairline does the same with the
     lines, and it already brings its own 5.1 % → 10.2 %. Which of the
     two goes is decided by the paragraph below.

     What is lost, said out loud: the control does NOT reproduce the
     step of the reference any more. It is a much lighter and much
     flatter control than the one in the video, and that is on purpose:
     the reference is dark and this exhibition is light, and here the
     exhibition rules.

     --selection-bg was dropped and it is worth writing down why: in
     dark it measures #fafaf9, L* 98.2. It is the background of a TEXT
     selection, and it is nearly white in both branches. Read off the
     stylesheet it looked like one more surface; measured, it is not.

     ─── AND IT IS --canvas, NOT --surface-hover ───
     This used to say --surface-hover, and it collided. The card of the
     exhibition is painted --surface and goes to --surface-hover with
     the pointer over it, which is EXACTLY when the piece runs on the
     home: the loop only advanced with the pointer over the card.
     Measured on the home, with the pointer on it:

       card     rgb(244,244,241)      light    rgb(18,18,17)   dark
       control  rgb(244,244,241)               rgb(18,18,17)
       panel    rgb(244,244,241)               rgb(18,18,17)

     The same color, the three of them. The control and the panel
     disappeared inside the card just while the piece was showing, and
     the only thing left was their 1 px line.

     --canvas is the other step the system already has, and it stays at
     a distance from the card IN BOTH ITS STATES: 5 units at rest and 9
     with the pointer, in both branches. And it falls on the right side
     without anything having to be written: in light the control ends up
     LIGHTER than the card and in dark DARKER, which is how controls
     behave in both themes. It does it on its own because the system
     already inverts the direction of its distances in dark. */
  --piece-surface: var(--canvas);
  /* The two steps above the control come from here and not from a token
     of the system: the hairline over the surface of the piece, resolved
     as an opaque color and not as a layer (the row crosses this
     property with a transition, and background-image does not
     interpolate). The 5.1 % is the alpha of --hairline itself. */
  --piece-surface-hover: color-mix(in srgb, var(--ink) 5.1%, var(--piece-surface));
  /* The press is the hairline DOUBLED, which is the same jump the
     system makes between its normal branch and the high contrast one.
     That way the three steps are even (panel, hover, press) instead of
     the last one being three times the one before. */
  --piece-surface-press: color-mix(in srgb, var(--ink) 10.2%, var(--piece-surface));
  --piece-border: var(--hairline);
  --piece-separator: var(--hairline);
  /* ─── THE CHECKED CHECKBOX GOES IN INK, NOT IN A COLOR ───
     The violet of the reference used to live here, measured: #867df9 in
     dark and #5b4fe0 in light so that the white on top reached
     contrast.

     It went because this exhibition HAS NO ACCENT COLOR. Its whole
     system is one text, three surfaces and one line; the only two
     colors that exist are the red of the destructive and the blue of
     the focus ring, and both have their reason written down. A violet
     coming from the recording of another product was the only color on
     the page, and it looked like it.

     Ink over canvas is what the system already does when something gets
     promoted: it is its rule for text selection in dark, total
     inversion. And it flips on its own with the theme, so the dark
     branch was left without a single line written. */
  --piece-accent: var(--ink);
  --piece-accent-glyph: var(--canvas);
  /* ─── THE OUTLINE OF THE PHOTO: PURE BLACK OR WHITE, AT 10 % ───
     A 1 px line inside the chip. The one that needs it is the LIGHT
     photo on a light surface (Karri's has a white background): without
     it the chip does not end anywhere.

     And it is not the system's --hairline, which is what was here. The
     outline of an image is the only color of the piece that is NOT
     chosen: pure black at 10 % in light, pure white at 10 % in dark,
     never a tinted neutral, because a neutral with a tint picks up the
     surface behind it and reads as dirt on the edge of the photo.
     Looked at with both values over Karri's photo: with the hairline's
     5.1 % the disc melts into the panel, with 10 % it ends.

     light-dark() instead of a theme query: the root already declares
     color-scheme light dark, so the piece still has not a single block
     of color per theme. */
  --piece-outline: light-dark(rgb(0 0 0 / 0.1), rgb(255 255 255 / 0.1));

  position: relative;
  display: flex;
  flex-direction: column;
  /* THEY ARE ALIGNED ON THE LEFT. The popover sticks to the left edge
     of the trigger (measured, the indent is 0 in the five states). When
     the trigger still changed width this also avoided 29 px of
     side-to-side swing per round; with the fixed width both measure the
     same and neither one moves. What gets centered in the card is the
     pair. Verified: piece, trigger and panel, a single value across the
     seven states. */
  align-items: flex-start;
  /* The space around it. The card of the exhibition brings no padding
     for a Web piece: the piece puts it there, since it is the one that
     knows how much it needs. It is one button height on each side, that
     is the same H the whole geometry falls from, and with that the card
     of the list goes from its floor of 260 to 338. */
  padding: var(--ss-outer-padding) 0;
  box-sizing: content-box;
  font-size: var(--ss-font-size);
  line-height: 1;
  letter-spacing: -0.006em;
}

/* ─── HIGH CONTRAST ───
   The surfaces follow the branch on their own: --canvas and --hairline
   already change, and the two steps derive from --ink. The only thing
   left written is the alpha of the veil, and it follows the system's
   hairline in its own jump from 5.1 % to 10.2 %. */
@media (prefers-contrast: more) {
  .ss {
    --piece-surface-hover: color-mix(in srgb, var(--ink) 10.2%, var(--piece-surface));
    --piece-surface-press: color-mix(in srgb, var(--ink) 20.4%, var(--piece-surface));
  }
}

/* ─── DARK ───
   THERE IS NO BLOCK, and that is the result. The violet of the accent
   and the achromatic outline flipped by hand used to live here. With
   the accent in ink over canvas and the outline in the system's
   hairline, the four colors of the piece invert on their own with the
   theme and there is not one line left to keep in sync. */

/* ─── THE TRIGGER ───────────────────────────────────────────── */
.ss-trigger {
  display: flex;
  align-items: center;
  height: var(--ss-h);
  padding: 0 var(--ss-pad);
  border: 0;
  /* ─── THE BORDER IS A RING, NOT A BORDER ───
     An inset box-shadow of 1 px draws the same line in the same place,
     and it takes up not one unit of layout. Two things get fixed with
     that:

     · The sum of the width stops having a term in pixels. With border,
       the 2 px of the border were the only part of the sum that did not
       scale with the rem, and the button measured 199.5 instead of 200
       with the root at 20. Now the sum is proportional all the way
       through.
     · The ring is translucent and composites over whatever it has
       underneath, which is the reason a solid border color does not
       work: it is tuned against one background and only against that
       one. The system's --hairline was already translucent; what
       changes is that now it does not push the content either.

     It goes INSET and not outside: outside, the pill would look 2 px
     wider than its box, and here the width is the decision everything
     falls from. */
  box-shadow: inset 0 0 0 1px var(--piece-border);
  /* A pill: verified against the circle across 48 rows of the frame,
     with an error under 1 px. It is not a large radius, it is half the
     height. */
  border-radius: 999px;
  background: var(--piece-surface);
  color: var(--ink);
  font: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  /* Without this the browser reserves the double tap for zooming and
     delays the first one to see whether the second one is coming. In a
     control that opens and closes, that delay is the only thing you
     feel. */
  touch-action: manipulation;
  width: var(--ss-trigger-width);
  /* ─── THE WIDTH DOES NOT ANIMATE, AND IT GOES AGAINST THE REFERENCE ───
     The signature transition of the piece used to live here: 370 ms
     with cubic-bezier(.19,1,.22,1), the best fit of 14 curves × 39
     durations over 18 samples of two transitions of the reference,
     RMSE 0.034.

     It fell when the label was chosen to change in one frame. The two
     do not live together: with the text changing at once and the pill
     growing for 370 ms, the new label stays CLIPPED while the button
     catches up with it. Measured, from "Ana" to "All people": 42 px cut
     off at the start and some 200 ms until it fits. Photographed it
     reads "All p" → "All pec" → "All peop": it does not look like a
     reveal, it looks like a truncated label, because the chevron sits
     right against the cut.

     The fade of the reference exists exactly for that (it goes out in
     ~110 ms, there is one frame with nothing, it comes in in ~133) and
     the pill resizes while there is no text to cut. Without a fade, the
     only thing that avoids the clipping is the width arriving in the
     same frame.

     And with the width still there is nothing left to animate here: the
     trigger has no transition. The feedback of the press is the one
     below, which does not move either. */
}
/* ─── THE FEEDBACK IS IN THE PRESS, AND IT DOES NOT MOVE THE BUTTON ───
   CSS's :active pseudo-class fires when the pointer goes down, not when
   it comes up, so the feedback arrives in the same frame as the touch.
   Waiting for the click leaves the control dead during the gesture, and
   that is the first thing you notice.

   WHAT GIVES THE FEEDBACK IS THE FILL, NOT THE SCALE. There used to be
   a scale of 0.985 here, tuned in pixels: the pill is wide, so one same
   scale moves the sides 4.6 times more than the top (0.97 pulled the
   sides in 2.74 px, 0.985 pulled them in 1.37 and the top 0.30).
   Measured on screen, pressing without releasing, the left edge of the
   button moved 1.20 px and the top one 0.30.

   It went because the control DOES NOT MOVE FROM ITS PLACE, and that
   holds for everything: not the width, not the position, not on being
   pressed. The fill says the same thing without moving anything, it is
   what the five rows of the panel already do (with the argument written
   down below) and it is what the piece already did with reduced motion.
   Now both branches do the same.

   And it does not go against the references: DESIGN.md › The press
   tells that 23 pages of benji and josh were swept looking for :active,
   that there is a single live one and that the active:scale utilities
   of josh's bundle are used by ZERO elements. The press scale is a rule
   from a guideline, not something you see on the pages we looked at.

   With no transition, like the rows: measured in the reference, this
   kind of fill appears and disappears in one frame (≤17 ms). And the
   asymmetry that was here, 90 ms going down and 160 coming up, goes
   with the scale: there is nothing to come back from. */
.ss-trigger:active {
  background: var(--piece-surface-press);
}
.ss-trigger:focus-visible {
  outline: var(--focus-outline);
  outline-offset: var(--focus-outline-offset);
}

.ss-content {
  display: flex;
  align-items: center;
  gap: var(--ss-gap);
  width: 100%;
}

.ss-label {
  display: flex;
  align-items: center;
  /* ─── THE BOX OF THE LABEL IS THE SLOT, AND IT CLIPS ───
     flex: 1 makes it take up everything left over between the cluster
     and the chevron: with the width of the button fixed, that IS the
     76 px slot of the sum above (measured, 76.00 in the seven states)
     and the chevron stays nailed against the right padding.

     The clipping is the last defense: if some day a label does not fit
     in the slot, the box cuts it instead of pushing the chevron out of
     the button. Today it cuts none of the seven, and that is measured
     too.

     It goes clip and not hidden because hidden forces the other axis to
     auto, and there are variants that move the label vertically. And
     the gap up to the chevron goes in MARGIN and not in padding: the
     clipping happens in the padding box, so with padding the word could
     get to touch the icon. */
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: clip;
  overflow-y: visible;
  margin-right: calc(var(--ss-chevron-gap) - var(--ss-gap));
  white-space: nowrap;
}

/* Both measures come out of the variables and not from a px written
   here: the width of the button adds them up, and a chevron that does
   not grow with the rest would leave that sum short as soon as somebody
   raises the text size. */
.ss-chevron {
  width: var(--ss-chevron-width);   /* 8 · 0.197 H */
  height: var(--ss-chevron-height); /* 13 · 0.332 H */
  flex: none;
  color: var(--text-secondary);
}

/* ─── THE LABEL ─────────────────────────────────────────────── */
.ss-label-text {
  white-space: nowrap;
  /* The label carries a number that changes, "2 people", "3 people",
     and the text is anchored on the left, so what would move is the
     word after the digit. Measured in InterVariable: with proportional
     figures the two labels measure 61.11 and 61.27, that is 0.16 px of
     shift; with tabular ones both measure 61.61. It is a difference you
     do not see (before, with company names, it was 0.60) and it stays
     the way it is because it costs nothing and because there is a
     number here that changes. */
  font-variant-numeric: tabular-nums;
}
/* ─── THE CLUSTER ───────────────────────────────────────────── */
.ss-cluster {
  position: relative;
  flex: none;
  /* The chips stack with z-index 0..3 to decide which one covers which.
     Without this there is no stacking context of its own (position:
     relative with z-index auto does not create one) and those numbers
     compete with the rest of the page instead of staying in here. */
  isolation: isolate;
}
.ss-chip {
  position: absolute;
  top: 0;
  left: 0;
  /* It scales from its top left corner: that is where it scales from in
     the reference (the edge of the chip that stays does not move). */
  transform-origin: 0 0;
  transition: transform 370ms var(--ease-dialog);
}

/* ─────────────────────────────────────────────────────────────
   THE CHIP THAT COMES IN
     0 ms   born at scale 0, centered in the cell it gets
    90 ms   reaches its size, ease-out
   Meanwhile, and in parallel, the ones that were already there
   travel to their new cell with the transition above, which is
   longer.
   ─────────────────────────────────────────────────────────────

   TWO BOXES BECAUSE THERE ARE TWO ORIGINS. The chip that rearranges
   scales from its top left corner (measured: that edge does not move
   while the chip goes from 100 to 64 px). The one that comes in scales
   from its CENTER: measured, its center stays at (0.245, 0.767) of the
   cluster while the diameter goes from 0.059 to 0.475. A single element
   cannot have two origins, so the outer one sets the place and the size
   of the cell, and the inner one sets the entrance.

   THE PAIR IS MEASURED. Three takes of the reference with the detection
   threshold lowered to 0.02 (needed to see the chip while it still
   measures 6 px) swept against eight curves × 73 durations, with the
   phase fitted per take because the camera does not land on the frame
   of the start:

     ease-out    cubic-bezier(0,0,.58,1)     90 ms   RMSE 0.056
     out-quad    cubic-bezier(.25,.46,.45,.94)  105   0.060
     out-cubic   cubic-bezier(.33,1,.68,1)     135   0.064
     --ease-surface                            205   0.068
     --ease-dialog                             255   0.073

   The two curves of the system are the ones that fit WORST: they need
   205 and 255 ms and even so they score last. They are curves with a
   brutal start, for surfaces that appear, and this is softer and much
   shorter. That is why the value is written here with its receipt and
   does not come out of a token, which is the same thing the 370 of the
   width and the 67 of the popover already do.

   IT STARTS AT 0, AND THAT CONTRADICTS A RULE. "Never enter from
   scale(0)" exists because nothing appears out of nothing. Here it does
   not apply, by arithmetic: the chip measures 11.8 px, so starting at
   0.95 is 0.6 px of travel and the animation would not exist. Either it
   grows from small or it does not animate. Measured, the reference
   starts at 0.059 of the cluster over an end of 0.475, that is 12 %,
   and the fitted curve extrapolates to 0.

   SYMMETRIC, and not faster on the way out. It is the same discussion
   as the box that used to open, settled the same way: DESIGN.md says
   its motion is symmetric and reserves the asymmetry for the press.

   THERE IS NO EXIT, AND IT IS NOT AN OVERSIGHT. The reference never
   takes a single chip out: it goes from four to one at once and then
   adds them one at a time. The exit cannot be measured there, and
   animating it asks for keeping alive a chip that React already
   unmounted. It is pending and it is said. */
.ss-chip > span {
  scale: 1;
  transition: scale 90ms ease-out;
}
@starting-style {
  .ss-cluster[data-mounted] .ss-chip > span {
    scale: 0;
  }
}

/* ─── THE POPOVER ───────────────────────────────────────────── */
/* ─── WHERE THE POPOVER LANDS ───
   Stuck to the LEFT edge of the trigger, not centered under it:
   measured in five different states, the indent is 0 in all five. With
   the fixed width both left edges line up on their own and there is
   nothing to correct; the piece aligns them on the left and the popover
   never shifts. */
.ss-popover {
  /* IN FLOW, NOT FLOATING. That way the height of the piece comes out
     on its own (it used to be a calc by hand that had to be maintained)
     and the width of the piece is the one of the popover, which is what
     gets centered in the card. It stays present when it is closed: if
     it were unmounted, the card would change height on opening and
     closing. */
  margin-top: var(--ss-popover-gap);
  /* NEVER NARROWER THAN THE CONTROL THAT OPENS IT, and it is this line
     that holds it up: measured, the panel asks for 157.25 on its own
     (its widest row is checkbox, cluster and "Guillermo") against the
     160 of the trigger. Without the minimum it would come out 2.75 px
     narrower than its button, which reads as a clipping and not as its
     continuation. With shorter names the difference was 39 px. */
  min-width: var(--ss-trigger-width);
  /* The same ring as the trigger, for the same reason: see
     .ss-trigger. */
  border: 0;
  box-shadow: inset 0 0 0 1px var(--piece-border);
  border-radius: var(--ss-radius);
  background: var(--piece-surface);
  overflow: hidden;
  transform-origin: 0 0;
  /* Measured: 67ms, four frames at 60 fps, and almost linear, in both
     directions. The scale starts at 0.98 from the top left corner; the
     popover does not shift. The visibility takes it out of the
     accessibility tree and out of the tab order when it is closed, and
     its transition with no duration is deferred so that the fade can be
     seen. */
  opacity: 0;
  scale: 0.98;
  visibility: hidden;
  transition:
    opacity 67ms linear,
    scale 67ms linear,
    visibility 0s linear 67ms;
}
.ss-popover[data-open] {
  opacity: 1;
  scale: 1;
  visibility: visible;
  transition:
    opacity 67ms linear,
    scale 67ms linear,
    visibility 0s;
}

.ss-row {
  display: flex;
  align-items: center;
  gap: var(--ss-gap);
  width: 100%;
  height: var(--ss-row);
  padding: 0 var(--ss-pad);
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  letter-spacing: inherit;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  /* the same reason as in the trigger: without this, the double tap
     stays reserved for zooming and the first one arrives late */
  touch-action: manipulation;
  /* THE NAME LIGHTS UP, AND NOT IN ONE FRAME. Measured in the
     reference: the color of the name in the row crosses in ~67 ms with
     ease-out. It goes with the TEXT pair of the system, which is the
     one DESIGN.md assigns to whatever crosses a color; that is 100 ms
     against the 67 measured, and the system wins as in the rest of the
     piece.

     Only color is named: the fill of the hover carries NO transition,
     and that is measured too (it appears and disappears in one
     frame). */
  transition: color var(--dur-text) var(--ease-text);
}
/* ─── THE "All" ROW, AT THE BOTTOM ───
   A separator above it and nothing else. The menus guideline asks for a
   separator between groups, and "All" is its own group: it talks about
   the other four, it is not a fifth company.

   And it goes at the same height as the others. In the reference that
   row measures 1.202 H against 1.013, 48 against 40, but there it is a
   section HEADER, at the very top. At the bottom and being a checkbox
   like the others, nothing explained the extra height and it left the
   row as the only one of five that was different. */
.ss-row[data-footer] {
  box-shadow: 0 -1px 0 var(--piece-separator);
}
/* THE HOVER ONLY WHERE THERE IS A POINTER. Without the query, touching
   a row on a touch screen fires :hover and the fill STAYS STUCK until
   something else is touched: the finger does not go anywhere, so
   nothing turns the state off. The :active below does not need the
   guard, it lasts as long as the touch does, and neither does the
   focus. */
@media (hover: hover) and (pointer: fine) {
  .ss-row:hover {
    /* No transition, and it is a measurement: the fill appears and
       disappears in one frame (≤17 ms). */
    background: var(--piece-surface-hover);
  }
}
/* And pressing paints one more step, in the same frame as the touch. A
   row does not scale (it is a rectangle the width of the panel and
   shrinking it reads as an error): what gives the feedback is the
   fill. */
.ss-row:active {
  background: var(--piece-surface-press);
}
.ss-row:focus-visible {
  outline: var(--focus-outline);
  outline-offset: calc(var(--focus-outline-offset) * -1);
}
.ss-row[data-checked] {
  color: var(--ink);
}


/* ─── THE CHECKBOX: A SQUARE WITH A CHECKMARK ───
   It used to be a ring with a dot inside, that is, a RADIO BUTTON.
   Apple's guideline, read from their documentation API on 2026-09-08,
   is explicit in both directions:

     "A radio button is a small, circular button… radio buttons present
      a set of mutually exclusive choices."
     "If you need to let people choose multiple options in a set, use
      checkboxes instead."
     "A checkbox is a small, square button that's empty when the button
      is off, contains a checkmark when the button is on."

   This control chooses SEVERAL, so it goes square and with a checkmark.
   The radio button promised the opposite of what it does.

   The radius of the square is 0.3 of its side: it is not a loose
   number, it is what keeps the curve of the inner outline concentric
   with the one of the round chip next to it.

   ─── HOW IT ANIMATES: ONE SINGLE TIME FOR ONE SINGLE BOOLEAN ───
   Border, fill and checkmark cross together, all of them with
   --dur-surface and --ease-surface. Nothing has a delay and nothing has
   a duration of its own.

   IT USED TO BE A CHOREOGRAPHY IN THREE ACTS, and measured on screen it
   lasted 374 ms:

     6 ms    fill at scale 0.4, checkmark not started
    74 ms    the checkmark is STILL not started (it had 70 of delay)
    91 ms    only then does it start to draw itself with
             stroke-dashoffset
   257 ms    the checkmark ends
   374 ms    the fill only then reaches 1

   Three problems, and the first one is the one you see. The
   confirmation arrived LATE: during the first five frames after the
   click the checkmark did not exist, in a control whose only job is to
   say "yes, this one". Second, four different durations for a single
   change of state, 140, 374, 107 and 70+200, when the rule of the
   system is that whatever moves as a unit shares its time. Third,
   374 ms is more than double the time budget for feedback.

   And above all: MEASURED, THE REFERENCE DOES NOT ANIMATE THIS. The
   checkbox changes in one frame, ≤17 ms, with no transition. The whole
   choreography was an invention of ours on top of the interaction that
   repeats the most in the piece.

   What is left is the middle point between that measurement and having
   nothing: a short crossing, of one piece. The fill starts at 0.8 and
   not at 0.4, so 12 px of travel become 4, and the checkmark fades
   instead of drawing itself. The stroke is lost, which was the pretty
   part; what is gained is that the control answers in the frame you
   touch it in.

   Symmetric on unchecking, like everything else in the piece. */
.ss-checkbox {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--ss-checkbox);
  height: var(--ss-checkbox);
  margin-right: calc(var(--ss-checkbox-gap) - var(--ss-gap));
  border: var(--ss-ring) solid var(--piece-border);
  border-radius: calc(var(--ss-checkbox) * 0.3);
  flex: none;
  color: var(--piece-accent-glyph);
  transition: border-color var(--dur-surface) var(--ease-surface);
}
/* the fill, on a layer of its own so it can be scaled without moving
   the border */
.ss-checkbox::before {
  content: '';
  position: absolute;
  inset: calc(var(--ss-ring) * -1);
  border-radius: inherit;
  background: var(--piece-accent);
  scale: 0.8;
  opacity: 0;
  transition:
    scale var(--dur-surface) var(--ease-surface),
    opacity var(--dur-surface) var(--ease-surface);
}
.ss-checkmark {
  position: relative;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity var(--dur-surface) var(--ease-surface);
}
.ss-checkbox[data-checked] {
  border-color: var(--piece-accent);
}
.ss-checkbox[data-checked]::before {
  scale: 1;
  opacity: 1;
}
.ss-checkbox[data-checked] .ss-checkmark {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  /* Reduced motion: the only thing that moves goes away, the growth of
     the fill. The fade stays: it explains the change without displacing
     anything on the screen. */
  .ss-checkbox::before,
  .ss-checkbox[data-checked]::before {
    scale: 1;
  }
}

.ss-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── REDUCED MOTION ────────────────────────────────────────────
   Much less is left than before, because the piece hardly moves any
   more: the width is fixed, the label changes in one frame and the
   feedback of the press is a fill. What goes away here is the only
   thing that travels, the chips of the cluster, which rearrange and
   grow, and the scale the panel appears with. The fade stays: opacity
   moves nothing on the screen.

   The feedback of the press is NOT touched: it has no movement left to
   take away and it is comprehension, not decoration. */
@media (prefers-reduced-motion: reduce) {
  .ss-chip,
  .ss-chip > span {
    transition: none;
  }
  .ss-popover {
    scale: 1;
  }
}
`
