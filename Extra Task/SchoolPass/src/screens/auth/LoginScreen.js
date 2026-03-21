import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../services/AuthContext';
import { InputField, PrimaryButton } from '../../components';
import { Colors, Spacing, Radius, Shadow } from '../../theme';
import CustomModal from '../../components/CustomModal';
import useModal from '../../hooks/useModal';

const DEMO_ACCOUNTS = [
  { role: 'student', email: 'student@schoolpass.demo', password: 'demo1234', name: 'Rahul Sharma' },
  { role: 'parent', email: 'parent@schoolpass.demo', password: 'demo1234', name: 'Mr. Suresh Sharma' },
  { role: 'mentor', email: 'mentor@schoolpass.demo', password: 'demo1234', name: 'Dr. Priya Nair' },
  { role: 'watchman', email: 'gate@schoolpass.demo', password: 'demo1234', name: 'Security Officer' },
  { role: 'admin', email: 'admin@iiser.demo', password: 'demo1234', name: 'Dean of Students' },
];

const ROLE_INFO = {
  student: { icon: 'ST', label: 'Student', color: Colors.student, note: 'Create and track outing requests' },
  parent: { icon: 'PA', label: 'Parent', color: Colors.parent, note: 'Review and approve requests' },
  mentor: { icon: 'FM', label: 'Faculty Mentor', color: Colors.mentor, note: 'Acknowledge requests and issue OTPs' },
  watchman: { icon: 'SO', label: 'Security Officer', color: Colors.gate, note: 'Verify OTPs and manage departures' },
  admin: { icon: 'AD', label: 'Admin', color: Colors.admin, note: 'Monitor live activity and campus status' },
};

export default function LoginScreen() {
  const { login } = useAuth();
  const { modal, showAlert } = useModal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      await showAlert({
        type: 'warning',
        title: 'Missing credentials',
        message: 'Please enter your email and password.',
      });
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.message;
      await showAlert({
        type: 'danger',
        title: 'Login failed',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.heroGlowTop} />
      <View style={styles.heroGlowBottom} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <View style={styles.brandPill}>
              <Text style={styles.brandPillText}>IISER Tirupati</Text>
            </View>
            <View style={styles.logoBox}>
              <Image
                source={require('../../../assets/iiser-logo.png')}
                style={{ width: 188, height: 92, resizeMode: 'contain' }}
              />
            </View>
            <Text style={styles.appName}>IISER Outing System</Text>
            <Text style={styles.tagline}>Student Outing Approval and Monitoring System</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formEyebrow}>Secure Access</Text>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSub}>Enter your account credentials or select a role below to prefill the demo access details.</Text>
            <InputField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="your@email.com"
            />
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter your password"
            />
            <PrimaryButton
              label="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: 6 }}
            />
          </View>

          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Select Your Role</Text>
            <Text style={styles.demoSub}>Tap a role card to fill the matching demo credentials instantly.</Text>
            <View style={styles.demoGrid}>
              {DEMO_ACCOUNTS.map(acc => {
                const info = ROLE_INFO[acc.role];
                return (
                  <TouchableOpacity
                    key={acc.role}
                    style={[styles.demoCard, { borderColor: info.color }]}
                    onPress={() => fillDemo(acc)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.demoBadge, { backgroundColor: `${info.color}16` }]}>
                      <Text style={[styles.demoIcon, { color: info.color }]}>{info.icon}</Text>
                    </View>
                    <Text style={[styles.demoRole, { color: info.color }]}>{info.label}</Text>
                    <Text style={styles.demoName}>{acc.name}</Text>
                    <Text style={styles.demoMeta}>{info.note}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomModal {...modal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  heroGlowTop: {
    position: 'absolute',
    top: -40,
    right: -10,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primaryLight,
    opacity: 0.95,
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.accentLight,
    opacity: 0.9,
  },
  scroll: { padding: Spacing.xl, paddingBottom: 44 },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  brandPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
    marginBottom: 14,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  logoBox: {
    width: 228,
    height: 112,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  appName: { fontSize: 30, fontWeight: '800', color: Colors.ink, letterSpacing: -0.7, textAlign: 'center' },
  tagline: { fontSize: 13, color: Colors.ink2, marginTop: 8, lineHeight: 22, textAlign: 'center', maxWidth: 290 },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  formEyebrow: {
    fontSize: 11,
    color: Colors.ink3,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  formTitle: { fontSize: 24, fontWeight: '700', color: Colors.ink, marginBottom: 4 },
  formSub: { fontSize: 13, color: Colors.ink2, lineHeight: 21, marginBottom: Spacing.lg },
  demoSection: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  demoTitle: { fontSize: 12, color: Colors.ink3, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, textAlign: 'center' },
  demoSub: { fontSize: 13, color: Colors.ink2, textAlign: 'center', lineHeight: 21, marginBottom: 14 },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  demoCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  demoBadge: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  demoIcon: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  demoRole: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  demoName: { fontSize: 11, color: Colors.ink, marginTop: 4, fontWeight: '600', textAlign: 'center' },
  demoMeta: { fontSize: 10, color: Colors.ink3, marginTop: 6, textAlign: 'center', lineHeight: 16 },
});
