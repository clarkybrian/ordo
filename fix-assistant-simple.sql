-- ✅ SCRIPT SIMPLE POUR CORRIGER LES ERREURS SQL ASSISTANT
-- À copier-coller dans l'éditeur SQL de Supabase

-- 1. D'abord, créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.assistant_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_count INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, last_reset_date)
);

-- 2. Activer RLS
ALTER TABLE public.assistant_usage ENABLE ROW LEVEL SECURITY;

-- 3. Politique RLS
DROP POLICY IF EXISTS "Users can manage their own usage" ON public.assistant_usage;
CREATE POLICY "Users can manage their own usage" ON public.assistant_usage
    FOR ALL USING (auth.uid() = user_id);

-- 4. Fonction simple d'incrémentation (version corrigée)
CREATE OR REPLACE FUNCTION public.increment_assistant_usage(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count INTEGER := 0;
    result JSON;
BEGIN
    -- Insérer ou mettre à jour
    INSERT INTO public.assistant_usage (user_id, question_count, last_reset_date)
    VALUES (user_uuid, 1, CURRENT_DATE)
    ON CONFLICT (user_id, last_reset_date) 
    DO UPDATE SET 
        question_count = assistant_usage.question_count + 1,
        updated_at = NOW()
    RETURNING question_count INTO current_count;
    
    -- Créer le JSON de retour
    result := json_build_object(
        'question_count', current_count,
        'remaining_questions', GREATEST(0, 4 - current_count),
        'success', true
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'error', SQLERRM,
        'success', false
    );
END;
$$;

-- 5. Test (décommentez si vous voulez tester)
-- SELECT public.increment_assistant_usage(auth.uid());
