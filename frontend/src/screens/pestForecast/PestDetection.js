import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function PestDetection() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [fertilizerTab, setFertilizerTab] = useState('pest'); // 'pest' or 'fertilizer'

  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermission();
    ImagePicker.requestMediaLibraryPermissionsAsync();
  }, []);

  const openCamera = () => {
    if (!permission?.granted) {
      Alert.alert("Camera permission required");
      return;
    }
    setCameraVisible(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    setCameraVisible(false);
    setImage(photo);
    detectPest(photo);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });

    if (!result.canceled) {
      const img = result.assets[0];
      setImage(img);
      detectPest(img);
    }
  };

  const detectPest = async (img) => {
    try {
      setLoading(true);
      setFertilizerTab('pest'); // Reset to pest tab on new detection

      const formData = new FormData();
      formData.append("image", {
        uri: img.uri,
        type: "image/jpeg",
        name: "pest.jpg"
      });

      const response = await fetch(
        "http://192.168.1.105:5005/api/pest-detection/detect",
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data"
          },
          body: formData
        }
      );

      const data = await response.json();
      console.log("Detection result:", data);

      if (data.success) {
        setAnnotatedImage(data.data?.annotated_image || data.annotated_image);

        if (data.no_detections) {
          setResults({
            detections: []
          });
        } else {
          setResults({
            detections: data.data.detections
          });
        }
        setShowResults(true);
      } else {
        Alert.alert("Detection Failed", data.error);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to connect to detection server");
    } finally {
      setLoading(false);
    }
  };

  const resetDetection = () => {
    setImage(null);
    setResults(null);
    setAnnotatedImage(null);
    setShowResults(false);
    setFertilizerTab('pest');
  };

  // Get fertilizer recommendations based on detected pest
  const getFertilizerRecommendations = (pestName) => {
    const pestLower = pestName.toLowerCase();
    
    // Brown Planthopper (BPH) recommendations
    if (pestLower.includes('brown') || pestLower.includes('planthopper') || pestLower.includes('bph')) {
      return {
        fertilizers: [
          {
            name: 'Potassium (K) - Muriate of Potash',
            reason: 'Strengthens plant cell walls and reduces BPH attraction',
            application: 'Apply 60-80 kg/ha at tillering and panicle initiation'
          },
          {
            name: 'Silicon - Calcium Silicate',
            reason: 'Creates physical barrier against BPH feeding',
            application: 'Apply 500 kg/ha as basal dressing'
          },
          {
            name: 'Zinc - Zinc Sulfate',
            reason: 'Improves plant vigor and resistance',
            application: 'Apply 25 kg/ha at planting'
          }
        ],
        avoid: [
          'Excessive Nitrogen - Reduces plant resistance',
          'Urea - Can increase BPH population',
          'Ammonium-based fertilizers'
        ],
        tips: [
          'Split nitrogen application into 3-4 doses',
          'Avoid nitrogen during peak BPH infestation',
          'Maintain 2-3 cm water level during fertilizer application'
        ]
      };
    }
    
    // Rice Leaf-folder recommendations
    else if (pestLower.includes('leaf') && pestLower.includes('folder')) {
      return {
        fertilizers: [
          {
            name: 'Nitrogen (N) - Urea (controlled)',
            reason: 'Promotes healthy leaf growth but apply carefully',
            application: 'Apply 40-50 kg/ha in split doses'
          },
          {
            name: 'Potassium (K) - Potash',
            reason: 'Enhances leaf toughness and reduces feeding',
            application: 'Apply 40-60 kg/ha at tillering'
          },
          {
            name: 'Phosphorus (P) - DAP/TSP',
            reason: 'Strengthens root system',
            application: 'Apply 30-40 kg/ha as basal'
          }
        ],
        avoid: [
          'Excessive Nitrogen - Makes leaves soft and attractive',
          'Late Nitrogen application - Promotes new growth during infestation',
          'Foliar sprays during active feeding'
        ],
        tips: [
          'Use slow-release nitrogen fertilizers',
          'Apply fertilizers when fields are drained',
          'Combine fertilizer with light traps for better control'
        ]
      };
    }
    
    // Paddy Bug recommendations
    else if (pestLower.includes('paddy') || pestLower.includes('bug')) {
      return {
        fertilizers: [
          {
            name: 'Phosphorus (P) - Triple Super Phosphate',
            reason: 'Promotes grain filling and development',
            application: 'Apply 40-50 kg/ha at planting'
          },
          {
            name: 'Potassium (K) - Muriate of Potash',
            reason: 'Improves grain quality and reduces damage',
            application: 'Apply 50-60 kg/ha at panicle initiation'
          },
          {
            name: 'Boron - Borax',
            reason: 'Prevents grain sterility',
            application: 'Apply 5-10 kg/ha at booting stage'
          }
        ],
        avoid: [
          'Excessive Nitrogen - Increases grain susceptibility',
          'Late season Nitrogen - Prolongs grain filling period',
          'Fertilizers during flowering stage'
        ],
        tips: [
          'Time fertilizer application before flowering',
          'Use balanced NPK ratio (4:2:4)',
          'Avoid water stress during grain filling'
        ]
      };
    }
    
    // Default recommendations for unknown pests
    return {
      fertilizers: [
        {
          name: 'Balanced NPK - 15:15:15',
          reason: 'General purpose fertilizer for rice',
          application: 'Apply 100-120 kg/ha as basal'
        },
        {
          name: 'Urea (Nitrogen)',
          reason: 'Promotes vegetative growth',
          application: 'Split apply 40-50 kg/ha at 15, 30, 45 DAT'
        },
        {
          name: 'Potash (K)',
          reason: 'Improves overall plant health',
          application: 'Apply 40 kg/ha at tillering and panicle initiation'
        }
      ],
      avoid: [
        'Excessive fertilizer application',
        'Fertilizers during drought or flood',
        'Single large dose of nitrogen'
      ],
      tips: [
        'Conduct soil test before fertilizer application',
        'Apply fertilizers in split doses',
        'Maintain proper water level during application'
      ]
    };
  };

  // Get general fertilizer tips for no detection
  const getGeneralFertilizerTips = () => {
    return {
      fertilizers: [
        {
          name: 'Basal Fertilizer - DAP + MOP + Urea',
          reason: 'Foundation for healthy crop growth',
          application: 'DAP 50 kg/ha + MOP 40 kg/ha + Urea 30 kg/ha at planting'
        },
        {
          name: 'Top Dressing 1 - Urea',
          reason: 'Promotes tillering',
          application: 'Urea 50 kg/ha at 15-20 days after transplanting'
        },
        {
          name: 'Top Dressing 2 - Urea + MOP',
          reason: 'Supports panicle initiation',
          application: 'Urea 40 kg/ha + MOP 30 kg/ha at 40-45 DAT'
        },
        {
          name: 'Panicle Fertilizer - Urea',
          reason: 'Enhances grain filling',
          application: 'Urea 30 kg/ha at booting stage'
        }
      ],
      tips: [
        'Conduct soil test for accurate recommendations',
        'Maintain 2-3 cm water level during fertilizer application',
        'Split nitrogen into 3-4 applications',
        'Avoid fertilizer during extreme weather',
        'Incorporate organic manure 2 weeks before planting'
      ]
    };
  };

  const renderFertilizerContent = () => {
    if (!results?.detections || results.detections.length === 0) {
      const generalTips = getGeneralFertilizerTips();
      return (
        <View style={styles.fertilizerContainer}>
          <Text style={styles.fertilizerTitle}>🌾 General Fertilizer Schedule</Text>
          {generalTips.fertilizers.map((fert, index) => (
            <View key={index} style={styles.fertilizerCard}>
              <Text style={styles.fertilizerName}>{fert.name}</Text>
              <Text style={styles.fertilizerReason}>{fert.reason}</Text>
              <Text style={styles.fertilizerApp}>📝 {fert.application}</Text>
            </View>
          ))}
          
          <Text style={styles.tipsTitle}>💡 Best Practices</Text>
          {generalTips.tips.map((tip, index) => (
            <Text key={index} style={styles.tipText}>• {tip}</Text>
          ))}
        </View>
      );
    }

    // Show recommendations for each detected pest
    return results.detections.map((detection, index) => {
      const recommendations = getFertilizerRecommendations(detection.class);
      return (
        <View key={index} style={styles.fertilizerContainer}>
          <Text style={styles.fertilizerTitle}>
            🌱 Fertilizer Plan for {detection.class}
          </Text>
          
          <Text style={styles.subTitle}>✅ Recommended Fertilizers:</Text>
          {recommendations.fertilizers.map((fert, idx) => (
            <View key={idx} style={styles.fertilizerCard}>
              <Text style={styles.fertilizerName}>{fert.name}</Text>
              <Text style={styles.fertilizerReason}>• {fert.reason}</Text>
              <Text style={styles.fertilizerApp}>📌 {fert.application}</Text>
            </View>
          ))}
          
          <Text style={styles.subTitle}>❌ Avoid:</Text>
          {recommendations.avoid.map((item, idx) => (
            <Text key={idx} style={styles.avoidText}>• {item}</Text>
          ))}
          
          <Text style={styles.subTitle}>💡 Tips:</Text>
          {recommendations.tips.map((tip, idx) => (
            <Text key={idx} style={styles.tipText}>• {tip}</Text>
          ))}
          
          {index < results.detections.length - 1 && <View style={styles.divider} />}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paddy Pest Detection</Text>

      {!image && !cameraVisible && !loading && (
        <View style={styles.options}>
          <TouchableOpacity style={styles.card} onPress={openCamera}>
            <MaterialCommunityIcons name="camera" size={40} color="#0369a1" />
            <Text style={styles.cardTitle}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={pickImage}>
            <MaterialCommunityIcons name="image" size={40} color="#f59e0b" />
            <Text style={styles.cardTitle}>Choose Image</Text>
          </TouchableOpacity>
        </View>
      )}

      {cameraVisible && (
        <CameraView style={styles.camera} ref={cameraRef}>
          <TouchableOpacity style={styles.capture} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </CameraView>
      )}

      {image && !loading && !showResults && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
        </View>
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text>Analyzing Image...</Text>
        </View>
      )}

      <Modal visible={showResults} animationType="slide">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowResults(false)} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Detection Results</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, fertilizerTab === 'pest' && styles.activeTab]}
            onPress={() => setFertilizerTab('pest')}
          >
            <MaterialCommunityIcons 
              name="bug" 
              size={20} 
              color={fertilizerTab === 'pest' ? '#16a34a' : '#6b7280'} 
            />
            <Text style={[styles.tabText, fertilizerTab === 'pest' && styles.activeTabText]}>
              Pest Info
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, fertilizerTab === 'fertilizer' && styles.activeTab]}
            onPress={() => setFertilizerTab('fertilizer')}
          >
            <MaterialCommunityIcons 
              name="sprout" 
              size={20} 
              color={fertilizerTab === 'fertilizer' ? '#16a34a' : '#6b7280'} 
            />
            <Text style={[styles.tabText, fertilizerTab === 'fertilizer' && styles.activeTabText]}>
              Fertilizer Plan
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.resultContainer}>
          {/* Annotated Image */}
          {annotatedImage && (
            <Image
              source={{ uri: annotatedImage }}
              style={styles.annotatedImage}
            />
          )}

          {fertilizerTab === 'pest' ? (
            // Pest Information Tab
            <>
              {results?.detections?.length === 0 ? (
                <View style={styles.noPestCard}>
                  <MaterialCommunityIcons name="check-circle" size={50} color="#16a34a" />
                  <Text style={styles.noPestText}>✅ No Pest Detected</Text>
                  <Text style={styles.noPestSubText}>Your crop looks healthy!</Text>
                </View>
              ) : (
                results?.detections?.map((detection, index) => (
                  <View key={index} style={styles.resultCard}>
                    <View style={styles.pestHeader}>
                      <MaterialCommunityIcons name="bug" size={24} color="#dc2626" />
                      <Text style={styles.pestName}>
                        {detection.class || detection.yolo_class}
                      </Text>
                    </View>

                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        {(detection.confidence * 100).toFixed(1)}% Confidence
                      </Text>
                    </View>

                    <Text style={styles.section}>📝 Description</Text>
                    <Text style={styles.sectionText}>{detection.pest_details.description}</Text>

                    <Text style={styles.section}>⚠️ Symptoms</Text>
                    {detection.pest_details.symptoms.map((s, i) => (
                      <Text key={i} style={styles.listItem}>• {s}</Text>
                    ))}

                    <Text style={styles.section}>🔧 Management</Text>
                    {detection.pest_details.management.map((m, i) => (
                      <Text key={i} style={styles.listItem}>• {m}</Text>
                    ))}
                  </View>
                ))
              )}
            </>
          ) : (
            // Fertilizer Recommendations Tab
            <View style={styles.fertilizerMainContainer}>
              {renderFertilizerContent()}
            </View>
          )}

          <TouchableOpacity style={styles.newButton} onPress={resetDetection}>
            <MaterialCommunityIcons name="camera" size={20} color="#fff" />
            <Text style={styles.newButtonText}>New Detection</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 60,
    alignItems: "center"
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#111827"
  },
  options: {
    flexDirection: "row",
    gap: 20
  },
  card: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardTitle: {
    marginTop: 10,
    fontWeight: "600",
    color: "#374151"
  },
  camera: {
    flex: 1,
    width: "100%"
  },
  capture: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ffffff50",
    justifyContent: "center",
    alignItems: "center"
  },
  captureInner: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#fff"
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center"
  },
  previewImage: {
    width: 350,
    height: 350,
    resizeMode: "contain"
  },
  loading: {
    alignItems: "center",
    marginTop: 50
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827"
  },
  closeButton: {
    padding: 8
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    gap: 8
  },
  activeTab: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#16a34a"
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280"
  },
  activeTabText: {
    color: "#16a34a",
    fontWeight: "600"
  },
  resultContainer: {
    flex: 1,
    padding: 20
  },
  annotatedImage: {
    width: "100%",
    height: 250,
    resizeMode: "contain",
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#f3f4f6"
  },
  resultCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  pestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  pestName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    flex: 1
  },
  confidenceBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 15
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a"
  },
  section: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
    color: "#374151"
  },
  sectionText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20
  },
  listItem: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
    paddingLeft: 8
  },
  noPestCard: {
    padding: 30,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20
  },
  noPestText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16a34a",
    marginTop: 10
  },
  noPestSubText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 5
  },
  // Fertilizer styles
  fertilizerMainContainer: {
    marginBottom: 20
  },
  fertilizerContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2
  },
  fertilizerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 15
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 10,
    marginBottom: 8
  },
  fertilizerCard: {
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a"
  },
  fertilizerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 5
  },
  fertilizerReason: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 5,
    fontStyle: "italic"
  },
  fertilizerApp: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500"
  },
  avoidText: {
    fontSize: 14,
    color: "#dc2626",
    marginBottom: 4,
    paddingLeft: 8
  },
  tipText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
    paddingLeft: 8
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 15,
    marginBottom: 8
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 15
  },
  newButton: {
    flexDirection: "row",
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 30
  },
  newButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  }
});