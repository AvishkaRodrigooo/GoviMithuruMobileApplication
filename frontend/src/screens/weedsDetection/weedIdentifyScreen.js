import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

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
      Alert.alert('Permission Required', 'Camera access is needed');
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
      Alert.alert('Permission Required', 'Gallery access is needed');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setImage(uri);
      sendToBackend(uri);
    }
  };

  // 🔥 Send to YOLO backend
  const sendToBackend = async (uri) => {
    setIsAnalyzing(true);
    setShowResults(false);

    const formData = new FormData();
    formData.append('image', {
      uri,
      name: 'weed.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await fetch('http://192.168.8.156:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const json = await response.json();
      setResultImage(`data:image/jpeg;base64,${json.image}`);
      setBoxCount(json.box_count);
      setAccuracy(json.accuracy);
      setShowResults(true);
    } catch (err) {
      Alert.alert('Error', 'Cannot connect to server');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 🌱 Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌱 Weed Scanner</Text>
        <Text style={styles.subtitle}>
          Take a photo to identify weeds in your field
        </Text>
      </View>

      {/* 📸 Scan Card */}
      <View style={styles.card}>
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
                  <Text style={styles.loadingText}>Scanning weeds...</Text>
                </View>
              )}
            </>
          ) : (
            <Pressable onPress={openCamera} style={styles.placeholder}>
              <Ionicons name="camera" size={60} color="#166534" />
              <Text style={styles.placeholderText}>
                Tap to Scan Weed
              </Text>
            </Pressable>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <Pressable style={styles.camBtn} onPress={openCamera}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.btnText}> Camera</Text>
          </Pressable>

          <Pressable style={styles.galBtn} onPress={openGallery}>
            <Ionicons name="image" size={20} color="#fff" />
            <Text style={styles.btnText}> Gallery</Text>
          </Pressable>
        </View>

        {/* 🌾 Results */}
        {showResults && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>
              ✅ Weed Detection Complete
            </Text>

            {/* Summary */}
            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryNumber, { color: '#16a34a' }]}>
                  {accuracy}%
                </Text>
                <Text style={styles.summaryLabel}>Accuracy</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={[styles.summaryNumber, { color: '#dc2626' }]}>
                  {boxCount}
                </Text>
                <Text style={styles.summaryLabel}>Weeds Found</Text>
              </View>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                🌾 Tip: Early weed control helps protect your crop yield.
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },

  header: {
    backgroundColor: '#14532d',
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },

  subtitle: {
    color: '#dcfce7',
    marginTop: 6,
    fontSize: 14,
  },

  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    elevation: 4,
  },

  imageBox: {
    height: 280,
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  image: { width: '100%', height: '100%' },

  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#166534',
    fontWeight: '600',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: { color: '#fff', marginTop: 10 },

  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },

  camBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    padding: 14,
    borderRadius: 12,
  },

  galBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
  },

  btnText: { color: '#fff', fontWeight: 'bold' },

  resultBox: { marginTop: 24 },

  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14532d',
    marginBottom: 16,
  },

  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
  },

  summaryNumber: {
    fontSize: 34,
    fontWeight: 'bold',
  },

  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
  },

  tipBox: {
    backgroundColor: '#fef9c3',
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
  },

  tipText: {
    color: '#713f12',
    fontSize: 14,
  },
});
