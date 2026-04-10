import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Dimensions, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView,
  Platform, StatusBar, Modal, Image, FlatList, Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { db, auth } from '../../firebase/firebaseConfig';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import useUniversalLocation from '../../utils/useUniversalLocation';
import { WebView } from 'react-native-webview';
import { BASE_URL } from '../../utils/apiConfig';

const { width } = Dimensions.get('window');

// ─── Sri Lanka Rice Seed Varieties (from image — ONLY THESE 9) ────────────────
const RICE_VARIETIES = [
  'Bg 250', 'Bg 300', 'Bg 352', 'Bg 366', 'Bg 379-2', 'Bg 403',
  'At 306', 'At 362', 'At 405'
];

// ─── Storage Hierarchy (Sri Lanka agronomic standards) ───────────────────────
const STORAGE_HIERARCHY = {
  'Home Storage': { limit: 500, icon: 'home', sub: ['Kitchen Room', 'Dedicated Storage Room', 'Home Backyard Shed'] },
  'Farm Shed': { limit: 5000, icon: 'barn', sub: ['Open Shed', 'Closed Shed', 'Ventilated Barn'] },
  'Warehouse': { limit: 50000, icon: 'warehouse', sub: ['Private Warehouse', 'Rental Warehouse', 'Farm Warehouse'] },
  'Co-operative Store': { limit: 200000, icon: 'store', sub: ['Farmer Co-op Center', 'Samurdhi Co-op', 'Agricultural Co-op'] },
  'PMB / Government Store': { limit: 9999999, icon: 'domain', sub: ['PMB (Paddy Marketing Board)', 'District Agriculture Office', 'CWE Store'] },
  'Private Commercial': { limit: 9999999, icon: 'office-building', sub: ['Rice Mill Storage', 'Cold Storage Facility', 'Commercial Warehouse Rental'] },
};

// ─── Container Hierarchy ─────────────────────────────────────────────────────
const CONTAINER_HIERARCHY = {
  'Traditional': ['Gunny bags (Jute Sacks)', 'Woven Polypropylene Bags', 'Clay Bins (Bisso)', 'Bamboo Baskets (Kattaya)'],
  'Modern': ['Polythene bags (LDPE)', 'Hermetic Bags (Airtight)', 'Super Bags (PICS/GrainPro)', 'Metal Silos'],
  'Commercial': ['Bulk Floor Storage', 'Industrial Silo Storage', 'Cold Storage Containers', 'Vacuum Storage Units'],
};

// ─── Storage Integrity Checklists ─────────────────────────────────────────────
const CHECKLIST_GROUPS = [
  {
    title: 'RICE QUALITY',
    icon: 'grain',
    items: [
      { id: 'moisture_14', label: 'Moisture content ≤ 14%' },
      { id: 'cool_touch', label: 'Rice is cool to touch' },
      { id: 'clean_paddy', label: 'Clean (minimal chaff, stones)' },
      { id: 'pest_free', label: 'Free from visible pests' },
      { id: 'smell_fresh', label: 'No off-smell (fresh grain)' },
    ]
  },
  {
    title: 'STORAGE CONTAINER',
    icon: 'package-variant-closed',
    items: [
      { id: 'cont_type', label: 'Appropriate for duration' },
      { id: 'cont_clean', label: 'Clean and dry inside' },
      { id: 'cont_intact', label: 'No holes or tears' },
      { id: 'cont_food', label: 'Food-grade material' },
    ]
  },
  {
    title: 'STORAGE LOCATION',
    icon: 'map-marker-check',
    items: [
      { id: 'loc_pests', label: 'Clean and pest-free area' },
      { id: 'loc_dry', label: 'Dry floor (no seepage)' },
      { id: 'loc_sun', label: 'Away from direct sunlight' },
      { id: 'loc_vent', label: 'Good ventilation present' },
      { id: 'loc_chem', label: 'No chemicals stored nearby' },
      { id: 'loc_safe', label: 'Secure from theft' },
    ]
  },
  {
    title: 'EQUIPMENT READY',
    icon: 'toolbox',
    items: [
      { id: 'equip_pallets', label: 'Pallets ready (15cm height)' },
      { id: 'equip_meters', label: 'Thermometer + Hygrometer' },
      { id: 'equip_traps', label: 'Pest traps placed' },
      { id: 'equip_notebook', label: 'Monitoring notebook ready' },
      { id: 'equip_labels', label: 'Labels for bags prepared' },
    ]
  },
  {
    title: 'DOCUMENTATION',
    icon: 'file-document',
    items: [
      { id: 'doc_date', label: 'Storage date recorded' },
      { id: 'doc_variety', label: 'Variety + quantity written' },
      { id: 'doc_moist', label: 'Moisture content recorded' },
      { id: 'doc_expiry', label: 'Expected use-by date noted' },
      { id: 'doc_remind', label: '7-day check reminder set' },
    ]
  }
];

// ─── Map HTML ─────────────────────────────────────────────────────────────────
const MAP_HTML = (lat, lon) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .leaflet-control-attribution { display: none; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map').setView([${lat || 7.8731}, ${lon || 80.7718}], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        var marker = L.marker([${lat || 7.8731}, ${lon || 80.7718}], {draggable: true}).addTo(map);
        function updatePos(lat, lng) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: lat, longitude: lng }));
        }
        map.on('click', function(e) { marker.setLatLng(e.latlng); updatePos(e.latlng.lat, e.latlng.lng); });
        marker.on('dragend', function(e) { updatePos(marker.getLatLng().lat, marker.getLatLng().lng); });
    </script>
</body>
</html>
`;

// ─── OpenStreetMap Nominatim Location Search ──────────────────────────────────
const searchLocations = async (query) => {
  if (!query || query.length < 3) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Sri Lanka')}&format=json&limit=6&countrycodes=lk&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'AgroMind/1.0' } }
    );
    const data = await response.json();
    return data.map(item => ({
      id: item.place_id.toString(),
      name: item.display_name.split(',').slice(0, 3).join(', '),
      fullName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  } catch (e) {
    console.log('Location search error:', e);
    return [];
  }
};

export default function RegisterHarvestScreen({ navigation, route }) {
  // ─── Mode: 'storage' | 'stock' ─────────────────────────────────────────────
  const [mode, setMode] = useState(''); // '' = pick mode screen
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [existingLocations, setExistingLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  const editData = route.params?.editData;
  const docId = route.params?.docId;
  const initialMode = route.params?.mode; // 'storage' or 'stock' from dashboard buttons
  const location = useUniversalLocation('en');

  // ─── Storage Form ────────────────────────────────────────────────────────────
  const [storageForm, setStorageForm] = useState({
    storageType: 'Home Storage',
    subCategory: STORAGE_HIERARCHY['Home Storage'].sub[0],
    locationName: '',
    district: '',
    province: '',
    address: '',
    storageArea: '',
    areaUnit: 'Square Feet',
    roofMaterial: 'Tile',
    ventilation: 'Natural',
    hasPestHistory: false,
    notes: '',
  });

  // ─── Location Search State ────────────────────────────────────────────────
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [mapCoords, setMapCoords] = useState(null);
  const locationSearchTimeout = useRef(null);

  // ─── Stock Form ───────────────────────────────────────────────────────────
  const [stockForm, setStockForm] = useState({
    locationId: '',
    variety: 'Bg 300',
    quantityKg: '',
    bags: '0',
    grade: 'A',
    season: 'Maha',
    moisture: '',
    ventilation: 'Good',
    containerCategory: 'Traditional',
    storageMethod: CONTAINER_HIERARCHY['Traditional'][0],
    prodCost: '',
    acres: '',
    hasPestHistory: false,
    disfiguredChecked: 'No',
  });

  // ─── Seed Price from Firestore ────────────────────────────────────────────
  const [seedPrice, setSeedPrice] = useState(null);
  const [loadingSeedPrice, setLoadingSeedPrice] = useState(false);

  // ─── Checklist ─────────────────────────────────────────────────────────────
  const [checklist, setChecklist] = useState({});
  const [showClGuide, setShowClGuide] = useState(false);
  const [clGuide, setClGuide] = useState('');
  const [loadingClGuide, setLoadingClGuide] = useState(false);

  // ─── Inspector / Chat ─────────────────────────────────────────────────────
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: 'ආයුබෝවන්! (Ayubowan!) I am your AgroMind Storage Inspector. I help secure your harvest safely. Ask me anything about storage, moisture, or containers.', isBot: true }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef(null);

  // ─── Storage Recommendation ────────────────────────────────────────────────
  const [storageRec, setStorageRec] = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
    loadExistingLocations();
    if (initialMode) { setMode(initialMode); }
  }, []);

  useEffect(() => {
    if (location.latitude && !mapCoords) {
      setMapCoords({ latitude: location.latitude, longitude: location.longitude });
    }
  }, [location.latitude]);

  useEffect(() => {
    if (editData) {
      if (editData.storageType) {
        setStorageForm({ ...editData, storageArea: editData.storageArea?.toString() || '' });
        setMode('storage');
      } else {
        setStockForm({ ...editData, quantityKg: editData.quantityKg?.toString() || '', bags: editData.bags?.toString() || '0', prodCost: editData.prodCost?.toString() || '' });
        setMode('stock');
      }
    }
  }, [editData]);

  // Fetch seed price when variety changes
  useEffect(() => {
    if (stockForm.variety) fetchSeedPrice(stockForm.variety);
  }, [stockForm.variety]);

  const loadExistingLocations = async () => {
    try {
      const snap = await db.collection('storageLocations').where('userId', '==', auth.currentUser?.uid).get();
      setExistingLocations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.log(e); }
  };

  // ─── Fetch seed price from Firestore admin panel data ────────────────────
  const fetchSeedPrice = async (variety) => {
    setLoadingSeedPrice(true);
    setSeedPrice(null);
    try {
      const docSnap = await db.collection('marketPrices').doc('currentPrices').get();
      if (docSnap.exists) {
        const data = docSnap.data();
        const seedKey = variety.replace(/[.\s]/g, '_');
        if (data.seeds && data.seeds[seedKey]) {
          setSeedPrice(data.seeds[seedKey]);
        }
      }
    } catch (e) { console.log('Seed price fetch error:', e); }
    finally { setLoadingSeedPrice(false); }
  };

  // ─── Location search with debounce ────────────────────────────────────────
  const handleLocationSearch = (text) => {
    setLocationQuery(text);
    setStorageForm(p => ({ ...p, address: text }));
    if (locationSearchTimeout.current) clearTimeout(locationSearchTimeout.current);
    if (text.length < 3) { setLocationSuggestions([]); return; }
    setSearchingLocation(true);
    locationSearchTimeout.current = setTimeout(async () => {
      const results = await searchLocations(text);
      setLocationSuggestions(results);
      setSearchingLocation(false);
    }, 600);
  };

  const handleSelectSuggestion = (suggestion) => {
    setLocationQuery(suggestion.name);
    setStorageForm(p => ({ ...p, address: suggestion.fullName, locationName: p.locationName || suggestion.name.split(',')[0] }));
    setMapCoords({ latitude: suggestion.lat, longitude: suggestion.lon });
    setLocationSuggestions([]);
  };

  // ─── Calculate bags auto ──────────────────────────────────────────────────
  const handleQuantityChange = (val) => {
    const clean = val.replace(/[^0-9.]/g, '');
    const kg = parseFloat(clean);
    const bags = isNaN(kg) || kg <= 0 ? '0' : (kg / 50).toFixed(1);
    setStockForm(p => ({ ...p, quantityKg: clean, bags }));
  };

  // ─── Real-time moisture inspector ─────────────────────────────────────────
  const handleMoistureChange = (val) => {
    setStockForm(p => ({ ...p, moisture: val }));
    const m = parseFloat(val);
    if (!isNaN(m)) {
      if (m > 16) {
        addBotMessage(`🔴 CRITICAL: ${m}% moisture — STOP! Do NOT store. Mold and aflatoxin will form within days. Sun-dry to 13% immediately on black polythene sheets or use a mechanical dryer.`);
      } else if (m > 14) {
        addBotMessage(`⚠️ WARNING: ${m}% moisture exceeds safe limit (14%). Grade B quality. Dry paddy to 13% before storage to prevent fungal growth (SLR 603:2013 standard).`);
      } else if (m < 10 && m > 0) {
        addBotMessage(`⚠️ OVER-DRIED: ${m}% is too low. Milling breakage risk >20%. Check moisture meter calibration. Ideal range is 12-14%.`);
      }
    }
  };

  const addBotMessage = (text) => {
    const msg = { id: Date.now(), text, isBot: true };
    setChatMessages(prev => {
      if (prev.some(m => m.text === text)) return prev;
      return [...prev, msg];
    });
  };

  // ─── Container change → AI recommendation ─────────────────────────────────
  const handleContainerCategoryChange = async (cat) => {
    setStockForm(p => ({ ...p, containerCategory: cat, storageMethod: CONTAINER_HIERARCHY[cat][0] }));
    fetchStorageRecommendation(stockForm.variety, stockForm.quantityKg, stockForm.moisture, cat);
  };

  const fetchStorageRecommendation = async (variety, qty, moisture, containerCat) => {
    if (!qty) return;
    setLoadingRec(true);
    try {
      const res = await fetch(`${BASE_URL}/api/guardian/recommend_storage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variety: variety || 'Bg 300',
          quantity_kg: parseFloat(qty) || 1000,
          moisture_pct: parseFloat(moisture) || 13.5,
          duration_months: 3,
          budget_lkr: 0,
        })
      });
      const data = await res.json();
      if (data.success && data.ai_recommendation) {
        setStorageRec(data);
        if (data.ai_recommendation.recommendation_headline) {
          addBotMessage(`📦 Storage Recommendation: ${data.ai_recommendation.recommendation_headline}\n\nWhy: ${data.ai_recommendation.cost_justification || ''}`);
        }
      }
    } catch (e) { console.log('Rec error:', e); }
    finally { setLoadingRec(false); }
  };

  // ─── Manual AI chat ────────────────────────────────────────────────────────
  const handleManualChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { id: Date.now(), text: chatInput, isBot: false };
    setChatMessages(prev => [...prev, userMsg]);
    const q = chatInput;
    setChatInput('');
    setIsTyping(true);
    try {
      // detect intent: logistics vs grading
      const lowerInput = currentInput.toLowerCase();
      const isGradingIntent = lowerInput.includes('grade') || lowerInput.includes('quality') || lowerInput.includes('audit') || lowerInput.includes('moisture');

      const res = await fetch(`${BASE_URL}/api/guardian/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          context: {
            variety: stockForm.variety,
            quantity: stockForm.quantityKg,
            moisture: stockForm.moisture,
            storage_method: stockForm.storageMethod,
            requested_language: 'en',
          }
        })
      });
      const data = await res.json();
      if (data.success) addBotMessage(data.answer);
      else addBotMessage('Service is busy. Tip: Store paddy at 13% moisture in hermetic bags for best results.');
    } catch (e) {
      addBotMessage('Network issue. Quick tip: Ideal storage moisture is 13%. Use hermetic bags for >3 month storage.');
    } finally { setIsTyping(false); }
  };

  // ─── Checklist next ────────────────────────────────────────────────────────
  const handleChecklistNext = async () => {
    const allItems = CHECKLIST_GROUPS.flatMap(g => g.items);
    const failed = allItems.filter(i => !checklist[i.id]).map(i => i.label);
    if (failed.length === 0) { finalizeStock(); return; }
    setLoadingClGuide(true);
    setShowClGuide(true);
    try {
      const res = await fetch(`${BASE_URL}/api/guardian/checklist_advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ failed_items: failed, variety: stockForm.variety, moisture: stockForm.moisture })
      });
      const data = await res.json();
      setClGuide(data.guide || 'Please fix all unchecked items before storing to prevent crop loss.');
    } catch (e) {
      setClGuide('AI service offline. IMPORTANT: Every unchecked item increases risk of spoilage, mold, or pest attack. Fix before storing.');
    } finally { setLoadingClGuide(false); }
  };

  // ─── Save Storage Location ─────────────────────────────────────────────────
  const finalizeStorage = async () => {
    if (!storageForm.locationName.trim()) { Alert.alert('Required', 'Please enter a name for this storage facility.'); return; }
    if (!storageForm.storageArea || isNaN(parseFloat(storageForm.storageArea))) {
      Alert.alert('Required', 'Please enter the storage area size.'); return;
    }
    setLoading(true);
    try {
      const payload = {
        ...storageForm,
        userId: auth.currentUser?.uid,
        latitude: mapCoords?.latitude || location.latitude || 7.8731,
        longitude: mapCoords?.longitude || location.longitude || 80.7718,
        storageArea: parseFloat(storageForm.storageArea),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (docId) {
        await db.collection('storageLocations').doc(docId).update({ ...payload, updatedAt: new Date() });
        Alert.alert('✅ Updated', 'Storage facility updated successfully.');
      } else {
        await db.collection('storageLocations').add(payload);
        Alert.alert('✅ Success', 'Storage facility registered successfully.');
      }
      navigation.goBack();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  // ─── Save Stock / Harvest ──────────────────────────────────────────────────
  const finalizeStock = async () => {
    if (!stockForm.locationId) { Alert.alert('Required', 'Please select a storage location.'); return; }
    if (!stockForm.quantityKg || parseFloat(stockForm.quantityKg) <= 0) { Alert.alert('Required', 'Please enter quantity in KG.'); return; }
    if (!stockForm.acres || isNaN(parseFloat(stockForm.acres))) { Alert.alert('Required', 'Please enter land area in acres.'); return; }
    if (!stockForm.moisture) { Alert.alert('Required', 'Please enter moisture content (%).'); return; }

    // Capacity check
    const qty = parseFloat(stockForm.quantityKg);
    const loc = existingLocations.find(l => l.id === stockForm.locationId);
    if (loc) {
      const limit = STORAGE_HIERARCHY[loc.storageType]?.limit || 9999999;
      if (qty > limit) {
        Alert.alert('Capacity Exceeded', `${loc.storageType} maximum is ${limit.toLocaleString()} kg. Please choose a larger storage facility.`);
        return;
      }
    }

    if (stockForm.disfiguredChecked === 'Yes') {
      Alert.alert(
        '⚠️ Quality Warning',
        'You reported disfigured/smutted paddy in this batch. Storing without cleaning risks contaminating your entire stock. Recommend sorting first.',
        [
          { text: 'Fix First', style: 'cancel' },
          { text: 'Store Anyway', style: 'destructive', onPress: () => doSaveStock() }
        ]
      );
      return;
    }

    // AI inspector validation
    try {
      const inspRes = await fetch(`${BASE_URL}/api/guardian/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variety: stockForm.variety,
          quantity_kg: parseFloat(stockForm.quantityKg),
          acres: parseFloat(stockForm.acres),
          moisture_pct: parseFloat(stockForm.moisture) || 0,
          grade: stockForm.grade,
        })
      });
      const inspData = await inspRes.json();
      if (!inspData.is_valid && inspData.warnings?.length > 0) {
        const warn = inspData.warnings[0];
        Alert.alert(
          '🚩 Data Issue Detected',
          `${warn.message}\n\n${warn.suggestion}`,
          [
            { text: 'Fix Now', style: 'cancel' },
            { text: 'Continue Anyway', onPress: () => doSaveStock() }
          ]
        );
        return;
      }
    } catch (e) { console.log('Inspector error:', e); }
    doSaveStock();
  };

  const doSaveStock = async () => {
    setLoading(true);
    try {
      const payload = {
        ...stockForm,
        userId: auth.currentUser?.uid,
        quantityKg: parseFloat(stockForm.quantityKg) || 0,
        bags: parseFloat(stockForm.bags) || 0,
        prodCost: parseFloat(stockForm.prodCost) || 0,
        acres: parseFloat(stockForm.acres) || 0,
        moisture: parseFloat(stockForm.moisture) || 0,
        updatedAt: new Date(),
      };
      if (docId) {
        await db.collection('harvests').doc(docId).update(payload);
        Alert.alert('✅ Updated', 'Stock record updated.');
      } else {
        await db.collection('harvests').add({ ...payload, createdAt: new Date() });
        Alert.alert('✅ Registered', 'Harvest secured and registered.');
      }
      navigation.goBack();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  // ─── Progress for steps ────────────────────────────────────────────────────
  const getStorageSteps = () => ['Facility Type', 'Location & Map', 'Details & Review'];
  const getStockSteps = () => ['Select Location', 'Harvest Profile', 'Storage & Quality', 'Pre-Storage Check'];
  const totalSteps = mode === 'storage' ? getStorageSteps().length : getStockSteps().length;
  const progressPct = mode ? ((step + 1) / totalSteps) * 100 : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Mode Picker
  // ─────────────────────────────────────────────────────────────────────────────
  const renderModePicker = () => (
    <View style={styles.stepContent}>
      <View style={styles.modeHeader}>
        <MaterialCommunityIcons name="sprout" size={36} color="#16a34a" />
        <Text style={styles.modeMainTitle}>What would you like to do?</Text>
        <Text style={styles.modeSubTitle}>Choose your operation for this session</Text>
      </View>

      <TouchableOpacity style={styles.modeCard} onPress={() => { setMode('storage'); setStep(0); }}>
        <LinearGradient colors={['#064e3b', '#065f46']} style={styles.modeCardGrad}>
          <MaterialCommunityIcons name="warehouse" size={40} color="#34d399" />
          <View style={styles.modeCardText}>
            <Text style={styles.modeCardTitle}>Register Storage Facility</Text>
            <Text style={styles.modeCardSub}>Add a new storage location (home room, farm shed, warehouse, silo or co-op store)</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#34d399" />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.modeCard} onPress={() => { setMode('stock'); setStep(0); }}>
        <LinearGradient colors={['#1e3a5f', '#1e40af']} style={styles.modeCardGrad}>
          <MaterialCommunityIcons name="rice" size={40} color="#93c5fd" />
          <View style={styles.modeCardText}>
            <Text style={[styles.modeCardTitle, { color: '#fff' }]}>Add Rice Stock</Text>
            <Text style={[styles.modeCardSub, { color: '#bfdbfe' }]}>Record a new harvest batch to an existing storage facility</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#93c5fd" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.modeInfoBox}>
        <MaterialCommunityIcons name="information-outline" size={16} color="#6b7280" />
        <Text style={styles.modeInfoText}>Register storage facility first, then add rice stock to it.</Text>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: ADD STORAGE Steps
  // ─────────────────────────────────────────────────────────────────────────────
  const renderStorageStep = () => {
    if (step === 0) return renderStorageStep0();
    if (step === 1) return renderStorageStep1();
    if (step === 2) return renderStorageStep2();
  };

  const renderStorageStep0 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader('Select Facility Type', 'warehouse')}
      <Text style={styles.fieldLabel}>Storage Category</Text>
      {Object.entries(STORAGE_HIERARCHY).map(([type, info]) => (
        <TouchableOpacity
          key={type}
          style={[styles.typeCard, storageForm.storageType === type && styles.typeCardActive]}
          onPress={() => setStorageForm(p => ({ ...p, storageType: type, subCategory: info.sub[0] }))}
        >
          <View style={[styles.typeIconBox, storageForm.storageType === type && styles.typeIconBoxActive]}>
            <MaterialCommunityIcons name={info.icon} size={24} color={storageForm.storageType === type ? '#fff' : '#16a34a'} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.typeCardTitle, storageForm.storageType === type && styles.typeCardTitleActive]}>{type}</Text>
            <Text style={styles.typeCardSub}>Max: {info.limit >= 999999 ? 'Unlimited' : `${info.limit.toLocaleString()} kg`}</Text>
          </View>
          {storageForm.storageType === type && <MaterialCommunityIcons name="check-circle" size={22} color="#16a34a" />}
        </TouchableOpacity>
      ))}

      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Sub Category</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={storageForm.subCategory}
          onValueChange={v => setStorageForm(p => ({ ...p, subCategory: v }))}
          style={{ color: '#111827' }} dropdownIconColor="#16a34a"
        >
          {(STORAGE_HIERARCHY[storageForm.storageType]?.sub || []).map(s => (
            <Picker.Item key={s} label={s} value={s} />
          ))}
        </Picker>
      </View>
    </View>
  );

  const renderStorageStep1 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader('Location & Map', 'map-marker')}

      <Text style={styles.fieldLabel}>Facility Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Main Farm Shed, Galle Road Warehouse"
        placeholderTextColor="#9ca3af"
        value={storageForm.locationName}
        onChangeText={v => setStorageForm(p => ({ ...p, locationName: v }))}
      />

      <Text style={styles.fieldLabel}>Search Address / Location *</Text>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Type village, town, or area name..."
          placeholderTextColor="#9ca3af"
          value={locationQuery}
          onChangeText={handleLocationSearch}
        />
        {searchingLocation && <ActivityIndicator size="small" color="#16a34a" style={{ marginRight: 10 }} />}
      </View>

      {locationSuggestions.length > 0 && (
        <View style={styles.suggestionsList}>
          {locationSuggestions.map(s => (
            <TouchableOpacity key={s.id} style={styles.suggestionItem} onPress={() => handleSelectSuggestion(s)}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color="#16a34a" />
              <Text style={styles.suggestionText} numberOfLines={2}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Pin on Map</Text>
      <View style={styles.mapContainer}>
        <WebView
          scrollEnabled={false}
          source={{ html: MAP_HTML(mapCoords?.latitude || location.latitude, mapCoords?.longitude || location.longitude) }}
          onMessage={e => setMapCoords(JSON.parse(e.nativeEvent.data))}
          style={styles.map}
        />
        <View style={styles.mapHintOverlay}>
          <MaterialCommunityIcons name="gesture-tap" size={12} color="#16a34a" />
          <Text style={styles.mapHint}>Tap map or drag pin to exact location</Text>
        </View>
      </View>

      {mapCoords && (
        <View style={styles.coordBadge}>
          <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#16a34a" />
          <Text style={styles.coordText}>
            {mapCoords.latitude.toFixed(4)}°N, {mapCoords.longitude.toFixed(4)}°E
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.fieldLabel}>District</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Kandy"
            placeholderTextColor="#9ca3af"
            value={storageForm.district}
            onChangeText={v => setStorageForm(p => ({ ...p, district: v }))}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.fieldLabel}>Province</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Central"
            placeholderTextColor="#9ca3af"
            value={storageForm.province}
            onChangeText={v => setStorageForm(p => ({ ...p, province: v }))}
          />
        </View>
      </View>
    </View>
  );

  const renderStorageStep2 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader('Facility Details', 'clipboard-text')}

      <View style={styles.row}>
        <View style={{ flex: 1.2, marginRight: 8 }}>
          <Text style={styles.fieldLabel}>Storage Area *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 400"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={storageForm.storageArea}
            onChangeText={v => setStorageForm(p => ({ ...p, storageArea: v }))}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.fieldLabel}>Unit</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={storageForm.areaUnit}
              onValueChange={v => setStorageForm(p => ({ ...p, areaUnit: v }))}
              style={{ color: '#111827' }} dropdownIconColor="#16a34a"
            >
              {['Square Feet', 'Square Meters', 'Perches'].map(u => <Picker.Item key={u} label={u} value={u} />)}
            </Picker>
          </View>
        </View>
      </View>

      <Text style={styles.fieldLabel}>Roof Material</Text>
      <View style={styles.btnRow}>
        {['Tile', 'Metal Sheet', 'Asbestos', 'Concrete', 'Cadjan'].map(r => (
          <TouchableOpacity key={r} style={[styles.pill, storageForm.roofMaterial === r && styles.pillActive]} onPress={() => setStorageForm(p => ({ ...p, roofMaterial: r }))}>
            <Text style={[styles.pillText, storageForm.roofMaterial === r && styles.pillTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Ventilation</Text>
      <View style={styles.btnRow}>
        {['None', 'Natural', 'Fan Assisted', 'Air Conditioned'].map(v => (
          <TouchableOpacity key={v} style={[styles.pill, storageForm.ventilation === v && styles.pillActive]} onPress={() => setStorageForm(p => ({ ...p, ventilation: v }))}>
            <Text style={[styles.pillText, storageForm.ventilation === v && styles.pillTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Pest History at this Location?</Text>
      <View style={styles.btnRow}>
        {['No', 'Yes - Rats', 'Yes - Weevils', 'Yes - Both'].map(p => (
          <TouchableOpacity key={p} style={[styles.pill, storageForm.hasPestHistory === p && styles.pillActive]} onPress={() => setStorageForm(prev => ({ ...prev, hasPestHistory: p }))}>
            <Text style={[styles.pillText, storageForm.hasPestHistory === p && styles.pillTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Additional Notes</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Any special notes about this facility..."
        placeholderTextColor="#9ca3af"
        multiline
        value={storageForm.notes}
        onChangeText={v => setStorageForm(p => ({ ...p, notes: v }))}
      />

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📋 Summary</Text>
        <View style={styles.summaryRow}><Text style={styles.summaryKey}>Type</Text><Text style={styles.summaryVal}>{storageForm.storageType}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryKey}>Name</Text><Text style={styles.summaryVal}>{storageForm.locationName || '—'}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryKey}>Area</Text><Text style={styles.summaryVal}>{storageForm.storageArea} {storageForm.areaUnit}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryKey}>Location</Text><Text style={styles.summaryVal}>{storageForm.district}, {storageForm.province}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryKey}>Capacity</Text><Text style={styles.summaryVal}>{(STORAGE_HIERARCHY[storageForm.storageType]?.limit || 0) >= 999999 ? 'Unlimited' : `${(STORAGE_HIERARCHY[storageForm.storageType]?.limit || 0).toLocaleString()} kg`}</Text></View>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: ADD STOCK Steps
  // ─────────────────────────────────────────────────────────────────────────────
  const renderStockStep = () => {
    if (step === 0) return renderStockStep0();
    if (step === 1) return renderStockStep1();
    if (step === 2) return renderStockStep2();
    if (step === 3) return renderStockStep3();
  };

  const renderStockStep0 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader('Select Storage Location', 'map-marker-check')}
      {existingLocations.length === 0 ? (
        <View style={styles.emptyLocBox}>
          <MaterialCommunityIcons name="warehouse-off" size={48} color="#9ca3af" />
          <Text style={styles.emptyLocTitle}>No Storage Facility Found</Text>
          <Text style={styles.emptyLocSub}>You need to register a storage facility first before adding stock.</Text>
          <TouchableOpacity style={styles.addLocBtn} onPress={() => { setMode('storage'); setStep(0); }}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.addLocBtnText}>Register Storage Facility</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.fieldLabel}>Choose where to store this batch</Text>
          {existingLocations.map(loc => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.locCard, stockForm.locationId === loc.id && styles.locCardActive]}
              onPress={() => { setStockForm(p => ({ ...p, locationId: loc.id })); setSelectedLocation(loc); }}
            >
              <View style={[styles.locIconBox, stockForm.locationId === loc.id && styles.locIconBoxActive]}>
                <MaterialCommunityIcons name={STORAGE_HIERARCHY[loc.storageType]?.icon || 'warehouse'} size={22} color={stockForm.locationId === loc.id ? '#fff' : '#16a34a'} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.locName}>{loc.locationName}</Text>
                <Text style={styles.locMeta}>{loc.storageType} • {loc.storageArea} {loc.areaUnit}</Text>
                {loc.district && <Text style={styles.locMeta}>{loc.district}, {loc.province}</Text>}
              </View>
              {stockForm.locationId === loc.id && <MaterialCommunityIcons name="check-circle" size={22} color="#16a34a" />}
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );

  const renderStockStep1 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader('Harvest Profile', 'rice')}

      <Text style={styles.fieldLabel}>Rice Variety (Vee Variety) *</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={stockForm.variety}
          onValueChange={v => setStockForm(p => ({ ...p, variety: v }))}
          style={{ color: '#111827' }} dropdownIconColor="#16a34a"
        >
          {RICE_VARIETIES.map(v => <Picker.Item key={v} label={v} value={v} />)}
        </Picker>
      </View>

      {/* Seed Price Display from Admin DB */}
      {loadingSeedPrice ? (
        <View style={styles.priceLoadBox}>
          <ActivityIndicator size="small" color="#16a34a" />
          <Text style={styles.priceLoadText}>Loading market price...</Text>
        </View>
      ) : seedPrice ? (
        <View style={styles.seedPriceCard}>
          <View style={styles.seedPriceLeft}>
            <MaterialCommunityIcons name="tag-outline" size={20} color="#16a34a" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.seedPriceLabel}>Current Seed Price ({stockForm.variety})</Text>
              <Text style={styles.seedPriceValue}>LKR {seedPrice.price?.toFixed(2)} / kg</Text>
            </View>
          </View>
          <View style={styles.seedPriceRight}>
            <Text style={styles.seedPriceSource}>{seedPrice.source}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.seedPriceNA}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#9ca3af" />
          <Text style={styles.seedPriceNAText}>No price data for {stockForm.variety} yet. Contact your agrarian officer.</Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={{ flex: 1.2, marginRight: 8 }}>
          <Text style={styles.fieldLabel}>Total Quantity (KG) *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g., 1500"
            placeholderTextColor="#9ca3af"
            value={stockForm.quantityKg}
            onChangeText={handleQuantityChange}
          />
          {selectedLocation && (
            <View style={styles.limitRow}>
              <MaterialCommunityIcons name="information" size={11} color="#9ca3af" />
              <Text style={styles.limitText}>Limit: {(STORAGE_HIERARCHY[selectedLocation.storageType]?.limit || 0) >= 999999 ? 'Unlimited' : `${(STORAGE_HIERARCHY[selectedLocation.storageType]?.limit || 0).toLocaleString()} kg`}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 0.8, marginLeft: 8 }}>
          <Text style={styles.fieldLabel}>Est. Bags (50kg)</Text>
          <View style={styles.readOnly}><Text style={styles.readOnlyText}>{stockForm.bags}</Text></View>
        </View>
      </View>

      <Text style={styles.fieldLabel}>Harvested Land Area (Acres) *</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="e.g., 2.5"
        placeholderTextColor="#9ca3af"
        value={stockForm.acres}
        onChangeText={v => setStockForm(p => ({ ...p, acres: v }))}
      />

      <Text style={styles.fieldLabel}>Season</Text>
      <View style={styles.btnRow}>
        {['Maha', 'Yala'].map(s => (
          <TouchableOpacity key={s} style={[styles.pill, stockForm.season === s && styles.pillActive]} onPress={() => setStockForm(p => ({ ...p, season: s }))}>
            <Text style={[styles.pillText, stockForm.season === s && styles.pillTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Quality Grade</Text>
      <View style={styles.gradeRow}>
        {[
          { g: 'A', label: 'Grade A', sub: 'MC < 14%', color: '#16a34a' },
          { g: 'B', label: 'Grade B', sub: 'MC 14-16%', color: '#f59e0b' },
          { g: 'C', label: 'Grade C', sub: 'MC > 16%', color: '#dc2626' },
        ].map(({ g, label, sub, color }) => (
          <TouchableOpacity
            key={g}
            style={[styles.gradeCard, stockForm.grade === g && { borderColor: color, backgroundColor: color + '15' }]}
            onPress={() => setStockForm(p => ({ ...p, grade: g }))}
          >
            <Text style={[styles.gradeLabel, stockForm.grade === g && { color }]}>{label}</Text>
            <Text style={styles.gradeSub}>{sub}</Text>
            {stockForm.grade === g && <MaterialCommunityIcons name="check-circle" size={16} color={color} />}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Production Cost (LKR/KG)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Your cost to produce 1 kg"
        placeholderTextColor="#9ca3af"
        value={stockForm.prodCost}
        onChangeText={v => setStockForm(p => ({ ...p, prodCost: v }))}
      />
      <TouchableOpacity
        style={styles.planBtn}
        onPress={() => navigation.navigate('InputPlanner')}
      >
        <MaterialCommunityIcons name="calculator-variant" size={16} color="#1d4ed8" />
        <Text style={styles.planBtnText}>Calculate with Input Planner</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStockStep2 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader('Storage & Quality', 'shield-check')}

      <Text style={styles.fieldLabel}>Moisture Content (%) *</Text>
      <View style={styles.moistureRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          keyboardType="numeric"
          placeholder="Target: 13.5%"
          placeholderTextColor="#9ca3af"
          value={stockForm.moisture}
          onChangeText={handleMoistureChange}
        />
        {stockForm.moisture ? (
          <View style={[styles.moistureBadge, {
            backgroundColor: parseFloat(stockForm.moisture) > 16 ? '#fee2e2' :
              parseFloat(stockForm.moisture) > 14 ? '#fef9c3' : '#dcfce7'
          }]}>
            <Text style={[styles.moistureBadgeText, {
              color: parseFloat(stockForm.moisture) > 16 ? '#dc2626' :
                parseFloat(stockForm.moisture) > 14 ? '#ca8a04' : '#16a34a'
            }]}>
              {parseFloat(stockForm.moisture) > 16 ? '🔴 REJECT' : parseFloat(stockForm.moisture) > 14 ? '🟡 CAUTION' : '🟢 SAFE'}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.moistureGuide}>
        {[{ label: 'Grade A+', range: '≤ 13%', color: '#16a34a' }, { label: 'Grade A', range: '13-14%', color: '#22c55e' }, { label: 'Grade B', range: '14-16%', color: '#f59e0b' }, { label: 'Grade C', range: '16-18%', color: '#dc2626' }].map(m => (
          <View key={m.label} style={styles.moistureGuideItem}>
            <View style={[styles.moistureDot, { backgroundColor: m.color }]} />
            <Text style={styles.moistureGuideText}>{m.label}: {m.range}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Ventilation Condition</Text>
      <View style={styles.btnRow}>
        {['Good', 'Average', 'Poor'].map(v => (
          <TouchableOpacity key={v} style={[styles.pill, stockForm.ventilation === v && styles.pillActive]} onPress={() => setStockForm(p => ({ ...p, ventilation: v }))}>
            <Text style={[styles.pillText, stockForm.ventilation === v && styles.pillTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Container Type Category</Text>
      <View style={styles.btnRow}>
        {Object.keys(CONTAINER_HIERARCHY).map(cat => (
          <TouchableOpacity key={cat} style={[styles.pill, stockForm.containerCategory === cat && styles.pillActive]} onPress={() => handleContainerCategoryChange(cat)}>
            <Text style={[styles.pillText, stockForm.containerCategory === cat && styles.pillTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Storage Container Method</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={stockForm.storageMethod}
          onValueChange={v => setStockForm(p => ({ ...p, storageMethod: v }))}
          style={{ color: '#111827' }} dropdownIconColor="#16a34a"
        >
          {CONTAINER_HIERARCHY[stockForm.containerCategory].map(m => (
            <Picker.Item key={m} label={m} value={m} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity style={styles.aiAnalyzeBtn} onPress={() => {
        setChatVisible(true);
        fetchStorageRecommendation(stockForm.variety, stockForm.quantityKg, stockForm.moisture, stockForm.containerCategory);
      }}>
        <MaterialCommunityIcons name="brain" size={16} color="#16a34a" />
        <Text style={styles.aiAnalyzeBtnText}>Analyze Container Choice with AI</Text>
      </TouchableOpacity>

      {/* AI Recommendation Box */}
      {loadingRec && (
        <View style={styles.recLoading}>
          <ActivityIndicator size="small" color="#16a34a" />
          <Text style={styles.recLoadingText}>AI analyzing best container...</Text>
        </View>
      )}
      {storageRec && storageRec.ai_recommendation && (
        <View style={styles.recCard}>
          <View style={styles.recCardHeader}>
            <MaterialCommunityIcons name="check-decagram" size={18} color="#16a34a" />
            <Text style={styles.recCardTitle}>AI Recommendation</Text>
          </View>
          <Text style={styles.recBag}>Best: {storageRec.ai_recommendation.recommended_bag?.toUpperCase()}</Text>
          <Text style={styles.recReason}>{storageRec.ai_recommendation.recommendation_headline}</Text>
          {storageRec.ai_recommendation.preparation_steps?.slice(0, 3).map((s, i) => (
            <View key={i} style={styles.recStep}><Text style={styles.recStepNum}>{i + 1}</Text><Text style={styles.recStepText}>{s}</Text></View>
          ))}
        </View>
      )}

      <Text style={styles.fieldLabel}>Disfigured / Smutted Paddy Present?</Text>
      <View style={styles.btnRow}>
        {['No', 'Yes - Some', 'Yes - Significant'].map(d => (
          <TouchableOpacity key={d} style={[styles.pill, stockForm.disfiguredChecked === d && (d === 'No' ? styles.pillActive : styles.pillDanger)]} onPress={() => { setStockForm(p => ({ ...p, disfiguredChecked: d })); if (d !== 'No') addBotMessage('⚠️ Disfigured/smutted grains contain fungal spores. Even a small number can contaminate your entire batch during storage. Strongly recommend sorting and removing before storing.'); }}>
            <Text style={[styles.pillText, stockForm.disfiguredChecked === d && (d === 'No' ? styles.pillTextActive : styles.pillTextDanger)]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStockStep3 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader('Pre-Storage Safety Check', 'playlist-check')}
      <Text style={styles.checklistHint}>Tick ALL items. Unchecked items = spoilage risk.</Text>

      {CHECKLIST_GROUPS.map((group, gi) => (
        <View key={gi} style={styles.clGroup}>
          <View style={styles.clGroupHeader}>
            <MaterialCommunityIcons name={group.icon} size={16} color="#16a34a" />
            <Text style={styles.clGroupTitle}>{group.title}</Text>
            <Text style={styles.clGroupCount}>
              {group.items.filter(i => checklist[i.id]).length}/{group.items.length}
            </Text>
          </View>
          {group.items.map(item => (
            <TouchableOpacity key={item.id} style={styles.clItem} onPress={() => setChecklist(p => ({ ...p, [item.id]: !p[item.id] }))}>
              <MaterialCommunityIcons
                name={checklist[item.id] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22} color={checklist[item.id] ? '#16a34a' : '#9ca3af'}
              />
              <Text style={[styles.clItemText, checklist[item.id] && styles.clItemTextChecked]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.clScoreBox}>
        <Text style={styles.clScoreLabel}>Readiness Score</Text>
        <Text style={styles.clScoreValue}>
          {Object.values(checklist).filter(Boolean).length}/{CHECKLIST_GROUPS.reduce((a, g) => a + g.items.length, 0)}
        </Text>
      </View>

      <View style={styles.clWarning}>
        <MaterialCommunityIcons name="alert-circle" size={16} color="#dc2626" />
        <Text style={styles.clWarningText}>If ANY item is unchecked, fix it before storing to prevent total crop loss.</Text>
      </View>

      {/* Inspector Chat trigger */}
      <TouchableOpacity style={styles.chatTriggerBtn} onPress={() => setChatVisible(true)}>
        <MaterialCommunityIcons name="message-question" size={18} color="#16a34a" />
        <Text style={styles.chatTriggerText}>Ask Inspector about unchecked items</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Step Header Helper ────────────────────────────────────────────────────
  const renderStepHeader = (title, icon) => (
    <View style={styles.stepHeaderRow}>
      <View style={styles.stepIconCircle}>
        <MaterialCommunityIcons name={icon} size={22} color="#16a34a" />
      </View>
      <Text style={styles.stepHeaderTitle}>{title}</Text>
    </View>
  );

  // ─── Footer Navigation ─────────────────────────────────────────────────────
  const getNextLabel = () => {
    if (mode === 'storage') {
      if (step === getStorageSteps().length - 1) return 'SAVE FACILITY';
    } else {
      if (step === getStockSteps().length - 1) return 'VERIFY & STORE';
    }
    return 'CONTINUE';
  };

  const handleNext = () => {
    if (mode === 'storage') {
      if (step === getStorageSteps().length - 1) { finalizeStorage(); return; }
    } else {
      if (step === 0 && !stockForm.locationId) { Alert.alert('Required', 'Please select a storage location.'); return; }
      if (step === getStockSteps().length - 1) { handleChecklistNext(); return; }
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step === 0) { setMode(''); setStep(0); return; }
    setStep(s => s - 1);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => mode ? handleBack() : navigation.goBack()} style={styles.headerBack}>
          <MaterialCommunityIcons name={mode && step > 0 ? 'arrow-left' : 'close'} size={22} color="#374151" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {!mode ? 'Register Harvest' : mode === 'storage' ? 'Register Storage Facility' : 'Add Rice Stock'}
          </Text>
          {mode && <Text style={styles.headerSub}>{mode === 'storage' ? getStorageSteps()[step] : getStockSteps()[step]}</Text>}
        </View>
        {mode && (
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{step + 1}/{totalSteps}</Text>
          </View>
        )}
      </View>

      {/* Progress */}
      {mode && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!mode && renderModePicker()}
          {mode === 'storage' && renderStorageStep()}
          {mode === 'stock' && renderStockStep()}
        </ScrollView>

        {/* Footer */}
        {mode && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <MaterialCommunityIcons name="arrow-left" size={18} color="#6b7280" />
              <Text style={styles.backBtnText}>BACK</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={loading}>
              <LinearGradient colors={['#059669', '#16a34a']} style={styles.nextBtnGrad}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.nextBtnText}>{getNextLabel()}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ─── Inspector Chat Modal ──────────────────────────────────────────── */}
      <Modal visible={chatVisible} animationType="slide" transparent>
        <View style={styles.chatOverlay}>
          <View style={styles.chatSheet}>
            <View style={styles.chatSheetHandle} />
            <View style={styles.chatHeader}>
              <View style={styles.chatAvatar}>
                <MaterialCommunityIcons name="robot-happy" size={24} color="#16a34a" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.chatName}>AgroMind Inspector</Text>
                <Text style={styles.chatStatus}>SLR 603:2013 Certified • Online</Text>
              </View>
              <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.chatClose}>
                <MaterialCommunityIcons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.chatBody}
              ref={chatScrollRef}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
              {chatMessages.map(m => (
                <View key={m.id} style={[styles.chatBubble, m.isBot ? styles.chatBubbleBot : styles.chatBubbleUser]}>
                  <Text style={[styles.chatBubbleText, m.isBot ? styles.chatBubbleTextBot : styles.chatBubbleTextUser]}>{m.text}</Text>
                </View>
              ))}
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#16a34a" />
                  <Text style={styles.typingText}>Inspector is typing...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.chatFooterBar}>
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInputField}
                  placeholder="Ask about storage, moisture, pests..."
                  placeholderTextColor="#9ca3af"
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={handleManualChat}
                  returnKeyType="send"
                />
                <TouchableOpacity style={styles.chatSendBtn} onPress={handleManualChat}>
                  <MaterialCommunityIcons name="send" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.quickReplies}>
                {['Best bag for 2000kg?', 'Safe moisture level?', 'How to prevent weevils?'].map(q => (
                  <TouchableOpacity key={q} style={styles.quickReply} onPress={() => { setChatInput(q); handleManualChat(); }}>
                    <Text style={styles.quickReplyText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Checklist AI Guide Modal ────────────────────────────────────────── */}
      <Modal visible={showClGuide} animationType="slide" transparent>
        <View style={styles.guideOverlay}>
          <View style={styles.guideSheet}>
            <View style={styles.guideHeader}>
              <MaterialCommunityIcons name="shield-alert" size={28} color="#dc2626" />
              <Text style={styles.guideTitle}>AI Safety Audit</Text>
              <TouchableOpacity onPress={() => setShowClGuide(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.guideBody}>
              {loadingClGuide ? (
                <View style={styles.guideLoading}>
                  <ActivityIndicator size="large" color="#16a34a" />
                  <Text style={styles.guideLoadingText}>AI analyzing your checklist...</Text>
                </View>
              ) : (
                <Text style={styles.guideText}>{clGuide}</Text>
              )}
            </ScrollView>
            <View style={styles.guideFooter}>
              <TouchableOpacity style={styles.guideFixBtn} onPress={() => setShowClGuide(false)}>
                <Text style={styles.guideFixBtnText}>Go Back & Fix Issues</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.guideIgnoreBtn} onPress={() => {
                Alert.alert(
                  '⚠️ Risk Acknowledged?',
                  'Ignoring safety checks may result in total harvest loss (aflatoxin, mold, pests). Proceed?',
                  [
                    { text: 'Go Back & Fix', style: 'cancel' },
                    { text: 'Store Anyway', style: 'destructive', onPress: () => { setShowClGuide(false); doSaveStock(); } }
                  ]
                );
              }}>
                <Text style={styles.guideIgnoreBtnText}>Ignore Warnings & Store</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerBack: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  stepBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stepBadgeText: { color: '#15803d', fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 4, backgroundColor: '#e5e7eb' },
  progressFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 2 },
  scroll: { padding: 16, paddingBottom: 40 },

  // Mode Picker
  modeHeader: { alignItems: 'center', paddingVertical: 20, marginBottom: 8 },
  modeMainTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginTop: 12, textAlign: 'center' },
  modeSubTitle: { fontSize: 14, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  modeCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 14, elevation: 4 },
  modeCardGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14 },
  modeCardText: { flex: 1 },
  modeCardTitle: { color: '#34d399', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  modeCardSub: { color: '#6ee7b7', fontSize: 13, lineHeight: 18 },
  modeInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9c3', padding: 12, borderRadius: 12, gap: 8, marginTop: 8 },
  modeInfoText: { color: '#854d0e', fontSize: 12, flex: 1 },

  // Step Content
  stepContent: { paddingBottom: 20 },
  stepHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  stepIconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  stepHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#15803d' },

  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#6b7280', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 13, color: '#111827', fontSize: 15, borderWidth: 1.5, borderColor: '#d1d5db' },
  pickerWrap: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#d1d5db', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },

  // Type Cards
  typeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#e5e7eb', elevation: 1 },
  typeCardActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  typeIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  typeIconBoxActive: { backgroundColor: '#16a34a' },
  typeCardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  typeCardTitleActive: { color: '#16a34a' },
  typeCardSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  // Location Search
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#d1d5db', paddingLeft: 10 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, padding: 12, color: '#111827', fontSize: 14 },
  suggestionsList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginTop: 4, overflow: 'hidden', elevation: 4 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  suggestionText: { flex: 1, color: '#374151', fontSize: 13 },

  // Map
  mapContainer: { height: 200, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d1d5db', position: 'relative', marginTop: 4 },
  map: { ...StyleSheet.absoluteFillObject },
  mapHintOverlay: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  mapHint: { fontSize: 10, color: '#16a34a', fontWeight: '700' },
  coordBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8, marginTop: 6, gap: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  coordText: { color: '#15803d', fontSize: 12, fontWeight: '700' },

  // Location cards
  locCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#e5e7eb', elevation: 1 },
  locCardActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  locIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  locIconBoxActive: { backgroundColor: '#16a34a' },
  locName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  locMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  emptyLocBox: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#e5e7eb', gap: 10 },
  emptyLocTitle: { fontSize: 16, fontWeight: '800', color: '#374151' },
  emptyLocSub: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  addLocBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 6, marginTop: 8 },
  addLocBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Seed Price
  priceLoadBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#f9fafb', borderRadius: 10, marginTop: 4 },
  priceLoadText: { color: '#6b7280', fontSize: 13 },
  seedPriceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 4 },
  seedPriceLeft: { flexDirection: 'row', alignItems: 'center' },
  seedPriceLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  seedPriceValue: { fontSize: 16, fontWeight: '900', color: '#15803d', marginTop: 2 },
  seedPriceRight: {},
  seedPriceSource: { fontSize: 11, color: '#9ca3af' },
  seedPriceNA: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: '#f9fafb', borderRadius: 10, marginTop: 4 },
  seedPriceNAText: { flex: 1, fontSize: 12, color: '#9ca3af' },

  // Quantity
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  limitText: { color: '#9ca3af', fontSize: 10, fontWeight: '700', fontStyle: 'italic' },
  readOnly: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 14, justifyContent: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
  readOnlyText: { color: '#16a34a', fontSize: 16, fontWeight: '900', textAlign: 'center' },

  // Grade cards
  gradeRow: { flexDirection: 'row', gap: 8 },
  gradeCard: { flex: 1, padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  gradeLabel: { fontSize: 14, fontWeight: '800', color: '#374151' },
  gradeSub: { fontSize: 10, color: '#9ca3af', marginTop: 4 },

  // Buttons row
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d1d5db' },
  pillActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  pillDanger: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  pillText: { color: '#6b7280', fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  pillTextDanger: { color: '#dc2626' },

  // Moisture
  moistureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moistureBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  moistureBadgeText: { fontSize: 12, fontWeight: '800' },
  moistureGuide: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, backgroundColor: '#f9fafb', padding: 10, borderRadius: 10 },
  moistureGuideItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moistureDot: { width: 8, height: 8, borderRadius: 4 },
  moistureGuideText: { fontSize: 11, color: '#6b7280' },

  // AI Analyze
  aiAnalyzeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginTop: 8, backgroundColor: '#f0fdf4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  aiAnalyzeBtnText: { color: '#16a34a', fontSize: 12, fontWeight: '700' },

  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  planBtnText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },

  // Recommendation
  recLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#f9fafb', borderRadius: 10 },
  recLoadingText: { color: '#6b7280', fontSize: 13 },
  recCard: { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 10 },
  recCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  recCardTitle: { fontSize: 14, fontWeight: '800', color: '#15803d' },
  recBag: { fontSize: 16, fontWeight: '900', color: '#16a34a', marginBottom: 4 },
  recReason: { fontSize: 13, color: '#374151', lineHeight: 18, marginBottom: 8 },
  recStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  recStepNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#16a34a', color: '#fff', fontSize: 11, fontWeight: '900', textAlign: 'center', lineHeight: 20 },
  recStepText: { flex: 1, fontSize: 12, color: '#374151' },

  // Summary
  summaryCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#e5e7eb', marginTop: 16 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  summaryKey: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  summaryVal: { fontSize: 13, color: '#111827', fontWeight: '700', maxWidth: '60%', textAlign: 'right' },

  // Checklist
  checklistHint: { color: '#6b7280', fontSize: 13, marginBottom: 16, lineHeight: 18 },
  clGroup: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#e5e7eb' },
  clGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  clGroupTitle: { flex: 1, fontSize: 12, fontWeight: '900', color: '#16a34a', letterSpacing: 0.5 },
  clGroupCount: { fontSize: 12, color: '#9ca3af', fontWeight: '700' },
  clItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f9fafb' },
  clItemText: { flex: 1, fontSize: 13, color: '#9ca3af' },
  clItemTextChecked: { color: '#111827' },
  clScoreBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  clScoreLabel: { fontSize: 13, fontWeight: '700', color: '#15803d' },
  clScoreValue: { fontSize: 20, fontWeight: '900', color: '#16a34a' },
  clWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#dc2626', marginTop: 12 },
  clWarningText: { flex: 1, color: '#dc2626', fontSize: 12, fontWeight: '600', lineHeight: 16 },
  chatTriggerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  chatTriggerText: { color: '#16a34a', fontSize: 13, fontWeight: '700' },

  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16 },
  backBtnText: { color: '#6b7280', fontWeight: '800', fontSize: 13 },
  nextBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  nextBtnGrad: { flexDirection: 'row', height: 52, alignItems: 'center', justifyContent: 'center', gap: 6 },
  nextBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },

  // Chat Modal
  chatOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '75%' },
  chatSheetHandle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  chatAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  chatName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  chatStatus: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  chatClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  chatBody: { flex: 1, padding: 16 },
  chatBubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 10 },
  chatBubbleBot: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', borderBottomLeftRadius: 4 },
  chatBubbleUser: { alignSelf: 'flex-end', backgroundColor: '#16a34a', borderBottomRightRadius: 4 },
  chatBubbleText: { fontSize: 14, lineHeight: 20 },
  chatBubbleTextBot: { color: '#374151' },
  chatBubbleTextUser: { color: '#fff', fontWeight: '600' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, marginBottom: 8 },
  typingText: { color: '#9ca3af', fontSize: 12 },
  chatFooterBar: { borderTopWidth: 1, borderTopColor: '#f3f4f6', padding: 12 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', borderRadius: 14, paddingLeft: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  chatInputField: { flex: 1, color: '#111827', fontSize: 14, paddingVertical: 10 },
  chatSendBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', marginRight: 3 },
  quickReplies: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickReply: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#bbf7d0' },
  quickReplyText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },

  // Guide Modal
  guideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  guideSheet: { backgroundColor: '#fff', borderRadius: 24, maxHeight: '80%', overflow: 'hidden' },
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  guideTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: '#111827' },
  guideBody: { padding: 20, maxHeight: 400 },
  guideLoading: { alignItems: 'center', gap: 12, paddingVertical: 30 },
  guideLoadingText: { color: '#6b7280', fontSize: 13 },
  guideText: { color: '#374151', fontSize: 14, lineHeight: 22 },
  guideFooter: { padding: 20, gap: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  guideFixBtn: { backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  guideFixBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  guideIgnoreBtn: { alignItems: 'center', paddingVertical: 8 },
  guideIgnoreBtnText: { color: '#9ca3af', fontSize: 13, textDecorationLine: 'underline' },
});