import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Pressable,
  Animated,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HerbicideScreen = ({ navigation }) => {
  const [language, setLanguage] = useState('en');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  const translations = {
    en: {
      headerTitle: 'Herbicide Guidelines',
      headerSubtitle: 'Choosing the right herbicide for your needs',
      infoText: 'Select the appropriate herbicide type for your specific weed control needs',
      agroShop: 'Agro Shop',
      herbicideTypes: 'Herbicide Types',
      safetyPrecautions: 'Safety Precautions',
      applicationSchedule: 'Application Schedule',
      backToDashboard: 'Back to Dashboard',
      examples: 'Examples:',
      herbicides: [
        {
          title: 'Pre-plant Herbicides',
          description: 'Herbicides used to clean the field before cultivation',
          examples: ['Glyphosate', 'Paraquat']
        },
        {
          title: 'One-shot Herbicides',
          description: 'Herbicides that provide desired results with single application',
          examples: ['Solito 320EC', 'TebutSiriushiuron']
        },
        {
          title: 'Grass Killers',
          description: 'Herbicides for removing unwanted grass and weed plants',
          examples: ['Clincher 10EC', 'Facet']
        },
        {
          title: 'Sedges & Broad Leaves Killers',
          description: 'Herbicides for removing sedge plants and broad-leaf weeds',
          examples: ['Sunrice', 'Fluto']
        }
      ],
      safetyTips: [
        { title: 'Safety Equipment', description: 'Use safety equipment when applying herbicides' },
        { title: 'Correct Dosage', description: 'Use the dosage according to manufacturer\'s instructions' },
        { title: 'Application Time', description: 'Choose application time according to weather conditions' },
        { title: 'Safe Storage', description: 'Store herbicides in a safe place away from children' }
      ]
    },
    si: {
      headerTitle: 'වල් නාශක මාර්ගෝපදේශ',
      headerSubtitle: 'ඔබේ අවශ්‍යතා සඳහා නිවැරදි වල් නාශක තෝරා ගැනීම',
      infoText: 'ඔබේ වල් නාශක පාලන අවශ්‍යතා සඳහා සුදුසු වල් නාශක වර්ගය තෝරා ගන්න',
      agroShop: 'කෘෂි වෙලඳසල',
      herbicideTypes: 'වල් නාශක වර්ගයන්',
      safetyPrecautions: 'ආරක්‍ෂා පූර්වාරම්භ',
      applicationSchedule: 'යෙදවුම් කාලසටහන',
      backToDashboard: 'උපකරණ පුවරුවට ආපසු',
      examples: 'උදාහරණ:',
      herbicides: [
        {
          title: 'පෙර රෝපණ වල් නාශක',
          description: 'වගා කිරීමට පෙර ක්ෂේත්ර පරිශීලනය කිරීමට භාවිතා කරන වල් නාශක',
          examples: ['ග්ලිෆසේට්', 'පරාකේට්']
        },
        {
          title: 'එක-වෙඩි වල් නාශක',
          description: 'තනිකම යෙදවුමින් ඉපදි ප්‍රතිඵල ලබා දෙන වල් නාශක',
          examples: ['සොලිටෝ 320EC', 'ටෙබුට් සිරියුස් හිউරෝන්']
        },
        {
          title: 'තෘණ වල් නාශක',
          description: 'අනවශ්‍ය තෘණ සහ වල් නාශක ශාකයන් ඉවත් කිරීමට වල් නාශක',
          examples: ['ක්ලින්චර් 10EC', 'ෆේසට්']
        },
        {
          title: 'තිරි සහ පුළුල් පත්‍ර වල් නාශක',
          description: 'තිරි ශාකයන් සහ පුළුල් පත්‍ර වල් නාශක ඉවත් කිරීමට වල් නාශක',
          examples: ['සුන්රයිස්', 'ෆ්ලූටෝ']
        }
      ],
      safetyTips: [
        { title: 'ආරක්‍ෂා උපකරණ', description: 'වල් නාශක යෙදවීමේදී ආරක්‍ෂා උපකරණ භාවිතා කරන්න' },
        { title: 'නිවැරදි ඩෝස්', description: 'නිෂ්පාදක උපදෙස් පරිදි ඩෝස් භාවිතා කරන්න' },
        { title: 'යෙදවුම් වේලාව', description: 'කාලගුණ තත්ත්‍ව අනුව යෙදවුම් වේලාව තෝරා ගන්න' },
        { title: 'ආරක්ෂිත ගබඩා', description: 'වල් නාශක දරුවන්ගෙන් ඉවතට ආරක්ෂිත තැනක ගබඩා කරන්න' }
      ]
    },
    ta: {
      headerTitle: 'களைக்கொல்லி வழிகாட்டுதல்கள்',
      headerSubtitle: 'உங்கள் தேவைக்கு சரியான களைக்கொல்லி தேர்ந்தெடுப்பது',
      infoText: 'உங்கள் குறிப்பிட்ட களை கட்டுப்பாட்டு தேவைக்கு பொருத்தமான களைக்கொல்லி வகையைத் தேர்ந்தெடுக்கவும்',
      agroShop: 'கிராம நிலைய கடை',
      herbicideTypes: 'களைக்கொல்லி வகைகள்',
      safetyPrecautions: 'பாதுகாப்பு எச்சரிக்கைகள்',
      applicationSchedule: 'விண்ணப்ப அட்டவணை',
      backToDashboard: 'டாஷ்போர்டுக்குத் திரும்பவும்',
      examples: 'உதாரணங்கள்:',
      herbicides: [
        {
          title: 'விதை நட்ட முன் களைக்கொல்லி',
          description: 'விதை நட்ட முன் வயலை சுத்தம் செய்ய பயன்படுத்தப்படும் களைக்கொல்லி',
          examples: ['க்ளைபோசேட்', 'பராகுவாட்']
        },
        {
          title: 'ஒரு-வெடி களைக்கொல்லி',
          description: 'ஒற்றை பயன்பாட்டில் விரும்பிய ফলাফல்களை வழங்கும் களைக்கொல்லி',
          examples: ['சொலிட்டோ 320EC', 'டெபுட்சிரியுஷியுரான்']
        },
        {
          title: 'புல் கொல்லிகள்',
          description: 'தேவையற்ற புல் மற்றும் களை செடிகளை அகற்ற களைக்கொல்லி',
          examples: ['கிளிஞ்சர் 10EC', 'ஃபேசட்']
        },
        {
          title: 'கூட மற்றும் பரந்த இலை கொல்லிகள்',
          description: 'கூட செடிகள் மற்றும் பரந்த இலை களைகளை அகற்ற களைக்கொல்லி',
          examples: ['சன்ரைஸ்', 'ஃப்ளூட்டோ']
        }
      ],
      safetyTips: [
        { title: 'பாதுகாப்பு உपकरण', description: 'களைக்கொல்லி பயன்படுத்தும்போது பாதுகாப்பு உபकரணங்களை பயன்படுத்தவும்' },
        { title: 'சரியான மாত்திரை', description: 'உற்பத்தியாளரின் அறிவுறுத்தல்களின்படி மாத்திரை பயன்படுத்தவும்' },
        { title: 'விண்ணப்ப நேரம்', description: 'வானிலை நிலைமைகளுக்கு ஏற்ப விண்ணப்ப நேரம் தேர்ந்தெடுக்கவும்' },
        { title: 'பாதுகாப்பான சேமிப்பு', description: 'களைக்கொல்லிகளை குழந்தைகளிடமிருந்து விலகி ஒரு பாதுகாப்பான இடத்தில் சேமிக்கவும்' }
      ]
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const herbicideTypes = [
    {
      id: 1,
      icon: "seedling",
      color: "#10b981",
      borderColor: "#12ab66ff",
    },
    {
      id: 2,
      icon: "target",
      color: "#3b82f6",
      borderColor: "#3b82f6",
    },
    {
      id: 3,
      icon: "grass",
      color: "#22c55e",
      borderColor: "#22c55e",
    },
    {
      id: 4,
      icon: "leaf",
      color: "#8b5cf6",
      borderColor: "#8b5cf6",
    },
  ];

  const safetyIcons = ['shield-check', 'scale', 'weather-partly-cloudy', 'home-lock'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Language Selector */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{translations[language].headerTitle}</Text>
            <Text style={styles.headerSubtitle}>{translations[language].headerSubtitle}</Text>
          </View>
          <MaterialCommunityIcons name="spray-bottle" size={36} color="#95ae95ff" style={styles.headerIcon} />
        </View>

        {/* Language Selector Buttons */}
        <View style={styles.languageButtonsContainer}>
          <Pressable
            style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>English</Text>
          </Pressable>
          <Pressable
            style={[styles.languageButton, language === 'si' && styles.languageButtonActive]}
            onPress={() => setLanguage('si')}
          >
            <Text style={[styles.languageButtonText, language === 'si' && styles.languageButtonTextActive]}>සිංහල</Text>
          </Pressable>
          <Pressable
            style={[styles.languageButton, language === 'ta' && styles.languageButtonActive]}
            onPress={() => setLanguage('ta')}
          >
            <Text style={[styles.languageButtonText, language === 'ta' && styles.languageButtonTextActive]}>தமிழ்</Text>
          </Pressable>
        </View>

        {/* Info Card */}
        <Animated.View 
          style={[
            styles.infoCard,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }]
            }
          ]}
        >
          <MaterialCommunityIcons name="information-outline" size={24} color="#5a7c59" />
          <Text style={styles.infoText}>
            {translations[language].infoText}
          </Text>
        </Animated.View>
{/* Shop Buttons */}
<View style={styles.shopButtonsContainer}>
 <Pressable
  style={[styles.shopButton, styles.agroButton]}
  onPress={() => navigation.navigate('AgroShop')}
>
  <MaterialCommunityIcons name="storefront" size={18} color="#fff" />
  <Text style={styles.shopButtonText}>{translations[language].agroShop}</Text>
</Pressable>
</View>

        {/* Herbicide Types Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{translations[language].herbicideTypes}</Text>
          <MaterialIcons name="category" size={20} color="#06602aff" />
        </View>

        {herbicideTypes.map((type) => {
          const typeData = translations[language].herbicides[type.id - 1];
          return (
            <Pressable
              key={type.id}
              style={[
                styles.herbicideCard,
                { borderLeftWidth: 5, borderLeftColor: type.borderColor },
              ]}
              android_ripple={{ color: '#f0fdf4' }}
              onPress={() => {
                if (type.id === 1) {
                  navigation.navigate('PrePlantHerbicides');
                } else if (type.id === 2) {
                  navigation.navigate('OneShotHerbicides');
                } else if (type.id === 3) {
                  navigation.navigate('grassKillersHerbicides');
                } else if (type.id === 4) {
                  navigation.navigate('BroadLeavesHerbicides');
                }
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: type.color + '20' }]}>
                <MaterialCommunityIcons name={type.icon} size={28} color={type.color} />
              </View>
              <View style={styles.contentContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{typeData.title}</Text>
                  <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
                </View>
                <Text style={styles.cardDescription}>{typeData.description}</Text>
                
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesLabel}>{translations[language].examples}</Text>
                  <View style={styles.examplesList}>
                    {typeData.examples.map((example, index) => (
                      <View key={index} style={styles.exampleTag}>
                        <Text style={styles.exampleText}>{example}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Safety Tips Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{translations[language].safetyPrecautions}</Text>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#5a7c59" />
        </View>

        <View style={styles.safetyGrid}>
          {translations[language].safetyTips.map((tip, index) => (
            <View key={index} style={styles.safetyCard}>
              <View style={[styles.safetyIconContainer, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name={safetyIcons[index]} size={24} color="#d97706" />
              </View>
              <Text style={styles.safetyTitle}>{tip.title}</Text>
              <Text style={styles.safetyDescription}>{tip.description}</Text>
            </View>
          ))}
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Pressable 
            style={[styles.actionButton, styles.primaryButton]}
            android_ripple={{ color: '#047857' }}
          >
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>{translations[language].applicationSchedule}</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.actionButton, styles.secondaryButton]}
            android_ripple={{ color: '#d1d5db' }}
            onPress={() => navigation.navigate('WeedsDashboard')}
          >
            <MaterialIcons name="dashboard" size={20} color="#374151" />
            <Text style={styles.secondaryButtonText}>{translations[language].backToDashboard}</Text>
          </Pressable>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f7f4',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#06602aff',
    borderBottomWidth: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  shopButtonsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  marginTop: 20,
  gap: 10,
},

shopButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  borderRadius: 10,
  gap: 6,
  elevation: 2,
},

agroButton: {
  backgroundColor: '#58956eff',
},

farmButton: {
  backgroundColor: '#4f6085ff',
},

fertilizerButton: {
  backgroundColor: '#a08cb3ff',
},

shopButtonText: {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: '700',
},

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d4e8c1',
    marginTop: 4,
  },
  headerIcon: {
    marginLeft: 'auto',
  },
  languageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  languageButtonActive: {
    backgroundColor: '#5a7c59',
    borderColor: '#5a7c59',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
  },
  languageButtonTextActive: {
    color: '#ffffff',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    padding: 14,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5a7c59',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2d5016',
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d5016',
  },
  herbicideCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d5016',
    flex: 1,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 19,
  },
  examplesContainer: {
    marginBottom: 1,
  },
  examplesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5a7c59',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  examplesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleTag: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exampleText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailsText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  safetyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  safetyCard: {
    width: width / 2 - 30,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  safetyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#fef3c7',
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d5016',
    marginBottom: 4,
  },
  safetyDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#5a7c59',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
});

export default HerbicideScreen;