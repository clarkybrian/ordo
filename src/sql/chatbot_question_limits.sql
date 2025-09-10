-- Table pour gérer les limites de questions du chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_question_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('detailed', 'quick')),
  question_count INTEGER NOT NULL DEFAULT 0,
  last_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons
  UNIQUE(user_id, question_type)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_chatbot_question_limits_user_type 
ON public.chatbot_question_limits(user_id, question_type);

CREATE INDEX IF NOT EXISTS idx_chatbot_question_limits_last_reset 
ON public.chatbot_question_limits(last_reset);

-- RLS (Row Level Security)
ALTER TABLE public.chatbot_question_limits ENABLE ROW LEVEL SECURITY;

-- Politique pour que chaque utilisateur ne puisse voir que ses propres limites
CREATE POLICY "Users can view their own question limits" 
ON public.chatbot_question_limits
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question limits" 
ON public.chatbot_question_limits
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question limits" 
ON public.chatbot_question_limits
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fonction pour incrémenter le compteur de questions
CREATE OR REPLACE FUNCTION public.increment_question_count(
  p_user_id UUID,
  p_question_type TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.chatbot_question_limits (user_id, question_type, question_count, last_reset)
  VALUES (p_user_id, p_question_type, 1, NOW())
  ON CONFLICT (user_id, question_type)
  DO UPDATE SET 
    question_count = chatbot_question_limits.question_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions pour la fonction
GRANT EXECUTE ON FUNCTION public.increment_question_count(UUID, TEXT) TO authenticated;

-- Fonction de nettoyage pour les anciennes entrées (plus de 7 jours)
CREATE OR REPLACE FUNCTION public.cleanup_old_question_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.chatbot_question_limits 
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.cleanup_old_question_limits() TO authenticated;
