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
          scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose',
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
      quote: "Orton a révolutionné ma productivité. Je gagne 3 heures par jour grâce à la classification automatique.",
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
      {/* Background Animations - Amélioré avec des formes géométriques dynamiques */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
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
          <div className="w-20 h-12 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 relative">
            <div className="absolute top-0 left-0 w-0 h-0 border-b-[6px] border-r-[10px] border-transparent border-b-cyan-300/10"></div>
            <div className="absolute top-0 right-0 w-0 h-0 border-b-[6px] border-l-[10px] border-transparent border-b-blue-300/10"></div>
            <div className="absolute bottom-0 left-0 w-0 h-0 border-t-[6px] border-r-[10px] border-transparent border-t-cyan-300/10"></div>
            <div className="absolute bottom-0 right-0 w-0 h-0 border-t-[6px] border-l-[10px] border-transparent border-t-blue-300/10"></div>
          </div>
        </motion.div>
        
        {/* Cercles */}
        {[...Array(8)].map((_, i) => (
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
        
        {/* Carrés */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`square-${i}`}
            className="absolute rounded-md"
            animate={{
              rotate: [0, 90, 180, 270, 360],
              x: [0, 30, 0, -30, 0],
              y: [0, -30, 0, 30, 0]
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              width: `${15 + i * 10}px`,
              height: `${15 + i * 10}px`,
              right: `${15 + i * 8}%`,
              bottom: `${20 + (i % 3) * 15}%`,
              background: `rgba(${180 - i * 15}, ${120 + i * 20}, ${220 + i * 5}, 0.08)`,
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          />
        ))}

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute w-${1 + (i % 3)} h-${1 + (i % 3)} ${i % 3 === 0 ? 'bg-blue-400/30' : i % 3 === 1 ? 'bg-purple-400/30' : 'bg-cyan-400/30'} rounded-full`}
            animate={{
              y: [-100, typeof window !== 'undefined' ? window.innerHeight + 100 : 1000],
              x: [0, Math.sin(i * 5) * 150],
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
      <section className="relative py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-8 leading-tight"
            >
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                L'avenir de la
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                gestion d'emails
              </span>
            </motion.h1>

            {/* Bouton CTA principal - déplacé ici */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-12"
            >
              <motion.button
                onClick={handleGoogleAuth}
                className="relative px-8 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl font-bold text-lg sm:text-xl shadow-2xl shadow-blue-500/25 hover:shadow-3xl hover:shadow-blue-500/30 transition-all duration-300 group overflow-hidden w-full sm:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
                <span className="relative flex items-center justify-center space-x-3">
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
                className="text-gray-700 hover:text-gray-900 transition-colors font-bold text-lg sm:text-xl flex items-center space-x-2 group"
              >
                <span>Découvrir les fonctionnalités</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto font-light px-4"
            >
              <span className="text-blue-600 font-bold">Classez • Organisez • Catégorisez</span>
              <br />
              <span className="text-purple-600 font-bold">Répondez rapidement</span> avec l'IA
            </motion.p>

            {/* Message de valeur ajoutée */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-12"
            >
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-2xl p-6 max-w-3xl mx-auto mx-4">
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-center">
                  🚀 <span className="font-semibold text-blue-600">IA ultra-rapide</span> • 
                  📧 <span className="font-semibold text-purple-600">Tri automatique</span> • 
                  ⚡ <span className="font-semibold text-green-600">Réponses instantanées</span>
                </p>
              </div>
            </motion.div>

            {/* Message de compatibilité */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-16"
            >
              <p className="text-gray-600 mb-8 text-base sm:text-lg">
                <span className="text-green-600 font-semibold">✅ Compatible</span> avec Gmail, Outlook, Yahoo et tous vos fournisseurs préférés
              </p>
            </motion.div>



            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto px-4"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2 sm:mb-3 text-blue-600">
                    {stat.icon}
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">{stat.number}</div>
                  <div className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium">{stat.label}</div>
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
            <p className="text-gray-600">Plus de 1000 entreprises utilisent Orton quotidiennement</p>
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
              Découvrez comment Orton transforme votre façon de travailler avec vos emails
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
              Ils adorent <span className="text-blue-600">Orton</span>
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
                <span className="text-2xl font-bold">Orton</span>
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
              © 2025 Orton. Conçu avec ❤️ pour simplifier votre vie.
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
