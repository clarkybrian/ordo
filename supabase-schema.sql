-- Tables pour Ordo - Email Classification PWA
-- À exécuter dans Supabase SQL Editor

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (étend auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro', 'premium')),
  gmail_connected BOOLEAN DEFAULT FALSE,
  gmail_refresh_token TEXT,
  sync_frequency INTEGER DEFAULT 12, -- heures entre syncs
  last_sync TIMESTAMP WITH TIME ZONE,
  emails_quota_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des catégories d'emails
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT NOT NULL DEFAULT '📁',
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Table des emails
CREATE TABLE public.emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  gmail_id TEXT NOT NULL,
  thread_id TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subject TEXT,
  sender_name TEXT,
  sender_email TEXT NOT NULL,
  recipient_email TEXT,
  body_text TEXT,
  body_html TEXT,
  snippet TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  labels TEXT[] DEFAULT '{}',
  has_attachments BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3,2), -- Score de confiance de la classification IA
  manually_classified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, gmail_id)
);

-- Table des pièces jointes
CREATE TABLE public.email_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT, -- Chemin dans Supabase Storage
  gmail_attachment_id TEXT,
  extracted_text TEXT, -- Texte extrait par OCR
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'historique de synchronisation
CREATE TABLE public.sync_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'automatic', 'initial')),
  emails_processed INTEGER DEFAULT 0,
  emails_new INTEGER DEFAULT 0,
  emails_classified INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les modèles de classification IA (apprentissage)
CREATE TABLE public.classification_training (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE NOT NULL,
  old_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  new_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('correct', 'move', 'star', 'unstar')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les abonnements (Stripe)
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour les performances
CREATE INDEX idx_emails_user_id ON public.emails(user_id);
CREATE INDEX idx_emails_received_at ON public.emails(received_at DESC);
CREATE INDEX idx_emails_category_id ON public.emails(category_id);
CREATE INDEX idx_emails_gmail_id ON public.emails(gmail_id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_attachments_email_id ON public.email_attachments(email_id);
CREATE INDEX idx_sync_history_user_id ON public.sync_history(user_id);

-- RLS (Row Level Security) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies pour categories
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Policies pour emails
CREATE POLICY "Users can manage own emails" ON public.emails FOR ALL USING (auth.uid() = user_id);

-- Policies pour attachments
CREATE POLICY "Users can manage own attachments" ON public.email_attachments FOR ALL 
USING (auth.uid() = (SELECT user_id FROM public.emails WHERE emails.id = email_attachments.email_id));

-- Policies pour sync_history
CREATE POLICY "Users can view own sync history" ON public.sync_history FOR ALL USING (auth.uid() = user_id);

-- Policies pour classification_training
CREATE POLICY "Users can manage own training data" ON public.classification_training FOR ALL USING (auth.uid() = user_id);

-- Policies pour subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- Fonction pour créer un profil automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Créer les catégories par défaut
  INSERT INTO public.categories (user_id, name, color, icon, is_default) VALUES
    (NEW.id, 'Factures', '#ef4444', '📄', TRUE),
    (NEW.id, 'Billets', '#3b82f6', '🎫', TRUE),
    (NEW.id, 'Banque', '#10b981', '🏦', TRUE),
    (NEW.id, 'Travail', '#f59e0b', '💼', TRUE),
    (NEW.id, 'Personnel', '#8b5cf6', '👤', TRUE);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
