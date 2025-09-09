import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, FolderOpen, Mail, RefreshCw, Plus, LogOut, User } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { EmailCard } from '../components/EmailCard'
import { SyncProgressBar } from '../components/SyncProgressBar'
import { emailSyncService, type SyncProgress } from '../services/emailSync'
import { initializeUserDatabase } from '../scripts/initializeDatabase'
import { supabase } from '../lib/supabase'
import { signOut } from '../services/auth'
import type { Email, Category } from '../types'

export function Dashboard() {
  const [emails, setEmails] = useState<Email[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [showProgressBar, setShowProgressBar] = useState(false)

  // Fonction de déconnexion
  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Afficher une erreur simple sans toast
      alert('Erreur lors de la déconnexion')
    }
  }, [])

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
        console.error('⚠️ Erreur initialisation BD (non critique):', error)
      }

      // Charger les catégories
      const userCategories = await emailSyncService.getUserCategories(currentUserData.id)
      setCategories(userCategories)

      // Charger les emails
      const userEmails = await emailSyncService.getUserEmails(currentUserData.id, selectedCategory, 50)
      setEmails(userEmails as unknown as Email[])

      // Charger les infos de synchronisation
      const syncInfo = await emailSyncService.getLastSyncInfo(currentUserData.id)
      console.log('Dernière synchronisation:', syncInfo)

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      // Afficher une erreur simple
      console.error('Impossible de charger les données')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory])

  // Synchronisation manuelle uniquement
  const handleSync = useCallback(async () => {
    console.log('🔄 Début de synchronisation manuelle...')
    
    if (isSyncing) {
      console.log('🚫 Synchronisation déjà en cours, abandon...')
      return
    }

    setIsSyncing(true)
    setShowProgressBar(true)
    setSyncProgress(null)

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error('Utilisateur non connecté')
      }

      console.log('✅ Utilisateur connecté:', currentUser.email)

      // Configurer le callback de progression
      emailSyncService.setProgressCallback((progress: SyncProgress) => {
        console.log('📊 Progression:', progress.stage, progress.progress + '%', progress.message)
        setSyncProgress(progress)
        
        // Recharger les données du dashboard UNIQUEMENT après récupération réussie
        if (progress.stage === 'fetching' && progress.progress >= 20 && progress.total_emails && progress.total_emails > 0) {
          console.log('🔄 Rechargement des données après récupération...')
          loadDashboardData()
        }
      })

      // Lancer la synchronisation
      console.log('🚀 Démarrage de la synchronisation...')
      const result = await emailSyncService.synchronizeEmails(50)

      if (result.success) {
        console.log('✅ Synchronisation réussie:', result)
        setSyncProgress({
          stage: 'completed',
          progress: 100,
          message: `${result.new_emails} nouveaux emails classifiés avec succès !`,
          emails_processed: result.processed_emails,
          total_emails: result.processed_emails
        })

        // Recharger les données finales
        setTimeout(async () => {
          await loadDashboardData()
          console.log('🔄 Données rechargées après synchronisation')
        }, 1000)
      } else {
        console.error('❌ Échec de la synchronisation:', result.errors)
        setSyncProgress({
          stage: 'error',
          progress: 0,
          message: result.errors.join(', ') || 'Erreur de synchronisation'
        })
      }

    } catch (error) {
      console.error('💥 Erreur lors de la synchronisation:', error)
      
      setSyncProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsSyncing(false)
      
      // Masquer la barre après 4 secondes
      setTimeout(() => {
        console.log('🔄 Masquage de la barre de progression')
        setShowProgressBar(false)
        setSyncProgress(null)
      }, 4000)
    }
  }, [isSyncing, loadDashboardData])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Synchronisation manuelle uniquement - DESACTIVEE automatique
  // useEffect(() => {
  //   let hasTriggeredAutoSync = false
  //   let isMounted = true

  //   const checkAutoSync = async () => {
  //     try {
  //       if (hasTriggeredAutoSync || !isMounted) return
        
  //       const { data: { user: currentUser } } = await supabase.auth.getUser()
  //       if (!currentUser || !isMounted) return

  //       const { data: existingEmails } = await supabase
  //         .from('emails')
  //         .select('id')
  //         .eq('user_id', currentUser.id)
  //         .limit(1)

  //       const isFirstConnection = !existingEmails || existingEmails.length === 0
        
  //       if (isFirstConnection && !isSyncing && !showProgressBar && isMounted) {
  //         console.log('🎯 Première connexion détectée - Démarrage de la synchronisation automatique')
  //         hasTriggeredAutoSync = true
          
  //         setTimeout(() => {
  //           if (!isSyncing && isMounted) {
  //             handleSync()
  //           }
  //         }, 1500)
  //       }
  //     } catch (error) {
  //       console.error('Erreur lors de la vérification auto-sync:', error)
  //     }
  //   }

  //   const timer = setTimeout(checkAutoSync, 3000)
    
  //   return () => {
  //     isMounted = false
  //     clearTimeout(timer)
  //   }
  // }, [handleSync, isSyncing, showProgressBar])

  console.log('🚀 Dashboard chargé - Synchronisation manuelle uniquement')

  const filteredEmails = emails.filter(email => {
    const matchesCategory = !selectedCategory || email.category_id === selectedCategory
    const matchesSearch = !searchQuery || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })
  
  const unreadCount = emails.filter(e => !e.is_read).length
  const importantCount = emails.filter(e => e.is_important).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Mes Emails</h1>
                {currentUser && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">{currentUser.email}</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600">
                {emails.length} emails • {unreadCount} non lus • {importantCount} importants
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser'}</span>
              </Button>
              
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouvelle catégorie</span>
              </Button>

              <Button 
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filtres et catégories */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardContent className="p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Filtres rapides</h2>
                
                <div className="space-y-2 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedCategory === null 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Tous les emails</span>
                      <span className="text-sm">{emails.length}</span>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory('unread')}
                    className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-100`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Non lus</span>
                      <span className="text-sm">{unreadCount}</span>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory('important')}
                    className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-100`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Importants</span>
                      <span className="text-sm">{importantCount}</span>
                    </div>
                  </motion.button>
                </div>
                
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Catégories
                </h2>
                <div className="space-y-2">

                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
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
                        <span className="text-sm">{category.emails_count}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content - Liste des emails */}
          <div className="lg:col-span-3">
            {/* Barre de recherche */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher des emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Liste des emails */}
            <div className="space-y-4">
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
                        onClick={() => console.log('Ouvrir email:', email.id)}
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
        </div>
      </div>
      
      {/* Barre de progression pour la synchronisation */}
      <SyncProgressBar 
        isVisible={showProgressBar}
        progress={syncProgress}
        onComplete={() => {
          setShowProgressBar(false)
          setSyncProgress(null)
        }}
      />
    </div>
  )
}
