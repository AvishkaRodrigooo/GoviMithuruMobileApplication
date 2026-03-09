import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, Dimensions, Animated, Alert, TextInput,
    ActivityIndicator, Modal, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW } = Dimensions.get('window');
import { BASE_URL } from '../../utils/apiConfig';
import { getStorageGuide } from './storagePrompts';

export default function StorageStepGuideScreen({ navigation, route }) {
    const storageType = route.params?.storageType || 'Home';
    const subCategory = route.params?.subCategory || 'Kitchen/Room Storage';

    const guideData = getStorageGuide(storageType, subCategory);
    const steps = guideData.guideContent.steps;

    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState({});
    const [showCalendar, setShowCalendar] = useState(false);
    const [lang, setLang] = useState('en');
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatScrollRef = useRef(null);

    // ── Language label map ───────────────────────────────────────────────────
    const LANG_API_MAP = { en: 'en', si: 'si', ta: 'ta' };

    // ── UI strings per language ──────────────────────────────────────────────
    const UI_STRINGS = {
        en: {
            details: 'PROTOCOL DETAILS',
            process: 'EXECUTION PROCESS',
            infra: 'REQUIRED INFRASTRUCTURE',
            monitoring: 'MONITORING LOGIC & RULES',
            containers: 'CONTAINER OPTIONS',
            checklist: 'PRE-STORAGE CHECKLIST',
            mandatory: 'MANDATORY RULES',
            maintenance: 'MAINTENANCE CALENDAR',
            stats: 'STORAGE QUICK STATS',
            warnings: 'MANDATORY WARNINGS',
            daily: 'DAILY',
            weekly: 'WEEKLY',
            monthly: 'MONTHLY',
            quarterly: 'QUARTERLY',
            back: 'BACK',
            finish: 'FINISH SOP',
            complete: 'MARK STEP COMPLETE',
            chatTitle: 'Ask Advisor About This Step',
            placeholder: 'Ask about SLR 603 standards, drying, pest control...',
            success: 'Success!',
            allDone: 'You have completed the entire Storage SOP!',
            auditorActive: 'Quality Auditor Active',
            standards: 'Ensuring SLR 603 standards',
            pros: 'Pros',
            cons: 'Cons',
            finishBtn: 'Finish',
            stepOf: 'Step',
            of: 'of',
            protocolHistory: 'Protocol History',
            notCompleted: 'Not Yet Completed',
            close: 'CLOSE',
        },
        si: {
            details: 'ප්‍රොටෝකෝල විස්තර',
            process: 'ක්‍රියාත්මක කිරීමේ ක්‍රියාවලිය',
            infra: 'අවශ්‍ය යටිතල පහසුකම්',
            monitoring: 'නිරීක්ෂණ තර්කනය සහ නීති',
            containers: 'ගබඩා බහාලුම් විකල්ප',
            checklist: 'ගබඩා කිරීමට පෙර පිරික්සුම් ලැයිස්තුව',
            mandatory: 'අනිවාර්ය නීති',
            maintenance: 'නඩත්තු දින දර්ශනය',
            stats: 'ගබඩා දත්ත',
            warnings: 'අනිවාර්ය අනතුරු ඇඟවීම්',
            daily: 'දිනපතා',
            weekly: 'සතිපතා',
            monthly: 'මාසික',
            quarterly: 'කාර්තුමය',
            back: 'පසුපසට',
            finish: 'අවසන් කරන්න',
            complete: 'පියවර සම්පූර්ණයි',
            chatTitle: 'මෙම පියවර ගැන විමසන්න',
            placeholder: 'SLR 603 ප්‍රමිතීන් ගැන, වියළීම, පළිබෝධ ගැන අසන්න...',
            success: 'සාර්ථකයි!',
            allDone: 'ඔබ සියලුම පියවර සම්පූර්ණ කර ඇත!',
            auditorActive: 'ගුණාත්මකභාවය සහතික කෙරේ',
            standards: 'SLR 603 සම්මත ප්‍රමිතීන් සහතික කරයි',
            pros: 'වාසි',
            cons: 'අවාසි',
            finishBtn: 'අවසන්',
            stepOf: 'පියවර',
            of: 'න්',
            protocolHistory: 'ක්‍රියාදාම ඉතිහාසය',
            notCompleted: 'තවම සම්පූර්ණ නොකළා',
            close: 'වසන්න',
        },
        ta: {
            details: 'நெறிமுறை விவரங்கள்',
            process: 'செயற்படுத்தும் முறை',
            infra: 'தேவையான உள்கட்டமைப்பு',
            monitoring: 'கண்காணிப்பு விதிமுறைகள்',
            containers: 'களஞ்சிய கொள்கலன்கள்',
            checklist: 'களஞ்சியப்படுத்தலுக்கு முந்தைய சரிபார்ப்பு பட்டியல்',
            mandatory: 'கட்டாய விதிகள்',
            maintenance: 'பராமரிப்பு அட்டவணை',
            stats: 'களஞ்சிய புள்ளிவிவரங்கள்',
            warnings: 'கட்டாய எச்சரிக்கைகள்',
            daily: 'தினசரி',
            weekly: 'வாராந்திர',
            monthly: 'மாதாந்திர',
            quarterly: 'காலாண்டு',
            back: 'பின்னால்',
            finish: 'முடிக்க',
            complete: 'படிநிலையை முடிக்க',
            chatTitle: 'இந்த படி பற்றி ஆலோசனை பெறவும்',
            placeholder: 'SLR 603 தரங்கள், உலர்த்துதல், பூச்சி பற்றி கேளுங்கள்...',
            success: 'வெற்றி!',
            allDone: 'நீங்கள் அனைத்து நிலைகளையும் முடித்துவிட்டீர்கள்!',
            auditorActive: 'தரப் பரிசோதனை நடக்கிறது',
            standards: 'SLR 603 தரத்தை உறுதிப்படுத்துகிறது',
            pros: 'நன்மைகள்',
            cons: 'தீமைகள்',
            finishBtn: 'முடிக்க',
            stepOf: 'படி',
            of: '/',
            protocolHistory: 'நெறிமுறை வரலாறு',
            notCompleted: 'இன்னும் முடிக்கவில்லை',
            close: 'மூடு',
        },
    };

    // ── Bot greeting per language ────────────────────────────────────────────
    const getBotGreeting = (stepTitle, language) => {
        const greetings = {
            en: `I am your Post-Harvest Storage Advisor. I'll help you with "${stepTitle}". Ask me anything about this step, SLR 603 standards, drying methods, or pest control!`,
            si: `මම ඔබේ අස්වනු ගබඩා උපදේශකයායි. "${stepTitle}" පියවර සඳහා ඔබට සහාය වන්නෙමි. මෙම පියවර, SLR 603 ප්‍රමිතීන්, වියළීම හෝ පළිබෝධ නිවාරණය ගැන ඕනෑම දෙයක් අසන්න!`,
            ta: `நான் உங்கள் அறுவடைக்குப் பிந்தைய களஞ்சிய ஆலோசகர். "${stepTitle}" படிநிலைக்கு நான் உங்களுக்கு உதவுவேன். இந்தப் படி, SLR 603 தரங்கள், உலர்த்துதல் அல்லது பூச்சி கட்டுப்பாடு பற்றி ஏதாவது கேளுங்கள்!`,
        };
        return greetings[language] || greetings.en;
    };

    const [chatMessages, setChatMessages] = useState([
        { id: 1, text: getBotGreeting(steps[0]?.title || '', 'en'), isBot: true },
    ]);

    const progressAnim = useRef(new Animated.Value(0)).current;

    // ── Reset chat and progress when step or language changes ────────────────
    useEffect(() => {
        const progress = (currentStep + 1) / steps.length;
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 600,
            useNativeDriver: false,
        }).start();

        setChatMessages([
            {
                id: Date.now(),
                text: getBotGreeting(steps[currentStep]?.title || '', lang),
                isBot: true,
            },
        ]);
    }, [currentStep, lang]);

    const UI = UI_STRINGS[lang] || UI_STRINGS.en;

    // ── Step complete handler ────────────────────────────────────────────────
    const handleStepComplete = () => {
        const newCompleted = { ...completedSteps };
        newCompleted[currentStep] = new Date().toLocaleDateString();
        setCompletedSteps(newCompleted);

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            Alert.alert(UI.success, UI.allDone, [
                { text: UI.finishBtn, onPress: () => navigation.goBack() },
            ]);
        }
    };

    // ── Send chat message via Ollama qwen2.5:7b ──────────────────────────────
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
                    lang: LANG_API_MAP[lang],
                    context: {
                        interaction_type: 'storage_step_guide',
                        step_title: steps[currentStep]?.title || '',
                        storage_type: storageType,
                        sub_category: subCategory,
                        requested_language: LANG_API_MAP[lang],
                    },
                    history: chatMessages.slice(-6).map(m => ({
                        role: m.isBot ? 'assistant' : 'user',
                        content: m.text,
                    })),
                }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data.success && data.answer) {
                setChatMessages(prev => [
                    ...prev,
                    { id: Date.now(), text: data.answer, isBot: true },
                ]);
            } else {
                throw new Error('No answer returned');
            }
        } catch (e) {
            const fallbackMsgs = {
                en: 'I\'m having trouble connecting to the advisor. Key tip: Always store paddy at 13% moisture or below (SLR 603 Grade A).',
                si: 'සම්බන්ධ වීමට නොහැකිය. ප්‍රධාන ඉඟිය: SLR 603 ශ්‍රේණිය A සඳහා 13% ට අඩු තෙතමනයෙන් වී ගබඩා කරන්න.',
                ta: 'இணைப்பதில் சிக்கல் உள்ளது. முக்கிய குறிப்பு: SLR 603 Grade A க்கு 13% க்கும் குறைவான ஈரப்பதத்தில் நெல்லை சேமிக்கவும்.',
            };
            setChatMessages(prev => [
                ...prev,
                { id: Date.now(), text: fallbackMsgs[lang] || fallbackMsgs.en, isBot: true },
            ]);
        } finally {
            setIsTyping(false);
            setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const step = steps[currentStep] || {};

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#16a34a" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {guideData.title || subCategory}
                    </Text>
                    <Text style={styles.headerSub}>{storageType} Specialist Guide</Text>
                </View>

                {/* Language Switcher */}
                <View style={styles.langRow}>
                    {['en', 'si', 'ta'].map(l => (
                        <TouchableOpacity
                            key={l}
                            onPress={() => setLang(l)}
                            style={[styles.langBtn, lang === l && styles.langBtnActive]}
                        >
                            <Text style={[styles.langText, lang === l && styles.langTextActive]}>
                                {l.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.calBtn}>
                    <MaterialCommunityIcons name="calendar-clock" size={24} color="#16a34a" />
                </TouchableOpacity>
            </View>

            {/* ── Banner ── */}
            <View style={styles.welcomeBanner}>
                <LinearGradient colors={['#064e3b', '#065f46']} style={styles.welcomeGrad}>
                    <MaterialCommunityIcons name="shield-check" size={24} color="#34d399" />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.welcomeTitle}>{UI.auditorActive}</Text>
                        <Text style={styles.welcomeSub}>{UI.standards}</Text>
                    </View>
                </LinearGradient>
            </View>

            {/* ── Progress ── */}
            <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                    <Text style={styles.progressText}>
                        {UI.stepOf} {currentStep + 1} {UI.of} {steps.length}
                    </Text>
                    <Text style={styles.progressPct}>
                        {Math.round(((currentStep + 1) / steps.length) * 100)}%
                    </Text>
                </View>
                <View style={styles.track}>
                    <Animated.View
                        style={[
                            styles.fill,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                </View>
            </View>

            {/* ── Main content ── */}
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    {/* Step Icon */}
                    <View style={styles.iconCircle}>
                        {step.icon && /[^\x00-\x7F]/.test(step.icon) ? (
                            <Text style={{ fontSize: 32 }}>{step.icon}</Text>
                        ) : (
                            <MaterialCommunityIcons
                                name={step.icon || 'bullseye-arrow'}
                                size={35}
                                color="#10b981"
                            />
                        )}
                    </View>

                    <Text style={styles.stepTitle}>{step.title}</Text>

                    {step.cost && (
                        <View style={styles.costBadge}>
                            <MaterialCommunityIcons name="currency-rupee" size={16} color="#10b981" />
                            <Text style={styles.costText}>{step.cost}</Text>
                        </View>
                    )}

                    {/* Details */}
                    {step.details && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{UI.details}</Text>
                            <Text style={styles.listText}>{step.details}</Text>
                        </View>
                    )}

                    {/* Process */}
                    {step.process && Array.isArray(step.process) && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{UI.process}</Text>
                            {step.process.map((item, i) => (
                                <View key={i} style={styles.listItem}>
                                    <View style={styles.bullet} />
                                    <Text style={styles.listText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Infrastructure items */}
                    {step.items && Array.isArray(step.items) && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{UI.infra}</Text>
                            {step.items.map((item, i) => (
                                <View key={i} style={styles.checkRow}>
                                    <MaterialCommunityIcons name="tools" size={18} color="#10b981" />
                                    <Text style={styles.listText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Logic rules */}
                    {step.logic && Array.isArray(step.logic) && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{UI.monitoring}</Text>
                            {step.logic.map((rule, i) => (
                                <View key={i} style={styles.logicRow}>
                                    <MaterialCommunityIcons name="brain" size={18} color="#34d399" />
                                    <Text style={styles.listText}>{rule}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Container options */}
                    {step.options && Array.isArray(step.options) && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{UI.containers}</Text>
                            {step.options.map((opt, i) => (
                                <View key={i} style={styles.optionBox}>
                                    <View style={styles.optHeader}>
                                        <Text style={styles.optName}>{opt.name}</Text>
                                        <Text style={styles.optCost}>{opt.cost}</Text>
                                    </View>
                                    <Text style={styles.optDesc}>
                                        <Text style={{ color: '#10b981' }}>{UI.pros}: </Text>
                                        {opt.pros}
                                    </Text>
                                    <Text style={styles.optDesc}>
                                        <Text style={{ color: '#ef4444' }}>{UI.cons}: </Text>
                                        {opt.cons}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Checklist */}
                    {step.checklist && Array.isArray(step.checklist) && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{UI.checklist}</Text>
                            {step.checklist.map((item, i) => (
                                <View key={i} style={styles.checkRow}>
                                    <MaterialCommunityIcons name="check-box-outline" size={20} color="#10b981" />
                                    <Text style={styles.listText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Mandatory rules */}
                    {step.rules && Array.isArray(step.rules) && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{UI.mandatory}</Text>
                            {step.rules.map((rule, i) => (
                                <View key={i} style={styles.ruleRow}>
                                    <MaterialCommunityIcons name="shield-alert" size={18} color="#f59e0b" />
                                    <Text style={styles.listText}>{rule}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Maintenance routines */}
                    {step.routines && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{UI.maintenance}</Text>
                            {step.routines.daily && (
                                <View style={styles.routineBlock}>
                                    <Text style={styles.routineHeader}>{UI.daily}</Text>
                                    {step.routines.daily.map((r, i) => (
                                        <View key={i} style={styles.listItem}>
                                            <View style={styles.bullet} />
                                            <Text style={styles.listText}>{r}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {step.routines.weekly && (
                                <View style={styles.routineBlock}>
                                    <Text style={styles.routineHeader}>{UI.weekly}</Text>
                                    {step.routines.weekly.map((r, i) => (
                                        <View key={i} style={styles.listItem}>
                                            <View style={styles.bullet} />
                                            <Text style={styles.listText}>{r}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {step.routines.monthly && (
                                <View style={styles.routineBlock}>
                                    <Text style={styles.routineHeader}>{UI.monthly}</Text>
                                    {step.routines.monthly.map((r, i) => (
                                        <View key={i} style={styles.listItem}>
                                            <View style={styles.bullet} />
                                            <Text style={styles.listText}>{r}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {step.routines.quarterly && (
                                <View style={styles.routineBlock}>
                                    <Text style={styles.routineHeader}>{UI.quarterly}</Text>
                                    {step.routines.quarterly.map((r, i) => (
                                        <View key={i} style={styles.listItem}>
                                            <View style={styles.bullet} />
                                            <Text style={styles.listText}>{r}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Quick stats */}
                    {guideData.guideContent.quickStats && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{UI.stats}</Text>
                            <View style={styles.statsRow}>
                                {guideData.guideContent.quickStats.map((stat, i) => (
                                    <View key={i} style={styles.statChip}>
                                        <Text style={styles.statLabel}>{stat.label}</Text>
                                        <Text style={styles.statValue}>{stat.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Warnings */}
                    {guideData.guideContent.warnings && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{UI.warnings}</Text>
                            {guideData.guideContent.warnings.map((w, i) => (
                                <View key={i} style={styles.warningBox}>
                                    <MaterialCommunityIcons name="alert-circle" size={18} color="#ef4444" />
                                    <Text style={styles.warningText}>{w}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* ── Ollama qwen2.5:7b Multilingual Chat ── */}
                <View style={styles.chatSection}>
                    <View style={styles.chatHeader}>
                        <MaterialCommunityIcons name="robot-outline" size={22} color="#10b981" />
                        <Text style={styles.chatTitle}>{UI.chatTitle}</Text>
                    </View>

                    <View style={styles.chatBox}>
                        <ScrollView
                            ref={chatScrollRef}
                            style={styles.chatScroll}
                            nestedScrollEnabled
                            onContentSizeChange={() =>
                                chatScrollRef.current?.scrollToEnd({ animated: true })
                            }
                        >
                            {chatMessages.map(m => (
                                <View
                                    key={m.id}
                                    style={[styles.message, m.isBot ? styles.botMsg : styles.userMsg]}
                                >
                                    {m.isBot && (
                                        <View style={styles.botIcon}>
                                            <MaterialCommunityIcons
                                                name="robot-outline"
                                                size={14}
                                                color="#10b981"
                                            />
                                        </View>
                                    )}
                                    <Text
                                        style={[
                                            styles.msgText,
                                            !m.isBot && { color: '#fff' },
                                        ]}
                                    >
                                        {m.text}
                                    </Text>
                                </View>
                            ))}
                            {isTyping && (
                                <View style={[styles.message, styles.botMsg]}>
                                    <ActivityIndicator color="#10b981" size="small" />
                                    <Text style={[styles.msgText, { color: '#9ca3af', marginLeft: 8 }]}>
                                        {lang === 'si'
                                            ? 'ටයිප් කරමින් ...'
                                            : lang === 'ta'
                                            ? 'தட்டச்சு செய்கிறது...'
                                            : 'Advisor is thinking...'}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder={UI.placeholder}
                                value={chatInput}
                                onChangeText={setChatInput}
                                placeholderTextColor="#94a3b8"
                                onSubmitEditing={handleSendMessage}
                                returnKeyType="send"
                                multiline={false}
                            />
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                style={[styles.sendBtn, !chatInput.trim() && { opacity: 0.5 }]}
                                disabled={!chatInput.trim()}
                            >
                                <MaterialCommunityIcons name="send" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* ── Footer Buttons ── */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                    style={[styles.prevBtn, currentStep === 0 && { opacity: 0.4 }]}
                    disabled={currentStep === 0}
                >
                    <Text style={styles.prevText}>{UI.back}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStepComplete} style={styles.completeBtn}>
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.completeGrad}
                    >
                        <Text style={styles.completeText}>
                            {currentStep === steps.length - 1 ? UI.finish : UI.complete}
                        </Text>
                        <MaterialCommunityIcons name="check-all" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* ── Completion History Modal ── */}
            <Modal visible={showCalendar} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{UI.protocolHistory}</Text>
                        <ScrollView>
                            {steps.map((s, i) => (
                                <View key={i} style={styles.historyRow}>
                                    <MaterialCommunityIcons
                                        name={
                                            completedSteps[i]
                                                ? 'checkbox-marked-circle'
                                                : 'checkbox-blank-circle-outline'
                                        }
                                        size={24}
                                        color={completedSteps[i] ? '#10b981' : '#334155'}
                                    />
                                    <View style={{ marginLeft: 15, flex: 1 }}>
                                        <Text style={styles.historyTitle}>{s.title}</Text>
                                        <Text style={styles.historyDate}>
                                            {completedSteps[i] || UI.notCompleted}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => setShowCalendar(false)}
                            style={styles.closeBtn}
                        >
                            <Text style={styles.closeBtnText}>{UI.close}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f9fafb' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
        paddingTop: 16, gap: 12, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#e5e7eb', elevation: 2,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdf4',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#bbf7d0',
    },
    headerTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
    headerSub: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
    langRow: {
        flexDirection: 'row', gap: 4, marginRight: 4,
        backgroundColor: '#f3f4f6', padding: 4, borderRadius: 10,
    },
    langBtn: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 6 },
    langBtnActive: { backgroundColor: '#fff', elevation: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2 },
    langText: { fontSize: 10, fontWeight: '900', color: '#94a3b8' },
    langTextActive: { color: '#16a34a' },
    calBtn: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdf4',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#bbf7d0',
    },

    // Banner
    welcomeBanner: { marginHorizontal: 16, marginTop: 16 },
    welcomeGrad: {
        padding: 16, borderRadius: 20,
        flexDirection: 'row', alignItems: 'center',
    },
    welcomeTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
    welcomeSub: { color: '#34d399', fontSize: 11, fontWeight: '700', marginTop: 2 },

    // Progress
    progressSection: {
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { color: '#6b7280', fontSize: 12, fontWeight: '700' },
    progressPct: { color: '#16a34a', fontSize: 12, fontWeight: '900' },
    track: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 3 },

    // Scroll content
    scroll: { paddingBottom: 130 },

    // Main card
    card: {
        margin: 16, backgroundColor: '#fff', borderRadius: 24,
        padding: 20, borderWidth: 1, borderColor: '#e5e7eb', elevation: 2,
    },
    iconCircle: {
        width: 70, height: 70, borderRadius: 35, backgroundColor: '#dcfce7',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 15, alignSelf: 'center',
    },
    stepTitle: {
        color: '#111827', fontSize: 20, fontWeight: '900',
        textAlign: 'center', marginBottom: 25,
    },
    costBadge: {
        flexDirection: 'row', backgroundColor: '#dcfce7', alignSelf: 'center',
        paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10,
        alignItems: 'center', gap: 6, marginBottom: 20,
    },
    costText: { color: '#16a34a', fontSize: 13, fontWeight: '900' },

    // Sections
    section: { marginBottom: 25 },
    sectionTitle: {
        color: '#9ca3af', fontSize: 11, fontWeight: '900',
        letterSpacing: 1.5, marginBottom: 15,
    },
    listItem: {
        flexDirection: 'row', alignItems: 'flex-start',
        marginBottom: 12, gap: 10,
    },
    bullet: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: '#16a34a', marginTop: 6,
    },
    listText: { color: '#374151', fontSize: 14, lineHeight: 22, flex: 1 },

    optionBox: {
        backgroundColor: '#f9fafb', padding: 15, borderRadius: 14,
        marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb',
    },
    optHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    optName: { color: '#111827', fontSize: 15, fontWeight: '800' },
    optCost: { color: '#16a34a', fontSize: 14, fontWeight: '900' },
    optDesc: { color: '#6b7280', fontSize: 13, marginTop: 4, lineHeight: 20 },

    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    ruleRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        marginBottom: 12, backgroundColor: '#fef9c3',
        padding: 12, borderRadius: 14,
    },
    logicRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        marginBottom: 12, backgroundColor: '#f0fdf4',
        padding: 12, borderRadius: 14,
    },
    routineBlock: {
        marginBottom: 15, backgroundColor: '#f9fafb',
        padding: 15, borderRadius: 16,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    routineHeader: {
        color: '#16a34a', fontSize: 10, fontWeight: '900',
        marginBottom: 10, letterSpacing: 1,
    },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statChip: {
        backgroundColor: '#f0fdf4', padding: 12, borderRadius: 14,
        minWidth: '45%', flexGrow: 1,
        borderWidth: 1, borderColor: '#bbf7d0',
    },
    statLabel: { color: '#16a34a', fontSize: 10, fontWeight: '900', marginBottom: 4 },
    statValue: { color: '#111827', fontSize: 13, fontWeight: '800' },
    warningBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: '#fef2f2', padding: 15, borderRadius: 16,
        marginBottom: 12, borderWidth: 1, borderColor: '#fecaca',
    },
    warningText: { color: '#ef4444', fontSize: 13, lineHeight: 20, flex: 1, fontWeight: '700' },

    // ── Chat ──────────────────────────────────────────────────────────────────
    chatSection: { marginHorizontal: 16, marginBottom: 30 },
    chatHeader: {
        flexDirection: 'row', alignItems: 'center',
        gap: 8, marginBottom: 12,
    },
    chatTitle: { color: '#16a34a', fontSize: 14, fontWeight: '900' },
    chatBox: {
        backgroundColor: '#fff', borderRadius: 20, padding: 14,
        height: 340, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1,
    },
    chatScroll: { flex: 1 },
    message: {
        padding: 12, borderRadius: 16, marginBottom: 10,
        maxWidth: '88%', flexDirection: 'row', alignItems: 'flex-start',
    },
    botMsg: {
        alignSelf: 'flex-start', backgroundColor: '#f9fafb',
        borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb',
    },
    userMsg: {
        alignSelf: 'flex-end', backgroundColor: '#16a34a',
        borderBottomRightRadius: 4, flexDirection: 'row-reverse',
    },
    botIcon: { marginRight: 6, marginTop: 2 },
    msgText: { fontSize: 14, lineHeight: 21, color: '#374151', flex: 1 },
    inputRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    input: {
        flex: 1, backgroundColor: '#f9fafb', borderRadius: 14,
        paddingHorizontal: 15, color: '#111827', height: 46,
        borderWidth: 1, borderColor: '#e5e7eb', fontSize: 13,
    },
    sendBtn: {
        width: 46, height: 46, borderRadius: 14,
        backgroundColor: '#16a34a',
        justifyContent: 'center', alignItems: 'center',
    },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 16, flexDirection: 'row', gap: 12,
        backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
        elevation: 8,
    },
    prevBtn: {
        flex: 1, height: 56, borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center', alignItems: 'center',
    },
    prevText: { color: '#6b7280', fontSize: 14, fontWeight: '800' },
    completeBtn: { flex: 2, height: 56, borderRadius: 16, overflow: 'hidden' },
    completeGrad: {
        width: '100%', height: '100%',
        flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', gap: 10,
    },
    completeText: { color: '#fff', fontSize: 14, fontWeight: '900' },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff', borderTopLeftRadius: 28,
        borderTopRightRadius: 28, padding: 24, height: '60%',
    },
    modalTitle: { color: '#111827', fontSize: 20, fontWeight: '900', marginBottom: 20 },
    historyRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f9fafb', padding: 14,
        borderRadius: 16, marginBottom: 10,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    historyTitle: { color: '#111827', fontSize: 15, fontWeight: '700' },
    historyDate: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
    closeBtn: {
        backgroundColor: '#16a34a', padding: 18,
        borderRadius: 16, marginTop: 10, alignItems: 'center',
    },
    closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});