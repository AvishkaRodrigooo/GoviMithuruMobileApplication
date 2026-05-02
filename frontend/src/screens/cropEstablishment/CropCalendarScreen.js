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
//import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';


// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//   }),
// });

const formatDate = (daysToAdd = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);

  return date.toLocaleDateString('en-LK', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const CropCalendarScreen = ({ route, navigation }) => {
  const { variety, plantingWindow, season } = route.params || {};
  
  // Calendar tasks based on the design you provided
  const [calendarTasks, setCalendarTasks] = useState({
  today: [
    {
      id: 1,
      title: 'Land Preparation',
      description: 'Plowing and leveling the field for cultivation.',
      date: `Today, ${formatDate(0)}`,
      icon: 'tractor',
      time: 'Morning',
      priority: 'high',
      completed: false
    }
  ],

  tomorrow: [
    {
      id: 2,
      title: 'Sowing',
      description: 'Planting paddy seeds in prepared field.',
      date: `Tomorrow, ${formatDate(1)}`,
      icon: 'seed',
      time: 'Early Morning',
      priority: 'high',
      completed: false
    }
  ],

  thisWeek: [
    {
      id: 3,
      title: 'First Irrigation',
      description: 'Water nursery beds properly.',
      date: formatDate(3),
      icon: 'water',
      time: 'Morning',
      priority: 'medium',
      completed: false
    },
    {
      id: 4,
      title: 'Fertilizer Application',
      description: 'Apply basal fertilizer dose.',
      date: formatDate(5),
      icon: 'flask',
      time: 'Afternoon',
      priority: 'high',
      completed: false
    },
    {
      id: 5,
      title: 'Weed Control',
      description: 'Remove weeds manually or with herbicide.',
      date: formatDate(7),
      icon: 'sprout',
      time: 'Morning',
      priority: 'medium',
      completed: false
    }
  ],

  upcoming: [
    {
      id: 6,
      title: 'Pest Management',
      description: 'Check pests and apply organic pesticide.',
      date: formatDate(15),
      icon: 'bug',
      time: 'Morning',
      priority: 'medium',
      completed: false
    },
    {
      id: 7,
      title: 'Pre-harvest Drainage',
      description: 'Drain water before harvesting.',
      date: formatDate(90),
      icon: 'water-pump',
      time: 'Morning',
      priority: 'low',
      completed: false
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
  try {

    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert("Permission Required", "Enable notifications to get reminders");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌾 Farming Task Reminder",
        body: `${task.title} - ${task.description}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      },
    });

    Alert.alert("Reminder Set", `${task.title} reminder scheduled`);

  } catch (error) {
    console.log(error);
  }
};

  // Add task to device calendar
  const addToGoogleCalendar = async (task) => {
  try {

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&details=${encodeURIComponent(task.description)}&dates=${start}/${end}`;

    await Linking.openURL(url);

  } catch (error) {
    console.log("Google Calendar Error:", error);
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
                {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)} Priority
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
          onPress={() => addToGoogleCalendar(task)}
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


  const printCalendar = async () => {

  const allTasks = [
    ...calendarTasks.today,
    ...calendarTasks.tomorrow,
    ...calendarTasks.thisWeek,
    ...calendarTasks.upcoming
  ];

  const html = `
  <html>
  <body>
  <h1>🌾 Smart Farming Crop Calendar</h1>
  <h3>Variety: ${variety || "Paddy"}</h3>
  <h3>Season: ${season || "Current Season"}</h3>
  <hr/>

  ${allTasks.map(task => `
      <div style="margin-bottom:10px;">
        <b>${task.title}</b><br/>
        Date: ${task.date}<br/>
        Time: ${task.time}<br/>
        Priority: ${task.priority}<br/>
        Description: ${task.description}
      </div>
  `).join("")}

  </body>
  </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  await Sharing.shareAsync(uri);
};

const addTask = () => {
  let title = prompt("Enter Task Title", "New Task");
  if (!title) return;

  let description = prompt("Enter Task Description", "Task Description");
  if (!description) return;

  let date = prompt("Enter Task Date (YYYY-MM-DD)", formatDate(0));
  if (!date) return;

  const newTask = {
    id: Date.now(),
    title,
    description,
    date,
    icon: "clipboard-text",
    time: "Anytime",
    priority: "medium",
    completed: false
  };

  setCalendarTasks(prev => ({
    ...prev,
    upcoming: [...prev.upcoming, newTask]
  }));
};

const editTask = (section, taskId) => {
  const task = calendarTasks[section].find(t => t.id === taskId);
  if (!task) return;

  let newTitle = prompt("Edit Task Title", task.title);
  if (!newTitle) return;

  let newDescription = prompt("Edit Task Description", task.description);
  if (!newDescription) return;

  let newDate = prompt("Edit Task Date (YYYY-MM-DD)", task.date);
  if (!newDate) return;

  setCalendarTasks(prev => ({
    ...prev,
    [section]: prev[section].map(t =>
      t.id === taskId ? { ...t, title: newTitle, description: newDescription, date: newDate } : t
    )
  }));
};

const deleteTask = (section, taskId) => {
  Alert.alert(
    "Delete Task",
    "Are you sure you want to delete this task?",
    [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: () => {
          setCalendarTasks(prev => ({
            ...prev,
            [section]: prev[section].filter(t => t.id !== taskId)
          }));
        }
      }
    ]
  );
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
            onPress={addTask}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color="#16a34a" />
            <Text style={styles.quickActionText}>Add Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={printCalendar}
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