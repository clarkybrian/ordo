import { supabase } from '../lib/supabase';

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
  private async getAccessToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      throw new Error('Token d\'accès Gmail non disponible. Veuillez vous reconnecter.');
    }
    
    return session.provider_token;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      return false;
    }
  }
}

export const gmailService = new GmailService();
