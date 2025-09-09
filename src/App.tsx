import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { LandingPage } from './pages/LandingPage'
import { FeaturesPage } from './pages/FeaturesPage'
import { PricingPage } from './pages/PricingPage'
import { AboutPage } from './pages/AboutPage'
import { LoginPage } from './pages/LoginPage'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { EmailsPage } from './pages/EmailsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import type { User } from '@supabase/supabase-js'

// Pages temporaires pour la démo
function StatsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Statistiques</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Page des statistiques en cours de développement</p>
      </div>
    </div>
  )
}

function SubscriptionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Abonnement</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Page d'abonnement en cours de développement</p>
      </div>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Page des paramètres en cours de développement</p>
      </div>
    </div>
  )
}

function PublicApp() {
  const [currentPage, setCurrentPage] = useState('home')

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
  }

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.readonly',
          redirectTo: window.location.origin
        }
      })
      
      if (error) {
        console.error('Erreur lors de l\'authentification:', error.message)
        alert('Erreur lors de la connexion. Veuillez réessayer.')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur inattendue. Veuillez réessayer.')
    }
  }

  switch (currentPage) {
    case 'features':
      return <FeaturesPage onNavigate={handleNavigate} />
    case 'pricing':
      return <PricingPage onNavigate={handleNavigate} />
    case 'about':
      return <AboutPage onNavigate={handleNavigate} />
    case 'login':
      return <LoginPage onLogin={handleGoogleAuth} onNavigate={handleNavigate} />
    default:
      return <LandingPage onNavigate={handleNavigate} />
  }
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <PublicApp />
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/"
          element={
            <Layout 
              user={{
                email: user.email || '',
                subscription_type: 'free' // À récupérer depuis la base de données
              }}
            />
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard user={{ email: user.email || '', subscription_type: 'free' }} onLogout={() => {}} />} />
          <Route path="emails" element={<EmailsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
