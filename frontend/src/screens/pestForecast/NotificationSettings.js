import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pestForecastApi } from '../../services/api';
import NotificationToggle from '../../components/NotificationToggle';
import notificationService from '../../services/notificationService';

export default function NotificationSettings({ navigation }) {
  const [settings, setSettings] = useState({
    dailyForecast: true,
    highRiskAlerts: true,
    weatherAlerts: true,
    pestDetectionTips: true,
    marketUpdates: false,
  });
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [notificationTimes, setNotificationTimes] = useState({
    morning: '06:00',
    evening: '18:00',
  });

  useEffect(() => {
    loadSettings();
    getDeviceInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const getDeviceInfo = async () => {
    const id = await notificationService.getDeviceId();
    setDeviceId(id);
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      // Send tags to OneSignal based on settings
      notificationService.sendTags({
        daily_forecast: settings.dailyForecast,
        high_risk_alerts: settings.highRiskAlerts,
        weather_alerts: settings.weatherAlerts,
        pest_tips: settings.pestDetectionTips,
        market_updates: settings.marketUpdates
      });
      
      Alert.alert('Success', 'Notification settings saved');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = () => {
    if (!deviceId) {
      Alert.alert('Error', 'Notifications not initialized yet');
      return;
    }
    
    notificationService.sendTestNotification();
    Alert.alert('Success', 'Test notification sent! Check your device.');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={saveSettings} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#16a34a" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Main Toggle */}
        <View style={styles.section}>
          <NotificationToggle />
        </View>

        {/* Device ID  */}
        {deviceId && (
          <View style={styles.deviceInfo}>
            <MaterialCommunityIcons name="information" size={16} color="#6b7280" />
            <Text style={styles.deviceInfoText} numberOfLines={1}>
              Device: {deviceId.substring(0, 16)}...
            </Text>
          </View>
        )}

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#e0f2fe' }]}>
                <MaterialCommunityIcons name="weather-cloudy" size={20} color="#0369a1" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Daily Forecast</Text>
                <Text style={styles.settingDesc}>Get daily pest forecast updates</Text>
              </View>
            </View>
            <Switch
              value={settings.dailyForecast}
              onValueChange={() => toggleSetting('dailyForecast')}
              trackColor={{ false: '#e5e7eb', true: '#16a34a' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#fee2e2' }]}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#dc2626" />
              </View>
              <View>
                <Text style={styles.settingTitle}>High Risk Alerts</Text>
                <Text style={styles.settingDesc}>Immediate alerts for high pest risk</Text>
              </View>
            </View>
            <Switch
              value={settings.highRiskAlerts}
              onValueChange={() => toggleSetting('highRiskAlerts')}
              trackColor={{ false: '#e5e7eb', true: '#16a34a' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#dbeafe' }]}>
                <MaterialCommunityIcons name="weather-lightning" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Weather Alerts</Text>
                <Text style={styles.settingDesc}>Get weather warnings</Text>
              </View>
            </View>
            <Switch
              value={settings.weatherAlerts}
              onValueChange={() => toggleSetting('weatherAlerts')}
              trackColor={{ false: '#e5e7eb', true: '#16a34a' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#d1fae5' }]}>
                <MaterialCommunityIcons name="lightbulb" size={20} color="#10b981" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Pest Control Tips</Text>
                <Text style={styles.settingDesc}>Weekly pest management tips</Text>
              </View>
            </View>
            <Switch
              value={settings.pestDetectionTips}
              onValueChange={() => toggleSetting('pestDetectionTips')}
              trackColor={{ false: '#e5e7eb', true: '#16a34a' }}
            />
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          <TouchableOpacity style={styles.timeItem}>
            <View>
              <Text style={styles.timeLabel}>Morning Notification</Text>
              <Text style={styles.timeValue}>{notificationTimes.morning}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.timeItem}>
            <View>
              <Text style={styles.timeLabel}>Evening Notification</Text>
              <Text style={styles.timeValue}>{notificationTimes.evening}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Test Notification */}
        <TouchableOpacity 
          style={styles.testButton}
          onPress={sendTestNotification}
        >
          <MaterialCommunityIcons name="bell-ring" size={20} color="#16a34a" />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
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
  saveText: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 11,
    color: '#9ca3af',
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  timeLabel: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
  },
  testButtonText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  deviceInfoText: {
    fontSize: 11,
    color: '#6b7280',
    flex: 1,
  },
});