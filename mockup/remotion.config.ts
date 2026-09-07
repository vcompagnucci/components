/* Los cuadros van al encoder en PNG, no en JPEG: "pixel-close a lo que
   se sube" empieza acá — el JPEG intermedio de Remotion (calidad 80
   por default) ablanda los bordes del bisel y el texto de la UI antes
   de que el h264 los toque. El crf 17 y el yuv420p son los mismos del
   pipeline de ffmpeg: X acepta 2160² y recomprime lo demás. */
import { Config } from '@remotion/cli/config'

Config.setEntryPoint('src/index.ts')
Config.setVideoImageFormat('png')
Config.setCodec('h264')
/* El crf va en cada script y no acá: ProRes (el máster con alfa de la
   library) no acepta crf y con esta línea global el render se caía. */
Config.setPixelFormat('yuv420p')
Config.setOverwriteOutput(true)
