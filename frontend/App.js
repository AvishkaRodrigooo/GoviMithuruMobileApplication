import * as React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import SignInScreen from './src/screens/signinScreen';
import SignUpScreen from './src/screens/signupScreen';
import HomeScreen from './src/screens/homeScreen';
import WeedDetectionScreen from './src/screens/WeedDetectionScreen';
import StageIdentificationScreen from './src/screens/weedsDetection/StageIdentificationScreen';
import weesDashboardScreen from './src/screens/weedsDetection/weedsdashboard';
import WeedIdentifyScreen from './src/screens/weedsDetection/weedIdentifyScreen';

// Post Harvest Features
import StorageDashboardScreen from './src/screens/PostHarvest/StorageDashboardScreen'; 
import RegisterHarvestScreen from './src/screens/PostHarvest/RegisterHarvestScreen'; 
import SensorConnectionScreen from './src/screens/PostHarvest/SensorConnectionScreen';
import MarketTrackingScreen from './src/screens/PostHarvest/MarketTrackingScreen';
// Pricing Placeholder
function PricingForecastScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Market Price Forecast</Text>
      <Text style={{ color: '#666', marginTop: 10 }}>Research Data Coming Soon!</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignIn"
        screenOptions={{
          headerStyle: { backgroundColor: '#16a34a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create Account' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'GoviMithuru' }} />

        {/* Post Harvest Analysis Flow */}
        <Stack.Screen name="Stage" component={StorageDashboardScreen} options={{ title: 'Storage Analysis' }} />
        <Stack.Screen name="RegisterHarvest" component={RegisterHarvestScreen} options={{ title: 'Register Harvest' }} />
        <Stack.Screen name="ConnectSensors" component={SensorConnectionScreen} options={{ title: 'Connect Sensors' }} />
        <Stack.Screen name="MarketTracking" component={MarketTrackingScreen} options={{ title: 'Market Tracking' }} />

        {/* Other AI Tools */}
        <Stack.Screen name="Weed" component={WeedDetectionScreen} options={{ title: 'Pest Detection' }} />
        <Stack.Screen name="WeedStage" component={StageIdentificationScreen} options={{ title: 'Growth Stage' }} />
        <Stack.Screen name="detector" component={WeedIdentifyScreen} options={{ title: 'Identify Weeds' }} />
        <Stack.Screen name="weedsDashboard" component={weesDashboardScreen} options={{ title: 'Weeds Dashboard' }} />
        <Stack.Screen name="Pricing" component={PricingForecastScreen} options={{ title: 'Price Forecast' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}