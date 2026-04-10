import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function NotificationScreen({ navigation }) {
  const notifications = [
    { 
      id: '1', 
      title: 'Pest Alert', 
      message: 'High risk of Brown Plant Hoppers detected in your area.', 
      time: '2 hours ago', 
      icon: 'bug', 
      color: '#dc2626', 
      bg: '#fee2e2' 
    },
    { 
      id: '2', 
      title: 'Weed Control Reminder', 
      message: 'Time to apply pre-plant herbicides based on your schedule.', 
      time: '5 hours ago', 
      icon: 'leaf', 
      color: '#059669', 
      bg: '#d1fae5' 
    },
    { 
      id: '3', 
      title: 'Storage Optimization', 
      message: 'Current warehouse humidity is slightly high. Please ventilate.', 
      time: '1 day ago', 
      icon: 'warehouse', 
      color: '#2563eb', 
      bg: '#dbeafe' 
    },
    { 
      id: '4', 
      title: 'Crop Calendar Event', 
      message: 'Seed soaking is planned for tomorrow.', 
      time: '2 days ago', 
      icon: 'sprout-outline', 
      color: '#d97706', 
      bg: '#fef3c7' 
    },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.notificationCard}>
      <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
        <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bell-off-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>No new notifications</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
