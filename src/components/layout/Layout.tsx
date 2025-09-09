import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  FolderOpen, 
  Settings, 
  User, 
  Menu, 
  X, 
  Home,
  BarChart3,
  CreditCard
} from 'lucide-react'
import { Button } from '../ui/button'
import { supabase } from '../../lib/supabase'

interface LayoutProps {
  user: {
    email: string
    subscription_type: 'free' | 'pro' | 'premium'
  }
}

export function Layout({ user }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Emails', href: '/emails', icon: Mail },
    { name: 'Catégories', href: '/categories', icon: FolderOpen },
    { name: 'Statistiques', href: '/stats', icon: BarChart3 },
    { name: 'Abonnement', href: '/subscription', icon: CreditCard },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ]

  const isCurrentPath = (path: string) => location.pathname === path

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
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {user.subscription_type.charAt(0).toUpperCase() + user.subscription_type.slice(1)}
              </span>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isCurrentPath(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Actions utilisateur */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-gray-600">{user.email}</span>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <User className="h-4 w-4" />
                </Button>
              </div>

              {/* Bouton menu mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-3 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isCurrentPath(item.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}

                {/* Info utilisateur mobile */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Plan {user.subscription_type.charAt(0).toUpperCase() + user.subscription_type.slice(1)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      Déconnexion
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Contenu principal */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
