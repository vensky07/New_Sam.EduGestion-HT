import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🔹 Types
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  notes: Note[];
}

// 🔹 Constantes
const STORAGE_KEY = "@edugestion_notes_v1";

export default function NotesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isNoteFullscreen, setIsNoteFullscreen] = useState(false);
  const [isViewNoteFullscreen, setIsViewNoteFullscreen] = useState(false);
  const [isCreateNoteFullscreen, setIsCreateNoteFullscreen] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteContent, setEditingNoteContent] = useState("");

  const categoryColors = ["#4A6572", "#FF6B6B", "#48DBFB", "#1DD1A1", "#F368E0", "#FF9F43"];

  // 🔹 Chargement initial
  useEffect(() => {
    console.log("📝 Initialisation de l'écran Notes...");
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // 🔹 Chargement sécurisé
  async function loadData() {
    try {
      console.log("🔄 Chargement des données depuis AsyncStorage...");
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);

        //  Compatibilité ancien format { categories: [...] }
        const loadedCategories: Category[] = Array.isArray(parsed)
          ? parsed
          : parsed.categories ?? [];

        console.log(` ${loadedCategories.length} catégorie(s) chargée(s) avec succès`);
        setCategories(loadedCategories);
        setSelectedCategoryId(loadedCategories[0]?.id ?? null);
        
        if (loadedCategories.length > 0) {
          const totalNotes = loadedCategories.reduce((acc, cat) => acc + cat.notes.length, 0);
          console.log(`📋 ${totalNotes} note(s) trouvée(s) dans les catégories`);
        }
      } else {
        console.log("🆕 Aucune donnée trouvée, création des données initiales...");
        const initial: Category[] = [
          { id: Date.now().toString(), name: "Général", color: "#4A6572", notes: [] },
        ];
        setCategories(initial);
        setSelectedCategoryId(initial[0].id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        console.log(" Données initiales créées avec succès");
      }
    } catch (error) {
      console.error(" Erreur chargement notes:", error);
      Alert.alert("Erreur", "Impossible de charger les notes.");
    }
  }

  async function saveData(nextData: Category[]) {
    try {
      console.log(` Sauvegarde de ${nextData.length} catégorie(s)...`);
      const totalNotes = nextData.reduce((acc, cat) => acc + cat.notes.length, 0);
      console.log(` ${totalNotes} note(s) à sauvegarder`);
      
      setCategories(nextData);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      console.log(" Données sauvegardées avec succès");
    } catch (error) {
      console.error(" Erreur sauvegarde notes:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les données.");
    }
  }

  // 🔹 Gestion Catégories
  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      console.log(" Tentative d'ajout de catégorie sans nom");
      return Alert.alert("Nom requis", "Donnez un nom à la catégorie.");
    }

    console.log(` Ajout d'une nouvelle catégorie: "${name}"`);
    const randomColor = categoryColors[Math.floor(Math.random() * categoryColors.length)];
    const newCat: Category = {
      id: Date.now().toString(),
      name,
      color: randomColor,
      notes: [],
    };

    const next = [newCat, ...categories];
    await saveData(next);
    setNewCategoryName("");
    setSelectedCategoryId(newCat.id);
    console.log(` Catégorie "${name}" créée avec succès`);
    
    // Message de confirmation
    Alert.alert("Succès", `Catégorie "${name}" créée avec succès !`);
  }

  function confirmDeleteCategory(categoryId: string) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      console.log(" Tentative de suppression d'une catégorie inexistante");
      return;
    }

    console.log(` Demande de confirmation pour supprimer la catégorie: "${category.name}"`);
    Alert.alert(
      "Supprimer la catégorie",
      category.notes.length
        ? `Cette catégorie contient ${category.notes.length} note(s). Voulez-vous vraiment la supprimer ?`
        : `Supprimer "${category.name}" ?`,
      [
        { text: "Annuler", style: "cancel", onPress: () => console.log("❌ Suppression annulée") },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteCategory(categoryId),
        },
      ]
    );
  }

  async function deleteCategory(categoryId: string) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    console.log(` Suppression de la catégorie: "${category.name}"`);
    const next = categories.filter((c) => c.id !== categoryId);
    await saveData(next);
    console.log(` Catégorie "${category.name}" supprimée avec succès`);
    
    // Message de confirmation
    Alert.alert("Succès", `Catégorie "${category.name}" supprimée avec succès !`);
  }

  // 🔹 Notes
  async function addNote() {
    if (!selectedCategoryId) {
      console.log(" Tentative d'ajout de note sans catégorie sélectionnée");
      return Alert.alert("Erreur", "Aucune catégorie sélectionnée.");
    }
    
    const title = noteTitle.trim() || "Sans titre";
    const content = noteContent.trim();
    if (!content) {
      console.log(" Tentative d'ajout de note vide");
      return Alert.alert("Erreur", "La note ne peut pas être vide.");
    }

    console.log(` Ajout d'une nouvelle note: "${title}"`);
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    const next = categories.map((cat) =>
      cat.id === selectedCategoryId
        ? { ...cat, notes: [newNote, ...cat.notes] }
        : cat
    );
    await saveData(next);
    setNoteTitle("");
    setNoteContent("");
    console.log(` Note "${title}" ajoutée avec succès`);
    
    // Message de confirmation
    Alert.alert("Succès", "Note ajoutée avec succès !");
  }

  async function deleteNote(categoryId: string, noteId: string) {
    const category = categories.find((c) => c.id === categoryId);
    const note = category?.notes.find((n) => n.id === noteId);
    
    if (!note) {
      console.log("❌ Tentative de suppression d'une note inexistante");
      return;
    }

    console.log(` Suppression de la note: "${note.title}"`);
    const next = categories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, notes: cat.notes.filter((n) => n.id !== noteId) }
        : cat
    );
    await saveData(next);
    console.log(` Note "${note.title}" supprimée avec succès`);
    
    // Message de confirmation
    Alert.alert("Succès", "Note supprimée avec succès !");
  }

  async function saveEditedNote() {
    if (!viewingNote || !selectedCategoryId) {
      console.log(" Tentative de sauvegarde d'édition sans note ou catégorie");
      return;
    }

    const updatedTitle = editingNoteTitle.trim() || "Sans titre";
    const updatedContent = editingNoteContent.trim();

    console.log(` Sauvegarde des modifications de la note: "${viewingNote.title}" → "${updatedTitle}"`);
    
    const next = categories.map((cat) =>
      cat.id === selectedCategoryId
        ? {
            ...cat,
            notes: cat.notes.map((n) =>
              n.id === viewingNote.id
                ? { ...n, title: updatedTitle, content: updatedContent }
                : n
            ),
          }
        : cat
    );

    await saveData(next);
    closeViewNoteFullscreen();
    console.log(` Note "${updatedTitle}" modifiée avec succès`);
    
    // Message de confirmation
    Alert.alert("Succès", "Note modifiée avec succès !");
  }

  // 🔹 Plein écran - Vue
  const openViewNoteFullscreen = (note: Note) => {
    console.log(` Ouverture de la note en mode plein écran: "${note.title}"`);
    setViewingNote(note);
    setEditingNoteTitle(note.title);
    setEditingNoteContent(note.content);
    setIsViewNoteFullscreen(true);
  };

  const closeViewNoteFullscreen = () => {
    console.log(" Fermeture du mode édition plein écran");
    setIsViewNoteFullscreen(false);
    setViewingNote(null);
  };

  // 🔹 Plein écran - Création
  const openCreateNoteFullscreen = () => {
    console.log(" Ouverture du mode création plein écran");
    setIsCreateNoteFullscreen(true);
  };

  const closeCreateNoteFullscreen = () => {
    console.log(" Fermeture du mode création plein écran");
    setIsCreateNoteFullscreen(false);
  };

  async function saveNoteFromFullscreen() {
    if (!selectedCategoryId) {
      console.log(" Tentative de sauvegarde plein écran sans catégorie sélectionnée");
      return Alert.alert("Erreur", "Aucune catégorie sélectionnée.");
    }
    
    const title = noteTitle.trim() || "Sans titre";
    const content = noteContent.trim();
    if (!content) {
      console.log(" Tentative de sauvegarde d'une note vide en mode plein écran");
      return Alert.alert("Erreur", "La note ne peut pas être vide.");
    }

    console.log(` Sauvegarde d'une nouvelle note depuis le mode plein écran: "${title}"`);
    
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    const next = categories.map((cat) =>
      cat.id === selectedCategoryId
        ? { ...cat, notes: [newNote, ...cat.notes] }
        : cat
    );
    await saveData(next);
    setNoteTitle("");
    setNoteContent("");
    closeCreateNoteFullscreen();
    console.log(` Note "${title}" créée en mode plein écran avec succès`);
    
    // Message de confirmation
    Alert.alert("Succès", "Note créée avec succès !");
  }

  // 🔹 Changement de catégorie sélectionnée
  const handleCategorySelect = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    console.log(` Catégorie sélectionnée: "${category?.name}" (${category?.notes.length} notes)`);
    setSelectedCategoryId(categoryId);
  };

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  // 🔹 Rendu des notes
  function renderNoteItem(note: Note, index: number) {
    return (
      <Animated.View
        key={note.id}
        style={[
          styles.noteItem,
          { opacity: fadeAnim, transform: [{ translateY: index * 10 }] },
        ]}
      >
        <TouchableOpacity
          style={styles.noteContentArea}
          onPress={() => openViewNoteFullscreen(note)}
        >
          <Text style={styles.noteTitle}>{note.title}</Text>
          <Text style={styles.noteContent} numberOfLines={3}>
            {note.content || "— (vide)"}
          </Text>
          <Text style={styles.noteDate}>
            {new Date(note.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>

        <View style={styles.noteActions}>
          <TouchableOpacity
            onPress={() => {
              console.log(`🗑️ Bouton suppression cliqué pour la note: "${note.title}"`);
              deleteNote(selectedCategoryId!, note.id);
            }}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  //  UI principale
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes & Carnet</Text>
        <Text style={styles.headerSubtitle}>Organisez vos idées</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Catégories */}
          <Text style={styles.sectionTitle}>Catégories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => handleCategorySelect(cat.id)}
                onLongPress={() => {
                  console.log(` Appui long détecté sur la catégorie: "${cat.name}"`);
                  confirmDeleteCategory(cat.id);
                }}
              >
                <View style={[styles.categoryColor, { backgroundColor: cat.color }]} />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategoryId === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.name} ({cat.notes.length})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Nouvelle catégorie */}
          <View style={styles.newCategoryRow}>
            <TextInput
              placeholder="Nouvelle catégorie..."
              value={newCategoryName}
              onChangeText={(text) => {
                console.log(`✏️ Saisie nom catégorie: "${text}"`);
                setNewCategoryName(text);
              }}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={addCategory}
              style={styles.addBtn}
              disabled={!newCategoryName.trim()}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Nouvelle note */}
          <Text style={styles.sectionTitle}>Nouvelle note</Text>
          <TextInput
            placeholder="Titre de la note..."
            value={noteTitle}
            onChangeText={(text) => {
              console.log(`✏️ Saisie titre note: "${text}"`);
              setNoteTitle(text);
            }}
            style={styles.input}
          />
          <View style={styles.contentInputContainer}>
            <TextInput
              placeholder="Contenu..."
              value={noteContent}
              onChangeText={(text) => {
                console.log(`✏️ Saisie contenu note: ${text.length} caractères`);
                setNoteContent(text);
              }}
              multiline
              style={[styles.input, styles.contentInput]}
            />
            <TouchableOpacity 
              style={styles.fullscreenToggle}
              onPress={() => {
                console.log("🔄 Clic sur le bouton plein écran de création");
                openCreateNoteFullscreen();
              }}
            >
              <Ionicons name="expand" size={16} color="#4A6572" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, (!noteTitle && !noteContent) && styles.primaryBtnDisabled]}
            onPress={() => {
              console.log(" Clic sur le bouton Ajouter une note");
              addNote();
            }}
            disabled={!noteTitle.trim() && !noteContent.trim()}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Ajouter</Text>
          </TouchableOpacity>

          {/* Liste des notes */}
          <Text style={styles.sectionTitle}>
            {activeCategory ? `Notes dans "${activeCategory.name}" (${activeCategory.notes.length})` : "Aucune catégorie"}
          </Text>

          {activeCategory?.notes?.length ? (
            activeCategory.notes.map((note, i) => renderNoteItem(note, i))
          ) : (
            <Text style={styles.emptyText}>Aucune note pour l'instant.</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Mode édition plein écran */}
      <Modal visible={isViewNoteFullscreen} animationType="slide">
        <SafeAreaView style={styles.fullscreenContainer}>
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity onPress={() => {
              console.log("🔙 Clic sur le bouton retour édition");
              closeViewNoteFullscreen();
            }}>
              <Ionicons name="arrow-back" size={24} color="#4A6572" />
            </TouchableOpacity>
            <Text style={styles.fullscreenTitle}>Modifier la note</Text>
            <TouchableOpacity onPress={() => {
              console.log("💾 Clic sur le bouton sauvegarder édition");
              saveEditedNote();
            }}>
              <Ionicons name="save-outline" size={22} color="#4A6572" />
            </TouchableOpacity>
          </View>

          <View style={styles.fullscreenContent}>
            <TextInput
              value={editingNoteTitle}
              onChangeText={(text) => {
                console.log(` Modification titre note: "${text}"`);
                setEditingNoteTitle(text);
              }}
              style={styles.input}
              placeholder="Titre..."
            />
            <TextInput
              value={editingNoteContent}
              onChangeText={(text) => {
                console.log(` Modification contenu note: ${text.length} caractères`);
                setEditingNoteContent(text);
              }}
              style={[styles.fullscreenTextInput]}
              multiline
              placeholder="Contenu..."
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Mode création plein écran */}
      <Modal visible={isCreateNoteFullscreen} animationType="slide">
        <SafeAreaView style={styles.fullscreenContainer}>
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity onPress={() => {
              console.log("🔙 Clic sur le bouton retour création");
              closeCreateNoteFullscreen();
            }}>
              <Ionicons name="arrow-back" size={24} color="#4A6572" />
            </TouchableOpacity>
            <Text style={styles.fullscreenTitle}>Nouvelle note</Text>
            <TouchableOpacity onPress={() => {
              console.log(" Clic sur le bouton sauvegarder création");
              saveNoteFromFullscreen();
            }}>
              <Ionicons name="save-outline" size={22} color="#4A6572" />
            </TouchableOpacity>
          </View>

          <View style={styles.fullscreenContent}>
            <TextInput
              placeholder="Titre de la note..."
              value={noteTitle}
              onChangeText={(text) => {
                console.log(`✏️ Saisie titre note (plein écran): "${text}"`);
                setNoteTitle(text);
              }}
              style={styles.input}
            />
            <TextInput
              placeholder="Contenu..."
              value={noteContent}
              onChangeText={(text) => {
                console.log(`✏️ Saisie contenu note (plein écran): ${text.length} caractères`);
                setNoteContent(text);
              }}
              multiline
              style={[styles.fullscreenTextInput]}
              autoFocus
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// 🔹 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFD" },
  header: {
    backgroundColor: "#FFF",
    paddingVertical: 20,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#2D3748" },
  headerSubtitle: { fontSize: 14, color: "#718096", marginTop: 4 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginVertical: 10, color: "#2D3748" },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryChipActive: { backgroundColor: "#4A6572" },
  categoryText: { color: "#2D3748", fontWeight: "600" },
  categoryTextActive: { color: "#fff" },
  categoryColor: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  newCategoryRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  input: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  contentInputContainer: {
    position: 'relative',
  },
  contentInput: {
    height: 200,
    paddingRight: 40, // Espace pour le bouton
  },
  fullscreenToggle: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    backgroundColor: '#F0F4F8',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addBtn: {
    marginLeft: 10,
    backgroundColor: "#4A6572",
    padding: 12,
    borderRadius: 10,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A6572",
    padding: 14,
    borderRadius: 10,
  },
  primaryBtnDisabled: { backgroundColor: "#A0AEC0" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  noteItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4A6572",
  },
  noteContentArea: { flex: 1 },
  noteTitle: { fontSize: 16, fontWeight: "700", color: "#2D3748" },
  noteContent: { fontSize: 14, color: "#4A5568", marginVertical: 4 },
  noteDate: { fontSize: 12, color: "#718096" },
  noteActions: { flexDirection: "row", justifyContent: "flex-end" },
  deleteBtn: {
    backgroundColor: "#F56565",
    padding: 8,
    borderRadius: 6,
  },
  emptyText: { textAlign: "center", color: "#A0AEC0", marginTop: 20 },
  fullscreenContainer: { flex: 1, backgroundColor: "#F8FAFD" },
  fullscreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  fullscreenTitle: { fontSize: 18, fontWeight: "700", color: "#2D3748" },
  fullscreenContent: { 
    flex: 1, 
    padding: 16,
  },
  fullscreenTextInput: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
    textAlignVertical: 'top',
  },
});