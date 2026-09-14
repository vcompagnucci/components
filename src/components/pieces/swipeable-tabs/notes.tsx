import { Section } from '../../../notes'

/* The notes of Swipe between tabs. Everything here is in the record:
   `LOG.md` (§ The pieces), the piece's measurements.ts and
   the sheet .context/recon/swipeable-tabs/MEDICIONES.md. If a sentence
   here stops being true, it gets fixed here AND there. The public text
   is not a free summary, it is the same evidence told for someone
   arriving from outside.

   IT GOES IN THE FIRST PERSON SINGULAR. There is a single person in
   here, and the plural sounded like a team that does not exist. It is
   also what a measured page does when it tells its own story ("I've applied an SVG
   filter", "I'll never forget"), and he keeps the "we" only for walking
   the reader through a method. The "you" for the reader stays: it is
   his too.

   THE TONE IS MEASURED, on three served pages (
   Melt Effect, 2026-09-05): one line under the title that says what it
   is ("An iOS inspired pull down menu for the web"), short sections
   with plain titles ("Anatomy", "A note on performance"), two or three
   sentences per paragraph, direct verbs, "you" when he talks to you.
   The other measured site writes long essays about principles; from it comes the
   one-line caption under each demo and the shape of his "How it works"
   there: running prose of short sentences that connects what you
   feel with the mechanism ("When a new value arrives, nothing jumps.
   [...] That's why it feels like one thing breathing"). The previous
   version of these notes was an essay: the user asked for "nice and
   simple and concise, exactly that tone".

   THREE SECTIONS, NO MORE: "Anatomy", "Performance" and, when the piece
   calls for it, "Use cases". It is the rule for every note (the user's
   request, 2026-09-05: "far fewer sections"); the six of the previous
   version were too many.

   ANATOMY IS FOR WHOEVER JUST WATCHED THE VIDEO: what they are looking
   at and what it is made with. It talks only about the animation the
   piece is named after, the tabs. The header that collapses, the lists
   and the avatar are in the recording but not here ("have it talk about
   the tabs animation only", 2026-09-07). It is written from what you
   see (the underline that goes with the content, the tab that widens,
   the content that crosses a single page) and from there to the how,
   not the other way around: the version that told the implementation (a
   derived value, the pager handing a segment to the bar) was rejected
   as useless ("I don't feel this is useful", same day). It is prose,
   with no subheads: an h3 per part was tried, a measured shape,
   and the user rejected it on the page ("I don't like this structure").
   AND THE REFERENCE IS NOT NAMED HERE. It was named twice, in a
   closing sentence that also said how it was measured and in Use cases
   as the model for the shape, and both came out on 2026-09-14 together
   with the same closing on Hold to buy and the dev-only line that sat
   under every piece. The name of the reference app does not go on a
   piece's page; the attribution is the `Source` field of the clip in
   the vault. IT DOES NOT SAY WHERE THE SYMBOLS COME FROM, nor the
   haptics (the user's request, 2026-09-07). THE PIECE HAS
   NO DESCRIPTION LINE: it had one ("Top tabs for React Native &
   Expo.") and the user deleted it the same day, "the one above already
   says swipeable tabs". The title is the way in and these notes are
   what follows.

   IT SAYS "REACT NATIVE", NOT THE NAME OF A LIBRARY. Neither Reanimated
   nor worklets: "you don't usually say that" (the user, 2026-09-07),
   and whoever reads has no reason to know them. What those words meant
   is said plainly: the animation runs on the UI thread, not in
   JavaScript. The only brands left are the ones the reader recognizes:
   React Native, Expo, iOS.

   THE RULES THAT THE THIRD AND FOURTH PARAGRAPHS ENUMERATE (split in
   two on 2026-09-07 because a single paragraph had seven sentences and
   the shape asks for two to four: what animates and how, and what goes
   with it) are the ones from the skills `animate-expo`,
   `interface-craft` and `better-ui`, and ONLY the ones the code meets
   go in, checked on 2026-09-07 (the user's request: "spell out rules
   that follow /animate-expo and /interface-craft and /better-ui if the
   code meets them"). With no sentence announcing them: the paragraph
   starts on the first rule, like the measured "How it works" ("It follows
   the library's rules for motion" was rejected: "I don't like this
   sentence", same day). Each one with its receipt:
   · Transform, opacity and THE LABEL COLOR; the only animated `width`
     is the underline, an absolutely positioned child with no children,
     which is the exception the rule allows (animate-expo § 4;
     tab-bar.tsx, `underlineStyle`).
     The inventory of the piece's thirteen animated styles, counted on
     2026-09-08 by walking every `useAnimatedStyle`: transform ×6,
     opacity ×5, width ×1 (the underline), color ×1 (`labelStyle`,
     tab-bar.tsx, applied to the label). Until that day the text said
     "Only transform and opacity animate", which was FALSE, and false
     about the very finding of the piece: the active label is not
     thicker, it is whiter (142 → 255, interpolated in raw sRGB; the
     stem of the same letter measures 5.03 px in both states).
     THE CODE DOES NOT CHANGE, and the user asked the question in
     earnest ("but is the color a good practice?", 2026-09-08):
     · `animate-expo` does NOT ask for "transform and opacity only".
       Its § 4 and the *Never Ship* table list LAYOUT properties
       (width, height, margin, padding, flex, top, gap, the ones that
       re-run Yoga), and `color` is in neither of the two. It is
       there, instead, as a use case in § 3 ("press, toggle, color, a
       value flipping") and in § 9 as what must be KEPT under reduced
       motion ("keep opacity and color changes that explain a state
       change").
     · Color is not free either: transform and opacity are compositing
       and color is paint. The node is redrawn, and with text the
       glyphs are re-rasterized. One step more expensive than
       transform, several steps cheaper than layout.
     · The standard way out of an expensive paint property is the one
       the skill itself prescribes for Android shadows and for blur:
       stack two static layers and cross their opacities, here a gray
       label and a white one. IT IS NOT DONE: two antialiased texts on
       top of each other add coverage at the edge of every glyph and
       read thicker in the middle of the crossing, which is exactly
       what the measurement says X does not do. It would trade a cost
       nobody notices for an artifact everybody does.
     · And the cost is bounded: six short labels, only while a
       transition lasts, with 60 fps measured on the phone and the
       trace of 492 frames with no flicker.
   · The gesture interrupts the animation, a far tap included:
     `onBeginDrag` cancels the tap in flight and, if there is a page on
     loan, the loan stays alive until it cannot be seen (animate-expo,
     "interruptibility is the baseline"; swipeable-tabs.tsx, `onScroll`,
     `settleLoan`). Until 2026-09-07 the far tap blocked the pager; it
     was withdrawn to meet the rule without touching the animation or
     the video. NO RECEIPT on screen yet.
   · Ease-out, never ease-in: `Easing.out(Easing.cubic)`, 300 ms
     measured (animate-expo § 5; swipeable-tabs.tsx, `EASE_SETTLE`).
   · One haptic per action, in the frame of the change, never the only
     signal: `useAnimatedReaction` at the threshold and `scheduleOnRN`
     only there (animate-expo § 8; swipeable-tabs.tsx).
   · Reduced motion in the animation itself: `ReduceMotion.System` in
     the tap's config (animate-expo § 9; swipeable-tabs.tsx, `CFG`).
   · 120 fps enabled on ProMotion: `CADisableMinimumFrameDurationOnPhone`
     (animate-expo § 120fps; native/app.json). SOURCE, not measured on
     screen: the recording is at 60. OUT OF THE TEXT since 2026-09-14,
     for that reason: it is the one claim in Anatomy a reader could not
     check, on a page whose whole argument is that everything in it was
     measured. The flag stays in app.json.
   · Every value is a named constant with its source next to it
     (interface-craft, "tunable by default"; measurements.ts), and a
     single value drives the whole transition (interface-craft,
     "stage-driven"; `Segment` in swipeable-tabs.tsx).
   · Motion is never the only signal: white label, underline, symbol
     (better-ui, "motion restraint"; tab-bar.tsx).
   THE ONE IT DOES NOT MEET, ON PURPOSE, and that is why it is not in
   the text: the animate-expo gate "tab switches never slide". Here the
   content slides because the reference does and it is measured frame by
   frame; the rule is aimed at the bottom tabs with `animation: 'none'`.

   PERFORMANCE FOLLOWS THE SAME METHOD (the user's request, 2026-09-07:
   "since we improved anatomy so much, performance has to be improved,
   with the same rules"): where it runs and what was measured, from what
   you notice (it never stalls) towards the how, with no library names.
   Every claim with its receipt:
   · Everything on the UI thread and no round trip to JavaScript per
     frame: the scroll writes shared values, the styles derive from
     there; `scheduleOnRN` only in the threshold's reaction (the
     haptic), and the pager has had no React state since 2026-09-07
     (before that, `setStill` twice per far tap) (animate-expo § 6;
     swipeable-tabs.tsx, `onScroll`, `onTap`).
   · Zero layout per frame: the row is not a flex row; `layout`
     precomputes x and width of every tab for each resting state once,
     after measuring the labels with `onLayout`, and `between`
     interpolates between two states per frame; each tab is absolute
     with `translateX` (animate-expo § 4; tab-bar.tsx, `layout`,
     `between`, `css.tab`).
   · The pages memoized, with the measurement of the jerk: first frame
     still and the second one jumping 0.195 where the ease asked for
     0.128 and 0.252 (swipeable-tabs.tsx, "THE PAGES ARE MEMOIZED").
   · A single value, `Segment`, from which the underline, the labels
     and the symbols derive in the same frame (interface-craft,
     "stage-driven"; better-ui, "cohesion / single entity": "moves as
     one object"). RUNTIME: trace of the style's own mapper, sweep of
     six pages, 492 frames, zero spurious direction changes
     (swipeable-tabs-screen.tsx, "Do not touch without measuring
     again").
   · 60 fps sustained: on the phone, the user's measurement ("I
     measured it on the real phone and it's at 60 fps the whole time",
     2026-09-07); the frame completeness of the simulator recording
     (100.7 %, 101.1 % and 100.2 % inside each gesture across three
     takes, `LOG.md` § The video for X) is the receipt of the take, not
     of the phone.
   · Review "like a good engineer" (2026-09-07): "not in JavaScript" →
     "not the JavaScript thread" (worklets are JavaScript too, they run
     on the UI runtime); the scroll is native and it says so; the six
     pages are mounted from the start (`sheets`, all of them in the
     ScrollView) and memoized because of the cost of rebuilding six
     lists of twelve rows (`ROWS` in page.tsx); and the mechanism of
     the "one derived value": no style can read part of the previous
     frame's transition.

   TRUTHFULNESS CHECK (2026-09-07, the user's request: "check that all
   that information is true and correct"). Every claim was reread
   against the code, and three were imprecise and got fixed:
   · "A drag cancels a tap animation in progress" → at that moment only
     a tap on a neighboring tab was interrupted; the far one blocked
     the pager. That same afternoon the block was withdrawn (see above)
     and the sentence became true again for any tap: "at any point,
     however far the tab is".
   · "React does not render during a gesture" → it held for the DRAG;
     the far tap rendered twice. Without the block there is no React
     state left in the pager: "during a gesture or a tap".
   · "the second one catching up in a single jump" → the second frame
     jumped 0.195 where the ease asked for 0.252: it did not catch up.
     What was measured is a whole frame lost, and that is what the text
     says.
   · "No layout runs while the content moves" → "for the tabs": the
     width of the underline is layout of its own node, out of flow.
   Confirmed with no changes: the row is moved with `scrollTo` from a
   worklet (tab-bar.tsx); `layout` depends on [labels, tabs, viewport];
   the pages are `sheets = useMemo(..., [tabs, page])`; the only
   animated `width` among 13 animated styles is the underline's.
   Second reread (same afternoon, after the far tap change), three more
   precisions:
   · "It is never animated on its own" → on a tap the underline DOES
     carry its own animation (`tapProgress`, the same config as the
     content): now "a tap moves both with the same timing".
   · "One haptic per action" → it is one per CROSSING: going back and
     forth over the same boundary in one gesture buzzes every time, the
     way the label changes. A drag does not get to cross two tabs (the
     second crossing is a screen and a half of finger travel away; with
     paging the momentum only reaches the neighboring page): "a drag
     across three tabs buzzes three times" was a badly chosen example,
     corrected by the user. Now "once per change".
   · "JavaScript takes part only twice" → it read like a count: now "at
     two moments only".

   USE CASES SAYS WHEN YES AND WHEN NO, AND IT SAYS IT WITH APPLE'S
   WORDS (the user's request, 2026-09-08: "in use cases use what Apple
   resources would put"). Three paragraphs: when yes, the examples, when
   no.

   THE HIG COMES IN AS EXPLANATION, NEVER AS AUTHORITY, AND IT IS NOT
   NAMED. The user's rule, the same day, after reading the closing that
   did name it: "don't mention Apple guidelines [...] use them, but to
   explain something better, not to say something that isn't so". So
   from the guide come the concepts and the numbers ("closely related",
   the rule of self-contained panes, "about five", "top-level sections",
   the short labels) and they are said plainly as our own, with the
   quotation in this comment. The word "Apple" does not appear in the
   public text.

   SOURCE: the three HIG pages, served on 2026-09-08 and read through
   Apple's documentation API, `developer.apple.com/tutorials/
   data/design/human-interface-guidelines/<slug>.json` (the HTML page is
   assembled with JavaScript and cannot be read with `curl`; WebFetch
   returns the title only). Each sentence of the text with its
   quotation:
   · "closely related lists" ← segmented controls › iOS, iPadOS:
     "Consider a segmented control to switch between closely related
     subviews"; tab views: "Use a tab view to present closely related
     areas of content".
   · "what happens in one does not change what the others show" ←
     tab views: "Make sure the controls within a pane affect content
     only in the same pane. Panes are mutually exclusive, so ensure
     they're fully self-contained."
   · "more lists than a segmented control should hold" and "About five
     lists or fewer belong in a segmented control" ← segmented
     controls: "Limit the number of segments in a control. [...] Aim for
     no more than about five to seven segments in a wide interface and
     no more than about five segments on iPhone." The "about" is
     Apple's and it is kept: it is not a hard ceiling.
   · "a hierarchy" ← it is Apple's word for this (it appears four
     times in tab bars, and neither "drill" nor "back button" appears
     once in the three pages): "As a representation of your app's
     hierarchy".
   · "the top-level sections of an app belong in the tab bar at the
     bottom" ← tab bars: "A tab bar lets people navigate between
     top-level sections of your app" + iOS: "A tab bar floats above
     content at the bottom of the screen".
   · "Both of those ask for short labels" ← tab bars: "Include tab
     labels to help with navigation. [...] Use single words whenever
     possible"; segmented controls: "Use nouns or noun phrases for
     segment labels" and "As much as possible, use content with a
     similar size in each segment".
   THE FOURTH PARAGRAPH WAS DELETED, AND IT WAS WRONG IN TWO WAYS. It
   said: "On the Mac, Apple's guidelines call this a tab view: mutually
   exclusive panes of content in one area, switched with a row of tabs.
   There is no tab view on iPhone; for the same job the guidelines point
   to a segmented control." It lived a few hours on 2026-09-08 and the
   user took it down ("that part is wrong"). He was right:
   · "There is no tab view on iPhone" is FALSE for whoever writes the
     code. The HIG's "Not supported in iOS" talks about the macOS
     DESIGN component, the box with tabs on top; but `TabView` exists
     in SwiftUI on iOS, it is the tab bar's container, and with
     `.tabViewStyle(.page)` it is literally a pager that slides, which
     is the closest thing in the system to this piece. Writing that it
     does not exist is exactly "saying something that isn't so".
   · "For the same job the guidelines point to a segmented control"
     CONTRADICTS the paragraph above it, which says a segmented control
     is for five lists or fewer. The two together claimed that this
     piece ought to be a segmented control, which is the opposite of
     everything the section argues.
   What the paragraph meant to add, that the pattern lives between a
   segmented control and a tab bar, the third paragraph already says
   without naming anyone and without claiming too much. The lesson for
   the next pieces: a guide is good for sharpening an explanation, not
   for asking it permission; the moment the text needs the name of
   whoever wrote it to hold up, the claim does not hold up on its own.
   NEITHER is "Avoid providing more than six tabs in a tab view" quoted
   (tab views), even though X has six: it is macOS guidance and using it
   for iPhone would be stretching it.
   WHAT DOES NOT COME FROM APPLE, and belongs to the piece, checked in
   the code: the active tab widens for its symbol and the row moves only
   when a tab does not fit (`TAB_BAR.row = 'visible'`, tab-bar.tsx). The
   sentence "two feeds and four topics in one row", which counted the
   six in `TABS` in swipeable-tabs-screen.tsx, was deleted on
   2026-09-14: it was accurate, and it was the clause that named the
   reference app.
   IT WILL CARRY VIDEO: one video per case with a one-line caption like
   the measured one ("Resting heart rate. Custom formatter,
   exaggerated Y-axis.": what it is and what changes). Until those
   exist, the section is prose (the user's request, 2026-09-07: "I plan
   to include more videos and so on").
   WHAT WAS NOT DONE, and is waiting for a decision: the "Resources"
   section Apple closes every HIG page with (Related · Developer
   documentation · Videos). "Apple resources" can be read that way too,
   but dropping in a block of links changes the shape of the notes of
   EVERY piece, and that is another mini-decision.

   NUMBER AND UNIT GO WITH A NON-BREAKING SPACE, and until 2026-09-14
   this paragraph said so while the file did not do it. Counted that
   day: zero U+00A0, zero `&nbsp;`, in this file and in every other one
   under src/. The rule was written on 2026-09-07 and never applied,
   and nothing catches that, because a reference checker reads names
   and a compiler does not read prose. It is applied now, with `&nbsp;`
   in the three that survived the cut: "300 ms", "60 fps" and "492
   frames". It is the better-typography rule, so that a number does not
   land on one line and its unit on the next.

   THE NAMES ARE THE TECHNICAL TERMS (tab, underline, label, symbol,
   page; "select", not "jump"), by the repo's naming rule (AGENTS.md ›
   Working method): the word that would go in a specification, not the
   funny one.

   AND THE WRITING GOES THROUGH `better-writing` (2026-09-07, the
   user's request: that everything respect the vocabulary rule and that
   the writing improve like the measured pages): words a tired reader
   gets on the first pass, no idioms, and every word that does no work
   deleted. What came out of that pass: "mid-flight" → "in progress";
   "tied to" → "bound to"; "never runs ahead or lags behind" → "It is
   never animated on its own"; "cue" → "feedback"; "in step" →
   "synchronized"; "absolute element" → "absolutely positioned";
   "ProMotion screens" → "ProMotion displays" (Apple's name);
   "first-level filters" → "top-level sections"; "React never renders a
   frame" → "React does not render" (React does not render frames); and
   the sentence "one value drives the whole transition", which was there
   twice, stayed only in Performance.

   SECOND `better-writing` PASS, over the THREE sections (the user's
   request, 2026-09-08: "check that everything meets /better-writing").
   The rule that caught them is "one voice, flexible tone": one name per
   thing across the whole page. Three changes, and all three are about
   consistency, not taste:
   · "the bar" → "the row" (Performance, twice). The row was called
     "row" in Anatomy and in Use cases, and "bar" only here. It was the
     internal file name (barra.tsx then, `tab-bar.tsx` today) leaking
     into the public text.
   · "the chosen tab doesn't fit" → "the active tab does not fit"
     (Anatomy). Two things: "chosen" and "active" were the same thing
     with two names in the same paragraph ("it becomes the active
     one"), and "doesn't" was the page's ONLY contraction, against
     "does not render", "is not a flex row", "must not rebuild".
   · "its offset is read" → "the scroll offset is read" (Performance).
     The nearest "its" pointed at "deceleration", not at the scroll
     view.
   REVIEWED AND NOT CHANGED: "however far away the tab is" (Anatomy § 2)
   and "however far the tab is" (§ 3) repeat two paragraphs apart. The
   echo is real, but the two clauses say different things (the content
   crosses ONE page whatever the distance; and the drag interrupts the
   tap even when the tab is far away, which is what was gained by
   removing the pager's block), and deleting either one loses a claim
   that cost a code change.
   AND IN USE CASES: "people" for whoever uses the reader's app (it is
   what the HIG uses, and here the reader is whoever builds) and "you"
   only when it talks to him ("Use them when..."); the first sentence
   dodges both ("what happens in one"). Anatomy keeps "you" because
   there the reader IS whoever touches the piece in the video.

   CONCISION PASS, 2026-09-08 ("now that we have everything, using good
   practices, leave it all much more concise"). 703 → 583 words, 17 %
   less, the SAME twelve paragraphs and the SAME claims: it is the
   `better-writing` rule "delete every word that does no work", applied
   word by word, not a cut of content. What was cut, by kind:
   · INTERNAL REDUNDANCY. "one value that describes the whole
     transition [...] It is one derived value" said the same thing
     twice: now "one derived value" and that is it. "not the JavaScript
     thread [...] is involved at two moments only [...] Never per
     frame" were three shapes of one idea: one was left. "always agree,
     and the row moves as one object" too: "move as one object" was
     left, which is the better-ui phrase the user approved.
   · REDUNDANCY BETWEEN SECTIONS. "the row scrolls only when a tab does
     not fit" was in Anatomy AND in Use cases; it stays in Anatomy. And
     "however far the tab is" was in two paragraphs of Anatomy; it
     stays in the one that needs it, the one about the content crossing
     a single page. The other was the one about the drag that
     interrupts, and "at any point" already says it without the
     distance.
   · PERIPHRASIS FOR THE VERB. "Tap a tab and it becomes the active
     one" → "A tap makes a tab active". "When one did, the recording
     showed the first frame after a tap standing still" → "Unmemoized,
     the first frame after a tap stood still". "several lists of equal
     standing" → "several peer lists" ("peers, not a hierarchy" is
     animate-expo's term, and it hooks into the hierarchy of the next
     paragraph). "so the drag and its deceleration run natively" → "the
     system runs the drag and its deceleration", which also says WHO.
   · WHAT WAS LOST ON PURPOSE, and has to be known: the closing of
     Anatomy said "from four recordings at 60 fps" and now says only
     "at 60 fps". The number went with the cut and it is good that it
     went: the record says the vault clip AND THEN four recordings by
     the user, that is five, so "four" was undercounting (found on
     2026-09-08, see `LOG.md`).
   SECOND CONCISION PASS, 2026-09-14 ("much shorter and more concise").
   547 → 414 words, 24 % less. (The pass above recorded 583 for the
   same text; counted again the same way on 2026-09-14 it is 547, so
   the two numbers are two counts and not a change.) The paragraph
   count did not move, and
   that is not an accident: Anatomy lost one and Performance gained
   one, because its second paragraph was five sentences where the shape
   asks for two to four.

   What was deleted whole, and each one had been flagged in advance by
   this comment or by the rule it broke:
   · The closing that named the reference, and the clause in Use cases
     that named it a second time.
   · "Every value is a named constant with its source", which the
     paragraph this one replaces had already marked as the next to go:
     the only sentence in Anatomy about the source code instead of
     about what you see.
   · 120 fps on ProMotion, marked SOURCE and not measured.
   · Four claims that the sentence beside them already made: "The
     JavaScript thread takes part only at the tap and at the haptic"
     (React does not render says it), "the scroll offset and every
     style derived from it are computed frame by frame" (the UI thread
     says it), "no render rebuilds six lists of twelve rows" (a swipe
     never mounts a list says it), and "the active tab widens for its
     symbol" in Use cases, which is Anatomy's second paragraph.
   · Three of the five examples of peer lists. Five was a catalogue;
     two make the point.

   AND TEN COLONS AND SIX SEMICOLONS WENT WITH THEM, to zero. That was
   the joint this text used to bolt a second clause onto a finished
   sentence, ten times in eleven paragraphs, and it is the rhythm tell
   `emil-unslop-writing` weighs heaviest. Where one was doing work
   there is a period now. The two long enumerations in Use cases were
   semicolon lists, and one of them is gone and the other is two
   sentences.

   NO DASH, NEITHER EM DASH NOR EN DASH, IN THE PUBLIC TEXT. The user's
   request, 2026-09-08: "don't use –". The concision pass had put in
   two, both in Performance, and both came out without losing anything:
   "React does not render during a gesture or a tap — the JavaScript
   thread…" was split into two sentences, which is plainer and
   shorter; and "stood still — a whole frame lost" moves to a colon,
   which is the mark that already does that job in the other eleven
   paragraphs. Hyphens inside a compound word stay: ease-out, ease-in,
   six-page, top-level. The rule holds for the public text, not for
   these comments, which were written in Spanish, where the dash is
   ordinary punctuation. It is in AGENTS.md › How the line and the notes
   are written. */
export default function Notes() {
  return (
    <>
      <Section title="Anatomy">
        <p>
          React Native, with Expo. The content is a paged scroll view, one page per tab, with a row
          of labels and an underline above it. The underline follows a drag and its deceleration,
          and a tap moves both on one timing.
        </p>
        <p>
          A tap makes a tab active in 300&nbsp;ms. It widens for its symbol, the other labels move
          aside, and the content crosses one page however far the tab is. The row moves on its own
          only when the active tab does not fit.
        </p>
        <p>
          Only transform, opacity and the label color animate. The one animated width is the
          underline, absolutely positioned with no children, so no other layout runs. A drag
          interrupts a tap at any point, and the curve is an ease-out, never an ease-in.
        </p>
        <p>
          A light haptic fires in the frame the tab changes, once per change, never as the only
          feedback. Reduced motion is respected.
        </p>
      </Section>

      <Section title="Performance">
        <p>
          Everything that moves is computed on the UI thread. The content is a native scroll view,
          so the system runs the drag and its deceleration. React does not render during a gesture
          or a tap.
        </p>
        <p>
          No layout runs for the tabs while the content moves. The row is not a flex row, and every
          tab’s position and width in each resting state are computed once, after the labels are
          measured. Each frame interpolates between two of them with a transform.
        </p>
        <p>
          All six pages are mounted and memoized, so a swipe never mounts a list. Unmemoized, the
          first frame after a tap stood still, a whole frame lost.
        </p>
        <p>
          The row reads one derived value, so the underline, the labels and the symbols move as one
          object. Measured on the phone at 60&nbsp;fps through every gesture, and a trace of
          492&nbsp;frames across a six-page sweep shows no flicker.
        </p>
      </Section>

      <Section title="Use cases">
        <p>
          Swipeable tabs fit one screen whose content splits into closely related lists that do not
          affect each other. Use them when there are more lists than a segmented control should
          hold, and people switch often enough that a swipe has to work as well as a tap.
        </p>
        <p>
          The same shape fits any section that holds several peer lists. A profile with posts,
          replies and media, or a catalog by category.
        </p>
        <p>
          A hierarchy needs a back button, not a row of tabs. About five lists or fewer belong in a
          segmented control, and the top-level sections of an app belong in the tab bar at the
          bottom. Both ask for short labels, and so do these.
        </p>
      </Section>
    </>
  )
}
