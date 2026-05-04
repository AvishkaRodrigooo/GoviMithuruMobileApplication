import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, RefreshControl, Modal, Animated,
  SafeAreaView, StatusBar, Alert, TextInput, Image, KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../firebase/firebaseConfig';
import useUniversalLocation from '../../utils/useUniversalLocation';

// ─── Helpers ──────────────────────────────────────────────────
const deg2rad = (deg) => deg * (Math.PI / 180);
const calcDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calcTransport = (deal, distKm) => {
  if (!deal.hasTransport || !distKm) return null;
  const raw = distKm * (deal.transportCostPerKm || 0);
  const min = deal.transportMinCharge || 0;
  return Math.max(raw, min);
};

const GRADE_COLORS = { A: '#059669', B: '#d97706', C: '#dc2626', ALL: '#6366f1' };
const RICE_VARIETIES = ['All', 'Samba', 'Nadu', 'Basmati', 'Red Rice', 'Kekulu', 'Suwandel', 'Bg 300', 'At 306'];
const { width } = Dimensions.get('window');

export default function MarketTrackingScreen({ navigation, route }) {
  const { latitude: userLat, longitude: userLon } = useUniversalLocation();

  // ── Route params (when navigated from AI Advisor) ────────────
  const fromAdvisor = route?.params?.fromAdvisor || false;
  const advisorVariety = route?.params?.advisorVariety || null;
  const advisorSignal = route?.params?.advisorSignal || null;
  const advisorQuantity = route?.params?.quantity || null;

  // ── Data ─────────────────────────────────────────────────────
  const [allDeals, setAllDeals] = useState([]);
  const [groupedDealers, setGroupedDealers] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [farmerStocks, setFarmerStocks] = useState([]); // for stock deduction

  // ── UI state ─────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMarketTab, setActiveMarketTab] = useState('rice');

  // ── Filters ───────────────────────────────────────────────────
  // Pre-fill variety from AI advisor if provided, else 'All'
  const [varietyFilter, setVarietyFilter] = useState(
    advisorVariety && RICE_VARIETIES.includes(advisorVariety) ? advisorVariety : 'All'
  );
  const [gradeFilter, setGradeFilter] = useState('All');
  const [transportFilter, setTransportFilter] = useState(false);
  const [sortBy, setSortBy] = useState('nearest');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // ── Selected deal (bottom sheet) ─────────────────────────────
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [dealerTab, setDealerTab] = useState('riceDeal'); // riceDeal | otherItems

  // ── Complete Deal flow ────────────────────────────────────────
  // step: null | 'quantity' | 'confirm' | 'success'
  const [completeDealStep, setCompleteDealStep] = useState(null);
  const [completeDealQty, setCompleteDealQty] = useState('');
  const [useTransport, setUseTransport] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [manualDistance, setManualDistance] = useState('');

  // ── Map modal ─────────────────────────────────────────────────
  const [mapVisible, setMapVisible] = useState(false);
  const [mapTarget, setMapTarget] = useState(null);

  // ── Pulse animation ───────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const p = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]));
    p.start();
    return () => p.stop();
  }, []);

  // ─── Fetch ───────────────────────────────────────────────────
  useEffect(() => { fetchAll(); }, [varietyFilter]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Fetch active deals
      let q = db.collection('marketPrices').where('status', '==', 'active');
      if (varietyFilter !== 'All') q = q.where('variety', '==', varietyFilter);
      const snap = await q.limit(200).get();
      const deals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check deal expiry client-side
      const today = new Date().toISOString().split('T')[0];
      const valid = deals.filter(d => !d.validUntil || d.validUntil >= today);

      setAllDeals(valid);

      // Fetch farmer's own stocks from 'harvests' collection
      // (RegisterHarvestScreen saves stock to db.collection('harvests'))
      const uid = auth.currentUser?.uid;
      if (uid) {
        const stockSnap = await db
          .collection('harvests')
          .where('userId', '==', uid)
          .get();
        setFarmerStocks(stockSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (e) {
      console.error('fetchAll:', e);
      Alert.alert('Load Error', 'Could not load market data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ─── Group and filter dealers ─────────────────────────────────
  useEffect(() => {
    const riceDeals = allDeals.filter(d => d.type === 'rice' || !d.type);
    const others = allDeals.filter(d => d.type === 'other');

    // Apply grade filter
    const gradeFiltered = gradeFilter === 'All'
      ? riceDeals
      : riceDeals.filter(d => d.grade === gradeFilter || d.grade === 'ALL' || d.gradesOffered?.includes(gradeFilter) || d.gradesOffered?.includes('ALL'));

    // Apply transport filter
    const transportFiltered = transportFilter
      ? gradeFiltered.filter(d => d.hasTransport)
      : gradeFiltered;

    // Group by dealer
    const grouped = transportFiltered.reduce((acc, deal) => {
      const dId = deal.dealerId || deal.dealerName;
      if (!acc[dId]) {
        const distKm = calcDistance(userLat, userLon, deal.latitude, deal.longitude);
        acc[dId] = {
          id: dId,
          dealerName: deal.dealerName,
          location: deal.location || deal.locationName,
          latitude: deal.latitude,
          longitude: deal.longitude,
          contactNumber: deal.contactNumber,
          hasTransport: deal.hasTransport,
          transportCostPerKm: deal.transportCostPerKm,
          transportMinCharge: deal.transportMinCharge,
          gradesOffered: deal.gradesOffered || [deal.grade],
          distanceKm: distKm,
          deals: [],
          expanded: false,
        };
      }
      acc[dId].deals.push(deal);
      return acc;
    }, {});

    let list = Object.values(grouped);

    // Sort
    if (sortBy === 'nearest') {
      list.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortBy === 'highestPrice') {
      list.sort((a, b) => {
        const aMax = Math.max(...a.deals.map(d => d.price || 0));
        const bMax = Math.max(...b.deals.map(d => d.price || 0));
        return bMax - aMax;
      });
    } else if (sortBy === 'mostDeals') {
      list.sort((a, b) => b.deals.length - a.deals.length);
    }

    setGroupedDealers(list);
    setOtherItems(others);
  }, [allDeals, gradeFilter, transportFilter, sortBy, userLat, userLon]);

  const toggleDealer = (id) => {
    setGroupedDealers(prev =>
      prev.map(d => d.id === id ? { ...d, expanded: !d.expanded } : d)
    );
  };

  const openDeal = (deal, dealer) => {
    // Attach dealer-level info to the deal object for the sheet
    setSelectedDeal({
      ...deal,
      dealerName: dealer.dealerName,
      location: dealer.location,
      latitude: dealer.latitude,
      longitude: dealer.longitude,
      contactNumber: dealer.contactNumber,
      hasTransport: dealer.hasTransport,
      transportCostPerKm: dealer.transportCostPerKm,
      transportMinCharge: dealer.transportMinCharge,
      allDealerDeals: dealer.deals,
      distanceKm: dealer.distanceKm,
    });
    setDealerTab('riceDeal');
    setCompleteDealStep(null);
    setCompleteDealQty('');
    setUseTransport(false);
  };

  // ─── Complete Deal Helpers ────────────────────────────────────
  const selectedDealDistance = selectedDeal?.distanceKm || parseFloat(manualDistance) || null;
  const transportCostTotal = selectedDeal && useTransport
    ? calcTransport(selectedDeal, selectedDealDistance)
    : 0;
  const dealQtyNum = parseFloat(completeDealQty) || 0;
  const riceTotal = dealQtyNum * (selectedDeal?.pricePerKg || selectedDeal?.price || 0);
  const grandTotal = riceTotal + (transportCostTotal || 0);

  // Matching farmer stock for this deal's variety
  // farmerStocks now comes from 'harvests' collection
  const matchingStock = farmerStocks.find(
    s => (s.variety || '').toLowerCase() === (selectedDeal?.variety || '').toLowerCase()
      && (parseFloat(s.quantityKg) || 0) > 0   // only consider batches that still have stock
  );
  const maxSellable = parseFloat(matchingStock?.quantityKg) || 9999;

  const validateCompleteDeal = () => {
    if (!dealQtyNum || dealQtyNum <= 0) {
      Alert.alert('Quantity', 'Enter a valid quantity in kg.');
      return false;
    }
    const minQ = selectedDeal?.minQuantityKg || 0;
    const maxQ = selectedDeal?.maxQuantityKg;
    if (dealQtyNum < minQ) {
      Alert.alert('Minimum Quantity', `Dealer requires at least ${minQ} kg.`);
      return false;
    }
    if (maxQ && dealQtyNum > maxQ) {
      Alert.alert('Maximum Quantity', `Dealer accepts maximum ${maxQ} kg.`);
      return false;
    }
    return true;
  };

  const handleConfirmDeal = async () => {
    if (!validateCompleteDeal()) return;
    setCompleting(true);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert('Not Signed In', 'Please sign in to complete a deal.');
        setCompleting(false);
        return;
      }

      const now = new Date().toISOString();
      const dealVariety = (selectedDeal?.variety || '').trim();
      const soldQty = dealQtyNum; // amount the farmer is selling

      // ─────────────────────────────────────────────────────────────────────
      // STEP 1 — FRESH direct Firestore query for farmer's harvest batches
      //          Do NOT rely on stale in-memory farmerStocks state.
      //          Fetch all batches for this user right now.
      // ─────────────────────────────────────────────────────────────────────
      const harvestSnap = await db
        .collection('harvests')
        .where('userId', '==', uid)
        .get();

      const allBatches = harvestSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ─────────────────────────────────────────────────────────────────────
      // STEP 2 — Multi-strategy variety matching
      //   Strategy 1: exact case-insensitive match
      //   Strategy 2: normalized match (remove spaces/dots)
      //   Strategy 3: one contains the other
      // ─────────────────────────────────────────────────────────────────────
      const normalize = (s) => (s || '').toLowerCase().replace(/[\s.\-_]/g, '');
      const dealNorm = normalize(dealVariety);

      let matchedBatches = allBatches.filter(b => {
        const bv = (b.variety || '').trim();
        // Strategy 1: exact case-insensitive
        if (bv.toLowerCase() === dealVariety.toLowerCase()) return true;
        // Strategy 2: normalized
        if (normalize(bv) === dealNorm) return true;
        // Strategy 3: contains
        if (bv.toLowerCase().includes(dealVariety.toLowerCase())) return true;
        if (dealVariety.toLowerCase().includes(bv.toLowerCase())) return true;
        return false;
      }).filter(b => (parseFloat(b.quantityKg) || 0) > 0); // only batches with stock

      // ─────────────────────────────────────────────────────────────────────
      // STEP 3 — Save the completed deal record (always succeeds)
      // ─────────────────────────────────────────────────────────────────────
      await db.collection('users').doc(uid).collection('completedDeals').add({
        dealId: selectedDeal.id,
        dealerId: selectedDeal.dealerId || '',
        dealerName: selectedDeal.dealerName,
        riceVariety: dealVariety,
        grade: selectedDeal.grade,
        quantitySoldKg: soldQty,
        pricePerKg: selectedDeal.pricePerKg || selectedDeal.price,
        riceAmount: riceTotal,
        transportUsed: useTransport,
        transportCost: transportCostTotal || 0,
        totalAmount: grandTotal,
        completedAt: now,
      });

      // ─────────────────────────────────────────────────────────────────────
      // STEP 4 — Deduct quantity from matched harvest batches
      //          If multiple batches match, deduct from the one with
      //          the highest quantity first (FIFO-like logic).
      // ─────────────────────────────────────────────────────────────────────
      if (matchedBatches.length > 0) {
        // Sort: highest quantity first
        matchedBatches.sort((a, b) =>
          (parseFloat(b.quantityKg) || 0) - (parseFloat(a.quantityKg) || 0)
        );

        let remaining = soldQty;

        for (const batch of matchedBatches) {
          if (remaining <= 0) break;
          const batchQty = parseFloat(batch.quantityKg) || 0;
          const deduct = Math.min(batchQty, remaining);
          const newQty = Math.max(0, batchQty - deduct);

          // ── Direct Firestore write to harvests collection ──
          await db.collection('harvests').doc(batch.id).update({
            quantityKg: newQty,
            bags: newQty > 0 ? Math.ceil(newQty / 50) : 0,
            updatedAt: now,
          });

          remaining -= deduct;
        }

        // Refresh local farmerStocks state so UI shows updated values
        const refreshedSnap = await db
          .collection('harvests')
          .where('userId', '==', uid)
          .get();
        setFarmerStocks(refreshedSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } else {
        // No matching batch found — still complete the deal but warn
        console.warn(
          `[handleConfirmDeal] No harvest batch found for variety: "${dealVariety}".`,
          `Available batches: ${allBatches.map(b => `"${b.variety}"(${b.quantityKg}kg)`).join(', ')}`
        );
        // Still complete the deal — just no stock deduction
      }

      // ─────────────────────────────────────────────────────────────────────
      // STEP 5 — Non-blocking updates (dealer listing + farmerOrders)
      // ─────────────────────────────────────────────────────────────────────
      try {
        const newFilled = (selectedDeal.filledQuantityKg || 0) + soldQty;
        const dealUpdate = { filledQuantityKg: newFilled };
        if (selectedDeal.maxQuantityKg && newFilled >= selectedDeal.maxQuantityKg) {
          dealUpdate.status = 'completed';
        }
        await db.collection('marketPrices').doc(selectedDeal.id).update(dealUpdate);
      } catch (_) { /* farmer may not have write access to dealer listings */ }

      try {
        await db.collection('farmerOrders').add({
          dealerId: selectedDeal.dealerId || '',
          dealerName: selectedDeal.dealerName,
          farmerId: uid,
          dealId: selectedDeal.id,
          riceVariety: dealVariety,
          grade: selectedDeal.grade,
          quantitySoldKg: soldQty,
          pricePerKg: selectedDeal.pricePerKg || selectedDeal.price,
          riceAmount: riceTotal,
          transportUsed: useTransport,
          transportCost: transportCostTotal || 0,
          totalAmount: grandTotal,
          status: 'pending',
          completedAt: now,
          isNew: true,
        });
      } catch (_) { /* non-blocking */ }

      setCompleteDealStep('success');

    } catch (e) {
      console.error('handleConfirmDeal error:', e);

      const msg = e?.code === 'permission-denied'
        ? 'Permission denied. Please ensure you are signed in.'
        : 'Could not complete deal. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setCompleting(false);
    }
  };

  const closeDealSheet = () => {
    setSelectedDeal(null);
    setCompleteDealStep(null);
    setCompleteDealQty('');
    setUseTransport(false);
    if (completeDealStep === 'success') fetchAll(); // Refresh after success
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor="#16a34a" />

      {/* Header */}
      <LinearGradient colors={['#16a34a', '#064e3b']} style={st.header}>
        <View style={st.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={st.title}>Dealer Market</Text>
            <View style={st.liveBadge}>
              <Animated.View style={[st.dot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={st.liveText}>LIVE FEED</Text>
            </View>
          </View>
          <TouchableOpacity style={st.filterIconBtn} onPress={() => setShowFilterModal(true)}>
            <MaterialCommunityIcons name="tune" size={20} color="#fff" />
            {(gradeFilter !== 'All' || transportFilter) && (
              <View style={st.filterDot} />
            )}
          </TouchableOpacity>
        </View>

        {/* AI Advisor context banner */}
        {fromAdvisor && advisorVariety && (
          <View style={st.advisorBanner}>
            <MaterialCommunityIcons name="robot-happy-outline" size={14} color="#fde68a" />
            <Text style={st.advisorBannerText}>
              {advisorSignal === 'RED'
                ? `AI says SELL NOW · Showing dealers for ${advisorVariety}`
                : `AI suggests watching market · Filtering by ${advisorVariety}`}
            </Text>
            <TouchableOpacity onPress={() => setVarietyFilter('All')} style={st.clearVarietyBtn}>
              <Text style={st.clearVarietyText}>Show All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Variety pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={st.pillRow}>
            {RICE_VARIETIES.map(v => (
              <TouchableOpacity
                key={v}
                style={[st.pill, varietyFilter === v && st.pillActive]}
                onPress={() => setVarietyFilter(v)}
              >
                <Text style={[st.pillText, varietyFilter === v && st.pillTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Market Tabs */}
      <View style={st.marketTabs}>
        {[
          { key: 'rice', icon: 'rice', label: 'RICE DEALS' },
          { key: 'other', icon: 'package-variant', label: 'OTHER ITEMS' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[st.marketTab, activeMarketTab === t.key && st.marketTabActive]}
            onPress={() => setActiveMarketTab(t.key)}
          >
            <MaterialCommunityIcons
              name={t.icon} size={14}
              color={activeMarketTab === t.key ? '#059669' : '#94a3b8'}
            />
            <Text style={[st.marketTabLabel, activeMarketTab === t.key && st.marketTabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={st.loadingBox}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={st.loadingText}>Fetching dealer offers...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={st.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#16a34a" colors={['#16a34a']} />}
        >
          {/* Sort bar */}
          {activeMarketTab === 'rice' && (
            <View style={st.sortBar}>
              <Text style={st.sortLabel}>Sort:</Text>
              {[
                { key: 'nearest', label: 'Nearest' },
                { key: 'highestPrice', label: 'Best Price' },
                { key: 'mostDeals', label: 'Most Deals' },
              ].map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[st.sortChip, sortBy === s.key && st.sortChipActive]}
                  onPress={() => setSortBy(s.key)}
                >
                  <Text style={[st.sortChipText, sortBy === s.key && st.sortChipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── RICE DEALS ── */}
          {activeMarketTab === 'rice' && (
            groupedDealers.length === 0 ? (
              // ── Variety-aware empty state
              varietyFilter !== 'All' ? (
                <View style={st.noVarietyCard}>
                  <View style={st.noVarietyIconBox}>
                    <MaterialCommunityIcons name="storefront-remove" size={36} color="#dc2626" />
                  </View>
                  <Text style={st.noVarietyTitle}>
                    No dealers buying {varietyFilter} right now
                  </Text>
                  <Text style={st.noVarietySub}>
                    There are currently no active dealer offers for{' '}
                    <Text style={{ fontWeight: '700', color: '#1e293b' }}>{varietyFilter}</Text>.
                    {fromAdvisor
                      ? ' The AI advisor recommended selling, but this variety has no active buyers yet.'
                      : ' Try a different variety or check back later.'}
                  </Text>
                  {/* Tips when no dealer for this variety */}
                  <View style={st.noVarietyTips}>
                    <View style={st.noVarietyTipRow}>
                      <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color="#d97706" />
                      <Text style={st.noVarietyTipText}>Contact local agrarian service centre for buyers</Text>
                    </View>
                    <View style={st.noVarietyTipRow}>
                      <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color="#d97706" />
                      <Text style={st.noVarietyTipText}>Try storing short-term and check again tomorrow</Text>
                    </View>
                    <View style={st.noVarietyTipRow}>
                      <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color="#d97706" />
                      <Text style={st.noVarietyTipText}>Browse all varieties — dealers may accept {varietyFilter} under a similar grade</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={st.noVarietyAllBtn}
                    onPress={() => setVarietyFilter('All')}
                  >
                    <MaterialCommunityIcons name="view-list" size={16} color="#059669" />
                    <Text style={st.noVarietyAllBtnText}>Browse All Dealer Offers</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <EmptyState
                  icon="storefront-remove"
                  title="No dealer offers"
                  sub="Try changing variety or removing filters."
                />
              )
            ) : (
              groupedDealers.map(dealer => (
                <DealerCard
                  key={dealer.id}
                  dealer={dealer}
                  userLat={userLat}
                  userLon={userLon}
                  onToggle={() => toggleDealer(dealer.id)}
                  onSelectDeal={(deal) => openDeal(deal, dealer)}
                  onOpenMap={() => {
                    setMapTarget(dealer);
                    setMapVisible(true);
                  }}
                />
              ))
            )
          )}

          {/* ── OTHER ITEMS ── */}
          {activeMarketTab === 'other' && (
            otherItems.length === 0 ? (
              <EmptyState
                icon="package-variant-remove"
                title="No items listed"
                sub="No agricultural items for sale right now."
              />
            ) : (
              <View style={st.itemsGrid}>
                {otherItems.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={st.otherItemCard}
                    onPress={() => { setSelectedDeal(item); setDealerTab('otherItem'); }}
                  >
                    {item.photos?.[0] ? (
                      <Image source={{ uri: item.photos[0] }} style={st.itemImg} />
                    ) : (
                      <View style={st.itemImgPlaceholder}>
                        <MaterialCommunityIcons name="package-variant" size={28} color="#94a3b8" />
                      </View>
                    )}
                    <View style={st.itemCardBody}>
                      <Text style={st.itemCategory}>{item.category}</Text>
                      <Text style={st.itemTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={st.itemDealer} numberOfLines={1}>{item.dealerName}</Text>
                      <Text style={st.itemPrice}>Rs.{item.price?.toLocaleString()}</Text>
                      {item.unit && <Text style={st.itemUnit}>{item.unit}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}


          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* ─── DEAL BOTTOM SHEET ─────────────────────────────────── */}
      {selectedDeal && (
        <Modal transparent animationType="slide" onRequestClose={closeDealSheet}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TouchableOpacity style={st.sheetOverlay} activeOpacity={1} onPress={closeDealSheet} />
            <View style={st.sheetContent}>
              <View style={st.sheetBar} />

              {/* ─ Step: success ─ */}
              {completeDealStep === 'success' ? (
                <SuccessView
                  deal={selectedDeal}
                  qty={dealQtyNum}
                  total={grandTotal}
                  onClose={closeDealSheet}
                />
              ) : completeDealStep === 'confirm' ? (
                /* ─ Step: confirm summary ─ */
                <ConfirmView
                  deal={selectedDeal}
                  qty={dealQtyNum}
                  riceTotal={riceTotal}
                  transportCost={transportCostTotal}
                  grandTotal={grandTotal}
                  useTransport={useTransport}
                  completing={completing}
                  onBack={() => setCompleteDealStep('quantity')}
                  onConfirm={handleConfirmDeal}
                />
              ) : completeDealStep === 'quantity' ? (
                /* ─ Step: quantity input ─ */
                <QuantityView
                  deal={selectedDeal}
                  qty={completeDealQty}
                  setQty={setCompleteDealQty}
                  useTransport={useTransport}
                  setUseTransport={setUseTransport}
                  transportCostTotal={transportCostTotal}
                  distanceKm={selectedDealDistance}
                  manualDistance={manualDistance}
                  setManualDistance={setManualDistance}
                  maxSellable={maxSellable}
                  riceTotal={riceTotal}
                  grandTotal={grandTotal}
                  onBack={() => setCompleteDealStep(null)}
                  onNext={() => { if (validateCompleteDeal()) setCompleteDealStep('confirm'); }}
                />
              ) : (
                /* ─ Default: deal detail ─ */
                <DealDetailView
                  deal={selectedDeal}
                  distanceKm={selectedDealDistance}
                  dealerTab={dealerTab}
                  setDealerTab={setDealerTab}
                  onClose={closeDealSheet}
                  onOpenMap={() => {
                    closeDealSheet();
                    setMapTarget(selectedDeal);
                    setMapVisible(true);
                  }}
                  onStartComplete={() => setCompleteDealStep('quantity')}
                />
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ─── FILTER MODAL ──────────────────────────────────────── */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Filters & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={st.filterSectionLabel}>GRADE</Text>
            <View style={st.gradeFilterRow}>
              {['All', 'A', 'B', 'C'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    st.gradeFilterChip,
                    gradeFilter === g && { backgroundColor: g === 'All' ? '#059669' : GRADE_COLORS[g], borderColor: g === 'All' ? '#059669' : GRADE_COLORS[g] }
                  ]}
                  onPress={() => setGradeFilter(g)}
                >
                  <Text style={[st.gradeFilterText, gradeFilter === g && { color: '#fff' }]}>
                    {g === 'All' ? 'All Grades' : `Grade ${g}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={st.transportToggle}>
              <Text style={st.filterSectionLabel}>TRANSPORT</Text>
              <TouchableOpacity
                style={[st.toggleBtn, transportFilter && st.toggleBtnActive]}
                onPress={() => setTransportFilter(p => !p)}
              >
                <MaterialCommunityIcons name="truck-delivery" size={16} color={transportFilter ? '#fff' : '#64748b'} />
                <Text style={[st.toggleBtnText, transportFilter && { color: '#fff' }]}>Has Transport Only</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={st.applyFilterBtn}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={st.applyFilterText}>APPLY FILTERS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MAP MODAL ─────────────────────────────────────────── */}
      <Modal visible={mapVisible} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={[st.modalContent, { height: '80%', padding: 0, overflow: 'hidden' }]}>
            <View style={[st.modalHeader, { padding: 20, paddingBottom: 16 }]}>
              <View>
                <Text style={st.modalTitle}>{mapTarget?.dealerName}</Text>
                <Text style={st.mapSubTitle}>{mapTarget?.location}
                  {mapTarget?.distanceKm
                    ? ` · ${mapTarget.distanceKm.toFixed(1)} km away`
                    : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setMapVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            {mapTarget?.latitude && (
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: mapTarget.latitude,
                  longitude: mapTarget.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                <Marker
                  coordinate={{ latitude: mapTarget.latitude, longitude: mapTarget.longitude }}
                  title={mapTarget.dealerName} description={mapTarget.location}
                  pinColor="#059669"
                />
                {userLat && userLon && (
                  <Marker
                    coordinate={{ latitude: userLat, longitude: userLon }}
                    title="Your Location" pinColor="#3b82f6"
                  />
                )}
              </MapView>
            )}

            <View style={st.mapFooter}>
              <Text style={st.mapFooterText}>Tap markers for details · Blue = your farm · Green = dealer</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════

function DealerCard({ dealer, onToggle, onSelectDeal, onOpenMap }) {
  const maxPrice = dealer.deals.length
    ? Math.max(...dealer.deals.map(d => d.price || 0))
    : 0;

  return (
    <View style={st.dealerCard}>
      <TouchableOpacity style={st.dealerHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={st.dealerAvatar}>
          <MaterialCommunityIcons name="store" size={22} color="#059669" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={st.dealerNameRow}>
            <Text style={st.dealerName} numberOfLines={1}>{dealer.dealerName}</Text>
            <MaterialCommunityIcons name="check-decagram" size={15} color="#34d399" />
          </View>
          <Text style={st.dealerMeta}>
            📍 {dealer.location}
            {dealer.distanceKm != null ? ` · ${dealer.distanceKm.toFixed(1)} km` : ''}
          </Text>
          {/* Grade badges */}
          <View style={st.gradeBadgeRow}>
            {(dealer.gradesOffered || []).map(g => (
              <View key={g} style={[st.gradeBadge, { backgroundColor: GRADE_COLORS[g] || '#6366f1' }]}>
                <Text style={st.gradeBadgeText}>{g === 'ALL' ? 'ALL' : `Grade ${g}`}</Text>
              </View>
            ))}
            {dealer.hasTransport && (
              <View style={st.transportBadge}>
                <MaterialCommunityIcons name="truck" size={10} color="#fff" />
                <Text style={st.gradeBadgeText}>Transport</Text>
              </View>
            )}
          </View>
        </View>
        <View style={st.dealerRight}>
          <Text style={st.dealerTopPrice}>Rs.{maxPrice}</Text>
          <Text style={st.dealerDealsCount}>{dealer.deals.length} deal{dealer.deals.length > 1 ? 's' : ''}</Text>
          <MaterialCommunityIcons
            name={dealer.expanded ? 'chevron-up' : 'chevron-down'}
            size={22} color="#94a3b8"
          />
        </View>
      </TouchableOpacity>

      {dealer.expanded && (
        <View style={st.dealsAccordion}>
          {/* Phone number row */}
          {dealer.contactNumber && (
            <TouchableOpacity
              style={st.phoneRow}
              onPress={() => Linking.openURL(`tel:${dealer.contactNumber}`)}
            >
              <View style={st.phoneIconBox}>
                <MaterialCommunityIcons name="phone" size={14} color="#059669" />
              </View>
              <Text style={st.phoneNumber}>{dealer.contactNumber}</Text>
              <View style={st.callNowBadge}>
                <MaterialCommunityIcons name="phone-outgoing" size={11} color="#fff" />
                <Text style={st.callNowText}>Call Now</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={st.mapLinkBtn} onPress={onOpenMap}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#3b82f6" />
            <Text style={st.mapLinkText}>View on Map</Text>
          </TouchableOpacity>

          {dealer.deals.map(deal => (
            <TouchableOpacity key={deal.id} style={st.miniDeal} onPress={() => onSelectDeal(deal)}>
              <View style={{ flex: 1 }}>
                <Text style={st.miniDealVariety}>{deal.variety}</Text>
                <View style={st.miniDealMeta}>
                  <View style={[st.miniGradeBadge, { backgroundColor: GRADE_COLORS[deal.grade] || '#6366f1' }]}>
                    <Text style={st.miniGradeText}>{deal.grade === 'ALL' ? 'ALL' : `Grade ${deal.grade}`}</Text>
                  </View>
                  {deal.minQuantityKg && (
                    <Text style={st.miniDealQty}>
                      {deal.minQuantityKg}–{deal.maxQuantityKg || '∞'} kg
                    </Text>
                  )}
                </View>
              </View>
              <View style={st.miniDealRight}>
                <Text style={st.miniDealPrice}>Rs.{deal.price}</Text>
                <Text style={st.miniDealUnit}>/kg</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#94a3b8" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function DealDetailView({ deal, distanceKm, dealerTab, setDealerTab, onClose, onOpenMap, onStartComplete }) {
  const transportCostEst = deal.hasTransport && distanceKm
    ? Math.max(distanceKm * (deal.transportCostPerKm || 0), deal.transportMinCharge || 0).toFixed(0)
    : null;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Sheet header */}
      <View style={st.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={st.sheetTitle}>
            {deal.type !== 'other' ? `${deal.variety} — Grade ${deal.grade}` : deal.title}
          </Text>
          <Text style={st.sheetDealer}>{deal.dealerName}</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="close-circle" size={28} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      {/* Price */}
      <View style={st.sheetPriceRow}>
        <Text style={st.sheetPrice}>Rs.{deal.price}</Text>
        <Text style={st.sheetPriceUnit}>{deal.type !== 'other' ? 'per kg' : deal.unit || ''}</Text>
      </View>

      {/* Tabs: Rice Deal / Other Items */}
      {deal.allDealerDeals && (
        <View style={st.dealSheetTabs}>
          <TouchableOpacity
            style={[st.dealSheetTab, dealerTab === 'riceDeal' && st.dealSheetTabActive]}
            onPress={() => setDealerTab('riceDeal')}
          >
            <Text style={[st.dealSheetTabText, dealerTab === 'riceDeal' && st.dealSheetTabTextActive]}>
              RICE DEALS ({deal.allDealerDeals.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.dealSheetTab, dealerTab === 'otherItems' && st.dealSheetTabActive]}
            onPress={() => setDealerTab('otherItems')}
          >
            <Text style={[st.dealSheetTabText, dealerTab === 'otherItems' && st.dealSheetTabTextActive]}>
              OTHER ITEMS
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {dealerTab === 'riceDeal' && (
        <>
          {/* Deal info box */}
          <View style={st.infoBox}>
            <InfoRow icon="map-marker" color="#3b82f6" label="Location"
              value={`${deal.location}${distanceKm ? ` (${distanceKm.toFixed(1)} km away)` : ''}`}
            />
            <InfoRow icon="phone" color="#059669" label="Contact" value={deal.contactNumber || 'N/A'} />
            {deal.grade && (
              <InfoRow icon="star-circle" color={GRADE_COLORS[deal.grade]} label="Grade Required"
                value={deal.grade === 'ALL' ? 'All Grades Accepted' : `Grade ${deal.grade}`}
              />
            )}
            {deal.minQuantityKg && (
              <InfoRow icon="weight-kilogram" color="#6366f1" label="Quantity"
                value={`${deal.minQuantityKg} kg – ${deal.maxQuantityKg || '∞'} kg`}
              />
            )}
            {deal.validUntil && (
              <InfoRow icon="calendar-check" color="#d97706" label="Valid Until" value={deal.validUntil} />
            )}
          </View>

          {/* Transport box */}
          <View style={st.transportBox}>
            <View style={st.transportHeader}>
              <MaterialCommunityIcons
                name={deal.hasTransport ? 'truck-delivery' : 'truck-remove'}
                size={20}
                color={deal.hasTransport ? '#34d399' : '#ef4444'}
              />
              <Text style={st.transportTitle}>
                {deal.hasTransport ? 'Transport Available' : 'No Transport Service'}
              </Text>
            </View>
            {deal.hasTransport && (
              <View style={st.transportCalcBox}>
                {distanceKm ? (
                  <>
                    <Text style={st.transportCalcLine}>
                      {distanceKm.toFixed(1)} km × Rs.{deal.transportCostPerKm}/km = Rs.{(distanceKm * deal.transportCostPerKm).toFixed(0)}
                    </Text>
                    {deal.transportMinCharge > 0 && (
                      <Text style={st.transportCalcLine}>Minimum charge: Rs.{deal.transportMinCharge}</Text>
                    )}
                    <Text style={st.transportEstimate}>
                      Estimated delivery: Rs.{transportCostEst}
                    </Text>
                  </>
                ) : (
                  <Text style={st.transportCalcLine}>
                    Location unavailable. Distance can be manually entered in the next step to estimate the cost.
                  </Text>
                )}
              </View>
            )}
            {!deal.hasTransport && (
              <Text style={st.noTransportText}>You will need to arrange your own transport to this dealer.</Text>
            )}
          </View>

          <TouchableOpacity style={st.mapBtn} onPress={onOpenMap}>
            <MaterialCommunityIcons name="map-search" size={16} color="#3b82f6" />
            <Text style={st.mapBtnText}>View Dealer Location on Map</Text>
          </TouchableOpacity>

          {/* CTA buttons */}
          <View style={st.sheetBtns}>
            <TouchableOpacity
              style={st.callBtn}
              onPress={() => {
                if (deal.contactNumber) {
                  Linking.openURL(`tel:${deal.contactNumber}`);
                } else {
                  Alert.alert('No Number', 'This dealer has no contact number listed.');
                }
              }}
            >
              <MaterialCommunityIcons name="phone" size={18} color="#059669" />
              <View>
                <Text style={st.callBtnText}>CALL</Text>
                {deal.contactNumber && (
                  <Text style={st.callBtnSub}>{deal.contactNumber}</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={st.completeDealBtn} onPress={onStartComplete}>
              <MaterialCommunityIcons name="handshake" size={18} color="#fff" />
              <Text style={st.completeDealBtnText}>COMPLETE DEAL</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {dealerTab === 'otherItems' && (
        <View style={st.otherItemsList}>
          {(deal.allDealerDeals || []).length === 0 ? (
            <Text style={st.noOtherText}>No other items from this dealer.</Text>
          ) : (
            <Text style={st.noOtherText}>Switch to the Other Items tab in the market to browse this dealer's items.</Text>
          )}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function QuantityView({ deal, qty, setQty, useTransport, setUseTransport, transportCostTotal, distanceKm, manualDistance, setManualDistance, maxSellable, riceTotal, grandTotal, onBack, onNext }) {
  return (
    <View>
      <TouchableOpacity style={st.backLink} onPress={onBack}>
        <MaterialCommunityIcons name="arrow-left" size={18} color="#64748b" />
        <Text style={st.backLinkText}>Back to Deal</Text>
      </TouchableOpacity>

      <Text style={st.stepTitle}>📦 How much are you selling?</Text>
      <Text style={st.stepSub}>{deal.variety} — Grade {deal.grade} — Rs.{deal.price}/kg</Text>

      {maxSellable < 9999 && (
        <View style={st.stockAvailBadge}>
          <MaterialCommunityIcons name="warehouse" size={14} color="#6366f1" />
          <Text style={st.stockAvailText}>You have {maxSellable} kg of {deal.variety} in stock</Text>
        </View>
      )}

      <TextInput
        style={st.qtyBigInput}
        placeholder="Enter kg"
        keyboardType="numeric"
        value={qty}
        onChangeText={setQty}
        placeholderTextColor="#94a3b8"
        autoFocus
      />

      {deal.minQuantityKg && (
        <Text style={st.qtyHint}>
          Min: {deal.minQuantityKg} kg · Max: {deal.maxQuantityKg || '∞'} kg
        </Text>
      )}

      {/* Transport toggle */}
      {deal.hasTransport && (
        <View style={{ marginBottom: 12 }}>
          <TouchableOpacity
            style={[st.transportToggleCard, useTransport && st.transportToggleActive]}
            onPress={() => setUseTransport(p => !p)}
          >
            <MaterialCommunityIcons
              name={useTransport ? 'truck-check' : 'truck-outline'}
              size={20}
              color={useTransport ? '#059669' : '#94a3b8'}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[st.transportToggleLabel, useTransport && { color: '#059669' }]}>
                Add Dealer Transport
              </Text>
              {distanceKm ? (
                <Text style={st.transportToggleSub}>
                  Rs.{transportCostTotal?.toFixed(0) || '—'} estimated ({distanceKm.toFixed(1)} km)
                </Text>
              ) : (
                <Text style={st.transportToggleSub}>Calculate cost by entering distance manually below.</Text>
              )}
            </View>
            <View style={[st.checkCircle, useTransport && st.checkCircleActive]}>
              {useTransport && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
          {useTransport && !deal.distanceKm && (
            <TextInput
              style={[st.qtyBigInput, { height: 45, fontSize: 14, marginTop: 8 }]}
              placeholder="Enter distance to dealer (km)"
              keyboardType="numeric"
              value={manualDistance}
              onChangeText={setManualDistance}
              placeholderTextColor="#94a3b8"
            />
          )}
        </View>
      )}

      {/* Running total */}
      {parseFloat(qty) > 0 && (
        <View style={st.runningTotal}>
          <View style={st.totalRow}>
            <Text style={st.totalLabel}>Rice ({qty} kg × Rs.{deal.price})</Text>
            <Text style={st.totalValue}>Rs.{riceTotal.toLocaleString()}</Text>
          </View>
          {useTransport && transportCostTotal > 0 && (
            <View style={st.totalRow}>
              <Text style={st.totalLabel}>Transport</Text>
              <Text style={st.totalValue}>Rs.{transportCostTotal.toFixed(0)}</Text>
            </View>
          )}
          <View style={[st.totalRow, st.grandTotalRow]}>
            <Text style={st.grandTotalLabel}>TOTAL</Text>
            <Text style={st.grandTotalValue}>Rs.{grandTotal.toLocaleString()}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={st.qtyReviewBtn} onPress={onNext}>
        <MaterialCommunityIcons name="clipboard-check-outline" size={18} color="#fff" />
        <Text style={st.qtyReviewBtnText}>REVIEW DEAL</Text>
        <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
      </TouchableOpacity>
      <View style={{ height: 20 }} />
    </View>
  );
}

function ConfirmView({ deal, qty, riceTotal, transportCost, grandTotal, useTransport, completing, onBack, onConfirm }) {
  return (
    <View>
      <TouchableOpacity style={st.backLink} onPress={onBack}>
        <MaterialCommunityIcons name="arrow-left" size={18} color="#64748b" />
        <Text style={st.backLinkText}>Edit Quantity</Text>
      </TouchableOpacity>

      <Text style={st.stepTitle}>✅ Confirm Your Deal</Text>

      <View style={st.confirmBox}>
        <Text style={st.confirmSectionTitle}>DEAL SUMMARY</Text>
        <ConfirmRow label="Dealer" value={deal.dealerName} />
        <ConfirmRow label="Rice Variety" value={deal.variety} />
        <ConfirmRow label="Grade" value={`Grade ${deal.grade}`} />
        <ConfirmRow label="Quantity" value={`${qty} kg`} />
        <ConfirmRow label="Price per kg" value={`Rs.${deal.price}`} />
        <View style={st.confirmDivider} />
        <ConfirmRow label="Rice Amount" value={`Rs.${riceTotal.toLocaleString()}`} />
        {useTransport && transportCost > 0 && (
          <ConfirmRow label="Transport" value={`Rs.${transportCost.toFixed(0)}`} />
        )}
        <View style={st.confirmDivider} />
        <ConfirmRow label="TOTAL" value={`Rs.${grandTotal.toLocaleString()}`} bold />
      </View>

      <View style={st.stockWarning}>
        <MaterialCommunityIcons name="information" size={14} color="#6366f1" />
        <Text style={st.stockWarningText}>
          {qty} kg will be deducted from your {deal.variety} stock automatically.
        </Text>
      </View>

      <TouchableOpacity style={[st.qtyReviewBtn, completing && { opacity: 0.7 }]} onPress={onConfirm} disabled={completing}>
        {completing
          ? <ActivityIndicator color="#fff" size="small" />
          : <>
            <MaterialCommunityIcons name="handshake" size={18} color="#fff" />
            <Text style={st.qtyReviewBtnText}>CONFIRM & COMPLETE DEAL</Text>
          </>
        }
      </TouchableOpacity>
      <View style={{ height: 20 }} />
    </View>
  );
}

function SuccessView({ deal, qty, total, onClose }) {
  return (
    <View style={st.successView}>
      <View style={st.successIcon}>
        <MaterialCommunityIcons name="check-circle" size={64} color="#059669" />
      </View>
      <Text style={st.successTitle}>Deal Complete! 🎉</Text>
      <Text style={st.successSub}>
        {qty} kg of {deal.variety} sold to {deal.dealerName}
      </Text>
      <Text style={st.successAmount}>Rs.{total.toLocaleString()}</Text>
      <Text style={st.successNote}>Your {deal.variety} stock has been updated automatically.</Text>
      <TouchableOpacity style={st.successBtn} onPress={onClose}>
        <Text style={st.successBtnText}>DONE</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ icon, color, label, value }) {
  return (
    <View style={st.infoRow}>
      <MaterialCommunityIcons name={icon} size={16} color={color} style={{ marginRight: 8 }} />
      <Text style={st.infoLabel}>{label}:</Text>
      <Text style={st.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function ConfirmRow({ label, value, bold }) {
  return (
    <View style={st.confirmRow}>
      <Text style={[st.confirmLabel, bold && { fontWeight: '900', color: '#1e293b' }]}>{label}</Text>
      <Text style={[st.confirmValue, bold && { fontWeight: '900', color: '#059669', fontSize: 18 }]}>{value}</Text>
    </View>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <View style={st.emptyState}>
      <MaterialCommunityIcons name={icon} size={52} color="#e2e8f0" />
      <Text style={st.emptyTitle}>{title}</Text>
      <Text style={st.emptySub}>{sub}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, elevation: 4, shadowColor: '#16a34a', shadowOpacity: 0.2, shadowRadius: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 14, marginRight: 14 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#bbf7d0', marginRight: 6 },
  liveText: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  filterIconBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 14, position: 'relative' },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#fef08a' },
  pillRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  pillActive: { backgroundColor: '#fff' },
  pillText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },
  pillTextActive: { color: '#16a34a', fontWeight: '800' },

  // ── AI Advisor banner
  advisorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.4)',
  },
  advisorBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#fef9c3',
    lineHeight: 16,
  },
  clearVarietyBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clearVarietyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  // ── No-variety-dealer empty state
  noVarietyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 4,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  noVarietyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  noVarietyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  noVarietySub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  noVarietyTips: {
    width: '100%',
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noVarietyTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noVarietyTipText: {
    fontSize: 12.5,
    color: '#78350f',
    flex: 1,
    lineHeight: 18,
  },
  noVarietyAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  noVarietyAllBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },

  marketTabs: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginTop: -18, borderRadius: 18, elevation: 4, shadowColor: '#16a34a', shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  marketTab: { flex: 1, flexDirection: 'row', paddingVertical: 13, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 18 },
  marketTabActive: { backgroundColor: '#f0fdf4' },
  marketTabLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '800' },
  marketTabLabelActive: { color: '#16a34a' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6b7280', marginTop: 12, fontSize: 14 },

  content: { padding: 16, paddingTop: 20 },

  sortBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  sortLabel: { color: '#64748b', fontSize: 11, fontWeight: '800' },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  sortChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  sortChipText: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  sortChipTextActive: { color: '#fff' },

  // Dealer card
  dealerCard: { backgroundColor: '#fff', borderRadius: 22, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, overflow: 'hidden' },
  dealerHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  dealerAvatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  dealerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dealerName: { color: '#1e293b', fontSize: 15, fontWeight: '800', flexShrink: 1 },
  dealerMeta: { color: '#64748b', fontSize: 11, marginTop: 2 },
  gradeBadgeRow: { flexDirection: 'row', gap: 5, marginTop: 6, flexWrap: 'wrap' },
  gradeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  gradeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  transportBadge: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, gap: 3, alignItems: 'center' },
  dealerRight: { alignItems: 'flex-end' },
  dealerTopPrice: { color: '#059669', fontSize: 16, fontWeight: '900' },
  dealerDealsCount: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  dealsAccordion: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingHorizontal: 16, paddingBottom: 12 },
  mapLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10 },
  mapLinkText: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },
  miniDeal: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  miniDealVariety: { color: '#1e293b', fontSize: 14, fontWeight: '700' },
  miniDealMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  miniGradeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  miniGradeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  miniDealQty: { color: '#94a3b8', fontSize: 11 },
  miniDealRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  miniDealPrice: { color: '#059669', fontSize: 16, fontWeight: '900' },
  miniDealUnit: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },

  // Other items grid
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  otherItemCard: { width: (width - 44) / 2, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  itemImg: { width: '100%', height: 110 },
  itemImgPlaceholder: { width: '100%', height: 110, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  itemCardBody: { padding: 12 },
  itemCategory: { color: '#059669', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemTitle: { color: '#1e293b', fontSize: 13, fontWeight: '800', marginTop: 2 },
  itemDealer: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  itemPrice: { color: '#059669', fontSize: 16, fontWeight: '900', marginTop: 6 },
  itemUnit: { color: '#94a3b8', fontSize: 10 },

  // Advisor
  advisorCard: { borderRadius: 22, overflow: 'hidden', marginTop: 16 },
  advisorGrad: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  advisorTitle: { color: '#e0e7ff', fontSize: 14, fontWeight: '800' },
  advisorSub: { color: '#818cf8', fontSize: 11, marginTop: 2 },

  // Bottom sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)' },
  sheetContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '92%' },
  sheetBar: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitle: { color: '#1e293b', fontSize: 20, fontWeight: '900', flex: 1, marginRight: 12 },
  sheetDealer: { color: '#64748b', fontSize: 13, marginTop: 3 },
  sheetPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 20 },
  sheetPrice: { color: '#059669', fontSize: 34, fontWeight: '900' },
  sheetPriceUnit: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },

  dealSheetTabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 14, padding: 4, marginBottom: 16 },
  dealSheetTab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  dealSheetTabActive: { backgroundColor: '#fff', elevation: 2 },
  dealSheetTabText: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },
  dealSheetTabTextActive: { color: '#059669' },

  infoBox: { backgroundColor: '#f8fafc', borderRadius: 18, padding: 16, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  infoLabel: { color: '#64748b', fontSize: 12, fontWeight: '700', width: 100 },
  infoValue: { color: '#1e293b', fontSize: 12, fontWeight: '700', flex: 1 },

  transportBox: { backgroundColor: '#f0fdf4', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#bbf7d0' },
  transportHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  transportTitle: { color: '#064e3b', fontSize: 14, fontWeight: '800' },
  transportCalcBox: { paddingLeft: 28 },
  transportCalcLine: { color: '#64748b', fontSize: 12, marginBottom: 3 },
  transportEstimate: { color: '#059669', fontSize: 14, fontWeight: '800', marginTop: 4 },
  noTransportText: { color: '#64748b', fontSize: 12, paddingLeft: 28 },

  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginBottom: 14 },
  mapBtnText: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },

  // Phone row in DealerCard expanded
  phoneRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#bbf7d0', gap: 8 },
  phoneIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  phoneNumber: { flex: 1, color: '#065f46', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  callNowBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
  callNowText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  callBtnSub: { color: '#059669', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 2 },

  sheetBtns: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: '#059669', gap: 6 },
  callBtnText: { color: '#059669', fontSize: 13, fontWeight: '900' },
  // completeDealBtn is only used inside sheetBtns row (flex:2 sibling of callBtn)
  completeDealBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: '#059669', gap: 8, elevation: 3, shadowColor: '#059669', shadowOpacity: 0.3, shadowRadius: 8 },
  completeDealBtnText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  // Full-width standalone button for QuantityView & ConfirmView steps
  qtyReviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, backgroundColor: '#059669', gap: 10, marginTop: 8, elevation: 4, shadowColor: '#059669', shadowOpacity: 0.35, shadowRadius: 10 },
  qtyReviewBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },

  otherItemsList: { padding: 10 },
  noOtherText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 },

  // Quantity step
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backLinkText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  stepTitle: { color: '#1e293b', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  stepSub: { color: '#64748b', fontSize: 13, marginBottom: 16 },
  stockAvailBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eef2ff', borderRadius: 10, padding: 10, marginBottom: 12 },
  stockAvailText: { color: '#6366f1', fontSize: 12, fontWeight: '700' },
  qtyBigInput: { backgroundColor: '#f8fafc', borderRadius: 18, padding: 18, fontSize: 32, fontWeight: '900', color: '#059669', textAlign: 'center', borderWidth: 2, borderColor: '#e2e8f0', marginBottom: 8 },
  qtyHint: { color: '#94a3b8', fontSize: 11, textAlign: 'center', marginBottom: 16 },
  transportToggleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 2, borderColor: '#e2e8f0' },
  transportToggleActive: { borderColor: '#34d399', backgroundColor: '#f0fdf4' },
  transportToggleLabel: { color: '#475569', fontSize: 13, fontWeight: '700' },
  transportToggleSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  checkCircleActive: { backgroundColor: '#059669', borderColor: '#059669' },
  runningTotal: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  totalValue: { color: '#1e293b', fontSize: 13, fontWeight: '700' },
  grandTotalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 4 },
  grandTotalLabel: { color: '#1e293b', fontSize: 15, fontWeight: '900' },
  grandTotalValue: { color: '#059669', fontSize: 18, fontWeight: '900' },

  // Confirm step
  confirmBox: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 18, marginBottom: 14 },
  confirmSectionTitle: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 14 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  confirmLabel: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  confirmValue: { color: '#1e293b', fontSize: 14, fontWeight: '700' },
  confirmDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
  stockWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eef2ff', borderRadius: 12, padding: 12, marginBottom: 16 },
  stockWarningText: { color: '#6366f1', fontSize: 12, fontWeight: '600', flex: 1 },

  // Success
  successView: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle: { color: '#1e293b', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  successSub: { color: '#64748b', fontSize: 14, textAlign: 'center' },
  successAmount: { color: '#059669', fontSize: 38, fontWeight: '900', marginTop: 16, marginBottom: 8 },
  successNote: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginBottom: 24 },
  successBtn: { backgroundColor: '#059669', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 18 },
  successBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },

  // Filter modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#1e293b', fontSize: 18, fontWeight: '900' },
  filterSectionLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  gradeFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  gradeFilterChip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  gradeFilterText: { color: '#475569', fontSize: 11, fontWeight: '800' },
  transportToggle: { marginBottom: 20 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', alignSelf: 'flex-start' },
  toggleBtnActive: { backgroundColor: '#059669', borderColor: '#059669' },
  toggleBtnText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  applyFilterBtn: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  applyFilterText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

  // Map modal
  mapSubTitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
  mapFooter: { padding: 16, backgroundColor: '#f8fafc' },
  mapFooterText: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: '#1e293b', fontSize: 17, fontWeight: '800', marginTop: 14 },
  emptySub: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 6 },
});