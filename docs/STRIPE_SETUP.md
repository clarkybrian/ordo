# Configuration Stripe pour Ordo

## 🚀 Étapes d'implémentation

### 1. Configuration Stripe Dashboard

1. **Créer un compte Stripe** sur https://dashboard.stripe.com
2. **Créer les produits** :
   - Produit "Ordo Pro" → Prix récurrent mensuel 2.99€
   - Produit "Ordo Premium" → Prix récurrent mensuel 5.99€
3. **Récupérer les Price IDs** et les mettre dans `src/services/stripe.ts`
4. **Ajouter la clé secrète** dans `.env` : `STRIPE_SECRET_KEY=sk_test_...`

### 2. Déploiement de l'Edge Function

```bash
# Installer Supabase CLI
npm install -g @supabase/cli

# Se connecter à votre projet
supabase login
supabase link --project-ref tidslxypgfettpguqwxn

# Déployer la fonction
supabase functions deploy create-checkout-session

# Configurer les variables d'environnement
supabase secrets set STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
```

### 3. Configuration des webhooks Stripe

1. **Créer un webhook** dans Stripe Dashboard
2. **URL du webhook** : `https://tidslxypgfettpguqwxn.supabase.co/functions/v1/stripe-webhook`
3. **Événements à écouter** :
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 4. Flux utilisateur complet

```
Utilisateur clique "Choisir Pro" 
    ↓
handlePlanSelection('Pro') 
    ↓
createCheckoutSession('pro') 
    ↓
Edge Function crée session Stripe
    ↓
Redirection vers Stripe Checkout
    ↓
Paiement utilisateur
    ↓
Webhook met à jour la base de données
    ↓
Redirection vers /dashboard?payment=success
```

### 5. Tables de base de données à ajouter

```sql
-- Table des abonnements
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
```

### 6. Mise à jour du profil utilisateur

```sql
-- Ajouter le plan à la table profiles
ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free';
```

## ✅ Fonctionnalités implémentées

- [x] Service Stripe avec redirection automatique
- [x] Edge Function pour créer les sessions de paiement
- [x] Gestion des erreurs et authentification
- [x] Interface utilisateur mise à jour
- [x] Support du plan gratuit et des plans payants

## 🔧 Prochaines étapes

1. Configurer les vrais Price IDs Stripe
2. Déployer l'Edge Function sur Supabase
3. Configurer les webhooks pour la synchronisation
4. Ajouter les tables de gestion des abonnements
5. Tester le flux complet de paiement

## 🎯 Utilisation

Maintenant, quand un utilisateur clique sur un bouton de plan :
- **Plan Gratuit** → Authentification Google directe
- **Plan Pro/Premium** → Redirection vers Stripe Checkout avec le bon prix