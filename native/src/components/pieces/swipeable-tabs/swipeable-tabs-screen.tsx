import { StatusBar } from 'expo-status-bar'
import { StyleSheet, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { Tab } from './tab-bar'
import { Header } from './header'
import { LIGHT, COLOR } from './measurements'
import { Page } from './page'
import { SwipeableTabs } from './swipeable-tabs'
import { Theme } from './theme'

/* ═══════════════════════════════════════════════════════════════
   SWIPEABLE TABS: the screen, self-contained. It assembles the data,
   picks the palette and mounts the piece. The route
   (`src/app/[slug].tsx`) finds it in the registry by its slug and
   mounts it. In the exhibition the piece is called `Swipe between
   tabs`: the slug stayed the one from the day it was published (see
   `Piece` in `src/pieces.ts` of the web repo).

   The reference is X on iOS: the vault clip (`Swipeable tabs.mov`) and
   the recordings of the user's account, measured frame by frame. Each
   value's receipt is above it in `measurements.ts`, and the whole
   spreadsheet is in `.context/recon/swipeable-tabs/MEDICIONES.md`.

   THE FOLDER HAS THE SHAPE OF A react-native-motion COMPONENT
   (`apps/expo/components/animations/<slug>/`), and since 2026-09-10
   with its same names: `index.tsx` exports this screen by default,
   `swipeable-tabs.tsx` is the mechanism, and beside it its parts
   (`tab-bar`, `collapse`, `page`, `header`), the theme (`theme.ts`,
   palettes in `measurements.ts`) and the data (`media.ts`). Its
   registry is there too, `components/pieces/registry.ts`, but derived
   from the folders and not written by hand: see there for why.

   The labels are the reference's on purpose: that way the comparison
   against the clip is direct, frame against frame, without a shorter or
   longer text moving the underline and muddying the reading.
   ═══════════════════════════════════════════════════════════════ */

/* The symbols follow the reference's rule, which is not decorative: the
   two feeds of your own carry a CHEVRON on the right (they are menus,
   they unfold) and the topic tabs carry an ICON on the left, which
   names them. That is also why they are painted differently: the
   chevron gray, the icon white. Both values are measured off the clip.

   They are SF Symbols, that is, the system's icon typeface: the same
   optical weight as the text next to it and no asset to maintain. */
/* SIX tabs, not seven: the user's X account has exactly these, and with
   six the whole strip almost fits on the screen. The scroll limit lands
   at ~30 pt and no underline ends up under the gradient after a drag.
   With a seventh tab (Sports was tried) the active tab could end up
   with its underline tucked under the right ramp, which was the
   complaint: "the bar under the last item looks blurred". RUNTIME: in
   X's new recordings (2026-09-01) the state with Design active leaves
   the row at its limit and the gradient off. */
const TABS: Tab[] = [
  { id: 'for-you', label: 'For you', symbol: 'chevron.down', side: 'right' },
  { id: 'following', label: 'Following', symbol: 'chevron.down', side: 'right' },
  { id: 'stocks', label: 'Stocks', side: 'left', chip: true },
  { id: 'tech', label: 'Tech', symbol: 'cpu', side: 'left' },
  { id: 'ai', label: 'AI', symbol: 'sparkles', side: 'left' },
  { id: 'design', label: 'Design', symbol: 'paintbrush', side: 'left' },
]

export function SwipeableTabsScreen() {
  const insets = useSafeAreaInsets()
  /* The SYSTEM decides the theme, as in the X app: there is no toggle
     of our own. The dark palette is the measured one; the light one
     carries its receipt (and its lack of receipt) above `LIGHT` in
     `measurements.ts`. */
  const palette = useColorScheme() === 'light' ? LIGHT : COLOR

  return (
    <Theme.Provider value={palette}>
      {/* No `paddingTop`: the piece reaches the edge of the screen and
          it is the collapsing block that includes the status bar. When
          it rises, the content passes underneath it (see
          `collapse.tsx`). */}
      <View style={[css.piece, { backgroundColor: palette.background }]}>
        {/* `auto` follows the system color scheme, same as the palette. */}
        <StatusBar style="auto" />
        <SwipeableTabs
          tabs={TABS}
          top={insets.top}
          header={<Header />}
          page={(tab, index) => <Page id={tab.id} index={index} />}
        />
      </View>
    </Theme.Provider>
  )
}

const css = StyleSheet.create({
  piece: { flex: 1 },
})

/*
 * Do not touch without measuring again
 *
 * The loose values (colors, sizes, paddings) have their receipt above
 * each one in `measurements.ts`. Only the ones that are not a number go
 * here: the rules that the piece feeling like the reference depends on.
 *
 * - `d`, `h` and `t` are ONE shared value (`Segment`), not three.
 *   Splitting them brings the icons' flicker back: the styles read a
 *   trio that never existed and the incoming icon lights up all the way
 *   for a frame.
 *   RUNTIME: trace taken from the style's own mapper, a sweep of six
 *   pages. All six tabs did 0.000 → 1.000 → 0.008 on the crossing. With
 *   one value: zero spurious changes of direction in 492 frames.
 *   SOURCE for why: `useAnimatedReaction` calls `startMapper` with no
 *   list of outputs, so Reanimated's topological order cannot put it
 *   before whoever reads what it writes.
 *
 * - The row moves with the same progress as the content, tapping AND
 *   dragging, and `TAB_BAR.row` (measurements.ts) picks the rule:
 *   'visible', today's one, stays where it was and only shifts as much
 *   as it takes for the active one to fit whole; 'center' centers the
 *   active one in the WHOLE screen (440), clamped to the limit.
 *   RUNTIME: X does 'center'. The seven transitions of the user's three
 *   recordings (2026-09-01) fall in that model, Stocks→Tech with the
 *   finger included (row 0 → 45.6, linear with the content, v1 frames
 *   203-221). ASKED FOR (2026-09-02): "it only changes once I go to a
 *   tab that is not visible". 'visible' is that, and with six tabs it
 *   moves the strip only on AI↔Design, Following↔For you and on taps to
 *   a covered tab. A conscious decision about the reference; going back
 *   is one word.
 *
 * - A far tap moves the content ONE single page, not four.
 *   RUNTIME: in the For you → Tech tap of the X video there is a single
 *   splice; neither Following nor Stocks appears. Here it is achieved
 *   by lending the origin page to the slot next to the destination.
 *
 * - The finger interrupts any tap, including a far one. The loan stays
 *   alive while you drag and it is given back only when it cannot be
 *   seen: on reaching the destination, or on stopping over the lent
 *   page, jumping in the same frame to its real slot (with the haptic
 *   for that jump silenced). Until 2026-09-07 the pager refused the
 *   finger during a far tap, against `animate-expo`'s interruption
 *   rule.
 *   NO RECEIPT on screen yet: it gets tested on the phone.
 *
 * - The tap's curve is easeOutCubic at 300 ms, and it is NOT the drag's
 *   curve. They are two different animations: the drag's is the
 *   UIScrollView's deceleration and nobody chooses it.
 *   RUNTIME: fitted against the THREE taps of the user's new recordings
 *   (RMS 0.0081/0.0123/0.0179; the previous bezier(.4,.9,.72,1) gave
 *   0.0153/0.0068/0.0250 and felt abrupt. The whole story is above
 *   `EASE_SETTLE`).
 *
 * - The symbol's glyph OVERFLOWS its slot: it draws 16 pt in a place
 *   that occupies 11. Making them equal fattens the active tab by ~5 pt
 *   and it shows in the width of the underline.
 *   RUNTIME: the reference's underline measures 90.7 / 77.7 / 58.7 on
 *   Stocks / Tech / AI.
 *
 * - The symbol hides BEHIND the word, like X: it is born ~1-2 pt
 *   covered, travels WHOLE (never clipped) the measured 13/12 pt, and
 *   the label's zIndex exists for that.
 *   RUNTIME: the receipt for `slide` is in `measurements.ts`, with TWO
 *   round trips on top of it: the clipping window and the feather were
 *   tried and rolled back (the morning of 2026-09-01), and so was the
 *   DEEP CRADLE (slide 4/7, a travel of 17) that same afternoon ("do it
 *   like they do", with the recordings of the real account as the
 *   receipt). Do not touch it again without reading that story in
 *   `measurements.ts` and MEDICIONES.md.
 *
 * - The symbol's fade has TWO curves: the white icon goes with r^1.5
 *   STARTING at `ICON.floor` and the gray chevron goes linear. And the
 *   label interpolates color with `gamma: 1` (raw sRGB), not in linear
 *   space. Matching the curves brings back the "it appears all at
 *   once"; removing the floor brings back the ghost stuck to the word.
 *   RUNTIME: curves extracted frame by frame off the clip with the
 *   underline as the clock; the table is above `slide` in
 *   `measurements.ts`. The floor is the only deliberate deviation (NO
 *   RECEIPT, a perceptual request): on the spec frame (r=0.348) it
 *   gives 43/181/91 against X's 55/180/93, and in exchange at r<0.15
 *   not even the ghost is left (luma ≤ 8).
 *
 * - The occlusion is REAL: the label carries its own background in the
 *   palette's color (a clearance of 4 pt compensated with a negative
 *   margin, and `measure` subtracts it from the onLayout), and the
 *   symbol emerges through a clean edge flush with the word. Two things
 *   break if you touch them one at a time: without the background, the
 *   covered symbol shows between the letters (the smudge); without the
 *   clearance, the two inks graze each other.
 *   RUNTIME: rest states intact to the tenth with the background in
 *   place; the solid channel of 4 pt is measured at r=0.5.
 *
 * - EVERY inactive word LEANS `TAB_BAR.lean` = 4.7 pt away from the
 *   active tab: labels, veils and symbols, NEVER the boxes or the
 *   underline. It is what makes "For you" shift when it loses the
 *   chevron and what makes the dying word travel slot+lean (~26 pt,
 *   like X). Taking it out brings back three symptoms at once.
 *   RUNTIME: the table of the six words in X's six rest states is above
 *   `lean` in `measurements.ts`; verified on screen with parked states
 *   (For you −2.4 at t=0.5, exactly half of −4.7).
 *
 * - The occlusion edge is NOT a hard edge: it carries a veil of
 *   `feather` = 2.5 pt of gradient. Its ceiling is an inequality, not a
 *   matter of taste: clearance + feather + bearing ≤ 7.5 (the rest gap
 *   of the 17 pt icon), or the veil would touch the symbol at rest.
 *   RUNTIME: profile of the cut with the veil: 82→68→56→45→33→21→10→0
 *   over 2.5 pt (without the veil it was a one-column step); rest state
 *   of the tightest case: 255→245→48→0, without a trace. And WATCH OUT
 *   FOR YOGA: absolute children are positioned from the border box, so
 *   the hit area's padding is added by hand or the veil lands 12 pt
 *   off.
 *
 * - The Stocks symbol is a composed CHIP (outline + five rotated bars),
 *   not an SF Symbol. The zigzag's vertices are measured off the pixel;
 *   the whole receipt is above `CHIP` in `measurements.ts`.
 *   RUNTIME: profile row by row against frame 107 of the clip. Identical
 *   box and the mountain to ±2 px.
 *
 * - The row's content carries the `+`'s width as a tail. Without that
 *   the ScrollView does not reach the limit and the last tab ends up
 *   44 pt short.
 *   RUNTIME: Design's underline stopped at 272.3 instead of 223.3.
 *
 * - The row has TWO ramps, and they are the same idea at both ends: the
 *   right one comes in when there is scroll left ahead, the left one
 *   when there is content hidden behind (`row > 0`). The same width
 *   (`EDGE.ramp`) on purpose. It is not a blur: in the reference the
 *   letters keep their stems sharp while they lose luminance.
 *   RUNTIME: the reference dims the letters over ~21 pt (6→153); ours
 *   gives 20→125 and full ink at 23. Off at rest with no scroll: the F
 *   in For you starts at a full 255.
 *
 * - The labels do NOT scale with Dynamic Type (`allowFontScaling:
 *   false`).
 *   RUNTIME: on the same phone at the same moment, X measured 62.3 pt
 *   of width and 10.00 of cap while the system was at extra-small.
 *
 * - The haptic is `impactAsync(Light)` in `onTap` (onPress), NEVER in
 *   onPressIn: there it fired when you started dragging the row,
 *   because the finger rests on a tab ("take the haptic out",
 *   2026-09-01). The scroll cancels the press, so the drag goes mute on
 *   its own.
 *   NO RECEIPT for the intensity: the clip is video and has no haptic
 *   track. It was tuned by hand with the phone.
 *
 * - LIGHT mode comes out of `useColorScheme` (the X app follows the
 *   system) and the palette travels through the `Theme` context. BOTH
 *   palettes are measured with the same method: the dark one in the
 *   vault clip and the light one in the collapse recording
 *   (2026-09-02). The light active is a neutral #000000, not the web's
 *   #0F1419; the light divider is #C9CBCB, not #EFF3F4. Receipt above
 *   `LIGHT` in `measurements.ts`.
 *
 * - THE BLOCK AT THE TOP COLLAPSES with the content's scroll: status
 *   bar + header + tabs + divider translate 1:1 with the scroll delta
 *   (no threshold, no snap, no animation of their own) until the
 *   divider is flush against the edge of the status bar. The block's
 *   BACKGROUND is opaque and does not fade, and when it stops it is
 *   what covers the status bar; what fades is everything on top of it,
 *   with α = 1 − rise/(0.94·travel). Scrolling up it comes back along
 *   the same path, from wherever it stopped. There is NO separate
 *   cover.
 *   RUNTIME: light recording of X (2026-09-02): translation = scroll to
 *   the tenth; travel 151.6 = its bottom edge (213.7) minus the status
 *   bar (62); the row at 62 pt is pure white halfway through the
 *   collapse (the background does not fade); L = 1.8·D. Two round trips
 *   taken and written down in `collapse.tsx`: the whole block faded
 *   (the cover's hairline showed through) and the whole travel with the
 *   labels leaving through the top (rejected on the phone: "go back to
 *   how it was"). No receipt: on changing tabs the block does not end
 *   up more collapsed than the scroll of the arriving page.
 *
 * - `EDGE.slack` is 4 and it has TWO readings that do not agree: 3.6 pt
 *   in the vault clip and 0.0 in the new recording.
 *   NO SINGLE RECEIPT: the old value was kept because it has one of its
 *   own, but one of the two measurements is wrong and nobody knows
 *   which.
 */
