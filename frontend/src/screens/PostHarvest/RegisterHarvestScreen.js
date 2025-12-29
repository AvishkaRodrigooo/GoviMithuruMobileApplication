import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, 
  Dimensions, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, 
  Platform, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../../firebase/firebaseConfig'; 

const { width } = Dimensions.get('window');

const RICE_VARIETIES = [
  { id: '1', name: 'Bg 352', icon: 'seed', category: 'Bg Series' },
  { id: '2', name: 'Bg 300', icon: 'seed', category: 'Bg Series' },
  { id: '3', name: 'At 362', icon: 'seed-outline', category: 'At Series' },
  { id: '4', name: 'Samba', icon: 'shimmer', category: 'Traditional' },
  { id: '5', name: 'Suwandel', icon: 'leaf', category: 'Traditional' },
  { id: '6', name: 'Kekulu', icon: 'grain', category: 'Traditional' },
  { id: '7', name: 'Kuruluthuda', icon: 'bird', category: 'Traditional' },
];

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 
  'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 
  'Mannar', 'Matale', 'Matara', 'Moneragala', 'Mullaitivu', 'Nuwara Eliya', 
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

export default function RegisterHarvestScreen({ navigation, route }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const editData = route.params?.editData;
  const docId = route.params?.docId;

  const [formData, setFormData] = useState({
    variety: '',
    quantityKg: '',
    bags: '0',
    grade: 'A',
    season: 'Maha',
    location: '',
    storageType: 'Home',
    ventilation: 'Good',
    moisture: '',
    pestCheck: 'No',
    prodCost: '',
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        quantityKg: editData.quantityKg?.toString() || '',
        bags: editData.bags?.toString() || '0',
        prodCost: editData.prodCost?.toString() || '',
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

  const handleComplete = async () => {
    if (!formData.prodCost) { Alert.alert("Missing Info", "Please enter production cost."); return; }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        userId: auth.currentUser?.uid || 'anonymous',
        quantityKg: parseFloat(formData.quantityKg) || 0,
        bags: parseFloat(formData.bags) || 0,
        prodCost: parseFloat(formData.prodCost) || 0,
        updatedAt: new Date(),
      };

      if (docId) {
        await db.collection('harvests').doc(docId).update(payload);
        Alert.alert("Success", "Harvest updated!");
      } else {
        await db.collection('harvests').add({ ...payload, createdAt: new Date() });
        Alert.alert("Success", "Harvest registered!");
      }
      navigation.goBack();
    } catch (error) {
      console.log("Firebase Error Log:", error);
      Alert.alert("Permission Error", "Please ensure you have updated the Firestore Rules in the Firebase Console.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.variety) { Alert.alert("Required", "Select a variety."); return; }
    if (step === 1 && !formData.quantityKg) { Alert.alert("Required", "Enter quantity."); return; }
    if (step === 2 && !formData.location) { Alert.alert("Required", "Select a district."); return; }
    setStep(step + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{docId ? "Edit Stock" : "New Harvest Entry"}</Text>
        <View style={styles.progressRow}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.progressDot, step >= i && styles.progressDotActive]} />
          ))}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>1. Variety & Yield</Text>
              <View style={styles.grid}>
                {RICE_VARIETIES.map(v => (
                  <TouchableOpacity key={v.id} style={[styles.tile, formData.variety === v.name && styles.tileActive]} onPress={() => setFormData({...formData, variety: v.name})}>
                    <MaterialCommunityIcons name={v.icon} size={24} color={formData.variety === v.name ? '#fff' : '#16a34a'} />
                    <Text style={[styles.tileLabel, formData.variety === v.name && {color: '#fff'}]}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.row}>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Weight (KG)</Text>
                  <TextInput style={styles.textInput} keyboardType="numeric" onChangeText={handleQuantityChange} value={formData.quantityKg} placeholder="e.g. 1500" />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Bags (50kg)</Text>
                  <View style={styles.readonlyInput}><Text style={styles.readonlyText}>{formData.bags}</Text></View>
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>2. Location & Storage</Text>
              <Text style={styles.label}>Select District</Text>
              <View style={styles.chipGrid}>
                {DISTRICTS.map(d => (
                  <TouchableOpacity key={d} style={[styles.smallChip, formData.location === d && styles.smallChipActive]} onPress={() => setFormData({...formData, location: d})}>
                    <Text style={[styles.smallChipText, formData.location === d && {color: '#fff'}]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>3. Conditions</Text>
                <Text style={styles.label}>Moisture Content (%)</Text>
                <TextInput style={styles.textInput} keyboardType="numeric" placeholder="14" value={formData.moisture} onChangeText={(v) => setFormData({...formData, moisture: v})} />
            </View>
          )}

          {step === 4 && (
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>4. Financials</Text>
                <Text style={styles.label}>Production Cost (LKR/KG)</Text>
                <TextInput style={styles.textInput} keyboardType="numeric" placeholder="110" value={formData.prodCost} onChangeText={(v) => setFormData({...formData, prodCost: v})} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FIXED FOOTER - No absolute positioning, fits all screens */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? navigation.goBack() : setStep(step - 1)}>
          <Text style={styles.backBtnText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={step === 4 ? handleComplete : nextStep}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>{step === 4 ? 'Complete' : 'Next'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  progressRow: { flexDirection: 'row', marginTop: 10 },
  progressDot: { height: 4, flex: 1, backgroundColor: '#e2e8f0', borderRadius: 2, marginRight: 4 },
  progressDotActive: { backgroundColor: '#16a34a' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 3, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#16a34a', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginTop: 15, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '48%', backgroundColor: '#f8fafc', padding: 15, borderRadius: 15, marginBottom: 10, alignItems: 'center' },
  tileActive: { backgroundColor: '#16a34a' },
  tileLabel: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginTop: 5 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  smallChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, marginBottom: 8 },
  smallChipActive: { backgroundColor: '#16a34a' },
  smallChipText: { fontSize: 12, color: '#475569' },
  row: { flexDirection: 'row', alignItems: 'center' },
  inputWrap: { flex: 1, marginRight: 10 },
  textInput: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12, fontSize: 16 },
  readonlyInput: { backgroundColor: '#e2e8f0', padding: 15, borderRadius: 12, alignItems: 'center' },
  readonlyText: { fontSize: 18, fontWeight: 'bold', color: '#475569' },
  footer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
  backBtn: { flex: 1, alignItems: 'center' },
  backBtnText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 16 },
  nextBtn: { flex: 2, backgroundColor: '#16a34a', padding: 16, borderRadius: 15, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});