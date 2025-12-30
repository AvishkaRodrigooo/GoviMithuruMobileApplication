import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, 
  Dimensions, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, 
  Platform, StatusBar, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { db, auth } from '../../firebase/firebaseConfig'; 
// FIX: Use the new CameraView and permission hook
import { CameraView, useCameraPermissions } from 'expo-camera'; 

const { width } = Dimensions.get('window');

const RICE_VARIETIES = [
  'Bg 250', 'Bg 300', 'Bg 352', 'Bg 366', 'Bg 379-2', 'Bg 403',
  'At 306', 'At 362', 'At 405',
  'Samba Rice', 'Suwandel', 'Kuruluthuda', 'Kekulu Rice', 'Rathdhal', 
  'Kaluheenati', 'Madathawalu', 'H 4', 'H 10'
];

const STORAGE_TYPES = ['Home', 'Warehouse', 'Co-op', 'Government Store', 'Private Store'];
const MEASUREMENT_UNITS = ['Square Feet', 'Square Meters'];

export default function RegisterHarvestScreen({ navigation, route }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [storageMode, setStorageMode] = useState('');
  const [existingLocations, setExistingLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Camera States
  const [showCamera, setShowCamera] = useState(false);
  // FIX: Use the new permission hook
  const [permission, requestPermission] = useCameraPermissions();
  
  const editData = route.params?.editData;
  const docId = route.params?.docId;

  const [formData, setFormData] = useState({
    locationId: '',
    storageType: 'Home',
    locationName: '',
    storageArea: '',
    areaUnit: 'Square Feet',
    variety: 'Bg 300',
    quantityKg: '',
    bags: '0',
    grade: 'A',
    season: 'Maha',
    ventilation: 'Good',
    moisture: '',
    pestCheck: 'No',
    prodCost: '',
  });

  useEffect(() => {
    checkAuth();
    loadExistingLocations();
    // Request permission on mount if not determined yet
    if (!permission) {
      requestPermission();
    }
  }, []);

  const checkAuth = () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not Logged In", "Please login first", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }
  };

  const loadExistingLocations = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.log("No user logged in");
        return;
      }
      
      const snapshot = await db.collection('storageLocations')
        .where('userId', '==', userId)
        .get();
      
      const locations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setExistingLocations(locations);
    } catch (error) {
      console.log("Error loading locations:", error);
    }
  };

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        quantityKg: editData.quantityKg?.toString() || '',
        bags: editData.bags?.toString() || '0',
        prodCost: editData.prodCost?.toString() || '',
        storageArea: editData.storageArea?.toString() || '',
      });
    }
  }, [editData]);

  const handleQuantityChange = (val) => {
    const cleanVal = val.replace(/[^0-9.]/g, '');
    const kgs = parseFloat(cleanVal);
    let calculatedBags = '0';
    if (!isNaN(kgs) && kgs > 0) {
      calculatedBags = (kgs / 50).toFixed(1);
    }
    setFormData(prev => ({ ...prev, quantityKg: cleanVal, bags: calculatedBags }));
  };

  const handleExistingLocationSelect = (location) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      locationId: location.id,
      storageType: location.storageType,
      locationName: location.locationName,
      storageArea: location.storageArea?.toString() || '',
      areaUnit: location.areaUnit || 'Square Feet',
    }));
  };

  const saveNewLocation = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "Please login first");
        return null;
      }

      const locationData = {
        userId,
        storageType: formData.storageType,
        locationName: formData.locationName,
        storageArea: parseFloat(formData.storageArea) || 0,
        areaUnit: formData.areaUnit,
        createdAt: new Date(),
      };

      const docRef = await db.collection('storageLocations').add(locationData);
      return docRef.id;
    } catch (error) {
      console.log("Error saving location:", error);
      Alert.alert("Error", "Could not save location: " + error.message);
      return null;
    }
  };

  const handleComplete = async () => {
    if (!formData.quantityKg || formData.quantityKg === '0') {
      Alert.alert("Required", "Please enter quantity in KG.");
      return;
    }

    setLoading(true);
    try {
      let locationId = formData.locationId;

      if (storageMode === 'new' && !locationId) {
        locationId = await saveNewLocation();
        if (!locationId) {
          setLoading(false);
          return;
        }
      }

      const payload = {
        ...formData,
        locationId,
        userId: auth.currentUser?.uid || 'anonymous',
        quantityKg: parseFloat(formData.quantityKg) || 0,
        bags: parseFloat(formData.bags) || 0,
        prodCost: parseFloat(formData.prodCost) || 0,
        storageArea: parseFloat(formData.storageArea) || 0,
        updatedAt: new Date(),
      };

      if (docId) {
        await db.collection('harvests').doc(docId).update(payload);
        Alert.alert("Success", "Stock updated successfully!");
      } else {
        await db.collection('harvests').add({ ...payload, createdAt: new Date() });
        Alert.alert("Success", "Stock registered successfully!");
      }
      navigation.goBack();
    } catch (error) {
      console.log("Firebase Error:", error);
      Alert.alert("Error", "Could not save: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 0 && !storageMode) {
      Alert.alert("Required", "Please select storage option");
      return;
    }

    if (step === 0 && storageMode === 'existing') {
      if (!selectedLocation) {
        Alert.alert("Required", "Please select a location");
        return;
      }
      setStep(2); // Skip new location details
      return;
    }

    if (step === 1 && storageMode === 'new') {
      if (!formData.storageType) {
        Alert.alert("Required", "Please select storage type");
        return;
      }
      if (!formData.locationName) {
        Alert.alert("Required", "Please enter location name");
        return;
      }
    }

    if (step === 2 && !formData.quantityKg) {
      Alert.alert("Required", "Please enter quantity");
      return;
    }

    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step === 2 && storageMode === 'existing') {
      setStep(0);
    } else if (step > 0) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const ProgressBar = () => {
    const totalSteps = storageMode === 'existing' ? 3 : 4;
    const currentStep = storageMode === 'existing' && step > 0 ? step - 1 : step;
    
    return (
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={styles.progressStep}>
            <View style={[styles.dot, currentStep >= i ? styles.activeDot : styles.inactiveDot]}>
              {currentStep > i ? (
                <MaterialCommunityIcons name="check" size={14} color="#fff" />
              ) : (
                <Text style={[styles.dotText, currentStep >= i && {color: '#fff'}]}>{i + 1}</Text>
              )}
            </View>
            {i < totalSteps - 1 && (
              <View style={[styles.line, currentStep > i ? styles.activeLine : styles.inactiveLine]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const CameraScanner = () => {
    // FIX: Check permission?.granted using the new hook object
    if (!showCamera || !permission?.granted) {
      return null;
    }

    return (
      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={styles.cameraContainer}>
          {/* FIX: Use CameraView with facing="back" instead of Camera with type */}
          <CameraView style={styles.camera} facing="back">
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraText}>Point camera at the floor to measure area</Text>
              <Text style={styles.cameraSubtext}>AR measurement coming soon</Text>
              <TouchableOpacity 
                style={styles.cameraCancelBtn}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.cameraCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {docId ? "Edit Stock" : "Register New Stock"}
        </Text>
        <ProgressBar />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{flex: 1}}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Step 0: Storage Option */}
          {step === 0 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepLabel}>Select Storage Option</Text>
              
              <TouchableOpacity 
                style={[styles.optionCard, storageMode === 'existing' && styles.optionCardActive]}
                onPress={() => setStorageMode('existing')}
              >
                <View style={styles.optionIconContainer}>
                  <MaterialCommunityIcons 
                    name="warehouse" 
                    size={40} 
                    color={storageMode === 'existing' ? '#16a34a' : '#64748b'} 
                  />
                </View>
                <Text style={styles.optionTitle}>Existing Location</Text>
                <Text style={styles.optionDesc}>Add stock to an already registered storage place</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionCard, storageMode === 'new' && styles.optionCardActive]}
                onPress={() => setStorageMode('new')}
              >
                <View style={styles.optionIconContainer}>
                  <MaterialCommunityIcons 
                    name="plus-circle" 
                    size={40} 
                    color={storageMode === 'new' ? '#16a34a' : '#64748b'} 
                  />
                </View>
                <Text style={styles.optionTitle}>New Location</Text>
                <Text style={styles.optionDesc}>Register a new storage place and add stock</Text>
              </TouchableOpacity>

              {storageMode === 'existing' && (
                <View style={styles.existingLocationsContainer}>
                  <Text style={styles.inputLabel}>Select Existing Location:</Text>
                  {existingLocations.length > 0 ? (
                    existingLocations.map(location => (
                      <TouchableOpacity
                        key={location.id}
                        style={[
                          styles.locationCard,
                          selectedLocation?.id === location.id && styles.locationCardActive
                        ]}
                        onPress={() => handleExistingLocationSelect(location)}
                      >
                        <View style={styles.locationCardContent}>
                          <MaterialCommunityIcons 
                            name="map-marker" 
                            size={24} 
                            color={selectedLocation?.id === location.id ? '#16a34a' : '#64748b'} 
                          />
                          <View style={styles.locationCardText}>
                            <Text style={styles.locationCardTitle}>{location.locationName}</Text>
                            <Text style={styles.locationCardSubtitle}>
                              {location.storageType} • {location.storageArea} {location.areaUnit}
                            </Text>
                          </View>
                        </View>
                        {selectedLocation?.id === location.id && (
                          <MaterialCommunityIcons name="check-circle" size={24} color="#16a34a" />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyLocations}>
                      <MaterialCommunityIcons name="information" size={24} color="#94a3b8" />
                      <Text style={styles.emptyLocationsText}>
                        No existing locations found. Please select "New Location" option.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Step 1: New Location Details */}
          {step === 1 && storageMode === 'new' && (
            <View style={styles.stepCard}>
              <Text style={styles.stepLabel}>1. Setup Storage Location</Text>
              
              <Text style={styles.inputLabel}>Storage Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.storageType}
                  onValueChange={(value) => setFormData({...formData, storageType: value})}
                  style={styles.picker}
                >
                  {STORAGE_TYPES.map(type => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Location Name</Text>
              <TextInput 
                style={styles.textInput}
                placeholder="e.g., Main Warehouse, Home Storage"
                value={formData.locationName}
                onChangeText={(val) => setFormData({...formData, locationName: val})}
              />

              <Text style={styles.inputLabel}>Storage Area (Optional)</Text>
              <View style={styles.row}>
                <View style={{flex: 1, marginRight: 10}}>
                  <TextInput 
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g., 1000"
                    value={formData.storageArea}
                    onChangeText={(val) => setFormData({...formData, storageArea: val})}
                  />
                </View>
                <View style={{flex: 0.8}}>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.areaUnit}
                      onValueChange={(value) => setFormData({...formData, areaUnit: value})}
                      style={styles.picker}
                    >
                      {MEASUREMENT_UNITS.map(unit => (
                        <Picker.Item key={unit} label={unit} value={unit} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.measureButton}
                onPress={() => {
                  if (permission?.granted) {
                    setShowCamera(true);
                  } else {
                    requestPermission().then((res) => {
                      if (res && res.granted) {
                        setShowCamera(true);
                      } else {
                        Alert.alert("Permission", "Please allow camera access in settings.");
                      }
                    });
                  }
                }}
              >
                <MaterialCommunityIcons name="camera-outline" size={20} color="#16a34a" />
                <Text style={styles.measureButtonText}>Measure with Camera (AR)</Text>
              </TouchableOpacity>
              <Text style={styles.measureHint}>
                Don't know exact size? Use camera to measure the storage area
              </Text>
            </View>
          )}

          {/* Step 2: Rice Details */}
          {step === 2 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepLabel}>
                {storageMode === 'existing' ? '1. Rice Variety & Quantity' : '2. Rice Variety & Quantity'}
              </Text>
              
              <Text style={styles.inputLabel}>Select Rice Variety</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.variety}
                  onValueChange={(value) => setFormData({...formData, variety: value})}
                  style={styles.picker}
                >
                  {RICE_VARIETIES.map(variety => (
                    <Picker.Item key={variety} label={variety} value={variety} />
                  ))}
                </Picker>
              </View>

              <View style={styles.row}>
                <View style={{flex: 1.2, marginRight: 10}}>
                  <Text style={styles.inputLabel}>Total Weight (KG)</Text>
                  <TextInput 
                    style={styles.textInput}
                    keyboardType="numeric"
                    onChangeText={handleQuantityChange}
                    value={formData.quantityKg}
                    placeholder="e.g., 1000"
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Est. Bags (50kg)</Text>
                  <View style={styles.disabledInput}>
                    <Text style={styles.disabledText}>{formData.bags}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>Quality Grade</Text>
              <View style={styles.buttonRow}>
                {['A', 'B', 'C'].map(g => (
                  <TouchableOpacity 
                    key={g}
                    style={[styles.optionButton, formData.grade === g && styles.optionButtonActive]}
                    onPress={() => setFormData({...formData, grade: g})}
                  >
                    <Text style={[styles.optionText, formData.grade === g && styles.optionTextActive]}>
                      Grade {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Season</Text>
              <View style={styles.buttonRow}>
                {['Maha', 'Yala'].map(s => (
                  <TouchableOpacity 
                    key={s}
                    style={[styles.optionButton, formData.season === s && styles.optionButtonActive]}
                    onPress={() => setFormData({...formData, season: s})}
                  >
                    <Text style={[styles.optionText, formData.season === s && styles.optionTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 3: Conditions */}
          {step === 3 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepLabel}>
                {storageMode === 'existing' ? '2. Storage Conditions' : '3. Storage Conditions'}
              </Text>
              
              <Text style={styles.inputLabel}>Moisture Content (%)</Text>
              <TextInput 
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g., 13.5"
                value={formData.moisture}
                onChangeText={(val) => setFormData({...formData, moisture: val})}
              />

              <Text style={styles.inputLabel}>Ventilation Quality</Text>
              <View style={styles.buttonRow}>
                {['Good', 'Average', 'Poor'].map(v => (
                  <TouchableOpacity 
                    key={v}
                    style={[styles.optionButton, formData.ventilation === v && styles.optionButtonActive]}
                    onPress={() => setFormData({...formData, ventilation: v})}
                  >
                    <Text style={[styles.optionText, formData.ventilation === v && styles.optionTextActive]}>
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Pests Visible?</Text>
              <View style={styles.buttonRow}>
                {['Yes', 'No'].map(p => (
                  <TouchableOpacity 
                    key={p}
                    style={[styles.optionButton, formData.pestCheck === p && styles.optionButtonActive]}
                    onPress={() => setFormData({...formData, pestCheck: p})}
                  >
                    <Text style={[styles.optionText, formData.pestCheck === p && styles.optionTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={prevStep}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color="#64748b" />
            <Text style={styles.backText}>
              {step === 0 ? "Cancel" : "Previous"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={step === 3 ? handleComplete : nextStep}
            style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.nextText}>
                  {step === 3 ? "Complete" : "Next"}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CameraScanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#fff', 
    paddingTop: 16, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    elevation: 2,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#1e293b', 
    marginBottom: 16 
  },
  
  progressContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  dot: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2 
  },
  activeDot: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  inactiveDot: { backgroundColor: '#fff', borderColor: '#cbd5e1' },
  dotText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  line: { width: 40, height: 3, marginHorizontal: 6 },
  activeLine: { backgroundColor: '#16a34a' },
  inactiveLine: { backgroundColor: '#e2e8f0' },

  scrollContent: { 
    padding: 20,
    paddingBottom: 40,
  },
  stepCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  stepLabel: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#16a34a', 
    marginBottom: 20 
  },
  
  optionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  optionIconContainer: {
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18, 
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  optionDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },

  existingLocationsContainer: {
    marginTop: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  locationCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  locationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationCardText: {
    marginLeft: 12,
    flex: 1,
  },
  locationCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  locationCardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  emptyLocations: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  emptyLocationsText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  
  inputLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#475569', 
    marginBottom: 8, 
    marginTop: 16 
  },
  textInput: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    color: '#1e293b', 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0' 
  },

  pickerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },

  measureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  measureButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  measureHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },

  row: { 
    flexDirection: 'row', 
    marginHorizontal: -6,
  },
  disabledInput: { 
    backgroundColor: '#e2e8f0', 
    borderRadius: 12, 
    padding: 14, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#475569' 
  },

  buttonRow: { 
    flexDirection: 'row', 
    marginHorizontal: -4,
  },
  optionButton: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderRadius: 10, 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    marginHorizontal: 4,
    backgroundColor: '#f8fafc',
  },
  optionButtonActive: { 
    backgroundColor: '#16a34a', 
    borderColor: '#16a34a' 
  },
  optionText: { 
    fontWeight: '600', 
    color: '#64748b',
    fontSize: 14,
  },
  optionTextActive: { 
    color: '#fff' 
  },

  footer: { 
    flexDirection: 'row', 
    padding: 16, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0',
    elevation: 8,
  },
  backBtn: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { 
    color: '#64748b', 
    fontWeight: '600', 
    fontSize: 16,
    marginLeft: 4,
  },
  nextBtn: { 
    flex: 1.5, 
    backgroundColor: '#16a34a', 
    paddingVertical: 14, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    marginLeft: 12,
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 16,
    marginRight: 4,
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  cameraSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  cameraCancelBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cameraCancelText: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: 16,
  },
});