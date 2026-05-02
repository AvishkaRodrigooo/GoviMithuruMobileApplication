/**
 * SensorConnectionScreen.js — AgroMind IoT Hub
 * ─────────────────────────────────────────────
 * Connects ESP32+DHT22 sensor via Firebase Firestore.
 * User enters WiFi SSID, Password, and ESP32 MAC address.
 * The app derives the device ID (ESP_<MAC_no_colons>) and
 * polls Firestore sensors/<deviceId> to verify the device
 * is live. No Arduino IDE needed — just power on the ESP32.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Animated, Alert,
  Platform, StatusBar, KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';

// Firebase project constants (same as Arduino sketch)
const FIREBASE_PROJECT_ID = 'govimithuru-88543';

/** Derive Firestore document ID from MAC address */
const macToDeviceId = (mac) => {
  const clean = mac.toUpperCase().replace(/[^A-F0-9]/g, '');
  return `ESP_${clean}`;
};

export default function SensorConnectionScreen({ navigation, route }) {
  // Form state
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Connection state
  const [status, setStatus] = useState('idle'); // idle | checking | connected | failed | disconnecting
  const [liveSensor, setLiveSensor] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);
  const [saving, setSaving] = useState(false);

  // Firestore listener ref
  const unsubRef = useRef(null);
  // Polling timer ref (fallback)
  const pollRef = useRef(null);
  // Pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  // On mount: check if user already has a connected device
  useEffect(() => {
    loadExistingDevice();
    startDotAnimation();
    return () => {
      if (unsubRef.current) unsubRef.current();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startDotAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const locationId = route?.params?.locationId;

  const loadExistingDevice = async () => {
    try {
      if (!locationId) return;
      const doc = await db.collection('storageLocations').doc(locationId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.monitoringMode === 'premium' && data.iotConfig) {
          // Pre-fill the form with existing config but DO NOT auto-connect
          setMacAddress(data.iotConfig.macAddress || '');
          setSsid(data.iotConfig.ssid || '');
          // Password is left blank for security, user must re-enter it to connect
        }
      }
    } catch (e) {
      console.error('loadExistingDevice:', e);
    }
  };

  const subscribeToDevice = (devId) => {
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = db.collection('sensors').doc(devId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          const d = doc.data();
          setLiveSensor(d);
          setLastSeen(new Date());
          setStatus('connected');
        } else {
          // Document doesn't exist yet — still waiting for ESP32 to push data
          if (status !== 'connected') setStatus('checking');
        }
      },
      (err) => {
        console.error('Firestore sensor listen error:', err);
        setStatus('failed');
      }
    );
  };

  const handleConnect = async () => {
    if (!ssid.trim() || !password.trim() || !macAddress.trim()) {
      Alert.alert('Missing Info', 'Please enter your WiFi SSID, Password, and ESP32 MAC address.');
      return;
    }
    const devId = macToDeviceId(macAddress.trim());
    setDeviceId(devId);
    setStatus('checking');
    setLiveSensor(null);
    startPulse();

    try {
      setSaving(true);

      // Attempt to send credentials directly to ESP32 if the user is connected to its setup WiFi
      // We wrap this in a timeout so it doesn't block if they aren't connected to the ESP32 AP
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      try {
        const url = `http://192.168.4.1/config?ssid=${encodeURIComponent(ssid.trim())}&password=${encodeURIComponent(password.trim())}`;
        const apResponse = await fetch(url, { method: 'GET', signal: controller.signal });
        if (apResponse.ok) {
          console.log("Credentials successfully sent to ESP32 AP!");
        }
      } catch (apError) {
        console.log("Not connected to ESP32 AP. Assuming ESP32 is already on home WiFi.");
      }
      clearTimeout(timeoutId);

      if (locationId) {
        await db.collection('storageLocations').doc(locationId).set({
          monitoringMode: 'premium',
          deviceId: devId,
          iotConfig: {
            ssid: ssid.trim(),
            macAddress: macAddress.trim().toUpperCase(),
            connectedAt: new Date().toISOString(),
          },
          lastModeUpdate: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (e) {
      console.error('Save doc error:', e);
    } finally {
      setSaving(false);
    }

    // Subscribe to live data
    subscribeToDevice(devId);

    // After 30 s with no data → mark failed
    setTimeout(() => {
      setStatus(prev => {
        if (prev === 'checking') return 'failed';
        return prev;
      });
    }, 30000);
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect IoT Sensor',
      'Switch back to free AI weather mode?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect', style: 'destructive',
          onPress: async () => {
            if (unsubRef.current) unsubRef.current();
            setStatus('idle');
            setLiveSensor(null);
            setDeviceId(null);
            try {
              if (locationId) {
                await db.collection('storageLocations').doc(locationId).set({
                  monitoringMode: 'free',
                  deviceId: null,
                  iotConfig: null,
                }, { merge: true });
              }
            } catch (e) { console.error(e); }
            // Return to WarehouseAnalysisScreen — focus listener will refresh mode
            navigation.goBack();
          },
        },
      ]
    );
  };

  const isConnected = status === 'connected';
  const isChecking = status === 'checking';
  const isFailed = status === 'failed';

  const statusColor = isConnected ? '#16a34a' : isChecking ? '#f59e0b' : isFailed ? '#ef4444' : '#9ca3af';
  const statusLabel = isConnected ? 'CONNECTED' : isChecking ? 'WAITING FOR DEVICE...' : isFailed ? 'NO SIGNAL — CHECK DEVICE' : 'DISCONNECTED';
  const statusIcon = isConnected ? 'check-circle' : isChecking ? 'wifi-sync' : isFailed ? 'wifi-off' : 'wifi-off';

  const dotOpacity = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <LinearGradient colors={['#f0fdf4', '#fff']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#16a34a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>Connect IoT Sensor</Text>
          <Text style={styles.headerSub}>ESP32 + DHT22 · Firebase Live Sync</Text>
        </View>
        <View style={[styles.statusPill, { borderColor: statusColor + '50', backgroundColor: statusColor + '15' }]}>
          <Animated.View style={[styles.statusDot, { backgroundColor: statusColor, opacity: isChecking ? dotOpacity : 1 }]} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>{isConnected ? 'LIVE' : isChecking ? 'LINKING' : 'OFF'}</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── LIVE READINGS CARD (when connected) ── */}
        {isConnected && liveSensor && (
          <LinearGradient colors={['#064e3b', '#16a34a']} style={styles.liveCard}>
            <View style={styles.liveCardTop}>
              <View style={styles.liveIconBox}>
                <MaterialCommunityIcons name="chip" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.liveCardTitle}>Hardware IoT Live Sync Active</Text>
                <Text style={styles.liveCardSub}>Device: {deviceId}</Text>
              </View>
              <View style={styles.liveBlink}>
                <Animated.View style={[styles.liveBlinkDot, { opacity: dotOpacity }]} />
                <Text style={styles.liveBlinkText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.liveReadingsRow}>
              <View style={styles.liveReadBox}>
                <MaterialCommunityIcons name="thermometer" size={28} color="#fcd34d" />
                <Text style={styles.liveReadVal}>
                  {liveSensor.temperature != null ? liveSensor.temperature.toFixed(1) : '--'}°C
                </Text>
                <Text style={styles.liveReadLabel}>TEMPERATURE</Text>
              </View>
              <View style={styles.liveDivider} />
              <View style={styles.liveReadBox}>
                <MaterialCommunityIcons name="water-percent" size={28} color="#93c5fd" />
                <Text style={styles.liveReadVal}>
                  {liveSensor.humidity != null ? liveSensor.humidity.toFixed(0) : '--'}%
                </Text>
                <Text style={styles.liveReadLabel}>HUMIDITY</Text>
              </View>
            </View>
            {lastSeen && (
              <Text style={styles.liveLastSeen}>
                Last updated: {lastSeen.toLocaleTimeString()}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.disconnectBtn, { flex: 1 }]}
                onPress={handleDisconnect}
              >
                <MaterialCommunityIcons name="wifi-off" size={16} color="#ef4444" />
                <Text style={styles.disconnectBtnText}>Disconnect</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.disconnectBtn, { flex: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={() => navigation.goBack()}
              >
                <MaterialCommunityIcons name="arrow-left" size={16} color="#fff" />
                <Text style={[styles.disconnectBtnText, { color: '#fff' }]}>Back to Storage</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        {/* ── CHECKING STATE ── */}
        {isChecking && (
          <View style={styles.checkingCard}>
            <Animated.View style={[styles.checkingRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.checkingIconBox}>
              <MaterialCommunityIcons name="wifi-sync" size={40} color="#f59e0b" />
            </View>
            <Text style={styles.checkingTitle}>Waiting for ESP32...</Text>
            <Text style={styles.checkingDesc}>
              Power on your ESP32. It will auto-connect to WiFi and push data to Firebase. No Arduino IDE needed.
            </Text>
            <Text style={styles.checkingDeviceId}>Device ID: {deviceId}</Text>
            <ActivityIndicator color="#f59e0b" style={{ marginTop: 8 }} />
          </View>
        )}

        {/* ── FAILED STATE ── */}
        {isFailed && (
          <View style={[styles.checkingCard, { borderColor: '#fecaca' }]}>
            <View style={[styles.checkingIconBox, { backgroundColor: '#fef2f2' }]}>
              <MaterialCommunityIcons name="wifi-alert" size={40} color="#ef4444" />
            </View>
            <Text style={[styles.checkingTitle, { color: '#ef4444' }]}>No Signal Detected</Text>
            <Text style={styles.checkingDesc}>
              Make sure your ESP32 is powered on and connected to: "{ssid || 'your WiFi'}". Check the MAC address and try again.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleConnect}>
              <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── SETUP FORM (idle or failed) ── */}
        {(status === 'idle' || isFailed) && (
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <MaterialCommunityIcons name="access-point" size={20} color="#16a34a" />
              <Text style={styles.formCardTitle}>IoT Device Setup</Text>
            </View>
            <Text style={styles.formCardDesc}>
              Enter the same WiFi credentials that are in your Arduino sketch, plus your ESP32's MAC address.
            </Text>

            {/* WiFi SSID */}
            <Text style={styles.fieldLabel}>WiFi Network (SSID)</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIconBox}>
                <MaterialCommunityIcons name="wifi" size={18} color="#16a34a" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dilakshan"
                value={ssid}
                onChangeText={setSsid}
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* WiFi Password */}
            <Text style={styles.fieldLabel}>WiFi Password</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIconBox}>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#16a34a" />
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="WiFi password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* MAC Address */}
            <Text style={styles.fieldLabel}>ESP32 MAC Address</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIconBox}>
                <MaterialCommunityIcons name="chip" size={18} color="#16a34a" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. A4:CF:12:34:56:78"
                value={macAddress}
                onChangeText={setMacAddress}
                autoCapitalize="characters"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {macAddress.trim().length > 0 && (
              <View style={styles.derivedIdBox}>
                <MaterialCommunityIcons name="identifier" size={14} color="#7c3aed" />
                <Text style={styles.derivedIdText}>
                  Firestore Path: sensors/{macToDeviceId(macAddress)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.connectBtn, (!ssid.trim() || !password.trim() || !macAddress.trim() || saving) && { opacity: 0.6 }]}
              onPress={handleConnect}
              disabled={!ssid.trim() || !password.trim() || !macAddress.trim() || saving}
            >
              <LinearGradient colors={['#16a34a', '#064e3b']} style={styles.connectBtnGrad}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <MaterialCommunityIcons name="access-point" size={20} color="#fff" />
                }
                <Text style={styles.connectBtnText}>
                  {saving ? 'Saving...' : 'Connect IoT Sensor'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── HOW IT WORKS ── */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>⚡ How It Works</Text>
          {[
            { icon: 'chip', text: 'Power on your ESP32 with DHT22 sensor attached to pin 4.' },
            { icon: 'wifi', text: 'ESP32 auto-connects to your WiFi and pushes data to Firebase every 10 seconds.' },
            { icon: 'cellphone-check', text: 'This app reads live temperature & humidity directly from Firestore.' },
            { icon: 'thermometer-lines', text: 'Warehouse Analysis screen will show real sensor data instead of AI weather predictions.' },
          ].map((step, i) => (
            <View key={i} style={styles.howRow}>
              <View style={styles.howIconBox}>
                <MaterialCommunityIcons name={step.icon} size={16} color="#16a34a" />
              </View>
              <Text style={styles.howText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* ── FIREBASE INFO ── */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="firebase" size={18} color="#f59e0b" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoTitle}>Firebase Project</Text>
            <Text style={styles.infoValue}>{FIREBASE_PROJECT_ID}</Text>
            <Text style={styles.infoSub}>Firestore path: sensors/ESP_{'<'}MAC{'>'}</Text>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 44 : 12,
    paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb', elevation: 2,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  headerSub: { fontSize: 12, color: '#16a34a', fontWeight: '600', marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusPillText: { fontSize: 10, fontWeight: '900' },

  scroll: { padding: 16, paddingBottom: 40 },

  // Live Card
  liveCard: {
    borderRadius: 24, padding: 20, marginBottom: 16,
    elevation: 4,
  },
  liveCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  liveIconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  liveCardTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  liveCardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  liveBlink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveBlinkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  liveBlinkText: { color: '#4ade80', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  liveReadingsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 18, padding: 16, marginBottom: 14,
  },
  liveReadBox: { flex: 1, alignItems: 'center', gap: 4 },
  liveReadVal: { color: '#fff', fontSize: 32, fontWeight: '900' },
  liveReadLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  liveDivider: { width: 1, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  liveLastSeen: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', marginBottom: 14 },
  disconnectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.12)', padding: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  disconnectBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },

  // Checking Card
  checkingCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1.5, borderColor: '#fef3c7',
    elevation: 2,
  },
  checkingRing: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(245,158,11,0.08)', top: 20,
  },
  checkingIconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  checkingTitle: { fontSize: 18, fontWeight: '900', color: '#f59e0b', marginBottom: 8 },
  checkingDesc: {
    fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 12,
  },
  checkingDeviceId: {
    fontSize: 11, color: '#9ca3af', fontWeight: '700',
    backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 8, marginBottom: 8,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Form Card
  formCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', elevation: 2,
  },
  formCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  formCardTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  formCardDesc: { fontSize: 12, color: '#6b7280', lineHeight: 18, marginBottom: 20 },
  fieldLabel: {
    fontSize: 11, fontWeight: '800', color: '#374151',
    letterSpacing: 0.5, marginBottom: 8, marginTop: 14,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#e5e7eb', overflow: 'hidden',
  },
  inputIconBox: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f0fdf4', borderRightWidth: 1, borderRightColor: '#e5e7eb',
  },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#111827', fontWeight: '600',
  },
  eyeBtn: { paddingHorizontal: 14 },
  derivedIdBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: '#f5f3ff', padding: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd6fe',
  },
  derivedIdText: { color: '#7c3aed', fontSize: 11, fontWeight: '700', flex: 1 },
  connectBtn: { marginTop: 22, borderRadius: 16, overflow: 'hidden', elevation: 2 },
  connectBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  connectBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  // How it works
  howCard: {
    backgroundColor: '#f0fdf4', borderRadius: 20, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0',
  },
  howTitle: { fontSize: 14, fontWeight: '800', color: '#065f46', marginBottom: 14 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  howIconBox: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: '#dcfce7',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  howText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  // Info card
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fffbeb', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#fde68a', marginBottom: 8,
  },
  infoTitle: { fontSize: 12, fontWeight: '800', color: '#92400e' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 2 },
  infoSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
});