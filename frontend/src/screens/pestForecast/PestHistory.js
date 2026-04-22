import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pestForecastApi, pestDetectionApi } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PestHistory({ navigation }) {
  const [activeTab, setActiveTab] = useState('forecast');
  const [forecasts, setForecasts] = useState([]);
  const [detections, setDetections] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      if (userId) {
        // Load forecasts
        const forecastRes = await pestForecastApi.getHistory(userId, 20);
        if (forecastRes.success) {
          setForecasts(forecastRes.data);
        }

        // Load detections
        const detectionRes = await pestDetectionApi.getHistory(userId, 20);
        if (detectionRes.success) {
          setDetections(detectionRes.data);
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const getRiskColor = (risk) => {
    switch(risk?.toLowerCase()) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderForecastItem = (item, index) => (
    <TouchableOpacity key={index} style={styles.historyItem}>
      <View style={[styles.itemIcon, { backgroundColor: '#e0f2fe' }]}>
        <MaterialCommunityIcons name="weather-cloudy" size={24} color="#0369a1" />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.predicted_pest || 'Pest Forecast'}</Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.risk_level) + '20' }]}>
            <Text style={[styles.riskText, { color: getRiskColor(item.risk_level) }]}>
              {item.risk_level || 'Unknown'}
            </Text>
          </View>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={14} color="#9ca3af" />
            <Text style={styles.detailText}>
              {new Date(item.created_at || item.timestamp).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="target" size={14} color="#9ca3af" />
            <Text style={styles.detailText}>Confidence: {((item.confidence || 0.85) * 100).toFixed(0)}%</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetectionItem = (item, index) => (
    <TouchableOpacity key={index} style={styles.historyItem}>
      <View style={[styles.itemIcon, { backgroundColor: '#fef3c7' }]}>
        <MaterialCommunityIcons name="bug" size={24} color="#f59e0b" />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.pest_name || 'Pest Detection'}</Text>
          <Text style={[styles.confidence, { color: '#16a34a' }]}>
            {(item.confidence * 100).toFixed(0)}%
          </Text>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={14} color="#9ca3af" />
            <Text style={styles.detailText}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#9ca3af" />
            <Text style={styles.detailText}>{item.location || 'Unknown location'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity onPress={onRefresh}>
          <MaterialCommunityIcons name="refresh" size={24} color="#16a34a" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'forecast' && styles.activeTab]}
          onPress={() => setActiveTab('forecast')}
        >
          <Text style={[styles.tabText, activeTab === 'forecast' && styles.activeTabText]}>
            Forecasts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'detection' && styles.activeTab]}
          onPress={() => setActiveTab('detection')}
        >
          <Text style={[styles.tabText, activeTab === 'detection' && styles.activeTabText]}>
            Detections
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'forecast' ? (
          forecasts.length > 0 ? (
            forecasts.map(renderForecastItem)
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="weather-cloudy" size={60} color="#d1d5db" />
              <Text style={styles.emptyText}>No forecast history yet</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('PestForecastForm')}
              >
                <Text style={styles.emptyButtonText}>Get Your First Forecast</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          detections.length > 0 ? (
            detections.map(renderDetectionItem)
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
          )
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
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  confidence: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
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