// Script de test pour la fonction Stripe webhook
// Ce script vérifie que la fonction répond correctement aux requêtes OPTIONS et POST

const WEBHOOK_URL = 'https://tidslxypgfettpguqwxn.supabase.co/functions/v1/stripe-webhook';

async function testWebhookEndpoint() {
  console.log('🧪 Test de la fonction Stripe webhook...\n');

  // Test 1: Vérifier que les requêtes OPTIONS fonctionnent (CORS)
  console.log('1️⃣ Test CORS (OPTIONS)...');
  try {
    const optionsResponse = await fetch(WEBHOOK_URL, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'stripe-signature, content-type'
      }
    });
    
    console.log('   Status:', optionsResponse.status);
    console.log('   Headers:', Object.fromEntries(optionsResponse.headers.entries()));
    
    if (optionsResponse.status === 200) {
      console.log('   ✅ CORS configuré correctement\n');
    } else {
      console.log('   ❌ Problème CORS\n');
    }
  } catch (error) {
    console.log('   ❌ Erreur CORS:', error.message, '\n');
  }

  // Test 2: Vérifier qu'une requête POST sans signature échoue proprement
  console.log('2️⃣ Test requête POST sans signature...');
  try {
    const postResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data' })
    });
    
    const responseText = await postResponse.text();
    console.log('   Status:', postResponse.status);
    console.log('   Response:', responseText);
    
    if (postResponse.status === 400) {
      console.log('   ✅ Fonction rejette correctement les requêtes sans signature\n');
    } else {
      console.log('   ⚠️  Réponse inattendue\n');
    }
  } catch (error) {
    console.log('   ❌ Erreur POST:', error.message, '\n');
  }

  // Test 3: Vérifier que les méthodes non supportées sont rejetées
  console.log('3️⃣ Test méthode GET (doit être rejetée)...');
  try {
    const getResponse = await fetch(WEBHOOK_URL, {
      method: 'GET'
    });
    
    console.log('   Status:', getResponse.status);
    
    if (getResponse.status === 405) {
      console.log('   ✅ Méthodes non supportées correctement rejetées\n');
    } else {
      console.log('   ⚠️  Réponse inattendue pour GET\n');
    }
  } catch (error) {
    console.log('   ❌ Erreur GET:', error.message, '\n');
  }

  console.log('🏁 Tests terminés !');
}

// Exécuter les tests si ce script est appelé directement
if (typeof window === 'undefined') {
  testWebhookEndpoint();
}