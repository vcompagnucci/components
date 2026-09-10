import { Section } from '../../../notes'

/* The notes of Hold to buy. Everything here is in the record: the
   README (§ Hold to commit), the piece's `measurements.ts` and
   `recipe.ts`, and the measurements in `.context/hold-to-commit/`. If a
   sentence stops being true, it gets fixed here AND there: the public
   text is not a free summary, it is the same evidence told for someone
   arriving from outside.

   THE PROCEDURE IS THE ONE IN AGENTS.md › How the line and the notes
   are written, the one Swipe between tabs settled. What follows are the
   receipts of THIS page, one per decision.

   NO DESCRIPTION LINE. It is the first rule: the title already says
   what the gesture is. "Hold to buy" is eleven characters and it names
   the action; a line under it would only repeat it.

   THE TONE, read served on 2026-09-08, not from memory. The measure
   comes from josh puckett (joshpuckett.me /bloom, /pasito,
   /melt-effect): 19 paragraphs of his prose give a median of 25 words
   and 2 sentences, with sentences of 12 words on average. And the way
   he opens a paragraph: the first word is the subject of the fact,
   never an announcement of what follows. The sequence is written with
   "then", in order, in a single sentence ("Automatically sizes to fit
   the trigger content, then animates to the menu dimensions"). From
   benji (benji.org, the "How it works" of /liveline) comes the prose
   that goes from what you feel to the mechanism without turning into a
   changelog.

   PERSON. Zero "I" and zero "we": in josh's two reference pages
   (/pasito, /bloom) there is not one of either, and the "we" shows up
   only in the tutorial. "You" is whoever holds the button down.

   ONE NAME PER THING, across the whole page and not per section, which
   is the failure `better-writing` finds most here. The decisions: "the
   fill" for the sheen that crosses (never "sweep" or "glow"), "the
   label" for the text, "haptic detents" for the haptics, "checkmark"
   for the glyph and "tap" ONLY for the finger. The first version said
   "taps" for the haptics in Anatomy and "tick" in Performance, with
   "tap" already taken in Use cases. And "tick" had to go altogether
   when the checkmark entered the text: in English a checkmark IS a
   tick, so the same word named the glyph and the haptic pulse.
   "Detent", a mechanical stop you can feel, is also the name the code
   already used (`DETENTS` in `haptics.ts`).

   ANATOMY TALKS ABOUT THE BUTTON ONLY. The financial card behind it in
   the video (the chart, the range picker, the rows) is skeleton and
   does not go in: it is the same thing that was decided with the tabs.
   The reference is named in the closing, together with how it was
   measured.

   MUCH SHORTER (2026-09-08, "make it way shorter, and faithful to the
   code"). From 750 words and 12 paragraphs to 396 and 9: 47 %, in two
   passes and adding three new facts along the way (the border, the
   optical centering and the phone). What went: the paragraph about the
   reset (that one belongs to the workshop, not to the piece), the one
   that told how the fill and the label are made (implementation, and
   the repo's rule is to write from what you see), the one that broke
   the haptic latency down, and the list of example actions in Use
   cases. No claim was touched: the ones left over were deleted whole.

   WHAT GETS MENTIONED FROM THE SKILLS, AND WHAT DOES NOT. Only what a
   reader can SEE or feel in the piece goes in, with its receipt:
     · `animate-expo`: it runs on the UI thread and not on the
       JavaScript one (`hold-to-commit.tsx`, the whole gesture in
       worklets); transform and opacity only (the label color is the
       opacity of stacked batches, `label.tsx`); reduce motion
       (`useReducedMotion`); the haptics are never the only feedback
       (`haptics.ts` plus the fill); the text follows Dynamic Type
       (`TEXT.maxScale`); the recognizer and the fill read the SAME
       constant (`HOLD.duration`).
     · `better-ui`: interruptible (pressing again during the retreat
       picks up from where it is, `hold-to-commit.tsx:press`); optical
       alignment ("the checkmark and the words are centered by eye, not
       by box", the measured correction of −6.6 pt,
       `LABEL.opticalCorrection` in `measurements.ts`); and shadows for
       elevation instead of a border that only gave depth, which is
       also what answers the critique lens of `interface-craft` ("do
       outlines add structure or noise?").
   THE SHADOW SENTENCE IS CONDITIONAL on purpose: "lifted by a shadow
   on light backgrounds". A black shadow on the black background of
   dark mode cannot be seen, so saying that the shadow carries the
   border would be false in half the cases.
   What does NOT go in is the craft of the code, which the reader
   cannot check: the storyboard, the single stage, the named timings in
   one place and the data-driven of `interface-craft` are about the
   source, not about the piece.

   THE RETREAT IS TOLD EVEN THOUGH THE VIDEO DOES NOT SHOW IT. The
   recording is a single gesture end to end since 2026-09-08 (Vito:
   "have the recording run everything in one go, take out that part at
   the start where the button gets pressed and it cuts in the middle"),
   so letting go early is no longer on screen. It stays in the text
   because it is half the mechanism: a button you can abandon is what
   makes holding a confirmation and not a lock. It is written as a
   property of the button ("Let go early and…"), not as something the
   reader is watching.

   WHAT IS NOT CLAIMED, AND WHY. It does not say that the hold measures
   one second with 4 ms of error, even though the README's table has
   it: that measurement comes from the `auto` probe, which fires
   `press` and `complete` with two JavaScript `setTimeout`s
   (`hold-to-commit.tsx`), so it measures the aim of those timers and
   not the clock of the gesture recognizer. What it does claim is what
   the measurement does prove: that the recognizer and the fill read
   the same constant (`HOLD.duration`), and the dropped frames.

   THE PHONE COMES IN AS PROOF, NOT AS MEASUREMENT (2026-09-09, Vito:
   "already tested on a real phone"). The sentence is "Measured on the
   iOS Simulator and an Android emulator, and tested on a phone, where
   the haptic can be felt", and the two verbs are different on purpose:
   the NUMBERS in that section still come from the simulator and the
   emulator, which is where they came from, and from the phone comes
   the one thing you can only know there. The simulator does not
   vibrate, the header of `haptics.ts` says so and that is why the
   whole haptic track is marked NO RECEIPT, so the haptics are the part
   of the piece you cannot judge any other way. What is NOT written is
   a frame rate or a latency measured on a phone: those do not exist.

   THE NUMBERS, checked against the code on 2026-09-08: 46 points in
   the burst (`measurements.ts`, PARTICLES.count); 36 sparks over 12
   views (SPARKS.views 12 × livesPerView 3); 12 haptic detents
   (`haptics.ts`, DETENTS); the label starts to darken at 55 % of the
   travel (HOLD.inkFrom); the retreat on release lasts 400 ms
   (HOLD.retreat); the hold lasts 1000 ms (HOLD.duration). The frames
   under load and the latencies with the thread blocked are in the
   README.

   USE CASES WITHOUT CITING ANYONE. The concepts and the numbers come
   from Apple's interface guidelines, read on 2026-09-08 through their
   documentation API (developer.apple.com/tutorials/data/design/human-
   interface-guidelines/<slug>.json; the HTML page is assembled with
   JavaScript and returns the title only). They come in as explanation
   and are said plainly as our own, never as authority and without
   naming them, which is the rule in AGENTS.md. The two that stayed in
   the short text:
     · "Avoid displaying alerts for common, undoable actions, even when
       they're destructive. [...] when people take an uncommon
       destructive action that they can't undo, it's important to
       display an alert" (feedback.json) → the first paragraph and the
       third.
     · "Offer alternatives to gestures. [...] offer onscreen ways to
       achieve the same outcome" (accessibility.json) → the closing.

   NO DASH in the public text, neither em dash nor en dash: where one
   showed up, there are two sentences or there is a colon. Hyphens
   inside a compound word stay. The rule is for the public text, not
   for these comments, which were written in Spanish, where the dash is
   ordinary punctuation. */
export default function Notes() {
  return (
    <>
      <Section title="Anatomy">
        <p>
          React Native, with Expo. The button is a capsule with a label at its center. Touch and
          hold, and a white fill crosses it at a constant rate: the fill is the progress, not a bar
          beside it. The hold lasts one second.
        </p>
        <p>
          The press shrinks the button and the label blurs across to “Keep Holding...”. The label
          darkens as the fill passes under it. Let go early and the fill retreats and
          “Hold to Buy” returns; press again and it continues from where it stopped.
        </p>
        <p>
          At one second the button commits: it turns white, “✓ Order Placed” grows into place, and 46
          points burst from the perimeter. The checkmark and the words are centered by eye, not by box. Twelve haptic detents mark the hold, closer together as it
          advances; a success pattern lands with the burst.
        </p>
        <p>
          The capsule has no outline: its edge is its own shape, lifted by a shadow on light
          backgrounds. Only transform and opacity animate, the label color included, and the label
          follows the system text size. With reduced motion the fill arrives as opacity and nothing
          crosses or bursts. The haptic is never the only feedback: the fill says the same thing.
        </p>
        <p>
          The reference is the hold button in Opal, the screen time app on iOS, measured frame by
          frame at 60 fps.
        </p>
      </Section>

      <Section title="Performance">
        <p>
          Everything that moves is computed on the UI thread, not the JavaScript thread. A native
          recognizer times the hold and reads the same duration as the fill, so they cannot drift
          apart. React renders nothing while it runs.
        </p>
        <p>
          Under a load that stands in for a real app, the fill keeps its timing whether the
          JavaScript thread is busy, re-rendering, or blocked. What waits is what has to reach that
          thread, the haptic and the sound. Measured on the iOS Simulator and an Android emulator,
          and tested on a phone, where the haptic can be felt.
        </p>
      </Section>

      <Section title="Use cases">
        <p>
          A hold fits an uncommon action that cannot be undone and would be too easy to start by
          accident. The confirmation happens inside the button: no separate surface and no extra
          tap. Letting go before the end places no order.
        </p>
        <p>
          A common action that can be undone needs no confirmation: a plain button and a way to undo
          it. And a hold cannot be the only path: someone who cannot press and wait needs another
          way to the same outcome.
        </p>
      </Section>
    </>
  )
}
