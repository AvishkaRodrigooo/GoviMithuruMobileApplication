import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  // Navigation Helper
  const navTo = (screen) => navigation.navigate(screen);

  return (
    <View style={styles.mainWrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="rice" size={24} color="#fff" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.appTitle}>GoviMithuru</Text>
              <Text style={styles.aiAssistant}>AI Assistant</Text>
            </View>
            <Pressable style={styles.profileIcon}>
              <MaterialCommunityIcons name="account-circle" size={32} color="#374151" />
            </Pressable>
          </View>

          <Text style={styles.tagline}>
            Your intelligent companion for smarter paddy farming decisions
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>5K+</Text>
              <Text style={styles.statLabel}>Farmers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <Text style={styles.sectionTitle}>Smart Features</Text>
        <Text style={styles.sectionSubtitle}>Tap to explore AI-powered tools</Text>
          
        <Pressable
          style={[styles.card, { backgroundColor: '#ecfdf5' }]}
          onPress={() => navTo('Weed')}
        >
          <MaterialCommunityIcons name="bug-outline" size={26} color="#16a34a" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Pest Attack Detection</Text>
            <Text style={styles.cardDesc}>Identify pest attacks using images</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: '#eff6ff' }]}
          onPress={() => navTo('Stage')}
        >
          <MaterialCommunityIcons name="chart-line" size={26} color="#2563eb" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Post Harvest Analysis</Text>
            <Text style={styles.cardDesc}>Yield and storage recommendations</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: '#f0fdf4' }]}
          onPress={() => navTo('weedsDashboard')}
        >
          <MaterialCommunityIcons name="leaf" size={26} color="#22c55e" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Weeds Detector</Text>
            <Text style={styles.cardDesc}>Detect and classify weeds in fields</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: '#fff7ed', marginBottom: 100 }]}
          onPress={() => navTo('Pricing')}
        >
          <MaterialCommunityIcons name="currency-usd" size={26} color="#ea580c" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Pricing Forecast</Text>
            <Text style={styles.cardDesc}>Predict paddy market prices</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* --- CUSTOM BOTTOM NAVIGATION --- */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => navTo('Home')}>
          <MaterialCommunityIcons name="home" size={24} color="#16a34a" />
          <Text style={[styles.navText, {color: '#16a34a'}]}>Home</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => navTo('Weed')}>
          <MaterialCommunityIcons name="bug" size={24} color="#6b7280" />
          <Text style={styles.navText}>Pest</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => navTo('Stage')}>
          <MaterialCommunityIcons name="chart-areaspline" size={24} color="#6b7280" />
          <Text style={styles.navText}>Harvest</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => navTo('weedsDashboard')}>
          <MaterialCommunityIcons name="leaf" size={24} color="#6b7280" />
          <Text style={styles.navText}>Weeds</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => navTo('Pricing')}>
          <MaterialCommunityIcons name="currency-usd" size={24} color="#6b7280" />
          <Text style={styles.navText}>Pricing</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  aiAssistant: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  profileIcon: {
    padding: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardText: {
    marginLeft: 14,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  // Bottom Nav Styles
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 10,
    paddingBottom: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
});