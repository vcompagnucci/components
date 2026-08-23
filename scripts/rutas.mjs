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
/* CERO PIEZAS ES UN ESTADO LEGÍTIMO —el inventario placeholder se borró
   entero antes de la primera real— pero sólo si el archivo lo dice a
   propósito con el array vacío literal. Sin ese marcador, cero nombres
   significa que el regex dejó de entender pieces.ts, y eso sigue
   frenando el build: publicar rutas desincronizadas en silencio es lo
   que este script existe para impedir. */
const vacioAProposito = /PIECES:\s*Piece\[\]\s*=\s*\[\]/.test(src)
if (!rutas.length && !vacioAProposito)
  throw new Error('no se encontró ninguna pieza en pieces.ts')

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
