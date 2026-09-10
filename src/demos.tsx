import { Suspense, lazy, type ComponentType } from 'react'
import css from './app.module.css'

/* ═══════════════════════════════════════════════════════════════
   THE LIVE DEMO OF A WEB PIECE: the slug → component map.

   A Web piece is demonstrated running, not in video: that is the
   `platform` rule in pieces.ts. This file is the mechanism: each piece
   is ONE FOLDER in src/components/pieces/, named after its slug, whose
   index.tsx exports the component by default. `Photo grid` lives in
   src/components/pieces/photo-grid/ and there is no registry to keep by
   hand. The folder IS the map, the same decision that makes the vault's
   folder the manifest.

   THE FOLDER HAS THE SHAPE OF components/animations/<slug>/ FROM
   react-native-motion (since 2026-09-10): `index.tsx` that exports,
   `<slug>.tsx` with the piece, and next to them whatever the piece
   needs: the detail's notes in `notes.tsx` (see src/notes.tsx), data,
   sub-parts. An App piece has the same folder, without an index: its
   demo is the video.

   A SKETCH ARRIVES THERE WHEN IT IS PUBLISHED. Add to Exhibition, over
   the frame of the board, copies the file from src/private/sketches/ to
   here and writes the index next to it. It is copied and not imported:
   src/private/ does not reach the build, so a published piece has to
   have its file on this side of the boundary. For the same reason, a
   piece CANNOT import anything from src/private/. That was already true
   of the sketch (it is born self-contained) and it has to stay true.

   It is the same trio as sketches.tsx (lazy glob, cache by ref,
   Suspense with no fallback) and no code is shared on purpose: that
   file belongs to the private area and this one travels to the
   bundle. */
/* THE ONLY PROP A PIECE RECEIVES: where it is mounted. In the list it
   is a PREVIEW inside a card that promises to open the detail, and that
   changes what it can do. A field you type into there fights with the
   click of the card, and four more buttons per card make a mess of the
   tab order. It is optional: a piece that never looks at it does not
   change at all.

   The piece used to work this out on its own, by looking at whether it
   had an <a> above it. That stopped working the day the card stopped
   being an anchor, which is exactly why it was not the way to do it:
   the piece ended up depending on the MARKUP of the product, which is
   not its own. */
export type Mount = 'list' | 'detail'

const MODULES = import.meta.glob<{ default: ComponentType<{ mode?: Mount }> }>(
  './components/pieces/*/index.tsx',
)

/* One per piece and not one per render: `lazy` keeps the module's
   promise inside itself, and creating another one would remount the
   demo, with its state, on every render of the list. */
const cache = new Map<string, ComponentType<{ mode?: Mount }>>()

function componentFor(slug: string): ComponentType<{ mode?: Mount }> | null {
  const key = `./components/pieces/${slug}/index.tsx`
  const load = MODULES[key]
  if (!load) return null
  let c = cache.get(key)
  if (!c) {
    c = lazy(load)
    cache.set(key, c)
  }
  return c
}

/* The demo inside the box of the card, the one in the list and the one
   in the detail, which is the same box with another floor. If the
   folder has no index, an entry written by hand without its piece,
   nothing is drawn, which is the empty box that was already there. */
export function LiveDemo({ slug, mode }: { slug: string; mode: Mount }) {
  const C = componentFor(slug)
  if (!C) return null
  return (
    <div className={css.liveDemo}>
      <Suspense fallback={null}>
        {/* oxlint-disable-next-line react/static-components -- `C` is not
            created on every render: `componentFor` caches the `lazy()` in a
            module-level Map and returns the same reference per key. The bug
            the rule is looking for, losing the state on every render, cannot
            happen here. */}
        <C mode={mode} />
      </Suspense>
    </div>
  )
}
