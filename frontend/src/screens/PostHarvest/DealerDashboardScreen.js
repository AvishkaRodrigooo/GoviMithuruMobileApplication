import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar,
    Switch
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../firebase/firebaseConfig';

const RICE_VARIETIES = ['Samba', 'Nadu', 'Basmati', 'Red Rice', 'Kekulu', 'Suwandel'];
const GRADES = ['Grade A', 'Grade B', 'Grade C'];

export default function DealerDashboardScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [dealerData, setDealerData] = useState(null);

    // Price Form
    const [selectedVariety, setSelectedVariety] = useState(RICE_VARIETIES[0]);
    const [selectedGrade, setSelectedGrade] = useState(GRADES[0]);
    const [price, setPrice] = useState('');

    // Transport & Location
    const [hasTransport, setHasTransport] = useState(false);
    const [transportCost, setTransportCost] = useState('');
    const [markerCoords, setMarkerCoords] = useState({
        latitude: 6.9271, // Default to Colombo
        longitude: 79.8612
    });

    useEffect(() => {
        fetchDealerProfile();
    }, []);

    const fetchDealerProfile = async () => {
        try {
            const uid = auth.currentUser?.uid;
            const doc = await db.collection('users').doc(uid).get();
            if (doc.exists) {
                setDealerData(doc.data());
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdatePrice = async () => {
        if (!price || isNaN(price)) {
            Alert.alert('Invalid Price', 'Please enter a valid numeric price per KG.');
            return;
        }

        setLoading(true);
        try {
            const uid = auth.currentUser?.uid;
            const today = new Date().toISOString().split('T')[0];

            const priceData = {
                dealerId: uid,
                dealerName: dealerData?.fullName || 'Anonymous Dealer',
                location: dealerData?.location || 'Unknown Location',
                latitude: markerCoords.latitude,
                longitude: markerCoords.longitude,
                hasTransport,
                transportCostPerKm: hasTransport ? parseFloat(transportCost) || 0 : 0,
                variety: selectedVariety,
                grade: selectedGrade,
                price: parseFloat(price),
                updatedAt: new Date().toISOString(),
                date: today
            };

            await db.collection('marketPrices').add(priceData);

            Alert.alert('Success', 'Market price updated successfully!');
            setPrice('');
        } catch (e) {
            Alert.alert('Error', 'Failed to update price. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigation.replace('SignIn');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <SafeAreaView style={s.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#064e3b', '#022c22']} style={s.header}>
                <View style={s.headerTop}>
                    <View>
                        <Text style={s.welcome}>Dealer Portal</Text>
                        <Text style={s.dealerName}>{dealerData?.fullName || 'Rice Dealer'}</Text>
                    </View>
                    <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                        <MaterialCommunityIcons name="logout" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={s.locBox}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#34d399" />
                    <Text style={s.locText}>{dealerData?.location || 'Location not set'}</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={s.content}>
                <View style={s.card}>
                    <Text style={s.cardTitle}>Update Market Price</Text>
                    <Text style={s.cardSub}>Set today's buying price for farmers</Text>

                    <View style={s.field}>
                        <Text style={s.label}>Rice Variety</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
                            {RICE_VARIETIES.map(v => (
                                <TouchableOpacity
                                    key={v}
                                    style={[s.chip, selectedVariety === v && s.activeChip]}
                                    onPress={() => setSelectedVariety(v)}
                                >
                                    <Text style={[s.chipText, selectedVariety === v && s.activeChipText]}>{v}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={s.field}>
                        <Text style={s.label}>Paddy Grade</Text>
                        <View style={s.gradeRow}>
                            {GRADES.map(g => (
                                <TouchableOpacity
                                    key={g}
                                    style={[s.gradeBtn, selectedGrade === g && s.activeGradeBtn]}
                                    onPress={() => setSelectedGrade(g)}
                                >
                                    <Text style={[s.gradeBtnText, selectedGrade === g && s.activeGradeBtnText]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={s.field}>
                        <Text style={s.label}>Buying Price (Rs. per KG)</Text>
                        <View style={s.inputBox}>
                            <Text style={s.prefix}>Rs.</Text>
                            <TextInput
                                style={s.input}
                                placeholder="210.00"
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>

                    <View style={s.divider} />

                    <Text style={s.cardTitle}>Transport & Location</Text>
                    <Text style={s.cardSub}>Help farmers find you and calculate shipping</Text>

                    <View style={s.transportRow}>
                        <View>
                            <Text style={s.transportLabel}>Offer Transport Service?</Text>
                            <Text style={s.transportSub}>Switch on if you can pick up from farmer</Text>
                        </View>
                        <Switch
                            value={hasTransport}
                            onValueChange={setHasTransport}
                            trackColor={{ false: '#cbd5e1', true: '#34d399' }}
                            thumbColor={hasTransport ? '#059669' : '#f4f3f4'}
                        />
                    </View>

                    {hasTransport && (
                        <View style={s.field}>
                            <Text style={s.label}>Transport Cost (Rs. per 1KM)</Text>
                            <View style={s.inputBox}>
                                <Text style={s.prefix}>Rs.</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="50.00"
                                    keyboardType="numeric"
                                    value={transportCost}
                                    onChangeText={setTransportCost}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </View>
                    )}

                    <View style={s.field}>
                        <Text style={s.label}>Pickup Location (Tap Map to Pin)</Text>
                        <View style={s.mapContainer}>
                            <MapView
                                style={s.map}
                                initialRegion={{
                                    latitude: 6.9271,
                                    longitude: 79.8612,
                                    latitudeDelta: 0.1,
                                    longitudeDelta: 0.1,
                                }}
                                onPress={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
                            >
                                <Marker
                                    coordinate={markerCoords}
                                    title="Pickup Point"
                                    description="Pin your warehouse location"
                                />
                            </MapView>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[s.updateBtn, loading && s.disabledBtn]}
                        onPress={handleUpdatePrice}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={s.updateBtnText}>Publish Today's Price</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={s.infoBox}>
                    <MaterialCommunityIcons name="information-outline" size={20} color="#059669" />
                    <Text style={s.infoText}>
                        Submitting this price will make it visible to all farmers in the Market tab under your business name.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 25, paddingTop: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    welcome: { color: '#34d399', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
    dealerName: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
    logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 12 },
    locBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    locText: { color: '#f1f5f9', fontSize: 12, fontWeight: '600', marginLeft: 6 },

    content: { padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    cardTitle: { color: '#1e293b', fontSize: 18, fontWeight: '800' },
    cardSub: { color: '#64748b', fontSize: 13, marginTop: 4, marginBottom: 25 },

    field: { marginBottom: 20 },
    label: { color: '#475569', fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    chipScroll: { flexDirection: 'row' },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    activeChip: { backgroundColor: '#10b981', borderColor: '#10b981' },
    chipText: { color: '#64748b', fontWeight: '700', fontSize: 13 },
    activeChipText: { color: '#fff' },

    gradeRow: { flexDirection: 'row', gap: 10 },
    gradeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    activeGradeBtn: { backgroundColor: '#059669', borderColor: '#059669' },
    gradeBtnText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
    activeGradeBtnText: { color: '#fff' },

    inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 15 },
    prefix: { color: '#64748b', fontWeight: '700', fontSize: 16 },
    input: { flex: 1, height: 50, paddingLeft: 10, fontSize: 18, fontWeight: '700', color: '#1e293b' },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 25 },
    transportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    transportLabel: { color: '#1e293b', fontSize: 15, fontWeight: '700' },
    transportSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
    mapContainer: { height: 200, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', marginTop: 10 },
    map: { flex: 1 },

    updateBtn: { backgroundColor: '#059669', height: 55, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 3 },
    updateBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    disabledBtn: { opacity: 0.6 },

    infoBox: { flexDirection: 'row', backgroundColor: '#ecfdf5', padding: 15, borderRadius: 16, marginTop: 25, alignItems: 'center' },
    infoText: { flex: 1, color: '#065f46', fontSize: 12, fontWeight: '600', marginLeft: 10, lineHeight: 18 }
});
