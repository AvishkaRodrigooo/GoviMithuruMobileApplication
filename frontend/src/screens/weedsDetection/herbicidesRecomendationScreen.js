import React, { useRef, useEffect } from 'react';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

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
      title: "Pre-plant Herbicides",
      description: "Herbicides used to clean the field before cultivation",
      icon: "seedling",
      color: "#10b981",
      borderColor: "#12ab66ff",
      examples: ["Glyphosate", "Paraquat"],
    },
    {
      id: 2,
      title: "One-shot Herbicides",
      description: "Herbicides that provide desired results with single application",
      icon: "target",
      color: "#3b82f6",
      borderColor: "#3b82f6",
      examples: ["Solito 320EC", "TebutSiriushiuron",],
     
    },
    {
      id: 3,
      title: "Grass Killers",
      description: "Herbicides for removing unwanted grass and weed plants",
      icon: "grass",
      color: "#22c55e",
      borderColor: "#22c55e",
      examples: ["Clincher 10EC", "Facet",],
      
    },
    {
      id: 4,
      title: "Sedges & Broad Leaves Killers",
      description: "Herbicides for removing sedge plants and broad-leaf weeds",
      icon: "leaf",
      color: "#8b5cf6",
      borderColor: "#8b5cf6",
      examples: ["Sunrice", "Fluto",],
      
    },
  ];

  const safetyTips = [
    {
      id: 1,
      title: "Safety Equipment",
      description: "Use safety equipment when applying herbicides",
      icon: "shield-check"
    },
    {
      id: 2,
      title: "Correct Dosage",
      description: "Use the dosage according to manufacturer's instructions",
      icon: "scale"
    },
    {
      id: 3,
      title: "Application Time",
      description: "Choose application time according to weather conditions",
      icon: "weather-partly-cloudy"
    },
    {
      id: 4,
      title: "Safe Storage",
      description: "Store herbicides in a safe place away from children",
      icon: "home-lock"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
         
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Herbicide Guidelines</Text>
            <Text style={styles.headerSubtitle}>Choosing the right herbicide for your needs</Text>
          </View>
          <MaterialCommunityIcons name="spray-bottle" size={36} color="#95ae95ff" style={styles.headerIcon} />
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
            Select the appropriate herbicide type for your specific weed control needs
          </Text>
        </Animated.View>
{/* Shop Buttons */}
<View style={styles.shopButtonsContainer}>
  <Pressable
    style={[styles.shopButton, styles.agroButton]}
    onPress={() => navigation.navigate('AgroShop')}
  >
    <MaterialCommunityIcons name="storefront" size={18} color="#fff" />
    <Text style={styles.shopButtonText}>Agro Shop</Text>
  </Pressable>

  <Pressable
    style={[styles.shopButton, styles.farmButton]}
    onPress={() => navigation.navigate('FarmShop')}
  >
    <MaterialCommunityIcons name="tractor" size={18} color="#fff" />
    <Text style={styles.shopButtonText}>Farm Shop</Text>
  </Pressable>

  <Pressable
    style={[styles.shopButton, styles.fertilizerButton]}
    onPress={() => navigation.navigate('FertilizerShop')}
  >
    <MaterialCommunityIcons name="sack" size={18} color="#fff" />
    <Text style={styles.shopButtonText}>Fertilizer Shop</Text>
  </Pressable>
</View>

        {/* Herbicide Types Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Herbicide Types</Text>
          <MaterialIcons name="category" size={20} color="#06602aff" />
        </View>

        {herbicideTypes.map((type) => (
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
      }else if(type.id == 2){
        navigation.navigate('OneShotHerbicides');
      }
      else if(type.id == 3){
        navigation.navigate('grassKillersHerbicides');
      }
      else if(type.id == 4){
        navigation.navigate('BroadLeavesHerbicides');
      }
    }}
  >
            <View style={[styles.iconContainer, { backgroundColor: type.color + '20' }]}>
              <MaterialCommunityIcons name={type.icon} size={28} color={type.color} />
            </View>
            <View style={styles.contentContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{type.title}</Text>
                <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
              </View>
              <Text style={styles.cardDescription}>{type.description}</Text>
              
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesLabel}>Examples:</Text>
                <View style={styles.examplesList}>
                  {type.examples.map((example, index) => (
                    <View key={index} style={styles.exampleTag}>
                      <Text style={styles.exampleText}>{example}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <Text style={styles.detailsText}>{type.details}</Text>
            </View>
          </Pressable>
        ))}

        {/* Safety Tips Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safety Precautions</Text>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#5a7c59" />
        </View>

        <View style={styles.safetyGrid}>
          {safetyTips.map((tip) => (
            <View key={tip.id} style={styles.safetyCard}>
              <View style={[styles.safetyIconContainer, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name={tip.icon} size={24} color="#d97706" />
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
            <Text style={styles.primaryButtonText}>Application Schedule</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.actionButton, styles.secondaryButton]}
            android_ripple={{ color: '#d1d5db' }}
            onPress={() => navigation.navigate('WeedsDashboard')}
          >
            <MaterialIcons name="dashboard" size={20} color="#374151" />
            <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
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