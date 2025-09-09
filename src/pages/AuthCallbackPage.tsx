import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Cette fonction récupère le hash/fragment de l'URL et le traite
    const handleAuthCallback = async () => {
      try {
        // Vérifier si l'authentification a réussi
        const { data, error } = await supabase.auth.getSession();
        
        console.log('Auth callback - Session data:', data);
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error.message);
          navigate('/login?error=auth_callback_failed');
          return;
        }
        
        if (data.session) {
          // L'utilisateur est authentifié, rediriger vers le dashboard
          navigate('/dashboard');
        } else {
          // Pas de session active, rediriger vers la page de connexion
          navigate('/login');
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
        navigate('/login?error=unexpected');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900">Authentification en cours...</h2>
        <p className="text-gray-500 mt-2">Vous allez être redirigé dans un instant</p>
      </div>
    </div>
  );
}

export default AuthCallbackPage;
