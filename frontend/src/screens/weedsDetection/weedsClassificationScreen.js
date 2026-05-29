import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../../utils/apiConfig";
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

/*Reusable Category Card */
const CategoryCard = ({ title, icon, children }) => (
  <View style={styles.categoryCard}>
    <Text style={styles.categoryTitle}>
      {icon} {title}
    </Text>
    {children}
  </View>
);

export default function WeedsClassificationScreen() {
  const [currentPage, setCurrentPage] = useState(1);
  const [image, setImage] = useState(null);
  const [predictedWeed, setPredictedWeed] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [weedDetails, setWeedDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportNotes, setReportNotes] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);

  /*Camera */
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is needed");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      resetResult();
    }
  };

  /* Gallery */
  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery access is needed");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      resetResult();
    }
  };

  const resetResult = () => {
    setPredictedWeed(null);
    setConfidence(null);
    setWeedDetails(null);
    setCurrentPage(1);
    setReportNotes("");
  };

  /* Predict Weed */
  const identifyWeeds = async () => {
    if (!image) {
      Alert.alert("No image", "Please select or take a photo first");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", {
        uri: image,
        name: "photo.jpg",
        type: "image/jpeg",
      });


      const response = await fetch("http://10.11.204.131:5000/weed_predict", {

      const response = await fetch(`${BASE_URL}/weed_predict`, {

        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setPredictedWeed(data.predicted_weed);
        setConfidence(data.confidence);
        setWeedDetails(data.details);
        setCurrentPage(2);

        Alert.alert("Success", "Weed identified successfully!");
      } else {
        Alert.alert("Prediction Error", data.error || "Unknown error occurred");
      }
    } catch (error) {
      Alert.alert("Network Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  /* Generate Text Report with Detection Results */
  const generateTextReport = async () => {
    if (!predictedWeed) {
      Alert.alert("Error", "No weed identified yet. Please identify a weed first.");
      setReportModalVisible(false);
      return;
    }

    if (!weedDetails) {
      Alert.alert("Error", "Weed details not available. Please try again.");
      setReportModalVisible(false);
      return;
    }

    setGeneratingReport(true);

    try {
      const now = new Date();

      // Create report header
      let reportContent = `════════════════════════════════════════════════════\n`;
      reportContent += `         🌾 WEED IDENTIFICATION REPORT 🌾\n`;
      reportContent += `════════════════════════════════════════════════════\n\n`;

      reportContent += `📅 DATE: ${now.toLocaleDateString()}\n`;
      reportContent += `⏰ TIME: ${now.toLocaleTimeString()}\n`;
      reportContent += `🆔 REPORT ID: WD-${Date.now()}\n\n`;

      // DETECTION RESULTS SECTION
      reportContent += `════════════════════════════════════════════════════\n`;
      reportContent += `          🔍 DETECTION RESULTS\n`;
      reportContent += `════════════════════════════════════════════════════\n\n`;

      reportContent += `🌿 IDENTIFIED WEED: ${predictedWeed || 'N/A'}\n`;
      reportContent += `🎯 CONFIDENCE LEVEL: ${confidence ? confidence.toFixed(2) : 'N/A'}%\n`;

      if (confidence) {
        if (confidence >= 90) {
          reportContent += `📊 ACCURACY RATING: Excellent - Very High Confidence\n`;
        } else if (confidence >= 80) {
          reportContent += `📊 ACCURACY RATING: Good - High Confidence\n`;
        } else if (confidence >= 70) {
          reportContent += `📊 ACCURACY RATING: Moderate - Medium Confidence\n`;
        } else {
          reportContent += `📊 ACCURACY RATING: Low - Please verify manually\n`;
        }
      }

      if (image) {
        reportContent += `📸 IMAGE SOURCE: User captured/uploaded image\n`;
      }

      reportContent += `\n════════════════════════════════════════════════════\n`;
      reportContent += `              BASIC INFORMATION\n`;
      reportContent += `════════════════════════════════════════════════════\n\n`;
      reportContent += `🇱🇰 SINHALA NAME  : ${weedDetails?.sinhala_name || 'N/A'}\n`;
      reportContent += `🇬🇧 ENGLISH NAME  : ${weedDetails?.english_name || 'N/A'}\n`;
      reportContent += `🔬 SCIENTIFIC NAME: ${weedDetails?.scientific_name || 'N/A'}\n`;
      reportContent += `🌱 TYPE          : ${weedDetails?.type || 'N/A'}\n\n`;

      // DISTRIBUTION
      reportContent += `════════════════════════════════════════════════════\n`;
      reportContent += `                 DISTRIBUTION\n`;
      reportContent += `════════════════════════════════════════════════════\n\n`;

      if (weedDetails?.distribution && weedDetails.distribution.length > 0) {
        weedDetails.distribution.forEach(item => {
          reportContent += `   • ${item}\n`;
        });
      } else {
        reportContent += `   No distribution data available\n`;
      }
      reportContent += `\n`;

      // MORPHOLOGY
      reportContent += `════════════════════════════════════════════════════\n`;
      reportContent += `                 MORPHOLOGY\n`;
      reportContent += `════════════════════════════════════════════════════\n\n`;

      if (weedDetails?.morphology && weedDetails.morphology.length > 0) {
        weedDetails.morphology.forEach(item => {
          reportContent += `   • ${item}\n`;
        });
      } else {
        reportContent += `   No morphology data available\n`;
      }
      reportContent += `\n`;

      // REPRODUCTION
      reportContent += `════════════════════════════════════════════════════\n`;
      reportContent += `                REPRODUCTION\n`;
      reportContent += `════════════════════════════════════════════════════\n\n`;

      if (weedDetails?.reproduction && weedDetails.reproduction.length > 0) {
        weedDetails.reproduction.forEach(item => {
          reportContent += `   • ${item}\n`;
        });
      } else {
        reportContent += `   No reproduction data available\n`;
      }
      reportContent += `\n`;

      // IMPACT ON PADDY
      reportContent += `════════════════════════════════════════════════════\n`;
      reportContent += `              IMPACT ON PADDY\n`;
      reportContent += `════════════════════════════════════════════════════\n\n`;

      if (weedDetails?.impact_on_paddy && weedDetails.impact_on_paddy.length > 0) {
        weedDetails.impact_on_paddy.forEach(item => {
          reportContent += `   ⚠️ ${item}\n`;
        });
      } else {
        reportContent += `   No impact data available\n`;
      }
      reportContent += `\n`;

      // WEED MANAGEMENT
      reportContent += `════════════════════════════════════════════════════\n`;
      reportContent += `              WEED MANAGEMENT\n`;
      reportContent += `════════════════════════════════════════════════════\n`;

      if (weedDetails?.management) {
        if (weedDetails.management.mechanical) {
          reportContent += `\n🔧 MECHANICAL CONTROL:\n${weedDetails.management.mechanical}\n`;
        }
        if (weedDetails.management.cultural && weedDetails.management.cultural.length > 0) {
          reportContent += `\n🌱 CULTURAL CONTROL:\n`;
          weedDetails.management.cultural.forEach(item => {
            reportContent += `   • ${item}\n`;
          });
        }
        if (weedDetails.management.chemical) {
          reportContent += `\n🧪 CHEMICAL CONTROL:\n${weedDetails.management.chemical}\n`;
        }
      } else {
        reportContent += `\n   No management data available\n`;
      }

      // ADDITIONAL NOTES
      if (reportNotes && reportNotes.trim()) {
        reportContent += `\n════════════════════════════════════════════════════\n`;
        reportContent += `              ADDITIONAL NOTES\n`;
        reportContent += `════════════════════════════════════════════════════\n\n`;
        reportContent += `${reportNotes}\n\n`;
      }

      // RECOMMENDATIONS
      reportContent += `════════════════════════════════════════════════════\n`;
      reportContent += `           📌 RECOMMENDATIONS\n`;
      reportContent += `════════════════════════════════════════════════════\n\n`;

      reportContent += `1. Based on the detection results, take appropriate action\n`;
      reportContent += `2. Implement control measures as suggested in management section\n`;
      reportContent += `3. Monitor the affected area regularly for re-growth\n`;
      reportContent += `4. Consult with agricultural extension officer if infestation is severe\n`;
      reportContent += `5. Keep this report for future reference\n\n`;

      reportContent += `════════════════════════════════════════════════════\n`;
      reportContent += `      End of Report - Weeds Identification System\n`;
      reportContent += `════════════════════════════════════════════════════\n`;

      // --- NEW FileSystem API (File class) ---
      const safeWeedName = predictedWeed?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
      const fileName = `Weed_Report_${safeWeedName}_${Date.now()}.txt`;

      // Create a File object for the document directory
      const reportFile = new File(Paths.document, fileName);

      // Write content to file (file is created automatically)
      await reportFile.write(reportContent);

      // Optional: verify file exists
      const fileInfo = await reportFile.info();
      if (!fileInfo.exists) {
        throw new Error("File was not created");
      }

      // Share the file
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(reportFile.uri, {
          mimeType: 'text/plain',
          dialogTitle: 'Save or Share Weed Report',
        });
      } else {
        Alert.alert('Success', `Report saved to: ${reportFile.uri}`);
      }

      setReportModalVisible(false);
      setReportNotes("");
      Alert.alert('Success', 'Text report generated successfully!');

    } catch (error) {
      Alert.alert('Error', 'Failed to generate report: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  /* Generate PDF Report with Detection Results */
  const generatePDFReport = async () => {
    if (!predictedWeed) {
      Alert.alert("Error", "No weed identified yet. Please identify a weed first.");
      setReportModalVisible(false);
      return;
    }

    if (!weedDetails) {
      Alert.alert("Error", "Weed details not available. Please try again.");
      setReportModalVisible(false);
      return;
    }

    setGeneratingReport(true);

    try {
      const now = new Date();

      // Determine confidence rating
      let confidenceRating = '';
      let confidenceColor = '';
      if (confidence) {
        if (confidence >= 90) {
          confidenceRating = 'Excellent - Very High Confidence';
          confidenceColor = '#16a34a';
        } else if (confidence >= 80) {
          confidenceRating = 'Good - High Confidence';
          confidenceColor = '#2563eb';
        } else if (confidence >= 70) {
          confidenceRating = 'Moderate - Medium Confidence';
          confidenceColor = '#d97706';
        } else {
          confidenceRating = 'Low - Please verify manually';
          confidenceColor = '#dc2626';
        }
      }

      // Create management HTML
      let managementHTML = '';
      if (weedDetails?.management) {
        if (weedDetails.management.mechanical) {
          managementHTML += `
            <div style="background: #f8f9fa; padding: 12px; margin: 10px 0; border-left: 4px solid #16a34a;">
              <strong style="color: #14532d;">🔧 Mechanical Control:</strong>
              <p style="margin: 8px 0 0 0; color: #333;">${weedDetails.management.mechanical}</p>
            </div>
          `;
        }
        if (weedDetails.management.cultural && weedDetails.management.cultural.length > 0) {
          managementHTML += `
            <div style="background: #f8f9fa; padding: 12px; margin: 10px 0; border-left: 4px solid #16a34a;">
              <strong style="color: #14532d;">🌱 Cultural Control:</strong>
              <div style="margin: 8px 0 0 0;">
                ${weedDetails.management.cultural.map(item => `<div style="margin: 4px 0;">• ${item}</div>`).join('')}
              </div>
            </div>
          `;
        }
        if (weedDetails.management.chemical) {
          managementHTML += `
            <div style="background: #f8f9fa; padding: 12px; margin: 10px 0; border-left: 4px solid #16a34a;">
              <strong style="color: #14532d;">🧪 Chemical Control:</strong>
              <p style="margin: 8px 0 0 0; color: #333;">${weedDetails.management.chemical}</p>
            </div>
          `;
        }
      } else {
        managementHTML = '<p>No management data available</p>';
      }

      // Create HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Weed Identification Report - ${predictedWeed}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 30px;
              color: #333;
            }
            .header {
              background: linear-gradient(135deg, #14532d, #166534);
              color: white;
              padding: 25px;
              border-radius: 10px;
              margin-bottom: 25px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0 0 0;
              opacity: 0.9;
            }
            .detection-box {
              background: #f0fdf4;
              border: 2px solid #16a34a;
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
            }
            .weed-name {
              font-size: 32px;
              color: #14532d;
              font-weight: bold;
              margin: 10px 0;
            }
            .confidence-badge {
              display: inline-block;
              padding: 10px 20px;
              border-radius: 25px;
              font-weight: bold;
              margin: 10px 0;
            }
            .section {
              background: white;
              border: 1px solid #dcfce7;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .section-title {
              color: #14532d;
              font-size: 20px;
              font-weight: bold;
              border-bottom: 2px solid #16a34a;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .info-row {
              margin: 10px 0;
              display: flex;
            }
            .label {
              font-weight: bold;
              color: #166534;
              width: 140px;
            }
            .value {
              color: #14532d;
              flex: 1;
            }
            .list-item {
              margin: 8px 0;
              padding-left: 15px;
            }
            .impact-item {
              margin: 8px 0;
              padding-left: 25px;
              position: relative;
            }
            .impact-item:before {
              content: "⚠️";
              position: absolute;
              left: 0;
            }
            .notes {
              background: #fff3cd;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #856404;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #dcfce7;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .recommendations {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 Weed Identification Report</h1>
            <p>Generated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</p>
            <p>Report ID: WD-${Date.now()}</p>
          </div>

          <div class="detection-box">
            <h2 style="margin-top: 0; color: #14532d;">🔍 DETECTION RESULTS</h2>
            <div class="weed-name">${predictedWeed}</div>
            
            <div style="margin: 20px 0;">
              <div style="background: ${confidenceColor}; color: white; padding: 12px 25px; border-radius: 30px; display: inline-block; font-weight: bold; font-size: 18px;">
                Confidence: ${confidence ? confidence.toFixed(2) : 'N/A'}%
              </div>
            </div>
            
            <p style="font-size: 16px; color: #166534; font-weight: bold;">Accuracy Rating: ${confidenceRating}</p>
            
            ${image ? '<p style="margin-top: 15px;">📸 Image captured and analyzed successfully</p>' : ''}
          </div>

          <div class="section">
            <div class="section-title">🌿 Basic Information</div>
            <div class="info-row">
              <span class="label">Sinhala Name:</span>
              <span class="value">${weedDetails?.sinhala_name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">English Name:</span>
              <span class="value">${weedDetails?.english_name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Scientific Name:</span>
              <span class="value">${weedDetails?.scientific_name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Type:</span>
              <span class="value">${weedDetails?.type || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📍 Distribution</div>
            ${weedDetails?.distribution && weedDetails.distribution.length > 0 ?
          weedDetails.distribution.map(item => `<div class="list-item">• ${item}</div>`).join('') :
          '<p>No distribution data available</p>'}
          </div>

          <div class="section">
            <div class="section-title">🌱 Morphology</div>
            ${weedDetails?.morphology && weedDetails.morphology.length > 0 ?
          weedDetails.morphology.map(item => `<div class="list-item">• ${item}</div>`).join('') :
          '<p>No morphology data available</p>'}
          </div>

          <div class="section">
            <div class="section-title">🌾 Reproduction</div>
            ${weedDetails?.reproduction && weedDetails.reproduction.length > 0 ?
          weedDetails.reproduction.map(item => `<div class="list-item">• ${item}</div>`).join('') :
          '<p>No reproduction data available</p>'}
          </div>

          <div class="section">
            <div class="section-title">⚠️ Impact on Paddy</div>
            ${weedDetails?.impact_on_paddy && weedDetails.impact_on_paddy.length > 0 ?
          weedDetails.impact_on_paddy.map(item => `<div class="impact-item">${item}</div>`).join('') :
          '<p>No impact data available</p>'}
          </div>

          <div class="section">
            <div class="section-title">🛠️ Weed Management</div>
            ${managementHTML}
          </div>

          ${reportNotes && reportNotes.trim() ? `
            <div class="notes">
              <strong style="color: #856404;">📝 Additional Notes:</strong><br>
              <p style="margin: 10px 0 0 0;">${reportNotes.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}

          <div class="section">
            <div class="section-title">📌 Recommendations Based on Detection</div>
            <div class="recommendations">
              <div class="list-item">• Based on the detection results (${confidence ? confidence.toFixed(2) : 'N/A'}% confidence), take immediate action</div>
              <div class="list-item">• Implement control measures as suggested in the management section</div>
              <div class="list-item">• Monitor the affected area regularly for re-growth</div>
              <div class="list-item">• Consult with agricultural extension officer if infestation is severe</div>
              <div class="list-item">• Keep this report for future reference and follow-up</div>
            </div>
          </div>

          <div class="footer">
            <p>This report was automatically generated by Weeds Identification System</p>
            <p>Based on AI-powered image analysis and agricultural database</p>
            <p>© ${new Date().getFullYear()} Weeds Identification System</p>
          </div>
        </body>
        </html>
      `;

      // --- NEW FileSystem API (File class) ---
      // Generate PDF using expo-print
      const { uri: tempUri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Create final filename
      const safeWeedName = predictedWeed?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
      const fileName = `Weed_Report_${safeWeedName}_${Date.now()}.pdf`;

      // Create File objects for temp and final locations
      const tempFile = new File(tempUri);
      const finalFile = new File(Paths.document, fileName);

      // Move the file using the new API
      await tempFile.move(finalFile);

      // Share the PDF
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(finalFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save or Share Weed Report',
        });
      } else {
        Alert.alert('Success', `PDF saved to: ${finalFile.uri}`);
      }

      setReportModalVisible(false);
      setReportNotes("");
      Alert.alert('Success', 'PDF report generated successfully!');

    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleNext = () => {
    if (currentPage < 6 && predictedWeed) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToScan = () => {
    setCurrentPage(1);
    resetResult();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.header}>🌱 Weeds Identification</Text>
        <Text style={styles.subHeader}>
          Take or upload a photo to identify weeds
        </Text>
      </View>

      {/* Progress Indicator */}
      {predictedWeed && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentPage - 1) / 5) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.stepIndicators}>
            {[
              { num: 1, label: "Scan" },
              { num: 2, label: "Result" },
              { num: 3, label: "Info" },
              { num: 4, label: "Impact" },
              { num: 5, label: "Manage" },
              { num: 6, label: "Details" },
            ].map((step) => (
              <View key={step.num} style={styles.stepContainer}>
                <View
                  style={[
                    styles.stepCircle,
                    currentPage >= step.num && styles.stepCircleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      currentPage >= step.num && styles.stepNumberActive,
                    ]}
                  >
                    {step.num}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    currentPage === step.num && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Report Button */}
      {predictedWeed && (
        <Pressable
          style={styles.reportButton}
          onPress={() => setReportModalVisible(true)}
        >
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text style={styles.reportButtonText}>Generate Detection Report</Text>
        </Pressable>
      )}

      {/* Content Area */}
      <ScrollView style={styles.contentArea}>
        {/* PAGE 1: SCAN */}
        {currentPage === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Scan Weeds</Text>

            <View style={styles.imageBox}>
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <Pressable onPress={openCamera}>
                  <View style={styles.placeholder}>
                    <Ionicons name="camera" size={60} color="#166534" />
                    <Text style={styles.placeholderText}>Tap to Scan Weeds</Text>
                  </View>
                </Pressable>
              )}

              <View style={styles.iconRow}>
                <Pressable onPress={openCamera} style={styles.iconButton}>
                  <Ionicons name="camera-outline" size={24} color="#166534" />
                </Pressable>
                <Pressable onPress={openGallery} style={styles.iconButton}>
                  <Ionicons name="image-outline" size={24} color="#166534" />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.scanBtn, loading && { opacity: 0.7 }]}
              onPress={identifyWeeds}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.scanText}>Identify Weeds</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* PAGE 2: DETECTION RESULT */}
        {currentPage === 2 && predictedWeed && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✅ Detection Result</Text>

            <View style={styles.resultHeader}>
              <View style={styles.thumb}>
                {image && <Image source={{ uri: image }} style={styles.thumbImage} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.weedName}>{predictedWeed}</Text>
                <Text style={styles.confidence}>
                  🎯 Accuracy: {confidence?.toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
              <Text style={styles.infoText}>
                Weed successfully identified! Click "Generate Detection Report" button above to save the results.
              </Text>
            </View>
          </View>
        )}

        {/* PAGE 3: BASIC INFORMATION */}
        {currentPage === 3 && weedDetails && (
          <View style={styles.card}>
            <CategoryCard title="Basic Information" icon="🌿">
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sinhala Name:</Text>
                <Text style={styles.detailValue}>{weedDetails.sinhala_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>English Name:</Text>
                <Text style={styles.detailValue}>{weedDetails.english_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Scientific Name:</Text>
                <Text style={styles.detailValue}>{weedDetails.scientific_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{weedDetails.type}</Text>
              </View>
            </CategoryCard>

            <CategoryCard title="Distribution" icon="📍">
              {weedDetails.distribution?.map((item, idx) => (
                <Text key={idx} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </CategoryCard>

            <CategoryCard title="Morphology" icon="🌱">
              {weedDetails.morphology?.map((item, idx) => (
                <Text key={idx} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </CategoryCard>
          </View>
        )}

        {/* PAGE 4: REPRODUCTION */}
        {currentPage === 4 && weedDetails && (
          <View style={styles.card}>
            <CategoryCard title="Reproduction" icon="🌾">
              {weedDetails.reproduction?.map((item, idx) => (
                <Text key={idx} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </CategoryCard>
          </View>
        )}

        {/* PAGE 5: IMPACT ON PADDY */}
        {currentPage === 5 && weedDetails && (
          <View style={styles.card}>
            <CategoryCard title="Impact on Paddy" icon="⚠️">
              {weedDetails.impact_on_paddy?.map((item, idx) => (
                <View key={idx} style={styles.impactItem}>
                  <Ionicons name="warning" size={16} color="#dc2626" />
                  <Text style={styles.listItem}>{item}</Text>
                </View>
              ))}
            </CategoryCard>
          </View>
        )}

        {/* PAGE 6: WEED MANAGEMENT */}
        {currentPage === 6 && weedDetails && (
          <View style={styles.card}>
            <CategoryCard title="Weed Management" icon="🛠️">
              {weedDetails.management?.mechanical && (
                <View style={styles.managementSection}>
                  <Text style={styles.managementTitle}>🔧 Mechanical</Text>
                  <Text style={styles.detailText}>{weedDetails.management.mechanical}</Text>
                </View>
              )}

              {weedDetails.management?.cultural && (
                <View style={styles.managementSection}>
                  <Text style={styles.managementTitle}>🌱 Cultural</Text>
                  {weedDetails.management.cultural.map((item, idx) => (
                    <Text key={idx} style={styles.listItem}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}

              {weedDetails.management?.chemical && (
                <View style={styles.managementSection}>
                  <Text style={styles.managementTitle}>🧪 Chemical</Text>
                  <Text style={styles.detailText}>{weedDetails.management.chemical}</Text>
                </View>
              )}
            </CategoryCard>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentPage > 1 ? (
          <>
            <Pressable style={styles.navButton} onPress={handlePrevious}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={styles.navButtonText}>Previous</Text>
            </Pressable>

            {currentPage < 6 ? (
              <Pressable style={styles.navButton} onPress={handleNext}>
                <Text style={styles.navButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
            ) : (
              <Pressable style={styles.scanAgainButton} onPress={goToScan}>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.navButtonText}>Scan Again</Text>
              </Pressable>
            )}
          </>
        ) : null}
      </View>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Detection Report</Text>
              <Pressable onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color="#14532d" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>Weed: {predictedWeed || 'Unknown'}</Text>
            <Text style={styles.modalConfidence}>Detection Confidence: {confidence ? confidence.toFixed(2) : 'N/A'}%</Text>

            <Text style={styles.modalLabel}>Additional Notes (Optional):</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              placeholder="Add your observations, location, date, or any additional notes..."
              value={reportNotes}
              onChangeText={setReportNotes}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.pdfButton]}
                onPress={generatePDFReport}
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="document" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>PDF Report</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.textButton]}
                onPress={generateTextReport}
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="text" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Text Report</Text>
                  </>
                )}
              </Pressable>
            </View>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setReportModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  headerSection: {
    backgroundColor: "#fff",
    padding: 16,
    paddingTop: 50,
    elevation: 2,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#14532d",
  },
  subHeader: {
    fontSize: 14,
    color: "#166534",
    marginTop: 4,
  },
  progressContainer: {
    backgroundColor: "#fff",
    padding: 16,
    elevation: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#dcfce7",
    borderRadius: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 2,
  },
  stepIndicators: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepContainer: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: "#16a34a",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#166534",
  },
  stepNumberActive: {
    color: "#fff",
  },
  stepLabel: {
    fontSize: 10,
    color: "#166534",
  },
  stepLabelActive: {
    fontWeight: "bold",
    color: "#14532d",
  },
  contentArea: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 16,
  },
  imageBox: {
    height: 280,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 16,
  },
  placeholder: {
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#166534",
    fontWeight: "500",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  iconRow: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 25,
    elevation: 4,
  },
  scanBtn: {
    backgroundColor: "#15803d",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  scanText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  weedName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 4,
  },
  confidence: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#166534",
    lineHeight: 20,
  },
  categoryCard: {
    backgroundColor: "#f0fdf4",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#166534",
    width: 120,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: "#14532d",
  },
  detailText: {
    fontSize: 14,
    color: "#14532d",
    marginBottom: 6,
    lineHeight: 20,
  },
  listItem: {
    fontSize: 14,
    color: "#166534",
    marginLeft: 8,
    marginBottom: 6,
    lineHeight: 20,
  },
  impactItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  managementSection: {
    marginBottom: 16,
  },
  managementTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 8,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 8,
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: "#15803d",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scanAgainButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  reportButton: {
    backgroundColor: "#7e22ce",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  reportButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#14532d",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#166534",
    marginBottom: 4,
    fontWeight: "600",
  },
  modalConfidence: {
    fontSize: 14,
    color: "#16a34a",
    marginBottom: 16,
    fontWeight: "600",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14532d",
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#dcfce7",
    borderRadius: 10,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
    fontSize: 14,
    color: "#14532d",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  pdfButton: {
    backgroundColor: "#15803d",
  },
  textButton: {
    backgroundColor: "#7e22ce",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
});