import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function WeedsClassificationScreen() {
  const [image, setImage] = useState(null);

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
    }
  };

  // 🖼 Open Gallery
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
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 🌱 Header */}
      <Text style={styles.header}>🌱 Weeds Scanner</Text>
      <Text style={styles.subHeader}>
        Take or upload a photo to identify weeds
      </Text>

      {/* 📸 Scan Card */}
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

          {/* Icons */}
          <View style={styles.iconRow}>
            <Pressable onPress={openCamera}>
              <Ionicons name="camera-outline" size={22} />
            </Pressable>
            <Pressable onPress={openGallery}>
              <Ionicons name="image-outline" size={22} />
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.scanBtn}>
          <Text style={styles.scanText}>Identify Weeds</Text>
        </Pressable>
      </View>

      {/* 🌾 Detection Results */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detection Result</Text>

        <View style={styles.resultHeader}>
          <View style={styles.thumb} />
          <View>
            <Text style={styles.weedName}>Common Ragweed</Text>
            <Text style={styles.confidence}>Accuracy: 92%</Text>
          </View>
        </View>

        {/* Growth Stage */}
        <View style={styles.stageRow}>
          <Text style={styles.stage}>Stage 1</Text>
          <Text style={styles.stage}>Stage 2</Text>
          <Text style={[styles.stage, styles.activeStage]}>
            Stage 3
          </Text>
          <Text style={styles.stage}>Stage 4</Text>
        </View>

        {/* Recommendation */}
        <View style={styles.recommendBox}>
          <Text style={styles.recommendText}>
            ✅ Recommended Action:
          </Text>
          <Text style={styles.recommendText}>
            Apply selective herbicide during early growth stage.
          </Text>
          <Text style={styles.recommendText}>
            Scientific Name: Ambrosia artemisiifolia
          </Text>
          <Text style={styles.recommendText}>
            Weed Type: Broadleaf
          </Text>
          <Text style={styles.recommendText}>
            Severity Level: High
          </Text>
        </View>
      </View>

      {/* 🕒 Recent Scans */}
      <View style={styles.card}>
        <View style={styles.recentHeader}>
          <Text style={styles.cardTitle}>Recent Scans</Text>
          <Ionicons name="refresh" size={18} />
        </View>

        <View style={styles.recentItem}>
          <View style={styles.thumbSmall} />
          <View style={{ flex: 1 }}>
            <Text style={styles.weedName}>Wild Oat</Text>
            <Text style={styles.confidence}>Today - 10:30 AM</Text>
          </View>
          <Text style={styles.riskHigh}>High Risk</Text>
        </View>
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

  stageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 14,
  },

  stage: {
    backgroundColor: "#dcfce7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 12,
    color: "#166534",
  },

  activeStage: {
    backgroundColor: "#15803d",
    color: "#fff",
  },

  recommendBox: {
    backgroundColor: "#fef9c3",
    borderLeftWidth: 5,
    borderLeftColor: "#ca8a04",
    padding: 12,
    borderRadius: 8,
  },

  recommendText: {
    fontSize: 14,
    marginBottom: 6,
    color: "#713f12",
  },

  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },

  thumbSmall: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#bbf7d0",
  },

  riskHigh: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "600",
  },
});
