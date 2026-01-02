import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../firebase/firebaseConfig';

export default function GrassKillersScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = db
      .collection('herbicides')
      .where('category', '==', 'Grass Killers')
      .onSnapshot(snapshot => {
        setData(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })));
        setLoading(false);
      });
    return () => unsub();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌾 Grass Killers</Text>
      <FlatList
        data={data}
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
  container: { flex: 1, backgroundColor: '#f0fdf4', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: '#15803d' },
  card: { 
    backgroundColor: '#ffffff', 
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
    backgroundColor: '#d1fae5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 10, 
    marginBottom: 12 
  },
  noImage: { color: '#9ca3af', fontSize: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { marginLeft: 8, fontSize: 15, color: '#374151' },
});
