#!/bin/bash

# Script de déploiement de l'Edge Function Stripe pour Ordo
# Assurez-vous d'avoir installé Supabase CLI : npm install -g @supabase/cli

echo "🚀 Déploiement de l'Edge Function create-checkout-session"
echo "=================================================="

# 1. Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "📦 Installation avec: npm install -g @supabase/cli"
    exit 1
fi

# 2. Se connecter à Supabase (si pas déjà fait)
echo "🔐 Connexion à Supabase..."
supabase login

# 3. Lier le projet Ordo
echo "🔗 Liaison avec le projet Supabase..."
supabase link --project-ref tidslxypgfettpguqwxn

# 4. Déployer la fonction
echo "📤 Déploiement de l'Edge Function..."
supabase functions deploy create-checkout-session

# 5. Configurer les variables d'environnement
echo "⚙️  Configuration des variables d'environnement..."
echo "⚠️  IMPORTANT: Vous devez configurer manuellement les secrets suivants:"
echo ""
echo "1. Clé secrète Stripe:"
echo "   supabase secrets set STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_stripe"
echo ""
echo "2. URL Supabase (normalement déjà configurée):"
echo "   supabase secrets set SUPABASE_URL=https://tidslxypgfettpguqwxn.supabase.co"
echo ""
echo "3. Clé anonyme Supabase (normalement déjà configurée):"
echo "   supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""

# 6. Tester la fonction (optionnel)
echo "🧪 Test de la fonction..."
echo "URL de la fonction: https://tidslxypgfettpguqwxn.supabase.co/functions/v1/create-checkout-session"
echo ""

echo "✅ Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Configurer les secrets avec les commandes ci-dessus"
echo "2. Tester un paiement depuis l'interface"
echo "3. Configurer les webhooks Stripe si nécessaire"