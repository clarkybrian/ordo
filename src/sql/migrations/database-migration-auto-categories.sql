-- Migration pour ajouter le support des catégories auto-générées
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne is_auto_generated à la table categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE;

-- Marquer les catégories existantes comme créées manuellement (par défaut)
UPDATE public.categories 
SET is_auto_generated = FALSE 
WHERE is_auto_generated IS NULL;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.categories.is_auto_generated IS 'Indique si la catégorie a été créée automatiquement par l''IA (true) ou manuellement par l''utilisateur (false)';

-- Mettre à jour la politique RLS si nécessaire (optionnel - pour s'assurer que les utilisateurs voient leurs catégories auto-générées)
-- Les catégories auto-générées doivent être visibles par leurs propriétaires
-- Cette politique devrait déjà être couverte par les politiques existantes basées sur user_id
