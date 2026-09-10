import { MaterialSymbols_700Bold } from '@expo-google-fonts/material-symbols/700Bold'
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import { type ReactNode } from 'react'
import { Image, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

import { COLOR, COMMIT, LABEL, SYMBOL, TEXT } from './measurements'

/* ═══════════════════════════════════════════════════════════════
   THE LABEL — three texts, each with its own PRESENCE, and iOS's
   `.blurReplace` built out of a staircase of blurred copies.

   In the reference the text that leaves BLURS as it fades out and the one
   that arrives focuses as it fades in, centered, with no scale and no
   displacement (magnified strips in `.context/hold-to-commit/cruces`).
   React Native does not blur views in the installed Workshop.app (RN
   0.86's `filter: blur` sits behind a native flag that is off — see
   `media/generate.swift`), so each label has THREE copies: the sharp
   `Text` and two images of the same text already blurred with the same
   SF Pro, one wide (σ 2.5 pt) and one narrow (σ 1.0), tinted with
   `tintColor`. The crossfade is pure opacity on the UI thread.

   THE STAIRCASE. Each label has a presence q (0..1) that the button
   animates with `withTiming`; the three layers read q. A total opacity
   o(q) rises fast (q ∈ [0, .4]) and is split among the layers as a
   PARTITION, the three weights adding up to 1: from the wide one to the
   narrow one in q ∈ [.1, .35], and from the narrow one to the sharp one
   in [.2, 1], with 80 % of the handover in [.2, .45] and the remaining
   20 % as a tail out to 1. The windows came from comparing captures with
   a probe in ms against the clip frame from the same instant
   (`cmp-press-t.png`): with the handover in [.45, .75] the incoming
   label was still blurred at 140 ms where the clip is already sharp. That
   way there is never more ink than the sharp text has: a real blur
   preserves the mass and only spreads it, and with two blurred copies on
   at once the label looked fatter and brighter than in the clip (proved
   in a capture: crossfade=0.35 gave a fattened white text where the clip
   loses ink). Coming in (q rising) it appears as a wide smudge, tightens
   into the narrow one, the sharp one emerges and a faint tail of halo is
   left: a continuous FOCUSING, not a jump. Going out (q falling) it is
   the same path backwards, faster. Why presences and not a single "mix"
   from A to B: an interrupted crossfade, releasing while "Keep
   Holding..." is still appearing, picks each label up from where it is,
   with no need for the curves in and out to be mirror images.

   THE COLOR IS ALSO OPACITY (2026-09-07, "is there any chance of getting
   the same thing animating only transform and opacity?"). The button used
   to animate `color` on the `Text` and `tintColor` on the copies: a prop
   that is neither transform nor opacity, and that the platform
   re-rasterizes. Now "Hold to Buy" and "Keep Holding..." exist THREE
   TIMES, in the three measured inks (the resting one (white; black over
   glass in light mode), the greenish grey (#202B24) and the black), each
   set with its FIXED color and inside a layer whose opacity is the
   partition the button derives from the progress (white 1−t₁, dark
   t₁(1−t₂), black t₂; receipt in HOLD). Two identical texts stacked and
   crossfaded by opacity give exactly the interpolation of the color: in
   the covered pixels the result is white·(1−t) + dark·t. Each set carries
   `needsOffscreenAlphaCompositing` because Android composes children one
   by one and a set at half opacity with its three layers on top of each
   other would come out lighter than the mix (trap 28). "Order Placed" is
   always black: a single set.

   "✓ Order Placed" also COMES IN GROWING from `enterScale` (asked for on
   2026-09-03; the clip does not scale) — the scale follows its presence
   through an ease-out: fast at first, settling slowly. With reduce motion
   there are no blurred copies and no scale: the sharp ones crossfade on
   their own by opacity (animate-expo § 9: the opacity stays, the scale
   goes).

   THE CHECKMARK, depending on the recipe (`contextualCheckmark`). With
   the clip's it comes in glued to the text: the blurred PNGs are of the
   whole row. With the `skill` recipe (2026-09-07, "use better-ui's
   contextual icon technique") it comes in with its own layers and the
   three things better-ui prescribes ("scale 0.25 to 1, opacity 0 to 1,
   blur 4px to 0px") but ON THE SAME CLOCK AND THE SAME STAIRCASE AS THE
   TEXT. Vito (2026-09-07): "do the icon and the Order Placed go together
   at the same time? Make sure of it". There were two ways for them to
   come apart and both are closed off: (1) the checkmark had a 300 ms
   spring of its own while the text took 450 from a delay of 210, so it
   arrived first — now its clock is `pPlaced`, the text's presence; (2)
   with the same clock but opacity q, the text reached full ink at q = .4
   (the staircase rises fast) and the checkmark only at q = 1 — now its
   sharp layer carries `sharp` and its blurred copy `wide + narrow`, which
   is the SAME partition: the total ink and the focused fraction are the
   text's in every frame, and the .25 → 1 scale follows the same ease-out.
   The blur 4 → 0 is those two layers, the PNG at σ 4 pt (or the `filter`
   on Android) and the sharp one. So that the checkmark falls exactly
   where the sharp row puts it, its layer is the SAME row with the text
   invisible, and the text rows carry an empty box the size of the
   checkmark. The PNGs come with a margin (3σ, `generate.swift` prints it)
   that gets subtracted with negative margins so that their layout box is
   the content's.

   THE LABEL FOLLOWS DYNAMIC TYPE up to `TEXT.maxScale` (×1.786, the first
   accessibility size; receipt in measurements.ts): any bigger does not fit
   in a 52 pt pill that does not grow. `maxFontSizeMultiplier` puts that
   ceiling on the texts, and the blurred copies, the checkmark and its gap
   scale by the same factor (`useWindowDimensions().fontScale`, clamped)
   so that the crossfade still lines up. At the default text size the
   factor is 1 and nothing changes. Before (2026-09-02) it was
   `allowFontScaling={false}`; animate-expo § 9 forbids that and the
   ceiling solves the same thing.

   ON ANDROID (2026-09-07, "make it work exactly the same on Android and
   iOS") the blurred copies are NOT the PNGs: they are made with SF Pro,
   which does not exist on Android (the system draws the `Text` in
   Roboto), and a crossfade between an SF smudge and a sharp Roboto looks
   doubled. There the copies are the SAME `Text` with `filter: [{ blur }]`,
   which React Native applies on Android with `RenderEffect` from API 31
   on (SOURCE: react-native 0.86, `BaseViewManager.java:558`; on iOS the
   `filter` with blur is not there). The σs are the same, the staircase is
   the same, and the text is the platform's. Before API 31 there is no
   blur: the sharp ones crossfade, as with reduce motion. The checkmark is
   not SF either: on Android `expo-symbols` draws the `check` from
   Material Symbols at 700 (receipt in `SYMBOL`). `includeFontPadding:
   false` removes the vertical padding Android adds to the text box (iOS
   ignores it).
   ═══════════════════════════════════════════════════════════════ */

export const HOLD = 0, KEEP = 1, PLACED = 2

/* The two σs of the blurred copies, in pt: the ones in `generate.swift`. */
const SIGMA = { wide: 2.5, narrow: 1.0 }
/* SOURCE · better-ui "Contextual icon animations": scale 0.25 → 1, blur 4px → 0. */
const CONTEXTUAL_CHECKMARK = { scaleFrom: 0.25, sigma: 4 }
/* The margin of each PNG in pt: 3σ of the largest σ in its batch, at 3x
   (23 px for the texts, 36 for the checkmark; `generate.swift` prints it). */
const PNG_MARGIN = { text: 23 / 3, checkmark: 36 / 3 }
/* Android draws the copies with `filter: blur` from API 31 on; iOS, with the PNGs. */
const NATIVE_BLUR = Platform.OS === 'android' && Number(Platform.Version) >= 31
const PNG = Platform.OS === 'ios'
/* The checkmark's weight on Android: Material Symbols 700, the same font
   `expo-symbols` ships for its weights. */
type AndroidWeight = Extract<NonNullable<SymbolViewProps['weight']>, { android: unknown }>['android']
const ANDROID_WEIGHT: AndroidWeight = { name: 'MaterialSymbols_700Bold', font: MaterialSymbols_700Bold }

const BLURRED = {
  hold: { a: require('./media/hold-blurred-a.png'), b: require('./media/hold-blurred-b.png') },
  keep: { a: require('./media/keep-blurred-a.png'), b: require('./media/keep-blurred-b.png') },
  /* the whole row, checkmark included: the clip's recipe */
  committed: { a: require('./media/committed-blurred-a.png'), b: require('./media/committed-blurred-b.png') },
  /* the text alone and the checkmark alone: the recipe with the contextual checkmark */
  placed: { a: require('./media/placed-blurred-a.png'), b: require('./media/placed-blurred-b.png') },
  checkmark: require('./media/checkmark-blurred.png'),
}
type Size = { width: number; height: number }
const assetSize = (src: number): Size => {
  const { width, height } = Image.resolveAssetSource(src)
  return { width, height }
}
/* The two levels of a label measure the same (generate.swift uses the
   margin of the largest σ for all of them), so one box per label is enough. */
const SIZE = {
  hold: assetSize(BLURRED.hold.a),
  keep: assetSize(BLURRED.keep.a),
  committed: assetSize(BLURRED.committed.a),
  placed: assetSize(BLURRED.placed.a),
  checkmark: assetSize(BLURRED.checkmark),
}

/* smoothstep between a and b: it softens the edges of each stretch. */
const smoothstep = (v: number, a: number, b: number) => {
  'worklet'
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/* The staircase: the opacity of each layer given the label's presence q.
   A partition of the total opacity: wide + narrow + sharp = o(q). */
const layers = (q: number, noBlur: boolean) => {
  'worklet'
  if (noBlur) return { sharp: q, wide: 0, narrow: 0 }
  const o = smoothstep(q, 0, 0.4)
  const toNarrow = smoothstep(q, 0.1, 0.35)
  const toSharp = 0.8 * smoothstep(q, 0.2, 0.45) + 0.2 * smoothstep(q, 0.45, 1)
  return { wide: o * (1 - toNarrow), narrow: o * (toNarrow - toSharp * toNarrow), sharp: o * toSharp * toNarrow }
}

export type Presence = readonly [SharedValue<number>, SharedValue<number>, SharedValue<number>]
/** The partition of the label's color among its three inks: adds up to 1. */
export type Ink = { white: number; dark: number; black: number }

type Props = {
  ink: SharedValue<Ink>
  /** The resting color: white over the opaque pill, black over glass in light mode. */
  restColor: string
  /** Each label's presence, indexed by HOLD / KEEP / PLACED. */
  presence: Presence
  /** With reduce motion there are no blurred copies and no scale: only the sharp ones crossfade. */
  noBlur: boolean
  /** What scale "✓ Order Placed" comes in from (it comes from the recipe). */
  enterScale?: number
  /** Whether the checkmark comes in with its contextual layers (better-ui) or glued to the text (clip). */
  contextualCheckmark: boolean
}

export function Label({ ink, restColor, presence, noBlur: requestedNoBlur, enterScale = COMMIT.enterScale, contextualCheckmark }: Props) {
  const [pHold, pKeep, pPlaced] = presence
  /* No blur if reduce motion asks for it, or if the platform cannot do it. */
  const noBlur = requestedNoBlur || (!PNG && !NATIVE_BLUR)
  /* The Dynamic Type factor, clamped: the same ceiling
     `maxFontSizeMultiplier` puts on the sharp text. */
  const typeScale = Math.min(useWindowDimensions().fontScale, TEXT.maxScale)
  const box = (t: Size) => ({ width: t.width * typeScale, height: t.height * typeScale })
  /* A PNG with its margin subtracted: its layout box is the content's. */
  const croppedBox = (t: Size, marginPt: number) => ({ ...box(t), margin: -marginPt * typeScale })
  const checkmarkBox = { width: SYMBOL.checkmark.box.width * typeScale, height: SYMBOL.checkmark.box.height * typeScale }
  const gap = { gap: LABEL.checkmarkToText * typeScale }

  /* The three inks: one layer per color, with the partition as opacity. */
  const inkWhite = useAnimatedStyle(() => ({ opacity: ink.get().white }))
  const inkDark = useAnimatedStyle(() => ({ opacity: ink.get().dark }))
  const inkBlack = useAnimatedStyle(() => ({ opacity: ink.get().black }))

  /* Each label's staircase; one animated style serves all three inks. */
  const holdSharp = useAnimatedStyle(() => ({ opacity: layers(pHold.get(), noBlur).sharp }))
  const holdWide = useAnimatedStyle(() => ({ opacity: layers(pHold.get(), noBlur).wide }))
  const holdNarrow = useAnimatedStyle(() => ({ opacity: layers(pHold.get(), noBlur).narrow }))
  const keepSharp = useAnimatedStyle(() => ({ opacity: layers(pKeep.get(), noBlur).sharp }))
  const keepWide = useAnimatedStyle(() => ({ opacity: layers(pKeep.get(), noBlur).wide }))
  const keepNarrow = useAnimatedStyle(() => ({ opacity: layers(pKeep.get(), noBlur).narrow }))
  const placedSharp = useAnimatedStyle(() => ({ opacity: layers(pPlaced.get(), noBlur).sharp }))
  const placedWide = useAnimatedStyle(() => ({ opacity: layers(pPlaced.get(), noBlur).wide }))
  const placedNarrow = useAnimatedStyle(() => ({ opacity: layers(pPlaced.get(), noBlur).narrow }))
  /* The scale of "✓ Order Placed" follows its presence through an ease-out
     (the commit's presence comes in linearly in the clip recipe): it grows
     fast and settles slowly. With reduce motion, none at all. */
  const placedScale = useAnimatedStyle(() => {
    const q = pPlaced.get()
    const eo = 1 - (1 - q) * (1 - q)
    /* The optical correction goes FIRST and in fixed pt: it is a
       correction of position, not part of the movement, so it does not
       scale with the entry (translate before scale, which is also the
       workshop's rule for the order of the array). It does follow Dynamic
       Type: it is a distance in pt of the label, and the label grows. The
       receipt (the three measured numbers and why the reference does not
       do it) is above `LABEL.opticalCorrection` in `measurements.ts`. */
    return {
      transform: [
        { translateX: LABEL.opticalCorrection * typeScale },
        { scale: noBlur ? 1 : enterScale + (1 - enterScale) * eo },
      ],
    }
  })
  /* The contextual checkmark, over the SAME presence and the SAME
     staircase as the text: its sharp layer carries the opacity of the
     text's sharp one and its blurred copy the sum of the two blurred
     ones. That way the total ink and the focused fraction are the text's
     at every instant, and the .25 → 1 scale follows the same ease-out.
     With reduce motion, opacity only. */
  const checkmarkFrame = useAnimatedStyle(() => {
    const q = pPlaced.get()
    const eo = 1 - (1 - q) * (1 - q)
    return { transform: [{ scale: noBlur ? 1 : CONTEXTUAL_CHECKMARK.scaleFrom + (1 - CONTEXTUAL_CHECKMARK.scaleFrom) * eo }] }
  })
  const checkmarkSharp = useAnimatedStyle(() => ({ opacity: layers(pPlaced.get(), noBlur).sharp }))
  const checkmarkBlurred = useAnimatedStyle(() => {
    const c = layers(pPlaced.get(), noBlur)
    return { opacity: c.wide + c.narrow }
  })

  const text = (s: string, color: string) => (
    <Text maxFontSizeMultiplier={TEXT.maxScale} style={[css.text, { color }]}>
      {s}
    </Text>
  )
  /* A blurred copy: on iOS the tinted PNG; on Android the content with `filter`. */
  const blurred = (png: number, t: Size, color: string, sigma: number, content: ReactNode, marginPt?: number) =>
    PNG ? (
      <Image source={png} style={[marginPt === undefined ? box(t) : croppedBox(t, marginPt), { tintColor: color }]} />
    ) : (
      <View style={{ filter: [{ blur: sigma }] }}>{content}</View>
    )
  /* "Hold to Buy" and "Keep Holding..." in one ink: the six layers. */
  const inkLayers = (color: string) => (
    <>
      {!noBlur && <Animated.View style={[css.layer, holdWide]}>{blurred(BLURRED.hold.a, SIZE.hold, color, SIGMA.wide, text(LABEL.rest, color))}</Animated.View>}
      {!noBlur && <Animated.View style={[css.layer, holdNarrow]}>{blurred(BLURRED.hold.b, SIZE.hold, color, SIGMA.narrow, text(LABEL.rest, color))}</Animated.View>}
      <Animated.View style={[css.layer, holdSharp]}>{text(LABEL.rest, color)}</Animated.View>
      {!noBlur && <Animated.View style={[css.layer, keepWide]}>{blurred(BLURRED.keep.a, SIZE.keep, color, SIGMA.wide, text(LABEL.holding, color))}</Animated.View>}
      {!noBlur && <Animated.View style={[css.layer, keepNarrow]}>{blurred(BLURRED.keep.b, SIZE.keep, color, SIGMA.narrow, text(LABEL.holding, color))}</Animated.View>}
      <Animated.View style={[css.layer, keepSharp]}>{text(LABEL.holding, color)}</Animated.View>
    </>
  )

  const symbol = (
    <SymbolView
      name={{ ios: SYMBOL.checkmark.name, android: SYMBOL.checkmark.android }}
      scale="large"
      weight={{ ios: SYMBOL.checkmark.weight, android: ANDROID_WEIGHT }}
      tintColor={COLOR.blackInk}
      size={PNG ? undefined : checkmarkBox.height}
      style={checkmarkBox}
    />
  )
  /* "Order Placed" with its measured weight (semibold, like the other two; the receipt is in TEXT). */
  const placedText = (
    <Text maxFontSizeMultiplier={TEXT.maxScale} style={[css.text, { fontWeight: TEXT.committedWeight, color: COLOR.blackInk }]}>
      {LABEL.placed}
    </Text>
  )
  /* The measured row: checkmark and text together, and the PNGs of the whole row. */
  const measuredRow = (
    <View style={[css.row, gap]}>
      {symbol}
      {placedText}
    </View>
  )
  /* The row with the contextual checkmark: the text with an empty box
     where the checkmark goes, and the checkmark in its own layer with the
     text invisible. */
  const textRow = (content: ReactNode) => (
    <View style={[css.row, gap]}>
      <View style={checkmarkBox} />
      {content}
    </View>
  )
  const checkmarkRow = (
    <View style={[css.row, gap]}>
      <Animated.View style={[checkmarkBox, checkmarkFrame]}>
        {!noBlur && (
          <Animated.View style={[StyleSheet.absoluteFill, checkmarkBlurred]}>
            {blurred(BLURRED.checkmark, SIZE.checkmark, COLOR.blackInk, CONTEXTUAL_CHECKMARK.sigma, symbol, PNG_MARGIN.checkmark)}
          </Animated.View>
        )}
        <Animated.View style={[StyleSheet.absoluteFill, checkmarkSharp]}>{symbol}</Animated.View>
      </Animated.View>
      <Text maxFontSizeMultiplier={TEXT.maxScale} style={[css.text, { fontWeight: TEXT.committedWeight }, css.invisible]}>
        {LABEL.placed}
      </Text>
    </View>
  )

  return (
    /* `key={typeScale}`: a live Dynamic Type change enlarges the glyphs
       but does not re-measure the `Text` box (RUNTIME: at AX5 the label
       came out clipped in the 17 pt box); remounting the label measures it
       again. */
    <View key={typeScale} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Hold to Buy and Keep Holding..., in their three inks */}
      <Animated.View needsOffscreenAlphaCompositing style={[css.layer, inkWhite]}>
        {inkLayers(restColor)}
      </Animated.View>
      <Animated.View needsOffscreenAlphaCompositing style={[css.layer, inkDark]}>
        {inkLayers(COLOR.darkInk)}
      </Animated.View>
      <Animated.View needsOffscreenAlphaCompositing style={[css.layer, inkBlack]}>
        {inkLayers(COLOR.blackInk)}
      </Animated.View>

      {/* ✓ Order Placed — the layers inside the view that scales */}
      <Animated.View style={[css.layer, placedScale]}>
        {contextualCheckmark ? (
          <>
            {!noBlur && (
              <Animated.View style={[css.layer, placedWide]}>
                {textRow(blurred(BLURRED.placed.a, SIZE.placed, COLOR.blackInk, SIGMA.wide, placedText, PNG_MARGIN.text))}
              </Animated.View>
            )}
            {!noBlur && (
              <Animated.View style={[css.layer, placedNarrow]}>
                {textRow(blurred(BLURRED.placed.b, SIZE.placed, COLOR.blackInk, SIGMA.narrow, placedText, PNG_MARGIN.text))}
              </Animated.View>
            )}
            <Animated.View style={[css.layer, placedSharp]}>{textRow(placedText)}</Animated.View>
            <View style={css.layer}>{checkmarkRow}</View>
          </>
        ) : (
          <>
            {!noBlur && <Animated.View style={[css.layer, placedWide]}>{blurred(BLURRED.committed.a, SIZE.committed, COLOR.blackInk, SIGMA.wide, measuredRow)}</Animated.View>}
            {!noBlur && <Animated.View style={[css.layer, placedNarrow]}>{blurred(BLURRED.committed.b, SIZE.committed, COLOR.blackInk, SIGMA.narrow, measuredRow)}</Animated.View>}
            <Animated.View style={[css.layer, placedSharp]}>{measuredRow}</Animated.View>
          </>
        )}
      </Animated.View>
    </View>
  )
}

const css = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: TEXT.body, fontWeight: TEXT.buttonWeight, includeFontPadding: false },
  invisible: { opacity: 0 },
  row: { flexDirection: 'row', alignItems: 'center' },
})
