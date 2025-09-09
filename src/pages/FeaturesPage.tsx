import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mail, Zap, Shield, Brain, Smartphone, Globe, Clock, Users, TrendingUp, Star, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function FeaturesPage() {
  const navigate = useNavigate()

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
  const mainFeatures = [
    {
      icon: <Brain className="h-12 w-12" />,
      title: "Intelligence Artificielle Avancée",
      description: "Notre IA de pointe analyse et classe vos emails avec une précision de 98%",
      details: [
        "Apprentissage automatique en temps réel",
        "Reconnaissance de patterns complexes",
        "Amélioration continue des performances",
        "Personnalisation selon vos habitudes"
      ],
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Zap className="h-12 w-12" />,
      title: "Traitement Ultra-Rapide",
      description: "Classification instantanée de milliers d'emails en quelques secondes",
      details: [
        "Traitement en moins de 100ms par email",
        "Support de volumes importants",
        "Optimisation cloud avancée",
        "Performance garantie 24/7"
      ],
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Shield className="h-12 w-12" />,
      title: "Sécurité Maximale",
      description: "Protection de niveau bancaire pour vos données les plus sensibles",
      details: [
        "Chiffrement AES-256 end-to-end",
        "Conformité RGPD complète",
        "Audit de sécurité mensuel",
        "Authentification multi-facteurs"
      ],
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <Smartphone className="h-12 w-12" />,
      title: "Application Mobile Native",
      description: "Accédez à Ordo depuis n'importe où avec notre PWA optimisée",
      details: [
        "Installation en un clic",
        "Mode hors-ligne disponible",
        "Synchronisation temps réel",
        "Interface adaptative"
      ],
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <Globe className="h-12 w-12" />,
      title: "Intégrations Multiples",
      description: "Compatible avec tous vos outils de productivité préférés",
      details: [
        "Gmail, Outlook, Yahoo Mail",
        "Slack, Microsoft Teams",
        "Notion, Trello, Asana",
        "API ouverte pour développeurs"
      ],
      color: "from-indigo-500 to-blue-600"
    },
    {
      icon: <TrendingUp className="h-12 w-12" />,
      title: "Analytics Avancés",
      description: "Insights détaillés sur vos habitudes de communication",
      details: [
        "Rapports de productivité",
        "Tendances temporelles",
        "Analyse des expéditeurs",
        "Métriques personnalisées"
      ],
      color: "from-pink-500 to-rose-600"
    }
  ]

  const additionalFeatures = [
    { title: "Recherche intelligente", description: "Trouvez n'importe quel email en quelques mots" },
    { title: "Réponses automatiques", description: "IA qui suggère des réponses contextuelles" },
    { title: "Gestion des pièces jointes", description: "Organisation automatique de tous vos fichiers" },
    { title: "Mode focus", description: "Concentrez-vous sur les emails importants" },
    { title: "Planification d'envoi", description: "Programmez vos emails au bon moment" },
    { title: "Templates intelligents", description: "Modèles adaptatifs selon le contexte" },
    { title: "Collaboration d'équipe", description: "Partagez et collaborez sur vos emails" },
    { title: "Backup automatique", description: "Sauvegarde sécurisée de tous vos emails" }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Background Animations */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ right: '-10%', top: '20%' }}
        />
      </div>

      {/* Header */}
      <header className="relative bg-white/90 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Retour</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Ordo</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
            >
              Se connecter
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto mb-20"
          >
            <h1 className="text-5xl lg:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Fonctionnalités
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                révolutionnaires
              </span>
            </h1>
            <p className="text-2xl text-gray-600 leading-relaxed">
              Découvrez comment Ordo révolutionne votre gestion d'emails avec des technologies de pointe
            </p>
          </motion.div>

          {/* Main Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative bg-white rounded-3xl p-10 shadow-2xl shadow-gray-200/50 hover:shadow-3xl hover:shadow-gray-200/60 transition-all duration-500 border border-gray-100 overflow-hidden h-full">
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                    initial={false}
                  />
                  
                  <div className="relative">
                    <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center mb-8 text-white group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-6">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-center text-gray-700">
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Et bien plus encore...
            </h2>
            <p className="text-xl text-gray-600">
              Une suite complète d'outils pour optimiser votre productivité
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300"
              >
                <div className="flex items-center mb-3">
                  <Star className="h-5 w-5 text-blue-500 mr-2" />
                  <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                </div>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Prêt à découvrir <span className="text-blue-600">Ordo</span> ?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Testez toutes ces fonctionnalités gratuitement pendant 14 jours
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Essayer gratuitement
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
