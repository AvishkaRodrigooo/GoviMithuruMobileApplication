import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BASE_URL from "../../utils/apiConfig";
// Language translations
const translations = {
  english: {
    title: "Paddy Pest Detection",
    takePhoto: "Take Photo",
    chooseImage: "Choose Image",
    analyzing: "Analyzing Image...",
    detectionResults: "Detection Results",
    pestInfo: "Pest Info",
    fertilizerPlan: "Fertilizer Plan",
    confidence: "Confidence",
    noPestDetected: "✅ No Pest Detected",
    healthyCrop: "Your crop looks healthy!",
    newDetection: "New Detection",
    description: "📝 Description",
    symptoms: "⚠️ Symptoms",
    management: "🔧 Management",
    generalFertilizer: "🌾 General Fertilizer Schedule",
    bestPractices: "💡 Best Practices",
    recommendedFertilizers: "✅ Recommended Fertilizers:",
    avoid: "❌ Avoid:",
    tips: "💡 Tips:",
    fertilizerPlanFor: "🌱 Fertilizer Plan for",
    cameraPermission: "Camera permission required",
    detectionFailed: "Detection Failed",
    error: "Error",
    failedToConnect: "Failed to connect to detection server",
    downloadPDF: "📥 Download PDF Report",
    shareReport: "📤 Share Report",
    generatingPDF: "Generating PDF...",
    pdfGenerated: "PDF Generated Successfully",
    pdfFailed: "Failed to generate PDF",
    reportTitle: "Paddy Pest Detection Report",
    generatedOn: "Generated on",
    pestReport: "Pest Analysis Report",
    fertilizerReport: "Fertilizer Recommendation Report",
    saveReport: "Save Report",
    noDetections: "No Pests Detected",
    healthyReport: "Your crop appears healthy. Continuing good agricultural practices.",
    actions: "Actions",
    pdfReady: "PDF Report Ready",
    pdfOptions: "What would you like to do with the report?",
    cancel: "Cancel",
    share: "Share",
    save: "Save"
  },
  sinhala: {
    title: "වී පළිබෝධ හඳුනාගැනීම",
    takePhoto: "ඡායාරූපයක් ගන්න",
    chooseImage: "පින්තූරයක් තෝරන්න",
    analyzing: "පින්තූරය විශ්ලේෂණය කරමින්...",
    detectionResults: "හඳුනාගැනීමේ ප්‍රතිඵල",
    pestInfo: "පළිබෝධ තොරතුරු",
    fertilizerPlan: "පොහොර යෝජනා ක්‍රමය",
    confidence: "විශ්වාසය",
    noPestDetected: "✅ පළිබෝධ හමු නොවුණි",
    healthyCrop: "ඔබේ බෝගය නිරෝගීව පවතී!",
    newDetection: "නව හඳුනාගැනීමක්",
    description: "📝 විස්තරය",
    symptoms: "⚠️ රෝග ලක්ෂණ",
    management: "🔧 කළමනාකරණය",
    generalFertilizer: "🌾 සාමාන්‍ය පොහොර යෙදීම් කාලසටහන",
    bestPractices: "💡 හොඳම පිළිවෙත්",
    recommendedFertilizers: "✅ නිර්දේශිත පොහොර:",
    avoid: "❌ වළක්වා ගත යුතු දේ:",
    tips: "💡 උපදෙස්:",
    fertilizerPlanFor: "🌱 සඳහා පොහොර යෝජනා ක්‍රමය",
    cameraPermission: "කැමරා අවසරය අවශ්‍යයි",
    detectionFailed: "හඳුනාගැනීම අසාර්ථක විය",
    error: "දෝෂයකි",
    failedToConnect: "හඳුනාගැනීමේ සේවාදායකයට සම්බන්ධ වීමට අපොහොසත් විය",
    downloadPDF: "📥 PDF වාර්තාව බාගන්න",
    shareReport: "📤 වාර්තාව බෙදාගන්න",
    generatingPDF: "PDF සකසමින්...",
    pdfGenerated: "PDF සාර්ථකව සකස් විය",
    pdfFailed: "PDF සැකසීම අසාර්ථක විය",
    reportTitle: "වී පළිබෝධ හඳුනාගැනීමේ වාර්තාව",
    generatedOn: "සකස් කළ දිනය",
    pestReport: "පළිබෝධ විශ්ලේෂණ වාර්තාව",
    fertilizerReport: "පොහොර නිර්දේශ වාර්තාව",
    saveReport: "වාර්තාව සුරකින්න",
    noDetections: "පළිබෝධ හමු නොවුණි",
    healthyReport: "ඔබේ බෝගය නිරෝගීව පවතී. හොඳ කෘෂිකාර්මික පිළිවෙත් දිගටම කරගෙන යන්න.",
    actions: "ක්‍රියාමාර්ග",
    pdfReady: "PDF වාර්තාව සූදානම්",
    pdfOptions: "වාර්තාව සමඟ කුමක් කිරීමට ඔබ කැමතිද?",
    cancel: "අවලංගු කරන්න",
    share: "බෙදාගන්න",
    save: "සුරකින්න"
  }
};

// Pest names in Sinhala
const pestNamesSinhala = {
  'brown planthopper': 'දුඹුරු පැළ මකුණා',
  'brown': 'දුඹුරු පැළ මකුණා',
  'planthopper': 'පැළ මකුණා',
  'bph': 'දුඹුරු පැළ මකුණා',
  'rice leaf-folder': 'වී කොළ එතුම් පණුවා',
  'leaf folder': 'කොළ එතුම් පණුවා',
  'leaf-folder': 'කොළ එතුම් පණුවා',
  'paddy bug': 'වී කූඩැල්ලා',
  'rice bug': 'වී කූඩැල්ලා',
  'bug': 'කූඩැල්ලා',
  'stem borer': 'උඩ දඬු සිදුරු පණුවා',
  'gall midge': 'කොළ මදුරුවා',
  'rice hispa': 'වී කොළ කුරුමිණියා',
  'armyworm': 'සේනා පණුවා',
  'blast': 'තුරුණු ලපය',
  'rice blast': 'වී තුරුණු ලපය',
  'sheath blight': 'කොපු පිළිස්සුම',
  'bacterial leaf blight': 'බැක්ටීරියා කොළ පිළිස්සුම',
  'tungro': 'ටුන්ග්‍රෝ වෛරසය',
  'brown spot': 'දුඹුරු ලපය',
  'sheath rot': 'කොපු කුණුවීම'
};

// Fertilizer names in Sinhala
const fertilizerNamesSinhala = {
  'Potassium': 'පොටෑසියම්',
  'Muriate of Potash': 'මියුරේට් ඔෆ් පොටෑෂ්',
  'Silicon': 'සිලිකන්',
  'Calcium Silicate': 'කැල්සියම් සිලිකේට්',
  'Zinc': 'සින්ක්',
  'Zinc Sulfate': 'සින්ක් සල්ෆේට්',
  'Nitrogen': 'නයිට්‍රජන්',
  'Urea': 'යූරියා',
  'Phosphorus': 'පොස්පරස්',
  'DAP': 'ඩීඒපී',
  'TSP': 'ටීඑස්පී',
  'Boron': 'බෝරෝන්',
  'Borax': 'බෝරැක්ස්',
  'NPK': 'එන්පීකේ',
  'Potash': 'පොටෑෂ්',
  'Triple Super Phosphate': 'ට්‍රිපල් සුපර් පොස්පේට්',
  'MOP': 'එම්ඕපී'
};

export default function PestDetection() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [fertilizerTab, setFertilizerTab] = useState('pest');
  const [language, setLanguage] = useState('english');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermission();
    ImagePicker.requestMediaLibraryPermissionsAsync();
  }, []);

  const openCamera = () => {
    if (!permission?.granted) {
      Alert.alert(
        language === 'english' ? "Camera permission required" : "කැමරා අවසරය අවශ්‍යයි"
      );
      return;
    }
    setCameraVisible(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    setCameraVisible(false);
    setImage(photo);
    detectPest(photo);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });

    if (!result.canceled) {
      const img = result.assets[0];
      setImage(img);
      detectPest(img);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'english' ? 'sinhala' : 'english');
  };

  const getText = (key) => {
    return translations[language][key] || translations.english[key];
  };

  const getPestNameInSinhala = (pestName) => {
    if (language === 'english') return pestName;
    
    const pestLower = pestName.toLowerCase();
    
    // Direct match
    if (pestNamesSinhala[pestLower]) {
      return pestNamesSinhala[pestLower];
    }
    
    // Partial match
    for (const [key, value] of Object.entries(pestNamesSinhala)) {
      if (pestLower.includes(key)) {
        return value;
      }
    }
    
    return pestName;
  };

  const translateFertilizerName = (name) => {
    if (language === 'english') return name;
    
    let translated = name;
    for (const [key, value] of Object.entries(fertilizerNamesSinhala)) {
      translated = translated.replace(new RegExp(key, 'gi'), value);
    }
    return translated;
  };

  const detectPest = async (img) => {
    try {
      setLoading(true);
      setFertilizerTab('pest');

      const formData = new FormData();
      formData.append("image", {
        uri: img.uri,
        type: "image/jpeg",
        name: "pest.jpg"
      });

      const response = await fetch(
        `${BASE_URL}/api/pest-detection/detect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data"
          },
          body: formData
        }
      );

      const data = await response.json();
      console.log("Detection result:", data);

      if (data.success) {
        setAnnotatedImage(data.data?.annotated_image || data.annotated_image);

        if (data.no_detections) {
          setResults({
            detections: []
          });
        } else {
          setResults({
            detections: data.data.detections
          });
        }
        setShowResults(true);
      } else {
        Alert.alert(getText('detectionFailed'), data.error);
      }
    } catch (error) {
      console.log(error);
      Alert.alert(getText('error'), getText('failedToConnect'));
    } finally {
      setLoading(false);
    }
  };

  const resetDetection = () => {
    setImage(null);
    setResults(null);
    setAnnotatedImage(null);
    setShowResults(false);
    setFertilizerTab('pest');
  };

  // 🌾 Get general fertilizer tips
  const getGeneralFertilizerTips = () => {
    return {
      fertilizers: [
        {
          name: language === 'english'
            ? 'Basal Fertilizer - DAP + MOP + Urea'
            : 'මුල් පොහොර - ඩීඒපී + එම්ඕපී + යූරියා',
          reason: language === 'english'
            ? 'Foundation for healthy crop growth'
            : 'නිරෝගී බෝග වර්ධනය සඳහා පදනම',
          application: language === 'english'
            ? 'DAP 50 kg/ha + MOP 40 kg/ha + Urea 30 kg/ha at planting'
            : 'සිටුවීමේදී ඩීඒපී 50 + එම්ඕපී 40 + යූරියා 30 කි.ග්‍රෑ/හෙක්'
        },
        {
          name: language === 'english'
            ? 'Top Dressing 1 - Urea'
            : 'ඉහළ පොහොර 1 - යූරියා',
          reason: language === 'english'
            ? 'Promotes tillering'
            : 'ගොයම් පැල ඇරඹීම ප්‍රවර්ධනය කරයි',
          application: language === 'english'
            ? 'Urea 50 kg/ha at 15-20 days after transplanting'
            : 'සිටුවීමෙන් දින 15-20කට පසු යූරියා 50 කි.ග්‍රෑ/හෙක්'
        },
        {
          name: language === 'english'
            ? 'Top Dressing 2 - Urea + MOP'
            : 'ඉහළ පොහොර 2 - යූරියා + එම්ඕපී',
          reason: language === 'english'
            ? 'Supports panicle initiation'
            : 'මල් කරල් ඇරඹීමට සහාය වේ',
          application: language === 'english'
            ? 'Urea 40 kg/ha + MOP 30 kg/ha at 40-45 DAT'
            : 'දින 40-45 දී යූරියා 40 + එම්ඕපී 30 කි.ග්‍රෑ/හෙක්'
        }
      ],
      tips: language === 'english'
        ? [
            'Conduct soil test for accurate recommendations',
            'Maintain 2-3 cm water level during fertilizer application',
            'Split nitrogen into 3-4 applications',
            'Avoid fertilizer during extreme weather',
            'Incorporate organic manure 2 weeks before planting'
          ]
        : [
            'නිවැරදි නිර්දේශ සඳහා පාංශු පරීක්ෂණයක් කරන්න',
            'පොහොර යෙදීමේදී සෙ.මී. 2-3ක් ජල මට්ටමක් පවත්වා ගන්න',
            'නයිට්‍රජන් යෙදීම් 3-4කට බෙදන්න',
            'අයහපත් කාලගුණය තුළ පොහොර යෙදීමෙන් වළකින්න',
            'සිටුවීමට සති 2කට පෙර කාබනික පොහොර එකතු කරන්න'
          ]
    };
  };

  // 🌾 Get fertilizer recommendations based on detected pest
  const getFertilizerRecommendations = (pestName) => {
    const pestLower = pestName.toLowerCase();
    
    // Brown Planthopper (BPH) recommendations
    if (pestLower.includes('brown') || pestLower.includes('planthopper') || pestLower.includes('bph')) {
      return {
        fertilizers: [
          {
            name: 'Potassium (K) - Muriate of Potash',
            reason: language === 'english' 
              ? 'Strengthens plant cell walls and reduces BPH attraction'
              : 'ශාක සෛල බිත්ති ශක්තිමත් කරන අතර දුඹුරු පැළ මකුණන් ආකර්ෂණය අඩු කරයි',
            application: language === 'english'
              ? 'Apply 60-80 kg/ha at tillering and panicle initiation'
              : 'ගොයම් පැල සහ මල් කරල් ඇරඹීමේදී හෙක්ටයාරයට කිලෝ 60-80ක් යොදන්න'
          },
          {
            name: 'Silicon - Calcium Silicate',
            reason: language === 'english'
              ? 'Creates physical barrier against BPH feeding'
              : 'දුඹුරු පැළ මකුණන්ගේ ආහාර ගැනීමට එරෙහිව භෞතික බාධකයක් නිර්මාණය කරයි',
            application: language === 'english'
              ? 'Apply 500 kg/ha as basal dressing'
              : 'මුල් පොහොර ලෙස හෙක්ටයාරයට කිලෝ 500ක් යොදන්න'
          },
          {
            name: 'Zinc - Zinc Sulfate',
            reason: language === 'english'
              ? 'Improves plant vigor and resistance'
              : 'ශාක ශක්තිය සහ ප්‍රතිරෝධය වැඩි දියුණු කරයි',
            application: language === 'english'
              ? 'Apply 25 kg/ha at planting'
              : 'සිටුවීමේදී හෙක්ටයාරයට කිලෝ 25ක් යොදන්න'
          }
        ],
        avoid: language === 'english'
          ? [
              'Excessive Nitrogen - Reduces plant resistance',
              'Urea - Can increase BPH population',
              'Ammonium-based fertilizers'
            ]
          : [
              'අධික නයිට්‍රජන් - ශාක ප්‍රතිරෝධය අඩු කරයි',
              'යූරියා - දුඹුරු පැළ මකුණන්ගේ ව්‍යාප්තිය වැඩි කළ හැක',
              'ඇමෝනියම් පාදක පොහොර'
            ],
        tips: language === 'english'
          ? [
              'Split nitrogen application into 3-4 doses',
              'Avoid nitrogen during peak BPH infestation',
              'Maintain 2-3 cm water level during fertilizer application'
            ]
          : [
              'නයිට්‍රජන් කොටස් 3-4කට බෙදා යොදන්න',
              'දුඹුරු පැළ මකුණන් ව්‍යාප්තිය උච්චතම අවස්ථාවේදී නයිට්‍රජන් යෙදීමෙන් වළකින්න',
              'පොහොර යෙදීමේදී සෙ.මී. 2-3ක් ජල මට්ටමක් පවත්වා ගන්න'
          ]
      };
    }
    
    // Rice Leaf-folder recommendations
    else if (pestLower.includes('leaf') && pestLower.includes('folder')) {
      return {
        fertilizers: [
          {
            name: 'Nitrogen (N) - Urea (controlled)',
            reason: language === 'english'
              ? 'Promotes healthy leaf growth but apply carefully'
              : 'නිරෝගී කොළ වර්ධනය ප්‍රවර්ධනය කරයි, නමුත් ප්‍රවේශමෙන් යොදන්න',
            application: language === 'english'
              ? 'Apply 40-50 kg/ha in split doses'
              : 'කොටස් වශයෙන් හෙක්ටයාරයට කිලෝ 40-50ක් යොදන්න'
          },
          {
            name: 'Potassium (K) - Potash',
            reason: language === 'english'
              ? 'Enhances leaf toughness and reduces feeding'
              : 'කොළ දෘඪතාව වැඩි කරන අතර ආහාර ගැනීම අඩු කරයි',
            application: language === 'english'
              ? 'Apply 40-60 kg/ha at tillering'
              : 'ගොයම් පැල ඇරඹීමේදී හෙක්ටයාරයට කිලෝ 40-60ක් යොදන්න'
          },
          {
            name: 'Phosphorus (P) - DAP/TSP',
            reason: language === 'english'
              ? 'Strengthens root system'
              : 'මූල පද්ධතිය ශක්තිමත් කරයි',
            application: language === 'english'
              ? 'Apply 30-40 kg/ha as basal'
              : 'මුල් පොහොර ලෙස හෙක්ටයාරයට කිලෝ 30-40ක් යොදන්න'
          }
        ],
        avoid: language === 'english'
          ? [
              'Excessive Nitrogen - Makes leaves soft and attractive',
              'Late Nitrogen application - Promotes new growth during infestation',
              'Foliar sprays during active feeding'
            ]
          : [
              'අධික නයිට්‍රජන් - කොළ මෘදු හා ආකර්ෂණීය කරයි',
              'ප්‍රමාද නයිට්‍රජන් යෙදීම - ව්‍යාප්තිය අතරතුර නව වර්ධනය ප්‍රවර්ධනය කරයි',
              'සක්‍රීය ආහාර ගැනීමේදී කොළ ඉසින'
          ],
        tips: language === 'english'
          ? [
              'Use slow-release nitrogen fertilizers',
              'Apply fertilizers when fields are drained',
              'Combine fertilizer with light traps for better control'
            ]
          : [
              'මන්දගාමී මුදාහැරීමේ නයිට්‍රජන් පොහොර භාවිතා කරන්න',
              'කෙත් ජලය බැස ගිය විට පොහොර යොදන්න',
              'වඩා හොඳ පාලනය සඳහා පොහොර ආලෝක උගුල් සමඟ ඒකාබද්ධ කරන්න'
          ]
      };
    }
    
    // Paddy Bug recommendations
    else if (pestLower.includes('paddy') || pestLower.includes('bug') || pestLower.includes('rice bug')) {
      return {
        fertilizers: [
          {
            name: 'Phosphorus (P) - Triple Super Phosphate',
            reason: language === 'english'
              ? 'Promotes grain filling and development'
              : 'ධාන්‍ය පිරවීම සහ සංවර්ධනය ප්‍රවර්ධනය කරයි',
            application: language === 'english'
              ? 'Apply 40-50 kg/ha at planting'
              : 'සිටුවීමේදී හෙක්ටයාරයට කිලෝ 40-50ක් යොදන්න'
          },
          {
            name: 'Potassium (K) - Muriate of Potash',
            reason: language === 'english'
              ? 'Improves grain quality and reduces damage'
              : 'ධාන්‍ය ගුණාත්මකභාවය වැඩි දියුණු කරන අතර හානි අඩු කරයි',
            application: language === 'english'
              ? 'Apply 50-60 kg/ha at panicle initiation'
              : 'මල් කරල් ඇරඹීමේදී හෙක්ටයාරයට කිලෝ 50-60ක් යොදන්න'
          },
          {
            name: 'Boron - Borax',
            reason: language === 'english'
              ? 'Prevents grain sterility'
              : 'ධාන්‍ය වඳ භාවය වළක්වයි',
            application: language === 'english'
              ? 'Apply 5-10 kg/ha at booting stage'
              : 'බඩ ඉදිමීමේ අවධියේදී හෙක්ටයාරයට කිලෝ 5-10ක් යොදන්න'
          }
        ],
        avoid: language === 'english'
          ? [
              'Excessive Nitrogen - Increases grain susceptibility',
              'Late season Nitrogen - Prolongs grain filling period',
              'Fertilizers during flowering stage'
            ]
          : [
              'අධික නයිට්‍රජන් - ධාන්‍ය ග්‍රහණය වැඩි කරයි',
              'ප්‍රමාද නයිට්‍රජන් - ධාන්‍ය පිරවීමේ කාලය දිගු කරයි',
              'මල් පිපෙන අවධියේදී පොහොර යෙදීම'
          ],
        tips: language === 'english'
          ? [
              'Time fertilizer application before flowering',
              'Use balanced NPK ratio (4:2:4)',
              'Avoid water stress during grain filling'
            ]
          : [
              'මල් පිපීමට පෙර පොහොර යෙදීම සිදු කරන්න',
              'සමබර NPK අනුපාතය (4:2:4) භාවිතා කරන්න',
              'ධාන්‍ය පිරවීමේදී ජල ආතතියෙන් වළකින්න'
          ]
      };
    }
    
    // Gall Midge recommendations
    else if (pestLower.includes('gall') || pestLower.includes('midge')) {
      return {
        fertilizers: [
          {
            name: 'Silicon - Calcium Silicate',
            reason: language === 'english'
              ? 'Strengthens stem tissue and reduces gall formation'
              : 'කඳ පටක ශක්තිමත් කරන අතර නාළි සෑදීම අඩු කරයි',
            application: language === 'english'
              ? 'Apply 500 kg/ha as basal dressing'
              : 'මුල් පොහොර ලෙස හෙක්ටයාරයට කිලෝ 500ක් යොදන්න'
          },
          {
            name: 'Potassium (K) - Muriate of Potash',
            reason: language === 'english'
              ? 'Improves plant resistance to gall formation'
              : 'නාළි සෑදීමට ශාක ප්‍රතිරෝධය වැඩි දියුණු කරයි',
            application: language === 'english'
              ? 'Apply 40-50 kg/ha at tillering'
              : 'ගොයම් පැල ඇරඹීමේදී හෙක්ටයාරයට කිලෝ 40-50ක් යොදන්න'
          },
          {
            name: 'Zinc - Zinc Sulfate',
            reason: language === 'english'
              ? 'Enhances overall plant vigor'
              : 'සමස්ත ශාක ශක්තිය වැඩි දියුණු කරයි',
            application: language === 'english'
              ? 'Apply 25 kg/ha at planting'
              : 'සිටුවීමේදී හෙක්ටයාරයට කිලෝ 25ක් යොදන්න'
          }
        ],
        avoid: language === 'english'
          ? [
              'Excessive Nitrogen - Promotes lush growth attractive to midges',
              'Late Nitrogen application - Extends susceptible period',
              'Fertilizers during peak midge flight'
            ]
          : [
              'අධික නයිට්‍රජන් - මදුරුවන්ට ආකර්ෂණීය සශ්‍රීක වර්ධනය ප්‍රවර්ධනය කරයි',
              'ප්‍රමාද නයිට්‍රජන් යෙදීම - ග්‍රහණය වන කාලය දීර්ඝ කරයි',
              'මදුරු ක්‍රියාකාරකම් උච්චතම අවස්ථාවේදී පොහොර යෙදීම'
          ],
        tips: language === 'english'
          ? [
              'Use resistant varieties like Bg 304, Bg 357',
              'Apply fertilizers in split doses',
              'Maintain proper drainage'
            ]
          : [
              'Bg 304, Bg 357 වැනි ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න',
              'කොටස් වශයෙන් පොහොර යොදන්න',
              'නිසි ජලාපවහනය පවත්වා ගන්න'
          ]
      };
    }
    
    // Default recommendations for unknown pests
    return {
      fertilizers: [
        {
          name: 'Balanced NPK - 15:15:15',
          reason: language === 'english'
            ? 'General purpose fertilizer for rice'
            : 'වී සඳහා සාමාන්‍ය අරමුණු පොහොර',
          application: language === 'english'
            ? 'Apply 100-120 kg/ha as basal'
            : 'මුල් පොහොර ලෙස හෙක්ටයාරයට කිලෝ 100-120ක් යොදන්න'
        },
        {
          name: 'Urea (Nitrogen)',
          reason: language === 'english'
            ? 'Promotes vegetative growth'
            : 'වර්ධන වර්ධනය ප්‍රවර්ධනය කරයි',
          application: language === 'english'
            ? 'Split apply 40-50 kg/ha at 15, 30, 45 DAT'
            : 'සිටුවීමෙන් දින 15, 30, 45 දී හෙක්ටයාරයට කිලෝ 40-50 බැගින් කොටස් වශයෙන් යොදන්න'
        },
        {
          name: 'Potash (K)',
          reason: language === 'english'
            ? 'Improves overall plant health'
            : 'සමස්ත ශාක සෞඛ්‍යය වැඩි දියුණු කරයි',
          application: language === 'english'
            ? 'Apply 40 kg/ha at tillering and panicle initiation'
            : 'ගොයම් පැල සහ මල් කරල් ඇරඹීමේදී හෙක්ටයාරයට කිලෝ 40ක් යොදන්න'
        }
      ],
      avoid: language === 'english'
        ? [
            'Excessive fertilizer application',
            'Fertilizers during drought or flood',
            'Single large dose of nitrogen'
          ]
        : [
            'අධික පොහොර යෙදීම',
            'නියඟය හෝ ගංවතුර අතරතුර පොහොර යෙදීම',
            'තනි විශාල නයිට්‍රජන් ප්‍රමාණයක්'
          ],
      tips: language === 'english'
        ? [
            'Conduct soil test before fertilizer application',
            'Apply fertilizers in split doses',
            'Maintain proper water level during application'
          ]
        : [
            'පොහොර යෙදීමට පෙර පාංශු පරීක්ෂණයක් කරන්න',
            'කොටස් වශයෙන් පොහොර යොදන්න',
            'යෙදීමේදී නිසි ජල මට්ටමක් පවත්වා ගන්න'
          ]
    };
  };

  // 📄 Generate PDF Report - UPDATED WITH NEW FILESYSTEM API
  const generatePDFReport = async () => {
    try {
      setGeneratingPDF(true);

      // Get current date
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString(language === 'english' ? 'en-US' : 'si-LK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Build pest detections HTML
      let pestDetectionsHTML = '';
      
      if (!results?.detections || results.detections.length === 0) {
        // No detections
        pestDetectionsHTML = `
          <div class="no-detection">
            <div class="success-icon">✅</div>
            <h3>${getText('noPestDetected')}</h3>
            <p>${getText('healthyReport')}</p>
          </div>
        `;
      } else {
        // Build detections list
        results.detections.forEach((detection, index) => {
          const pestName = getPestNameInSinhala(detection.class);
          const confidence = (detection.confidence * 100).toFixed(1);
          
          pestDetectionsHTML += `
            <div class="detection-card">
              <div class="detection-header">
                <span class="pest-icon">🐛</span>
                <h3>${pestName}</h3>
                <span class="confidence-badge">${confidence}% ${getText('confidence')}</span>
              </div>
              
              <div class="detection-section">
                <h4>📝 ${getText('description')}</h4>
                <p>${detection.pest_details.description}</p>
              </div>
              
              <div class="detection-section">
                <h4>⚠️ ${getText('symptoms')}</h4>
                <ul>
                  ${detection.pest_details.symptoms.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
              
              <div class="detection-section">
                <h4>🔧 ${getText('management')}</h4>
                <ul>
                  ${detection.pest_details.management.map(m => `<li>${m}</li>`).join('')}
                </ul>
              </div>
            </div>
          `;
        });
      }

      // Build fertilizer recommendations HTML
      let fertilizerHTML = '';
      
      if (!results?.detections || results.detections.length === 0) {
        // General fertilizer tips
        const generalTips = getGeneralFertilizerTips();
        
        fertilizerHTML = `
          <div class="fertilizer-section">
            <h3>🌾 ${getText('generalFertilizer')}</h3>
            ${generalTips.fertilizers.map(fert => `
              <div class="fertilizer-card">
                <h4>${translateFertilizerName(fert.name)}</h4>
                <p class="reason">${fert.reason}</p>
                <p class="application">📌 ${fert.application}</p>
              </div>
            `).join('')}
            
            <h4>💡 ${getText('bestPractices')}</h4>
            <ul>
              ${generalTips.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          </div>
        `;
      } else {
        // Pest-specific recommendations
        results.detections.forEach((detection, index) => {
          const recommendations = getFertilizerRecommendations(detection.class);
          const pestName = getPestNameInSinhala(detection.class);
          
          fertilizerHTML += `
            <div class="fertilizer-section">
              <h3>${getText('fertilizerPlanFor')} ${pestName}</h3>
              
              <h4> ${getText('recommendedFertilizers')}</h4>
              ${recommendations.fertilizers.map(fert => `
                <div class="fertilizer-card">
                  <h4>${translateFertilizerName(fert.name)}</h4>
                  <p class="reason">• ${fert.reason}</p>
                  <p class="application">📌 ${fert.application}</p>
                </div>
              `).join('')}
              
              <h4> ${getText('avoid')}</h4>
              <ul class="avoid-list">
                ${recommendations.avoid.map(item => `<li>${item}</li>`).join('')}
              </ul>
              
              <h4> ${getText('tips')}</h4>
              <ul class="tips-list">
                ${recommendations.tips.map(tip => `<li>${tip}</li>`).join('')}
              </ul>
              
              ${index < results.detections.length - 1 ? '<hr/>' : ''}
            </div>
          `;
        });
      }

      // Complete HTML template
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${getText('reportTitle')}</title>
            <style>
              body {
                font-family: ${language === 'english' ? 'Arial, Helvetica' : '"Iskoola Pota", "Noto Sans Sinhala", Arial'}, sans-serif;
                padding: 30px;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                line-height: 1.6;
              }
              .header {
                text-align: center;
                border-bottom: 3px solid #16a34a;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #16a34a;
                font-size: 28px;
                margin-bottom: 5px;
              }
              .header p {
                color: #666;
                font-size: 14px;
              }
              .section-title {
                background: #f0fdf4;
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0 15px 0;
                border-left: 5px solid #16a34a;
              }
              .section-title h2 {
                margin: 0;
                color: #166534;
              }
              .detection-card {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              }
              .detection-header {
                display: flex;
                align-items: center;
                gap: 10px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 10px;
                margin-bottom: 15px;
              }
              .pest-icon {
                font-size: 24px;
              }
              .confidence-badge {
                background: #f0fdf4;
                color: #16a34a;
                padding: 4px 12px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 14px;
                margin-left: auto;
              }
              .detection-section {
                margin: 15px 0;
              }
              .detection-section h4 {
                margin: 10px 0 5px 0;
                color: #374151;
              }
              .fertilizer-section {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
              }
              .fertilizer-card {
                background: #f9fafb;
                border-left: 4px solid #16a34a;
                padding: 15px;
                margin: 10px 0;
                border-radius: 0 8px 8px 0;
              }
              .fertilizer-card h4 {
                margin: 0 0 8px 0;
                color: #111827;
              }
              .reason {
                color: #4b5563;
                font-style: italic;
                margin: 5px 0;
              }
              .application {
                color: #2563eb;
                font-weight: 500;
                margin: 5px 0;
              }
              .no-detection {
                text-align: center;
                padding: 40px;
                background: #f0fdf4;
                border-radius: 12px;
              }
              .success-icon {
                font-size: 48px;
                margin-bottom: 10px;
              }
              ul {
                margin: 5px 0;
                padding-left: 20px;
              }
              li {
                margin: 5px 0;
                color: #4b5563;
              }
              .avoid-list li {
                color: #dc2626;
              }
              .tips-list li {
                color: #16a34a;
              }
              hr {
                border: none;
                border-top: 2px dashed #e5e7eb;
                margin: 20px 0;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                background: #f9fafb;
                padding: 10px;
                border-radius: 8px;
                margin: 10px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${getText('reportTitle')}</h1>
              <p>${getText('generatedOn')}: ${formattedDate}</p>
            </div>

            <div class="section-title">
              <h2>🐛 ${getText('pestReport')}</h2>
            </div>
            
            ${pestDetectionsHTML}

            <div class="section-title">
              <h2>🌱 ${getText('fertilizerReport')}</h2>
            </div>

            ${fertilizerHTML}

            <div class="footer">
              <p>Paddy Pest Detection System - Smart Farming Solution</p>
              <p>© ${new Date().getFullYear()} All Rights Reserved</p>
            </div>
          </body>
        </html>
      `;

      // Generate PDF to temporary file
      const { uri } = await Print.printToFileAsync({ html });
      
      // Create a File object from the temporary URI
      const tempFile = new FileSystem.File(uri);
      
      // Create destination directory if it doesn't exist
      const reportsDir = new FileSystem.Directory(FileSystem.Paths.document, 'PestReports');
      if (!reportsDir.exists) {
        await reportsDir.create();
      }
      
      
      const fileName = `Pest_Report_${new Date().getTime()}.pdf`;
      const destinationFile = new FileSystem.File(reportsDir, fileName);
      
      
      await tempFile.copy(destinationFile);
      
      
      await tempFile.delete();

      setGeneratingPDF(false);
      
      
      Alert.alert(
        getText('pdfReady'),
        language === 'english' 
          ? 'What would you like to do with the report?'
          : 'වාර්තාව සමඟ කුමක් කිරීමට ඔබ කැමතිද?',
        [
          {
            text: getText('share'),
            onPress: () => sharePDF(destinationFile.uri)
          },
          {
            text: getText('save'),
            onPress: () => savePDF(destinationFile.uri)
          },
          {
            text: getText('cancel'),
            style: 'cancel'
          }
        ]
      );

    } catch (error) {
      console.error('PDF Generation Error:', error);
      setGeneratingPDF(false);
      Alert.alert(getText('error'), getText('pdfFailed'));
    }
  };

  
  const sharePDF = async (pdfUri) => {
    try {
      if (await Sharing.isAvailableAsync()) {
       
        const file = new FileSystem.File(pdfUri);
        
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: getText('shareReport'),
          UTI: 'com.adobe.pdf'
        });
      } else {
        
        Alert.alert(
          language === 'english' ? 'Sharing not available' : 'බෙදාගැනීම ලබා ගත නොහැක',
          language === 'english' 
            ? 'PDF saved to: ' + pdfUri
            : 'PDF මෙහි සුරකින ලදී: ' + pdfUri
        );
      }
    } catch (error) {
      console.error('Share Error:', error);
      Alert.alert(getText('error'), getText('pdfFailed'));
    }
  };

  // 💾 Save PDF (show save location)
  const savePDF = async (pdfUri) => {
    try {
      Alert.alert(
        getText('pdfGenerated'),
        language === 'english'
          ? `PDF saved to: ${pdfUri}`
          : `PDF මෙහි සුරකින ලදී: ${pdfUri}`
      );
    } catch (error) {
      console.error('Save Error:', error);
    }
  };

  const renderFertilizerContent = () => {
    if (!results?.detections || results.detections.length === 0) {
      const generalTips = getGeneralFertilizerTips();
      return (
        <View style={styles.fertilizerContainer}>
          <Text style={styles.fertilizerTitle}>{getText('generalFertilizer')}</Text>
          {generalTips.fertilizers.map((fert, index) => (
            <View key={index} style={styles.fertilizerCard}>
              <Text style={styles.fertilizerName}>{translateFertilizerName(fert.name)}</Text>
              <Text style={styles.fertilizerReason}>{fert.reason}</Text>
              <Text style={styles.fertilizerApp}>📝 {fert.application}</Text>
            </View>
          ))}
          
          <Text style={styles.tipsTitle}>{getText('bestPractices')}</Text>
          {generalTips.tips.map((tip, index) => (
            <Text key={index} style={styles.tipText}>• {tip}</Text>
          ))}
        </View>
      );
    }

    
    return results.detections.map((detection, index) => {
      const recommendations = getFertilizerRecommendations(detection.class);
      const pestName = getPestNameInSinhala(detection.class);
      
      return (
        <View key={index} style={styles.fertilizerContainer}>
          <Text style={styles.fertilizerTitle}>
            {getText('fertilizerPlanFor')} {pestName}
          </Text>
          
          <Text style={styles.subTitle}>{getText('recommendedFertilizers')}</Text>
          {recommendations.fertilizers.map((fert, idx) => (
            <View key={idx} style={styles.fertilizerCard}>
              <Text style={styles.fertilizerName}>{translateFertilizerName(fert.name)}</Text>
              <Text style={styles.fertilizerReason}>• {fert.reason}</Text>
              <Text style={styles.fertilizerApp}>📌 {fert.application}</Text>
            </View>
          ))}
          
          <Text style={styles.subTitle}>{getText('avoid')}</Text>
          {recommendations.avoid.map((item, idx) => (
            <Text key={idx} style={styles.avoidText}>• {item}</Text>
          ))}
          
          <Text style={styles.subTitle}>{getText('tips')}</Text>
          {recommendations.tips.map((tip, idx) => (
            <Text key={idx} style={styles.tipText}>• {tip}</Text>
          ))}
          
          {index < results.detections.length - 1 && <View style={styles.divider} />}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with Language Toggle */}
      <View style={styles.header}>
        <Text style={styles.title}>{getText('title')}</Text>
        <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
          <MaterialCommunityIcons name="translate" size={24} color="#16a34a" />
          <Text style={styles.languageButtonText}>
            {language === 'english' ? 'සිංහල' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      {!image && !cameraVisible && !loading && (
        <View style={styles.options}>
          <TouchableOpacity style={styles.card} onPress={openCamera}>
            <MaterialCommunityIcons name="camera" size={40} color="#0369a1" />
            <Text style={styles.cardTitle}>{getText('takePhoto')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={pickImage}>
            <MaterialCommunityIcons name="image" size={40} color="#f59e0b" />
            <Text style={styles.cardTitle}>{getText('chooseImage')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {cameraVisible && (
        <CameraView style={styles.camera} ref={cameraRef}>
          <TouchableOpacity style={styles.capture} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </CameraView>
      )}

      {image && !loading && !showResults && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
        </View>
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text>{getText('analyzing')}</Text>
        </View>
      )}

      {generatingPDF && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.loadingText}>{getText('generatingPDF')}</Text>
          </View>
        </View>
      )}

      <Modal visible={showResults} animationType="slide">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowResults(false)} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{getText('detectionResults')}</Text>
          <View style={styles.modalHeaderRight}>
            <TouchableOpacity onPress={generatePDFReport} style={styles.pdfButton}>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#16a34a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleLanguage} style={styles.modalLanguageButton}>
              <MaterialCommunityIcons name="translate" size={20} color="#16a34a" />
              <Text style={styles.modalLanguageText}>
                {language === 'english' ? 'සිංහල' : 'English'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, fertilizerTab === 'pest' && styles.activeTab]}
            onPress={() => setFertilizerTab('pest')}
          >
            <MaterialCommunityIcons 
              name="bug" 
              size={20} 
              color={fertilizerTab === 'pest' ? '#16a34a' : '#6b7280'} 
            />
            <Text style={[styles.tabText, fertilizerTab === 'pest' && styles.activeTabText]}>
              {getText('pestInfo')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, fertilizerTab === 'fertilizer' && styles.activeTab]}
            onPress={() => setFertilizerTab('fertilizer')}
          >
            <MaterialCommunityIcons 
              name="sprout" 
              size={20} 
              color={fertilizerTab === 'fertilizer' ? '#16a34a' : '#6b7280'} 
            />
            <Text style={[styles.tabText, fertilizerTab === 'fertilizer' && styles.activeTabText]}>
              {getText('fertilizerPlan')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.resultContainer}>
          {/* Annotated Image */}
          {annotatedImage && (
            <Image
              source={{ uri: annotatedImage }}
              style={styles.annotatedImage}
            />
          )}

          {fertilizerTab === 'pest' ? (
            // Pest Information Tab
            <>
              {results?.detections?.length === 0 ? (
                <View style={styles.noPestCard}>
                  <MaterialCommunityIcons name="check-circle" size={50} color="#16a34a" />
                  <Text style={styles.noPestText}>{getText('noPestDetected')}</Text>
                  <Text style={styles.noPestSubText}>{getText('healthyCrop')}</Text>
                </View>
              ) : (
                results?.detections?.map((detection, index) => (
                  <View key={index} style={styles.resultCard}>
                    <View style={styles.pestHeader}>
                      <MaterialCommunityIcons name="bug" size={24} color="#dc2626" />
                      <Text style={styles.pestName}>
                        {getPestNameInSinhala(detection.class || detection.yolo_class)}
                      </Text>
                    </View>

                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        {(detection.confidence * 100).toFixed(1)}% {getText('confidence')}
                      </Text>
                    </View>

                    <Text style={styles.section}>{getText('description')}</Text>
                    <Text style={styles.sectionText}>{detection.pest_details.description}</Text>

                    <Text style={styles.section}>{getText('symptoms')}</Text>
                    {detection.pest_details.symptoms.map((s, i) => (
                      <Text key={i} style={styles.listItem}>• {s}</Text>
                    ))}

                    <Text style={styles.section}>{getText('management')}</Text>
                    {detection.pest_details.management.map((m, i) => (
                      <Text key={i} style={styles.listItem}>• {m}</Text>
                    ))}
                  </View>
                ))
              )}
            </>
          ) : (
            
            <View style={styles.fertilizerMainContainer}>
              {renderFertilizerContent()}
            </View>
          )}

          <TouchableOpacity style={styles.newButton} onPress={resetDetection}>
            <MaterialCommunityIcons name="camera" size={20} color="#fff" />
            <Text style={styles.newButtonText}>{getText('newDetection')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#cadcce",
    paddingTop: 60,
    alignItems: "center"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 30
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    flex: 1
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: "#16a34a"
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a"
  },
  modalLanguageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4
  },
  modalLanguageText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16a34a"
  },
  options: {
    flexDirection: "row",
    gap: 20
  },
  card: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardTitle: {
    marginTop: 10,
    fontWeight: "600",
    color: "#374151"
  },
  camera: {
    flex: 1,
    width: "100%"
  },
  capture: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ffffff50",
    justifyContent: "center",
    alignItems: "center"
  },
  captureInner: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#fff"
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center"
  },
  previewImage: {
    width: 350,
    height: 350,
    resizeMode: "contain"
  },
  loading: {
    alignItems: "center",
    marginTop: 50
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    gap: 15
  },
  loadingText: {
    fontSize: 16,
    color: '#374151'
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827"
  },
  closeButton: {
    padding: 8
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  pdfButton: {
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 8
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    gap: 8
  },
  activeTab: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#16a34a"
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280"
  },
  activeTabText: {
    color: "#16a34a",
    fontWeight: "600"
  },
  resultContainer: {
    flex: 1,
    padding: 20
  },
  annotatedImage: {
    width: "100%",
    height: 250,
    resizeMode: "contain",
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#f3f4f6"
  },
  resultCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  pestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  pestName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    flex: 1
  },
  confidenceBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 15
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a"
  },
  section: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
    color: "#374151"
  },
  sectionText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20
  },
  listItem: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
    paddingLeft: 8
  },
  noPestCard: {
    padding: 30,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20
  },
  noPestText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16a34a",
    marginTop: 10
  },
  noPestSubText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 5
  },
  // Fertilizer styles
  fertilizerMainContainer: {
    marginBottom: 20
  },
  fertilizerContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2
  },
  fertilizerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 15
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 10,
    marginBottom: 8
  },
  fertilizerCard: {
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a"
  },
  fertilizerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 5
  },
  fertilizerReason: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 5,
    fontStyle: "italic"
  },
  fertilizerApp: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500"
  },
  avoidText: {
    fontSize: 14,
    color: "#dc2626",
    marginBottom: 4,
    paddingLeft: 8
  },
  tipText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
    paddingLeft: 8
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 15,
    marginBottom: 8
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 15
  },
  newButton: {
    flexDirection: "row",
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 30
  },
  newButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  }
});