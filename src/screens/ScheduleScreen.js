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

const ScheduleScreen = () => {
  const { user } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('Lundi');

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user) return;

      try {
        const scheduleQuery = query(
          collection(db, 'schedule'),
          where('userId', '==', user.uid)
        );
        const scheduleSnapshot = await getDocs(scheduleQuery);
        const scheduleData = scheduleSnapshot.docs.map(doc => doc.data());
        setSchedule(scheduleData);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'emploi du temps:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user]);

  const filteredSchedule = schedule.filter(
    item => item.dayOfWeek === selectedDay
  );

  const sortByTime = (items) => {
    return items.sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
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
        <Text style={styles.title}>Emploi du Temps</Text>
        <Text style={styles.subtitle}>Semaine en cours</Text>
      </View>

      {/* Sélecteur de jour */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
      >
        {daysOfWeek.map(day => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDay === day && styles.dayButtonActive,
            ]}
            onPress={() => setSelectedDay(day)}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDay === day && styles.dayButtonTextActive,
              ]}
            >
              {day.substring(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des cours du jour */}
      <View style={styles.classesContainer}>
        {filteredSchedule.length > 0 ? (
          sortByTime(filteredSchedule).map((item, index) => (
            <View key={index} style={styles.classCard}>
              <View style={styles.timeContainer}>
                <Text style={styles.time}>
                  {item.startTime} - {item.endTime}
                </Text>
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.courseName}>{item.courseName}</Text>
                <Text style={styles.professor}>👨‍🏫 {item.professor}</Text>
                <Text style={styles.location}>📍 {item.location}</Text>
                {item.room && <Text style={styles.room}>Salle: {item.room}</Text>}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucun cours prévu pour {selectedDay}
            </Text>
          </View>
        )}
      </View>

      {/* Résumé de la semaine */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Résumé de la semaine</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryItem}>
            📚 Total de cours: {schedule.length}
          </Text>
          <Text style={styles.summaryItem}>
            ⏰ Heures de cours: {calculateTotalHours(schedule)}h
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const calculateTotalHours = (schedule) => {
  let totalMinutes = 0;
  schedule.forEach(item => {
    const [startHour, startMin] = item.startTime.split(':').map(Number);
    const [endHour, endMin] = item.endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    totalMinutes += duration;
  });
  return (totalMinutes / 60).toFixed(1);
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  daySelector: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  dayButtonActive: {
    backgroundColor: '#1a1a1a',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  classesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  classCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#1a1a1a',
  },
  timeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    minWidth: 80,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  classInfo: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  professor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  room: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
  },
  summaryItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

export default ScheduleScreen;
