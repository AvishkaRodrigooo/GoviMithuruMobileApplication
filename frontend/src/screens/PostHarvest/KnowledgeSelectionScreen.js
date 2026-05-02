import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
    Image,
    Platform,
    StatusBar,
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
        navigation.navigate('Stage');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <Pressable
                    style={styles.backBtn}
                    onPress={() => navigation.navigate('Stage')}
                >
                    <MaterialCommunityIcons name="chevron-left" size={32} color="#16a34a" />
                </Pressable>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>Expertise Level</Text>
                    <Text style={styles.headerSubtitle}>Tailor the experience to your needs</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="school-outline" size={50} color="#16a34a" />
                    </View>
                    <Text style={styles.heroTitle}>Select Your Experience</Text>
                    <Text style={styles.heroSub}>Choose a level or take our quick AI assessment</Text>
                </View>

                <View style={styles.cardsContainer}>
                    <Pressable
                        style={[styles.levelCard, { borderLeftColor: '#10b981' }]}
                        onPress={() => selectLevel('BEGINNER')}
                    >
                        <View style={[styles.levelIconBox, { backgroundColor: '#f0fdf4' }]}>
                            <MaterialCommunityIcons name="seed-outline" size={28} color="#10b981" />
                        </View>
                        <View style={styles.levelContent}>
                            <Text style={styles.levelName}>Beginner</Text>
                            <Text style={styles.levelDesc}>New to storage. Need a step-by-step guide on how to store and select bags.</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                    </Pressable>

                    <Pressable
                        style={[styles.levelCard, { borderLeftColor: '#3b82f6' }]}
                        onPress={() => selectLevel('INTERMEDIATE')}
                    >
                        <View style={[styles.levelIconBox, { backgroundColor: '#eff6ff' }]}>
                            <MaterialCommunityIcons name="sprout-outline" size={28} color="#3b82f6" />
                        </View>
                        <View style={styles.levelContent}>
                            <Text style={styles.levelName}>Intermediate</Text>
                            <Text style={styles.levelDesc}>Have some experience. Looking to optimize moisture control and monitoring.</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                    </Pressable>

                    <Pressable
                        style={[styles.levelCard, { borderLeftColor: '#8b5cf6' }]}
                        onPress={() => selectLevel('ADVANCED')}
                    >
                        <View style={[styles.levelIconBox, { backgroundColor: '#f5f3ff' }]}>
                            <MaterialCommunityIcons name="trophy-outline" size={28} color="#8b5cf6" />
                        </View>
                        <View style={styles.levelContent}>
                            <Text style={styles.levelName}>Advanced</Text>
                            <Text style={styles.levelDesc}>Expert farmer. Need professional-grade risk/reward analysis and market timing.</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                    </Pressable>
                </View>

                <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.divider} />
                </View>

                <Pressable style={styles.quizBtn} onPress={startQuiz}>
                    <LinearGradient
                        colors={['#16a34a', '#15803d']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.quizBtnGrad}
                    >
                        <MaterialCommunityIcons name="auto-fix" size={22} color="#fff" />
                        <Text style={styles.quizBtnText}>Start AI Assessment</Text>
                    </LinearGradient>
                </Pressable>

                <View style={styles.footerNoteContainer}>
                    <MaterialCommunityIcons name="information-outline" size={16} color="#9ca3af" />
                    <Text style={styles.footerNote}>
                        Our AI assesses your responses to unlock specialized features.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingHorizontal: 16,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        gap: 12,
        elevation: 2,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    headerTextWrap: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
    headerSubtitle: { fontSize: 13, color: '#16a34a', fontWeight: '700' },

    scrollContent: { padding: 20 },
    heroSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heroTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 8 },
    heroSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 20 },

    cardsContainer: { gap: 16 },
    levelCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderLeftWidth: 6,
    },
    levelIconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    levelContent: { flex: 1 },
    levelName: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 4 },
    levelDesc: { fontSize: 13, color: '#6b7280', lineHeight: 20 },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
    divider: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
    dividerText: { marginHorizontal: 20, color: '#9ca3af', fontWeight: '900', fontSize: 12, letterSpacing: 1 },

    quizBtn: { borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    quizBtnGrad: { flexDirection: 'row', padding: 18, alignItems: 'center', justifyContent: 'center', gap: 12 },
    quizBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },

    footerNoteContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, paddingHorizontal: 20 },
    footerNote: { color: '#9ca3af', fontSize: 12, textAlign: 'center', fontWeight: '600' },
});
