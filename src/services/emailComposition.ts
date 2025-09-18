import { openaiService } from './openai';
import { contactService, type Contact } from './contacts';
import { gmailService } from './gmail';
import { supabase } from '../lib/supabase';

export interface EmailDraft {
  recipient: Contact | null;
  subject: string;
  body: string;
  originalRequest: string;
  tone?: 'professional' | 'friendly' | 'casual';
}

export type CompositionState = 'idle' | 'selecting_recipient' | 'composing' | 'reviewing' | 'ready_to_send';

class EmailCompositionService {
  private currentDraft: EmailDraft = {
    recipient: null,
    subject: '',
    body: '',
    originalRequest: ''
  };

  private state: CompositionState = 'idle';

  /**
   * Analyser l'input utilisateur et déterminer l'action appropriée
   */
  async processUserInput(userId: string, input: string): Promise<{
    type: 'contact_search' | 'email_composition' | 'email_modification' | 'send_email' | 'normal_chat';
    data?: Contact[] | EmailDraft | { success: boolean; messageId?: string; error?: string } | null;
    message: string;
  }> {
    const cleanInput = input.trim();

    // Détection du pattern @
    if (cleanInput.includes('@')) {
      return this.handleContactSelection(userId, cleanInput);
    }

    // Si on a déjà un destinataire et que l'utilisateur demande d'écrire un email
    if (this.currentDraft.recipient && this.isEmailCompositionRequest(cleanInput)) {
      return this.handleEmailComposition(userId, cleanInput);
    }

    // Demande de modification de l'email en cours
    if (this.currentDraft.body && this.isModificationRequest(cleanInput)) {
      return this.handleEmailModification(userId, cleanInput);
    }

    // Demande d'envoi
    if (this.currentDraft.body && this.isSendRequest(cleanInput)) {
      return this.handleSendRequest();
    }

    // Reset si nouvelle conversation
    if (this.shouldResetDraft(cleanInput)) {
      this.resetDraft();
    }

    return {
      type: 'normal_chat',
      message: 'Je peux vous aider à rédiger et envoyer des emails. Utilisez @ pour sélectionner un destinataire!'
    };
  }

  /**
   * Gérer la sélection de contact avec @
   */
  private async handleContactSelection(userId: string, input: string): Promise<{
    type: 'contact_search';
    data: Contact[];
    message: string;
  }> {
    console.log('🔍 EmailCompositionService.handleContactSelection:', { userId, input });
    
    const atIndex = input.lastIndexOf('@');
    const searchTerm = input.substring(atIndex + 1).trim();
    console.log('🔎 Terme de recherche extrait:', searchTerm);

    this.state = 'selecting_recipient';

    const contacts = await contactService.searchContacts(userId, searchTerm, 5);
    console.log('👥 Contacts retournés:', contacts.length);

    return {
      type: 'contact_search',
      data: contacts,
      message: searchTerm.length > 0 
        ? `Voici les contacts correspondant à "${searchTerm}" :`
        : 'Voici vos contacts les plus fréquents :'
    };
  }

  /**
   * Sélectionner un contact spécifique
   */
  async selectContact(contact: Contact): Promise<string> {
    this.currentDraft.recipient = contact;
    this.state = 'composing';

    return `✅ Destinataire sélectionné: **${contact.name || contact.email}** (${contact.email})

Vous pouvez maintenant me demander d'écrire un email. Par exemple :
- "Écris-lui un email pour demander l'avancement du projet"
- "Rédige un message de suivi professionnel"
- "Écris un email amical pour prendre des nouvelles"`;
  }

  /**
   * Gérer la composition d'email
   */
  private async handleEmailComposition(userId: string, input: string): Promise<{
    type: 'email_composition';
    data: EmailDraft;
    message: string;
  }> {
    if (!this.currentDraft.recipient) {
      return {
        type: 'email_composition',
        data: this.currentDraft,
        message: 'Veuillez d\'abord sélectionner un destinataire avec @'
      };
    }

    this.state = 'composing';
    this.currentDraft.originalRequest = input;

    // Récupérer le contexte des interactions précédentes avec ce contact
    const context = await this.getContactContext(userId, this.currentDraft.recipient.email);

    // Générer l'email avec l'IA
    const emailContent = await this.composeEmailWithAI(input, this.currentDraft.recipient, context);

    if (emailContent) {
      this.currentDraft.subject = emailContent.subject;
      this.currentDraft.body = emailContent.body;
      this.state = 'reviewing';

      return {
        type: 'email_composition',
        data: this.currentDraft,
        message: `📧 **Email rédigé pour ${this.currentDraft.recipient.name || this.currentDraft.recipient.email}**

**Objet :** ${emailContent.subject}

**Message :**
${emailContent.body}

---
💡 Vous pouvez me demander de :
- Modifier le ton (plus formel, plus décontracté)
- Ajouter ou retirer des éléments
- L'envoyer avec "vas-y envoie-le"`
      };
    }

    return {
      type: 'email_composition',
      data: this.currentDraft,
      message: 'Désolé, je n\'ai pas pu rédiger l\'email. Pouvez-vous reformuler votre demande ?'
    };
  }

  /**
   * Gérer les modifications d'email
   */
  private async handleEmailModification(userId: string, input: string): Promise<{
    type: 'email_modification';
    data: EmailDraft;
    message: string;
  }> {
    if (!this.currentDraft.body) {
      return {
        type: 'email_modification',
        data: this.currentDraft,
        message: 'Aucun email à modifier. Commencez par en rédiger un.'
      };
    }

    // Modifier l'email avec l'IA
    const modifiedEmail = await this.modifyEmailWithAI(input, this.currentDraft);

    if (modifiedEmail) {
      this.currentDraft.subject = modifiedEmail.subject;
      this.currentDraft.body = modifiedEmail.body;

      return {
        type: 'email_modification',
        data: this.currentDraft,
        message: `✏️ **Email modifié**

**Objet :** ${modifiedEmail.subject}

**Message :**
${modifiedEmail.body}

---
Satisfait du résultat ? Dites "vas-y envoie-le" pour l'envoyer !`
      };
    }

    return {
      type: 'email_modification',
      data: this.currentDraft,
      message: 'Je n\'ai pas pu modifier l\'email comme demandé. Pouvez-vous être plus spécifique ?'
    };
  }

  /**
   * Gérer l'envoi d'email
   */
  private async handleSendRequest(): Promise<{
    type: 'send_email';
    data: { success: boolean; messageId?: string; error?: string } | null;
    message: string;
  }> {
    if (!this.currentDraft.recipient || !this.currentDraft.body) {
      return {
        type: 'send_email',
        data: null,
        message: 'Email incomplet. Assurez-vous d\'avoir un destinataire et un contenu.'
      };
    }

    try {
      // Envoyer l'email via le service Gmail
      const result = await gmailService.sendEmail({
        to: this.currentDraft.recipient.email,
        subject: this.currentDraft.subject || 'Message depuis Orton',
        body: this.currentDraft.body
      });

      if (result.success) {
        const sentMessage = `🚀 **Email envoyé avec succès !**

**À :** ${this.currentDraft.recipient.name || this.currentDraft.recipient.email}
**Objet :** ${this.currentDraft.subject}

L'email a été livré dans la boîte de réception.`;

        // Nettoyer le brouillon après envoi
        this.resetDraft();

        return {
          type: 'send_email',
          data: { success: true, messageId: result.messageId },
          message: sentMessage
        };
      } else {
        return {
          type: 'send_email',
          data: { success: false, error: result.error },
          message: `❌ Échec de l'envoi: ${result.error}`
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      return {
        type: 'send_email',
        data: { success: false, error: 'Erreur technique' },
        message: '❌ Une erreur technique s\'est produite lors de l\'envoi.'
      };
    }
  }

  /**
   * Composer un email avec l'IA
   */
  private async composeEmailWithAI(request: string, recipient: Contact, context: string): Promise<{
    subject: string;
    body: string;
  } | null> {
    try {
      const prompt = `Tu es un assistant de rédaction d'emails professionnel.

DESTINATAIRE: ${recipient.name || recipient.email} (${recipient.email})
CONTEXTE DES INTERACTIONS PRÉCÉDENTES: ${context || 'Aucune interaction récente'}

DEMANDE DE L'UTILISATEUR: ${request}

Rédige un email approprié selon le contexte et la demande. Le ton doit être professionnel mais adapté à la relation.

Format de réponse (EXACTEMENT ce format):
SUJET: [sujet de l'email]
CORPS: [corps de l'email]

Règles importantes:
- Commencer par une salutation appropriée
- Corps clair et structuré  
- Terminer par "[Votre nom]"
- Pas de signature automatique
- Adaptation du ton selon la relation`;

      const response = await openaiService.getAdvancedEmailResponse(prompt, []);

      if (response.content) {
        const lines = response.content.split('\n');
        let subject = '';
        let body = '';
        let isBody = false;

        for (const line of lines) {
          if (line.startsWith('SUJET:')) {
            subject = line.replace('SUJET:', '').trim();
          } else if (line.startsWith('CORPS:')) {
            body = line.replace('CORPS:', '').trim();
            isBody = true;
          } else if (isBody && line.trim()) {
            body += '\n' + line;
          }
        }

        return {
          subject: subject || 'Message depuis Orton',
          body: body || response.content
        };
      }

      return null;
    } catch (error) {
      console.error('Erreur composition IA:', error);
      return null;
    }
  }

  /**
   * Modifier un email avec l'IA
   */
  private async modifyEmailWithAI(modification: string, draft: EmailDraft): Promise<{
    subject: string;
    body: string;
  } | null> {
    try {
      const prompt = `Tu es un assistant de rédaction d'emails. Modifie cet email selon la demande.

EMAIL ACTUEL:
Objet: ${draft.subject}
Corps: ${draft.body}

MODIFICATION DEMANDÉE: ${modification}

Retourne l'email modifié avec le même format:
SUJET: [nouveau sujet]
CORPS: [nouveau corps]

Conserve les éléments qui ne nécessitent pas de modification.`;

      const response = await openaiService.getAdvancedEmailResponse(prompt, []);

      if (response.content) {
        const lines = response.content.split('\n');
        let subject = draft.subject;
        let body = draft.body;
        let isBody = false;

        for (const line of lines) {
          if (line.startsWith('SUJET:')) {
            subject = line.replace('SUJET:', '').trim();
          } else if (line.startsWith('CORPS:')) {
            body = line.replace('CORPS:', '').trim();
            isBody = true;
          } else if (isBody && line.trim()) {
            body += '\n' + line;
          }
        }

        return { subject, body };
      }

      return null;
    } catch (error) {
      console.error('Erreur modification IA:', error);
      return null;
    }
  }

  /**
   * Récupérer le contexte des interactions avec un contact
   */
  private async getContactContext(userId: string, email: string): Promise<string> {
    try {
      // Récupérer les derniers emails avec ce contact
      const { data: recentEmails } = await supabase
        .from('emails')
        .select('subject, snippet, received_at')
        .eq('user_id', userId)
        .eq('sender_email', email)
        .order('received_at', { ascending: false })
        .limit(3);

      if (recentEmails && recentEmails.length > 0) {
        return recentEmails
          .map(email => `${email.subject}: ${email.snippet}`)
          .join('\n');
      }

      return 'Aucune interaction récente trouvée';
    } catch (error) {
      console.error('Erreur récupération contexte:', error);
      return 'Contexte non disponible';
    }
  }

  /**
   * Déterminer si l'input est une demande de composition d'email
   */
  private isEmailCompositionRequest(input: string): boolean {
    const compositionKeywords = [
      'écris', 'rédige', 'compose', 'envoie', 'message', 'mail',
      'demande', 'dis-lui', 'contacte', 'réponds'
    ];

    return compositionKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  }

  /**
   * Déterminer si l'input est une demande de modification
   */
  private isModificationRequest(input: string): boolean {
    const modificationKeywords = [
      'modifie', 'change', 'corrige', 'améliore', 'ajoute', 'retire',
      'plus formel', 'plus décontracté', 'plus poli', 'plus direct'
    ];

    return modificationKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  }

  /**
   * Déterminer si l'input est une demande d'envoi
   */
  private isSendRequest(input: string): boolean {
    const sendKeywords = [
      'envoie', 'envoyer', 'vas-y envoie', 'send', 'go'
    ];

    return sendKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  }

  /**
   * Déterminer si on doit reset le brouillon
   */
  private shouldResetDraft(input: string): boolean {
    const resetKeywords = [
      'nouveau mail', 'nouvel email', 'recommence', 'reset', 'annule'
    ];

    return resetKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  }

  /**
   * Nettoyer le brouillon
   */
  resetDraft(): void {
    this.currentDraft = {
      recipient: null,
      subject: '',
      body: '',
      originalRequest: ''
    };
    this.state = 'idle';
  }

  /**
   * Obtenir l'état actuel
   */
  getCurrentState(): {
    state: CompositionState;
    draft: EmailDraft;
  } {
    return {
      state: this.state,
      draft: { ...this.currentDraft }
    };
  }
}

export const emailCompositionService = new EmailCompositionService();