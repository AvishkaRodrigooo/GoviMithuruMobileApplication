import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Get the correct IP for your development machine
// For Android emulator, use 10.0.2.2
// For iOS simulator, use localhost
// For physical device, use your computer's local IP

const getBaseUrl = () => {
  // For physical device with computer's IP
  return 'http://192.168.1.105:5005';
  
  // Uncomment for Android emulator:
  // return 'http://10.0.2.2:5005';
  
  // Uncomment for iOS simulator:
  // return 'http://localhost:5005';
};

const BASE_URL = getBaseUrl();

console.log('📡 API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // Increased timeout to 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`🚀 Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
    });
    return Promise.reject(error);
  }
);

// ==================== PEST FORECAST API ====================

export const pestForecastApi = {
  // Get forecast based on user input
  getForecast: async (data) => {
    try {
      const response = await api.post('/api/pest/forecast', data);
      return response.data;
    } catch (error) {
      console.error('Forecast API error:', error);
      throw error;
    }
  },

  // Get forecast history
  // getHistory: async (userId, limit = 10) => {
  //   try {
  //     const response = await api.get(`/api/pest/forecast/history?user_id=${userId}&limit=${limit}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error('History API error:', error);
  //     throw error;
  //   }
  // },

  // Toggle notifications
  toggleNotifications: async (userId, enabled, onesignalId) => {
    try {
      const response = await api.post('/api/pest/notifications/toggle', {
        user_id: userId,
        enabled,
        onesignal_id: onesignalId,
      });
      return response.data;
    } catch (error) {
      console.error('Notification toggle error:', error);
      throw error;
    }
  },

  // Get notification status
  getNotificationStatus: async (userId) => {
    try {
      const response = await api.get(`/api/pest/notifications/status?user_id=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Notification status error:', error);
      throw error;
    }
  },
};

// ==================== PEST DETECTION API ====================

export const pestDetectionApi = {
  // Test connection first
  testConnection: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/pest-detection/health`, {
        timeout: 5000,
      });
      console.log('✅ Server connection test successful:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Server connection test failed:', error.message);
      return false;
    }
  },

  // Detect pest from image
  detectPest: async (formData) => {
    try {
      // First test the connection
      const isConnected = await pestDetectionApi.testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }

      const url = `${BASE_URL}/api/pest-detection/detect`;
      console.log('📡 Sending detection request to:', url);
      
      // Log FormData contents for debugging
      console.log('📦 FormData contents:');
      for (let pair of formData._parts) {
        if (pair[0] === 'image') {
          console.log('  image:', {
            name: pair[1].name,
            type: pair[1].type,
            uri: pair[1].uri
          });
        } else {
          console.log(`  ${pair[0]}:`, pair[1]);
        }
      }
      
      const response = await axios.post(url, formData, {
        timeout: 120000, // 120 seconds timeout for detection
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });
      
      console.log('✅ Detection response received with status:', response.status);
      return response.data;
    } catch (error) {
      console.error('❌ Detection API error:');
      
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Server responded with status:', error.response.status);
        console.error('Response data:', error.response.data);
        throw new Error(error.response.data?.error || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response from server. Request details:', error.request._response);
        
        // More helpful error message
        let errorMsg = 'Cannot connect to server. ';
        if (Platform.OS === 'android') {
          errorMsg += 'For Android emulator, use 10.0.2.2. For physical device, ensure:\n';
          errorMsg += '• Phone and computer are on the same WiFi network\n';
          errorMsg += '• Firewall is not blocking port 5005\n';
          errorMsg += '• Server is running on 0.0.0.0 (not localhost)';
        } else {
          errorMsg += 'Check if server is running and reachable.';
        }
        throw new Error(errorMsg);
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
        throw error;
      }
    }
  },

  // Save detection result
  saveDetection: async (data) => {
    try {
      const url = `${BASE_URL}/api/pest-detection/save-detection`;
      console.log('📡 Saving detection to:', url);
      
      const response = await axios.post(url, data, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log('✅ Detection saved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Save detection error:', error);
      throw error;
    }
  },

  // Get detection history
  getHistory: async (userId, limit = 20) => {
    try {
      const url = `${BASE_URL}/api/pest-detection/history?user_id=${userId}&limit=${limit}`;
      console.log('📡 Fetching detection history from:', url);
      
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('✅ Detection history fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Detection history error:', error);
      throw error;
    }
  },
};

// ==================== PEST LIBRARY API ====================

export const pestLibraryApi = {
  // Get all pests
  getAllPests: async (lang = 'en') => {
    try {
      const response = await api.get(`/api/pest/library?lang=${lang}`);
      return response.data;
    } catch (error) {
      console.error('Library API error:', error);
      throw error;
    }
  },

  // Get pest info
  getPestInfo: async (pestName, lang = 'en') => {
    try {
      const response = await api.get(`/api/pest/library/${encodeURIComponent(pestName)}?lang=${lang}`);
      return response.data;
    } catch (error) {
      console.error('Pest info error:', error);
      throw error;
    }
  },

  // Search pests
  searchPests: async (query, lang = 'en') => {
    try {
      const response = await api.get(`/api/pest/library/search?q=${encodeURIComponent(query)}&lang=${lang}`);
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  },

  // Get prevention tips
  getPreventionTips: async (pest = null) => {
    try {
      const url = pest 
        ? `/api/pest/library/prevention-tips?pest=${encodeURIComponent(pest)}`
        : '/api/pest/library/prevention-tips';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Prevention tips error:', error);
      throw error;
    }
  },
};

// ==================== WEATHER API ====================

export const weatherApi = {
  // Get current weather
  getCurrentWeather: async (lat, lon, city = null) => {
    try {
      let url = '/api/pest/weather/current';
      if (city) {
        url += `?city=${encodeURIComponent(city)}`;
      } else if (lat && lon) {
        url += `?lat=${lat}&lon=${lon}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  },

  // Get weather forecast
  getForecast: async (lat, lon, days = 7) => {
    try {
      const response = await api.get(`/api/pest/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Forecast API error:', error);
      throw error;
    }
  },
};

// ==================== HEATMAP API ====================

export const heatmapApi = {
  // Get heatmap data
  getHeatmapData: async (pest = null) => {
    try {
      const url = pest 
        ? `/api/pest/heatmap?pest=${encodeURIComponent(pest)}`
        : '/api/pest/heatmap';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Heatmap API error:', error);
      throw error;
    }
  },
};

// ==================== STATISTICS API ====================

export const statisticsApi = {
  // Get dashboard statistics
  getStatistics: async (district = null, days = 30) => {
    try {
      const url = district
        ? `/api/pest/statistics?district=${encodeURIComponent(district)}&days=${days}`
        : `/api/pest/statistics?days=${days}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Statistics API error:', error);
      throw error;
    }
  },
};

// ==================== DISTRICT & VARIETY API ====================

export const metadataApi = {
  // Get districts
  getDistricts: async () => {
    try {
      const response = await api.get('/api/pest/districts');
      return response.data;
    } catch (error) {
      console.error('Districts API error:', error);
      throw error;
    }
  },

  // Get varieties
  getVarieties: async () => {
    try {
      const response = await api.get('/api/pest/varieties');
      return response.data;
    } catch (error) {
      console.error('Varieties API error:', error);
      throw error;
    }
  },

  // Get model status
  getModelStatus: async () => {
    try {
      const response = await api.get('/api/pest/model/status');
      return response.data;
    } catch (error) {
      console.error('Model status API error:', error);
      throw error;
    }
  },

  // Get weather for district
  getWeather: async (district) => {
    try {
      const response = await api.get(`/api/pest/weather/${encodeURIComponent(district)}`);
      return response.data;
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  },
};

export default api;