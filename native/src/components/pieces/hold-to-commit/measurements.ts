/* ═══════════════════════════════════════════════════════════════
   THE PIECE'S VALUES, WITH THEIR RECEIPTS.

   They all come from measuring the reference clip
   (`VAULT_DIR/nativo/Hold to commit.mp4`: the Opal button, published by
   @60fpsdesign on X; 1350×1406, 60 fps, a crop of a 2160×2160) by
   reading raw pixels: ffmpeg writes rgb24 and Python counts. The
   spreadsheets and the scripts are in `.context/hold-to-commit/` in the
   web repo, which does not travel between worktrees, and that is why
   every number's receipt is here.

   THE SCALE: the phone screen in the clip goes from x=80 to x=1272, that
   is 1192 px. The workshop's simulator is an iPhone 17 Pro Max (440 pt)
   and the arithmetic closes with it: 1192 / 440 = 2.709 px/pt. A 430 pt
   one (15 Pro Max) would give 2.77 and the same proportions; what
   changes is 2 % in the absolute values, which were compared on screen
   against the clip afterwards anyway.

   Three grades, like in the rest of the repo:
   · RUNTIME    — read off the clip's pixels.
   · DERIVED    — arithmetic on top of a RUNTIME, with the arithmetic
                  written out.
   · ASSUMED    — what the clip does NOT show (the top of the screen, the
                  haptics). It is stated as such.
   ═══════════════════════════════════════════════════════════════ */

/** clip px → pt. RUNTIME: 1192 px of screen / 440 pt. */
export const PX = 2.709

export const COLOR = {
  /* RUNTIME · the screen background: (20,20,20) in every free gap. */
  background: '#141414',

  /* RUNTIME · the cards: (27,27,27) and (28,28,28) depending on the card. */
  card: '#1C1C1C',

  /* RUNTIME · the pill at rest, at the two tips where the sheen does not
     reach: (30,30,30). */
  pill: '#1E1E1E',

  /* THE RING IS NOT DRAWN, and that is why there is no constant here. It
     was measured (RUNTIME · a ring of ~1 pt, lighter, around the pill:
     48–54 of luminance over 30 inside; white at 8 % reproduced it) and
     then measured again, better: our ring pulled +54.5 away from what it
     has 2 pt outside and Opal's +4, which means that in the clip the
     edge is a ramp and ours was a drawn outline. The shadow in
     `css.shadow` in `hold-to-commit.tsx` replaces it. The whole receipt
     is in the README, § Hold to commit. */

  /* RUNTIME · primary text: mode 255. */
  text: '#FFFFFF',

  /* RUNTIME · secondary text, icons and chevrons: the peak ink gives
     156–165 across four different texts and 150–161 in the symbols. Thin
     text compressed in video never reaches its real color; 158 is the
     reading, and it is NEUTRAL (none of secondaryLabel's blue). */
  secondary: '#9E9E9E',

  /* RUNTIME · the toggle track: (73,73,73). The knob: (254,254,254). */
  toggleTrack: '#494949',
  toggleKnob: '#FFFFFF',

  /* RUNTIME · the day circles are pure white and the letter reaches
     (0,0,0): black, not the grey of the background. */
  circle: '#FFFFFF',
  circleLetter: '#000000',

  /* RUNTIME · the green of the PRO badge: the middle of the P's stem
     gives (203,251,209)/(183,252,189). A 1.2 pt stroke in video reads
     duller than it is; the color goes just above the reading. */
  pro: '#BDF7C5',
  /* RUNTIME · the inside of the badge is not the card's color: (20,29,25)
     against (27,27,27), a green tint of ~5 %. */
  proBackground: 'rgba(180,255,190,0.06)',

  /* RUNTIME · "Keep Holding..." over the white fill, on the plateau
     (f146–f177): the darkest pixel gives (29,36,32) and the darkest 10 %
     (30–51, 36–64, 32–54). It is a GREENISH grey, not black: G runs 8
     higher. */
  darkInk: '#202B24',

  /* RUNTIME · "✓ Committed" reaches (0,0,0) in dozens of pixels. */
  blackInk: '#000000',

  /* RUNTIME · the finished pill: 254 in the middle. With the blob's green
     rim showing through at 25 % on top (see `COMMIT.whiteVeil`). */
  committed: '#FFFFFF',
  /* The selector's chips (scaffolding): white at 6 % and at 18 % over the
     dark background. NO RECEIPT: they are not part of the piece. */
  chip: 'rgba(255,255,255,0.06)',
  chipActive: 'rgba(255,255,255,0.18)',
} as const

/* LIGHT MODE — it is not in the clip: Opal is dark. What changes when
   the screen is light (asked for on 2026-09-07, looking at the simulator
   in light mode: "adapt it properly to light mode, it all looks awful to
   me, even the picker, and everything about the button", and "take the
   things out of the button's background"). ASSUMPTIONS derived from
   iOS's system colors, not measured off a reference:
     · the pill stays dark (#1E1E1E): a black primary button on white is
       the standard iOS button and Robinhood's button in light mode, and
       the white fill of the hold contrasts just the same. What goes is
       what is painted on its background: the teal→green resting sheen,
       which over a white screen was the only color on the screen.
     · what separates the pill from the page in light mode is the SHADOW
       (`css.shadow` in `hold-to-commit.tsx`), not a ring. There was one,
       white at 8 % in dark and black at 10 % in light, and it went out:
       see the ring block above, in COLOR. That the white pill of the
       commit did not get lost against the page was not fixed in the
       button but by moving the page to `systemGroupedBackground`
       (`backgrounds/stock.tsx`).
     · the burst is the color of the pill: white dots on a white
       background do not exist.
     · the selector's chips: iOS's `systemFill` and `secondaryLabel` in
       light mode. */
export const LIGHT = {
  particle: '#1E1E1E',
  chip: 'rgba(120,120,128,0.2)',
  chipActive: 'rgba(120,120,128,0.4)',
  chipText: 'rgba(60,60,67,0.6)',
  chipTextActive: '#000000',
} as const

export const SCREEN = {
  /* RUNTIME · card edge to screen edge: (134.5−80)/2.709 = 20.1 on the
     left and (1272−1218)/2.709 = 19.9 on the right. */
  margin: 20,
  /* RUNTIME · the pill sits FURTHER in than the cards: 159 and 1193 →
     29.2 and 28.8 pt. It is not the cards' margin plus anything: it is 29. */
  pillMargin: 29,
} as const

export const CARD = {
  /* DERIVED · the inner padding. The 7 circles of 44 with 6 gaps of 8
     measure 356; the first one's edge falls at (192−135)/2.709 = 21.0
     from the card's edge and the last one's at 21.4. The text ("On these
     days", "Hard Mode") has its ink at 21.8–22.1, which is 21 plus the
     side bearing of a capital. */
  padding: 21,
  /* RUNTIME · the right side sits further in than the left: the y of
     "Everyday" ends at 396.8 from the screen edge, the chevron's ink at
     397.4 and the stepper's at 396.8 → boxes at ~397 → 23 from the
     card's edge (the left one gives 21 + the H's bearing). */
  paddingRight: 23,

  /* DERIVED · the vertical padding. A one-line card measures 151 px =
     55.7 pt; with one line of SF 17 (20.3 pt of natural height) that
     leaves 17.7 per side. The two-line one (224 px = 82.7) closes with
     18 + 20.3 + 4 + 20.3 + 18 = 80.6, and "To" has 17.7 from baseline to
     edge. */
  paddingVertical: 18,
  /* RUNTIME · the TWO-line card measures 82.7 and with 18 of padding it
     closes at 80.6 (measured on screen: 80.7). One point more per side. */
  paddingVerticalTwoLines: 19,

  /* RUNTIME · between "Hard Mode" and "No unblocks allowed" there are
     66.5 px baseline to baseline = 24.5 pt: 20.3 of line plus 4 of air. */
  betweenLines: 4,

  /* RUNTIME · between cards: 871→902 and 202→233, both times 31 px = 11.4. */
  separation: 12,

  /* THE CORNERS ARE CONTINUOUS, and big. The profile of the bottom right
     corner of the days card (the edge at different depths from the
     bottom) departs systematically from a circle: at 30–70 px of depth
     the edge is 4–6 px FURTHER in than the circle that fits the tips
     (R=90 px). That signature, the curve going on past where a circle
     has already straightened out, is iOS's `cornerCurve: continuous`.
       RUNTIME (Days, bottom=538): depth 6→57  10→49  22→30  30→24  42→16  54→8  66→5  74→3
     RUNTIME · a 33 pt circle fits the clip's profile to ±1 px at every
     depth (2.2→21.2, 8.1→11.4, 14→6, 19.9→2.7) and only falls short in
     the tail (25.8→0.8 against 1.5), which is what the continuous curve
     adds. With 26 continuous, on screen the corner gave half the inset at
     each depth (8→6.3 against 11.1); with 30 continuous it measures like
     a 30 circle (8.7→8.7, 20.7→1.7). */
  radius: 33,
} as const

export const TEXT = {
  /* RUNTIME · cap height of the H in "Hold to Commit" and "Hard Mode":
     33 and 32 px = 12.2 and 11.8 pt → 17.3 and 16.8 → 17. The S in
     "Selected" and the O in "On these days" give the same. */
  body: 17,

  /* THE GREY VALUES ARE 17 EXCEPT THE TIME. Measured on screen against
     the clip with the same threshold: "Everyday" at 15 gave 58.0 against
     65.0 in the clip (×17/15 = 65.7 ✓), "5 Apps" 45.0 against 50.2
     (×17/15 = 51), "No unblocks allowed" at 17 gives 153.7 against 151.
     But "10:00 PM" at 15 gave 60.3 against 63.1: ×16/15 = 64.3 ✓ and
     ×17/15 = 68.3 ✗. The time is 16, the rest is 17. The cap heights of
     the greys (31 px) are one pixel less than the whites' because of the
     threshold over duller ink, not because of the size. */
  value: 17,
  time: 16,

  /* RUNTIME · "PRO": cap 970..990 = 21 px = 7.75 pt → 11 pt. And it
     measures 22.5 pt wide, ~1 pt more than plain "PRO" in 11 bold:
     there is half a point of tracking. */
  badge: 11,
  badgeTracking: 0.5,

  /* WEIGHTS, from the normalized stem width (ink sum / 2.709):
       "No unblocks allowed" N   1.35 pt   regular   (0.078 × 17 = 1.33)
       "10:00 PM" '1'           1.30 pt   regular
       "Hard Mode" H            1.91 pt   semibold  (0.111 × 17 = 1.89)
       "To" T                   1.89 pt   semibold
       "Selected Apps" l        1.9–2.0   semibold
       "Keep Holding..." K      ~2.0 pt   semibold
       "Hold to Commit" H       2.16 pt   ?
       "Apps are blocked" b, l  2.2–2.5   bold
       "Committed" C, t         2.0–2.1   bold (it looks heavier than
                                          "Keep Holding..." in the strips)
     The button's H falls between semibold and bold; it was decided by the
     magnified strip, where "Hold to Commit" and "Keep Holding..." weigh
     the same. */
  labelWeight: '600',
  sectionWeight: '700',
  buttonWeight: '600',
  /* RUNTIME · "Committed" measures 86.7 pt of ink in the clip; SF at 17
     gives ~87.2 in semibold and ~89.7 in bold (measured with the same SF
     in `media/generate.swift`). It is SEMIBOLD: it looked heavier in the
     strips because "Keep Holding..." is shrunk by the press and
     "Committed" is already back at scale 1. */
  committedWeight: '600',
  valueWeight: '400',
  /* SOURCE · the Dynamic Type ceiling of the button's label
     (`maxFontSizeMultiplier`, and the scale of the blurred copies and of
     the checkmark). The pill measures 52 pt and does not grow (its
     textures are 52) so the text follows the system setting as far as it
     fits. The line box of SF 17 semibold is 20.3 pt: at ×1.786
     (AccessibilityMedium, the first accessibility size, the multiplier RN
     assigns it in `RCTAccessibilityManager.mm:267`) that gives 36.3 pt
     and leaves 7.9 pt of air above and below; at ×2.143
     (AccessibilityLarge) 4.2 are left and the text touches the edge of
     the capsule. "Keep Holding..." at ×1.786 is 212 pt of ink in a pill
     of 382. Asked for on 2026-09-04 (animate-expo § 9: the text scales). */
  maxScale: 1.786,
} as const

export const SYMBOL = {
  /* RUNTIME · the header's icon is `lock.shield.fill` (a shield with the
     padlock cut out of it), not a padlock: you can see it in the
     magnification. Ink 39×45 px = 14.4×16.6 pt → at 18: box 19×21, ink
     14×17.75 from x=2.25. */
  lock: { name: 'lock.shield.fill', box: { width: 19, height: 21 } },
  /* ASSUMED · the header at the top, which the clip does not show:
     `clock.fill` at 18 (box 22×22). */
  clock: { name: 'clock.fill', box: { width: 22, height: 22 } },
  /* ASSUMED · the back arrow: `chevron.left` at 20 (box 16×21). */
  back: { name: 'chevron.left', box: { width: 16, height: 21 } },
  /* SymbolView's `size` IS NOT THE SIZE OF THE GLYPH. SOURCE: in
     `expo-symbols@57.0.2`, `ios/SymbolView.swift:127` builds the
     configuration with `pointSize: UIFont.systemFontSize` (14 on iOS),
     always; the glyph is rasterized at 14 pt and then the `contentMode`
     scales it to the view's BOX. With `resizeMode: 'center'` nothing
     gets scaled: every symbol came out at 14 pt (shield 11.3×13.3
     instead of 14×17.75; chevron 7×12 instead of 8.75×15; measured on
     screen on 2026-09-02, before reading the Swift).

     So here every symbol carries its NATURAL BOX at the size you want,
     the one `NSImage(systemSymbolName:)` gives for that pointSize,
     printed by `media/generate.swift`, and the default `scaleAspectFit`
     takes it there. The ink stays proportional to the box: `ink` and
     `fromX` say where it falls inside, so you can position it to the
     pixel. And `scale: 'large'` rasterizes bigger, so the scaling goes
     downwards and does not look soft. */
  /* RUNTIME · the `chevron.right` of "5 Apps": ink 22×37 px = 8×13.7 pt →
     the chevron of 17 semibold: box 13×18, ink 8.75×15 from x=3.25. */
  chevron: { name: 'chevron.right', box: { width: 13, height: 18 }, fromRight: 1.7 },
  /* RUNTIME · the time stepper is `chevron.up.chevron.down`: ink 30×42 px
     = 11×15.5 pt → at 17: box 16×21, ink 12×17.25 from x=2. */
  stepper: { name: 'chevron.up.chevron.down', box: { width: 16, height: 21 }, fromRight: 2 },
  /* RUNTIME · the badge's bolt: 16×24 px = 6×9 pt of ink. At 11 bold the
     natural ink is 8.25×12.75, too big; at 8 it gives 6×9.3 in a box of
     8.7×11.6, from x=1.1. */
  bolt: { name: 'bolt.fill', box: { width: 8.7, height: 11.6 } },
  /* RUNTIME · the checkmark in "Committed": 38×39 px = 14×14.4 pt of ink,
     stroke of 9 px = 3.3 pt (video fattens it ~0.7), thicker than the
     stems of the text (2.1). `checkmark` heavy at 15 pt has ink
     14.1×13.2 with a stroke of ~2.6: box 18×17 (generate.swift prints
     it), ink from x≈2. At 17 heavy the ink was 16×15, 14 % too big. */
  checkmark: { name: 'checkmark', weight: 'heavy', size: 15, box: { width: 18, height: 17 },
    /* ASSUMED · on Android there are no SF Symbols: `expo-symbols` draws
       Material Symbols (the `@expo-google-fonts/material-symbols` font)
       if the name comes in as an object; without the object it draws
       NOTHING (SOURCE: `expo-symbols/src/SymbolView.tsx:32`,
       `props.fallback`). The equivalent of the heavy checkmark is
       `check` at 700. */
    android: 'check' },
} as const

export const GAP = {
  /* RUNTIME · from the ink of "5 Apps" to the chevron's: 44 px = 16 pt;
     from "10:00 PM" to the stepper 33 px = 12.2. With a layout gap of 12
     the texts ended 5 pt earlier than in the clip (372 and 369.3 against
     377 and 374.3, measured on screen): RN's Text box closes ~2 pt after
     the ink and the symbol's opens 2–3 before. It comes out at 7. */
  valueToIcon: 7,
  /* RUNTIME · "Everyday", which has no icon, ended at 393 against 396.8
     in the clip with the same padding: the Text box carries ~4 pt of
     tail after the y. It is compensated on the loose value. */
  valueTail: 4,
  /* RUNTIME · from the shield's ink to the ink of "Apps are blocked":
     36 px = 13.3 pt; with the bearings that leaves a gap of 10 (11 gave
     67.5 for the position of the A against 66 in the clip). */
  iconToText: 10,
  /* RUNTIME · the shield's ink starts 38.8 pt from the screen edge: 2 pt
     FURTHER OUT than the text line of the cards (41). The header does not
     share the cards' padding. */
  headerInset: 16,
  /* RUNTIME · from "Hard Mode" to the badge: 24 px = 8.9 pt → 8 + bearing. */
  labelToBadge: 8,
  /* RUNTIME · the text of "On these days" ends 34.5 px = 12.7 pt above
     the circles (a line of 20.3 with descent 4.1). */
  textToCircles: 13,
} as const

export const SECTION = {
  /* DERIVED · the days card ends at 538 and "Apps are blocked" has its
     cap at 641..673: the line box (20.3) starts 91.5 px = 33.8 pt after
     the card and ends 35.5 px = 13.1 pt before the next one. */
  above: 34,
  below: 13,
  /* RUNTIME · from the last card to the pill: 1126→1213 = 87 px = 32.1 pt. */
  toPill: 32,
} as const

export const DAYS = {
  /* RUNTIME · each circle measures 118 px = 43.6 pt, in both directions. */
  diameter: 44,
  /* RUNTIME · the step between centers is 141.7 px = 52.3 pt → gap of 8. */
  gap: 8,
  letters: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
} as const

export const TOGGLE = {
  /* RUNTIME · it is NOT a UISwitch (51×31): the track measures 174×72 px
     = 64×26.6 pt and the knob is a LANDSCAPE CAPSULE of 102×66 px =
     37.6×24.4 pt, inset 1.5–2 pt. Threshold 50 over a track of 73. */
  width: 64,
  height: 27,
  knobWidth: 38,
  knobHeight: 24,
  inset: 1.5,
  /* RUNTIME · the right edge of the track sits at (1218−1166)/2.709 =
     19.2 pt from the card's edge, 4 pt further out than the values (23). */
  rightCorrection: -4,
} as const

export const BADGE = {
  /* RUNTIME · a capsule of 121×55 px = 44.7×20.3 pt; border of 3–4 px.
     The width is not fixed: it comes out of 1.5 + 4 + 6 + 5 + 22.1
     ("PRO") + 4 + 1.5 = 44.1. With a minWidth of 45 and padding 6 it
     measured 52.3 on screen. */
  height: 20,
  border: 1.5,
  /* RUNTIME · the bolt's ink starts at 143.2 with the border at 137.7:
     5.5 = 1.5 of border + 3 + 1.1 of the glyph's own air. "PRO" ends at
     176.1 with the border at 182: 5.9 = 1.5 + 2.2 + ~2 of the O's
     bearing (on screen, with 3.5 the border fell at 183.3). Between the
     bolt (149) and the P (154) there are 5 ink to ink: 1.6 of the
     glyph's air + 3 + ~1 of bearing. */
  paddingLeft: 3,
  paddingRight: 2.2,
  betweenBoltAndText: 3,
} as const

export const TIMELINE = {
  /* RUNTIME · the hollow circle of "To": 22 px = 8 pt of diameter, a ring
     of ~4 px = 1.5 pt, center at (201.5−135)/2.709 = 24.5 pt from the
     card's edge. The ink of "To" starts at 45.8 pt. */
  circle: 8,
  ring: 1.5,
  column: 8,
  /* DERIVED · 45.8 − 24.5 − 4 (radius) − 1.3 (the T's bearing) ≈ 16. */
  toText: 16,
  /* RUNTIME · the dashed line: 3 px = 1 pt wide; dashes of 12–14 px
     (5 pt) with gaps of 6–8 px (2.5 pt). */
  thickness: 1,
  dash: 5,
  dashGap: 2.5,
  /* ASSUMED · the step between "From" and "To": the clip only shows ≥40 pt
     of line above the "To" circle. 56 leaves a connector of ~48 pt, which
     gives the six and a half dashes you can see. The row MEASURES the
     whole step and the card adds no padding: 2×56 = 112, and with the
     line centered you get the 17.8 pt from "To" to the edge that are
     measured. */
  rowStep: 56,
} as const

export const SPILL = {
  /* RUNTIME · under the pill there is a faint light, and ONLY under it
     (at the sides and above, the background stays at 20): +7 of luminance
     evenly up to ~12 pt, +4 at 18, +3 at 21. And it does not span the
     whole width: in the row 6.6 pt below the edge it runs from ~118 to
     ~340 pt of the pill (x 400..1000 of the clip), that is ~220 pt
     centered. It is what is left of the sheen escaping underneath, and it
     is still there with the pill finished (28,28,28: neutral). It is made
     with a white strip at 3.3 % (7/215) peeking out under the pill and a
     short shadow that fades it out. */
  width: 220,
  peek: 18,
  color: 'rgba(255,255,255,0.033)',
  shadow: '0 0 10px 0 rgba(255,255,255,0.033)',
} as const

export const FRONT = {
  /* RUNTIME · the front's falloff: σ = 19 pt (51 pt from 90 % to 10 % in
     f151), centered on the geometric edge. The texture starts 83 pt
     before that edge (3σ plus the radius of the tip) and ends 57 after.
     The body is shortened by those 83 pt: the full receipt is above
     `front.png` in `media/generate.swift`. */
  before: 83,
  after: 57,
  /* THE FRONT DOES NOT GO TIP TO TIP. RUNTIME (2026-09-03, `evolucion.py`,
     the 50 % point of the front in the row 10 pt from the edge, every
     100 ms): 55 → 69 → 88 → 105 → 122 → 141 → 158 → 176 → 195 → 212 →
     229 → 244 → 263 → 281 → 298 → 317 → 330 → 349 → 357 pt (f76…f181):
     174 pt/s, not the 191 of tip to tip in 2 s, and in f181 (the last
     frame before the burst) it stays at 357 = 93.5 % of the width, with
     the right tip still at 124 of luminance. Extrapolated back to the
     press, it starts 11 pt in. So the geometric edge runs from 4.5 % to
     95.5 % of the width: start .045 (with .03 the 50 % point came out
     1.5 % behind the clip at all six measured progresses), travel .91.
     What is missing gets covered by the commit's whitening. */
  start: 0.045,
  travel: 0.91,
  /* RUNTIME · the front is narrower at the beginning and widens: from
     90 % to 10 % it measures 51–53 pt between p .17 and .42, 55 at .52,
     58–60 at .72–.82 and 62–64 from .87 on (same row and threshold as in
     the capture; the 10 % threshold falls over the resting sheen, so both
     widths come out inflated by the same ~12 pt). It is an x scale of the
     texture around the geometric edge. With .8 + .22·p the capture was
     still 10 pt wider at p .5; having measured that the width follows the
     scale linearly (65.5 pt at .91, 45.5 at .66), it comes out at
     .66 + .36·p: 50 pt at p .23 (clip 51), 60 at .5 (55), 62 at .74 (59),
     56 at .99 (55–62). */
  scale: { from: 0.66, to: 1.02 },
} as const

/* Where the fill's geometric edge is for a progress p, in pt from the
   left tip. The fill and the sparks use it, since the sparks are born
   ahead of it. It is a worklet: it runs on the UI thread. */
export const frontAt = (p: number, width: number) => {
  'worklet'
  return width * (FRONT.start + FRONT.travel * p)
}

export const VEIL = {
  /* RUNTIME · the blob's left tip darkens and widens as the front moves
     away (full receipt above `veil.png` in generate.swift): the texture
     is the one from the end of the hold, and it gets scaled in x from the
     tip with s(p) = .25 + .75·p. */
  scale: { from: 0.25, to: 1 },
} as const

export const PILL = {
  /* RUNTIME · 1035 px wide = 382 pt (= 440 − 2×29); 140 px tall
     (1213..1352) = 51.7 pt. The left edge at different heights falls
     EXACTLY on a circle of radius = height/2: it is a circular capsule,
     not a continuous one. */
  height: 52,
  /* DERIVED · the bottom edge of the pill sits 112 px = 41.4 pt above the
     screen edge, which was located by the bezel's corner (it falls at
     y≈1465 of the crop, with the 17 Pro Max's 62 pt corner). With 34 of
     safe area that leaves 7.4; on screen, 8 gives 42.7 and 7 gives 41.7. */
  aboveSafeArea: 7,
} as const

export const LABEL = {
  /* Opal's texts were 'Hold to Commit' / 'Keep Holding...' / 'Committed'
     (semibold 17, measured by ink width). On 2026-09-04 Vito asked for
     the button to be for buying, with a finance app background: the words
     change, the font and the weight do not. The blurred copies are
     regenerated with `media/generate.swift`. */
  rest: 'Hold to Buy',
  holding: 'Keep Holding...',
  placed: 'Order Placed',
  /* RUNTIME · from the checkmark's ink to the C: 33 px = 12 pt. The
     checkmark's box leaves 1.7 of air to the right of its ink and the C
     has ~1 of bearing: 12 − 1.7 − 1 ≈ 9. `media/generate.swift` uses the
     SAME gap for the blurred copy. */
  checkmarkToText: 9,
  /* RUNTIME · HOW FAR "✓ Order Placed" MOVES SO THE EYE SEES IT CENTERED,
     in pt. With the row centered as a box, measured over the commit frame
     (ink per column over the white pill, Δ against the center of the
     pill): the box lands at +0.83, but the TEXT lands at +13.67 and the
     ink centroid at +6.60. The correction is that centroid Δ cancelled
     out, and with it the center of mass falls on the center (verified:
     Δ −0.06). Centering the text was tried too (−13.7, Δ 0.00) and
     discarded: the checkmark ends up hanging off to the side.

     better-ui asks for it ("when geometric centering looks off, align
     optically; buttons with icons need a manual nudge"), and the
     reference does NOT do it: in the clip the same three numbers give
     +0.74 / +13.84 / +8.35, which means Opal does not correct it either
     and we reproduced it to within 0.2 pt. It only moves the label that
     has a checkmark: the other two have no icon and are already
     centered. `optico.py`. */
  opticalCorrection: -6.6,
} as const

/* ═══ THE GESTURE AND THE FILL — the heart of the piece ═══ */
export const HOLD = {
  /* RUNTIME · the blob's front advances LINEARLY: 7.75 px/frame from f75
     to f181 (8.15 → 7.7 → 7.5 across three stretches: a deceleration of
     5 %, in the order of the noise of a threshold over a gradient). From
     the press (f62) to the burst of particles (f183) there are 121 frames
     = 2.02 s. And the position of the front's 50 % point closes with a
     geometric edge going tip to tip in 2.0 s plus a blur of σ=13 pt that
     holds it back.
     ASKED FOR (2026-09-07): first "make it take 1500 ms in total" and
     then "cut the time to 1 s". What was measured is 2000; with 1000 the
     front runs at 348 pt/s instead of 174 and everything that is a
     function of the progress (sparks, haptic detents, label color)
     compresses by itself, because it reads this number. To go back to the
     faithful one: 2000. */
  duration: 1000,

  /* ASSUMED · how far the finger can move without cancelling. 10 is
     LongPress's default and it feels strict on a 52 pt button. */
  maxDistance: 24,

  /* ON RELEASE THE FILL GOES OUT MORE THAN IT RETREATS. RUNTIME (release
     at f13, row 10 pt from the edge, `perfil.py`): the peak drops
     172 → 145 → 117 → 93 → 76 → 66 → 54 → 48 in f13–f20 (an exponential
     with τ ≈ 80 ms, with a tail out to ~200 ms) while the front's 50 %
     point barely retreats: 13.5 → 12.5 → 12 → 11.5 → 11 → 9.5 → 9.5 →
     9.5 % of the width. With 180 ms and the strong bezier, in the capture
     the front was already at 3.5 % at 83 ms where the clip has it at 9.5:
     it was 2.5× too fast. A quadratic ease-out of 400 ms gives
     12.4 / 10.4 / 8.5 % at 17 / 50 / 83 ms. The fade IS an exponential:
     over the background, the peak stays at
     .81 / .61 / .44 / .32 / .25 / .17 / .13 at 17 / 33 / 50 / 67 / 83 /
     100 / 125 ms → τ = 60 ms (with a quadratic ease-out of 220 the
     capture gave .72 / .59 / .49 / .43 / .36 / .27: a long tail).
     `Easing.out(Easing.exp)` is 1 − 2^(−10t): with 420 ms it is exactly
     e^(−t/60) — .75 / .58 / .43 / .33 / .25 / .19 / .12. The old reading
     ("30 px/frame, 4× the way in") was following a fixed luminance
     threshold, which runs fast when what is falling is the peak. */
  retreat: 400,
  retreatFade: 420,

  /* RUNTIME · the blob is born dark: the peak rises 45→217 between f63
     and f83 (20 frames = 333 ms) while the front is already moving. */
  turnOn: 330,
  /* RUNTIME · and it starts SLOW: the peak 10 pt from the edge, over a
     background of 45, goes 0 → 2 → 15 → 31 → 48 → 118 → 182 at
     42 / 58 / 75 / 108 / 142 / 208 / 308 ms (f64…f80) — 8 / 17 / 26 / 65
     / 100 % at 75 / 108 / 142 / 208 / 308 ms. An ease-out over 300 gave
     44 / 60 / 73 / 91 / 100 and in the capture the peak came out 50 %
     stronger at 75 ms and 25 % weaker at 300; a quadratic ease-in-out
     over 330 gives 10 / 21 / 37 / 73 / 99 and in the capture the peak
     stays within ±7 of the clip at all eight instants (`perfil.py`,
     p25…p308). The curve is EASE_IN_OUT in the button. */

  /* RUNTIME · the label changes color in two steps, measured with the
     minimum luminance in the "Ke" area (already white from f118 on):
       f128 253 → f133 134 → f138 79 → f146 47 → plateau at 45 until f177
       f178 26 → f181 23 (a one-frame jump)
     In progress (t = (f−62)/120): the first one runs from .55 to .70 with
     an ease-out shape (half the way in 5 frames); the second one is a
     step at .965. */
  inkFrom: 0.55,
  inkTo: 0.7,
  blackAt: 0.965,
} as const

export const PRESS = {
  /* RUNTIME · the pill SHRINKS on press: the left edge goes from 157 to
     182–183 and the right one from 1194 to 1169 → 986/1035 = 0.953,
     uniform (the top drops 3 px, which is what scaling about the center
     gives). */
  scale: 0.953,
  /* RUNTIME · the scale comes down in 14 frames (f62→f76: 158, 162, 164,
     168, 171, 173, 175, 177, 178, 179, 180, 181, 181, 182): ease-out,
     ~233 ms. On release it comes back in 15 (f13→f28), the same curve. */
  duration: 250,
  /* RUNTIME · on completion the scale comes back in ~13 frames, not in 6:
     the pill's width (2026-09-03, `pill_clip` frame by frame) goes 364 →
     369.1 → 369.5 → 371 → 373.9 → 376.2 → 378 → … → 378.7 → 380.2 → 381
     → 381.7 from f182 to f195: 29 % in the first frame, 55 % at 67 ms,
     78 % at 100, 90 % at 183, 98 % at 217. A 25 % jump in one frame and
     from there a quadratic ease-out of 220 ms: 56 / 71 / 90 / 98 % at
     67 / 100 / 150 / 217 ms. No bounce (381.7 in f195, it never goes past
     382). The old reading ("52 % in the first one, 96 % in the sixth")
     came from an edge threshold that the burst contaminates. */
  commitDuration: 220,
  commitJump: 0.25,
} as const

export const CROSSFADE = {
  /* THE CROSSFADE IS NOT SYMMETRIC: the label that leaves disappears fast
     and the one that arrives focuses with a long tail. Each label has its
     own PRESENCE (0..1); crossfading is taking the incoming one to 1 and
     the outgoing one to 0, each with its own duration and delay (ms). The
     opacities of the sharp and blurred layers come out of the presence
     (the staircase is in `label.tsx`), so a crossfade interrupted halfway
     carries on from where it is, with no mirroring and no jump.

     RUNTIME · press (f62): the integral of the stem of the "i" in Commit
     (the outgoing one) drops 2255 → 1503 → 818 → 370 → 66 → 0 from f61 to
     f66: it goes in 4 frames (67 ms), 67 / 36 / 16 / 3 % — an ease-out.
     The "i" in Holding (the incoming one) is already there at 33 ms,
     blurred; legible at 67; at 90 % by 133; and its peak keeps rising to
     ~f85 (380 ms): the focusing has a tail. The 48 of exit (against the
     67 measured) are because the staircase only blurs in the last half of
     the presence: with 70, at 25 ms the outgoing one was still almost
     sharp and at 84 % where the clip (f63) already has it spread out at
     50 % (capture `crossfade=25` against f63); with 48 it reaches that
     point at q = .23. */
  press: { enter: 360, exit: 48, enterDelay: 0, exitDelay: 0 },
  /* RUNTIME · release (release at f13): the outgoing one starts at f17–18
     (80 ms) and drops fast to 48 % at f22 (158 ms), and from there it
     stays: 45 / 44 / 44 % in f23–f25, and in the f26 strip (217 ms) it is
     still visible, spread out, under the Hold coming in. An ease-out of
     250 ms starting at 80 does both things: 48 % at 158 and 20 % at 217
     (with 130 there was nothing left at 210, and the label had an empty
     gap between the two texts). The incoming one starts at f22 (150 ms
     after the release) and rises SLOWLY: the integral of the stem of the
     "i" in Hold gives 46 % at f29, 64 % at f32, 76 % at f34, 91 % at f38
     (130 / 180 / 220 / 270 ms into the entry). With the staircase, which
     turns the opacity on in the first 40 % of the presence, that is a
     LINEAR presence of 600 ms: 60 % at 130, 98 % at 220, sharp at 80 % by
     270, and the halo's tail out to 600 (capture `crossfade-release`
     against f22–f38; with 300 ease-out the Hold was already sharp at
     217 ms where the clip has it spread out). */
  release: { enter: 600, exit: 250, enterDelay: 150, exitDelay: 80, linearEnter: true },
  /* RUNTIME · commit (burst at f183): the darkest pixel in the band gets
     lighter from f186 to f194 (the outgoing one: from 50 ms, 133 ms) and
     darkens again from f195 to f211 (the incoming one: from 200 ms,
     270 ms, 50 % at f201); the sharpness (mean gradient) bottoms out at
     f197 and rises to f213. In the capture against f186–f197, the
     outgoing one with 150 ms from 50 was already gone at 190 ms where the
     clip still shows it at 50 %, and at 242 the clip has it at 35 %: it
     comes out at 280 from 40. THE ENTRY IS LINEAR, not ease-out: the
     clip's "✓ Committed" is still blurred at 308 ms (f201) and almost
     sharp at 392 (f206); with an ease-out over 450 it was already sharp
     at 308. Linear, the staircase focuses between 100 and 200 ms into the
     entry (310–410 after the burst) and the tail closes at 660. */
  commit: { enter: 450, exit: 280, enterDelay: 210, exitDelay: 40, linearEnter: true },
  /* ASSUMED · the workshop's reset: the clip does not show it. The exit
     of "✓ Order Placed" goes together with the pill's fade (phase 1) and
     the entry of "Hold to Buy" comes after, alone (phase 2): see `reset`. */
  reset: { enter: 300, exit: 250, enterDelay: 0, exitDelay: 0 },
  /* RUNTIME · in the magnified strips the two texts BLUR and crossfade by
     opacity, centered, with no scale and no displacement: it is SwiftUI's
     `.blurReplace`. The peak blur leaves the ~2 pt stems at ~3.5 and the
     letters barely legible: σ ≈ 2.5 pt. The narrow level (1.0) is the
     intermediate step of the focusing: it does not read as a value in the
     clip, it reads as continuity (with a single level the crossfade was
     sharp → ghost → sharp, a jump of focus). */
  blur: { wide: 2.5, narrow: 1.0 },
} as const

export const COMMIT = {
  /* RUNTIME · the left tip goes from 90 to 233 of luminance between f183
     and f205: 22 frames = 366 ms. Part of it is the scale coming back,
     the rest is the pill finishing its whitening. */
  whitening: 330,
  /* RUNTIME · the finished pill is NOT evenly white: the top rows give
     (245,250,248) and the middle 254. With the white veil at 75 % over
     the blob (which has a pale green rim), the middle ends at 255 and the
     rim at (218×.25 + 255×.75) = 246 — both readings at once. */
  whiteVeil: 0.75,
  /* RUNTIME · after the burst the front KEEPS GOING to the right tip
     while the pill whitens: the front's 50 % point (row 10 pt in) goes
     93.5 (f181) → 95.5 (f186) → 98.5 % (f190), and the right tip ends at
     246 (f230) against 239 in a capture with the front pinned at 95.5 %.
     A slide of the progress to 1.06 (the geometric edge at 101 %), with
     250 ms of delay and 400 of ease-out, leaves the ending the same
     without bringing the right tip forward too early (at 58 ms it was
     already coming out 24 lighter than the clip; with the early slide it
     was worse). */
  slide: 0.06,
  slideDelay: 250,
  slideDuration: 400,
  /* ASSUMED · Vito asked for it (2026-09-03): "✓ Committed" appears
     smaller, from the back, and grows to its size while it focuses — the
     `.blurReplace(.downUp)` of SwiftUI, what a serious brand would do.
     The clip does NOT do it (measured: centered, no scale); with 1 here
     the faithful version comes back. The scale follows the label's
     presence, which comes in with an ease-out: it grows fast and settles
     slowly. */
  enterScale: 0.9,
} as const

/* ASSUMED · the workshop's reset: the clip does not show what happens
   after "✓ Committed". At 5 s the button goes back to rest (asked for on
   2026-09-02, to be able to try it repeatedly). Since 2026-09-04 it is an
   opacity FADE, with no sweep: the white veil and the fill go out in
   `fade` ms with ease-out and only then does the resting label come in. */
export const RESET = {
  wait: 5000,
  fade: 400,
} as const

export const PARTICLES = {
  /* RUNTIME · 21 above + 22 below in f183–f187, all at once (there is no
     stagger: in f183 all 43 are already there), and they come out of the
     WHOLE perimeter: there are tracks born at x = −0.9 and 383.7 pt, that
     is, on the arcs of the tips (`rastro.py`, 58 tracks of ≥4 frames).
     23 per side. */
  count: 46,
  /* RUNTIME · each dot's center is born 2.0–2.6 pt from the capsule's
     edge (d0 of the tracks, median 2.2). */
  fromEdge: 2.2,
  /* RUNTIME · the outward travel (Δdist at the end of each track): p10
     1.5–2.3 pt, median 7.6–8.7, p90 14–17. It is not even: most stay
     close and a few go far — a uniform raised to 1.5 between 2 and 17
     gives median 7.3, p10 2.5, p90 14.8. */
  travel: { min: 2, max: 17, bias: 1.5 },
  /* RUNTIME · THE CLOUD INFLATES FROM THE CENTER, it does not shake: each
     particle's final lateral displacement is proportional to its distance
     from the center of the pill, dx ≈ 0.075 × (x₀ − 191): −18.7 and −17.5
     at the left tip, +14.3 at the right one, ~0 in the middle, with ±5 of
     noise. It is what makes the reference's burst read as "clean": they
     all open in the same direction. It used to be ±3 at random, with no
     correlation to the position. */
  expansion: 0.075,
  lateralNoise: 4,
  /* RUNTIME · the median travel advances 22 / 40 / 54 / 66 / 71 / 81 /
     95 % at 67 / 100 / 133 / 167 / 200 / 233 / 300 ms, and the lateral
     displacement saturates along with it (~5 pt at 220–300 ms): a
     quadratic ease-out of ~400 ms for both components, with some spread
     per particle. */
  travelDuration: { min: 350, max: 550 },
  /* RUNTIME · the median peak over the background drops 154 → 114 → 84 →
     79 → 68 → 60 → 50 → 45 between k=4 and k=40 frames (67 ms → 667 ms):
     τ ≈ 330 ms at the start and slower after that; in the clip they live
     ~1.2 s.
     ASSUMED · Vito (2026-09-03): "make them disappear a touch earlier"
     than the "✓ Committed" — they live 700 ms with τ 260 and a soft fade
     from 40 % of their life (280 ms), so that when the sharp text emerges
     (~370 ms after the burst) they are at 30 %, and at 500 ms at 10 %. */
  lifetime: 700,
  tau: 330,
  fadeFrom: 0.4,
  /* RUNTIME · in a capture at 120 ms (burst=0.17) the dots came out grey
     where the clip (f190) has them white: their own brightness does not
     go below .75, and the τ is the one from the clip's first stretch
     (330), not the tail's. */
  brightness: { min: 0.75, max: 1 },
  maxBrightness: 1,
  /* RUNTIME · the area above threshold goes from 31 to 9 px² between k=4
     and k=35, but that is the threshold over a dot that is fading, not a
     dot that is shrinking: barely 20 % of scale so they do not look
     stuck. */
  finalScale: 0.8,
  /* RUNTIME · diameters from 1.6 to 10.7 px = 0.6–4 pt, median 2.6. With
     1.5–4 even, a lossless capture from the workshop gives median 2.8 and
     maximum 4.0, measured with the same threshold as the clip (2.7 / 4.0).
     CAREFUL: the simctl recording showed them as grey dust and led to
     enlarging them to 2–4.5 biased towards the big ones — that gave a
     median of 4.2 and four times as many white pixels as the clip. Video
     compresses small dots; the measurement only holds on a capture. */
  diameter: { min: 1.5, max: 4, bias: 1.4 },
  /* RUNTIME · the brightest colors: pure white, (239,251,247),
     (244,244,244), (225,230,212), (217,227,197) pale green, (187,225,214)
     teal. The mean luminance of the dots in the clip is 153 in the first
     frame: they are not all white. */
  colors: ['#FFFFFF', '#FFFFFF', '#EFFBF7', '#F2F2F2', '#E1E6D4', '#D9E3C5', '#BBE1D6'],
  /* RUNTIME · along the perimeter, tip to tip (x₀ from −0.9 to 383.7 pt),
     at an even step of 10–17 pt with noise. */
  from: 0,
  to: 1,
} as const

/* THE SPARKS — the dots of light that travel INSIDE the pill during the
   hold, ahead of the front. RUNTIME (clip f64–f182, `chispas.py` and
   `chispas2.py`: 24 tracks of ≥3 frames, with the text excluded from the
   detection, so there are fewer than there really are): */
export const SPARKS = {
  /* RUNTIME · 3 alive at a time (median), 7 at most; 0.2 births per frame
     detected. 12 views with 3 lives each are 36 births over the 2 s, plus
     the ones the detection loses behind the text. The lives of one view
     are 620 ms of progress apart, more than the longest life: they never
     overlap. */
  views: 12,
  livesPerView: 3,
  /* RUNTIME · they are born ahead of the geometric front: median +21 pt,
     p90 +64, and there are two born at +96 and +126 (you can see them in
     f122 as loose dots in the dark area). A uniform raised to 2.5 between
     8 and 100 gives median 24, p90 79. A few show up behind it (+22..+29
     of luminance over a background of 190: almost invisible). */
  ahead: { min: 8, max: 100, bias: 2.5 },
  /* RUNTIME · in y they are spread over the whole height: 5.4 to 45.9 pt. */
  y: { min: 5, max: 47 },
  /* RUNTIME · they travel to the right, in the front's direction but
     slower: 1.65–2.5 pt/frame for the bright ones (median 1.86) against
     3.18 for the front → 0.5–0.75 of its speed. The front catches up with
     them and absorbs them: white at 30 % over white is invisible. */
  speed: { min: 0.5, max: 0.75 },
  /* RUNTIME · median life 12 frames, p90 19; the bright ones 13–28
     (220–470 ms). */
  life: { min: 250, max: 450 },
  /* RUNTIME · drift in y: median −0.03 pt/frame, p10 −0.56 → from 0 to
     about −30 pt/s, always upwards or still. */
  driftY: { min: -25, max: 0 },
  /* RUNTIME · ink of 1.5–2 pt (area 8–24 px², median 16 = 4.5 px of
     diameter at 2.709 px/pt) and no hard edge. The `spark` texture is a
     gaussian of σ 1.4 pt in a box of 8 pt; scaled to 0.5–0.7 it leaves
     the visible ink at ~1.5–2.2 pt. */
  box: 8,
  scale: { min: 0.5, max: 0.7 },
  /* RUNTIME · +18..+59 of luminance (median +34) over backgrounds of
     60–110: white at 20–40 % (in a capture, .25–.45 showed a little more
     than the clip in f122). */
  alpha: { min: 0.2, max: 0.38 },
  /* ASSUMED · the fade-in and fade-out curves, as a fraction of the life:
     a spark's brightness rises in 2–3 frames and falls in 4–6 before it
     drops below the threshold. */
  fadeIn: 0.2,
  fadeOut: 0.35,
  /* Progress of the first and the last birth. */
  from: 0.02,
  to: 0.95,
} as const

/* ASSUMED · what the clip cuts off at the top. A big title and one line
   of description, in the same language as what was measured, so that a
   recording of the whole screen has a head. No receipt is possible. */
export const TOP = {
  title: 'Wind Down',
  description: 'Your apps go quiet so you can sleep.',
  titleSize: 34,
  timeFrom: '9:00 PM',
  timeTo: '10:00 PM',
} as const
