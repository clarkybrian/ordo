import { useState, useEffect } from 'react'
import { Download, Smartphone, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Détection iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('PWA: Install prompt intercepted')
      e.preventDefault() // Empêcher l'affichage automatique
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)

    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: App already installed')
      setShowPrompt(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt')
      } else {
        console.log('PWA: User dismissed the install prompt')
      }
    } catch (error) {
      console.error('PWA: Error during installation:', error)
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleClose = () => {
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  // Instructions pour iOS
  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl border-2 border-blue-100 p-4 z-50 max-w-sm mx-auto">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
            <Smartphone className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Installer Ordo
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Appuyez sur <span className="inline-flex items-center mx-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </span> puis "Sur l'écran d'accueil"
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  // Bouton d'installation pour Android/Desktop
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl border-2 border-blue-100 p-4 z-50 max-w-sm mx-auto">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
            <Download className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Installer Ordo
            </h3>
            <p className="text-sm text-gray-600">
              Accédez à Ordo directement depuis votre écran d'accueil
            </p>
          </div>
        </div>
        <div className="flex space-x-2 mt-3">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Installer
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    )
  }

  return null
}
