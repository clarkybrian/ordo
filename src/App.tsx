import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { PublicLayout } from './components/layout/PublicLayout'
import { LandingPage } from './pages/LandingPage'
import { FeaturesPage } from './pages/FeaturesPage'
import { PricingPage } from './pages/PricingPage'
import { AboutPage } from './pages/AboutPage'
import { LoginPage } from './pages/LoginPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { TermsOfServicePage } from './pages/TermsOfServicePage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { CategoriesPage } from './pages/CategoriesPage'
import SentEmailsPage from './pages/SentEmailsPage'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { handlePlanSelection } from './services/stripe'
import type { User } from '@supabase/supabase-js'

// Pages temporaires pour la démo
function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handlePlanClick = async (planName: string) => {
    console.log('🔄 Clic sur le plan (SubscriptionPage):', planName)
    try {
      setIsLoading(planName)
      console.log('⏳ État de chargement activé pour:', planName)
      await handlePlanSelection(planName)
      console.log('✅ Sélection du plan terminée pour:', planName)
    } catch (error) {
      console.error('❌ Erreur lors de la sélection du plan:', error)
    } finally {
      setIsLoading(null)
      console.log('🔚 État de chargement désactivé')
    }
  }
  const plans = [
    {
      name: "Gratuit",
      price: "0€",
      period: "/mois",
      color: "gray",
      popular: false,
      description: "Parfait pour commencer",
      features: [
        "📧 10 derniers emails seulement",
        "🔄 Synchronisation manuelle uniquement",
        "🤖 1 question IA par mois",
        "📁 3 catégories maximum"
      ],
      notIncluded: [
        "❌ Synchronisation quotidienne automatique",
        "❌ Catégories illimitées",
        "❌ Aide à la rédaction IA",
        "❌ Questions IA illimitées",
        "❌ Synchronisation en temps réel",
        "❌ Assistant IA personnel avancé"

      ],
      limitations: []
    },
    {
      name: "Pro",
      price: "2.99€",
      period: "/mois",
      color: "blue",
      popular: true,
      description: "Pour les professionnels",
      features: [
        "📧 Synchronisation quotidienne automatique",
        "🤖 3 questions IA par mois",
        "📁 Catégories illimitées",
        "📊 Analyses et statistiques",
        "🔔 Notifications en temps réel",
        "📝 Aide à la rédaction IA",
        "🎯 Priorisation intelligente"
      ],
      notIncluded: [
        "❌ Questions IA illimitées",
        "❌ Synchronisation en temps réel",
        "❌ Assistant IA personnel avancé"
      ],
      limitations: []
    },
    {
      name: "Premium",
      price: "5.99€",
      period: "/mois",
      color: "purple",
      popular: false,
      description: "Pour les équipes",
      features: [
        "🚀 Tout de l'offre Pro",
        "🤖 Questions IA illimitées",
        "⚡ Synchronisation en temps réel",
        "🧠 Assistant IA personnel avancé",
        "📈 Analytics approfondies",
        "🔗 Intégrations tierces",
        "👥 Support prioritaire 24/7",
        "🎨 Interface personnalisable",
        "📱 Application mobile dédiée",
        "🔒 Sécurité entreprise"
      ],
      notIncluded: [],
      limitations: []
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choisissez votre abonnement
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Orton grandit avec vous. Commencez gratuitement et évoluez selon vos besoins de gestion email.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border-2 p-8 flex flex-col h-full ${
              plan.popular
                ? 'border-blue-500 shadow-xl scale-105'
                : 'border-gray-200 shadow-lg'
            } bg-white`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
                  ⭐ Le plus populaire
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 ml-1">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start">
                  <span className="text-green-500 mr-2 mt-0.5">✓</span>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
              {plan.notIncluded.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start opacity-50">
                  <span className="text-red-400 mr-2 mt-0.5">✗</span>
                  <span className="text-gray-500 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanClick(plan.name)}
              disabled={isLoading === plan.name}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 mt-auto ${
                plan.name === 'Gratuit'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  : plan.popular
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-purple-600'
                  : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600'
              }`}
            >
              {isLoading === plan.name ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Redirection...
                </span>
              ) : (
                plan.name === 'Gratuit' ? 'Commencer gratuitement' : 'Choisir ce plan'
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">🔄 Puis-je changer d'abonnement ?</h3>
            <p className="text-gray-600 text-sm">Oui, vous pouvez upgrader ou downgrader à tout moment. Les changements prennent effet immédiatement.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">💳 Quels modes de paiement acceptez-vous ?</h3>
            <p className="text-gray-600 text-sm">Nous acceptons toutes les cartes bancaires principales via Stripe, notre processeur de paiement sécurisé.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">🔒 Mes données sont-elles sécurisées ?</h3>
            <p className="text-gray-600 text-sm">Absolument. Nous utilisons un chiffrement de niveau bancaire et ne stockons jamais vos mots de passe email.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">❌ Puis-je annuler à tout moment ?</h3>
            <p className="text-gray-600 text-sm">Oui, vous pouvez annuler votre abonnement à tout moment depuis vos paramètres, sans frais cachés.</p>
          </div>
        </div>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Route de callback d'authentification - toujours accessible */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        
        {/* Routes privées - utilisateur connecté */}
        {user && (
          <>
            <Route 
              path="/"
              element={
                <Layout 
                  user={{
                    email: user.email || '',
                    subscription_type: 'free'
                  }}
                />
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="sent-emails" element={<SentEmailsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
        
        {/* Routes publiques - utilisateur non connecté */}
        {!user && (
          <>
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="features" element={<FeaturesPage />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="login" element={<LoginPage />} />
            </Route>
            {/* Routes sans layout pour les pages légales */}
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
      
      {/* Composant PWA Install Prompt */}
      <PWAInstallPrompt />
    </Router>
  )
}

export default App
