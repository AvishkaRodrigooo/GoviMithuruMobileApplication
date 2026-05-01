import { View, Text, Pressable, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';

export default function WeedsDashboardScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [language, setLanguage] = useState("en"); // "en", "si", "ta"

  // ======================
  // LANGUAGE TRANSLATIONS
  // ======================
  const translations = {
    en: {
      title: "Weeds Management",
      subtitle: "Intelligent weed detection and treatment",
      activeFields: "Active Fields",
      allHealthy: "All healthy",
      growthStage: "Growth Stage",
      dayOnTrack: "Day 45 - On track",
      tillering: "Tillering",
      healthy: "92% Healthy",
      alerts: "2 Alerts",
      optimal: "Optimal",
      aiFeatures: "AI-Powered Features",
      localization: "Weeds Localization",
      localizationDesc: "Detect and highlight weed-infected areas directly on the image for targeted treatment.",
      instantResults: "Instant results",
      identification: "Identification & Treatment",
      identificationDesc: "Upload images to identify weed types and receive expert treatment recommendations with detailed reasoning.",
      expertRec: "Expert recommendations",
      herbicide: "Herbicide Recommendations",
      herbicideDesc: "Get smart herbicide advice tailored to your crop and weed types for optimal protection.",
      herbicideSubtitle: "Optimized spraying schedules",
      howWorks: "How It Works",
      capture: "Capture Image",
      captureDesc: "Take a photo of the weed-affected area using your camera",
      analyze: "Analyze",
      analyzeDesc: "AI system identifies weed types and analyzes crop health",
      results: "Get Results",
      resultsDesc: "Receive treatment recommendations tailored to your crops"
    },
    si: {
      title: "වල් පැලෑටි කළමනාකරණය",
      subtitle: "වල් පැලෑටි හඳුනා ගැනීම සහ ප්‍රතිකාර කිරීම",
      activeFields: "සක්‍රිය ක්ෂේත්‍ර",
      allHealthy: "සියල්ල සෞස්ථ්ය",
      growthStage: "වර්ධන අවස්ථාව",
      dayOnTrack: "දින 45 - ගමන",
      tillering: "බිම් අඩු",
      healthy: "92% සෞඛ්ය ",
      alerts: "2 අනතුරු ඉතුරුවීම්",
      optimal: "ප්‍රශස්ත",
      aiFeatures: "AI බලගතු විශේෂතා",
      localization: "ස්ථානය හඳුනා ගන්න",
      localizationDesc: "සරඳේ කාඩ සෙවීම සඳහා ඡායාරූපයෙහි කෝණ තීරණ කරනු ලබන කොටස් හඳුනා ගන්න.",
      instantResults: "ක්ෂණික ප්‍රතිඵල",
      identification: "හඳුනාගැනීම සහ ප්‍රතිකාරය",
      identificationDesc: "කාඩ වර්ගවල හඳුනාගැනීම සඳහා ඡායාරූප උපුටා ගැනීම සහ විස්තරණ තර්කනය සහිත විශේෂඥ ප්‍රතිකාර ප්‍රস්තාවයි.",
      expertRec: "විශේෂඥ නිර්දේශ",
      herbicide: "වල් නාශක නිර්දේශ",
      herbicideDesc: "ඔබේ බෝවන සහ කාඩ වර්ගවලට අනුරූපව බුද්ධිමත් නිර්බීජක උපදෙස් ලබා ගන්න.",
      herbicideSubtitle: "ප්‍රශස්ත ඉසින ගිණුම්",
      howWorks: "එය ක්‍රියා කරන ආකාරය",
      capture: "ඡායාරූපය ගුණ කරන්න",
      captureDesc: "ඔබගේ කැමරා භාවිතයෙන් කාඩ-ආසන්න ප්‍රදේශයේ ඡායාරූපයක් ගන්න",
      analyze: "විශ්ලේෂණ කරන්න",
      analyzeDesc: "AI පද්ධතිය කාඩ වර්ගවල හඳුනාගෙන බෝවන සෞස්ථ්යය විශ්ලේෂණ කරයි",
      results: "ප්‍රතිඵල ලබා ගන්න",
      resultsDesc: "ඔබේ බෝවනට අනුරූපව ප්‍රතිකාර නිර්දේශ ලබා ගන්න"
    },
    ta: {
      title: "களை மேலாண்மை",
      subtitle: "புத்திசாலி களை கண்டறிதல் மற்றும் சிகிச்சை",
      activeFields: "செயல்படும் வயல்கள்",
      allHealthy: "அனைத்து ஆரோக்கியமான",
      growthStage: "வளர்ச்சி கட்டம்",
      dayOnTrack: "நாள் 45 - பாதையில் உள்ளது",
      tillering: "தளிர் வெளிப்பாட்டு கட்டம்",
      healthy: "92% ஆரோக்கியமான",
      alerts: "2 எச்சரிக்கைகள்",
      optimal: "உகந்த",
      aiFeatures: "AI-இயக்கப்பட்ட அம்சங்கள்",
      localization: "களை உள்ளூர்করணம்",
      localizationDesc: "குறிப்பிட்ட சிகிச்சைக்கான பட்டத்தின் நிலையான களை-பாதிக்கப்பட்ட பகுதிகளை கண்டறிந்து சிறப்பிக்கவும்.",
      instantResults: "உடனடி முடிவுகள்",
      identification: "அடையாளம் மற்றும் சிகிச்சை",
      identificationDesc: "களை வகைகளை கண்டறிய பதிவுசெய்த படங்களை பதிவேற்றவும் மற்றும் விரிவான பகுத்தறிவுடன் நிபுணர் சிகிச்சை நிர்দேशங்களைப் பெறவும்.",
      expertRec: "நிபுணர் பரிந்துரைகள்",
      herbicide: "களைக்கொல்லி பரிந்துரைகள்",
      herbicideDesc: "உங்கள் பயிர் மற்றும் களை வகைகளுக்கு ஏற்ப தயாரிக்கப்பட்ட ஸ்மார்ட் களைக்கொல்லி ஆலோசனைகளைப் பெறுங்கள்.",
      herbicideSubtitle: "உகந்த தெளிக்கும் அட்டவணைகள்",
      howWorks: "இது எப்படி வேலை செய்கிறது",
      capture: "பட்டம் பிடிக்க",
      captureDesc: "உங்கள் கேமராவைப் பயன்படுத்தி களை-பாதிக்கப்பட்ட பகுதியின் புகைப்படத்தை எடுக்கவும்",
      analyze: "பகுப்பாய்வு",
      analyzeDesc: "AI அமைப்பு களை வகைகளை அடையாளம் கண்டு பயிர் சுகாதாரத்தை பகுப்பாய்வு செய்கிறது",
      results: "முடிவுகளைப் பெறுங்கள்",
      resultsDesc: "உங்கள் பயிர்களுக்கு ஏற்ப சிகிச்சை பரிந்துரைகளைப் பெறுங்கள்"
    }
  };

  const t = translations[language];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Professional Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconRow}>
              <MaterialCommunityIcons name="sprout" size={32} color="white" />
              <Text style={styles.headerTitle}>{t.title}</Text>
            </View>
            <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
          </View>
          <Pressable style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
            <MaterialIcons name="account-circle" size={40} color="white" />
          </Pressable>
        </View>

        {/* LANGUAGE SELECTOR */}
        <View style={styles.languageSelectorContainer}>
          <TouchableOpacity
            style={[
              styles.langButton,
              language === "en" && styles.langButtonActive
            ]}
            onPress={() => setLanguage("en")}
          >
            <Text style={[
              styles.langButtonText,
              language === "en" && styles.langButtonTextActive
            ]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.langButton,
              language === "si" && styles.langButtonActive
            ]}
            onPress={() => setLanguage("si")}
          >
            <Text style={[
              styles.langButtonText,
              language === "si" && styles.langButtonTextActive
            ]}>සිංහල</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.langButton,
              language === "ta" && styles.langButtonActive
            ]}
            onPress={() => setLanguage("ta")}
          >
            <Text style={[
              styles.langButtonText,
              language === "ta" && styles.langButtonTextActive
            ]}>தமிழ்</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Info Cards with Gradient */}
      <Animated.View 
        style={[
          styles.infoContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={[styles.infoCard, styles.greenGradient]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="leaf" size={28} color="#06602aff" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t.activeFields}</Text>
            <Text style={styles.infoValue}>3</Text>
            <Text style={styles.infoSubtext}>{t.allHealthy}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, styles.blueGradient]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="sprout" size={28} color="#06602aff" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t.growthStage}</Text>
            <Text style={[styles.infoValue, styles.stageValue]}>{t.tillering}</Text>
            <Text style={styles.infoSubtext}>{t.dayOnTrack}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Quick Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <MaterialIcons name="eco" size={20} color="#06602aff" />
          <Text style={styles.statText}>{t.healthy}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialIcons name="warning" size={20} color="#f59e0b" />
          <Text style={styles.statText}>{t.alerts}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialIcons name="water-drop" size={20} color="#3b82f6" />
          <Text style={styles.statText}>{t.optimal}</Text>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="lightning-bolt" size={24} color="#5a7c59" />
        <Text style={styles.sectionTitle}>{t.aiFeatures}</Text>
      </View>

      <Pressable 
        style={[styles.featureCard, styles.card1Border]}
        onPress={() => navigation.navigate('detector')}
        android_ripple={{ color: '#f0fdf4' }}
      >
        <View style={styles.featureIconContainer}>
          <MaterialCommunityIcons name="map-search" size={32} color="#06602aff" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureTitleRow}>
            <Text style={styles.featureTitle}>{t.localization}</Text>
          </View>
          <Text style={styles.featureDesc}>
            {t.localizationDesc}
          </Text>
          <View style={styles.featureFooter}>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#9ca3af" />
            <Text style={styles.featureTime}>{t.instantResults}</Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="#6b7280" />
      </Pressable>

      <Pressable 
        style={[styles.featureCard, styles.card2Border]}
        onPress={() => navigation.navigate('dete')}
        android_ripple={{ color: '#f0fdf4' }}
      >
        <View style={styles.featureIconContainer}>
          <MaterialCommunityIcons name="leaf-circle" size={32} color="#06602aff" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureTitleRow}>
            <Text style={styles.featureTitle}>{t.identification}</Text>
          </View>
          <Text style={styles.featureDesc}>
            {t.identificationDesc}
          </Text>
          <View style={styles.featureFooter}>
            <MaterialCommunityIcons name="brain" size={14} color="#9ca3af" />
            <Text style={styles.featureTime}>{t.expertRec}</Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="#6b7280" />
      </Pressable>

      
      <Pressable 
        style={[styles.featureCard, styles.card3Border]}
        onPress={() => navigation.navigate('herbicides')}
        android_ripple={{ color: '#f0fdf4' }}
      >
        <View style={styles.featureIconContainer}>
          <MaterialCommunityIcons name="spray-bottle" size={32} color="#06602aff" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureTitleRow}>
            <Text style={styles.featureTitle}>{t.herbicide}</Text>
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.featureDesc}>
            {t.herbicideDesc}
          </Text>
          <View style={styles.featureFooter}>
            <MaterialCommunityIcons name="calendar-check" size={14} color="#9ca3af" />
            <Text style={styles.featureTime}>{t.herbicideSubtitle}</Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="#6b7280" />
      </Pressable>

     
      {/* How It Works Section */}
      <View style={styles.howItWorksSection}>
        <View style={styles.howHeaderRow}>
          <MaterialCommunityIcons name="cog" size={24} color="#5a7c59" />
          <Text style={styles.howTitle}>{t.howWorks}</Text>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t.capture}</Text>
            <Text style={styles.stepDesc}>
              {t.captureDesc}
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t.analyze}</Text>
            <Text style={styles.stepDesc}>
              {t.analyzeDesc}
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t.results}</Text>
            <Text style={styles.stepDesc}>
              {t.resultsDesc}
            </Text>
          </View>
        </View>
      </View>


      {/* Bottom Spacing */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f7f4',
  },
  headerContainer: {
    backgroundColor: '#06602aff',
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    color: '#d1d5db',
    fontSize: 13,
    marginTop: 6,
  },
  profileButton: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  // LANGUAGE SELECTOR
  languageSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 0,
  },
  langButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  langButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  langButtonTextActive: {
    color: '#06602aff',
  },
  infoContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginTop: -20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  greenGradient: {
    borderLeftWidth: 4,
    borderLeftColor: '#5a7c59',
  },
  blueGradient: {
    borderLeftWidth: 4,
    borderLeftColor: '#5a7c59',
  },
  iconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  infoContent: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#06602aff',
  },
  stageValue: {
    color: '#06602aff',
  },
  infoSubtext: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2d5016',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  card1Border: {
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#5a7c59',
  },
  card2Border: {
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#5a7c59',
  },
  card3Border: {
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#5a7c59',
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  featureTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
  },
  badge: {
    backgroundColor: '#5a7c59',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadge: {
    backgroundColor: '#7c3aed',
  },
  newBadge: {
    backgroundColor: '#06602aff',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  featureDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  featureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  historySection: {
    marginTop: 10,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successIcon: {
    backgroundColor: '#f0fdf4',
  },
  infoIcon: {
    backgroundColor: '#eff6ff',
  },
  historyTextContainer: {
    flex: 1,
  },
  historyMainText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 3,
  },
  historySubText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 3,
  },
  historyTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  historyBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadge: {
    backgroundColor: '#dbeafe',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
  howItWorksSection: {
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  howHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  howTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#06602aff',
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#06602aff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#06602aff',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});