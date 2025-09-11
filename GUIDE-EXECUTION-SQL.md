# Guide d'Exécution SQL - Catégories Ordo

## 📋 Instructions pour Supabase

### Étape 1 : Accéder à l'éditeur SQL
1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet Ordo
3. Aller dans **SQL Editor**

### Étape 2 : Exécuter le script principal
Copier-coller et exécuter le code suivant :

```sql
-- 1. Ajouter la colonne is_default
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 2. Fonction pour créer les catégories par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, icon, is_default, is_auto_generated)
  VALUES
    (NEW.id, 'Banque', '#10b981', '🏦', true, false),
    (NEW.id, 'Travail', '#f59e0b', '💼', true, false),
    (NEW.id, 'Factures', '#ef4444', '📄', true, false),
    (NEW.id, 'Réseaux sociaux', '#8b5cf6', '📱', true, false),
    (NEW.id, 'Promotions', '#f59e0b', '🏷️', true, false),
    (NEW.id, 'Support Client', '#06b6d4', '🎧', true, false),
    (NEW.id, 'E-commerce', '#8b5cf6', '🛍️', true, false),
    (NEW.id, 'Voyages', '#3b82f6', '✈️', true, false),
    (NEW.id, 'Newsletter', '#6b7280', '📰', true, false),
    (NEW.id, 'Sécurité', '#dc2626', '🔒', true, false),
    (NEW.id, 'Formation', '#06b6d4', '🎓', true, false),
    (NEW.id, 'Santé', '#84cc16', '🏥', true, false),
    (NEW.id, 'Immobilier', '#f97316', '🏠', true, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Étape 3 : Migration utilisateurs existants (Optionnel)
Si vous avez déjà des utilisateurs, exécutez aussi :

```sql
-- Migration pour utilisateurs existants
INSERT INTO categories (user_id, name, color, icon, is_default, is_auto_generated)
SELECT u.id, cat.name, cat.color, cat.icon, true, false
FROM auth.users u
CROSS JOIN (
  SELECT 'E-commerce' as name, '#8b5cf6' as color, '🛍️' as icon
  UNION ALL SELECT 'Voyages', '#3b82f6', '✈️'
  UNION ALL SELECT 'Newsletter', '#6b7280', '📰'
  UNION ALL SELECT 'Sécurité', '#dc2626', '🔒'
  UNION ALL SELECT 'Formation', '#06b6d4', '🎓'
  UNION ALL SELECT 'Santé', '#84cc16', '🏥'
  UNION ALL SELECT 'Immobilier', '#f97316', '🏠'
) cat
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.user_id = u.id AND c.name = cat.name
);
```

## ✅ Vérification

Pour vérifier que tout fonctionne :

```sql
-- Vérifier les catégories d'un utilisateur
SELECT name, color, icon, is_default, is_auto_generated 
FROM categories 
WHERE user_id = 'VOTRE_USER_ID' 
ORDER BY name;

-- Compter les catégories par utilisateur
SELECT user_id, COUNT(*) as nb_categories
FROM categories 
GROUP BY user_id;
```

## 🎯 Résultat Attendu

Chaque nouvel utilisateur aura automatiquement **13 catégories par défaut** :
- 🏦 Banque
- 💼 Travail  
- 📄 Factures
- 📱 Réseaux sociaux
- 🏷️ Promotions
- 🎧 Support Client
- 🛍️ E-commerce *(nouveau)*
- ✈️ Voyages *(nouveau)*
- 📰 Newsletter *(nouveau)*
- 🔒 Sécurité *(nouveau)*
- 🎓 Formation *(nouveau)*
- 🏥 Santé *(nouveau)*
- 🏠 Immobilier *(nouveau)*

## 🚨 Important

- **Sauvegarder** votre base avant d'exécuter
- **Tester** d'abord sur un utilisateur de test
- Les catégories sont créées **automatiquement** pour chaque nouvel utilisateur
- Les catégories existantes ne seront **pas modifiées**
