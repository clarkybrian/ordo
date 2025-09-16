-- Script SQL pour créer la table des emails envoyés
-- À exécuter dans l'éditeur SQL de Supabase (VERSION CORRIGÉE)

-- 1. Créer d'abord la fonction trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Créer la table sent_emails
CREATE TABLE IF NOT EXISTS public.sent_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Informations du destinataire
  to_email text NOT NULL,
  to_name text,
  
  -- Contenu de l'email
  subject text NOT NULL,
  body_html text,
  body_text text,

  -- Email original auquel on répond (optionnel)
  reply_to_email_id uuid REFERENCES public.emails(id) ON DELETE SET NULL,
  original_thread_id text,
  original_message_id text,

  -- Métadonnées d'envoi
  sent_at timestamptz DEFAULT now() NOT NULL,
  gmail_message_id text, -- ID du message dans Gmail après envoi
  status text DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'failed')),

  -- Informations techniques
  attachments jsonb DEFAULT '[]'::jsonb,
  ai_assisted boolean DEFAULT false, -- Indique si l'IA a aidé à rédiger
  ai_improvements text, -- Améliorations suggérées par l'IA

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Créer les index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_sent_emails_user_id ON public.sent_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON public.sent_emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_emails_reply_to ON public.sent_emails(reply_to_email_id);

-- 4. Activer RLS (Row Level Security)
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques de sécurité
CREATE POLICY "Users can view own sent emails" ON public.sent_emails
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sent emails" ON public.sent_emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sent emails" ON public.sent_emails
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Créer le trigger pour mettre à jour updated_at (APRÈS la création de la table)
CREATE TRIGGER update_sent_emails_updated_at
  BEFORE UPDATE ON public.sent_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Ajouter les commentaires sur la table
COMMENT ON TABLE public.sent_emails IS 'Emails envoyés depuis l''application Orton';
COMMENT ON COLUMN public.sent_emails.ai_assisted IS 'Indique si l''IA a aidé à rédiger cet email';
COMMENT ON COLUMN public.sent_emails.ai_improvements IS 'Améliorations suggérées par l''IA';
COMMENT ON COLUMN public.sent_emails.status IS 'Statut de l''email : draft, sent, failed';

-- 8. Message de confirmation
SELECT 'Table sent_emails créée avec succès !' as status;
