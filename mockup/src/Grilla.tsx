/* LA GRILLA COMPARATIVA: el mismo cuadro de reposo dieciséis veces, con
   una sombra distinta cada vez y su recibo abajo. Es un Still: se mira
   en Studio o se renderiza a PNG, y la elegida pasa a `PARAMETROS`. */
import { AbsoluteFill } from 'remotion'

import { Mockup } from './Mockup'
import { PARAMETROS } from './parametros'
import { FONDOS } from './fondos'
import { SOMBRAS, SOMBRAS_SIMETRICAS, type Variante } from './sombras'

const TILE = 1080
const COLUMNAS = 4

/* Vive en `Grilla.tsx` y no en `Sombras.tsx`: en un disco que no
   distingue mayúsculas, `./Sombras` resolvía a `sombras.ts` (las
   variantes) y la composición recibía `undefined`. */
type Celda = { nombre: string; nota: string; props: Partial<typeof PARAMETROS> }

export const GrillaDeSombras: React.FC<{ conjunto?: 'referencias' | 'simetricas' | 'fondos' }> = ({ conjunto = 'referencias' }) => {
  const celdas: Celda[] =
    conjunto === 'fondos'
      ? FONDOS.map((v) => ({ nombre: v.nombre, nota: v.nota, props: { fondo: v.color, fondoEstilo: v.estilo } }))
      : (conjunto === 'simetricas' ? SOMBRAS_SIMETRICAS : SOMBRAS).map((v: Variante) => ({ nombre: v.nombre, nota: v.nota, props: { sombra: v.sombra } }))
  return (
  <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
    {celdas.map((v, i) => (
      <div
        key={v.nombre}
        style={{
          position: 'absolute',
          left: (i % COLUMNAS) * TILE,
          top: Math.floor(i / COLUMNAS) * TILE,
          width: TILE,
          height: TILE,
          overflow: 'hidden',
        }}
      >
        <Mockup {...PARAMETROS} {...v.props} lienzo={TILE} />
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
            {i + 1}. {v.nombre}
          </div>
          <div style={{ fontSize: 26, color: '#6e6e73', marginTop: 6 }}>{v.nota}</div>
        </div>
      </div>
    ))}
  </AbsoluteFill>
  )
}
