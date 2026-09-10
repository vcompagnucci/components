import { SymbolView } from 'expo-symbols'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View, type ViewStyle } from 'react-native'

import { BADGE, CARD, COLOR, DAYS, GAP, TIMELINE, SYMBOL, TEXT, TOGGLE } from '../measurements'

/* ═══════════════════════════════════════════════════════════════
   THE SCREEN'S PARTS: everything that surrounds the button.

   None of this animates or responds: in the clip the only gesture is the
   button's, and these cards exist so that the button is in its place. The
   values are measured (see `measurements.ts`); what could NOT be measured
   is what the clip cuts off at the top, and it is marked ASSUMED where it
   appears.
   ═══════════════════════════════════════════════════════════════ */

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[css.card, style]}>{children}</View>
}

export const Label = ({ children }: { children: ReactNode }) => (
  <Text allowFontScaling={false} style={css.label}>
    {children}
  </Text>
)
export const Value = ({ children, time, loose }: { children: ReactNode; time?: boolean; loose?: boolean }) => (
  <Text allowFontScaling={false} style={[css.value, time && css.time, loose && css.valueLoose]}>
    {children}
  </Text>
)
export const Secondary = ({ children }: { children: ReactNode }) => (
  <Text allowFontScaling={false} style={css.secondary}>
    {children}
  </Text>
)

/* "Selected Apps · 5 Apps ›" and "To · 10:00 PM ⌃⌄": label on the left,
   value and symbol on the right, with the measured gap of 12. */
export function ValueAndSymbol({ value, symbol }: { value: string; symbol: 'chevron' | 'stepper' }) {
  const s = SYMBOL[symbol]
  return (
    <View style={css.right}>
      <Value time={symbol === 'stepper'}>{value}</Value>
      <SymbolView
        name={s.name}
        scale="large"
        weight="semibold"
        tintColor={COLOR.secondary}
        style={{ width: s.box.width, height: s.box.height, marginRight: -s.fromRight }}
      />
    </View>
  )
}

/* The section header: a gray SF Symbol and the text in bold. */
export function SectionHeader({ symbol, text }: { symbol: 'lock' | 'clock'; text: string }) {
  const s = SYMBOL[symbol]
  return (
    <View style={css.header}>
      <SymbolView
        name={s.name}
        scale="large"
        weight="semibold"
        tintColor={COLOR.secondary}
        style={{ width: s.box.width, height: s.box.height }}
      />
      <Text allowFontScaling={false} style={css.section}>
        {text}
      </Text>
    </View>
  )
}

/* The seven circles: 44 with a gap of 8, black letter in bold. */
export function DayCircles() {
  return (
    <View style={css.circles}>
      {DAYS.letters.map((l, i) => (
        <View key={i} style={css.circle}>
          <Text allowFontScaling={false} style={css.letter}>
            {l}
          </Text>
        </View>
      ))}
    </View>
  )
}

/* The reference's custom toggle: it is NOT a UISwitch (see TOGGLE). */
export function Toggle() {
  return (
    <View style={css.track}>
      <View style={css.knob} />
    </View>
  )
}

/* [⚡ PRO]: a capsule with a green border, a bolt and text of 11 with tracking. */
export function ProBadge() {
  return (
    <View style={css.badge}>
      <SymbolView name={SYMBOL.bolt.name} scale="large" weight="bold" tintColor={COLOR.pro} style={css.bolt} />
      <Text allowFontScaling={false} style={css.pro}>
        PRO
      </Text>
    </View>
  )
}

/* One row of the timeline: the node (a filled circle for "From", hollow
   for "To"), the dashed connector going up if there is one, and the
   label. The connector is drawn with real dashes (5 pt, gap 2.5) because
   `borderStyle: 'dashed'` does not let you choose the step. */
export function TimeRow({ text, time, filled, connector }: { text: string; time: string; filled: boolean; connector: boolean }) {
  const dashes = Math.floor((TIMELINE.rowStep - TIMELINE.circle) / (TIMELINE.dash + TIMELINE.dashGap))
  return (
    <View style={css.timeRow}>
      <View style={css.timeColumn}>
        {connector && (
          <View style={css.connector}>
            {Array.from({ length: dashes }, (_, i) => (
              <View key={i} style={css.dash} />
            ))}
          </View>
        )}
        <View style={[css.node, filled ? css.nodeFilled : css.nodeHollow]} />
      </View>
      <Label>{text}</Label>
      <View style={css.stretch} />
      <ValueAndSymbol value={time} symbol="stepper" />
    </View>
  )
}

/* A blurred blotch of color from the background. The clip shows four, only
   down the left margin, between the cards and the edge: they are what is
   left of a background with an image. They are made with the diffuse
   shadow of a dot, which is the only thing in RN that blurs without a
   native module. */
export function Blotch({ x, y, radius, color }: { x: number; y: number; radius: number; color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - 4,
        bottom: y - 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        boxShadow: `0 0 ${radius}px ${radius * 0.6}px ${color}`,
      }}
    />
  )
}

const css = StyleSheet.create({
  card: {
    backgroundColor: COLOR.card,
    borderRadius: CARD.radius,
    borderCurve: 'continuous',
    paddingLeft: CARD.padding,
    paddingRight: CARD.paddingRight,
    paddingVertical: CARD.paddingVertical,
  },
  label: { fontSize: TEXT.body, fontWeight: TEXT.labelWeight, color: COLOR.text },
  value: { fontSize: TEXT.value, fontWeight: TEXT.valueWeight, color: COLOR.secondary },
  time: { fontSize: TEXT.time },
  valueLoose: { marginRight: -GAP.valueTail },
  secondary: { fontSize: TEXT.body, fontWeight: TEXT.valueWeight, color: COLOR.secondary },
  section: { fontSize: TEXT.body, fontWeight: TEXT.sectionWeight, color: COLOR.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: GAP.valueToIcon },
  header: { flexDirection: 'row', alignItems: 'center', gap: GAP.iconToText, paddingHorizontal: GAP.headerInset },
  circles: { flexDirection: 'row', justifyContent: 'space-between', marginTop: GAP.textToCircles },
  circle: {
    width: DAYS.diameter,
    height: DAYS.diameter,
    borderRadius: DAYS.diameter / 2,
    backgroundColor: COLOR.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontSize: TEXT.body, fontWeight: '700', color: COLOR.circleLetter },
  track: {
    width: TOGGLE.width,
    height: TOGGLE.height,
    borderRadius: TOGGLE.height / 2,
    backgroundColor: COLOR.toggleTrack,
    justifyContent: 'center',
    paddingLeft: TOGGLE.inset,
    marginRight: TOGGLE.rightCorrection,
  },
  knob: {
    width: TOGGLE.knobWidth,
    height: TOGGLE.knobHeight,
    borderRadius: TOGGLE.knobHeight / 2,
    backgroundColor: COLOR.toggleKnob,
  },
  badge: {
    height: BADGE.height,
    borderRadius: BADGE.height / 2,
    borderWidth: BADGE.border,
    borderColor: COLOR.pro,
    backgroundColor: COLOR.proBackground,
    paddingLeft: BADGE.paddingLeft,
    paddingRight: BADGE.paddingRight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: BADGE.betweenBoltAndText,
  },
  bolt: { width: SYMBOL.bolt.box.width, height: SYMBOL.bolt.box.height },
  pro: { fontSize: TEXT.badge, fontWeight: '700', color: COLOR.pro, letterSpacing: TEXT.badgeTracking },
  timeRow: { flexDirection: 'row', alignItems: 'center', height: TIMELINE.rowStep },
  timeColumn: { width: TIMELINE.column, marginRight: TIMELINE.toText, alignItems: 'center', justifyContent: 'center' },
  connector: {
    position: 'absolute',
    bottom: TIMELINE.circle / 2 + TIMELINE.dashGap,
    alignItems: 'center',
    gap: TIMELINE.dashGap,
  },
  dash: { width: TIMELINE.thickness, height: TIMELINE.dash, backgroundColor: COLOR.secondary, borderRadius: 0.5 },
  node: { width: TIMELINE.circle, height: TIMELINE.circle, borderRadius: TIMELINE.circle / 2 },
  nodeFilled: { backgroundColor: COLOR.secondary },
  nodeHollow: { borderWidth: TIMELINE.ring, borderColor: COLOR.secondary },
  stretch: { flex: 1 },
})
