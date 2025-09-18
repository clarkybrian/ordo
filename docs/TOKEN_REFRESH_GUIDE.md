# 🔄 Auto-Refresh des Tokens Gmail - Guide Développeur

## Problème résolu

Avant ce correctif, les utilisateurs devaient se déconnecter et se reconnecter manuellement après une période d'inactivité car le token Gmail expirait. 

## Solution implémentée

Système d'auto-refresh automatique des tokens Gmail utilisant le `refresh_token` OAuth de Google.

## Configuration requise

### 1. Variables d'environnement

Ajoutez dans votre fichier `.env` :

```bash
# Configuration Google OAuth (requis pour auto-refresh)
VITE_GOOGLE_CLIENT_ID=votre_google_client_id_ici
VITE_GOOGLE_CLIENT_SECRET=votre_google_client_secret_ici
```

### 2. Récupérer les clés Google

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez un existant
3. Activez l'API Gmail
4. Créez des identifiants OAuth 2.0 :
   - Type : Application Web
   - URI de redirection autorisés : `http://localhost:5173/auth/callback` (dev) + votre domaine (prod)
5. Copiez `Client ID` et `Client Secret`

## Comment ça fonctionne

### Flux automatique

1. **Requête Gmail** → `makeGmailRequest()`
2. **Validation du token** → `getValidAccessToken()` 
3. **Test du token actuel** → Requête test vers Gmail API
4. **Si 401 (expiré)** → `refreshAccessToken()` avec refresh_token
5. **Mise à jour session** → Sauvegarde du nouveau token
6. **Retry automatique** → Relance la requête initiale

### Mécanismes de sécurité

- **Max 2 tentatives** par requête pour éviter les boucles
- **Gestion d'erreurs distinctes** : auth vs API
- **Fallback propre** : Message clair si refresh impossible
- **Logging détaillé** pour debugging

## Test en développement

### Simuler un token expiré

```javascript
// Dans la console du navigateur
const { data } = await supabase.auth.getSession()
console.log('Token actuel:', data.session?.provider_token)

// Modifier temporairement le token pour le rendre invalide
// La prochaine sync déclenchera l'auto-refresh
```

### Vérifier les logs

Lors de la synchronisation, surveillez ces logs dans la console :

```
🔄 Token expiré, tentative de rafraîchissement...
✅ Token rafraîchi avec succès  
🔄 Erreur 401, tentative 1/2, retry...
```

## Structure du code

```
src/services/gmail.ts
├── getAccessToken() - [ANCIEN] Token simple de session
├── getValidAccessToken() - [NOUVEAU] Token validé + auto-refresh  
├── refreshAccessToken() - [NOUVEAU] Refresh via Google OAuth
└── makeGmailRequest() - [MODIFIÉ] Avec retry automatique
```

## Résolution de problèmes

### Token refresh échoue
- Vérifiez `VITE_GOOGLE_CLIENT_SECRET` dans `.env`
- Contrôlez que le refresh_token existe en DB
- Inspectez les logs de `refreshAccessToken()`

### Erreur "Session expirée"
- Le refresh token lui-même a expiré (> 6 mois d'inactivité)
- L'utilisateur doit se reconnecter une fois
- Normal après longue inactivité

### Performance
- Premier test token = ~100ms
- Refresh complet = ~500ms  
- Économise 5-10s de reconnexion manuelle

## Monitoring

Les métriques importantes à surveiller :

- Taux de succès du refresh (devrait être > 90%)
- Nombre de reconnexions manuelles (devrait diminuer)
- Temps moyen de synchronisation
- Erreurs de type "Session expirée" vs autres erreurs

## Commandes de test

```bash
# Démarrer l'app avec logs détaillés
npm run dev

# Tester la sync après inactivité
# (laisser l'app inactive 1h+ puis faire une sync)

# Observer les requêtes réseau dans DevTools > Network
# Filtrer par "googleapis.com" pour voir les appels OAuth
```