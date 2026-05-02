import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
    StatusBar, Dimensions, Animated, Keyboard, Alert, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { BASE_URL, API_ENDPOINTS } from '../../utils/apiConfig';

const { width, height } = Dimensions.get('window');

// Enhanced Language detection helper
const detectLanguage = (text, fallbackLang) => {
    const tamilPattern = /[அ-ஹ]+/;
    const sinhalaPattern = /[අ-෴]+/;

    if (tamilPattern.test(text)) return 'ta';
    if (sinhalaPattern.test(text)) return 'si';

    const tamilWords = ['vanakkam', 'epadi', 'irukinga', 'sapadu', 'paddy', 'nellu', 'vivasayi'];
    const sinhalaWords = ['ayubowan', 'kohomada', 'hondain', 'vap', 'goiyan', 'govi'];

    const lowerText = text.toLowerCase();
    let tamilMatch = tamilWords.filter(word => lowerText.includes(word)).length;
    let sinhalaMatch = sinhalaWords.filter(word => lowerText.includes(word)).length;

    if (tamilMatch > sinhalaMatch && tamilMatch > 0) return 'ta-tanglish';
    if (sinhalaMatch > tamilMatch && sinhalaMatch > 0) return 'si-singlish';

    return fallbackLang;
};

// Welcome messages
const WELCOME_MESSAGES = {
    'en': "👋 Ayubovan! I'm your AI farming assistant. I can help you with paddy storage, market prices, and post-harvest management. What would you like to know?",
    'ta': "👋 வணக்கம்! நான் உங்கள் AI விவசாய உதவியாளர். நெல் சேமிப்பு, சந்தை விலைகள் மற்றும் அறுவடை மேலாண்மை பற்றி உதவ முடியும். என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?",
    'si': "👋 ආයුබෝවන්! මම ඔබේ AI ගොවිපල සහායකයා. වී ගබඩා කිරීම, වෙළඳපල මිල ගණන් සහ අස්වනු කළමනාකරණය පිළිබඳ උපකාර කළ හැක. ඔබට දැන ගැනීමට අවශ්ය කුමක්ද?",
    'ta-tanglish': "👋 Vanakkam! I'm ungal AI farming assistant. Paddy storage, market prices, post-harvest management pathi help panna mudiyum. Enna therinjukka wish panreenga?",
    'si-singlish': "👋 Ayubovan! Mama oyage AI farming sahakaya. Vee gabadakirima, velandapola mila, asvanu kalamanakaranaya gana udav karanna puluwan. Oyata dannna ona monawada?"
};

// Quick action suggestions
const QUICK_ACTIONS = [
    { id: '1', label: '📦 Paddy Storage', languages: { en: 'Paddy Storage', ta: 'நெல் சேமிப்பு', si: 'වී ගබඩා කිරීම' } },
    { id: '2', label: '💰 Market Prices', languages: { en: 'Market Prices', ta: 'சந்தை விலைகள்', si: 'වෙළඳපල මිල ගණන්' } },
    { id: '3', label: '🌾 Best Varieties', languages: { en: 'Best Varieties', ta: 'சிறந்த ரகங்கள்', si: 'හොඳම ප්‍රභේද' } },
    { id: '4', label: '🐛 Pest Control', languages: { en: 'Pest Control', ta: 'பூச்சி கட்டுப்பாடு', si: 'පළිබෝධ පාලනය' } },
];

// Typing animation component
const TypingIndicator = () => {
    const [dot1] = useState(new Animated.Value(0));
    const [dot2] = useState(new Animated.Value(0));
    const [dot3] = useState(new Animated.Value(0));

    useEffect(() => {
        const animate = (dot, delay) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 300,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animate(dot1, 0);
        animate(dot2, 150);
        animate(dot3, 300);
    }, []);

    return (
        <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
            <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
            <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
        </View>
    );
};

export default function BeginnerStorageGuideScreen({ navigation }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState(null);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const flatListRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const inputRef = useRef(null);

    // Load initial welcome message
    useEffect(() => {
        setMessages([
            {
                id: '1',
                role: 'assistant',
                content: WELCOME_MESSAGES[currentLanguage] || WELCOME_MESSAGES['en'],
                language: currentLanguage,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [currentLanguage]);

    const speakText = (text, language, messageId) => {
        if (isSpeaking && speakingMessageId === messageId) {
            Speech.stop();
            setIsSpeaking(false);
            setSpeakingMessageId(null);
        } else {
            if (isSpeaking) Speech.stop();

            const languageMap = {
                'ta': 'ta-IN',
                'si': 'si-LK',
                'en': 'en-US',
                'ta-tanglish': 'en-IN',
                'si-singlish': 'en-IN'
            };

            Speech.speak(text, {
                language: languageMap[language] || 'en-US',
                pitch: 1,
                rate: 0.9,
                onStart: () => {
                    setIsSpeaking(true);
                    setSpeakingMessageId(messageId);
                },
                onDone: () => {
                    setIsSpeaking(false);
                    setSpeakingMessageId(null);
                },
                onError: () => {
                    setIsSpeaking(false);
                    setSpeakingMessageId(null);
                }
            });
        }
    };

    const sendMessage = async (text = inputText) => {
        if (!text.trim() || loading) return;

        const userMsgText = text.trim();
        const detectedLang = detectLanguage(userMsgText, currentLanguage);
        setCurrentLanguage(detectedLang);
        setShowQuickActions(false);

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userMsgText,
            language: detectedLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);
        Keyboard.dismiss();

        const history = messages.slice(-6).map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }));

        try {
            const response = await fetch(API_ENDPOINTS.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMsgText,
                    history: history,
                    context: { requested_language: detectedLang }
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.answer,
                    language: data.language_code || detectedLang,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: getErrorMessage(detectedLang),
                    language: detectedLang,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: getConnectionError(detectedLang),
                language: detectedLang,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setLoading(false);
        }
    };

    const getErrorMessage = (lang) => {
        const errors = {
            'en': "Sorry, I'm having trouble connecting. Please try again.",
            'ta': "மன்னிக்கவும், இணைப்பதில் சிக்கல் உள்ளது. மீண்டும் முயற்சிக்கவும்.",
            'si': "සමාවන්න, සම්බන්ධ වීමේ ගැටලුවක් ඇත. කරුණාකර නැවත උත්සාහ කරන්න.",
            'ta-tanglish': "Sorry, connection la problem iruku. Please try again.",
            'si-singlish': "Samawenna, connection ekata prashnayak tiyenawa. Please try again."
        };
        return errors[lang] || errors['en'];
    };

    const getConnectionError = (lang) => {
        const errors = {
            'en': "Network error. Please check your internet connection.",
            'ta': "பிணையப் பிழை. உங்கள் இணைய இணைப்பை சரிபார்க்கவும்.",
            'si': "ජාල දෝෂයකි. කරුණාකර ඔබගේ අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න.",
            'ta-tanglish': "Network error. Unga internet connection ah check pannunga.",
            'si-singlish': "Network error. Obe internet connection eka check karanan."
        };
        return errors[lang] || errors['en'];
    };

    useEffect(() => {
        if (flatListRef.current) {
            setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 200);
        }
    }, [messages, loading]);

    const getLanguageDisplay = (langCode) => {
        const displays = {
            'ta': 'தமிழ்',
            'si': 'සිංහල',
            'ta-tanglish': 'Tanglish',
            'si-singlish': 'Singlish',
            'en': 'English'
        };
        return displays[langCode] || 'English';
    };

    const renderMessage = ({ item }) => (
        <Animated.View style={[
            styles.messageWrapper,
            item.role === 'user' ? styles.userWrapper : styles.assistantWrapper,
            { opacity: fadeAnim }
        ]}>
            {item.role === 'assistant' && (
                <View style={styles.assistantAvatar}>
                    <LinearGradient
                        colors={['#16a34a', '#15803d']}
                        style={styles.avatarGrad}
                    >
                        <MaterialCommunityIcons name="robot" size={18} color="#fff" />
                    </LinearGradient>
                </View>
            )}

            <View style={[
                styles.messageBubble,
                item.role === 'user' ? styles.userBubble : styles.assistantBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    item.role === 'user' ? styles.userText : styles.assistantText
                ]}>
                    {item.content}
                </Text>

                <View style={styles.messageMeta}>
                    <Text style={styles.timestampText}>{item.timestamp}</Text>

                    {item.role === 'assistant' && (
                        <TouchableOpacity
                            onPress={() => speakText(item.content, item.language, item.id)}
                            style={[
                                styles.speakButton,
                                isSpeaking && speakingMessageId === item.id && styles.speakButtonActive
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={isSpeaking && speakingMessageId === item.id ? "volume-high" : "volume-medium"}
                                size={16}
                                color={isSpeaking && speakingMessageId === item.id ? "#16a34a" : "#9ca3af"}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {item.role === 'user' && (
                <View style={styles.userAvatar}>
                    <LinearGradient
                        colors={['#4b5563', '#374151']}
                        style={styles.avatarGrad}
                    >
                        <MaterialCommunityIcons name="account" size={18} color="#fff" />
                    </LinearGradient>
                </View>
            )}
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>🌾 Farm Assistant</Text>
                        <View style={styles.statusContainer}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>AI Expert • Online</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.languageButton}
                        onPress={() => {
                            Alert.alert(
                                "Select Language",
                                "Choose AI response language:",
                                [
                                    { text: "English", onPress: () => setCurrentLanguage('en') },
                                    { text: "தமிழ்", onPress: () => setCurrentLanguage('ta') },
                                    { text: "සිංහල", onPress: () => setCurrentLanguage('si') },
                                    { text: "Tanglish", onPress: () => setCurrentLanguage('ta-tanglish') },
                                    { text: "Singlish", onPress: () => setCurrentLanguage('si-singlish') },
                                    { text: "Cancel", style: "cancel" }
                                ]
                            );
                        }}
                    >
                        <MaterialCommunityIcons name="translate" size={22} color="#16a34a" />
                        <Text style={styles.languageButtonText}>
                            {getLanguageDisplay(currentLanguage)}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Chat Area */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.chatContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        showQuickActions && messages.length === 1 ? (
                            <View style={styles.quickActionsContainer}>
                                <Text style={styles.quickActionsTitle}>Quick Actions</Text>
                                <View style={styles.quickActionsGrid}>
                                    {QUICK_ACTIONS.map(action => (
                                        <TouchableOpacity
                                            key={action.id}
                                            style={styles.quickActionButton}
                                            onPress={() => sendMessage(action.languages[currentLanguage] || action.label)}
                                        >
                                            <Text style={styles.quickActionText}>
                                                {action.languages[currentLanguage] || action.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        loading ? (
                            <View style={styles.typingContainer}>
                                <View style={styles.assistantAvatar}>
                                    <LinearGradient colors={['#16a34a', '#15803d']} style={styles.avatarGrad}>
                                        <MaterialCommunityIcons name="robot" size={18} color="#fff" />
                                    </LinearGradient>
                                </View>
                                <View style={styles.typingBubble}>
                                    <TypingIndicator />
                                    <Text style={styles.typingText}>AI is thinking...</Text>
                                </View>
                            </View>
                        ) : null
                    }
                />

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Type your message..."
                            placeholderTextColor="#9ca3af"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            onFocus={() => setShowQuickActions(false)}
                        />

                        <TouchableOpacity
                            onPress={() => sendMessage()}
                            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                            disabled={loading || !inputText.trim()}
                        >
                            <LinearGradient
                                colors={inputText.trim() ? ['#16a34a', '#15803d'] : ['#e5e7eb', '#d1d5db']}
                                style={styles.sendGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <MaterialCommunityIcons
                                        name="send"
                                        size={20}
                                        color={inputText.trim() ? "#fff" : "#9ca3af"}
                                    />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(229, 231, 235, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    languageButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16a34a',
        marginLeft: 4,
    },
    chatContent: {
        padding: 16,
        paddingBottom: 32,
    },
    messageWrapper: {
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    userWrapper: {
        justifyContent: 'flex-end',
    },
    assistantWrapper: {
        justifyContent: 'flex-start',
    },
    assistantAvatar: {
        marginRight: 8,
        marginBottom: 4,
    },
    userAvatar: {
        marginLeft: 8,
        marginBottom: 4,
    },
    avatarGrad: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        maxWidth: width * 0.75,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    userBubble: {
        backgroundColor: '#16a34a',
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: '#fff',
        fontWeight: '500',
    },
    assistantText: {
        color: '#374151',
    },
    messageMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    timestampText: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '500',
    },
    speakButton: {
        padding: 4,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    speakButtonActive: {
        backgroundColor: '#dcfce7',
    },
    quickActionsContainer: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    quickActionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickActionButton: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    quickActionText: {
        fontSize: 13,
        color: '#4b5563',
        fontWeight: '500',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    typingDots: {
        flexDirection: 'row',
        marginRight: 8,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#16a34a',
        marginHorizontal: 2,
    },
    typingText: {
        fontSize: 13,
        color: '#9ca3af',
        fontWeight: '500',
        marginLeft: 4,
    },
    inputContainer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(229, 231, 235, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    input: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 15,
        maxHeight: 100,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    sendButton: {
        marginLeft: 8,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sendButtonDisabled: {
        opacity: 0.7,
    },
    sendGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});