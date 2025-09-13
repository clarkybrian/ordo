-- Table pour tracer les tentatives de désabonnement
CREATE TABLE IF NOT EXISTS unsubscribe_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL, -- ID de l'email Gmail
  email_subject TEXT,
  sender_email TEXT NOT NULL,
  unsubscribe_url TEXT,
  method TEXT CHECK (method IN ('header', 'content', 'manual')) DEFAULT 'header',
  status TEXT CHECK (status IN ('pending', 'success', 'failed', 'skipped')) DEFAULT 'pending',
  error_message TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Index pour éviter les doublons
  UNIQUE(user_id, email_id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE unsubscribe_requests ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs ne voient que leurs propres désabonnements
CREATE POLICY "Users can manage their own unsubscribe requests" ON unsubscribe_requests
  FOR ALL USING (auth.uid() = user_id);

-- Index pour les performances
CREATE INDEX idx_unsubscribe_requests_user_id ON unsubscribe_requests(user_id);
CREATE INDEX idx_unsubscribe_requests_sender ON unsubscribe_requests(sender_email);
CREATE INDEX idx_unsubscribe_requests_status ON unsubscribe_requests(status);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_unsubscribe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unsubscribe_requests_updated_at
  BEFORE UPDATE ON unsubscribe_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_unsubscribe_updated_at();
