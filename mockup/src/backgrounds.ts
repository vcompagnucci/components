/* SIXTEEN BACKGROUNDS FOR THE SAME PHONE. The reference (@nater02) is a
   flat, neutral color; so is the vault: Photo picker and Floating bar
   over white, Swipe to pay over light gray, Mini player and Hold to
   commit over charcoal, and solarn over a blurred photo. The tools of
   the trade offer the same thing under other names: Screen Studio,
   color / gradient from a color / wallpaper / image; Rotato, presets of
   gradient and of image with blur and saturation, and it advises subtle
   gradients because a photo competes with whatever is animating on top;
   shots.so and screenhance, color meshes and a grain knob. None of
   these is measured: they are the family walked through. The two images
   are samples (the user's illustration and an Apple press photo as a
   placeholder) and you swap them in public/. */
import type { Parameters } from './parameters'

type Style = Parameters['backgroundStyle']
const base: Style = { type: 'color', colors: [], angle: 180, image: '', blur: 0, light: 0, scale: 1, grain: 0 }
const style = (part: Partial<Style>): Style => ({ ...base, ...part })

export type BackgroundVariant = { name: string; note: string; color: string; style: Style }

export const BACKGROUNDS: BackgroundVariant[] = [
  { name: 'measured neutral', note: '#EBE6E8, the reference', color: '#EBE6E8', style: style({}) },
  { name: 'Apple white', note: '#FAFAFA, like their renders', color: '#FAFAFA', style: style({}) },
  { name: 'cool gray', note: '#EDEFF2', color: '#EDEFF2', style: style({}) },
  { name: 'charcoal', note: '#141414: Mini player, Hold to commit', color: '#141414', style: style({}) },
  { name: 'vertical gradient', note: 'light at the top, darker at the bottom', color: '#EBE6E8', style: style({ type: 'gradient', angle: 180, colors: ['#F3EFF0', '#D9D2D5'] }) },
  { name: 'gradient with color', note: 'lavender → peach, 160°', color: '#E9E3F2', style: style({ type: 'gradient', angle: 160, colors: ['#E7E1F4', '#F6E3D8'] }) },
  { name: 'spotlight', note: 'radial: light center, dark edges', color: '#EBE6E8', style: style({ type: 'spotlight', colors: ['#F4F0F1', '#D3CCCF'] }) },
  { name: 'mesh', note: 'three color blobs over neutral', color: '#EFEAEC', style: style({ type: 'mesh', colors: ['#EFEAEC', '#DCE6F7', '#F7DDE6', '#E3F1E4'] }) },
  { name: 'grain', note: 'neutral with noise at 12 %', color: '#EBE6E8', style: style({ grain: 0.12 }) },
  { name: 'dot pattern', note: 'dots every 28 px, Linear style', color: '#EEEAEB', style: style({ type: 'dots', colors: ['#EEEAEB', '#CFC8CB'] }) },
  { name: 'floor', note: 'wall and floor, the break at 70 %', color: '#EBE6E8', style: style({ type: 'floor', colors: ['#EBE6E8', '#D8D1D4'] }) },
  { name: 'illustration', note: "the user's image, sharp", color: '#EBE6E8', style: style({ type: 'image', image: 'illustration.png' }) },
  { name: 'blurred photo', note: 'solarn style: σ 30, −30 % of light (placeholder photo)', color: '#333', style: style({ type: 'image', image: 'photo.jpg', blur: 30, light: -0.3, scale: 1.15 }) },
  { name: 'the app blurred', note: 'the clip itself, σ 40, ×1.8, −20 %', color: '#000', style: style({ type: 'app', blur: 40, light: -0.2, scale: 1.8 }) },
  { name: 'deep blue', note: 'gradient #0B1E3A → #16304F', color: '#0F2646', style: style({ type: 'gradient', angle: 180, colors: ['#0B1E3A', '#16304F'] }) },
  { name: 'sunset', note: 'warm gradient, 200°', color: '#F1D9CB', style: style({ type: 'gradient', angle: 200, colors: ['#F5E6D3', '#EDC9B6', '#D9B4C4'] }) },
]
