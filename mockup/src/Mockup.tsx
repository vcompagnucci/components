/* LA COMPOSICIÓN: fondo, sombra, pantalla, bisel. Cada capa se dibuja
   en cada cuadro AL TAMAÑO que le toca —left/top/width/height en px,
   nada de transform: scale— así Chrome muestrea el PNG y el video a la
   resolución final y no un cuadro compuesto agrandado. Es lo mismo que
   hacía el pipeline de ffmpeg escalando cada capa por cuadro, y es el
   punto del brief: no zoom al frame compuesto, que ablanda. */
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

import { capas, encuadre } from './geometria'
import type { Parametros } from './parametros'

export const Mockup: React.FC<Parametros> = (p) => {
  const frame = useCurrentFrame()
  const { fps, width: L } = useVideoConfig()
  const e = encuadre(frame / fps, L, p.altura, p.camara)
  const r = capas(e, { w: p.clipAncho, h: p.clipAlto })
  /* la sombra está en px de 720: escala con el lienzo y con el zoom */
  const escala = (L / 720) * e.k

  return (
    <AbsoluteFill style={{ backgroundColor: p.fondo }}>
      {p.sombra.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r.cuerpo.x + c.corrida * escala,
            top: r.cuerpo.y + c.corrida * escala,
            width: r.cuerpo.w,
            height: r.cuerpo.h,
            borderRadius: r.cuerpo.r,
            backgroundColor: 'black',
            opacity: c.alfa,
            filter: `blur(${c.sigma * escala}px)`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: r.pantalla.x,
          top: r.pantalla.y,
          width: r.pantalla.w,
          height: r.pantalla.h,
          borderRadius: r.pantalla.r,
          overflow: 'hidden',
          backgroundColor: p.pantalla === 'roja' ? '#ff0000' : 'black',
        }}
      >
        {p.pantalla === 'clip' && (
          <OffthreadVideo
            src={staticFile(p.clip)}
            muted
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill' }}
          />
        )}
      </div>
      <Img
        src={staticFile(p.bisel)}
        style={{ position: 'absolute', left: r.bisel.x, top: r.bisel.y, width: r.bisel.w, height: r.bisel.h }}
      />
    </AbsoluteFill>
  )
}
