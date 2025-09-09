import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erreur callback auth:', error)
          navigate('/login?error=' + encodeURIComponent(error.message))
          return
        }

        if (data.session) {
          console.log('Connexion réussie, redirection vers dashboard...')
          navigate('/dashboard')
        } else {
          console.log('Pas de session, redirection vers login...')
          navigate('/login')
        }
      } catch (error) {
        console.error('Erreur lors du traitement du callback:', error)
        navigate('/login?error=' + encodeURIComponent('Erreur de connexion'))
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Connexion en cours...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Veuillez patienter pendant que nous finalisons votre connexion.
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
