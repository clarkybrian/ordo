import { openaiService } from './src/services/openai.ts';

// Test simple du service OpenAI
async function testOpenAI() {
  console.log('🧪 Test du service OpenAI...');
  
  try {
    // Test de classification d'email
    const testEmail = {
      gmail_id: 'test1',
      subject: 'Facture EDF - Votre facture d\'électricité de septembre',
      sender: 'EDF',
      sender_email: 'noreply@edf.fr',
      body_text: 'Bonjour, voici votre facture d\'électricité pour le mois de septembre. Montant: 125€. Merci de procéder au paiement avant la date d\'échéance.',
      snippet: 'Votre facture d\'électricité pour septembre - 125€',
      received_at: new Date().toISOString(),
      is_important: false,
      is_read: false,
      labels: [],
      thread_id: 'thread1'
    };

    const existingCategories = [];

    console.log('📧 Test email:', testEmail.subject);
    
    const result = await openaiService.classifyEmail(testEmail, existingCategories);
    
    console.log('✅ Classification réussie:');
    console.log(`   Catégorie: ${result.category_name}`);
    console.log(`   Confiance: ${Math.round(result.confidence * 100)}%`);
    console.log(`   Auto-créée: ${result.auto_created}`);
    console.log(`   Raisonnement: ${result.reasoning}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testOpenAI();
