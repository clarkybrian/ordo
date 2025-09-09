import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { EmailCard } from '../components/EmailCard'
import { emailSyncService } from '../services/emailSync'
import { supabase } from '../lib/supabase'
import type { Email, Category } from '../types'

export function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Emails</h1>
          <p className="text-gray-600 mt-2">
            Gérez et consultez tous vos emails classifiés
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{emails.length}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total emails</p>
                  <p className="text-2xl font-semibold text-gray-900">{emails.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">{unreadCount}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Non lus</p>
                  <p className="text-2xl font-semibold text-gray-900">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 font-semibold">{importantCount}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Importants</p>
                  <p className="text-2xl font-semibold text-gray-900">{importantCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
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

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(null)}
                className="whitespace-nowrap"
              >
                Toutes
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                    borderColor: category.color,
                    color: selectedCategory === category.id ? 'white' : category.color
                  }}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                  <span className="ml-2 text-sm">{(category as any).emails_count || 0}</span>
                </Button>
              ))}
            </div>

            {/* Sync Button */}
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

        {/* Email List */}
        <div className="space-y-4">
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
                  {!selectedCategory && !searchQuery && (
                    <Button onClick={handleSync} disabled={isSyncing} className="mt-4">
                      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                      Synchroniser maintenant
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-4"
              >
                {filteredEmails.map((email, index) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <EmailCard email={email} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination info */}
        {filteredEmails.length > 0 && (
          <div className="mt-8 text-center text-gray-500">
            Affichage de {filteredEmails.length} email{filteredEmails.length > 1 ? 's' : ''}
            {selectedCategory && categories.find(c => c.id === selectedCategory) && (
              <span> dans la catégorie "{categories.find(c => c.id === selectedCategory)?.name}"</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
