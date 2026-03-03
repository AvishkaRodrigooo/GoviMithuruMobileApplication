import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../firebase/firebaseConfig';

export default function BroadLeavesKillersScreen() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = db
      .collection('herbicides')
      .where('category', '==', 'Sedges and Broadleaf Killers')
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

  const handleSearch = (text) => {
    setSearch(text);
    setFilteredData(
      data.filter(item =>
        item.tradeName?.toLowerCase().includes(text.toLowerCase())
      )
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#5a7c59" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Broadleaf & Sedges Killers</Text>
        <Text style={styles.headerSubtitle}>
          Recommended herbicide products for broadleaf weeds and sedges
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          placeholder="Search by product name..."
          value={search}
          onChangeText={handleSearch}
          style={styles.searchInput}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Products List */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Product Image */}
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.noImageContainer}>
                <Ionicons name="image-outline" size={44} color="#9ca3af" />
                <Text style={styles.noImage}>No Image Available</Text>
              </View>
            )}

            {/* Product Names Section */}
            <View style={styles.nameSection}>
              <Text style={styles.productName}>{item.tradeName}</Text>
              <Text style={styles.activeIngredient}>{item.genericName}</Text>
            </View>

            {/* Details Container */}
            <View style={styles.detailsContainer}>
              {/* Dilution Info */}
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="water" size={20} color="#5a7c59" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Dialution Rate (per 16L)</Text>
                  <Text style={styles.infoText}>{item.dilution}</Text>
                </View>
              </View>

              {/* Spraying Time */}
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time" size={20} color="#5a7c59" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Best Time to Spray</Text>
                  <Text style={styles.infoText}>{item.sprayingTime}</Text>
                </View>
              </View>

              {/* Mode of Action */}
              <View style={[styles.infoRow, { marginBottom: 0 }]}>
                <View style={styles.iconContainer}>
                  <Ionicons name="leaf" size={20} color="#5a7c59" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Mode of Action</Text>
                  <Text style={styles.infoText}>{item.modeOfAction}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f7f4', 
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  headerSection: {
    marginBottom: 20,
    paddingVertical: 8,
  },

  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#2d5016',
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  headerSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },

  card: { 
    backgroundColor: '#ffffff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  image: { 
    width: '100%', 
    height: 200, 
    borderRadius: 10, 
    marginBottom: 14 
  },

  noImageContainer: { 
    width: '100%', 
    height: 200, 
    backgroundColor: '#f3f4f6', 
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 10, 
    marginBottom: 14,
  },

  nameSection: {
    marginBottom: 14,
  },

  productName: { 
    fontWeight: '700', 
    fontSize: 18, 
    color: '#2d5016', 
    marginBottom: 4,
  },

  activeIngredient: { 
    fontSize: 14, 
    color: '#6b7280',
  },

  detailsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5a7c59',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  searchInput: {
    marginLeft: 10,
    fontSize: 15,
    flex: 1,
    color: '#111827',
  },

  noImage: { 
    color: '#9ca3af', 
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },

  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 12,
  },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: { 
    fontSize: 12, 
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },

  infoText: { 
    fontSize: 14, 
    color: '#2d5016',
    fontWeight: '600',
  },
});
