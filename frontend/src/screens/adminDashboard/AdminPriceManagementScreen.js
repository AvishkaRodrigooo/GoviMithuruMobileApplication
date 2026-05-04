import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../../firebase/firebaseConfig';
import firebase from 'firebase/compat/app';

// Complete Seed varieties array with all details (27 varieties)
const SEED_VARIETIES = [
  // Improved Varieties
  { id: '1', name: 'BG 358', description: 'High yield, disease resistant', category: 'High-Yielding', maturity: '3.5-4 months', ratePerHectare: 150, zone: 'All Zones' },
  { id: '2', name: 'BG 352', description: 'Drought tolerant', category: 'Drought Tolerant', maturity: '4-4.5 months', ratePerHectare: 140, zone: 'Dry Zone' },
  { id: '3', name: 'BG 367', description: 'Short duration (3 months)', category: 'Short Duration', maturity: '3 months', ratePerHectare: 145, zone: 'All Zones' },
  { id: '4', name: 'AT 362', description: 'Traditional, high quality', category: 'Traditional', maturity: '3.5 months', ratePerHectare: 155, zone: 'Dry Zone' },
  { id: '5', name: 'LD 365', description: 'Suitable for low country', category: 'Low Country', maturity: '4 months', ratePerHectare: 135, zone: 'Low Country' },
  { id: '6', name: 'BG 300', description: 'High yield, popular variety', category: 'High-Yielding', maturity: '4 months', ratePerHectare: 160, zone: 'All Zones' },
  { id: '7', name: 'BG 304', description: 'Drought resistant, good for dry zone', category: 'Drought Tolerant', maturity: '4 months', ratePerHectare: 145, zone: 'Dry Zone' },
  { id: '8', name: 'BG 357', description: 'Blast resistant, high grain quality', category: 'Disease Resistant', maturity: '3.5-4 months', ratePerHectare: 155, zone: 'All Zones' },
  { id: '9', name: 'BG 360', description: 'Salt tolerant, suitable for coastal areas', category: 'Salt Tolerant', maturity: '4-4.5 months', ratePerHectare: 150, zone: 'Coastal' },
  { id: '10', name: 'BG 366', description: 'Lodging resistant, high tillering', category: 'High-Yielding', maturity: '4 months', ratePerHectare: 165, zone: 'All Zones' },
  { id: '11', name: 'BG 379-2', description: 'High yielding, bacterial leaf blight resistant', category: 'Disease Resistant', maturity: '4-4.5 months', ratePerHectare: 170, zone: 'Wet Zone' },
  { id: '12', name: 'AT 354', description: 'Traditional variety, excellent grain quality', category: 'Traditional', maturity: '4 months', ratePerHectare: 160, zone: 'Dry Zone' },
  { id: '13', name: 'AT 402', description: 'Long duration (4.5 months), high yield', category: 'Long Duration', maturity: '4.5 months', ratePerHectare: 175, zone: 'Wet Zone' },
  { id: '14', name: 'LD 408', description: 'Suitable for low country wet zone', category: 'Low Country', maturity: '4 months', ratePerHectare: 140, zone: 'Low Country' },
  
  // Hybrid Varieties
  { id: '15', name: 'H 4', description: 'Hybrid variety, very high yield', category: 'Hybrid', maturity: '3.5 months', ratePerHectare: 120, zone: 'All Zones' },
  { id: '16', name: 'H 5', description: 'Super hybrid, early maturity', category: 'Hybrid', maturity: '3 months', ratePerHectare: 125, zone: 'All Zones' },
  
  // Traditional Varieties
  { id: '17', name: 'Pokkali', description: 'Salt tolerant traditional variety', category: 'Traditional', maturity: '5-6 months', ratePerHectare: 130, zone: 'Coastal' },
  { id: '18', name: 'Suwandel', description: 'Premium aromatic traditional rice', category: 'Aromatic', maturity: '4-4.5 months', ratePerHectare: 145, zone: 'Wet Zone' },
  { id: '19', name: 'Kalu Heenati', description: 'Traditional medicinal rice', category: 'Medicinal', maturity: '4 months', ratePerHectare: 140, zone: 'All Zones' },
  { id: '20', name: 'Rathu Heenati', description: 'Red rice variety, high nutritional value', category: 'Red Rice', maturity: '4 months', ratePerHectare: 135, zone: 'All Zones' },
  { id: '21', name: 'Pachchaperumal', description: 'Traditional variety, drought tolerant', category: 'Traditional', maturity: '4.5 months', ratePerHectare: 150, zone: 'Dry Zone' },
  { id: '22', name: 'Masuran', description: 'Traditional variety, good for diabetes', category: 'Medicinal', maturity: '4 months', ratePerHectare: 145, zone: 'All Zones' },
  { id: '23', name: 'Kuruluthuda', description: 'Traditional variety, pest resistant', category: 'Traditional', maturity: '4 months', ratePerHectare: 155, zone: 'Dry Zone' },
  { id: '24', name: 'Suduru Samba', description: 'Premium quality samba rice', category: 'Premium', maturity: '4-4.5 months', ratePerHectare: 160, zone: 'All Zones' },
  
  // Other Improved
  { id: '25', name: 'BW 367', description: 'Blast resistant, high yield', category: 'Disease Resistant', maturity: '4 months', ratePerHectare: 165, zone: 'Wet Zone' },
  { id: '26', name: 'BG 94-1', description: 'High yield, good grain quality', category: 'High-Yielding', maturity: '4.5 months', ratePerHectare: 158, zone: 'All Zones' },
  { id: '27', name: 'AT 306', description: 'Salinity tolerant', category: 'Salt Tolerant', maturity: '3.5 months', ratePerHectare: 148, zone: 'Coastal' },
];

export default function AdminPriceManagementScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState(SEED_VARIETIES[0]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState('');

  const [prices, setPrices] = useState({
    seeds: {},
    urea: { price: '', source: '' },
    tsp: { price: '', source: '' },
    mop: { price: '', source: '' },
    pesticide: { price: '', source: '' },
  });

  const [currentSeedPrice, setCurrentSeedPrice] = useState({
    price: '',
    source: '',
  });

  // Categories for filtering
  const categories = ['All', 'High-Yielding', 'Drought Tolerant', 'Short Duration', 'Traditional', 'Hybrid', 'Disease Resistant', 'Salt Tolerant', 'Aromatic', 'Medicinal', 'Red Rice', 'Premium', 'Long Duration', 'Low Country'];

  // Check authentication and admin status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUser(user);

            // Check if user is admin
            const isAdminEmail = user.email?.endsWith('@admin.com') ||
              user.email === 'admin2025@gmail.com' ||
              user.email === 'admin@agromind.com';

            setIsAdmin(isAdminEmail);

            if (isAdminEmail) {
              console.log('✅ Admin authenticated:', user.email);
              await loadAllPrices();
            } else {
              console.log('❌ Not an admin:', user.email);
              Alert.alert(
                'Access Denied',
                'You do not have admin privileges.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
              setLoading(false);
            }
          } else {
            console.log('❌ No user authenticated');
            Alert.alert(
              'Not Logged In',
              'Please login as admin to manage prices.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Auth error:', error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Load all prices from Firebase
  const loadAllPrices = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading all prices from Firebase...');

      const docRef = db.collection('marketPrices').doc('currentPrices');
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const data = docSnap.data();
        console.log('✅ Firebase data loaded');

        const seedPrices = {};
        if (data.seeds) {
          Object.keys(data.seeds).forEach(seedKey => {
            seedPrices[seedKey] = data.seeds[seedKey];
          });
        }

        setPrices({
          seeds: seedPrices,
          urea: data.urea || { price: '', source: '' },
          tsp: data.tsp || { price: '', source: '' },
          mop: data.mop || { price: '', source: '' },
          pesticide: data.pesticide || { price: '', source: '' },
        });

        const seedKey = selectedSeed.name.replace(/[.\s]/g, '_');
        if (seedPrices[seedKey]) {
          setCurrentSeedPrice({
            price: seedPrices[seedKey].price?.toString() || '',
            source: seedPrices[seedKey].source || '',
          });
        }
      } else {
        console.log('⚠️ No price data found');
      }
    } catch (error) {
      console.error('❌ Error loading prices:', error);
      Alert.alert('Error', 'Failed to load prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter seeds based on search and category
  const getFilteredSeeds = () => {
    let filtered = SEED_VARIETIES;
    
    if (searchQuery) {
      filtered = filtered.filter(seed =>
        seed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seed.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterCategory !== 'All') {
      filtered = filtered.filter(seed => seed.category === filterCategory);
    }
    
    return filtered;
  };

  // Handle seed selection
  const handleSeedSelect = (seed) => {
    setSelectedSeed(seed);
    const seedKey = seed.name.replace(/[.\s]/g, '_');

    if (prices.seeds[seedKey]) {
      setCurrentSeedPrice({
        price: prices.seeds[seedKey].price?.toString() || '',
        source: prices.seeds[seedKey].source || '',
      });
    } else {
      setCurrentSeedPrice({ price: '', source: '' });
    }

    setShowSeedModal(false);
  };

  // Save current seed price
  const handleSaveSeedPrice = async () => {
    if (!currentSeedPrice.price || parseFloat(currentSeedPrice.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (!currentSeedPrice.source.trim()) {
      Alert.alert('Error', 'Please enter a source');
      return;
    }

    try {
      setSaving(true);
      const seedKey = selectedSeed.name.replace(/[.\s]/g, '_');

      const updatedSeeds = {
        ...prices.seeds,
        [seedKey]: {
          price: parseFloat(currentSeedPrice.price),
          source: currentSeedPrice.source.trim(),
          variety: selectedSeed.name,
          description: selectedSeed.description,
          category: selectedSeed.category,
          maturity: selectedSeed.maturity,
          ratePerHectare: selectedSeed.ratePerHectare,
          zone: selectedSeed.zone,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        }
      };

      setPrices(prev => ({
        ...prev,
        seeds: updatedSeeds,
      }));

      await db.collection('marketPrices').doc('currentPrices').set({
        seeds: updatedSeeds,
      }, { merge: true });

      Alert.alert('✅ Success', `Price for ${selectedSeed.name} saved successfully!`);

    } catch (error) {
      console.error('Error saving seed price:', error);
      Alert.alert('Error', 'Failed to save seed price');
    } finally {
      setSaving(false);
    }
  };

  // Bulk update all seeds
  const handleBulkUpdate = async () => {
    if (!bulkPercentage || parseFloat(bulkPercentage) === 0) {
      Alert.alert('Error', 'Please enter a valid percentage');
      return;
    }

    Alert.alert(
      'Bulk Update',
      `Are you sure you want to ${parseFloat(bulkPercentage) > 0 ? 'increase' : 'decrease'} all seed prices by ${Math.abs(parseFloat(bulkPercentage))}%?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSaving(true);
              const percentage = parseFloat(bulkPercentage);
              const updatedSeeds = { ...prices.seeds };

              Object.keys(updatedSeeds).forEach(key => {
                if (updatedSeeds[key].price) {
                  const newPrice = updatedSeeds[key].price * (1 + percentage / 100);
                  updatedSeeds[key] = {
                    ...updatedSeeds[key],
                    price: Math.round(newPrice * 100) / 100,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                  };
                }
              });

              setPrices(prev => ({
                ...prev,
                seeds: updatedSeeds,
              }));

              await db.collection('marketPrices').doc('currentPrices').set({
                seeds: updatedSeeds,
              }, { merge: true });

              setBulkPercentage('');
              setShowBulkUpdate(false);
              Alert.alert('✅ Success', 'All seed prices updated successfully!');
            } catch (error) {
              console.error('Bulk update error:', error);
              Alert.alert('Error', 'Failed to update prices');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  // Save all prices
  const handleSaveAllPrices = async () => {
    try {
      setSaving(true);

      const priceData = {
        seeds: prices.seeds,
        urea: {
          price: parseFloat(prices.urea.price) || 0,
          source: prices.urea.source.trim() || 'Not specified',
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        },
        tsp: {
          price: parseFloat(prices.tsp.price) || 0,
          source: prices.tsp.source.trim() || 'Not specified',
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        },
        mop: {
          price: parseFloat(prices.mop.price) || 0,
          source: prices.mop.source.trim() || 'Not specified',
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        },
        pesticide: {
          price: parseFloat(prices.pesticide.price) || 0,
          source: prices.pesticide.source.trim() || 'Not specified',
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        },
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: user?.email || 'admin',
      };

      await db.collection('marketPrices').doc('currentPrices').set(priceData, { merge: true });

      Alert.alert(
        '✅ Success!',
        'All market prices updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Error saving all prices:', error);
      Alert.alert('Error', 'Failed to save prices');
    } finally {
      setSaving(false);
    }
  };

  // Delete seed price
  const handleDeleteSeedPrice = (seedKey, seedName) => {
    Alert.alert(
      'Delete Price',
      `Are you sure you want to delete price for ${seedName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedSeeds = { ...prices.seeds };
              delete updatedSeeds[seedKey];

              setPrices(prev => ({
                ...prev,
                seeds: updatedSeeds,
              }));

              await db.collection('marketPrices').doc('currentPrices').set({
                seeds: updatedSeeds,
              }, { merge: true });

              Alert.alert('✅ Deleted', 'Seed price removed successfully');
            } catch (error) {
              console.error('Error deleting seed price:', error);
              Alert.alert('Error', 'Failed to delete seed price');
            }
          }
        }
      ]
    );
  };

  // Get statistics
  const getStats = () => {
    const totalSeeds = SEED_VARIETIES.length;
    const pricedSeeds = Object.keys(prices.seeds).length;
    const avgPrice = Object.values(prices.seeds).reduce((sum, seed) => sum + (seed.price || 0), 0) / (pricedSeeds || 1);
    return { totalSeeds, pricedSeeds, avgPrice: Math.round(avgPrice) };
  };

  const stats = getStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading admin panel...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.accessDeniedContainer}>
        <MaterialCommunityIcons name="shield-lock" size={80} color="#dc2626" />
        <Text style={styles.accessDeniedText}>Access Denied</Text>
        <Text style={styles.accessDeniedSubtext}>
          You don't have permission to access this page. Please login with an admin account.
        </Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredSeeds = getFilteredSeeds();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Market Prices</Text>
            <TouchableOpacity onPress={loadAllPrices}>
              <MaterialCommunityIcons name="refresh" size={24} color="#16a34a" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Admin Info & Stats */}
            <View style={styles.adminInfoCard}>
              <MaterialCommunityIcons name="account" size={20} color="#16a34a" />
              <Text style={styles.adminInfoText}>Logged in as: {user?.email || 'Admin'}</Text>
            </View>

            {/* Statistics Card */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalSeeds}</Text>
                <Text style={styles.statLabel}>Total Varieties</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.pricedSeeds}</Text>
                <Text style={styles.statLabel}>Priced</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>LKR {stats.avgPrice}</Text>
                <Text style={styles.statLabel}>Avg Price/kg</Text>
              </View>
            </View>

            {/* Seed Prices Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>🌾 Paddy Seed Prices</Text>
                  <Text style={styles.sectionSubtitle}>Manage prices for {SEED_VARIETIES.length}+ varieties</Text>
                </View>
                <TouchableOpacity style={styles.bulkButton} onPress={() => setShowBulkUpdate(true)}>
                  <MaterialCommunityIcons name="database-edit" size={20} color="#16a34a" />
                  <Text style={styles.bulkButtonText}>Bulk</Text>
                </TouchableOpacity>
              </View>

              {/* Seed Selector with Search */}
              <TouchableOpacity style={styles.seedSelector} onPress={() => setShowSeedModal(true)}>
                <View>
                  <Text style={styles.selectedSeedName}>{selectedSeed.name}</Text>
                  <Text style={styles.selectedSeedDesc}>{selectedSeed.description}</Text>
                  <View style={styles.selectedSeedTags}>
                    <View style={styles.tagSmall}>
                      <Text style={styles.tagSmallText}>{selectedSeed.category}</Text>
                    </View>
                    <View style={styles.tagSmall}>
                      <Text style={styles.tagSmallText}>{selectedSeed.maturity}</Text>
                    </View>
                    <View style={styles.tagSmall}>
                      <Text style={styles.tagSmallText}>{selectedSeed.zone}</Text>
                    </View>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={24} color="#6b7280" />
              </TouchableOpacity>

              {/* Price Input for Selected Seed */}
              <View style={styles.priceInputCard}>
                <View style={styles.inputRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Price (LKR/kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={currentSeedPrice.price}
                      onChangeText={(text) => setCurrentSeedPrice(prev => ({ ...prev, price: text }))}
                      keyboardType="decimal-pad"
                      placeholder="e.g., 120"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Source</Text>
                    <TextInput
                      style={styles.input}
                      value={currentSeedPrice.source}
                      onChangeText={(text) => setCurrentSeedPrice(prev => ({ ...prev, source: text }))}
                      placeholder="e.g., CIC, Dambulla Market"
                    />
                  </View>
                </View>
                <View style={styles.rateInfo}>
                  <MaterialCommunityIcons name="information" size={14} color="#6b7280" />
                  <Text style={styles.rateInfoText}>Seed rate: {selectedSeed.ratePerHectare} kg/ha • Zone: {selectedSeed.zone}</Text>
                </View>
                <TouchableOpacity style={styles.saveSeedButton} onPress={handleSaveSeedPrice} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="content-save" size={18} color="#fff" />
                      <Text style={styles.saveSeedButtonText}>Save {selectedSeed.name} Price</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Saved Seed Prices List */}
              {Object.keys(prices.seeds).length > 0 && (
                <View style={styles.savedPricesList}>
                  <Text style={styles.listTitle}>Saved Seed Prices ({Object.keys(prices.seeds).length}):</Text>
                  {Object.entries(prices.seeds).map(([key, seed]) => (
                    <View key={key} style={styles.savedPriceItem}>
                      <View style={styles.savedPriceInfo}>
                        <Text style={styles.savedVariety}>{seed.variety || key.replace(/_/g, ' ')}</Text>
                        <Text style={styles.savedPrice}>LKR {seed.price}/kg</Text>
                        <Text style={styles.savedSource}>Source: {seed.source}</Text>
                        <Text style={styles.savedMeta}>{seed.category} • {seed.maturity}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteSeedPrice(key, seed.variety)} style={styles.deleteButton}>
                        <MaterialCommunityIcons name="delete" size={20} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Fertilizer & Pesticide Prices */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🧪 Fertilizer & Pesticide Prices</Text>

              {/* Urea */}
              <View style={styles.priceCard}>
                <Text style={styles.itemTitle}>Urea Fertilizer</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Price (LKR/kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.urea.price}
                      onChangeText={(text) => setPrices(prev => ({ ...prev, urea: { ...prev.urea, price: text } }))}
                      keyboardType="decimal-pad"
                      placeholder="e.g., 120"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Source</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.urea.source}
                      onChangeText={(text) => setPrices(prev => ({ ...prev, urea: { ...prev.urea, source: text } }))}
                      placeholder="e.g., CIC"
                    />
                  </View>
                </View>
              </View>

              {/* TSP */}
              <View style={styles.priceCard}>
                <Text style={styles.itemTitle}>TSP Fertilizer</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Price (LKR/kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.tsp.price}
                      onChangeText={(text) => setPrices(prev => ({ ...prev, tsp: { ...prev.tsp, price: text } }))}
                      keyboardType="decimal-pad"
                      placeholder="e.g., 150"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Source</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.tsp.source}
                      onChangeText={(text) => setPrices(prev => ({ ...prev, tsp: { ...prev.tsp, source: text } }))}
                      placeholder="e.g., Lanka IOC"
                    />
                  </View>
                </View>
              </View>

              {/* MOP */}
              <View style={styles.priceCard}>
                <Text style={styles.itemTitle}>MOP Fertilizer</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Price (LKR/kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.mop.price}
                      onChangeText={(text) => setPrices(prev => ({ ...prev, mop: { ...prev.mop, price: text } }))}
                      keyboardType="decimal-pad"
                      placeholder="e.g., 140"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Source</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.mop.source}
                      onChangeText={(text) => setPrices(prev => ({ ...prev, mop: { ...prev.mop, source: text } }))}
                      placeholder="e.g., CIC"
                    />
                  </View>
                </View>
              </View>

              {/* Pesticide */}
              <View style={styles.priceCard}>
                <Text style={styles.itemTitle}>Weedicide/Pesticide</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Price (LKR/L)</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.pesticide.price}
                      onChangeText={(text) => setPrices(prev => ({ ...prev, pesticide: { ...prev.pesticide, price: text } }))}
                      keyboardType="decimal-pad"
                      placeholder="e.g., 2000"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Source</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.pesticide.source}
                      onChangeText={(text) => setPrices(prev => ({ ...prev, pesticide: { ...prev.pesticide, source: text } }))}
                      placeholder="e.g., Agro Stores"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Save All Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={saving}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveAllButton} onPress={handleSaveAllPrices} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-all" size={20} color="#fff" />
                    <Text style={styles.saveAllButtonText}>Save All Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Note */}
            <View style={styles.noteContainer}>
              <MaterialCommunityIcons name="information" size={16} color="#6b7280" />
              <Text style={styles.noteText}>
                Prices will be visible to farmers in the Input Planner and Crop Recommendation screens.
              </Text>
            </View>
          </ScrollView>

          {/* Seed Selection Modal */}
          <Modal visible={showSeedModal} transparent={true} animationType="slide" onRequestClose={() => setShowSeedModal(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Seed Variety</Text>
                  <TouchableOpacity onPress={() => setShowSeedModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search varieties..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9ca3af"
                  />
                  {searchQuery !== '' && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <MaterialCommunityIcons name="close" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Category Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, filterCategory === cat && styles.categoryChipActive]}
                      onPress={() => setFilterCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, filterCategory === cat && styles.categoryChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <FlatList
                  data={filteredSeeds}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.varietyItem, selectedSeed.id === item.id && styles.selectedVarietyItem]}
                      onPress={() => handleSeedSelect(item)}
                    >
                      <View style={styles.varietyInfo}>
                        <Text style={styles.varietyName}>{item.name}</Text>
                        <Text style={styles.varietyDesc}>{item.description}</Text>
                        <View style={styles.varietyTags}>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{item.category}</Text>
                          </View>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{item.maturity}</Text>
                          </View>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{item.zone}</Text>
                          </View>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{item.ratePerHectare} kg/ha</Text>
                          </View>
                        </View>
                      </View>
                      {selectedSeed.id === item.id && (
                        <MaterialCommunityIcons name="check-circle" size={24} color="#16a34a" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          {/* Bulk Update Modal */}
          <Modal visible={showBulkUpdate} transparent={true} animationType="fade" onRequestClose={() => setShowBulkUpdate(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.bulkModalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Bulk Price Update</Text>
                  <TouchableOpacity onPress={() => setShowBulkUpdate(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.bulkText}>Apply percentage change to all seed prices</Text>
                <View style={styles.bulkInputContainer}>
                  <TextInput
                    style={styles.bulkInput}
                    value={bulkPercentage}
                    onChangeText={setBulkPercentage}
                    keyboardType="decimal-pad"
                    placeholder="e.g., 10 or -5"
                  />
                  <Text style={styles.bulkPercentSymbol}>%</Text>
                </View>
                <View style={styles.bulkButtons}>
                  <TouchableOpacity style={styles.bulkCancelButton} onPress={() => setShowBulkUpdate(false)}>
                    <Text style={styles.bulkCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bulkConfirmButton} onPress={handleBulkUpdate}>
                    <Text style={styles.bulkConfirmText}>Apply</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.bulkNote}>Positive = Increase, Negative = Decrease</Text>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 10, color: '#16a34a', fontSize: 16 },
  accessDeniedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  accessDeniedText: { fontSize: 22, fontWeight: 'bold', color: '#dc2626', marginTop: 20, marginBottom: 10 },
  accessDeniedSubtext: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  goBackButton: { backgroundColor: '#16a34a', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
  goBackButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { flex: 1, padding: 16 },
  adminInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e8', padding: 12, borderRadius: 8, marginBottom: 12 },
  adminInfoText: { marginLeft: 8, fontSize: 13, color: '#065f46', flex: 1 },
  statsCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  sectionSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  bulkButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  bulkButtonText: { fontSize: 12, color: '#16a34a', marginLeft: 4, fontWeight: '500' },
  seedSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 16, marginBottom: 16 },
  selectedSeedName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  selectedSeedDesc: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  selectedSeedTags: { flexDirection: 'row', flexWrap: 'wrap' },
  tagSmall: { backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginRight: 6, marginBottom: 4 },
  tagSmallText: { fontSize: 10, color: '#4b5563' },
  priceInputCard: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 16 },
  inputRow: { flexDirection: 'row', marginBottom: 12 },
  inputContainer: { flex: 1, marginHorizontal: 4 },
  inputLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff' },
  rateInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  rateInfoText: { fontSize: 11, color: '#6b7280', marginLeft: 6 },
  saveSeedButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', padding: 12, borderRadius: 8 },
  saveSeedButtonText: { color: '#fff', fontWeight: '600', fontSize: 14, marginLeft: 6 },
  savedPricesList: { marginTop: 8 },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  savedPriceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, marginBottom: 8 },
  savedPriceInfo: { flex: 1 },
  savedVariety: { fontSize: 14, fontWeight: '600', color: '#111827' },
  savedPrice: { fontSize: 13, color: '#16a34a', fontWeight: '600', marginTop: 2 },
  savedSource: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  savedMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  deleteButton: { padding: 4 },
  priceCard: { marginBottom: 12, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  buttonContainer: { flexDirection: 'row', marginBottom: 16 },
  cancelButton: { flex: 1, backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  cancelButtonText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  saveAllButton: { flex: 2, flexDirection: 'row', backgroundColor: '#16a34a', padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  saveAllButtonText: { color: '#fff', fontWeight: '600', fontSize: 14, marginLeft: 6 },
  noteContainer: { flexDirection: 'row', backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 20 },
  noteText: { flex: 1, marginLeft: 8, fontSize: 12, color: '#92400e' },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', marginHorizontal: 16, marginTop: 12, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1f2937' },
  categoryFilter: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  categoryChipActive: { backgroundColor: '#16a34a' },
  categoryChipText: { fontSize: 12, color: '#4b5563' },
  categoryChipTextActive: { color: '#fff' },
  varietyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  selectedVarietyItem: { backgroundColor: '#f0f9f0' },
  varietyInfo: { flex: 1 },
  varietyName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  varietyDesc: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  varietyTags: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginRight: 6, marginBottom: 4 },
  tagText: { fontSize: 10, color: '#4b5563' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  bulkModalContent: { backgroundColor: '#fff', borderRadius: 20, width: '85%', padding: 20 },
  bulkText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  bulkInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  bulkInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, width: 100, textAlign: 'center', fontSize: 16 },
  bulkPercentSymbol: { fontSize: 18, marginLeft: 8, color: '#374151' },
  bulkButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  bulkCancelButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  bulkCancelText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  bulkConfirmButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#16a34a', alignItems: 'center' },
  bulkConfirmText: { fontSize: 14, fontWeight: '500', color: '#fff' },
  bulkNote: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 12 },
});