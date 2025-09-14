import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FolderOpen, Mail, RefreshCw, User, Edit3, UserMinus, ChevronDown } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { EmailCard } from '../components/EmailCard'
import { EmailModal } from '../components/EmailModal'
import { SyncProgressBar } from '../components/SyncProgressBar'
import { PWAInstallButton } from '../components/PWAInstallButton'
import { unsubscribeService } from '../services/unsubscribe'
import EmailCompose from '../components/EmailCompose'
import { emailSyncService, type SyncProgress } from '../services/emailSync'
import { initializeUserDatabase } from '../scripts/initializeDatabase'
import { supabase } from '../lib/supabase'
import { useWindowSize } from '../hooks/useWindowSize'
import type { Email, Category, EmailProvider } from '../types'

// Composant pour les logos des providers email
const EmailProviderLogos: React.FC<{
  selectedProvider: EmailProvider;
  onProviderChange: (provider: EmailProvider) => void;
  isChatbotOpen: boolean;
  onManualSync?: () => void;
  isSyncing?: boolean;
}> = ({ selectedProvider, onProviderChange, isChatbotOpen, onManualSync, isSyncing = false }) => {
  const { isMobile } = useWindowSize()
  
  const providers = [
    {
      id: 'gmail' as EmailProvider,
      name: 'Gmail',
      logo: '/providers/gmail-logo.png',
      fallbackIcon: '📧',
      color: 'hover:bg-red-50 hover:border-red-300'
    },
    {
      id: 'outlook' as EmailProvider,
      name: 'Outlook',
      logo: '/providers/outlook-logo.png',
      fallbackIcon: '📬',
      color: 'hover:bg-blue-50 hover:border-blue-300'
    },
    {
      id: 'yahoo' as EmailProvider,
      name: 'Yahoo',
      logo: '/providers/yahoo-logo.png',
      fallbackIcon: '💜',
      color: 'hover:bg-purple-50 hover:border-purple-300'
    }
  ];

  // Position différente selon le format
  const containerClasses = isMobile 
    ? "w-full mb-4 bg-white rounded-xl shadow-sm border border-gray-200 p-3"
    : `fixed left-4 top-1/2 transform -translate-y-1/2 z-[105] transition-all duration-300 ${isChatbotOpen ? '-translate-x-20' : ''}`
    
  // Layout différent selon le format
  const layoutClasses = isMobile 
    ? "flex flex-row justify-center space-x-4"
    : "flex flex-col space-y-4 bg-white rounded-xl shadow-lg p-3 border border-gray-200"

  return (
    <div className={containerClasses}>
      <div className={layoutClasses}>
        {providers.map((provider) => (
          <motion.button
            key={provider.id}
            onClick={() => onProviderChange(provider.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              relative ${isMobile ? 'w-12 h-12' : 'w-14 h-14'} rounded-lg border-2 transition-all duration-200 
              flex items-center justify-center group
              ${selectedProvider === provider.id 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-300 bg-white shadow-sm ' + provider.color
              }
            `}
            title={provider.name}
          >
            <img
              src={provider.logo}
              alt={provider.name}
              className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} object-contain`}
              onError={(e) => {
                // Fallback vers l'emoji si l'image ne charge pas
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLSpanElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <span 
              className={`${isMobile ? 'text-lg' : 'text-2xl'} hidden`}
              style={{ display: 'none' }}
            >
              {provider.fallbackIcon}
            </span>
            
            {/* Indicateur de sélection */}
            {selectedProvider === provider.id && (
              <motion.div
                layoutId="selectedProvider"
                className={`absolute -top-1 -right-1 ${isMobile ? 'w-2.5 h-2.5' : 'w-4 h-4'} bg-blue-500 rounded-full flex items-center justify-center`}
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <div className={`${isMobile ? 'w-1 h-1' : 'w-2 h-2'} bg-white rounded-full`}></div>
              </motion.div>
            )}
          </motion.button>
        ))}
        
        {/* Bouton Sync sur mobile seulement */}
        {isMobile && onManualSync && (
          <motion.button
            onClick={onManualSync}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSyncing || selectedProvider !== 'gmail'}
            className="w-12 h-12 rounded-lg border-2 border-red-300 bg-red-50 hover:bg-red-100 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Synchroniser"
          >
            <RefreshCw className={`h-5 w-5 text-red-600 ${isSyncing ? 'animate-spin' : ''}`} />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export function Dashboard() {
  const { isMobile } = useWindowSize()
  const [searchParams] = useSearchParams()
  const [emails, setEmails] = useState<Email[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [showProgressBar, setShowProgressBar] = useState(false)
  
  // État pour le provider sélectionné
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider>('gmail')
  
  // État pour le modal de désabonnement massif
  const [bulkUnsubscribeModal, setBulkUnsubscribeModal] = useState<{
    isOpen: boolean;
    categoryId: string;
    categoryName: string;
    emailCount: number;
    isProcessing: boolean;
    progress: number;
    currentEmail: string;
  }>({
    isOpen: false,
    categoryId: '',
    categoryName: '',
    emailCount: 0,
    isProcessing: false,
    progress: 0,
    currentEmail: ''
  })
  
  // Détection de l'état de l'assistant de conversation depuis localStorage ou état global
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  
  // État pour les filtres mobiles
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  // Écouter les changements d'état de l'assistant
  useEffect(() => {
    const checkAssistantState = () => {
      // On peut détecter si l'assistant est ouvert en regardant la largeur de la fenêtre ou un indicateur
      const assistantPanel = document.querySelector('[class*="w-112"]') // Panel de 112 de largeur
      setIsAssistantOpen(!!assistantPanel && assistantPanel.getBoundingClientRect().width > 0)
    }
    
    // Vérifier immédiatement
    checkAssistantState()
    
    // Vérifier périodiquement
    const interval = setInterval(checkAssistantState, 100)
    
    return () => clearInterval(interval)
  }, [])

  // Effet pour lire les paramètres d'URL et mettre à jour selectedCategory
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const filterParam = searchParams.get('filter')
    
    console.log(`🔗 Paramètres URL - category: ${categoryParam}, filter: ${filterParam}`)
    
    if (categoryParam) {
      console.log(`📂 Paramètre URL détecté - catégorie: ${categoryParam}`)
      setSelectedCategory(categoryParam)
    } else if (filterParam) {
      console.log(`🔍 Paramètre URL détecté - filtre: ${filterParam}`)
      if (filterParam === 'all') {
        setSelectedCategory(null)
      } else {
        setSelectedCategory(filterParam) // 'unread' ou 'important'
      }
    }
    // Retirer la réinitialisation automatique pour éviter les conflits
  }, [searchParams])

  // Log pour surveiller les changements de selectedCategory
  useEffect(() => {
    console.log(`🎯 selectedCategory changé vers: ${selectedCategory || 'null'}`)
  }, [selectedCategory])
  
  // Statistiques globales
  const [globalStats, setGlobalStats] = useState({
    totalEmails: 0,
    unreadEmails: 0,
    importantEmails: 0
  })

  // Fonction pour extraire le nom depuis l'email
  const getUserDisplayName = (email: string) => {
    if (!email) return ''
    
    // Extraire la partie avant @ et transformer
    const localPart = email.split('@')[0]
    
    // Si contient des points, considérer comme prénom.nom
    if (localPart.includes('.')) {
      const parts = localPart.split('.')
      return parts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ')
    }
    
    // Sinon, capitaliser le nom d'utilisateur
    return localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase()
  }

  // Charger les données au montage du composant
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Récupérer l'ID utilisateur
      const { data: { user: currentUserData } } = await supabase.auth.getUser()
      if (!currentUserData) return

      setCurrentUser({ 
        email: currentUserData.email || '', 
        id: currentUserData.id 
      })

      // Initialiser la base de données pour l'utilisateur (créer catégories par défaut si nécessaire)
      try {
        await initializeUserDatabase(currentUserData.id)
        console.log('✅ Base de données initialisée pour l\'utilisateur')
      } catch (error) {
        console.error('❌ Erreur initialisation BD (non critique):', error)
      }

      // Charger les catégories seulement pour Gmail (les autres providers ne sont pas connectés)
      if (selectedProvider === 'gmail') {
        const userCategories = await emailSyncService.getUserCategories(currentUserData.id)
        setCategories(userCategories)

        // Charger les statistiques globales
        await loadGlobalStats(currentUserData.id)

        // Charger les emails pour la catégorie sélectionnée 
        console.log(`📧 Chargement des emails pour la catégorie: ${selectedCategory || 'toutes'}`)
        const userEmails = await emailSyncService.getUserEmails(currentUserData.id, selectedCategory, 1000) // Limite élevée pour voir TOUS les emails stockés
        console.log(`📊 Emails chargés: ${userEmails.length} emails pour catégorie "${selectedCategory}"`)
        setEmails(userEmails as unknown as Email[])
      } else {
        // Pour Outlook/Yahoo, vider les données car pas connectés
        setCategories([])
        setEmails([])
        setGlobalStats({ totalEmails: 0, unreadEmails: 0, importantEmails: 0 })
      }

      // Charger les infos de synchronisation
      if (selectedProvider === 'gmail') {
        const syncInfo = await emailSyncService.getLastSyncInfo(currentUserData.id)
        console.log('Dernière synchronisation:', syncInfo)
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      // Afficher une erreur simple
      console.error('Impossible de charger les données')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, selectedProvider])

  // Charger les statistiques globales
  const loadGlobalStats = async (userId: string) => {
    try {
      // Compter tous les emails
      const { count: totalEmails } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Compter les emails non lus
      const { count: unreadEmails } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      // Compter les emails importants
      const { count: importantEmails } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_important', true)

      setGlobalStats({
        totalEmails: totalEmails || 0,
        unreadEmails: unreadEmails || 0,
        importantEmails: importantEmails || 0
      })

    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error)
    }
  }

  // Charger les données au changement de catégorie ou provider
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Gérer le changement de provider
  const handleProviderChange = (provider: EmailProvider) => {
    setSelectedProvider(provider)
    setSelectedCategory(null) // Reset la catégorie sélectionnée
  }

  // Filtrer les emails selon la recherche ET la catégorie sélectionnée
  const filteredEmails = emails.filter(email => {
    const matchesSearch = !searchQuery || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body_text.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filtrage par catégorie
    let matchesCategory = true
    if (selectedCategory) {
      if (selectedCategory === 'unread') {
        matchesCategory = !email.is_read
      } else if (selectedCategory === 'important') {
        matchesCategory = email.is_important
      } else {
        // Catégorie personnalisée - vérifier si l'email appartient à cette catégorie
        matchesCategory = email.category_id === selectedCategory
      }
    }
    
    return matchesSearch && matchesCategory
  })

  // Fonction pour ouvrir le modal de désabonnement massif
  const handleBulkUnsubscribeOpen = (categoryId: string, categoryName: string, emailCount: number) => {
    setBulkUnsubscribeModal({
      isOpen: true,
      categoryId,
      categoryName,
      emailCount,
      isProcessing: false,
      progress: 0,
      currentEmail: ''
    })
  }

  // Fonction pour fermer le modal de désabonnement massif
  const handleBulkUnsubscribeClose = () => {
    setBulkUnsubscribeModal({
      isOpen: false,
      categoryId: '',
      categoryName: '',
      emailCount: 0,
      isProcessing: false,
      progress: 0,
      currentEmail: ''
    })
  }

  // Gérer la synchronisation manuelle
  const handleManualSync = async () => {
    if (selectedProvider !== 'gmail') {
      alert(`Connectez-vous d'abord à ${selectedProvider}`)
      return
    }

    try {
      setIsSyncing(true)
      setShowProgressBar(true)
      setSyncProgress(null)

      // Démarrer la synchronisation
      emailSyncService.setProgressCallback((progress: SyncProgress) => {
        console.log('Progression sync:', progress)
        setSyncProgress(progress)

        // Si sync terminée, recharger les données
        if (progress.stage === 'completed') {
          setTimeout(() => {
            setShowProgressBar(false)
            setSyncProgress(null)
            loadDashboardData() // Recharger les données
          }, 1000)
        }
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      // Démarrer la sync pour cet utilisateur
      setSyncProgress({
        stage: 'connecting',
        progress: 0,
        message: 'Connexion à Gmail...'
      })

      // Synchronisation intelligente : 50 emails au début, puis incrémentale
      await emailSyncService.synchronizeEmails(50) // Synchronisation intelligente automatique

    } catch (error) {
      console.error('Erreur de synchronisation:', error)
      
      // Ignorer les erreurs de bloqueurs de publicités qui ne sont pas critiques
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isBlockedByClient = errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
                               errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT')
      
      if (!isBlockedByClient) {
        // Afficher l'erreur seulement si ce n'est pas un bloqueur de pub
        setSyncProgress({
          stage: 'error',
          progress: 100,
          message: 'Erreur lors de la synchronisation'
        })

        setTimeout(() => {
          setShowProgressBar(false)
          setSyncProgress(null)
        }, 3000)
      } else {
        // Pour les erreurs de bloqueur, considérer comme succès mais avec avertissement
        console.warn('🚫 Certaines ressources bloquées par une extension, mais sync continuée')
        setSyncProgress({
          stage: 'completed',
          progress: 100,
          message: 'Synchronisation terminée (ressources bloquées détectées)'
        })

        setTimeout(() => {
          setShowProgressBar(false)
          setSyncProgress(null)
          loadDashboardData() // Recharger quand même les données
        }, 1500)
      }
    } finally {
      setIsSyncing(false)
    }
  }

  // Gérer le clic sur un email
  const handleEmailClick = (email: Email) => {
    console.log(`📧 Ouverture de l'email: ${email.subject}`)
    setSelectedEmail(email)
    setIsEmailModalOpen(true)
  }

  // Marquer/démarquer comme important
  const handleToggleImportant = async (emailId: string) => {
    try {
      const email = emails.find(e => e.id === emailId)
      if (!email) return

      const newImportantStatus = !email.is_important
      
      // Mettre à jour dans la base de données
      const { error } = await supabase
        .from('emails')
        .update({ is_important: newImportantStatus })
        .eq('id', emailId)

      if (error) {
        console.error('Erreur toggle important:', error)
        return
      }

      // Mettre à jour l'état local
      setEmails(prevEmails => 
        prevEmails.map(e => 
          e.id === emailId ? { ...e, is_important: newImportantStatus } : e
        )
      )

      // Recharger les statistiques
      loadDashboardData()

      console.log(`⭐ Email ${newImportantStatus ? 'marqué' : 'démarqué'} comme important`)
    } catch (error) {
      console.error('Erreur toggle important:', error)
    }
  }

  // Marquer comme lu
  const handleMarkAsRead = async (emailId: string) => {
    try {
      const email = emails.find(e => e.id === emailId)
      if (!email || email.is_read) return

      // Mettre à jour dans la base de données
      const { error } = await supabase
        .from('emails')
        .update({ is_read: true })
        .eq('id', emailId)

      if (error) {
        console.error('Erreur marquer comme lu:', error)
        return
      }

      // Mettre à jour l'état local
      setEmails(prevEmails => 
        prevEmails.map(e => 
          e.id === emailId ? { ...e, is_read: true } : e
        )
      )

      // Recharger les statistiques
      loadDashboardData()

      console.log(`✅ Email marqué comme lu`)
    } catch (error) {
      console.error('Erreur marquer comme lu:', error)
    }
  }

  // Obtenir le nom d'affichage du provider
  const getProviderDisplayName = () => {
    const names = {
      gmail: 'Gmail',
      outlook: 'Outlook',
      yahoo: 'Yahoo'
    }
    return names[selectedProvider]
  }

  // Affichage pour les providers non connectés
  const renderEmptyState = () => {
    if (selectedProvider === 'gmail') return null

    const providerConfig = {
      outlook: {
        name: 'Microsoft Outlook',
        color: 'from-blue-500 to-blue-600',
        icon: '/providers/outlook-logo.png'
      },
      yahoo: {
        name: 'Yahoo Mail',
        color: 'from-purple-500 to-purple-600',
        icon: '/providers/yahoo-logo.png'
      }
    }

    const config = providerConfig[selectedProvider as keyof typeof providerConfig]
    if (!config) return null

    return (
      <div className="col-span-1 lg:col-span-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <img
                src={config.icon}
                alt={config.name}
                className="w-20 h-20 mx-auto mb-4 object-contain"
              />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {config.name} non connecté
            </h3>
            
            <p className="text-gray-600 mb-8">
              Connectez votre compte {config.name} pour voir vos emails ici
            </p>
            
            <Button 
              className={`bg-gradient-to-r ${config.color} text-white hover:shadow-lg transition-all duration-200`}
              size="lg"
            >
              Connecter {config.name}
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Logos des providers - Position fixe à gauche sur desktop, intégrés sur mobile */}
      {!isMobile && (
        <EmailProviderLogos 
          selectedProvider={selectedProvider}
          onProviderChange={handleProviderChange}
          isChatbotOpen={false}
          onManualSync={handleManualSync}
          isSyncing={isSyncing}
        />
      )}

      {/* Header Dashboard - fixe seulement sur desktop, défile sur mobile */}
      <div className={`${isMobile ? '' : 'fixed top-16 left-0 z-30'} px-4 border-b border-gray-200 bg-gray-50 shadow-sm transition-all duration-300 ${isAssistantOpen && !isMobile ? 'right-112' : 'right-0'} ${
        isMobile ? 'py-1' : 'py-4'
      }`}>
        <div className="max-w-6xl mx-auto">
          {isMobile ? (
            // Layout mobile - Organisation verticale simplifiée et compacte
            <div className="space-y-2">
              {/* Providers sur mobile - en haut avec taille réduite */}
              <div className="transform scale-90 origin-left">
                <EmailProviderLogos 
                  selectedProvider={selectedProvider}
                  onProviderChange={handleProviderChange}
                  isChatbotOpen={false}
                  onManualSync={handleManualSync}
                  isSyncing={isSyncing}
                />
              </div>
              
              {/* Ligne 1: Seulement les statistiques (pas de titre ni nom utilisateur) */}
              <div className="text-xs text-gray-600">
                {globalStats.totalEmails} emails • {globalStats.unreadEmails} non lus • {globalStats.importantEmails} importants
              </div>
              
              {/* Ligne 2: Barre de recherche compacte avec bouton installation */}
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm"
                  />
                </div>
                {/* Bouton d'installation PWA sur mobile */}
                <div className="flex-shrink-0">
                  <PWAInstallButton />
                </div>
              </div>
            </div>
          ) : (
            // Layout desktop - Organisation horizontale (existant)
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">Mes Emails</h1>
                </div>
                <div className="text-sm text-gray-500">
                  {globalStats.totalEmails} emails au total • {globalStats.unreadEmails} non lus • {globalStats.importantEmails} importants
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Barre de recherche intégrée */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher des emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm"
                  />
                </div>

                {/* Bouton Composer en vert */}
                <Button
                  onClick={() => setShowComposeModal(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Composer
                </Button>
                
                {/* Bouton d'installation PWA */}
                <PWAInstallButton />
                
                <Button
                  onClick={handleManualSync}
                  size="sm"
                  disabled={isSyncing || selectedProvider !== 'gmail'}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  Synchroniser
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal avec marge pour le header fixe seulement sur desktop */}
      <div className={`mx-auto px-4 pb-6 transition-all duration-300 ${
        isMobile ? 'pt-0' : 'pt-20'
      } ${isAssistantOpen ? 'max-w-none pr-116 pl-20' : 'max-w-6xl'}`}>
        
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Filtres et catégories</span>
            <motion.div
              animate={{ rotate: showMobileFilters ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        
        {/* Mobile Filters Sidebar */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden col-span-1 mb-4"
            >
              <Card className="max-h-[50vh] overflow-auto">
                <CardContent className="p-4">
                  <h2 className="font-semibold text-gray-900 mb-3">Filtres rapides</h2>
                  
                  <div className="space-y-1 mb-4">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedCategory(null);
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                        selectedCategory === null 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Tous les emails</span>
                        <span className="text-sm">{globalStats.totalEmails}</span>
                      </div>
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedCategory('unread');
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                        selectedCategory === 'unread'
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Non lus</span>
                        <span className="text-sm">{globalStats.unreadEmails}</span>
                      </div>
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedCategory('important');
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                        selectedCategory === 'important'
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Importants</span>
                        <span className="text-sm">{globalStats.importantEmails}</span>
                      </div>
                    </motion.button>
                  </div>
                  
                  <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Catégories
                  </h2>
                  
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {categories
                      .filter(category => (category.emails_count || 0) > 0)
                      .map((category) => (
                      <motion.button
                        key={category.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setShowMobileFilters(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                          selectedCategory === category.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span>{category.icon}</span>
                            <span className="text-sm">{category.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">{category.emails_count || 0}</span>
                            
                            {currentUser && (category.name === 'Publicité' || category.name === 'Promotions' || category.name === 'Newsletter') && category.emails_count > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBulkUnsubscribeOpen(category.id, category.name, category.emails_count);
                                  setShowMobileFilters(false);
                                }}
                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                                title={`Désabonnement massif pour ${category.name}`}
                              >
                                <UserMinus className="h-3 w-3 text-orange-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
          {/* Sidebar - Filtres et catégories */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-28 z-20">
              <Card className="max-h-[calc(100vh-160px)] overflow-auto">
                <CardContent className="p-4 overflow-hidden flex flex-col">
                  <h2 className="font-semibold text-gray-900 mb-3">Filtres rapides</h2>
                
                <div className="space-y-1 mb-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      console.log('Clic sur "Tous les emails"');
                      setSelectedCategory(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                      selectedCategory === null 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Tous les emails</span>
                      <span className="text-sm">{globalStats.totalEmails}</span>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      console.log('Clic sur "Non lus"');
                      setSelectedCategory('unread');
                    }}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                      selectedCategory === 'unread'
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Non lus</span>
                      <span className="text-sm">{globalStats.unreadEmails}</span>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      console.log('Clic sur "Importants"');
                      setSelectedCategory('important');
                    }}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                      selectedCategory === 'important'
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Importants</span>
                      <span className="text-sm">{globalStats.importantEmails}</span>
                    </div>
                  </motion.button>
                </div>
                
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Catégories
                </h2>
                
                {/* Zone scrollable pour les catégories */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="space-y-1">
                    {/* Filtrer les catégories avec au moins 1 email */}
                    {categories
                      .filter(category => (category.emails_count || 0) > 0)
                      .map((category) => (
                      <motion.button
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          console.log('Clic sur catégorie:', category.name, 'ID:', category.id);
                          console.log('selectedCategory avant:', selectedCategory);
                          setSelectedCategory(category.id);
                          console.log('selectedCategory après setSelectedCategory:', category.id);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                          selectedCategory === category.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span>{category.icon}</span>
                            <span>{category.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{category.emails_count || 0}</span>
                            
                            {/* Bouton de désabonnement compact pour certaines catégories */}
                            {currentUser && (category.name === 'Publicité' || category.name === 'Promotions' || category.name === 'Newsletter') && category.emails_count > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBulkUnsubscribeOpen(category.id, category.name, category.emails_count);
                                }}
                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                                title={`Désabonnement massif pour ${category.name}`}
                              >
                                <UserMinus className="h-3 w-3 text-orange-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Zone de contenu principal avec scroll */}
          <div className={`lg:col-span-4 col-span-1 ${isAssistantOpen ? 'lg:col-span-4' : ''}`}>
            {/* Contenu conditionnel selon le provider */}
            {selectedProvider === 'gmail' ? (
              // Interface Gmail complète
              <>

                {/* Container des emails */}
                <div className="relative">
                  {/* Liste des emails scrollable */}
                  <div className="space-y-4 pb-6">
                    {isLoading ? (
                      // Skeleton loading
                      Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                              </div>
                              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                              <div className="h-3 bg-gray-200 rounded w-full"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <AnimatePresence>
                        {filteredEmails.length > 0 ? (
                          filteredEmails.map((email) => (
                            <EmailCard
                              key={email.id}
                              email={email}
                              onClick={() => handleEmailClick(email)}
                              onStarClick={handleToggleImportant}
                              onMoveCategory={() => console.log('Déplacer email:', email.id)}
                              onMarkAsRead={handleMarkAsRead}
                            />
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-center ${isMobile ? 'py-8 mt-8' : 'py-16'}`}
                          >
                            {/* Icône positionnée différemment selon l'écran */}
                            <div className={`${isMobile ? 'mb-4' : 'mb-3'}`}>
                              <div className={`mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center ${
                                isMobile ? 'w-16 h-16' : 'w-14 h-14'
                              }`}>
                                <Mail className={`text-blue-500 ${isMobile ? 'h-8 w-8' : 'h-7 w-7'}`} />
                              </div>
                            </div>

                            {/* Titre principal compact */}
                            <h3 className={`font-bold text-gray-900 ${isMobile ? 'text-lg mb-2' : 'text-xl mb-3'}`}>
                              {selectedCategory 
                                ? "Aucun email dans cette catégorie"
                                : "Commencez votre expérience Orton !"
                              }
                            </h3>

                            {/* Message d'invitation compact */}
                            {!selectedCategory && (
                              <>
                                <p className={`text-gray-600 mx-auto leading-relaxed ${isMobile ? 'text-sm max-w-xs px-4 mb-3' : 'text-base max-w-md mb-4'}`}>
                                  Synchronisez vos emails pour découvrir notre IA de classification. 
                                  Organisation automatique et assistant intelligent inclus !
                                </p>

                                {/* Bouton de synchronisation compact */}
                                <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
                                  <Button
                                    onClick={handleManualSync}
                                    disabled={isSyncing}
                                    size={isMobile ? "default" : "lg"}
                                    className={`bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 ${
                                      isMobile ? 'px-4 py-2 text-base font-medium' : 'px-6 py-3 text-lg font-medium'
                                    }`}
                                  >
                                    {isSyncing ? (
                                      <>
                                        <RefreshCw className={`mr-2 animate-spin ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                                        {isMobile ? 'Sync...' : 'Synchronisation...'}
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className={`mr-2 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                                        {isMobile ? 'Synchroniser' : 'Synchroniser mes emails'}
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {/* Message unifié plus compact */}
                                <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 ${
                                  isMobile ? 'p-3 mx-4' : 'p-4 max-w-sm mx-auto'
                                }`}>
                                  <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                                    <div className="flex-shrink-0">
                                      <span className={`${isMobile ? 'text-base' : 'text-lg'}`}>✨</span>
                                    </div>
                                    <div className="text-left">
                                      <p className={`text-blue-700 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                        {isMobile 
                                          ? 'Assistant IA après sync !'
                                          : 'Assistant IA intégré après synchronisation'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Message pour catégorie vide */}
                            {selectedCategory && (
                              <p className="text-gray-500 max-w-sm mx-auto">
                                Cette catégorie ne contient aucun email pour le moment. 
                                Essayez une synchronisation ou changez de catégorie.
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Interface vide pour Outlook/Yahoo
              renderEmptyState()
            )}
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <SyncProgressBar 
        isVisible={showProgressBar}
        progress={syncProgress}
        onComplete={() => {
          setShowProgressBar(false)
          setSyncProgress(null)
        }}
      />

      {/* Modal email */}
      <EmailModal
        email={selectedEmail}
        isOpen={isEmailModalOpen}
        onClose={() => {
          console.log(`❌ Fermeture du modal`);
          setSelectedEmail(null);
          setIsEmailModalOpen(false);
        }}
      />

      {/* Modal de composition d'email */}
      <EmailCompose 
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
      />

      {/* Bouton flottant Écrire (mobile uniquement) - positionné au-dessus du bouton assistant */}
      {isMobile && (
        <motion.div
          className="fixed bottom-24 right-6 z-[105]"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
        >
          <Button
            onClick={() => setShowComposeModal(true)}
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all duration-300 flex items-center justify-center"
            aria-label="Écrire un email"
          >
            <Edit3 className="h-6 w-6" />
          </Button>
        </motion.div>
      )}

      {/* Modal de désabonnement massif */}
      {bulkUnsubscribeModal.isOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleBulkUnsubscribeClose} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <UserMinus className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Désabonnement massif
                  </h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ Attention : Action irréversible</strong>
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Cette action va tenter de vous désabonner automatiquement de toutes les newsletters 
                    détectées dans la catégorie <strong>"{bulkUnsubscribeModal.categoryName}"</strong>.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg text-sm mb-3">
                  <p><strong>Total d'emails :</strong> {bulkUnsubscribeModal.emailCount}</p>
                  <p><strong>Newsletters estimées :</strong> À déterminer pendant le processus</p>
                  <p className="mt-2 text-gray-600">
                    ⏱️ Cette opération peut prendre plusieurs minutes.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg text-sm mb-4">
                  <p className="font-medium text-blue-900 mb-1">
                    🎯 Types de désabonnement typiques :
                  </p>
                  <div className="text-blue-800 space-y-1">
                    <p>• Newsletters commerciales (e-commerce, services)</p>
                    <p>• Notifications marketing (promotions, offres)</p>
                    <p>• Bulletins d'information (actualités, blogs)</p>
                    <p>• Emails promotionnels récurrents</p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>Note :</strong> Certains désabonnements peuvent échouer selon la configuration 
                    du serveur email de l'expéditeur. Vous pourrez voir le détail des résultats à la fin.
                  </p>
                </div>

                {bulkUnsubscribeModal.isProcessing && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-800 font-medium">
                      🔄 Désabonnement en cours...
                    </p>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: '50%' }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={handleBulkUnsubscribeClose}
                    disabled={bulkUnsubscribeModal.isProcessing}
                  >
                    {bulkUnsubscribeModal.isProcessing ? 'En cours...' : 'Annuler'}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!currentUser) return;
                      
                      setBulkUnsubscribeModal(prev => ({ ...prev, isProcessing: true, progress: 0 }));
                      
                      try {
                        const results = await unsubscribeService.bulkUnsubscribeFromCategory(
                          bulkUnsubscribeModal.categoryId,
                          currentUser.id
                        );
                        
                        console.log('Résultats du désabonnement massif:', results);
                        handleBulkUnsubscribeClose();
                        loadDashboardData();
                        
                      } catch (error) {
                        console.error('Erreur lors du désabonnement massif:', error);
                        setBulkUnsubscribeModal(prev => ({ ...prev, isProcessing: false }));
                      }
                    }}
                    disabled={bulkUnsubscribeModal.isProcessing}
                    className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                  >
                    {bulkUnsubscribeModal.isProcessing 
                      ? 'Traitement en cours...'
                      : 'Lancer le désabonnement massif'
                    }
                  </Button>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
