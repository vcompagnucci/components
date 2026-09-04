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
  { nombre: 'sin sombra', nota: 'Floating bar, Photo picker, Apple', sombra: [] },
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
