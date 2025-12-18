import React, { useState } from 'react';
import { encode as btoa } from 'base-64';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function WeedIdentifyScreen() {
  const [image, setImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
const [boxCount, setBoxCount] = useState(0);
const [accuracy, setAccuracy] = useState(0);
  // 📷 Camera
  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required');
      return;
    }

    const res = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setImage(uri);
      sendToBackend(uri);
    }
  };

  // 🖼 Gallery
  const openGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setImage(uri);
      sendToBackend(uri);
    }
  };

  // 🔥 SEND IMAGE TO YOLO BACKEND
 const sendToBackend = async (uri) => {
  setIsAnalyzing(true);
  setShowResults(false);

  const formData = new FormData();
  formData.append('image', {
    uri: uri,
    name: 'weed.jpg',
    type: 'image/jpeg',
  });

  try {
    const response = await fetch('http://192.168.8.156:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    // මෙතන JSON එකට parse කරන්න
    const json = await response.json();

    // json.image = base64 encoded image
    const imageUrl = `data:image/jpeg;base64,${json.image}`;

    // set detection data to state
    setBoxCount(json.box_count);
    setAccuracy(json.accuracy);
    setResultImage(imageUrl);
    setShowResults(true);
  } catch (error) {
    Alert.alert('Error', 'Backend connection failed');
    console.log(error);
  } finally {
    setIsAnalyzing(false);
  }
};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weed Detection</Text>
        <Text style={styles.subtitle}>YOLO-based Weed Identification</Text>
      </View>

      <View style={styles.card}>
        {/* Image Area */}
        <View style={styles.imageBox}>
          {image ? (
            <>
              <Image
                source={{ uri: resultImage || image }}
                style={styles.image}
              />
              {isAnalyzing && (
                <View style={styles.overlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Analyzing...</Text>
                </View>
              )}
            </>
          ) : (
           <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>
                Upload an image to detect weeds
              </Text>
            </View>

          )}
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <Pressable style={styles.camBtn} onPress={openCamera}>
            <Text style={styles.btnText}>📷 Camera</Text>
          </Pressable>
          <Pressable style={styles.galBtn} onPress={openGallery}>
            <Text style={styles.btnText}>🖼 Gallery</Text>
          </Pressable>
        </View>

        {/* Result */}
        {showResults && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Detection Completed ✔</Text>
            <Text style={styles.resultDesc}>
              Detected weeds are highlighted using bounding boxes.
            </Text>
 <View style={styles.summaryHeader}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.summaryTitle}>Detection Summary</Text>
              </View>

 <View style={styles.summaryCards}>
               <View style={styles.summaryCard}>
  <Text style={[styles.summaryNumber, { color: "#ef4444" }]}>
    {accuracy}%
  </Text>
  <Text style={styles.summaryLabel}>Accuracy</Text>
</View>

<View style={styles.summaryCard}>
  <Text style={[styles.summaryNumber, { color: "#f59e0b" }]}>
    {boxCount}
  </Text>
  <Text style={styles.summaryLabel}>Types Detected</Text>
</View>
              </View>



          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e3b27' },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#14532d',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#dcfce7' },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 24,
  },
  imageBox: {
    height: 300,
    backgroundColor: '#059669',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { color: '#fff', fontSize: 16 },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
   placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.75,
  },

  loadingText: { color: '#fff', marginTop: 10 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  camBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  galBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
   summarySection: {
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
  resultBox: { marginTop: 20 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#166534' },
  resultDesc: { color: '#374151', marginTop: 6 },
});
