import * as Haptics from 'expo-haptics'
import { memo, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, {
  Easing,
  ReduceMotion,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets'

import { TabBar, MOTION, type Tab, type Segment } from './tab-bar'
import { TAB_BAR, HEADER } from './measurements'
import { CollapseContext, collapsedOpacity, type Collapse } from './collapse'
import { usePalette } from './theme'

/* ═══════════════════════════════════════════════════════════════
   THE MECHANISM — the pager, and the `Segment` it hands to the bar.

   Where the transition comes from, where it goes and how far it has got
   (0..1), in a single value. The bar has no state of its own and draws
   everything out of that. Its being ONE value and not three is what
   fixed the icons' flicker: the receipt is above `Segment`, in
   `tab-bar.tsx`.

   DRAGGING AND TAPPING ARE NOT THE SAME PATH, and not for convenience:
   the reference treats them differently and it is measured frame by
   frame.

   WHEN DRAGGING, THE PAGER IS A ScrollView WITH `pagingEnabled`. It was
   measured and the underline stays glued to the content frame by frame,
   so the curve the underline stops on IS the deceleration of iOS's
   UIScrollView, not an easing someone chose. Rebuilding the gesture by
   hand with Gesture Handler would mean re-deriving that physics to get
   back to the same place. There `t` is the fractional part of the page.
   The row of tabs moves, or does not, with this same `t`, tapping and
   dragging alike; `TAB_BAR.row` picks the rule and the receipt is above
   `target` in `tab-bar.tsx`.

   WHEN TAPPING, TWO THINGS CHANGE:

   1. Reanimated drives the animation, not UIKit. `scrollTo({ animated:
      true })` takes close to 400 ms on a symmetric curve: it starts
      slow exactly when the user has already decided and is watching. It
      felt heavy and it was. Here it goes with a `withTiming` on the
      curve fitted against the reference's taps (below).
   2. The content travels ONE page even if the jump is five tabs wide,
      see `onTap`. That is why `t` cannot come out of the scroll and the
      tap brings its own.
   ═══════════════════════════════════════════════════════════════ */

/* ═══ THE TAP CURVE, FITTED AGAINST THE USER'S TAPS ═══

   This curve has already gone all the way around twice, and both times
   the error was in the instrument, not in the fit:

   1. easeOutCubic at 333 ms, fitted against the settle of the vault
      clip... whose transitions turned out to be DRAGS: it was the
      UIScrollView's deceleration applied to a tap.
   2. bezier(.4,.9,.72,1) at 283 ms, fitted against "seven taps" from an
      old recording of X. With that curve the user felt the tap was
      ABRUPT ("in X it is done much more cleanly", 2026-09-01), and the
      new recordings of his own account prove him right.

   The fit in force comes from the THREE taps in those new recordings
   (For you→Tech, Tech→Following, For you→Design), underline frame by
   frame, with a search over duration and frame phase:

                                    Fy→Tech   Tech→Fol   Fy→Design
     easeOutCubic                    0.0081     0.0123     0.0179   ✓
     bezier(.4,.9,.72,1) (previous)  0.0153     0.0068     0.0250
     easeOutQuart                    0.0225     0.0693     0.0230

   easeOutCubic wins two of three and in the third it comes within a
   hair. The perceptual difference is in the start: the cubic leaves
   with slope 3, so the underline answers the finger on the first frame,
   and slows down monotonically; the bezier left with 2.25 and had a
   belly halfway through, which is the reported "tug".

   The measured duration is ~18 frames at 60 fps: the best fits land at
   18-19 (300-317 ms), not at the 17 of the old recording. */
const EASE_SETTLE = Easing.out(Easing.cubic)
const TAP_MS = 300

/* The three things that move on a tap (the content, the bar's progress
   and the row's scroll) share the same config, which is the only way to
   guarantee they leave and arrive together.

   `ReduceMotion.System` JUMPS EVERYTHING TO THE END, and it stays that
   way. I studied it on 2026-09-08 because `animate-expo` § 9 asks for
   "fewer and gentler, not zero: keep opacity and color changes that
   explain a state change, drop translation", and here the fade goes
   too. The conclusion is that the rule does not apply to this piece,
   for two reasons:

   · FOLLOWING IT WOULD BREAK WHAT KEEPS THE FLICKER AWAY. Everything
     derives from ONE value, `Segment`: the underline's position and the
     label's color come out of the same `t`. Animating the color and
     jumping the position asks for TWO progress values that under normal
     motion have to be identical, which is exactly the trap documented
     as the ninth thing that bites in `native/AGENTS.md` ("if two values
     have to be true AT THE SAME TIME, they are one value, not two") and
     the measured cause of the symbols' flicker. And the sentence in
     Performance would stop being true.
   · AND THERE IS NOTHING TO EXPLAIN. The rule exists for when taking
     the movement away leaves the state change unexplained, something
     appearing out of nowhere. Here static properties tell the state:
     the active label in white, the underline beneath it, the new page
     on screen. Jumping, you see all of that, instant and complete.

   So an instant tab change under reduced motion is the correct
   behaviour, not a debt. The public text says "Reduced motion is
   respected", which is true on both readings. If this is ever
   revisited, the real change is splitting `Segment` in two, and it has
   to be measured on the phone with the setting turned on, not reasoned
   about. */
const CFG = { duration: TAP_MS, easing: EASE_SETTLE, reduceMotion: ReduceMotion.System }

/* THE HAPTIC FOR THE TAB CHANGE, in one single place because it is the
   knob that will be touched most and it cannot be measured from here:
   the reference clip is video and has no haptic track.

   THERE IS NO CONTINUOUS INTENSITY, and it is not a limitation of iOS
   but of `expo-haptics`. iOS has `impactOccurred(intensity:)` since
   iOS 13, which takes a number from 0 to 1, and on top of that it has
   Core Haptics for building patterns by hand. But the module calls
   `impactOccurred()` WITH NO argument. It is in its Swift,
   `HapticsModule.swift`, six lines:

       let generator = UIImpactFeedbackGenerator(style: ...)
       generator.prepare()
       generator.impactOccurred()

   So from here there are five steps and nothing in between. Reaching
   continuous intensity takes a native module of our own, and that
   breaks Expo Go (the piece would stop opening on the phone) and forces
   a rebuild of the dev client. Not worth it for one piece's knob.

   The ladder, from least to most:

     selectionAsync()            the softest tick
     impactAsync(Soft)           soft, diffuse
     impactAsync(Light)       ←  we are here
     impactAsync(Rigid)          Medium's amplitude with a shorter,
                                 drier attack
     impactAsync(Medium)         felt like too much
     impactAsync(Heavy)          the ceiling, and too much for
                                 something that happens fifty times a
                                 session

   The trip, because the conclusion on its own is no use: it started at
   `selectionAsync` and felt like almost nothing, but that was a bite on
   nothing. The function was written and both calls still went straight
   to `selectionAsync`, so the test with Medium never reached the phone.
   Once wired up: Heavy too much, Medium a little too much. Of the two
   candidates left, Light was tried, which is the one that lowers the
   AMPLITUDE. `Rigid` is the other option and it lowers something else:
   `soft` and `rigid` are not steps of force but of HARDNESS, how much
   the thing that hits compresses, so Rigid strikes about like Medium
   but ends sooner. If Light falls short, that is the step next door.

   This is the only thing in the piece with no receipt: the clip is
   video and has no haptic track. It is tuned with the phone in your
   hand and nothing else. */
const impact = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

/* Sentinel: the finger is driving the pager, not a tap. */
const NONE = -1

type Props = {
  tabs: Tab[]
  /** The content of each page. Called once per tab. */
  page: (tab: Tab, index: number) => ReactNode
  /** What goes above the tab bar and collapses with it. */
  header?: ReactNode
  /** The height of the status bar: the collapsing block includes it,
      and the cover left behind once it is gone measures exactly that. */
  top: number
  /** One-shot choreography for recording (Stocks slow → the rest fast). */
  demo?: boolean
}

export function SwipeableTabs({ tabs, page, header, top, demo = false }: Props) {
  const { width } = useWindowDimensions()
  const palette = usePalette()

  /* ═══ THE COLLAPSE — the block at the top rises with the page's
     scroll. The mechanism and its receipt are in `collapse.tsx`. The
     state lives here because here is where it is known which page is
     active. */
  const rise = useSharedValue(0)
  const positions = useSharedValue<number[]>(tabs.map(() => 0))
  const height = top + HEADER.height + TAB_BAR.height + StyleSheet.hairlineWidth
  /* The block stops with the divider flush against the edge of the
     status bar: the travel is its height minus that bar. The whole
     travel was tried (the labels leaving through the top, as in X) and
     the user rejected it on the phone. See `collapse.tsx`. */
  const travel = height - top
  const collapse = useMemo<Collapse>(
    () => ({ height, travel, rise, positions }),
    [height, travel, rise, positions],
  )
  const pager = useAnimatedRef<Animated.ScrollView>()
  /* PROBE: in demo the pager is born on Following (see `contentOffset`)
     and the bar has to be born there too, or the first frame shows the
     Following tab with the For you content. */
  const scrollX = useSharedValue(demo ? width : 0)
  const target = useSharedValue(NONE)

  /* What is moving the content. The bar needs it to know whether it is
     its turn to command its row or to leave it to the user. */
  const motion = useSharedValue<number>(MOTION.still)

  const progress = useDerivedValue(() => (width > 0 ? scrollX.get() / width : 0))

  /* The ends and the progress of the tap under way. `onTap` writes them
     once, and they are only read while `target` is not the sentinel. */
  const tapFrom = useSharedValue(0)
  const tapTo = useSharedValue(0)
  const tapProgress = useSharedValue(0)

  /* ───────────────────────────────────────────────────────────────
     THE TRANSITION UNDER WAY, WHOLE AND IN A SINGLE VALUE.

     ── What `d` and `h` are ──
     The bar does not interpolate over the n states: it interpolates
     between TWO, the one it comes from and the one it goes to. The
     difference only shows when those two are not neighbours.

     Dragging they always are, `floor(p)` and the next one.

     Tapping, they are not. A tap from tab 2 to tab 6 sweeps `progress`
     through 3, 4 and 5, and with the interpolation over every state
     each of those opened its icon on the way past and closed it again.
     It looked like flailing. By pinning the ends at 2 and 6 for as long
     as the tap lasts, the layout goes from state 2 to state 6 in one
     move, and the only two icons that move are the ones at the ends.

     ── What `t` is, and why looking at the scroll is not enough ──
     Dragging it is enough: the two ends are neighbours and the progress
     is the fractional part of the page. But a FAR TAP moves the content
     A SINGLE PAGE even if the jump is four tabs wide (see `onTap`), so
     there the scroll covers 1/4 of what the bar covers. That is why the
     tap brings its own progress.

     ── AND WHY IT IS ONE VALUE AND NOT THREE ──
     Because the three of them have to be true AT THE SAME TIME, and
     with three shared values they were not: the receipt for the flicker
     that caused is above `Segment`, in `tab-bar.tsx`. A
     `useDerivedValue` declares its output, so Reanimated's topological
     order runs it before all of its readers; a `useAnimatedReaction`
     declares none.
     ─────────────────────────────────────────────────────────────── */
  /* The page that is on loan, to which slot, and which one used to live
     there. That one goes dark for as long as the loan lasts, or the two
     of them are drawn on top of each other and the text is trampled.
     See `onTap`. */
  const lentIndex = useSharedValue(NONE)
  const lentX = useSharedValue(0)
  const coveredIndex = useSharedValue(NONE)

  const last = tabs.length - 1
  const segment = useDerivedValue<Segment>(() => {
    /* The tap's segment holds WHILE THERE IS A TAP, and the tap is
       `motion === tap`, not `target !== NONE`: anything else that moves
       the pager through `target` (a recording probe, 2026-09-04) left
       the bar reading a stale `tapFrom`/`tapTo` and the underline stuck
       on For you while the content travelled. */
    if (target.get() !== NONE && motion.get() === MOTION.tap) {
      return { d: tapFrom.get(), h: tapTo.get(), t: tapProgress.get() }
    }
    /* The far tap that the finger interrupted: the loan is still alive,
       so the bar keeps going from `from` to `to`, with the progress
       read off the scroll between the lent slot and the destination
       (the receipt is above `settleLoan`). */
    if (lentIndex.get() !== NONE) {
      const d = tapFrom.get()
      const h = tapTo.get()
      const dir = h > d ? 1 : -1
      return { d, h, t: Math.min(1, Math.max(0, (progress.get() - (h - dir)) * dir)) }
    }
    const p = progress.get()
    const d = Math.max(0, Math.min(Math.floor(p), last))
    const h = Math.min(d + 1, last)
    /* `h` is always `d + 1` except on the last tab, where there is
       nowhere to go and both ends are the same. There `t` means
       nothing. */
    return { d, h, t: h === d ? 0 : Math.min(1, Math.max(0, p - d)) }
  })

  /* Whose tap is under way. See `onTap`. */
  const generation = useSharedValue(0)

  /* The tab the scroll is about to jump to WITHOUT anything changing on
     screen (see `settleLoan`): that crossing does not buzz. */
  const hapticSuppressed = useSharedValue(NONE)

  /* ═══ THE FINGER WINS, ALSO DURING A FAR TAP ═══

     Until 2026-09-07 the pager refused the finger for as long as a far
     tap lasted (`scrollEnabled={!still}`, a React state that changed
     twice per tap), because of the page on loan: giving it back with
     half a screen showing looked like a jump. That broke the rule
     `animate-expo` sets as the floor, that interruption is not polish
     but the base, and the user asked for it to be honoured without
     touching the tap's animation, so the video would not need
     re-recording.

     How: the loan STAYS ALIVE while the finger drags. The geometry the
     user sees, the origin page in the neighbouring slot and the
     destination next to it, is kept, and the bar keeps going from
     `from` to `to` with the progress read off the scroll (see
     `segment`). The loan is given back only when it cannot be seen:
       · if the content reaches the destination, right there: the lent
         slot ends up off screen;
       · if the finger comes back and the pager stops on the lent page,
         it is given back and in the SAME frame the scroll jumps to that
         page's real slot. The content is identical before and after,
         and the haptic for that jump is silenced because nothing
         changed.
     What is left wrong, and it is a corner of a corner: dragging
     BACKWARD past the lent page inside those 300 ms shows the empty
     slot it came out of, or a page that is not its neighbour; it fixes
     itself on release, along the same path. There is no way to avoid it
     without moving the scroll with the finger down, and UIScrollView
     does not honour that. NO RECEIPT ON SCREEN YET: test on the phone
     by tapping far away and dragging right after, in both directions. */
  const returnLoan = () => {
    'worklet'
    lentIndex.set(NONE)
    lentX.set(0)
    coveredIndex.set(NONE)
  }
  const settleLoan = () => {
    'worklet'
    if (lentIndex.get() === NONE || width <= 0) return
    const d = tapFrom.get()
    const h = tapTo.get()
    const neighbour = h - (h > d ? 1 : -1)
    if (Math.round(progress.get()) === neighbour) {
      hapticSuppressed.set(d)
      scrollTo(pager, d * width, 0, false)
      scrollX.set(d * width)
    }
    returnLoan()
  }
  const onScroll = useAnimatedScrollHandler(
    {
      onScroll: (e) => {
        scrollX.set(e.contentOffset.x)
        /* With the loan alive and the finger in command: on reaching
           the destination the lent slot can no longer be seen, and it
           is given back right there. */
        if (lentIndex.get() !== NONE && motion.get() === MOTION.drag && width > 0) {
          const h = tapTo.get()
          const dir = h > tapFrom.get() ? 1 : -1
          if ((progress.get() - h) * dir >= 0) returnLoan()
        }
      },
      /* If the finger comes on stage, it cuts off any tap animation
         that is running. The gesture always wins. With a page on loan
         the turn passes to the finger: the tap's callback, which
         arrives cancelled, belongs to nobody and does not clean up. */
      onBeginDrag: () => {
        if (lentIndex.get() !== NONE) {
          generation.set(generation.get() + 1)
          tapProgress.set(tapProgress.get())
        }
        target.set(NONE)
        motion.set(MOTION.drag)
      },
      /* Only once the momentum is over: between release and stop the
         content keeps moving, and the row has to stay tied to it. */
      onMomentumEnd: () => {
        if (target.get() !== NONE) return
        settleLoan()
        motion.set(MOTION.still)
      },
      /* Releasing right on a page boundary with no velocity brings no
         momentum, so `onMomentumEnd` never arrives: it settles here. */
      onEndDrag: (e) => {
        if (target.get() !== NONE || width <= 0) return
        const p = e.contentOffset.x / width
        if (Math.abs(e.velocity?.x ?? 0) > 0.001 || Math.abs(p - Math.round(p)) > 0.001) return
        settleLoan()
        motion.set(MOTION.still)
      },
    },
    [width],
  )

  /* The only bridge between the animation and the ScrollView, and it
     runs entirely on the UI thread: not one React render per frame. */
  useAnimatedReaction(
    () => target.get(),
    (x) => {
      if (x !== NONE) scrollTo(pager, x, 0, false)
    },
  )

  /* ───────────────────────────────────────────────────────────────
     THE TICK ON CHANGING TABS.

     This is what makes dragging feel like a control with positions and
     not like a piece of cloth. The underline is continuous, so there is
     no visual jump marking the moment, but the IDENTITY of the active
     tab does jump, right in the middle. That is where the tick goes.

     EVIDENCE WARNING: this is NOT measured against the reference. The
     clip is a video and has no haptic track; there is no way to get out
     of it whether X buzzes, when, or with what intensity. The pattern
     comes from the `animate-expo` skill, "a value ticks past a step",
     and the intensity was tuned by hand, with the phone. It is the only
     thing in the piece without a receipt.

     The condition in the `prepare` is what makes it cheap: `progress`
     is rounded and Reanimated only calls the body when that integer
     changes. There is never a `scheduleOnRN` per frame, which is the
     classic way to ruin the JS thread with haptics.
     ─────────────────────────────────────────────────────────────── */
  useAnimatedReaction(
    () => Math.round(progress.get()),
    (tab, previous) => {
      if (previous === null || tab === previous) return
      /* A tap already gave its tick on the press. Without this, jumping
         from tab 0 to tab 3 would buzz three times while the animation
         goes through the middle, and the rule is one haptic per user
         action, not one per thing that moves. */
      if (target.get() !== NONE) return
      /* The scroll settling into the lent page's real slot does not
         change what you see, and does not buzz (see `settleLoan`). */
      if (tab === hapticSuppressed.get()) {
        hapticSuppressed.set(NONE)
        return
      }
      scheduleOnRN(impact)
    },
  )

  const onTap = useCallback((index: number) => {
    /* THE HAPTIC GOES ON THE COMPLETED TAP, not on the press. It was in
       `onPressIn` ("the tick has to arrive when you decide") and the
       phone showed the cost: starting to DRAG the row puts the finger
       down on a tab, so every drag of the list buzzed ("take the haptic
       out", 2026-09-01). The scroll cancels the press and `onPress`
       does not fire, so the tick is left only on taps.

       And only if the tab changes: buzzing on the already active tab is
       noise, because the haptic marks a change of selection and there
       is none there. */
    if (Math.round(progress.get()) !== index) impact()
    /* No React state here: a tap, far or not, does not render. The
       pager accepts the finger always, also during a far tap (see
       `settleLoan`). */

    /* THE ASSIGNMENTS GO TOGETHER ON THE UI THREAD, and it is not a
       detail: writing a shared value from JS is queued, so two writes
       in a row in the same tick can arrive as one. If that happened,
       the `withTiming` would start from the old value of `target`,
       which after a drag is the sentinel, and the pager would jump.
       Inside a worklet they run in order. */
    scheduleOnUI(
      (i: number, pageWidth: number) => {
        'worklet'
        /* ═══ A TAP CANCELS THE PREVIOUS ONE, AND IT HAS TO BE CLOSED
           PROPERLY ═══

           House rule: cancel whatever is running before starting
           another animation on the same shared value. Here that is not
           enough, because the tap leaves something else switched on
           besides the animation: the page on loan.

           If a second tap arrives, the first one ends AT ONCE: the
           pager jumps to where it was going and the page on loan goes
           back to its slot. Only then does `Math.round(progress)` read
           a real page again and not a point halfway there. */
        if (target.get() !== NONE) {
          scrollTo(pager, tapTo.get() * pageWidth, 0, false)
          scrollX.set(tapTo.get() * pageWidth)
          lentIndex.set(NONE)
          lentX.set(0)
          coveredIndex.set(NONE)
        } else {
          /* A loan the finger interrupted and that has not settled yet
             (the pager is still stopping): it settles now, or the new
             tap would read a page that is not the one on screen. */
          settleLoan()
        }

        const d = Math.round(progress.get())
        if (i === d) return
        const dir = i > d ? 1 : -1

        /* This tap's turn. The `withTiming` callback fires even when it
           is cancelled, so without this the old tap's cleanup would
           wipe the new one's page on loan. */
        const turn = generation.get() + 1
        generation.set(turn)

        /* ═══ THE CONTENT TRAVELS A SINGLE PAGE ═══

           Tapping tab 4 from tab 0 does NOT scroll four screens of
           content. The reference does it this way and it is measured:
           in the For you → Tech tap, two tabs in between, there is ONE
           SINGLE splice in the video. The For you page leaves and the
           Tech page comes in, back to back. Neither Following nor
           Stocks appears.

           How: the ORIGIN page is lent to the slot next to the
           destination, and the scroll jumps there in the same frame. On
           screen nothing changes, the origin page still fills
           everything, but the trip has become one page long. When it is
           over the page is given back, and by then it is off screen: it
           is not seen either.

           The order matters. `target` is set FIRST to shut the door on
           the haptic tick and on the `from`/`to` arithmetic, which
           would otherwise read the scroll's jump as a tab change. */
        const neighbour = i - dir
        target.set(neighbour * pageWidth)
        motion.set(MOTION.tap)
        tapFrom.set(d)
        tapTo.set(i)

        if (neighbour !== d) {
          lentIndex.set(d)
          lentX.set((neighbour - d) * pageWidth)
          coveredIndex.set(neighbour)
          scrollTo(pager, neighbour * pageWidth, 0, false)
          /* By hand and not waiting for the scroll event: `progress`
             has to be at the new place NOW, or the next frame reads it
             stale. */
          scrollX.set(neighbour * pageWidth)
        }

        /* The bar covers `from` to `to` in full even though the content
           covers one page: that is why the tap brings its own progress
           instead of deriving it from the scroll. */
        tapProgress.set(0)
        tapProgress.set(withTiming(1, CFG))
        target.set(
          withTiming(i * pageWidth, CFG, () => {
            /* If another tap came in meanwhile, this callback arrives
               late and it is not its job to clean anything up: the turn
               belongs to someone else. */
            if (generation.get() !== turn) return
            /* And if not, it cleans up without checking whether the
               animation finished or was cancelled: in both cases the
               page on loan has to be given back and the sentinel
               released, or the drag's tick goes mute forever. */
            lentIndex.set(NONE)
            lentX.set(0)
            coveredIndex.set(NONE)
            target.set(NONE)
            motion.set(MOTION.still)
          }),
        )
      },
      index,
      width,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width])

  /* ═══ THE PAGES ARE MEMOIZED, AND IT IS NOT MICRO-OPTIMIZATION ═══

     Today this component has no React state: neither a tap nor a drag
     renders it. It had some until 2026-09-07 (`still`, the pager's
     lock during a far tap), and that render re-created the elements of
     all SIX pages, twelve rows of text each, right on the frame the
     tap's animation started. The memo stays: a render of the parent
     (the theme, for instance) would do the same thing, and the
     measurement below is the receipt for what it costs.

     It was measured: in the 60 fps recording of a far tap, the first
     frame after the tap did not move and the second one jumped 0.195 at
     once (the ease asked for 0.128 and 0.252). A whole frame lost, and
     it looked like a tug.

     `page` comes from the route, which does not re-render when the
     state here changes, so its identity holds and in practice this
     `useMemo` never recalculates. */
  const sheets = useMemo(
    () => tabs.map((tab, index) => ({ id: tab.id, content: page(tab, index) })),
    [tabs, page],
  )

  /* On changing tabs, the block cannot end up more collapsed than the
     arriving page scrolled: it interpolates between the segment's two
     pages while the content travels, and on settling the rise is
     clamped to the new page so the next delta starts from what is on
     screen. OUR DECISION (see `collapse.tsx`). */
  const clampedRise = useDerivedValue(() => {
    const { d, h, t } = segment.get()
    const p = positions.get()
    const from = p[d] ?? 0
    const scroll = from + ((p[h] ?? 0) - from) * t
    return Math.min(rise.get(), Math.max(0, scroll))
  })
  /* Two layers: the whole block translates with an opaque background;
     only what sits on top (header and bar) fades. The divider stays
     with the background: it is the line that travels and stops under
     the status bar. */
  const blockStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -clampedRise.get() }] }))
  const frontStyle = useAnimatedStyle(() => ({ opacity: collapsedOpacity(clampedRise.get(), travel) }))
  useAnimatedReaction(
    () => motion.get(),
    (m, previous) => {
      if (m !== MOTION.still || previous === null || previous === MOTION.still) return
      const p = positions.get()
      rise.set(Math.min(rise.get(), Math.max(0, p[Math.round(progress.get())] ?? 0)))
    },
  )


  /* ═══ RECORDING PROBE (?demo=1) — not part of the piece ═══
     A one-shot choreography for recording the video, with synthetic
     gestures that go down the piece's real paths: the drags move the
     pager's offset frame by frame with `motion` set to `drag` (the bar
     follows the content as it would with a finger) and the taps are
     `onTap`. It gets deleted before closing, like every probe.

     What the user asked for about the previous take (2026-09-04): that
     the entry into Following should not stall (it was an instant jump),
     that Following → Stocks should be SLOW, and that the fast part
     should not go by so fast (they were taps every 600 ms).

       0.0  born on Following, bar and content (contentOffset)
       1.5  slow drag Following → Stocks: 1.7 s, sine in-out, a finger
            that speeds up and slows down (X, measured: 1.73 s)
       4.1  tap to For you
       5.1  five one-tab flicks, every 1.0 s: 15 % of the trip in 110 ms
            (easeInQuad) and the rest in 430 ms (easeOutCubic), the
            profile fitted against X's measured drags
      10.1  on Design, two flicks back (AI, Tech), every 1.0 s
      12.1  still on Tech until the end */
  useEffect(() => {
    if (!demo || width <= 0) return
    let cancel = false
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
    /* The drags go through `target`, the same bridge the tap uses (its
       reaction does a `scrollTo` per frame and the `onScroll` feeds
       `scrollX`): a reaction of its own on another shared value left
       the previous take with jumps instead of drags. */
    const drag = (from: number, to: number, slow: boolean) =>
      scheduleOnUI(
        (a: number, b: number, pageWidth: number, isSlow: boolean) => {
          'worklet'
          motion.set(MOTION.drag)
          target.set(a * pageWidth)
          const done = (finished?: boolean) => {
            'worklet'
            if (!finished) return
            target.set(NONE)
            motion.set(MOTION.still)
          }
          if (isSlow) {
            target.set(withTiming(b * pageWidth, { duration: 1700, easing: Easing.inOut(Easing.sin) }, done))
          } else {
            target.set(
              withSequence(
                withTiming((a + (b - a) * 0.15) * pageWidth, { duration: 110, easing: Easing.in(Easing.quad) }),
                withTiming(b * pageWidth, { duration: 430, easing: Easing.out(Easing.cubic) }, done),
              ),
            )
          }
        },
        from,
        to,
        width,
        slow,
      )
    ;(async () => {
      await wait(1500)
      if (cancel) return
      drag(1, 2, true)
      await wait(1700 + 900)
      if (cancel) return
      onTap(0)
      await wait(300 + 700)
      for (const i of [1, 2, 3, 4, 5]) {
        if (cancel) return
        drag(i - 1, i, false)
        await wait(1000)
      }
      /* Once at the last tab, two flicks back and that is where it ends
         (the user's request, 2026-09-04). */
      for (const i of [4, 3]) {
        if (cancel) return
        drag(i + 1, i, false)
        await wait(1000)
      }
    })()
    return () => {
      cancel = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot for the recording
  }, [demo, width])

  return (
    <View style={[css.piece, { backgroundColor: palette.background }]}>
      {/* The pager fills the WHOLE screen, status bar included: the
          content passes under the block once the block is gone. Each
          page leaves `height` free at the top (see
          `useCollapsingScroll`). */}
      <CollapseContext.Provider value={collapse}>
        <Animated.ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          /* PROBE: to really be born on Following. A `scrollTo` in the
             first effect did not move the pager (the content was not
             there yet) and left the bar on Following with the For you
             content. */
          contentOffset={demo ? { x: width, y: 0 } : undefined}
        >
          {sheets.map((sheet, index) => (
            <Sheet
              key={sheet.id}
              index={index}
              width={width}
              lentIndex={lentIndex}
              lentX={lentX}
              coveredIndex={coveredIndex}
            >
              {sheet.content}
            </Sheet>
          ))}
        </Animated.ScrollView>
      </CollapseContext.Provider>

      {/* THE BLOCK THAT COLLAPSES: status bar + header + tabs +
          divider. It translates as a whole with an opaque background;
          it stops with the divider flush against the edge of the status
          bar, and then its background IS what covers the status bar. No
          separate cover is needed (there was one, and its hairline
          showed through the block while it faded; see `collapse.tsx`). */}
      <Animated.View style={[css.block, { paddingTop: top, backgroundColor: palette.background }, blockStyle]}>
        <Animated.View style={frontStyle}>
          {header}
          <TabBar tabs={tabs} segment={segment} motion={motion} viewport={width} onTap={onTap} />
        </Animated.View>
        <View style={[css.divider, { backgroundColor: palette.divider }]} />
      </Animated.View>
    </View>
  )
}

/* One page of the pager. It is in its own component only so each one
   has its own `useAnimatedStyle`: 99% of the time it returns 0 and
   costs nothing, and in the other 1% it is the one on loan.

   `memo` because the content already arrives memoized from above:
   without this, a render of the pager would re-render all six anyway. */
const Sheet = memo(function Sheet({
  index,
  width,
  lentIndex,
  lentX,
  coveredIndex,
  children,
}: {
  index: number
  width: number
  lentIndex: SharedValue<number>
  lentX: SharedValue<number>
  coveredIndex: SharedValue<number>
  children: ReactNode
}) {
  const style = useAnimatedStyle(() => ({
    opacity: coveredIndex.get() === index ? 0 : 1,
    transform: [{ translateX: lentIndex.get() === index ? lentX.get() : 0 }],
  }))
  return <Animated.View style={[{ width }, style]}>{children}</Animated.View>
})

const css = StyleSheet.create({
  piece: { flex: 1 },
  block: { position: 'absolute', top: 0, left: 0, right: 0 },
  /* 1 px in the reference, which at 3x is exactly `hairlineWidth`. The
     underline rests right on top of it. The color comes from the
     palette. */
  divider: { height: StyleSheet.hairlineWidth },
})
