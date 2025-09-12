-- SCRIPT SQL FINAL À EXÉCUTER DANS SUPABASE
-- Ce script corrige TOUS les problèmes SQL identifiés

-- 1. Nettoyer et recréer la fonction increment_assistant_usage
DROP FUNCTION IF EXISTS increment_assistant_usage(UUID);

CREATE OR REPLACE FUNCTION increment_assistant_usage(user_uuid UUID)
RETURNS TABLE (
    question_count INTEGER,
    remaining_questions INTEGER
) AS $$
DECLARE
    current_count INTEGER := 0;
BEGIN
    -- Vérifier si un enregistrement existe pour aujourd'hui
    SELECT au.question_count INTO current_count 
    FROM public.assistant_usage au
    WHERE au.user_id = user_uuid 
    AND au.last_reset_date = CURRENT_DATE;
    
    -- Si pas d'enregistrement pour aujourd'hui, en créer un
    IF current_count IS NULL THEN
        INSERT INTO public.assistant_usage (user_id, question_count, last_reset_date, created_at, updated_at)
        VALUES (user_uuid, 1, CURRENT_DATE, NOW(), NOW());
        current_count := 1;
    ELSE
        -- Incrémenter le compteur existant
        UPDATE public.assistant_usage 
        SET question_count = question_count + 1,
            updated_at = NOW()
        WHERE user_id = user_uuid 
        AND last_reset_date = CURRENT_DATE;
        current_count := current_count + 1;
    END IF;
    
    -- Retourner les résultats
    RETURN QUERY SELECT 
        current_count AS question_count,
        GREATEST(0, 4 - current_count) AS remaining_questions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corriger les icônes des catégories
UPDATE public.categories 
SET icon = CASE 
  WHEN LOWER(name) LIKE '%banque%' THEN '🏦'
  WHEN LOWER(name) LIKE '%personnel%' THEN '👤'
  WHEN LOWER(name) LIKE '%travail%' THEN '💼'
  WHEN LOWER(name) LIKE '%facture%' THEN '📄'
  WHEN LOWER(name) LIKE '%billet%' THEN '🎫'
  WHEN LOWER(name) LIKE '%promotion%' THEN '🏷️'
  WHEN LOWER(name) LIKE '%social%' THEN '📱'
  WHEN LOWER(name) LIKE '%publicité%' THEN '📢'
  WHEN LOWER(name) LIKE '%offre%' OR LOWER(name) LIKE '%emploi%' THEN '💼'
  ELSE '📧'
END
WHERE icon IS NULL OR icon = '' OR LENGTH(icon) > 4;

-- 3. Tester la fonction
-- SELECT * FROM increment_assistant_usage('55bb2e10-5803-4430-8bc2-1d6c18fa39f7'::uuid);

-- 4. Vérifier les résultats
SELECT 'Fonction créée avec succès' as status;
