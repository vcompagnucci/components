/* The frames go to the encoder as PNG, not as JPEG: "pixel-close to
   what gets uploaded" starts here. Remotion's intermediate JPEG (quality
   80 by default) softens the edges of the bezel and the text of the UI
   before h264 ever touches them. The crf 17 and the yuv420p are the same
   ones as in the ffmpeg pipeline: X accepts 2160² and recompresses
   everything else. */
import { Config } from '@remotion/cli/config'

Config.setEntryPoint('src/index.ts')
Config.setVideoImageFormat('png')
Config.setCodec('h264')
/* The crf goes in each script and not here: ProRes (the exhibition's
   master with alpha) does not accept crf, and with this line set
   globally the render crashed. */
Config.setPixelFormat('yuv420p')
Config.setOverwriteOutput(true)
