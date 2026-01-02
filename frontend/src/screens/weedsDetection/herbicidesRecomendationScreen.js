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
            <Text style={styles.headerTitle}>🌾 Herbicide Guidelines</Text>
            <Text style={styles.headerSubtitle}>Choosing suitable weed killers</Text>
          </View>
          <MaterialCommunityIcons name="spray" size={28} color="#16a34a" style={styles.headerIcon} />
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
          <MaterialCommunityIcons name="information" size={24} color="#3b82f6" />
          <Text style={styles.infoText}>
            Suitable herbicide types for different weed plant types are shown below
          </Text>
        </Animated.View>

        {/* Herbicide Types Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Herbicide Types</Text>
          <MaterialIcons name="category" size={20} color="#16a34a" />
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
          <Text style={styles.sectionTitle}>⚠️ Safety Tips</Text>
          <MaterialIcons name="warning" size={20} color="#f59e0b" />
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
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerIcon: {
    marginLeft: 'auto',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  herbicideCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,

    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 20,
  },
  examplesContainer: {
    marginBottom: 1,
  },
  examplesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  examplesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#4b5563',
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
  safetyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
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
    borderRadius: 12,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});

export default HerbicideScreen;