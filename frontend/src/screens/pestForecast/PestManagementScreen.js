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
import LanguageSelector from '../../components/LanguageSelectorComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import geminiService from '../../services/geminiService';

export default function PestManagementScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [latestForecast, setLatestForecast] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [aiAssistantUnread, setAiAssistantUnread] = useState(0); // For any unread AI tips

  useEffect(() => {
    loadData();
    // Check for unread AI tips (could be stored in AsyncStorage)
    checkAITips();
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

  const checkAITips = async () => {
    try {
      const lastAICheck = await AsyncStorage.getItem('lastAICheck');
      const today = new Date().toDateString();
      
      if (lastAICheck !== today) {
        // New AI tips available for today
        setAiAssistantUnread(1);
      }
    } catch (error) {
      console.error('Error checking AI tips:', error);
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

  // AI Assistant button - to be added at the bottom or as a floating button
  const handleOpenAIAssistant = () => {
    // Mark AI tips as read
    setAiAssistantUnread(0);
    AsyncStorage.setItem('lastAICheck', new Date().toDateString());
    
    // Navigate to AI Assistant
    navigation.navigate('AIPestAssistant');
  };

  const handleOpenAIAssistantWithContext = (context) => {
    // Mark AI tips as read
    setAiAssistantUnread(0);
    AsyncStorage.setItem('lastAICheck', new Date().toDateString());
    
    // Navigate with context (e.g., latest pest data)
    navigation.navigate('AIPestAssistant', { 
      detectedPest: latestForecast?.pest 
    });
  };

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
        {/* AI Assistant Promo Card - NEW! */}
        <TouchableOpacity 
          style={styles.aiPromoCard}
          onPress={handleOpenAIAssistant}
          activeOpacity={0.9}
        >
          <View style={styles.aiPromoContent}>
            <View style={styles.aiPromoLeft}>
              <View style={styles.aiIconContainer}>
                <MaterialCommunityIcons name="robot" size={40} color="#16a34a" />
                {aiAssistantUnread > 0 && (
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              <View style={styles.aiPromoText}>
                <Text style={styles.aiPromoTitle}>AI Pest Assistant</Text>
                <Text style={styles.aiPromoDesc}>
                  Ask me anything about pest management, fertilizers, and prevention
                </Text>
              </View>
            </View>
            <View style={styles.aiPromoRight}>
              <MaterialCommunityIcons name="arrow-right-circle" size={32} color="#16a34a" />
            </View>
          </View>
          
          {/* Quick question chips */}
          <View style={styles.quickChips}>
            <TouchableOpacity 
              style={styles.chip}
              onPress={() => handleOpenAIAssistantWithContext('bph')}
            >
              <MaterialCommunityIcons name="bug" size={14} color="#16a34a" />
              <Text style={styles.chipText}>BPH Control</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.chip}
              onPress={() => handleOpenAIAssistantWithContext('fertilizer')}
            >
              <MaterialCommunityIcons name="sprout" size={14} color="#16a34a" />
              <Text style={styles.chipText}>Fertilizer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.chip}
              onPress={() => handleOpenAIAssistantWithContext('prevention')}
            >
              <MaterialCommunityIcons name="shield" size={14} color="#16a34a" />
              <Text style={styles.chipText}>Prevention</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.chip}
              onPress={() => handleOpenAIAssistantWithContext('leaf')}
            >
              <MaterialCommunityIcons name="leaf" size={14} color="#16a34a" />
              <Text style={styles.chipText}>Leaf Folder</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

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
            onPress={() => navigation.navigate('PestForecastDashboard')}
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

        {/* Quick AI Assistant Button (Alternative) */}
        <View style={styles.quickAIButtonContainer}>
          <TouchableOpacity
            style={styles.quickAIButton}
            onPress={handleOpenAIAssistant}
          >
            <MaterialCommunityIcons name="robot" size={20} color="#fff" />
            <Text style={styles.quickAIButtonText}>Need help? Ask AI Assistant</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Floating AI Assistant Button */}
      <TouchableOpacity
        style={styles.floatingAIButton}
        onPress={handleOpenAIAssistant}
        activeOpacity={0.8}
      >
        <View style={styles.floatingAIInner}>
          <MaterialCommunityIcons name="robot" size={28} color="#fff" />
          <Text style={styles.floatingAIText}>AI Assistant</Text>
        </View>
        {aiAssistantUnread > 0 && (
          <View style={styles.floatingAIBadge}>
            <Text style={styles.floatingAIBadgeText}>!</Text>
          </View>
        )}
      </TouchableOpacity>

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
  
  // AI Promo Card Styles
  aiPromoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#16a34a',
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  aiPromoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiPromoLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  aiIconContainer: {
    position: 'relative',
  },
  aiBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  aiPromoText: {
    flex: 1,
  },
  aiPromoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  aiPromoDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  aiPromoRight: {
    marginLeft: 12,
  },
  quickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  chipText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },

  // Section Styles
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
  
  // Grid Styles
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

  // Quick AI Button (Inline)
  quickAIButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  quickAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  quickAIButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },

  // Floating AI Button
  floatingAIButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#16a34a',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
  },
  floatingAIInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingAIText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingAIBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#dc2626',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  floatingAIBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});