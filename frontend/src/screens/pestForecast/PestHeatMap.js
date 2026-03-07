import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Heatmap } from 'react-native-maps';
import * as Location from 'expo-location';
import { heatmapApi } from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function PestHeatMap({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedPest, setSelectedPest] = useState('all');
  const [region, setRegion] = useState({
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 3.5,
    longitudeDelta: 3.5,
  });
  const [userLocation, setUserLocation] = useState(null);

  const pests = [
    { id: 'all', name: 'All Pests', icon: 'bug', color: '#16a34a' },
    { id: 'Brown Planthopper (BPH)', name: 'BPH', icon: 'bug', color: '#dc2626' },
    { id: 'Rice Leaf-folder', name: 'Leaf Folder', icon: 'leaf', color: '#f59e0b' },
    { id: 'Paddy Bug', name: 'Paddy Bug', icon: 'bug', color: '#7c3aed' },
  ];

  useEffect(() => {
    getUserLocation();
    loadHeatmapData();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const loadHeatmapData = async (pest = 'all') => {
    setLoading(true);
    try {
      const response = await heatmapApi.getHeatmapData(pest !== 'all' ? pest : null);
      if (response.success) {
        setHeatmapData(response.data);
      }
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePestSelect = (pestId) => {
    setSelectedPest(pestId);
    loadHeatmapData(pestId);
  };

  const heatmapPoints = heatmapData.map(point => ({
    latitude: point.latitude,
    longitude: point.longitude,
    weight: point.incidence / 100,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pest Heat Map</Text>
        <TouchableOpacity onPress={() => loadHeatmapData(selectedPest)}>
          <MaterialCommunityIcons name="refresh" size={24} color="#16a34a" />
        </TouchableOpacity>
      </View>

      {/* Pest Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {pests.map((pest) => (
          <TouchableOpacity
            key={pest.id}
            style={[
              styles.filterChip,
              selectedPest === pest.id && styles.filterChipActive,
            ]}
            onPress={() => handlePestSelect(pest.id)}
          >
            <MaterialCommunityIcons 
              name={pest.icon} 
              size={16} 
              color={selectedPest === pest.id ? '#fff' : pest.color} 
            />
            <Text style={[
              styles.filterText,
              selectedPest === pest.id && styles.filterTextActive,
            ]}>
              {pest.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.loadingText}>Loading heatmap data...</Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
          >
            {heatmapPoints.length > 0 && (
              <Heatmap
                points={heatmapPoints}
                radius={30}
                opacity={0.7}
                gradient={{
                  colors: ['#10b981', '#f59e0b', '#dc2626'],
                  startPoints: [0.1, 0.5, 0.9],
                  colorMapSize: 256,
                }}
              />
            )}
            
            {userLocation && (
              <Marker
                coordinate={userLocation}
                title="Your Location"
              >
                <View style={styles.userMarker}>
                  <MaterialCommunityIcons name="map-marker" size={24} color="#3b82f6" />
                </View>
              </Marker>
            )}

            {heatmapData.map((point, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: point.latitude,
                  longitude: point.longitude,
                }}
                title={point.district}
                description={`Incidence: ${point.incidence.toFixed(1)}%`}
              >
                <View style={[styles.marker, { 
                  backgroundColor: point.incidence > 70 ? '#dc2626' :
                                  point.incidence > 40 ? '#f59e0b' : '#10b981'
                }]}>
                  <Text style={styles.markerText}>{point.incidence.toFixed(0)}%</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Low (0-40%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Medium (41-70%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#dc2626' }]} />
          <Text style={styles.legendText}>High (71-100%)</Text>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsSummary}>
        <Text style={styles.statsTitle}>District Summary</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {heatmapData.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.statsCard}>
              <Text style={styles.statsDistrict}>{item.district}</Text>
              <Text style={[styles.statsIncidence, { 
                color: item.incidence > 70 ? '#dc2626' :
                       item.incidence > 40 ? '#f59e0b' : '#10b981'
              }]}>
                {item.incidence.toFixed(1)}%
              </Text>
              <Text style={styles.statsRecords}>{item.total_records} records</Text>
            </View>
          ))}
        </ScrollView>
      </View>
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
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#16a34a',
  },
  filterText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
  userMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 3,
  },
  marker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
  },
  markerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    justifyContent: 'space-around',
    elevation: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#4b5563',
  },
  statsSummary: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 100,
  },
  statsDistrict: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statsIncidence: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statsRecords: {
    fontSize: 10,
    color: '#9ca3af',
  },
});