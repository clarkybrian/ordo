import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true,
        // Désactive le cache de service worker en développement
        navigateFallback: undefined,
        suppressWarnings: true
      },
      // Force à ne pas mettre en cache
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: []
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: true, // Arrête si le port 5173 n'est pas disponible
    hmr: {
      overlay: true,
      // Force le reload complet au lieu du HMR partiel
      protocol: 'ws',
      host: 'localhost'
    },
    watch: {
      usePolling: true,
      interval: 100 // Réagit plus rapidement aux changements
    }
  },
  // Désactive explicitement le cache
  optimizeDeps: {
    force: true
  },
  // No-cache headers
  build: {
    sourcemap: true
  }
})
