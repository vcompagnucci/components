import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    // Sin esto Vite se corre solo al siguiente puerto libre cuando el
    // suyo está ocupado, y terminás mirando la app de otro proyecto sin
    // enterarte. Con strictPort falla fuerte y se ve.
    strictPort: true,
  },
  preview: { port: 3002, strictPort: true },
})
