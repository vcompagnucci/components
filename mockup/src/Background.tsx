/* THE BACKGROUND, in its variants. The reference is a flat color; this
   exists for the exploration of backgrounds (pnpm still Backgrounds)
   and so that the chosen one can stay. Everything in px of the canvas:
   the pattern and blur sizes scale with `canvas` so that the grid of
   1080 and the video of 2160 look the same. */
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion'

import type { Parameters } from './parameters'

type Style = Parameters['backgroundStyle']

/* Grain: Perlin noise from the SVG itself, in a data URI. It repeats as
   a tile; the seam is not visible because the noise has no structure. */
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' seed='7'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  )

export const Background: React.FC<{ color: string; backgroundStyle: Style; clip: string; canvas: number }> = ({ color, backgroundStyle, clip, canvas }) => {
  const e = canvas / 720
  const c = (i: number, fallback: string) => backgroundStyle.colors[i] ?? fallback
  const filter = `blur(${backgroundStyle.blur * e}px) brightness(${1 + backgroundStyle.light})`
  let background: React.ReactNode = null
  switch (backgroundStyle.type) {
    case 'gradient':
      background = <AbsoluteFill style={{ background: `linear-gradient(${backgroundStyle.angle}deg, ${backgroundStyle.colors.join(', ')})` }} />
      break
    case 'spotlight':
      background = <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${c(0, color)} 0%, ${c(1, color)} 72%)` }} />
      break
    case 'mesh':
      background = (
        <AbsoluteFill
          style={{
            backgroundColor: c(0, color),
            backgroundImage: [
              `radial-gradient(at 18% 22%, ${c(1, color)} 0px, transparent 48%)`,
              `radial-gradient(at 82% 28%, ${c(2, color)} 0px, transparent 50%)`,
              `radial-gradient(at 50% 88%, ${c(3, color)} 0px, transparent 55%)`,
            ].join(', '),
          }}
        />
      )
      break
    case 'dots':
      background = (
        <AbsoluteFill
          style={{
            backgroundColor: c(0, color),
            backgroundImage: `radial-gradient(circle, ${c(1, '#c9c4c6')} ${1.4 * e}px, transparent ${1.4 * e}px)`,
            backgroundSize: `${28 * e}px ${28 * e}px`,
            backgroundPosition: `${14 * e}px ${14 * e}px`,
          }}
        />
      )
      break
    case 'floor':
      background = <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c(0, color)} 0%, ${c(0, color)} 66%, ${c(1, color)} 76%, ${c(1, color)} 100%)` }} />
      break
    case 'image':
      background = (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={staticFile(backgroundStyle.image)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter, transform: `scale(${backgroundStyle.scale})` }}
          />
        </AbsoluteFill>
      )
      break
    case 'app':
      background = (
        <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}>
          <OffthreadVideo
            src={staticFile(clip)}
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter, transform: `scale(${backgroundStyle.scale})` }}
          />
        </AbsoluteFill>
      )
      break
    default:
      background = null
  }
  return (
    <>
      {background}
      {backgroundStyle.grain > 0 && (
        <AbsoluteFill
          style={{
            backgroundImage: `url("${GRAIN}")`,
            backgroundSize: `${512 * (e / 3)}px ${512 * (e / 3)}px`,
            opacity: backgroundStyle.grain,
            mixBlendMode: 'multiply',
          }}
        />
      )}
    </>
  )
}
