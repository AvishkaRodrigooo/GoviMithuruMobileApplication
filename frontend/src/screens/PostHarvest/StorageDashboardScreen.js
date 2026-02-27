import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, SafeAreaView, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';

const { width } = Dimensions.get('window');

export default function StorageDashboardScreen({ navigation, route }) {
  const [locations, setLocations] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [totals, setTotals] = useState({ kg: 0, bags: 0, value: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // 1. Fetch Storage Locations (The 3 warehouses etc)
        const locSnap = await db.collection('storageLocations').where('userId', '==', uid).get();
        const locList = locSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLocations(locList);

        // 2. Fetch Harvests
        const harvestUnsubscribe = db
          .collection('harvests')
          .where('userId', '==', uid)
          .onSnapshot(
            snapshot => {
              let kg = 0;
              let bags = 0;

              const list = snapshot.docs.map(doc => {
                const data = doc.data();
                kg += Number(data.quantityKg || 0);
                bags += Number(data.bags || 0);
                return { id: doc.id, ...data };
              });

              setHarvests(list);
              setTotals({
                kg: kg.toFixed(0),
                bags: bags.toFixed(1),
                value: (kg * 242).toLocaleString('en-LK'),
              });
              setLoading(false);
            },
            error => {
              console.error(error);
              setLoading(false);
            }
          );

        return harvestUnsubscribe;
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    const unsubscribe = fetchData();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleDelete = id => {
    Alert.alert(
      'Delete Harvest',
      'Are you sure you want to remove this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => db.collection('harvests').doc(id).delete(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>

        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <Text style={styles.hTitle}>Storage Center</Text>
          <Text style={styles.hSub}>Management Dashboard</Text>
        </View>

        {/* ================= TOTALS CARD ================= */}
        <LinearGradient colors={['#064e3b', '#022c22']} style={styles.mainTotalsCard}>
          <View style={styles.tRow}>
            <View>
              <Text style={styles.tLabel}>TOTAL ASSET VALUE</Text>
              <Text style={styles.tValue}>Rs. {totals.value}</Text>
            </View>
            <MaterialCommunityIcons name="finance" size={32} color="#34d399" />
          </View>
          <View style={styles.tStatsRow}>
            <View style={styles.tStat}>
              <Text style={styles.tStatVal}>{totals.kg}</Text>
              <Text style={styles.tStatLab}>KG STORED</Text>
            </View>
            <View style={styles.tDivider} />
            <View style={styles.tStat}>
              <Text style={styles.tStatVal}>{totals.bags}</Text>
              <Text style={styles.tStatLab}>TOTAL BAGS</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ================= AI GUARDIAN LINK ================= */}
        <TouchableOpacity
          style={styles.aiGuardianCard}
          onPress={() => navigation.navigate('PostHarvestAdvisor')}
        >
          <LinearGradient colors={['#1e1b4b', '#312e81']} style={styles.aiGuardianGrad}>
            <View style={styles.aiGuardianIcon}>
              <MaterialCommunityIcons name="brain" size={28} color="#818cf8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiGuardianTitle}>AI Post-Harvest Guardian</Text>
              <Text style={styles.aiGuardianSub}>Research-backed storage & price advisory</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#818cf8" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ================= QUICK ACTIONS ================= */}
        <View style={styles.actionHub}>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('RegisterHarvest')}>
            <View style={[styles.actionIconCell, { backgroundColor: '#064e3b30' }]}>
              <MaterialCommunityIcons name="plus" size={24} color="#34d399" />
            </View>
            <Text style={styles.actionText}>Add Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ConnectSensors')}>
            <View style={[styles.actionIconCell, { backgroundColor: '#1e3a8a30' }]}>
              <MaterialCommunityIcons name="wifi" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.actionText}>Sensors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('MarketTracking')}>
            <View style={[styles.actionIconCell, { backgroundColor: '#7c2d1230' }]}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#f97316" />
            </View>
            <Text style={styles.actionText}>Market</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('InventoryList')}>
            <View style={[styles.actionIconCell, { backgroundColor: '#4c1d9530' }]}>
              <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#a78bfa" />
            </View>
            <Text style={styles.actionText}>Inventory</Text>
          </TouchableOpacity>
        </View>

        {/* ================= BEGINNER GUIDE CONTENT ================= */}
        {route?.params?.userLevel === 'BEGINNER' && (
          <View style={styles.beginnerSection}>
            <Text style={styles.sectionTitle}>Beginner Decision Guide 🎓</Text>
            <Text style={styles.sectionSub}>Essential steps for successful storage</Text>

            <View style={styles.guideCard}>
              <View style={styles.guideStep}>
                <View style={styles.guideNumber}><Text style={styles.guideNumberText}>1</Text></View>
                <View style={styles.guideInfo}>
                  <Text style={styles.guideLabel}>Check Moisture (MC%)</Text>
                  <Text style={styles.guideDesc}>Ensure your paddy is at 13% MC. Above 14% causes rotting and fungus.</Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <View style={styles.guideNumber}><Text style={styles.guideNumberText}>2</Text></View>
                <View style={styles.guideInfo}>
                  <Text style={styles.guideLabel}>Select Correct Bags</Text>
                  <Text style={styles.guideDesc}>Use Hermetic (air-tight) bags for long storage. Use gunny bags only for few weeks.</Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <View style={styles.guideNumber}><Text style={styles.guideNumberText}>3</Text></View>
                <View style={styles.guideInfo}>
                  <Text style={styles.guideLabel}>Monitor Temperature</Text>
                  <Text style={styles.guideDesc}>Keep storage away from direct sunlight. Hot rice attracts weevils (ghun).</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ================= INTERMEDIATE CONTENT ================= */}
        {route?.params?.userLevel === 'INTERMEDIATE' && (
          <View style={styles.beginnerSection}>
            <Text style={styles.sectionTitle}>Monitoring Hub 🔍</Text>
            <Text style={styles.sectionSub}>Optimization & Loss Prevention</Text>
            <View style={[styles.guideCard, { borderColor: '#3b82f6' }]}>
              <Text style={[styles.guideLabel, { color: '#3b82f6' }]}>Pro Tip: Equilibrium Moisture</Text>
              <Text style={styles.guideDesc}>Your paddy interacts with air humidity. If RH is {'>'}70%, your rice will gain moisture even inside the bag. Monitor ambient RH!</Text>
            </View>
          </View>
        )}

        {/* ================= ADVANCED CONTENT ================= */}
        {route?.params?.userLevel === 'ADVANCED' && (
          <View style={styles.beginnerSection}>
            <Text style={styles.sectionTitle}>Market Strategy 📈</Text>
            <Text style={styles.sectionSub}>Risk/Reward Timing Insights</Text>
            <View style={[styles.guideCard, { borderColor: '#8b5cf6' }]}>
              <Text style={[styles.guideLabel, { color: '#a78bfa' }]}>Biological Limit Analysis</Text>
              <Text style={styles.guideDesc}>Current XGBoost data suggests variety-specific spoilage limits. Use the Guardian Advisor to view the 'Risk-Reward Bridge' for your current stack.</Text>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#34d399" style={{ marginTop: 20 }} />
        ) : locations.length === 0 && harvests.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="paddy" size={60} color="#1e293b" />
            <Text style={{ color: '#64748b', marginTop: 12 }}>No storage locations or harvests registered.</Text>
          </View>
        ) : (
          locations.map(loc => {
            const locStocks = harvests.filter(h => h.locationId === loc.id || h.locationName === loc.locationName);

            return (
              <View key={loc.id} style={styles.locationSection}>
                <View style={styles.locationHeader}>
                  <MaterialCommunityIcons
                    name={
                      loc.storageType === 'Warehouse' ? 'warehouse' :
                        loc.storageType === 'Home' ? 'home-variant-outline' :
                          loc.storageType === 'Silo' ? 'database' :
                            'storefront-outline'
                    }
                    size={22}
                    color="#34d399"
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.locationTitle}>{loc.locationName.toUpperCase()}</Text>
                    <Text style={styles.locationSubText}>{loc.storageType} • {loc.storageArea} {loc.areaUnit}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.locationAnalysisBtn}
                    onPress={() => navigation.navigate('WarehouseAnalysis', { locationId: loc.id })}
                  >
                    <LinearGradient colors={['#059669', '#10b981']} style={styles.vizBtnGrad}>
                      <Text style={styles.vizBtnText}>VIEW STORAGE</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <View style={styles.locationBadge}>
                    <Text style={styles.locationBadgeText}>{locStocks.length} BATCHES</Text>
                  </View>
                </View>

                {locStocks.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.batchCard}
                    onPress={() => navigation.navigate('RegisterHarvest', { editData: item, docId: item.id })}
                  >
                    <View style={styles.batchIcon}>
                      <MaterialCommunityIcons name="layers-outline" size={22} color="#64748b" />
                    </View>
                    <View style={styles.batchMain}>
                      <Text style={styles.batchTitle}>{item.variety}</Text>
                      <Text style={styles.batchSub}>{item.season} • {item.quantityKg} KG</Text>
                    </View>
                    <View style={styles.batchSide}>
                      <TouchableOpacity
                        style={styles.batchAdviceBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          navigation.navigate('PostHarvestAdvisor', { batch: item });
                        }}
                      >
                        <MaterialCommunityIcons name="brain" size={20} color="#34d399" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  scrollPadding: { padding: 20 },

  header: { marginBottom: 24 },
  hTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  hSub: { color: '#34d399', fontSize: 13, fontWeight: '600', marginTop: 2 },

  mainTotalsCard: { borderRadius: 28, padding: 24, marginBottom: 20, elevation: 12, shadowColor: '#064e3b', shadowOpacity: 0.4, shadowRadius: 15 },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  tLabel: { color: '#34d399', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tValue: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 },

  tStatsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00000030', borderRadius: 20, padding: 16 },
  tStat: { flex: 1, alignItems: 'center' },
  tStatVal: { color: '#fff', fontSize: 18, fontWeight: '800' },
  tStatLab: { color: '#64748b', fontSize: 9, fontWeight: '700', marginTop: 2 },
  tDivider: { width: 1, height: 24, backgroundColor: '#ffffff10' },

  aiGuardianCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 30, borderWidth: 1, borderColor: '#312e81' },
  aiGuardianGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  aiGuardianIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#818cf815', justifyContent: 'center', alignItems: 'center' },
  aiGuardianTitle: { color: '#e0e7ff', fontSize: 16, fontWeight: '800' },
  aiGuardianSub: { color: '#818cf8', fontSize: 11, marginTop: 2 },

  actionHub: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  actionItem: { alignItems: 'center', width: (width - 40) / 4.5 },
  actionIconCell: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  seeAll: { color: '#34d399', fontSize: 11, fontWeight: '800' },

  // Location Grouping Styles
  locationSection: { marginBottom: 24 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  locationTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  locationSubText: { color: '#64748b', fontSize: 10, marginTop: 2 },
  locationAnalysisBtn: { borderRadius: 10, overflow: 'hidden', marginRight: 8, borderWidth: 1, borderColor: '#34d39940' },
  vizBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  vizBtnText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  locationBadge: { backgroundColor: '#34d39920', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  locationBadgeText: { color: '#34d399', fontSize: 9, fontWeight: '900' },

  batchCard: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 16, borderRadius: 20, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  batchIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  batchMain: { flex: 1, marginLeft: 14 },
  batchTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  batchSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  batchSide: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  batchAdviceBtn: { backgroundColor: '#34d39915', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#34d39940' },

  empty: { padding: 40, alignItems: 'center' },

  // Beginner Guide Styles
  beginnerSection: { marginBottom: 32 },
  sectionSub: { color: '#64748b', fontSize: 13, marginBottom: 16 },
  guideCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' },
  guideStep: { flexDirection: 'row', marginBottom: 20, gap: 14 },
  guideNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#34d399', alignItems: 'center', justifyContent: 'center' },
  guideNumberText: { color: '#064e3b', fontWeight: 'bold', fontSize: 14 },
  guideInfo: { flex: 1 },
  guideLabel: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  guideDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 18 },
});
