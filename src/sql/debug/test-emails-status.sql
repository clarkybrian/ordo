-- Script de test pour créer des emails non lus
-- À exécuter dans Supabase SQL Editor pour tester les filtres

-- Marquer quelques emails comme non lus pour tester le filtre
UPDATE public.emails 
SET is_read = false 
WHERE id IN (
  SELECT id 
  FROM public.emails 
  LIMIT 5
);

-- Marquer quelques emails comme importants pour tester le filtre  
UPDATE public.emails 
SET is_important = true 
WHERE id IN (
  SELECT id 
  FROM public.emails 
  WHERE is_read = false
  LIMIT 2
);

-- Vérifier les statistiques après modification
SELECT 
  COUNT(*) as total_emails,
  COUNT(CASE WHEN is_read = false THEN 1 END) as unread_emails,
  COUNT(CASE WHEN is_important = true THEN 1 END) as important_emails
FROM public.emails;

-- Voir quelques exemples d'emails non lus
SELECT subject, sender_name, is_read, is_important, received_at
FROM public.emails 
WHERE is_read = false
ORDER BY received_at DESC
LIMIT 5;
