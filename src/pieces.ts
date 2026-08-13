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
  { name: 'Button', platform: 'Web', desc: 'Presión a scale(0.96), anillo de foco, estado de carga.' },
  { name: 'Input', platform: 'Web', desc: 'Anillo en reposo que pasa a ink en el foco, sin halo.' },
  { name: 'Select', platform: 'Web', desc: 'Mismo lenguaje que el input; abre siempre debajo.' },
  { name: 'Switch', platform: 'Web', desc: 'Encendido se llena de ink; el pulgar contrasta en dark.' },
  { name: 'Checkbox', platform: 'Web', desc: 'Marca en canvas sobre fill ink, nunca blanco duro.' },
  { name: 'Slider', platform: 'Web', desc: 'Track fino, pulgar pill, valores tabulares.' },
  { name: 'Tabs', platform: 'Web', desc: 'Línea que se estira al viajar entre pestañas.' },
  { name: 'Tooltip', platform: 'Web', desc: 'Entra a 160ms desde el trigger; sale más rápido.' },
  { name: 'Dialog', platform: 'Web', desc: 'Scrim con blur; la salida es más corta que la entrada.' },
  { name: 'Sheet', platform: 'Web', desc: 'Arrastrable, con la curva de iOS y snap points.' },
  { name: 'Tab Bar', platform: 'Web', desc: 'Navegación inferior con safe area y estado activo en ink.' },
  { name: 'Pull to Refresh', platform: 'Web', desc: 'Resistencia al tirar y liberación con settle suave.' },
  { name: 'Swipe Actions', platform: 'Web', desc: 'Acciones detrás de la fila; la destructiva al final.' },
  { name: 'Action Sheet', platform: 'Web', desc: 'Opciones desde abajo; la destructiva en rojo.' },
  { name: 'Toggle', platform: 'iOS', desc: 'El switch nativo, con háptica al confirmar.' },
  { name: 'Picker', platform: 'iOS', desc: 'La rueda nativa, con detentes por opción.' },
  { name: 'Haptic Button', platform: 'iOS', desc: 'Respuesta háptica ligada al gesto, no al resultado.' },
  { name: 'Context Menu', platform: 'iOS', desc: 'Presión larga, blur detrás, preview de la pieza.' },
]
