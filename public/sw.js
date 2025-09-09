const CACHE_NAME = 'ordo-v1'
const urlsToCache = [
  '/',
  '/manifest.json'
]

// Détermine si nous sommes en développement (port 5173)
const isDevelopment = self.location.port === '5173';

// Installation du service worker
self.addEventListener('install', (event) => {
  // En développement, on skip le cache
  if (isDevelopment) {
    self.skipWaiting();
    return;
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

// Stratégie de cache : Network First en développement, Cache First en production
self.addEventListener('fetch', (event) => {
  // Si nous sommes en développement, toujours privilégier le réseau
  if (isDevelopment) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Si le réseau échoue, on essaie le cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // En production, on utilise le cache d'abord
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse du cache si elle existe
        if (response) {
          return response
        }
        
        // Sinon, faire la requête réseau
        return fetch(event.request).then((response) => {
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Cloner la réponse
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })

          return response
        })
      })
  )
})

// Activation du service worker
self.addEventListener('activate', (event) => {
  // En développement, on nettoie tous les caches et on prend le contrôle immédiatement
  if (isDevelopment) {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        ).then(() => self.clients.claim());
      })
    );
    return;
  }

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
