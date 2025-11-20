import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const ResourcesScreen = () => {
  const { user } = useContext(AuthContext);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Tous' },
    { id: 'pdf', label: 'PDF' },
    { id: 'video', label: 'Vidéos' },
    { id: 'document', label: 'Documents' },
    { id: 'link', label: 'Liens' },
  ];

  useEffect(() => {
    const fetchResources = async () => {
      if (!user) return;

      try {
        const resourcesQuery = query(
          collection(db, 'resources'),
          where('userId', '==', user.uid)
        );
        const resourcesSnapshot = await getDocs(resourcesQuery);
        const resourcesData = resourcesSnapshot.docs.map(doc => doc.data());
        setResources(resourcesData);
      } catch (error) {
        console.error('Erreur lors du chargement des ressources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [user]);

  const filteredResources = resources.filter(resource => {
    if (selectedCategory === 'all') return true;
    return resource.type === selectedCategory;
  });

  const handleDownload = (resource) => {
    Alert.alert(
      'Télécharger',
      `Télécharger ${resource.title}?`,
      [
        { text: 'Annuler', onPress: () => {}, style: 'cancel' },
        {
          text: 'Télécharger',
          onPress: () => {
            // Implémentation du téléchargement
            Alert.alert('Succès', 'Le téléchargement a commencé');
          },
        },
      ]
    );
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'video':
        return '🎥';
      case 'document':
        return '📋';
      case 'link':
        return '🔗';
      default:
        return '📁';
    }
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
        <Text style={styles.title}>Ressources Pédagogiques</Text>
        <Text style={styles.subtitle}>{filteredResources.length} ressource(s)</Text>
      </View>

      {/* Filtre par catégorie */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categorySelector}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.categoryButtonTextActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des ressources */}
      <View style={styles.resourcesContainer}>
        {filteredResources.length > 0 ? (
          filteredResources.map((resource, index) => (
            <View key={index} style={styles.resourceCard}>
              <View style={styles.resourceHeader}>
                <Text style={styles.resourceIcon}>
                  {getResourceIcon(resource.type)}
                </Text>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <Text style={styles.resourceCourse}>{resource.course}</Text>
                </View>
              </View>
              <Text style={styles.resourceDescription}>
                {resource.description}
              </Text>
              <View style={styles.resourceFooter}>
                <Text style={styles.resourceDate}>
                  {new Date(resource.uploadedAt?.toDate?.()).toLocaleDateString('fr-FR')}
                </Text>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleDownload(resource)}
                >
                  <Text style={styles.downloadButtonText}>Télécharger</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>Aucune ressource disponible</Text>
            <Text style={styles.emptySubtext}>
              Les ressources pédagogiques apparaîtront ici
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  categorySelector: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#1a1a1a',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  resourcesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  resourceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1a1a1a',
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  resourceIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  resourceCourse: {
    fontSize: 12,
    color: '#999',
  },
  resourceDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceDate: {
    fontSize: 12,
    color: '#999',
  },
  downloadButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});

export default ResourcesScreen;
