import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  setDoc,
  doc,
} from 'firebase/firestore';
import {
  getGradesByUser,
  getScheduleByUser,
  getNotificationsByUser,
  insertGrade,
  insertSchedule,
  insertNotification,
} from '../database/sqlite';

const SYNC_TIMESTAMP_KEY = 'last_sync_timestamp';

export const syncDataFromFirebase = async (userId) => {
  try {
    // Récupérer les notes
    const gradesQuery = query(
      collection(db, 'grades'),
      where('userId', '==', userId)
    );
    const gradesSnapshot = await getDocs(gradesQuery);
    for (const docSnapshot of gradesSnapshot.docs) {
      const grade = docSnapshot.data();
      await insertGrade({
        id: docSnapshot.id,
        ...grade,
      });
    }

    // Récupérer l'emploi du temps
    const scheduleQuery = query(
      collection(db, 'schedule'),
      where('userId', '==', userId)
    );
    const scheduleSnapshot = await getDocs(scheduleQuery);
    for (const docSnapshot of scheduleSnapshot.docs) {
      const schedule = docSnapshot.data();
      await insertSchedule({
        id: docSnapshot.id,
        ...schedule,
      });
    }

    // Récupérer les notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    const notificationsSnapshot = await getDocs(notificationsQuery);
    for (const docSnapshot of notificationsSnapshot.docs) {
      const notification = docSnapshot.data();
      await insertNotification({
        id: docSnapshot.id,
        ...notification,
      });
    }

    // Mettre à jour le timestamp de synchronisation
    await AsyncStorage.setItem(
      SYNC_TIMESTAMP_KEY,
      new Date().toISOString()
    );

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    return { success: false, error };
  }
};

export const getLastSyncTime = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(SYNC_TIMESTAMP_KEY);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du timestamp:', error);
    return null;
  }
};

export const shouldSync = async () => {
  try {
    const lastSync = await getLastSyncTime();
    if (!lastSync) return true;

    const now = new Date();
    const timeDiff = now - lastSync;
    const fiveMinutes = 5 * 60 * 1000;

    return timeDiff > fiveMinutes;
  } catch (error) {
    console.error('Erreur lors de la vérification de synchronisation:', error);
    return false;
  }
};

export const getOfflineGrades = async (userId) => {
  try {
    return await getGradesByUser(userId);
  } catch (error) {
    console.error('Erreur lors de la récupération des notes hors ligne:', error);
    return [];
  }
};

export const getOfflineSchedule = async (userId) => {
  try {
    return await getScheduleByUser(userId);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'emploi du temps hors ligne:', error);
    return [];
  }
};

export const getOfflineNotifications = async (userId) => {
  try {
    return await getNotificationsByUser(userId);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications hors ligne:', error);
    return [];
  }
};
