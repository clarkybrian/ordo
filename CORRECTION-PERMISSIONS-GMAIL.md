# 🔧 CORRECTION ERREUR ENVOI EMAIL - PERMISSIONS GMAIL

## 🚨 **Problème identifié :**

```
❌ ERROR: the server responded with a status of 403
❌ Request had insufficient authentication scopes.
```

**Cause :** L'utilisateur n'a pas les permissions pour **envoyer** des emails, seulement pour les **lire**.

## ✅ **Solutions appliquées :**

### 1. **Scopes Gmail corrigés dans toutes les pages**

**Avant** (pages de connexion) :
```javascript
scopes: 'https://www.googleapis.com/auth/gmail.readonly'
```

**Après** (permissions complètes) :
```javascript
scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose'
```

**Pages corrigées :**
- ✅ `LoginPage.tsx`
- ✅ `LandingPage.tsx` 
- ✅ `PricingPage.tsx`
- ✅ `FeaturesPage.tsx`
- ✅ `AboutPage.tsx`

### 2. **Vérification des permissions avant envoi**

**Nouveau dans `gmail.ts` :**
```typescript
async checkSendPermissions(): Promise<boolean> {
  // Teste l'accès aux brouillons (nécessite permissions d'envoi)
  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/drafts?maxResults=1');
  return response.status !== 403;
}
```

### 3. **Gestion des erreurs 403 améliorée**

**Messages d'erreur clairs :**
```typescript
if (response.status === 403 && error.error?.message?.includes('insufficient authentication scopes')) {
  throw new Error('❌ PERMISSIONS INSUFFISANTES: Vous devez vous déconnecter puis vous reconnecter pour obtenir les permissions d\'envoi d\'emails.');
}
```

### 4. **Interface utilisateur pour la reconnexion**

**Nouveau composant `ScopeWarning.tsx` :**
- ⚠️ Alerte visuelle quand permissions insuffisantes
- 🔄 Bouton "Se reconnecter" automatique
- 💡 Explication claire du problème

## 🎯 **Actions à faire :**

### **Option A - Reconnexion manuelle (recommandée) :**
1. **Se déconnecter** de l'application
2. **Se reconnecter** → Nouvelles permissions seront demandées
3. **Accepter** les permissions d'envoi Gmail
4. **Tester l'envoi** d'email

### **Option B - Reconnexion automatique :**
- Si erreur 403 détectée → Pop-up de reconnexion automatique
- Clic sur "Se reconnecter" → Déconnexion + redirection login

## 🔍 **Vérification des scopes actuels :**

Pour vérifier vos permissions actuelles :
1. Allez sur [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
2. Cherchez votre application "Ordo"
3. Vérifiez que vous avez :
   - ✅ **Gmail - Read** (lecture emails)
   - ✅ **Gmail - Compose** (composer emails)  
   - ✅ **Gmail - Send** (envoyer emails)

## 🚀 **Résultat attendu :**

Après reconnexion avec les bons scopes :
- ✅ Lecture d'emails : **OK**
- ✅ Synchronisation : **OK**
- ✅ **Envoi d'emails : OK** ← Nouveau !
- ✅ Réponses : **OK** ← Nouveau !
- ✅ Interface d'écriture complète : **OK**

## 📱 **Notes techniques :**

- **Scopes OAuth** : Une fois accordés lors de la première connexion, ils ne changent pas automatiquement
- **Solution** : Réautorisation nécessaire pour nouveaux scopes
- **Sécurité** : Google requiert explicitement l'autorisation d'envoi d'emails
- **Alternative** : SMTP pourrait être utilisé mais moins sécurisé
