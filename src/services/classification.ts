/* eslint-disable @typescript-eslint/no-explicit-any */
// Classification simplifiée pour le navigateur

let naturalLib: any = null;
let stopword: any = null;
let stemmer: any = null;

// Chargement conditionnel des bibliothèques ML
if (typeof window === 'undefined') {
  // Code serveur - charger les vraies bibliothèques
  try {
    naturalLib = eval('require')('natural');
    stopword = eval('require')('stopword');
    stemmer = eval('require')('stemmer').stemmer;
  } catch (error) {
    console.warn('Bibliothèques ML non disponibles:', error);
  }
} else {
  // Code navigateur - utiliser des implémentations simplifiées
  naturalLib = {
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
  
  // Patterns améliorés pour les 8 catégories UNIQUEMENT avec une meilleure séparation
  private readonly categoryPatterns: Record<string, CategoryPattern> = {
    'Banque': {
      keywords: ['banque', 'bank', 'compte', 'virement', 'carte', 'crédit', 'débit', 'solde', 'relevé', 'iban', 'transaction', 'prélèvement', 'versement', 'cotisation', 'découvert', 'épargne', 'livret', 'assurance', 'crédit', 'emprunt'],
      senderPatterns: ['banque', 'bank', 'credit', 'agricole', 'bnp', 'societe', 'generale', 'lcl', 'cic', 'caisse', 'epargne', 'bred', 'banquepopulaire', 'hsbc', 'ing'],
      color: '#10b981',
      icon: '🏦',
      weight: 1.0
    },
    'Personnel': {
      keywords: ['famille', 'ami', 'personnel', 'privé', 'invitation', 'anniversaire', 'mariage', 'vacances', 'weekend', 'soirée', 'rendez-vous', 'merci', 'salut', 'bisous', 'bises', 'cordialement', 'amicalement', 'cher', 'chère', 'bonjour', 'bonsoir', 'comment vas-tu', 'j\'espère que tu vas bien', 'des nouvelles', 'prendre contact'],
      senderPatterns: ['gmail.com', 'yahoo.fr', 'hotmail.com', 'outlook.com', 'free.fr', 'orange.fr', 'wanadoo.fr', 'laposte.net'],
      color: '#8b5cf6',
      icon: '👤',
      weight: 1.3
    },
    'Travail': {
      keywords: ['réunion', 'meeting', 'projet', 'équipe', 'deadline', 'rapport', 'présentation', 'tâche', 'mission', 'client', 'collègue', 'manager', 'rh', 'contrat', 'bureau', 'société', 'entreprise', 'travail'],
      senderPatterns: ['hr', 'rh', 'manager', 'chef', 'direction', 'entreprise', 'societe', 'inc', 'ltd', 'corp', 'company', 'group', 'team'],
      color: '#f59e0b',
      icon: '💼',
      weight: 1.0
    },
    'Factures': {
      keywords: ['facture', 'invoice', 'bill', 'payment', 'paiement', 'montant', 'payé', 'payer', 'échéance', 'edf', 'gdf', 'orange', 'sfr', 'free', 'bouygues', 'électricité', 'gaz', 'internet', 'mobile', 'téléphone', 'abonnement', 'forfait', 'renouvellement'],
      senderPatterns: ['noreply', 'facturation', 'billing', 'no-reply', 'service.client', 'edf', 'engie', 'orange', 'sfr', 'bouygues', 'free', 'clients'],
      color: '#ef4444',
      icon: '�',
      weight: 1.0
    },
    'Billets': {
      keywords: ['vol', 'avion', 'train', 'hôtel', 'réservation', 'booking', 'voyage', 'vacation', 'billet', 'ticket', 'sncf', 'air', 'vacances', 'séjour', 'transport', 'destination', 'itinéraire', 'check-in', 'embarquement', 'confirmation'],
      senderPatterns: ['booking', 'airbnb', 'hotels', 'sncf', 'air', 'ryanair', 'easyjet', 'voyage', 'travel', 'trip', 'expedia', 'skyscanner'],
      color: '#06b6d4',
      icon: '🎫',
      weight: 1.0
    },
    'Promotions': {
      keywords: ['promo', 'promotion', 'offre', 'reduction', 'soldes', 'discount', 'code promo', 'bon plan', 'deal', 'cashback', 'remise', 'special', 'limited', 'exclusive', 'save', 'économie', 'gratuit', 'free', 'cadeau', 'gift'],
      senderPatterns: ['promo', 'marketing', 'deals', 'offers', 'sales', 'newsletter'],
      color: '#f97316',
      icon: '�️',
      weight: 0.9
    },
    'Réseaux sociaux': {
      keywords: ['facebook', 'instagram', 'twitter', 'linkedin', 'snapchat', 'tiktok', 'youtube', 'notification', 'mention', 'like', 'commentaire', 'message', 'ami', 'connexion', 'réseau social', 'post', 'photo', 'vidéo', 'story'],
      senderPatterns: ['facebook', 'instagram', 'twitter', 'linkedin', 'snapchat', 'tiktok', 'youtube', 'social', 'notification'],
      color: '#8b5cf6',
      icon: '📱',
      weight: 1.0
    },
    'Publicité': {
      keywords: ['publicité', 'pub', 'marketing', 'spam', 'newsletter', 'unsubscribe', 'désabonner', 'indeed', 'pole emploi', 'offre emploi', 'job offer', 'candidature', 'cv', 'embauche', 'recrutement', 'deliveroo', 'uber', 'auto école', 'permis', 'formation'],
      senderPatterns: ['noreply', 'no-reply', 'marketing', 'newsletter', 'info@', 'contact@', 'team@', 'hello@', 'indeed', 'pole-emploi', 'apec', 'monster', 'leboncoin', 'deliveroo', 'uber', 'autoecole'],
      color: '#f43f5e',
      icon: '📢',
      weight: 1.2
    }
  };

  constructor() {
    if (naturalLib && naturalLib.WordTokenizer && naturalLib.TfIdf) {
      if (naturalLib) {
        this.tokenizer = new naturalLib.WordTokenizer();
        this.tfidf = new naturalLib.TfIdf();
      }
    } else {
      // Fallback pour le navigateur
      if (naturalLib) {
        this.tokenizer = new naturalLib.WordTokenizer();
        this.tfidf = new naturalLib.TfIdf();
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

      // 2. Classification basée sur les patterns - SEUIL ABAISSÉ pour 90%+ classification
      const patternResult = await this.classifyWithPatterns(features, email, existingCategories);
      if (patternResult.confidence > 0.1) { // SEUIL ABAISSÉ de 0.3 à 0.1
        return patternResult;
      }

      // 3. CRÉATION AUTOMATIQUE TOTALEMENT DÉSACTIVÉE
      console.log('🚫 AUCUNE création automatique - classification forcée uniquement');
      
      // 4. Classification forcée intelligente
      return await this.forceClassificationIntoExisting(features, email, existingCategories);

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

    // SEUIL ENCORE PLUS BAS pour forcer 95%+ de classification
    if (bestMatch.score > 0.02) { // SEUIL TRÈS BAS : 0.1 → 0.02
      console.log(`✅ Email classé dans "${bestMatch.category?.name}" (score: ${bestMatch.score.toFixed(3)})`);
      
      let categoryId = bestMatch.category?.id || '';
      
      // Si c'est un pattern, trouver la vraie catégorie correspondante
      if (categoryId.startsWith('pattern_') && bestMatch.category) {
        const patternName = bestMatch.category.name;
        const realCategory = categories.find(cat => 
          cat.name.toLowerCase() === patternName.toLowerCase()
        );
        
        if (realCategory) {
          categoryId = realCategory.id;
          console.log(`🔄 Pattern "${patternName}" mappé à la catégorie existante (${realCategory.id})`);
        } else {
          // Si pas de catégorie correspondante, laisser vide pour créer automatiquement
          categoryId = `auto_${patternName.toLowerCase().replace(/\s+/g, '_')}`;
          console.log(`🆕 Pattern "${patternName}" nécessite création de catégorie`);
        }
      }
      
      return {
        category_id: categoryId,
        confidence: bestMatch.score,
        suggested_categories: bestMatch.isPattern && !categories.find(cat => cat.name.toLowerCase() === bestMatch.category?.name.toLowerCase()) ? 
          [{ ...bestMatch.category, id: `auto_${bestMatch.category.name.toLowerCase().replace(/\s+/g, '_')}` } as Category] : 
          scores.slice(0, 3).map(s => s.category).filter(Boolean) as Category[]
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
    const text = `${email.subject} ${email.body_text}`.toLowerCase();
    const sender = email.sender_email.toLowerCase();
    
    // RÈGLE SPÉCIALE : Distinguer Personnel des Publicités
    if (pattern === this.categoryPatterns['Personnel']) {
      // Pénaliser si c'est clairement de la pub
      const publicityIndicators = [
        'noreply', 'no-reply', 'marketing', 'promo', 'newsletter', 'unsubscribe',
        'indeed', 'pole-emploi', 'deliveroo', 'uber', 'autoecole', 'auto-ecole',
        'offre', 'promotion', 'discount', 'special', 'limited time', 'deal'
      ];
      
      const hasPublicityIndicators = publicityIndicators.some(indicator => 
        sender.includes(indicator) || text.includes(indicator)
      );
      
      if (hasPublicityIndicators) {
        console.log(`❌ Email rejeté de "Personnel" - indicateurs publicitaires détectés`);
        return 0; // ZERO pour Personnel si publicité détectée
      }
      
      // Bonus si c'est vraiment personnel
      const personalDomains = ['gmail.com', 'yahoo.fr', 'hotmail.com', 'outlook.com', 'free.fr', 'orange.fr'];
      const isPersonalDomain = personalDomains.some(domain => sender.includes(domain));
      
      if (isPersonalDomain) {
        score += 0.3; // Bonus pour domaine personnel
      }
    }
    
    // RÈGLE SPÉCIALE : Indeed et offres d'emploi → Publicité
    if (sender.includes('indeed') || sender.includes('pole-emploi') || sender.includes('apec') || 
        text.includes('offre d\'emploi') || text.includes('job offer') || text.includes('candidature')) {
      
      if (pattern === this.categoryPatterns['Publicité']) {
        score += 0.5; // Bonus pour Publicité
      } else if (pattern === this.categoryPatterns['Travail']) {
        return 0; // ZERO pour Travail si c'est Indeed/offres emploi
      }
    }
    
    // RÈGLE SPÉCIALE : Deliveroo, auto-école → Publicité
    if (sender.includes('deliveroo') || sender.includes('uber') || sender.includes('autoecole') ||
        text.includes('auto-école') || text.includes('permis de conduire') || text.includes('livraison')) {
      
      if (pattern === this.categoryPatterns['Publicité']) {
        score += 0.4; // Bonus pour Publicité
      } else if (pattern === this.categoryPatterns['Personnel']) {
        return 0; // ZERO pour Personnel
      }
    }

    // 1. Score basé sur les mots-clés avec pondération avancée
    let keywordScore = 0;
    const totalKeywords = pattern.keywords.length;
    
    for (const keyword of pattern.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Vérification dans le sujet (poids x3)
      if (email.subject.toLowerCase().includes(keywordLower)) {
        keywordScore += 3;
      }
      
      // Vérification dans le corps (poids x1)
      if (email.body_text.toLowerCase().includes(keywordLower)) {
        keywordScore += 1;
      }
      
      // Vérification avec stemming (poids x0.8)
      if (stemmer) {
        const stemmedKeyword = stemmer(keywordLower);
        if (features.stems.includes(stemmedKeyword)) {
          keywordScore += 0.8;
        }
      }
      
      // Vérification partielle (poids x0.5)
      if (text.includes(keywordLower.substring(0, Math.max(4, keywordLower.length - 2)))) {
        keywordScore += 0.5;
      }
    }
    
    // Normaliser le score des mots-clés
    score += Math.min(keywordScore / (totalKeywords * 3), 0.6);
    
    // 2. Score basé sur l'expéditeur (plus précis)
    let senderScore = 0;
    for (const senderPattern of pattern.senderPatterns) {
      const patternLower = senderPattern.toLowerCase();
      
      // Domaine exact
      if (features.senderDomain.includes(patternLower)) {
        senderScore += 0.8;
      }
      
      // Email contient le pattern
      if (email.sender_email.toLowerCase().includes(patternLower)) {
        senderScore += 0.6;
      }
      
      // Nom expéditeur contient le pattern
      if (email.sender.toLowerCase().includes(patternLower)) {
        senderScore += 0.4;
      }
    }
    score += Math.min(senderScore, 0.3);
    
    // 3. Bonus pour entités et topics spécifiques
    const entityBonus = this.calculateEntityBonus(features, pattern);
    score += entityBonus * 0.1;
    
    // 4. Score contextuel (patterns de phrases)
    const contextualScore = this.calculateContextualScore(text, pattern);
    score += contextualScore * 0.1;
    
    return Math.min(score * pattern.weight, 1.0);
  }

  private calculateEntityBonus(features: EmailFeatures, pattern: CategoryPattern): number {
    const entityMatches = features.entities.filter(entity =>
      pattern.keywords.some(keyword => 
        entity.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(entity.toLowerCase())
      )
    );
    return Math.min(entityMatches.length / 3, 1.0);
  }

  private calculateContextualScore(text: string, pattern: CategoryPattern): number {
    let contextScore = 0;
    
    // Patterns contextuels spécifiques par catégorie
    const contextualPatterns: Record<string, string[]> = {
      'Factures': ['facture n°', 'montant à payer', 'échéance', 'votre facture'],
      'Banque': ['solde de', 'virement de', 'carte bancaire', 'votre compte'],
      'Travail': ['réunion du', 'projet en cours', 'équipe', 'deadline'],
      'Réseaux sociaux': ['vous a mentionné', 'nouveau message', 'ami vous a', 'notification'],
      'Promotions': ['offre limitée', 'code promo', 'remise', 'jusqu\'au'],
      'Support Client': ['votre demande', 'ticket n°', 'nous vous aidons', 'problème résolu']
    };
    
    const patterns = contextualPatterns[pattern.keywords[0]] || [];
    for (const contextPattern of patterns) {
      if (text.includes(contextPattern.toLowerCase())) {
        contextScore += 0.5;
      }
    }
    
    return Math.min(contextScore, 1.0);
  }

  private async detectAndCreateCategory(features: EmailFeatures, existingCategories: Category[]): Promise<Category | null> {
    // 🚫 LIMITATION STRICTE : Maximum 8 catégories automatiques
    const autoGeneratedCategories = existingCategories.filter(cat => cat.is_auto_generated === true);
    if (autoGeneratedCategories.length >= 8) {
      console.log('🚫 Limite de 8 catégories automatiques atteinte');
      return null;
    }
    
    // Limite globale de sécurité
    if (existingCategories.length >= 15) {
      console.log('🚫 Limite totale de 15 catégories atteinte');
      return null;
    }

    // Priorité aux catégories prédéfinies disponibles
    const availablePredefinedCategories = this.getAvailablePredefinedCategories(existingCategories);
    
    if (availablePredefinedCategories.length > 0) {
      // Tenter de matcher avec une catégorie prédéfinie
      for (const categoryName of availablePredefinedCategories) {
        const pattern = this.categoryPatterns[categoryName];
        if (pattern) {
          const score = this.calculatePatternScore(features, pattern, {
            subject: features.words.join(' '),
            body_text: features.words.join(' '),
            sender: features.senderDomain,
            sender_email: features.senderDomain,
            is_important: features.isImportant
          } as any);
          
          if (score > 0.3) {
            console.log(`🆕 Création automatique de catégorie prédéfinie: "${categoryName}" (score: ${score.toFixed(3)})`);
            try {
              return await this.createCategory(categoryName);
            } catch (error) {
              console.error('Erreur création catégorie prédéfinie:', error);
            }
          }
        }
      }
    }

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

  private getAvailablePredefinedCategories(existingCategories: Category[]): string[] {
    const existingNames = existingCategories.map(cat => cat.name.toLowerCase());
    return Object.keys(this.categoryPatterns).filter(name => 
      !existingNames.includes(name.toLowerCase())
    );
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
    // Utiliser les patterns prédéfinis si disponibles
    const pattern = this.categoryPatterns[name];
    
    const color = pattern ? pattern.color : this.getRandomColor();
    const icon = pattern ? pattern.icon : this.getRandomIcon();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name,
        color,
        icon,
        description: pattern 
          ? `Catégorie créée automatiquement - ${name}`
          : `Catégorie créée automatiquement`,
        is_auto_generated: true,
        is_default: false
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Catégorie "${name}" créée automatiquement avec ${pattern ? 'pattern prédéfini' : 'style généré'}`);
    return category;
  }

  private getRandomColor(): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getRandomIcon(): string {
    const icons = ['📁', '📊', '🔗', '💡', '🎯', '⭐', '🔥'];
    return icons[Math.floor(Math.random() * icons.length)];
  }

  /**
   * Classification forcée intelligente - AUCUNE création automatique
   * Classe OBLIGATOIREMENT dans une catégorie existante
   */
  private async forceClassificationIntoExisting(features: EmailFeatures, email: ProcessedEmail, existingCategories: Category[]): Promise<ClassificationResult> {
    console.log('🎯 Classification forcée dans les catégories existantes uniquement');
    
    const scores: Array<{ category: Category, score: number, reason: string }> = [];
    
    // Analyser chaque catégorie existante (y compris celles créées par l'utilisateur)
    for (const category of existingCategories) {
      let score = 0;
      let reason = '';
      
      // 1. Score basé sur le nom de la catégorie
      const categoryNameLower = category.name.toLowerCase();
      const text = `${email.subject} ${email.body_text}`.toLowerCase();
      const sender = email.sender_email.toLowerCase();
      
      // 2. Correspondance directe avec le nom de catégorie
      if (text.includes(categoryNameLower)) {
        score += 0.8;
        reason = `Mention directe de "${category.name}"`;
      }
      
      // 3. Utiliser les patterns prédéfinis si la catégorie correspond
      const pattern = this.categoryPatterns[category.name];
      if (pattern) {
        const patternScore = this.calculatePatternScore(features, pattern, email);
        score += patternScore * 0.7;
        reason += ` + Pattern ${category.name} (${patternScore.toFixed(2)})`;
      }
      
      // 4. Score basé sur les mots-clés personnalisés de la catégorie
      if (category.keywords && category.keywords.length > 0) {
        let keywordMatches = 0;
        for (const keyword of category.keywords) {
          if (text.includes(keyword.toLowerCase())) {
            keywordMatches++;
          }
        }
        if (keywordMatches > 0) {
          score += (keywordMatches / category.keywords.length) * 0.6;
          reason += ` + Mots-clés (${keywordMatches}/${category.keywords.length})`;
        }
      }
      
      // 5. Analyse sémantique simple pour catégories personnalisées
      if (!this.categoryPatterns[category.name]) {
        // Pour les catégories créées par l'utilisateur (ex: "Foot")
        const semanticScore = this.calculateSemanticSimilarity(categoryNameLower, text);
        score += semanticScore * 0.5;
        reason += ` + Sémantique (${semanticScore.toFixed(2)})`;
      }
      
      if (score > 0.01) { // Seuil très bas pour capturer toutes les correspondances
        scores.push({ category, score, reason });
      }
    }
    
    // Trier par score décroissant
    scores.sort((a, b) => b.score - a.score);
    
    if (scores.length > 0) {
      const bestMatch = scores[0];
      console.log(`✅ Email forcé dans "${bestMatch.category.name}" (score: ${bestMatch.score.toFixed(3)}) - ${bestMatch.reason}`);
      
      return {
        category_id: bestMatch.category.id,
        confidence: bestMatch.score,
        suggested_categories: scores.slice(0, 3).map(s => s.category)
      };
    }
    
    // Si vraiment aucune correspondance, forcer dans "Publicité" (fourre-tout)
    const fallbackCategory = existingCategories.find(cat => cat.name === 'Publicité') || existingCategories[0];
    console.log(`⚠️ Aucune correspondance - Email forcé dans "${fallbackCategory.name}" (fallback)`);
    
    return {
      category_id: fallbackCategory.id,
      confidence: 0.1,
      suggested_categories: [fallbackCategory]
    };
  }
  
  /**
   * Calcul de similarité sémantique simple
   */
  private calculateSemanticSimilarity(categoryName: string, text: string): number {
    const categoryWords = categoryName.split(/\s+/);
    let matches = 0;
    
    for (const word of categoryWords) {
      if (word.length > 2) {
        // Correspondance exacte
        if (text.includes(word)) {
          matches += 1;
        }
        // Correspondance partielle (racine du mot)
        else if (word.length > 4) {
          const root = word.substring(0, word.length - 1);
          if (text.includes(root)) {
            matches += 0.7;
          }
        }
      }
    }
    
    return Math.min(matches / categoryWords.length, 1.0);
  }

  private async fallbackToUnclassified(existingCategories: Category[]): Promise<ClassificationResult> {
    
    // Ordre de priorité pour la classification forcée (du plus général au plus spécifique)
    const priorityOrder = ['Personnel', 'Publicité', 'Promotions', 'Travail', 'Banque', 'Factures', 'Billets', 'Réseaux sociaux'];
    
    // Chercher la première catégorie de base disponible
    for (const categoryName of priorityOrder) {
      const category = existingCategories.find(cat => cat.name === categoryName);
      if (category) {
        console.log(`✅ Email forcé dans "${categoryName}" (classification par défaut)`);
        return {
          category_id: category.id,
          confidence: 0.25, // Confiance raisonnable pour le forçage
          suggested_categories: [category]
        };
      }
    }
    
    // Si aucune catégorie de base, utiliser la première disponible
    if (existingCategories.length > 0) {
      const fallbackCategory = existingCategories[0];
      console.log(`✅ Email forcé dans "${fallbackCategory.name}" (première catégorie)`);
      return {
        category_id: fallbackCategory.id,
        confidence: 0.2,
        suggested_categories: [fallbackCategory]
      };
    }
    
    // Cas extrême - créer une catégorie Personnel par défaut
    console.log('⚠️ Aucune catégorie trouvée, création Personnel par défaut');
    const defaultCategory = {
      id: 'fallback_personnel',
      name: 'Personnel',
      color: '#8b5cf6',
      icon: '👤',
      user_id: '',
      created_at: new Date().toISOString(),
      is_auto_generated: true
    } as Category;
    
    return {
      category_id: defaultCategory.id,
      confidence: 0.2,
      suggested_categories: [defaultCategory]
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
