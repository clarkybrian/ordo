-- Fonction: Incrémentation atomique du quota utilisé
-- À exécuter dans Supabase SQL Editor

-- Fonction pour incrémenter emails_quota_used de façon atomique
CREATE OR REPLACE FUNCTION increment_quota_used(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Incrémenter le compteur de façon atomique
  UPDATE public.profiles 
  SET emails_quota_used = COALESCE(emails_quota_used, 0) + 1
  WHERE id = user_id;
  
  -- Vérifier que l'utilisateur existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur avec ID % non trouvé', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le quota actuel d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_quota(user_id UUID)
RETURNS TABLE (
  subscription_type TEXT,
  emails_quota_used INTEGER,
  last_quota_reset DATE,
  needs_reset BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.subscription_type,
    COALESCE(p.emails_quota_used, 0) as emails_quota_used,
    COALESCE(p.last_quota_reset, CURRENT_DATE) as last_quota_reset,
    (COALESCE(p.last_quota_reset, CURRENT_DATE) < CURRENT_DATE) as needs_reset
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions appropriées
GRANT EXECUTE ON FUNCTION increment_quota_used(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_quota(UUID) TO authenticated;

-- Test de la fonction (optionnel - à commenter après test)
/*
-- Tester avec un utilisateur existant
SELECT increment_quota_used('your-user-id-here');
SELECT * FROM get_user_quota('your-user-id-here');
*/