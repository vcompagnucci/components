/* THE COMPOSITION: background, shadow, screen, bezel. Each layer is
   drawn on every frame AT THE SIZE it should have (left/top/width/height
   in px, no transform: scale), so Chrome samples the PNG and the video
   at the final resolution and not a composited frame blown up. It is
   the same thing the ffmpeg pipeline did by scaling each layer frame by
   frame, and it is the point of the brief: no zoom on the composited
   frame, which softens it. */
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

import { Background } from './Background'
import { layers, framing } from './geometry'
import type { Parameters } from './parameters'

/* `canvas` is only passed by the comparison grid, which draws several
   small mockups inside one big frame; in the real composition the
   canvas is the video's. */
export const Mockup: React.FC<Parameters & { canvas?: number }> = (p) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const L = p.canvas ?? width
  const e = framing(frame / fps, L, p.height, p.camera)
  const r = layers(e, { w: p.clipWidth, h: p.clipHeight })
  /* the shadow is in px of 720: it scales with the canvas and the zoom */
  const scale = (L / 720) * e.k

  return (
    <AbsoluteFill style={{ backgroundColor: p.background }}>
      <Background color={p.background} backgroundStyle={p.backgroundStyle} clip={p.clip} canvas={L} />
      {p.shadow.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r.body.x + (c.dx - c.spread) * scale,
            top: r.body.y + (c.dy - c.spread) * scale,
            width: r.body.w + 2 * c.spread * scale,
            height: r.body.h + 2 * c.spread * scale,
            borderRadius: r.body.r + c.spread * scale,
            backgroundColor: c.color,
            opacity: c.alpha,
            filter: c.sigma > 0 ? `blur(${c.sigma * scale}px)` : undefined,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: r.screen.x,
          top: r.screen.y,
          width: r.screen.w,
          height: r.screen.h,
          borderRadius: r.screen.r,
          overflow: 'hidden',
          backgroundColor: p.screen === 'red' ? '#ff0000' : 'black',
        }}
      >
        {p.screen === 'clip' && (
          <OffthreadVideo
            src={staticFile(p.clip)}
            muted
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill' }}
          />
        )}
      </div>
      <Img
        src={staticFile(p.bezel)}
        style={{ position: 'absolute', left: r.bezel.x, top: r.bezel.y, width: r.bezel.w, height: r.bezel.h }}
      />
    </AbsoluteFill>
  )
}
