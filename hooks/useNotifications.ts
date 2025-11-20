import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_STORAGE_KEY = "@edugestion_notifications";
const SCHEDULE_STORAGE_KEY = "@edugestion_timetable_v1";
const PAYMENTS_STORAGE_KEY = "@edugestion_payments_v1";

// Obtenir le nom du jour en français
const getFrenchDayName = (date) => {
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return days[date.getDay()];
};

// Calculer les jours jusqu'à l'échéance
const getDaysUntilDue = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Vérifier les cours à venir
export const checkUpcomingCourses = async () => {
  try {
    const storedSchedule = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (!storedSchedule) return [];

    const schedule = JSON.parse(storedSchedule);
    const upcomingNotifications = [];

    for (const course of schedule) {
      const minutesUntil = getTimeUntilCourse(course);
      
      if (minutesUntil !== null && minutesUntil > 0 && minutesUntil <= 60) {
        let timeMessage = "";
        let priority = 'medium';
        
        if (minutesUntil <= 5) {
          timeMessage = "commence maintenant !";
          priority = 'high';
        } else if (minutesUntil <= 15) {
          timeMessage = `commence dans ${minutesUntil} minutes`;
          priority = 'high';
        } else {
          timeMessage = `commence à ${course.startTime}`;
          priority = 'medium';
        }

        const notification = {
          id: `course_${course.id}_${Date.now()}`,
          title: `📚 ${course.title}`,
          message: `Votre cours ${timeMessage} ${course.room ? `en salle ${course.room}` : ''}`,
          time: new Date().toISOString(),
          read: false,
          source: 'emploi du temps',
          courseId: course.id,
          type: 'course_reminder',
          priority: priority
        };

        if (!await notificationExists(notification)) {
          upcomingNotifications.push(notification);
        }
      }
    }

    return upcomingNotifications;
  } catch (error) {
    console.error("Erreur vérification cours:", error);
    return [];
  }
};

// Vérifier les paiements à venir
export const checkUpcomingPayments = async () => {
  try {
    const storedPayments = await AsyncStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (!storedPayments) return [];

    const payments = JSON.parse(storedPayments);
    const upcomingNotifications = [];

    for (const payment of payments) {
      if (payment.status === 'pending') {
        const daysUntil = getDaysUntilDue(payment.dueDate);
        
        if (daysUntil >= 0 && daysUntil <= 7) {
          let message = "";
          let priority = 'medium';

          if (daysUntil === 0) {
            message = "Échéance aujourd'hui !";
            priority = 'high';
          } else if (daysUntil === 1) {
            message = "Échéance demain !";
            priority = 'high';
          } else if (daysUntil <= 3) {
            message = `Échéance dans ${daysUntil} jours`;
            priority = 'high';
          } else {
            message = `Échéance le ${payment.dueDate}`;
            priority = 'medium';
          }

          const notification = {
            id: `payment_${payment.id}_${Date.now()}`,
            title: `💰 ${payment.title}`,
            message: `${payment.amount} - ${message}`,
            time: new Date().toISOString(),
            read: false,
            source: 'paiements',
            paymentId: payment.id,
            type: 'payment_reminder',
            priority: priority
          };

          if (!await notificationExists(notification)) {
            upcomingNotifications.push(notification);
          }
        }
      }

      // Vérifier les paiements en retard
      if (payment.status === 'overdue') {
        const notification = {
          id: `payment_overdue_${payment.id}_${Date.now()}`,
          title: `⚠️ Paiement en retard`,
          message: `${payment.title} - ${payment.amount} était dû le ${payment.dueDate}`,
          time: new Date().toISOString(),
          read: false,
          source: 'paiements',
          paymentId: payment.id,
          type: 'payment_overdue',
          priority: 'high'
        };

        if (!await notificationExists(notification)) {
          upcomingNotifications.push(notification);
        }
      }
    }

    return upcomingNotifications;
  } catch (error) {
    console.error("Erreur vérification paiements:", error);
    return [];
  }
};

// Vérifier si une notification existe déjà
const notificationExists = async (newNotification) => {
  try {
    const existingNotifications = await getNotifications();
    return existingNotifications.some(
      notif => 
        notif.type === newNotification.type &&
        notif.paymentId === newNotification.paymentId &&
        !notif.read &&
        (new Date() - new Date(notif.time)) < 24 * 60 * 60 * 1000 // 24 heures
    );
  } catch (error) {
    return false;
  }
};

// Calculer le temps jusqu'au cours
const getTimeUntilCourse = (course) => {
  const now = new Date();
  const today = getFrenchDayName(now);
  
  if (course.day.toLowerCase() === today.toLowerCase()) {
    const [hours, minutes] = course.startTime.split(':');
    const courseTime = new Date();
    courseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const diffMs = courseTime - now;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    return diffMinutes;
  }
  
  return null;
};

// Vérifier toutes les notifications
export const checkAllNotifications = async () => {
  try {
    const courseNotifications = await checkUpcomingCourses();
    const paymentNotifications = await checkUpcomingPayments();
    
    return [...courseNotifications, ...paymentNotifications];
  } catch (error) {
    console.error("Erreur vérification notifications:", error);
    return [];
  }
};

// Sauvegarder les nouvelles notifications
export const saveNotifications = async (newNotifications) => {
  try {
    if (newNotifications.length === 0) return 0;

    const existing = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const allNotifications = existing ? JSON.parse(existing) : [];
    
    // Filtrer les doublons
    const uniqueNewNotifications = newNotifications.filter(newNotif => 
      !allNotifications.some(existingNotif => existingNotif.id === newNotif.id)
    );
    
    if (uniqueNewNotifications.length === 0) return 0;
    
    const updatedNotifications = [...uniqueNewNotifications, ...allNotifications];
    const trimmedNotifications = updatedNotifications.slice(0, 50);
    
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(trimmedNotifications));
    
    return uniqueNewNotifications.length;
  } catch (error) {
    console.error("Erreur sauvegarde notifications:", error);
    return 0;
  }
};

// Récupérer toutes les notifications
export const getNotifications = async () => {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erreur récupération notifications:", error);
    return [];
  }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifications = await getNotifications();
    const updated = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("Erreur marquage comme lu:", error);
    return false;
  }
};

// Supprimer une notification
export const deleteNotification = async (notificationId) => {
  try {
    const notifications = await getNotifications();
    const updated = notifications.filter(notif => notif.id !== notificationId);
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("Erreur suppression notification:", error);
    return false;
  }
};

// Marquer toutes les notifications comme lues
export const markAllAsRead = async () => {
  try {
    const notifications = await getNotifications();
    const updated = notifications.map(notif => ({ ...notif, read: true }));
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("Erreur marquage tout comme lu:", error);
    return false;
  }
};

// Obtenir le nombre de notifications non lues
export const getUnreadCount = async () => {
  try {
    const notifications = await getNotifications();
    return notifications.filter(notif => !notif.read).length;
  } catch (error) {
    console.error("Erreur comptage non lus:", error);
    return 0;
  }
};

// Créer une notification de paiement payé
export const createPaymentPaidNotification = async (payment) => {
  const notification = {
    id: `payment_paid_${payment.id}_${Date.now()}`,
    title: `✅ ${payment.title} payé`,
    message: `Paiement de ${payment.amount} effectué avec succès`,
    time: new Date().toISOString(),
    read: false,
    source: 'paiements',
    paymentId: payment.id,
    type: 'payment_paid',
    priority: 'low'
  };

  await saveNotifications([notification]);
  return notification;
};