import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85; // Slightly wider for better focus
const SPACING = 20;
const PRICE_PER_KG = 242;

export default function StorageDashboardScreen({ navigation }) {
  const [harvests, setHarvests] = useState([]);
  const [totals, setTotals] = useState({ kg: 0, bags: 0, value: 0 });
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatListRef = useRef(null);

  /* ================= FIRESTORE ================= */
  useEffect(() => {
    const unsubscribe = db
      .collection('harvests')
      .where('userId', '==', auth.currentUser?.uid)
      .onSnapshot((snapshot) => {
        let kg = 0;
        let bags = 0;

        const list = snapshot.docs.map((doc) => {
          const data = doc.data();
          kg += Number(data.quantityKg || 0);
          bags += Number(data.bags || 0);
          return { id: doc.id, ...data };
        });

        // Sort by date created if available, or fallback
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setHarvests(list);
        setTotals({
          kg: kg.toFixed(0),
          bags: bags.toFixed(1),
          value: (kg * PRICE_PER_KG).toLocaleString('en-LK'),
        });

        setLoading(false);
      });

    return unsubscribe;
  }, []);

  /* ================= ACTIONS ================= */
  const handleDelete = (id) => {
    Alert.alert('Remove Stock', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => db.collection('harvests').doc(id).delete(),
      },
    ]);
  };

  const handleCarouselScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CARD_WIDTH + 15));
    setActiveIndex(index);
  };

  /* ================= COMPONENTS ================= */

  // 1. The Header Component (Carousel + Actions + Summary)
  const DashboardHeader = () => (
    <View style={styles.headerContainer}>
      {/* Title Section */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingText}>Storage Overview</Text>
          <Text style={styles.subGreeting}>
            {harvests.length} Active {harvests.length === 1 ? 'Batch' : 'Batches'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
           <MaterialCommunityIcons name="bell-badge-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel */}
      <View style={styles.carouselWrapper}>
        <FlatList
          data={harvests.length ? harvests : [{ id: 'empty' }]}
          horizontal
          pagingEnabled={false} // customized snapping
          snapToInterval={CARD_WIDTH + 15} // Card width + margin
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING }}
          onScroll={handleCarouselScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            if (item.id === 'empty') return <EmptyStockCard />;
            return <StockCarouselCard item={item} index={index} />;
          }}
        />
      </View>

      {/* Pagination Dots */}
      {harvests.length > 0 && (
        <View style={styles.dotRow}>
          {harvests.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>
      )}

      {/* Action Grid */}
      <View style={styles.actionGrid}>
        <ActionBtn
          title="Add Stock"
          icon="plus-circle"
          color="#16a34a"
          bg="#ecfdf5"
          onPress={() => navigation.navigate('RegisterHarvest')}
        />
        <ActionBtn
          title="Sensors"
          icon="wifi-strength-4"
          color="#2563eb"
          bg="#eff6ff"
          onPress={() => navigation.navigate('ConnectSensors')}
        />
        <ActionBtn
          title="Market"
          icon="chart-line-variant"
          color="#ea580c"
          bg="#fff7ed"
          onPress={() => navigation.navigate('MarketTracking')}
        />
        <ActionBtn
            title="Reports"
            icon="file-document-outline"
            color="#7c3aed"
            bg="#f5f3ff"
            onPress={() => Alert.alert('Coming Soon')}
        />
      </View>

      {/* Global Summary Card */}
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.summaryCard}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Weight</Text>
            <Text style={styles.summaryValue}>{totals.kg} <Text style={styles.unit}>KG</Text></Text>
          </View>
          <View style={styles.dividerVertical} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Est. Value</Text>
            <Text style={styles.summaryValuePrice}>Rs. {totals.value}</Text>
          </View>
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Inventory Details</Text>
    </View>
  );

  // 2. Carousel Card
  const StockCarouselCard = ({ item, index }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('StockDetail', { stock: item })}
      style={[styles.cardContainer, { marginLeft: index === 0 ? 0 : 15 }]}
    >
      <LinearGradient
        colors={['#065f46', '#042f2e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Background Decorations */}
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />

        <View style={styles.cardHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>BATCH {index + 1}</Text>
          </View>
          <MaterialCommunityIcons name="dots-horizontal" size={24} color="rgba(255,255,255,0.6)" />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardPrice}>
            Rs. {(item.quantityKg * PRICE_PER_KG).toLocaleString('en-LK')}
          </Text>
          <Text style={styles.cardLabel}>Current Value</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.infoPill}>
            <MaterialCommunityIcons name="weight-kilogram" size={16} color="#d1fae5" />
            <Text style={styles.infoText}>{item.quantityKg} KG</Text>
          </View>
          <View style={styles.infoPill}>
            <MaterialCommunityIcons name="sack" size={16} color="#d1fae5" />
            <Text style={styles.infoText}>{item.bags} Bags</Text>
          </View>
          <View style={{flex:1}} />
          <Text style={styles.varietyText}>{item.variety}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const EmptyStockCard = () => (
    <View style={[styles.cardContainer, styles.emptyCard]}>
      <MaterialCommunityIcons name="silo" size={48} color="#94a3b8" />
      <Text style={styles.emptyTitle}>Storage Empty</Text>
      <Text style={styles.emptySub}>Add a harvest to see analytics</Text>
    </View>
  );

  // 3. Action Button
  const ActionBtn = ({ title, icon, color, bg, onPress }) => (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );

  // 4. List Item
  const InventoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('StockDetail', { stock: item })}
    >
      <View style={styles.listIconBox}>
        <MaterialCommunityIcons name="barley" size={24} color="#15803d" />
      </View>

      <View style={styles.listContent}>
        <Text style={styles.listTitle}>{item.variety}</Text>
        <View style={styles.listRow}>
           <MaterialCommunityIcons name="map-marker-outline" size={14} color="#64748b" />
           <Text style={styles.listSub}>{item.location}</Text>
        </View>
      </View>

      <View style={styles.listRight}>
        <Text style={styles.listQty}>{item.quantityKg} <Text style={{fontSize:12, fontWeight:'normal'}}>KG</Text></Text>
        <View style={styles.listActions}>
          <TouchableOpacity 
            style={styles.miniBtn}
            onPress={() => navigation.navigate('RegisterHarvest', { editData: item, docId: item.id })}
          >
             <MaterialCommunityIcons name="pencil" size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.miniBtn, { marginLeft: 8 }]}
            onPress={() => handleDelete(item.id)}
          >
             <MaterialCommunityIcons name="delete-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  /* ================= MAIN RENDER ================= */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={{marginTop: 10, color: '#64748b'}}>Loading storage...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={harvests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <InventoryItem item={item} />}
          contentContainerStyle={styles.listContentContainer}
          ListHeaderComponent={DashboardHeader}
          ListEmptyComponent={
            !loading && harvests.length === 0 && (
                <View style={styles.emptyListState}>
                    <Text style={styles.emptyListText}>No batches found below.</Text>
                </View>
            )
          }
        />
      )}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Very light gray/blue background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContentContainer: {
    paddingBottom: 40,
  },
  
  // Header Section
  headerContainer: {
    marginBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    paddingTop: Platform.OS === 'android' ? 40 : 10, // Safe area adjustment
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  profileBtn: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#fff', 
    justifyContent:'center', 
    alignItems:'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Carousel
  carouselWrapper: {
    marginBottom: 15,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  // Decorative Circles in Card
  decoCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardBody: {
    marginTop: 10,
  },
  cardPrice: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  cardLabel: {
    color: '#d1fae5', // Light mint
    fontSize: 13,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  varietyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
  },

  // Empty Card Style
  emptyCard: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    elevation: 0,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748b', marginTop: 10 },
  emptySub: { fontSize: 13, color: '#94a3b8' },

  // Dots
  dotRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 25 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#059669', width: 20 },

  // Actions
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING,
    marginBottom: 25,
  },
  actionBtn: {
    alignItems: 'center',
    width: (width - (SPACING * 2)) / 4.2,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  // Global Summary
  summaryCard: {
    marginHorizontal: SPACING,
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  summaryValuePrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669', // Emerald
  },
  unit: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // List Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginHorizontal: SPACING,
    marginBottom: 15,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: SPACING,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  listIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  listSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
  },
  listRight: {
    alignItems: 'flex-end',
  },
  listQty: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 6,
  },
  listActions: {
    flexDirection: 'row',
  },
  miniBtn: {
    padding: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  emptyListState: {
      alignItems: 'center',
      marginTop: 20
  },
  emptyListText: {
      color: '#cbd5e1',
      fontSize: 12
  }
});