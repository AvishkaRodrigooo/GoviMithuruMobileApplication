// screens/pestForecast/PestAlerts.js (Simplified navigation version)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PestAlerts({ navigation }) {
  const unreadCount = 3; // You can calculate this from AlertManager

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PestAlertsList')}>
          <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('PestAlertsList')}
      >
        <MaterialCommunityIcons name="bell-ring" size={24} color="#16a34a" />
        <View>
          <Text style={styles.viewAllTitle}>View All Alerts</Text>
          {unreadCount > 0 && (
            <Text style={styles.viewAllSub}>{unreadCount} unread alerts</Text>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information" size={20} color="#0ea5e9" />
        <Text style={styles.infoText}>
          Alerts are shown automatically when high pest risk is detected.
          You can view all past alerts in the list.
        </Text>
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
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 2,
  },
  viewAllTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllSub: {
    fontSize: 12,
    color: '#16a34a',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },
});