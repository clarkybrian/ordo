-- Script SQL pour créer les catégories de base dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajouter une colonne is_default si elle n'existe pas
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- IMPORTANT: Ce script ne crée pas de catégories globales
-- Les catégories sont créées automatiquement pour chaque utilisateur via le trigger
-- Ce script sert uniquement à mettre à jour le trigger pour inclure toutes les catégories

-- Ajouter une colonne is_default si elle n'existe pas
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Mettre à jour le trigger pour inclure la colonne is_default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Créer les catégories par défaut pour le nouvel utilisateur
  INSERT INTO public.categories (user_id, name, color, icon, is_default, is_auto_generated)
  SELECT 
    NEW.id,
    name,
    color, 
    icon,
    true,
    false
  FROM (VALUES
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
  ) AS default_categories(name, color, icon);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pour les utilisateurs existants, ajouter les nouvelles catégories manquantes
-- E-commerce
INSERT INTO categories (user_id, name, color, icon, is_default, is_auto_generated)
SELECT 
  u.id,
  'E-commerce',
  '#8b5cf6',
  '🛍️',
  true,
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = 'E-commerce'
);

-- Voyages
INSERT INTO categories (user_id, name, color, icon, is_default, is_auto_generated)
SELECT 
  u.id,
  'Voyages',
  '#3b82f6',
  '✈️',
  true,
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = 'Voyages'
);

-- Newsletter
INSERT INTO categories (user_id, name, color, icon, is_default, is_auto_generated)
SELECT 
  u.id,
  'Newsletter',
  '#6b7280',
  '📰',
  true,
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = 'Newsletter'
);

-- Sécurité
INSERT INTO categories (user_id, name, color, icon, is_default, is_auto_generated)
SELECT 
  u.id,
  'Sécurité',
  '#dc2626',
  '🔒',
  true,
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = 'Sécurité'
);

-- Formation
INSERT INTO categories (user_id, name, color, icon, is_default, is_auto_generated)
SELECT 
  u.id,
  'Formation',
  '#06b6d4',
  '🎓',
  true,
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = 'Formation'
);

-- Santé
INSERT INTO categories (user_id, name, color, icon, is_default, is_auto_generated)
SELECT 
  u.id,
  'Santé',
  '#84cc16',
  '🏥',
  true,
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = 'Santé'
);

-- Immobilier
INSERT INTO categories (user_id, name, color, icon, is_default, is_auto_generated)
SELECT 
  u.id,
  'Immobilier',
  '#f97316',
  '🏠',
  true,
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = 'Immobilier'
);
