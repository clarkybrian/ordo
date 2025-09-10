import OpenAI from 'openai';
import { supabase } from '../lib/supabase';
import type { ProcessedEmail } from './gmail';
import type { Category } from './classification';

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

interface EmailWithCategory {
  id: string;
  subject: string;
  sender_email: string;
  snippet: string;
  received_at: string;
  created_at: string;
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
    if (!apiKey) {
      throw new Error('Clé API OpenAI manquante dans les variables d\'environnement');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Pour utilisation côté client
    });
  }

  /**
   * Classifie un email en utilisant GPT-3.5-turbo (modèle léger et économique)
   */
  async classifyEmail(email: ProcessedEmail, existingCategories: Category[]): Promise<ClassificationResult> {
    try {
      console.log(`🤖 Classification OpenAI de l'email: "${email.subject}"`);

      const existingCategoryNames = existingCategories.map(cat => cat.name);
      const categoryCount = existingCategories.length;

      const prompt = this.buildClassificationPrompt(email, existingCategoryNames, categoryCount);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Modèle économique et rapide
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
        max_tokens: 200,
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
    return `
Analyse cet email et détermine sa catégorie :

**EMAIL:**
- Expéditeur: ${email.sender_email}
- Sujet: ${email.subject}
- Contenu: ${email.snippet}
- Corps: ${email.body_text.substring(0, 500)}

**CATÉGORIES EXISTANTES:** ${existingCategories.length > 0 ? existingCategories.join(', ') : 'Aucune'}

**RÈGLES:**
1. ${categoryCount >= this.MAX_CATEGORIES ? 
    'LIMITE ATTEINTE: Tu dois utiliser une catégorie existante uniquement.' : 
    'Tu peux créer une nouvelle catégorie si nécessaire (max 8 au total).'}
2. Privilégie les catégories existantes quand c'est pertinent
3. Les nouvelles catégories doivent être génériques et réutilisables
4. Utilise des noms simples et clairs (ex: "Travail", "Factures", "Banque")

**RÉPONSE REQUISE (JSON):**
{
  "category_name": "nom de la catégorie",
  "use_existing": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "explication courte de ton choix"
}

Si aucune catégorie existante ne convient et que la limite est atteinte, utilise la plus proche.`;
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
   * Traite les questions du chatbot
   */
  async handleChatbotQuery(query: string, userId: string): Promise<ChatbotResponse> {
    try {
      console.log(`🤖 Question chatbot: "${query}"`);

      // Récupérer les données utilisateur
      const [categoriesData, emailsData] = await Promise.all([
        this.getUserCategories(userId),
        this.getUserEmails(userId)
      ]);

      // Analyser la question avec OpenAI
      const response = await this.processChatbotQuery(query, categoriesData, emailsData);
      
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
   * Traite la question avec OpenAI
   */
  private async processChatbotQuery(
    query: string, 
    categories: Category[], 
    emails: EmailWithCategory[]
  ): Promise<ChatbotResponse> {
    
    const systemPrompt = `Tu es un assistant intelligent qui aide à gérer les emails classifiés.
    
DONNÉES DISPONIBLES:
- ${categories.length} catégories: ${categories.map(c => c.name).join(', ')}
- ${emails.length} emails classifiés
- Informations sur les emails et leurs catégories

TYPES DE QUESTIONS QUE TU PEUX TRAITER:
1. Statistiques (nombre de catégories, emails, etc.)
2. Recherche d'emails par contenu, expéditeur, catégorie
3. Informations sur les catégories
4. Analyses des emails

RÉPONSE REQUISE (JSON):
{
  "type": "info|data|warning|error",
  "message": "réponse en français naturel",
  "data": "données optionnelles si pertinent"
}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Question: "${query}"
          
          Contexte:
          - Catégories (${categories.length}): ${categories.map(c => `${c.name} (${c.emails_count || 0} emails)`).join(', ')}
          - Total emails: ${emails.length}
          - Dernière synchronisation: ${emails.length > 0 ? new Date(emails[0]?.created_at).toLocaleString('fr-FR') : 'Aucune'}`
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('Réponse vide de OpenAI');
    }

    return JSON.parse(response);
  }

  /**
   * Récupère les catégories de l'utilisateur
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
    return data || [];
  }

  /**
   * Récupère les emails de l'utilisateur
   */
  private async getUserEmails(userId: string): Promise<EmailWithCategory[]> {
    const { data, error } = await supabase
      .from('emails')
      .select(`
        *,
        category:categories(name, color, icon)
      `)
      .eq('user_id', userId)
      .order('received_at', { ascending: false })
      .limit(100); // Limiter pour éviter les réponses trop lourdes

    if (error) throw error;
    return data || [];
  }
}

// Instance singleton
export const openaiService = new OpenAIService();
export default OpenAIService;
