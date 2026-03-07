import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, Dimensions, Image, ActivityIndicator,
    Animated, Platform, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW } = Dimensions.get('window');
const BASE_URL = 'http://192.168.100.198:5000'; // Flask Backend

// Asset mapping (using local requires for React Native stability)
const IMAGE_MAP = {
    'v-temp': require('../../assets/expert_guide/ventilation.png'),
    'm-control': require('../../assets/expert_guide/moisture.png'),
    'p-protect': require('../../assets/expert_guide/pest.png'),
    's-method': require('../../assets/expert_guide/structure.png'),
    'q-sorting': require('../../assets/expert_guide/ventilation.png'), // Reusing similar asset or dummy
};

export default function StorageExpertGuideScreen({ navigation, route }) {
    const { temp = 28.5, humidity = 62 } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [knowledge, setKnowledge] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [aiInsight, setAiInsight] = useState(null);
    const [syncingAi, setSyncAi] = useState(false);

    // Hardcoded fallback data in case backend is unreachable during dev
    const fallbackData = [
        {
            "id": "v-temp",
            "title": "Ventilation & Cooling",
            "icon": "fan",
            "goal": "Reduce Warehouse_Temp to inhibit fungal growth.",
            "xgb_var": "Warehouse_Temp",
            "items": [
                {
                    "name": "Cooling System",
                    "industrial": "Electric Exhaust Fan / AC",
                    "traditional": "PVC Pipe Breathers / Roof Whitewash",
                    "logic": "Passive aeration uses cross-ventilation. Inserting drilled PVC pipes in paddy piles allows heat to rise naturally."
                },
                {
                    "name": "Dehumidification",
                    "industrial": "Industrial Dehumidifier",
                    "traditional": "Salt & Charcoal Trays",
                    "logic": "Rock salt and charcoal naturally absorb airborne moisture in storage corners."
                }
            ]
        },
        {
            "id": "m-control",
            "title": "Moisture Management",
            "icon": "water-percent",
            "goal": "Maintain Moisture_Content below 14% threshold.",
            "xgb_var": "Moisture_Content",
            "items": [
                {
                    "name": "Verification",
                    "industrial": "Digital Moisture Meter",
                    "traditional": "The 'Salt Bottle' Test",
                    "logic": "Mixing paddy with dry salt in a bottle; sticking salt indicates >14% moisture (biological danger zone)."
                },
                {
                    "name": "Drying Method",
                    "industrial": "Mechanical Flatbed Dryer",
                    "traditional": "Black Polythene on Raised Ground",
                    "logic": "Black tarps absorb max heat. Raised platforms prevent 'ground sweat' condensation."
                }
            ]
        },
        {
            "id": "p-protect",
            "title": "Pest & Insect Protection",
            "icon": "bug-stop",
            "goal": "Reduce Pest_Presence risk variable.",
            "xgb_var": "Pest_Presence",
            "items": [
                {
                    "name": "Repellents",
                    "industrial": "Chemical Fumigation",
                    "traditional": "Dried Neem (Kohomba) Leaves",
                    "logic": "Azadirachtin in Neem leaves acts as a natural deterrent for weevils (ghun)."
                },
                {
                    "name": "Rodent Guard",
                    "industrial": "Glue Traps / Ultrasonic Repellers",
                    "traditional": "Tin Plate Legs (Rat Guards)",
                    "logic": "Slippery tin overhangs on pallet legs physically block rats from climbing."
                }
            ]
        },
        {
            "id": "s-method",
            "title": "Storage Structure",
            "icon": "home-modern",
            "goal": "Optimize Storage_Method efficiency.",
            "xgb_var": "Storage_Method",
            "items": [
                {
                    "name": "Floor Strategy",
                    "industrial": "Standard Wooden Pallets",
                    "traditional": "Coconut Husk Layer / Logs",
                    "logic": "Laying husks creates a thermal break. Never place bags on cement as it transfers moisture."
                },
                {
                    "name": "Bin Type",
                    "industrial": "Galvanized Metal Silo",
                    "traditional": "Wooden Box (Atuwa) / Mud Bin",
                    "logic": "Raised traditional Atuwa protects from ground moisture and improves airflow."
                }
            ]
        },
        {
            "id": "q-sorting",
            "title": "Quality & Sorting",
            "icon": "filter-variant",
            "goal": "Remove Disfigured Paddy to prevent batch contamination.",
            "xgb_var": "Batch_Uniformity",
            "items": [
                {
                    "name": "Disfigured Grain Removal",
                    "industrial": "Gravity Separator / Color Sorter",
                    "traditional": "Floatation & Hand Picking",
                    "logic": "Traditional Sink/Float: Disfigured or 'bol' grains are lighter. In a water bucket, they float for skimming. Smut grains must be hand-picked or sieved using a 2mm mesh."
                },
                {
                    "name": "Smut Treatment",
                    "industrial": "Seed Dressing Fungicide",
                    "traditional": "Sun-Exposure (Solarization)",
                    "logic": "Thin-layer sun drying (thickness < 2cm) for 6 hours kills surface fungi. Smut-spoilt paddy must be kept separate from seed paddy."
                }
            ]
        }
    ];

    const fetchKnowledge = () => {
        setTimeout(() => {
            setKnowledge(fallbackData);
            setLoading(false);
        }, 800);
    };

    const fetchAIDeepDive = async (category) => {
        setSyncAi(true);
        try {
            const response = await fetch(`${BASE_URL}/api/guardian/advice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variety: "Rice",
                    moisture: 13.5,
                    warehouse_temp: temp,
                    humidity_pct: humidity,
                    context: `STORAGE MASTERY: ${category}. Provide 3 highly specific traditional or low-cost hacks to optimize this XGBoost variable.`
                })
            });
            const data = await response.json();
            if (data.success) {
                setAiInsight(data.advice);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSyncAi(false);
        }
    };

    useEffect(() => {
        fetchKnowledge();
        if (route.params?.showDisfigured) {
            // Wait for knowledge to load then set tab to the last one (Quality & Sorting)
            setTimeout(() => setActiveTab(4), 1000);
        }
    }, []);

    useEffect(() => {
        if (knowledge.length > 0) {
            fetchAIDeepDive(knowledge[activeTab].title);
        }
    }, [activeTab, knowledge]);

    const renderKnowledgeCard = (data) => (
        <View key={data.id} style={styles.kCard}>
            <View style={styles.kImageWrap}>
                <Image source={IMAGE_MAP[data.id]} style={styles.kImage} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imageOverlay}>
                    <View style={styles.badgeRow}>
                        <View style={styles.xgbBadge}>
                            <Text style={styles.xgbText}>XGBOOST VAR: {data.xgb_var}</Text>
                        </View>
                    </View>
                    <Text style={styles.kGoal}>{data.goal}</Text>
                </LinearGradient>
            </View>

            <View style={styles.kBody}>
                {data.items.map((item, idx) => (
                    <View key={idx} style={styles.kItem}>
                        <View style={styles.itemHeader}>
                            <View style={styles.dot} />
                            <Text style={styles.itemName}>{item.name}</Text>
                        </View>

                        <View style={styles.comparisonGrid}>
                            <View style={styles.compareCol}>
                                <Text style={styles.colLabel}>INDUSTRIAL TOOL</Text>
                                <View style={styles.toolBox}>
                                    <Text style={styles.toolTxt}>{item.industrial}</Text>
                                </View>
                            </View>
                            <View style={styles.arrowBox}>
                                <MaterialCommunityIcons name="swap-horizontal" size={20} color="#10b981" />
                            </View>
                            <View style={styles.compareCol}>
                                <Text style={styles.colLabel}>LOW-COST HACK</Text>
                                <View style={[styles.toolBox, { backgroundColor: '#10b98122', borderColor: '#10b98188' }]}>
                                    <Text style={[styles.toolTxt, { color: '#10b981' }]}>{item.traditional}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.logicBox}>
                            <MaterialCommunityIcons name="brain" size={16} color="#8fa8c0" />
                            <Text style={styles.logicTxt}>{item.logic}</Text>
                        </View>
                        {idx < data.items.length - 1 && <View style={styles.kDivider} />}
                    </View>
                ))}

                {/* AI DEEP DIVE SECTION */}
                <LinearGradient colors={['#7c3aed15', '#0f172a']} style={styles.aiDeepDive}>
                    <View style={styles.aiDeepHeader}>
                        <View style={styles.aiIconSpot}>
                            <MaterialCommunityIcons name="auto-fix" size={24} color="#a78bfa" />
                        </View>
                        <View>
                            <Text style={styles.aiDeepTitle}>AI DEEP DIVE</Text>
                            <Text style={styles.aiDeepSub}>Custom hacks for your current climate</Text>
                        </View>
                    </View>

                    {syncingAi ? (
                        <ActivityIndicator color="#a78bfa" style={{ marginVertical: 20 }} />
                    ) : aiInsight ? (
                        <View style={styles.aiAdviseWrap}>
                            <Text style={styles.aiAdviseTxt}>{aiInsight.risk_assessment}</Text>
                            <View style={styles.hackList}>
                                {aiInsight.immediate_actions?.map((hack, i) => (
                                    <View key={i} style={styles.hackItem}>
                                        <MaterialCommunityIcons name="lightbulb-on" size={16} color="#fbbf24" />
                                        <Text style={styles.hackText}>{hack}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.noAiText}>Connecting to LLM Strategy Engine...</Text>
                    )}
                </LinearGradient>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingTxt}>FETCHING EXPERT DATA...</Text>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#030810', '#081425']} style={StyleSheet.absoluteFillObject} />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.hTitle}>Storage Mastery</Text>
                        <Text style={styles.hSub}>Loss Prevention Expert Guide</Text>
                    </View>
                </View>

                <View style={styles.tabs}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {knowledge.map((k, idx) => (
                            <TouchableOpacity
                                key={k.id}
                                style={[styles.tab, activeTab === idx && styles.activeTab]}
                                onPress={() => setActiveTab(idx)}
                            >
                                <MaterialCommunityIcons
                                    name={k.icon}
                                    size={18}
                                    color={activeTab === idx ? '#fff' : '#4b6b8a'}
                                />
                                <Text style={[styles.tabText, activeTab === idx && styles.activeTabText]}>
                                    {k.title.split(' ')[0]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {renderKnowledgeCard(knowledge[activeTab])}

                    <View style={styles.disclaimer}>
                        <MaterialCommunityIcons name="information-outline" size={16} color="#4b6b8a" />
                        <Text style={styles.disclaimerText}>
                            Traditional methods are validated for small-scale preservation based on Sri Lankan agricultural research.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#030810' },
    centered: { flex: 1, backgroundColor: '#030810', justifyContent: 'center', alignItems: 'center' },
    loadingTxt: { color: '#4b6b8a', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 15 },

    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    hTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
    hSub: { color: '#10b981', fontSize: 12, fontWeight: '700' },

    tabs: { marginBottom: 20 },
    tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, gap: 8, borderWidth: 1, borderColor: 'transparent' },
    activeTab: { backgroundColor: '#10b981', borderColor: 'rgba(255,255,255,0.2)' },
    tabText: { color: '#4b6b8a', fontSize: 13, fontWeight: '800' },
    activeTabText: { color: '#fff' },

    kCard: { marginHorizontal: 16, backgroundColor: '#0a1a2f', borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: '#1a2e46' },
    kImageWrap: { height: 240, width: '100%', position: 'relative' },
    kImage: { width: '100%', height: '100%' },
    imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, height: '60%', justifyContent: 'flex-end' },
    badgeRow: { flexDirection: 'row', marginBottom: 10 },
    xgbBadge: { backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    xgbText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    kGoal: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 22 },

    kBody: { padding: 20 },
    kItem: { marginBottom: 25 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
    itemName: { color: '#fff', fontSize: 16, fontWeight: '900' },

    comparisonGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 15 },
    compareCol: { flex: 1 },
    colLabel: { color: '#4b6b8a', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
    toolBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', height: 54, justifyContent: 'center' },
    toolTxt: { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' },
    arrowBox: { paddingTop: 20 },

    logicBox: { flexDirection: 'row', backgroundColor: '#030810', padding: 15, borderRadius: 16, gap: 12, alignItems: 'flex-start' },
    logicTxt: { flex: 1, color: '#8fa8c0', fontSize: 12, lineHeight: 18, fontWeight: '600' },

    kDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 25 },

    disclaimer: { margin: 20, flexDirection: 'row', gap: 10, alignItems: 'center', opacity: 0.6 },
    disclaimerText: { flex: 1, color: '#4b6b8a', fontSize: 11, fontWeight: '600', fontStyle: 'italic' },

    aiDeepDive: { marginTop: 10, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#7c3aed44' },
    aiDeepHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
    aiIconSpot: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#7c3aed20', justifyContent: 'center', alignItems: 'center' },
    aiDeepTitle: { color: '#a78bfa', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
    aiDeepSub: { color: '#4b6b8a', fontSize: 11, fontWeight: '700' },
    aiAdviseWrap: { gap: 15 },
    aiAdviseTxt: { color: '#fff', fontSize: 13, lineHeight: 22, fontWeight: '600' },
    hackList: { gap: 12 },
    hackItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 14 },
    hackText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 18 },
    noAiText: { color: '#4b6b8a', fontSize: 11, fontStyle: 'italic', textAlign: 'center' },
});
