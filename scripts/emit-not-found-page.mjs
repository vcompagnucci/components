/* ═══════════════════════════════════════════════════════════════
   THE 404 PAGE THIS REPO ALREADY HAS, MADE REACHABLE.

   `src/not-found.tsx` is a whole piece: a ring with gravity, drag and
   throw, a restitution of 0.90 on the walls against 0.86 on the floor,
   one voice fired when the whole ring bounces. It was built, it is in
   `LOG.md` (§ Error 404), and until 2026-09-15 NOBODY HAD EVER SEEN IT
   in production.

   Measured that day on the served site, before this plugin existed:

     exhibition.vitocompagnucci.com/nonsense   →  "The page could not be
     components-three-pi.vercel.app/nonsense       found · NOT_FOUND"

   That is Vercel's grey page, not ours. The cause is `vercel.json`: it
   rewrites the four piece slugs to `/index.html` and NOTHING else, so
   any other path never reaches the app and the static host answers on
   its own. The router was ready the whole time. `fromUrl` in `app.tsx`
   returns `{ kind: 'none' }` for anything it does not recognize and the
   app renders `NotFound`; it simply was never asked.

   ─── WHY A COPY OF index.html AND NOT A CATCH-ALL REWRITE ───

   The obvious fix is `{ "source": "/(.*)", "destination": "/index.html" }`,
   which Vercel documents for SPAs. It is wrong here. A rewrite answers
   200, so every mistyped URL would report success to a crawler, to a
   link checker and to whoever shared it, and the ring would be drawn
   under a status that says the page is fine. A 404 page that does not
   return 404 is a decoration.

   A static host serves `404.html` from the output root for an unmatched
   path AND keeps the status. So what ships is the same document under a
   second name.

   ─── AND IT IS COPIED AFTER THE BUILD, NOT WRITTEN BY HAND ───

   The shell names hashed assets (`index-DSyX_nCm.js`), which only exist
   once the bundle is written, so a file sitting in `public/` would
   point at whatever hash was current the day somebody pasted it and
   would 404 its own script forever after. `closeBundle` runs after the
   HTML has been written and transformed, meta tags filled in and all,
   so the copy is byte for byte the page the site already serves.
   ═══════════════════════════════════════════════════════════════ */
import fs from 'node:fs'
import path from 'node:path'

export function emitNotFoundPage() {
  let outDir = 'dist'

  return {
    name: 'emit-not-found-page',
    apply: 'build',

    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },

    closeBundle() {
      const index = path.join(outDir, 'index.html')
      /* Loud, not silent. If the shell is not there the build produced
         something this plugin does not understand, and a 404 page that
         quietly does not exist is exactly the failure being fixed. */
      if (!fs.existsSync(index)) {
        this.error(`emit-not-found-page: ${index} was not written, so there is nothing to copy.`)
      }
      fs.copyFileSync(index, path.join(outDir, '404.html'))
      this.info('404.html written from index.html')
    },
  }
}
