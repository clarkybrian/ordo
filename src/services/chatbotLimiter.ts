import { supabase } from '../lib/supabase';

interface QuestionLimit {
  user_id: string;
  question_count: number;
  last_reset: string;
  question_type: 'detailed' | 'quick';
}

class ChatbotLimiterService {
  private readonly DETAILED_QUESTIONS_LIMIT = 2; // Divisé par 2 : 2 questions détaillées par période
  private readonly QUICK_QUESTIONS_LIMIT = 5; // Divisé par 2 : 5 questions rapides par période
  private readonly RESET_INTERVAL_HOURS = 3; // Remise à zéro toutes les 3h

  /**
   * Vérifie si l'utilisateur peut poser une question détaillée
   */
  async canAskDetailedQuestion(userId: string): Promise<{ allowed: boolean; remaining: number; resetTime?: Date }> {
    const limit = await this.getOrCreateQuestionLimit(userId, 'detailed');
    
    // Vérifier si on doit reset le compteur
    const now = new Date();
    const lastReset = new Date(limit.last_reset);
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceReset >= this.RESET_INTERVAL_HOURS) {
      // Reset du compteur
      await this.resetQuestionLimit(userId, 'detailed');
      return { allowed: true, remaining: this.DETAILED_QUESTIONS_LIMIT - 1 };
    }
    
    const remaining = this.DETAILED_QUESTIONS_LIMIT - limit.question_count;
    const nextReset = new Date(lastReset.getTime() + (this.RESET_INTERVAL_HOURS * 60 * 60 * 1000));
    
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining - 1),
      resetTime: nextReset
    };
  }

  /**
   * Vérifie si l'utilisateur peut poser une question rapide
   */
  async canAskQuickQuestion(userId: string): Promise<{ allowed: boolean; remaining: number; resetTime?: Date }> {
    const limit = await this.getOrCreateQuestionLimit(userId, 'quick');
    
    // Vérifier si on doit reset le compteur
    const now = new Date();
    const lastReset = new Date(limit.last_reset);
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceReset >= this.RESET_INTERVAL_HOURS) {
      // Reset du compteur
      await this.resetQuestionLimit(userId, 'quick');
      return { allowed: true, remaining: this.QUICK_QUESTIONS_LIMIT - 1 };
    }
    
    const remaining = this.QUICK_QUESTIONS_LIMIT - limit.question_count;
    const nextReset = new Date(lastReset.getTime() + (this.RESET_INTERVAL_HOURS * 60 * 60 * 1000));
    
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining - 1),
      resetTime: nextReset
    };
  }

  /**
   * Enregistre qu'une question a été posée
   */
  async recordQuestion(userId: string, questionType: 'detailed' | 'quick'): Promise<void> {
    const { error } = await supabase
      .from('chatbot_question_limits')
      .upsert({
        user_id: userId,
        question_type: questionType,
        question_count: 1,
        last_reset: new Date().toISOString()
      }, {
        onConflict: 'user_id,question_type',
        ignoreDuplicates: false
      });

    if (error) throw error;
  }

  /**
   * Détermine si une question est "détaillée" ou "rapide"
   */
  isDetailedQuestion(question: string): boolean {
    const detailedKeywords = [
      'résume', 'résumé', 'récapitulatif', 'détaille', 'analyse', 'explique',
      'contenu', 'texte', 'corps', 'conversation', 'thread', 'historique',
      'développe', 'approfondit', 'raconte', 'décrit'
    ];
    
    const questionLower = question.toLowerCase();
    return detailedKeywords.some(keyword => questionLower.includes(keyword));
  }

  /**
   * Récupère ou crée la limite de questions pour un utilisateur
   */
  private async getOrCreateQuestionLimit(userId: string, questionType: 'detailed' | 'quick'): Promise<QuestionLimit> {
    const { data, error } = await supabase
      .from('chatbot_question_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('question_type', questionType)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      // Créer une nouvelle entrée
      const newLimit = {
        user_id: userId,
        question_type: questionType,
        question_count: 0,
        last_reset: new Date().toISOString()
      };

      const { data: created, error: createError } = await supabase
        .from('chatbot_question_limits')
        .insert(newLimit)
        .select()
        .single();

      if (createError) throw createError;
      return created;
    }

    return data;
  }

  /**
   * Remet à zéro le compteur de questions
   */
  private async resetQuestionLimit(userId: string, questionType: 'detailed' | 'quick'): Promise<void> {
    const { error } = await supabase
      .from('chatbot_question_limits')
      .update({
        question_count: 0,
        last_reset: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('question_type', questionType);

    if (error) throw error;
  }

  /**
   * Incrémente le compteur de questions
   */
  private async incrementQuestionCount(userId: string, questionType: 'detailed' | 'quick'): Promise<void> {
    const { error } = await supabase.rpc('increment_question_count', {
      p_user_id: userId,
      p_question_type: questionType
    });

    if (error) throw error;
  }
}

export const chatbotLimiterService = new ChatbotLimiterService();
export default ChatbotLimiterService;
