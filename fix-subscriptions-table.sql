-- Corriger la table subscriptions pour Stripe
-- À exécuter dans Supabase SQL Editor

-- Vérifier si la table existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public') THEN
        -- Créer la table si elle n'existe pas
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
        
        RAISE NOTICE 'Table subscriptions créée';
    ELSE
        RAISE NOTICE 'Table subscriptions existe déjà';
    END IF;
END $$;

-- Vérifier les colonnes et les ajouter si nécessaire
DO $$
BEGIN
    -- Vérifier subscription_type
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'subscription_type') THEN
        ALTER TABLE public.subscriptions ADD COLUMN subscription_type TEXT NOT NULL DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro', 'premium'));
        RAISE NOTICE 'Colonne subscription_type ajoutée';
    END IF;
    
    -- Vérifier stripe_customer_id
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN stripe_customer_id TEXT UNIQUE;
        RAISE NOTICE 'Colonne stripe_customer_id ajoutée';
    END IF;
    
    -- Vérifier stripe_subscription_id
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN stripe_subscription_id TEXT UNIQUE;
        RAISE NOTICE 'Colonne stripe_subscription_id ajoutée';
    END IF;
    
    -- Vérifier status
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'status') THEN
        ALTER TABLE public.subscriptions ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid'));
        RAISE NOTICE 'Colonne status ajoutée';
    END IF;
    
    -- Vérifier current_period_start
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'current_period_start') THEN
        ALTER TABLE public.subscriptions ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne current_period_start ajoutée';
    END IF;
    
    -- Vérifier current_period_end
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'current_period_end') THEN
        ALTER TABLE public.subscriptions ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne current_period_end ajoutée';
    END IF;
END $$;

-- Activer RLS (Row Level Security)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour que les utilisateurs ne voient que leurs abonnements
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour permettre les insertions via les webhooks (service role)
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
    FOR ALL USING (current_setting('role') = 'service_role');

-- Afficher la structure finale
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' AND table_schema = 'public'
ORDER BY ordinal_position;