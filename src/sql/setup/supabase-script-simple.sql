-- SCRIPT SUPABASE - CATÉGORIES ORDO
-- Copier-coller ce code dans l'éditeur SQL de Supabase

-- 1. Ajouter colonne is_default
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 2. Fonction trigger pour nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, icon, is_default, is_auto_generated)
  VALUES
    (NEW.id, 'Banque', '#10b981', '🏦', true, false),
    (NEW.id, 'Travail', '#f59e0b', '💼', true, false),
    (NEW.id, 'Factures', '#ef4444', '📄', true, false),
    (NEW.id, 'Réseaux sociaux', '#8b5cf6', '📱', true, false),
    (NEW.id, 'Promotions', '#f59e0b', '🏷️', true, false),
    (NEW.id, 'Support Client', '#06b6d4', '🎧', true, false),
    (NEW.id, 'E-commerce', '#8b5cf6', '🛍️', true, false),
    (NEW.id, 'Voyages', '#3b82f6', '✈️', true, false),
    (NEW.id, 'Newsletter', '#6b7280', '📰', true, false),
    (NEW.id, 'Sécurité', '#dc2626', '🔒', true, false),
    (NEW.id, 'Formation', '#06b6d4', '🎓', true, false),
    (NEW.id, 'Santé', '#84cc16', '🏥', true, false),
    (NEW.id, 'Immobilier', '#f97316', '🏠', true, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recréer trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
