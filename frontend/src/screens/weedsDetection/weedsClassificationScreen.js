import { View, Text, Image, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function WeedsClassificationScreen() {
  const [image, setImage] = useState(null);

  // 📷 Camera
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Camera access is needed');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // 🖼 Gallery
  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Gallery access is needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Weed Scan</Text>

      {/* Scan Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scan Weeds</Text>

        <View style={styles.imageBox}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
           <Pressable onPress={openCamera}>
             <View style={styles.placeholder}>
    <Text style={styles.placeholderIcon}>📷</Text>
     <Text style={styles.placeholderText}>
                    Upload an image to detect weeds
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

        <Pressable style={styles.scanBtn}>
          <Text style={styles.scanText}>Scan for Weeds</Text>
        </Pressable>
      </View>

      {/* Detection Results */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detection Results</Text>

        <View style={styles.resultHeader}>
          <View style={styles.thumb} />
          <View>
            <Text style={styles.weedName}>Common Ragweed</Text>
            <Text style={styles.confidence}>Detected with 92% confidence</Text>
          </View>
        </View>

        <View style={styles.stageRow}>
          <Text style={styles.stage}>Stage 1</Text>
          <Text style={styles.stage}>Stage 2</Text>
          <Text style={[styles.stage, styles.activeStage]}>Stage 3</Text>
          <Text style={styles.stage}>Stage 4</Text>
        </View>

        <View style={styles.recommendBox}>
         
        
          <Text style={styles.recommendText}>
            Recommendation : Apply selective herbicide in early treatment and solutions
          </Text>
            <Text style={styles.recommendText}>Sciencefic name :</Text>
          <Text style={styles.recommendText}>Weeds category Broadleaf,grass,sedge:</Text>
          <Text style={styles.recommendText}>Reason for growth :</Text>
           <Text style={styles.recommendText}>Weed Severity :Hign medium Low</Text>
        </View>
      </View>





      {/* Recent Scans */}
      <View style={styles.card}>
        <View style={styles.recentHeader}>
          <Text style={styles.cardTitle}>Recent Scans</Text>
          <Ionicons name="refresh" size={18} />
        </View>

        <View style={styles.recentItem}>
          <View style={styles.thumbSmall} />
          <View style={{ flex: 1 }}>
            <Text style={styles.weedName}>Wild Oat</Text>
            <Text style={styles.confidence}>Today, 10:30 AM</Text>
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
    backgroundColor: '#438f4dff',
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
     color: '#ffffffff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 10,
  },
  
  placeholderIcon: {
    fontSize: 45,
    marginBottom: 16,
    opacity: 0.5,
  },
  placeholderText: {
    color: '#191212ff',
    fontSize: 15,
    opacity: 0.75,
  },
  imageBox: {
    height: 180,
    borderRadius: 10,
    backgroundColor: '#bae0c6ff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
   placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  iconRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 12,
  },
  scanBtn: {
    marginTop: 14,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  weedName: {
    fontWeight: '600',
  },
  confidence: {
    fontSize: 12,
    color: '#6b7280',
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  stage: {
    backgroundColor: '#dcfce7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontSize: 12,
  },
  activeStage: {
    backgroundColor: '#16a34a',
    color: '#fff',
  },
  recommendBox: {
    backgroundColor: '#fefce8',
    borderLeftWidth: 4,
    borderLeftColor: '#eab308',
    padding: 10,
    borderRadius: 6,
  },
  recommendText: {
    fontSize: 13,
    marginBottom: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  thumbSmall: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  riskHigh: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
  },
});
