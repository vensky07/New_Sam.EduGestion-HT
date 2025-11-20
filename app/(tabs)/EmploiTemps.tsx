import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { checkUpcomingCourses, getUnreadCount, saveNotifications } from "../../hooks/useNotifications";

const STORAGE_KEY = "@edugestion_timetable_v1";

export default function EmploiTempsScreen() {
  const router = useRouter();

  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState("Lundi");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // États du formulaire
  const [courseTitle, setCourseTitle] = useState("");
  const [courseTeacher, setCourseTeacher] = useState("");
  const [courseRoom, setCourseRoom] = useState("");
  const [courseStartTime, setCourseStartTime] = useState("08:00");
  const [courseEndTime, setCourseEndTime] = useState("09:00");
  const [courseDay, setCourseDay] = useState("Lundi");
  const [courseColor, setCourseColor] = useState("#4A6572");

  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
  ];
  const colors = ["#4A6572", "#FF6B6B", "#48DBFB", "#1DD1A1", "#F368E0", "#FF9F43"];

  // Charger le planning et les notifications
  useEffect(() => {
    loadData();
    const interval = startNotificationChecker();
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setSchedule(JSON.parse(stored));
      
      await updateUnreadCount();
    } catch (error) {
      console.error("Erreur de chargement :", error);
    }
  };

  const updateUnreadCount = async () => {
    const count = await getUnreadCount();
    setUnreadNotifications(count);
  };

  // Vérifier périodiquement les cours à venir
  const startNotificationChecker = () => {
    // Vérifier toutes les minutes
    const interval = setInterval(async () => {
      try {
        const upcoming = await checkUpcomingCourses();
        if (upcoming.length > 0) {
          const count = await saveNotifications(upcoming);
          if (count > 0) {
            await updateUnreadCount();
            console.log(` ${count} nouvelle(s) notification(s) créée(s)`);
          }
        }
      } catch (error) {
        console.error("Erreur vérification notifications:", error);
      }
    }, 60000); // 1 minute

    return interval;
  };

  // Sauvegarder le planning
  const saveSchedule = async (newSchedule) => {
    try {
      setSchedule(newSchedule);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSchedule));
      
      // Vérifier les notifications après sauvegarde
      setTimeout(async () => {
        const upcoming = await checkUpcomingCourses();
        if (upcoming.length > 0) {
          await saveNotifications(upcoming);
          await updateUnreadCount();
        }
      }, 1000);
    } catch (error) {
      console.error("Erreur de sauvegarde :", error);
      Alert.alert("Erreur", "Impossible de sauvegarder le planning");
    }
  };

  // Ajouter un cours
  const addCourse = () => {
    if (!courseTitle.trim()) {
      Alert.alert("Erreur", "Veuillez saisir le titre du cours");
      return;
    }

    const newCourse = {
      id: Date.now().toString(),
      title: courseTitle.trim(),
      teacher: courseTeacher.trim(),
      room: courseRoom.trim(),
      startTime: courseStartTime,
      endTime: courseEndTime,
      day: courseDay,
      color: courseColor,
    };

    saveSchedule([...schedule, newCourse]);

    setCourseTitle("");
    setCourseTeacher("");
    setCourseRoom("");
    setCourseStartTime("08:00");
    setCourseEndTime("09:00");
    setCourseColor("#4A6572");
    setIsAddModalVisible(false);

    Alert.alert("Succès", "Cours ajouté avec succès !");
  };

  // Supprimer un cours
  const deleteCourse = (courseId) => {
    Alert.alert("Supprimer le cours", "Êtes-vous sûr de vouloir supprimer ce cours ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          const newSchedule = schedule.filter((c) => c.id !== courseId);
          saveSchedule(newSchedule);
          setIsViewModalVisible(false);
          Alert.alert("Succès", "Cours supprimé avec succès");
        },
      },
    ]);
  };

  // Récupérer les cours d'un jour
  const getCoursesForDay = (day) => {
    return schedule
      .filter((course) => course.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Rendu de chaque créneau horaire
  const renderTimeSlot = (time) => {
    const course = getCoursesForDay(selectedDay).find((c) => c.startTime === time);

    return (
      <View key={time} style={styles.timeSlot}>
        <Text style={styles.timeText}>{time}</Text>
        <View style={styles.timeLine} />
        {course ? (
          <TouchableOpacity
            style={[styles.courseBlock, { backgroundColor: course.color }]}
            onPress={() => {
              setSelectedCourse(course);
              setIsViewModalVisible(true);
            }}
          >
            <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
            {course.room && <Text style={styles.courseRoom}>{course.room}</Text>}
            {course.teacher && <Text style={styles.courseTeacher}>{course.teacher}</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptySlot}
            onPress={() => {
              setCourseDay(selectedDay);
              setCourseStartTime(time);
              // Calculer l'heure de fin (+1 heure)
              const [hours, minutes] = time.split(':');
              const endTime = new Date();
              endTime.setHours(parseInt(hours) + 1, parseInt(minutes));
              setCourseEndTime(endTime.toTimeString().slice(0, 5));
              setIsAddModalVisible(true);
            }}
          >
            <Ionicons name="add" size={16} color="#CBD5E0" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête avec badge de notifications */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Emploi du Temps</Text>
            <Text style={styles.headerSubtitle}>
              {unreadNotifications > 0 
                ? ` ${unreadNotifications} alerte(s) non lue(s)` 
                : "Organisez votre semaine"
              }
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push("/notification")}
          >
            <Ionicons name="notifications-outline" size={24} color="#4A6572" />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Sélecteur de jours */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysSelector}>
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>
                {day}
              </Text>
              <View style={styles.courseCountBadge}>
                <Text style={styles.courseCount}>{getCoursesForDay(day).length}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grille horaire */}
        <ScrollView style={styles.scheduleGrid}>
          {timeSlots.map(renderTimeSlot)}
        </ScrollView>

        {/* Bouton d'ajout flottant */}
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => {
            setCourseDay(selectedDay);
            setIsAddModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Barre de navigation inférieure */}
      <View style={styles.bottomNav}>
        {[
          { icon: "home-outline", label: "Accueil", route: "/" },
          { icon: "calendar", label: "Emploi du Temps", route: "/EmploiTemps" },
          { icon: "person-outline", label: "Profil", route: "/profil" },
        ].map((tab, index) => (
          <TouchableOpacity
            key={tab.icon}
            style={styles.navItem}
            onPress={() => router.push(tab.route)}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={index === 1 ? "#4A6572" : "#666"}
            />
            <Text style={[styles.navText, index === 1 && styles.navTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal d'ajout de cours */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Cours</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <TextInput 
                placeholder="Titre du cours *" 
                value={courseTitle} 
                onChangeText={setCourseTitle} 
                style={styles.input} 
              />
              <TextInput 
                placeholder="Enseignant" 
                value={courseTeacher} 
                onChangeText={setCourseTeacher} 
                style={styles.input} 
              />
              <TextInput 
                placeholder="Salle" 
                value={courseRoom} 
                onChangeText={setCourseRoom} 
                style={styles.input} 
              />

              {/* Horaires */}
              <Text style={styles.sectionTitle}>Horaires</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Début</Text>
                  <TextInput 
                    value={courseStartTime} 
                    onChangeText={setCourseStartTime} 
                    style={styles.timeInput} 
                    placeholder="08:00"
                  />
                </View>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Fin</Text>
                  <TextInput 
                    value={courseEndTime} 
                    onChangeText={setCourseEndTime} 
                    style={styles.timeInput} 
                    placeholder="09:00"
                  />
                </View>
              </View>

              {/* Jours */}
              <Text style={styles.sectionTitle}>Jour</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.daysRow}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayOption, courseDay === day && styles.dayOptionActive]}
                      onPress={() => setCourseDay(day)}
                    >
                      <Text style={[styles.dayOptionText, courseDay === day && styles.dayOptionTextActive]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Couleur */}
              <Text style={styles.sectionTitle}>Couleur</Text>
              <View style={styles.colorsGrid}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, { backgroundColor: color }, courseColor === color && styles.colorOptionActive]}
                    onPress={() => setCourseColor(color)}
                  >
                    {courseColor === color && <Ionicons name="checkmark" size={16} color="#FFF" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bouton Ajouter */}
              <TouchableOpacity
                style={[styles.primaryBtn, !courseTitle.trim() && styles.primaryBtnDisabled]}
                onPress={addCourse}
                disabled={!courseTitle.trim()}
              >
                <Text style={styles.primaryBtnText}>Ajouter le cours</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Détails du cours */}
      <Modal visible={isViewModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCourse && (
              <>
                <View style={[styles.courseHeader, { backgroundColor: selectedCourse.color }]}>
                  <Text style={styles.courseHeaderTitle}>{selectedCourse.title}</Text>
                  <Text style={styles.courseHeaderTime}>
                    {selectedCourse.startTime} - {selectedCourse.endTime}
                  </Text>
                </View>

                <View style={styles.courseDetails}>
                  <DetailItem icon="person" text={selectedCourse.teacher || "Non spécifié"} />
                  <DetailItem icon="business" text={selectedCourse.room || "Non spécifié"} />
                  <DetailItem icon="calendar" text={selectedCourse.day} />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.secondaryBtn]} 
                    onPress={() => setIsViewModalVisible(false)}
                  >
                    <Text style={styles.secondaryBtnText}>Fermer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.dangerBtn]} 
                    onPress={() => deleteCourse(selectedCourse.id)}
                  >
                    <Ionicons name="trash" size={18} color="#FFF" />
                    <Text style={styles.dangerBtnText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Composant pour les détails du cours
const DetailItem = ({ icon, text }) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon} size={20} color="#4A6572" />
    <Text style={styles.detailText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFD" },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#2D3748", marginBottom: 4 },
  headerSubtitle: { color: "#718096", fontSize: 14 },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  notificationBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  content: { flex: 1, padding: 16 },
  daysSelector: { marginBottom: 20, maxHeight: 60 },
  dayChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  dayChipActive: { backgroundColor: "#4A6572" },
  dayText: { color: "#2D3748", fontWeight: "600", fontSize: 14, marginRight: 6 },
  dayTextActive: { color: "#fff" },
  courseCountBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  courseCount: {
    color: "#4A6572",
    fontSize: 12,
    fontWeight: "700",
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    height: 60,
  },
  timeText: { width: 50, fontSize: 12, fontWeight: "600", color: "#4A5568" },
  timeLine: {
    width: 1,
    height: "100%",
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  courseBlock: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  courseTitle: { color: "#FFF", fontWeight: "700", fontSize: 14, marginBottom: 2 },
  courseRoom: { color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 1 },
  courseTeacher: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontStyle: "italic" },
  emptySlot: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4A6572",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 6,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: { alignItems: "center", paddingHorizontal: 8 },
  navText: { fontSize: 11, color: "#666", marginTop: 4 },
  navTextActive: { color: "#4A6572", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#2D3748" },
  modalForm: { padding: 20 },
  input: {
    backgroundColor: "#F7FAFC",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 16,
    color: "#2D3748",
    marginBottom: 12,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#2D3748", 
    marginBottom: 12,
    marginTop: 8,
  },
  timeRow: { 
    flexDirection: "row", 
    gap: 12, 
    marginBottom: 16 
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: 6,
  },
  timeInput: {
    backgroundColor: "#F7FAFC",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 16,
    color: "#2D3748",
    textAlign: "center",
  },
  daysRow: { 
    flexDirection: "row", 
    marginBottom: 16,
    paddingVertical: 4,
  },
  dayOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  dayOptionActive: { 
    backgroundColor: "#4A6572", 
    borderColor: "#4A6572" 
  },
  dayOptionText: { 
    color: "#4A5568", 
    fontWeight: "500", 
    fontSize: 14 
  },
  dayOptionTextActive: { 
    color: "#FFF" 
  },
  colorsGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    marginBottom: 24,
    justifyContent: "center",
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 6,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  colorOptionActive: { 
    borderWidth: 3, 
    borderColor: "#2D3748",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  primaryBtn: {
    backgroundColor: "#4A6572",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#4A6572",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: "#CBD5E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  courseHeader: {
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  courseHeaderTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  courseHeaderTime: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "500",
  },
  courseDetails: {
    padding: 24,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 16,
    color: "#2D3748",
    marginLeft: 12,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  secondaryBtn: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryBtnText: {
    color: "#4A5568",
    fontWeight: "600",
    fontSize: 16,
  },
  dangerBtn: {
    backgroundColor: "#F56565",
    shadowColor: "#F56565",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  dangerBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});