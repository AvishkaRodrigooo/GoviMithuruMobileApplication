import * as React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';

// Auth Screens
import SignInScreen from './src/screens/signinScreen';
import SignUpScreen from './src/screens/signupScreen';

// Main Screens
import HomeScreen from './src/screens/homeScreen';
import ProfileScreen from './src/screens/profileScreen';

// Dealer Screens
import DealerDashboard from './src/screens/DealerDashboard/DealerDashboard';
import UpdatePriceScreen from './src/screens/DealerDashboard/UpdatePriceScreen';

// Admin Screens
import adminDashboardScreen from './src/screens/adminDashboard/adminDashboardScreen';
import HerbicideRecommendationAdminScreen from './src/screens/adminDashboard/HerbicideRecommendationAdminScreen';
import MarketPriceManagement from './src/screens/adminDashboard/MarketPriceManagement';

// Weeds Detection
import StageIdentificationScreen from './src/screens/weedsDetection/StageIdentificationScreen';
import weesDashboardScreen from './src/screens/weedsDetection/weedsdashboard';
import WeedIdentifyScreen from './src/screens/weedsDetection/weedIdentifyScreen';
import WeedsClassficationScreen from './src/screens/weedsDetection/weedsClassificationScreen';
import HerbicideRecommendation from './src/screens/weedsDetection/herbicidesRecomendationScreen';
import prePlantHerbicidesScreen from './src/screens/weedsDetection/herbicides/prePlantHerbicidesScreen';
import oneShotHerbicidesScreen from './src/screens/weedsDetection/herbicides/oneshotHerbicidesScreen';
import grassKillersScreen from './src/screens/weedsDetection/herbicides/grassKillersScreen';
import broadLeavesKillersScreen from './src/screens/weedsDetection/herbicides/broadleavesKillersScreen';

// Crop Establishment
import InputPlannerScreen from './src/screens/cropEstablishment/InputPlannerScreen ';
import CropRecommenderScreen from './src/screens/cropEstablishment/CropRecommenderScreen ';

// Post Harvest Features
import StorageDashboardScreen from './src/screens/PostHarvest/StorageDashboardScreen';
import RegisterHarvestScreen from './src/screens/PostHarvest/RegisterHarvestScreen';
import SensorConnectionScreen from './src/screens/PostHarvest/SensorConnectionScreen';
import MarketTrackingScreen from './src/screens/PostHarvest/MarketTrackingScreen';
import InventoryListScreen from './src/screens/PostHarvest/InventoryListScreen';
import StockDetailScreen from './src/screens/PostHarvest/StockDetailScreen';

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
import { auth, db } from "./src/firebase/firebaseConfig";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App: Setting up auth listener...');

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? 'User logged in' : 'No user');
      console.log('Current User:', currentUser?.email);

      if (currentUser) {
        try {
          // Fetch user role from Firestore
          const userDoc = await db.collection('users').doc(currentUser.uid).get();
          const role = userDoc.exists ? userDoc.data()?.role : null;
          console.log('User role:', role);
          setUserRole(role);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }

      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  console.log('App render - User:', user?.email, 'Role:', userRole, 'Loading:', loading);

  if (loading) {
    console.log('Showing loading indicator...');
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={{ marginTop: 10, color: '#16a34a', fontSize: 16 }}>Loading GoviMithuru...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#16a34a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitleAlign: 'center',
        }}
      >
        {user ? (
          // ================= AUTHENTICATED USERS =================
          <>
            {/* ========== ROLE-BASED INITIAL SCREENS ========== */}
            {userRole === 'admin' && (
              <Stack.Screen
                name="AdminDashboard"
                component={adminDashboardScreen}
                options={{ title: "Admin Dashboard" }}
              />
            )}
            
            {userRole === 'dealer' && (
              <Stack.Screen
                name="DealerDashboard"
                component={DealerDashboard}
                options={{ title: "Dealer Dashboard" }}
              />
            )}

            {/* ========== COMMON SCREENS ========== */}
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'GoviMithuru' }} 
            />
            
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ title: 'My Profile' }} 
            />

            {/* ========== DEALER SCREENS ========== */}
            {userRole !== 'dealer' && (
              <Stack.Screen
                name="DealerDashboard"
                component={DealerDashboard}
                options={{ title: "Dealer Dashboard" }}
              />
            )}
            
            <Stack.Screen
              name="UpdatePrice"
              component={UpdatePriceScreen}
              options={{ title: 'Update Price' }}
            />

            {/* ========== ADMIN SCREENS ========== */}
            {userRole !== 'admin' && (
              <Stack.Screen
                name="AdminDashboard"
                component={adminDashboardScreen}
                options={{ title: "Admin Dashboard" }}
              />
            )}
            
            <Stack.Screen
              name="HerbicideRecommendation"
              component={HerbicideRecommendationAdminScreen}
              options={{ title: 'Herbicide Recommendation' }}
            />
            
            <Stack.Screen
              name="MarketPriceManagement"
              component={MarketPriceManagement}
              options={{ title: 'Market Price Reports' }}
            />

            {/* ========== POST HARVEST SCREENS ========== */}
            <Stack.Screen 
              name="Stage" 
              component={StorageDashboardScreen} 
              options={{ title: 'Storage Analysis' }} 
            />
            
            <Stack.Screen 
              name="RegisterHarvest" 
              component={RegisterHarvestScreen} 
              options={{ title: 'Register Harvest' }} 
            />
            
            <Stack.Screen 
              name="ConnectSensors" 
              component={SensorConnectionScreen} 
              options={{ title: 'Connect Sensors' }} 
            />
            
            <Stack.Screen 
              name="MarketTracking" 
              component={MarketTrackingScreen} 
              options={{ title: 'Market Tracking' }} 
            />
            
            <Stack.Screen 
              name="InventoryList" 
              component={InventoryListScreen} 
              options={{ title: 'Stock Inventory' }} 
            />
            
            <Stack.Screen
              name="StockDetail"
              component={StockDetailScreen}
              options={{ title: 'Stock Details' }}
            />

            {/* ========== WEEDS DETECTION SCREENS ========== */}
            <Stack.Screen 
              name="Stages" 
              component={StageIdentificationScreen} 
              options={{ title: 'Stage Identification' }} 
            />
            
            <Stack.Screen 
              name="detector" 
              component={WeedIdentifyScreen} 
              options={{ title: 'Weeds Detection' }} 
            />
            
            <Stack.Screen 
              name="dete" 
              component={WeedsClassficationScreen} 
              options={{ title: 'Weeds Classification' }} 
            />
            
            <Stack.Screen 
              name="weedsDashboard" 
              component={weesDashboardScreen} 
              options={{ title: 'Weeds Dashboard' }} 
            />
            
            <Stack.Screen 
              name="herbicides" 
              component={HerbicideRecommendation} 
              options={{ title: 'Herbicide Recommendation' }} 
            />
            
            <Stack.Screen 
              name="PrePlantHerbicides" 
              component={prePlantHerbicidesScreen} 
              options={{ title: 'Pre-Plant Herbicides' }} 
            />
            
            <Stack.Screen 
              name="OneShotHerbicides" 
              component={oneShotHerbicidesScreen} 
              options={{ title: 'One-Shot Herbicides' }} 
            />
            
            <Stack.Screen 
              name="grassKillersHerbicides" 
              component={grassKillersScreen} 
              options={{ title: 'Grass Killers' }} 
            />
            
            <Stack.Screen 
              name="BroadLeavesHerbicides" 
              component={broadLeavesKillersScreen} 
              options={{ title: 'Sedges & Broad Leaves Killers' }} 
            />

            {/* ========== FORECAST SCREENS ========== */}
            <Stack.Screen 
              name="Pest" 
              component={PricingForecastScreen} 
              options={{ title: 'Pest Forecast' }} 
            />
            
            <Stack.Screen 
              name="Pricing" 
              component={PricingForecastScreen} 
              options={{ title: 'Price Forecast' }} 
            />

            {/* ========== CROP ESTABLISHMENT SCREENS ========== */}
            <Stack.Screen 
              name="InputPlanner" 
              component={InputPlannerScreen} 
              options={{ title: 'Input Planner' }} 
            />
            
            <Stack.Screen 
              name="CropRecommender" 
              component={CropRecommenderScreen} 
              options={{ title: 'Crop Recommender' }} 
            />
          </>
        ) : (
          // ================= UNAUTHENTICATED USERS =================
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