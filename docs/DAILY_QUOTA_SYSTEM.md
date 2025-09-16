# Documentation: Système de Quotas Journaliers

## Vue d'ensemble

Le système de quotas journaliers pour Ordo permet de limiter le nombre de questions que chaque utilisateur peut poser par jour selon son plan d'abonnement.

### Limites par plan
- **Gratuit**: 3 questions/jour
- **Pro**: 20 questions/jour  
- **Premium**: 55 questions/jour

## Scripts SQL à exécuter

### Installation complète
```sql
-- Exécuter dans Supabase SQL Editor
\i INSTALL_DAILY_QUOTA_SYSTEM.sql
```

### Installation manuelle (dans l'ordre)
1. `001_add_daily_quota_system.sql` - Ajoute le champ `last_quota_reset`
2. `002_quota_management_functions.sql` - Fonctions de gestion des quotas
3. `003_update_daily_limits.sql` - Met à jour les limites existantes
4. `004_daily_reset_functions.sql` - Fonctions de réinitialisation

## Fonctions SQL disponibles

### `increment_quota_used(user_id UUID)`
Incrémente le compteur de questions utilisées pour un utilisateur.
```sql
SELECT increment_quota_used('user-uuid-here');
```

### `get_user_quota(user_id UUID)`
Retourne les informations de quota d'un utilisateur.
```sql
SELECT * FROM get_user_quota('user-uuid-here');
```

### `check_and_reset_quota(user_id UUID)`
Vérifie et réinitialise automatiquement le quota si nécessaire.
```sql
SELECT * FROM check_and_reset_quota('user-uuid-here');
```

### `reset_all_expired_quotas()`
Réinitialise tous les quotas expirés (utile pour un job CRON).
```sql
SELECT reset_all_expired_quotas();
```

## Vue `user_quota_status`

Fournit une vue d'ensemble des quotas de tous les utilisateurs :
```sql
SELECT * FROM user_quota_status 
WHERE needs_daily_reset = true;
```

Colonnes disponibles :
- `id` - ID utilisateur
- `email` - Email utilisateur
- `subscription_type` - Type d'abonnement
- `quota_used` - Questions utilisées aujourd'hui
- `quota_limit` - Limite journalière
- `quota_remaining` - Questions restantes
- `needs_daily_reset` - Nécessite une réinitialisation

## Intégration avec le code TypeScript

Le service `SubscriptionService` doit être mis à jour pour utiliser ces nouvelles fonctions :

```typescript
// Dans subscription.ts
async recordQuestionUsed(userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_quota_used', {
    user_id: userId
  });
  
  if (error) {
    console.error('❌ Erreur incrémentation quota:', error);
  }
}

async getUserPlan(userId: string): Promise<UserPlan> {
  // Utiliser check_and_reset_quota pour vérification + reset automatique
  const { data, error } = await supabase.rpc('check_and_reset_quota', {
    user_id: userId
  });
  
  if (error || !data?.[0]) throw error;
  
  const quota = data[0];
  return {
    type: 'free', // À récupérer depuis profiles
    status: 'active',
    questionsLimit: quota.quota_limit,
    questionsUsed: quota.current_quota_used,
    questionsRemaining: quota.quota_remaining,
    aiModel: 'gpt-3.5-turbo' // Selon le plan
  };
}
```

## Maintenance

### Job CRON pour réinitialisation automatique
Il est recommandé de créer un job CRON qui s'exécute quotidiennement à minuit :

```sql
-- À programmer dans Supabase ou via un webhook externe
SELECT reset_all_expired_quotas();
```

### Monitoring des quotas
```sql
-- Voir les utilisateurs qui approchent leur limite
SELECT * FROM user_quota_status 
WHERE quota_remaining <= 1 
  AND quota_remaining > 0;

-- Statistiques d'utilisation
SELECT 
  subscription_type,
  COUNT(*) as total_users,
  AVG(quota_used) as avg_usage,
  COUNT(*) FILTER (WHERE quota_used >= quota_limit) as users_at_limit
FROM user_quota_status
GROUP BY subscription_type;
```

## Sécurité

- Toutes les fonctions utilisent `SECURITY DEFINER` pour un contrôle d'accès approprié
- Les permissions sont accordées uniquement aux utilisateurs `authenticated`
- Les quotas sont réinitialisés automatiquement et de façon atomique

## Rollback

En cas de problème, pour revenir en arrière :
```sql
-- Supprimer les fonctions
DROP FUNCTION IF EXISTS increment_quota_used(UUID);
DROP FUNCTION IF EXISTS get_user_quota(UUID);
DROP FUNCTION IF EXISTS reset_daily_quota(UUID);
DROP FUNCTION IF EXISTS reset_all_expired_quotas();
DROP FUNCTION IF EXISTS check_and_reset_quota(UUID);

-- Supprimer la vue
DROP VIEW IF EXISTS user_quota_status;

-- Supprimer la colonne (ATTENTION: perte de données)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_quota_reset;
```