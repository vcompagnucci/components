import { useEffect, useState } from 'react'
import css from './reference-link.module.css'
import { useClips } from './clips'

/* ═══════════════════════════════════════════════════════════════
   THE WAY BACK: from the piece, to the reference it was measured
   against.

   It closes the loop the vault opens. Over there a clip offers the
   piece it produced; here the piece offers the clip it came from, and
   the two ends are the SAME field, `details.piece` in the vault's json.
   There is no second list to keep in step.

   ─── IT LIVES IN src/private/ AND THAT IS THE WHOLE POINT ───
   The exhibition is published and the vault is not. A link from the
   product to a clip on your disk cannot exist in production: the URL
   would 404 for everyone, and the path of a file of yours would travel
   inside the bundle. So this is not imported from parts.tsx, it is
   lazily loaded behind `import.meta.env.DEV`, which is the same two
   folds that keep the whole private area out of the build (see the
   comment at the top of app.tsx). In production the ternary folds to
   null, Rollup does not generate the chunk, and none of this text
   exists.

   ─── AND IT DOES NOT ASK THE PIECE, IT ASKS THE VAULT ───
   The piece knows nothing about clips, and that is on purpose: pieces.ts
   is product code and a reference is a private note. So the search runs
   the other way, over the vault's index, which is already loaded by the
   time you get here in the normal path. `useClips` is the same hook the
   vault uses, so there is no second request.

   With no vault connected, or with no clip naming this piece, it draws
   NOTHING. A dev-only affordance that appears empty is worse than
   absent: on a page you are about to record, an empty row is a thing to
   explain.
   ═══════════════════════════════════════════════════════════════ */
export default function ReferenceLink({ slug }: { slug: string }) {
  const { status } = useClips()
  /* The mount comes in one frame late on purpose. The link is the last
     thing on a page whose showcase is still settling, and appearing in
     the same frame as the video's first paint reads as part of the
     piece. One frame later it reads as what it is, an annotation. */
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!shown || status.loading || !status.connected) return null
  const clip = status.clips.find((c) => c.details?.piece === slug)
  if (!clip) return null

  return (
    <p className={css.line}>
      {/* A REAL <a> WITH A REAL href, and not a button that navigates.
          The private area is reached by typing the URL, so the one link
          into it has to be the kind you can copy, open in another tab,
          and hand to an agent. It is the same reason a clip's detail
          lives in the history and not in state (see PrivateView).

          The plain click is taken over anyway, so the trip does not
          reload the page: pushState plus a popstate, which is what
          app.tsx already listens to and the only way to route from here
          without threading `go` through product code for something
          that does not exist in production. A click with a modifier
          falls through to the browser and opens its tab, which is
          exactly what an <a> is for. */}
      Measured against{' '}
      <a
        className={css.link}
        href={`/vault/${clip.path}`}
        onClick={(e) => {
          if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
          if (e.button !== 0) return
          e.preventDefault()
          history.pushState({}, '', `/vault/${clip.path}`)
          window.dispatchEvent(new PopStateEvent('popstate'))
        }}
      >
        {clip.name}
      </a>
      {clip.details?.source ? <span className={css.source}> · {clip.details.source}</span> : null}
    </p>
  )
}
