import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
  Share,
  Modal,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as Linking from 'expo-linking';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { File, Directory, Paths } from 'expo-file-system';

const { width } = Dimensions.get('window');

// ========== MOVE HELPER FUNCTIONS OUTSIDE COMPONENT ==========
// This function needs to be defined BEFORE it's used
const getConfidenceColor = (confidence) => {
  if (confidence >= 85) return '#16a34a';
  if (confidence >= 70) return '#f59e0b';
  return '#ef4444';
};

const getConfidenceLevel = (confidence) => {
  if (confidence >= 85) return 'High';
  if (confidence >= 70) return 'Medium';
  return 'Low';
};

const getRainRisk = (rainProbability) => {
  if (!rainProbability) return "Moderate";
  const rain = rainProbability;
  if (rain > 12) return "High Rainfall Expected";
  if (rain < 6) return "Low Rainfall Risk";
  return "Moderate Rainfall";
};

const getSuitabilityLevel = (score) => {
  if (score >= 85) return { level: 'Excellent', color: '#16a34a', icon: 'star-circle' };
  if (score >= 70) return { level: 'Good', color: '#f59e0b', icon: 'thumb-up' };
  if (score >= 50) return { level: 'Moderate', color: '#3b82f6', icon: 'alert' };
  return { level: 'Low', color: '#ef4444', icon: 'alert-circle' };
};

const getProfitLevel = (profitString) => {
  const amount = parseInt(profitString.replace(/[^0-9]/g, '')) || 0;
  if (amount >= 200000) return { level: 'High Profit Potential', color: '#16a34a', icon: 'trending-up' };
  if (amount >= 100000) return { level: 'Moderate Profit', color: '#f59e0b', icon: 'chart-line' };
  return { level: 'Low Profit Margin', color: '#ef4444', icon: 'trending-down' };
};
// ========== END HELPER FUNCTIONS ==========

const CropRecommendationResultsScreen = ({ route, navigation }) => {
  const { formData, recommendation } = route.params;
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [animateValue] = useState(new Animated.Value(0));
  const [chartType, setChartType] = useState('bar'); // 'bar', 'pie', 'line'

  // Animation on load
  useEffect(() => {
    Animated.timing(animateValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  // AI Insight Calculations
  const suitabilityScore = recommendation?.primary?.confidence || 0;
  const rainRisk = getRainRisk(recommendation?.weather?.rainProbability);
  const climateVariety = recommendation?.primary?.variety || "Not Available";
  
  // Prepare chart data for alternative varieties
  const prepareChartData = () => {
    const alternativeData = recommendation.alternatives || [];
    
    // Bar chart data
    const barData = {
      labels: alternativeData.map(alt => alt.variety),
      datasets: [{
        data: alternativeData.map(alt => alt.confidence),
        colors: alternativeData.map((_, index) => 
          `rgba(22, 163, 74, ${0.7 + (index * 0.07)})`
        ),
      }]
    };
    
    // Pie chart data
    const pieData = alternativeData.map(alt => ({
      name: alt.variety,
      population: alt.confidence,
      color: getConfidenceColor(alt.confidence), // Now this function is defined
      legendFontColor: '#333',
      legendFontSize: 11,
    }));
    
    // Line chart data (with primary included for trend)
    const lineData = {
      labels: [recommendation.primary.variety, ...alternativeData.map(alt => alt.variety)],
      datasets: [{
        data: [recommendation.primary.confidence, ...alternativeData.map(alt => alt.confidence)],
        color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
        strokeWidth: 2,
      }]
    };
    
    return { barData, pieData, lineData };
  };
  
  const chartData = prepareChartData();
  
  const suitabilityLevel = getSuitabilityLevel(suitabilityScore);
  const profitLevel = getProfitLevel(recommendation.estimatedProfit);



const handleSaveRecommendation = async () => {
  setLoading(true);
  try {
    // Create HTML content for PDF with your desired format
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crop Recommendation Report</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      line-height: 1.5;
      color: #000;
      margin: 0;
      padding: 20px;
      background-color: #fff;
    }
    .report-title {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 10px 0;
      color: #000;
    }
    .title-border {
      border-top: 3px solid #000;
      border-bottom: 3px solid #000;
      padding: 10px 0;
      margin: 10px 0 30px 0;
      text-align: center;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      background-color: #f0f0f0;
      padding: 8px 15px;
      margin: 20px 0 10px 0;
      font-weight: bold;
      border-left: 5px solid #16a34a;
      font-size: 16px;
    }
    .section-divider {
      border-top: 2px dashed #ccc;
      margin: 15px 0;
    }
    .info-row {
      margin: 8px 0;
      padding-left: 10px;
    }
    .label {
      font-weight: bold;
      display: inline-block;
      width: 200px;
    }
    .value {
      display: inline-block;
    }
    .primary-variety-box {
      border: 2px solid #16a34a;
      padding: 15px;
      margin: 15px 0;
      background-color: #f9fff9;
      border-radius: 5px;
    }
    .variety-name {
      color: #065f46;
      font-size: 20px;
      font-weight: bold;
      margin: 0 0 10px 0;
    }
    .confidence-badge {
      display: inline-block;
      background: ${recommendation.primary.confidence > 85 ? '#dcfce7' : 
                   recommendation.primary.confidence > 70 ? '#fef9c3' : '#fee2e2'};
      color: ${recommendation.primary.confidence > 85 ? '#166534' : 
              recommendation.primary.confidence > 70 ? '#854d0e' : '#991b1b'};
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      margin-bottom: 10px;
      border: 1px solid #ccc;
    }
    .alternative-list {
      margin-left: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 12px;
      color: #666;
    }
    .disclaimer {
      background-color: #f5f5f5;
      padding: 15px;
      margin-top: 30px;
      border: 1px solid #ddd;
      font-size: 11px;
      color: #666;
    }
    .contact-info {
      margin-top: 20px;
      padding: 10px;
      background-color: #f0f9f0;
      border: 1px solid #bbf7d0;
    }
    @media print {
      body {
        padding: 10px;
      }
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="title-border">
    <h1 class="report-title">CROP RECOMMENDATION REPORT</h1>
  </div>

  <div class="section">
    <div class="info-row">
      <span class="label">Date:</span>
      <span class="value">${new Date().toLocaleDateString('en-LK', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</span>
    </div>
    <div class="info-row">
      <span class="label">Time:</span>
      <span class="value">${new Date().toLocaleTimeString('en-LK', {hour: '2-digit', minute:'2-digit'})}</span>
    </div>
  </div>

  <div class="section-divider"></div>

  <div class="section">
    <div class="section-title">📌 FARM LOCATION DETAILS</div>
    <div class="info-row">
      <span class="label">District:</span>
      <span class="value">${formData.district}</span>
    </div>
    <div class="info-row">
      <span class="label">Village:</span>
      <span class="value">${formData.village || 'Not specified'}</span>
    </div>
    <div class="info-row">
      <span class="label">GN Division:</span>
      <span class="value">${formData.gnDivision || 'Not specified'}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🌾 FIELD CHARACTERISTICS</div>
    <div class="info-row">
      <span class="label">Field Size:</span>
      <span class="value">${formData.fieldSize} ${formData.unit} (${recommendation.fieldSize.hectares} hectares)</span>
    </div>
    <div class="info-row">
      <span class="label">Soil Type:</span>
      <span class="value">${formData.soilType}</span>
    </div>
    <div class="info-row">
      <span class="label">Water Availability:</span>
      <span class="value">${formData.waterAvailability}</span>
    </div>
    <div class="info-row">
      <span class="label">Season:</span>
      <span class="value">${formData.season}</span>
    </div>
  </div>

  <div class="section-divider"></div>

  <div class="section">
    <div class="section-title">🎯 PRIMARY RECOMMENDATION</div>
    <div class="primary-variety-box">
      <div class="confidence-badge">Confidence Score: ${recommendation.primary.confidence}%</div>
      <h3 class="variety-name">${recommendation.primary.variety}</h3>
      
      <div class="info-row">
        <span class="label">Expected Yield:</span>
        <span class="value">${recommendation.primary.yield}</span>
      </div>
      <div class="info-row">
        <span class="label">Growth Duration:</span>
        <span class="value">${recommendation.primary.duration}</span>
      </div>
      <div class="info-row">
        <span class="label">Risk Level:</span>
        <span class="value">${recommendation.primary.riskLevel}</span>
      </div>
      <div class="info-row">
        <span class="label">Market Price Range:</span>
        <span class="value">${recommendation.primary.price}</span>
      </div>
      <div class="info-row">
        <span class="label">Disease Resistance:</span>
        <span class="value">${recommendation.primary.resistance}</span>
      </div>
      <div class="info-row">
        <span class="label">Water Requirement:</span>
        <span class="value">${recommendation.primary.waterNeed}</span>
      </div>
      
      <div style="margin-top: 15px;">
        <strong>Description:</strong><br>
        ${recommendation.primary.description}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🔄 ALTERNATIVE VARIETIES</div>
    <div class="alternative-list">
      ${recommendation.alternatives.map((alt, index) => `
        <div class="info-row">
          <strong>${index + 1}. ${alt.variety}</strong><br>
          &nbsp;&nbsp;&nbsp;&nbsp;• Confidence: ${alt.confidence}%<br>
          &nbsp;&nbsp;&nbsp;&nbsp;• Yield: ${alt.yield}<br>
          &nbsp;&nbsp;&nbsp;&nbsp;• Risk Level: ${alt.riskLevel}
        </div>
        ${index < recommendation.alternatives.length - 1 ? '<br>' : ''}
      `).join('')}
    </div>
  </div>

  <div class="section-divider"></div>

  <div class="section">
    <div class="section-title">📅 PLANNING DETAILS</div>
    <div class="info-row">
      <span class="label">Recommended Planting Window:</span>
      <span class="value">${recommendation.plantingWindow}</span>
    </div>
    <div class="info-row">
      <span class="label">Water Requirement:</span>
      <span class="value">${recommendation.waterRequirement}</span>
    </div>
    <div class="info-row">
      <span class="label">Expected Harvest:</span>
      <span class="value">Approximately ${recommendation.primary.duration} after planting</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">💰 FINANCIAL PROJECTION</div>
    <div class="info-row">
      <span class="label">Estimated Total Yield:</span>
      <span class="value">${recommendation.calculatedYield}</span>
    </div>
    <div class="info-row">
      <span class="label">Estimated Profit:</span>
      <span class="value">${recommendation.estimatedProfit}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🧪 FERTILIZER APPLICATION PLAN</div>
    <div style="padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
      ${recommendation.fertilizerPlan}
    </div>
  </div>

  <div class="section">
    <div class="section-title">💡 SPECIAL RECOMMENDATIONS & ADVICE</div>
    <div style="padding: 10px; background-color: #fff9e6; border: 1px solid #f59e0b;">
      ${recommendation.specialAdvice.replace(/•/g, '•')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">⚠️ RISK MANAGEMENT</div>
    <div style="padding: 10px; background-color: #fee2e2; border: 1px solid #ef4444;">
      1. Monitor weather forecasts regularly<br>
      2. Consider crop insurance options<br>
      3. Maintain proper drainage systems<br>
      4. Regular pest and disease monitoring
    </div>
  </div>

  <div class="section">
    <div class="section-title">📞 CONTACT FOR SUPPORT</div>
    <div class="contact-info">
      • Local Agriculture Office: Contact your nearest agriculture extension officer<br>
      • Emergency Helpline: 1920 (Government Agriculture Helpline)<br>
      • Crop Advisory: Visit www.agridept.gov.lk
    </div>
  </div>

  <div class="section-divider"></div>

  <div class="footer">
    <div style="text-align: center; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px; margin: 20px 0;">
      <strong>GENERATED BY GOVIMITHURU PLATFORM</strong><br>
      <em>AI-Driven Paddy Farming Assistant</em>
    </div>
    
    <div class="disclaimer">
      <strong>Disclaimer:</strong> This recommendation is generated based on the inputs provided. 
      Actual results may vary based on actual field conditions, weather patterns, 
      and farming practices. Always consult with local agriculture experts 
      before making final decisions.
    </div>
  </div>
</body>
</html>
    `;

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `Crop_Recommendation_${formData.district}_${timestamp}.pdf`;
    
    // Get the documents directory using the new API
    const downloadsDir = FileSystem.documentDirectory + 'downloads/';
    
    // Create downloads directory using new API
    try {
      // Use the new Directory API to check and create directory
      const dir = FileSystem.documentDirectory + 'downloads';
      const dirExists = await FileSystem.getInfoAsync(dir);
      
      if (!dirExists.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    } catch (dirError) {
      console.log('Directory error:', dirError);
      // Continue anyway
    }
    
    // Define destination path
    const destinationUri = downloadsDir + filename;
    
    try {
      // Copy the PDF to downloads directory
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      // Show success message
      Alert.alert(
  '✅ Report Generated Successfully!',
  `Report saved as: ${filename}`,
  [
    {
      text: 'Open PDF',
      onPress: async () => {
        try {
          await Linking.openURL(destinationUri);
        } catch (err) {
          Alert.alert("Error", "Unable to open PDF");
        }
      }
    },
    {
      text: 'Share',
      onPress: async () => {
        await Sharing.shareAsync(destinationUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Crop Recommendation Report'
        });
      }
    },
    {
      text: 'OK',
      style: 'cancel'
    }
  ]
);
    } catch (copyError) {
      console.log('Copy failed, sharing original:', copyError);
      // If copy fails, share the original PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Crop Recommendation Report',
        UTI: 'com.adobe.pdf'
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleShare = async () => {
    try {
      const alternativeText = recommendation.alternatives.map((alt, i) => 
        `${i+1}. ${alt.variety} - ${alt.confidence}% match`
      ).join('\n');
      
      const message = `
🌾 *CROP RECOMMENDATION REPORT* 🌾

🎯 *PRIMARY RECOMMENDATION*
Variety: ${recommendation.primary.variety}
Match Score: ${recommendation.primary.confidence}%
Expected Yield: ${recommendation.primary.yield}

🔄 *ALTERNATIVE VARIETIES*
${alternativeText}

📅 *PLANNING DETAILS*
Planting Window: ${recommendation.plantingWindow}
Estimated Profit: ${recommendation.estimatedProfit}

Generated by AgroMind App
      `;

      await Share.share({ message, title: 'Crop Recommendation Report' });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const Section = ({ title, icon, children, sectionKey }) => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeaderTouchable}
        onPress={() => toggleSection(sectionKey)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <MaterialCommunityIcons name={icon} size={24} color="#16a34a" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <MaterialCommunityIcons 
          name={expandedSection === sectionKey ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#6b7280" 
        />
      </TouchableOpacity>
      {expandedSection === sectionKey && (
        <Animated.View style={{ opacity: animateValue }}>
          {children}
        </Animated.View>
      )}
    </View>
  );

  // Render Confidence Chart Component (defined inside component but uses external getConfidenceColor)
  // Render Confidence Chart Component (fixed version)
const ConfidenceChart = () => {
  const alternativeData = recommendation.alternatives || [];
  
  // Fixed: Bar chart data with proper color function
  const barData = {
    labels: alternativeData.map(alt => alt.variety),
    datasets: [{
      data: alternativeData.map(alt => alt.confidence),
    }]
  };
  
  // Fixed: Pie chart data
  const pieData = alternativeData.map((alt, index) => ({
    name: alt.variety,
    population: alt.confidence,
    color: getConfidenceColor(alt.confidence),
    legendFontColor: '#333',
    legendFontSize: 11,
  }));
  
  // Fixed: Line chart data
  const lineData = {
    labels: [recommendation.primary.variety, ...alternativeData.map(alt => alt.variety)],
    datasets: [{
      data: [recommendation.primary.confidence, ...alternativeData.map(alt => alt.confidence)],
      color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
      strokeWidth: 2,
    }]
  };
  
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Alternative Varieties Confidence Levels</Text>
        <View style={styles.chartTypeSelector}>
          <TouchableOpacity 
            style={[styles.chartTypeButton, chartType === 'bar' && styles.chartTypeActive]}
            onPress={() => setChartType('bar')}
          >
            <MaterialCommunityIcons name="chart-bar" size={18} color={chartType === 'bar' ? '#16a34a' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.chartTypeButton, chartType === 'pie' && styles.chartTypeActive]}
            onPress={() => setChartType('pie')}
          >
            <MaterialCommunityIcons name="chart-pie" size={18} color={chartType === 'pie' ? '#16a34a' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.chartTypeButton, chartType === 'line' && styles.chartTypeActive]}
            onPress={() => setChartType('line')}
          >
            <MaterialCommunityIcons name="chart-line" size={18} color={chartType === 'line' ? '#16a34a' : '#6b7280'} />
          </TouchableOpacity>
        </View>
      </View>
      
      {chartType === 'bar' && alternativeData.length > 0 && (
        <View>
          <BarChart
            data={barData}
            width={width - 64}
            height={220}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForLabels: {
                fontSize: 10,
              },
              barPercentage: 0.7,
            }}
            style={styles.chart}
            fromZero={true}
            showValuesOnTopOfBars={true}
          />
          <Text style={styles.chartNote}>* Bar chart shows confidence levels of alternative varieties</Text>
        </View>
      )}
      
      {chartType === 'pie' && pieData.length > 0 && (
        <View>
          <PieChart
            data={pieData}
            width={width - 64}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
          <Text style={styles.chartNote}>* Pie chart shows confidence distribution among alternatives</Text>
        </View>
      )}
      
      {chartType === 'line' && lineData.labels.length > 0 && (
        <View>
          <LineChart
            data={lineData}
            width={width - 64}
            height={220}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#16a34a",
              },
            }}
            bezier
            style={styles.chart}
            formatYLabel={(value) => `${Math.round(value)}%`}
          />
          <Text style={styles.chartNote}>* Line chart shows confidence trend (including primary variety)</Text>
        </View>
      )}
      
      {/* Confidence Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Confidence Levels:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#16a34a' }]} />
            <Text style={styles.legendText}>High (85%+)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Medium (70-84%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Low (Below 70%)</Text>
          </View>
        </View>
      </View>
      
      {/* Statistics Summary */}
      {alternativeData.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Highest Confidence</Text>
            <Text style={styles.statValue}>
              {alternativeData.reduce((max, alt) => alt.confidence > max.confidence ? alt : max, alternativeData[0])?.variety}
            </Text>
            <Text style={styles.statPercent}>
              {Math.max(...alternativeData.map(alt => alt.confidence))}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Average Confidence</Text>
            <Text style={styles.statValue}>All Alternatives</Text>
            <Text style={styles.statPercent}>
              {Math.round(alternativeData.reduce((sum, alt) => sum + alt.confidence, 0) / alternativeData.length)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>vs Primary</Text>
            <Text style={styles.statValue}>Difference</Text>
            <Text style={styles.statPercent}>
              {Math.round(recommendation.primary.confidence - alternativeData[0]?.confidence)}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#16a34a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🌾 Crop Recommendation</Text>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowFullReport(true)}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#16a34a" />
          </TouchableOpacity>
        </View>

        {/* Farmer Info Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Farm Profile</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#16a34a" />
              <Text style={styles.summaryText}>{formData.district}</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="terraform" size={18} color="#16a34a" />
              <Text style={styles.summaryText}>{formData.soilType?.split(' ')[0] || formData.soilType}</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="water" size={18} color="#16a34a" />
              <Text style={styles.summaryText}>{formData.waterAvailability?.split('(')[0]?.trim() || formData.waterAvailability}</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="calendar" size={18} color="#16a34a" />
              <Text style={styles.summaryText}>{formData.season}</Text>
            </View>
          </View>
        </View>

        {/* AI Insights Card */}
        <View style={styles.aiInsightCard}>
          <View style={styles.aiHeader}>
            <MaterialCommunityIcons name="brain" size={28} color="#16a34a" />
            <Text style={styles.aiTitle}>AI Farming Insights</Text>
          </View>
          
          <View style={styles.aiMetricsRow}>
            <View style={styles.aiMetric}>
              <MaterialCommunityIcons name={suitabilityLevel.icon} size={24} color={suitabilityLevel.color} />
              <Text style={[styles.aiMetricValue, { color: suitabilityLevel.color }]}>{suitabilityScore}%</Text>
              <Text style={styles.aiMetricLabel}>Suitability</Text>
              <View style={[styles.aiBadge, { backgroundColor: suitabilityLevel.color + '20' }]}>
                <Text style={[styles.aiBadgeText, { color: suitabilityLevel.color }]}>{suitabilityLevel.level}</Text>
              </View>
            </View>
            
            <View style={styles.aiMetric}>
              <MaterialCommunityIcons name="weather-rainy" size={24} color="#3b82f6" />
              <Text style={styles.aiMetricValue}>{rainRisk.split(' ')[0]}</Text>
              <Text style={styles.aiMetricLabel}>Rainfall Risk</Text>
              <Text style={styles.aiMetricSub}>{rainRisk.replace(rainRisk.split(' ')[0], '').trim()}</Text>
            </View>
            
            <View style={styles.aiMetric}>
              <MaterialCommunityIcons name={profitLevel.icon} size={24} color={profitLevel.color} />
              <Text style={[styles.aiMetricValue, { color: profitLevel.color, fontSize: 14 }]}>{profitLevel.level}</Text>
              <Text style={styles.aiMetricLabel}>Profit Potential</Text>
            </View>
          </View>
        </View>

        {/* Primary Recommendation */}
        <Section title="Primary Recommendation" icon="star-circle" sectionKey="primary">
          <View style={styles.primaryCard}>
            <View style={styles.varietyHeader}>
              <Text style={styles.varietyName}>{recommendation.primary.variety}</Text>
              <View style={[styles.matchBadge, { backgroundColor: suitabilityLevel.color + '20' }]}>
                <Text style={[styles.matchText, { color: suitabilityLevel.color }]}>{suitabilityScore}% Match</Text>
              </View>
            </View>
            
            <Text style={styles.varietyDescription}>{recommendation.primary.description}</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="chart-bar" size={20} color="#16a34a" />
                <Text style={styles.metricLabel}>Yield</Text>
                <Text style={styles.metricValue}>{recommendation.primary.yield}</Text>
              </View>
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#16a34a" />
                <Text style={styles.metricLabel}>Duration</Text>
                <Text style={styles.metricValue}>{recommendation.primary.duration}</Text>
              </View>
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="shield-check" size={20} color="#16a34a" />
                <Text style={styles.metricLabel}>Resistance</Text>
                <Text style={styles.metricValueSmall}>{recommendation.primary.resistance}</Text>
              </View>
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="water" size={20} color="#16a34a" />
                <Text style={styles.metricLabel}>Water Need</Text>
                <Text style={styles.metricValue}>{recommendation.primary.waterNeed}</Text>
              </View>
            </View>
          </View>
        </Section>

        {/* Alternative Varieties with Chart */}
        <Section title="Alternative Varieties" icon="swap-horizontal" sectionKey="alternatives">
          <Text style={styles.sectionSubtitle}>Other suitable options for your farm</Text>
          
          {/* Chart Display */}
          <ConfidenceChart />
          
          {/* Alternative Cards */}
          <View style={styles.alternativesContainer}>
            <Text style={styles.alternativesSubtitle}>Detailed Information:</Text>
            {recommendation.alternatives.map((alt, index) => (
              <View key={index} style={styles.alternativeCard}>
                <View style={styles.alternativeHeader}>
                  <Text style={styles.alternativeName}>{alt.variety}</Text>
                  <View style={[styles.alternativeConfidence, { 
                    backgroundColor: alt.confidence >= 85 ? '#dcfce7' : 
                                    alt.confidence >= 70 ? '#fef9c3' : '#fee2e2'
                  }]}>
                    <Text style={[styles.alternativeConfidenceText, { 
                      color: alt.confidence >= 85 ? '#166534' : 
                             alt.confidence >= 70 ? '#854d0e' : '#991b1b'
                    }]}>{alt.confidence}%</Text>
                  </View>
                </View>
                <View style={styles.alternativeDetails}>
                  <View style={styles.alternativeYieldContainer}>
                    <MaterialCommunityIcons name="chart-bar" size={14} color="#6b7280" />
                    <Text style={styles.alternativeYield}>Yield: {alt.yield}</Text>
                  </View>
                  <View style={[styles.alternativeRisk, { 
                    backgroundColor: alt.riskLevel === 'Low' ? '#dcfce7' : 
                                    alt.riskLevel === 'Medium' ? '#fef9c3' : '#fee2e2'
                  }]}>
                    <Text style={[styles.alternativeRiskText, { 
                      color: alt.riskLevel === 'Low' ? '#166534' : 
                             alt.riskLevel === 'Medium' ? '#854d0e' : '#991b1b'
                    }]}>Risk: {alt.riskLevel}</Text>
                  </View>
                </View>
                {/* Progress bar for each alternative */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${alt.confidence}%`, backgroundColor: getConfidenceColor(alt.confidence) }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{alt.confidence}% confidence</Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* Planning & Financial Details */}
        <Section title="Planning & Finances" icon="calendar-check" sectionKey="planning">
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialCommunityIcons name="calendar-range" size={22} color="#16a34a" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>Planting Window</Text>
                <Text style={styles.detailDescription}>{recommendation.plantingWindow}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialCommunityIcons name="water-percent" size={22} color="#16a34a" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>Water Requirement</Text>
                <Text style={styles.detailDescription}>{recommendation.waterRequirement}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialCommunityIcons name="currency-usd" size={22} color="#16a34a" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>Estimated Profit</Text>
                <Text style={styles.profitText}>{recommendation.estimatedProfit}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialCommunityIcons name="scale-bathroom" size={22} color="#16a34a" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>Expected Yield</Text>
                <Text style={styles.detailDescription}>{recommendation.calculatedYield}</Text>
              </View>
            </View>
          </View>
        </Section>

        {/* Fertilizer Plan */}
        <Section title="Fertilizer Plan" icon="flask" sectionKey="fertilizer">
          <View style={styles.fertilizerCard}>
            <MaterialCommunityIcons name="test-tube" size={24} color="#16a34a" />
            <Text style={styles.fertilizerText}>{recommendation.fertilizerPlan}</Text>
          </View>
        </Section>

        {/* Special Advice */}
        {recommendation.specialAdvice !== 'No special advice needed' && (
          <Section title="Special Advice" icon="lightbulb-on" sectionKey="advice">
            <View style={styles.adviceCard}>
              <MaterialCommunityIcons name="leaf" size={22} color="#f59e0b" />
              <Text style={styles.adviceText}>{recommendation.specialAdvice}</Text>
            </View>
          </Section>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSaveRecommendation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>PDF Report</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.planButton]}
            onPress={() => navigation.navigate('CropCalendar', {
              variety: recommendation.primary.variety,
              plantingWindow: recommendation.plantingWindow,
              season: formData.season
            })}
          >
            <MaterialCommunityIcons name="calendar-text" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.profitButton]}
            onPress={() => navigation.navigate('ProfitabilitySimulation', {
              variety: recommendation.primary.variety,
              estimatedProfit: recommendation.estimatedProfit,
              calculatedYield: recommendation.calculatedYield
            })}
          >
            <MaterialCommunityIcons name="calculator" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Profit Sim</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <MaterialCommunityIcons name="information" size={16} color="#6b7280" />
          <Text style={styles.disclaimerText}>
            This recommendation is AI-generated based on your inputs. Actual results may vary.
          </Text>
        </View>
      </ScrollView>

      {/* Full Report Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showFullReport}
        onRequestClose={() => setShowFullReport(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Report</Text>
            <TouchableOpacity onPress={() => setShowFullReport(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#16a34a" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalReportText}>
              {`
🌾 COMPLETE CROP RECOMMENDATION REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PRIMARY RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Variety: ${recommendation.primary.variety}
Match Score: ${recommendation.primary.confidence}%
Expected Yield: ${recommendation.primary.yield}
Duration: ${recommendation.primary.duration}

🔄 ALTERNATIVE VARIETIES (with confidence)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${recommendation.alternatives.map((alt, i) => 
  `${i+1}. ${alt.variety} - ${alt.confidence}% confidence`
).join('\n')}

Average Confidence: ${Math.round(recommendation.alternatives.reduce((sum, alt) => sum + alt.confidence, 0) / recommendation.alternatives.length)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AgroMind App
              `}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// Styles remain the same as previous...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    elevation: 4,
  },
  backButton: { padding: 8, borderRadius: 8 },
  menuButton: { padding: 8, borderRadius: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  summaryCard: { 
    backgroundColor: 'white', 
    margin: 16, 
    marginTop: 12,
    borderRadius: 16, 
    padding: 16, 
    elevation: 3,
  },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  summaryItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    margin: 4, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    backgroundColor: '#f0fdf4', 
    borderRadius: 20,
  },
  summaryText: { fontSize: 12, color: '#065f46', marginLeft: 6, fontWeight: '500' },
  aiInsightCard: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 16, 
    padding: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  aiTitle: { fontSize: 18, fontWeight: 'bold', color: '#16a34a', marginLeft: 8 },
  aiMetricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  aiMetric: { alignItems: 'center', flex: 1 },
  aiMetricValue: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  aiMetricLabel: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  aiMetricSub: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  aiBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 6 },
  aiBadgeText: { fontSize: 10, fontWeight: '600' },
  section: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 16, 
    overflow: 'hidden',
    elevation: 3,
  },
  sectionHeaderTouchable: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    backgroundColor: '#fafafa',
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1f2937', marginLeft: 8 },
  sectionSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 12, paddingHorizontal: 16 },
  primaryCard: { padding: 16 },
  varietyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  varietyName: { fontSize: 22, fontWeight: 'bold', color: '#065f46' },
  matchBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  matchText: { fontSize: 12, fontWeight: '600' },
  varietyDescription: { fontSize: 14, color: '#4b5563', marginBottom: 16, lineHeight: 20 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 16 },
  metricCard: { 
    width: '48%', 
    margin: '1%', 
    backgroundColor: '#f9fafb', 
    borderRadius: 12, 
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: { fontSize: 11, color: '#6b7280', marginTop: 6 },
  metricValue: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginTop: 2 },
  metricValueSmall: { fontSize: 12, fontWeight: '500', color: '#1f2937', marginTop: 2, textAlign: 'center' },
  chartContainer: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    padding: 2,
  },
  chartTypeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  chartTypeActive: {
    backgroundColor: 'white',
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartNote: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  legendContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  statPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  alternativesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  alternativesSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  alternativeCard: { 
    backgroundColor: '#f9fafb', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  alternativeHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  alternativeName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  alternativeConfidence: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  alternativeConfidenceText: { fontSize: 11, fontWeight: '600' },
  alternativeDetails: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeYieldContainer: { flexDirection: 'row', alignItems: 'center' },
  alternativeYield: { fontSize: 13, color: '#4b5563', marginLeft: 4 },
  alternativeRisk: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  alternativeRiskText: { fontSize: 11, fontWeight: '500' },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
  detailsCard: { padding: 16 },
  detailRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  detailIcon: { width: 40, alignItems: 'center' },
  detailContent: { flex: 1 },
  detailTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 2 },
  detailDescription: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
  profitText: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  fertilizerCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f0fdf4', 
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  fertilizerText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#374151', lineHeight: 20 },
  adviceCard: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    backgroundColor: '#fffbeb', 
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  adviceText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#92400e', lineHeight: 20 },
  actionButtons: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    marginHorizontal: 16, 
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 12,
    borderRadius: 12,
    width: '48%',
    marginBottom: 8,
  },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: 'white', marginLeft: 6 },
  saveButton: { backgroundColor: '#16a34a' },
  shareButton: { backgroundColor: '#3b82f6' },
  planButton: { backgroundColor: '#8b5cf6' },
  profitButton: { backgroundColor: '#f59e0b' },
  disclaimer: { 
    flexDirection: 'row', 
    backgroundColor: '#fef3c7', 
    marginHorizontal: 16, 
    marginBottom: 30, 
    padding: 14, 
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  disclaimerText: { flex: 1, fontSize: 11, color: '#92400e', marginLeft: 8, lineHeight: 16 },
  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  modalContent: { flex: 1, padding: 16 },
  modalReportText: { fontSize: 13, color: '#1f2937', lineHeight: 20, fontFamily: 'monospace' },
});

export default CropRecommendationResultsScreen;