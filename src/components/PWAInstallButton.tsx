import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { Button } from './ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true)
      return
    }

    // En développement, afficher toujours le bouton pour test
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isDev) {
      setShowInstallButton(true)
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    // Écouter l'installation de l'app
    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Si on a le prompt natif, l'utiliser
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
          console.log('PWA installée avec succès')
        }
        
        setDeferredPrompt(null)
        setShowInstallButton(false)
      } catch (error) {
        console.error('Erreur lors de l\'installation PWA:', error)
      }
    } else {
      // Sinon, afficher les instructions manuelles
      const instructions = `
Pour installer Ordo sur votre appareil :

📱 Mobile Chrome/Edge :
• Tapez le menu ⋮ → "Installer l'application"
• Ou regardez si une notification d'installation apparaît

🍎 iPhone Safari :
• Tapez le bouton Partager 📤 → "Sur l'écran d'accueil"

💻 Bureau :
• Cherchez l'icône d'installation ⬇️ dans la barre d'adresse
• Ou menu ⋮ → "Installer Ordo..."
      `
      alert(instructions)
    }
  }

  const handleDismiss = () => {
    setShowInstallButton(false)
    // Cacher le bouton pendant 24h
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Ne pas afficher si déjà installé ou si récemment refusé
  if (isInstalled) return null
  
  const dismissedTime = localStorage.getItem('pwa-install-dismissed')
  if (dismissedTime) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
    if (daysSinceDismissed < 1) return null
  }

  if (!showInstallButton && !deferredPrompt) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative"
    >
      <Button
        onClick={handleInstallClick}
        size="sm"
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg border-0 relative overflow-hidden group"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <Download className="h-4 w-4 mr-2" />
        </motion.div>
        <span className="hidden sm:inline">Installer l'app</span>
        <span className="sm:hidden">Installer</span>
        
        {/* Animation de brillance */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3,
            ease: "linear" 
          }}
        />
      </Button>
      
      {/* Bouton pour fermer */}
      <button
        onClick={handleDismiss}
        className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center text-xs opacity-70 hover:opacity-100 transition-opacity"
        title="Masquer"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  )
}