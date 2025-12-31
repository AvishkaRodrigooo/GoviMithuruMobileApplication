import { View, Text, Pressable, StyleSheet, ScrollView, Animated } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';

export default function WeedsDashboardScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
      {/* Beautiful Header with Gradient Effect */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🌾 Paddy Cultivation</Text>
            <Text style={styles.headerSubtitle}>Smart farming at your fingertips</Text>
          </View>
          <Pressable style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
            <MaterialIcons name="account-circle" size={40} color="white" />
          </Pressable>
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
            <MaterialCommunityIcons name="leaf" size={28} color="#22c55e" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Active Fields</Text>
            <Text style={styles.infoValue}>3</Text>
            <Text style={styles.infoSubtext}>All healthy ✓</Text>
          </View>
        </View>

        <View style={[styles.infoCard, styles.blueGradient]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="sprout" size={28} color="#3b82f6" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Growth Stage</Text>
            <Text style={[styles.infoValue, styles.stageValue]}>Tillering</Text>
            <Text style={styles.infoSubtext}>Day 45 • On track</Text>
          </View>
        </View>
      </Animated.View>

      {/* Quick Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <MaterialIcons name="eco" size={20} color="#10b981" />
          <Text style={styles.statText}>92% Healthy</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialIcons name="warning" size={20} color="#f59e0b" />
          <Text style={styles.statText}>2 Alerts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialIcons name="water-drop" size={20} color="#3b82f6" />
          <Text style={styles.statText}>Optimal</Text>
        </View>
      </View>

      {/* Features Section with Enhanced Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>AI-Powered Features</Text>
        <MaterialIcons name="stars" size={20} color="#fbbf24" />
      </View>

      <Pressable 
        style={[styles.featureCard, styles.redFeature]}
        onPress={() => navigation.navigate('detector')}
        android_ripple={{ color: '#fca5a5' }}
      >
        <View style={styles.featureIconContainer}>
          <MaterialIcons name="camera-alt" size={32} color="#dc2626" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureTitleRow}>
            <Text style={styles.featureTitle}>AI-Based Weeds Localization</Text>
           
          </View>
          <Text style={styles.featureDesc}>
            🎯 Detect and highlight weed-infected areas directly on the image.
          </Text>
          <View style={styles.featureFooter}>
            <MaterialIcons name="schedule" size={14} color="#9ca3af" />
            <Text style={styles.featureTime}>Instant results</Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="#6b7280" />
      </Pressable>

      <Pressable 
        style={[styles.featureCard, styles.purpleFeature]}
        onPress={() => navigation.navigate('dete')}
        android_ripple={{ color: '#c4b5fd' }}
      >
        <View style={styles.featureIconContainer}>
          <MaterialCommunityIcons name="sprout" size={32} color="#1c7034ff" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureTitleRow}>
            <Text style={styles.featureTitle}>Weeds Identification & Treatment Recommendation</Text>
           
          </View>
          <Text style={styles.featureDesc}>
            📊Upload a crop/plant image to identify weeds type and get treatment recommendations with reasons.
          </Text>
          <View style={styles.featureFooter}>
            <MaterialIcons name="science" size={14} color="#9ca3af" />
            <Text style={styles.featureTime}>Expert recommendations</Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="#6b7280" />
      </Pressable>

      
     <Pressable 
        style={[styles.featureCard, styles.blueFeature]}
        onPress={() => navigation.navigate('herbicides')}
        android_ripple={{ color: '#93c5fd' }}
      >
 
        <View style={styles.featureIconContainer}>
    <MaterialCommunityIcons name="spray" size={32} color="#10b981" />{/* Spray icon */}
  </View>
        <View style={styles.featureContent}>
          <View style={styles.featureTitleRow}>
            <Text style={styles.featureTitle}>Herbicides Recommendation</Text>
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.featureDesc}>
            🌱 Get smart herbicide advice to protect your crops
          </Text>
          <View style={styles.featureFooter}>
            <MaterialIcons name="timeline" size={14} color="#9ca3af" />
            <Text style={styles.featureTime}>Optimized spraying schedules</Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="#6b7280" />
      </Pressable>

     
     {/* How It Works Section */}
<View style={styles.howItWorksSection}>
  <Text style={styles.howTitle}>🛠️ How It Works</Text>

  <View style={styles.stepCard}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>1</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>ඡායාරූපයක් ගන්න</Text>
      <Text style={styles.stepDesc}>
        වල් පැල ඇති ස්ථානයේ පින්තූරයක් කැමරාවෙන් ගන්න
      </Text>
    </View>
  </View>

  <View style={styles.stepCard}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>2</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>විශ්ලේෂණය කරන්න</Text>
      <Text style={styles.stepDesc}>
        AI පද්ධතිය වල් පැල හඳුනාගනී
      </Text>
    </View>
  </View>

  <View style={styles.stepCard}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>3</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>ප්‍රතිඵල ලබාගන්න</Text>
      <Text style={styles.stepDesc}>
        නිවැරදි වල් පැල වර්ගය සහ විසඳුම් ලබාගන්න
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
    backgroundColor: '#f9fafb',
  },
  headerContainer: {
    backgroundColor: '#16a34a',
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
  howItWorksSection: {
  marginTop: 20,
  paddingHorizontal: 20,
},

howTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#166534',
  marginBottom: 12,
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
  backgroundColor: '#16a34a',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
},

stepNumberText: {
  color: '#fff',
  fontWeight: 'bold',
},

stepContent: {
  flex: 1,
},

stepTitle: {
  fontSize: 15,
  fontWeight: '700',
  color: '#166534',
  marginBottom: 4,
},

stepDesc: {
  fontSize: 13,
  color: '#6b7280',
  lineHeight: 18,
},

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#dcfce7',
    fontSize: 14,
  },
  profileButton: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
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
    borderLeftColor: '#22c55e',
  },
  blueGradient: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
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
    color: '#111827',
  },
  stageValue: {
    color: '#3b82f6',
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
    fontWeight: '600',
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
    gap: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111827',
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
  redFeature: {
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#dc2626',
  },
  purpleFeature: {
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#7c3aed',
  },
  blueFeature: {
    backgroundColor: '#fff',
    borderLeftWidth: 5,
    borderLeftColor: '#2563eb',
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
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadge: {
    backgroundColor: '#7c3aed',
  },
  newBadge: {
    backgroundColor: '#10b981',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
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
});