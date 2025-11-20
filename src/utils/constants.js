// Couleurs de l'application
export const COLORS = {
  primary: '#1a1a1a',
  secondary: '#666',
  background: '#ffffff',
  lightBackground: '#f5f5f5',
  cardBackground: '#f9f9f9',
  border: '#f0f0f0',
  text: '#1a1a1a',
  textSecondary: '#666',
  textTertiary: '#999',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
};

// Types de notifications
export const NOTIFICATION_TYPES = {
  GRADE: 'grade',
  SCHEDULE: 'schedule',
  ANNOUNCEMENT: 'announcement',
  MESSAGE: 'message',
  SYSTEM: 'system',
};

// Types de ressources
export const RESOURCE_TYPES = {
  PDF: 'pdf',
  VIDEO: 'video',
  DOCUMENT: 'document',
  LINK: 'link',
  OTHER: 'other',
};

// Rôles utilisateur
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

// Jours de la semaine
export const DAYS_OF_WEEK = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

// Semestres
export const SEMESTERS = ['S1', 'S2'];

// Délais de synchronisation (en millisecondes)
export const SYNC_INTERVALS = {
  AUTO_SYNC: 5 * 60 * 1000, // 5 minutes
  MANUAL_SYNC: 1000, // 1 seconde
};

// Limites de l'application
export const LIMITS = {
  MAX_NOTIFICATIONS: 100,
  MAX_GRADES_PER_SEMESTER: 50,
  MAX_RESOURCES: 500,
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Veuillez vérifier votre connexion Internet.',
  AUTHENTICATION_ERROR: 'Erreur d\'authentification. Veuillez vous reconnecter.',
  PERMISSION_ERROR: 'Vous n\'avez pas la permission d\'accéder à cette ressource.',
  NOT_FOUND: 'La ressource demandée n\'a pas été trouvée.',
  VALIDATION_ERROR: 'Les données fournies ne sont pas valides.',
  UNKNOWN_ERROR: 'Une erreur inconnue s\'est produite. Veuillez réessayer.',
};

// Messages de succès
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Connexion réussie!',
  REGISTER_SUCCESS: 'Inscription réussie!',
  UPDATE_SUCCESS: 'Mise à jour réussie!',
  DELETE_SUCCESS: 'Suppression réussie!',
  SYNC_SUCCESS: 'Synchronisation réussie!',
};
