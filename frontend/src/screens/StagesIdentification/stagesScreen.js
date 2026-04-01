import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Share
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const StagesScreen = () => {
  const [plantingDate, setPlantingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [variety, setVariety] = useState("BG300");
  const [leafCount, setLeafCount] = useState("");
  const [tillersCount, setTillersCount] = useState("");
  const [plantHeight, setPlantHeight] = useState("");
  const [leafColor, setLeafColor] = useState("Green");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const calculateDAP = () => {
    const today = new Date();
    const diff = today - plantingDate;
    const dap = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dap >= 0 ? dap : 0;
  };
  const dapValue = calculateDAP();

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (!selectedDate) return;

    const today = new Date();
    if (selectedDate > today) {
      Alert.alert("Invalid Date", "Future dates are not allowed");
      return;
    }
    setPlantingDate(selectedDate);
  };

  const validateInputs = () => {
    // DAP <15  validate 
    if (dapValue < 15) {
      return true;
    }
    
    // DAP >=15  fields validate 
    if (!leafCount || !tillersCount || !plantHeight) {
      Alert.alert("Error", "Please fill all numeric fields");
      return false;
    }
    
    const leaf = parseInt(leafCount);
    const tillers = parseInt(tillersCount);
    const height = parseFloat(plantHeight);

    if (isNaN(leaf) || leaf < 1 || leaf > 50) {
      Alert.alert("Error", "Leaf count must be 1–50");
      return false;
    }
    if (isNaN(tillers) || tillers < 1 || tillers > 20) {
      Alert.alert("Error", "Tillers count must be 1–20");
      return false;
    }
    if (isNaN(height) || height < 10 || height > 200) {
      Alert.alert("Error", "Plant height must be 10-200 cm");
      return false;
    }
    if (tillers > leaf) {
  Alert.alert(
    "Invalid Input",
    `Tillers count (${tillers}) cannot be greater than Leaf count (${leaf}).\n\nThis is not agriculturally realistic.`
  );
  return false;
}
    
    return true;
  };

  const identifyStage = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      // DAP payload
      let payload;
      
      if (dapValue < 15) {
        // DAP <15 default values send
        payload = {
          variety: variety,
          dap: dapValue,
          leaf_count: 1,  // Default value
          tillers: 1,      // Default value
          height: 10,      // Default value
          leaf_color: leafColor
        };
      } else {
        // DAP >=15  user input values send 
        payload = {
          variety: variety,
          dap: dapValue,
          leaf_count: parseInt(leafCount),
          tillers: parseInt(tillersCount),
          height: parseFloat(plantHeight),
          leaf_color: leafColor
        };
      }
      
      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("http://172.23.54.254:5000/predict-stage", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      console.log("Parsed response:", data);
      
      setResult(data);
      setModalVisible(true);
      
    } catch (error) {
      console.log("Error details:", error);
      
      let errorMessage = "Cannot connect to server";
      
      if (error.message.includes("Network request failed")) {
        errorMessage = "Network error. Check if server is running.";
      } else if (error.message.includes("JSON parse")) {
        errorMessage = "Invalid response from server";
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPlantingDate(new Date());
    setLeafCount("");
    setTillersCount("");
    setPlantHeight("");
    setLeafColor("Green");
    setVariety("BG300");
    setResult(null);
    setModalVisible(false);
  };

  // Generate PDF Report
  const generateReport = async () => {
    if (!result) return;
    
    setGeneratingReport(true);
    
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Paddy Growth Stage Report</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              padding: 30px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #2d5016;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #2d5016;
              font-size: 28px;
              margin-bottom: 5px;
            }
            .header h2 {
              color: #666;
              font-size: 16px;
              font-weight: normal;
            }
            .stage-icon {
              font-size: 60px;
              text-align: center;
              margin: 20px 0;
            }
            .stage-name {
              font-size: 24px;
              color: #2d5016;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
            }
            .stage-name-sinhala {
              font-size: 20px;
              color: #2d5016;
              text-align: center;
              margin: 5px 0 20px 0;
            }
            .dap-info {
              text-align: center;
              background: #f0f8e8;
              padding: 15px;
              border-radius: 10px;
              margin: 20px 0;
              font-size: 18px;
              color: #2d5016;
            }
            .section {
              margin: 25px 0;
              padding: 20px;
              background: #f9f9f9;
              border-radius: 10px;
              border-left: 5px solid #2d5016;
            }
            .section-title {
              font-size: 20px;
              color: #2d5016;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 8px;
            }
            .section-title-sinhala {
              font-size: 16px;
              color: #666;
              margin-top: 5px;
            }
            .input-summary {
              background: #e8f4fd;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
            }
            .input-summary h3 {
              color: #0066cc;
              margin-bottom: 15px;
            }
            .input-item {
              margin: 8px 0;
              font-size: 15px;
            }
            .recommendation-item {
              margin: 10px 0;
              padding-left: 20px;
              line-height: 1.6;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #888;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .badge {
              display: inline-block;
              padding: 5px 15px;
              background: #2d5016;
              color: white;
              border-radius: 20px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            td {
              padding: 10px;
              border: 1px solid #ddd;
            }
            td.label {
              font-weight: bold;
              width: 40%;
              background: #f5f5f5;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌾 Paddy Growth Stage Report</h1>
            <h2>Generated on: ${new Date().toLocaleString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</h2>
          </div>

          <div class="stage-icon">${result.recommendations?.icon || '🌾'}</div>
          <div class="stage-name">${result.growth_stage}</div>
          <div class="stage-name-sinhala">${result.recommendations?.stage_name_sinhala || result.growth_stage}</div>

          <div class="dap-info">
            <strong>${result.recommendations?.dap_range || `DAP: ${dapValue} days`}</strong>
          </div>

          ${result.recommendations?.description ? `
            <div class="section">
              <div class="section-title">📖 Stage Description</div>
              <div class="section-title-sinhala">අවදිය පිළිබඳ විස්තරය</div>
              <p style="font-size: 16px; line-height: 1.8; font-style: italic; color: #5d4037;">
                ${result.recommendations.description}
              </p>
            </div>
          ` : ''}

          <div class="input-summary">
            <h3>📋 Input Summary / ඇතුළත් කළ තොරතුරු</h3>
            <table>
              <tr>
                <td class="label">Planting Date / සිටුවූ දිනය</td>
                <td>${plantingDate.toLocaleDateString('en-US')}</td>
              </tr>
              <tr>
                <td class="label">Current DAP / වත්මන් DAP</td>
                <td>${dapValue} days</td>
              </tr>
              <tr>
                <td class="label">Paddy Variety / වී ප්‍රභේදය</td>
                <td>${variety}</td>
              </tr>
              <tr>
                <td class="label">Leaf Color / පත්‍රයේ පාට</td>
                <td>${leafColor}</td>
              </tr>
              ${dapValue < 15 ? `
                <tr>
                  <td class="label">Leaf Count / පත්‍ර ගණන</td>
                  <td>Auto (1) - DAP < 15</td>
                </tr>
                <tr>
                  <td class="label">Tillers Count / ටිලර් ගණන</td>
                  <td>Auto (1) - DAP < 15</td>
                </tr>
                <tr>
                  <td class="label">Plant Height / උස</td>
                  <td>Auto (10 cm) - DAP < 15</td>
                </tr>
              ` : `
                <tr>
                  <td class="label">Leaf Count / පත්‍ර ගණන</td>
                  <td>${leafCount}</td>
                </tr>
                <tr>
                  <td class="label">Tillers Count / ටිලර් ගණන</td>
                  <td>${tillersCount}</td>
                </tr>
                <tr>
                  <td class="label">Plant Height / උස</td>
                  <td>${plantHeight} cm</td>
                </tr>
              `}
            </table>
          </div>

          ${result.recommendations ? `
            <div class="section">
              <div class="section-title">🌱 Fertilizer Recommendations</div>
              <div class="section-title-sinhala">පොහොර යෙදීම</div>
              ${result.recommendations.fertilizer.items.map(item => 
                `<div class="recommendation-item">• ${item}</div>`
              ).join('')}
            </div>

            <div class="section">
              <div class="section-title">💧 Water Management</div>
              <div class="section-title-sinhala">ජල කළමනාකරණය</div>
              ${result.recommendations.water_management.items.map(item => 
                `<div class="recommendation-item">• ${item}</div>`
              ).join('')}
            </div>

            <div class="section">
              <div class="section-title">🌿 Weed Control</div>
              <div class="section-title-sinhala">වල් පාලනය</div>
              ${result.recommendations.weed_control.items.map(item => 
                `<div class="recommendation-item">• ${item}</div>`
              ).join('')}
            </div>
          ` : ''}

          <div class="footer">
            <p>© Paddy Growth Stage Identifier - Agricultural Advisory System</p>
            <p>This report is generated based on the input data provided. For accurate results, please consult with agricultural experts.</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Growth Stage Report',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Success', `Report saved to: ${uri}`);
      }

    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Share Report as Text
  const shareTextReport = async () => {
    if (!result) return;

    try {
      const reportText = `
🌾 PADDY GROWTH STAGE REPORT
═══════════════════════════

📅 Generated: ${new Date().toLocaleString()}

STAGE INFORMATION:
${result.recommendations?.icon || '🌾'} Stage: ${result.growth_stage}
📖 ${result.recommendations?.stage_name_sinhala || result.growth_stage}
📊 DAP Range: ${result.recommendations?.dap_range || `DAP: ${dapValue} days`}

${result.recommendations?.description ? `📝 DESCRIPTION:
${result.recommendations.description}
` : ''}

📋 INPUT SUMMARY:
• Planting Date: ${plantingDate.toLocaleDateString()}
• Current DAP: ${dapValue} days
• Variety: ${variety}
• Leaf Color: ${leafColor}
${dapValue < 15 ? 
  '• Leaf Count: Auto (1) - DAP < 15\n• Tillers: Auto (1) - DAP < 15\n• Height: Auto (10 cm) - DAP < 15' : 
  `• Leaf Count: ${leafCount}\n• Tillers: ${tillersCount}\n• Height: ${plantHeight} cm`
}

RECOMMENDATIONS:

🌱 FERTILIZER:
${result.recommendations?.fertilizer.items.map(item => `  • ${item}`).join('\n')}

💧 WATER MANAGEMENT:
${result.recommendations?.water_management.items.map(item => `  • ${item}`).join('\n')}

🌿 WEED CONTROL:
${result.recommendations?.weed_control.items.map(item => `  • ${item}`).join('\n')}

═══════════════════════════
Generated by Paddy Growth Stage Identifier
      `;

      await Share.share({
        message: reportText,
        title: 'Paddy Growth Stage Report'
      });
    } catch (error) {
      console.error('Error sharing text:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };

  // DAP <15  fields disable 
  const isFieldsDisabled = dapValue < 15;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Paddy Plant Growth Stage Identifier</Text>

      {/* Planting Date */}
      <View style={styles.section}>
        <Text style={styles.label}>Planting Date  සිටුවූ දිනය</Text>
        <TouchableOpacity 
          style={styles.dateButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{plantingDate.toDateString()}</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={plantingDate}
          mode="date"
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      <View style={[styles.dapBox, isFieldsDisabled && styles.dapBoxWarning]}>
        <Text style={styles.dapText}>DAP : {dapValue} Days</Text>
        {isFieldsDisabled && (
          <Text style={styles.warningText}>
            ⚠️ DAP 15 ට අඩුයි. Identify Stage button එක disable වෙලා.
          </Text>
        )}
      </View>

      {/* Variety */}
      <View style={styles.section}>
        <Text style={[styles.label, isFieldsDisabled && styles.disabledLabel]}>
          Paddy Variety  වී ප්‍රභේදය
        </Text>
        <View style={[styles.picker, isFieldsDisabled && styles.disabledPicker]}>
          <Picker 
            selectedValue={variety} 
            onValueChange={setVariety}
            enabled={!isFieldsDisabled}
          >
            <Picker.Item label="BG300" value="BG300"/>
            <Picker.Item label="BG352" value="BG352"/>
            <Picker.Item label="BG366" value="BG366"/>
          </Picker>
        </View>
      </View>

      {/* Leaf Count */}
      <View style={styles.section}>
        <Text style={[styles.label, isFieldsDisabled && styles.disabledLabel]}>
          Leaf Count  පත්‍ර/පදුරු ගණන {isFieldsDisabled && '(Auto: 1)'}
        </Text>
        <View style={[styles.inputContainer, isFieldsDisabled && styles.disabledContainer]}>
          <TextInput
            style={[styles.input, isFieldsDisabled && styles.disabledInput]}
            keyboardType="numeric"
            placeholder="Enter leaf count (1-15)"
            value={leafCount}
            onChangeText={setLeafCount}
            editable={!isFieldsDisabled}
            placeholderTextColor={isFieldsDisabled ? "#999" : "#ccc"}
          />
        </View>
      </View>

      {/* Tillers */}
      <View style={styles.section}>
        <Text style={[styles.label, isFieldsDisabled && styles.disabledLabel]}>
          Tillers Count  ටිලර් ගණන {isFieldsDisabled && '(Auto: 1)'}
        </Text>
        <View style={[styles.inputContainer, isFieldsDisabled && styles.disabledContainer]}>
          <TextInput
            style={[styles.input, isFieldsDisabled && styles.disabledInput]}
            keyboardType="numeric"
            placeholder="Enter tillers count (1-20)"
            value={tillersCount}
            onChangeText={setTillersCount}
            editable={!isFieldsDisabled}
            placeholderTextColor={isFieldsDisabled ? "#999" : "#ccc"}
          />
        </View>
      </View>

      {/* Height */}
      <View style={styles.section}>
        <Text style={[styles.label, isFieldsDisabled && styles.disabledLabel]}>
          Plant Height (cm)  උස{isFieldsDisabled && '(Auto: 10)'}
        </Text>
        <View style={[styles.inputContainer, isFieldsDisabled && styles.disabledContainer]}>
          <TextInput
            style={[styles.input, isFieldsDisabled && styles.disabledInput]}
            keyboardType="numeric"
            placeholder="Enter plant height (10-200 cm)"
            value={plantHeight}
            onChangeText={setPlantHeight}
            editable={!isFieldsDisabled}
            placeholderTextColor={isFieldsDisabled ? "#999" : "#ccc"}
          />
        </View>
      </View>

      {/* Leaf Color */}
      <View style={styles.section}>
        <Text style={[styles.label, isFieldsDisabled && styles.disabledLabel]}>
          Leaf Color  පත්‍රයේ පාට
        </Text>
        <View style={[styles.picker, isFieldsDisabled && styles.disabledPicker]}>
          <Picker 
            selectedValue={leafColor} 
            onValueChange={setLeafColor}
            enabled={!isFieldsDisabled}
          >
            <Picker.Item label="Dark Green තද කොළ" value="Dark Green"/>
            <Picker.Item label="Green කොළ" value="Green"/>
            <Picker.Item label="Light Green ලා කොළ" value="Light Green"/>
            <Picker.Item label="Yellow කහ" value="Yellow"/>
          </Picker>
        </View> 
      </View>

      {/* Buttons - Identify Stage button DAP disable/enable */}
      <TouchableOpacity 
        style={[
          styles.button, 
          (loading || isFieldsDisabled) && styles.buttonDisabled
        ]} 
        onPress={identifyStage}
        disabled={loading || isFieldsDisabled}
      >
        {loading ? 
          <ActivityIndicator color="#fff"/> : 
          <Text style={styles.buttonText}>
            {isFieldsDisabled ? 'Disabled (DAP < 15)' : 'Identify Stage'}
          </Text>
        }
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={resetForm}
      >
        <Text style={styles.resetText}>Reset</Text>
      </TouchableOpacity>

      {/* Result Modal with Recommendations and Description */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Growth Stage Result</Text>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {result && (
                <>
                  <View style={styles.resultIconContainer}>
                    <Text style={styles.resultIcon}>
                      {result.recommendations?.icon || '🌾'}
                    </Text>
                  </View>
                  
                  <Text style={styles.modalStageText}>
                    {result.recommendations?.stage_name_sinhala || result.growth_stage}
                  </Text>
                  
                  <Text style={styles.dapRangeText}>
                    {result.recommendations?.dap_range || `DAP: ${dapValue} days`}
                  </Text>

                  {/* Stage Description */}
                  {result.recommendations?.description && (
                    <View style={styles.descriptionBox}>
                      <View style={styles.descriptionHeader}>
                        <Text style={styles.descriptionIcon}>📖</Text>
                        <Text style={styles.descriptionTitle}>අවදිය පිළිබඳ විස්තරය</Text>
                      </View>
                      <Text style={styles.descriptionText}>
                        {result.recommendations.description}
                      </Text>
                    </View>
                  )}

                  {/* Input Summary */}
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>📋 ඇතුළත් කළ තොරතුරු</Text>
                    <Text style={styles.summaryText}>🌾 ප්‍රභේදය: {variety}</Text>
                    <Text style={styles.summaryText}>📅 වත්මන් DAP: {dapValue} දින</Text>
                    <Text style={styles.summaryText}>🎨 පත්‍ර පාට: {leafColor}</Text>
                    {dapValue < 15 ? (
                      <>
                        <Text style={styles.summaryText}>🍃 පත්‍ර ගණන: ස්වයංක්‍රීය (1)</Text>
                        <Text style={styles.summaryText}>🌱 ටිලර් ගණන: ස්වයංක්‍රීය (1)</Text>
                        <Text style={styles.summaryText}>📏 උස: ස්වයංක්‍රීය (10 cm)</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.summaryText}>🍃 පත්‍ර ගණන: {leafCount}</Text>
                        <Text style={styles.summaryText}>🌱 ටිලර් ගණන: {tillersCount}</Text>
                        <Text style={styles.summaryText}>📏 උස: {plantHeight} cm</Text>
                      </>
                    )}
                  </View>

                  {/* Recommendations */}
                  {result.recommendations && (
                    <View style={styles.recommendationsContainer}>
                      
                      {/* Fertilizer Section */}
                      <View style={styles.recommendationSection}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionIcon}>🌱</Text>
                          <Text style={styles.sectionTitle}>{result.recommendations.fertilizer.title}</Text>
                        </View>
                        {result.recommendations.fertilizer.items.map((item, index) => (
                          <Text key={index} style={styles.recommendationItem}>• {item}</Text>
                        ))}
                      </View>

                      {/* Water Management Section */}
                      <View style={styles.recommendationSection}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionIcon}>💧</Text>
                          <Text style={styles.sectionTitle}>{result.recommendations.water_management.title}</Text>
                        </View>
                        {result.recommendations.water_management.items.map((item, index) => (
                          <Text key={index} style={styles.recommendationItem}>• {item}</Text>
                        ))}
                      </View>

                      {/* Weed Control Section */}
                      <View style={styles.recommendationSection}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionIcon}>🌿</Text>
                          <Text style={styles.sectionTitle}>{result.recommendations.weed_control.title}</Text>
                        </View>
                        {result.recommendations.weed_control.items.map((item, index) => (
                          <Text key={index} style={styles.recommendationItem}>• {item}</Text>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              {/* Report Generation Buttons */}
              <TouchableOpacity 
                style={[styles.modalButton, styles.reportButton]} 
                onPress={generateReport}
                disabled={generatingReport}
              >
                {generatingReport ? 
                  <ActivityIndicator color="#fff" size="small" /> : 
                  <Text style={styles.modalButtonText}>📄 PDF Report</Text>
                }
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.shareButton]} 
                onPress={shareTextReport}
              >
                <Text style={styles.modalButtonText}>📱 Share Text</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSecondary]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4"
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2d5016"
  },
  section: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "500",
    color: "#333"
  },
  disabledLabel: {
    color: "#888"
  },
  inputContainer: {
    borderRadius: 6,
    overflow: 'hidden'
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
    fontSize: 16
  },
  disabledContainer: {
    backgroundColor: '#f0f0f0',
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
    color: '#888',
    borderColor: '#aaa',
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff"
  },
  disabledPicker: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7
  },
  button: {
    backgroundColor: "#2d5016",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10
  },
  buttonDisabled: {
    backgroundColor: "#a0a0a0",
    opacity: 0.6
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },
  resetButton: {
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10
  },
  resetText: {
    fontWeight: "bold",
    color: "#333"
  },
  dateButton: {
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6
  },
  dapBox: {
    backgroundColor: "#fff3e0",
    padding: 15,
    marginBottom: 20,
    borderRadius: 8
  },
  dapBoxWarning: {
    backgroundColor: "#ffecb3",
    borderWidth: 1,
    borderColor: "#ffb74d"
  },
  dapText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff9800",
    textAlign: "center"
  },
  warningText: {
    fontSize: 12,
    color: "#f57c00",
    textAlign: "center",
    marginTop: 5,
    fontWeight: "500"
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  modalHeader: {
    backgroundColor: '#2d5016',
    padding: 15,
    alignItems: 'center'
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  modalBody: {
    padding: 20,
    maxHeight: 500
  },
  resultIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#2d5016'
  },
  resultIcon: {
    fontSize: 45
  },
  modalStageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 5,
    textAlign: 'center'
  },
  dapRangeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  descriptionBox: {
    width: '100%',
    backgroundColor: '#fff9e6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffd966',
    borderLeftWidth: 5,
    borderLeftColor: '#f9a825',
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  descriptionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b75e00',
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: '#5d4037',
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'justify',
    paddingHorizontal: 5,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: '#e8f4fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#b8e0ff'
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 10
  },
  summaryText: {
    fontSize: 14,
    color: '#444',
    marginVertical: 3
  },
  recommendationsContainer: {
    width: '100%',
    marginTop: 5
  },
  recommendationSection: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5016',
    flex: 1
  },
  recommendationItem: {
    fontSize: 14,
    color: '#555',
    marginVertical: 4,
    lineHeight: 20,
    paddingLeft: 10
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexWrap: 'wrap',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '33.33%',
  },
  reportButton: {
    backgroundColor: '#2d5016',
  },
  shareButton: {
    backgroundColor: '#1976d2',
  },
  modalButtonSecondary: {
    backgroundColor: '#fff'
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  modalButtonTextSecondary: {
    color: '#2d5016'
  }
});

export default StagesScreen;