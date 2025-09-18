import { supabase } from '../lib/supabase';
import { gmailService, type ProcessedEmail } from './gmail';
import { classificationService, type Category } from './classification';
import { openaiService } from './openai'; // Import du service OpenAI enrichi
import { ContactsInitializer } from './contactsInitializer';

export interface SyncResult {
  success: boolean;
  processed_emails: number;
  new_emails: number;
  created_categories: number;
  errors: string[];
  sync_time: number;
}

export interface SyncProgress {
  stage: 'connecting' | 'fetching' | 'classifying' | 'saving' | 'completed' | 'error';
  progress: number;
  message: string;
  current_email?: string;
  emails_processed?: number;
  total_emails?: number;
}

class EmailSyncService {
  private progressCallback?: (progress: SyncProgress) => void;
  private isSyncing: boolean = false;

  setProgressCallback(callback: (progress: SyncProgress) => void) {
    this.progressCallback = callback;
  }

  private updateProgress(progress: SyncProgress) {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
    console.log(`[${progress.stage}] ${progress.message} (${Math.round(progress.progress)}%)`);
  }

  async synchronizeEmails(maxEmails: number = 50): Promise<SyncResult> {
    // Protection contre les synchronisations simultanées
    if (this.isSyncing) {
      console.log('🚫 Synchronisation déjà en cours, abandon...');
      throw new Error('Une synchronisation est déjà en cours');
    }

    this.isSyncing = true;
    const startTime = Date.now();
    let user: { id: string } | null = null; // Déclarer user en dehors du try pour l'utiliser dans catch
    
    const result: SyncResult = {
      success: false,
      processed_emails: 0,
      new_emails: 0,
      created_categories: 0,
      errors: [],
      sync_time: 0
    };

    try {
      // Vérifier l'authentification
      this.updateProgress({
        stage: 'connecting',
        progress: 5,
        message: 'Vérification de la connexion Gmail...'
      });

      const { data: authData } = await supabase.auth.getUser();
      user = authData.user;
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Détecter si c'est la première synchronisation
      const { count: existingEmailsCount } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const isFirstSync = existingEmailsCount === 0;
      console.log(isFirstSync ? '🆕 Première synchronisation détectée' : `🔄 Synchronisation incrémentale (${existingEmailsCount} emails existants)`);

      // Test de connexion Gmail avec retry automatique
      this.updateProgress({
        stage: 'connecting',
        progress: 10,
        message: 'Test de connexion Gmail...'
      });

      const isConnected = await gmailService.testConnection();
      if (!isConnected) {
        // Au lieu de planter, essayer de comprendre pourquoi
        console.log('⚠️ Connexion Gmail échouée, tentative de diagnostic...');
        
        try {
          // Une dernière tentative pour diagnostiquer le problème
          await gmailService.fetchRecentEmails(1);
        } catch (detailError) {
          if (detailError instanceof Error && detailError.message.includes('Session expirée')) {
            throw new Error('Votre session Gmail a expiré. Veuillez vous déconnecter puis vous reconnecter.');
          } else {
            throw new Error(`Impossible de se connecter à Gmail. ${detailError instanceof Error ? detailError.message : 'Erreur inconnue'}`);
          }
        }
      }

      let emails: ProcessedEmail[] = [];

      if (isFirstSync) {
        // PREMIÈRE SYNCHRONISATION : Récupérer les X derniers emails
        this.updateProgress({
          stage: 'fetching',
          progress: 15,
          message: `Première synchronisation : récupération des ${maxEmails} emails les plus récents...`
        });

        emails = await gmailService.fetchRecentEmails(maxEmails);
        console.log(`📨 Première sync: ${emails.length} emails récupérés`);
        
      } else {
        // SYNCHRONISATION INCRÉMENTALE : Récupérer seulement les nouveaux
        this.updateProgress({
          stage: 'fetching',
          progress: 15,
          message: 'Recherche des nouveaux emails...'
        });

        // Récupérer la date du dernier email synchronisé
        const { data: lastEmail } = await supabase
          .from('emails')
          .select('received_at')
          .eq('user_id', user.id)
          .order('received_at', { ascending: false })
          .limit(1)
          .single();

        if (lastEmail) {
          console.log(`📅 Dernier email synchronisé le: ${lastEmail.received_at}`);
          emails = await gmailService.fetchNewEmailsSince(lastEmail.received_at, 50);
          console.log(`📨 Sync incrémentale: ${emails.length} nouveaux emails trouvés`);
        } else {
          // Cas de sécurité : pas de dernier email trouvé
          console.log('⚠️ Aucun dernier email trouvé, récupération récente');
          emails = await gmailService.fetchRecentEmails(maxEmails);
        }
      }

      result.processed_emails = emails.length;

      // Afficher les emails récupérés
      this.updateProgress({
        stage: 'fetching',
        progress: 20,
        message: `${emails.length} emails récupérés avec succès${isFirstSync ? ' (première synchronisation)' : ''}`,
        emails_processed: 0,
        total_emails: emails.length
      });

      if (emails.length === 0) {
        this.updateProgress({
          stage: 'completed',
          progress: 100,
          message: 'Aucun nouvel email à traiter'
        });
        result.success = true;
        result.sync_time = Date.now() - startTime;
        return result;
      }

      // 3. Filtrer les doublons (seulement si nécessaire)
      this.updateProgress({
        stage: 'fetching',
        progress: 25,
        message: 'Vérification des doublons...'
      });

      const newEmails = isFirstSync 
        ? emails // Première sync : tous les emails sont nouveaux
        : await this.filterNewEmails(emails, user.id); // Sync incrémentale : filtrer les doublons par sécurité
      
      result.new_emails = newEmails.length;

      // Message informatif
      const existingCount = emails.length - newEmails.length;
      let statusMessage = '';
      if (isFirstSync) {
        statusMessage = `${newEmails.length} emails à traiter (première synchronisation)`;
      } else {
        statusMessage = `${newEmails.length} nouveaux emails à traiter${existingCount > 0 ? ` (${existingCount} doublons filtrés)` : ''}`;
      }
      
      this.updateProgress({
        stage: 'fetching',
        progress: 30,
        message: statusMessage,
        emails_processed: 0,
        total_emails: newEmails.length
      });

      if (newEmails.length === 0) {
        this.updateProgress({
          stage: 'completed',
          progress: 100,
          message: 'Tous les emails sont déjà synchronisés'
        });
        result.success = true;
        result.sync_time = Date.now() - startTime;
        return result;
      }

      // 4. Récupérer ou créer les catégories
      this.updateProgress({
        stage: 'classifying',
        progress: 35,
        message: 'Préparation des catégories...'
      });

      const categories = await this.ensureDefaultCategories(user.id);
      
      // 5. Classifier et sauvegarder les emails
      this.updateProgress({
        stage: 'classifying',
        progress: 45,
        message: `Classification de ${newEmails.length} nouveaux emails...`
      });

      for (let i = 0; i < newEmails.length; i++) {
        const email = newEmails[i];
        const progressPercent = 45 + (i / newEmails.length) * 40;

        this.updateProgress({
          stage: 'classifying',
          progress: progressPercent,
          message: `Classification de l'email ${i + 1}/${newEmails.length}`,
          current_email: email.subject,
          emails_processed: i + 1,
          total_emails: newEmails.length
        });

        try {
          // 🚀 UTILISATION D'OPENAI AVEC PROMPT ENRICHI (au lieu de l'ancien système)
          console.log(`🤖 Classification OpenAI de l'email: "${email.subject}"`);
          const classification = await openaiService.classifyEmail(email, categories);
          
          let categoryId = classification.category_id || '';
          
          // Création automatique désactivée - utilise uniquement les catégories existantes
          if (!categoryId || categoryId === 'uncategorized') {
            console.log(`⚠️ Email "${email.subject}" non classé - assigné aux "Non classés"`);
            categoryId = ''; // Null pour "Non classés"
          } else {
            console.log(`✅ Email "${email.subject}" classé dans "${classification.category_name}" (confiance: ${classification.confidence})`);
          }

          // Sauvegarder l'email
          await this.saveEmail(email, categoryId === 'uncategorized' ? null : categoryId, user.id);

        } catch (error) {
          console.error(`Erreur lors du traitement de l'email "${email.subject}":`, error);
          result.errors.push(`Erreur pour "${email.subject}": ${error}`);
        }
      }

      // 6. Enregistrer l'historique de synchronisation
      this.updateProgress({
        stage: 'saving',
        progress: 90,
        message: 'Finalisation de la synchronisation...'
      });

      await this.saveSyncHistory(user.id, result);

      // 7. Terminé
      this.updateProgress({
        stage: 'completed',
        progress: 100,
        message: `Synchronisation terminée : ${result.new_emails} nouveaux emails traités`
      });

      result.success = true;

      // 8. Initialiser/synchroniser les contacts après la synchronisation des emails
      if (result.new_emails > 0) {
        try {
          console.log('👥 Synchronisation des contacts après la synchronisation des emails...');
          const contactsResult = await ContactsInitializer.initializeUserContacts(user.id);
          console.log(`📊 Contacts synchronisés: ${contactsResult.message}`);
        } catch (contactError) {
          console.warn('⚠️ Erreur lors de la synchronisation des contacts (non critique):', contactError);
          // Ne pas faire échouer la synchronisation principale pour les contacts
        }
      }

      result.sync_time = Date.now() - startTime;

    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      
      // Vérifier si c'est une erreur de bloqueur de publicités
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isBlockedByClient = errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
                               errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                               errorMessage.includes('BLOCKED_BY_CLIENT');
      
      if (isBlockedByClient) {
        console.warn('🚫 Ressources bloquées détectées, mais synchronisation probablement réussie');
        // Ne pas ajouter cette erreur aux résultats si c'est juste un bloqueur
        this.updateProgress({
          stage: 'completed',
          progress: 100,
          message: 'Synchronisation terminée (ressources externes bloquées)'
        });
        
        result.success = true; // Considérer comme un succès

        // Initialiser les contacts même avec des ressources bloquées
        if (result.new_emails > 0) {
          try {
            console.log('👥 Synchronisation des contacts...');
            const contactsResult = await ContactsInitializer.initializeUserContacts(user.id);
            console.log(`📊 Contacts synchronisés: ${contactsResult.message}`);
          } catch (contactError) {
            console.warn('⚠️ Erreur lors de la synchronisation des contacts (non critique):', contactError);
          }
        }
      } else {
        // Erreur réelle de synchronisation
        result.errors.push(error instanceof Error ? error.message : String(error));
        
        this.updateProgress({
          stage: 'error',
          progress: 0,
          message: `Erreur: ${result.errors[result.errors.length - 1]}`
        });
      }
    } finally {
      // Libérer le verrou de synchronisation
      this.isSyncing = false;
    }

    result.sync_time = Date.now() - startTime;
    return result;
  }

  private async filterNewEmails(emails: ProcessedEmail[], userId: string): Promise<ProcessedEmail[]> {
    const gmailIds = emails.map(email => email.gmail_id);
    
    const { data: existingEmails } = await supabase
      .from('emails')
      .select('gmail_id')
      .eq('user_id', userId)
      .in('gmail_id', gmailIds);

    const existingIds = new Set(existingEmails?.map(email => email.gmail_id) || []);
    
    return emails.filter(email => !existingIds.has(email.gmail_id));
  }

  /**
   * PLUS DE CRÉATION AUTOMATIQUE - Récupère seulement les catégories existantes
   */
  private async ensureDefaultCategories(userId: string): Promise<Category[]> {
    console.log('📋 Récupération des catégories existantes (AUCUNE création automatique)');
    
    // Récupérer SEULEMENT les catégories existantes
    const { data: existingCategories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('❌ Erreur récupération catégories:', error);
      return [];
    }

    const categories = existingCategories || [];
    console.log(`✅ ${categories.length} catégories existantes récupérées:`, categories.map(cat => cat.name));
    
    // Vérifier qu'il y a au moins une catégorie (sécurité)
    if (categories.length === 0) {
      console.warn('⚠️ AUCUNE catégorie trouvée! L\'utilisateur doit en créer au moins une.');
    }

    return categories;
  }

  private async saveEmail(email: ProcessedEmail, categoryId: string | null, userId: string): Promise<void> {
    try {
      console.log(`💾 Sauvegarde de l'email: "${email.subject}" (ID: ${email.gmail_id})`)
      console.log(`📖 État lecture: is_read=${email.is_read}, is_important=${email.is_important}`)
      
      const { error } = await supabase
        .from('emails')
        .insert({
          user_id: userId,
          gmail_id: email.gmail_id,
          thread_id: email.thread_id,
          subject: email.subject,
          sender_name: email.sender,
          sender_email: email.sender_email,
          body_text: email.body_text,
          snippet: email.snippet,
          received_at: email.received_at,
          category_id: categoryId,
          is_important: email.is_important || false,
          is_read: email.is_read || false,
          labels: email.labels || []
        })
        .select()

      if (error) {
        // Si l'email existe déjà, on l'ignore
        if (error.code === '23505') { // Violation de contrainte unique
          console.log(`⚠️ Email déjà existant ignoré: ${email.gmail_id}`)
          return
        }
        throw new Error(`Erreur lors de la sauvegarde de "${email.subject}": ${error.message}`)
      }

      console.log(`✅ Email sauvegardé avec succès: ${email.subject}`)
    } catch (error) {
      console.error(`❌ Erreur sauvegarde email "${email.subject}":`, error)
      throw error
    }
  }

  private async saveSyncHistory(userId: string, result: SyncResult): Promise<void> {
    try {
      await supabase
        .from('sync_history')
        .insert({
          user_id: userId,
          sync_type: 'manual',
          emails_processed: result.processed_emails,
          emails_new: result.new_emails,
          emails_classified: result.new_emails,
          started_at: new Date(Date.now() - result.sync_time).toISOString(),
          completed_at: new Date().toISOString(),
          status: result.success ? 'completed' : 'failed',
          error_message: result.errors.length > 0 ? result.errors.join(', ') : null
        });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'historique:', error);
    }
  }

  async getLastSyncInfo(userId: string): Promise<{ last_sync: string | null; total_emails: number }> {
    try {
      // Dernière synchronisation
      const { data: lastSync } = await supabase
        .from('sync_history')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Nombre total d'emails
      const { count: totalEmails } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return {
        last_sync: lastSync?.completed_at || null,
        total_emails: totalEmails || 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos de sync:', error);
      return {
        last_sync: null,
        total_emails: 0
      };
    }
  }

  async getUserCategories(userId: string): Promise<Category[]> {
    try {
      // Utiliser la fonction SQL qui calcule automatiquement le nombre d'emails
      const { data: categories, error } = await supabase
        .rpc('get_user_categories', { user_uuid: userId });

      if (error) {
        throw new Error(`Erreur lors de la récupération des catégories: ${error.message}`);
      }

      return categories || [];
    } catch (error) {
      console.error('Erreur getUserCategories:', error);
      // Fallback vers la requête simple si la fonction RPC échoue
      const { data: categories, error: fallbackError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (fallbackError) {
        throw new Error(`Erreur lors de la récupération des catégories: ${fallbackError.message}`);
      }

      // Ajouter emails_count: 0 pour chaque catégorie dans le fallback
      return (categories || []).map(cat => ({ ...cat, emails_count: 0 }));
    }
  }

  async getUserEmails(userId: string, categoryId?: string | null, limit: number = 100): Promise<ProcessedEmail[]> {
    console.log(`📨 getUserEmails appelé avec: userId=${userId}, categoryId=${categoryId}, limit=${limit}`)
    
    let query = supabase
      .from('emails')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', userId)
      .order('received_at', { ascending: false })
      .limit(limit);

    if (categoryId === 'unread') {
      console.log('🔍 Filtre: emails non lus (is_read = false)')
      query = query.eq('is_read', false);
    } else if (categoryId === 'important') {
      console.log('🔍 Filtre: emails importants (is_important = true)')
      query = query.eq('is_important', true);
    } else if (categoryId && categoryId !== 'uncategorized') {
      console.log(`🔍 Filtre: catégorie spécifique (category_id = ${categoryId})`)
      query = query.eq('category_id', categoryId);
    } else if (categoryId === 'uncategorized') {
      console.log('🔍 Filtre: emails non catégorisés (category_id = null)')
      query = query.is('category_id', null);
    } else {
      console.log('🔍 Filtre: tous les emails (aucun filtre)')
    }

    const { data: emails, error } = await query;

    if (error) {
      console.error('❌ Erreur getUserEmails:', error)
      throw new Error(`Erreur lors de la récupération des emails: ${error.message}`);
    }

    console.log(`✅ getUserEmails résultat: ${emails?.length || 0} emails trouvés`)
    return emails || [];
  }

  /**
   * Marque un email comme lu dans la base de données
   */
  async markEmailAsRead(emailId: string): Promise<void> {
    try {
      console.log(`🔄 Marquage de l'email ${emailId} comme lu...`);
      
      const { error } = await supabase
        .from('emails')
        .update({ is_read: true })
        .eq('id', emailId);

      if (error) {
        console.error('❌ Erreur lors du marquage comme lu:', error);
        throw new Error(`Impossible de marquer l'email comme lu: ${error.message}`);
      }

      console.log(`✅ Email ${emailId} marqué comme lu avec succès`);
    } catch (error) {
      console.error('❌ Erreur markEmailAsRead:', error);
      throw error;
    }
  }
}

export const emailSyncService = new EmailSyncService();
