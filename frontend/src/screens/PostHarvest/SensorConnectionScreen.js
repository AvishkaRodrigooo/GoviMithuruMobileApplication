import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Image, ActivityIndicator, Animated 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SensorConnectionScreen({ navigation }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, scanning, connecting, connected
  const [deviceId, setDeviceId] = useState('');
  const [testSuccess, setTestSuccess] = useState(false);

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
      }, 2000);
    }, 2000);
  };

  const supportedSensors = [
    { id: '1', name: 'GoviLink T1 (Bluetooth)', price: 'Rs. 4,500', type: 'Temp/Humidity' },
    { id: '2', name: 'AgriSense Pro (WiFi)', price: 'Rs. 12,800', type: 'Moisture/Temp' },
    { id: '3', name: 'DHT22 Smart Kit', price: 'Rs. 2,200', type: 'DIY/Basic' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. Header & Status */}
        <View style={styles.header}>
          <Text style={styles.title}>Connect Smart Sensors</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: connectionStatus === 'connected' ? '#16a34a' : '#ef4444' }]} />
            <Text style={styles.statusText}>
              {connectionStatus === 'connected' ? 'Connected via Bluetooth' : 'Not Connected'}
            </Text>
            <MaterialCommunityIcons name="bluetooth" size={16} color={connectionStatus === 'connected' ? '#16a34a' : '#94a3b8'} style={{marginLeft: 5}} />
          </View>
        </View>

        {/* 2. Visual Illustration / Scanner Area */}
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

        {/* 3. Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryBtn}>
            <LinearGradient colors={['#16a34a', '#15803d']} style={styles.gradientBtn}>
              <MaterialCommunityIcons name="qrcode-scan" size={24} color="#fff" />
              <Text style={styles.btnText}>Scan QR Code to Pair</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Or enter Device ID manually</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: GV-99102-X" 
                value={deviceId}
                onChangeText={setDeviceId}
              />
              <TouchableOpacity onPress={handleConnect} style={styles.connectBtn}>
                <Text style={styles.connectBtnText}>Pair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 4. Benefits Section */}
        <View style={styles.benefitsCard}>
          <Text style={styles.cardTitle}>Why connect sensors?</Text>
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="clock-fast" size={20} color="#16a34a" />
            <Text style={styles.benefitText}>Real-time moisture & temp monitoring</Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#16a34a" />
            <Text style={styles.benefitText}>Instant alerts for fungal risk (High Humidity)</Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={20} color="#16a34a" />
            <Text style={styles.benefitText}>More accurate price forecasting for your harvest</Text>
          </View>
        </View>

        {/* 5. Supported Sensors List */}
        <Text style={styles.sectionTitle}>Supported Sensors</Text>
        {supportedSensors.map(sensor => (
          <View key={sensor.id} style={styles.sensorItem}>
            <View>
              <Text style={styles.sensorName}>{sensor.name}</Text>
              <Text style={styles.sensorType}>{sensor.type}</Text>
            </View>
            <Text style={styles.sensorPrice}>{sensor.price}</Text>
          </View>
        ))}

        {/* 6. Skip / Manual Toggle */}
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.skipText}>Skip for now, I'll enter data manually</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 7. Success Bottom Sheet (Conditional) */}
      {testSuccess && (
        <View style={styles.successSheet}>
          <View style={styles.successHeader}>
            <MaterialCommunityIcons name="check-decagram" size={24} color="#16a34a" />
            <Text style={styles.successTitle}>Pairing Successful!</Text>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingBox}>
              <Text style={styles.readLabel}>Temp</Text>
              <Text style={styles.readVal}>29.4°C</Text>
            </View>
            <View style={styles.readingBox}>
              <Text style={styles.readLabel}>Humidity</Text>
              <Text style={styles.readVal}>76%</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => setTestSuccess(false)}>
            <Text style={styles.doneBtnText}>Go to Dashboard</Text>
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 13, color: '#64748b' },

  illustrationContainer: { alignItems: 'center', justifyContent: 'center', height: 200, marginBottom: 20 },
  deviceCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  pulseCircle: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(22, 163, 74, 0.15)', zIndex: 1 },
  scanningText: { marginTop: 15, color: '#16a34a', fontWeight: '600' },

  actionSection: { marginBottom: 30 },
  primaryBtn: { borderRadius: 15, overflow: 'hidden', marginBottom: 20 },
  gradientBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },

  inputGroup: { backgroundColor: '#fff', padding: 15, borderRadius: 15, elevation: 2 },
  label: { fontSize: 12, color: '#64748b', marginBottom: 10, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, fontSize: 15 },
  connectBtn: { marginLeft: 10, backgroundColor: '#1e293b', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10 },
  connectBtnText: { color: '#fff', fontWeight: 'bold' },

  benefitsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 25 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  benefitText: { fontSize: 13, color: '#475569', marginLeft: 10 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  sensorItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 },
  sensorName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  sensorType: { fontSize: 11, color: '#64748b' },
  sensorPrice: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },

  skipBtn: { alignItems: 'center', paddingVertical: 20, marginBottom: 50 },
  skipText: { color: '#64748b', textDecorationLine: 'underline', fontSize: 13 },

  successSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  successHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginLeft: 10 },
  readingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  readingBox: { flex: 1, backgroundColor: '#f8fafc', padding: 15, borderRadius: 15, marginHorizontal: 5, alignItems: 'center' },
  readLabel: { fontSize: 12, color: '#64748b' },
  readVal: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  doneBtn: { backgroundColor: '#16a34a', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});