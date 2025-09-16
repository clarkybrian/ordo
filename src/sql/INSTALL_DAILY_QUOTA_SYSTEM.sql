-- Script d'installation complète: Système de quotas journaliers pour Ordo
-- À exécuter dans Supabase SQL Editor dans l'ordre

-- =====================================================
-- ÉTAPE 1: EXÉCUTER LES MIGRATIONS
-- =====================================================

-- 1.1. Migration des quotas journaliers
\i 001_add_daily_quota_system.sql

-- 1.2. Mise à jour des limites
\i 003_update_daily_limits.sql

-- =====================================================
-- ÉTAPE 2: INSTALLER LES FONCTIONS
-- =====================================================

-- 2.1. Fonctions de gestion des quotas
\i 002_quota_management_functions.sql

-- 2.2. Fonctions de réinitialisation
\i 004_daily_reset_functions.sql

-- =====================================================
-- ÉTAPE 3: VÉRIFICATIONS POST-INSTALLATION
-- =====================================================

-- Vérifier que la colonne last_quota_reset existe
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'last_quota_reset';

-- Vérifier que les fonctions sont créées
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN (
  'increment_quota_used',
  'get_user_quota', 
  'reset_daily_quota',
  'reset_all_expired_quotas',
  'check_and_reset_quota'
) ORDER BY routine_name;

-- Vérifier la vue user_quota_status
SELECT viewname FROM pg_views WHERE viewname = 'user_quota_status';

-- Statistiques des quotas actuels
SELECT 
  subscription_type,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE emails_quota_used > 0) as users_with_usage,
  AVG(COALESCE(emails_quota_used, 0)) as avg_usage,
  MAX(COALESCE(emails_quota_used, 0)) as max_usage
FROM public.profiles 
GROUP BY subscription_type
ORDER BY subscription_type;

-- =====================================================
-- ÉTAPE 4: TESTS OPTIONNELS (décommenter pour tester)
-- =====================================================

/*
-- Test 1: Vérifier un utilisateur spécifique (remplacer l'ID)
SELECT * FROM get_user_quota('YOUR_USER_ID_HERE');

-- Test 2: Simuler l'utilisation d'une question
SELECT increment_quota_used('YOUR_USER_ID_HERE');
SELECT * FROM get_user_quota('YOUR_USER_ID_HERE');

-- Test 3: Tester la réinitialisation
SELECT * FROM check_and_reset_quota('YOUR_USER_ID_HERE');

-- Test 4: Vue des quotas
SELECT * FROM user_quota_status LIMIT 5;
*/

-- =====================================================
-- INSTALLATION TERMINÉE
-- =====================================================

SELECT 'Installation du système de quotas journaliers terminée avec succès!' as status;