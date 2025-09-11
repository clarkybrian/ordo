# Guide Configuration Google Cloud Console pour Orton

## 🔧 Configuration OAuth 2.0 Client ID

### 1. Accès à Google Cloud Console
- Allez sur https://console.cloud.google.com/
- Sélectionnez votre projet
- Naviguez vers **APIs & Services** > **Credentials**

### 2. Configuration OAuth 2.0 Client ID

#### 📍 **Origines JavaScript autorisées**
Ajoutez ces deux domaines :
```
https://orton.life
http://localhost:5173
```

#### 📍 **URI de redirection autorisés** 
Ajoutez ces deux URI :
```
https://tidslxypgfettpguqwxn.supabase.co/auth/v1/callback
https://orton.life/auth/callback
```

### 3. Pourquoi ces configurations ?

#### **Origines JavaScript autorisées**
- `https://orton.life` : Votre domaine de production
- `http://localhost:5173` : Pour le développement local

#### **URI de redirection autorisés**
- `https://tidslxypgfettpguqwxn.supabase.co/auth/v1/callback` : Callback Supabase (obligatoire)
- `https://orton.life/auth/callback` : Callback de votre application

## 🚨 Problème actuel

Actuellement, l'URL de redirection pointe vers `localhost:3000` parce que :
1. ❌ `https://orton.life` n'est pas dans les origines JavaScript autorisées
2. ❌ `https://orton.life/auth/callback` n'est pas dans les URI de redirection

## ✅ Solution

1. **Ajoutez `https://orton.life` dans les origines JavaScript**
2. **Ajoutez `https://orton.life/auth/callback` dans les URI de redirection**
3. **Gardez aussi les URLs de développement pour les tests locaux**

Une fois ces changements effectués dans Google Cloud Console, l'authentification fonctionnera correctement sur votre domaine de production.
