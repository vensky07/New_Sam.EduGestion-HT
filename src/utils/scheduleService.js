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

const SCHEDULE_COLLECTION = 'schedule';

export const fetchUserSchedule = async (userId) => {
  try {
    const q = query(
      collection(db, SCHEDULE_COLLECTION),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const schedule = [];
    querySnapshot.forEach(doc => {
      schedule.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return schedule;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'emploi du temps:', error);
    throw error;
  }
};

export const fetchScheduleByDay = async (userId, dayOfWeek) => {
  try {
    const q = query(
      collection(db, SCHEDULE_COLLECTION),
      where('userId', '==', userId),
      where('dayOfWeek', '==', dayOfWeek)
    );
    const querySnapshot = await getDocs(q);
    const schedule = [];
    querySnapshot.forEach(doc => {
      schedule.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return schedule.sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'emploi du temps par jour:', error);
    throw error;
  }
};

export const addScheduleItem = async (userId, scheduleData) => {
  try {
    const docRef = await addDoc(collection(db, SCHEDULE_COLLECTION), {
      userId,
      ...scheduleData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un cours:', error);
    throw error;
  }
};

export const updateScheduleItem = async (scheduleId, scheduleData) => {
  try {
    const scheduleRef = doc(db, SCHEDULE_COLLECTION, scheduleId);
    await updateDoc(scheduleRef, {
      ...scheduleData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du cours:', error);
    throw error;
  }
};

export const deleteScheduleItem = async (scheduleId) => {
  try {
    await deleteDoc(doc(db, SCHEDULE_COLLECTION, scheduleId));
  } catch (error) {
    console.error('Erreur lors de la suppression du cours:', error);
    throw error;
  }
};

export const getNextClass = async (userId) => {
  try {
    const schedule = await fetchUserSchedule(userId);
    const now = new Date();
    const currentDay = now.getDay();
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const currentDayName = daysOfWeek[currentDay];

    const todayClasses = schedule.filter(item => item.dayOfWeek === currentDayName);
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const nextClass = todayClasses.find(item => {
      const [hours, minutes] = item.startTime.split(':').map(Number);
      const classTime = hours * 60 + minutes;
      return classTime > currentTime;
    });

    return nextClass || null;
  } catch (error) {
    console.error('Erreur lors de la récupération du prochain cours:', error);
    return null;
  }
};

export const getTotalClassHours = (schedule) => {
  let totalMinutes = 0;
  schedule.forEach(item => {
    const [startHour, startMin] = item.startTime.split(':').map(Number);
    const [endHour, endMin] = item.endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    totalMinutes += duration;
  });
  return (totalMinutes / 60).toFixed(1);
};

export const getScheduleStatistics = (schedule) => {
  return {
    totalClasses: schedule.length,
    totalHours: getTotalClassHours(schedule),
    daysWithClasses: new Set(schedule.map(s => s.dayOfWeek)).size,
  };
};
