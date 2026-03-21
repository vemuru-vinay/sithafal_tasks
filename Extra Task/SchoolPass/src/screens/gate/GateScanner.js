import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../services/AuthContext';
import { Colors, Spacing, Radius, Shadow } from '../../theme';
import CustomModal from '../../components/CustomModal';
import useModal from '../../hooks/useModal';

export default function GateScanner({ navigation }) {
  const { profile, logout } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const { modal, showAlert, showConfirm } = useModal();

  const handleChange = (text, index) => {
    const value = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      await showAlert({
        type: 'warning',
        title: 'Incomplete OTP',
        message: 'Please enter the complete 6-digit OTP before continuing.',
      });
      return;
    }

    navigation.navigate('GateVerify', { qrToken: fullOtp });
    setOtp(['', '', '', '', '', '']);
  };

  const handleClear = () => {
    setOtp(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      type: 'logout',
      title: 'Logout from the gate console?',
      message: 'You can sign back in any time with your security account.',
      confirmText: 'Logout',
      cancelText: 'Stay',
    });

    if (confirmed) {
      await logout();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../../assets/iiser-logo.png')}
              style={styles.logo}
            />
            <View>
              <Text style={styles.headerTitle}>Security Gate</Text>
              <Text style={styles.headerSub}>IISER Tirupati · {profile?.gateId || 'Main Gate'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.officerCard}>
          <View style={styles.officerAvatar}>
            <Text style={styles.officerInitials}>
              {profile?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'SO'}
            </Text>
          </View>
          <View>
            <Text style={styles.officerName}>{profile?.name || 'Security Officer'}</Text>
            <Text style={styles.officerRole}>Security Officer on Duty</Text>
          </View>
        </View>

        <View style={styles.otpSection}>
          <Text style={styles.otpSectionTitle}>Enter Student OTP</Text>
          <Text style={styles.otpSectionSub}>
            Ask the student for their 6-digit One-Time Password from the IISER Outing app
          </Text>

          <View style={styles.otpInputRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => { inputs.current[i] = ref; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={text => handleChange(text, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyBtn, otp.join('').length < 6 && styles.verifyBtnDisabled]}
            onPress={handleVerify}
            activeOpacity={0.85}
          >
            <Text style={styles.verifyBtnText}>Verify OTP and Check Status</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.manualCard}
          onPress={() => navigation.navigate('GateManualSearch')}
          activeOpacity={0.8}
        >
          <View style={styles.manualIconBox}>
            <Text style={styles.manualIconText}>LIST</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.manualTitle}>Manual Student Search</Text>
            <Text style={styles.manualSub}>
              For students without smartphones or to log returns
            </Text>
          </View>
          <Text style={styles.manualArrow}>View</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoStep}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <Text style={styles.stepText}>Student submits an outing request in the app</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepText}>Parent approves via app notification</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepText}>Faculty mentor acknowledges and an OTP is generated</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={[styles.stepNum, { backgroundColor: Colors.primary }]}><Text style={[styles.stepNumText, { color: '#fff' }]}>4</Text></View>
            <Text style={[styles.stepText, { fontWeight: '600', color: Colors.primary }]}>Enter the OTP here to verify and allow departure</Text>
          </View>
        </View>
      </ScrollView>
      <CustomModal {...modal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gateBg },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, resizeMode: 'contain' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  headerSub: { fontSize: 11, color: Colors.ink3 },
  logoutBtn: { backgroundColor: Colors.dangerBg, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.danger },
  logoutText: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
  officerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.primaryMid },
  officerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  officerInitials: { color: '#fff', fontSize: 16, fontWeight: '700' },
  officerName: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  officerRole: { fontSize: 11, color: Colors.ink3 },
  otpSection: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', ...Shadow.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  otpSectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.ink, marginBottom: 6 },
  otpSectionSub: { fontSize: 13, color: Colors.ink2, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
  otpInputRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  otpBox: { width: 46, height: 58, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.bg, fontSize: 24, fontWeight: '800', color: Colors.ink, textAlign: 'center' },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight, color: Colors.primary },
  verifyBtn: { width: '100%', backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', ...Shadow.sm },
  verifyBtnDisabled: { backgroundColor: Colors.ink3 },
  verifyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  clearBtn: { marginTop: 10, paddingVertical: 8 },
  clearBtnText: { color: Colors.ink3, fontSize: 13 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.ink3, fontWeight: '600' },
  manualCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, ...Shadow.sm },
  manualIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.gateBg, alignItems: 'center', justifyContent: 'center' },
  manualIconText: { fontSize: 11, fontWeight: '800', color: Colors.gate, letterSpacing: 0.6 },
  manualTitle: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  manualSub: { fontSize: 12, color: Colors.ink2, marginTop: 2 },
  manualArrow: { fontSize: 13, color: Colors.ink3, fontWeight: '700' },
  infoCard: { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.primaryMid },
  infoTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
  infoStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.bg2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontSize: 11, fontWeight: '700', color: Colors.ink2 },
  stepText: { fontSize: 13, color: Colors.ink2, flex: 1, lineHeight: 20 },
});
