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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const CropRecommendationResultsScreen = ({ route, navigation }) => {
  const { formData, recommendation } = route.params;
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Remove the entire generateRecommendation function from here
  // You're already receiving the recommendation as a prop





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
        `Report saved as: ${filename}\n\nThe PDF is ready to be shared or saved.`,
        [
          { 
            text: 'Share/Save PDF', 
            onPress: async () => {
              try {
                // Open share sheet to save/download
                await Sharing.shareAsync(destinationUri, {
                  mimeType: 'application/pdf',
                  dialogTitle: 'Save Crop Recommendation Report',
                  UTI: 'com.adobe.pdf'
                });
              } catch (shareError) {
                // If sharing fails, try with the original PDF
                await Sharing.shareAsync(uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: 'Save Crop Recommendation Report',
                  UTI: 'com.adobe.pdf'
                });
              }
            }
          },
          { 
            text: 'OK', 
            style: 'default' 
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
      const message = `
🌾 *Crop Recommendation for ${formData.district}*

*Primary Variety:* ${recommendation.primary.variety}
*Confidence:* ${recommendation.primary.confidence}%
*Expected Yield:* ${recommendation.primary.yield}
*Planting Window:* ${recommendation.plantingWindow}
*Estimated Profit:* ${recommendation.estimatedProfit}

*Field Details:*
- Size: ${formData.fieldSize} ${formData.unit}
- Soil: ${formData.soilType}
- Water: ${formData.waterAvailability}
- Season: ${formData.season}

Generated by AI Paddy Farming Assistant
      `;

      await Share.share({
        message: message,
        title: 'Crop Recommendation'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Remove the useEffect that generates recommendation
  // You already have the recommendation from route.params

  // Remove the conditional rendering for loading state
  // Since you're receiving the recommendation directly
  
  // Prepare data for bar chart (remove if not using charts)
  // const chartData = {
  //   labels: recommendation.alternatives.map(alt => alt.variety),
  //   datasets: [{
  //     data: recommendation.alternatives.map(alt => alt.confidence)
  //   }]
  // };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#16a34a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🌾 Recommendation Results</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Farmer Info Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Farm Details</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#6b7280" />
              <Text style={styles.summaryText}>{formData.district}</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="terraform" size={20} color="#6b7280" />
              <Text style={styles.summaryText}>{formData.soilType}</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="water" size={20} color="#6b7280" />
              <Text style={styles.summaryText}>
                {formData.waterAvailability.split('(')[0].trim()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="calendar" size={20} color="#6b7280" />
              <Text style={styles.summaryText}>{formData.season}</Text>
            </View>
          </View>
          <Text style={styles.fieldSizeText}>
            Field Size: {formData.fieldSize} {formData.unit} 
            ({recommendation.fieldSize.hectares} ha)
          </Text>
        </View>

        {/* Primary Recommendation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Primary Recommendation</Text>
            <View style={[
              styles.confidenceBadge,
              { backgroundColor: recommendation.primary.confidence > 85 ? '#dcfce7' : 
                recommendation.primary.confidence > 70 ? '#fef9c3' : '#fee2e2' }
            ]}>
              <Text style={[
                styles.confidenceText,
                { color: recommendation.primary.confidence > 85 ? '#166534' : 
                  recommendation.primary.confidence > 70 ? '#854d0e' : '#991b1b' }
              ]}>
                {recommendation.primary.confidence}% Match
              </Text>
            </View>
          </View>
          
          <View style={styles.primaryCard}>
            <Text style={styles.varietyName}>{recommendation.primary.variety}</Text>
            <Text style={styles.varietyDescription}>{recommendation.primary.description}</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="chart-bar" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Yield</Text>
                <Text style={styles.detailValue}>{recommendation.primary.yield}</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{recommendation.primary.duration}</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Resistance</Text>
                <Text style={styles.detailValue}>{recommendation.primary.resistance}</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="water" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Water Need</Text>
                <Text style={styles.detailValue}>{recommendation.primary.waterNeed}</Text>
              </View>
            </View>
            
            <View style={styles.riskIndicator}>
              <Text style={styles.riskLabel}>Risk Level:</Text>
              <View style={[
                styles.riskBadge,
                { backgroundColor: recommendation.primary.riskLevel === 'Low' ? '#dcfce7' : 
                  recommendation.primary.riskLevel === 'Medium' ? '#fef9c3' : '#fee2e2' }
              ]}>
                <Text style={[
                  styles.riskText,
                  { color: recommendation.primary.riskLevel === 'Low' ? '#166534' : 
                    recommendation.primary.riskLevel === 'Medium' ? '#854d0e' : '#991b1b' }
                ]}>
                  {recommendation.primary.riskLevel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Alternative Varieties - Simple display without chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Alternative Varieties</Text>
          <Text style={styles.sectionSubtitle}>Other suitable options for your farm</Text>
          
          {/* Simple confidence display */}
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceTitle}>Confidence Levels:</Text>
            {recommendation.alternatives.map((alt, index) => (
              <View key={index} style={styles.confidenceItem}>
                <Text style={styles.confidenceVariety}>{alt.variety}</Text>
                <View style={styles.confidenceBarContainer}>
                  <View 
                    style={[
                      styles.confidenceBar, 
                      { width: `${alt.confidence}%`, backgroundColor: getConfidenceColor(alt.confidence) }
                    ]} 
                  />
                </View>
                <Text style={styles.confidencePercentage}>{alt.confidence}%</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.alternativesContainer}>
            {recommendation.alternatives.map((alt, index) => (
              <View key={index} style={styles.alternativeCard}>
                <View style={styles.alternativeHeader}>
                  <Text style={styles.alternativeName}>{alt.variety}</Text>
                  <View style={styles.alternativeConfidence}>
                    <Text style={styles.alternativeConfidenceText}>{alt.confidence}%</Text>
                  </View>
                </View>
                <View style={styles.alternativeDetails}>
                  <Text style={styles.alternativeYield}>Yield: {alt.yield}</Text>
                  <View style={[
                    styles.alternativeRisk,
                    { backgroundColor: alt.riskLevel === 'Low' ? '#dcfce7' : 
                      alt.riskLevel === 'Medium' ? '#fef9c3' : '#fee2e2' }
                  ]}>
                    <Text style={styles.alternativeRiskText}>Risk: {alt.riskLevel}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Planting & Financial Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Planning Details</Text>
          
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar-range" size={20} color="#16a34a" />
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>Planting Window</Text>
                <Text style={styles.detailDescription}>{recommendation.plantingWindow}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="water" size={20} color="#16a34a" />
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>Water Requirement</Text>
                <Text style={styles.detailDescription}>{recommendation.waterRequirement}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={20} color="#16a34a" />
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>Estimated Profit</Text>
                <Text style={styles.profitText}>{recommendation.estimatedProfit}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="scale" size={20} color="#16a34a" />
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>Expected Yield</Text>
                <Text style={styles.detailDescription}>{recommendation.calculatedYield}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fertilizer Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Fertilizer Plan</Text>
          <View style={styles.fertilizerCard}>
            <MaterialCommunityIcons name="flask" size={24} color="#16a34a" />
            <Text style={styles.fertilizerText}>{recommendation.fertilizerPlan}</Text>
          </View>
        </View>

        {/* Special Advice */}
        {recommendation.specialAdvice !== 'No special advice needed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Special Advice</Text>
            <View style={styles.adviceCard}>
              <MaterialCommunityIcons name="lightbulb-on" size={24} color="#f59e0b" />
              <Text style={styles.adviceText}>{recommendation.specialAdvice}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSaveRecommendation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="download" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {saved ? 'Saved!' : 'Save Report'}
                </Text>
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
            <Text style={styles.actionButtonText}>View Calendar</Text>
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

        
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function for confidence colors
const getConfidenceColor = (confidence) => {
  if (confidence >= 85) return '#16a34a';
  if (confidence >= 70) return '#f59e0b';
  return '#ef4444';
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
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  summaryCard: { 
    backgroundColor: 'white', 
    margin: 16, 
    marginTop: 8,
    borderRadius: 12, 
    padding: 20, 
    elevation: 2 
  },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  summaryItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    margin: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    backgroundColor: '#f3f4f6', 
    borderRadius: 20 
  },
  summaryText: { fontSize: 12, color: '#374151', marginLeft: 6 },
  fieldSizeText: { 
    fontSize: 14, 
    color: '#16a34a', 
    fontWeight: '500', 
    marginTop: 12, 
    textAlign: 'center' 
  },
  section: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 12, 
    padding: 20, 
    elevation: 2 
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  sectionSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  confidenceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  confidenceText: { fontSize: 12, fontWeight: '600' },
  primaryCard: { 
    backgroundColor: '#f0f9f0', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#bbf7d0' 
  },
  varietyName: { fontSize: 24, fontWeight: 'bold', color: '#065f46', marginBottom: 8 },
  varietyDescription: { fontSize: 14, color: '#374151', marginBottom: 16, lineHeight: 20 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, marginBottom: 16 },
  detailItem: { width: '50%', padding: 8 },
  detailLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#111827', marginTop: 2 },
  riskIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  riskLabel: { fontSize: 14, color: '#374151', marginRight: 8 },
  riskBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  riskText: { fontSize: 12, fontWeight: '600' },
  confidenceContainer: { marginBottom: 20, backgroundColor: '#f9fafb', padding: 16, borderRadius: 12 },
  confidenceTitle: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 12 },
  confidenceItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  confidenceVariety: { width: 80, fontSize: 14, color: '#374151' },
  confidenceBarContainer: { flex: 1, height: 20, backgroundColor: '#e5e7eb', borderRadius: 10, marginHorizontal: 12, overflow: 'hidden' },
  confidenceBar: { height: '100%', borderRadius: 10 },
  confidencePercentage: { width: 40, fontSize: 14, fontWeight: '500', textAlign: 'right' },
  alternativesContainer: { marginTop: 8 },
  alternativeCard: { 
    backgroundColor: '#f9fafb', 
    borderRadius: 8, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  alternativeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alternativeName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  alternativeConfidence: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  alternativeConfidenceText: { fontSize: 12, fontWeight: '600', color: '#1e40af' },
  alternativeDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alternativeYield: { fontSize: 14, color: '#374151' },
  alternativeRisk: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  alternativeRiskText: { fontSize: 12, fontWeight: '500' },
  detailsCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  detailContent: { flex: 1, marginLeft: 12 },
  detailTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  detailDescription: { fontSize: 14, color: '#4b5563' },
  profitText: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  fertilizerCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f0f9f0', 
    padding: 16, 
    borderRadius: 12 
  },
  fertilizerText: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 14, 
    color: '#374151', 
    lineHeight: 20 
  },
  adviceCard: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    backgroundColor: '#fffbeb', 
    padding: 16, 
    borderRadius: 12 
  },
  adviceText: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 14, 
    color: '#92400e', 
    lineHeight: 20 
  },
  actionButtons: { 
  flexDirection: 'row', 
  flexWrap: 'wrap',
  marginHorizontal: 16, 
  marginBottom: 20,
  marginTop: 8,
  justifyContent: 'space-between'
},
actionButton: { 
  flexDirection: 'row', 
  alignItems: 'center', 
  justifyContent: 'center', 
  padding: 12,
  borderRadius: 10,
  marginBottom: 8,
  width: '48%', 
  minHeight: 60
},
actionButtonText: { 
  fontSize: 13, 
  fontWeight: '600', 
  color: 'white', 
  marginLeft: 6 
},
  saveButton: { backgroundColor: '#16a34a' },
  shareButton: { backgroundColor: '#3b82f6' },
  planButton: { backgroundColor: '#8b5cf6' },
  actionButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: 'white', 
    marginLeft: 8 
  },
  disclaimer: { 
    backgroundColor: '#f3f4f6', 
    marginHorizontal: 16, 
    marginBottom: 40, 
    padding: 16, 
    borderRadius: 12 
  },
  disclaimerText: { 
    fontSize: 12, 
    color: '#6b7280', 
    textAlign: 'center', 
    lineHeight: 18 
  },

  profitButton: { backgroundColor: '#f59e0b' },
});

export default CropRecommendationResultsScreen;