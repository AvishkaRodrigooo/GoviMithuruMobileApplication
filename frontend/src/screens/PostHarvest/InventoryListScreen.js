import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';

export default function InventoryListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [locationsMap, setLocationsMap] = useState({});

  /* ================= LOAD LOCATIONS ================= */
  const loadLocations = async () => {
    const snapshot = await db
      .collection('storageLocations')
      .where('userId', '==', auth.currentUser?.uid)
      .get();

    const map = {};
    snapshot.docs.forEach(doc => {
      map[doc.id] = doc.data();
    });

    setLocationsMap(map);
  };

  /* ================= LOAD INVENTORY ================= */
  useEffect(() => {
    let unsubscribe;

    (async () => {
      await loadLocations();

      unsubscribe = db
        .collection('harvests')
        .where('userId', '==', auth.currentUser?.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setInventory(data);
          setFiltered(data);
          setLoading(false);
        });
    })();

    return () => unsubscribe && unsubscribe();
  }, []);

  /* ================= SEARCH ================= */
  const handleSearch = text => {
    setSearch(text);
    if (!text) return setFiltered(inventory);

    const q = text.toLowerCase();
    setFiltered(
      inventory.filter(item =>
        item.variety?.toLowerCase().includes(q)
      )
    );
  };

  /* ================= DELETE ================= */
  const confirmDelete = id => {
    Alert.alert('Delete Stock', 'Remove this batch permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => db.collection('harvests').doc(id).delete(),
      },
    ]);
  };

  /* ================= CARD ================= */
  const renderItem = ({ item }) => {
    const location = locationsMap[item.locationId];

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() =>
          navigation.navigate('StockDetail', { stock: item })
        }
      >
        <LinearGradient
          colors={['#064e3b', '#022c22']}
          style={styles.card}
        >
          {/* LOCATION BADGE */}
          <View style={styles.locationBadge}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color="#16a34a"
            />
            <Text style={styles.locationText}>
              {location?.locationName || 'Unknown Location'}
            </Text>
          </View>

          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={styles.riceIcon}>
              <MaterialCommunityIcons
                name="rice"
                size={24}
                color="#fff"
              />
            </View>

            <View style={styles.gradePill}>
              <Text style={styles.gradeText}>
                Grade {item.grade || 'A'}
              </Text>
            </View>
          </View>

          {/* MAIN */}
          <Text style={styles.variety}>{item.variety}</Text>
          <Text style={styles.quantity}>
            {item.quantityKg}{' '}
            <Text style={styles.unit}>KG</Text>
          </Text>

          {/* META */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={14}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.metaText}>{item.season}</Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="package-variant"
                size={14}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.metaText}>{item.bags} Bags</Text>
            </View>
          </View>

          {/* ACTIONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                navigation.navigate('RegisterHarvest', {
                  editData: item,
                  docId: item.id,
                })
              }
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => confirmDelete(item.id)}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  /* ================= UI ================= */
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchHeader}>
        <Text style={styles.title}>Rice Inventory</Text>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color="#64748b"
          />
          <TextInput
            placeholder="Search variety..."
            value={search}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="database-off"
                size={60}
                color="#cbd5e1"
              />
              <Text style={styles.emptyText}>
                No rice stocks found
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RegisterHarvest')}
      >
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  searchHeader: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1e293b' },

  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    height: 48,
    marginTop: 14,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },

  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 8,
  },

  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  gradePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  variety: {
    color: '#d1fae5',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quantity: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
  },
  unit: { fontSize: 16, color: '#bbf7d0' },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { marginLeft: 6, color: '#fff', fontSize: 13 },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 14,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.4)',
  },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },

  empty: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#94a3b8' },
});
