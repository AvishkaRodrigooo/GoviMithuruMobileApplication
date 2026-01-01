import * as React from 'react';
import { View,ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';

// Screens
import SignInScreen from './src/screens/signinScreen';
import SignUpScreen from './src/screens/signupScreen';
import HomeScreen from './src/screens/homeScreen';
import ProfileScreen from './src/screens/profileScreen';

import adminDashboardScreen from './src/screens/adminDashboard/adminDashboardScreen';
import HerbicideRecommendationAdminScreen from './src/screens/adminDashboard/HerbicideRecommendationAdminScreen';

import StageIdentificationScreen from './src/screens/weedsDetection/StageIdentificationScreen';
import weesDashboardScreen from './src/screens/weedsDetection/weedsdashboard';
import WeedIdentifyScreen from './src/screens/weedsDetection/weedIdentifyScreen';
import WeedsClassficationScreen from './src/screens/weedsDetection/weedsClassificationScreen';
import HerbicideRecommendation from './src/screens/weedsDetection/herbicidesRecomendationScreen';

import InputPlannerScreen  from './src/screens/cropEstablishment/InputPlannerScreen ';

// Post Harvest Features
import StorageDashboardScreen from './src/screens/PostHarvest/StorageDashboardScreen'; 
import RegisterHarvestScreen from './src/screens/PostHarvest/RegisterHarvestScreen'; 
import SensorConnectionScreen from './src/screens/PostHarvest/SensorConnectionScreen';
import MarketTrackingScreen from './src/screens/PostHarvest/MarketTrackingScreen';
import InventoryListScreen from './src/screens/PostHarvest/InventoryListScreen';
// Pricing Placeholder
function PricingForecastScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Market Price Forecast</Text>
      <Text style={{ color: '#666', marginTop: 10 }}>Research Data Coming Soon!</Text>
    </View>
  );
}

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/firebase/firebaseConfig";
import { StackScreen } from 'react-native-screens';

import InputPlanner from './src/screens/crop_esstablishment_planner/inputPlanner';

const Stack = createNativeStackNavigator();

export default function App() {
 const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App: Setting up auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser ? 'User logged in' : 'No user');
      console.log('Current User:', currentUser?.email);
      
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  console.log('App render - User:', user?.email, 'Loading:', loading);

  if (loading) {
    console.log('Showing loading indicator...');
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={{ marginTop: 10, color: '#16a34a' }}>Loading GoviMithuru...</Text>
      </View>
    );
  }



  return (
    <NavigationContainer>
      <Stack.Navigator
        //initialRouteName="SignIn"
        screenOptions={{
          headerStyle: { backgroundColor: '#16a34a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitleAlign: 'center',
        }}
      >
        {user ? (
          // User is signed in - show main app screens
          <>

        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'GoviMithuru' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
         <Stack.Screen name="AdminDashboard" component={adminDashboardScreen} options={{ title: "Admin Dashboard"}}/>
        <Stack.Screen name="HerbicideRecommendation" component={HerbicideRecommendationAdminScreen} options={{ title: 'Herbicide Recommendation' }}/>

        {/* Post Harvest Analysis Flow */}
        <Stack.Screen name="Stage" component={StorageDashboardScreen} options={{ title: 'Storage Analysis' }} />
        <Stack.Screen name="RegisterHarvest" component={RegisterHarvestScreen} options={{ title: 'Register Harvest' }} />
        <Stack.Screen name="ConnectSensors" component={SensorConnectionScreen} options={{ title: 'Connect Sensors' }} />
        <Stack.Screen name="MarketTracking" component={MarketTrackingScreen} options={{ title: 'Market Tracking' }} />
        <Stack.Screen 
  name="InventoryList" 
  component={InventoryListScreen} 
  options={{ title: 'Stock Inventory' }} 
/>

        {/* weeds detection */}
         
        <Stack.Screen name="Stages" component={StageIdentificationScreen} options={{ title: 'Stage Identification' }} />
        <Stack.Screen name="detector" component={WeedIdentifyScreen} options={{ title: 'Weeds detection' }} />
        <Stack.Screen name="dete" component={WeedsClassficationScreen} options={{ title: 'Weeds detection' }} />
        <Stack.Screen name="weedsDashboard" component={weesDashboardScreen} options={{ title: 'Weeds Dashboard' }} />
        <Stack.Screen name="herbicides" component={HerbicideRecommendation} options={{ title:'HerbicideRecommendation'}}/>

         <Stack.Screen name="Pest" component={PricingForecastScreen} options={{ title: 'Pest Forecast' }} />
        <Stack.Screen name="Pricing" component={PricingForecastScreen} options={{ title: 'Price Forecast' }} />


        {/* crop establishment planner */}

        <Stack.Screen name="InputPlanner" component={InputPlannerScreen} options={{ title: 'Input Planner' }} />
 </>


     


        ) : (
          // User is NOT signed in - show auth screens
          <>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ title: 'Create Account' }}
            />
           

           
          </>
        )}
        

      </Stack.Navigator>
    </NavigationContainer>
  );
}