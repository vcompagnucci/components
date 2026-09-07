import { getVideoMetadata } from '@remotion/media-utils'
import { Composition, Still, staticFile } from 'remotion'

import { Mockup } from './Mockup'
import { PARAMETROS, esquema } from './parametros'
import { GrillaDeSombras } from './Grilla'

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
  {/* La grilla de sombras: 4×4 cuadros de 1080, el reposo con una
      sombra distinta cada uno. `pnpm still Sombras out/sombras.png`. */}
  <Still id="Sombras" component={GrillaDeSombras} width={4320} height={4320} defaultProps={{ conjunto: 'referencias' }} />
  <Still id="SombrasSimetricas" component={GrillaDeSombras} width={4320} height={4320} defaultProps={{ conjunto: 'simetricas' }} />
  <Still id="Fondos" component={GrillaDeSombras} width={4320} height={4320} defaultProps={{ conjunto: 'fondos' }} />
  </>
)
