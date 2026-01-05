import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/firebaseConfig';

const UpdatePriceScreen = ({ navigation }) => {
  const [pricePerKg, setPricePerKg] = useState('');
  const [variety, setVariety] = useState('White Rice');
  const [minQuantity, setMinQuantity] = useState('100');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [dealerInfo, setDealerInfo] = useState(null);

  useEffect(() => {
    fetchDealerInfo();
    fetchTodayPrice();
  }, []);

  const fetchDealerInfo = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const dealerDoc = await db.collection('users').doc(user.uid).get();
      if (dealerDoc.exists) {
        setDealerInfo(dealerDoc.data());
      }
    } catch (error) {
      console.error('Error fetching dealer info:', error);
    }
  };

  const fetchTodayPrice = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const priceDoc = await db
        .collection('dealerPrices')
        .doc(user.uid)
        .collection('prices')
        .doc(today)
        .get();

      if (priceDoc.exists) {
        const data = priceDoc.data();
        setPricePerKg(data.pricePerKg.toString());
        setVariety(data.variety || 'White Rice');
        setMinQuantity(data.minQuantity?.toString() || '100');
        setNotes(data.notes || '');
      }
    } catch (error) {
      console.error('Error fetching today price:', error);
    }
  };

  const handleUpdatePrice = async () => {
    if (!pricePerKg.trim()) {
      Alert.alert('Error', 'Please enter price per kg');
      return;
    }

    if (isNaN(pricePerKg) || parseFloat(pricePerKg) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const priceData = {
        dealerId: user.uid,
        dealerName: dealerInfo?.businessName || dealerInfo?.name || 'Unknown Dealer',
        dealerEmail: user.email,
        pricePerKg: parseFloat(pricePerKg),
        variety: variety,
        minQuantity: parseInt(minQuantity) || 100,
        notes: notes.trim(),
        date: today,
        updatedAt: new Date(),
        location: dealerInfo?.location || 'Not specified',
        phone: dealerInfo?.phone || '',
      };

      // Save to dealer's own collection
      await db
        .collection('dealerPrices')
        .doc(user.uid)
        .collection('prices')
        .doc(today)
        .set(priceData, { merge: true });

      // Also save to global prices collection for farmers to query
      await db
        .collection('currentRicePrices')
        .doc(user.uid)
        .set(priceData, { merge: true });

      Alert.alert('Success', 'Price updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating price:', error);
      Alert.alert('Error', 'Failed to update price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="cash-multiple" size={50} color="#16a34a" />
        <Text style={styles.title}>Update Today's Price</Text>
        <Text style={styles.subtitle}>
          Set your buying price for farmers
        </Text>
      </View>

      <View style={styles.form}>
        {/* Price per KG */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price per KG (Rs.) *</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="currency-rupee" size={24} color="#16a34a" />
            <TextInput
              style={styles.input}
              placeholder="e.g., 260"
              value={pricePerKg}
              onChangeText={setPricePerKg}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Variety */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rice Variety</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="rice" size={24} color="#16a34a" />
            <TextInput
              style={styles.input}
              placeholder="e.g., White Rice, Nadu, Samba"
              value={variety}
              onChangeText={setVariety}
            />
          </View>
        </View>

        {/* Minimum Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Minimum Quantity (KG)</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="weight-kilogram" size={24} color="#16a34a" />
            <TextInput
              style={styles.input}
              placeholder="e.g., 100"
              value={minQuantity}
              onChangeText={setMinQuantity}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g., Premium quality only, Cash payment available"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewPrice}>Rs. {pricePerKg || '0'}/kg</Text>
          <Text style={styles.previewText}>
            {dealerInfo?.businessName || 'Your Business'}
          </Text>
          <Text style={styles.previewText}>Min: {minQuantity || '0'} KG</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleUpdatePrice}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
              <Text style={styles.submitText}>Update Price</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 5,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#0f172a',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10,
  },
  previewPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#22c55e',
    marginBottom: 5,
  },
  previewText: {
    fontSize: 14,
    color: '#e2e8f0',
    marginTop: 3,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#86efac',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UpdatePriceScreen;