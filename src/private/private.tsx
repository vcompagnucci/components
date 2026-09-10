import { useEffect, useState } from 'react'
import css from './private.module.css'
import { linkClick } from '../parts'
import type { PrivateRoute } from '../app'
import { Vault } from './vault'
import { Playground } from './playground'

/* A tab bar for the front page lived here (the entry links to Vault and
   Playground over the dev home) and it was taken out by request: you
   enter the private area by URL, with no visible door. The front page is
   the page of the product and it carries no development chrome. */

/* ═══════════════════════════════════════════════════════════════
   THE PRIVATE AREA — the vault and the playground.

   EVERYTHING THAT HANGS OFF THIS FOLDER EXISTS ONLY IN DEVELOPMENT. The
   door is in app.tsx, in a single line:

     const PrivateArea = import.meta.env.DEV ? lazy(() => import(...)) : null

   In the build Vite replaces import.meta.env.DEV with `false`, the
   ternary folds to `null` and Rollup deletes the whole dynamic import.
   It is not that the route gives a 404: it is that the code IS NOT
   THERE. Verified by counting occurrences in dist/, see the README.

   That is why the boundary is a folder and not a flag spread around:
   any file added in here inherits the door without anyone having to
   remember.

   THE DEPENDENCY GOES ONE WAY. This can import from the product
   (tokens, linkClick); the product cannot import from here, because
   that would drag it into the bundle.

   THEY ARE TWO THINGS IN ONE PLACE. The vault is what you look at; the
   playground is where you build. They share a frame and nothing else.
   ═══════════════════════════════════════════════════════════════ */

/* The list of routes arrives BY PROP and is not declared here. It lives
   in app.tsx (the router is already the one that knows which routes
   exist, the same as with the pieces) and it also has to stay on that
   side so it can fold to [] in the build. Here it only gets drawn. */
export default function PrivateArea({
  routes,
  current,
  rest,
  go,
}: {
  routes: PrivateRoute[]
  current: string
  rest: string
  go: (path: string) => void
}) {
  /* ⌘Z UNDOES THE LAST NAVIGATION — AND IT IS THE LAST LINK, NOT THE
     ONLY ONE.

     It is the same as the trackpad's back gesture, but with the
     keyboard, and in a place where you are going to have both hands on
     it, jumping from frame to frame with the arrow keys. Taking your
     hand off to make a two-finger gesture breaks that.

     THAT DAY ARRIVED: the playground already has real actions (moving a
     frame, adding a clip, deleting a view) and its ⌘Z undoes THAT. Its
     handler listens in CAPTURE, so it runs before this one without
     depending on the order the effects mounted in, and it marks the
     event with preventDefault. Here it is enough to step aside when it
     sees the mark.

     So in the vault ⌘Z is still "go back", and in the playground it is
     "undo". Whichever one has nothing to undo gives way.

     ⇧⌘Z is no longer free: it is redo, and the playground handles it. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* Somebody with more right to it already took it, see above. */
      if (e.defaultPrevented) return
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      if (e.shiftKey) return
      const t = e.target as HTMLElement | null
      /* In a text field ⌘Z is undo WHAT YOU TYPED, and the browser does
         that better than we do. */
      if (t instanceof HTMLElement && (t.closest('input, textarea') || t.isContentEditable)) return
      e.preventDefault()
      history.back()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  /* With something OPEN (a clip or a view) the frame has to be PINNED
     to the window and not just fill it as a minimum: that is what gives
     the flex chain that fits the clip a ceiling to hang from, and the
     playground canvas needs the same thing to measure itself against
     what is left of the screen.

     The two LISTS (the grid and the views) do not carry it, because
     they have to be able to grow and scroll. That is why the condition
     looks at `rest` and not at which view you are in: what decides is
     whether something is open. */
  const inDetail = rest !== ''

  /* ─── INSIDE SOMETHING THERE ARE NO TABS ───
     With a clip or a canvas open, the tab bar is NOT drawn.

     This used to hold only for the canvas, with this argument: "the
     detail of a clip still carries its bar, because there you are still
     looking at the vault". It was reverted by request, and the argument
     falls apart on its own when you look at the screen: in the detail
     you CANNOT go to Playground without going back first, so the two
     words are not navigation, they are a label saying where you are,
     and the clip's title right below already says that.

     Getting out does not depend on them either: the back arrow, the
     back gesture and ⌘Z all three do history.back().

     AND IT ALSO PAYS. The detail is tied to the window's height
     (height:100dvh, overflow:hidden) and the player hands out what is
     left over: taking out the chrome row does not leave a hole, the
     clip takes it, which is the only thing you came to look at.

     THE ACTIONS SLOT GOES WITH IT, and nothing is lost: the only one
     that uses it is the vault's filter, which only exists in the grid.
     The detail never portaled anything there. */
  const noTabs = inDetail

  /* The canvas also HANDS OVER THE FRAME'S VERTICAL AIR: it is full
     bleed on all four sides and the only thing that bounds it is its
     own sidebar. Without this there were 80px of canvas above and
     another 80 below a surface that has to reach the edge of the
     window. The detail of a clip does not: there the air is still part
     of the composition. */
  const inCanvas = current === '/playground' && inDetail

  /* THE BAR'S ACTIONS SLOT. Whichever view is open puts its own control
     here, and it ends up in the SAME ROW as the tabs, against the other
     end.

     It goes by portal and not by coordinates. The first version put the
     filter in position:absolute against the frame, and that worked but
     it tied the filter's position to the frame's padding and to the
     bar's height: either of the two moving left it shifted, and in a
     narrow window there was no way for it to drop down on its own.
     Being INSIDE the bar, flexbox arranges it and the small width gets
     solved by the same rule as everything else.

     The ref is kept in state and not in a useRef because the child has
     to RE-RENDER when the node exists; a ref does not tell it. */
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null)

  return (
    <div
      className={css.frame}
      data-detail={inDetail ? '' : undefined}
      data-canvas={inCanvas ? '' : undefined}
    >
      {/* The tabs are real links, with the same interceptor as the piece
          in the list: cmd-click opens a new tab. */}
      {!noTabs && (
        <nav className={css.bar} aria-label="Private">
          {routes.map((r) => (
            <a
              className={css.tab}
              key={r.path}
              href={r.path}
              data-active={current === r.path ? '' : undefined}
              aria-current={current === r.path ? 'page' : undefined}
              onClick={linkClick(() => go(r.path))}
            >
              {r.name}
            </a>
          ))}
          <div className={css.actions} ref={setActionsSlot} />
        </nav>
      )}
      {current === '/vault' ? (
        <Vault open={rest} go={go} actionsSlot={actionsSlot} />
      ) : (
        <Playground open={rest} go={go} actionsSlot={actionsSlot} />
      )}
    </div>
  )
}
