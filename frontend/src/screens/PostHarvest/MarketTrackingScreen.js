import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, RefreshControl, Modal, Animated,
  SafeAreaView, StatusBar, StyleSheet as RNStyleSheet
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../firebase/firebaseConfig';
import useUniversalLocation from '../../utils/useUniversalLocation';

// Haversine formula to calculate distance in KM
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const deg2rad = (deg) => deg * (Math.PI / 180);

const { width } = Dimensions.get('window');

const RICE_VARIETIES = [
  'All', 'Samba', 'Nadu', 'Basmati', 'Red Rice', 'Kekulu', 'Suwandel'
];

export default function MarketTrackingScreen({ navigation }) {
  const [selectedVariety, setSelectedVariety] = useState('All');
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Farmer's dynamic location
  const { latitude: userLat, longitude: userLon } = useUniversalLocation();

  const [showVarietyModal, setShowVarietyModal] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Map Modal State
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedDealerLoc, setSelectedDealerLoc] = useState(null);

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

  useEffect(() => {
    fetchMarketData();
  }, [selectedVariety]);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      let query = db.collection('marketPrices').orderBy('updatedAt', 'desc');

      if (selectedVariety !== 'All') {
        query = query.where('variety', '==', selectedVariety);
      }

      const snapshot = await query.limit(20).get();
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setMarketPrices(list);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMarketData();
  };

  const avgPrice = marketPrices.length > 0
    ? marketPrices.reduce((sum, item) => sum + item.price, 0) / marketPrices.length
    : 0;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#064e3b', '#022c22']} style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Dealer Prices</Text>
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }], backgroundColor: '#34d399' }]} />
              <Text style={styles.liveText}>LIVE DEALER FEED</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.filterPill} onPress={() => setShowVarietyModal(true)}>
            <MaterialCommunityIcons name="rice" size={14} color="#34d399" />
            <Text style={styles.filterText} numberOfLines={1}>{selectedVariety} Variety</Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="#34d399" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#34d399" />
          <Text style={styles.loadingText}>Fetching latest dealer quotes...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34d399" />}
        >
          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>AVG MARKET PRICE</Text>
              <Text style={styles.statValue}>Rs.{Math.round(avgPrice)}</Text>
              <Text style={styles.statSub}>Per KG (LKR)</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MARKET STATUS</Text>
              <Text style={[styles.statValue, { color: '#34d399' }]}>ACTIVE</Text>
              <Text style={styles.statSub}>{marketPrices.length} Dealers Online</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Current Offers</Text>

          {marketPrices.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="storefront-remove" size={48} color="#334155" />
              <Text style={styles.emptyText}>No dealer offers found for this variety today.</Text>
            </View>
          ) : (
            marketPrices.map(item => (
              <View key={item.id} style={styles.priceCard}>
                <View style={styles.cardMain}>
                  <View style={styles.locIcon}>
                    <MaterialCommunityIcons name="storefront" size={24} color="#10b981" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.dealerName}>{item.dealerName}</Text>
                    <View style={styles.tagRow}>
                      <View style={styles.tag}><Text style={styles.tagText}>{item.variety}</Text></View>
                      <View style={[styles.tag, { backgroundColor: '#e0f2f1' }]}><Text style={[styles.tagText, { color: '#00796b' }]}>{item.grade}</Text></View>
                    </View>

                    {item.latitude && (
                      <TouchableOpacity
                        style={styles.mapBtn}
                        onPress={() => {
                          setSelectedDealerLoc(item);
                          setMapVisible(true);
                        }}
                      >
                        <MaterialCommunityIcons name="google-maps" size={16} color="#10b981" />
                        <Text style={styles.mapBtnText}>View Pickup Location</Text>
                      </TouchableOpacity>
                    )}

                    {/* Transport & Distance Logic */}
                    <View style={styles.logisticsBox}>
                      {item.latitude && userLat ? (
                        <View style={styles.logisticRow}>
                          <MaterialCommunityIcons name="map-marker-distance" size={14} color="#64748b" />
                          <Text style={styles.logisticText}>
                            {calculateDistance(userLat, userLon, item.latitude, item.longitude).toFixed(1)} km away
                          </Text>
                        </View>
                      ) : null}

                      {item.hasTransport ? (
                        <View style={[styles.logisticRow, { marginTop: 4 }]}>
                          <MaterialCommunityIcons name="truck-delivery" size={14} color="#059669" />
                          <Text style={[styles.logisticText, { color: '#059669', fontWeight: '700' }]}>
                            Transport: Rs.{item.transportCostPerKm}/km
                            {item.latitude && userLat && (
                              <Text style={{ color: '#065f46' }}>
                                {" "}(Est. Rs.{(calculateDistance(userLat, userLon, item.latitude, item.longitude) * item.transportCostPerKm).toFixed(0)})
                              </Text>
                            )}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.logisticRow, { marginTop: 4 }]}>
                          <MaterialCommunityIcons name="account-clock" size={14} color="#64748b" />
                          <Text style={styles.logisticText}>Farmer pickup only</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.cardSide}>
                  <Text style={styles.priceValue}>Rs.{item.price}</Text>
                  <Text style={styles.priceUnit}>per KG</Text>
                  <Text style={styles.timeTag}>{new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            ))
          )}

          {/* AI Strategy Quick-Link */}
          <TouchableOpacity
            style={styles.strategyCard}
            onPress={() => navigation.navigate('PostHarvestAdvisor')}
          >
            <LinearGradient colors={['#1e1b4b', '#312e81']} style={styles.strategyGrad}>
              <MaterialCommunityIcons name="brain" size={24} color="#818cf8" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.strategyTitle}>Price Analysis</Text>
                <Text style={styles.strategySub}>Let AI compare these prices with your storage costs to determine the best time to sell.</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#818cf8" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Select Variety Modal */}
      <Modal visible={showVarietyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Variety</Text>
              <TouchableOpacity onPress={() => setShowVarietyModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {RICE_VARIETIES.map(v => (
                <TouchableOpacity
                  key={v}
                  style={styles.modalItem}
                  onPress={() => { setSelectedVariety(v); setShowVarietyModal(false); }}
                >
                  <Text style={styles.modalItemText}>{v}</Text>
                  {selectedVariety === v && <MaterialCommunityIcons name="check" size={20} color="#34d399" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Map Modal */}
      <Modal visible={mapVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%', padding: 0 }]}>
            <View style={[styles.modalHeader, { padding: 20 }]}>
              <View>
                <Text style={styles.modalTitle}>{selectedDealerLoc?.dealerName}</Text>
                <Text style={styles.modalSub}>{selectedDealerLoc?.location}</Text>
              </View>
              <TouchableOpacity onPress={() => setMapVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={30} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedDealerLoc && (
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: selectedDealerLoc.latitude,
                  longitude: selectedDealerLoc.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: selectedDealerLoc.latitude,
                    longitude: selectedDealerLoc.longitude,
                  }}
                  title={selectedDealerLoc.dealerName}
                  description="Pickup Location"
                />
                {userLat && (
                  <Marker
                    coordinate={{ latitude: userLat, longitude: userLon }}
                    title="Your Location"
                    pinColor="blue"
                  />
                )}
              </MapView>
            )}

            <View style={styles.mapFooter}>
              <Text style={styles.footerNote}>Use this location to plan your transport route.</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 14, marginRight: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  liveText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  filterBar: { flexDirection: 'row' },
  filterPill: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 8, flex: 1 },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', fontSize: 14, marginTop: 16 },

  content: { padding: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statLabel: { color: '#64748b', fontSize: 10, fontWeight: '800' },
  statValue: { color: '#1e293b', fontSize: 22, fontWeight: '900', marginTop: 4 },
  statSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },

  sectionTitle: { color: '#1e293b', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  priceCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, alignItems: 'flex-start' },
  cardMain: { flex: 1, flexDirection: 'row' },
  locIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  dealerName: { color: '#1e293b', fontSize: 16, fontWeight: '800' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: { backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  tagText: { color: '#475569', fontSize: 10, fontWeight: '700' },

  cardSide: { alignItems: 'flex-end', marginLeft: 15 },
  priceValue: { color: '#10b981', fontSize: 20, fontWeight: '900' },
  priceUnit: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  timeTag: { color: '#cbd5e1', fontSize: 10, marginTop: 4, fontWeight: '700' },

  logisticsBox: { marginTop: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  logisticRow: { flexDirection: 'row', alignItems: 'center' },
  logisticText: { color: '#64748b', fontSize: 12, marginLeft: 6, fontWeight: '500' },

  mapBtn: { marginTop: 12, backgroundColor: '#f0fdf4', padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  mapBtnText: { color: '#059669', fontSize: 11, fontWeight: '800', marginLeft: 6 },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 10, fontSize: 14 },

  strategyCard: { borderRadius: 24, overflow: 'hidden', marginTop: 12, marginBottom: 20 },
  strategyGrad: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  strategyTitle: { color: '#e0e7ff', fontSize: 15, fontWeight: '800' },
  strategySub: { color: '#818cf8', fontSize: 11, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#1e293b', fontSize: 18, fontWeight: '900' },
  modalSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalItemText: { color: '#1e293b', fontSize: 15, fontWeight: '600' },

  mapFooter: { padding: 20, backgroundColor: '#f8fafc', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  footerNote: { color: '#64748b', fontSize: 12, textAlign: 'center', fontWeight: '600' }
});
