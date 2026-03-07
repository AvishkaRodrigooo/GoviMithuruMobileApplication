import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const ProfitabilitySimulationScreen = ({ navigation, route }) => {
  const { variety, estimatedProfit, calculatedYield } = route.params || {};
  
  // Initial costs based on your design
  const [costs, setCosts] = useState({
    seeds: '5000',
    fertilizer: '3000',
    water: '1500',
    labor: '7000',
    other: '1000',
  });

  // Yield and price assumptions
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: 'Traditional Paddy (Current)',
      yieldPerAcre: 571, // kg
      pricePerKg: 120, // LKR per kg
      color: '#16a34a',
    },
    {
      id: 2,
      name: 'Organic Paddy',
      yieldPerAcre: 450, // kg
      pricePerKg: 200, // LKR per kg (organic premium)
      color: '#f59e0b',
    },
    {
      id: 3,
      name: 'High-Yield Variety',
      yieldPerAcre: 700, // kg
      pricePerKg: 110, // LKR per kg
      color: '#3b82f6',
    },
  ]);

  const [selectedScenario, setSelectedScenario] = useState(0);

  // Calculate totals
  const calculateTotalCost = () => {
    return Object.values(costs).reduce((total, cost) => total + (parseFloat(cost) || 0), 0);
  };

  const calculateScenarioResults = (scenario) => {
    const totalCost = calculateTotalCost();
    const revenue = scenario.yieldPerAcre * scenario.pricePerKg;
    const profit = revenue - totalCost;
    const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    
    return {
      totalCost,
      revenue,
      profit,
      profitMargin,
      yield: scenario.yieldPerAcre,
    };
  };

  const handleCostChange = (key, value) => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setCosts(prev => ({
      ...prev,
      [key]: numericValue
    }));
  };

  const handleRunSimulation = () => {
    const totalCost = calculateTotalCost();
    if (totalCost === 0) {
      Alert.alert('Error', 'Please enter valid cost values');
      return;
    }
    
    Alert.alert(
      'Simulation Complete',
      `Total Cost: LKR ${totalCost.toLocaleString()}\n\nCheck the results section for detailed analysis.`,
      [{ text: 'OK' }]
    );
  };

  const addNewScenario = () => {
    Alert.prompt(
      'Add New Scenario',
      'Enter scenario name:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: (name) => {
            if (name && name.trim()) {
              const newScenario = {
                id: scenarios.length + 1,
                name: name.trim(),
                yieldPerAcre: 500,
                pricePerKg: 130,
                color: getRandomColor(),
              };
              setScenarios(prev => [...prev, newScenario]);
            }
          }
        }
      ]
    );
  };

  const getRandomColor = () => {
    const colors = ['#8b5cf6', '#ef4444', '#10b981', '#f97316', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const currentResults = calculateScenarioResults(scenarios[selectedScenario]);

  // Prepare data for charts
  const chartData = {
    labels: scenarios.map(s => s.name.split(' ')[0]),
    datasets: [
      {
        data: scenarios.map(s => {
          const results = calculateScenarioResults(s);
          return results.profit / 1000; // Convert to thousands for better display
        }),
        color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: scenarios.map(s => {
          const results = calculateScenarioResults(s);
          return results.revenue / 1000; // Convert to thousands
        }),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      }
    ],
    legend: ["Profit (Thousands LKR)", "Revenue (Thousands LKR)"]
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#f9fafb',
    backgroundGradientTo: '#f9fafb',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#16a34a'
    }
  };

  // Render cost input field
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
          value={costs[key]}
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#16a34a" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>💰 Profitability Simulation</Text>
              {variety && (
                <Text style={styles.headerSubtitle}>For: {variety}</Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => Alert.alert('Help', 'Adjust costs and compare different farming scenarios to find the most profitable option.')}
            >
              <MaterialCommunityIcons name="help-circle" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Input Costs Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="calculator" size={24} color="#16a34a" />
              <Text style={styles.cardTitle}>Input Costs (LKR)</Text>
            </View>
            
            {renderCostInput('Seeds Cost', 'seeds', 'seed')}
            {renderCostInput('Fertilizer Cost', 'fertilizer', 'flask')}
            {renderCostInput('Water Cost', 'water', 'water')}
            {renderCostInput('Labor Cost', 'labor', 'account-hard-hat')}
            {renderCostInput('Other Costs', 'other', 'dots-horizontal')}
            
            <View style={styles.totalCostContainer}>
              <Text style={styles.totalCostLabel}>Total Cost</Text>
              <Text style={styles.totalCostValue}>
                LKR {calculateTotalCost().toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.runSimulationButton}
              onPress={handleRunSimulation}
            >
              <MaterialCommunityIcons name="play-circle" size={24} color="#fff" />
              <Text style={styles.runSimulationButtonText}>Run Simulation</Text>
            </TouchableOpacity>
          </View>

          {/* Current Results */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-bar" size={24} color="#16a34a" />
              <Text style={styles.cardTitle}>
                Results for {scenarios[selectedScenario].name}
              </Text>
            </View>

            <View style={styles.resultsGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Expected Yield</Text>
                <Text style={styles.resultValue}>{currentResults.yield} kg</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Total Revenue</Text>
                <Text style={styles.resultValue}>
                  LKR {currentResults.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Total Cost</Text>
                <Text style={styles.resultValue}>
                  LKR {currentResults.totalCost.toLocaleString()}
                </Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Profit</Text>
                <Text style={[styles.resultValue, styles.profitValue]}>
                  LKR {currentResults.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.profitMarginContainer}>
              <Text style={styles.profitMarginLabel}>Profit Margin</Text>
              <Text style={styles.profitMarginValue}>
                {currentResults.profitMargin.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Scenario Comparison */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="compare" size={24} color="#16a34a" />
              <Text style={styles.cardTitle}>Scenario Comparison</Text>
              <TouchableOpacity 
                style={styles.addScenarioButton}
                onPress={addNewScenario}
              >
                <MaterialCommunityIcons name="plus-circle" size={20} color="#16a34a" />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardSubtitle}>
              Compare different paddy varieties or cultivation strategies
            </Text>

            {/* Scenario Tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.scenarioTabs}
            >
              {scenarios.map((scenario, index) => (
                <TouchableOpacity
                  key={scenario.id}
                  style={[
                    styles.scenarioTab,
                    selectedScenario === index && styles.scenarioTabActive,
                    { borderLeftColor: scenario.color }
                  ]}
                  onPress={() => setSelectedScenario(index)}
                >
                  <View style={[styles.scenarioColorDot, { backgroundColor: scenario.color }]} />
                  <Text style={[
                    styles.scenarioTabText,
                    selectedScenario === index && styles.scenarioTabTextActive
                  ]}>
                    {scenario.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Comparison Table */}
            <View style={styles.comparisonTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Metric</Text>
                {scenarios.map(scenario => (
                  <Text key={scenario.id} style={styles.tableHeaderCell}>
                    {scenario.name.split(' ')[0]}
                  </Text>
                ))}
              </View>
              
              {[
                { label: 'Yield (kg)', key: 'yieldPerAcre' },
                { label: 'Price (LKR/kg)', key: 'pricePerKg' },
                { label: 'Revenue (LKR)', key: 'revenue', calculate: true },
                { label: 'Profit (LKR)', key: 'profit', calculate: true },
              ].map((row, rowIndex) => (
                <View 
                  key={rowIndex} 
                  style={[
                    styles.tableRow,
                    rowIndex % 2 === 0 && styles.tableRowEven
                  ]}
                >
                  <Text style={styles.tableRowLabel}>{row.label}</Text>
                  {scenarios.map(scenario => {
                    let value;
                    if (row.calculate) {
                      const results = calculateScenarioResults(scenario);
                      value = row.key === 'revenue' ? results.revenue : results.profit;
                    } else {
                      value = scenario[row.key];
                    }
                    
                    return (
                      <Text key={scenario.id} style={styles.tableRowValue}>
                        {typeof value === 'number' 
                          ? row.key.includes('price') || row.key.includes('revenue') || row.key.includes('profit')
                            ? `LKR ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                            : value.toLocaleString()
                          : value
                        }
                      </Text>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Chart */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#16a34a" />
              <Text style={styles.cardTitle}>Profit & Revenue by Scenario</Text>
            </View>
            
            <LineChart
              data={chartData}
              width={screenWidth - 64} // Account for padding
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              fromZero
            />
            
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
              <Text style={styles.cardTitle}>Recommendations</Text>
            </View>
            
            <View style={styles.recommendationItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
              <Text style={styles.recommendationText}>
                <Text style={styles.highlightText}>
                  {scenarios[selectedScenario].name}
                </Text> shows the best balance of yield and profitability
              </Text>
            </View>
            
            <View style={styles.recommendationItem}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#f59e0b" />
              <Text style={styles.recommendationText}>
                Consider reducing labor costs through cooperative farming
              </Text>
            </View>
            
            <View style={styles.recommendationItem}>
              <MaterialCommunityIcons name="cash" size={20} color="#3b82f6" />
              <Text style={styles.recommendationText}>
                Expected ROI: {(currentResults.profit / currentResults.totalCost * 100).toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={() => Alert.alert('Save Report', 'Profitability report saved successfully!')}
            >
              <MaterialCommunityIcons name="download" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Save Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => Alert.alert('Share', 'Share simulation results with your farming group.')}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#16a34a' },
  headerSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  helpButton: { padding: 8 },
  card: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 12, 
    padding: 20,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 12 },
  cardSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  addScenarioButton: { marginLeft: 'auto', padding: 4 },
  inputContainer: { 
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  inputLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 14, color: '#374151', marginLeft: 8 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb'
  },
  currencySymbol: { 
    fontSize: 16, 
    color: '#6b7280', 
    marginRight: 8,
    fontWeight: '500'
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: '#111827',
    paddingVertical: 12,
    fontWeight: '500'
  },
  totalCostContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb'
  },
  totalCostLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  totalCostValue: { fontSize: 20, fontWeight: 'bold', color: '#ef4444' },
  runSimulationButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    marginTop: 20
  },
  runSimulationButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#fff',
    marginLeft: 8
  },
  resultsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 16
  },
  resultItem: { 
    width: '50%', 
    padding: 8,
    alignItems: 'center'
  },
  resultLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  resultValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  profitValue: { color: '#10b981', fontWeight: 'bold' },
  profitMarginContainer: { 
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  profitMarginLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  profitMarginValue: { fontSize: 24, fontWeight: 'bold', color: '#10b981' },
  scenarioTabs: { marginBottom: 16 },
  scenarioTab: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4
  },
  scenarioTabActive: { 
    backgroundColor: '#f0f9f0',
    borderColor: '#bbf7d0'
  },
  scenarioColorDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5,
    marginRight: 8
  },
  scenarioTabText: { fontSize: 14, color: '#6b7280' },
  scenarioTabTextActive: { fontWeight: '600', color: '#16a34a' },
  comparisonTable: { marginTop: 8 },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden'
  },
  tableHeaderCell: { 
    flex: 1, 
    padding: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center'
  },
  tableRow: { 
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  tableRowEven: { backgroundColor: '#f9fafb' },
  tableRowLabel: { 
    flex: 1, 
    padding: 12,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500'
  },
  tableRowValue: { 
    flex: 1, 
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlign: 'center'
  },
  chart: { 
    marginVertical: 8,
    borderRadius: 8,
    alignSelf: 'center'
  },
  legendContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    marginTop: 16
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginHorizontal: 12
  },
  legendColor: { 
    width: 12, 
    height: 12, 
    borderRadius: 6,
    marginRight: 8
  },
  legendText: { fontSize: 12, color: '#6b7280' },
  recommendationItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    marginBottom: 12
  },
  recommendationText: { 
    flex: 1, 
    fontSize: 14, 
    color: '#4b5563',
    marginLeft: 12,
    lineHeight: 20
  },
  highlightText: { fontWeight: '600', color: '#16a34a' },
  actionButtons: { 
    flexDirection: 'row', 
    marginHorizontal: 16, 
    marginBottom: 30,
    marginTop: 8
  },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginHorizontal: 4
  },
  saveButton: { backgroundColor: '#16a34a' },
  shareButton: { backgroundColor: '#3b82f6' },
  actionButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: 'white', 
    marginLeft: 8 
  },
});

export default ProfitabilitySimulationScreen;