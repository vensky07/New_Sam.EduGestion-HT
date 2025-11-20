import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const GradesScreen = () => {
  const { user } = useContext(AuthContext);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('S1');

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user) return;

      try {
        const gradesQuery = query(
          collection(db, 'grades'),
          where('userId', '==', user.uid)
        );
        const gradesSnapshot = await getDocs(gradesQuery);
        const gradesData = gradesSnapshot.docs.map(doc => doc.data());
        setGrades(gradesData);
      } catch (error) {
        console.error('Erreur lors du chargement des notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [user]);

  const filteredGrades = grades.filter(
    grade => grade.semester === selectedSemester
  );

  const calculateAverage = (gradesList) => {
    if (gradesList.length === 0) return 0;
    const sum = gradesList.reduce((acc, grade) => acc + grade.grade, 0);
    return (sum / gradesList.length).toFixed(2);
  };

  const getGradeColor = (grade) => {
    if (grade >= 16) return '#27ae60'; // Vert
    if (grade >= 12) return '#f39c12'; // Orange
    return '#e74c3c'; // Rouge
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Notes et Bulletins</Text>
      </View>

      {/* Sélecteur de semestre */}
      <View style={styles.semesterSelector}>
        {['S1', 'S2'].map(semester => (
          <TouchableOpacity
            key={semester}
            style={[
              styles.semesterButton,
              selectedSemester === semester && styles.semesterButtonActive,
            ]}
            onPress={() => setSelectedSemester(semester)}
          >
            <Text
              style={[
                styles.semesterButtonText,
                selectedSemester === semester && styles.semesterButtonTextActive,
              ]}
            >
              {semester}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistiques */}
      {filteredGrades.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Moyenne</Text>
            <Text style={styles.statValue}>
              {calculateAverage(filteredGrades)}/20
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cours</Text>
            <Text style={styles.statValue}>{filteredGrades.length}</Text>
          </View>
        </View>
      )}

      {/* Liste des notes */}
      <View style={styles.gradesContainer}>
        {filteredGrades.length > 0 ? (
          filteredGrades.map((grade, index) => (
            <View key={index} style={styles.gradeCard}>
              <View style={styles.gradeHeader}>
                <Text style={styles.courseName}>{grade.courseName}</Text>
                <View
                  style={[
                    styles.gradeBadge,
                    { backgroundColor: getGradeColor(grade.grade) },
                  ]}
                >
                  <Text style={styles.gradeText}>{grade.grade}/20</Text>
                </View>
              </View>
              <Text style={styles.professor}>Prof: {grade.professor}</Text>
              <Text style={styles.date}>
                {new Date(grade.date?.toDate?.()).toLocaleDateString('fr-FR')}
              </Text>
              {grade.comment && (
                <Text style={styles.comment}>{grade.comment}</Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucune note disponible pour ce semestre
            </Text>
          </View>
        )}
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
    paddingVertical: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  semesterSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  semesterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  semesterButtonActive: {
    backgroundColor: '#1a1a1a',
  },
  semesterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  semesterButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  gradesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  gradeCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1a1a1a',
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  gradeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  professor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  comment: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default GradesScreen;
