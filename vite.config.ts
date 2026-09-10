import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { vaultMedia } from './scripts/vault-media.mjs'

export default defineConfig(({ mode }) => {
  /* The empty prefix loads ALL the variables in .env, not only the ones
     that start with VITE_. It is needed because VAULT_DIR precisely
     does NOT carry that prefix: with it, Vite would bake the variable
     into the client bundle and the path on your disk would end up
     published. Without a prefix only Node reads it, here. */
  const env = loadEnv(mode, process.cwd(), '')

  return {
    /* vaultMedia is apply:'serve', so on a build it is not even
       instantiated. See scripts/vault-media.mjs. */
    plugins: [react(), vaultMedia(env.VAULT_DIR)],
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
