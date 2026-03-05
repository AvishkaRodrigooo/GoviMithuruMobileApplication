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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const BASE_URL = 'http://192.168.100.199:5000'; // Match your computer's local IP

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
            <LinearGradient colors={['#16a34a', '#15803d']} style={styles.header}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="close" size={28} color="#fff" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Knowledge Check</Text>
                    <View style={{ width: 28 }} />
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.questionCard}>
                    <Text style={styles.questionCount}>Question {currentIdx + 1} of {questions.length}</Text>
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
                                <View style={[styles.letterCircle, isAnswered && (isCorrect || isWrong) && styles.letterCircleHidden]}>
                                    <Text style={styles.letterText}>{letter}</Text>
                                </View>
                                {isCorrect && <MaterialCommunityIcons name="check-circle" size={24} color="#166534" style={{ marginRight: 10 }} />}
                                {isWrong && <MaterialCommunityIcons name="close-circle" size={24} color="#991b1b" style={{ marginRight: 10 }} />}
                                <Text style={[styles.optionText, isAnswered && (isCorrect || isWrong) && styles.textBold]}>{opt}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                {isAnswered && (
                    <Animated.View style={styles.explanationBox} entering="fadeInUp">
                        <Text style={styles.explanationTitle}>Did you know?</Text>
                        <Text style={styles.explanationText}>{q.explanation}</Text>
                    </Animated.View>
                )}
            </View>

            <View style={styles.footer}>
                <Pressable
                    style={[styles.nextBtn, !isAnswered && styles.disabledBtn]}
                    onPress={nextQuestion}
                    disabled={!isAnswered || evaluating}
                >
                    {evaluating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.nextBtnText}>{currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                        </>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 12, color: '#16a34a', fontWeight: 'bold' },
    header: { paddingTop: 40, paddingHorizontal: 20, paddingBottom: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginTop: 20 },
    progressBarFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },
    content: { flex: 1, padding: 20 },
    questionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 4, marginBottom: 24 },
    questionCount: { fontSize: 13, color: '#16a34a', fontWeight: 'bold', marginBottom: 8 },
    questionText: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', lineHeight: 26 },
    optionsContainer: { gap: 14 },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    selectedOption: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    correctOption: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
    wrongOption: { borderColor: '#dc2626', backgroundColor: '#fee2e2' },
    letterCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    letterCircleHidden: { display: 'none' },
    letterText: { fontSize: 16, fontWeight: 'bold', color: '#6b7280' },
    optionText: { fontSize: 16, color: '#374151', flex: 1 },
    textBold: { fontWeight: 'bold' },
    explanationBox: { marginTop: 24, padding: 16, backgroundColor: '#eff6ff', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
    explanationTitle: { fontSize: 14, fontWeight: 'bold', color: '#1d4ed8', marginBottom: 4 },
    explanationText: { fontSize: 13, color: '#1e40af', lineHeight: 18 },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
    nextBtn: {
        flexDirection: 'row',
        backgroundColor: '#16a34a',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    disabledBtn: { backgroundColor: '#9ca3af' },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
