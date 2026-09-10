import { createContext, useContext } from 'react'
import { useAnimatedScrollHandler, useSharedValue, type SharedValue } from 'react-native-reanimated'

import { COLLAPSE } from './measurements'

/* ═══════════════════════════════════════════════════════════════
   THE COLLAPSE — the whole header rises with the content's scroll.

   It is what X does: as you scroll the feed down, the block at the top
   (status bar included, header, tabs and divider) translates upward
   EXACTLY as much as the content moved, and while it rises its contents
   fade out; scrolling up it comes back along the same path, also 1:1,
   from wherever it had got to. There is no threshold, there is no snap
   on release, there is no animation of its own: the header is a
   function of the scroll delta.

   TWO LAYERS, AND IT IS NOT A DETAIL: the block's BACKGROUND is opaque
   and does not fade; what fades is everything drawn on top of it
   (avatar, labels, underline, symbols). The block travels until its
   bottom edge, the divider, is flush with the bottom edge of the status
   bar: there it stops, with its background covering the status bar and
   the divider as the only line, and the content passes underneath. That
   is why the travel is `height − status bar` and not `height`.

   RUNTIME · the first version faded the ENTIRE block and the cover had
   a hairline: the hairline showed through the block while it faded
   ("there is a line on the way down", the user's screenshot,
   2026-09-02). In X that line does not exist during the collapse: in
   the recording, with the block halfway (D = 38..55), the row at 62 pt
   is pure white (255, not one pixel off). And the line you see
   travelling with the tabs is TWO rows: the bottom edge of the block,
   which goes out (208 → 233), and the content's top separator, right
   underneath, which does not (205, constant). Here the background is
   opaque and the divider stays opaque with it: it is the line that
   travels with the tabs and stops under the status bar, like X's.

   ─── WHAT WAS TRIED AND DOES NOT GO IN ───
   With the short travel the labels turn on and off in 88 pt of scroll,
   and the way back felt abrupt on the phone ("it appears very
   abruptly", 2026-09-02). The WHOLE travel was tried (150: the labels
   leaving through the top of the screen and coming back from there like
   X's, with a hairline-free cover under the status bar and the divider
   fading out): the user rejected it on the phone, "you ruined it, go
   back to how it was". THIS version stays. If the way back feels harsh
   again, what there is to touch is the fade (`fade` in
   measurements.ts), not the geometry.

   RUNTIME · the user's recording of X (2026-09-02, light mode,
   1320×2868 = 440 pt, 60 fps), two descents and two returns. The bar's
   divider (at rest at 150.0 pt) against the edge of a card in the
   content, frame by frame:

     descent 1  content  −8.7 −15.3 −21.7 −27.3 −33.0 −39.0 −44.3 −49.7
                divider  141.3 134.7 128.3 122.7 117.0 111.0 105.7 100.3
                → translation = scroll, to the tenth, from the first
                  frame

     return 1   D + Δcontent = 151.6 151.3 151.3 151.7 151.6 (5 frames)
     return 2   D + Δcontent = 151.7 151.7 152.0 151.4 151.7 151.7 151.7
                → maximum travel 151.6 = the bottom edge of X's block
                  (213.7 pt: it has one more row, the Spaces pill) minus
                  the status bar (62.0). The block stops with its bottom
                  edge flush against the status bar.

   The line left at 62.0 pt once the block is gone (luma 204 in every
   frame, f70-104) is that edge: it travels from 213.7 at rest, 1:1 with
   the scroll (205.0, 198.3, 192.0, …, 62.3, 62.0) and stays there. Here
   the block's bottom edge is the bar's divider, and it does the same:
   150.3 → 62.0.

   The fade of what sits on top is measured with the underline (a 2 pt
   bar, full ink) as the probe: its luma L climbs LINEARLY with the
   translation D, L ≈ 1.8·D in all four phases, so α = 1 − D/142 with a
   travel of 151.6: it goes out at 94 % of the trip. It is a fraction of
   the travel and not a number of points because X's block is taller
   than ours (the receipt is above `COLLAPSE.fade` in measurements.ts).

   Each page reports its own scroll (`useCollapsingScroll`); with six
   pages there are six scrolls and a single header, so on a tab change
   the header cannot end up more collapsed than that page scrolled (if
   it did, a gap would be left above the content). That is OUR DECISION,
   NO RECEIPT: the recording does not change tabs with the header
   collapsed.
   ═══════════════════════════════════════════════════════════════ */
export type Collapse = {
  /* Height of the block that collapses: status bar + header + tabs +
     divider. What each page leaves free at the top. */
  height: number
  /* How far the block can rise: `height` minus the status bar. The
     block stops with its divider flush against the edge of the status
     bar. */
  travel: number
  /* How far the block has risen, 0..travel. */
  rise: SharedValue<number>
  /* The vertical scroll of each page, by index. */
  positions: SharedValue<number[]>
}

export const CollapseContext = createContext<Collapse | null>(null)
export const useCollapse = () => useContext(CollapseContext)

/* Opacity of WHAT SITS ON TOP OF the block (not of its background) for
   a given rise. Worklet: the style reads it. */
export function collapsedOpacity(rise: number, travel: number) {
  'worklet'
  return Math.max(0, 1 - rise / (travel * COLLAPSE.fade))
}

/* A PAGE'S SCROLL MOVES THE COLLAPSE. Returns the handler for the
   page's vertical ScrollView and the height the page has to leave free
   at the top (the content starts below the block at rest).

   The rise moves with the scroll's DELTA and is clamped twice: to
   [0, travel], and to no more than the scroll itself. With the content
   at the top the header is whole, even if the bounce pushed it. */
export function useCollapsingScroll(index: number) {
  const collapse = useCollapse()
  const previous = useSharedValue(0)
  const handler = useAnimatedScrollHandler({
    onScroll: (e) => {
      if (!collapse) return
      const y = e.contentOffset.y
      const delta = y - previous.get()
      previous.set(y)
      collapse.positions.modify((p) => {
        'worklet'
        p[index] = y
        return p
      })
      const ceiling = Math.min(collapse.travel, Math.max(0, y))
      collapse.rise.set(Math.min(Math.max(collapse.rise.get() + delta, 0), ceiling))
    },
  })
  return { handler, height: collapse?.height ?? 0 }
}
