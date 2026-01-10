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

/* 🔹 Reusable Category Card */
const CategoryCard = ({ title, icon, children }) => (
  <View style={styles.categoryCard}>
    <Text style={styles.categoryTitle}>
      {icon} {title}
    </Text>
    {children}
  </View>
);

export default function WeedsClassificationScreen() {
  const [image, setImage] = useState(null);
  const [predictedWeed, setPredictedWeed] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [weedDetails, setWeedDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  /* 📷 Camera */
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

  /* 🖼 Gallery */
  const openGallery = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
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
  };

  /* 🔍 Predict Weed */
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

      const response = await fetch(
        "http://192.168.8.156:5000/weed_predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPredictedWeed(data.predicted_weed);
        setConfidence(data.confidence);
        setWeedDetails(data.details);
      } else {
        Alert.alert("Prediction Error", data.error);
      }
    } catch (error) {
      Alert.alert("Network Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🌱 Weeds Identification</Text>
      <Text style={styles.subHeader}>
        Take or upload a photo to identify weeds
      </Text>

      {/* Scan Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scan Weeds</Text>

        <View style={styles.imageBox}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Pressable onPress={openCamera}>
              <View style={styles.placeholder}>
                <Ionicons name="camera" size={50} color="#166534" />
                <Text style={styles.placeholderText}>
                  Tap to Scan Weeds
                </Text>
              </View>
            </Pressable>
          )}

          <View style={styles.iconRow}>
            <Pressable onPress={openCamera}>
              <Ionicons name="camera-outline" size={22} />
            </Pressable>
            <Pressable onPress={openGallery}>
              <Ionicons name="image-outline" size={22} />
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

      {/* Result Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detection Result</Text>

        {!predictedWeed && (
          <Text style={styles.emptyText}>
            No detection result yet.
          </Text>
        )}

        {predictedWeed && (
          <>
            <View style={styles.resultHeader}>
              <View style={styles.thumb} />
              <View>
                <Text style={styles.weedName}>{predictedWeed}</Text>
                <Text style={styles.confidence}>
                  Accuracy: {confidence.toFixed(2)}%
                </Text>
              </View>
            </View>

            {weedDetails && (
              <View style={{ marginTop: 14 }}>
                <CategoryCard title="Basic Information" icon="🌿">
                  <Text style={styles.detailText}>
                    Sinhala: {weedDetails.sinhala_name}
                  </Text>
                  <Text style={styles.detailText}>
                    English: {weedDetails.english_name}
                  </Text>
                  <Text style={styles.detailText}>
                    Scientific: {weedDetails.scientific_name}
                  </Text>
                  <Text style={styles.detailText}>
                    Type: {weedDetails.type}
                  </Text>
                </CategoryCard>

                <CategoryCard title="Distribution" icon="📍">
                  {weedDetails.distribution?.map((i, idx) => (
                    <Text key={idx} style={styles.listItem}>
                      • {i}
                    </Text>
                  ))}
                </CategoryCard>

                <CategoryCard title="Morphology" icon="🌱">
                  {weedDetails.morphology?.map((i, idx) => (
                    <Text key={idx} style={styles.listItem}>
                      • {i}
                    </Text>
                  ))}
                </CategoryCard>

                <CategoryCard title="Reproduction" icon="🌾">
                  {weedDetails.reproduction?.map((i, idx) => (
                    <Text key={idx} style={styles.listItem}>
                      • {i}
                    </Text>
                  ))}
                </CategoryCard>

                <CategoryCard title="Impact on Paddy" icon="⚠">
                  {weedDetails.impact_on_paddy?.map((i, idx) => (
                    <Text key={idx} style={styles.listItem}>
                      • {i}
                    </Text>
                  ))}
                </CategoryCard>

                <CategoryCard title="Weed Management" icon="🛠">
                  {weedDetails.management?.mechanical && (
                    <Text style={styles.detailText}>
                      🔧 Mechanical:{" "}
                      {weedDetails.management.mechanical}
                    </Text>
                  )}

                  {weedDetails.management?.cultural && (
                    <>
                      <Text style={styles.managementTitle}>
                        🌱 Cultural
                      </Text>
                      {weedDetails.management.cultural.map(
                        (i, idx) => (
                          <Text
                            key={idx}
                            style={styles.listItem}
                          >
                            • {i}
                          </Text>
                        )
                      )}
                    </>
                  )}

                  {weedDetails.management?.chemical && (
                    <Text style={styles.detailText}>
                      🧪 Chemical:{" "}
                      {weedDetails.management.chemical}
                    </Text>
                  )}
                </CategoryCard>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
    padding: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#14532d",
  },
  subHeader: {
    fontSize: 14,
    color: "#166534",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#14532d",
    marginBottom: 12,
  },
  imageBox: {
    height: 200,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  placeholder: {
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#166534",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  iconRow: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    gap: 16,
    backgroundColor: "#ffffffcc",
    padding: 8,
    borderRadius: 20,
  },
  scanBtn: {
    marginTop: 18,
    backgroundColor: "#15803d",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  scanText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#166534",
    fontStyle: "italic",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#bbf7d0",
  },
  weedName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#14532d",
  },
  confidence: {
    fontSize: 13,
    color: "#166534",
  },
  categoryCard: {
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#14532d",
    marginBottom: 3,
  },
  listItem: {
    fontSize: 13,
    color: "#166534",
    marginLeft: 6,
    marginBottom: 2,
  },
  managementTitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#14532d",
  },
});
