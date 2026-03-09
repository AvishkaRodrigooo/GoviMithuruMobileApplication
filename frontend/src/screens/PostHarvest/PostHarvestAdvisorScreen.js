/**
 * PostHarvestAdvisorScreen.js  —  GoviMithuru v5.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Modern Light Theme  |  New Backend Integration  |  Multilingual LLM Advice
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * BACKEND:  routes/postharvest_guardian.py  (v4.0 new backend)
 * ENDPOINTS USED:
 *   POST /api/guardian/predict   →  storage + price + risk + economics
 *   POST /api/guardian/advice    →  AI advisory (qwen2.5:7b, multilingual)
 *   GET  /api/guardian/weather   →  real-time climate sync
 *   GET  /api/guardian/varieties →  supported varieties
 *
 * LANGUAGE CODES (sent to /advice):
 *   'en'  → English
 *   'si'  → Sinhala (සිංහල)
 *   'ta'  → Tamil   (தமிழ்)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Animated, ActivityIndicator,
  SafeAreaView, StatusBar, Modal, Platform, Alert,
  Clipboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useUniversalLocation from '../../utils/useUniversalLocation';

const { width } = Dimensions.get('window');
import { BASE_URL } from '../../utils/apiConfig';
// ─── LIGHT THEME PALETTE ──────────────────────────────────────────────────────
const C = {
  bg: '#F5F7FA',
  card: '#FFFFFF',
  cardBorder: '#E8EDF2',
  green: '#2E7D32',
  greenLight: '#A5D6A7',
  greenSurface: '#E8F5E9',
  greenMid: '#4CAF50',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  yellow: '#F59E0B',
  yellowBg: '#FFFBEB',
  red: '#DC2626',
  redBg: '#FEF2F2',
  blue: '#1D4ED8',
  blueBg: '#EFF6FF',
  white: '#FFFFFF',
  shadow: 'rgba(0,0,0,0.07)',
  divider: '#F1F5F9',
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const VARIETIES = [
  'Bg 250', 'Bg 300', 'Bg 352', 'Bg 366', 'Bg 379-2',
  'Bg 403', 'At 306', 'At 362', 'At 405',
];

const METHODS = [
  { key: 'gunny', label: 'Gunny (Jute) Bag', icon: 'bag-personal-outline' },
  { key: 'polythene', label: 'Polythene Bag', icon: 'package-variant' },
  { key: 'hermetic', label: 'Hermetic Bag', icon: 'shield-check-outline' },
  { key: 'woven', label: 'PP Woven Bag', icon: 'texture-box' },
  { key: 'metalbin', label: 'Metal Silo / Bin', icon: 'barrel-outline' },
];

const SIGNAL_CFG = {
  GREEN: { color: C.green, bg: C.greenSurface, border: C.greenLight, icon: 'check-decagram', label: 'SAFE TO STORE', tagBg: '#D1FAE5' },
  YELLOW: { color: '#B45309', bg: C.yellowBg, border: '#FDE68A', icon: 'alert-decagram', label: 'PROCEED CAREFULLY', tagBg: '#FEF3C7' },
  RED: { color: C.red, bg: C.redBg, border: '#FECACA', icon: 'close-octagon', label: 'CRITICAL RISK', tagBg: '#FEE2E2' },
};

const LANG_OPTIONS = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'si', label: 'Sinhala', native: 'සිංහල' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
];

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

const SectionCard = ({ children, style }) => (
  <View style={[styles.sectionCard, style]}>{children}</View>
);

const CardHeader = ({ icon, title, subtitle }) => (
  <View style={styles.cardHeader}>
    <View style={styles.cardHeaderIcon}>
      <MaterialCommunityIcons name={icon} size={18} color={C.green} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
    </View>
  </View>
);

const MetricPill = ({ icon, label, value, color = C.green, bg = C.greenSurface }) => (
  <View style={[styles.metricPill, { backgroundColor: bg, borderColor: color + '40' }]}>
    <MaterialCommunityIcons name={icon} size={16} color={color} />
    <View style={{ marginLeft: 8 }}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  </View>
);

const SignalBadge = ({ signal }) => {
  const cfg = SIGNAL_CFG[signal] || SIGNAL_CFG.YELLOW;
  return (
    <View style={[styles.signalBadge, { backgroundColor: cfg.tagBg, borderColor: cfg.border }]}>
      <MaterialCommunityIcons name={cfg.icon} size={14} color={cfg.color} />
      <Text style={[styles.signalBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function PostHarvestAdvisorScreen({ navigation, route }) {
  const initialBatch = route.params?.batch;

  // ── Tab State
  const [activeTab, setActiveTab] = useState('analyze');

  // ── Form State
  const [variety, setVariety] = useState(initialBatch?.variety || 'Bg 300');
  const [method, setMethod] = useState(initialBatch?.storageType || 'gunny');
  const [moisture, setMoisture] = useState(parseFloat(initialBatch?.moisture) || 13.5);
  const [temp, setTemp] = useState(28.0);
  const [humidity, setHumidity] = useState(65.0);
  const [quantity, setQuantity] = useState(initialBatch?.quantityKg?.toString() || '1000');

  // ── Prediction + Advice State
  const [prediction, setPrediction] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [adviceLang, setAdviceLang] = useState(null);
  const [loadingPred, setLoadingPred] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // ── Weather Sync
  const [syncStatus, setSyncStatus] = useState('idle');
  const [calibMsg, setCalibMsg] = useState('');
  const location = useUniversalLocation('en');

  // ── Modals
  const [modalType, setModalType] = useState(null);  // 'variety' | 'method'

  // ── Advisor expand
  const [adviceExpanded, setAdviceExpanded] = useState(true);

  // ── Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  // ── Sync params from route if batch changes
  useEffect(() => {
    if (route.params?.batch) {
      const b = route.params.batch;
      setVariety(b.variety || 'Bg 300');
      setMethod(b.storageType || 'gunny');
      setMoisture(parseFloat(b.moisture) || 13.5);
      setQuantity(b.quantityKg?.toString() || '1000');
    }
  }, [route.params?.batch]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [activeTab]);

  // ── Auto weather sync on location ready
  useEffect(() => {
    const lat = location.latitude;
    const lon = location.longitude;
    if (lat && lon && syncStatus === 'idle') {
      syncWeather(lat, lon);
    }
  }, [location.latitude, location.longitude]);

  const syncWeather = async (lat, lon) => {
    setSyncStatus('syncing');
    try {
      const res = await fetch(`${BASE_URL}/api/guardian/weather?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data.success) {
        const indoorTemp = (data.temp_c || 28) + 3;  // +3°C indoor thermal gain
        setTemp(parseFloat(indoorTemp.toFixed(1)));
        setHumidity(data.humidity_pct || 65);
        setSyncStatus('synced');
        setCalibMsg(`Weather synced. Outdoor: ${data.temp_c?.toFixed(1)}°C. Indoor estimated: ${indoorTemp.toFixed(1)}°C.`);
      } else {
        setSyncStatus('error');
      }
    } catch {
      setSyncStatus('error');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // API CALLS
  // ─────────────────────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    if (!quantity || isNaN(parseFloat(quantity))) {
      Alert.alert('Missing Input', 'Please enter a valid quantity in kg.');
      return;
    }
    setLoadingPred(true);
    setPrediction(null);
    setAdvice(null);
    setAdviceLang(null);
    try {
      const res = await fetch(`${BASE_URL}/api/guardian/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variety,
          bag_type: method,
          storage_method: method,           // backward compat
          moisture_pct: moisture,
          temp_c: temp,
          humidity_pct: humidity,
          quantity_kg: parseFloat(quantity),
          duration_months: 3,
          has_pest_history: false,
          storage_location: 'home',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPrediction(data);
      } else {
        Alert.alert('Prediction Error', data.error || 'Prediction failed.');
      }
    } catch {
      Alert.alert('Connection Error', `Cannot reach backend at ${BASE_URL}`);
    } finally {
      setLoadingPred(false);
    }
  };

  const fetchAdvice = async (langCode) => {
    if (!prediction) return;
    setLoadingAdvice(true);
    setAdvice(null);
    setAdviceLang(langCode);
    setActiveTab('advisor');

    try {
      const p = prediction;
      const res = await fetch(`${BASE_URL}/api/guardian/advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variety,
          bag_type: method,
          storage_method: method,
          moisture_pct: moisture,
          temp_c: temp,
          humidity_pct: humidity,
          quantity_kg: parseFloat(quantity),
          storage_days: p.storage?.storage_days || 90,
          days_to_peak: p.price?.days_to_peak || 84,
          current_price: p.price?.current_lkr || 249,
          peak_price: p.price?.peak_lkr || 262,
          signal: p.signal || 'YELLOW',
          net_profit: p.costs?.net_profit || 0,
          next_festival: p.next_festival || null,
          lang: langCode,
          mode: 'general',
        }),
      });
      const data = await res.json();
      if (data.success && data.advice) {
        setAdvice(data.advice);
      } else {
        Alert.alert('AI Error', data.error || 'Could not generate advice. Is Ollama running?');
        setAdvice(null);
      }
    } catch {
      Alert.alert('AI Error', 'Could not reach the AI advisor. Ensure Ollama is running with qwen2.5:7b.');
    } finally {
      setLoadingAdvice(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const StepCounter = ({ value, min, max, unit, danger, onChange, label }) => (
    <View style={styles.stepCounter}>
      <View style={styles.stepCounterRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.valueBadge, { backgroundColor: value > danger ? C.redBg : C.greenSurface }]}>
          <Text style={[styles.valueBadgeText, { color: value > danger ? C.red : C.green }]}>
            {value.toFixed(1)}{unit}
          </Text>
        </View>
      </View>
      <View style={styles.stepRow}>
        <TouchableOpacity
          style={[styles.stepBtn, { borderColor: C.cardBorder }]}
          onPress={() => onChange(Math.max(min, parseFloat((value - 0.5).toFixed(1))))}
        >
          <MaterialCommunityIcons name="minus" size={18} color={C.textSecondary} />
        </TouchableOpacity>
        <View style={styles.stepTrack}>
          <View style={[styles.stepFill, {
            width: `${((value - min) / (max - min)) * 100}%`,
            backgroundColor: value > danger ? C.red : C.green
          }]} />
        </View>
        <TouchableOpacity
          style={[styles.stepBtn, { borderColor: C.cardBorder }]}
          onPress={() => onChange(Math.min(max, parseFloat((value + 0.5).toFixed(1))))}
        >
          <MaterialCommunityIcons name="plus" size={18} color={C.green} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: ANALYZE
  // ─────────────────────────────────────────────────────────────────────────
  const renderAnalyze = () => (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      style={{ opacity: fadeAnim }}
    >
      {/* Pre-filled batch notice */}
      {initialBatch && (
        <View style={styles.batchNotice}>
          <MaterialCommunityIcons name="layers-outline" size={18} color={C.green} />
          <Text style={styles.batchNoticeText}>
            Analyzing: <Text style={{ fontWeight: '700', color: C.green }}>{initialBatch.variety}</Text>
            {initialBatch.location ? ` · ${initialBatch.location}` : ''}
          </Text>
          <View style={styles.preFilledTag}><Text style={styles.preFilledTagText}>PRE-FILLED</Text></View>
        </View>
      )}

      {/* Input Card */}
      <SectionCard>
        <CardHeader icon="tune-variant" title="Harvest Details" subtitle="Enter your paddy storage parameters" />

        {/* Variety Picker */}
        <TouchableOpacity style={styles.pickerRow} onPress={() => setModalType('variety')}>
          <MaterialCommunityIcons name="sprout-outline" size={18} color={C.green} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.pickerLabel}>Rice Variety</Text>
            <Text style={styles.pickerValue}>{variety}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={20} color={C.textSecondary} />
        </TouchableOpacity>

        {/* Storage Method Picker */}
        <TouchableOpacity style={styles.pickerRow} onPress={() => setModalType('method')}>
          <MaterialCommunityIcons name={METHODS.find(m => m.key === method)?.icon || 'bag-personal-outline'} size={18} color={C.green} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.pickerLabel}>Storage Container</Text>
            <Text style={styles.pickerValue}>{METHODS.find(m => m.key === method)?.label || method}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={20} color={C.textSecondary} />
        </TouchableOpacity>

        {/* Moisture Slider */}
        <StepCounter
          label="Grain Moisture Content"
          value={moisture}
          min={7} max={22}
          unit="%" danger={14}
          onChange={setMoisture}
        />

        {/* Climate Card */}
        <View style={styles.climateCard}>
          <View style={styles.climateHeader}>
            <MaterialCommunityIcons name="cloud-sync-outline" size={16} color={C.green} />
            <Text style={styles.climateTitle}>CLIMATE SYNC</Text>
            <View style={[styles.syncDot, { backgroundColor: syncStatus === 'synced' ? C.green : syncStatus === 'syncing' ? C.yellow : C.textMuted }]} />
            <Text style={[styles.syncLabel, { color: syncStatus === 'synced' ? C.green : C.textMuted }]}>
              {syncStatus === 'synced' ? 'LIVE' : syncStatus === 'syncing' ? 'SYNCING' : 'OFFLINE'}
            </Text>
          </View>
          <View style={styles.climateGrid}>
            <View style={styles.climateBox}>
              <MaterialCommunityIcons name="thermometer" size={20} color={temp > 30 ? C.red : C.green} />
              <Text style={[styles.climateValue, { color: temp > 30 ? C.red : C.textPrimary }]}>{temp.toFixed(1)}°C</Text>
              <Text style={styles.climateBoxLabel}>Warehouse Temp</Text>
            </View>
            <View style={styles.climateBox}>
              <MaterialCommunityIcons name="water-percent" size={20} color={humidity > 80 ? C.red : C.blue} />
              <Text style={[styles.climateValue, { color: humidity > 80 ? C.red : C.textPrimary }]}>{humidity.toFixed(0)}%</Text>
              <Text style={styles.climateBoxLabel}>Humidity</Text>
            </View>
          </View>
          {calibMsg ? (
            <Text style={styles.calibMsg}>{calibMsg}</Text>
          ) : null}
        </View>

        {/* Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Quantity (kg)</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g. 1000"
            placeholderTextColor={C.textMuted}
          />
        </View>

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.primaryBtn, loadingPred && styles.primaryBtnDisabled]}
          onPress={runAnalysis}
          disabled={loadingPred}
        >
          {loadingPred ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="chart-line" size={20} color={C.white} />
              <Text style={styles.primaryBtnText}>Run Forecast Analysis</Text>
            </>
          )}
        </TouchableOpacity>
      </SectionCard>

      {/* Prediction Results */}
      {prediction && renderPredictionResults()}
    </Animated.ScrollView>
  );

  const renderPredictionResults = () => {
    const sig = prediction.signal || 'YELLOW';
    const cfg = SIGNAL_CFG[sig];
    const stor = prediction.storage || {};
    const price = prediction.price || {};
    const risk = prediction.risk || {};
    const costs = prediction.costs || {};
    const fest = prediction.next_festival;

    return (
      <View style={styles.resultsWrapper}>
        {/* Signal Banner */}
        <View style={[styles.signalBanner, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <MaterialCommunityIcons name={cfg.icon} size={28} color={cfg.color} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.signalTitle, { color: cfg.color }]}>{cfg.label}</Text>
            <Text style={styles.signalAction}>{prediction.summary?.recommendation || prediction.risk_reward?.action || ''}</Text>
          </View>
        </View>

        {/* Key Metrics Row */}
        <View style={styles.metricsRow}>
          <MetricPill
            icon="calendar-clock"
            label="Safe Storage"
            value={`${stor.storage_days || '—'} days`}
            color={C.green} bg={C.greenSurface}
          />
          <MetricPill
            icon="shield-half-full"
            label="Risk Score"
            value={`${risk.score || '—'}/100`}
            color={risk.score >= 70 ? C.green : risk.score >= 50 ? '#B45309' : C.red}
            bg={risk.score >= 70 ? C.greenSurface : risk.score >= 50 ? C.yellowBg : C.redBg}
          />
        </View>

        {/* Price Forecast Card */}
        <SectionCard>
          <CardHeader icon="trending-up" title="Price Forecast" subtitle="Based on DOA/HARTI 2024/25 data" />
          <View style={styles.priceRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceMeta}>CURRENT</Text>
              <Text style={styles.priceValue}>Rs. {price.current_lkr}</Text>
              <Text style={styles.priceUnit}>per kg</Text>
            </View>
            <View style={styles.priceArrow}>
              <MaterialCommunityIcons name="arrow-right-thick" size={22} color={C.green} />
              <Text style={styles.gainPct}>+{price.gain_pct}%</Text>
            </View>
            <View style={[styles.priceBox, styles.peakBox]}>
              <Text style={[styles.priceMeta, { color: C.green }]}>PEAK FORECAST</Text>
              <Text style={[styles.priceValue, { color: C.green }]}>Rs. {price.peak_lkr}</Text>
              <Text style={styles.priceUnit}>in {price.days_to_peak} days</Text>
            </View>
          </View>
          {/* Net Profit Bar */}
          <View style={styles.profitBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.profitLabel}>Potential Net Profit</Text>
              <Text style={styles.profitValue}>
                Rs. {typeof costs.net_profit === 'number' ? costs.net_profit.toLocaleString() : '—'}
              </Text>
            </View>
            <View style={[styles.profitSignal, { backgroundColor: costs.profitability === 'YES' ? C.greenSurface : C.yellowBg }]}>
              <Text style={[styles.profitSignalText, { color: costs.profitability === 'YES' ? C.green : '#B45309' }]}>
                {costs.profitability || 'MARGINAL'}
              </Text>
            </View>
          </View>
        </SectionCard>

        {/* Storage Details */}
        <SectionCard>
          <CardHeader icon="package-variant-closed" title="Storage Analysis" />
          <View style={styles.storageGrid}>
            <View style={styles.storageItem}>
              <Text style={styles.storageItemLabel}>Container</Text>
              <Text style={styles.storageItemValue}>{METHODS.find(m => m.key === method)?.label || method}</Text>
            </View>
            <View style={styles.storageItem}>
              <Text style={styles.storageItemLabel}>Grade</Text>
              <Text style={[styles.storageItemValue, { color: C.green }]}>{stor.grade || '—'}</Text>
            </View>
            <View style={styles.storageItem}>
              <Text style={styles.storageItemLabel}>Moisture Risk</Text>
              <Text style={[styles.storageItemValue, { color: stor.moisture_risk === 'SAFE' ? C.green : C.red }]}>
                {stor.moisture_risk || '—'}
              </Text>
            </View>
            <View style={styles.storageItem}>
              <Text style={styles.storageItemLabel}>Weevil Risk</Text>
              <Text style={[styles.storageItemValue, {
                color: stor.weevil_risk === 'LOW' ? C.green : stor.weevil_risk === 'MEDIUM' ? '#B45309' : C.red
              }]}>
                {stor.weevil_risk || '—'}
              </Text>
            </View>
          </View>
          {stor.explanation ? (
            <View style={styles.explanationBox}>
              <MaterialCommunityIcons name="information-outline" size={14} color={C.textSecondary} />
              <Text style={styles.explanationText}>{stor.explanation}</Text>
            </View>
          ) : null}
        </SectionCard>

        {/* Festival Insight */}
        {fest && (
          <View style={styles.festivalCard}>
            <Text style={styles.festEmoji}>{fest.emoji || '🎊'}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.festName}>{fest.name}</Text>
              <Text style={styles.festDetail}>
                In {fest.days_away} days  ·  +{fest.boost_pct}% price boost expected
              </Text>
            </View>
          </View>
        )}

        {/* CTA → Advisor */}
        <TouchableOpacity style={styles.advisorCta} onPress={() => setActiveTab('advisor')}>
          <MaterialCommunityIcons name="robot-happy-outline" size={20} color={C.white} />
          <Text style={styles.advisorCtaText}>Get AI Advisory Explanation</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={C.white} />
        </TouchableOpacity>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: ADVISOR
  // ─────────────────────────────────────────────────────────────────────────
  const renderAdvisor = () => {
    if (!prediction) {
      return (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
          <MaterialCommunityIcons name="chart-line-stacked" size={56} color={C.greenLight} />
          <Text style={styles.emptyTitle}>No Forecast Yet</Text>
          <Text style={styles.emptySub}>Run the forecast in the Analyze tab first to generate AI advice.</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setActiveTab('analyze')}>
            <Text style={styles.secondaryBtnText}>Go to Analysis</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    const sig = prediction.signal || 'YELLOW';
    const cfg = SIGNAL_CFG[sig];

    return (
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ opacity: fadeAnim }}
      >
        {/* Prediction Summary Strip */}
        <View style={[styles.advisorSummaryStrip, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <SignalBadge signal={sig} />
          <View style={styles.advisorSummaryMeta}>
            <Text style={styles.advisorSummaryVariety}>{variety} · {quantity} kg</Text>
            <Text style={styles.advisorSummarySub}>
              Storage: {prediction.storage?.storage_days} days  ·  Peak: +{prediction.price?.gain_pct}%
            </Text>
          </View>
        </View>

        {/* ── LANGUAGE SELECTION ───────────────────────────────────────────── */}
        <SectionCard>
          <CardHeader
            icon="translate"
            title="AI Advisor Explanation"
            subtitle="Choose your language for a detailed explanation"
          />

          <Text style={styles.langInstructionText}>
            Tap a language to generate advice from <Text style={{ fontWeight: '700', color: C.green }}>qwen2.5:7b</Text>:
          </Text>

          <View style={styles.langButtonRow}>
            {LANG_OPTIONS.map((lang) => {
              const isActive = adviceLang === lang.code;
              const isLoading = loadingAdvice && adviceLang === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langBtn,
                    isActive && styles.langBtnActive,
                    isLoading && styles.langBtnLoading,
                  ]}
                  onPress={() => fetchAdvice(lang.code)}
                  disabled={loadingAdvice}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={C.white} />
                  ) : (
                    <>
                      <Text style={[styles.langBtnLabel, isActive && styles.langBtnLabelActive]}>
                        {lang.native}
                      </Text>
                      {isActive && !loadingAdvice && (
                        <MaterialCommunityIcons name="check" size={12} color={C.white} style={{ marginLeft: 4 }} />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {!advice && !loadingAdvice && (
            <View style={styles.langHint}>
              <MaterialCommunityIcons name="gesture-tap" size={16} color={C.textMuted} />
              <Text style={styles.langHintText}>Select a language above to generate advice</Text>
            </View>
          )}
        </SectionCard>

        {/* ── LOADING STATE ────────────────────────────────────────────────── */}
        {loadingAdvice && (
          <SectionCard>
            <View style={styles.loadingAdviceContainer}>
              <View style={styles.loadingPulse}>
                <ActivityIndicator size="large" color={C.green} />
              </View>
              <Text style={styles.loadingAdviceTitle}>Consulting AI Advisor...</Text>
              <Text style={styles.loadingAdviceSub}>
                qwen2.5:7b is generating your {LANG_OPTIONS.find(l => l.code === adviceLang)?.label || ''} advice
              </Text>
              <View style={styles.loadingDots}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={[styles.loadingDot, { opacity: 0.3 + i * 0.25 }]} />
                ))}
              </View>
            </View>
          </SectionCard>
        )}

        {/* ── ADVICE DISPLAY ───────────────────────────────────────────────── */}
        {advice && !loadingAdvice && (
          <>
            {/* Headline */}
            {advice.headline && (
              <SectionCard>
                <View style={styles.headlineRow}>
                  <View style={[styles.headlineIcon, { backgroundColor: cfg.bg }]}>
                    <MaterialCommunityIcons name={cfg.icon} size={22} color={cfg.color} />
                  </View>
                  <Text style={styles.headlineText}>{advice.headline}</Text>
                </View>
                <View style={[styles.signalActionBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <Text style={[styles.signalActionText, { color: cfg.color }]}>
                    {advice.signal || sig}
                  </Text>
                </View>
              </SectionCard>
            )}

            {/* Sell vs Store Options */}
            <View style={styles.optionsRow}>
              {advice.sell_option && (
                <View style={[styles.optionCard, styles.sellOptionCard]}>
                  <Text style={styles.optionLabel}>SELL NOW</Text>
                  <Text style={styles.optionValue}>
                    {typeof advice.sell_option.value_lkr === 'number'
                      ? `Rs. ${advice.sell_option.value_lkr.toLocaleString()}`
                      : advice.sell_option.value_lkr || '—'}
                  </Text>
                  <Text style={styles.optionDesc}>{advice.sell_option.rationale}</Text>
                </View>
              )}
              {advice.store_option && (
                <View style={[styles.optionCard, styles.storeOptionCard]}>
                  <Text style={[styles.optionLabel, { color: C.green }]}>STORE & WAIT</Text>
                  <Text style={[styles.optionValue, { color: C.green }]}>
                    {typeof advice.store_option.projected_value_lkr === 'number'
                      ? `Rs. ${advice.store_option.projected_value_lkr.toLocaleString()}`
                      : advice.store_option.projected_value_lkr || 'Higher gain'}
                  </Text>
                  {advice.store_option.conditions && (
                    <Text style={styles.optionDesc}>{advice.store_option.conditions}</Text>
                  )}
                </View>
              )}
            </View>

            {/* Action Steps */}
            {advice.store_option?.steps?.length > 0 && (
              <SectionCard>
                <CardHeader icon="list-check" title="Recommended Action Plan" />
                {advice.store_option.steps.map((step, i) => (
                  <View key={i} style={styles.stepItem}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </SectionCard>
            )}

            {/* Festival Advice */}
            {advice.festival_advice && (
              <SectionCard>
                <CardHeader icon="calendar-star" title="Festival Timing Advice" />
                <Text style={styles.adviceBodyText}>{advice.festival_advice}</Text>
              </SectionCard>
            )}

            {/* Danger Warning */}
            {advice.danger_warning && (
              <View style={styles.dangerCard}>
                <MaterialCommunityIcons name="alert-octagon" size={20} color={C.red} />
                <Text style={styles.dangerText}>{advice.danger_warning}</Text>
              </View>
            )}

            {/* Quick Wins */}
            {advice.quick_wins?.length > 0 && (
              <SectionCard>
                <CardHeader icon="lightning-bolt-outline" title="Quick Wins" subtitle="Act on these today" />
                <View style={styles.quickWinsGrid}>
                  {advice.quick_wins.map((tip, i) => (
                    <View key={i} style={styles.quickWinPill}>
                      <MaterialCommunityIcons name="check-circle-outline" size={14} color={C.green} />
                      <Text style={styles.quickWinText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </SectionCard>
            )}

            {/* Copy / Language Switch */}
            <View style={styles.advisorFooter}>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={() => {
                  Clipboard.setString(JSON.stringify(advice, null, 2));
                  Alert.alert('Copied', 'Advice copied to clipboard');
                }}
              >
                <MaterialCommunityIcons name="content-copy" size={16} color={C.textSecondary} />
                <Text style={styles.footerBtnText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={() => { setAdvice(null); setAdviceLang(null); }}
              >
                <MaterialCommunityIcons name="refresh" size={16} color={C.textSecondary} />
                <Text style={styles.footerBtnText}>Switch Language</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.ScrollView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: TIPS
  // ─────────────────────────────────────────────────────────────────────────
  const renderTips = () => (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      style={{ opacity: fadeAnim }}
    >
      <Text style={styles.tipsTitle}>Storage Best Practices</Text>

      {/* Moisture Rule */}
      <View style={[styles.tipCard, moisture > 14 && styles.tipCardAlert]}>
        <MaterialCommunityIcons name="water-percent" size={28} color={moisture > 14 ? C.white : C.green} />
        <Text style={[styles.tipCardTitle, moisture > 14 && { color: C.white }]}>The 13% Safe Rule</Text>
        <Text style={[styles.tipCardDesc, moisture > 14 && { color: '#E8F5E9' }]}>
          {moisture > 14
            ? `⚠️ Your moisture (${moisture}%) is too high! Dry immediately to prevent fungal growth and aflatoxin.`
            : 'Keeping moisture at or below 13% is the single most important factor in rice storage. At this level, fungal growth is virtually zero.'}
        </Text>
      </View>

      <View style={styles.tipsRow}>
        <View style={[styles.tipCardSmall, { flex: 1, marginRight: 8 }]}>
          <MaterialCommunityIcons name="shield-lock-outline" size={22} color="#7C3AED" />
          <Text style={styles.tipCardTitle}>Hermetic Bags</Text>
          <Text style={styles.tipCardDesc}>Airtight hermetic bags suffocate weevils and prevent mold. Best for storage over 3 months.</Text>
        </View>
        <View style={[styles.tipCardSmall, { flex: 1 }]}>
          <MaterialCommunityIcons name="bug-outline" size={22} color={C.red} />
          <Text style={styles.tipCardTitle}>Kohomba (Neem)</Text>
          <Text style={styles.tipCardDesc}>Layer dried neem leaves between bags. Natural weevil repellent, free if you have a tree.</Text>
        </View>
      </View>

      <View style={[styles.tipCard, temp > 30 && styles.tipCardAlertTemp]}>
        <MaterialCommunityIcons name="thermometer-lines" size={28} color={temp > 30 ? C.white : C.blue} />
        <Text style={[styles.tipCardTitle, temp > 30 && { color: C.white }]}>Temperature Control</Text>
        <Text style={[styles.tipCardDesc, temp > 30 && { color: '#EFF6FF' }]}>
          {temp > 30
            ? `⚠️ Your warehouse (${temp}°C) is too hot. Weevil breeding doubles above 30°C. Open vents at 5–8 AM.`
            : 'Install PVC pipe breathers through walls at 45° angle. Allows hot air to escape passively at zero cost.'}
        </Text>
      </View>

      <View style={styles.tipCard}>
        <MaterialCommunityIcons name="layers-outline" size={28} color="#B45309" />
        <Text style={styles.tipCardTitle}>Floor Strategy</Text>
        <Text style={styles.tipCardDesc}>Never place bags on cement — it conducts moisture. Use a 10 cm layer of dry coconut husk (pol katu) or wooden pallets as a thermal break.</Text>
      </View>

      <View style={styles.tipsRow}>
        <View style={[styles.tipCardSmall, { flex: 1, marginRight: 8 }]}>
          <MaterialCommunityIcons name="cup-outline" size={22} color={C.textSecondary} />
          <Text style={styles.tipCardTitle}>Salt Bottle Test</Text>
          <Text style={styles.tipCardDesc}>Mix paddy + dry salt in a bottle. Sticks = MC &gt; 14%. Flows free = safe.</Text>
        </View>
        <View style={[styles.tipCardSmall, { flex: 1 }]}>
          <MaterialCommunityIcons name="mouse" size={22} color={C.textSecondary} />
          <Text style={styles.tipCardTitle}>Rat Guards</Text>
          <Text style={styles.tipCardDesc}>Wrap smooth tin sheets around pallet legs. Rats cannot grip the slippery surface.</Text>
        </View>
      </View>
    </Animated.ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MODALS
  // ─────────────────────────────────────────────────────────────────────────
  const renderPickerModal = () => {
    if (!modalType) return null;
    const isVariety = modalType === 'variety';
    const options = isVariety
      ? VARIETIES.map(v => ({ key: v, label: v }))
      : METHODS;
    const current = isVariety ? variety : method;

    return (
      <Modal visible transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalType(null)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              Select {isVariety ? 'Rice Variety' : 'Storage Container'}
            </Text>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const isSelected = opt.key === current;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      isVariety ? setVariety(opt.key) : setMethod(opt.key);
                      setModalType(null);
                    }}
                  >
                    {!isVariety && (
                      <MaterialCommunityIcons
                        name={opt.icon}
                        size={20}
                        color={isSelected ? C.green : C.textSecondary}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check-circle" size={20} color={C.green} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ROOT RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const TAB_LIST = [
    { key: 'analyze', icon: 'chart-line', label: 'Analyze' },
    { key: 'advisor', icon: 'robot-happy', label: 'Advisor' },
    { key: 'tips', icon: 'lightbulb-on', label: 'Tips' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Post-Harvest Advisor</Text>
          <Text style={styles.headerSub}>AI-Powered Storage & Market Intelligence</Text>
        </View>
        <View style={styles.headerBadge}>
          <MaterialCommunityIcons name="leaf" size={14} color={C.green} />
          <Text style={styles.headerBadgeText}>GoviMithuru</Text>
        </View>
      </View>

      {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TAB_LIST.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => {
                fadeAnim.setValue(0);
                slideAnim.setValue(16);
                setActiveTab(tab.key);
              }}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={18}
                color={isActive ? C.green : C.textMuted}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {/* Prediction result dot indicator on Advisor tab */}
              {tab.key === 'advisor' && prediction && !advice && (
                <View style={styles.tabDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {activeTab === 'analyze' && renderAnalyze()}
        {activeTab === 'advisor' && renderAdvisor()}
        {activeTab === 'tips' && renderTips()}
      </View>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      {renderPickerModal()}
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 8,
    paddingBottom: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.greenSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.green,
  },

  // ── Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabItemActive: {
    borderBottomColor: C.green,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  tabLabelActive: {
    color: C.green,
    fontWeight: '800',
  },
  tabDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.green,
  },

  // ── Content area
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── Section Card
  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  cardHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.greenSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 1,
  },

  // ── Batch Notice
  batchNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.greenSurface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.greenLight,
    gap: 8,
  },
  batchNoticeText: {
    flex: 1,
    fontSize: 13,
    color: C.textPrimary,
  },
  preFilledTag: {
    backgroundColor: C.green,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  preFilledTagText: {
    color: C.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ── Picker Row
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
    marginTop: 2,
  },

  // ── Step Counter (Moisture Slider)
  stepCounter: {
    marginBottom: 14,
  },
  stepCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  valueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  valueBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTrack: {
    flex: 1,
    height: 8,
    backgroundColor: C.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepFill: {
    height: '100%',
    borderRadius: 4,
  },

  // ── Climate Card
  climateCard: {
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  climateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  climateTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: C.textSecondary,
    letterSpacing: 1,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 4,
  },
  syncLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  climateGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  climateBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 4,
  },
  climateValue: {
    fontSize: 20,
    fontWeight: '900',
    color: C.textPrimary,
  },
  climateBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calibMsg: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 10,
    lineHeight: 16,
  },

  // ── Text Input
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    fontWeight: '600',
    color: C.textPrimary,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },

  // ── Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.green,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: C.greenSurface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: C.greenLight,
    marginTop: 16,
  },
  secondaryBtnText: {
    color: C.green,
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Results
  resultsWrapper: {
    marginTop: 4,
  },

  signalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 4,
  },
  signalTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  signalAction: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },

  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
  },
  signalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Metrics Row
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 10,
    color: C.textSecondary,
    fontWeight: '600',
  },

  // ── Price Forecast Card
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  peakBox: {
    borderColor: C.greenLight,
    backgroundColor: C.greenSurface,
  },
  priceMeta: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '900',
    color: C.textPrimary,
  },
  priceUnit: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 2,
  },
  priceArrow: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  gainPct: {
    fontSize: 11,
    fontWeight: '800',
    color: C.green,
    marginTop: 3,
  },
  profitBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  profitLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profitValue: {
    fontSize: 20,
    fontWeight: '900',
    color: C.textPrimary,
    marginTop: 2,
  },
  profitSignal: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 12,
  },
  profitSignalText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Storage Grid
  storageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  storageItem: {
    width: (width - 32 - 36 - 8) / 2,
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  storageItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  storageItemValue: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textPrimary,
  },
  explanationBox: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'flex-start',
  },
  explanationText: {
    flex: 1,
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 18,
  },

  // ── Festival Card
  festivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.yellowBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  festEmoji: {
    fontSize: 28,
  },
  festName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  festDetail: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },

  // ── Advisor CTA
  advisorCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.green,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 14,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  advisorCtaText: {
    flex: 1,
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ── Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.textPrimary,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // ── Advisor Summary Strip
  advisorSummaryStrip: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  advisorSummaryMeta: {
    flex: 1,
  },
  advisorSummaryVariety: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },
  advisorSummarySub: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },

  // ── Language Buttons
  langInstructionText: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  langButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    gap: 4,
  },
  langBtnActive: {
    backgroundColor: C.green,
    borderColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  langBtnLoading: {
    backgroundColor: C.green,
    borderColor: C.green,
    opacity: 0.85,
  },
  langBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textSecondary,
  },
  langBtnLabelActive: {
    color: C.white,
  },
  langHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    gap: 6,
  },
  langHintText: {
    fontSize: 12,
    color: C.textMuted,
  },

  // ── Loading Advice
  loadingAdviceContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.greenSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingAdviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textPrimary,
  },
  loadingAdviceSub: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.green,
  },

  // ── Advice Cards
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  headlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headlineText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: C.textPrimary,
    lineHeight: 24,
  },
  signalActionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  signalActionText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  optionCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  sellOptionCard: {
    backgroundColor: C.bg,
    borderColor: C.cardBorder,
  },
  storeOptionCard: {
    backgroundColor: C.greenSurface,
    borderColor: C.greenLight,
  },
  optionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: C.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  optionValue: {
    fontSize: 16,
    fontWeight: '900',
    color: C.textPrimary,
    marginBottom: 6,
  },
  optionDesc: {
    fontSize: 11,
    color: C.textSecondary,
    lineHeight: 16,
  },

  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '900',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: C.textPrimary,
    lineHeight: 20,
  },

  adviceBodyText: {
    fontSize: 14,
    color: C.textPrimary,
    lineHeight: 22,
  },

  dangerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.redBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 10,
    marginBottom: 12,
  },
  dangerText: {
    flex: 1,
    fontSize: 13,
    color: C.red,
    fontWeight: '600',
    lineHeight: 19,
  },

  quickWinsGrid: {
    gap: 8,
  },
  quickWinPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  quickWinText: {
    flex: 1,
    fontSize: 13,
    color: C.textPrimary,
    lineHeight: 18,
  },

  advisorFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 4,
    marginBottom: 8,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  footerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
  },

  // ── Tips
  tipsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  tipCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 8,
  },
  tipCardAlert: {
    backgroundColor: C.green,
    borderColor: C.greenMid,
  },
  tipCardAlertTemp: {
    backgroundColor: '#EF4444',
    borderColor: '#FCA5A5',
  },
  tipsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tipCardSmall: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 6,
  },
  tipCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textPrimary,
  },
  tipCardDesc: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 19,
  },

  // ── Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.cardBorder,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  modalItemActive: {
    backgroundColor: C.greenSurface,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: -4,
  },
  modalItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
  },
  modalItemTextActive: {
    color: C.green,
    fontWeight: '700',
  },
});