import { StyleSheet, View, type ViewStyle } from 'react-native'

import { CARD, COLOR, DAYS, GAP, SCREEN, SECTION, TOGGLE } from '../measurements'

/* ═══════════════════════════════════════════════════════════════
   THE "BLOCKS" BACKGROUND: the Opal screen as a skeleton: the same grid,
   the same measured heights and paddings, with no text, no color and no
   blotches. Each text is a gray bar, each control is its silhouette. That
   way the button has context (it is at the foot of a form) without
   anything competing with it.

   THREE GRAYS, all neutral: the background (COLOR.background), the cards
   (COLOR.card) and the bars (`BAR`, one step lighter). Nothing has a tint.

   THE BUTTON IS NEITHER TOUCHED NOR OVERLAPPED: the last block ends
   `SECTION.toPill` (32 pt, measured off the clip) above the pill, which is
   the same distance as Opal's last card. Asked for on 2026-09-03: "much
   better and tidier, don't let them overlap the button".
   ═══════════════════════════════════════════════════════════════ */

/* RUNTIME · the bars stand in for text: one line of SF 17 takes up 20.3 pt
   of box; the bar measures 14 (the x-height plus the belly) and stays
   centered in those 20.3 → 3 pt of air above and below. */
const BAR = { height: 14, color: '#2A2A2A' } as const
const TITLE = { width: 168, height: 30, radius: 9, color: '#2E2E2E' } as const

function Bar({ width, height = BAR.height, style }: { width: number; height?: number; style?: ViewStyle }) {
  return <View style={[{ width, height, borderRadius: height / 2, backgroundColor: BAR.color }, style]} />
}

/* A card row: a bar on the left, a bar on the right, with the same line
   box (20.3) as the text it replaces. */
function Row({ left, right }: { left: number; right: number }) {
  return (
    <View style={css.row}>
      <Bar width={left} />
      <Bar width={right} />
    </View>
  )
}

export function BlocksBackground({ paddingTop }: { paddingTop: number }) {
  return (
    <>
      {/* The head: the title and its description, as bars. */}
      <View style={[css.head, { paddingTop }]}>
        <View style={css.titleBar} />
        <Bar width={236} />
      </View>

      <View style={css.stretch} />

      <View style={css.block}>
        <View style={css.sectionHeader}>
          <Bar width={112} />
        </View>
        <View style={{ height: SECTION.below }} />
        {/* From / To: two rows with the timeline's measured step. */}
        <View style={[css.card, { paddingVertical: CARD.paddingVertical + 2 }]}>
          <Row left={58} right={86} />
          <View style={{ height: 15.4 }} />
          <Row left={30} right={92} />
        </View>
        <View style={{ height: CARD.separation }} />
        {/* The days: the text row and the seven circles, in gray. */}
        <View style={css.card}>
          <Row left={128} right={66} />
          <View style={{ height: GAP.textToCircles }} />
          <View style={css.circles}>
            {Array.from({ length: 7 }, (_, i) => (
              <View key={i} style={css.circle} />
            ))}
          </View>
        </View>
        <View style={{ height: SECTION.above }} />
        <View style={css.sectionHeader}>
          <Bar width={148} />
        </View>
        <View style={{ height: SECTION.below }} />
        <View style={css.card}>
          <Row left={118} right={58} />
        </View>
        <View style={{ height: CARD.separation }} />
        {/* Hard Mode: two lines on the left and the toggle's silhouette. */}
        <View style={[css.card, css.rowCentered, { paddingVertical: CARD.paddingVerticalTwoLines }]}>
          <View style={{ gap: CARD.betweenLines }}>
            <View style={css.line}>
              <Bar width={92} />
            </View>
            <View style={css.line}>
              <Bar width={150} />
            </View>
          </View>
          <View style={css.toggle}>
            <View style={css.knob} />
          </View>
        </View>
      </View>
    </>
  )
}

/* The box of one line of SF 17: 20.3 pt. The bars are centered in it so
   that the cards measure the same as Opal's. */
const LINE = 20.3

const css = StyleSheet.create({
  head: { paddingHorizontal: SCREEN.margin, gap: 10 },
  titleBar: { width: TITLE.width, height: TITLE.height, borderRadius: TITLE.radius, backgroundColor: TITLE.color, marginTop: 52 },
  stretch: { flex: 1 },
  block: { paddingHorizontal: SCREEN.margin },
  /* The section header sits GAP.headerInset from the screen edge, 4 pt
     further out than the cards' text, like in Opal. */
  sectionHeader: { height: LINE, justifyContent: 'center', marginLeft: GAP.headerInset - SCREEN.margin },
  card: {
    backgroundColor: COLOR.card,
    borderRadius: CARD.radius,
    borderCurve: 'continuous',
    paddingLeft: CARD.padding,
    paddingRight: CARD.paddingRight,
    paddingVertical: CARD.paddingVertical,
  },
  row: { height: LINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCentered: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  line: { height: LINE, justifyContent: 'center' },
  circles: { flexDirection: 'row', justifyContent: 'space-between' },
  circle: { width: DAYS.diameter, height: DAYS.diameter, borderRadius: DAYS.diameter / 2, backgroundColor: BAR.color },
  toggle: {
    width: TOGGLE.width,
    height: TOGGLE.height,
    borderRadius: TOGGLE.height / 2,
    backgroundColor: BAR.color,
    justifyContent: 'center',
    paddingLeft: TOGGLE.inset,
    marginRight: TOGGLE.rightCorrection,
  },
  knob: { width: TOGGLE.knobWidth, height: TOGGLE.knobHeight, borderRadius: TOGGLE.knobHeight / 2, backgroundColor: '#3A3A3A' },
})
