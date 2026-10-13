import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TrackerProvider } from './src/context/TrackerContext';
import { Colors } from './src/theme/colors';
import { GlassTabBar } from './src/components/GlassTabBar';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const DarkNavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.backgroundSecondary,
    text: Colors.textPrimary,
    border: Colors.glassBorder,
    primary: Colors.accentPrimary,
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <TrackerProvider>
          <NavigationContainer theme={DarkNavTheme}>
            <StatusBar style="light" />
            <Tab.Navigator
              tabBar={(props) => <GlassTabBar {...props} />}
              screenOptions={{
                headerShown: false,
                tabBarStyle: {
                  position: 'absolute',
                  backgroundColor: 'transparent',
                  borderTopWidth: 0,
                },
              }}
            >
              <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ tabBarLabel: 'Dashboard' }}
              />
              <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{ tabBarLabel: 'History' }}
              />
              <Tab.Screen
                name="Analytics"
                component={AnalyticsScreen}
                options={{ tabBarLabel: 'Analytics' }}
              />
              <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarLabel: 'Settings' }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </TrackerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
