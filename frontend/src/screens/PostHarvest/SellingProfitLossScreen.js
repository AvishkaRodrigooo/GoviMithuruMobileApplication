/**
 * SellingProfitLossScreen.js  —  AgroMind v5.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows farmer's profit or loss after selling paddy.
 * Fetches completed deals from Firestore and calculates:
 *   Revenue    = quantitySoldKg × pricePerKg
 *   Cost       = (production cost from harvest record) + transport
 *   Profit/Loss = Revenue − Cost
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, Dimensions,
  Animated, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../firebase/firebaseConfig';

const { width } = Dimensions.get('window');

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#F5F7FA',
  card: '#FFFFFF',
  green: '#16a34a',
  greenLight: '#bbf7d0',
  greenSurface: '#f0fdf4',
  red: '#dc2626',
  redLight: '#fecaca',
  redSurface: '#fef2f2',
  blue: '#1D4ED8',
  blueSurface: '#EFF6FF',
  yellow: '#d97706',
  yellowSurface: '#fffbeb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  white: '#FFFFFF',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Math.abs(n).toLocaleString('en-LK');
};

const fmtDate = (ts) => {
  if (!ts) return '—';
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function SellingProfitLossScreen({ navigation, route }) {
  // Optional: pre-filter by variety passed from PostHarvestAdvisor
  const filterVariety = route.params?.variety || null;

  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);          // completed deals
  const [harvests, setHarvests] = useState([]);    // farmer's harvest records (for prod cost)
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [customProdCost, setCustomProdCost] = useState('');

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [loading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // 1. Completed deals
      const dealsSnap = await db
        .collection('users').doc(uid)
        .collection('completedDeals')
        .orderBy('completedAt', 'desc')
        .limit(50)
        .get();
      const rawDeals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Harvest records (for production cost per batch)
      const harvestSnap = await db
        .collection('harvests')
        .where('userId', '==', uid)
        .get();
      const rawHarvests = harvestSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setHarvests(rawHarvests);

      // 3. Enrich deals with production cost
      const enriched = rawDeals.map(deal => {
        // Match harvest by variety (case insensitive)
        const matchHarvest = rawHarvests.find(
          h => (h.variety || '').toLowerCase() === (deal.riceVariety || '').toLowerCase()
        );

        // Production cost per kg from harvest record
        const prodCostPerKg = matchHarvest?.prodCost && matchHarvest?.quantityKg
          ? parseFloat(matchHarvest.prodCost) / parseFloat(matchHarvest.quantityKg)
          : null;

        const qty = parseFloat(deal.quantitySoldKg) || 0;
        const revenue = parseFloat(deal.riceAmount) || (qty * (parseFloat(deal.pricePerKg) || 0));
        const transportCost = parseFloat(deal.transportCost) || 0;
        const prodCostTotal = prodCostPerKg !== null ? prodCostPerKg * qty : null;
        const totalCost = (prodCostTotal || 0) + transportCost;
        const profit = prodCostTotal !== null ? revenue - totalCost : null;

        return {
          ...deal,
          revenue,
          transportCost,
          prodCostPerKg,
          prodCostTotal,
          totalCost,
          profit,
          matchHarvest,
        };
      });

      // Optional: filter by variety
      const filtered = filterVariety
        ? enriched.filter(d => (d.riceVariety || '').toLowerCase().includes(filterVariety.toLowerCase()))
        : enriched;

      setDeals(filtered);
    } catch (e) {
      console.error('SellingProfitLoss fetch error:', e);
      Alert.alert('Error', 'Could not load selling data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Summary totals ───────────────────────────────────────────────────────
  const totals = deals.reduce(
    (acc, d) => ({
      revenue: acc.revenue + (d.revenue || 0),
      cost: acc.cost + (d.totalCost || 0),
      profit: acc.profit + (d.profit || 0),
      qty: acc.qty + (parseFloat(d.quantitySoldKg) || 0),
      count: acc.count + 1,
      knownProfit: d.profit !== null ? acc.knownProfit + 1 : acc.knownProfit,
    }),
    { revenue: 0, cost: 0, profit: 0, qty: 0, count: 0, knownProfit: 0 }
  );

  const overallProfitable = totals.profit >= 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />

      {/* Header */}
      <LinearGradient colors={['#16a34a', '#064e3b']} style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={st.headerTitle}>Selling Profit & Loss</Text>
          <Text style={st.headerSub}>Analysis of your completed deals</Text>
        </View>
        <TouchableOpacity onPress={fetchData} style={st.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={20} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={st.loadingBox}>
          <ActivityIndicator size="large" color={C.green} />
          <Text style={st.loadingText}>Calculating profit & loss...</Text>
        </View>
      ) : deals.length === 0 ? (
        <EmptyState onBack={() => navigation.goBack()} />
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={st.content}
          style={{ opacity: fadeAnim }}
        >
          {/* ── SUMMARY CARD ─── */}
          <SummaryCard totals={totals} overallProfitable={overallProfitable} />

          {/* ── DEAL LIST ─── */}
          <Text style={st.sectionLabel}>COMPLETED DEALS</Text>
          {deals.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              expanded={selectedDeal === deal.id}
              onToggle={() => setSelectedDeal(prev => prev === deal.id ? null : deal.id)}
            />
          ))}

          {/* ── Tips ─── */}
          <TipsCard totals={totals} />

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ totals, overallProfitable }) {
  const profitColor = overallProfitable ? C.green : C.red;
  const profitBg = overallProfitable ? C.greenSurface : C.redSurface;
  const profitIcon = overallProfitable ? 'trending-up' : 'trending-down';

  return (
    <View style={st.summaryCard}>
      {/* Big profit/loss banner */}
      <LinearGradient
        colors={overallProfitable ? ['#16a34a', '#15803d'] : ['#dc2626', '#b91c1c']}
        style={st.summaryBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={st.summaryBannerLeft}>
          <Text style={st.summaryBannerLabel}>
            {totals.knownProfit === 0
              ? 'TOTAL REVENUE'
              : overallProfitable ? 'TOTAL PROFIT' : 'TOTAL LOSS'}
          </Text>
          <Text style={st.summaryBannerAmount}>
            {totals.knownProfit === 0
              ? `Rs. ${fmt(totals.revenue)}`
              : `${overallProfitable ? '+' : '-'} Rs. ${fmt(totals.profit)}`}
          </Text>
          <Text style={st.summaryBannerSub}>
            {totals.count} deal{totals.count !== 1 ? 's' : ''} · {fmt(totals.qty)} kg sold
          </Text>
        </View>
        <MaterialCommunityIcons name={profitIcon} size={52} color="rgba(255,255,255,0.3)" />
      </LinearGradient>

      {/* Metric grid */}
      <View style={st.summaryGrid}>
        <SummaryMetric
          icon="cash-multiple" color={C.green} bg={C.greenSurface}
          label="Total Revenue" value={`Rs. ${fmt(totals.revenue)}`}
        />
        <SummaryMetric
          icon="receipt" color={C.red} bg={C.redSurface}
          label="Total Cost" value={totals.knownProfit > 0 ? `Rs. ${fmt(totals.cost)}` : 'No cost data'}
        />
        <SummaryMetric
          icon="weight-kilogram" color={C.blue} bg={C.blueSurface}
          label="Qty Sold" value={`${fmt(totals.qty)} kg`}
        />
        <SummaryMetric
          icon="chart-bar" color={C.yellow} bg={C.yellowSurface}
          label="Avg Price/kg"
          value={totals.qty > 0 ? `Rs. ${(totals.revenue / totals.qty).toFixed(1)}` : '—'}
        />
      </View>

      {totals.knownProfit === 0 && (
        <View style={st.noCostHint}>
          <MaterialCommunityIcons name="information-outline" size={14} color={C.yellow} />
          <Text style={st.noCostHintText}>
            Add production cost to your harvest records to see exact profit/loss calculations.
          </Text>
        </View>
      )}
    </View>
  );
}

function SummaryMetric({ icon, color, bg, label, value }) {
  return (
    <View style={[st.summaryMetric, { backgroundColor: bg, borderColor: color + '30' }]}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={[st.summaryMetricValue, { color }]}>{value}</Text>
      <Text style={st.summaryMetricLabel}>{label}</Text>
    </View>
  );
}

// ─── Deal Card ────────────────────────────────────────────────────────────────
function DealCard({ deal, expanded, onToggle }) {
  const hasProfit = deal.profit !== null;
  const isProfit = hasProfit && deal.profit >= 0;
  const profitColor = isProfit ? C.green : C.red;
  const profitBg = isProfit ? C.greenSurface : C.redSurface;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={st.dealCard}>
      {/* Header row */}
      <View style={st.dealCardHeader}>
        <View style={st.dealVarietyBadge}>
          <MaterialCommunityIcons name="rice" size={14} color={C.green} />
          <Text style={st.dealVarietyText}>{deal.riceVariety || 'Rice'}</Text>
        </View>
        <Text style={st.dealDate}>{fmtDate(deal.completedAt)}</Text>
      </View>

      {/* Main row */}
      <View style={st.dealMainRow}>
        <View style={{ flex: 1 }}>
          <Text style={st.dealDealer} numberOfLines={1}>{deal.dealerName || 'Dealer'}</Text>
          <Text style={st.dealMeta}>
            {fmt(deal.quantitySoldKg)} kg · Rs.{deal.pricePerKg}/kg
          </Text>
        </View>
        <View style={[st.dealProfitBadge, { backgroundColor: profitBg, borderColor: profitColor + '40' }]}>
          <MaterialCommunityIcons
            name={isProfit ? 'trending-up' : hasProfit ? 'trending-down' : 'cash'}
            size={14} color={profitColor}
          />
          <Text style={[st.dealProfitText, { color: profitColor }]}>
            {hasProfit
              ? `${isProfit ? '+' : '-'} Rs. ${fmt(deal.profit)}`
              : `Rs. ${fmt(deal.revenue)}`}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20} color={C.textMuted} style={{ marginLeft: 8 }}
        />
      </View>

      {/* Expanded breakdown */}
      {expanded && (
        <View style={st.dealBreakdown}>
          <View style={st.breakdownDivider} />
          <BreakdownRow
            icon="cash-plus" color={C.green}
            label="Revenue" value={`Rs. ${fmt(deal.revenue)}`}
          />
          {deal.prodCostTotal !== null && (
            <BreakdownRow
              icon="sprout" color={C.textSecondary}
              label="Production Cost" value={`Rs. ${fmt(deal.prodCostTotal)}`}
            />
          )}
          {deal.prodCostPerKg !== null && (
            <BreakdownRow
              icon="calculator" color={C.textSecondary}
              label="Prod. Cost/kg" value={`Rs. ${deal.prodCostPerKg.toFixed(2)}`}
            />
          )}
          {deal.transportCost > 0 && (
            <BreakdownRow
              icon="truck-delivery" color={C.blue}
              label="Transport Cost" value={`Rs. ${fmt(deal.transportCost)}`}
            />
          )}
          {deal.prodCostTotal !== null && (
            <BreakdownRow
              icon="minus-circle" color={C.red}
              label="Total Cost" value={`Rs. ${fmt(deal.totalCost)}`}
            />
          )}
          <View style={st.breakdownDivider} />
          {hasProfit ? (
            <View style={[st.profitRow, { backgroundColor: isProfit ? C.greenSurface : C.redSurface }]}>
              <MaterialCommunityIcons
                name={isProfit ? 'trending-up' : 'trending-down'}
                size={16} color={isProfit ? C.green : C.red}
              />
              <Text style={[st.profitRowLabel, { color: isProfit ? C.green : C.red }]}>
                {isProfit ? 'NET PROFIT' : 'NET LOSS'}
              </Text>
              <Text style={[st.profitRowValue, { color: isProfit ? C.green : C.red }]}>
                {isProfit ? '+' : '-'} Rs. {fmt(deal.profit)}
              </Text>
            </View>
          ) : (
            <View style={[st.profitRow, { backgroundColor: C.greenSurface }]}>
              <MaterialCommunityIcons name="cash" size={16} color={C.green} />
              <Text style={[st.profitRowLabel, { color: C.green }]}>REVENUE</Text>
              <Text style={[st.profitRowValue, { color: C.green }]}>Rs. {fmt(deal.revenue)}</Text>
              <Text style={st.noCostNote}> (no cost data)</Text>
            </View>
          )}
          {deal.grade && (
            <Text style={st.dealGradeNote}>Grade {deal.grade} paddy</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function BreakdownRow({ icon, color, label, value }) {
  return (
    <View style={st.breakdownRow}>
      <MaterialCommunityIcons name={icon} size={14} color={color} style={{ marginRight: 8 }} />
      <Text style={st.breakdownLabel}>{label}</Text>
      <Text style={st.breakdownValue}>{value}</Text>
    </View>
  );
}

// ─── Tips Card ────────────────────────────────────────────────────────────────
function TipsCard({ totals }) {
  const tips = [];
  if (totals.knownProfit === 0) {
    tips.push('💡 Add "Production Cost" when registering your harvest to automatically calculate profit/loss for every sale.');
  }
  if (totals.count > 0) {
    const avgPricePerKg = totals.qty > 0 ? totals.revenue / totals.qty : 0;
    if (avgPricePerKg < 120) {
      tips.push('📊 Your average selling price is below Rs. 120/kg. Consider holding stock and selling near festival seasons for higher prices.');
    }
  }
  tips.push('🏪 Use the Dealer Market to compare live prices before your next sale.');
  tips.push('📈 AI Post-Harvest Advisor can predict the best time to sell to maximize profit.');

  if (tips.length === 0) return null;

  return (
    <View style={st.tipsCard}>
      <View style={st.tipsHeader}>
        <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={C.yellow} />
        <Text style={st.tipsTitle}>Tips to Improve Profit</Text>
      </View>
      {tips.map((tip, i) => (
        <Text key={i} style={st.tipText}>{tip}</Text>
      ))}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onBack }) {
  return (
    <View style={st.emptyState}>
      <MaterialCommunityIcons name="cash-remove" size={72} color="#e5e7eb" />
      <Text style={st.emptyTitle}>No Completed Deals Yet</Text>
      <Text style={st.emptySub}>
        Once you sell paddy via the Dealer Market, your profit & loss data will appear here automatically.
      </Text>
      <TouchableOpacity style={st.emptyBtn} onPress={onBack}>
        <MaterialCommunityIcons name="arrow-left" size={18} color="#fff" />
        <Text style={st.emptyBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 18, gap: 12,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    elevation: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },

  // Loading & empty
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: C.textSecondary, fontSize: 14 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.textPrimary, marginTop: 20, textAlign: 'center' },
  emptySub: { fontSize: 13, color: C.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14, marginTop: 24,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Content
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: C.textMuted, letterSpacing: 1.2,
    marginTop: 20, marginBottom: 10, paddingHorizontal: 2,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: C.card, borderRadius: 20, overflow: 'hidden',
    marginBottom: 8, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  summaryBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20,
  },
  summaryBannerLeft: { flex: 1 },
  summaryBannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  summaryBannerAmount: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 4 },
  summaryBannerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 },
  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8,
  },
  summaryMetric: {
    width: (width - 56) / 2,
    padding: 12, borderRadius: 14, borderWidth: 1,
    gap: 4,
  },
  summaryMetricValue: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  summaryMetricLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  noCostHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    margin: 12, marginTop: 0, padding: 12,
    backgroundColor: C.yellowSurface, borderRadius: 12,
    borderWidth: 1, borderColor: '#fde68a',
  },
  noCostHintText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 },

  // Deal Card
  dealCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10,
    elevation: 1, borderWidth: 1, borderColor: C.border,
  },
  dealCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dealVarietyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.greenSurface, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: C.greenLight,
  },
  dealVarietyText: { fontSize: 11, fontWeight: '700', color: C.green },
  dealDate: { fontSize: 11, color: C.textMuted },
  dealMainRow: { flexDirection: 'row', alignItems: 'center' },
  dealDealer: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  dealMeta: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  dealProfitBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  dealProfitText: { fontSize: 13, fontWeight: '800' },

  // Breakdown
  dealBreakdown: { marginTop: 12 },
  breakdownDivider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  breakdownLabel: { flex: 1, fontSize: 13, color: C.textSecondary },
  breakdownValue: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  profitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, marginTop: 4,
  },
  profitRowLabel: { flex: 1, fontSize: 13, fontWeight: '800' },
  profitRowValue: { fontSize: 16, fontWeight: '900' },
  noCostNote: { fontSize: 11, color: C.textMuted },
  dealGradeNote: { fontSize: 11, color: C.textMuted, marginTop: 6, textAlign: 'right' },

  // Tips Card
  tipsCard: {
    backgroundColor: '#fffbeb', borderRadius: 16, padding: 16, marginTop: 8,
    borderWidth: 1, borderColor: '#fde68a', elevation: 1,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tipsTitle: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  tipText: { fontSize: 13, color: '#78350f', lineHeight: 20, marginBottom: 6 },
});
