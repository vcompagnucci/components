/* EL FONDO, en sus variantes. La referencia es un color plano; esto
   existe para la exploración de fondos (pnpm still Fondos) y para que
   la elegida se pueda quedar. Todo en px del lienzo: los tamaños de
   trama y desenfoque se escalan con `lienzo` para que la grilla de
   1080 y el video de 2160 se vean iguales. */
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion'

import type { Parametros } from './parametros'

type Estilo = Parametros['fondoEstilo']

/* Grano: ruido de Perlin del propio SVG, en un data URI. Se repite en
   mosaico; la costura no se ve porque el ruido no tiene estructura. */
const GRANO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' seed='7'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  )

export const Fondo: React.FC<{ color: string; estilo: Estilo; clip: string; lienzo: number }> = ({ color, estilo, clip, lienzo }) => {
  const e = lienzo / 720
  const c = (i: number, porDefecto: string) => estilo.colores[i] ?? porDefecto
  const filtro = `blur(${estilo.desenfoque * e}px) brightness(${1 + estilo.luz})`
  let fondo: React.ReactNode = null
  switch (estilo.tipo) {
    case 'degradado':
      fondo = <AbsoluteFill style={{ background: `linear-gradient(${estilo.angulo}deg, ${estilo.colores.join(', ')})` }} />
      break
    case 'foco':
      fondo = <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${c(0, color)} 0%, ${c(1, color)} 72%)` }} />
      break
    case 'malla':
      fondo = (
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
    case 'puntos':
      fondo = (
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
    case 'piso':
      fondo = <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c(0, color)} 0%, ${c(0, color)} 66%, ${c(1, color)} 76%, ${c(1, color)} 100%)` }} />
      break
    case 'imagen':
      fondo = (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={staticFile(estilo.imagen)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filtro, transform: `scale(${estilo.escala})` }}
          />
        </AbsoluteFill>
      )
      break
    case 'app':
      fondo = (
        <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}>
          <OffthreadVideo
            src={staticFile(clip)}
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filtro, transform: `scale(${estilo.escala})` }}
          />
        </AbsoluteFill>
      )
      break
    default:
      fondo = null
  }
  return (
    <>
      {fondo}
      {estilo.grano > 0 && (
        <AbsoluteFill
          style={{
            backgroundImage: `url("${GRANO}")`,
            backgroundSize: `${512 * (e / 3)}px ${512 * (e / 3)}px`,
            opacity: estilo.grano,
            mixBlendMode: 'multiply',
          }}
        />
      )}
    </>
  )
}
