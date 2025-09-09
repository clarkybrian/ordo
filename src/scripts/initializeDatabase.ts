import { supabase } from '../lib/supabase';

export interface DatabaseStatus {
  tables: {
    users: boolean;
    categories: boolean; 
    emails: boolean;
    sync_history: boolean;
  };
  needs_seed: boolean;
  default_categories_count: number;
}

/**
 * Vérifie l'état des tables de la base de données
 * et détermine si un pré-remplissage est nécessaire
 */
export async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  const status: DatabaseStatus = {
    tables: {
      users: false,
      categories: false,
      emails: false,
      sync_history: false
    },
    needs_seed: false,
    default_categories_count: 0
  };

  try {
    // Vérifier la table categories
    const { error: catError } = await supabase
      .from('categories')
      .select('id, name, is_auto_generated')
      .limit(1);
    
    status.tables.categories = !catError;
    
    // Vérifier la table emails
    const { error: emailError } = await supabase
      .from('emails')
      .select('id')
      .limit(1);
    
    status.tables.emails = !emailError;
    
    // Vérifier la table sync_history
    const { error: syncError } = await supabase
      .from('sync_history')
      .select('id')
      .limit(1);
    
    status.tables.sync_history = !syncError;

    // Compter les catégories par défaut existantes
    if (status.tables.categories) {
      const { count } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('is_auto_generated', false);
      
      status.default_categories_count = count || 0;
    }

    // Déterminer si un seed est nécessaire
    status.needs_seed = status.default_categories_count === 0;

    console.log('📊 État de la base de données:', status);
    return status;

  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la BD:', error);
    return status;
  }
}

/**
 * Catégories par défaut à créer si la base est vide
 */
const DEFAULT_CATEGORIES = [
  {
    name: 'Banque',
    color: '#10b981',
    icon: '🏦',
    keywords: ['banque', 'bank', 'compte', 'virement', 'carte', 'crédit']
  },
  {
    name: 'Factures', 
    color: '#ef4444',
    icon: '📄',
    keywords: ['facture', 'invoice', 'bill', 'payment', 'edf', 'orange']
  },
  {
    name: 'Travail',
    color: '#f59e0b', 
    icon: '💼',
    keywords: ['réunion', 'meeting', 'projet', 'équipe', 'deadline']
  },
  {
    name: 'Personnel',
    color: '#8b5cf6',
    icon: '👤', 
    keywords: ['famille', 'ami', 'personnel', 'private', 'perso']
  },
  {
    name: 'Billets',
    color: '#eab308',
    icon: '🎫',
    keywords: ['train', 'avion', 'voyage', 'booking', 'réservation']
  }
];

/**
 * Préremplis les catégories par défaut pour un utilisateur
 */
export async function seedDefaultCategories(userId: string): Promise<void> {
  try {
    console.log(`🌱 Création des catégories par défaut pour l'utilisateur ${userId}...`);
    
    for (const category of DEFAULT_CATEGORIES) {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: category.name,
          color: category.color,
          icon: category.icon,
          is_auto_generated: false,
          keywords: category.keywords
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Erreur création catégorie ${category.name}:`, error);
      } else {
        console.log(`✅ Catégorie créée: ${category.name} (${data.id})`);
      }
    }

    console.log('🎉 Catégories par défaut créées avec succès !');
  } catch (error) {
    console.error('💥 Erreur lors du seed des catégories:', error);
    throw error;
  }
}

/**
 * Initialise la base de données pour un nouvel utilisateur
 */
export async function initializeUserDatabase(userId: string): Promise<void> {
  try {
    console.log(`🔧 Initialisation de la BD pour l'utilisateur ${userId}...`);
    
    const status = await checkDatabaseStatus();
    
    if (!status.tables.categories) {
      throw new Error('Table categories non accessible');
    }

    // Vérifier si l'utilisateur a déjà des catégories
    const { data: userCategories, error } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('❌ Erreur vérification catégories utilisateur:', error);
      return;
    }

    // Si l'utilisateur n'a pas de catégories, les créer
    if (!userCategories || userCategories.length === 0) {
      await seedDefaultCategories(userId);
    } else {
      console.log('✅ L\'utilisateur a déjà des catégories configurées');
    }

  } catch (error) {
    console.error('💥 Erreur initialisation BD utilisateur:', error);
    throw error;
  }
}
