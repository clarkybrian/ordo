import { supabase } from '../lib/supabase';
import { sessionManager } from './sessionManager';

export interface GmailPayload {
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
  parts?: GmailPayload[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: GmailPayload;
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
  body_html: string;
  snippet: string;
  received_at: string;
  is_important: boolean;
  is_read: boolean;
  labels: string[];
  thread_id: string;
  content_structure?: {
    has_html: boolean;
    has_plain_text: boolean;
    text_content: string;
    formatted_content?: {
      paragraphs: string[];
      links: Array<{ text: string; url: string }>;
      headers: string[];
    };
  };
}

class GmailService {
  /**
   * Récupère un token d'accès valide avec refresh automatique par Supabase
   */
  private async getValidAccessToken(): Promise<string> {
    try {
      // Vérifier si la session est valide et la renouveler si nécessaire
      const isValid = await sessionManager.isSessionValid();
      if (!isValid) {
        console.log('🔄 Session invalide, tentative de renouvellement...');
        await sessionManager.refreshSession();
      }

      // Récupérer la session (maintenant valide)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erreur lors de la récupération de la session:', error);
        throw new Error('Erreur de session. Veuillez vous reconnecter.');
      }
      
      if (!session?.provider_token) {
        throw new Error('Session expirée. Veuillez vous reconnecter pour continuer.');
      }

      return session.provider_token;
      
    } catch (error) {
      console.error('❌ Erreur getValidAccessToken:', error);
      if (error instanceof Error && error.message.includes('reconnecter')) {
        throw error;
      }
      throw new Error('Session expirée. Veuillez vous reconnecter pour continuer.');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async makeGmailRequest(endpoint: string): Promise<any> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Récupérer un token valide (Supabase gère automatiquement le refresh)
        const accessToken = await this.getValidAccessToken();
        
        const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = response.statusText;
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorMessage;
          } catch {
            // Si ce n'est pas du JSON, utiliser le texte brut
            errorMessage = errorText || errorMessage;
          }
          
          // Si c'est une erreur d'auth (401/403), forcer la reconnexion
          if (response.status === 401 || response.status === 403) {
            if (attempt < maxRetries) {
              console.log(`🔄 Erreur ${response.status}, tentative ${attempt}/${maxRetries}, retry avec nouveau token...`);
              // Attendre un peu avant de retry
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            } else {
              throw new Error('Session expirée. Veuillez vous reconnecter pour continuer.');
            }
          }
          
          throw new Error(`Erreur Gmail API (${response.status}): ${errorMessage}`);
        }

        return response.json();

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Si c'est une erreur de session expirée, ne pas retry
        if (lastError.message.includes('Session expirée')) {
          throw lastError;
        }
        
        if (attempt < maxRetries) {
          console.log(`🔄 Erreur tentative ${attempt}/${maxRetries}:`, lastError.message, '- Retry...');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Délai progressif
        }
      }
    }

    throw lastError || new Error('Erreur inconnue lors de la requête Gmail après plusieurs tentatives');
  }

  async fetchRecentEmails(maxResults: number = 100): Promise<ProcessedEmail[]> {
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
        const batchPromises = batch.map(msg => 
          this.makeGmailRequest(`/messages/${msg.id}?format=full`)
            .then(fullMessage => this.processEmailData(fullMessage))
            .catch(error => {
              console.error(`Erreur lors du traitement du message ${msg.id}:`, error);
              return null;
            })
        );
        
        const batchResults = await Promise.all(batchPromises);
        emails.push(...batchResults.filter(email => email !== null) as ProcessedEmail[]);
      }

      console.log(`${emails.length} emails traités avec succès`);
      return emails;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des emails:', error);
      throw error;
    }
  }

  /**
   * Récupère seulement les nouveaux emails depuis une date donnée
   */
  async fetchNewEmailsSince(lastSyncDate: string, maxResults: number = 20): Promise<ProcessedEmail[]> {
    try {
      // Convertir la date en format Gmail (YYYY/MM/DD)
      const date = new Date(lastSyncDate);
      const gmailDate = date.toISOString().split('T')[0].replace(/-/g, '/');
      
      console.log(`Récupération des nouveaux emails depuis ${gmailDate} (max ${maxResults})...`);
      
      // Requête Gmail pour les emails plus récents que la date
      const query = `in:inbox after:${gmailDate}`;
      const messagesList = await this.makeGmailRequest(`/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`);
      
      if (!messagesList.messages || messagesList.messages.length === 0) {
        console.log('Aucun nouvel email trouvé');
        return [];
      }

      console.log(`${messagesList.messages.length} nouveaux emails trouvés, récupération des détails...`);
      
      // Récupérer les détails
      const emails: ProcessedEmail[] = [];
      const batchSize = 10;

      for (let i = 0; i < messagesList.messages.length; i += batchSize) {
        const batch = messagesList.messages.slice(i, i + batchSize);
        const batchPromises = batch.map(msg => 
          this.makeGmailRequest(`/messages/${msg.id}?format=full`)
            .then(fullMessage => this.processEmailData(fullMessage))
            .catch(error => {
              console.error(`Erreur lors du traitement du message ${msg.id}:`, error);
              return null;
            })
        );
        
        const batchResults = await Promise.all(batchPromises);
        emails.push(...batchResults.filter(email => email !== null) as ProcessedEmail[]);
      }

      console.log(`${emails.length} nouveaux emails traités avec succès`);
      return emails;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des nouveaux emails:', error);
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
    
    // Extraire le corps du message avec structure améliorée
    const emailContent = this.extractEmailContent(gmailMessage.payload);
    
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
      body_text: emailContent.text_content,
      body_html: emailContent.html_content,
      snippet: gmailMessage.snippet,
      received_at: receivedAt,
      is_important: isImportant,
      is_read: isRead,
      labels: gmailMessage.labelIds,
      thread_id: gmailMessage.threadId,
      content_structure: emailContent.structure
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

  private extractEmailContent(payload: GmailMessage['payload']): {
    text_content: string;
    html_content: string;
    structure: {
      has_html: boolean;
      has_plain_text: boolean;
      text_content: string;
      formatted_content?: {
        paragraphs: string[];
        links: Array<{ text: string; url: string }>;
        headers: string[];
      };
    };
  } {
    let textContent = '';
    let htmlContent = '';
    
    try {
      // Extraire le contenu selon le type MIME
      const extracted = this.extractContentByMimeType(payload);
      textContent = extracted.text;
      htmlContent = extracted.html;
      
      // Si on n'a que du HTML, convertir en texte propre
      if (!textContent && htmlContent) {
        textContent = this.extractCleanTextFromHtml(htmlContent);
      }
      
      // Si on n'a que du texte et pas de HTML
      if (!htmlContent && textContent) {
        htmlContent = textContent;
      }
      
      // Créer la structure formatée
      const formattedContent = this.createFormattedContent(textContent, htmlContent);
      
      return {
        text_content: textContent.trim(),
        html_content: htmlContent.trim(),
        structure: {
          has_html: !!htmlContent && htmlContent !== textContent,
          has_plain_text: !!textContent,
          text_content: textContent.trim(),
          formatted_content: formattedContent
        }
      };
      
    } catch (error) {
      console.error('Erreur lors de l\'extraction du contenu:', error);
      return {
        text_content: '',
        html_content: '',
        structure: {
          has_html: false,
          has_plain_text: false,
          text_content: ''
        }
      };
    }
  }

  private extractContentByMimeType(payload: GmailMessage['payload']): { text: string; html: string } {
    let textContent = '';
    let htmlContent = '';
    
    // Fonction récursive pour explorer les parties
    const extractFromParts = (part: GmailMessage['payload']): void => {
      if (part.body && part.body.data) {
        const decoded = this.decodeBase64Url(part.body.data);
        
        if (part.mimeType === 'text/plain') {
          textContent += decoded + '\n';
        } else if (part.mimeType === 'text/html') {
          htmlContent += decoded + '\n';
        }
      }
      
      // Explorer les sous-parties
      if (part.parts && Array.isArray(part.parts)) {
        part.parts.forEach(extractFromParts);
      }
    };
    
    // Commencer par le payload principal
    if (payload.body && payload.body.data) {
      const decoded = this.decodeBase64Url(payload.body.data);
      
      if (payload.mimeType === 'text/plain') {
        textContent = decoded;
      } else if (payload.mimeType === 'text/html') {
        htmlContent = decoded;
      }
    } else if (payload.parts) {
      payload.parts.forEach(extractFromParts);
    }
    
    return {
      text: textContent.trim(),
      html: htmlContent.trim()
    };
  }

  private extractCleanTextFromHtml(html: string): string {
    try {
      // Créer un élément temporaire pour parser le HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Supprimer les éléments indésirables
      const elementsToRemove = tempDiv.querySelectorAll('script, style, img, object, embed, iframe, canvas, video, audio');
      elementsToRemove.forEach(el => el.remove());
      
      // Traiter les éléments de bloc pour ajouter des sauts de ligne
      const blockElements = tempDiv.querySelectorAll('div, p, br, h1, h2, h3, h4, h5, h6, li');
      blockElements.forEach(el => {
        if (el.tagName.toLowerCase() === 'br') {
          el.replaceWith('\n');
        } else {
          // Ajouter un saut de ligne après les éléments de bloc
          const textNode = document.createTextNode('\n');
          el.appendChild(textNode);
        }
      });
      
      // Extraire le texte propre
      let cleanText = tempDiv.textContent || tempDiv.innerText || '';
      
      // Nettoyer les espaces et sauts de ligne excessifs
      cleanText = cleanText
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Réduire les sauts de ligne multiples
        .replace(/[ \t]+/g, ' ') // Réduire les espaces multiples
        .trim();
      
      return cleanText;
    } catch (error) {
      console.error('Erreur lors du nettoyage HTML:', error);
      return html;
    }
  }

  private createFormattedContent(textContent: string, htmlContent: string): {
    paragraphs: string[];
    links: Array<{ text: string; url: string }>;
    headers: string[];
  } {
    const result = {
      paragraphs: [] as string[],
      links: [] as Array<{ text: string; url: string }>,
      headers: [] as string[]
    };
    
    try {
      // Diviser en paragraphes
      result.paragraphs = textContent
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
      
      // Extraire les liens depuis le HTML
      if (htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        const links = tempDiv.querySelectorAll('a[href]');
        links.forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent || '';
          if (href && text) {
            result.links.push({ text: text.trim(), url: href });
          }
        });
        
        // Extraire les headers
        const headers = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headers.forEach(header => {
          const text = header.textContent || '';
          if (text.trim()) {
            result.headers.push(text.trim());
          }
        });
      }
      
    } catch (error) {
      console.error('Erreur lors de la création du contenu formaté:', error);
    }
    
    return result;
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

  async testConnection(): Promise<boolean> {
    try {
      await this.makeGmailRequest('/profile');
      return true;
    } catch (error) {
      console.error('Test de connexion Gmail échoué:', error);
      // Si c'est juste un problème de token, retourner false pour déclencher une reconnection
      if (error instanceof Error && error.message.includes('Session expirée')) {
        console.log('🔄 Test connection: Session expirée détectée');
        return false;
      }
      return false;
    }
  }
  
  /**
   * Envoie un email via l'API Gmail
   */
  async sendEmail(emailData: {
    to: string;
    subject: string;
    body: string;
    replyTo?: {
      messageId: string;
      threadId: string;
    };
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      console.log(`📧 Envoi d'un email à ${emailData.to}...`);
      
      // Vérifier les scopes avant d'envoyer
      const hasRequiredScopes = await this.checkSendPermissions();
      if (!hasRequiredScopes) {
        throw new Error('❌ PERMISSIONS INSUFFISANTES: Vous devez vous déconnecter puis vous reconnecter pour obtenir les permissions d\'envoi d\'emails.');
      }
      
      // Construire l'email au format RFC 2822
      const email = this.buildEmailMessage(emailData);
      
      // Encoder l'email en base64url
      const encodedEmail = this.encodeBase64Url(email);
      
      // Envoyer via l'API Gmail
      const accessToken = await this.getValidAccessToken();
      
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail,
          threadId: emailData.replyTo?.threadId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Erreur réponse Gmail:', error);
        
        // Si c'est un problème de scope, le signaler clairement
        if (response.status === 403 && error.error?.message?.includes('insufficient authentication scopes')) {
          throw new Error('❌ PERMISSIONS INSUFFISANTES: Vous devez vous déconnecter puis vous reconnecter pour obtenir les permissions d\'envoi d\'emails.');
        }
        
        throw new Error(`Erreur envoi email: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Email envoyé avec succès! ID: ${result.id}`);
      
      return {
        success: true,
        messageId: result.id
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
  
  /**
   * Vérifie si l'utilisateur a les permissions d'envoi d'emails
   */
  async checkSendPermissions(): Promise<boolean> {
    try {
      const accessToken = await this.getValidAccessToken();
      
      // Test simple : essayer d'accéder à l'endpoint draft (nécessite les permissions d'envoi)
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/drafts?maxResults=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      // Si 403, c'est que les scopes sont insuffisants
      if (response.status === 403) {
        console.warn('⚠️ Scopes insuffisants pour envoyer des emails');
        return false;
      }
      
      return response.ok;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }
  
  /**
   * Construit le message email au format RFC 2822
   */
  private buildEmailMessage(emailData: {
    to: string;
    subject: string;
    body: string;
    replyTo?: {
      messageId: string;
      threadId: string;
    };
  }): string {
    const lines = [];
    
    // Headers obligatoires
    lines.push(`To: ${emailData.to}`);
    lines.push(`Subject: ${emailData.subject}`);
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: quoted-printable');
    
    // Headers pour la réponse (si c'est une réponse)
    if (emailData.replyTo) {
      lines.push(`In-Reply-To: <${emailData.replyTo.messageId}>`);
      lines.push(`References: <${emailData.replyTo.messageId}>`);
    }
    
    // Ligne vide pour séparer les headers du body
    lines.push('');
    
    // Corps du message
    lines.push(emailData.body);
    
    return lines.join('\r\n');
  }
  
  /**
   * Encode une chaîne en base64url (variant URL-safe du base64)
   */
  private encodeBase64Url(str: string): string {
    try {
      // Encoder en UTF-8 puis en base64
      const utf8Bytes = unescape(encodeURIComponent(str));
      const base64 = btoa(utf8Bytes);
      
      // Convertir en base64url
      return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''); // Supprimer le padding
    } catch (error) {
      console.error('Erreur lors de l\'encodage base64url:', error);
      throw new Error('Impossible d\'encoder l\'email');
    }
  }
}

export const gmailService = new GmailService();
