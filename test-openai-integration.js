// Test du service OpenAI
import { openaiService } from './src/services/openai.js';

// Mock des emails pour tester
const testEmails = [
  {
    gmail_id: 'test1',
    subject: 'Facture EDF - Votre facture d\'électricité',
    sender: 'EDF',
    sender_email: 'noreply@edf.fr',
    body_text: 'Bonjour, voici votre facture d\'électricité pour le mois de septembre. Montant: 125€',
    snippet: 'Votre facture d\'électricité pour septembre',
    received_at: new Date().toISOString(),
    is_important: false,
    is_read: false,
    labels: [],
    thread_id: 'thread1'
  },
  {
    gmail_id: 'test2',
    subject: 'Réunion équipe projet Alpha',
    sender: 'Marie Dubois',
    sender_email: 'marie.dubois@entreprise.com',
    body_text: 'Bonjour, je vous invite à la réunion du projet Alpha demain à 14h en salle de conférence',
    snippet: 'Réunion projet Alpha demain 14h',
    received_at: new Date().toISOString(),
    is_important: true,
    is_read: false,
    labels: [],
    thread_id: 'thread2'
  },
  {
    gmail_id: 'test3',
    subject: 'Commande Amazon expédiée',
    sender: 'Amazon',
    sender_email: 'no-reply@amazon.fr',
    body_text: 'Votre commande #123456 a été expédiée. Livraison prévue demain.',
    snippet: 'Commande expédiée, livraison demain',
    received_at: new Date().toISOString(),
    is_important: false,
    is_read: false,
    labels: [],
    thread_id: 'thread3'
  }
];

// Mock des catégories existantes
const existingCategories = [
  {
    id: 'cat1',
    user_id: 'user123',
    name: 'Travail',
    color: '#f59e0b',
    icon: '💼',
    created_at: new Date().toISOString(),
    is_auto_generated: false,
    emails_count: 5
  }
];

async function testOpenAIClassification() {
  console.log('🧪 Test de classification OpenAI...\n');

  try {
    for (const email of testEmails) {
      console.log(`📧 Test email: "${email.subject}"`);
      console.log(`   De: ${email.sender_email}`);
      console.log(`   Contenu: ${email.snippet}`);
      
      const result = await openaiService.classifyEmail(email, existingCategories);
      
      console.log(`✅ Résultat:`);
      console.log(`   Catégorie: ${result.category_name}`);
      console.log(`   Confiance: ${Math.round(result.confidence * 100)}%`);
      console.log(`   Auto-créée: ${result.auto_created ? 'Oui' : 'Non'}`);
      console.log(`   Raisonnement: ${result.reasoning}`);
      console.log('');
      
      // Ajouter la nouvelle catégorie à la liste si elle a été créée
      if (result.auto_created) {
        existingCategories.push({
          id: result.category_id,
          user_id: 'user123',
          name: result.category_name,
          color: '#3b82f6',
          icon: '📁',
          created_at: new Date().toISOString(),
          is_auto_generated: true,
          emails_count: 1
        });
      }
    }

    console.log(`📊 Catégories finales (${existingCategories.length}):`);
    existingCategories.forEach(cat => {
      console.log(`   ${cat.icon} ${cat.name} ${cat.is_auto_generated ? '(auto)' : '(manuelle)'}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

async function testChatbot() {
  console.log('\n🤖 Test du chatbot...\n');

  const testQuestions = [
    "Combien de catégories j'ai créées ?",
    "Quels sont mes derniers emails ?",
    "Résume mes emails par catégorie"
  ];

  try {
    for (const question of testQuestions) {
      console.log(`❓ Question: "${question}"`);
      
      const response = await openaiService.handleChatbotQuery(question, 'user123');
      
      console.log(`🤖 Réponse (${response.type}):`);
      console.log(`   ${response.message}`);
      if (response.data) {
        console.log(`   Données: ${JSON.stringify(response.data)}`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('❌ Erreur lors du test chatbot:', error);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests OpenAI pour Ordo\n');
  
  // Vérifier que la clé API est configurée
  if (!process.env.VITE_OPENAI_API_KEY) {
    console.error('❌ Clé API OpenAI manquante. Vérifiez votre fichier .env');
    return;
  }
  
  console.log('✅ Clé API OpenAI détectée');
  console.log('=====================================\n');
  
  await testOpenAIClassification();
  await testChatbot();
  
  console.log('🎉 Tests terminés !');
}

// Lancer les tests si le script est exécuté directement
if (import.meta.url === new URL(import.meta.url).href) {
  runTests().catch(console.error);
}

export { runTests };
