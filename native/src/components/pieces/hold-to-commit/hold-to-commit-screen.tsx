import { useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { type Load, LoadJS, hasJSLoad, isHeavyLoad, hasRenderLoad } from './load'
import { BACKGROUND, BACKGROUNDS, type Background } from './background'
import { StockBackground, palette } from './backgrounds/stock'
import { BlocksBackground } from './backgrounds/blocks'
import { OpalBackground } from './backgrounds/opal'
import { HoldToCommit, type ColorScheme } from './hold-to-commit'
import { MATERIAL, MATERIALS, type Material } from './material'
import { Meter } from './meter'
import { LIGHT, COLOR, SCREEN, PILL, SECTION } from './measurements'
import { RECIPE, RECIPES, type Recipe } from './recipe'
import { LOAD, MEASURE, RECEIVER, PROBE } from './probe'

/* ═══════════════════════════════════════════════════════════════
   HOLD TO COMMIT: the screen, self-contained: the button, and behind it
   whatever `background` says. The route (`src/app/[slug].tsx`) finds it
   in the registry by its slug and mounts it; here the knobs get read and
   everything gets composed. In the exhibition the piece is called `Hold
   to buy`: the slug stayed the one from the day it was published (see
   `Piece` in `src/pieces.ts` of the web repo).

   The reference is `VAULT_DIR/nativo/Hold to commit.mp4`: the **Opal**
   button (Screen Time Control, Apple Design Award 2025), published by
   @60fpsdesign on X and cataloged on 60fps.design as "Opal Hold to
   Commit Button Interaction"; 60 fps. Measured frame by frame: every
   value's receipt is in `measurements.ts` and the measuring scripts are
   in `.context/hold-to-commit/`.

   THE FOLDER HAS THE SHAPE OF components/animations/<slug>/ FROM
   react-native-motion, with its same names: `index.tsx` exports this
   screen by default, `hold-to-commit.tsx` is the button (the mechanism),
   and next to it its parts (`label`, `sparks`, `particles`), its values
   with receipts (`measurements.ts`, `recipe.ts`), the haptics and the
   sound, the variants (`background.ts`, `material.ts`; the drawn
   backgrounds, in `backgrounds/`) and the measuring scaffolding
   (`probe.ts`, `load.tsx`, `meter.tsx`).

   The button is the same in every variant and does not know which one is
   set: it takes its width, its recipe, its probe and the screen's COLOR
   SCHEME, and nothing else. What changes is what is behind it and where
   the pill sits (at the foot, like in the clip, or centered). The
   variants are described in `background.ts`; the Opal screen, measured,
   lives in `backgrounds/opal.tsx`.

   THE COLOR SCHEME IS DECIDED BY THE SCREEN, not by the system: the Opal
   backgrounds and their skeletons are always dark (the clip is dark), so
   only `stock` follows the system's light/dark mode. The button, the
   chips and the status bar take that scheme and consult nothing.

   With `background = 'choose'` or `recipe = 'choose'` a selector appears
   at the top to go from one variant to another live. It is scaffolding
   for the exploration: it goes when there is a winner.

   THE LOAD AND THE METER are performance scaffolding (`load.tsx`,
   `meter.tsx`): with `load` the JS thread gets busy and/or the detail
   page under the button re-renders at 10 Hz; with `measure`, frames and
   latencies get counted for 9 s and reported on the console.

   THE KNOBS, by URL or written into a file. The probe (`?park=0.5`,
   `commit`, `burst=0.2`, `crossfade=25`, `crossfade-commit=308`,
   `crossfade-release=217`, `auto`, `auto-release`) leaves the piece in a
   fixed state per reload so you can measure it against the clip; it does
   nothing if you do not pass it. By URL or, easier from the terminal, by
   writing it into `probe.ts` (see there why). The background
   (`?background=plain`, or `BACKGROUND` in `background.ts`) picks what is
   behind the button, and the recipe (`?recipe=skill`, or `RECIPE` in
   `recipe.ts`) picks what curves and timings it carries: the ones
   measured off the clip or the ones from the animate-expo tables. With
   `'choose'` the piece shows a selector to change them live.
   `HoldToCommitScreen` reads them, and that is what the registry mounts;
   `Screen` takes everything already decided.

   When it is ready:  pnpm record hold-to-commit
   ═══════════════════════════════════════════════════════════════ */

/* What the registry mounts. The file knobs win over the URL for the
   probe, the load, the meter and the receiver (they are the ones a script
   writes and an old link must not override); for the background, the
   recipe and the material the URL wins, since those are the ones you
   change while looking. It is the same precedence the route had when
   there was one per piece. */
export function HoldToCommitScreen() {
  const { park, background, recipe, material, load, measure } = useLocalSearchParams<{
    park?: string
    background?: Background
    recipe?: Recipe
    material?: Material
    load?: Load
    measure?: string
  }>()
  return (
    <Screen
      probe={PROBE ?? park}
      background={background ?? BACKGROUND}
      recipe={recipe ?? RECIPE}
      material={material ?? MATERIAL}
      load={LOAD ?? load}
      measure={MEASURE || measure === '1'}
      receiver={RECEIVER}
    />
  )
}

type Props = {
  probe?: string
  background: Background | 'choose'
  recipe: Recipe | 'choose'
  material: Material | 'choose'
  load?: Load
  measure?: boolean
  /** Where the meter sends the report, besides the console. */
  receiver?: string
}

/* How long the whole sequence lasts with the `auto` probe: 700 ms of
   waiting, 1 s of hold, the burst, 5 s until the reset and the fade. */
const METER_WINDOW = 9000

function Screen({ probe, background: requestedBackground, recipe: requestedRecipe, material: requestedMaterial, load, measure = false, receiver }: Props) {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const system = useColorScheme()
  const [chosenBackground, setChosenBackground] = useState<Background>(requestedBackground === 'choose' ? BACKGROUNDS[0]! : requestedBackground)
  const [chosenRecipe, setChosenRecipe] = useState<Recipe>(requestedRecipe === 'choose' ? RECIPES[0]! : requestedRecipe)
  const [chosenMaterial, setChosenMaterial] = useState<Material>(requestedMaterial === 'choose' ? MATERIALS[0]! : requestedMaterial)
  const background = requestedBackground === 'choose' ? chosenBackground : requestedBackground
  const recipe = requestedRecipe === 'choose' ? chosenRecipe : requestedRecipe
  const material = requestedMaterial === 'choose' ? chosenMaterial : requestedMaterial
  const scheme: ColorScheme = background === 'stock' && system === 'light' ? 'light' : 'dark'
  const pillWidth = width - 2 * SCREEN.pillMargin
  const pillTop = insets.bottom + PILL.aboveSafeArea + PILL.height

  return (
    <View style={[css.screen, background === 'stock' && { backgroundColor: palette(scheme).background }]}>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      {background === 'opal' && <OpalBackground pillTop={pillTop} paddingTop={insets.top} />}
      {background === 'blocks' && <BlocksBackground paddingTop={insets.top} />}
      {/* `stock` scrolls UNDER the button, which floats: that is what makes
          the glass read (it refracts what passes behind it) and it is how a
          primary button floats on iOS 26. */}
      {background === 'stock' && (
        <StockBackground paddingTop={insets.top} paddingBottom={insets.bottom + PILL.aboveSafeArea + PILL.height + SECTION.toPill} live={hasRenderLoad(load)} />
      )}
      {(background === 'plain' || background === 'centered') && <View style={css.stretch} />}

      <View
        pointerEvents="box-none"
        style={[
          css.foot,
          (background === 'opal' || background === 'blocks') && css.footOpal,
          background === 'stock' ? [css.floating, { bottom: insets.bottom + PILL.aboveSafeArea }] : { marginBottom: background === 'centered' ? 0 : insets.bottom + PILL.aboveSafeArea },
        ]}
      >
        <HoldToCommit width={pillWidth} recipe={recipe} probe={probe} spill={background === 'opal'} material={material} scheme={scheme} />
      </View>
      {background === 'centered' && <View style={css.stretch} />}

      {(requestedBackground === 'choose' || requestedRecipe === 'choose' || requestedMaterial === 'choose') && (
        <View pointerEvents="box-none" style={[css.selector, { top: insets.top + 8 }]}>
          {requestedBackground === 'choose' && <Selector options={BACKGROUNDS} active={background} choose={setChosenBackground} scheme={scheme} />}
          {requestedRecipe === 'choose' && <Selector options={RECIPES} active={recipe} choose={setChosenRecipe} scheme={scheme} />}
          {requestedMaterial === 'choose' && <Selector options={MATERIALS} active={material} choose={setChosenMaterial} scheme={scheme} />}
        </View>
      )}

      {hasJSLoad(load) && <LoadJS heavy={isHeavyLoad(load)} />}
      {measure && <Meter context={`${load ?? 'no load'} · ${recipe} · ${material} · ${scheme}`} windowMs={METER_WINDOW} receiver={receiver} />}
    </View>
  )
}

/* A row of chips: chrome for the exploration, not a candidate. It follows
   the screen's color scheme: in light mode, iOS's system grays. */
function Selector<T extends string>({ options, active, choose, scheme }: { options: readonly T[]; active: T; choose: (o: T) => void; scheme: ColorScheme }) {
  const light = scheme === 'light'
  return (
    <View style={css.row}>
      {options.map((o) => {
        const isActive = o === active
        return (
          <Pressable
            key={o}
            onPress={() => choose(o)}
            hitSlop={6}
            style={[css.option, { backgroundColor: light ? (isActive ? LIGHT.chipActive : LIGHT.chip) : isActive ? COLOR.chipActive : COLOR.chip }]}
          >
            <Text allowFontScaling={false} style={[css.optionText, { color: light ? (isActive ? LIGHT.chipTextActive : LIGHT.chipText) : isActive ? COLOR.text : COLOR.secondary }]}>
              {o}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const css = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLOR.background },
  stretch: { flex: 1 },
  foot: { alignItems: 'center' },
  /* With cards above it (Opal or its skeleton) the pill goes at the
     measured distance from the last card: nothing touches it. */
  footOpal: { marginTop: SECTION.toPill },
  /* The button floating over the content, at the same distance from the edge. */
  floating: { position: 'absolute', left: 0, right: 0 },
  selector: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  option: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  optionText: { fontSize: 12, fontWeight: '600' },
})

/*
 * Do not touch without measuring again
 *
 * - The hold lasts `HOLD.duration` and the LongPress fires on the SAME
 *   number on purpose. If they are separated, the fill arrives before or
 *   after the gesture completes. It has been 1000 ms since 2026-09-07
 *   (asked for, first 1500 and then 1000); what was measured in the clip
 *   is 2000, and everything that is a function of the progress compresses
 *   by itself.
 *   RUNTIME: 121 frames from the press to the burst; linear front at 7.75
 *   px/frame. SOURCE: both read HOLD.duration.
 *
 * - The front is an erfc of σ = 19 pt CENTERED on the geometric edge and
 *   shaped like a capsule, SCALED in x around that edge (.66 + .36·p:
 *   narrower at the start). And the geometric edge goes from 4.5 % to
 *   95.5 % of the width in the 2 s, not tip to tip; on completion it
 *   slides to 101 % while it whitens.
 *   RUNTIME: 50 % of the front every 100 ms f76…f181 (174 pt/s, 93.5 % at
 *   f181); width 90→10 % 51→64 pt over the course of the hold; verified in
 *   a capture to ±5 at p .23 / .5 / .74 / .99.
 *
 * - The blob's left tip DARKENS and WIDENS as the front moves away: the
 *   veil's texture is the one from the end (f181) and it gets scaled in x
 *   from the tip, s = .25 + .75·p; it is inverted PER CHANNEL against the
 *   target color (pale green). A gray veil cannot give (150,172,156), and
 *   a fixed one cannot give 249 → 183 at 38 pt.
 *   RUNTIME: f88…f181 every 6 frames; verified exactly at four progresses.
 *
 * - The fill TURNS ON in 330 ms with ease-in-out (it starts slow), and on
 *   release it goes out with an exponential of τ = 60 ms while the front
 *   retreats slowly (400 ms ease-out).
 *   RUNTIME: peak 10 pt from the edge f63…f80 and f13…f20; capture to ±7.
 *
 * - The pill scales to .953 on press, with a QUADRATIC ease-out of 250 ms.
 *   With bezier(.23,1,.32,1) it closes twice as fast. On completion it
 *   comes back with a 25 % jump in one frame and 220 ms of ease-out.
 *   RUNTIME: edges 157→182 / 1194→1169; 16/52/80/96 % at 1/4/8/13 frames;
 *   width 364→369→374→378→380→382 in f182…f195, capture to ±1.3 pt.
 *
 * - The label is semibold 17 in all three states. "Committed" only looks
 *   bold because "Keep Holding..." is shrunk by the press.
 *   RUNTIME: ink widths 121.1 / 118.9 / 86.7 pt against SF measured on
 *   macOS: medium and bold land 2–4 % away. The texts have been "Hold to
 *   Buy" / "Keep Holding..." / "✓ Order Placed" since 2026-09-04 (asked
 *   for: a button for buying); the weight measurement is from Opal's and
 *   holds just the same. The blurred copies are regenerated with
 *   `media/generate.swift`.
 *
 * - The label's color comes out of the PROGRESS: white → greenish gray
 *   (#202B24) between .55 and .70 with ease-out, and a step to black at
 *   .965.
 *   RUNTIME: luminance minimum in "Ke": 253 in f128 → 47 in f146 →
 *   plateau until f177 → 26 in f178.
 *
 * - The label crossfades are blur-replace with TWO blurred copies per text
 *   (σ 2.5 and 1.0, rasterized in Swift, tinted with tintColor) and a
 *   staircase that is a partition of the opacity; each label has its own
 *   presence. They are asymmetric: press 360 ease-out / 48; release 600
 *   linear from 150 / 250 from 80; commit 450 linear from 210 / 280 from
 *   40. "✓ Committed" comes in growing from .9 (ASSUMED, asked for).
 *   RUNTIME: the stem of the "i" in Commit and in Holding frame by frame
 *   (f61–f95, f10–f44, f184–f220); verified with probes in ms against the
 *   clip frame from the same instant.
 *
 * - The sparks inside the pill are a function of the progress: they are
 *   born 8–100 pt ahead of the front, travel right at 50–75 % of its speed
 *   and live 250–450 ms. 12 views × 3 lives.
 *   RUNTIME: 24 tracks linked in f64–f182 (chispas2.py).
 *
 * - The burst OPENS from the center: final dx = 0.075 × (x₀ − center),
 *   plus the travel along the normal (2–17 pt, median 7), tips included.
 *   Without that correlation the cloud shakes and looks dirty.
 *   RUNTIME: 58 tracks linked (rastro.py), −18.7 / +14.3 at the tips.
 *
 * - The particles are measured in a CAPTURE, never in the simctl
 *   recording: the video compresses them until they are dust and it
 *   fooled us twice.
 *   RUNTIME: median peak 175/125/81 at 36/204/516 ms against 189/127/84 in
 *   the clip; median diameter 2.7 against 2.7.
 *
 * - SF Symbols carry their natural box and scaleAspectFit: SymbolView's
 *   `size` is not the pointSize (it always rasterizes at 14).
 *   SOURCE: expo-symbols/ios/SymbolView.swift:127.
 *
 * - On completion Apple Pay's success sound plays (`sound.ts`,
 *   `media/purchase.wav` = iOS's `payment_success.caf`; AN APPLE ASSET,
 *   not redistributed), fired 60 ms before the end of the hold from the
 *   same clock as the fill, only if the iPhone is not on silent and
 *   without pausing other apps. Preheated player: reusing one with
 *   `seekTo` + `play` dropped hits, and creating it on the spot took too
 *   long. Expo Go ships `expo-audio`; the dev client does not.
 *
 * - The haptics follow the animate-expo § 8 table: `selectionAsync` at
 *   each of the twelve detents (accelerating from 300 to 60 ms) and
 *   Success on completion; pressing and releasing do not vibrate. It has
 *   no receipt: the clip is video. It gets tuned with the phone in hand,
 *   in `haptics.ts` and nowhere else.
 *
 * - EVERY `withTiming` in the button carries `reduceMotion: Never`, and
 *   reduce motion is applied by hand: no scale, no sweep (the whole fill
 *   with the progress as its opacity), no sparks, no burst and no blurred
 *   copies; opacity and color are left. With Reanimated's default
 *   (`System`) the fill jumped in whole on the press frame.
 *   RUNTIME: mean luminance of the pill 64.2 → 182.0 in one frame and
 *   pinned there for the 2 s, simulator B with Reduce Motion (2026-09-04).
 *
 * - The label follows Dynamic Type up to ×1.786 (`TEXT.maxScale`, the
 *   first accessibility size); the blurred copies and the checkmark scale
 *   by the same factor. Any bigger does not fit in a 52 pt pill.
 *   SOURCE: RCTAccessibilityManager.mm:267; line box 20.3 × 1.786.
 *
 * - The curves and the timings are a RECIPE (`recipe.ts`): `clip` is what
 *   was measured; `skill` is the animate-expo tables to the letter, so
 *   they can be compared live without losing the faithful one. The probes
 *   measure `clip`.
 *
 * - The reset at 5 s is a workshop ASSUMPTION (the clip does not show it)
 *   and it is a FADE in two phases, never a sweep: first the white veil
 *   and the fill go out along with the outgoing label, and only with the
 *   fill invisible does the progress go back to 0 and the resting label
 *   come in. If the progress is animated to 0 with the fill visible, you
 *   see the front retreat and the transition gets dirty.
 *   RUNTIME: the inside of the pill 217 → 177 → 141 → 104 → 74 → 58,
 *   evenly.
 *
 * - The backgrounds are variants (`background.ts`): `stock`, the chosen
 *   one, is an asset's detail page measured from Robinhood's official
 *   screenshot, in a single gray; `opal` is the clip's screen and the only
 *   one with a spill. `stock` follows light/dark mode with system colors
 *   (`PlatformColor`): nothing to maintain. RUNTIME: bar (43,43,46) in
 *   dark and (228,228,230) in light.
 *
 * - The button's material is a variant (`material.ts`): `opaque` is the
 *   measured pill; `glass` is native Liquid Glass, `regular` with no tint
 *   and interactive, as the CONTAINER of the pill (GLASS.md: it does not
 *   get clipped and does not go under an animated opacity; the child clips
 *   itself), with no sheen, no veil and no press scale. The `stock`
 *   background scrolls under the button, which floats: with no content
 *   behind it, the glass does not read.
 *
 * - The COLOR SCHEME is decided by the screen (the button's `scheme`):
 *   only with `stock` does it follow the system; the Opal backgrounds are
 *   always dark. In light mode the opaque pill stays dark but with no
 *   sheen and no veil, and the burst is the color of the pill; the chips
 *   use the system grays (`LIGHT`, ASSUMED). RUNTIME:
 *   `cmp/claro-tablero.png`.
 *
 * - Android draws the same thing as iOS: system colors written out
 *   (`PALETTE`, not `PlatformColor`: on Android it gives transparent),
 *   blurred copies with `filter: blur` from API 31 on instead of SF's
 *   PNGs, `check` checkmark from Material Symbols at 700,
 *   `includeFontPadding: false`. RUNTIME: `cmp/android-tablero.png`
 *   (Pixel 9 emulator).
 *
 * - The reset runs on UI (`withDelay` over `wait`), not in a
 *   `setTimeout`: it arrives 5030 ms after the commit with JS blocked.
 *   `reset` is declared BEFORE `complete`, which calls it from a callback
 *   (a worklet captures `undefined` if the const comes later). RUNTIME:
 *   `meter.tsx` under `load.tsx` (`heavy`).
 *
 * - Only transform and opacity: the label's color is three sets of the
 *   text in its three inks with the partition of the progress as their
 *   opacity (`ink`); no view animates `color` or `tintColor`.
 *
 * - The active recipe is `clip` (`RECIPE`), the measured one: Vito asked
 *   for it back on 2026-09-07 after seeing the `skill` one ("different,
 *   especially the ending"). RUNTIME: rest, 0.5, commit and
 *   crossfade-commit=150 give infinite PSNR against the captures from
 *   before the rewrite. The `skill` one is still there in full, springs
 *   with duration and bounce 0 where there was a finger,
 *   `overshootClamping` on the retreat, contextual checkmark, with
 *   `?recipe=skill`.
 *
 * - The checkmark in "Order Placed" comes in with opacity 0 → 1, scale
 *   .25 → 1 and blur 4 → 0 (better-ui, contextual icon); in `clip`, glued
 *   to the text. IT HAS NO CLOCK OF ITS OWN: it reads `pPlaced`, the
 *   text's presence, and its two layers carry the same partition of the
 *   staircase as the text (sharp `sharp`, blurred `wide + narrow`), so the
 *   icon and "Order Placed" cannot come apart in any recipe (asked for on
 *   2026-09-07). The only thing that tells them apart is the prescribed
 *   scale.
 *   RUNTIME: `cmp/tilde-de-la-mano.png` and `tilde.py`. In `clip` the two
 *   inks stay within ±1.5 percentage points at every q; in `skill` the
 *   difference left is exactly the area of the checkmark at that scale.
 *
 * - One single state, `stage` (an integer): rest, hold, sounding, commit,
 *   reset. The storyboard at the top of `hold-to-commit.tsx` reads like
 *   the sequence and has no numbers of its own: they all live in
 *   `recipe.ts` and `measurements.ts`.
 *
 * - Nothing visible depends on JS: 0 frames dropped in the sequence under
 *   `all` and `heavy` (iOS dev, Android production). What crosses to JS,
 *   the haptics and the sound, waits however long JS takes: up to ~90 ms
 *   under `heavy`, ≤ 12 ms under `all`. Without the native module there is
 *   no more than that in Expo Go. Knobs: `LOAD`, `MEASURE`, `RECEIVER` in
 *   `probe.ts` (or `?load=`, `?measure=1`).
 *
 * - THE BUTTON IS NOT A LITERAL COPY OF THE CLIP, and in three things it
 *   departs from it on purpose: the 1 pt ring is not drawn and a two-layer
 *   shadow goes in its place; "✓ Order Placed" is moved 6.6 pt to the
 *   left; and in light mode the page is iOS's grouped gray and not pure
 *   white. RUNTIME: the ring pulled +54.5 away from what it had 2 pt
 *   outside against +4 in the clip; the label's text fell +13.67 pt to the
 *   right of the center and the centroid +6.60, and the correction is that
 *   Δ canceled out (verified at −0.06).
 *
 *   For a while both versions coexisted behind a chip (the file
 *   acabado.ts, with the reference values and reviewed). The chip came out
 *   when the exploration ended and the whole file was deleted afterwards:
 *   a knob with a single position is not a knob, and the record of what
 *   the clip does does not live in a dead branch of the code but in the
 *   the log and in the receipts in `measurements.ts`.
 *
 * - The shadow carries a `borderRadius` and it is not decoration:
 *   `boxShadow` follows the shape of the VIEW, and without the radius it
 *   draws a box with sharp corners around the capsule.
 *
 * - The button reaches FULL WHITE in both themes, like the reference. That
 *   it did not get lost against the page in light mode was not fixed by
 *   dimming the fill (that was tried and discarded) but by moving the
 *   background. The protagonist does not get dirtied to fix the set.
 *
 * - The `stock` background ends ABOVE the button: the `paddingBottom`
 *   bounds the `ScrollView`'s viewport, not the content. A `paddingBottom`
 *   on the content only adds air at the end and the rows keep on drawing
 *   behind the pill. And the content ends before that edge: cut flush it
 *   reads as a layout error.
 *   RUNTIME: 742 pt of content against an edge at 831.
 */
