/*import React, { useState } from "react";
import { View, Button, Image, StyleSheet, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

export default function WeedDetector() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pick image from phone
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.cancelled) {
      setSelectedImage(result.assets[0].uri);
      setResultImage(null);
    }
  };

  // Upload to backend
  const sendImageToServer = async () => {
  if (!selectedImage) return;

  setLoading(true);

  let formData = new FormData();
  formData.append("image", {
    uri: selectedImage,
    name: "photo.jpg",
    type: "image/jpeg",
  });

  try {
    const response = await axios.post(
      "http://192.168.8.156:5000/predict",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "arraybuffer", // get raw bytes
      }
    );

    // Convert arraybuffer → base64 manually
    const base64String = btoa(
      new Uint8Array(response.data)
        .reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    setResultImage(`data:image/jpeg;base64,${base64String}`);
  } catch (err) {
    console.log("AXIOS ERROR ===>", err);
    alert("Error sending image");
  }

  setLoading(false);
};

  return (
    <View style={styles.container}>
      <Button title="Pick Image" onPress={pickImage} />

      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.image} />
      )}

      {selectedImage && (
        <Button title="Detect Weed" onPress={sendImageToServer} />
      )}

      {loading && <ActivityIndicator size="large" />}

      {resultImage && (
        <>
          <Image source={{ uri: resultImage }} style={styles.image} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: "center" },
  image: { width: 300, height: 300, marginVertical: 20, borderRadius: 8 },
});
*/