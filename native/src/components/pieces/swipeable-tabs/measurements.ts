/* ═══════════════════════════════════════════════════════════════
   THE PIECE'S VALUES, WITH THEIR RECEIPTS.

   All of them come from measuring the reference clip (`Swipeable
   tabs.mov`, X on iOS) by reading raw pixels: ffmpeg writes rgb24 and
   Node counts. The clip is 1320 px wide = 440 pt × 3, so **every
   measurement in pixels is divided by 3** to give points. The whole
   spreadsheet is in `.context/recon/swipeable-tabs/MEDICIONES.md`,
   which does not travel between worktrees, and that is why each
   number's receipt is also here.

   Two grades, as in the web repo:
   · RUNTIME: read off the clip's pixels.
   · DERIVED: arithmetic on top of a RUNTIME, with the arithmetic
     written out.

   A value without a receipt is a value someone will change without
   knowing what it breaks. If you add one, add where it came from too.
   ═══════════════════════════════════════════════════════════════ */

export const COLOR = {
  /* RUNTIME · the clip's background is pure black. */
  background: '#000000',

  /* RUNTIME · luminance mode of the active label: 255 over 492 px.
     Pure white, not an off-white. */
  active: '#FFFFFF',

  /* RUNTIME · mode of the inactive label: 142. And it is not an average
     of different things. "Following", "Stocks", "Tech" and "AI" gave
     141, 142, 142 and 142 separately. */
  inactive: '#8E8E8E',

  /* RUNTIME · the underline is pure white, same as the active label. */
  underline: '#FFFFFF',

  /* RUNTIME · the divider under the bar: 47,47,47 over black. */
  divider: '#2F2F2F',

  /* RUNTIME · the active tab's chevron is NOT white: 140 of luminance
     against 255 for the label right next to it. That is hierarchy
     inside the active tab itself, and it is one of the things you
     notice most if it gets copied wrong. */
  chevron: '#8C8C8C',

  /* RUNTIME · the icons the topic tabs carry are white: mode 255 both
     in the Stocks one and in the Tech one. So the chevron and the icon,
     which look like the same class of thing, are painted differently on
     purpose. */
  icon: '#FFFFFF',

  /* RUNTIME · the `+` gives a mode of 105 (129 px), dimmer than an
     inactive label. It may be that in the reference it is a normal gray
     and the edge mask is what dims it; here it is drawn ON TOP of the
     mask, so for the result to come out the same as the clip the value
     has to be the measured one and not the "true" one. */
  plus: '#696969',
} as const

export type Palette = Record<keyof typeof COLOR, string>

/* ═══ THE LIGHT PALETTE: measured in the light recording of 2026-09-02 ═══

   Until that day there was not a single light frame and the palette was
   put together with x.com's public tokens (#0F1419 / #536471 / #EFF3F4)
   plus the relations measured in dark. The collapse recording came in
   light mode, and it was sampled with the SAME method as the dark one:
   mode of the pixels in the core of the ink, raw value off the video,
   no range correction (1320×2868, frame 0 at rest).

     background  #FFFFFF  255 across the whole surface
     active      #000000  mode of 361 px in "For you". It is NOT the
                          web's #0F1419: the mode is neutral, and a
                          blueish one would land at ~#00050A even
                          crushed
     inactive    #5C5C5C  mode in Following and in Stocks, identical
     underline   #000000  = active, as in dark (255 = 255)
     divider     #C9CBCB  the whole row 450, 957 px of the same value,
                          quite a bit darker than the web's #EFF3F4
     chevron     #5C5C5C  its core gives #5E..#5F: the inactive class,
                          as in dark (140 ≈ 142)
     icon        #000000  = active; there is no active topic icon in
                          the frame, so the relation is inherited from
                          dark
     plus        #4B5761  mode; the only blueish thing in the bar

   The video is H.264: pure blacks and whites can arrive crushed and a
   1 px line comes out somewhat lighter than it is. It is the same bias
   the dark palette has, and it is accepted the same way. */
export const LIGHT: Palette = {
  background: '#FFFFFF',
  active: '#000000',
  inactive: '#5C5C5C',
  underline: '#000000',
  divider: '#C9CBCB',
  chevron: '#5C5C5C',
  icon: '#000000',
  plus: '#4B5761',
}

export const TAB_BAR = {
  /* DERIVED · the center of the text sits 67 px (22.3 pt) from the
     divider (RUNTIME). With the label centered in the bar, that gives
     44.6 pt of height; 44 puts the divider where the clip has it. */
  height: 44,

  /* RUNTIME · the left edge of the first tab's underline falls at
     x=36 px = 12 pt. That is the row's inset. */
  inset: 12,

  /* DERIVED · from the edge of the underline to the label's ink there
     are 40 px on the left and 33 on the right (RUNTIME). The asymmetry
     is the side bearings of the `F` and of the chevron, not an
     asymmetric padding: 12 pt on each side leaves the ink where the
     clip has it. */
  padding: 12,

  /* SEPARATION BETWEEN BOXES, and it exists for a typographic reason.

     With the boxes touching, tab 0's underline comes out exact but the
     labels drift left: Chirp and SF Pro do not split the width between
     ink and side bearings the same way, and the difference piles up tab
     by tab. This constant compensates for it on average.

     THIS VALUE WENT ALL THE WAY AROUND AND CAME BACK, and the old
     receipt has to be told so nobody restores it: the original 1.8 came
     from comparing ink gaps against the vault clip (26.3 ours vs 28.1
     for X, the average of four gaps). But one of those four, the
     chevron→Following one, is an ACTIVE→inactive gap, and that 28.1 had
     X's LEAN inside it (`lean`, +4.7 in that gap = +1.2 on average),
     which had not been discovered at the time. The fit compensated for
     typography AND for a layout rule that was later implemented
     separately, so the correction ended up applied twice.

     RUNTIME · re-derived with the six rest states of the new recordings
     (2026-09-01), correcting for the lean before comparing:

       X's base gaps (without lean)   24.7  27.0  26.0  29.4  Σ 107.1
       ours with the boxes touching   25.8* 26.9  26.2  26.5  Σ 105.4
                                      (* the F sits differently than it
                                         does in Chirp)

     Our Σ with separation 0.6: ~107.5 ≈ X. With the old 1.8 the strip
     came out 5.7 pt longer than X's (limit 51.3 against a measured
     45.6), and in the far states the row scrolled that extra: it
     swallowed the tail of "you" that in X stays peeking out at
     17..28 pt. The residue per gap (±2, the 'A' in AI above all) comes
     from letter pairs and no constant corrects it.

     It is added here and not to the padding on purpose: raising the
     padding would also fatten the box, and the underline, which matches
     to the decimal, would stop matching. */
  separation: 0.6,

  /* THE INACTIVE WORD LEANS, MOVING AWAY FROM THE ACTIVE TAB. It is the
     rule that was missing and it explains three symptoms at once: that
     in X the "For you" label also shifts when it loses its chevron,
     that the word going dark travels a bit MORE than its slot, and that
     the tail of the strip shifts less than it did here when you enter a
     topic tab.

     RUNTIME · six words measured in the six rest states of X's new
     recordings (2026-09-01, the user's account, same 440 pt screen).
     Anchoring each word at its active-tab position, the inactive
     position moves away from the active one by an extra that the boxes
     do not explain:

       For you    −4.0 with Following active, −5.4 with far actives
       Following  +4.0 with For you active,   −5.4 toward the other side
       Stocks     +1.7 → −4.7 depending on the side (the boxes already
                  gave ±3)
       Tech       +4.4 / −5.0      AI  +4.4..6  (its 11.6 pt of ink is
                                       the noisiest reading)

     So: c(i, active) = 0 if i is the active one, −lean if the active
     one is to the right, +lean if it is to the left, and ONLY on the
     label (and on what travels with it: veil and symbol). The boxes and
     the underline are not touched, they already matched to the decimal.
     The value is the mean of the table (±1 pt of bearing noise between
     states). */
  lean: 4.7,

  /* WHEN THE ROW MOVES. Two rules, and both stay because each one has a
     receipt that contradicts the other:

     · 'center': WHAT X DOES, MEASURED: the row centers the active tab
       in the whole screen (440) and runs into the limit, interpolated
       with the content's progress, both tapping and dragging. Seven
       transitions in the user's recordings (2026-09-01) and all seven
       fall in that model; the table is above `targets` in tab-bar.tsx.
       Visible consequence: Stocks→Tech shifts the row 45.6 pt with the
       finger, "For you" leaves and "Design" comes in (v1, frames
       203-221, row = 44.5·t, linear with the content).

     · 'visible': WHAT THE USER ASKED FOR (2026-09-02): "it only
       changes once I go to a tab that is not visible in the viewport".
       The row stays where it was when the content started moving and
       shifts only as much as it takes for the active tab to fit whole
       (the `minimums`/`maximums` ranges, interpolated with the same
       progress). With six tabs that moves the strip on AI↔Design and
       Following↔For you, and on any tap to a covered tab; on
       Stocks↔Tech it does not move.

     ASKED FOR, NOT MEASURED: the user's own recording shows X doing the
     other thing, and that was said out loud. It is a conscious decision
     about the reference, and 'center' is one word away. */
  row: 'visible' as 'visible' | 'center',
} as const

export const ICON = {
  /* THE GLYPH AND ITS SLOT ARE TWO DIFFERENT THINGS, and confusing them
     was the mistake: the symbol is DRAWN at one size and OCCUPIES
     another. In the reference the icon overflows its slot (it paints
     16 pt of ink in a place that measures 11) and that is why the
     active tab does not fatten as much.

     It showed in the underline, which is the active tab's box measured
     directly. With `topic` at 20 acting as the slot, the three topic
     tabs came out ~5 pt wide:

                  reference   before    now
       Stocks        90.7      96.3    91.3
       Tech          77.7      82.3    77.3
       AI            58.7      64.0    59.0
       For you       92.7      92.7    92.7   (the chevron was already
                                               right)

     RUNTIME · the two readings that fix the topic slot, averaging three
     tabs of the clip: the icon's ink starts **9.2 pt** after the edge
     of the box, and between that ink and the word's there are
     **9.0 pt**. With slot 11 and gap 10 they give 9.5 and 8.8.

     RUNTIME · the chevron side was confirmed in TWO states of the clip,
     "For you" and "Following" active, and they gave the same two
     numbers to the tenth: **11.0 pt** between the end of the word and
     the chevron's ink, and **11.4 pt** from there to the edge of the
     box. With slot 8 and gap 10 they give 10.9 and 11.5.

     The chevron's `extra` does not change (8 + 10 = 18, the same as
     before), so the feeds' underline, which already matched to the
     decimal, stays where it was. */
  /* The topic's 21 comes from MEASURING the only non-chip topic icon
     the reference shows at rest: the Tech one paints 17.3 × 17.3 pt
     (frame 152 of the clip, threshold 60). Our `cpu` at 20 painted
     16.3, a point short; at 21 it paints ~17.1. The Stocks chip stays
     at its exact 16, which is also measured: X does not use a single
     size. */
  glyph: { chevron: 12, topic: 21 },
  slot: { chevron: 8, topic: 11 },
  gap: 10,

  /* THE SYMBOL DOES NOT APPEAR IN PLACE: IT COMES OUT FROM BEHIND THE
     WORD.

     RUNTIME · in the clip, with the row still, the "For you" chevron
     slides in: its ink starts at 72.1 pt and ends at 84.0. And the
     "Stocks" icon does the same thing from the other side: 197.7 →
     184.3 on screen, which in its box's coordinates is +13.0. Both
     travel **12 pt** (11.9 and 13.0), and both START some 2 pt behind
     the edge of the word:

       chevron  left ink   72.1  vs  end of the word    73.3
       icon     right ink 213.4  vs  start of the word 210.7

     So: the symbol is born covered by the word and moves away from it
     while it lights up. Hiding, it does the inverse, tucking itself
     back in and going dark. That is why it is NEVER seen on top of the
     text: by the time it has enough opacity to be read, it is already
     out.

     THE TRAVEL IS X'S, MEASURED TWICE. There was a DEEP CRADLE here
     (slide 4/7: the symbol was born with more than half of it tucked
     under the word and traveled 17 pt). It was a request from the
     morning of 2026-09-01, and that same afternoon three recordings of
     the real X account arrived with the verdict: "we do it differently,
     do it like they do". In those recordings the AI sparkles travels
     ~9-13 pt of screen, born flush with the edge of the word (bbox
     279→270.7 while the luma climbs 62→255, and the bbox at low opacity
     underestimates the glyph), which is the same 13.0/11.9 already
     measured in the vault clip. The deep cradle is written down in case
     it comes back: slide { left: 4, right: 7 }.

     The arithmetic, relative to the word (it holds in both
     transitions): gap(r) = rest_gap − (1−r)·(extra − slide). With 8 the
     icon is born ~1-2 pt covered by the word and travels 13 pt
     relative; with 6 the chevron travels the measured 12.0 (ink 72.1 →
     84.0).

     What really does the occluding is the label's background (see
     `clearance`): the covered symbol does not mix in among the letters,
     it disappears under a clean edge.

     AND THE OPACITY IS NOT LINEAR FOR THE ICON. It is r^1.5, measured
     frame by frame against the underline as a clock in the Stocks and
     Tech transitions of the clip (it opens and closes on the same
     curve):

       r        0.35   0.58   0.73   0.84   0.91
       measured 0.22   0.41   0.60   0.76   0.87
       r^1.5    0.21   0.44   0.62   0.77   0.87

     The CHEVRON, on the other hand, is LINEAR, also measured (110/142
     at r=0.775, 60/142 at r=0.423, 31/142 at r=0.21): two elements, two
     curves.

     AND THE SYMBOL DOES NOT SCALE: the width of the icon's ink is
     constant through the whole transition (the apparent 11→16 pt growth
     in the first frames is the measurement threshold eating the
     antialiased edges at low opacity). The 0.9 scale that used to be
     here was invented and it was withdrawn.

     ⚠ THIS WAS ALREADY "IMPROVED" ONCE AND ROLLED BACK (2026-09-01). A
     window with `overflow: hidden` was tried, which guaranteed zero
     overlap by construction, and on top of it a gradient feather to
     soften the edge of the clip. Both versions measured perfect and
     looked WORSE: a fragment of an icon materializing away from the
     word, instead of a whole icon coming out from behind it. The final
     request came with a screenshot of X as the spec: the WHOLE glyph,
     barely dimmed, right up against the word. If this bothers anyone
     again, the problem is one of materials (X's icons are filled chips
     and SF Symbols are strokes) and the way out is an asset of our own,
     not another choreography. The whole trip is in MEDICIONES.md. */
  slide: { left: 8, right: 6 },

  /* THE CLEARANCE: the label carries its own black background, inflated
     by this much toward the sides (padding compensated with a negative
     margin, so the layout never finds out). It is what turns "under the
     word" into a real OCCLUSION: SF Symbols are strokes and the mix
     could be seen in between the letters; with the background, the
     symbol emerges through a clean edge flush with the word, like one
     card sliding out from under another. The value is the SOLID black
     channel between the two inks while the symbol is pinned at the edge
     (the feather comes after that). It started at 2 (X shows 3-4 in its
     visible moments) and went up to 4 on request: "there is very little
     space between the edge and the content" (2026-09-01, with a marked
     up screenshot). */
  clearance: 4,

  /* THE FEATHER ON THE OCCLUSION EDGE: the label's background does not
     end in a hard edge, it ends in a gradient this wide, so the symbol
     is not cut off abruptly as it tucks in ("the separation is very
     abrupt, it should be more of a gradient/fade", requested with a
     marked up screenshot, 2026-09-01). The ceiling on this value is NOT
     taste: the feather starts `clearance` before the word's ink and it
     CANNOT reach the symbol at rest, or the rest state stops being
     identical at the pixel. The smallest rest gap is the one for the
     17 pt topic icon: 7.5 pt from ink to ink → clearance (4) + feather
     (2.5) + side bearing (0.5) = 7.0 ≤ 7.5, with half a point to
     spare. */
  feather: 2.5,

  /* THE FLOOR OF THE FADE for the topic icon: below this r the icon
     simply does not exist, and the rest of the curve is remapped.
     NO RECEIPT from the reference. It is the "start dissolving a little
     earlier" that was asked for by hand (2026-09-01) to kill the sense
     of overlap: with the floor, near the word (r<0.15) the ink stays at
     luma ≤ 8, which is not perceived. Cost accepted: at the instant of
     the spec frame (r=0.348) the luma drops from 52 to ~43 against X's
     55. It is this section's knob. */
  floor: 0.06,
} as const

/* THE STOCKS CHIP: the only symbol that is not a bare SF Symbol.

   The reference does not use a line glyph for Stocks: it uses an
   OUTLINE of a rounded square with the chart's zigzag inside. It is
   measured off frame 107 of the clip (Stocks active, at rest), reading
   the ink profile row by row and column by column:

     side    48×48 px = exactly 16 pt (a square, not a rectangle)
     stroke  5 px = 1.67 pt (the border: rows 0-4 and 43-47 full,
             and 10 px per row in the middle = 5 on each side)
     radius  the vertex's curve starts ~11 px from the edge → ~4 pt
     zigzag  crosses rows 14..42 → 9.7 pt tall

   AND THE LINE IS NOT ANY SF SYMBOL. `waveform.path.ecg` was tried and
   its profile is not X's: the ecg has a flat baseline that read as a
   horizontal stripe inside the chip, and it is missing the mountain. So
   the line is drawn with ROTATED BARS following the MEASURED skeleton
   of the clip (mean of the ink per column, borders excluded):

     col   6    9.5   18.5   28    36    41     (px, in a 48 chip)
     y    25.5  30.5  18.0   28.0  22.5  24.5

   So: it starts halfway up, flush with the left edge, drops to a
   valley, climbs to the highest PEAK, drops to a second valley, climbs
   to a small peak and dies at the right edge. Six vertices, five
   segments. The line's stroke leaves a vertical footprint of ~4.3 px on
   slopes of ~50°, so about 1.5 pt.

   The chip measures the 16 pt of ink that the 20 pt frame already
   reserved, so the tab's layout does not move a single point. */
export const CHIP = {
  side: 16,
  stroke: 1.67,
  radius: 4.5,
  line: 1.5,
  /* The zigzag's vertices, in pt and in the coordinates of the WHOLE
     chip (border included): the table above divided by 3. */
  vertices: [
    [2.0, 8.5],
    [3.2, 10.2],
    [6.2, 6.0],
    [9.3, 9.3],
    [12.0, 7.5],
    [13.7, 8.2],
  ],
} as const

/* How much a tab grows when it becomes active: the symbol's slot plus
   the gap that separates it from the word. The GLYPH is not part of the
   arithmetic, it overflows the slot, as in the reference. */
export const tabExtra = (side: 'left' | 'right' | undefined) =>
  side === undefined ? 0 : (side === 'right' ? ICON.slot.chevron : ICON.slot.topic) + ICON.gap

export const EDGE = {
  /* The `+` lives in a 44 pt square (the HIG's touch minimum) pinned to
     the right edge. It is not a convenient choice: with 44 pt aligned
     right, the center of the glyph falls 22 pt from the edge, and in
     the reference the `+` sits at a measured 22.3 pt. It comes out on
     its own. */
  plus: 44,

  /* The size of the `plus` symbol, and it is kept loose from the
     label's size on purpose: at 17 it paints 13.0 pt of ink, which is
     EXACTLY what the reference's `+` measures. Tying it to the label
     would move it every time the typography is touched, and there is no
     reason for the button to follow the text. */
  plusSymbol: 17,

  /* THE RAMP, and this is NOT a long gradient reaching the edge, which
     was the first model and was wrong.

     RUNTIME · the profile was reconstructed by sweeping the whole clip:
     an inactive label with no mask paints 142, so in each column of
     pixels the highest ink peak in the entire clip says how much mask
     there is. Since the labels move, different letters pass through
     each column and the maximum reaches the glyph's full coverage.

       381 pt → 0.69    390 pt → 0.30
       384 pt → 0.60    393 pt → 0.18
       387 pt → 0.46

     Fitting the line: opacity 0 at 373.8 pt and opacity 1 at 396.9. So
     **23 pt of ramp**, and that 396.9 is exactly where the `+`'s box
     starts (395.3). And from 396 to 408 no ink appears in ANY frame of
     the clip: that stretch is solid black, not gradient.

     The first model was a soft 84 pt gradient reaching the edge of the
     screen. It agreed at 381 and then stayed long: at 390 it gave 0.60
     against the measured 0.30, and at 393 it gave 0.56 against 0.18.
     That is why the next tab was too visible and arrived flush with the
     `+`. */
  ramp: 23,

  /* THE GAP BETWEEN THE LAST TAB AND THE `+`, with the row at its
     limit.

     RUNTIME · in the reference, with the scroll at its maximum, the
     last tab's box ends at 391.7 pt and the `+`'s box starts at 395.3
     (44 pt pinned to the edge of a 440 screen). So the row runs until
     it is practically against the button: 3.6 pt of slack, not the 12
     of the inset it starts with on the other side. The row is not
     symmetric, and that makes sense. On the left the inset separates it
     from the edge of the screen; on the right there is already a button
     acting as the stop. */
  slack: 4,

  /* HOW MUCH SCROLL HAS TO BE LEFT for the gradient to be at full
     strength. Because the gradient is NOT always there: it turns off
     when the row has reached the end. It is measured in the reference,
     in the state with "Design" active and the scroll at its limit.
     There, Following, Stocks, Tech and AI ALL FOUR give the same
     luminance (153), so there is no mask on top of them. And the active
     tab arrives pure white all the way to 391.7 pt, well inside the
     zone the gradient would cover.

     It makes sense: the gradient says "there is still more that way".
     If nothing is left, it would be lying. 24 pt is the distance it
     fades in over; it is not measured, and it is the only knob in this
     section that is not. */
  fade: 24,
} as const

export const HEADER = {
  /* DERIVED · in the reference, the avatar and X's logo have their
     vertical center at the SAME point: 83.8 pt both, measured
     separately. The top edge of the tab bar falls at 106 pt. If the
     content is centered, the header measures 106 − 2×(106 − 83.8) =
     44 pt, the same height as the tab bar. */
  height: TAB_BAR.height,

  /* RUNTIME · the avatar is 96 px tall = 32 pt. Horizontally the
     reading gives 29.3, but that is the content: the photo is dark
     against the black background and the edges of the circle do not
     reach the threshold. Nothing stretches the vertical reading, so 32
     is the diameter. */
  avatar: 32,

  /* The avatar starts at a measured 22.7 pt. Here it goes at 24, which
     is `inset + padding`, that is, the edge of the first label's box.
     The rule is what gets chosen, not the number: 24 is an alignment
     the piece can hold on to when the tabs change, and 22.7 is a loose
     value that does not mean anything. The difference is 1.3 pt. */
  inset: TAB_BAR.inset + TAB_BAR.padding,
} as const

export const COLLAPSE = {
  /* THE FADE OF WHAT SITS ON TOP OF THE BLOCK while it rises with the
     scroll: opacity = 1 − rise / (travel · fade). So: it goes out
     completely at 94 % of the travel. It is a FRACTION of the travel
     and not a number of points because X's block is taller than ours
     (it has the Spaces pill) and what gets copied is the rule, not the
     size: here the travel is 88.3 and the fade lasts 83 pt of scroll.
     The block's background and the divider do not fade; the whole
     mechanism is at the top of `collapse.tsx`.

     RUNTIME · probe: the underline (2 pt of full ink, #000 over #FFF in
     the light recording of 2026-09-02). Its luma L against the block's
     translation D, descent 1:

       D    8.0  14.7  21.0  26.7  32.3  38.3  44.0  49.3  55.0  61.0  66.7  72.7
       L     18    28    38    48    58    68    77    88    97   109   120   133

     and the same in the other three phases (descent 2: 15→28, 33→58,
     53→94, 72→133; return 1: 71→129, 44→79, 27→47, 20→35, 3→8;
     return 2: 65→117, 49→87, 35→60, 13→26). L = 1.8·D across
     the whole range (±3), so α = 1 − L/255 = 1 − D/142, with a measured
     travel of 151.6: 142 / 151.6 = 0.94. The labels give the same
     slope.

     It is not 1 − D/travel ("transparent exactly when it stops"): that
     line sits 5 % above the entire table. Above D≈80 the table pulls
     away a little faster still (the codec compresses a thin, faint
     line), so the value comes from D < 75. */
  fade: 0.94,
} as const

export const UNDERLINE = {
  /* RUNTIME · the underline occupies rows y=444..449, so exactly 6 px.
     Row 450 is already the divider. */
  height: 2,

  /* THE ENDS ARE ROUND: a capsule, not a rectangle.

     RUNTIME · ink mass per row of the run, in FOUR rest states of the
     user's recordings (For you, Tech, AI and Design active): the border
     rows lose −3.1 px per double end, the next ones −0.85, the middle
     ones 0. And a capsule of radius 3 px (= height/2) predicts −2.7 /
     −0.8 / 0; the difference is the antialiasing diluting the corner.
     The four states give the SAME signature, so the radius is the
     largest possible one: half the height. */
  radius: 1,
} as const

export const LABEL = {
  /* MEASURED AGAINST THE RESULT, not calculated from the cap.

     The first version did the arithmetic backwards: measured cap
     10.33 pt ÷ 0.7046 (SF Pro's cap ratio) = 14.66, rounded to 15. And
     15 RENDERS too big. With the screen in hand, "Following" came out
     65.7 pt wide and 10.67 of cap against the reference's 62.3 and
     10.00. A 5 % overshoot.

     So the number comes from the ratio between what the screen paints
     and what the clip paints, which is one measurement against another:
     15 × 62.3 ÷ 65.7 = **14.2**. At that size the width gives 62.2
     (against 62.3) and the cap 10.1 (against 10.0-10.33, which is the
     range two different captures of the reference gave).

     It is fractional on purpose. 14 would be tidier and it falls inside
     the reference's error (it would give 61.3 of width), but here the
     round number is the one that would need justifying, not the
     measured one. */
  size: 14.2,

  /* DERIVED · the vertical stem of the `l` in "Following" measures
     5 px = 1.67 pt (RUNTIME). 1.67 ÷ 15 = 0.111, which is the stem
     ratio of SF Pro Semibold (Regular ≈ 0.078, Medium ≈ 0.092,
     Bold ≈ 0.13).

     And there is A SINGLE weight for both states: "Following" was
     compared active against inactive letter by letter and the offsets
     are identical (0, 23, 49, 60, 71, 94, 129, 141, 165 px). The active
     label is not thicker. It is whiter. */
  weight: '600',

  /* THIS SIZE DOES NOT SCALE WITH DYNAMIC TYPE, and it is a decision
     with a cost.

     React Native ships `allowFontScaling` turned on, so a phone with
     the system text set small shrinks these labels too. It was checked
     with the simulator, changing `simctl ui content_size`:

       large (default)   Following 65.7 pt wide, cap 10.67
       small             Following 59.0 pt,      cap  9.33
       extra-small       Following 55.7 pt,      cap  8.67

     And the test phone, at extra-small, gave exactly 55.7 and 8.67,
     while X, ON THAT SAME PHONE AT THAT SAME MOMENT, measured 62.3 and
     10.00. So **X does not scale its tabs**, and that is why this does
     not either.

     The cost is stated: someone who enlarges the system text does not
     see these tabs any bigger. It is accepted for two reasons. The
     first is that copying the reference's behavior is the point of the
     piece. The second weighs more: this gets RECORDED and compared
     against the clip frame by frame, and a measurement that changes
     with a system setting makes two takes of the same piece
     incomparable.

     The layout does not depend on this: the widths are measured with
     `onLayout`, so if some day it gets turned back on, everything
     re-arranges itself. The only thing lost is the likeness to the
     reference. */
  fontScaling: false,
} as const
