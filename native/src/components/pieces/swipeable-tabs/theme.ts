import { createContext, useContext } from 'react'

import { COLOR, type Palette } from './measurements'

/* ═══════════════════════════════════════════════════════════════
   THE THEME — a context with the palette in force, and nothing else.

   The piece was measured entirely in dark, so `COLOR` (the dark
   palette, with a receipt per value) is the default: with no provider,
   everything looks exactly as it did before light mode existed. The
   route picks the palette with `useColorScheme()`, the SYSTEM color
   scheme and not a toggle of our own: the reference is the X app, which
   follows the system.

   Context and not props: the palette crosses five components and
   several `memo`s. A change of color scheme re-renders the consumers
   even though `memo` cuts the props off, which is exactly the semantics
   a theme needs. Both palettes are module constants, so their identity
   is stable and no render fires for nothing.
   ═══════════════════════════════════════════════════════════════ */
export const Theme = createContext<Palette>(COLOR)

export const usePalette = () => useContext(Theme)
