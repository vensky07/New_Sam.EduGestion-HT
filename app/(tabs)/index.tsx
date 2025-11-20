// app/index.js
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTimetable } from "../../hooks/useEmploiTemps";
import { useNotes } from "../../hooks/useNotes";
import { useUser } from "../../hooks/useUser";

export default function HomeScreen() {
  const router = useRouter();
  
  // Utilisation des hooks avec gestion d'erreur
  let notesData, timetableData, userData;
  
  try {
    notesData = useNotes();
    timetableData = useTimetable();
    userData = useUser();
  } catch (error) {
    console.error("Erreur lors du chargement des hooks:", error);
    // Fallback si les hooks ne fonctionnent pas
    notesData = {
      getRecentNotes: () => [],
      getStats: () => ({ totalNotes: 0, totalCategories: 0, recentNotesCount: 0 }),
      isLoading: false
    };
    timetableData = {
      getStats: () => ({ totalCourses: 0, todayCoursesCount: 0, hasNextCourse: false, nextCourse: null }),
      getNextCourse: () => null,
      isLoading: false
    };
    userData = {
      user: { name: "Étudiant" },
      getUserStats: () => ({ notesCount: 0, coursesToday: 0, totalCourses: 0, completionRate: 0 }),
      isLoading: false
    };
  }

  const { getRecentNotes, getStats: getNotesStats, isLoading: notesLoading } = notesData;
  const { getStats: getTimetableStats, getNextCourse, isLoading: timetableLoading } = timetableData;
  const { user, getUserStats, isLoading: userLoading } = userData;

  const recentNotes = getRecentNotes(2);
  const notesStats = getNotesStats();
  const timetableStats = getTimetableStats();
  const nextCourse = getNextCourse();
  const userStats = getUserStats(notesStats, timetableStats);

  const quickActions = [
    {
      icon: "document-text",
      name: "Notes & Carnet",
      description: "Gérer vos notes",
      route: "/notes",
      color: "#4A6572",
      iconType: "Ionicons"
    },
    {
      icon: "calendar-alt",
      name: "Emploi du temps",
      description: "Voir votre planning",
      route: "/EmploiTemps",
      color: "#FF6B6B",
      iconType: "FontAwesome5"
    },
    {
      icon: "notifications",
      name: "Notifications",
      description: "Alertes importantes",
      route: "/notification",
      color: "#48DBFB",
      iconType: "Ionicons"
    },
    {
      icon: "payment",
      name: "Paiements",
      description: "Gestion financière",
      route: "/paiement",
      color: "#1DD1A1",
      iconType: "MaterialIcons"
    },
  ];

  const renderIcon = (item) => {
    const props = { size: 28, color: "#FFF" };
    
    switch (item.iconType) {
      case "MaterialIcons":
        return <MaterialIcons name={item.icon} {...props} />;
      case "FontAwesome5":
        return <FontAwesome5 name={item.icon} {...props} />;
      default:
        return <Ionicons name={item.icon} {...props} />;
    }
  };

  // Fonction pour afficher l'avatar ou les initiales
  const renderUserAvatar = () => {
    if (user?.avatar) {
      return (
        <Image 
          source={{ uri: user.avatar }} 
          style={styles.userAvatar}
        />
      );
    }
    return (
      <View style={styles.userInitials}>
        <Text style={styles.userInitialsText}>
          {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "E"}
        </Text>
      </View>
    );
  };

  // Fonction pour formater la date des notes
  const formatNoteDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours < 1) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return `Il y a ${diffMinutes} min`;
        }
        return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 1) {
        return "Hier";
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
      } else {
        return date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        });
      }
    } catch (error) {
      return "Date inconnue";
    }
  };

  // Fonction pour calculer le temps restant avant le prochain cours
  const getTimeUntilCourse = (course) => {
    if (!course) return null;
    
    try {
      const now = new Date();
      const [hours, minutes] = course.startTime.split(':').map(Number);
      const courseTime = new Date();
      courseTime.setHours(hours, minutes, 0, 0);
      
      const diffMs = courseTime - now;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 0) {
        // Cours en cours
        const endTime = new Date();
        const [endHours, endMinutes] = course.endTime.split(':').map(Number);
        endTime.setHours(endHours, endMinutes, 0, 0);
        const remainingMinutes = Math.floor((endTime - now) / (1000 * 60));
        return remainingMinutes > 0 ? `En cours (${remainingMinutes}min restantes)` : "Terminé";
      } else if (diffMinutes < 60) {
        return `Dans ${diffMinutes} min`;
      } else {
        const hoursLeft = Math.floor(diffMinutes / 60);
        const minsLeft = diffMinutes % 60;
        return `Dans ${hoursLeft}h${minsLeft > 0 ? `${minsLeft}min` : ''}`;
      }
    } catch (error) {
      return "Horaire inconnu";
    }
  };

  // Obtenir le statut du cours pour la couleur du point
  const getCourseStatus = (course) => {
    if (!course) return '#CBD5E0';
    
    const now = new Date();
    const [startHours, startMinutes] = course.startTime.split(':').map(Number);
    const [endHours, endMinutes] = course.endTime.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHours, startMinutes, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHours, endMinutes, 0, 0);
    
    if (now >= startTime && now <= endTime) {
      return '#48BB78'; // En cours - vert
    } else if (now < startTime) {
      const diffMinutes = Math.floor((startTime - now) / (1000 * 60));
      return diffMinutes <= 30 ? '#ED8936' : '#4299E1'; // Bientôt - orange, Plus tard - bleu
    } else {
      return '#CBD5E0'; // Terminé - gris
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header avec dégradé */}
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <Text style={styles.headerTitle}>EduGestion</Text>
        <Text style={styles.headerSubtitle}>Votre assistant éducatif</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Section de bienvenue */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeHeader}>
              {renderUserAvatar()}
              <View>
                <Text style={styles.welcome}>Bonjour,</Text>
                <Text style={styles.name}>{user?.name || "Étudiant"} 👋</Text>
              </View>
            </View>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          {/* Cartes statistiques */}
          <View style={styles.statsSection}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(74, 101, 114, 0.1)' }]}>
                  <Ionicons name="document-text" size={20} color="#4A6572" />
                </View>
                <Text style={styles.statNumber}>{userStats.notesCount || 0}</Text>
                <Text style={styles.statLabel}>Notes</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                  <Ionicons name="time" size={20} color="#FF6B6B" />
                </View>
                <Text style={styles.statNumber}>{userStats.coursesToday || 0}</Text>
                <Text style={styles.statLabel}>Cours aujourd'hui</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(29, 209, 161, 0.1)' }]}>
                  <Ionicons name="trending-up" size={20} color="#1DD1A1" />
                </View>
                <Text style={styles.statNumber}>{userStats.completionRate || 0}%</Text>
                <Text style={styles.statLabel}>Progression</Text>
              </View>
            </View>
          </View>

          {/* Actions rapides */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Actions rapides</Text>
              <Ionicons name="flash" size={20} color="#4A6572" />
            </View>

            <View style={styles.grid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.card}
                  onPress={() => router.push(action.route)}
                >
                  <View style={[styles.cardIcon, { backgroundColor: action.color }]}>
                    {renderIcon(action)}
                  </View>
                  <Text style={styles.cardTitle}>{action.name}</Text>
                  <Text style={styles.cardDescription}>{action.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Prochain cours */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {nextCourse ? "Prochain cours" : "Aujourd'hui"}
              </Text>
              <Ionicons name="calendar" size={20} color="#4A6572" />
            </View>

            {timetableLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Chargement des cours...</Text>
              </View>
            ) : nextCourse ? (
              <TouchableOpacity 
                style={styles.nextClassCard}
                onPress={() => router.push("/EmploiTemps")}
              >
                <View style={styles.classTime}>
                  <Text style={styles.classHour}>{nextCourse.startTime}</Text>
                  <Text style={styles.classDuration}>- {nextCourse.endTime}</Text>
                </View>
                
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{nextCourse.title}</Text>
                  <Text style={styles.classRoom}>{nextCourse.room}</Text>
                  <Text style={styles.classTeacher}>{nextCourse.teacher}</Text>
                </View>

                <View style={styles.classStatus}>
                  <View style={[styles.statusDot, { backgroundColor: getCourseStatus(nextCourse) }]} />
                  <Text style={styles.statusText}>
                    {getTimeUntilCourse(nextCourse)}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : timetableStats.todayCoursesCount > 0 ? (
              <View style={styles.todaySummaryCard}>
                <View style={styles.todaySummaryHeader}>
                  <Ionicons name="checkmark-done-circle" size={24} color="#48BB78" />
                  <Text style={styles.todaySummaryTitle}>Aucun cours restant aujourd'hui</Text>
                </View>
                <Text style={styles.todaySummaryText}>
                  {timetableStats.todayCoursesCount || 0} cours terminés aujourd'hui
                </Text>
                <TouchableOpacity 
                  style={styles.seeTimetableButton}
                  onPress={() => router.push("/EmploiTemps")}
                >
                  <Text style={styles.seeTimetableText}>Voir l'emploi du temps</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyTimetableCard}>
                <View style={styles.emptyTimetableHeader}>
                  <Ionicons name="calendar-outline" size={24} color="#CBD5E0" />
                  <Text style={styles.emptyTimetableTitle}>Aucun cours aujourd'hui</Text>
                </View>
                <Text style={styles.emptyTimetableText}>
                  Profitez de votre journée pour réviser ou vous avancer
                </Text>
                <TouchableOpacity 
                  style={styles.addCourseButton}
                  onPress={() => router.push("/EmploiTemps")}
                >
                  <Text style={styles.addCourseText}>Ajouter un cours</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Notes récentes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notes récentes</Text>
              <Ionicons name="star" size={20} color="#4A6572" />
            </View>

            {notesLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Chargement des notes...</Text>
              </View>
            ) : recentNotes && recentNotes.length > 0 ? (
              <View style={styles.notesPreview}>
                {recentNotes.map((note, index) => (
                  <TouchableOpacity
                    key={note.id || index}
                    style={styles.notePreviewItem}
                    onPress={() => router.push("/notes")}
                  >
                    <View style={styles.notePreviewHeader}>
                      <Text style={styles.notePreviewTitle}>{note.title}</Text>
                      <Text style={styles.notePreviewTime}>
                        {formatNoteDate(note.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.notePreviewContent} numberOfLines={2}>
                      {note.content || "— (vide)"}
                    </Text>
                    <View style={[styles.notePreviewCategory, { backgroundColor: note.categoryColor || "#4A6572" }]}>
                      <Text style={styles.notePreviewCategoryText}>{note.categoryName || "Général"}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyNotesContainer}>
                <Ionicons name="document-text-outline" size={48} color="#CBD5E0" />
                <Text style={styles.emptyNotesText}>Aucune note pour le moment</Text>
                <Text style={styles.emptyNotesSubtext}>
                  Créez votre première note pour la voir apparaître ici
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push("/notes")}
            >
              <Text style={styles.seeAllText}>
                {recentNotes && recentNotes.length > 0 ? 'Voir toutes les notes' : 'Créer une note'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#4A6572" />
            </TouchableOpacity>
          </View>

          {/* Section Motivation */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Motivation du jour</Text>
              <Ionicons name="heart" size={20} color="#FF6B6B" />
            </View>
            
            <View style={styles.motivationCard}>
              <Ionicons name="bulb-outline" size={32} color="#FFD700" />
              <Text style={styles.motivationText}>
                "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte."
              </Text>
              <Text style={styles.motivationAuthor}>- Winston Churchill</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Navigation moderne */}
      <View style={styles.bottomNav}>
        {[
          { icon: "home", label: "Accueil", route: "/" },
          { icon: "calendar-outline", label: "Emploi du temps", route: "/EmploiTemps" },
          { icon: "person-outline", label: "Profil", route: "/profil" },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => router.push(item.route)}
          >
            <Ionicons 
              name={item.icon} 
              size={22} 
              color={item.route === "/" ? "#4A6572" : "#666"} 
            />
            <Text 
              style={[
                styles.navText,
                item.route === "/" && styles.navTextActive
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
  header: {
    paddingVertical: 25,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
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
    fontSize: 28, 
    fontWeight: "800", 
    color: "#2D3748",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#718096",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  content: { 
    padding: 16,
    paddingBottom: 100,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userInitials: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A6572',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInitialsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  welcome: { 
    fontSize: 18, 
    color: "#718096",
    marginBottom: 4,
  },
  name: { 
    fontSize: 32, 
    fontWeight: "800", 
    color: "#2D3748",
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: "#A0AEC0",
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#2D3748",
  },
  statsSection: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  grid: {
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#2D3748", 
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDescription: { 
    fontSize: 12, 
    color: "#718096",
    textAlign: 'center',
  },
  nextClassCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  classTime: {
    alignItems: 'center',
    marginRight: 16,
  },
  classHour: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  classDuration: {
    fontSize: 12,
    color: '#718096',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  classRoom: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 2,
  },
  classTeacher: {
    fontSize: 12,
    color: '#718096',
  },
  classStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '600',
  },
  todaySummaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  todaySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  todaySummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginLeft: 8,
  },
  todaySummaryText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 12,
  },
  seeTimetableButton: {
    backgroundColor: '#4A6572',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  seeTimetableText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTimetableCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyTimetableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTimetableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CBD5E0',
    marginLeft: 8,
  },
  emptyTimetableText: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 12,
  },
  addCourseButton: {
    backgroundColor: '#4A6572',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addCourseText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  notesPreview: {
    marginBottom: 12,
  },
  notePreviewItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notePreviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3748',
    flex: 1,
    marginRight: 8,
  },
  notePreviewTime: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  notePreviewContent: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
    marginBottom: 12,
  },
  notePreviewCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notePreviewCategoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  emptyNotesContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyNotesText: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyNotesSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A6572',
    fontWeight: '600',
    marginRight: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#718096',
    fontSize: 14,
  },
  motivationCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  motivationText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 8,
  },
  motivationAuthor: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  navTextActive: {
    color: "#4A6572",
    fontWeight: '700',
  },
});