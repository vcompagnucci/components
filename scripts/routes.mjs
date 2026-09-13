/* Generates vercel.json from pieces.ts.

   The host has to serve index.html ONLY for the routes that exist, and
   return a real 404 for everything else, which is what both measured sites
   do, measured with curl. A blind fallback to index.html would give 200
   on any made-up URL.

   It is generated and not written by hand because writing it by hand is
   duplicating pieces.ts into a file nobody looks at: the day a piece
   gets added, its URL would 404 in production and nothing would say so.
   It runs in prebuild, so it cannot be published out of sync.

   IT IMPORTS pieces.ts FOR REAL, it does not read it with a regex.
   There used to be a matchAll of `name: '...'` here with its own copy
   of the slug, and both things were debt: the regex broke in silence if
   the file changed shape (that is why the "empty on purpose" guard
   existed), and the copied slug drifted from the page's. Node ≥24,
   which engines already requires, runs TypeScript without executable
   types, so the real list can be read. If pieces.ts does not compile,
   this blows up here and the build does not come out: same brake,
   without a regex. Each piece's slug is a FIELD of its entry since
   2026-09-10, not a computation over the name: here it gets read, not
   computed. */
import { writeFileSync, readFileSync } from 'node:fs'
import { PIECES } from '../src/pieces.ts'

const routes = PIECES.map((p) => p.slug)

const IMMUTABLE = 'public, max-age=31536000, immutable'

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  /* The trailing slash redirects to the canonical with a 308, like both
     of them. */
  trailingSlash: false,
  /* With no pieces there is no rewrite: only `/` exists, and any other
     URL gets the host's 404. */
  ...(routes.length
    ? { rewrites: [{ source: `/:piece(${routes.join('|')})`, destination: '/index.html' }] }
    : {}),
  /* THE CACHE, and it goes here and not in vercel.json by hand because
     this script OVERWRITES that whole file on every prebuild. Editing
     it directly was tried twice and both times the build deleted it
     without saying anything.

     Without this section Vercel answers `public, max-age=0,
     must-revalidate` for EVERYTHING (measured with curl against
     production on 2026-09-10, including the JS with a content hash), so
     every reload downloads the whole site again. That was the symptom.

     The rule is a single one: if the name of the file changes when the
     file changes, it can be cached forever. */
  headers: [
    /* Vite gives them a content hash: `index-Q3GrExxQ.js`. A change
       changes the name, so `immutable` cannot serve anything old. */
    { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: IMMUTABLE }] },
    /* Stable name, but a font does not change. IF IT EVER CHANGES THE
       FILE HAS TO BE RENAMED: whoever already has it stays a year with
       the old one. */
    { source: '/fonts/(.*)', headers: [{ key: 'Cache-Control', value: IMMUTABLE }] },
    /* The videos also have a stable name and they DO get recorded
       again, so `immutable` does not go here: one day of cache (the
       reload comes out instant) and thirty of revalidation in the
       background. */
    {
      source: '/pieces/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=2592000' },
      ],
    },
  ],
}

const output = new URL('../vercel.json', import.meta.url)
const text = JSON.stringify(config, null, 2) + '\n'
const before = (() => {
  try {
    return readFileSync(output, 'utf8')
  } catch {
    return ''
  }
})()
writeFileSync(output, text)
console.log(
  `vercel.json ${before === text ? 'unchanged' : 'updated'} · ${routes.length} routes: ${routes.join(' ')}`,
)
