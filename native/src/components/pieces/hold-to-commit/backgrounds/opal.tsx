import { SymbolView } from 'expo-symbols'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { ProBadge, SectionHeader, Card, DayCircles, ValueAndSymbol, TimeRow, Label, Blotch, Secondary, Toggle, Value } from './cards'
import { TOP, CARD, COLOR, GAP, SCREEN, SECTION, SYMBOL } from '../measurements'

/* ═══════════════════════════════════════════════════════════════
   THE "OPAL" BACKGROUND: the clip's screen, measured, with the button at
   the foot.

   THE MEASURED BLOCK IS ANCHORED TO THE BOTTOM. The clip shows the bottom
   half of the screen (from the "To" row down to the button) and every
   distance between those things is measured; the top part does not exist
   in the clip. So what was measured is stacked from the pill upwards with
   its exact separations, and what is ASSUMED (title and description) goes
   at the top with a flexible space in between. If something had to be
   sacrificed, what gets sacrificed is what was invented.

   The blotches in the background are in the clip: four remnants of color
   down the left margin (red, brown, gray, blue-gray), measured in position
   and color. They do not decorate: without them the background is cleaner
   than the reference's, and the piece stops being a copy.

   It is a variant from `background.ts`: the button knows nothing about it.
   ═══════════════════════════════════════════════════════════════ */

type Props = {
  /** Height of the pill's top edge from the bottom edge of the screen. */
  pillTop: number
  paddingTop: number
}

export function OpalBackground({ pillTop, paddingTop }: Props) {
  const router = useRouter()
  return (
    <>
      {/* The blotches are placed from the top edge of the pill, which is
          the fixed point of the measured block (RUNTIME: centers at 383,
          311, 235 and 444 pt above it; at 18.5, 11, 13 and 11 pt from the
          left edge). */}
      <Blotch x={11} y={pillTop + 444} radius={11} color="rgba(220,70,0,0.13)" />
      <Blotch x={18.5} y={pillTop + 383} radius={15} color="rgba(180,0,50,0.30)" />
      <Blotch x={11} y={pillTop + 311} radius={11} color="rgba(255,255,255,0.04)" />
      <Blotch x={13} y={pillTop + 235} radius={22} color="rgba(80,120,140,0.14)" />

      {/* ASSUMED: the head of the screen. */}
      <View style={[css.top, { paddingTop }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={css.back} accessibilityRole="button" accessibilityLabel="Back">
          <SymbolView name={SYMBOL.back.name} scale="large" weight="semibold" tintColor={COLOR.text} style={css.backChevron} />
        </Pressable>
        <Text allowFontScaling={false} style={css.title}>
          {TOP.title}
        </Text>
        <Secondary>{TOP.description}</Secondary>
      </View>

      <View style={css.stretch} />

      <View style={css.block}>
        <SectionHeader symbol="clock" text="Schedule" />
        <View style={{ height: SECTION.below }} />
        <Card style={{ paddingVertical: 0 }}>
          <TimeRow text="From" time={TOP.timeFrom} filled connector={false} />
          <TimeRow text="To" time={TOP.timeTo} filled={false} connector />
        </Card>
        <View style={{ height: CARD.separation }} />
        <Card>
          <View style={css.row}>
            <Label>On these days:</Label>
            <Value loose>Everyday</Value>
          </View>
          <DayCircles />
        </Card>
        <View style={{ height: SECTION.above }} />
        <SectionHeader symbol="lock" text="Apps are blocked" />
        <View style={{ height: SECTION.below }} />
        <Card>
          <View style={css.row}>
            <Label>Selected Apps</Label>
            <ValueAndSymbol value="5 Apps" symbol="chevron" />
          </View>
        </Card>
        <View style={{ height: CARD.separation }} />
        <Card style={{ paddingVertical: CARD.paddingVerticalTwoLines }}>
          <View style={css.row}>
            <View style={css.twoLines}>
              <View style={css.badgeRow}>
                <Label>Hard Mode</Label>
                <ProBadge />
              </View>
              <Secondary>No unblocks allowed</Secondary>
            </View>
            <Toggle />
          </View>
        </Card>
      </View>
    </>
  )
}

const css = StyleSheet.create({
  top: { paddingHorizontal: SCREEN.margin, gap: 6 },
  back: { width: 44, height: 44, justifyContent: 'center', marginLeft: -12, marginBottom: 2 },
  backChevron: { width: SYMBOL.back.box.width, height: SYMBOL.back.box.height },
  title: { fontSize: TOP.titleSize, fontWeight: '700', color: COLOR.text, letterSpacing: 0.4 },
  stretch: { flex: 1 },
  block: { paddingHorizontal: SCREEN.margin },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  twoLines: { gap: CARD.betweenLines },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: GAP.labelToBadge },
})
