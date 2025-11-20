// hooks/useTimetable.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "@edugestion_timetable_v1";

export function useTimetable() {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Chargement initial
  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      console.log("🔄 Chargement de l'emploi du temps depuis AsyncStorage...");
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSchedule = JSON.parse(stored);
        setSchedule(parsedSchedule);
        console.log(`✅ ${parsedSchedule.length} cours chargés avec succès`);
      } else {
        console.log("🆕 Aucun emploi du temps trouvé, création des données initiales...");
        // Données d'exemple pour démonstration
        const initialSchedule = [
          {
            id: "1",
            title: "Mathématiques Avancées",
            teacher: "Prof. Martin Dupont",
            room: "Salle 204 - Bâtiment A",
            startTime: "08:00",
            endTime: "09:30",
            day: "Lundi",
            color: "#4A6572"
          },
          {
            id: "2", 
            title: "Physique Quantique",
            teacher: "Prof. Sophie Laurent",
            room: "Labo 105",
            startTime: "10:00", 
            endTime: "11:30",
            day: "Lundi",
            color: "#FF6B6B"
          }
        ];
        setSchedule(initialSchedule);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialSchedule));
        console.log("✅ Emploi du temps initial créé avec succès");
      }
    } catch (error) {
      console.error("❌ Erreur chargement emploi du temps:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSchedule(newSchedule) {
    try {
      console.log(`💾 Sauvegarde de ${newSchedule.length} cours...`);
      setSchedule(newSchedule);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSchedule));
      console.log("✅ Emploi du temps sauvegardé avec succès");
    } catch (error) {
      console.error("❌ Erreur sauvegarde emploi du temps:", error);
    }
  }

  // 🔹 Obtenir les cours d'aujourd'hui
  const getTodayCourses = () => {
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
    const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);
    
    return schedule
      .filter(course => course.day === todayFormatted)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // 🔹 Obtenir le prochain cours
  const getNextCourse = () => {
    const todayCourses = getTodayCourses();
    if (todayCourses.length === 0) return null;

    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');

    // Trouver le premier cours qui n'est pas encore terminé
    const nextCourse = todayCourses.find(course => course.endTime > currentTime);
    
    return nextCourse || todayCourses[0]; // Retourne le premier cours si tous sont passés
  };

  // 🔹 Statistiques
  const getStats = () => {
    const totalCourses = schedule.length;
    const todayCoursesCount = getTodayCourses().length;
    const nextCourse = getNextCourse();
    
    return {
      totalCourses,
      todayCoursesCount,
      hasNextCourse: !!nextCourse,
      nextCourse
    };
  };

  // 🔹 Obtenir les cours par jour
  const getCoursesForDay = (day) => {
    return schedule
      .filter(course => course.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return {
    schedule,
    isLoading,
    loadSchedule,
    saveSchedule,
    getTodayCourses,
    getNextCourse,
    getStats,
    getCoursesForDay
  };
}