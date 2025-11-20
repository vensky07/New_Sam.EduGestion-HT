// hooks/useNotes.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "@edugestion_notes_v1";

export function useNotes() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Chargement initial
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      console.log("🔄 Chargement des données depuis AsyncStorage...");
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const loadedCategories = Array.isArray(parsed) ? parsed : parsed.categories ?? [];
        console.log(`✅ ${loadedCategories.length} catégorie(s) chargée(s) avec succès`);
        setCategories(loadedCategories);
      } else {
        console.log("🆕 Aucune donnée trouvée, création des données initiales...");
        const initial = [
          { id: Date.now().toString(), name: "Général", color: "#4A6572", notes: [] },
        ];
        setCategories(initial);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch (error) {
      console.error("❌ Erreur chargement notes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveData(nextData) {
    try {
      console.log(`💾 Sauvegarde de ${nextData.length} catégorie(s)...`);
      setCategories(nextData);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      console.log("✅ Données sauvegardées avec succès");
    } catch (error) {
      console.error("❌ Erreur sauvegarde notes:", error);
    }
  }

  // 🔹 Obtenir toutes les notes (pour l'accueil)
  const getAllNotes = () => {
    return categories.flatMap(category => 
      category.notes.map(note => ({
        ...note,
        categoryName: category.name,
        categoryColor: category.color
      }))
    );
  };

  // 🔹 Obtenir les notes récentes (limitées)
  const getRecentNotes = (limit = 5) => {
    const allNotes = getAllNotes();
    return allNotes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  };

  // 🔹 Statistiques
  const getStats = () => {
    const totalNotes = categories.reduce((acc, cat) => acc + cat.notes.length, 0);
    const totalCategories = categories.length;
    
    return {
      totalNotes,
      totalCategories,
      recentNotesCount: getRecentNotes().length
    };
  };

  return {
    categories,
    isLoading,
    loadData,
    saveData,
    getAllNotes,
    getRecentNotes,
    getStats,
    setCategories
  };
}