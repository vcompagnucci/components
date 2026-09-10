import { Image, StyleSheet, View } from 'react-native'

import { HEADER } from './measurements'
import { usePalette } from './theme'

/* The user's profile photo (request of 2026-09-02): 400×400 at the
   source, saved at 192 px = the 32 pt circle at 3x, with margin. */
const PROFILE = require('./media/profile.jpg')

/* ═══════════════════════════════════════════════════════════════
   THE HEADER: the strip that goes above the tabs.

   In the reference it has the profile photo on the left and X's logo in
   the middle. Here it carries only the photo: the logo is theirs, and a
   study piece that copies it stops being a study piece.

   But the strip DOES have to be there, and it is not decoration.
   Without it the tabs end up flush against the status bar and the
   underline starts against the edge of the screen, which is not what is
   being studied. The height is measured: the avatar and the logo share
   a vertical center at 83.8 pt, the tab bar starts at 106, and out of
   that comes a strip of 44, the same height as the tab bar.

   The photo is the user's, fixed, cropped to the same 32 pt circle the
   reference's avatar measures. Underneath goes the divider's gray while
   it loads, which is the same block the feed's avatars use.
   ═══════════════════════════════════════════════════════════════ */
export function Header() {
  const palette = usePalette()
  return (
    <View style={css.header}>
      <Image source={PROFILE} style={[css.avatar, { backgroundColor: palette.divider }]} />
    </View>
  )
}

const css = StyleSheet.create({
  header: {
    height: HEADER.height,
    justifyContent: 'center',
    paddingHorizontal: HEADER.inset,
  },
  avatar: {
    width: HEADER.avatar,
    height: HEADER.avatar,
    borderRadius: HEADER.avatar / 2,
  },
})
