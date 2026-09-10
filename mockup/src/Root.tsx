import { getVideoMetadata } from '@remotion/media-utils'
import { Composition, Still, staticFile } from 'remotion'

import { Mockup } from './Mockup'
import { HOLD_TO_COMMIT, PARAMETROS, esquema, paraExhibition } from './parameters'
import { GrillaDeSombras } from './Grid'

/* 2160² a 60 fps: el techo real de un post de X (medido: X sirve 2160²
   si se lo subís así; a 720² recomprime lo demás). La duración es la
   del clip, leída del archivo: un número escrito a mano sería una
   segunda verdad sobre cuánto dura la grabación. */
export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="SwipeableTabs"
    component={Mockup}
    width={2160}
    height={2160}
    fps={60}
    durationInFrames={60}
    schema={esquema}
    defaultProps={PARAMETROS}
    calculateMetadata={async ({ props }) => {
      const m = await getVideoMetadata(staticFile(props.clip))
      return {
        durationInFrames: Math.ceil(m.durationInSeconds * 60),
        props: { ...props, clipAncho: m.width, clipAlto: m.height },
      }
    }}
  />
  {/* UNA COMPOSICIÓN POR PIEZA, y lo único que las separa es la cámara
      (ver `parametros.ts`): así Studio muestra la cámara correcta de
      cada una y no hay que acordarse de pasarle props a mano. El clip y
      el fondo sí van por props, porque cada pieza sale cuatro veces:
      claro y oscuro de la app, sobre fondo claro y oscuro. */}
  <Composition
    id="HoldToCommit"
    component={Mockup}
    width={2160}
    height={2160}
    fps={60}
    durationInFrames={60}
    schema={esquema}
    defaultProps={HOLD_TO_COMMIT}
    calculateMetadata={async ({ props }) => {
      const m = await getVideoMetadata(staticFile(props.clip))
      return {
        durationInFrames: Math.ceil(m.durationInSeconds * 60),
        props: { ...props, clipAncho: m.width, clipAlto: m.height },
      }
    }}
  />
  {/* LAS DE LA EXHIBITION: la misma cámara de cada pieza, pero
      transparente, sin sombra, más cerca y sin salida. Una composición
      y no unas props porque Remotion mezcla las props sólo en el primer
      nivel (ver `paraExhibition`). */}
  {([['SwipeableTabsExhibition', PARAMETROS, PARAMETROS.camara.focoEnLienzo], ['HoldToCommitExhibition', HOLD_TO_COMMIT, 0.85]] as const).map(([id, base, foco]) => (
    <Composition
      key={id}
      id={id}
      component={Mockup}
      width={2160}
      height={2160}
      fps={60}
      durationInFrames={60}
      schema={esquema}
      defaultProps={paraExhibition(base, foco)}
      calculateMetadata={async ({ props }) => {
        const m = await getVideoMetadata(staticFile(props.clip))
        return {
          durationInFrames: Math.ceil(m.durationInSeconds * 60),
          props: { ...props, clipAncho: m.width, clipAlto: m.height },
        }
      }}
    />
  ))}
  {/* La grilla de sombras: 4×4 cuadros de 1080, el reposo con una
      sombra distinta cada uno. `pnpm still Sombras out/sombras.png`. */}
  <Still id="Sombras" component={GrillaDeSombras} width={4320} height={4320} defaultProps={{ conjunto: 'referencias' }} />
  <Still id="SombrasSimetricas" component={GrillaDeSombras} width={4320} height={4320} defaultProps={{ conjunto: 'simetricas' }} />
  <Still id="Fondos" component={GrillaDeSombras} width={4320} height={4320} defaultProps={{ conjunto: 'fondos' }} />
  </>
)
