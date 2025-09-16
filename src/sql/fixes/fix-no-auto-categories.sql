-- SCRIPT FINAL : AUCUNE CRÉATION AUTOMATIQUE DE CATÉGORIES
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Nouvelle fonction qui crée SEULEMENT les 7 catégories de base (sans Personnel)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer le profil utilisateur
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Créer SEULEMENT les 7 catégories de base (SANS Personnel)
  INSERT INTO public.categories (user_id, name, color, icon, is_default, is_auto_generated)
  VALUES
    (NEW.id, 'Travail', '#f59e0b', '💼', true, false),
    (NEW.id, 'Billets', '#06b6d4', '🎫', true, false),
    (NEW.id, 'Réseaux sociaux', '#8b5cf6', '📱', true, false),
    (NEW.id, 'Promotions', '#f97316', '🏷️', true, false),
    (NEW.id, 'Factures', '#ef4444', '📄', true, false),
    (NEW.id, 'Banque', '#10b981', '🏦', true, false),
    (NEW.id, 'Publicité', '#f43f5e', '📢', true, false);
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erreur création catégories de base pour %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Supprimer toutes les catégories auto-générées existantes (ATTENTION!)
DELETE FROM public.categories 
WHERE is_auto_generated = true 
AND name NOT IN ('Travail', 'Billets', 'Réseaux sociaux', 'Promotions', 'Factures', 'Banque', 'Publicité');

-- 5. Corriger les icônes
UPDATE public.categories 
SET icon = CASE 
  WHEN name = 'Travail' THEN '💼'
  WHEN name = 'Billets' THEN '🎫'
  WHEN name = 'Réseaux sociaux' THEN '📱'
  WHEN name = 'Promotions' THEN '🏷️'
  WHEN name = 'Factures' THEN '📄'
  WHEN name = 'Banque' THEN '🏦'
  WHEN name = 'Publicité' THEN '📢'
  ELSE icon
END
WHERE name IN ('Travail', 'Billets', 'Réseaux sociaux', 'Promotions', 'Factures', 'Banque', 'Publicité');

SELECT 'Script terminé - Seules les 7 catégories de base seront créées automatiquement' as status;
