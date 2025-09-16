-- SCRIPT DE RÉPARATION RAPIDE - DÉSACTIVER LE TRIGGER DÉFAILLANT
-- À exécuter en URGENT dans Supabase SQL Editor

-- 1. Désactiver le trigger défaillant
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Désactiver la fonction défaillante
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Message de confirmation
SELECT 'Trigger défaillant supprimé - authentification réparée !' as status;
