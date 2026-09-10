import { getVideoMetadata } from '@remotion/media-utils'
import { Composition, Still, staticFile } from 'remotion'

import { Mockup } from './Mockup'
import { HOLD_TO_COMMIT, PARAMETERS, schema, forExhibition } from './parameters'
import { ShadowGrid } from './Grid'

/* 2160² at 60 fps: the real ceiling of a post on X (measured: X serves
   2160² if you upload it that way; everything else it recompresses to
   720²). The duration is the clip's, read from the file: a number
   written by hand would be a second truth about how long the recording
   lasts. */
export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="SwipeableTabs"
    component={Mockup}
    width={2160}
    height={2160}
    fps={60}
    durationInFrames={60}
    schema={schema}
    defaultProps={PARAMETERS}
    calculateMetadata={async ({ props }) => {
      const m = await getVideoMetadata(staticFile(props.clip))
      return {
        durationInFrames: Math.ceil(m.durationInSeconds * 60),
        props: { ...props, clipWidth: m.width, clipHeight: m.height },
      }
    }}
  />
  {/* ONE COMPOSITION PER PIECE, and the only thing that separates them
      is the camera (see `parameters.ts`): that way Studio shows the
      right camera for each one and nobody has to remember to pass props
      by hand. The clip and the background do go as props, because each
      piece comes out four times: the app in light and in dark, over a
      light and a dark background. */}
  <Composition
    id="HoldToCommit"
    component={Mockup}
    width={2160}
    height={2160}
    fps={60}
    durationInFrames={60}
    schema={schema}
    defaultProps={HOLD_TO_COMMIT}
    calculateMetadata={async ({ props }) => {
      const m = await getVideoMetadata(staticFile(props.clip))
      return {
        durationInFrames: Math.ceil(m.durationInSeconds * 60),
        props: { ...props, clipWidth: m.width, clipHeight: m.height },
      }
    }}
  />
  {/* THE ONES FOR THE EXHIBITION: the same camera of each piece, but
      transparent, without a shadow, closer and with no way out. A
      composition and not props because Remotion merges the props only
      at the first level (see `forExhibition`). */}
  {([['SwipeableTabsExhibition', PARAMETERS, PARAMETERS.camera.focusOnCanvas], ['HoldToCommitExhibition', HOLD_TO_COMMIT, 0.85]] as const).map(([id, base, focus]) => (
    <Composition
      key={id}
      id={id}
      component={Mockup}
      width={2160}
      height={2160}
      fps={60}
      durationInFrames={60}
      schema={schema}
      defaultProps={forExhibition(base, focus)}
      calculateMetadata={async ({ props }) => {
        const m = await getVideoMetadata(staticFile(props.clip))
        return {
          durationInFrames: Math.ceil(m.durationInSeconds * 60),
          props: { ...props, clipWidth: m.width, clipHeight: m.height },
        }
      }}
    />
  ))}
  {/* The shadow grid: 4×4 frames of 1080, the phone at rest with a
      different shadow in each one. `pnpm still Shadows out/shadows.png`. */}
  <Still id="Shadows" component={ShadowGrid} width={4320} height={4320} defaultProps={{ set: 'references' }} />
  <Still id="SymmetricShadows" component={ShadowGrid} width={4320} height={4320} defaultProps={{ set: 'symmetric' }} />
  <Still id="Backgrounds" component={ShadowGrid} width={4320} height={4320} defaultProps={{ set: 'backgrounds' }} />
  </>
)
