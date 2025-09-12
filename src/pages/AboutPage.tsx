import { motion } from 'framer-motion'
import { Users, Target, Award, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function AboutPage() {
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

  const team = [
    {
      name: 'Marie Dubois',
      role: 'CEO & Co-fondatrice',
      image: '👩‍💼',
      bio: 'Ex-Product Manager chez Google, passionnée par l\'IA et la productivité.'
    },
    {
      name: 'Thomas Martin',
      role: 'CTO & Co-fondateur',
      image: '👨‍💻',
      bio: 'Ingénieur machine learning avec 10 ans d\'expérience chez Microsoft.'
    },
    {
      name: 'Sophie Chen',
      role: 'Head of Design',
      image: '👩‍🎨',
      bio: 'Designer UX/UI primée, ancienne de Figma et Notion.'
    },
    {
      name: 'Alex Rodriguez',
      role: 'Lead Developer',
      image: '👨‍🔬',
      bio: 'Full-stack developer expert en React et intelligence artificielle.'
    }
  ]

  const values = [
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Centré utilisateur',
      description: 'Nous plaçons nos utilisateurs au cœur de chaque décision produit.'
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Simplicité',
      description: 'Nous croyons que la technologie doit être simple et accessible à tous.'
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Excellence',
      description: 'Nous visons l\'excellence dans tout ce que nous créons.'
    }
  ]

  const timeline = [
    {
      year: '2023',
      title: 'Naissance de l\'idée',
      description: 'Constat du chaos des boîtes emails et première ébauche de solution IA.'
    },
    {
      year: '2024',
      title: 'Développement',
      description: 'Création de l\'algorithme de classification et premiers tests utilisateurs.'
    },
    {
      year: '2025',
      title: 'Lancement',
      description: 'Lancement public d\'Ordo et accueil de nos premiers utilisateurs.'
    },
    {
      year: '2026',
      title: 'Expansion',
      description: 'Nouvelles fonctionnalités et expansion internationale prévue.'
    }
  ]

  const stats = [
    { number: '10K+', label: 'Utilisateurs actifs' },
    { number: '1M+', label: 'Emails classifiés' },
    { number: '95%', label: 'Précision IA' },
    { number: '4.8/5', label: 'Note utilisateurs' }
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
                Notre mission
              </span>
              <br />
              <span className="text-gray-900">Simplifier vos emails</span>
            </motion.h1>
            
            <motion.p
              className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Chez Ordo, nous croyons que chacun devrait pouvoir se concentrer sur ce qui compte vraiment, 
              sans être submergé par le chaos de sa boîte email.
            </motion.p>

            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Comment tout a commencé
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  En 2023, nos fondateurs Marie et Thomas ont réalisé qu'ils passaient 
                  des heures chaque jour à trier leurs emails. Malgré leurs expertises 
                  respectives chez Google et Microsoft, ils n'arrivaient pas à maîtriser 
                  le flux constant de messages.
                </p>
                <p>
                  C'est alors qu'ils ont eu l'idée d'utiliser l'intelligence artificielle 
                  pour automatiser ce processus fastidieux. Non pas pour remplacer 
                  l'humain, mais pour lui redonner le contrôle sur sa communication.
                </p>
                <p>
                  Aujourd'hui, Ordo aide des milliers d'utilisateurs à reprendre 
                  le contrôle de leur boîte email et à se concentrer sur ce qui 
                  compte vraiment dans leur travail et leur vie.
                </p>
              </div>
            </motion.div>
            
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white text-center">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-2xl font-bold mb-4">L'idée originale</h3>
                <p className="text-blue-100">
                  "Et si l'IA pouvait comprendre nos emails aussi bien que nous ?"
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos valeurs
            </h2>
            <p className="text-xl text-gray-600">
              Les principes qui guident notre travail au quotidien
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <div className="text-blue-600 mb-4 flex justify-center">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Notre équipe
            </h2>
            <p className="text-xl text-gray-600">
              Les talents qui rendent Ordo possible
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                className="text-center bg-white rounded-2xl p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-medium mb-4">
                  {member.role}
                </p>
                <p className="text-gray-600 text-sm">
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Notre parcours
            </h2>
            <p className="text-xl text-gray-600">
              Les étapes clés de notre aventure
            </p>
          </div>

          <div className="space-y-8">
            {timeline.map((event, index) => (
              <motion.div
                key={index}
                className="flex items-start space-x-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {event.title}
                    </h3>
                    <span className="text-blue-600 font-medium">
                      {event.year}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {event.description}
                  </p>
                </div>
              </motion.div>
            ))}
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
              Rejoignez-nous dans cette aventure
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Découvrez comment Ordo peut transformer votre gestion d'emails
            </p>
            <button
              onClick={handleGoogleAuth}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-medium text-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Essayer Ordo gratuitement
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
