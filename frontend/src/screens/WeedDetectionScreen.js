import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

export default function WeedDetectionScreen() {
  const [image, setImage] = useState(null);

  // 📷 Open Camera
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Camera access is needed');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 🖼 Open Gallery
  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Gallery access is needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weed Detection</Text>

      <Pressable style={[styles.button, styles.cameraBtn]} onPress={openCamera}>
        <Text style={styles.btnText}>📷 Take Photo</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.galleryBtn]} onPress={openGallery}>
        <Text style={styles.btnText}>🖼 Choose from Gallery</Text>
      </Pressable>

      {image && (
        <Image source={{ uri: image }} style={styles.image} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraBtn: {
    backgroundColor: '#dc2626',
  },
  galleryBtn: {
    backgroundColor: '#2563eb',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 250,
    marginTop: 20,
    borderRadius: 10,
  },
});
