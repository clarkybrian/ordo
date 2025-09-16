-- Mise à jour: Configuration des nouvelles limites journalières
-- À exécuter dans Supabase SQL Editor après avoir appliqué les migrations précédentes

-- 1. Mise à jour de tous les utilisateurs existants avec les nouvelles limites
-- Réinitialiser les quotas existants selon les nouveaux plafonds journaliers

-- Utilisateurs gratuits: maximum 3 questions par jour
UPDATE public.profiles 
SET 
  emails_quota_used = LEAST(COALESCE(emails_quota_used, 0), 3),
  last_quota_reset = CURRENT_DATE
WHERE subscription_type = 'free' OR subscription_type IS NULL;

-- Utilisateurs Pro: maximum 20 questions par jour  
UPDATE public.profiles 
SET 
  emails_quota_used = LEAST(COALESCE(emails_quota_used, 0), 20),
  last_quota_reset = CURRENT_DATE
WHERE subscription_type = 'pro';

-- Utilisateurs Premium: maximum 55 questions par jour
UPDATE public.profiles 
SET 
  emails_quota_used = LEAST(COALESCE(emails_quota_used, 0), 55),
  last_quota_reset = CURRENT_DATE
WHERE subscription_type = 'premium';

-- 2. Créer une vue pour faciliter la consultation des quotas
CREATE OR REPLACE VIEW user_quota_status AS
SELECT 
  p.id,
  p.email,
  p.subscription_type,
  COALESCE(p.emails_quota_used, 0) as quota_used,
  p.last_quota_reset,
  CASE 
    WHEN p.subscription_type = 'premium' THEN 55
    WHEN p.subscription_type = 'pro' THEN 20
    ELSE 3
  END as quota_limit,
  CASE 
    WHEN p.subscription_type = 'premium' THEN 55 - COALESCE(p.emails_quota_used, 0)
    WHEN p.subscription_type = 'pro' THEN 20 - COALESCE(p.emails_quota_used, 0)
    ELSE 3 - COALESCE(p.emails_quota_used, 0)
  END as quota_remaining,
  (COALESCE(p.last_quota_reset, CURRENT_DATE) < CURRENT_DATE) as needs_daily_reset
FROM public.profiles p;

-- Donner accès à la vue aux utilisateurs authentifiés
GRANT SELECT ON user_quota_status TO authenticated;

-- 3. Statistiques post-migration (pour vérification)
SELECT 
  subscription_type,
  COUNT(*) as user_count,
  AVG(emails_quota_used) as avg_quota_used,
  MAX(emails_quota_used) as max_quota_used
FROM public.profiles 
GROUP BY subscription_type
ORDER BY subscription_type;