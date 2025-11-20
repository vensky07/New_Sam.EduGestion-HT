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

const GRADES_COLLECTION = 'grades';

export const fetchUserGrades = async (userId) => {
  try {
    const q = query(
      collection(db, GRADES_COLLECTION),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const grades = [];
    querySnapshot.forEach(doc => {
      grades.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return grades;
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error);
    throw error;
  }
};

export const fetchGradesBySemester = async (userId, semester) => {
  try {
    const q = query(
      collection(db, GRADES_COLLECTION),
      where('userId', '==', userId),
      where('semester', '==', semester)
    );
    const querySnapshot = await getDocs(q);
    const grades = [];
    querySnapshot.forEach(doc => {
      grades.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return grades;
  } catch (error) {
    console.error('Erreur lors de la récupération des notes par semestre:', error);
    throw error;
  }
};

export const addGrade = async (userId, gradeData) => {
  try {
    const docRef = await addDoc(collection(db, GRADES_COLLECTION), {
      userId,
      ...gradeData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la note:', error);
    throw error;
  }
};

export const updateGrade = async (gradeId, gradeData) => {
  try {
    const gradeRef = doc(db, GRADES_COLLECTION, gradeId);
    await updateDoc(gradeRef, {
      ...gradeData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note:', error);
    throw error;
  }
};

export const deleteGrade = async (gradeId) => {
  try {
    await deleteDoc(doc(db, GRADES_COLLECTION, gradeId));
  } catch (error) {
    console.error('Erreur lors de la suppression de la note:', error);
    throw error;
  }
};

export const calculateGradeAverage = (grades) => {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((acc, grade) => acc + (grade.grade || 0), 0);
  return (sum / grades.length).toFixed(2);
};

export const getGradeStatistics = (grades) => {
  if (grades.length === 0) {
    return {
      average: 0,
      highest: 0,
      lowest: 0,
      total: 0,
    };
  }

  const gradeValues = grades.map(g => g.grade);
  const sum = gradeValues.reduce((a, b) => a + b, 0);
  const average = (sum / grades.length).toFixed(2);
  const highest = Math.max(...gradeValues);
  const lowest = Math.min(...gradeValues);

  return {
    average,
    highest,
    lowest,
    total: grades.length,
  };
};
