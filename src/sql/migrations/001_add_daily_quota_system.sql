-- Migration: Ajout du système de quotas journaliers
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter le champ last_quota_reset à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_quota_reset DATE DEFAULT CURRENT_DATE;

-- 2. Mettre à jour les enregistrements existants
UPDATE public.profiles 
SET last_quota_reset = CURRENT_DATE 
WHERE last_quota_reset IS NULL;

-- 3. Créer un index pour optimiser les requêtes sur last_quota_reset
CREATE INDEX IF NOT EXISTS idx_profiles_last_quota_reset 
ON public.profiles (last_quota_reset);

-- 4. Ajouter un commentaire explicatif
COMMENT ON COLUMN public.profiles.last_quota_reset IS 'Date de la dernière réinitialisation du quota journalier (format YYYY-MM-DD)';

-- Vérification des changements
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'last_quota_reset';