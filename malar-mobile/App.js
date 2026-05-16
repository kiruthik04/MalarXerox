import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';
import { LayoutDashboard, FileText, Wallet, Users, MoreHorizontal } from 'lucide-react-native';

// Context
import { AuthContext } from './src/context/AuthContext';

// Auth / Main Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

// Tab Screens
import ExpensesScreen from './src/screens/ExpensesScreen';
import DebtsScreen from './src/screens/DebtsScreen';

// More Stack Screens
import MoreScreen from './src/screens/MoreScreen';
import NewBillScreen from './src/screens/NewBillScreen';
import QuickCashScreen from './src/screens/QuickCashScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import BillHistoryScreen from './src/screens/BillHistoryScreen';
import DailyAccountingScreen from './src/screens/DailyAccountingScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import SuppliersScreen from './src/screens/SuppliersScreen';
import EmployeesScreen from './src/screens/EmployeesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

const headerOpts = {
  headerStyle: { backgroundColor: '#fff' },
  headerTintColor: '#1e293b',
  headerTitleStyle: { fontWeight: 'bold' },
};

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={headerOpts}>
      <MoreStack.Screen name="Menu" component={MoreScreen} />
      <MoreStack.Screen name="New Bill" component={NewBillScreen} />
      <MoreStack.Screen name="Quick Cash" component={QuickCashScreen} />
      <MoreStack.Screen name="Reminders" component={RemindersScreen} />
      <MoreStack.Screen name="Bill History" component={BillHistoryScreen} />
      <MoreStack.Screen name="Daily Accounting" component={DailyAccountingScreen} />
      <MoreStack.Screen name="Inventory" component={InventoryScreen} />
      <MoreStack.Screen name="Suppliers" component={SuppliersScreen} />
      <MoreStack.Screen name="Employees" component={EmployeesScreen} />
    </MoreStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...headerOpts,
        tabBarActiveTintColor: '#155496',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { borderTopColor: '#e2e8f0', paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
      }}
    >
      <Tab.Screen name="Overview" component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} /> }} />
      <Tab.Screen name="Expenses" component={ExpensesScreen}
        options={{ tabBarIcon: ({ color }) => <Wallet size={22} color={color} /> }} />
      <Tab.Screen name="Debts" component={DebtsScreen}
        options={{ tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tab.Screen name="More" component={MoreStackNavigator}
        options={{ headerShown: false, tabBarIcon: ({ color }) => <MoreHorizontal size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [auth, setAuth] = useState({ token: null, username: null, role: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedAuth = await SecureStore.getItemAsync('malar_auth');
        if (savedAuth) setAuth(JSON.parse(savedAuth));
      } catch (e) {
        console.error('Failed to load auth', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#155496" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {auth.token ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
