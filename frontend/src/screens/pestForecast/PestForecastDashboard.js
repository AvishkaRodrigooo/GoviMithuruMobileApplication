import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Modal,
  Switch,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';


// import * as Notifications from 'expo-notifications';

// Import OneSignal service
import NotificationService from '../../services/notificationService';

const API_BASE_URL = 'http://192.168.1.105:5005/api/pest';

// Remove Notification handler
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

const Icon = ({ name, size, color, style }) => {
  const iconMap = {
    'bug': '🐛', 'map-marker': '📍', 'sprout': '🌱', 'calendar': '📅',
    'information': 'ℹ️', 'bug-check': '✅', 'chart-line': '📈', 'refresh': '🔄',
    'plus-circle': '➕', 'history': '📜', 'cog': '⚙️', 'weather-sunny': '☀️',
    'weather-night': '🌙', 'circle-small': '•', 'flower': '🌸', 'leaf': '🍃',
    'wheat': '🌾', 'corn': '🌽', 'help-circle': '❓', 'chart-areaspline': '📊',
    'clock': '⏰', 'shield-alert': '🛡️', 'lightbulb': '💡', 'format-list-bulleted': '📋',
    'office-building': '🏢', 'alert-circle': '⚠️', 'alert': '⚠️', 'alert-octagon': '🚨',
    'alert-decagram': '🚨', 'check-circle': '✅', 'arrow-left': '⬅️', 'arrow-right': '➡️',
    'home': '🏠', 'thermometer': '🌡️', 'water': '💧', 'weather-rainy': '🌧️',
    'wind': '💨', 'cloud': '☁️', 'close': '✕', 'share': '↗️', 'book': '📚',
    'trash': '🗑️', 'notification': '🔔', 'notification-off': '🔕', 'rainbow': '🌈',
    'satellite': '🛰️', 'radar': '📡', 'database': '🗄️', 'chart-bar': '📊',
    'download': '📥', 'upload': '📤', 'wifi': '📶', 'earth': '🌍', 'language': '🗣️',
    'settings': '⚙️', 'bug-report': '📋', 'weather-partly-cloudy': '⛅',
    'server': '🖥️', 'shield': '🛡️', 'chart-pie': '📊', 'bell': '🔔',
    'bell-ring': '🔔', 'bell-off': '🔕', 'speedometer': '📊', 'thermometer-lines': '🌡️'
  };
  
  const iconText = name && iconMap[name] ? iconMap[name] : '•';
  const isEmoji = iconText.length === 2 && iconText.codePointAt(0) > 255;
  const finalSize = isEmoji ? size * 0.85 : size;
  
  return (
    <Text style={[
      style, 
      { 
        fontSize: finalSize, 
        color: color || '#000',
        lineHeight: finalSize,
        textAlignVertical: 'center',
        includeFontPadding: false
      }
    ]}>
      {iconText}
    </Text>
  );
};

const PestForecastDashboard = ({ navigation }) => {
  const [districts, setDistricts] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherSource, setWeatherSource] = useState('Loading weather data...');
  
  const [district, setDistrict] = useState('');
  const [paddyType, setPaddyType] = useState('');
  const [paddyAge, setPaddyAge] = useState('');
  
  const [prediction, setPrediction] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState([]);
  
  // UI state
  const [showForm, setShowForm] = useState(true);
  const [showForecast, setShowForecast] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [mlEngineStatus, setMlEngineStatus] = useState('Checking...');
  const [onesignalId, setOnesignalId] = useState(null);
  
  // Translations 
  const translations = {
    en: {
      title: 'Pest Attack Predictor',
      subtitle: 'With Weather Data',
      district: 'Select District',
      paddyType: 'Paddy Variety',
      paddyAge: 'Paddy Age (days)',
      predict: 'Predict Pest Attack',
      forecast: '7-Day Forecast',
      loading: 'Analyzing...',
      riskLevel: 'Risk Level',
      severity: 'Severity',
      incidence: 'Attack Level',
      confidence: 'Accuracy',
      topPests: 'Expected Pests',
      fertilizer: 'Recommended Action',
      immediateAction: 'Immediate Action',
      alerts: 'Alerts',
      noData: 'No predictions yet',
      growthStage: 'Growth Stage',
      currentWeather: 'Current Weather',
      incidenceAdvice: 'Field Condition',
      normal: 'Normal',
      low: 'Low',
      moderate: 'Moderate',
      high: 'High',
      veryHigh: 'Very High',
      attackRange: 'Attack Range',
      weather: 'Weather',
      temperature: 'Temperature',
      humidity: 'Humidity',
      rainfall: 'Rainfall',
      settings: 'Settings',
      language: 'Language',
      darkMode: 'Dark Mode',
      autoRefresh: 'Auto Refresh',
      save: 'Save',
      cancel: 'Cancel',
      viewWeather: 'View Weather',
      notificationAlert: 'Risk Alert!',
      advancedOptions: 'Advanced Options',
      seasonalInfo: 'Seasonal Information',
      currentSeason: 'Current Season',
      yala: 'Yala Season',
      maha: 'Maha Season',
      downloadReport: 'Download Report',
      shareResults: 'Share Results',
      viewMap: 'View District Map',
      contactExpert: 'Contact Expert',
      pestLibrary: 'Pest Library',
      preventionTips: 'Prevention Tips',
      history: 'History',
      clearHistory: 'Clear History',
      about: 'About',
      version: 'Version 4.4',
      support: 'Support',
      feedback: 'Feedback',
      rateApp: 'Rate App',
      windSpeed: 'Wind Speed',
      notifications: 'Notifications',
      realTimeData: 'Weather Data',
      dataSource: 'Data Source',
      serverStatus: 'Server Status',
      connected: 'Connected',
      disconnected: 'Disconnected',
      weatherSource: 'Weather Data',
      veryLow: 'Very Low',
      riskScore: 'Risk Score',
      mlEngine: 'Prediction Engine',
      dynamicRisk: 'Dynamic Risk Calculation',
      farmerAlert: 'Farmer Alert',
      incidencePercentage: 'Incidence %',
      takeAction: 'Take Action',
      monitorOnly: 'Monitor Only',
      critical: 'Critical',
      notificationsReady: 'Push notifications ready',
      notificationsSettingUp: 'Setting up notifications...',
      sendTestNotification: 'Send Test Notification'
    },
    si: {
      title: 'පළිබෝධ ප්‍රහාර අනාවැකි',
      subtitle: 'කාලගුණ දත්ත සමග',
      district: 'දිස්ත්‍රික්කය තෝරන්න',
      paddyType: 'වී වර්ගය',
      paddyAge: 'වගා වයස (දින)',
      predict: 'පළිබෝධ ප්‍රහාරය අනාවැකි කරන්න',
      forecast: 'දින 7 අනාවැකි',
      loading: 'විශ්ලේෂණය කරමින්...',
      riskLevel: 'අවදානම් මට්ටම',
      severity: 'දරුණු බව',
      incidence: 'ප්‍රහාර මට්ටම',
      confidence: 'නිරවද්‍යතාව',
      topPests: 'අපේක්ෂිත පළිබෝධ',
      fertilizer: 'නිර්දේශිත ක්‍රියාමාර්ග',
      immediateAction: 'ක්ෂණික ක්‍රියාමාර්ග',
      alerts: 'ඇඟවීම්',
      noData: 'තවම අනාවැකි නැත',
      growthStage: 'වර්ධන අවධිය',
      currentWeather: 'වර්තමාන කාලගුණය',
      incidenceAdvice: 'කෙතේ තත්වය',
      normal: 'සාමාන්‍ය',
      low: 'අඩු',
      moderate: 'මධ්‍යස්ථ',
      high: 'ඉහළ',
      veryHigh: 'ඉතා ඉහළ',
      veryLow: 'ඉතා අඩු',
      attackRange: 'ප්‍රහාර පරාසය',
      weather: 'කාලගුණය',
      temperature: 'තාපමානය',
      humidity: 'ආර්ද්‍රතාව',
      rainfall: 'වර්ෂාපතනය',
      settings: 'සැකසුම්',
      language: 'භාෂාව',
      darkMode: 'අඳුරු ප්‍රකාරය',
      autoRefresh: 'ස්වයංක්‍රීයයෙන් නැවුම් කරන්න',
      save: 'සුරකින්න',
      cancel: 'අවලංගු කරන්න',
      viewWeather: 'කාලගුණය බලන්න',
      notificationAlert: 'අවදානම් ඇඟවීම!',
      advancedOptions: 'උසස් විකල්ප',
      seasonalInfo: 'වාරය සම්බන්ධ තොරතුරු',
      currentSeason: 'වර්තමාන වාරය',
      yala: 'යල වාරය',
      maha: 'මහ වාරය',
      downloadReport: 'වාර්තාව බාගත කරන්න',
      shareResults: 'ප්‍රතිඵල බෙදාගන්න',
      viewMap: 'දිස්ත්‍රික්ක සිතියම බලන්න',
      contactExpert: 'විශේෂඥයෙකු අමතන්න',
      pestLibrary: 'පළිබෝධ පුස්තකාලය',
      preventionTips: 'වැළැක්වීමේ උපදෙස්',
      history: 'ඉතිහාසය',
      clearHistory: 'ඉතිහාසය මකන්න',
      about: 'තොරතුරු',
      version: 'අනුවාදය 4.4',
      support: 'සහාය',
      feedback: 'ප්‍රතිපෝෂණය',
      rateApp: 'ඇප් අගයන්න',
      windSpeed: 'සුළං වේගය',
      notifications: 'දැනුම්දීම්',
      realTimeData: 'කාලගුණ දත්ත',
      dataSource: 'දත්ත මූලාශ්‍රය',
      serverStatus: 'සේවාදායක තත්වය',
      connected: 'සම්බන්ධිත',
      disconnected: 'විසන්ධිගත',
      weatherSource: 'කාලගුණ දත්ත',
      riskScore: 'අවදානම් ලකුණු',
      mlEngine: 'අනාවැකි එන්ජිම',
      dynamicRisk: 'ගතික අවදානම් ගණනය',
      farmerAlert: 'ගොවියන් ඇඟවීම',
      incidencePercentage: 'ප්‍රහාර ප්‍රතිශතය',
      takeAction: 'ක්‍රියාමාර්ග ගන්න',
      monitorOnly: 'නිරීක්ෂණය කරන්න',
      critical: 'විනාශකාරී',
      notificationsReady: 'දැනුම්දීම් සූදානම්',
      notificationsSettingUp: 'දැනුම්දීම් සක්‍රීය වෙමින්...',
      sendTestNotification: 'පරීක්ෂණ දැනුම්දීමක් යවන්න'
    }
  };
  
  const t = (key) => {
    if (!translations[language]) return key;
    return translations[language][key] || key;
  };
  
  // Helper functions
  const getGrowthStage = (age) => {
    if (!age || isNaN(age)) return '';
    if (age <= 25) return language === 'si' ? 'අංකුර' : 'Seedling';
    if (age <= 50) return language === 'si' ? 'කොළ වැකීම' : 'Tillering';
    if (age <= 70) return language === 'si' ? 'මල් හටගැනීම' : 'Flowering';
    if (age <= 90) return language === 'si' ? 'ධාන්‍ය පිරීම' : 'Grain Filling';
    return language === 'si' ? 'පරිණත' : 'Maturity';
  };

  const getGrowthStageIcon = (age) => {
    if (!age || isNaN(age)) return "help-circle";
    if (age <= 25) return "sprout";
    if (age <= 50) return "leaf";
    if (age <= 70) return "flower";
    if (age <= 90) return "wheat";
    return "corn";
  };
  
  const getIncidenceRange = (incidence) => {
    if (!incidence) return "0-5%";
    
    if (typeof incidence === 'string' && incidence.includes('%')) {
      return incidence;
    }
    
    const num = parseFloat(incidence);
    if (isNaN(num)) return "0-5%";
    
    if (num <= 5) return "0-5%";
    if (num <= 10) return "5-10%";
    if (num <= 20) return "10-20%";
    if (num <= 30) return "20-30%";
    return "30+%";
  };
  
  const getIncidenceAdvice = (incidence) => {
    const range = getIncidenceRange(incidence);
    
    const advice = {
      "0-5%": language === 'si' ? "සාමාන්‍ය - ප්‍රතිපල අඛණ්ඩව නිරීක්ෂණය කරන්න" : "Normal - Continue regular monitoring",
      "5-10%": language === 'si' ? "අඩු - නිරීක්ෂණ ගණන වැඩි කරන්න" : "Low - Increase monitoring frequency",
      "10-20%": language === 'si' ? "මධ්‍යස්ථ - වැලැක්වීමේ පියවර සකස් කරන්න" : "Moderate - Prepare preventive measures",
      "20-30%": language === 'si' ? "ඉහළ - නිර්දේශිත ප්‍රතිකර්ම යොදන්න" : "High - Apply recommended treatments",
      "30+%": language === 'si' ? "ඉතා ඉහළ - ක්ෂණික පියවර ගන්න!" : "Very High - Take immediate action!"
    };
    
    return advice[range] || (language === 'si' ? "කෙත නිරීක්ෂණය කරන්න" : "Monitor field regularly");
  };

  const getIncidenceIcon = (incidence) => {
    const range = getIncidenceRange(incidence);
    
    const icons = {
      "0-5%": "check-circle",
      "5-10%": "alert-circle",
      "10-20%": "alert",
      "20-30%": "alert-octagon",
      "30+%": "alert-decagram"
    };
    
    return icons[range] || "information";
  };
  
  const getIncidenceColor = (incidence) => {
    const range = getIncidenceRange(incidence);
    
    const colors = {
      "0-5%": "#16a34a",    
      "5-10%": "#ca8a04",   
      "10-20%": "#ea580c",  
      "20-30%": "#dc2626",  
      "30+%": "#991b1b"     
    };
    
    return colors[range] || "#6b7280";
  };
  
  const getRiskColor = (risk) => {
    if (!risk) return '#6b7280';
    
    const riskLower = risk.toLowerCase();
    
    if (riskLower.includes('very high') || riskLower.includes('critical')) return '#991b1b';
    if (riskLower.includes('high')) return '#dc2626';
    if (riskLower.includes('moderate')) return '#ca8a04';
    if (riskLower.includes('low')) return '#16a34a';
    if (riskLower.includes('very low')) return '#059669';
    return '#6b7280';
  };

  const getRiskIcon = (risk) => {
    if (!risk) return 'information';
    
    const riskLower = risk.toLowerCase();
    
    if (riskLower.includes('very high') || riskLower.includes('critical')) return 'alert-decagram';
    if (riskLower.includes('high')) return 'alert-octagon';
    if (riskLower.includes('moderate')) return 'alert';
    if (riskLower.includes('low')) return 'alert-circle';
    if (riskLower.includes('very low')) return 'check-circle';
    return 'information';
  };

  const getSeason = () => {
    const month = new Date().getMonth() + 1;
    return month >= 5 && month <= 9 ? 'Yala' : 'Maha';
  };

  const getSeasonName = () => {
    const season = getSeason(); 
    return language === 'si' ? 
      (season === 'Yala' ? 'යල වාරය' : 'මහ වාරය') : 
      (season === 'Yala' ? 'Yala Season' : 'Maha Season');
  };
  
  
  useEffect(() => {
    const initNotifications = async () => {
      try {
        
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        
        NotificationService.initialize(userId);
        
        
        NotificationService.setNotificationOpenHandler((data) => {
          console.log('Notification opened:', data);
          
          if (data.type === 'pest_alert') {
            Alert.alert(
              language === 'si' ? '🚨 පළිබෝධ ඇඟවීම' : '🚨 Pest Alert',
              language === 'si' 
                ? `${data.district} හි ${data.risk_level} අවදානමක් හඳුනාගෙන ඇත`
                : `${data.risk_level} risk detected in ${data.district}`,
              [
                { text: language === 'si' ? 'හරි' : 'OK' },
                { 
                  text: language === 'si' ? 'බලන්න' : 'View',
                  onPress: () => {
                    
                    console.log('View details');
                  }
                }
              ]
            );
          }
        });
        
        
        setTimeout(async () => {
          const deviceId = await NotificationService.getDeviceId();
          setOnesignalId(deviceId);
          console.log('OneSignal ID:', deviceId);
        }, 2000);
        
        
        const savedNotifications = await AsyncStorage.getItem('notificationsEnabled');
        if (savedNotifications !== null) {
          setNotificationsEnabled(JSON.parse(savedNotifications));
        }
        
      } catch (error) {
        console.log('Notification init error:', error);
      }
    };
    
    initNotifications();
  }, []);
  
  
  useEffect(() => {
    if (NotificationService.isInitialized()) {
      NotificationService.updateLanguage(language);
    }
  }, [language]);
  
 
  useEffect(() => {
    console.log('Component mounted');
    const loadHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('predictionHistory');
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory).slice(0, 10));
        }
      } catch (error) {
        console.log('Error loading history:', error);
      }
    };
    loadHistory();
  }, []);
  
  // Remove expo-notifications permission useEffect
  // useEffect(() => {
  //   const requestPermissions = async () => {
  //     try {
  //       const { status } = await Notifications.requestPermissionsAsync();
  //       setNotificationsEnabled(status === 'granted');
  //     } catch (error) {
  //       console.log('Notification permission error:', error);
  //       setNotificationsEnabled(false);
  //     }
  //   };
  //   requestPermissions();
  // }, []);
  
  useEffect(() => {
    fetchInitialData();
    loadPreferences();
    checkMLEngineStatus();
  }, []);
  
  // Auto-refresh effect
  useEffect(() => {
    let interval;
    if (autoRefresh && !showForm) {
      interval = setInterval(() => {
        if (district && paddyType && paddyAge) {
          handlePredict();
        }
      }, 300000); // 5 minutes
    }
    return () => clearInterval(interval);
  }, [autoRefresh, showForm, district, paddyType, paddyAge]);
  
  const loadPreferences = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      const savedLanguage = await AsyncStorage.getItem('language');
      const savedAutoRefresh = await AsyncStorage.getItem('autoRefresh');
      const savedNotifications = await AsyncStorage.getItem('notificationsEnabled');
      
      if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
      if (savedLanguage !== null) setLanguage(savedLanguage);
      if (savedAutoRefresh !== null) setAutoRefresh(JSON.parse(savedAutoRefresh));
      if (savedNotifications !== null) setNotificationsEnabled(JSON.parse(savedNotifications));
    } catch (error) {
      console.log('Error loading preferences:', error);
    }
  };
  
  const savePreference = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log('Error saving preference:', error);
    }
  };
  
  const checkMLEngineStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/model/status`);
      const data = await response.json();
      if (data.ml_models_loaded) {
        setMlEngineStatus('ML Engine Active');
      } else {
        setMlEngineStatus('Rule-Based Active');
      }
    } catch (error) {
      console.log('Error checking ML engine:', error);
      setMlEngineStatus('Unknown');
    }
  };
  
  const fetchInitialData = async () => {
    try {
      console.log('Fetching initial data from:', API_BASE_URL);
      
      const [districtsRes, varietiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/districts`).catch(err => {
          console.log('District fetch error:', err);
          return { ok: false };
        }),
        fetch(`${API_BASE_URL}/varieties`).catch(err => {
          console.log('Variety fetch error:', err);
          return { ok: false };
        })
      ]);
      
      let districtsData = { districts: [] };
      let varietiesData = { varieties: [] };
      
      if (districtsRes.ok) {
        try {
          districtsData = await districtsRes.json();
        } catch (e) {
          console.log('Error parsing districts:', e);
        }
      }
      
      if (varietiesRes.ok) {
        try {
          varietiesData = await varietiesRes.json();
        } catch (e) {
          console.log('Error parsing varieties:', e);
        }
      }
      
      console.log('Districts loaded:', districtsData?.districts?.length || 0);
      console.log('Varieties loaded:', varietiesData?.varieties?.length || 0);
      
      const districts = districtsData.districts || ["Anuradhapura", "Polonnaruwa", "Hambantota", "Kurunegala"];
      const varieties = varietiesData.varieties || ["BG300", "BG352", "BG358", "At362"];
      
      setDistricts(districts);
      setVarieties(varieties);
      
      if (districts.length > 0) {
        setDistrict(districts[0]);
        fetchWeather(districts[0]);
      }
      if (varieties.length > 0) {
        setPaddyType(varieties[0]);
      }
      
    } catch (error) {
      console.log('Error in fetchInitialData:', error);
      const mockDistricts = ["Anuradhapura", "Polonnaruwa", "Hambantota", "Kurunegala"];
      const mockVarieties = ["BG300", "BG352", "BG358", "At362"];
      
      setDistricts(mockDistricts);
      setVarieties(mockVarieties);
      setDistrict(mockDistricts[0]);
      setPaddyType(mockVarieties[0]);
    }
  };
  
  const fetchWeather = async (districtName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/weather/${districtName}`);
      const data = await response.json();
      if (data.status === 'success') {
        setWeatherData(data.weather);
        setWeatherSource(data.source === 'OpenWeatherMap' ? 'Weather Data' : t('weatherSource'));
      }
    } catch (error) {
      console.log('Error fetching weather:', error);
      setWeatherData({
        temp: 29.5,
        rain: 7.2,
        humidity: 78,
        description: language === 'si' ? 'අර්ධ වශයෙන් වලාකුළු' : 'Partly cloudy',
        pressure: 1013,
        wind_speed: 2.5,
        wind_deg: 180,
        clouds: 40
      });
      setWeatherSource(t('weatherSource'));
    }
  };
  
  const handleDistrictChange = (value) => {
    setDistrict(value);
    fetchWeather(value);
  };
  
  
  const showInAppAlert = (title, message, riskLevel) => {
    if (riskLevel === 'High' || riskLevel === 'Very High') {
      Alert.alert(
        language === 'si' ? 'අධික අවදානම් ඇඟවීම' : 'High Risk Alert',
        message,
        [{ text: 'OK' }]
      );
    } else if (riskLevel === 'Moderate') {
      Alert.alert(
        language === 'si' ? 'මධ්‍යස්ථ අවදානම' : 'Moderate Risk Alert',
        message,
        [{ text: 'OK' }]
      );
    }
  };

  // Handle prediction with real weather
  const handlePredict = async () => {
    if (!district || !paddyType || !paddyAge) {
      Alert.alert(
        language === 'si' ? 'දෝෂය' : 'Error',
        language === 'si' ? 'කරුණාකර දිස්ත්‍රික්කය, වී වර්ගය සහ වයස ඇතුලත් කරන්න' : 'Please select district, paddy variety and enter age'
      );
      return;
    }
    
    const ageNum = parseFloat(paddyAge);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      Alert.alert(
        language === 'si' ? 'දෝෂය' : 'Error',
        language === 'si' ? 'කරුණාකර වලංගු වී වයසක් ඇතුලත් කරන්න (1-120 දින)' : 'Please enter a valid paddy age (1-120 days)'
      );
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Making prediction with:', { district, paddyType, paddyAge: ageNum });
      
      
      if (NotificationService.isInitialized()) {
        NotificationService.sendLocationTags(district, getSeason(), paddyType, language);
      }
      
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          district,
          paddy_type: paddyType,
          paddy_age: ageNum,
          language: language,
          onesignal_id: notificationsEnabled ? onesignalId : null
        }),
      });
      
      const data = await response.json();
      console.log('Prediction response:', data);

      if (response.ok && data.status === 'success') {
        setPrediction(data);
        setShowForm(false);
     
        console.log('Risk Level:', data.prediction?.risk_level);
        console.log('Severity:', data.prediction?.severity);
        console.log('Incidence:', data.prediction?.incidence_percent);
        console.log('Risk Score:', data.prediction?.risk_score);
        
        const historyItem = {
          id: Date.now(),
          district,
          variety: paddyType,
          age: paddyAge,
          pest: data.prediction?.predicted_pest || 'Unknown',
          risk: data.prediction?.risk_level || 'Low',
          incidence: getIncidenceRange(data.prediction?.incidence_percent),
          severity: data.prediction?.severity || 'Low',
          confidence: data.prediction?.confidence || 0,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString(),
          weather: data.current_weather?.description || 'Unknown',
          risk_score: data.prediction?.risk_score || 0,
          incidence_percent: data.prediction?.incidence_percent || 0
        };
        
        const newHistory = [historyItem, ...history.slice(0, 9)];
        setHistory(newHistory);
        
        try {
          await AsyncStorage.setItem('predictionHistory', JSON.stringify(newHistory.slice(0, 50)));
        } catch (error) {
          console.log('Error saving history:', error);
        }
        
        fetchForecast();
        
        const riskLevel = data.prediction?.risk_level;
        const severity = data.prediction?.severity;
        const incidence = data.prediction?.incidence_percent || 0;
        const pestName = data.prediction?.predicted_pest || 'Unknown Pest';
        
        console.log('Risk Check:', { riskLevel, severity, incidence });
        
        // Show in-app alert for high/moderate risk 
        if (riskLevel === 'Moderate' || riskLevel === 'High' || riskLevel === 'Very High') {
          const message = language === 'si'
            ? `${district} හි ${incidence}% පළිබෝධ අවදානමක් හඳුනාගෙන ඇත.\n\nපළිබෝධය: ${pestName}\nදරුණු බව: ${severity}`
            : `${riskLevel} pest risk detected in ${district}.\n\nPest: ${pestName}\nSeverity: ${severity}\nIncidence: ${incidence}%`;
          
          showInAppAlert(
            riskLevel === 'High' || riskLevel === 'Very High' ? 'High Risk Alert' : 'Moderate Risk Alert',
            message,
            riskLevel
          );
        } else {
          Alert.alert(
            language === 'si' ? 'අනාවැකිය සාර්ථකයි' : 'Prediction Successful',
            language === 'si' 
              ? `අවදානම මට්ටම: ${riskLevel}\nප්‍රහාර ප්‍රතිශතය: ${incidence}%\n\nනිරීක්ෂණය දිගටම කරගෙන යන්න.`
              : `Risk Level: ${riskLevel}\nIncidence: ${incidence}%\n\nContinue regular monitoring.`,
            [{ text: 'OK' }]
          );
        }

      } else {
        Alert.alert(
          language === 'si' ? 'අනාවැකිය අසාර්ථකයි' : 'Prediction Failed',
          data.error || (language === 'si' ? 'නොදන්නා දෝෂයකි' : 'Unknown error')
        );
        
        useFallbackPrediction();
      }
    } catch (error) {
      console.log('Prediction network error:', error);
      Alert.alert(
        language === 'si' ? 'ජාල දෝෂය' : 'Network Error',
        language === 'si' ? 'සේවාදායකයට සම්බන්ධ විය නොහැක. පරීක්ෂා කරන්න IP ලිපිනය.' : 'Could not connect to server. Please check IP address.'
      );
      
      useFallbackPrediction();
    } finally {
      setLoading(false);
    }
  };
  
  const useFallbackPrediction = () => {
    const ageNum = parseFloat(paddyAge);
    
    let baseProbability = 0.3;
    
    if (ageNum <= 30) baseProbability += 0.3; 
    else if (ageNum <= 60) baseProbability += 0.2; 
    else if (ageNum <= 90) baseProbability += 0.15; 
    else baseProbability += 0.1; 
    
    if (['Anuradhapura', 'Polonnaruwa', 'Hambantota'].includes(district)) {
      baseProbability += 0.2;
    } else if (['Kandy', 'Badulla', 'Nuwara Eliya'].includes(district)) {
      baseProbability += 0.1;
    } else {
      baseProbability += 0.15;
    }
    
    if (paddyType.includes('BG94') || paddyType.includes('BG95')) {
      baseProbability -= 0.1;
    }
    
    baseProbability += Math.random() * 0.2 - 0.1;
    baseProbability = Math.max(0.1, Math.min(0.95, baseProbability));
    
    let riskLevel = 'Low';
    let severity = 'Low';
    let incidence = 0;
    
    if (baseProbability > 0.75) {
      riskLevel = 'Very High';
      severity = 'High';
      incidence = 45 + Math.random() * 20;
    } else if (baseProbability > 0.6) {
      riskLevel = 'High';
      severity = 'Moderate';
      incidence = 30 + Math.random() * 15;
    } else if (baseProbability > 0.45) {
      riskLevel = 'Moderate';
      severity = 'Moderate';
      incidence = 15 + Math.random() * 15;
    } else if (baseProbability > 0.25) {
      riskLevel = 'Low';
      severity = 'Low';
      incidence = 5 + Math.random() * 10;
    } else {
      riskLevel = 'Very Low';
      severity = 'Low';
      incidence = 1 + Math.random() * 4;
    }
    
    const riskScoreMap = {
      'Very Low': 10, 'Low': 30, 'Moderate': 50, 'High': 70, 'Very High': 90
    };
    let riskScore = riskScoreMap[riskLevel] + Math.floor(Math.random() * 20) - 10;
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    const confidence = 75 + Math.random() * 20;
    
    const highRiskPests = [
      { en: 'Brown Planthopper (BPH)', si: 'දුඹුරු කූඩු ගැහැනුන් (BPH)' },
      { en: 'Rice Gall Midge', si: 'වී ගැල් මිජ්' },
      { en: 'Stem Borer', si: 'කඳ කටුව' }
    ];
    
    const moderateRiskPests = [
      { en: 'Rice Leaf-folder', si: 'වී කොළ ගඩොල්' },
      { en: 'Sheath Blight', si: 'කොළ පාට වළල්ල' },
      { en: 'Bacterial Leaf Blight', si: 'බැක්ටීරියා කොළ පිලිස්සුම' }
    ];
    
    const lowRiskPests = [
      { en: 'Paddy Bug', si: 'වී කූඹියා' },
      { en: 'Rice Hispa', si: 'වී හිස්පා' },
      { en: 'Rice Leafhopper', si: 'වී කොළ ගැහැනුන්' }
    ];
    
    let availablePests;
    if (riskLevel === 'Very High' || riskLevel === 'High') {
      availablePests = highRiskPests;
    } else if (riskLevel === 'Moderate') {
      availablePests = moderateRiskPests;
    } else {
      availablePests = lowRiskPests;
    }
    
    const pestIndex = Math.floor(Math.random() * availablePests.length);
    const selectedPest = availablePests[pestIndex];
    
    const allPests = [...highRiskPests, ...moderateRiskPests, ...lowRiskPests];
    const secondaryPests = allPests.filter(p => p !== selectedPest);
    const secondaryPest1 = secondaryPests[Math.floor(Math.random() * secondaryPests.length)];
    const secondaryPest2 = secondaryPests[Math.floor(Math.random() * secondaryPests.length)];
    
    const mockPrediction = {
      status: 'success',
      prediction: {
        predicted_pest: language === 'si' ? selectedPest.si : selectedPest.en,
        severity: severity,
        incidence_percent: parseFloat(incidence.toFixed(1)),
        risk_level: riskLevel,
        risk_score: riskScore,
        confidence: parseFloat(confidence.toFixed(1)),
        top_pests: [
          {pest: language === 'si' ? selectedPest.si : selectedPest.en, probability: 40 + Math.random() * 40, severity: severity, risk_factor: 'Primary'},
          {pest: language === 'si' ? secondaryPest1.si : secondaryPest1.en, probability: 15 + Math.random() * 25, severity: riskLevel === 'Very High' ? 'High' : 'Moderate', risk_factor: 'Secondary'},
          {pest: language === 'si' ? secondaryPest2.si : secondaryPest2.en, probability: 5 + Math.random() * 20, severity: 'Low', risk_factor: 'Secondary'}
        ],
        weather_impact: [language === 'si' ? 'සාමාන්‍ය කාලගුණ තත්වයන්' : 'Normal weather conditions']
      },
      fertilizer_recommendation: {
        recommendation: language === 'si' ? 'බුප්‍රොෆෙසින් 25 SC @ 600 ml/ha යොදන්න. නයිට්‍රජන් පොහොර 30% කින් අඩු කරන්න.' : 'Apply Buprofezin 25 SC @ 600 ml/ha. Reduce nitrogen fertilizer by 30%.',
        immediate_action: language === 'si' ? 'කෙත නිතිපතා නිරීක්ෂණය කරන්න සහ වැලැක්වීමේ පියවර ගන්න.' : 'Monitor field regularly and apply preventive measures.',
        preventive: language === 'si' ? 'කෙතේ සනීපාරක්ෂාව සහ නිසි ජල කළමනාකරණය පවත්වා ගන්න.' : 'Maintain field hygiene and proper water management.',
        organic_option: language === 'si' ? 'විකල්පයක් ලෙස නීම් පදනම් කරගත් නිෂ්පාදිත' : 'Consider neem-based products as alternative',
        application_timing: language === 'si' ? 'නිතිපතා කාලසටහන අනුව යොදන්න' : 'Apply as per regular schedule',
        weather_advice: [language === 'si' ? 'සාමාන්‍ය කාලසටහන අනුව යොදන්න' : 'Apply as per regular schedule']
      },
      current_weather: weatherData || {
        temp: 29.5,
        rain: 7.2,
        humidity: 78,
        description: language === 'si' ? 'අර්ධ වශයෙන් වලාකුළු' : 'Partly cloudy',
        pressure: 1013,
        wind_speed: 2.5,
        wind_deg: 180,
        clouds: 40
      },
      season: language === 'si' ? (new Date().getMonth() >= 4 && new Date().getMonth() <= 9 ? 'යල' : 'මහ') : 
               (new Date().getMonth() >= 4 && new Date().getMonth() <= 9 ? 'Yala' : 'Maha'),
      language: language,
      prediction_source: 'Rule-Based Fallback'
    };
    
    setPrediction(mockPrediction);
    setShowForm(false);
    
    if (riskLevel === 'Moderate' || riskLevel === 'High' || riskLevel === 'Very High') {
      const message = language === 'si'
        ? `${district} හි ${incidence.toFixed(1)}% පළිබෝධ අවදානමක් හඳුනාගෙන ඇත.\n\nපළිබෝධය: ${selectedPest.si}`
        : `${riskLevel} pest risk detected in ${district}.\n\nPest: ${selectedPest.en}\nIncidence: ${incidence.toFixed(1)}%`;
      
      showInAppAlert(
        riskLevel === 'High' || riskLevel === 'Very High' ? 'High Risk Alert' : 'Moderate Risk Alert',
        message,
        riskLevel
      );
    }
    
    generateMockForecast(incidence, riskLevel);
  };
  
  const fetchForecast = async () => {
    try {
      console.log('Fetching forecast for:', { district, paddyType, paddyAge });
      
      const response = await fetch(`${API_BASE_URL}/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          district,
          paddy_type: paddyType,
          paddy_age: parseFloat(paddyAge),
          language: language
        }),
      });
      
      const data = await response.json();
      console.log('Forecast response:', data);
      
      if (response.ok && data.status === 'success') {
        setForecast(data.predictions || []);
      } else {
        console.log('Forecast fetch failed:', data.error);
        
        const baseRisk = prediction?.prediction?.incidence_percent || 25;
        const baseRiskLevel = prediction?.prediction?.risk_level || 'Moderate';
        generateMockForecast(baseRisk, baseRiskLevel);
      }
    } catch (error) {
      console.log('Forecast fetch error:', error);
      const baseRisk = prediction?.prediction?.incidence_percent || 25;
      const baseRiskLevel = prediction?.prediction?.risk_level || 'Moderate';
      generateMockForecast(baseRisk, baseRiskLevel);
    }
  };
  
  const generateMockForecast = (baseIncidence, baseRiskLevel) => {
    const mockForecast = [];
    
    const trendDirection = baseRiskLevel === 'High' || baseRiskLevel === 'Very High' 
      ? Math.random() * 0.8 + 0.2  
      : Math.random() * 0.6 - 0.3; 
    
    for (let i = 1; i <= 7; i++) {
      const dayTrend = trendDirection * (i - 1) * 2; 
      const randomVariation = Math.random() * 10 - 5; 
      let dayIncidence = Math.max(1, Math.min(80, baseIncidence + dayTrend + randomVariation));
      
      let riskLevel = 'Low';
      let riskText = 'Low';
      let riskTextSi = 'අඩු';
      
      if (dayIncidence >= 40) {
        riskLevel = 'Very High';
        riskText = 'Very High';
        riskTextSi = 'ඉතා ඉහළ';
      } else if (dayIncidence >= 30) {
        riskLevel = 'High';
        riskText = 'High';
        riskTextSi = 'ඉහළ';
      } else if (dayIncidence >= 20) {
        riskLevel = 'Moderate';
        riskText = 'Moderate';
        riskTextSi = 'මධ්‍යස්ථ';
      } else if (dayIncidence >= 10) {
        riskLevel = 'Low';
        riskText = 'Low';
        riskTextSi = 'අඩු';
      } else {
        riskLevel = 'Very Low';
        riskText = 'Very Low';
        riskTextSi = 'ඉතා අඩු';
      }
      
      const pests = [
        { en: 'Brown Planthopper (BPH)', si: 'දුඹුරු කූඩු  (BPH)' },
        { en: 'Rice Leaf-folder', si: 'වී කොළ ගඩොල්' },
        { en: 'Sheath Blight', si: 'කොළ පාට වළල්ල' },
        { en: 'Rice Gall Midge', si: 'වී ගැල් මිජ්' },
        { en: 'Paddy Bug', si: 'වී කූඹියා' }
      ];
      
      const pestIndex = Math.floor(Math.random() * pests.length);
      const selectedPest = pests[pestIndex];
      
      mockForecast.push({
        day: i,
        risk_level: riskLevel,
        risk_level_display: language === 'si' ? riskTextSi : riskText,
        predicted_pest: language === 'si' ? selectedPest.si : selectedPest.en,
        incidence_percent: parseFloat(dayIncidence.toFixed(1)),
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        weather: {
          temp: 28 + Math.random() * 6 - 3,
          rain: 5 + Math.random() * 10 - 5,
          humidity: 70 + Math.random() * 20 - 10,
          wind_speed: 2 + Math.random() * 3,
          description: language === 'si' ? 'අර්ධ වශයෙන් වලාකුළු' : 'Partly cloudy'
        }
      });
    }
    
    console.log('Generated forecast with risks:', mockForecast.map(f => ({ day: f.day, risk: f.risk_level, incidence: f.incidence_percent })));
    setForecast(mockForecast);
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchInitialData().finally(() => setRefreshing(false));
  };
  
  const clearHistory = () => {
    Alert.alert(
      t('clearHistory'),
      language === 'si' ? 'ඔබට ඇත්තටම ඉතිහාසය මැකීමට අවශ්‍යද?' : 'Are you sure you want to clear history?',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('clearHistory'), 
          style: 'destructive',
          onPress: async () => {
            setHistory([]);
            try {
              await AsyncStorage.removeItem('predictionHistory');
            } catch (error) {
              console.log('Error clearing history:', error);
            }
          }
        }
      ]
    );
  };
  
  const shareResults = () => {
    if (!prediction) return;
    
    const pred = prediction.prediction || {};
    const incidence = pred.incidence_percent || 0;
    const riskLevel = pred.risk_level || 'Low';
    
    const shareText = language === 'si' 
      ? `පළිබෝධ අනාවැකි ප්‍රතිඵල:
දිස්ත්‍රික්කය: ${district}
වී වර්ගය: ${paddyType}
වයස: ${paddyAge} දින
පළිබෝධය: ${pred.predicted_pest}
දරුණු බව: ${pred.severity}
අවදානම: ${riskLevel}
ප්‍රහාර ප්‍රතිශතය: ${incidence}%`
      : `Pest Prediction Results:
District: ${district}
Paddy Variety: ${paddyType}
Age: ${paddyAge} days
Pest: ${pred.predicted_pest}
Severity: ${pred.severity}
Risk Level: ${riskLevel}
Incidence Percentage: ${incidence}%`;
    
    Alert.alert(
      t('shareResults'),
      shareText,
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('share'), onPress: () => {
          console.log('Sharing results:', shareText);
        }}
      ]
    );
  };
  
  // Updated toggleNotifications function
  const toggleNotifications = (value) => {
    setNotificationsEnabled(value);
    savePreference('notificationsEnabled', value);
    
    if (value && onesignalId) {
      fetch(`${API_BASE_URL}/notifications/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'user_' + Date.now(),
          enabled: true,
          onesignal_id: onesignalId
        })
      }).catch(err => console.log('Register error:', err));
      
      Alert.alert(
        language === 'si' ? 'සාර්ථකයි' : 'Success',
        language === 'si' ? 'දැනුම්දීම් සක්‍රීය කරන ලදී' : 'Notifications enabled'
      );
    }
  };

  const renderWeatherSource = () => (
    <View style={styles.weatherSource}>
      <Icon name="satellite" size={14} color="#0ea5e9" />
      <Text style={styles.weatherSourceText}>{weatherSource}</Text>
    </View>
  );
  
  const renderEnhancedWeather = (weather) => {
    if (!weather) return null;
    
    return (
      <View style={styles.enhancedWeather}>
        <View style={styles.enhancedWeatherRow}>
          <View style={styles.weatherMetric}>
            <Icon name="thermometer" size={20} color="#dc2626" />
            <Text style={styles.weatherMetricValue}>{weather.temp || 0}°C</Text>
            <Text style={styles.weatherMetricLabel}>{t('temperature')}</Text>
          </View>
          <View style={styles.weatherMetric}>
            <Icon name="water" size={20} color="#0ea5e9" />
            <Text style={styles.weatherMetricValue}>{weather.humidity || 0}%</Text>
            <Text style={styles.weatherMetricLabel}>{t('humidity')}</Text>
          </View>
          <View style={styles.weatherMetric}>
            <Icon name="weather-rainy" size={20} color="#3b82f6" />
            <Text style={styles.weatherMetricValue}>{weather.rain || 0}mm</Text>
            <Text style={styles.weatherMetricLabel}>{t('rainfall')}</Text>
          </View>
          <View style={styles.weatherMetric}>
            <Icon name="wind" size={20} color="#6b7280" />
            <Text style={styles.weatherMetricValue}>{weather.wind_speed || 0}m/s</Text>
            <Text style={styles.weatherMetricLabel}>{t('windSpeed')}</Text>
          </View>
        </View>
        <Text style={styles.weatherDescription}>
          {weather.description || t('weather')}
        </Text>
      </View>
    );
  };
  
  // Settings Modal with OneSignal integration
  const renderSettingsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSettings}
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Icon name="settings" size={24} color="#166534" />
            <Text style={styles.modalTitle}>{t('settings')}</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
           
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Icon name="language" size={22} color="#4b5563" />
                <Text style={styles.settingText}>{t('language')}</Text>
              </View>
              <TouchableOpacity 
                style={styles.languageToggle}
                onPress={() => {
                  const newLanguage = language === 'en' ? 'si' : 'en';
                  setLanguage(newLanguage);
                  savePreference('language', newLanguage);
                  if (NotificationService.isInitialized()) {
                    NotificationService.updateLanguage(newLanguage);
                  }
                }}
              >
                <Text style={styles.languageToggleText}>
                  {language === 'en' ? 'සිංහල' : 'English'}
                </Text>
                <Icon name="arrow-right" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Icon name="weather-night" size={22} color="#4b5563" />
                <Text style={styles.settingText}>{t('darkMode')}</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={(value) => {
                  setDarkMode(value);
                  savePreference('darkMode', value);
                }}
                trackColor={{ false: '#d1d5db', true: '#166534' }}
                thumbColor={darkMode ? '#fff' : '#fff'}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Icon name="refresh" size={22} color="#4b5563" />
                <Text style={styles.settingText}>{t('autoRefresh')}</Text>
              </View>
              <Switch
                value={autoRefresh}
                onValueChange={(value) => {
                  setAutoRefresh(value);
                  savePreference('autoRefresh', value);
                }}
                trackColor={{ false: '#d1d5db', true: '#166534' }}
                thumbColor={autoRefresh ? '#fff' : '#fff'}
              />
            </View>
            
            {/* Notifications Setting */}
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Icon name="notification" size={22} color="#4b5563" />
                <Text style={styles.settingText}>{t('notifications')}</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#d1d5db', true: '#166534' }}
                thumbColor={notificationsEnabled ? '#fff' : '#fff'}
              />
            </View>
            
            {/* OneSignal Status */}
            {onesignalId ? (
              <View style={styles.onesignalStatus}>
                <Icon name="check-circle" size={16} color="#16a34a" />
                <Text style={styles.onesignalStatusText}>
                  {t('notificationsReady')}
                </Text>
              </View>
            ) : (
              <View style={styles.onesignalStatus}>
                <Icon name="alert-circle" size={16} color="#f97316" />
                <Text style={styles.onesignalStatusText}>
                  {t('notificationsSettingUp')}
                </Text>
              </View>
            )}
            
            {/* Test Notification Button (Development Only) */}
            {__DEV__ && onesignalId && (
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => {
                  NotificationService.sendTestNotification();
                  Alert.alert(
                    language === 'si' ? 'පරීක්ෂණ දැනුම්දීම' : 'Test Notification',
                    language === 'si' ? 'පරීක්ෂණ දැනුම්දීමක් යවන ලදී' : 'Test notification sent',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Icon name="bell-ring" size={20} color="#0369a1" />
                <Text style={styles.testButtonText}>
                  {language === 'si' ? '🔔 පරීක්ෂණ දැනුම්දීමක් යවන්න' : '🔔 Send Test Notification'}
                </Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.dataSourceInfo}>
              <View style={styles.dataSourceHeader}>
                <Icon name="database" size={20} color="#0ea5e9" />
                <Text style={styles.dataSourceTitle}>{t('dataSource')}</Text>
              </View>
              <View style={styles.dataSourceContent}>
                <View style={styles.dataSourceItem}>
                  <Icon name="satellite" size={16} color="#4b5563" />
                  <Text style={styles.dataSourceText}>{t('weatherSource')}</Text>
                </View>
                <View style={styles.dataSourceItem}>
                  <Icon name="server" size={16} color="#4b5563" />
                  <Text style={styles.dataSourceText}>
                    {language === 'si' ? 'සේවාදායකය' : 'Server'}: {API_BASE_URL.replace('http://', '')}
                  </Text>
                </View>
                <View style={styles.dataSourceItem}>
                  <Icon name="bug-report" size={16} color="#4b5563" />
                  <Text style={styles.dataSourceText}>
                    {t('mlEngine')}: {mlEngineStatus}
                  </Text>
                </View>
                <View style={styles.dataSourceItem}>
                  <Icon name="bell" size={16} color="#4b5563" />
                  <Text style={styles.dataSourceText}>
                    Push: {onesignalId ? 'Connected' : 'Connecting...'}
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => {
                setShowSettings(false);
                clearHistory();
              }}
            >
              <View style={styles.settingsButtonContent}>
                <Icon name="history" size={22} color="#4b5563" />
                <Text style={styles.settingsButtonText}>{t('clearHistory')}</Text>
              </View>
              <Icon name="arrow-right" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => {
                Alert.alert(
                  t('about'),
                  `${t('version')}\n\n${t('subtitle')}\n\n${language === 'si' ? 'කෘෂිකර්ම දෙපාර්තමේන්තුව සහයෙන්' : 'Supported by Department of Agriculture'}\n\nPowered by OneSignal Push Notifications\nID: ${onesignalId || 'Not available'}`
                );
              }}
            >
              <View style={styles.settingsButtonContent}>
                <Icon name="information" size={22} color="#4b5563" />
                <Text style={styles.settingsButtonText}>{t('about')}</Text>
              </View>
              <Icon name="arrow-right" size={20} color="#6b7280" />
            </TouchableOpacity>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalButtonSecondary}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  // Forecast Chart
  const renderForecastChart = () => {
    if (forecast.length === 0) {
      return (
        <View style={styles.noPredictionMessage}>
          <Icon name="chart-line" size={50} color="#9ca3af" />
          <Text style={styles.noPredictionText}>
            {language === 'si' ? 'අනාවැකියක් කරන්න මුලින්ම' : 'Make a prediction first to see forecast'}
          </Text>
          <TouchableOpacity
            style={styles.makePredictionButton}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.makePredictionButtonText}>
              {language === 'si' ? 'අනාවැකියක් කරන්න' : 'Make Prediction'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    const chartLabels = forecast.slice(0, 7).map(f => language === 'si' ? `දින ${f.day}` : `Day ${f.day}`);
    
    const chartData = forecast.slice(0, 7).map(f => {
      const incidence = parseFloat(f.incidence_percent) || 0;
      return Math.max(1, Math.min(10, incidence / 5));
    });
    
    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#dc2626'
      }
    };
    
    const chartWidth = Dimensions.get('window').width - 40;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Icon name="chart-areaspline" size={24} color="#374151" />
          <Text style={styles.sectionTitle}>
            {language === 'si' ? 'දින 7 අවදානම් අනාවැකි' : '7-Day Risk Forecast'}
          </Text>
        </View>
        
        {chartData.length > 0 ? (
          <>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#dc2626' }]} />
                <Text style={styles.legendText}>
                  {language === 'si' ? 'ප්‍රහාර මට්ටම (1-10)' : 'Attack Level (1-10 scale)'}
                </Text>
              </View>
            </View>
            
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [{
                  data: chartData,
                  color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
                  strokeWidth: 3
                }]
              }}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              fromZero
              segments={5}
              formatYLabel={(value) => parseFloat(value).toFixed(1)}
            />
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
              {forecast.slice(0, 7).map((day, index) => (
                <View key={index} style={styles.forecastDay}>
                  <Text style={styles.forecastDayLabel}>
                    {language === 'si' ? `දින ${day.day}` : `Day ${day.day}`}
                  </Text>
                  <Text style={styles.forecastDate}>{day.date || 'N/A'}</Text>
                  
                  {day.weather && (
                    <View style={styles.forecastWeather}>
                      <Icon name="thermometer" size={12} color="#dc2626" />
                      <Text style={styles.forecastWeatherText}>{day.weather.temp}°C</Text>
                      <Icon name="water" size={12} color="#0ea5e9" />
                      <Text style={styles.forecastWeatherText}>{day.weather.humidity}%</Text>
                    </View>
                  )}
                  
                  <View style={[styles.forecastRisk, { backgroundColor: getRiskColor(day.risk_level) }]}>
                    <Icon name={getRiskIcon(day.risk_level)} size={14} color="#fff" />
                    <Text style={styles.forecastRiskText}>{day.risk_level_display || day.risk_level}</Text>
                  </View>
                  <Text style={styles.forecastPest}>{day.predicted_pest || (language === 'si' ? 'කිසිවක් නැත' : 'None')}</Text>
                  <View style={styles.forecastIncidenceContainer}>
                    <Icon name={getIncidenceIcon(day.incidence_percent)} size={16} color={getIncidenceColor(day.incidence_percent)} />
                    <Text style={[styles.forecastIncidence, { color: getIncidenceColor(day.incidence_percent) }]}>
                      {day.incidence_percent}%
                    </Text>
                  </View>
                  <Text style={styles.forecastIncidenceLabel}>{t('incidencePercentage')}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        ) : (
          <Text style={styles.noData}>{t('noData')}</Text>
        )}
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowForecast(false)}
        >
          <Icon name="arrow-left" size={22} color="#166534" />
          <Text style={styles.backButtonText}>
            {language === 'si' ? 'ආපසු ප්‍රතිඵල වෙත' : 'Back to Results'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderSimplifiedForm = () => {
    try {
      return (
        <View style={styles.formContainer}>
          <View style={styles.formTitleContainer}>
            <Icon name="bug" size={28} color="#166534" />
            <Text style={styles.formTitle}>{t('title')}</Text>
          </View>
          <Text style={styles.formSubtitle}>{t('subtitle')}</Text>
          
          <View style={styles.mlEngineStatus}>
            <Icon name="server" size={16} color="#0ea5e9" />
            <Text style={styles.mlEngineText}>{t('mlEngine')}: {mlEngineStatus}</Text>
          </View>
          
          {renderWeatherSource()}
          
          {/* District Selection */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Icon name="map-marker" size={20} color="#4b5563" />
              <Text style={styles.inputLabel}>{t('district')}</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={district}
                onValueChange={handleDistrictChange}
                style={styles.picker}
                dropdownIconColor="#4b5563"
              >
                {districts.map((d, index) => (
                  <Picker.Item key={index} label={d} value={d} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Paddy Variety Selection */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Icon name="sprout" size={20} color="#4b5563" />
              <Text style={styles.inputLabel}>{t('paddyType')}</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={paddyType}
                onValueChange={setPaddyType}
                style={styles.picker}
                dropdownIconColor="#4b5563"
              >
                {varieties.map((v, index) => (
                  <Picker.Item key={index} label={v} value={v} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Paddy Age Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Icon name="calendar" size={20} color="#4b5563" />
              <Text style={styles.inputLabel}>{t('paddyAge')}</Text>
            </View>
            <View style={styles.ageInputContainer}>
              <TextInput
                style={styles.ageInput}
                placeholder={language === 'si' ? "දින ඇතුලත් කරන්න (උදා: 45)" : "Enter days (e.g., 45)"}
                placeholderTextColor="#9ca3af"
                value={paddyAge}
                onChangeText={setPaddyAge}
                keyboardType="numeric"
                maxLength={3}
              />
              {paddyAge && (
                <View style={styles.growthStageContainer}>
                  <Icon name={getGrowthStageIcon(paddyAge)} size={18} color="#166534" />
                  <Text style={styles.growthStageDisplay}>
                    {getGrowthStage(parseFloat(paddyAge))}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {weatherData && renderEnhancedWeather(weatherData)}
          
          <View style={styles.seasonalInfo}>
            <Icon name="calendar" size={18} color="#ca8a04" />
            <Text style={styles.seasonalInfoText}>
              {t('currentSeason')}: {getSeasonName()}
            </Text>
          </View>
          
          {/* Age Guide */} 
          <View style={styles.ageGuide}>
            <View style={styles.ageGuideTitleContainer}>
              <Icon name="information" size={20} color="#0ea5e9" />
              <Text style={styles.ageGuideTitle}>{language === 'si' ? 'වයස මගපෙන්වීම' : 'Age Guide'}:</Text>
            </View>
            <View style={styles.ageGuideItems}>
              <View style={styles.ageGuideItem}>
                <Icon name="circle-small" size={16} color="#4b5563" />
                <Text style={styles.ageGuideItemText}>0-25 {language === 'si' ? 'දින' : 'days'}: {language === 'si' ? 'අංකුර' : 'Seedling'}</Text>
              </View>
              <View style={styles.ageGuideItem}>
                <Icon name="circle-small" size={16} color="#4b5563" />
                <Text style={styles.ageGuideItemText}>25-50 {language === 'si' ? 'දින' : 'days'}: {language === 'si' ? 'කොළ වැකීම' : 'Tillering'}</Text>
              </View>
              <View style={styles.ageGuideItem}>
                <Icon name="circle-small" size={16} color="#4b5563" />
                <Text style={styles.ageGuideItemText}>50-70 {language === 'si' ? 'දින' : 'days'}: {language === 'si' ? 'මල් හටගැනීම' : 'Flowering'}</Text>
              </View>
              <View style={styles.ageGuideItem}>
                <Icon name="circle-small" size={16} color="#4b5563" />
                <Text style={styles.ageGuideItemText}>70-90 {language === 'si' ? 'දින' : 'days'}: {language === 'si' ? 'ධාන්‍ය පිරීම' : 'Grain Filling'}</Text>
              </View>
              <View style={styles.ageGuideItem}>
                <Icon name="circle-small" size={16} color="#4b5563" />
                <Text style={styles.ageGuideItemText}>90+ {language === 'si' ? 'දින' : 'days'}: {language === 'si' ? 'පරිණත' : 'Maturity'}</Text>
              </View>
            </View>
          </View>
          
          {/* Predict Button */}
          <TouchableOpacity
            style={[
              styles.predictButton,
              (!district || !paddyType || !paddyAge) && styles.predictButtonDisabled
            ]}
            onPress={handlePredict}
            disabled={loading || !district || !paddyType || !paddyAge}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="bug-check" size={22} color="#fff" />
                <Text style={styles.predictButtonText}>{t('predict')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    } catch (error) {
      console.log('Error rendering form:', error);
      return (
        <View style={styles.errorContainer}>
          <Text>Error loading form</Text>
        </View>
      );
    }
  };
  
  const renderPredictionCard = () => {
    if (!prediction) return null;
    
    const pred = prediction.prediction || {};
    const fert = prediction.fertilizer_recommendation || {};
    const incidenceColor = getIncidenceColor(pred.incidence_percent);
    const incidenceAdvice = getIncidenceAdvice(pred.incidence_percent);
    const riskIcon = getRiskIcon(pred.risk_level);
    const growthStageIcon = getGrowthStageIcon(paddyAge);
    const currentWeather = pred.current_weather || weatherData || prediction.current_weather;
    const riskLevel = pred.risk_level || 'Low';
    const incidencePercent = pred.incidence_percent || 0;
    const riskScore = pred.risk_score || 0;
    
    const actionNeeded = riskLevel === 'High' || riskLevel === 'Very High' 
      ? t('takeAction') 
      : riskLevel === 'Moderate' 
        ? (language === 'si' ? 'සුපරීක්ෂා කරන්න' : 'Monitor Closely')
        : t('monitorOnly');
    
    const actionColor = riskLevel === 'High' || riskLevel === 'Very High' 
      ? '#dc2626' 
      : riskLevel === 'Moderate' 
        ? '#ca8a04'
        : '#16a34a';
    
    return (
      <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>
       
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(riskLevel) }]}>
          <Icon name={riskIcon} size={20} color="#fff" />
          <View style={styles.riskBadgeContent}>
            <Text style={styles.riskText}>{riskLevel} {t('riskLevel')}</Text>
            {riskScore > 0 && (
              <Text style={styles.riskScoreText}>{t('riskScore')}: {riskScore}</Text>
            )}
          </View>
        </View>
        
        {(riskLevel === 'High' || riskLevel === 'Very High' || riskLevel === 'Moderate') && (
          <View style={[styles.farmerAlertPanel, { 
            backgroundColor: riskLevel === 'Very High' ? '#fef2f2' : 
                            riskLevel === 'High' ? '#fef2f2' : 
                            '#fefce8',
            borderColor: riskLevel === 'Very High' ? '#fecaca' : 
                        riskLevel === 'High' ? '#fecaca' : 
                        '#fef08a'
          }]}>
            <Icon name="bell-ring" size={24} color={actionColor} />
            <View style={styles.farmerAlertContent}>
              <Text style={[styles.farmerAlertTitle, { color: actionColor }]}>
                {t('farmerAlert')}
              </Text>
              <Text style={styles.farmerAlertText}>
                {language === 'si' 
                  ? `ප්‍රහාර ප්‍රතිශතය: ${incidencePercent}%\n${actionNeeded}`
                  : `Incidence: ${incidencePercent}%\n${actionNeeded}`
                }
              </Text>
            </View>
          </View>
        )}
        
       
        <View style={styles.weatherSourceSmall}>
          <Icon name="satellite" size={12} color="#0ea5e9" />
          <Text style={styles.weatherSourceTextSmall}>{weatherSource}</Text>
          <Text style={styles.predictionSource}>
            {prediction.prediction_source || 'Prediction Source: ML Model'}
          </Text>
        </View>
        
       
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="sprout" size={22} color="#166534" />
            <Text style={styles.infoLabel}>{t('paddyType')}</Text>
            <Text style={styles.infoValue}>{paddyType}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={22} color="#166534" />
            <Text style={styles.infoLabel}>{t('paddyAge')}</Text>
            <Text style={styles.infoValue}>{paddyAge} {language === 'si' ? 'දින' : 'days'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="map-marker" size={22} color="#166534" />
            <Text style={styles.infoLabel}>{t('district')}</Text>
            <Text style={styles.infoValue}>{district}</Text>
          </View>
        </View>
        
        {currentWeather && renderEnhancedWeather(currentWeather)}
        
        <View style={styles.riskDetailsPanel}>
          <View style={styles.riskDetailsHeader}>
            <Icon name="shield-alert" size={20} color="#374151" />
            <Text style={styles.riskDetailsTitle}>{language === 'si' ? 'අවදානම් විස්තර' : 'Risk Details'}</Text>
          </View>
          <View style={styles.riskDetailsGrid}>
            <View style={styles.riskDetailItem}>
              <Icon name="alert" size={18} color={getRiskColor(pred.severity)} />
              <Text style={styles.riskDetailLabel}>{t('severity')}</Text>
              <Text style={[styles.riskDetailValue, { color: getRiskColor(pred.severity) }]}>
                {pred.severity || 'Low'}
              </Text>
            </View>
            <View style={styles.riskDetailItem}>
              <Icon name="chart-bar" size={18} color={incidenceColor} />
              <Text style={styles.riskDetailLabel}>{t('incidencePercentage')}</Text>
              <Text style={[styles.riskDetailValue, { color: incidenceColor }]}>
                {incidencePercent}%
              </Text>
            </View>
            <View style={styles.riskDetailItem}>
              <Icon name={growthStageIcon} size={18} color="#166534" />
              <Text style={styles.riskDetailLabel}>{t('growthStage')}</Text>
              <Text style={[styles.riskDetailValue, { color: '#166534' }]}>
                {getGrowthStage(parseFloat(paddyAge))}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.pestPrediction}>
          <Text style={styles.pestTitle}>{language === 'si' ? 'අනාවැකි පළිබෝධය' : 'Predicted Pest'}:</Text>
          <View style={styles.pestNameContainer}>
            <Icon name="bug" size={26} color="#dc2626" />
            <Text style={styles.pestName}>{pred.predicted_pest || (language === 'si' ? 'පළිබෝධයක් හඳුනාගත නොමැත' : 'No pest detected')}</Text>
          </View>
          {pred.confidence && (
            <View style={styles.confidenceContainer}>
              <Icon name="chart-line" size={16} color="#6b7280" />
              <Text style={styles.confidenceText}>
                {t('confidence')}: {pred.confidence.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
        
        <View style={[styles.incidenceAdviceBox, { borderLeftColor: incidenceColor }]}>
          <Icon name="information" size={20} color="#374151" />
          <Text style={styles.incidenceAdviceTitle}>{incidenceAdvice}</Text>
        </View>
        
        {pred.weather_impact && pred.weather_impact.length > 0 && (
          <View style={styles.weatherImpactBox}>
            <View style={styles.weatherImpactHeader}>
              <Icon name="cloud" size={20} color="#0ea5e9" />
              <Text style={styles.weatherImpactTitle}>{language === 'si' ? 'කාලගුණ බලපෑම' : 'Weather Impact'}</Text>
            </View>
            {pred.weather_impact.map((impact, index) => (
              <View key={index} style={styles.weatherImpactItem}>
                <Icon name="circle-small" size={12} color="#0ea5e9" />
                <Text style={styles.weatherImpactText}>{impact}</Text>
              </View>
            ))}
          </View>
        )}
        
        {fert.immediate_action && (
          <View style={styles.recommendationBox}>
            <View style={styles.recommendationHeader}>
              <Icon name="alert-circle" size={24} color="#dc2626" />
              <Text style={styles.recommendationTitle}> {t('immediateAction')}</Text>
            </View>
            <Text style={styles.recommendationText}>
              {fert.immediate_action}
            </Text>
          </View>
        )}
        
        {pred.top_pests?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="format-list-bulleted" size={20} color="#374151" />
              <Text style={styles.sectionTitle}>{t('topPests')}</Text>
            </View>
            {pred.top_pests.slice(0, 3).map((pest, index) => (
              <View key={index} style={styles.pestItem}>
                <View style={styles.pestItemHeader}>
                  <View style={styles.pestItemNameContainer}>
                    <Icon name="bug" size={18} color="#dc2626" />
                    <Text style={styles.pestItemName}>{pest.pest}</Text>
                  </View>
                  <Text style={styles.pestItemProbability}>{pest.probability.toFixed(1)}%</Text>
                </View>
                <View style={styles.probabilityBar}>
                  <View 
                    style={[
                      styles.probabilityFill, 
                      { 
                        width: `${Math.min(pest.probability, 100)}%`,
                        backgroundColor: getRiskColor(pest.severity)
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}
        
        {fert.recommendation && (
          <View style={styles.fertilizerBox}>
            <View style={styles.fertilizerHeader}>
              <Icon name="lightbulb" size={24} color="#0ea5e9" />
              <Text style={styles.fertilizerTitle}> {t('fertilizer')}</Text>
            </View>
            <Text style={styles.fertilizerText}>{fert.recommendation}</Text>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowForm(true)}
          >
            <Icon name="refresh" size={22} color="#166534" />
            <Text style={styles.actionButtonText}>
              {language === 'si' ? 'නව අනාවැකියක්' : 'New Prediction'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => {
              if (forecast.length === 0) {
                Alert.alert(
                  language === 'si' ? 'මුලදී අනාවැකියක් කරන්න' : 'Make a prediction first',
                  language === 'si' ? 'මුලින්ම අනාවැකියක් කරන්න අනාවැකි පෙන්වීමට' : 'Please make a prediction first to see forecast'
                );
              } else {
                setShowForecast(true);
              }
            }}
          >
            <Icon name="chart-line" size={22} color="#166534" />
            <Text style={styles.actionButtonText}>
              {language === 'si' ? 'අනාවැකි' : 'Forecast'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.additionalActions}>
          <TouchableOpacity 
            style={styles.additionalAction}
            onPress={shareResults}
          >
            <Icon name="share" size={20} color="#6b7280" />
            <Text style={styles.additionalActionText}>{t('shareResults')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.additionalAction}
            onPress={() => {
              Alert.alert(
                language === 'si' ? 'පළිබෝධ පුස්තකාලය' : 'Pest Library',
                language === 'si' ? 'මෙම අංගය ඉදිරි යාවත්කාලීනයන්හිදී ලබා ගත හැකිය.' : 'This feature will be available in upcoming updates.'
              );
            }}
          >
            <Icon name="book" size={20} color="#6b7280" />
            <Text style={styles.additionalActionText}>{t('pestLibrary')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };
  
  // Main Render
  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      
      <View style={styles.header}>
        <View>
          <View style={styles.titleContainer}>
            <Icon name="bug" size={28} color="#166534" />
            <Text style={styles.title}>{t('title')}</Text>
          </View>
          <View style={styles.subtitleContainer}>
            <Icon name="satellite" size={14} color="#0ea5e9" />
            <Text style={styles.subtitle}>{t('subtitle')}</Text>
            <Text style={styles.mlEngineBadge}>{mlEngineStatus}</Text>
          </View>
        </View>
        <View style={styles.headerControls}>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconButton}>
            <Icon name="settings" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => {
            const newDarkMode = !darkMode;
            setDarkMode(newDarkMode);
            savePreference('darkMode', newDarkMode);
          }} style={styles.iconButton}>
            <Icon name={darkMode ? 'weather-sunny' : 'weather-night'} size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              const newLanguage = language === 'en' ? 'si' : 'en';
              setLanguage(newLanguage);
              savePreference('language', newLanguage);
            }} 
            style={styles.languageButton}
          >
            <Text style={styles.languageButtonText}>
              {language === 'en' ? 'සිංහල' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, showForm && styles.activeTab]}
            onPress={() => {
              setShowForm(true);
              setShowForecast(false);
            }}
          >
            <Icon name="plus-circle" size={22} color={showForm ? '#166534' : '#666'} />
            <Text style={[styles.tabText, showForm && styles.activeTabText]}>
              {t('predict')}
            </Text>
          </TouchableOpacity>
          
          {prediction && (
            <TouchableOpacity
              style={[styles.tab, !showForm && !showForecast && styles.activeTab]}
              onPress={() => {
                setShowForm(false);
                setShowForecast(false);
              }}
            >
              <Icon name="bug-check" size={22} color={!showForm && !showForecast ? '#166534' : '#666'} />
              <Text style={[styles.tabText, !showForm && !showForecast && styles.activeTabText]}>
                {language === 'si' ? 'ප්‍රතිඵල' : 'Results'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.tab, showForecast && styles.activeTab]}
            onPress={() => {
              if (!prediction && forecast.length === 0) {
                Alert.alert(
                  language === 'si' ? 'මුලදී අනාවැකියක් කරන්න' : 'Make a prediction first',
                  language === 'si' ? 'මුලින්ම අනාවැකියක් කරන්න අනාවැකි පෙන්වීමට' : 'Please make a prediction first to see forecast'
                );
              } else {
                setShowForm(false);
                setShowForecast(true);
              }
            }}
          >
            <Icon name="chart-line" size={22} color={showForecast ? '#166534' : '#666'} />
            <Text style={[styles.tabText, showForecast && styles.activeTabText]}>
              {t('forecast')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {autoRefresh && !showForm && (
          <View style={styles.autoRefreshIndicator}>
            <Icon name="refresh" size={14} color="#0ea5e9" />
            <Text style={styles.autoRefreshText}>
              {language === 'si' ? 'ස්වයංක්‍රීයයෙන් නැවුම් කරයි' : 'Auto-refresh enabled'}
            </Text>
          </View>
        )}
        
        <View style={styles.seasonalBanner}>
          <Icon name="calendar" size={20} color="#ca8a04" />
          <Text style={styles.seasonalBannerText}>
            {getSeasonName()} • {new Date().toLocaleDateString(language === 'si' ? 'si-LK' : 'en-US')}
          </Text>
        </View>
        
        <View style={styles.contentContainer}>
          {showForm ? renderSimplifiedForm() : 
           showForecast ? renderForecastChart() : 
           prediction ? renderPredictionCard() : renderSimplifiedForm()}
        </View>
        
        {!showForecast && !showForm && history.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Icon name="history" size={20} color="#374151" />
              <Text style={styles.historyTitle}>{t('history')}</Text>
              <TouchableOpacity onPress={clearHistory} style={styles.clearHistoryButton}>
                <Icon name="trash" size={18} color="#dc2626" />
              </TouchableOpacity>
            </View>
            {history.slice(0, 3).map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyVariety}>{item.variety}</Text>
                  <View style={styles.historyTimeContainer}>
                    <Icon name="clock" size={14} color="#6b7280" />
                    <Text style={styles.historyTime}>{item.timestamp}</Text>
                  </View>
                </View>
                <View style={styles.historyDetails}>
                  <View style={styles.historyDetail}>
                    <Icon name="map-marker" size={14} color="#6b7280" />
                    <Text style={styles.historyDistrict}>{item.district}</Text>
                  </View>
                  <View style={styles.historyDetail}>
                    <Icon name="calendar" size={14} color="#6b7280" />
                    <Text style={styles.historyAge}>{item.age} {language === 'si' ? 'දින' : 'days'}</Text>
                  </View>
                </View>
                <View style={[styles.historyRisk, { backgroundColor: getRiskColor(item.risk) }]}>
                  <Icon name={getRiskIcon(item.risk)} size={14} color="#fff" />
                  <Text style={styles.historyRiskText}>{item.risk}</Text>
                </View>
                <View style={styles.historyFooter}>
                  <View style={styles.historyPestContainer}>
                    <Icon name="bug" size={16} color="#dc2626" />
                    <Text style={styles.historyPest}>{item.pest}</Text>
                  </View>
                  <View style={styles.historyIncidenceContainer}>
                    <Icon name={getIncidenceIcon(item.incidence_percent)} size={16} color={getIncidenceColor(item.incidence_percent)} />
                    <Text style={[styles.historyIncidence, { color: getIncidenceColor(item.incidence_percent) }]}>
                      {item.incidence_percent}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Icon name="satellite" size={22} color="#0ea5e9" />
            <Text style={styles.footerText}>
              {t('realTimeData')}
            </Text>
          </View>
          <View style={styles.footerDynamicInfo}>
            <Icon name="shield" size={14} color="#ca8a04" />
            <Text style={styles.footerDynamicText}>
              {t('dynamicRisk')}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {renderSettingsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  containerDark: {
    backgroundColor: '#1f2937',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 2,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  mlEngineBadge: {
    fontSize: 11,
    color: '#0ea5e9',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 6,
  },
  languageButton: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#166534',
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonText: {
    fontWeight: 'bold',
    color: '#166534',
    fontSize: 14,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 10,
  },
  activeTab: {
    backgroundColor: '#dcfce7',
  },
  tabText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#166534',
    fontWeight: '600',
  },
  autoRefreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  autoRefreshText: {
    fontSize: 12,
    color: '#0ea5e9',
  },
  seasonalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#fefce8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  seasonalBannerText: {
    fontSize: 14,
    color: '#ca8a04',
    fontWeight: '500',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#fee',
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  weatherSource: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  weatherSourceText: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  weatherSourceSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  weatherSourceTextSmall: {
    fontSize: 10,
    color: '#0ea5e9',
  },
  predictionSource: {
    fontSize: 10,
    color: '#9ca3af',
    marginLeft: 8,
  },
  mlEngineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    padding: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
  },
  mlEngineText: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  enhancedWeather: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  enhancedWeatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weatherMetric: {
    alignItems: 'center',
    flex: 1,
  },
  weatherMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  weatherMetricLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  weatherDescription: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  farmerAlertPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    gap: 12,
  },
  farmerAlertContent: {
    flex: 1,
  },
  farmerAlertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  farmerAlertText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  riskDetailsPanel: {
    backgroundColor: '#f9fafb',
    padding: 18,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  riskDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  riskDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  riskDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  riskDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'center',
  },
  riskDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  weatherImpactBox: {
    backgroundColor: '#f0f9ff',
    padding: 18,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  weatherImpactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  weatherImpactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  weatherImpactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  weatherImpactText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
    lineHeight: 20,
  },
  dataSourceInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dataSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dataSourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  dataSourceContent: {
    gap: 8,
  },
  dataSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dataSourceText: {
    fontSize: 14,
    color: '#4b5563',
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
    marginTop: 2,
  },
  formSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  picker: {
    height: 52,
    color: '#374151',
  },
  ageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ageInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    color: '#374151',
  },
  growthStageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 110,
    justifyContent: 'center',
  },
  growthStageDisplay: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  seasonalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fefce8',
    borderRadius: 8,
  },
  seasonalInfoText: {
    fontSize: 14,
    color: '#ca8a04',
    fontWeight: '500',
  },
  ageGuide: {
    backgroundColor: '#f0f9ff',
    padding: 18,
    borderRadius: 8,
    marginBottom: 24,
  },
  ageGuideTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ageGuideTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  ageGuideItems: {
    gap: 10,
  },
  ageGuideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ageGuideItemText: {
    fontSize: 13,
    color: '#4b5563',
  },
  predictButton: {
    backgroundColor: '#166534',
    borderRadius: 8,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  predictButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: 'transparent',
  },
  predictButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 16,
    gap: 10,
  },
  riskBadgeContent: {
    flexDirection: 'column',
  },
  riskText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  riskScoreText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
  },
  pestPrediction: {
    alignItems: 'center',
    marginBottom: 28,
    padding: 18,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  pestTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 10,
  },
  pestNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pestName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceText: {
    fontSize: 13,
    color: '#6b7280',
  },
  incidenceAdviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 18,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    gap: 12,
  },
  incidenceAdviceTitle: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  recommendationBox: {
    backgroundColor: '#fef2f2',
    padding: 18,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  recommendationText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  fertilizerBox: {
    backgroundColor: '#f0f9ff',
    padding: 18,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  fertilizerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  fertilizerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  fertilizerText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  clearHistoryButton: {
    padding: 6,
  },
  pestItem: {
    marginBottom: 14,
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  pestItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pestItemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pestItemName: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  pestItemProbability: {
    fontSize: 15,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  probabilityBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  probabilityFill: {
    height: '100%',
    borderRadius: 5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButton: {
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
  },
  actionButtonText: {
    color: '#166534',
    fontSize: 15,
    fontWeight: '600',
  },
  additionalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  additionalAction: {
    alignItems: 'center',
    gap: 6,
  },
  additionalActionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 10,
  },
  forecastScroll: {
    marginTop: 18,
  },
  forecastDay: {
    alignItems: 'center',
    padding: 14,
    marginRight: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    minWidth: 110,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  forecastDayLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#374151',
  },
  forecastDate: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
  },
  forecastWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  forecastWeatherText: {
    fontSize: 12,
    color: '#dc2626',
  },
  forecastRisk: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
    gap: 6,
  },
  forecastRiskText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  forecastPest: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
    color: '#374151',
  },
  forecastIncidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  forecastIncidence: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  forecastIncidenceLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 10,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  backButtonText: {
    color: '#166534',
    fontSize: 17,
    fontWeight: '600',
  },
  noPredictionMessage: {
    alignItems: 'center',
    padding: 50,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noPredictionText: {
    fontSize: 17,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 20,
  },
  makePredictionButton: {
    backgroundColor: '#166534',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  makePredictionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  historySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  historyVariety: {
    fontWeight: '600',
    fontSize: 16,
    color: '#374151',
  },
  historyTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  historyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDistrict: {
    fontSize: 15,
    color: '#4b5563',
  },
  historyAge: {
    fontSize: 15,
    color: '#4b5563',
  },
  historyRisk: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  historyRiskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyPestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyPest: {
    fontSize: 15,
    color: '#dc2626',
    fontWeight: '600',
  },
  historyIncidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyIncidence: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  noHistoryContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noData: {
    textAlign: 'center',
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 16,
    fontSize: 15,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 15,
    color: '#6b7280',
  },
  footerDynamicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDynamicText: {
    fontSize: 12,
    color: '#ca8a04',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
    marginLeft: 10,
  },
  modalContent: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalButtonTextSecondary: {
    color: '#374151',
    fontWeight: 'bold',
    fontSize: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageToggleText: {
    fontSize: 16,
    color: '#166534',
    fontWeight: '500',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // New styles for OneSignal
  onesignalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    gap: 8,
  },
  onesignalStatusText: {
    fontSize: 14,
    color: '#166534',
    flex: 1,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
    padding: 14,
    borderRadius: 8,
    marginVertical: 8,
    gap: 8,
  },
  testButtonText: {
    color: '#0369a1',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default PestForecastDashboard;