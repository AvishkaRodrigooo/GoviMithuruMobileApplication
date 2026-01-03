import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { db ,auth} from '../../firebase/firebaseConfig';

export default function AdminDashboardScreen({ navigation }) {
  const today = new Date().toDateString();
  const [herbicides, setHerbicides] = useState([]);

  useEffect(() => {
    const unsubscribe = db
      .collection('herbicides')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHerbicides(data);
      });

    return unsubscribe;
  }, []);
/* ================= LOGOUT ================= */
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
          //    navigation.replace('SignIn'); 
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

  const renderItem = ({ item }) => (
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
          <Text style={styles.text}>
            Dilution (product per 16l of water): {item.dilution}
          </Text>
        )}
        {item.sprayingTime && (
          <Text style={styles.text}>
            Spraying Time (days after estab- lishment): {item.sprayingTime}
          </Text>
        )}
        {item.modeOfAction && (
          <Text style={styles.text}>
            Mode of Action: {item.modeOfAction}
          </Text>
        )}

        {item.createdAt && (
          <Text style={styles.date}>
            Added: {item.createdAt.toDate().toDateString()}
          </Text>
        )}

        {/* ACTIONS */}
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

        <View style={styles.notification}>
          <Ionicons name="notifications-outline" size={22} color="#333" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{herbicides.length}</Text>
          </View>
          {/* LOGOUT */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <TouchableOpacity
          style={styles.greenButton}
          onPress={() => navigation.navigate('HerbicideRecommendation')}
        >
          <Ionicons name="leaf-outline" size={16} color="#fff" />
          <Text style={styles.buttonText}> Add Herbicide Recommendation</Text>
        </TouchableOpacity>

        {/*Market Prices Button */}
      <TouchableOpacity
        style={[styles.greenButton, { backgroundColor: '#7c3aed' }]}
        onPress={() => navigation.navigate('AdminPriceManagement')}
      >
        <MaterialCommunityIcons name="currency-usd" size={16} color="#fff" />
        <Text style={styles.buttonText}> Manage Market Prices</Text>
      </TouchableOpacity>

        <FlatList
          data={herbicides}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  welcomeText: { fontSize: 18, fontWeight: 'bold' },
  dateText: { fontSize: 12, color: '#777' },

  notification: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  body: { flex: 1, paddingHorizontal: 20 },
  greenButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  image: { width: '100%', height: 160 },
  noImage: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  noImageText: {
     fontSize: 12, color: '#999', marginTop: 5 },
  details: {
     padding: 12 },
  title: {
     fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  text: {
     fontSize: 13, marginBottom: 3 },
  date: {
     fontSize: 11, color: '#777', marginTop: 5 },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editBtn: {
     flexDirection: 'row', alignItems: 'center' },
  deleteBtn: { 
    flexDirection: 'row', alignItems: 'center' },
  editText: { 
    marginLeft: 5, color: '#2563eb', fontWeight: '600' },
  deleteText: 
  { marginLeft: 5, color: '#dc2626', fontWeight: '600' },
});
