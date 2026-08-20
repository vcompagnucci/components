/* Genera vercel.json desde pieces.ts.

   El host tiene que servir index.html SÓLO para las rutas que existen,
   y devolver un 404 de verdad para todo lo demás — que es lo que hacen
   benji y josh, medido con curl. Un fallback ciego a index.html daría
   200 en cualquier URL inventada.

   Se genera y no se escribe a mano porque escribirla a mano es duplicar
   pieces.ts en un archivo que nadie mira: el día que se agregue una
   pieza, su URL daría 404 en producción y nada lo diría. Corre en
   prebuild, así no se puede publicar desincronizado. */
import { readFileSync, writeFileSync } from 'node:fs'

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const src = readFileSync(new URL('../src/pieces.ts', import.meta.url), 'utf8')
const rutas = [...src.matchAll(/name: '([^']+)'/g)].map((m) => slug(m[1]))
if (!rutas.length) throw new Error('no se encontró ninguna pieza en pieces.ts')

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  /* La barra final redirige al canónico con 308, como los dos. */
  trailingSlash: false,
  rewrites: [{ source: `/:pieza(${rutas.join('|')})`, destination: '/index.html' }],
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
