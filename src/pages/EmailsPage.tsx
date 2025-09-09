import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, RefreshCw, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { EmailCard } from '../components/EmailCard'
import type { Email, Category } from '../types'

export function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Mock data pour la démo
  useEffect(() => {
    setTimeout(() => {
      setCategories([
        { id: '1', user_id: '1', name: 'Factures', color: '#ef4444', icon: '📄', created_at: '', emails_count: 12 },
        { id: '2', user_id: '1', name: 'Billets', color: '#3b82f6', icon: '🎫', created_at: '', emails_count: 3 },
        { id: '3', user_id: '1', name: 'Banque', color: '#10b981', icon: '🏦', created_at: '', emails_count: 8 },
        { id: '4', user_id: '1', name: 'Travail', color: '#f59e0b', icon: '💼', created_at: '', emails_count: 15 },
        { id: '5', user_id: '1', name: 'Personnel', color: '#8b5cf6', icon: '👤', created_at: '', emails_count: 22 }
      ])

      setEmails([
        {
          id: '1',
          user_id: '1',
          gmail_id: 'gmail1',
          subject: 'Facture EDF - Janvier 2025',
          sender: 'EDF',
          sender_email: 'noreply@edf.fr',
          body: 'Votre facture d\'électricité pour le mois de janvier...',
          snippet: 'Votre facture d\'électricité pour le mois de janvier est disponible',
          received_at: new Date().toISOString(),
          category_id: '1',
          category: { id: '1', user_id: '1', name: 'Factures', color: '#ef4444', icon: '📄', created_at: '' },
          is_important: true,
          is_read: false,
          labels: ['facture'],
          attachments: [{ id: '1', email_id: '1', filename: 'facture_edf.pdf', content_type: 'application/pdf', size: 125000, storage_path: '/storage/facture_edf.pdf' }]
        },
        {
          id: '2',
          user_id: '1',
          gmail_id: 'gmail2',
          subject: 'Billet SNCF - Réservation confirmée',
          sender: 'SNCF Connect',
          sender_email: 'noreply@sncf.fr',
          body: 'Votre réservation de billet de train...',
          snippet: 'Votre réservation de billet de train Paris-Lyon a été confirmée',
          received_at: new Date(Date.now() - 86400000).toISOString(),
          category_id: '2',
          category: { id: '2', user_id: '1', name: 'Billets', color: '#3b82f6', icon: '🎫', created_at: '' },
          is_important: false,
          is_read: true,
          labels: ['transport'],
          attachments: []
        },
        {
          id: '3',
          user_id: '1',
          gmail_id: 'gmail3',
          subject: 'Relevé de compte - Décembre 2024',
          sender: 'Crédit Agricole',
          sender_email: 'noreply@credit-agricole.fr',
          body: 'Votre relevé de compte mensuel...',
          snippet: 'Votre relevé de compte mensuel est maintenant disponible',
          received_at: new Date(Date.now() - 172800000).toISOString(),
          category_id: '3',
          category: { id: '3', user_id: '1', name: 'Banque', color: '#10b981', icon: '🏦', created_at: '' },
          is_important: true,
          is_read: false,
          labels: ['banque', 'relevé'],
          attachments: []
        },
        {
          id: '4',
          user_id: '1',
          gmail_id: 'gmail4',
          subject: 'Réunion équipe - Mercredi 10h',
          sender: 'Marie Dupont',
          sender_email: 'marie.dupont@entreprise.fr',
          body: 'Bonjour, nous avons une réunion équipe...',
          snippet: 'Réunion équipe prévue mercredi à 10h en salle de conférence',
          received_at: new Date(Date.now() - 259200000).toISOString(),
          category_id: '4',
          category: { id: '4', user_id: '1', name: 'Travail', color: '#f59e0b', icon: '💼', created_at: '' },
          is_important: false,
          is_read: true,
          labels: ['réunion'],
          attachments: []
        },
        {
          id: '5',
          user_id: '1',
          gmail_id: 'gmail5',
          subject: 'Invitation anniversaire Paul',
          sender: 'Sophie Martin',
          sender_email: 'sophie.martin@gmail.com',
          body: 'Salut ! Paul fête ses 30 ans...',
          snippet: 'Invitation pour l\'anniversaire de Paul samedi prochain',
          received_at: new Date(Date.now() - 345600000).toISOString(),
          category_id: '5',
          category: { id: '5', user_id: '1', name: 'Personnel', color: '#8b5cf6', icon: '👤', created_at: '' },
          is_important: false,
          is_read: false,
          labels: ['social'],
          attachments: []
        }
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  const filteredEmails = emails.filter(email => {
    const matchesCategory = !selectedCategory || email.category_id === selectedCategory
    const matchesSearch = !searchQuery || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleSync = async () => {
    setIsSyncing(true)
    // Simulation de synchronisation
    setTimeout(() => {
      setIsSyncing(false)
    }, 2000)
  }

  const unreadCount = emails.filter(e => !e.is_read).length
  const importantCount = emails.filter(e => e.is_important).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes Emails</h1>
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
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === 'unread' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-gray-100'
                  }`}
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
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === 'important' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Importants</span>
                    <span className="text-sm">{importantCount}</span>
                  </div>
                </motion.button>
              </div>

              <h3 className="font-semibold text-gray-900 mb-3">Catégories</h3>
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
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
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
  )
}
