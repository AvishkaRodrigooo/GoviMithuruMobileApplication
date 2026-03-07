import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Dimensions, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView,
  Platform, StatusBar, Modal, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { db, auth } from '../../firebase/firebaseConfig';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import useUniversalLocation from '../../utils/useUniversalLocation';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');
const BASE_URL = 'http://192.168.100.198:5000'; // Flask Backend

const RICE_VARIETIES = [
  'Bg 250', 'Bg 300', 'Bg 352', 'Bg 366', 'Bg 379-2', 'Bg 403',
  'At 306', 'At 362', 'At 405',
  'Samba Rice', 'Suwandel', 'Kuruluthuda', 'Kekulu Rice', 'Rathdhal',
  'Kaluheenati', 'Madathawalu', 'H 4', 'H 10'
];

const STORAGE_HIERARCHY = {
  'Home': {
    limit: 500,
    sub: ['Kitchen/Room Storage', 'Dedicated Storage Room', 'Small Shed']
  },
  'Warehouse': {
    limit: 10000,
    sub: ['Private Warehouse', 'Rental Warehouse', 'Farm Warehouse']
  },
  'Co-op': {
    limit: 50000,
    sub: ['Farmer Co-op Centers', 'Samurdhi Co-ops', 'Agricultural Co-ops']
  },
  'Government Store': {
    limit: 9999999, // 50,000+
    sub: ['PMB (Paddy Marketing Board) Stores', 'District Agricultural Offices', 'CWE']
  },
  'Private Store': {
    limit: 9999999, // 1,000+
    sub: ['Rice Mills with Storage', 'Commercial Warehouses', 'Export-Grade Facilities']
  }
};

const CONTAINER_HIERARCHY = {
  'Traditional': ['Gunny bags (Jute Sacks)', 'Woven Polypropylene Bags', 'Clay Bins (Bisso)', 'Bamboo Baskets (Kattaya)'],
  'Modern': ['Polythene bags (LDPE)', 'Hermetic Bags (Airtight)', 'Super Bags (PICS/GrainPro)', 'Metal Silos'],
  'Commercial': ['Bulk Storage', 'Silo Storage (Industrial)', 'Cold Storage', 'Vacuum Storage']
};

const STORAGE_TYPES = Object.keys(STORAGE_HIERARCHY);
const MEASUREMENT_UNITS = ['Square Feet', 'Square Meters'];

const MAP_HTML = (lat, lon) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #0f172a; }
        .leaflet-control-attribution { display: none; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map').setView([${lat || 7.8731}, ${lon || 80.7718}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);

        var marker = L.marker([${lat || 7.8731}, ${lon || 80.7718}], {draggable: true}).addTo(map);
        
        function updatePos(lat, lng) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: lat, longitude: lng }));
        }

        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            updatePos(e.latlng.lat, e.latlng.lng);
        });

        marker.on('dragend', function(e) {
            updatePos(marker.getLatLng().lat, marker.getLatLng().lng);
        });
    </script>
</body>
</html>
`;

export default function RegisterHarvestScreen({ navigation, route }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [storageMode, setStorageMode] = useState('');
  const [existingLocations, setExistingLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const editData = route.params?.editData;
  const docId = route.params?.docId;
  const location = useUniversalLocation('en');

  const [formData, setFormData] = useState({
    locationId: '',
    storageType: 'Home',
    locationName: '',
    storageArea: '',
    areaUnit: 'Square Feet',
    acres: '',
    variety: 'Bg 300',
    quantityKg: '',
    bags: '0',
    grade: 'A',
    season: 'Maha',
    ventilation: 'Good',
    moisture: '',
    pestCheck: 'No',
    prodCost: '',
    storageMethod: CONTAINER_HIERARCHY['Traditional'][0],
    disfiguredChecked: 'No', // New check for smudged/deformed paddy
    subCategory: STORAGE_HIERARCHY['Home'].sub[0],
    containerCategory: 'Traditional',
  });

  // Map State
  const [mapCoords, setMapCoords] = useState(null);

  // Inspector State
  const [inspectorMsg, setInspectorMsg] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [inspectorChat, setInspectorChat] = useState([
    { id: 1, text: "Ayubowan! I am Inspector GoviMithuru. I'll help you secure your harvest correctly.", isBot: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    checkAuth();
    loadExistingLocations();
    if (!permission) requestPermission();
  }, []);

  const checkAuth = () => {
    if (!auth.currentUser) {
      Alert.alert("Not Logged In", "Please login first", [{ text: "OK", onPress: () => navigation.goBack() }]);
    }
  };

  const loadExistingLocations = async () => {
    try {
      const snapshot = await db.collection('storageLocations').where('userId', '==', auth.currentUser?.uid).get();
      setExistingLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.log(error); }
  };

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        quantityKg: editData.quantityKg?.toString() || '',
        bags: editData.bags?.toString() || '0',
        prodCost: editData.prodCost?.toString() || '',
        storageArea: editData.storageArea?.toString() || '',
      });
      setStorageMode('existing');
    }
  }, [editData]);

  // Real-time Inspector Logic
  useEffect(() => {
    const m = parseFloat(formData.moisture);
    if (m > 14) {
      triggerInspector(`⚠️ Warning: You entered ${m}% moisture. This is too wet for storage! SLR 603 standards require <14%. Fungus will grow in 2 weeks. Dry it to 13.5% immediately!`);
    }

    if (formData.storageMethod === 'Polythene bag' && m > 13) {
      triggerInspector("🛑 Note: Poly-sacks (Polythene) trap heat. Since your moisture is above 13%, this is risky. Do you have Gunny (Jute) bags available for better aeration?");
    }
  }, [formData.moisture, formData.storageMethod]);

  // Sync map center to current GPS initially
  useEffect(() => {
    if (location.latitude && !mapCoords && storageMode === 'new') {
      setMapCoords({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [location.latitude, storageMode]);

  const triggerInspector = (text) => {
    setInspectorMsg(text);
    // Also add to chat history if not already there
    if (!inspectorChat.find(m => m.text === text)) {
      setInspectorChat(prev => [...prev, { id: Date.now(), text, isBot: true }]);
    }
  };

  const handleGradeCheck = (grade) => {
    setFormData({ ...formData, grade });
    setChatVisible(true);
    let q = "Quality Check: Hand-inspect a sample. Do you see any 'Disfigured Paddy' (smut, blackened grains, or deformed shapes)?";
    setInspectorChat(prev => [...prev, { id: Date.now(), text: q, isBot: true, isQuestion: true }]);
  };

  const handleChatResponse = (response) => {
    const userMsg = { id: Date.now(), text: response, isBot: false };
    setInspectorChat(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let reply = "";
      const lower = response.toLowerCase();
      const isDisfigured = lower.includes('yes') || lower.includes('smut') || lower.includes('disfigure');

      if (isDisfigured) {
        setFormData(prev => ({ ...prev, disfiguredChecked: 'Yes' }));
        reply = "⚠️ Stop: Disfigured paddy can ruin the entire batch! This often contains fungal smut or insect damage. I strongly recommend REMOVING these grains before storage.";

        setInspectorChat(prev => [...prev,
        { id: Date.now() + 1, text: reply, isBot: true },
        {
          id: Date.now() + 2,
          text: "Would you like to see the Expert Guide on how to remove disfigured paddy?",
          isBot: true,
          isAction: true,
          action: () => navigation.navigate('StorageExpertGuide', { showDisfigured: true })
        }
        ]);
      } else {
        setFormData(prev => ({ ...prev, disfiguredChecked: 'Cleared' }));
        reply = "Excellent. Clean, golden paddy with no disfigurement is perfect for Grade A. This will have the highest storage life.";
        setInspectorChat(prev => [...prev, { id: Date.now() + 1, text: reply, isBot: true }]);
      }
      setIsTyping(false);
    }, 1000);
  };

  const handleManualChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { id: Date.now(), text: chatInput, isBot: false };
    setInspectorChat(prev => [...prev, userMsg]);
    const currentInput = chatInput;
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
          question: currentInput,
          context: {
            variety: formData.variety,
            quantity: formData.quantityKg,
            moisture: formData.moisture,
            current_grade: formData.grade,
            storage_type: formData.storageType,
            sub_category: formData.subCategory,
            container_category: formData.containerCategory,
            storage_method: formData.storageMethod,
            interaction_type: isGradingIntent ? 'grading_consult' : 'logistics_consult'
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        const prefix = isGradingIntent ? "📊 Quality Auditor:" : "📦 Logistics Advisor:";
        setInspectorChat(prev => [...prev, { id: Date.now(), text: `${prefix} ${data.answer}`, isBot: true }]);
      } else {
        triggerInspector("I am having trouble analyzing that. Can you try rephrasing? Pro-tip: Ask about 'prices' or 'grading standards'.");
      }
    } catch (e) {
      triggerInspector("Network issue. Please check your connection to the GoviMithuru local server.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuantityChange = (val) => {
    const cleanVal = val.replace(/[^0-9.]/g, '');
    const kgs = parseFloat(cleanVal);
    let calculatedBags = '0';
    if (!isNaN(kgs) && kgs > 0) calculatedBags = (kgs / 50).toFixed(1);
    setFormData(prev => ({ ...prev, quantityKg: cleanVal, bags: calculatedBags }));
  };

  const handleExistingLocationSelect = (location) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      locationId: location.id,
      storageType: location.storageType,
      locationName: location.locationName,
      storageArea: location.storageArea?.toString() || '',
      areaUnit: location.areaUnit || 'Square Feet',
    }));
  };

  const analyzeCurrentMethod = async () => {
    setChatVisible(true);
    setLoading(true);
    try {
      const prompt = `LOGISTICS AUDIT: Analyze the SPECIFIC method "${formData.storageMethod}" in category "${formData.containerCategory}".
      Context: ${formData.quantityKg}kg of ${formData.variety} in a ${formData.storageType} facility.
      
      TASK: 
      1. Review this specific choice.
      2. Detail Pros and Cons.
      3. Show current estimated LKR unit price for this container.
      4. Give a final technical verdict.`;

      const res = await fetch(`${BASE_URL}/api/guardian/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          context: {
            variety: formData.variety,
            quantity: formData.quantityKg,
            storage_type: formData.storageType,
            sub_category: formData.subCategory,
            container_category: formData.containerCategory,
            storage_method: formData.storageMethod,
            interaction_type: 'logistics_consult'
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          { id: Date.now(), text: `🔎 Technical Audit: ${data.answer}`, isBot: true }
        ]);
      }
    } catch (e) {
      triggerInspector("Technical audit service is slow. Tip: Gunny bags (Rs. 100-120) are the budget choice but lack hermetic protection.");
    } finally {
      setLoading(false);
    }
  };
  const handleComplete = async () => {
    if (!formData.quantityKg || formData.quantityKg === '0') {
      Alert.alert("Required", "Please enter quantity in KG.");
      return;
    }

    // Capacity Limit Validation
    const qty = parseFloat(formData.quantityKg);
    const cat = formData.storageType;
    const limit = STORAGE_HIERARCHY[cat].limit;

    if (cat === 'Home' && qty >= limit) {
      Alert.alert("Capacity Overload", `Home storage is restricted to under ${limit}kg. Please select a Warehouse or Co-op.`);
      return;
    }
    if (cat === 'Warehouse' && qty > limit) {
      Alert.alert("Capacity Overload", `Warehouse capacity limit is ${limit}kg. For higher amounts, use Co-operative or Government stores.`);
      return;
    }
    if (cat === 'Co-op' && qty > limit) {
      Alert.alert("Capacity Overload", `Co-operative storage limit is ${limit}kg.`);
      return;
    }
    if (!formData.acres || isNaN(parseFloat(formData.acres))) {
      Alert.alert("Required", "Please enter land area in acres for yield validation.");
      return;
    }

    if (formData.disfiguredChecked === 'Yes') {
      Alert.alert(
        "Quality Warning",
        "You reported disfigured paddy. It is NOT recommended to store this harvest without cleaning. Do you want to view the removal guide first?",
        [
          { text: "View Guide", onPress: () => navigation.navigate('StorageExpertGuide', { showDisfigured: true }) },
          { text: "Store Anyway", style: "destructive", onPress: () => finalizePayload() }
        ]
      );
      setLoading(false);
      return;
    }

    finalizePayload();
  };

  const handleContainerCategoryChange = async (category) => {
    setFormData({
      ...formData,
      containerCategory: category,
      storageMethod: CONTAINER_HIERARCHY[category][0]
    });

    // Automatically trigger AI consultation when category is chosen
    setChatVisible(true);
    setLoading(true);
    try {
      const prompt = `LOGISTICS EXPERT CONSULTATION:
      Facility: ${formData.storageType} (${formData.subCategory})
      Variety: ${formData.variety}
      Quantity: ${formData.quantityKg}kg
      Logistics Interest: ${category} Methods

      TASK:
      1. Recomment the best method from: ${CONTAINER_HIERARCHY[category].join(', ')}.
      2. Show Pros and Cons for the recommended method.
      3. Provide estimated current market Prices in Sri Lankan Rupees (LKR).
      4. Invite the farmer to ask any follow-up questions about this setup.`;

      const res = await fetch(`${BASE_URL}/api/guardian/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          context: {
            variety: formData.variety,
            quantity: formData.quantityKg,
            storage_type: formData.storageType,
            sub_category: formData.subCategory,
            container_category: category,
            interaction_type: 'logistics_consult'
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          { id: Date.now(), text: `📦 Logistics Advisor:\n\n${data.answer}`, isBot: true }
        ]);
      }
    } catch (e) {
      triggerInspector("Logistics advisor is currently busy. General Tip: Use Hermetic bags (Rs. 250) for best moisture protection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGradingConsult = async () => {
    setChatVisible(true);
    setLoading(true);
    try {
      const prompt = `QUALITY AUDIT: I want to determine the correct Grade for my ${formData.variety} (${formData.quantityKg}kg). 
      Can you guide me through the SLR 603:2013 standards? 
      My current moisture is ${formData.moisture || 'Not tested'}.
      I select Grade ${formData.grade} but I want to know if I can improve to Grade A.
      Please explain the systematic grading (Moisture, Broken, Discolored, Foreign).`;

      const res = await fetch(`${BASE_URL}/api/guardian/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          context: {
            variety: formData.variety,
            quantity: formData.quantityKg,
            moisture: formData.moisture,
            current_grade: formData.grade,
            interaction_type: 'grading_consult'
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          { id: Date.now(), text: `📊 Quality Auditor: ${data.answer}`, isBot: true }
        ]);
      }
    } catch (e) {
      triggerInspector("Grading auditor is offline. Pro-tip: For Grade A, moisture must be below 14% and broken grains below 5%.");
    } finally {
      setLoading(false);
    }
  };
  const finalizePayload = async () => {
    setLoading(true);
    try {
      // GoviMithuru Inspector: Validation Check
      const inspectRes = await fetch(`${BASE_URL}/api/guardian/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variety: formData.variety,
          quantity_kg: parseFloat(formData.quantityKg),
          acres: parseFloat(formData.acres),
          moisture: parseFloat(formData.moisture) || 0,
          grade: formData.grade
        })
      });
      const inspectData = await inspectRes.json();

      if (!inspectData.is_valid) {
        setLoading(false);
        triggerInspector(`🚩 Inspector Alert: ${inspectData.warning_message}\n\n${inspectData.suggested_correction}`);
        setChatVisible(true);
        return; // Stop saving until farmer acknowledges/fixes
      }

      let locationId = formData.locationId;
      if (storageMode === 'new' && !locationId) {
        const docRef = await db.collection('storageLocations').add({
          userId: auth.currentUser.uid,
          storageType: formData.storageType,
          locationName: formData.locationName,
          storageArea: parseFloat(formData.storageArea) || 0,
          areaUnit: formData.areaUnit,
          latitude: mapCoords?.latitude || location.latitude,
          longitude: mapCoords?.longitude || location.longitude,
          createdAt: new Date(),
        });
        locationId = docRef.id;
      }

      const payload = {
        ...formData,
        locationId,
        userId: auth.currentUser?.uid,
        quantityKg: parseFloat(formData.quantityKg) || 0,
        bags: parseFloat(formData.bags) || 0,
        prodCost: parseFloat(formData.prodCost) || 0,
        storageArea: parseFloat(formData.storageArea) || 0,
        updatedAt: new Date(),
      };

      if (docId) {
        await db.collection('harvests').doc(docId).update(payload);
        Alert.alert("Done", "Stock record updated.");
      } else {
        await db.collection('harvests').add({ ...payload, createdAt: new Date() });
        Alert.alert("Success", "Harvest registered and secured.");
      }
      navigation.goBack();
    } catch (e) { Alert.alert("Error", e.message); }
    finally { setLoading(false); }
  };

  const renderStepHeader = (title, icon) => (
    <View style={styles.stepHeader}>
      <View style={styles.stepIconBox}>
        <MaterialCommunityIcons name={icon} size={24} color="#34d399" />
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.mainTitle}>{docId ? "Modify Batch" : "Secure Harvest"}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 4) * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {step === 0 && (
            <View style={styles.stepContent}>
              {renderStepHeader("Deployment Context", "map-marker-path")}
              <Text style={styles.label}>Where is this harvest stored?</Text>

              <TouchableOpacity
                style={[styles.modeBtn, storageMode === 'existing' && styles.modeBtnActive]}
                onPress={() => setStorageMode('existing')}
              >
                <MaterialCommunityIcons name="layers-outline" size={32} color={storageMode === 'existing' ? '#34d399' : '#64748b'} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.modeTitle, storageMode === 'existing' && { color: '#34d399' }]}>Existing Location</Text>
                  <Text style={styles.modeSub}>Add to a previously registered warehouse</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, storageMode === 'new' && styles.modeBtnActive]}
                onPress={() => setStorageMode('new')}
              >
                <MaterialCommunityIcons name="plus-box-outline" size={32} color={storageMode === 'new' ? '#34d399' : '#64748b'} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.modeTitle, storageMode === 'new' && { color: '#34d399' }]}>New Location</Text>
                  <Text style={styles.modeSub}>Register a new storage facility</Text>
                </View>
              </TouchableOpacity>

              {storageMode === 'existing' && (
                <View style={styles.locList}>
                  {existingLocations.map(loc => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[styles.locItem, selectedLocation?.id === loc.id && styles.locItemActive]}
                      onPress={() => handleExistingLocationSelect(loc)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.locName}>{loc.locationName}</Text>
                        <Text style={styles.locSub}>{loc.storageType} • {loc.storageArea} {loc.areaUnit}</Text>
                      </View>
                      {selectedLocation?.id === loc.id && <MaterialCommunityIcons name="check-circle" size={20} color="#34d399" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              {renderStepHeader("Facility Details", "warehouse")}
              <Text style={styles.label}>Storage Class</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.storageType}
                  onValueChange={(v) => setFormData({
                    ...formData,
                    storageType: v,
                    subCategory: STORAGE_HIERARCHY[v].sub[0]
                  })}
                  style={{ color: '#fff' }} dropdownIconColor="#34d399"
                >
                  {STORAGE_TYPES.map(t => <Picker.Item key={t} label={t} value={t} color={Platform.OS === 'ios' ? '#fff' : '#000'} />)}
                </Picker>
              </View>

              <Text style={styles.label}>Facility Sub-Category</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.subCategory}
                  onValueChange={(v) => setFormData({ ...formData, subCategory: v })}
                  style={{ color: '#fff' }} dropdownIconColor="#34d399"
                >
                  {(STORAGE_HIERARCHY[formData.storageType]?.sub || []).map(s => (
                    <Picker.Item key={s} label={s} value={s} color={Platform.OS === 'ios' ? '#fff' : '#000'} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Identification Name</Text>
              <TextInput
                style={styles.input} placeholder="e.g. Backyard Silo 2"
                placeholderTextColor="#475569" value={formData.locationName}
                onChangeText={(v) => setFormData({ ...formData, locationName: v })}
              />

              <Text style={[styles.label, { marginTop: 10 }]}>Pin Storage Location on Map</Text>
              <View style={styles.mapContainer}>
                <WebView
                  scrollEnabled={false}
                  source={{ html: MAP_HTML(location.latitude, location.longitude) }}
                  onMessage={(event) => {
                    const coords = JSON.parse(event.nativeEvent.data);
                    setMapCoords(coords);
                  }}
                  style={styles.map}
                />
                <View style={styles.mapOverlay}>
                  <Text style={styles.mapHint}>Tap on the map to pin warehouse location</Text>
                </View>
              </View>

              <Text style={styles.label}>Area Dimension (Optional)</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 10 }]}
                  keyboardType="numeric" placeholder="Value"
                  value={formData.storageArea} onChangeText={(v) => setFormData({ ...formData, storageArea: v })}
                />
                <View style={[styles.pickerWrapper, { flex: 1, height: 52 }]}>
                  <Picker
                    selectedValue={formData.areaUnit}
                    onValueChange={(v) => setFormData({ ...formData, areaUnit: v })}
                    style={{ color: '#fff' }} dropdownIconColor="#34d399"
                  >
                    {MEASUREMENT_UNITS.map(u => <Picker.Item key={u} label={u} value={u} color={Platform.OS === 'ios' ? '#fff' : '#000'} />)}
                  </Picker>
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              {renderStepHeader("Harvest Profile", "paddy")}
              <Text style={styles.label}>Rice Variety (Vee Variety)</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.variety}
                  onValueChange={(v) => setFormData({ ...formData, variety: v })}
                  style={{ color: '#fff' }} dropdownIconColor="#34d399"
                >
                  {RICE_VARIETIES.map(v => <Picker.Item key={v} label={v} value={v} color={Platform.OS === 'ios' ? '#fff' : '#000'} />)}
                </Picker>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1.2, marginRight: 10 }}>
                  <Text style={styles.label}>Total Quantity (KG)</Text>
                  <TextInput
                    style={styles.input} keyboardType="numeric"
                    placeholder="0.0" value={formData.quantityKg}
                    onChangeText={handleQuantityChange}
                  />
                  <View style={styles.limitInfo}>
                    <MaterialCommunityIcons name="information" size={12} color="#94a3b8" />
                    <Text style={styles.limitText}>
                      Max Capacity: {STORAGE_HIERARCHY[formData.storageType].limit >= 999999 ? 'Unlimited' : `${STORAGE_HIERARCHY[formData.storageType].limit} kg`}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Est. Bags (50kg)</Text>
                  <View style={styles.readOnlyInput}><Text style={styles.readOnlyText}>{formData.bags}</Text></View>
                </View>
              </View>

              <Text style={styles.label}>Harvested Land Area (Acres)</Text>
              <TextInput
                style={styles.input} keyboardType="numeric"
                placeholder="e.g. 2.5" value={formData.acres}
                onChangeText={(v) => setFormData({ ...formData, acres: v })}
              />

              <Text style={styles.label}>Quality Grading</Text>
              <View style={styles.btnRow}>
                {['A', 'B', 'C'].map(g => (
                  <TouchableOpacity
                    key={g} style={[styles.pill, formData.grade === g && styles.pillActive]}
                    onPress={() => handleGradeCheck(g)}
                  >
                    <Text style={[styles.pillText, formData.grade === g && styles.pillTextActive]}>Grade {g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={handleGradingConsult} style={styles.inspectorMiniBtn}>
                <MaterialCommunityIcons name="account-search-outline" size={16} color="#34d399" />
                <Text style={styles.inspectorMiniText}>Ask Inspector about Grading</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              {renderStepHeader("Storage Integrity", "shield-check-outline")}
              <Text style={styles.label}>Moisture Analysis (%)</Text>
              <TextInput
                style={styles.input} keyboardType="numeric" placeholder="Target 13.5%"
                value={formData.moisture} onChangeText={(v) => setFormData({ ...formData, moisture: v })}
              />

              <Text style={styles.label}>Ventilation State</Text>
              <View style={styles.btnRow}>
                {['Good', 'Average', 'Poor'].map(v => (
                  <TouchableOpacity
                    key={v} style={[styles.pill, formData.ventilation === v && styles.pillActive]}
                    onPress={() => setFormData({ ...formData, ventilation: v })}
                  >
                    <Text style={[styles.pillText, formData.ventilation === v && styles.pillTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Logistics Category</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.containerCategory}
                  onValueChange={handleContainerCategoryChange}
                  style={{ color: '#fff' }} dropdownIconColor="#34d399"
                >
                  {Object.keys(CONTAINER_HIERARCHY).map(c => <Picker.Item key={c} label={c} value={c} color={Platform.OS === 'ios' ? '#fff' : '#000'} />)}
                </Picker>
              </View>

              <Text style={styles.label}>Storage Container Method (AI Recommended)</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.storageMethod}
                  onValueChange={(v) => setFormData({ ...formData, storageMethod: v })}
                  style={{ color: '#fff' }} dropdownIconColor="#34d399"
                >
                  {CONTAINER_HIERARCHY[formData.containerCategory].map(m => (
                    <Picker.Item key={m} label={m} value={m} color={Platform.OS === 'ios' ? '#fff' : '#000'} />
                  ))}
                </Picker>
              </View>

              <TouchableOpacity onPress={analyzeCurrentMethod} style={styles.inspectorMiniBtn}>
                <MaterialCommunityIcons name="brain" size={16} color="#34d399" />
                <Text style={styles.inspectorMiniText}>Analyze with AI</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Production Cost (LKR/KG)</Text>
              <TextInput
                style={styles.input} keyboardType="numeric" placeholder="Cost to produce"
                value={formData.prodCost} onChangeText={(v) => setFormData({ ...formData, prodCost: v })}
              />
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.fBack} onPress={() => setStep(step - 1)}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
              <Text style={styles.fBackText}>BACK</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.fNext, step === 0 && { flex: 1 }]}
            onPress={step === 3 ? handleComplete : () => setStep(step + 1)}
            disabled={loading}
          >
            <LinearGradient colors={['#059669', '#16a34a']} style={styles.fNextGrad}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <><Text style={styles.fNextText}>{step === 3 ? "FINALIZE LOG" : "CONTINUE"}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" /></>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* AR Camera Modal Placeholder */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.camRoot}>
          <CameraView style={{ flex: 1 }} facing="back">
            <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.camClose}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>CANCEL</Text>
            </TouchableOpacity>
          </CameraView>
        </View>
      </Modal>

      {/* Inspector Floating Alert */}
      {
        inspectorMsg && !chatVisible && (
          <TouchableOpacity style={styles.floatingInspector} onPress={() => setChatVisible(true)}>
            <LinearGradient colors={['#dc2626', '#991b1b']} style={styles.inspectorAlertGrad}>
              <MaterialCommunityIcons name="alert-decagram" size={24} color="#fff" />
              <Text style={styles.inspectorAlertText} numberOfLines={2}>{inspectorMsg}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )
      }

      {/* Inspector Chat Modal */}
      <Modal visible={chatVisible} animationType="slide" transparent>
        <View style={styles.chatOverlay}>
          <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
              <View style={styles.inspectorAvatar}>
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1904/1904425.png' }} style={styles.avatarImg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatTitle}>Department Inspector</Text>
                <Text style={styles.chatSub}>Quality Assurance (SLR 603)</Text>
              </View>
              <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.closeChat}>
                <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.chatBody} contentContainerStyle={{ paddingBottom: 20 }}>
              {inspectorChat.map(m => (
                <View key={m.id} style={[styles.msgContainer, m.isBot ? styles.msgBot : styles.msgUser]}>
                  <Text style={[styles.msgText, m.isBot ? styles.msgTextBot : styles.msgTextUser]}>{m.text}</Text>
                  {m.isAction && (
                    <TouchableOpacity style={styles.chatActionBtn} onPress={m.action}>
                      <MaterialCommunityIcons name="book-open-variant" size={16} color="#fff" />
                      <Text style={styles.chatActionText}>Open Removal Guide</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {isTyping && <ActivityIndicator color="#34d399" style={{ alignSelf: 'flex-start', marginLeft: 20 }} />}
            </ScrollView>

            <View style={styles.chatFooter}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.chatTextInput}
                  placeholder="Ask Inspector about storage..."
                  placeholderTextColor="#64748b"
                  value={chatInput}
                  onChangeText={setChatInput}
                />
                <TouchableOpacity onPress={handleManualChat} style={styles.sendBtn}>
                  <MaterialCommunityIcons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.responseRow}>
                <TouchableOpacity style={styles.optBtn} onPress={() => handleChatResponse("Yes, it is clean")}>
                  <Text style={styles.optBtnText}>Clean & Uniform</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optBtn} onPress={() => handleChatResponse("Yes, seen many empty grains")}>
                  <Text style={styles.optBtnText}>Has Bol / Spots</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  limitInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  limitText: { color: '#64748b', fontSize: 10, fontWeight: '700', fontStyle: 'italic' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  mainTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  progressTrack: { height: 4, backgroundColor: '#1e293b', borderRadius: 2, marginTop: 16 },
  progressFill: { height: '100%', backgroundColor: '#34d399', borderRadius: 2 },

  scroll: { padding: 20 },
  stepContent: { marginBottom: 30 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 },
  stepIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#064e3b30', justifyContent: 'center', alignItems: 'center' },
  stepTitle: { color: '#34d399', fontSize: 18, fontWeight: '800' },

  label: { color: '#94a3b8', fontSize: 12, fontWeight: '800', marginBottom: 10, marginTop: 16, textTransform: 'uppercase' },
  modeBtn: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 20, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  modeBtnActive: { borderColor: '#34d399', backgroundColor: '#064e3b15' },
  modeTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  modeSub: { color: '#64748b', fontSize: 11, marginTop: 2 },

  locList: { marginTop: 10, gap: 8 },
  locItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  locItemActive: { borderColor: '#34d399', backgroundColor: '#34d39910' },
  locName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  locSub: { color: '#475569', fontSize: 11 },

  input: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  pickerWrapper: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  row: { flexDirection: 'row' },

  readOnlyInput: { flex: 1, backgroundColor: '#0f172a', borderRadius: 16, padding: 16, justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  readOnlyText: { color: '#64748b', fontSize: 16, fontWeight: '800' },

  btnRow: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  pillActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  pillText: { color: '#64748b', fontSize: 13, fontWeight: '800' },
  pillTextActive: { color: '#064e3b' },

  footer: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  fBack: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8 },
  fBackText: { color: '#64748b', fontWeight: '800', fontSize: 13 },
  fNext: { flex: 1.5, borderRadius: 16, overflow: 'hidden' },
  fNextGrad: { flexDirection: 'row', height: 56, alignItems: 'center', justifyContent: 'center', gap: 8 },
  fNextText: { color: '#fff', fontWeight: '900', fontSize: 15 },

  // Inspector Styles
  floatingInspector: { position: 'absolute', bottom: 100, left: 15, right: 15, borderRadius: 18, overflow: 'hidden', elevation: 12 },
  inspectorAlertGrad: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 12 },
  inspectorAlertText: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '700' },

  inspectorMiniBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-end' },
  inspectorMiniText: { color: '#34d399', fontSize: 11, fontWeight: '700' },

  chatOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  chatContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '70%', padding: 20 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 15, marginBottom: 15 },
  inspectorAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1e293b', padding: 5 },
  avatarImg: { width: '100%', height: '100%' },
  chatTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  chatSub: { color: '#34d399', fontSize: 11, fontWeight: '700' },
  closeChat: { padding: 5 },
  chatBody: { flex: 1 },
  msgContainer: { maxWidth: '85%', padding: 15, borderRadius: 20, marginBottom: 12 },
  msgBot: { alignSelf: 'flex-start', backgroundColor: '#1e293b', borderTopLeftRadius: 4 },
  msgUser: { alignSelf: 'flex-end', backgroundColor: '#34d399', borderTopRightRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextBot: { color: '#cbd5e1' },
  msgTextUser: { color: '#064e3b', fontWeight: '700' },
  chatActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', padding: 8, borderRadius: 8, marginTop: 10, gap: 6 },
  chatActionText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  chatFooter: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 15 },
  responseRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  optBtn: { backgroundColor: '#064e3b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#34d39944' },
  optBtnText: { color: '#34d399', fontSize: 12, fontWeight: '800' },

  camRoot: { flex: 1, backgroundColor: '#000' },
  camClose: { position: 'absolute', bottom: 40, alignSelf: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16 },

  mapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 6,
    borderRadius: 8,
  },
  mapHint: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, paddingHorizontal: 15, marginBottom: 15, height: 50, marginTop: 10 },
  chatTextInput: { flex: 1, color: '#fff', fontSize: 14 },
  sendBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#34d399', justifyContent: 'center', alignItems: 'center' },
});