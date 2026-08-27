/* Genera vercel.json desde pieces.ts.

   El host tiene que servir index.html SÓLO para las rutas que existen,
   y devolver un 404 de verdad para todo lo demás — que es lo que hacen
   benji y josh, medido con curl. Un fallback ciego a index.html daría
   200 en cualquier URL inventada.

   Se genera y no se escribe a mano porque escribirla a mano es duplicar
   pieces.ts en un archivo que nadie mira: el día que se agregue una
   pieza, su URL daría 404 en producción y nada lo diría. Corre en
   prebuild, así no se puede publicar desincronizado.

   IMPORTA pieces.ts DE VERDAD, no lo lee con un regex. Acá vivía un
   matchAll de `name: '...'` con su propia copia del slug, y las dos
   cosas eran deuda: el regex se rompía en silencio si el archivo
   cambiaba de forma (por eso existía el guard de "vacío a propósito"),
   y el slug copiado divergía del de la página. Node ≥24 —que engines ya
   exige— corre TypeScript sin tipos ejecutables, así que se puede leer
   la lista real con la cuenta real. Si pieces.ts no compila, esto
   revienta acá y el build no sale: mismo freno, sin regex. */
import { writeFileSync, readFileSync } from 'node:fs'
import { PIECES, slug } from '../src/pieces.ts'

const rutas = PIECES.map((p) => slug(p.name))

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  /* La barra final redirige al canónico con 308, como los dos. */
  trailingSlash: false,
  /* Sin piezas no hay rewrite: sólo existe `/`, y cualquier otra URL
     recibe el 404 del host. */
  ...(rutas.length
    ? { rewrites: [{ source: `/:pieza(${rutas.join('|')})`, destination: '/index.html' }] }
    : {}),
}

const salida = new URL('../vercel.json', import.meta.url)
const texto = JSON.stringify(config, null, 2) + '\n'
const antes = (() => {
  try {
    return readFileSync(salida, 'utf8')
  } catch {
    return ''
  }
})()
writeFileSync(salida, texto)
console.log(
  `vercel.json ${antes === texto ? 'sin cambios' : 'actualizado'} — ${rutas.length} rutas: ${rutas.join(' ')}`,
)
