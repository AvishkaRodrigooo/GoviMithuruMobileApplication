import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Animated, Alert,
  Platform, StatusBar
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#16a34a" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Monitoring Intelligence</Text>
          <Text style={styles.subtitle}>Configure how we track your storage environment</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* 2. Mode Selection */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>MONITORING MODE</Text>
        </View>

        <View style={styles.modeContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.modeCard, mode === 'free' && styles.activeMode]}
            onPress={() => saveMode('free')}
          >
            <View style={[styles.modeIcon, { backgroundColor: '#f0f9ff' }]}>
              <MaterialCommunityIcons name="cloud-sync-outline" size={32} color="#0284c7" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.modeTitle}>Free AI Sync</Text>
              <Text style={styles.modeDesc}>Uses Sri Lankan weather station APIs for baseline climate tracking.</Text>
              <View style={styles.freeBadge}><Text style={styles.badgeText}>SMART AUTO-SYNC</Text></View>
            </View>
            {mode === 'free' && <MaterialCommunityIcons name="check-circle" size={24} color="#16a34a" />}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.modeCard, mode === 'premium' && styles.activeMode, { marginTop: 16 }]}
            onPress={() => setMode('premium')}
          >
            <View style={[styles.modeIcon, { backgroundColor: '#f0fdf4' }]}>
              <MaterialCommunityIcons name="chip" size={32} color="#16a34a" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.modeTitle}>IoT GoviLink</Text>
              <Text style={styles.modeDesc}>Precision hardware sensors for 100% accurate inside-the-bag monitoring.</Text>
              <View style={styles.premiumBadge}><Text style={styles.badgeText}>ULTRA PRECISION</Text></View>
            </View>
            {mode === 'premium' && <MaterialCommunityIcons name="check-circle" size={24} color="#16a34a" />}
          </TouchableOpacity>
        </View>

        {mode === 'premium' && (
          <Animated.View style={styles.iotFlow}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>HARDWARE PAIRING</Text>
            </View>

            <View style={styles.controlCard}>
              <View style={styles.illustrationContainer}>
                <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: connectionStatus === 'scanning' ? 1 : 0 }]} />
                <View style={styles.deviceCircle}>
                  <MaterialCommunityIcons
                    name={connectionStatus === 'connected' ? "check-decagram" : "router-wireless"}
                    size={60}
                    color={connectionStatus === 'connected' ? "#16a34a" : "#16a34a"}
                  />
                </View>
                {connectionStatus === 'scanning' && <Text style={styles.scanningText}>Searching for sensors...</Text>}
              </View>

              <TouchableOpacity style={styles.qrBtn} onPress={() => Alert.alert("Scan QR", "Coming soon in v1.2")}>
                <LinearGradient colors={['#16a34a', '#15803d']} style={styles.qrBtnGrad}>
                  <MaterialCommunityIcons name="qrcode-scan" size={22} color="#fff" />
                  <Text style={styles.qrBtnText}>Scan Sensor QR Code</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>MANUAL DEVICE ID</Text>
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

            <View style={[styles.sectionHeader, { marginTop: 30 }]}>
              <Text style={styles.sectionLabel}>PURCHASE CUSTOM KITS</Text>
            </View>

            {supportedSensors.map(sensor => (
              <View key={sensor.id} style={styles.sensorItem}>
                <View style={styles.sensorInfo}>
                  <Text style={styles.sensorName}>{sensor.name}</Text>
                  <Text style={styles.sensorType}>{sensor.type}</Text>
                  <Text style={styles.sensorPrice}>{sensor.price}</Text>
                </View>
                <TouchableOpacity style={styles.orderBtn} onPress={() => Alert.alert("Request Received", "Our technician will contact you shortly.")}>
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
            <View style={styles.successIconBox}>
              <MaterialCommunityIcons name="check-bold" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.successTitle}>IoT Live Sync Active</Text>
              <Text style={styles.successSub}>Sensors connected successfully</Text>
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingBox}>
              <Text style={styles.readLabel}>INTERNAL TEMP</Text>
              <Text style={styles.readVal}>29.4°C</Text>
            </View>
            <View style={styles.readingBox}>
              <Text style={styles.readLabel}>HUMIDITY</Text>
              <Text style={styles.readVal}>76%</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Stage')}>
            <Text style={styles.doneBtnText}>Start Precision Monitoring</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: '900', color: '#111827' },
  subtitle: { fontSize: 13, color: '#16a34a', fontWeight: '700' },

  scrollContent: { padding: 20 },
  sectionHeader: { marginBottom: 16, marginTop: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '900', color: '#9ca3af', letterSpacing: 1.5 },

  modeContainer: { marginBottom: 30 },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  activeMode: { borderColor: '#16a34a', borderWidth: 2, backgroundColor: '#f0fdf4' },
  modeIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modeTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  modeDesc: { fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 20 },
  freeBadge: { alignSelf: 'flex-start', backgroundColor: '#e0f2fe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 10 },
  premiumBadge: { alignSelf: 'flex-start', backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 10 },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#0369a1' },

  controlCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  illustrationContainer: { alignItems: 'center', justifyContent: 'center', height: 180, marginBottom: 10 },
  deviceCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  pulseCircle: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(22, 163, 74, 0.1)', zIndex: 1 },
  scanningText: { marginTop: 15, color: '#16a34a', fontWeight: '900', fontSize: 13, letterSpacing: 1 },

  qrBtn: { borderRadius: 18, overflow: 'hidden', elevation: 2 },
  qrBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  qrBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#f3f4f6' },
  dividerText: { marginHorizontal: 20, color: '#d1d5db', fontWeight: '900' },

  inputGroup: { gap: 10 },
  label: { fontSize: 11, color: '#9ca3af', fontWeight: '900', letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 14,
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  connectBtn: { backgroundColor: '#111827', paddingHorizontal: 24, justifyContent: 'center', borderRadius: 14 },
  connectBtnText: { color: '#fff', fontWeight: '900' },

  sensorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sensorInfo: { flex: 1 },
  sensorName: { fontSize: 16, fontWeight: '900', color: '#111827' },
  sensorType: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  sensorPrice: { fontSize: 14, color: '#16a34a', fontWeight: '900', marginTop: 4 },
  orderBtn: { borderColor: '#16a34a', borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  orderBtnText: { color: '#16a34a', fontSize: 11, fontWeight: '900' },

  successSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 30,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  successHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  successIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 13, color: '#16a34a', fontWeight: '700' },
  readingRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  readingBox: { flex: 1, backgroundColor: '#f9fafb', padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  readLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  readVal: { fontSize: 24, fontWeight: '900', color: '#111827' },
  doneBtn: { backgroundColor: '#111827', padding: 20, borderRadius: 18, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});