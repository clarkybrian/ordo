-- SCRIPT DE RÉPARAT  -- Ensuite créer les catégories par défaut (8 catégories avec icônes corrigées)
  INSERT INTO public.categories (user_id, name, color, icon, is_default, is_auto_generated)
  VALUES
    (NEW.id, 'Banque', '#10b981', '🏦', true, false),
    (NEW.id, 'Personnel', '#8b5cf6', '👤', true, false),
    (NEW.id, 'Travail', '#f59e0b', '💼', true, false),
    (NEW.id, 'Factures', '#ef4444', '📄', true, false),
    (NEW.id, 'Billets', '#06b6d4', '🎫', true, false),
    (NEW.id, 'Promotions', '#f97316', '🏷️', true, false),
    (NEW.id, 'Réseaux sociaux', '#8b5cf6', '📱', true, false),
    (NEW.id, 'Publicité', '#f43f5e', '📢', true, false);THENTIFICATION ORDO
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer le trigger défaillant
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Ajouter la colonne is_auto_generated si elle n'existe pas
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE;

-- 4. Créer une nouvelle fonction trigger corrigée
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- D'abord créer le profil utilisateur
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Ensuite créer les catégories par défaut (8 catégories de base UNIQUEMENT)
  INSERT INTO public.categories (user_id, name, color, icon, is_default, is_auto_generated)
  VALUES
    (NEW.id, 'Banque', '#10b981', '🏦', true, false),
    (NEW.id, 'Personnel', '#8b5cf6', '�', true, false),
    (NEW.id, 'Travail', '#f59e0b', '�', true, false),
    (NEW.id, 'Factures', '#ef4444', '📄', true, false),
    (NEW.id, 'Billets', '#06b6d4', '�', true, false),
    (NEW.id, 'Promotions', '#f97316', '🏷️', true, false),
    (NEW.id, 'Réseaux sociaux', '#8b5cf6', '�', true, false),
    (NEW.id, 'Publicité', '#f43f5e', '📢', true, false);
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on log mais on ne fait pas échouer l'inscription
    RAISE LOG 'Erreur lors de la création des catégories par défaut pour l''utilisateur %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Nettoyer les données corrompues potentielles
-- (Optionnel - supprimer les utilisateurs qui n'ont pas de profil)
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Script de réparation de l''authentification exécuté avec succès !';
  RAISE NOTICE 'Les nouveaux utilisateurs auront maintenant automatiquement leurs catégories par défaut.';
END $$;
