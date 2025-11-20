// hooks/useUser.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const USER_SETTINGS_KEY = "@edugestion_user_settings";
const CURRENT_USER_KEY = "@edugestion_current_user";

export function useUser() {
  const [user, setUser] = useState({
    name: "Alice Dupont",
    email: "alice.dupont@email.com",
    studentId: "123456",
    class: "Terminale S"
  });
  
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    autoSave: true,
    syncData: false
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Chargement initial
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log("🔄 Chargement des données utilisateur...");
      
      // Charger les paramètres
      const storedSettings = await AsyncStorage.getItem(USER_SETTINGS_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(parsedSettings);
        console.log("✅ Paramètres utilisateur chargés");
      }
      
      // Charger les infos utilisateur
      const storedUser = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("✅ Informations utilisateur chargées");
      }
      
    } catch (error) {
      console.error("❌ Erreur chargement données utilisateur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      console.log("💾 Sauvegarde des paramètres utilisateur...");
      setSettings(newSettings);
      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify({
        ...newSettings,
        lastUpdated: new Date().toISOString()
      }));
      console.log("✅ Paramètres sauvegardés avec succès");
    } catch (error) {
      console.error("❌ Erreur sauvegarde paramètres:", error);
    }
  };

  const updateUser = async (userData) => {
    try {
      console.log("💾 Mise à jour des informations utilisateur...");
      setUser(userData);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      console.log("✅ Informations utilisateur mises à jour");
    } catch (error) {
      console.error("❌ Erreur mise à jour utilisateur:", error);
    }
  };

  // 🔹 Obtenir les statistiques pour l'accueil
  const getUserStats = (notesStats, timetableStats) => {
    return {
      name: user.name,
      notesCount: notesStats?.totalNotes || 0,
      coursesToday: timetableStats?.todayCoursesCount || 0,
      totalCourses: timetableStats?.totalCourses || 0,
      completionRate: Math.min(Math.floor((notesStats?.totalNotes || 0) / 30 * 100), 100) // Exemple de calcul
    };
  };

  return {
    user,
    settings,
    isLoading,
    saveSettings,
    updateUser,
    getUserStats,
    loadUserData
  };
}

export default useUser;