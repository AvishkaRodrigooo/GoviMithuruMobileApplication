/**
 * StorageDashboardScreen.js
 * GoviMithuru — Post-Harvest Storage Management Dashboard
 * v3.0 — Complete rewrite. Zero duplicate declarations. Copy-paste ready.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Modal,
  Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';
import { BASE_URL } from '../../utils/apiConfig';

const { width } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  green: '#16a34a',
  greenLight: '#dcfce7',
  greenDark: '#064e3b',
  amber: '#d97706',
  amberLight: '#fef3c7',
  red: '#dc2626',
  redLight: '#fee2e2',
  blue: '#2563eb',
  blueLight: '#dbeafe',
  purple: '#7c3aed',
  purpleLight: '#ede9fe',
  grey0: '#f9fafb',
  grey1: '#f3f4f6',
  grey2: '#e5e7eb',
  grey3: '#d1d5db',
  grey4: '#9ca3af',
  grey5: '#6b7280',
  grey6: '#4b5563',
  grey7: '#374151',
  grey8: '#1f2937',
  ink: '#111827',
  white: '#ffffff',
};

// ─── Bag metadata ─────────────────────────────────────────────────────────────
const BAG_META = {
  hermetic: { label: 'Hermetic', icon: 'shield-check', color: C.green, desc: '9 months — best for long storage' },
  woven: { label: 'PP Woven', icon: 'bag-checked', color: C.blue, desc: '4 months — good middle option' },
  gunny: { label: 'Gunny Bag', icon: 'sack', color: C.amber, desc: '2.5 months — traditional, short term' },
  polythene: { label: 'Polythene', icon: 'recycle', color: C.grey5, desc: '3 months — small quantities only' },
  metalbin: { label: 'Metal Bin', icon: 'database', color: C.purple, desc: '12+ months — industrial grade' },
};

const LOCATION_META = {
  home: { label: 'Home / House', icon: 'home-variant' },
  shed: { label: 'Storage Shed', icon: 'barn' },
  warehouse: { label: 'Rented Warehouse', icon: 'warehouse' },
  coop: { label: 'Co-op Store', icon: 'handshake' },
};

// ─── LKR formatter ────────────────────────────────────────────────────────────
const fmtLKR = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

// ─────────────────────────────────────────────────────────────────────────────
//  REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size }) {
  const sz = size || 90;
  const sc = score || 0;
  return (
    <View style={{ width: sz, height: sz, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View
        style={{
          position: 'absolute',
          width: sz,
          height: sz,
          borderRadius: sz / 2,
          borderWidth: 7,
          borderColor: color + '25',
        }}
      />
      {/* Foreground arc (quarter-border trick) */}
      <View
        style={{
          position: 'absolute',
          width: sz,
          height: sz,
          borderRadius: sz / 2,
          borderWidth: 7,
          borderColor: color,
          borderRightColor: sc >= 25 ? color : 'transparent',
          borderBottomColor: sc >= 50 ? color : 'transparent',
          borderLeftColor: sc >= 75 ? color : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      <Text style={{ fontSize: 20, fontWeight: '900', color: color }}>{sc}</Text>
      <Text style={{ fontSize: 9, color: C.grey4, fontWeight: '700' }}>/100</Text>
    </View>
  );
}

function SectionHeader({ icon, color, title, sub }) {
  return (
    <View style={st.secHeader}>
      <View style={[st.secIconBox, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.secTitle}>{title}</Text>
        {sub ? <Text style={st.secSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function ChipGroup({ label, options, value, onChange, color }) {
  const activeColor = color || C.green;
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={st.fieldLabel}>{label}</Text> : null}
      <View style={st.chipRow}>
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              style={[
                st.chip,
                isActive && { backgroundColor: activeColor, borderColor: activeColor },
              ]}
              onPress={() => onChange(opt.value)}
            >
              {opt.icon ? (
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={13}
                  color={isActive ? C.white : C.grey5}
                  style={{ marginRight: 4 }}
                />
              ) : null}
              <Text style={[st.chipTxt, isActive && { color: C.white }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Batch card (used in harvest list) ───────────────────────────────────────
function BatchCard({ item, navigation }) {
  const mc = parseFloat(item.moisturePct || item.moisture_pct || 13.5);
  const riskKey = mc > 16 ? 'CRITICAL' : mc > 14 ? 'HIGH' : mc > 13 ? 'MEDIUM' : 'LOW';
  const riskColor = { CRITICAL: C.red, HIGH: C.amber, MEDIUM: C.blue, LOW: C.green }[riskKey];

  return (
    <TouchableOpacity
      style={st.batchCard}
      onPress={() =>
        navigation.navigate('RegisterHarvest', { editData: item, docId: item.id })
      }
    >
      <View style={st.batchLeft}>
        <View style={[st.batchDot, { backgroundColor: riskColor }]} />
        <View>
          <Text style={st.batchVariety}>{item.variety}</Text>
          <Text style={st.batchMeta}>
            {item.season} • {item.quantityKg} kg
          </Text>
        </View>
      </View>
      <View style={st.batchRight}>
        <View style={[st.riskPill, { backgroundColor: riskColor + '20' }]}>
          <Text style={[st.riskPillTxt, { color: riskColor }]}>{riskKey}</Text>
        </View>
        <TouchableOpacity
          style={st.advisorBtn}
          onPress={(e) => {
            e.stopPropagation();
            navigation.navigate('PostHarvestAdvisor', { batch: item });
          }}
        >
          <MaterialCommunityIcons name="brain" size={16} color={C.green} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Risk result panel ────────────────────────────────────────────────────────
function RiskResultPanel({ data }) {
  return (
    <View style={[st.resultBox, { borderLeftColor: data.color }]}>
      <View style={st.riskHeader}>
        <ScoreRing score={data.score} color={data.color} size={90} />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <View style={[st.riskBadge, { backgroundColor: data.color + '20' }]}>
            <Text style={[st.riskBadgeTxt, { color: data.color }]}>
              {data.category} RISK
            </Text>
          </View>
          <Text style={st.aiVerdict}>{data.ai_verdict}</Text>
        </View>
      </View>

      {data.storage_life && (
        <View style={st.storageLifeBox}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={C.green} />
          <Text style={st.storageLifeTxt}>
            Safe storage:{' '}
            <Text style={{ fontWeight: '800', color: C.green }}>
              {data.storage_life.storage_days} days ({data.storage_life.storage_months} months)
            </Text>
          </Text>
          <View style={[st.gradePill, { backgroundColor: data.color + '15' }]}>
            <Text style={[st.gradePillTxt, { color: data.color }]}>
              {data.storage_life.grade}
            </Text>
          </View>
        </View>
      )}

      {data.risk_factors && data.risk_factors.length > 0 && (
        <View style={st.factorsBox}>
          <Text style={st.factorsTitle}>Risk Factors Detected:</Text>
          {data.risk_factors.map((f, i) => (
            <View key={i} style={st.factorRow}>
              <View style={[st.factorDot, { backgroundColor: data.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={st.factorName}>
                  {f.factor}{' '}
                  <Text style={{ color: C.red, fontWeight: '800' }}>−{f.deduction} pts</Text>
                </Text>
                <Text style={st.factorDetail}>{f.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={[st.aiBox, { borderColor: data.color + '30' }]}>
        <Text style={[st.aiBoxLabel, { color: data.color }]}>🚨 URGENT ACTION</Text>
        <Text style={st.aiBoxContent}>{data.ai_urgent}</Text>
      </View>
      <View style={[st.aiBox, { borderColor: '#fbbf2430', marginTop: 8 }]}>
        <Text style={[st.aiBoxLabel, { color: C.amber }]}>💰 IF IGNORED</Text>
        <Text style={st.aiBoxContent}>{data.ai_loss_warning}</Text>
      </View>
      <View style={[st.aiBox, { borderColor: '#16a34a30', marginTop: 8 }]}>
        <Text style={[st.aiBoxLabel, { color: C.green }]}>💡 FARMER TIP</Text>
        <Text style={st.aiBoxContent}>{data.ai_farmer_tip}</Text>
      </View>

      <View style={st.lossBox}>
        <Text style={st.lossLabel}>Estimated Weight Loss if Unaddressed</Text>
        <Text style={[st.lossValue, { color: data.color }]}>{data.loss_estimate}</Text>
      </View>
    </View>
  );
}

// ─── Cost result panel ────────────────────────────────────────────────────────
function CostResultPanel({ data }) {
  const pColor =
    data.profitability === 'YES'
      ? C.green
      : data.profitability === 'MARGINAL'
        ? C.amber
        : C.red;
  const pLabel =
    data.profitability === 'YES'
      ? 'PROFITABLE'
      : data.profitability === 'MARGINAL'
        ? 'MARGINAL'
        : 'LOSS ALERT';

  return (
    <View style={[st.resultBox, { borderLeftColor: pColor }]}>
      <View style={st.riskHeader}>
        <View style={{ flex: 1 }}>
          <View style={[st.riskBadge, { backgroundColor: pColor + '20' }]}>
            <Text style={[st.riskBadgeTxt, { color: pColor }]}>{pLabel}</Text>
          </View>
          <Text style={st.aiVerdict}>{data.ai_economic_verdict}</Text>
        </View>
      </View>

      <View style={st.costTable}>
        <Text style={st.costTableTitle}>
          Cost Breakdown ({data.bags_required} bags required)
        </Text>
        {[
          { label: 'Storage Bags', value: data.effective_bag_cost },
          { label: 'Warehouse Rent', value: data.rent_cost },
          { label: 'Fumigation (×2)', value: data.fumigation_cost },
          { label: 'Labour (Pack/Move)', value: data.labour_cost },
          { label: 'Insurance', value: data.insurance_cost },
        ].map((row, i) => (
          <View key={i} style={st.costRow}>
            <Text style={st.costLbl}>{row.label}</Text>
            <Text style={st.costVal}>{fmtLKR(row.value)}</Text>
          </View>
        ))}
        <View style={[st.costRow, st.costTotalRow]}>
          <Text style={st.costTotalLbl}>TOTAL STORAGE COST</Text>
          <Text style={[st.costVal, { color: C.red, fontSize: 15 }]}>
            {fmtLKR(data.total_storage_cost)}
          </Text>
        </View>
        <View style={st.costRow}>
          <Text style={st.costLbl}>Cost per kg</Text>
          <Text style={st.costVal}>Rs. {data.cost_per_kg}/kg</Text>
        </View>

        {/* FIX L7: Input Planner Button */}
        <TouchableOpacity
          style={st.inputPlannerBtn}
          onPress={() => useNavigation().navigate('InputPlanner')}
        >
          <MaterialCommunityIcons name="calculator-variant" size={14} color={C.blue} />
          <Text style={st.inputPlannerBtnTxt}>Re-calculate Production Cost in Input Planner</Text>
        </TouchableOpacity>
      </View>

      <View style={st.compareBox}>
        <View style={st.compareItem}>
          <Text style={st.compareLabel}>SELL TODAY</Text>
          <Text style={[st.compareValue, { color: C.grey7 }]}>
            {fmtLKR(data.sell_now_value)}
          </Text>
        </View>
        <MaterialCommunityIcons name="arrow-right" size={20} color={C.grey4} />
        <View style={st.compareItem}>
          <Text style={st.compareLabel}>SELL AT PEAK</Text>
          <Text style={[st.compareValue, { color: C.green }]}>
            {fmtLKR(data.sell_peak_value)}
          </Text>
        </View>
        <MaterialCommunityIcons name="equal" size={20} color={C.grey4} />
        <View style={st.compareItem}>
          <Text style={st.compareLabel}>NET PROFIT</Text>
          <Text style={[st.compareValue, { color: pColor, fontSize: 14 }]}>
            {fmtLKR(data.net_profit)}
          </Text>
        </View>
      </View>

      <View style={st.breakEvenBox}>
        <MaterialCommunityIcons name="scale-balance" size={14} color={C.grey5} />
        <Text style={st.breakEvenTxt}>
          Break-even: Rs. {data.break_even_price}/kg • ROI: {data.roi_pct}%
        </Text>
      </View>

      <View style={[st.aiBox, { borderColor: pColor + '30', marginTop: 8 }]}>
        <Text style={[st.aiBoxLabel, { color: pColor }]}>📊 AI ECONOMIC ADVICE</Text>
        <Text style={st.aiBoxContent}>{data.ai_best_advice}</Text>
        {data.ai_risk_warning ? (
          <Text style={[st.aiBoxContent, { color: C.red, marginTop: 4 }]}>
            ⚠️ {data.ai_risk_warning}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Recommend result panel ───────────────────────────────────────────────────
function RecommendResultPanel({ data }) {
  const rec = data.ai_recommendation || {};
  const recKey = rec.recommended_bag || (data.best_option && data.best_option.bag_type) || 'hermetic';
  const meta = BAG_META[recKey] || BAG_META.hermetic;

  return (
    <View style={st.resultBox}>
      <LinearGradient
        colors={[meta.color, meta.color + 'aa']}
        style={st.recWinner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <MaterialCommunityIcons name={meta.icon} size={32} color={C.white} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={st.recWinnerLabel}>BEST CHOICE FOR YOU</Text>
          <Text style={st.recWinnerName}>{meta.label}</Text>
          <Text style={st.recWinnerDesc}>{rec.recommendation_headline}</Text>
        </View>
      </LinearGradient>

      <Text style={[st.factorsTitle, { marginTop: 14 }]}>All Options Compared:</Text>
      {(data.options || []).map((opt, i) => {
        const m = BAG_META[opt.bag_type] || {};
        return (
          <View
            key={i}
            style={[
              st.optionRow,
              !opt.viable && { opacity: 0.5 },
              opt.bag_type === recKey && {
                borderColor: m.color,
                borderWidth: 1.5,
                backgroundColor: m.color + '08',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={m.icon || 'sack'}
              size={20}
              color={opt.viable ? m.color : C.grey4}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[st.optionName, { color: opt.viable ? C.ink : C.grey4 }]}>
                  {m.label || opt.bag_type}
                </Text>
                {!opt.viable && (
                  <View style={[st.riskPill, { backgroundColor: C.redLight }]}>
                    <Text style={[st.riskPillTxt, { color: C.red }]}>NOT ENOUGH DAYS</Text>
                  </View>
                )}
                {opt.bag_type === recKey && (
                  <View style={[st.riskPill, { backgroundColor: m.color + '20' }]}>
                    <Text style={[st.riskPillTxt, { color: m.color }]}>RECOMMENDED</Text>
                  </View>
                )}
              </View>
              <Text style={st.optionMeta}>
                {opt.storage_months} months safe • {fmtLKR(opt.total_cost)} total cost
              </Text>
            </View>
            <Text style={[st.optionProfit, { color: opt.net_profit > 0 ? C.green : C.red }]}>
              {opt.net_profit > 0 ? '+' : ''}
              {fmtLKR(opt.net_profit)}
            </Text>
          </View>
        );
      })}

      {rec.preparation_steps && rec.preparation_steps.length > 0 && (
        <View style={st.stepsBox}>
          <Text style={st.factorsTitle}>Preparation Steps:</Text>
          {rec.preparation_steps.map((step, i) => (
            <View key={i} style={st.stepRow}>
              <View style={[st.stepNum, { backgroundColor: meta.color }]}>
                <Text style={st.stepNumTxt}>{i + 1}</Text>
              </View>
              <Text style={st.stepTxt}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {rec.where_to_buy ? (
        <View style={[st.aiBox, { borderColor: meta.color + '30', marginTop: 8 }]}>
          <Text style={[st.aiBoxLabel, { color: meta.color }]}>🏪 WHERE TO BUY IN SRI LANKA</Text>
          <Text style={st.aiBoxContent}>{rec.where_to_buy}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
export default function StorageDashboardScreen({ navigation }) {
  const [locations, setLocations] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [totals, setTotals] = useState({ kg: 0, bags: 0, value: '0' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('risk');

  // ── Risk form ──────────────────────────────────────────────────────────────
  const [riskForm, setRiskForm] = useState({
    moisture_pct: 13.5,
    bag_type: 'gunny',
    duration_months: 3,
    quantity_kg: 1000,
    has_pest_history: false,
    storage_location: 'home',
    temp_c: 28,
  });
  const [riskResult, setRiskResult] = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  // ── Cost form ──────────────────────────────────────────────────────────────
  const [costForm, setCostForm] = useState({
    quantity_kg: 1000,
    bag_type: 'gunny',
    duration_months: 3,
    storage_location: 'home',
    variety: 'Bg 352',
    current_price: '',
    expected_price: '',
  });
  const [costResult, setCostResult] = useState(null);
  const [loadingCost, setLoadingCost] = useState(false);

  // ── Recommend form ─────────────────────────────────────────────────────────
  const [recForm, setRecForm] = useState({
    quantity_kg: 1000,
    duration_months: 3,
    moisture_pct: 13.5,
    temp_c: 28,
    variety: 'Bg 352',
    budget_lkr: 0,
  });
  const [recResult, setRecResult] = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);

  // ─── Fetch from Firestore ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const uid = auth.currentUser && auth.currentUser.uid;
      if (!uid) return;

      const locSnap = await db
        .collection('storageLocations')
        .where('userId', '==', uid)
        .get();
      setLocations(locSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      return db
        .collection('harvests')
        .where('userId', '==', uid)
        .onSnapshot(
          (snap) => {
            let kg = 0;
            let bags = 0;
            const list = snap.docs.map((doc) => {
              const d = doc.data();
              kg += Number(d.quantityKg || 0);
              bags += Number(d.bags || 0);
              return { id: doc.id, ...d };
            });
            setHarvests(list);
            setTotals({
              kg: kg.toFixed(0),
              bags: bags.toFixed(0),
              value: (kg * 256).toLocaleString('en-LK'),
            });
            setLoading(false);
            setRefreshing(false);
          },
          (err) => {
            console.error(err);
            setLoading(false);
            setRefreshing(false);
          },
        );
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let unsub;
    fetchData().then((u) => {
      unsub = u;
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // ─── API helpers ─────────────────────────────────────────────────────────
  const apiPost = async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const computeRisk = async () => {
    setLoadingRisk(true);
    setRiskResult(null);
    try {
      const data = await apiPost('/api/guardian/risk_score', riskForm);
      if (data.error) Alert.alert('Error', data.error);
      else setRiskResult(data);
    } catch {
      Alert.alert('Connection Error', 'Could not reach AI server. Check network.');
    } finally {
      setLoadingRisk(false);
    }
  };

  const computeCost = async () => {
    if (!costForm.quantity_kg || Number(costForm.quantity_kg) <= 0) {
      Alert.alert('Input Error', 'Please enter the quantity in kg.');
      return;
    }
    setLoadingCost(true);
    setCostResult(null);
    try {
      const body = {
        ...costForm,
        quantity_kg: Number(costForm.quantity_kg),
        duration_months: Number(costForm.duration_months),
        current_price: costForm.current_price ? Number(costForm.current_price) : undefined,
        expected_price: costForm.expected_price ? Number(costForm.expected_price) : undefined,
      };
      const data = await apiPost('/api/guardian/calculate_costs', body);
      if (data.error) Alert.alert('Error', data.error);
      else setCostResult(data);
    } catch {
      Alert.alert('Connection Error', 'Could not reach AI server.');
    } finally {
      setLoadingCost(false);
    }
  };

  const computeRecommend = async () => {
    setLoadingRec(true);
    setRecResult(null);
    try {
      const data = await apiPost('/api/guardian/recommend_storage', recForm);
      if (data.error) Alert.alert('Error', data.error);
      else setRecResult(data);
    } catch {
      Alert.alert('Error', 'Could not compute recommendation.');
    } finally {
      setLoadingRec(false);
    }
  };

  // ─── API helpers ─────────────────────────────────────────────────────────
  const renderRiskTab = () => (
    <View style={st.card}>
      <SectionHeader
        icon="shield-search"
        color={C.green}
        title="Storage Risk Score"
        sub="Based on SLR 603:2013 standards"
      />

      {/* Moisture — most critical field */}
      <View style={st.moistureBox}>
        <Text style={st.fieldLabel}>Moisture Content (%)</Text>
        <Text style={st.hintSmall}>
          Use a moisture meter or refer to the salt-bottle test guide
        </Text>
        <View style={st.mcRow}>
          {[10, 12, 13, 14, 15, 16, 18].map((mc) => {
            const isSel = riskForm.moisture_pct === mc;
            const isRisky = mc >= 14;
            return (
              <TouchableOpacity
                key={mc}
                style={[
                  st.mcChip,
                  isSel && {
                    backgroundColor: isRisky ? C.red : C.green,
                    borderColor: isRisky ? C.red : C.green,
                  },
                ]}
                onPress={() => setRiskForm({ ...riskForm, moisture_pct: mc })}
              >
                <Text style={[st.mcChipTxt, isSel && { color: C.white }]}>{mc}%</Text>
                {mc === 13 && (
                  <Text style={{ fontSize: 8, color: isSel ? C.white : C.green, fontWeight: '800' }}>
                    SAFE
                  </Text>
                )}
                {mc === 14 && (
                  <Text style={{ fontSize: 8, color: isSel ? C.white : C.amber, fontWeight: '800' }}>
                    LIMIT
                  </Text>
                )}
                {mc >= 16 && (
                  <Text style={{ fontSize: 8, color: isSel ? C.white : C.red, fontWeight: '800' }}>
                    DANGER
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
          <Text style={st.fieldLabel}>Or enter exact value:</Text>
          <TextInput
            style={st.compactInput}
            keyboardType="decimal-pad"
            value={String(riskForm.moisture_pct)}
            onChangeText={(v) =>
              setRiskForm({ ...riskForm, moisture_pct: parseFloat(v) || 13.5 })
            }
            placeholder="e.g. 13.8"
          />
        </View>
      </View>

      <ChipGroup
        label="Storage Bag Type"
        options={Object.entries(BAG_META).map(([v, m]) => ({
          value: v,
          label: m.label,
          icon: m.icon,
        }))}
        value={riskForm.bag_type}
        onChange={(v) => setRiskForm({ ...riskForm, bag_type: v })}
        color={C.green}
      />

      {BAG_META[riskForm.bag_type] && (
        <View
          style={[
            st.bagDescBox,
            { borderColor: BAG_META[riskForm.bag_type].color + '40' },
          ]}
        >
          <MaterialCommunityIcons
            name={BAG_META[riskForm.bag_type].icon}
            size={16}
            color={BAG_META[riskForm.bag_type].color}
          />
          <Text style={[st.bagDescTxt, { color: BAG_META[riskForm.bag_type].color }]}>
            {BAG_META[riskForm.bag_type].desc}
          </Text>
        </View>
      )}

      <ChipGroup
        label="How long to store?"
        options={[
          { value: 1, label: '1 Month' },
          { value: 2, label: '2 Months' },
          { value: 3, label: '3 Months' },
          { value: 6, label: '6 Months' },
        ]}
        value={riskForm.duration_months}
        onChange={(v) => setRiskForm({ ...riskForm, duration_months: v })}
        color={C.green}
      />

      <View style={{ marginBottom: 14 }}>
        <Text style={st.fieldLabel}>Total Quantity (kg)</Text>
        <TextInput
          style={st.fullInput}
          keyboardType="numeric"
          value={String(riskForm.quantity_kg)}
          onChangeText={(v) =>
            setRiskForm({ ...riskForm, quantity_kg: parseFloat(v) || 1000 })
          }
          placeholder="e.g. 2000"
        />
      </View>

      <ChipGroup
        label="Storage Location"
        options={Object.entries(LOCATION_META).map(([v, m]) => ({
          value: v,
          label: m.label,
          icon: m.icon,
        }))}
        value={riskForm.storage_location}
        onChange={(v) => setRiskForm({ ...riskForm, storage_location: v })}
        color={C.blue}
      />

      <ChipGroup
        label="Seen rats or weevils (ghun) here before?"
        options={[
          { value: false, label: 'No — Safe location', icon: 'check-circle-outline' },
          { value: true, label: 'Yes — Pest history', icon: 'alert-outline' },
        ]}
        value={riskForm.has_pest_history}
        onChange={(v) => setRiskForm({ ...riskForm, has_pest_history: v })}
        color={C.red}
      />

      <TouchableOpacity
        style={[st.primaryBtn, { backgroundColor: C.green }]}
        onPress={computeRisk}
        disabled={loadingRisk}
      >
        {loadingRisk ? (
          <>
            <ActivityIndicator color={C.white} />
            <Text style={st.primaryBtnTxt}> Analysing with AI...</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="shield-search" size={18} color={C.white} />
            <Text style={st.primaryBtnTxt}> Compute Risk Score</Text>
          </>
        )}
      </TouchableOpacity>

      {riskResult ? <RiskResultPanel data={riskResult} /> : null}
    </View>
  );

  const renderCostTab = () => (
    <View style={st.card}>
      <SectionHeader
        icon="calculator"
        color={C.blue}
        title="Storage Economics"
        sub="Is storing worth it? Real LKR analysis"
      />

      <View style={{ marginBottom: 14 }}>
        <Text style={st.fieldLabel}>Quantity (kg)</Text>
        <TextInput
          style={st.fullInput}
          keyboardType="numeric"
          value={String(costForm.quantity_kg)}
          onChangeText={(v) => setCostForm({ ...costForm, quantity_kg: v })}
          placeholder="e.g. 2000"
        />
      </View>

      <ChipGroup
        label="Storage Bag"
        options={Object.entries(BAG_META).map(([v, m]) => ({ value: v, label: m.label }))}
        value={costForm.bag_type}
        onChange={(v) => setCostForm({ ...costForm, bag_type: v })}
        color={C.blue}
      />

      <ChipGroup
        label="Duration"
        options={[
          { value: 1, label: '1 Month' },
          { value: 2, label: '2 Months' },
          { value: 3, label: '3 Months' },
          { value: 6, label: '6 Months' },
        ]}
        value={costForm.duration_months}
        onChange={(v) => setCostForm({ ...costForm, duration_months: v })}
        color={C.blue}
      />

      <ChipGroup
        label="Storage Location"
        options={Object.entries(LOCATION_META).map(([v, m]) => ({ value: v, label: m.label }))}
        value={costForm.storage_location}
        onChange={(v) => setCostForm({ ...costForm, storage_location: v })}
        color={C.blue}
      />

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={st.fieldLabel}>Current Price (LKR/kg)</Text>
          <TextInput
            style={st.fullInput}
            keyboardType="decimal-pad"
            value={costForm.current_price}
            onChangeText={(v) => setCostForm({ ...costForm, current_price: v })}
            placeholder="Auto from market"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.fieldLabel}>Expected Peak (LKR/kg)</Text>
          <TextInput
            style={st.fullInput}
            keyboardType="decimal-pad"
            value={costForm.expected_price}
            onChangeText={(v) => setCostForm({ ...costForm, expected_price: v })}
            placeholder="Auto from forecast"
          />
        </View>
      </View>
      <Text style={st.hintText}>💡 Leave prices empty to use our market forecast data</Text>

      <TouchableOpacity
        style={[st.primaryBtn, { backgroundColor: C.blue }]}
        onPress={computeCost}
        disabled={loadingCost}
      >
        {loadingCost ? (
          <>
            <ActivityIndicator color={C.white} />
            <Text style={st.primaryBtnTxt}> Calculating...</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="calculator" size={18} color={C.white} />
            <Text style={st.primaryBtnTxt}> Calculate Economics</Text>
          </>
        )}
      </TouchableOpacity>

      {costResult ? <CostResultPanel data={costResult} /> : null}
    </View>
  );

  const renderRecommendTab = () => (
    <View style={st.card}>
      <SectionHeader
        icon="lightbulb-on"
        color={C.purple}
        title="Best Bag Recommendation"
        sub="AI picks the ideal storage for your situation"
      />

      <View style={{ marginBottom: 14 }}>
        <Text style={st.fieldLabel}>Quantity (kg)</Text>
        <TextInput
          style={st.fullInput}
          keyboardType="numeric"
          value={String(recForm.quantity_kg)}
          onChangeText={(v) => setRecForm({ ...recForm, quantity_kg: parseFloat(v) || 1000 })}
          placeholder="e.g. 5000"
        />
      </View>

      <ChipGroup
        label="How long do you need to store?"
        options={[
          { value: 1, label: '1 Month' },
          { value: 3, label: '3 Months' },
          { value: 6, label: '6 Months' },
          { value: 9, label: '9 Months' },
        ]}
        value={recForm.duration_months}
        onChange={(v) => setRecForm({ ...recForm, duration_months: v })}
        color={C.purple}
      />

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={st.fieldLabel}>Moisture (%)</Text>
          <TextInput
            style={st.fullInput}
            keyboardType="decimal-pad"
            value={String(recForm.moisture_pct)}
            onChangeText={(v) => setRecForm({ ...recForm, moisture_pct: parseFloat(v) || 13.5 })}
            placeholder="13.5"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.fieldLabel}>Est. Temperature (°C)</Text>
          <TextInput
            style={st.fullInput}
            keyboardType="decimal-pad"
            value={String(recForm.temp_c)}
            onChangeText={(v) => setRecForm({ ...recForm, temp_c: parseFloat(v) || 28 })}
            placeholder="28"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[st.primaryBtn, { backgroundColor: C.purple }]}
        onPress={computeRecommend}
        disabled={loadingRec}
      >
        {loadingRec ? (
          <>
            <ActivityIndicator color={C.white} />
            <Text style={st.primaryBtnTxt}> AI Thinking...</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="lightbulb-on" size={18} color={C.white} />
            <Text style={st.primaryBtnTxt}> Get AI Recommendation</Text>
          </>
        )}
      </TouchableOpacity>

      {recResult ? <RecommendResultPanel data={recResult} /> : null}
    </View>
  );

  // ─── Main render ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
            colors={[C.green]}
          />
        }
      >
        {/* Header */}
        <View style={st.header}>
          <View>
            <Text style={st.headerTitle}>Storage Center</Text>
            <Text style={st.headerSub}>Post-Harvest Management</Text>
          </View>
          <TouchableOpacity
            style={st.headerBtn}
            onPress={() => navigation.navigate('InventoryList')}
          >
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color={C.green} />
          </TouchableOpacity>
        </View>

        {/* Asset card */}
        <LinearGradient
          colors={['#16a34a', '#065f46']}
          style={st.assetCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={st.assetTop}>
            <View>
              <Text style={st.assetLabel}>TOTAL PADDY VALUE</Text>
              <Text style={st.assetValue}>Rs. {totals.value}</Text>
            </View>
            <MaterialCommunityIcons name="grain" size={40} color="rgba(255,255,255,0.25)" />
          </View>
          <View style={st.assetStats}>
            {[
              { val: totals.kg, lbl: 'KG STORED' },
              { val: totals.bags, lbl: 'TOTAL BAGS' },
              { val: harvests.length, lbl: 'BATCHES' },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={st.assetDiv} />}
                <View style={st.assetStat}>
                  <Text style={st.assetStatN}>{item.val}</Text>
                  <Text style={st.assetStatL}>{item.lbl}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <View style={st.quickRow}>
          {[
            { label: 'Add Stock', icon: 'plus-circle', color: C.green, bg: C.greenLight, nav: 'RegisterHarvest' },
            { label: 'Market', icon: 'trending-up', color: C.blue, bg: C.blueLight, nav: 'MarketTracking' },
            { label: 'AI Chat', icon: 'chat-processing', color: C.purple, bg: C.purpleLight, nav: 'BeginnerStorageGuide' },
            { label: 'Inventory', icon: 'clipboard-list', color: C.amber, bg: C.amberLight, nav: 'InventoryList' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={st.quickItem}
              onPress={() => navigation.navigate(item.nav)}
            >
              <View style={[st.quickIcon, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={st.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tool tabs */}
        <View style={st.tabBar}>
          {[
            { key: 'risk', icon: 'shield-search', label: 'Risk Score', color: C.green },
            { key: 'cost', icon: 'calculator', label: 'Economics', color: C.blue },
            { key: 'recommend', icon: 'lightbulb-on', label: 'Recommend', color: C.purple },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                st.tabBtn,
                activeTab === tab.key && {
                  borderBottomWidth: 2,
                  borderBottomColor: tab.color,
                },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={18}
                color={activeTab === tab.key ? tab.color : C.grey4}
              />
              <Text
                style={[
                  st.tabTxt,
                  { color: activeTab === tab.key ? tab.color : C.grey4 },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'risk' && renderRiskTab()}
        {activeTab === 'cost' && renderCostTab()}
        {activeTab === 'recommend' && renderRecommendTab()}

        {/* Harvest batches */}
        <View style={st.batchSectionHeader}>
          <Text style={st.sectionTitle}>Active Storage Batches</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RegisterHarvest')}>
            <Text style={{ color: C.green, fontSize: 13, fontWeight: '700' }}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={C.green} style={{ marginVertical: 40 }} />
        ) : harvests.length === 0 ? (
          <View style={st.emptyState}>
            <MaterialCommunityIcons name="warehouse" size={56} color={C.grey3} />
            <Text style={st.emptyTitle}>No storage batches yet</Text>
            <Text style={st.emptySub}>Register your first harvest to start tracking</Text>
            <TouchableOpacity
              style={[st.primaryBtn, { marginTop: 16, paddingHorizontal: 32 }]}
              onPress={() => navigation.navigate('RegisterHarvest')}
            >
              <Text style={st.primaryBtnTxt}>Register Harvest</Text>
            </TouchableOpacity>
          </View>
        ) : (
          locations.map((loc) => {
            const batches = harvests.filter(
              (h) => h.locationId === loc.id || h.locationName === loc.locationName,
            );
            if (batches.length === 0) return null;
            return (
              <View key={loc.id} style={st.locSection}>
                <View style={st.locHeader}>
                  <View style={[st.locIconBox, { backgroundColor: C.greenLight }]}>
                    <MaterialCommunityIcons name="warehouse" size={18} color={C.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.locName}>{String(loc.locationName || '').toUpperCase()}</Text>
                    <Text style={st.locSub}>
                      {loc.storageType} • {loc.storageArea} {loc.areaUnit}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={st.viewBtn}
                    onPress={() =>
                      navigation.navigate('WarehouseAnalysis', { locationId: loc.id })
                    }
                  >
                    <Text style={st.viewBtnTxt}>VIEW →</Text>
                  </TouchableOpacity>
                </View>
                {batches.map((item) => (
                  <BatchCard key={item.id} item={item} navigation={navigation} />
                ))}
              </View>
            );
          })
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.grey0 },
  scroll: { padding: 16 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingTop: 4 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: C.ink, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: C.green, fontWeight: '600', marginTop: 2 },
  headerBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.greenLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },

  // Asset card
  assetCard: { borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: C.green, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  assetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  assetLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  assetValue: { color: C.white, fontSize: 28, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
  assetStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 14, padding: 14 },
  assetStat: { flex: 1, alignItems: 'center' },
  assetStatN: { color: C.white, fontSize: 18, fontWeight: '800' },
  assetStatL: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 2 },
  assetDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Quick actions
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  quickItem: { alignItems: 'center', flex: 1 },
  quickIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: C.grey7, textAlign: 'center' },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 14, marginBottom: 12, padding: 4, borderWidth: 1, borderColor: C.grey2, elevation: 1 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, gap: 3 },
  tabTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

  // Section header
  secHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  secIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  secTitle: { fontSize: 16, fontWeight: '800', color: C.ink },
  secSub: { fontSize: 12, color: C.grey5, marginTop: 1 },

  // Card
  card: { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.grey2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },

  // Fields
  fieldLabel: { color: C.grey6, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.2 },
  fullInput: { borderWidth: 1, borderColor: C.grey2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: C.grey0, color: C.ink, fontSize: 15, fontWeight: '600' },
  compactInput: { borderWidth: 1, borderColor: C.grey2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: C.grey0, color: C.ink, fontSize: 14, fontWeight: '600', width: 100 },
  hintText: { fontSize: 11, color: C.grey5, marginTop: -6, marginBottom: 12 },
  hintSmall: { fontSize: 11, color: C.grey5, marginBottom: 10 },

  // Moisture
  moistureBox: { backgroundColor: C.grey0, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.grey2 },
  mcRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mcChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: C.grey2, alignItems: 'center', minWidth: 44 },
  mcChipTxt: { fontSize: 13, fontWeight: '800', color: C.grey6 },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.grey2, backgroundColor: C.grey0 },
  chipTxt: { fontSize: 12, fontWeight: '700', color: C.grey6 },

  bagDescBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 14, backgroundColor: C.grey0 },
  bagDescTxt: { fontSize: 12, fontWeight: '600', flex: 1 },

  // Buttons
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.green, borderRadius: 12, paddingVertical: 14, marginTop: 12, gap: 6 },
  primaryBtnTxt: { color: C.white, fontSize: 15, fontWeight: '800' },

  // Result box
  resultBox: { marginTop: 16, padding: 16, borderRadius: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: C.grey2, backgroundColor: C.white },

  // Risk result
  riskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  riskBadgeTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  aiVerdict: { fontSize: 14, fontWeight: '700', color: C.ink, lineHeight: 20 },
  storageLifeBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.greenLight, borderRadius: 10, padding: 10, marginBottom: 12 },
  storageLifeTxt: { flex: 1, fontSize: 13, color: C.greenDark },
  gradePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  gradePillTxt: { fontSize: 11, fontWeight: '800' },
  factorsBox: { marginBottom: 12 },
  factorsTitle: { fontSize: 12, fontWeight: '800', color: C.grey6, letterSpacing: 0.3, marginBottom: 8 },
  factorRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  factorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  factorName: { fontSize: 13, fontWeight: '700', color: C.ink },
  factorDetail: { fontSize: 12, color: C.grey5, marginTop: 2 },
  aiBox: { borderRadius: 10, padding: 12, borderWidth: 1, backgroundColor: C.grey0 },
  aiBoxLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 5 },
  aiBoxContent: { fontSize: 13, color: C.grey7, lineHeight: 19 },
  lossBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: 12, backgroundColor: C.grey0, borderRadius: 10 },
  lossLabel: { fontSize: 12, color: C.grey5, fontWeight: '600' },
  lossValue: { fontSize: 18, fontWeight: '900' },

  // Cost result
  costTable: { backgroundColor: C.grey0, borderRadius: 12, padding: 12, marginBottom: 12 },
  costTableTitle: { fontSize: 12, fontWeight: '800', color: C.grey6, marginBottom: 10, letterSpacing: 0.3 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.grey2 },
  costLbl: { fontSize: 13, color: C.grey6 },
  costVal: { fontSize: 13, fontWeight: '700', color: C.ink },
  costTotalRow: { borderTopWidth: 1.5, borderTopColor: C.grey3, borderBottomWidth: 0, marginTop: 4, paddingTop: 10 },
  costTotalLbl: { fontSize: 13, fontWeight: '800', color: C.ink },
  compareBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: C.grey0, borderRadius: 12, padding: 12, marginBottom: 8 },
  compareItem: { alignItems: 'center' },
  compareLabel: { fontSize: 9, color: C.grey5, fontWeight: '700', marginBottom: 4 },
  compareValue: { fontSize: 13, fontWeight: '900' },
  breakEvenBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: C.grey0, borderRadius: 8, marginBottom: 8 },
  breakEvenTxt: { fontSize: 12, color: C.grey5, flex: 1 },

  // Recommend result
  recWinner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 14 },
  recWinnerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 0.5 },
  recWinnerName: { fontSize: 20, fontWeight: '900', color: C.white, marginVertical: 2 },
  recWinnerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 17 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.grey0, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.grey2 },
  optionName: { fontSize: 14, fontWeight: '700' },
  optionMeta: { fontSize: 11, color: C.grey5, marginTop: 2 },
  optionProfit: { fontSize: 13, fontWeight: '800' },
  stepsBox: { marginTop: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepNum: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepNumTxt: { color: C.white, fontSize: 12, fontWeight: '800' },
  stepTxt: { flex: 1, fontSize: 13, color: C.grey7, lineHeight: 19 },

  // Batches section
  batchSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.ink },
  locSection: { marginBottom: 16 },
  locHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  locIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  locName: { fontSize: 13, fontWeight: '800', color: C.grey7, letterSpacing: 0.5 },
  locSub: { fontSize: 11, color: C.grey4, marginTop: 1 },
  viewBtn: { backgroundColor: C.greenLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  viewBtnTxt: { color: C.green, fontSize: 10, fontWeight: '800' },
  batchCard: { flexDirection: 'row', backgroundColor: C.white, padding: 14, borderRadius: 14, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: C.grey2, elevation: 1 },
  batchLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  batchDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  batchVariety: { fontSize: 14, fontWeight: '700', color: C.ink },
  batchMeta: { fontSize: 12, color: C.grey4, marginTop: 2 },
  batchRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  riskPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  riskPillTxt: { fontSize: 9, fontWeight: '800' },
  advisorBtn: { backgroundColor: C.greenLight, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  emptyState: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.grey7, marginTop: 16 },
  emptySub: { fontSize: 13, color: C.grey4, marginTop: 4, textAlign: 'center' },

  // Report modal
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.grey2, backgroundColor: C.white },
  modalTitle: { fontSize: 16, fontWeight: '800', color: C.ink },
  reportHeaderGrad: { borderRadius: 16, padding: 20, marginBottom: 16 },
  reportOrgName: { color: C.white, fontSize: 18, fontWeight: '900', marginLeft: 10 },
  reportTitle: { color: C.white, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  reportStd: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  reportSection: { backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.grey2 },
  reportSectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.grey5, marginBottom: 12 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.grey1 },
  reportKey: { fontSize: 13, color: C.grey5 },
  reportVal: { fontSize: 13, fontWeight: '700', color: C.ink },
  reportBody: { fontSize: 13, color: C.grey7, lineHeight: 20 },
  gradeBig: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
  gradeBigLbl: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  gradeBigSub: { fontSize: 10, color: C.grey5, marginTop: 2, textAlign: 'center' },
  festivalBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 8, backgroundColor: C.amberLight },
  festivalTxt: { fontSize: 12, color: '#92400e', fontWeight: '600', flex: 1 },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  recNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.green, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  recNumTxt: { color: C.white, fontSize: 12, fontWeight: '800' },
  recTxt: { flex: 1, fontSize: 13, color: C.grey7, lineHeight: 19 },
  reportFooter: { padding: 16, alignItems: 'center', marginTop: 8 },
  reportFooterTxt: { fontSize: 11, color: C.grey4, lineHeight: 18 },

  inputPlannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.blue + '40',
    borderRadius: 8,
    backgroundColor: C.white,
    gap: 6,
  },
  inputPlannerBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.blue,
  },
});