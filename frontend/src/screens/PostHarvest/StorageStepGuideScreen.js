import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, Dimensions, Animated, Alert, TextInput,
    ActivityIndicator, Image, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW } = Dimensions.get('window');
const BASE_URL = 'http://192.168.100.198:5000'; // Flask Backend

const HOME_STORAGE_GUIDE = {
    'Kitchen/Room Storage': {
        steps: [
            {
                id: 1,
                title: 'Room Preparation',
                duration: 'Day 1',
                materials: ['Broom & cleaning cloth', 'Phenyle/Dettol', 'Neem leaves', 'Old newspapers', 'Wooden boards/bricks'],
                process: [
                    'Empty the room completely',
                    'Sweep all corners thoroughly',
                    'Wipe walls/floor with phenyle solution (2 caps per liter)',
                    'Check and seal cracks with cement/clay',
                    'Dry for 4-6 hours',
                    'Spread neem leaves in corners',
                    'Place wooden boards (15cm height)'
                ],
                icon: 'home-edit-outline'
            },
            {
                id: 2,
                title: 'Container Selection',
                options: [
                    { name: 'Gunny Bags', cost: 'Rs. 100', pros: 'Breathable, cheap', cons: 'Poor pest protection (Max 3m)' },
                    { name: 'Polythene inside Gunny', cost: 'Rs. 150', pros: 'Better moisture control', cons: 'No ventilation' },
                    { name: 'Hermetic Bags', cost: 'Rs. 250', pros: '6-12m storage, best pest control', cons: 'Higher cost' }
                ],
                icon: 'package-variant-closed'
            },
            {
                id: 3,
                title: 'Rice Preparation',
                checklist: [
                    'Check Moisture (<14%)',
                    'Cleaning (Remove chaff/stones)',
                    'Cooling (2-3 hours)',
                    'Natural Preservatives (Neem/Ash)'
                ],
                icon: 'water-percent'
            },
            {
                id: 4,
                title: 'Stacking & Organization',
                rules: [
                    'Platform 15cm from floor',
                    'Newspaper layer first',
                    'Max 4 bags high',
                    'Cardboard between layers',
                    '15cm wall gap'
                ],
                icon: 'layers-triple'
            },
            {
                id: 5,
                title: 'Monitoring Schedule',
                routines: {
                    weekly: ['Insect/moth check', 'Holes/odors', 'Temperature feel'],
                    monthly: ['Open and inspect', 'Smell test', 'Moisture re-test', 'Rotate bags']
                },
                icon: 'eye-check-outline'
            }
        ]
    },
    'Dedicated Storage Room': {
        steps: [
            {
                id: 1,
                title: 'Infrastructure Preparation',
                cost: 'Approx Rs. 9,600',
                process: [
                    'Seal all wall cracks',
                    'Fix roof leaks',
                    'Install window wire mesh',
                    'Level and paint floor',
                    'Install exhaust fan',
                    'Install monitoring tools'
                ],
                icon: 'office-building-cog'
            },
            {
                id: 2,
                title: 'Storage Container Setup',
                options: [
                    { name: 'Multiple Bags', desc: 'Hermetic or Poly-lined (Max 5 high)' },
                    { name: 'Metal Drum', desc: 'Long-term, pest-proof (200kg)' },
                    { name: 'Traditional Bisso', desc: 'Clay bin, sustainable, lasts 10y' }
                ],
                icon: 'dolly'
            },
            {
                id: 3,
                title: 'Stacking System',
                layout: 'Zoning Concept',
                rules: [
                    '80cm aisles between stacks',
                    'FIFO organization',
                    'Labeling with color tags',
                    '15cm wall distance'
                ],
                icon: 'format-list-bulleted-type'
            },
            {
                id: 4,
                title: 'Advanced Monitoring',
                tools: ['Digital Hygrometer', 'Wall Chart', 'Pest Traps'],
                logic: [
                    'Green Zone: 25-28°C',
                    'Yellow Zone: 28-30°C',
                    'Red Zone: >30°C (Action Required)'
                ],
                icon: 'chart-bell-curve-cumulative'
            },
            {
                id: 5,
                title: 'Maintenance Schedule',
                routines: {
                    daily: ['Temp/Pest quick check'],
                    weekly: ['Detailed inspection', 'Sweep floor', 'Log results'],
                    monthly: ['Full inventory', 'Deep clean']
                },
                icon: 'calendar-check'
            }
        ]
    },
    'Small Shed Storage': {
        steps: [
            {
                id: 1,
                title: 'Structural Reinforcement',
                items: [
                    'Fix roof and cracks',
                    'Install rat guards (12 inch metal)',
                    'Insecticide wall spray',
                    'Install pallet system'
                ],
                icon: 'warehouse'
            },
            {
                id: 2,
                title: 'Zone Configuration',
                zones: ['Zone A: Variety 1', 'Zone B: Variety 2', 'Zone C: Future Stock'],
                icon: 'view-quilt'
            },
            {
                id: 3,
                title: 'Digital Records & Traps',
                logic: [
                    'Excel/Logbook logging',
                    'Pheromone traps installation',
                    'Weekly trap analysis'
                ],
                icon: 'cellphone-check'
            }
        ]
    }
};

export default function StorageStepGuideScreen({ navigation, route }) {
    const subCategory = route.params?.subCategory || 'Kitchen/Room Storage';
    const guideData = HOME_STORAGE_GUIDE[subCategory] || HOME_STORAGE_GUIDE['Kitchen/Room Storage'];
    const steps = guideData.steps;

    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState({});
    const [showCalendar, setShowCalendar] = useState(false);
    const [chatVisible, setChatVisible] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, text: `I am your Quality Auditor. I'll help you with ${steps[currentStep].title}. Ask me about moisture or grading!`, isBot: true }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const progress = (currentStep + 1) / steps.length;
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 600,
            useNativeDriver: false
        }).start();

        // Reset chat for new step
        setChatMessages([{ id: Date.now(), text: `Exploring ${steps[currentStep].title}. How can I assist with quality today?`, isBot: true }]);
    }, [currentStep]);

    const handleStepComplete = () => {
        const newCompleted = { ...completedSteps };
        newCompleted[currentStep] = new Date().toLocaleDateString();
        setCompletedSteps(newCompleted);

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            Alert.alert("Success!", "You have completed the entire Home Storage SOP!", [
                { text: "Finish", onPress: () => navigation.goBack() }
            ]);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const userMsg = { id: Date.now(), text: chatInput, isBot: false };
        setChatMessages(prev => [...prev, userMsg]);
        const question = chatInput;
        setChatInput('');
        setIsTyping(true);

        try {
            const res = await fetch(`${BASE_URL}/api/guardian/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    context: {
                        interaction_type: 'grading_consult',
                        step_title: steps[currentStep].title,
                        sub_category: subCategory
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                setChatMessages(prev => [...prev, { id: Date.now(), text: data.answer, isBot: true }]);
            } else {
                setChatMessages(prev => [...prev, { id: Date.now(), text: "I'm having trouble connecting. Ensure moisture is below 14% for storage.", isBot: true }]);
            }
        } catch (e) {
            setChatMessages(prev => [...prev, { id: Date.now(), text: "Network error. Check your local server connection.", isBot: true }]);
        } finally {
            setIsTyping(false);
        }
    };

    const step = steps[currentStep];

    return (
        <SafeAreaView style={styles.root}>
            <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFillObject} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>{subCategory}</Text>
                    <Text style={styles.headerSub}>SOP Guide</Text>
                </View>
                <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.calBtn}>
                    <MaterialCommunityIcons name="calendar-clock" size={24} color="#10b981" />
                </TouchableOpacity>
            </View>

            <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                    <Text style={styles.progressText}>Step {currentStep + 1} of {steps.length}</Text>
                    <Text style={styles.progressPct}>{Math.round(((currentStep + 1) / steps.length) * 100)}%</Text>
                </View>
                <View style={styles.track}>
                    <Animated.View style={[styles.fill, {
                        width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                        })
                    }]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name={step.icon} size={40} color="#10b981" />
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>

                    {step.process && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>EXECUTION PROCESS</Text>
                            {step.process.map((item, i) => (
                                <View key={i} style={styles.listItem}>
                                    <View style={styles.bullet} />
                                    <Text style={styles.listText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {step.options && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>CONTAINER OPTIONS</Text>
                            {step.options.map((opt, i) => (
                                <View key={i} style={styles.optionBox}>
                                    <View style={styles.optHeader}>
                                        <Text style={styles.optName}>{opt.name}</Text>
                                        <Text style={styles.optCost}>{opt.cost}</Text>
                                    </View>
                                    <Text style={styles.optDesc}><Text style={{ color: '#10b981' }}>Pros:</Text> {opt.pros}</Text>
                                    <Text style={styles.optDesc}><Text style={{ color: '#ef4444' }}>Cons:</Text> {opt.cons}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {step.checklist && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PRE-STORAGE CHECKLIST</Text>
                            {step.checklist.map((item, i) => (
                                <View key={i} style={styles.checkRow}>
                                    <MaterialCommunityIcons name="check-box-outline" size={20} color="#10b981" />
                                    <Text style={styles.listText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {step.rules && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>MANDATORY RULES</Text>
                            {step.rules.map((rule, i) => (
                                <View key={i} style={styles.ruleRow}>
                                    <MaterialCommunityIcons name="shield-alert" size={18} color="#f59e0b" />
                                    <Text style={styles.listText}>{rule}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {step.routines && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>WEEKLY ROUTINE</Text>
                            {step.routines.weekly.map((r, i) => (
                                <View key={i} style={styles.listItem}><View style={styles.bullet} /><Text style={styles.listText}>{r}</Text></View>
                            ))}
                            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>MONTHLY ROUTINE</Text>
                            {step.routines.monthly.map((r, i) => (
                                <View key={i} style={styles.listItem}><View style={styles.bullet} /><Text style={styles.listText}>{r}</Text></View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Chat Bot Section */}
                <View style={styles.chatSection}>
                    <View style={styles.chatHeader}>
                        <MaterialCommunityIcons name="robot-outline" size={20} color="#10b981" />
                        <Text style={styles.chatTitle}>Ask Inspector Grade A Details</Text>
                    </View>
                    <View style={styles.chatBox}>
                        <ScrollView style={styles.chatScroll} nestedScrollEnabled>
                            {chatMessages.map(m => (
                                <View key={m.id} style={[styles.message, m.isBot ? styles.botMsg : styles.userMsg]}>
                                    <Text style={styles.msgText}>{m.text}</Text>
                                </View>
                            ))}
                            {isTyping && <ActivityIndicator color="#10b981" style={{ alignSelf: 'flex-start', margin: 10 }} />}
                        </ScrollView>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ask about SLR 603 standards..."
                                value={chatInput}
                                onChangeText={setChatInput}
                                placeholderTextColor="#64748b"
                            />
                            <TouchableOpacity onPress={handleSendMessage} style={styles.sendBtn}>
                                <MaterialCommunityIcons name="send" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity onPress={() => currentStep > 0 && setCurrentStep(currentStep - 1)} style={styles.prevBtn}>
                    <Text style={styles.prevText}>BACK</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStepComplete} style={styles.completeBtn}>
                    <LinearGradient colors={['#10b981', '#059669']} style={styles.completeGrad}>
                        <Text style={styles.completeText}>{currentStep === steps.length - 1 ? 'FINISH SOP' : 'MARK STEP COMPLETE'}</Text>
                        <MaterialCommunityIcons name="check-all" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Completion History Modal */}
            <Modal visible={showCalendar} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Protocol History</Text>
                        <ScrollView>
                            {steps.map((s, i) => (
                                <View key={i} style={styles.historyRow}>
                                    <MaterialCommunityIcons
                                        name={completedSteps[i] ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                                        size={24}
                                        color={completedSteps[i] ? "#10b981" : "#334155"}
                                    />
                                    <View style={{ marginLeft: 15, flex: 1 }}>
                                        <Text style={styles.historyTitle}>{s.title}</Text>
                                        <Text style={styles.historyDate}>{completedSteps[i] || 'Not Yet Completed'}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>CLOSE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
    headerSub: { color: '#10b981', fontSize: 12, fontWeight: '700' },
    calBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#10b98110', justifyContent: 'center', alignItems: 'center' },

    progressSection: { paddingHorizontal: 20, marginBottom: 20 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
    progressPct: { color: '#10b981', fontSize: 12, fontWeight: '900' },
    track: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: '#10b981' },

    scroll: { paddingBottom: 120 },
    card: { margin: 20, backgroundColor: '#1e293b', borderRadius: 32, padding: 20, borderWidth: 1, borderColor: '#334155' },
    iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#10b98110', justifyContent: 'center', alignItems: 'center', marginBottom: 15, alignSelf: 'center' },
    stepTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 25 },

    section: { marginBottom: 25 },
    sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
    listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginTop: 6 },
    listText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22, flex: 1 },

    optionBox: { backgroundColor: '#0f172a', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
    optHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    optName: { color: '#fff', fontSize: 15, fontWeight: '800' },
    optCost: { color: '#10b981', fontSize: 14, fontWeight: '900' },
    optDesc: { color: '#94a3b8', fontSize: 13, marginTop: 4 },

    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12, backgroundColor: '#f59e0b10', padding: 10, borderRadius: 12 },

    chatSection: { marginHorizontal: 20, marginBottom: 30 },
    chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    chatTitle: { color: '#10b981', fontSize: 13, fontWeight: '900' },
    chatBox: { backgroundColor: '#1e293b', borderRadius: 24, padding: 15, height: 350, borderWidth: 1, borderColor: '#334155' },
    chatScroll: { flex: 1 },
    message: { padding: 12, borderRadius: 18, marginBottom: 10, maxWidth: '85%' },
    botMsg: { alignSelf: 'flex-start', backgroundColor: '#0f172a', borderBottomLeftRadius: 4 },
    userMsg: { alignSelf: 'flex-end', backgroundColor: '#10b981', borderBottomRightRadius: 4 },
    msgText: { color: '#fff', fontSize: 14, lineHeight: 20 },
    inputRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    input: { flex: 1, backgroundColor: '#0f172a', borderRadius: 15, paddingHorizontal: 15, color: '#fff', height: 45 },
    sendBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, flexDirection: 'row', gap: 15, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b' },
    prevBtn: { flex: 1, height: 60, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
    prevText: { color: '#94a3b8', fontSize: 14, fontWeight: '800' },
    completeBtn: { flex: 2, height: 60, borderRadius: 20, overflow: 'hidden' },
    completeGrad: { width: '100%', height: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    completeText: { color: '#fff', fontSize: 14, fontWeight: '900' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, height: '60%' },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 20 },
    historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 20, marginBottom: 12 },
    historyTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
    historyDate: { color: '#64748b', fontSize: 12, marginTop: 2 },
    closeBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 20, marginTop: 10, alignItems: 'center' },
    closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' }
});
