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

// Seed varieties array
const SEED_VARIETIES = [
  { id: '1', name: 'BG 358', description: 'High yield, disease resistant' },
  { id: '2', name: 'BG 352', description: 'Drought tolerant' },
  { id: '3', name: 'BG 367', description: 'Short duration (3 months)' },
  { id: '4', name: 'At 362', description: 'Traditional, high quality' },
  { id: '5', name: 'Ld 365', description: 'Suitable for low country' },
  { id: '6', name: 'Bg 300', description: 'Popular variety' },
  { id: '7', name: 'Bg 94-1', description: 'High yield' },
];

export default function AdminPriceManagementScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [selectedSeedVariety, setSelectedSeedVariety] = useState('BG 358');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true); // Temporary: set to true for testing
  
  const [prices, setPrices] = useState({
    seeds: { price: '100', source: 'Dambulla Market', variety: 'BG 358' },
    urea: { price: '120', source: 'CIC' },
    tsp: { price: '150', source: 'Lanka IOC' },
    mop: { price: '140', source: 'CIC' },
    pesticide: { price: '2000', source: 'Agro Stores' },
  });

  // Keyboard dismiss function
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Check authentication and load prices
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🔄 Initializing admin panel...');
        
        // Check auth (optional for now)
        const currentUser = auth.currentUser;
        if (currentUser) {
          setUser(currentUser);
          console.log('✅ User authenticated:', currentUser.email);
        } else {
          console.log('⚠️ No user authenticated, continuing anyway');
        }
        
        // Load prices
        await loadCurrentPrices();
        
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();
  }, []);

  // Load current prices - FIXED VERSION
  const loadCurrentPrices = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading prices from Firebase...');
      
      // FIREBASE v8 SYNTAX (compat)
      const docRef = db.collection('marketPrices').doc('currentPrices');
      const docSnap = await docRef.get();
      
      console.log('📄 Document snapshot:', {
        exists: docSnap.exists, // Property, not function
        id: docSnap.id,
        metadata: docSnap.metadata
      });
      
      // Check if document exists - IMPORTANT: .exists is a PROPERTY
      if (docSnap.exists) { // NO PARENTHESES!
        const data = docSnap.data();
        console.log('✅ Firebase data loaded:', data);
        
        // Safely extract data
        setPrices({
          seeds: {
            price: (data.seeds && data.seeds.price) ? data.seeds.price.toString() : '100',
            source: (data.seeds && data.seeds.source) ? data.seeds.source : 'Dambulla Market',
            variety: (data.seeds && data.seeds.variety) ? data.seeds.variety : 'BG 358',
          },
          urea: {
            price: (data.urea && data.urea.price) ? data.urea.price.toString() : '120',
            source: (data.urea && data.urea.source) ? data.urea.source : 'CIC',
          },
          tsp: {
            price: (data.tsp && data.tsp.price) ? data.tsp.price.toString() : '150',
            source: (data.tsp && data.tsp.source) ? data.tsp.source : 'Lanka IOC',
          },
          mop: {
            price: (data.mop && data.mop.price) ? data.mop.price.toString() : '140',
            source: (data.mop && data.mop.source) ? data.mop.source : 'CIC',
          },
          pesticide: {
            price: (data.pesticide && data.pesticide.price) ? data.pesticide.price.toString() : '2000',
            source: (data.pesticide && data.pesticide.source) ? data.pesticide.source : 'Agro Stores',
          },
        });
        
        setSelectedSeedVariety(
          (data.seeds && data.seeds.variety) ? data.seeds.variety : 'BG 358'
        );
        
        console.log('🔄 Prices state updated successfully');
        
      } else {
        console.log('⚠️ No price data found, using defaults');
        // Keep default prices that are already set in state
        Alert.alert(
          'Info',
          'No existing price data found. Please set initial prices.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error loading prices:', error);
      console.error('Full error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Show user-friendly error
      let errorMessage = 'Unable to load prices. ';
      
      if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Check Firestore rules.';
      } else if (error.code === 'unavailable') {
        errorMessage += 'Network error. Check internet connection.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      Alert.alert(
        'Error', 
        errorMessage,
        [{ text: 'Retry', onPress: loadCurrentPrices }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrices = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving prices to Firebase...');
      
      // Validate inputs
      const validationErrors = [];
      const priceItems = [
        { key: 'seeds', name: 'Seeds' },
        { key: 'urea', name: 'Urea' },
        { key: 'tsp', name: 'TSP' },
        { key: 'mop', name: 'MOP' },
        { key: 'pesticide', name: 'Pesticide' },
      ];

      // Check all fields
      for (const item of priceItems) {
        const priceStr = prices[item.key].price;
        const sourceStr = prices[item.key].source;
        
        if (!priceStr || priceStr.trim() === '') {
          validationErrors.push(`${item.name} price is required`);
        } else {
          const price = parseFloat(priceStr);
          if (isNaN(price) || price <= 0) {
            validationErrors.push(`${item.name} price must be a positive number`);
          }
        }
        
        if (!sourceStr || sourceStr.trim() === '') {
          validationErrors.push(`${item.name} source is required`);
        }
      }
      
      if (validationErrors.length > 0) {
        Alert.alert(
          'Validation Error',
          'Please fix the following errors:\n\n• ' + validationErrors.join('\n• '),
          [{ text: 'OK' }]
        );
        setSaving(false);
        return;
      }

      // Prepare data
      const priceData = {
        seeds: {
          price: parseFloat(prices.seeds.price),
          source: prices.seeds.source.trim(),
          variety: selectedSeedVariety,
          lastUpdated: new Date(),
        },
        urea: {
          price: parseFloat(prices.urea.price),
          source: prices.urea.source.trim(),
          lastUpdated: new Date(),
        },
        tsp: {
          price: parseFloat(prices.tsp.price),
          source: prices.tsp.source.trim(),
          lastUpdated: new Date(),
        },
        mop: {
          price: parseFloat(prices.mop.price),
          source: prices.mop.source.trim(),
          lastUpdated: new Date(),
        },
        pesticide: {
          price: parseFloat(prices.pesticide.price),
          source: prices.pesticide.source.trim(),
          lastUpdated: new Date(),
        },
        lastUpdated: new Date(),
      };

      console.log('📤 Saving data to Firebase:', priceData);
      
      // Save to Firebase - FIREBASE v8 SYNTAX
      try {
        await db.collection('marketPrices').doc('currentPrices').set(priceData);
        console.log('✅ Data saved successfully!');
        
        Alert.alert(
          '✅ Success!',
          'Market prices updated successfully!\n\nFarmers will see the new prices immediately.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Refresh and go back
                loadCurrentPrices();
                navigation.goBack();
              }
            }
          ]
        );
        
      } catch (firebaseError) {
        console.error('❌ Firebase save error:', firebaseError);
        Alert.alert(
          'Save Error',
          `Failed to save to Firebase:\n\n${firebaseError.message}`,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('❌ General error saving prices:', error);
      Alert.alert(
        'Error', 
        `An unexpected error occurred:\n\n${error.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  // Seed Variety Selector Component
  const SeedVarietySelector = () => (
    <View style={styles.seedSelectorContainer}>
      <Text style={styles.inputLabel}>Seed Variety</Text>
      <TouchableOpacity 
        style={styles.seedSelector}
        onPress={() => setShowSeedModal(true)}
      >
        <Text style={styles.selectedSeedText}>{selectedSeedVariety}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>
      
      {/* Quick Variety Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.quickVarieties}
      >
        {SEED_VARIETIES.slice(0, 5).map((variety) => (
          <TouchableOpacity
            key={variety.id}
            style={[
              styles.varietyButton,
              selectedSeedVariety === variety.name && styles.selectedVarietyButton
            ]}
            onPress={() => {
              setSelectedSeedVariety(variety.name);
              setPrices(prev => ({
                ...prev,
                seeds: { ...prev.seeds, variety: variety.name }
              }));
            }}
          >
            <Text style={[
              styles.varietyButtonText,
              selectedSeedVariety === variety.name && styles.selectedVarietyButtonText
            ]}>
              {variety.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Rest of your components remain the same...
  // (Keep the same PriceInputCard, SeedVarietyModal, etc.)

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading prices...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
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
            <View style={{ width: 24 }} />
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information" size={20} color="#16a34a" />
              <Text style={styles.infoText}>
                Update current market prices. These will be shown to farmers in the Input Planner.
                {user && `\n\nLogged in as: ${user.email}`}
              </Text>
            </View>

            {/* Price Input Cards */}
            <View style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <Text style={styles.priceTitle}>Paddy Seeds</Text>
                <Text style={styles.priceUnit}>(LKR per kg)</Text>
              </View>
              
              <SeedVarietySelector />
              
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Price</Text>
                  <TextInput
                    style={styles.input}
                    value={prices.seeds.price}
                    onChangeText={(value) => setPrices(prev => ({
                      ...prev,
                      seeds: { ...prev.seeds, price: value }
                    }))}
                    keyboardType="decimal-pad"
                    placeholder="Enter price"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    blurOnSubmit={true}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Source</Text>
                  <TextInput
                    style={styles.input}
                    value={prices.seeds.source}
                    onChangeText={(value) => setPrices(prev => ({
                      ...prev,
                      seeds: { ...prev.seeds, source: value }
                    }))}
                    placeholder="e.g., CIC, Dambulla Market"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    blurOnSubmit={true}
                  />
                </View>
              </View>
            </View>

            {/* Other price cards (urea, tsp, mop, pesticide) */}
            {['urea', 'tsp', 'mop', 'pesticide'].map((item) => (
              <View key={item} style={styles.priceCard}>
                <View style={styles.priceHeader}>
                  <Text style={styles.priceTitle}>
                    {item === 'urea' ? 'Urea Fertilizer' : 
                     item === 'tsp' ? 'TSP Fertilizer' : 
                     item === 'mop' ? 'MOP Fertilizer' : 'Weedicide'}
                  </Text>
                  <Text style={styles.priceUnit}>
                    (LKR per {item === 'pesticide' ? 'L' : 'kg'})
                  </Text>
                </View>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Price</Text>
                    <TextInput
                      style={styles.input}
                      value={prices[item].price}
                      onChangeText={(value) => setPrices(prev => ({
                        ...prev,
                        [item]: { ...prev[item], price: value }
                      }))}
                      keyboardType="decimal-pad"
                      placeholder="Enter price"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      blurOnSubmit={true}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Source</Text>
                    <TextInput
                      style={styles.input}
                      value={prices[item].source}
                      onChangeText={(value) => setPrices(prev => ({
                        ...prev,
                        [item]: { ...prev[item], source: value }
                      }))}
                      placeholder="e.g., CIC, Dambulla Market"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      blurOnSubmit={true}
                    />
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSavePrices}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Update Prices</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
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
    paddingHorizontal: 20,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#065f46',
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  priceUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Seed Selector Styles
  seedSelectorContainer: {
    marginBottom: 12,
  },
  seedSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectedSeedText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  quickVarieties: {
    marginTop: 8,
  },
  varietyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    marginRight: 8,
  },
  selectedVarietyButton: {
    backgroundColor: '#16a34a',
  },
  varietyButtonText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  selectedVarietyButtonText: {
    color: 'white',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedVarietyItem: {
    backgroundColor: '#f0f9f0',
  },
  varietyInfo: {
    flex: 1,
  },
  varietyItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  varietyItemDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  // Input Styles
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  currentPriceInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  currentPriceText: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  // Button Styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  debugButton: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  debugButtonText: {
    color: '#6b7280',
    fontSize: 12,
  },
  historyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButtonText: {
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
});