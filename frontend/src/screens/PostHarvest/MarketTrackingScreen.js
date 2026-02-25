import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, RefreshControl, Modal, Animated,
  SafeAreaView, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- CONSTANTS ---
const RICE_VARIETIES = [
  'All', 'Samba', 'Nadu', 'Basmati', 'Red Rice', 'Kekulu',
  'Suwandel', 'Rathu Heenati', 'Madathawalu', 'BG 300', 'BG 352'
];

const DISTRICTS = [
  'All Districts', 'Colombo', 'Anuradhapura', 'Polonnaruwa',
  'Kurunegala', 'Ampara', 'Batticaloa', 'Hambantota', 'Kandy'
];

const BASE_PRICES = {
  'Samba': 230, 'Nadu': 195, 'Basmati': 650, 'Red Rice': 185,
  'Kekulu': 175, 'Suwandel': 450, 'Rathu Heenati': 480, 'Madathawalu': 210,
  'BG 300': 190, 'BG 352': 192, 'AT 361': 188
};

export default function MarketTrackingScreen({ navigation }) {
  const [selectedVariety, setSelectedVariety] = useState('All');
  const [district, setDistrict] = useState('All Districts');
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [priceChanges, setPriceChanges] = useState({});

  const [showVarietyModal, setShowVarietyModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const fetchLiveMarketData = useCallback(async () => {
    try {
      // Simulation of market volatility grounded in USD rate
      const forexResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const forexData = await forexResponse.json();
      const lkrRate = forexData.rates.LKR || 320;

      const generatedPrices = [];
      const varietiesToUse = selectedVariety === 'All' ? Object.keys(BASE_PRICES) : [selectedVariety];
      const districtsToUse = district === 'All Districts' ? DISTRICTS.slice(1) : [district];

      const count = district === 'All Districts' ? 15 : 5;

      for (let i = 0; i < count; i++) {
        const randVariety = varietiesToUse[Math.floor(Math.random() * varietiesToUse.length)];
        const randDistrict = districtsToUse[Math.floor(Math.random() * districtsToUse.length)];

        const base = BASE_PRICES[randVariety] || 200;
        const dollarImpact = (lkrRate - 300) * 0.15;
        const randomFluctuation = (Math.random() * 8) - 4;
        const finalPrice = Math.round(base + dollarImpact + randomFluctuation);

        const trend = Math.random() > 0.4 ? 'up' : 'down';
        const changeAmt = (Math.random() * 1.5).toFixed(1);

        generatedPrices.push({
          id: `${randVariety}-${randDistrict}-${i}`,
          variety: randVariety,
          district: randDistrict,
          location: `${randDistrict} Economic Center`,
          price: finalPrice,
          trend: trend,
          change: `${trend === 'up' ? '+' : '-'}${changeAmt}`,
        });
      }

      generatedPrices.sort((a, b) => b.price - a.price);

      const changes = {};
      generatedPrices.forEach(p => changes[p.id] = true);
      setPriceChanges(changes);
      setTimeout(() => setPriceChanges({}), 1500);

      setMarketPrices(generatedPrices);
      setConnectionStatus('connected');
      setLoading(false);
      setRefreshing(false);

    } catch (error) {
      setConnectionStatus('disconnected');
    }
  }, [selectedVariety, district]);

  useEffect(() => {
    fetchLiveMarketData();
    const intervalId = setInterval(fetchLiveMarketData, 8000);
    return () => clearInterval(intervalId);
  }, [fetchLiveMarketData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveMarketData();
  };

  const avgPrice = marketPrices.reduce((sum, item) => sum + item.price, 0) / (marketPrices.length || 1);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#064e3b', '#022c22']} style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Market Intelligence</Text>
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }], backgroundColor: connectionStatus === 'connected' ? '#34d399' : '#facc15' }]} />
              <Text style={styles.liveText}>{connectionStatus === 'connected' ? 'LIVE FEED UPDATING' : 'RECONNECTING'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.filterPill} onPress={() => setShowDistrictModal(true)}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#34d399" />
            <Text style={styles.filterText} numberOfLines={1}>{district}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterPill} onPress={() => setShowVarietyModal(true)}>
            <MaterialCommunityIcons name="rice" size={14} color="#34d399" />
            <Text style={styles.filterText} numberOfLines={1}>{selectedVariety}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#34d399" />
          <Text style={styles.loadingText}>Synchronizing with Economic Centers...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34d399" />}
        >
          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>AVG PRICE</Text>
              <Text style={styles.statValue}>Rs.{Math.round(avgPrice)}</Text>
              <Text style={styles.statSub}>Per KG (LKR)</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MARKET VOLATILITY</Text>
              <Text style={[styles.statValue, { color: '#34d399' }]}>STABLE</Text>
              <Text style={styles.statSub}>Research Outlook</Text>
            </View>
          </View>

          {/* Ticker Cards */}
          <Text style={styles.sectionTitle}>Real-time Price Index</Text>
          {marketPrices.map(item => (
            <Animated.View key={item.id} style={[styles.priceCard, priceChanges[item.id] && styles.highlightCard]}>
              <View style={styles.cardMain}>
                <View style={styles.locIcon}>
                  <MaterialCommunityIcons name="storefront-outline" size={20} color="#64748b" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.varietyName}>{item.variety}</Text>
                  <Text style={styles.locationName}>{item.location}</Text>
                </View>
              </View>
              <View style={styles.cardSide}>
                <Text style={styles.priceValue}>Rs.{item.price}</Text>
                <View style={styles.trendBox}>
                  <MaterialCommunityIcons
                    name={item.trend === 'up' ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={item.trend === 'up' ? '#34d399' : '#f87171'}
                  />
                  <Text style={[styles.trendText, { color: item.trend === 'up' ? '#34d399' : '#f87171' }]}>
                    {item.change}%
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}

          {/* AI Strategy Quick-Link */}
          <TouchableOpacity
            style={styles.strategyCard}
            onPress={() => navigation.navigate('PostHarvestAdvisor')}
          >
            <LinearGradient colors={['#1e1b4b', '#312e81']} style={styles.strategyGrad}>
              <MaterialCommunityIcons name="brain" size={24} color="#818cf8" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.strategyTitle}>Should you sell or wait?</Text>
                <Text style={styles.strategySub}>Let the AI Guardian analyze these market rates against your storage moisture.</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#818cf8" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modals */}
      <Modal visible={showVarietyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Variety</Text>
              <TouchableOpacity onPress={() => setShowVarietyModal(false)}><MaterialCommunityIcons name="close" size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView>
              {RICE_VARIETIES.map(v => (
                <TouchableOpacity key={v} style={styles.modalItem} onPress={() => { setSelectedVariety(v); setShowVarietyModal(false); }}>
                  <Text style={styles.modalItemText}>{v}</Text>
                  {selectedVariety === v && <MaterialCommunityIcons name="check" size={20} color="#34d399" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showDistrictModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose District</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}><MaterialCommunityIcons name="close" size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView>
              {DISTRICTS.map(d => (
                <TouchableOpacity key={d} style={styles.modalItem} onPress={() => { setDistrict(d); setShowDistrictModal(false); }}>
                  <Text style={styles.modalItemText}>{d}</Text>
                  {district === d && <MaterialCommunityIcons name="check" size={20} color="#34d399" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 14, marginRight: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  liveText: { color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  filterBar: { flexDirection: 'row', gap: 10 },
  filterPill: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  filterText: { color: '#f1f5f9', fontSize: 13, fontWeight: '600', marginLeft: 8, flex: 1 },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', fontSize: 14, marginTop: 16 },

  content: { padding: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#334155' },
  statLabel: { color: '#64748b', fontSize: 10, fontWeight: '800' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 },
  statSub: { color: '#475569', fontSize: 10, marginTop: 2 },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 16 },
  priceCard: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 22, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  highlightCard: { borderColor: '#34d399', backgroundColor: '#064e3b20' },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  locIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  varietyName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  locationName: { color: '#64748b', fontSize: 12, marginTop: 2 },
  cardSide: { alignItems: 'flex-end' },
  priceValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  trendBox: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  trendText: { fontSize: 12, fontWeight: '800' },

  strategyCard: { borderRadius: 24, overflow: 'hidden', marginTop: 12, marginBottom: 20 },
  strategyGrad: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  strategyTitle: { color: '#e0e7ff', fontSize: 15, fontWeight: '800' },
  strategySub: { color: '#818cf8', fontSize: 11, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalItemText: { color: '#f1f5f9', fontSize: 16, fontWeight: '600' },
});