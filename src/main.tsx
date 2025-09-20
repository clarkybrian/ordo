import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Importe le script de nettoyage du cache
// import './utils/clearCache.js' // Temporairement désactivé

// Importer le gestionnaire de session pour l'initialiser
import './services/sessionManager';

// En développement, on permet de désactiver le service worker
const isDev = import.meta.env.DEV
const shouldRegisterSW = true // Toujours activer pour tester PWA

// Enregistrement du service worker pour la PWA
if ('serviceWorker' in navigator) {
  if (shouldRegisterSW) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { 
        // En développement, on s'assure que le SW est mis à jour immédiatement
        updateViaCache: isDev ? 'none' : 'imports' 
      })
        .then((registration) => {
          console.log('Service Worker enregistré avec succès:', registration.scope)
          
          // Force l'update du service worker
          if (isDev) {
            registration.update()
          }
        })
        .catch((error) => {
          console.log('Échec de l\'enregistrement du Service Worker:', error)
        })
    })
  } else if (isDev) {
    // En développement, on désactive le service worker si non explicitement activé
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister())
      console.log('Service Workers désactivés pour le développement')
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
