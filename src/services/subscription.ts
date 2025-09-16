import { supabase } from '../lib/supabase';

export interface UserPlan {
  type: 'free' | 'pro' | 'premium';
  status: 'active' | 'expired' | 'past_due';
  questionsLimit: number;
  questionsUsed: number;
  questionsRemaining: number;
  aiModel: string;
  periodEnd?: Date;
}

export interface PlanConfig {
  questionsLimit: number;
  aiModel: string;
  features: string[];
}

const PLAN_CONFIGS: Record<string, PlanConfig> = {
  free: {
    questionsLimit: 3,
    aiModel: 'gpt-3.5-turbo',
    features: ['Classification basique', '3 questions par jour', 'Support email']
  },
  pro: {
    questionsLimit: 20,
    aiModel: 'gpt-4o-mini',
    features: ['Classification avancée', '20 questions par jour', 'Support prioritaire']
  },
  premium: {
    questionsLimit: 55, // 55 questions par jour
    aiModel: 'gpt-4',
    features: ['Tout inclus', '55 questions par jour', 'Support 24/7', 'Fonctionnalités premium']
  }
};

class SubscriptionService {
  /**
   * Récupère le plan actuel de l'utilisateur avec toutes les infos
   */
  async getUserPlan(userId: string): Promise<UserPlan> {
    try {
      // Récupérer le profil avec quota et dernière réinitialisation
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_type, emails_quota_used, last_quota_reset')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!profile) {
        throw new Error('Profil utilisateur non trouvé');
      }

      const planType = profile.subscription_type as 'free' | 'pro' | 'premium';
      const config = PLAN_CONFIGS[planType];
      
      // Vérifier si on doit réinitialiser le quota journalier
      const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
      const lastReset = profile.last_quota_reset;
      const isNewDay = !lastReset || lastReset !== today;
      
      let questionsUsed = profile.emails_quota_used || 0;
      
      // Réinitialiser le quota si c'est un nouveau jour
      if (isNewDay && questionsUsed > 0) {
        questionsUsed = 0;
        
        // Mettre à jour la base de données
        await supabase
          .from('profiles')
          .update({ 
            emails_quota_used: 0,
            last_quota_reset: today
          })
          .eq('id', userId);
      }
      
      const questionsRemaining = Math.max(0, config.questionsLimit - questionsUsed);

      return {
        type: planType,
        status: 'active',
        questionsLimit: config.questionsLimit,
        questionsUsed,
        questionsRemaining,
        aiModel: config.aiModel
      };

    } catch (error) {
      console.error('❌ Erreur récupération plan utilisateur:', error);
      // Fallback vers plan gratuit
      return {
        type: 'free',
        status: 'active',
        questionsLimit: 3,
        questionsUsed: 0,
        questionsRemaining: 3,
        aiModel: 'gpt-3.5-turbo'
      };
    }
  }

  /**
   * Vérifie si l'utilisateur peut poser une question
   */
  async canAskQuestion(userId: string): Promise<{ canAsk: boolean; plan: UserPlan }> {
    const plan = await this.getUserPlan(userId);
    return { canAsk: plan.questionsRemaining > 0, plan };
  }

  /**
   * Enregistre une question posée
   */
  async recordQuestionUsed(userId: string): Promise<void> {
    try {
      // Utiliser la fonction SQL optimisée
      const { error } = await supabase.rpc('increment_quota_used', {
        user_id: userId
      });

      if (error) {
        console.error('❌ Erreur fonction increment_quota_used:', error);
        
        // Fallback: mise à jour manuelle
        const { data: profile } = await supabase
          .from('profiles')
          .select('emails_quota_used')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ emails_quota_used: (profile.emails_quota_used || 0) + 1 })
            .eq('id', userId);
        }
      }
    } catch (error) {
      console.error('❌ Erreur enregistrement question:', error);
    }
  }

  /**
   * Obtient les limites et statistiques d'un plan
   */
  getPlanConfig(planType: 'free' | 'pro' | 'premium'): PlanConfig {
    return PLAN_CONFIGS[planType];
  }

  /**
   * Formate l'affichage des questions restantes
   */
  formatQuestionsRemaining(plan: UserPlan): string {
    return `${plan.questionsRemaining}/${plan.questionsLimit} questions restantes aujourd'hui`;
  }
}

// Instance singleton
export const subscriptionService = new SubscriptionService();
export default SubscriptionService;