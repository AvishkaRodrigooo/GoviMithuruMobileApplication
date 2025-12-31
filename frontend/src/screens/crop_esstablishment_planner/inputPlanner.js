import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const InputPlanner = () => {
  const [fieldSize, setFieldSize] = useState('1.0');
  const [unit, setUnit] = useState('Hectares');
  
  const recommendations = {
    seeds: { name: 'Seeds (BG 358)', quantity: 150, unit: 'kg' },
    fertilizer: [
      { name: 'Urea', quantity: 75, unit: 'kg' },
      { name: 'TSP', quantity: 50, unit: 'kg' },
      { name: 'MOP', quantity: 40, unit: 'kg' }
    ],
    pesticide: { name: 'Weedicide', quantity: 1.5, unit: 'L' }
  };

  const sustainablePractices = [
    {
      title: 'Water Optimization',
      description: 'Use drip irrigation or alternate wetting & drying',
      benefit: 'Saves 30-40% water',
      icon: '💧'
    },
    {
      title: 'Integrated Pest Management',
      description: 'Combine neem oil, traps, and biological control',
      benefit: 'Reduces chemicals by 30%',
      icon: '🐛'
    },
    {
      title: 'Soil Health',
      description: 'Add 500 kg compost per hectare',
      benefit: 'Improves yield by 15%',
      icon: '🌱'
    },
    {
      title: 'Precision Application',
      description: 'Test soil and apply exact nutrients needed',
      benefit: 'Reduces waste by 25%',
      icon: '🎯'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      
      {/* Header */}
      <Text style={styles.header}>Input Planner</Text>
      
      {/* Field Size Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Field Size</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={fieldSize}
            onChangeText={setFieldSize}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.unitButton}>
            <Text style={styles.unitText}>{unit}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Recommended Quantities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Quantities</Text>
        
        {/* Seeds */}
        <View style={styles.itemRow}>
          <Text style={styles.itemName}>🌾 Seeds (BG 358)</Text>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantity}>{recommendations.seeds.quantity}</Text>
            <Text style={styles.unit}>{recommendations.seeds.unit}</Text>
            <TouchableOpacity style={styles.refreshButton}>
              <Text>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Fertilizers */}
        <Text style={styles.subTitle}>Fertilizer</Text>
        {recommendations.fertilizer.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Text style={styles.unit}>{item.unit}</Text>
              <TouchableOpacity style={styles.refreshButton}>
                <Text>🔄</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {/* Pesticide */}
        <Text style={styles.subTitle}>Pesticide</Text>
        <View style={styles.itemRow}>
          <Text style={styles.itemName}>🚫 {recommendations.pesticide.name}</Text>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantity}>{recommendations.pesticide.quantity}</Text>
            <Text style={styles.unit}>{recommendations.pesticide.unit}</Text>
            <TouchableOpacity style={styles.refreshButton}>
              <Text>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Total Cost */}
      <View style={styles.costContainer}>
        <Text style={styles.costLabel}>Estimated Cost:</Text>
        <Text style={styles.costValue}>LKR 45,000</Text>
      </View>
      
      {/* Sustainable Practices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sustainable Practices</Text>
        {sustainablePractices.map((practice, index) => (
          <TouchableOpacity key={index} style={styles.practiceCard}>
            <Text style={practiceIcon}>{practice.icon}</Text>
            <View style={styles.practiceContent}>
              <Text style={styles.practiceTitle}>{practice.title}</Text>
              <Text style={styles.practiceDesc}>{practice.description}</Text>
              <Text style={styles.practiceBenefit}>Benefit: {practice.benefit}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.saveButton]}>
          <Text style={styles.buttonText}>Save Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.shareButton]}>
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buyButton]}>
          <Text style={styles.buttonText}>Buy Online</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32', marginBottom: 20 },
  section: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#333' },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 18 },
  unitButton: { marginLeft: 10, padding: 10, backgroundColor: '#e8f5e8', borderRadius: 8 },
  unitText: { fontSize: 16, color: '#2E7D32' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  itemName: { fontSize: 16, flex: 1 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  quantity: { fontSize: 18, fontWeight: 'bold', marginRight: 5 },
  unit: { fontSize: 14, color: '#666', marginRight: 10 },
  refreshButton: { padding: 5 },
  subTitle: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 5, color: '#555' },
  costContainer: { backgroundColor: '#e8f5e8', borderRadius: 10, padding: 15, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  costLabel: { fontSize: 16, color: '#333' },
  costValue: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32' },
  practiceCard: { flexDirection: 'row', backgroundColor: '#f0f9f0', borderRadius: 8, padding: 12, marginBottom: 10, alignItems: 'center' },
  practiceIcon: { fontSize: 24, marginRight: 10 },
  practiceContent: { flex: 1 },
  practiceTitle: { fontSize: 16, fontWeight: '600', color: '#2E7D32' },
  practiceDesc: { fontSize: 14, color: '#555', marginTop: 2 },
  practiceBenefit: { fontSize: 12, color: '#777', marginTop: 2, fontStyle: 'italic' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  saveButton: { backgroundColor: '#2E7D32' },
  shareButton: { backgroundColor: '#1976D2' },
  buyButton: { backgroundColor: '#FF9800' },
  buttonText: { color: 'white', fontWeight: '600' },
});

export default InputPlanner;