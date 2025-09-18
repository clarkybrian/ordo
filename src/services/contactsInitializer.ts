import { contactService } from './contacts';
import { supabase } from '../lib/supabase';

/**
 * Utilitaire pour initialiser les contacts d'un utilisateur
 * À appeler lors de la première connexion ou manuellement
 */
export class ContactsInitializer {
  /**
   * Vérifie si l'utilisateur a déjà des contacts et les initialise si besoin
   */
  static async initializeUserContacts(userId: string): Promise<{
    success: boolean;
    contactsCount: number;
    message: string;
  }> {
    try {
      // Vérifier si l'utilisateur a déjà des contacts
      const { data: existingContacts, error: countError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId);

      if (countError) throw countError;

      const existingCount = existingContacts?.length || 0;

      // Si l'utilisateur a déjà des contacts, ne rien faire
      if (existingCount > 0) {
        return {
          success: true,
          contactsCount: existingCount,
          message: `L'utilisateur a déjà ${existingCount} contacts dans la base`
        };
      }

      console.log('🚀 Initialisation des contacts pour nouvel utilisateur');

      // Extraire et synchroniser les contacts depuis les emails
      await contactService.extractAndSyncContacts(userId);

      // Compter les contacts créés
      const { data: newContacts, error: newCountError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId);

      if (newCountError) throw newCountError;

      const newContactsCount = newContacts?.length || 0;

      return {
        success: true,
        contactsCount: newContactsCount,
        message: `✅ ${newContactsCount} contacts extraits et synchronisés avec succès !`
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des contacts:', error);
      return {
        success: false,
        contactsCount: 0,
        message: `Erreur lors de l'initialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Force la re-synchronisation des contacts (utile pour les utilisateurs existants)
   */
  static async forceResyncContacts(userId: string): Promise<{
    success: boolean;
    contactsCount: number;
    message: string;
  }> {
    try {
      console.log('🔄 Re-synchronisation forcée des contacts');

      // Supprimer les contacts existants
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Extraire et synchroniser à nouveau
      await contactService.extractAndSyncContacts(userId);

      // Compter les nouveaux contacts
      const { data: contacts, error: countError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId);

      if (countError) throw countError;

      const contactsCount = contacts?.length || 0;

      return {
        success: true,
        contactsCount,
        message: `🔄 Re-synchronisation terminée ! ${contactsCount} contacts mis à jour`
      };

    } catch (error) {
      console.error('❌ Erreur lors de la re-synchronisation:', error);
      return {
        success: false,
        contactsCount: 0,
        message: `Erreur lors de la re-synchronisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Statistiques sur les contacts de l'utilisateur
   */
  static async getContactsStats(userId: string): Promise<{
    totalContacts: number;
    favoriteContacts: number;
    recentContacts: number; // contacts avec interaction dans les 7 derniers jours
    activeContacts: number; // contacts avec interaction dans les 30 derniers jours
  }> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('is_favorite, last_interaction')
        .eq('user_id', userId);

      if (error) throw error;

      const totalContacts = contacts?.length || 0;
      const favoriteContacts = contacts?.filter(c => c.is_favorite).length || 0;
      
      const recentContacts = contacts?.filter(c => 
        c.last_interaction && new Date(c.last_interaction) > sevenDaysAgo
      ).length || 0;
      
      const activeContacts = contacts?.filter(c => 
        c.last_interaction && new Date(c.last_interaction) > thirtyDaysAgo
      ).length || 0;

      return {
        totalContacts,
        favoriteContacts,
        recentContacts,
        activeContacts
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      return {
        totalContacts: 0,
        favoriteContacts: 0,
        recentContacts: 0,
        activeContacts: 0
      };
    }
  }
}

export default ContactsInitializer;