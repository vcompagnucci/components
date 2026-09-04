/* LA COMPOSICIÓN: fondo, sombra, pantalla, bisel. Cada capa se dibuja
   en cada cuadro AL TAMAÑO que le toca —left/top/width/height en px,
   nada de transform: scale— así Chrome muestrea el PNG y el video a la
   resolución final y no un cuadro compuesto agrandado. Es lo mismo que
   hacía el pipeline de ffmpeg escalando cada capa por cuadro, y es el
   punto del brief: no zoom al frame compuesto, que ablanda. */
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

import { Fondo } from './Fondo'
import { capas, encuadre } from './geometria'
import type { Parametros } from './parametros'

/* `lienzo` sólo lo pasa la grilla comparativa, que dibuja varios
   mockups chicos adentro de un cuadro grande; en la composición de
   verdad el lienzo es el del video. */
export const Mockup: React.FC<Parametros & { lienzo?: number }> = (p) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const L = p.lienzo ?? width
  const e = encuadre(frame / fps, L, p.altura, p.camara)
  const r = capas(e, { w: p.clipAncho, h: p.clipAlto })
  /* la sombra está en px de 720: escala con el lienzo y con el zoom */
  const escala = (L / 720) * e.k

  return (
    <AbsoluteFill style={{ backgroundColor: p.fondo }}>
      <Fondo color={p.fondo} estilo={p.fondoEstilo} clip={p.clip} lienzo={L} />
      {p.sombra.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r.cuerpo.x + (c.dx - c.expandir) * escala,
            top: r.cuerpo.y + (c.dy - c.expandir) * escala,
            width: r.cuerpo.w + 2 * c.expandir * escala,
            height: r.cuerpo.h + 2 * c.expandir * escala,
            borderRadius: r.cuerpo.r + c.expandir * escala,
            backgroundColor: c.color,
            opacity: c.alfa,
            filter: c.sigma > 0 ? `blur(${c.sigma * escala}px)` : undefined,
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
