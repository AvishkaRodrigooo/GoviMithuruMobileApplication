import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const PRICE_PER_KG = 242;

export default function StorageDashboardScreen({ navigation }) {
  const [harvests, setHarvests] = useState([]);
  const [totals, setTotals] = useState({ kg: 0, bags: 0, value: 0 });
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const carouselRef = useRef(null);

  /* ================= FIRESTORE ================= */
  useEffect(() => {
    const unsubscribe = db
      .collection('harvests')
      .where('userId', '==', auth.currentUser?.uid)
      .onSnapshot(snapshot => {
        let kg = 0;
        let bags = 0;

        const list = snapshot.docs.map(doc => {
          const data = doc.data();
          kg += Number(data.quantityKg || 0);
          bags += Number(data.bags || 0);
          return { id: doc.id, ...data };
        });

        setHarvests(list);
        setTotals({
          kg: kg.toFixed(0),
          bags: bags.toFixed(1),
          value: (kg * PRICE_PER_KG).toLocaleString('en-LK'),
        });

        // Auto-scroll to newest batch
        if (list.length > 1) {
          setTimeout(() => {
            carouselRef.current?.scrollTo({
              x: (list.length - 1) * CARD_WIDTH,
              animated: true,
            });
            setActiveIndex(list.length - 1);
          }, 300);
        }

        setLoading(false);
      });

    return unsubscribe;
  }, []);

  /* ================= HELPERS ================= */
  const handleDelete = id => {
    Alert.alert('Delete Batch', 'Are you sure you want to delete this batch?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => db.collection('harvests').doc(id).delete(),
      },
    ]);
  };

  const handleCarouselScroll = e => {
    const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>

        {/* ================= HEADER CAROUSEL ================= */}
        <View style={styles.carouselWrapper}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            snapToInterval={CARD_WIDTH}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleCarouselScroll}
          >
            {harvests.length ? (
              harvests.map((item, index) => (
                <LinearGradient
                  key={item.id}
                  colors={['#064e3b', '#022c22']}
                  style={styles.headerCard}
                >
                  <View style={styles.headerTop}>
                    <Text style={styles.stackText}>BATCH {index + 1}</Text>
                    <View style={styles.livePill}>
                      <Text style={styles.liveText}>ACTIVE</Text>
                    </View>
                  </View>

                  <Text style={styles.valueText}>
                    Rs. {(item.quantityKg * PRICE_PER_KG).toLocaleString('en-LK')}
                  </Text>

                  <View style={styles.chipRow}>
                    <View style={styles.chip}>
                      <MaterialCommunityIcons name="scale" size={14} color="#16a34a" />
                      <Text style={styles.chipText}>{item.quantityKg} KG</Text>
                    </View>
                    <View style={styles.chip}>
                      <MaterialCommunityIcons name="package-variant" size={14} color="#16a34a" />
                      <Text style={styles.chipText}>{item.bags} Bags</Text>
                    </View>
                  </View>

                  <Text style={styles.varietyText}>{item.variety}</Text>
                  <Text style={styles.locationHeader}>{item.location}</Text>
                </LinearGradient>
              ))
            ) : (
              <LinearGradient colors={['#1e293b', '#020617']} style={styles.headerCard}>
                <Text style={styles.emptyTitle}>No Stock Available</Text>
                <Text style={styles.emptySub}>Tap “Add Stock” to begin</Text>
              </LinearGradient>
            )}
          </ScrollView>

          {/* DOT INDICATOR */}
          <View style={styles.dotRow}>
            {harvests.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        {/* ================= ACTION HUB ================= */}
        <View style={styles.actionHub}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('RegisterHarvest')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
              <MaterialCommunityIcons name="plus" size={26} color="#16a34a" />
            </View>
            <Text style={styles.actionLabel}>Add Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ConnectSensors')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <MaterialCommunityIcons name="wifi" size={24} color="#2563eb" />
            </View>
            <Text style={styles.actionLabel}>Sensors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('MarketTracking')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fff7ed' }]}>
              <MaterialCommunityIcons name="finance" size={24} color="#ea580c" />
            </View>
            <Text style={styles.actionLabel}>Market</Text>
          </TouchableOpacity>
        </View>

        {/* ================= SUMMARY ================= */}
        <View style={styles.intelCard}>
          <Text style={styles.mainAdvice}>Total Value: Rs. {totals.value}</Text>
          <Text style={styles.reasoningText}>
            Total Weight: {totals.kg} KG • Estimated Market Price
          </Text>
        </View>

        {/* ================= BATCH LIST ================= */}
        <Text style={styles.sectionTitle}>Batch Details</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#16a34a" />
        ) : (
          harvests.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.inventoryCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('StockDetail', { stock: item })}
            >
              {/* ICON */}
              <View style={styles.invIcon}>
                <MaterialCommunityIcons name="rice" size={24} color="#16a34a" />
              </View>

              {/* MAIN */}
              <View style={styles.invMain}>
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker" size={14} color="#16a34a" />
                  <Text style={styles.locationText}>{item.location}</Text>
                </View>

                <Text style={styles.invTitle}>{item.variety}</Text>
                <Text style={styles.invSub}>{item.season}</Text>
              </View>

              {/* RIGHT */}
              <View style={styles.invSide}>
                <Text style={styles.invQty}>{item.quantityKg} KG</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('RegisterHarvest', {
                        editData: item,
                        docId: item.id,
                      })
                    }
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={20} color="#2563eb" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  scrollPadding: { padding: 20 },

  carouselWrapper: { marginBottom: 30 },
  headerCard: {
    width: CARD_WIDTH,
    borderRadius: 26,
    padding: 24,
    marginRight: 15,
    minHeight: 200,
    justifyContent: 'space-between',
  },

  headerTop: { flexDirection: 'row', justifyContent: 'space-between' },
  stackText: { color: '#bbf7d0', fontWeight: '700', fontSize: 12 },
  livePill: { backgroundColor: '#16a34a', paddingHorizontal: 10, borderRadius: 12 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  valueText: { color: '#fff', fontSize: 34, fontWeight: '900' },
  chipRow: { flexDirection: 'row', gap: 12 },
  chip: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  chipText: { marginLeft: 6, fontWeight: '700', color: '#065f46' },

  varietyText: { color: '#d1fae5', fontWeight: '700' },
  locationHeader: { color: '#bbf7d0', fontSize: 12 },

  dotRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#16a34a', width: 16 },

  actionHub: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  actionBtn: { alignItems: 'center', width: CARD_WIDTH / 3.2 },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { marginTop: 6, fontWeight: '700', fontSize: 12 },

  intelCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 25 },
  mainAdvice: { fontSize: 18, fontWeight: '800' },
  reasoningText: { color: '#64748b', marginTop: 6 },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },

  inventoryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },

  invIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  invMain: { flex: 1, marginLeft: 14 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },

  invTitle: { fontSize: 16, fontWeight: '700' },
  invSub: { fontSize: 12, color: '#64748b' },

  invSide: { alignItems: 'flex-end' },
  invQty: { fontSize: 16, fontWeight: '900' },

  actionRow: { flexDirection: 'row', gap: 14 },
});
