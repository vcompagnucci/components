import { type ColorValue, ScrollView, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'

import { useTick } from '../load'

/* ═══════════════════════════════════════════════════════════════
   THE "STOCK" BACKGROUND: an asset's detail page in a finance app, as a
   skeleton. Vito asked for it (2026-09-04): "make it look like it is from
   a finance app, Robinhood style, and make the button at the bottom a buy
   button"; then "without much detail though, all skeletons"; and then
   "don't add colors to the background and make it much more of a
   skeleton".

   THE REFERENCE IS MEASURED, not remembered: Robinhood's official
   screenshot in the App Store (2026.35.0, "Trade crypto at the lowest cost
   on average", `.context/hold-to-commit/robinhood/rh-03-grande.png`,
   1242 × 2208), measured with `robinhood/medir.py`. The mockup has 971 px
   of screen; assuming an iPhone 16 Pro (402 pt) that gives 2.415 px/pt,
   and the "C" of the title measures 24 pt of capital = 34 pt of font,
   iOS's Large Title: the scale closes. Everything below the range picker
   (where the screenshot ends) is ASSUMED and is marked as such.

   ONE SINGLE GRAY AND NO COLOR. Each text is a bar (height 0.82 × the
   font size it replaces, centered in its line box), the chart is a smooth
   curve in the same gray, with no noise, and the selected range is a pill
   in the same gray with a bar the color of the background inside it. The
   reference has the line and the pill in lime (204,255,0): it was
   measured and it is NOT used, on request. Nothing competes with the
   button.

   LIGHT AND DARK MODE (asked for on 2026-09-04): the three colors are
   iOS's SYSTEM COLORS: `systemBackground` (white / black), `systemFill`
   (the bar) and `separator` (the hairline), written out with their
   values. SOURCE: UIKit's system color table (HIG › Color): systemFill is
   (120,120,128) at 20 % in light and at 36 % in dark; separator,
   (60,60,67) at 29 % and (84,84,88) at 60 %. Over black, systemFill gives
   (43,43,46): the same gray measured in `blocks` (#2A2A2A, 42) to within
   one level, so dark mode did not change. RUNTIME in the `sim/modo-*`
   captures.

   Until 2026-09-07 they were asked for with
   `PlatformColor('systemFillColor')`, dynamic and with no `if`. It was
   changed because of Android: those names are UIKit's, and on Android
   `PlatformColor` only resolves resource paths (`@android:color/…`,
   `?attr/…`); with a name that does not resolve, `FabricUIManager.getColor`
   returns 0 (SOURCE: react-native 0.86, `FabricUIManager.java:573`), that
   is, TRANSPARENT: background and bars invisible, with no error. The
   written values are the same pixels on both systems, and `useColorScheme`
   changes them live.

   LIVE (`live`, for the simulated load in `load.tsx`): the value bars in
   the grids change width ten times a second, like a quote list updating.
   It is a re-render of the whole detail page at 10 Hz: the render load of
   a real app, with the piece on top. Without `live` nothing runs.

   THE BACKGROUND SCROLLS UNDER THE BUTTON, which floats (2026-09-04, for
   the glass button: the material only reads when there is something
   behind it to refract, and that is how a primary button floats on
   iOS 26). That is why it is a full-screen `ScrollView`, longer than the
   screen, with a `paddingBottom` the height of the button's zone so that
   the last row can rise above it. What is below the range picker is
   ASSUMED and fills the page out: two headers with their grids and a
   paragraph. They end ABOVE the button, not underneath it (see the
   `ScrollView`'s comment).

   THE CHART IS SEGMENTS: React Native does not draw lines and the
   workshop does not add Skia or SVG (Expo Go). A Catmull-Rom through
   eight control points with the clip's shape (flat, and the rise in the
   last third up to the maximum) sampled at 43 points; each stretch is a
   view 3 pt tall rotated from its left end. Still views: nothing runs per
   frame.
   ═══════════════════════════════════════════════════════════════ */

/* The three system colors, per color scheme. */
type Palette = { background: ColorValue; bar: ColorValue; hairline: ColorValue }
const PALETTE: Record<'dark' | 'light', Palette> = {
  dark: {
    /* RUNTIME · the reference's background: (0,0,0) in every gap: `systemBackground` in dark. */
    background: '#000000',
    /* SOURCE · `systemFill` in dark: (120,120,128) at 36 % = (43,43,46) over black. */
    bar: 'rgba(120,120,128,0.36)',
    /* SOURCE · `separator` in dark: (84,84,88) at 60 %. */
    hairline: 'rgba(84,84,88,0.6)',
  },
  light: {
    /* SOURCE · `systemGroupedBackground` in light, (242,242,247), and NOT
       `systemBackground` (pure white), which is what was there.
       Vito, 2026-09-08: "I don't like how you solved the color thing, if
       anything change the background color a little, since it isn't the
       main thing here". He was right in both halves. The first version
       dimmed the button's FILL so that it would not disappear against a
       white page: it dirtied the protagonist to fix the set. And the set
       here is a skeleton, it is not the piece. It is also the color iOS
       uses for exactly this: the page that light surfaces sit on. The
       button goes back to reaching full white, like in the reference. */
    background: '#F2F2F7',
    /* SOURCE · `systemFill` in light: (120,120,128) at 20 % = (228,228,230) over white (RUNTIME: the same). */
    bar: 'rgba(120,120,128,0.2)',
    /* SOURCE · `separator` in light: (60,60,67) at 29 %. */
    hairline: 'rgba(60,60,67,0.29)',
  },
}
export const palette = (scheme: string | null | undefined): Palette => (scheme === 'light' ? PALETTE.light : PALETTE.dark)

const STOCK = {
  /* RUNTIME · title, price and change all start 33.5–34 pt from the left
     edge of the screen. */
  margin: 34,
  /* DERIVED · the title starts 113.5 pt from the top edge of the mockup;
     with the 16 Pro's 62 of safe area that leaves 51.5. */
  top: 52,
  /* The line box of SF 34: the price starts 39.7 pt below the title
     (RUNTIME), which is one line of 34. */
  line34: 41,
  line17: 20.3,
  /* RUNTIME · "Crypto": 96.9 pt of ink. */
  title: { width: 97, height: 28, radius: 9 },
  /* RUNTIME · "$1,500.00": 152 pt of ink; the (i): 20.7 pt of diameter,
     12 pt after the price. */
  price: { width: 152, height: 28, radius: 9, info: 20, toInfo: 12 },
  /* RUNTIME · the change starts 8 pt below the price's box:
     "▲ $0.2800 (26.47%)" 147 pt and "Today" 40 pt, 6 pt after it. Font of
     17 → bar of 14. */
  change: { before: 8, primary: 147, secondary: 40, gap: 6, height: 14 },
  /* RUNTIME · the line runs from 8.3 pt off the edge to 72.6 % of the
     width (the marker, at the maximum), and it takes up 76.6 pt of height:
     its highest point sits 68 pt below the change's line and its lowest
     42 pt above the range picker; 186 pt in total between the two. The
     reference draws it at ~2 pt; in the skeleton it goes at 3, and the
     marker at 8. */
  chart: { height: 186, from: 68, band: 76, x0: 8, x1: 0.726, thickness: 3, dot: 8 },
  /* RUNTIME · the picker: seven items between 47 pt and 363 pt of the
     402 width (spread evenly); the "1D" pill measures 30.6 × 21.5 with a
     radius of ~7; the capitals of the others measure 8.3 pt (font ~12) →
     bar 9. Ink widths: LIVE 25, 1D 14, 1W 17, 1M 16, 3M 18, YTD 24,
     1Y 14. */
  range: { height: 23, left: 47, right: 39, pill: { width: 31, height: 22, radius: 7 }, bar: 9, widths: [25, 14, 17, 16, 18, 24, 14] },

  /* ASSUMED · below the range the screenshot ends. An app of this kind
     goes on with a section header and a two-column data grid (a label and
     a value per cell, rows of 44 with a hairline at the margin), and
     another section of running text; that is what fills the gap up to the
     button without competing with it. */
  section: { before: 28, width: 84, height: 14 },
  grid: { before: 12, rows: 3, row: 44, label: 58, value: 46, height: 12, column: 28 },
  /* ASSUMED · three lines of running text, as a fraction of the usable width. */
  paragraph: [1, 0.94, 0.58],
} as const

/* The chart's curve: eight control points (u = 0..1 along it, v = 0..1
   from the bottom up) with the reference's shape, joined with Catmull-Rom
   and sampled six times per stretch. */
const CONTROL: readonly (readonly [number, number])[] = [
  [0, 0.25], [0.15, 0.3], [0.25, 0.15], [0.45, 0.22], [0.6, 0.35], [0.75, 0.42], [0.9, 0.75], [1, 1],
]
const PER_SEGMENT = 6
const POINTS: readonly (readonly [number, number])[] = (() => {
  const out: [number, number][] = []
  const at = (i: number) => CONTROL[Math.min(CONTROL.length - 1, Math.max(0, i))]
  for (let i = 0; i < CONTROL.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    for (let k = 0; k < PER_SEGMENT; k++) {
      const t = k / PER_SEGMENT, t2 = t * t, t3 = t2 * t
      const cr = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push([cr(p0[0], p1[0], p2[0], p3[0]), Math.min(1, Math.max(0, cr(p0[1], p1[1], p2[1], p3[1])))])
    }
  }
  out.push([1, 1])
  return out
})()

function Bar({ width, height = STOCK.change.height, color, radius }: { width: number; height?: number; color?: ColorValue; radius?: number }) {
  const p = palette(useColorScheme())
  return <View style={{ width, height, borderRadius: radius ?? height / 2, backgroundColor: color ?? p.bar }} />
}

function Chart({ width }: { width: number }) {
  const p = palette(useColorScheme())
  const { x0, x1, from, band, thickness, dot } = STOCK.chart
  const w = width * x1 - x0
  const pts = POINTS.map(([u, v]) => [x0 + u * w, from + (1 - v) * band] as const)
  const end = pts[pts.length - 1]
  return (
    <View style={css.chart}>
      {pts.slice(1).map(([x, y], i) => {
        const [xa, ya] = pts[i]
        const dx = x - xa, dy = y - ya
        return (
          <View
            key={i}
            style={[
              css.segment,
              { left: xa, top: ya - thickness / 2, width: Math.hypot(dx, dy) + thickness / 2, backgroundColor: p.bar, transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }] },
            ]}
          />
        )
      })}
      <View style={[css.dot, { left: end[0] - dot / 2, top: end[1] - dot / 2, backgroundColor: p.bar }]} />
    </View>
  )
}

/* The blocks of the list, as module components (the React compiler does
   not allow creating components inside a render). */
function SectionHeader() {
  return (
    <>
      <View style={{ height: STOCK.section.before }} />
      <View style={[css.line17, css.margin]}>
        <Bar width={STOCK.section.width} height={STOCK.section.height} />
      </View>
      <View style={{ height: STOCK.grid.before }} />
    </>
  )
}
/* `tick` changes ten times a second with the live load; each value's width
   comes out of it, deterministically, between 60 % and 100 %. */
const oscillate = (tick: number, i: number) => 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(tick * 0.9 + i * 2.1))
function Grid({ tick = 0, hairline }: { tick?: number; hairline: ColorValue }) {
  return Array.from({ length: STOCK.grid.rows }, (_, r) => (
    <View key={r} style={css.margin}>
      <View style={[css.gridRow, { borderBottomColor: hairline }]}>
        {[0, 1].map((c) => (
          <View key={c} style={[css.cell, c === 0 && { marginRight: STOCK.grid.column }]}>
            <Bar width={STOCK.grid.label} height={STOCK.grid.height} />
            <Bar width={STOCK.grid.value * (tick ? oscillate(tick, r * 2 + c) : 1)} height={STOCK.grid.height} />
          </View>
        ))}
      </View>
    </View>
  ))
}
function Paragraph({ usable }: { usable: number }) {
  return STOCK.paragraph.map((fraction, i) => (
    <View key={i} style={[css.line17, css.margin]}>
      <Bar width={usable * fraction} height={STOCK.grid.height} />
    </View>
  ))
}

export function StockBackground({ paddingTop, paddingBottom, live = false }: { paddingTop: number; paddingBottom: number; live?: boolean }) {
  const { width } = useWindowDimensions()
  const p = palette(useColorScheme())
  const usable = width - 2 * STOCK.margin
  const tick = useTick(live ? 100 : 0)
  return (
    /* THE BACKGROUND ENDS ABOVE THE BUTTON, not underneath it.
       `paddingBottom` used to be on the content, which only adds air AT
       THE END: with the list at the top of the scroll, the rows kept on
       drawing behind the pill, and the thumbnail of one of them peeked out
       underneath, right up against its edge. Vito, 2026-09-08: "the bottom
       part of the button lines up with something below it, making the
       button look bigger than it is". By bounding the VIEWPORT, the
       button's band stays empty and the pill reads at its own size. It is
       also what the `blocks` background already did, with the same
       distance measured off the clip between the last card and the pill
       (`SECTION.toPill`).

       AND THE CONTENT ENDS BEFORE THAT EDGE, instead of being cut off by
       it. A scroll cut through half a row reads as a layout error, not as
       a list that goes on. Out went the list with thumbnails and the last
       grid with its header: RUNTIME, the content ended at 830.7 pt with
       the edge at 831, that is, exactly on top of it; without them it ends
       at 742 and 89 pt are left over. They are ASSUMED blocks (the
       reference screenshot ends at the range picker) so taking them out
       loses nothing that was measured.

       That leaves a big breath between the last paragraph and the pill,
       121 pt. It is on purpose: the measured alternative was a row cut
       flush with the edge, and a whole row does not fit. */
    <ScrollView
      style={[StyleSheet.absoluteFill, { bottom: paddingBottom }]}
      contentContainerStyle={{ paddingTop: paddingTop + STOCK.top }}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
    >
      {/* Title and price: two lines of 34. */}
      <View style={[css.line34, css.margin]}>
        <Bar width={STOCK.title.width} height={STOCK.title.height} radius={STOCK.title.radius} />
      </View>
      <View style={[css.row34, css.margin, { gap: STOCK.price.toInfo }]}>
        <Bar width={STOCK.price.width} height={STOCK.price.height} radius={STOCK.price.radius} />
        <View style={[css.info, { backgroundColor: p.bar }]} />
      </View>
      {/* The day's change and "Today". */}
      <View style={{ height: STOCK.change.before }} />
      <View style={[css.row17, css.margin, { gap: STOCK.change.gap }]}>
        <Bar width={STOCK.change.primary} />
        <Bar width={STOCK.change.secondary} />
      </View>

      <Chart width={width} />

      {/* The range picker: seven items, the second one selected. */}
      <View style={css.range}>
        {STOCK.range.widths.map((barWidth, i) =>
          i === 1 ? (
            <View key={i} style={[css.pill, { backgroundColor: p.bar }]}>
              <Bar width={barWidth} height={STOCK.range.bar} color={p.background} />
            </View>
          ) : (
            <Bar key={i} width={barWidth} height={STOCK.range.bar} />
          ),
        )}
      </View>

      {/* ASSUMED: what follows fills the page out to the top edge of the button. */}
      <SectionHeader />
      <Grid tick={tick} hairline={p.hairline} />
      <SectionHeader />
      <Paragraph usable={usable} />
    </ScrollView>
  )
}

const css = StyleSheet.create({
  margin: { paddingHorizontal: STOCK.margin },
  line34: { height: STOCK.line34, justifyContent: 'center' },
  line17: { height: STOCK.line17, justifyContent: 'center' },
  /* The rows: the main axis is horizontal, so the vertical centering goes
     in `alignItems` (a `justifyContent: center` here centered them across
     the width: it showed up in the first capture). */
  row34: { height: STOCK.line34, flexDirection: 'row', alignItems: 'center' },
  row17: { height: STOCK.line17, flexDirection: 'row', alignItems: 'center' },
  info: { width: STOCK.price.info, height: STOCK.price.info, borderRadius: STOCK.price.info / 2 },
  chart: { height: STOCK.chart.height },
  segment: {
    position: 'absolute',
    height: STOCK.chart.thickness,
    borderRadius: STOCK.chart.thickness / 2,
    transformOrigin: '0% 50%',
  },
  dot: { position: 'absolute', width: STOCK.chart.dot, height: STOCK.chart.dot, borderRadius: STOCK.chart.dot / 2 },
  range: {
    height: STOCK.range.height,
    paddingLeft: STOCK.range.left,
    paddingRight: STOCK.range.right,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    width: STOCK.range.pill.width,
    height: STOCK.range.pill.height,
    borderRadius: STOCK.range.pill.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: { height: STOCK.grid.row, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
