import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase/firebaseConfig';

const InputPlannerScreen = ({ navigation }) => {
  // State variables
  const [fieldSize, setFieldSize] = useState('1.0');
  const [unit, setUnit] = useState('Hectares');
  const [selectedSeedVariety, setSelectedSeedVariety] = useState('BG 358');
  const [seedVarieties, setSeedVarieties] = useState([
    { id: '1', name: 'BG 358', description: 'High yield, disease resistant', ratePerHectare: 150 },
    { id: '2', name: 'BG 352', description: 'Drought tolerant', ratePerHectare: 140 },
    { id: '3', name: 'BG 367', description: 'Short duration (3 months)', ratePerHectare: 145 },
    { id: '4', name: 'At 362', description: 'Traditional, high quality', ratePerHectare: 155 },
    { id: '5', name: 'Ld 365', description: 'Suitable for low country', ratePerHectare: 135 },
  ]);
  const [showVarietyModal, setShowVarietyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Market prices state
  const [marketPrices, setMarketPrices] = useState({
    seeds: { price: 100, lastUpdated: '', source: 'Market Avg', variety: 'BG 358' },
    urea: { price: 120, lastUpdated: '', source: 'CIC' },
    tsp: { price: 150, lastUpdated: '', source: 'Lanka IOC' },
    mop: { price: 140, lastUpdated: '', source: 'CIC' },
    pesticide: { price: 2000, lastUpdated: '', source: 'Agro Mart' },
  });
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState({
    seeds: { name: 'Seeds (BG 358)', quantity: 150, unit: 'kg', costPerUnit: 100, description: 'High yield, disease resistant' },
    fertilizers: [
      { name: 'Urea', quantity: 75, unit: 'kg', costPerUnit: 120 },
      { name: 'TSP', quantity: 50, unit: 'kg', costPerUnit: 150 },
      { name: 'MOP', quantity: 40, unit: 'kg', costPerUnit: 140 },
    ],
    pesticides: [
      { name: 'Weedicide', quantity: 1.5, unit: 'L', costPerUnit: 2000 },
    ],
  });

  // Calculate total cost
  const totalCost = recommendations.seeds.cost +
    recommendations.fertilizers.reduce((sum, f) => sum + (f.cost || 0), 0) +
    recommendations.pesticides.reduce((sum, p) => sum + (p.cost || 0), 0);

  // Base rates per hectare
  const baseRatesPerHectare = {
    urea: 75,
    tsp: 50,
    mop: 40,
    pesticide: 1.5,
  };

  // Get base seed rate for selected variety
  const getBaseSeedRate = (varietyName) => {
    const variety = seedVarieties.find(v => v.name === varietyName);
    return variety ? variety.ratePerHectare : 150;
  };

  // 1. FETCH PRICES FROM FIREBASE - FIXED VERSION
  const fetchMarketPrices = async () => {
    try {
      console.log('🔄 Fetching prices from Firebase...');
      
      // Get document from Firestore - FIREBASE v8 SYNTAX
      const docRef = db.collection('marketPrices').doc('currentPrices');
      const docSnap = await docRef.get();
      
      console.log('📄 Document snapshot:', {
        exists: docSnap.exists, // This is a PROPERTY, not a function
        id: docSnap.id
      });
      
      // FIX: .exists is a PROPERTY, not a function
      if (docSnap.exists) { // NO PARENTHESES!
        const data = docSnap.data();
        console.log('✅ Firebase data received:', data);
        
        // Convert Firestore timestamps to readable format
        const formatTimestamp = (timestamp) => {
          if (!timestamp) return new Date().toLocaleTimeString();
          try {
            // If it's a Firestore timestamp (v8 syntax)
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
              return timestamp.toDate().toLocaleTimeString();
            }
            // If it's already a Date
            if (timestamp instanceof Date) {
              return timestamp.toLocaleTimeString();
            }
            // If it's a string
            return new Date(timestamp).toLocaleTimeString();
          } catch (e) {
            console.log('Date format error:', e);
            return new Date().toLocaleTimeString();
          }
        };
        
        // Safely extract data
        const formattedPrices = {
          seeds: {
            price: (data.seeds && data.seeds.price) ? data.seeds.price : 100,
            source: (data.seeds && data.seeds.source) ? data.seeds.source : 'Market Avg',
            variety: (data.seeds && data.seeds.variety) ? data.seeds.variety : 'BG 358',
            lastUpdated: formatTimestamp(data.seeds?.lastUpdated || data.lastUpdated)
          },
          urea: {
            price: (data.urea && data.urea.price) ? data.urea.price : 120,
            source: (data.urea && data.urea.source) ? data.urea.source : 'CIC',
            lastUpdated: formatTimestamp(data.urea?.lastUpdated || data.lastUpdated)
          },
          tsp: {
            price: (data.tsp && data.tsp.price) ? data.tsp.price : 150,
            source: (data.tsp && data.tsp.source) ? data.tsp.source : 'Lanka IOC',
            lastUpdated: formatTimestamp(data.tsp?.lastUpdated || data.lastUpdated)
          },
          mop: {
            price: (data.mop && data.mop.price) ? data.mop.price : 140,
            source: (data.mop && data.mop.source) ? data.mop.source : 'CIC',
            lastUpdated: formatTimestamp(data.mop?.lastUpdated || data.lastUpdated)
          },
          pesticide: {
            price: (data.pesticide && data.pesticide.price) ? data.pesticide.price : 2000,
            source: (data.pesticide && data.pesticide.source) ? data.pesticide.source : 'Agro Mart',
            lastUpdated: formatTimestamp(data.pesticide?.lastUpdated || data.lastUpdated)
          }
        };
        
        console.log('📊 Formatted prices:', formattedPrices);
        
        setMarketPrices(formattedPrices);
        setSelectedSeedVariety(formattedPrices.seeds.variety);
        updateRecommendationsWithPrices(formattedPrices);
        
        return formattedPrices;
      } else {
        console.log('⚠️ No data in Firebase, using default prices');
        // Create default data if doesn't exist
        const defaultPrices = {
          seeds: { 
            price: 100, 
            lastUpdated: new Date().toLocaleTimeString(), 
            source: 'Market Avg',
            variety: 'BG 358'
          },
          urea: { 
            price: 120, 
            lastUpdated: new Date().toLocaleTimeString(), 
            source: 'CIC Fertilizer' 
          },
          tsp: { 
            price: 150, 
            lastUpdated: new Date().toLocaleTimeString(), 
            source: 'Lanka IOC' 
          },
          mop: { 
            price: 140, 
            lastUpdated: new Date().toLocaleTimeString(), 
            source: 'CIC Fertilizer' 
          },
          pesticide: { 
            price: 2000, 
            lastUpdated: new Date().toLocaleTimeString(), 
            source: 'Agro Stores' 
          },
        };
        
        setMarketPrices(defaultPrices);
        updateRecommendationsWithPrices(defaultPrices);
        return defaultPrices;
      }
    } catch (error) {
      console.error('❌ Error fetching prices from Firebase:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Using cached prices. ';
      
      if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Check Firestore rules.';
      } else if (error.code === 'unavailable') {
        errorMessage += 'Network error. Check internet connection.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      Alert.alert('Network Error', errorMessage);
      return null;
    }
  };

  // 2. UPDATE RECOMMENDATIONS WITH PRICES
  const updateRecommendationsWithPrices = (prices) => {
    const selectedVariety = seedVarieties.find(v => v.name === selectedSeedVariety);
    const seedRate = getBaseSeedRate(selectedSeedVariety);
    const sizeInHectares = unit === 'Acres' ? parseFloat(fieldSize) * 0.404686 : parseFloat(fieldSize);
    const seedQuantity = Math.round(sizeInHectares * seedRate);

    setRecommendations(prev => ({
      seeds: { 
        ...prev.seeds, 
        name: `Seeds (${selectedSeedVariety})`,
        description: selectedVariety?.description || 'Certified Seeds',
        costPerUnit: prices.seeds.price,
        quantity: seedQuantity,
        cost: seedQuantity * prices.seeds.price
      },
      fertilizers: [
        { 
          ...prev.fertilizers[0], 
          costPerUnit: prices.urea.price,
          cost: prev.fertilizers[0].quantity * prices.urea.price
        },
        { 
          ...prev.fertilizers[1], 
          costPerUnit: prices.tsp.price,
          cost: prev.fertilizers[1].quantity * prices.tsp.price
        },
        { 
          ...prev.fertilizers[2], 
          costPerUnit: prices.mop.price,
          cost: prev.fertilizers[2].quantity * prices.mop.price
        },
      ],
      pesticides: [
        { 
          ...prev.pesticides[0], 
          costPerUnit: prices.pesticide.price,
          cost: prev.pesticides[0].quantity * prices.pesticide.price
        },
      ],
    }));
  };

  // 3. DYNAMIC CALCULATION
  const calculateQuantities = (size, currentUnit, seedType = selectedSeedVariety) => {
    let sizeInHectares = parseFloat(size);
    
    if (currentUnit === 'Acres') {
      sizeInHectares = sizeInHectares * 0.404686;
    }

    const seedRate = getBaseSeedRate(seedType);
    const selectedVariety = seedVarieties.find(v => v.name === seedType);
    
    const newSeedsQuantity = Math.round(sizeInHectares * seedRate);
    const newUreaQuantity = Math.round(sizeInHectares * baseRatesPerHectare.urea);
    const newTSPQuantity = Math.round(sizeInHectares * baseRatesPerHectare.tsp);
    const newMOPQuantity = Math.round(sizeInHectares * baseRatesPerHectare.mop);
    const newPesticideQuantity = (sizeInHectares * baseRatesPerHectare.pesticide).toFixed(1);

    setRecommendations({
      seeds: { 
        ...recommendations.seeds, 
        name: `Seeds (${seedType})`,
        description: selectedVariety?.description || 'Certified Seeds',
        quantity: newSeedsQuantity,
        cost: newSeedsQuantity * marketPrices.seeds.price
      },
      fertilizers: [
        { 
          ...recommendations.fertilizers[0], 
          quantity: newUreaQuantity,
          cost: newUreaQuantity * marketPrices.urea.price
        },
        { 
          ...recommendations.fertilizers[1], 
          quantity: newTSPQuantity,
          cost: newTSPQuantity * marketPrices.tsp.price
        },
        { 
          ...recommendations.fertilizers[2], 
          quantity: newMOPQuantity,
          cost: newMOPQuantity * marketPrices.mop.price
        },
      ],
      pesticides: [
        { 
          ...recommendations.pesticides[0], 
          quantity: parseFloat(newPesticideQuantity),
          cost: parseFloat(newPesticideQuantity) * marketPrices.pesticide.price
        },
      ],
    });
  };

  // 4. REFRESH MARKET PRICES
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMarketPrices();
    calculateQuantities(fieldSize, unit, selectedSeedVariety);
    setRefreshing(false);
  };

  // 5. INITIALIZE ON MOUNT
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchMarketPrices();
      calculateQuantities(fieldSize, unit, selectedSeedVariety);
      setLoading(false);
    };
    initialize();
  }, []);

  // 6. PRICE INFO COMPONENT
  const PriceInfo = ({ item, priceData }) => (
    <View style={styles.priceInfoContainer}>
      <Text style={styles.priceLabel}>Market Price:</Text>
      <Text style={styles.priceValue}>LKR {priceData.price}/unit</Text>
      <View style={styles.priceMeta}>
        <Text style={styles.priceSource}>{priceData.source}</Text>
        <Text style={styles.priceTime}>Updated: {priceData.lastUpdated}</Text>
      </View>
    </View>
  );

  // 7. VARIETY MODAL
  const renderVarietyModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showVarietyModal}
      onRequestClose={() => setShowVarietyModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Seed Variety</Text>
            <TouchableOpacity onPress={() => setShowVarietyModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={seedVarieties}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.varietyItem,
                  selectedSeedVariety === item.name && styles.selectedVarietyItem
                ]}
                onPress={() => {
                  setSelectedSeedVariety(item.name);
                  calculateQuantities(fieldSize, unit, item.name);
                  setShowVarietyModal(false);
                }}
              >
                <View>
                  <Text style={styles.varietyItemName}>{item.name}</Text>
                  <Text style={styles.varietyItemDesc}>{item.description}</Text>
                  <Text style={styles.varietyItemRate}>
                    Seed rate: {item.ratePerHectare} kg/ha • Cost: LKR {Math.round(item.ratePerHectare * marketPrices.seeds.price).toLocaleString()}/ha
                  </Text>
                </View>
                {selectedSeedVariety === item.name && (
                  <MaterialCommunityIcons name="check-circle" size={24} color="#16a34a" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // 8. ADMIN BUTTON HANDLER
  const handleAdminButton = () => {
    Alert.alert(
      'Admin Access',
      'Do you want to manage market prices?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => navigation.navigate('AdminPriceManagement')
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Fetching live market prices...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Admin Button */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.header}>🌾 Input Planner</Text>
            <Text style={styles.subHeader}>
              Live Market Prices • {marketPrices.seeds.variety || 'BG 358'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.adminButton}
              onPress={handleAdminButton}
            >
              <MaterialCommunityIcons name="tune" size={20} color="#16a34a" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <MaterialCommunityIcons name="refresh" size={20} color="#16a34a" />
            </TouchableOpacity>
            <Text style={styles.lastUpdated}>
              Updated: {marketPrices.seeds.lastUpdated}
            </Text>
          </View>
        </View>

        {/* Current Market Prices Summary */}
        <View style={styles.priceSummaryCard}>
          <Text style={styles.priceSummaryTitle}>📊 Current Market Rates</Text>
          <Text style={styles.varietyInfo}>
            Seed Variety: <Text style={styles.varietyValue}>{marketPrices.seeds.variety}</Text>
          </Text>
          <View style={styles.priceGrid}>
            <View style={styles.priceItem}>
              <Text style={styles.priceItemLabel}>Seeds (kg)</Text>
              <Text style={styles.priceItemValue}>LKR {marketPrices.seeds.price}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceItemLabel}>Urea (kg)</Text>
              <Text style={styles.priceItemValue}>LKR {marketPrices.urea.price}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceItemLabel}>TSP (kg)</Text>
              <Text style={styles.priceItemValue}>LKR {marketPrices.tsp.price}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceItemLabel}>MOP (kg)</Text>
              <Text style={styles.priceItemValue}>LKR {marketPrices.mop.price}</Text>
            </View>
          </View>
          <Text style={styles.priceDisclaimer}>
            Source: {marketPrices.seeds.source} • Updated: {marketPrices.seeds.lastUpdated}
          </Text>
        </View>

        {/* Field Size Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Field Size</Text>
            <Text style={styles.sectionSubtitle}>Enter your field area</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={fieldSize}
              onChangeText={(value) => {
                setFieldSize(value);
                if (value && !isNaN(parseFloat(value))) {
                  calculateQuantities(value, unit, selectedSeedVariety);
                }
              }}
              keyboardType="decimal-pad"
              placeholder="Enter field size"
            />
            <TouchableOpacity
              style={styles.unitButton}
              onPress={() => {
                const newUnit = unit === 'Hectares' ? 'Acres' : 'Hectares';
                setUnit(newUnit);
                calculateQuantities(fieldSize, newUnit, selectedSeedVariety);
              }}
            >
              <Text style={styles.unitText}>{unit}</Text>
              <MaterialCommunityIcons name="swap-vertical" size={16} color="#16a34a" />
            </TouchableOpacity>
          </View>
          <Text style={styles.conversionText}>
            {unit === 'Hectares' 
              ? `1 Hectare = 2.47 Acres` 
              : `1 Acre = 0.40 Hectares`}
          </Text>
        </View>

        {/* Seed Variety Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Paddy Seed Variety</Text>
            <Text style={styles.sectionSubtitle}>
              Current: {marketPrices.seeds.variety} • Price: LKR {marketPrices.seeds.price}/kg
            </Text>
          </View>
          
          {/* Selected Variety Display */}
          <TouchableOpacity 
            style={styles.seedSelector}
            onPress={() => setShowVarietyModal(true)}
          >
            <View style={styles.selectedVarietyInfo}>
              <Text style={styles.selectedVarietyName}>{selectedSeedVariety}</Text>
              <Text style={styles.selectedVarietyDesc}>
                {seedVarieties.find(v => v.name === selectedSeedVariety)?.description}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={24} color="#16a34a" />
          </TouchableOpacity>

          {/* Quick Variety Buttons */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.varietyScroll}
          >
            {seedVarieties.map((variety) => (
              <TouchableOpacity
                key={variety.id}
                style={[
                  styles.varietyButton,
                  selectedSeedVariety === variety.name && styles.selectedVarietyButton
                ]}
                onPress={() => {
                  setSelectedSeedVariety(variety.name);
                  calculateQuantities(fieldSize, unit, variety.name);
                }}
              >
                <Text style={[
                  styles.varietyButtonText,
                  selectedSeedVariety === variety.name && styles.selectedVarietyButtonText
                ]}>
                  {variety.name}
                </Text>
                <Text style={styles.varietyRate}>{variety.ratePerHectare} kg/ha</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recommended Quantities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Inputs</Text>
            <Text style={styles.sectionSubtitle}>
              For {fieldSize} {unit} • {selectedSeedVariety}
            </Text>
          </View>

          {/* Seeds */}
          <View style={styles.itemCard}>
            <View style={styles.itemIconContainer}>
              <Text style={styles.itemIcon}>🌾</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{recommendations.seeds.name}</Text>
              <Text style={styles.itemType}>{recommendations.seeds.description}</Text>
              <PriceInfo item="seeds" priceData={marketPrices.seeds} />
            </View>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantity}>{recommendations.seeds.quantity}</Text>
              <Text style={styles.unit}>{recommendations.seeds.unit}</Text>
              <Text style={styles.itemCost}>
                LKR {recommendations.seeds.cost?.toLocaleString() || 'Calculating...'}
              </Text>
            </View>
          </View>

          {/* Fertilizers */}
          <Text style={styles.subTitle}>Fertilizers</Text>
          {recommendations.fertilizers.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemIconContainer}>
                <Text style={styles.itemIcon}>🧪</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemType}>
                  {item.name === 'Urea' ? 'Nitrogen Source' : 
                   item.name === 'TSP' ? 'Phosphorus Source' : 'Potassium Source'}
                </Text>
                <PriceInfo 
                  item={item.name.toLowerCase()} 
                  priceData={marketPrices[item.name.toLowerCase()]} 
                />
              </View>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <Text style={styles.unit}>{item.unit}</Text>
                <Text style={styles.itemCost}>
                  LKR {item.cost?.toLocaleString() || 'Calculating...'}
                </Text>
              </View>
            </View>
          ))}

          {/* Pesticides */}
          <Text style={styles.subTitle}>Pesticides</Text>
          {recommendations.pesticides.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemIconContainer}>
                <Text style={styles.itemIcon}>⚠️</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemType}>Weed Control</Text>
                <PriceInfo item="pesticide" priceData={marketPrices.pesticide} />
              </View>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <Text style={styles.unit}>{item.unit}</Text>
                <Text style={styles.itemCost}>
                  LKR {item.cost?.toLocaleString() || 'Calculating...'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total Cost */}
        <View style={styles.costContainer}>
          <Text style={styles.costLabel}>Estimated Total Cost</Text>
          <Text style={styles.costValue}>LKR {totalCost.toLocaleString()}</Text>
          <Text style={styles.costNote}>
            Based on live market prices • Variety: {selectedSeedVariety} • {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Source Info */}
        <View style={styles.sourcesContainer}>
          <Text style={styles.sourcesTitle}>💡 Price Sources</Text>
          <Text style={styles.sourceItem}>• Seeds: {marketPrices.seeds.source}</Text>
          <Text style={styles.sourceItem}>• Urea: {marketPrices.urea.source}</Text>
          <Text style={styles.sourceItem}>• TSP: {marketPrices.tsp.source}</Text>
          <Text style={styles.sourceItem}>• MOP: {marketPrices.mop.source}</Text>
          <Text style={styles.sourceItem}>• Pesticide: {marketPrices.pesticide.source}</Text>
          <TouchableOpacity 
            style={styles.updateButton}
            onPress={onRefresh}
          >
            <Text style={styles.updateButtonText}>🔄 Update Live Prices</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Variety Selection Modal */}
      {renderVarietyModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  subHeader: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#f0f9f0',
    borderRadius: 20,
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 10,
    color: '#9ca3af',
  },
  priceSummaryCard: {
    backgroundColor: '#e8f5e8',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  priceSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 12,
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priceItem: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  priceItemLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  priceDisclaimer: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  priceInfoContainer: {
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  priceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceSource: {
    fontSize: 9,
    color: '#9ca3af',
  },
  priceTime: {
    fontSize: 9,
    color: '#9ca3af',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    marginRight: 10,
    backgroundColor: '#f9fafb',
  },
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    minWidth: 90,
  },
  unitText: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '500',
    marginRight: 4,
  },
  conversionText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Seed Variety Selection Styles
  seedSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  selectedVarietyInfo: {
    flex: 1,
  },
  selectedVarietyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  selectedVarietyDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  varietyScroll: {
    marginTop: 8,
  },
  varietyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
    alignItems: 'center',
  },
  selectedVarietyButton: {
    backgroundColor: '#16a34a',
  },
  varietyButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  selectedVarietyButtonText: {
    color: 'white',
  },
  varietyRate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
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
    maxHeight: '80%',
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedVarietyItem: {
    backgroundColor: '#f0f9f0',
  },
  varietyItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  varietyItemDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  varietyItemRate: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 4,
  },
  // Item Card Styles
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f9f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  itemType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  quantityContainer: {
    alignItems: 'flex-end',
  },
  quantity: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  unit: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  itemCost: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    marginTop: 4,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  costContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  costValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
    marginVertical: 8,
  },
  costNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  sourcesContainer: {
    backgroundColor: '#f0f9ff',
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
  },
  sourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  sourceItem: {
    fontSize: 12,
    color: '#0369a1',
    marginBottom: 4,
    paddingLeft: 8,
  },
  updateButton: {
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  updateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  adminButton: {
    padding: 8,
    backgroundColor: '#f0f9f0',
    borderRadius: 20,
    marginRight: 8,
  },
  varietyInfo: {
    fontSize: 12,
    color: '#065f46',
    marginBottom: 8,
  },
  varietyValue: {
    fontWeight: 'bold',
    color: '#16a34a',
  },
});

export default InputPlannerScreen;