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

const RESOURCES_COLLECTION = 'resources';

export const fetchUserResources = async (userId) => {
  try {
    const q = query(
      collection(db, RESOURCES_COLLECTION),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach(doc => {
      resources.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return resources.sort((a, b) => {
      const dateA = a.uploadedAt?.toDate?.() || new Date(0);
      const dateB = b.uploadedAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ressources:', error);
    throw error;
  }
};

export const fetchResourcesByType = async (userId, type) => {
  try {
    const q = query(
      collection(db, RESOURCES_COLLECTION),
      where('userId', '==', userId),
      where('type', '==', type)
    );
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach(doc => {
      resources.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return resources;
  } catch (error) {
    console.error('Erreur lors de la récupération des ressources par type:', error);
    throw error;
  }
};

export const fetchResourcesByCourse = async (userId, course) => {
  try {
    const q = query(
      collection(db, RESOURCES_COLLECTION),
      where('userId', '==', userId),
      where('course', '==', course)
    );
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach(doc => {
      resources.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return resources;
  } catch (error) {
    console.error('Erreur lors de la récupération des ressources par cours:', error);
    throw error;
  }
};

export const addResource = async (userId, resourceData) => {
  try {
    const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), {
      userId,
      ...resourceData,
      uploadedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la ressource:', error);
    throw error;
  }
};

export const updateResource = async (resourceId, resourceData) => {
  try {
    const resourceRef = doc(db, RESOURCES_COLLECTION, resourceId);
    await updateDoc(resourceRef, {
      ...resourceData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la ressource:', error);
    throw error;
  }
};

export const deleteResource = async (resourceId) => {
  try {
    await deleteDoc(doc(db, RESOURCES_COLLECTION, resourceId));
  } catch (error) {
    console.error('Erreur lors de la suppression de la ressource:', error);
    throw error;
  }
};

export const getResourceStatistics = async (userId) => {
  try {
    const resources = await fetchUserResources(userId);
    const typeCount = {};

    resources.forEach(resource => {
      typeCount[resource.type] = (typeCount[resource.type] || 0) + 1;
    });

    return {
      total: resources.length,
      byType: typeCount,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de ressources:', error);
    throw error;
  }
};

export const searchResources = async (userId, searchTerm) => {
  try {
    const resources = await fetchUserResources(userId);
    const lowerSearchTerm = searchTerm.toLowerCase();

    return resources.filter(resource =>
      resource.title.toLowerCase().includes(lowerSearchTerm) ||
      resource.description.toLowerCase().includes(lowerSearchTerm) ||
      resource.course.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error('Erreur lors de la recherche de ressources:', error);
    throw error;
  }
};
