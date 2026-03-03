import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, SafeAreaView, Dimensions, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInventory(data);
        setFilteredData(data);
        setLoading(false);
      }, error => {
        console.error("Firestore Error:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (text) {
      const newData = inventory.filter(item => {
        const itemData = item.variety ? item.variety.toUpperCase() : '';
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredData(newData);
    } else {
      setFilteredData(inventory);
    }
  };

  const confirmDelete = (id) => {
    Alert.alert("Remove Stock", "Delete this record from inventory?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: 'destructive', onPress: () => db.collection('harvests').doc(id).delete() }
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() => confirmDelete(item.id)}
      style={styles.cardContainer}
    >
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.inventoryCard}
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: '#064e3b30' }]}>
            <MaterialCommunityIcons name="rice" size={24} color="#34d399" />
          </View>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>GRADE {item.grade || 'A'}</Text>
          </View>
        </View>

        <View style={styles.cardMain}>
          <Text style={styles.varietyName}>{item.variety}</Text>
          <View style={styles.qtyRow}>
            <Text style={styles.qtyValue}>{item.quantityKg}</Text>
            <Text style={styles.qtyUnit}>KG</Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaCol}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#64748b" />
            <Text style={styles.metaValue}>{item.location}</Text>
          </View>
          <View style={styles.metaCol}>
            <MaterialCommunityIcons name="calendar-month-outline" size={14} color="#64748b" />
            <Text style={styles.metaValue}>{item.season}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Text style={styles.dateText}>Added: {item.harvestDate}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => navigation.navigate('RegisterHarvest', { editData: item, docId: item.id })}
              style={styles.miniBtn}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#34d399" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDelete(item.id)}
              style={[styles.miniBtn, { borderColor: '#ef4444' }]}
            >
              <MaterialCommunityIcons name="trash-can" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Inventory List</Text>
        </View>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
          <TextInput
            placeholder="Search variety..."
            placeholderTextColor="#475569"
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#34d399" />
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
              <MaterialCommunityIcons name="database-off" size={60} color="#334155" />
              <Text style={styles.emptyText}>No stocks found.</Text>
              <Text style={styles.emptySub}>Register your first harvest to see it here.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RegisterHarvest')}
      >
        <LinearGradient colors={['#059669', '#16a34a']} style={styles.fabGrad}>
          <MaterialCommunityIcons name="plus" size={30} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 14, marginRight: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#334155'
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#fff' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingBottom: 100 },

  cardContainer: { marginBottom: 16, borderRadius: 24, overflow: 'hidden' },
  inventoryCard: { padding: 20, borderWidth: 1, borderColor: '#334155' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  gradeBadge: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gradeText: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },

  cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  varietyName: { color: '#fff', fontSize: 20, fontWeight: '800', flex: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'baseline' },
  qtyValue: { color: '#34d399', fontSize: 28, fontWeight: '900' },
  qtyUnit: { color: '#34d399', fontSize: 14, fontWeight: '600', marginLeft: 4 },

  cardMeta: { flexDirection: 'row', gap: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#334155', marginBottom: 16 },
  metaCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaValue: { color: '#64748b', fontSize: 12, fontWeight: '600' },

  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { color: '#475569', fontSize: 11 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  miniBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: '#334155', justifyContent: 'center', alignItems: 'center' },

  fab: { position: 'absolute', bottom: 30, right: 25, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 10 },
  fabGrad: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },

  empty: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 20 },
  emptySub: { color: '#475569', fontSize: 13, marginTop: 6 },
});