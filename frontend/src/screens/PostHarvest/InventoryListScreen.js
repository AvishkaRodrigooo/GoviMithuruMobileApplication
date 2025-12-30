import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, SafeAreaView, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure this is installed
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
      .orderBy('createdAt', 'desc')
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
    >
      <LinearGradient 
        colors={['#064e3b', '#065f46']} 
        style={styles.headerCard}
      >
        {/* Top Row: Variety and Grade */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="rice" size={22} color="#fff" />
          </View>
          <View style={styles.gradeIndicator}>
            <Text style={styles.gradeText}>Grade {item.grade}</Text>
          </View>
        </View>

        {/* Center Section: Variety & Quantity */}
        <Text style={styles.cardLabel}>{item.variety}</Text>
        <Text style={styles.cardValue}>{item.quantityKg} <Text style={styles.unitText}>KG</Text></Text>

        {/* Footer Section: Metadata */}
        <View style={styles.metadataRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="map-marker" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          <View style={styles.vDivider} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar-range" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.metaText}>{item.season}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerDate}>Harvested: {item.harvestDate}</Text>
          
          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('RegisterHarvest', { editData: item, docId: item.id })}
              style={styles.circleActionBtn}
            >
              <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => confirmDelete(item.id)} 
              style={[styles.circleActionBtn, { backgroundColor: 'rgba(225, 29, 72, 0.3)' }]}
            >
              <MaterialCommunityIcons name="trash-can" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchHeader}>
        <Text style={styles.screenTitle}>Stock Inventory</Text>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color="#64748b" />
          <TextInput
            placeholder="Search variety..."
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="database-off" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No stocks found.</Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('RegisterHarvest')}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchHeader: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  screenTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 15, 
    borderRadius: 15, 
    height: 50 
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b' },
  listContent: { padding: 20, paddingBottom: 100 },

  // Updated Premium Card Style (Matching Dashboard Header)
  headerCard: { 
    width: '100%', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  iconBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  gradeIndicator: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  gradeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
  cardValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 2 },
  unitText: { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.7)' },

  metadataRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#fff', fontSize: 13, marginLeft: 5, fontWeight: '500' },
  vDivider: { width: 1, height: 15, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 15 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  footerDate: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  
  actionRow: { flexDirection: 'row' },
  circleActionBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },

  fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 25, 
    backgroundColor: '#16a34a', 
    width: 65, 
    height: 65, 
    borderRadius: 32.5, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 10,
    shadowColor: '#16a34a',
    shadowOpacity: 0.4,
    shadowRadius: 10 
  },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', marginTop: 15, fontSize: 16 }
});