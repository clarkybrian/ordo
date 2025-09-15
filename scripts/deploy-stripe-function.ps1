# Script PowerShell pour déployer l'Edge Function Stripe
# Assurez-vous d'avoir installé Supabase CLI : npm install -g @supabase/cli

Write-Host "🚀 Déploiement de l'Edge Function create-checkout-session" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# 1. Vérifier si Supabase CLI est installé
if (Get-Command supabase -ErrorAction SilentlyContinue) {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI détecté: $supabaseVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "📦 Installation avec: npm install -g @supabase/cli" -ForegroundColor Yellow
    exit 1
}

# 2. Se connecter à Supabase
Write-Host "🔐 Connexion à Supabase..." -ForegroundColor Cyan
supabase login

# 3. Lier le projet Ordo
Write-Host "🔗 Liaison avec le projet Supabase..." -ForegroundColor Cyan
supabase link --project-ref tidslxypgfettpguqwxn

# 4. Déployer la fonction
Write-Host "📤 Déploiement de l'Edge Function..." -ForegroundColor Cyan
supabase functions deploy create-checkout-session

# 5. Instructions pour les variables d'environnement
Write-Host "`n⚙️  Configuration des variables d'environnement..." -ForegroundColor Yellow
Write-Host "⚠️  IMPORTANT: Vous devez configurer manuellement les secrets suivants:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Clé secrète Stripe:" -ForegroundColor White
Write-Host "   supabase secrets set STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_stripe" -ForegroundColor Gray
Write-Host ""
Write-Host "2. URL Supabase (normalement déjà configurée):" -ForegroundColor White
Write-Host "   supabase secrets set SUPABASE_URL=https://tidslxypgfettpguqwxn.supabase.co" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Clé anonyme Supabase (normalement déjà configurée):" -ForegroundColor White
Write-Host "   supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor Gray
Write-Host ""

# 6. Informations de test
Write-Host "🧪 Test de la fonction..." -ForegroundColor Cyan
Write-Host "URL de la fonction: https://tidslxypgfettpguqwxn.supabase.co/functions/v1/create-checkout-session" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Configurer les secrets avec les commandes ci-dessus" -ForegroundColor White
Write-Host "2. Tester un paiement depuis l`'interface" -ForegroundColor White
Write-Host "3. Configurer les webhooks Stripe si nécessaire" -ForegroundColor White

# Pause pour lire les instructions
Write-Host "`nAppuyez sur une touche pour continuer..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")