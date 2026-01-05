import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/firebaseConfig';

const DealerDashboard = ({ navigation }) => {
  const [dealerInfo, setDealerInfo] = useState(null);
  const [todayPrice, setTodayPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDealerInfo();
  }, []);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDealerInfo();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchDealerInfo = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get dealer profile
      const dealerDoc = await db.collection('users').doc(user.uid).get();
      if (dealerDoc.exists) {
        setDealerInfo({ id: user.uid, ...dealerDoc.data() });
      }

      // Get today's price
      const today = new Date().toISOString().split('T')[0];
      const priceDoc = await db
        .collection('dealerPrices')
        .doc(user.uid)
        .collection('prices')
        .doc(today)
        .get();

      if (priceDoc.exists) {
        setTodayPrice(priceDoc.data());
      } else {
        setTodayPrice(null);
      }
    } catch (error) {
      console.error('Error fetching dealer info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="store" size={50} color="#16a34a" />
        <Text style={styles.title}>Dealer Dashboard</Text>
        <Text style={styles.subtitle}>
          {dealerInfo?.businessName || dealerInfo?.name || 'Welcome, Dealer'}
        </Text>
      </View>

      {/* Today's Price Card */}
      <View style={styles.priceCard}>
        <View style={styles.priceHeader}>
          <MaterialCommunityIcons name="cash" size={28} color="#22c55e" />
          <Text style={styles.priceCardTitle}>Today's Rice Price</Text>
        </View>

        {todayPrice ? (
          <View style={styles.priceDisplay}>
            <Text style={styles.priceAmount}>Rs. {todayPrice.pricePerKg}/kg</Text>
            <Text style={styles.priceVariety}>{todayPrice.variety || 'All Varieties'}</Text>
            <Text style={styles.priceTime}>
              Updated: {new Date(todayPrice.updatedAt.seconds * 1000).toLocaleTimeString()}
            </Text>
          </View>
        ) : (
          <Text style={styles.noPriceText}>No price set for today</Text>
        )}

        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => navigation.navigate('UpdatePrice')}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
          <Text style={styles.updateButtonText}>
            {todayPrice ? 'Update Price' : 'Set Today\'s Price'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="chart-line" size={30} color="#16a34a" />
          <Text style={styles.statNumber}>
            Rs. {todayPrice?.pricePerKg || '0'}
          </Text>
          <Text style={styles.statLabel}>Current Price</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="package-variant" size={30} color="#16a34a" />
          <Text style={styles.statNumber}>
            {todayPrice?.minQuantity || '0'} kg
          </Text>
          <Text style={styles.statLabel}>Min. Quantity</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('UpdatePrice')}
        >
          <MaterialCommunityIcons name="pencil-box" size={30} color="#16a34a" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Update Daily Price</Text>
            <Text style={styles.actionDesc}>Set or modify today's buying price</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            // TODO: Navigate to price history
            alert('Price history feature coming soon!');
          }}
        >
          <MaterialCommunityIcons name="history" size={30} color="#16a34a" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Price History</Text>
            <Text style={styles.actionDesc}>View your past prices</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            // TODO: Navigate to farmer orders
            alert('Farmer inquiries feature coming soon!');
          }}
        >
          <MaterialCommunityIcons name="clipboard-list" size={30} color="#16a34a" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Farmer Inquiries</Text>
            <Text style={styles.actionDesc}>Manage orders & inquiries</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Profile')}
        >
          <MaterialCommunityIcons name="account-circle" size={30} color="#16a34a" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>My Profile</Text>
            <Text style={styles.actionDesc}>Update business details</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Business Info */}
      {dealerInfo && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Business Information</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="store" size={20} color="#64748b" />
            <Text style={styles.infoText}>
              {dealerInfo.businessName || dealerInfo.name || 'Not set'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#64748b" />
            <Text style={styles.infoText}>
              {dealerInfo.location || 'Not set'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone" size={20} color="#64748b" />
            <Text style={styles.infoText}>
              {dealerInfo.phone || 'Not set'}
            </Text>
          </View>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 3,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 5,
  },
  priceCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    elevation: 3,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  priceCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  priceDisplay: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#16a34a',
  },
  priceVariety: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 5,
  },
  priceTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 5,
  },
  noPriceText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    paddingVertical: 20,
  },
  updateButton: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#16a34a',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 15,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    gap: 15,
    marginBottom: 12,
    elevation: 2,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#dc2626',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DealerDashboard;