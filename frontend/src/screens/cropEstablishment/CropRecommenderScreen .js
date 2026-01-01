import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CropRecommenderScreen = ({ navigation }) => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [locationMethod, setLocationMethod] = useState('gps'); // 'gps' or 'manual'
  const [userLocation, setUserLocation] = useState(null);
  const [formData, setFormData] = useState({
    district: '',
    gnDivision: '',
    village: '',
    soilType: '',
    waterAvailability: '',
    fieldSize: '',
    unit: 'Acres',
    season: 'Yala',
  });

  // Sri Lankan districts for dropdown.
  const districts = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
    'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
    'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
    'Matale', 'Matara', 'Moneragala', 'Mullaitivu', 'Nuwara Eliya',
    'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
  ];

  const soilTypes = [
    'Red Soil', 'Clay Loam', 'Sandy Soil', 'Alluvial Soil',
    'Laterite Soil', 'Peaty Soil', 'Saline Soil', 'Black Soil'
  ];

  const waterAvailabilityOptions = [
    'Excellent (Irrigation + Rainfall)',
    'Good (Reliable Irrigation)',
    'Moderate (Seasonal Irrigation)',
    'Poor (Rain-fed Only)'
  ];

  const seasons = ['Yala', 'Maha'];

  // 1. GET GPS LOCATION
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      // Request permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location services');
        setLocationMethod('manual');
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      // Reverse geocode to get address
      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.length > 0) {
        // Try to extract district from address
        const district = address[0].region || address[0].subregion || '';
        setFormData(prev => ({
          ...prev,
          district: district || 'Colombo', // Default fallback
        }));
        
        Alert.alert(
          'Location Detected',
          `Detected location: ${district || 'Unknown District'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get location. Please enter manually.');
      setLocationMethod('manual');
    } finally {
      setLoading(false);
    }
  };

  // 2. HANDLE FORM INPUT CHANGES
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 3. VALIDATE FORM
  const validateForm = () => {
    if (!formData.district) {
      Alert.alert('Missing Information', 'Please select your district');
      return false;
    }
    if (!formData.soilType) {
      Alert.alert('Missing Information', 'Please select soil type');
      return false;
    }
    if (!formData.waterAvailability) {
      Alert.alert('Missing Information', 'Please select water availability');
      return false;
    }
    if (!formData.fieldSize || isNaN(parseFloat(formData.fieldSize))) {
      Alert.alert('Missing Information', 'Please enter valid field size');
      return false;
    }
    return true;
  };

  // 4. GET RECOMMENDATION (AI/Backend Integration)
  const getRecommendation = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real app, call your AI backend here
      const recommendation = {
        primary: {
          variety: 'BG 358',
          confidence: 95,
          yield: '5.2-5.8 t/ha',
          reason: 'Best suited for clay loam soils with good irrigation',
        },
        alternatives: [
          { variety: 'BG 360', confidence: 88 },
          { variety: 'AT 362', confidence: 82 },
        ],
        plantingWindow: 'Oct 15 - Nov 5, 2024',
        estimatedProfit: 'LKR 185,000/acre',
        fertilizerPlan: 'Urea: 75kg, TSP: 50kg, MOP: 40kg per acre',
      };

      // Navigate to results screen
      navigation.navigate('CropRecommendationResults', {
        formData,
        recommendation,
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to get recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 5. UPLOAD SOIL REPORT
  const uploadSoilReport = () => {
    Alert.alert(
      'Upload Soil Report',
      'This feature will allow you to upload soil test results for more accurate recommendations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Learn More', onPress: () => navigation.navigate('SoilTestInfo') },
      ]
    );
  };

  // Initialize GPS on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌾 Crop Recommendation</Text>
          <Text style={styles.headerSubtitle}>
            Enter your field details to get personalized paddy recommendations
          </Text>
        </View>

        {/* Location Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location Details</Text>
          
          <View style={styles.locationMethodContainer}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                locationMethod === 'gps' && styles.methodButtonActive,
              ]}
              onPress={() => {
                setLocationMethod('gps');
                getCurrentLocation();
              }}
            >
              <MaterialCommunityIcons 
                name="crosshairs-gps" 
                size={20} 
                color={locationMethod === 'gps' ? '#16a34a' : '#6b7280'} 
              />
              <Text style={[
                styles.methodText,
                locationMethod === 'gps' && styles.methodTextActive,
              ]}>
                Use Current Location (GPS)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.methodButton,
                locationMethod === 'manual' && styles.methodButtonActive,
              ]}
              onPress={() => setLocationMethod('manual')}
            >
              <MaterialCommunityIcons 
                name="map-marker" 
                size={20} 
                color={locationMethod === 'manual' ? '#16a34a' : '#6b7280'} 
              />
              <Text style={[
                styles.methodText,
                locationMethod === 'manual' && styles.methodTextActive,
              ]}>
                Manual Input
              </Text>
            </TouchableOpacity>
          </View>

          {locationMethod === 'gps' && userLocation && (
            <View style={styles.gpsInfo}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#16a34a" />
              <Text style={styles.gpsInfoText}>
                Location detected: {formData.district || 'Detecting...'}
              </Text>
            </View>
          )}

          {locationMethod === 'manual' && (
            <View style={styles.manualInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>District</Text>
                <View style={styles.dropdownContainer}>
                  {districts.map((district, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        formData.district === district && styles.dropdownItemSelected,
                      ]}
                      onPress={() => handleInputChange('district', district)}
                    >
                      <Text style={[
                        styles.dropdownText,
                        formData.district === district && styles.dropdownTextSelected,
                      ]}>
                        {district}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GN Division (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Gampaha Division"
                  value={formData.gnDivision}
                  onChangeText={(text) => handleInputChange('gnDivision', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Village (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Mirigama"
                  value={formData.village}
                  onChangeText={(text) => handleInputChange('village', text)}
                />
              </View>
            </View>
          )}
        </View>

        {/* Field Characteristics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌱 Field Characteristics</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Soil Type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.scrollSelector}
            >
              {soilTypes.map((soil, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.selectorButton,
                    formData.soilType === soil && styles.selectorButtonActive,
                  ]}
                  onPress={() => handleInputChange('soilType', soil)}
                >
                  <Text style={[
                    styles.selectorText,
                    formData.soilType === soil && styles.selectorTextActive,
                  ]}>
                    {soil}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Water Availability</Text>
            {waterAvailabilityOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  formData.waterAvailability === option && styles.optionButtonActive,
                ]}
                onPress={() => handleInputChange('waterAvailability', option)}
              >
                <View style={styles.optionRadio}>
                  {formData.waterAvailability === option && (
                    <View style={styles.optionRadioSelected} />
                  )}
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Field Size</Text>
            <View style={styles.fieldSizeContainer}>
              <TextInput
                style={styles.fieldSizeInput}
                placeholder="e.g., 2.5"
                keyboardType="decimal-pad"
                value={formData.fieldSize}
                onChangeText={(text) => handleInputChange('fieldSize', text)}
              />
              <TouchableOpacity
                style={styles.unitButton}
                onPress={() => {
                  const newUnit = formData.unit === 'Acres' ? 'Hectares' : 'Acres';
                  handleInputChange('unit', newUnit);
                }}
              >
                <Text style={styles.unitText}>{formData.unit}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.conversionText}>
              {formData.unit === 'Acres' 
                ? '1 Acre = 0.40 Hectares' 
                : '1 Hectare = 2.47 Acres'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Season</Text>
            <View style={styles.seasonContainer}>
              {seasons.map((season, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.seasonButton,
                    formData.season === season && styles.seasonButtonActive,
                  ]}
                  onPress={() => handleInputChange('season', season)}
                >
                  <Text style={[
                    styles.seasonText,
                    formData.season === season && styles.seasonTextActive,
                  ]}>
                    {season}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Soil Report Option */}
        <TouchableOpacity style={styles.soilReportCard} onPress={uploadSoilReport}>
          <MaterialCommunityIcons name="file-document" size={24} color="#16a34a" />
          <View style={styles.soilReportContent}>
            <Text style={styles.soilReportTitle}>Have a soil test report?</Text>
            <Text style={styles.soilReportDesc}>
              Upload for more accurate recommendations
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.recommendButton,
            loading && styles.recommendButtonDisabled,
          ]}
          onPress={getRecommendation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.recommendButtonText}>Get Recommendation</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {/* Quick Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
          <Text style={styles.tip}>• For best results, get your soil tested</Text>
          <Text style={styles.tip}>• Consider market demand when choosing variety</Text>
          <Text style={styles.tip}>• Match variety to your irrigation capacity</Text>
          <Text style={styles.tip}>• Consider climate resilience of varieties</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#16a34a', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  section: { backgroundColor: 'white', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  locationMethodContainer: { flexDirection: 'row', marginBottom: 12 },
  methodButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 12, 
    borderRadius: 8, 
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
  },
  methodButtonActive: { backgroundColor: '#e8f5e8', borderWidth: 1, borderColor: '#16a34a' },
  methodText: { fontSize: 14, color: '#6b7280', marginLeft: 6 },
  methodTextActive: { color: '#16a34a', fontWeight: '500' },
  gpsInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f0f9f0', 
    padding: 10, 
    borderRadius: 8, 
    marginTop: 8 
  },
  gpsInfoText: { fontSize: 13, color: '#065f46', marginLeft: 6 },
  manualInputs: { marginTop: 8 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  dropdownContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  dropdownItem: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    margin: 4, 
    borderRadius: 20, 
    backgroundColor: '#f3f4f6' 
  },
  dropdownItemSelected: { backgroundColor: '#16a34a' },
  dropdownText: { fontSize: 13, color: '#374151' },
  dropdownTextSelected: { color: 'white' },
  textInput: { 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    backgroundColor: '#f9fafb' 
  },
  scrollSelector: { marginHorizontal: -4 },
  selectorButton: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    marginHorizontal: 4, 
    borderRadius: 20, 
    backgroundColor: '#f3f4f6' 
  },
  selectorButtonActive: { backgroundColor: '#16a34a' },
  selectorText: { fontSize: 13, color: '#374151' },
  selectorTextActive: { color: 'white' },
  optionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6' 
  },
  optionButtonActive: { backgroundColor: '#f0f9f0', borderRadius: 8, paddingHorizontal: 8 },
  optionRadio: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: '#d1d5db', 
    marginRight: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  optionRadioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16a34a' },
  optionText: { fontSize: 14, color: '#374151' },
  fieldSizeContainer: { flexDirection: 'row', alignItems: 'center' },
  fieldSizeInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    marginRight: 12, 
    backgroundColor: '#f9fafb' 
  },
  unitButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#f3f4f6', 
    borderRadius: 8 
  },
  unitText: { fontSize: 14, color: '#374151', marginRight: 4 },
  conversionText: { fontSize: 12, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },
  seasonContainer: { flexDirection: 'row' },
  seasonButton: { 
    flex: 1, 
    padding: 12, 
    marginHorizontal: 4, 
    borderRadius: 8, 
    backgroundColor: '#f3f4f6', 
    alignItems: 'center' 
  },
  seasonButtonActive: { backgroundColor: '#16a34a' },
  seasonText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  seasonTextActive: { color: 'white' },
  soilReportCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f0f9f0', 
    marginHorizontal: 16, 
    marginBottom: 20, 
    padding: 16, 
    borderRadius: 12 
  },
  soilReportContent: { flex: 1, marginHorizontal: 12 },
  soilReportTitle: { fontSize: 15, fontWeight: '600', color: '#065f46', marginBottom: 2 },
  soilReportDesc: { fontSize: 13, color: '#6b7280' },
  recommendButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#16a34a', 
    marginHorizontal: 16, 
    padding: 18, 
    borderRadius: 12, 
    elevation: 4 
  },
  recommendButtonDisabled: { backgroundColor: '#9ca3af' },
  recommendButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white', marginRight: 8 },
  tipsContainer: { 
    backgroundColor: '#fef3c7', 
    marginHorizontal: 16, 
    marginTop: 20, 
    marginBottom: 40, 
    padding: 16, 
    borderRadius: 12 
  },
  tipsTitle: { fontSize: 16, fontWeight: '600', color: '#92400e', marginBottom: 8 },
  tip: { fontSize: 13, color: '#92400e', marginBottom: 4, paddingLeft: 8 },
});

export default CropRecommenderScreen;