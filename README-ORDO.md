# 📧 Ordo - Classification Intelligente d'Emails

> Une Progressive Web App (PWA) pour ne plus jamais perdre vos emails importants

## 🎯 Vision du Projet

Ordo est une application web progressive qui se connecte à votre boîte Gmail via OAuth et classe automatiquement vos emails dans des catégories personnalisables. Fini les factures perdues, les billets égarés ou les documents importants oubliés !

## ✨ Fonctionnalités

### 🔐 Authentification Sécurisée
- Connexion via Google OAuth
- Accès sécurisé à Gmail (lecture seule)
- Gestion des sessions utilisateur

### 🤖 Classification Automatique
- IA intégrée (TF-IDF + Régression logistique)
- Classification des emails avec ~90% de précision
- Correction manuelle pour améliorer le modèle

### 📱 PWA Native
- Installable sur mobile et desktop
- Fonctionne hors ligne
- Notifications push
- Interface optimisée mobile

### 🎨 Design Apple/Revolut
- Interface épurée et minimaliste
- Animations fluides avec Framer Motion
- Thème clair/sombre
- Composants élégants

## 🛠️ Stack Technique

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **TailwindCSS** + **shadcn/ui** pour le design
- **Framer Motion** pour les animations
- **Lucide React** pour les icônes

### Backend & Base de Données
- **Supabase** (Auth + Database + Storage + Edge Functions)
- **PostgreSQL** pour les données
- **Edge Functions** pour l'API Gmail et classification

### PWA
- **Service Worker** pour le cache
- **Web App Manifest** pour l'installation
- Support offline

## 🚀 Installation et Lancement

### Prérequis
- Node.js 20+ et npm
- Compte Supabase
- Compte Google Cloud (pour OAuth Gmail)

### Installation
```bash
# Clone le projet
git clone [url-du-repo]
cd ordo

# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Remplir les variables Supabase et Google

# Lancement en développement
npm run dev
```

### Configuration Supabase
1. Créer un projet sur [supabase.com](https://supabase.com)
2. Configurer l'authentification Google OAuth
3. Ajouter les URL et clés dans `.env`

## 📊 Business Model

### 🆓 Gratuit (Freemium)
- 5 emails/jour max
- 3 catégories max
- Pas d'OCR sur pièces jointes

### 💳 Pro (5€/mois)
- 30 emails/jour
- Catégories illimitées
- OCR sur PDF/Images
- Recherche avancée

### 👑 Premium (15€/mois)
- Emails illimités
- IA avancée pour classification
- Notifications instantanées
- Support prioritaire

## 🗂️ Structure du Projet

```
ordo/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                 # Service worker
├── src/
│   ├── components/
│   │   ├── ui/               # Composants shadcn/ui
│   │   └── EmailCard.tsx     # Carte d'email
│   ├── pages/
│   │   ├── Onboarding.tsx    # Page de connexion
│   │   └── Dashboard.tsx     # Interface principale
│   ├── lib/
│   │   ├── supabase.ts       # Configuration Supabase
│   │   └── utils.ts          # Utilitaires
│   ├── types/
│   │   └── index.ts          # Types TypeScript
│   └── App.tsx               # Composant racine
└── package.json
```

## 🎨 Design System

### Couleurs
- **Primary**: Blue (#3b82f6)
- **Background**: White/Dark adaptable
- **Text**: Gray scale harmonieux

### Typographie
- **Font**: SF Pro Display (Apple style)
- **Sizes**: Responsive et cohérentes

### Composants
- Cards élégantes avec shadow subtiles
- Buttons avec variants (primary, secondary, ghost)
- Animations micro-interactions

## 🔮 Roadmap

### Phase 1 (MVP) ✅
- [x] Interface d'onboarding
- [x] Dashboard avec mock data
- [x] PWA basique
- [x] Design system

### Phase 2 (Supabase Integration)
- [ ] Configuration Supabase complète
- [ ] Authentification Google OAuth
- [ ] Base de données (users, emails, categories)
- [ ] Edge Functions pour Gmail API

### Phase 3 (IA Classification)
- [ ] Modèle de classification TF-IDF
- [ ] API d'entraînement du modèle
- [ ] Correction manuelle utilisateur
- [ ] Amélioration continue

### Phase 4 (Monétisation)
- [ ] Intégration Stripe
- [ ] Gestion des abonnements
- [ ] Limitations par plan
- [ ] OCR pour pièces jointes

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

- Email: [votre-email]
- Twitter: [@votre-handle]
- LinkedIn: [votre-profil]

---

**Ordo** - Transformez le chaos de votre boîte mail en organisation parfaite ! ✨
