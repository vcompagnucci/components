/* THE COMPARISON GRID: the same frame at rest sixteen times, with a
   different shadow each time and its receipt underneath. It is a Still:
   you look at it in Studio or render it to PNG, and the chosen one goes
   into `PARAMETERS`. */
import { AbsoluteFill } from 'remotion'

import { Mockup } from './Mockup'
import { PARAMETERS } from './parameters'
import { BACKGROUNDS } from './backgrounds'
import { SHADOWS, SYMMETRIC_SHADOWS, type Variant } from './shadows'

const TILE = 1080
const COLUMNS = 4

/* This file is called `Grid.tsx` and not Shadows.tsx, which would be
   the obvious name: on a disk that does not tell case apart,
   `./Shadows` resolved to `shadows.ts` (the variants) and the
   composition got `undefined`. */
type Cell = { name: string; note: string; props: Partial<typeof PARAMETERS> }

export const ShadowGrid: React.FC<{ set?: 'references' | 'symmetric' | 'backgrounds' }> = ({ set = 'references' }) => {
  const cells: Cell[] =
    set === 'backgrounds'
      ? BACKGROUNDS.map((v) => ({ name: v.name, note: v.note, props: { background: v.color, backgroundStyle: v.style } }))
      : (set === 'symmetric' ? SYMMETRIC_SHADOWS : SHADOWS).map((v: Variant) => ({ name: v.name, note: v.note, props: { shadow: v.shadow } }))
  return (
  <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
    {cells.map((v, i) => (
      <div
        key={v.name}
        style={{
          position: 'absolute',
          left: (i % COLUMNS) * TILE,
          top: Math.floor(i / COLUMNS) * TILE,
          width: TILE,
          height: TILE,
          overflow: 'hidden',
        }}
      >
        <Mockup {...PARAMETERS} {...v.props} canvas={TILE} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '22px 36px 26px',
            fontFamily: '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif',
            color: '#1d1d1f',
            backgroundColor: 'rgba(255,255,255,0.78)',
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 600 }}>
            {i + 1}. {v.name}
          </div>
          <div style={{ fontSize: 26, color: '#6e6e73', marginTop: 6 }}>{v.note}</div>
        </div>
      </div>
    ))}
  </AbsoluteFill>
  )
}
