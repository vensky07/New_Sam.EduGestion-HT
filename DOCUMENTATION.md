# Documentation Technique - EduGestion HT

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation et configuration](#installation-et-configuration)
4. [Structure du projet](#structure-du-projet)
5. [Fonctionnalités](#fonctionnalités)
6. [API et services](#api-et-services)
7. [Base de données](#base-de-données)
8. [Authentification](#authentification)
9. [Synchronisation hors ligne](#synchronisation-hors-ligne)
10. [Tests](#tests)
11. [Déploiement](#déploiement)

## Vue d'ensemble

**EduGestion HT** est une application mobile multiplateforme développée avec React Native (Expo) pour la gestion académique des étudiants de l'Université Espoir de Calvary Chapel en Haïti.

### Objectifs principaux
- Fournir une solution numérique de gestion académique
- Améliorer la communication entre étudiants et administration
- Assurer une accessibilité hors ligne partielle via SQLite
- Offrir une interface sobre et professionnelle

### Technologies utilisées
- **Frontend** : React Native avec Expo
- **Backend** : Firebase (Firestore + Authentication)
- **Base de données locale** : SQLite (via expo-sqlite)
- **Navigation** : React Navigation
- **Stockage local** : AsyncStorage
- **Gestion d'état** : Context API

## Architecture

### Architecture générale
```
┌─────────────────────────────────────────┐
│         Application Mobile              │
│      (React Native + Expo)              │
├─────────────────────────────────────────┤
│         Navigation Layer                │
│    (React Navigation + Context)         │
├─────────────────────────────────────────┤
│         Services Layer                  │
│  (Grades, Schedule, Notifications, etc) │
├─────────────────────────────────────────┤
│    Firebase | SQLite | AsyncStorage     │
│    (Cloud)  | (Local) | (Cache)         │
└─────────────────────────────────────────┘
```

### Flux de données
1. **En ligne** : Les données sont récupérées depuis Firebase Firestore
2. **Hors ligne** : Les données sont servies depuis SQLite
3. **Synchronisation** : Les données sont synchronisées automatiquement quand la connexion est rétablie

## Installation et configuration

### Prérequis
- Node.js 16+ et npm
- Expo CLI (`npm install -g expo-cli`)
- Un compte Firebase avec un projet configuré
- Un émulateur Android/iOS ou un appareil physique

### Étapes d'installation

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
   - Créer un fichier `src/config/firebaseConfig.js`
   - Ajouter les clés de configuration Firebase
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
   # Appuyer sur 'a' pour Android ou 'i' pour iOS
   ```

## Structure du projet

```
EduGestion-HT/
├── src/
│   ├── config/
│   │   ├── firebase.js          # Initialisation Firebase
│   │   └── firebaseConfig.js    # Configuration Firebase
│   ├── context/
│   │   └── AuthContext.js       # Contexte d'authentification
│   ├── screens/
│   │   ├── LoginScreen.js       # Écran de connexion
│   │   ├── RegisterScreen.js    # Écran d'inscription
│   │   ├── DashboardScreen.js   # Accueil
│   │   ├── GradesScreen.js      # Notes et bulletins
│   │   ├── ScheduleScreen.js    # Emploi du temps
│   │   ├── ProfileScreen.js     # Profil utilisateur
│   │   ├── NotificationsScreen.js # Notifications
│   │   └── ResourcesScreen.js   # Ressources pédagogiques
│   ├── components/
│   │   └── LoadingScreen.js     # Écran de chargement
│   ├── navigation/
│   │   └── RootNavigator.js     # Navigation principale
│   ├── database/
│   │   └── sqlite.js            # Configuration SQLite
│   └── utils/
│       ├── constants.js         # Constantes de l'app
│       ├── syncService.js       # Service de synchronisation
│       ├── gradesService.js     # Service des notes
│       ├── scheduleService.js   # Service de l'emploi du temps
│       ├── notificationsService.js # Service des notifications
│       ├── resourcesService.js  # Service des ressources
│       └── userService.js       # Service utilisateur
├── App.js                       # Point d'entrée principal
├── app.json                     # Configuration Expo
├── package.json                 # Dépendances
└── README.md                    # Guide utilisateur
```

## Fonctionnalités

### 1. Authentification
- Inscription avec email, prénom, nom, matricule et mot de passe
- Connexion avec email/matricule et mot de passe
- Gestion sécurisée des sessions avec Firebase Authentication
- Déconnexion sécurisée

### 2. Tableau de bord (Dashboard)
- Affichage du profil utilisateur
- Notes récentes
- Prochain cours
- Notifications importantes
- Actions rapides vers les autres sections

### 3. Notes et bulletins
- Consultation des notes par semestre
- Calcul de la moyenne
- Affichage des commentaires des professeurs
- Statistiques des notes (moyenne, meilleure, pire)

### 4. Emploi du temps
- Vue hebdomadaire de l'emploi du temps
- Sélection par jour de la semaine
- Affichage des détails du cours (professeur, salle, horaire)
- Identification du prochain cours

### 5. Notifications
- Réception de notifications en temps réel
- Marquage comme lues/non lues
- Suppression de notifications
- Filtrage par type

### 6. Ressources pédagogiques
- Téléchargement de documents (PDF, vidéos, etc.)
- Filtrage par type de ressource
- Recherche de ressources
- Affichage des détails des ressources

### 7. Profil utilisateur
- Affichage des informations personnelles
- Modification du profil
- Changement de mot de passe
- Paramètres de notification
- Déconnexion

## API et services

### GradesService
```javascript
// Récupérer les notes de l'utilisateur
fetchUserGrades(userId)

// Récupérer les notes par semestre
fetchGradesBySemester(userId, semester)

// Ajouter une note
addGrade(userId, gradeData)

// Mettre à jour une note
updateGrade(gradeId, gradeData)

// Supprimer une note
deleteGrade(gradeId)

// Calculer la moyenne
calculateGradeAverage(grades)

// Obtenir les statistiques
getGradeStatistics(grades)
```

### ScheduleService
```javascript
// Récupérer l'emploi du temps
fetchUserSchedule(userId)

// Récupérer par jour
fetchScheduleByDay(userId, dayOfWeek)

// Ajouter un cours
addScheduleItem(userId, scheduleData)

// Mettre à jour un cours
updateScheduleItem(scheduleId, scheduleData)

// Supprimer un cours
deleteScheduleItem(scheduleId)

// Obtenir le prochain cours
getNextClass(userId)

// Obtenir les statistiques
getScheduleStatistics(schedule)
```

### NotificationsService
```javascript
// Récupérer les notifications
fetchUserNotifications(userId)

// Récupérer les non lues
fetchUnreadNotifications(userId)

// Ajouter une notification
addNotification(userId, notificationData)

// Marquer comme lue
markNotificationAsRead(notificationId)

// Supprimer une notification
deleteNotification(notificationId)

// Obtenir les statistiques
getNotificationStatistics(userId)
```

## Base de données

### Firebase Firestore

#### Collections
1. **users**
   ```
   {
     id: string (UID Firebase),
     firstName: string,
     lastName: string,
     email: string,
     matricule: string,
     role: string,
     createdAt: timestamp
   }
   ```

2. **grades**
   ```
   {
     id: string,
     userId: string,
     courseName: string,
     professor: string,
     grade: number,
     semester: string,
     date: timestamp,
     comment: string
   }
   ```

3. **schedule**
   ```
   {
     id: string,
     userId: string,
     courseName: string,
     professor: string,
     dayOfWeek: string,
     startTime: string,
     endTime: string,
     location: string,
     room: string
   }
   ```

4. **notifications**
   ```
   {
     id: string,
     userId: string,
     title: string,
     message: string,
     type: string,
     createdAt: timestamp,
     read: boolean
   }
   ```

5. **resources**
   ```
   {
     id: string,
     userId: string,
     title: string,
     description: string,
     course: string,
     type: string,
     url: string,
     uploadedAt: timestamp
   }
   ```

### SQLite (Base de données locale)

Les mêmes collections sont répliquées localement pour l'accès hors ligne.

## Authentification

### Flux d'authentification
1. L'utilisateur se connecte ou s'inscrit
2. Firebase Authentication valide les identifiants
3. Un token JWT est généré
4. Le contexte AuthContext met à jour l'état utilisateur
5. La navigation change automatiquement

### Sécurité
- Mots de passe hashés par Firebase
- Tokens JWT pour les sessions
- Validation des données côté client et serveur
- Permissions Firestore basées sur l'authentification

## Synchronisation hors ligne

### Stratégie de synchronisation
1. **Synchronisation initiale** : Au premier lancement, les données sont téléchargées depuis Firebase
2. **Synchronisation périodique** : Toutes les 5 minutes (configurable)
3. **Synchronisation manuelle** : L'utilisateur peut forcer une synchronisation
4. **Queue de synchronisation** : Les modifications hors ligne sont mises en queue et synchronisées quand la connexion est rétablie

### Utilisation
```javascript
import { syncDataFromFirebase, shouldSync } from './src/utils/syncService';

// Vérifier si une synchronisation est nécessaire
if (await shouldSync()) {
  await syncDataFromFirebase(userId);
}
```

## Tests

### Tests unitaires
```bash
npm test
```

### Tests d'intégration
```bash
npm run test:integration
```

### Tests manuels
1. Tester l'authentification (inscription/connexion)
2. Tester la navigation entre les écrans
3. Tester le chargement des données
4. Tester l'accès hors ligne
5. Tester la synchronisation

## Déploiement

### Déploiement Android
```bash
eas build --platform android
```

### Déploiement iOS
```bash
eas build --platform ios
```

### Déploiement sur Expo Go
```bash
expo publish
```

## Support et maintenance

Pour toute question ou problème, veuillez contacter l'équipe de développement.

---

**Dernière mise à jour** : Octobre 2025
**Version** : 1.0.0
