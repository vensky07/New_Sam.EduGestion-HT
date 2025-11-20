# EduGestion HT - Application de Gestion Académique

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-React%20Native-blue)

## 📱 À propos

**EduGestion HT** est une application mobile multiplateforme développée avec React Native (Expo) pour la gestion académique des étudiants de l'Université Espoir de Calvary Chapel en Haïti.

### ✨ Caractéristiques principales

- 🔐 **Authentification sécurisée** avec Firebase Authentication
- 📊 **Consultation des notes** et bulletins par semestre
- 📅 **Emploi du temps** hebdomadaire
- 🔔 **Notifications** en temps réel
- 📚 **Ressources pédagogiques** téléchargeables
- 👤 **Profil utilisateur** personnalisé
- 🌐 **Accès hors ligne** partiel via SQLite
- 🎨 **Interface sobre et professionnelle** (noir, gris, blanc)
- ⚡ **Synchronisation automatique** des données

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** 16+ et npm
- **Expo CLI** : `npm install -g expo-cli`
- **Un compte Firebase** avec un projet configuré
- **Un émulateur Android/iOS** ou un appareil physique

### Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd EduGestion-HT
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Firebase**
   
   Créez un fichier `src/config/firebaseConfig.js` avec vos clés Firebase :
   ```javascript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Démarrer l'application**
   ```bash
   npm start
   ```
   
   - Appuyez sur **`a`** pour Android
   - Appuyez sur **`i`** pour iOS
   - Appuyez sur **`w`** pour Web

## 📁 Structure du projet

```
EduGestion-HT/
├── src/
│   ├── config/              # Configuration Firebase
│   ├── context/             # Contexte d'authentification
│   ├── screens/             # Écrans de l'application
│   ├── components/          # Composants réutilisables
│   ├── navigation/          # Configuration de la navigation
│   ├── database/            # Configuration SQLite
│   └── utils/               # Services et utilitaires
├── App.js                   # Point d'entrée
├── app.json                 # Configuration Expo
├── package.json             # Dépendances
├── DOCUMENTATION.md         # Documentation technique
├── GUIDE_UTILISATEUR.md     # Guide utilisateur
└── README.md               # Ce fichier
```

## 🎯 Fonctionnalités

### Authentification
- Inscription avec validation des données
- Connexion sécurisée
- Gestion des sessions
- Déconnexion

### Tableau de bord
- Résumé des informations académiques
- Notes récentes
- Prochain cours
- Notifications importantes
- Actions rapides

### Notes et bulletins
- Consultation par semestre
- Calcul de la moyenne
- Statistiques des notes
- Commentaires des professeurs

### Emploi du temps
- Vue hebdomadaire
- Sélection par jour
- Détails des cours
- Résumé de la semaine

### Notifications
- Notifications en temps réel
- Filtrage par type
- Marquage comme lues/non lues
- Suppression

### Ressources pédagogiques
- Téléchargement de documents
- Filtrage par type
- Recherche
- Détails des ressources

### Profil utilisateur
- Informations personnelles
- Modification du profil
- Changement de mot de passe
- Paramètres

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet (optionnel) :
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

### Configuration Firebase

1. Créez un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activez l'authentification par email/mot de passe
3. Créez une base de données Firestore
4. Configurez les règles de sécurité Firestore :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /grades/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /schedule/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /notifications/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /resources/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📚 Documentation

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Documentation technique complète
- **[GUIDE_UTILISATEUR.md](./GUIDE_UTILISATEUR.md)** - Guide d'utilisation pour les utilisateurs

## 🧪 Tests

### Exécuter les tests
```bash
npm test
```

### Tester sur un appareil physique
```bash
npm start
# Scannez le code QR avec Expo Go
```

## 📦 Déploiement

### Déploiement Android
```bash
eas build --platform android
```

### Déploiement iOS
```bash
eas build --platform ios
```

### Déploiement sur Expo
```bash
expo publish
```

## 🔒 Sécurité

- ✅ Authentification Firebase sécurisée
- ✅ Tokens JWT pour les sessions
- ✅ Validation des données côté client et serveur
- ✅ Permissions Firestore basées sur l'authentification
- ✅ Chiffrement des données sensibles
- ✅ Stockage sécurisé des données locales

## 🌐 Accès hors ligne

L'application fonctionne partiellement hors ligne :

- **En ligne** : Accès complet à toutes les fonctionnalités
- **Hors ligne** : Consultation des données précédemment synchronisées
- **Synchronisation** : Automatique quand la connexion est rétablie

## 📱 Compatibilité

- **Android** : 5.0+ (API 21+)
- **iOS** : 12.0+
- **Web** : Chrome, Firefox, Safari (version récente)

## 🤝 Contribution

Les contributions sont bienvenues ! Veuillez :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commiter vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pousser vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

## 👥 Auteurs

- **Junior Samuel** - Chef de projet et développeur principal

## 📞 Support

Pour toute question ou problème :

- 📧 Email : support@edugestion.ht
- 📱 Téléphone : +509 XXXX-XXXX
- 🏢 Bureau : Bureau des Technologies de l'Information, Université Espoir de Calvary Chapel

## 🙏 Remerciements

- Université Espoir de Calvary Chapel
- Équipe React Native et Expo
- Communauté Firebase

## 📅 Historique des versions

### v1.0.0 (Octobre 2025)
- 🎉 Première version stable
- ✨ Toutes les fonctionnalités principales implémentées
- 🔐 Authentification Firebase intégrée
- 💾 Synchronisation hors ligne avec SQLite
- 📱 Support Android et iOS

---

**Dernière mise à jour** : Octobre 2025

**Merci d'utiliser EduGestion HT !** 🚀
