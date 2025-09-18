import { supabase } from '../lib/supabase';

/**
 * Service pour déboguer et réparer les contacts
 */
export class ContactsDebugService {
  /**
   * Vérifie l'état des contacts pour un utilisateur
   */
  static async checkContactsHealth(userId: string): Promise<{
    contactsCount: number;
    hasError: boolean;
    message: string;
  }> {
    try {
      // Vérifier le nombre de contacts
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId);

      if (error) {
        console.error('Erreur lors de la vérification des contacts:', error);
        return {
          contactsCount: 0,
          hasError: true,
          message: `Erreur d'accès à la table contacts: ${error.message}`
        };
      }

      return {
        contactsCount: data?.length || 0,
        hasError: false,
        message: `${data?.length || 0} contacts trouvés pour l'utilisateur ${userId}`
      };
    } catch (error) {
      console.error('Erreur lors du diagnostic des contacts:', error);
      return {
        contactsCount: 0,
        hasError: true,
        message: `Exception lors du diagnostic: ${error}`
      };
    }
  }

  /**
   * Crée des contacts de test pour l'utilisateur si aucun n'existe
   */
  static async createEmergencyContacts(userId: string): Promise<{
    success: boolean;
    contactsCreated: number;
    message: string;
  }> {
    try {
      // Vérifier d'abord s'il existe déjà des contacts
      const healthCheck = await this.checkContactsHealth(userId);
      
      if (healthCheck.contactsCount > 0) {
        return {
          success: true,
          contactsCreated: 0,
          message: `${healthCheck.contactsCount} contacts existent déjà pour l'utilisateur ${userId}`
        };
      }

      // Créer quelques contacts de test
      const testContacts = [
        {
          user_id: userId,
          email: 'contact@example.com',
          name: 'Contact Test',
          interaction_count: 5,
          is_favorite: true,
          last_interaction: new Date().toISOString()
        },
        {
          user_id: userId,
          email: 'support@ordo.app',
          name: 'Support Ordo',
          interaction_count: 3,
          is_favorite: false,
          last_interaction: new Date().toISOString()
        },
        {
          user_id: userId,
          email: 'info@ordo.app',
          name: 'Info Ordo',
          interaction_count: 2,
          is_favorite: false,
          last_interaction: new Date().toISOString()
        }
      ];

      const { data, error } = await supabase
        .from('contacts')
        .insert(testContacts)
        .select();

      if (error) {
        return {
          success: false,
          contactsCreated: 0,
          message: `Erreur lors de la création des contacts de test: ${error.message}`
        };
      }

      return {
        success: true,
        contactsCreated: data?.length || 0,
        message: `${data?.length || 0} contacts de test créés avec succès pour l'utilisateur ${userId}`
      };
    } catch (error) {
      console.error('Erreur lors de la création des contacts de test:', error);
      return {
        success: false,
        contactsCreated: 0,
        message: `Exception lors de la création des contacts de test: ${error}`
      };
    }
  }
}