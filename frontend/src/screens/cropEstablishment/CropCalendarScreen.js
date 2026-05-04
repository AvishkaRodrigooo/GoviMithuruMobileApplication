// CropCalendar.js
import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Helper function to format date
const formatDate = (daysToAdd = 0, specificDate = null) => {
  const date = specificDate ? new Date(specificDate) : new Date();
  if (daysToAdd !== 0) {
    date.setDate(date.getDate() + daysToAdd);
  }
  return date.toLocaleDateString('en-LK', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper function to get relative date string
const getRelativeDateString = (dateString) => {
  const taskDate = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (taskDate.toDateString() === today.toDateString()) return 'Today';
  if (taskDate.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`;
  return formatDate(0, dateString);
};

const CropCalendarScreen = ({ route, navigation }) => {
  const { variety, plantingWindow, season } = route.params || {};
  
  // State for calendar tasks
  const [calendarTasks, setCalendarTasks] = useState({
    today: [],
    tomorrow: [],
    thisWeek: [],
    upcoming: []
  });
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date: new Date(),
    time: 'Morning',
    priority: 'medium',
    icon: 'clipboard-text'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all'); // 'all', 'high', 'medium', 'low'
  const [searchQuery, setSearchQuery] = useState('');

  // Predefined task icons
  const taskIcons = [
    'tractor', 'seed', 'water', 'flask', 'sprout', 'bug', 
    'water-pump', 'scissors', 'leaf', 'cloud-rain', 'thermometer', 
    'calendar-check', 'bell', 'clipboard-list', 'alert'
  ];

  // Priority colors and config
  const priorityConfig = {
    high: { color: '#ef4444', bg: '#fee2e2', label: 'High Priority' },
    medium: { color: '#f59e0b', bg: '#fef3c7', label: 'Medium Priority' },
    low: { color: '#10b981', bg: '#d1fae5', label: 'Low Priority' }
  };

  // Initialize default tasks based on variety and season
  useEffect(() => {
    initializeDefaultTasks();
  }, [variety, season]);

  const initializeDefaultTasks = () => {
    const today = new Date();
    const plantingDate = new Date(today);
    
    // Adjust planting date based on season
    if (plantingWindow) {
      const windowMatch = plantingWindow.match(/\w+\s+(\d+)\s*-\s*\w+\s+(\d+)/);
      if (windowMatch) {
        const startDay = parseInt(windowMatch[1]);
        const currentMonth = today.getMonth();
        const plantingMonth = currentMonth === 3 || currentMonth === 4 ? 3 : 9; // April or October
        plantingDate.setMonth(plantingMonth);
        plantingDate.setDate(startDay);
      }
    }

    const tasks = {
      today: [
        {
          id: '1',
          title: 'Land Preparation',
          description: 'Plowing and leveling the field. Remove weeds and debris from previous cultivation.',
          date: formatDate(0),
          fullDate: today.toISOString(),
          icon: 'tractor',
          time: 'Morning (6:00 AM - 9:00 AM)',
          priority: 'high',
          completed: false,
          estimatedDuration: '4-6 hours',
          tips: 'Use tractor for large fields, ensure proper water leveling'
        }
      ],
      tomorrow: [
        {
          id: '2',
          title: 'Seed Sowing',
          description: `Plant ${variety || 'selected'} paddy seeds in prepared nursery or direct field.`,
          date: formatDate(1),
          fullDate: new Date(today.setDate(today.getDate() + 1)).toISOString(),
          icon: 'seed',
          time: 'Early Morning (5:00 AM - 8:00 AM)',
          priority: 'high',
          completed: false,
          estimatedDuration: '3-5 hours',
          tips: 'Use 150-160 kg seeds per hectare for broadcasting'
        }
      ],
      thisWeek: [
        {
          id: '3',
          title: 'First Irrigation',
          description: 'Water the field to maintain 2-3 cm standing water for germination.',
          date: formatDate(3),
          fullDate: new Date(today.setDate(today.getDate() + 3)).toISOString(),
          icon: 'water',
          time: 'Morning (7:00 AM - 10:00 AM)',
          priority: 'high',
          completed: false,
          estimatedDuration: '2-3 hours',
          tips: 'Maintain consistent water level for uniform germination'
        },
        {
          id: '4',
          title: 'Basal Fertilizer Application',
          description: 'Apply recommended fertilizer dose before transplanting.',
          date: formatDate(5),
          fullDate: new Date(today.setDate(today.getDate() + 5)).toISOString(),
          icon: 'flask',
          time: 'Afternoon (2:00 PM - 4:00 PM)',
          priority: 'high',
          completed: false,
          estimatedDuration: '2-3 hours',
          tips: 'Apply Urea 75kg, TSP 50kg, MOP 40kg per hectare'
        },
        {
          id: '5',
          title: 'Weed Management',
          description: 'First round of weeding to remove competitive weeds.',
          date: formatDate(7),
          fullDate: new Date(today.setDate(today.getDate() + 7)).toISOString(),
          icon: 'sprout',
          time: 'Morning (6:00 AM - 10:00 AM)',
          priority: 'medium',
          completed: false,
          estimatedDuration: '3-4 hours',
          tips: 'Manual weeding or apply pre-emergence herbicide'
        }
      ],
      upcoming: [
        {
          id: '6',
          title: 'Pest Scouting',
          description: 'Check for pests like stem borer, leaf folder, and planthoppers.',
          date: formatDate(15),
          fullDate: new Date(today.setDate(today.getDate() + 15)).toISOString(),
          icon: 'bug',
          time: 'Morning (8:00 AM - 11:00 AM)',
          priority: 'medium',
          completed: false,
          estimatedDuration: '2 hours',
          tips: 'Look for damaged leaves, white heads, and hopper burn'
        },
        {
          id: '7',
          title: 'Top Dressing - Urea',
          description: 'Apply second dose of Urea for better tillering.',
          date: formatDate(25),
          fullDate: new Date(today.setDate(today.getDate() + 25)).toISOString(),
          icon: 'flask',
          time: 'Afternoon (2:00 PM - 4:00 PM)',
          priority: 'high',
          completed: false,
          estimatedDuration: '2-3 hours',
          tips: 'Apply Urea 50kg per hectare when water is present'
        },
        {
          id: '8',
          title: 'Disease Management',
          description: 'Check and manage blast, sheath blight, and bacterial leaf blight.',
          date: formatDate(35),
          fullDate: new Date(today.setDate(today.getDate() + 35)).toISOString(),
          icon: 'leaf',
          time: 'Morning (7:00 AM - 9:00 AM)',
          priority: 'medium',
          completed: false,
          estimatedDuration: '2 hours',
          tips: 'Use resistant varieties and maintain proper spacing'
        },
        {
          id: '9',
          title: 'Pre-harvest Drainage',
          description: 'Drain water 2 weeks before harvest for uniform ripening.',
          date: formatDate(90),
          fullDate: new Date(today.setDate(today.getDate() + 90)).toISOString(),
          icon: 'water-pump',
          time: 'Morning (6:00 AM - 8:00 AM)',
          priority: 'medium',
          completed: false,
          estimatedDuration: '1-2 days',
          tips: 'Stop irrigation 15 days before expected harvest'
        },
        {
          id: '10',
          title: 'Harvesting',
          description: 'Harvest when 80-85% of grains are golden yellow.',
          date: formatDate(105),
          fullDate: new Date(today.setDate(today.getDate() + 105)).toISOString(),
          icon: 'scissors',
          time: 'Morning (6:00 AM - 12:00 PM)',
          priority: 'high',
          completed: false,
          estimatedDuration: '2-3 days',
          tips: 'Harvest in dry weather, thresh immediately'
        }
      ]
    };
    
    setCalendarTasks(tasks);
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
        Alert.alert('Permission Required', 'Please enable notifications to get reminders');
        return;
      }

      // Parse date to get trigger time
      const taskDate = new Date(task.fullDate || task.date);
      const notificationTime = new Date(taskDate);
      
      // Set notification for 8 AM on task day
      notificationTime.setHours(8, 0, 0, 0);
      
      const now = new Date();
      const timeDiff = notificationTime.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🌾 Farming Task Reminder',
            body: `${task.title} - ${task.description.substring(0, 100)}`,
            data: { taskId: task.id, section: task.section },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notificationTime,
          },
        });
        
        Alert.alert('Reminder Set', `Reminder scheduled for ${task.title} on ${task.date} at 8:00 AM`);
      } else {
        Alert.alert('Date Passed', 'Cannot schedule notification for past date');
      }
    } catch (error) {
      console.error('Notification error:', error);
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  // Add task to device calendar
  const addToDeviceCalendar = async (task) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow calendar access');
        return;
      }
      
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];
      
      if (defaultCalendar) {
        const startDate = new Date(task.fullDate || task.date);
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 3);
        
        await Calendar.createEventAsync(defaultCalendar.id, {
          title: `🌾 ${task.title}`,
          notes: task.description,
          startDate: startDate,
          endDate: endDate,
          timeZone: 'Asia/Colombo',
          alarms: [{ relativeOffset: -60 }], // Alert 1 hour before
        });
        
        Alert.alert('Success', 'Task added to your device calendar');
      }
    } catch (error) {
      console.error('Calendar error:', error);
      Alert.alert('Error', 'Failed to add to calendar');
    }
  };

  // Add to Google Calendar via URL
  const addToGoogleCalendar = async (task) => {
    try {
      const startDate = new Date(task.fullDate || task.date);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 3);
      
      const formatGoogleDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
      };
      
      const start = formatGoogleDate(startDate);
      const end = formatGoogleDate(endDate);
      
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`🌾 ${task.title}`)}&details=${encodeURIComponent(task.description)}&dates=${start}/${end}&ctz=Asia/Colombo`;
      
      await Linking.openURL(url);
    } catch (error) {
      console.error('Google Calendar Error:', error);
      Alert.alert('Error', 'Failed to open Google Calendar');
    }
  };

  // Request notification permissions
  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
    return status === 'granted';
  };

  // Add new custom task
  const addCustomTask = () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter task title');
      return;
    }
    
    const taskToAdd = {
      id: Date.now().toString(),
      ...newTask,
      date: formatDate(0, newTask.date),
      fullDate: newTask.date.toISOString(),
    };
    
    // Determine which section to add to
    const today = new Date();
    const taskDate = new Date(newTask.date);
    const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
    
    let section = 'upcoming';
    if (diffDays === 0) section = 'today';
    else if (diffDays === 1) section = 'tomorrow';
    else if (diffDays <= 7) section = 'thisWeek';
    
    setCalendarTasks(prev => ({
      ...prev,
      [section]: [...prev[section], taskToAdd]
    }));
    
    setShowAddModal(false);
    setNewTask({
      title: '',
      description: '',
      date: new Date(),
      time: 'Morning',
      priority: 'medium',
      icon: 'clipboard-text'
    });
    
    Alert.alert('Success', 'Task added successfully');
  };

  // Edit existing task
  const editTask = (section, task) => {
    setEditingTask({ section, ...task });
    setNewTask({
      title: task.title,
      description: task.description,
      date: new Date(task.fullDate || task.date),
      time: task.time,
      priority: task.priority,
      icon: task.icon
    });
    setShowAddModal(true);
  };

  // Update edited task
  const updateTask = () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter task title');
      return;
    }
    
    setCalendarTasks(prev => ({
      ...prev,
      [editingTask.section]: prev[editingTask.section].map(task =>
        task.id === editingTask.id
          ? {
              ...task,
              title: newTask.title,
              description: newTask.description,
              date: formatDate(0, newTask.date),
              fullDate: newTask.date.toISOString(),
              time: newTask.time,
              priority: newTask.priority,
              icon: newTask.icon
            }
          : task
      )
    }));
    
    setShowAddModal(false);
    setEditingTask(null);
    setNewTask({
      title: '',
      description: '',
      date: new Date(),
      time: 'Morning',
      priority: 'medium',
      icon: 'clipboard-text'
    });
    
    Alert.alert('Success', 'Task updated successfully');
  };

  // Delete task
  const deleteTask = (section, taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
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

  // Filter tasks based on priority and search
  const filterTasks = (tasks) => {
    let filtered = [...tasks];
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Get sorted tasks for a section
  const getSortedTasks = (section) => {
    const tasks = filterTasks(calendarTasks[section]);
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    const allTasks = [
      ...calendarTasks.today,
      ...calendarTasks.tomorrow,
      ...calendarTasks.thisWeek,
      ...calendarTasks.upcoming
    ];
    if (allTasks.length === 0) return 0;
    const completedTasks = allTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / allTasks.length) * 100);
  };

  // Get upcoming tasks count
  const getUpcomingCount = () => {
    const allTasks = [
      ...calendarTasks.today,
      ...calendarTasks.tomorrow,
      ...calendarTasks.thisWeek,
      ...calendarTasks.upcoming
    ];
    return allTasks.filter(task => !task.completed).length;
  };

  // Generate PDF report
  const printCalendar = async () => {
    const allTasks = [
      ...calendarTasks.today,
      ...calendarTasks.tomorrow,
      ...calendarTasks.thisWeek,
      ...calendarTasks.upcoming
    ];
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Crop Calendar Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          h1 { color: #16a34a; text-align: center; }
          .header { text-align: center; margin-bottom: 30px; }
          .task-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
          .task-title { font-size: 18px; font-weight: bold; color: #065f46; }
          .priority-high { color: #ef4444; }
          .priority-medium { color: #f59e0b; }
          .priority-low { color: #10b981; }
          .completed { text-decoration: line-through; opacity: 0.6; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌾 Crop Cultivation Calendar</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Variety: ${variety || 'Paddy'} | Season: ${season || 'Current'}</p>
          <p>Completion: ${calculateCompletion()}%</p>
        </div>
        
        ${allTasks.map(task => `
          <div class="task-card">
            <div class="task-title ${task.completed ? 'completed' : ''}">
              ${task.icon ? '🌾 ' : ''}${task.title}
            </div>
            <p><strong>Date:</strong> ${task.date}</p>
            <p><strong>Time:</strong> ${task.time}</p>
            <p><strong>Priority:</strong> <span class="priority-${task.priority}">${task.priority.toUpperCase()}</span></p>
            <p><strong>Description:</strong> ${task.description}</p>
            ${task.tips ? `<p><strong>Tips:</strong> ${task.tips}</p>` : ''}
            <p><strong>Status:</strong> ${task.completed ? '✓ Completed' : 'Pending'}</p>
          </div>
        `).join('')}
        
        <div class="footer">
          <p>Generated by AgroMind App - Smart Farming Assistant</p>
          <p>For more information, consult local agriculture experts</p>
        </div>
      </body>
      </html>
    `;
    
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  // Render task item
  const renderTaskItem = (task, section) => (
    <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleContainer}>
          <TouchableOpacity
            style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
            onPress={() => toggleTaskCompletion(section, task.id)}
          >
            {task.completed && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
          </TouchableOpacity>
          <MaterialCommunityIcons 
            name={task.icon} 
            size={24} 
            color={priorityConfig[task.priority]?.color || '#6b7280'} 
            style={styles.taskIcon}
          />
          <View style={styles.taskInfo}>
            <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>
              {task.title}
            </Text>
            <View style={styles.taskMeta}>
              <Text style={styles.taskTime}>{task.time}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityConfig[task.priority]?.bg }]}>
                <Text style={[styles.priorityText, { color: priorityConfig[task.priority]?.color }]}>
                  {priorityConfig[task.priority]?.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.taskDate}>{task.date}</Text>
      </View>
      
      <Text style={styles.taskDescription}>{task.description}</Text>
      
      {task.tips && (
        <View style={styles.tipsContainer}>
          <MaterialCommunityIcons name="lightbulb" size={14} color="#f59e0b" />
          <Text style={styles.tipsText}>Tip: {task.tips}</Text>
        </View>
      )}
      
      {task.estimatedDuration && (
        <View style={styles.durationContainer}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#6b7280" />
          <Text style={styles.durationText}>Est. duration: {task.estimatedDuration}</Text>
        </View>
      )}
      
      <View style={styles.taskActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.reminderButton]}
          onPress={() => scheduleNotification(task)}
        >
          <MaterialCommunityIcons name="bell-outline" size={16} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Remind</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.calendarButton]}
          onPress={() => addToGoogleCalendar(task)}
        >
          <MaterialCommunityIcons name="google" size={16} color="#ea4335" />
          <Text style={styles.actionButtonText}>Google</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deviceCalendarButton]}
          onPress={() => addToDeviceCalendar(task)}
        >
          <MaterialCommunityIcons name="calendar-plus" size={16} color="#16a34a" />
          <Text style={styles.actionButtonText}>Device</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editTask(section, task)}
        >
          <MaterialCommunityIcons name="pencil" size={16} color="#8b5cf6" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteTask(section, task.id)}
        >
          <MaterialCommunityIcons name="delete-outline" size={16} color="#ef4444" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCurrentDate = () => {
    return formatDate(0);
  };

  // Load saved tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem('cropCalendarTasks');
        if (savedTasks) {
          setCalendarTasks(JSON.parse(savedTasks));
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };
    loadTasks();
    requestNotificationPermissions();
  }, []);

  // Save tasks on change
  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem('cropCalendarTasks', JSON.stringify(calendarTasks));
      } catch (error) {
        console.error('Error saving tasks:', error);
      }
    };
    saveTasks();
  }, [calendarTasks]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#16a34a" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>📅 Crop Calendar</Text>
            <Text style={styles.headerSubtitle}>
              {variety || 'Paddy'} • {season || 'Current Season'}
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => {
            setEditingTask(null);
            setNewTask({
              title: '',
              description: '',
              date: new Date(),
              time: 'Morning',
              priority: 'medium',
              icon: 'clipboard-text'
            });
            setShowAddModal(true);
          }}>
            <MaterialCommunityIcons name="plus" size={24} color="#16a34a" />
          </TouchableOpacity>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.filterButtons}>
            {['all', 'high', 'medium', 'low'].map(priority => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.filterButton,
                  filterPriority === priority && styles.filterButtonActive,
                  { backgroundColor: filterPriority === priority ? priorityConfig[priority]?.color + '20' : '#f3f4f6' }
                ]}
                onPress={() => setFilterPriority(priority)}
              >
                <Text style={[
                  styles.filterText,
                  filterPriority === priority && { color: priorityConfig[priority]?.color }
                ]}>
                  {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Season Progress</Text>
            <Text style={styles.progressPercentage}>{calculateCompletion()}% Complete</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${calculateCompletion()}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {[...calendarTasks.today, ...calendarTasks.tomorrow].filter(t => t.completed).length}
              </Text>
              <Text style={styles.statLabel}>Completed Today/Tomorrow</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getUpcomingCount()}</Text>
              <Text style={styles.statLabel}>Pending Tasks</Text>
            </View>
          </View>
        </View>

        {/* Today's Tasks */}
        {getSortedTasks('today').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="calendar-today" size={20} color="#ef4444" />
                <Text style={styles.sectionTitle}>Today</Text>
              </View>
              <Text style={styles.sectionDate}>{getCurrentDate()}</Text>
            </View>
            {getSortedTasks('today').map(task => renderTaskItem(task, 'today'))}
          </View>
        )}

        {/* Tomorrow's Tasks */}
        {getSortedTasks('tomorrow').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="calendar-arrow-right" size={20} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Tomorrow</Text>
              </View>
            </View>
            {getSortedTasks('tomorrow').map(task => renderTaskItem(task, 'tomorrow'))}
          </View>
        )}

        {/* This Week's Tasks */}
        {getSortedTasks('thisWeek').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="calendar-week" size={20} color="#3b82f6" />
                <Text style={styles.sectionTitle}>This Week</Text>
              </View>
            </View>
            {getSortedTasks('thisWeek').map(task => renderTaskItem(task, 'thisWeek'))}
          </View>
        )}

        {/* Upcoming Tasks */}
        {getSortedTasks('upcoming').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="calendar-month" size={20} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Upcoming</Text>
              </View>
            </View>
            {getSortedTasks('upcoming').map(task => renderTaskItem(task, 'upcoming'))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => {
            setEditingTask(null);
            setNewTask({
              title: '',
              description: '',
              date: new Date(),
              time: 'Morning',
              priority: 'medium',
              icon: 'clipboard-text'
            });
            setShowAddModal(true);
          }}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#16a34a" />
            <Text style={styles.quickActionText}>Add Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={printCalendar}>
            <MaterialCommunityIcons name="printer" size={24} color="#3b82f6" />
            <Text style={styles.quickActionText}>Print Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={requestNotificationPermissions}>
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
            Calendar tasks are optimized for {variety || 'paddy'} cultivation. Adjust timing based on local weather conditions.
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Task Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter task title"
                value={newTask.title}
                onChangeText={(text) => setNewTask({ ...newTask, title: text })}
              />
              
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Enter task description"
                multiline
                numberOfLines={3}
                value={newTask.description}
                onChangeText={(text) => setNewTask({ ...newTask, description: text })}
              />
              
              <Text style={styles.modalLabel}>Date</Text>
              <TouchableOpacity
                style={styles.modalDateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#16a34a" />
                <Text style={styles.modalDateText}>
                  {newTask.date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={newTask.date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setNewTask({ ...newTask, date: selectedDate });
                    }
                  }}
                />
              )}
              
              <Text style={styles.modalLabel}>Time</Text>
              <View style={styles.timeOptions}>
                {['Morning (6-9 AM)', 'Afternoon (2-4 PM)', 'Evening (4-6 PM)', 'Anytime'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.timeOption, newTask.time === option && styles.timeOptionActive]}
                    onPress={() => setNewTask({ ...newTask, time: option })}
                  >
                    <Text style={[styles.timeOptionText, newTask.time === option && styles.timeOptionTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.modalLabel}>Priority</Text>
              <View style={styles.priorityOptions}>
                {['high', 'medium', 'low'].map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[styles.priorityOption, newTask.priority === priority && { backgroundColor: priorityConfig[priority].bg }]}
                    onPress={() => setNewTask({ ...newTask, priority })}
                  >
                    <Text style={[styles.priorityOptionText, { color: priorityConfig[priority].color }]}>
                      {priorityConfig[priority].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.modalLabel}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconSelector}>
                {taskIcons.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[styles.iconOption, newTask.icon === icon && styles.iconOptionActive]}
                    onPress={() => setNewTask({ ...newTask, icon })}
                  >
                    <MaterialCommunityIcons name={icon} size={24} color={newTask.icon === icon ? '#16a34a' : '#6b7280'} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={editingTask ? updateTask : addCustomTask}
              >
                <Text style={styles.modalSaveText}>{editingTask ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  
  // Header
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
  backButton: { padding: 8, borderRadius: 8 },
  addButton: { padding: 8, borderRadius: 8, backgroundColor: '#f0fdf4' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#16a34a' },
  headerSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  
  // Search and Filter
  searchContainer: { padding: 16, backgroundColor: 'white', marginBottom: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1f2937' },
  filterButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  filterButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterButtonActive: { borderWidth: 1, borderColor: '#16a34a' },
  filterText: { fontSize: 14, fontWeight: '500', color: '#4b5563' },
  
  // Progress Card
  progressCard: { 
    backgroundColor: 'white', 
    margin: 16, 
    marginTop: 8,
    borderRadius: 16, 
    padding: 20, 
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  progressPercentage: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },
  progressBar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 4 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  
  // Sections
  section: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 16, 
    padding: 16,
    elevation: 1
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 8 },
  sectionDate: { fontSize: 14, color: '#6b7280' },
  
  // Task Card
  taskCard: { 
    backgroundColor: '#f9fafb', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  taskCardCompleted: { opacity: 0.7, backgroundColor: '#f3f4f6' },
  taskHeader: { marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  taskTitleContainer: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  checkboxCompleted: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  taskIcon: { marginRight: 12, marginTop: 2 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  taskCompleted: { textDecorationLine: 'line-through', color: '#9ca3af' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  taskTime: { fontSize: 12, color: '#6b7280' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  priorityText: { fontSize: 10, fontWeight: '600' },
  taskDate: { fontSize: 13, color: '#16a34a', fontWeight: '500', marginLeft: 12 },
  taskDescription: { fontSize: 14, color: '#4b5563', lineHeight: 20, marginBottom: 12 },
  tipsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', padding: 8, borderRadius: 8, marginBottom: 8 },
  tipsText: { fontSize: 12, color: '#92400e', marginLeft: 6, flex: 1 },
  durationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  durationText: { fontSize: 12, color: '#6b7280', marginLeft: 6 },
  
  // Task Actions
  taskActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f3f4f6' },
  reminderButton: { backgroundColor: '#dbeafe' },
  calendarButton: { backgroundColor: '#fee2e2' },
  deviceCalendarButton: { backgroundColor: '#d1fae5' },
  editButton: { backgroundColor: '#ede9fe' },
  deleteButton: { backgroundColor: '#fee2e2' },
  actionButtonText: { fontSize: 11, fontWeight: '500', marginLeft: 4 },
  
  // Quick Actions
  quickActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 1
  },
  quickActionButton: { alignItems: 'center' },
  quickActionText: { fontSize: 12, color: '#374151', marginTop: 8 },
  
  // Footer
  footerNote: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 12
  },
  footerNoteText: { fontSize: 12, color: '#6b7280', marginLeft: 8, flex: 1, textAlign: 'center' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 20, width: width - 40, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#f9fafb' },
  modalTextArea: { height: 80, textAlignVertical: 'top' },
  modalDateButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, backgroundColor: '#f9fafb' },
  modalDateText: { marginLeft: 8, fontSize: 14, color: '#1f2937' },
  timeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  timeOptionActive: { backgroundColor: '#16a34a' },
  timeOptionText: { fontSize: 12, color: '#374151' },
  timeOptionTextActive: { color: 'white' },
  priorityOptions: { flexDirection: 'row', gap: 12 },
  priorityOption: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#f3f4f6' },
  priorityOptionText: { fontSize: 12, fontWeight: '500' },
  iconSelector: { flexDirection: 'row', maxHeight: 60, marginBottom: 16 },
  iconOption: { padding: 10, marginRight: 8, borderRadius: 10, backgroundColor: '#f3f4f6' },
  iconOptionActive: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#16a34a' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalCancelButton: { backgroundColor: '#f3f4f6' },
  modalSaveButton: { backgroundColor: '#16a34a' },
  modalCancelText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  modalSaveText: { fontSize: 14, fontWeight: '500', color: 'white' },
});

export default CropCalendarScreen;