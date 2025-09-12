-- SCRIPT FINAL SIMPLE POUR L'ASSISTANT - COPY/PASTE DANS SUPABASE
-- (ignorez les erreurs VS Code, c'est normal pour PostgreSQL)

-- 1. Créer une fonction simple qui marche
CREATE OR REPLACE FUNCTION public.increment_assistant_usage(user_uuid UUID)
RETURNS TABLE (
    question_count INTEGER,
    remaining_questions INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count INTEGER := 0;
BEGIN
    -- Insérer ou incrémenter
    INSERT INTO public.assistant_usage (user_id, question_count, last_reset_date)
    VALUES (user_uuid, 1, CURRENT_DATE)
    ON CONFLICT (user_id, last_reset_date) 
    DO UPDATE SET 
        question_count = assistant_usage.question_count + 1
    RETURNING assistant_usage.question_count INTO current_count;
    
    -- Retourner les valeurs
    RETURN QUERY SELECT 
        current_count,
        GREATEST(0, 4 - current_count);
END;
$$;
