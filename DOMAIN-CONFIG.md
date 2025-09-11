# Configuration des Domaines Orton

## Domaine de Production
- **URL principale** : https://orton.life
- **Callback Auth** : https://orton.life/auth/callback

## Configuration Supabase requise

### Site Configuration
- Site URL: `https://orton.life`
- Redirect URLs: `https://votre-projet.supabase.co/auth/v1/callback,https://orton.life/auth/callback`

### OAuth Google Configuration
- JavaScript Origins: `https://orton.life`
- Redirect URIs: `https://votre-projet.supabase.co/auth/v1/callback`

## Variables d'Environnement Netlify
Assurez-vous de configurer ces variables sur Netlify :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_publique
VITE_OPENAI_API_KEY=votre_clé_openai
```

## DNS Configuration
Assurez-vous que votre domaine orton.life pointe vers Netlify :
- CNAME record: orton.life → votre-app.netlify.app
