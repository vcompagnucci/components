import css from './privado.module.css'

/* EL PLAYGROUND — donde se construye.

   FASE 1: el cascarón y el estado vacío. El canvas, los frames
   arrastrables y el reproductor de la inspo son las fases 4 y 5.

   Va a tener VARIAS VISTAS, como entrar a distintos diseños en Figma;
   ésta de acá es la lista de todas. Por eso el vacío dice "vistas" y no
   "canvas": lo que falta es la primera, no el lugar. */
export function Playground() {
  return <p className={css.vacio}>No views yet.</p>
}
