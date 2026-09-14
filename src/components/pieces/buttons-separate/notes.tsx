import { Section } from '../../../notes'

/* The notes of Buttons separate. Everything here is in the registry:
   `LOG.md` (§ The pieces), the header of `buttons-separate.tsx`
   (in this folder) and the table in
   `.context/buttons-separate/MEDICION.md` with the scripts that
   reproduce it. If a sentence stops being true it gets fixed here AND
   there: the public text is not a free summary, it is the same evidence
   told for someone arriving from outside.

   THE PROCEDURE IS THE ONE IN AGENTS.md › How the line and the notes
   are written, the one Swipeable tabs settled. What follows are the
   receipts of THIS page, one per decision.

   NO DESCRIPTION LINE. It is the first rule: the title already says
   what the gesture is. A line underneath would only repeat it.

   THE TONE, read as served on 2026-09-09 and not from memory. From one
   measured page comes the way of opening: the first word of the
   paragraph is the subject of the fact, and a sequence is written with
   "then", in order, in a single sentence ("Automatically sizes to fit
   the trigger content, then animates to the menu dimensions"). From the
   other comes the prose that goes from what you feel to the mechanism
   without turning into a changelog ("It updates at 60fps through direct
   DOM manipulation, not React re-renders").

   PERSON. Zero "I" and zero "we", like the two reference pages. "You"
   is whoever moves the pointer. And zero contractions on the whole
   page: the fault `better-writing` found in Swipeable tabs was exactly
   one loose contraction in eleven paragraphs.

   With no first person, the voice comes out of the sentence that
   corrects: "They do not fade in", "The first button never moves",
   "React sees none of it", "Hover cannot be the only way in". It is the
   same one Hold to commit uses ("the fill is the progress, not a bar
   beside it").

   ONE SINGLE NAME PER THING, on the whole page and not per section:
   "the field" for the field (never "bar", "input" or "search box"),
   "the buttons" for the four (never "circles" or "pills"), "one shape"
   for the closed state, "the spacing" for what opens, "the glass" for
   the material and "the pointer" for the pointer. "The group" is the
   set of the five, and it is used the same in Anatomy and in Use cases.

   ANATOMY HAS TO ACCOUNT FOR EVERYTHING THE PIECE DOES. Before it
   talked ONLY about the separation ("the field, the magnifier and the
   background are there so the separation has somewhere to happen") and
   with that rule things you see at first glance were left out: the
   highlight of the hover, the sink of the press, that focus in the
   field keeps it open, and that the background follows the theme. Not
   one of them is an implementation detail; all four get looked at. The
   new rule is the one from Vito's request of 2026-09-10: what you see,
   you say. What is only read in the code stays out (§ WHAT WAS CUT).

   OF THE GLYPHS, THE SENTENCE THAT CARRIES THE WEIGHT IS "They do not
   fade in": the reader has already seen a hundred things show up with
   opacity and that reading has to be taken off them before being told
   which one it is. Their numbers do NOT go in the text, they are in the
   piece, above ICON: what you see is that the glyph sharpens, not how
   many milliseconds it takes.

   THE SHAPE: Anatomy in THREE paragraphs and one per subject (the
   gesture and what you can do, the opening that IS measured against the
   recording, and the close that is not), Performance in two and Use
   cases in two. The cut between the second and the third is the one
   that matters: the recording ends where the opening ends, and a reader
   has the right to know what part of this came out of measuring and
   what part was decided here. Shortening is CUTTING FACTS, not
   squeezing sentences, and the numbers are not touched: a shorter text
   that also rounds is a less true text.

   WHAT WAS CUT, so that it does not come back in without deciding it:
     · THE KEYBOARD PATH is not in Anatomy: the rule lives in Use cases
       ("keyboard focus has to open them too") and saying it twice was
       saying it once too many.
     · Of the glass, the second half, the threshold and the strip: that
       is how the mask is made, not something you see.
     · THAT THE OPACITY AND THE BLUR ARE TWO SPRINGS. You see one single
       fact, the glyph sharpens, and the two segments are above ICON.
     · THE VEIL OF THE GLASS, which does NOT follow the theme even
       though the background does: it is measured against the native
       material and it stays fixed. The why is in the sheet of the
       piece, and it is a decision about the material, not something the
       reader can watch happen.
     · THAT IN THE LIST THE FIELD IS NOT TYPED INTO AND THE BUTTONS ARE
       NOT TOUCHED. That is the card of the site, not the piece.

   ONE SINGLE MID-SENTENCE COLON ON THE WHOLE PAGE. There were five,
   four of them as a connector, and five together are a watermark even
   if each one defends itself alone. The one that stays does work: it
   introduces the results of the frame measurement. The paragraphs added
   on 2026-09-10 brought none, on purpose.

   THE LENGTH OF THE SENTENCES GETS LOOKED AT, and it is not a fussy
   habit. A whole page of fifteen word sentences is one of the things
   that gives a generated text away the most, so the page goes from 3 to
   40: "Nothing is hidden" next to the paragraph of the measurement. The
   `emil-unslop-writing` pass of 2026-09-10 fixed three things of form:

     · THREE PILE-UPS OF SUBORDINATE CLAUSES, one per new paragraph. The
       worst one opened Anatomy with 34 words and three clauses hanging
       off two "and" and a semicolon. They were split into short
       sentences, which also follow the order of the interaction: "Move
       the pointer over this area." and only then what happens.
     · "The background under all of it is mixed from…" was passive with
       the actor hidden, and "all of it" a loose synonym for something
       that already has a name. Now it is "The background of this area
       mixes…".
     · "come out of the end it leaves behind" asked you to rebuild a
       geometry to understand a sentence. They come out of the field,
       and that is what it says.

   What was NOT touched, even though a quick read flags it: the 40 word
   sentence in Performance (it carries the whole measurement and its
   colon does work), the 27 word one in Use cases, and the "same glass,
   same place, same size", which is a real three and not rhythmic
   filler: they are three different facts and each one can be denied on
   its own.

   CONCISION PASS, 2026-09-14 ("much more concise and shorter"). 522 →
   400 words, 23 % less, the same seven paragraphs.

   WHAT FORCED THE SHAPE was not the word count. Counted that day,
   Anatomy's first paragraph had NINE sentences and the second seven,
   against the two to four AGENTS.md asks for, and no gate reads that.
   Every paragraph is one to four now, and the cut had to go through
   facts to get there, which is what § THE SHAPE says shortening means
   here.

   Deleted whole:
     · The closing that named the reference (see § NO GUIDELINE IS
       NAMED for what it cost).
     · "The background of this area mixes the page's own canvas and
       ink, so the piece follows the theme." It is one of the four that
       came IN on 2026-09-10 under "what you see, you say", and it is
       the one of the four you can see without touching anything, so it
       is also the one the recording already shows. It goes back the
       day the section grows.
     · "Take the pointer away and they go back in", which the third
       paragraph is entirely about.
     · "The field takes text and does nothing with it". Half a fact and
       half an apology; what mattered was the focus, and that stayed.
     · "It shortens from the group's full width to its own, and the
       four buttons fan out from where the first one sits", which the
       first paragraph had already said in plainer words.
     · "It drops the delays and the overshoot, and the icons are sharp
       from the first frame", the detail of reduced motion. The
       sentence before it carries the claim that matters, that the
       separation stays.
     · "That leaves one pixel between neighbors", a number nobody can
       act on.
   And the glass of Performance went from two sentences to one, which
   is squeezing and not cutting, and the only place it was done.

   THE NUMBERS WERE NOT TOUCHED, and neither was the one colon.
   365, 532, 42, 38, 44, 544 and 1 in 55 read exactly as they did. What
   they gained is the non-breaking space between number and unit, the
   better-typography rule that Swipeable tabs had written down since
   2026-09-07 and no file in this repo applied until that day. Verified
   in the build: `365\xA0ms`, not the six letters of the entity.

   "THIS AREA" for the rectangle the piece lives in. It is the name
   Swipeable tabs already uses ("panes of content in one area"). It is
   not "card": the piece runs in two different boxes and "card" is
   vocabulary of the site, not of the piece.

   THE NUMBERS, checked against the code and against the measurement:
     · 365 ms and 532 ms are the durations of the two springs in Apple's
       parametrization (ω = 2π/duration), fitted by least squares over
       the recording with 1.57 and 1.42 pt of error in 64 frames. They
       are in `FIELD` and `FAN`.

       THIS USED TO SAY "The field settles in 365 ms" AND IT WAS FALSE.
       `duration` sets the frequency, not the moment the thing goes
       still: integrating the spring of the piece, the field gets to 90%
       of its travel at 138 ms, goes 7.6% past at 229 and only drops
       below half a pixel at 537. The fan, 217 / 625. The text says
       "365 ms for the field" now, which is what the number is.
     · 42 ms is the delay between the two, measured. It is in `DELAY`.
     · 38 and 44 px are the drawn button and its touch area, with 1 px
       clear of the neighbor's (`.button` and its ::before). The text
       does NOT promise 44 px on screen: below 544 px of width the group
       shrinks as a block and the area shrinks with it. At 372 px of
       scene the scale is 0.623 and 27.4 px are left, which passes the
       minimum of WCAG 2.5.8 (24) and does not reach Apple's 44. That is
       why the last sentence of Use cases exists: without it the 44
       would read as a guarantee.
     · 544 px is the width of THE SCENE, not the one of the window: the
       scale is min(1, (width - 2·44) / 456) and with 456 + 88 it gives
       exactly 1.
     · 20 px is the travel of the pointer that opens the bar, and it
       does not come out of the recording: Vito chose it on 2026-09-09
       over a picker of three triggers. That is why the text does NOT
       say it is what the reference does. The recording does not show
       what fires it.
     · Of the blur of the glyphs no number goes into the text. The two
       segments, 290 and 350 the blur, 270 and 260 the opacity, are
       above ICON. That they are two springs is implementation, and the
       reader sees one single fact: that the glyph sharpens instead of
       fading in.
     · The frames, measured again on 2026-09-10 in a real Chrome, with
       GPU, and over FIVE runs: at 20× and with eight copies mounted,
       scrolling drops none, and with one opening and the other seven at
       rest 1 in 55 is dropped in the worst case (0 in three of the
       five). The text says "at most", which is the only honest thing
       with a figure that varies between runs, and that is why there are
       five and not one. DO NOT GO BACK to 1 in 59 and 2 in 54: it was
       the same measurement from a single run, and it exaggerated the
       cost. And DO NOT PUBLISH the synthetic worst case, the eight
       copies animating at once, which falls to 30 frames. It cannot
       happen, there is a single pointer. At 4× none are dropped.

   CLOSING IS NOT THE OPENING REVERSED, and now the text says so, third
   paragraph, because you see it and because the second paragraph
   asserts that the opening is measured against the recording. Without
   that note, the assertion spilled over the close, which the recording
   does NOT show. The three fixes, with their why, are above FIELD_CLOSE
   in the piece. Measured with the piece running (`sonda/salida.cjs`):
   the fan starts on the first frame and the field only at 49 ms, the
   delay changed sides, the field comes back to 456 without going past
   it once, and the glyphs are at 0.02 of opacity at 115 ms.

   DO NOT SAY "the icons are gone before the shapes touch". The shapes
   touch again at 49 ms and there the glyphs are still worth 0.25. What
   is true is the other thing: they leave BEFORE everything else, and
   that is why four of them do not end up stacked over the field, which
   is what happened with the segment of 300 ms (0.28 at 120). The
   comment of the piece asserted the first thing; it was corrected on
   2026-09-10 with the probe.

   WHAT IS NOT ASSERTED. It does not say how long everything takes to
   settle: the group goes still around 730 ms, but that number comes
   from looking at where the trace stops moving and not from a defined
   threshold, so it does not go into the text. It does not say either
   that the piece follows the recording with such and such an error: the
   comparison gave 3.5 px of root mean square error and 13.4 px of
   maximum over the first second, and a single one of those numbers read
   alone lies in one direction or the other. What is asserted is that it
   was measured against it.

   ONE PROBE PER SENTENCE: `.context/buttons-separate/sonda/texto.cjs`.
   Every `ok` in that file is an assertion of this page and it fails if
   the piece stops holding it. It exists because until 2026-09-10 these
   notes were written against the code as READ, and reading is not
   measuring: the first run found two sentences that did not hold up.

     · "A search field, and beside it a single shape of glass" described
       TWO shapes and at rest there is ONE. The four circles are in the
       same slot (cx 302, measured) and that slot falls inside the
       field, which measures 456: what you see is a single pill, and the
       buttons come out from inside when the field shortens to 276. The
       text says "one long search field of glass" now, and "come out of
       the end it leaves behind", which is what happens.
     · "The field settles in 365 ms" (see THE NUMBERS).

   And the ones that do hold up were left with their measurement beside
   them: the first button does not move (302 → 302), the step is even
   (45.0), the press shrinks the circle of the glass from 19 to 18.24
   and gives it back, focus in the field holds the bar open with the
   pointer outside, the background mixes with the tokens of the page in
   both themes (#111111 over #fdfdfc in light, #fafaf9 over #090908 in
   dark), with reduced motion there is not a single frame with blur (0
   of 32) and the separation does NOT turn off, and with no hover the
   bar starts open.

   NO GUIDELINE IS NAMED. The concepts of the material, a layer of
   controls that floats over the content and lets it through blurred,
   come from Apple's interface guidelines, read on 2026-09-09 through
   their documentation API
   (developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json).
   They come in as explanation and said plainly as ours, which is the
   rule of AGENTS.md. THE REFERENCE IS NOT NAMED EITHER, as of
   2026-09-14, which used to be another thing: the closing of Anatomy
   said which app it was and how it was measured. This was the last of
   the four pages doing it.

   THAT SENTENCE WAS DOING A SECOND JOB, and cutting it broke the page
   for a few minutes. It was the only place that said a recording
   exists, and the third paragraph opens with "the recording does not
   show it": deleted on its own, that "the" pointed at nothing. The
   provenance moved to where it belongs anyway, beside the numbers it
   produced ("fitted frame by frame to a recording at 60 fps"), so the
   springs now carry their own source and the third paragraph has its
   antecedent. The attribution is the `Source` field of the clip in
   the vault.

   NO DASH in the public text, neither em dash nor en dash. Compound
   word hyphens stay. The rule is for the public text; in these
   comments, written in Spanish, the dash was ordinary punctuation. */
export default function Notes() {
  return (
    <>
      <Section title="Anatomy">
        <p>
          At rest this is one long search field of glass. Move the pointer over this area and the
          field shortens, and four round buttons come out of it. Twenty pixels of travel are enough,
          so the pointer never has to reach them. Hover tints one button’s glass, a press sinks it,
          and focus in the field holds the group open.
        </p>
        <p>
          The field carries the opening. The first button never moves, and what opens is the
          spacing. Two springs run it, fitted frame by frame to a recording at 60&nbsp;fps,
          365&nbsp;ms for the field and 532 for the spacing, which starts 42&nbsp;ms later. While
          the shapes are still close the glass joins them with a neck that thins and snaps, and the
          icons arrive last and out of focus, without fading in.
        </p>
        <p>
          Closing is not the opening reversed, and the recording does not show it. It runs a quarter
          shorter, and the field returns without the overshoot it takes on the way out. The order
          flips, so the buttons meet before the field covers them, and the icons leave fastest, so
          four of them never end up stacked over the field. With reduced motion the separation
          stays, because the separation is the piece.
        </p>
      </Section>

      <Section title="Performance">
        <p>
          Nothing re-renders while it moves. The springs write the shapes and their opacity straight
          into the document, and React sees none of it. At rest there is no frame loop, so a page of
          these costs nothing until a pointer arrives. The glass is not a live blur but a second
          copy of the backdrop, blurred once, with a mask cutting it to shape each frame.
        </p>
        <p>
          Measured in Chrome with the processor slowed twenty times and eight copies of the piece on
          the page, over five runs: scrolling drops no frames, and one copy opening while the other
          seven rest drops at most 1 in 55.
        </p>
      </Section>

      <Section title="Use cases">
        <p>
          A group of controls can rest as one shape and open when the pointer arrives. Nothing is
          hidden. What opens is the same glass, in the same place, at the same size.
        </p>
        <p>
          Hover cannot be the only way in. A pointer that cannot hover never gets the opening, so the
          buttons have to be out from the start, and keyboard focus has to open them too. Each button
          is 38&nbsp;pixels wide and its hit area is 44, and below 544&nbsp;pixels of width the whole
          group scales down, hit areas with it.
        </p>
      </Section>
    </>
  )
}
