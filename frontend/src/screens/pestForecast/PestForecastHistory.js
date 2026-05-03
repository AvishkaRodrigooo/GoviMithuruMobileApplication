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
import { pestForecastApi } from '../../services/api';
import PestRiskCard from '../../components/PestRiskCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PestForecastHistory({ navigation }) {
  const [forecasts, setForecasts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await pestForecastApi.getHistory(userId, 50);
        if (response.success) {
          setForecasts(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to load forecasts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadForecasts();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forecast History</Text>
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
        {forecasts.length > 0 ? (
          forecasts.map((forecast, index) => (
            <View key={index} style={styles.forecastItem}>
              <View style={styles.dateHeader}>
                <MaterialCommunityIcons name="calendar" size={14} color="#6b7280" />
                <Text style={styles.dateText}>
                  {new Date(forecast.created_at || forecast.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <PestRiskCard forecast={forecast} />
            </View>
          ))
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
  forecastItem: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
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