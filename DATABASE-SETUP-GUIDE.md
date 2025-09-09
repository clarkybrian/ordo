# Guide de correction de la base de données Ordo

## ⚠️ IMPORTANT : Corrections nécessaires

Votre synchronisation échoue car le schéma de base de données n'est pas à jour. Suivez ces étapes pour corriger :

## 🔧 Étape 1 : Connexion à Supabase

1. Connectez-vous à votre tableau de bord Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet Ordo
3. Allez dans **SQL Editor** (dans le menu de gauche)

## 📝 Étape 2 : Exécution du script de correction

1. Cliquez sur **"New query"**
2. Copiez-collez tout le contenu du fichier `database-fixes.sql` dans l'éditeur
3. Cliquez sur **"Run"** pour exécuter le script

## ✅ Étape 3 : Vérification

Après l'exécution du script, vous devriez voir :
- ✅ Nouvelle fonction `get_user_categories` créée
- ✅ Vue `categories_with_count` créée  
- ✅ Colonnes manquantes ajoutées aux tables

## 🧪 Étape 4 : Test

1. Retournez sur votre application Ordo : http://localhost:5173
2. Connectez-vous avec Google
3. Cliquez sur **"Synchroniser"** dans le Dashboard
4. Vérifiez que :
   - ✅ Les emails sont récupérés sans erreur
   - ✅ Les catégories s'affichent avec le nombre d'emails  
   - ✅ Pas d'erreur dans la console

## 🎯 Ce qui a été corrigé

### Problèmes résolus :
- ❌ `Could not find the 'emails_count' column of 'categories'` → ✅ Vue avec comptage automatique
- ❌ `Could not find the 'body' column of 'emails'` → ✅ Utilise `body_text` 
- ❌ `Table categories non accessible` → ✅ Fonction RPC pour accès sécurisé
- ❌ Données mockées → ✅ Vraies données de la base

### Améliorations apportées :
- 🚀 Interface complètement connectée à la base de données
- 🚀 Synchronisation réelle des emails Gmail  
- 🚀 Classification automatique des emails
- 🚀 Comptage automatique des emails par catégorie
- 🚀 Plus de données fictives

## 🔍 Dépannage

Si vous avez encore des erreurs :

1. **Vérifiez dans Supabase SQL Editor** que les tables existent :
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. **Vérifiez que la fonction existe** :
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_user_categories';
   ```

3. **Vérifiez la vue** :
   ```sql
   SELECT * FROM categories_with_count LIMIT 1;
   ```

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur (F12) pour voir les erreurs détaillées
2. Vérifiez les logs Supabase dans l'onglet "Logs" 
3. Assurez-vous que votre connexion Gmail est active

---

**Note :** Après ces corrections, votre application Ordo sera entièrement fonctionnelle avec de vraies données Gmail !
