# 🔍 Debug : Problème filtre "Non lus"

## 🚨 Problème identifié

Le filtre "Non lus" n'affiche rien car **tous les emails en base sont probablement marqués comme "lus"** par Gmail.

## 📊 Vérification rapide

### Dans Supabase SQL Editor, exécutez :

```sql
-- Vérifier les statistiques actuelles
SELECT 
  COUNT(*) as total_emails,
  COUNT(CASE WHEN is_read = false THEN 1 END) as unread_emails,
  COUNT(CASE WHEN is_important = true THEN 1 END) as important_emails
FROM public.emails;
```

Si `unread_emails = 0`, c'est normal que le filtre soit vide !

## 🧪 Solution de test

Pour tester les filtres, exécutez ce script dans Supabase :

```sql
-- Marquer quelques emails comme non lus pour tester
UPDATE public.emails 
SET is_read = false 
WHERE id IN (
  SELECT id 
  FROM public.emails 
  LIMIT 5
);

-- Marquer quelques comme importants
UPDATE public.emails 
SET is_important = true 
WHERE id IN (
  SELECT id 
  FROM public.emails 
  LIMIT 2
);
```

## 🔄 Puis dans l'application :

1. **Rechargez la page** (F5)
2. **Testez le filtre "Non lus"** → Devrait afficher 5 emails
3. **Testez le filtre "Importants"** → Devrait afficher 2 emails

## ✅ Confirmation que ça marche

Les logs dans la console montreront :
- `🔍 Filtre: emails non lus (is_read = false)`
- `✅ getUserEmails résultat: 5 emails trouvés`

## 🎯 Pourquoi ce problème ?

Gmail marque automatiquement les emails comme "lus" quand :
- L'utilisateur les a déjà vus dans Gmail
- L'email a été ouvert dans un autre client
- L'API Gmail les récupère avec `is_read: true`

C'est un comportement normal ! Dans un usage réel, l'utilisateur aura des vrais emails non lus.

---

**Solution permanente :** Implémenter un bouton "Marquer comme non lu" dans l'interface Ordo.
