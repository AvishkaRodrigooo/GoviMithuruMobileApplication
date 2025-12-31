import * as React from 'react';
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

import InputPlanner from './src/screens/crop_esstablishment_planner/inputPlanner';

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
        }}
      >
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

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Dashboard' }}
        />

        <Stack.Screen
          name="Weed"
          component={WeedDetectionScreen}
          options={{ title: 'Weed Detection' }}
        />

        <Stack.Screen
          name="Stage"
          component={StageIdentificationScreen}
          options={{ title: 'Stage Identification' }}
        />

        <Stack.Screen
          name="detector"
          component={WeedIdentifyScreen}
          options={{ title: 'Weeds detection' }}
        />

         <Stack.Screen
          name="weedsDashboard"
          component={weesDashboardScreen}
          options={{ title: 'Weeds Dashboard' }}
        />

        <Stack.Screen
          name="inputPlanner"
          component={InputPlanner}
          options={{ title: 'input Planner' }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
