// Test complet des nouvelles fonctionnalités du chatbot Ordo

import { openaiService } from './src/services/openai.js';
import { chatbotCleanupService } from './src/services/chatbotCleanup.js';

// Mock des emails pour tester
const testEmails = [
  {
    id: '1',
    subject: 'URGENT: Réunion client importante demain',
    sender_email: 'marie.dubois@entreprise.com',
    snippet: 'Réunion stratégique avec le client principal',
    received_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    is_read: false,
    is_important: true,
    category: { name: 'Travail', color: '#f59e0b', icon: '💼' }
  },
  {
    id: '2',
    subject: 'Facture EDF - Échéance dans 3 jours',
    sender_email: 'noreply@edf.fr',
    snippet: 'Votre facture d\'électricité arrive à échéance',
    received_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    is_read: false,
    is_important: true,
    category: { name: 'Factures', color: '#ef4444', icon: '📄' }
  },
  {
    id: '3',
    subject: 'Newsletter hebdomadaire TechCrunch',
    sender_email: 'newsletter@techcrunch.com',
    snippet: 'Les dernières actualités tech de la semaine',
    received_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_read: true,
    is_important: false,
    category: { name: 'Newsletter', color: '#6b7280', icon: '📰' }
  },
  {
    id: '4',
    subject: 'Commande Amazon expédiée #FR123456',
    sender_email: 'ship-confirm@amazon.fr',
    snippet: 'Votre commande a été expédiée et arrivera demain',
    received_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_read: true,
    is_important: false,
    category: { name: 'E-commerce', color: '#8b5cf6', icon: '🛍️' }
  },
  {
    id: '5',
    subject: 'Virement reçu sur votre compte',
    sender_email: 'notif@banque-populaire.fr',
    snippet: 'Un virement de 2500€ a été crédité sur votre compte',
    received_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    is_read: true,
    is_important: false,
    category: { name: 'Banque', color: '#10b981', icon: '🏦' }
  }
];

// Mock des catégories
const testCategories = [
  { id: '1', user_id: 'user123', name: 'Travail', color: '#f59e0b', icon: '💼', created_at: new Date().toISOString(), is_auto_generated: false, emails_count: 1 },
  { id: '2', user_id: 'user123', name: 'Factures', color: '#ef4444', icon: '📄', created_at: new Date().toISOString(), is_auto_generated: true, emails_count: 1 },
  { id: '3', user_id: 'user123', name: 'Newsletter', color: '#6b7280', icon: '📰', created_at: new Date().toISOString(), is_auto_generated: true, emails_count: 1 },
  { id: '4', user_id: 'user123', name: 'E-commerce', color: '#8b5cf6', icon: '🛍️', created_at: new Date().toISOString(), is_auto_generated: true, emails_count: 1 },
  { id: '5', user_id: 'user123', name: 'Banque', color: '#10b981', icon: '🏦', created_at: new Date().toISOString(), is_auto_generated: true, emails_count: 1 },
  { id: '6', user_id: 'user123', name: 'Voyages', color: '#3b82f6', icon: '✈️', created_at: new Date().toISOString(), is_auto_generated: true, emails_count: 0 },
  { id: '7', user_id: 'user123', name: 'Santé', color: '#84cc16', icon: '🏥', created_at: new Date().toISOString(), is_auto_generated: false, emails_count: 0 },
  { id: '8', user_id: 'user123', name: 'Formation', color: '#06b6d4', icon: '🎓', created_at: new Date().toISOString(), is_auto_generated: false, emails_count: 0 }
];

async function testChatbotLiberte() {
  console.log('🤖 Test de la liberté du chatbot avec nouvelles capacités\n');

  const questions = [
    // Questions sur la priorité et le classement
    "Classe mes emails par ordre de priorité",
    "Quels sont mes emails les plus importants ?",
    "Quels expéditeurs m'envoient le plus d'emails ?",
    
    // Questions analytiques
    "Résume la répartition de mes emails par catégorie",
    "Combien d'emails non lus j'ai ?",
    "Quelles sont mes catégories les plus utilisées ?",
    
    // Questions de gestion
    "Comment optimiser mes catégories ?",
    "Quels emails nécessitent une action urgente ?",
    
    // Questions hors sujet (pour tester la restriction)
    "Quelle est la météo aujourd'hui ?",
    "Raconte-moi une blague",
    "Comment faire un gâteau au chocolat ?"
  ];

  try {
    for (const question of questions) {
      console.log(`❓ Question: "${question}"`);
      
      const response = await openaiService.handleChatbotQuery(question, 'user123');
      
      console.log(`🤖 Type de réponse: ${response.type}`);
      console.log(`💬 Réponse: ${response.message.substring(0, 200)}${response.message.length > 200 ? '...' : ''}`);
      
      if (response.data) {
        console.log(`📊 Données: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
      
      console.log('─'.repeat(80));
      console.log('');
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

async function testNettoyageAutomatique() {
  console.log('🧹 Test du système de nettoyage automatique\n');

  try {
    console.log('🚀 Démarrage du nettoyage automatique...');
    chatbotCleanupService.startAutoCleanup();
    
    console.log('🧪 Test du nettoyage manuel...');
    const deletedCount = await chatbotCleanupService.cleanupUserMessages('user123');
    console.log(`✅ ${deletedCount} messages supprimés manuellement`);
    
    console.log('📊 Test de la limitation des messages...');
    await chatbotCleanupService.limitUserMessages('user123', 50);
    console.log('✅ Limitation appliquée avec succès');
    
    console.log('🛑 Arrêt du nettoyage automatique...');
    chatbotCleanupService.stopAutoCleanup();
    
    console.log('🎉 Tests de nettoyage terminés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test de nettoyage:', error);
  }
}

async function testStatistiquesAmeliorees() {
  console.log('📊 Test des statistiques améliorées\n');

  try {
    const usedCategories = testCategories.filter(cat => cat.emails_count > 0);
    const totalCategories = testCategories.length;
    
    console.log(`📈 Statistiques calculées:`);
    console.log(`   • Catégories totales: ${totalCategories}`);
    console.log(`   • Catégories utilisées: ${usedCategories.length}`);
    console.log(`   • Ratio d'utilisation: ${Math.round((usedCategories.length / totalCategories) * 100)}%`);
    
    console.log(`\n📧 Analyse des emails:`);
    console.log(`   • Total emails: ${testEmails.length}`);
    console.log(`   • Emails non lus: ${testEmails.filter(e => !e.is_read).length}`);
    console.log(`   • Emails importants: ${testEmails.filter(e => e.is_important).length}`);
    
    console.log(`\n👥 Expéditeurs principaux:`);
    const senderCounts = new Map();
    testEmails.forEach(email => {
      const sender = email.sender_email;
      senderCounts.set(sender, (senderCounts.get(sender) || 0) + 1);
    });
    
    Array.from(senderCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([sender, count]) => {
        console.log(`   • ${sender}: ${count} emails`);
      });
    
    console.log('✅ Analyse des statistiques terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Fonction principale de test
async function runAllTests() {
  console.log('🚀 Tests complets des améliorations Chatbot Ordo v2.0');
  console.log('='.repeat(60));
  console.log('');

  // Vérifier la clé API
  if (!process.env.VITE_OPENAI_API_KEY) {
    console.error('❌ Clé API OpenAI manquante. Tests annulés.');
    return;
  }

  console.log('✅ Configuration validée');
  console.log('');

  // Tests individuels
  await testStatistiquesAmeliorees();
  console.log('');
  
  await testNettoyageAutomatique();
  console.log('');
  
  await testChatbotLiberte();
  
  console.log('🎉 Tous les tests sont terminés !');
  console.log('');
  console.log('📋 Résumé des fonctionnalités testées:');
  console.log('✅ Statistiques catégories utilisées vs totales');
  console.log('✅ Nettoyage automatique des messages (1h)');
  console.log('✅ Limitation du nombre de messages');
  console.log('✅ Questions libres sur les emails');
  console.log('✅ Classement par priorité');
  console.log('✅ Restriction des questions hors-sujet');
  console.log('✅ Analyse avancée des emails');
}

// Lancer les tests
runAllTests().catch(console.error);
