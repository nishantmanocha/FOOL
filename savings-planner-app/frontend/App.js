import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Icons
import { 
  PiggyBank, 
  BarChart3, 
  BookOpen, 
  Home
} from 'lucide-react-native';

// Screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import PlanScreen from './src/screens/PlanScreen';
import CompareScreen from './src/screens/CompareScreen';
import LearnScreen from './src/screens/LearnScreen';

// Context
import { AppProvider } from './src/context/AppContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Removed Goals stack navigator

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === 'Plan') {
            IconComponent = Home;
          } else if (route.name === 'Compare') {
            IconComponent = BarChart3;
          } else if (route.name === 'Learn') {
            IconComponent = BookOpen;
          }

          return <IconComponent size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Plan" 
        component={PlanScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Compare" 
        component={CompareScreen}
        options={{ title: 'Compare Options' }}
      />
      <Tab.Screen 
        name="Learn" 
        component={LearnScreen}
        options={{ title: 'Learn & Tips' }}
      />
    </Tab.Navigator>
  );
}

// Main App Stack
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#3B82F6" />
          <AppStack />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
