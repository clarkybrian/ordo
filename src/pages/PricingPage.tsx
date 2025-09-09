import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function PricingPage() {
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

  const plans = [
    {
      name: 'Gratuit',
      price: '0€',
      period: '/mois',
      description: 'Parfait pour commencer',
      features: [
        'Jusqu\'à 100 emails/mois',
        '3 catégories personnalisées',
        'Classification automatique',
        'Support communautaire'
      ],
      notIncluded: [
        'Intégrations avancées',
        'Analyses détaillées',
        'Support prioritaire',
        'API'
      ],
      popular: false,
      cta: 'Commencer gratuitement'
    },
    {
      name: 'Pro',
      price: '9€',
      period: '/mois',
      description: 'Pour les professionnels',
      features: [
        'Jusqu\'à 5 000 emails/mois',
        'Catégories illimitées',
        'Classification avancée',
        'Intégrations multiples',
        'Analyses détaillées',
        'Support par email'
      ],
      notIncluded: [
        'Support téléphonique',
        'Onboarding personnalisé'
      ],
      popular: true,
      cta: 'Essayer Pro'
    },
    {
      name: 'Entreprise',
      price: '29€',
      period: '/mois',
      description: 'Pour les équipes',
      features: [
        'Emails illimités',
        'Catégories illimitées',
        'IA personnalisée',
        'Toutes les intégrations',
        'Analyses avancées',
        'API complète',
        'Support prioritaire',
        'Onboarding personnalisé'
      ],
      notIncluded: [],
      popular: false,
      cta: 'Contacter les ventes'
    }
  ]

  const faqs = [
    {
      question: 'Puis-je changer de plan à tout moment ?',
      answer: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement.'
    },
    {
      question: 'Que se passe-t-il si je dépasse ma limite d\'emails ?',
      answer: 'Nous vous notifierons lorsque vous approchez de votre limite. Vous pourrez upgrader votre plan ou attendre le mois suivant.'
    },
    {
      question: 'Y a-t-il une période d\'essai gratuite ?',
      answer: 'Le plan gratuit vous permet de tester toutes les fonctionnalités de base. Les plans payants offrent 14 jours d\'essai gratuit.'
    },
    {
      question: 'Comment annuler mon abonnement ?',
      answer: 'Vous pouvez annuler votre abonnement à tout moment depuis vos paramètres. Aucun frais d\'annulation.'
    },
    {
      question: 'Mes données sont-elles sécurisées ?',
      answer: 'Oui, nous utilisons un chiffrement de niveau bancaire et ne stockons jamais le contenu complet de vos emails.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tarifs simples
            </span>
            <br />
            <span className="text-gray-900">et transparents</span>
          </motion.h1>
          
          <motion.p
            className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Choisissez le plan qui correspond à vos besoins. 
            Commencez gratuitement et évoluez selon votre usage.
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`relative bg-white rounded-3xl p-8 shadow-lg ${
                  plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Le plus populaire
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start opacity-50">
                      <X className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleGoogleAuth}
                  className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comparaison détaillée
            </h2>
            <p className="text-xl text-gray-600">
              Toutes les fonctionnalités en un coup d'œil
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Fonctionnalités</th>
                    <th className="text-center py-4 px-6 font-medium text-gray-900">Gratuit</th>
                    <th className="text-center py-4 px-6 font-medium text-gray-900">Pro</th>
                    <th className="text-center py-4 px-6 font-medium text-gray-900">Entreprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-4 px-6 text-gray-700">Emails par mois</td>
                    <td className="py-4 px-6 text-center text-gray-600">100</td>
                    <td className="py-4 px-6 text-center text-gray-600">5 000</td>
                    <td className="py-4 px-6 text-center text-gray-600">Illimité</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-gray-700">Catégories personnalisées</td>
                    <td className="py-4 px-6 text-center text-gray-600">3</td>
                    <td className="py-4 px-6 text-center text-gray-600">Illimitées</td>
                    <td className="py-4 px-6 text-center text-gray-600">Illimitées</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-gray-700">Classification automatique</td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-gray-700">Intégrations</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-gray-700">API</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur nos tarifs
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Prêt à transformer votre gestion d'emails ?
            </h2>
            <button
              onClick={handleGoogleAuth}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium text-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Commencer gratuitement
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
