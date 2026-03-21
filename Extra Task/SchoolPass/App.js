// App.js
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/services/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { registerForPushNotifications } from './src/services/notifications';
import * as Notifications from 'expo-notifications';
import { useNavigationContainerRef } from '@react-navigation/native';

// Register for push after login
function PushRegistrar() {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.uid) {
      registerForPushNotifications(user.uid).catch(console.warn);
    }
  }, [user?.uid]);
  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PushRegistrar />
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
