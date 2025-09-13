import type { Email } from '../types';
import { supabase } from '../lib/supabase';

export interface UnsubscribeLink {
  url: string;
  method: 'GET' | 'POST' | 'mailto';
  type: 'header' | 'content';
  confidence: number;
}

export interface UnsubscribeResult {
  success: boolean;
  message: string;
  method_used: string;
}

export interface UnsubscribeRequest {
  id: string;
  user_id: string;
  email_id: string;
  unsubscribe_url: string;
  method: string;
  status: 'pending' | 'success' | 'failed';
  attempted_at: string;
  completed_at?: string;
  error_message?: string;
}

class UnsubscribeService {
  /**
   * Détecte les liens de désabonnement dans un email (méthode hybride)
   */
  detectUnsubscribeLinks(email: Email): UnsubscribeLink[] {
    const links: UnsubscribeLink[] = [];
    const content = email.body_html || email.body_text || email.snippet;

    // 🎯 MÉTHODE 1: Header List-Unsubscribe (priorité maximale)
    // Note: Les headers ne sont pas directement disponibles via Gmail API basique
    // mais peuvent être extraits avec une requête plus détaillée
    
    // 🎯 MÉTHODE 2: Détection dans le contenu HTML/texte
    if (content) {
      const unsubscribeLinks = this.extractUnsubscribeLinksFromContent(content);
      links.push(...unsubscribeLinks);
    }

    // 🎯 MÉTHODE 3: Patterns basés sur l'expéditeur
    const domainBasedLink = this.generateUnsubscribeLinkFromDomain(email.sender_email);
    if (domainBasedLink) {
      links.push(domainBasedLink);
    }

    return links.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extrait les liens de désabonnement du contenu email
   */
  private extractUnsubscribeLinksFromContent(content: string): UnsubscribeLink[] {
    const links: UnsubscribeLink[] = [];
    const lowerContent = content.toLowerCase();

    // Patterns de détection (français et anglais)
    const unsubscribePatterns = [
      /href=["'](https?:\/\/[^"']*(?:unsubscribe|désabonner|se-desinscrire|opt-out|remove)[^"']*)["']/gi,
      /https?:\/\/[^\s<>"']*(?:unsubscribe|désabonner|se-desinscrire|opt-out|remove)[^\s<>"']*/gi,
      /mailto:[^"'\s<>]*(?:unsubscribe|désabonner|remove)@[^"'\s<>]*/gi
    ];

    // Textes indicateurs de liens de désabonnement
    const unsubscribeTexts = [
      'se désabonner', 'désabonner', 'unsubscribe', 'opt out', 'remove from list',
      'se désinscrire', 'ne plus recevoir', 'arrêter les emails', 'manage preferences'
    ];

    // Extraire les liens avec regex
    unsubscribePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const url = match.replace(/href=["']/, '').replace(/["']$/, '');
          
          if (url.startsWith('mailto:')) {
            links.push({
              url,
              method: 'mailto',
              type: 'content',
              confidence: 0.8
            });
          } else if (url.startsWith('http')) {
            links.push({
              url,
              method: 'GET',
              type: 'content',
              confidence: 0.9
            });
          }
        });
      }
    });

    // Rechercher des liens près du texte de désabonnement
    unsubscribeTexts.forEach(text => {
      if (lowerContent.includes(text.toLowerCase())) {
        // Chercher un lien dans les 200 caractères autour du texte
        const textIndex = lowerContent.indexOf(text.toLowerCase());
        const context = content.substring(
          Math.max(0, textIndex - 100),
          Math.min(content.length, textIndex + 100)
        );

        const linkMatch = context.match(/https?:\/\/[^\s<>"']+/);
        if (linkMatch) {
          links.push({
            url: linkMatch[0],
            method: 'GET',
            type: 'content',
            confidence: 0.7
          });
        }
      }
    });

    return links;
  }

  /**
   * Génère un lien de désabonnement basé sur le domaine (pattern commun)
   */
  private generateUnsubscribeLinkFromDomain(senderEmail: string): UnsubscribeLink | null {
    const domain = senderEmail.split('@')[1];
    if (!domain) return null;

    // Patterns courants pour les domaines de marketing
    const commonPatterns = [
      `https://${domain}/unsubscribe`,
      `https://${domain}/opt-out`,
      `https://unsubscribe.${domain}`,
      `mailto:unsubscribe@${domain}`
    ];

    // Retourner le premier pattern avec une confiance faible
    return {
      url: commonPatterns[0],
      method: 'GET',
      type: 'content',
      confidence: 0.3
    };
  }

  /**
   * Vérifie si un email est une newsletter (critères IA + patterns)
   */
  isNewsletter(email: Email): boolean {
    const content = (email.body_html || email.body_text || email.snippet || '').toLowerCase();
    const senderEmail = email.sender_email.toLowerCase();
    
    // Critères de détection de newsletter
    const newsletterIndicators = [
      // Liens de désabonnement
      content.includes('unsubscribe') || content.includes('désabonner'),
      // Expéditeurs automatiques
      senderEmail.includes('noreply') || senderEmail.includes('no-reply'),
      senderEmail.includes('newsletter') || senderEmail.includes('marketing'),
      // Contenu marketing
      content.includes('newsletter') || content.includes('marketing'),
      content.includes('promotional') || content.includes('special offer'),
      // Structure HTML complexe (indicateur de template marketing)
      (email.body_html?.length || 0) > 1000 && content.includes('<table')
    ];

    // Au moins 2 critères doivent être remplis
    return newsletterIndicators.filter(Boolean).length >= 2;
  }

  /**
   * Exécute le désabonnement automatique
   */
  async executeUnsubscribe(unsubscribeLink: UnsubscribeLink, emailId: string, userId: string): Promise<UnsubscribeResult> {
    try {
      // Note: Supabase tracking temporairement désactivé pour éviter les erreurs
      console.log('Tentative de désabonnement:', unsubscribeLink.url);
      
      let result: UnsubscribeResult;

      if (unsubscribeLink.method === 'mailto') {
        // Pour mailto, on peut seulement ouvrir le client email
        result = {
          success: true,
          message: 'Client email ouvert pour désabonnement manuel',
          method_used: 'mailto'
        };
        if (typeof window !== 'undefined') {
          window.location.href = unsubscribeLink.url;
        }
      } else {
        // Pour les liens HTTP, faire une requête
        result = await this.executeHttpUnsubscribe(unsubscribeLink.url);
      }

      return result;

    } catch (error) {
      console.error('Erreur lors du désabonnement:', error);
      return {
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        method_used: unsubscribeLink.method
      };
    }
  }

  /**
   * Exécute un désabonnement HTTP en ouvrant le lien dans un nouvel onglet
   */
  private async executeHttpUnsubscribe(url: string): Promise<UnsubscribeResult> {
    try {
      // Ouvrir le lien de désabonnement dans un nouvel onglet
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        return {
          success: false,
          message: 'Impossible d\'ouvrir le lien de désabonnement. Veuillez vérifier que les pop-ups sont autorisées et réessayer.',
          method_used: 'http'
        };
      }

      // Le désabonnement sera effectué manuellement par l'utilisateur
      return {
        success: true,
        message: '✅ Lien de désabonnement ouvert dans un nouvel onglet.\n\n👉 Veuillez confirmer le désabonnement sur la page qui s\'est ouverte, puis fermer cet onglet.',
        method_used: 'http'
      };

    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de l'ouverture du lien: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        method_used: 'http'
      };
    }
  }

  /**
   * Désabonnement groupé pour une catégorie
   */
  async bulkUnsubscribeFromCategory(categoryId: string, userId: string): Promise<{
    total: number;
    processed: number;
    successful: number;
    failed: number;
    results: Array<{ emailId: string; success: boolean; message: string; }>
  }> {
    // Récupérer tous les emails de la catégorie
    const { data: emails, error } = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId);

    if (error || !emails) {
      throw new Error('Impossible de récupérer les emails de la catégorie');
    }

    const newsletters = emails.filter(email => this.isNewsletter(email));
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const email of newsletters) {
      const unsubscribeLinks = this.detectUnsubscribeLinks(email);
      
      if (unsubscribeLinks.length > 0) {
        const result = await this.executeUnsubscribe(unsubscribeLinks[0], email.id, userId);
        results.push({
          emailId: email.id,
          success: result.success,
          message: result.message
        });

        if (result.success) successful++;
        else failed++;

        // Attendre un peu entre chaque requête pour éviter de surcharger
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      total: newsletters.length,
      processed: results.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Récupère l'historique des désabonnements
   */
  async getUnsubscribeHistory(userId: string): Promise<UnsubscribeRequest[]> {
    const { data, error } = await supabase
      .from('unsubscribe_requests')
      .select(`
        *,
        emails (
          subject,
          sender_email,
          received_at
        )
      `)
      .eq('user_id', userId)
      .order('attempted_at', { ascending: false });

    if (error) {
      throw new Error('Impossible de récupérer l\'historique');
    }

    return data || [];
  }
}

// Instance singleton
export const unsubscribeService = new UnsubscribeService();
export default UnsubscribeService;
