import { supabase } from '../lib/supabase';

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    partId: string;
    mimeType: string;
    filename: string;
    headers: Array<{
      name: string;
      value: string;
    }>;
    body: {
      size: number;
      data?: string;
    };
    parts?: any[];
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface ProcessedEmail {
  gmail_id: string;
  subject: string;
  sender: string;
  sender_email: string;
  body_text: string;
  snippet: string;
  received_at: string;
  is_important: boolean;
  is_read: boolean;
  labels: string[];
  thread_id: string;
}

class GmailService {
  private async getAccessToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      throw new Error('Token d\'accès Gmail non disponible. Veuillez vous reconnecter.');
    }
    
    return session.provider_token;
  }

  private async makeGmailRequest(endpoint: string): Promise<any> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur Gmail API: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  async fetchRecentEmails(maxResults: number = 50): Promise<ProcessedEmail[]> {
    try {
      console.log(`Récupération des ${maxResults} emails les plus récents...`);
      
      // Récupérer la liste des messages récents
      const messagesList = await this.makeGmailRequest(`/messages?maxResults=${maxResults}&q=in:inbox`);
      
      if (!messagesList.messages || messagesList.messages.length === 0) {
        console.log('Aucun email trouvé');
        return [];
      }

      console.log(`${messagesList.messages.length} emails trouvés, récupération des détails...`);
      
      // Récupérer les détails de chaque message en parallèle (par batch de 10)
      const batchSize = 10;
      const emails: ProcessedEmail[] = [];
      
      for (let i = 0; i < messagesList.messages.length; i += batchSize) {
        const batch = messagesList.messages.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (message: { id: string }) => {
          try {
            const emailDetail: GmailMessage = await this.makeGmailRequest(`/messages/${message.id}`);
            return this.processEmailData(emailDetail);
          } catch (error) {
            console.error(`Erreur lors du traitement de l'email ${message.id}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validEmails = batchResults.filter(email => email !== null) as ProcessedEmail[];
        emails.push(...validEmails);
        
        // Petite pause entre les batches pour éviter le rate limiting
        if (i + batchSize < messagesList.messages.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`${emails.length} emails traités avec succès`);
      return emails;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des emails:', error);
      throw error;
    }
  }

  private processEmailData(gmailMessage: GmailMessage): ProcessedEmail {
    const headers = gmailMessage.payload.headers;
    
    // Extraire les informations des headers
    const subject = this.getHeaderValue(headers, 'Subject') || '(Pas d\'objet)';
    const from = this.getHeaderValue(headers, 'From') || '';
    
    // Parser l'expéditeur pour extraire nom et email
    const { name: sender, email: sender_email } = this.parseFromHeader(from);
    
    // Extraire le corps du message
    const body_text = this.extractEmailBody(gmailMessage.payload);
    
    // Déterminer si l'email est important ou non lu
    const isImportant = gmailMessage.labelIds.includes('IMPORTANT');
    const isRead = !gmailMessage.labelIds.includes('UNREAD');
    
    // Convertir la date
    const receivedAt = new Date(parseInt(gmailMessage.internalDate)).toISOString();
    
    return {
      gmail_id: gmailMessage.id,
      subject,
      sender,
      sender_email,
      body_text,
      snippet: gmailMessage.snippet,
      received_at: receivedAt,
      is_important: isImportant,
      is_read: isRead,
      labels: gmailMessage.labelIds,
      thread_id: gmailMessage.threadId
    };
  }

  private getHeaderValue(headers: Array<{ name: string; value: string }>, name: string): string {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  }

  private parseFromHeader(from: string): { name: string; email: string } {
    // Regex pour parser "Nom <email@domain.com>" ou "email@domain.com"
    const match = from.match(/^(.+?)\s*<(.+?)>$/) || from.match(/^(.+)$/);
    
    if (match && match[2]) {
      // Format: "Nom <email>"
      return {
        name: match[1].trim().replace(/"/g, ''),
        email: match[2].trim()
      };
    } else if (match && match[1]) {
      // Format: juste l'email
      const email = match[1].trim();
      return {
        name: email.split('@')[0], // Utiliser la partie avant @ comme nom
        email: email
      };
    }
    
    return {
      name: from,
      email: from
    };
  }

  private extractEmailBody(payload: any): string {
    let body = '';
    
    try {
      if (payload.body && payload.body.data) {
        // Corps direct
        body = this.decodeBase64Url(payload.body.data);
      } else if (payload.parts) {
        // Corps dans les parties
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            if (part.body && part.body.data) {
              body += this.decodeBase64Url(part.body.data);
            }
          } else if (part.parts) {
            // Récursif pour les parties imbriquées
            body += this.extractEmailBody(part);
          }
        }
      }
      
      // Nettoyer le HTML si présent
      if (body.includes('<')) {
        body = this.stripHtml(body);
      }
      
      return body.trim();
    } catch (error) {
      console.error('Erreur lors de l\'extraction du corps:', error);
      return '';
    }
  }

  private decodeBase64Url(data: string): string {
    try {
      // Remplacer les caractères URL-safe par les caractères base64 standard
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      
      // Ajouter le padding si nécessaire
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const paddedBase64 = base64 + padding;
      
      // Décoder
      const decoded = atob(paddedBase64);
      
      // Convertir en UTF-8
      return decodeURIComponent(escape(decoded));
    } catch (error) {
      console.error('Erreur lors du décodage base64:', error);
      return data;
    }
  }

  private stripHtml(html: string): string {
    // Créer un élément temporaire pour parser le HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Extraire le texte
    return temp.textContent || temp.innerText || '';
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeGmailRequest('/profile');
      return true;
    } catch (error) {
      console.error('Test de connexion Gmail échoué:', error);
      return false;
    }
  }
}

export const gmailService = new GmailService();
