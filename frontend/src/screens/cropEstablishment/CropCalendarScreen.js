// CropCalendar.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';

const CropCalendarScreen = ({ route, navigation }) => {
  const { variety, plantingWindow, season } = route.params || {};
  
  // Calendar tasks based on the design you provided
  const [calendarTasks, setCalendarTasks] = useState({
    today: [
      {
        id: 1,
        title: 'Land Preparation',
        description: 'Plowing and leveling the field for cultivation. Ensure proper drainage.',
        date: 'Today, October 26, 2023',
        completed: false,
        icon: 'tractor',
        time: 'Morning',
        priority: 'high'
      }
    ],
    tomorrow: [
      {
        id: 2,
        title: 'Sowing',
        description: 'Planting selected paddy seeds. Monitor soil moisture levels.',
        date: 'Tomorrow, October 27, 2023',
        completed: false,
        icon: 'seed',
        time: 'Early Morning',
        priority: 'high'
      }
    ],
    thisWeek: [
      {
        id: 3,
        title: 'First Irrigation',
        description: 'Watering the nursery beds. Maintain water depth of 2–3 cm.',
        date: 'Saturday, October 28, 2023',
        completed: false,
        icon: 'water',
        time: 'Morning',
        priority: 'medium'
      },
      {
        id: 4,
        title: 'Fertilizer Application',
        description: 'Apply basal dose of fertilizer for healthy growth.',
        date: 'Monday, October 30, 2023',
        completed: false,
        icon: 'flask',
        time: 'Afternoon',
        priority: 'high'
      },
      {
        id: 5,
        title: 'Weed Control',
        description: 'Manual weeding or herbicide application to prevent weed competition.',
        date: 'Friday, November 3, 2023',
        completed: false,
        icon: 'sprout',
        time: 'Morning',
        priority: 'medium'
      }
    ],
    upcoming: [
      {
        id: 6,
        title: 'Pest Management',
        description: 'Inspect for pests and apply organic pesticides if necessary.',
        date: 'Saturday, November 11, 2023',
        completed: false,
        icon: 'bug',
        time: 'Morning',
        priority: 'medium'
      },
      {
        id: 7,
        title: 'Pre-harvest Drainage',
        description: 'Drain water from the fields 10–15 days before harvesting.',
        date: 'Monday, December 4, 2023',
        completed: false,
        icon: 'water-pump',
        time: 'Morning',
        priority: 'low'
      }
    ]
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Get current date formatted
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-LK', options);
  };

  // Toggle task completion
  const toggleTaskCompletion = (section, taskId) => {
    setCalendarTasks(prev => ({
      ...prev,
      [section]: prev[section].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  // Schedule notification for a task
  const scheduleNotification = async (task) => {
    if (!notificationsEnabled) {
      Alert.alert(
        'Enable Notifications',
        'Please enable notifications to get reminders for farming tasks.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Calculate notification time (day before at 8 AM)
      const taskDate = new Date(task.date.split(', ')[1]);
      taskDate.setDate(taskDate.getDate() - 1);
      taskDate.setHours(8, 0, 0);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming Task: ${task.title}`,
          body: task.description,
          data: { taskId: task.id },
        },
        trigger: {
          date: taskDate,
          repeats: false,
        },
      });

      Alert.alert('Success', `Reminder set for ${task.title}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  // Add task to device calendar
  const addToDeviceCalendar = async (task) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = calendars.find(cal => cal.allowsModifications);

        if (defaultCalendar) {
          const eventDate = new Date(task.date.split(', ')[1]);
          
          await Calendar.createEventAsync(defaultCalendar.id, {
            title: `Farming: ${task.title}`,
            startDate: eventDate,
            endDate: new Date(eventDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours
            location: 'Farm Field',
            notes: task.description,
            alarms: [{ relativeOffset: -60 }] // 1 hour before
          });

          Alert.alert('Success', 'Task added to calendar');
        }
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert('Error', 'Could not add to calendar');
    }
  };

  // Request notification permissions
  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  useEffect(() => {
    requestNotificationPermissions();
    
    // Load saved task completion status
    const loadTaskStatus = async () => {
      try {
        const savedStatus = await AsyncStorage.getItem('calendarTaskStatus');
        if (savedStatus) {
          setCalendarTasks(JSON.parse(savedStatus));
        }
      } catch (error) {
        console.error('Error loading task status:', error);
      }
    };

    loadTaskStatus();
  }, []);

  // Save task completion status
  useEffect(() => {
    const saveTaskStatus = async () => {
      try {
        await AsyncStorage.setItem('calendarTaskStatus', JSON.stringify(calendarTasks));
      } catch (error) {
        console.error('Error saving task status:', error);
      }
    };

    saveTaskStatus();
  }, [calendarTasks]);

  // Render task item
  const renderTaskItem = (task, section) => (
    <View key={task.id} style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleContainer}>
          <TouchableOpacity
            style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
            onPress={() => toggleTaskCompletion(section, task.id)}
          >
            {task.completed && (
              <MaterialCommunityIcons name="check" size={16} color="#fff" />
            )}
          </TouchableOpacity>
          <MaterialCommunityIcons 
            name={task.icon} 
            size={24} 
            color={getPriorityColor(task.priority)} 
            style={styles.taskIcon}
          />
          <View>
            <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>
              {task.title}
            </Text>
            <Text style={styles.taskTime}>
              {task.time} • <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </Text>
            </Text>
          </View>
        </View>
        <Text style={styles.taskDate}>{task.date}</Text>
      </View>
      
      <Text style={styles.taskDescription}>{task.description}</Text>
      
      <View style={styles.taskActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.reminderButton]}
          onPress={() => scheduleNotification(task)}
        >
          <MaterialCommunityIcons name="bell-outline" size={16} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Remind Me</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.calendarButton]}
          onPress={() => addToDeviceCalendar(task)}
        >
          <MaterialCommunityIcons name="calendar-plus" size={16} color="#16a34a" />
          <Text style={styles.actionButtonText}>Add to Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Get color based on priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    const allTasks = [
      ...calendarTasks.today,
      ...calendarTasks.tomorrow,
      ...calendarTasks.thisWeek,
      ...calendarTasks.upcoming
    ];
    const completedTasks = allTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / allTasks.length) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#16a34a" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>📅 Crop Calendar</Text>
            <Text style={styles.headerSubtitle}>
              {variety || 'Paddy'} • {season || 'Current Season'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => Alert.alert('Calendar Settings', 'Adjust your calendar preferences here')}
          >
            <MaterialCommunityIcons name="cog" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Season Progress</Text>
            <Text style={styles.progressPercentage}>{calculateCompletion()}% Complete</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${calculateCompletion()}%` }]} 
            />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {[...calendarTasks.today, ...calendarTasks.tomorrow].filter(t => t.completed).length}
              </Text>
              <Text style={styles.statLabel}>Immediate Tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {[...calendarTasks.thisWeek, ...calendarTasks.upcoming].filter(t => !t.completed).length}
              </Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
          </View>
        </View>

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="calendar-today" size={20} color="#ef4444" />
              <Text style={styles.sectionTitle}>Today</Text>
            </View>
            <Text style={styles.sectionDate}>{getCurrentDate()}</Text>
          </View>
          {calendarTasks.today.map(task => renderTaskItem(task, 'today'))}
        </View>

        {/* Tomorrow's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="calendar-arrow-right" size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Tomorrow</Text>
            </View>
          </View>
          {calendarTasks.tomorrow.map(task => renderTaskItem(task, 'tomorrow'))}
        </View>

        {/* This Week's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="calendar-week" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>This Week</Text>
            </View>
          </View>
          {calendarTasks.thisWeek.map(task => renderTaskItem(task, 'thisWeek'))}
        </View>

        {/* Upcoming Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="calendar-month" size={20} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Upcoming</Text>
            </View>
          </View>
          {calendarTasks.upcoming.map(task => renderTaskItem(task, 'upcoming'))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Add Custom Task', 'Feature coming soon!')}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color="#16a34a" />
            <Text style={styles.quickActionText}>Add Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Print Calendar', 'Feature coming soon!')}
          >
            <MaterialCommunityIcons name="printer" size={24} color="#3b82f6" />
            <Text style={styles.quickActionText}>Print</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={requestNotificationPermissions}
          >
            <MaterialCommunityIcons 
              name={notificationsEnabled ? "bell" : "bell-off"} 
              size={24} 
              color={notificationsEnabled ? "#f59e0b" : "#6b7280"} 
            />
            <Text style={styles.quickActionText}>
              {notificationsEnabled ? 'Notifications On' : 'Enable Alerts'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <MaterialCommunityIcons name="information" size={18} color="#6b7280" />
          <Text style={styles.footerNoteText}>
            Calendar updates based on weather forecasts. Check regularly for changes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  backButton: { padding: 8 },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#16a34a' },
  headerSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  settingsButton: { padding: 8 },
  progressCard: { 
    backgroundColor: 'white', 
    margin: 16, 
    marginTop: 20,
    borderRadius: 12, 
    padding: 20, 
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  progressHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 12
  },
  progressTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  progressPercentage: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },
  progressBar: { 
    height: 8, 
    backgroundColor: '#e5e7eb', 
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#16a34a',
    borderRadius: 4
  },
  progressStats: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  section: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 12, 
    padding: 16,
    elevation: 1
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 8 },
  sectionDate: { fontSize: 14, color: '#6b7280' },
  taskCard: { 
    backgroundColor: '#f9fafb', 
    borderRadius: 8, 
    padding: 16, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  taskHeader: { marginBottom: 12 },
  taskTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  checkboxCompleted: { 
    backgroundColor: '#16a34a', 
    borderColor: '#16a34a' 
  },
  taskIcon: { marginRight: 12 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  taskCompleted: { textDecorationLine: 'line-through', color: '#9ca3af' },
  taskTime: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  priorityText: { fontWeight: '500' },
  taskDate: { 
    fontSize: 14, 
    color: '#16a34a', 
    fontWeight: '500',
    marginTop: 8
  },
  taskDescription: { 
    fontSize: 14, 
    color: '#4b5563', 
    lineHeight: 20,
    marginBottom: 16
  },
  taskActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between'
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6'
  },
  reminderButton: { borderWidth: 1, borderColor: '#dbeafe' },
  calendarButton: { borderWidth: 1, borderColor: '#d1fae5' },
  actionButtonText: { 
    fontSize: 12, 
    fontWeight: '500', 
    marginLeft: 6 
  },
  quickActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 1
  },
  quickActionButton: { alignItems: 'center' },
  quickActionText: { 
    fontSize: 12, 
    color: '#374151', 
    marginTop: 8 
  },
  footerNote: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 12
  },
  footerNoteText: { 
    fontSize: 12, 
    color: '#6b7280', 
    marginLeft: 8,
    flex: 1,
    textAlign: 'center'
  }
});

export default CropCalendarScreen;