import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Animated,
    Dimensions,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
import { BASE_URL } from '../../utils/apiConfig';

export default function KnowledgeQuizScreen({ navigation }) {
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/guardian/quiz`);
            const data = await res.json();
            if (data.success) {
                setQuestions(data.questions);
            } else {
                Alert.alert('Error', 'Could not load quiz questions.');
                navigation.goBack();
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Network Error', 'Ensure the Flask server is running.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleOptionPress = (optionIdx) => {
        if (isAnswered) return;
        const optionLetter = String.fromCharCode(65 + optionIdx); // 0=A, 1=B, etc.
        setSelectedOption(optionIdx);
        setIsAnswered(true);

        if (optionLetter === questions[currentIdx].answer) {
            setScore(score + 1);
        }
    };

    const nextQuestion = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setEvaluating(true);
        try {
            const res = await fetch(`${BASE_URL}/api/guardian/evaluate-level`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score }),
            });
            const data = await res.json();
            if (data.success) {
                Alert.alert(
                    'Evaluation Complete',
                    `Level: ${data.level}\n${data.description}`,
                    [{ text: 'Go to Dashboard', onPress: () => navigation.navigate('Stage', { userLevel: data.level }) }]
                );
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to evaluate knowledge level.');
        } finally {
            setEvaluating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.loadingText}>Fetching AI Quiz questions...</Text>
            </View>
        );
    }

    const q = questions[currentIdx];
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <MaterialCommunityIcons name="close" size={24} color="#16a34a" />
                    </Pressable>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Knowledge Check</Text>
                        <Text style={styles.headerSubtitle}>Analyzing expertise level</Text>
                    </View>
                    <View style={styles.qCountBadge}>
                        <Text style={styles.qCountText}>{currentIdx + 1}/{questions.length}</Text>
                    </View>
                </View>
                <View style={styles.progressBarWrapper}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>{q.question}</Text>
                </View>

                <View style={styles.optionsContainer}>
                    {q.options.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isSelected = selectedOption === idx;
                        const isCorrect = isAnswered && letter === q.answer;
                        const isWrong = isAnswered && isSelected && letter !== q.answer;

                        return (
                            <Pressable
                                key={idx}
                                style={[
                                    styles.optionBtn,
                                    isSelected && styles.selectedOption,
                                    isCorrect && styles.correctOption,
                                    isWrong && styles.wrongOption,
                                ]}
                                onPress={() => handleOptionPress(idx)}
                            >
                                <View style={[
                                    styles.letterCircle,
                                    isSelected && styles.selectedLetterCircle,
                                    isCorrect && styles.correctLetterCircle,
                                    isWrong && styles.wrongLetterCircle,
                                    isAnswered && (isCorrect || isWrong) && { display: 'none' }
                                ]}>
                                    <Text style={[
                                        styles.letterText,
                                        isSelected && styles.selectedLetterText
                                    ]}>{letter}</Text>
                                </View>
                                {isCorrect && <MaterialCommunityIcons name="check-circle" size={24} color="#16a34a" style={{ marginRight: 12 }} />}
                                {isWrong && <MaterialCommunityIcons name="close-circle" size={24} color="#dc2626" style={{ marginRight: 12 }} />}
                                <Text style={[
                                    styles.optionText,
                                    isSelected && styles.selectedOptionText,
                                    isAnswered && (isCorrect || isWrong) && styles.textBold
                                ]}>{opt}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                {isAnswered && (
                    <Animated.View style={styles.explanationBox}>
                        <View style={styles.expHeader}>
                            <MaterialCommunityIcons name="lightbulb-on" size={20} color="#1d4ed8" />
                            <Text style={styles.explanationTitle}>Research Insight</Text>
                        </View>
                        <Text style={styles.explanationText}>{q.explanation}</Text>
                    </Animated.View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Pressable
                    style={[styles.nextBtn, !isAnswered && styles.disabledBtn]}
                    onPress={nextQuestion}
                    disabled={!isAnswered || evaluating}
                >
                    {evaluating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <LinearGradient
                            colors={isAnswered ? ['#16a34a', '#15803d'] : ['#9ca3af', '#9ca3af']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.nextBtnGrad}
                        >
                            <Text style={styles.nextBtnText}>
                                {currentIdx === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
                        </LinearGradient>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 16, color: '#16a34a', fontWeight: '900', fontSize: 16 },

    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingHorizontal: 16,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        elevation: 2,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#16a34a', fontWeight: '700' },
    qCountBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    qCountText: { fontSize: 13, fontWeight: '800', color: '#6b7280' },

    progressBarWrapper: { marginTop: 16 },
    progressBarBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: 6, backgroundColor: '#16a34a', borderRadius: 3 },

    scrollContent: { padding: 20 },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    questionText: { fontSize: 19, fontWeight: '900', color: '#111827', lineHeight: 28 },

    optionsContainer: { gap: 14 },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2,
    },
    selectedOption: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    correctOption: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
    wrongOption: { borderColor: '#dc2626', backgroundColor: '#fee2e2' },

    letterCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    selectedLetterCircle: { backgroundColor: '#16a34a' },
    selectedLetterText: { color: '#fff' },
    letterText: { fontSize: 16, fontWeight: '900', color: '#6b7280' },

    optionText: { fontSize: 16, color: '#374151', flex: 1, fontWeight: '600' },
    selectedOptionText: { color: '#111827', fontWeight: '800' },
    textBold: { fontWeight: '900' },

    explanationBox: {
        marginTop: 24,
        padding: 20,
        backgroundColor: '#eff6ff',
        borderRadius: 20,
        borderLeftWidth: 6,
        borderLeftColor: '#3b82f6',
        marginBottom: 20,
    },
    expHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    explanationTitle: { fontSize: 15, fontWeight: '900', color: '#1d4ed8' },
    explanationText: { fontSize: 14, color: '#1e40af', lineHeight: 22, fontWeight: '600' },

    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#fff',
        elevation: 10,
    },
    nextBtn: { borderRadius: 20, overflow: 'hidden' },
    nextBtnGrad: {
        flexDirection: 'row',
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    disabledBtn: { opacity: 0.8 },
    nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
