import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { vaultMedia } from './scripts/vault-media.mjs'

export default defineConfig(({ mode }) => {
  /* El prefijo vacío carga TODAS las variables del .env, no sólo las
     que empiezan con VITE_. Hace falta porque VAULT_DIR justamente NO
     lleva ese prefijo: con él, Vite la hornearía en el bundle del
     cliente y la ruta de tu disco terminaría publicada. Sin prefijo la
     lee sólo Node, acá. */
  const env = loadEnv(mode, process.cwd(), '')

  return {
    /* vaultMedia es apply:'serve', así que en build ni se instancia.
       Ver scripts/vault-media.mjs. */
    plugins: [react(), vaultMedia(env.VAULT_DIR)],
    server: {
      port: 3000,
      // Sin esto Vite se corre solo al siguiente puerto libre cuando el
      // suyo está ocupado, y terminás mirando la app de otro proyecto sin
      // enterarte. Con strictPort falla fuerte y se ve.
      strictPort: true,
    },
    preview: { port: 3000, strictPort: true },
  }
})
