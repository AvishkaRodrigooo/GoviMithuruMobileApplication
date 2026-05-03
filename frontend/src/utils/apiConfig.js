import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * API CONFIGURATION
 * 
 * This utility automatically detects the local IP address of your machine
 * when running in development mode (Expo). This means you don't have to
 * manually change the IP every time you switch networks.
 */

// 1. Manually specify your IP here as a fallback or for production
const MANUAL_BACKEND_IP = '192.168.100.200';
const BACKEND_PORT = '5000';

const getBaseUrl = () => {
    // In development, hostUri typically contains the IP:Port of the dev server
    const hostUri = Constants.expoConfig?.hostUri ||
        Constants.manifest?.debuggerHost ||
        Constants.manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
        // Extract only the IP part (before the colon)
        const ip = hostUri.split(':').shift();
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
            const detectedUrl = `http://${ip}:${BACKEND_PORT}`;
            console.log(`[API Config] ✅ Auto-detected Backend: ${detectedUrl}`);
            return detectedUrl;
        }
    }

    // Fallback to manual IP (works for both physical devices and emulators on the same network)
    const fallbackUrl = `http://${MANUAL_BACKEND_IP}:${BACKEND_PORT}`;
    console.log(`[API Config] ⚠️ Auto-detection failed. Using manual fallback: ${fallbackUrl}`);
    return fallbackUrl;
};

export const BASE_URL = getBaseUrl();

// Useful for debugging
export const API_ENDPOINTS = {
    PREDICT_STORAGE: `${BASE_URL}/api/guardian/weather/predict-storage`,
    WEATHER: `${BASE_URL}/api/guardian/weather`,
    ADVISE: `${BASE_URL}/api/guardian/advice`,
    POST_HARVEST_PREDICT: `${BASE_URL}/api/guardian/predict`,
    CHAT: `${BASE_URL}/api/guardian/chat`,
    ASSESS_KNOWLEDGE: `${BASE_URL}/api/guardian/assess-knowledge`,
};

export default BASE_URL;
