-- Ajout du champ last_quota_reset à la table profiles
-- Ce champ permet de suivre précisément la dernière réinitialisation du quota

ALTER TABLE public.profiles 
ADD COLUMN last_quota_reset DATE DEFAULT CURRENT_DATE;

-- Mettre à jour les enregistrements existants
UPDATE public.profiles 
SET last_quota_reset = CURRENT_DATE 
WHERE last_quota_reset IS NULL;