// screens/pestForecast/PestAlertsList.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AlertManager from '../../services/alertManager';

export default function PestAlertsList({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
    
    // Subscribe to new alerts
    const unsubscribe = AlertManager.addListener((alert) => {
      loadAlerts(); // Refresh list
    });
    
    return unsubscribe;
  }, []);

  const loadAlerts = async () => {
    const loadedAlerts = await AlertManager.getAlerts();
    setAlerts(loadedAlerts);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const markAsRead = async (alertId) => {
    await AlertManager.markAlertRead(alertId);
    loadAlerts();
  };

  const clearAll = () => {
    Alert.alert(
      'Clear Alerts',
      'Are you sure you want to clear all alerts?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            await AlertManager.clearAllAlerts();
            loadAlerts();
          }
        }
      ]
    );
  };

  const getRiskColor = (risk) => {
    if (risk === 'Very High') return '#991b1b';
    if (risk === 'High') return '#dc2626';
    if (risk === 'Moderate') return '#f59e0b';
    return '#16a34a';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pest Alerts</Text>
        {alerts.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.alertCard,
              !item.read && styles.unreadCard,
              { borderLeftColor: getRiskColor(item.risk_level) }
            ]}
            onPress={() => markAsRead(item.id)}
          >
            <View style={styles.alertHeader}>
              <Text style={[styles.riskBadge, { backgroundColor: getRiskColor(item.risk_level) }]}>
                {item.risk_level}
              </Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            
            <Text style={styles.pestName}>{item.predicted_pest}</Text>
            
            <View style={styles.details}>
              <Text style={styles.detail}>📍 {item.district}</Text>
              <Text style={styles.detail}>⚠️ {item.severity} severity</Text>
              <Text style={styles.detail}>📊 {item.incidence_percent}% incidence</Text>
            </View>
            
            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No alerts yet</Text>
            <Text style={styles.emptySubtext}>
              Alerts will appear here when high pest risk is detected
            </Text>
          </View>
        }
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  clearText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  alertCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#fef2f2',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  pestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  details: {
    gap: 6,
    marginBottom: 12,
  },
  detail: {
    fontSize: 13,
    color: '#6b7280',
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});