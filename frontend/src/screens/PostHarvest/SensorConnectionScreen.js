import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Animated, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

export default function SensorConnectionScreen({ navigation }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, scanning, connecting, connected
  const [deviceId, setDeviceId] = useState('');
  const [testSuccess, setTestSuccess] = useState(false);
  const [mode, setMode] = useState(null); // 'premium' or 'free'
  const [saving, setSaving] = useState(false);

  // Animation for the "Scanning" ripple effect
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (connectionStatus === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    }
  }, [connectionStatus]);

  const handleConnect = () => {
    setConnectionStatus('scanning');
    setTimeout(() => {
      setConnectionStatus('connecting');
      setTimeout(() => {
        setConnectionStatus('connected');
        setTestSuccess(true);
        saveMode('premium');
      }, 2000);
    }, 2000);
  };

  const saveMode = async (selectedMode) => {
    try {
      setSaving(true);
      setMode(selectedMode);

      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          monitoringMode: selectedMode,
          lastModeUpdate: new Date().toISOString()
        });
      }

      if (selectedMode === 'free') {
        Alert.alert(
          "AI Climate Sync Active",
          "Localized weather data for Sri Lanka will now be used to predict storage life and moisture risks.",
          [{ text: "Go to Analysis", onPress: () => navigation.navigate('Stage') }]
        );
      }
    } catch (e) {
      console.error("Error saving mode:", e);
      Alert.alert("Error", "Could not save monitoring mode preference.");
    } finally {
      setSaving(false);
    }
  };

  const supportedSensors = [
    { id: '1', name: 'GoviLink T1 (Bluetooth)', price: 'Rs. 4,500', type: 'Temp/Humidity' },
    { id: '2', name: 'AgriSense Pro (WiFi)', price: 'Rs. 12,800', type: 'Moisture/Temp' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* 1. Header & Status */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Monitoring Intelligence</Text>
          <Text style={styles.subtitle}>Configure how we track your storage environment</Text>
        </View>

        {/* 2. Mode Selection */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeCard, mode === 'free' && styles.activeMode]}
            onPress={() => saveMode('free')}
          >
            <View style={[styles.modeIcon, { backgroundColor: '#e0f2fe' }]}>
              <MaterialCommunityIcons name="cloud-sync" size={32} color="#0284c7" />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.modeTitle}>FREE - AI Weather Sync</Text>
              <Text style={styles.modeDesc}>Uses Sri Lankan weather station APIs for baseline climate tracking.</Text>
              <View style={styles.freeBadge}><Text style={styles.badgeText}>SMART AUTO-SYNC</Text></View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, mode === 'premium' && styles.activeMode, { marginTop: 15 }]}
            onPress={() => setMode('premium')}
          >
            <View style={[styles.modeIcon, { backgroundColor: '#dcfce7' }]}>
              <MaterialCommunityIcons name="chip" size={32} color="#16a34a" />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.modeTitle}>PREMIUM - IoT GoviLink</Text>
              <Text style={styles.modeDesc}>Order hardware sensors for 100% precise inside-the-bag monitoring.</Text>
              <View style={styles.premiumBadge}><Text style={[styles.badgeText, { color: '#16a34a' }]}>HIGHEST PRECISION</Text></View>
            </View>
          </TouchableOpacity>
        </View>

        {mode === 'premium' && (
          <Animated.View style={styles.iotFlow}>
            <View style={styles.illustrationContainer}>
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: connectionStatus === 'scanning' ? 1 : 0 }]} />
              <View style={styles.deviceCircle}>
                <MaterialCommunityIcons
                  name={connectionStatus === 'connected' ? "check-circle" : "router-wireless"}
                  size={60}
                  color={connectionStatus === 'connected' ? "#16a34a" : "#16a34a"}
                />
              </View>
              {connectionStatus === 'scanning' && <Text style={styles.scanningText}>Searching for devices...</Text>}
            </View>

            <View style={styles.actionSection}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => Alert.alert("Scan QR", "Feature coming soon in v1.2")}>
                <LinearGradient colors={['#16a34a', '#15803d']} style={styles.gradientBtn}>
                  <MaterialCommunityIcons name="qrcode-scan" size={24} color="#fff" />
                  <Text style={styles.btnText}>Scan QR to Pair</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Or enter Device ID manually</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: GV-99120-X"
                    value={deviceId}
                    onChangeText={setDeviceId}
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity onPress={handleConnect} style={styles.connectBtn}>
                    <Text style={styles.connectBtnText}>Pair</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Order Custom Kits</Text>
            {supportedSensors.map(sensor => (
              <View key={sensor.id} style={styles.sensorItem}>
                <View>
                  <Text style={styles.sensorName}>{sensor.name}</Text>
                  <Text style={styles.sensorType}>{sensor.type}</Text>
                </View>
                <TouchableOpacity style={styles.orderBtn} onPress={() => Alert.alert("Order Received", "Our specialist will contact you.")}>
                  <Text style={styles.orderBtnText}>ORDER</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {testSuccess && (
        <View style={styles.successSheet}>
          <View style={styles.successHeader}>
            <MaterialCommunityIcons name="check-decagram" size={24} color="#16a34a" />
            <Text style={styles.successTitle}>IoT Connected!</Text>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingBox}>
              <Text style={styles.readLabel}>Internal Temp</Text>
              <Text style={styles.readVal}>29.4°C</Text>
            </View>
            <View style={styles.readingBox}>
              <Text style={styles.readLabel}>Humidity</Text>
              <Text style={styles.readVal}>76%</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Stage')}>
            <Text style={styles.doneBtnText}>Return to Analysis</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingTop: 60 },
  header: { marginBottom: 30 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 8, lineHeight: 20 },

  modeContainer: { marginBottom: 30 },
  modeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  activeMode: { borderColor: '#16a34a', borderWidth: 2, backgroundColor: '#f0fdf4' },
  modeIcon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modeTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  modeDesc: { fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 18 },
  freeBadge: { alignSelf: 'flex-start', backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  premiumBadge: { alignSelf: 'flex-start', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#0369a1' },

  iotFlow: { marginTop: 10 },
  illustrationContainer: { alignItems: 'center', justifyContent: 'center', height: 200, marginBottom: 20 },
  deviceCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  pulseCircle: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(22, 163, 74, 0.15)', zIndex: 1 },
  scanningText: { marginTop: 15, color: '#16a34a', fontWeight: '600' },

  actionSection: { marginBottom: 30 },
  primaryBtn: { borderRadius: 15, overflow: 'hidden', marginBottom: 20 },
  gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },

  inputGroup: { backgroundColor: '#fff', padding: 18, borderRadius: 24, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  label: { fontSize: 12, color: '#64748b', marginBottom: 12, fontWeight: '700' },
  inputWrapper: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, fontSize: 15, color: '#0f172a' },
  connectBtn: { marginLeft: 10, backgroundColor: '#0f172a', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12 },
  connectBtnText: { color: '#fff', fontWeight: 'bold' },

  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 15 },
  sensorItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  sensorName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  sensorType: { fontSize: 11, color: '#64748b', marginTop: 2 },
  orderBtn: { borderColor: '#16a34a', borderWidth: 1, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  orderBtnText: { color: '#16a34a', fontSize: 10, fontWeight: '900' },

  successSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 32, borderTopRightRadius: 32, elevation: 30, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15 },
  successHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginLeft: 10 },
  readingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  readingBox: { flex: 1, backgroundColor: '#f8fafc', padding: 15, borderRadius: 18, marginHorizontal: 5, alignItems: 'center' },
  readLabel: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  readVal: { fontSize: 22, fontWeight: '900', color: '#16a34a', marginTop: 4 },
  doneBtn: { backgroundColor: '#16a34a', paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 }
});