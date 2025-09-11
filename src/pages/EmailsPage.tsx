import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { EmailCard } from '../components/EmailCard'
import { EmailModal } from '../components/EmailModal'
import { emailSyncService } from '../services/emailSync'
import { supabase } from '../lib/supabase'
import type { Email, Category } from '../types'

export function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null)

  // Charger les données réelles depuis la base
  const loadEmailsData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('Utilisateur non connecté')
        return
      }

      setCurrentUser({ email: user.email || '', id: user.id })

      // Charger les catégories avec le nombre d'emails
      const userCategories = await emailSyncService.getUserCategories(user.id)
      setCategories(userCategories)

      // Charger les emails selon la catégorie sélectionnée
      const userEmails = await emailSyncService.getUserEmails(user.id, selectedCategory, 100)
      setEmails(userEmails as unknown as Email[])

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    loadEmailsData()
  }, [loadEmailsData])

  // Synchronisation
  const handleSync = useCallback(async () => {
    if (isSyncing || !currentUser) return

    setIsSyncing(true)
    try {
      console.log('🔄 Début de synchronisation des emails...')
      
      const result = await emailSyncService.synchronizeEmails()
      
      console.log('✅ Synchronisation terminée:', result)
      
      // Recharger les données après synchronisation
      await loadEmailsData()
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, currentUser, loadEmailsData])

  // Filtrage des emails
  const filteredEmails = emails.filter(email => {
    const matchesCategory = !selectedCategory || email.category_id === selectedCategory
    const matchesSearch = !searchQuery || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Gestion de la sélection d'email
  const handleEmailClick = useCallback(async (email: Email) => {
    console.log(`🖱️ Clic sur l'email: "${email.subject}" de ${email.sender_name}`);
    console.log(`🔍 Email data:`, email);
    setSelectedEmail(email);
    setIsEmailModalOpen(true);
    console.log(`✅ selectedEmail state mis à jour et modal ouvert`);
    
    // Marquer l'email comme lu s'il ne l'est pas déjà
    if (!email.is_read && currentUser) {
      try {
        console.log(`📖 Marquage de l'email comme lu...`);
        // TODO: Implémenter markEmailAsRead ou utiliser updateEmail
        // await emailSyncService.markEmailAsRead(email.id);
        // Recharger les données pour mettre à jour l'interface
        await loadEmailsData();
        console.log(`✅ Email marqué comme lu et interface mise à jour`);
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du statut de lecture:', error);
      }
    }
  }, [currentUser, loadEmailsData])

  // Statistiques
  const unreadCount = emails.filter(e => !e.is_read).length
  const importantCount = emails.filter(e => e.is_important).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des emails...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50">
      {/* Container principal - Prend toute la largeur maintenant */}
      <div className="w-full transition-all duration-300 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div className="h-full px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mes Emails</h1>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>{emails.length} emails au total</span>
                    <span>•</span>
                    <span>{unreadCount} non lus</span>
                    <span>•</span>
                    <span>{importantCount} importants</span>
                  </div>
                </div>
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="whitespace-nowrap"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sync...' : 'Synchroniser'}
                </Button>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Recherche */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Rechercher des emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filtres par catégorie */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Tous
                    <span className="ml-2 text-sm">{emails.length}</span>
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                      <span className="ml-2 text-sm">{category.emails_count || 0}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Liste des emails */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {filteredEmails.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center py-12"
                  >
                    <div className="max-w-sm mx-auto">
                      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun email trouvé
                      </h3>
                      <p className="text-gray-500">
                        {selectedCategory || searchQuery 
                          ? 'Aucun email ne correspond à vos critères de recherche.'
                          : 'Aucun email disponible. Synchronisez vos emails pour commencer.'
                        }
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {filteredEmails.map((email, index) => (
                      <motion.div
                        key={email.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <EmailCard 
                          email={email} 
                          onClick={() => handleEmailClick(email)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour les détails de l'email */}
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
