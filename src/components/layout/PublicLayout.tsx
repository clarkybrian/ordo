import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PublicHeader } from './PublicHeader'

export function PublicLayout() {
  const handleGoogleAuth = async () => {
    try {
      const { supabase } = await import('../../lib/supabase')
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

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Background avec vagues animées */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Vagues de fond */}
        <div className="absolute inset-0">
          <svg
            className="absolute bottom-0 w-full h-64 text-blue-50"
            viewBox="0 0 1200 320"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              fill="currentColor"
              animate={{
                d: [
                  "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                  "M0,160L48,144C96,128,192,96,288,112C384,128,480,192,576,192C672,192,768,128,864,112C960,96,1056,128,1152,144C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                  "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </svg>
          
          <svg
            className="absolute bottom-0 w-full h-48 text-purple-50 opacity-70"
            viewBox="0 0 1200 320"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0,192L48,208C96,224,192,256,288,240C384,224,480,160,576,160C672,160,768,224,864,240C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              fill="currentColor"
              animate={{
                d: [
                  "M0,192L48,208C96,224,192,256,288,240C384,224,480,160,576,160C672,160,768,224,864,240C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                  "M0,256L48,240C96,224,192,192,288,208C384,224,480,288,576,288C672,288,768,224,864,208C960,192,1056,224,1152,240C1248,256,1344,256,1392,256L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                  "M0,192L48,208C96,224,192,256,288,240C384,224,480,160,576,160C672,160,768,224,864,240C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
          </svg>
        </div>

        {/* Orbes flottantes */}
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

        {/* Particules flottantes */}
        {[...Array(8)].map((_, i) => (
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
      </div>

      <PublicHeader onLogin={handleGoogleAuth} />
      <main className="relative">
        <Outlet />
      </main>
    </div>
  )
}
