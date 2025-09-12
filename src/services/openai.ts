import OpenAI from 'openai';
import { supabase } from '../lib/supabase';
import type { ProcessedEmail } from './gmail';
import type { Category } from './classification';
// import { chatbotLimiterService } from './chatbotLimiter';

interface EmailContext {
  id: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  received_at: string;
  body_text?: string;
  snippet?: string;
  is_read: boolean;
  is_important: boolean;
  category?: string;
  labels?: string[];
  attachments?: unknown[];
}

interface ConversationMessage {
  content: string;
  isUser: boolean;
}

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
  private openai: OpenAI;
  private readonly MAX_CATEGORIES = 8;
  private readonly MIN_CATEGORIES = 1;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey.length < 50) {
      console.warn('⚠️ Clé API OpenAI manquante ou incorrecte - Assistant désactivé temporairement');
      // Créer un client factice pour éviter les erreurs
      this.openai = null as any;
      return;
    }
    
    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Pour utilisation côté client
      });
    } catch (error) {
      console.warn('⚠️ Erreur initialisation OpenAI:', error);
      this.openai = null as any;
    }
  }

  /**
   * Classifie un email en utilisant GPT-4o-mini (modèle ultra-économique)
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
      const categoryCount = existingCategories.length;

      const prompt = this.buildClassificationPrompt(email, existingCategoryNames, categoryCount);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Modèle ultra-économique (60x moins cher que GPT-4)
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant expert en classification d\'emails. Tu dois analyser un email et déterminer sa catégorie la plus appropriée.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100, // Divisé par 2 pour économiser
        temperature: 0.1, // Faible pour des résultats plus déterministes
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('Réponse vide de OpenAI');
      }

      const result = JSON.parse(response);
      console.log('📊 Résultat de classification:', result);

      return await this.processClassificationResult(result, existingCategories);

    } catch (error) {
      console.error('❌ Erreur lors de la classification OpenAI:', error);
      // Fallback vers une catégorie par défaut
      return this.getFallbackCategory(existingCategories);
    }
  }

  /**
   * Construit le prompt pour la classification
   */
  private buildClassificationPrompt(email: ProcessedEmail, existingCategories: string[], categoryCount: number): string {
    return `Email:
Expéditeur: ${email.sender_email}
Sujet: ${email.subject}
Contenu: ${email.snippet}

RÈGLES SPÉCIALES DE CLASSIFICATION PROFESSIONNELLE :

1. **Alertes d'emploi automatiques** → "Offres d'emploi" :
   - HelloWork, Indeed, LinkedIn Job Alerts, Pôle Emploi
   - Sujets : "offre", "poste", "candidature", "job alert", "emploi", "recrutement"
   - Expéditeurs : noreply@, jobs@, alerts@, notifications@

2. **Vrais emails professionnels** → "Travail" :
   - Emails de vraies personnes (prénom.nom@entreprise.com)
   - Communications directes avec collègues, clients, partenaires
   - Emails personnalisés avec contexte spécifique

3. **Notifications LinkedIn non-emploi** → "Réseaux sociaux" :
   - Suggestions d'amis, demandes de connexion
   - Notifications d'activité, likes, commentaires

4. **Emails promotionnels** → "Promotions" :
   - Newsletters, offres commerciales, marketing

Catégories: ${existingCategories.join(', ') || 'Aucune'}

${categoryCount >= this.MAX_CATEGORIES ? 
  'LIMITE: Utilise catégorie existante uniquement.' : 
  'Peut créer nouvelle catégorie (max 8).'}

JSON: {"category_name":"nom","use_existing":true/false,"confidence":0.0-1.0,"reasoning":"court"}`;
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
   * Fallback en cas d'erreur
   */
  private getFallbackCategory(existingCategories: Category[]): ClassificationResult {
    if (existingCategories.length > 0) {
      const generalCategory = existingCategories.find(cat => 
        cat.name.toLowerCase().includes('général') || 
        cat.name.toLowerCase().includes('autre')
      ) || existingCategories[0];

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
   * Assistant conversationnel avec accès complet et autonomie totale
   */
  async getAdvancedEmailResponse(
    query: string, 
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
  ): Promise<{content: string, type: 'info' | 'data' | 'error' | 'success'}> {
    try {
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
