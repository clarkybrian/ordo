import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Settings, User, Mail, FolderOpen } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { EmailCard } from '../components/EmailCard'
import type { Email, Category } from '../types'

interface DashboardProps {
  user: {
    email: string
    subscription_type: 'free' | 'pro' | 'premium'
  }
  onLogout: () => void
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [emails, setEmails] = useState<Email[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Mock data pour la démo
  useEffect(() => {
    // Simulation de chargement des données
    setTimeout(() => {
      setCategories([
        { id: '1', user_id: '1', name: 'Factures', color: '#ef4444', icon: '📄', created_at: '', emails_count: 12 },
        { id: '2', user_id: '1', name: 'Billets', color: '#3b82f6', icon: '🎫', created_at: '', emails_count: 3 },
        { id: '3', user_id: '1', name: 'Banque', color: '#10b981', icon: '🏦', created_at: '', emails_count: 8 },
        { id: '4', user_id: '1', name: 'Travail', color: '#f59e0b', icon: '💼', created_at: '', emails_count: 15 }
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
          received_at: new Date(Date.now() - 86400000).toISOString(), // Hier
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
          received_at: new Date(Date.now() - 172800000).toISOString(), // Il y a 2 jours
          category_id: '3',
          category: { id: '3', user_id: '1', name: 'Banque', color: '#10b981', icon: '🏦', created_at: '' },
          is_important: true,
          is_read: false,
          labels: ['banque', 'relevé'],
          attachments: []
        }
      ])
      setIsLoading(false)
    }, 1500)
  }, [])

  const filteredEmails = emails.filter(email => {
    const matchesCategory = !selectedCategory || email.category_id === selectedCategory
    const matchesSearch = !searchQuery || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalEmails = emails.length
  const unreadEmails = emails.filter(e => !e.is_read).length
  const importantEmails = emails.filter(e => e.is_important).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Ordo</h1>
            </div>

            {/* Stats rapides */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{totalEmails}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{unreadEmails}</div>
                <div className="text-xs text-gray-500">Non lus</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600">{importantEmails}</div>
                <div className="text-xs text-gray-500">Importants</div>
              </div>
            </div>

            {/* Actions utilisateur */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Catégories */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Catégories
                </h2>
                
                <div className="space-y-2">
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
                      <span className="text-sm">{totalEmails}</span>
                    </div>
                  </motion.button>

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
    </div>
  )
}
