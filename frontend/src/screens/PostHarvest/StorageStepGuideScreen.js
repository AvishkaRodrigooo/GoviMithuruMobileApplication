import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, Dimensions, Animated, Alert, TextInput,
    ActivityIndicator, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW } = Dimensions.get('window');

const STORAGE_STEPS = [
    {
        id: 1,
        title: "Cleaning & Sanitation",
        icon: "broom",
        desc: "Remove all previous grain residues and cobwebs. Disinfect the floor and walls to eliminate dormant pests.",
        tips: ["Use physical cleaning first", "Seal cracks in walls", "Check for rodent entry points"],
        expertAdvise: "Pests often hide in cracks. Even 5g of old grain can infest 10 tons of new stock."
    },
    {
        id: 2,
        title: "Moisture Verification",
        icon: "water-percent",
        desc: "Ensure grain moisture is between 12-14%. Use a moisture meter or the 'salt test' if unavailable.",
        tips: ["Dry on clean tarps", "Avoid direct stacking on ground", "Target 13.5% for long-term"],
        expertAdvise: "Moisture above 14% is the #1 cause of fungal growth (Aflatoxins)."
    },
    {
        id: 3,
        title: "Hermetic Bagging",
        icon: "bag-personal-outline",
        desc: "Use air-tight (Hermetic) bags for premium protection. These bags suffocate insects by oxygen depletion.",
        tips: ["Squeeze out excess air", "Seal inner liner tight", "Check for punctures"],
        expertAdvise: "In hermetic conditions, insects die naturally as oxygen drops below 5%."
    },
    {
        id: 4,
        title: "Systematic Stacking",
        icon: "layers-triple-outline",
        desc: "Stack bags on pallets (wooden platforms). Leave 1.5ft gap between stacks and walls.",
        tips: ["Max 10 bags high", "Leave space for inspection", "Use cross-stacking for stability"],
        expertAdvise: "Contact with walls transfers moisture and heat. Pallets prevent 'ground-sweat' moisture."
    },
    {
        id: 5,
        title: "Climate Control",
        icon: "thermometer-lines",
        desc: "Configure monitoring. Choose either IoT sensors or Local Weather API syncing.",
        tips: ["Keep temp below 30°C", "Ventilate during dry hours", "Monitor weekly"],
        expertAdvise: "Every 5°C increase in temperature doubles the rate of insect reproduction."
    }
];

export default function StorageStepGuideScreen({ navigation }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [chatVisible, setChatVisible] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I am your Rice Storage Specialist. Ask me anything about this step.", isBot: true }
    ]);
    const [inputText, setInputText] = useState('');

    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const progress = ((currentStep + 1) / STORAGE_STEPS.length);
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false
        }).start();
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < STORAGE_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleExit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleExit = () => {
        const percent = Math.round(((currentStep + 1) / STORAGE_STEPS.length) * 100);
        Alert.alert(
            "Protocol Summary",
            `You have completed ${percent}% of the Safe Storage Protocol. Would you like to save your progress?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Exit & Save", onPress: () => navigation.goBack() }
            ]
        );
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const userMsg = { id: Date.now(), text: inputText, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');

        // Mock bot response based on step
        setTimeout(() => {
            let response = "That's a great question. For this step, the most important thing is following the IRRI standards for rice quality.";
            if (currentStep === 1) response = "If you don't have a meter, the 'Bit Test' helps. If the grain cracks clearly when bitten, it's roughly 13%.";
            if (currentStep === 3) response = "Yes, pallets are mandatory. Without them, the bottom bags will absorb soil moisture and rot within 30 days.";

            const botMsg = { id: Date.now() + 1, text: response, isBot: true };
            setMessages(prev => [...prev, botMsg]);
        }, 1000);
    };

    const step = STORAGE_STEPS[currentStep];

    return (
        <SafeAreaView style={styles.root}>
            <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFillObject} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleExit} style={styles.exitBtn}>
                    <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.headerBody}>
                    <Text style={styles.headerTitle}>Storage Protocol</Text>
                    <Text style={styles.headerSub}>Step {step.id} of {STORAGE_STEPS.length}</Text>
                </View>
                <View style={styles.avatarWrap}>
                    <Image
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png' }}
                        style={styles.avatar}
                    />
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progContainer}>
                <View style={styles.progBg}>
                    <Animated.View style={[styles.progFill, {
                        width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                        })
                    }]} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Content Card */}
                <Animated.View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <LinearGradient colors={['#10b981', '#059669']} style={styles.iconGrad}>
                            <MaterialCommunityIcons name={step.icon} size={40} color="#fff" />
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>{step.title}</Text>
                    <Text style={styles.desc}>{step.desc}</Text>

                    <View style={styles.divider} />

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>PRO TIPS</Text>
                        {step.tips.map((tip, i) => (
                            <View key={i} style={styles.tipRow}>
                                <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
                                <Text style={styles.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </View>

                    <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.expertBox}>
                        <View style={styles.expertHeader}>
                            <MaterialCommunityIcons name="comment-quote" size={20} color="#a78bfa" />
                            <Text style={styles.expertLabel}>EXPERT ADVISE</Text>
                        </View>
                        <Text style={styles.expertText}>{step.expertAdvise}</Text>
                    </LinearGradient>
                </Animated.View>

                {/* Chat Toggle */}
                <TouchableOpacity style={styles.chatToggle} onPress={() => setChatVisible(!chatVisible)}>
                    <MaterialCommunityIcons name="chat-processing" size={24} color="#10b981" />
                    <Text style={styles.chatToggleText}>Need help with this step?</Text>
                </TouchableOpacity>

                {chatVisible && (
                    <View style={styles.chatContainer}>
                        <View style={styles.chatHeader}>
                            <Text style={styles.chatTitle}>Specialist Helper</Text>
                        </View>
                        <ScrollView style={styles.chatList} nestedScrollEnabled>
                            {messages.map(m => (
                                <View key={m.id} style={[styles.msgBox, m.isBot ? styles.botBox : styles.userBox]}>
                                    <Text style={styles.msgText}>{m.text}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <View style={styles.inputArea}>
                            <TextInput
                                style={styles.input}
                                placeholder="ASK A QUESTION..."
                                placeholderTextColor="#64748b"
                                value={inputText}
                                onChangeText={setInputText}
                            />
                            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                                <MaterialCommunityIcons name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Footer Navigation */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.navBtn, currentStep === 0 && { opacity: 0.3 }]}
                    onPress={handleBack}
                    disabled={currentStep === 0}
                >
                    <Text style={styles.navBtnText}>PREVIOUS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <LinearGradient colors={['#10b981', '#059669']} style={styles.nextGrad}>
                        <Text style={styles.nextBtnText}>
                            {currentStep === STORAGE_STEPS.length - 1 ? 'FINISH' : 'NEXT STEP'}
                        </Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, gap: 15 },
    exitBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    headerBody: { flex: 1 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    headerSub: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
    avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b98122', borderWidth: 1, borderColor: '#10b98144', padding: 4 },
    avatar: { width: '100%', height: '100%', borderRadius: 18 },

    progContainer: { paddingHorizontal: 20, marginBottom: 20 },
    progBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
    progFill: { height: '100%', backgroundColor: '#10b981' },

    scroll: { paddingBottom: 100 },
    card: { margin: 20, backgroundColor: '#1e293b', borderRadius: 32, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    iconCircle: { width: 80, height: 80, borderRadius: 40, marginBottom: 20, elevation: 10 },
    iconGrad: { width: '100%', height: '100%', borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    title: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
    desc: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },

    section: { alignSelf: 'stretch', marginBottom: 20 },
    sectionTitle: { color: '#64748b', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
    tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    tipText: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },

    expertBox: { alignSelf: 'stretch', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#a78bfa44' },
    expertHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    expertLabel: { color: '#a78bfa', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    expertText: { color: '#cbd5e1', fontSize: 13, lineHeight: 20, fontWeight: '500' },

    chatToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 10 },
    chatToggleText: { color: '#10b981', fontSize: 14, fontWeight: '700' },

    chatContainer: { margin: 20, backgroundColor: '#0f172a', borderRadius: 24, padding: 15, height: 300, borderWidth: 1, borderColor: '#334155' },
    chatHeader: { borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 10, marginBottom: 10 },
    chatTitle: { color: '#f1f5f9', fontSize: 14, fontWeight: '800' },
    chatList: { flex: 1 },
    msgBox: { padding: 12, borderRadius: 16, marginBottom: 10, maxWidth: '85%' },
    botBox: { backgroundColor: '#334155', alignSelf: 'flex-start' },
    userBox: { backgroundColor: '#10b981', alignSelf: 'flex-end' },
    msgText: { color: '#fff', fontSize: 13, lineHeight: 18 },
    inputArea: { flexDirection: 'row', gap: 10, marginTop: 10 },
    input: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 15, color: '#fff', fontSize: 12 },
    sendBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, gap: 15, backgroundColor: '#0f172a' },
    navBtn: { flex: 1, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    navBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '800' },
    nextBtn: { flex: 2, height: 56, borderRadius: 18, overflow: 'hidden' },
    nextGrad: { width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' }
});
