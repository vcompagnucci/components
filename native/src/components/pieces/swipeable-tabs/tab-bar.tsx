import { SymbolView } from 'expo-symbols'
import { memo, useCallback, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  interpolateColor,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import type { SFSymbol } from 'sf-symbols-typescript'

import { TAB_BAR, EDGE, CHIP, ICON, LABEL, UNDERLINE, tabExtra } from './measurements'
import { usePalette } from './theme'

/* ═══════════════════════════════════════════════════════════════
   THE BAR — the row of tabs, the underline, the gradient and the `+`.

   It has no selection state and does not know which tab is chosen: it
   receives a `Segment` (`d`, `h` and `t`, 0..1) and EVERYTHING it draws
   comes out of that. That is the finding from the reference and the
   reason the piece feels right: in the clip the underline and the
   content go together frame by frame (0.233/0.262, 0.589/0.604,
   0.794/0.800), so the underline does not animate on its own, it is a
   function of the drag.

   `t` and not the pager's position, because the two stopped being the
   same thing: a far tap moves the CONTENT a single page even if the
   jump is four tabs wide (the reference does that, it is measured in
   the pager). The pager knows which is which; the bar only wants the
   0..1.

   ────────────────────────────────────────────────────────────────
   THE ACTIVE TAB IS WIDER, AND THAT IS THE WHOLE PROBLEM.

   When a tab becomes active a symbol appears on it, a chevron on the
   right in the feeds and an icon on the left in the topics, and the tab
   grows 18 pt (measured). If that were a flex row, every frame of the
   drag would be a Yoga layout pass over the seven tabs.

   So the row is NOT a flex row. The whole layout is computed, an `x`
   and a width per tab, for each of the n rest states, and it
   interpolates **between two of them**: the one the transition leaves
   and the one it goes to (the `d` and the `h` of the `Segment`). Each
   tab is an absolute child with a `translateX`, so pure transform: zero
   layout per frame.

   Interpolating between TWO and not over the n only matters when those
   two are not neighbours, that is, on TAPPING a far tab. The first
   version interpolated over every state and a tap from 2 to 6 went
   through 3, 4 and 5: each one opened its icon and went white on the
   way past, and then went back. With two ends, the layout goes from 2
   to 6 straight and the ones in the middle never find out.

   Two consequences worth stating:

   · Each tab's box has its MAXIMUM width fixed (with symbol), and the
     tabs are drawn in order. The one that comes after covers the
     previous one over exactly what it has to spare, so each tab's
     touchable area ends up being exactly [x_i, x_i+1], its real width
     in that state, without animating a single `width`.

   · Inside the tab, the label is absolute too and placed as if the
     symbol were there. When it is not, the label shifts with a negative
     `translateX`, the whole slot if the symbol goes on the left, and on
     top of that EVERY inactive label carries the lean (`leanOffset`),
     moving away from the active tab. That is why "For you" also moves
     when it loses its chevron, as in the reference.

   THE TEXT'S MEASUREMENTS ARE MEASURED, NOT CALCULATED: each label
   reports its width with `onLayout`, because it depends on the system
   font and on the length of the word. A table written by hand goes out
   of sync with the first label that changes, and it lies in another
   language or with Dynamic Type.

   AND THOSE MEASUREMENTS LIVE IN REACT STATE, not in a shared value.
   The first version kept the array in a `useSharedValue` and it did not
   work: with a probe in the `onLayout` you could see the tabs reporting
   their box correctly, but reading `.length` off the shared value right
   after assigning gave **0**. React state is also the right thing here:
   a measurement changes once on mount and then never again.
   ═══════════════════════════════════════════════════════════════ */

export type Tab = {
  id: string
  label: string
  /** The symbol that appears when the tab is active. */
  symbol?: SFSymbol
  /** Which side of the label it goes on. `right` is the feeds' chevron. */
  side?: 'left' | 'right'
  /** The symbol goes inside a rounded outline, like the reference's
   *  Stocks chip. The receipt is above `CHIP`. */
  chip?: boolean
}

/* ═══ THE SEGMENT: THE THREE NUMBERS GO TOGETHER, AND THAT IS THE FIX ═══

   Where the transition under way comes from (`d`), where it goes (`h`)
   and how far it has got (`t`, 0..1). ONE single shared value, not
   three.

   THIS WAS THE ICONS' FLICKER, and it is measured. Before there were
   three shared values: `from` and `to` were written by a
   `useAnimatedReaction` and `progress` was a `useDerivedValue`. Every
   page crossing left the styles reading a trio that never existed, the
   NEW ends with the OLD progress, which at that moment is 1 because it
   is saturated, and the incoming icon lit up all the way for one frame
   before starting its fade. The trace of a six-page sweep, taken from
   the style's own mapper:

     ms       d h   progress   tab 2's icon
     1350.0   0 1   0.6485     0.00
     1366.7   1 2   1.0000     1.00   ← the flash
     1383.2   1 2   0.0076     0.01   ← and back again

   All six tabs in the sweep did the same: 0.000 → 1.000 → 0.008.

   WHY IT HAPPENED, in one line: `useAnimatedReaction` calls
   `startMapper(fun, inputs)` WITH NO list of outputs (SOURCE:
   `react-native-reanimated@4.5.1`, `src/hook/useAnimatedReaction.ts:68`;
   compare it with `useDerivedValue.ts:71`, which does pass one).
   Reanimated's topological order builds its edges out of those outputs,
   so a reaction is invisible to the ordering: nobody guarantees it runs
   before whoever reads what it writes.

   With a single value there is no order left to get wrong: the three
   numbers are born in the same worklet, and since it comes out of a
   `useDerivedValue` it does declare its output and the sort puts it
   before all of its readers.

   The rule, for next time: if two numbers have to be true AT THE SAME
   TIME, they are one value, not two. */
export type Segment = { d: number; h: number; t: number }

/* What has to be interpolated: for each tab, where it is and how wide
   it is in each of the n rest states. `underlineX`/`underlineWidth` are
   the underline's, which is each state's active tab. */
type Layout = {
  x: number[][]
  widths: number[][]
  underlineX: number[]
  underlineWidth: number[]
  targets: number[]
  minimums: number[]
  maximums: number[]
  limits: number[]
  contentWidth: number
}

/* THE CHIP'S LINE, made of rotated bars: one per segment of the
   measured skeleton (the receipt is above `CHIP` in `measurements.ts`).
   They are computed once; the children of a View with a border are
   positioned AFTER the border, which is why `CHIP.stroke` is
   subtracted. The ends are lengthened by half a stroke per tip (round
   caps) so the joins do not show a seam and the tips blend into the
   chip's border, as in the reference. The color does not go here: the
   palette puts it in at render time. */
const ZIGZAG = CHIP.vertices.slice(0, -1).map((v, i) => {
  const [x1, y1] = v
  const [x2, y2] = CHIP.vertices[i + 1]
  const length = Math.hypot(x2 - x1, y2 - y1) + CHIP.line
  return {
    position: 'absolute' as const,
    width: length,
    height: CHIP.line,
    borderRadius: CHIP.line / 2,
    left: (x1 + x2) / 2 - length / 2 - CHIP.stroke,
    top: (y1 + y2) / 2 - CHIP.line / 2 - CHIP.stroke,
    transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
  }
})

/* What is moving the content right now. The row needs to know because
   it does three different things depending on the case. */
export const MOTION = { still: 0, drag: 1, tap: 2 } as const

/* The topic icon's fade: r^1.5 (measured) starting at `floor` (a knob).
   The chevron does not come through here, it is purely linear. */
function topicFade(r: number) {
  'worklet'
  const rr = Math.max(0, (r - ICON.floor) / (1 - ICON.floor))
  return rr * Math.sqrt(rr)
}

/* Interpolates between the two states of the transition under way, and
   not over the n. `t` is how far it has got from `d` to `h`. */
function between(values: number[], d: number, h: number, t: number) {
  'worklet'
  const a = values[d] ?? 0
  const b = values[h] ?? a
  return a + (b - a) * t
}

/* THE LABEL'S LEAN: every word that is not the active one leans
   `TAB_BAR.lean` away from the active tab (to the left if the active
   one is to the right, and the other way round), interpolating between
   the segment's two ends. It belongs ONLY to the label and to what
   travels with it, the veil and the symbol: the boxes and the underline
   do not carry it. The receipt, with the table of the six words in X's
   six rest states, is above `lean` in `measurements.ts`. It is what
   makes "For you" shift when it loses its chevron (before, it never
   moved here) and what makes the word going dark travel a bit more than
   its slot, as in the reference. */
function leanOffset(index: number, d: number, h: number, t: number) {
  'worklet'
  const c = (a: number) => (index === a ? 0 : index < a ? -TAB_BAR.lean : TAB_BAR.lean)
  return c(d) + (c(h) - c(d)) * t
}

type Props = {
  tabs: Tab[]
  /** The transition under way, whole. The pager computes it: dragging,
   *  `t` comes out of the scroll's position, and tapping, out of its
   *  own animation, which is not the same thing, because a far tap
   *  moves the content ONE page even if the jump is four tabs wide. */
  segment: SharedValue<Segment>
  /** One of `MOTION`. With the content still the row belongs to the
   *  user's finger and nobody touches it. */
  motion: SharedValue<number>
  /** The visible width of the row: the screen. */
  viewport: number
  onTap: (index: number) => void
}

/* ═══ `memo`: IT WAS NOT THE FLICKER, BUT IT STAYS ═══

   A CORRECTION, BECAUSE THIS USED TO SAY SOMETHING ELSE. This block
   claimed the `memo` was what fixed the icons' flicker. That was false:
   the flicker was on the UI thread (see the receipt above `Segment`)
   and it survived this memoization untouched. The measurement that
   proved it is in `MEDICIONES.md`.

   What is true, and why it stays: `SymbolView` is a NATIVE view, and
   every render of this component hands the seven symbols new props for
   iOS to reconfigure them. What fired the render was the pager, which
   until 2026-09-07 blocked its own scroll for as long as a far tap
   lasted with a `useState` that changed twice per tap; today the pager
   has no React state, but any render of the parent would do the same,
   and the bar does not depend on it for anything. It is work there is
   no reason to do.

   For `memo` to really cut, the props have to be stable: `tabs` is a
   module constant, the shared values do not change identity, and
   `onTap` goes with a `useCallback` on the other side. It is rule 4 of
   the folder's AGENTS. */
export const TabBar = memo(function TabBar({ tabs, segment, motion, viewport, onTap }: Props) {
  const [labelWidths, setLabelWidths] = useState<number[]>([])
  const rowRef = useAnimatedRef<Animated.ScrollView>()
  const palette = usePalette()

  /* The bar's colors, kept apart from the geometry: they change only
     with the theme. The gradients go here and not in `StyleSheet`
     because they carry `palette.background` inside the string. */
  const tint = useMemo(
    () => ({
      underline: { backgroundColor: palette.underline },
      leftRamp: {
        experimental_backgroundImage: `linear-gradient(to right, ${palette.background} 0%, ${palette.background}00 100%)`,
      },
      ramp: {
        experimental_backgroundImage: `linear-gradient(to right, ${palette.background}00 0%, ${palette.background} 100%)`,
      },
      plus: { backgroundColor: palette.background },
    }),
    [palette],
  )

  /* Where the row really is, read off the scroll. The gradient uses it
     to know how much is left to cover. */
  const row = useSharedValue(0)

  /* Where the row was when the content started moving (`origin`) and
     how far it had moved away from its natural target (`deviation`,
     zero if the user did not push it off center by hand). Both are
     captured ONCE when the movement starts, and not by reading the
     position while we are the ones commanding it: that is feedback, and
     it oscillates. The 'visible' rule uses the origin; 'center' uses
     the deviation (see `target`). */
  const origin = useSharedValue(0)
  const deviation = useSharedValue(0)

  /* `useCallback` so `TabItem`'s `memo` cuts: a new function on every
     render makes the comparison always come out different. */
  const measure = useCallback((index: number, width: number) => {
    setLabelWidths((previous) => {
      if (previous[index] === width) return previous
      const next = previous.slice()
      next[index] = width
      return next
    })
  }, [])

  /* An explicit `useMemo` and not trusting the React Compiler: the
     dependencies the worklets plugin computes for the animated styles
     hang off this object's identity. If it changed on every render, the
     styles would be rebuilt on every render. */
  const layout = useMemo<Layout | null>(() => {
    /* With a single tab there is nothing to interpolate, and
       `interpolate` needs two points at minimum. */
    if (tabs.length < 2) return null
    for (let i = 0; i < tabs.length; i++) if (labelWidths[i] === undefined) return null

    const n = tabs.length
    const base = tabs.map((_, i) => labelWidths[i] + TAB_BAR.padding * 2)
    const extra = tabs.map((tab) => tabExtra(tab.side))

    /* The complete layout of one state: the `active` tab carries its
       symbol and the rest do not. */
    const state = (active: number) => {
      const widths = base.map((b, i) => b + (i === active ? extra[i] : 0))
      const x: number[] = []
      let cursor = TAB_BAR.inset
      for (let i = 0; i < n; i++) {
        x.push(cursor)
        cursor += widths[i] + TAB_BAR.separation
      }
      cursor -= TAB_BAR.separation // the separation goes BETWEEN boxes, not after the last one
      /* The closing edge carries `slack` and not `inset`: the row is
         NOT symmetric. On the left the inset separates it from the edge
         of the screen; on the right the `+` is already acting as the
         stop, and in the reference the last tab ends up 3.6 pt from
         it. */
      return { x, widths, total: cursor + EDGE.slack }
    }

    const states = Array.from({ length: n }, (_, a) => state(a))
    const indices = states.map((_, a) => a)

    /* THE USABLE VIEWPORT ENDS WHERE THE `+` STARTS, not before.

       This went through two wrong versions. First the limit was
       computed against the width of the screen, and the row stopped
       with the last tab under the `+`. Then it was corrected against
       the edge of the gradient, and it came out 84 pt short: the last
       tab fitted, but with an enormous gap beside it.

       What the reference does is measured: with the scroll at its
       limit, the last tab's box ends at 391.7 pt of a 440 screen, and
       the `+` starts at 396. So the row runs until it is flush with the
       `+`, and the gradient is no problem because in that state it is
       off (see `remaining`). */
    const usable = viewport - EDGE.plus
    const limits = states.map(({ total }) => Math.max(0, total - usable))

    /* THE ROW CENTERS THE ACTIVE TAB IN THE WHOLE SCREEN, AND THEN IT
       RUNS INTO THE LIMIT. There is the entire behaviour the reference
       has and this did not have: with the first tabs the centering asks
       for a negative number, the clamp leaves it at 0 and the row DOES
       NOT MOVE; from the fourth on it asks for more than there is, the
       clamp leaves it at the limit and the row GOES ALL THE WAY to the
       end. That is the "either it stays still or it moves quite a bit".

       The clip's five rest states, measured: the active box's position
       comes out of the underline (pure white, with no threshold bias)
       and the row's displacement comes out of comparing tabs that are
       dark in BOTH states, where the active one's extra width cancels
       out and only the scroll is left:

         active      row measured   centered in 440   centered in 396
         For you          0            −161 → 0         −140 → 0
         Following        0             −76 → 0          −58 → 0
         Stocks           0            −0.3 → 0        **21.7**  ✗
         Tech          45.4             63 → limit       85 → limit
         AI            45.4            118 → limit      139 → limit

       Stocks is the only state that tells the two models apart, and it
       falls on the side of centering in the WHOLE screen by three
       tenths. It is not a numerical coincidence: the `+` does not
       shrink the row, it covers it. The row occupies the 440 and what
       it reserves for the button is an inset at the end, which is why
       the limit IS computed against `usable`.

       And the limit is verified on its own: with Tech active, the last
       tab's box ends at 396.0 pt, which is EXACTLY where the `+`
       starts. The row runs until it is flush with the button and not
       one point further.

       ─── AND ONLY ON TAP ───
       The row moves when you TAP a tab. Dragging it stays still, and
       that is measured too: the vault clip has four transitions, all
       between neighbours, and the row does not shift in any of them,
       not even with Tech active, where the centering would ask for
       45 pt. That they are drags and not taps shows when you normalize
       the four curves to the same time: at step 4/24 they give 0.071,
       0.120, 0.053 and 0.110. A `withTiming` would give the same number
       all four times. That is a finger.

       ─── AND ON DRAG TOO, WHICH IS WHAT WAS WRONG ───
       The first version left the row STILL during the drag (the vault
       clip did not move it in its four transitions, all of them between
       tabs whose target is the same 0). The new recordings
       (2026-09-01) show the case the vault did not show: in X's Tech→AI
       drag the row shifts ~6 pt DURING the gesture, following the
       difference between the two states' rest positions (45.6 → 39.6
       measured). So: the row follows `targets` interpolated with the
       SAME progress as the content, whether it is dragged or tapped.
       Whatever the user pushed off center by hand is honoured as
       deviation (see `deviation`), and the clamp to [minimum, maximum]
       guarantees the active one fits whole anyway.

       ─── STOCKS→TECH, THE BIG CASE (v1, frames 203-221) ───
       It is the only transition between neighbours where the centering
       asks for a whole jump (0 → 45.6), and X gives it: dragging with
       the finger, the word "AI", inactive and on the same side in both
       states, so a clean witness for the row, goes 342.3 → 296.7 while
       the content advances, and the row/progress ratio gives 44.5
       across the thirteen intermediate frames (0.15 → 6.6, 0.54 → 24.0,
       0.90 → 39.6). Linear, in sync, without waiting for the finger to
       let go. "For you" leaves on the left and "Design" comes in on the
       right.

       The seven transitions of the three recordings (three taps, four
       drags, there and back) all fall in the centering; the "only if it
       does not fit" model fails on five. And even so the piece TODAY
       does not use this by default: `TAB_BAR.row` chooses between
       'center' (this) and 'visible' (the user's request, 2026-09-02);
       the receipt for the request is in measurements.ts. `targets` is
       computed anyway, so going back is a matter of one word. */
    const targets = indices.map((a) => {
      const { x, widths } = states[a]
      const center = x[a] + widths[a] / 2
      return Math.min(Math.max(0, center - viewport / 2), limits[a])
    })

    /* THE RANGE IN WHICH TAB `a` IS SEEN WHOLE. With 'center' it is the
       drag's clamp: the row does not move while the tab fits, and if it
       does not fit, it shifts just enough. Without this, dragging to
       the last tab leaves the underline off screen. With 'visible' it
       is THE entire rule: the row stays at its origin and these two
       numbers are the only thing that pushes it. */
    /* "Fitting whole" includes the row's own breathing room: `slack` on
       the `+` side and the `inset` on the other. Without the inset,
       coming back to the first tab by dragging left the row shifted
       12 pt and "For you" flush against the edge of the screen.
       Measured: the box started at 0.0 instead of at 12.0. */
    const minimums = indices.map((a) =>
      Math.max(0, states[a].x[a] + states[a].widths[a] + EDGE.slack - usable),
    )
    const maximums = indices.map((a) =>
      Math.max(minimums[a], Math.min(states[a].x[a] - TAB_BAR.inset, limits[a])),
    )

    /* THE CONTENT'S WIDTH DOES NOT CHANGE WITH THE ACTIVE TAB, on
       purpose. The real total varies by 3 pt between states, which is
       the difference between the chevron's extra (18) and the icon's
       (21), and a `contentSize` that moves makes a UIScrollView's
       offset jump every time it shrinks while at the end. The maximum
       is used and that is that: the 3 extra pt end up past the last
       tab, under the `+`, where they are not seen.

       AND IT CARRIES THE `+`'S WIDTH AS A TAIL. The ScrollView occupies
       the 440 (the button covers it, it does not shrink it) so its
       natural limit is `contentWidth − 440`, and that leaves the last
       tab 44 pt short: measured, Design's underline stopped at 272.3
       instead of 223.3. With the tail, the limit becomes
       `contentWidth − 396`, which is exactly `limits`. It is the same
       model as the reference: a 440 row with 44 of inset at the end. */
    const contentWidth = Math.max(...states.map((e) => e.total)) + EDGE.plus

    return {
      x: tabs.map((_, i) => states.map((e) => e.x[i])),
      widths: tabs.map((_, i) => states.map((e) => e.widths[i])),
      underlineX: indices.map((a) => states[a].x[a]),
      underlineWidth: indices.map((a) => states[a].widths[a]),
      targets,
      minimums,
      maximums,
      limits,
      contentWidth,
    }
  }, [labelWidths, tabs, viewport])

  /* ───────────────────────────────────────────────────────────────
     WHERE THE ROW WANTS TO GO, frame by frame. `TAB_BAR.row` picks the
     rule (each one's receipt is in measurements.ts):

     · 'visible' — it stays where it was when the content started
                   (`origin`), clamped to the range in which the active
                   tab fits whole, interpolated with the same progress
                   as everything else. It only shifts when it has to,
                   and only as much as it has to. Tapping and dragging
                   alike.
     · 'center'  — it follows `targets` (what X does, measured) with the
                   same progress; dragging, it adds the DEVIATION the
                   user left by hand and clamps so the active one fits.
     · STILL     — does not exist: with the content still the row
                   belongs to the user's finger and this does not touch
                   it (see the reaction).
     ─────────────────────────────────────────────────────────────── */
  const target = useDerivedValue(() => {
    if (!layout) return 0
    const { d, h, t } = segment.get()
    const minimum = between(layout.minimums, d, h, t)
    const maximum = between(layout.maximums, d, h, t)
    if (TAB_BAR.row === 'visible') return Math.min(Math.max(origin.get(), minimum), maximum)
    if (motion.get() === MOTION.tap) return between(layout.targets, d, h, t)
    const followed = between(layout.targets, d, h, t) + deviation.get()
    return Math.min(Math.max(followed, minimum), maximum)
  })

  /* The origin and the deviation are taken on the frame the content
     starts on. The "current" tab is the nearest end of the segment:
     starting forward, `t` is born near 0 and it is `d`; backward it is
     born near 1 and it is `h`. */
  useAnimatedReaction(
    () => motion.get(),
    (m, previous) => {
      if (m !== MOTION.still && previous === MOTION.still) {
        const { d, h, t } = segment.get()
        const current = t < 0.5 ? d : h
        origin.set(row.get())
        deviation.set(row.get() - (layout ? (layout.targets[current] ?? 0) : 0))
      }
    },
  )

  /* AND HERE IS THE WHOLE SPLIT: while the content moves, the piece
     commands the row; with the content still, it is not touched and the
     ScrollView belongs entirely to the user, with iOS's bounce and
     deceleration, which are free and which there is no way to match by
     hand. */
  useAnimatedReaction(
    () => (motion.get() === MOTION.still ? Number.NaN : target.get()),
    (x) => {
      if (!Number.isNaN(x)) scrollTo(rowRef, x, 0, false)
    },
  )

  /* The gradient measures what the row has LEFT to cover, which is why
     it compares the current state's limit against where it is really
     standing. With the last tab active it gives 0 and the gradient
     disappears: a gradient that promises content that does not exist is
     a lie, and in the reference it is indeed not there. */
  /* THE LEFT RAMP — the mirror of the `+`'s, and with the same meaning:
     it says "there is content hidden this way". It only appears once
     the row is scrolled (`row > 0`) and it comes in over the same
     `fade` window as the right one. Without it, the word leaving the
     screen is cut off dead against the edge. Measured in the user's
     reference: the letters go dark over a ramp of ~21 pt while keeping
     their stems sharp, so a multiplicative gradient like the one on the
     other side, not a real blur. */
  const leftRampStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, row.get() / EDGE.fade)),
  }))

  const rampStyle = useAnimatedStyle(() => {
    if (!layout) return { opacity: 0 }
    const { d, h, t } = segment.get()
    const remaining = between(layout.limits, d, h, t) - row.get()
    return { opacity: Math.min(1, Math.max(0, remaining / EDGE.fade)) }
  })

  /* The underline is the only animated `width` in the piece, and it is
     allowed: it is an absolute child with no children of its own, so it
     re-arranges nobody, and animating the width keeps the ends that a
     `scaleX` would flatten. */
  const underlineStyle = useAnimatedStyle(() => {
    if (!layout) return { opacity: 0, width: 0, transform: [{ translateX: 0 }] }
    const { d, h, t } = segment.get()
    return {
      opacity: 1,
      width: between(layout.underlineWidth, d, h, t),
      transform: [{ translateX: between(layout.underlineX, d, h, t) }],
    }
  })

  const onRowScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      row.set(e.contentOffset.x)
    },
    /* The finger on the row always wins: it cuts off any correction
       under way and gives the scroll back to the user. */
    onBeginDrag: () => {
      motion.set(MOTION.still)
    },
  })

  return (
    <View style={css.bar}>
      <Animated.ScrollView
        ref={rowRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onRowScroll}
        scrollEventThrottle={16}
        /* The height is EXPLICIT: the tabs are absolute children with
           `top/bottom: 0`, and a content container that collapsed to
           zero would leave them with no box to sit in. */
        contentContainerStyle={{ width: layout?.contentWidth, height: TAB_BAR.height }}
        style={css.track}
      >
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            index={index}
            segment={segment}
            x={layout?.x[index]}
            measure={measure}
            onTap={onTap}
          />
        ))}
        <Animated.View style={[css.underline, tint.underline, underlineStyle]} />
      </Animated.ScrollView>

      {/* The gradient goes after the row so it sits on top, and it does
          not intercept taps: the tabs it covers are still tappable. It
          turns off when there is nothing left to scroll. A gradient
          that promises content that does not exist is a lie, and in the
          reference it is indeed not there. */}
      <Animated.View style={[css.ramp, tint.ramp, rampStyle]} pointerEvents="none" />
      <Animated.View style={[css.leftRamp, tint.leftRamp, leftRampStyle]} pointerEvents="none" />

      <Pressable style={[css.plus, tint.plus]} onPress={() => {}} accessibilityLabel="Add tab">
        <SymbolView name="plus" size={EDGE.plusSymbol} tintColor={palette.plus} />
      </Pressable>
    </View>
  )
})

/* Each tab is its own component and not a hook call inside the `.map`,
   so the order of hooks does not depend on how many tabs there are. */
const TabItem = memo(function TabItem({
  tab,
  index,
  segment,
  x,
  measure,
  onTap,
}: {
  tab: Tab
  index: number
  segment: SharedValue<Segment>
  x: number[] | undefined
  measure: (index: number, width: number) => void
  onTap: (index: number) => void
}) {
  const extra = tabExtra(tab.side)
  const onLeft = tab.side === 'left'
  const slide = onLeft ? ICON.slide.left : ICON.slide.right
  const palette = usePalette()

  /* The tab's colors, kept apart from the geometry. `useMemo` for the
     usual reason: `SymbolView` and the veils are native views and a new
     object per render reconfigures them, and this changes only with the
     theme. The gradients carry `palette.background` in the string and
     that is why they cannot live in `StyleSheet`. */
  const tint = useMemo(
    () => ({
      label: { backgroundColor: palette.background },
      topicVeil: {
        experimental_backgroundImage: `linear-gradient(to right, ${palette.background}00 0%, ${palette.background} 100%)`,
      },
      chevronVeil: {
        experimental_backgroundImage: `linear-gradient(to right, ${palette.background} 0%, ${palette.background}00 100%)`,
      },
      chip: { borderColor: palette.icon },
      zigzag: { backgroundColor: palette.icon },
    }),
    [palette],
  )

  /* HOW MUCH "ACTIVE" THIS TAB HAS RIGHT NOW, and it comes out of the
     transition's two ends, not out of the distance to `progress`.

     Only the tab you leave and the tab you go to take part. A tab that
     is neither of the two is worth 0 even if the pager passes over it,
     which is exactly what this fixed: tapping from 2 to 6, the ones in
     the middle opened their icon and went white on the way past.

     Dragging, `from` and `to` are neighbours and together they add up
     to 1 in the middle of the gesture, which is what the clip does:
     during the drag you see both chevrons at once. */
  const revealed = (d: number, h: number, t: number) => {
    'worklet'
    /* WITH NO TRANSITION UNDER WAY, both ends being the same tab, the
       active one is fully revealed. Without this line, `t` is 0 when
       `d === h` and the active tab stayed at 0: grey and with no icon.
       It happens on the LAST tab at rest, because there `h` cannot
       advance and ends up equal to `d`. */
    if (d === h) return index === d ? 1 : 0
    if (index === h) return t
    if (index === d) return 1 - t
    return 0
  }

  const boxStyle = useAnimatedStyle(() => {
    if (!x) return { opacity: 0, transform: [{ translateX: 0 }] }
    const { d, h, t } = segment.get()
    return {
      opacity: 1,
      transform: [{ translateX: between(x, d, h, t) }],
    }
  })

  /* The label is placed as if the symbol were always there. When it is
     not, it shifts left by what the symbol occupied, and only if the
     symbol goes on that side. */
  const labelStyle = useAnimatedStyle(() => {
    const { d, h, t } = segment.get()
    const r = revealed(d, h, t)
    return {
      /* The ONLY thing that changes between active and inactive is the
         color. It is verified against the reference at the sub-pixel
         level: the stem of the same letter measures 5.03 px in both
         states (see `measurements.ts`). And it comes out of the SAME
         `revealed` as the icon, so a tab that is not an end of the
         transition does not lighten one bit. */
      /* `gamma: 1` is NOT an oversight: X interpolates the label's
         color in raw sRGB and it is measured. At r=0.348 its label
         gives 181, which is the raw lerp (142+113·0.348=181.3); the
         lerp in linear space, Reanimated's default, would give 191.
         Verified on three more frames: 222@0.734, 241@0.876 against
         224.9 and 241. */
      color: interpolateColor(r, [0, 1], [palette.inactive, palette.active], 'RGB', { gamma: 1 }),
      transform: [
        { translateX: (onLeft ? -extra * (1 - r) : 0) + leanOffset(index, d, h, t) },
      ],
    }
  })

  /* THE SYMBOL COMES OUT FROM BEHIND THE WORD, it does not light up in
     place. It starts `slide` to the left, which tucks it under the last
     letter if it is a chevron and pulls it out of the first ones if it
     is an icon, and it shifts to its place while it lights up. The
     receipt for the distances and for the sign is in
     `measurements.ts`, AND SO IS the one for why it is like this and
     not some other way: the clipping window and the feather were tried
     and rolled back (2026-09-01). The final spec is a screenshot of X
     with the WHOLE glyph, barely dimmed, flush against the word.

     The scale from 0.9 stays: nothing in the real world appears at size
     zero. */
  const symbolStyle = useAnimatedStyle(() => {
    const { d, h, t } = segment.get()
    const r = revealed(d, h, t)
    return {
      /* TWO DIFFERENT CURVES, and both measured off the clip (the
         receipt with the table is in `measurements.ts`): the white icon
         fades with r^1.5 and the grey chevron fades linearly. No scale:
         the width of the reference's ink is constant through the whole
         transition.

         The icon also has a FLOOR (`ICON.floor`): below it the icon
         does not exist, and the curve is remapped onto the remaining
         stretch. It is the "dissolve a little earlier" that was asked
         for by hand, so that near the word not even the ghost is ever
         left.

         And it travels with the label's lean (`leanOffset`): in the
         reference the dying icon goes along with its word, it does not
         stay pinned in the slot (Tech's cpu shifts with the word while
         it fades, measured in the new recording). */
      opacity: onLeft ? topicFade(r) : r,
      transform: [{ translateX: -slide * (1 - r) + leanOffset(index, d, h, t) }],
    }
  })

  /* The feather on the occlusion edge travels WITH the label's
     background: on the icon side the label moves, so the veil shares
     its translateX; on the chevron side everything is still and the
     veil is a static View anchored from the right (it does not need the
     label's width). At rest both veils paint gradient over pure black,
     invisible: the ceiling on `feather` guarantees they never reach the
     symbol's ink at rest (receipt in `measurements.ts`). */
  const veilStyle = useAnimatedStyle(() => {
    const { d, h, t } = segment.get()
    const r = revealed(d, h, t)
    return {
      transform: [
        { translateX: (onLeft ? -extra * (1 - r) : 0) + leanOffset(index, d, h, t) },
      ],
    }
  })

  /* THE GLYPH OVERFLOWS ITS SLOT, and it is on purpose: the reference
     paints 16 pt of icon in a place that occupies 11. The slot is what
     the layout reserves, and therefore what fattens the tab, and the
     glyph is what you see. Centered, it spills over both sides equally.

     THE BOX IS THE GLYPH'S AND THE NEGATIVE MARGIN MAKES THE SLOT, not
     the other way around. The first version put a box the size of the
     slot and let the glyph stick out through `overflow: visible`:
     geometrically it comes out the same, but it leaves a NATIVE view
     drawing outside its parent's bounds, and that parent has its
     opacity animated. With the box the size of the glyph there is
     nothing outside anything, and the layout is identical: 20 of box
     minus 4.5 of margin on each side is the 11 of the slot.

     ALL THE STYLES COME OUT OF `StyleSheet`, including the two that
     depend on the side. A new object on every render hands `SymbolView`
     new props, and it is a native view: iOS reconfigures it and in the
     middle of an opacity animation that reads as a flicker. */
  const symbol = (tab.symbol || tab.chip) && (
    <Animated.View style={[onLeft ? css.topicSlot : css.chevronSlot, symbolStyle]}>
      {tab.chip ? (
        <View style={[css.chip, tint.chip]}>
          {ZIGZAG.map((bar, i) => (
            <View key={i} style={[bar, tint.zigzag]} />
          ))}
        </View>
      ) : (
        <SymbolView
          name={tab.symbol!}
          size={onLeft ? ICON.glyph.topic : ICON.glyph.chevron}
          tintColor={onLeft ? palette.icon : palette.chevron}
          weight="semibold"
          resizeMode="scaleAspectFit"
          style={onLeft ? css.topicGlyph : css.chevronGlyph}
        />
      )}
    </Animated.View>
  )

  /* The symbol goes IN FLOW, not absolute, and that is why the tab
     measures exactly what it has to: padding + slot + gap + label. Its
     place stays reserved even while it is transparent, so turning it
     off re-arranges nothing. The only thing that moves is the label,
     and it moves with a transform. */
  return (
    <Animated.View style={[css.tab, boxStyle]}>
      <Pressable
        style={css.hitArea}
        /* No `onPressIn`: the haptic lives in `onTap` (the completed
           tap). A tick on press used to live here, and it had a cost
           that did not show up until the phone: starting to DRAG the
           row puts the finger down on a tab and the tick fired on every
           drag ("take the haptic out", 2026-09-01). The scroll cancels
           the press, so `onPress` does not fire while dragging. The
           tick is left only on real taps. */
        onPress={() => onTap(index)}
        /* A finger that slides a few pixels should not cancel a tap you
           meant to give. */
        pressRetentionOffset={12}
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
      >
        {onLeft && symbol}
        {/* Both veils are animated: they travel with the label, the
            topic one because of the slot's shift, and both of them
            because of the lean (`leanOffset`). */}
        {!!symbol && (
          <Animated.View
            style={[
              onLeft ? css.topicVeil : css.chevronVeil,
              onLeft ? tint.topicVeil : tint.chevronVeil,
              veilStyle,
            ]}
          />
        )}
        {/* `allowFontScaling={false}`, see the note in
            `measurements.ts`. The reference does not scale its tabs
            with Dynamic Type and the piece does not either, or the
            frame by frame comparison stops being worth anything. */}
        <Animated.Text
          style={[css.label, tint.label, labelStyle]}
          onLayout={(e) => measure(index, e.nativeEvent.layout.width - 2 * ICON.clearance)}
          numberOfLines={1}
          allowFontScaling={LABEL.fontScaling}
        >
          {tab.label}
        </Animated.Text>
        {!onLeft && symbol}
      </Pressable>
    </Animated.View>
  )
})

const css = StyleSheet.create({
  /* `overflow: hidden` so the tabs left outside are not seen at the
     side when the row shifts. */
  bar: { height: TAB_BAR.height, overflow: 'hidden' },
  /* The track is a real horizontal ScrollView, so the bounce and the
     deceleration are iOS's. It fills the whole bar and lends the tabs
     its left edge as zero. */
  track: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },


  /* No `width`: absolute with top/bottom/left pinned and the width
     free, Yoga makes it measure its content. And its content includes
     the symbol's slot whether it is visible or not, so the box ALWAYS
     has the active state's width. The tab that comes after is drawn on
     top and clips off what it has to spare, which leaves the touchable
     area exact, [x_i, x_i+1], without animating a single `width`. */
  tab: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  hitArea: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TAB_BAR.padding,
    /* The underline eats 2 pt at the bottom: without this the text
       would be centered in the whole bar and resting on the line. */
    paddingBottom: UNDERLINE.height,
    gap: ICON.gap,
  },
  /* `zIndex` and not the order of the children: the symbol goes on one
     side or the other depending on the tab, so the order in the tree
     cannot guarantee the word stays on top. And it has to stay on top
     ALWAYS, because the symbol starts tucked behind it.

     THE BACKGROUND IN THE PIECE'S COLOR IS THE OCCLUSION. The word
     travels with its own background (`tint.label`, the color of the
     palette's background) and that is what makes "it hides behind"
     true: the covered symbol does not mix in among the letters, it
     disappears under a clean edge. The padding inflates the
     background's box (`clearance` on the sides, 3 pt top and bottom to
     cover the whole glyph) and the negative margin deflates it for the
     layout, so neither the row nor the centering finds out; `measure`
     subtracts the clearance from the onLayout. */
  label: {
    fontSize: LABEL.size,
    fontWeight: LABEL.weight,
    zIndex: 1,
    paddingHorizontal: ICON.clearance,
    marginHorizontal: -ICON.clearance,
    paddingVertical: 3,
    marginVertical: -3,
  },

  /* The box measures what the GLYPH measures, and the negative margin
     shrinks it to the SLOT in the layout's eyes. See the note above the
     symbol. */
  topicSlot: {
    width: ICON.glyph.topic,
    height: ICON.glyph.topic,
    marginHorizontal: (ICON.slot.topic - ICON.glyph.topic) / 2,
  },
  chevronSlot: {
    width: ICON.glyph.chevron,
    height: ICON.glyph.chevron,
    marginHorizontal: (ICON.slot.chevron - ICON.glyph.chevron) / 2,
  },
  topicGlyph: { width: ICON.glyph.topic, height: ICON.glyph.topic },
  chevronGlyph: { width: ICON.glyph.chevron, height: ICON.glyph.chevron },

  /* THE VEILS: the feather on the occlusion edge. Each one starts where
     the label's background ends (`clearance` away from the ink) and
     fades toward the side the symbol emerges from. zIndex 1 so it sits
     over the symbol, same as the label; the label, which comes later in
     the tree, ends up on top of both. */
  /* WATCH OUT FOR YOGA: ABSOLUTE children are positioned from the
     border box, so the `hitArea`'s padding does not move their zero the
     way it does for children in flow. That is why the padding is added
     here by hand; without it, the veil lands 12 pt to the left
     (measured with a red probe veil). */
  topicVeil: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: TAB_BAR.padding + ICON.slot.topic + ICON.gap - ICON.clearance - ICON.feather,
    width: ICON.feather,
    zIndex: 1,
  },
  chevronVeil: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: TAB_BAR.padding + ICON.slot.chevron + ICON.gap - ICON.clearance - ICON.feather,
    width: ICON.feather,
    zIndex: 1,
  },

  /* The Stocks chip: outline measured off the clip (see `CHIP`),
     centered in the glyph's frame of 20; the margin is the
     difference. */
  chip: {
    width: CHIP.side,
    height: CHIP.side,
    margin: (ICON.glyph.topic - CHIP.side) / 2,
    borderWidth: CHIP.stroke,
    borderRadius: CHIP.radius,
  },

  /* Flush to the bottom, which is where the clip has it: the underline
     occupies the last 6 rows of pixels in the bar and the divider comes
     right after. The ends are a CAPSULE (radius = height/2), measured
     in four rest states of the reference; the receipt is above
     `radius`. Animating the `width` instead of scaling keeps the radius
     at the ends. */
  underline: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: UNDERLINE.height,
    borderRadius: UNDERLINE.radius,
  },

  /* THE RAMP ENDS WHERE THE `+` STARTS, not at the edge of the screen:
     that is why the `right` is `EDGE.plus` and not 0. What goes under
     the button is solid black, and the button itself puts that there
     with its `backgroundColor`.

     `experimental_backgroundImage` is from React Native 0.86 and takes
     the same syntax as CSS. It is worth saying why there is no
     dependency here: `expo-linear-gradient` is a NATIVE module, and
     adding it would force a rebuild of every worktree's dev client for
     one gradient. */
  /* The width is THE SAME as the right ramp's on purpose: the user's
     reference measures ~21 pt and the right one, reconstructed from the
     clip, 23, within the error of one against the other. A single
     number for both ends of the same idea. */
  leftRamp: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: EDGE.ramp,
  },
  ramp: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: EDGE.plus,
    width: EDGE.ramp,
  },
  /* Opaque background, not transparent (`tint.plus` puts it there): in
     the clip, from 396 to 408 pt no ink appears in any frame. Under the
     `+` nothing is ever seen. It fills the whole height of the bar,
     underline included, because no underline passes behind it either. */
  plus: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: EDGE.plus,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: UNDERLINE.height,
  },
})
