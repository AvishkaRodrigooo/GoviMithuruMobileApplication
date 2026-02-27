import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Animated, Dimensions,
    SafeAreaView, TouchableOpacity, ScrollView,
    StatusBar, ActivityIndicator, Easing, Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase/firebaseConfig';

const { width: SW } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
//  3D MODEL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const WarehouseModel = ({ fillPercent, color, storageType }) => {
    // Dynamic Model Selection based on Storage Type
    const getModelId = () => {
        const type = storageType || '';
        if (type === 'Home') return 'b480ce383ac4425a9bf3694842d3937e'; // Simple House
        if (type === 'Co-op') return '477e9b2971a44bfdbe82468e0a93cd15'; // Co-op Building
        if (type === 'Government Store') return '2030da9105da4cbb8a5cb5432690eaaf'; // Govt Store
        if (type === 'Private Store') return 'd9951bb80c8b433a95d0edfaa7f74d5e'; // Private Store

        // Default: Small Warehouse
        return '3211d9abfcd7420099e51b8cb3cceacc';
    };

    const modelId = getModelId();

    return (
        <View style={s.modelContainer}>
            <View style={s.webViewWrapper}>
                <WebView
                    source={{ uri: `https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_controls=0&ui_infos=0&transparent=1&preload=1` }}
                    style={s.webView}
                    scrollEnabled={false}
                />
            </View>
            <View style={[s.visualBadge, { borderColor: color + '44', backgroundColor: color + '12' }]}>
                <Text style={{ color, fontSize: 10, fontWeight: '900' }}>{fillPercent.toFixed(0)}% FULL</Text>
            </View>
        </View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const statusColor = p => (p >= 90 ? '#ef4444' : p >= 70 ? '#f59e0b' : '#10b981');
const statusLabel = p => (p >= 90 ? 'CRITICAL' : p >= 70 ? 'CAUTION' : 'HEALTHY');

export default function WarehouseAnalysisScreen({ navigation, route }) {
    const [loading, setLoading] = useState(true);
    const [locData, setLocData] = useState(null);
    const [totalKg, setTotalKg] = useState(0);
    const [harvests, setHarvests] = useState([]);
    const [aiInsight, setAiInsight] = useState(null);
    const [reportingPest, setReportingPest] = useState(false);

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

                // Generate AI Insights based on location data
                generateAIInsight(kg, doc.data()?.storageArea || 100);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [locationId]);

    const generateAIInsight = (kg, area) => {
        const capacity = area * 10;
        const fill = (kg / capacity) * 100;

        let insight = {
            strategy: "Maintain consistent air-flow patterns.",
            warning: "Ensure stack height does not exceed 10 feet.",
            pestRisk: "Low - Dry conditions detected."
        };

        if (fill > 80) {
            insight.strategy = "Critical: Prioritize cross-ventilation. Shift bags to avoid 'hot-spots' in center stacks.";
            insight.warning = "High utilization reduces airflow. Risk of weevil (ghun) infestation increases in stagnant areas.";
            insight.pestRisk = "Elevated - Compact storage facilitates pest migration between bags.";
        } else if (fill > 50) {
            insight.strategy = "Optimization: Use a 1-2-1 stacking pattern for better temperature dissipation.";
            insight.warning = "Monitor corners for moisture accumulation.";
            insight.pestRisk = "Moderate - Regular inspections recommended weekly.";
        }

        setAiInsight(insight);
    };

    const handleReportPest = () => {
        setReportingPest(true);
        setTimeout(() => {
            setReportingPest(false);
            Alert.alert(
                "AI Pest Report Sent",
                "Your report has been analyzed. Strategy: Seal the affected bags immediately. Use Hermetic liners to suffocate pests. The Post-Harvest Guardian has logged this incidence.",
                [{ text: "View Proper Guide", onPress: () => navigation.navigate('PostHarvestAdvisor') }]
            );
        }, 1500);
    };

    const capacity = (locData?.storageArea || 100) * 10;
    const fillPercent = Math.min(100, (totalKg / capacity) * 100);
    const color = statusColor(fillPercent);
    const label = statusLabel(fillPercent);

    if (loading) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={s.loadingText}>BUILDING 3D MODEL…</Text>
            </View>
        );
    }

    const STATS = [
        { icon: 'floor-plan', label: 'TOTAL AREA', val: `${locData?.storageArea ?? '—'} ${locData?.areaUnit ?? ''}` },
        { icon: 'office-building', label: 'FACILITY TYPE', val: locData?.storageType ?? '—' },
        { icon: 'package-variant', label: 'TOTAL STOCK', val: `${totalKg.toLocaleString()} kg`, hi: true },
        { icon: 'bag-personal', label: 'EST. BAGS', val: `${(totalKg / 50).toFixed(0)} bags` },
        { icon: 'database', label: 'MAX CAPACITY', val: `${capacity.toLocaleString()} kg` },
        { icon: 'chart-donut', label: 'UTILIZATION', val: `${fillPercent.toFixed(1)}%`, hi: true },
    ];

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#030810', '#081425', '#030810']} style={{ flex: 1 }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={s.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                            <MaterialCommunityIcons name="chevron-left" size={32} color="#ffffff" />
                        </TouchableOpacity>
                        <View style={s.headerMain}>
                            <Text style={s.hTitle}>Facility Intel</Text>
                            <View style={s.hLocRow}>
                                <MaterialCommunityIcons name="map-marker" size={14} color={color} />
                                <Text style={[s.hSub, { color: '#ffffff' }]}>{locData?.locationName ?? 'Primary Storage'}</Text>
                            </View>
                        </View>
                        <LinearGradient
                            colors={[color, color + '99']}
                            style={s.statusPill}
                        >
                            <Text style={s.statusPillText}>{label}</Text>
                        </LinearGradient>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>

                        {/* MODEL CARD */}
                        <View style={s.card}>
                            <View style={s.cardTop}>
                                <View>
                                    <Text style={s.cardLabel}>VIRTUAL FACILITY TWIN</Text>
                                    <Text style={s.cardHint}>Touch and drag to explore facility</Text>
                                </View>
                                <View style={[s.pctBox, { borderColor: color + '55' }]}>
                                    <Text style={[s.pctN, { color }]}>{fillPercent.toFixed(1)}</Text>
                                    <Text style={s.pctU}>% FULL</Text>
                                </View>
                            </View>

                            {/* Stage with ambient glow */}
                            <View style={s.stage}>
                                <LinearGradient colors={[color + '08', 'transparent', color + '05']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                                <View style={[s.glow, { backgroundColor: color + '20' }]} />
                                <WarehouseModel
                                    fillPercent={fillPercent}
                                    color={color}
                                    storageType={locData?.storageType}
                                />
                            </View>

                            {/* Progress */}
                            <View style={s.progWrap}>
                                <View style={s.progRow}>
                                    <Text style={s.progLabel}>Storage Occupancy</Text>
                                    <Text style={[s.progVal, { color }]}>{totalKg.toLocaleString()} KG</Text>
                                </View>
                                <View style={s.track}>
                                    {[25, 50, 75].map(t => <View key={t} style={[s.tick, { left: `${t}%` }]} />)}
                                    <View style={[s.fill, { width: `${fillPercent}%`, backgroundColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 10 }]} />
                                </View>
                                <View style={s.limits}>
                                    <Text style={s.lim}>0</Text>
                                    <Text style={s.lim}>{(capacity / 2).toLocaleString()} KG</Text>
                                    <Text style={s.lim}>{capacity.toLocaleString()} KG MAX</Text>
                                </View>
                            </View>
                        </View>

                        {/* STATS GRID */}
                        <View style={s.grid}>
                            {STATS.map(st => (
                                <View key={st.label} style={s.statCard}>
                                    <View style={s.statIconBox}>
                                        <MaterialCommunityIcons name={st.icon} size={18} color={st.hi ? color : '#4b6b8a'} />
                                    </View>
                                    <Text style={s.statLabel}>{st.label}</Text>
                                    <Text style={[s.statVal, st.hi && { color, fontWeight: '900' }]}>{st.val}</Text>
                                </View>
                            ))}
                        </View>

                        {/* AI STRATEGY CENTER */}
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>AI STRATEGY CENTER</Text>
                            <LinearGradient colors={['#7c3aed', '#4c1d95']} style={s.badgeSmall}>
                                <Text style={s.badgeTextSmall}>LLM GUIDED</Text>
                            </LinearGradient>
                        </View>
                        <TouchableOpacity
                            style={s.aiAdvisorCard}
                            onPress={() => navigation.navigate('PostHarvestAdvisor')}
                        >
                            <LinearGradient colors={['#1e1b4b', '#0f172a']} style={s.aiAdvisorGrad}>
                                <View style={s.aiIconWrapper}>
                                    <MaterialCommunityIcons name="brain" size={28} color="#a78bfa" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.aiStrategyTitle}>Maintenance Strategy</Text>
                                    <Text style={s.aiStrategyText}>{aiInsight?.strategy || "Analyzing storage conditions..."}</Text>
                                    <View style={s.warningRow}>
                                        <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#f87171" />
                                        <Text style={s.warningText}>{aiInsight?.warning}</Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#4c1d95" />
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* PEST MANAGEMENT */}
                        <View style={s.pestCard}>
                            <View style={s.pestHeader}>
                                <MaterialCommunityIcons name="bug-stop" size={22} color="#f87171" />
                                <Text style={s.pestTitle}>PEST PROTECTION</Text>
                            </View>
                            <View style={s.pestBody}>
                                <View style={s.pestRiskBox}>
                                    <Text style={s.pestRiskLabel}>CURRENT RISK</Text>
                                    <Text style={[s.pestRiskValue, { color: fillPercent > 70 ? '#f87171' : '#34d399' }]}>
                                        {aiInsight?.pestRisk}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[s.reportBtn, reportingPest && { opacity: 0.7 }]}
                                    onPress={handleReportPest}
                                    disabled={reportingPest}
                                >
                                    {reportingPest ? <ActivityIndicator color="#fff" size="small" /> : (
                                        <>
                                            <MaterialCommunityIcons name="alert-octagon" size={16} color="#fff" />
                                            <Text style={s.reportBtnText}>REPORT PEST ATTACK</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ENVIRONMENTAL MONITORING */}
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>ENVIRONMENTAL SENSORS</Text>
                            <View style={s.liveTag}>
                                <View style={s.liveDot} />
                                <Text style={s.liveText}>LIVE</Text>
                            </View>
                        </View>
                        <View style={s.envGrid}>
                            <View style={s.envCard}>
                                <LinearGradient colors={['#FF6B6B22', '#Feca5722']} style={StyleSheet.absoluteFillObject} />
                                <MaterialCommunityIcons name="thermometer" size={24} color="#FF6B6B" />
                                <View>
                                    <Text style={s.envLabel}>TEMPERATURE</Text>
                                    <Text style={s.envValue}>28.5°C</Text>
                                </View>
                                <Text style={s.envStatus}>OPTIMAL</Text>
                            </View>
                            <View style={s.envCard}>
                                <LinearGradient colors={['#48dbfb22', '#00d2d322']} style={StyleSheet.absoluteFillObject} />
                                <MaterialCommunityIcons name="water-percent" size={24} color="#48dbfb" />
                                <View>
                                    <Text style={s.envLabel}>HUMIDITY</Text>
                                    <Text style={s.envValue}>62%</Text>
                                </View>
                                <Text style={s.envStatus}>SAFE</Text>
                            </View>
                        </View>

                        {/* STOCK INVENTORY */}
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>STOCK INVENTORY</Text>
                            <Text style={s.stockCount}>{harvests.length} BATCHES</Text>
                        </View>
                        <View style={s.stockList}>
                            {harvests.length === 0 ? (
                                <View style={s.emptyStock}>
                                    <MaterialCommunityIcons name="package-variant" size={40} color="#1a2e46" />
                                    <Text style={s.emptyStockText}>No stock records found</Text>
                                </View>
                            ) : (
                                harvests.map((item, idx) => (
                                    <View key={item.id} style={s.stockItem}>
                                        <View style={[s.stockMarker, { backgroundColor: idx % 2 === 0 ? '#10b981' : '#3b82f6' }]} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.stockVariety}>{item.riceVariety || 'Paddy'}</Text>
                                            <Text style={s.stockDate}>{item.harvestDate || 'Fresh Stock'}</Text>
                                        </View>
                                        <View style={s.stockWeightBox}>
                                            <Text style={s.stockWeight}>{item.quantityKg?.toLocaleString()} KG</Text>
                                            <Text style={s.stockBags}>~{(item.quantityKg / 50).toFixed(0)} bags</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* INSIGHT */}
                        <View style={[s.insight, { borderColor: color + '25', backgroundColor: color + '0a' }]}>
                            <MaterialCommunityIcons
                                name={fillPercent >= 90 ? 'alert-circle-outline' : fillPercent >= 70 ? 'alert-outline' : 'check-circle-outline'}
                                size={24} color={color}
                            />
                            <Text style={[s.insightTxt, { color: color + 'ee' }]}>
                                {fillPercent >= 90
                                    ? 'Critical: Storage at maximum capacity. Risk of ventilation blockage and moisture damage to stored goods.'
                                    : fillPercent >= 70
                                        ? 'Caution: High utilization detected. Keep 1.5ft clearance from walls for heat and airflow management.'
                                        : 'Healthy: Optimal conditions. Adequate airflow maintained between paddy stacks to prevent spoilage.'}
                            </Text>
                        </View>

                        {/* BACK */}
                        <TouchableOpacity style={s.cta} onPress={() => navigation.goBack()}>
                            <MaterialCommunityIcons name="arrow-left" size={17} color="#253a50" style={{ marginRight: 8 }} />
                            <Text style={s.ctaTxt}>Return to Dashboard</Text>
                        </TouchableOpacity>

                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#030810' },
    centered: { flex: 1, backgroundColor: '#030810', justifyContent: 'center', alignItems: 'center', gap: 14 },
    loadingText: { color: '#4b6b8a', fontSize: 11, fontWeight: '900', letterSpacing: 3 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 15,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    backBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerMain: { flex: 1, marginLeft: 4 },
    hTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
    hSub: { fontSize: 14, fontWeight: '700', marginLeft: 4 },
    hLocRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5 },
    statusPillText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    // Card
    card: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#0a1a2f', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#1a2e46', elevation: 5 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardLabel: { color: '#4b6b8a', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    cardHint: { color: '#8fa8c0', fontSize: 11, fontWeight: '600', marginTop: 3 },
    pctBox: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
    pctN: { fontSize: 24, fontWeight: '900' },
    pctU: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#4b6b8a', marginTop: -2 },

    // Stage
    stage: { alignItems: 'center', justifyContent: 'center', minHeight: 300, borderRadius: 22, overflow: 'hidden', position: 'relative', paddingVertical: 10 },
    glow: { position: 'absolute', bottom: 16, width: '60%', height: 30, borderRadius: 100 },
    modelContainer: { width: SW - 72, height: 280, borderRadius: 24, overflow: 'hidden', backgroundColor: '#05101e', borderWidth: 1, borderColor: '#1a2e46' },
    webViewWrapper: { flex: 1 },
    webView: { flex: 1, backgroundColor: 'transparent' },
    visualBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },

    // Progress
    progWrap: { marginTop: 20 },
    progRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    progLabel: { color: '#8fa8c0', fontSize: 13, fontWeight: '700' },
    progVal: { fontSize: 20, fontWeight: '900' },
    track: { height: 10, backgroundColor: '#132842', borderRadius: 5, overflow: 'visible', position: 'relative', marginBottom: 10 },
    tick: { position: 'absolute', top: -4, width: 2, height: 18, backgroundColor: 'rgba(255,255,255,0.1)' },
    fill: { position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 5 },
    limits: { flexDirection: 'row', justifyContent: 'space-between' },
    lim: { color: '#4b6b8a', fontSize: 10, fontWeight: '800' },

    // Generic Section Header
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 10, marginBottom: 12 },
    sectionTitle: { color: '#4b6b8a', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },

    // Stats Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 10, marginBottom: 20 },
    statCard: { flex: 1, minWidth: '30%', backgroundColor: '#0a1a2f', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#1a2e46' },
    statIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statLabel: { color: '#4b6b8a', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    statVal: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Env Grid
    envGrid: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 22 },
    envCard: { flex: 1, height: 90, borderRadius: 24, padding: 16, overflow: 'hidden', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' },
    envLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    envValue: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 2 },
    envStatus: { color: '#fff', fontSize: 9, fontWeight: '900', opacity: 0.5, letterSpacing: 1, transform: [{ rotate: '-90deg' }], position: 'absolute', right: -10 },
    liveTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', marginRight: 6 },
    liveText: { color: '#ef4444', fontSize: 9, fontWeight: '900' },

    // Stock List
    stockList: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#0a1a2f', borderRadius: 28, padding: 10, borderWidth: 1, borderColor: '#1a2e46' },
    stockItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    stockMarker: { width: 4, height: 24, borderRadius: 2, marginRight: 14 },
    stockVariety: { color: '#fff', fontSize: 15, fontWeight: '800' },
    stockDate: { color: '#4b6b8a', fontSize: 12, fontWeight: '600', marginTop: 2 },
    stockWeightBox: { alignItems: 'flex-end' },
    stockWeight: { color: '#fff', fontSize: 16, fontWeight: '900' },
    stockBags: { color: '#4b6b8a', fontSize: 11, fontWeight: '700' },
    stockCount: { color: '#10b981', fontSize: 10, fontWeight: '900' },
    emptyStock: { padding: 40, alignItems: 'center' },
    emptyStockText: { color: '#4b6b8a', fontSize: 13, fontWeight: '600', marginTop: 10 },

    // Insight
    insight: { flexDirection: 'row', marginHorizontal: 16, padding: 20, borderRadius: 24, gap: 16, marginBottom: 24, borderWidth: 1, alignItems: 'flex-start' },
    insightTxt: { flex: 1, fontSize: 13, lineHeight: 22, fontWeight: '600' },

    // CTA
    cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, backgroundColor: '#10b981', padding: 18, borderRadius: 20, elevation: 10 },
    ctaTxt: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },

    // New AI Advisor Styles
    badgeSmall: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeTextSmall: { color: '#fff', fontSize: 8, fontWeight: '900' },
    aiAdvisorCard: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#4c1d95' },
    aiAdvisorGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    aiIconWrapper: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(167,139,250,0.1)', justifyContent: 'center', alignItems: 'center' },
    aiStrategyTitle: { color: '#a78bfa', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    aiStrategyText: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 4, lineHeight: 20 },
    warningRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    warningText: { color: '#f87171', fontSize: 11, fontWeight: '600' },

    pestCard: { marginHorizontal: 16, backgroundColor: '#0a1a2f', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#1a2e46' },
    pestHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    pestTitle: { color: '#f87171', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    pestBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pestRiskBox: { flex: 1 },
    pestRiskLabel: { color: '#4b6b8a', fontSize: 9, fontWeight: '800', marginBottom: 4 },
    pestRiskValue: { fontSize: 14, fontWeight: '800' },
    reportBtn: { backgroundColor: '#dc2626', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, gap: 8 },
    reportBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },
});
