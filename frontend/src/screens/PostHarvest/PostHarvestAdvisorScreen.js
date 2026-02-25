

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Animated, ActivityIndicator,
  SafeAreaView, StatusBar, Modal, Platform, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_URL = 'http://192.168.100.200:5000';  

const VARIETIES = [
  'Bg 352', 'Bg 300', 'Bg 403', 'Bw 367', 'Suwandel', 'Rath Suwandel',
  'Kalu Heenati', 'Pokkali', 'Kuruluthuda', 'Pachchaperumal',
  'Ld 368', 'At 362', 'At 307', 'Bg 358',
];

const METHODS = ['Gunny bag', 'Polythene bag', 'Hermetic', 'Cold storage'];
const VARIETY_TYPES = ['Improved', 'Traditional'];

const SIGNAL_CONFIG = {
  GREEN:  { bg: ['#052e16', '#065f46'], pill: '#16a34a', icon: '🟢', label: 'SAFE TO STORE',    text: '#86efac' },
  YELLOW: { bg: ['#422006', '#78350f'], pill: '#ca8a04', icon: '🟡', label: 'PROCEED CAREFULLY', text: '#fde047' },
  RED:    { bg: ['#450a0a', '#7f1d1d'], pill: '#dc2626', icon: '🔴', label: 'CRITICAL RISK',    text: '#fca5a5' },
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function PostHarvestAdvisorScreen({ navigation }) {
  // Form state
  const [variety,       setVariety]       = useState('Bg 352');
  const [varietyType,   setVarietyType]   = useState('Improved');
  const [method,        setMethod]        = useState('Gunny bag');
  const [moisture,      setMoisture]      = useState(13);
  const [temp,          setTemp]          = useState(28);
  const [quantity,      setQuantity]      = useState('1000');

  // Result state
  const [prediction,   setPrediction]   = useState(null);
  const [advice,       setAdvice]       = useState('');
  const [loadingPred,  setLoadingPred]  = useState(false);
  const [loadingAdv,   setLoadingAdv]   = useState(false);

  // Modal state
  const [modalType,   setModalType]   = useState(null); // 'variety' | 'method' | 'type'

  // Animation
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const scrollRef   = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (prediction) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [prediction]);

  // ─── API Calls ───────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    if (!quantity || isNaN(parseFloat(quantity))) {
      Alert.alert('Input Required', 'Please enter a valid quantity in kg.');
      return;
    }
    setLoadingPred(true);
    setAdvice('');
    setPrediction(null);
    try {
      const res = await fetch(`${BASE_URL}/api/guardian/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variety,
          variety_type:   varietyType,
          storage_method: method,
          moisture_pct:   moisture,
          temp_c:         temp,
          quantity_kg:    parseFloat(quantity),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPrediction(data);
        // Auto-scroll to results
        setTimeout(() => scrollRef.current?.scrollTo({ y: 450, animated: true }), 300);
      } else {
        Alert.alert('Prediction Failed', data.error || 'Try again');
      }
    } catch (err) {
      Alert.alert('Connection Error', `Cannot reach server.\n${err.message}`);
    } finally {
      setLoadingPred(false);
    }
  };

  const getAIAdvice = async () => {
    if (!prediction) return;
    setLoadingAdv(true);
    try {
      const rr = prediction.risk_reward;
      const res = await fetch(`${BASE_URL}/api/guardian/advice`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variety,
          moisture_pct:         moisture,
          temp_c:               temp,
          storage_method:       method,
          quantity_kg:          parseFloat(quantity),
          storage_days:         prediction.storage.storage_days,
          days_to_peak:         prediction.price.days_to_peak,
          current_price:        prediction.price.current_lkr,
          peak_price:           prediction.price.peak_lkr,
          signal:               rr.signal,
          buffer_days:          rr.buffer_days,
          potential_profit:     rr.potential_profit_lkr,
          intervention_viable:  rr.intervention_viable,
          days_after_drying:    rr.days_after_drying,
        }),
      });
      const data = await res.json();
      setAdvice(data.advice || 'No advice generated.');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (err) {
      Alert.alert('AI Service Error', err.message);
    } finally {
      setLoadingAdv(false);
    }
  };

  // ─── Sub-components ──────────────────────────────────────────────────────

  const SignalBanner = ({ signal, urgency }) => {
    const cfg = SIGNAL_CONFIG[signal] || SIGNAL_CONFIG.YELLOW;
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <LinearGradient colors={cfg.bg} style={styles.signalBanner}>
          <Text style={styles.signalEmoji}>{cfg.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.signalLabel, { color: cfg.text }]}>{cfg.label}</Text>
            <Text style={[styles.signalUrgency, { color: cfg.pill }]}>{urgency}</Text>
          </View>
          <View style={[styles.signalPill, { backgroundColor: cfg.pill + '33' }]}>
            <Text style={[styles.signalPillText, { color: cfg.text }]}>{signal}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const MetricCard = ({ icon, label, value, sub, accent }) => (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons name={icon} size={22} color={accent} style={{ marginBottom: 6 }} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub && <Text style={styles.metricSub}>{sub}</Text>}
    </View>
  );

  const OptionRow = ({ label, options, selected, onSelect }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            style={[styles.optionBtn, selected === opt && styles.optionBtnActive]}
          >
            <Text style={[styles.optionBtnText, selected === opt && styles.optionBtnTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const SliderRow = ({ label, value, min, max, step, onChange, dangerThreshold, unit }) => {
    const isDanger = value > dangerThreshold;
    return (
      <View style={styles.inputGroup}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.inputLabel}>{label}</Text>
          <Text style={[styles.sliderValue, { color: isDanger ? '#f87171' : '#4ade80' }]}>
            {value}{unit}  {isDanger ? '⚠️' : '✓'}
          </Text>
        </View>
        <View style={styles.sliderTrack}>
          <View style={[
            styles.sliderFill,
            { width: `${((value - min) / (max - min)) * 100}%` },
            isDanger && styles.sliderFillDanger
          ]} />
        </View>
        <View style={styles.sliderBtns}>
          <TouchableOpacity
            onPress={() => onChange(Math.max(min, parseFloat((value - step).toFixed(1))))}
            style={styles.sliderBtn}
          >
            <MaterialCommunityIcons name="minus" size={18} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={styles.sliderMid}>
            {min}{unit} — {max}{unit}
          </Text>
          <TouchableOpacity
            onPress={() => onChange(Math.min(max, parseFloat((value + step).toFixed(1))))}
            style={styles.sliderBtn}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const PickerModal = ({ type, options, selected, onSelect }) => (
    <Modal visible={modalType === type} transparent animationType="slide"
           onRequestClose={() => setModalType(null)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>
            {type === 'variety' ? 'Select Variety' : type === 'method' ? 'Storage Method' : 'Variety Type'}
          </Text>
          <ScrollView>
            {options.map(opt => (
              <TouchableOpacity key={opt} style={[
                styles.modalItem, selected === opt && styles.modalItemActive
              ]} onPress={() => { onSelect(opt); setModalType(null); }}>
                <Text style={[styles.modalItemText, selected === opt && styles.modalItemTextActive]}>
                  {opt}
                </Text>
                {selected === opt && <MaterialCommunityIcons name="check-circle" size={20} color="#16a34a" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────
  const rr  = prediction?.risk_reward;
  const sig = rr?.signal || 'GREEN';
  const cfg = SIGNAL_CONFIG[sig];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#064e3b', '#065f46']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Post-Harvest Guardian</Text>
          <Text style={styles.headerSub}>XGBoost · LSTM · AI Advisory</Text>
        </View>
        <View style={styles.headerBadge}>
          <MaterialCommunityIcons name="brain" size={20} color="#34d399" />
          <Text style={styles.headerBadgeText}>AI</Text>
        </View>
      </LinearGradient>

      <ScrollView ref={scrollRef} style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Section: Farm Conditions ──────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={18} color="#34d399" />
              <Text style={styles.sectionTitle}>Farm Conditions</Text>
            </View>

            {/* Variety picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rice Variety</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setModalType('variety')}>
                <MaterialCommunityIcons name="rice" size={18} color="#34d399" />
                <Text style={styles.pickerBtnText}>{variety}</Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <OptionRow label="Variety Type" options={VARIETY_TYPES}
                       selected={varietyType} onSelect={setVarietyType} />

            {/* Storage method picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Storage Method</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setModalType('method')}>
                <MaterialCommunityIcons name="warehouse" size={18} color="#34d399" />
                <Text style={styles.pickerBtnText}>{method}</Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <SliderRow label="Moisture Content" value={moisture}
                       min={5} max={22} step={0.5} unit="%"
                       dangerThreshold={14} onChange={setMoisture} />

            <SliderRow label="Warehouse Temperature" value={temp}
                       min={5} max={45} step={1} unit="°C"
                       dangerThreshold={30} onChange={setTemp} />

            {/* Quantity */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity (kg)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="e.g. 2000"
                placeholderTextColor="#475569"
              />
            </View>

            {/* Analyse button */}
            <TouchableOpacity onPress={runAnalysis} disabled={loadingPred}
                              style={[styles.primaryBtn, loadingPred && styles.primaryBtnDisabled]}>
              <LinearGradient colors={['#059669', '#16a34a']} style={styles.primaryBtnGrad}>
                {loadingPred
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <MaterialCommunityIcons name="flash" size={20} color="#fff" />
                      <Text style={styles.primaryBtnText}>Run ML Analysis</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Section: Prediction Results ───────────────────────────── */}
          {prediction && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="chart-bar" size={18} color="#34d399" />
                <Text style={styles.sectionTitle}>Prediction Results</Text>
              </View>

              {/* Signal Banner */}
              <SignalBanner signal={rr.signal} urgency={rr.urgency} />

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <MetricCard icon="dna" label="XGBoost Storage"
                            value={`${prediction.storage.storage_days}d`}
                            sub={`${prediction.storage.storage_months} months`}
                            accent={prediction.storage.storage_days < prediction.price.days_to_peak ? '#f87171' : '#4ade80'} />
                <MetricCard icon="trending-up" label="LSTM Price Peak"
                            value={`${prediction.price.days_to_peak}d`}
                            sub={`${prediction.price.weeks_to_peak} weeks`}
                            accent="#a78bfa" />
                <MetricCard icon="scale-balance" label="Safety Buffer"
                            value={`${rr.buffer_days > 0 ? '+' : ''}${rr.buffer_days}d`}
                            sub={rr.buffer_days > 0 ? 'Safe margin' : 'In deficit'}
                            accent={rr.buffer_days > 0 ? '#4ade80' : '#f87171'} />
              </View>

              {/* Price Info */}
              <View style={styles.priceCard}>
                <View style={styles.priceRow}>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceItemLabel}>Current Price</Text>
                    <Text style={styles.priceItemValue}>{prediction.price.current_lkr}</Text>
                    <Text style={styles.priceItemUnit}>LKR/kg</Text>
                  </View>
                  <View style={styles.priceArrow}>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#475569" />
                  </View>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceItemLabel}>Predicted Peak</Text>
                    <Text style={[styles.priceItemValue, { color: '#4ade80' }]}>
                      {prediction.price.peak_lkr}
                    </Text>
                    <Text style={styles.priceItemUnit}>LKR/kg</Text>
                  </View>
                  <View style={styles.profitBox}>
                    <Text style={styles.profitLabel}>Potential</Text>
                    <Text style={styles.profitValue}>
                      +{(rr.potential_profit_lkr / 1000).toFixed(0)}K
                    </Text>
                    <Text style={styles.profitUnit}>LKR</Text>
                  </View>
                </View>
              </View>

              {/* Moisture Warning */}
              {prediction.storage.moisture_risk !== 'SAFE' && (
                <View style={[styles.alertBox,
                  prediction.storage.moisture_risk === 'CRITICAL' ? styles.alertRed : styles.alertYellow]}>
                  <MaterialCommunityIcons name="water-alert"
                    size={20} color={prediction.storage.moisture_risk === 'CRITICAL' ? '#fca5a5' : '#fde047'} />
                  <Text style={[styles.alertText,
                    { color: prediction.storage.moisture_risk === 'CRITICAL' ? '#fca5a5' : '#fde047' }]}>
                    {prediction.storage.moisture_detail}
                  </Text>
                </View>
              )}

              {/* Intervention card */}
              {rr.intervention_viable && (
                <View style={styles.interventionCard}>
                  <View style={styles.interventionHeader}>
                    <MaterialCommunityIcons name="tools" size={18} color="#34d399" />
                    <Text style={styles.interventionTitle}>If You Dry to 13% + Hermetic Bag</Text>
                  </View>
                  <View style={styles.interventionRow}>
                    <View style={styles.interventionItem}>
                      <Text style={styles.interventionLabel}>Before</Text>
                      <Text style={[styles.interventionValue,
                        { color: prediction.storage.storage_days < prediction.price.days_to_peak ? '#f87171' : '#94a3b8' }]}>
                        {prediction.storage.storage_days}d
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#475569" />
                    <View style={styles.interventionItem}>
                      <Text style={styles.interventionLabel}>After Drying</Text>
                      <Text style={[styles.interventionValue, { color: '#4ade80' }]}>
                        {rr.days_after_drying}d
                      </Text>
                    </View>
                    <View style={[styles.interventionPill,
                      rr.days_after_drying > prediction.price.days_to_peak
                        ? styles.interventionPillGreen : styles.interventionPillRed]}>
                      <Text style={styles.interventionPillText}>
                        {rr.days_after_drying > prediction.price.days_to_peak ? '✅ VIABLE' : '❌ Not enough'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Get AI Advice button */}
              <TouchableOpacity onPress={getAIAdvice} disabled={loadingAdv}
                                style={[styles.aiBtn, loadingAdv && styles.primaryBtnDisabled]}>
                <LinearGradient colors={['#4c1d95', '#7c3aed']} style={styles.primaryBtnGrad}>
                  {loadingAdv
                    ? <>
                        <ActivityIndicator color="#c4b5fd" />
                        <Text style={[styles.primaryBtnText, { color: '#c4b5fd' }]}>
                          Consulting AI Expert...
                        </Text>
                      </>
                    : <>
                        <MaterialCommunityIcons name="robot" size={20} color="#c4b5fd" />
                        <Text style={[styles.primaryBtnText, { color: '#c4b5fd' }]}>
                          Get AI Expert Advisory
                        </Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Section: AI Advisory ──────────────────────────────────── */}
          {advice !== '' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="robot" size={18} color="#a78bfa" />
                <Text style={styles.sectionTitle}>AI Expert Advisory</Text>
                <View style={styles.claudeBadge}>
                  <Text style={styles.claudeBadgeText}>Claude AI</Text>
                </View>
              </View>
              <View style={styles.adviceCard}>
                <Text style={styles.adviceText}>{advice}</Text>
              </View>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 60 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <PickerModal type="variety" options={VARIETIES}
                   selected={variety} onSelect={setVariety} />
      <PickerModal type="method" options={METHODS}
                   selected={method} onSelect={setMethod} />
      <PickerModal type="type" options={VARIETY_TYPES}
                   selected={varietyType} onSelect={setVarietyType} />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#0f172a' },
  scroll:      { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 16, paddingHorizontal: 16,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  backBtn:         { padding: 6, marginRight: 8 },
  headerTitle:     { color: '#f0fdf4', fontSize: 16, fontWeight: '700' },
  headerSub:       { color: '#6ee7b7', fontSize: 11, marginTop: 1 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)',
  },
  headerBadgeText: { color: '#34d399', fontSize: 11, fontWeight: '700' },

  // Section
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 20, padding: 16,
    marginTop: 14,
    borderWidth: 1, borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 16,
  },
  sectionTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '700', flex: 1 },

  // Input elements
  inputGroup:  { marginBottom: 14 },
  inputLabel:  { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  textInput: {
    backgroundColor: '#0f172a', borderRadius: 10, padding: 12,
    color: '#e2e8f0', fontSize: 15,
    borderWidth: 1, borderColor: '#334155',
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0f172a', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#334155',
  },
  pickerBtnText: { flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  optionRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionBtn: {
    flex: 1, paddingVertical: 9, alignItems: 'center',
    borderRadius: 8, borderWidth: 1.5, borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  optionBtnActive:     { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  optionBtnText:       { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  optionBtnTextActive: { color: '#fff' },

  // Slider
  sliderValue: { fontSize: 13, fontWeight: '700' },
  sliderTrack: {
    height: 6, backgroundColor: '#1e293b', borderRadius: 3,
    marginBottom: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: '#334155',
  },
  sliderFill:       { height: '100%', backgroundColor: '#16a34a', borderRadius: 3 },
  sliderFillDanger: { backgroundColor: '#dc2626' },
  sliderBtns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center',
  },
  sliderMid: { color: '#475569', fontSize: 11 },

  // Buttons
  primaryBtn:         { borderRadius: 12, overflow: 'hidden', marginTop: 6 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  aiBtn:          { borderRadius: 12, overflow: 'hidden', marginTop: 10 },

  // Signal Banner
  signalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 16, marginBottom: 14,
  },
  signalEmoji:      { fontSize: 32 },
  signalLabel:      { fontSize: 15, fontWeight: '800' },
  signalUrgency:    { fontSize: 12, fontWeight: '600', marginTop: 2 },
  signalPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  signalPillText:   { fontSize: 12, fontWeight: '800' },

  // Metrics
  metricsGrid: {
    flexDirection: 'row', gap: 8, marginBottom: 12,
  },
  metricCard: {
    flex: 1, backgroundColor: '#0f172a', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#1e293b',
  },
  metricValue: { color: '#e2e8f0', fontSize: 18, fontWeight: '800' },
  metricLabel: { color: '#64748b', fontSize: 10, marginTop: 2, textAlign: 'center' },
  metricSub:   { color: '#475569', fontSize: 9, marginTop: 1 },

  // Price card
  priceCard: {
    backgroundColor: '#0f172a', borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#1e293b',
  },
  priceRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceItem:     { alignItems: 'center' },
  priceItemLabel: { color: '#64748b', fontSize: 10, marginBottom: 2 },
  priceItemValue: { color: '#e2e8f0', fontSize: 20, fontWeight: '800' },
  priceItemUnit:  { color: '#475569', fontSize: 10 },
  priceArrow:     { paddingHorizontal: 4 },
  profitBox: {
    alignItems: 'center', backgroundColor: '#052e16',
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#166534',
  },
  profitLabel: { color: '#4ade80', fontSize: 9, fontWeight: '700' },
  profitValue: { color: '#4ade80', fontSize: 18, fontWeight: '900' },
  profitUnit:  { color: '#16a34a', fontSize: 9 },

  // Alert box
  alertBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 10, padding: 12, marginBottom: 12,
  },
  alertRed:    { backgroundColor: '#450a0a', borderWidth: 1, borderColor: '#7f1d1d' },
  alertYellow: { backgroundColor: '#422006', borderWidth: 1, borderColor: '#78350f' },
  alertText:   { flex: 1, fontSize: 12, lineHeight: 17 },

  // Intervention
  interventionCard: {
    backgroundColor: '#0f172a', borderRadius: 12, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#1e293b',
  },
  interventionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  interventionTitle:  { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  interventionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  interventionItem:   { alignItems: 'center' },
  interventionLabel:  { color: '#475569', fontSize: 10 },
  interventionValue:  { fontSize: 16, fontWeight: '800' },
  interventionPill: {
    marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  interventionPillGreen: { backgroundColor: '#052e16', borderColor: '#166534' },
  interventionPillRed:   { backgroundColor: '#450a0a', borderColor: '#7f1d1d' },
  interventionPillText:  { fontSize: 11, fontWeight: '700', color: '#e2e8f0' },

  // AI Advice
  claudeBadge: {
    backgroundColor: '#4c1d95', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8,
  },
  claudeBadgeText: { color: '#c4b5fd', fontSize: 10, fontWeight: '700' },
  adviceCard: {
    backgroundColor: '#0f172a', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#3730a3',
  },
  adviceText: { color: '#e0e7ff', fontSize: 13, lineHeight: 21 },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '75%', paddingBottom: 40,
    borderTopWidth: 1, borderColor: '#334155',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#475569',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  modalTitle: {
    color: '#e2e8f0', fontSize: 16, fontWeight: '700',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  modalItemActive:     { backgroundColor: '#052e16' },
  modalItemText:       { color: '#94a3b8', fontSize: 15 },
  modalItemTextActive: { color: '#4ade80', fontWeight: '700' },
});