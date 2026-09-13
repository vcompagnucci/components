import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { vaultMedia } from './scripts/vault-media.mjs'
import { removeStylesheetComments } from './scripts/remove-stylesheet-comments.mjs'
import { SITE } from './src/site'

/* THE META TAGS READ src/site.ts, they do not hold their own copy.
   index.html carries %SITE_NAME% and %SITE_DESCRIPTION% and this fills
   them in, in dev and on a build alike. `order: 'pre'` so it runs
   before anything else that rewrites the HTML. Without this the name
   lived in five places and the sentence in three, and the two nobody
   ever looks at are exactly the meta tags. */
const siteMeta = () => ({
  name: 'site-meta',
  transformIndexHtml: {
    order: 'pre' as const,
    handler: (html: string) =>
      html.replaceAll('%SITE_NAME%', SITE.name).replaceAll('%SITE_DESCRIPTION%', SITE.description),
  },
})

export default defineConfig(({ mode }) => {
  /* The empty prefix loads ALL the variables in .env, not only the ones
     that start with VITE_. It is needed because VAULT_DIR precisely
     does NOT carry that prefix: with it, Vite would bake the variable
     into the client bundle and the path on your disk would end up
     published. Without a prefix only Node reads it, here. */
  const env = loadEnv(mode, process.cwd(), '')

  return {
    /* vaultMedia is apply:'serve', so on a build it is not even
       instantiated. See scripts/vault-media.mjs.

       removeStylesheetComments is the mirror image, apply:'build': in
       development a piece's CSS arrives whole, because the comment read
       in devtools IS the documentation, and what gets PUBLISHED carries
       no comments. See scripts/remove-stylesheet-comments.mjs. */
    plugins: [siteMeta(), react(), vaultMedia(env.VAULT_DIR), removeStylesheetComments()],
    server: {
      port: 3000,
      // Without this Vite moves itself to the next free port when its
      // own is taken, and you end up looking at another project's app
      // without noticing. With strictPort it fails loudly and you see it.
      strictPort: true,
    },
    preview: { port: 3000, strictPort: true },
  }
})
