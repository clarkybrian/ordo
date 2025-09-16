-- Fonction SQL pour incrémenter un champ numérique
-- Utilisée pour incrémenter emails_quota_used dans la table profiles

CREATE OR REPLACE FUNCTION increment_quota_used(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET emails_quota_used = COALESCE(emails_quota_used, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;