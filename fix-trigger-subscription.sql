-- Corriger le trigger update_user_subscription_status
-- À exécuter dans Supabase SQL Editor

-- Afficher le trigger existant
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'update_user_subscription_status';

-- Supprimer et recréer la fonction du trigger
DROP FUNCTION IF EXISTS public.update_user_subscription_status() CASCADE;

CREATE OR REPLACE FUNCTION public.update_user_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement mettre à jour le profil utilisateur qui existe déjà
  UPDATE profiles
  SET 
    subscription_type = NEW.subscription_type,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger sur la table subscriptions
DROP TRIGGER IF EXISTS update_subscription_status ON public.subscriptions;

CREATE TRIGGER update_subscription_status
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_subscription_status();

-- Vérifier que le trigger est bien créé
SELECT tgname, tgtype, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgname = 'update_subscription_status';