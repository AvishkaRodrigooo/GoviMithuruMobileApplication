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
      {/* Professional Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconRow}>
              <MaterialCommunityIcons name="sprout" size={32} color="white" />
              <Text style={styles.headerTitle}>Weeds Management</Text>
            </View>
            <Text style={styles.headerSubtitle}>Intelligent weed detection and treatment</Text>
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
            <Text style={styles.infoSubtext}>All healthy</Text>
          </View>
        </View>

        <View style={[styles.infoCard, styles.blueGradient]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="sprout" size={28} color="#3b82f6" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Growth Stage</Text>
            <Text style={[styles.infoValue, styles.stageValue]}>Tillering</Text>
            <Text style={styles.infoSubtext}>Day 45 - On track</Text>
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

      {/* Features Section */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="lightning-bolt" size={24} color="#5a7c59" />
        <Text style={styles.sectionTitle}>AI-Powered Features</Text>
      </View>

      <Pressable 
        style={[styles.featureCard, styles.card1Border]}
        onPress={() => navigation.navigate('detector')}
        android_ripple={{ color: '#f0fdf4' }}
      >
        <View style={styles.featureIconContainer}>
          <MaterialCommunityIcons name="map-search" size={32} color="#5a7c59" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureTitleRow}>
            <Text style={styles.featureTitle}>Weeds Localization</Text>
          </View>
          <Text style={styles.featureDesc}>
            Detect and highlight weed-infected areas directly on the image for targeted treatment.
          </Text>
          <View style={styles.featureFooter}>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#9ca3af" />
            <Text style={styles.featureTime}>Instant results</Text>
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
          <MaterialCommunityIcons name="leaf-circle" size={32} color="#5a7c59" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureTitleRow}>
            <Text style={styles.featureTitle}>Identification & Treatment</Text>
          </View>
          <Text style={styles.featureDesc}>
            Upload images to identify weed types and receive expert treatment recommendations with detailed reasoning.
          </Text>
          <View style={styles.featureFooter}>
            <MaterialCommunityIcons name="brain" size={14} color="#9ca3af" />
            <Text style={styles.featureTime}>Expert recommendations</Text>
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
          <MaterialCommunityIcons name="spray-bottle" size={32} color="#5a7c59" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureTitleRow}>
            <Text style={styles.featureTitle}>Herbicide Recommendations</Text>
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.featureDesc}>
            Get smart herbicide advice tailored to your crop and weed types for optimal protection.
          </Text>
          <View style={styles.featureFooter}>
            <MaterialCommunityIcons name="calendar-check" size={14} color="#9ca3af" />
            <Text style={styles.featureTime}>Optimized spraying schedules</Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="#6b7280" />
      </Pressable>

     
      {/* How It Works Section */}
      <View style={styles.howItWorksSection}>
        <View style={styles.howHeaderRow}>
          <MaterialCommunityIcons name="cog" size={24} color="#5a7c59" />
          <Text style={styles.howTitle}>How It Works</Text>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Capture Image</Text>
            <Text style={styles.stepDesc}>
              Take a photo of the weed-affected area using your camera
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Analyze</Text>
            <Text style={styles.stepDesc}>
              AI system identifies weed types and analyzes crop health
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Get Results</Text>
            <Text style={styles.stepDesc}>
              Receive treatment recommendations tailored to your crops
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
    backgroundColor: '#2d5016',
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
    color: '#111827',
  },
  stageValue: {
    color: '#5a7c59',
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
    backgroundColor: '#5a7c59',
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
    color: '#2d5016',
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
    backgroundColor: '#5a7c59',
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
    color: '#2d5016',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});