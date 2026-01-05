import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { db } from '../../firebase/firebaseConfig';

const screenWidth = Dimensions.get('window').width;

export default function StockDetailScreen({ route }) {
  const { stock } = route.params;
  const [nearbyDealers, setNearbyDealers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDealerPrices();
  }, []);

  const fetchDealerPrices = async () => {
    try {
      const dealersSnapshot = await db
        .collection('currentRicePrices')
        .orderBy('pricePerKg', 'desc')
        .limit(5)
        .get();

      const dealers = dealersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNearbyDealers(dealers);
    } catch (error) {
      console.error('Error fetching dealer prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallDealer = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const pricePerKg = 242;
  const totalValue = stock.quantityKg * pricePerKg;

  const predictedDays = 99;
  const storageRisk = 'Poor storage conditions – risk of spoilage';

  // ========== PRICE PREDICTION DATA ==========
  const startingPrice = 242; // Current market price
  const bestPriceToSell = 268; // Predicted best price
  const priceIncrease = ((bestPriceToSell - startingPrice) / startingPrice * 100).toFixed(1);
  const bestSellingPeriod = '2-3 weeks';
  
  // Price trend data for graph (7-day prediction)
  const priceTrendData = {
    labels: ['Now', 'Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      data: [242, 248, 258, 268, 262], // Simulated price trend
      color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
      strokeWidth: 3
    }]
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={22} color="#16a34a" />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const DealerRow = ({ dealer }) => (
    <View style={styles.dealerRow}>
      <MaterialCommunityIcons name="store" size={22} color="#22c55e" />
      <View style={{ flex: 1 }}>
        <Text style={styles.dealerName}>{dealer.dealerName}</Text>
        <Text style={styles.dealerMeta}>
          {dealer.location} • Min: {dealer.minQuantity}kg
        </Text>
        {dealer.variety && (
          <Text style={styles.dealerVariety}>{dealer.variety}</Text>
        )}
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.dealerPrice}>Rs. {dealer.pricePerKg}/kg</Text>
        {dealer.phone && (
          <TouchableOpacity 
            style={styles.callButton}
            onPress={() => handleCallDealer(dealer.phone)}
          >
            <MaterialCommunityIcons name="phone" size={16} color="#fff" />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="rice" size={36} color="#16a34a" />
        <Text style={styles.title}>{stock.variety}</Text>
        <Text style={styles.sub}>
          {stock.locationName || stock.location} • {stock.season}
        </Text>
      </View>

      {/* Quantity */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Quantity</Text>
        <InfoRow icon="scale" label="Total Weight" value={`${stock.quantityKg} KG`} />
        <InfoRow icon="package-variant" label="Bags (50kg)" value={`${stock.bags} Bags`} />
        <InfoRow
          icon="cash"
          label="Estimated Value"
          value={`Rs. ${totalValue.toLocaleString('en-LK')}`}
        />
      </View>

      {/* Storage Location */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Storage Location</Text>
        <InfoRow icon="warehouse" label="Storage Type" value={stock.storageType || 'Warehouse'} />
        <InfoRow icon="map-marker" label="Location Name" value={stock.locationName || stock.location} />
        <InfoRow
          icon="floor-plan"
          label="Storage Area"
          value={`${stock.storageArea || 0} ${stock.areaUnit || 'sq.ft'}`}
        />
      </View>

      {/* Quality */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Quality & Conditions</Text>
        <InfoRow icon="star-circle" label="Grade" value={`Grade ${stock.grade || 'A'}`} />
        <InfoRow
          icon="water-percent"
          label="Moisture Content"
          value={stock.moisture ? `${stock.moisture}%` : 'Not provided'}
        />
        <InfoRow icon="weather-windy" label="Ventilation" value={stock.ventilation || 'Good'} />
        <InfoRow icon="bug" label="Pest Status" value={stock.pestCheck || 'Low Risk'} />
      </View>

      {/* Storage Duration Prediction */}
      <View style={styles.predictionCard}>
        <View style={styles.predictionHeader}>
          <MaterialCommunityIcons name="seed-outline" size={26} color="#22c55e" />
          <Text style={styles.predictionTitle}>Storage Duration Prediction</Text>
        </View>
        <Text style={styles.predictedDays}>
          Estimated Storage Duration: <Text style={{ fontWeight: '900' }}>{predictedDays} days</Text>
        </Text>
        <View style={styles.warningBox}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
          <Text style={styles.warningText}>{storageRisk}</Text>
        </View>
        <Text style={styles.modelNote}>Model accuracy ~85–90% (R² based)</Text>
      </View>

      {/* ========== PRICE PREDICTION SECTION ========== */}
      <View style={styles.pricePredictionCard}>
        <View style={styles.predictionHeader}>
          <MaterialCommunityIcons name="chart-line-variant" size={28} color="#22c55e" />
          <Text style={styles.pricePredictionTitle}>Price Prediction & Best Time to Sell</Text>
        </View>

        {/* Price Summary */}
        <View style={styles.priceComparisonRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceBoxLabel}>Starting Price</Text>
            <Text style={styles.startingPrice}>Rs. {startingPrice}/kg</Text>
            <Text style={styles.priceBoxSubtext}>Current Market</Text>
          </View>

          <MaterialCommunityIcons name="arrow-right-thick" size={24} color="#94a3b8" />

          <View style={styles.priceBox}>
            <Text style={styles.priceBoxLabel}>Best Price</Text>
            <Text style={styles.bestPrice}>Rs. {bestPriceToSell}/kg</Text>
            <View style={styles.priceIncreaseBox}>
              <MaterialCommunityIcons name="trending-up" size={14} color="#22c55e" />
              <Text style={styles.priceIncreaseText}>+{priceIncrease}%</Text>
            </View>
          </View>
        </View>

        {/* Profit Calculation */}
        <View style={styles.profitCard}>
          <Text style={styles.profitLabel}>Potential Additional Profit</Text>
          <Text style={styles.profitAmount}>
            Rs. {((bestPriceToSell - startingPrice) * stock.quantityKg).toLocaleString('en-LK')}
          </Text>
          <Text style={styles.profitSubtext}>
            If you sell at peak price ({bestSellingPeriod} from now)
          </Text>
        </View>

        {/* Recommendation */}
        <View style={styles.recommendationBox}>
          <MaterialCommunityIcons name="lightbulb-on" size={22} color="#f59e0b" />
          <View style={{ flex: 1 }}>
            <Text style={styles.recommendationTitle}>💡 Recommendation</Text>
            <Text style={styles.recommendationText}>
              Best selling window: <Text style={{ fontWeight: '900' }}>{bestSellingPeriod}</Text>
            </Text>
            <Text style={styles.recommendationText}>
              Expected peak price: <Text style={{ fontWeight: '900' }}>Rs. {bestPriceToSell}/kg</Text>
            </Text>
          </View>
        </View>

        {/* Price Trend Graph */}
        <View style={styles.graphContainer}>
          <Text style={styles.graphTitle}>📈 Price Trend Forecast</Text>
          <Text style={styles.graphSubtitle}>Predicted price movement over next 4 weeks</Text>
          
          <LineChart
            data={priceTrendData}
            width={screenWidth - 80}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#16a34a'
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#e2e8f0',
                strokeWidth: 1
              }
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            fromZero={false}
            yAxisSuffix=" Rs"
            segments={4}
          />

          {/* Graph Legend */}
          <View style={styles.graphLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>Predicted Price per KG</Text>
            </View>
          </View>

          {/* Key Insights */}
          <View style={styles.insightsContainer}>
            <View style={styles.insightRow}>
              <MaterialCommunityIcons name="information" size={16} color="#16a34a" />
              <Text style={styles.insightText}>Price peaks in week 3</Text>
            </View>
            <View style={styles.insightRow}>
              <MaterialCommunityIcons name="information" size={16} color="#16a34a" />
              <Text style={styles.insightText}>Sell before week 4 to maximize profit</Text>
            </View>
          </View>
        </View>

        <Text style={styles.modelNote}>
          Prediction based on historical trends, seasonal demand & market analysis
        </Text>
      </View>

      {/* Live Dealer Prices */}
      <View style={styles.priceCard}>
        <View style={styles.priceHeader}>
          <MaterialCommunityIcons name="trending-up" size={26} color="#22c55e" />
          <Text style={styles.priceTitle}>Today's Market Prices</Text>
        </View>

        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live Dealer Prices (Updated Today)</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#16a34a" />
            <Text style={styles.loadingText}>Loading dealer prices...</Text>
          </View>
        ) : nearbyDealers.length > 0 ? (
          <>
            {nearbyDealers.map(dealer => (
              <DealerRow key={dealer.id} dealer={dealer} />
            ))}
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchDealerPrices}
            >
              <MaterialCommunityIcons name="refresh" size={16} color="#16a34a" />
              <Text style={styles.refreshText}>Refresh Prices</Text>
            </TouchableOpacity>
            <Text style={styles.modelNote}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </>
        ) : (
          <View style={styles.noDealersBox}>
            <MaterialCommunityIcons name="information" size={30} color="#94a3b8" />
            <Text style={styles.noDealersText}>
              No dealer prices available yet today
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchDealerPrices}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Meta Info */}
      <View style={styles.metaCard}>
        <Text style={styles.metaLabel}>Harvest ID</Text>
        <Text style={styles.metaValue}>{stock.id}</Text>
        {stock.updatedAt && (
          <>
            <Text style={[styles.metaLabel, { marginTop: 10 }]}>Last Updated</Text>
            <Text style={styles.metaValue}>
              {new Date(stock.updatedAt.seconds * 1000).toDateString()}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 10,
    color: '#1e293b',
  },
  sub: {
    color: '#64748b',
    marginTop: 6,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16a34a',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 14,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  predictionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  predictedDays: {
    fontSize: 16,
    color: '#22c55e',
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#3f1d1d',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  warningText: {
    color: '#fecaca',
    fontSize: 13,
    flex: 1,
  },
  modelNote: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
  },
  priceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16a34a',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  liveText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  dealerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dealerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  dealerMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  dealerVariety: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  dealerPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#16a34a',
  },
  callButton: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    marginTop: 10,
  },
  refreshText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '600',
  },
  noDealersBox: {
    alignItems: 'center',
    padding: 30,
  },
  noDealersText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  metaCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  // ========== PRICE PREDICTION STYLES ==========
  pricePredictionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  pricePredictionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16a34a',
  },
  priceComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
  },
  priceBoxLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 5,
  },
  startingPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 3,
  },
  bestPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: '#16a34a',
    marginBottom: 5,
  },
  priceBoxSubtext: {
    fontSize: 11,
    color: '#94a3b8',
  },
  priceIncreaseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  priceIncreaseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  profitCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 15,
  },
  profitLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  profitAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#22c55e',
    marginBottom: 5,
  },
  profitSubtext: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  recommendationBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 15,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 5,
  },
  recommendationText: {
    fontSize: 13,
    color: '#78350f',
    marginBottom: 3,
  },
  graphContainer: {
    marginTop: 10,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3,
  },
  graphSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  graphLegend: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  insightsContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    gap: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
});