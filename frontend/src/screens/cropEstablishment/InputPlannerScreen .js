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
  Share,
} from 'react-native';

const InputPlannerScreen = ({ navigation }) => {
  // State variables
  const [fieldSize, setFieldSize] = useState('1.0');
  const [unit, setUnit] = useState('Hectares');
  const [recommendations, setRecommendations] = useState({
    seeds: { name: 'Seeds (BG 358)', quantity: 150, unit: 'kg', costPerUnit: 100 },
    fertilizers: [
      { name: 'Urea', quantity: 75, unit: 'kg', costPerUnit: 100 },
      { name: 'TSP', quantity: 50, unit: 'kg', costPerUnit: 100 },
      { name: 'MOP', quantity: 40, unit: 'kg', costPerUnit: 100 },
    ],
    pesticides: [
      { name: 'Weedicide', quantity: 1.5, unit: 'L', costPerUnit: 2000 },
    ],
  });

  // Base rates per hectare (for dynamic calculation)
  const baseRatesPerHectare = {
    seeds: 150, // kg
    urea: 75,   // kg
    tsp: 50,    // kg
    mop: 40,    // kg
    pesticide: 1.5, // L
  };

  // Sustainable practices data
  const sustainablePractices = [
    {
      title: 'Water Optimization',
      description: 'Use drip irrigation or alternate wetting & drying',
      benefit: 'Saves 30-40% water',
      icon: '💧',
      details: 'Water deeply but infrequently to encourage deep root growth.',
    },
    {
      title: 'Integrated Pest Management',
      description: 'Combine neem oil, traps, and biological control',
      benefit: 'Reduces chemicals by 30%',
      icon: '🐛',
      details: 'Use neem oil spray every 15 days as preventive measure.',
    },
    {
      title: 'Soil Health',
      description: 'Add 500 kg compost per hectare',
      benefit: 'Improves yield by 15%',
      icon: '🌱',
      details: 'Mix compost during land preparation for better soil structure.',
    },
    {
      title: 'Precision Application',
      description: 'Test soil and apply exact nutrients needed',
      benefit: 'Reduces waste by 25%',
      icon: '🎯',
      details: 'Get soil tested every season before applying fertilizers.',
    },
  ];

  // 1. DYNAMIC CALCULATION FUNCTION
  const calculateQuantities = (size, currentUnit) => {
    let sizeInHectares = parseFloat(size);
    
    // Convert to hectares if needed
    if (currentUnit === 'Acres') {
      sizeInHectares = sizeInHectares * 0.404686; // 1 acre = 0.404686 hectares
    }

    // Calculate new quantities based on field size
    const newSeedsQuantity = Math.round(sizeInHectares * baseRatesPerHectare.seeds);
    const newUreaQuantity = Math.round(sizeInHectares * baseRatesPerHectare.urea);
    const newTSPQuantity = Math.round(sizeInHectares * baseRatesPerHectare.tsp);
    const newMOPQuantity = Math.round(sizeInHectares * baseRatesPerHectare.mop);
    const newPesticideQuantity = (sizeInHectares * baseRatesPerHectare.pesticide).toFixed(1);

    // Update recommendations state
    setRecommendations({
      seeds: { 
        ...recommendations.seeds, 
        quantity: newSeedsQuantity,
        cost: newSeedsQuantity * recommendations.seeds.costPerUnit
      },
      fertilizers: [
        { 
          ...recommendations.fertilizers[0], 
          quantity: newUreaQuantity,
          cost: newUreaQuantity * recommendations.fertilizers[0].costPerUnit
        },
        { 
          ...recommendations.fertilizers[1], 
          quantity: newTSPQuantity,
          cost: newTSPQuantity * recommendations.fertilizers[1].costPerUnit
        },
        { 
          ...recommendations.fertilizers[2], 
          quantity: newMOPQuantity,
          cost: newMOPQuantity * recommendations.fertilizers[2].costPerUnit
        },
      ],
      pesticides: [
        { 
          ...recommendations.pesticides[0], 
          quantity: parseFloat(newPesticideQuantity),
          cost: parseFloat(newPesticideQuantity) * recommendations.pesticides[0].costPerUnit
        },
      ],
    });
  };

  // 2. UNIT CONVERSION FUNCTION
  const toggleUnit = () => {
    const newUnit = unit === 'Hectares' ? 'Acres' : 'Hectares';
    setUnit(newUnit);
    
    // Convert field size
    let newSize = parseFloat(fieldSize);
    if (unit === 'Hectares') {
      // Converting from Hectares to Acres
      newSize = (newSize / 0.404686).toFixed(2);
    } else {
      // Converting from Acres to Hectares
      newSize = (newSize * 0.404686).toFixed(2);
    }
    
    setFieldSize(newSize.toString());
    calculateQuantities(newSize, newUnit);
  };

  // 3. CALCULATE TOTAL COST
  const calculateTotalCost = () => {
    const seedsCost = recommendations.seeds.cost || 
                     recommendations.seeds.quantity * recommendations.seeds.costPerUnit;
    
    const fertilizersCost = recommendations.fertilizers.reduce(
      (sum, fert) => sum + (fert.cost || fert.quantity * fert.costPerUnit),
      0
    );
    
    const pesticidesCost = recommendations.pesticides.reduce(
      (sum, pest) => sum + (pest.cost || pest.quantity * pest.costPerUnit),
      0
    );
    
    return seedsCost + fertilizersCost + pesticidesCost;
  };

  // 4. HANDLE FIELD SIZE CHANGE
  const handleFieldSizeChange = (value) => {
    // Only allow numbers and one decimal point
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === '') {
      setFieldSize(value);
      
      // Recalculate when user finishes typing
      if (value && !isNaN(parseFloat(value))) {
        calculateQuantities(value, unit);
      }
    }
  };

  // 5. SAVE PLAN FUNCTION
  const handleSavePlan = () => {
    const planData = {
      date: new Date().toLocaleDateString(),
      fieldSize: `${fieldSize} ${unit}`,
      recommendations: recommendations,
      totalCost: calculateTotalCost(),
    };
    
    // In a real app, save to AsyncStorage or backend
    Alert.alert('Success', 'Your input plan has been saved!', [
      { text: 'OK', style: 'default' },
      { text: 'Share Plan', onPress: handleSharePlan },
    ]);
  };

  // 6. SHARE PLAN FUNCTION
  const handleSharePlan = async () => {
    try {
      const shareText = `🌾 My Paddy Input Plan 🌾\n\n` +
        `Field Size: ${fieldSize} ${unit}\n\n` +
        `📦 RECOMMENDED INPUTS:\n` +
        `• ${recommendations.seeds.name}: ${recommendations.seeds.quantity} ${recommendations.seeds.unit}\n` +
        `• Urea: ${recommendations.fertilizers[0].quantity} ${recommendations.fertilizers[0].unit}\n` +
        `• TSP: ${recommendations.fertilizers[1].quantity} ${recommendations.fertilizers[1].unit}\n` +
        `• MOP: ${recommendations.fertilizers[2].quantity} ${recommendations.fertilizers[2].unit}\n` +
        `• Weedicide: ${recommendations.pesticides[0].quantity} ${recommendations.pesticides[0].unit}\n\n` +
        `💰 Estimated Cost: LKR ${calculateTotalCost().toLocaleString()}\n\n` +
        `Generated by GoviMithuru App`;
      
      await Share.share({
        message: shareText,
        title: 'My Paddy Input Plan',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share plan: ' + error.message);
    }
  };

  // 7. BUY ONLINE FUNCTION
  const handleBuyOnline = () => {
    const buyList = {
      seeds: `${recommendations.seeds.quantity} kg ${recommendations.seeds.name}`,
      fertilizers: recommendations.fertilizers.map(f => `${f.quantity} kg ${f.name}`).join(', '),
      pesticides: recommendations.pesticides.map(p => `${p.quantity} ${p.unit} ${p.name}`).join(', '),
    };
    
    Alert.alert(
      'Online Purchase',
      `Redirecting to partner stores with:\n\n` +
      `${buyList.seeds}\n` +
      `${buyList.fertilizers}\n` +
      `${buyList.pesticides}\n\n` +
      `Total: LKR ${calculateTotalCost().toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {
          // In a real app, open webview with partner store
          Alert.alert('Redirecting', 'Online store integration coming soon!');
        }},
      ]
    );
  };

  // 8. PRACTICE DETAILS FUNCTION
  const showPracticeDetails = (practice) => {
    Alert.alert(
      practice.title,
      `${practice.description}\n\n${practice.details}\n\nBenefit: ${practice.benefit}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  // 9. RESET TO DEFAULT FUNCTION
  const handleReset = () => {
    Alert.alert(
      'Reset Plan',
      'Reset all values to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            setFieldSize('1.0');
            setUnit('Hectares');
            calculateQuantities('1.0', 'Hectares');
          }
        },
      ]
    );
  };

  // Initialize on component mount
  useEffect(() => {
    calculateQuantities(fieldSize, unit);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>🌾 Input Planner</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
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
              onChangeText={handleFieldSizeChange}
              keyboardType="decimal-pad"
              placeholder="Enter field size"
            />
            <TouchableOpacity
              style={styles.unitButton}
              onPress={toggleUnit}
            >
              <Text style={styles.unitText}>{unit}</Text>
              <Text style={styles.unitArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.conversionText}>
            {unit === 'Hectares' 
              ? `1 Hectare = 2.47 Acres` 
              : `1 Acre = 0.40 Hectares`}
          </Text>
        </View>

        {/* Recommended Quantities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Quantities</Text>
            <Text style={styles.sectionSubtitle}>For {fieldSize} {unit}</Text>
          </View>

          {/* Seeds */}
          <View style={styles.itemCard}>
            <View style={styles.itemIconContainer}>
              <Text style={styles.itemIcon}>🌾</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{recommendations.seeds.name}</Text>
              <Text style={styles.itemType}>Certified Seeds</Text>
            </View>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantity}>{recommendations.seeds.quantity}</Text>
              <Text style={styles.unit}>{recommendations.seeds.unit}</Text>
              <Text style={styles.itemCost}>
                LKR {(recommendations.seeds.cost || recommendations.seeds.quantity * recommendations.seeds.costPerUnit).toLocaleString()}
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
              </View>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <Text style={styles.unit}>{item.unit}</Text>
                <Text style={styles.itemCost}>
                  LKR {(item.cost || item.quantity * item.costPerUnit).toLocaleString()}
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
              </View>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <Text style={styles.unit}>{item.unit}</Text>
                <Text style={styles.itemCost}>
                  LKR {(item.cost || item.quantity * item.costPerUnit).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total Cost */}
        <View style={styles.costContainer}>
          <Text style={styles.costLabel}>Estimated Cost</Text>
          <Text style={styles.costValue}>LKR {calculateTotalCost().toLocaleString()}</Text>
          <Text style={styles.costNote}>Based on current market prices</Text>
        </View>

        {/* Sustainable Practices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sustainable Practices</Text>
            <Text style={styles.sectionSubtitle}>Eco-friendly recommendations</Text>
          </View>
          {sustainablePractices.map((practice, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.practiceCard}
              onPress={() => showPracticeDetails(practice)}
            >
              <Text style={styles.practiceIcon}>{practice.icon}</Text>
              <View style={styles.practiceContent}>
                <Text style={styles.practiceTitle}>{practice.title}</Text>
                <Text style={styles.practiceDesc}>{practice.description}</Text>
                <View style={styles.benefitBadge}>
                  <Text style={styles.benefitText}>{practice.benefit}</Text>
                </View>
              </View>
              <Text style={styles.detailArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={handleSavePlan}
          >
            <Text style={styles.buttonIcon}>💾</Text>
            <Text style={styles.buttonText}>Save Plan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.shareButton]} 
            onPress={handleSharePlan}
          >
            <Text style={styles.buttonIcon}>📤</Text>
            <Text style={styles.buttonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.buyButton]} 
            onPress={handleBuyOnline}
          >
            <Text style={styles.buttonIcon}>🛒</Text>
            <Text style={styles.buttonText}>Buy</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
          <Text style={styles.tip}>• Buy inputs in bulk for better prices</Text>
          <Text style={styles.tip}>• Store seeds in cool, dry place</Text>
          <Text style={styles.tip}>• Check expiry dates on pesticides</Text>
          <Text style={styles.tip}>• Consider organic alternatives</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  resetText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
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
  unitArrow: {
    fontSize: 10,
    color: '#16a34a',
  },
  conversionText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
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
  practiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  practiceIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  practiceContent: {
    flex: 1,
  },
  practiceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  practiceDesc: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 2,
  },
  benefitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  benefitText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '500',
  },
  detailArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: '#16a34a',
  },
  shareButton: {
    backgroundColor: '#3b82f6',
  },
  buyButton: {
    backgroundColor: '#ea580c',
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  tipsContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 30,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  tip: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 4,
    paddingLeft: 8,
  },
});

export default InputPlannerScreen;