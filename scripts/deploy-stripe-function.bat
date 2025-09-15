@echo off
echo 🚀 Déploiement de l'Edge Function create-checkout-session
echo ==================================================

echo 🔐 Connexion à Supabase...
npx supabase login

echo 🔗 Liaison avec le projet Supabase...
npx supabase link --project-ref tidslxypgfettpguqwxn

echo 📤 Déploiement de l'Edge Function...
npx supabase functions deploy create-checkout-session

echo.
echo ⚙️ Configuration des variables d'environnement...
echo ⚠️ IMPORTANT: Vous devez configurer manuellement les secrets suivants:
echo.
echo 1. Clé secrète Stripe:
echo    npx supabase secrets set STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_stripe
echo.
echo 2. URL Supabase (normalement déjà configurée):
echo    npx supabase secrets set SUPABASE_URL=https://tidslxypgfettpguqwxn.supabase.co
echo.
echo 3. Clé anonyme Supabase (normalement déjà configurée):
echo    npx supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
echo.

echo 🧪 Test de la fonction...
echo URL de la fonction: https://tidslxypgfettpguqwxn.supabase.co/functions/v1/create-checkout-session
echo.

echo ✅ Déploiement terminé !
echo.
echo 📋 Prochaines étapes:
echo 1. Configurer les secrets avec les commandes ci-dessus
echo 2. Tester un paiement depuis l'interface
echo 3. Configurer les webhooks Stripe si nécessaire

pause