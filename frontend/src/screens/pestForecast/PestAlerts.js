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

export default function PestAlerts({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
     
      const mockAlerts = [
        {
          id: '1',
          title: 'High Risk Alert: Brown Planthopper',
          message: 'BPH detected in Anuradhapura. Immediate action required.',
          time: '2 hours ago',
          type: 'high',
          read: false,
          pest: 'Brown Planthopper (BPH)',
          district: 'Anuradhapura',
        },
        {
          id: '2',
          title: 'Weather Alert: Heavy Rainfall Expected',
          message: 'Heavy rain predicted in Kurunegala. Prepare for increased pest risk.',
          time: '5 hours ago',
          type: 'weather',
          read: false,
        },
        {
          id: '3',
          title: 'Medium Risk: Rice Leaf-folder',
          message: 'Leaf-folder activity increasing in Polonnaruwa. Monitor fields.',
          time: '1 day ago',
          type: 'medium',
          read: true,
          pest: 'Rice Leaf-folder',
          district: 'Polonnaruwa',
        },
        {
          id: '4',
          title: 'Daily Forecast Available',
          message: 'Your daily pest forecast is ready. Check pest risk levels.',
          time: '1 day ago',
          type: 'info',
          read: true,
        },
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const markAsRead = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'high': return { name: 'alert-circle', color: '#dc2626', bg: '#fee2e2' };
      case 'medium': return { name: 'alert', color: '#f59e0b', bg: '#fef3c7' };
      case 'weather': return { name: 'weather-lightning', color: '#3b82f6', bg: '#dbeafe' };
      default: return { name: 'information', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Alerts</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {alerts.map((alert) => {
          const icon = getAlertIcon(alert.type);
          return (
            <TouchableOpacity
              key={alert.id}
              style={[styles.alertCard, !alert.read && styles.unreadCard]}
              onPress={() => markAsRead(alert.id)}
            >
              <View style={[styles.alertIcon, { backgroundColor: icon.bg }]}>
                <MaterialCommunityIcons name={icon.name} size={24} color={icon.color} />
              </View>
              
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  {!alert.read && <View style={styles.unreadDot} />}
                </View>
                
                <Text style={styles.alertMessage}>{alert.message}</Text>
                
                <View style={styles.alertFooter}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#9ca3af" />
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 12,
    color: '#16a34a',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
});