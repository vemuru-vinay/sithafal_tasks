import React from 'react';
import { TouchableOpacity, Text, Image, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../services/AuthContext';
import { Colors } from '../theme';
import { LoadingScreen } from '../components';
import CustomModal from '../components/CustomModal';
import useModal from '../hooks/useModal';

import LoginScreen from '../screens/auth/LoginScreen';
import StudentDashboard from '../screens/student/StudentDashboard';
import StudentRequestScreen from '../screens/student/StudentRequestScreen';
import StudentOTPScreen from '../screens/student/StudentOTPScreen';
import ParentInbox from '../screens/parent/ParentInbox';
import ParentRequestDetail from '../screens/parent/ParentRequestDetail';
import MentorInbox from '../screens/mentor/MentorInbox';
import MentorRequestDetail from '../screens/mentor/MentorRequestDetail';
import GateManualSearch from '../screens/gate/GateManualSearch';
import GateScanner from '../screens/gate/GateScanner';
import GateVerifyScreen from '../screens/gate/GateVerifyScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminRequestDetail from '../screens/admin/AdminRequestDetail';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, profile, loading, logout } = useAuth();
  const { modal, showConfirm } = useModal();

  if (loading) return <LoadingScreen />;

  const onLogoutPress = async () => {
    const confirmed = await showConfirm({
      type: 'logout',
      title: 'Logout from IISER Outing System?',
      message: 'You can sign back in anytime with your account.',
      confirmText: 'Logout',
      cancelText: 'Stay',
    });

    if (confirmed) {
      await logout();
    }
  };

  const LogoutBtn = () => (
    <TouchableOpacity onPress={onLogoutPress}>
      <Text style={{ color: Colors.danger, fontWeight: '600', fontSize: 14, marginRight: 4 }}>
        Logout
      </Text>
    </TouchableOpacity>
  );

  const headerOptions = (color, bgColor, showLogo = false) => ({
    headerStyle: { backgroundColor: bgColor || '#FFFFFF' },
    headerTintColor: color,
    headerTitleStyle: { fontWeight: '700', fontSize: 16 },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    headerBackVisible: true,
    headerRight: () => <LogoutBtn />,
    ...(showLogo ? {
      headerLeft: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 }}>
          <Image
            source={require('../../assets/iiser-logo.png')}
            style={{ width: 76, height: 28, resizeMode: 'contain' }}
          />
        </View>
      ),
    } : {}),
  });

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ animation: 'slide_from_right' }}>
          {!user ? (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          ) : profile?.role === 'student' ? (
            <>
              <Stack.Screen
                name="StudentDashboard"
                component={StudentDashboard}
                options={{ title: 'IISER Outing System', ...headerOptions(Colors.student, Colors.studentBg, true), headerBackVisible: false }}
              />
              <Stack.Screen
                name="StudentRequest"
                component={StudentRequestScreen}
                options={{ title: 'New Outing Request', ...headerOptions(Colors.student, Colors.studentBg) }}
              />
              <Stack.Screen
                name="StudentOTP"
                component={StudentOTPScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : profile?.role === 'parent' ? (
            <>
              <Stack.Screen
                name="ParentInbox"
                component={ParentInbox}
                options={{ title: 'IISER Outing System', ...headerOptions(Colors.parent, Colors.parentBg, true), headerBackVisible: false }}
              />
              <Stack.Screen
                name="ParentRequestDetail"
                component={ParentRequestDetail}
                options={{ title: 'Outing Request', ...headerOptions(Colors.parent, Colors.parentBg) }}
              />
            </>
          ) : profile?.role === 'mentor' ? (
            <>
              <Stack.Screen
                name="MentorInbox"
                component={MentorInbox}
                options={{ title: 'IISER Outing System', ...headerOptions(Colors.mentor, Colors.mentorBg, true), headerBackVisible: false }}
              />
              <Stack.Screen
                name="MentorRequestDetail"
                component={MentorRequestDetail}
                options={{ title: 'Outing Request', ...headerOptions(Colors.mentor, Colors.mentorBg) }}
              />
            </>
          ) : profile?.role === 'watchman' ? (
            <>
              <Stack.Screen
                name="GateScanner"
                component={GateScanner}
                options={{ title: 'Security Gate', ...headerOptions(Colors.gate, Colors.gateBg, true), headerBackVisible: false }}
              />
              <Stack.Screen
                name="GateManualSearch"
                component={GateManualSearch}
                options={{ title: 'Student Search', ...headerOptions(Colors.gate, Colors.gateBg) }}
              />
              <Stack.Screen
                name="GateVerify"
                component={GateVerifyScreen}
                options={{ title: 'Security Verification', ...headerOptions(Colors.gate, Colors.gateBg) }}
              />
            </>
          ) : profile?.role === 'admin' ? (
            <>
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboard}
                options={{
                  title: 'Admin - IISER Outing System',
                  ...headerOptions(Colors.admin, Colors.adminBg, true),
                  headerBackVisible: false,
                }}
              />
              <Stack.Screen
                name="AdminRequestDetail"
                component={AdminRequestDetail}
                options={{
                  title: 'Request Details',
                  ...headerOptions(Colors.admin, Colors.adminBg),
                }}
              />
            </>
          ) : (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <CustomModal {...modal} />
    </>
  );
}
