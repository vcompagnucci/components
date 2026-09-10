import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import css from './app.module.css'
import { Detail, Item, Masthead, textBaseline } from './parts'
import { PIECES, type Piece, type Platform } from './pieces'
import { SITE } from './site'
import { NotFound } from './not-found'

const PLATFORMS = ['Web', 'App'] as const
const by = (pl: Platform) => PIECES.filter((p) => p.platform === pl)

/* ═══════════ THE PRIVATE ROUTES ═══════════
   The vault and the playground. THEY ARE NOT PUBLISHED: they exist only
   while the development server runs, and not because the host blocks
   them but because the code never reaches the build.

   They are TWO FOLDS, and both are needed:

     1. the list        import.meta.env.DEV ? [...] : []
     2. the component   import.meta.env.DEV ? lazy(() => import(…)) : null

   Vite replaces import.meta.env.DEV with `false` when it builds, both
   ternaries fold to their empty branch, and with that the strings
   "/vault" and "/playground" disappear along with the whole dynamic
   import. Rollup does not generate the chunk of something nobody
   reaches. Without fold 1 the routes would stay written in the bundle;
   without fold 2 the code would. Verified by counting occurrences in
   dist/.

   The list lives here and not inside src/private/ for the same reason:
   importing it from the other side would tie it to the bundle. Here it
   is the router that knows which routes exist, which is already its job
   (the same as with the pieces), and src/private/ only knows how to
   draw them.

   And since in production the list stays empty, fromUrl never returns
   'private' and /vault falls into the same branch as any made-up URL:
   404, with no special rule. */
export type PrivateRoute = { path: string; name: string }

/* What comes AFTER the private route: /vault/nativo/sheet.mov leaves
   "nativo/sheet.mov". It exists because the detail of a clip has to
   live in the HISTORY and not in local state.

   It used to live in a useState, and that produced a bug that felt like
   a browser error: you opened a clip, made the back gesture on the
   trackpad, and instead of closing the clip it threw you out of the
   whole vault. You landed on /playground, because that was the real
   previous entry. The detail was not on the stack, so there was nothing
   to undo.

   It also leaves every clip linkable, which is what you want when you
   hand a reference to an agent. */
export type PrivateView = { route: PrivateRoute; rest: string }

const PRIVATE_ROUTES: PrivateRoute[] = import.meta.env.DEV
  ? [
      { path: '/vault', name: 'Vault' },
      { path: '/playground', name: 'Playground' },
    ]
  : []

const PrivateArea = import.meta.env.DEV ? lazy(() => import('./private/private')) : null

/* ON PURPOSE THERE IS NO LINK TO /vault OR /playground on the front
   page, not even in dev: you enter the private area by typing the URL.
   There was a tab bar here and it was taken out by request. The front
   page is the page of the product, and the private area is not part of
   the product. */

/* Routes without a router: there are THREE views. `/` is the list,
   `/button` is the piece, and anything else is a route that does not
   exist.

   The three answers are benji's and josh's, which match exactly,
   measured with curl against both:

     /drawesome     200            the piece
     /no-existe     404            the URL STAYS, it does not redirect
     /Drawesome     404            the capital is NOT normalised
     /drawesome/    308 → no slash  permanent redirect to the canonical

   The trailing slash is resolved here with replaceState, the client
   equivalent of a 308 (it adds no entry to the history, so the back
   button does not get trapped bouncing) and on the host with the real
   config. Nothing else is touched: an invalid route stays where it is.

   And the title does NOT change on the 404. Also measured: benji's
   still says "Benji Taylor" and josh's "Josh Puckett".

   The real HTTP status has to come from the host, because a SPA that
   already loaded cannot change it. Since the routes of the pieces are
   known at build time, the host can serve index.html only for those and
   return a real 404 for everything else, which is exactly what both of
   them do. It is in vercel.json; today, with PIECES empty, there is no
   rewrite at all and only `/` exists. The rewrite comes back with the
   first real piece. */
type View =
  | { kind: 'list' }
  | { kind: 'piece'; piece: Piece }
  | { kind: 'private'; route: PrivateRoute; rest: string }
  | { kind: 'none' }

const fromUrl = (): View => {
  let path: string
  try {
    path = decodeURIComponent(location.pathname)
  } catch {
    return { kind: 'none' }
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.replace(/\/+$/, '')
    history.replaceState(history.state, '', path + location.search + location.hash)
  }
  if (path === '' || path === '/') return { kind: 'list' }
  /* In production PRIVATE_ROUTES is empty, so this find never hits and
     /vault falls into 'none' like any made-up URL.

     It matches the exact path AND its subpaths: /vault and
     /vault/whatever. The separator in the startsWith matters: without
     it "/vaultimpostor" would come in too.

     THE THIRD FOLD: the whole block goes behind import.meta.env.DEV even
     though the find is already a dead branch with the list empty. What
     the minifier cannot prove dead is the LITERAL 'private' in the
     return. Measured: it traveled to the bundle as a loose word, the
     only one from the area in dist. With the constant if, Rollup throws
     out the whole block, literal included. (The render gate below gets
     this for free with its `&& PrivateArea`, which is already null in
     production.) */
  if (import.meta.env.DEV) {
    const route = PRIVATE_ROUTES.find((p) => path === p.path || path.startsWith(p.path + '/'))
    if (route) {
      return { kind: 'private', route, rest: path.slice(route.path.length + 1) }
    }
  }
  const found = PIECES.find((p) => p.slug === path.slice(1))
  return found ? { kind: 'piece', piece: found } : { kind: 'none' }
}

/* 80px taken off: the same top air as the page, so the title of the
   piece does not end up stuck to the edge when you get there. */
const goTo = (slug: string) => {
  const el = document.getElementById(slug)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - 80,
    behavior: reduce ? 'auto' : 'smooth',
  })
}

/* "Web", the first label of the index, sits on the same line as
   "Button", the title of the first piece. The two ends of the pair that
   was chosen by looking; the how is in the effect that measures it.

   WITH NO PIECES THE ANCHOR IS THE BODY'S OWN "Web": with the list
   empty there is no first piece and the index used to stay stuck to the
   masthead, the same word twice on screen at two different heights,
   106px of drift measured. The fallback aligns label against label;
   when the first real piece arrives, it rules again. */
const ALIGN = {
  from: '[data-first-label]',
  to: '[data-first-piece]',
  fallback: '[data-first-group]',
}

/* Which piece is active: the LAST one whose top edge has already
   crossed a line at --index-spy-line from the top of the viewport.

   It is benji's rule, which in his minified bundle looks more complex
   than it is:

     point      = scrollY + 128 + 0.5·windowHeight
     condition  = point > absoluteTop + 0.5·windowHeight

   Half a viewport is on both sides and cancels out, so what is left is
   `absoluteTop < scrollY + 128`, that is `rect.top < 128`. */
const SPY_LINE = 128

function activePiece(): string | null {
  /* With no pieces there is no active one, and without this exit the
     end-of-document clause would read PIECES[-1] and blow up on the
     first scroll of a short page. */
  if (PIECES.length === 0) return null
  let active: string | null = null
  for (const p of PIECES) {
    const el = document.getElementById(p.slug)
    if (el && el.getBoundingClientRect().top < SPY_LINE) active = p.slug
  }
  /* At the end of the document the last one wins no matter what: the
     one at the very bottom can be too short to ever reach the line.
     That one is his too. */
  const d = document.documentElement
  if (d.scrollHeight - window.scrollY - window.innerHeight < 24) {
    active = PIECES[PIECES.length - 1].slug
  }
  return active
}

function Index({ active }: { active: string | null }) {
  /* With no pieces there is no index: a nav with two labels and zero
     links is scaffolding in plain sight. The same decision as the
     sections of the body, below. */
  /* THE INDEX STAYS EVEN WITH NO PIECES, an explicit request: the Web
     and App labels are the structure of the house, and the structure
     shows even when the rooms are empty. A group with no pieces renders
     its label and an empty list; the effect that aligns against the
     first piece already knows to do nothing if it does not find it. */
  return (
    <nav className={css.index} aria-label="Pieces">
      {PLATFORMS.map((pl) => (
        <div className={css.indexGroup} key={pl}>
          {/* The first label is the one that aligns with the first piece. */}
          <div className={css.indexLabel} data-first-label={pl === PLATFORMS[0] ? '' : undefined}>
            {pl}
          </div>
          <div className={css.indexList}>
            {by(pl).map((p) => (
              <button
                className={css.indexLink}
                key={p.slug}
                data-active={active === p.slug ? '' : undefined}
                onClick={() => goTo(p.slug)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function App() {
  const [view, setView] = useState<View>(fromUrl)
  const [active, setActive] = useState<string | null>(null)
  /* The list is the only view with an index and a scrollspy; the other
     two share "it is not the list". */
  const selected = view.kind === 'piece' ? view.piece : null
  const isList = view.kind === 'list'
  const listScroll = useRef(0)
  const first = useRef(true)

  /* ALIGNMENT OF THE INDEX. "Web", the first label, sits on the same
     line as "Button", the title of the first piece.

     The pair was chosen by looking, against two others: first link ↔
     first piece, and label ↔ section separator. This one won.

     It aligns by the BASELINE of the text and not by the middle of the
     boxes: the index's lines are 13/16 and the page's are 14/20, so
     centring them leaves the letters sitting at two different heights.
     (Here the difference between the two ways is 0.60px and the
     rounding to a whole pixel eats it, but the formula being the right
     one stops being a detail the moment the two sizes drift further
     apart.)

     And it is MEASURED instead of calculated. The correct number would
     be the sum of the whole vertical stack of the page, and writing
     that sum as a calc would duplicate the entire structure in a
     formula nobody would update if an element gets added in the middle
     tomorrow: it would be wrong and nothing would say so. By measuring,
     it corrects itself, as already happened when 16px of air went into
     the label.

     In useLayoutEffect, before painting, so the jump is not seen. */
  useLayoutEffect(() => {
    if (!isList) return
    const align = () => {
      const nav = document.querySelector<HTMLElement>('[aria-label="Pieces"]')
      const from = document.querySelector<HTMLElement>(ALIGN.from)
      const to =
        document.querySelector<HTMLElement>(ALIGN.to) ??
        document.querySelector<HTMLElement>(ALIGN.fallback)
      if (!nav || !from || !to) return
      const current = parseFloat(getComputedStyle(nav).top) || 0
      const delta = textBaseline(to) - textBaseline(from)
      nav.style.setProperty('--index-offset-top', `${Math.round(current + delta)}px`)
    }
    align()
    window.addEventListener('resize', align)
    return () => window.removeEventListener('resize', align)
  }, [isList])

  /* The active piece needs the scroll, because the answer changes
     continuously and not at an edge. It is computed in rAF so that
     layout does not run more than once per frame. */
  useEffect(() => {
    if (!isList) return
    let pending = 0
    const read = () => {
      pending = 0
      setActive(activePiece())
    }
    const onScroll = () => {
      if (!pending) pending = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (pending) cancelAnimationFrame(pending)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [isList])

  useEffect(() => {
    const onPop = () => setView(fromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  /* The private routes carry their own name and not the product's: they
     are not the product, and with two tabs open the name is the only
     thing that tells them apart. The rest, the list and the route that
     does not exist, keeps saying the name of the product, the same as
     before.

     It is `SITE.name`, the same string the masthead's H1 reads, and
     since 2026-09-10 that is enforced by there being one string: the
     why of not shortening it is written above it in src/site.ts. */
  useEffect(() => {
    if (view.kind === 'piece') document.title = `${view.piece.name} — ${SITE.name}`
    /* The DEV in front folds the literal 'private' out of the bundle,
       see the third fold in fromUrl. In production this branch is
       unreachable anyway (fromUrl never returns that kind). */
    else if (import.meta.env.DEV && view.kind === 'private') document.title = view.route.name
    else document.title = SITE.name
  }, [view])

  /* Going back to the list returns the scroll to where you were.
     Without this the list reappears at the very top and you lose your
     place, which with 18 pieces is half a screen of scrolling. The
     first render is skipped so as not to override the browser's own
     restoration on reload. */
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo(0, isList ? listScroll.current : 0)
  }, [view])

  /* Generic client navigation: it pushes the URL and reads the view
     back out of it. That the view comes from fromUrl() and not from an
     argument is on purpose: that way reaching /vault by link, by the
     address bar or by the back button always goes down the same path. */
  const go = (path: string) => {
    history.pushState({}, '', path)
    setView(fromUrl())
  }

  const open = (p: Piece) => {
    listScroll.current = window.scrollY
    history.pushState({ fromList: true }, '', `/${p.slug}`)
    setView({ kind: 'piece', piece: p })
  }

  /* If you arrived from the list, you go back through the history and
     the stack does not grow. If you came straight in from a link there
     is nowhere to go back to, so the list gets pushed. */
  const back = () => {
    if (history.state?.fromList) {
      history.back()
      return
    }
    history.pushState({}, '', '/')
    setView({ kind: 'list' })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected) back()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  /* The `&& PrivateArea` is not defensive, it is what tells TypeScript
     that in production this does not exist. And a private view without
     a component cannot happen: both come out of the same
     import.meta.env.DEV. */
  if (view.kind === 'private' && PrivateArea) {
    return (
      /* fallback of null and not a sign: the chunk is on disk, one fetch
         away from the local server, and anything drawn would be a
         one-frame flicker. */
      <Suspense fallback={null}>
        <PrivateArea routes={PRIVATE_ROUTES} current={view.route.path} rest={view.rest} go={go} />
      </Suspense>
    )
  }

  if (view.kind === 'none') {
    return <NotFound />
  }

  if (selected) {
    return (
      <div className={css.page}>
        <Detail piece={selected} onBack={back} />
      </div>
    )
  }

  return (
    <div className={css.page}>
      <Index active={active} />
      <Masthead />
      <div className={css.content}>
        {/* The sections also stay with zero pieces, the same decision
            as the index: the structure is there, the content arrives. */}
        {PLATFORMS.map((pl) => (
          <section className={css.group} key={pl} data-platform={pl}>
            <div className={css.groupHead}>
              {/* The index's fallback anchor when there are no pieces. */}
              <div
                className={css.groupLabel}
                data-first-group={pl === PLATFORMS[0] ? '' : undefined}
              >
                {pl}
              </div>
              <span className={css.groupLine} aria-hidden />
            </div>
            {by(pl).map((p, i) => (
              <Item piece={p} onOpen={open} first={pl === PLATFORMS[0] && i === 0} key={p.slug} />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
