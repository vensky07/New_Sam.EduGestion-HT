import { db, auth } from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';

const USERS_COLLECTION = 'users';

export const fetchUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error);
    throw error;
  }
};

export const createUserProfile = async (userId, userData) => {
  try {
    await setDoc(doc(db, USERS_COLLECTION, userId), {
      ...userData,
      createdAt: serverTimestamp(),
      role: 'student',
    });
  } catch (error) {
    console.error('Erreur lors de la création du profil utilisateur:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
    throw error;
  }
};

export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('Utilisateur non authentifié');
    }

    // Réauthentifier l'utilisateur
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Mettre à jour le mot de passe
    await updatePassword(user, newPassword);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error);
    throw error;
  }
};

export const getUserStatistics = async (userId) => {
  try {
    const userProfile = await fetchUserProfile(userId);
    const createdAt = userProfile?.createdAt?.toDate?.() || new Date();
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    return {
      firstName: userProfile?.firstName,
      lastName: userProfile?.lastName,
      email: userProfile?.email,
      matricule: userProfile?.matricule,
      role: userProfile?.role,
      createdAt,
      daysSinceCreation,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques utilisateur:', error);
    throw error;
  }
};

export const validateUserData = (userData) => {
  const errors = [];

  if (!userData.firstName || userData.firstName.trim() === '') {
    errors.push('Le prénom est requis');
  }

  if (!userData.lastName || userData.lastName.trim() === '') {
    errors.push('Le nom est requis');
  }

  if (!userData.email || userData.email.trim() === '') {
    errors.push('L\'email est requis');
  } else if (!isValidEmail(userData.email)) {
    errors.push('L\'email n\'est pas valide');
  }

  if (!userData.matricule || userData.matricule.trim() === '') {
    errors.push('Le matricule est requis');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
