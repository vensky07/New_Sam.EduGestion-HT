import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const DashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [recentGrades, setRecentGrades] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Récupérer les informations utilisateur
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Récupérer les notes récentes
        const gradesQuery = query(
          collection(db, 'grades'),
          where('userId', '==', user.uid)
        );
        const gradesSnapshot = await getDocs(gradesQuery);
        const grades = gradesSnapshot.docs.map(doc => doc.data());
        setRecentGrades(grades.slice(0, 3));

        // Récupérer les notifications
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid)
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const notifs = notificationsSnapshot.docs.map(doc => doc.data());
        setNotifications(notifs.slice(0, 3));

        // Récupérer le prochain cours
        const classesQuery = query(
          collection(db, 'schedule'),
          where('userId', '==', user.uid)
        );
        const classesSnapshot = await getDocs(classesQuery);
        if (classesSnapshot.docs.length > 0) {
          setNextClass(classesSnapshot.docs[0].data());
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* En-tête de bienvenue */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Bienvenue, {userData?.firstName || 'Étudiant'}
        </Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Prochain cours */}
      {nextClass && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prochain cours</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{nextClass.courseName}</Text>
            <Text style={styles.cardSubtitle}>
              {nextClass.professor} • {nextClass.time}
            </Text>
            <Text style={styles.cardLocation}>{nextClass.location}</Text>
          </View>
        </View>
      )}

      {/* Notes récentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notes récentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Grades')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {recentGrades.length > 0 ? (
          recentGrades.map((grade, index) => (
            <View key={index} style={styles.gradeItem}>
              <View style={styles.gradeInfo}>
                <Text style={styles.gradeCourse}>{grade.courseName}</Text>
                <Text style={styles.gradeDate}>
                  {new Date(grade.date?.toDate?.()).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={styles.gradeValue}>{grade.grade}/20</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune note disponible</Text>
        )}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <View key={index} style={styles.notificationItem}>
              <Text style={styles.notificationTitle}>{notif.title}</Text>
              <Text style={styles.notificationText}>{notif.message}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune notification</Text>
        )}
      </View>

      {/* Actions rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Schedule')}
          >
            <Text style={styles.actionButtonText}>📅 Emploi du temps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Grades')}
          >
            <Text style={styles.actionButtonText}>📊 Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Resources')}
          >
            <Text style={styles.actionButtonText}>📚 Ressources</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionButtonText}>👤 Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: '#f5f5f5',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  seeAll: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1a1a1a',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardLocation: {
    fontSize: 13,
    color: '#999',
  },
  gradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gradeInfo: {
    flex: 1,
  },
  gradeCourse: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  gradeDate: {
    fontSize: 12,
    color: '#999',
  },
  gradeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  notificationItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 13,
    color: '#666',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default DashboardScreen;
