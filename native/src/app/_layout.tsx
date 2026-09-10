import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

/* ═══════════════════════════════════════════════════════════════
   EL MARCO DEL TALLER.

   SIN HEADER EN NINGUNA PANTALLA, y no es estética: una pieza abierta
   se GRABA, así que todo lo que no sea la pieza terminaría adentro del
   video. La barra de navegación de iOS es chrome del taller, no de la
   pieza.

   La salida es el SWIPE DESDE EL BORDE, que el stack nativo de iOS da
   gratis y sin dibujar nada. El costo está dicho: una pieza que use el
   borde izquierdo para su propio gesto tiene que apagarlo, con
   `<Stack.Screen options={{ gestureEnabled: false }} />` adentro de su
   pantalla.

   GestureHandlerRootView ENVUELVE TODO. Es requisito de
   react-native-gesture-handler —sin él los gestos no llegan— y va acá
   arriba una vez, para que ninguna pieza tenga que acordarse.
   ═══════════════════════════════════════════════════════════════ */
export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  )
}
