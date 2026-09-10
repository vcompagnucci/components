import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

/* ═══════════════════════════════════════════════════════════════
   THE FRAME OF THE WORKSHOP.

   NO HEADER ON ANY SCREEN, and this is not about looks: an open piece
   gets RECORDED, so anything that is not the piece would end up inside
   the video. The iOS navigation bar is the workshop's chrome, not the
   piece's.

   The way out is the SWIPE FROM THE EDGE, which the native iOS stack
   gives for free and without drawing anything. The cost is stated: a
   piece that uses the left edge for its own gesture has to turn it off,
   with `<Stack.Screen options={{ gestureEnabled: false }} />` inside
   its screen.

   GestureHandlerRootView WRAPS EVERYTHING. It is a requirement of
   react-native-gesture-handler (without it the gestures never arrive)
   and it goes up here once, so that no piece has to remember it.
   ═══════════════════════════════════════════════════════════════ */
export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  )
}
