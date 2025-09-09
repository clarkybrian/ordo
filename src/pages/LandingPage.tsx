import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowRight, Star, Shield, Zap, Users, Check, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function LandingPage() {
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
  const trustedBrands = [
    { name: 'Microsoft', logo: '🏢' },
    { name: 'Google', logo: '🌟' },
    { name: 'Apple', logo: '🍎' },
    { name: 'Amazon', logo: '📦' },
    { name: 'Netflix', logo: '🎬' },
    { name: 'Spotify', logo: '🎵' },
    { name: 'Uber', logo: '🚗' },
    { name: 'Airbnb', logo: '🏠' },
    { name: 'Tesla', logo: '⚡' },
    { name: 'Meta', logo: '📱' },
    { name: 'Twitter', logo: '🐦' },
    { name: 'LinkedIn', logo: '💼' }
  ]

  const emailProviders = [
    { name: 'Gmail', icon: '📧', color: 'from-red-500 to-red-600' },
    { name: 'Outlook', icon: '📮', color: 'from-blue-600 to-blue-700' },
    { name: 'Yahoo', icon: '💌', color: 'from-purple-600 to-purple-700' },
    { name: 'ProtonMail', icon: '🔒', color: 'from-green-600 to-green-700' }
  ]

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "IA Ultra-Rapide",
      description: "Classification instantanée avec 98% de précision grâce à notre technologie d'apprentissage automatique avancée",
      details: ["Traitement en temps réel", "Amélioration continue", "Personnalisation intelligente"]
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Sécurité Maximum",
      description: "Chiffrement end-to-end et conformité RGPD pour protéger vos données les plus sensibles",
      details: ["Chiffrement AES-256", "Conformité RGPD", "Audit de sécurité"]
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Interface Intuitive",
      description: "Design épuré inspiré d'Apple pour une expérience utilisateur parfaite et sans friction",
      details: ["Design Apple-like", "Navigation fluide", "Accessibilité optimale"]
    }
  ]

  const stats = [
    { number: "50k+", label: "Utilisateurs actifs", icon: <Users className="h-6 w-6" /> },
    { number: "2M+", label: "Emails traités", icon: <Mail className="h-6 w-6" /> },
    { number: "98%", label: "Précision IA", icon: <Star className="h-6 w-6" /> },
    { number: "3h", label: "Temps économisé/jour", icon: <Clock className="h-6 w-6" /> }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CEO, TechCorp",
      avatar: "👩‍💼",
      quote: "Ordo a révolutionné ma productivité. Je gagne 3 heures par jour grâce à la classification automatique.",
      rating: 5
    },
    {
      name: "Marc Dubois",
      role: "Freelance Designer",
      avatar: "👨‍🎨",
      quote: "Interface magnifique et IA impressionnante. Mes emails sont parfaitement organisés sans effort.",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      role: "Marketing Director",
      avatar: "👩‍💻",
      quote: "La meilleure solution de gestion d'emails que j'ai testée. Intuitive et puissante.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Background Animations */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
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
          className="absolute w-80 h-80 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"
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
        <motion.div
          className="absolute w-64 h-64 bg-gradient-to-r from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
          style={{ left: '50%', bottom: '20%' }}
        />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
            animate={{
              y: [-100, typeof window !== 'undefined' ? window.innerHeight + 100 : 1000],
              x: [0, Math.sin(i) * 100],
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

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] bg-gray-900" />
      </div>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-8">
                <Star className="h-4 w-4 mr-2 text-blue-500" />
                IA de nouvelle génération • Plus de 50k utilisateurs
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-6xl lg:text-8xl font-bold mb-8 leading-tight"
            >
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                L'avenir de la
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                gestion d'emails
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-2xl lg:text-3xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto font-light"
            >
              Découvrez une nouvelle façon de gérer vos emails avec notre IA révolutionnaire. 
              <span className="text-blue-600 font-medium"> Organisez, classifiez et optimisez </span>
              votre productivité comme jamais auparavant.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            >
              <motion.button
                onClick={handleGoogleAuth}
                className="relative px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl font-bold text-xl shadow-2xl shadow-blue-500/25 hover:shadow-3xl hover:shadow-blue-500/30 transition-all duration-300 group overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
                <span className="relative flex items-center space-x-3">
                  <span>Essayer gratuitement</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="h-6 w-6" />
                  </motion.div>
                </span>
              </motion.button>
              
              <button 
                onClick={() => navigate('/features')}
                className="text-gray-700 hover:text-gray-900 transition-colors font-bold text-xl flex items-center space-x-2 group"
              >
                <span>Découvrir les fonctionnalités</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>

            {/* Email Providers */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-16"
            >
              <p className="text-gray-600 mb-8 text-lg">Compatible avec tous vos fournisseurs d'emails préférés</p>
              <div className="flex flex-wrap justify-center gap-6">
                {emailProviders.map((provider, index) => (
                  <motion.div
                    key={provider.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="flex items-center space-x-3 bg-white rounded-2xl px-6 py-4 shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${provider.color} rounded-xl flex items-center justify-center text-2xl`}>
                      {provider.icon}
                    </div>
                    <span className="font-semibold text-gray-900 text-lg">{provider.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-3 text-blue-600">
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted Brands Carousel */}
      <section className="relative py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h3>
            <p className="text-gray-600">Plus de 1000 entreprises utilisent Ordo quotidiennement</p>
          </motion.div>

          <div className="relative overflow-hidden">
            <motion.div
              className="flex space-x-12"
              animate={{ x: [0, -100 * trustedBrands.length] }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {[...trustedBrands, ...trustedBrands].map((brand, index) => (
                <div
                  key={`${brand.name}-${index}`}
                  className="flex-shrink-0 flex items-center space-x-3 bg-white rounded-2xl px-6 py-4 shadow-lg shadow-gray-200/50 border border-gray-100 min-w-[180px]"
                >
                  <span className="text-2xl">{brand.logo}</span>
                  <span className="font-semibold text-gray-900 whitespace-nowrap">{brand.name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Features */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Fonctionnalités <span className="text-blue-600">révolutionnaires</span>
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
              Découvrez comment Ordo transforme votre façon de travailler avec vos emails
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative bg-white rounded-3xl p-10 shadow-2xl shadow-gray-200/50 hover:shadow-3xl hover:shadow-gray-200/60 transition-all duration-500 border border-gray-100 overflow-hidden h-full">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={false}
                  />
                  
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-8 text-blue-600 group-hover:scale-110 transition-transform duration-300">
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
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Ils adorent <span className="text-blue-600">Ordo</span>
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez ce que disent nos utilisateurs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
              Transformez votre
              <span className="text-blue-600"> productivité </span>
              dès aujourd'hui
            </h2>
            
            <p className="text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Rejoignez plus de 50 000 professionnels qui ont révolutionné leur gestion d'emails
            </p>

            <motion.button
              onClick={handleGoogleAuth}
              className="relative px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl font-bold text-2xl shadow-2xl shadow-blue-500/25 hover:shadow-3xl hover:shadow-blue-500/30 transition-all duration-300 group overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
              <span className="relative flex items-center space-x-4">
                <span>Commencer maintenant</span>
                <motion.div
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="h-7 w-7" />
                </motion.div>
              </span>
            </motion.button>

            <p className="text-gray-500 mt-6">
              Essai gratuit • Sans engagement • Installation en 2 minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Ordo</span>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                L'avenir de la gestion d'emails. Organisez, classifiez et optimisez votre productivité avec notre IA révolutionnaire.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-white">Produit</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => navigate('/features')} className="hover:text-white transition-colors">Fonctionnalités</button></li>
                <li><button onClick={() => navigate('/pricing')} className="hover:text-white transition-colors">Tarifs</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Sécurité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-white">Entreprise</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">À propos</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              © 2025 Ordo. Conçu avec ❤️ pour simplifier votre vie.
            </div>
            <div className="flex space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
              <a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
