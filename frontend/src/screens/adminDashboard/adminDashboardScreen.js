import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebase/firebaseConfig';

export default function AdminDashboardScreen({ navigation }) {
  const today = new Date().toDateString();
  const [herbicides, setHerbicides] = useState([]);
  const [marketReports, setMarketReports] = useState([]);

  useEffect(() => {
    // Fetch herbicides
    const unsubscribeHerbicides = db
      .collection('herbicides')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHerbicides(data);
      });

    // Fetch market reports count
    const unsubscribeReports = db
      .collection('marketReports')
      .orderBy('uploadedAt', 'desc')
      .limit(3)
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMarketReports(data);
      });

    return () => {
      unsubscribeHerbicides();
      unsubscribeReports();
    };
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const deleteHerbicide = (id) => {
    Alert.alert(
      'Delete Herbicide',
      'Are you sure you want to delete this recommendation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await db.collection('herbicides').doc(id).delete();
          },
        },
      ]
    );
  };

  const renderHerbicideItem = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.noImage}>
          <Ionicons name="image-outline" size={30} color="#999" />
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}

      <View style={styles.details}>
        <Text style={styles.title}>
          {item.genericName} ({item.tradeName})
        </Text>
        <Text style={styles.text}>Category: {item.category}</Text>
        {item.dilution && (
          <Text style={styles.text}>Dilution: {item.dilution}</Text>
        )}
        {item.createdAt && (
          <Text style={styles.date}>
            Added: {item.createdAt.toDate().toDateString()}
          </Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              navigation.navigate('HerbicideRecommendation', {
                herbicide: item,
              })
            }
          >
            <Ionicons name="create-outline" size={16} color="#2563eb" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteHerbicide(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#dc2626" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back, Admin</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.notification}>
            <Ionicons name="notifications-outline" size={22} color="#333" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{herbicides.length}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {/* Market Reports Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MarketPriceManagement')}
          >
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="newspaper-outline" size={24} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.actionCardTitle}>Market Price Reports</Text>
                <Text style={styles.actionCardSubtitle}>
                  {marketReports.length} reports uploaded
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {/* Herbicides Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('HerbicideRecommendation')}
          >
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="leaf-outline" size={24} color="#16a34a" />
              </View>
              <View>
                <Text style={styles.actionCardTitle}>Herbicide Recommendations</Text>
                <Text style={styles.actionCardSubtitle}>
                  Add new recommendations
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Recent Herbicides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Herbicides</Text>
          {herbicides.slice(0, 5).map(item => (
            <View key={item.id}>
              {renderHerbicideItem({ item })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  welcomeText: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  dateText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  notification: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  logoutBtn: { padding: 5 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  quickActions: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  section: { marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
  },
  image: { width: '100%', height: 160 },
  noImage: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  noImageText: { fontSize: 12, color: '#94a3b8', marginTop: 5 },
  details: { padding: 12 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#0f172a' },
  text: { fontSize: 13, marginBottom: 3, color: '#64748b' },
  date: { fontSize: 11, color: '#94a3b8', marginTop: 5 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editBtn: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center' },
  editText: { marginLeft: 5, color: '#2563eb', fontWeight: '600' },
  deleteText: { marginLeft: 5, color: '#dc2626', fontWeight: '600' },
});