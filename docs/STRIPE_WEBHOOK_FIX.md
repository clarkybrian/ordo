# Correction du Webhook Stripe - Erreur 401

## Problème Initial
La fonction Edge Supabase pour les webhooks Stripe renvoyait une erreur **401 "Missing authorization header"**.

## Cause du Problème
Les fonctions Edge Supabase nécessitent par défaut une authentification via JWT, mais les webhooks Stripe ne peuvent pas fournir de token d'authentification. Ils utilisent une signature HMAC pour la sécurité.

## Solutions Appliquées

### 1. Configuration de la Fonction (config.toml)
```toml
[functions.stripe-webhook]
verify_jwt = false
```

### 2. Déploiement avec Option No-Verify-JWT
```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 3. Amélioration des En-têtes CORS
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

### 4. Gestion d'Erreur Améliorée
Avant (❌ retournait 500) :
```typescript
if (!signature) {
  throw new Error('Signature manquante')
}
```

Après (✅ retourne 400) :
```typescript
if (!signature) {
  return new Response(
    JSON.stringify({ error: 'Signature manquante' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

## Vérifications Post-Correction

✅ **CORS fonctionne** - OPTIONS retourne 200  
✅ **Signature manquante** - POST sans signature retourne 400  
✅ **Méthodes non supportées** - GET retourne 405  
✅ **Accès public** - Plus d'erreur 401

## URL du Webhook
```
https://tidslxypgfettpguqwxn.supabase.co/functions/v1/stripe-webhook
```

## Scripts Utiles

### Déploiement Automatique
```powershell
.\scripts\deploy-stripe-webhook.ps1
```

### Test de la Fonction
```bash
node scripts/test-stripe-webhook.js
```

## Prochaines Étapes
1. Mettre à jour l'URL du webhook dans Stripe Dashboard
2. Tester avec de vrais événements Stripe
3. Vérifier que les abonnements sont correctement traités dans la base de données

## Événements Stripe Supportés
- `checkout.session.completed` - Nouveau paiement
- `invoice.payment_succeeded` - Paiement de facture réussi  
- `customer.subscription.updated` - Abonnement modifié
- `customer.subscription.deleted` - Abonnement annulé