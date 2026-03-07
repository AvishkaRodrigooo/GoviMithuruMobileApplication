import * as React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';

// Screens
import SignInScreen from './src/screens/signinScreen';
import SignUpScreen from './src/screens/signupScreen';
import HomeScreen from './src/screens/homeScreen';
import ProfileScreen from './src/screens/profileScreen';
import WeatherForecastScreen from './src/screens/weatherForecastScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

// Admin Dashboard
import adminDashboardScreen from './src/screens/adminDashboard/adminDashboardScreen';
import HerbicideRecommendationAdminScreen from './src/screens/adminDashboard/HerbicideRecommendationAdminScreen';

//pest Management
import PestManagementScreen from './src/screens/pestForecast/PestManagementScreen';
import PestForecastDashboard from './src/screens/pestForecast/PestForecastDashboard';
import PestForecastForm from './src/screens/pestForecast/PestForecastForm';
import PestDetection from './src/screens/pestForecast/PestDetection';
import PestLibrary from './src/screens/pestForecast/PestLibrary';
import PestHeatMap from './src/screens/pestForecast/PestHeatMap';
import PestAlerts from './src/screens/pestForecast/PestAlerts';
import PestHistory from './src/screens/pestForecast/PestHistory';
// import PestForecastHistory from './src/screens/pestForecast/PestForecastHistory';
import PestDetectionHistory from './src/screens/pestForecast/PestDetectionHistory';
import NotificationSettings from './src/screens/pestForecast/NotificationSettings';


//weeds controller
import StageIdentificationScreen from './src/screens/weedsDetection/StageIdentificationScreen';
import weesDashboardScreen from './src/screens/weedsDetection/weedsdashboard';
import WeedIdentifyScreen from './src/screens/weedsDetection/weedIdentifyScreen';
import WeedsClassficationScreen from './src/screens/weedsDetection/weedsClassificationScreen';
import HerbicideRecommendation from './src/screens/weedsDetection/herbicidesRecomendationScreen';
import prePlantHerbicidesScreen from './src/screens/weedsDetection/herbicides/prePlantHerbicidesScreen';
import oneShotHerbicidesScreen from './src/screens/weedsDetection/herbicides/oneshotHerbicidesScreen';
import grassKillersScreen from './src/screens/weedsDetection/herbicides/grassKillersScreen';
import broadLeavesKillersScreen from './src/screens/weedsDetection/herbicides/broadleavesKillersScreen';
import AgroShopsScreen from './src/screens/weedsDetection/shops/AgroShopsScreen';

import InputPlannerScreen from './src/screens/cropEstablishment/InputPlannerScreen ';
import CropRecommenderScreen from './src/screens/cropEstablishment/CropRecommenderScreen ';

// Post Harvest Features
import KnowledgeSelectionScreen from './src/screens/PostHarvest/KnowledgeSelectionScreen';
import KnowledgeQuizScreen from './src/screens/PostHarvest/KnowledgeQuizScreen';
import WarehouseAnalysisScreen from './src/screens/PostHarvest/WarehouseAnalysisScreen';
import StorageDashboardScreen from './src/screens/PostHarvest/StorageDashboardScreen';
import RegisterHarvestScreen from './src/screens/PostHarvest/RegisterHarvestScreen';
import SensorConnectionScreen from './src/screens/PostHarvest/SensorConnectionScreen';
import MarketTrackingScreen from './src/screens/PostHarvest/MarketTrackingScreen';
import InventoryListScreen from './src/screens/PostHarvest/InventoryListScreen';
import PostHarvestAdvisorScreen from './src/screens/PostHarvest/PostHarvestAdvisorScreen';
import DealerDashboardScreen from './src/screens/PostHarvest/DealerDashboardScreen';
import StorageStepGuideScreen from './src/screens/PostHarvest/StorageStepGuideScreen';
import StorageExpertGuideScreen from './src/screens/PostHarvest/StorageExpertGuideScreen';

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
            <Stack.Screen name="AdminDashboard" component={adminDashboardScreen} options={{ title: "Admin Dashboard" }} />
            <Stack.Screen name="HerbicideRecommendation" component={HerbicideRecommendationAdminScreen} options={{ title: 'Herbicide Recommendation' }} />
            <Stack.Screen name="WeatherForecast" component={WeatherForecastScreen} options={{ title: 'Weather Forecast' }} />
            <Stack.Screen
              name="AgroShop"
              component={AgroShopsScreen}
              options={{ title: "Agro Shops Nearby" }}
            />

            {/* Pest Management */}
            <Stack.Screen name="PestManagement" component={PestManagementScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PestForecastDashboard" component={PestForecastDashboard} options={{ title: 'Pest Forecast' }} />
<Stack.Screen name="PestForecastForm" component={PestForecastForm} options={{ title: 'New Forecast' }} />
<Stack.Screen name="PestDetection" component={PestDetection} options={{ title: 'Pest Detection' }} />
<Stack.Screen 
  name="PestLibrary" 
  component={PestLibrary} 
  options={{ title: 'Pest Library' }} 
/>
<Stack.Screen 
  name="PestHeatMap" 
  component={PestHeatMap} 
  options={{ title: 'Heat Map' }} 
/>
<Stack.Screen 
  name="PestAlerts" 
  component={PestAlerts} 
  options={{ title: 'Alerts' }} 
/>
<Stack.Screen 
  name="PestHistory" 
  component={PestHistory} 
  options={{ title: 'History' }} 
/>

<Stack.Screen 
  name="PestDetectionHistory" 
  component={PestDetectionHistory} 
  options={{ title: 'Detection History' }} 
/>
<Stack.Screen 
  name="NotificationSettings" 
  component={NotificationSettings} 
  options={{ title: 'Notifications' }} 
/>
            {/* Post Harvest Analysis Flow */}
            <Stack.Screen name="PostHarvestOnboarding" component={KnowledgeSelectionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="KnowledgeQuiz" component={KnowledgeQuizScreen} options={{ headerShown: false }} />
            <Stack.Screen name="WarehouseAnalysis" component={WarehouseAnalysisScreen} options={{ headerShown: false }} />

            <Stack.Screen name="Stage" component={StorageDashboardScreen} options={{ title: 'Storage Analysis' }} />
            <Stack.Screen name="RegisterHarvest" component={RegisterHarvestScreen} options={{ title: 'Register Harvest' }} />
            <Stack.Screen name="ConnectSensors" component={SensorConnectionScreen} options={{ title: 'Connect Sensors' }} />
            <Stack.Screen name="MarketTracking" component={MarketTrackingScreen} options={{ title: 'Market Tracking' }} />
            <Stack.Screen name="InventoryList" component={InventoryListScreen} options={{ title: 'Stock Inventory' }} />
            <Stack.Screen name="PostHarvestAdvisor" component={PostHarvestAdvisorScreen}
              options={{ headerShown: false }} />
            <Stack.Screen name="DealerDashboard" component={DealerDashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="StorageStepGuide" component={StorageStepGuideScreen} options={{ headerShown: false }} />
            <Stack.Screen name="StorageExpertGuide" component={StorageExpertGuideScreen} options={{ headerShown: false }} />

            {/* weeds detection */}
            <Stack.Screen name="Stages" component={StageIdentificationScreen} options={{ title: 'Stage Identification' }} />
            <Stack.Screen name="detector" component={WeedIdentifyScreen} options={{ title: 'Weeds detection' }} />
            <Stack.Screen name="dete" component={WeedsClassficationScreen} options={{ title: 'Weeds detection' }} />
            <Stack.Screen name="weedsDashboard" component={weesDashboardScreen} options={{ title: 'Weeds Dashboard' }} />
            <Stack.Screen name="herbicides" component={HerbicideRecommendation} options={{ title: 'HerbicideRecommendation' }} />
            <Stack.Screen name="PrePlantHerbicides" component={prePlantHerbicidesScreen} options={{ title: 'Pre plant Herbicides' }} />
            <Stack.Screen name="OneShotHerbicides" component={oneShotHerbicidesScreen} options={{ title: 'OneShot Herbicides' }} />
            <Stack.Screen name="grassKillersHerbicides" component={grassKillersScreen} options={{ title: 'Grass Killers Herbicides' }} />
            <Stack.Screen name="BroadLeavesHerbicides" component={broadLeavesKillersScreen} options={{ title: 'Sedges & Broad Leaves Killers' }} />


            <Stack.Screen name="Pest" component={PricingForecastScreen} options={{ title: 'Pest Forecast' }} />
            <Stack.Screen name="Pricing" component={PricingForecastScreen} options={{ title: 'Price Forecast' }} />


            {/* crop establishment planner */}

            <Stack.Screen name="InputPlanner" component={InputPlannerScreen} options={{ title: 'Input Planner' }} />
            <Stack.Screen name="CropRecommender" component={CropRecommenderScreen} options={{ title: 'Crop Recommender' }} />
          </>





        ) : (
          // User is NOT signed in - show auth screens
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
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