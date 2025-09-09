import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mail, Shield, Zap, Users, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.readonly',
          redirectTo: `${window.location.origin}/auth/callback`
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
  const benefits = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Configuration en 2 minutes",
      description: "Connectez votre Gmail et commencez immédiatement"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "100% sécurisé",
      description: "Chiffrement de niveau bancaire et conformité RGPD"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "50k+ utilisateurs satisfaits",
      description: "Rejoignez une communauté qui nous fait confiance"
    }
  ]

  const features = [
    "Classification IA en temps réel",
    "Catégories personnalisées illimitées",
    "Synchronisation automatique",
    "Interface mobile responsive",
    "Analytics et statistiques",
    "Support client prioritaire"
  ]

  const emailProviders = [
    { name: 'Gmail', icon: '📧', users: '2M+' },
    { name: 'Outlook', icon: '📮', users: '1.5M+' },
    { name: 'Yahoo', icon: '💌', users: '800k+' },
    { name: 'ProtonMail', icon: '🔒', users: '200k+' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Animations - Amélioré avec des formes géométriques dynamiques */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/15 to-purple-400/15 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ left: '-10%', top: '10%' }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          style={{ right: '-5%', top: '30%' }}
        />
        
        {/* Formes géométriques dynamiques */}
        {/* Triangle */}
        <motion.div
          className="absolute w-24 h-24 border-t-[40px] border-r-[20px] border-l-[20px] border-transparent border-t-blue-400/10"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ left: '15%', top: '20%' }}
        />
        
        {/* Hexagone */}
        <motion.div
          className="absolute"
          animate={{
            rotate: [0, 360],
            y: [0, 50, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ right: '20%', top: '40%' }}
        >
          <div className="w-16 h-10 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 relative">
            <div className="absolute top-0 left-0 w-0 h-0 border-b-[5px] border-r-[8px] border-transparent border-b-cyan-300/10"></div>
            <div className="absolute top-0 right-0 w-0 h-0 border-b-[5px] border-l-[8px] border-transparent border-b-blue-300/10"></div>
            <div className="absolute bottom-0 left-0 w-0 h-0 border-t-[5px] border-r-[8px] border-transparent border-t-cyan-300/10"></div>
            <div className="absolute bottom-0 right-0 w-0 h-0 border-t-[5px] border-l-[8px] border-transparent border-t-blue-300/10"></div>
          </div>
        </motion.div>
        
        {/* Cercles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
            style={{
              width: `${20 + i * 5}px`,
              height: `${20 + i * 5}px`,
              left: `${10 + i * 10}%`,
              top: `${30 + (i % 4) * 15}%`,
              background: `rgba(${100 + i * 20}, ${150 + i * 10}, 255, 0.1)`,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          />
        ))}
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute w-${1 + (i % 2)} h-${1 + (i % 2)} ${i % 3 === 0 ? 'bg-blue-400/30' : i % 3 === 1 ? 'bg-purple-400/30' : 'bg-cyan-400/30'} rounded-full`}
            animate={{
              y: [-100, typeof window !== 'undefined' ? window.innerHeight + 100 : 1000],
              x: [0, Math.sin(i * 5) * 100],
              opacity: [0, 0.7, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `-100px`
            }}
          />
        ))}
      </div>

      <div className="relative min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-md w-full"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Bienvenue sur Ordo
                </h1>
                <p className="text-gray-600">
                  Connectez-vous pour révolutionner votre gestion d'emails
                </p>
              </div>

              {/* Google Login Button */}
              <motion.button
                onClick={handleGoogleAuth}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 mb-6 flex items-center justify-center space-x-3"
              >
                <span className="text-2xl">🚀</span>
                <span>Se connecter avec Google</span>
              </motion.button>

              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 mb-4">
                  En vous connectant, vous acceptez nos{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">conditions d'utilisation</a>
                  {' '}et notre{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">politique de confidentialité</a>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0 mt-0.5">
                      {benefit.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{benefit.title}</div>
                      <div className="text-gray-600 text-sm">{benefit.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="text-center text-blue-700 text-sm">
                  <span className="font-semibold">🎉 Offre de lancement :</span> 14 jours gratuits sur tous les plans payants
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Features & Info */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-gray-900 to-blue-900 items-center justify-center px-8">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-lg text-white"
          >
            <h2 className="text-4xl font-bold mb-6">
              L'IA qui comprend vos emails
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Ordo analyse et classe automatiquement vos emails avec une précision de 98%. 
              Plus besoin de perdre du temps à organiser manuellement.
            </p>

            {/* Features List */}
            <div className="space-y-4 mb-10">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-blue-100">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Email Providers */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-blue-100">Compatible avec :</h3>
              <div className="grid grid-cols-2 gap-4">
                {emailProviders.map((provider, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{provider.icon}</span>
                      <div>
                        <div className="font-semibold text-white text-sm">{provider.name}</div>
                        <div className="text-blue-200 text-xs">{provider.users} utilisateurs</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20"
            >
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">⭐</span>
                ))}
              </div>
              <p className="text-blue-100 italic mb-4">
                "Ordo a transformé ma productivité. Je gagne 3 heures par jour grâce à la classification automatique."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  👩‍💼
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Sarah Chen</div>
                  <div className="text-blue-200 text-xs">CEO, TechCorp</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
