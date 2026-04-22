import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pestLibraryApi } from '../../services/api';

export default function PestLibrary({ navigation }) {
  const [pests, setPests] = useState([]);
  const [filteredPests, setFilteredPests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPest, setSelectedPest] = useState(null);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    loadPests();
  }, []);

  const loadPests = async () => {
    try {
      const response = await pestLibraryApi.getAllPests(language);
      if (response.success) {
        setPests(response.data);
        setFilteredPests(response.data);
      }
    } catch (error) {
      console.error('Failed to load pests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = pests.filter(pest => 
      pest.name.toLowerCase().includes(text.toLowerCase()) ||
      pest.scientific_name?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredPests(filtered);
  };

  const loadPestDetails = async (pestName) => {
    try {
      const response = await pestLibraryApi.getPestInfo(pestName, language);
      if (response.success) {
        setSelectedPest(response.data);
      }
    } catch (error) {
      console.error('Failed to load pest details:', error);
    }
  };

  if (selectedPest) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedPest(null)}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pest Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.detailIcon, { backgroundColor: '#fef3c7' }]}>
              <MaterialCommunityIcons name="bug" size={32} color="#f59e0b" />
            </View>
            <View>
              <Text style={styles.detailName}>{selectedPest.name}</Text>
              <Text style={styles.detailScientific}>{selectedPest.scientific_name}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Description</Text>
            <Text style={styles.detailText}>{selectedPest.description}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Symptoms</Text>
            {selectedPest.symptoms?.map((symptom, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{symptom}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Favorable Conditions</Text>
            {selectedPest.favorable_conditions?.map((condition, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{condition}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Management</Text>
            {selectedPest.management?.map((item, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pest Library</Text>
        <TouchableOpacity onPress={() => setLanguage(lang => lang === 'en' ? 'si' : 'en')}>
          <MaterialCommunityIcons 
            name="translate" 
            size={24} 
            color="#16a34a" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search pests..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <MaterialCommunityIcons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {filteredPests.map((pest, index) => (
            <TouchableOpacity
              key={index}
              style={styles.pestCard}
              onPress={() => loadPestDetails(pest.id || pest.name)}
            >
              <View style={[styles.pestIcon, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="bug" size={24} color="#f59e0b" />
              </View>
              <View style={styles.pestInfo}>
                <Text style={styles.pestName}>{pest.name}</Text>
                <Text style={styles.pestScientific}>{pest.scientific_name}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  pestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  pestIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  pestInfo: {
    flex: 1,
  },
  pestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  pestScientific: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  detailCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  detailScientific: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  detailSection: {
    marginTop: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#16a34a',
    marginRight: 8,
  },
  bulletText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
});