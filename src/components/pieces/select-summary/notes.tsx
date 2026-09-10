import { Section } from '../../../notes'

/* The notes of Selection summary. Everything here is in the record:
   the comments in `select-summary.tsx`, in this folder, and the
   measurements in `.context/select-summary/`. If a sentence stops
   being true, it gets fixed here AND there: the public text is not a
   free summary, it is the same evidence told for someone arriving from
   outside.

   THE PROCEDURE IS THE ONE IN AGENTS.md › How the line and the notes
   are written, the one Swipe between tabs settled. What follows are the
   receipts of THIS page, one per decision.

   NO LINE, like the other three. It had one for a day ("The button
   shows who you selected: a name for one person, a count for more")
   and it was deleted on 2026-09-10: the title already says what it is,
   which is the first rule of AGENTS.md › How a piece is named.

   THE TONE, measured on the served pages on 2026-09-10, not from
   memory. Three pages, read with the browser and counted:

     joshpuckett.me/bloom      5 paragraphs · median 12 words · 2
                               sentences · 7.9 words per sentence
     joshpuckett.me/pasito     7 paragraphs · median 17 · 2 · 10.0
     benji.org/liveline       32 paragraphs · median 24 · 2 · 9.7

   So: paragraphs of two sentences, sentences of eight to ten words.
   This page was written against those numbers and not against an
   impression. From benji comes the prose that goes from what you feel
   to the mechanism; from josh, opening the paragraph on the subject of
   the fact and never on an announcement of what follows.

   PERSON. Zero "I" and zero "we": josh uses neither on the two pages
   measured. "You" is whoever works the control.

   ONE NAME PER THING, across the whole page and not per section, which
   is the failure `better-writing` finds most here. The decisions: "the
   button" for the trigger (never "trigger" and never "pill"), "the
   panel" for what opens (never "menu" and never "dropdown", even
   though its ARIA role is menu), "the cluster" for the cluster of
   photos, "a row" for each row, "the label" ONLY for the button's
   text, and "select" as the only verb.

   And "photo", never "face". The text said "faces" and it was false in
   one of the four: Elon Musk's avatar is a Starship launch.

   ANATOMY TALKS ABOUT THE SUMMARY ONLY, which is what the piece is
   named after: the cluster and the button's label. How you select (the
   rows, the checkboxes, the hover) is the mechanism around it and does
   not go in, which is the same thing that was decided with the tabs
   and with the button.

   AND IT DOES NOT CLOSE WITH THE REFERENCE, unlike the other two (the
   user's request, 2026-09-10: "take out the reference part"). It is a
   difference with AGENTS.md › How the line and the notes are written,
   which asks for it in the closing together with how it was measured,
   and what it costs has to be said: the attribution leaves the page.
   It is still in two places, the vault's details
   (x.com/abjt14/status/2097316524436627688) and the header of
   `select-summary.tsx`, so it is not lost, but it stops being read.

   THE VOICE. For the first time the text has an opinion and an
   admission: "deciding what not to move took longer than building what
   does" and "a control you use all day should sit still". It is the
   half of `emil-unslop-writing` that had not been applied until here
   ("voiceless but correct is exactly what a model on its best behavior
   produces"), and it comes in on an explicit request ("much more
   human"). It still has no "I" and no "we", which is the decision Hold
   to buy settled.

   AND THE FIRST OF THE TWO IS TRUE, which is what makes it sayable:
   the animated width (370 ms fitted over 18 samples), the label's fade
   token by token, the press scale tuned in pixels and the list's
   script were all four built, all four measured, and all four taken
   out afterwards.

   WHAT GETS MENTIONED FROM THE SKILLS, AND WHAT DOES NOT. Only what a
   reader can SEE goes in, with its receipt. `animate-expo` does not
   apply: it is React Native's and this runs in the browser.
     · `better-ui` and `emil-surfaces` › image outlines: every photo
       carries a 1 px line at 10 %, pure black in light and pure white
       in dark, never a tinted neutral (`--piece-outline`, and the
       circle in `Chip`). It is the literal rule in both, and the value
       is not chosen: it is looked at over the photo with the white
       background, which is the one that needs it.
     · `emil-surfaces` › depth without borders: the trigger and the
       panel carry no `border` but a ring, `inset 0 0 0 1px`. Besides
       compositing over whatever is underneath, it takes the only term
       that was in pixels out of the width's sum.
     · `better-ui` › shadows for elevation, borders for structure: zero
       shadows. The two lines there are separate things (the panel from
       the card, the photo from the surface) and neither one fakes
       depth.
     · `better-ui` › interruptible animations: everything is a CSS
       `transition` and there is not one keyframe, so touching two rows
       one after the other restarts nothing.
     · `better-ui` › skip animation on page load: the cluster does not
       animate on the first paint (`Cluster`, the `mounted` state with
       its rAF).
     · `better-ui` › transition only what changes: the five transitions
       name their property; measured, none of them is `all`.
     · `interface-craft` › the critique lens, in "do outlines add
       structure or noise?" and in color: after taking the violet out,
       the only colors in the piece are the four photos.

   WHAT THE PIECE BREAKS ON PURPOSE, and that is why it is NOT in the
   text:
     · `better-ui` asks for `scale(0.96)` on press. Here the button
       does not move, a decision of 2026-09-10 backed by DESIGN.md ›
       The press, and the feedback is fill.
     · The outline's alpha is 5.1 % and the skill asks for 10 %. The
       system's `--hairline` wins, which is the one the other lines of
       the piece use.
     · The chips travel for 370 ms, above the 150 the skill reserves
       for high-frequency things. It is the summary, which is the
       piece.

   USE CASES WITHOUT CITING ANYONE. The concepts come from Apple's
   interface guidelines, read on 2026-09-10 through their documentation
   API (developer.apple.com/tutorials/data/design/human-interface-
   guidelines/<slug>.json; the HTML page is assembled with JavaScript
   and returns the title only). They come in as explanation and are
   said plainly as our own, never as authority and without naming them,
   which is the rule in AGENTS.md:
     · "After people choose an item from a pop-up button's menu, the
       menu closes, and the button can update its content to indicate
       the current selection" and "Use a pop-up button to present a
       flat list of mutually exclusive options [...] Use a [pull-down
       button] instead if you need to [...] Let people select multiple
       items" (pop-up-buttons.json) → the first paragraph.
     · "If you want to avoid listing a separate menu item for each
       state, it can be efficient to create a single, toggled menu item
       that communicates the current state and lets people change it"
       and "people might not know whether the changeable labels HDR On
       and HDR Off describe actions or states" (menus.json) → the
       second.

   THE NUMBERS, checked on the page on 2026-09-10: the button measures
   a single width across the seven states and none of them clips; the
   layout does not move in any state, not on opening, not on closing;
   421 frames over 7 s of the home card give 0.00 px; the chip coming
   in grows in 90 ms; the checkbox crosses in 150; the script's step is
   1500 ms.

   NO DASH in the public text, neither em dash nor en dash: where one
   showed up, there are two sentences or there is a colon. Hyphens
   inside a compound word stay. The rule is for the public text; in
   these comments, written in Spanish, the dash is ordinary
   punctuation.

   MUCH SHORTER (2026-09-10, "make it way more concise, 2 paragraphs
   and 4 lines at most"). From 293 words to 150, and the three sections
   came out the same length: two paragraphs and four rendered lines
   each, counted on the page and not by eye. What went are the facts
   the reader sees on their own (the cluster of one, of two, of three
   and of four; the outline of the photos; the panel with no shadow),
   and what stayed is what has to be told to them.

   WHAT THE TEXT SAYS ABOUT NOT ANIMATING comes from the animations.dev
   course (`animate`) and from `emil-animations`, and they are its two
   tests, said plainly and as our own:

   · THE PURPOSE. "Every animation needs one of: explanation, feedback,
     spatial consistency, state indication, preventing a jarring
     change, or delight. "It looks cool" on a frequently-seen element
     is not a purpose", and "you can answer "why does this animate?" in
     one sentence". That is where "it is the only thing that answers a
     question" comes from: the cluster answers who is inside the
     summary, and the other three candidates answered nothing.
   · THE FREQUENCY. Its table is explicit: 100+ times a day, "no
     animation, ever"; dozens of times a day, "remove or drastically
     reduce". A filter gets touched all day, and that is where "a
     control you use all day should sit still" comes from.

   And the sentence that governs both: "If everything animates, nothing
   stands out. Motion is a spice, not the meal". The whole course is
   behind the piece having ONE animation and not four.

   MORE TECHNICAL, AND THE WAY HE TELLS IT (the user's request,
   2026-09-10). His shape is to name the property and the number in the
   same sentence as the reason, not to talk about feelings: "only
   animate transform and opacity", "start entrances from
   scale(0.9-0.95)", "press feedback is felt, not seen". So the text
   says the KIND of ease and the milliseconds (370 ms on a strong
   ease-out that starts fast and settles slowly), says the mechanism (a
   transition and not a keyframe, and that is why two taps in a row
   retarget instead of restarting) and says what the press does instead
   of scaling.

   WITHOUT THE LITERAL CURVE (the user's request, 2026-09-10: "take out
   the literal cubic bezier, mention what kind of ease it is"). Four
   numbers in the middle of a sentence are a datum the reader cannot
   judge, and naming the kind also says what it feels like, which is
   the course's shape: "fast start, gentle settle, feels responsive".
   The four numbers are still in the piece, above the value, which is
   where somebody is going to need them.

   THE CURVE IS ONE OF HIS, and by accident: the best fit of 14 curves
   × 39 durations over 18 samples of the reference gave
   cubic-bezier(.19, 1, .22, 1), which is exactly the --ease-out-expo
   of his catalogue, "strong ease-out". It came out of measuring a
   video, not out of copying his list.

   WHAT DOES NOT GO INTO THE TEXT EVEN THOUGH IT IS TECHNICAL: that the
   chip coming in is born at scale 0, which is what he forbids. The
   exception has a number (at 11.8 px, starting at 0.95 is 0.6 px of
   travel) but explaining it asks for a third sentence and the section
   has four lines. It stays here, where it already was.

   What the piece does NOT animate is backed by that same skill:
     · the press feedback, which does not scale: "Not every button
       needs it; skip it on high-frequency controls".
     · the first paint, which does not animate: "Don't animate initial
       page load state".
     · the list's script, which went away entirely (2026-09-10): a Web
       piece that plays a sequence reads like a video, and what it has
       to do is answer the pointer.
   What the piece breaks of that skill stays here and not in the text:
   the chip coming in is born at scale 0 ("Never enter from scale(0)")
   because at 11.8 px starting at 0.95 is 0.6 px of travel, and the
   cluster travels for 370 ms, above the 300 it asks for, because it is
   the measured curve of the reference.

   THE `emil-unslop-writing` PASS, measured on the served page: zero
   words from the ones the skill lists, zero dashes, zero curly quotes
   and no passive without an actor. What it did find were COLONS: four
   in 26 sentences, three of them joining a phrase that stood on its
   own. One was left, the one in the description line, which does open
   an enumeration. After the cut there are 13 sentences left, mean 11.5
   words and deviation 3.9. A "lives in" that was a metaphor also went,
   and a "carries" that was "has", a "without being opened" that hid
   the actor and a "land in the same place" that said nothing.

   AND WHAT THE SKILL ASKS FOR AND THIS PAGE DOES NOT DO: have a
   reaction and write in the first person. It does not go in because
   the tone is measured and josh uses neither of the two on the two
   pages counted. The variation of rhythm, which is the other half of
   that request, is there: sentences from 3 to 20 words, mean 11.5 and
   deviation 4.5. */
export default function Notes() {
  return (
    <>
      <Section title="Anatomy">
        <p>
          Select someone and the cluster rearranges. Each photo scales from its top left corner over
          370ms, on a strong ease-out that starts fast and settles slowly.
        </p>
        <p>
          It is the only animation here, because it is the only one that answers a question. The
          label swaps in a frame, the width holds, and the press paints instead of scaling.
        </p>
      </Section>

      <Section title="Performance">
        <p>
          Transform and opacity only, plus the color of a row. Each one is a CSS transition and not a
          keyframe, so two fast selections retarget instead of restarting.
        </p>
        <p>
          In every state, nothing drifts by a pixel. A control you use all day should sit still.
        </p>
      </Section>

      <Section title="Use cases">
        <p>
          A summary in the button fits a filter that holds several things at once. It answers what is
          on before you open it.
        </p>
        <p>
          The last row is a checkbox and not a command, because it reports a state. Selecting nobody
          and selecting everybody are the same state, and neither one filters.
        </p>
      </Section>
    </>
  )
}
