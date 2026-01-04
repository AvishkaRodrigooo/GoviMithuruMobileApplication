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
import axios from 'axios';

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

  // Sri Lankan provinces to districts mapping (for better location parsing)
  const provinceToDistricts = {
    'Western Province': ['Colombo', 'Gampaha', 'Kalutara'],
    'Central Province': ['Kandy', 'Matale', 'Nuwara Eliya'],
    'Southern Province': ['Galle', 'Matara', 'Hambantota'],
    'Northern Province': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
    'Eastern Province': ['Ampara', 'Batticaloa', 'Trincomalee'],
    'North Western Province': ['Kurunegala', 'Puttalam'],
    'North Central Province': ['Anuradhapura', 'Polonnaruwa'],
    'Uva Province': ['Badulla', 'Moneragala'],
    'Sabaragamuwa Province': ['Kegalle', 'Ratnapura']
  };

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

    // Get current location with better accuracy
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      timeout: 15000
    });
    
    setUserLocation(location);

    // Try multiple geocoding methods for better accuracy
    const { latitude, longitude } = location.coords;

    console.log('Getting location for:', latitude, longitude);
    
    // Try multiple methods to get village-level data
      
      // METHOD 1: Try with Google Maps Geocoding (most accurate for Sri Lanka)
      // Note: You'll need to enable Geocoding API and get an API key
      try {
        // Uncomment and add your Google Maps API key
        /*
        const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';
        const googleResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&language=en&region=lk`
        );
        
        if (googleResponse.data && googleResponse.data.results && googleResponse.data.results.length > 0) {
          const addressComponents = googleResponse.data.results[0].address_components;
          let district = '';
          let village = '';
          let gnDivision = '';
          
          // Parse address components
          addressComponents.forEach(component => {
            if (component.types.includes('administrative_area_level_2')) {
              district = component.long_name;
            }
            if (component.types.includes('locality') || component.types.includes('sublocality')) {
              village = component.long_name;
            }
            if (component.types.includes('administrative_area_level_3')) {
              gnDivision = component.long_name;
            }
          });
          
          // Validate district
          const foundDistrict = districts.find(d => 
            d.toLowerCase() === district.toLowerCase() ||
            district.toLowerCase().includes(d.toLowerCase())
          );
          
          if (foundDistrict || district) {
            setFormData(prev => ({
              ...prev,
              district: foundDistrict || district,
              village: village || '',
              gnDivision: gnDivision || '',
            }));
            
            Alert.alert(
              'Location Detected',
              `District: ${foundDistrict || district}\nVillage: ${village || 'Not detected'}`,
              [{ text: 'OK' }]
            );
            return;
          }
        }
        */
      } catch (googleError) {
        console.log('Google Maps geocoding not configured:', googleError);
      }
    
    // METHOD 2: Try with LocationIQ (better for Sri Lanka villages)
      try {
        // Sign up at locationiq.com for free API key (2500 requests/day free)
        const LOCATIONIQ_API_KEY = 'pk.xxx'; // Replace with your key
        
        const locationIqResponse = await axios.get(
          `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&accept-language=en&addressdetails=1&zoom=16`
        );
        
        if (locationIqResponse.data && locationIqResponse.data.address) {
          const address = locationIqResponse.data.address;
          
          // Extract location details - LocationIQ has good Sri Lanka coverage
          let district = address.county || address.state_district || '';
          let village = address.village || address.town || address.city || '';
          let gnDivision = address.suburb || address.neighbourhood || '';
          
          console.log('LocationIQ data:', address);
          
          // Clean up district names
          if (district.includes(' District')) {
            district = district.replace(' District', '');
          }
          
          // Match with our districts list
          const foundDistrict = districts.find(d => 
            d.toLowerCase() === district.toLowerCase() ||
            district.toLowerCase().includes(d.toLowerCase()) ||
            d.toLowerCase().includes(district.toLowerCase())
          );
          
          if (foundDistrict || district) {
            setFormData(prev => ({
              ...prev,
              district: foundDistrict || district,
              village: village || '',
              gnDivision: gnDivision || '',
            }));
            
            const message = village ? 
              `Location detected!\nDistrict: ${foundDistrict || district}\nVillage: ${village}` :
              `District detected: ${foundDistrict || district}\n(Village not detected - please enter manually)`;
              
            Alert.alert('Location Detected', message, [{ text: 'OK' }]);
            return;
          }
        }
      } catch (locationIqError) {
        console.log('LocationIQ failed:', locationIqError.message);
      }

      // METHOD 3: Fallback to Expo's geocoding with enhanced parsing
      try {
        let expoAddresses = await Location.reverseGeocodeAsync({
          latitude: latitude,
          longitude: longitude,
        });

        if (expoAddresses.length > 0) {
          const address = expoAddresses[0];
          console.log('Expo address:', address);
          
          let district = address.region || address.subregion || '';
          let village = address.city || address.street || address.name || '';
          
          // Enhanced parsing for Sri Lanka
          // Sometimes Expo returns province names, we need to map them
          if (district.includes('Province')) {
            // Try to get district from province
            const provinceDistricts = provinceToDistricts[district] || [];
            if (provinceDistricts.length > 0) {
              // Use the first district in the province as default
              district = provinceDistricts[0];
            }
          }
          
          // Clean up district names
          if (district.includes(' District')) {
            district = district.replace(' District', '');
          }
          
          // Match with our districts list
          const foundDistrict = districts.find(d => 
            d.toLowerCase() === district.toLowerCase() ||
            district.toLowerCase().includes(d.toLowerCase()) ||
            d.toLowerCase().includes(district.toLowerCase())
          );
          
          setFormData(prev => ({
            ...prev,
            district: foundDistrict || district || '',
            village: village || '',
          }));
          
          const message = village ? 
            `Location detected!\nDistrict: ${foundDistrict || district || 'Unknown'}\nArea: ${village}` :
            `District detected: ${foundDistrict || district || 'Unknown'}`;
            
          Alert.alert('Location Detected', message, [{ text: 'OK' }]);
          return;
        }
      } catch (expoError) {
        console.log('Expo geocoding failed:', expoError);
      }

      // METHOD 4: Try with OpenCage Data (free tier available)
      try {
        const OPENCAGE_API_KEY = 'xxxx'; // Sign up at opencagedata.com
        const opencageResponse = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}&language=en&countrycode=lk&no_annotations=1`
        );
        
        if (opencageResponse.data && opencageResponse.data.results && opencageResponse.data.results.length > 0) {
          const components = opencageResponse.data.results[0].components;
          
          let district = components.county || components.state_district || '';
          let village = components.village || components.town || components.city || '';
          let gnDivision = components.suburb || components.neighbourhood || '';
          
          // Match with our districts list
          const foundDistrict = districts.find(d => 
            d.toLowerCase() === district.toLowerCase() ||
            district.toLowerCase().includes(d.toLowerCase())
          );
          
          if (foundDistrict || district) {
            setFormData(prev => ({
              ...prev,
              district: foundDistrict || district,
              village: village || '',
              gnDivision: gnDivision || '',
            }));
            
            Alert.alert(
              'Location Detected',
              `District: ${foundDistrict || district || 'Unknown'}\nArea: ${village || 'Not specified'}`,
              [{ text: 'OK' }]
            );
            return;
          }
        }
      } catch (opencageError) {
        console.log('OpenCage failed:', opencageError.message);
      }

      // If all methods fail
      Alert.alert(
        'Location Partially Detected',
        'We detected your location but could not identify the exact village. Please select your district and enter village manually.',
        [
          { 
            text: 'Enter Manually', 
            onPress: () => setLocationMethod('manual') 
          },
          { 
            text: 'Try Again', 
            onPress: () => getCurrentLocation() 
          }
        ]
      );

    } catch (error) {
      console.error('Location error:', error);
      
      Alert.alert(
        'Location Detection Failed',
        'Could not detect your location. Please enter details manually.',
        [{ text: 'Enter Manually', onPress: () => setLocationMethod('manual') }]
      );
    } finally {
      setLoading(false);
    }
  };

 // Function to search for villages (for manual input)
  const searchVillages = async (searchText) => {
    if (searchText.length < 2) return [];
    
    try {
      // Use OpenStreetMap Nominatim with proper headers
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}+Sri+Lanka&format=json&addressdetails=1&countrycodes=lk&limit=8`,
        {
          headers: {
            'User-Agent': 'PaddyFarmersApp/1.0',
          }
        }
      );
      
      return response.data.map(item => ({
        name: item.display_name.split(',')[0],
        fullAddress: item.display_name,
        district: item.address.county || item.address.state_district || '',
        lat: item.lat,
        lon: item.lon
      }));
    } catch (error) {
      console.error('Village search error:', error);
      return [];
    }
  };

  // Handle village selection from search
  const handleVillageSelect = async (searchText) => {
    if (searchText.length < 3) return;
    
    const results = await searchVillages(searchText);
    if (results.length > 0) {
      // Show a selection dialog
      Alert.alert(
        'Select Village',
        'Choose your village from the search results:',
        results.slice(0, 5).map((village, index) => ({
          text: `${village.name} (${village.district || 'Unknown district'})`,
          onPress: () => {
            setFormData(prev => ({
              ...prev,
              village: village.name,
              district: village.district || prev.district,
            }));
          }
        })).concat([{ text: 'Cancel', style: 'cancel' }])
      );
    }
  };

  // 2. HANDLE FORM INPUT CHANGES
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Auto-search villages when typing village name
    if (field === 'village' && value.length >= 3) {
      // Debounce the search
      clearTimeout(formData.searchTimeout);
      const timeoutId = setTimeout(() => {
        handleVillageSelect(value);
      }, 1000);
      
      setFormData(prev => ({
        ...prev,
        searchTimeout: timeoutId,
        [field]: value,
      }));
    }
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
  console.log('Form Data:', formData);

  if (!validateForm()) return;

  setLoading(true);
  
  try {

    if (!formData || !formData.soilType || !formData.waterAvailability || !formData.fieldSize) {
      Alert.alert('Error', 'Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Generate recommendation based on form data
    const recommendationData = generateRecommendation(formData);
    
    console.log('Generated Recommendation:', recommendationData);

    // Navigate to results screen with both form data and recommendation
    navigation.navigate('CropRecommendationResults', {
      formData: formData,
      recommendation: recommendationData,
    });
    
  } catch (error) {
    console.error('Recommendation error:', error);
    Alert.alert('Error', 'Failed to generate recommendation. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Add this function to generate recommendations based on form data:
const generateRecommendation = (formData) => {
  
  const { soilType, waterAvailability, fieldSize, season, district } = formData;
  
  // Convert field size to hectares for calculations
  const fieldSizeInHectares = formData.unit === 'Acres' 
    ? parseFloat(fieldSize) * 0.404686 
    : parseFloat(fieldSize);
  
  // Base recommendations for Sri Lanka
  let recommendations = {
    primary: null,
    alternatives: [],
    plantingWindow: '',
    estimatedProfit: '',
    fertilizerPlan: '',
    riskLevel: 'Medium',
    waterRequirement: '',
    duration: '',
    specialAdvice: '',
  };

  // Season-based planting windows
  const plantingWindows = {
    'Yala': 'April 15 - May 30',
    'Maha': 'October 15 - November 30'
  };

  // Paddy varieties database for Sri Lanka
  const paddyVarieties = [
    {
      name: 'BG 358',
      soilPreference: ['Clay Loam', 'Alluvial Soil', 'Black Soil'],
      waterNeed: 'High',
      season: 'Both',
      duration: '3.5-4 months',
      yield: '5.0-6.0 t/ha',
      price: 'LKR 80-90/kg',
      resistance: ['Blast', 'Brown Spot'],
      riskLevel: 'Low',
      description: 'High yielding variety suitable for good irrigation'
    },
    {
      name: 'BG 360',
      soilPreference: ['Red Soil', 'Clay Loam', 'Laterite Soil'],
      waterNeed: 'Medium',
      season: 'Maha',
      duration: '4-4.5 months',
      yield: '4.5-5.5 t/ha',
      price: 'LKR 75-85/kg',
      resistance: ['Drought', 'Blast'],
      riskLevel: 'Medium',
      description: 'Drought tolerant, good for moderate irrigation'
    },
    {
      name: 'AT 362',
      soilPreference: ['Sandy Soil', 'Red Soil', 'Laterite Soil'],
      waterNeed: 'Low',
      season: 'Both',
      duration: '3-3.5 months',
      yield: '4.0-5.0 t/ha',
      price: 'LKR 70-80/kg',
      resistance: ['Drought', 'Salinity'],
      riskLevel: 'Medium',
      description: 'Short duration, suitable for rain-fed areas'
    },
    {
      name: 'Bg 300',
      soilPreference: ['Clay Loam', 'Alluvial Soil'],
      waterNeed: 'High',
      season: 'Yala',
      duration: '4 months',
      yield: '5.5-6.5 t/ha',
      price: 'LKR 85-95/kg',
      resistance: ['Blast'],
      riskLevel: 'Low',
      description: 'Traditional high yielder, needs good management'
    },
    {
      name: 'Ld 365',
      soilPreference: ['Sandy Soil', 'Red Soil'],
      waterNeed: 'Low',
      season: 'Maha',
      duration: '3.5-4 months',
      yield: '3.5-4.5 t/ha',
      price: 'LKR 65-75/kg',
      resistance: ['Drought', 'Pests'],
      riskLevel: 'High',
      description: 'Suitable for water-limited conditions'
    },
    {
      name: 'Bg 94-1',
      soilPreference: ['Alluvial Soil', 'Clay Loam'],
      waterNeed: 'Medium',
      season: 'Both',
      duration: '4.5 months',
      yield: '4.5-5.5 t/ha',
      price: 'LKR 70-80/kg',
      resistance: ['Diseases'],
      riskLevel: 'Low',
      description: 'Good for both seasons, stable yield'
    }
  ];

  // Score varieties based on farmer's conditions
  const scoredVarieties = paddyVarieties.map(variety => {
    let score = 0;
    
    // Soil match (30 points)
    if (variety.soilPreference.includes(soilType)) {
      score += 30;
    }
    
    // Water availability match (25 points)
    const waterLevels = {
      'Excellent (Irrigation + Rainfall)': 'High',
      'Good (Reliable Irrigation)': 'High',
      'Moderate (Seasonal Irrigation)': 'Medium',
      'Poor (Rain-fed Only)': 'Low'
    };
    
    if (variety.waterNeed === waterLevels[waterAvailability]) {
      score += 25;
    } else if (
      (waterLevels[waterAvailability] === 'High' && variety.waterNeed === 'Medium') ||
      (waterLevels[waterAvailability] === 'Medium' && variety.waterNeed === 'Low') ||
      (waterLevels[waterAvailability] === 'Low' && variety.waterNeed === 'Medium')
    ) {
      score += 15;
    }
    
    // Season match (20 points)
    if (variety.season === 'Both' || variety.season === season) {
      score += 20;
    }
    
    // Risk level (15 points) - Lower risk gets higher score
    if (variety.riskLevel === 'Low') score += 15;
    else if (variety.riskLevel === 'Medium') score += 10;
    else score += 5;
    
    // Yield consideration (10 points) - Higher yield gets higher score
    const avgYield = parseFloat(variety.yield.split('-')[0]);
    if (avgYield > 5.0) score += 10;
    else if (avgYield > 4.0) score += 7;
    else score += 5;
    
    return { ...variety, score };
  });

  // Sort by score and get top recommendations
  scoredVarieties.sort((a, b) => b.score - a.score);
  
  // Select primary recommendation (top score)
  const primary = scoredVarieties[0];
  
  // Select alternatives (next 2-3)
  const alternatives = scoredVarieties.slice(1, 4);
  
  // Calculate profit based on field size
  const avgYield = parseFloat(primary.yield.split('-')[0]);
  const avgPrice = parseFloat(primary.price.split('-')[0].replace('LKR ', ''));
  const totalYield = avgYield * fieldSizeInHectares;
  const totalRevenue = totalYield * avgPrice * 1000; // Convert to kg
  
  // Estimated costs (per hectare)
  const costsPerHectare = {
    seeds: 8000,
    fertilizer: 25000,
    pesticides: 8000,
    labor: 30000,
    other: 10000
  };
  
  const totalCost = Object.values(costsPerHectare).reduce((a, b) => a + b) * fieldSizeInHectares;
  const estimatedProfit = totalRevenue - totalCost;
  
  // Determine planting window
  const plantingWindow = plantingWindows[season] || 'Check with local agriculture department';
  
  // Generate fertilizer plan based on soil type
  const fertilizerPlans = {
    'Red Soil': 'Urea: 100kg/ha, TSP: 75kg/ha, MOP: 50kg/ha',
    'Clay Loam': 'Urea: 80kg/ha, TSP: 60kg/ha, MOP: 40kg/ha',
    'Sandy Soil': 'Urea: 60kg/ha, TSP: 50kg/ha, MOP: 30kg/ha + Organic manure',
    'Alluvial Soil': 'Urea: 90kg/ha, TSP: 70kg/ha, MOP: 45kg/ha',
    'Laterite Soil': 'Urea: 70kg/ha, TSP: 55kg/ha, MOP: 35kg/ha + Lime',
    'Peaty Soil': 'Urea: 50kg/ha, TSP: 40kg/ha, MOP: 25kg/ha',
    'Saline Soil': 'Urea: 60kg/ha, TSP: 50kg/ha, MOP: 30kg/ha + Gypsum',
    'Black Soil': 'Urea: 85kg/ha, TSP: 65kg/ha, MOP: 42kg/ha'
  };
  
  const fertilizerPlan = fertilizerPlans[soilType] || 'Urea: 75kg/ha, TSP: 55kg/ha, MOP: 35kg/ha';
  
  // Adjust for field size
  const adjustedFertilizerPlan = fertilizerPlan.replace(/[\d.]+kg\/ha/g, match => {
    const kg = parseFloat(match);
    const adjusted = (kg * fieldSizeInHectares).toFixed(1);
    return `${adjusted}kg`;
  });
  
  // Determine water requirement
  const waterRequirements = {
    'High': '2500-3000 mm per season',
    'Medium': '1800-2500 mm per season',
    'Low': '1200-1800 mm per season'
  };
  
  const waterRequirement = waterRequirements[primary.waterNeed];
  
  // Special advice based on conditions
  let specialAdvice = [];
  
  if (waterAvailability === 'Poor (Rain-fed Only)') {
    specialAdvice.push('• Consider water harvesting techniques');
    specialAdvice.push('• Use mulch to conserve soil moisture');
  }
  
  if (soilType === 'Sandy Soil') {
    specialAdvice.push('• Add organic matter to improve water retention');
  }
  
  if (season === 'Yala') {
    specialAdvice.push('• Early planting recommended to avoid drought');
  }
  
  if (fieldSizeInHectares > 2) {
    specialAdvice.push('• Consider mechanization for cost efficiency');
  }
  
  return {
    primary: {
      variety: primary.name,
      confidence: Math.min(primary.score, 100),
      yield: primary.yield,
      duration: primary.duration,
      price: primary.price,
      resistance: primary.resistance.join(', '),
      riskLevel: primary.riskLevel,
      description: primary.description,
      waterNeed: primary.waterNeed,
    },
    alternatives: alternatives.map(alt => ({
      variety: alt.name,
      confidence: Math.min(alt.score, 95),
      yield: alt.yield,
      riskLevel: alt.riskLevel,
    })),
    plantingWindow,
    estimatedProfit: `LKR ${estimatedProfit.toLocaleString('en-LK')}`,
    costBreakdown: {
      seeds: costsPerHectare.seeds * fieldSizeInHectares,
      fertilizer: costsPerHectare.fertilizer * fieldSizeInHectares,
      pesticides: costsPerHectare.pesticides * fieldSizeInHectares,
      labor: costsPerHectare.labor * fieldSizeInHectares,
      other: costsPerHectare.other * fieldSizeInHectares,
      total: totalCost
    },
    fertilizerPlan: adjustedFertilizerPlan,
    waterRequirement,
    specialAdvice: specialAdvice.length > 0 ? specialAdvice.join('\n') : 'No special advice needed',
    fieldSize: {
      value: fieldSize,
      unit: formData.unit,
      hectares: fieldSizeInHectares.toFixed(2)
    },
    calculatedYield: `${totalYield.toFixed(1)} tons`,
  };
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
                {formData.village ? `, ${formData.village}` : ''}
              </Text>
            </View>
          )}

          {/* In your manual inputs section, update the village input: */}
        {locationMethod === 'manual' && (
          <View style={styles.manualInputs}>
            {/* District selection remains the same... */}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Village</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Type village name (min 3 letters)"
                value={formData.village}
                onChangeText={(text) => handleInputChange('village', text)}
              />
              <Text style={styles.helperText}>
                Start typing to search for your village
              </Text>
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

  villageSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    position: 'absolute',
    right: 10,
    padding: 10,
  },

  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default CropRecommenderScreen;