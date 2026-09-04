import { getVideoMetadata } from '@remotion/media-utils'
import { Composition, staticFile } from 'remotion'

import { Mockup } from './Mockup'
import { PARAMETROS, esquema } from './parametros'

/* 2160² a 60 fps: el techo real de un post de X (medido: X sirve 2160²
   si se lo subís así; a 720² recomprime lo demás). La duración es la
   del clip, leída del archivo: un número escrito a mano sería una
   segunda verdad sobre cuánto dura la grabación. */
export const RemotionRoot: React.FC = () => (
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
)
