import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit3, Trash2, FolderOpen } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { Category } from '../types'

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3b82f6',
    icon: '📁'
  })

  const availableIcons = ['📁', '📄', '🎫', '🏦', '💼', '👤', '🏠', '🚗', '✈️', '🎓', '💰', '🍕', '🎮', '📱', '💡']
  const availableColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]

  useEffect(() => {
    // Mock data pour la démo
    setTimeout(() => {
      setCategories([
        { id: '1', user_id: '1', name: 'Factures', color: '#ef4444', icon: '📄', created_at: '2025-01-01', emails_count: 12 },
        { id: '2', user_id: '1', name: 'Billets', color: '#3b82f6', icon: '🎫', created_at: '2025-01-01', emails_count: 3 },
        { id: '3', user_id: '1', name: 'Banque', color: '#10b981', icon: '🏦', created_at: '2025-01-01', emails_count: 8 },
        { id: '4', user_id: '1', name: 'Travail', color: '#f59e0b', icon: '💼', created_at: '2025-01-01', emails_count: 15 },
        { id: '5', user_id: '1', name: 'Personnel', color: '#8b5cf6', icon: '👤', created_at: '2025-01-01', emails_count: 22 }
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  const handleCreateCategory = () => {
    if (newCategory.name.trim()) {
      const category: Category = {
        id: Date.now().toString(),
        user_id: '1',
        name: newCategory.name.trim(),
        color: newCategory.color,
        icon: newCategory.icon,
        created_at: new Date().toISOString(),
        emails_count: 0
      }
      
      setCategories([...categories, category])
      setNewCategory({ name: '', color: '#3b82f6', icon: '📁' })
      setShowCreateForm(false)
    }
  }

  const handleDeleteCategory = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      setCategories(categories.filter(cat => cat.id !== id))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
            <p className="text-gray-600">
              Gérez vos catégories d'emails pour une meilleure organisation
            </p>
          </div>
          
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle catégorie</span>
          </Button>
        </div>
      </div>

      {/* Formulaire de création */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Créer une nouvelle catégorie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la catégorie
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Ex: Assurances, Loisirs..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icône
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {availableIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewCategory({ ...newCategory, icon })}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          newCategory.icon === icon
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <div className="grid grid-cols-10 gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCategory({ ...newCategory, color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-transform ${
                          newCategory.color === color
                            ? 'border-gray-400 scale-110'
                            : 'border-gray-200 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <Button onClick={handleCreateCategory}>
                    Créer la catégorie
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewCategory({ name: '', color: '#3b82f6', icon: '📁' })
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grille des catégories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <AnimatePresence>
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          {category.emails_count} email{category.emails_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        Catégorie
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Carte vide pour créer une nouvelle catégorie */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: categories.length * 0.1 }}
          >
            <Card 
              className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => setShowCreateForm(true)}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center h-40 text-gray-500 hover:text-gray-700">
                <FolderOpen className="h-12 w-12 mb-3" />
                <p className="text-center font-medium">Créer une nouvelle catégorie</p>
                <p className="text-sm text-center">Organisez vos emails</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Statistiques */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Statistiques des catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
                  <div className="text-sm text-gray-500">Catégories créées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {categories.reduce((sum, cat) => sum + (cat.emails_count || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">Emails classés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.max(...categories.map(cat => cat.emails_count || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">Plus utilisée</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {categories.length > 0 ? Math.round(categories.reduce((sum, cat) => sum + (cat.emails_count || 0), 0) / categories.length) : 0}
                  </div>
                  <div className="text-sm text-gray-500">Moyenne par catégorie</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
