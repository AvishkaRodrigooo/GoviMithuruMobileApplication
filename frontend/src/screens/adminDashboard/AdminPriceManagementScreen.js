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

// Seed varieties array - ONLY FROM THE IMAGE
const SEED_VARIETIES = [
  { 
    id: '1', 
    name: 'Bg 250', 
    description: 'Popular variety',
    category: 'High-Yielding',
    maturity: '3.5-4 months'
  },
  { 
    id: '2', 
    name: 'Bg 300', 
    description: 'Drought tolerant',
    category: 'Drought Tolerant',
    maturity: '4-4.5 months'
  },
  { 
    id: '3', 
    name: 'Bg 352', 
    description: 'High yield, disease resistant',
    category: 'High-Yielding',
    maturity: '4-4.5 months'
  },
  { 
    id: '4', 
    name: 'Bg 366', 
    description: 'Short duration variety',
    category: 'Short Duration',
    maturity: '3.5 months'
  },
  { 
    id: '5', 
    name: 'Bg 379-2', 
    description: 'Suitable for all seasons',
    category: 'All Season',
    maturity: '4 months'
  },
  { 
    id: '6', 
    name: 'Bg 403', 
    description: 'High yield, disease resistant',
    category: 'High-Yielding',
    maturity: '4-4.5 months'
  },
  { 
    id: '7', 
    name: 'At 306', 
    description: 'Salinity tolerant',
    category: 'Special',
    maturity: '3.5 months'
  },
  { 
    id: '8', 
    name: 'At 362', 
    description: 'Traditional, high quality',
    category: 'Traditional',
    maturity: '3.5 months'
  },
  { 
    id: '9', 
    name: 'At 405', 
    description: 'Drought tolerant',
    category: 'Drought Tolerant',
    maturity: '4 months'
  },
];

export default function AdminPriceManagementScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState(SEED_VARIETIES[1]); // Default to Bg 300
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [prices, setPrices] = useState({
    seeds: {},
    urea: { price: '', source: '' },
    tsp: { price: '', source: '' },
    mop: { price: '', source: '' },
    pesticide: { price: '', source: '' },
  });

  // Current seed price being edited
  const [currentSeedPrice, setCurrentSeedPrice] = useState({
    price: '',
    source: '',
  });

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
                                user.email === 'admin2025@gmail.com';
            
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
            }
          } else {
            console.log('❌ No user authenticated');
            Alert.alert(
              'Not Logged In',
              'Please login as admin to manage prices.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
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
        console.log('✅ Firebase data loaded:', data);

        // Load seed prices
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

        // Set default for selected seed if exists
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
  const handleDeleteSeedPrice = (seedKey) => {
    Alert.alert(
      'Delete Price',
      `Are you sure you want to delete price for ${seedKey.replace(/_/g, ' ')}?`,
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
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
            {/* Admin Info */}
            <View style={styles.adminInfoCard}>
              <MaterialCommunityIcons name="account" size={20} color="#16a34a" />
              <Text style={styles.adminInfoText}>
                Logged in as: {user?.email || 'Admin'}
              </Text>
            </View>

            {/* Seed Prices Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌾 Paddy Seed Prices</Text>
              <Text style={styles.sectionSubtitle}>Manage prices for 9 varieties</Text>

              {/* Seed Selector */}
              <TouchableOpacity 
                style={styles.seedSelector}
                onPress={() => setShowSeedModal(true)}
              >
                <View>
                  <Text style={styles.selectedSeedName}>{selectedSeed.name}</Text>
                  <Text style={styles.selectedSeedDesc}>{selectedSeed.description}</Text>
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
                      placeholder="e.g., CIC, Dambulla"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveSeedButton}
                  onPress={handleSaveSeedPrice}
                  disabled={saving}
                >
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
                  <Text style={styles.listTitle}>Saved Seed Prices:</Text>
                  {Object.entries(prices.seeds).map(([key, seed]) => (
                    <View key={key} style={styles.savedPriceItem}>
                      <View style={styles.savedPriceInfo}>
                        <Text style={styles.savedVariety}>{seed.variety || key.replace(/_/g, ' ')}</Text>
                        <Text style={styles.savedPrice}>LKR {seed.price}/kg</Text>
                        <Text style={styles.savedSource}>{seed.source}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteSeedPrice(key)}
                        style={styles.deleteButton}
                      >
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
                      onChangeText={(text) => setPrices(prev => ({
                        ...prev, urea: { ...prev.urea, price: text }
                      }))}
                      keyboardType="decimal-pad"
                      placeholder="e.g., 120"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Source</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.urea.source}
                      onChangeText={(text) => setPrices(prev => ({
                        ...prev, urea: { ...prev.urea, source: text }
                      }))}
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
                      onChangeText={(text) => setPrices(prev => ({
                        ...prev, tsp: { ...prev.tsp, price: text }
                      }))}
                      keyboardType="decimal-pad"
                      placeholder="e.g., 150"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Source</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.tsp.source}
                      onChangeText={(text) => setPrices(prev => ({
                        ...prev, tsp: { ...prev.tsp, source: text }
                      }))}
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
                      onChangeText={(text) => setPrices(prev => ({
                        ...prev, mop: { ...prev.mop, price: text }
                      }))}
                      keyboardType="decimal-pad"
                      placeholder="e.g., 140"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Source</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.mop.source}
                      onChangeText={(text) => setPrices(prev => ({
                        ...prev, mop: { ...prev.mop, source: text }
                      }))}
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
                      onChangeText={(text) => setPrices(prev => ({
                        ...prev, pesticide: { ...prev.pesticide, price: text }
                      }))}
                      keyboardType="decimal-pad"
                      placeholder="e.g., 2000"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Source</Text>
                    <TextInput
                      style={styles.input}
                      value={prices.pesticide.source}
                      onChangeText={(text) => setPrices(prev => ({
                        ...prev, pesticide: { ...prev.pesticide, source: text }
                      }))}
                      placeholder="e.g., Agro Stores"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Save All Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveAllButton}
                onPress={handleSaveAllPrices}
                disabled={saving}
              >
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
          <Modal
            visible={showSeedModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowSeedModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Seed Variety</Text>
                  <TouchableOpacity onPress={() => setShowSeedModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={SEED_VARIETIES}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.varietyItem,
                        selectedSeed.id === item.id && styles.selectedVarietyItem
                      ]}
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
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#16a34a',
    fontSize: 16,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  accessDeniedText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 20,
    marginBottom: 10,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  adminInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  adminInfoText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#065f46',
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  seedSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  selectedSeedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedSeedDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  priceInputCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  saveSeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 8,
  },
  saveSeedButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  savedPricesList: {
    marginTop: 8,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  savedPriceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  savedPriceInfo: {
    flex: 1,
  },
  savedVariety: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  savedPrice: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  savedSource: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  priceCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
  saveAllButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  saveAllButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#92400e',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  varietyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedVarietyItem: {
    backgroundColor: '#f0f9f0',
  },
  varietyInfo: {
    flex: 1,
  },
  varietyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  varietyDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  varietyTags: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#4b5563',
  },
});