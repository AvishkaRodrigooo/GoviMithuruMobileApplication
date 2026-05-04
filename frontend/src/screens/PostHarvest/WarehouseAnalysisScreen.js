/**
 * WarehouseAnalysisScreen.js  —  AgroMind
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows storage details, stock inventory, and real-time 24h indoor temperature
 * fine-tuned via ML + physics hybrid from the storage location coordinates.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Dimensions,
    SafeAreaView, TouchableOpacity, ScrollView,
    StatusBar, ActivityIndicator, Platform, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';
import { BASE_URL } from '../../utils/apiConfig';

const { width: SW } = Dimensions.get('window');

// ─── 3D MODEL COMPONENT ───────────────────────────────────────────────────────
const WarehouseModel = ({ fillPercent, color, storageType }) => {
    const getModelId = () => {
        const type = storageType || '';
        if (type === 'Home') return 'b480ce383ac4425a9bf3694842d3937e';
        if (type === 'Co-op') return '477e9b2971a44bfdbe82468e0a93cd15';
        if (type === 'Government Store') return '2030da9105da4cbb8a5cb5432690eaaf';
        if (type === 'Private Store') return 'd9951bb80c8b433a95d0edfaa7f74d5e';
        return '3211d9abfcd7420099e51b8cb3cceacc';
    };

    return (
        <View style={s.modelContainer}>
            <View style={s.webViewWrapper}>
                <WebView
                    source={{ uri: `https://sketchfab.com/models/${getModelId()}/embed?autostart=1&ui_controls=0&ui_infos=0&transparent=1&preload=1` }}
                    style={s.webView}
                    scrollEnabled={false}
                />
            </View>
            <View style={[s.visualBadge, { borderColor: color + '50', backgroundColor: color + '15' }]}>
                <Text style={{ color, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>{fillPercent.toFixed(0)}% FULL</Text>
            </View>
        </View>
    );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const statusColor = p => (p >= 90 ? '#ef4444' : p >= 70 ? '#f59e0b' : '#16a34a');
const statusLabel = p => (p >= 90 ? 'FULL ALERT' : p >= 70 ? 'GETTING FULL' : 'GOOD SPACE');

// 24h temperature bar chart
const TempChart = ({ data, label, unit = '°C', colorHigh = '#ef4444', colorNormal = '#16a34a' }) => {
    if (!data || data.length === 0) return null;
    const vals = data.map(d => d.value);
    const maxV = Math.max(...vals) || 1;
    const minV = Math.min(...vals);
    const danger = unit === '°C' ? 30 : 80;

    return (
        <View style={s.chartContainer}>
            <Text style={s.chartLabel}>{label}</Text>
            <View style={s.chartBars}>
                {data.map((d, i) => {
                    const pct = Math.max(10, ((d.value - minV) / (maxV - minV + 1)) * 100);
                    const hot = d.value > danger;
                    return (
                        <View key={i} style={s.chartBarWrap}>
                            <Text style={[s.chartBarVal, { color: hot ? colorHigh : '#374151' }]}>
                                {d.value.toFixed(0)}
                            </Text>
                            <View style={[s.chartBar, { height: Math.max(pct * 0.6, 6), backgroundColor: hot ? colorHigh : colorNormal }]} />
                            {i % 4 === 0 && (
                                <Text style={s.chartBarHour}>{d.hour}h</Text>
                            )}
                        </View>
                    );
                })}
            </View>
            <Text style={s.chartUnit}>{unit}</Text>
        </View>
    );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function WarehouseAnalysisScreen({ navigation, route }) {
    const [loading, setLoading] = useState(true);
    const [locData, setLocData] = useState(null);
    const [totalKg, setTotalKg] = useState(0);
    const [harvests, setHarvests] = useState([]);

    // Weather / indoor environment state
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [indoorEnv, setIndoorEnv] = useState(null);    // from /weather/predict-storage
    const [outdoorWeather, setOutdoorWeather] = useState(null); // from /weather
    const [hourlyTempData, setHourlyTempData] = useState([]);
    const [hourlyHumidData, setHourlyHumidData] = useState([]);
    const [weatherError, setWeatherError] = useState(null);
    const [fineTuneAccuracy, setFineTuneAccuracy] = useState(null);
    const [monitoringMode, setMonitoringMode] = useState('free');
    const [deviceId, setDeviceId] = useState(null);
    const [liveSensorData, setLiveSensorData] = useState(null);
    const [sensorHistory, setSensorHistory] = useState([]); // hourly IoT readings (up to 24)

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const locationId = route.params?.locationId;

    // Firestore: load location data (one-shot is fine — location data doesn't change)
    useEffect(() => {
        (async () => {
            try {
                const uid = auth.currentUser?.uid;
                if (!uid || !locationId) return;

                const doc = await db.collection('storageLocations').doc(locationId).get();
                if (doc.exists) {
                    const lData = doc.data();
                    setLocData(lData);
                    setMonitoringMode(lData.monitoringMode || 'free');
                    setDeviceId(lData.deviceId || null);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [locationId]);

    // Firestore: REAL-TIME listener for harvests (updates instantly when stock changes)
    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid || !locationId) return;

        const unsub = db.collection('harvests')
            .where('userId', '==', uid)
            .where('locationId', '==', locationId)
            .onSnapshot(snap => {
                const items = [];
                let kg = 0;
                snap.forEach(d => {
                    const data = d.data();
                    kg += Number(data.quantityKg || 0);
                    items.push({ id: d.id, ...data });
                });
                setTotalKg(kg);
                setHarvests(items);
            }, e => {
                console.error('[WarehouseAnalysis] harvests snapshot error:', e);
            });

        return () => unsub();
    }, [locationId]);


    // Firestore: listen to live IoT sensor data + hourly history subcollection
    useEffect(() => {
        let unsubLive = null;
        let unsubHistory = null;

        if (monitoringMode === 'premium' && deviceId) {
            // Live current reading
            unsubLive = db.collection('sensors').doc(deviceId).onSnapshot(doc => {
                if (doc.exists) {
                    setLiveSensorData(doc.data());
                } else {
                    setLiveSensorData(null);
                }
            });

            // Hourly history subcollection — last 24 documents ordered by ts desc
            unsubHistory = db
                .collection('sensors').doc(deviceId)
                .collection('hourlyData')
                .orderBy('ts', 'desc')
                .limit(24)
                .onSnapshot(snap => {
                    const rows = [];
                    snap.forEach(d => rows.push(d.data()));
                    // Reverse so oldest is first (left side of chart)
                    setSensorHistory(rows.reverse());
                }, err => {
                    console.warn('[IoT history]', err.message);
                    setSensorHistory([]);
                });
        } else {
            setSensorHistory([]);
        }

        return () => {
            if (unsubLive) unsubLive();
            if (unsubHistory) unsubHistory();
        };
    }, [monitoringMode, deviceId]);

    // Fetch weather + fine-tuned indoor conditions when locData is ready
    useEffect(() => {
        if (!locData) return;
        const lat = locData.latitude || locData.lat;
        const lon = locData.longitude || locData.lon;
        if (lat && lon) {
            fetchEnvironmentData(lat, lon);
        } else {
            // No coordinates — use simple weather endpoint without location
            fetchSimpleWeather();
        }
    }, [locData]);

    // Fade in on load
    useEffect(() => {
        if (!loading) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        }
    }, [loading]);

    // Re-read monitoringMode + deviceId whenever screen comes back into focus
    // (e.g. returning from SensorConnectionScreen after connect/disconnect)
    const reloadLocationMode = async () => {
        if (!locationId) return;
        try {
            const doc = await db.collection('storageLocations').doc(locationId).get();
            if (doc.exists) {
                const d = doc.data();
                const newMode = d.monitoringMode || 'free';
                const newDeviceId = d.deviceId || null;
                setMonitoringMode(newMode);
                setDeviceId(newDeviceId);
                // If mode switched to free, clear live sensor data
                if (newMode !== 'premium') {
                    setLiveSensorData(null);
                }
            }
        } catch (e) {
            console.error('[WarehouseAnalysis] reloadLocationMode:', e);
        }
    };

    useEffect(() => {
        const unsubFocus = navigation.addListener('focus', reloadLocationMode);
        return unsubFocus;
    }, [navigation, locationId]);

    const fetchEnvironmentData = async (lat, lon) => {
        setWeatherLoading(true);
        setWeatherError(null);
        try {
            // 1. Get 24h outdoor weather (past 24 hours)
            const wxRes = await fetch(`${BASE_URL}/api/guardian/weather?lat=${lat}&lon=${lon}`);
            const wxData = await wxRes.json();

            if (wxData.success || wxData.weather_24h) {
                setOutdoorWeather(wxData);
                const raw24h = wxData.weather_24h || [];
                setHourlyTempData(raw24h.map(h => ({ hour: h.hour, value: h.temp })));
                setHourlyHumidData(raw24h.map(h => ({ hour: h.hour, value: h.humidity })));
            }

            // 2. Get fine-tuned indoor storage prediction
            const storType = (locData?.storageType || 'home').toLowerCase().replace(/[^a-z]/g, '');
            const stMap = { home: 'home', warehouse: 'warehouse', shed: 'shed', coop: 'co-op', 'co-op': 'co-op', private: 'warehouse', government: 'warehouse' };
            const stype = Object.keys(stMap).find(k => storType.includes(k)) ? stMap[Object.keys(stMap).find(k => storType.includes(k))] : 'warehouse';

            const body = {
                lat, lon,
                rice_moisture_pct: harvests.length > 0
                    ? (harvests.reduce((s, h) => s + (parseFloat(h.moisture) || 13.5), 0) / harvests.length)
                    : 13.5,
                storage_type: stype,
                roof_material: locData?.roofMaterial || 'tile',
                roof_color: locData?.roofColor || 'red',
                ventilation: locData?.ventilation || 'natural',
                ceiling_height: locData?.ceilingHeight || '3-4m',
                insulation: locData?.insulation || false,
                rice_quantity_kg: totalKg || 500,
            };

            const indoorRes = await fetch(`${BASE_URL}/api/guardian/weather/predict-storage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const indoorData = await indoorRes.json();

            if (indoorData.success) {
                setIndoorEnv(indoorData);
                setFineTuneAccuracy(indoorData.indoor?.accuracy_label || null);
                // Override hourly temp data with indoor prediction profile if available
                if (indoorData.indoor?.hourly_profile?.length > 0) {
                    setHourlyTempData(indoorData.indoor.hourly_profile.map(h => ({
                        hour: h.hour, value: h.temp
                    })));
                    setHourlyHumidData(indoorData.indoor.hourly_profile.map(h => ({
                        hour: h.hour, value: h.humidity
                    })));
                }
            }
        } catch (e) {
            console.error('[WarehouseAnalysis] Weather error:', e);
            setWeatherError('Weather data unavailable');
        } finally {
            setWeatherLoading(false);
        }
    };

    const fetchSimpleWeather = async () => {
        setWeatherLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/guardian/weather`);
            const data = await res.json();
            if (data.success || data.weather_24h) {
                setOutdoorWeather(data);
                const raw = data.weather_24h || [];
                setHourlyTempData(raw.map(h => ({ hour: h.hour, value: h.temp })));
                setHourlyHumidData(raw.map(h => ({ hour: h.hour, value: h.humidity })));
            }
        } catch (e) {
            setWeatherError('Weather unavailable');
        } finally {
            setWeatherLoading(false);
        }
    };

    const capacity = (locData?.storageArea || 100) * 10;
    const fillPercent = Math.min(100, (totalKg / capacity) * 100);
    const color = statusColor(fillPercent);
    const label = statusLabel(fillPercent);

    // Current display values (Override ML with Live Sensor if available)
    const isUsingLiveSensor = monitoringMode === 'premium' && liveSensorData != null;
    const dispIndoorTemp = isUsingLiveSensor ? liveSensorData.temperature : indoorEnv?.indoor?.avg_temperature ?? outdoorWeather?.temp_c ?? 28.5;
    const dispIndoorHumid = isUsingLiveSensor ? liveSensorData.humidity : indoorEnv?.indoor?.avg_humidity ?? outdoorWeather?.humidity_pct ?? 62;
    const dispPeakTemp = indoorEnv?.indoor?.peak_temperature ?? dispIndoorTemp;
    const tempStatus = dispIndoorTemp > 32 ? 'DANGER' : dispIndoorTemp > 29 ? 'WARNING' : 'SAFE';
    const humidStatus = dispIndoorHumid > 80 ? 'DANGER' : dispIndoorHumid > 70 ? 'WARNING' : 'SAFE';
    const tempStatusColor = tempStatus === 'DANGER' ? '#ef4444' : tempStatus === 'WARNING' ? '#f59e0b' : '#16a34a';
    const humidStatusColor = humidStatus === 'DANGER' ? '#ef4444' : humidStatus === 'WARNING' ? '#f59e0b' : '#16a34a';

    if (loading) {
        return (
            <SafeAreaView style={s.root}>
                <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
                <View style={s.centered}>
                    <ActivityIndicator size="large" color="#16a34a" />
                    <Text style={s.loadingText}>Loading storage data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const STATS = [
        { icon: 'floor-plan', label: 'TOTAL SIZE', val: `${locData?.storageArea ?? '—'} ${locData?.areaUnit ?? ''}` },
        { icon: 'home-modern', label: 'STORE TYPE', val: locData?.storageType ?? '—' },
        { icon: 'sack', label: 'STORED CROP', val: `${totalKg.toLocaleString()} kg`, hi: true },
        { icon: 'bag-personal', label: 'TOTAL BAGS', val: `${(totalKg / 50).toFixed(0)} bags` },
        { icon: 'scale-balance', label: 'MAX SPACE', val: `${capacity.toLocaleString()} kg` },
        { icon: 'chart-pie', label: 'SPACE USED', val: `${fillPercent.toFixed(1)}%`, hi: true },
    ];

    return (
        <SafeAreaView style={s.root}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#16a34a" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.hTitle}>Storage Details</Text>
                    <View style={s.hLocRow}>
                        <MaterialCommunityIcons name="map-marker" size={13} color="#6b7280" />
                        <Text style={s.hSub}>{locData?.locationName ?? 'Main Store'}</Text>
                    </View>
                </View>
                <View style={[s.statusPill, { backgroundColor: color + '15', borderColor: color + '40' }]}>
                    <View style={[s.statusDot, { backgroundColor: color }]} />
                    <Text style={[s.statusPillText, { color }]}>{label}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, padding: 16 }}>

                {/* 3D View Card */}
                <View style={s.card}>
                    <View style={s.cardTop}>
                        <View>
                            <Text style={s.cardLabel}>3D STORAGE VIEW</Text>
                            <Text style={s.cardHint}>Touch and drag to look around</Text>
                        </View>
                    </View>
                    <View style={s.stage}>
                        <WarehouseModel fillPercent={fillPercent} color={color} storageType={locData?.storageType} />
                    </View>
                    <View style={s.progWrap}>
                        <View style={s.progRow}>
                            <Text style={s.progLabel}>Space Filled</Text>
                            <Text style={[s.progVal, { color }]}>{totalKg.toLocaleString()} KG</Text>
                        </View>
                        <View style={s.track}>
                            <View style={[s.fill, { width: `${fillPercent}%`, backgroundColor: color }]} />
                        </View>
                        <View style={s.limits}>
                            <Text style={s.lim}>Empty</Text>
                            <Text style={s.lim}>{capacity.toLocaleString()} KG Max</Text>
                        </View>
                    </View>
                </View>

                {/* Insight */}
                <View style={[s.insight, { borderLeftColor: color, backgroundColor: color + '08' }]}>
                    <View style={[s.insightIconBox, { backgroundColor: color + '15' }]}>
                        <MaterialCommunityIcons
                            name={fillPercent >= 90 ? 'alert' : fillPercent >= 70 ? 'alert-circle-outline' : 'check-all'}
                            size={22} color={color}
                        />
                    </View>
                    <Text style={s.insightTxt}>
                        {fillPercent >= 90
                            ? 'Warning: Your storage is almost totally full! Ensure enough space is left for air to flow so the paddy does not spoil or heat up.'
                            : fillPercent >= 70
                                ? 'Note: Your storage is getting full. Remember to keep bags at least 1 foot away from the walls to stop moisture damage.'
                                : 'Great! Your storage has plenty of space. Keep up the good work keeping the area dry and clean.'}
                    </Text>
                </View>

                {/* Stats Grid */}
                <View style={s.grid}>
                    {STATS.map(st => (
                        <View key={st.label} style={s.statCard}>
                            <MaterialCommunityIcons name={st.icon} size={20} color={st.hi ? color : '#9ca3af'} style={{ marginBottom: 6 }} />
                            <Text style={s.statLabel}>{st.label}</Text>
                            <Text style={[s.statVal, st.hi && { color, fontSize: 17 }]}>{st.val}</Text>
                        </View>
                    ))}
                </View>

                {/* ─── MONITORING MODE CARD ─── */}
                {isUsingLiveSensor ? (
                    /* IoT CONNECTED */
                    <View style={[s.modeCard, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
                        <View style={s.modeCardTop}>
                            <View style={[s.modeIconBox, { backgroundColor: '#dcfce7' }]}>
                                <MaterialCommunityIcons name="chip" size={22} color="#16a34a" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[s.modeTitle, { color: '#15803d' }]}>IoT Method — LIVE</Text>
                                    <View style={s.modeLiveDot} />
                                </View>
                                <Text style={s.modeSub}>Real-time sensor data from ESP32+DHT22</Text>
                                <Text style={[s.modeDeviceId, { color: '#16a34a' }]}>Device: {deviceId}</Text>
                            </View>
                        </View>
                        <View style={s.modeActions}>
                            <TouchableOpacity
                                style={[s.modeBtn, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}
                                onPress={() => navigation.navigate('ConnectSensors', { locationId })}
                            >
                                <MaterialCommunityIcons name="cog-outline" size={15} color="#15803d" />
                                <Text style={[s.modeBtnText, { color: '#15803d' }]}>Manage Sensor</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.modeBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
                                onPress={async () => {
                                    try {
                                        await db.collection('storageLocations').doc(locationId).set(
                                            { monitoringMode: 'free', deviceId: null, iotConfig: null },
                                            { merge: true }
                                        );
                                        setMonitoringMode('free');
                                        setDeviceId(null);
                                        setLiveSensorData(null);
                                    } catch (e) { console.error(e); }
                                }}
                            >
                                <MaterialCommunityIcons name="brain" size={15} color="#1d4ed8" />
                                <Text style={[s.modeBtnText, { color: '#1d4ed8' }]}>Back to Free AI</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : monitoringMode === 'premium' ? (
                    /* IoT MODE but DISCONNECTED */
                    <View style={[s.modeCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                        <View style={s.modeCardTop}>
                            <View style={[s.modeIconBox, { backgroundColor: '#fee2e2' }]}>
                                <MaterialCommunityIcons name="wifi-off" size={22} color="#ef4444" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[s.modeTitle, { color: '#dc2626' }]}>IoT Method — NO SIGNAL</Text>
                                <Text style={s.modeSub}>ESP32 sensor is not sending data right now</Text>
                                {deviceId && <Text style={[s.modeDeviceId, { color: '#9ca3af' }]}>Device: {deviceId}</Text>}
                            </View>
                        </View>
                        <View style={s.modeActions}>
                            <TouchableOpacity
                                style={[s.modeBtn, { backgroundColor: '#fef2f2', borderColor: '#fecaca', flex: 1 }]}
                                onPress={() => navigation.navigate('ConnectSensors', { locationId })}
                            >
                                <MaterialCommunityIcons name="refresh" size={15} color="#ef4444" />
                                <Text style={[s.modeBtnText, { color: '#ef4444' }]}>Reconnect Sensor</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.modeBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', flex: 1 }]}
                                onPress={async () => {
                                    try {
                                        await db.collection('storageLocations').doc(locationId).set(
                                            { monitoringMode: 'free', deviceId: null, iotConfig: null },
                                            { merge: true }
                                        );
                                        setMonitoringMode('free');
                                        setDeviceId(null);
                                        setLiveSensorData(null);
                                    } catch (e) { console.error(e); }
                                }}
                            >
                                <MaterialCommunityIcons name="brain" size={15} color="#1d4ed8" />
                                <Text style={[s.modeBtnText, { color: '#1d4ed8' }]}>Switch to Free AI</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    /* FREE METHOD — offer IoT upgrade */
                    <View style={[s.modeCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                        <View style={s.modeCardTop}>
                            <View style={[s.modeIconBox, { backgroundColor: '#dbeafe' }]}>
                                <MaterialCommunityIcons name="brain" size={22} color="#3b82f6" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[s.modeTitle, { color: '#1d4ed8' }]}>Free Method — AI Prediction</Text>
                                <Text style={s.modeSub}>Using ML + weather data to estimate indoor conditions</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[s.modeBtn, { backgroundColor: '#dcfce7', borderColor: '#86efac', alignSelf: 'stretch' }]}
                            onPress={() => navigation.navigate('ConnectSensors', { locationId })}
                        >
                            <MaterialCommunityIcons name="access-point" size={15} color="#15803d" />
                            <Text style={[s.modeBtnText, { color: '#15803d' }]}>Connect IoT Sensor for Real-time Data</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ─── LIVE CONDITIONS (Real 24h + Fine-tuned ML) ─── */}
                <View style={s.sectionRow}>
                    <Text style={s.sectionTitle}>LIVE INDOOR CONDITIONS</Text>
                    {weatherLoading
                        ? <ActivityIndicator size="small" color="#16a34a" />
                        : <TouchableOpacity onPress={() => {
                            const lat = locData?.latitude || locData?.lat;
                            const lon = locData?.longitude || locData?.lon;
                            if (lat && lon) fetchEnvironmentData(lat, lon);
                            else fetchSimpleWeather();
                        }}>
                            <MaterialCommunityIcons name="refresh" size={18} color="#3b82f6" />
                        </TouchableOpacity>
                    }
                </View>

                {/* Fine-tune badge or IoT live badge */}
                {isUsingLiveSensor ? (
                    <View style={[s.fineTuneBadge, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                        <MaterialCommunityIcons name="chip" size={14} color="#16a34a" />
                        <Text style={[s.fineTuneText, { color: '#16a34a' }]}>
                            Hardware IoT Live Sync Active
                        </Text>
                    </View>
                ) : fineTuneAccuracy ? (
                    <View style={s.fineTuneBadge}>
                        <MaterialCommunityIcons name="brain" size={14} color="#7c3aed" />
                        <Text style={s.fineTuneText}>
                            ML Fine-Tuned: {fineTuneAccuracy}
                        </Text>
                    </View>
                ) : null}

                <View style={s.envGrid}>
                    {/* Indoor Temperature */}
                    <View style={s.envCard}>
                        <View style={s.envHeader}>
                            <View style={[s.envIcon, { backgroundColor: '#fee2e2' }]}>
                                <MaterialCommunityIcons name="thermometer" size={20} color="#ef4444" />
                            </View>
                            <Text style={s.envLabel}>INDOOR TEMP</Text>
                        </View>
                        <Text style={[s.envValue, { color: dispIndoorTemp > 30 ? '#ef4444' : '#111827' }]}>
                            {dispIndoorTemp.toFixed(1)} <Text style={s.envUnit}>°C</Text>
                        </Text>
                        <Text style={[s.envStatus, { color: tempStatusColor }]}>{tempStatus}</Text>
                        {indoorEnv?.indoor?.peak_temperature && (
                            <Text style={s.envPeak}>Peak: {indoorEnv.indoor.peak_temperature.toFixed(1)}°C</Text>
                        )}
                    </View>
                    {/* Indoor Humidity */}
                    <View style={s.envCard}>
                        <View style={s.envHeader}>
                            <View style={[s.envIcon, { backgroundColor: '#dbeafe' }]}>
                                <MaterialCommunityIcons name="water-percent" size={20} color="#3b82f6" />
                            </View>
                            <Text style={s.envLabel}>INDOOR HUMID.</Text>
                        </View>
                        <Text style={[s.envValue, { color: dispIndoorHumid > 80 ? '#ef4444' : '#111827' }]}>
                            {dispIndoorHumid.toFixed(0)} <Text style={s.envUnit}>%</Text>
                        </Text>
                        <Text style={[s.envStatus, { color: humidStatusColor }]}>{humidStatus}</Text>
                        {indoorEnv?.indoor?.peak_humidity && (
                            <Text style={s.envPeak}>Peak: {indoorEnv.indoor.peak_humidity.toFixed(0)}%</Text>
                        )}
                    </View>
                </View>

                {/* Outdoor vs Indoor comparison row */}
                {indoorEnv && (
                    <View style={s.compareRow}>
                        <View style={s.compareItem}>
                            <Text style={s.compareLabel}>OUTDOOR AVG</Text>
                            <Text style={s.compareVal}>{indoorEnv.outdoor?.avg_temperature?.toFixed(1) ?? '—'}°C</Text>
                        </View>
                        <MaterialCommunityIcons name="arrow-right" size={18} color="#9ca3af" />
                        <View style={s.compareItem}>
                            <Text style={s.compareLabel}>INDOOR PRED.</Text>
                            <Text style={[s.compareVal, { color: '#ef4444' }]}>{dispIndoorTemp.toFixed(1)}°C</Text>
                        </View>
                        <View style={s.compareItem}>
                            <Text style={s.compareLabel}>TEMP GAIN</Text>
                            <Text style={[s.compareVal, { color: '#f59e0b' }]}>
                                +{(dispIndoorTemp - (indoorEnv.outdoor?.avg_temperature || dispIndoorTemp - 3)).toFixed(1)}°C
                            </Text>
                        </View>
                    </View>
                )}

                {/* Storage alerts */}
                {indoorEnv?.indoor?.alerts?.length > 0 && (
                    <View style={s.alertsBox}>
                        {indoorEnv.indoor.alerts.map((al, i) => (
                            <View key={i} style={[s.alertRow, { backgroundColor: al.level === 'critical' ? '#fef2f2' : '#fffbeb', borderColor: al.level === 'critical' ? '#fecaca' : '#fde68a' }]}>
                                <MaterialCommunityIcons
                                    name={al.level === 'critical' ? 'alert-octagon' : 'alert'}
                                    size={16}
                                    color={al.level === 'critical' ? '#ef4444' : '#f59e0b'}
                                />
                                <Text style={[s.alertText, { color: al.level === 'critical' ? '#991b1b' : '#92400e' }]}>
                                    {al.message}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* ─── CHART SECTION ─── */}
                {isUsingLiveSensor ? (
                    /* ── IoT MODE: Real sensor hourly history ── */
                    (() => {
                        // Sensor power detection
                        // Check multiple possible timestamp field names the ESP32 might use
                        const rawTs =
                            liveSensorData?.timestamp ??
                            liveSensorData?.ts ??
                            liveSensorData?.time ??
                            liveSensorData?.updatedAt ??
                            liveSensorData?.lastSeen ??
                            null;

                        // Resolve to a JS Date — handles Firestore Timestamp, {seconds,nanoseconds}, ISO string, epoch ms/s
                        let lastTs = null;
                        if (rawTs) {
                            if (rawTs?.toDate) {
                                lastTs = rawTs.toDate(); // Firestore Timestamp object
                            } else if (rawTs?.seconds != null) {
                                lastTs = new Date(rawTs.seconds * 1000); // serialised {seconds, nanoseconds}
                            } else {
                                const parsed = new Date(rawTs);
                                lastTs = isNaN(parsed.getTime()) ? null : parsed;
                            }
                        }

                        // Key rule: if the sensor document has a temperature reading,
                        // the sensor IS online — even if there is no timestamp field.
                        // Only mark as offline when a timestamp EXISTS and is > 65 min stale (to allow for 1-hour intervals).
                        const hasLiveReading = liveSensorData?.temperature != null;
                        const sensorOnline = hasLiveReading && (
                            lastTs
                                ? (Date.now() - lastTs.getTime()) < 65 * 60 * 1000
                                : true  // no timestamp field → assume online since we have data
                        );

                        // Calculate remaining time for the next 1-hour reading
                        let remainingMins = null;
                        if (lastTs && sensorOnline) {
                            const diffMs = Date.now() - lastTs.getTime();
                            const oneHourMs = 60 * 60 * 1000;
                            if (diffMs >= 0 && diffMs < oneHourMs) {
                                remainingMins = Math.ceil((oneHourMs - diffMs) / (60 * 1000));
                            } else if (diffMs < 0) {
                                remainingMins = 60;
                            }
                        }

                        const hoursCollected = sensorHistory.length;
                        const isHistoryComplete = hoursCollected >= 24;

                        return (
                            <>
                                {/* Sensor Power Status */}
                                {!sensorOnline && (
                                    <View style={s.sensorOfflineBox}>
                                        <MaterialCommunityIcons name="power-off" size={20} color="#ef4444" />
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={s.sensorOfflineTitle}>Sensor Power OFF</Text>
                                            <Text style={s.sensorOfflineSub}>
                                                {lastTs
                                                    ? `Last seen: ${lastTs.toLocaleTimeString()}`
                                                    : 'No signal received yet'}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* IoT Hourly Temp Chart */}
                                <View style={s.chartCard}>
                                    <View style={s.chartCardHeader}>
                                        <MaterialCommunityIcons name="thermometer" size={18} color="#ef4444" />
                                        <Text style={s.chartCardTitle}>STORAGE TEMPERATURE — HOURLY AVG</Text>
                                        {sensorOnline && (
                                            <View style={s.liveDot}>
                                                <View style={[s.liveDotInner, { backgroundColor: '#16a34a' }]} />
                                                <Text style={s.liveDotText}>LIVE</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Progress bar: X/24 hours */}
                                    {!isHistoryComplete && (
                                        <View style={s.historyProgressBox}>
                                            <View style={s.historyProgressBar}>
                                                <View style={[s.historyProgressFill, { width: `${(hoursCollected / 24) * 100}%` }]} />
                                            </View>
                                            <Text style={s.historyProgressText}>
                                                {hoursCollected}/24 hours collected
                                                {hoursCollected === 0 
                                                    ? ` — Waiting for first reading${remainingMins !== null ? ` (Next in ~${remainingMins}m)` : ''}`
                                                    : ` — Not yet complete${remainingMins !== null ? ` (Next in ~${remainingMins}m)` : ''}`}
                                            </Text>
                                        </View>
                                    )}

                                    {sensorHistory.length > 0 ? (
                                        (() => {
                                            const temps = sensorHistory.map(r => r.avgTemp ?? r.temperature ?? 0);
                                            const maxT = Math.max(...temps) || 1;
                                            const minT = Math.min(...temps);
                                            return (
                                                <View style={[s.chartBars, { height: 90 }]}>
                                                    {sensorHistory.map((r, i) => {
                                                        const val = r.avgTemp ?? r.temperature ?? 0;
                                                        const pct = Math.max(10, ((val - minT) / (maxT - minT + 1)) * 100);
                                                        const hot = val > 30;
                                                        const label = r.hour !== undefined ? `${r.hour}h` : '';
                                                        return (
                                                            <View key={i} style={s.chartBarWrap}>
                                                                <Text style={[s.chartBarVal, { color: hot ? '#ef4444' : '#374151' }]}>
                                                                    {val.toFixed(0)}
                                                                </Text>
                                                                <View style={[s.chartBar, {
                                                                    height: Math.max(pct * 0.7, 6),
                                                                    backgroundColor: hot ? '#ef4444' : '#16a34a',
                                                                }]} />
                                                                {i % 4 === 0 && (
                                                                    <Text style={s.chartBarHour}>{label}</Text>
                                                                )}
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            );
                                        })()
                                    ) : (
                                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="chart-timeline" size={32} color="#d1d5db" />
                                            <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
                                                Hourly data will appear once the sensor sends its first reading.
                                            </Text>
                                        </View>
                                    )}
                                    <Text style={s.chartUnit}>°C</Text>
                                </View>

                                {/* IoT Hourly Humidity Chart */}
                                {sensorHistory.length > 0 && (
                                    <View style={s.chartCard}>
                                        <View style={s.chartCardHeader}>
                                            <MaterialCommunityIcons name="water-percent" size={18} color="#3b82f6" />
                                            <Text style={s.chartCardTitle}>STORAGE HUMIDITY — HOURLY AVG</Text>
                                        </View>
                                        {(() => {
                                            const humids = sensorHistory.map(r => r.avgHumid ?? r.humidity ?? 0);
                                            const maxH = Math.max(...humids) || 1;
                                            const minH = Math.min(...humids);
                                            return (
                                                <View style={[s.chartBars, { height: 90 }]}>
                                                    {sensorHistory.map((r, i) => {
                                                        const val = r.avgHumid ?? r.humidity ?? 0;
                                                        const pct = Math.max(10, ((val - minH) / (maxH - minH + 1)) * 100);
                                                        const wet = val > 80;
                                                        const label = r.hour !== undefined ? `${r.hour}h` : '';
                                                        return (
                                                            <View key={i} style={s.chartBarWrap}>
                                                                <Text style={[s.chartBarVal, { color: wet ? '#3b82f6' : '#374151' }]}>
                                                                    {val.toFixed(0)}
                                                                </Text>
                                                                <View style={[s.chartBar, {
                                                                    height: Math.max(pct * 0.7, 6),
                                                                    backgroundColor: wet ? '#3b82f6' : '#93c5fd',
                                                                }]} />
                                                                {i % 4 === 0 && (
                                                                    <Text style={s.chartBarHour}>{label}</Text>
                                                                )}
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            );
                                        })()}
                                        <Text style={s.chartUnit}>%</Text>
                                    </View>
                                )}
                            </>
                        );
                    })()
                ) : (
                    /* ── FREE MODE: ML / weather prediction charts ── */
                    <>
                        {!weatherLoading && hourlyTempData.length > 0 && (
                            <View style={s.chartCard}>
                                <View style={s.chartCardHeader}>
                                    <MaterialCommunityIcons name="chart-bell-curve" size={18} color="#16a34a" />
                                    <Text style={s.chartCardTitle}>PAST 24H — INDOOR TEMPERATURE</Text>
                                    {outdoorWeather && (
                                        <View style={s.liveDot}>
                                            <View style={s.liveDotInner} />
                                            <Text style={s.liveDotText}>LIVE</Text>
                                        </View>
                                    )}
                                </View>
                                <TempChart data={hourlyTempData} label="" unit="°C" colorHigh="#ef4444" colorNormal="#16a34a" />
                            </View>
                        )}
                        {!weatherLoading && hourlyHumidData.length > 0 && (
                            <View style={s.chartCard}>
                                <View style={s.chartCardHeader}>
                                    <MaterialCommunityIcons name="water-percent" size={18} color="#3b82f6" />
                                    <Text style={s.chartCardTitle}>PAST 24H — INDOOR HUMIDITY</Text>
                                </View>
                                <TempChart data={hourlyHumidData} label="" unit="%" colorHigh="#3b82f6" colorNormal="#93c5fd" />
                            </View>
                        )}
                        {weatherError && !weatherLoading && (
                            <View style={s.errorBox}>
                                <MaterialCommunityIcons name="wifi-off" size={16} color="#9ca3af" />
                                <Text style={s.errorText}>{weatherError} — showing defaults</Text>
                            </View>
                        )}
                    </>
                )}

                {/* Helpful Guides */}
                <Text style={s.sectionTitle}>HELPFUL GUIDES</Text>

                <TouchableOpacity
                    style={s.guideBtnMain}
                    onPress={() => navigation.navigate('StorageStepGuide', {
                        temp: dispIndoorTemp,
                        humidity: dispIndoorHumid,
                        storageType: locData?.storageType || 'Home',
                        subCategory: locData?.subCategory
                    })}
                >
                    <LinearGradient colors={['#16a34a', '#064e3b']} style={s.guideGrad}>
                        <View style={s.guideIconBox}>
                            <MaterialCommunityIcons name="book-open-page-variant" size={22} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.guideTitle}>Safe Storage Guide</Text>
                            <Text style={s.guideSub}>Step-by-step instructions for your crop</Text>
                        </View>
                        <MaterialCommunityIcons name="arrow-right" size={22} color="rgba(255,255,255,0.8)" />
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.guideBtnSecondary}
                    onPress={() => navigation.navigate('StorageExpertGuide', {
                        temp: dispIndoorTemp,
                        humidity: dispIndoorHumid
                    })}
                >
                    <View style={[s.guideIconBoxLight, { backgroundColor: '#fef9c3' }]}>
                        <MaterialCommunityIcons name="lightbulb-on" size={22} color="#f59e0b" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.guideTitleLight}>Clever Storage Hacks</Text>
                        <Text style={s.guideSubLight}>Low-cost tricks to protect your harvest</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color="#9ca3af" />
                </TouchableOpacity>

                {/* Quality Standards */}
                <Text style={s.sectionTitle}>QUALITY STANDARDS (SLR 603)</Text>
                <View style={s.rulesCard}>
                    {[
                        'Keep room temperature below 30°C',
                        'Paddy moisture must be under 14%',
                        'Leave a 15cm (6 inch) gap from all walls',
                    ].map((rule, i) => (
                        <View key={i} style={s.ruleRow}>
                            <MaterialCommunityIcons name="check-circle" size={18} color="#16a34a" />
                            <Text style={s.ruleText}>{rule}</Text>
                        </View>
                    ))}
                </View>

                {/* Stock Inventory */}
                <View style={s.sectionRow}>
                    <Text style={s.sectionTitle}>MY HARVEST BATCHES</Text>
                    <View style={s.badgeBox}>
                        <Text style={s.badgeText}>{harvests.length} Batches</Text>
                    </View>
                </View>

                <View style={s.stockList}>
                    {harvests.length === 0 ? (
                        <View style={s.emptyBox}>
                            <MaterialCommunityIcons name="leaf" size={40} color="#d1d5db" />
                            <Text style={s.emptyText}>No harvest added to this store yet.</Text>
                        </View>
                    ) : (
                        harvests.map((item, idx) => (
                            <TouchableOpacity
                                key={item.id}
                                style={s.stockItem}
                                onPress={() => navigation.navigate('PostHarvestAdvisor', {
                                    batch: item,
                                    location: locData,
                                    locationId,
                                    indoorTemp: dispIndoorTemp,
                                    indoorHumid: dispIndoorHumid,
                                    lat: locData?.latitude || locData?.lat,
                                    lon: locData?.longitude || locData?.lon,
                                })}
                            >
                                <View style={[s.stockAvatar, { backgroundColor: idx % 2 === 0 ? '#dcfce7' : '#dbeafe' }]}>
                                    <MaterialCommunityIcons name="sack" size={20} color={idx % 2 === 0 ? '#16a34a' : '#3b82f6'} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={s.stockName}>{item.riceVariety || item.variety || 'Paddy'}</Text>
                                    <Text style={s.stockDate}>{item.harvestDate ? `Stored: ${item.harvestDate}` : 'Recently stored'}</Text>
                                    {item.moisture && (
                                        <Text style={[s.stockMC, { color: parseFloat(item.moisture) > 14 ? '#ef4444' : '#16a34a' }]}>
                                            MC: {item.moisture}%
                                        </Text>
                                    )}
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={s.stockWeight}>{item.quantityKg?.toLocaleString()} kg</Text>
                                    <Text style={s.stockBags}>~{(item.quantityKg / 50).toFixed(0)} bags</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={18} color="#d1d5db" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* bottom spacer — mode card above handles IoT/free toggle */}

            </ScrollView>
        </SafeAreaView>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f9fafb' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#6b7280', fontSize: 14 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
        paddingBottom: 16, backgroundColor: 'white', elevation: 2, borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
    hTitle: { color: '#111827', fontSize: 20, fontWeight: '800' },
    hSub: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
    hLocRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
    statusPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    // Section
    sectionTitle: { color: '#9ca3af', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12, marginTop: 8 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
    linkText: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },

    // 3D Card
    card: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: '#e5e7eb' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardLabel: { color: '#111827', fontSize: 14, fontWeight: '700' },
    cardHint: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
    stage: { alignItems: 'center', justifyContent: 'center', borderRadius: 16, overflow: 'hidden' },
    modelContainer: { width: '100%', height: 240, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f3f4f6' },
    webViewWrapper: { flex: 1 },
    webView: { flex: 1, backgroundColor: 'transparent' },
    visualBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },

    // Progress
    progWrap: { marginTop: 20 },
    progRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
    progLabel: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
    progVal: { fontSize: 20, fontWeight: '800' },
    track: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4 },
    limits: { flexDirection: 'row', justifyContent: 'space-between' },
    lim: { color: '#9ca3af', fontSize: 11, fontWeight: '600' },

    // Insight
    insight: { flexDirection: 'row', padding: 14, borderRadius: 16, borderLeftWidth: 4, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
    insightIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0 },
    insightTxt: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },

    // Stats Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
    statCard: { width: '48%', backgroundColor: 'white', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12, elevation: 1 },
    statLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
    statVal: { color: '#111827', fontSize: 15, fontWeight: '800' },

    // Fine-tune badge
    fineTuneBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f5f3ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10, borderWidth: 1, borderColor: '#ddd6fe' },
    fineTuneText: { color: '#7c3aed', fontSize: 12, fontWeight: '700', flex: 1 },

    // Env cards
    envGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    envCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1 },
    envHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    envIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    envLabel: { color: '#6b7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.3, flex: 1 },
    envValue: { color: '#111827', fontSize: 24, fontWeight: '800' },
    envUnit: { fontSize: 14, color: '#9ca3af' },
    envStatus: { fontSize: 12, fontWeight: '700', marginTop: 4 },
    envPeak: { color: '#9ca3af', fontSize: 11, marginTop: 2 },

    // Compare row
    compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
    compareItem: { alignItems: 'center', flex: 1 },
    compareLabel: { color: '#9ca3af', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
    compareVal: { color: '#111827', fontSize: 15, fontWeight: '800' },

    // Alerts
    alertsBox: { marginBottom: 12, gap: 6 },
    alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
    alertText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '600' },

    // Chart card
    chartCard: { backgroundColor: 'white', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1 },
    chartCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    chartCardTitle: { color: '#374151', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, flex: 1 },
    liveDot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    liveDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
    liveDotText: { color: '#16a34a', fontSize: 10, fontWeight: '800' },

    // Chart
    chartContainer: {},
    chartLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '700', marginBottom: 6 },
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 1 },
    chartBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    chartBar: { width: '90%', borderRadius: 2 },
    chartBarVal: { fontSize: 7, fontWeight: '700', marginBottom: 1 },
    chartBarHour: { fontSize: 7, color: '#9ca3af', marginTop: 2 },
    chartUnit: { color: '#9ca3af', fontSize: 9, textAlign: 'right', marginTop: 4 },

    // Error
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f9fafb', padding: 10, borderRadius: 10, marginBottom: 10 },
    errorText: { color: '#9ca3af', fontSize: 12 },

    // Guides
    guideBtnMain: { marginBottom: 10, borderRadius: 16, overflow: 'hidden', elevation: 2 },
    guideGrad: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    guideIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    guideTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
    guideSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
    guideBtnSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20, gap: 14, elevation: 1 },
    guideIconBoxLight: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    guideTitleLight: { color: '#111827', fontSize: 15, fontWeight: '700' },
    guideSubLight: { color: '#6b7280', fontSize: 12, marginTop: 2 },

    // Rules
    rulesCard: { backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20, elevation: 1 },
    ruleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    ruleText: { color: '#374151', fontSize: 13, flex: 1, lineHeight: 19 },

    // Stock
    badgeBox: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
    stockList: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', elevation: 1, marginBottom: 16 },
    stockItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    stockAvatar: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    stockName: { color: '#111827', fontSize: 15, fontWeight: '700' },
    stockDate: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
    stockMC: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    stockWeight: { color: '#111827', fontSize: 15, fontWeight: '800' },
    stockBags: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
    emptyBox: { padding: 30, alignItems: 'center' },
    emptyText: { color: '#9ca3af', fontSize: 14, marginTop: 10 },

    // Sensor button (legacy, kept for safety)
    sensorBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#bfdbfe', gap: 10, marginBottom: 8 },
    sensorBtnText: { flex: 1, color: '#1d4ed8', fontSize: 13, fontWeight: '600' },

    // Monitoring Mode Card
    modeCard: { borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1.5, elevation: 1 },
    modeCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    modeIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    modeTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.2 },
    modeSub: { fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 17 },
    modeDeviceId: { fontSize: 11, fontWeight: '700', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    modeLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a' },
    modeActions: { flexDirection: 'row', gap: 8 },
    modeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
    modeBtnText: { fontSize: 12, fontWeight: '800' },

    // Sensor Power OFF box
    sensorOfflineBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#fecaca' },
    sensorOfflineTitle: { color: '#dc2626', fontSize: 13, fontWeight: '900' },
    sensorOfflineSub: { color: '#9ca3af', fontSize: 11, marginTop: 2 },

    // IoT history progress
    historyProgressBox: { marginBottom: 10 },
    historyProgressBar: { height: 5, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
    historyProgressFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 3 },
    historyProgressText: { color: '#9ca3af', fontSize: 11, fontWeight: '600' },
});