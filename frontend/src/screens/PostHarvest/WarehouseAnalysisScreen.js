import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Dimensions,
    SafeAreaView, TouchableOpacity, ScrollView,
    StatusBar, ActivityIndicator, Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';

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

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function WarehouseAnalysisScreen({ navigation, route }) {
    const [loading, setLoading] = useState(true);
    const [locData, setLocData] = useState(null);
    const [totalKg, setTotalKg] = useState(0);
    const [harvests, setHarvests] = useState([]);

    const locationId = route.params?.locationId;

    useEffect(() => {
        (async () => {
            try {
                const uid = auth.currentUser?.uid;
                if (!uid || !locationId) return;

                const doc = await db.collection('storageLocations').doc(locationId).get();
                if (doc.exists) setLocData(doc.data());

                const snap = await db.collection('harvests')
                    .where('userId', '==', uid)
                    .where('locationId', '==', locationId)
                    .get();

                const items = [];
                let kg = 0;
                snap.forEach(d => {
                    const data = d.data();
                    kg += Number(data.quantityKg || 0);
                    items.push({ id: d.id, ...data });
                });
                setTotalKg(kg);
                setHarvests(items);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [locationId]);

    const capacity = (locData?.storageArea || 100) * 10;
    const fillPercent = Math.min(100, (totalKg / capacity) * 100);
    const color = statusColor(fillPercent);
    const label = statusLabel(fillPercent);

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

                {/* Helpful Guides */}
                <Text style={s.sectionTitle}>HELPFUL GUIDES</Text>

                <TouchableOpacity
                    style={s.guideBtnMain}
                    onPress={() => navigation.navigate('StorageStepGuide', {
                        temp: 28.5, humidity: 62,
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
                    onPress={() => navigation.navigate('StorageExpertGuide', { temp: 28.5, humidity: 62 })}
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

                {/* Live Conditions */}
                <View style={s.sectionRow}>
                    <Text style={s.sectionTitle}>LIVE CONDITIONS</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ConnectSensors')}>
                        <Text style={s.linkText}>Setup Sensors</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.envGrid}>
                    <View style={s.envCard}>
                        <View style={s.envHeader}>
                            <View style={[s.envIcon, { backgroundColor: '#fee2e2' }]}>
                                <MaterialCommunityIcons name="thermometer" size={20} color="#ef4444" />
                            </View>
                            <Text style={s.envLabel}>TEMPERATURE</Text>
                        </View>
                        <Text style={s.envValue}>28.5 <Text style={s.envUnit}>°C</Text></Text>
                        <Text style={s.envStatusGood}>Normal Range</Text>
                    </View>
                    <View style={s.envCard}>
                        <View style={s.envHeader}>
                            <View style={[s.envIcon, { backgroundColor: '#dbeafe' }]}>
                                <MaterialCommunityIcons name="water-percent" size={20} color="#3b82f6" />
                            </View>
                            <Text style={s.envLabel}>HUMIDITY</Text>
                        </View>
                        <Text style={s.envValue}>62 <Text style={s.envUnit}>%</Text></Text>
                        <Text style={s.envStatusGood}>Safe Level</Text>
                    </View>
                </View>

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
                                onPress={() => navigation.navigate('PostHarvestAdvisor', { batch: item, location: locData })}
                            >
                                <View style={[s.stockAvatar, { backgroundColor: idx % 2 === 0 ? '#dcfce7' : '#dbeafe' }]}>
                                    <MaterialCommunityIcons name="sack" size={20} color={idx % 2 === 0 ? '#16a34a' : '#3b82f6'} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={s.stockName}>{item.riceVariety || item.variety || 'Paddy'}</Text>
                                    <Text style={s.stockDate}>Stored: {item.harvestDate || 'Recently'}</Text>
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
    sectionTitle: { color: '#9ca3af', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
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
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    statCard: { width: (SW - 32 - 16) / 3, backgroundColor: 'white', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1 },
    statLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
    statVal: { color: '#111827', fontSize: 14, fontWeight: '800' },

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

    // Env
    envGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    envCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1 },
    envHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    envIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    envLabel: { color: '#6b7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
    envValue: { color: '#111827', fontSize: 24, fontWeight: '800' },
    envUnit: { fontSize: 14, color: '#9ca3af' },
    envStatusGood: { color: '#16a34a', fontSize: 12, fontWeight: '600', marginTop: 4 },

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
    stockWeight: { color: '#111827', fontSize: 15, fontWeight: '800' },
    stockBags: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
    emptyBox: { padding: 30, alignItems: 'center' },
    emptyText: { color: '#9ca3af', fontSize: 14, marginTop: 10 },
});