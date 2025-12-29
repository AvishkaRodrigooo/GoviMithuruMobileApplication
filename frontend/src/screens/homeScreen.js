import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');

  const navTo = (screen, tab) => {
    setActiveTab(tab);
    navigation?.navigate(screen);
  };

  return (
    <View style={styles.mainWrapper}>
      {/* Header with Gradient Effect */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="sprout" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.appName}>GoviMithuru</Text>
              <Text style={styles.appSubtitle}>Smart Farming Assistant</Text>
            </View>
          </View>
          <Pressable 
            style={styles.profileBtn} 
            onPress={() => navigation?.navigate('Profile')}
          >
            <MaterialCommunityIcons name="account-circle" size={36} color="#fff" />
          </Pressable>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome Back, Farmer! 🌾</Text>
          <Text style={styles.welcomeText}>
            Your AI-powered platform for intelligent paddy cultivation
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Stats Dashboard */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <MaterialCommunityIcons name="sprout-outline" size={32} color="#fff" />
            <Text style={styles.statNumber}>2.5K</Text>
            <Text style={styles.statLabel}>Active Farms</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
            <MaterialCommunityIcons name="chart-line" size={32} color="#fff" />
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <MaterialCommunityIcons name="shield-check" size={32} color="#fff" />
            <Text style={styles.statNumber}>15%</Text>
            <Text style={styles.statLabel}>Loss Reduced</Text>
          </View>
        </View>

        {/* AI Features Section */}
        <Text style={styles.sectionTitle}>AI-Powered Solutions</Text>
        
        {/* Feature Grid */}
        <View style={styles.featuresGrid}>
          <Pressable 
            style={[styles.featureCard, styles.featureLarge]}
            onPress={() => navTo('Pest', 'pest')}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#fef3c7' }]}>
              <MaterialCommunityIcons name="bug" size={40} color="#f59e0b" />
            </View>
            <Text style={styles.featureTitle}>Pest Detection</Text>
            <Text style={styles.featureDesc}>AI-powered pest identification & forecasting</Text>
            <View style={styles.featureBadge}>
              <Text style={styles.badgeText}>Real-time</Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.featureCard, styles.featureLarge]}
            onPress={() => navTo('weedsDashboard', 'weeds')}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#d1fae5' }]}>
              <MaterialCommunityIcons name="leaf" size={40} color="#10b981" />
            </View>
            <Text style={styles.featureTitle}>Weed Control</Text>
            <Text style={styles.featureDesc}>Smart weed detection & management</Text>
            <View style={styles.featureBadge}>
              <Text style={styles.badgeText}>Vision AI</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.featuresGrid}>
          <Pressable 
            style={[styles.featureCard, styles.featureLarge]}
            onPress={() => navTo('Stage', 'harvest')}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#dbeafe' }]}>
              <MaterialCommunityIcons name="warehouse" size={40} color="#3b82f6" />
            </View>
            <Text style={styles.featureTitle}>Harvest Advisory</Text>
            <Text style={styles.featureDesc}>Post-harvest storage & timing optimization</Text>
            <View style={styles.featureBadge}>
              <Text style={styles.badgeText}>Predictive</Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.featureCard, styles.featureLarge]}
            onPress={() => navTo('Pricing', 'pricing')}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#fee2e2' }]}>
              <MaterialCommunityIcons name="chart-areaspline" size={40} color="#ef4444" />
            </View>
            <Text style={styles.featureTitle}>Price Forecast</Text>
            <Text style={styles.featureDesc}>Market price predictions & trends</Text>
            <View style={styles.featureBadge}>
              <Text style={styles.badgeText}>ML-based</Text>
            </View>
          </Pressable>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information" size={24} color="#3b82f6" />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>24/7 AI Support</Text>
            <Text style={styles.bannerText}>
              Our intelligent system continuously monitors and guides your farming decisions
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Pressable 
          style={styles.navItem} 
          onPress={() => navTo('Home', 'home')}
        >
          <View style={[styles.navIconWrapper, activeTab === 'home' && styles.navIconActive]}>
            <MaterialCommunityIcons 
              name="home" 
              size={24} 
              color={activeTab === 'home' ? '#fff' : '#9ca3af'} 
            />
          </View>
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>
            Home
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => navTo('Pest', 'pest')}
        >
          <View style={[styles.navIconWrapper, activeTab === 'pest' && styles.navIconActive]}>
            <MaterialCommunityIcons 
              name="bug" 
              size={24} 
              color={activeTab === 'pest' ? '#fff' : '#9ca3af'} 
            />
          </View>
          <Text style={[styles.navText, activeTab === 'pest' && styles.navTextActive]}>
            Pest
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => navTo('Stage', 'harvest')}
        >
          <View style={[styles.navIconWrapper, activeTab === 'harvest' && styles.navIconActive]}>
            <MaterialCommunityIcons 
              name="warehouse" 
              size={24} 
              color={activeTab === 'harvest' ? '#fff' : '#9ca3af'} 
            />
          </View>
          <Text style={[styles.navText, activeTab === 'harvest' && styles.navTextActive]}>
            Harvest
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => navTo('weedsDashboard', 'weeds')}
        >
          <View style={[styles.navIconWrapper, activeTab === 'weeds' && styles.navIconActive]}>
            <MaterialCommunityIcons 
              name="leaf" 
              size={24} 
              color={activeTab === 'weeds' ? '#fff' : '#9ca3af'} 
            />
          </View>
          <Text style={[styles.navText, activeTab === 'weeds' && styles.navTextActive]}>
            Weeds
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => navTo('Pricing', 'pricing')}
        >
          <View style={[styles.navIconWrapper, activeTab === 'pricing' && styles.navIconActive]}>
            <MaterialCommunityIcons 
              name="currency-usd" 
              size={24} 
              color={activeTab === 'pricing' ? '#fff' : '#9ca3af'} 
            />
          </View>
          <Text style={[styles.navText, activeTab === 'pricing' && styles.navTextActive]}>
            Pricing
          </Text>
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
  header: {
    backgroundColor: '#16a34a',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  appSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  profileBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  featureLarge: {
    flex: 1,
  },
  featureIcon: {
    width: 70,
    height: 70,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 10,
  },
  featureBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 12,
    color: '#3b82f6',
    lineHeight: 16,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: 75,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  navIconActive: {
    backgroundColor: '#16a34a',
  },
  navText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
});