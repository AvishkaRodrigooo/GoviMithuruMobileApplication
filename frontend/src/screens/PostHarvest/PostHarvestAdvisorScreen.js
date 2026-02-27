/**
 * PostHarvestAdvisorScreen.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Post-Harvest Guardian — Research-Backed AI Advisory
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Animated, ActivityIndicator,
  SafeAreaView, StatusBar, Modal, Platform, Alert, Clipboard
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_URL = 'http://192.168.100.200:5000'; // ← Update this to your Flask IP

const VARIETIES = [
  'Bg 352', 'Bg 300', 'Bg 403', 'Bw 367', 'Suwandel', 'Rath Suwandel',
  'Kalu Heenati', 'Pokkali', 'Kuruluthuda', 'Pachchaperumal',
  'Ld 368', 'At 362', 'At 307', 'Bg 358',
];

const METHODS = ['Gunny bag', 'Polythene bag', 'Hermetic', 'Cold storage'];
const VARIETY_TYPES = ['Improved', 'Traditional'];

const SIGNAL_CONFIG = {
  GREEN: { bg: ['#064e3b', '#022c22'], shadow: '#059669', icon: 'check-decagram', label: 'SAFE TO STORE', color: '#34d399' },
  YELLOW: { bg: ['#422006', '#2d1a03'], shadow: '#d97706', icon: 'alert-decagram', label: 'PROCEED CAREFULLY', color: '#fbbf24' },
  RED: { bg: ['#450a0a', '#2d0606'], shadow: '#dc2626', icon: 'close-octagon', label: 'CRITICAL RISK', color: '#f87171' },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const TypewriterText = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, 15);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text]);

  return <Text style={styles.adviceText}>{displayedText}</Text>;
};

export default function PostHarvestAdvisorScreen({ navigation, route }) {
  // Check if we are analyzing a specific batch
  const initialBatch = route.params?.batch;

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('analyze'); // analyze | advisor | tips

  // Form state - pre-filled if batch exists
  const [variety, setVariety] = useState(initialBatch?.variety || 'Bg 352');
  const [varietyType, setVarietyType] = useState(initialBatch?.varietyType || 'Improved');
  const [method, setMethod] = useState(initialBatch?.storageMethod || 'Gunny bag');
  const [moisture, setMoisture] = useState(initialBatch?.moisturePct || 13.5);
  const [temp, setTemp] = useState(28);
  const [quantity, setQuantity] = useState(initialBatch?.quantityKg?.toString() || '1000');
  const [notes, setNotes] = useState('');

  // Result state
  const [prediction, setPrediction] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loadingPred, setLoadingPred] = useState(false);
  const [loadingAdv, setLoadingAdv] = useState(false);

  // Modals
  const [modalType, setModalType] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Sync state if batch changes (e.g. navigating from different cards)
  useEffect(() => {
    if (route.params?.batch) {
      const b = route.params.batch;
      setVariety(b.variety || 'Bg 352');
      setVarietyType(b.varietyType || 'Improved');
      setMethod(b.storageMethod || 'Gunny bag');
      setQuantity(b.quantityKg?.toString() || '1000');
    }
  }, [route.params?.batch]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [activeTab]);

  const runAnalysis = async () => {
    if (!quantity || isNaN(parseFloat(quantity))) {
      Alert.alert('Input Missing', 'Please enter a valid quantity in kg.');
      return;
    }
    setLoadingPred(true);
    setAdvice(null);
    try {
      const res = await fetch(`${BASE_URL}/api/guardian/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variety,
          variety_type: varietyType,
          storage_method: method,
          moisture_pct: moisture,
          temp_c: temp,
          quantity_kg: parseFloat(quantity),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPrediction(data);
      } else {
        Alert.alert('Error', data.error || 'Prediction failed');
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Ensure backend is running at ' + BASE_URL);
    } finally {
      setLoadingPred(false);
    }
  };

  const getAIAdvice = async () => {
    if (!prediction) return;
    setLoadingAdv(true);
    setActiveTab('advisor');
    try {
      const rr = prediction.risk_reward;
      const res = await fetch(`${BASE_URL}/api/guardian/advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variety,
          moisture_pct: moisture,
          temp_c: temp,
          storage_method: method,
          quantity_kg: parseFloat(quantity),
          storage_days: prediction.storage.storage_days,
          days_to_peak: prediction.price.days_to_peak,
          current_price: prediction.price.current_lkr,
          peak_price: prediction.price.peak_lkr,
          signal: rr.signal,
          buffer_days: rr.buffer_days,
          potential_profit: rr.potential_profit_lkr,
          intervention_viable: rr.intervention_viable,
          days_after_drying: rr.days_after_drying,
          notes: notes,
        }),
      });
      const data = await res.json();

      // Safety: Use the 'advice' object if it exists (even on error/fallback)
      if (data.advice && typeof data.advice === 'object') {
        setAdvice(data.advice);
      } else if (data.success) {
        setAdvice(data.advice);
      } else {
        Alert.alert('AI Error', data.error || 'Invalid advice format');
        setAdvice(null);
        setActiveTab('analyze');
      }
    } catch (err) {
      Alert.alert('AI Error', 'Could not fetch expert advisory.');
      setAdvice(null);
      setActiveTab('analyze');
    } finally {
      setLoadingAdv(false);
    }
  };

  // ─── Sub-components ────────────────────────────────────────────────────────

  const MetricCard = ({ icon, label, value, sub, accent }) => (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons name={icon} size={22} color={accent} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub && <Text style={styles.metricSub}>{sub}</Text>}
    </View>
  );

  const SliderRow = ({ label, value, min, max, unit, danger, onChange }) => (
    <View style={styles.inputGroup}>
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Text style={[styles.sliderVal, { color: value > danger ? '#f87171' : '#34d399' }]}>
          {value}{unit}
        </Text>
      </View>
      <View style={styles.customSlider}>
        <View style={styles.sliderTrack} />
        <View style={[styles.sliderFill, { width: `${((value - min) / (max - min)) * 100}%`, backgroundColor: value > danger ? '#dc2626' : '#16a34a' }]} />
        <View style={[styles.sliderHandle, { left: `${((value - min) / (max - min)) * 100}%` }]} />
      </View>
      <View style={styles.sliderControls}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 0.5))}>
          <MaterialCommunityIcons name="minus" size={16} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + 0.5))}>
          <MaterialCommunityIcons name="plus" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── TABS RENDER ───────────────────────────────────────────────────────────

  const renderAnalyze = () => (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {initialBatch && (
          <View style={styles.contextCard}>
            <MaterialCommunityIcons name="layers-outline" size={24} color="#34d399" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.contextLabel}>Analyzing Specific Batch</Text>
              <Text style={styles.contextValue}>{initialBatch.variety} • {initialBatch.location}</Text>
            </View>
            <View style={styles.contextBadge}>
              <Text style={styles.contextBadgeText}>PRE-FILLED</Text>
            </View>
          </View>
        )}

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="tune-variant" size={20} color="#34d399" />
            <Text style={styles.sectionTitle}>Details & Calibration</Text>
          </View>

          <TouchableOpacity style={styles.pickerTrigger} onPress={() => setModalType('variety')}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerLabel}>Rice Variety</Text>
              <Text style={styles.pickerValue}>{variety}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>

          <View style={styles.row}>
            <TouchableOpacity style={[styles.pickerTrigger, { flex: 1, marginRight: 8 }]} onPress={() => setModalType('type')}>
              <View>
                <Text style={styles.pickerLabel}>Type</Text>
                <Text style={styles.pickerValue}>{varietyType}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickerTrigger, { flex: 1 }]} onPress={() => setModalType('method')}>
              <View>
                <Text style={styles.pickerLabel}>Method</Text>
                <Text style={styles.pickerValue}>{method}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <SliderRow label="Moisture Level" value={moisture} min={5} max={22} unit="%" danger={14} onChange={setMoisture} />
          <SliderRow label="Warehouse Temp" value={temp} min={10} max={45} unit="°C" danger={30} onChange={setTemp} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity (kg)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0.0"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Farmer Context & Observations (Optional)</Text>
            <TextInput
              style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Storage floor seems a bit damp, or I noticed some weevils (ghun) near the entrance..."
              placeholderTextColor="#475569"
            />
          </View>

          <TouchableOpacity style={styles.analyzeBtn} onPress={runAnalysis} disabled={loadingPred}>
            <LinearGradient colors={['#059669', '#16a34a']} style={styles.btnGrad}>
              {loadingPred ? <ActivityIndicator color="#fff" /> : <><MaterialCommunityIcons name="brain" size={20} color="#fff" /><Text style={styles.btnText}>Run ML Forecast</Text></>}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {prediction && (
          <View style={styles.resultsWrapper}>
            {/* Risk-Reward Signal */}
            <View style={[styles.signalBanner, { backgroundColor: SIGNAL_CONFIG[prediction.risk_reward.signal].bg[0], borderColor: SIGNAL_CONFIG[prediction.risk_reward.signal].color }]}>
              <MaterialCommunityIcons name={SIGNAL_CONFIG[prediction.risk_reward.signal].icon} size={32} color={SIGNAL_CONFIG[prediction.risk_reward.signal].color} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.signalLabel, { color: SIGNAL_CONFIG[prediction.risk_reward.signal].color }]}>{SIGNAL_CONFIG[prediction.risk_reward.signal].label}</Text>
                <Text style={styles.signalSub}>{prediction.risk_reward.action}</Text>
              </View>
            </View>

            {/* Premium Price Forecast Interface */}
            <View style={styles.priceForecastCard}>
              <View style={styles.forecastHeader}>
                <MaterialCommunityIcons name="trending-up" size={24} color="#facc15" />
                <Text style={styles.forecastTitle}>Price Forecast & Market Timing</Text>
              </View>

              <View style={styles.priceComparisonContainer}>
                <View style={styles.priceBox}>
                  <Text style={styles.priceMeta}>CURRENT</Text>
                  <Text style={styles.priceLarge}>Rs. {prediction.price.current_lkr}</Text>
                  <Text style={styles.priceUnit}>per kg</Text>
                </View>

                <View style={styles.priceArrowBox}>
                  <MaterialCommunityIcons name="arrow-right-thick" size={24} color="#34d399" />
                  <Text style={styles.gainPercent}>+{prediction.price.gain_pct}%</Text>
                </View>

                <View style={[styles.priceBox, styles.peakPriceBox]}>
                  <Text style={[styles.priceMeta, { color: '#facc15' }]}>PREDICTED PEAK</Text>
                  <Text style={[styles.priceLarge, { color: '#facc15' }]}>Rs. {prediction.price.peak_lkr}</Text>
                  <Text style={styles.priceUnit}>in {prediction.price.days_to_peak} days</Text>
                </View>
              </View>

              <LinearGradient colors={['#1e3a8a30', '#1e3a8a10']} style={styles.profitHighlight}>
                <View style={styles.profitLabelRow}>
                  <Text style={styles.profitMeta}>POTENTIAL EXTRA PROFIT</Text>
                  <Text style={styles.profitMain}>Rs. {prediction.risk_reward.potential_profit_lkr.toLocaleString()}</Text>
                </View>
                <Text style={styles.profitDesc}>Total gain if stored correctly until target day.</Text>
              </LinearGradient>
            </View>

            {/* Storage Vital Stats */}
            <View style={styles.metricsGrid}>
              <MetricCard icon="timer-sand" label="Storage Life" value={`${prediction.storage.storage_days}d`} sub={`${prediction.storage.storage_months}mo`} accent="#34d399" />
              <MetricCard icon="water-percent" label="Moisture Status" value={prediction.storage.moisture_risk} sub={prediction.storage.moisture_risk === 'SAFE' ? 'Stable' : 'Risk'} accent={prediction.storage.moisture_risk === 'SAFE' ? '#34d399' : '#f87171'} />
            </View>

            <TouchableOpacity style={styles.advisorCta} onPress={getAIAdvice}>
              <LinearGradient colors={['#4c1d95', '#7c3aed']} style={styles.btnGrad}>
                <MaterialCommunityIcons name="robot" size={20} color="#fff" />
                <Text style={styles.btnText}>View Expert AI Advisory</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );

  const renderAdvisor = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {!prediction ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="brain-freeze" size={64} color="#334155" />
          <Text style={styles.emptyTitle}>No Analysis Data</Text>
          <Text style={styles.emptySub}>Run a forecast in the Analyze tab first to get expert advice.</Text>
          <TouchableOpacity style={styles.returnBtn} onPress={() => setActiveTab('analyze')}>
            <Text style={styles.returnBtnText}>Go to Analysis</Text>
          </TouchableOpacity>
        </View>
      ) : loadingAdv ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Consulting AI expert models...</Text>
        </View>
      ) : advice ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Signal Header */}
          <View style={styles.adviceHeader}>
            <View style={[styles.statusBadge, { backgroundColor: prediction.risk_reward.signal === 'GREEN' ? '#064e3b' : prediction.risk_reward.signal === 'YELLOW' ? '#422006' : '#450a0a' }]}>
              <Text style={{ color: SIGNAL_CONFIG[prediction.risk_reward.signal].color, fontWeight: '800', fontSize: 12 }}>
                {advice.signal ?? prediction.risk_reward.signal} SIGNAL
              </Text>
            </View>
            <TypewriterText text={advice.summary || 'Developing strategy...'} />
          </View>

          {/* Conflict Card */}
          <View style={styles.adviceCard}>
            <Text style={styles.cardInfoLabel}>The Timeline Conflict</Text>
            <Text style={styles.adviceText}>{advice.conflict}</Text>
          </View>

          {/* Comparison Row */}
          <View style={styles.row}>
            <View style={[styles.compareCard, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.compareLabel}>OPTION: SELL NOW</Text>
              <Text style={styles.compareValue}>Rs.{advice.option_sell?.value_lkr || '0'}</Text>
              <Text style={styles.compareDesc}>{advice.option_sell?.rationale}</Text>
            </View>
            <View style={[styles.compareCard, { flex: 1, backgroundColor: '#064e3b' }]}>
              <Text style={[styles.compareLabel, { color: '#34d399' }]}>OPTION: WAIT</Text>
              <Text style={[styles.compareValue, { color: '#34d399' }]}>{advice.option_wait?.value_lkr || '0'}</Text>
              <Text style={styles.compareDesc}>By extending storage life for higher market rates.</Text>
            </View>
          </View>

          {/* Action Plan */}
          <View style={styles.adviceCard}>
            <Text style={styles.cardInfoLabel}>Recommended Action Plan</Text>
            {(advice.option_wait?.steps || []).map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Quick Tips */}
          <View style={styles.tipsRow}>
            {(advice.quick_tips || []).map((tip, i) => (
              <View key={i} style={styles.tipPill}>
                <MaterialCommunityIcons name="lightning-bolt" size={12} color="#fbce15" />
                <Text style={styles.tipPillText}>{tip}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.copyBtn} onPress={() => {
            Clipboard.setString(JSON.stringify(advice, null, 2));
            Alert.alert('Copied', 'Advice details copied to clipboard');
          }}>
            <MaterialCommunityIcons name="content-copy" size={20} color="#94a3b8" />
            <Text style={styles.copyBtnText}>Copy Advisory Details</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </Animated.View>
  );

  const renderTips = () => {
    const isMoistureHigh = moisture > 14;
    const isTempHigh = temp > 30;

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.tabTitle}>Post-Harvest Best Practices</Text>

          <View style={[styles.tipCardLarge, isMoistureHigh && styles.tipCardHighlight]}>
            <MaterialCommunityIcons name="water-percent" size={32} color={isMoistureHigh ? '#fff' : '#34d399'} />
            <Text style={[styles.tipCardTitle, isMoistureHigh && { color: '#fff' }]}>The 13% Safe Rule</Text>
            <Text style={[styles.tipCardDesc, isMoistureHigh && { color: '#ecfdf5' }]}>
              {isMoistureHigh ? "⚠️ YOUR MOISTURE IS HIGH! Dry your paddy to 13.5% immediately to prevent fungal growth." : "Fungal growth and metabolic heat generation are minimal below 13.5% moisture. This is the single most important factor."}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.tipCardSmall, { flex: 1, marginRight: 8 }]}>
              <MaterialCommunityIcons name="warehouse" size={24} color="#facc15" />
              <Text style={styles.tipCardTitle}>Ventilation</Text>
              <Text style={styles.tipCardDesc}>Ensure cross-ventilation to prevent moisture pockets.</Text>
            </View>
            <View style={[styles.tipCardSmall, { flex: 1 }]}>
              <MaterialCommunityIcons name="bug" size={24} color="#f87171" />
              <Text style={styles.tipCardTitle}>Pest Barrier</Text>
              <Text style={styles.tipCardDesc}>Use Hermetic (airtight) bags to suffocate weevils.</Text>
            </View>
          </View>

          <View style={[styles.tipCardLarge, isTempHigh && styles.tipCardHighlightTemp]}>
            <MaterialCommunityIcons name="thermometer-alert" size={32} color={isTempHigh ? '#fff' : '#60a5fa'} />
            <Text style={[styles.tipCardTitle, isTempHigh && { color: '#fff' }]}>Temperature Stacking</Text>
            <Text style={[styles.tipCardDesc, isTempHigh && { color: '#fff1f2' }]}>
              {isTempHigh ? "⚠️ WAREHOUSE TOO HOT! High temps (30°C+) double the rate of insect reproduction. Move bags to a cooler area." : "Never stack bags against galvanized walls. Leave a 1.5ft gap between stacks and walls for thermal insulation."}
            </Text>
          </View>

          <View style={[styles.tipCardSmall, { marginTop: 8 }]}>
            <MaterialCommunityIcons name="flask-outline" size={24} color="#c084fc" />
            <Text style={styles.tipCardTitle}>Quality Grading</Text>
            <Text style={styles.tipCardDesc}>Separate broken grains (broken rice) from whole head rice. Brokens absorb moisture faster.</Text>
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#064e3b', '#022c22']} style={styles.header}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Post-Harvest Guardian</Text>
            <Text style={styles.headerSub}>AI-Driven Research Advisory</Text>
          </View>
        </View>

        {/* Custom Tab Bar */}
        <View style={styles.tabBar}>
          {['analyze', 'advisor', 'tips'].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab.toUpperCase()}
              </Text>
              {activeTab === tab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {activeTab === 'analyze' && renderAnalyze()}
        {activeTab === 'advisor' && renderAdvisor()}
        {activeTab === 'tips' && renderTips()}
      </View>

      {/* Picker Modals */}
      <Modal visible={modalType !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose {modalType}</Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {(modalType === 'variety' ? VARIETIES : modalType === 'type' ? VARIETY_TYPES : METHODS).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={styles.modalItem}
                  onPress={() => {
                    if (modalType === 'variety') setVariety(opt);
                    else if (modalType === 'type') setVarietyType(opt);
                    else setMethod(opt);
                    setModalType(null);
                  }}
                >
                  <Text style={styles.modalItemText}>{opt}</Text>
                  {(variety === opt || varietyType === opt || method === opt) && (
                    <MaterialCommunityIcons name="check" size={20} color="#16a34a" />
                  )}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 20,
    paddingBottom: 10
  },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, minHeight: 60 },
  backBtn: { padding: 8, marginRight: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#34d399', fontSize: 12 },

  tabBar: { flexDirection: 'row' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabLabel: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },
  activeIndicator: { position: 'absolute', bottom: 0, width: '40%', height: 3, backgroundColor: '#34d399', borderRadius: 2 },

  content: { flex: 1, padding: 20 },

  // Context card
  contextCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#34d39940' },
  contextLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  contextValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
  contextBadge: { backgroundColor: '#34d39920', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  contextBadgeText: { color: '#34d399', fontSize: 9, fontWeight: '900' },

  // Form card
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },

  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  pickerLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  pickerValue: { color: '#f1f5f9', fontSize: 15, fontWeight: '600', marginTop: 2 },

  row: { flexDirection: 'row', gap: 0 },

  inputGroup: { marginBottom: 16 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  sliderVal: { fontSize: 13, fontWeight: '800' },

  customSlider: { height: 6, backgroundColor: '#0f172a', borderRadius: 3, marginVertical: 8, position: 'relative' },
  sliderTrack: { flex: 1 },
  sliderFill: { position: 'absolute', height: '100%', borderRadius: 3 },
  sliderHandle: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff', top: -4, marginLeft: -7 },
  sliderControls: { flexDirection: 'row', justifyContent: 'flex-start', gap: 12 },
  stepBtn: { backgroundColor: '#334155', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },

  textInput: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#334155' },

  analyzeBtn: { marginTop: 10, borderRadius: 16, overflow: 'hidden' },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Results
  resultsWrapper: { marginTop: 12 },
  signalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 12
  },
  signalLabel: { fontSize: 15, fontWeight: '900' },
  signalSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },

  metricsGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },

  // Price Forecast Card
  priceForecastCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  forecastHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  forecastTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '800' },
  priceComparisonContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  priceBox: { flex: 1, alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  peakPriceBox: { borderColor: '#facc1540', backgroundColor: '#facc1505' },
  priceMeta: { color: '#64748b', fontSize: 9, fontWeight: '800', marginBottom: 4 },
  priceLarge: { color: '#fff', fontSize: 18, fontWeight: '900' },
  priceUnit: { color: '#475569', fontSize: 10, marginTop: 2 },
  priceArrowBox: { alignItems: 'center', paddingHorizontal: 4 },
  gainPercent: { color: '#34d399', fontSize: 11, fontWeight: '800', marginTop: 4 },
  profitHighlight: { padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  profitLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  profitMeta: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },
  profitMain: { color: '#fff', fontSize: 20, fontWeight: '900' },
  profitDesc: { color: '#64748b', fontSize: 11, lineHeight: 16 },
  metricCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 20, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  metricValue: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 4 },
  metricLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', marginTop: 2 },
  metricSub: { color: '#475569', fontSize: 9, marginTop: 1 },

  advisorCta: { borderRadius: 16, overflow: 'hidden' },

  // Advisor Tab
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '800', marginTop: 20 },
  emptySub: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  returnBtn: { marginTop: 24, backgroundColor: '#34d399', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  returnBtnText: { color: '#064e3b', fontWeight: '800' },

  loadingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  loadingText: { color: '#94a3b8', fontSize: 14, marginTop: 16 },

  adviceHeader: { marginBottom: 20 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  adviceSummary: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 28 },

  adviceCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardInfoLabel: { color: '#34d399', fontSize: 12, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase' },
  adviceText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 },

  compareCard: { backgroundColor: '#111827', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#334155' },
  compareLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', marginBottom: 6 },
  compareValue: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  compareDesc: { color: '#475569', fontSize: 11, lineHeight: 16 },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#34d399', justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: '#064e3b', fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, color: '#f1f5f9', fontSize: 14 },

  tipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tipPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  tipPillText: { color: '#e2e8f0', fontSize: 11, fontWeight: '700' },

  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  copyBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },

  // Tips Tab
  tabTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 20 },
  tipCardLarge: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  tipCardSmall: { backgroundColor: '#111827', borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  tipCardTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  tipCardDesc: { color: '#64748b', fontSize: 13, lineHeight: 20 },
  tipCardHighlight: { backgroundColor: '#059669', borderColor: '#34d399' },
  tipCardHighlightTemp: { backgroundColor: '#dc2626', borderColor: '#f87171' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalItemText: { color: '#f1f5f9', fontSize: 16, fontWeight: '600' },
});
