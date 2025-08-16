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
  Target, 
  BookOpen, 
  Settings,
  Home
} from 'lucide-react-native';

// Screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import PlanScreen from './src/screens/PlanScreen';
import CompareScreen from './src/screens/CompareScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import LearnScreen from './src/screens/LearnScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GoalDetailScreen from './src/screens/GoalDetailScreen';

// Context
import { AppProvider } from './src/context/AppContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Goals flow
function GoalsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="GoalsList" 
        component={GoalsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GoalDetail" 
        component={GoalDetailScreen}
        options={{ 
          title: 'Goal Details',
          headerStyle: { backgroundColor: '#3B82F6' },
          headerTintColor: '#fff'
        }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === 'Plan') {
            IconComponent = PiggyBank;
          } else if (route.name === 'Compare') {
            IconComponent = BarChart3;
          } else if (route.name === 'Goals') {
            IconComponent = Target;
          } else if (route.name === 'Learn') {
            IconComponent = BookOpen;
          } else if (route.name === 'Settings') {
            IconComponent = Settings;
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
        options={{ title: 'My Plan' }}
      />
      <Tab.Screen 
        name="Compare" 
        component={CompareScreen}
        options={{ title: 'Compare Options' }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalsStack}
        options={{ 
          title: 'Savings Goals',
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Learn" 
        component={LearnScreen}
        options={{ title: 'Learn & Tips' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
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
