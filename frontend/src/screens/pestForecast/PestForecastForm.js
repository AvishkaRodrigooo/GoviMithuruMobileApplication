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
  Modal,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { pestForecastApi, weatherApi } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PestRiskCard from '../../components/PestRiskCard';

export default function PestForecastForm({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Simplified form fields - only what you need
  const [formData, setFormData] = useState({
    district: 'Anuradhapura',
    paddy_variety: 'BG 358',
    age_days: '30',
    // Default values for other fields (backend expects them)
    soil_ph: '6.5',
    soil_moisture: '70',
    organic_matter: '2.5',
    temperature: '28',
    humidity: '75',
    rainfall: '50',
    soil_type: 'Reddish Brown Earth',
    location: null,
  });

  // Dropdown options
  const districts = [
    'Anuradhapura', 'Kurunegala', 'Polonnaruwa', 'Hambantota', 
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Badulla', 'Matale',
    'Nuwara Eliya', 'Ratnapura', 'Kegalle', 'Gampaha', 'Kalutara',
    'Puttalam', 'Trincomalee', 'Batticaloa', 'Ampara', 'Monaragala'
  ];

  const paddyVarieties = [
    'BG 358', 'BG 360', 'BG 366', 'BG 94-1', 'BG 300', 'BG 304',
    'BG 310', 'BG 352', 'AT 306', 'AT 362', 'AT 401', 'AT 405',
    'BW 267-3', 'BW 272-6', 'BW 274-5', 'BW 351', 'BW 361', 'BW 362'
  ];

  // Get current location
  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setFormData(prev => ({
        ...prev,
        location: { lat: latitude, lon: longitude }
      }));

      // Get weather for location
      const weatherRes = await weatherApi.getCurrentWeather(latitude, longitude);
      if (weatherRes.success) {
        setFormData(prev => ({
          ...prev,
          temperature: weatherRes.data.temp.toString(),
          humidity: weatherRes.data.humidity.toString(),
        }));
      }

      // Get district from coordinates
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const district = geocode[0].city || geocode[0].region || 'Anuradhapura';
        setFormData(prev => ({ ...prev, district }));
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLoadingLocation(false);
    }
  };

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.district) {
      Alert.alert('Error', 'Please select district');
      return false;
    }
    if (!formData.paddy_variety) {
      Alert.alert('Error', 'Please select paddy variety');
      return false;
    }
    if (!formData.age_days || parseInt(formData.age_days) < 1) {
      Alert.alert('Error', 'Please enter valid age days');
      return false;
    }
    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      const payload = {
        district: formData.district,
        paddy_variety: formData.paddy_variety,
        age_days: parseInt(formData.age_days),
        // Add defaults for required fields
        soil_ph: 6.5,
        soil_moisture: 70,
        organic_matter: 2.5,
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
        rainfall: 50,
        soil_type: 'Reddish Brown Earth',
        user_id: userId || 'anonymous',
        start_date: new Date().toISOString().split('T')[0],
      };

      if (formData.location) {
        payload.location = formData.location;
      }

      console.log('Sending payload:', payload); // Debug log

      const response = await pestForecastApi.getForecast(payload);
      
      if (response.success) {
        setForecastResult(response.data);
        setShowResult(true);
      } else {
        Alert.alert('Error', response.error || 'Failed to get forecast');
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Failed to connect to server. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowResult(false);
    setForecastResult(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pest Forecast</Text>
        <TouchableOpacity onPress={getCurrentLocation} disabled={loadingLocation}>
          <MaterialCommunityIcons 
            name="map-marker" 
            size={24} 
            color={loadingLocation ? '#9ca3af' : '#16a34a'} 
          />
        </TouchableOpacity>
      </View>

      {showResult && forecastResult ? (
        // Results View
        <ScrollView style={styles.content}>
          <View style={styles.resultHeader}>
            <MaterialCommunityIcons name="check-circle" size={60} color="#16a34a" />
            <Text style={styles.resultTitle}>Forecast Complete!</Text>
          </View>

          <PestRiskCard forecast={forecastResult} />

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.newButton} onPress={resetForm}>
              <Text style={styles.newButtonText}>New Forecast</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dashboardButton}
              onPress={() => navigation.navigate('PestForecastDashboard')}
            >
              <Text style={styles.dashboardButtonText}>Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        // Simplified Form - Only 3 fields
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>District <Text style={styles.required}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.district}
                  onValueChange={(value) => updateForm('district', value)}
                  style={styles.picker}
                >
                  {districts.map((district) => (
                    <Picker.Item key={district} label={district} value={district} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Temperature (°C)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.temperature}
                  onChangeText={(value) => updateForm('temperature', value)}
                  keyboardType="numeric"
                  placeholder="28"
                />
              </View>
              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Humidity (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.humidity}
                  onChangeText={(value) => updateForm('humidity', value)}
                  keyboardType="numeric"
                  placeholder="75"
                />
              </View>
            </View>
          </View>

          {/* Only Paddy Variety and Age */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crop Information</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Paddy Variety <Text style={styles.required}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.paddy_variety}
                  onValueChange={(value) => updateForm('paddy_variety', value)}
                  style={styles.picker}
                >
                  {paddyVarieties.map((variety) => (
                    <Picker.Item key={variety} label={variety} value={variety} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Crop Age (Days) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formData.age_days}
                onChangeText={(value) => updateForm('age_days', value)}
                keyboardType="numeric"
                placeholder="30"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="weather-cloudy" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Get Pest Forecast</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 6,
  },
  required: {
    color: '#dc2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 45,
  },
  submitButton: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  newButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  newButtonText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  dashboardButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dashboardButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});