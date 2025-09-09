import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Users, Heart, Target, Award, Calendar } from 'lucide-react'

interface AboutPageProps {
  onNavigate: (page: string) => void
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-fondatrice",
      avatar: "👩‍💼",
      bio: "Ex-Google, experte en IA et machine learning. Passionnée par l'amélioration de la productivité."
    },
    {
      name: "Marc Dubois",
      role: "CTO & Co-fondateur",
      avatar: "👨‍💻",
      bio: "Architecte logiciel senior, spécialiste en sécurité et scalabilité des systèmes distribués."
    },
    {
      name: "Lisa Rodriguez",
      role: "Head of Design",
      avatar: "👩‍🎨",
      bio: "Designer UX/UI primée, ancienne Apple. Créatrice d'interfaces élégantes et intuitives."
    },
    {
      name: "Thomas Martin",
      role: "Lead AI Engineer",
      avatar: "🧠",
      bio: "PhD en Intelligence Artificielle, spécialisé dans le traitement du langage naturel."
    }
  ]

  const values = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Mission",
      description: "Révolutionner la gestion des emails en rendant l'IA accessible à tous les professionnels"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Vision",
      description: "Un monde où chaque professionnel peut se concentrer sur ce qui compte vraiment"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Valeurs",
      description: "Innovation, simplicité, sécurité et respect de la vie privée"
    }
  ]

  const timeline = [
    {
      year: "2023",
      title: "Création d'Ordo",
      description: "Lancement de l'entreprise avec une équipe de 4 passionnés"
    },
    {
      year: "2024",
      title: "Premier prototype",
      description: "Développement de la première version de notre IA de classification"
    },
    {
      year: "2024",
      title: "Lancement Beta",
      description: "100 premiers utilisateurs testent Ordo avec des retours exceptionnels"
    },
    {
      year: "2025",
      title: "Lancement public",
      description: "Ouverture au grand public et croissance rapide à 50k+ utilisateurs"
    }
  ]

  const stats = [
    { number: "50k+", label: "Utilisateurs actifs" },
    { number: "2M+", label: "Emails traités" },
    { number: "98%", label: "Satisfaction client" },
    { number: "15", label: "Pays couverts" }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ right: '-10%', top: '10%' }}
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
                Notre histoire
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                commence ici
              </span>
            </h1>
            <p className="text-2xl text-gray-600 leading-relaxed">
              Découvrez l'équipe passionnée qui révolutionne la gestion d'emails
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-20"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="relative py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ce qui nous guide
            </h2>
            <p className="text-xl text-gray-600">
              Nos valeurs fondamentales qui inspirent chaque décision
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Notre parcours
            </h2>
            <p className="text-xl text-gray-600">
              Les étapes clés de l'aventure Ordo
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {timeline.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                    <div className="text-blue-600 font-bold text-lg mb-2">{event.year}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
                    <p className="text-gray-600">{event.description}</p>
                  </div>
                </div>
                
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg z-10"></div>
                
                <div className="w-1/2"></div>
              </motion.div>
            ))}
            
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-0.5 w-0.5 h-full bg-blue-200 -z-10"></div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Rencontrez l'équipe
            </h2>
            <p className="text-xl text-gray-600">
              Les experts passionnés derrière Ordo
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <div className="text-blue-600 font-semibold mb-4">{member.role}</div>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Prêt à rejoindre l'aventure <span className="text-blue-600">Ordo</span> ?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Découvrez comment nous pouvons transformer votre productivité
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('login')}
                className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Essayer Ordo
              </button>
              <button className="px-10 py-4 bg-white text-gray-900 rounded-2xl font-bold text-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                Nous contacter
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
