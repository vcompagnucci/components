import { Component, Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import css from './playground.module.css'
import { nameOfPath } from './clips'

/* ═══════════════════════════════════════════════════════════════
   THE SKETCHES: writing a component from scratch, inside the canvas.

   A sketch is A REAL FILE in src/private/sketches/, exporting a default
   component. The frame draws it, Vite reloads it when you save, and the
   canvas never finds out: no page reload, nothing loses its position.

   ─── WHY NOT AN EDITOR IN THE BROWSER ───
   The alternative was Monaco or CodeMirror plus a transform in the
   client (esbuild-wasm), and it would be a big dependency to give you
   an editor WORSE than the one you already have open next to this. And
   above all: an agent writes files, it does not type into a textarea.
   If the sketch is a file, the two ways of working, you in the editor
   and an agent in the terminal, are the SAME one, and neither of them
   needs an interface.

   All of this lives in src/private/, so the glob never touches the
   bundle.

   ─── IT IS WEB ONLY, AND THAT IS ON PURPOSE ───
   An App piece does not get built here: it gets built against the
   simulator, with the agent alongside, and it reaches the exhibition as
   video. The canvas does not try to simulate a phone. react-native-web
   would draw the shape and would lie about exactly what this vault
   studies, which is the gesture.
   ═══════════════════════════════════════════════════════════════ */

/* The glob brings the KEYS right away, and the module only when it is
   asked for. Eager would import the thirty sketches every time you open
   any canvas. */
const MODULES = import.meta.glob<{ default: ComponentType }>('./sketches/*.tsx')

const PREFIX = './sketches/'
const SUFFIX = '.tsx'
const refOf = (key: string) => key.slice(PREFIX.length, -SUFFIX.length)

/* The ones that exist today, for the add dialog. It is recomputed when
   the module reloads, and Vite reloads this module when a new file
   matching the glob shows up: that is why a sketch you just created
   appears in the list without touching anything. */
export const SKETCHES = Object.keys(MODULES).map(refOf).sort()

export const sketchName = (ref: string) => nameOfPath(ref)

/* ONE PER REF AND NOT ONE PER RENDER. `lazy` keeps the module's promise
   inside it: creating a new one on every render would mount the sketch
   again, and throw its state away, every time you move the frame. */
const cache = new Map<string, ComponentType>()

function componentOf(ref: string): ComponentType | null {
  const load = MODULES[PREFIX + ref + SUFFIX]
  if (!load) return null
  let c = cache.get(ref)
  if (!c) {
    c = lazy(load)
    cache.set(ref, c)
  }
  return c
}

/* ─── THE SURFACE FOR "NOT YET" ───
   The same box a clip that is no longer there uses: the name and one
   word that says why it is empty. It shows up at two short moments,
   while the module travels and in the milliseconds between the file
   being created and Vite saying it exists, and at one long one: when
   the sketch is broken. */
function Placeholder({ sketchRef, reason }: { sketchRef: string; reason: string }) {
  return (
    <div className={css.placeholder}>
      <span className={css.placeholderName}>{sketchName(sketchRef)}</span>
      <span className={css.placeholderReason}>{reason}</span>
    </div>
  )
}

/* ─── A BROKEN SKETCH CANNOT TAKE THE BOARD DOWN ───
   Writing freely means that half the time the file is half done, and
   without this an `undefined.map` in a sketch unmounts the whole
   canvas: you lose the other frames, the selection and the gesture you
   were making. With the boundary, the only thing that goes dark is its
   frame.

   IT CLEARS ITSELF ON THE NEXT HOT UPDATE, which is exactly when you
   fixed the file. Without that the frame would stay red forever and you
   would have to reload the page, that is, lose the same thing this
   component came to save. And it clears ONLY if there is an error:
   overwriting the state on every save would remount every sketch on the
   board every time you touch any file. */
class ErrorBoundary extends Component<
  { sketchRef: string; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  clear = () => this.setState((s) => (s.error ? { error: null } : s))

  componentDidMount() {
    import.meta.hot?.on('vite:afterUpdate', this.clear)
  }

  componentWillUnmount() {
    import.meta.hot?.off('vite:afterUpdate', this.clear)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <Placeholder sketchRef={this.props.sketchRef} reason="Error" />
  }
}

/* The sketch in its frame. `key` on the boundary and not inside it:
   switching sketches has to start from zero, including the previous
   one's error.

   `data-sketch` is the contract with the canvas: it is what the frame's
   gesture looks at to step aside when the pointer lands inside a
   selected sketch. It goes in the attribute and not in the class
   because a CSS Modules class changes its name when it compiles. */
export function Sketch({ sketchRef }: { sketchRef: string }) {
  const C = componentOf(sketchRef)
  if (!C) return <Placeholder sketchRef={sketchRef} reason="Sketch" />
  return (
    <div className={css.sketch} data-sketch="">
      <ErrorBoundary key={sketchRef} sketchRef={sketchRef}>
        {/* No fallback: the module arrives in a frame or two and a gray
            flicker in between would be more noise than the emptiness. */}
        <Suspense fallback={null}>
          {/* oxlint-disable-next-line react/static-components -- `C` is not
              created on every render: `componentOf` caches the `lazy()` in a
              module-level Map and returns the same reference per key. The bug
              the rule looks for, losing the state on every render, cannot
              happen here. */}
          <C />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

/* PUBLISH a sketch as a Web piece. The server copies the file to
   src/components/pieces/<slug>/<slug>.tsx, the public side of the
   boundary, where demos.tsx finds it by slug, with an index.tsx next to
   it that exports it, and writes the entry down in pieces.ts, both or
   neither. It is a COPY: the sketch stays on the board, and from
   publication on the piece is edited in its published file. It returns
   the slug, which is where to navigate. */
export async function publishSketch(
  ref: string,
  name: string,
  desc: string,
): Promise<string> {
  const r = await fetch('/vault-media/__publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kind: 'sketch', ref, name, desc }),
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d?.error ?? `error ${r.status}`)
  return d.slug as string
}

/* A FREE NAME FOR THE NEXT ONE. The server rejects duplicates anyway,
   it writes with 'wx', so this is not the guard: it is here so you are
   not asked for a name before the thing exists, which is the same rule
   "New view" already uses. Renaming is renaming the file. */
export function freeRef(base = 'sketch') {
  if (!SKETCHES.includes(base)) return base
  for (let n = 2; n < 200; n++) if (!SKETCHES.includes(`${base}-${n}`)) return `${base}-${n}`
  return `${base}-${SKETCHES.length + 1}`
}

/* ─── CREATE ONE ───
   The server writes it because the browser cannot write to your disk,
   and it has to be a real file or neither your editor nor an agent can
   open it. The template and the guards are in scripts/vault-media.mjs.

   It returns the `ref`, the file name without the extension, or null if
   the server rejected it. */
export async function createSketch(name: string): Promise<string | null> {
  const r = await fetch('/vault-media/__sketch?name=' + encodeURIComponent(name), {
    method: 'POST',
  })
  /* `r.ok` and not only the shape of the response: the 409 for "it
     already exists" ALSO returns a ref, the one for the file that was
     already there, and taking it would put somebody else's sketch on
     the canvas believing one had been created. */
  if (!r.ok) return null
  const d = await r.json().catch(() => null)
  return typeof d?.ref === 'string' ? d.ref : null
}
