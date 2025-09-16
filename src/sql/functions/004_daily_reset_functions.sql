-- Fonction: Réinitialisation automatique des quotas journaliers
-- À exécuter dans Supabase SQL Editor

-- Fonction pour réinitialiser le quota d'un utilisateur spécifique
CREATE OR REPLACE FUNCTION reset_daily_quota(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    emails_quota_used = 0,
    last_quota_reset = CURRENT_DATE
  WHERE id = user_id
    AND (last_quota_reset IS NULL OR last_quota_reset < CURRENT_DATE);
    
  IF NOT FOUND THEN
    -- L'utilisateur n'existe pas ou le quota est déjà à jour
    RAISE NOTICE 'Aucune réinitialisation nécessaire pour l''utilisateur %', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour réinitialiser tous les quotas qui en ont besoin
CREATE OR REPLACE FUNCTION reset_all_expired_quotas()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE public.profiles 
  SET 
    emails_quota_used = 0,
    last_quota_reset = CURRENT_DATE
  WHERE last_quota_reset IS NULL 
     OR last_quota_reset < CURRENT_DATE;
     
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RAISE NOTICE 'Quotas réinitialisés pour % utilisateur(s)', affected_rows;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction intelligente qui vérifie et réinitialise si nécessaire
CREATE OR REPLACE FUNCTION check_and_reset_quota(user_id UUID)
RETURNS TABLE (
  was_reset BOOLEAN,
  current_quota_used INTEGER,
  quota_limit INTEGER,
  quota_remaining INTEGER
) AS $$
DECLARE
  user_plan TEXT;
  current_used INTEGER;
  daily_limit INTEGER;
  was_reset_flag BOOLEAN := FALSE;
BEGIN
  -- Récupérer les infos actuelles
  SELECT 
    COALESCE(subscription_type, 'free'),
    COALESCE(emails_quota_used, 0)
  INTO user_plan, current_used
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Vérifier si l'utilisateur existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur avec ID % non trouvé', user_id;
  END IF;
  
  -- Déterminer la limite selon le plan
  daily_limit := CASE 
    WHEN user_plan = 'premium' THEN 55
    WHEN user_plan = 'pro' THEN 20
    ELSE 3
  END;
  
  -- Réinitialiser si nécessaire
  PERFORM reset_daily_quota(user_id);
  
  -- Récupérer les nouvelles valeurs
  SELECT COALESCE(emails_quota_used, 0)
  INTO current_used
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Déterminer si une réinitialisation a eu lieu
  was_reset_flag := (current_used = 0);
  
  RETURN QUERY SELECT 
    was_reset_flag,
    current_used,
    daily_limit,
    (daily_limit - current_used);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions appropriées
GRANT EXECUTE ON FUNCTION reset_daily_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_all_expired_quotas() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_reset_quota(UUID) TO authenticated;

-- Créer un trigger pour mettre à jour updated_at quand emails_quota_used change
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger (s'il n'existe pas déjà)
DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON public.profiles;
CREATE TRIGGER profiles_updated_at_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Test des fonctions (à commenter après utilisation)
/*
-- Tester la réinitialisation pour un utilisateur
SELECT * FROM check_and_reset_quota('your-user-id-here');

-- Tester la réinitialisation globale
SELECT reset_all_expired_quotas();
*/