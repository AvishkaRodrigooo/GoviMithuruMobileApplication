import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Dimensions, SafeAreaView, StatusBar, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig'; 

const { width } = Dimensions.get('window');

export default function StorageDashboardScreen({ navigation }) {
  const [harvests, setHarvests] = useState([]);
  const [totals, setTotals] = useState({ kg: 0, bags: 0, value: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = db.collection('harvests')
      .where('userId', '==', auth.currentUser?.uid) 
      .onSnapshot(snapshot => {
        let kgCount = 0;
        let bagCount = 0;
        
        const list = snapshot.docs.map(doc => {
          const data = doc.data();
          const qKg = parseFloat(data.quantityKg) || 0;
          const qBags = parseFloat(data.bags) || 0;
          kgCount += qKg;
          bagCount += qBags;
          return { id: doc.id, ...data };
        });
        
        setHarvests(list);
        setTotals({
          kg: kgCount.toFixed(0),
          bags: bagCount.toFixed(1),
          value: (kgCount * 242).toLocaleString('en-LK') 
        });
        setLoading(false);
      }, error => {
        console.error("Firestore Error:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const handleDelete = (id) => {
    Alert.alert("Delete Harvest", "Are you sure you want to remove this record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: 'destructive', onPress: () => db.collection('harvests').doc(id).delete() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
     
      


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* --- REWRITTEN DYNAMIC CAROUSEL (MAPS EACH STACK DATA) --- */}
        <View style={styles.carouselWrapper}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 40}
            decelerationRate="fast"
          >
            {harvests.length > 0 ? (
              harvests.map((item, index) => (
                <LinearGradient 
                  key={item.id}
                  colors={['#064e3b', '#053d2f']} 
                  style={styles.headerCard}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardLabel}>ESTIMATED INVENTORY VALUE</Text>
                    <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
                  </View>
                  
                  <Text style={styles.cardValue}>
                    Rs. {(parseFloat(item.quantityKg) * 242).toLocaleString('en-LK')}
                  </Text>
                  
                  <View style={styles.trendRow}>
                    <MaterialCommunityIcons name="trending-up" size={18} color="#34d399" />
                    <Text style={styles.trendText}>
                      {item.variety} • {item.quantityKg} KG ({item.bags} Bags)
                    </Text>
                  </View>
                  
                  <Text style={styles.cardIndexText}>Stack {index + 1} of {harvests.length}</Text>
                </LinearGradient>
              ))
            ) : (
              /* Placeholder if no data exists */
              <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.headerCard}>
                <Text style={styles.cardLabel}>NO ACTIVE STOCKS</Text>
                <Text style={styles.cardValue}>Rs. 0</Text>
                <Text style={styles.trendText}>Tap 'Add Stock' to begin tracking</Text>
              </LinearGradient>
            )}
          </ScrollView>
          
          {/* Dynamic Pagination Dots */}
          <View style={styles.dotRow}>
             {harvests.map((_, i) => (
               <View key={i} style={[styles.dot, i === 0 && styles.activeDot]} />
             ))}
          </View>
        </View>

        {/* 3. MANAGEMENT TOOLS */}
        <View style={styles.actionHub}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('RegisterHarvest')}>
            <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
              <MaterialCommunityIcons name="plus" size={26} color="#16a34a" />
            </View>
            <Text style={styles.actionLabel}>Add Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ConnectSensors')}>
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <MaterialCommunityIcons name="wifi" size={24} color="#2563eb" />
            </View>
            <Text style={styles.actionLabel}>Sensors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MarketTracking')}>
            <View style={[styles.actionIcon, { backgroundColor: '#fff7ed' }]}>
              <MaterialCommunityIcons name="finance" size={24} color="#ea580c" />
            </View>
            <Text style={styles.actionLabel}>Market</Text>
          </TouchableOpacity>
        </View>

        {/* 4. AI ADVISORY CARD */}
        <View style={styles.intelCard}>
          <View style={styles.intelHeader}>
            <Text style={styles.intelTitle}>AI Market Forecast</Text>
            <View style={styles.holdPill}><Text style={styles.holdPillText}>HOLD</Text></View>
          </View>
          <Text style={styles.mainAdvice}>Current Total: Rs. {totals.value}</Text>
          <Text style={styles.reasoningText}>Historical 10-year trends show late January price spikes. Total Weight: {totals.kg} KG.</Text>
        </View>

        {/* 5. LIVE INVENTORY LIST */}
        <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Batch Details</Text>
            <Text style={styles.itemCount}>{harvests.length} Batches</Text>
        </View>

        {loading ? (
            <ActivityIndicator size="large" color="#16a34a" style={{marginTop: 20}} />
        ) : harvests.map((item) => (
            <View key={item.id} style={styles.inventoryCard}>
                <View style={styles.invIcon}>
                    <MaterialCommunityIcons name="paddy" size={24} color="#16a34a" />
                </View>
                <View style={styles.invMain}>
                    <Text style={styles.invTitle}>{item.variety}</Text>
                    <Text style={styles.invSub}>{item.location} • {item.season}</Text>
                </View>
                <View style={styles.invSide}>
                    <Text style={styles.invQty}>{item.quantityKg} KG</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => navigation.navigate('RegisterHarvest', { editData: item, docId: item.id })}>
                            <MaterialCommunityIcons name="pencil-outline" size={20} color="#2563eb" style={{marginRight: 12}} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)}>
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        ))}
        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, height: 80 },
  navTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  navSubTitle: { fontSize: 13, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  scrollPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  
  carouselWrapper: { marginBottom: 25, marginTop: 10 },
  headerCard: { width: width - 40, borderRadius: 28, padding: 24, marginRight: 15, elevation: 4, minHeight: 180, justifyContent: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  cardValue: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 10 },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  trendText: { color: '#34d399', fontSize: 13, marginLeft: 6, fontWeight: '600' },
  cardIndexText: { position: 'absolute', bottom: 15, right: 20, color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' },
  liveBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  dotRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', marginHorizontal: 3 },
  activeDot: { backgroundColor: '#16a34a', width: 15 },

  actionHub: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35, marginTop: 10 },
  actionBtn: { alignItems: 'center', width: (width - 40) / 3.5 },
  actionIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8, elevation: 2, backgroundColor: '#fff' },
  actionLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  
  intelCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 30, elevation: 1 },
  intelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  intelTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  holdPill: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  holdPillText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  mainAdvice: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  reasoningText: { fontSize: 13, color: '#64748b', marginTop: 8, lineHeight: 20 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  itemCount: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
  
  inventoryCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 18, borderRadius: 22, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  invIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  invMain: { flex: 1, marginLeft: 15 },
  invTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  invSub: { fontSize: 12, color: '#64748b', marginTop: 3 },
  invSide: { alignItems: 'flex-end' },
  invQty: { fontSize: 16, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
});