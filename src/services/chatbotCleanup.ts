import { supabase } from '../lib/supabase';

export class ChatbotCleanupService {
  private static instance: ChatbotCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): ChatbotCleanupService {
    if (!ChatbotCleanupService.instance) {
      ChatbotCleanupService.instance = new ChatbotCleanupService();
    }
    return ChatbotCleanupService.instance;
  }

  /**
   * Démarre le nettoyage automatique toutes les 30 minutes
   */
  startAutoCleanup(): void {
    if (this.isRunning) return;

    console.log('🧹 Démarrage du nettoyage automatique du chatbot (toutes les 30 min)');
    
    // Nettoyage immédiat
    this.cleanupOldMessages();
    
    // Nettoyage toutes les 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMessages();
    }, 30 * 60 * 1000); // 30 minutes

    this.isRunning = true;
  }

  /**
   * Arrête le nettoyage automatique
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Nettoyage automatique du chatbot arrêté');
  }

  /**
   * Supprime les messages plus anciens que 1 heure
   */
  async cleanupOldMessages(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Supprimer les anciens messages
      const { error: deleteError } = await supabase
        .from('chatbot_messages')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', oneHourAgo);

      if (deleteError) {
        console.error('Erreur lors du nettoyage des messages:', deleteError);
        return;
      }

      // Supprimer les sessions orphelines (optionnel)
      await this.cleanupOrphanedSessions();

      console.log('🧹 Nettoyage terminé: messages supprimés avant', oneHourAgo);

    } catch (error) {
      console.error('Erreur lors du nettoyage automatique:', error);
    }
  }

  /**
   * Supprime les sessions sans messages
   */
  private async cleanupOrphanedSessions(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Récupérer les sessions sans messages récents
      const { data: orphanedSessions } = await supabase
        .from('chatbot_sessions')
        .select('id')
        .eq('user_id', user.id)
        .lt('created_at', oneHourAgo);

      if (orphanedSessions && orphanedSessions.length > 0) {
        const sessionIds = orphanedSessions.map(s => s.id);

        // Vérifier quelles sessions n'ont plus de messages
        const { data: sessionsWithMessages } = await supabase
          .from('chatbot_messages')
          .select('session_id')
          .in('session_id', sessionIds);

        const activeSessionIds = new Set(sessionsWithMessages?.map(m => m.session_id) || []);
        const trulyOrphanedIds = sessionIds.filter(id => !activeSessionIds.has(id));

        if (trulyOrphanedIds.length > 0) {
          await supabase
            .from('chatbot_sessions')
            .delete()
            .in('id', trulyOrphanedIds);

          console.log(`🗑️ ${trulyOrphanedIds.length} sessions orphelines supprimées`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des sessions:', error);
    }
  }

  /**
   * Nettoyage manuel pour l'utilisateur actuel
   */
  async cleanupUserMessages(userId: string): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Compter d'abord les messages à supprimer
      const { count } = await supabase
        .from('chatbot_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lt('created_at', oneHourAgo);

      const { error } = await supabase
        .from('chatbot_messages')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', oneHourAgo);

      if (error) throw error;

      const deletedCount = count || 0;
      console.log(`🧹 ${deletedCount} anciens messages supprimés pour l'utilisateur`);
      
      return deletedCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage manuel:', error);
      return 0;
    }
  }

  /**
   * Limite le nombre total de messages par utilisateur
   */
  async limitUserMessages(userId: string, maxMessages: number = 100): Promise<void> {
    try {
      // Compter les messages actuels
      const { count } = await supabase
        .from('chatbot_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!count || count <= maxMessages) return;

      // Récupérer les messages les plus anciens à supprimer
      const messagesToDelete = count - maxMessages;
      const { data: oldMessages } = await supabase
        .from('chatbot_messages')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(messagesToDelete);

      if (oldMessages && oldMessages.length > 0) {
        const idsToDelete = oldMessages.map(m => m.id);
        
        await supabase
          .from('chatbot_messages')
          .delete()
          .in('id', idsToDelete);

        console.log(`📊 Limite atteinte: ${messagesToDelete} anciens messages supprimés`);
      }
    } catch (error) {
      console.error('Erreur lors de la limitation des messages:', error);
    }
  }
}

// Instance singleton
export const chatbotCleanupService = ChatbotCleanupService.getInstance();
