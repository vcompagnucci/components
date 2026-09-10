import * as Haptics from 'expo-haptics'

/* ═══════════════════════════════════════════════════════════════
   THE HAPTIC TRACK — in one place, because it is the only thing in the
   piece that CANNOT be measured: the clip is video and has no haptic
   track. Everything here is NO RECEIPT and gets tuned with the phone in
   hand (the simulator does not vibrate).

   IT FOLLOWS THE TABLE IN `animate-expo` § 8 (asked for on 2026-09-04):

     a value ticks past a detent  →  selectionAsync()
     the operation succeeded      →  notificationAsync(Success)

   and nothing else. Pressing and releasing are not in the table (an iOS
   button does not vibrate when you touch it, and releasing early is not
   an error: the user decided) so they have no haptics. What was there
   before (2026-09-02: Light on press, Soft on release, twelve growing
   impacts from Soft to Medium at the detents) stays in the log in case
   the phone asks for it back.

   The skill's three absolute rules: every tick lands in the same frame
   as the visual (the progress crossing a threshold, in
   `useAnimatedReaction` over the SAME shared value that moves the
   front), there is never a tick per frame (twelve per hold, like a
   picker running past twelve rows: the exception in the table), and
   none of this is the only feedback. The fill is visible with the
   haptics off.
   ═══════════════════════════════════════════════════════════════ */

/* NO RECEIPT · complete: the system's success pattern, the "da-dum" iOS
   uses when something has been confirmed. It lands in the same frame as
   the burst of particles, which is the causal event. */
export const onComplete = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

/* THE DETENTS, in progress 0..1 (that is, in fractions of
   `HOLD.duration`). With the 2 s hold the intervals ran 300, 300, 240,
   220, 180, 160, 140, 120, 100, 80, 70, 60 ms; with 1 s, half of that.
   The acceleration is what says "almost there": with a single kind of
   tick, the cadence is the only knob left.

   WHERE THE LAST TWO FALL. The second to last (0.955) falls just before
   the label's jump to black, which starts at `HOLD.blackAt` 0.965 and
   ends at 0.977 (`hold-to-commit.tsx`, over the SAME linear `progress`).
   The last one (0.985) falls on the last frame of the hold, right up
   against the commit's success pattern. This used to say the last one
   fell before the jump to black: the one that falls there is the second
   to last. NO RECEIPT. */
export const DETENTS = [0.15, 0.3, 0.42, 0.53, 0.62, 0.7, 0.77, 0.83, 0.88, 0.92, 0.955, 0.985] as const

/* A detent: `selectionAsync`, the one for "a value ticks past a step". */
export const tick = () => Haptics.selectionAsync()
