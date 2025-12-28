import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Dimensions, FlatList, TextInput 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function MarketTrackingScreen() {
  const [selectedVariety, setSelectedVariety] = useState('Bg 300');
  const [district, setDistrict] = useState('Anuradhapura');

  // Real-time Market Data (Dec 2025 Context)
  const marketPrices = [
    { id: '1', location: 'Anuradhapura DEC', price: 145, change: '+2%', trend: 'up' },
    { id: '2', location: 'Colombo Wholesale', price: 158, change: '+5%', trend: 'up' },
    { id: '3', location: 'Polonnaruwa', price: 142, change: '-1%', trend: 'down' },
    { id: '4', location: 'Your District', price: 147, change: '+3%', trend: 'up' },
  ];

  const marketInsights = [
    { id: 'i1', icon: 'star-face', text: "Demand increasing due to Thai Pongal festival (Jan 14).", color: '#f59e0b' },
    { id: 'i2', icon: 'alert-decagram', text: "Maha season harvest starting in 3 weeks - temporary price dip expected.", color: '#ef4444' },
    { id: 'i3', icon: 'bank-outline', text: "Paddy Marketing Board (PMB) guaranteed price set at 125 LKR.", color: '#16a34a' },
    { id: 'i4', icon: 'weather-pouring', text: "Cyclone Ditwah damage in East has reduced local supply - prices rising.", color: '#2563eb' },
  ];

  return (
    <View style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Live Market Prices</Text>
          <TouchableOpacity style={styles.refreshBtn}>
            <Text style={styles.updateTime}>2 mins ago</Text>
            <MaterialCommunityIcons name="cached" size={18} color="#16a34a" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterDropdown}>
            <Text style={styles.filterText}>{district}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterDropdown}>
            <Text style={styles.filterText}>{selectedVariety}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* --- PRICE COMPARISON TABLE --- */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Regional Comparison (Paddy)</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Location</Text>
            <Text style={[styles.th, { flex: 1 }]}>Price/KG</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Trend</Text>
          </View>
          {marketPrices.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 2, fontWeight: '600' }]}>{item.location}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{item.price} LKR</Text>
              <View style={[styles.td, { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }]}>
                <Text style={{ color: item.trend === 'up' ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>
                  {item.change} {item.trend === 'up' ? '📈' : '📉'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* --- PRICE TREND CHART (Visual Simulation) --- */}
        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardHeader}>90-Day Price Trend</Text>
            <View style={styles.chartControls}>
              {['30D', '90D', '180D'].map(v => (
                <Text key={v} style={[styles.controlText, v === '90D' && styles.activeControl]}>{v}</Text>
              ))}
            </View>
          </View>
          <View style={styles.chartView}>
            {/* Visual markers for Festivals/Harvests */}
            <View style={styles.chartLine} />
            <View style={[styles.marker, { left: '20%' }]}><Text style={styles.markerText}>Cyclone</Text></View>
            <View style={[styles.marker, { left: '80%', backgroundColor: '#f59e0b' }]}><Text style={styles.markerText}>Pongal</Text></View>
          </View>
        </View>

        {/* --- PRICE FORECAST CARD --- */}
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <MaterialCommunityIcons name="brain" size={24} color="#16a34a" />
            <Text style={styles.forecastTitle}>7-Day AI Forecast</Text>
          </View>
          <View style={styles.forecastRow}>
            <View>
              <Text style={styles.forecastRange}>145 - 152 LKR</Text>
              <Text style={styles.forecastLabel}>Expected Range</Text>
            </View>
            <View style={styles.peakBadge}>
              <Text style={styles.peakText}>Peak in 10 Days</Text>
            </View>
          </View>
          <Text style={styles.forecastInsight}>
            Prices expected to peak mid-January. Consider holding for <Text style={{color: '#16a34a', fontWeight: 'bold'}}>+8% profit</Text>.
          </Text>
        </LinearGradient>

        {/* --- MARKET INSIGHTS --- */}
        <Text style={styles.sectionTitle}>Market Insights</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.insightScroll}>
          {marketInsights.map(insight => (
            <View key={insight.id} style={[styles.insightCard, { borderLeftColor: insight.color }]}>
              <MaterialCommunityIcons name={insight.icon} size={24} color={insight.color} />
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* --- PRICE ALERTS SETUP --- */}
        <View style={styles.alertCard}>
          <View style={styles.alertTop}>
            <Text style={styles.alertTitle}>Smart Price Alerts</Text>
            <MaterialCommunityIcons name="bell-plus-outline" size={24} color="#16a34a" />
          </View>
          <View style={styles.alertRow}>
            <Text style={styles.alertLabel}>Alert at (LKR/KG)</Text>
            <TextInput style={styles.alertInput} placeholder="160" keyboardType="numeric" />
          </View>
          <View style={styles.alertRow}>
            <Text style={styles.alertLabel}>Notify on 5% change</Text>
            <View style={styles.toggleActive}><View style={styles.toggleDot} /></View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center' },
  updateTime: { fontSize: 12, color: '#94a3b8', marginRight: 5 },
  filterRow: { flexDirection: 'row', marginTop: 15 },
  filterDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 10 },
  filterText: { fontSize: 13, color: '#475569', fontWeight: '600', marginRight: 5 },

  scrollPadding: { padding: 20, paddingBottom: 50 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 20, elevation: 2 },
  cardHeader: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  th: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  td: { fontSize: 14, color: '#1e293b' },

  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartControls: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 3 },
  controlText: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, color: '#64748b' },
  activeControl: { backgroundColor: '#fff', borderRadius: 6, color: '#16a34a', fontWeight: 'bold' },
  chartView: { height: 150, marginTop: 20, justifyContent: 'center' },
  chartLine: { height: 2, backgroundColor: '#e2e8f0', width: '100%' },
  marker: { position: 'absolute', top: 20, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#ef4444', borderRadius: 6 },
  markerText: { fontSize: 9, color: '#fff', fontWeight: 'bold' },

  forecastCard: { borderRadius: 24, padding: 20, marginBottom: 20 },
  forecastHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  forecastTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forecastRange: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  forecastLabel: { color: '#94a3b8', fontSize: 12 },
  peakBadge: { backgroundColor: 'rgba(22, 163, 74, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#16a34a' },
  peakText: { color: '#16a34a', fontWeight: 'bold', fontSize: 11 },
  forecastInsight: { color: '#e2e8f0', marginTop: 15, fontSize: 13, lineHeight: 20 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  insightScroll: { marginBottom: 25 },
  insightCard: { backgroundColor: '#fff', width: 220, padding: 15, borderRadius: 16, borderLeftWidth: 4, marginRight: 15, elevation: 2 },
  insightText: { fontSize: 12, color: '#475569', marginTop: 10, lineHeight: 18 },

  alertCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2 },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  alertLabel: { fontSize: 14, color: '#64748b' },
  alertInput: { backgroundColor: '#f1f5f9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, width: 80, textAlign: 'right', fontWeight: 'bold' },
  toggleActive: { width: 45, height: 24, backgroundColor: '#16a34a', borderRadius: 12, padding: 2, alignItems: 'flex-end' },
  toggleDot: { width: 20, height: 20, backgroundColor: '#fff', borderRadius: 10 }
});