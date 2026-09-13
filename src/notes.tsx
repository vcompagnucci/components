import { Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import css from './app.module.css'

/* ═══════════════════════════════════════════════════════════════
   THE NOTES OF A PIECE: the long text of the detail.

   It is what the detail exists for: "the list shows, the detail
   explains" (the log). The description in PIECES is one line and stays
   one line. That is the one written when the piece is published, and
   the one you read straight through under the piece. This is the other
   thing: where it came from, how it was measured, what it fought.

   THE MECHANISM IS THE ONE IN demos.tsx, on purpose: a `notes.tsx` in
   each piece's folder, src/components/pieces/<slug>/, lazy glob, cache
   by ref and Suspense with no fallback. The folder IS the map and there
   is no registry to keep, the same decision that makes the vault's
   folder the manifest. A piece without notes draws nothing and breaks
   nothing. The notes of an App piece live in the same folder its demo
   would have if it were Web: they are the only part of it on this side
   of the repo (its code is in `native/`).

   And they are .tsx and not data: a note may want a link. What it
   CANNOT do is bring its own typography. The style all lives down here,
   so a notes file is prose and nothing else.

   THE SHAPE OF A NOTE: three sections at most, in the measured tone.
   "Anatomy" is for whoever just watched the video:
   what they are looking at and what it is made with, only THE ANIMATION
   that gives the piece its name; what surrounds it in the recording
   does not go there, and it is written from what you see towards the
   how, not from the implementation (the user's request, 2026-09-07).
   "Performance" is where it runs and what was measured. And, only when
   the piece calls for it, "Use cases". Two or three sentences per
   paragraph, and no library name the reader would not recognize:
   "React Native", not "Reanimated" (same request). Decided with the
   first piece (2026-09-05). And IT IS PROSE: a subhead per part inside
   "Anatomy" was tried, an h3 with the name and its paragraph below,
   a measured shape, and the user rejected it on the page ("I
   don't like this structure", 2026-09-07). The parts get named in
   passing, inside the paragraph, with their technical term (the repo's
   naming rule, AGENTS.md › Working method). */
const MODULES = import.meta.glob<{ default: ComponentType }>('./components/pieces/*/notes.tsx')

const cache = new Map<string, ComponentType>()

function componentFor(slug: string): ComponentType | null {
  const key = `./components/pieces/${slug}/notes.tsx`
  const load = MODULES[key]
  if (!load) return null
  let c = cache.get(key)
  if (!c) {
    c = lazy(load)
    cache.set(key, c)
  }
  return c
}

/* ONE SECTION OF THE NOTE, and its line. The separator is THE SAME one
   that splits the list into Web and App (.groupHead, a 14/600 label
   plus a hairline out to the edge of the rail, a gap of 8), measured in
   its day off a measured separator. It is
   reused whole instead of writing another one: a single line on the
   page means a single rule.

   Watch out for where each half comes from: the LINES are measured on
   one site (the other does
   not have a single one, zero <hr> on the page checked, SOURCE 2026-09-04)
   and the TONE of the labels comes from the other, which titles short and in
   sentence case ("The filter", "Apply it", "1. What's a displacement
   map?"). The mix is ours and that is why it gets said out loud. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={css.noteSection}>
      <div className={css.groupHead}>
        <h2 className={css.groupLabel}>{title}</h2>
        <span className={css.groupLine} aria-hidden />
      </div>
      {children}
    </section>
  )
}

export function Notes({ slug }: { slug: string }) {
  const C = componentFor(slug)
  if (!C) return null
  return (
    <div className={css.notes}>
      <Suspense fallback={null}>
        {/* oxlint-disable-next-line react/static-components -- `C` is not
            created on every render: `componentFor` caches the `lazy()` in a
            module-level Map and returns the same reference per key. The bug
            the rule is looking for, losing the state on every render, cannot
            happen here. */}
        <C />
      </Suspense>
    </div>
  )
}
