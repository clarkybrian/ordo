# Configuration des Domaines Orton

## Domaine de Production
- **URL principale** : https://orton.life
- **Callback Auth** : https://orton.life/auth/callback

## Configuration Supabase requise

### Site Configuration
- Site URL: `https://orton.life`
- Redirect URLs: `https://votre-projet.supabase.co/auth/v1/callback,https://orton.life/auth/callback`

### OAuth Google Configuration
### Origines JavaScript autorisées
- `https://orton.life` (OBLIGATOIRE pour production)
- `http://localhost:5173` (pour développement)

### URI de redirection autorisés  
- `https://votre-projet.supabase.co/auth/v1/callback` (OBLIGATOIRE)
- `https://orton.life/auth/callback` (OBLIGATOIRE pour production)

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
