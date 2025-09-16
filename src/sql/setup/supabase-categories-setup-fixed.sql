-- Script SQL corrigé pour Supabase - Catégories de base Ordo
-- À copier-coller dans l'éditeur SQL de Supabase Dashboard

-- 1. Ajouter la colonne is_default si elle n'existe pas
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 2. Créer ou remplacer la fonction pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Créer les catégories par défaut pour le nouvel utilisateur
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

-- 3. Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Pour les utilisateurs existants, créer un script de migration
-- ATTENTION: Exécuter seulement si vous voulez ajouter les nouvelles catégories aux utilisateurs existants

-- Décommentez et exécutez les lignes suivantes si nécessaire:

/*
-- Migration pour utilisateurs existants
DO $$
DECLARE
  user_record RECORD;
  category_record RECORD;
BEGIN
  -- Liste des catégories par défaut
  FOR category_record IN 
    SELECT * FROM (VALUES
      ('Banque', '#10b981', '🏦'),
      ('Travail', '#f59e0b', '💼'),
      ('Factures', '#ef4444', '📄'),
      ('Réseaux sociaux', '#8b5cf6', '📱'),
      ('Promotions', '#f59e0b', '🏷️'),
      ('Support Client', '#06b6d4', '🎧'),
      ('E-commerce', '#8b5cf6', '🛍️'),
      ('Voyages', '#3b82f6', '✈️'),
      ('Newsletter', '#6b7280', '📰'),
      ('Sécurité', '#dc2626', '🔒'),
      ('Formation', '#06b6d4', '🎓'),
      ('Santé', '#84cc16', '🏥'),
      ('Immobilier', '#f97316', '🏠')
    ) AS categories(name, color, icon)
  LOOP
    -- Pour chaque utilisateur existant
    FOR user_record IN SELECT id FROM auth.users LOOP
      -- Vérifier si la catégorie existe déjà pour cet utilisateur
      IF NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE user_id = user_record.id AND name = category_record.name
      ) THEN
        -- Créer la catégorie
        INSERT INTO categories (user_id, name, color, icon, is_default, is_auto_generated)
        VALUES (user_record.id, category_record.name, category_record.color, category_record.icon, true, false);
        
        RAISE NOTICE 'Catégorie % créée pour utilisateur %', category_record.name, user_record.id;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
*/
