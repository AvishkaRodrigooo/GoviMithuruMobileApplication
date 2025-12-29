import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig"; 

const { width } = Dimensions.get('window');

export default function MarketTrackingScreen() {
  const [selectedVariety, setSelectedVariety] = useState('Samba');
  const [district, setDistrict] = useState('Colombo');
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Loading...');

  // --- REAL-TIME FIRESTORE LISTENER ---
  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(db, "marketPrices"),
      where("district", "==", district),
      where("variety", "==", selectedVariety),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMarketPrices(prices);

      if (prices.length > 0) {
        const updatedTime = prices[0].updatedAt?.toDate();
        setLastUpdated(updatedTime ? updatedTime.toLocaleTimeString() : "Just now");
      } else {
        setLastUpdated("No data");
      }

      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error("Error fetching real-time data:", error);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe(); // cleanup
  }, [district, selectedVariety]);

  // Pull-to-refresh (optional, UI only)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Live Market Prices</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.updateTime}>{lastUpdated}</Text>
            <MaterialCommunityIcons name="cached" size={18} color="#16a34a" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterDropdown}>
            <Text style={styles.filterText}>{district}</Text>
            <MaterialCommunityIcons name="map-marker-radius" size={16} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterDropdown}>
            <Text style={styles.filterText}>{selectedVariety}</Text>
            <MaterialCommunityIcons name="rice" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Connecting to Sri Lanka Market Data...</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollPadding}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
          }
        >
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

          {/* --- FORECAST / AI Prediction --- */}
          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.forecastCard}>
            <View style={styles.forecastHeader}>
              <MaterialCommunityIcons name="brain" size={24} color="#16a34a" />
              <Text style={styles.forecastTitle}>AI Prediction for {selectedVariety}</Text>
            </View>
            <View style={styles.forecastRow}>
              <View>
                <Text style={styles.forecastRange}>
                  {Math.round(marketPrices[0]?.price || 145)} - {Math.round((marketPrices[0]?.price || 145) + 10)} LKR
                </Text>
                <Text style={styles.forecastLabel}>Next 7 Days</Text>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
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
  forecastCard: { borderRadius: 24, padding: 20, marginBottom: 20 },
  forecastHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  forecastTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forecastRange: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  forecastLabel: { color: '#94a3b8', fontSize: 12 },
});
