import OpenAI from 'openai';
import { supabase } from '../lib/supabase';
import type { ProcessedEmail } from './gmail';
import type { Category } from './classification';
// import { chatbotLimiterService } from './chatbotLimiter';

// Interface pour le contexte email (utilisée dans d'autres fonctions si besoin)
// interface EmailContext {
//   id: string;
//   subject: string;
//   sender_name: string;
//   sender_email: string;
//   received_at: string;
//   body_text?: string;
//   snippet?: string;
//   is_read: boolean;
//   is_important: boolean;
//   category?: string;
//   labels?: string[];
//   attachments?: unknown[];
// }

// interface ConversationMessage {
//   content: string;
//   isUser: boolean;
// }

export interface ClassificationResult {
  category_id: string;
  category_name: string;
  confidence: number;
  auto_created: boolean;
  reasoning: string;
}

export interface ChatbotResponse {
  message: string;
  data?: unknown;
  type: 'info' | 'data' | 'error' | 'warning';
}

interface OpenAIClassificationResponse {
  category_name: string;
  use_existing: boolean;
  confidence: number;
  reasoning: string;
}

interface EmailSummary {
  subject: string;
  sender: string;
  date: string;
  isImportant: boolean;
  isRead: boolean;
  category: string;
  content: string;
  hasAttachments: boolean;
}

interface EmailWithCategory {
  id: string;
  subject: string;
  sender_email: string;
  sender_name?: string;
  snippet: string;
  body_text?: string;
  body_html?: string;
  received_at: string;
  created_at: string;
  is_read: boolean;
  is_important: boolean;
  has_attachments?: boolean;
  labels?: string[];
  category?: {
    name: string;
    color: string;
    icon: string;
  };
}

class OpenAIService {
  private openai: OpenAI | null;
  private readonly MAX_CATEGORIES = 8;
  private readonly MIN_CATEGORIES = 1;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey.length < 50) {
      console.warn('⚠️ Clé API OpenAI manquante ou incorrecte - Assistant désactivé temporairement');
      // Créer un client factice pour éviter les erreurs
      this.openai = null;
      return;
    }
    
    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Pour utilisation côté client
      });
    } catch (error) {
      console.warn('⚠️ Erreur initialisation OpenAI:', error);
      this.openai = null;
    }
  }

  /**
   * Classifie un email en utilisant GPT-4o mini (modèle économique et performant)
   */
  async classifyEmail(email: ProcessedEmail, existingCategories: Category[]): Promise<ClassificationResult> {
    try {
      // Vérifier si OpenAI est disponible
      if (!this.openai) {
        console.warn('⚠️ OpenAI non disponible - utilisation du fallback');
        return this.getFallbackCategory(existingCategories);
      }

      console.log(`🤖 Classification OpenAI de l'email: "${email.subject}"`);

      const existingCategoryNames = existingCategories.map(cat => cat.name);

      const prompt = this.buildClassificationPrompt(email, existingCategoryNames);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // CHANGÉ : GPT-4o mini pour la classification
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant expert en classification d\'emails. Tu dois analyser un email et répondre UNIQUEMENT avec le nom exact de la catégorie appropriée parmi celles proposées.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 50, // Réduit car on veut juste le nom de catégorie
        temperature: 0.1, // Faible pour des résultats plus déterministes
        // RETIRÉ: response_format JSON qui causait la confusion
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('Réponse vide de OpenAI');
      }

      // Le résultat est maintenant directement le nom de la catégorie
      const categoryName = response.trim();
      console.log('📊 Catégorie choisie par OpenAI:', categoryName);

      // Trouver la catégorie correspondante
      const matchedCategory = existingCategories.find(
        cat => cat.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (matchedCategory) {
        return {
          category_id: matchedCategory.id,
          category_name: matchedCategory.name,
          confidence: 0.9,
          auto_created: false,
          reasoning: `Classé comme ${matchedCategory.name} par OpenAI GPT-4o mini`
        };
      } else {
        console.warn(`⚠️ Catégorie "${categoryName}" non trouvée, utilisation du fallback`);
        return this.getFallbackCategory(existingCategories);
      }

    } catch (error) {
      console.error('❌ Erreur lors de la classification OpenAI:', error);
      // Fallback vers une catégorie par défaut
      return this.getFallbackCategory(existingCategories);
    }
  }

  /**
   * Enrichit le contexte email avec des métadonnées avancées pour classification précise
   */
  private enrichEmailContext(email: ProcessedEmail): string {
    const senderDomain = email.sender_email.split('@')[1] || '';
    const senderName = email.sender || 'Nom inconnu';
    
    // Analyse du domaine
    const personalDomains = ['gmail.com', 'yahoo.fr', 'yahoo.com', 'hotmail.com', 'outlook.com', 'free.fr', 'orange.fr', 'laposte.net'];
    const serviceDomains = ['edf.fr', 'engie.fr', 'orange.fr', 'sfr.fr', 'free.fr', 'bouyguestelecom.fr'];
    const bankDomains = ['credit-agricole.fr', 'bnpparibas.net', 'societegenerale.fr', 'banque-populaire.fr'];
    const adminDomains = ['gouv.fr', 'impots.gouv.fr', 'ameli.fr', 'caf.fr', 'pole-emploi.fr'];
    const ecommerceDomains = ['amazon.fr', 'amazon.com', 'cdiscount.com', 'zalando.fr', 'fnac.com'];
    
    const isPersonalDomain = personalDomains.includes(senderDomain);
    const isServiceDomain = serviceDomains.includes(senderDomain);
    const isBankDomain = bankDomains.includes(senderDomain);
    const isAdminDomain = adminDomains.includes(senderDomain);
    const isEcommerceDomain = ecommerceDomains.includes(senderDomain);
    
    // Analyse du nom d'expéditeur
    const hasPersonName = /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(senderName);
    const isNoReply = email.sender_email.includes('noreply') || email.sender_email.includes('no-reply') || 
                     email.sender_email.includes('notification') || email.sender_email.includes('contact');
    
    // Analyse du contenu
    const content = (email.body_text || email.snippet || '').toLowerCase();
    const hasUnsubscribe = content.includes('unsubscribe') || content.includes('désabonner') || 
                          content.includes('se désinscrire') || content.includes('newsletter');
    
    // Détection de patterns spécifiques
    const hasPromoKeywords = content.includes('promotion') || content.includes('offre spéciale') || 
                            content.includes('réduction') || content.includes('soldes') || 
                            content.includes('prix en baisse') || content.includes('deal') ||
                            content.includes('discount') || content.includes('promo');
    
    const hasJobKeywords = content.includes('offre d\'emploi') || content.includes('candidature') || 
                          content.includes('recrutement') || content.includes('cv') ||
                          content.includes('job alert') || content.includes('opportunité');
    
    const hasBillKeywords = content.includes('facture') || content.includes('prélèvement') || 
                           content.includes('échéance') || content.includes('facturation') ||
                           content.includes('billing') || content.includes('invoice');
    
    const hasTransactionKeywords = content.includes('virement') || content.includes('relevé') || 
                                  content.includes('carte bancaire') || content.includes('transaction') ||
                                  content.includes('solde') || content.includes('compte');
    
    // Détection de domaines problématiques
    const isJobSiteDomain = ['indeed.com', 'hellowork.com', 'linkedin.com', 'monster.fr'].includes(senderDomain);
    const isMarketingSender = senderName.toLowerCase().includes('marketing') || 
                             senderName.toLowerCase().includes('promo') ||
                             senderName.toLowerCase().includes('deals');
    
    return `🔍 ANALYSE DÉTAILLÉE DE L'EMAIL:

📧 INFORMATIONS DE BASE:
Expéditeur: ${email.sender_email} (${senderName})
Sujet: "${email.subject}"
Date: ${new Date(email.received_at).toLocaleString('fr-FR')}

🌐 ANALYSE DU DOMAINE:
Domaine: ${senderDomain}
Type de domaine: ${
  isAdminDomain ? '🏛️ ADMINISTRATION OFFICIELLE' :
  isBankDomain ? '🏦 BANQUE OFFICIELLE' :
  isServiceDomain ? '📄 FOURNISSEUR DE SERVICES' :
  isEcommerceDomain ? '🛍️ E-COMMERCE' :
  isPersonalDomain ? '👤 DOMAINE PERSONNEL' :
  isJobSiteDomain ? '🚨 SITE D\'EMPLOI (→ PUBLICITÉ)' : 
  '🏢 DOMAINE PROFESSIONNEL'
}

👤 ANALYSE DE L'EXPÉDITEUR:
Type d'expéditeur: ${isNoReply ? '🤖 AUTOMATIQUE/NOREPLY' : hasPersonName ? '👨 PERSONNE RÉELLE' : '🏢 SERVICE/ORGANISATION'}
Sender marketing détecté: ${isMarketingSender ? '🚨 OUI (→ PUBLICITÉ)' : 'Non'}

📝 ANALYSE DU CONTENU:
Contenu (300 premiers caractères): "${(email.body_text || email.snippet || '').substring(0, 300)}..."

🎯 DÉTECTIONS SPÉCIALES:
Lien de désabonnement: ${hasUnsubscribe ? '🚨 OUI (→ PUBLICITÉ PROBABLE)' : 'Non'}
Mots-clés promotion: ${hasPromoKeywords ? '🚨 OUI (→ PUBLICITÉ)' : 'Non'}
Mots-clés emploi: ${hasJobKeywords ? '🔍 OUI (Attention: si newsletter → PUBLICITÉ)' : 'Non'}
Mots-clés facture: ${hasBillKeywords ? '📄 OUI (→ SERVICES probable)' : 'Non'}
Mots-clés transaction: ${hasTransactionKeywords ? '🏦 OUI (→ BANQUE probable)' : 'Non'}

⚡ INDICATEURS CRITIQUES:
Domaine site d'emploi: ${isJobSiteDomain ? '🚨 OUI → PUBLICITÉ (HelloWork, Indeed, etc.)' : 'Non'}
Email important: ${email.is_important ? 'Oui' : 'Non'}
Email lu: ${email.is_read ? 'Oui' : 'Non'}

🎯 RECOMMANDATION BASÉE SUR L'ANALYSE:`;
  }

  /**
   * Construit le prompt pour la classification
   */
  private buildClassificationPrompt(email: ProcessedEmail, existingCategories: string[]): string {
    const enrichedContext = this.enrichEmailContext(email);
    
    return `${enrichedContext}

1. 📄 SERVICES (PRIORITÉ MAXIMALE)

Définition : Emails provenant de fournisseurs essentiels (eau, électricité, internet, assurances, téléphonie), incluant factures, abonnements, contrats, relances officielles.

✅ EXEMPLES VALIDES

EDF : "Votre facture d’électricité est disponible" → Services

Orange : "Votre abonnement internet a été renouvelé" → Services

Allianz : "Votre cotisation annuelle est arrivée à échéance" → Services

Véolia : "Relevé de consommation d’eau" → Services

🚫 EXCLUS (vers Publicité)

"Changez de fournisseur EDF pour payer moins cher" → Publicité

"Nouvelle offre SFR avec -50%" → Publicité

"Assurance habitation pas chère" d’un site comparateur → Publicité

Critères techniques

Expéditeur : @edf.fr, @engie.com, @orange.fr, etc.

Contenu : facture, prélèvement, échéance, consommation, relevé

Jamais de mention unsubscribe (sinon → Pub).

2. 🏦 BANQUE (TRÈS HAUTE PRIORITÉ)

Définition : Emails provenant de banques traditionnelles, incluant relevés, transactions, sécurité, alertes fraude, cartes bancaires.

✅ EXEMPLES VALIDES

Crédit Agricole : "Votre virement de 200€ a été effectué" → Banque

BNP : "Nouvelle carte bancaire envoyée" → Banque

Société Générale : "Alerte sécurité : connexion inhabituelle" → Banque

🚫 EXCLUS

Revolut, N26 (marketing promos cashback) → Publicité

Crypto newsletters ("Achetez du Bitcoin") → Publicité

Banques mais email non-officiel (@gmail.com) → Phishing → à ignorer / Pub

Critères techniques

Domaines bancaires exacts : @credit-agricole.fr, @bnpparibas.net, @socgen.com…

Contenu : virement, relevé, solde, carte, sécurité

Si "unsubscribe" présent → ce n’est PAS banque → Publicité.

3. 🏛️ ADMINISTRATION (TRÈS HAUTE PRIORITÉ)

Définition : Emails officiels des services publics et démarches administratives.

✅ EXEMPLES VALIDES

Impôts : "Votre avis d’imposition est disponible" → Administration

Ameli : "Remboursement de vos frais médicaux" → Administration

CAF : "Nouvelle attestation disponible" → Administration

Pôle emploi : "Rendez-vous mensuel" → Administration

🚫 EXCLUS

Emploi.org, Indeed → newsletters emploi → Publicité

Sites imitant impôts mais domaine non officiel (.com) → Phishing/Pub

Critères techniques

Domaines officiels : .gouv.fr, @ameli.fr, @caf.fr, @pole-emploi.fr

Contenu : remboursement, déclaration, avis, attestation

Pas d’unsubscribe.

4. 🛍️ ACHATS (HAUTE PRIORITÉ)

Définition : Emails de confirmation d’achat réel, factures liées à un achat e-commerce.

✅ EXEMPLES VALIDES

Amazon : "Votre commande #1234 a été expédiée" → Achats

Fnac : "Votre colis est prêt en magasin" → Achats

Cdiscount : "Facture de votre commande" → Achats

🚫 EXCLUS

Amazon : "Promotion sur les TV -50%" → Publicité

Fnac newsletter : "Nouveautés culturelles" → Publicité

Critères techniques

Domaines : @amazon.fr, @cdiscount.com, @fnac.com…

Contenu : commande, facture, expédition, suivi

Si promotion/unsubscribe → Publicité.

5. ✈️ VOYAGES (PRIORITÉ MOYENNE)

Définition : Emails confirmant des réservations de transport ou hébergement réels.

✅ EXEMPLES VALIDES

SNCF : "Votre billet Paris-Lyon est confirmé" → Voyages

Air France : "Check-in ouvert" → Voyages

Booking : "Votre réservation d’hôtel est confirmée" → Voyages

🚫 EXCLUS

Air France promo : "Destinations à -30%" → Publicité

Sites de deals voyage → Publicité

Critères techniques

Domaines : @sncf-connect.com, @airfrance.fr, @booking.com

Contenu : réservation confirmée, billet, embarquement, hôtel

Si unsubscribe/promo → Publicité.

6. 💼 TRAVAIL (PRIORITÉ STRICTE)

Définition : Communication professionnelle réelle (collègues, clients, employeurs).

✅ EXEMPLES VALIDES

Mail interne entreprise : "Réunion projet lundi 14h" → Travail

Client : "Merci pour l’envoi du devis" → Travail

RH : "Planning de la formation interne" → Travail

🚫 EXCLUS

Indeed : "Offres d’emploi disponibles" → Publicité

LinkedIn : "Découvrez de nouvelles opportunités" → Publicité

Coaching carrière : Publicité

Critères techniques

Domaine entreprise : @entreprise.com

Expéditeur réel (nom + prénom, pas noreply@)

Pas d’unsubscribe.

7. 👤 PERSONNEL (PRIORITÉ CIBLÉE)

Définition : Emails de correspondance privée (famille, amis, proches).

✅ EXEMPLES VALIDES

"Salut, on se voit ce week-end ?" depuis @gmail.com → Personnel

"Joyeux anniversaire !" de @yahoo.fr → Personnel

🚫 EXCLUS

Gmail mais newsletter (ex: "Chess.com daily puzzle") → Publicité

Coaching personnel avec unsubscribe → Publicité

Critères techniques

Domaines grand public : @gmail.com, @yahoo.fr, @hotmail.com

Expéditeur = nom réel (pas entreprise)

Contenu = personnel (pas pub).

8. 📢 PUBLICITÉ (CATCH-ALL)

Définition : Tout email marketing, promotion, spam, newsletter.

✅ EXEMPLES VALIDES

AliExpress : "Profitez de -70% aujourd’hui" → Publicité

HelloWork : "20 nouvelles offres d’emploi" → Publicité

Coaching : "Améliorez votre CV" → Publicité

Jeux/loisirs : Chess.com, Spotify newsletters → Publicité

Critères techniques

Présence d’unsubscribe = toujours Publicité (sauf Services/Banque/Admin)

Expéditeur : noreply@ + contenu marketing = Publicité

Domaines inconnus + promo = Publicité

🔥 RÈGLES ANTI-ERREUR (renforcées)

Hiérarchie stricte (cascade) :
Services > Banque > Administration > Achats > Voyages > Travail > Personnel > Publicité

Mot-clés critiques :

unsubscribe, newsletter, promotion, offre, deal = Publicité

facture, échéance, virement, attestation, réservation = catégorie officielle correspondante

Expéditeur :

Domaines officiels = Services/Banque/Admin

Gmail/Yahoo/Hotmail + contenu personnel = Personnel

Gmail + marketing = Publicité

Phishing / faux domaines :

EDF via @gmail.com = pas Services → Publicité (ou suspect)

Impôts via .com = pas Administration → Publicité (ou suspect)

Catégories disponibles: ${existingCategories.join(', ')}

🎯 INSTRUCTION FINALE: Analyse l'email selon ces règles strictes et réponds UNIQUEMENT avec le nom exact de la catégorie appropriée. En cas de doute, privilégie la catégorie de priorité plus élevée dans la cascade.`;
  }

  /**
   * Traite le résultat de classification et gère la création de catégories
   */
  private async processClassificationResult(result: OpenAIClassificationResponse, existingCategories: Category[]): Promise<ClassificationResult> {
    const { category_name, use_existing, confidence, reasoning } = result;

    if (use_existing) {
      // Chercher la catégorie existante
      const existingCategory = existingCategories.find(
        cat => cat.name.toLowerCase() === category_name.toLowerCase()
      );

      if (existingCategory) {
        return {
          category_id: existingCategory.id,
          category_name: existingCategory.name,
          confidence: confidence || 0.8,
          auto_created: false,
          reasoning: reasoning || 'Catégorie existante trouvée'
        };
      }
    }

    // Créer une nouvelle catégorie si possible
    if (existingCategories.length < this.MAX_CATEGORIES) {
      const newCategory = await this.createNewCategory(category_name);
      return {
        category_id: newCategory.id,
        category_name: newCategory.name,
        confidence: confidence || 0.7,
        auto_created: true,
        reasoning: reasoning || 'Nouvelle catégorie créée'
      };
    }

    // Fallback vers la catégorie la plus similaire
    const fallbackCategory = this.findMostSimilarCategory(category_name, existingCategories);
    return {
      category_id: fallbackCategory.id,
      category_name: fallbackCategory.name,
      confidence: 0.5,
      auto_created: false,
      reasoning: 'Limite de catégories atteinte, utilisation de la plus similaire'
    };
  }

  /**
   * Crée une nouvelle catégorie automatiquement
   */
  private async createNewCategory(name: string): Promise<Category> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const categoryData = {
      name: name,
      user_id: user.id,
      color: this.generateRandomColor(),
      icon: this.getDefaultIcon(name),
      is_auto_generated: true,
      description: `Catégorie créée automatiquement pour: ${name}`
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;

    console.log(`✨ Nouvelle catégorie créée: ${name}`);
    return data as Category;
  }

  /**
   * Trouve la catégorie la plus similaire par nom
   */
  private findMostSimilarCategory(targetName: string, categories: Category[]): Category {
    if (categories.length === 0) {
      throw new Error('Aucune catégorie disponible');
    }

    // Simple similarité basée sur les mots communs
    let bestMatch = categories[0];
    let bestScore = 0;

    for (const category of categories) {
      const score = this.calculateSimilarity(targetName.toLowerCase(), category.name.toLowerCase());
      if (score > bestScore) {
        bestScore = score;
        bestMatch = category;
      }
    }

    return bestMatch;
  }

  /**
   * Calcule la similarité entre deux chaînes
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }

  /**
   * Génère une couleur aléatoire pour les nouvelles catégories
   */
  private generateRandomColor(): string {
    const colors = [
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Détermine l'icône par défaut basée sur le nom de la catégorie
   */
  private getDefaultIcon(name: string): string {
    const iconMap: Record<string, string> = {
      'travail': '💼', 'work': '💼', 'bureau': '💼',
      'facture': '📄', 'bill': '📄', 'factures': '📄',
      'banque': '🏦', 'bank': '🏦', 'finance': '🏦',
      'voyage': '✈️', 'travel': '✈️', 'vacances': '✈️',
      'shopping': '🛍️', 'achat': '🛍️', 'commande': '🛍️',
      'sante': '🏥', 'health': '🏥', 'medecin': '🏥',
      'formation': '🎓', 'education': '🎓', 'cours': '🎓',
      'maison': '🏠', 'home': '🏠', 'immobilier': '🏠'
    };

    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return '📁'; // Icône par défaut
  }

  /**
   * Fallback intelligent en cas d'erreur
   */
  private getFallbackCategory(existingCategories: Category[]): ClassificationResult {
    if (existingCategories.length > 0) {
      // Chercher une catégorie "Publicité" en priorité (la plus probable pour les erreurs)
      const publiciteCategory = existingCategories.find(cat => 
        cat.name.toLowerCase().includes('publicité') || 
        cat.name.toLowerCase().includes('marketing')
      );
      
      if (publiciteCategory) {
        return {
          category_id: publiciteCategory.id,
          category_name: publiciteCategory.name,
          confidence: 0.5,
          auto_created: false,
          reasoning: 'Classification de secours - assigné à Publicité (catégorie la plus probable)'
        };
      }

      // Sinon chercher une catégorie générale
      const generalCategory = existingCategories.find(cat => 
        cat.name.toLowerCase().includes('personnel') || 
        cat.name.toLowerCase().includes('autre')
      ) || existingCategories[existingCategories.length - 1]; // Dernière catégorie au lieu de la première

      return {
        category_id: generalCategory.id,
        category_name: generalCategory.name,
        confidence: 0.3,
        auto_created: false,
        reasoning: 'Classification de secours appliquée'
      };
    }

    throw new Error('Aucune catégorie disponible pour le fallback');
  }

  /**
   * Traite les questions du chatbot avec limitation et réponses détaillées
   */
  async handleChatbotQuery(query: string, userId: string): Promise<ChatbotResponse> {
    try {
      console.log(`🤖 Question chatbot: "${query}"`);

      // Déterminer le type de question (simplifié)
      const isDetailed = query.length > 50 || query.includes('?');
      
      // TODO: Réintégrer les limites de questions
      const limitCheck = { allowed: true, remaining: 10 };

      if (!limitCheck.allowed) {
        return {
          message: `⏱️ Limite atteinte ! Trop de questions posées récemment.`,
          type: 'warning'
        };
      }

      // Récupérer les données utilisateur
      const [categoriesData, emailsData] = await Promise.all([
        this.getUserCategories(userId),
        this.getUserEmails(userId)
      ]);

      // Analyser la question avec OpenAI
      const response = await this.processChatbotQuery(query, categoriesData, emailsData, isDetailed);
      
      // TODO: Enregistrer la question posée
      // await chatbotLimiterService.recordQuestion(userId, isDetailed ? 'detailed' : 'quick');
      
      return response;

    } catch (error) {
      console.error('❌ Erreur chatbot:', error);
      return {
        message: "Désolé, je n'ai pas pu traiter votre question. Pouvez-vous reformuler ?",
        type: 'error'
      };
    }
  }

  /**
   * Traite la question avec OpenAI - réponses adaptées selon le type
   */
  private async processChatbotQuery(
    query: string, 
    categories: Category[], 
    emails: EmailWithCategory[],
    isDetailed: boolean = false
  ): Promise<ChatbotResponse> {
    
    const usedCategories = categories.filter(c => (c.emails_count || 0) > 0);
    
    // Préparer les données détaillées des emails pour les questions approfondies
    const emailSummaries = emails.slice(0, 10).map(email => {
      // Prioriser body_text, puis snippet, avec une longueur minimale décente
      let content = '';
      if (email.body_text && email.body_text.length > 10) {
        content = email.body_text;
      } else if (email.snippet && email.snippet.length > 10) {
        content = email.snippet;
      } else {
        content = `Email de ${email.sender_email} avec le sujet "${email.subject}"`;
      }
      
      // Garder plus de contenu pour les analyses détaillées
      const truncatedContent = content.length > 300 ? content.substring(0, 300) + '...' : content;
      
      return {
        subject: email.subject,
        sender: email.sender_email,
        date: new Date(email.received_at).toLocaleDateString('fr-FR'),
        isImportant: email.is_important,
        isRead: email.is_read,
        category: email.category?.name || 'Non classé',
        content: truncatedContent,
        hasAttachments: email.has_attachments || false
      };
    });

    // Prompt adapté selon le type de question
    const systemPrompt = isDetailed ? 
      this.getDetailedSystemPrompt(categories, emails) :
      this.getQuickSystemPrompt(categories, usedCategories, emails);

    const userContent = isDetailed ?
      this.buildDetailedUserContent(query, categories, emails, emailSummaries) :
      this.buildQuickUserContent(query, categories, usedCategories, emails);

    const maxTokens = isDetailed ? 200 : 75; // Divisé par 2 pour économiser

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modèle ultra-économique
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      max_tokens: maxTokens,
      temperature: 0.2, // Réduit pour plus de précision
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('Réponse vide de OpenAI');
    }

    return JSON.parse(response);
  }

  /**
   * Récupère les catégories de l'utilisateur avec statistiques détaillées
   */
  private async getUserCategories(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        emails_count:emails(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Calculer les statistiques des catégories
    const categories = data || [];
    
    return categories.map(cat => ({
      ...cat,
      emails_count: cat.emails_count || 0,
      is_used: (cat.emails_count || 0) > 0
    }));
  }

  /**
   * Récupère les expéditeurs les plus fréquents
   */
  private getTopSenders(emails: EmailWithCategory[], limit: number = 5) {
    const senderCounts = new Map<string, number>();
    
    emails.forEach(email => {
      const sender = email.sender_email;
      senderCounts.set(sender, (senderCounts.get(sender) || 0) + 1);
    });
    
    return Array.from(senderCounts.entries())
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Récupère les emails de l'utilisateur avec contenu complet
   */
  private async getUserEmails(userId: string): Promise<EmailWithCategory[]> {
    const { data, error } = await supabase
      .from('emails')
      .select(`
        id,
        subject,
        sender_email,
        sender_name,
        snippet,
        body_text,
        body_html,
        received_at,
        created_at,
        is_read,
        is_important,
        has_attachments,
        labels,
        category:categories(name, color, icon)
      `)
      .eq('user_id', userId)
      .order('received_at', { ascending: false })
      .limit(50); // Limiter à 50 emails récents pour de meilleures performances

    if (error) throw error;
    
    // Transformer les données pour correspondre à l'interface
    return (data || []).map(email => ({
      ...email,
      category: email.category?.[0] || undefined
    }));
  }

  /**
   * Prompt système pour questions détaillées
   */
  private getDetailedSystemPrompt(categories: Category[], emails: EmailWithCategory[]): string {
    return `Assistant email Ordo. Analyse détaillée avec exemples concrets obligatoires.

RÈGLES:
1. Citer emails réels (sujet, expéditeur)
2. Extraits de contenu
3. Format: 📧 **[Sujet]** de [Expéditeur] - [Résumé court]

DONNÉES: ${categories.length} catégories, ${emails.length} emails

JSON: {"type": "info|data|warning", "message": "analyse avec exemples"}`;
  }

  /**
   * Prompt système pour questions rapides
   */
  private getQuickSystemPrompt(categories: Category[], usedCategories: Category[], emails: EmailWithCategory[]): string {
    return `Assistant email Ordo. ${categories.length} catégories, ${emails.length} emails. Réponse courte. JSON: {"type":"info|data|warning","message":"réponse brève"}`;
  }

  /**
   * Vérifie si la question est liée aux emails
   */
  private isEmailRelatedQuery(query: string): boolean {
    const emailKeywords = [
      'email', 'mail', 'message', 'expéditeur', 'destinataire', 'objet',
      'catégorie', 'classer', 'répondre', 'envoyé', 'reçu', 'important',
      'lu', 'non lu', 'spam', 'indésirable', 'boîte', 'inbox',
      'combien', 'quand', 'qui', 'statistique', 'résumé', 'classification',
      'organiser', 'trier', 'chercher', 'recherche', 'analyse'
    ];
    
    const queryLower = query.toLowerCase();
    return emailKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Assistant conversationnel avec accès complet et autonomie totale
   */
  async getAdvancedEmailResponse(
    query: string, 
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
  ): Promise<{content: string, type: 'info' | 'data' | 'error' | 'success'}> {
    try {
      // Vérification du scope - LIMITATION AUX EMAILS UNIQUEMENT
      if (!this.isEmailRelatedQuery(query)) {
        return {
          content: '🎯 Je suis spécialisé dans la gestion d\'emails. Posez-moi une question sur vos emails, leur classification, vos statistiques ou l\'aide à la rédaction ! 📧',
          type: 'info'
        };
      }

      // Vérifier si OpenAI est disponible
      if (!this.openai) {
        return {
          content: '🔐 Assistant temporairement indisponible (problème de configuration OpenAI). Réessayez plus tard !',
          type: 'error'
        };
      }

      // Récupération des données utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          content: '🔐 Vous devez être connecté pour utiliser l\'assistant.',
          type: 'error'
        };
      }

      console.log(`🤖 Assistant autonome - Question: "${query}"`);

      // Récupération des catégories
      const { data: categories = [] } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      // Récupération des emails avec catégories (limite augmentée)
      const { data: emails = [], error: emailsError } = await supabase
        .from('emails')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .order('received_at', { ascending: false })
        .limit(150); // Plus d'emails pour analyse complète

      // Debug: Vérifier si on récupère bien les emails
      console.log(`📧 Emails récupérés: ${emails?.length || 0}`);
      if (emails && emails.length > 0) {
        console.log(`📧 Premier email: ${emails[0]?.subject || 'Sans sujet'}`);
        console.log(`📧 Catégorie premier email:`, emails[0]?.category);
      }
      if (emailsError) {
        console.error('❌ Erreur récupération emails:', emailsError);
      }

      // Debug: Vérifier les catégories
      console.log(`🏷️ Catégories récupérées: ${categories?.length || 0}`);
      if (categories && categories.length > 0) {
        console.log(`🏷️ Première catégorie: ${categories[0]?.name}`);
      }

      const systemPrompt = this.buildAutonomousSystemPrompt();
      const userContent = this.buildFullContextUserContent(query, categories || [], emails || []);

      // Messages avec historique complet pour continuité
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.slice(-8), // Historique plus long pour contexte
        { role: 'user' as const, content: userContent }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 800, // Limite généreuse pour réponses détaillées
        temperature: 0.4, // Créativité modérée
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const responseContent = completion.choices[0]?.message?.content || 'Je n\'ai pas pu traiter votre demande.';

      console.log(`✅ Réponse autonome générée: ${responseContent.length} caractères`);

      return {
        content: responseContent,
        type: 'success'
      };

    } catch (error) {
      console.error('❌ Erreur assistant autonome:', error);
      
      return {
        content: '❌ Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.',
        type: 'error'
      };
    }
  }

  /**
   * Contenu utilisateur pour questions détaillées
   */
  private buildDetailedUserContent(query: string, categories: Category[], emails: EmailWithCategory[], emailSummaries: EmailSummary[]): string {
    const importantEmails = emails.filter(e => e.is_important);
    const unreadEmails = emails.filter(e => !e.is_read);
    
    return `QUESTION: "${query}"

📊 STATS: ${emails.length} emails, ${unreadEmails.length} non lus, ${importantEmails.length} importants

📧 EMAILS:
${emailSummaries.slice(0, 5).map(email => // Limite à 5 emails pour économiser
  `• "${email.subject}" de ${email.sender} - ${email.category}${email.isImportant ? ' ⭐' : ''}${!email.isRead ? ' 🔵' : ''}
   💬 "${email.content.substring(0, 100)}..."` // Limite le contenu à 100 caractères
).join('\n')}

🏷️ CATÉGORIES: ${categories.map(cat => `${cat.name}: ${cat.emails_count || 0}`).join(', ')}`;
  }

  /**
   * Contenu utilisateur pour questions rapides
   */
  private buildQuickUserContent(query: string, categories: Category[], usedCategories: Category[], emails: EmailWithCategory[]): string {
    return `"${query}"

Données: ${categories.length} catégories (${usedCategories.length} utilisées), ${emails.length} emails, ${emails.filter(e => !e.is_read).length} non lus, ${emails.filter(e => e.is_important).length} importants.`;
  }

  /**
   * Prompt système pour assistant avec émojis et accès total aux emails
   */
  private buildAutonomousSystemPrompt(): string {
    return `Tu es un assistant email intelligent pour l'application Ordo avec un ACCÈS COMPLET à tous les emails de l'utilisateur. 

🎯 TES CAPACITÉS COMPLÈTES:
- Analyser et résumer tous les emails en détail
- Aider à rédiger des réponses personnalisées  
- Rechercher des informations spécifiques dans les emails
- Donner des statistiques détaillées sur les emails
- Proposer des exemples de réponses (quand demandé)
- Identifier les emails importants et urgents

📧 ACCÈS TOTAL AUX DONNÉES:
- Tu connais le contenu intégral de chaque email
- Tu peux analyser les expéditeurs, dates, sujets, corps
- Tu peux croiser les informations entre emails
- Tu as accès aux catégories, labels et métadonnées

💬 TON STYLE DE RÉPONSE:
- Réponds de manière naturelle et conversationnelle
- Utilise BEAUCOUP d'emojis pour illustrer tes réponses (📧 📝 📊 ⭐ 🔍 💡 🎯 📅 👥 ✅ ❌ 🚀 💯 📈 📋 🔥 ⚡ 🎉 etc.)
- Sois précis mais expressif avec les émojis
- Structure tes réponses avec des emojis pour chaque section
- Utilise des emojis spécifiques selon le contexte :
  • 📧 pour les emails
  • 📝 pour la rédaction
  • 📊 pour les statistiques  
  • ⭐ pour l'important
  • 🔍 pour les recherches
  • 💡 pour les conseils
  • 🎯 pour les priorités
  • 📅 pour les dates
  • 👥 pour les expéditeurs
  • ✅ pour les actions accomplies
  • 🚀 pour les suggestions d'amélioration

⚖️ ÉQUILIBRE:
- Minimum 200 caractères, maximum 1000 caractères
- Réponds précisément à la question avec des émojis expressifs
- Pour un salut simple, réponds avec des émojis sympas
- Adapte la longueur selon la complexité de la demande

🚀 AUTONOMIE TOTALE:
- Accès complet aux données emails
- Traite directement les demandes
- Utilise toutes les informations disponibles`;
  }

  /**
   * Contenu utilisateur avec contexte complet des emails
   */
  private buildFullContextUserContent(query: string, categories: Category[], emails: EmailWithCategory[]): string {
    const recentEmails = emails.slice(0, 15); // Plus d'emails pour l'analyse
    const unreadCount = emails.filter(e => !e.is_read).length;
    const importantCount = emails.filter(e => e.is_important).length;
    
    // Pour les salutations simples
    if (query.toLowerCase().includes('salut') || query.toLowerCase().includes('bonjour') || query.toLowerCase().includes('hello')) {
      return `Question: "${query}"

📊 Contexte rapide: Tu as accès à ${emails.length} emails (${unreadCount} non lus, ${importantCount} importants)
Réponds avec des émojis sympas !`;
    }

    // Statistiques par catégorie
    const categoryStats = categories.map(cat => {
      const emailsInCat = emails.filter(e => e.category?.name === cat.name);
      return `${cat.name}: ${emailsInCat.length}`;
    });

    return `❓ Question: "${query}"

📊 STATISTIQUES COMPLÈTES:
- Total: ${emails.length} emails
- Non lus: ${unreadCount} emails  
- Importants: ${importantCount} emails
- Catégories: ${categories.length}

📧 EMAILS RÉCENTS (${recentEmails.length}):
${recentEmails.map((email, i) => {
  const preview = email.body_text || email.snippet || '';
  return `${i+1}. 📧 "${email.subject || 'Sans sujet'}"
   👤 ${email.sender_name || email.sender_email}
   📅 ${new Date(email.received_at).toLocaleDateString('fr-FR')}
   📂 ${email.category?.name || 'Non classé'}
   ${email.is_important ? '⭐ Important' : ''}${!email.is_read ? ' 🔵 Non lu' : ' ✅ Lu'}
   ${preview ? `💬 "${preview.substring(0, 100)}..."` : ''}`;
}).join('\n\n')}

🏷️ CATÉGORIES: ${categoryStats.join(' | ')}

🎯 Utilise toutes ces informations pour répondre avec des émojis expressifs !`;
  }
}

// Instance singleton
export const openaiService = new OpenAIService();
export default OpenAIService;
