import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
  Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;

// Helper function to format currency
const formatCurrency = (amount) => {
  return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Helper function to format number
const formatNumber = (num) => {
  return num.toLocaleString('en-LK');
};

const ProfitabilitySimulationScreen = ({ navigation, route }) => {
  const { variety, estimatedProfit, calculatedYield } = route.params || {};
  
  // State for costs
  const [costs, setCosts] = useState({
    seeds: { value: 5000, unit: 'LKR', editable: true },
    fertilizer: { value: 3000, unit: 'LKR', editable: true },
    water: { value: 1500, unit: 'LKR', editable: true },
    labor: { value: 7000, unit: 'LKR', editable: true },
    equipment: { value: 2000, unit: 'LKR', editable: true },
    transportation: { value: 1000, unit: 'LKR', editable: true },
    other: { value: 1000, unit: 'LKR', editable: true },
  });

  // State for scenarios
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: 'Traditional Paddy',
      yieldPerAcre: 571,
      pricePerKg: 250,
      color: '#16a34a',
      description: 'Conventional farming with traditional varieties',
      waterRequirement: 'High',
      duration: '4-5 months',
    },
    {
      id: 2,
      name: 'Organic Paddy',
      yieldPerAcre: 450,
      pricePerKg: 320,
      color: '#f59e0b',
      description: 'Certified organic farming, premium price',
      waterRequirement: 'Medium',
      duration: '4-5 months',
    },
    {
      id: 3,
      name: 'High-Yield Hybrid',
      yieldPerAcre: 750,
      pricePerKg: 200,
      color: '#3b82f6',
      description: 'Modern hybrid varieties, higher yield',
      waterRequirement: 'High',
      duration: '3.5-4 months',
    },
    {
      id: 4,
      name: 'SRI Method',
      yieldPerAcre: 680,
      pricePerKg: 260,
      color: '#8b5cf6',
      description: 'System of Rice Intensification',
      waterRequirement: 'Low',
      duration: '4 months',
    },
  ]);

  const [selectedScenario, setSelectedScenario] = useState(0);
  const [fieldSize, setFieldSize] = useState(1);
  const [fieldUnit, setFieldUnit] = useState('acres'); // 'acres' or 'hectares'
  const [showAddModal, setShowAddModal] = useState(false);
  const [newScenario, setNewScenario] = useState({
    name: '',
    yieldPerAcre: 500,
    pricePerKg: 150,
    description: '',
    waterRequirement: 'Medium',
    duration: '4 months',
  });
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'
  const [includeGOVSubsidy, setIncludeGOVSubsidy] = useState(false);
  const [govSubsidyPercent, setGovSubsidyPercent] = useState(10);
  const [loanInterest, setLoanInterest] = useState(0);
  const [loanAmount, setLoanAmount] = useState(0);

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedScenarios = await AsyncStorage.getItem('profitabilityScenarios');
      if (savedScenarios) {
        setScenarios(JSON.parse(savedScenarios));
      }
      const savedCosts = await AsyncStorage.getItem('profitabilityCosts');
      if (savedCosts) {
        setCosts(JSON.parse(savedCosts));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('profitabilityScenarios', JSON.stringify(scenarios));
      await AsyncStorage.setItem('profitabilityCosts', JSON.stringify(costs));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    let total = Object.values(costs).reduce((sum, cost) => sum + (cost.value || 0), 0);
    
    // Apply government subsidy if enabled
    if (includeGOVSubsidy) {
      total = total * (1 - govSubsidyPercent / 100);
    }
    
    // Add loan interest if applicable
    if (loanAmount > 0 && loanInterest > 0) {
      total += (loanAmount * loanInterest / 100);
    }
    
    return total;
  };

  // Calculate cost per acre/hectare
  const getCostPerUnit = () => {
    const totalCost = calculateTotalCost();
    const sizeInAcres = fieldUnit === 'acres' ? fieldSize : fieldSize * 2.471;
    return totalCost / sizeInAcres;
  };

  // Calculate scenario results
  const calculateScenarioResults = (scenario) => {
    const totalCost = calculateTotalCost();
    const sizeInAcres = fieldUnit === 'acres' ? fieldSize : fieldSize * 2.471;
    const totalYield = scenario.yieldPerAcre * sizeInAcres;
    const revenue = totalYield * scenario.pricePerKg;
    const profit = revenue - totalCost;
    const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const breakEvenYield = totalCost / scenario.pricePerKg;
    const costPerKg = totalCost / totalYield;
    
    return {
      totalCost,
      revenue,
      profit,
      profitMargin,
      roi,
      totalYield,
      breakEvenYield,
      costPerKg,
      profitPerAcre: profit / sizeInAcres,
    };
  };

  // Get current results
  const currentResults = calculateScenarioResults(scenarios[selectedScenario]);

  // Handle cost change
  const handleCostChange = (key, value) => {
    const numericValue = parseFloat(value) || 0;
    setCosts(prev => ({
      ...prev,
      [key]: { ...prev[key], value: numericValue }
    }));
  };

  // Add new scenario
  const addNewScenario = () => {
    if (!newScenario.name.trim()) {
      Alert.alert('Error', 'Please enter scenario name');
      return;
    }
    
    const colors = ['#ef4444', '#10b981', '#f97316', '#06b6d4', '#ec4899', '#6366f1'];
    const newId = Math.max(...scenarios.map(s => s.id), 0) + 1;
    
    const scenarioToAdd = {
      id: newId,
      name: newScenario.name,
      yieldPerAcre: newScenario.yieldPerAcre,
      pricePerKg: newScenario.pricePerKg,
      color: colors[scenarios.length % colors.length],
      description: newScenario.description,
      waterRequirement: newScenario.waterRequirement,
      duration: newScenario.duration,
    };
    
    setScenarios(prev => [...prev, scenarioToAdd]);
    setShowAddModal(false);
    setNewScenario({
      name: '',
      yieldPerAcre: 500,
      pricePerKg: 150,
      description: '',
      waterRequirement: 'Medium',
      duration: '4 months',
    });
    saveData();
    Alert.alert('Success', 'Scenario added successfully');
  };

  // Delete scenario
  const deleteScenario = (index) => {
    if (scenarios.length <= 1) {
      Alert.alert('Cannot Delete', 'You need at least one scenario for comparison');
      return;
    }
    
    Alert.alert(
      'Delete Scenario',
      `Are you sure you want to delete "${scenarios[index].name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newScenarios = scenarios.filter((_, i) => i !== index);
            setScenarios(newScenarios);
            if (selectedScenario >= newScenarios.length) {
              setSelectedScenario(0);
            }
            saveData();
          }
        }
      ]
    );
  };

  // Edit scenario
  const editScenario = (index) => {
    const scenario = scenarios[index];
    setNewScenario({
      name: scenario.name,
      yieldPerAcre: scenario.yieldPerAcre,
      pricePerKg: scenario.pricePerKg,
      description: scenario.description,
      waterRequirement: scenario.waterRequirement,
      duration: scenario.duration,
    });
    setShowAddModal(true);
    // We'll handle edit in the modal submission
  };

  // Share results
  const shareResults = async () => {
    const bestScenario = scenarios.reduce((best, scenario, idx) => {
      const results = calculateScenarioResults(scenario);
      return results.profit > calculateScenarioResults(best).profit ? scenario : best;
    }, scenarios[0]);
    
    const message = `
🌾 *PROFITABILITY ANALYSIS REPORT* 🌾

📊 *Farm Details:*
• Field Size: ${fieldSize} ${fieldUnit}
• Total Cost: ${formatCurrency(calculateTotalCost())}
• Cost per Unit: ${formatCurrency(getCostPerUnit())}

📈 *Scenario Comparison:*
${scenarios.map((scenario, idx) => {
  const results = calculateScenarioResults(scenario);
  return `
${idx + 1}. *${scenario.name}*
   • Yield: ${formatNumber(results.totalYield)} kg
   • Revenue: ${formatCurrency(results.revenue)}
   • Profit: ${formatCurrency(results.profit)}
   • ROI: ${results.roi.toFixed(1)}%
`;
}).join('')}

🏆 *Best Performing Scenario:*
• ${bestScenario.name}
• Profit: ${formatCurrency(calculateScenarioResults(bestScenario).profit)}
• ROI: ${calculateScenarioResults(bestScenario).roi.toFixed(1)}%

💡 *Recommendations:*
${currentResults.profit > 0 ? '✓ Profitable venture with good returns' : '⚠️ Currently not profitable - consider cost reduction'}
• Consider government subsidies available
• Explore cooperative farming for cost reduction

Generated by AgroMind App - Smart Farming Assistant
    `;
    
    try {
      await Share.share({
        message: message,
        title: 'Profitability Analysis Report',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };

  // Generate PDF report
  const generatePDF = async () => {
    const bestScenario = scenarios.reduce((best, scenario, idx) => {
      const results = calculateScenarioResults(scenario);
      return results.profit > calculateScenarioResults(best).profit ? scenario : best;
    }, scenarios[0]);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Profitability Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          h1 { color: #16a34a; text-align: center; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section-title { background: #f0fdf4; padding: 10px; border-left: 4px solid #16a34a; margin-bottom: 15px; }
          .metric { display: inline-block; width: 45%; margin: 5px; padding: 10px; background: #f9fafb; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background: #f3f4f6; }
          .profit-positive { color: #10b981; }
          .profit-negative { color: #ef4444; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌾 Profitability Analysis Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString('en-LK')}</p>
          ${variety ? `<p>Variety: ${variety}</p>` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">📊 Farm Summary</div>
          <div class="metric"><strong>Field Size:</strong> ${fieldSize} ${fieldUnit}</div>
          <div class="metric"><strong>Total Cost:</strong> ${formatCurrency(calculateTotalCost())}</div>
          <div class="metric"><strong>Cost per Unit:</strong> ${formatCurrency(getCostPerUnit())}</div>
          <div class="metric"><strong>Govt Subsidy:</strong> ${includeGOVSubsidy ? govSubsidyPercent + '%' : 'Not applied'}</div>
        </div>
        
        <div class="section">
          <div class="section-title">💰 Cost Breakdown</div>
          <table>
            <tr><th>Category</th><th>Amount (LKR)</th></tr>
            ${Object.entries(costs).map(([key, cost]) => `
              <tr><td>${key.charAt(0).toUpperCase() + key.slice(1)}</td><td>${formatCurrency(cost.value)}</td></tr>
            `).join('')}
          </table>
        </div>
        
        <div class="section">
          <div class="section-title">📈 Scenario Comparison</div>
          <table>
            <tr>
              <th>Scenario</th>
              <th>Yield (kg)</th>
              <th>Revenue (LKR)</th>
              <th>Profit (LKR)</th>
              <th>ROI</th>
            </tr>
            ${scenarios.map(scenario => {
              const results = calculateScenarioResults(scenario);
              return `
                <tr>
                  <td>${scenario.name}</td>
                  <td>${formatNumber(results.totalYield)}</td>
                  <td>${formatCurrency(results.revenue)}</td>
                  <td class="${results.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(results.profit)}</td>
                  <td>${results.roi.toFixed(1)}%</td>
                </tr>
              `;
            }).join('')}
          </table>
        </div>
        
        <div class="section">
          <div class="section-title">🏆 Best Performing Scenario</div>
          <p><strong>${bestScenario.name}</strong></p>
          <p>${bestScenario.description || 'No description available'}</p>
          <p>• Expected Profit: ${formatCurrency(calculateScenarioResults(bestScenario).profit)}</p>
          <p>• ROI: ${calculateScenarioResults(bestScenario).roi.toFixed(1)}%</p>
        </div>
        
        <div class="footer">
          <p>Generated by AgroMind App - Smart Farming Assistant</p>
          <p>For more information, consult local agriculture experts</p>
        </div>
      </body>
      </html>
    `;
    
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    const labels = scenarios.map(s => s.name.split(' ')[0]);
    const profitData = scenarios.map(s => calculateScenarioResults(s).profit);
    const revenueData = scenarios.map(s => calculateScenarioResults(s).revenue);
    const roiData = scenarios.map(s => s.calculateScenarioResults?.roi || calculateScenarioResults(s).roi);
    
    if (chartType === 'bar') {
      return {
        labels: labels,
        datasets: [
          {
            data: profitData,
            color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
          },
          {
            data: revenueData,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          }
        ],
        legend: ["Profit (LKR)", "Revenue (LKR)"]
      };
    }
    
    return {
      labels: labels,
      datasets: [
        {
          data: profitData,
          color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: revenueData,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2,
        }
      ],
      legend: ["Profit (LKR)", "Revenue (LKR)"]
    };
  };

  const chartData = prepareChartData();
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#f9fafb',
    backgroundGradientTo: '#f9fafb',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: '#16a34a' },
    formatYLabel: (value) => `LKR ${Math.round(value / 1000)}K`,
  };

  // Render cost input
  const renderCostInput = (label, key, icon) => (
    <View key={key} style={styles.inputContainer}>
      <View style={styles.inputLabelContainer}>
        <MaterialCommunityIcons name={icon} size={20} color="#6b7280" />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <View style={styles.inputWrapper}>
        <Text style={styles.currencySymbol}>LKR</Text>
        <TextInput
          style={styles.input}
          value={costs[key]?.value?.toString() || '0'}
          onChangeText={(value) => handleCostChange(key, value)}
          keyboardType="numeric"
          placeholder="0"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#16a34a" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>💰 Profitability Simulator</Text>
              {variety && <Text style={styles.headerSubtitle}>For: {variety}</Text>}
            </View>
            <TouchableOpacity style={styles.helpButton} onPress={() => Alert.alert(
              'Help',
              'Adjust input costs and compare different farming scenarios.\n\n' +
              '• Costs: Enter your actual expenses\n' +
              '• Scenarios: Compare different varieties/methods\n' +
              '• ROI: Return on Investment percentage\n' +
              '• Break-even: Minimum yield needed to cover costs'
            )}>
              <MaterialCommunityIcons name="help-circle" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Field Size Input */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="ruler-square" size={24} color="#16a34a" />
              <Text style={styles.cardTitle}>Field Information</Text>
            </View>
            <View style={styles.fieldSizeContainer}>
              <TextInput
                style={styles.fieldSizeInput}
                value={fieldSize.toString()}
                onChangeText={(value) => setFieldSize(parseFloat(value) || 0)}
                keyboardType="decimal-pad"
                placeholder="Enter size"
              />
              <View style={styles.unitSelector}>
                <TouchableOpacity
                  style={[styles.unitButton, fieldUnit === 'acres' && styles.unitButtonActive]}
                  onPress={() => setFieldUnit('acres')}
                >
                  <Text style={[styles.unitText, fieldUnit === 'acres' && styles.unitTextActive]}>Acres</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, fieldUnit === 'hectares' && styles.unitButtonActive]}
                  onPress={() => setFieldUnit('hectares')}
                >
                  <Text style={[styles.unitText, fieldUnit === 'hectares' && styles.unitTextActive]}>Hectares</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Input Costs Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="calculator" size={24} color="#16a34a" />
              <Text style={styles.cardTitle}>Input Costs (LKR)</Text>
            </View>
            
            {renderCostInput('Seeds Cost', 'seeds', 'seed')}
            {renderCostInput('Fertilizer Cost', 'fertilizer', 'flask')}
            {renderCostInput('Water/Irrigation', 'water', 'water')}
            {renderCostInput('Labor Cost', 'labor', 'account-hard-hat')}
            {renderCostInput('Equipment Rental', 'equipment', 'tractor')}
            {renderCostInput('Transportation', 'transportation', 'truck')}
            {renderCostInput('Other Costs', 'other', 'dots-horizontal')}
            
            {/* Government Subsidy Toggle */}
            <View style={styles.subsidyContainer}>
              <View style={styles.subsidyRow}>
                <View style={styles.subsidyInfo}>
                  <MaterialCommunityIcons name="bank" size={20} color="#16a34a" />
                  <Text style={styles.subsidyLabel}>Government Subsidy</Text>
                </View>
                <Switch
                  value={includeGOVSubsidy}
                  onValueChange={setIncludeGOVSubsidy}
                  trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
                  thumbColor={includeGOVSubsidy ? '#16a34a' : '#f3f4f6'}
                />
              </View>
              {includeGOVSubsidy && (
                <View style={styles.subsidyPercentContainer}>
                  <Text style={styles.subsidyPercentLabel}>Subsidy Percentage</Text>
                  <TextInput
                    style={styles.subsidyPercentInput}
                    value={govSubsidyPercent.toString()}
                    onChangeText={(value) => setGovSubsidyPercent(parseFloat(value) || 0)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              )}
            </View>
            
            <View style={styles.totalCostContainer}>
              <Text style={styles.totalCostLabel}>Total Investment</Text>
              <Text style={styles.totalCostValue}>{formatCurrency(calculateTotalCost())}</Text>
            </View>
            
            <View style={styles.costPerUnitContainer}>
              <Text style={styles.costPerUnitLabel}>Cost per {fieldUnit === 'acres' ? 'Acre' : 'Hectare'}</Text>
              <Text style={styles.costPerUnitValue}>{formatCurrency(getCostPerUnit())}</Text>
            </View>
          </View>

          {/* Scenario Comparison */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="compare" size={24} color="#16a34a" />
              <Text style={styles.cardTitle}>Farming Scenarios</Text>
              <TouchableOpacity style={styles.addScenarioButton} onPress={() => setShowAddModal(true)}>
                <MaterialCommunityIcons name="plus-circle" size={24} color="#16a34a" />
              </TouchableOpacity>
            </View>
            
            {/* Scenario Cards */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenarioCards}>
              {scenarios.map((scenario, index) => {
                const results = calculateScenarioResults(scenario);
                const isSelected = selectedScenario === index;
                return (
                  <TouchableOpacity
                    key={scenario.id}
                    style={[
                      styles.scenarioCard,
                      isSelected && styles.scenarioCardActive,
                      { borderTopColor: scenario.color }
                    ]}
                    onPress={() => setSelectedScenario(index)}
                    onLongPress={() => editScenario(index)}
                  >
                    <View style={styles.scenarioCardHeader}>
                      <View style={[styles.scenarioColorDot, { backgroundColor: scenario.color }]} />
                      <Text style={styles.scenarioCardName}>{scenario.name}</Text>
                      <TouchableOpacity onPress={() => deleteScenario(index)}>
                        <MaterialCommunityIcons name="close" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.scenarioYield}>{formatNumber(results.totalYield)} kg</Text>
                    <Text style={[styles.scenarioProfit, results.profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
                      {formatCurrency(results.profit)}
                    </Text>
                    <Text style={styles.scenarioROI}>ROI: {results.roi.toFixed(1)}%</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {/* Current Scenario Details */}
            <View style={styles.currentScenarioDetails}>
              <Text style={styles.detailTitle}>📊 {scenarios[selectedScenario].name} - Detailed Analysis</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Expected Yield</Text>
                  <Text style={styles.detailValue}>{formatNumber(currentResults.totalYield)} kg</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Price per kg</Text>
                  <Text style={styles.detailValue}>LKR {scenarios[selectedScenario].pricePerKg}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Revenue</Text>
                  <Text style={styles.detailValue}>{formatCurrency(currentResults.revenue)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Cost</Text>
                  <Text style={styles.detailValue}>{formatCurrency(currentResults.totalCost)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Net Profit</Text>
                  <Text style={[styles.detailValue, currentResults.profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
                    {formatCurrency(currentResults.profit)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Profit per {fieldUnit === 'acres' ? 'Acre' : 'Hectare'}</Text>
                  <Text style={styles.detailValue}>{formatCurrency(currentResults.profitPerAcre)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ROI</Text>
                  <Text style={styles.detailValue}>{currentResults.roi.toFixed(1)}%</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Break-even Yield</Text>
                  <Text style={styles.detailValue}>{formatNumber(currentResults.breakEvenYield)} kg</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Cost per kg</Text>
                  <Text style={styles.detailValue}>LKR {currentResults.costPerKg.toFixed(2)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Profit Margin</Text>
                  <Text style={styles.detailValue}>{currentResults.profitMargin.toFixed(1)}%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Chart Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#16a34a" />
              <Text style={styles.cardTitle}>Visual Comparison</Text>
              <View style={styles.chartTypeSelector}>
                <TouchableOpacity
                  style={[styles.chartTypeButton, chartType === 'line' && styles.chartTypeActive]}
                  onPress={() => setChartType('line')}
                >
                  <MaterialCommunityIcons name="chart-line" size={20} color={chartType === 'line' ? '#16a34a' : '#6b7280'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chartTypeButton, chartType === 'bar' && styles.chartTypeActive]}
                  onPress={() => setChartType('bar')}
                >
                  <MaterialCommunityIcons name="chart-bar" size={20} color={chartType === 'bar' ? '#16a34a' : '#6b7280'} />
                </TouchableOpacity>
              </View>
            </View>
            
            {chartType === 'line' ? (
              <LineChart
                data={chartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                fromZero
              />
            ) : (
              <BarChart
                data={chartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero
                showValuesOnTopOfBars={true}
              />
            )}
            
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#16a34a' }]} />
                <Text style={styles.legendText}>Profit</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>Revenue</Text>
              </View>
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={24} color="#f59e0b" />
              <Text style={styles.cardTitle}>Smart Recommendations</Text>
            </View>
            
            {(() => {
              const bestScenario = scenarios.reduce((best, scenario) => {
                return calculateScenarioResults(scenario).profit > calculateScenarioResults(best).profit ? scenario : best;
              });
              const bestResults = calculateScenarioResults(bestScenario);
              
              return (
                <>
                  <View style={styles.recommendationItem}>
                    <MaterialCommunityIcons name="trophy" size={20} color="#f59e0b" />
                    <Text style={styles.recommendationText}>
                      <Text style={styles.highlightText}>{bestScenario.name}</Text> shows the highest profit potential
                    </Text>
                  </View>
                  
                  {bestResults.roi > 30 && (
                    <View style={styles.recommendationItem}>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                      <Text style={styles.recommendationText}>
                        Excellent ROI of {bestResults.roi.toFixed(1)}% - Highly recommended
                      </Text>
                    </View>
                  )}
                  
                  {includeGOVSubsidy && (
                    <View style={styles.recommendationItem}>
                      <MaterialCommunityIcons name="bank" size={20} color="#16a34a" />
                      <Text style={styles.recommendationText}>
                        Government subsidy of {govSubsidyPercent}% reduces your investment by {formatCurrency(calculateTotalCost() * govSubsidyPercent / 100)}
                      </Text>
                    </View>
                  )}
                  
                  {fieldSize > 2 && (
                    <View style={styles.recommendationItem}>
                      <MaterialCommunityIcons name="tractor" size={20} color="#3b82f6" />
                      <Text style={styles.recommendationText}>
                        Large field detected - Consider mechanization for cost efficiency
                      </Text>
                    </View>
                  )}
                  
                  {currentResults.costPerKg > scenarios[selectedScenario].pricePerKg && (
                    <View style={styles.recommendationItem}>
                      <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
                      <Text style={styles.recommendationText}>
                        Warning: Production cost exceeds selling price. Review cost structure.
                      </Text>
                    </View>
                  )}
                </>
              );
            })()}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={generatePDF}>
              <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>PDF Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={shareResults}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add/Edit Scenario Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Scenario</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <Text style={styles.modalLabel}>Scenario Name</Text>
              <TextInput                style={styles.modalInput}
                placeholder="e.g., Organic Bg 300"
                value={newScenario.name}
                onChangeText={(text) => setNewScenario({ ...newScenario, name: text })}
              />
              
              <Text style={styles.modalLabel}>Yield per {fieldUnit === 'acres' ? 'Acre' : 'Hectare'} (kg)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 600"
                keyboardType="numeric"
                value={newScenario.yieldPerAcre.toString()}
                onChangeText={(text) => setNewScenario({ ...newScenario, yieldPerAcre: parseFloat(text) || 0 })}
              />
              
              <Text style={styles.modalLabel}>Price per kg (LKR)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 250"
                keyboardType="numeric"
                value={newScenario.pricePerKg.toString()}
                onChangeText={(text) => setNewScenario({ ...newScenario, pricePerKg: parseFloat(text) || 0 })}
              />
              
              <Text style={styles.modalLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Describe this farming method..."
                multiline
                numberOfLines={3}
                value={newScenario.description}
                onChangeText={(text) => setNewScenario({ ...newScenario, description: text })}
              />
              
              <Text style={styles.modalLabel}>Water Requirement</Text>
              <View style={styles.modalOptions}>
                {['Low', 'Medium', 'High'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, newScenario.waterRequirement === option && styles.modalOptionActive]}
                    onPress={() => setNewScenario({ ...newScenario, waterRequirement: option })}
                  >
                    <Text style={[styles.modalOptionText, newScenario.waterRequirement === option && styles.modalOptionTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={addNewScenario}
              >
                <Text style={styles.modalSaveText}>Add Scenario</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  
  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  backButton: { padding: 8 },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  helpButton: { padding: 8 },
  
  // Cards
  card: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 16, 
    padding: 20,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 12, flex: 1 },
  
  // Field Size
  fieldSizeContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fieldSizeInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 10, 
    padding: 12, 
    fontSize: 16,
    backgroundColor: '#f9fafb'
  },
  unitSelector: { flexDirection: 'row', gap: 8 },
  unitButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f3f4f6' },
  unitButtonActive: { backgroundColor: '#16a34a' },
  unitText: { fontSize: 14, color: '#374151' },
  unitTextActive: { color: 'white' },
  
  // Cost Inputs
  inputContainer: { marginBottom: 16 },
  inputLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 14, color: '#374151', marginLeft: 8, fontWeight: '500' },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb'
  },
  currencySymbol: { fontSize: 16, color: '#6b7280', marginRight: 8, fontWeight: '500' },
  input: { flex: 1, fontSize: 16, color: '#111827', paddingVertical: 12, fontWeight: '500' },
  
  // Subsidy
  subsidyContainer: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  subsidyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subsidyInfo: { flexDirection: 'row', alignItems: 'center' },
  subsidyLabel: { fontSize: 14, marginLeft: 8, color: '#374151' },
  subsidyPercentContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  subsidyPercentLabel: { fontSize: 13, color: '#6b7280', flex: 1 },
  subsidyPercentInput: { 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    padding: 8, 
    width: 60, 
    textAlign: 'center',
    fontSize: 14
  },
  percentSymbol: { fontSize: 14, color: '#6b7280' },
  
  // Total Cost
  totalCostContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb'
  },
  totalCostLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  totalCostValue: { fontSize: 20, fontWeight: 'bold', color: '#ef4444' },
  costPerUnitContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8
  },
  costPerUnitLabel: { fontSize: 14, color: '#6b7280' },
  costPerUnitValue: { fontSize: 16, fontWeight: '600', color: '#16a34a' },
  
  // Scenario Cards
  scenarioCards: { flexDirection: 'row', marginBottom: 16 },
  scenarioCard: { 
    width: 140, 
    padding: 12, 
    backgroundColor: '#f9fafb', 
    borderRadius: 12, 
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopWidth: 4
  },
  scenarioCardActive: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  scenarioCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  scenarioColorDot: { width: 10, height: 10, borderRadius: 5 },
  scenarioCardName: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1, marginLeft: 6 },
  scenarioYield: { fontSize: 16, fontWeight: 'bold', color: '#16a34a', marginBottom: 4 },
  scenarioProfit: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  profitPositive: { color: '#10b981' },
  profitNegative: { color: '#ef4444' },
  scenarioROI: { fontSize: 11, color: '#6b7280' },
  
  // Current Scenario Details
  currentScenarioDetails: { marginTop: 8 },
  detailTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  detailItem: { width: '50%', padding: 8 },
  detailLabel: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  
  // Chart
  chartTypeSelector: { flexDirection: 'row', gap: 8 },
  chartTypeButton: { padding: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
  chartTypeActive: { backgroundColor: '#dcfce7' },
  chart: { marginVertical: 8, borderRadius: 16, alignSelf: 'center' },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 12, color: '#6b7280' },
  
  // Recommendations
  recommendationItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  recommendationText: { flex: 1, fontSize: 14, color: '#4b5563', marginLeft: 12, lineHeight: 20 },
  highlightText: { fontWeight: '600', color: '#16a34a' },
  
  // Action Buttons
  actionButtons: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 30, gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12 },
  saveButton: { backgroundColor: '#16a34a' },
  shareButton: { backgroundColor: '#3b82f6' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: 'white', marginLeft: 8 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 20, width: screenWidth - 40, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#f9fafb' },
  modalTextArea: { height: 80, textAlignVertical: 'top' },
  modalOptions: { flexDirection: 'row', gap: 12 },
  modalOption: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#f3f4f6' },
  modalOptionActive: { backgroundColor: '#16a34a' },
  modalOptionText: { fontSize: 13, color: '#374151' },
  modalOptionTextActive: { color: 'white' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalCancelButton: { backgroundColor: '#f3f4f6' },
  modalSaveButton: { backgroundColor: '#16a34a' },
  modalCancelText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  modalSaveText: { fontSize: 14, fontWeight: '500', color: 'white' },
});

export default ProfitabilitySimulationScreen;