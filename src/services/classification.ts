/* eslint-disable @typescript-eslint/no-explicit-any */
// Classification simplifiée pour le navigateur
let natural: any = null;
let stopword: any = null;
let stemmer: any = null;

// Chargement conditionnel des bibliothèques ML
if (typeof window === 'undefined') {
  // Code serveur - charger les vraies bibliothèques
  try {
    natural = eval('require')('natural');
    stopword = eval('require')('stopword');
    stemmer = eval('require')('stemmer').stemmer;
  } catch (error) {
    console.warn('Bibliothèques ML non disponibles:', error);
  }
} else {
  // Code navigateur - utiliser des implémentations simplifiées
  natural = {
    TfIdf: class MockTfIdf {
      addDocument() {}
      tfidfs() { return []; }
      static tf() { return 0; }
    },
    WordTokenizer: class MockTokenizer {
      trim(array: string[]) { return array; }
      tokenize(text: string) {
        return text.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      }
    }
  } as any;
  
  stopword = {
    removeStopwords: (tokens: string[]) => {
      const frenchStopwords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par'];
      return tokens.filter(token => !frenchStopwords.includes(token.toLowerCase()));
    },
    fra: []
  } as any;
  
  stemmer = (word: string) => {
    // Stemming simplifié pour le français
    return word.toLowerCase()
      .replace(/s$/, '')
      .replace(/ment$/, '')
      .replace(/tion$/, '')
      .replace(/eur$/, '')
      .replace(/euse$/, '');
  };
}

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
  emails_count?: number;
}

export interface ClassificationResult {
  category_id: string;
  confidence: number;
  suggested_categories?: Category[];
  auto_created?: boolean;
}

interface EmailFeatures {
  words: string[];
  stems: string[];
  entities: string[];
  senderDomain: string;
  hasAttachments: boolean;
  isImportant: boolean;
  wordCount: number;
  uniqueWords: Set<string>;
  tfidf: number[];
  topics: string[];
}

interface CategoryPattern {
  keywords: string[];
  senderPatterns: string[];
  color: string;
  icon: string;
  weight: number;
}

class AdvancedClassificationService {
  private tokenizer: any;
  private tfidf: any;
  private classifier: any = null;
  private categoryVectors: Map<string, number[]> = new Map();
  
  // Patterns améliorés avec des poids pour la précision
  private readonly categoryPatterns: Record<string, CategoryPattern> = {
    'Factures': {
      keywords: ['facture', 'invoice', 'bill', 'payment', 'paiement', 'montant', 'payé', 'payer', 'échéance', 'edf', 'gdf', 'orange', 'sfr', 'free', 'bouygues', 'électricité', 'gaz', 'internet', 'mobile', 'téléphone', 'abonnement', 'forfait', 'renouvellement'],
      senderPatterns: ['noreply', 'facturation', 'billing', 'no-reply', 'service.client', 'edf', 'engie', 'orange', 'sfr', 'bouygues', 'free', 'clients'],
      color: '#ef4444',
      icon: '📄',
      weight: 1.0
    },
    'Banque': {
      keywords: ['banque', 'bank', 'compte', 'virement', 'carte', 'crédit', 'débit', 'solde', 'relevé', 'iban', 'transaction', 'prélèvement', 'versement', 'cotisation', 'découvert', 'épargne', 'livret', 'assurance', 'crédit', 'emprunt'],
      senderPatterns: ['banque', 'bank', 'credit', 'agricole', 'bnp', 'societe', 'generale', 'lcl', 'cic', 'caisse', 'epargne', 'bred', 'banquepopulaire', 'hsbc', 'ing'],
      color: '#10b981',
      icon: '🏦',
      weight: 1.0
    },
    'Travail': {
      keywords: ['réunion', 'meeting', 'projet', 'équipe', 'deadline', 'rapport', 'présentation', 'tâche', 'mission', 'client', 'collègue', 'manager', 'rh', 'recrutement', 'embauche', 'candidature', 'entretien', 'salaire', 'contrat', 'bureau'],
      senderPatterns: ['hr', 'rh', 'manager', 'chef', 'direction', 'entreprise', 'societe', 'inc', 'ltd', 'corp', 'company', 'group', 'team'],
      color: '#f59e0b',
      icon: '💼',
      weight: 1.0
    },
    'E-commerce': {
      keywords: ['commande', 'livraison', 'expédition', 'amazon', 'achat', 'produit', 'article', 'promotion', 'soldes', 'reduction', 'colis', 'suivi', 'retour', 'remboursement', 'panier', 'checkout', 'stock'],
      senderPatterns: ['amazon', 'ebay', 'zalando', 'fnac', 'cdiscount', 'shop', 'store', 'boutique', 'marketplace', 'vente', 'alibaba', 'aliexpress'],
      color: '#8b5cf6',
      icon: '🛍️',
      weight: 1.0
    },
    'Voyages': {
      keywords: ['vol', 'avion', 'train', 'hôtel', 'réservation', 'booking', 'voyage', 'vacation', 'billet', 'ticket', 'sncf', 'air', 'vacances', 'séjour', 'transport', 'destination', 'itinéraire', 'check-in'],
      senderPatterns: ['booking', 'airbnb', 'hotels', 'sncf', 'air', 'ryanair', 'easyjet', 'voyage', 'travel', 'trip', 'expedia', 'skyscanner'],
      color: '#3b82f6',
      icon: '✈️',
      weight: 1.0
    },
    'Newsletter': {
      keywords: ['newsletter', 'abonnement', 'unsubscribe', 'désabonner', 'actualités', 'news', 'hebdomadaire', 'mensuel', 'information', 'bulletin', 'digest', 'update'],
      senderPatterns: ['newsletter', 'news', 'noreply', 'info', 'marketing', 'communication', 'media', 'magazine', 'journal'],
      color: '#6b7280',
      icon: '📰',
      weight: 0.8
    },
    'Sécurité': {
      keywords: ['sécurité', 'security', 'mot de passe', 'password', 'connexion', 'login', 'compte', 'verification', 'code', 'authentification', 'suspicious', 'alerte', 'piratage', 'phishing'],
      senderPatterns: ['security', 'noreply', 'no-reply', 'admin', 'support', 'alert', 'notification'],
      color: '#dc2626',
      icon: '🔒',
      weight: 1.2
    },
    'Formation': {
      keywords: ['formation', 'cours', 'université', 'école', 'éducation', 'apprentissage', 'certification', 'diplôme', 'étudiant', 'enseignement', 'mooc', 'webinar', 'tutorial'],
      senderPatterns: ['univ', 'education', 'school', 'formation', 'learning', 'academy', 'coursera', 'udemy'],
      color: '#06b6d4',
      icon: '🎓',
      weight: 1.0
    },
    'Santé': {
      keywords: ['médecin', 'docteur', 'hôpital', 'clinique', 'rendez-vous', 'consultation', 'ordonnance', 'pharmacie', 'mutuelle', 'sécurité sociale', 'médicament', 'traitement'],
      senderPatterns: ['medical', 'sante', 'hopital', 'clinique', 'mutuelle', 'secu', 'ameli', 'pharmacie'],
      color: '#84cc16',
      icon: '🏥',
      weight: 1.0
    },
    'Immobilier': {
      keywords: ['appartement', 'maison', 'location', 'achat', 'vente', 'loyer', 'agence', 'immobilier', 'bail', 'propriétaire', 'logement', 'studio', 'villa'],
      senderPatterns: ['immobilier', 'agence', 'location', 'leboncoin', 'seloger', 'pap', 'orpi', 'century21'],
      color: '#f97316',
      icon: '🏠',
      weight: 1.0
    }
  };

  constructor() {
    if (natural && natural.WordTokenizer && natural.TfIdf) {
      if (natural) {
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
      }
    } else {
      // Fallback pour le navigateur
      if (natural) {
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
      }
    }
    
    // Initialiser le classificateur
    this.initializeClassifier();
  }

  private async initializeClassifier(): Promise<void> {
    try {
      // Charger des données d'entraînement existantes si disponibles
      await this.loadTrainingData();
      console.log('✅ Classificateur ML initialisé');
    } catch {
      console.log('⚠️ Aucune donnée d\'entraînement trouvée, utilisation des patterns prédéfinis');
    }
  }

  async classifyEmail(email: ProcessedEmail, existingCategories: Category[]): Promise<ClassificationResult> {
    try {
      console.log(`🔍 Classification avancée de l'email: "${email.subject}"`);
      
      // Extraire des caractéristiques avancées
      const features = await this.extractAdvancedFeatures(email);
      
      // 1. Essayer la classification ML si disponible
      if (this.classifier) {
        const mlResult = await this.classifyWithML(features, existingCategories);
        if (mlResult.confidence > 0.7) {
          return mlResult;
        }
      }

      // 2. Classification basée sur les patterns avec scoring avancé
      const patternResult = await this.classifyWithPatterns(features, email, existingCategories);
      if (patternResult.confidence > 0.3) {
        return patternResult;
      }

      // 3. Détection automatique de nouvelle catégorie
      const autoCategory = await this.detectAndCreateCategory(features, existingCategories);
      if (autoCategory) {
        return {
          category_id: autoCategory.id,
          confidence: 0.6,
          auto_created: true,
          suggested_categories: [autoCategory]
        };
      }

      // 4. Fallback vers "Non classés"
      return await this.fallbackToUnclassified(existingCategories);

    } catch (error) {
      console.error('❌ Erreur classification:', error);
      return await this.fallbackToUnclassified(existingCategories);
    }
  }

  private async extractAdvancedFeatures(email: ProcessedEmail): Promise<EmailFeatures> {
    const text = `${email.subject} ${email.body_text}`.toLowerCase();
    
    // Tokenisation avancée
    const tokens = this.tokenizer.tokenize(text) || [];
    const cleanTokens = stopword ? stopword.removeStopwords(tokens) : tokens;
    
    // Stemming
    const stems = cleanTokens.map((token: string) => stemmer ? stemmer(token) : token);
    
    // Extraction d'entités avec Compromise (version simplifiée)
    const entities = this.extractSimpleEntities(text);

    // Extraction de domaine
    const senderDomain = email.sender_email.split('@')[1] || '';
    
    // Analyse TF-IDF
    this.tfidf.addDocument(cleanTokens);
    const tfidfVector = this.calculateTfIdfVector(cleanTokens);
    
    // Détection de sujets
    const topics = this.extractTopics(cleanTokens);

    return {
      words: cleanTokens,
      stems,
      entities,
      senderDomain,
      hasAttachments: false, // Sera implémenté plus tard
      isImportant: email.is_important || false,
      wordCount: cleanTokens.length,
      uniqueWords: new Set(cleanTokens),
      tfidf: tfidfVector,
      topics
    };
  }

  private extractSimpleEntities(text: string): string[] {
    // Extraction d'entités simplifiée sans Compromise
    const entities: string[] = [];
    
    // Détection de noms de personnes (mots commençant par une majuscule)
    const words = text.split(/\s+/);
    words.forEach(word => {
      if (/^[A-ZÀ-Ÿ][a-zà-ÿ]+/.test(word) && word.length > 2) {
        entities.push(word);
      }
    });
    
    // Détection d'emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    entities.push(...emails);
    
    // Détection de montants
    const moneyRegex = /\b\d+[,.]?\d*\s*(?:€|EUR|dollars?|USD|\$)\b/gi;
    const amounts = text.match(moneyRegex) || [];
    entities.push(...amounts);
    
    return [...new Set(entities)];
  }

  private calculateTfIdfVector(tokens: string[]): number[] {
    const vocabulary = [...new Set(tokens)];
    const vector: number[] = [];
    
    vocabulary.forEach(term => {
      const tf = tokens.filter(token => token === term).length / tokens.length;
      // Simulation d'IDF simplifié
      const idf = Math.log(100 / (1 + Math.random() * 10)); // Approximation
      vector.push(tf * idf);
    });
    
    return vector;
  }

  private extractTopics(tokens: string[]): string[] {
    // Clustering simple des mots-clés pour identifier des sujets
    const topicClusters: Record<string, string[]> = {};
    
    Object.entries(this.categoryPatterns).forEach(([categoryName, pattern]) => {
      const relevantWords = tokens.filter(token => 
        pattern.keywords.some(keyword => 
          token.includes(keyword) || keyword.includes(token)
        )
      );
      
      if (relevantWords.length > 0) {
        topicClusters[categoryName] = relevantWords;
      }
    });

    return Object.keys(topicClusters);
  }

  private async classifyWithML(features: EmailFeatures, categories: Category[]): Promise<ClassificationResult> {
    // Classification ML basique (à améliorer avec plus de données)
    // Pour l'instant, utilise une approche basée sur la similarité cosinus
    
    let bestCategory: Category | null = null;
    let bestSimilarity = 0;

    for (const category of categories) {
      if (this.categoryVectors.has(category.id)) {
        const categoryVector = this.categoryVectors.get(category.id)!;
        const similarity = this.cosineSimilarity(features.tfidf, categoryVector);
        
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCategory = category;
        }
      }
    }

    return {
      category_id: bestCategory?.id || '',
      confidence: bestSimilarity,
      suggested_categories: bestCategory ? [bestCategory] : []
    };
  }

  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    const minLength = Math.min(vectorA.length, vectorB.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < minLength; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private async classifyWithPatterns(features: EmailFeatures, email: ProcessedEmail, categories: Category[]): Promise<ClassificationResult> {
    const scores: Array<{ category: Category | null, score: number, isPattern: boolean }> = [];

    // Scoring pour catégories existantes
    for (const category of categories) {
      const score = this.calculateCategoryScore(features, category, email);
      scores.push({ category, score, isPattern: false });
    }

    // Scoring pour patterns prédéfinis
    for (const [patternName, pattern] of Object.entries(this.categoryPatterns)) {
      const score = this.calculatePatternScore(features, pattern, email) * pattern.weight;
      const mockCategory: Category = {
        id: `pattern_${patternName.toLowerCase()}`,
        user_id: '',
        name: patternName,
        color: pattern.color,
        icon: pattern.icon,
        created_at: new Date().toISOString(),
        is_auto_generated: true
      };
      scores.push({ category: mockCategory, score, isPattern: true });
    }

    // Trier par score
    scores.sort((a, b) => b.score - a.score);
    const bestMatch = scores[0];

    if (bestMatch.score > 0.1) {
      console.log(`✅ Email classé dans "${bestMatch.category?.name}" (score: ${bestMatch.score.toFixed(3)})`);
      
      return {
        category_id: bestMatch.category?.id || '',
        confidence: bestMatch.score,
        suggested_categories: scores.slice(0, 3).map(s => s.category).filter(Boolean) as Category[]
      };
    }

    return {
      category_id: '',
      confidence: 0,
      suggested_categories: []
    };
  }

  private calculateCategoryScore(features: EmailFeatures, category: Category, email: ProcessedEmail): number {
    let score = 0;
    
    if (category.keywords && category.keywords.length > 0) {
      const keywordMatches = category.keywords.filter(keyword => 
        features.words.includes(keyword.toLowerCase()) ||
        email.subject.toLowerCase().includes(keyword.toLowerCase()) ||
        (stemmer && features.stems.includes(stemmer(keyword)))
      );
      
      score += (keywordMatches.length / category.keywords.length) * 0.8;
    }
    
    // Bonus pour correspondance du nom
    if (features.words.includes(category.name.toLowerCase())) {
      score += 0.4;
    }
    
    return Math.min(score, 1.0);
  }

  private calculatePatternScore(features: EmailFeatures, pattern: CategoryPattern, email: ProcessedEmail): number {
    let score = 0;
    
    // Score basé sur les mots-clés avec pondération TF-IDF
    const keywordMatches = pattern.keywords.filter(keyword => 
      features.words.includes(keyword.toLowerCase()) ||
      email.subject.toLowerCase().includes(keyword.toLowerCase()) ||
      email.body_text.toLowerCase().includes(keyword.toLowerCase()) ||
      (stemmer && features.stems.includes(stemmer(keyword)))
    );
    
    if (keywordMatches.length > 0) {
      const keywordScore = keywordMatches.length / Math.max(pattern.keywords.length, 1);
      score += keywordScore * 0.6;
      
      // Bonus pour mots-clés dans le sujet (plus important)
      const subjectMatches = pattern.keywords.filter(keyword => 
        email.subject.toLowerCase().includes(keyword.toLowerCase())
      );
      score += (subjectMatches.length / pattern.keywords.length) * 0.3;
    }
    
    // Score basé sur l'expéditeur
    const senderMatches = pattern.senderPatterns.filter(senderPattern => 
      features.senderDomain.includes(senderPattern.toLowerCase()) ||
      email.sender_email.toLowerCase().includes(senderPattern.toLowerCase()) ||
      email.sender.toLowerCase().includes(senderPattern.toLowerCase())
    );
    
    if (senderMatches.length > 0) {
      score += 0.4;
    }
    
    // Bonus pour entités nommées
    const entityMatches = features.entities.filter(entity =>
      pattern.keywords.some(keyword => 
        entity.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (entityMatches.length > 0) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  private async detectAndCreateCategory(features: EmailFeatures, existingCategories: Category[]): Promise<Category | null> {
    // Détection automatique basée sur les sujets et entités
    const potentialCategories = this.generateCategoryNames(features);
    
    for (const categoryName of potentialCategories) {
      // Vérifier si une catégorie similaire existe déjà
      const exists = existingCategories.some(cat => 
        cat.name.toLowerCase().includes(categoryName.toLowerCase()) ||
        categoryName.toLowerCase().includes(cat.name.toLowerCase())
      );
      
      if (!exists && categoryName.length > 2) {
        console.log(`🆕 Création automatique de catégorie: "${categoryName}"`);
        
        try {
          const newCategory = await this.createCategory(categoryName);
          return newCategory;
        } catch (error) {
          console.error('Erreur création catégorie auto:', error);
        }
      }
    }
    
    return null;
  }

  private generateCategoryNames(features: EmailFeatures): string[] {
    const suggestions: string[] = [];
    
    // Basé sur les entités nommées
    features.entities.forEach(entity => {
      if (entity.length > 3) {
        suggestions.push(entity);
      }
    });
    
    // Basé sur le domaine de l'expéditeur
    const domain = features.senderDomain;
    if (domain && !domain.includes('gmail') && !domain.includes('yahoo')) {
      const domainName = domain.split('.')[0];
      if (domainName.length > 3) {
        suggestions.push(domainName.charAt(0).toUpperCase() + domainName.slice(1));
      }
    }
    
    // Basé sur les mots fréquents
    const wordFreq: Record<string, number> = {};
    features.words.forEach(word => {
      if (word.length > 4) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    const frequentWords = Object.entries(wordFreq)
      .filter(([, freq]) => freq > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
    
    suggestions.push(...frequentWords);
    
    return [...new Set(suggestions)].slice(0, 5);
  }

  private async createCategory(name: string): Promise<Category> {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    const icons = ['📁', '📊', '🔗', '💡', '🎯', '⭐', '🔥'];
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name,
        color,
        icon,
        description: `Catégorie créée automatiquement`,
        is_auto_generated: true,
        is_default: false
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Catégorie "${name}" créée automatiquement`);
    return category;
  }

  private async fallbackToUnclassified(existingCategories: Category[]): Promise<ClassificationResult> {
    const unclassifiedCategory = existingCategories.find(cat => cat.name === 'Non classés') || {
      id: 'fallback_unclassified',
      name: 'Non classés',
      color: '#9ca3af',
      icon: '❓',
      user_id: '',
      created_at: new Date().toISOString(),
      is_auto_generated: true
    } as Category;
    
    return {
      category_id: unclassifiedCategory.id,
      confidence: 0.1,
      suggested_categories: [unclassifiedCategory]
    };
  }

  private async loadTrainingData(): Promise<void> {
    // Charger les données d'emails classifiés pour améliorer le modèle
    try {
      const { data: emails } = await supabase
        .from('emails')
        .select('*, category:categories(*)')
        .not('category_id', 'is', null)
        .limit(1000);

      if (emails && emails.length > 0) {
        // Construire des vecteurs pour chaque catégorie
        const categoryData: Record<string, number[][]> = {};
        
        for (const email of emails) {
          if (email.category) {
            const features = await this.extractAdvancedFeatures(email);
            
            if (!categoryData[email.category.id]) {
              categoryData[email.category.id] = [];
            }
            categoryData[email.category.id].push(features.tfidf);
          }
        }
        
        // Calculer les vecteurs moyens pour chaque catégorie
        Object.entries(categoryData).forEach(([categoryId, vectors]) => {
          if (vectors.length > 0) {
            const avgVector = this.calculateAverageVector(vectors);
            this.categoryVectors.set(categoryId, avgVector);
          }
        });
        
        console.log(`📚 Données d'entraînement chargées: ${Object.keys(categoryData).length} catégories`);
      }
    } catch (error) {
      console.log('⚠️ Impossible de charger les données d\'entraînement:', error);
    }
  }

  private calculateAverageVector(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];
    
    const maxLength = Math.max(...vectors.map(v => v.length));
    const avgVector: number[] = new Array(maxLength).fill(0);
    
    vectors.forEach(vector => {
      vector.forEach((value, index) => {
        avgVector[index] += value / vectors.length;
      });
    });
    
    return avgVector;
  }

  async createCategoryIfNotExists(categoryName: string, userId: string): Promise<Category> {
    const pattern = this.categoryPatterns[categoryName];
    if (!pattern) {
      throw new Error(`Pattern non trouvé pour la catégorie: ${categoryName}`);
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: categoryName,
        color: pattern.color,
        icon: pattern.icon,
        description: `Catégorie ${categoryName.toLowerCase()}`,
        is_default: true,
        is_auto_generated: true
      })
      .select()
      .single();

    if (error) throw error;
    return category;
  }

  getDefaultCategories(): Array<{ name: string; color: string; icon: string }> {
    return Object.entries(this.categoryPatterns).map(([name, pattern]) => ({
      name,
      color: pattern.color,
      icon: pattern.icon
    }));
  }
}

export const classificationService = new AdvancedClassificationService();
