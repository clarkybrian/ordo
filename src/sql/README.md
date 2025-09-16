# Structure SQL - Ordo

Cette section contient tous les fichiers SQL organisés par catégorie.

## 📁 Structure des dossiers

### `/setup/`
Scripts de configuration initiale et installation :
- `supabase-schema.sql` - Schéma principal de la base de données
- `assistant-*.sql` - Configuration de l'assistant IA
- `default-categories-setup.sql` - Catégories par défaut
- `sent-emails-table.sql` - Table des emails envoyés
- `setup-sent-emails-*.sql` - Scripts de setup emails

### `/fixes/`
Scripts de correction et réparation :
- `fix-*.sql` - Corrections diverses
- `database-fixes.sql` - Corrections générales de la DB

### `/migrations/`
Scripts de migration de données :
- `database-migration-auto-categories.sql` - Migration des catégories automatiques

### `/debug/`
Scripts de debug et tests :
- `debug-*.sql` - Scripts de débogage
- `test-*.sql` - Scripts de test

## 🔄 Fichiers racine
Les fichiers SQL restants à la racine sont des utilitaires généraux :
- `assistant_usage.sql`
- `chatbot_*.sql`