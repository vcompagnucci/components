import { useMemo } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { MEDIA } from './media'
import { LABEL } from './measurements'
import { useCollapsingScroll } from './collapse'
import { usePalette } from './theme'

/* ═══════════════════════════════════════════════════════════════
   THE CONTENT OF EACH PAGE.

   Lorem ipsum for the text (you look at it without reading it, which is
   what you need when the thing under study is the bar) and REAL MEDIA:
   the user assigned the images tab by tab (2026-09-01, see `media.ts`),
   as a mockup of real tweets. All six pages have photos; a page with no
   list (if a tab is added) keeps the gray blocks of the original mock.

   The photos go in the ODD rows (1, 3, 5…), in the order of the list:
   each page opens with a text tweet and then alternates, deterministic
   like everything else. Two takes of the same gesture have to be
   comparable.

   The page fills the whole screen and leaves the height of the
   collapsing block free at the top; its vertical scroll is what
   collapses the header (`useCollapsingScroll`, receipt in
   `collapse.tsx`). With no top separator of its own, on purpose: X has
   one flush against the bottom edge of its block (two rows: the edge,
   which fades out, and the separator, which does not), but their edge
   is 64 pt below the tabs' divider and here the edge IS the divider. A
   separator underneath would make the divider 2 px at rest, and the
   rest state is measured at 1. It was tried and taken out.

   WHERE EACH MEASUREMENT COMES FROM:
   · avatar 40 pt, MEASURED in the clip: 123 px at 3x = 41 pt, the
     extra point being the softened edges. 40 is the clean value.
   · each photo's ratio travels measured in `media.ts` and here it is
     CLAMPED to [3:4, 16:9], which is our decision, NO RECEIPT: X's real
     crop changed between versions; 3:4 keeps the feed browsable with
     the vertical screenshots (the tallest is 9:16).
   · the rest of the spacing and the blocks' radius are OUR DECISION,
     not measurement. They are stated as what they are.
   ═══════════════════════════════════════════════════════════════ */

const LOREM =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(
    ' ',
  )

/* A deterministic slice of the lorem. Deterministic and not random so
   the page looks the same in every render and in every recording: if
   the text changed on its own, two takes of the same gesture would not
   be comparable. */
const words = (seed: number, count: number) => {
  const from = (seed * 7) % (LOREM.length - count)
  return LOREM.slice(from, from + count).join(' ')
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const ROWS = 12

export function Page({ id, index }: { id: string; index: number }) {
  const palette = usePalette()
  const photos = MEDIA[id]
  const { handler, height } = useCollapsingScroll(index)
  /* The colors are kept apart from the geometry: the palette changes
     with the system color scheme and this is the only thing that gets
     recalculated. */
  const tint = useMemo(
    () => ({
      row: { borderBottomColor: palette.divider },
      block: { backgroundColor: palette.divider },
      name: { color: palette.active },
      secondary: { color: palette.inactive },
      text: { color: palette.active },
    }),
    [palette],
  )
  return (
    <Animated.ScrollView
      style={css.page}
      contentContainerStyle={[css.column, { paddingTop: height }]}
      showsVerticalScrollIndicator={false}
      onScroll={handler}
      scrollEventThrottle={16}
    >
      {Array.from({ length: ROWS }, (_, row) => {
        const seed = index * 31 + row
        /* The photos take the odd rows in order; past the end of the
           list, text rows only. With no photos assigned, the gray block
           of the original mock with its usual rhythm. */
        const photo = photos && row % 2 === 1 ? photos[(row - 1) / 2] : undefined
        return (
          <View key={row} style={[css.row, tint.row]}>
            <View style={[css.avatar, tint.block]} />
            <View style={css.body}>
              <View style={css.heading}>
                <Text style={[css.name, tint.name]} allowFontScaling={LABEL.fontScaling}>{capitalize(words(seed, 2))}</Text>
                <Text style={[css.secondary, tint.secondary]} allowFontScaling={LABEL.fontScaling}>@{words(seed + 3, 1)}</Text>
              </View>
              <Text style={[css.text, tint.text]} allowFontScaling={LABEL.fontScaling}>{words(seed, 12 + (seed % 14))}</Text>
              {photo ? (
                <View style={[css.media, { aspectRatio: Math.min(Math.max(photo.ratio, 3 / 4), 16 / 9) }]}>
                  <Image source={photo.source} style={css.photo} resizeMode="cover" />
                </View>
              ) : (
                !photos && seed % 3 === 0 && <View style={[css.media, tint.block]} />
              )}
            </View>
          </View>
        )
      })}
    </Animated.ScrollView>
  )
}

const css = StyleSheet.create({
  page: { flex: 1 },
  column: { paddingBottom: 48 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, gap: 4 },
  heading: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },

  /* The two gray blocks use the ONLY surface gray the reference left
     measured, the divider, because adding a new gray would mean
     inventing a value for something that is not even the subject of the
     piece. The concrete color comes from `tint`, per the palette. */
  avatar: { width: 40, height: 40, borderRadius: 20 },

  /* `borderCurve: 'continuous'` is the detail that makes a rounded
     rectangle look like iOS and not like the web: iOS does not draw an
     arc of a circle in the corner, it draws a squircle, and RN exposes
     that from 0.76 on. Without this, even the "correct" radius looks
     foreign. `overflow: hidden` because the real photo goes inside and
     it is the box that clips to the squircle, not the image. The 16/9
     is the gray block's fallback; with a photo, the clamped ratio
     overrides it. */
  media: {
    marginTop: 8,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },

  name: { fontSize: LABEL.size, fontWeight: LABEL.weight },
  secondary: { fontSize: LABEL.size },
  text: { fontSize: LABEL.size, lineHeight: 20 },
})
