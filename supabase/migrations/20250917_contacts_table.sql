-- Migration: Ajout de la table contacts pour l'assistant email intelligent
-- Timestamp: 2025-09-17_contacts_table

-- Table pour stocker les contacts extraits des emails
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  name VARCHAR,
  last_interaction TIMESTAMP,
  interaction_count INTEGER DEFAULT 0,
  context_summary TEXT, -- Résumé IA des dernières interactions
  avatar_url VARCHAR, -- URL de l'avatar si disponible
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Contrainte pour éviter les doublons
  UNIQUE(user_id, email)
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_interaction_count ON contacts(interaction_count DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON contacts(last_interaction DESC);

-- Index de recherche full-text pour la recherche de contacts
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING GIN(
  to_tsvector('french', COALESCE(name, '') || ' ' || email)
);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS contacts_updated_at_trigger ON contacts;
CREATE TRIGGER contacts_updated_at_trigger
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Vue pour obtenir les contacts les plus actifs
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

-- Fonction pour synchroniser les contacts automatiquement (appelée après synchronisation des emails)
CREATE OR REPLACE FUNCTION auto_sync_contacts_after_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Cette fonction sera utilisée pour déclencher la synchronisation des contacts
  -- quand de nouveaux emails sont ajoutés
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Politique RLS pour la sécurité des contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Note: Les vues héritent automatiquement des politiques RLS de leur table de base
-- Pas besoin de politique séparée pour active_contacts car elle se base sur contacts

-- Message de confirmation
SELECT 'Table contacts créée avec succès pour l''assistant email intelligent' as message;