import { motion } from 'framer-motion'
import { Mail, Zap, Shield, Users, BarChart3, Smartphone, Globe, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function FeaturesPage() {
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
      icon: <Zap className="h-8 w-8" />,
      title: 'Classification IA automatique',
      description: 'Notre intelligence artificielle analyse et classe vos emails automatiquement selon vos habitudes et préférences.',
      benefits: [
        'Précision de 95% dans la classification',
        'Apprentissage continu de vos préférences',
        'Traitement en temps réel',
        'Support de 12 langues'
      ]
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Catégories personnalisables',
      description: 'Créez vos propres catégories et laissez Ordo apprendre à reconnaître automatiquement le type de chaque email.',
      benefits: [
        'Catégories illimitées (plan Pro+)',
        'Règles personnalisées',
        'Tags et labels intelligents',
        'Hierarchie de catégories'
      ]
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Analyses et insights',
      description: 'Obtenez des statistiques détaillées sur vos habitudes email et optimisez votre productivité.',
      benefits: [
        'Tableaux de bord visuels',
        'Métriques de productivité',
        'Tendances temporelles',
        'Rapports exportables'
      ]
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Sécurité maximale',
      description: 'Vos données sont protégées par un chiffrement de niveau bancaire. Nous ne lisons jamais vos emails.',
      benefits: [
        'Chiffrement AES-256',
        'Authentification OAuth2',
        'Conformité RGPD',
        'Audit de sécurité régulier'
      ]
    }
  ]

  const additionalFeatures = [
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: 'Application mobile',
      description: 'Accédez à vos emails classifiés depuis votre smartphone.'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Multi-comptes',
      description: 'Gérez plusieurs comptes email depuis une seule interface.'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Synchronisation temps réel',
      description: 'Vos emails sont classifiés instantanément à leur arrivée.'
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Intégrations',
      description: 'Compatible avec Gmail, Outlook, Apple Mail et plus.'
    }
  ]

  const useCases = [
    {
      title: 'Professionnels',
      description: 'Triez automatiquement vos emails clients, factures, et communications internes.',
      example: 'Un consultant sépare automatiquement les emails de ses 5 clients différents.'
    },
    {
      title: 'Entrepreneurs',
      description: 'Concentrez-vous sur les emails importants et automatisez le reste.',
      example: 'Un CEO priorise les emails investisseurs vs. les newsletters marketing.'
    },
    {
      title: 'Freelances',
      description: 'Organisez vos projets, factures, et prospection commercial.',
      example: 'Un designer organise ses briefs clients, factures, et opportunités.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              className="text-5xl md:text-6xl font-bold mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Fonctionnalités
              </span>
              <br />
              <span className="text-gray-900">puissantes et simples</span>
            </motion.h1>
            
            <motion.p
              className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Découvrez comment Ordo transforme votre expérience email grâce à 
              l'intelligence artificielle et une interface intuitive.
            </motion.p>

            <motion.button
              onClick={handleGoogleAuth}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium text-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Essayer gratuitement
            </motion.button>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <div className="text-blue-600 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Et bien plus encore
            </h2>
            <p className="text-xl text-gray-600">
              Toutes les fonctionnalités dont vous avez besoin
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <div className="text-blue-600 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Parfait pour votre profil
            </h2>
            <p className="text-xl text-gray-600">
              Ordo s'adapte à tous les types d'utilisateurs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {useCase.description}
                </p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Exemple : </span>
                    {useCase.example}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              Simple comme bonjour, puissant comme l'IA
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Connectez votre email
              </h3>
              <p className="text-gray-600">
                Connectez votre compte Gmail en quelques clics avec OAuth sécurisé.
              </p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Définissez vos catégories
              </h3>
              <p className="text-gray-600">
                Créez vos catégories personnalisées ou utilisez nos suggestions intelligentes.
              </p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Laissez l'IA faire le travail
              </h3>
              <p className="text-gray-600">
                Ordo classe automatiquement tous vos emails entrants et existants.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-8">
              Prêt à révolutionner votre boîte email ?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Rejoignez des milliers d'utilisateurs qui ont déjà repris le contrôle
            </p>
            <button
              onClick={handleGoogleAuth}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-medium text-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Commencer gratuitement
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
