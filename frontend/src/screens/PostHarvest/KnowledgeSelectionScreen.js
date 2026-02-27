import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function KnowledgeSelectionScreen({ navigation }) {
    const [loading, setLoading] = useState(false);

    const selectLevel = (level) => {
        // In a real app, we'd save this to Firestore
        navigation.navigate('Stage', { userLevel: level });
    };

    const startQuiz = () => {
        navigation.navigate('KnowledgeQuiz');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#16a34a', '#15803d']}
                style={styles.header}
            >
                <Pressable
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
                </Pressable>
                <Text style={styles.headerTitle}>Welcome to Post-Harvest</Text>
                <Text style={styles.headerSubtitle}>Let's tailor the experience to your expertise</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="school" size={80} color="#16a34a" />
                </View>

                <Text style={styles.sectionTitle}>Select your knowledge level:</Text>

                <Pressable
                    style={[styles.levelCard, { borderLeftColor: '#10b981' }]}
                    onPress={() => selectLevel('BEGINNER')}
                >
                    <View style={styles.levelIconBox}>
                        <MaterialCommunityIcons name="seed-outline" size={32} color="#10b981" />
                    </View>
                    <View style={styles.levelContent}>
                        <Text style={styles.levelName}>Beginner</Text>
                        <Text style={styles.levelDesc}>New to storage. Need a step-by-step guide on how to store and select bags.</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                </Pressable>

                <Pressable
                    style={[styles.levelCard, { borderLeftColor: '#3b82f6' }]}
                    onPress={() => selectLevel('INTERMEDIATE')}
                >
                    <View style={styles.levelIconBox}>
                        <MaterialCommunityIcons name="sprout" size={32} color="#3b82f6" />
                    </View>
                    <View style={styles.levelContent}>
                        <Text style={styles.levelName}>Intermediate</Text>
                        <Text style={styles.levelDesc}>Have some experience. Looking to optimize moisture control and monitoring.</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                </Pressable>

                <Pressable
                    style={[styles.levelCard, { borderLeftColor: '#8b5cf6' }]}
                    onPress={() => selectLevel('ADVANCED')}
                >
                    <View style={styles.levelIconBox}>
                        <MaterialCommunityIcons name="trophy-variant" size={32} color="#8b5cf6" />
                    </View>
                    <View style={styles.levelContent}>
                        <Text style={styles.levelName}>Advanced</Text>
                        <Text style={styles.levelDesc}>Expert farmer. Need professional-grade risk/reward analysis and market timing.</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                </Pressable>

                <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.divider} />
                </View>

                <Pressable style={styles.quizBtn} onPress={startQuiz}>
                    <MaterialCommunityIcons name="brain" size={24} color="#fff" />
                    <Text style={styles.quizBtnText}>Not sure? Take a quick Quiz</Text>
                </Pressable>

                <Text style={styles.footerNote}>
                    Our AI will evaluate your answers to recommend the best dashboard.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        alignItems: 'center',
    },
    backBtn: { position: 'absolute', left: 20, top: 40 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
    scrollContent: { padding: 20 },
    iconContainer: { alignItems: 'center', marginVertical: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 20 },
    levelCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        elevation: 3,
        borderLeftWidth: 6,
    },
    levelIconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    levelContent: { flex: 1 },
    levelName: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    levelDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    divider: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
    dividerText: { marginHorizontal: 16, color: '#9ca3af', fontWeight: 'bold' },
    quizBtn: {
        flexDirection: 'row',
        backgroundColor: '#16a34a',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        elevation: 4,
    },
    quizBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    footerNote: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 20, paddingHorizontal: 20 },
});
