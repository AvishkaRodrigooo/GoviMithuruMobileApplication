import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../../utils/apiConfig";

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

  /*  Gallery */
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
        setCurrentPage(2); // Move to results page
      } else {
        Alert.alert("Prediction Error", data.error);
      }
    } catch (error) {
      Alert.alert("Network Error", error.message);
    } finally {
      setLoading(false);
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

      {/* Content Area */}
      <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
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
                  🎯 Accuracy: {confidence.toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
              <Text style={styles.infoText}>
                Weed successfully identified! Navigate through the pages to see detailed
                information.
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
    </View>
  );
}

/* 🎨 Styles */
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
});