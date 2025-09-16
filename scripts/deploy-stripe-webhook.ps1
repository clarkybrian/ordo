# Script de déploiement de la fonction Stripe webhook
# Ce script déploie la fonction sans vérification JWT pour permettre l'accès public aux webhooks Stripe

Write-Host "🚀 Déploiement de la fonction Stripe webhook..." -ForegroundColor Yellow

# Naviguer vers le dossier du projet
Set-Location "c:\ordo"

# Déployer la fonction avec l'option --no-verify-jwt
Write-Host "📦 Déploiement en cours..." -ForegroundColor Blue
supabase functions deploy stripe-webhook --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Fonction Stripe webhook déployée avec succès !" -ForegroundColor Green
    Write-Host "🔗 URL: https://tidslxypgfettpguqwxn.supabase.co/functions/v1/stripe-webhook" -ForegroundColor Cyan
    Write-Host "⚠️  N'oubliez pas de mettre à jour l'URL du webhook dans Stripe Dashboard" -ForegroundColor Yellow
} else {
    Write-Host "❌ Erreur lors du déploiement" -ForegroundColor Red
    exit 1
}