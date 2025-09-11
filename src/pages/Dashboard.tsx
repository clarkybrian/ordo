import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FolderOpen, Mail, RefreshCw, User } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { EmailCard } from '../components/EmailCard'
import { EmailModal } from '../components/EmailModal'
import { SyncProgressBar } from '../components/SyncProgressBar'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [showProgressBar, setShowProgressBar] = useState(false)
  
  // État pour le provider sélectionné
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider>('gmail')
  
  // Détection de l'état de l'assistant de conversation depuis localStorage ou état global
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  
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
        const userEmails = await emailSyncService.getUserEmails(currentUserData.id, selectedCategory, 50)
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

      await emailSyncService.synchronizeEmails(50)

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

      {/* Header Dashboard fixe - reste en haut sans bouger */}
      <div className={`fixed top-16 left-0 z-30 px-4 py-4 border-b border-gray-200 bg-gray-50 shadow-sm transition-all duration-300 ${isAssistantOpen ? 'right-112' : 'right-0'}`}>
        <div className="max-w-6xl mx-auto">
          {isMobile ? (
            // Layout mobile - Organisation verticale simplifiée
            <div className="space-y-3">
              {/* Providers sur mobile - en haut */}
              <EmailProviderLogos 
                selectedProvider={selectedProvider}
                onProviderChange={handleProviderChange}
                isChatbotOpen={false}
                onManualSync={handleManualSync}
                isSyncing={isSyncing}
              />
              
              {/* Ligne 1: Seulement les statistiques (pas de titre ni nom utilisateur) */}
              <div className="text-sm text-gray-600">
                {globalStats.totalEmails} emails • {globalStats.unreadEmails} non lus • {globalStats.importantEmails} importants
              </div>
              
              {/* Ligne 2: Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm"
                />
              </div>
            </div>
          ) : (
            // Layout desktop - Organisation horizontale (existant)
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">Mes Emails</h1>
                  {currentUser && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <User className="h-4 w-4" />
                      <span className="font-medium text-gray-900">{getUserDisplayName(currentUser.email)}</span>
                      <span>•</span>
                      <span className="font-medium text-blue-600">{getProviderDisplayName()}</span>
                    </div>
                  )}
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

      {/* Contenu principal avec marge pour le header fixe */}
      <div className={`mx-auto px-4 pb-6 transition-all duration-300 ${
        'pt-24'
      } ${isAssistantOpen ? 'max-w-none pr-116 pl-20' : 'max-w-6xl'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
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
                          <span className="text-sm">{category.emails_count || 0}</span>
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
                              onStarClick={() => console.log('Toggle important:', email.id)}
                              onMoveCategory={() => console.log('Déplacer email:', email.id)}
                            />
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                          >
                            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun email trouvé</h3>
                            <p className="text-gray-500">
                              {selectedCategory 
                                ? "Aucun email dans cette catégorie"
                                : "Essayez de modifier votre recherche"
                              }
                            </p>
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
    </div>
  )
}
