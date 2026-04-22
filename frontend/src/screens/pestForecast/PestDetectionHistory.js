import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pestDetectionApi } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PestDetectionHistory({ navigation }) {
  const [detections, setDetections] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDetections();
  }, []);

  const loadDetections = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await pestDetectionApi.getHistory(userId, 50);
        if (response.success) {
          setDetections(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to load detections:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDetections();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detection History</Text>
        <TouchableOpacity onPress={onRefresh}>
          <MaterialCommunityIcons name="refresh" size={24} color="#16a34a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {detections.length > 0 ? (
          detections.map((item, index) => (
            <TouchableOpacity key={index} style={styles.detectionCard}>
              <View style={styles.detectionHeader}>
                <View style={styles.detectionLeft}>
                  <View style={[styles.pestIcon, { backgroundColor: '#fef3c7' }]}>
                    <MaterialCommunityIcons name="bug" size={24} color="#f59e0b" />
                  </View>
                  <View>
                    <Text style={styles.pestName}>{item.pest_name || 'Unknown Pest'}</Text>
                    <Text style={styles.detectionDate}>
                      {new Date(item.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {(item.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.previewImage} />
              )}

              <View style={styles.detectionFooter}>
                <View style={styles.location}>
                  <MaterialCommunityIcons name="map-marker" size={14} color="#9ca3af" />
                  <Text style={styles.locationText}>{item.location || 'Unknown location'}</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.viewDetails}>View Details</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="camera" size={60} color="#d1d5db" />
            <Text style={styles.emptyText}>No detection history yet</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('PestDetection')}
            >
              <Text style={styles.emptyButtonText}>Detect Pests Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  detectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  detectionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  confidenceBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  detectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  viewDetails: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});