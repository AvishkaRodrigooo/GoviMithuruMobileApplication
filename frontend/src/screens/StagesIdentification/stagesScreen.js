import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Share,
  Platform
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Speech from 'expo-speech';
import BASE_URL from "../../utils/apiConfig";

const StagesScreen = () => {

  // ======================
  // STATES
  // ======================
  const [variety, setVariety] = useState("BG300");
  const [plantingDate, setPlantingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [language, setLanguage] = useState("en"); // "en", "si", "ta"
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsReady, setTtsReady] = useState(true);

  // ======================
  // INITIALIZE TTS
  // ======================
  useEffect(() => {
    // Initialize speech system
    const initTTS = async () => {
      try {
        // Check if speech is available
        const isAvailable = await Speech.isSpeakingAsync();
        setTtsReady(true);
      } catch (error) {
        console.log("TTS Error:", error);
        setTtsReady(false);
      }
    };
    initTTS();
  }, []);

  // ======================
  // LANGUAGE TRANSLATIONS
  // ======================
  const translations = {
    en: {
      title: "🌾 Paddy Growth Stage",
      variety: "Variety",
      plantingDate: "Planting Date",
      dapLabel: "DAP:",
      days: "Days",
      identifyBtn: "Identify Stage",
      page: "Page",
      of: "of",
      page1Title: "🌾 Growth Stage Overview",
      page1Helper: "📌 This stage requires specific care and management practices.",
      page2Title: "📊 Plant Metrics",
      leafColor: "Leaf Color",
      leafCount: "Leaf Count",
      tillers: "Tillers",
      height: "Height",
      cm: "cm",
      page3Title: "🌱 Fertilizer & Water",
      fertilizerMgmt: "🌱 Fertilizer Management",
      waterMgmt: "💧 Water Management",
      page4Title: "🌿 Weed Control",
      weedControl: "🌿 Weed Control Strategy",
      farmerTip: "💡 Farmer's Tip",
      tipText: "Regular monitoring and timely intervention are key to effective weed control during this stage.",
      prevBtn: "← Previous",
      nextBtn: "Next →",
      exportBtn: "📄 Export as Report",
      listenBtn: "🔊 Listen",
      stopBtn: "⏹️ Stop",
      installMsg: "Please install Sinhala voice in your device settings"
    },
    si: {
      title: "🌾 වී වර්ධන අවධිය",
      variety: "ප්‍රභේදය",
      plantingDate: "පැල් කිරීමේ දිනය",
      dapLabel: "DAP:",
      days: "දින",
      identifyBtn: "අවස්ථාව හඳුනා ගන්න",
      page: "පිටුව",
      of: "සිට",
      page1Title: "🌾 වර්ධන අවස්ථා දළ විශ්ලේෂණය",
      page1Helper: "📌 මෙම අවස්ථාවට විශේෂ සත්කාර සහ කළමනාකරණ ක්‍රම අවශ්‍ය වේ.",
      page2Title: "📊 පැල සමිතිය",
      leafColor: "පත්‍ර වර්ණය",
      leafCount: "පත්‍ර ගණන",
      tillers: "පැළ",
      height: "උස",
      cm: "cm",
      page3Title: "🌱 පොහොර සහ ජලය",
      fertilizerMgmt: "🌱 පොහොර කළමනාකරණය",
      waterMgmt: "💧 ජල කළමනාකරණය",
      page4Title: "🌿 වල් පාලනය",
      weedControl: "🌿 වල් පාලන උපාය මාර්ගය",
      farmerTip: "💡 ගොවියාගේ ඉඟිය",
      tipText: "නිතිපතා නිරීක්ෂණය සහ කාලෝචිත මැදිහත්වීම මෙම අවස්ථාවේදී ඵලදායී වල් පාලනය සඳහා ප්‍රධාන වේ.",
      prevBtn: "← පෙර",
      nextBtn: "ඊළඟ →",
      exportBtn: "📄 වාර්තාවක් ලෙස නිකුත් කරන්න",
      listenBtn: "🔊 අසන්න",
      stopBtn: "⏹️ නවත්වන්න",
      installMsg: "කරුණාකර ඔබගේ උපාංගයේ සිංහල හඩ ස්ථාපනය කරන්න"
    },
    ta: {
      title: "🌾 நெல் வளர்ச்சி கட்டம்",
      variety: "வகை",
      plantingDate: "நடவு தேதி",
      dapLabel: "DAP:",
      days: "நாட்கள்",
      identifyBtn: "கட்டத்தை அடையாளப்படுத்து",
      page: "பக்கம்",
      of: "இன்",
      page1Title: "🌾 வளர்ச்சி கட்ட மேலோட்டம்",
      page1Helper: "📌 இந்த கட்டத்திற்கு குறிப்பிட்ட பராமரிப்பு மற்றும் மேலாண்மை நடைமுறைகள் தேவை.",
      page2Title: "📊 பயிர் அளவீடுகள்",
      leafColor: "இலை நிறம்",
      leafCount: "இலை எண்ணிக்கை",
      tillers: "தளிர்கள்",
      height: "உயரம்",
      cm: "cm",
      page3Title: "🌱 உரம் மற்றும் நீர்",
      fertilizerMgmt: "🌱 உர மேலாண்மை",
      waterMgmt: "💧 நீர் மேலாண்மை",
      page4Title: "🌿 களை கட்டுப்பாடு",
      weedControl: "🌿 களை கட்டுப்பாட்டு உத்தி",
      farmerTip: "💡 விவசாயியின் ஆலோசனை",
      tipText: "வழக்கமான கண்காணிப்பு மற்றும் சரியான நேரத்தில் தலையீடு இந்த கட்டத்தில் பயனுள்ள களை கட்டுப்பாட்டுக்கு முக்கியமாகும்.",
      prevBtn: "← முந்தைய",
      nextBtn: "அடுத்து →",
      exportBtn: "📄 அறிக்கையாக ஏற்றுமதி செய்யுங்கள்",
      listenBtn: "🔊 கேளுங்கள்",
      stopBtn: "⏹️ நிறுத்து",
      installMsg: "உங்கள் சாதனத்தில் தமிழ் குரலை நிறுவவும்"
    }
  };

  const t = translations[language];

  // ======================
  // SPEECH FUNCTION FOR SINHALA
  // ======================
  const speakSinhala = (text) => {
    return new Promise((resolve, reject) => {
      // සිංහල සඳහා විශේෂ ක්‍රමය
      const sinhalaOptions = {
        language: 'si',
        pitch: 1.0,
        rate: 0.85, // සිංහලට ටිකක් සෙමින්
        onStart: () => {
          setIsSpeaking(true);
        },
        onDone: () => {
          setIsSpeaking(false);
          resolve();
        },
        onStopped: () => {
          setIsSpeaking(false);
          resolve();
        },
        onError: (error) => {
          console.error("Sinhala speech error:", error);
          setIsSpeaking(false);
          reject(error);
        }
      };
      
      Speech.speak(text, sinhalaOptions);
    });
  };

  // ======================
  // SPEECH FUNCTION FOR TAMIL
  // ======================
  const speakTamil = (text) => {
    return new Promise((resolve, reject) => {
      const tamilOptions = {
        language: 'ta',
        pitch: 1.0,
        rate: 0.9,
        onStart: () => {
          setIsSpeaking(true);
        },
        onDone: () => {
          setIsSpeaking(false);
          resolve();
        },
        onStopped: () => {
          setIsSpeaking(false);
          resolve();
        },
        onError: (error) => {
          console.error("Tamil speech error:", error);
          setIsSpeaking(false);
          reject(error);
        }
      };
      
      Speech.speak(text, tamilOptions);
    });
  };

  // ======================
  // SPEECH FUNCTION FOR ENGLISH
  // ======================
  const speakEnglish = (text) => {
    return new Promise((resolve, reject) => {
      const englishOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onStart: () => {
          setIsSpeaking(true);
        },
        onDone: () => {
          setIsSpeaking(false);
          resolve();
        },
        onStopped: () => {
          setIsSpeaking(false);
          resolve();
        },
        onError: (error) => {
          console.error("English speech error:", error);
          setIsSpeaking(false);
          reject(error);
        }
      };
      
      Speech.speak(text, englishOptions);
    });
  };

  // ======================
  // MAIN SPEECH FUNCTION
  // ======================
  const speakDescription = async () => {
    const description = result?.recommendations?.description || "";
    if (!description) {
      Alert.alert("Info", "No description available to read.");
      return;
    }

    // Stop any ongoing speech
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      if (language === 'si') {
        // Try Sinhala first
        await speakSinhala(description);
      } else if (language === 'ta') {
        // Try Tamil
        await speakTamil(description);
      } else {
        // English
        await speakEnglish(description);
      }
    } catch (error) {
      // If native voice fails, offer fallback
      Alert.alert(
        "Voice Not Available",
        `${t.installMsg}\n\nWould you like to listen in English instead?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Listen in English", 
            onPress: () => speakEnglish(description)
          }
        ]
      );
    }
  };

  // ======================
  // DAP CALCULATION
  // ======================
  const calculateDAP = (date) => {
    const today = new Date();
    const diff = today - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 0;
  };

  const dapValue = calculateDAP(plantingDate);
  const isButtonDisabled = dapValue < 15 || dapValue >= 150;

  // ======================
  // PDF GENERATION
  // ======================
  const generatePDF = async () => {
    if (!result) return;
    
    try {
      const pdfContent = `
PADDY GROWTH STAGE REPORT
=============================

Variety: ${variety}
Planting Date: ${plantingDate.toDateString()}
DAP (Days After Planting): ${dapValue} days

--- GROWTH STAGE ---
Stage: ${result.growth_stage}
Sinhala Name: ${result.recommendations?.stage_name_sinhala}
Description: ${result.recommendations?.description}

--- PLANT METRICS ---
Leaf Color: ${result.leaf_color}
Leaf Count: ${result.leaf_count}
Tillers: ${result.tillers}
Plant Height: ${result.plant_height_cm} cm

--- FERTILIZER MANAGEMENT ---
${result.recommendations?.fertilizer?.items?.map((item, i) => `${i + 1}. ${item}`).join('\n')}

--- WATER MANAGEMENT ---
${result.recommendations?.water_management?.items?.map((item, i) => `${i + 1}. ${item}`).join('\n')}

--- WEED CONTROL STRATEGY ---
${result.recommendations?.weed_control?.items?.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Generated on: ${new Date().toDateString()}
      `;

      await Share.share({
        message: pdfContent,
        title: `Paddy Growth Stage Report - ${variety}`,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to generate report: " + error.message);
    }
  };

  // ======================
  // DATE PICKER
  // ======================
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (selectedDate > new Date()) {
        Alert.alert("Error", "Future date not allowed");
        return;
      }
      setPlantingDate(selectedDate);
    }
  };

  // ======================
  // API CALL
  // ======================
  const identifyStage = async () => {
    if (dapValue < 15) {
      Alert.alert("Info", "Please wait until DAP reaches 15 days to identify the growth stage.");
      return;
    }
    if (dapValue >= 150) {
      Alert.alert("Info", "The crop has completed its growth cycle (150+ days). Cannot identify growth stage.");
      return;
    }

    setLoading(true);
    setResult(null);
    
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }

    try {
      const payload = {
        variety: variety,
        dap: dapValue
      };

      const response = await fetch(
        `${BASE_URL}/predict-stage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Server error");
      }

      console.log("API RESULT:", data);
      setResult(data);

    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getWarningMessage = () => {
    if (dapValue < 15) {
      return `⚠️ Please wait until ${15 - dapValue} more days to identify the growth stage`;
    }
    if (dapValue >= 150) {
      return `⚠️ Crop cycle completed (150+ days). Cannot identify growth stage`;
    }
    return "";
  };

  // ======================
  // UI
  // ======================
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{t.title}</Text>
        
        <View style={styles.languageSelectorTop}>
          <TouchableOpacity
            style={[styles.langButtonSmall, language === "en" && styles.langButtonSmallActive]}
            onPress={() => {
              setLanguage("en");
              if (isSpeaking) {
                Speech.stop();
                setIsSpeaking(false);
              }
            }}
          >
            <Text style={[styles.langButtonTextSmall, language === "en" && styles.langButtonTextSmallActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langButtonSmall, language === "si" && styles.langButtonSmallActive]}
            onPress={() => {
              setLanguage("si");
              if (isSpeaking) {
                Speech.stop();
                setIsSpeaking(false);
              }
            }}
          >
            <Text style={[styles.langButtonTextSmall, language === "si" && styles.langButtonTextSmallActive]}>සිංහල</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langButtonSmall, language === "ta" && styles.langButtonSmallActive]}
            onPress={() => {
              setLanguage("ta");
              if (isSpeaking) {
                Speech.stop();
                setIsSpeaking(false);
              }
            }}
          >
            <Text style={[styles.langButtonTextSmall, language === "ta" && styles.langButtonTextSmallActive]}>தமிழ்</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>{t.variety}</Text>
      <View style={styles.box}>
        <Picker selectedValue={variety} onValueChange={setVariety}>
          <Picker.Item label="BG300" value="BG300" />
          <Picker.Item label="BG352" value="BG352" />
          <Picker.Item label="BG366" value="BG366" />
        </Picker>
      </View>

      <Text style={styles.label}>{t.plantingDate}</Text>
      <TouchableOpacity style={styles.dateBox} onPress={() => setShowDatePicker(true)}>
        <Text>{plantingDate.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={plantingDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onDateChange}
        />
      )}

      <View style={[styles.dapBox, (dapValue < 15 || dapValue >= 150) && styles.dapBoxWarning]}>
        <Text style={[styles.dapText, (dapValue < 15 || dapValue >= 150) && styles.dapTextWarning]}>
          🌾 {t.dapLabel} {dapValue} {t.days}
          {(dapValue < 15 || dapValue >= 150) && " ⚠️"}
        </Text>
        {(dapValue < 15 || dapValue >= 150) && (
          <Text style={styles.dapSubText}>
            {dapValue < 15 ? "(Minimum 15 days required)" : "(Growth cycle completed)"}
          </Text>
        )}
      </View>

      <TouchableOpacity style={[styles.button, isButtonDisabled && styles.buttonDisabled]} onPress={identifyStage} disabled={isButtonDisabled}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t.identifyBtn}</Text>}
      </TouchableOpacity>

      {isButtonDisabled && <Text style={styles.warningText}>{getWarningMessage()}</Text>}

      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.pageIndicator}>
            <Text style={styles.pageNumber}>{t.page} {currentPage + 1} / 4</Text>
          </View>

          {currentPage === 0 && (
            <View style={styles.resultBox}>
              <Text style={styles.pageTitle}>{t.page1Title}</Text>
              <View style={styles.stageCard}>
                <Text style={styles.stage}>{result.recommendations?.icon || "🌾"} {result.growth_stage}</Text>
                <Text style={styles.sinhala}>{result.recommendations?.stage_name_sinhala || ""}</Text>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>{result.recommendations?.description || ""}</Text>
                
                {/* Voice Button */}
                <TouchableOpacity 
                  style={[styles.speakerButton, isSpeaking && styles.speakerButtonActive]}
                  onPress={speakDescription}
                >
                  <Text style={styles.speakerButtonText}>{isSpeaking ? t.stopBtn : t.listenBtn}</Text>
                </TouchableOpacity>
                
                {/* Voice Installation Guide for Sinhala/Tamil */}
                {(language === 'si' || language === 'ta') && !isSpeaking && (
                  <Text style={styles.voiceHintText}>💡 {t.installMsg}</Text>
                )}
              </View>

              <Text style={styles.helperText}>{t.page1Helper}</Text>
            </View>
          )}

          {currentPage === 1 && (
            <View style={styles.resultBox}>
              <Text style={styles.pageTitle}>{t.page2Title}</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>🌿</Text>
                  <Text style={styles.metricLabel}>{t.leafColor}</Text>
                  <Text style={styles.metricValue}>{result.leaf_color}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>🍃</Text>
                  <Text style={styles.metricLabel}>{t.leafCount}</Text>
                  <Text style={styles.metricValue}>{result.leaf_count}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>🌱</Text>
                  <Text style={styles.metricLabel}>{t.tillers}</Text>
                  <Text style={styles.metricValue}>{result.tillers}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>📏</Text>
                  <Text style={styles.metricLabel}>{t.height}</Text>
                  <Text style={styles.metricValue}>{result.plant_height_cm} {t.cm}</Text>
                </View>
              </View>
            </View>
          )}

          {currentPage === 2 && (
            <View style={styles.resultBox}>
              <Text style={styles.pageTitle}>{t.page3Title}</Text>
              <View style={styles.recommendationSection}>
                <Text style={styles.recommendationTitle}>{t.fertilizerMgmt}</Text>
                {result.recommendations?.fertilizer?.items?.map((item, i) => (
                  <Text key={i} style={styles.recommendationItem}>✓ {item}</Text>
                ))}
              </View>
              <View style={styles.recommendationSection}>
                <Text style={styles.recommendationTitle}>{t.waterMgmt}</Text>
                {result.recommendations?.water_management?.items?.map((item, i) => (
                  <Text key={i} style={styles.recommendationItem}>✓ {item}</Text>
                ))}
              </View>
            </View>
          )}

          {currentPage === 3 && (
            <View style={styles.resultBox}>
              <Text style={styles.pageTitle}>{t.page4Title}</Text>
              <View style={styles.recommendationSection}>
                <Text style={styles.recommendationTitle}>{t.weedControl}</Text>
                {result.recommendations?.weed_control?.items?.map((item, i) => (
                  <Text key={i} style={styles.recommendationItem}>✓ {item}</Text>
                ))}
              </View>
              <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>{t.farmerTip}</Text>
                <Text style={styles.tipText}>{t.tipText}</Text>
              </View>
            </View>
          )}

          <View style={styles.navigationContainer}>
            <TouchableOpacity style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]} onPress={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 0}>
              <Text style={styles.navButtonText}>{t.prevBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navButton, currentPage === 3 && styles.navButtonDisabled]} onPress={() => setCurrentPage(currentPage + 1)} disabled={currentPage === 3}>
              <Text style={styles.navButtonText}>{t.nextBtn}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.pdfButton} onPress={generatePDF}>
            <Text style={styles.pdfButtonText}>{t.exportBtn}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f4f6f4" },
  headerContainer: { marginBottom: 15 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 12, color: "#2d5016" },
  languageSelectorTop: { flexDirection: "row", justifyContent: "center", gap: 8, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: "#2d5016" },
  langButtonSmall: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: "#f0f0f0", borderWidth: 2, borderColor: "#ccc" },
  langButtonSmallActive: { backgroundColor: "#2d5016", borderColor: "#2d5016" },
  langButtonTextSmall: { fontSize: 12, fontWeight: "700", color: "#666" },
  langButtonTextSmallActive: { color: "#fff" },
  label: { fontWeight: "600", marginTop: 10 },
  box: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, backgroundColor: "#fff" },
  dateBox: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, backgroundColor: "#fff" },
  dapBox: { backgroundColor: "#fff3cd", padding: 12, marginTop: 10, borderRadius: 8, alignItems: "center" },
  dapBoxWarning: { backgroundColor: "#ffebee", borderWidth: 1, borderColor: "#f44336" },
  dapText: { fontWeight: "bold", color: "#856404" },
  dapTextWarning: { color: "#c62828" },
  dapSubText: { fontSize: 11, color: "#c62828", marginTop: 4 },
  button: { backgroundColor: "#2d5016", padding: 15, borderRadius: 8, marginTop: 15, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#ccc", opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  warningText: { color: "#f44336", fontSize: 12, textAlign: "center", marginTop: 8, fontWeight: "600" },
  resultContainer: { marginTop: 20, backgroundColor: "#fff", borderRadius: 12, padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  pageIndicator: { alignItems: "center", marginBottom: 15, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "#2d5016" },
  pageNumber: { fontSize: 14, fontWeight: "600", color: "#2d5016", backgroundColor: "#e8f5e9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  resultBox: { minHeight: 350 },
  pageTitle: { fontSize: 20, fontWeight: "bold", color: "#2d5016", marginBottom: 15, textAlign: "center" },
  stageCard: { backgroundColor: "#e8f5e9", padding: 15, borderRadius: 10, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: "#2d5016" },
  stage: { fontSize: 18, fontWeight: "bold", color: "#2d5016" },
  sinhala: { fontSize: 16, fontWeight: "600", color: "#444", marginTop: 5 },
  descriptionContainer: { marginBottom: 10 },
  description: { fontSize: 14, color: "#555", lineHeight: 22, marginBottom: 12 },
  speakerButton: { backgroundColor: "#4CAF50", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, alignItems: "center", alignSelf: "flex-start", marginVertical: 5, flexDirection: "row", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  speakerButtonActive: { backgroundColor: "#f44336" },
  speakerButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  voiceHintText: { fontSize: 11, color: "#ff9800", marginTop: 5, fontStyle: "italic" },
  helperText: { fontSize: 13, color: "#666", fontStyle: "italic", backgroundColor: "#f5f5f5", padding: 10, borderRadius: 8, marginTop: 10 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  metricCard: { width: "48%", backgroundColor: "#f0f7f0", padding: 15, borderRadius: 10, marginBottom: 12, alignItems: "center", borderWidth: 1, borderColor: "#2d5016" },
  metricIcon: { fontSize: 28, marginBottom: 8 },
  metricLabel: { fontSize: 12, color: "#666", fontWeight: "600", marginBottom: 5 },
  metricValue: { fontSize: 16, fontWeight: "bold", color: "#2d5016" },
  recommendationSection: { marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  recommendationTitle: { fontSize: 16, fontWeight: "bold", color: "#2d5016", marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: "#2d5016" },
  recommendationItem: { fontSize: 14, color: "#333", marginVertical: 8, marginLeft: 10, lineHeight: 20 },
  tipBox: { backgroundColor: "#fffef0", padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: "#ff9800", marginTop: 15 },
  tipTitle: { fontSize: 14, fontWeight: "bold", color: "#ff6f00", marginBottom: 5 },
  tipText: { fontSize: 13, color: "#555", lineHeight: 20 },
  navigationContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingTop: 15, borderTopWidth: 2, borderTopColor: "#2d5016" },
  navButton: { flex: 0.45, backgroundColor: "#2d5016", padding: 12, borderRadius: 8, alignItems: "center" },
  navButtonDisabled: { backgroundColor: "#ccc" },
  navButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  pdfButton: { backgroundColor: "#1565c0", padding: 14, borderRadius: 8, marginTop: 15, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  pdfButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});

export default StagesScreen;