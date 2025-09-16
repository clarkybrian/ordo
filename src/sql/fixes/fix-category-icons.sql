-- Script pour corriger les icônes des catégories existantes
-- À exécuter dans l'éditeur SQL de Supabase

-- Mettre à jour les icônes des catégories existantes avec de vraies icônes emoji
UPDATE public.categories 
SET icon = CASE 
  WHEN LOWER(name) LIKE '%banque%' OR LOWER(name) LIKE '%bank%' THEN '🏦'
  WHEN LOWER(name) LIKE '%personnel%' OR LOWER(name) LIKE '%personal%' THEN '👤'
  WHEN LOWER(name) LIKE '%travail%' OR LOWER(name) LIKE '%work%' OR LOWER(name) LIKE '%job%' THEN '💼'
  WHEN LOWER(name) LIKE '%facture%' OR LOWER(name) LIKE '%bill%' OR LOWER(name) LIKE '%invoice%' THEN '📄'
  WHEN LOWER(name) LIKE '%billet%' OR LOWER(name) LIKE '%ticket%' OR LOWER(name) LIKE '%transport%' THEN '🎫'
  WHEN LOWER(name) LIKE '%promotion%' OR LOWER(name) LIKE '%promo%' OR LOWER(name) LIKE '%deal%' THEN '🏷️'
  WHEN LOWER(name) LIKE '%social%' OR LOWER(name) LIKE '%facebook%' OR LOWER(name) LIKE '%twitter%' OR LOWER(name) LIKE '%instagram%' THEN '📱'
  WHEN LOWER(name) LIKE '%publicité%' OR LOWER(name) LIKE '%pub%' OR LOWER(name) LIKE '%marketing%' OR LOWER(name) LIKE '%spam%' THEN '📢'
  WHEN LOWER(name) LIKE '%offre%' OR LOWER(name) LIKE '%emploi%' OR LOWER(name) LIKE '%job%' THEN '💼'
  ELSE '📧'
END
WHERE icon IS NULL OR icon = '' OR icon LIKE '%◆%' OR LENGTH(icon) > 4;

-- Vérifier les résultats
SELECT id, user_id, name, color, icon 
FROM public.categories 
ORDER BY user_id, name;
