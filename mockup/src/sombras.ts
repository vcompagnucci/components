/* DIECISÉIS SOMBRAS PARA EL MISMO TELÉFONO, con recibo. Es el material
   de la grilla `Sombras` (pnpm still Sombras): se mira, se elige, y la
   elegida pasa a `PARAMETROS.sombra`. Todo en px de un lienzo de 720.

   ─── LO MEDIDO (2026-09-04, luma alrededor del borde del teléfono,
   ajuste de dos gaussianas con corrida) ───
   Las referencias del vault se parten en tres familias:
   · SIN SOMBRA, o casi: Floating bar y Photo picker (teléfono claro
     sobre fondo claro, 0 niveles de luma fuera del borde) y el clip de
     solarn (8 niveles, ~40 px de 2160).
   · UNA SOLA CAPA ANCHA Y TENUE, apenas corrida: Swipe to pay (α .20,
     σ 60, corrida 10/0), Pill to button (α .15, σ 75, corrida 30/10),
     Shelf to card (abajo: α ~.15, σ ~60).
   · DOS CAPAS, contacto + ambiente, corridas a la derecha y abajo: el
     clip de @nater02, la referencia del video (α .60 σ 8 (12,12) +
     α .20 σ 30 (70,70)).
   · APPLE NO USA SOMBRA. El PSD del bezel (Apple Design Resources,
     iPhone 17 - Black - Portrait.psd) tiene cuatro capas —Hardware,
     Screen, Status Bar y un White Fill for Dark Mode apagado— y
     ningún efecto de capa. Sus renders de prensa (newsroom, iPhone 17,
     2025-09) miden fondo 250 a 4 px del borde del teléfono por los
     cuatro lados, en el retrato solo y en el lineup. Y sus Marketing
     Guidelines lo prohíben para sus imágenes de producto: "Use Apple
     product images 'as is' and without modification. Modifications
     include adding reflections, shadows, highlights…". Vale para las
     imágenes de Apple; el bezel de Design Resources es para mockups
     propios y ahí la sombra es decisión nuestra.
   Lo demás son sistemas de diseño y estilos conocidos, no medidos. */
import type { Parametros } from './parametros'

type Capa = Parametros['sombra'][number]
const capa = (alfa: number, sigma: number, dx: number, dy: number, extra: Partial<Capa> = {}): Capa => ({
  alfa,
  sigma,
  dx,
  dy,
  color: '#000000',
  expandir: 0,
  ...extra,
})

export type Variante = { nombre: string; nota: string; sombra: Capa[] }

export const SOMBRAS: Variante[] = [
  { nombre: '@nater02, medida', nota: 'contacto α.60 σ8 (12,12) + ambiente α.20 σ30 (70,70)', sombra: [capa(0.6, 8, 12, 12), capa(0.2, 30, 70, 70)] },
  { nombre: 'brief actual (más marcada)', nota: 'α.82 σ7 (12,12) + α.32 σ36 (70,70)', sombra: [capa(0.82, 7, 12, 12), capa(0.32, 36, 70, 70)] },
  { nombre: 'Swipe to pay, medida', nota: 'una capa ancha y tenue: α.20 σ60 (10,0)', sombra: [capa(0.2, 60, 10, 0)] },
  { nombre: 'Pill to button, medida', nota: 'α.10 σ3 + α.15 σ75 (30,10)', sombra: [capa(0.1, 3, 0, 0), capa(0.15, 75, 30, 10)] },
  { nombre: 'Shelf to card, medida abajo', nota: 'α.15 σ60 (0,20)', sombra: [capa(0.15, 60, 0, 20)] },
  { nombre: 'solarn, medida: apenas', nota: 'α.08 σ13 (0,4)', sombra: [capa(0.08, 13, 0, 4)] },
  { nombre: 'sin sombra', nota: 'Floating bar, Photo picker, y Apple: sus bezels y sus renders no llevan', sombra: [] },
  { nombre: 'ambiente puro', nota: 'sin corrida: α.30 σ40 (0,0)', sombra: [capa(0.3, 40, 0, 0)] },
  {
    nombre: 'Material, elevación 24',
    nota: 'umbra + penumbra + ambiente, sólo hacia abajo',
    sombra: [capa(0.2, 7.5, 0, 11, { expandir: -7 }), capa(0.14, 19, 0, 24, { expandir: 3 }), capa(0.12, 23, 0, 9, { expandir: 8 })],
  },
  { nombre: 'larga y dura', nota: 'sin desenfoque: α.18 (36,36)', sombra: [capa(0.18, 0, 36, 36)] },
  { nombre: 'flotante', nota: 'lejos del piso: α.35 σ32 (0,55)', sombra: [capa(0.35, 32, 0, 55)] },
  { nombre: 'contacto', nota: 'apoyado: α.55 σ5 (0,5)', sombra: [capa(0.55, 5, 0, 5)] },
  { nombre: 'halo claro', nota: 'blanco: α.90 σ40, +12 de borde', sombra: [capa(0.9, 40, 0, 0, { color: '#ffffff', expandir: 12 })] },
  {
    nombre: 'capas (Comeau)',
    nota: 'cuatro capas α.12: σ2 σ6 σ14 σ30, corridas 1 4 10 24',
    sombra: [capa(0.12, 2, 1, 1), capa(0.12, 6, 4, 4), capa(0.12, 14, 10, 10), capa(0.12, 30, 24, 24)],
  },
  { nombre: 'luz frontal', nota: 'corta, abajo: α.25 σ18 (0,14)', sombra: [capa(0.25, 18, 0, 14)] },
  { nombre: 'dramática', nota: 'luz arriba-izquierda fuerte: α.50 σ22 (55,55)', sombra: [capa(0.5, 22, 55, 55)] },
]

/* DIECISÉIS MÁS, SIMÉTRICAS: sin dirección de luz de costado. Todas
   centradas en x; las "cenitales" bajan un poco (dy) y siguen siendo
   simétricas de izquierda a derecha. Pedido del usuario, 2026-09-04:
   "más opciones, tal vez sombras más simétricas". Ninguna es medida:
   son la familia "una capa ancha y tenue" del vault recorrida en
   anchura, opacidad y expansión, más algunas combinaciones. */
export const SOMBRAS_SIMETRICAS: Variante[] = [
  { nombre: 'ambiente fina', nota: 'α.25 σ12, centrada', sombra: [capa(0.25, 12, 0, 0)] },
  { nombre: 'ambiente media', nota: 'α.25 σ25, centrada', sombra: [capa(0.25, 25, 0, 0)] },
  { nombre: 'ambiente ancha', nota: 'α.25 σ45, centrada', sombra: [capa(0.25, 45, 0, 0)] },
  { nombre: 'ambiente muy ancha', nota: 'α.20 σ70, centrada', sombra: [capa(0.2, 70, 0, 0)] },
  { nombre: 'contacto + ambiente', nota: 'α.45 σ4 + α.18 σ35, las dos centradas', sombra: [capa(0.45, 4, 0, 0), capa(0.18, 35, 0, 0)] },
  { nombre: 'tres capas centradas', nota: 'α.15 en σ3, σ12 y σ40', sombra: [capa(0.15, 3, 0, 0), capa(0.15, 12, 0, 0), capa(0.15, 40, 0, 0)] },
  { nombre: 'ambiente expandida', nota: 'α.20 σ30, +16 de borde', sombra: [capa(0.2, 30, 0, 0, { expandir: 16 })] },
  { nombre: 'ambiente contraída', nota: 'α.35 σ30, −16 de borde: luz de frente', sombra: [capa(0.35, 30, 0, 0, { expandir: -16 })] },
  { nombre: 'casi nada', nota: 'α.08 σ13 (0,4): lo de solarn', sombra: [capa(0.08, 13, 0, 4)] },
  { nombre: 'cenital corta', nota: 'α.30 σ16 (0,8)', sombra: [capa(0.3, 16, 0, 8)] },
  { nombre: 'cenital larga', nota: 'α.30 σ40 (0,24)', sombra: [capa(0.3, 40, 0, 24)] },
  { nombre: 'flotante simétrica', nota: 'α.30 σ50 (0,40)', sombra: [capa(0.3, 50, 0, 40)] },
  { nombre: 'tinte del fondo', nota: 'sombra del color del fondo oscurecido: #4a3f44 α.35 σ35', sombra: [capa(0.35, 35, 0, 0, { color: '#4a3f44' })] },
  { nombre: 'luz + sombra', nota: 'halo blanco α.80 σ30 +10 y ambiente α.20 σ35', sombra: [capa(0.8, 30, 0, 0, { color: '#ffffff', expandir: 10 }), capa(0.2, 35, 0, 0)] },
  { nombre: 'borde duro', nota: 'sin desenfoque, +3 de borde, α.30', sombra: [capa(0.3, 0, 0, 0, { expandir: 3 })] },
  { nombre: 'niebla', nota: 'α.15 σ110, +40 de borde', sombra: [capa(0.15, 110, 0, 0, { expandir: 40 })] },
]
