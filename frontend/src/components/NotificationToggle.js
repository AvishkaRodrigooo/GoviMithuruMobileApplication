import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import notificationService from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationToggle = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    initNotifications();
  }, []);

  const initNotifications = async () => {
    try {
      // Get or create user ID
      let userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('userId', userId);
      }
      
      // Initialize notification service
      notificationService.initialize(userId);
      
      // Set notification open handler
      notificationService.setNotificationOpenHandler((data) => {
        console.log('Notification opened:', data);
        Alert.alert(
          data.type === 'pest_alert' ? '🚨 Pest Alert' : 'Notification',
          data.message || 'You received a notification'
        );
      });
      
      // Get device ID
      const id = await notificationService.getDeviceId();
      setDeviceId(id);
      
      // Get initial status
      const status = await notificationService.getStatus();
      setIsEnabled(status.enabled);
      
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setInitializing(false);
    }
  };

  const toggleSwitch = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (!isEnabled) {
        // Enable
        const success = await notificationService.enableNotifications();
        if (success) {
          setIsEnabled(true);
          Alert.alert(
            'Success',
            'Notifications enabled. You will receive pest alerts.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Failed to enable notifications');
        }
      } else {
        // Disable
        const success = await notificationService.disableNotifications();
        if (success) {
          setIsEnabled(false);
          Alert.alert('Success', 'Notifications disabled');
        }
      }
    } catch (error) {
      console.error('Toggle error:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#16a34a" />
        <Text style={styles.loadingText}>Setting up notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: isEnabled ? '#dcfce7' : '#f3f4f6' }]}>
        <MaterialCommunityIcons
          name={isEnabled ? 'bell-ring' : 'bell-off'}
          size={24}
          color={isEnabled ? '#16a34a' : '#9ca3af'}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Push Notifications</Text>
        <Text style={styles.subtitle}>
          {isEnabled ? 'On - You will receive alerts' : 'Off - No alerts'}
        </Text>
        {deviceId && (
          <Text style={styles.deviceIdText} numberOfLines={1}>
            Device ID: {deviceId.substring(0, 8)}...
          </Text>
        )}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#16a34a" />
      ) : (
        <Switch
          trackColor={{ false: '#e5e7eb', true: '#16a34a' }}
          thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
          ios_backgroundColor="#e5e7eb"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  deviceIdText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
  },
});

export default NotificationToggle;