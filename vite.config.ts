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
        enabled: false, // Désactiver PWA en développement pour éviter les erreurs
        suppressWarnings: true
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: []
      },
      // Configuration basique du manifeste
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Orton - Email Classification',
        short_name: 'Orton',
        description: 'Classificateur automatique d\'emails',
        theme_color: '#3b82f6',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
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
