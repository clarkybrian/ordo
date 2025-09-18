import { supabase } from '../lib/supabase';

export interface Contact {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  last_interaction?: string;
  interaction_count: number;
  context_summary?: string;
  avatar_url?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailCompositionState {
  state: 'idle' | 'selecting_recipient' | 'composing' | 'reviewing' | 'ready_to_send';
  recipient: Contact | null;
  subject: string;
  body: string;
  originalRequest: string;
}

class ContactService {
  /**
   * Extraire et synchroniser les contacts depuis les emails de l'utilisateur
   */
  async extractAndSyncContacts(userId: string): Promise<void> {
    try {
      console.log('🔄 Début de l\'extraction des contacts pour l\'utilisateur:', userId);

      // Récupérer tous les emails de l'utilisateur
      const { data: emails, error: emailsError } = await supabase
        .from('emails')
        .select('sender_email, sender_name, recipient_email, received_at')
        .eq('user_id', userId)
        .order('received_at', { ascending: false });

      if (emailsError) throw emailsError;

      if (!emails || emails.length === 0) {
        console.log('📭 Aucun email trouvé pour l\'extraction de contacts');
        return;
      }

      // Récupérer les emails envoyés aussi
      const { data: sentEmails, error: sentError } = await supabase
        .from('sent_emails')
        .select('to_email, to_name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (sentError) console.error('Erreur récupération emails envoyés:', sentError);

      // Créer un map pour compter les interactions
      const contactsMap = new Map<string, {
        email: string;
        name?: string;
        lastInteraction: Date;
        count: number;
      }>();

      // Traiter les emails reçus
      emails.forEach(email => {
        if (email.sender_email && email.sender_email !== '') {
          const existing = contactsMap.get(email.sender_email) || {
            email: email.sender_email,
            name: email.sender_name || undefined,
            lastInteraction: new Date(email.received_at),
            count: 0
          };

          existing.count++;
          const emailDate = new Date(email.received_at);
          if (emailDate > existing.lastInteraction) {
            existing.lastInteraction = emailDate;
            if (email.sender_name) {
              existing.name = email.sender_name;
            }
          }

          contactsMap.set(email.sender_email, existing);
        }
      });

      // Traiter les emails envoyés
      if (sentEmails) {
        sentEmails.forEach(email => {
          if (email.to_email && email.to_email !== '') {
            const existing = contactsMap.get(email.to_email) || {
              email: email.to_email,
              name: email.to_name || undefined,
              lastInteraction: new Date(email.created_at),
              count: 0
            };

            existing.count++;
            const emailDate = new Date(email.created_at);
            if (emailDate > existing.lastInteraction) {
              existing.lastInteraction = emailDate;
              if (email.to_name) {
                existing.name = email.to_name;
              }
            }

            contactsMap.set(email.to_email, existing);
          }
        });
      }

      console.log(`📊 ${contactsMap.size} contacts uniques trouvés`);

      // Insérer ou mettre à jour les contacts
      const contactsToUpsert = Array.from(contactsMap.values()).map(contact => ({
        user_id: userId,
        email: contact.email,
        name: contact.name,
        last_interaction: contact.lastInteraction.toISOString(),
        interaction_count: contact.count,
        is_favorite: false
      }));

      // Insérer par batch pour éviter les timeouts
      const batchSize = 50;
      for (let i = 0; i < contactsToUpsert.length; i += batchSize) {
        const batch = contactsToUpsert.slice(i, i + batchSize);
        
        const { error: upsertError } = await supabase
          .from('contacts')
          .upsert(batch, {
            onConflict: 'user_id,email',
            ignoreDuplicates: false
          });

        if (upsertError) {
          console.error('Erreur lors de l\'upsert du batch:', upsertError);
        } else {
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} inséré (${batch.length} contacts)`);
        }
      }

      console.log('✅ Extraction des contacts terminée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction des contacts:', error);
      throw error;
    }
  }

  /**
   * Rechercher des contacts par nom ou email
   */
  async searchContacts(userId: string, query: string, limit: number = 5): Promise<Contact[]> {
    try {
      console.log('🔍 ContactService.searchContacts:', { userId, query, limit });
      
      if (!query || query.trim().length === 0) {
        console.log('📋 Pas de requête, récupération des contacts les plus actifs');
        // Si pas de requête, retourner les contacts les plus actifs
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', userId)
          .order('interaction_count', { ascending: false })
          .order('last_interaction', { ascending: false })
          .limit(limit);

        if (error) throw error;
        console.log('📊 Contacts trouvés (favoris):', data?.length || 0);
        return data || [];
      }

      const searchTerm = query.trim().toLowerCase();
      console.log('🔎 Recherche avec terme:', searchTerm);

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('interaction_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      console.log('📊 Contacts trouvés (recherche):', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur lors de la recherche de contacts:', error);
      return [];
    }
  }

  /**
   * Obtenir un contact par email
   */
  async getContactByEmail(userId: string, email: string): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du contact:', error);
      return null;
    }
  }

  /**
   * Marquer un contact comme favori
   */
  async toggleFavorite(userId: string, contactId: string): Promise<boolean> {
    try {
      // Récupérer l'état actuel
      const { data: contact, error: getError } = await supabase
        .from('contacts')
        .select('is_favorite')
        .eq('id', contactId)
        .eq('user_id', userId)
        .single();

      if (getError) throw getError;

      // Inverser l'état
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ is_favorite: !contact.is_favorite })
        .eq('id', contactId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return !contact.is_favorite;
    } catch (error) {
      console.error('Erreur lors du toggle favori:', error);
      return false;
    }
  }

  /**
   * Obtenir les contacts favoris
   */
  async getFavoriteContacts(userId: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('name')
        .order('email');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      return [];
    }
  }

  /**
   * Mettre à jour le résumé contextuel d'un contact
   */
  async updateContextSummary(userId: string, contactEmail: string, summary: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ context_summary: summary })
        .eq('user_id', userId)
        .eq('email', contactEmail);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du résumé:', error);
    }
  }
}

export const contactService = new ContactService();