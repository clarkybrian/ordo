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
    console.log('✅ ÉTAPE 1 - Configuration Google Cloud Console:');
    console.log('1. Allez sur https://console.cloud.google.com/');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Allez dans APIs & Services > Credentials');
    console.log('4. Modifiez votre OAuth 2.0 Client ID:');
    console.log('');
    console.log('   📍 ORIGINES JAVASCRIPT AUTORISÉES:');
    console.log('   - https://orton.life');
    console.log('   - http://localhost:5173 (pour le développement)');
    console.log('');
    console.log('   📍 URI DE REDIRECTION AUTORISÉS:');
    console.log('   - https://tidslxypgfettpguqwxn.supabase.co/auth/v1/callback');
    console.log('   - https://orton.life/auth/callback');
    console.log('');
    
    console.log('✅ ÉTAPE 2 - Configuration Supabase:');
    console.log('1. Connectez-vous à votre dashboard Supabase');
    console.log('2. Allez dans Authentication > Providers > Google');
    console.log('3. Activez Google Auth');
    console.log('4. Ajoutez ces informations:');
    console.log(`   - Client ID: ${googleClientId}`);
    console.log('   - Client Secret: [Votre Secret Google]');
    console.log('   - Authorized Redirect URL: https://tidslxypgfettpguqwxn.supabase.co/auth/v1/callback');
    console.log('5. Sauvegardez les changements');
    
    console.log('\n✅ ÉTAPE 3 - Configuration Site Supabase:');
    console.log('- Site URL: https://orton.life');
    console.log('- Redirect URLs: https://tidslxypgfettpguqwxn.supabase.co/auth/v1/callback,https://orton.life/auth/callback');
    
    console.log('\n🚨 IMPORTANT: Les deux domaines doivent être configurés dans Google Cloud !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
  }
}

// Exécuter la configuration
configureGoogleAuth();
