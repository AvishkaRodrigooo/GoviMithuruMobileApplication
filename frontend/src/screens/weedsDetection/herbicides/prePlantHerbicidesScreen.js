import React, { useEffect, useState } from 'react';
import { View, TextInput ,Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../firebase/firebaseConfig';

export default function PrePlantHerbicidesScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const unsub = db
      .collection('herbicides')
      .where('category', '==', 'Pre-plant')
      .onSnapshot(snapshot => {
      const fetchedData = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
}));

setData(fetchedData);
setFilteredData(fetchedData);

        setLoading(false);
      });

    return () => unsub();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 50 }} />;
const handleSearch = (text) => {
  setSearch(text);

  const filtered = data.filter(item =>
    item.tradeName
      ?.toLowerCase()
      .includes(text.toLowerCase())
  );

  setFilteredData(filtered);
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌱 Pre-plant Herbicides</Text>
   <View style={styles.searchContainer}>
  <Ionicons name="search" size={20} color="#6b7280" />
  <TextInput
    placeholder="Search by Trade Name..."
    value={search}
    onChangeText={handleSearch}
    style={styles.searchInput}
  />
</View>

   
      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.noImageContainer}>
                <Text style={styles.noImage}>No Image Available</Text>
              </View>
            )}

            <Text style={styles.productName}>{item.tradeName}</Text>
            <Text style={styles.activeIngredient}>Generic Name: {item.genericName}</Text>

            <View style={styles.infoRow}>
              <Ionicons name="water" size={20} color="#2563eb" />
              <Text style={styles.infoText}>Mix with 16L water: {item.dilution}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#16a34a" />
              <Text style={styles.infoText}>Best Time to Spray: {item.sprayingTime}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="leaf" size={20} color="#f59e0b" />
              <Text style={styles.infoText}>Effect Timeline: {item.modeOfAction}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: '#059669' },
  card: { 
    backgroundColor: '#d4f4ddff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  productName: { fontWeight: 'bold', fontSize: 18, color: '#1f2937', marginBottom: 4 },
  activeIngredient: { fontSize: 15, color: '#4b5563', marginBottom: 8 },
  image: { width: '100%', height: 180, borderRadius: 10, marginBottom: 12 },
  noImageContainer: { 
    width: '100%', 
    height: 180, 
    backgroundColor: '#e5e7eb', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 10, 
    marginBottom: 12 
  },
  searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 10,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#e5e7eb'
},
searchInput: {
  marginLeft: 8,
  fontSize: 16,
  flex: 1,
  color: '#111827'
},

  noImage: { color: '#9ca3af', fontSize: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { marginLeft: 8, fontSize: 15, color: '#374151' },
});
