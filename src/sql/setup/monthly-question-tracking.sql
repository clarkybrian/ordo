-- Table pour tracker l'utilisation mensuelle des questions
CREATE TABLE public.monthly_question_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL, -- Format: "2025-09"
  questions_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Index pour performances
CREATE INDEX idx_monthly_usage_user_month ON public.monthly_question_usage(user_id, month);
CREATE INDEX idx_monthly_usage_month ON public.monthly_question_usage(month);

-- RLS
ALTER TABLE public.monthly_question_usage ENABLE ROW LEVEL SECURITY;

-- Policy pour usage mensuel
CREATE POLICY "Users can view own monthly usage" ON public.monthly_question_usage FOR ALL USING (auth.uid() = user_id);

-- Fonction pour incrémenter les questions mensuelles
CREATE OR REPLACE FUNCTION public.increment_monthly_questions(
  p_user_id UUID,
  p_month TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.monthly_question_usage (user_id, month, questions_used)
  VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET 
    questions_used = monthly_question_usage.questions_used + 1,
    updated_at = NOW();
END;
$$;

-- Trigger pour updated_at
CREATE TRIGGER handle_updated_at_monthly_usage 
  BEFORE UPDATE ON public.monthly_question_usage 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();