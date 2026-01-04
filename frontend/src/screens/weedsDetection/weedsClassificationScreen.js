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

export default function WeedsClassificationScreen() {
  const [image, setImage] = useState(null);
  const [predictedWeed, setPredictedWeed] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);

  // 📷 Open Camera
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
      setPredictedWeed(null);
      setConfidence(null);
    }
  };

  // 🖼 Open Gallery
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
      setPredictedWeed(null);
      setConfidence(null);
    }
  };

  // 🔍 Send image to backend for prediction
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

      // <-- Change this to your PC IP accessible by your device/emulator! -->
      const response = await fetch("http://192.168.8.156:5000/weed_predict", {
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
      } else {
        Alert.alert("Prediction error", data.error || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Network error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🌱 Weeds Scanner</Text>
      <Text style={styles.subHeader}>
        Take or upload a photo to identify weeds
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scan Weeds</Text>

        <View style={styles.imageBox}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Pressable onPress={openCamera}>
              <View style={styles.placeholder}>
                <Ionicons name="camera" size={50} color="#166534" />
                <Text style={styles.placeholderText}>Tap to Scan Weeds</Text>
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
          style={[styles.scanBtn, loading && { backgroundColor: "#4caf50aa" }]}
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detection Result</Text>

        {predictedWeed ? (
          <View style={styles.resultHeader}>
            <View style={styles.thumb} />
            <View>
              <Text style={styles.weedName}>{predictedWeed}</Text>
              <Text style={styles.confidence}>
                Accuracy: {parseFloat(confidence).toFixed(2)}%
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: "#166534", fontStyle: "italic" }}>
            No detection result yet.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
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
    backgroundColor: "#ffffff",
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
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    marginTop: 10,
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
});
