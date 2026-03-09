import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, SafeAreaView, Dimensions, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../../firebase/firebaseConfig';

const { width } = Dimensions.get('window');

export default function InventoryListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = db.collection('harvests')
      .where('userId', '==', auth.currentUser?.uid)
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInventory(data);
        setFilteredData(data);
        setLoading(false);
      }, error => {
        console.error('Firestore Error:', error);
        setLoading(false);
      });
    return () => unsubscribe();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (text) {
      setFilteredData(inventory.filter(item =>
        (item.variety || '').toUpperCase().includes(text.toUpperCase())
      ));
    } else {
      setFilteredData(inventory);
    }
  };

  const confirmDelete = (id) => {
    Alert.alert('Remove Stock', 'Delete this record from inventory?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => db.collection('harvests').doc(id).delete() }
    ]);
  };

  const gradeColors = { A: '#16a34a', B: '#f59e0b', C: '#ef4444' };
  const gradeBgColors = { A: '#dcfce7', B: '#fef9c3', C: '#fee2e2' };

  const renderItem = ({ item }) => {
    const gradeColor = gradeColors[item.grade] || '#6b7280';
    const gradeBg = gradeBgColors[item.grade] || '#f3f4f6';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('RegisterHarvest', { editData: item, docId: item.id })}
        style={styles.card}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardIconBox}>
            <MaterialCommunityIcons name="rice" size={22} color="#16a34a" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.varietyName}>{item.variety}</Text>
            <Text style={styles.seasonText}>{item.season} • {item.locationName || 'Storage'}</Text>
          </View>
          <View style={[styles.gradeBadge, { backgroundColor: gradeBg }]}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>GRADE {item.grade || 'A'}</Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.quantityKg}</Text>
            <Text style={styles.statLabel}>KG</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.bags || (item.quantityKg / 50).toFixed(1)}</Text>
            <Text style={styles.statLabel}>BAGS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.moisture || '—'}</Text>
            <Text style={styles.statLabel}>MC%</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {item.harvestDate ? `Stored: ${item.harvestDate}` : 'Recently stored'}
          </Text>
          <View style={styles.actionBtns}>
            <TouchableOpacity
              onPress={() => navigation.navigate('PostHarvestAdvisor', { batch: item })}
              style={[styles.miniBtn, { borderColor: '#bbf7d0' }]}
            >
              <MaterialCommunityIcons name="brain" size={16} color="#16a34a" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('RegisterHarvest', { editData: item, docId: item.id })}
              style={styles.miniBtn}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDelete(item.id)}
              style={[styles.miniBtn, { borderColor: '#fecaca' }]}
            >
              <MaterialCommunityIcons name="trash-can" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#16a34a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Inventory List</Text>
            <Text style={styles.subtitle}>{filteredData.length} batches stored</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search by variety..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="database-off" size={60} color="#d1d5db" />
              <Text style={styles.emptyText}>No stocks found</Text>
              <Text style={styles.emptySub}>Register your first harvest to see it here.</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('RegisterHarvest')}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add First Stock</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RegisterHarvest')}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },

  // Header
  header: { backgroundColor: 'white', padding: 16, elevation: 2, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 14, borderRadius: 12, height: 48, borderWidth: 1, borderColor: '#e5e7eb', gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6b7280', marginTop: 12, fontSize: 14 },
  listContent: { padding: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  varietyName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  seasonText: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gradeText: { fontSize: 11, fontWeight: '800' },

  cardStats: { flexDirection: 'row', backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, marginBottom: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 12, color: '#9ca3af' },
  actionBtns: { flexDirection: 'row', gap: 8 },
  miniBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },

  // FAB
  fab: { position: 'absolute', bottom: 28, right: 20, width: 56, height: 56, borderRadius: 18, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8 },

  // Empty
  empty: { flex: 1, alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#374151', fontSize: 17, fontWeight: '700', marginTop: 16 },
  emptySub: { color: '#9ca3af', fontSize: 13, marginTop: 4, marginBottom: 20 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});