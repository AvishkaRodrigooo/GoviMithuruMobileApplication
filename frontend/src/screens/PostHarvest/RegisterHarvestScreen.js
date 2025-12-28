import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, 
  Dimensions, Image, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function RegisterHarvestScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    variety: 'Bg 352',
    harvestDate: new Date().toLocaleDateString(),
    quantityKg: '',
    bags: '0',
    grade: 'A',
    season: '',
    location: 'Anuradhapura',
    storageType: 'Home',
    facilityName: '',
    ventilation: 'Good',
    moisture: '',
    pestCheck: 'No',
    temp: '',
    humidity: '',
    prodCost: '',
    profitMargin: '',
    urgency: 'Medium'
  });

  // Logic: Auto-detect Season (Sri Lanka)
  // Maha: Sept - March | Yala: May - August
  useEffect(() => {
    const month = new Date().getMonth() + 1;
    let detectedSeason = (month >= 5 && month <= 8) ? 'Yala' : 'Maha';
    setFormData(prev => ({ ...prev, season: detectedSeason }));
  }, []);

  // Logic: Kg to Bags Conversion
  const handleQuantityChange = (val) => {
    const kgs = parseFloat(val) || 0;
    const calculatedBags = (kgs / 50).toFixed(1);
    setFormData(prev => ({ ...prev, quantityKg: val, bags: calculatedBags }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Harvest registered and AI analysis started!");
      navigation.navigate('Home');
    }, 2000);
  };

  // UI Components
  const ProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.progressStep}>
          <View style={[styles.dot, step >= i ? styles.activeDot : styles.inactiveDot]}>
            {step > i ? <MaterialCommunityIcons name="check" size={12} color="#fff" /> : 
             <Text style={[styles.dotText, step >= i && {color: '#fff'}]}>{i}</Text>}
          </View>
          {i < 4 && <View style={[styles.line, step > i ? styles.activeLine : styles.inactiveLine]} />}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Harvest Entry</Text>
        <ProgressBar />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* STEP 1: HARVEST DETAILS */}
        {step === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Harvest Details</Text>
            
            <Text style={styles.label}>Rice Variety</Text>
            <View style={styles.pickerContainer}>
              <MaterialCommunityIcons name="seed" size={20} color="#16a34a" />
              <TextInput style={styles.inputField} value={formData.variety} editable={false} />
              {/* Note: In production, use a Modal or Picker here */}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Quantity (KG)</Text>
                <TextInput 
                  style={styles.inputField} 
                  keyboardType="numeric" 
                  placeholder="0"
                  onChangeText={handleQuantityChange}
                  value={formData.quantityKg}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Est. Bags (50kg)</Text>
                <TextInput style={[styles.inputField, {backgroundColor: '#f3f4f6'}]} value={formData.bags} editable={false} />
              </View>
            </View>

            <Text style={styles.label}>Quality Grade</Text>
            <View style={styles.gradeContainer}>
              {['A', 'B', 'C'].map(g => (
                <TouchableOpacity 
                  key={g} 
                  style={[styles.gradeBtn, formData.grade === g && styles.activeGrade]}
                  onPress={() => setFormData({...formData, grade: g})}
                >
                  <Text style={[styles.gradeText, formData.grade === g && {color: '#fff'}]}>Grade {g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#16a34a" />
              <Text style={styles.infoText}>Season auto-detected as: {formData.season} (based on date)</Text>
            </View>
          </View>
        )}

        {/* STEP 2: STORAGE DETAILS */}
        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Storage Details</Text>
            
            <Text style={styles.label}>Storage Type</Text>
            <View style={styles.rowWrap}>
              {['Home', 'Warehouse', 'Co-op'].map(t => (
                <TouchableOpacity 
                  key={t} 
                  style={[styles.chip, formData.storageType === t && styles.activeChip]}
                  onPress={() => setFormData({...formData, storageType: t})}
                >
                  <Text style={formData.storageType === t ? {color:'#fff'} : {color:'#666'}}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Ventilation Quality</Text>
            <View style={styles.rowWrap}>
              {['Good', 'Average', 'Poor'].map(v => (
                <TouchableOpacity 
                  key={v} 
                  style={[styles.chip, formData.ventilation === v && styles.activeChip]}
                  onPress={() => setFormData({...formData, ventilation: v})}
                >
                  <Text style={formData.ventilation === v ? {color:'#fff'} : {color:'#666'}}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.photoBtn}>
              <MaterialCommunityIcons name="camera" size={24} color="#16a34a" />
              <Text style={styles.photoBtnText}>Upload Storage Photo for AI Analysis</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: INITIAL CONDITIONS */}
        {step === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Initial Conditions</Text>
            
            <Text style={styles.label}>Moisture Content (%)</Text>
            <TextInput style={styles.inputField} placeholder="e.g. 13.5" keyboardType="numeric" />

            <View style={styles.row}>
              <View style={{flex:1, marginRight:10}}>
                <Text style={styles.label}>Temp (°C)</Text>
                <TextInput style={styles.inputField} placeholder="30" keyboardType="numeric" />
              </View>
              <View style={{flex:1}}>
                <Text style={styles.label}>Humidity (%)</Text>
                <TextInput style={styles.inputField} placeholder="80" keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.label}>Pests Detected?</Text>
            <View style={styles.row}>
              {['Yes', 'No', 'Unsure'].map(p => (
                <TouchableOpacity 
                  key={p} 
                  style={[styles.gradeBtn, formData.pestCheck === p && styles.activeGrade]}
                  onPress={() => setFormData({...formData, pestCheck: p})}
                >
                  <Text style={[styles.gradeText, formData.pestCheck === p && {color: '#fff'}]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 4: FINANCIAL INFO */}
        {step === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Financial Strategy</Text>
            
            <Text style={styles.label}>Production Cost per KG (LKR)</Text>
            <TextInput style={styles.inputField} placeholder="e.g. 110" keyboardType="numeric" />

            <Text style={styles.label}>Urgency to Sell</Text>
            <View style={styles.row}>
              {['Low', 'Medium', 'High'].map(u => (
                <TouchableOpacity 
                  key={u} 
                  style={[styles.gradeBtn, formData.urgency === u && {backgroundColor: '#16a34a'}]}
                  onPress={() => setFormData({...formData, urgency: u})}
                >
                  <Text style={[styles.gradeText, formData.urgency === u && {color: '#fff'}]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Strategy Forecast</Text>
              <Text style={styles.summaryText}>
                Based on your {formData.variety} harvest and {formData.season} market trends, holding for 3 months may increase profit by 15%.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        {step > 1 ? (
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {step < 4 ? (
          <TouchableOpacity onPress={nextStep} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>Next Step</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleComplete} style={styles.completeBtn} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Register Harvest</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  
  // Progress Bar
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activeDot: { backgroundColor: '#16a34a' },
  inactiveDot: { backgroundColor: '#e5e7eb' },
  dotText: { fontSize: 10, color: '#9ca3af' },
  line: { width: 40, height: 3, marginHorizontal: 5 },
  activeLine: { backgroundColor: '#16a34a' },
  inactiveLine: { backgroundColor: '#e5e7eb' },

  scrollContent: { padding: 20 },
  stepCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2 },
  stepTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 15 },
  inputField: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 16 },
  pickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingLeft: 12 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  
  gradeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  gradeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', marginHorizontal: 4 },
  activeGrade: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  gradeText: { fontWeight: '600', color: '#374151' },
  
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 10, marginBottom: 10 },
  activeChip: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10, marginTop: 20 },
  infoText: { fontSize: 12, color: '#16a34a', marginLeft: 8 },
  
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#16a34a', borderRadius: 12, padding: 20, marginTop: 20 },
  photoBtnText: { marginLeft: 10, color: '#16a34a', fontWeight: 'bold' },

  summaryBox: { backgroundColor: '#eff6ff', padding: 15, borderRadius: 12, marginTop: 20 },
  summaryTitle: { fontWeight: 'bold', color: '#1e40af', marginBottom: 5 },
  summaryText: { fontSize: 13, color: '#1e40af', lineHeight: 18 },

  footer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  backBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  backBtnText: { color: '#6b7280', fontWeight: 'bold' },
  nextBtn: { flex: 2, backgroundColor: '#16a34a', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  completeBtn: { flex: 2, backgroundColor: '#111827', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: 'bold' }
});