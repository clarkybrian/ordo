-- Script SQL à exécuter dans le SQL Editor de Supabase Dashboard
-- Création de la table contacts pour l'assistant email intelligent

-- 1. Créer la table contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  name VARCHAR,
  last_interaction TIMESTAMP,
  interaction_count INTEGER DEFAULT 0,
  context_summary TEXT,
  avatar_url VARCHAR,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_interaction_count ON contacts(interaction_count DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON contacts(last_interaction DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING GIN(
  to_tsvector('french', COALESCE(name, '') || ' ' || email)
);

-- 3. Fonction pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour updated_at
DROP TRIGGER IF EXISTS contacts_updated_at_trigger ON contacts;
CREATE TRIGGER contacts_updated_at_trigger
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- 5. Vue pour contacts actifs
CREATE OR REPLACE VIEW active_contacts AS
SELECT 
  c.*,
  CASE 
    WHEN c.last_interaction > NOW() - INTERVAL '7 days' THEN 'recent'
    WHEN c.last_interaction > NOW() - INTERVAL '30 days' THEN 'active'
    ELSE 'inactive'
  END as activity_status
FROM contacts c
ORDER BY c.interaction_count DESC, c.last_interaction DESC;

-- 6. Politiques RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);