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
    features: ['Classification basique', '3 questions/mois', 'Support email']
  },
  pro: {
    questionsLimit: 20,
    aiModel: 'gpt-4o-mini',
    features: ['Classification avancée', '20 questions/mois', 'Support prioritaire']
  },
  premium: {
    questionsLimit: -1, // Illimité
    aiModel: 'gpt-4',
    features: ['Tout inclus', 'Questions illimitées', 'Support 24/7', 'Fonctionnalités premium']
  }
};

class SubscriptionService {
  /**
   * Récupère le plan actuel de l'utilisateur avec toutes les infos
   */
  async getUserPlan(userId: string): Promise<UserPlan> {
    try {
      // Récupérer l'abonnement actuel
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('subscription_type, status, current_period_end')
        .eq('user_id', userId)
        .single();

      // Récupérer l'usage des questions ce mois-ci
      const currentMonth = new Date().toISOString().slice(0, 7); // "2025-09"
      const { data: usage } = await supabase
        .from('monthly_question_usage')
        .select('questions_used')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .single();

      let planType: 'free' | 'pro' | 'premium' = 'free';
      let planStatus: 'active' | 'expired' | 'past_due' = 'active';

      // Déterminer le plan et statut
      if (subscription && subscription.status === 'active') {
        const periodEnd = new Date(subscription.current_period_end);
        const now = new Date();

        if (now <= periodEnd) {
          planType = subscription.subscription_type as 'free' | 'pro' | 'premium';
          planStatus = 'active';
        } else {
          planStatus = 'expired';
        }
      } else if (subscription && subscription.status === 'past_due') {
        planType = subscription.subscription_type as 'free' | 'pro' | 'premium';
        planStatus = 'past_due';
      }

      const config = PLAN_CONFIGS[planType];
      const questionsUsed = usage?.questions_used || 0;
      const questionsRemaining = config.questionsLimit === -1 ? -1 : Math.max(0, config.questionsLimit - questionsUsed);

      return {
        type: planType,
        status: planStatus,
        questionsLimit: config.questionsLimit,
        questionsUsed,
        questionsRemaining,
        aiModel: config.aiModel,
        periodEnd: subscription?.current_period_end ? new Date(subscription.current_period_end) : undefined
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
    
    // Premium = illimité
    if (plan.type === 'premium') {
      return { canAsk: true, plan };
    }

    // Plan expiré = plan gratuit
    if (plan.status !== 'active') {
      const freePlan = await this.getUserPlan(userId); // Recalcule en mode free
      return { canAsk: freePlan.questionsRemaining > 0, plan: freePlan };
    }

    return { canAsk: plan.questionsRemaining > 0, plan };
  }

  /**
   * Enregistre une question posée
   */
  async recordQuestionUsed(userId: string): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    try {
      // Tenter d'incrementer
      const { error } = await supabase.rpc('increment_monthly_questions', {
        p_user_id: userId,
        p_month: currentMonth
      });

      if (error) {
        // Si la fonction n'existe pas, faire un upsert manuel
        await supabase
          .from('monthly_question_usage')
          .upsert({
            user_id: userId,
            month: currentMonth,
            questions_used: 1
          }, {
            onConflict: 'user_id,month',
            ignoreDuplicates: false
          });
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
    if (plan.type === 'premium') {
      return '∞ Questions illimitées';
    }
    
    return `${plan.questionsRemaining}/${plan.questionsLimit} questions restantes`;
  }
}

// Instance singleton
export const subscriptionService = new SubscriptionService();
export default SubscriptionService;