// configureSuperbaseOAuth.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Récupérer les variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Vérifier les variables requises
if (!supabaseUrl || !supabaseAnonKey || !googleClientId || !googleClientSecret) {
  console.error('❌ Variables d\'environnement manquantes. Veuillez vérifier votre fichier .env');
  console.log('supabaseUrl:', supabaseUrl ? '✓' : '✗');
  console.log('supabaseAnonKey:', supabaseAnonKey ? '✓' : '✗');
  console.log('googleClientId:', googleClientId ? '✓' : '✗');
  console.log('googleClientSecret:', googleClientSecret ? '✓' : '✗');
  process.exit(1);
}

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function configureGoogleAuth() {
  console.log('Début de la configuration OAuth Google dans Supabase...');
  
  try {
    // Cette partie nécessite un accès admin à Supabase que nous n'avons pas depuis le frontend
    console.log('✅ Pour configurer correctement OAuth dans Supabase, suivez ces étapes manuelles:');
    console.log('1. Connectez-vous à votre dashboard Supabase');
    console.log('2. Allez dans Authentication > Providers > Google');
    console.log('3. Activez Google Auth');
    console.log('4. Ajoutez ces informations:');
    console.log(`   - Client ID: ${googleClientId}`);
    console.log('   - Client Secret: [Votre Secret Google]');
    console.log('   - Authorized Redirect URL: https://tidslxypgfettpguqwxn.supabase.co/auth/v1/callback');
    console.log('5. Sauvegardez les changements');
    
    console.log('\nVérifiez également les paramètres suivants:');
    console.log('- Site URL: https://orton.life');
    console.log('- Redirect URLs: https://tidslxypgfettpguqwxn.supabase.co/auth/v1/callback,https://orton.life/auth/callback');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
  }
}

// Exécuter la configuration
configureGoogleAuth();
