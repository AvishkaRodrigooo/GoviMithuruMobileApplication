import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function PostHarvestScreen({ navigation }) {
  const [moisture, setMoisture] = useState('14'); // Average moisture %

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
     
        <Text style={styles.headerTitle}>Post-Harvest Analysis</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Yield Input Section */}
        <View style={styles.inputCard}>
          <Text style={styles.cardLabel}>Enter Harvest Moisture Content (%)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={moisture}
              onChangeText={setMoisture}
              placeholder="e.g. 14"
            />
            <View style={[styles.badge, { backgroundColor: parseInt(moisture) > 14 ? '#fee2e2' : '#dcfce7' }]}>
              <Text style={{ color: parseInt(moisture) > 14 ? '#ef4444' : '#16a34a', fontWeight: 'bold' }}>
                {parseInt(moisture) > 14 ? 'High Risk' : 'Safe'}
              </Text>
            </View>
          </View>
        </View>

        {/* Weather-Based Storage Advice (Using your Weather Research) */}
        <Text style={styles.sectionTitle}>Storage Environment</Text>
        <View style={styles.weatherCard}>
          <View style={styles.weatherInfo}>
            <MaterialCommunityIcons name="thermometer" size={30} color="#ea580c" />
            <View>
              <Text style={styles.weatherVal}>31°C</Text>
              <Text style={styles.weatherLabel}>Outside Temp</Text>
            </View>
          </View>
          <View style={styles.dividerV} />
          <View style={styles.weatherInfo}>
            <MaterialCommunityIcons name="water-percent" size={30} color="#2563eb" />
            <View>
              <Text style={styles.weatherVal}>82%</Text>
              <Text style={styles.weatherLabel}>Humidity</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.adviceBox}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#854d0e" />
          <Text style={styles.adviceText}>
            High humidity detected (82%). Ensure proper ventilation in the storage room to prevent mold growth in Nadu rice varieties.
          </Text>
        </View>

        {/* Market Pricing Insights (Using your 10-Year Price Research) */}
        <Text style={styles.sectionTitle}>Market Selling Strategy</Text>
        <View style={styles.priceInsightCard}>
          <View style={styles.priceHeader}>
            <Text style={styles.varietyText}>Samba Rice (Grade II)</Text>
            <Text style={styles.trendText}>+12% Forecast</Text>
          </View>
          <Text style={styles.currentPrice}>Current Market: <Text style={{color: '#111827'}}>Rs. 235.00/kg</Text></Text>
          
          <View style={styles.chartPlaceholder}>
            {/* Visual representation of your 10-year research trend */}
            <View style={[styles.bar, {height: 40, backgroundColor: '#e5e7eb'}]} />
            <View style={[styles.bar, {height: 60, backgroundColor: '#e5e7eb'}]} />
            <View style={[styles.bar, {height: 100, backgroundColor: '#16a34a'}]} />
            <View style={[styles.bar, {height: 80, backgroundColor: '#16a34a', opacity: 0.5}]} />
          </View>
          <Text style={styles.predictionText}>
            Based on 10-year historical trends, prices usually peak in February. <Text style={{fontWeight: 'bold', color: '#16a34a'}}>Recommendation: Hold for 4 weeks.</Text>
          </Text>
        </View>

        {/* Action Buttons */}
        <Pressable style={styles.primaryBtn}>
          <Text style={styles.btnText}>Generate Full Yield Report</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 12, marginTop: 10 },
  
  // Input Card
  inputCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 },
  cardLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { fontSize: 24, fontWeight: 'bold', color: '#111827', width: '60%' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },

  // Weather Card
  weatherCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    justifyContent: 'space-around',
    elevation: 2 
  },
  weatherInfo: { alignItems: 'center' },
  weatherVal: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  weatherLabel: { fontSize: 12, color: '#6b7280' },
  dividerV: { width: 1, height: '100%', backgroundColor: '#e5e7eb' },

  adviceBox: { 
    backgroundColor: '#fefce8', 
    padding: 15, 
    borderRadius: 12, 
    flexDirection: 'row', 
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fef08a'
  },
  adviceText: { fontSize: 13, color: '#854d0e', flex: 1, marginLeft: 10, lineHeight: 18 },

  // Price Card
  priceInsightCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginTop: 5, elevation: 2 },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  varietyText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  trendText: { color: '#16a34a', fontWeight: 'bold', fontSize: 13 },
  currentPrice: { fontSize: 14, color: '#6b7280', marginBottom: 15 },
  chartPlaceholder: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  bar: { width: 30, borderRadius: 4 },
  predictionText: { fontSize: 13, color: '#4b5563', lineHeight: 20 },

  primaryBtn: { backgroundColor: '#16a34a', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});