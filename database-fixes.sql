-- Correctifs pour la base de données Ordo
-- À exécuter dans Supabase SQL Editor pour corriger les problèmes de schéma

-- 1. Ajouter la colonne is_auto_generated si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'is_auto_generated'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN is_auto_generated BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Créer ou remplacer la vue pour les catégories avec comptage d'emails
DROP VIEW IF EXISTS public.categories_with_count;
CREATE VIEW public.categories_with_count AS
SELECT 
  c.*,
  COALESCE(e.emails_count, 0) AS emails_count
FROM public.categories c
LEFT JOIN (
  SELECT 
    category_id,
    COUNT(*) AS emails_count
  FROM public.emails
  WHERE category_id IS NOT NULL
  GROUP BY category_id
) e ON c.id = e.category_id;

-- 3. Ajouter une politique RLS pour la vue
DROP POLICY IF EXISTS "Users can view own categories with count" ON public.categories_with_count;
-- Note: Les vues héritent automatiquement des politiques RLS des tables sous-jacentes

-- 4. Vérifier que toutes les colonnes nécessaires existent dans la table emails
DO $$ 
BEGIN
    -- Vérifier thread_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'emails' 
        AND column_name = 'thread_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.emails ADD COLUMN thread_id TEXT;
    END IF;
    
    -- Vérifier sender_name (pour remplacer sender)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'emails' 
        AND column_name = 'sender_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.emails ADD COLUMN sender_name TEXT;
    END IF;
END $$;

-- 5. Mettre à jour les catégories existantes pour marquer celles créées par défaut
UPDATE public.categories 
SET is_auto_generated = TRUE 
WHERE name IN ('Factures', 'Billets', 'Banque', 'Travail', 'Personnel')
AND is_auto_generated IS NULL;

-- 6. Créer une fonction pour obtenir les catégories avec comptage
CREATE OR REPLACE FUNCTION public.get_user_categories(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    color TEXT,
    icon TEXT,
    description TEXT,
    is_default BOOLEAN,
    is_auto_generated BOOLEAN,
    emails_count BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        c.id,
        c.user_id,
        c.name,
        c.color,
        c.icon,
        c.description,
        c.is_default,
        COALESCE(c.is_auto_generated, FALSE) as is_auto_generated,
        COALESCE(e.emails_count, 0) as emails_count,
        c.created_at,
        c.updated_at
    FROM public.categories c
    LEFT JOIN (
        SELECT 
            category_id,
            COUNT(*) AS emails_count
        FROM public.emails
        WHERE category_id IS NOT NULL
        GROUP BY category_id
    ) e ON c.id = e.category_id
    WHERE c.user_id = user_uuid
    ORDER BY c.created_at;
$$;

-- 7. Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.categories_with_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_categories(UUID) TO authenticated;

-- 8. Créer un index pour optimiser les requêtes de comptage
CREATE INDEX IF NOT EXISTS idx_emails_category_user ON public.emails(category_id, user_id) WHERE category_id IS NOT NULL;

COMMENT ON VIEW public.categories_with_count IS 'Vue des catégories avec le nombre d emails associés';
COMMENT ON FUNCTION public.get_user_categories(UUID) IS 'Fonction pour récupérer les catégories d un utilisateur avec le nombre d emails';
