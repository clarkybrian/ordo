-- Table pour suivre l'utilisation de l'assistant
CREATE TABLE IF NOT EXISTS assistant_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_count INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_assistant_usage_user_id ON assistant_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_usage_date ON assistant_usage(last_reset_date);

-- RLS (Row Level Security)
ALTER TABLE assistant_usage ENABLE ROW LEVEL SECURITY;

-- Politique pour que chaque utilisateur ne voit que ses données
CREATE POLICY "Users can view own assistant usage" ON assistant_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assistant usage" ON assistant_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assistant usage" ON assistant_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Fonction pour obtenir ou créer l'usage d'un utilisateur
CREATE OR REPLACE FUNCTION get_or_create_assistant_usage(user_uuid UUID)
RETURNS TABLE (
    question_count INTEGER,
    remaining_questions INTEGER,
    last_reset_date DATE
) AS $$
DECLARE
    usage_record RECORD;
    current_date_val DATE := CURRENT_DATE;
BEGIN
    -- Vérifier si un enregistrement existe pour cet utilisateur
    SELECT * INTO usage_record 
    FROM assistant_usage 
    WHERE user_id = user_uuid;
    
    -- Si aucun enregistrement n'existe, en créer un
    IF NOT FOUND THEN
        INSERT INTO assistant_usage (user_id, question_count, last_reset_date)
        VALUES (user_uuid, 0, current_date_val);
        
        RETURN QUERY SELECT 0 as question_count, 4 as remaining_questions, current_date_val as last_reset_date;
        RETURN;
    END IF;
    
    -- Si la date a changé, réinitialiser le compteur
    IF usage_record.last_reset_date < current_date_val THEN
        UPDATE assistant_usage 
        SET question_count = 0, 
            last_reset_date = current_date_val,
            updated_at = NOW()
        WHERE user_id = user_uuid;
        
        RETURN QUERY SELECT 0 as question_count, 4 as remaining_questions, current_date_val as last_reset_date;
        RETURN;
    END IF;
    
    -- Retourner les données actuelles
    RETURN QUERY SELECT 
        usage_record.question_count,
        GREATEST(0, 4 - usage_record.question_count) as remaining_questions,
        usage_record.last_reset_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur de questions
CREATE OR REPLACE FUNCTION increment_assistant_usage(user_uuid UUID)
RETURNS TABLE (
    question_count INTEGER,
    remaining_questions INTEGER
) AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- S'assurer qu'un enregistrement existe
    PERFORM get_or_create_assistant_usage(user_uuid);
    
    -- Incrémenter le compteur
    UPDATE assistant_usage 
    SET question_count = question_count + 1,
        updated_at = NOW()
    WHERE user_id = user_uuid 
    AND last_reset_date = CURRENT_DATE
    RETURNING assistant_usage.question_count INTO current_count;
    
    -- Retourner les nouvelles valeurs
    RETURN QUERY SELECT 
        current_count,
        GREATEST(0, 4 - current_count) as remaining_questions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
