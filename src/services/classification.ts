import * as stopword from 'stopword';
import { supabase } from '../lib/supabase';
import type { ProcessedEmail } from './gmail';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  is_auto_generated?: boolean;
  is_default?: boolean;
  description?: string;
  keywords?: string[];
}

export interface ClassificationResult {
  category_id: string;
  confidence: number;
  suggested_categories?: Category[];
}

interface EmailFeatures {
  words: string[];
  senderDomain: string;
  hasAttachments: boolean;
  isImportant: boolean;
  wordCount: number;
  uniqueWords: Set<string>;
}

class ClassificationService {
  // Patterns de base pour la classification automatique
  private readonly categoryPatterns = {
    'Factures': {
      keywords: ['facture', 'invoice', 'bill', 'payment', 'montant', 'payé', 'payer', 'échéance', 'edf', 'gdf', 'orange', 'sfr', 'free', 'bouygues'],
      senderPatterns: ['noreply', 'facturation', 'billing', 'no-reply'],
      color: '#ef4444',
      icon: '📄'
    },
    'Banque': {
      keywords: ['banque', 'bank', 'compte', 'virement', 'carte', 'crédit', 'débit', 'solde', 'relevé', 'iban', 'transaction'],
      senderPatterns: ['banque', 'bank', 'credit', 'agricole', 'bnp', 'societe', 'generale', 'lcl', 'cic'],
      color: '#10b981',
      icon: '🏦'
    },
    'Travail': {
      keywords: ['réunion', 'meeting', 'projet', 'équipe', 'deadline', 'rapport', 'présentation', 'tâche', 'mission', 'client'],
      senderPatterns: ['hr', 'rh', 'manager', 'chef', 'direction', 'entreprise', 'societe', 'inc', 'ltd', 'corp'],
      color: '#f59e0b',
      icon: '💼'
    },
    'Voyages': {
      keywords: ['vol', 'avion', 'train', 'hôtel', 'réservation', 'booking', 'voyage', 'vacation', 'billet', 'ticket', 'sncf', 'air'],
      senderPatterns: ['booking', 'airbnb', 'hotels', 'sncf', 'air', 'ryanair', 'easyjet', 'voyage'],
      color: '#3b82f6',
      icon: '✈️'
    },
    'Shopping': {
      keywords: ['commande', 'livraison', 'expédition', 'amazon', 'achat', 'produit', 'article', 'promotion', 'soldes', 'reduction'],
      senderPatterns: ['amazon', 'ebay', 'zalando', 'fnac', 'cdiscount', 'shop', 'store', 'boutique'],
      color: '#8b5cf6',
      icon: '🛍️'
    },
    'Newsletter': {
      keywords: ['newsletter', 'abonnement', 'unsubscribe', 'désabonner', 'actualités', 'news', 'hebdomadaire', 'mensuel'],
      senderPatterns: ['newsletter', 'news', 'noreply', 'info', 'marketing'],
      color: '#6b7280',
      icon: '📰'
    },
    'Sécurité': {
      keywords: ['sécurité', 'security', 'mot de passe', 'password', 'connexion', 'login', 'compte', 'verification', 'code'],
      senderPatterns: ['security', 'noreply', 'no-reply', 'admin', 'support'],
      color: '#dc2626',
      icon: '🔒'
    },
    'Social': {
      keywords: ['anniversaire', 'invitation', 'fête', 'event', 'événement', 'rencontre', 'sortie', 'ami', 'famille'],
      senderPatterns: ['gmail', 'yahoo', 'hotmail', 'outlook', 'free', 'orange'],
      color: '#ec4899',
      icon: '👥'
    }
  };

  async classifyEmail(email: ProcessedEmail, existingCategories: Category[]): Promise<ClassificationResult> {
    try {
      console.log(`Classification de l'email: "${email.subject}"`);
      
      // Extraire les caractéristiques de l'email
      const features = this.extractFeatures(email);
      
      // Calculer les scores pour chaque catégorie existante
      const categoryScores = existingCategories.map(category => ({
        category,
        score: this.calculateCategoryScore(features, category, email)
      }));
      
      // Calculer les scores pour les catégories automatiques
      const autoScores = Object.entries(this.categoryPatterns).map(([name, pattern]) => ({
        category: {
          id: 'auto_' + name.toLowerCase(),
          name,
          color: pattern.color,
          icon: pattern.icon,
          is_auto_generated: true
        } as Category,
        score: this.calculatePatternScore(features, pattern, email)
      }));
      
      // Combiner tous les scores
      const allScores = [...categoryScores, ...autoScores].sort((a, b) => b.score - a.score);
      
      const bestMatch = allScores[0];
      
      if (bestMatch.score > 0.3) {
        console.log(`Email classé dans "${bestMatch.category.name}" avec un score de ${bestMatch.score.toFixed(2)}`);
        
        return {
          category_id: bestMatch.category.id,
          confidence: bestMatch.score,
          suggested_categories: allScores.slice(0, 3).map(s => s.category)
        };
      }
      
      // Si aucune catégorie ne correspond suffisamment, suggérer les meilleures correspondances
      console.log(`Aucune catégorie trouvée avec assez de confiance. Meilleur score: ${bestMatch.score.toFixed(2)}`);
      
      return {
        category_id: 'uncategorized',
        confidence: 0,
        suggested_categories: allScores.slice(0, 3).map(s => s.category)
      };
      
    } catch (error) {
      console.error('Erreur lors de la classification:', error);
      return {
        category_id: 'uncategorized',
        confidence: 0
      };
    }
  }

  private extractFeatures(email: ProcessedEmail): EmailFeatures {
    // Nettoyer et tokeniser le texte
    const fullText = `${email.subject} ${email.body_text} ${email.sender}`.toLowerCase();
    const words = this.tokenize(fullText);
    
    // Supprimer les mots vides
    const filteredWords = stopword.removeStopwords(words, stopword.fra).concat(
      stopword.removeStopwords(words, stopword.eng)
    );
    
    return {
      words: filteredWords,
      senderDomain: email.sender_email.split('@')[1] || '',
      hasAttachments: false, // TODO: implémenter la détection des pièces jointes
      isImportant: email.is_important,
      wordCount: words.length,
      uniqueWords: new Set(filteredWords)
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remplacer la ponctuation par des espaces
      .split(/\s+/)
      .filter(word => word.length > 2); // Garder seulement les mots de plus de 2 caractères
  }

  private calculateCategoryScore(features: EmailFeatures, category: Category, email: ProcessedEmail): number {
    let score = 0;
    
    // Si la catégorie a des mots-clés définis (par l'utilisateur)
    if (category.keywords && category.keywords.length > 0) {
      const keywordMatches = category.keywords.filter(keyword => 
        features.words.includes(keyword.toLowerCase()) ||
        email.subject.toLowerCase().includes(keyword.toLowerCase()) ||
        email.sender.toLowerCase().includes(keyword.toLowerCase())
      );
      
      score += (keywordMatches.length / category.keywords.length) * 0.8;
    }
    
    // Bonus pour correspondance du nom de catégorie
    if (features.words.includes(category.name.toLowerCase())) {
      score += 0.4;
    }
    
    return Math.min(score, 1.0);
  }

  private calculatePatternScore(features: EmailFeatures, pattern: typeof this.categoryPatterns[keyof typeof this.categoryPatterns], email: ProcessedEmail): number {
    let score = 0;
    
    // Score basé sur les mots-clés
    const keywordMatches = pattern.keywords.filter(keyword => 
      features.words.includes(keyword.toLowerCase()) ||
      email.subject.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (keywordMatches.length > 0) {
      score += (keywordMatches.length / pattern.keywords.length) * 0.6;
    }
    
    // Score basé sur l'expéditeur
    const senderMatches = pattern.senderPatterns.filter(pattern => 
      features.senderDomain.includes(pattern.toLowerCase()) ||
      email.sender_email.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (senderMatches.length > 0) {
      score += 0.4;
    }
    
    // Bonus pour emails importants dans certaines catégories
    if (email.is_important && ['Travail', 'Banque', 'Sécurité'].includes(pattern.keywords[0])) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  async createCategoryIfNotExists(categoryName: string, userId: string): Promise<Category> {
    try {
      // Vérifier si la catégorie existe déjà
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('name', categoryName)
        .maybeSingle();
      
      if (existingCategory) {
        return existingCategory;
      }
      
      // Créer la nouvelle catégorie
      const pattern = this.categoryPatterns[categoryName as keyof typeof this.categoryPatterns];
      
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: categoryName,
          color: pattern?.color || '#6b7280',
          icon: pattern?.icon || '📁',
          is_auto_generated: true
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log(`Nouvelle catégorie créée: ${categoryName}`);
      return newCategory;
      
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      throw error;
    }
  }

  async suggestCategories(emails: ProcessedEmail[]): Promise<string[]> {
    // Analyser tous les emails pour suggérer des catégories pertinentes
    const wordFrequency = new Map<string, number>();
    const senderDomains = new Set<string>();
    
    emails.forEach(email => {
      const features = this.extractFeatures(email);
      
      // Compter la fréquence des mots
      features.words.forEach(word => {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      });
      
      // Collecter les domaines d'expéditeurs
      senderDomains.add(features.senderDomain);
    });
    
    // Identifier les catégories les plus pertinentes
    const suggestedCategories = new Set<string>();
    
    Object.entries(this.categoryPatterns).forEach(([categoryName, pattern]) => {
      const relevanceScore = pattern.keywords.reduce((score, keyword) => {
        return score + (wordFrequency.get(keyword.toLowerCase()) || 0);
      }, 0);
      
      if (relevanceScore > 2) { // Seuil minimum
        suggestedCategories.add(categoryName);
      }
    });
    
    return Array.from(suggestedCategories);
  }

  getDefaultCategories(): Array<{ name: string; color: string; icon: string }> {
    return Object.entries(this.categoryPatterns).map(([name, pattern]) => ({
      name,
      color: pattern.color,
      icon: pattern.icon
    }));
  }
}

export const classificationService = new ClassificationService();
