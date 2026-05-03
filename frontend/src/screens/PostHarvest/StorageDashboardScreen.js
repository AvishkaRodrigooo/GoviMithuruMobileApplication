/**
 * StorageDashboardScreen.js
 * AgroMind — Post-Harvest Storage Management Dashboard
 * v4.0 — Premium UI Redesign. Farmer-friendly, vivid, production-ready.
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';
import { BASE_URL } from '../../utils/apiConfig';
import useUniversalLocation from '../../utils/useUniversalLocation';

const { width } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  green: '#16a34a',
  greenLight: '#dcfce7',
  greenMid: '#22c55e',
  greenDark: '#064e3b',
  amber: '#d97706',
  amberLight: '#fef3c7',
  amberMid: '#f59e0b',
  red: '#dc2626',
  redLight: '#fee2e2',
  redMid: '#ef4444',
  blue: '#2563eb',
  blueLight: '#dbeafe',
  purple: '#7c3aed',
  purpleLight: '#ede9fe',
  teal: '#0d9488',
  tealLight: '#ccfbf1',
  orange: '#ea580c',
  orangeLight: '#ffedd5',
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

// ─── Sri Lanka Districts ──────────────────────────────────────────────────────
const SL_DISTRICTS = [
  { label: 'Colombo', value: 'colombo', lat: 6.93, lon: 79.85, avgTemp: 29 },
  { label: 'Gampaha', value: 'gampaha', lat: 7.09, lon: 80.01, avgTemp: 29 },
  { label: 'Kalutara', value: 'kalutara', lat: 6.58, lon: 80.0, avgTemp: 28 },
  { label: 'Kandy', value: 'kandy', lat: 7.29, lon: 80.63, avgTemp: 24 },
  { label: 'Matale', value: 'matale', lat: 7.47, lon: 80.62, avgTemp: 26 },
  { label: 'Nuwara Eliya', value: 'nuwaraeliya', lat: 6.97, lon: 80.78, avgTemp: 16 },
  { label: 'Galle', value: 'galle', lat: 6.05, lon: 80.22, avgTemp: 28 },
  { label: 'Matara', value: 'matara', lat: 5.95, lon: 80.54, avgTemp: 28 },
  { label: 'Hambantota', value: 'hambantota', lat: 6.12, lon: 81.12, avgTemp: 30 },
  { label: 'Jaffna', value: 'jaffna', lat: 9.67, lon: 80.01, avgTemp: 32 },
  { label: 'Kilinochchi', value: 'kilinochchi', lat: 9.38, lon: 80.4, avgTemp: 31 },
  { label: 'Mannar', value: 'mannar', lat: 8.98, lon: 79.9, avgTemp: 31 },
  { label: 'Vavuniya', value: 'vavuniya', lat: 8.75, lon: 80.5, avgTemp: 30 },
  { label: 'Mullativu', value: 'mullativu', lat: 9.27, lon: 80.81, avgTemp: 30 },
  { label: 'Batticaloa', value: 'batticaloa', lat: 7.72, lon: 81.7, avgTemp: 29 },
  { label: 'Ampara', value: 'ampara', lat: 7.3, lon: 81.67, avgTemp: 29 },
  { label: 'Trincomalee', value: 'trincomalee', lat: 8.57, lon: 81.23, avgTemp: 30 },
  { label: 'Kurunegala', value: 'kurunegala', lat: 7.48, lon: 80.36, avgTemp: 28 },
  { label: 'Puttalam', value: 'puttalam', lat: 8.03, lon: 79.83, avgTemp: 30 },
  { label: 'Anuradhapura', value: 'anuradhapura', lat: 8.31, lon: 80.41, avgTemp: 30 },
  { label: 'Polonnaruwa', value: 'polonnaruwa', lat: 7.94, lon: 81.0, avgTemp: 30 },
  { label: 'Badulla', value: 'badulla', lat: 6.99, lon: 81.05, avgTemp: 22 },
  { label: 'Monaragala', value: 'monaragala', lat: 6.87, lon: 81.35, avgTemp: 27 },
  { label: 'Ratnapura', value: 'ratnapura', lat: 6.68, lon: 80.4, avgTemp: 26 },
  { label: 'Kegalle', value: 'kegalle', lat: 7.25, lon: 80.35, avgTemp: 26 },
];

// ─── Rice Varieties ───────────────────────────────────────────────────────────
const RICE_VARIETIES = [
  'Bg 352', 'Bg 300', 'Bg 94-1', 'Bg 358', 'Bg 366', 'Bg 379-2',
  'Bg 406', 'At 308', 'At 362', 'Ld 356', 'Bw 272-6B', 'Bw 364',
  'Pakwenna', 'Sudu Heenati', 'Rathu Heenati', 'Samba', 'Nadu',
  'Keeri Samba', 'Red Raw Rice', 'White Raw Rice',
];

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    lang: 'English',
    storageCenter: 'Storage Center',
    postHarvest: 'Post-Harvest Management',
    totalPaddyValue: 'TOTAL PADDY VALUE',
    kgStored: 'KG STORED',
    totalBags: 'TOTAL BAGS',
    batches: 'BATCHES',
    addStock: 'Add Stock',
    market: 'Market',
    aiChat: 'AI Chat',
    inventory: 'Inventory',
    riskScore: 'Risk Score',
    economics: 'Economics',
    recommend: 'Recommend',
    riskTitle: 'Storage Risk Score',
    riskSub: 'Based on SLR 603:2013 standards',
    moistureContent: 'Moisture Content (%)',
    moistureHint: 'Use a moisture meter or salt-bottle test',
    safe: 'SAFE',
    limit: 'LIMIT',
    danger: 'DANGER',
    orEnterExact: 'Or enter exact value:',
    storageBagType: 'Storage Bag Type',
    howLongStore: 'How long to store?',
    qty: 'Total Quantity (kg)',
    storageLoc: 'Storage Location',
    district: 'District (Sri Lanka)',
    pestHistory: 'Seen rats or weevils (ghun) before?',
    noPest: 'No — Safe location',
    yesPest: 'Yes — Pest history',
    computeRisk: 'Compute Risk Score',
    analysing: 'Analysing with AI...',
    ecoTitle: 'Storage Economics',
    ecoSub: 'Is storing worth it? Real LKR analysis',
    riceVariety: 'Rice Variety',
    duration: 'Duration',
    productionCost: 'Production Cost (Rs./kg)',
    sellingPrice: 'Selling Price (Rs./kg)',
    productionCostHint: '💡 Your total cost to grow 1 kg — seeds, fertilizer, labour, etc.',
    sellingPriceHint: '💡 Market price you expect to sell at after storage.',
    calcEco: 'Calculate Economics',
    calculating: 'Calculating...',
    dailyMaintCost: 'Daily Maintenance Cost (Rs./day)',
    dailyMaintHint: 'Enter your actual daily upkeep — electricity, labor, cleaning, etc. Leave blank to skip.',
    maintTotal: 'Maintenance Total',
    recTitle: 'Best Bag Recommendation',
    recSub: 'AI picks the ideal storage for your situation',
    moisture: 'Moisture (%)',
    estTemp: 'Est. Temperature (°C)',
    getAIRec: 'Get AI Recommendation',
    aiThinking: 'AI Thinking...',
    activeBatches: 'Active Storage Batches',
    addNew: '+ Add New',
    noBatches: 'No storage batches yet',
    registerFirst: 'Register your first harvest to start tracking',
    registerHarvest: 'Register Harvest',
    month1: '1 Month', month2: '2 Months', month3: '3 Months',
    month6: '6 Months', month6plus: '6+ Months', month9: '9 Months', month12: '12 Months',
    riskFactors: 'Risk Factors Detected:',
    urgentAction: '🚨 URGENT ACTION',
    ifIgnored: '💰 IF IGNORED',
    farmerTip: '💡 FARMER TIP',
    safeStorage: 'Safe storage:',
    days: 'days',
    months: 'months',
    estLoss: 'Estimated Weight Loss if Unaddressed',
    profitable: 'PROFITABLE',
    marginal: 'MARGINAL',
    lossAlert: 'LOSS ALERT',
    costBreakdown: 'Cost Breakdown',
    bagsRequired: 'bags required',
    storageBags: 'Storage Bags',
    rent: 'Warehouse Rent',
    fumigation: 'Fumigation (×2)',
    labour: 'Labour (Pack/Move)',
    insurance: 'Insurance',
    totalCost: 'TOTAL STORAGE COST',
    costPerKg: 'Cost per kg',
    sellToday: 'PRODUCTION COST',
    sellPeak: 'REVENUE',
    totalProdCost: 'PRODUCTION COST',
    totalRevenue: 'REVENUE',
    netProfit: 'NET PROFIT',
    breakEven: 'Break-even',
    aiEconAdvice: '📊 AI ECONOMIC ADVICE',
    bestChoice: 'BEST CHOICE FOR YOU',
    allOptions: 'All Options Compared:',
    notEnoughDays: 'NOT ENOUGH DAYS',
    recommended: 'RECOMMENDED',
    totalCostLabel: 'total cost',
    prepSteps: 'Preparation Steps:',
    whereToBuy: '🏪 WHERE TO BUY IN SRI LANKA',
    recalcPlanner: 'Re-calculate in Input Planner',
    productionCostTab: 'Production Cost',
    seedCalcTitle: 'Simple Seed Cost Calculator',
    seedCalcSub: 'Farmer-friendly 9-step calculation',
    farmDetails: 'Farm Details',
    varietyLabel: 'Variety',
    acresLabel: 'Acres',
    yieldLabel: 'Yield (kg)',
    priceLabel: 'Price (Rs/kg)',
    costSectionsLabel: 'Simple Cost Sections (Rs.)',
    lPrepLabel: '1. Land Prep & Tractor',
    sNursLabel: '2. Seeds & Nursery',
    fertLabel: '3. Fertilizer',
    chemLabel: '4. Pesticides & Weedicides',
    laborLabel: '5. Hired Labor',
    harvLabel: '6. Harvesting Machinery',
    postHLabel: '7. Drying, Bags & Processing',
    transpLabel: '8. Transport & Market',
    otherLabel: '9. Other Expenses (Water, Loans)',
    calcProfitBtn: 'Calculate My Profit',
    getFarmerAiBtn: 'Get AI Farmer Advice',
    costPerAcre: 'Cost per Acre',
    breakEvenPrice: 'Break-even Price',
    totalRevLabel: 'Total Revenue',
    marginLabel: 'Margin',
    aiRecommendations: 'AI Recommendations',
  },
  si: {
    lang: 'සිංහල',
    storageCenter: 'ගබඩා මධ්‍යස්ථානය',
    postHarvest: 'අස්වනු කළමනාකරණය',
    totalPaddyValue: 'මුළු වී වටිනාකම',
    kgStored: 'kg ගබඩා කළා',
    totalBags: 'මළු ගණන',
    batches: 'කණ්ඩායම්',
    addStock: 'යොදා ගන්න',
    market: 'වෙළෙඳපොළ',
    aiChat: 'AI කතා',
    inventory: 'ලැයිස්තුව',
    riskScore: 'අවදානම් ලකුණු',
    economics: 'ආර්ථිකය',
    recommend: 'නිර්දේශය',
    riskTitle: 'ගබඩා අවදානම් ලකුණු',
    riskSub: 'SLR 603:2013 ප්‍රමිතීන් අනුව',
    moistureContent: 'තෙතමනය (%)',
    moistureHint: 'නමවියන් මීටරයකින් හෝ ලුණු-බෝතල් පරීක්ෂාව',
    safe: 'ආරක්ෂිතයි', limit: 'සීමාව', danger: 'අන්තරාය',
    orEnterExact: 'හෝ exact අගය ඇතුළත් කරන්න:',
    storageBagType: 'ගබඩා මළු වර්ගය',
    howLongStore: 'කොපමණ කාලයක් ගබඩා කරනවාද?',
    qty: 'මුළු ප්‍රමාණය (kg)',
    storageLoc: 'ගබඩා ස්ථානය',
    district: 'දිස්ත්‍රික්කය',
    pestHistory: 'මීකෝ හෝ රෙදි කන පළිඟු දුටුවාද?',
    noPest: 'නැහැ — ආරක්ෂිතයි',
    yesPest: 'ඔව් — පළිඟු ඉතිහාසයක් ඇත',
    computeRisk: 'අවදානම ගණනය කරන්න',
    analysing: 'AI සත්‍ය කරමින්...',
    ecoTitle: 'ගබඩා ආර්ථිකය',
    ecoSub: 'ගබඩා කිරීම වටිනවාද?',
    riceVariety: 'වී වර්ගය', duration: 'කාලය',
    productionCost: 'නිෂ්පාදන පිරිවැය (රු/kg)',
    sellingPrice: 'විකුණුම් මිල (රු/kg)',
    productionCostHint: '💡 kg 1 ක් වගා කිරීමේ මුළු වියදම',
    sellingPriceHint: '💡 ගබඩාවෙන් පසු ඔබ බලාපොරොත්තු වන වෙළෙඳ මිල',
    calcEco: 'ආර්ථිකය ගණනය කරන්න',
    calculating: 'ගණනය කරමින්...',
    dailyMaintCost: 'දෛනික නඩත්තු පිරිවැය (රු/දිනකට)',
    dailyMaintHint: 'විදුලිය, ශ්‍රමය, පිරිසිදු කිරීම ඇතුළු ඔබේ දෛනික වියදම ඇතුළත් කරන්න.',
    maintTotal: 'නඩත්තු මුළු',
    recTitle: 'හොඳම මළු නිර්දේශය',
    recSub: 'AI ඔබේ තත්වයට හොඳම ගබඩාව තෝරයි',
    moisture: 'තෙතමනය (%)', estTemp: 'තාප (°C)',
    getAIRec: 'AI නිර්දේශය ලබාගන්න',
    aiThinking: 'AI සිතමින්...',
    activeBatches: 'සක්‍රිය ගබඩා කණ්ඩායම්',
    addNew: '+ නව එකතු කරන්න',
    noBatches: 'ගබඩා කණ්ඩායම් නැත',
    registerFirst: 'ඔබේ පළමු අස්වැන්න ලියාපදිංචි කරන්න',
    registerHarvest: 'අස්වැන්න ලියාපදිංචි කරන්න',
    month1: '1 මාසය', month2: '2 මාස', month3: '3 මාස',
    month6: '6 මාස', month6plus: '6+ මාස', month9: '9 මාස', month12: '12 මාස',
    riskFactors: 'අවදානම් ලක්ෂණ:',
    urgentAction: '🚨 හදිසි පියවර', ifIgnored: '💰 නොසලකා හැරියහොත්',
    farmerTip: '💡 ගොවි උපදෙස්', safeStorage: 'ආරක්ෂිත කාලය:',
    days: 'දින', months: 'මාස',
    estLoss: 'විය හැකි බර අඩුවීම',
    profitable: 'ලාභදායී', marginal: 'සාමාන්‍යයි', lossAlert: 'පාඩුයි',
    costBreakdown: 'වියදම් විස්තරය', bagsRequired: 'මළු අවශ්‍යයි',
    storageBags: 'ගබඩා මළු', rent: 'ගබඩා කුලිය',
    fumigation: 'කෘමිනාශක (×2)', labour: 'ශ්‍රමය',
    insurance: 'රක්ෂණය', totalCost: 'මුළු ගබඩා වියදම',
    costPerKg: 'කිලෝවකට වියදම',
    sellToday: 'නිෂ්පාදන වියදම', sellPeak: 'ආදායම',
    totalProdCost: 'නිෂ්පාදන වියදම', totalRevenue: 'ආදායම',
    netProfit: 'ශුද්ධ ලාභය', breakEven: 'ලාභ-අලාභ සම ලක්ෂ්‍යය',
    aiEconAdvice: '📊 AI ආර්ථික උපදෙස්',
    bestChoice: 'ඔබට හොඳම විකල්පය',
    allOptions: 'සියලුම විකල්ප:', notEnoughDays: 'දින ප්‍රමාණවත් නැත',
    recommended: 'නිර්දේශිතයි', totalCostLabel: 'මුළු වියදම',
    prepSteps: 'පෙර සූදානම් පියවර:',
    whereToBuy: '🏪 මිලදී ගත හැකි ස්ථාන',
    recalcPlanner: 'යෙදවුම් සැලසුම්කරු',
    productionCostTab: 'නිෂ්පාදන වියදම',
    seedCalcTitle: 'වී වගා වියදම් ගණනය',
    seedCalcSub: 'ගොවීන්ට පහසු පියවර 9ක්',
    farmDetails: 'වගා විස්තර',
    varietyLabel: 'වී වර්ගය',
    acresLabel: 'අක්කර ගණන',
    yieldLabel: 'අස්වැන්න (kg)',
    priceLabel: 'මිල (රු/kg)',
    costSectionsLabel: 'වියදම් වර්ග (රු.)',
    lPrepLabel: '1. බිම් සකස් කිරීම හා ට්‍රැක්ටර්',
    sNursLabel: '2. බීජ හා තවාන්',
    fertLabel: '3. පොහොර',
    chemLabel: '4. කෘමිනාශක හා වල්නාශක',
    laborLabel: '5. කුලී ශ්‍රමය',
    harvLabel: '6. අස්වනු නෙළීම හා යන්ත්‍ර',
    postHLabel: '7. වේලීම, මළු හා සකස් කිරීම',
    transpLabel: '8. ප්‍රවාහනය හා වෙළෙඳපොළ',
    otherLabel: '9. වෙනත් (ජලය, ණය)',
    calcProfitBtn: 'මගේ ලාභය ගණනය කරන්න',
    getFarmerAiBtn: 'AI ගොවි උපදෙස් ලබාගන්න',
    costPerAcre: 'අක්කරයකට වියදම',
    breakEvenPrice: 'ලාභ-අලාභ සම මිල',
    totalRevLabel: 'මුළු ආදායම',
    marginLabel: 'ලාභාංශය',
    aiRecommendations: 'AI නිර්දේශ',
  },
  ta: {
    lang: 'தமிழ்',
    storageCenter: 'சேமிப்பு மையம்',
    postHarvest: 'அறுவடை மேலாண்மை',
    totalPaddyValue: 'மொத்த நெல் மதிப்பு',
    kgStored: 'kg சேமிக்கப்பட்டது',
    totalBags: 'மொத்த மூட்டைகள்',
    batches: 'தொகுதிகள்',
    addStock: 'சேர்', market: 'சந்தை', aiChat: 'AI உரை', inventory: 'பட்டியல்',
    riskScore: 'அபாய மதிப்பெண்', economics: 'பொருளாதாரம்', recommend: 'பரிந்துரை',
    riskTitle: 'சேமிப்பு அபாய மதிப்பெண்', riskSub: 'SLR 603:2013 தரநிலைகள்',
    moistureContent: 'ஈரப்பதம் (%)', moistureHint: 'ஈரப்பத மீட்டர் சோதனை',
    safe: 'பாதுகாப்பு', limit: 'வரம்பு', danger: 'ஆபத்து',
    orEnterExact: 'சரியான மதிப்பை உள்ளிடவும்:',
    storageBagType: 'சேமிப்பு மூட்டை வகை',
    howLongStore: 'எவ்வளவு காலம்?',
    qty: 'மொத்த அளவு (kg)', storageLoc: 'சேமிப்பு இடம்', district: 'மாவட்டம்',
    pestHistory: 'எலி அல்லது பூச்சி பார்த்தீர்களா?',
    noPest: 'இல்லை — பாதுகாப்பான', yesPest: 'ஆம் — பூச்சி வரலாறு',
    computeRisk: 'அபாயத்தை கணக்கிடு', analysing: 'AI பகுப்பாய்வு...',
    ecoTitle: 'சேமிப்பு பொருளாதாரம்', ecoSub: 'சேமிப்பு மதிப்புள்ளதா?',
    riceVariety: 'நெல் வகை', duration: 'காலம்',
    productionCost: 'உற்பத்தி செலவு (ரூ/kg)', sellingPrice: 'விற்பனை விலை (ரூ/kg)',
    productionCostHint: '💡 1 kg வளர்க்கும் மொத்த செலவு',
    sellingPriceHint: '💡 சேமிப்புக்கு பிறகு எதிர்பார்க்கும் சந்தை விலை',
    calcEco: 'பொருளாதாரம் கணக்கிடு', calculating: 'கணக்கிடுகிறது...',
    dailyMaintCost: 'தினசரி பராமரிப்பு செலவு (ரூ/நாள்)',
    dailyMaintHint: 'மின்சாரம், கூலி, சுத்தம் உட்பட உங்கள் தினசரி செலவை உள்ளிடவும்.',
    maintTotal: 'பராமரிப்பு மொத்தம்',
    recTitle: 'சிறந்த மூட்டை பரிந்துரை', recSub: 'AI சிறந்த சேமிப்பை தேர்வு செய்கிறது',
    moisture: 'ஈரப்பதம் (%)', estTemp: 'வெப்பநிலை (°C)',
    getAIRec: 'AI பரிந்துரை பெறு', aiThinking: 'AI சிந்திக்கிறது...',
    activeBatches: 'செயலில் உள்ள தொகுதிகள்',
    addNew: '+ புதிது சேர்', noBatches: 'சேமிப்பு தொகுதிகள் இல்லை',
    registerFirst: 'முதல் அறுவடையை பதிவு செய்யுங்கள்',
    registerHarvest: 'அறுவடை பதிவு',
    month1: '1 மாதம்', month2: '2 மாதங்கள்', month3: '3 மாதங்கள்',
    month6: '6 மாதங்கள்', month6plus: '6+ மாதங்கள்', month9: '9 மாதங்கள்', month12: '12 மாதங்கள்',
    riskFactors: 'கண்டறியப்பட்ட அபாயங்கள்:',
    urgentAction: '🚨 அவசர நடவடிக்கை', ifIgnored: '💰 புறக்கணித்தால்',
    farmerTip: '💡 உழவர் குறிப்பு', safeStorage: 'பாதுகாப்பான சேமிப்பு:',
    days: 'நாட்கள்', months: 'மாதங்கள்',
    estLoss: 'எடை இழப்பு மதிப்பீடு',
    profitable: 'லாபகரமானது', marginal: 'சராசரி', lossAlert: 'இழப்பு எச்சரிக்கை',
    costBreakdown: 'செலவு விவரம்', bagsRequired: 'மூட்டைகள் தேவை',
    storageBags: 'சேமிப்பு மூட்டைகள்', rent: 'கிடங்கு வாடகை',
    fumigation: 'புகையிடுதல்', labour: 'கூலி', insurance: 'காப்பீடு',
    totalCost: 'மொத்த சேமிப்பு செலவு', costPerKg: 'ஒரு கிலோ செலவு',
    sellToday: 'உற்பத்தி செலவு', sellPeak: 'வருவாய்',
    totalProdCost: 'உற்பத்தி செலவு', totalRevenue: 'வருவாய்',
    netProfit: 'நிகர லாபம்', breakEven: 'பிரேக்-ஈவன்',
    aiEconAdvice: '📊 AI பொருளாதார ஆலோசனை',
    bestChoice: 'உங்களுக்கான சிறந்த தேர்வு',
    allOptions: 'அனைத்து விருப்பங்களும்:',
    notEnoughDays: 'நாட்கள் போதாது', recommended: 'பரிந்துரைக்கப்படுகிறது',
    totalCostLabel: 'மொத்த செலவு', prepSteps: 'தயாரிப்பு படிகள்:',
    whereToBuy: '🏪 எங்கே வாங்குவது',
    recalcPlanner: 'உற்பத்தி செலவை மீண்டும் கணக்கிடுங்கள்',
    productionCostTab: 'உற்பத்தி செலவு',
    seedCalcTitle: 'எளிய விதை செலவு கணக்கீடு',
    seedCalcSub: 'விவசாயிக்கு எளிமையான 9 படிகள்',
    farmDetails: 'பண்ணை விவரங்கள்',
    varietyLabel: 'வகை',
    acresLabel: 'ஏக்கர்',
    yieldLabel: 'மகசூல் (kg)',
    priceLabel: 'விலை (ரூ/kg)',
    costSectionsLabel: 'எளிய செலவுகள் (ரூ.)',
    lPrepLabel: '1. நிலம் தயாரிப்பு & டிராக்டர்',
    sNursLabel: '2. விதைகள் & நாற்றங்கால்',
    fertLabel: '3. உரம்',
    chemLabel: '4. பூச்சிக்கொல்லிகள் & களைக்கொல்லிகள்',
    laborLabel: '5. வாடகை உழைப்பு',
    harvLabel: '6. அறுவடை இயந்திரம்',
    postHLabel: '7. உலர்த்துதல், பைகள் & பதப்படுத்துதல்',
    transpLabel: '8. போக்குவரத்து & சந்தை',
    otherLabel: '9. இதர (நீர், கடன்கள்)',
    calcProfitBtn: 'எனது லாபத்தை கணக்கிடுக',
    getFarmerAiBtn: 'AI விவசாயி ஆலோசனை பெறு',
    costPerAcre: 'ஒரு ஏக்கர் செலவு',
    breakEvenPrice: 'பிரேக்-ஈவன் விலை',
    totalRevLabel: 'மொத்த வருவாய்',
    marginLabel: 'லாபம் சதவீதம்',
    aiRecommendations: 'AI பரிந்துரைகள்',
  },
};

const fmtLKR = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

// ─────────────────────────────────────────────────────────────────────────────
//  REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Beautiful Score Gauge ─────────────────────────────────────────────────────
function ScoreGauge({ score, color, size }) {
  const sz = size || 110;
  const sc = Math.min(100, Math.max(0, score || 0));
  const danger = sc <= 30;
  const warn = sc > 30 && sc <= 60;
  const safe = sc > 60;

  const gaugeColor = danger ? C.red : warn ? C.amber : C.green;

  return (
    <View style={{ width: sz, height: sz, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow ring */}
      <View style={{
        position: 'absolute',
        width: sz,
        height: sz,
        borderRadius: sz / 2,
        borderWidth: 3,
        borderColor: gaugeColor + '20',
      }} />
      {/* Mid ring */}
      <View style={{
        position: 'absolute',
        width: sz - 10,
        height: sz - 10,
        borderRadius: (sz - 10) / 2,
        borderWidth: 8,
        borderColor: gaugeColor + '18',
      }} />
      {/* Active ring */}
      <View style={{
        position: 'absolute',
        width: sz - 10,
        height: sz - 10,
        borderRadius: (sz - 10) / 2,
        borderWidth: 8,
        borderColor: gaugeColor,
        borderRightColor: sc >= 25 ? gaugeColor : 'transparent',
        borderBottomColor: sc >= 50 ? gaugeColor : 'transparent',
        borderLeftColor: sc >= 75 ? gaugeColor : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      {/* Inner filled circle */}
      <View style={{
        width: sz - 30,
        height: sz - 30,
        borderRadius: (sz - 30) / 2,
        backgroundColor: gaugeColor + '12',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: gaugeColor, letterSpacing: -1 }}>{sc}</Text>
        <Text style={{ fontSize: 9, color: gaugeColor + 'aa', fontWeight: '800', marginTop: -2 }}>/100</Text>
      </View>
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, color, title, sub }) {
  return (
    <View style={st.secHeader}>
      <LinearGradient
        colors={[color + '30', color + '10']}
        style={st.secIconBox}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={st.secTitle}>{title}</Text>
        {sub ? <Text style={st.secSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

// ── Chip Group ────────────────────────────────────────────────────────────────
function ChipGroup({ label, options, value, onChange, color }) {
  const activeColor = color || C.green;
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? <Text style={st.fieldLabel}>{label}</Text> : null}
      <View style={st.chipRow}>
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              style={[st.chip, isActive && { backgroundColor: activeColor, borderColor: activeColor, shadowColor: activeColor, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 }]}
              onPress={() => onChange(opt.value)}
            >
              {opt.icon ? (
                <MaterialCommunityIcons name={opt.icon} size={13} color={isActive ? C.white : C.grey5} style={{ marginRight: 4 }} />
              ) : null}
              <Text style={[st.chipTxt, isActive && { color: C.white }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Batch Card ────────────────────────────────────────────────────────────────
function BatchCard({ item, navigation, location, locData }) {
  const [rtData, setRtData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchRT() {
      try {
        const storType = (locData?.storageType || 'home').toLowerCase().replace(/[^a-z]/g, '');
        const stMap = { home: 'home', warehouse: 'warehouse', shed: 'shed', coop: 'co-op', 'co-op': 'co-op', private: 'warehouse', government: 'warehouse' };
        const stype = Object.keys(stMap).find(k => storType.includes(k)) ? stMap[Object.keys(stMap).find(k => storType.includes(k))] : 'warehouse';
        const body = {
          variety: item.variety || 'Bg 352',
          bag_type: item.storageType || item.storageMethod || 'gunny',
          moisture_pct: parseFloat(item.moisturePct || item.moisture_pct || 13.5),
          quantity_kg: parseFloat(item.quantityKg || 1000),
          duration_months: 3,
          lat: locData?.latitude || locData?.lat || location?.latitude || 7.87,
          lon: locData?.longitude || locData?.lon || location?.longitude || 80.77,
          storage_type: stype,
          roof_material: locData?.roofMaterial || 'tile',
          roof_color: locData?.roofColor || 'red',
          ventilation: locData?.ventilation || 'natural',
          ceiling_height: locData?.ceilingHeight || '3-4m',
          insulation: locData?.insulation || false,
        };
        const res = await fetch(`${BASE_URL}/api/guardian/predict`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        const d = await res.json();
        if (mounted && !d.error) setRtData(d);
      } catch (e) { console.log(e); }
      finally { if (mounted) setLoading(false); }
    }
    fetchRT();
    return () => { mounted = false; };
  }, [location, item]);

  const mc = parseFloat(item.moisturePct || item.moisture_pct || 13.5);
  let riskKey = mc > 16 ? 'CRITICAL' : mc > 14 ? 'HIGH' : mc > 13 ? 'MEDIUM' : 'LOW';
  let temp = '--';
  let humid = '--';

  if (rtData?.risk) {
    const cat = rtData.risk.category?.toUpperCase() || 'LOW';
    riskKey = cat.includes('CRITICAL') ? 'CRITICAL' : cat.includes('HIGH') ? 'HIGH' : cat.includes('MEDIUM') ? 'MEDIUM' : 'LOW';
    if (rtData.indoor_environment) {
      temp = rtData.indoor_environment.indoor_temp_c != null ? rtData.indoor_environment.indoor_temp_c.toFixed(1) : '--';
      humid = rtData.indoor_environment.indoor_humidity_pct != null ? rtData.indoor_environment.indoor_humidity_pct.toFixed(0) : '--';
    }
  }

  const riskColor = { CRITICAL: C.red, HIGH: C.amber, MEDIUM: '#10b981', LOW: C.green }[riskKey];
  const bgData = { CRITICAL: ['#fef2f2', '#fee2e2'], HIGH: ['#fffbeb', '#fef3c7'], MEDIUM: ['#ecfdf5', '#d1fae5'], LOW: ['#f0fdf4', '#dcfce7'] }[riskKey];

  return (
    <View style={[st.batchCard, { borderColor: riskColor + '40' }]}>
      <LinearGradient colors={bgData} style={StyleSheet.absoluteFillObject} borderRadius={16} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <TouchableOpacity style={st.batchLeft}
        onPress={() => navigation.navigate('PostHarvestAdvisor', {
          batch: item, location: locData, locationId: locData?.id,
          indoorTemp: rtData?.indoor_environment?.indoor_temp_c,
          indoorHumid: rtData?.indoor_environment?.indoor_humidity_pct,
          lat: locData?.latitude || locData?.lat || location?.latitude || 7.87,
          lon: locData?.longitude || locData?.lon || location?.longitude || 80.77,
        })}>
        <View style={[st.batchIconBox, { backgroundColor: riskColor + '20' }]}>
          {loading ? <ActivityIndicator color={riskColor} size="small" /> : <MaterialCommunityIcons name="sack" size={24} color={riskColor} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.batchVariety} numberOfLines={1}>{item.variety}</Text>
          <Text style={st.batchMeta}>{item.season} • <Text style={{ fontWeight: '800', color: C.ink }}>{item.quantityKg} kg</Text></Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6, flexWrap: 'wrap' }}>
            <View style={[st.riskPill, { backgroundColor: riskColor }]}>
              <Text style={[st.riskPillTxt, { color: C.white }]}>{riskKey} RISK</Text>
            </View>
            <Text style={{ fontSize: 10, color: C.grey6, fontWeight: '700' }}>💧 {mc}%</Text>
            {temp !== '--' && <Text style={{ fontSize: 10, color: C.grey6, fontWeight: '700' }}>🌡 {temp}°C</Text>}
            {humid !== '--' && <Text style={{ fontSize: 10, color: C.grey6, fontWeight: '700' }}>☁️ {humid}%</Text>}
          </View>
        </View>
      </TouchableOpacity>
      <View style={st.batchRight}>
        <TouchableOpacity style={st.editBtnPremium}
          onPress={() => navigation.navigate('RegisterHarvest', { editData: item, docId: item.id })}>
          <MaterialCommunityIcons name="pencil" size={14} color={C.grey6} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  RISK RESULT PANEL — Premium redesign
// ══════════════════════════════════════════════════════════════════════════════
function RiskResultPanel({ data, tx }) {
  const cColor = data.color || C.amber;
  const isLow = data.score >= 70;
  const isMed = data.score >= 40 && data.score < 70;

  // Gradient based on risk level
  const headerGrads = isLow
    ? ['#064e3b', '#16a34a']
    : isMed
      ? ['#92400e', '#d97706']
      : ['#7f1d1d', '#dc2626'];

  return (
    <View style={st.resultWrapper}>
      {/* ── Hero header with score ── */}
      <LinearGradient colors={headerGrads} style={st.riskHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Decorative circles */}
        <View style={st.decCircle1} />
        <View style={st.decCircle2} />

        <View style={st.riskHeroContent}>
          <View style={{ alignItems: 'center' }}>
            <ScoreGauge score={data.score} color={C.white} size={100} />
            <View style={[st.riskBadgeHero, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' }]}>
              <Text style={st.riskBadgeHeroTxt}>{data.category} RISK</Text>
            </View>
          </View>
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Text style={st.riskHeroVerdict}>{data.ai_verdict}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Safe storage life ── */}
      {data.storage_life && (
        <View style={st.safeLifeRow}>
          <View style={[st.safeLifeIcon, { backgroundColor: C.greenLight }]}>
            <MaterialCommunityIcons name="clock-check-outline" size={26} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.safeLifeLabel}>{tx.safeStorage}</Text>
            <Text style={st.safeLifeVal}>
              <Text style={{ color: cColor, fontSize: 22, fontWeight: '900' }}>{data.storage_life.storage_days}</Text>
              <Text style={{ fontSize: 14, color: C.grey6, fontWeight: '700' }}> {tx.days}</Text>
              <Text style={{ fontSize: 13, color: C.grey4 }}>  ({data.storage_life.storage_months} {tx.months})</Text>
            </Text>
          </View>
          <LinearGradient colors={[cColor, cColor + 'cc']} style={st.gradePillLarge}>
            <Text style={st.gradePillLargeTxt}>{data.storage_life.grade}</Text>
          </LinearGradient>
        </View>
      )}

      {/* ── Risk factors ── */}
      {data.risk_factors && data.risk_factors.length > 0 && (
        <View style={st.factorsSection}>
          <View style={st.factorsHeader}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={cColor} />
            <Text style={[st.factorsSectionTitle, { color: cColor }]}>{tx.riskFactors}</Text>
          </View>
          {data.risk_factors.map((f, i) => (
            <View key={i} style={st.factorPremiumCard}>
              <View style={[st.factorPremiumLeft, { backgroundColor: cColor + '15' }]}>
                <MaterialCommunityIcons name="alert-outline" size={18} color={cColor} />
              </View>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={st.factorPremiumName}>{f.factor}</Text>
                <Text style={st.factorPremiumDetail}>{f.detail}</Text>
              </View>
              <View style={[st.deductionBadge, { backgroundColor: C.red + '15' }]}>
                <Text style={[st.deductionTxt, { color: C.red }]}>−{f.deduction}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Three action callouts ── */}
      {/* 1. Urgent action */}
      <View style={[st.actionCallout, { backgroundColor: cColor + '0d', borderColor: cColor + '35', borderLeftColor: cColor }]}>
        <View style={st.actionCalloutHead}>
          <View style={[st.actionCalloutIconBox, { backgroundColor: cColor + '20' }]}>
            <MaterialCommunityIcons name="bell-ring" size={20} color={cColor} />
          </View>
          <Text style={[st.actionCalloutTitle, { color: cColor }]}>{tx.urgentAction}</Text>
        </View>
        <Text style={st.actionCalloutBody}>{data.ai_urgent}</Text>
      </View>

      {/* 2. If ignored */}
      <View style={[st.actionCallout, { backgroundColor: '#fef3c7', borderColor: C.amber + '40', borderLeftColor: C.amber, marginTop: 10 }]}>
        <View style={st.actionCalloutHead}>
          <View style={[st.actionCalloutIconBox, { backgroundColor: C.amber + '20' }]}>
            <MaterialCommunityIcons name="cash-remove" size={20} color={C.amber} />
          </View>
          <Text style={[st.actionCalloutTitle, { color: C.amber }]}>{tx.ifIgnored}</Text>
        </View>
        <Text style={st.actionCalloutBody}>{data.ai_loss_warning}</Text>
        <View style={st.lossEstimateRow}>
          <Text style={st.lossEstimateLabel}>{tx.estLoss}</Text>
          <Text style={[st.lossEstimateVal, { color: cColor }]}>{data.loss_estimate}</Text>
        </View>
      </View>

      {/* 3. Farmer tip */}
      <View style={[st.actionCallout, { backgroundColor: '#f0fdf4', borderColor: C.green + '40', borderLeftColor: C.green, marginTop: 10 }]}>
        <View style={st.actionCalloutHead}>
          <View style={[st.actionCalloutIconBox, { backgroundColor: C.green + '20' }]}>
            <MaterialCommunityIcons name="lightbulb-on" size={20} color={C.green} />
          </View>
          <Text style={[st.actionCalloutTitle, { color: C.green }]}>{tx.farmerTip}</Text>
        </View>
        <Text style={st.actionCalloutBody}>{data.ai_farmer_tip}</Text>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  COST RESULT PANEL — Premium redesign
// ══════════════════════════════════════════════════════════════════════════════
function CostResultPanel({ data, tx }) {
  const navigation = useNavigation();
  const isProfit = data.profitability === 'YES';
  const isMarginal = data.profitability === 'MARGINAL';
  const pColor = isProfit ? C.green : isMarginal ? C.amber : C.red;
  const pLabel = isProfit ? tx.profitable : isMarginal ? tx.marginal : tx.lossAlert;
  const pIcon = isProfit ? 'trending-up' : isMarginal ? 'trending-neutral' : 'trending-down';
  const headerGrads = isProfit ? ['#064e3b', '#16a34a'] : isMarginal ? ['#78350f', '#d97706'] : ['#7f1d1d', '#dc2626'];

  const netPositive = (data.net_profit || 0) > 0;

  return (
    <View style={st.resultWrapper}>
      {/* ── Hero verdict ── */}
      <LinearGradient colors={headerGrads} style={st.ecoHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={st.decCircle1} />
        <View style={st.decCircle2} />
        <View style={st.ecoHeroContent}>
          <View style={[st.ecoHeroIconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <MaterialCommunityIcons name={pIcon} size={36} color={C.white} />
          </View>
          <View style={{ flex: 1, paddingLeft: 14 }}>
            <View style={st.ecoHeroBadge}>
              <Text style={st.ecoHeroBadgeTxt}>{pLabel}</Text>
            </View>
            <Text style={st.ecoHeroVerdict}>{data.ai_economic_verdict}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Cost vs Revenue comparison ── */}
      <View style={st.priceCompareCard}>
        <View style={st.priceCompareItem}>
          <View style={st.priceCompareIconBox}>
            <MaterialCommunityIcons name="sprout" size={20} color={C.grey5} />
          </View>
          <Text style={st.priceCompareLabel}>{tx.totalProdCost}</Text>
          <Text style={st.priceCompareValueNeutral}>{fmtLKR(data.total_production_cost)}</Text>
        </View>
        <View style={st.priceArrow}>
          <MaterialCommunityIcons name="arrow-right-bold" size={22} color={pColor} />
        </View>
        <View style={st.priceCompareItem}>
          <View style={[st.priceCompareIconBox, { backgroundColor: pColor + '18' }]}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color={pColor} />
          </View>
          <Text style={[st.priceCompareLabel, { color: pColor }]}>{tx.totalRevenue}</Text>
          <Text style={[st.priceCompareValueBold, { color: pColor }]}>{fmtLKR(data.sell_peak_value)}</Text>
        </View>
      </View>

      {/* ── Net profit hero number ── */}
      <LinearGradient
        colors={[pColor + 'ee', pColor]}
        style={st.netProfitHero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <Text style={st.netProfitLabel}>{tx.netProfit}</Text>
        <Text style={st.netProfitValue}>
          {netPositive ? '+' : ''}{fmtLKR(data.net_profit)}
        </Text>
        <MaterialCommunityIcons
          name={netPositive ? 'arrow-up-circle' : 'arrow-down-circle'}
          size={28} color="rgba(255,255,255,0.6)"
        />
      </LinearGradient>

      {/* ── Cost breakdown ── */}
      <View style={st.costBreakdownCard}>
        <View style={st.costBreakdownHeader}>
          <MaterialCommunityIcons name="receipt" size={18} color={C.grey7} />
          <Text style={st.costBreakdownTitle}>{tx.costBreakdown}</Text>
          <View style={st.bagsBadge}>
            <Text style={st.bagsBadgeTxt}>{data.bags_required} {tx.bagsRequired}</Text>
          </View>
        </View>

        {[
          { icon: 'bag-personal', label: tx.storageBags, value: data.effective_bag_cost, color: C.blue },
          { icon: 'warehouse', label: tx.rent, value: data.rent_cost, color: C.purple },
          ...(data.maint_cost > 0 ? [{ icon: 'wrench', label: tx.maintTotal, value: data.maint_cost, color: C.teal }] : []),
          { icon: 'spray', label: tx.fumigation, value: data.fumigation_cost, color: C.orange },
          { icon: 'account-hard-hat', label: tx.labour, value: data.labour_cost, color: C.teal },
          { icon: 'shield-check', label: tx.insurance, value: data.insurance_cost, color: C.green },
        ].map((row, i) => (
          <View key={i} style={st.costRow}>
            <View style={[st.costRowIcon, { backgroundColor: row.color + '15' }]}>
              <MaterialCommunityIcons name={row.icon} size={15} color={row.color} />
            </View>
            <Text style={st.costRowLabel}>{row.label}</Text>
            <Text style={st.costRowValue}>{fmtLKR(row.value)}</Text>
          </View>
        ))}

        <View style={st.costDivider} />

        <View style={st.costTotalRow}>
          <Text style={st.costTotalLabel}>{tx.totalCost}</Text>
          <Text style={[st.costTotalValue, { color: pColor }]}>{fmtLKR(data.total_storage_cost)}</Text>
        </View>

        <View style={[st.costPerKgBadge, { backgroundColor: pColor + '12', borderColor: pColor + '30' }]}>
          <MaterialCommunityIcons name="scale" size={14} color={pColor} />
          <Text style={[st.costPerKgTxt, { color: pColor }]}>
            {tx.costPerKg}: <Text style={{ fontWeight: '900' }}>Rs. {data.cost_per_kg}/kg</Text>
          </Text>
        </View>

        <TouchableOpacity style={[st.plannerBtn, { backgroundColor: C.blue }]}
          onPress={() => navigation.navigate('InputPlanner')}>
          <MaterialCommunityIcons name="calculator-variant" size={16} color={C.white} />
          <Text style={st.plannerBtnTxt}>{tx.recalcPlanner}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Break-even ── */}
      <View style={st.breakEvenPremium}>
        <View style={st.breakEvenLeft}>
          <MaterialCommunityIcons name="scale-balance" size={22} color={C.grey6} />
          <View style={{ marginLeft: 10 }}>
            <Text style={st.breakEvenTitle}>{tx.breakEven}</Text>
            <Text style={st.breakEvenSub}>Rs. {data.break_even_price}/kg</Text>
          </View>
        </View>
        <View style={[st.roiBadge, { backgroundColor: netPositive ? C.greenLight : C.redLight }]}>
          <Text style={[st.roiTxt, { color: netPositive ? C.green : C.red }]}>ROI {data.roi_pct}%</Text>
        </View>
      </View>

      {/* ── AI advice ── */}
      <View style={[st.actionCallout, { backgroundColor: pColor + '0d', borderColor: pColor + '35', borderLeftColor: pColor }]}>
        <View style={st.actionCalloutHead}>
          <View style={[st.actionCalloutIconBox, { backgroundColor: pColor + '20' }]}>
            <MaterialCommunityIcons name="robot-outline" size={20} color={pColor} />
          </View>
          <Text style={[st.actionCalloutTitle, { color: pColor }]}>{tx.aiEconAdvice}</Text>
        </View>
        <Text style={st.actionCalloutBody}>{data.ai_economic_verdict}</Text>
        {data.ai_risk_warning ? (
          <View style={st.aiWarnRow}>
            <MaterialCommunityIcons name="alert-octagon" size={15} color={C.red} />
            <Text style={st.aiWarnTxt}>{data.ai_risk_warning}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  RECOMMEND RESULT PANEL — Premium redesign
// ══════════════════════════════════════════════════════════════════════════════
function RecommendResultPanel({ data, tx }) {
  const rec = data.ai_recommendation || {};
  const recKey = rec.recommended_bag || (data.best_option?.bag_type) || 'hermetic';
  const meta = BAG_META[recKey] || BAG_META.hermetic;

  return (
    <View style={st.resultWrapper}>
      {/* ── Winner hero ── */}
      <LinearGradient
        colors={[meta.color + 'ee', meta.color + 'bb', meta.color + '88']}
        style={st.recHero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={st.decCircle1} />
        <View style={st.decCircle2} />
        <View style={st.recHeroContent}>
          <View style={[st.recHeroIconBox, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <MaterialCommunityIcons name={meta.icon} size={38} color={C.white} />
          </View>
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Text style={st.recHeroEyebrow}>{tx.bestChoice}</Text>
            <Text style={st.recHeroName}>{meta.label}</Text>
            <Text style={st.recHeroHeadline}>{rec.recommendation_headline}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Options comparison ── */}
      <View style={st.optionsSection}>
        <Text style={st.optionsSectionTitle}>{tx.allOptions}</Text>
        {(data.options || []).map((opt, i) => {
          const m = BAG_META[opt.bag_type] || {};
          const isWinner = opt.bag_type === recKey;
          const hasProfit = opt.net_profit > 0;

          return (
            <View
              key={i}
              style={[
                st.optionPremiumCard,
                !opt.viable && st.optionFaded,
                isWinner && { borderColor: m.color, borderWidth: 2, backgroundColor: m.color + '06' },
              ]}
            >
              {isWinner && (
                <LinearGradient
                  colors={[m.color + '15', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                  borderRadius={16}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              )}

              <View style={[st.optionPremiumIcon, { backgroundColor: opt.viable ? m.color + '18' : C.grey1 }]}>
                <MaterialCommunityIcons name={m.icon || 'sack'} size={22} color={opt.viable ? m.color : C.grey4} />
              </View>

              <View style={{ flex: 1, paddingLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={[st.optionPremiumName, !opt.viable && { color: C.grey4 }]}>{m.label || opt.bag_type}</Text>
                  {isWinner && (
                    <View style={[st.recBadge, { backgroundColor: m.color }]}>
                      <MaterialCommunityIcons name="check-circle" size={11} color={C.white} style={{ marginRight: 3 }} />
                      <Text style={st.recBadgeTxt}>{tx.recommended}</Text>
                    </View>
                  )}
                  {!opt.viable && (
                    <View style={[st.recBadge, { backgroundColor: C.redLight }]}>
                      <Text style={[st.recBadgeTxt, { color: C.red }]}>{tx.notEnoughDays}</Text>
                    </View>
                  )}
                </View>
                <Text style={st.optionPremiumMeta}>
                  {opt.storage_months} {tx.months} • {fmtLKR(opt.total_cost)} {tx.totalCostLabel}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[st.optionPremiumProfit, { color: hasProfit ? C.green : C.red }]}>
                  {hasProfit ? '+' : ''}{fmtLKR(opt.net_profit)}
                </Text>
                <Text style={st.optionPremiumProfitLabel}>net profit</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Preparation steps ── */}
      {rec.preparation_steps && rec.preparation_steps.length > 0 && (
        <View style={st.stepsSection}>
          <View style={st.stepsSectionHeader}>
            <MaterialCommunityIcons name="format-list-numbered" size={16} color={meta.color} />
            <Text style={[st.stepsSectionTitle, { color: meta.color }]}>{tx.prepSteps}</Text>
          </View>
          {rec.preparation_steps.map((step, i) => (
            <View key={i} style={st.stepPremiumRow}>
              <LinearGradient colors={[meta.color, meta.color + 'bb']} style={st.stepPremiumNum}>
                <Text style={st.stepPremiumNumTxt}>{i + 1}</Text>
              </LinearGradient>
              <View style={st.stepPremiumBubble}>
                <Text style={st.stepPremiumTxt}>{step}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Where to buy ── */}
      {rec.where_to_buy ? (
        <View style={[st.whereToBuyCard, { borderColor: meta.color + '30' }]}>
          <LinearGradient colors={[meta.color + '10', meta.color + '05']} style={StyleSheet.absoluteFillObject} borderRadius={16} />
          <View style={st.whereToBuyHeader}>
            <MaterialCommunityIcons name="store" size={18} color={meta.color} />
            <Text style={[st.whereToBuyTitle, { color: meta.color }]}>{tx.whereToBuy}</Text>
          </View>
          <Text style={st.whereToBuyBody}>{rec.where_to_buy}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SIMPLIFIED SEED PRODUCTION COST CALCULATOR
// ════════════════════════════════════════════════════════════════════════════
function SeedProductionCalculator({ tx, lang, apiPost }) {
  const [seedForm, setSeedForm] = useState({
    variety: 'Bg 352', 
    landAreaAcres: '1', 
    expectedYieldKg: '2000', 
    sellingPriceKg: '150',
    
    // Simplified cost categories
    landPrep: '',      // Land Prep & Tractor
    seedNursery: '',   // Seeds & Nursery
    fertilizer: '',    // Fertilizer
    chemicals: '',     // Pesticides & Weedicides
    labor: '',         // Hired Labor
    harvesting: '',    // Harvesting Machinery
    postHarvest: '',   // Processing & Bags
    transport: '',     // Transport & Market
    other: '',         // Other Expenses (Water, Loans)
  });

  const [seedResult, setSeedResult] = useState(null);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const renderSimpleInput = (label, icon, field, placeholder) => (
    <View key={field} style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <MaterialCommunityIcons name={icon} size={18} color={C.orange} style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.grey8 }}>{label}</Text>
      </View>
      <TextInput 
        style={[st.fullInput, { backgroundColor: C.white, borderColor: C.grey3 }]} 
        keyboardType={field === 'variety' ? 'default' : 'decimal-pad'} 
        value={String(seedForm[field] || '')} 
        onChangeText={(v) => setSeedForm({ ...seedForm, [field]: v })} 
        placeholder={placeholder || "0  (Rs.)"} 
      />
    </View>
  );

  const computeSeedCost = () => {
    setLoadingSeed(true);
    const sf = seedForm;
    const toNum = (val) => Number(val) || 0;
    
    const landPrep = toNum(sf.landPrep);
    const seedNursery = toNum(sf.seedNursery);
    const fertilizer = toNum(sf.fertilizer);
    const chemicals = toNum(sf.chemicals);
    const labor = toNum(sf.labor);
    const harvesting = toNum(sf.harvesting);
    const postHarvest = toNum(sf.postHarvest);
    const transport = toNum(sf.transport);
    const other = toNum(sf.other);

    const totalCost = landPrep + seedNursery + fertilizer + chemicals + labor + harvesting + postHarvest + transport + other;
    const yieldKg = toNum(sf.expectedYieldKg);
    const landAcres = toNum(sf.landAreaAcres) || 1;
    const costPerAcre = totalCost / landAcres;
    const breakEven = yieldKg > 0 ? (totalCost / yieldKg) : 0;
    const revenue = yieldKg * toNum(sf.sellingPriceKg);
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

    const res = {
      landPrep, seedNursery, fertilizer, chemicals, labor, harvesting, postHarvest, transport, other,
      totalCost, costPerAcre, breakEven, revenue, profit, margin
    };

    setSeedResult(res);
    setAiAnalysis(null);
    setLoadingSeed(false);
  };

  const getSeedAiAnalysis = async () => {
    if (!seedResult) return;
    setLoadingAi(true);
    try {
      const promptText = `I am producing rice seeds in Sri Lanka.
Variety: ${seedForm.variety}, Land: ${seedForm.landAreaAcres} acres.
Yield: ${seedForm.expectedYieldKg} kg, Selling price: Rs. ${seedForm.sellingPriceKg}/kg.
My costs are:
Land Prep & Tractor: Rs. ${seedResult.landPrep}
Seeds & Nursery: Rs. ${seedResult.seedNursery}
Fertilizer: Rs. ${seedResult.fertilizer}
Pesticides & Weedicides: Rs. ${seedResult.chemicals}
Hired Labor: Rs. ${seedResult.labor}
Harvesting Machinery: Rs. ${seedResult.harvesting}
Processing & Bags: Rs. ${seedResult.postHarvest}
Transport & Market: Rs. ${seedResult.transport}
Other: Rs. ${seedResult.other}
Total Cost: Rs. ${seedResult.totalCost}. Profit: Rs. ${seedResult.profit}.
Give me 3 short, highly tailored, expert cost-reduction recommendations for Sri Lankan farmers. Explain simply. Do not write a long essay. Just 3 points.`;
      
      const response = await apiPost('/api/guardian/chat', { question: promptText, lang: lang });
      if (response && response.answer) {
        setAiAnalysis(response.answer);
      } else if (response && response.error) {
        setAiAnalysis("Error: " + response.error);
      } else {
        setAiAnalysis("Unable to fetch AI analysis. Check your internet connection.");
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not fetch AI analysis.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <View style={st.card}>
      <SectionHeader icon="seed" color={C.orange} title={tx.seedCalcTitle || "Simple Seed Cost Calculator"} sub={tx.seedCalcSub || "Farmer-friendly 9-step calculation"} />
      
      <View style={{ backgroundColor: C.orangeLight, padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: C.orange, marginBottom: 12 }}>{tx.farmDetails || "Farm Details"}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            {renderSimpleInput(tx.varietyLabel || "Variety", "sprout", "variety", "e.g. Bg 352")}
          </View>
          <View style={{ flex: 1 }}>
            {renderSimpleInput(tx.acresLabel || "Acres", "ruler-square", "landAreaAcres", "1")}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            {renderSimpleInput(tx.yieldLabel || "Yield (kg)", "scale", "expectedYieldKg", "2000")}
          </View>
          <View style={{ flex: 1 }}>
            {renderSimpleInput(tx.priceLabel || "Price (Rs/kg)", "cash", "sellingPriceKg", "150")}
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: C.grey0, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: C.grey2, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: C.ink, marginBottom: 16 }}>{tx.costSectionsLabel || "Simple Cost Sections (Rs.)"}</Text>
        
        {renderSimpleInput(tx.lPrepLabel || "1. Land Prep & Tractor", "tractor", "landPrep")}
        {renderSimpleInput(tx.sNursLabel || "2. Seeds & Nursery", "seed-outline", "seedNursery")}
        {renderSimpleInput(tx.fertLabel || "3. Fertilizer", "sack", "fertilizer")}
        {renderSimpleInput(tx.chemLabel || "4. Pesticides & Weedicides", "shield-bug", "chemicals")}
        {renderSimpleInput(tx.laborLabel || "5. Hired Labor", "account-hard-hat", "labor")}
        {renderSimpleInput(tx.harvLabel || "6. Harvesting Machinery", "scythe", "harvesting")}
        {renderSimpleInput(tx.postHLabel || "7. Drying, Bags & Processing", "barn", "postHarvest")}
        {renderSimpleInput(tx.transpLabel || "8. Transport & Market", "truck", "transport")}
        {renderSimpleInput(tx.otherLabel || "9. Other Expenses (Water, Loans)", "chart-pie", "other")}
      </View>

      <TouchableOpacity style={[st.primaryBtn, { backgroundColor: C.orange }]} onPress={computeSeedCost} disabled={loadingSeed}>
        {loadingSeed ? <ActivityIndicator color={C.white} /> : <><MaterialCommunityIcons name="calculator" size={18} color={C.white} /><Text style={st.primaryBtnTxt}> {tx.calcProfitBtn || "Calculate My Profit"}</Text></>}
      </TouchableOpacity>

      {seedResult && (
        <View style={[st.resultWrapper, { marginTop: 24 }]}>
          <LinearGradient colors={['#9a3412', '#ea580c']} style={st.ecoHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={st.ecoHeroContent}>
              <View style={[st.ecoHeroIconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <MaterialCommunityIcons name={seedResult.profit >= 0 ? 'trending-up' : 'trending-down'} size={36} color={C.white} />
              </View>
              <View style={{ flex: 1, paddingLeft: 14 }}>
                <View style={st.ecoHeroBadge}>
                  <Text style={st.ecoHeroBadgeTxt}>{seedResult.profit >= 0 ? (tx.profitable || 'PROFITABLE') : (tx.lossAlert || 'LOSS')}</Text>
                </View>
                <Text style={st.ecoHeroVerdict}>{tx.netProfit || "Net Profit"}: Rs. {seedResult.profit.toLocaleString()}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={st.costBreakdownCard}>
            <View style={st.costTotalRow}>
              <Text style={st.costTotalLabel}>{tx.totalCostLabel || "Total Cost"}</Text>
              <Text style={[st.costTotalValue, { color: C.orange }]}>Rs. {seedResult.totalCost.toLocaleString()}</Text>
            </View>
            <View style={st.costDivider} />
            <View style={st.costRow}><Text style={st.costRowLabel}>{tx.costPerAcre || "Cost per Acre"}</Text><Text style={st.costRowValue}>Rs. {seedResult.costPerAcre.toLocaleString()}</Text></View>
            <View style={st.costRow}><Text style={st.costRowLabel}>{tx.costPerKg || "Cost per 1 kg"}</Text><Text style={st.costRowValue}>Rs. {seedResult.breakEven.toFixed(2)}</Text></View>
            <View style={st.costRow}><Text style={st.costRowLabel}>{tx.breakEvenPrice || "Break-even Price"}</Text><Text style={st.costRowValue}>Rs. {seedResult.breakEven.toFixed(2)}/kg</Text></View>
            <View style={st.costRow}><Text style={st.costRowLabel}>{tx.totalRevLabel || "Total Revenue"}</Text><Text style={st.costRowValue}>Rs. {seedResult.revenue.toLocaleString()}</Text></View>
            <View style={st.costRow}><Text style={st.costRowLabel}>{tx.marginLabel || "Margin"}</Text><Text style={st.costRowValue}>{seedResult.margin.toFixed(1)}%</Text></View>
          </View>

          {!aiAnalysis ? (
            <TouchableOpacity style={[st.primaryBtn, { backgroundColor: C.purple, marginTop: 16 }]} onPress={getSeedAiAnalysis} disabled={loadingAi}>
              {loadingAi ? <ActivityIndicator color={C.white} /> : <><MaterialCommunityIcons name="robot-outline" size={18} color={C.white} /><Text style={st.primaryBtnTxt}> {tx.getFarmerAiBtn || "Get AI Farmer Advice"}</Text></>}
            </TouchableOpacity>
          ) : (
            <View style={[st.actionCallout, { backgroundColor: C.purple + '0d', borderColor: C.purple + '35', borderLeftColor: C.purple, marginTop: 16 }]}>
              <View style={st.actionCalloutHead}>
                <View style={[st.actionCalloutIconBox, { backgroundColor: C.purple + '20' }]}>
                  <MaterialCommunityIcons name="robot-outline" size={20} color={C.purple} />
                </View>
                <Text style={[st.actionCalloutTitle, { color: C.purple }]}>{tx.aiRecommendations || "AI Recommendations"}</Text>
              </View>
              <Text style={st.actionCalloutBody}>{aiAnalysis}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════
export default function StorageDashboardScreen({ navigation }) {
  const location = useUniversalLocation();
  const [locations, setLocations] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [totals, setTotals] = useState({ kg: 0, bags: 0, value: '0' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('risk');
  const [lang, setLang] = useState('en');
  const tx = T[lang] || T.en;

  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showVarietyPicker, setShowVarietyPicker] = useState(false);
  const [recShowVarietyPicker, setRecShowVarietyPicker] = useState(false);

  const [riskForm, setRiskForm] = useState({
    moisture_pct: 13.5, bag_type: 'gunny', duration_months: 3,
    quantity_kg: 1000, has_pest_history: false, storage_location: 'home',
    temp_c: 28, district: null,
  });
  const [riskResult, setRiskResult] = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  const [costForm, setCostForm] = useState({
    quantity_kg: 1000, bag_type: 'gunny', duration_months: 3,
    storage_location: 'home', variety: 'Bg 352',
    production_cost_kg: '', selling_price: '',
    daily_maintenance_cost: '',
  });
  const [costResult, setCostResult] = useState(null);
  const [loadingCost, setLoadingCost] = useState(false);

  const [recForm, setRecForm] = useState({
    quantity_kg: 1000, duration_months: 3, moisture_pct: 13.5,
    temp_c: 28, variety: 'Bg 352', budget_lkr: 0,
  });
  const [recResult, setRecResult] = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const locSnap = await db.collection('storageLocations').where('userId', '==', uid).get();
      setLocations(locSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      return db.collection('harvests').where('userId', '==', uid).onSnapshot(
        (snap) => {
          let kg = 0; let bags = 0;
          const list = snap.docs.map((doc) => {
            const d = doc.data();
            kg += Number(d.quantityKg || 0);
            bags += Number(d.bags || 0);
            return { id: doc.id, ...d };
          });
          setHarvests(list);
          setTotals({ kg: kg.toFixed(0), bags: bags.toFixed(0), value: (kg * 256).toLocaleString('en-LK') });
          setLoading(false); setRefreshing(false);
        },
        (err) => { console.error(err); setLoading(false); setRefreshing(false); },
      );
    } catch (err) { console.error(err); setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    let unsub;
    fetchData().then((u) => { unsub = u; });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const apiPost = async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return res.json();
  };

  const computeRisk = async () => {
    const d = selectedDistrict;
    const body = { ...riskForm, lang, temp_c: d ? d.avgTemp : riskForm.temp_c, lat: d ? d.lat : (location?.latitude || 7.87), lon: d ? d.lon : (location?.longitude || 80.77) };
    setLoadingRisk(true); setRiskResult(null);
    try {
      const data = await apiPost('/api/guardian/risk_score', body);
      if (data.error) Alert.alert('Error', data.error); else setRiskResult(data);
    } catch { Alert.alert('Connection Error', 'Could not reach AI server.'); }
    finally { setLoadingRisk(false); }
  };

  const computeCost = () => {
    const qty = Number(costForm.quantity_kg);
    if (!qty || qty <= 0) { Alert.alert('Input Error', 'Please enter the quantity in kg.'); return; }
    setLoadingCost(true); setCostResult(null);

    // ── Sri Lanka real-world cost data (2024) ──────────────────────────────
    const BAG_SPECS = {
      hermetic:  { capacity_kg: 50, unit_cost: 850,  lifespan_years: 5, max_months: 9 },
      woven:     { capacity_kg: 50, unit_cost: 85,   lifespan_years: 1, max_months: 4 },
      gunny:     { capacity_kg: 50, unit_cost: 120,  lifespan_years: 1, max_months: 3 },
      polythene: { capacity_kg: 25, unit_cost: 45,   lifespan_years: 0.5, max_months: 3 },
      metalbin:  { capacity_kg: 200, unit_cost: 8500, lifespan_years: 15, max_months: 999 },
    };
    const RENT_PER_KG_MONTH = { home: 0, shed: 1.5, warehouse: 4.5, coop: 3.0 };
    const FUMIGATION_PER_KG = 1.8;   // Phostoxin tablet, 2 applications
    const LABOUR_PER_KG    = 3.5;    // loading/unloading
    const INSURANCE_RATE   = 0.005;  // 0.5% of value

    // ── Default selling prices (LKR/kg paddy, 2024 SL average) ──────────────
    const VARIETY_SELL_PRICES = {
      'Bg 352': 125, 'Bg 300': 120, 'Bg 94-1': 118, 'Bg 358': 122, 'Bg 366': 123,
      'Bg 379-2': 121, 'Bg 406': 124, 'At 308': 116, 'At 362': 117, 'Ld 356': 119,
      'Bw 272-6B': 115, 'Bw 364': 117, 'Pakwenna': 135, 'Sudu Heenati': 145,
      'Rathu Heenati': 148, 'Samba': 155, 'Nadu': 130, 'Keeri Samba': 160,
      'Red Raw Rice': 140, 'White Raw Rice': 138,
    };
    // Default production cost per kg (SL average 2024)
    const DEFAULT_PROD_COST = 85; // Rs./kg

    const bagSpec   = BAG_SPECS[costForm.bag_type] || BAG_SPECS.gunny;
    const months    = Number(costForm.duration_months);
    const days      = months * 30;
    const bags_n    = Math.ceil(qty / bagSpec.capacity_kg);

    // Effective bag cost (amortised over lifespan)
    const effective_bag_cost = Math.round((bagSpec.unit_cost * bags_n) / (bagSpec.lifespan_years * (12 / months) || 1));

    // Maintenance cost: user-entered daily × days
    const dailyMaint  = Number(costForm.daily_maintenance_cost) || 0;
    const maint_cost  = dailyMaint > 0 ? Math.round(dailyMaint * days) : 0;

    const rent_cost       = Math.round(qty * (RENT_PER_KG_MONTH[costForm.storage_location] || 0) * months);
    const fumigation_cost = Math.round(qty * FUMIGATION_PER_KG);
    const labour_cost     = Math.round(qty * LABOUR_PER_KG);

    // Production cost & selling price
    const prodCostKg  = costForm.production_cost_kg ? Number(costForm.production_cost_kg) : DEFAULT_PROD_COST;
    const sellPriceKg = costForm.selling_price ? Number(costForm.selling_price) : (VARIETY_SELL_PRICES[costForm.variety] || 122);

    const total_production_cost = Math.round(qty * prodCostKg);
    const sell_revenue          = Math.round(qty * sellPriceKg);
    const insurance_cost        = Math.round(sell_revenue * INSURANCE_RATE);
    const total_storage_cost    = effective_bag_cost + maint_cost + rent_cost + fumigation_cost + labour_cost + insurance_cost;
    const total_cost_all        = total_production_cost + total_storage_cost;
    const net_profit            = sell_revenue - total_cost_all;
    const cost_per_kg           = ((total_storage_cost) / qty).toFixed(1);
    const break_even_price      = Math.round(prodCostKg + total_storage_cost / qty);
    const roi_pct               = total_cost_all > 0 ? ((net_profit / total_cost_all) * 100).toFixed(1) : '0';
    const profitability         = net_profit > total_storage_cost * 0.5 ? 'YES' : net_profit > 0 ? 'MARGINAL' : 'NO';
    const viable                = months <= bagSpec.max_months;

    const margin_kg = (sellPriceKg - prodCostKg - total_storage_cost / qty).toFixed(1);
    const advice = !viable
      ? `⚠️ ${BAG_META[costForm.bag_type]?.label} bags are only suitable up to ${bagSpec.max_months} months. Switch to hermetic or metal bin for longer storage.`
      : net_profit > 0
        ? `Your margin is Rs. ${margin_kg}/kg. Selling ${qty} kg of ${costForm.variety} at Rs. ${sellPriceKg}/kg after ${months} months gives Rs. ${net_profit.toLocaleString()} net profit after all costs.`
        : `Selling price (Rs. ${sellPriceKg}/kg) does not cover production cost (Rs. ${prodCostKg}/kg) + storage cost (Rs. ${(total_storage_cost/qty).toFixed(1)}/kg). Try to negotiate a higher selling price or reduce storage costs.`;

    setTimeout(async () => {
      const result = {
        bags_required: bags_n, effective_bag_cost, maint_cost, rent_cost,
        fumigation_cost, labour_cost, insurance_cost, total_storage_cost,
        total_production_cost, total_cost_all,
        cost_per_kg, sell_now_value: total_production_cost, sell_peak_value: sell_revenue,
        net_profit, break_even_price, roi_pct, profitability,
        ai_economic_verdict: advice, viable,
        prod_cost_kg: prodCostKg, selling_price_kg: sellPriceKg,
        daily_maint_used: dailyMaint, duration_months: months,
      };

      // Call LLM for enriched AI advice
      try {
        const llmBody = {
          quantity_kg: qty, variety: costForm.variety, bag_type: costForm.bag_type,
          duration_months: months, storage_location: costForm.storage_location,
          production_cost_kg: prodCostKg, selling_price_kg: sellPriceKg,
          total_storage_cost, net_profit, profitability,
          break_even_price, cost_per_kg, roi_pct, lang,
        };
        const llmRes = await apiPost('/api/guardian/calculate_costs', llmBody);
        if (llmRes && !llmRes.error && llmRes.ai_economic_verdict) {
          result.ai_economic_verdict = llmRes.ai_economic_verdict;
        }
      } catch (_) { /* keep local advice if API fails */ }

      setCostResult(result);
      setLoadingCost(false);
    }, 0);
  };

  const computeRecommend = async () => {
    setLoadingRec(true); setRecResult(null);
    try {
      const data = await apiPost('/api/guardian/recommend_storage', { ...recForm, lang });
      if (data.error) Alert.alert('Error', data.error); else setRecResult(data);
    } catch { Alert.alert('Error', 'Could not compute recommendation.'); }
    finally { setLoadingRec(false); }
  };

  // ─── Render Risk Tab ──────────────────────────────────────────────────────
  const renderRiskTab = () => (
    <View style={st.card}>
      <SectionHeader icon="shield-search" color={C.green} title={tx.riskTitle} sub={tx.riskSub} />

      {/* District */}
      <View style={{ marginBottom: 16 }}>
        <Text style={st.fieldLabel}>{tx.district}</Text>
        <TouchableOpacity style={st.pickerBtn} onPress={() => setShowDistrictPicker(true)}>
          <MaterialCommunityIcons name="map-marker" size={16} color={C.green} />
          <Text style={st.pickerBtnTxt}>{selectedDistrict ? selectedDistrict.label : '— Select district —'}</Text>
          {selectedDistrict && (
            <View style={st.tempBadge}><Text style={st.tempBadgeTxt}>🌡 {selectedDistrict.avgTemp}°C</Text></View>
          )}
          <MaterialCommunityIcons name="chevron-down" size={16} color={C.grey5} />
        </TouchableOpacity>
        {selectedDistrict && (
          <Text style={st.hintText}>📊 {selectedDistrict.label} avg temp: {selectedDistrict.avgTemp}°C — auto applied</Text>
        )}
      </View>


      <ChipGroup label={tx.storageBagType}
        options={Object.entries(BAG_META).map(([v, m]) => ({ value: v, label: m.label, icon: m.icon }))}
        value={riskForm.bag_type} onChange={(v) => setRiskForm({ ...riskForm, bag_type: v })} color={C.green} />

      {BAG_META[riskForm.bag_type] && (
        <View style={[st.bagDescBox, { borderColor: BAG_META[riskForm.bag_type].color + '40' }]}>
          <MaterialCommunityIcons name={BAG_META[riskForm.bag_type].icon} size={16} color={BAG_META[riskForm.bag_type].color} />
          <Text style={[st.bagDescTxt, { color: BAG_META[riskForm.bag_type].color }]}>{BAG_META[riskForm.bag_type].desc}</Text>
        </View>
      )}

      {/* Duration */}
      <View style={{ marginBottom: 16 }}>
        <Text style={st.fieldLabel}>{tx.howLongStore}</Text>
        <View style={st.chipRow}>
          {[{ value: 1, label: tx.month1 }, { value: 2, label: tx.month2 }, { value: 3, label: tx.month3 }, { value: 6, label: tx.month6 }].map((opt) => (
            <TouchableOpacity key={opt.value}
              style={[st.chip, riskForm.duration_months === opt.value && { backgroundColor: C.green, borderColor: C.green }]}
              onPress={() => setRiskForm({ ...riskForm, duration_months: opt.value })}>
              <Text style={[st.chipTxt, riskForm.duration_months === opt.value && { color: C.white }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[st.chip, { borderColor: C.purple, borderWidth: 2 }, riskForm.duration_months > 6 && { backgroundColor: C.purple, borderColor: C.purple }]}
            onPress={() => setRiskForm({ ...riskForm, duration_months: 9 })}>
            <MaterialCommunityIcons name="clock-plus" size={12} color={riskForm.duration_months > 6 ? C.white : C.purple} style={{ marginRight: 3 }} />
            <Text style={[st.chipTxt, { color: riskForm.duration_months > 6 ? C.white : C.purple }]}>{tx.month6plus}</Text>
          </TouchableOpacity>
        </View>
        {riskForm.duration_months > 6 && (
          <Text style={[st.hintText, { color: C.purple }]}>⚠️ Long-term: hermetic bags or metal bins recommended</Text>
        )}
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={st.fieldLabel}>{tx.qty}</Text>
        <TextInput style={st.fullInput} keyboardType="numeric" value={String(riskForm.quantity_kg)}
          onChangeText={(v) => setRiskForm({ ...riskForm, quantity_kg: parseFloat(v) || 1000 })} placeholder="e.g. 2000" />
      </View>

      <ChipGroup label={tx.storageLoc}
        options={Object.entries(LOCATION_META).map(([v, m]) => ({ value: v, label: m.label, icon: m.icon }))}
        value={riskForm.storage_location} onChange={(v) => setRiskForm({ ...riskForm, storage_location: v })} color={C.blue} />

      <ChipGroup label={tx.pestHistory}
        options={[{ value: false, label: tx.noPest, icon: 'check-circle-outline' }, { value: true, label: tx.yesPest, icon: 'alert-outline' }]}
        value={riskForm.has_pest_history} onChange={(v) => setRiskForm({ ...riskForm, has_pest_history: v })} color={C.red} />

      <TouchableOpacity style={[st.primaryBtn, { backgroundColor: C.green }]} onPress={computeRisk} disabled={loadingRisk}>
        {loadingRisk
          ? <><ActivityIndicator color={C.white} /><Text style={st.primaryBtnTxt}> {tx.analysing}</Text></>
          : <><MaterialCommunityIcons name="shield-search" size={18} color={C.white} /><Text style={st.primaryBtnTxt}> {tx.computeRisk}</Text></>}
      </TouchableOpacity>

      {riskResult ? <RiskResultPanel data={riskResult} tx={tx} /> : null}
    </View>
  );

  // ─── Render Cost Tab ──────────────────────────────────────────────────────
  const renderCostTab = () => (
    <View style={st.card}>
      <SectionHeader icon="calculator" color={C.blue} title={tx.ecoTitle} sub={tx.ecoSub} />

      <View style={{ marginBottom: 16 }}>
        <Text style={st.fieldLabel}>{tx.qty}</Text>
        <TextInput style={st.fullInput} keyboardType="numeric" value={String(costForm.quantity_kg)}
          onChangeText={(v) => setCostForm({ ...costForm, quantity_kg: v })} placeholder="e.g. 2000" />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={st.fieldLabel}>🌾 {tx.riceVariety}</Text>
        <TouchableOpacity style={st.pickerBtn} onPress={() => setShowVarietyPicker(true)}>
          <MaterialCommunityIcons name="grain" size={16} color={C.blue} />
          <Text style={st.pickerBtnTxt}>{costForm.variety || 'Select variety'}</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={C.grey5} />
        </TouchableOpacity>
      </View>

      <ChipGroup label={tx.storageBagType}
        options={Object.entries(BAG_META).map(([v, m]) => ({ value: v, label: m.label }))}
        value={costForm.bag_type} onChange={(v) => setCostForm({ ...costForm, bag_type: v })} color={C.blue} />

      <View style={{ marginBottom: 16 }}>
        <Text style={st.fieldLabel}>{tx.duration}</Text>
        <View style={st.chipRow}>
          {[{ value: 1, label: tx.month1 }, { value: 2, label: tx.month2 }, { value: 3, label: tx.month3 }, { value: 6, label: tx.month6 }].map((opt) => (
            <TouchableOpacity key={opt.value}
              style={[st.chip, costForm.duration_months === opt.value && { backgroundColor: C.blue, borderColor: C.blue }]}
              onPress={() => setCostForm({ ...costForm, duration_months: opt.value })}>
              <Text style={[st.chipTxt, costForm.duration_months === opt.value && { color: C.white }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[st.chip, { borderColor: C.purple, borderWidth: 2 }, costForm.duration_months > 6 && { backgroundColor: C.purple, borderColor: C.purple }]}
            onPress={() => setCostForm({ ...costForm, duration_months: 9 })}>
            <MaterialCommunityIcons name="clock-plus" size={12} color={costForm.duration_months > 6 ? C.white : C.purple} style={{ marginRight: 3 }} />
            <Text style={[st.chipTxt, { color: costForm.duration_months > 6 ? C.white : C.purple }]}>{tx.month6plus}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ChipGroup label={tx.storageLoc}
        options={Object.entries(LOCATION_META).map(([v, m]) => ({ value: v, label: m.label }))}
        value={costForm.storage_location} onChange={(v) => setCostForm({ ...costForm, storage_location: v })} color={C.blue} />

      {/* Daily maintenance cost */}
      <View style={{ marginBottom: 20 }}>
        <Text style={st.fieldLabel}>🔧 {tx.dailyMaintCost}</Text>
        <TextInput
          style={st.fullInput}
          keyboardType="decimal-pad"
          value={costForm.daily_maintenance_cost}
          onChangeText={(v) => setCostForm({ ...costForm, daily_maintenance_cost: v })}
          placeholder="e.g. 150  (Rs. per day)"
        />
        <View style={st.hintBox}>
          <Text style={st.hintText}>💡 {tx.dailyMaintHint}</Text>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={st.fieldLabel}>🌱 {tx.productionCost}</Text>
        <TextInput style={st.fullInput} keyboardType="decimal-pad" value={costForm.production_cost_kg}
          onChangeText={(v) => setCostForm({ ...costForm, production_cost_kg: v })} placeholder="e.g. 85  (Rs. per kg)" />
        <View style={st.hintBox}>
          <Text style={st.hintText}>{tx.productionCostHint}</Text>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={st.fieldLabel}>💰 {tx.sellingPrice}</Text>
        <TextInput style={st.fullInput} keyboardType="decimal-pad" value={costForm.selling_price}
          onChangeText={(v) => setCostForm({ ...costForm, selling_price: v })} placeholder="e.g. 125  (Rs. per kg)" />
        <View style={st.hintBox}>
          <Text style={st.hintText}>{tx.sellingPriceHint}</Text>
        </View>
      </View>

      <TouchableOpacity style={[st.primaryBtn, { backgroundColor: C.blue }]} onPress={computeCost} disabled={loadingCost}>
        {loadingCost
          ? <><ActivityIndicator color={C.white} /><Text style={st.primaryBtnTxt}> {tx.calculating}</Text></>
          : <><MaterialCommunityIcons name="calculator" size={18} color={C.white} /><Text style={st.primaryBtnTxt}> {tx.calcEco}</Text></>}
      </TouchableOpacity>

      {costResult ? <CostResultPanel data={costResult} tx={tx} /> : null}
    </View>
  );

  // ─── Render Recommend Tab ─────────────────────────────────────────────────
  const renderRecommendTab = () => (
    <View style={st.card}>
      <SectionHeader color={C.purple} title={tx.recTitle} sub={tx.recSub} />

      <View style={{ marginBottom: 16 }}>
        <Text style={st.fieldLabel}>{tx.qty}</Text>
        <TextInput style={st.fullInput} keyboardType="numeric" value={String(recForm.quantity_kg)}
          onChangeText={(v) => setRecForm({ ...recForm, quantity_kg: parseFloat(v) || 1000 })} placeholder="e.g. 5000" />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={st.fieldLabel}> {tx.riceVariety}</Text>
        <TouchableOpacity style={st.pickerBtn} onPress={() => setRecShowVarietyPicker(true)}>
          <MaterialCommunityIcons name="grain" size={16} color={C.purple} />
          <Text style={st.pickerBtnTxt}>{recForm.variety || 'Select variety'}</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={C.grey5} />
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={st.fieldLabel}>{tx.howLongStore}</Text>
        <View style={st.chipRow}>
          {[{ value: 1, label: tx.month1 }, { value: 3, label: tx.month3 }, { value: 6, label: tx.month6 }, { value: 9, label: tx.month9 }].map((opt) => (
            <TouchableOpacity key={opt.value}
              style={[st.chip, recForm.duration_months === opt.value && { backgroundColor: C.purple, borderColor: C.purple }]}
              onPress={() => setRecForm({ ...recForm, duration_months: opt.value })}>
              <Text style={[st.chipTxt, recForm.duration_months === opt.value && { color: C.white }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[st.chip, { borderColor: C.amber, borderWidth: 2 }, recForm.duration_months > 9 && { backgroundColor: C.amber, borderColor: C.amber }]}
            onPress={() => setRecForm({ ...recForm, duration_months: 12 })}>
            <MaterialCommunityIcons name="clock-plus" size={12} color={recForm.duration_months > 9 ? C.white : C.amber} style={{ marginRight: 3 }} />
            <Text style={[st.chipTxt, { color: recForm.duration_months > 9 ? C.white : C.amber }]}>{tx.month12}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={st.fieldLabel}>{tx.estTemp}</Text>
        <TextInput style={st.fullInput} keyboardType="decimal-pad" value={String(recForm.temp_c)}
          onChangeText={(v) => setRecForm({ ...recForm, temp_c: parseFloat(v) || 28 })} placeholder="28" />
      </View>
      <TouchableOpacity style={[st.primaryBtn, { backgroundColor: C.purple }]} onPress={computeRecommend} disabled={loadingRec}>
        {loadingRec
          ? <><ActivityIndicator color={C.white} /><Text style={st.primaryBtnTxt}> {tx.aiThinking}</Text></>
          : <><MaterialCommunityIcons name="lightbulb-on" size={18} color={C.white} /><Text style={st.primaryBtnTxt}> {tx.getAIRec}</Text></>}
      </TouchableOpacity>

      {recResult ? <RecommendResultPanel data={recResult} tx={tx} /> : null}
    </View>
  );

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* District Picker Modal */}
      <Modal visible={showDistrictPicker} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalSheet}>
            <View style={st.modalTop}>
              <Text style={st.modalTopTitle}> {tx.district}</Text>
              <TouchableOpacity onPress={() => setShowDistrictPicker(false)}>
                <MaterialCommunityIcons name="close" size={22} color={C.grey6} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {SL_DISTRICTS.map((d) => (
                <TouchableOpacity key={d.value}
                  style={[st.pickerItem, selectedDistrict?.value === d.value && { backgroundColor: C.greenLight }]}
                  onPress={() => { setSelectedDistrict(d); setRiskForm(f => ({ ...f, temp_c: d.avgTemp, district: d.value })); setShowDistrictPicker(false); }}>
                  <Text style={[st.pickerItemTxt, selectedDistrict?.value === d.value && { color: C.green, fontWeight: '800' }]}>{d.label}</Text>
                  <View style={st.tempBadge}><Text style={st.tempBadgeTxt}>🌡 {d.avgTemp}°C</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Variety Pickers */}
      {[
        { visible: showVarietyPicker, onClose: () => setShowVarietyPicker(false), activeVal: costForm.variety, onSelect: (v) => { setCostForm(f => ({ ...f, variety: v })); setShowVarietyPicker(false); }, activeBg: C.blueLight, activeColor: C.blue },
        { visible: recShowVarietyPicker, onClose: () => setRecShowVarietyPicker(false), activeVal: recForm.variety, onSelect: (v) => { setRecForm(f => ({ ...f, variety: v })); setRecShowVarietyPicker(false); }, activeBg: C.purpleLight, activeColor: C.purple },
      ].map((m, idx) => (
        <Modal key={idx} visible={m.visible} transparent animationType="slide">
          <View style={st.modalOverlay}>
            <View style={st.modalSheet}>
              <View style={st.modalTop}>
                <Text style={st.modalTopTitle}>{tx.riceVariety}</Text>
                <TouchableOpacity onPress={m.onClose}><MaterialCommunityIcons name="close" size={22} color={C.grey6} /></TouchableOpacity>
              </View>
              <ScrollView>
                {RICE_VARIETIES.map((v) => (
                  <TouchableOpacity key={v} style={[st.pickerItem, m.activeVal === v && { backgroundColor: m.activeBg }]}
                    onPress={() => m.onSelect(v)}>
                    <Text style={[st.pickerItemTxt, m.activeVal === v && { color: m.activeColor, fontWeight: '800' }]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ))}

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}>
        <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[C.green]} />}>

        {/* Language bar */}
        <View style={st.langBar}>
          <MaterialCommunityIcons name="translate" size={16} color={C.grey5} />
          {['en', 'si', 'ta'].map((l) => (
            <TouchableOpacity key={l} style={[st.langBtn, lang === l && { backgroundColor: C.green }]} onPress={() => setLang(l)}>
              <Text style={[st.langBtnTxt, lang === l && { color: C.white }]}>{T[l].lang}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Header */}
        <View style={st.header}>
          <View>
            <Text style={st.headerTitle}>{tx.storageCenter}</Text>
            <Text style={st.headerSub}>{tx.postHarvest}</Text>
          </View>
          <TouchableOpacity style={st.headerBtn} onPress={() => navigation.navigate('InventoryList')}>
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color={C.green} />
          </TouchableOpacity>
        </View>

        {/* Asset card */}
        <LinearGradient colors={['#16a34a', '#065f46']} style={st.assetCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={st.assetTop}>
            <View>
              <Text style={st.assetLabel}>{tx.totalPaddyValue}</Text>
              <Text style={st.assetValue}>Rs. {totals.value}</Text>
            </View>
            <MaterialCommunityIcons name="grain" size={40} color="rgba(255,255,255,0.25)" />
          </View>
          <View style={st.assetStats}>
            {[{ val: totals.kg, lbl: tx.kgStored }, { val: totals.bags, lbl: tx.totalBags }, { val: harvests.length, lbl: tx.batches }].map((item, i) => (
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
            { label: tx.addStock, icon: 'plus-circle', color: C.green, bg: C.greenLight, nav: 'RegisterHarvest' },
            { label: tx.market, icon: 'trending-up', color: C.blue, bg: C.blueLight, nav: 'MarketTracking' },
            { label: tx.aiChat, icon: 'chat-processing', color: C.purple, bg: C.purpleLight, nav: 'BeginnerStorageGuide' },
            { label: tx.inventory, icon: 'clipboard-list', color: C.amber, bg: C.amberLight, nav: 'InventoryList' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={st.quickItem} onPress={() => navigation.navigate(item.nav)}>
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
            { key: 'risk', icon: 'shield-search', label: tx.riskScore, color: C.green },
            { key: 'cost', icon: 'calculator', label: tx.economics, color: C.blue },
            { key: 'recommend', icon: 'lightbulb-on', label: tx.recommend, color: C.purple },
            { key: 'seed', icon: 'seed', label: tx.productionCostTab || 'Production Cost', color: C.orange },
          ].map((tab) => (
            <TouchableOpacity key={tab.key}
              style={[st.tabBtn, activeTab === tab.key && { borderBottomWidth: 2.5, borderBottomColor: tab.color, backgroundColor: tab.color + '08' }]}
              onPress={() => setActiveTab(tab.key)}>
              <MaterialCommunityIcons name={tab.icon} size={18} color={activeTab === tab.key ? tab.color : C.grey4} />
              <Text style={[st.tabTxt, { color: activeTab === tab.key ? tab.color : C.grey4 }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'risk' && renderRiskTab()}
        {activeTab === 'cost' && renderCostTab()}
        {activeTab === 'recommend' && renderRecommendTab()}
        {activeTab === 'seed' && <SeedProductionCalculator tx={tx} lang={lang} apiPost={apiPost} />}

        {/* Harvest batches */}
        <View style={st.batchSectionHeader}>
          <Text style={st.sectionTitle}>{tx.activeBatches}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RegisterHarvest')}>
            <Text style={{ color: C.green, fontSize: 13, fontWeight: '700' }}>{tx.addNew}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={C.green} style={{ marginVertical: 40 }} />
        ) : harvests.length === 0 ? (
          <View style={st.emptyState}>
            <MaterialCommunityIcons name="warehouse" size={56} color={C.grey3} />
            <Text style={st.emptyTitle}>{tx.noBatches}</Text>
            <Text style={st.emptySub}>{tx.registerFirst}</Text>
            <TouchableOpacity style={[st.primaryBtn, { marginTop: 16, paddingHorizontal: 32 }]}
              onPress={() => navigation.navigate('RegisterHarvest')}>
              <Text style={st.primaryBtnTxt}>{tx.registerHarvest}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          locations.map((loc) => {
            const batches = harvests.filter((h) => h.locationId === loc.id || h.locationName === loc.locationName);
            if (batches.length === 0) return null;
            return (
              <View key={loc.id} style={st.locSection}>
                <View style={st.locHeader}>
                  <View style={[st.locIconBox, { backgroundColor: C.greenLight }]}>
                    <MaterialCommunityIcons name="warehouse" size={18} color={C.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.locName}>{String(loc.locationName || '').toUpperCase()}</Text>
                    <Text style={st.locSub}>{loc.storageType} • {loc.storageArea} {loc.areaUnit}</Text>
                  </View>
                  <TouchableOpacity style={st.viewBtn}
                    onPress={() => navigation.navigate('WarehouseAnalysis', { locationId: loc.id })}>
                    <Text style={st.viewBtnTxt}>VIEW →</Text>
                  </TouchableOpacity>
                </View>
                {batches.map((item) => (
                  <BatchCard key={item.id} item={item} navigation={navigation} location={location} locData={loc} />
                ))}
              </View>
            );
          })
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
      </KeyboardAvoidingView>
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
  secHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 },
  secIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  secTitle: { fontSize: 17, fontWeight: '900', color: C.ink },
  secSub: { fontSize: 12, color: C.grey5, marginTop: 1 },

  // Card
  card: { backgroundColor: C.white, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: C.grey1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },

  // Fields
  fieldLabel: { color: C.grey8, fontSize: 13, fontWeight: '800', marginBottom: 8, letterSpacing: 0.4 },
  fullInput: { borderWidth: 1, borderColor: C.grey2, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, color: C.ink, fontSize: 16, fontWeight: '700', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  compactInput: { borderWidth: 1, borderColor: C.grey2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: C.white, color: C.ink, fontSize: 15, fontWeight: '700', width: 110, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  hintBox: { marginTop: 8, marginBottom: 0, paddingHorizontal: 2 },
  hintText: { fontSize: 11, color: C.grey5, lineHeight: 16 },
  hintSmall: { fontSize: 11, color: C.grey5, marginBottom: 10 },

  // Moisture
  moistureBox: { backgroundColor: C.grey0, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.grey2 },
  mcRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mcChip: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.grey2, alignItems: 'center', minWidth: 46 },
  mcChipTxt: { fontSize: 13, fontWeight: '800', color: C.grey6 },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.grey2, backgroundColor: C.white, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  chipTxt: { fontSize: 13, fontWeight: '800', color: C.grey6 },

  bagDescBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 16, backgroundColor: C.grey0 },
  bagDescTxt: { fontSize: 12, fontWeight: '600', flex: 1 },

  // Button
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 18, marginTop: 16, gap: 8, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  primaryBtnTxt: { color: C.white, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  // ── RESULT WRAPPER ───────────────────────────────────────────────────────
  resultWrapper: { marginTop: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.grey2, backgroundColor: C.white, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { height: 6, width: 0 } },

  // Decorative circles in hero
  decCircle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
  decCircle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 10 },

  // ── RISK HERO ─────────────────────────────────────────────────────────────
  riskHero: { padding: 22, paddingBottom: 26, overflow: 'hidden' },
  riskHeroContent: { flexDirection: 'row', alignItems: 'center' },
  riskBadgeHero: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1, alignSelf: 'center' },
  riskBadgeHeroTxt: { color: C.white, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  riskHeroVerdict: { fontSize: 15, fontWeight: '800', color: 'rgba(255,255,255,0.95)', lineHeight: 22 },

  // ── SAFE LIFE ROW ─────────────────────────────────────────────────────────
  safeLifeRow: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: C.grey1 },
  safeLifeIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  safeLifeLabel: { fontSize: 11, fontWeight: '800', color: C.grey5, letterSpacing: 0.5, marginBottom: 4 },
  safeLifeVal: { fontSize: 15, fontWeight: '700', color: C.ink },
  gradePillLarge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  gradePillLargeTxt: { color: C.white, fontSize: 16, fontWeight: '900' },

  // ── FACTORS SECTION ───────────────────────────────────────────────────────
  factorsSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: C.grey1 },
  factorsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  factorsSectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  factorPremiumCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.grey0, borderRadius: 14, overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: C.grey2 },
  factorPremiumLeft: { width: 44, height: 52, justifyContent: 'center', alignItems: 'center' },
  factorPremiumName: { fontSize: 13, fontWeight: '800', color: C.ink },
  factorPremiumDetail: { fontSize: 11, color: C.grey5, marginTop: 2, lineHeight: 16 },
  deductionBadge: { marginRight: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  deductionTxt: { fontSize: 14, fontWeight: '900' },

  // ── ACTION CALLOUTS ───────────────────────────────────────────────────────
  actionCallout: { margin: 16, marginTop: 0, borderRadius: 16, padding: 16, borderWidth: 1, borderLeftWidth: 5 },
  actionCalloutHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  actionCalloutIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actionCalloutTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.8, flex: 1 },
  actionCalloutBody: { fontSize: 14, color: C.grey8, lineHeight: 22, fontWeight: '600' },
  lossEstimateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' },
  lossEstimateLabel: { fontSize: 12, color: C.grey6, fontWeight: '700' },
  lossEstimateVal: { fontSize: 18, fontWeight: '900' },

  // ── ECO HERO ──────────────────────────────────────────────────────────────
  ecoHero: { padding: 22, overflow: 'hidden' },
  ecoHeroContent: { flexDirection: 'row', alignItems: 'center' },
  ecoHeroIconCircle: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  ecoHeroBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  ecoHeroBadgeTxt: { color: C.white, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  ecoHeroVerdict: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.95)', lineHeight: 20 },

  // ── PRICE COMPARE ─────────────────────────────────────────────────────────
  priceCompareCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: C.grey1 },
  priceCompareItem: { flex: 1, alignItems: 'center', gap: 6 },
  priceCompareIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.grey1, justifyContent: 'center', alignItems: 'center' },
  priceCompareLabel: { fontSize: 10, fontWeight: '800', color: C.grey5, letterSpacing: 0.5, textAlign: 'center' },
  priceCompareValueNeutral: { fontSize: 17, fontWeight: '800', color: C.grey6 },
  priceCompareValueBold: { fontSize: 20, fontWeight: '900' },
  priceArrow: { width: 40, alignItems: 'center' },

  // ── NET PROFIT HERO ───────────────────────────────────────────────────────
  netProfitHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 },
  netProfitLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '900', letterSpacing: 1 },
  netProfitValue: { fontSize: 28, color: C.white, fontWeight: '900', letterSpacing: -0.5, flex: 1, textAlign: 'center' },

  // ── COST BREAKDOWN ────────────────────────────────────────────────────────
  costBreakdownCard: { margin: 16, backgroundColor: C.grey0, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.grey2 },
  costBreakdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  costBreakdownTitle: { fontSize: 14, fontWeight: '900', color: C.ink, flex: 1 },
  bagsBadge: { backgroundColor: C.blueLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bagsBadgeTxt: { fontSize: 11, fontWeight: '800', color: C.blue },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.grey2 },
  costRowIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  costRowLabel: { flex: 1, fontSize: 13, color: C.grey7, fontWeight: '600' },
  costRowValue: { fontSize: 14, fontWeight: '800', color: C.ink },
  costDivider: { height: 1.5, backgroundColor: C.grey3, marginVertical: 12 },
  costTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  costTotalLabel: { fontSize: 14, fontWeight: '900', color: C.ink },
  costTotalValue: { fontSize: 20, fontWeight: '900' },
  costPerKgBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  costPerKgTxt: { fontSize: 13, fontWeight: '700' },
  plannerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12, gap: 8 },
  plannerBtnTxt: { color: C.white, fontSize: 13, fontWeight: '900' },

  // ── BREAK EVEN ────────────────────────────────────────────────────────────
  breakEvenPremium: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 16, marginTop: 0, padding: 16, backgroundColor: C.grey0, borderRadius: 14, borderWidth: 1, borderColor: C.grey2 },
  breakEvenLeft: { flexDirection: 'row', alignItems: 'center' },
  breakEvenTitle: { fontSize: 11, fontWeight: '800', color: C.grey5, letterSpacing: 0.5 },
  breakEvenSub: { fontSize: 16, fontWeight: '900', color: C.ink },
  roiBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  roiTxt: { fontSize: 15, fontWeight: '900' },

  // AI warning
  aiWarnRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.redLight, padding: 10, borderRadius: 10, marginTop: 12, gap: 8 },
  aiWarnTxt: { fontSize: 13, color: C.red, fontWeight: '800', flex: 1 },

  // ── RECOMMEND HERO ────────────────────────────────────────────────────────
  recHero: { padding: 24, overflow: 'hidden' },
  recHeroContent: { flexDirection: 'row', alignItems: 'center' },
  recHeroIconBox: { width: 76, height: 76, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  recHeroEyebrow: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '900', letterSpacing: 1.2, marginBottom: 4 },
  recHeroName: { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  recHeroHeadline: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 19, marginTop: 4, fontWeight: '600' },

  // ── OPTIONS ───────────────────────────────────────────────────────────────
  optionsSection: { padding: 16 },
  optionsSectionTitle: { fontSize: 12, fontWeight: '900', color: C.grey6, letterSpacing: 0.5, marginBottom: 12 },
  optionPremiumCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.grey2, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  optionFaded: { opacity: 0.45 },
  optionPremiumIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  optionPremiumName: { fontSize: 15, fontWeight: '800', color: C.ink },
  optionPremiumMeta: { fontSize: 11, color: C.grey5, marginTop: 3, fontWeight: '600' },
  optionPremiumProfit: { fontSize: 16, fontWeight: '900' },
  optionPremiumProfitLabel: { fontSize: 9, color: C.grey5, fontWeight: '700', textAlign: 'right' },
  recBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  recBadgeTxt: { fontSize: 9, fontWeight: '900', color: C.white, letterSpacing: 0.3 },

  // ── STEPS SECTION ─────────────────────────────────────────────────────────
  stepsSection: { padding: 16, paddingTop: 0 },
  stepsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  stepsSectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  stepPremiumRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  stepPremiumNum: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2 },
  stepPremiumNumTxt: { color: C.white, fontSize: 14, fontWeight: '900' },
  stepPremiumBubble: { flex: 1, backgroundColor: C.grey0, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.grey2 },
  stepPremiumTxt: { fontSize: 13, color: C.grey8, lineHeight: 20, fontWeight: '600' },

  // ── WHERE TO BUY ─────────────────────────────────────────────────────────
  whereToBuyCard: { margin: 16, marginTop: 0, borderRadius: 16, padding: 16, borderWidth: 1, overflow: 'hidden' },
  whereToBuyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  whereToBuyTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  whereToBuyBody: { fontSize: 13, color: C.grey7, lineHeight: 21, fontWeight: '600' },

  // ── BATCHES ───────────────────────────────────────────────────────────────
  batchSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.ink },
  locSection: { marginBottom: 16 },
  locHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  locIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  locName: { fontSize: 13, fontWeight: '800', color: C.grey7, letterSpacing: 0.5 },
  locSub: { fontSize: 11, color: C.grey4, marginTop: 1 },
  viewBtn: { backgroundColor: C.greenLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  viewBtnTxt: { color: C.green, fontSize: 10, fontWeight: '800' },
  batchCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, backgroundColor: C.white, elevation: 3, shadowColor: '#16a34a', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { height: 4, width: 0 }, overflow: 'hidden' },
  batchLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  batchIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  batchVariety: { fontSize: 16, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },
  batchMeta: { fontSize: 12, color: C.grey6, marginTop: 2 },
  batchRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  riskPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  riskPillTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  editBtnPremium: { padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: C.grey2 },
  emptyState: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.grey7, marginTop: 16 },
  emptySub: { fontSize: 13, color: C.grey4, marginTop: 4, textAlign: 'center' },

  // Language bar
  langBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, backgroundColor: C.white, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: C.grey2 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: C.grey1 },
  langBtnTxt: { fontSize: 12, fontWeight: '700', color: C.grey6 },

  // Picker
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.grey2, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  pickerBtnTxt: { flex: 1, fontSize: 15, fontWeight: '700', color: C.ink },
  tempBadge: { backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tempBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#92400e' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingBottom: 30 },
  modalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.grey2 },
  modalTopTitle: { fontSize: 16, fontWeight: '800', color: C.ink },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.grey1 },
  pickerItemTxt: { fontSize: 15, color: C.ink, fontWeight: '500' },
});