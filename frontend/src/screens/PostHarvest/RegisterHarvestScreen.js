import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Dimensions, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView,
  Platform, StatusBar, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { db, auth } from '../../firebase/firebaseConfig';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [showCamera, setShowCamera] = useState(false);
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
    if (!permission) requestPermission();
  }, []);

  const checkAuth = () => {
    if (!auth.currentUser) {
      Alert.alert("Not Logged In", "Please login first", [{ text: "OK", onPress: () => navigation.goBack() }]);
    }
  };

  const loadExistingLocations = async () => {
    try {
      const snapshot = await db.collection('storageLocations').where('userId', '==', auth.currentUser?.uid).get();
      setExistingLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.log(error); }
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
      setStorageMode('existing');
    }
  }, [editData]);

  const handleQuantityChange = (val) => {
    const cleanVal = val.replace(/[^0-9.]/g, '');
    const kgs = parseFloat(cleanVal);
    let calculatedBags = '0';
    if (!isNaN(kgs) && kgs > 0) calculatedBags = (kgs / 50).toFixed(1);
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

  const handleComplete = async () => {
    if (!formData.quantityKg || formData.quantityKg === '0') {
      Alert.alert("Required", "Please enter quantity in KG.");
      return;
    }
    setLoading(true);
    try {
      let locationId = formData.locationId;
      if (storageMode === 'new' && !locationId) {
        const docRef = await db.collection('storageLocations').add({
          userId: auth.currentUser.uid,
          storageType: formData.storageType,
          locationName: formData.locationName,
          storageArea: parseFloat(formData.storageArea) || 0,
          areaUnit: formData.areaUnit,
          createdAt: new Date(),
        });
        locationId = docRef.id;
      }

      const payload = {
        ...formData,
        locationId,
        userId: auth.currentUser?.uid,
        quantityKg: parseFloat(formData.quantityKg) || 0,
        bags: parseFloat(formData.bags) || 0,
        prodCost: parseFloat(formData.prodCost) || 0,
        storageArea: parseFloat(formData.storageArea) || 0,
        updatedAt: new Date(),
      };

      if (docId) {
        await db.collection('harvests').doc(docId).update(payload);
        Alert.alert("Done", "Stock record updated.");
      } else {
        await db.collection('harvests').add({ ...payload, createdAt: new Date() });
        Alert.alert("Success", "Harvest registered and secured.");
      }
      navigation.goBack();
    } catch (e) { Alert.alert("Error", e.message); }
    finally { setLoading(false); }
  };

  const renderStepHeader = (title, icon) => (
    <View style={styles.stepHeader}>
      <View style={styles.stepIconBox}>
        <MaterialCommunityIcons name={icon} size={24} color="#34d399" />
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.mainTitle}>{docId ? "Modify Batch" : "Secure Harvest"}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 4) * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {step === 0 && (
            <View style={styles.stepContent}>
              {renderStepHeader("Deployment Context", "map-marker-path")}
              <Text style={styles.label}>Where is this harvest stored?</Text>

              <TouchableOpacity
                style={[styles.modeBtn, storageMode === 'existing' && styles.modeBtnActive]}
                onPress={() => setStorageMode('existing')}
              >
                <MaterialCommunityIcons name="layers-outline" size={32} color={storageMode === 'existing' ? '#34d399' : '#64748b'} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.modeTitle, storageMode === 'existing' && { color: '#34d399' }]}>Existing Location</Text>
                  <Text style={styles.modeSub}>Add to a previously registered warehouse</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, storageMode === 'new' && styles.modeBtnActive]}
                onPress={() => setStorageMode('new')}
              >
                <MaterialCommunityIcons name="plus-box-outline" size={32} color={storageMode === 'new' ? '#34d399' : '#64748b'} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.modeTitle, storageMode === 'new' && { color: '#34d399' }]}>New Location</Text>
                  <Text style={styles.modeSub}>Register a new storage facility</Text>
                </View>
              </TouchableOpacity>

              {storageMode === 'existing' && (
                <View style={styles.locList}>
                  {existingLocations.map(loc => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[styles.locItem, selectedLocation?.id === loc.id && styles.locItemActive]}
                      onPress={() => handleExistingLocationSelect(loc)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.locName}>{loc.locationName}</Text>
                        <Text style={styles.locSub}>{loc.storageType} • {loc.storageArea} {loc.areaUnit}</Text>
                      </View>
                      {selectedLocation?.id === loc.id && <MaterialCommunityIcons name="check-circle" size={20} color="#34d399" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              {renderStepHeader("Facility Details", "warehouse")}
              <Text style={styles.label}>Storage Class</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.storageType}
                  onValueChange={(v) => setFormData({ ...formData, storageType: v })}
                  style={{ color: '#fff' }} dropdownIconColor="#34d399"
                >
                  {STORAGE_TYPES.map(t => <Picker.Item key={t} label={t} value={t} color={Platform.OS === 'ios' ? '#fff' : '#000'} />)}
                </Picker>
              </View>

              <Text style={styles.label}>Identification Name</Text>
              <TextInput
                style={styles.input} placeholder="e.g. Backyard Silo 2"
                placeholderTextColor="#475569" value={formData.locationName}
                onChangeText={(v) => setFormData({ ...formData, locationName: v })}
              />

              <Text style={styles.label}>Area Dimension (Optional)</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 10 }]}
                  keyboardType="numeric" placeholder="Value"
                  value={formData.storageArea} onChangeText={(v) => setFormData({ ...formData, storageArea: v })}
                />
                <View style={[styles.pickerWrapper, { flex: 1, height: 52 }]}>
                  <Picker
                    selectedValue={formData.areaUnit}
                    onValueChange={(v) => setFormData({ ...formData, areaUnit: v })}
                    style={{ color: '#fff' }} dropdownIconColor="#34d399"
                  >
                    {MEASUREMENT_UNITS.map(u => <Picker.Item key={u} label={u} value={u} color={Platform.OS === 'ios' ? '#fff' : '#000'} />)}
                  </Picker>
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              {renderStepHeader("Harvest Profile", "paddy")}
              <Text style={styles.label}>Rice Variety (Vee Variety)</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.variety}
                  onValueChange={(v) => setFormData({ ...formData, variety: v })}
                  style={{ color: '#fff' }} dropdownIconColor="#34d399"
                >
                  {RICE_VARIETIES.map(v => <Picker.Item key={v} label={v} value={v} color={Platform.OS === 'ios' ? '#fff' : '#000'} />)}
                </Picker>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1.2, marginRight: 10 }}>
                  <Text style={styles.label}>Total Quantity (KG)</Text>
                  <TextInput
                    style={styles.input} keyboardType="numeric"
                    placeholder="0.0" value={formData.quantityKg}
                    onChangeText={handleQuantityChange}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Est. Bags (50kg)</Text>
                  <View style={styles.readOnlyInput}><Text style={styles.readOnlyText}>{formData.bags}</Text></View>
                </View>
              </View>

              <Text style={styles.label}>Quality Grading</Text>
              <View style={styles.btnRow}>
                {['A', 'B', 'C'].map(g => (
                  <TouchableOpacity
                    key={g} style={[styles.pill, formData.grade === g && styles.pillActive]}
                    onPress={() => setFormData({ ...formData, grade: g })}
                  >
                    <Text style={[styles.pillText, formData.grade === g && styles.pillTextActive]}>Grade {g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              {renderStepHeader("Storage Integrity", "shield-check-outline")}
              <Text style={styles.label}>Moisture Analysis (%)</Text>
              <TextInput
                style={styles.input} keyboardType="numeric" placeholder="Target 13.5%"
                value={formData.moisture} onChangeText={(v) => setFormData({ ...formData, moisture: v })}
              />

              <Text style={styles.label}>Ventilation State</Text>
              <View style={styles.btnRow}>
                {['Good', 'Average', 'Poor'].map(v => (
                  <TouchableOpacity
                    key={v} style={[styles.pill, formData.ventilation === v && styles.pillActive]}
                    onPress={() => setFormData({ ...formData, ventilation: v })}
                  >
                    <Text style={[styles.pillText, formData.ventilation === v && styles.pillTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Production Cost (LKR/KG)</Text>
              <TextInput
                style={styles.input} keyboardType="numeric" placeholder="Cost to produce"
                value={formData.prodCost} onChangeText={(v) => setFormData({ ...formData, prodCost: v })}
              />
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.fBack} onPress={() => setStep(step - 1)}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
              <Text style={styles.fBackText}>BACK</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.fNext, step === 0 && { flex: 1 }]}
            onPress={step === 3 ? handleComplete : () => setStep(step + 1)}
            disabled={loading}
          >
            <LinearGradient colors={['#059669', '#16a34a']} style={styles.fNextGrad}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <><Text style={styles.fNextText}>{step === 3 ? "FINALIZE LOG" : "CONTINUE"}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" /></>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* AR Camera Modal Placeholder */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.camRoot}>
          <CameraView style={{ flex: 1 }} facing="back">
            <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.camClose}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>CANCEL</Text>
            </TouchableOpacity>
          </CameraView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  mainTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  progressTrack: { height: 4, backgroundColor: '#1e293b', borderRadius: 2, marginTop: 16 },
  progressFill: { height: '100%', backgroundColor: '#34d399', borderRadius: 2 },

  scroll: { padding: 20 },
  stepContent: { marginBottom: 30 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 },
  stepIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#064e3b30', justifyContent: 'center', alignItems: 'center' },
  stepTitle: { color: '#34d399', fontSize: 18, fontWeight: '800' },

  label: { color: '#94a3b8', fontSize: 12, fontWeight: '800', marginBottom: 10, marginTop: 16, textTransform: 'uppercase' },
  modeBtn: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 20, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  modeBtnActive: { borderColor: '#34d399', backgroundColor: '#064e3b15' },
  modeTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  modeSub: { color: '#64748b', fontSize: 11, marginTop: 2 },

  locList: { marginTop: 10, gap: 8 },
  locItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  locItemActive: { borderColor: '#34d399', backgroundColor: '#34d39910' },
  locName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  locSub: { color: '#475569', fontSize: 11 },

  input: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  pickerWrapper: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  row: { flexDirection: 'row' },

  readOnlyInput: { flex: 1, backgroundColor: '#0f172a', borderRadius: 16, padding: 16, justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  readOnlyText: { color: '#64748b', fontSize: 16, fontWeight: '800' },

  btnRow: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  pillActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  pillText: { color: '#64748b', fontSize: 13, fontWeight: '800' },
  pillTextActive: { color: '#064e3b' },

  footer: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  fBack: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8 },
  fBackText: { color: '#64748b', fontWeight: '800', fontSize: 13 },
  fNext: { flex: 1.5, borderRadius: 16, overflow: 'hidden' },
  fNextGrad: { flexDirection: 'row', height: 56, alignItems: 'center', justifyContent: 'center', gap: 8 },
  fNextText: { color: '#fff', fontWeight: '900', fontSize: 15 },

  camRoot: { flex: 1, backgroundColor: '#000' },
  camClose: { position: 'absolute', bottom: 40, alignSelf: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16 },
});