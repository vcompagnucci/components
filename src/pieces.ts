/* El runtime es propiedad de la PIEZA; los tabs filtran sobre eso.
   El corte es navegador vs app instalada, que es la línea que de verdad
   cuesta cruzar. Bajo App conviven SwiftUI y Expo/React Native: los dos
   renderizan vistas nativas de verdad, sólo cambia con qué se escriben.
   Cada pieza declara su runtime aparte (ver `runtime`), porque decide
   cómo se demuestra: Expo puede ir vivo vía react-native-web salvo que
   dependa de hardware —la háptica no existe en Safari—, SwiftUI va
   siempre en video. */

export type Platform = 'Web' | 'App'
export type Runtime = 'DOM' | 'Expo' | 'SwiftUI'

export type Piece = {
  name: string
  platform: Platform
  desc: string
}

export const TABS = ['All', 'Web', 'App'] as const

export const PIECES: Piece[] = [
  { name: 'Button', platform: 'Web', desc: 'Press to scale(0.96), focus ring, loading state.' },
  { name: 'Input', platform: 'Web', desc: 'Resting ring that turns ink on focus, no halo.' },
  { name: 'Select', platform: 'Web', desc: 'Same language as the input; always opens below.' },
  { name: 'Switch', platform: 'Web', desc: 'On fills with ink; the thumb survives dark.' },
  { name: 'Checkbox', platform: 'Web', desc: 'Canvas mark over ink fill, never hard white.' },
  { name: 'Slider', platform: 'Web', desc: 'Thin track, pill thumb, tabular values.' },
  { name: 'Tabs', platform: 'Web', desc: 'A line that stretches as it travels.' },
  { name: 'Tooltip', platform: 'Web', desc: 'Enters at 160ms from its trigger; leaves faster.' },
  { name: 'Dialog', platform: 'Web', desc: 'Blurred scrim; exit shorter than enter.' },
  { name: 'Sheet', platform: 'Web', desc: 'Draggable, iOS curve, snap points.' },
  { name: 'Tab Bar', platform: 'Web', desc: 'Bottom navigation with safe area, active in ink.' },
  { name: 'Pull to Refresh', platform: 'Web', desc: 'Resistance on pull, soft settle on release.' },
  { name: 'Swipe Actions', platform: 'Web', desc: 'Actions behind the row; destructive last.' },
  { name: 'Action Sheet', platform: 'Web', desc: 'Options from below; destructive in red.' },
  { name: 'Toggle', platform: 'App', desc: 'The native switch, haptics on commit.' },
  { name: 'Picker', platform: 'App', desc: 'The native wheel, detents per option.' },
  { name: 'Haptic Button', platform: 'App', desc: 'Haptics tied to the gesture, not the result.' },
  { name: 'Context Menu', platform: 'App', desc: 'Long press, blur behind, piece preview.' },
]
