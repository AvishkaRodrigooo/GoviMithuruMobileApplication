import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const GEMINI_API_KEY = 'AIzaSyD3f0os2ci9v_zydmXuItLWYutbbnCDEVM'; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const AIPestAssistantScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [language, setLanguage] = useState('en'); // 'en' or 'si'
  const [apiMode, setApiMode] = useState('hybrid'); // 'local', 'hybrid', 'api'
  const [apiAvailable, setApiAvailable] = useState(true);
  const scrollViewRef = useRef(null);

  // Get pest data from route params if coming from detection
  const detectedPest = route.params?.detectedPest;

  // Load settings
  useEffect(() => {
    loadSettings();
    checkApiAvailability();
  }, []);

  const loadSettings = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('apiMode');
      if (savedMode) setApiMode(savedMode);
      
      const savedLanguage = await AsyncStorage.getItem('assistantLanguage');
      if (savedLanguage) setLanguage(savedLanguage);
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const checkApiAvailability = async () => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      await model.generateContent('test');
      setApiAvailable(true);
    } catch (error) {
      console.log('Gemini API not available:', error);
      setApiAvailable(false);
      // Auto-switch to local mode if API fails
      if (apiMode !== 'local') {
        setApiMode('local');
        AsyncStorage.setItem('apiMode', 'local');
      }
    }
  };

  // Initialize welcome message based on language and mode
  useEffect(() => {
    const welcomeMessage = getWelcomeMessage();
    setMessages([{
      id: 1,
      text: welcomeMessage,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, [language, apiMode, apiAvailable]);

  const getWelcomeMessage = () => {
    if (language === 'en') {
      if (!apiAvailable) {
        return "🌾 Hi! I'm your AI Pest Assistant. (Running in offline mode - API not available) Ask me about pest management, fertilizers, or crop protection!";
      }
      if (apiMode === 'api') {
        return "🌾 Hi! I'm your AI Pest Assistant powered by Google Gemini AI. I can answer any farming question with detailed, accurate information!";
      } else if (apiMode === 'hybrid') {
        return "🌾 Hi! I'm your AI Pest Assistant. I'll use my built-in knowledge first, then Google Gemini AI for complex questions!";
      } else {
        return "🌾 Hi! I'm your AI Pest Assistant (Offline Mode). Ask me about pest management, fertilizers, crop diseases, or farming practices!";
      }
    } else {
      if (!apiAvailable) {
        return "🌾 ආයුබෝවන්! මම ඔබේ AI පළිබෝධ සහායකයි. (අන්තර්ජාලයෙන් තොරව - API ලබා ගත නොහැක) පළිබෝධ කළමනාකරණය, පොහොර, හෝ බෝග ආරක්ෂණය ගැන අහන්න!";
      }
      if (apiMode === 'api') {
        return "🌾 ආයුබෝවන්! මම Google Gemini AI බලයෙන් ක්‍රියා කරන ඔබේ AI පළිබෝධ සහායකයි. ඕනෑම ගොවිතැන් ප්‍රශ්නයකට සවිස්තරාත්මක, නිවැරදි තොරතුරු ලබා දිය හැකියි!";
      } else if (apiMode === 'hybrid') {
        return "🌾 ආයුබෝවන්! මම ඔබේ AI පළිබෝධ සහායකයි. මුලින් මගේ ගොඩනගන ලද දැනුමෙන් පිළිතුරු දීමට උත්සාහ කරමි, පසුව Google Gemini AI භාවිතා කරමි!";
      } else {
        return "🌾 ආයුබෝවන්! මම ඔබේ AI පළිබෝධ සහායකයි (අන්තර්ජාලයෙන් තොරව). පළිබෝධ කළමනාකරණය, පොහොර, බෝග රෝග, හෝ ගොවිතැන් පිළිවෙත් ගැන ඕනෑම දෙයක් අහන්න!";
      }
    }
  };

  useEffect(() => {
    if (detectedPest) {
      const pestMessage = language === 'en'
        ? `I see you detected ${detectedPest.class}. Would you like to know more about managing this pest?`
        : `ඔබ ${detectedPest.class} හඳුනාගෙන ඇත. මෙම පළිබෝධය කළමනාකරණය කිරීම ගැන වැඩිදුර දැන ගැනීමට කැමතිද?`;
      
      const pestMsg = {
        id: Date.now(),
        text: pestMessage,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, pestMsg]);
    }
  }, [detectedPest, language]);

  // Comprehensive local knowledge base (keeping your existing knowledge base)
  const knowledgeBase = {
    bph: {
      keywords: {
        en: ['bph', 'brown planthopper', 'brown plant hopper', 'planthopper'],
        si: ['දුඹුරු පැළ මකුණා', 'බීපීඑච්', 'පැළ මකුණා']
      },
      response: {
        en: `🔍 **Brown Planthopper (BPH) Management**

🦗 **Identification:**
• Small brown insects at base of plants
• Causes "hopperburn" - circular yellowing patches
• Plants wilt and dry up like fire damage

🌱 **Cultural Control:**
• Use resistant varieties (BG 379-2, BG 400-1)
• Maintain 2-3cm water level consistently
• Avoid excessive nitrogen fertilizer
• Practice alternate wetting and drying
• Plant in synchrony with neighbors

🛡️ **Biological Control:**
• Conserve natural enemies: spiders, ladybirds, damselflies
• Release predatory insects if available
• Avoid broad-spectrum pesticides early season

🧪 **Chemical Control (if threshold exceeded):**
• Buprofezin 25 SC @ 600 ml/ha
• Pymetrozine 50 WG @ 300 g/ha
• Apply when 5-10 insects per hill
• Rotate chemicals to avoid resistance

📊 **Thresholds:**
• Vegetative stage: 5-10 insects per hill
• Reproductive stage: 10-20 insects per hill

💡 **Pro Tip:** Monitor early morning or evening when BPH are most active at base of plants.`,
        si: `🔍 **දුඹුරු පැළ මකුණා (BPH) කළමනාකරණය**

🦗 **හඳුනාගැනීම:**
• පැළවල පාදමේ කුඩා දුඹුරු කෘමීන්
• "හොපර් පිළිස්සුම" - වටකුරු කහ පැහැති ලප
• පැළ මැලවී ගිනි හානියක් මෙන් වියළී යයි

🌱 **සංස්කෘතික පාලනය:**
• ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න (BG 379-2, BG 400-1)
• නිරන්තරයෙන් සෙ.මී. 2-3ක් ජල මට්ටම පවත්වා ගන්න
• අධික නයිට්‍රජන් පොහොර වළක්වන්න
• විකල්ප තෙත් කිරීම සහ වියළීම පුරුදු කරන්න
• අසල්වැසියන් සමඟ සමමුහුර්තව සිටුවන්න

🛡️ **ජීව විද්‍යාත්මක පාලනය:**
• ස්වභාවික සතුරන් ආරක්ෂා කරන්න: මකුළුවන්, හීන් කුරුමිණියන්
• හැකි නම් විලෝපිත කෘමීන් මුදාහරින්න
• මුල් සමයේ පුළුල් වර්ණාවලී පළිබෝධනාශක වළක්වන්න

🧪 **රසායනික පාලනය (සීමාව ඉක්මවූ විට):**
• බුප්‍රොෆෙසින් 25 SC @ 600 ml/ha
• පයිමෙට්‍රොසීන් 50 WG @ 300 g/ha
• එක් පැළයකට කෘමීන් 5-10ක් ඇති විට යොදන්න
• ප්‍රතිරෝධය වළක්වා ගැනීමට රසායන මාරු කරන්න

📊 **සීමාවන්:**
• පැළ වැවෙන අවධිය: එක් පැළයකට කෘමීන් 5-10
• ප්‍රජනන අවධිය: එක් පැළයකට කෘමීන් 10-20

💡 **උපදෙස්:** පැළවල පාදමේ උදේ හෝ සවස BPH වඩාත් ක්‍රියාකාරී වන විට නිරීක්ෂණය කරන්න.`
      }
    },

    leafFolder: {
      keywords: {
        en: ['leaf folder', 'leaf folder', 'leaf roller', 'caterpillar'],
        si: ['කොළ එතුම් පණුවා', 'කොළ එතුම්', 'දළඹුවා']
      },
      response: {
        en: `🔍 **Rice Leaf Folder Management**

🦗 **Identification:**
• Caterpillars fold leaves longitudinally
• White streaks on folded leaves
• Larvae are green with dark heads
• Adults are small brown moths

🌱 **Cultural Control:**
• Use light traps to monitor adult moths
• Avoid excessive nitrogen fertilizer
• Maintain field hygiene
• Remove and destroy folded leaves
• Practice synchronous planting

🛡️ **Biological Control:**
• Conserve parasitic wasps (Trichogramma)
• Protect spiders and predatory beetles
• Use Trichogramma releases at 50,000/ha
• Apply neem-based products

🧪 **Chemical Control:**
• Chlorantraniliprole 18.5 SC @ 150 ml/ha
• Flubendiamide 20 WG @ 125 g/ha
• Apply at early stage of infestation
• Focus on younger larvae for better control

📊 **Thresholds:**
• Vegetative: 1-2 folded leaves per hill
• Reproductive: 2-3 folded leaves per hill

💡 **Pro Tip:** Look for white streaks on leaves - this is the first sign before leaves are fully folded.`,
        si: `🔍 **වී කොළ එතුම් පණුවා කළමනාකරණය**

🦗 **හඳුනාගැනීම:**
• දළඹුවන් කොළ දිගට නවයි
• නවන ලද කොළ මත සුදු ඉරි
• කීටයන් කොළ පැහැති, අඳුරු හිස් සහිතයි
• වැඩිහිටියන් කුඩා දුඹුරු සලබයන්

🌱 **සංස්කෘතික පාලනය:**
• වැඩිහිටි සලබයන් නිරීක්ෂණයට ආලෝක උගුල් භාවිතා කරන්න
• අධික නයිට්‍රජන් පොහොර වළක්වන්න
• කෙතේ සනීපාරක්ෂාව පවත්වා ගන්න
• නවන ලද කොළ ඉවත් කර විනාශ කරන්න
• සමමුහුර්ත සිටුවීම පුරුදු කරන්න

🛡️ **ජීව විද්‍යාත්මක පාලනය:**
• පරපෝෂිත බඹරුන් ආරක්ෂා කරන්න (ට්‍රයිකොග්‍රෑම්මා)
• මකුළුවන් සහ විලෝපිත කුරුමිණියන් ආරක්ෂා කරන්න
• හෙක්ටයාරයකට 50,000 බැගින් ට්‍රයිකොග්‍රෑම්මා මුදාහරින්න
• නීම් පාදක නිෂ්පාදන යොදන්න

🧪 **රසායනික පාලනය:**
• ක්ලෝරන්ට්‍රනිලිප්‍රෝල් 18.5 SC @ 150 ml/ha
• ෆ්ලුබෙන්ඩියාමයිඩ් 20 WG @ 125 g/ha
• උවදුරේ මුල් අවධියේදී යොදන්න
• වඩා හොඳ පාලනය සඳහා බාල කීටයන් ඉලක්ක කරන්න

📊 **සීමාවන්:**
• පැළ වැවෙන අවධිය: එක් පැළයකට නවන ලද කොළ 1-2
• ප්‍රජනන අවධිය: එක් පැළයකට නවන ලද කොළ 2-3

💡 **උපදෙස්:** කොළ මත සුදු ඉරි සොයන්න - කොළ සම්පූර්ණයෙන් නැවීමට පෙර මෙය පළමු ලකුණයි.`
      }
    },

    paddyBug: {
      keywords: {
        en: ['paddy bug', 'rice bug', 'stink bug', 'grain bug'],
        si: ['වී කූඩැල්ලා', 'වී බග්', 'කූඩැල්ලා']
      },
      response: {
        en: `🔍 **Paddy Bug (Rice Bug) Management**

🦗 **Identification:**
• Shield-shaped brown/green bugs
• Feed on developing grains at milky stage
• Causes empty or discolored grains (pecky rice)
• Adults and nymphs both damage grains

🌱 **Cultural Control:**
• Early planting to avoid peak populations
• Use resistant varieties (BG 94-1, BG 352)
• Maintain field hygiene
• Remove alternate hosts (grassy weeds)
• Synchronize planting with neighbors

🛡️ **Biological Control:**
• Conserve egg parasitoids
• Protect predatory ants and spiders
• Avoid unnecessary insecticide sprays

🧪 **Chemical Control:**
• Apply at heading stage if needed
• Deltamethrin 2.8 EC @ 500 ml/ha
• Lambda-cyhalothrin 5 EC @ 400 ml/ha
• Target early morning or evening when bugs are active

📊 **Thresholds:**
• 2-3 bugs per 10 sweeps at heading
• 5-6 bugs per 10 sweeps during grain filling

💡 **Pro Tip:** Use sweep net to monitor - take 10 sweeps in different field spots and count bugs.`,
        si: `🔍 **වී කූඩැල්ලා කළමනාකරණය**

🦗 **හඳුනාගැනීම:**
• පලිහ හැඩැති දුඹුරු/කොළ පැහැති කෘමීන්
• කිරි අවධියේදී වැඩෙන ධාන්‍ය ආහාරයට ගනී
• හිස් හෝ වර්ණවෙනස් වූ ධාන්‍ය ඇති කරයි
• වැඩිහිටියන් සහ කීටයන් යන දෙකම ධාන්‍ය වලට හානි කරයි

🌱 **සංස්කෘතික පාලනය:**
• උච්ච ජනගහනය වළක්වා ගැනීමට ඉක්මන් සිටුවීම
• ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න (BG 94-1, BG 352)
• කෙතේ සනීපාරක්ෂාව පවත්වා ගන්න
• විකල්ප ධාරක (තෘණ වල් පැළෑටි) ඉවත් කරන්න
• අසල්වැසියන් සමඟ සමමුහුර්ත සිටුවීම

🛡️ **ජීව විද්‍යාත්මක පාලනය:**
• බිත්තර පරපෝෂිතයන් ආරක්ෂා කරන්න
• විලෝපිත කුහුඹුවන් සහ මකුළුවන් ආරක්ෂා කරන්න
• අනවශ්‍ය කෘමිනාශක ඉසීමෙන් වළකින්න

🧪 **රසායනික පාලනය:**
• අවශ්‍ය නම් හිස් දැමීමේ අවධියේදී යොදන්න
• ඩෙල්ටමෙත්‍රින් 2.8 EC @ 500 ml/ha
• ලැම්ඩා-සයිහෙලොත්‍රින් 5 EC @ 400 ml/ha
• කෘමීන් ක්‍රියාකාරී වන උදේ හෝ සවස ඉලක්ක කරන්න

📊 **සීමාවන්:**
• හිස් දැමීමේදී පහර 10කට කෘමීන් 2-3
• ධාන්‍ය පිරවීමේදී පහර 10කට කෘමීන් 5-6

💡 **උපදෙස්:** නිරීක්ෂණයට අතුල්ලන දැලක් භාවිතා කරන්න - කෙතේ විවිධ ස්ථානවල පහර 10ක් ගෙන කෘමීන් ගණන් කරන්න.`
      }
    },

    blast: {
      keywords: {
        en: ['blast', 'rice blast', 'leaf blast', 'neck blast', 'fungal disease'],
        si: ['තුරුණු ලපය', 'වී තුරුණු ලපය', 'කොළ තුරුණු ලපය']
      },
      response: {
        en: `🔍 **Rice Blast Disease Management**

🦠 **Identification:**
• Diamond-shaped spots with gray centers and brown borders
• Spots on leaves, nodes, and panicles
• Neck blast causes panicles to bend and break
• Can affect all above-ground parts

🌱 **Cultural Control:**
• Use resistant varieties (BG 357, BG 358)
• Avoid excessive nitrogen fertilizer
• Maintain proper plant spacing
• Keep fields well-drained
• Remove crop residues after harvest

🧪 **Chemical Control:**
• Tricyclazole 75 WP @ 500 g/ha
• Isoprothiolane 40 EC @ 1.5 L/ha
• Apply at disease onset
• Repeat at 10-14 day intervals if needed

📊 **Favorable Conditions:**
• High humidity (>90%)
• Temperatures 25-28°C
• Frequent rainfall or dew
• Dense canopy with poor air circulation

💡 **Pro Tip:** Monitor nursery beds carefully - early detection is key!`,
        si: `🔍 **වී තුරුණු ලප රෝග කළමනාකරණය**

🦠 **හඳුනාගැනීම:**
• අළු පැහැති මධ්‍යයක් සහ දුඹුරු දාර සහිත දියමන්ති හැඩැති ලප
• කොළ, ගැට, සහ නාළිවල ලප
• ගෙල තුරුණු ලපය නාළි නැමී කැඩී යාමට හේතු වේ
• බිමට ඉහළ සියලුම කොටස් වලට බලපෑ හැක

🌱 **සංස්කෘතික පාලනය:**
• ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න (BG 357, BG 358)
• අධික නයිට්‍රජන් පොහොර වළක්වන්න
• නිසි පැළ පරතරයක් පවත්වා ගන්න
• කෙත හොඳින් ජලය බැස යන සේ තබා ගන්න
• අස්වැන්නෙන් පසු බෝග අපද්‍රව්‍ය ඉවත් කරන්න

🧪 **රසායනික පාලනය:**
• ට්‍රයිසයික්ලාසෝල් 75 WP @ 500 g/ha
• අයිසොප්‍රොතියොලේන් 40 EC @ 1.5 L/ha
• රෝගය ආරම්භයේදී යොදන්න
• අවශ්‍ය නම් දින 10-14 ක පරතරයකින් නැවත යොදන්න

📊 **හිතකර තත්ත්වයන්:**
• ඉහළ ආර්ද්‍රතාව (>90%)
• උෂ්ණත්වය 25-28°C
• නිතර වර්ෂාව හෝ පිනි
• දුර්වල වායු සංසරණය සහිත ඝන වියනක්

💡 **උපදෙස්:** බීජ පැල ආරක්ෂිත ප්‍රදේශ හොඳින් නිරීක්ෂණය කරන්න - මුල් හඳුනාගැනීම ඉතා වැදගත්!`
      }
    },

    sheathBlight: {
      keywords: {
        en: ['sheath blight', 'sheath rot', 'stem rot', 'fungal'],
        si: ['කොපු පිළිස්සුම', 'කොපු කුණුවීම']
      },
      response: {
        en: `🔍 **Sheath Blight Management**

🦠 **Identification:**
• Irregular oval spots on leaf sheaths
• Spots have gray-white centers with brown margins
• Lesions can reach up to 20-30 cm
• Plants lodge easily when infected

🌱 **Cultural Control:**
• Use less susceptible varieties
• Avoid dense planting
• Maintain balanced nitrogen fertilization
• Keep fields weed-free
• Drain fields periodically

🧪 **Chemical Control:**
• Validamycin 3 L @ 2.5 L/ha
• Carbendazim 50 WP @ 500 g/ha
• Apply at booting stage
• Focus on lower parts of plants

📊 **Favorable Conditions:**
• High humidity (>95%)
• Dense crop canopy
• Excessive nitrogen
• Continuous flooding`,
        si: `🔍 **කොපු පිළිස්සුම් රෝග කළමනාකරණය**

🦠 **හඳුනාගැනීම:**
• කොපු මත අක්‍රමවත් ඕවලාකාර ලප
• ලපවල අළු-සුදු පැහැති මධ්‍යයක් සහ දුඹුරු දාර ඇත
• තුවාල සෙ.මී. 20-30 දක්වා ළඟා විය හැක
• ආසාදනය වූ විට පැළ පහසුවෙන් නැමී වැටේ

🌱 **සංස්කෘතික පාලනය:**
• අඩු සංවේදී ප්‍රභේද භාවිතා කරන්න
• ඝන සිටුවීමෙන් වළකින්න
• සමබර නයිට්‍රජන් පොහොර යෙදීම පවත්වා ගන්න
• කෙත වල් පැළෑටි රහිතව තබා ගන්න
• වරින් වර කෙත ජලය බැස යන්න

🧪 **රසායනික පාලනය:**
• වැලිඩාමයිසින් 3 L @ 2.5 L/ha
• කාබෙන්ඩසිම් 50 WP @ 500 g/ha
• මල් කරල් ඇරඹීමේ අවධියේදී යොදන්න
• පැළවල පහළ කොටස් කෙරෙහි අවධානය යොමු කරන්න

📊 **හිතකර තත්ත්වයන්:**
• ඉහළ ආර්ද්‍රතාව (>95%)
• ඝන බෝග වියනක්
• අධික නයිට්‍රජන්
• අඛණ්ඩ ගංවතුර`
      }
    },

    fertilizer: {
      keywords: {
        en: ['fertilizer', 'urea', 'potash', 'dap', 'compost', 'manure', 'npk', 'nitrogen', 'phosphorus', 'potassium'],
        si: ['පොහොර', 'යූරියා', 'පොටෑෂ්', 'ඩීඒපී', 'කොම්පෝස්ට්', 'පොහොර යෙදීම']
      },
      response: {
        en: `🌾 **Paddy Fertilizer Management**

📊 **Basal Fertilizer (At planting):**
• DAP: 50 kg/ha
• MOP: 40 kg/ha
• Urea: 30 kg/ha
• Mix well and incorporate into soil

🌱 **Top Dressing 1 (15-20 DAT):**
• Urea: 50 kg/ha
• Apply when field has 2-3cm water

🌿 **Top Dressing 2 (35-40 DAT):**
• Urea: 40 kg/ha
• MOP: 30 kg/ha
• Supports panicle initiation

🌾 **Panicle Fertilizer (50-55 DAT):**
• Urea: 30 kg/ha
• Apply at booting stage

🥬 **Organic Options:**
• Compost: 5-10 tons/ha before planting
• Green manure: Incorporate 45 days before planting
• Azolla: Grow as bio-fertilizer
• Vermicompost: 2-3 tons/ha

🔬 **Micronutrients:**
• Zinc: 25 kg/ha Zinc Sulfate at planting
• Boron: 5 kg/ha Borax at panicle initiation
• Silicon: 500 kg/ha in BPH-prone areas

💡 **Best Practices:**
• Conduct soil test before application
• Split nitrogen into 3-4 doses
• Apply in 2-3cm standing water
• Avoid application during extreme weather
• Incorporate organic manure 2 weeks before planting

⚠️ **Deficiency Signs:**
• Yellowing: Need more nitrogen
• Purple tinge: Phosphorus deficiency
• Rusty spots: Potassium deficiency
• Small panicles: Boron deficiency`,
        si: `🌾 **වී පොහොර කළමනාකරණය**

📊 **මුල් පොහොර (සිටුවීමේදී):**
• ඩීඒපී: 50 kg/ha
• එම්ඕපී: 40 kg/ha
• යූරියා: 30 kg/ha
• හොඳින් මිශ්‍ර කර පසට එකතු කරන්න

🌱 **ඉහළ පොහොර 1 (සිටුවීමෙන් දින 15-20):**
• යූරියා: 50 kg/ha
• කෙතේ සෙ.මී. 2-3ක් ජලය ඇති විට යොදන්න

🌿 **ඉහළ පොහොර 2 (සිටුවීමෙන් දින 35-40):**
• යූරියා: 40 kg/ha
• එම්ඕපී: 30 kg/ha
• මල් කරල් ඇරඹීමට සහාය වේ

🌾 **නාළි පොහොර (සිටුවීමෙන් දින 50-55):**
• යූරියා: 30 kg/ha
• බඩ ඉදිමීමේ අවධියේදී යොදන්න

🥬 **කාබනික විකල්ප:**
• කොම්පෝස්ට්: සිටුවීමට පෙර ටොන් 5-10/ha
• කොළ පොහොර: සිටුවීමට දින 45 කට පෙර එකතු කරන්න
• අසෝලා: ජීව පොහොර ලෙස වගා කරන්න
• වර්මිකොම්පෝස්ට්: ටොන් 2-3/ha

🔬 **සූක්ෂ්ම පෝෂක:**
• සින්ක්: සිටුවීමේදී සින්ක් සල්ෆේට් 25 kg/ha
• බෝරෝන්: නාළි ඇරඹීමේදී බෝරැක්ස් 5 kg/ha
• සිලිකන්: BPH බහුල ප්‍රදේශවල 500 kg/ha

💡 **හොඳම පිළිවෙත්:**
• යෙදීමට පෙර පාංශු පරීක්ෂණයක් කරන්න
• නයිට්‍රජන් මාත්‍රා 3-4 කට බෙදන්න
• සෙ.මී. 2-3ක් නැගී සිටින ජලයේ යොදන්න
• අයහපත් කාලගුණයේදී යෙදීමෙන් වළකින්න
• සිටුවීමට සති 2 කට පෙර කාබනික පොහොර එකතු කරන්න

⚠️ **හිඟතා ලක්ෂණ:**
• කහ පැහැය: වැඩි නයිට්‍රජන් අවශ්‍යයි
• දම් පැහැය: පොස්පරස් හිඟය
• මලකඩ පැහැ ලප: පොටෑසියම් හිඟය
• කුඩා නාළි: බෝරෝන් හිඟය`
      }
    },

    weather: {
      keywords: {
        en: ['weather', 'rain', 'temperature', 'humidity', 'climate', 'season', 'yala', 'maha'],
        si: ['කාලගුණය', 'වැස්ස', 'උෂ්ණත්වය', 'තෙතමනය', 'වාරය', 'යල', 'මහ']
      },
      response: {
        en: `🌦️ **Weather & Seasonal Information**

📅 **Rice Growing Seasons:**
• **Yala Season** (May - August): Dry season, supplementary irrigation needed
• **Maha Season** (September - March): Main rainy season

🌡️ **Optimal Conditions:**
• Temperature: 20-35°C (ideal 25-30°C)
• Rainfall: 100-200 mm/month
• Humidity: 70-80%

⚠️ **Weather Warnings:**
• Heavy rain: Risk of flooding, disease spread
• Drought: Water stress, increased pest pressure
• High humidity: Fungal disease risk increases
• Strong winds: Lodging, physical damage

🌱 **Seasonal Recommendations:**
• **Yala**: Plant short-duration varieties, ensure irrigation
• **Maha**: Use longer-duration varieties, monitor for blast
• **Transition periods**: Watch for pest outbreaks

💡 **Monitoring Tips:**
• Check weather forecasts regularly
• Install rain gauges in fields
• Record microclimate conditions
• Join local weather alert systems`,
        si: `🌦️ **කාලගුණ සහ වාර තොරතුරු**

📅 **වී වගා වාර:**
• **යල වාරය** (මැයි - අගෝස්තු): වියළි සමය, අතිරේක වාරිමාර්ග අවශ්‍යයි
• **මහ වාරය** (සැප්තැම්බර් - මාර්තු): ප්‍රධාන වැසි සමය

🌡️ **ප්‍රශස්ත තත්ත්වයන්:**
• උෂ්ණත්වය: 20-35°C (සුදුසුම 25-30°C)
• වර්ෂාපතනය: මසකට මි.මී. 100-200
• ආර්ද්‍රතාව: 70-80%

⚠️ **කාලගුණ අනතුරු ඇඟවීම්:**
• අධික වැස්ස: ගංවතුර අවදානම, රෝග පැතිරීම
• නියඟය: ජල ආතතිය, පළිබෝධ පීඩනය වැඩි වීම
• ඉහළ ආර්ද්‍රතාව: දිලීර රෝග අවදානම වැඩි වේ
• තද සුළං: පැළ නැමීම, භෞතික හානි

🌱 **වාර අනුව නිර්දේශ:**
• **යල**: කෙටි කාල ප්‍රභේද සිටුවන්න, වාරිමාර්ග සහතික කරන්න
• **මහ**: දිගු කාල ප්‍රභේද භාවිතා කරන්න, තුරුණු ලපය නිරීක්ෂණය කරන්න
• **සංක්‍රාන්ති කාල**: පළිබෝධ පැතිරීම් සඳහා සූදානම් වන්න

💡 **නිරීක්ෂණ උපදෙස්:**
• නිතිපතා කාලගුණ අනාවැකි පරීක්ෂා කරන්න
• කෙතේ වැසි මාපක ස්ථාපනය කරන්න
• ක්ෂුද්‍ර දේශගුණික තත්ත්වයන් සටහන් කරන්න
• ප්‍රාදේශීය කාලගුණ ඇඟවීම් පද්ධතිවලට සම්බන්ධ වන්න`
      }
    },

    water: {
      keywords: {
        en: ['water', 'irrigation', 'drainage', 'flood', 'drought', 'moisture'],
        si: ['වතුර', 'වාරිමාර්ග', 'ජලාපවහනය', 'ගංවතුර', 'නියඟය']
      },
      response: {
        en: `💧 **Water Management in Paddy**

📊 **Water Level Guidelines:**
• **Germination to transplanting**: Moist soil
• **Vegetative stage (0-40 DAT)**: 2-5 cm water
• **Reproductive stage (40-70 DAT)**: 5-10 cm water
• **Ripening stage (70-90 DAT)**: Moist soil, drain 15 days before harvest

🌊 **Irrigation Methods:**
• Continuous flooding (traditional)
• Alternate wetting and drying (AWD) - water saving
• Saturated soil condition
• Rotational irrigation

💧 **Water Saving Techniques:**
• AWD can save 30% water without yield loss
• Direct seeding uses less water than transplanting
• Laser land leveling for uniform water distribution
• Short duration varieties need less water

⚠️ **Water Stress Signs:**
• Leaf rolling in daytime
• Dark green leaves
• Delayed flowering
• Poor grain filling

🌱 **Drought Management:**
• Use drought-tolerant varieties
• Maintain organic matter in soil
• Mulch to reduce evaporation
• Install supplementary irrigation`,
        si: `💧 **වී වගාවේ ජල කළමනාකරණය**

📊 **ජල මට්ටම් මාර්ගෝපදේශ:**
• **ප්‍රරෝහණයේ සිට බද්ධ කිරීම දක්වා**: තෙත් පස
• **පැළ වැවෙන අවධිය (දින 0-40)**: සෙ.මී. 2-5 ජලය
• **ප්‍රජනන අවධිය (දින 40-70)**: සෙ.මී. 5-10 ජලය
• **ඉදීමේ අවධිය (දින 70-90)**: තෙත් පස, අස්වැන්නට දින 15 කට පෙර ජලය බැස යන්න

🌊 **වාරිමාර්ග ක්‍රම:**
• අඛණ්ඩ ගංවතුර (සාම්ප්‍රදායික)
• විකල්ප තෙත් කිරීම සහ වියළීම (AWD) - ජල ඉතිරිය
• සංතෘප්ත පාංශු තත්ත්වය
• භ්‍රමණ වාරිමාර්ග

💧 **ජල ඉතිරි කිරීමේ ක්‍රම:**
• AWD මගින් අස්වැන්න අඩු නොවී 30% ජලය ඉතිරි කළ හැක
• සෘජු වපුරනය බද්ධ කිරීමට වඩා අඩු ජලය භාවිතා කරයි
• ඒකාකාර ජල බෙදාහැරීම සඳහා ලේසර් ඉඩම් සමතලා කිරීම
• කෙටි කාල ප්‍රභේද අඩු ජලය අවශ්‍ය කරයි

⚠️ **ජල ආතති ලක්ෂණ:**
• දිවා කාලයේ කොළ ඇඹරීම
• තද කොළ පැහැති කොළ
• ප්‍රමාද වූ මල් පිපීම
• දුර්වල ධාන්‍ය පිරවීම

🌱 **නියඟ කළමනාකරණය:**
• නියඟ-ඉවසන ප්‍රභේද භාවිතා කරන්න
• පසෙහි කාබනික ද්‍රව්‍ය පවත්වා ගන්න
• වාෂ්පීකරණය අඩු කිරීමට වසුන් යොදන්න
• අතිරේක වාරිමාර්ග ස්ථාපනය කරන්න`
      }
    },

    naturalEnemies: {
      keywords: {
        en: ['natural enemies', 'beneficial insects', 'predators', 'parasitoids', 'spiders', 'ladybirds', 'dragonfly'],
        si: ['ස්වභාවික සතුරන්', 'හිතකර කෘමීන්', 'විලෝපිතයන්', 'පරපෝෂිතයන්', 'මකුළුවන්']
      },
      response: {
        en: `🐞 **Natural Enemies of Rice Pests**

🕷️ **Spiders:**
• Wolf spiders, jumping spiders, lynx spiders
• Feed on BPH, leafhoppers, and small insects
• Can consume 5-15 prey per day

🐞 **Ladybird Beetles:**
• Adults and larvae feed on aphids, BPH eggs
• One beetle can eat 50+ aphids daily
• Conserve by avoiding broad-spectrum sprays

🦟 **Damselflies & Dragonflies:**
• Adults catch flying insects (moths, flies)
• Nymphs in water feed on mosquito larvae
• Good indicators of field health

🐝 **Parasitic Wasps:**
• Trichogramma: parasitize moth eggs
• Gonatocerus: attack leafhopper eggs
• Release 50,000/ha for leaf folder control

🐜 **Predatory Ants:**
• Red ants feed on small insects and eggs
• Build nests in rice fields
• Avoid insecticides that kill ants

💚 **How to Conserve:**
• Reduce insecticide use
• Plant flowering plants on bunds
• Maintain refuge areas
• Spot-treat only when necessary

🌱 **Create Habitat:**
• Leave some weeds on field borders
• Plant nectar-producing flowers
• Maintain vegetative diversity
• Avoid burning fields after harvest`,
        si: `🐞 **වී පළිබෝධවල ස්වභාවික සතුරන්**

🕷️ **මකුළුවන්:**
• වෘක මකුළුවන්, පැනීමේ මකුළුවන්
• BPH, කොළ මකුණන් සහ කුඩා කෘමීන් පෝෂණය කරයි
• දිනකට ගොදුරු 5-15ක් ආහාරයට ගත හැක

🐞 **හීන් කුරුමිණියන්:**
• වැඩිහිටියන් සහ කීටයන් මකුණන්, BPH බිත්තර ආහාරයට ගනී
• එක් කුරුමිණියෙකු දිනකට මකුණන් 50+ ක් ආහාරයට ගත හැක
• පුළුල් වර්ණාවලී ඉසින වළක්වා සංරක්ෂණය කරන්න

🦟 **ඉත්තෑවන් සහ මකර මැස්සන්:**
• වැඩිහිටියන් පියාඹන කෘමීන් අල්ලයි
• ජලයේ කීටයන් මදුරු කීටයන් පෝෂණය කරයි
• කෙතේ සෞඛ්‍යයේ හොඳ දර්ශක

🐝 **පරපෝෂිත බඹරුන්:**
• ට්‍රයිකොග්‍රෑම්මා: සලබ බිත්තර පරපෝෂිත කරයි
• කොළ මකුණන්ගේ බිත්තර වලට පහර දෙයි
• කොළ එතුම් පාලනය සඳහා හෙක්ටයාරයකට 50,000ක් මුදාහරින්න

🐜 **විලෝපිත කුහුඹුවන්:**
• රතු කුහුඹුවන් කුඩා කෘමීන් සහ බිත්තර පෝෂණය කරයි
• වී කෙත්වල කූඩු සාදයි
• කුහුඹුවන් මරණ කෘමිනාශක වළක්වන්න

💚 **සංරක්ෂණය කරන්නේ කෙසේද:**
• කෘමිනාශක භාවිතය අඩු කරන්න
• වැව් ඉවුරුවල මල් පැළ සිටුවන්න
• රැකවරණ ප්‍රදේශ පවත්වා ගන්න
• අවශ්‍ය විට පමණක් ස්ථානීය ප්‍රතිකාර කරන්න

🌱 **වාසස්ථාන නිර්මාණය:**
• කෙතේ මායිම්වල සමහර වල් පැළෑටි තබන්න
• පැණි නිපදවන මල් සිටුවන්න
• වෘක්ෂලතා විවිධත්වය පවත්වා ගන්න
• අස්වැන්නෙන් පසු කෙත් පුළුස්සා දැමීමෙන් වළකින්න`
      }
    },

    general: {
      keywords: {
        en: [],
        si: []
      },
      response: {
        en: `🌾 **I can help you with:**

🐛 **Pest Management:**
• Brown Planthopper (BPH)
• Rice Leaf Folder
• Paddy Bug (Rice Bug)
• Stem Borer
• Gall Midge
• Hispa
• Armyworm

🦠 **Disease Management:**
• Rice Blast
• Sheath Blight
• Bacterial Leaf Blight
• Tungro Virus
• Brown Spot
• Sheath Rot

🌱 **Fertilizer Management:**
• Urea application timing
• Potash for grain filling
• DAP for root development
• Organic fertilizers
• Micronutrients (Zinc, Boron)
• Deficiency symptoms

💧 **Water Management:**
• Irrigation scheduling
• Water saving techniques
• Drought management
• Drainage practices

🛡️ **Prevention Strategies:**
• Cultural practices
• Biological control
• Resistant varieties
• Monitoring techniques
• Threshold levels

🌦️ **Weather & Seasons:**
• Yala and Maha seasons
• Weather impacts on pests
• Climate adaptation

💡 **Ask me specific questions like:**
• "How to control BPH?"
• "What are symptoms of blast?"
• "When to apply urea?"
• "Water saving techniques"
• "Natural enemies of pests"
• "යල වාරයේ වගා කළ යුතු ප්‍රභේද"
• "දුඹුරු පැළ මකුණා පාලනය"

I'm here to help with all your farming questions in English or Sinhala!`,
        si: `🌾 **මට ඔබට උදව් කළ හැකි දේ:**

🐛 **පළිබෝධ කළමනාකරණය:**
• දුඹුරු පැළ මකුණා (BPH)
• කොළ එතුම් පණුවා
• වී කූඩැල්ලා
• කඳ සිදුරු පණුවා
• පිත්තාශ මැස්සා
• හිස්පා
• සේනා පණුවා

🦠 **රෝග කළමනාකරණය:**
• තුරුණු ලපය
• කොපු පිළිස්සුම
• බැක්ටීරියා කොළ පිළිස්සුම
• ටුන්ග්‍රෝ වෛරසය
• දුඹුරු ලපය
• කොපු කුණුවීම

🌱 **පොහොර කළමනාකරණය:**
• යූරියා යෙදීමේ කාලය
• ධාන්‍ය පිරවීම සඳහා පොටෑෂ්
• මුල් වර්ධනය සඳහා ඩීඒපී
• කාබනික පොහොර
• සූක්ෂ්ම පෝෂක (සින්ක්, බෝරෝන්)
• හිඟතා රෝග ලක්ෂණ

💧 **ජල කළමනාකරණය:**
• වාරිමාර්ග කාලසටහන්
• ජල ඉතිරි කිරීමේ ක්‍රම
• නියඟ කළමනාකරණය
• ජලාපවහන පිළිවෙත්

🛡️ **වැළැක්වීමේ උපාය මාර්ග:**
• සංස්කෘතික පිළිවෙත්
• ජීව විද්‍යාත්මක පාලනය
• ප්‍රතිරෝධී ප්‍රභේද
• නිරීක්ෂණ ක්‍රම
• සීමා මට්ටම්

🌦️ **කාලගුණය සහ වාර:**
• යල සහ මහ වාර
• පළිබෝධ මත කාලගුණ බලපෑම්
• දේශගුණික අනුවර්තනය

💡 **මගෙන් විශේෂිත ප්‍රශ්න අහන්න:**
• "BPH පාලනය කරන්නේ කෙසේද?"
• "තුරුණු ලපයේ රෝග ලක්ෂණ මොනවාද?"
• "යූරියා යොදන්නේ කවදාද?"
• "ජල ඉතිරි කිරීමේ ක්‍රම"
• "පළිබෝධවල ස්වභාවික සතුරන්"
• "වී වගාවේ රෝග කළමනාකරණය"

මම ඉංග්‍රීසියෙන් හෝ සිංහලෙන් ඔබේ සියලු ගොවිතැන් ප්‍රශ්නවලට උදව් කිරීමට මෙහි සිටිමි!`
      }
    }
  };

  // Get response from local knowledge base
  const getLocalResponse = (question) => {
    const q = question.toLowerCase();
    
    // Check for language switch request
    if (q.includes('sinhala') || q.includes('සිංහල') || q.includes('si ')) {
      if (language === 'en') {
        setLanguage('si');
        AsyncStorage.setItem('assistantLanguage', 'si');
        return "හරි, මම දැන් සිංහලෙන් කතා කරන්නම්. ඔබට ගොවිතැන් පිළිබඳ ඕනෑම ප්‍රශ්නයක් අහන්න පුළුවන්.";
      }
    }
    
    if (q.includes('english') || q.includes('ඉංග්‍රීසි') || q.includes('en ')) {
      if (language === 'si') {
        setLanguage('en');
        AsyncStorage.setItem('assistantLanguage', 'en');
        return "Okay, I'll now respond in English. You can ask me any farming questions.";
      }
    }
    
    // Check against knowledge base
    for (const [key, value] of Object.entries(knowledgeBase)) {
      if (key !== 'general' && value.keywords[language] && 
          value.keywords[language].some(keyword => q.includes(keyword.toLowerCase()))) {
        return value.response[language];
      }
    }
    
    // Check for fertilizer-related questions
    if (language === 'en') {
      if (q.includes('urea') || q.includes('dap') || q.includes('mop') || q.includes('potash') || 
          q.includes('nitrogen') || q.includes('phosphorus') || q.includes('potassium') ||
          q.includes('compost') || q.includes('manure')) {
        return knowledgeBase.fertilizer.response.en;
      }
    } else {
      if (q.includes('යූරියා') || q.includes('පොහොර') || q.includes('ඩීඒපී') || 
          q.includes('පොටෑෂ්') || q.includes('නයිට්‍රජන්')) {
        return knowledgeBase.fertilizer.response.si;
      }
    }
    
    // Check for weather-related questions
    if (language === 'en') {
      if (q.includes('weather') || q.includes('rain') || q.includes('temperature') || 
          q.includes('yala') || q.includes('maha') || q.includes('season')) {
        return knowledgeBase.weather.response.en;
      }
    } else {
      if (q.includes('කාලගුණ') || q.includes('වැස්ස') || q.includes('යල') || 
          q.includes('මහ') || q.includes('වාර')) {
        return knowledgeBase.weather.response.si;
      }
    }
    
    // Check for water-related questions
    if (language === 'en') {
      if (q.includes('water') || q.includes('irrigation') || q.includes('drainage') || 
          q.includes('flood') || q.includes('drought')) {
        return knowledgeBase.water.response.en;
      }
    } else {
      if (q.includes('වතුර') || q.includes('වාරිමාර්ග') || q.includes('ජල') || 
          q.includes('ගංවතුර') || q.includes('නියඟ')) {
        return knowledgeBase.water.response.si;
      }
    }
    
    // Check for natural enemies
    if (language === 'en') {
      if (q.includes('natural enemy') || q.includes('beneficial') || q.includes('predator') || 
          q.includes('spider') || q.includes('ladybird')) {
        return knowledgeBase.naturalEnemies.response.en;
      }
    } else {
      if (q.includes('ස්වභාවික සතුරන්') || q.includes('හිතකර') || q.includes('මකුළු') || 
          q.includes('හීන් කුරුමිණි')) {
        return knowledgeBase.naturalEnemies.response.si;
      }
    }
    
    return null;
  };

  // Get response from Gemini API


const getGeminiResponse = async (question) => {
  try {
    const response = await geminiService.getResponse(
      question, 
      language, 
      { detectedPest: detectedPest?.class }
    );
    return response;
  } catch (error) {
    console.log('Gemini error:', error);
    return null;
  }
};

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    
    try {
      let response;
      
      // Check local knowledge base first in hybrid mode
      if (apiMode === 'hybrid') {
        response = getLocalResponse(inputText);
        if (!response && apiAvailable) {
          response = await getGeminiResponse(inputText);
        } else if (!response) {
          response = knowledgeBase.general.response[language];
        }
      } 
      // API mode only
      else if (apiMode === 'api' && apiAvailable) {
        response = await getGeminiResponse(inputText);
        if (!response) {
          response = knowledgeBase.general.response[language];
        }
      } 
      // Local mode only
      else {
        response = getLocalResponse(inputText) || knowledgeBase.general.response[language];
      }
      
      const aiResponse = {
        id: messages.length + 2,
        text: response,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.log('Error getting response:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'දෝෂයකි',
        language === 'en' ? 'Failed to get response' : 'පිළිතුරක් ලබා ගැනීමට අපොහොසත් විය'
      );
    } finally {
      setLoading(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  const speakMessage = (text) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      Speech.speak(text, {
        language: language === 'en' ? 'en-US' : 'si-LK',
        pitch: 1,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
      setIsSpeaking(true);
    }
  };

  const saveToFavorites = (message) => {
    setFavorites(prev => [...prev, message]);
    Alert.alert(
      language === 'en' ? 'Success' : 'සාර්ථකයි',
      language === 'en' ? 'Saved to favorites!' : 'ප්‍රියතමයන්ට සුරකින ලදී!'
    );
  };

  const clearChat = () => {
    Alert.alert(
      language === 'en' ? 'Clear Chat' : 'සංවාදය මකන්න',
      language === 'en' ? 'Are you sure you want to clear all messages?' : 'ඔබට සියලුම පණිවිඩ මැකීමට අවශ්‍යද?',
      [
        { text: language === 'en' ? 'Cancel' : 'අවලංගු කරන්න', style: 'cancel' },
        {
          text: language === 'en' ? 'Clear' : 'මකන්න',
          style: 'destructive',
          onPress: () => {
            setMessages([messages[0]]);
          }
        }
      ]
    );
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'si' : 'en';
    setLanguage(newLanguage);
    AsyncStorage.setItem('assistantLanguage', newLanguage);
    
    const switchMessage = newLanguage === 'en'
      ? "Switched to English. How can I help you?"
      : "සිංහලට මාරු කරන ලදී. මට ඔබට උදව් කළ හැක්කේ කෙසේද?";
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: switchMessage,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const toggleApiMode = () => {
    const modes = ['local', 'hybrid', 'api'];
    const currentIndex = modes.indexOf(apiMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setApiMode(nextMode);
    AsyncStorage.setItem('apiMode', nextMode);
    
    const modeMessage = language === 'en'
      ? `Switched to ${nextMode} mode. ${
          nextMode === 'api' ? 'Using Gemini AI for all responses.' :
          nextMode === 'hybrid' ? 'Using local knowledge first, then Gemini AI.' :
          'Using only local knowledge base.'
        }`
      : `${nextMode} ප්‍රකාරයට මාරු කරන ලදී. ${
          nextMode === 'api' ? 'සියලු පිළිතුරු සඳහා Gemini AI භාවිතා කරයි.' :
          nextMode === 'hybrid' ? 'මුලින් දේශීය දැනුම භාවිතා කරයි, පසුව Gemini AI.' :
          'දේශීය දැනුම පදනම පමණක් භාවිතා කරයි.'
        }`;
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: modeMessage,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#166534" />
          </TouchableOpacity>
          <MaterialCommunityIcons name="robot" size={28} color="#16a34a" />
          <View>
            <Text style={styles.headerTitle}>
              {language === 'en' ? 'AI Pest Assistant' : 'AI පළිබෝධ සහායක'}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.modeBadge, !apiAvailable && apiMode !== 'local' && styles.modeBadgeWarning]}>
                <MaterialCommunityIcons 
                  name={apiMode === 'api' ? 'cloud' : apiMode === 'hybrid' ? 'sync' : 'database'} 
                  size={12} 
                  color={!apiAvailable && apiMode !== 'local' ? '#dc2626' : '#0369a1'} 
                />
                <Text style={[
                  styles.modeText,
                  !apiAvailable && apiMode !== 'local' && styles.modeTextWarning
                ]}>
                  {apiMode === 'api' ? 'AI' : apiMode === 'hybrid' ? 'Hybrid' : 'Local'}
                  {!apiAvailable && apiMode !== 'local' && ' (Offline)'}
                </Text>
              </View>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Powered by Gemini AI' : 'Gemini AI බලයෙන්'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleApiMode} style={styles.headerButton}>
            <MaterialCommunityIcons 
              name={apiMode === 'api' ? 'cloud' : apiMode === 'hybrid' ? 'sync' : 'database'} 
              size={24} 
              color="#16a34a" 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleLanguage} style={styles.headerButton}>
            <MaterialCommunityIcons name="translate" size={24} color="#16a34a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearChat} style={styles.headerButton}>
            <MaterialCommunityIcons name="delete-sweep" size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Favorites', { favorites, language })}
            style={styles.headerButton}
          >
            <MaterialCommunityIcons name="star" size={24} color="#f59e0b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={styles.messageWrapper}>
            <View
              style={[
                styles.messageBubble,
                msg.sender === 'ai' ? styles.aiMessage : styles.userMessage
              ]}
            >
              {msg.sender === 'ai' && (
                <MaterialCommunityIcons name="robot" size={20} color="#16a34a" />
              )}
              <View style={styles.messageContent}>
                <Text style={[
                  styles.messageText,
                  msg.sender === 'user' && styles.userMessageText
                ]}>
                  {msg.text}
                </Text>
                <Text style={styles.messageTime}>{msg.timestamp}</Text>
              </View>
            </View>
            
            {/* Action buttons for AI messages */}
            {msg.sender === 'ai' && msg.id !== 1 && (
              <View style={styles.messageActions}>
                <TouchableOpacity 
                  style={styles.messageAction}
                  onPress={() => speakMessage(msg.text)}
                >
                  <MaterialCommunityIcons 
                    name={isSpeaking ? "volume-high" : "volume-medium"} 
                    size={18} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.messageAction}
                  onPress={() => saveToFavorites(msg)}
                >
                  <MaterialCommunityIcons name="star-outline" size={18} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageAction}>
                  <MaterialCommunityIcons name="content-copy" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        
        {loading && (
          <View style={[styles.messageBubble, styles.aiMessage, styles.loadingMessage]}>
            <MaterialCommunityIcons name="robot" size={20} color="#16a34a" />
            <View style={styles.loadingDots}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={styles.loadingText}>
                {language === 'en' ? 'Thinking...' : 'සිතමින්...'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesContainer}
      >
        <TouchableOpacity 
          style={styles.categoryChip}
          onPress={() => setInputText(language === 'en' ? "How to control BPH?" : "BPH පාලනය කරන්නේ කෙසේද?")}
        >
          <MaterialCommunityIcons name="bug" size={16} color="#16a34a" />
          <Text style={styles.categoryText}>BPH</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.categoryChip}
          onPress={() => setInputText(language === 'en' ? "Rice blast symptoms" : "තුරුණු ලපයේ රෝග ලක්ෂණ")}
        >
          <MaterialCommunityIcons name="leaf" size={16} color="#16a34a" />
          <Text style={styles.categoryText}>{language === 'en' ? 'Blast' : 'තුරුණු ලපය'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.categoryChip}
          onPress={() => setInputText(language === 'en' ? "Fertilizer schedule" : "පොහොර කාලසටහන")}
        >
          <MaterialCommunityIcons name="sprout" size={16} color="#16a34a" />
          <Text style={styles.categoryText}>{language === 'en' ? 'Fertilizer' : 'පොහොර'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.categoryChip}
          onPress={() => setInputText(language === 'en' ? "Water saving techniques" : "ජල ඉතිරි කිරීමේ ක්‍රම")}
        >
          <MaterialCommunityIcons name="water" size={16} color="#16a34a" />
          <Text style={styles.categoryText}>{language === 'en' ? 'Water' : 'ජලය'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.categoryChip}
          onPress={() => setInputText(language === 'en' ? "Natural enemies" : "ස්වභාවික සතුරන්")}
        >
          <MaterialCommunityIcons name="spider" size={16} color="#16a34a" />
          <Text style={styles.categoryText}>{language === 'en' ? 'Enemies' : 'සතුරන්'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.categoryChip}
          onPress={() => setInputText(language === 'en' ? "Yala season" : "යල වාරය")}
        >
          <MaterialCommunityIcons name="weather-sunny" size={16} color="#16a34a" />
          <Text style={styles.categoryText}>{language === 'en' ? 'Seasons' : 'වාර'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={language === 'en' ? "Ask about pest management..." : "පළිබෝධ කළමනාකරණය ගැන අහන්න..."}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <MaterialCommunityIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <MaterialCommunityIcons 
          name={apiMode === 'api' ? 'cloud' : apiMode === 'hybrid' ? 'sync' : 'database'} 
          size={14} 
          color="#f59e0b" 
        />
        <Text style={styles.footerText}>
          {language === 'en' 
            ? `Ask anything • ${apiMode === 'api' ? 'Gemini AI Mode' : apiMode === 'hybrid' ? 'Hybrid Mode' : 'Local Mode'}`
            : `ඕනෑම දෙයක් අහන්න • ${apiMode === 'api' ? 'Gemini AI ප්‍රකාරය' : apiMode === 'hybrid' ? 'හයිබ්‍රිඩ්' : 'දේශීය ප්‍රකාරය'}`}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  modeBadgeWarning: {
    backgroundColor: '#fee2e2',
  },
  modeText: {
    fontSize: 10,
    color: '#0369a1',
    fontWeight: '600',
  },
  modeTextWarning: {
    color: '#dc2626',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    gap: 10,
  },
  aiMessage: {
    backgroundColor: '#f0fdf4',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  userMessage: {
    backgroundColor: '#166534',
    alignSelf: 'flex-end',
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageActions: {
    flexDirection: 'row',
    marginLeft: 50,
    marginTop: 4,
    gap: 12,
  },
  messageAction: {
    padding: 4,
  },
  loadingMessage: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#16a34a',
    fontSize: 14,
  },
  categoriesContainer: {
    maxHeight: 50,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 6,
  },
  categoryText: {
    color: '#166534',
    fontWeight: '500',
    fontSize: 13,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: '#16a34a',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#fefce8',
    borderTopWidth: 1,
    borderTopColor: '#fef08a',
  },
  footerText: {
    fontSize: 11,
    color: '#854d0e',
  },
});

export default AIPestAssistantScreen;