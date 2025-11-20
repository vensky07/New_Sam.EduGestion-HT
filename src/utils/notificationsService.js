import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const fetchUserNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const notifications = [];
    querySnapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return notifications.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw error;
  }
};

export const fetchUnreadNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const notifications = [];
    querySnapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return notifications;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications non lues:', error);
    throw error;
  }
};

export const addNotification = async (userId, notificationData) => {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      read: false,
      ...notificationData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notifications = await fetchUnreadNotifications(userId);
    const promises = notifications.map(notif =>
      markNotificationAsRead(notif.id)
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    throw error;
  }
};

export const deleteAllNotifications = async (userId) => {
  try {
    const notifications = await fetchUserNotifications(userId);
    const promises = notifications.map(notif =>
      deleteNotification(notif.id)
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Erreur lors de la suppression de toutes les notifications:', error);
    throw error;
  }
};

export const getNotificationsByType = async (userId, type) => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('type', '==', type)
    );
    const querySnapshot = await getDocs(q);
    const notifications = [];
    querySnapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return notifications;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications par type:', error);
    throw error;
  }
};

export const getNotificationStatistics = async (userId) => {
  try {
    const allNotifications = await fetchUserNotifications(userId);
    const unreadNotifications = await fetchUnreadNotifications(userId);

    return {
      total: allNotifications.length,
      unread: unreadNotifications.length,
      read: allNotifications.length - unreadNotifications.length,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de notifications:', error);
    throw error;
  }
};
