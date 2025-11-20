// hooks/useProfile.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "@edugestion_profile_v1";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Chargement initial
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log("🔄 Chargement du profil depuis AsyncStorage...");
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedProfile = JSON.parse(stored);
        setProfile(parsedProfile);
        console.log("✅ Profil chargé avec succès");
      } else {
        console.log("🆕 Aucun profil trouvé, création du profil initial...");
        // Données initiales du profil
        const initialProfile = {
          id: "1",
          name: "Alice Martin",
          email: "alice.martin@edu.com",
          studentId: "ETU73482",
          level: "Licence 3",
          field: "Informatique",
          university: "Université Paris-Saclay",
          phone: "+33 6 12 34 56 78",
          avatar: null,
          joinedDate: "2023-09-01",
          preferences: {
            notifications: true,
            darkMode: false,
            language: "fr"
          },
          stats: {
            averageGrade: 14.2,
            completedCourses: 24,
            attendance: 92
          }
        };
        setProfile(initialProfile);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialProfile));
        console.log("✅ Profil initial créé avec succès");
      }
    } catch (error) {
      console.error("❌ Erreur chargement profil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (newProfile) => {
    try {
      console.log("💾 Sauvegarde du profil...");
      setProfile(newProfile);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      console.log("✅ Profil sauvegardé avec succès");
    } catch (error) {
      console.error("❌ Erreur sauvegarde profil:", error);
    }
  };

  // 🔹 Mettre à jour une partie du profil
  const updateProfile = async (updates) => {
    const updatedProfile = { ...profile, ...updates };
    await saveProfile(updatedProfile);
  };

  // 🔹 Obtenir les informations pour l'accueil
  const getHomeInfo = () => {
    if (!profile) return null;
    
    return {
      userName: profile.name,
      studentInfo: `${profile.level} - ${profile.field}`,
      avatar: profile.avatar,
      stats: profile.stats
    };
  };

  return {
    profile,
    isLoading,
    loadProfile,
    saveProfile,
    updateProfile,
    getHomeInfo
  };
}

// Export par défaut aussi pour plus de sécurité
export default useProfile;