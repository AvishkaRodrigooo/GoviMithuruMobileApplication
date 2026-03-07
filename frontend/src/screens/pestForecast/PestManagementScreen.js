import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pestForecastApi, pestDetectionApi } from '../../services/api';
import PestRiskCard from '../../components/PestRiskCard';
import NotificationToggle from '../../components/NotificationToggle';
import LanguageSelector from '../../components/LanguageSelector';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PestManagementScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [latestForecast, setLatestForecast] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const historyRes = await pestForecastApi.getHistory(userId, 1);
        if (historyRes.success && historyRes.data.length > 0) {
          setLatestForecast(historyRes.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigationItems = [
    {
      title: 'Pest Forecast',
      icon: 'weather-cloudy',
      color: '#0369a1',
      bgColor: '#e0f2fe',
      screen: 'PestForecastDashboard',
      description: 'Predict pest outbreaks'
    },
    {
      title: 'Pest Detection',
      icon: 'camera',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      screen: 'PestDetection',
      description: 'Identify pests instantly'
    },
    {
      title: 'Pest Library',
      icon: 'book-open',
      color: '#10b981',
      bgColor: '#d1fae5',
      screen: 'PestLibrary',
      description: 'Browse pest information'
    },
    {
      title: 'Heat Map',
      icon: 'map',
      color: '#dc2626',
      bgColor: '#fee2e2',
      screen: 'PestHeatMap',
      description: 'View pest distribution'
    },
    {
      title: 'Alerts',
      icon: 'bell',
      color: '#7c3aed',
      bgColor: '#ede9fe',
      screen: 'PestAlerts',
      description: 'View notifications',
      badge: unreadNotifications
    },
    {
      title: 'History',
      icon: 'history',
      color: '#6b7280',
      bgColor: '#f3f4f6',
      screen: 'PestHistory',
      description: 'Past forecasts & detections'
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Pest Management</Text>
          <Text style={styles.subGreeting}>Monitor & control pests</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setShowLanguageSelector(true)}
          >
            <MaterialCommunityIcons name="translate" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <MaterialCommunityIcons name="bell" size={24} color="#374151" />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Latest Forecast Card */}
        {latestForecast ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Forecast</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PestForecastHistory')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <PestRiskCard forecast={latestForecast} />
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.newForecastCard}
            onPress={() => navigation.navigate('PestForecastForm')}
          >
            <MaterialCommunityIcons name="plus-circle" size={40} color="#16a34a" />
            <Text style={styles.newForecastText}>Get New Forecast</Text>
          </TouchableOpacity>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            {navigationItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.gridItem}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                  <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
                  {item.badge > 0 && (
                    <View style={styles.itemBadge}>
                      <Text style={styles.itemBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <NotificationToggle />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector 
        visible={showLanguageSelector} 
        onClose={() => setShowLanguageSelector(false)} 
      />
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAll: {
    color: '#16a34a',
    fontWeight: '600',
  },
  newForecastCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderStyle: 'dashed',
  },
  newForecastText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  itemBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 11,
    color: '#6b7280',
  },
});