import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Dimensions, SafeAreaView, StatusBar, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

export default function StorageDashboardScreen({ navigation }) {
  
  // Data derived from 10-year market research and 5-year weather research
  const intelData = {
    totalStock: "2,450",
    bags: "49",
    estimatedValue: "592,900",
    profitTrend: "+14,200",
    district: "Anuradhapura",
    environment: {
      temp: "28.4°C",
      humidity: "72%",
      healthScore: 92,
    },
    recommendation: {
      action: 'HOLD', 
      daysToWait: 18,
      expectedIncrease: "9.5%",
      confidence: 88,
      reason: "10-year trends show price peaks in late January due to Thai Pongal festive demand."
    }
  };

  return (
    <SafeAreaView style={styles.container}>
     
      
   

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScroll}>
        
        {/* 2. SCROLLABLE FINANCIAL CAROUSEL */}
        <View style={styles.carouselContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 20}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselPadding}
          >
            {/* CARD 1: INVENTORY VALUE */}
            <LinearGradient colors={['#064e3b', '#065f46']} style={styles.headerCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBadge}>
                  <MaterialCommunityIcons name="wallet" size={22} color="#fff" />
                </View>
                <View style={styles.profitIndicator}>
                  <MaterialCommunityIcons name="trending-up" size={14} color="#10b981" />
                  <Text style={styles.profitText}>{intelData.profitTrend}</Text>
                </View>
              </View>
              <Text style={styles.cardLabel}>Estimated Inventory Value</Text>
              <Text style={styles.cardValue}>Rs. {intelData.estimatedValue}</Text>
              <Text style={styles.cardFooter}>Updated: 2 mins ago</Text>
            </LinearGradient>

            {/* CARD 2: VOLUME METRICS */}
            <LinearGradient colors={['#1e3a8a', '#1e40af']} style={styles.headerCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBadge}>
                  <MaterialCommunityIcons name="scale-paddy" size={22} color="#fff" />
                </View>
                <View style={[styles.profitIndicator, {backgroundColor: 'rgba(255,255,255,0.2)'}]}>
                  <Text style={[styles.profitText, {color: '#fff'}]}>Maha Season</Text>
                </View>
              </View>
              <Text style={styles.cardLabel}>Current Stock Volume</Text>
              <View style={styles.volumeRow}>
                <Text style={styles.cardValue}>{intelData.totalStock} <Text style={styles.unitText}>KG</Text></Text>
                <View style={styles.vDivider} />
                <Text style={styles.cardValue}>{intelData.bags} <Text style={styles.unitText}>Bags</Text></Text>
              </View>
              <Text style={styles.cardFooter}>Avg. Bag Weight: 50kg</Text>
            </LinearGradient>
          </ScrollView>
          
          {/* Pagination Indicators */}
          <View style={styles.dotContainer}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* 3. MANAGEMENT TOOLS (Action Grid) */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('RegisterHarvest')}>
            <View style={[styles.actionIcon, {backgroundColor: '#f0fdf4'}]}>
              <MaterialCommunityIcons name="plus" size={26} color="#16a34a" />
            </View>
            <Text style={styles.actionLabel}>Add Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ConnectSensors')}>
            <View style={[styles.actionIcon, {backgroundColor: '#eff6ff'}]}>
              <MaterialCommunityIcons name="wifi" size={24} color="#2563eb" />
            </View>
            <Text style={styles.actionLabel}>Sensors</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Pricing')}>
            <View style={[styles.actionIcon, {backgroundColor: '#fff7ed'}]}>
              <MaterialCommunityIcons name="finance" size={24} color="#ea580c" />
            </View>
            <Text style={styles.actionLabel}>Market</Text>
          </TouchableOpacity>
        </View>

        {/* 4. AI MARKET ADVISORY (Hero Research Card) */}
        <View style={styles.intelCard}>
          <View style={styles.intelHeader}>
            <Text style={styles.intelTag}>AI Market Intelligence</Text>
            <View style={styles.holdPill}>
              <Text style={styles.holdText}>{intelData.recommendation.action}</Text>
            </View>
          </View>
          
          <Text style={styles.mainAdvice}>Sell in {intelData.recommendation.daysToWait} days for +{intelData.recommendation.expectedIncrease} profit</Text>
          
          <View style={styles.meterSection}>
            <View style={styles.meterHeader}>
              <Text style={styles.meterLabel}>Confidence Level</Text>
              <Text style={styles.meterValue}>{intelData.recommendation.confidence}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, {width: `${intelData.recommendation.confidence}%`}]} />
            </View>
          </View>
          
          <Text style={styles.reasoning}>{intelData.recommendation.reason}</Text>
        </View>

        {/* 5. STORAGE VITALS (Weather Correlation) */}
        <Text style={styles.sectionTitle}>Storage Health Vitals</Text>
        <View style={styles.vitalsGrid}>
          <View style={styles.vitalCard}>
            <MaterialCommunityIcons name="thermometer" size={22} color="#ef4444" />
            <Text style={styles.vitalVal}>{intelData.environment.temp}</Text>
            <Text style={styles.vitalLabel}>Temp</Text>
          </View>
          <View style={styles.vitalCard}>
            <MaterialCommunityIcons name="water-percent" size={22} color="#3b82f6" />
            <Text style={styles.vitalVal}>{intelData.environment.humidity}</Text>
            <Text style={styles.vitalLabel}>Humidity</Text>
          </View>
          <View style={styles.vitalCard}>
            <MaterialCommunityIcons name="shield-check" size={22} color="#10b981" />
            <Text style={styles.vitalVal}>{intelData.environment.healthScore}%</Text>
            <Text style={styles.vitalLabel}>Safety</Text>
          </View>
        </View>

        {/* 6. RECENT BATCHES */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Active Batches</Text>
          <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
        </View>

        <View style={styles.batchCard}>
          <View style={styles.batchLeading}>
            <MaterialCommunityIcons name="paddy" size={24} color="#16a34a" />
          </View>
          <View style={styles.batchContent}>
            <Text style={styles.batchTitle}>Bg 352 (Nadu)</Text>
            <Text style={styles.batchSub}>Stored 12 days ago</Text>
          </View>
          <View style={styles.batchTrailing}>
            <Text style={styles.batchQty}>1,200 KG</Text>
            <View style={styles.batchStatusDot} />
          </View>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  topNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    height: 70,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  navGreeting: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  navLocation: { fontSize: 12, color: '#64748b', fontWeight: '500' },

  mainScroll: { paddingBottom: 20 },

  // Carousel Styles
  carouselContainer: { marginTop: 15 },
  carouselPadding: { paddingHorizontal: 10 },
  headerCard: { 
    width: CARD_WIDTH, 
    height: 170, 
    borderRadius: 24, 
    padding: 20, 
    marginHorizontal: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    justifyContent: 'center'
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  iconBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  profitIndicator: { backgroundColor: 'rgba(16, 185, 129, 0.2)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  profitText: { color: '#10b981', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  cardValue: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 4 },
  cardFooter: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 10 },
  volumeRow: { flexDirection: 'row', alignItems: 'center' },
  unitText: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.7)' },
  vDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 15 },

  dotContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', marginHorizontal: 3 },
  activeDot: { width: 18, backgroundColor: '#064e3b' },

  // Action Grid
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 30 },
  actionItem: { alignItems: 'center', width: (width - 60) / 3 },
  actionIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8, elevation: 1 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },

  // AI Advisory Card
  intelCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 30, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2 },
  intelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  intelTag: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  holdPill: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  holdText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  mainAdvice: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', lineHeight: 28 },
  meterSection: { marginTop: 20 },
  meterHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  meterLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  meterValue: { fontSize: 12, fontWeight: 'bold', color: '#10b981' },
  meterTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3 },
  meterFill: { height: 6, backgroundColor: '#10b981', borderRadius: 3 },
  reasoning: { fontSize: 13, color: '#64748b', marginTop: 15, lineHeight: 20, fontStyle: 'italic' },

  // Vitals Grid
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginHorizontal: 20, marginTop: 30, marginBottom: 15 },
  vitalsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  vitalCard: { backgroundColor: '#fff', width: (width - 60) / 3, padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  vitalVal: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginTop: 8 },
  vitalLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  // Batch List
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  seeAllText: { fontSize: 14, color: '#10b981', fontWeight: 'bold', marginTop: 15 },
  batchCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  batchLeading: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  batchContent: { flex: 1, marginLeft: 15 },
  batchTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  batchSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  batchTrailing: { alignItems: 'flex-end' },
  batchQty: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  batchStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginTop: 6 }
});