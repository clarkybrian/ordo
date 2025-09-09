import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Check, Star, Zap, Shield, Users } from 'lucide-react'

interface PricingPageProps {
  onNavigate: (page: string) => void
}

export function PricingPage({ onNavigate }: PricingPageProps) {
  const plans = [
    {
      name: "Gratuit",
      price: "0€",
      period: "/mois",
      description: "Parfait pour découvrir Ordo",
      features: [
        "500 emails/mois",
        "5 catégories personnalisées",
        "Classification IA basique",
        "Synchronisation quotidienne",
        "Application mobile",
        "Support par email"
      ],
      highlighted: false,
      color: "from-gray-500 to-gray-600",
      popular: false
    },
    {
      name: "Pro",
      price: "19€",
      period: "/mois",
      description: "Pour les professionnels exigeants",
      features: [
        "5 000 emails/mois",
        "Catégories illimitées",
        "IA avancée + apprentissage",
        "Synchronisation temps réel",
        "Analytics détaillés",
        "Intégrations premium",
        "Support prioritaire",
        "Backup automatique"
      ],
      highlighted: true,
      color: "from-blue-500 to-purple-600",
      popular: true
    },
    {
      name: "Enterprise",
      price: "49€",
      period: "/mois",
      description: "Pour les équipes et entreprises",
      features: [
        "Emails illimités",
        "IA personnalisée avancée",
        "Collaboration d'équipe",
        "API complète",
        "Intégrations sur mesure",
        "Support 24/7 dédié",
        "Onboarding personnalisé",
        "SLA garanti 99.9%",
        "Conformité entreprise"
      ],
      highlighted: false,
      color: "from-purple-500 to-pink-600",
      popular: false
    }
  ]

  const faqs = [
    {
      question: "Puis-je changer de plan à tout moment ?",
      answer: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement."
    },
    {
      question: "Y a-t-il une période d'essai gratuite ?",
      answer: "Oui, tous les plans payants incluent 14 jours d'essai gratuit. Aucune carte bancaire requise."
    },
    {
      question: "Que se passe-t-il si je dépasse ma limite d'emails ?",
      answer: "Nous vous préviendrons à 80% de votre quota. Au-delà, le service continue mais vous serez invité à upgrader."
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Absolument. Nous utilisons un chiffrement de niveau bancaire et sommes conformes aux réglementations RGPD."
    },
    {
      question: "Puis-je annuler mon abonnement ?",
      answer: "Oui, vous pouvez annuler à tout moment. Votre accès continue jusqu'à la fin de votre période de facturation."
    }
  ]

  const comparisonFeatures = [
    { feature: "Emails traités par mois", free: "500", pro: "5 000", enterprise: "Illimité" },
    { feature: "Catégories personnalisées", free: "5", pro: "Illimitées", enterprise: "Illimitées" },
    { feature: "IA avancée", free: "Basique", pro: "Avancée", enterprise: "Personnalisée" },
    { feature: "Synchronisation", free: "Quotidienne", pro: "Temps réel", enterprise: "Temps réel" },
    { feature: "Analytics", free: "❌", pro: "✅", enterprise: "✅ Avancés" },
    { feature: "API", free: "❌", pro: "Basique", enterprise: "Complète" },
    { feature: "Support", free: "Email", pro: "Prioritaire", enterprise: "24/7 Dédié" },
    { feature: "Collaboration", free: "❌", pro: "❌", enterprise: "✅" }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ left: '-10%', top: '30%' }}
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
                Tarifs simples
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                et transparents
              </span>
            </h1>
            <p className="text-2xl text-gray-600 leading-relaxed mb-8">
              Choisissez le plan qui correspond parfaitement à vos besoins
            </p>
            <div className="inline-flex items-center bg-green-50 border border-green-200 rounded-full px-6 py-3 text-green-700">
              <Star className="h-5 w-5 mr-2 text-green-500" />
              <span className="font-medium">14 jours d'essai gratuit sur tous les plans payants</span>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white rounded-3xl p-8 shadow-2xl border transition-all duration-300 hover:shadow-3xl ${
                  plan.highlighted
                    ? 'ring-2 ring-blue-500 scale-105 shadow-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                      ⭐ Plus populaire
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 text-lg">{plan.period}</span>
                  </div>

                  <motion.button
                    onClick={() => onNavigate('login')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl hover:shadow-2xl'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.name === 'Gratuit' ? 'Commencer gratuitement' : 'Essayer 14 jours gratuits'}
                  </motion.button>
                </div>

                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              Comparaison détaillée
            </h2>
            
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-6 px-8 font-bold text-gray-900">Fonctionnalités</th>
                      <th className="text-center py-6 px-6 font-bold text-gray-900">Gratuit</th>
                      <th className="text-center py-6 px-6 font-bold text-blue-600 bg-blue-50">Pro</th>
                      <th className="text-center py-6 px-6 font-bold text-gray-900">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((item, index) => (
                      <tr key={index} className="border-t border-gray-100">
                        <td className="py-4 px-8 font-medium text-gray-900">{item.feature}</td>
                        <td className="py-4 px-6 text-center text-gray-600">{item.free}</td>
                        <td className="py-4 px-6 text-center text-blue-600 bg-blue-50/50 font-semibold">{item.pro}</td>
                        <td className="py-4 px-6 text-center text-gray-600">{item.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              Questions fréquentes
            </h2>
            
            <div className="max-w-4xl mx-auto space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
              Prêt à commencer avec <span className="text-blue-600">Ordo</span> ?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Rejoignez plus de 50 000 utilisateurs qui font confiance à Ordo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('login')}
                className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Commencer gratuitement
              </button>
              <button
                onClick={() => onNavigate('features')}
                className="px-10 py-4 bg-white text-gray-900 rounded-2xl font-bold text-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300"
              >
                Voir les fonctionnalités
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
