import { supabase } from '../lib/supabase';

class SessionManager {
  private checkInterval?: NodeJS.Timeout;
  private isChecking = false;

  /**
   * Démarre la vérification automatique de la session toutes les 5 minutes
   */
  startAutoSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Vérifier immédiatement puis toutes les 5 minutes
    this.checkSessionValidity();
    this.checkInterval = setInterval(() => {
      this.checkSessionValidity();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('🔄 Vérification automatique de session activée (toutes les 5 min)');
  }

  /**
   * Arrête la vérification automatique
   */
  stopAutoSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      console.log('⏹️ Vérification automatique de session arrêtée');
    }
  }

  /**
   * Vérifie si la session est valide et la renouvelle si nécessaire
   */
  private async checkSessionValidity() {
    if (this.isChecking) {
      return; // Éviter les vérifications multiples simultanées
    }

    this.isChecking = true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erreur lors de la vérification de session:', error);
        return;
      }

      if (!session?.provider_token) {
        console.log('ℹ️ Aucune session Gmail active');
        return;
      }

      // Tester la validité du token avec une requête simple
      const testResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${session.provider_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        console.log('🔄 Session Gmail invalide, tentative de renouvellement...');
        
        // Forcer le refresh de la session
        await supabase.auth.refreshSession();
        
        console.log('✅ Session Gmail renouvelée automatiquement');
      } else {
        console.log('✅ Session Gmail valide');
      }

    } catch (error) {
      console.error('❌ Erreur lors de la vérification de session:', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Force le renouvellement de la session
   */
  async refreshSession() {
    try {
      console.log('🔄 Renouvellement manuel de la session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erreur lors du renouvellement:', error);
        throw new Error('Impossible de renouveler la session. Veuillez vous reconnecter.');
      }

      console.log('✅ Session renouvelée manuellement');
      return data.session;
      
    } catch (error) {
      console.error('❌ Erreur refreshSession:', error);
      throw error;
    }
  }

  /**
   * Vérifie la validité de la session de manière synchrone
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        return false;
      }

      // Test rapide de la validité
      const testResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${session.provider_token}`,
          'Content-Type': 'application/json'
        }
      });

      return testResponse.ok;
      
    } catch (error) {
      console.error('❌ Erreur isSessionValid:', error);
      return false;
    }
  }
}

// Instance singleton
export const sessionManager = new SessionManager();

// Démarrer automatiquement la vérification quand l'utilisateur est connecté
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    sessionManager.startAutoSessionCheck();
  } else if (event === 'SIGNED_OUT') {
    sessionManager.stopAutoSessionCheck();
  }
});