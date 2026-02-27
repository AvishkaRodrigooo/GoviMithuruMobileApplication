import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    ImageBackground,
    StatusBar,
    Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Start entry animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            })
        ]).start();

        // Loop a subtle pulse for the CTA
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ])
        ).start();

        // Auto-navigate to SignIn after delay
        const timer = setTimeout(() => {
            navigation.replace('SignIn');
        }, 4500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={s.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <ImageBackground
                source={require('../assets/splash_bg.png')}
                style={s.bg}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['transparent', 'rgba(3, 8, 16, 0.4)', '#030810']}
                    style={s.gradient}
                >
                    <Animated.View style={[
                        s.content,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
                    ]}>
                        {/* Logo Badge */}
                        <View style={s.logoBadge}>
                            <LinearGradient
                                colors={['#10b981', '#059669']}
                                style={s.logoIcon}
                            >
                                <Text style={s.logoText}>GM</Text>
                            </LinearGradient>
                        </View>

                        <Text style={s.appName}>GoviMithuru</Text>
                        <View style={s.accentLine} />

                        <Text style={s.tagline}>
                            Empowering Sustainable Agriculture through {"\n"}
                            <Text style={s.highlight}>Precision Engineering</Text>
                        </Text>

                        <View style={s.footer}>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }], opacity: 0.8 }}>
                                <Text style={s.loadingText}>INITIALIZING INTELLIGENCE...</Text>
                            </Animated.View>
                            <View style={s.indicatorTrack}>
                                <Animated.View style={s.indicatorFill} />
                            </View>
                            <Text style={s.version}>v2.0.1 • 2025 Edition</Text>
                        </View>
                    </Animated.View>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#030810' },
    bg: { width: width, height: height, justifyContent: 'flex-end' },
    gradient: { width: '100%', height: '80%', justifyContent: 'flex-end', paddingBottom: 60 },
    content: { alignItems: 'center', paddingHorizontal: 30 },

    logoBadge: {
        marginBottom: 20,
        padding: 4,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    logoIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 20
    },
    logoText: { color: '#fff', fontSize: 28, fontWeight: '900' },

    appName: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10
    },
    accentLine: {
        width: 40,
        height: 4,
        backgroundColor: '#10b981',
        borderRadius: 2,
        marginVertical: 15
    },
    tagline: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 28,
        fontWeight: '500'
    },
    highlight: { color: '#fff', fontWeight: '800' },

    footer: { marginTop: 60, width: '100%', alignItems: 'center' },
    loadingText: {
        color: '#10b981',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 12
    },
    indicatorTrack: {
        width: 140,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden'
    },
    indicatorFill: {
        width: '40%',
        height: '100%',
        backgroundColor: '#10b981',
        borderRadius: 2
    },
    version: {
        marginTop: 20,
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
        fontWeight: '600'
    }
});

export default WelcomeScreen;
