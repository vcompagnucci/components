/* La plataforma es propiedad de la PIEZA; los tabs filtran sobre eso.
   Modelo Fluent/Material: se nombra la plataforma, y Web es una
   plataforma par — nunca un adjetivo como "Native". Dentro de iOS
   conviven los runtimes (Expo demuestra vivo vía react-native-web
   cuando la pieza lo banca; SwiftUI siempre en video). */

export type Platform = 'Web' | 'iOS'

export type Piece = {
  name: string
  platform: Platform
  desc: string
}

export const TABS = ['All', 'Web', 'iOS'] as const

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
  { name: 'Toggle', platform: 'iOS', desc: 'The native switch, haptics on commit.' },
  { name: 'Picker', platform: 'iOS', desc: 'The native wheel, detents per option.' },
  { name: 'Haptic Button', platform: 'iOS', desc: 'Haptics tied to the gesture, not the result.' },
  { name: 'Context Menu', platform: 'iOS', desc: 'Long press, blur behind, piece preview.' },
]
