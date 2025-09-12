const CACHE_NAME = 'ordo-v2'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files')
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting()) // Force l'activation immédiate
  )
})

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim()) // Prend le contrôle immédiatement
  )
})

// Stratégie de cache : Network First pour les fichiers dynamiques
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la requête réussit, on met en cache et on retourne la réponse
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone)
            })
        }
        return response
      })
      .catch(() => {
        // Si le réseau est indisponible, on utilise le cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response
            }
            // Si pas en cache, retour à la page d'accueil
            if (event.request.mode === 'navigate') {
              return caches.match('/')
            }
          })
      })
  )
})

// Gestion des événements PWA pour l'installation
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('PWA: Installation prompt available')
})
