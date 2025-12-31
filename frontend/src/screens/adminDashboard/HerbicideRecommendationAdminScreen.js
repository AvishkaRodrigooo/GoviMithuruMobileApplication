import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { db } from '../../firebase/firebaseConfig';
import firebase from '../../firebase/firebaseConfig';

export default function HerbicideRecommendationAdminScreen({ navigation, route }) {
  const herbicide = route.params?.herbicide;

  const [category, setCategory] = useState(herbicide?.category || '');
  const [genericName, setGenericName] = useState(herbicide?.genericName || '');
  const [tradeName, setTradeName] = useState(herbicide?.tradeName || '');
  const [imageUrl, setImageUrl] = useState(herbicide?.imageUrl || '');
  const [dilution, setDilution] = useState(herbicide?.dilution || '');
  const [sprayingTime, setSprayingTime] = useState(herbicide?.sprayingTime || '');
  const [modeOfAction, setModeOfAction] = useState(herbicide?.modeOfAction || '');
  const [loading, setLoading] = useState(false);

  const saveRecommendation = async () => {
    if (!category || !genericName || !tradeName) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        category,
        genericName,
        tradeName,
        imageUrl: imageUrl || null,
        dilution,
        sprayingTime,
        modeOfAction,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (herbicide) {
        await db.collection('herbicides').doc(herbicide.id).update(payload);
        Alert.alert('Updated', 'Herbicide updated successfully');
      } else {
        await db.collection('herbicides').add({
          ...payload,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        Alert.alert('Success', 'Herbicide added successfully');
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Category *</Text>
      <RNPickerSelect
        onValueChange={setCategory}
        value={category}
        items={[
          { label: 'Pre-plant', value: 'Pre-plant' },
          { label: 'One-shot herbicides', value: 'One-shot herbicides' },
          { label: 'Grass Killers', value: 'Grass Killers' },
          { label: 'Sedges and Broadleaf Killers', value: 'Sedges and Broadleaf Killers' },
        ]}
        placeholder={{ label: 'Select category', value: null }}
        style={pickerSelectStyles}
      />

      <Text style={styles.label}>Generic Name </Text>
      <TextInput style={styles.input} value={genericName} onChangeText={setGenericName} />

      <Text style={styles.label}>Trade Name </Text>
      <TextInput style={styles.input} value={tradeName} onChangeText={setTradeName} />

      <Text style={styles.label}>Image URL</Text>
      <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} />

      <Text style={styles.label}>Dilution (product per 16l of water)</Text>
      <TextInput style={styles.input} value={dilution} onChangeText={setDilution} />

      <Text style={styles.label}>Spraying Time (days after estab- lishment)</Text>
      <TextInput style={styles.input} value={sprayingTime} onChangeText={setSprayingTime} />

      <Text style={styles.label}>Mode of Action</Text>
      <TextInput style={styles.input} value={modeOfAction} onChangeText={setModeOfAction} />

      {loading ? (
        <ActivityIndicator size="large" color="#16a34a" />
      ) : (
        <TouchableOpacity style={styles.submitButton} onPress={saveRecommendation}>
          <Text style={styles.submitButtonText}>
            {herbicide ? 'Update Recommendation' : 'Add Recommendation'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

/* STYLES */

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 15, fontWeight: '600', marginVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

const pickerSelectStyles = {
  inputIOS: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  inputAndroid: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
};
