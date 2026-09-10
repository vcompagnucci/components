/* DIECISÉIS FONDOS PARA EL MISMO TELÉFONO. La referencia (@nater02) es
   un color plano y neutro; el vault también: Photo picker y Floating
   bar sobre blanco, Swipe to pay sobre gris claro, Mini player y Hold
   to commit sobre carbón, y solarn sobre una foto desenfocada. Las
   herramientas del oficio ofrecen lo mismo con otros nombres: Screen
   Studio, color / degradado desde un color / wallpaper / imagen;
   Rotato, presets de degradado e imagen con desenfoque y saturación,
   y aconseja degradados sutiles porque una foto compite con lo que se
   anima encima; shots.so y screenhance, mallas de color y una perilla
   de grano. Ninguno de estos está medido: son la familia recorrida.
   Las dos imágenes son de muestra —la ilustración del usuario y una
   foto de prensa de Apple como placeholder— y se cambian en public/. */
import type { Parametros } from './parameters'

type Estilo = Parametros['fondoEstilo']
const base: Estilo = { tipo: 'color', colores: [], angulo: 180, imagen: '', desenfoque: 0, luz: 0, escala: 1, grano: 0 }
const estilo = (parte: Partial<Estilo>): Estilo => ({ ...base, ...parte })

export type VarianteFondo = { nombre: string; nota: string; color: string; estilo: Estilo }

export const FONDOS: VarianteFondo[] = [
  { nombre: 'neutro medido', nota: '#EBE6E8, la referencia', color: '#EBE6E8', estilo: estilo({}) },
  { nombre: 'blanco Apple', nota: '#FAFAFA, como sus renders', color: '#FAFAFA', estilo: estilo({}) },
  { nombre: 'gris frío', nota: '#EDEFF2', color: '#EDEFF2', estilo: estilo({}) },
  { nombre: 'carbón', nota: '#141414: Mini player, Hold to commit', color: '#141414', estilo: estilo({}) },
  { nombre: 'degradado vertical', nota: 'claro arriba, más oscuro abajo', color: '#EBE6E8', estilo: estilo({ tipo: 'degradado', angulo: 180, colores: ['#F3EFF0', '#D9D2D5'] }) },
  { nombre: 'degradado con color', nota: 'lavanda → durazno, 160°', color: '#E9E3F2', estilo: estilo({ tipo: 'degradado', angulo: 160, colores: ['#E7E1F4', '#F6E3D8'] }) },
  { nombre: 'foco', nota: 'radial: centro claro, bordes oscuros', color: '#EBE6E8', estilo: estilo({ tipo: 'foco', colores: ['#F4F0F1', '#D3CCCF'] }) },
  { nombre: 'malla', nota: 'tres manchas de color sobre neutro', color: '#EFEAEC', estilo: estilo({ tipo: 'malla', colores: ['#EFEAEC', '#DCE6F7', '#F7DDE6', '#E3F1E4'] }) },
  { nombre: 'grano', nota: 'neutro con ruido al 12 %', color: '#EBE6E8', estilo: estilo({ grano: 0.12 }) },
  { nombre: 'trama de puntos', nota: 'puntos cada 28 px, estilo Linear', color: '#EEEAEB', estilo: estilo({ tipo: 'puntos', colores: ['#EEEAEB', '#CFC8CB'] }) },
  { nombre: 'piso', nota: 'pared y piso, corte al 70 %', color: '#EBE6E8', estilo: estilo({ tipo: 'piso', colores: ['#EBE6E8', '#D8D1D4'] }) },
  { nombre: 'ilustración', nota: 'la imagen del usuario, nítida', color: '#EBE6E8', estilo: estilo({ tipo: 'imagen', imagen: 'ilustracion.png' }) },
  { nombre: 'foto desenfocada', nota: 'estilo solarn: σ 30, −30 % de luz (foto placeholder)', color: '#333', estilo: estilo({ tipo: 'imagen', imagen: 'foto.jpg', desenfoque: 30, luz: -0.3, escala: 1.15 }) },
  { nombre: 'la app desenfocada', nota: 'el clip mismo, σ 40, ×1.8, −20 %', color: '#000', estilo: estilo({ tipo: 'app', desenfoque: 40, luz: -0.2, escala: 1.8 }) },
  { nombre: 'azul profundo', nota: 'degradado #0B1E3A → #16304F', color: '#0F2646', estilo: estilo({ tipo: 'degradado', angulo: 180, colores: ['#0B1E3A', '#16304F'] }) },
  { nombre: 'atardecer', nota: 'degradado cálido, 200°', color: '#F1D9CB', estilo: estilo({ tipo: 'degradado', angulo: 200, colores: ['#F5E6D3', '#EDC9B6', '#D9B4C4'] }) },
]
