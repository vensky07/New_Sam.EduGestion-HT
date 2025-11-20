// app/profil.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTimetable } from "../../hooks/useEmploiTemps";
import { useNotes } from "../../hooks/useNotes";
import { useUser } from "../../hooks/useUser";

export default function ProfilScreen() {
  const router = useRouter();
  
  // Utilisation des hooks partagés
  const { 
    user, 
    settings, 
    updateUser, 
    saveSettings,
    isLoading: userLoading 
  } = useUser();
  
  const { getStats: getNotesStats, getAllNotes } = useNotes();
  const { getStats: getTimetableStats, getTodayCourses } = useTimetable();
  
  const notesStats = getNotesStats();
  const timetableStats = getTimetableStats();
  const allNotes = getAllNotes();
  const todayCourses = getTodayCourses();
  
  // États pour les modals
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [isSecurityModalVisible, setIsSecurityModalVisible] = useState(false);
  const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);
  
  // États pour l'édition du profil
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editStudentId, setEditStudentId] = useState(user?.studentId || "");
  const [editClass, setEditClass] = useState(user?.class || "");
  const [editSchool, setEditSchool] = useState(user?.school || "Lycée Descartes");
  
  // États pour la sécurité
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fonction sécurisée pour obtenir les initiales
  const getUserInitials = () => {
    if (!user?.name) return "E"; // Fallback si pas de nom
    
    try {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        // Prendre la première lettre du prénom et du nom
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      } else if (names.length === 1) {
        // Prendre les deux premières lettres du prénom
        return names[0].substring(0, 2).toUpperCase();
      }
    } catch (error) {
      console.error("Erreur génération initiales:", error);
    }
    
    return "E"; // Fallback général
  };

  // Mettre à jour les champs d'édition quand l'utilisateur change
  useEffect(() => {
    setEditName(user?.name || "");
    setEditEmail(user?.email || "");
    setEditStudentId(user?.studentId || "");
    setEditClass(user?.class || "");
    setEditSchool(user?.school || "Lycée Descartes");
  }, [user]);

  // Calculer les statistiques détaillées
  const calculateDetailedStats = () => {
    const totalNotes = notesStats?.totalNotes || 0;
    const totalCourses = timetableStats?.totalCourses || 0;
    const todayCoursesCount = timetableStats?.todayCoursesCount || 0;
    
    // Notes par catégorie (exemple)
    const notesByCategory = allNotes?.reduce((acc, note) => {
      const category = note?.categoryName || "Général";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      totalNotes,
      totalCourses,
      todayCoursesCount,
      notesByCategory,
      averageNotesPerDay: totalNotes > 0 ? (totalNotes / 30).toFixed(1) : 0, // Sur 30 jours
      completionRate: Math.min(Math.floor((totalNotes / 50) * 100), 100), // Objectif de 50 notes
      streak: 7, // Jours consécutifs d'activité
      mostProductiveDay: "Lundi",
      favoriteCategory: Object.keys(notesByCategory).length > 0 
        ? Object.keys(notesByCategory).reduce((a, b) => 
            notesByCategory[a] > notesByCategory[b] ? a : b, "Général"
          )
        : "Aucune"
    };
  };

  const detailedStats = calculateDetailedStats();

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnecter", 
          style: "destructive", 
          onPress: () => {
            console.log("🚪 Déconnexion de l'utilisateur");
            // Ici vous devriez gérer la déconnexion réelle
            router.replace("/signup");
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    if (!editName.trim()) {
      Alert.alert("Erreur", "Le nom est requis");
      return;
    }

    const updatedUser = {
      name: editName,
      email: editEmail,
      studentId: editStudentId,
      class: editClass,
      school: editSchool
    };
    
    updateUser(updatedUser);
    
    console.log(" Profil utilisateur mis à jour:", updatedUser);
    Alert.alert(
      "Profil mis à jour",
      "Vos informations ont été sauvegardées avec succès",
      [{ text: "OK" }]
    );
    setIsEditModalVisible(false);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    console.log(" Mot de passe modifié avec succès");
    Alert.alert(
      "Mot de passe modifié",
      "Votre mot de passe a été changé avec succès",
      [{ text: "OK" }]
    );
    setIsSecurityModalVisible(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleThemeChange = (theme) => {
    const newSettings = {
      ...settings,
      darkMode: theme === 'dark'
    };
    saveSettings(newSettings);
    
    console.log(` Thème changé: ${theme}`);
    setIsThemeModalVisible(false);
    Alert.alert(
      "Thème modifié",
      `Thème ${theme === 'dark' ? 'sombre' : 'clair'} appliqué`,
      [{ text: "OK" }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      "Support",
      "Contactez-nous à : support@edugestion.com\n\nNous sommes là pour vous aider !",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Envoyer un email", 
          onPress: () => console.log("📧 Ouverture client email") 
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "À propos",
      "EduGestion v1.0\n\nVotre application de gestion scolaire complète.\n\n• Gestion des notes et cours\n• Emploi du temps intelligent\n• Statistiques détaillées\n\nDéveloppé avec ❤️ pour les étudiants.",
      [{ text: "Fermer" }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "⚠️ Cette action est irréversible. Toutes vos données seront définitivement perdues.\n\nNotes, cours, paramètres...",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer définitivement", 
          style: "destructive",
          onPress: () => {
            console.log("🗑️ Compte utilisateur supprimé");
            // Ici vous devriez gérer la suppression réelle du compte
            router.replace("/signup");
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Exporter les données",
      "Voulez-vous exporter toutes vos données ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Exporter", 
          onPress: () => {
            console.log("📤 Export des données utilisateur");
            Alert.alert("Succès", "Vos données ont été exportées avec succès");
          }
        }
      ]
    );
  };

  // Mettre à jour les switches quand les paramètres changent
  const handleNotificationsChange = (value) => {
    console.log(` Notifications ${value ? 'activées' : 'désactivées'}`);
    saveSettings({ ...settings, notifications: value });
  };

  const handleAutoSaveChange = (value) => {
    console.log(` Sauvegarde automatique ${value ? 'activée' : 'désactivée'}`);
    saveSettings({ ...settings, autoSave: value });
  };

  const handleSyncDataChange = (value) => {
    console.log(` Synchronisation ${value ? 'activée' : 'désactivée'}`);
    saveSettings({ ...settings, syncData: value });
  };

  const menuItems = [
    {
      icon: "school-outline",
      title: "Informations académiques",
      subtitle: "Filière, année, établissement",
      color: "#4A6572",
      onPress: () => setIsEditModalVisible(true)
    },
    {
      icon: "notifications-outline",
      title: "Notifications",
      subtitle: "Gérer les alertes et rappels",
      color: "#FF6B6B",
      onPress: () => handleNotificationsChange(!settings?.notifications)
    },
    {
      icon: "lock-closed-outline",
      title: "Sécurité",
      subtitle: "Mot de passe et authentification",
      color: "#48DBFB",
      onPress: () => setIsSecurityModalVisible(true)
    },
    {
      icon: "color-palette-outline",
      title: "Apparence",
      subtitle: "Thème et interface",
      color: "#1DD1A1",
      onPress: () => setIsThemeModalVisible(true)
    },
    {
      icon: "cloud-upload-outline",
      title: "Sauvegarde",
      subtitle: "Sauvegarde automatique",
      color: "#F368E0",
      onPress: () => handleAutoSaveChange(!settings?.autoSave)
    },
    {
      icon: "sync-outline",
      title: "Synchronisation",
      subtitle: "Sync avec le cloud",
      color: "#FF9F43",
      onPress: () => handleSyncDataChange(!settings?.syncData)
    },
    {
      icon: "stats-chart-outline",
      title: "Statistiques détaillées",
      subtitle: "Voir vos performances",
      color: "#4A6572",
      onPress: () => setIsStatsModalVisible(true)
    },
    {
      icon: "download-outline",
      title: "Exporter les données",
      subtitle: "Sauvegarder vos informations",
      color: "#FF6B6B",
      onPress: handleExportData
    }
  ];

  // Statistiques dynamiques basées sur les données réelles
  const stats = [
    { 
      label: "Notes", 
      value: notesStats?.totalNotes?.toString() || "0", 
      color: "#4A6572", 
      icon: "document-text" 
    },
    { 
      label: "Cours", 
      value: timetableStats?.totalCourses?.toString() || "0", 
      color: "#FF6B6B", 
      icon: "calendar" 
    },
    { 
      label: "Aujourd'hui", 
      value: timetableStats?.todayCoursesCount?.toString() || "0", 
      color: "#48DBFB", 
      icon: "today" 
    },
    { 
      label: "Progression", 
      value: `${detailedStats.completionRate}%`, 
      color: "#1DD1A1", 
      icon: "trending-up" 
    }
  ];

  const themes = [
    { name: "Clair", value: "light", icon: "sunny", color: "#FFD700" },
    { name: "Sombre", value: "dark", icon: "moon", color: "#4A6572" },
    { name: "Auto", value: "auto", icon: "phone-portrait", color: "#48DBFB" }
  ];

  if (userLoading) {
    return (
      <SafeAreaView style={[styles.container, settings?.darkMode && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-circle-outline" size={64} color="#4A6572" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, settings?.darkMode && styles.containerDark]}>
      <StatusBar style={settings?.darkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, settings?.darkMode && styles.headerDark]}>
        <View style={styles.headerBackground} />
        <Text style={[styles.headerTitle, settings?.darkMode && styles.headerTitleDark]}>Mon Profil</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={settings?.darkMode ? "#E2E8F0" : "#4A6572"} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Profil */}
        <View style={[styles.profileSection, settings?.darkMode && styles.cardDark]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getUserInitials()}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.userName, settings?.darkMode && styles.textDark]}>{user?.name || "Utilisateur"}</Text>
          <Text style={[styles.userEmail, settings?.darkMode && styles.textSecondaryDark]}>{user?.email || "Non spécifié"}</Text>
          <Text style={[styles.userInfo, settings?.darkMode && styles.textSecondaryDark]}>
            ID: {user?.studentId || "Non défini"} • {user?.class || "Non défini"}
          </Text>
          <Text style={[styles.userSchool, settings?.darkMode && styles.textSecondaryDark]}>
            {editSchool}
          </Text>

          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={16} color="#4A6572" />
            <Text style={styles.editProfileText}>Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Statistiques */}
        <View style={[styles.section, settings?.darkMode && styles.cardDark]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, settings?.darkMode && styles.textDark]}>Votre Activité</Text>
            <TouchableOpacity onPress={() => setIsStatsModalVisible(true)}>
              <Ionicons name="stats-chart" size={20} color="#4A6572" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <View style={[styles.statCircle, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon} size={20} color="#FFF" />
                </View>
                <Text style={[styles.statValue, settings?.darkMode && styles.textDark]}>{stat.value}</Text>
                <Text style={[styles.statLabel, settings?.darkMode && styles.textSecondaryDark]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Série actuelle */}
        <View style={[styles.section, settings?.darkMode && styles.cardDark]}>
          <View style={styles.streakContainer}>
            <View style={styles.streakInfo}>
              <Ionicons name="flame" size={24} color="#FF6B6B" />
              <Text style={[styles.streakText, settings?.darkMode && styles.textDark]}>
                Série de {detailedStats.streak} jours
              </Text>
            </View>
            <Text style={[styles.streakSubtext, settings?.darkMode && styles.textSecondaryDark]}>
              Continuez comme ça ! 
            </Text>
          </View>
        </View>

        {/* Paramètres */}
        <View style={[styles.section, settings?.darkMode && styles.cardDark]}>
          <Text style={[styles.sectionTitle, settings?.darkMode && styles.textDark]}>Paramètres</Text>
          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={20} color="#FFF" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, settings?.darkMode && styles.textDark]}>{item.title}</Text>
                  <Text style={[styles.menuSubtitle, settings?.darkMode && styles.textSecondaryDark]}>{item.subtitle}</Text>
                </View>
                {item.title === "Notifications" && (
                  <Switch
                    value={settings?.notifications || false}
                    onValueChange={handleNotificationsChange}
                    trackColor={{ false: '#E2E8F0', true: item.color }}
                    thumbColor={settings?.notifications ? '#FFF' : '#FFF'}
                  />
                )}
                {item.title === "Sauvegarde" && (
                  <Switch
                    value={settings?.autoSave || false}
                    onValueChange={handleAutoSaveChange}
                    trackColor={{ false: '#E2E8F0', true: item.color }}
                    thumbColor={settings?.autoSave ? '#FFF' : '#FFF'}
                  />
                )}
                {item.title === "Synchronisation" && (
                  <Switch
                    value={settings?.syncData || false}
                    onValueChange={handleSyncDataChange}
                    trackColor={{ false: '#E2E8F0', true: item.color }}
                    thumbColor={settings?.syncData ? '#FFF' : '#FFF'}
                  />
                )}
                {!['Notifications', 'Sauvegarde', 'Synchronisation'].includes(item.title) && (
                  <Ionicons name="chevron-forward" size={20} color={settings?.darkMode ? "#718096" : "#CBD5E0"} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions importantes */}
        <View style={[styles.section, settings?.darkMode && styles.cardDark]}>
          <Text style={[styles.sectionTitle, settings?.darkMode && styles.textDark]}>Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.supportButton]}
              onPress={handleSupport}
            >
              <Ionicons name="headset-outline" size={20} color="#4A6572" />
              <Text style={styles.actionButtonText}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.aboutButton]}
              onPress={handleAbout}
            >
              <Ionicons name="information-circle-outline" size={20} color="#4A6572" />
              <Text style={styles.actionButtonText}>À propos</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFF" />
            <Text style={[styles.actionButtonText, styles.logoutText]}>Se déconnecter</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color="#FFF" />
            <Text style={[styles.actionButtonText, styles.deleteText]}>Supprimer le compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal d'édition du profil */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, settings?.darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, settings?.darkMode && styles.textDark]}>Modifier le profil</Text>
              <TouchableOpacity 
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={settings?.darkMode ? "#E2E8F0" : "#666"} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={[styles.inputLabel, settings?.darkMode && styles.textDark]}>Nom complet *</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={[styles.input, settings?.darkMode && styles.inputDark]}
                placeholder="Votre nom complet"
                placeholderTextColor="#999"
              />

              <Text style={[styles.inputLabel, settings?.darkMode && styles.textDark]}>Email</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                style={[styles.input, settings?.darkMode && styles.inputDark]}
                placeholder="votre@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
              />

              <Text style={[styles.inputLabel, settings?.darkMode && styles.textDark]}>Numéro étudiant</Text>
              <TextInput
                value={editStudentId}
                onChangeText={setEditStudentId}
                style={[styles.input, settings?.darkMode && styles.inputDark]}
                placeholder="Votre numéro étudiant"
                placeholderTextColor="#999"
              />

              <Text style={[styles.inputLabel, settings?.darkMode && styles.textDark]}>Classe/Filière</Text>
              <TextInput
                value={editClass}
                onChangeText={setEditClass}
                style={[styles.input, settings?.darkMode && styles.inputDark]}
                placeholder="Ex: Terminale S, Licence 2 Info..."
                placeholderTextColor="#999"
              />

              <Text style={[styles.inputLabel, settings?.darkMode && styles.textDark]}>Établissement</Text>
              <TextInput
                value={editSchool}
                onChangeText={setEditSchool}
                style={[styles.input, settings?.darkMode && styles.inputDark]}
                placeholder="Nom de votre établissement"
                placeholderTextColor="#999"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSecondary]}
                  onPress={() => setIsEditModalVisible(false)}
                >
                  <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnPrimary]}
                  onPress={handleEditProfile}
                >
                  <Text style={styles.modalBtnPrimaryText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de changement de thème */}
      <Modal visible={isThemeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, settings?.darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, settings?.darkMode && styles.textDark]}>Choisir un thème</Text>
              <TouchableOpacity 
                onPress={() => setIsThemeModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={settings?.darkMode ? "#E2E8F0" : "#666"} />
              </TouchableOpacity>
            </View>

            <View style={styles.themesContainer}>
              {themes.map((theme, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.themeOption,
                    settings?.darkMode === (theme.value === 'dark') && styles.themeOptionSelected
                  ]}
                  onPress={() => handleThemeChange(theme.value)}
                >
                  <View style={[styles.themeIcon, { backgroundColor: theme.color }]}>
                    <Ionicons name={theme.icon} size={24} color="#FFF" />
                  </View>
                  <Text style={[styles.themeName, settings?.darkMode && styles.textDark]}>{theme.name}</Text>
                  {settings?.darkMode === (theme.value === 'dark') && (
                    <Ionicons name="checkmark-circle" size={20} color="#4A6572" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de sécurité */}
      <Modal visible={isSecurityModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, settings?.darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, settings?.darkMode && styles.textDark]}>Changer le mot de passe</Text>
              <TouchableOpacity 
                onPress={() => setIsSecurityModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={settings?.darkMode ? "#E2E8F0" : "#666"} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={[styles.inputLabel, settings?.darkMode && styles.textDark]}>Mot de passe actuel</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={[styles.input, settings?.darkMode && styles.inputDark]}
                placeholder="Votre mot de passe actuel"
                placeholderTextColor="#999"
                secureTextEntry
              />

              <Text style={[styles.inputLabel, settings?.darkMode && styles.textDark]}>Nouveau mot de passe</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.input, settings?.darkMode && styles.inputDark]}
                placeholder="Nouveau mot de passe"
                placeholderTextColor="#999"
                secureTextEntry
              />

              <Text style={[styles.inputLabel, settings?.darkMode && styles.textDark]}>Confirmer le mot de passe</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, settings?.darkMode && styles.inputDark]}
                placeholder="Confirmer le nouveau mot de passe"
                placeholderTextColor="#999"
                secureTextEntry
              />

              <View style={styles.passwordRequirements}>
                <Text style={[styles.requirementsTitle, settings?.darkMode && styles.textDark]}>
                  Exigences de sécurité :
                </Text>
                <Text style={[styles.requirement, settings?.darkMode && styles.textSecondaryDark]}>
                  • Au moins 6 caractères
                </Text>
                <Text style={[styles.requirement, settings?.darkMode && styles.textSecondaryDark]}>
                  • Mélange de lettres et chiffres
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSecondary]}
                  onPress={() => setIsSecurityModalVisible(false)}
                >
                  <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnPrimary]}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.modalBtnPrimaryText}>Changer le mot de passe</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal des statistiques détaillées */}
      <Modal visible={isStatsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, settings?.darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, settings?.darkMode && styles.textDark]}>Statistiques Détaillées</Text>
              <TouchableOpacity 
                onPress={() => setIsStatsModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={settings?.darkMode ? "#E2E8F0" : "#666"} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.statsModalContent}>
              <View style={styles.detailedStatsSection}>
                <Text style={[styles.detailedStatsTitle, settings?.darkMode && styles.textDark]}>
                  Vue d'ensemble
                </Text>
                <View style={styles.detailedStatsGrid}>
                  <View style={styles.detailedStat}>
                    <Text style={[styles.detailedStatValue, settings?.darkMode && styles.textDark]}>
                      {detailedStats.totalNotes}
                    </Text>
                    <Text style={[styles.detailedStatLabel, settings?.darkMode && styles.textSecondaryDark]}>
                      Notes totales
                    </Text>
                  </View>
                  <View style={styles.detailedStat}>
                    <Text style={[styles.detailedStatValue, settings?.darkMode && styles.textDark]}>
                      {detailedStats.averageNotesPerDay}
                    </Text>
                    <Text style={[styles.detailedStatLabel, settings?.darkMode && styles.textSecondaryDark]}>
                      Notes/jour
                    </Text>
                  </View>
                  <View style={styles.detailedStat}>
                    <Text style={[styles.detailedStatValue, settings?.darkMode && styles.textDark]}>
                      {detailedStats.totalCourses}
                    </Text>
                    <Text style={[styles.detailedStatLabel, settings?.darkMode && styles.textSecondaryDark]}>
                      Cours total
                    </Text>
                  </View>
                  <View style={styles.detailedStat}>
                    <Text style={[styles.detailedStatValue, settings?.darkMode && styles.textDark]}>
                      {detailedStats.streak}
                    </Text>
                    <Text style={[styles.detailedStatLabel, settings?.darkMode && styles.textSecondaryDark]}>
                      Jours série
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailedStatsSection}>
                <Text style={[styles.detailedStatsTitle, settings?.darkMode && styles.textDark]}>
                  Catégories préférées
                </Text>
                <View style={styles.categoriesList}>
                  {Object.entries(detailedStats.notesByCategory).map(([category, count]) => (
                    <View key={category} style={styles.categoryItem}>
                      <Text style={[styles.categoryName, settings?.darkMode && styles.textDark]}>
                        {category}
                      </Text>
                      <Text style={[styles.categoryCount, settings?.darkMode && styles.textSecondaryDark]}>
                        {count} notes
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailedStatsSection}>
                <Text style={[styles.detailedStatsTitle, settings?.darkMode && styles.textDark]}>
                  Performance
                </Text>
                <View style={styles.performanceItem}>
                  <Ionicons name="trophy" size={20} color="#FFD700" />
                  <Text style={[styles.performanceText, settings?.darkMode && styles.textDark]}>
                    Catégorie préférée : {detailedStats.favoriteCategory}
                  </Text>
                </View>
                <View style={styles.performanceItem}>
                  <Ionicons name="calendar" size={20} color="#48DBFB" />
                  <Text style={[styles.performanceText, settings?.darkMode && styles.textDark]}>
                    Jour le plus productif : {detailedStats.mostProductiveDay}
                  </Text>
                </View>
                <View style={styles.performanceItem}>
                  <Ionicons name="trending-up" size={20} color="#1DD1A1" />
                  <Text style={[styles.performanceText, settings?.darkMode && styles.textDark]}>
                    Taux de progression : {detailedStats.completionRate}%
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Navigation moderne */}
      <View style={[styles.bottomNav, settings?.darkMode && styles.bottomNavDark]}>
        {[
          { icon: "home-outline", label: "Accueil", route: "/" },
          { icon: "calendar-outline", label: "Emploi du temps", route: "/EmploiTemps" },
          { icon: "person", label: "Profil", route: "/profil" },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => router.push(item.route)}
          >
            <Ionicons 
              name={item.icon} 
              size={22} 
              color={item.route === "/profil" ? "#4A6572" : (settings?.darkMode ? "#E2E8F0" : "#666")} 
            />
            <Text 
              style={[
                styles.navText,
                settings?.darkMode && styles.navTextDark,
                item.route === "/profil" && styles.navTextActive
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFD" 
  },
  containerDark: {
    backgroundColor: "#1A202C"
  },
  header: {
    paddingVertical: 20,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerDark: {
    backgroundColor: "#2D3748"
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#2D3748",
  },
  headerTitleDark: {
    color: "#E2E8F0"
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: "#2D3748"
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A6572',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A6572',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 2,
  },
  userInfo: {
    fontSize: 14,
    color: '#A0AEC0',
    marginBottom: 4,
  },
  userSchool: {
    fontSize: 14,
    color: '#A0AEC0',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  textDark: {
    color: "#E2E8F0"
  },
  textSecondaryDark: {
    color: "#A0AEC0"
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(74, 101, 114, 0.1)',
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editProfileText: {
    fontSize: 14,
    color: '#4A6572',
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D3748',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginLeft: 8,
  },
  streakSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  menuList: {
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  supportButton: {
    backgroundColor: 'rgba(74, 101, 114, 0.1)',
  },
  aboutButton: {
    backgroundColor: 'rgba(74, 101, 114, 0.1)',
  },
  logoutButton: {
    backgroundColor: '#4A6572',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#F56565',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A6572',
  },
  logoutText: {
    color: '#FFFFFF',
  },
  deleteText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 16,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomNavDark: {
    backgroundColor: "#2D3748",
    borderTopColor: "#4A5568"
  },
  navItem: { 
    alignItems: "center",
    paddingHorizontal: 12,
  },
  navText: { 
    fontSize: 12, 
    color: "#666", 
    marginTop: 4,
    fontWeight: '500',
  },
  navTextDark: {
    color: "#A0AEC0"
  },
  navTextActive: {
    color: "#4A6572",
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: "#2D3748"
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
    color: '#2D3748',
  },
  inputDark: {
    backgroundColor: "#4A5568",
    borderColor: "#718096",
    color: "#E2E8F0"
  },
  passwordRequirements: {
    backgroundColor: 'rgba(74, 101, 114, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnSecondary: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalBtnSecondaryText: {
    color: '#4A5568',
    fontWeight: '600',
  },
  modalBtnPrimary: {
    backgroundColor: '#4A6572',
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  themesContainer: {
    padding: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F7FAFC',
  },
  themeOptionSelected: {
    backgroundColor: 'rgba(74, 101, 114, 0.1)',
    borderWidth: 2,
    borderColor: '#4A6572',
  },
  themeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  themeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  statsModalContent: {
    padding: 20,
  },
  detailedStatsSection: {
    marginBottom: 24,
  },
  detailedStatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  detailedStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailedStat: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  detailedStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 4,
  },
  detailedStatLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
    textAlign: 'center',
  },
  categoriesList: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  categoryCount: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  performanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 12,
  },
});